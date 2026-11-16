/* La Despensa del Barrio · lógica interactiva (sin dependencias) */
(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const root = document.documentElement;
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }
  };
  const eur = n => n.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' });
  const toast = msg => { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('show'), 2200); };

  /* ---------- Datos ---------- */
  const PRODUCTS = [
    { id: 1, k: 'tomate', n: 'Tomates de la huerta', cat: 'fruta', p: 2.40, u: 'kg', o: 'Huerta de Paco · 4 km', c: '#b8341f', km0: true, season: 'Jun – Oct', kcal: 18,
      d: 'Tomate en rama madurado en la planta, con su olor a verde. Carnoso y dulce, perfecto para ensaladas, gazpacho o pan con tomate.',
      how: 'Paco los recoge a mano a primera hora, cuando ya están rojos pero firmes, cortando el racimo con tijera para no dañar la planta. Llegan a la tienda ese mismo día, sin cámaras frigoríficas.' },
    { id: 2, k: 'lechuga', n: 'Lechuga romana', cat: 'fruta', p: 1.10, u: 'ud', o: 'Coop. Verde Vivo · 8 km', c: '#3f7d2c', km0: true, eco: true, season: 'Todo el año', kcal: 17,
      d: 'Hojas largas, crujientes y frescas. Cultivo ecológico sin pesticidas de síntesis: la base de cualquier ensalada.',
      how: 'Se cortan a ras de suelo con cuchillo cuando el cogollo está prieto, se lavan con agua fría del pozo y se colocan en cajas de madera retornables.' },
    { id: 3, k: 'manzana', n: 'Manzanas de la finca', cat: 'fruta', p: 1.95, u: 'kg', o: 'Finca Las Eras · 12 km', c: '#c0392b', km0: true, season: 'Sep – Mar', kcal: 52,
      d: 'Manzana roja, crujiente y jugosa, con el equilibrio justo entre dulce y ácido. Ideal para comer a mordiscos o para hacer compota.',
      how: 'La recogida se hace a mano, girando la fruta hacia arriba para que el rabillo se suelte sin romper la rama. Se guardan en un almacén fresco y ventilado.' },
    { id: 4, k: 'pan', n: 'Pan de masa madre', cat: 'panaderia', p: 2.80, u: 'ud', o: 'Horno San Juan · 1 km', c: '#9a5b25', km0: true, season: 'Cada mañana', kcal: 250,
      d: 'Fermentación lenta de 24 horas con masa madre natural. Corteza crujiente, miga húmeda y aroma que dura varios días.',
      how: 'Luis empieza a las 4 de la madrugada: forma las piezas a mano y las cuece en horno de piedra. A las 8 ya están en la tienda, todavía calientes.' },
    { id: 5, k: 'croissant', n: 'Croissants de mantequilla', cat: 'panaderia', p: 3.20, old: 4.80, u: '4 uds', o: 'Horno San Juan · 1 km', c: '#c07a1e', last: true, season: 'Cada mañana', kcal: 406,
      d: 'Hojaldre de mantequilla con 27 capas. Son de ayer y por eso cuestan menos: en el horno 3 minutos y quedan como recién hechos.',
      how: 'La masa se lamina y se dobla tres veces, se forma cada croissant a mano y se hornea a 190 °C hasta que la superficie queda dorada y brillante.' },
    { id: 6, k: 'queso', n: 'Queso artesano semicurado', cat: 'despensa', p: 9.50, u: '500 g', o: 'Quesería La Vega · 25 km', c: '#b98a1b', km0: true, season: '3 meses de curación', kcal: 380,
      d: 'Queso de leche cruda de vaca, suave y con ojos. Sabor a pradera y un final ligeramente avellanado.',
      how: 'Se cuaja la leche recién ordeñada, se prensa en moldes y madura tres meses en una cueva natural, donde cada pieza se voltea a mano cada semana.' },
    { id: 7, k: 'miel', n: 'Miel de flores', cat: 'despensa', p: 6.90, u: '500 g', o: 'Apicultura Sierra · 30 km', c: '#c98411', km0: true, eco: true, season: 'Jun – Sep', kcal: 304,
      d: 'Miel cruda sin pasteurizar, de romero, tomillo y flores silvestres de la sierra. Con el frío cristaliza: es señal de que es pura.',
      how: 'Ana retira los cuadros de las colmenas con humo suave, quita la cera con un cuchillo caliente y extrae la miel por centrifugado, sin calentar.' },
    { id: 8, k: 'aceite', n: 'Aceite de oliva virgen extra', cat: 'despensa', p: 8.40, u: '750 ml', o: 'Almazara del Valle · 40 km', c: '#6b7a1c', eco: true, season: 'Nov – Ene', kcal: 884,
      d: 'Primera presión en frío de aceituna picual. Afrutado, con un toque amargo y picante: el oro líquido de la cocina.',
      how: 'La aceituna se varea y se recoge en mantos sobre el suelo. En menos de 24 horas se muele en la almazara y se extrae el aceite en frío, sin químicos.' },
    { id: 9, k: 'huevos', n: 'Huevos camperos', cat: 'despensa', p: 3.10, u: 'media docena', o: 'Gallinas Felices · 9 km', c: '#a0662f', km0: true, season: 'Todo el año', kcal: 143,
      d: 'De gallinas que pasean al aire libre y comen cereal y hierba. Yema de color intenso y clara firme.',
      how: 'Se recogen a mano dos veces al día de los ponederos, se revisan a contraluz y se envasan en hueveras de cartón reciclado.' },
    { id: 10, k: 'platano', n: 'Plátanos de Canarias', cat: 'fruta', p: 0.90, old: 1.80, u: 'kg', o: 'Canarias', c: '#c9a10f', last: true, season: 'Todo el año', kcal: 89,
      d: 'Con sus famosas motitas: están en su punto de dulzor. A mitad de precio para que no se desperdicien. Perfectos para batidos o bizcocho.',
      how: 'Las piñas se cortan verdes en la plantación, viajan en barco a la península y maduran de forma natural, sin cámaras de gas.' }
  ];
  const CREDITS = {"tomate": {"p": "Softeis (CC BY-SA 3.0)", "h": "U.S. Department of Agriculture / Preston Keres/Office of Communications-Photography Services Center (Public domain)"}, "manzana": {"p": "Abhijit Tembhekar from Mumbai, India (CC BY 2.0)", "h": "W.carter (CC0)"}, "lechuga": {"p": "Rainer Zenz (CC BY-SA 3.0)", "h": "Zolfeqar Fatihzadeh (CC BY-SA 4.0)"}, "pan": {"p": "Dmitry Makeev (CC BY-SA 4.0)", "h": "Ensie & Matthias (CC BY-SA 2.0)"}, "croissant": {"p": "Petr Kratochvil (CC0)", "h": "Jeremy Keith from Brighton & Hove, United Kingdom (CC BY 2.0)"}, "queso": {"p": "Renee Comet (Photographer) (Public domain)", "h": "Baynard (CC BY-SA 3.0)"}, "miel": {"p": "Hayden Soloviev (CC BY 4.0)", "h": "KNOW MALTA by Peter Grima from MALTA (CC BY-SA 2.0)"}, "aceite": {"p": "Mervat Salman (CC BY-SA 4.0)", "h": "Ввласенко (CC BY-SA 3.0)"}, "huevos": {"p": "Evan-Amos (Public domain)", "h": "Bill Boaden (CC BY-SA 2.0)"}, "platano": {"p": "robin_24 (CC BY 2.0)", "h": "Frank Vincentz (CC BY-SA 3.0)"}};
  const CREDITS_FULL = [{"k": "h_aceite", "t": "Air Olive 1.JPG", "a": "Ввласенко", "l": "CC BY-SA 3.0", "u": "https://commons.wikimedia.org/wiki/File:Air_Olive_1.JPG"}, {"k": "h_croissant", "t": "Putting bread in the oven (5958998763).jpg", "a": "Jeremy Keith from Brighton & Hove, United Kingdom", "l": "CC BY 2.0", "u": "https://commons.wikimedia.org/wiki/File:Putting_bread_in_the_oven_(5958998763).jpg"}, {"k": "h_huevos", "t": "Farm with free range hens - geograph.org.uk - 1729447.jpg", "a": "Bill Boaden", "l": "CC BY-SA 2.0", "u": "https://commons.wikimedia.org/wiki/File:Farm_with_free_range_hens_-_geograph.org.uk_-_1729447.jpg"}, {"k": "h_lechuga", "t": "Iceberg lettuce in Poplar Farmhouse (14827).jpg", "a": "Zolfeqar Fatihzadeh", "l": "CC BY-SA 4.0", "u": "https://commons.wikimedia.org/wiki/File:Iceberg_lettuce_in_Poplar_Farmhouse_(14827).jpg"}, {"k": "h_manzana", "t": "Tree with red apples in Barkedal 4.jpg", "a": "W.carter", "l": "CC0", "u": "https://commons.wikimedia.org/wiki/File:Tree_with_red_apples_in_Barkedal_4.jpg"}, {"k": "h_miel", "t": "Maltese honey (3044867663).jpg", "a": "KNOW MALTA by Peter Grima from MALTA", "l": "CC BY-SA 2.0", "u": "https://commons.wikimedia.org/wiki/File:Maltese_honey_(3044867663).jpg"}, {"k": "h_pan", "t": "Barbary Baker.jpg", "a": "Ensie & Matthias", "l": "CC BY-SA 2.0", "u": "https://commons.wikimedia.org/wiki/File:Barbary_Baker.jpg"}, {"k": "h_platano", "t": "Banana plantation (San Andrés) 04 ies.jpg", "a": "Frank Vincentz", "l": "CC BY-SA 3.0", "u": "https://commons.wikimedia.org/wiki/File:Banana_plantation_(San_Andr%C3%A9s)_04_ies.jpg"}, {"k": "h_queso", "t": "Cheese Aging Cave.jpg", "a": "Baynard", "l": "CC BY-SA 3.0", "u": "https://commons.wikimedia.org/wiki/File:Cheese_Aging_Cave.jpg"}, {"k": "h_tomate", "t": "Tomato harvest at Miller Farms in Clinton, MD 20170728-RD-PJK-0672 TONED (36224627815).jpg", "a": "U.S. Department of Agriculture / Preston Keres/Office of Communications-Photography Services Center", "l": "Public domain", "u": "https://commons.wikimedia.org/wiki/File:Tomato_harvest_at_Miller_Farms_in_Clinton,_MD_20170728-RD-PJK-0672_TONED_(36224627815).jpg"}, {"k": "p_aceite", "t": "Bottle of Extra Virgin Olive Oil.jpg", "a": "Mervat Salman", "l": "CC BY-SA 4.0", "u": "https://commons.wikimedia.org/wiki/File:Bottle_of_Extra_Virgin_Olive_Oil.jpg"}, {"k": "p_croissant", "t": "Croissant-Petr Kratochvil.jpg", "a": "Petr Kratochvil", "l": "CC0", "u": "https://commons.wikimedia.org/wiki/File:Croissant-Petr_Kratochvil.jpg"}, {"k": "p_huevos", "t": "6-Pack-Chicken-Eggs.jpg", "a": "Evan-Amos", "l": "Public domain", "u": "https://commons.wikimedia.org/wiki/File:6-Pack-Chicken-Eggs.jpg"}, {"k": "p_lechuga", "t": "Romaine lettuce.jpg", "a": "Rainer Zenz", "l": "CC BY-SA 3.0", "u": "https://commons.wikimedia.org/wiki/File:Romaine_lettuce.jpg"}, {"k": "p_manzana", "t": "Red Apple.jpg", "a": "Abhijit Tembhekar from Mumbai, India", "l": "CC BY 2.0", "u": "https://commons.wikimedia.org/wiki/File:Red_Apple.jpg"}, {"k": "p_miel", "t": "Three French monofloral honey jars.jpg", "a": "Hayden Soloviev", "l": "CC BY 4.0", "u": "https://commons.wikimedia.org/wiki/File:Three_French_monofloral_honey_jars.jpg"}, {"k": "p_pan", "t": "Breads of Moskovskaya Oblast. img 008.jpg", "a": "Dmitry Makeev", "l": "CC BY-SA 4.0", "u": "https://commons.wikimedia.org/wiki/File:Breads_of_Moskovskaya_Oblast._img_008.jpg"}, {"k": "p_platano", "t": "Banana isolated on white.jpg", "a": "robin_24", "l": "CC BY 2.0", "u": "https://commons.wikimedia.org/wiki/File:Banana_isolated_on_white.jpg"}, {"k": "p_queso", "t": "Cheese.jpg", "a": "Renee Comet (Photographer)", "l": "Public domain", "u": "https://commons.wikimedia.org/wiki/File:Cheese.jpg"}, {"k": "p_tomate", "t": "Tomato je.jpg", "a": "Softeis", "l": "CC BY-SA 3.0", "u": "https://commons.wikimedia.org/wiki/File:Tomato_je.jpg"}];
  const img = k => `img/${k}.webp`, field = k => `img/campo_${k}.webp`;
  const MEASURES = [
    { i: '🔒', t: 'Web y pagos seguros + RGPD', s: 'Segura', c: '#1f7a4d', p: 100,
      a: ['Certificado HTTPS en toda la web', 'Pasarela de pago certificada (Bizum, Redsys)', 'Contraseñas robustas y verificación en dos pasos', 'Copias de seguridad diarias y actualizaciones', 'Política de privacidad y cookies que se pueden rechazar'], ods: [9, 16] },
    { i: '♿', t: 'Web accesible para todas las personas', s: 'Inclusiva', c: '#dd1367', p: 90,
      a: ['Pautas WCAG 2.2 nivel AA', 'Letra ajustable, alto contraste y lectura en voz alta', 'Navegación completa con teclado', 'Lenguaje claro y compra en 3 pasos', 'Pruebas con vecinos mayores y con discapacidad'], ods: [10, 11] },
    { i: '🎓', t: 'Formación digital y canales alternativos', s: 'Inclusiva', c: '#c5192d', p: 75,
      a: ['Talleres gratuitos los sábados', 'Formación del personal en ciberseguridad', 'Pedidos por teléfono y WhatsApp', 'Pago en efectivo al recoger', 'Mismo precio en tienda y online'], ods: [4, 8] },
    { i: '🚲', t: 'Logística verde', s: 'Sostenible', c: '#3f7e44', p: 80,
      a: ['Recogida en tienda gratuita (click & collect)', 'Reparto a pie o en bici en el barrio', 'Envases retornables y sin plástico de un solo uso', 'Calculadora de CO₂ ahorrado', 'Rutas agrupadas por zonas'], ods: [11, 12, 13] },
    { i: '🌱', t: 'Producto local, desperdicio cero y hosting verde', s: 'Sostenible', c: '#bf8b2e', p: 85,
      a: ['Etiqueta Km 0 y ficha del productor', 'Sección «Último día» con descuentos', 'Donación de excedentes al banco de alimentos', 'Hosting con energía 100 % renovable', 'Web ligera: sin imágenes pesadas'], ods: [7, 8, 12] }
  ];
  const ODS = {
    4: { n: 'Educación de calidad', c: '#c5192d', ic: '📚', d: '<b>Meta 4.4:</b> talleres para que vecinos y personal ganen competencias digitales.' },
    7: { n: 'Energía asequible y no contaminante', c: '#fcc30b', ic: '☀️', d: 'Web alojada en servidores con <b>energía 100 % renovable</b> y diseño ligero.' },
    8: { n: 'Trabajo decente y crecimiento', c: '#a21942', ic: '💼', d: '<b>Meta 8.3:</b> fortalece a una microempresa y a los productores locales.' },
    9: { n: 'Industria, innovación e infraestructura', c: '#fd6925', ic: '🏗️', d: '<b>Meta 9.1:</b> infraestructura digital fiable, segura y resiliente.' },
    10: { n: 'Reducción de desigualdades', c: '#dd1367', ic: '⚖️', d: '<b>Meta 10.2:</b> web accesible y canales alternativos: nadie se queda fuera.' },
    11: { n: 'Ciudades y comunidades sostenibles', c: '#fd9d24', ic: '🏘️', d: '<b>Meta 11.6:</b> menos tráfico y contaminación gracias al reparto en bici.' },
    12: { n: 'Producción y consumo responsables', c: '#bf8b2e', ic: '♻️', d: '<b>Metas 12.3 y 12.5:</b> menos desperdicio de comida y envases reutilizables.' },
    13: { n: 'Acción por el clima', c: '#3f7e44', ic: '🌍', d: 'Reducimos emisiones con recogida en tienda y reparto sin motor.' },
    16: { n: 'Paz, justicia e instituciones sólidas', c: '#00689d', ic: '🛡️', d: '<b>Meta 16.10:</b> protegemos tus datos personales cumpliendo el RGPD.' }
  };

  /* ---------- Tema y accesibilidad ---------- */
  const setTheme = t => { if (t) root.setAttribute('data-theme', t); else root.removeAttribute('data-theme'); $('#themeBtn').textContent = isDark() ? '☀️' : '🌙'; };
  const isDark = () => root.getAttribute('data-theme') === 'dark' || (!root.getAttribute('data-theme') && matchMedia('(prefers-color-scheme: dark)').matches);
  setTheme(store.get('theme', null));
  $('#themeBtn').addEventListener('click', () => { const t = isDark() ? 'light' : 'dark'; store.set('theme', t); setTheme(t); });

  const a11yBtn = $('#a11yBtn'), a11yPanel = $('#a11yPanel');
  a11yBtn.addEventListener('click', () => { a11yPanel.hidden = !a11yPanel.hidden; a11yBtn.setAttribute('aria-expanded', String(!a11yPanel.hidden)); });
  let fs = store.get('fs', 1);
  const applyFs = () => root.style.setProperty('--fs', fs);
  applyFs();
  $$('[data-font]').forEach(b => b.addEventListener('click', () => {
    const v = +b.dataset.font; fs = v === 0 ? 1 : Math.min(1.5, Math.max(0.85, fs + v * 0.125)); applyFs(); store.set('fs', fs);
  }));
  [['#contrastToggle', 'contrast'], ['#dyslexiaToggle', 'dyslexia'], ['#motionToggle', 'no-motion']].forEach(([sel, cls]) => {
    const el = $(sel); el.checked = store.get(cls, false); root.classList.toggle(cls, el.checked);
    el.addEventListener('change', () => { root.classList.toggle(cls, el.checked); store.set(cls, el.checked); });
  });
  $('#readBtn').addEventListener('click', () => {
    if (!('speechSynthesis' in window)) return toast('Tu navegador no permite lectura en voz alta');
    if (speechSynthesis.speaking) { speechSynthesis.cancel(); return toast('Lectura detenida'); }
    const txt = $$('h1, h2.title, .lead, .subtitle').map(e => e.textContent).join('. ');
    const u = new SpeechSynthesisUtterance(txt); u.lang = 'es-ES'; speechSynthesis.speak(u); toast('🔊 Leyendo… pulsa otra vez para parar');
  });

  /* ---------- Tienda ---------- */
  let cart = store.get('cart', {});
  let filter = 'todo', query = '';
  const grid = $('#products');
  function renderProducts() {
    const q = query.trim().toLowerCase();
    const list = PRODUCTS.filter(p => (filter === 'todo' || p.cat === filter || (filter === 'ultimo' && p.last)) && p.n.toLowerCase().includes(q));
    grid.innerHTML = list.length ? list.map((p, i) => `
      <article class="product" style="animation-delay:${i * 50}ms; --pc:${p.c}">
        <div class="tags">${p.km0 ? '<span class="tag">KM 0</span>' : ''}${p.eco ? '<span class="tag eco">ECO</span>' : ''}${p.last ? '<span class="tag last">ÚLTIMO DÍA</span>' : ''}</div>
        <button class="photo" data-ficha="${p.id}" aria-label="Ver ficha de ${p.n}">
          <img class="harvest" src="${field(p.k)}" alt="" loading="lazy">
          <span class="harvest-label">Ver cómo se cosecha</span>
          <img class="cut" src="${img(p.k)}" alt="${p.n}" loading="lazy" style="animation-delay:${-i * 0.7}s">
        </button>
        <div class="pbody">
          <h3>${p.n}</h3>
          <p class="origin">${p.o}</p>
          <p class="short">${p.d.split('.')[0]}.</p>
          <div class="row-buy"><div><span class="price">${eur(p.p)}</span>${p.old ? `<span class="old">${eur(p.old)}</span>` : ''} <small>/ ${p.u}</small></div>
          <button class="btn small" data-add="${p.id}" aria-label="Añadir ${p.n} a la cesta">Añadir</button></div>
        </div>
      </article>`).join('') : '<p class="empty">No hay productos con ese filtro.</p>';
  }
  $('#chips').addEventListener('click', e => {
    const b = e.target.closest('.chip'); if (!b) return;
    $$('.chip').forEach(c => c.classList.toggle('active', c === b)); filter = b.dataset.cat; renderProducts();
  });
  $('#search').addEventListener('input', e => { query = e.target.value; renderProducts(); });
  grid.addEventListener('click', e => {
    const f = e.target.closest('[data-ficha]'); if (f) return openFicha(+f.dataset.ficha);
    const b = e.target.closest('[data-add]'); if (!b) return;
    const id = +b.dataset.add; cart[id] = (cart[id] || 0) + 1; saveCart();
    const p = PRODUCTS.find(x => x.id === id); toast(`${p.n} añadido a la cesta`);
    flyToCart(b.closest('.product').querySelector('.cut'));
  });
  function flyToCart(el) {
    if (!el || root.classList.contains('no-motion')) return;
    const r = el.getBoundingClientRect(), t = $('#cartBtn').getBoundingClientRect();
    const f = el.cloneNode(); f.removeAttribute('class'); f.alt = '';
    Object.assign(f.style, { position: 'fixed', left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px', objectFit: 'contain', zIndex: 200, pointerEvents: 'none', transition: 'all .8s cubic-bezier(.5,-0.3,.7,1)', filter: 'drop-shadow(0 10px 10px rgba(0,0,0,.3))' });
    document.body.appendChild(f);
    requestAnimationFrame(() => Object.assign(f.style, { left: t.left + 'px', top: t.top + 'px', width: '30px', height: '30px', opacity: .4, transform: 'rotate(360deg)' }));
    setTimeout(() => f.remove(), 850);
  }
  const addToCart = (id, el) => { cart[id] = (cart[id] || 0) + 1; saveCart(); const p = PRODUCTS.find(x => x.id === id); toast(`${p.n} añadido a la cesta`); flyToCart(el); };

  /* ---------- Carrito ---------- */
  const drawer = $('#drawer'), overlay = $('#overlay');
  const openCart = () => { drawer.classList.add('open'); drawer.setAttribute('aria-hidden', 'false'); overlay.hidden = false; $('#closeCart').focus(); };
  const closeCart = () => { drawer.classList.remove('open'); drawer.setAttribute('aria-hidden', 'true'); overlay.hidden = true; };
  $('#cartBtn').addEventListener('click', openCart);
  $('#closeCart').addEventListener('click', closeCart);
  overlay.addEventListener('click', closeCart);
  function cartTotal() { return Object.entries(cart).reduce((s, [id, q]) => s + PRODUCTS.find(p => p.id == id).p * q, 0); }
  function saveCart() {
    Object.keys(cart).forEach(k => { if (cart[k] <= 0) delete cart[k]; });
    store.set('cart', cart); renderCart();
    const b = $('#cartCount'); b.classList.remove('bump'); void b.offsetWidth; b.classList.add('bump');
  }
  function renderCart() {
    const items = Object.entries(cart);
    $('#cartCount').textContent = items.reduce((s, [, q]) => s + q, 0);
    $('#cartList').innerHTML = items.length ? items.map(([id, q]) => {
      const p = PRODUCTS.find(x => x.id == id);
      return `<li><span class="e"><img src="${img(p.k)}" alt=""></span><div class="info"><strong>${p.n}</strong><br><small>${eur(p.p)} / ${p.u}</small></div>
        <div class="q"><button data-dec="${id}" aria-label="Quitar uno">−</button><span>${q}</span><button data-inc="${id}" aria-label="Añadir uno">+</button></div></li>`;
    }).join('') : '<li>Tu cesta está vacía</li>';
    $('#cartTotal').textContent = eur(cartTotal());
    const local = items.filter(([id]) => PRODUCTS.find(p => p.id == id).km0).length;
    const saved = items.filter(([id]) => PRODUCTS.find(p => p.id == id).last).reduce((s, [, q]) => s + q, 0);
    $('#ecoMsg').textContent = items.length ? `🌱 ${local} de ${items.length} productos son de km 0${saved ? ` · Salvas ${saved} producto(s) del desperdicio` : ''}` : '';
  }
  $('#cartList').addEventListener('click', e => {
    const inc = e.target.dataset.inc, dec = e.target.dataset.dec;
    if (inc) cart[inc]++; else if (dec) cart[dec]--; else return; saveCart();
  });

  /* ---------- Checkout ---------- */
  let step = 0;
  const modal = $('#checkout'), form = $('#coForm');
  const openModal = m => { m.hidden = false; const f = m.querySelector('input,button'); f && f.focus(); };
  const closeModal = m => { m.hidden = true; };
  $$('[data-close]').forEach(b => b.addEventListener('click', () => closeModal(b.closest('.modal'))));
  $$('.modal').forEach(m => m.addEventListener('click', e => { if (e.target === m) closeModal(m); }));
  $$('[data-modal]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); openModal($('#' + a.dataset.modal)); }));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { $$('.modal').forEach(closeModal); closeCart(); a11yPanel.hidden = true; } });

  $('#checkoutBtn').addEventListener('click', () => {
    if (!Object.keys(cart).length) return toast('Añade algún producto primero 🧺');
    closeCart(); step = 0; showStep(); openModal(modal);
  });
  function showStep() {
    $$('.step', form).forEach((s, i) => s.classList.toggle('on', i === step));
    $$('.steps span', modal).forEach((s, i) => s.classList.toggle('on', i <= step));
    $('#prevStep').style.visibility = step ? 'visible' : 'hidden';
    $('#nextStep').textContent = step === 2 ? `Pagar ${eur(cartTotal() + extra())} 🔒` : 'Siguiente';
    $('#formErr').textContent = '';
  }
  const extra = () => (form.entrega.value.includes('bici') ? 1.5 : 0) + (form.envase.checked ? 1 : 0);
  $('#prevStep').addEventListener('click', () => { step--; showStep(); });
  form.addEventListener('change', () => { if (step === 2) showStep(); });
  form.addEventListener('submit', e => {
    e.preventDefault();
    if (step === 0) {
      const bad = $$('.step.on input', form).find(i => !i.checkValidity());
      if (bad) { $('#formErr').textContent = bad.name === 'rgpd' ? 'Debes aceptar la política de privacidad.' : bad.name === 'tel' ? 'Escribe un teléfono válido (9 cifras).' : 'Escribe tu nombre.'; bad.focus(); return; }
    }
    if (step < 2) { step++; showStep(); return; }
    const total = eur(cartTotal() + extra());
    modal.querySelector('.modal-card').innerHTML = `<div class="success"><div class="big">🎉</div><h2>¡Pedido confirmado!</h2>
      <p>Gracias, <b>${form.nombre.value.replace(/[<>&"]/g, '')}</b>. Total: <b>${total}</b> · ${form.entrega.value} · ${form.pago.value}.</p>
      <p>🌱 Has elegido una compra local y responsable.</p><button class="btn" onclick="location.reload()">Volver a la tienda</button></div>`;
    cart = {}; saveCart(); confetti();
  });

  /* ---------- Escaparate 3D ---------- */
  const sc = $('#escaparate'), scImg = $('#scImg'), stage = $('#scStage');
  let cur = 0, busy = false, auto;
  const AUTO_MS = 7000;
  PRODUCTS.forEach(p => { const i = new Image(); i.src = img(p.k); });
  $('#scTotal').textContent = String(PRODUCTS.length).padStart(2, '0');
  $('#scThumbs').innerHTML = PRODUCTS.map((p, i) => `<button role="tab" aria-selected="${i === 0}" aria-label="${p.n}" data-go="${i}"><img src="${img(p.k)}" alt=""></button>`).join('');
  function paintText(p, i) {
    sc.style.setProperty('--pc', p.c);
    $('#scIndex').textContent = String(i + 1).padStart(2, '0');
    $('#scName').textContent = p.n; $('#scOrigin').textContent = p.o; $('#scDesc').textContent = p.d;
    $('#scTags').innerHTML = [p.km0 && 'Km 0', p.eco && 'Ecológico', p.last && 'Último día · −50 %', 'Temporada: ' + p.season].filter(Boolean).map(t => `<span>${t}</span>`).join('');
    $('#scPrice').textContent = eur(p.p); $('#scUnit').textContent = '/ ' + p.u;
    $$('#scThumbs button').forEach((b, j) => b.setAttribute('aria-selected', j === i));
    const th = $$('#scThumbs button')[i]; th && th.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
  }
  function paintBg(p, first) {
    const a = $('#scBg'), b = $('#scBg2');
    if (first) { a.style.backgroundImage = `url(${field(p.k)})`; return; }
    b.style.backgroundImage = `url(${field(p.k)})`; b.style.opacity = 1;
    setTimeout(() => { a.style.backgroundImage = b.style.backgroundImage; b.style.opacity = 0; }, 900);
  }
  function go(i, dir) {
    if (busy || i === cur) return; busy = true;
    const p = PRODUCTS[i], noMo = root.classList.contains('no-motion');
    const txt = $('#scText'); txt.classList.remove('swap'); void txt.offsetWidth; txt.classList.add('swap');
    paintBg(p);
    if (noMo) { scImg.src = img(p.k); scImg.alt = p.n; paintText(p, i); cur = i; busy = false; return restartAuto(); }
    scImg.className = 'sc-img ' + (dir > 0 ? 'out-left' : 'out-right');
    setTimeout(() => paintText(p, i), 250);
    setTimeout(() => {
      scImg.src = img(p.k); scImg.alt = p.n;
      scImg.className = 'sc-img ' + (dir > 0 ? 'in-right' : 'in-left');
      cur = i; setTimeout(() => { scImg.className = 'sc-img'; busy = false; }, 700);
    }, 480);
    restartAuto();
  }
  const next = () => go((cur + 1) % PRODUCTS.length, 1), prev = () => go((cur - 1 + PRODUCTS.length) % PRODUCTS.length, -1);
  $('#scNext').addEventListener('click', next); $('#scPrev').addEventListener('click', prev);
  $('#scThumbs').addEventListener('click', e => { const b = e.target.closest('[data-go]'); if (b) go(+b.dataset.go, +b.dataset.go > cur ? 1 : -1); });
  $('#scAdd').addEventListener('click', () => addToCart(PRODUCTS[cur].id, scImg));
  $('#scMore').addEventListener('click', () => openFicha(PRODUCTS[cur].id));
  document.addEventListener('keydown', e => {
    if (document.querySelector('.modal:not([hidden])') || /INPUT|TEXTAREA/.test(document.activeElement.tagName)) return;
    const r = sc.getBoundingClientRect(); if (r.bottom < 100 || r.top > innerHeight - 100) return;
    if (e.key === 'ArrowRight') next(); if (e.key === 'ArrowLeft') prev();
  });
  let sx = null;
  stage.addEventListener('pointerdown', e => { sx = e.clientX; });
  addEventListener('pointerup', e => { if (sx === null) return; const dx = e.clientX - sx; sx = null; if (Math.abs(dx) > 50) dx < 0 ? next() : prev(); });
  // flotación + inclinación 3D siguiendo el ratón
  let mx = 0, my = 0;
  stage.addEventListener('pointermove', e => { const r = stage.getBoundingClientRect(); mx = (e.clientX - r.left) / r.width - .5; my = (e.clientY - r.top) / r.height - .5; });
  stage.addEventListener('pointerleave', () => { mx = my = 0; });
  (function floatLoop(t) {
    if (!root.classList.contains('no-motion')) {
      const fy = Math.sin(t / 900) * 18;
      scImg.style.setProperty('--fy', fy + 'px');
      scImg.style.setProperty('--ry', (mx * 30 + Math.sin(t / 1600) * 6) + 'deg');
      scImg.style.setProperty('--rx', (-my * 22) + 'deg');
      scImg.style.setProperty('--rz', (Math.sin(t / 1300) * 3) + 'deg');
      sc.style.setProperty('--ss', (1 - fy / 60).toFixed(3)); sc.style.setProperty('--so', (0.75 - fy / 60).toFixed(3));
      $('.sc-shadow').style.transform = `scaleX(${1 + fy / 60})`; $('.sc-shadow').style.opacity = .75 + fy / 70;
    }
    requestAnimationFrame(floatLoop);
  })(0);
  function restartAuto() {
    clearInterval(auto); const bar = $('#scBar');
    bar.style.transition = 'none'; bar.style.width = '0';
    if (root.classList.contains('no-motion')) return;
    requestAnimationFrame(() => requestAnimationFrame(() => { bar.style.transition = `width ${AUTO_MS}ms linear`; bar.style.width = '100%'; }));
    auto = setInterval(() => { if (!document.hidden && !sc.matches(':hover')) next(); else restartAuto(); }, AUTO_MS);
  }
  scImg.src = img(PRODUCTS[0].k); scImg.alt = PRODUCTS[0].n; paintText(PRODUCTS[0], 0); paintBg(PRODUCTS[0], true); restartAuto();

  /* ---------- Del campo (mosaico) ---------- */
  $('#mosaic').innerHTML = PRODUCTS.map((p, i) => `
    <button class="reveal" data-ficha="${p.id}" aria-label="Ficha de ${p.n}">
      <img class="bg" src="${field(p.k)}" alt="" loading="lazy"><img class="mini" src="${img(p.k)}" alt="" loading="lazy">
      <span class="cap"><strong>${p.n}</strong><small>${p.o}</small></span>
    </button>`).join('');
  $('#mosaic').addEventListener('click', e => { const b = e.target.closest('[data-ficha]'); if (b) openFicha(+b.dataset.ficha); });

  /* ---------- Ficha de producto ---------- */
  let fichaId = null;
  function openFicha(id) {
    const p = PRODUCTS.find(x => x.id === id); fichaId = id;
    $('#fHarvest').src = field(p.k); $('#fProd').src = img(p.k); $('#fProd').alt = p.n;
    $('#fOrigin').textContent = p.o; $('#fName').textContent = p.n; $('#fDesc').textContent = p.d; $('#fHow').textContent = p.how;
    $('#fFacts').innerHTML = `<div><b>${p.season}</b>Temporada</div><div><b>${p.kcal} kcal</b>por 100 g</div><div><b>${p.o.includes('km') ? p.o.split('· ')[1] : 'Península'}</b>Distancia</div>`;
    $('#fPrice').textContent = eur(p.p); $('#fUnit').textContent = ' / ' + p.u;
    const cr = CREDITS[p.k] || {}; $('#fCredit').textContent = `Fotos: ${cr.h || ''} · ${cr.p || ''}`;
    openModal($('#ficha'));
  }
  $('#fAdd').addEventListener('click', () => { addToCart(fichaId, $('#fProd')); });

  $('#creditsList').innerHTML = CREDITS_FULL.map(c => `<li><b>${c.k.startsWith('p_') ? 'Producto' : 'Campo'} · ${c.k.slice(2)}:</b> «${c.t}» — ${c.a} — ${c.l} — <a href="${c.u}" target="_blank" rel="noopener">ver original</a></li>`).join('');

  /* ---------- Medidas ---------- */
  $('#timeline').innerHTML = MEASURES.map((m, i) => `
    <div class="measure reveal" style="--c:${m.c}">
      <button class="head" aria-expanded="false" aria-controls="m${i}">
        <span class="num">${m.i}</span><span class="h-text"><strong>${i + 1}. ${m.t}</strong><small>Eje: ${m.s}</small></span><span class="arrow">▾</span>
      </button>
      <div class="body" id="m${i}">
        <ul>${m.a.map(x => `<li>${x}</li>`).join('')}</ul>
        <small>Grado de implantación: ${m.p}%</small>
        <div class="progress"><div data-w="${m.p}"></div></div>
        <div class="ods-tags">${m.ods.map(o => `<span class="ods-tag" style="background:${ODS[o].c}">ODS ${o}</span>`).join('')}</div>
      </div>
    </div>`).join('');
  $$('.measure .head').forEach(h => h.addEventListener('click', () => {
    const m = h.parentElement, body = m.querySelector('.body'), open = h.getAttribute('aria-expanded') !== 'true';
    h.setAttribute('aria-expanded', open); m.setAttribute('open-state', open);
    body.style.maxHeight = open ? body.scrollHeight + 'px' : 0;
    const bar = body.querySelector('.progress div'); setTimeout(() => bar.style.width = open ? bar.dataset.w + '%' : 0, 60);
  }));

  /* ---------- ODS ---------- */
  $('#odsGrid').innerHTML = Object.entries(ODS).map(([n, o]) => `
    <button class="flip reveal" style="--c:${o.c}" aria-label="ODS ${n}: ${o.n}. Pulsa para ver más">
      <div class="flip-inner">
        <div class="face front" style="background:${o.c}"><span class="ic">${o.ic}</span><span class="n">${n}</span><strong>${o.n}</strong></div>
        <div class="face back"><strong style="color:${o.c}">ODS ${n}</strong><p>${o.d}</p></div>
      </div>
    </button>`).join('');
  $$('.flip').forEach(f => f.addEventListener('click', () => f.classList.toggle('flipped')));

  /* ---------- CO2 ---------- */
  const km = $('#km'), DIESEL = 0.25;
  function calcCO2() {
    const d = +km.value, f = +$('input[name=del]:checked').value;
    $('#kmOut').textContent = d.toLocaleString('es-ES');
    const trip = d * 2, base = trip * DIESEL, mine = trip * f, saved = base - mine, pct = Math.round(saved / base * 100);
    $('#savedPct').textContent = pct + '%';
    const bar = $('#gaugeBar'); bar.style.strokeDashoffset = 327 - 327 * pct / 100;
    bar.style.stroke = pct > 70 ? 'var(--primary)' : pct > 20 ? 'var(--accent2)' : 'var(--danger)';
    const year = saved * 52;
    $('#co2Text').innerHTML = pct ? `Ahorras <b>${(saved * 1000).toFixed(0)} g de CO₂</b> por pedido.<br>Comprando cada semana: <b>${year.toFixed(1)} kg al año</b> 🌳` : 'Esta opción es la que más contamina. ¡Prueba la bici o la recogida! 🚲';
    const nTrees = Math.min(10, Math.round(year / 5));
    $('#trees').innerHTML = Array.from({ length: nTrees }, (_, i) => `<span style="animation-delay:${i * 60}ms">🌳</span>`).join('');
  }
  km.addEventListener('input', calcCO2);
  $$('input[name=del]').forEach(r => r.addEventListener('change', calcCO2));
  calcCO2();

  /* ---------- Contraseña ---------- */
  const pwd = $('#pwd');
  $('#pwdShow').addEventListener('click', () => { pwd.type = pwd.type === 'password' ? 'text' : 'password'; });
  pwd.addEventListener('input', () => {
    const v = pwd.value, r = { len: v.length >= 12, up: /[A-Z]/.test(v), low: /[a-z]/.test(v), num: /\d/.test(v), sym: /[^A-Za-z0-9]/.test(v) };
    $$('#pwdChecks li').forEach(li => li.classList.toggle('ok', r[li.dataset.k]));
    let s = Object.values(r).filter(Boolean).length; if (/^(123|password|qwerty|contraseña)/i.test(v)) s = 1;
    const lv = [['Empieza a escribir…', '0%', 'var(--border)'], ['Muy débil 😟', '20%', '#d64545'], ['Débil 😐', '40%', '#ff7b54'], ['Aceptable 🙂', '60%', '#ffcf4a'], ['Fuerte 💪', '80%', '#7cc96b'], ['¡Muy fuerte! 🛡️', '100%', '#1f7a4d']][v ? s : 0];
    $('#pwdLabel').textContent = lv[0]; Object.assign($('#pwdBar').style, { width: lv[1], background: lv[2] });
  });

  /* ---------- Phishing ---------- */
  const PHISH = [
    { q: '📧 «Tu pedido está retenido. Paga 1,99 € de aduanas aquí: http://despensa-barri0-pago.xyz»', a: 'fake', w: 'Dominio raro con un cero en vez de «o» y prisa por pagar: ¡fraude!' },
    { q: '🔒 https://ladespensadelbarrio.es/carrito — con candado y nuestro dominio de siempre', a: 'ok', w: 'Dominio correcto y conexión HTTPS: es de fiar.' },
    { q: '📱 SMS: «Has ganado un vale de 500 €. Introduce tu PIN de la tarjeta para canjearlo»', a: 'fake', w: 'Nadie legítimo te pedirá nunca el PIN de tu tarjeta.' },
    { q: '📲 Bizum te pide confirmar el pago de 12,40 € en tu propia app del banco tras hacer tu pedido', a: 'ok', w: 'Confirmas tú en tu app oficial un importe que conoces: correcto.' }
  ];
  let pi = 0;
  const showPhish = () => { $('#phishQ').textContent = PHISH[pi].q; };
  showPhish();
  $$('[data-ans]').forEach(b => b.addEventListener('click', () => {
    const it = PHISH[pi], ok = b.dataset.ans === it.a;
    $('#phishFb').innerHTML = (ok ? '✅ <b>¡Correcto!</b> ' : '❌ <b>Ojo:</b> ') + it.w;
    pi = (pi + 1) % PHISH.length; setTimeout(showPhish, 1600);
  }));

  /* ---------- Quiz ---------- */
  const QUIZ = [
    { q: '¿Qué indica el candado 🔒 junto a la dirección web?', o: ['Que la tienda es barata', 'Que la conexión está cifrada (HTTPS)', 'Que la web es accesible'], a: 1 },
    { q: '¿Qué ODS se relaciona con reducir el desperdicio de alimentos?', o: ['ODS 12', 'ODS 3', 'ODS 16'], a: 0 },
    { q: '¿Qué hace más inclusiva una tienda online?', o: ['Solo aceptar pagos con tarjeta', 'Permitir letra grande y pedidos por teléfono', 'Usar muchos vídeos y animaciones'], a: 1 },
    { q: '¿Qué opción de entrega contamina menos?', o: ['Furgoneta diésel', 'Furgoneta eléctrica', 'Recogida en tienda andando'], a: 2 },
    { q: '¿Qué ley europea protege tus datos personales?', o: ['RGPD', 'IVA', 'WCAG'], a: 0 }
  ];
  let qi = 0, score = 0;
  function renderQuiz() {
    const box = $('#quizBox');
    if (qi >= QUIZ.length) {
      const medal = score === 5 ? '🏆' : score >= 3 ? '🥈' : '📚';
      box.innerHTML = `<div class="result"><div class="big">${medal}</div><h3>Has acertado ${score} de ${QUIZ.length}</h3>
        <p>${score === 5 ? '¡Eres experto/a en comercio digital responsable!' : 'Repasa las medidas y vuelve a intentarlo.'}</p><button class="btn" id="qAgain">Repetir</button></div>`;
      $('#qAgain').onclick = () => { qi = 0; score = 0; renderQuiz(); };
      if (score === 5) confetti();
      return;
    }
    const it = QUIZ[qi];
    box.innerHTML = `<div class="q-progress"><div style="width:${qi / QUIZ.length * 100}%"></div></div>
      <small>Pregunta ${qi + 1} de ${QUIZ.length}</small><h3>${it.q}</h3>
      <div class="opts">${it.o.map((o, i) => `<button class="opt" data-i="${i}">${o}</button>`).join('')}</div>`;
    $$('.opt', box).forEach(b => b.addEventListener('click', () => {
      const i = +b.dataset.i;
      $$('.opt', box).forEach(x => x.disabled = true);
      b.classList.add(i === it.a ? 'right' : 'wrong');
      $$('.opt', box)[it.a].classList.add('right');
      if (i === it.a) score++;
      setTimeout(() => { qi++; renderQuiz(); }, 1100);
    }));
  }
  renderQuiz();

  /* ---------- Cookies ---------- */
  if (store.get('cookies', null) !== null) $('#cookie').classList.add('hide');
  $$('[data-cookie]').forEach(b => b.addEventListener('click', () => {
    store.set('cookies', b.dataset.cookie); $('#cookie').classList.add('hide');
    toast(b.dataset.cookie === 'si' ? 'Preferencias guardadas ✅' : 'Solo usaremos cookies técnicas 👍');
  }));

  /* ---------- Animaciones de scroll ---------- */
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .12 });
  $$('.reveal').forEach(el => io.observe(el));
  const countIO = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return; countIO.unobserve(e.target);
    const end = +e.target.dataset.count, t0 = performance.now();
    const tick = t => { const k = Math.min(1, (t - t0) / 1500); e.target.textContent = Math.round(end * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  }));
  $$('[data-count]').forEach(el => countIO.observe(el));
  const toTop = $('#toTop');
  addEventListener('scroll', () => toTop.classList.toggle('show', scrollY > 600), { passive: true });
  toTop.addEventListener('click', () => scrollTo({ top: 0 }));

  /* ---------- Confeti ---------- */
  function confetti() {
    if (root.classList.contains('no-motion')) return;
    const c = $('#confetti'), x = c.getContext('2d'); c.width = innerWidth; c.height = innerHeight;
    const cols = ['#1f7a4d', '#2fb37a', '#ff8a3d', '#ffcf4a', '#dd1367', '#00689d'];
    const ps = Array.from({ length: 160 }, () => ({ x: Math.random() * c.width, y: -20 - Math.random() * c.height / 2, vx: (Math.random() - .5) * 4, vy: 2 + Math.random() * 4, r: 4 + Math.random() * 6, c: cols[Math.random() * cols.length | 0], a: Math.random() * 6 }));
    let n = 0;
    (function loop() {
      x.clearRect(0, 0, c.width, c.height);
      ps.forEach(p => { p.x += p.vx; p.y += p.vy; p.a += .1; x.save(); x.translate(p.x, p.y); x.rotate(p.a); x.fillStyle = p.c; x.fillRect(-p.r / 2, -p.r / 2, p.r, p.r * .6); x.restore(); });
      if (++n < 220) requestAnimationFrame(loop); else x.clearRect(0, 0, c.width, c.height);
    })();
  }

  renderProducts(); renderCart();
})();
