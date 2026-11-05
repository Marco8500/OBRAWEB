---
title: OBRAWEB
emoji: ⌚
colorFrom: yellow
colorTo: gray
sdk: docker
app_port: 7860
pinned: false
short_description: Videos profesionales de relojes a partir de fotos
---

# OBRAWEB · Videos profesionales de relojes con IA

Subes fotos de un reloj y la app te devuelve un **video vertical (9:16) listo para Instagram, TikTok y Reels**, con movimientos de cámara, transiciones elegantes, música y una pantalla final con tu marca.

## Dos modos

| Modo | Qué hace | Costo |
|---|---|---|
| ⚡ **Rápido** | Movimientos de cámara de estudio sobre tus fotos (acercar, alejar, desplazar), con transiciones y pantalla final. Funciona en tu computadora. | **Gratis** |
| 🤖 **IA cinematográfica** | Un modelo de IA **abierto** (Wan, de Alibaba) anima cada foto con giros de cámara y reflejos de luz reales. Se ejecuta en la nube con [Replicate](https://replicate.com). | Pagas por uso en Replicate |

---

## Cómo usarla (paso a paso, sin saber programar)

### 1. Instala Node.js (solo una vez)
Entra en **https://nodejs.org**, descarga la versión **LTS** e instálala (siguiente, siguiente, finalizar).

### 2. Descarga este proyecto
En GitHub, presiona el botón verde **Code** y luego **Download ZIP**. Descomprime la carpeta.

### 3. Ábrela
- **Windows:** doble clic en `iniciar-windows.bat`
- **Mac:** doble clic en `iniciar-mac.command` (si no abre: clic derecho → Abrir)

La primera vez tarda un poco porque instala lo necesario. Luego se abre el navegador en **http://localhost:3000**.

> ⚠️ No cierres la ventana negra mientras uses la app: es el "motor".

### 4. Crea tu video
1. Sube de 1 a 10 fotos del reloj.
2. Escribe la marca, una frase y una llamada a la acción (opcional).
3. Elige el estilo: **Lujo**, **Minimal** o **Deportivo**.
4. Opcional: agrega una música MP3.
5. Presiona **Crear mi video** y descárgalo.

---

## Usarla en el móvil gratis (Hugging Face Spaces · Static)

La carpeta **`app-movil/`** es una versión que crea el video **dentro del navegador** del móvil: no necesita servidor, es gratis y las fotos no salen del dispositivo.

1. Crea una cuenta en **https://huggingface.co/join**.
2. Entra en **https://huggingface.co/new-space**:
   - **Space name:** `obraweb` · **License:** `mit`
   - **SDK:** **Static** → plantilla en blanco (*Blank*)
   - **Public** · presiona **Create Space**.
3. En la pestaña **Files → Add file → Upload files**, sube **el contenido de la carpeta `app-movil/`** (los archivos `index.html`, `manifest.webmanifest`, `sw.js`, `README.md` y las carpetas `icons` y `fonts`). Si ya existen `index.html` o `README.md`, se reemplazan. Presiona **Commit**.
4. Abre el Space y, en el menú **⋮ → Embed this Space**, copia el **Direct URL**.

### Poner el icono en el móvil
Abre ese Direct URL en el móvil:
- **Android (Chrome):** menú **⋮** → **Añadir a pantalla de inicio** / **Instalar app**.
- **iPhone (Safari):** botón **Compartir** → **Añadir a pantalla de inicio**.

---

## Activar la IA cinematográfica (opcional)

1. Crea una cuenta en **https://replicate.com** y agrega un método de pago.
2. Ve a **Account → API tokens** y copia tu clave (empieza con `r8_`).
3. En la carpeta del proyecto, copia el archivo `.env.example` y renómbralo como `.env`.
4. Ábrelo con el Bloc de notas y pega tu clave después de `REPLICATE_API_TOKEN=`.
5. Cierra la ventana negra y vuelve a abrir la app. La opción **🤖 IA cinematográfica** quedará activa.

Si la IA falla con alguna foto (por ejemplo, porque te quedaste sin saldo), la app usa el modo rápido para esa foto y te avisa.

---

## Consejos para que el video se vea profesional
- Usa fotos **nítidas y con buena luz**, mejor con fondo limpio.
- Incluye **ángulos distintos**: frente, perfil, detalle de la esfera, la correa y el reloj en la muñeca.
- Con 4 a 6 fotos se logra un video de unos 15 a 20 segundos, ideal para Reels.
- Usa música sin derechos de autor, por ejemplo de la biblioteca de audio de YouTube.

## Para programadores
- `server.js`: servidor Express con subida de archivos y trabajos en segundo plano.
- `src/video.js`: motor de video con FFmpeg (zoompan, xfade, subtítulos ASS para los textos y mezcla de audio).
- `src/ai.js`: conexión con Replicate (imagen → video). El modelo se cambia con `REPLICATE_MODEL`.
- Los videos se guardan en `trabajos/`.

Fuente incluida: Inter (SIL Open Font License).
