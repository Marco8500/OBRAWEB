// Conexión con Replicate: anima una foto con un modelo abierto de imagen->video (Wan).
const fs = require('fs');
const path = require('path');

const API = 'https://api.replicate.com/v1';

const PROMPTS = {
  lujo:
    'Luxury wristwatch commercial, slow cinematic camera orbit around the watch, soft studio lighting, ' +
    'elegant light reflections gliding across the polished metal and sapphire crystal, shallow depth of field, ' +
    'premium advertising look, smooth motion, the watch design stays exactly the same',
  minimal:
    'Minimal clean product video of a wristwatch, gentle slow push-in, bright soft daylight, ' +
    'subtle shadows, calm and elegant, smooth motion, the watch design stays exactly the same',
  deportivo:
    'Dynamic sports watch commercial, energetic but smooth camera movement, dramatic rim lighting, ' +
    'crisp highlights on the bezel, high contrast, smooth motion, the watch design stays exactly the same',
};
const NEGATIVE = 'deformed watch, changing numbers, extra hands, warped dial, text, watermark, blurry, low quality';

function enabled() {
  return Boolean(process.env.REPLICATE_API_TOKEN);
}

function headers(extra = {}) {
  return { Authorization: `Bearer ${process.env.REPLICATE_API_TOKEN}`, ...extra };
}

async function check(res) {
  if (res.ok) return res.json();
  const body = await res.text();
  if (res.status === 401) throw new Error('La clave de Replicate no es válida. Revisa el archivo .env');
  if (res.status === 402) throw new Error('Tu cuenta de Replicate no tiene saldo. Agrega un método de pago.');
  throw new Error(`Replicate respondió ${res.status}: ${body.slice(0, 300)}`);
}

async function uploadFile(filePath) {
  const form = new FormData();
  form.append('content', new Blob([fs.readFileSync(filePath)]), path.basename(filePath));
  const data = await check(await fetch(`${API}/files`, { method: 'POST', headers: headers(), body: form }));
  return data.urls.get;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Devuelve la ruta del .mp4 descargado.
async function animatePhoto(imagePath, outPath, style) {
  const model = process.env.REPLICATE_MODEL || 'wan-video/wan-2.2-i2v-fast';
  const image = await uploadFile(imagePath);
  let pred = await check(
    await fetch(`${API}/models/${model}/predictions`, {
      method: 'POST',
      headers: headers({ 'Content-Type': 'application/json', Prefer: 'wait=60' }),
      body: JSON.stringify({ input: { image, prompt: PROMPTS[style], negative_prompt: NEGATIVE } }),
    })
  );
  const started = Date.now();
  while (!['succeeded', 'failed', 'canceled'].includes(pred.status)) {
    if (Date.now() - started > 10 * 60 * 1000) throw new Error('La IA tardó demasiado (más de 10 minutos).');
    await sleep(3000);
    pred = await check(await fetch(pred.urls.get, { headers: headers() }));
  }
  if (pred.status !== 'succeeded') throw new Error(`La IA no pudo crear el clip: ${pred.error || pred.status}`);
  const url = Array.isArray(pred.output) ? pred.output[0] : pred.output;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`No se pudo descargar el clip (${res.status})`);
  fs.writeFileSync(outPath, Buffer.from(await res.arrayBuffer()));
  return outPath;
}

module.exports = { enabled, animatePhoto };
