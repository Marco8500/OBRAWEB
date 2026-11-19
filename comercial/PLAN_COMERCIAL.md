# PLAN COMERCIAL OBRAWEB

Versión 1 · 17 de noviembre de 2026
Documento de trabajo del fundador y los dos closers. Se revisa cada lunes con los datos de la hoja `OBRAWEB_control_comercial.xlsx`.

---

## 0. RESUMEN EN 10 LÍNEAS

1. Llevamos ~250 leads y ~125 contactos con **0 ventas**. El problema no es que no nos cojan el teléfono (80 % responde). Es **a quién llamamos** (negocios sin web, de ticket bajo) y **cómo vendemos** (precio antes de que el cliente vea valor).
2. Cambiamos de sector: dejamos peluquerías, floristerías y comercio de barrio, y pasamos a **reformas, instaladores, clínicas, talleres, academias y alojamientos**.
3. Cambiamos el proceso: la llamada no vende la web, vende **"te preparo gratis una muestra de tu web"**. El precio se da **solo después de enseñar la muestra**, en una llamada agendada.
4. El fundador prepara cada muestra en 20 minutos. Nunca se prepara una muestra sin cita cerrada.
5. Closer 1 consigue citas. Closer 2 presenta las muestras y cierra. Los dos siguen prospectando.
6. Si el closer 1 agenda y el closer 2 cierra, la comisión del 10 % se reparte 50/50. El coste para OBRAWEB no cambia.
7. Se arregla lo que resta credibilidad: dominio propio, web en plural, precio visible y nada de "IVA solo si quieres factura".
8. La web no tiene cuota. El chatbot incluye el primer mes y después cuesta 15 € + IVA/mes (cubre su coste de funcionamiento).
9. Todo se registra en la hoja de control. Sin registro no hay leads.
10. Objetivo de los 30 días: **primeras 3–5 ventas y un sistema que se repite cada semana.**

---

## A. AUDITORÍA (lo que hemos detectado)

| # | Problema | Gravedad | Acción |
|---|---|---|---|
| 1 | No se medía nada: no sabíamos dónde se perdían las ventas | Alta | Hoja de control obligatoria desde el día 1 |
| 2 | Leads de baja calidad: el filtro "sin web" selecciona negocios que no valoran la web | Alta | Nuevo filtro por sector, reseñas y estado de la web (sección B) |
| 3 | Solo el 10 % de las conversaciones genera interés | Alta | Nuevo guion centrado en la muestra gratis |
| 4 | 5 de 5 dijeron "no me interesa" tras oír el precio, sin preguntarles por qué | Alta | Precio solo después de la muestra y motivo de pérdida obligatorio |
| 5 | La mitad de los leads no se ha llegado a tocar | Media | Reasignación a los 5 días y mínimos de actividad |
| 6 | Credibilidad: web en `netlify.app`, texto en singular que contradice que llame un closer, precio oculto | Alta | Arreglarlo en la semana 1 |
| 7 | "IVA solo si pides factura": riesgo fiscal y mala imagen | Alta | Todos los precios + IVA y con factura, siempre. Consultar con el gestor |
| 8 | Los closers no tienen contrato | Media | Acuerdo de colaboración por escrito (semana 1) |
| 9 | Sin ingresos recurrentes y con el chatbot generando coste mensual sin cobrar | Media | Cuota del chatbot: 15 € + IVA/mes desde el 2.º mes |
| 10 | Comisión baja (45–55 €) en una venta en frío muy difícil | Media | No se toca durante 30 días. Se revisa con datos reales |

**Lo que NO es el problema:** la capacidad de producción (2–3 h por web y 20 min por muestra; producir 20 webs al mes es viable) ni el precio en sí (450–550 € es un precio de mercado bajo-medio).

---

## B. ESTRATEGIA DE CAPTACIÓN

### B.1 Sectores priorizados

Puntuación de 1 a 5. El criterio clave es este: **¿un solo cliente nuevo le paga la web?**

| Prioridad | Sector | Valor de un cliente nuevo para el negocio | Necesidad de web | Facilidad de contacto | Potencial del chatbot | Comentario |
|---|---|---|---|---|---|---|
| **1** | Reformas, construcción pequeña, pintores | 2.000–30.000 € | 5 | 5 (el dueño coge el móvil) | 4 (captar presupuestos 24 h) | Sector número 1. Ya tenemos portfolio |
| **1** | Instaladores: fontanería, electricidad, climatización, placas solares, cerrajeros | 150–8.000 € | 5 | 5 | 4 | Urgencias, la gente busca en Google en el momento |
| **1** | Clínicas: fisioterapia, podología, psicología, nutrición, estética | 40–80 € por sesión, recurrente | 4 | 3 (recepción: llamar a primera hora o a mediodía) | 5 (horarios, tarifas, citas) | Mejor sector para vender el chatbot |
| **2** | Talleres mecánicos, chapa y pintura | 150–1.500 € | 4 | 4 | 3 | Webs muy anticuadas o sin web |
| **2** | Academias, autoescuelas, centros de formación | 300–1.500 € por alumno | 4 | 4 | 5 (preguntas sobre matrícula) | Temporada fuerte: enero y septiembre |
| **2** | Alojamientos pequeños: casas rurales, apartamentos, hostales | Cada reserva directa ahorra un 15–18 % de comisión de Booking | 5 | 3 | 5 (multidioma) | Argumento económico muy claro |
| **3** | Gestorías, abogados, asesorías | Alto | 3 | 3 | 3 | Capacidad de pago, pero deciden despacio |
| **No** | Peluquerías, barberías, uñas, floristerías de barrio, bares, tiendas pequeñas | 15–40 € | 1–2 | 4 | 2 | Usan Instagram, Booksy o Fresha. Es donde hemos perdido todas las ventas |

