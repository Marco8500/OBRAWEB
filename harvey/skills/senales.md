# Señales — qué buscar en cada pyme

Cada prospecto lleva una lista `senales` con los códigos que **has comprobado tú** (con URL en `fuentes`).
Si no lo has visto, no es señal. La nota sale de sumar puntos (mínimo 0, máximo 10).
El primer email debe mencionar **una** de estas señales: es el motivo por el que les escribimos.

## Señales de oportunidad (suman)

| Código | Qué significa | Cómo comprobarlo | Puntos |
|---|---|---|---|
| `SIN_WEB` | Tiene ficha (Google, directorio) y teléfono, pero no web propia | Buscar nombre + ciudad; solo salen directorios/redes | +3 |
| `SIN_RESERVA_ONLINE` | No se puede pedir cita/reserva/presupuesto online; fuera de horario se pierden clientes | Revisar web y ficha: solo teléfono | +2 |
| `DEPENDE_DE_DIRECTORIO` | Las citas van por Fresha/Treatwell/Doctoralia/TheFork (pagan comisión o cuota) | Enlaces de reserva a terceros | +1 |
| `WEB_ANTIGUA` | Diseño viejo, sin HTTPS, © de hace años, no se ve bien en móvil, muy lenta | Abrir la web; mirar pie de página y versión móvil | +2 |
| `BLOG_ABANDONADO` | Empezaron blog/noticias y lo dejaron (última entrada > 1 año) | Sección blog/noticias | +1 |
| `ANUNCIOS_ACTIVOS` | Pagan Google Ads o Meta Ads: hay presupuesto de marketing | Resultado "Patrocinado" en Google; Biblioteca de anuncios de Meta | +2 |
| `BUENAS_RESENAS` | ≥ 4,3 estrellas y ≥ 30 reseñas: negocio sano que puede pagar | Ficha de Google / directorio | +1 |
| `RESENAS_SIN_RESPONDER` | Muchas reseñas sin respuesta del negocio (automatizable) | Ficha de Google | +1 |
| `CRECIENDO` | Nueva sede, reforma, apertura, ofertas de empleo | Web, redes, InfoJobs/Indeed, prensa local | +1 |
| `SIN_WHATSAPP_NEGOCIO` | Atienden solo por teléfono, sin WhatsApp Business ni formulario | Web y ficha | +1 |
| `AGENCIA_ACTUAL` | Su web la hizo una agencia (crédito en el pie). Anótala en `agencia_actual` | Pie de página | 0 (dato útil, no suma) |

## Señales de descarte (restan)

| Código | Qué significa | Puntos |
|---|---|---|
| `CADENA_O_FRANQUICIA` | Decide la central, no el local | −4 |
| `WEB_MUY_BUENA` | Web moderna con reserva online y buen SEO | −3 |
| `CERRADO_O_TRASPASO` | Cerrado temporal/permanente, en traspaso | descartar |
| `EN_BAJAS` | Está en `harvey/data/bajas.json` | descartar, no contactar nunca |

## Cómo comprobar el email (`email_estado`)

- `verificado`: aparece publicado por el propio negocio en su web o en su ficha oficial.
- `probable`: aparece en un directorio de terceros pero no en su web.
- `desconocido`: no hay email público → canal llamada, formulario o WhatsApp de empresa.
- **Nunca adivines** emails (info@, nombre@...). Si no lo has visto publicado, no existe.
- Solo se crea borrador en Gmail si `email_estado` es `verificado` o `probable`.
