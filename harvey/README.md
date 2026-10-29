# Harvey — guía rápida

Harvey es el agente comercial de OBRAWEB. Cada día laborable por la mañana se ejecuta solo (tarea programada en Claude) y:

1. Busca pymes de Valencia que encajen con lo que vendemos y les pone nota del 1 al 10.
2. Prepara borradores de mensajes personalizados en `harvey/borradores/`.
3. Lleva el seguimiento de cada prospecto en `harvey/data/prospectos.json`.
4. Calcula qué nicho responde mejor y va centrándose en él.
5. Deja un resumen en `harvey/data/registro.md`.

**Harvey no envía nada solo.** Tú revisas los borradores y los envías.

## Tu parte (5 minutos al día)
- Abre `harvey/borradores/`, revisa los mensajes y envía los que te gusten.
- Dile a Claude: *"he enviado el de Clínica X"* o *"Clínica X ha respondido que le interesa"*.
  Así Harvey sabe qué nicho funciona.

## Ver el panel
```bash
cd harvey && python3 -m http.server 5555
```
Y abre http://localhost:5555/panel.html

## Cambiar cosas
Todo está en `harvey/config.json`: nichos, zona, cuántos prospectos por día, nota mínima...