**Regla:** el 80 % de los leads de cada semana debe ser de prioridad 1. El 20 % restante, de prioridad 2.

### B.2 Nuevo filtro de la automatización de Google Maps

Un lead entra en la lista solo si cumple **todo** esto:

- Categoría de Google de un sector de prioridad 1 o 2.
- **Al menos 20 reseñas y una nota de 4,0 o más.** Es un negocio activo, con clientes, que puede pagar.
- **Web inexistente, obsoleta o de redes sociales.** Cuentan como obsoletas: el campo web apunta a Facebook o Instagram, no tiene `https`, no se adapta al móvil, es una plantilla por defecto de Wix o Jimdo, o lleva años sin actualizarse.
- Teléfono **móvil** (empieza por 6 o 7): es más probable que conteste el dueño.
- No es una franquicia ni una cadena.
- Radio inicial: Valencia y área metropolitana (supuesto basado en vuestro portfolio; ajustadlo si trabajáis otra zona).

**Puntuación del lead (0–10)**, para repartir primero los mejores:

| Criterio | Puntos |
|---|---|
| Sector de prioridad 1 | +3 |
| Más de 50 reseñas | +2 |
| Web obsoleta o de redes (no la falta de web) | +2 |
| Teléfono móvil | +1 |
| Las reseñas mencionan "presupuesto", "urgencia" o "cita" | +1 |
| Ficha de Google con fotos y respuestas del dueño a las reseñas | +1 |

Un negocio con web obsoleta puntúa más que uno sin web: ya ha demostrado que cree que la web sirve.

### B.3 Fuentes de leads adicionales (coste cero, por orden)

1. **Los 4 clientes del portfolio.** Pedirles una opinión y a quién conocen. Recompensa: 50 € por cada referido que compre.
2. **Socios que ya tienen clientes autónomos:** gestorías, asesorías, imprentas, fotógrafos, proveedores de TPV. Comisión del 10 % por cliente que compre. El fundador hace 2 contactos a la semana.
3. **Negocios recién abiertos:** fichas de Google Maps con menos de 10 reseñas y fotos recientes. Están montando su imagen ahora.
4. **Clientes cerrados:** después de cada entrega, pedir reseña en Google y dos nombres de conocidos.
5. **TikTok e Instagram:** solo para reutilizar las muestras ("así quedaría la web de un taller de Valencia"). No se espera que traigan ventas en 30 días.

---

## C. PROCESO DE VENTAS (12 fases)

Hay un cambio de fondo respecto a cómo se vendía antes. **La primera llamada no vende la web ni da el precio. Solo consigue un "sí, enséñame la muestra" y una cita.**

| Fase | Quién | Qué se hace | Cuándo se pasa a la siguiente |
|---|---|---|---|
| **1. Recepción del lead** | Fundador | Cada lunes, reparte 40–60 leads puntuados por closer en la hoja. Lo mejor primero | El lead está en la hoja con closer y fecha |
| **2. Investigación** (máx. 3 min) | Closer | Mirar la ficha de Google: nº de reseñas, qué dicen, si tienen web o redes, nombre del dueño si aparece en las respuestas. Anotar **una frase personal** ("tenéis 80 reseñas y casi todas hablan de lo rápido que vais") | Hay una frase personal anotada |
| **3. Primer contacto** | Closer | **Llamada**, siempre primero. No se manda WhatsApp en frío: parece spam, os pueden bloquear el número y la normativa española exige consentimiento previo para comunicaciones comerciales electrónicas (conviene confirmarlo con el gestor o asesor) | Se habla con alguien |
| **4. Llamada** (2–4 min) | Closer | Guion D.1. Objetivo: hablar con quien decide y despertar curiosidad | Habla el dueño o se agenda cuándo llamarle |
| **5. Detección de necesidades** | Closer | 2–3 preguntas (D.2). Cómo consigue clientes ahora y qué pasa cuando alguien le busca en Google | Hay un "dolor" identificado o se descarta |
| **6. Presentación de OBRAWEB** | Closer | Una frase: "Hacemos webs para negocios como el tuyo, y antes de que pagues nada te enseñamos cómo quedaría la tuya" | – |
| **7. Oferta de la muestra + cita** | Closer | "¿Te la preparo y te la enseño el jueves a las 11 en 15 minutos?". **Día y hora cerrados.** Pedir permiso para escribirle por WhatsApp para confirmar | Cita en el calendario y fila marcada "Muestra aceptada + cita" |
| **8. Preparación** | Fundador | Muestra en 20 min con su nombre, sus servicios, fotos de su ficha de Google y su chatbot si encaja. Listo 24 h antes de la cita | Enlace enviado al closer que presenta |
| **9. Presentación + precio** (15–20 min) | Closer 2 (o el que agendó) | Guion D.6–D.8. Enseñar la muestra compartiendo pantalla o enviando el enlace durante la llamada, recoger reacciones, dar el precio y pedir la decisión | Sí, no o "lo pienso" con fecha |
| **10. Objeciones y seguimiento** | Closer | Banco de objeciones (D.9). Seguimiento con fecha, máximo 3 toques en 10 días (D.10). Después, cerrar como perdido **con motivo** | Decisión |
| **11. Cierre y cobro inicial** | Closer + fundador | Mensaje de cierre (D.11). El fundador envía factura proforma del 50 % + IVA con transferencia o Bizum a la empresa. **La venta cuenta cuando entra el dinero** | Anticipo cobrado |
| **12. Traspaso a producción** | Closer → fundador | Ficha de traspaso (abajo) por el grupo de WhatsApp en un máximo de 24 h. El fundador llama al cliente en 48 h | Fundador confirma recepción |

### Ficha de traspaso a producción (copiar y pegar)

