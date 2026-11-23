// Área de clientes: cada cliente entra con su código y ve sus recursos (vídeos, guías, enlaces)
// y herramientas (enlace y QR de reseñas). Los cambios y el soporte van por WhatsApp.
import { createHash, randomBytes } from "node:crypto";

const json = (d, s = 200) => new Response(JSON.stringify(d), { status: s, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });
const txt = (v, m = 500) => (v == null ? "" : String(v).slice(0, m).trim());
const idOk = (id) => /^[a-z0-9-]{6,40}$/.test(id || "");
const nuevoId = () => Date.now().toString(36) + "-" + randomBytes(3).toString("hex");
export const PLANES = { web: "Web profesional", chatbot: "Web + asistente virtual" };

export const hashCodigo = (codigo, secret) => createHash("sha256").update(secret + "|" + String(codigo).trim().toUpperCase()).digest("hex");
function generarCodigo() {
  const abc = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; const b = randomBytes(8);
  return "CLI-" + [...b].map((x) => abc[x % abc.length]).join("");
}
function enlaceResenas(v) {
  const s = txt(v, 400); if (!s) return "";
  if (/^https:\/\//i.test(s)) return s;
  if (/^[A-Za-z0-9_-]{10,}$/.test(s)) return "https://search.google.com/local/writereview?placeid=" + s; // place_id de Google Maps
  return "";
}

// Recursos incluidos de serie (se pueden completar con los que añada el fundador)
export const RECURSOS_BASE = [
  { id: "base-resenas", tipo: "guia", titulo: "Cómo conseguir más reseñas en Google", planes: ["web", "chatbot"],
    texto: "Las reseñas son lo que más te hace subir en Google Maps y lo primero que miran tus clientes.\n\n1. Pide la reseña justo al terminar un buen trabajo, cuando el cliente está contento.\n2. Usa tu enlace o tu QR de reseñas (los tienes arriba): en un clic llegan a escribirla.\n3. Imprime el QR y ponlo en el mostrador, en la factura o en el coche de trabajo.\n4. Responde a todas las reseñas, también a las malas, con educación y en pocas palabras.\n5. Nunca pagues ni regales nada a cambio de reseñas: Google lo penaliza." },
  { id: "base-contactos", tipo: "guia", titulo: "Cómo atender a quien te escribe desde la web", planes: ["web", "chatbot"],
    texto: "Cada mensaje o llamada que llega desde la web es un cliente que ya está interesado.\n\n1. Contesta lo antes posible: quien espera horas suele llamar a otro.\n2. Si no puedes atender en ese momento, responde con un mensaje corto: «Gracias, te llamo en cuanto termine».\n3. Pregunta qué necesita y cuándo; con eso das un presupuesto mejor.\n4. Apunta de dónde vienen tus clientes nuevos: así sabrás cuánto te trae la web." },
  { id: "base-cambios", tipo: "guia", titulo: "Cómo pedir cambios en tu web", planes: ["web", "chatbot"],
    texto: "No tienes que tocar nada: escríbenos por WhatsApp con el botón de esta página.\n\nPara que sea rápido, dinos:\n• Qué quieres cambiar (texto, foto, horario, precio…).\n• Dónde está en la web (o mándanos una captura).\n• El texto o la foto nueva.\n\nLos primeros 30 días tras publicar la web, los pequeños ajustes están incluidos." },
  { id: "base-asistente", tipo: "guia", titulo: "Qué hace tu asistente virtual", planes: ["chatbot"],
    texto: "Tu asistente contesta al momento, a cualquier hora, las preguntas de siempre: horarios, servicios, precios orientativos o cómo llegar, y lleva al cliente a llamarte, escribirte o pedir cita.\n\nSi cambia algo de tu negocio (horario, servicios, precios), avísanos por WhatsApp y actualizamos lo que responde.\n\nEl primer mes está incluido; después cuesta 15 € + IVA al mes, sin permanencia." },
];

const pub = (c) => ({ id: c.id, negocio: c.negocio, contacto: c.contacto, plan: c.plan, web: c.web, resenas: c.resenas, notas: c.notas, activo: c.activo !== false, creado: c.creado, ultimoAcceso: c.ultimoAcceso || null });

async function listar(store, prefix) {
  const { blobs } = await store.list({ prefix });
  return (await Promise.all(blobs.map((b) => store.get(b.key, { type: "json" })))).filter(Boolean);
}
const recursosDe = (todos, plan) => todos.filter((r) => !r.planes?.length || r.planes.includes(plan));

// Busca el cliente por código (para el login)
export async function clientePorCodigo(store, codigo, secret) {
  const id = await store.get("clientes_codigo/" + hashCodigo(codigo, secret), { type: "text" });
  if (!id) return null;
  const c = await store.get("clientes/" + id, { type: "json" });
  return c && c.activo !== false ? c : null;
}

// Rutas del fundador: /clientes y /recursos
export async function adminClientes(req, ruta, { store, env }) {
  const m = req.method, secret = env.EQUIPO_SECRET;
  const cuerpo = m === "POST" ? await req.json().catch(() => ({})) : {};
  if (ruta[0] === "recursos") {
    if (!ruta[1] && m === "GET") return json({ recursos: await listar(store, "recursos/"), base: RECURSOS_BASE });
    const datos = () => ({ tipo: ["video", "guia", "enlace"].includes(cuerpo.tipo) ? cuerpo.tipo : "enlace", titulo: txt(cuerpo.titulo, 150),
      url: /^https:\/\//i.test(cuerpo.url || "") ? txt(cuerpo.url, 500) : "", texto: txt(cuerpo.texto, 5000),
      planes: (Array.isArray(cuerpo.planes) ? cuerpo.planes : []).filter((p) => PLANES[p]) });
    if (!ruta[1] && m === "POST") {
      const r = { id: nuevoId(), ...datos(), creado: new Date().toISOString() };
      if (!r.titulo) return json({ error: "Falta el título." }, 400);
      if (r.tipo !== "guia" && !r.url) return json({ error: "Pon un enlace que empiece por https://" }, 400);
      await store.setJSON("recursos/" + r.id, r); return json({ recurso: r });
    }
    if (ruta[1] && idOk(ruta[1])) {
      const r = await store.get("recursos/" + ruta[1], { type: "json" }); if (!r) return json({ error: "Ese recurso ya no existe." }, 404);
      if (m === "DELETE") { await store.delete("recursos/" + r.id); return json({ ok: true }); }
      if (m === "POST") { const n = { ...r, ...datos() }; await store.setJSON("recursos/" + r.id, n); return json({ recurso: n }); }
    }
    return json({ error: "Ruta no encontrada." }, 404);
  }
  // ruta[0] === "clientes"
  if (!ruta[1] && m === "GET") return json({ clientes: (await listar(store, "clientes/")).map(pub).sort((a, b) => (b.creado || "").localeCompare(a.creado || "")), planes: PLANES });
  if (!ruta[1] && m === "POST") {
    if (!txt(cuerpo.negocio)) return json({ error: "Falta el nombre del negocio." }, 400);
    const codigo = generarCodigo();
    const c = { id: nuevoId(), negocio: txt(cuerpo.negocio, 120), contacto: txt(cuerpo.contacto, 200), plan: PLANES[cuerpo.plan] ? cuerpo.plan : "web",
      web: /^https:\/\//i.test(cuerpo.web || "") ? txt(cuerpo.web, 300) : "", resenas: enlaceResenas(cuerpo.resenas), notas: txt(cuerpo.notas, 2000),
      activo: true, codigoHash: hashCodigo(codigo, secret), creado: new Date().toISOString() };
    await store.setJSON("clientes/" + c.id, c); await store.set("clientes_codigo/" + c.codigoHash, c.id);
    return json({ cliente: pub(c), codigo }); // el código solo se muestra al crearlo o regenerarlo
  }
  if (!idOk(ruta[1])) return json({ error: "Cliente no válido." }, 400);
  const c = await store.get("clientes/" + ruta[1], { type: "json", consistency: "strong" });
  if (!c) return json({ error: "Ese cliente ya no existe." }, 404);
  if (ruta[2] === "codigo" && m === "POST") {
    await store.delete("clientes_codigo/" + c.codigoHash);
    const codigo = generarCodigo(); c.codigoHash = hashCodigo(codigo, secret);
    await store.setJSON("clientes/" + c.id, c); await store.set("clientes_codigo/" + c.codigoHash, c.id);
    return json({ cliente: pub(c), codigo });
  }
  if (!ruta[2] && m === "POST") {
    if ("negocio" in cuerpo && txt(cuerpo.negocio)) c.negocio = txt(cuerpo.negocio, 120);
    if ("contacto" in cuerpo) c.contacto = txt(cuerpo.contacto, 200);
    if (PLANES[cuerpo.plan]) c.plan = cuerpo.plan;
    if ("web" in cuerpo) c.web = /^https:\/\//i.test(cuerpo.web || "") ? txt(cuerpo.web, 300) : "";
    if ("resenas" in cuerpo) c.resenas = enlaceResenas(cuerpo.resenas);
    if ("notas" in cuerpo) c.notas = txt(cuerpo.notas, 2000);
    if ("activo" in cuerpo) c.activo = !!cuerpo.activo;
    await store.setJSON("clientes/" + c.id, c); return json({ cliente: pub(c) });
  }
  if (!ruta[2] && m === "DELETE") { await store.delete("clientes_codigo/" + c.codigoHash); await store.delete("clientes/" + c.id); return json({ ok: true }); }
  return json({ error: "Ruta no encontrada." }, 404);
}

// Ruta del cliente: lo suyo y sus recursos
export async function vistaCliente(store, clienteId) {
  const c = await store.get("clientes/" + clienteId, { type: "json" });
  if (!c || c.activo === false) return json({ error: "Tu acceso no está activo. Escríbenos por WhatsApp." }, 401);
  const propios = await listar(store, "recursos/");
  const recursos = [...recursosDe(propios, c.plan).sort((a, b) => (b.creado || "").localeCompare(a.creado || "")), ...recursosDe(RECURSOS_BASE, c.plan)];
  const hoy = new Date().toISOString().slice(0, 10);
  if ((c.ultimoAcceso || "").slice(0, 10) !== hoy) { c.ultimoAcceso = new Date().toISOString(); await store.setJSON("clientes/" + c.id, c); }
  return json({ cliente: { negocio: c.negocio, plan: c.plan, planNombre: PLANES[c.plan], web: c.web, resenas: c.resenas }, recursos });
}
