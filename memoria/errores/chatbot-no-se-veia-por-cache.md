---
tipo: error
fecha: 2026-10-21
origen: sesión "Sitio web: eliminar precios y agregar presupuesto/WhatsApp"
---
# chatbot no se veía por caché

**Síntoma**: tras subir la web a Netlify no aparecía el chatbot.
**Causa**: el navegador usaba una versión vieja de `datos.js` sin la URL del chatbot (o se subió un zip anterior).
**Solución**: el chat aparece aunque `datos.js` sea viejo, y la web pide siempre la versión nueva del archivo.
**Regla**: tras desplegar, comprobar el deploy **Published** en Netlify y probar en incógnito o con Ctrl+Shift+R.

Relacionado: [[publicar-en-netlify]], [[chatbot-con-make]]