```
✅ VENTA CERRADA
Negocio:
Contacto (nombre + móvil):
Servicio: Web 450 € / Web + Chatbot 550 € (+ IVA)
Anticipo cobrado: sí, fecha:
Enlace de la muestra que vio:
Lo que más le gustó de la muestra:
Lo que quiere cambiar o añadir:
Qué le preocupaba (objeciones):
Chatbot: sí / no (si sí: primer mes incluido, luego 15 € + IVA/mes)
Cerrado por:          Agendado por:
```

---

## D. GUIONES

Son guías, no textos para leer. Hay que aprenderse la estructura y decirlo con vuestras palabras. Tuteo por defecto. Si el cliente habla de usted, se pasa a usted.

### D.1 Primera llamada en frío

> **Tú:** Hola, buenos días. ¿Hablo con [nombre del negocio]?
> **Cliente:** Sí, dime.
> **Tú:** Soy [nombre], de OBRAWEB. Te llamo porque estaba viendo vuestra ficha en Google: tenéis [frase personal, por ejemplo "más de 80 reseñas, y casi todas muy buenas"]. ¿Eres tú quien lleva el negocio?
> *(Si no es el dueño: "¿Cuándo es buen momento para pillarle? Te prometo que son dos minutos." Anotar el nombre y la hora.)*
> **Tú:** Genial. Te robo un minuto y me dices si te encaja o no, ¿vale?
> Nosotros hacemos webs para negocios de [sector] de la zona. Te llamo porque cuando alguien os busca en Google ahora mismo [no le aparece web / le sale el Facebook / le sale una web que en el móvil no se ve bien], y muchos de esos clientes acaban llamando al siguiente de la lista.
> Te pregunto una cosa: ¿ahora mismo los clientes nuevos os llegan más por recomendación o por Google?

→ Pasar a D.2.

**Si dice "no me interesa" en los primeros 10 segundos:**
> Normal, te pillo trabajando. Solo una cosa y te dejo: no te quiero vender nada por teléfono. Lo que hacemos es prepararte gratis cómo quedaría tu web, y si no te gusta no pasa nada. ¿Te la enseño y decides tú?

Si vuelve a decir que no: "Perfecto, gracias por tu tiempo. ¡Que vaya bien!". Se registra el motivo y se cuelga. **No se insiste una tercera vez.**

### D.2 Detección de necesidades (elige 2–3 preguntas)

- "¿Cómo os llegan ahora los clientes nuevos?"
- "Cuando alguien os pide presupuesto, ¿cómo lo hace? ¿Llama, WhatsApp...?"
- "¿Os escribe gente fuera de horario preguntando lo mismo de siempre?" *(pregunta puente para el chatbot)*
- "Si te entraran 3 o 4 clientes más al mes, ¿podrías atenderlos?"
- "¿Alguna vez habéis pensado en hacer web? ¿Qué os frenó?" *(si responde "el precio" o "me la iba a hacer un conocido", ya sabes cuál es su objeción)*

**Escucha más de lo que hablas.** Anota la frase exacta que diga. La usarás en la presentación.

### D.3 Conseguir la cita para enseñar la muestra (el objetivo de la llamada)

> Mira, te propongo una cosa. Con lo que me has contado te preparamos una muestra de cómo quedaría vuestra web, con vuestro nombre, vuestros servicios y vuestras fotos. Gratis y sin compromiso. Si te gusta, hablamos; si no, te quedas con la idea y ya está.
> Te la enseño en 15 minutos por videollamada o por teléfono. ¿Te va mejor el jueves por la mañana o el viernes por la tarde?
> *(Cerrar día y hora exactos.)*
> Perfecto, jueves a las 11. ¿Te escribo por WhatsApp a este número para confirmártelo y pasarte el enlace ese día?

**Reglas:**
- Si no hay día y hora, no hay muestra.
- Ofrece siempre dos opciones de horario, nunca "¿cuándo te va bien?".
- La cita, en un máximo de 3 días laborables.

### D.4 Primer WhatsApp (solo después de que haya dado permiso en la llamada)

> Hola [nombre], soy [tu nombre], de OBRAWEB. Como hemos hablado, te confirmo la cita para enseñarte la muestra de la web de [negocio]: **jueves 21 a las 11:00**. Son 15 minutos. Si te surge algo, me dices y lo movemos. ¡Hasta el jueves!

**Recordatorio el mismo día, 2 horas antes:**
> Buenos días [nombre]. Te recuerdo que a las 11 te enseño la muestra de vuestra web. Te llamo a este número, ¿vale?

### D.5 Negocios que no contestan a la llamada

- **Intento 1:** llamada. **Intento 2:** llamada otro día y en otra franja (mañana ↔ tarde). **Intento 3:** llamada a primera hora (9:30–10:00).
- Después de 3 llamadas sin respuesta: se marca "No contesta tras seguimientos" y se pasa al siguiente lead.
- **No se envía WhatsApp en frío.** Excepción: si el negocio tiene en su ficha de Google el botón de WhatsApp o pone "escríbenos por WhatsApp", eso cuenta como canal de contacto que ellos mismos ofrecen. Entonces se puede enviar **un solo** mensaje:

> Hola, buenas. Soy [nombre], de OBRAWEB. He visto vuestra ficha en Google ([frase personal]) y he intentado llamaros un par de veces. Hacemos webs para [sector] de la zona y os preparamos una muestra gratis de cómo quedaría la vuestra antes de hablar de nada más. ¿Os interesaría verla? Si no, no os molesto más 🙂

### D.6 Presentar la muestra y los servicios (closer 2, llamada de 15–20 min)

