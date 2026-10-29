---
tipo: cliente
fecha: 2026-10-25
origen: sesión "Landing minimalista y moderna"
---
# sermak

Relojes personalizados por encargo (WhatsApp 645 763 617). Objetivo de la web: que el cliente escriba por WhatsApp para encargar su reloj.
**Qué se hizo**: landing minimalista sin contador ni formulario de email, tres relojes como "Vendido" (Cronógrafo Panda, Deportivo Blanco, Octogonal Azul), test "Descubre tu reloj ideal" de 6 preguntas que manda el diseño por WhatsApp, y chatbot.
**Chatbot**: primero por palabras clave; luego conectado a Claude a través de un Cloudflare Worker (`sermak-chat/`, guía en `INSTRUCCIONES.md`). No está activo: falta la clave de Anthropic del cliente. Sin clave contesta con las respuestas fijas.
**Revisar con él**: opciones de personalización, grabado, Instagram (`instagram.com/sermak`), precios y plazos.

Relacionado: [[ia-de-pago-detras-de-un-servidor]], [[chatbot-sin-ia-en-demos]], [[pendientes-clientes]]
