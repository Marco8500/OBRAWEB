# OBRAWEB · Demo «Flor & Atelier»

Web de demostración para una floristería botánica artesanal. Es estática (HTML, CSS y JS sin dependencias) y está lista para publicarse en **Netlify** con formularios incluidos.

## Estructura

```
index.html            Página principal (one-page con todas las secciones)
gracias.html          Confirmación de formularios si el navegador no ejecuta JS
404.html              Página de error con la marca
assets/css/styles.css Sistema visual (tokens de marca de design.md)
assets/js/main.js     Interacciones + CONFIG del negocio
assets/img/           Imágenes optimizadas en WebP, logo y favicon
design.md             Guía de diseño «Botanical Atelier»
netlify.toml          Publicación, cabeceras de seguridad y caché
```

## Antes de publicar para un cliente real

1. **WhatsApp**: cambia `whatsapp` en `CONFIG` (`assets/js/main.js`). Todos los botones de la página principal usan ese valor.
   Cambia también el número escrito en `gracias.html`, `404.html` y en los `href` de `index.html`, que sirven de respaldo sin JavaScript.
   El valor actual, `34600000000`, es un número de ejemplo.
2. **Datos que faltan** (no se han inventado): dirección del taller, horario, teléfono fijo, email, redes sociales, zona de reparto y textos legales (aviso legal, privacidad y cookies).
3. **Opiniones y valoraciones** (4,9/5, número de reseñas y testimonios): proceden de la demo original. Hay que sustituirlas por reseñas reales, por ejemplo de Google, antes de usarlas comercialmente.
4. **Formularios**: `pedido` y `club` usan Netlify Forms. En Netlify, activa *Form detection* y configura las notificaciones por email o Slack para recibir los pedidos.
   El descuento del 10 % del Club debe enviarse a mano o con una automatización, por ejemplo Make, Mailchimp o Brevo.

## Desarrollo local

```bash
python3 -m http.server 8000
```

En local, el envío del formulario muestra el aviso de error con la alternativa de WhatsApp, porque Netlify Forms solo funciona una vez desplegada la web.
