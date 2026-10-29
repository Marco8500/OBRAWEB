---
tipo: error
fecha: 2026-10-22
origen: sesión "Automatización Make: web a Instagram"
---
# openai api sin saldo

**Síntoma**: la publicación automática en Instagram falló en el primer paso con `429 You have no credits remaining`.
**Causa**: la API de OpenAI no tenía saldo. **ChatGPT Plus y la API de OpenAI son cuentas separadas**.
**Regla**: antes de montar un escenario con OpenAI, comprobar que la API tiene saldo. Para texto, mejor la IA de Make (ya incluida en los créditos).

Relacionado: [[imagenes-ia-gratis-se-ven-mal]], [[instagram-necesita-pagina-de-facebook]]
