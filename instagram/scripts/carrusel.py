"""Carrusel de Instagram (1080x1080, 1:1) de ObraWeb. Uso: python3 -I carrusel.py guiones/XXX_carrusel.json"""
import json, math, os, sys
from PIL import Image, ImageDraw, ImageFilter, ImageFont

D = os.path.dirname(os.path.abspath(__file__))
GUION = os.path.abspath(sys.argv[1]); NAME = os.path.splitext(os.path.basename(GUION))[0]
OUT = os.path.join(D, "carruseles", NAME); os.makedirs(OUT, exist_ok=True)
W, H = 1080, 1080
F = lambda w, s: ImageFont.truetype(f"/usr/share/fonts/opentype/inter/Inter-{w}.otf", s)
ORANGE, WHITE, MUTED, NAVY_CARD, BLUE, GREY = (255, 122, 26), (255, 255, 255), (176, 190, 220), (18, 36, 78), (40, 90, 200), (120, 130, 155)

def bg():
    img = Image.new("RGBA", (W, H)); d = ImageDraw.Draw(img)
    for y in range(H):
        t = y / H; d.line([0, y, W, y], fill=(int(6 + 6 * t), int(16 + 14 * t), int(40 + 32 * t), 255))
    bl = Image.new("RGBA", (W, H), (0, 0, 0, 0)); g = ImageDraw.Draw(bl)
    g.ellipse([-300, 100, 600, 900], fill=BLUE + (110,)); g.ellipse([550, 800, 1400, 1600], fill=ORANGE + (45,))
    img.alpha_composite(bl.filter(ImageFilter.GaussianBlur(150)))
    gr = Image.new("RGBA", (W, H), (0, 0, 0, 0)); g = ImageDraw.Draw(gr)
    for x in range(0, W, 90): g.line([x, 0, x, H], fill=(255, 255, 255, 9))
    for y in range(0, H, 90): g.line([0, y, W, y], fill=(255, 255, 255, 9))
    img.alpha_composite(gr); return img