1. **Recuerda lo que te dijo** (1 min): "El otro día me contaste que [frase exacta del cliente]. Con eso en mente hemos preparado esto."
2. **Enseña la muestra** (5 min): comparte el enlace y pídele que lo abra **en su móvil mientras habláis**. Recórrela con él: "Fíjate arriba: lo primero que ve el cliente es [servicio] y un botón para llamarte directamente."
3. **Pregunta por su reacción** antes de seguir: "¿Qué te parece? ¿Te ves con algo así?"
   - Si dice "me gusta" → pregunta "¿Qué cambiarías?". Si propone cambios, ya se está imaginando con ella.
   - Si está frío → pregunta "¿Qué esperabas ver que no está?"
4. **Conecta la web con el dinero**: "Si esto te trae un cliente más al mes, ¿cuánto vale para ti un cliente?" *(deja que lo diga él)*.

### D.7 Presentar el chatbot (solo si encaja: clínicas, academias, alojamientos, reformas)

> ¿Ves el iconito de abajo a la derecha? Pregúntale algo, lo que te pregunten tus clientes normalmente. *(Que lo pruebe él.)*
> Eso contesta solo, a las 11 de la noche o un domingo: horarios, precios orientativos, qué servicios hacéis... Y si alguien quiere presupuesto, le pide el nombre y el teléfono y te llega a ti. Es como tener a alguien en recepción que no se va nunca a casa.

Si no tienes la muestra con chatbot, usa el de la web de OBRAWEB: "Entra en nuestra web y pregúntale lo que quieras a nuestro asistente. Esto mismo lo tendrías tú."

### D.8 Explicar el precio

**Siempre después de la reacción positiva a la muestra. Nunca antes.**

> Te cuento cómo funciona. La web, tal cual la estás viendo pero con todo vuestro contenido real, son **450 € + IVA**. Pago único: la web es tuya, igual que el dominio, y el primer año de dominio va incluido.
> Si quieres además el asistente que acabas de probar, son **550 € + IVA** todo junto.
> Se paga la mitad al empezar y la otra mitad cuando la tienes terminada y te gusta. En unas dos semanas la tienes funcionando.
> *(Silencio. Deja que hable él primero.)*

**Cuota del asistente** (solo si elige web + chatbot; dilo antes de cerrar, nunca después):
> El asistente lleva el primer mes incluido. A partir del segundo mes son 15 € + IVA al mes, que es lo que cuesta tenerlo funcionando. Sin permanencia: si un día no lo quieres, se quita y la web sigue igual. La web sola no tiene ninguna cuota.

### D.9 Objeciones

| Objeción | Qué suele significar | Respuesta |
|---|---|---|
| **"No me interesa"** | No ve valor o no se fía | "Vale, sin problema. ¿Me dices por qué, para no molestar a otros negocios como el tuyo? ¿Es porque ya tenéis web, porque no os hace falta...?" *(registrar el motivo real)* |
| **"Ya tengo Instagram / Facebook"** | Cree que es suficiente | "Perfecto, y que siga. Pero quien te busca en Google no siempre tiene Instagram, y en Google aparecen primero los que tienen web. La web no sustituye al Instagram: hace que te encuentre gente que todavía no te sigue." |
| **"Es caro"** | No ha conectado el precio con el retorno | "Entiendo. Pregunta rápida: ¿cuánto te deja un cliente normal? *(respuesta)* Entonces con [1 o 2] clientes nuevos la web ya está pagada, y la tienes para años. ¿Te parece caro comparado con eso?" |
| **"Me lo hace un sobrino / un conocido"** | Precio o compromiso | "Genial, si te lo hace bien es buena opción. Solo te diría que mires si va a estar para los cambios, el dominio, el móvil... Si en algún momento se complica, aquí estamos. ¿Te dejo la muestra igualmente, por si quieres comparar?" |
| **"Me la dieron gratis con el Kit Digital"** | Ya tiene web (seguramente mala) | "¿Y te está trayendo clientes? *(casi siempre la respuesta es no)* Muchas de esas webs se hicieron rápido y sin pensar en vender. Si quieres, te enseño qué cambiaríamos." |
| **"Me lo pienso"** | Duda sin resolver o no hay prioridad | "Claro. Para que lo pienses con toda la información, ¿qué es lo que te hace dudar: el precio, el momento o algo de la web?" *(resuelve eso)* "¿Te llamo el [día concreto] y me dices?" |
| **"Ahora no es buen momento"** | Puede ser real | "Lo entiendo. ¿Cuándo sería mejor, después de [fiestas / temporada]? Te apunto y te llamo esa semana." *(fecha concreta en la hoja)* |
| **"No me fío de pagar por adelantado"** | Desconfianza normal con una empresa nueva | "Lógico, no nos conoces. Por eso primero te hemos enseñado la muestra sin pedirte nada. Te mandamos factura con nuestros datos, y la otra mitad solo la pagas cuando la web está terminada y te gusta. Si quieres, te paso la web de [cliente del portfolio] para que veas una que ya está funcionando." |
| **"Mándame información por email / WhatsApp"** | Forma educada de colgar | "Te lo mando, claro. Pero un PDF no te dice cómo quedaría lo tuyo. Mejor te preparo la muestra con tu negocio y te la enseño en 15 minutos. ¿Jueves o viernes?" |
| **"¿Y no sale en Google solo?"** | No entiende la diferencia | "La ficha de Maps ayuda, pero cuando alguien busca '[servicio] en [zona]', Google prefiere a quien tiene web. Y sin web, el cliente no puede ver tus trabajos ni tus precios antes de llamar." |

### D.10 Seguimientos (máximo 3 toques en 10 días)

**Día 1, después de la presentación (si dijo "me lo pienso"):**
> Hola [nombre], gracias por el rato de hoy. Te dejo aquí el enlace de la muestra para que la mires con calma: [enlace]. Quedamos en hablar el [día]. Si te surge cualquier duda antes, me escribes.

