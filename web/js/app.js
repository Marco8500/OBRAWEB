/* OBRAWEB · comportamiento de la web pública (sin librerías) */
(function () {
  "use strict";
  var d = document, w = window, D = w.DATOS || {};
  var $ = function (s, c) { return (c || d).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); };
  var quieto = w.matchMedia && w.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var tactil = w.matchMedia && w.matchMedia("(hover: none)").matches;

  /* ---------- datos de contacto (datos.js) ---------- */
  var tel = (D.telefono || "").replace(/\s/g, ""), wa = (D.whatsapp || "").replace(/\D/g, "");
  var WA_MSG = "Hola, vengo de vuestra web y me gustaría pedir información";
  $$("[data-wa]").forEach(function (a) { a.href = "https://wa.me/" + (wa || "34641409181") + "?text=" + encodeURIComponent(WA_MSG); });
  $$("[data-tel]").forEach(function (a) { if (tel) a.href = "tel:" + tel; else a.parentNode.removeChild(a); });
  $$("[data-tel-text]").forEach(function (e) { e.textContent = D.telefono ? "Teléfono · " + D.telefono : ""; });
  $$("[data-email]").forEach(function (a) { if (D.email) a.href = "mailto:" + D.email; else a.parentNode.removeChild(a); });
  $$("[data-email-text]").forEach(function (e) { e.textContent = D.email || ""; });

  /* ---------- trabajos: enlaces y capturas largas ---------- */
  var P = D.portfolio || {}, C = D.capturas || {};
  $$("[data-port]").forEach(function (a) { var u = P[a.getAttribute("data-port")]; if (u) { a.href = u; a.hidden = false; } });
  $$("[data-port-url]").forEach(function (s) { var u = P[s.getAttribute("data-port-url")]; if (u) s.textContent = u.replace(/^https?:\/\//, "").replace(/\/$/, ""); });
  $$("img[data-larga]").forEach(function (img) {
    var src = C[img.getAttribute("data-larga")]; if (!src) return;
    var larga = new Image(); larga.alt = img.alt; larga.className = "larga"; larga.loading = "lazy"; larga.decoding = "async";
    larga.onload = function () {
      var vista = img.parentNode; vista.replaceChild(larga, img);
      var pista = d.createElement("span"); pista.className = "pista"; pista.textContent = tactil ? "Se desliza sola" : "Pasa el ratón"; vista.appendChild(pista);
      medir(); w.addEventListener("resize", medir);
      function medir() { var dist = Math.max(0, larga.offsetHeight - vista.offsetHeight); vista.style.setProperty("--dist", dist + "px"); vista.style.setProperty("--dur", Math.min(12, Math.max(3, dist / 220)) + "s"); }
    };
    larga.src = src;
  });

  /* ---------- opiniones reales (datos.js) ---------- */
  var O = D.opiniones || [];
  if (O.length) {
    var caja = $("#opiniones-lista");
    O.forEach(function (o) {
      var f = d.createElement("figure"); f.className = "opinion";
      var q = d.createElement("blockquote"); q.textContent = "«" + o.texto + "»";
      var c = d.createElement("figcaption"); c.textContent = o.nombre + (o.negocio ? " · " + o.negocio : "");
      f.appendChild(q); f.appendChild(c); caja.appendChild(f);
    });
    $("#opiniones").hidden = false;
  }

  /* ---------- cabecera y menú móvil ---------- */
  var top = $("#top"), hamb = $("#hamb"), mm = $("#menu-movil"), barra = $("#barra-movil");
  function menu(abrir) {
    mm.classList.toggle("abierto", abrir); hamb.setAttribute("aria-expanded", abrir);
    hamb.setAttribute("aria-label", abrir ? "Cerrar menú" : "Abrir menú");
    hamb.querySelector("use").setAttribute("href", abrir ? "#i-x" : "#i-menu");
  }
  hamb.addEventListener("click", function () { menu(!mm.classList.contains("abierto")); });
  $$("a", mm).forEach(function (a) { a.addEventListener("click", function () { menu(false); }); });
  d.addEventListener("keydown", function (e) { if (e.key === "Escape") menu(false); });

  /* ---------- aparición al desplazar ---------- */
  if ("IntersectionObserver" in w && !quieto) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -8% 0px", threshold: .08 });
    $$(".rev").forEach(function (el) { io.observe(el); });
  } else { $$(".rev").forEach(function (el) { el.classList.add("in"); }); }
  requestAnimationFrame(function () { d.body.classList.add("listo"); });

  /* ---------- efectos ligados al desplazamiento ---------- */
  var port = $("#portatil"), mov = $("#movil"), pasos = $("#pasos"), contacto = $("#contacto"), pendiente = false;
  function alDesplazar() {
    pendiente = false;
    var y = w.scrollY, vh = w.innerHeight;
    top.classList.toggle("scroll", y > 10);
    if (barra) { var c = contacto.getBoundingClientRect(); barra.classList.toggle("ve", y > vh * .7 && !(c.top < vh && c.bottom > 0)); }
    if (quieto) return;
    if (port) { var p = Math.min(1, y / (vh * .9)); port.style.setProperty("--rx", (10 - p * 10) + "deg"); port.style.setProperty("--ry", (-14 + p * 12) + "deg"); mov.style.setProperty("--my", (-p * 40) + "px"); }
    if (pasos) {
      var r = pasos.getBoundingClientRect(), prog = Math.min(1, Math.max(0, (vh * .75 - r.top) / (r.height * .9)));
      pasos.style.setProperty("--p", prog.toFixed(3));
      $$(".paso", pasos).forEach(function (el, i, todos) { el.classList.toggle("on", prog >= (todos.length > 1 ? i / (todos.length - 1) : 0) * .98); });
    }
  }
  w.addEventListener("scroll", function () { if (!pendiente) { pendiente = true; requestAnimationFrame(alDesplazar); } }, { passive: true });
  w.addEventListener("resize", alDesplazar); alDesplazar();
  if (quieto && pasos) { pasos.style.setProperty("--p", 1); $$(".paso", pasos).forEach(function (el) { el.classList.add("on"); }); }

  /* ---------- trabajos: inclinación 3D y deslizado automático en móvil ---------- */
  $$(".trabajo").forEach(function (t) {
    var inn = $(".trabajo-in", t);
    if (!tactil && !quieto) {
      t.addEventListener("pointermove", function (e) {
        var r = t.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, yy = (e.clientY - r.top) / r.height - .5;
        inn.style.setProperty("--ty", (x * 7).toFixed(2) + "deg"); inn.style.setProperty("--tx", (-yy * 5).toFixed(2) + "deg");
      });
      t.addEventListener("pointerleave", function () { inn.style.setProperty("--ty", "0deg"); inn.style.setProperty("--tx", "0deg"); });
    }
  });
  if (tactil && "IntersectionObserver" in w && !quieto) {
    var ioT = new IntersectionObserver(function (es) {
      es.forEach(function (e) { e.target.classList.toggle("auto", e.isIntersecting); });
    }, { threshold: .6 });
    $$(".trabajo").forEach(function (t) { ioT.observe(t); });
  }

  /* ---------- antes / después ---------- */
  var ad = $("#ad"), rango = $("#ad-rango");
  if (ad && rango) {
    var poner = function (v) { ad.style.setProperty("--pos", v + "%"); };
    rango.addEventListener("input", function () { poner(rango.value); });
    // pequeña demostración al aparecer, para que se entienda que se puede mover
    if ("IntersectionObserver" in w && !quieto) {
      var ioA = new IntersectionObserver(function (es) {
        if (!es[0].isIntersecting) return; ioA.disconnect();
        var t0 = null;
        (function anim(t) {
          if (!t0) t0 = t; var k = Math.min(1, (t - t0) / 1800);
          var v = 50 + Math.sin(k * Math.PI * 2) * 22 * (1 - k);
          if (d.activeElement !== rango) { poner(v.toFixed(1)); rango.value = v; }
          if (k < 1) requestAnimationFrame(anim);
        })(performance.now());
      }, { threshold: .5 });
      ioA.observe(ad);
    }
  }

  /* ---------- demo del asistente ---------- */
  var demo = $("#chat-demo");
  if (demo) {
    var guion = [["cli", "Hola, ¿abrís el sábado?"], ["bot", "¡Hola! Los sábados abrimos de 9:00 a 13:00. ¿Quieres que te guarde hueco para revisar tu coche?"], ["cli", "Sí, para cambiar el aceite"], ["bot", "Perfecto. Déjame tu nombre y teléfono y el taller te confirma la cita hoy mismo."]];
    var cabDemo = demo.firstElementChild, corriendo = false;
    var esperar = function (ms) { return new Promise(function (r) { setTimeout(r, quieto ? 0 : ms); }); };
    var burbuja = function (quien, html) { var b = d.createElement("div"); b.className = "burb " + quien; b.innerHTML = html; demo.appendChild(b); requestAnimationFrame(function () { requestAnimationFrame(function () { b.classList.add("ve"); }); }); return b; };
    var correr = function () {
      if (corriendo) return; corriendo = true;
      $$(".burb", demo).forEach(function (b) { b.remove(); });
      var p = Promise.resolve();
      guion.forEach(function (m) {
        p = p.then(function () {
          if (m[0] === "bot") { var e = burbuja("bot", '<span class="escribe"><i></i><i></i><i></i></span>'); return esperar(1100).then(function () { e.textContent = m[1]; return esperar(1400); }); }
          burbuja("cli", ""); demo.lastChild.textContent = m[1]; return esperar(900);
        });
      });
      p.then(function () { return esperar(5000); }).then(function () { corriendo = false; if (visible) correr(); });
    };
    var visible = false;
    if ("IntersectionObserver" in w) {
      new IntersectionObserver(function (es) { visible = es[0].isIntersecting; if (visible) correr(); }, { threshold: .4 }).observe(demo);
    } else { correr(); }
    void cabDemo;
  }

  /* ---------- chatbot (Make) ---------- */
  (function () {
    var URL = ("chatbot" in D) ? D.chatbot : "https://hook.eu1.make.com/q2jyemzfefyl8rh8bmk6ivt72bwd1ard";
    var btn = $("#chat-btn"), panel = $("#chat-panel"), log = $("#chat-log"), form = $("#chat-form"), input = $("#chat-input"), teaser = $("#chat-teaser");
    var HOLA = "¡Hola! Soy el asistente virtual de OBRAWEB. Si tienes alguna duda, pregúntame.", hist = [], ocupado = false;
    if (!URL) { [btn, panel, teaser].forEach(function (e) { e.parentNode.removeChild(e); }); return; }
    function msg(texto, quien) { var b = d.createElement("div"); b.className = "msg " + quien; b.textContent = texto; log.appendChild(b); log.scrollTop = log.scrollHeight; return b; }
    function abrir(o) {
      panel.hidden = !o; btn.setAttribute("aria-expanded", o); teaser.hidden = true;
      if (o) { if (!log.children.length) msg(HOLA, "bot"); input.focus(); }
    }
    btn.addEventListener("click", function () { abrir(panel.hidden); });
    $("#chat-close").addEventListener("click", function () { abrir(false); btn.focus(); });
    $("#chat-teaser-close").addEventListener("click", function (e) { e.stopPropagation(); teaser.hidden = true; try { sessionStorage.setItem("chatTeaser", "1"); } catch (x) {} });
    teaser.addEventListener("click", function () { abrir(true); });
    d.addEventListener("keydown", function (e) { if (e.key === "Escape" && !panel.hidden) abrir(false); });
    var visto = false; try { visto = sessionStorage.getItem("chatTeaser") === "1"; } catch (x) {}
    if (!visto) setTimeout(function () { if (panel.hidden) { teaser.hidden = false; try { sessionStorage.setItem("chatTeaser", "1"); } catch (x) {} } }, 6000);
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var m = input.value.trim(); if (!m || ocupado) return;
      ocupado = true; input.value = ""; msg(m, "user");
      var espera = msg("Escribiendo…", "bot"); espera.classList.add("esperando");
      var cuerpo = new URLSearchParams({ message: m, history: hist.slice(-10).join("\n") }).toString();
      fetch(URL, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: cuerpo })
        .then(function (r) { if (!r.ok) throw new Error(r.status); return r.text(); })
        .then(function (t) { t = (t || "").trim(); if (!t || t === "Accepted") throw new Error("vacío"); espera.remove(); msg(t, "bot"); hist.push("Cliente: " + m, "Asistente: " + t); })
        .catch(function () {
          espera.remove();
          var b = msg("Ahora mismo no puedo responder. Escríbenos por WhatsApp y te contestamos enseguida: ", "bot"), a = d.createElement("a");
          a.href = $("[data-wa]").href; a.target = "_blank"; a.rel = "noopener"; a.textContent = "abrir WhatsApp"; b.appendChild(a);
        })
        .then(function () { ocupado = false; input.focus(); });
    });
  })();

  /* ---------- formulario (Netlify Forms) ---------- */
  var f = $("#form-presupuesto"), ok = $("#form-gracias"), err = $("#form-error");
  if (f) f.addEventListener("submit", function (e) {
    e.preventDefault();
    var b = $("button[type=submit]", f); b.disabled = true; err.hidden = true;
    fetch("/", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams(new FormData(f)).toString() })
      .then(function (r) { if (!r.ok) throw new Error(r.status); f.hidden = true; ok.hidden = false; ok.focus(); })
      .catch(function () { f.submit(); });
  });
})();
