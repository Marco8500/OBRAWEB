require('dotenv').config();
const express = require('express');
const multer = require('multer');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const video = require('./src/video');
const ai = require('./src/ai');

const app = express();
const PORT = process.env.PORT || 3000;
const JOBS_DIR = path.join(__dirname, 'trabajos');
fs.mkdirSync(JOBS_DIR, { recursive: true });

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      if (!req.jobId) {
        req.jobId = crypto.randomBytes(6).toString('hex');
        fs.mkdirSync(path.join(JOBS_DIR, req.jobId), { recursive: true });
      }
      cb(null, path.join(JOBS_DIR, req.jobId));
    },
    filename: (req, file, cb) => {
      req.count = (req.count || 0) + 1;
      const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
      cb(null, file.fieldname === 'musica' ? `musica${ext}` : `foto${String(req.count).padStart(2, '0')}${ext}`);
    },
  }),
  limits: { fileSize: 25 * 1024 * 1024, files: 11 },
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'fotos' && !IMAGE_TYPES.includes(file.mimetype)) {
      return cb(new Error('Solo se aceptan fotos JPG, PNG o WEBP.'));
    }
    const audioExt = /\.(mp3|wav|m4a|aac|ogg)$/i.test(file.originalname);
    if (file.fieldname === 'musica' && !file.mimetype.startsWith('audio/') && !audioExt) {
      return cb(new Error('La música debe ser un archivo de audio (MP3, WAV, M4A).'));
    }
    cb(null, true);
  },
});

const jobs = new Map();

app.use(express.static(path.join(__dirname, 'public')));
app.use('/videos', express.static(JOBS_DIR, { index: false }));

// Contraseña opcional (APP_PASSWORD) para que solo tú puedas usar la app si está en internet.
function checkPassword(req, res, next) {
  const expected = process.env.APP_PASSWORD;
  if (!expected) return next();
  const given = Buffer.from(String(req.get('x-clave') || ''));
  const want = Buffer.from(expected);
  if (given.length === want.length && crypto.timingSafeEqual(given, want)) return next();
  res.status(401).json({ error: 'Contraseña incorrecta.' });
}

app.get('/api/config', (req, res) => {
  res.json({ ia: ai.enabled(), clave: Boolean(process.env.APP_PASSWORD), estilos: Object.keys(video.STYLES) });
});

app.post('/api/login', express.json(), (req, res, next) => {
  req.headers['x-clave'] = (req.body && req.body.clave) || '';
  checkPassword(req, res, () => res.json({ ok: true }));
});

app.use('/api/videos', checkPassword);

app.post('/api/videos', upload.fields([{ name: 'fotos', maxCount: 10 }, { name: 'musica', maxCount: 1 }]), (req, res) => {
  const fotos = (req.files && req.files.fotos) || [];
  if (fotos.length === 0) return res.status(400).json({ error: 'Sube al menos una foto del reloj.' });
  const style = video.STYLES[req.body.estilo] ? req.body.estilo : 'lujo';
  const mode = req.body.modo === 'ia' && ai.enabled() ? 'ia' : 'rapido';
  const job = { id: req.jobId, estado: 'procesando', progreso: 0, mensaje: 'Preparando…', avisos: [] };
  jobs.set(job.id, job);
  build(job, {
    fotos: fotos.map((f) => f.path),
    musica: req.files.musica ? req.files.musica[0].path : null,
    brand: (req.body.marca || '').trim().slice(0, 40),
    tagline: (req.body.frase || '').trim().slice(0, 60),
    cta: (req.body.cta || '').trim().slice(0, 50),
    style,
    mode,
  }).catch((err) => {
    console.error(err);
    Object.assign(job, { estado: 'error', mensaje: err.message });
  });
  res.json({ id: job.id });
});

app.get('/api/videos/:id', (req, res) => {
  const job = jobs.get(req.params.id);
  if (!job) return res.status(404).json({ error: 'No encontré ese video.' });
  res.json(job);
});

app.use((err, req, res, next) => {
  res.status(400).json({ error: err.message });
});

async function build(job, o) {
  const dir = path.join(JOBS_DIR, job.id);
  const n = o.fotos.length;
  const steps = n + 2;
  const step = (i, msg) => Object.assign(job, { progreso: Math.round((i / steps) * 100), mensaje: msg });

  const clips = [];
  const durations = [];
  const clipDur = o.mode === 'ia' ? 4 : n <= 3 ? 3.5 : 2.8;
  for (let i = 0; i < n; i++) {
    const out = path.join(dir, `clip${i}.mp4`);
    if (o.mode === 'ia') {
      step(i, `La IA está animando la foto ${i + 1} de ${n}… (puede tardar 1-3 minutos por foto)`);
      try {
        const raw = await ai.animatePhoto(o.fotos[i], path.join(dir, `ia${i}.mp4`), o.style);
        await video.normalizeClip(raw, out, { duration: clipDur, style: o.style });
      } catch (err) {
        job.avisos.push(`Foto ${i + 1}: ${err.message.replace(/\.?$/, '.')} Usé el modo rápido para esa foto.`);
        await video.photoToClip(o.fotos[i], out, { duration: clipDur, index: i, style: o.style });
      }
    } else {
      step(i, `Animando la foto ${i + 1} de ${n}…`);
      await video.photoToClip(o.fotos[i], out, { duration: clipDur, index: i, style: o.style });
    }
    clips.push(out);
    durations.push(clipDur);
  }

  if (o.brand || o.tagline || o.cta) {
    step(n, 'Creando la pantalla final con tu marca…');
    const card = path.join(dir, 'final.mp4');
    await video.endCard(card, dir, { brand: o.brand, tagline: o.tagline, cta: o.cta, style: o.style });
    clips.push(card);
    durations.push(video.END_CARD);
  }

  step(n + 1, 'Uniendo escenas, transiciones y música…');
  const name = `video-reloj-${job.id}.mp4`;
  const seconds = await video.assemble(clips, durations, path.join(dir, name), { musicPath: o.musica });
  Object.assign(job, {
    estado: 'listo',
    progreso: 100,
    mensaje: '¡Tu video está listo!',
    url: `/videos/${job.id}/${name}`,
    segundos: Math.round(seconds),
  });
}

// Borra los videos de más de 6 horas para no llenar el disco.
setInterval(() => {
  const limit = Date.now() - 6 * 60 * 60 * 1000;
  for (const id of fs.readdirSync(JOBS_DIR)) {
    const dir = path.join(JOBS_DIR, id);
    if (fs.statSync(dir).mtimeMs < limit) {
      fs.rmSync(dir, { recursive: true, force: true });
      jobs.delete(id);
    }
  }
}, 30 * 60 * 1000).unref();

app.listen(PORT, () => {
  console.log(`\n  ✅ OBRAWEB funcionando. Abre en tu navegador:  http://localhost:${PORT}\n`);
  console.log(ai.enabled() ? '  🤖 Modo IA activado (Replicate).\n' : '  ⚡ Modo rápido (sin clave de IA). Para la IA, revisa el README.\n');
});
