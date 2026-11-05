// Motor de video: convierte fotos (o clips de IA) en un video vertical 9:16
// con movimiento de cámara, transiciones elegantes, textos y música.
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const FFMPEG = process.env.FFMPEG_PATH || require('ffmpeg-static') || 'ffmpeg';
const FONTS_DIR = path.join(__dirname, '..', 'assets', 'fonts');

const W = 1080;
const H = 1920;
const FPS = 30;
const TRANSITION = 0.6; // segundos de cada transición
const END_CARD = 3; // segundos de la pantalla final con la marca

// Movimientos de cámara "de estudio" (suaves, con aceleración tipo ease-in-out).
const EASE = '((1-cos(PI*on/NF))/2)';
const MOTIONS = [
  { name: 'acercar', z: `1+0.14*${EASE}`, x: 'iw/2-(iw/zoom/2)', y: 'ih/2-(ih/zoom/2)' },
  { name: 'alejar', z: `1.14-0.14*${EASE}`, x: 'iw/2-(iw/zoom/2)', y: 'ih/2-(ih/zoom/2)' },
  { name: 'subir', z: '1.12', x: 'iw/2-(iw/zoom/2)', y: `(ih-ih/zoom)*(1-${EASE})` },
  { name: 'lateral', z: '1.12', x: `(iw-iw/zoom)*${EASE}`, y: 'ih/2-(ih/zoom/2)' },
];
const TRANSITIONS = ['fade', 'smoothleft', 'fadeblack', 'smoothup', 'dissolve'];

const STYLES = {
  lujo: { bg: '0x0b0b0c', accent: '0xc9a45c', text: 'white', look: 'eq=contrast=1.08:saturation=1.05:brightness=-0.01,vignette=PI/5' },
  minimal: { bg: '0xf2f0ec', accent: '0x1a1a1a', text: '0x1a1a1a', look: 'eq=contrast=1.04:saturation=0.95:brightness=0.02' },
  deportivo: { bg: '0x0a0f1a', accent: '0x3fa9ff', text: 'white', look: 'eq=contrast=1.15:saturation=1.15,unsharp=5:5:0.6,vignette=PI/6' },
};

function run(args, cwd) {
  return new Promise((resolve, reject) => {
    const p = spawn(FFMPEG, ['-hide_banner', '-loglevel', 'error', '-y', ...args], { cwd });
    let err = '';
    p.stderr.on('data', (d) => (err += d));
    p.on('error', reject);
    p.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`FFmpeg falló (${code}): ${err.slice(-800)}`))));
  });
}

// Fondo desenfocado de la misma imagen + producto centrado (sin recortar el reloj).
function composeFilter(inLabel, outW, outH) {
  return (
    `[${inLabel}]split[a][b];` +
    `[a]scale=${outW / 4}:${outH / 4}:force_original_aspect_ratio=increase,crop=${outW / 4}:${outH / 4},` +
    `gblur=sigma=12,eq=brightness=-0.18:saturation=0.8,scale=${outW}:${outH}[bg];` +
    `[b]scale=${outW}:${outH}:force_original_aspect_ratio=decrease[fg];` +
    `[bg][fg]overlay=(W-w)/2:(H-h)/2,setsar=1`
  );
}

// Una foto -> un clip con movimiento de cámara.
async function photoToClip(imagePath, outPath, { duration, index, style }) {
  const m = MOTIONS[index % MOTIONS.length];
  const frames = Math.round(duration * FPS);
  // Se compone a doble resolución para que el zoom sea suave (sin temblores).
  const filter =
    composeFilter('0:v', W * 2, H * 2) +
    `,zoompan=z='${m.z}':x='${m.x}':y='${m.y}':d=${frames}:s=${W}x${H}:fps=${FPS}` +
    `,${STYLES[style].look},format=yuv420p[v]`;
  const f = filter.replace(/NF/g, String(frames - 1));
  await run(['-i', imagePath, '-filter_complex', f, '-map', '[v]', '-frames:v', String(frames),
    '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18', '-r', String(FPS), outPath]);
}

// Un clip de IA (cualquier tamaño) -> clip vertical normalizado de duración fija.
async function normalizeClip(inPath, outPath, { duration, style }) {
  const filter =
    composeFilter('0:v', W, H) +
    `,fps=${FPS},tpad=stop_mode=clone:stop_duration=${duration},trim=duration=${duration},setpts=PTS-STARTPTS` +
    `,${STYLES[style].look},format=yuv420p[v]`;
  await run(['-i', inPath, '-filter_complex', filter, '-map', '[v]', '-an',
    '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18', '-r', String(FPS), outPath]);
}

