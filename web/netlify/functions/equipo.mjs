// Área interna del equipo OBRAWEB.
// Acceso con código personal (variable de entorno EQUIPO_USUARIOS) y sesión firmada (EQUIPO_SECRET).
// Datos guardados en Netlify Blobs: cada lead, mensaje e informe es una clave propia.
import { getStore } from "@netlify/blobs";
import { createHmac, timingSafeEqual, randomBytes } from "node:crypto";

export const config = { path: "/api/equipo/*" };

const SESION_DIAS = 30;
const ESTADOS = 8;
const CAMPOS_LEAD = ["negocio", "sector", "telefono", "ciudad", "resenas", "web", "estado", "intentos", "ultimoContacto",
  "proximaAccion", "fechaProxima", "motivo", "servicio", "fechaVenta", "presenta", "notas", "closer", "fechaAsignacion"];

// ---------- utilidades ----------
const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }
});
const b64u = (s) => Buffer.from(s).toString("base64url");
const nuevoId = () => Date.now().toString(36) + "-" + randomBytes(4).toString("hex");
const hoy = () => new Date().toISOString().slice(0, 10);
const texto = (v, max = 500) => (v === undefined || v === null) ? "" : String(v).slice(0, max).trim();

export function usuarios(env = process.env) {
  try {
    const lista = JSON.parse(env.EQUIPO_USUARIOS || "[]");
    return lista.filter((u) => u && u.id && u.codigo && String(u.codigo).length >= 8)
      .map((u) => ({ id: String(u.id), nombre: String(u.nombre || u.id), rol: u.rol === "admin" ? "admin" : "closer", codigo: String(u.codigo) }));
  } catch { return []; }
}
const publico = (u) => ({ id: u.id, nombre: u.nombre, rol: u.rol });

function firmar(payload, secret) {
  const body = b64u(JSON.stringify(payload));
  const sig = createHmac("sha256", secret).update(body).digest("base64url");
  return body + "." + sig;
}
function verificar(token, secret) {
  if (!token || !token.includes(".")) return null;
  const [body, sig] = token.split(".");
  const esperado = createHmac("sha256", secret).update(body).digest("base64url");
  const a = Buffer.from(sig), b = Buffer.from(esperado);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const p = JSON.parse(Buffer.from(body, "base64url").toString());
    return p.exp > Date.now() ? p : null;
  } catch { return null; }
}
function igualSeguro(a, b) {
  const x = Buffer.from(String(a)), y = Buffer.from(String(b));
  return x.length === y.length && timingSafeEqual(x, y);
}

async function leerTodo(store, prefix) {
  const { blobs } = await store.list({ prefix });
  const out = [];
  for (let i = 0; i < blobs.length; i += 50) {
    const lote = await Promise.all(blobs.slice(i, i + 50).map((b) => store.get(b.key, { type: "json" })));
    out.push(...lote.filter(Boolean));
  }
  return out;
}

function limpiarLead(entrada, previo, user, todos) {
  const lead = { ...(previo || {}) };
  for (const k of CAMPOS_LEAD) if (k in entrada) lead[k] = texto(entrada[k], k === "notas" ? 2000 : 300);
  const est = parseInt(lead.estado, 10);
  lead.estado = Number.isFinite(est) && est >= 1 && est <= ESTADOS ? est : 1;
  lead.intentos = Math.max(0, Math.min(99, parseInt(lead.intentos, 10) || 0));
  const ids = todos.map((u) => u.id);
  if (user.rol !== "admin") lead.closer = user.id;           // un closer solo crea/edita lo suyo
  if (!ids.includes(lead.closer)) lead.closer = user.id;
  if (lead.presenta && !ids.includes(lead.presenta)) lead.presenta = "";
  if (!lead.fechaAsignacion) lead.fechaAsignacion = hoy();
  return lead;
}

