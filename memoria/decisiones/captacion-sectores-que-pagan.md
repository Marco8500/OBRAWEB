---
tipo: decision
fecha: 2026-11-19
origen: sesión principal de OBRAWEB
---
# captación sectores que pagan

**Contexto**: las 5 ventas perdidas fueron en barberías: ticket bajo, se mueven por Instagram y Booksy. Con 100 búsquedas de SerpApi al mes, cada una tiene que ir a un sector que pueda pagar.
**Qué se decidió**:
- **No buscar** barberías ni peluquerías.
- **Sí buscar**: empresas de reformas, fontaneros, electricistas, instaladores de aire acondicionado, placas solares, fisioterapia, podólogos, clínicas estéticas, talleres mecánicos, autoescuelas, academias, carpinterías, cerrajeros, pintores y casas rurales.
- **Dónde**: ciudades medianas (20.000–100.000 habitantes), donde hay menos agencias llamando y "somos de la zona" pesa. Para el resto de España se cambian las ciudades, no los sectores.
- **Filtro** (desde el 19/11): sin web o solo con redes (Facebook, Instagram, Linktree), cualquier teléfono español (también fijos con 9: el proceso empieza con una llamada y el closer pide el móvil después), 10 reseñas o más (los oficios tienen pocas), nota de 4 o más, abierto y en España.
- **Salida**: filas `Negocio;Teléfono;Sector;Ciudad;Reseñas` para Importar en obratuweb.netlify.app/equipo. Los `;` del nombre se cambian por `,`.

**Escenario de Make "Captación"** (id 7968622): un iterator con líneas `Sector|Ciudad`, luego SerpApi Google Maps, el filtro y el resultado guardado por búsqueda en el almacén "Estado captación" (campo `datos`, filas separadas por ` || `).
- Gasta unos 4 créditos de Make por búsqueda, no 25–45.
- La API de Make no lanza escenarios inactivos ("Run once" solo existe en el editor). Desde aquí hay que pausar un momento el chatbot de OBRAWEB; el de SERMAK nunca, porque es de un cliente.

**Prueba del 19/11** (5 búsquedas): salieron 4 leads, unos 0,8 por búsqueda, muy por debajo de los 3–5 previstos. Con este filtro tan estricto, las 25 búsquedas que quedan este mes dan unos 20 leads; para llegar a ~260 al mes hace falta la búsqueda a mano de los closers o relajar el filtro.

**Con el filtro relajado (19/11, 10 búsquedas)**: 20 leads, 2 por búsqueda. Talleres mecánicos dan muchísimo (10 en Manises); cerrajeros, nada (todos tienen webs de captación tipo pages.dev). La ciudad de la búsqueda no siempre es la del negocio: revisar con la dirección.
**Resultado sin filtrar**: el escenario guarda también todo lo que devuelve SerpApi en `sin filtrar|Sector|Ciudad`, para volver a filtrar sin gastar búsquedas. De ahí salen leads con **web gratuita o de terceros** (wixsite, jimdo, sites.google, Booking, Escapada Rural, fichas de directorio): candidatos a añadir al filtro sin módulo HTTP.
**Búsqueda a mano**: el Closer 1 busca 10 leads al día en Google Maps con estos criterios y los mete con Nuevo en la app (decisión del 19/11; ponerlo como tarea fija en la app, que no se puede desde aquí).
**En la app**: la importación descartará los teléfonos que ya estén. Está hecho pero aún no publicado; hasta entonces, revisar a ojo los repetidos.

Relacionado: [[prospectos-en-toda-espana]], [[prospectos-de-directorios-viejos]], [[demo-antes-de-preguntar]], [[creditos-make]], [[productor-de-ventas]]
