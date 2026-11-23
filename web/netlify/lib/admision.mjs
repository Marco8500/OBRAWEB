// Módulo de admisión de candidatos (solo fundador): rúbricas por rol, puntuación,
// subida de MP3 por trozos, transcripción y evaluación con Claude.
import Anthropic from "@anthropic-ai/sdk";

export const UMBRAL = 70; // % mínimo para "apto" (además de cumplir todos los imprescindibles)
export const MAX_AUDIO = 20 * 1024 * 1024;

// peso 1–3 · imp = imprescindible
export const RUBRICAS = {
  setter: { nombre: "Setter (llamadas en frío)",
    descripcion: "Llama en frío a negocios, habla con quien decide y cierra una cita con día y hora para enseñarle una muestra de su web. No vende ni habla de precio.",
    criterios: [
      { id: "rechazo", texto: "Aguanta el rechazo sin venirse abajo", peso: 3, imp: true },
      { id: "voz", texto: "Voz clara y trato natural, no suena a teleoperador", peso: 3, imp: true },
      { id: "disciplina", texto: "Puede hacer bloques de 2 h de llamadas con constancia", peso: 3, imp: true },
      { id: "horario", texto: "Disponible en horario comercial (10–13 h y 16:30–19 h)", peso: 2, imp: true },
      { id: "cita", texto: "En el roleplay consigue cerrar día y hora", peso: 3, imp: false },
      { id: "guion", texto: "Sigue un guion y lo adapta con naturalidad", peso: 2, imp: false },
      { id: "orden", texto: "Ordenado: apunta lo que hace", peso: 2, imp: false },
      { id: "promesas", texto: "No promete cosas ni habla de precio por su cuenta", peso: 2, imp: false },
      { id: "experiencia", texto: "Experiencia en atención al público o teleoperación", peso: 1, imp: false },
    ] },
  closer: { nombre: "Closer (presenta y cierra)",
    descripcion: "Presenta la muestra de la web en una llamada de 15 minutos, conecta la web con el dinero del cliente, da el precio cerrado (450/550 € + IVA, sin descuentos), resuelve objeciones y cobra el anticipo en la misma llamada.",
    criterios: [
      { id: "escucha", texto: "Escucha y hace preguntas antes de hablar", peso: 3, imp: true },
      { id: "pide", texto: "Pide el dinero sin miedo ni rodeos", peso: 3, imp: true },
      { id: "precio", texto: "Defiende el precio sin ofrecer descuentos", peso: 3, imp: true },
      { id: "objeciones", texto: "Maneja objeciones con calma y argumentos", peso: 3, imp: false },
      { id: "silencio", texto: "Aguanta el silencio después de dar el precio", peso: 2, imp: false },
      { id: "claro", texto: "Explica la web sin tecnicismos", peso: 2, imp: false },
      { id: "seguimiento", texto: "Cierra siempre con un siguiente paso y fecha", peso: 2, imp: false },
      { id: "experiencia", texto: "Experiencia vendiendo servicios", peso: 1, imp: false },
      { id: "pantalla", texto: "Se maneja compartiendo pantalla y enseñando una web", peso: 1, imp: false },
    ] },
  developer: { nombre: "Developer (producción de webs)",
    descripcion: "Produce webs para pequeños negocios a partir de plantillas, en 2–3 horas por web, con buen gusto y adaptadas al móvil, cumpliendo plazos y tratando con clientes sin tecnicismos.",
    criterios: [
      { id: "portfolio", texto: "Portfolio con webs reales para negocios", peso: 3, imp: true },
      { id: "rapidez", texto: "Rápido con plantillas (una web en 2–3 h)", peso: 3, imp: true },
      { id: "gusto", texto: "Buen gusto visual y diseño pensado para móvil", peso: 3, imp: true },
      { id: "plazos", texto: "Cumple plazos y es responsable", peso: 3, imp: true },
      { id: "clientes", texto: "Trata con clientes sin tecnicismos", peso: 2, imp: false },
      { id: "escritura", texto: "Escribe bien en español", peso: 2, imp: false },
      { id: "tecnica", texto: "Domina HTML/CSS (Tailwind) o herramientas equivalentes", peso: 2, imp: false },
      { id: "prueba", texto: "Ha superado una web de prueba pagada", peso: 2, imp: false },
      { id: "modelo", texto: "Acepta empezar cobrando por web", peso: 1, imp: false },
    ] },
};

