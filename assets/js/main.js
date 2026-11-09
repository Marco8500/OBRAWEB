/* ==========================================================================
   Flor & Atelier — Interacciones
   Sin dependencias. Todo el contenido funciona también sin JavaScript
   (enlaces, formularios Netlify con página de gracias y FAQ nativa).
   ========================================================================== */
(function () {
  'use strict';

  /* ---------------------------------------------------------------------
     CONFIGURACIÓN DEL NEGOCIO — editar aquí antes de publicar
     --------------------------------------------------------------------- */
  var CONFIG = {
    // ⚠️ Número de WhatsApp en formato internacional sin "+" ni espacios.
    // El valor actual es el marcador de posición que venía en la demo.
    whatsapp: '34600000000',
    negocio: 'Flor & Atelier',
    horaLimiteMismoDia: 14, // pedidos antes de esta hora se entregan hoy
    envioGratisDesde: 40     // €
  };

  document.documentElement.classList.add('js');

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function waLink(text) {
    return 'https://wa.me/' + CONFIG.whatsapp + (text ? '?text=' + encodeURIComponent(text) : '');
  }
  function euros(n) {
    return Number(n).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
  }
  function scrollToEl(el) {
    if (!el) return;
    el.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
  }

  /* Toast ----------------------------------------------------------------- */
  var toastEl = $('#toast'), toastTimer;
  function toast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('is-visible'); }, 2600);
  }

  /* Enlaces de WhatsApp (una sola fuente de verdad) ------------------------ */
  $$('[data-wa]').forEach(function (a) {
    a.href = waLink(a.dataset.waText || 'Hola, me gustaría hacer una consulta sobre vuestras flores.');
  });

  /* Año del footer -------------------------------------------------------- */
  var year = $('#year');
  if (year) year.textContent = new Date().getFullYear();

  /* Cabecera con sombra al hacer scroll ------------------------------------ */
  var header = $('#header');
  function onScroll() { header.classList.toggle('is-scrolled', window.scrollY > 8); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* Menú móvil (drawer) --------------------------------------------------- */
  var drawer = $('#drawer');
  var toggle = $('.menu-toggle');
  var lastFocus;
  function openDrawer() {
    lastFocus = document.activeElement;
    drawer.hidden = false;
    document.body.classList.add('is-locked');
    toggle.setAttribute('aria-expanded', 'true');
    requestAnimationFrame(function () {
      drawer.classList.add('is-open');
      var first = $('.drawer__nav a', drawer);
      if (first) first.focus({ preventScroll: true });
    });
  }
  function closeDrawer(skipFocus) {
    drawer.classList.remove('is-open');
    document.body.classList.remove('is-locked');
    toggle.setAttribute('aria-expanded', 'false');
    setTimeout(function () { drawer.hidden = true; }, reduceMotion ? 0 : 320);
    if (!skipFocus && lastFocus) lastFocus.focus({ preventScroll: true });
  }
  if (toggle && drawer) {
    toggle.addEventListener('click', openDrawer);
    $$('[data-close-drawer]', drawer).forEach(function (b) { b.addEventListener('click', function () { closeDrawer(); }); });
    $$('a', drawer).forEach(function (a) { a.addEventListener('click', function () { closeDrawer(true); }); });
    drawer.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeDrawer();
      if (e.key === 'Tab') { // trampa de foco
        var f = $$('a, button', drawer).filter(function (x) { return x.offsetParent !== null; });
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
  }

  /* Sección activa en menú y barra inferior -------------------------------- */
  var navLinks = $$('[data-nav]');
  var sectionIds = ['inicio', 'colecciones', 'catalogo', 'como-funciona', 'bodas', 'opiniones', 'pedido', 'faq', 'club', 'contacto'];
  var navMap = { opiniones: 'bodas', club: 'faq' }; // secciones sin enlace propio
  if ('IntersectionObserver' in window) {
    var visible = {};
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { visible[en.target.id] = en.isIntersecting ? en.intersectionRatio : 0; });
      var current = sectionIds.filter(function (id) { return visible[id] > 0; })[0];
      if (!current) return;
      navLinks.forEach(function (a) {
        var target = a.dataset.nav;
        var on = target === current || target === navMap[current];
        // la barra inferior no tiene "faq": contacto cubre faq/club/contacto
        if (a.closest('.tabbar') && ['faq', 'club', 'contacto'].indexOf(current) > -1) on = target === 'contacto';
        if (a.closest('.tabbar') && ['colecciones', 'como-funciona'].indexOf(current) > -1) on = target === 'catalogo';
        if (a.closest('.tabbar') && current === 'opiniones') on = target === 'bodas';
        a.classList.toggle('is-active', on);
        if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
      });
    }, { rootMargin: '-45% 0px -50% 0px', threshold: [0, 0.01] });
    sectionIds.forEach(function (id) { var el = document.getElementById(id); if (el) spy.observe(el); });
  }

  /* Animaciones al aparecer ----------------------------------------------- */
  var reveals = $$('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target;
        var siblings = $$('.reveal', el.parentElement);
        el.style.transitionDelay = Math.min(siblings.indexOf(el), 4) * 70 + 'ms';
        el.classList.add('is-in');
        io.unobserve(el);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* Filtros del catálogo -------------------------------------------------- */
  var chips = $$('.chip[data-category]');
  var products = $$('.product');
  function applyFilter(cat) {
    chips.forEach(function (c) {
      var on = c.dataset.category === cat;
      c.classList.toggle('is-active', on);
      c.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    products.forEach(function (p) {
      var show = cat === 'all' || p.dataset.cat === cat;
      p.classList.toggle('is-hidden', !show);
      if (show) p.classList.add('is-in');
    });
  }
  chips.forEach(function (c) { c.addEventListener('click', function () { applyFilter(c.dataset.category); }); });
  // Colecciones y enlaces del footer que abren el catálogo ya filtrado
  $$('a[data-filter]').forEach(function (a) {
    a.addEventListener('click', function () { applyFilter(a.dataset.filter); });
  });

  /* Favoritos (persisten en este navegador) -------------------------------- */
  var FAV_KEY = 'fa-favoritos';
  var favs = [];
  try { favs = JSON.parse(localStorage.getItem(FAV_KEY)) || []; } catch (e) { favs = []; }
  products.forEach(function (p) {
    var btn = $('.fav', p), name = p.dataset.name;
    if (!btn) return;
    if (favs.indexOf(name) > -1) btn.setAttribute('aria-pressed', 'true');
    btn.addEventListener('click', function () {
      var on = btn.getAttribute('aria-pressed') !== 'true';
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
      favs = favs.filter(function (n) { return n !== name; });
      if (on) favs.push(name);
      try { localStorage.setItem(FAV_KEY, JSON.stringify(favs)); } catch (e) { /* modo privado */ }
      toast(on ? '♥ ' + name + ' guardado en favoritos' : 'Eliminado de favoritos');
    });
  });

  /* Pedido: selección y resumen ------------------------------------------- */
  var form = $('#pedidoForm');
  var sel = $('#productoSel');
  var summaryImg = $('#summaryImg'), summaryName = $('#summaryName'),
      summaryPrice = $('#summaryPrice'), summaryNote = $('#summaryNote');

  function updateSummary() {
    if (!sel) return;
    var opt = sel.options[sel.selectedIndex];
    var price = opt.dataset.price;
    summaryName.textContent = opt.value;
    summaryPrice.textContent = price ? euros(price) : 'Presupuesto a medida';
    if (opt.dataset.img && summaryImg.getAttribute('src') !== opt.dataset.img) {
      summaryImg.style.opacity = '0';
      var next = opt.dataset.img;
      setTimeout(function () { summaryImg.src = next; summaryImg.style.opacity = '1'; }, 150);
    }
    var note = '';
    if (price && Number(price) >= CONFIG.envioGratisDesde) note = 'Incluye envío gratis';
    else if (price) note = 'Envío gratis desde ' + CONFIG.envioGratisDesde + ' € · recogida sin coste';
    else note = 'Te enviamos una propuesta sin compromiso';
    summaryNote.innerHTML = '<svg class="ic" aria-hidden="true"><use href="#i-' + (price ? 'truck' : 'sparkle') + '"/></svg>' + note;
  }
  function selectProduct(value) {
    if (!sel || !value) return;
    for (var i = 0; i < sel.options.length; i++) {
      if (sel.options[i].value === value) { sel.selectedIndex = i; break; }
    }
    updateSummary();
  }
  if (sel) { sel.addEventListener('change', updateSummary); updateSummary(); }

  products.forEach(function (p) {
    var name = p.dataset.name;
    var reserve = $('[data-pedir]', p);
    if (reserve) reserve.addEventListener('click', function () {
      selectProduct(name);
      scrollToEl($('#pedido'));
      toast('Has elegido ' + name);
    });
    var wa = $('[data-wa-product]', p);
    if (wa) wa.href = waLink('Hola, me gustaría encargar el ramo "' + name + '" (' + euros(p.dataset.price) + '). ¿Está disponible?');
  });
  $$('[data-tipo]').forEach(function (a) {
    a.addEventListener('click', function () { selectProduct(a.dataset.tipo); });
  });

  /* Pedido: fecha mínima y aviso del mismo día ---------------------------- */
  var fecha = $('#f-fecha'), fechaHint = $('#fechaHint');
  function isoLocal(d) {
    var off = d.getTimezoneOffset();
    return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10);
  }
  var hoy = isoLocal(new Date());
  if (fecha) {
    fecha.min = hoy;
    var updateHint = function () {
      if (fecha.value !== hoy) { fechaHint.textContent = ''; return; }
      fechaHint.textContent = new Date().getHours() < CONFIG.horaLimiteMismoDia
        ? '✓ A tiempo para entrega hoy (antes de las 14:00)'
        : 'Pasadas las 14:00: te confirmamos disponibilidad para hoy';
    };
    fecha.addEventListener('change', updateHint);
  }

  /* Pedido: dirección solo si es a domicilio ------------------------------ */
  var addressField = $('#addressField'), address = $('#f-direccion');
  $$('input[name="entrega"]').forEach(function (r) {
    r.addEventListener('change', function () {
      var home = r.checked && r.value === 'Entrega a domicilio';
      if (!r.checked) return;
      addressField.hidden = !home;
      address.required = home;
      if (!home) addressField.classList.remove('is-invalid');
    });
  });

  /* Validación ------------------------------------------------------------ */
  function validateField(input) {
    var field = input.closest('.field');
    var ok = input.checkValidity();
    if (input === fecha && input.value && input.value < hoy) ok = false;
    if (field) field.classList.toggle('is-invalid', !ok);
    input.setAttribute('aria-invalid', ok ? 'false' : 'true');
    return ok;
  }
  function validateForm(f) {
    var inputs = $$('input[required], select[required], textarea[required]', f)
      .filter(function (i) { return !i.closest('[hidden]'); });
    var firstBad = null;
    inputs.forEach(function (i) { if (!validateField(i) && !firstBad) firstBad = i; });
    if (firstBad) firstBad.focus();
    return !firstBad;
  }
  if (form) {
    $$('input, textarea', form).forEach(function (i) {
      i.addEventListener('blur', function () { if (i.required && i.value) validateField(i); });
      i.addEventListener('input', function () { if (i.closest('.is-invalid')) validateField(i); });
    });
  }

  /* Envío a Netlify Forms ------------------------------------------------- */
  function postForm(f) {
    return fetch('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(new FormData(f)).toString()
    }).then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r; });
  }

  var submitBtn = $('#pedidoSubmit'), errorBox = $('#pedidoError'), okBox = $('#pedidoOk');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      errorBox.hidden = true;
      if (!validateForm(form)) return;
      submitBtn.classList.add('is-loading');
      submitBtn.setAttribute('aria-busy', 'true');
      postForm(form)
        .then(function () {
          form.hidden = true;
          okBox.hidden = false;
          okBox.focus();
          scrollToEl($('#pedido'));
        })
        .catch(function () { errorBox.hidden = false; })
        .then(function () {
          submitBtn.classList.remove('is-loading');
          submitBtn.removeAttribute('aria-busy');
        });
    });
  }
  var otro = $('#pedidoOtro');
  if (otro) otro.addEventListener('click', function () {
    form.reset();
    addressField.hidden = true; address.required = false;
    if (fechaHint) fechaHint.textContent = '';
    updateSummary();
    okBox.hidden = true; form.hidden = false;
    $('#f-nombre').focus();
  });

  /* Pedido por WhatsApp con todos los datos ------------------------------- */
  var waBtn = $('#pedidoWa');
  if (waBtn) waBtn.addEventListener('click', function () {
    var d = new FormData(form);
    var fechaTxt = d.get('fecha')
      ? new Date(d.get('fecha') + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })
      : 'por confirmar';
    var lines = [
      'Hola ' + CONFIG.negocio + ', quiero hacer un pedido:',
      '',
      '• Producto: ' + d.get('producto'),
      '• Fecha: ' + fechaTxt,
      '• Entrega: ' + d.get('entrega')
    ];
    if (d.get('entrega') === 'Entrega a domicilio' && d.get('direccion')) lines.push('• Dirección: ' + d.get('direccion'));
    if (d.get('mensaje')) lines.push('• Detalles / dedicatoria: ' + d.get('mensaje'));
    if (d.get('nombre')) lines.push('', 'Mi nombre es ' + d.get('nombre') + '.');
    window.open(waLink(lines.join('\n')), '_blank', 'noopener');
  });

  /* Club / newsletter ----------------------------------------------------- */
  var club = $('#newsletterForm'), clubOk = $('#newsletterSuccess');
  if (club) {
    var email = $('#f-email');
    club.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = email.checkValidity();
      club.classList.toggle('is-invalid', !ok);
      if (!ok) { email.focus(); return; }
      var btn = $('button[type="submit"]', club);
      btn.classList.add('is-loading');
      postForm(club)
        .then(function () { club.hidden = true; $('.club__legal').hidden = true; clubOk.hidden = false; clubOk.focus(); })
        .catch(function () { toast('No se ha podido enviar. Inténtalo de nuevo en unos segundos.'); })
        .then(function () { btn.classList.remove('is-loading'); });
    });
    email.addEventListener('input', function () { club.classList.remove('is-invalid'); });
  }

  /* Asistente de respuestas rápidas --------------------------------------
     Flujo guiado con respuestas basadas en la información del negocio.
     Punto de integración: sustituir `answer()` por una llamada a un
     chatbot con IA (p. ej. un endpoint propio) cuando se contrate.     */
  var assistant = $('#assistant'), panel = $('#assistantPanel'), fab = $('#assistantToggle'),
      log = $('#assistantLog'), options = $('#assistantOptions');
  var FAQ = [
    { q: '¿Llega hoy?', a: 'Sí: si haces tu pedido <strong>antes de las 14:00</strong>, lo entregamos el mismo día con nuestra flota local refrigerada.' },
    { q: '¿Cómo se paga?', a: 'No se paga nada en la web. Te confirmamos el pedido por WhatsApp o teléfono y pagas <strong>al recibirlo o al recogerlo</strong> en el taller.' },
    { q: 'Gastos de envío', a: 'El envío es <strong>gratis desde 40 €</strong>. También puedes recogerlo en el taller sin coste.' },
    { q: 'Flores para boda', a: 'Hacemos ramos de novia, arcos, centros de mesa y ambientación completa, con consulta inicial sin compromiso. <a href="#bodas" data-assist-link>Ver bodas y eventos</a>.' },
    { q: 'Quiero encargar', a: 'Perfecto. Puedes <a href="#pedido" data-assist-link>rellenar el formulario de pedido</a> en un minuto o escribirnos directamente por WhatsApp.' }
  ];
  var started = false;
  function addMsg(html, who) {
    var m = document.createElement('div');
    m.className = 'msg msg--' + who;
    m.innerHTML = html;
    log.appendChild(m);
    log.scrollTop = log.scrollHeight;
    $$('[data-assist-link]', m).forEach(function (a) { a.addEventListener('click', function () { setAssistant(false); }); });
    return m;
  }
  function renderOptions() {
    options.innerHTML = '';
    FAQ.forEach(function (item) {
      var b = document.createElement('button');
      b.type = 'button'; b.textContent = item.q;
      b.addEventListener('click', function () { answer(item); });
      options.appendChild(b);
    });
    var wa = document.createElement('a');
    wa.href = waLink('Hola, tengo una consulta sobre vuestras flores.');
    wa.target = '_blank'; wa.rel = 'noopener';
    wa.textContent = 'Hablar por WhatsApp';
    options.appendChild(wa);
  }
  function answer(item) {
    addMsg(item.q, 'user');
    var typing = addMsg('<span class="typing"><i></i><i></i><i></i></span>', 'bot');
    typing.style.padding = '0';
    setTimeout(function () { typing.remove(); addMsg(item.a, 'bot'); }, reduceMotion ? 0 : 650);
  }
  function setAssistant(open) {
    panel.hidden = !open;
    assistant.classList.toggle('is-open', open);
    assistant.classList.add('is-seen');
    assistant.classList.remove('show-bubble');
    fab.setAttribute('aria-expanded', open ? 'true' : 'false');
    fab.setAttribute('aria-label', open ? 'Cerrar asistente' : 'Abrir asistente de ayuda');
    if (open && !started) {
      started = true;
      addMsg('¡Hola! 🌿 Soy el asistente de ' + CONFIG.negocio + '. ¿En qué te ayudo?', 'bot');
      renderOptions();
    }
    if (open) { var f = $('button', options); if (f) f.focus({ preventScroll: true }); }
  }
  if (assistant) {
    fab.addEventListener('click', function () { setAssistant(panel.hidden); });
    $('[data-close-assistant]', assistant).addEventListener('click', function () { setAssistant(false); fab.focus(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !panel.hidden) { setAssistant(false); fab.focus(); } });
    // Burbuja de invitación discreta tras unos segundos (una vez por sesión)
    var seen = false;
    try { seen = sessionStorage.getItem('fa-assist') === '1'; } catch (e) { /* noop */ }
    if (!seen) {
      setTimeout(function () {
        if (!panel.hidden) return;
        assistant.classList.add('show-bubble');
        setTimeout(function () { assistant.classList.remove('show-bubble'); }, 6000);
        try { sessionStorage.setItem('fa-assist', '1'); } catch (e) { /* noop */ }
      }, 9000);
    }
  }
})();
