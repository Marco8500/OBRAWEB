# MANUAL DEL FUNDADOR OBRAWEB

Todo lo que tienes montado, cómo funciona y qué decisiones quedan pendientes. Solo para ti.
Versión 1 · 20 de noviembre de 2026

---

## 1. La oferta

| | Web | Web + asistente |
|---|---|---|
| Precio | 450 € + IVA (544,50 €) | 550 € + IVA (665,50 €) |
| Cuota | Ninguna | 1.er mes incluido; después 15 € + IVA/mes, sin permanencia |
| Pago | 50 % al empezar · 50 % al terminar · transferencia con factura | Igual |
| Plazo | 10–15 días laborables | Igual |
| Incluye | Adaptada al móvil, preparada para Google y conectada con su ficha de Maps, botones de llamar y WhatsApp, formulario, 1.er año de dominio, 30 días de soporte. Todo es del cliente | + asistente 24/7 |

- **Muestra gratis antes de pagar**, enseñada en una llamada de 15 minutos. Es el centro del proceso de venta.
- **No hacemos:** tiendas online, automatizaciones, redes ni publicidad.
- **Precio innegociable.** Única alternativa permitida: bajar de 550 € a 450 € (sin asistente).
- **IVA:** siempre + IVA y con factura. Las clínicas sanitarias normalmente no lo recuperan: a ellas se les da el total.

**Coste y margen por cliente con asistente:** unos 5 €/mes de Make e IA; la cuota de 15 € deja unos 10 €/mes.

---

## 2. El equipo

| Rol | Persona | Hace | Cobra (propuesta, pendiente de tu confirmación) |
|---|---|---|---|
| Fundador | Tú | Dirección, muestras, cobros, producción, decisiones | — |
| Setter | Closer 1 | Llamadas en frío y citas para la muestra | 10 € por muestra presentada válida + 15 € si acaba en venta |
| Closer | Iván | Presenta la muestra, cierra y cobra el anticipo | 10 % de la venta (45 € / 55 €) |

- **Cita válida:** quien decide, sector objetivo, día y hora en la app, asiste y no es un lead repetido.
- **Comisión de venta:** se gana cuando el cliente ha pagado el 100 % (estado 8, que solo marcas tú). Se paga **el día 5 de cada mes**, contra factura (confirmar con el gestor el alta y la retención).
- **Coste por venta con este modelo:** unos 90–100 €. Te quedan 360–450 € antes de costes e impuestos.
- **Objetivos semanales:**
  - Setter: 60 conversaciones, 6 muestras agendadas, asistencia ≥ 70 %, 10 leads nuevos por día buscados a mano.
  - Closer: presentar todas las muestras, cerrar ≥ 25 %, 0 descuentos, 0 "me lo pienso" sin fecha.
- **Si alguien no llega a los mínimos 2 semanas seguidas:** conversación contigo, 2 semanas de mejora y, si no mejora, menos leads o fuera.

Detalle completo: `comercial/ESTRATEGIA_EQUIPO.md`.

---

## 3. El proceso de venta

```
Lead (Make/SerpApi o a mano) → Setter llama → Muestra agendada (estado 5)
→ Tú preparas la muestra (10–20 min, con plantilla) → Closer la presenta (estado 6)
→ Venta y anticipo (estado 7, ficha automática al Grupo) → Tú llamas en 48 h y produces
→ Entrega y cobro final (estado 8, lo marcas tú) → Comisiones del mes → Pides reseña y referidos
```

**Documentos para el equipo:**
- `GUION_CIERRE.md`: lo que dice el closer en la llamada de la muestra y cómo responde a cada objeción.
- `CONOCIMIENTO_CLOSER.md`: qué incluye cada oferta, qué gana cada sector y vocabulario técnico explicado.
- `PLAN_COMERCIAL.md`: guion de llamada en frío, formación y plan de 30 días.

---

## 4. Captación de leads

**Automática (Make → escenario "Captación")**
- Busca negocios en Google Maps con SerpApi, con búsquedas `Sector|Ciudad`.
- Filtro: sin web o solo con redes, Wix gratis, Jimdo, Google Sites, Booking o Escapada Rural; 10 reseñas o más; nota de 4 o más; abierto; en España. Acepta móviles y fijos.
- Rendimiento medido: unos 2 leads por búsqueda. Los talleres dan mucho más (10 en una búsqueda).
- Límite: **100 búsquedas al mes** en el plan gratis de SerpApi. Make no es el límite (unos 4 créditos por búsqueda).
- Guarda también lo que devuelve SerpApi sin filtrar, para volver a filtrar sin gastar búsquedas.
- La salida ya sale en formato de **Importar** de la app.

**Manual:** el setter busca 10 leads al día en Google Maps con los mismos criterios y los mete con **Nuevo**.