def layer(w, h): L = Image.new("RGBA", (w, h), (0, 0, 0, 0)); return L, ImageDraw.Draw(L)
def shadowed(L, blur=26, alpha=130):
    a = L.getchannel("A").filter(ImageFilter.GaussianBlur(blur))
    sh = Image.new("RGBA", L.size, (0, 0, 0, 0)); sh.putalpha(a.point(lambda v: v * alpha // 255))
    out = Image.new("RGBA", L.size, (0, 0, 0, 0)); out.alpha_composite(sh, (0, 16)); out.alpha_composite(L); return out
def put(img, L, cx, cy, rot=0):
    if rot: L = L.rotate(rot, expand=True, resample=Image.BICUBIC)
    img.alpha_composite(L, (int(cx - L.width / 2), int(cy - L.height / 2)))
def wrap(d, txt, f, maxw):
    out, cur = [], ""
    for w in txt.split():
        t = (cur + " " + w).strip()
        if d.textlength(t, font=f) > maxw and cur: out.append(cur); cur = w
        else: cur = t
    return out + [cur]
def text_block(d, y, txt, size, col, maxw=W - 160, weight="Black", hl=None):
    """Texto centrado con salto de línea; las palabras de `hl` van en naranja."""
    f = F(weight, size); lines = wrap(d, txt, f, maxw); lh = int(size * 1.15)
    for ln in lines:
        x = (W - d.textlength(ln, font=f)) / 2
        for w in ln.split():
            c = ORANGE if hl and w.strip("¿?.,!¡«»").lower() in hl else col
            d.text((x, y), w, font=f, fill=c); x += d.textlength(w + " ", font=f)
        y += lh
    return y
def logo(d, y, size=54):
    fo = F("Black", size); ow = d.textlength("Obra", font=fo); tw = ow + d.textlength("Web", font=fo)
    d.text(((W - tw) / 2, y), "Obra", font=fo, fill=WHITE); d.text(((W - tw) / 2 + ow, y), "Web", font=fo, fill=ORANGE)
def browser(w, h, url="tunegocio.com", content=None):
    L, d = layer(w, h)
    d.rounded_rectangle([0, 0, w - 1, h - 1], 28, fill=(245, 246, 252))
    d.rounded_rectangle([0, 0, w - 1, 62], 28, fill=(222, 226, 238)); d.rectangle([0, 36, w - 1, 62], fill=(222, 226, 238))
    for i, c in enumerate([(255, 95, 87), (255, 189, 46), (40, 200, 64)]): d.ellipse([22 + i * 34, 20, 44 + i * 34, 42], fill=c)
    d.rounded_rectangle([140, 13, w - 26, 50], 18, fill=WHITE); d.text((160, 18), url, font=F("Medium", 24), fill=(90, 95, 120))
    if content: content(L, d, w, h)
    return shadowed(L)
def phone(w, h, content=None):
    L, d = layer(w, h)
    d.rounded_rectangle([0, 0, w - 1, h - 1], 56, fill=(10, 14, 30), outline=(70, 90, 140), width=6)
    d.rounded_rectangle([w // 2 - 60, 18, w // 2 + 60, 42], 12, fill=(0, 0, 0))
    if content: content(L, d, w, h)
    return shadowed(L)

# ---------- ilustraciones de cada señal ----------
def ill_shame(img):
    def c(L, d, w, h):
        d.rectangle([24, 90, w - 24, 160], fill=(200, 200, 205)); d.text((40, 104), "MI NEGOCIO", font=F("Black", 38), fill=(120, 120, 130))
        for k in range(0, w, 56): d.polygon([(k, 190), (k + 28, 190), (k + 56, 240), (k + 28, 240)], fill=(240, 200, 40))
        for r in range(4): d.rectangle([50, 280 + r * 34, 50 + (r * 97) % 300 + 220, 296 + r * 34], fill=(205, 207, 214))
    put(img, browser(640, 460, "minegocio-1998.com", c), 470, 640, -4)
    L, d = layer(300, 140); d.rounded_rectangle([0, 0, 299, 110], 50, fill=ORANGE); d.polygon([(40, 100), (90, 100), (30, 138)], fill=ORANGE)
    d.text((40, 22), "¿me pasas", font=F("Bold", 34), fill=WHITE); d.text((40, 60), "tu web?", font=F("Black", 34), fill=WHITE)
    put(img, L, 800, 420)
def ill_old(img):
    L, d = layer(480, 520); d.rounded_rectangle([0, 60, 479, 519], 36, fill=(245, 246, 252)); d.rounded_rectangle([0, 60, 479, 180], 36, fill=ORANGE); d.rectangle([0, 140, 479, 180], fill=ORANGE)
    for x in (110, 370): d.rounded_rectangle([x - 18, 20, x + 18, 110], 18, fill=(60, 70, 95))
    d.text((150, 92), "2019", font=F("Black", 64), fill=WHITE)
    for r in range(3):
        for c in range(5): d.rounded_rectangle([40 + c * 82, 220 + r * 92, 100 + c * 82, 280 + r * 92], 10, fill=(225, 228, 240))
    L2, d2 = layer(130, 130); d2.ellipse([0, 0, 129, 129], fill=(30, 50, 100)); d2.text((38, 8), "?", font=F("Black", 96), fill=WHITE)
    L.alpha_composite(L2, (330, 350)); put(img, shadowed(L), W / 2, 660, 3)
def ill_zoom(img):
    def c(L, d, w, h):
        d.rounded_rectangle([16, 62, w - 16, h - 16], 44, fill=(245, 246, 252))
        d.rectangle([16, 100, w + 200, 160], fill=(200, 205, 220)); d.text((30, 116), "Inicio · Servicios · Contacto · Blog", font=F("Bold", 26), fill=(60, 60, 80))
        for r in range(16): d.rectangle([32, 190 + r * 20, 32 + 560, 198 + r * 20], fill=(200, 203, 214))
    put(img, phone(400, 760, c), 470, 680)
    L, d = layer(300, 300); d.ellipse([10, 10, 210, 210], outline=ORANGE, width=22); d.line([180, 180, 280, 280], fill=ORANGE, width=36)
    d.text((70, 52), "+", font=F("Black", 110), fill=WHITE); put(img, L, 720, 760)
def ill_silence(img):
    L, d = layer(560, 520); d.rounded_rectangle([0, 0, 559, 519], 40, fill=(245, 246, 252))
    d.text((40, 36), "Mensajes", font=F("Black", 48), fill=(20, 20, 40)); d.line([40, 110, 520, 110], fill=(220, 224, 236), width=4)
    d.text((40, 220), "0", font=F("Black", 180), fill=ORANGE); d.text((200, 260), "mensajes", font=F("Bold", 46), fill=(110, 110, 130)); d.text((200, 320), "este mes", font=F("Bold", 46), fill=(110, 110, 130))
    put(img, shadowed(L), W / 2, 650, -2)
    L2, d2 = layer(200, 200)
    for k, r in enumerate([40, 70, 100]): d2.arc([100 - r, 100 - r, 100 + r, 100 + r], 200, 340, fill=(255, 255, 255, 120 - k * 30), width=10)
    put(img, L2, 820, 400)
def ill_google(img):
    L, d = layer(820, 560); d.rounded_rectangle([0, 0, 819, 559], 40, fill=(245, 246, 252))
    d.rounded_rectangle([40, 40, 780, 120], 40, fill=(228, 231, 242)); d.ellipse([70, 58, 110, 98], outline=GREY, width=6); d.line([104, 92, 120, 108], fill=GREY, width=7)
    d.text((140, 56), "peluquería cerca de mí", font=F("Medium", 36), fill=(40, 40, 60))
    for k, n in enumerate(["La competencia", "Otro negocio", "Tienda rival"]):
        y = 160 + k * 125; d.rounded_rectangle([40, y, 780, y + 105], 20, fill=(232, 235, 245))
        d.ellipse([60, y + 22, 120, y + 82], fill=(60, 90, 170)); d.text((145, y + 30), n, font=F("Bold", 40), fill=(20, 20, 40))
    put(img, shadowed(L), W / 2, 620)
    T, d = layer(520, 110); d.rounded_rectangle([0, 0, 519, 109], 54, fill=ORANGE); d.text((44, 26), "Tú: no apareces", font=F("Black", 50), fill=WHITE)
    put(img, T, W / 2, 940, -3)
ILL = dict(shame=ill_shame, old=ill_old, zoom=ill_zoom, silence=ill_silence, google=ill_google)

# ---------- diapositivas (1:1, 1080x1080) ----------
slides = json.load(open(GUION)); n = len(slides)
for i, s in enumerate(slides):
    img = bg(); d = ImageDraw.Draw(img)
    logo(d, 40, 42)
    if s["type"] == "cover":
        y = text_block(d, 150, s["title"], 92, WHITE, hl=s.get("hl"))
        L, d2 = layer(W, 220); f = F("Black", 190)
        while d2.textlength(s["big"], font=f) > W - 120: f = F("Black", f.size - 6)
        tw = d2.textlength(s["big"], font=f)
        d2.text(((W - tw) / 2, 0), s["big"], font=f, fill=ORANGE, stroke_width=6, stroke_fill=(0, 0, 0))
        img.alpha_composite(L.filter(ImageFilter.GaussianBlur(30)), (0, y + 20)); img.alpha_composite(L, (0, y + 20))
        d = ImageDraw.Draw(img); y = text_block(d, y + 250, s["sub"], 50, MUTED, weight="Bold")
        L, d2 = layer(400, 96); d2.rounded_rectangle([0, 0, 399, 95], 48, fill=ORANGE); d2.text((64, 22), "Desliza  →", font=F("Black", 46), fill=WHITE)
        put(img, L, W / 2, H - 110)
    elif s["type"] == "sign":
        L, d2 = layer(280, 80); d2.rounded_rectangle([0, 0, 279, 79], 40, fill=ORANGE); d2.text((38, 14), f"SEÑAL {s['num']}", font=F("Black", 46), fill=WHITE)
        put(img, L, W / 2, 140)
        y = text_block(d, 200, s["title"], 70, WHITE, hl=s.get("hl"))
        cv = Image.new("RGBA", (W, 1350), (0, 0, 0, 0)); ILL[s["ill"]](cv)  # ilustración encajada bajo el título
        cv = cv.crop(cv.getbbox()); top = y + 20; box_h = 830 - top
        sc = min(860 / cv.width, box_h / cv.height, 1.0); cv = cv.resize((int(cv.width * sc), int(cv.height * sc)), Image.LANCZOS)
        img.alpha_composite(cv, (int((W - cv.width) / 2), int(top + (box_h - cv.height) / 2))); d = ImageDraw.Draw(img)
        text_block(d, 855, s["body"], 38, MUTED, weight="Medium")
        if s.get("next"):
            L, d2 = layer(W, 60); f = F("Bold", 36); t = s["next"] + "  →"; d2.text((W - 60 - d2.textlength(t, font=f), 6), t, font=f, fill=ORANGE)
            img.alpha_composite(L, (0, H - 80))
    else:  # cta
        y = text_block(d, 170, s["title"], 88, WHITE, hl=s.get("hl"))
        y = text_block(d, y + 25, s["body"], 46, MUTED, weight="Bold")
        L, d2 = layer(800, 160); d2.rounded_rectangle([0, 0, 799, 159], 80, fill=ORANGE)
        f = F("Black", 64); t = "Escríbenos «WEB»"; d2.text(((800 - d2.textlength(t, font=f)) / 2, 40), t, font=f, fill=WHITE)
        put(img, L.filter(ImageFilter.GaussianBlur(30)), W / 2, y + 150); put(img, L, W / 2, y + 150)
        d = ImageDraw.Draw(img); text_block(d, y + 270, s["save"], 42, WHITE, weight="Bold")
    img.convert("RGB").save(os.path.join(OUT, f"{i + 1:02d}.jpg"), quality=93)
print("listo", OUT, n, "diapositivas")
