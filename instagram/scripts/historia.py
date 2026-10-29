"""Historia de Instagram (1080x1920) de ObraWeb. Uso: python3 -I historia.py"""
import os
from PIL import Image, ImageDraw, ImageFilter, ImageFont

D = os.path.dirname(os.path.abspath(__file__))
W, H = 1080, 1920
F = lambda w, s: ImageFont.truetype(f"/usr/share/fonts/opentype/inter/Inter-{w}.otf", s)
ACC, ACC2, WHITE, MUTED = (255, 122, 26), (255, 122, 26), (255, 255, 255), (176, 190, 220)
BLUE = (40, 90, 200)

# fondo igual que los videos
img = Image.new("RGBA", (W, H))
top, bot = (6, 16, 40), (12, 30, 72)
for y in range(H):
    t = y / H
    ImageDraw.Draw(img).line([0, y, W, y], fill=tuple(int(a * (1 - t) + b * t) for a, b in zip(top, bot)) + (255,))
blobs = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(blobs)
d.ellipse([-300, 150, 600, 1050], fill=BLUE + (120,)); d.ellipse([500, 1050, 1400, 1950], fill=ACC2 + (45,))
img.alpha_composite(blobs.filter(ImageFilter.GaussianBlur(160)))
grid = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(grid)
for x in range(0, W, 90): d.line([x, 0, x, H], fill=(255, 255, 255, 10))
for y in range(0, H, 90): d.line([0, y, W, y], fill=(255, 255, 255, 10))
img.alpha_composite(grid)

def ctext(d, y, txt, f, fill, x=W // 2, stroke=0):
    tw = d.textlength(txt, font=f); d.text((x - tw / 2, y), txt, font=f, fill=fill, stroke_width=stroke, stroke_fill=(0, 0, 0))

def shadow(layer, blur=30, alpha=130):
    a = layer.getchannel("A").filter(ImageFilter.GaussianBlur(blur))
    sh = Image.new("RGBA", layer.size, (0, 0, 0, 0)); sh.putalpha(a.point(lambda v: v * alpha // 255))
    out = Image.new("RGBA", layer.size, (0, 0, 0, 0)); out.alpha_composite(sh, (0, 18)); out.alpha_composite(layer); return out

d = ImageDraw.Draw(img)
# --- titular (debajo de la barra superior de Instagram, y > 250 px)
ctext(d, 290, "¿TU NEGOCIO", F("Black", 118), WHITE)
ctext(d, 420, "SIN WEB?", F("Black", 118), WHITE)

# --- maqueta: navegador + móvil
L = Image.new("RGBA", (760, 560), (0, 0, 0, 0)); g = ImageDraw.Draw(L)
g.rounded_rectangle([0, 0, 759, 559], 30, fill=(245, 246, 252))
g.rounded_rectangle([0, 0, 759, 64], 30, fill=(225, 228, 240)); g.rectangle([0, 40, 759, 64], fill=(225, 228, 240))
for i, c in enumerate([(255, 95, 87), (255, 189, 46), (40, 200, 64)]): g.ellipse([24 + i * 36, 20, 48 + i * 36, 44], fill=c)
g.rounded_rectangle([150, 14, 730, 50], 18, fill=WHITE); g.text((170, 19), "tunegocio.com", font=F("Medium", 24), fill=(90, 95, 120))
g.text((40, 90), "TU NEGOCIO", font=F("Black", 28), fill=(20, 20, 40))
g.rounded_rectangle([40, 140, 720, 390], 22, fill=ACC)
g.text((70, 165), "Lo mejor para", font=F("Black", 50), fill=WHITE); g.text((70, 225), "tus clientes", font=F("Black", 50), fill=WHITE)
g.rounded_rectangle([70, 315, 300, 365], 25, fill=WHITE); ctext(g, 325, "Contactar", F("Bold", 26), ACC, 185)
for k in range(3):
    x = 40 + k * 230
    g.rounded_rectangle([x, 410, x + 210, 535], 18, fill=(230, 232, 245)); g.ellipse([x + 80, 430, x + 130, 480], fill=ACC2)
img.alpha_composite(shadow(L), (110, 600))
P = Image.new("RGBA", (300, 600), (0, 0, 0, 0)); g = ImageDraw.Draw(P)
g.rounded_rectangle([0, 0, 299, 599], 46, fill=(14, 15, 26), outline=(70, 74, 110), width=5)
g.rounded_rectangle([110, 16, 190, 36], 10, fill=(0, 0, 0))
g.rounded_rectangle([20, 60, 279, 230], 24, fill=ACC); g.text((40, 100), "Tu", font=F("Black", 44), fill=WHITE); g.text((40, 150), "negocio", font=F("Black", 44), fill=WHITE)
for k in range(2): g.rounded_rectangle([20, 260 + k * 140, 279, 380 + k * 140], 20, fill=(42, 45, 74))
img.alpha_composite(shadow(P, 24), (740, 560), )

# --- precio
ctext(d, 1215, "Tu web profesional en", F("Bold", 56), MUTED)
ctext(d, 1290, "2 cuotas de 135€", F("Black", 104), ACC2, stroke=6)
ctext(d, 1415, "270 € en total", F("Medium", 40), MUTED)

# --- hueco para sticker (enlace / "Enviar mensaje") + CTA, por encima de la zona inferior (> 340 px libres)
d.rounded_rectangle([200, 1490, 880, 1570], 40, outline=(255, 255, 255, 90), width=3)
ctext(d, 1508, "Escríbenos  →  «WEB»", F("Black", 42), WHITE)

# --- marca
fo = F("Black", 64); ow = d.textlength("Obra", font=fo); tw = ow + d.textlength("Web", font=fo)
d.text(((W - tw) / 2, 160), "Obra", font=fo, fill=WHITE); d.text(((W - tw) / 2 + ow, 160), "Web", font=fo, fill=ACC2)

os.makedirs(os.path.join(D, "historias"), exist_ok=True)
out = os.path.join(D, "historias", "historia_001_cuotas.png")
img.convert("RGB").save(out); print(out)