**Sectores prioritarios:** talleres, reformas, oficios e instaladores, clínicas (fisio, podología, estética), academias y autoescuelas, casas rurales.
**Evitar:** peluquerías, barberías, uñas, floristerías de barrio, bares y cerrajeros (tienen webs de captación ajenas).

**Siguiente paso de captación:** prueba de anuncios en Instagram y Facebook (140 €, 2 semanas) con formulario y el setter llamando en menos de 5 minutos. Ver `ESTRATEGIA_EQUIPO.md`, apartado 6.

---

## 5. Herramientas y accesos

| Herramienta | Para qué | Dónde |
|---|---|---|
| **Web** | Captar y dar confianza | `obratuweb.netlify.app` (pronto `obraweb.es`) |
| **Área del equipo** | Leads, Grupo, Informe diario, Panel, comisiones, conexiones | Pie de la web → "¿Eres del equipo? Entrar" |
| **Códigos de acceso** | Uno por persona | Variable `EQUIPO_USUARIOS` en Netlify. Para cambiar uno: editar la variable y volver a publicar |
| **Netlify** | Aloja la web y el área del equipo | Proyecto `obratuweb`. Publica solo desde la rama `main` de GitHub. **No subas zips a mano** |
| **GitHub** | Código de la web, documentos y vídeos | Repositorio `Marco8500/OBRAWEB` |
| **Make** | Chatbot de la web, chatbot de SERMAK y captación | 1.000 créditos/mes y 2 escenarios activos en el plan gratis. Los chatbots comparten créditos con la captación |
| **SerpApi** | Búsquedas de Google Maps | 100 búsquedas/mes gratis |
| **DonDominio** | Compra de `obraweb.es` | Pedido en verificación. Si no se resuelve, cancelar y comprar en IONOS, Hostinger u OVH |

**Límite importante de Netlify (plan gratis):** unas 20 publicaciones al mes para toda la cuenta. Agrupa los cambios de la web. Las webs de clientes, mejor en **Cloudflare Pages** (500 publicaciones al mes, tráfico ilimitado).

---

## 6. Tu rutina

**Cada día (20 min):**
- Panel → **Conexiones del equipo**: ¿han entrado los dos?
- Leads → **Muestras que preparar**: hazlas antes de la cita.
- Grupo: responde dudas y celebra ventas.

**Cada lunes (30 min, reunión con el equipo):**
1. Números de la semana en el Panel (citas, asistencia, cierres).
2. Una llamada buena y una mala de cada uno.
3. Roleplay de la objeción que más se ha repetido.
4. Objetivos y leads de la semana.

**Cada día 5:** revisar **Comisiones a pagar**, recibir las facturas, pagar y marcar "Pagada".

---

## 7. Números y previsiones

- **Objetivo:** 10.000 € al mes de facturación el 1 de enero de 2028.
- **Escenario realista:** unos 8.000–8.500 €/mes en noviembre de 2027, con 13–16 ventas al mes. Se queda cerca, pero no llega.
- **Para llegar:** 4–5 ventas por semana de forma constante, más ventas con asistente o subir el precio en los sectores fuertes cuando haya 10 o más ventas y opiniones de clientes (no antes).
- **Facturación no es beneficio:** a la facturación hay que restarle comisiones, Make, dominios, cuota de autónomo, IRPF y gestor. El IVA tampoco es tuyo: se ingresa a Hacienda cada trimestre.

---

## 8. Cuándo contratar a alguien para producción

Cuando durante 4 semanas se cumplan 2 de estas 3: más de 12–15 webs al mes, más de 25 h semanales tuyas en producción, o entregas de más de 15 días. Empezar con un **freelance pagado por web (100–150 €)** y pasar a media jornada cuando el volumen sea estable 3 meses. Prepara antes las plantillas por sector y una lista de comprobación de entrega.

---

## 9. Legal y administración: pendiente

| Pendiente | Por qué importa |
|---|---|
| **Tu NIF y el número de la calle** en `datos.js` | El aviso legal lo exige (LSSI). Ahora esas líneas están ocultas |
| **Gestor:** alta y retención de los closers; retención en tus facturas | Para pagar comisiones legalmente |
| **Acuerdo de colaboración por escrito** con los dos | Comisiones, pago, mínimos, confidencialidad, registro de conexiones |
| **Informar a los closers** de que la app registra sus conexiones | Obligación de transparencia (protección de datos) |
| **`obraweb.es`** activo y conectado | Credibilidad; luego actualizar web, vídeos y tarjetas nuevas |
| **Opiniones y enlaces del portfolio** | Prueba social real; la web está preparada para mostrarlos |

---

## 10. Decisiones pendientes

1. **Confirmar el pago del setter y del closer** (10 € + 15 € / 10 %). Después ajusto la app.
2. **Plazo de baja del asistente:** ahora son 15 días de aviso en las condiciones.
3. **Fecha de la prueba de anuncios** (140 €).
4. **Plantillas de muestra por sector:** las haces tú o las hago yo.
