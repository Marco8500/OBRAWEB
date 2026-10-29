"""Reels v2 con las 3 reglas: gancho que explota en el 1er segundo, todo lo que se dice se ve
(un plano por frase) y bucles abiertos. Uso: python3 -I reel.py guiones/XXX.json"""
import json, math, os, subprocess, sys, wave
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

D = os.path.dirname(os.path.abspath(__file__))
GUION = os.path.abspath(sys.argv[1])
NAME = os.path.splitext(os.path.basename(GUION))[0]
B = os.path.join(D, "build", NAME)
W, H, FPS = 1080, 1920, 30
F = lambda w, s: ImageFont.truetype(f"/usr/share/fonts/opentype/inter/Inter-{w}.otf", s)

# Marca ObraWeb: azul marino, blanco y naranja
ORANGE, WHITE, MUTED = (255, 122, 26), (255, 255, 255), (176, 190, 220)
NAVY_CARD, BLUE, GREY = (18, 36, 78), (40, 90, 200), (120, 130, 155)
IMPACT = 0.12  # segundo en que explota el gancho

rng = np.random.default_rng(3)
ease = lambda x: 1 - (1 - min(max(x, 0.0), 1.0)) ** 3
def back(x):
    x = min(max(x, 0.0), 1.0); c = 1.7
    return 1 + (c + 1) * (x - 1) ** 3 + c * (x - 1) ** 2

# ---------------- guion + voz ----------------
scenes = json.load(open(GUION))
for i, s in enumerate(scenes):
    with wave.open(os.path.join(B, f"v{i}.wav")) as w:
        s["sr"] = w.getframerate()
        s["audio"] = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(np.float32) / 32768
    s["vd"] = len(s["audio"]) / s["sr"]
    s["pin"] = 0.3 if i == 0 else 0.06
    s["dur"] = s["pin"] + s["vd"] + 0.1

# ---------------- utilidades de dibujo ----------------
def make_bg():
    yy = np.linspace(0, 1, H)[:, None, None]
    g = (np.array([6, 16, 40]) * (1 - yy) + np.array([12, 30, 72]) * yy).repeat(W, 1)
    img = Image.fromarray(g.astype(np.uint8)).convert("RGBA")
    bl = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(bl)
    d.ellipse([-300, 200, 600, 1100], fill=BLUE + (110,)); d.ellipse([500, 1100, 1400, 2000], fill=ORANGE + (40,))
    img.alpha_composite(bl.filter(ImageFilter.GaussianBlur(160)))
    gr = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(gr)
    for x in range(0, W, 90): d.line([x, 0, x, H], fill=(255, 255, 255, 9))
    for y in range(0, H, 90): d.line([0, y, W, y], fill=(255, 255, 255, 9))
    img.alpha_composite(gr)
    return img
BG = make_bg()

def layer(w, h):
    L = Image.new("RGBA", (w, h), (0, 0, 0, 0)); return L, ImageDraw.Draw(L)