**Día 3–4:**
> Hola [nombre], ¿pudiste echarle un ojo a la web con calma? Si quieres cambiar algo (colores, textos, fotos), dímelo y te lo ajusto antes de que decidas.

**Día 8–10 (último):**
> Hola [nombre], no te quiero agobiar. Te escribo por última vez sobre la web: si ahora no es el momento, no pasa nada, me lo dices y lo dejamos aquí. Si te apetece seguir, podemos tenerla lista en dos semanas.

Si no responde: se cierra como perdido ("No contesta tras seguimientos"). Se puede volver a contactar a los 2–3 meses.

### D.11 Cierre de venta

**Cierre directo (cuando ha reaccionado bien a la muestra y al precio):**
> ¿Qué te parece? ¿La ponemos en marcha?

**Cierre por alternativa:**
> ¿Prefieres solo la web o con el asistente?

**Cuando dice que sí:**
> ¡Genial! Te cuento los siguientes pasos. Te mando ahora la factura del 50 % para empezar. En cuanto llegue, [fundador] te llama en 48 horas para recoger fotos, textos y lo que quieras cambiar. En unas dos semanas la tienes lista para revisarla. ¿Te mando la factura a este WhatsApp o prefieres email? ¿A nombre de quién la hago?

**Regla:** no se cuelga sin haber pedido los datos de facturación. Si la venta queda "para mañana", no está cerrada.

---

## E. FORMACIÓN DE LOS CLOSERS

### E.1 Closer 1 (poca experiencia): especialista en conseguir citas

| Semana | Objetivo de aprendizaje | Ejercicio | Meta medible |
|---|---|---|---|
| 1 | Dominar la apertura y la cita | Aprenderse D.1 y D.3. Roleplay de 20 min al día con el closer 2 haciendo de cliente: 10 aperturas seguidas | 30 conversaciones reales y 3 citas |
| 2 | Las preguntas de D.2 y escuchar | Hacer 2 preguntas por llamada y anotar la frase exacta del cliente. Escuchar 2 presentaciones del closer 2 (en silencio) | 60 conversaciones y 6 citas. Tasa de cita ≥ 8 % |
| 3 | Las 5 objeciones de la llamada en frío | Roleplay con las objeciones "no me interesa", "mándame info", "no tengo tiempo", "ya tengo Instagram" y "¿cuánto cuesta?" | Tasa de cita ≥ 10 % |
| 4 | Primera presentación propia | Presentar 1–2 muestras con el closer 2 escuchando y dando feedback | 1 presentación hecha por él |

**Evaluación semanal (lunes):** el fundador o el closer 2 revisan 2 llamadas con la plantilla E.4.

### E.2 Closer 2 (más experiencia, nuevo en B2B): especialista en presentar y cerrar

| Semana | Objetivo | Ejercicio | Meta medible |
|---|---|---|---|
| 1 | Presentación de la muestra (D.6–D.8) | Ensayar 3 veces con el fundador haciendo de cliente: un cliente entusiasta, uno escéptico y uno que dice "es caro" | Presentar todas las muestras de la semana |
| 2 | Objeciones de precio y confianza | Roleplay con D.9: "es caro", "me lo hace un sobrino", "no me fío de pagar por adelantado", "me lo pienso" | Tasa de cierre ≥ 20 % de las muestras presentadas |
| 3 | Cierre y seguimiento | Aplicar siempre D.11. Ningún "me lo pienso" sin fecha | 0 leads sin próxima acción |
| 4 | Mentor | Dar feedback al closer 1 con la plantilla E.4 | 2 revisiones hechas |

### E.3 Rol de mentor del closer 2 (sin ser jefe)

- **Qué hace:** 20 minutos de roleplay al día en la semana 1 y 3 veces por semana después. Deja que el closer 1 escuche sus presentaciones. Revisa 2 llamadas suyas a la semana.
- **Qué no hace:** no reparte leads, no pone objetivos ni evalúa. Eso lo hace el fundador.
- **Por qué le interesa:** cada cita que consiga el closer 1 es dinero para él (ver F.5).

### E.4 Plantilla de revisión de llamadas (puntuar del 1 al 5)

| Criterio | 1–5 | Comentario |
|---|---|---|
| Apertura: personalizada y en menos de 20 segundos | | |
| Preguntó antes de hablar de la web | | |
| Escuchó y anotó lo que dijo el cliente | | |
| Ofreció la muestra con día y hora cerrados | | |
| Gestionó la objeción sin discutir | | |
| Tono: natural, sin leer y sin presionar | | |
| Registró el resultado en la hoja | | |

**Formato para revisarlo con Claude:** el closer escribe al terminar un resumen de la llamada (qué dijo él, qué contestó el cliente, cómo terminó), o una transcripción si la tiene. El fundador lo pega en esta conversación y Claude lo evalúa con esta plantilla y propone qué debería haber dicho.

Si queréis **grabar llamadas**, hay que avisar al cliente al empezar ("Te aviso de que la llamada se graba para formación interna"). Solo para uso interno.

### E.5 Las 10 objeciones difíciles para los roleplays

1. "¿Cuánto cuesta?" (en los primeros 30 segundos)
2. "No me interesa" (antes de que hayas dicho nada)
3. "Ya tengo web" (y es una web horrible)
4. "Ya me llamaron otros de webs la semana pasada"
5. "¿Esto es una estafa? ¿Quiénes sois?"
6. "Es carísimo, en Wix lo hago yo por 15 € al mes"
7. "Me lo hace mi sobrino"
8. "Mándame un email"
9. "Lo tengo que hablar con mi socio / mi mujer / mi marido"
10. "Llámame después de Navidad"

---

## F. DIRECCIÓN DEL EQUIPO

