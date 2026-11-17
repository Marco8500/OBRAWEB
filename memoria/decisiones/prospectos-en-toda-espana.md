---
tipo: decision
fecha: 2026-11-11
origen: sesión principal de OBRAWEB
---
# prospectos en toda españa

Marco quiere que las próximas búsquedas de negocios sin web cubran **toda España**, no solo València y alrededores. Como se trabaja a distancia (WhatsApp, demo por enlace, Netlify), da igual dónde esté el negocio.
**Cómo**: igual que en [[prospectos-de-directorios-viejos]]: Google Maps con el escenario "Captación" de Make, filtrando sin web, con teléfono y abiertos. Repartir las búsquedas entre ciudades y pueblos medianos de distintas provincias (en las capitales grandes casi todos tienen web) y pasar `ll` con las coordenadas de cada sitio.
**Qué funciona (13/11)**: ciudades medianas y pueblos (Lorca, Ponferrada, Jaén, Utrera, Andújar…) dan muchos negocios sin web; los dentistas sin web salen en pueblos, no en capitales. Ojo: nombres como Mérida o Zamora traen resultados de México: descartar teléfonos +52. Una búsqueda de 29 consultas tardó 40 s y gastó unos 117 créditos de Make.
**Para el panel del equipo (17/11)**: obratuweb.netlify.app/equipo importa leads pegando filas `Negocio;Teléfono;Sector;Ciudad;Reseñas`, una por negocio. Marco quiere solo móviles (6 o 7), no fijos con 9: el filtro de Make es `replace(phone; " "; "")` empieza por `+346` o `+347`. Los escenarios activos ahora son los chatbots de OBRAWEB y SERMAK; para buscar se pausa un minuto el de OBRAWEB.
**Ojo**: cada búsqueda gasta 1 de las 100 de SerpApi al mes; con varias ciudades por sector se agotan rápido.

Relacionado: [[prospectos-noviembre]], [[creditos-make]]