// ---------- router (exportado para pruebas) ----------
export async function manejar(req, { store, env = process.env }) {
  const secret = env.EQUIPO_SECRET;
  const todos = usuarios(env);
  if (!secret || secret.length < 16 || todos.length === 0) return json({ error: "El área del equipo no está configurada todavía." }, 503);

  const url = new URL(req.url);
  const ruta = url.pathname.replace(/^\/api\/equipo\/?/, "").split("/").filter(Boolean);
  const metodo = req.method;
  const cuerpo = metodo === "POST" || metodo === "PUT" ? await req.json().catch(() => ({})) : {};

  // --- entrar con código ---
  if (ruta[0] === "login" && metodo === "POST") {
    const codigo = texto(cuerpo.codigo, 200);
    const u = todos.find((x) => igualSeguro(x.codigo, codigo));
    if (!u) {
      await new Promise((r) => setTimeout(r, 800)); // frena los intentos a ciegas
      return json({ error: "Código incorrecto." }, 401);
    }
    const token = firmar({ u: u.id, exp: Date.now() + SESION_DIAS * 864e5 }, secret);
    return json({ token, usuario: publico(u), equipo: todos.map(publico) });
  }

  // --- resto: sesión obligatoria ---
  const auth = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  const sesion = verificar(auth, secret);
  const user = sesion && todos.find((x) => x.id === sesion.u);
  if (!user) return json({ error: "Sesión caducada. Vuelve a entrar con tu código." }, 401);
  const esAdmin = user.rol === "admin";

  if (ruta[0] === "yo") return json({ usuario: publico(user), equipo: todos.map(publico) });

  // --- LEADS ---
  if (ruta[0] === "leads") {
    if (metodo === "GET") {
      const leads = await leerTodo(store, "leads/");
      return json({ leads: esAdmin ? leads : leads.filter((l) => l.closer === user.id || l.presenta === user.id) });
    }
    if (metodo === "POST" && ruta[1] === "importar") {
      if (!esAdmin) return json({ error: "Solo el fundador puede importar leads." }, 403);
      const filas = Array.isArray(cuerpo.leads) ? cuerpo.leads.slice(0, 500) : [];
      const creados = [];
      for (const f of filas) {
        if (!texto(f.negocio)) continue;
        const lead = limpiarLead({ ...f, estado: 1 }, null, user, todos);
        lead.id = nuevoId(); lead.creado = new Date().toISOString(); lead.actualizado = lead.creado;
        await store.setJSON("leads/" + lead.id, lead);
        creados.push(lead);
      }
      return json({ creados: creados.length });
    }
    if (metodo === "POST") {
      const id = texto(cuerpo.id, 60);
      let previo = null;
      if (id) {
        if (!/^[a-z0-9-]+$/.test(id)) return json({ error: "Lead no válido." }, 400);
        previo = await store.get("leads/" + id, { type: "json", consistency: "strong" });
        if (!previo) return json({ error: "Ese lead ya no existe." }, 404);
        if (!esAdmin && previo.closer !== user.id && previo.presenta !== user.id) return json({ error: "Ese lead no es tuyo." }, 403);
      }
      if (!texto(cuerpo.negocio || previo?.negocio)) return json({ error: "Falta el nombre del negocio." }, 400);
      const entrada = { ...cuerpo };
      if (previo && !esAdmin) entrada.closer = previo.closer; // no puede reasignarse un lead
      const lead = limpiarLead(entrada, previo, user, todos);
      if (previo && !esAdmin && previo.closer !== user.id) lead.closer = previo.closer;
      lead.id = id || nuevoId();
      lead.creado = previo?.creado || new Date().toISOString();
      lead.actualizado = new Date().toISOString();
      lead.actualizadoPor = user.id;
      await store.setJSON("leads/" + lead.id, lead);
      return json({ lead });
    }
    if (metodo === "DELETE" && ruta[1]) {
      if (!esAdmin) return json({ error: "Solo el fundador puede borrar leads." }, 403);
      if (!/^[a-z0-9-]+$/.test(ruta[1])) return json({ error: "Lead no válido." }, 400);
      await store.delete("leads/" + ruta[1]);
      return json({ ok: true });
    }
  }

  // --- GRUPO (chat de los tres) ---
  if (ruta[0] === "chat") {
    if (metodo === "GET") {
      const desde = texto(url.searchParams.get("desde"), 40);
      const { blobs } = await store.list({ prefix: "chat/" });
      let claves = blobs.map((b) => b.key).sort();
      claves = desde ? claves.filter((k) => k > "chat/" + desde) : claves.slice(-150);
      const mensajes = (await Promise.all(claves.map((k) => store.get(k, { type: "json" })))).filter(Boolean);
      return json({ mensajes });
    }
    if (metodo === "POST") {
      const t = texto(cuerpo.texto, 2000);
      if (!t) return json({ error: "El mensaje está vacío." }, 400);
      const id = new Date().toISOString().replace(/[:.]/g, "-") + "_" + randomBytes(3).toString("hex");
      const m = { id, autor: user.id, nombre: user.nombre, texto: t, fecha: new Date().toISOString() };
      await store.setJSON("chat/" + id, m);
      return json({ mensaje: m });
    }
  }

  // --- INFORME DIARIO ---
  if (ruta[0] === "informes") {
    if (metodo === "GET") {
      const inf = await leerTodo(store, "informes/");
      return json({ informes: esAdmin ? inf : inf.filter((i) => i.closer === user.id) });
    }
    if (metodo === "POST") {
      const fecha = /^\d{4}-\d{2}-\d{2}$/.test(cuerpo.fecha) ? cuerpo.fecha : hoy();
      const n = (v) => Math.max(0, Math.min(9999, parseInt(v, 10) || 0));
      const inf = { fecha, closer: user.id, llamadas: n(cuerpo.llamadas), conversaciones: n(cuerpo.conversaciones),
        muestrasAgendadas: n(cuerpo.muestrasAgendadas), muestrasPresentadas: n(cuerpo.muestrasPresentadas),
        ventas: n(cuerpo.ventas), bloqueo: texto(cuerpo.bloqueo, 600), actualizado: new Date().toISOString() };
      await store.setJSON(`informes/${fecha}_${user.id}`, inf);
      return json({ informe: inf });
    }
  }

  return json({ error: "Ruta no encontrada." }, 404);
}

export default async (req) => {
  try {
    return await manejar(req, { store: getStore({ name: "equipo", consistency: "strong" }) });
  } catch (e) {
    console.error(e);
    return json({ error: "Error del servidor. Inténtalo de nuevo en un momento." }, 500);
  }
};