### F.1 Organización (decisión razonada)

Tu idea inicial era que el closer 1 prospecte y el closer 2 cierre. **Es correcta en lo esencial, con un cambio:** si el closer 2 solo cerrara, se quedaría parado esperando citas de alguien que aún está aprendiendo. Por eso:

- **Closer 1:** llama a leads y consigue citas para enseñar la muestra. Si quiere, puede presentar alguna a partir de la semana 4.
- **Closer 2:** presenta **todas** las muestras (las suyas y las del closer 1) y, en el tiempo que le quede, también llama a sus propios leads.
- **Fundador:** reparte leads, prepara muestras, cobra, produce y toma las decisiones.

### F.2 Reparto de leads

- Cada **lunes antes de las 10:00**, el fundador asigna en la hoja **40 leads al closer 1 y 25 al closer 2**, ordenados por puntuación.
- **Reasignación:** un lead sin tocar en 5 días pasa al otro closer.
- **Para seguir recibiendo leads**, cada semana: un mínimo de **40 conversaciones reales** (closer 1) o **20** (closer 2), y la hoja actualizada.

### F.3 Grupo de WhatsApp "OBRAWEB Ventas"

**Reglas fijadas en el grupo:**
1. Solo temas comerciales. Sin memes.
2. **Informe diario** antes de las 20:00 de cada día que se trabaje (formato abajo). Si no hay informe, se entiende que ese día no hubo actividad.
3. Cada cita agendada se anuncia con 📅 + negocio + día y hora. El fundador confirma la muestra con 👍.
4. Cada venta cobrada se anuncia con la ficha de traspaso (C.12) 🎉.
5. Las dudas de llamadas se escriben aquí: el fundador o el closer 2 responden en menos de 24 h.

**Formato del informe diario (30 segundos):**
```
📊 [Nombre] – [fecha]
Llamadas: 25 | Conversaciones: 11 | Citas: 1
Muestras presentadas: 0 | Ventas: 0
Bloqueo: muchos me dicen "ya tengo Instagram"
```

### F.4 Reunión semanal (lunes, 30 minutos, videollamada)

| Min | Punto |
|---|---|
| 0–5 | Números de la semana en la hoja (pestaña Panel) |
| 5–15 | Qué ha funcionado y qué no: **1 llamada buena y 1 mala de cada closer** |
| 15–25 | Roleplay de la objeción que más se ha repetido |
| 25–30 | Objetivos de la semana y reparto de leads |

### F.5 Comisiones (sin cambios en el coste para OBRAWEB)

| Caso | Closer 1 | Closer 2 | Coste total |
|---|---|---|---|
| Venta completa de un solo closer | 10 % para él | – | 10 % |
| El closer 1 agenda y el closer 2 presenta y cierra | 5 % (22,50–27,50 €) | 5 % (22,50–27,50 €) | 10 % |

- La comisión se paga cuando el cliente ha pagado el **100 %**. Hay que confirmarlo y ponerlo en el acuerdo escrito.
- La cuota mensual del chatbot no lleva comisión.
- **Revisión en el día 30:** si con datos reales la comisión por hora trabajada no llega a unos 10 €/h, se estudia un ajuste con números delante, como acordamos.

### F.6 Reconocimiento (barato y concreto)

- **Ranking semanal en el grupo** por citas conseguidas (closer 1) y por tasa de cierre (closer 2). Se premia la calidad, no las llamadas.
- **Primera venta del equipo:** bono de 25 € a cada closer, una sola vez.
- **Mes con 8 o más ventas del equipo:** bono de 50 € a repartir. Solo se activa con ventas cobradas.

### F.7 Criterios objetivos de evaluación (día 30)

| Indicador | Closer 1 (mínimo) | Closer 2 (mínimo) |
|---|---|---|
| Conversaciones reales por semana | 40 | 20 |
| Tasa de cita (citas / conversaciones) | 8 % | 8 % |
| Tasa de asistencia a la cita | 60 % | 60 % |
| Tasa de cierre (ventas / muestras presentadas) | – | 20 % |
| Hoja actualizada e informes diarios | 90 % de los días trabajados | 90 % |
| Leads con próxima acción vencida | 0 | 0 |

**Si alguien no llega a los mínimos 2 semanas seguidas:** conversación con el fundador, plan de mejora de 2 semanas y, si no mejora, se reducen o retiran sus leads.

### F.8 Acuerdo de colaboración (semana 1)

Hoy no hay nada firmado. Hace falta un documento sencillo con:
- Comisión, cuándo se cobra y cómo se reparte.
- Que el closer **factura como autónomo** (o la fórmula que te indique el gestor).
- Que el closer elige su horario y sus medios (para no entrar en una relación laboral).
- Confidencialidad de los datos de leads y clientes (RGPD).
- Los mínimos de actividad para seguir recibiendo leads y la reasignación a los 5 días.
- Que no se puede vender sin factura ni prometer servicios fuera de los paquetes.

**Esto debe revisarlo tu gestor o un abogado antes de firmarlo.** Puedo redactar un borrador.

---

## G. MÉTRICAS Y CONTROL

Herramienta: `OBRAWEB_control_comercial.xlsx`. Se importa en Google Sheets (Archivo → Importar) y se comparte con los dos closers con permiso de edición.

- **Leads:** una fila por negocio. Recoge todas las etapas del embudo (contactado → respondió → interesado → muestra aceptada + cita → muestra y precio presentados → venta → anticipo → cobro final), motivo de pérdida obligatorio, próxima acción con aviso en rojo si está vencida, importe, y comisión con reparto 50/50 automático cuando otro closer presenta.
- **Panel:** muestra por closer y en total, para el periodo que elijas: actividad, embudo, conversiones, facturación vendida, cobros, comisiones, ventas frente a objetivo, seguimientos vencidos y motivos de pérdida.
- **Informe diario:** copia del informe de WhatsApp, para tener el histórico.

