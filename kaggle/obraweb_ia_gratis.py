# =====================================================================
#  OBRAWEB · IA de video GRATIS en Kaggle (Wan 2.2, código abierto)
#  Pega TODO este código en una celda de Kaggle y pulsa ▶ (Run).
#  Requisitos en Kaggle: Settings → Accelerator: "GPU T4 x2"  y  Internet: ON
# =====================================================================
import subprocess, sys

def _pip(*pkgs):
    subprocess.run([sys.executable, "-m", "pip", "install", "-q", "-U", *pkgs], check=True)

print("1/3 Instalando programas (2-4 minutos)...")
_pip("diffusers>=0.35.1", "transformers>=4.49", "accelerate", "ftfy", "sentencepiece",
     "gradio>=4.44", "imageio", "imageio-ffmpeg")

import os, gc, random, tempfile, shutil, time
os.environ["PYTORCH_CUDA_ALLOC_CONF"] = "expandable_segments:True"
import numpy as np
import torch
import gradio as gr
import imageio_ffmpeg
from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageOps
from diffusers import WanImageToVideoPipeline, AutoencoderKLWan
from diffusers.utils import export_to_video

assert torch.cuda.is_available(), "No hay GPU. Ve a Settings → Accelerator → GPU T4 x2 y vuelve a ejecutar."
FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()

# ---------------------------------------------------------------------
# Modelo: Wan 2.2 TI2V-5B (abierto, Apache 2.0). Cabe en una GPU T4 gratuita.
# ---------------------------------------------------------------------
MODEL_ID = "Wan-AI/Wan2.2-TI2V-5B-Diffusers"
W, H = 704, 1280          # vertical 9:16 (resolución nativa del modelo)
FPS = 24

print("2/3 Descargando la IA Wan 2.2 (la primera vez tarda 5-10 minutos)...")
vae = AutoencoderKLWan.from_pretrained(MODEL_ID, subfolder="vae", torch_dtype=torch.float32)
pipe = WanImageToVideoPipeline.from_pretrained(MODEL_ID, vae=vae, torch_dtype=torch.float16)

# ---------------------------------------------------------------------
# Tomas de anuncio de relojes (prompts profesionales)
# ---------------------------------------------------------------------
SHOTS = {
    "Primer plano (cámara acercándose)":
        "Extreme macro close-up of the luxury watch dial, slow cinematic camera push-in, soft studio light "
        "sweeping across the polished bezel, shallow depth of field, dark background, premium watch commercial, "
        "smooth motion, the watch design stays exactly the same",
    "Giro alrededor del reloj":
        "Slow cinematic camera orbit around the luxury watch, elegant light reflections gliding over the bezel "
        "and bracelet, dark studio background, high-end advertising, smooth motion, the watch design stays exactly the same",
    "Reloj girando de perfil":
        "The luxury watch slowly rotates to show its side profile, floating against a dark gradient background, "
        "dramatic rim light, premium commercial, smooth motion, the watch design stays exactly the same",
    "En la muñeca (traje)":
        "A man in an elegant suit adjusts his shirt cuff revealing the luxury watch on his wrist, warm elegant "
        "office background, cinematic lighting, shallow depth of field, smooth motion",
    "Destello de luz":
        "Luxury watch commercial, the camera holds still while a bright beam of light slowly glides across the "
        "watch creating sparkling reflections on the crystal and metal, dark elegant background, smooth motion",
}
AUTO_ORDER = ["Primer plano (cámara acercándose)", "Giro alrededor del reloj", "Destello de luz", "Reloj girando de perfil"]
NEGATIVE = ("deformed watch, warped dial, changing text, extra hands, melting, distorted logo, blurry, low quality, "
            "jittery, flicker, watermark, text overlay, cartoon")

# Los prompts son fijos: se "traducen" UNA vez con el codificador de texto (muy grande)
# y después se saca de la GPU para dejar toda la memoria a la parte que crea el video.
print("   Preparando las tomas (1-2 minutos)...")
pipe.text_encoder.to("cuda")
EMB = {}
with torch.no_grad():
    for name, prompt in SHOTS.items():
        pe, ne = pipe.encode_prompt(prompt=prompt, negative_prompt=NEGATIVE, do_classifier_free_guidance=True,
                                    max_sequence_length=512, device=torch.device("cuda"))
        EMB[name] = (pe.to(torch.float16), ne.to(torch.float16))
