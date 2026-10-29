"""Historia de Instagram (1080x1920) con hueco para sticker de encuesta. Uso: python3 -I historia_encuesta.py"""
import os
from PIL import Image, ImageDraw, ImageFilter, ImageFont

D = os.path.dirname(os.path.abspath(__file__))
W, H = 1080, 1920
F = lambda w, s: ImageFont.truetype(f"/usr/share/fonts/opentype/inter/Inter-{w}.otf", s)
ORANGE, WHITE, MUTED, NAVY_CARD, BLUE = (255, 122, 26), (255, 255, 255), (176, 190, 220), (18, 36, 78), (40, 90, 200)

img = Image.new("RGBA", (W, H)); d = ImageDraw.Draw(img)
for y in range(H):
    t = y / H; d.line([0, y, W, y], fill=(int(6 + 6 * t), int(16 + 14 * t), int(40 + 32 * t), 255))
bl = Image.new("RGBA", (W, H), (0, 0, 0, 0)); g = ImageDraw.Draw(bl)
g.ellipse([-300, 150, 600, 1050], fill=BLUE + (110,)); g.ellipse([500, 1100, 1400, 2000], fill=ORANGE + (45,))
img.alpha_composite(bl.filter(ImageFilter.GaussianBlur(160)))
gr = Image.new("RGBA", (W, H), (0, 0, 0, 0)); g = ImageDraw.Draw(gr)
for x in range(0, W, 90): g.line([x, 0, x, H], fill=(255, 255, 255, 9))
for y in range(0, H, 90): g.line([0, y, W, y], fill=(255, 255, 255, 9))
img.alpha_composite(gr); d = ImageDraw.Draw(img)

def ctext(y, txt, f, fill, stroke=0):
    d.text(((W - d.textlength(txt, font=f)) / 2, y), txt, font=f, fill=fill, stroke_width=stroke, stroke_fill=(0, 0, 0))

# marca (por debajo de la barra superior de Instagram)
fo = F("Black", 60); ow = d.textlength("Obra", font=fo); tw = ow + d.textlength("Web", font=fo)
d.text(((W - tw) / 2, 230), "Obra", font=fo, fill=WHITE); d.text(((W - tw) / 2 + ow, 230), "Web", font=fo, fill=ORANGE)

ctext(350, "¿CUÁNTAS TIENE", F("Black", 100), WHITE)
ctext(465, "TU WEB?", F("Black", 100), ORANGE, stroke=4)

signs = ["Te da vergüenza pasar el enlace", "No recuerdas cuándo la actualizaste", "En el móvil hay que hacer zoom",
         "Nadie te escribe desde ella", "No apareces cuando te buscan"]
for k, s in enumerate(signs):
    y = 630 + k * 128
    card = Image.new("RGBA", (900, 108), (0, 0, 0, 0)); c = ImageDraw.Draw(card)
    c.rounded_rectangle([0, 0, 899, 107], 30, fill=NAVY_CARD + (235,), outline=(44, 70, 130), width=3)
    c.rounded_rectangle([28, 24, 88, 84], 14, outline=ORANGE, width=6)  # casilla vacía para que cada uno cuente las suyas
    f = F("Bold", 40)
    while c.textlength(s, font=f) > 760: f = F("Bold", f.size - 2)
    c.text((118, 54 - f.size * 0.6), s, font=f, fill=WHITE)
    img.alpha_composite(card, (90, y))

# hueco para el sticker de ENCUESTA (zona libre 1300-1560, por encima de la barra de respuesta)
# (sin marco: el sticker de encuesta va en este hueco)

ctext(1600, "Las 5 señales, en el último post  →", F("Bold", 40), MUTED)

out = os.path.join(D, "historias", "historia_002_encuesta_senales.png")
img.convert("RGB").save(out); print(out)