export function puntuar(c) {
  const r = RUBRICAS[c.rol]; if (!r) return { puntuacion: 0, apto: false, faltan: [] };
  const total = r.criterios.reduce((s, k) => s + k.peso, 0);
  const ok = r.criterios.filter((k) => c.checks?.[k.id]);
  const puntuacion = Math.round((100 * ok.reduce((s, k) => s + k.peso, 0)) / total);
  const faltan = r.criterios.filter((k) => k.imp && !c.checks?.[k.id]).map((k) => k.texto);
  return { puntuacion, apto: puntuacion >= UMBRAL && faltan.length === 0, faltan };
}

const json = (d, s = 200) => new Response(JSON.stringify(d), { status: s, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });
const txt = (v, m = 500) => (v == null ? "" : String(v).slice(0, m).trim());
const idOk = (id) => /^[a-z0-9-]{6,40}$/.test(id || "");

async function leerAudio(store, c) {
  const partes = [];
  for (let i = 0; i < (c.audio?.partes || 0); i++) {
    const b = await store.get(`audio/${c.id}/${String(i).padStart(3, "0")}`, { type: "arrayBuffer" });
    if (!b) throw new Error("Falta un trozo del audio. Vuelve a subirlo.");
    partes.push(new Uint8Array(b));
  }
  return partes;
}
async function borrarAudio(store, c) {
  const { blobs } = await store.list({ prefix: `audio/${c.id}/` });
  await Promise.all(blobs.map((b) => store.delete(b.key)));
}

// Por defecto, Groq (plan gratuito, API compatible con OpenAI). Basta con GROQ_API_KEY.
const GROQ = "https://api.groq.com/openai/v1";
async function transcribir(partes, env) {
  const key = env.GROQ_API_KEY || env.STT_API_KEY; if (!key) throw new Error("Falta configurar GROQ_API_KEY en Netlify (clave gratuita de console.groq.com).");
  const base = (env.STT_BASE_URL || GROQ).replace(/\/$/, "");
  const fd = new FormData();
  fd.append("file", new Blob(partes, { type: "audio/mpeg" }), "audio.mp3");
  fd.append("model", env.STT_MODEL || "whisper-large-v3-turbo");
  fd.append("language", "es");
  fd.append("response_format", "text");
  const r = await fetch(base + "/audio/transcriptions", { method: "POST", headers: { authorization: "Bearer " + key }, body: fd });
  if (r.status === 429) throw new Error("Has llegado al límite gratuito de transcripción por ahora. Prueba más tarde.");
  if (!r.ok) throw new Error("El servicio de transcripción ha devuelto un error (" + r.status + "). Revisa la clave GROQ_API_KEY.");
  return (await r.text()).trim();
}

const ESQUEMA = {
  type: "object", additionalProperties: false,
  required: ["criterios", "resumen", "puntos_fuertes", "a_mejorar", "recomendacion"],
  properties: {
    criterios: { type: "array", items: { type: "object", additionalProperties: false, required: ["id", "cumple", "evidencia"],
      properties: { id: { type: "string" }, cumple: { type: "boolean" }, evidencia: { type: "string" } } } },
    resumen: { type: "string" },
    puntos_fuertes: { type: "array", items: { type: "string" } },
    a_mejorar: { type: "array", items: { type: "string" } },
    recomendacion: { type: "string", enum: ["apto", "dudoso", "no_apto"] },
  },
};

function instrucciones(r) {
  return `Eres la persona responsable de selección de OBRAWEB, una empresa que vende páginas web (450 € y 550 € + IVA) a pequeños negocios locales en España.
Vas a evaluar a un candidato para el puesto: ${r.nombre}. ${r.descripcion}
Recibirás la transcripción de una grabación (entrevista, roleplay o llamada). Evalúa SOLO con lo que se oye en la transcripción:
- "cumple" es true únicamente si hay evidencia clara en la transcripción. Si no hay información suficiente, false y evidencia "Sin evidencia en la grabación".
- "evidencia": una cita breve (máximo 25 palabras) o una descripción concreta de lo que dijo o hizo.
- No inventes datos que no aparezcan. No valores el aspecto físico, la edad, el origen ni nada ajeno al puesto.
- Resumen de 3–5 frases, directo y útil para decidir. Escribe en español.`;
}
function mensaje(c, r) {
  const lista = r.criterios.map((k) => `- ${k.id}: ${k.texto}${k.imp ? " (imprescindible)" : ""}`).join("\n");
  return `Criterios (usa estos id exactos):\n${lista}\n\nNotas del fundador sobre el candidato: ${c.notas || "(ninguna)"}\n\nTranscripción:\n"""\n${(c.transcripcion || "").slice(0, 60000)}\n"""`;
}
function limpiar(out, r) {
  const ids = new Set(r.criterios.map((k) => k.id));
  out.criterios = (Array.isArray(out.criterios) ? out.criterios : []).filter((k) => k && ids.has(k.id)).map((k) => ({ id: k.id, cumple: k.cumple === true, evidencia: String(k.evidencia || "").slice(0, 300) }));
  out.resumen = String(out.resumen || ""); out.puntos_fuertes = (out.puntos_fuertes || []).map(String); out.a_mejorar = (out.a_mejorar || []).map(String);
  if (!["apto", "dudoso", "no_apto"].includes(out.recomendacion)) out.recomendacion = "dudoso";
  return out;
}