pipe.text_encoder.to("cpu")
pipe.text_encoder = None
gc.collect(); torch.cuda.empty_cache()
pipe.to("cuda")
try:
    pipe.vae.enable_tiling()
except Exception:
    pass
print(f"   Memoria de video en uso: {torch.cuda.memory_allocated() / 1e9:.1f} GB de "
      f"{torch.cuda.get_device_properties(0).total_memory / 1e9:.1f} GB")

def prepare_image(path):
    """Ajusta la foto a 9:16 sin recortar el reloj: fondo desenfocado de la misma foto."""
    img = ImageOps.exif_transpose(Image.open(path)).convert("RGB")
    bg = ImageOps.fit(img, (W, H)).filter(ImageFilter.GaussianBlur(40))
    bg = Image.blend(bg, Image.new("RGB", (W, H), (8, 8, 10)), 0.45)
    fg = img.copy()
    fg.thumbnail((W, H), Image.LANCZOS)
    bg.paste(fg, ((W - fg.width) // 2, (H - fg.height) // 2))
    return bg

def generate_clip(path, shot, frames, steps, seed, out_path):
    image = prepare_image(path)
    gen = torch.Generator(device="cpu").manual_seed(int(seed))
    pe, ne = EMB[shot]
    result = pipe(image=image, prompt_embeds=pe, negative_prompt_embeds=ne, height=H, width=W,
                  num_frames=int(frames), num_inference_steps=int(steps), guidance_scale=5.0, generator=gen)
    export_to_video(result.frames[0], out_path, fps=FPS)
    del result
    gc.collect(); torch.cuda.empty_cache()
    return out_path

# ---------------------------------------------------------------------
# Montaje final: transiciones, pantalla con la marca y música
# ---------------------------------------------------------------------
def _font(size):
    for f in ["/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf"]:
        if os.path.exists(f):
            return ImageFont.truetype(f, size)
    return ImageFont.load_default()

def end_card(brand, tagline, cta, path):
    img = Image.new("RGB", (1080, 1920), (11, 11, 12))
    d = ImageDraw.Draw(img)
    def center(text, y, size, color, spacing=0):
        if not text:
            return
        f = _font(size)
        while d.textlength(text, font=f) + spacing * len(text) > 960 and size > 30:
            size -= 4; f = _font(size)
        x = (1080 - (d.textlength(text, font=f) + spacing * (len(text) - 1))) / 2
        for ch in text:
            d.text((x, y), ch, font=f, fill=color, anchor="lm"); x += d.textlength(ch, font=f) + spacing
    center(brand.upper(), 806, 92, (255, 255, 255), 10)
    d.rectangle([420, 900, 660, 903], fill=(201, 164, 92))
    center(tagline, 975, 44, (217, 212, 202), 2)
    center(cta, 1536, 40, (255, 255, 255), 1)
    img.save(path)

def run_ffmpeg(args):
    r = subprocess.run([FFMPEG, "-hide_banner", "-loglevel", "error", "-y", *args], capture_output=True, text=True)
    if r.returncode != 0:
        raise RuntimeError(r.stderr[-800:])

def assemble(clips, card, music, out_path, workdir):
    T = 0.5
    norm, durs = [], []
    for i, c in enumerate(clips):
        n = os.path.join(workdir, f"n{i}.mp4")
        run_ffmpeg(["-i", c, "-vf", f"scale=1080:1920:flags=lanczos,fps=30,format=yuv420p", "-an",
                    "-c:v", "libx264", "-crf", "17", "-preset", "fast", n])
        r = subprocess.run([FFMPEG, "-i", n], capture_output=True, text=True).stderr
        dur = 3.0
        for line in r.splitlines():
            if "Duration:" in line:
                hh, mm, ss = line.split("Duration:")[1].split(",")[0].strip().split(":")
                dur = int(hh) * 3600 + int(mm) * 60 + float(ss)
        norm.append(n); durs.append(dur)
    if card:
        n = os.path.join(workdir, "card.mp4")
        run_ffmpeg(["-loop", "1", "-i", card, "-t", "3", "-vf", "fps=30,format=yuv420p,fade=t=in:st=0:d=0.6",
                    "-c:v", "libx264", "-crf", "17", n])
        norm.append(n); durs.append(3.0)
    args, filt, last, offset = [], "", "0:v", 0.0
    for c in norm:
        args += ["-i", c]
    for i in range(1, len(norm)):
        offset += durs[i - 1] - T
        filt += f"[{last}][{i}:v]xfade=transition=fade:duration={T}:offset={offset:.3f}[x{i}];"
        last = f"x{i}"
    total = sum(durs) - T * (len(norm) - 1)
    filt += f"[{last}]fade=t=in:st=0:d=0.4,format=yuv420p[v]"
    maps = ["-map", "[v]"]
    if music:
        args += ["-stream_loop", "-1", "-i", music]
        filt += (f";[{len(norm)}:a]atrim=duration={total:.3f},afade=t=in:st=0:d=0.8,"
                 f"afade=t=out:st={max(0, total - 1.5):.3f}:d=1.5[a]")
        maps += ["-map", "[a]", "-c:a", "aac", "-b:a", "192k"]
    run_ffmpeg([*args, "-filter_complex", filt, *maps, "-t", f"{total:.3f}", "-c:v", "libx264", "-crf", "18",
                "-preset", "medium", "-pix_fmt", "yuv420p", "-movflags", "+faststart", out_path])
    return out_path

# ---------------------------------------------------------------------
# App (se abre en un enlace que puedes usar desde el móvil)
# ---------------------------------------------------------------------
def crear_anuncio(fotos, tomas_txt, marca, frase, cta, musica, duracion, calidad, progress=gr.Progress()):
    if not fotos:
        raise gr.Error("Sube al menos una foto del reloj.")
    fotos = [f if isinstance(f, str) else f.name for f in fotos][:6]
    elegidas = [s.strip() for s in (tomas_txt or "").split(",") if s.strip()]
    frames = {"Corto (2 s)": 49, "Normal (3 s)": 73, "Largo (4 s)": 97}[duracion]
    steps = {"Rápida": 20, "Buena": 30, "Máxima": 40}[calidad]
    work = tempfile.mkdtemp(prefix="obraweb_")
    clips = []
    t0 = time.time()
    for i, f in enumerate(fotos):
        shot = elegidas[i] if i < len(elegidas) and elegidas[i] in SHOTS else AUTO_ORDER[i % len(AUTO_ORDER)]
        progress(i / (len(fotos) + 1), desc=f"IA animando foto {i + 1} de {len(fotos)}: {shot}...")
        clips.append(generate_clip(f, shot, frames, steps, random.randint(0, 2**31 - 1),
                                   os.path.join(work, f"clip{i}.mp4")))
        print(f"  ✅ Clip {i + 1} listo en {time.time() - t0:.0f} s")
    progress(len(fotos) / (len(fotos) + 1), desc="Montando el anuncio final...")
    card = None
    if marca or frase or cta:
        card = os.path.join(work, "card.png")
        end_card(marca or "", frase or "", cta or "", card)
    out = os.path.join(work, "anuncio-reloj.mp4")
    assemble(clips, card, musica if isinstance(musica, (str, type(None))) else musica.name, out, work)
    return out, clips

with gr.Blocks(title="OBRAWEB · IA de video", theme=gr.themes.Soft(primary_hue="amber")) as app:
    gr.Markdown("# ⌚ OBRAWEB · Anuncios de relojes con IA\nSube fotos de tu reloj y la IA (Wan 2.2) crea cada toma animada y monta el anuncio.")
    with gr.Row():
        with gr.Column():
            fotos = gr.File(label="Fotos del reloj (1 a 6)", file_count="multiple", file_types=["image"])
            tomas = gr.Textbox(label="Tomas (opcional, separadas por comas)",
                               placeholder="Déjalo vacío para elegir automáticamente. Opciones: " + ", ".join(SHOTS))
            marca = gr.Textbox(label="Marca o nombre del reloj")
            frase = gr.Textbox(label="Frase")
            cta = gr.Textbox(label="Llamada a la acción")
            musica = gr.File(label="Música (opcional)", file_types=["audio"])
            duracion = gr.Radio(["Corto (2 s)", "Normal (3 s)", "Largo (4 s)"], value="Normal (3 s)", label="Duración de cada toma")
            calidad = gr.Radio(["Rápida", "Buena", "Máxima"], value="Buena", label="Calidad (más calidad = más lento)")
            boton = gr.Button("🎬 Crear anuncio", variant="primary")
        with gr.Column():
            video = gr.Video(label="Tu anuncio")
            sueltos = gr.Files(label="Clips sueltos")
    boton.click(crear_anuncio, [fotos, tomas, marca, frase, cta, musica, duracion, calidad], [video, sueltos])

print("3/3 ¡Listo! Abre el enlace que termina en .gradio.live (funciona también en el móvil):")
app.queue().launch(share=True, debug=True)
