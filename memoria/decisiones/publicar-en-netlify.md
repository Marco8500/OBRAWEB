---
tipo: decision
fecha: 2026-10-22
origen: sesiones de la web de OBRAWEB y ROIG 44
---
# publicar en netlify

Las webs son HTML + CSS + JS sin compilación y se publican arrastrando a **Netlify Drop** (Deploys → Drag and drop). Se entregan en `.zip` con capturas de móvil (390 px) y escritorio.
- Si Netlify "no lo lee": arrastrar la **carpeta** con `index.html` en la raíz, no un zip dentro de otro. Si el cliente lo prefiere, todo en un único `index.html` con las fotos incrustadas (como [[roig-44]]); entonces cambiar fotos exige regenerar el archivo.
- Formularios: Netlify Forms (`data-netlify="true"`, `form-name`, honeypot). Tras el primer deploy, activar *Forms → Enable form detection* y el aviso por email.
- Tras subir, comprobar que el último deploy pone **Published** y mirar en incógnito.

Relacionado: [[chatbot-no-se-veia-por-cache]], [[web-obraweb]]