// Pantalla final: marca + frase + llamada a la acción.
async function endCard(outPath, workDir, { brand, tagline, cta, style }) {
  const s = STYLES[style];
  fs.copyFileSync(path.join(FONTS_DIR, 'Inter-Light.otf'), path.join(workDir, 'light.otf'));
  fs.copyFileSync(path.join(FONTS_DIR, 'Inter-Regular.otf'), path.join(workDir, 'regular.otf'));
  // Los textos se dibujan con subtítulos ASS (libass): admiten tildes, ñ y animaciones de aparición.
  const assColor = (hex) => {
    const h = hex === 'white' ? 'ffffff' : hex.replace('0x', '');
    return `&H00${h.slice(4, 6)}${h.slice(2, 4)}${h.slice(0, 2)}`;
  };
  const clean = (t) => t.replace(/[{}\\]/g, '').replace(/\r?\n/g, ' ');
  const ts = (sec) => `0:00:${sec.toFixed(2).padStart(5, '0')}`;
  const end = ts(END_CARD);
  const lines = [];
  const add = (text, font, size, y, delay, spacing) => {
    if (!text) return;
    lines.push(
      `Dialogue: 0,${ts(delay)},${end},T,,0,0,0,,{\\an5\\pos(${W / 2},${Math.round(y)})\\fn${font}\\fs${size}` +
        `\\fsp${spacing}\\fad(600,0)}${clean(text)}`
    );
  };
  add(brand.toUpperCase(), 'Inter', brand.length > 20 ? 60 : brand.length > 12 ? 78 : 100, H * 0.42, 0.2, 12);
  add(tagline, 'Inter Light', 46, H * 0.42 + 170, 0.7, 2);
  add(cta, 'Inter', 40, H * 0.8, 1.2, 1);
  const ass = [
    '[Script Info]', 'ScriptType: v4.00+', `PlayResX: ${W}`, `PlayResY: ${H}`, 'WrapStyle: 0', '',
    '[V4+ Styles]',
    'Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, ' +
      'Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding',
    `Style: T,Inter,60,${assColor(s.text)},${assColor(s.text)},&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,0,0,5,60,60,0,1`,
    '', '[Events]', 'Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text', ...lines, '',
  ].join('\n');
  fs.writeFileSync(path.join(workDir, 'final.ass'), ass, 'utf8');
  const lineY = Math.round(H * 0.42 + 95);
  const line = `drawbox=x=(iw-240)/2:y=${lineY}:w=240:h=3:color=${s.accent}:t=fill:enable='gte(t,0.5)'`;
  const vf = [line, 'ass=final.ass:fontsdir=.', 'format=yuv420p'].join(',');
  await run(['-f', 'lavfi', '-i', `color=c=${s.bg}:s=${W}x${H}:d=${END_CARD}:r=${FPS}`, '-vf', vf,
    '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18', path.basename(outPath)], workDir);
}

// Une todos los clips con transiciones, añade música y exporta para redes.
async function assemble(clips, durations, outPath, { musicPath }) {
  const args = [];
  clips.forEach((c) => args.push('-i', c));
  let filter = '';
  let last = '0:v';
  let offset = 0;
  for (let i = 1; i < clips.length; i++) {
    offset += durations[i - 1] - TRANSITION;
    const t = i === clips.length - 1 ? 'fade' : TRANSITIONS[(i - 1) % TRANSITIONS.length];
    const label = `x${i}`;
    filter += `[${last}][${i}:v]xfade=transition=${t}:duration=${TRANSITION}:offset=${offset.toFixed(3)}[${label}];`;
    last = label;
  }
  const total = durations.reduce((a, b) => a + b, 0) - TRANSITION * (clips.length - 1);
  filter += `[${last}]fade=t=in:st=0:d=0.4,format=yuv420p[v]`;
  const map = ['-map', '[v]'];
  if (musicPath) {
    args.push('-stream_loop', '-1', '-i', musicPath);
    filter += `;[${clips.length}:a]atrim=duration=${total.toFixed(3)},afade=t=in:st=0:d=0.8,` +
      `afade=t=out:st=${Math.max(0, total - 1.5).toFixed(3)}:d=1.5[a]`;
    map.push('-map', '[a]', '-c:a', 'aac', '-b:a', '192k');
  }
  await run([...args, '-filter_complex', filter, ...map, '-t', total.toFixed(3),
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '19', '-profile:v', 'high', '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart', outPath]);
  return total;
}

module.exports = { photoToClip, normalizeClip, endCard, assemble, STYLES, END_CARD };