// Gratis: modelo abierto en Groq (API compatible con OpenAI) con salida JSON
async function evaluarGratis(c, env) {
  const key = env.GROQ_API_KEY || env.IA_API_KEY || env.STT_API_KEY;
  if (!key) throw new Error("Falta configurar GROQ_API_KEY en Netlify (clave gratuita de console.groq.com).");
  const r = RUBRICAS[c.rol];
  const formato = `Responde SOLO con un objeto JSON con esta forma exacta:
{"criterios":[{"id":"<id>","cumple":true|false,"evidencia":"..."}],"resumen":"...","puntos_fuertes":["..."],"a_mejorar":["..."],"recomendacion":"apto"|"dudoso"|"no_apto"}
Incluye un elemento en "criterios" por cada id de la lista.`;
  const res = await fetch((env.IA_BASE_URL || env.STT_BASE_URL || GROQ).replace(/\/$/, "") + "/chat/completions", {
    method: "POST", headers: { authorization: "Bearer " + key, "content-type": "application/json" },
    body: JSON.stringify({ model: env.IA_MODEL || "llama-3.3-70b-versatile", temperature: 0.2, response_format: { type: "json_object" },
      messages: [{ role: "system", content: instrucciones(r) + "\n" + formato }, { role: "user", content: mensaje(c, r) }] }),
  });
  if (res.status === 429) throw new Error("Has llegado al límite gratuito de la IA por ahora. Prueba más tarde.");
  if (!res.ok) throw new Error("La IA ha devuelto un error (" + res.status + "). Revisa la clave GROQ_API_KEY o el modelo IA_MODEL.");
  const d = await res.json();
  let out; try { out = JSON.parse(d.choices?.[0]?.message?.content || ""); } catch { throw new Error("La evaluación no ha llegado bien. Inténtalo de nuevo."); }
  return limpiar(out, r);
}

async function evaluar(c, env) {
  if (!env.ANTHROPIC_API_KEY) return evaluarGratis(c, env);   // sin clave de Claude → opción gratuita
  const r = RUBRICAS[c.rol];
  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY, timeout: 50_000, maxRetries: 0 });
  const system = instrucciones(r);
  const res = await client.beta.messages.create({
    model: "claude-opus-5-5",
    max_tokens: 8000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort: "low", format: { type: "json_schema", schema: ESQUEMA } },
    system,
    messages: [{ role: "user", content: mensaje(c, r) }],
  });
  if (res.stop_reason === "refusal") throw new Error("La IA no ha podido evaluar esta grabación. Evalúa a mano.");
  const t = res.content.filter((b) => b.type === "text").map((b) => b.text).join("");
  let out; try { out = JSON.parse(t); } catch { throw new Error("La evaluación no ha llegado completa. Inténtalo de nuevo."); }
  return limpiar(out, r);
}

