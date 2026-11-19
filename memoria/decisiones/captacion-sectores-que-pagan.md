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
- **Filtro**: sin web o solo con redes (Facebook, Instagram, Linktree), móvil (6/7), 20 reseñas o más, nota de 4 o más, abierto y en España.
- **Salida**: filas `Negocio;Teléfono;Sector;Ciudad;Reseñas` para Importar en obratuweb.netlify.app/equipo. Los `;` del nombre se cambian por `,`.

**Escenario de Make "Captación"** (id 7968622): un iterator con líneas `Sector|Ciudad`, luego SerpApi Google Maps, el filtro y el resultado guardado por búsqueda en el almacén "Estado captación" (campo `datos`, filas separadas por ` || `).
- Gasta unos 4 créditos de Make por búsqueda, no 25–45.
- La API de Make no lanza escenarios inactivos ("Run once" solo existe en el editor). Desde aquí hay que pausar un momento el chatbot de OBRAWEB; el de SERMAK nunca, porque es de un cliente.

**Prueba del 19/11** (5 búsquedas): salieron 4 leads, unos 0,8 por búsqueda, muy por debajo de los 3–5 previstos. Con este filtro tan estricto, las 25 búsquedas que quedan este mes dan unos 20 leads; para llegar a ~260 al mes hace falta la búsqueda a mano de los closers o relajar el filtro.

**En la app**: la importación descartará los teléfonos que ya estén. Está hecho pero aún no publicado; hasta entonces, revisar a ojo los repetidos.

Relacionado: [[prospectos-en-toda-espana]], [[prospectos-de-directorios-viejos]], [[demo-antes-de-preguntar]], [[creditos-make]], [[productor-de-ventas]]
