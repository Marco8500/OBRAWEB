"""Imagen de feed 1:1 (1080x1080): "Instagram es alquiler. Tu web es tu casa." Uso: python3 -I imagen_alquiler.py"""
import os
from PIL import Image, ImageDraw, ImageFilter, ImageFont

D = os.path.dirname(os.path.abspath(__file__))
W, H = 1080, 1080
F = lambda w, s: ImageFont.truetype(f"/usr/share/fonts/opentype/inter/Inter-{w}.otf", s)
ORANGE, WHITE, MUTED, NAVY_CARD, BLUE, GREY = (255, 122, 26), (255, 255, 255), (176, 190, 220), (18, 36, 78), (40, 90, 200), (120, 130, 155)

img = Image.new("RGBA", (W, H)); d = ImageDraw.Draw(img)
for y in range(H):
    t = y / H; d.line([0, y, W, y], fill=(int(6 + 6 * t), int(16 + 14 * t), int(40 + 32 * t), 255))
bl = Image.new("RGBA", (W, H), (0, 0, 0, 0)); g = ImageDraw.Draw(bl)
g.ellipse([-300, 100, 500, 900], fill=BLUE + (100,)); g.ellipse([600, 400, 1400, 1200], fill=ORANGE + (55,))
img.alpha_composite(bl.filter(ImageFilter.GaussianBlur(150))); d = ImageDraw.Draw(img)

def ctext(d, y, txt, f, fill, x=W // 2):
    d.text((x - d.textlength(txt, font=f) / 2, y), txt, font=f, fill=fill)
def shadowed(L, blur=24, alpha=130):
    a = L.getchannel("A").filter(ImageFilter.GaussianBlur(blur))
    sh = Image.new("RGBA", L.size, (0, 0, 0, 0)); sh.putalpha(a.point(lambda v: v * alpha // 255))
    out = Image.new("RGBA", L.size, (0, 0, 0, 0)); out.alpha_composite(sh, (0, 14)); out.alpha_composite(L); return out

# titulares
ctext(d, 70, "Instagram es alquiler.", F("Black", 84), WHITE)
ctext(d, 170, "Tu web es tu casa.", F("Black", 84), ORANGE)

def card(title, lit, body1, body2, draw_icon):
    L = Image.new("RGBA", (440, 560), (0, 0, 0, 0)); c = ImageDraw.Draw(L)
    c.rounded_rectangle([0, 0, 439, 559], 40, fill=NAVY_CARD, outline=ORANGE if lit else (60, 80, 130), width=6)
    c.rounded_rectangle([110, -1, 330, 64], 24, fill=ORANGE if lit else (60, 70, 95))
    ctext(c, 10, title, F("Black", 38), WHITE, 220)
    draw_icon(L, c)
    ctext(c, 440, body1, F("Bold", 32), WHITE if lit else MUTED, 220); ctext(c, 484, body2, F("Bold", 32), WHITE if lit else MUTED, 220)
    return shadowed(L)

def rent_icon(L, c):  # edificio de pisos con cartel SE ALQUILA
    c.rectangle([120, 120, 320, 400], fill=(40, 50, 80))
    for r in range(4):
        for k in range(3): c.rectangle([140 + k * 60, 140 + r * 62, 180 + k * 60, 180 + r * 62], fill=(70, 85, 120))
    c.rectangle([170, 320, 270, 400], fill=(24, 30, 50))
    c.rounded_rectangle([60, 250, 240, 320], 10, fill=(200, 30, 40)); ctext(c, 266, "SE ALQUILA", F("Black", 28), WHITE, 150)
def home_icon(L, c):  # casa propia con llave
    c.polygon([(220, 110), (360, 230), (80, 230)], fill=ORANGE)
    c.rectangle([110, 230, 330, 400], fill=(245, 246, 252))
    c.rectangle([190, 300, 250, 400], fill=ORANGE)
    c.rectangle([130, 260, 175, 300], fill=(150, 175, 230)); c.rectangle([265, 260, 310, 300], fill=(150, 175, 230))
    c.ellipse([300, 300, 380, 380], outline=WHITE, width=12); c.line([300, 345, 250, 395], fill=WHITE, width=12); c.line([268, 378, 284, 394], fill=WHITE, width=10)

img.alpha_composite(card("ALQUILER", False, "Las normas", "las pone otro", rent_icon), (70, 300))
img.alpha_composite(card("TU CASA", True, "Las normas", "las pones tú", home_icon), (570, 300))
d = ImageDraw.Draw(img)
ctext(d, 548, "VS", F("Black", 56), WHITE)

# cierre
fo = F("Black", 52); ow = d.textlength("Obra", font=fo); tw = ow + d.textlength("Web", font=fo)
y = 935
L = Image.new("RGBA", (520, 96), (0, 0, 0, 0)); c = ImageDraw.Draw(L); c.rounded_rectangle([0, 0, 519, 95], 48, fill=ORANGE)
ctext(c, 22, "Escríbenos «WEB»", F("Black", 44), WHITE, 260)
img.alpha_composite(L, (500, y - 10))
d.text((90, y + 8), "Obra", font=fo, fill=WHITE); d.text((90 + ow, y + 8), "Web", font=fo, fill=ORANGE)

os.makedirs(os.path.join(D, "imagenes"), exist_ok=True)
out = os.path.join(D, "imagenes", "006_alquiler_vs_casa.jpg")
img.convert("RGB").save(out, quality=94); print(out)
