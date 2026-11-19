# Prompt: vídeos promocionales para otra empresa

Copia el bloque de abajo en una sesión nueva de Claude Code (o de otra IA con acceso a terminal) y rellena los campos entre [corchetes].
Si la sesión tiene acceso a este repositorio, puede reutilizar como plantilla los archivos de `marketing/` de OBRAWEB.

---

```
Actúa como motion designer y diseñador de sonido. Quiero dos vídeos promocionales para una empresa y su banda sonora, generados por código (sin editores de vídeo).

## DATOS DE LA EMPRESA
- Nombre: [NOMBRE]
- Qué hace (una frase): [ej. "clínica de fisioterapia en Torrent"]
- Web: [URL] (si no tiene web, dilo y usa capturas que te pase o escenas solo tipográficas)
- Colores de marca: principal [#HEX], oscuro [#HEX], acento [#HEX] (si no los sé, sácalos de la web o del logo)
- Tipografía: [nombre de Google Fonts o "la que use la web"]
- Logo: [ruta del archivo SVG/PNG o "usa el de la web"]
- Eslogan o frase principal: [ej. "Tu espalda, en buenas manos."]
- 3–5 mensajes clave REALES: [ej. "Primera consulta en 24 h", "Cita online 24/7", "Desde 35 €/sesión", "Más de 100 reseñas en Google"]
- Llamada a la acción final: [ej. "Pide tu cita"] + dato de contacto visible [web o teléfono]
- Público y tono: [ej. "vecinos de 30–60 años, cercano y profesional"]

## REGLAS
1. No inventes cifras, porcentajes, reseñas ni resultados. Usa solo los mensajes que te doy. Si una escena pide un número (gráfica, contador) y no hay dato real, haz la gráfica sin cifras.
2. No uses logos, nombres ni estética de marcas ajenas. Solo la marca de [NOMBRE].
3. Texto en español, frases cortas, legible en móvil.
4. Todo determinista: cada vídeo se dibuja con una función render(t) y se exporta fotograma a fotograma, para que no haya tirones.

## VÍDEO 1 · REEL VERTICAL DE LA WEB (1080×1920, 30 fps, 12–15 s)
Estilo: un portátil en perspectiva sobre una superficie oscura brillante con reflejo (CSS 3D + -webkit-box-reflect), luz ambiental del color de marca detrás, cámara girando despacio. En la pantalla del portátil, cortes rápidos cada 0,5–2 s con un destello blanco breve en cada corte:
- punto de color que late y da paso al logo;
- scroll de la web real (captura de página completa a 1440 px de ancho);
- zoom a la parte de precios o servicios;
- golpe tipográfico a pantalla completa con el mensaje más fuerte;
- (si tiene chatbot o reservas online) zoom a esa parte funcionando;
- cortes rápidos de fotos o trabajos reales;
- cierre: nombre grande + llamada a la acción.
Arriba, fijo, un titular de 2 líneas con el logo. Debajo del portátil, un rótulo por escena (título + subtítulo en color de marca).

## VÍDEO 2 · ANIMACIÓN HORIZONTAL "CINEMATOGRÁFICA" (1920×1080, 60 fps, ~16 s, en bucle)
Para reproducir a pantalla completa en un ordenador y grabarlo con el móvil. Dibujado en <canvas>. Cortes rápidos con destello en cada uno. Escenas (adáptalas a la empresa):
1. Negro con un punto de color que late y explota llenando la pantalla.
2. El nombre letra a letra con rebote y barrido de luz.
3. Hiperespacio de partículas con una frase corta ("Que te encuentren.").
4. Gráfica "ANTES / SIN [solución]" bajando (sin cifras si no hay dato real).
5. Gráfica "CON [NOMBRE]" subiendo + círculo que se completa con ✓.
6. Anillos de puntos girando con un dato clave grande en el centro (ej. "24/7").
7. Tarjeta de interfaz sobre fondo degradado con 3 líneas de beneficios y un interruptor que se enciende.
8. Forma que se deforma (blob) con puntos y el mensaje de la oferta.
9. Rejilla oscura, línea de color que se extiende y estallido de luz horizontal.
10. Nombre gigante + llamada a la acción + contacto.
11. Malla 3D ondulando con el logo flotando; fundido a negro para que el bucle enlace.
Entrega también la versión HTML: se repite sola, F11 para pantalla completa, clic para empezar con sonido, espacio para pausar, y la imagen sincronizada con el audio (currentTime).

## SONIDO (para los dos vídeos)
Banda sonora original generada con Python + numpy (sin samples ni canciones con derechos):
- base electrónica a ~128 BPM (bombo, palmas, hi-hats, bajo, pad de acordes);
- efectos sincronizados con cada escena: whoosh antes de cada corte, golpe grave con platillo en los momentos fuertes, subida de tensión antes del cierre, "tic" por letra, clics de interfaz, "ping" en confirmaciones, notas que bajan en "sin" y que suben en "con";
- reverberación suave, final que enlace en bucle, volumen ≈ −14 LUFS, pico ≤ −1 dB.
Une el audio a cada MP4 (AAC 192 kbps) y guarda también el audio suelto (.m4a).

## CÓMO HACERLO TÉCNICAMENTE
- Capturas de la web con Playwright (Chromium) a 1440×900, incluida una de página completa.
- Escena = página HTML local con window.render(t). Playwright abre la página, llama a render(t) para cada fotograma y hace captura JPEG; ffmpeg monta el vídeo: libx264, yuv420p, crf 18, +faststart.
- Antes de renderizar todo: saca 9–12 fotogramas de muestra, móntalos en una tira y revísalos (legibilidad, colores, que nada se corte). Corrige y solo entonces renderiza entero.
- Comprueba el resultado con ffprobe (duración, que tenga vídeo y audio) y mide el volumen con ebur128.

## ENTREGA
- reel_[nombre]_sonido.mp4 (vertical)
- cine_[nombre]_1080p60_sonido.mp4 (horizontal)
- cine_[nombre].html + cine_[nombre]_sonido.m4a (misma carpeta)
- los scripts para regenerarlo todo
- un resumen de las escenas con sus tiempos y qué suena en cada una
- aviso honesto de lo que no has podido comprobar (por ejemplo, que no has escuchado el audio)
```

---

## Consejos al usarlo
- **Cuanto más concretos los "mensajes clave reales", mejor el vídeo.** "Cita online 24/7" vende; "somos los mejores" no.
- **Para clientes de OBRAWEB:** puede ser un extra del paquete o un argumento de cierre ("además te hacemos el vídeo para Instagram").
- **Pide la muestra antes del vídeo entero:** con la tira de fotogramas ya ves si el estilo encaja.
