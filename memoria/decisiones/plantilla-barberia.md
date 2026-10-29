---
tipo: decision
fecha: 2026-10-23
origen: sesión "INVICTO Barber Shop landing"
---
# plantilla barbería

La web de INVICTO se convirtió en una plantilla genérica "TU BARBERÍA" (monograma TB) sin rastro de INVICTO. Guía en su `README.md`.
- Datos del negocio (nombre, teléfono, WhatsApp, Instagram, dirección) en un solo archivo: `js/negocio.js`.
- Servicios, barberos y horario: `js/reservas-config.js`. La carta de precios sigue en `index.html` (buscar `[PRECIOS]`).
- Logo si no tienen: `python3 herramientas/generar-logo.py "BARBERÍA PACO" BP`. Si tienen, `img/logo.png` y `img/logo.webp`.
- Fotos: sustituir con el mismo nombre de archivo.
- Chat sin Make (responde con los datos de la web). Si pagan la versión con IA, se pone la URL del webhook en `js/chat.js`.

Relacionado: [[invicto-barber-shop]], [[chatbot-sin-ia-en-demos]], [[demo-gratis-para-cerrar]], [[calendario-reservas-por-barbero]]