**Las 3 cifras que el fundador mira cada lunes (5 minutos):**
1. **Citas agendadas** por closer: es el indicador que anticipa las ventas.
2. **Tasa de cierre** sobre muestras presentadas: mide la calidad de la presentación.
3. **Motivos de pérdida**: dicen qué hay que cambiar en guiones o sectores.

---

## H. PLAN DE 30 DÍAS (del 18 de noviembre al 17 de diciembre de 2026)

**Contexto:** en diciembre baja la actividad de muchos negocios a partir del 15–18. Hay que apretar fuerte en las semanas 1–3. El 8 de diciembre es festivo.

### Semana 1 (18–24 de noviembre): arreglar lo que bloquea las ventas y arrancar

| Tarea | Responsable | Objetivo | Plazo | Indicador de éxito |
|---|---|---|---|---|
| Comprar dominio propio y correo profesional, y conectarlos a la web | Fundador | Que la marca dé credibilidad | Jueves 19 | La web funciona en el dominio propio |
| Corregir la web: textos en plural, precios "desde 450 € + IVA", quitar servicios que no se venden en paquete | Fundador | Que la web coincida con lo que dicen los closers | Viernes 20 | 3 cambios publicados |
| Pedir opiniones y enlaces a los 4 clientes del portfolio | Fundador | Prueba social | Viernes 20 | ≥ 2 opiniones publicadas |
| Eliminar "IVA solo con factura": todos los precios + IVA y con factura | Fundador (+ gestor) | Eliminar el riesgo fiscal | Miércoles 18 | Comunicado a los closers en el grupo |
| Importar la hoja de control en Google Sheets y compartirla | Fundador | Empezar a medir | Miércoles 18 | Los 2 closers tienen acceso |
| Reconfigurar la automatización de Google Maps con el filtro B.2 | Fundador | Leads de calidad | Jueves 19 | 100 leads nuevos de prioridad 1 o 2 |
| Reunión de arranque de 45 min: nuevo proceso, guiones, reglas y comisiones | Fundador + closers | Que todos trabajen igual | Jueves 19 | Los 3 conocen el proceso y el guion |
| Roleplay diario de 20 min (closer 2 hace de cliente) | Closer 2 + closer 1 | Soltura con la apertura y la cita | Diario | 4 sesiones hechas |
| Llamadas con el nuevo guion | Closers | Primeras citas para enseñar muestras | Del 19 al 24 | 50 conversaciones en total y **≥ 4 citas** |
| Preparar las muestras de las citas agendadas | Fundador | Tener la muestra lista 24 h antes de cada cita | Continuo | 100 % de las muestras a tiempo |
| Borrador del acuerdo de colaboración | Claude → fundador → gestor | Formalizar la relación con los closers | Lunes 24 | Borrador revisado |

### Semana 2 (25 de noviembre–1 de diciembre): primeras presentaciones y primeras ventas

| Tarea | Responsable | Objetivo | Plazo | Indicador de éxito |
|---|---|---|---|---|
| Reunión semanal (F.4) | Fundador | Ajustar con datos | Lunes 25 | Hecha, con números de la hoja |
| Presentar todas las muestras agendadas | Closer 2 | Primeras ventas | Toda la semana | ≥ 4 presentaciones y **≥ 1 venta cobrada** |
| Llamadas | Closers | Mantener el flujo de citas | Toda la semana | 80 conversaciones y ≥ 7 citas |
| El closer 1 escucha 2 presentaciones | Closer 1 | Aprender a cerrar | Toda la semana | 2 escuchadas |
| Primer contacto con 2 posibles socios (gestorías o asesorías) | Fundador | Una fuente de referidos | Viernes 29 | 2 conversaciones |
| Enviar 3 resúmenes de llamadas a Claude para revisión | Fundador | Mejorar los guiones con casos reales | Viernes 29 | 3 revisadas |
| Cuota del chatbot (15 €/mes desde el 2.º mes) en web, chatbot y guion | Fundador | Ingresos recurrentes | Hecho (19/11) | Publicado en la web |

### Semana 3 (2–8 de diciembre): repetir y corregir

| Tarea | Responsable | Objetivo | Plazo | Indicador de éxito |
|---|---|---|---|---|
| Reunión semanal: revisar motivos de pérdida y ajustar guion y sectores | Fundador + closers | Corregir lo que no funciona | Lunes 2 | 1 cambio concreto acordado |
| Llamadas y presentaciones | Closers | Ritmo estable | Toda la semana (el 8 es festivo) | 80 conversaciones, ≥ 7 citas, **≥ 2 ventas** |
| Producir y entregar las primeras webs vendidas | Fundador | Clientes satisfechos y cobro del 50 % final | Máximo 14 días por web | Entregadas a tiempo |
| Pedir reseña y referidos a cada cliente entregado | Fundador | Prueba social nueva | Al entregar | 1 reseña por cliente |
| Roleplay de las 10 objeciones difíciles (E.5) | Closers | Gestionar objeciones | Miércoles 4 | Hecho |

### Semana 4 (9–17 de diciembre): consolidar y medir

| Tarea | Responsable | Objetivo | Plazo | Indicador de éxito |
|---|---|---|---|---|
| Últimas citas antes de Navidad y citas agendadas para la semana del 7 de enero | Closers | Que enero no empiece de cero | Viernes 12 | ≥ 5 citas ya agendadas para enero |
| El closer 1 presenta 1–2 muestras con el closer 2 escuchando | Closer 1 | Formación en cierre | Toda la semana | 1 presentación hecha |
| Evaluación del día 30 con los criterios de F.7 | Fundador | Decidir organización y comisiones con datos | Miércoles 17 | Informe con conversiones reales por closer |
| Revisión del plan con Claude: tasas reales frente a las supuestas | Fundador + Claude | Plan de enero a marzo | Miércoles 17 | Previsión actualizada |

