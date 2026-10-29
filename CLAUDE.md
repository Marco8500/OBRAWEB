# OBRAWEB

OBRAWEB es el negocio de Marco Moreno: **páginas web, chatbots, asistentes de captación de clientes y automatizaciones para negocios locales**. Este repo es el "segundo cerebro" del proyecto: lo que se ha decidido, lo que ha fallado, los clientes y el contenido.

- Web: obratuweb.netlify.app · Instagram: @obratuweb · Email: infoobraweb@gmail.com · WhatsApp: +34 641 409 181
- Zona: València y alrededores (Burjassot, Benicalap…).

## A quién vendo

Pequeños negocios de barrio que viven del teléfono y del WhatsApp: barberías y peluquerías, estética, clínicas y fisios, restaurantes, reformas, tiendas y artesanos (como relojes por encargo). No son marcas de lujo: quieren algo que les traiga clientes y les ahorre tiempo, explicado sin tecnicismos.
Lo que más les interesa suele ser una pieza concreta (un chatbot que conteste solo, las citas por WhatsApp) más que "una web".

## Cómo trabajo

1. **Me cuentan qué necesitan** (formulario de presupuesto o WhatsApp).
2. **Les preparo una propuesta y una demo gratis** con su logo, fotos y servicios. Lo que no sé va como marcador `[...]`.
3. **Lo dejo funcionando y les acompaño.**

En la práctica:
- Webs de una página en HTML + CSS + JS sin compilación, adaptadas al móvil, publicadas en **Netlify** (Drop o un único `index.html`). Formularios con Netlify Forms.
- Todo lleva a **pedir presupuesto o escribir por WhatsApp**. En la web de OBRAWEB no hay precios.
- Chatbot por palabras clave en las demos (gratis); con IA (Make o Claude detrás de un Worker) solo si el cliente lo paga.
- Automatizaciones en **Make** (plan gratis: 1.000 créditos al mes y 2 escenarios activos).
- Se entrega un `.zip` con capturas de móvil (390 px) y escritorio, y un README con lo que falta.

## Memoria (leer antes de empezar)

Las sesiones en la nube empiezan de cero: lo único que se recuerda entre sesiones es lo que está en git. La memoria está en [`memoria/`](memoria/README.md), en notas cortas enlazadas con `[[nota]]`:

```
memoria/decisiones/  por qué está hecho así
memoria/errores/     lo que falló y la lección
memoria/clientes/    una nota por cliente o contacto
memoria/contenido/   marca, Instagram, mensajes y portfolio
memoria/pendientes/  listas de tareas abiertas
```

1. **Al empezar una tarea**: lee `memoria/README.md` y busca en `memoria/` las palabras de la tarea (`grep -ril "make" memoria/`). Si una nota dice que algo ya falló o se decidió de otra forma, síguela o explica por qué no.
2. **Al terminar**: si has resuelto un error, tomado una decisión, conocido un cliente o aprendido algo que la siguiente sesión debería saber, crea una nota con `memoria/_plantilla.md`:
   - una lección por nota, título corto en minúsculas que diga la lección (`creditos-make`);
   - en la carpeta que toque, con `tipo:` igual a `decision`, `error`, `cliente`, `contenido` o `pendiente`;
   - con `Relacionado: [[otra-nota]]` hacia las notas que toca;
   - y una línea en `memoria/README.md`.
3. Si una nota se queda vieja, corrígela en vez de añadir otra que la contradiga. Marca los pendientes hechos.
4. Nunca escribas claves, tokens ni contraseñas en las notas.

Gráfico interactivo de la memoria (como la vista de Obsidian):

```sh
python3 dev/grafo-memoria.py memoria.html   # genera la página con todas las notas
```

## Mapa

```
CLAUDE.md                 este archivo
memoria/                  segundo cerebro (notas enlazadas)
dev/grafo-memoria.py      genera el gráfico de memoria/ a partir de la plantilla
dev/grafo-memoria.html    plantilla del gráfico
instagram/                normas de estilo, guiones y scripts de vídeo e imagen (de la sesión "Instagram OBRAWEB")
```

## Reglas

- Todo en español: textos, mensajes, commits y notas.
- **Mensajes a clientes: cortos, cercanos y humanos**, como si los escribiera Marco por WhatsApp. Nada de listas eternas ni emojis en cada línea.
- **No inventar datos del cliente** (precios, horarios, reseñas, equipo). Lo que no se sabe va como `[...]` visible y en la lista de pendientes.
- No publicar ni enseñar una web con la marca de un cliente sin su permiso.
- Probar en móvil (390 px) y escritorio (1440 px) antes de entregar. Lo que no se pueda probar desde el contenedor (Make, Netlify Forms, Google Sheets, IAs reales, la web publicada), se dice.
- Antes de activar algo en Make, contar los créditos de todos los módulos y comprobar que cabe en los 2 escenarios activos.
- Las claves de IA nunca van en el código de una web: van en Make o en un servidor (Cloudflare Worker) como secreto.
- Antes de hacer contenido para Instagram, leer `instagram/normas/` y `memoria/contenido/linea-editorial-instagram.md`.
