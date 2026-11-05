# Apex GP – juego de carreras de fórmula en 3D (HTML5 / CrazyGames)

Juego de carreras en **tercera persona y 3D** (Three.js) listo para subir a CrazyGames como **HTML5**.
Todo el arte (coches, circuitos, texturas) y el sonido se generan por código: no hay recursos de terceros.
Three.js va incluido en `lib/` (licencia MIT, ver `lib/THREE-LICENSE`).

## Qué incluye

- **6 rondas** inspiradas en circuitos del calendario 2026: Spielberg, Monza, Las Vegas (nocturna),
  São Paulo, Spa y Monte Carlo. Los trazados son aproximaciones dibujadas a mano, no réplicas oficiales.
- **Briefing antes de cada carrera**: tiempo (soleado, nublado, lluvia ligera, lluvia fuerte, noche),
  temperatura del aire y de la pista, probabilidad de lluvia.
- **5 compuestos de neumático**: blando, medio, duro, intermedio y de lluvia. Cada uno tiene su agarre según
  el estado de la pista y su desgaste por vuelta.
- **Daños**: el alerón delantero y la carrocería se estropean al chocar (con los muros o con otros coches).
  Un choque fuerte o entrar rápido en la hierba te hace trompear y te para.
- **Estado del coche en pantalla**: el alerón, la carrocería y cada neumático cambian de verde a amarillo y a rojo.
- **Pit lane real**: entras por la derecha antes de la meta, el limitador fija 80 km/h, paras en la caja amarilla
  y eliges **qué neumáticos poner**, si **cambias el alerón** y si **reparas**. Cada opción suma segundos y los rivales siguen corriendo.
- **Sanciones**:
  - Límites de pista: 2 avisos y luego **+5 s** y 1 punto de carnet por cada infracción.
  - Provocar una colisión (golpear por detrás): **+5 s** y 2 puntos de carnet.
  - Cada sanción resta **2 puntos de campeonato** y 15 monedas en esa carrera.
  - Los puntos de carnet bajan en 1 por cada carrera limpia.
- Puntos de campeonato (25-18-15-12-10-8), monedas, mejoras en el garaje (motor, suspensión, frenos) y libreas.
- 3 cámaras: persecución, persecución lejana y cockpit (tecla **C** o botón 🎥).
- Lluvia con partículas y spray, asfalto mojado que refleja, y carrera nocturna con focos.

## Controles

| Escritorio | Móvil |
|---|---|
| ↑ / W acelerar · ↓ / S / Espacio frenar · ← → girar | Acelera solo · botones ◀ ▶ · botón BRAKE |
| C cámara · P / Esc pausa · R recolocar el coche · M silenciar | Botones 🎥 🔊 ❚❚ |

## Probar en local

```bash
cd game
```

```bash
python3 -m http.server 8000
```

Abre http://localhost:8000. Parámetros útiles para pruebas: `?race=2&weather=heavy` (empezar directamente),
`?autopilot&timescale=8` (la IA conduce tu coche) y `?cover=1&track=0` (encuadre para la portada).

## Integración con el SDK de CrazyGames (v3)

- `loadingStart` / `loadingStop` durante la carga.
- `gameplayStart` / `gameplayStop` al empezar, pausar, entrar en boxes o terminar.
- Anuncio **midgame** entre carreras y anuncio **rewarded** opcional para duplicar las monedas.
- `happytime()` al acabar en el podio.
- Respeta la opción **muteAudio** del SDK (`addSettingsChangeListener`).
- Guarda el progreso con el **módulo de datos del SDK** (`SDK.data`) y usa `localStorage` si no está disponible.
- Bloquea el scroll de las flechas y la barra espaciadora, y pausa al cambiar de pestaña.

## Formulario de subida a CrazyGames

1. Comprime **el contenido** de la carpeta `game/` en un ZIP, con `index.html` en la raíz.
2. **Motor de juego:** HTML5.
3. **¿Guarda progreso?** «Sí, utilizando el módulo de datos del SDK de CrazyGames».
4. **Opciones:** marca «compatible con móviles» y «admite el silenciado de audio del SDK». No es multijugador.

### Lista de comprobación de la primera pantalla

- [x] Carga en Chrome de escritorio en unos segundos (unos 0,8 MB, sin recursos externos aparte del SDK).
- [x] Probado en móvil (controles táctiles y aceleración automática).
- [x] El idioma por defecto es el inglés.
- [x] Instrucciones mínimas: semáforo de salida y un aviso de controles durante los primeros segundos.
- [ ] **Que otra persona juegue de principio a fin** (eso lo tienes que hacer tú).
- [x] Código, arte y sonido propios. **No uses «F1», «Formula 1» ni nombres o logotipos de equipos o pilotos
      reales**: son marcas registradas y harían que rechacen el juego. Los nombres de las ciudades son genéricos.

### Recursos que pide el portal

Portadas en `covers/`, generadas con el propio juego: 1920×1080, 800×1200 y 800×800.
