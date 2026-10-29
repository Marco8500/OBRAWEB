---
tipo: decision
fecha: 2026-10-22
origen: sesiones "Sitio web: eliminar precios..." e "INVICTO"
---
# chatbot con make

El chatbot con IA de la web de OBRAWEB es el escenario de Make "Chatbot web OBRAWEB" (webhook → IA de Make → respuesta). Saludo: "Soy el asistente virtual de OBRAWEB, si tienes alguna duda pregúntame". Su URL va en el campo `chatbot` de `datos.js` (vacío = chat oculto). Si Make falla, ofrece WhatsApp.
- Coste: unos 3 créditos y 4 s por mensaje. La URL del webhook es pública: vigilar el consumo.
- No da precios ni pide datos personales; manda al formulario o al WhatsApp.
- Para INVICTO se copió la misma estructura ("Chatbot web INVICTO Barber Shop"), hoy pausado.
**Regla**: el plan gratis solo deja **2 escenarios activos**; antes de activar uno nuevo, decidir cuál se pausa.

Relacionado: [[creditos-make]], [[chatbot-sin-ia-en-demos]], [[sin-precios-en-la-web]]
