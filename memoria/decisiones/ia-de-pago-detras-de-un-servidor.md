---
tipo: decision
fecha: 2026-10-25
origen: sesión "Landing minimalista y moderna" (Sermak)
---
# ia de pago detrás de un servidor

Una web estática no puede llevar la clave de una IA: cualquiera la copiaría y gastaría el saldo. Para Sermak se hizo un Cloudflare Worker gratuito (`dist/worker-bundle.js`): la web le manda la pregunta y el Worker llama a Claude con la clave guardada como secreto y solo acepta peticiones desde la web del cliente.
**Regla**: la clave es del cliente, con límite de gasto. Si la IA falla, el chat vuelve a las respuestas fijas. Lo que no se ha probado con la IA real, se dice.

Relacionado: [[sermak]], [[chatbot-sin-ia-en-demos]], [[claves-pegadas-en-el-chat]]