### Resultado esperado a los 30 días

| | Mínimo aceptable | Objetivo |
|---|---|---|
| Conversaciones reales | 200 | 300 |
| Muestras presentadas | 10 | 18 |
| Ventas cobradas (anticipo) | **3** | **5** |
| Facturación vendida | ~1.500 € | ~2.500 € |
| Datos reales de conversión por etapa | Sí | Sí |

**Si a los 30 días hay 0–1 ventas con 10 o más muestras presentadas,** el problema está en la oferta o el precio, no en la captación, y se revisa el modelo. Si hay pocas muestras presentadas, el problema está en la captación o en la actividad.

---

## I. PREVISIONES ECONÓMICAS (diciembre de 2026–diciembre de 2027)

### Hipótesis
- Ticket medio de **490 € sin IVA** (60 % web a 450 € y 40 % web + chatbot a 550 €).
- **Cuota del chatbot: 15 €/mes** desde el segundo mes (actualizado el 19/11; antes se suponían 25 €/mes también para web sola). La paga el 90 % de los clientes con chatbot; la web sola no tiene cuota. Baja de clientes del 2 % al mes.
- Comisión del 10 % sobre la venta inicial.
- Costes directos: 30 €/mes fijos (Make, dominio propio y herramientas) + unos 5 €/mes por cada cliente con chatbot (API y Make).
- Estacionalidad: bajada en julio, agosto y diciembre; picos en septiembre, octubre y noviembre.
- **No incluyen** cuota de autónomo, IRPF o impuesto de sociedades, ni gestoría. Dependen de tu situación y hay que restarlos para conocer el beneficio neto.
- El IVA no es ingreso: se cobra y se ingresa a Hacienda.

### Ventas al mes supuestas

| Mes | dic | ene | feb | mar | abr | may | jun | jul | ago | sep | oct | nov | dic-27 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Conservador | 1 | 2 | 3 | 3 | 4 | 4 | 5 | 4 | 3 | 5 | 6 | 6 | 5 |
| Realista | 2 | 4 | 6 | 8 | 10 | 11 | 12 | 10 | 8 | 13 | 15 | 16 | 14 |
| Optimista | 3 | 6 | 9 | 12 | 14 | 16 | 17 | 15 | 12 | 18 | 20 | 21 | 19 |

El objetivo inicial de 4 ventas por semana (~17 al mes) corresponde al escenario optimista a partir de junio de 2027.

### Resultado por escenario

| | Conservador | Realista | Optimista |
|---|---|---|---|
| Ventas totales en 13 meses | 51 | 129 | 182 |
| **Facturación de noviembre de 2027** | **3.140 €** | **8.335 €** | **10.999 €** |
| de la cual, cuota del chatbot | 200 € | 495 € | 709 € |
| Facturación acumulada en 13 meses | 26.239 € | 66.242 € | 93.572 € |
| Comisiones acumuladas | 2.499 € | 6.321 € | 8.918 € |
| Costes directos acumulados | 806 € | 1.401 € | 1.854 € |
| **Beneficio antes de impuestos y cuota de autónomo** | **22.934 €** | **58.520 €** | **82.800 €** |
| Clientes con chatbot pagando cuota en diciembre de 2027 | ~15 | ~38 | ~54 |
| Horas de producción al mes en el pico (~5 h por venta) | ~30 h | ~80 h | ~105 h |

### Dinero disponible (no es lo mismo que facturación)
- El 50 % de cada venta entra al cerrar y el otro 50 % al entregar, unas 2 semanas después. Una venta de finales de mes cobra su segunda mitad el mes siguiente.
- Las comisiones salen cuando el cliente ha pagado el 100 %.
- El IVA cobrado hay que guardarlo para la declaración trimestral (el 21 % de cada cobro **no es tuyo**).
- Con eso, en el escenario realista, la caja de un mes típico es entre un 10 % y un 15 % inferior a su facturación de ese mes, antes de IVA e impuestos.

### Conclusión sincera sobre los 10.000 €/mes en enero de 2028
- **Escenario realista: ~8.000–8.500 €/mes.** Se queda cerca, pero no llega.
- **Para llegar hay que hacer una de estas tres cosas:**
  1. Llegar al escenario optimista: ~4–5 ventas por semana de forma constante desde la primavera.
  2. **Subir el ticket en los sectores prioritarios** cuando haya 10 o más ventas y opiniones de clientes. Por ejemplo, una web de reformas o una clínica con chatbot de captación a 650–750 €. **No se decide ahora:** primero hay que demostrar que se vende a 450–550 €.
  3. Vender más paquetes con chatbot: cada 40 clientes con chatbot son +600 €/mes recurrentes (unos 400 € de margen tras su coste).
- **Ingresos recurrentes:** con la cuota del chatbot de 15 €/mes (solo clientes con chatbot), en el escenario realista salen **~500–570 €/mes** a final de 2027. Ayudan, pero el grueso tiene que venir de webs nuevas.

---

## J. PRÓXIMOS PASOS INMEDIATOS (esta semana)

1. Hoy: comprar el dominio y comunicar a los closers que se acaba lo de "IVA solo si piden factura".
2. Mañana: importar la hoja en Google Sheets y reconfigurar el filtro de Google Maps.
3. Jueves: reunión de arranque con los dos closers (45 min) usando este documento.
4. Desde el jueves: llamadas con el guion D.1 → D.3. Objetivo: 4 citas antes del lunes.
5. Enviarme las primeras conversaciones reales para revisarlas.
