---
tipo: error
fecha: 2026-11-11
origen: sesión principal de OBRAWEB
---
# prospectos de directorios viejos

**Síntoma**: la primera lista de 20 "negocios sin web" salió de directorios (Páginas Amarillas, qdq, Empresite, Booksy): muchos tenían web y varios estaban cerrados.
**Causa**: los directorios están desactualizados y no dicen si hay web. Desde el contenedor no se puede abrir Google Maps.
**Solución**: buscar en Google Maps con el escenario de Make "Captación" (SerpApi `searchGoogleMaps`), filtrando `website` vacío, con teléfono y `open_state` sin "permanentemente"/"temporalmente". Para leer los resultados desde aquí se guardan en el almacén de datos "Estado captación" y se leen con la API de Make; luego se deja todo como estaba.
**Regla**: nunca dar prospectos sacados solo de directorios. Para ejecutar el escenario hace falta un hueco de los 2 escenarios activos (se pausó un momento el chatbot de Entra). Cada búsqueda gasta 1 de las 100 de SerpApi gratis y unos 30 créditos de Make por ejecución. Las clínicas dentales casi todas tienen web: sector malo para "sin web".

Relacionado: [[prospectos-noviembre]], [[creditos-make]], [[web-no-se-ve-desde-el-contenedor]]