// Router: se llama desde equipo.mjs con el usuario ya autenticado como fundador
export async function admision(req, ruta, { store, env, user }) {
  const url = new URL(req.url), m = req.method;
  const conPuntos = (c) => ({ ...c, ...puntuar(c) });
  if (!ruta[1]) {
    if (m === "GET") {
      const { blobs } = await store.list({ prefix: "candidatos/" });
      const cs = (await Promise.all(blobs.map((b) => store.get(b.key, { type: "json" })))).filter(Boolean).map(conPuntos);
      return json({ candidatos: cs.sort((a, b) => (b.creado || "").localeCompare(a.creado || "")), rubricas: RUBRICAS, umbral: UMBRAL });
    }
    if (m === "POST") {
      const b = await req.json().catch(() => ({}));
      if (!RUBRICAS[b.rol]) return json({ error: "Elige un rol: setter, closer o developer." }, 400);
      if (!txt(b.nombre)) return json({ error: "Falta el nombre del candidato." }, 400);
      const c = { id: Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8), nombre: txt(b.nombre, 120), contacto: txt(b.contacto, 200),
        rol: b.rol, notas: txt(b.notas, 3000), checks: {}, consentimiento: !!b.consentimiento, decision: "en proceso",
        creado: new Date().toISOString(), actualizado: new Date().toISOString(), creadoPor: user.id };
      await store.setJSON("candidatos/" + c.id, c);
      return json({ candidato: conPuntos(c) });
    }
  }
  const id = ruta[1]; if (!idOk(id)) return json({ error: "Candidato no válido." }, 400);
  const c = await store.get("candidatos/" + id, { type: "json", consistency: "strong" });
  if (!c) return json({ error: "Ese candidato ya no existe." }, 404);
  const guardar = async () => { c.actualizado = new Date().toISOString(); await store.setJSON("candidatos/" + id, c); return json({ candidato: conPuntos(c) }); };

  if (!ruta[2] && m === "POST") { // editar checks, notas, decisión
    const b = await req.json().catch(() => ({}));
    if (b.checks && typeof b.checks === "object") { const ids = RUBRICAS[c.rol].criterios.map((k) => k.id); c.checks = Object.fromEntries(ids.filter((k) => b.checks[k]).map((k) => [k, true])); }
    for (const k of ["nombre", "contacto", "notas"]) if (k in b) c[k] = txt(b[k], k === "notas" ? 3000 : 200);
    if ("consentimiento" in b) c.consentimiento = !!b.consentimiento;
    if (["en proceso", "contratado", "descartado"].includes(b.decision)) c.decision = b.decision;
    return guardar();
  }
  if (!ruta[2] && m === "DELETE") { await borrarAudio(store, c); await store.delete("candidatos/" + id); return json({ ok: true }); }

  if (ruta[2] === "audio") {
    if (m === "PUT") { // trozo binario ?parte=i&total=n&nombre=x
      if (!c.consentimiento) return json({ error: "Marca antes que el candidato ha dado su consentimiento para grabar y analizar el audio." }, 400);
      const i = parseInt(url.searchParams.get("parte"), 10), n = parseInt(url.searchParams.get("total"), 10);
      if (!(n >= 1 && n <= 10 && i >= 0 && i < n)) return json({ error: "Trozo no válido." }, 400);
      const buf = await req.arrayBuffer();
      if (buf.byteLength === 0 || buf.byteLength > 4 * 1024 * 1024) return json({ error: "Trozo demasiado grande." }, 400);
      if (i === 0) { await borrarAudio(store, c); c.transcripcion = ""; c.ia = null; }
      await store.set(`audio/${id}/${String(i).padStart(3, "0")}`, buf);
      const prev = i === 0 ? 0 : (c.audio?.bytes || 0);
      c.audio = { nombre: txt(url.searchParams.get("nombre"), 120) || "audio.mp3", partes: n, bytes: prev + buf.byteLength, completo: i === n - 1, subido: new Date().toISOString() };
      if (c.audio.bytes > MAX_AUDIO) { await borrarAudio(store, c); c.audio = null; await guardar(); return json({ error: "El audio supera 20 MB." }, 400); }
      return guardar();
    }
    if (m === "GET") {
      if (!c.audio?.completo) return json({ error: "No hay audio." }, 404);
      // Se envía en flujo (streaming): una respuesta normal no puede pasar de 6 MB
      let i = 0; const n = c.audio.partes;
      const stream = new ReadableStream({ async pull(ctrl) {
        if (i >= n) return ctrl.close();
        const b = await store.get(`audio/${id}/${String(i++).padStart(3, "0")}`, { type: "arrayBuffer" });
        if (!b) return ctrl.error(new Error("Falta un trozo del audio"));
        ctrl.enqueue(new Uint8Array(b));
      } });
      return new Response(stream, { headers: { "content-type": "audio/mpeg", "cache-control": "no-store" } });
    }
    if (m === "DELETE") { await borrarAudio(store, c); c.audio = null; return guardar(); }
  }
  if (ruta[2] === "transcribir" && m === "POST") {
    if (!c.audio?.completo) return json({ error: "Sube primero el MP3." }, 400);
    try { c.transcripcion = await transcribir(await leerAudio(store, c), env); } catch (e) { return json({ error: e.message }, 502); }
    return guardar();
  }
  if (ruta[2] === "evaluar" && m === "POST") {
    if (!txt(c.transcripcion)) return json({ error: "No hay transcripción todavía." }, 400);
    let ia; try { ia = await evaluar(c, env); } catch (e) { console.error(e); return json({ error: e.message || "No se ha podido evaluar." }, 502); }
    c.ia = { ...ia, fecha: new Date().toISOString() };
    // Se suman a lo que ya hubieras marcado a mano (la IA no te quita casillas)
    c.checks = { ...(c.checks || {}), ...Object.fromEntries(ia.criterios.filter((k) => k.cumple).map((k) => [k.id, true])) };
    return guardar();
  }
  return json({ error: "Ruta no encontrada." }, 404);
}
