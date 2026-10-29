---
tipo: decision
fecha: 2026-10-22
origen: sesión "INVICTO Barber Shop landing"
---
# calendario reservas por barbero

**Problema**: el primer calendario bloqueaba solo 30 min aunque el servicio durase más, y solo admitía un cliente por hora aunque hubiera varios barberos.
**Solución**: el cliente elige barbero; cada servicio bloquea lo que dura; las horas ocupadas de ese barbero no se ven. La barbería tiene una agenda privada con PIN. Se guarda en Google Sheets con Apps Script.
**Regla**: al publicar el script, acceso **"Cualquier usuario"** (con "Cualquier usuario con cuenta de Google" no funciona). Probar reservando desde el móvil y mirando desde el ordenador que la hora queda bloqueada. Desde el contenedor no se puede probar Google Sheets.

Relacionado: [[invicto-barber-shop]], [[plantilla-barberia]]