def ctext(d, y, txt, f, fill, x=W // 2, stroke=0):
    tw = d.textlength(txt, font=f)
    d.text((x - tw / 2, y), txt, font=f, fill=fill, stroke_width=stroke, stroke_fill=(0, 0, 0))
def shadowed(L, blur=26, alpha=130):
    a = L.getchannel("A").filter(ImageFilter.GaussianBlur(blur))
    sh = Image.new("RGBA", L.size, (0, 0, 0, 0)); sh.putalpha(a.point(lambda v: v * alpha // 255))
    out = Image.new("RGBA", L.size, (0, 0, 0, 0)); out.alpha_composite(sh, (0, 16)); out.alpha_composite(L); return out
def place(fr, L, cx, cy, scale=1.0, alpha=1.0, rot=0):
    if alpha <= 0.01 or scale <= 0.01: return
    if scale != 1: L = L.resize((max(1, int(L.width * scale)), max(1, int(L.height * scale))), Image.BILINEAR)
    if rot: L = L.rotate(rot, expand=True, resample=Image.BILINEAR)
    if alpha < 1: L = L.copy(); L.putalpha(L.getchannel("A").point(lambda v: int(v * alpha)))
    fr.alpha_composite(L, (int(cx - L.width / 2), int(cy - L.height / 2)))
def headline(fr, t, txt, y=300, size=96, col=WHITE, delay=0.0):
    f = F("Black", size); L, d = layer(W, int(size * 1.4))
    while d.textlength(txt, font=f) > W - 100: f = F("Black", f.size - 4)
    ctext(d, 10, txt, f, col, stroke=6)
    place(fr, L, W / 2, y, 1.5 - 0.5 * back((t - delay) / 0.25), ease((t - delay) / 0.12))
def badge(fr, t, txt, y=200):
    f = F("Black", 54); L, d = layer(W, 120); tw = d.textlength(txt, font=f)
    d.rounded_rectangle([(W - tw) / 2 - 40, 10, (W + tw) / 2 + 40, 100], 45, fill=ORANGE)
    ctext(d, 22, txt, f, WHITE)
    place(fr, L, W / 2, y, back(t / 0.25), 1)
def person(col=WHITE, s=1.0):
    L, d = layer(int(120 * s), int(220 * s))
    d.ellipse([30 * s, 0, 90 * s, 60 * s], fill=col); d.rounded_rectangle([10 * s, 70 * s, 110 * s, 220 * s], int(40 * s), fill=col)
    return L
def browser(w=820, h=700, url="tunegocio.com", content=None, t=0):
    L, d = layer(w, h)
    d.rounded_rectangle([0, 0, w - 1, h - 1], 32, fill=(245, 246, 252))
    d.rounded_rectangle([0, 0, w - 1, 72], 32, fill=(222, 226, 238)); d.rectangle([0, 44, w - 1, 72], fill=(222, 226, 238))
    for i, c in enumerate([(255, 95, 87), (255, 189, 46), (40, 200, 64)]): d.ellipse([24 + i * 38, 24, 50 + i * 38, 50], fill=c)
    d.rounded_rectangle([160, 16, w - 30, 58], 21, fill=WHITE); d.text((182, 22), url, font=F("Medium", 26), fill=(90, 95, 120))
    if content: content(L, d, w, h, t)
    return L
def phone(w=520, h=1000, content=None, t=0):
    L, d = layer(w, h)
    d.rounded_rectangle([0, 0, w - 1, h - 1], 66, fill=(10, 14, 30), outline=(70, 90, 140), width=6)
    d.rounded_rectangle([w // 2 - 70, 20, w // 2 + 70, 48], 14, fill=(0, 0, 0))
    if content: content(L, d, w, h, t)
    return L
def lock(s=1.0, shake=0):
    L, d = layer(int(200 * s), int(240 * s))
    d.arc([40 * s, 0, 160 * s, 130 * s], 180, 360, fill=WHITE, width=int(22 * s))
    d.line([51 * s, 65 * s, 51 * s, 110 * s], fill=WHITE, width=int(22 * s)); d.line([149 * s, 65 * s, 149 * s, 110 * s], fill=WHITE, width=int(22 * s))
    d.rounded_rectangle([10 * s, 100 * s, 190 * s, 240 * s], int(26 * s), fill=ORANGE)
    ctext(d, 118 * s, "?", F("Black", int(90 * s)), WHITE, int(100 * s))
    return L
def coin(s=1.0):
    L, d = layer(int(110 * s), int(110 * s))
    d.ellipse([0, 0, 109 * s, 109 * s], fill=ORANGE, outline=(255, 190, 120), width=int(6 * s))
    ctext(d, 18 * s, "€", F("Black", int(64 * s)), WHITE, int(55 * s)); return L
def cursor(s=1.0):
    L, d = layer(int(70 * s), int(100 * s))
    d.polygon([(4, 4), (4, 84 * s), (24 * s, 64 * s), (40 * s, 96 * s), (54 * s, 88 * s), (38 * s, 58 * s), (64 * s, 58 * s)], fill=WHITE, outline=(0, 0, 0))
    return L

# ---------------- ESCENA 0: la web vieja EXPLOTA ----------------
def old_web():
    def content(L, d, w, h, t):
        d.rectangle([30, 100, w - 30, 190], fill=(200, 200, 205)); d.text((50, 120), "MI NEGOCIO", font=F("Black", 44), fill=(110, 110, 120))
        for k in range(0, w, 60): d.polygon([(k, 230), (k + 30, 230), (k + 60, 290), (k + 30, 290)], fill=(240, 200, 40))
        ctext(d, 320, "EN CONSTRUCCIÓN", F("Black", 52), (120, 120, 130), w // 2)
        for r in range(6): d.rectangle([60, 420 + r * 42, 60 + (r * 97) % 500 + 200, 440 + r * 42], fill=(205, 207, 214))
        d.rectangle([60, 700, 300, 860], fill=(215, 215, 220)); d.line([60, 700, 300, 860], fill=(180, 180, 190), width=4); d.line([300, 700, 60, 860], fill=(180, 180, 190), width=4)
    return browser(760, 920, "minegocio-1998.com", content)
def insta_profile():
    L, d = layer(760, 920)
    d.rounded_rectangle([0, 0, 759, 919], 40, fill=(250, 250, 252))
    d.ellipse([50, 60, 230, 240], fill=ORANGE); d.ellipse([62, 72, 218, 228], fill=(250, 250, 252)); d.ellipse([74, 84, 206, 216], fill=(255, 190, 140))
    ctext(d, 118, "TN", F("Black", 60), WHITE, 140)
    for k, (n, lab) in enumerate([("128", "posts"), ("2.340", "seguidores"), ("310", "seguidos")]):
        ctext(d, 100, n, F("Black", 46), (20, 20, 40), 330 + k * 150); ctext(d, 160, lab, F("Medium", 24), (110, 110, 130), 330 + k * 150)
    d.text((50, 270), "@tunegocio", font=F("Black", 40), fill=(20, 20, 40))
    d.text((50, 325), "Pide cita por mensaje directo", font=F("Medium", 30), fill=(90, 90, 110))
    d.rounded_rectangle([50, 380, 710, 440], 16, fill=(225, 228, 238)); ctext(d, 392, "Seguir", F("Bold", 32), (20, 20, 40), 380)
    cols = [(255, 160, 90), (90, 130, 220), (255, 200, 150), (60, 90, 170), (255, 122, 26), (150, 175, 230)]
    for k in range(6):
        x, y = 4 + (k % 3) * 251, 470 + (k // 3) * 222
        d.rectangle([x, y, x + 247, y + 218], fill=cols[k])
    return L
def closed_sign():
    L, d = layer(760, 900)
    d.line([380, 0, 180, 300], fill=(150, 150, 160), width=10); d.line([380, 0, 580, 300], fill=(150, 150, 160), width=10)
    d.ellipse([360, 0, 400, 40], fill=(200, 200, 210))
    d.rounded_rectangle([20, 280, 739, 860], 50, fill=(200, 30, 40), outline=WHITE, width=16)
    ctext(d, 410, "CERRADO", F("Black", 128), WHITE, 380)
    ctext(d, 620, "Abrimos mañana", F("Bold", 54), (255, 220, 220), 380); ctext(d, 700, "a las 9:00", F("Bold", 54), (255, 220, 220), 380)
    return L
OBJECTS = dict(oldweb=old_web, insta=insta_profile, closed=closed_sign)
OLD = shadowed(OBJECTS[scenes[0].get("obj", "oldweb")](), 30)
OCX, OCY = W // 2, 860
def make_shards(img, ix, iy, n_ang=16):
    angs = np.sort(rng.uniform(0, 2 * np.pi, n_ang)); rings = [0, 110, 260, 460, 2000]
    pieces = []
    for a0, a1 in zip(angs, np.roll(angs, -1)):
        if a1 < a0: a1 += 2 * np.pi
        for r0, r1 in zip(rings[:-1], rings[1:]):
            jit = lambda r: r * rng.uniform(0.85, 1.15)
            poly = [(ix + jit(r0) * math.cos(a0), iy + jit(r0) * math.sin(a0)), (ix + jit(r1) * math.cos(a0), iy + jit(r1) * math.sin(a0)),
                    (ix + jit(r1) * math.cos(a1), iy + jit(r1) * math.sin(a1)), (ix + jit(r0) * math.cos(a1), iy + jit(r0) * math.sin(a1))]
            m = Image.new("L", img.size, 0); ImageDraw.Draw(m).polygon(poly, fill=255)
            bb = m.getbbox()
            if not bb: continue
            pc = img.crop(bb); al = Image.composite(pc.getchannel("A"), Image.new("L", pc.size, 0), m.crop(bb)); pc.putalpha(al)
            if not pc.getbbox(): continue
            cx, cy = (bb[0] + bb[2]) / 2, (bb[1] + bb[3]) / 2
            dx, dy = cx - ix, cy - iy; dist = math.hypot(dx, dy) + 1
            sp = rng.uniform(900, 2200) * (1.3 - min(dist, 500) / 900)
            pieces.append(dict(img=pc, x=cx, y=cy, vx=dx / dist * sp + rng.normal(0, 150), vy=dy / dist * sp - rng.uniform(200, 700),
                               rot=0, vr=rng.uniform(-540, 540)))
    return pieces
SHARDS = make_shards(OLD, OLD.width // 2 + 40, OLD.height // 2 - 60)
SPARKS = [dict(a=rng.uniform(0, 2 * np.pi), v=rng.uniform(500, 1900), r=rng.uniform(5, 14), c=ORANGE if rng.random() < 0.6 else WHITE) for _ in range(90)]

def sc_boom(fr, t, dur, s):
    dt = t - IMPACT
    if dt < 0:
        place(fr, OLD, OCX, OCY)
        return 0
    # grietas un instante antes de saltar
    for p in SHARDS:
        k = max(0.0, dt - 0.03)
        x = OCX - OLD.width / 2 + p["x"] + p["vx"] * k
        y = OCY - OLD.height / 2 + p["y"] + p["vy"] * k + 0.5 * 3000 * k * k
        place(fr, p["img"], x, y, 1, max(0, 1 - max(0, dt - 0.5) / 0.4), p["vr"] * k)
    L, d = layer(W, H)
    ix, iy = OCX + 40, OCY - 60
    r = 1400 * ease(dt / 0.5)  # onda expansiva
    d.ellipse([ix - r, iy - r, ix + r, iy + r], outline=(255, 255, 255, int(200 * max(0, 1 - dt / 0.5))), width=18)
    for sp in SPARKS:
        k = dt; x = ix + math.cos(sp["a"]) * sp["v"] * k; y = iy + math.sin(sp["a"]) * sp["v"] * k + 1400 * k * k
        al = max(0, 1 - dt / 0.8)
        if al > 0: d.ellipse([x - sp["r"], y - sp["r"], x + sp["r"], y + sp["r"]], fill=sp["c"] + (int(255 * al),))
    fr.alpha_composite(L)
    if dt < 0.18:  # destello
        fl = Image.new("RGBA", (W, H), (255, 240, 220, int(235 * (1 - dt / 0.18)))); fr.alpha_composite(fl)
    # después: titular y clientes huyendo
    h1, h2 = s.get("h", ["TU WEB ESPANTA", "A TUS CLIENTES"])
    headline(fr, t, h1, 560, 110, WHITE, IMPACT + 0.3)
    headline(fr, t, h2, 700, 110, ORANGE, IMPACT + 0.45)
    if t > IMPACT + 0.5:
        k = t - IMPACT - 0.5
        for j, sgn in enumerate([-1, 1, -1, 1]):
            place(fr, person(WHITE if j % 2 else MUTED, 1.1), W / 2 + sgn * (90 + j * 70 + 700 * (k / 2.6) ** 1.5), 1150 + (j % 2) * 60, 1, max(0, min(1, k / 0.15, 1 - (k - 2.0) / 0.6)))
    return 30 * max(0, 1 - dt / 0.45)  # sacudida

# ---------------- resto de planos ----------------
def sc_three(fr, t, dur, s):
    headline(fr, t, "3 ERRORES", 330, 140, WHITE)
    for k, x in enumerate([230, 540, 850]):
        a = back((t - 0.15 - k * 0.15) / 0.3)
        L, d = layer(260, 320); d.rounded_rectangle([0, 0, 259, 319], 36, fill=NAVY_CARD, outline=ORANGE if k == 2 else (60, 90, 150), width=6)
        if k < 2: ctext(d, 80, str(k + 1), F("Black", 150), WHITE, 130)
        L = shadowed(L)
        sh = 9 * math.sin(t * 40) if (k == 2 and t > dur * 0.45) else 0
        place(fr, L, x + sh, 900, a, min(1, a))
        if k == 2 and a > 0: place(fr, lock(0.8), x + sh, 905, a, 1, sh)
    if t > dur * 0.45:
        L, d = layer(W, 110); ctext(d, 10, "¿EL TERCERO?", F("Black", 80), ORANGE, stroke=5)
        place(fr, L, W / 2, 1200, back((t - dur * 0.45) / 0.3), 1)
    return 0

def loading(L, d, w, h, t):
    d.rounded_rectangle([40, 100, w - 40, 124], 12, fill=(222, 226, 238))
    d.rounded_rectangle([40, 100, 40 + (w - 80) * min(0.33, 0.06 + t * 0.07), 124], 12, fill=ORANGE)
    cx, cy, r = w // 2, h // 2 + 30, 90
    a0 = (t * 400) % 360; d.arc([cx - r, cy - r, cx + r, cy + r], a0, a0 + 270, fill=ORANGE, width=18)
    ctext(d, cy + 130, "Cargando...", F("Bold", 40), GREY, cx)
def sc_slow(fr, t, dur, s):
    badge(fr, t, "ERROR 1")
    place(fr, shadowed(browser(820, 640, content=loading, t=t)), W / 2, 760, 0.9 + 0.1 * ease(t / 0.3), ease(t / 0.15))
    L, d = layer(W, 220); secs = 0.4 + t * 1.4
    ctext(d, 10, f"{secs:.1f} s", F("Black", 170), ORANGE, stroke=6)
    place(fr, L, W / 2, 1270, 1, ease((t - 0.2) / 0.2))
    return 0

def sc_leave(fr, t, dur, s):
    place(fr, shadowed(browser(820, 640, content=loading, t=t + 3)), W / 2, 700, 0.8, 0.55)
    L, d = layer(W, 220); ctext(d, 10, f"{4.2 + t * 1.4:.1f} s", F("Black", 120), (255, 122, 26, 150), stroke=4)
    place(fr, L, W / 2, 330, 1, 1)
    for j in range(5):
        st = 0.25 + j * 0.25; k = max(0, t - st); sgn = -1 if j % 2 else 1
        x = 180 + j * 180 + sgn * 900 * ease(k / 1.0) * (k > 0)
        place(fr, person(WHITE if j % 2 else MUTED, 0.9), x, 1180, 1, 1 - ease(k / 1.0) * 0.9)
    headline(fr, t, "SE VAN", 1380, 130, ORANGE, 0.5)
    return 0

def warn(s=1.0):
    L, d = layer(int(360 * s), int(320 * s))
    d.polygon([(180 * s, 0), (360 * s, 320 * s), (0, 320 * s)], fill=ORANGE)
    ctext(d, 100 * s, "!", F("Black", int(190 * s)), WHITE, int(180 * s)); return L
def sc_loop2(fr, t, dur, s):
    sh = 14 * math.sin(t * 50) * max(0, 1 - t / 0.8)
    L, d = layer(W, 420); ctext(d, 10, "#2", F("Black", 360), WHITE, stroke=8)
    place(fr, L, W / 2 + sh, 640, 2 - back(t / 0.3), ease(t / 0.1))
    place(fr, warn(0.9), W / 2 - sh, 1080, back((t - 0.25) / 0.3), 1, sh)
    headline(fr, t, "TODAVÍA PEOR", 1380, 120, ORANGE, 0.5)
    return sh * 0.6

def squeezed(L, d, w, h, t):
    d.rounded_rectangle([18, 70, w - 18, h - 18], 50, fill=(245, 246, 252))
    d.rectangle([18, 110, w + 300, 190], fill=(200, 205, 220)); d.text((40, 128), "MI NEGOCIO  ·  Inicio  ·  Servicios  ·  Contacto  ·  Blog", font=F("Bold", 34), fill=(60, 60, 80))
    for r in range(14): d.rectangle([40, 230 + r * 26, 40 + 700, 240 + r * 26], fill=(200, 203, 214))
    d.rectangle([300, 640, 900, 900], fill=(215, 218, 230)); d.text((320, 700), "Pide presupuesto", font=F("Bold", 50), fill=(140, 140, 160))
def sc_mobile(fr, t, dur, s):
    badge(fr, t, "ERROR 2")
    pinch = 1 + 0.05 * math.sin(t * 6)
    place(fr, shadowed(phone(520, 1000, squeezed)), W / 2, 860, (0.9 + 0.1 * ease(t / 0.3)) * pinch, ease(t / 0.15))
    if t > dur * 0.45:
        k = (t - dur * 0.45)
        L, d = layer(500, 500); d.line([60, 60, 440, 440], fill=ORANGE, width=70); d.line([440, 60, 60, 440], fill=ORANGE, width=70)
        place(fr, L, W / 2, 860, 2 - back(k / 0.25), ease(k / 0.08))
        headline(fr, t, "SE VE FATAL", 1440, 120, WHITE, dur * 0.45 + 0.1)
    return 18 * max(0, 1 - abs(t - dur * 0.45 - 0.05) / 0.25) if t > dur * 0.45 else 0

def sc_loop3(fr, t, dur, s):
    sh = 12 * math.sin(t * 45)
    L, d = layer(330, 380); d.rounded_rectangle([0, 0, 329, 379], 40, fill=NAVY_CARD, outline=ORANGE, width=8)
    place(fr, shadowed(L), W / 2 + sh, 700, back(t / 0.3), 1); place(fr, lock(1.1), W / 2 + sh, 705, back(t / 0.3), 1, sh * 0.5)
    for j in range(9):
        st = 0.35 + j * 0.12; k = t - st
        if k <= 0: continue
        x = W / 2 + (j - 4) * 70 + (j - 4) * 140 * k; y = 900 + 900 * k * k + 250 * k
        place(fr, coin(1.0), x, y, 1, max(0, 1 - k / 1.6), j * 40 * k)
    headline(fr, t, "MÁS DINERO TE CUESTA", 1420, 96, ORANGE, dur * 0.4)
    return 0

def page_nobutton(L, d, w, h, t):
    d.text((40, 100), "TU NEGOCIO", font=F("Black", 40), fill=(30, 30, 50))
    d.rounded_rectangle([40, 170, w - 40, 400], 22, fill=(220, 225, 240))
    for r in range(7): d.rectangle([40, 440 + r * 34, 40 + (r * 131) % 400 + 260, 456 + r * 34], fill=(205, 208, 220))
def sc_nobutton(fr, t, dur, s):
    badge(fr, t, "ERROR 3")
    bx, by = W / 2, 820
    place(fr, shadowed(browser(860, 760, content=page_nobutton)), bx, by, 0.9 + 0.1 * ease(t / 0.3), ease(t / 0.15))
    pts = [(300, 600), (800, 650), (650, 1000), (300, 1050), (780, 900), (540, 760)]
    u = min(t / max(dur, 0.1) * (len(pts) - 1), len(pts) - 1.001); i = int(u); f = u - i
    f = f * f * (3 - 2 * f)
    cx = pts[i][0] + (pts[i + 1][0] - pts[i][0]) * f; cy = pts[i][1] + (pts[i + 1][1] - pts[i][1]) * f
    for q in range(int(u) + 1):
        L, d = layer(120, 140); ctext(d, 0, "?", F("Black", 120), ORANGE, 60, stroke=6)
        place(fr, L, pts[q][0] + 50, pts[q][1] - 90, back((u - q) / 0.4), 1)
    place(fr, cursor(1.2), cx + 30, cy + 45)
    headline(fr, t, "¿DÓNDE ESCRIBO?", 1380, 100, WHITE, dur * 0.35)
    return 0

def shop(name, lit):
    L, d = layer(380, 420); col = ORANGE if lit else (60, 70, 95)
    d.polygon([(0, 120), (190, 0), (380, 120)], fill=col)
    d.rounded_rectangle([20, 120, 360, 420], 20, fill=NAVY_CARD if lit else (30, 38, 60), outline=col, width=6)
    d.rounded_rectangle([140, 260, 240, 420], 12, fill=col)
    f = F("Black", 34 if len(name) > 10 else 40); ctext(d, 160, name, f, WHITE if lit else GREY, 190)
    return L
def bubble(txt, col=ORANGE):
    f = F("Black", 50); L, d = layer(int(d0.textlength(txt, font=f)) + 80, 140)
    d.rounded_rectangle([0, 0, L.width - 1, 110], 50, fill=col); d.polygon([(30, 100), (70, 100), (20, 138)], fill=col)
    d.text((40, 24), txt, font=f, fill=WHITE); return L
d0 = ImageDraw.Draw(Image.new("RGBA", (1, 1)))
def sc_competitor(fr, t, dur, s):
    mid = dur * 0.45; lit = t > mid + 0.35
    place(fr, shadowed(shop("TU NEGOCIO", False)), 290, 620, back(t / 0.3), 1 - 0.5 * ease((t - mid) / 0.3))
    place(fr, shadowed(shop("COMPETENCIA", lit)), 790, 620, back((t - 0.1) / 0.3), 1)
    if lit:
        gl = Image.new("RGBA", (W, H), (0, 0, 0, 0)); ImageDraw.Draw(gl).ellipse([560, 380, 1020, 860], fill=ORANGE + (90,))
        fr.alpha_composite(gl.filter(ImageFilter.GaussianBlur(80)))
    place(fr, person(WHITE, 1.3), W / 2, 1230, back((t - 0.15) / 0.3), 1)
    k = (t - mid) / 0.4
    if 0 < k:
        k = min(k, 1); x = W / 2 + (790 - W / 2) * ease(k); y = 1060 - 380 * math.sin(math.pi * min(k, 1) / 2) * 1.0
        if k >= 1: y = 820
        place(fr, bubble("Hola!"), x, y, 1, 1)
    headline(fr, t, "EN UN CLIC", 1450, 110, ORANGE, 0.2)
    return 0

def sc_fix(fr, t, dur, s):
    L, d = layer(W, 220); fo = F("Black", 150); ow = d.textlength("Obra", font=fo); tw = ow + d.textlength("Web", font=fo)
    d.text(((W - tw) / 2, 20), "Obra", font=fo, fill=WHITE); d.text(((W - tw) / 2 + ow, 20), "Web", font=fo, fill=ORANGE)
    place(fr, L, W / 2, 330, back(t / 0.3), 1)
    items = ["Carga rápida", "Perfecta en el móvil", "Botón para escribirte"]
    for k, it in enumerate(items):
        st = 0.2 + k * dur * 0.22; a = back((t - st) / 0.3)
        if t < st: continue
        R, d = layer(900, 170); d.rounded_rectangle([0, 0, 899, 169], 40, fill=NAVY_CARD, outline=(44, 70, 130), width=3)
        d.ellipse([40, 40, 130, 130], fill=ORANGE)
        ck = ease((t - st - 0.12) / 0.2)
        if ck > 0: d.line([(62, 86), (80, 105), (62 + 48 * ck, 105 - 39 * ck)][:2 if ck < 0.5 else 3], fill=WHITE, width=12)
        d.text((170, 52), it, font=F("Bold", 54), fill=WHITE)
        place(fr, shadowed(R, 18, 90), W / 2 + 220 * (1 - min(1, a)), 640 + k * 210, 1, min(1, a))
    return 0

def sc_price(fr, t, dur, s):
    L, d = layer(W, 120); ctext(d, 10, "2 cuotas de", F("Bold", 84), MUTED)
    place(fr, L, W / 2, 520, back(t / 0.3), 1)
    st = dur * 0.4
    if t > st:
        P, d = layer(W, 420); ctext(d, 30, "135€", F("Black", 340), ORANGE, stroke=8)
        place(fr, P.filter(ImageFilter.GaussianBlur(40)), W / 2, 860, 2.2 - 1.2 * back((t - st) / 0.3), 0.8)
        place(fr, P, W / 2, 860, 2.2 - 1.2 * back((t - st) / 0.3), ease((t - st) / 0.08))
        N, d = layer(W, 90); ctext(d, 10, "270 € en total", F("Medium", 50), MUTED)
        place(fr, N, W / 2, 1150, 1, ease((t - st - 0.3) / 0.3))
        return 22 * max(0, 1 - (t - st) / 0.3)
    return 0

def chat(L, d, w, h, t):
    d.rectangle([12, 70, w - 12, 170], fill=(18, 30, 64)); d.ellipse([40, 90, 100, 150], fill=ORANGE)
    d.text((120, 98), "ObraWeb", font=F("Bold", 40), fill=WHITE)
    d.rounded_rectangle([30, h - 120, w - 30, h - 40], 40, fill=(30, 44, 84))
    typed = "WEB"[: int(max(0, t - 0.2) * 8)]
    if t < 0.9: d.text((70, h - 106), typed + ("|" if int(t * 4) % 2 else ""), font=F("Bold", 44), fill=WHITE)
def sc_dm(fr, t, dur, s):
    headline(fr, t, "ESCRÍBENOS «WEB»", 300, 104, WHITE)
    px, py = W / 2, 930
    place(fr, shadowed(phone(560, 980, chat, t)), px, py, back(t / 0.3), 1)
    if t > 0.9:
        k = t - 0.9; L, d = layer(240, 110); d.rounded_rectangle([0, 0, 239, 109], 50, fill=ORANGE); ctext(d, 20, "WEB", F("Black", 60), WHITE, 120)
        place(fr, L, px + 120, py + 300 - 420 * ease(k / 0.35), 1, 1)
    if t > 1.5:
        k = t - 1.5; L, d = layer(420, 110); d.rounded_rectangle([0, 0, 419, 109], 50, fill=(40, 60, 110))
        d.text((36, 26), "¡Hola! Vamos a ello", font=F("Bold", 42), fill=WHITE)
        place(fr, L, px - 30, py + 20, back(k / 0.3), 1)
    return 0

# ---- planos del reel "¿y si te cierran Instagram?" ----
def notif(txt, sub):
    L, d = layer(900, 170); d.rounded_rectangle([0, 0, 899, 169], 40, fill=(250, 250, 252))
    d.ellipse([30, 40, 120, 130], fill=ORANGE); ctext(d, 52, "!", F("Black", 64), WHITE, 75)
    d.text((150, 34), txt, font=F("Black", 44), fill=(20, 20, 40)); d.text((150, 98), sub, font=F("Medium", 30), fill=(110, 110, 130))
    return shadowed(L, 20, 110)
def sc_suspended(fr, t, dur, s):
    items = [("Cuenta suspendida", "Tu cuenta incumple las normas"), ("Acceso bloqueado", "No puedes iniciar sesión"),
             ("Cuenta desactivada", "Tus seguidores ya no te ven")]
    sh = 0
    for k, (a, b) in enumerate(items):
        st = 0.05 + k * dur * 0.28
        if t < st: continue
        p = back((t - st) / 0.25); sh = 16 * max(0, 1 - (t - st) / 0.2)
        place(fr, notif(a, b), W / 2, 520 + k * 230, p, 1, (-3, 2, -2)[k])
    headline(fr, t, "PASA MÁS DE LO QUE CREES", 1340, 84, ORANGE, dur * 0.4)
    return sh
def sc_secret(fr, t, dur, s):
    gl = Image.new("RGBA", (W, H), (0, 0, 0, 0)); g = 520 + 60 * math.sin(t * 5)
    ImageDraw.Draw(gl).ellipse([W / 2 - g / 2, 800 - g / 2, W / 2 + g / 2, 800 + g / 2], fill=ORANGE + (120,))
    fr.alpha_composite(gl.filter(ImageFilter.GaussianBlur(90)))
    L, d = layer(360, 400); d.rounded_rectangle([0, 0, 359, 399], 44, fill=NAVY_CARD, outline=ORANGE, width=8)
    ctext(d, 90, "?", F("Black", 230), WHITE, 180)
    place(fr, shadowed(L), W / 2, 800, back(t / 0.3), 1, 4 * math.sin(t * 9))
    h1, h2 = s.get("h", ["NADIE TE LO", "PUEDE QUITAR"])
    headline(fr, t, h1, 1210, 104, WHITE, 0.35); headline(fr, t, h2, 1330, 104, ORANGE, 0.5)
    return 0
def own_site(L, d, w, h, t):
    d.text((40, 100), "TU NEGOCIO", font=F("Black", 40), fill=(20, 20, 40))
    d.rounded_rectangle([40, 170, w - 40, 420], 26, fill=ORANGE)
    d.text((80, 205), "Pide tu cita", font=F("Black", 64), fill=WHITE); d.text((80, 285), "en un clic", font=F("Black", 64), fill=WHITE)
    d.rounded_rectangle([80, 365, 330, 405], 20, fill=WHITE)
    for k in range(3): d.rounded_rectangle([40 + k * 255, 450, 270 + k * 255, 600], 20, fill=(225, 228, 240))
def sc_ownweb(fr, t, dur, s):
    place(fr, shadowed(browser(860, 660, content=own_site)), W / 2, 760, 2 - back(t / 0.3), ease(t / 0.1))
    if t > dur * 0.25:
        k = t - dur * 0.25; L, d = layer(600, 200)
        d.rounded_rectangle([10, 10, 589, 189], 30, fill=(6, 16, 40, 200), outline=ORANGE, width=14); ctext(d, 38, "100% TUYA", F("Black", 104), ORANGE, 300)
        place(fr, L, W / 2, 1120, 1.8 - 0.8 * back(k / 0.15), ease(k / 0.05), -6)
        return 20 * max(0, 1 - k / 0.2)
    return 0
def sc_yours(fr, t, dur, s):
    labels = ["TU WEB", "TUS CLIENTES", "TUS REGLAS"]
    for k, lab in enumerate(labels):
        st = s["pin"] + k * s["vd"] / 3
        if t < st: continue
        a = back((t - st) / 0.25); y = 520 + k * 330
        L, d = layer(900, 280); d.rounded_rectangle([0, 0, 899, 279], 44, fill=NAVY_CARD, outline=(44, 70, 130), width=4)
        if k == 0:
            d.rounded_rectangle([50, 70, 250, 210], 16, fill=WHITE); d.rectangle([50, 70, 250, 100], fill=(222, 226, 238)); d.rounded_rectangle([70, 120, 230, 170], 10, fill=ORANGE)
        elif k == 1:
            for j in range(3): L.alpha_composite(person(WHITE if j != 1 else ORANGE, 0.75), (40 + j * 75, 55))
        else:
            d.ellipse([70, 60, 230, 220], fill=ORANGE); d.line([(110, 140), (140, 172), (195, 110)], fill=WHITE, width=18)
        d.text((300, 95), lab, font=F("Black", 74), fill=WHITE)
        place(fr, shadowed(L, 20, 90), W / 2 - 300 * (1 - min(1, a)), y, 1, min(1, a))
    return 0
def sc_pricetease(fr, t, dur, s):
    sh = 10 * math.sin(t * 40)
    L, d = layer(560, 340)
    d.polygon([(0, 170), (110, 0), (559, 0), (559, 339), (110, 339)], fill=ORANGE)
    d.ellipse([70, 145, 110, 185], fill=(6, 16, 40)); ctext(d, 70, "? €", F("Black", 170), WHITE, 340)
    place(fr, shadowed(L), W / 2 + sh, 820, back(t / 0.3), 1, -8 + sh * 0.4)
    headline(fr, t, "LO MEJOR:", 420, 110, WHITE, 0.0); headline(fr, t, "LO QUE CUESTA", 1220, 110, ORANGE, dur * 0.35)
    return 0

def sc_logo(fr, t, dur, s):
    L, d = layer(W, 300); fo = F("Black", 190); ow = d.textlength("Obra", font=fo); tw = ow + d.textlength("Web", font=fo)
    d.text(((W - tw) / 2, 30), "Obra", font=fo, fill=WHITE); d.text(((W - tw) / 2 + ow, 30), "Web", font=fo, fill=ORANGE)
    place(fr, L.filter(ImageFilter.GaussianBlur(40)), W / 2, 720, 2 - back(t / 0.3), 0.7); place(fr, L, W / 2, 720, 2 - back(t / 0.3), ease(t / 0.08))
    k = t - dur * 0.45
    if k > 0:
        x0, x1 = 160, 160 + 760 * ease(k / 0.6)
        Lb, d = layer(W, 120); d.rounded_rectangle([160, 40, 920, 80], 20, fill=(30, 50, 100)); d.rounded_rectangle([160, 40, x1, 80], 20, fill=ORANGE)
        place(fr, Lb, W / 2, 1000, 1, 1)
    headline(fr, t, s.get("tag", "DE PRINCIPIO A FIN"), 1180, 96, WHITE, dur * 0.45)
    return 20 * max(0, 1 - t / 0.25)

# ---- planos del reel "11 de la noche" ----
def clock_face(hh, mm, s=1.0, col=WHITE):
    L, d = layer(int(320 * s), int(320 * s)); r = 150 * s; c = 160 * s
    d.ellipse([c - r, c - r, c + r, c + r], fill=NAVY_CARD, outline=col, width=int(14 * s))
    for k in range(12):
        a = k * math.pi / 6; d.line([c + math.sin(a) * r * 0.8, c - math.cos(a) * r * 0.8, c + math.sin(a) * r * 0.92, c - math.cos(a) * r * 0.92], fill=MUTED, width=int(6 * s))
    ah = (hh % 12 + mm / 60) * math.pi / 6; am = mm * math.pi / 30
    d.line([c, c, c + math.sin(ah) * r * 0.5, c - math.cos(ah) * r * 0.5], fill=WHITE, width=int(14 * s))
    d.line([c, c, c + math.sin(am) * r * 0.78, c - math.cos(am) * r * 0.78], fill=ORANGE, width=int(9 * s))
    d.ellipse([c - 14 * s, c - 14 * s, c + 14 * s, c + 14 * s], fill=ORANGE); return L
def store(name, lit, shutter=0.0):
    L, d = layer(520, 560); col = ORANGE if lit else (60, 70, 95)
    d.rounded_rectangle([0, 0, 519, 130], 26, fill=col); ctext(d, 34, name, F("Black", 56 if len(name) < 12 else 44), WHITE if lit else GREY, 260)
    d.rectangle([20, 130, 499, 559], fill=NAVY_CARD if lit else (24, 30, 50))
    d.rectangle([60, 180, 460, 559], fill=(255, 210, 150) if lit else (40, 48, 72))
    if shutter > 0:
        hgt = int(380 * shutter)
        d.rectangle([60, 180, 460, 180 + hgt], fill=(110, 118, 140))
        for y in range(180, 180 + hgt, 26): d.line([60, y, 460, y], fill=(80, 88, 110), width=6)
    return L
def sc_clock(fr, t, dur, s):
    place(fr, shadowed(store("TU NEGOCIO", False, ease(t / 0.6))), W / 2, 980, back(t / 0.3), 1)
    place(fr, shadowed(clock_face(23, 0, 1.0)), W / 2, 470, back((t - 0.1) / 0.3), 1)
    headline(fr, t, "CERRADO", 1420, 120, ORANGE, dur * 0.3)
    return 0
def sc_nightsearch(fr, t, dur, s):
    def c(L, d, w, h, tt):
        d.rounded_rectangle([18, 70, w - 18, h - 18], 50, fill=(20, 26, 48))
        d.rounded_rectangle([40, 120, w - 40, 200], 40, fill=(40, 50, 84))
        q = "fontanero urgente"[: int(max(0, tt - 0.1) * 22)]
        d.text((80, 140), q + ("|" if int(tt * 4) % 2 else ""), font=F("Medium", 38), fill=WHITE)
        d.text((w - 140, 90 - 60), "23:04", font=F("Bold", 30), fill=MUTED)
    place(fr, shadowed(phone(520, 900, c, t)), W / 2, 820, back(t / 0.3), 1)
    if t > dur * 0.45:
        L, d = layer(W, 260); ctext(d, 0, "?", F("Black", 220), ORANGE, stroke=6)
        place(fr, L, W / 2 + 260, 520, back((t - dur * 0.45) / 0.3), 1, 8 * math.sin(t * 20))
    headline(fr, t, "¿TE COMPRA O NO?", 1420, 104, WHITE, dur * 0.5)
    return 0
def sc_other(fr, t, dur, s):
    mid = dur * 0.35
    place(fr, shadowed(store("TU NEGOCIO", False, 1.0)), 290, 760, 0.85, 1)
    place(fr, shadowed(store("OTRO", t > mid)), 790, 760, 0.85, 1)
    if t > mid:
        gl = Image.new("RGBA", (W, H), (0, 0, 0, 0)); ImageDraw.Draw(gl).ellipse([560, 480, 1020, 1040], fill=ORANGE + (90,))
        fr.alpha_composite(gl.filter(ImageFilter.GaussianBlur(80)))
    k = max(0, t - mid * 0.6)
    place(fr, person(WHITE, 1.2), W / 2 + 260 * ease(k / 1.0), 1220 - 120 * ease(k / 1.0), 1, 1 - 0.6 * ease((k - 0.8) / 0.4))
    headline(fr, t, "SE VA CON OTRO", 1440, 110, ORANGE, mid)
    return 0
def sc_nightweb(fr, t, dur, s):
    v = s["vd"]; p0 = s["pin"]
    def c(L, d, w, h, tt):
        d.rounded_rectangle([18, 70, w - 18, h - 18], 50, fill=(245, 246, 252))
        d.text((50, 100), "TU NEGOCIO", font=F("Black", 36), fill=(20, 20, 40))
        if tt > p0:
            d.rounded_rectangle([40, 160, w - 40, 330], 24, fill=ORANGE); d.text((70, 200), "Servicios", font=F("Black", 50), fill=WHITE)
            d.text((70, 262), "Urgencias · Instalaciones", font=F("Medium", 28), fill=WHITE)
        if tt > p0 + v * 0.35:
            cols = [(255, 180, 120), (90, 130, 220), (255, 210, 160), (60, 90, 170)]
            for k in range(4): d.rounded_rectangle([40 + (k % 2) * 225, 350 + (k // 2) * 170, 250 + (k % 2) * 225, 505 + (k // 2) * 170], 18, fill=cols[k])
        if tt > p0 + v * 0.65:
            d.rounded_rectangle([40, h - 200, w - 40, h - 60], 40, fill=(40, 200, 110)); ctext(d, h - 162, "Escribir ahora", F("Black", 44), WHITE, w // 2)
    place(fr, shadowed(phone(520, 1000, c, t)), W / 2 - 80, 860, back(t / 0.3), 1)
    if t > p0 + v * 0.75:
        k = t - p0 - v * 0.75; L, d = layer(460, 120); d.rounded_rectangle([0, 0, 459, 119], 50, fill=ORANGE)
        d.text((36, 30), "¿Mañana a las 10?", font=F("Bold", 44), fill=WHITE)
        place(fr, L, W / 2 + 190, 420 - 60 * ease(k / 0.3), back(k / 0.3), 1)
    return 0
def sc_morning(fr, t, dur, s):
    sun = Image.new("RGBA", (W, H), (0, 0, 0, 0)); r = 260; cy = 1100 - 250 * ease(t / 1.2)
    ImageDraw.Draw(sun).ellipse([W / 2 - r, cy - r, W / 2 + r, cy + r], fill=ORANGE + (110,))
    fr.alpha_composite(sun.filter(ImageFilter.GaussianBlur(90)))
    place(fr, shadowed(clock_face(8, 0, 1.1, ORANGE)), W / 2, 560, back(t / 0.3), 1, 6 * math.sin(t * 40) * max(0, 1 - t / 0.6))
    if t > dur * 0.4:
        k = t - dur * 0.4; L, d = layer(900, 170); d.rounded_rectangle([0, 0, 899, 169], 40, fill=(250, 250, 252))
        d.ellipse([30, 40, 120, 130], fill=ORANGE); ctext(d, 52, "1", F("Black", 64), WHITE, 75)
        d.text((150, 34), "Nuevo cliente", font=F("Black", 46), fill=(20, 20, 40)); d.text((150, 98), "Te escribió a las 23:06", font=F("Medium", 30), fill=(110, 110, 130))
        place(fr, shadowed(L, 20, 110), W / 2, 1000 - 60 * ease(k / 0.3), back(k / 0.3), 1)
    headline(fr, t, "CLIENTE NUEVO", 1400, 116, ORANGE, dur * 0.5)
    return 0

DRAW = dict(clock=sc_clock, nightsearch=sc_nightsearch, other=sc_other, nightweb=sc_nightweb, morning=sc_morning, logo=sc_logo, suspended=sc_suspended, secret=sc_secret, ownweb=sc_ownweb, yours=sc_yours, pricetease=sc_pricetease, boom=sc_boom, three=sc_three, slow=sc_slow, leave=sc_leave, loop2=sc_loop2, mobile=sc_mobile, loop3=sc_loop3,
            nobutton=sc_nobutton, competitor=sc_competitor, fix=sc_fix, price=sc_price, dm=sc_dm)

# ---------------- subtítulos ----------------
FS = F("Black", 74); MAXW = W - 140
def _tw(ws, f): return d0.textlength(" ".join(ws), font=f) + 18
def sub_layer(words, hi):
    f, lines = FS, [words]
    if _tw(words, f) > MAXW and len(words) > 1:
        k = min(range(1, len(words)), key=lambda k: max(_tw(words[:k], f), _tw(words[k:], f))); lines = [words[:k], words[k:]]
    while max(_tw(l, f) for l in lines) > MAXW and f.size > 40: f = F("Black", f.size - 4)
    lh = int(f.size * 1.18); L, d = layer(W, lh * len(lines) + 40); k = 0
    for li, line in enumerate(lines):
        x = (W - d.textlength(" ".join(line), font=f)) / 2
        for wd in line:
            d.text((x, 20 + li * lh), wd, font=f, fill=ORANGE if k == hi else WHITE, stroke_width=9, stroke_fill=(0, 0, 0))
            x += d.textlength(wd + " ", font=f); k += 1
    return L

# ---------------- portada ----------------
def make_cover(lines):
    fr = BG.copy(); d = ImageDraw.Draw(fr)
    place(fr, OLD, W / 2, 900, 0.85, 0.35, -6)
    rows = []
    for ln in lines:
        big = ln.startswith("*"); txt = ln.lstrip("*"); f = F("Black", 210 if big else 112)
        while d.textlength(txt, font=f) > W - 110: f = F("Black", f.size - 6)
        rows.append((txt, f, ORANGE if big else WHITE))
    y = 940 - sum(int(f.size * 1.12) for _, f, _ in rows) / 2 - 40
    for txt, f, col in rows:
        ctext(d, y, txt, f, col, stroke=9); y += int(f.size * 1.12)
    fo = F("Black", 90); ow = d.textlength("Obra", font=fo); tw = ow + d.textlength("Web", font=fo)
    d.text(((W - tw) / 2, 1520), "Obra", font=fo, fill=WHITE); d.text(((W - tw) / 2 + ow, 1520), "Web", font=fo, fill=ORANGE)
    fr.convert("RGB").save(os.path.join(D, "videos", NAME + "_portada.jpg"), quality=92)
make_cover(scenes[0].get("cover", [scenes[0]["text"].upper()]))

# ---------------- render ----------------
out_v = os.path.join(B, "video.mp4")
ff = subprocess.Popen(["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS),
                       "-i", "-", "-c:v", "libx264", "-preset", "medium", "-crf", "19", "-pix_fmt", "yuv420p", out_v], stdin=subprocess.PIPE)
for si, s in enumerate(scenes):
    words = s.get("sub", s["text"]).upper().split()
    groups = [words[i:i + 3] for i in range(0, len(words), 3)]
    wt = np.array([len(w) + 2 for w in words], float)
    wb = np.concatenate([[0], np.cumsum(wt) / wt.sum()]) * s["vd"] + s["pin"]
    nfr = int(round(s["dur"] * FPS))
    for fi in range(nfr):
        t = fi / FPS
        fr = BG.copy()
        shake = abs(DRAW[s["kind"]](fr, t, s["dur"], s) or 0)
        if t >= s["pin"] * 0.5:
            wi = int(min(max(np.searchsorted(wb, t, side="right") - 1, 0), len(words) - 1))
            acc = 0
            for g in groups:
                if wi < acc + len(g): break
                acc += len(g)
            pop = ease((t - wb[acc]) / 0.1) if t >= wb[acc] else 1
            place(fr, sub_layer(g, wi - acc), W / 2, 1640, 0.86 + 0.14 * pop)
        if shake:
            ox, oy = rng.uniform(-shake, shake), rng.uniform(-shake, shake)
            fr = fr.transform(fr.size, Image.AFFINE, (1, 0, ox, 0, 1, oy), resample=Image.BILINEAR, fillcolor=(6, 16, 40, 255))
        if s.get("cut") and t < 0.08:  # corte con flash corto
            fr.alpha_composite(Image.new("RGBA", (W, H), (255, 255, 255, int(120 * (1 - t / 0.08)))))
        ff.stdin.write(fr.convert("RGB").tobytes())
    print("plano", si, s["kind"], "ok", flush=True)
ff.stdin.close(); ff.wait()

# ---------------- audio: voz + música + efectos ----------------
SR = 24000
voice, starts = [], []
pos = 0
for s in scenes:
    a = s["audio"] if s["sr"] == SR else np.interp(np.linspace(0, len(s["audio"]) - 1, int(len(s["audio"]) * SR / s["sr"])), np.arange(len(s["audio"])), s["audio"])
    n = int(round(s["dur"] * FPS)) * SR // FPS
    seg = np.zeros(n, np.float32); st = int(s["pin"] * SR); seg[st:st + len(a)] = a[: n - st]
    voice.append(seg); starts.append(pos); pos += n
voice = np.concatenate(voice); n = len(voice); tt = np.arange(n) / SR
fx = np.zeros(n, np.float32)
# BOOM + cristales en el impacto
i0 = int(IMPACT * SR); L = int(1.2 * SR); k = np.arange(L) / SR
boom = np.sin(2 * np.pi * (60 * k - 25 * k * k)) * np.exp(-k * 4) * 1.0
noise = np.random.default_rng(1).standard_normal(L) * np.exp(-k * 9) * 0.6
glass = np.zeros(L)
gr = np.random.default_rng(2)
for _ in range(40):
    o = int(gr.uniform(0, 0.5) * SR); f = gr.uniform(2500, 7000); m = L - o
    glass[o:] += np.sin(2 * np.pi * f * k[:m]) * np.exp(-k[:m] * gr.uniform(20, 45)) * 0.12
fx[i0:i0 + L] += (boom + noise + glass)[: n - i0]
# golpes: "cut" + whoosh en planos de impacto
for s, st in zip(scenes, starts):
    if s.get("cut"):
        Lw = int(0.3 * SR); nz = np.random.default_rng(st).standard_normal(Lw)
        nz = np.convolve(nz, np.ones(10) / 10, "same") * np.sin(np.linspace(0, np.pi, Lw)) ** 2 * 0.35
        a0 = max(0, st - Lw // 2); fx[a0:a0 + Lw] += nz[: n - a0]
        kk = np.arange(int(0.25 * SR)) / SR; hit = np.sin(2 * np.pi * 80 * kk) * np.exp(-kk * 18) * 0.5
        fx[st:st + len(hit)] += hit[: n - st]
# música rápida (128 bpm) que entra justo tras la explosión
bpm = 128; beat = 60 / bpm; music = np.zeros(n, np.float32); roots = [110.0, 87.31, 130.81, 98.0]
b = 0
while True:
    a0 = int((IMPACT + 0.4 + b * beat) * SR)
    if a0 >= n: break
    kk = np.arange(min(int(beat * SR), n - a0)) / SR
    music[a0:a0 + len(kk)] += np.sin(2 * np.pi * 55 * np.exp(-kk * 18) * kk * 8) * np.exp(-kk * 9) * 0.55
    h0 = int(beat / 2 * SR)
    if len(kk) > h0: music[a0 + h0:a0 + len(kk)] += np.random.default_rng(b).standard_normal(len(kk) - h0) * np.exp(-kk[: len(kk) - h0] * 60) * 0.06
    r = roots[(b // 4) % 4]
    music[a0:a0 + len(kk)] += np.sin(2 * np.pi * r / 2 * kk) * np.minimum(1, kk * 30) * np.exp(-kk * 5) * 0.14
    for m in (1, 1.19, 1.5): music[a0:a0 + len(kk)] += np.sin(2 * np.pi * r * m * kk) * np.exp(-kk * 4) * 0.03
    b += 1
music *= np.minimum(1, (tt[-1] - tt) / 0.6)
env = np.convolve(np.abs(voice), np.ones(2400) / 2400, "same"); duck = 1 - 0.55 * np.clip(env / 0.04, 0, 1)
mix = voice * 1.15 + music * 0.5 * duck + fx * 0.7
mix /= np.abs(mix).max() / 0.95
with wave.open(os.path.join(B, "audio.wav"), "w") as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((mix * 32767).astype(np.int16).tobytes())
final = os.path.join(D, "videos", NAME + ".mp4")
subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", out_v, "-i", os.path.join(B, "audio.wav"), "-c:v", "copy", "-c:a", "aac",
                "-b:a", "192k", "-shortest", "-movflags", "+faststart", final], check=True)
print("listo", final, round(n / SR, 1), "s")
