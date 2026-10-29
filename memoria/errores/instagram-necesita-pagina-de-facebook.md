---
tipo: error
fecha: 2026-10-22
origen: sesión "Automatización Make: web a Instagram"
---
# instagram necesita página de facebook

**Síntoma**: en el módulo de Instagram de Make el desplegable "Page" salía vacío.
**Causa**: la cuenta de Facebook (infoobraweb) era un **perfil personal** en modo profesional ("Creador digital"), no una página. Make solo publica en cuentas Business/Creator vinculadas a una **página** de Facebook.
**Solución**: crear la página OBRAWEB (categoría Diseñador web), vincularle el Instagram @obratuweb y reautorizar la conexión de Facebook en Make marcando la página y el Instagram. En el módulo, desactivar "Map" para elegir la cuenta en el desplegable.

Relacionado: [[openai-api-sin-saldo]], [[pendientes-make]]
