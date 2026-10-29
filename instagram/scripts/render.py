"""Reel ObraWeb: gráficos animados + voz + subtítulos + música."""
import json, math, os, subprocess, wave
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

import sys
D = os.path.dirname(os.path.abspath(__file__))
GUION = os.path.abspath(sys.argv[1])
NAME = os.path.splitext(os.path.basename(GUION))[0]
B = os.path.join(D, "build", NAME)
W, H, FPS = 1080, 1920, 30
PAD_IN, PAD_OUT = 0.35, 0.45
INTER = "/usr/share/fonts/opentype/inter/Inter-{}.otf"
F = lambda w, s: ImageFont.truetype(INTER.format(w), s)

ACC = (255, 122, 26)      # naranja marca
ACC2 = (255, 122, 26)     # naranja (destacados)
BLUE = (40, 90, 200)      # brillo azul de fondo
WHITE, MUTED = (255, 255, 255), (176, 190, 220)
CARD = (18, 36, 78)

scenes = json.load(open(GUION))
for i, s in enumerate(scenes):
    with wave.open(os.path.join(B, f"v{i}.wav")) as w:
        s["sr"] = w.getframerate()
        s["audio"] = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(np.float32) / 32768
    s["vd"] = len(s["audio"]) / s["sr"]
    s["dur"] = PAD_IN + s["vd"] + PAD_OUT

ease = lambda x: 1 - (1 - min(max(x, 0.0), 1.0)) ** 3
def back(x):  # ease-out con rebote suave
    x = min(max(x, 0.0), 1.0); c = 1.7
    return 1 + (c + 1) * (x - 1) ** 3 + c * (x - 1) ** 2

# ---------- fondo ----------
def make_bg():
    yy = np.linspace(0, 1, H)[:, None]
    top, bot = np.array([6, 16, 40]), np.array([12, 30, 72])
    g = (top * (1 - yy[..., None]) + bot * yy[..., None]).repeat(W, 1).astype(np.float32)
    img = Image.fromarray(g.astype(np.uint8)).convert("RGBA")
    blobs = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(blobs)
    d.ellipse([-300, 200, 600, 1100], fill=BLUE + (110,))
    d.ellipse([500, 1100, 1400, 2000], fill=ACC2 + (45,))
    blobs = blobs.filter(ImageFilter.GaussianBlur(160))
    img.alpha_composite(blobs)
    grid = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(grid)
    for x in range(0, W, 90): d.line([x, 0, x, H], fill=(255, 255, 255, 10))
    for y in range(0, H, 90): d.line([0, y, W, y], fill=(255, 255, 255, 10))
    img.alpha_composite(grid)
    return img
BG = make_bg()

def rr(d, box, r, **kw): d.rounded_rectangle(box, r, **kw)
def ctext(d, y, txt, font, fill, x=W // 2):
    tw = d.textlength(txt, font=font); d.text((x - tw / 2, y), txt, font=font, fill=fill)

def shadowed(layer, blur=30, alpha=120):
    a = layer.getchannel("A").filter(ImageFilter.GaussianBlur(blur))
    sh = Image.new("RGBA", layer.size, (0, 0, 0, 0)); sh.putalpha(a.point(lambda v: v * alpha // 255))
    out = Image.new("RGBA", layer.size, (0, 0, 0, 0)); out.alpha_composite(sh, (0, 18)); out.alpha_composite(layer)
    return out

def place(frame, layer, cx, cy, scale=1.0, alpha=1.0):
    if alpha <= 0 or scale <= 0.01: return
    if scale != 1.0:
        layer = layer.resize((max(1, int(layer.width * scale)), max(1, int(layer.height * scale))), Image.BILINEAR)
    if alpha < 1:
        layer = layer.copy(); layer.putalpha(layer.getchannel("A").point(lambda v: int(v * alpha)))
    frame.alpha_composite(layer, (int(cx - layer.width / 2), int(cy - layer.height / 2)))

# ---------- escenas ----------
def phone(content_fn, t, w=560, h=1100):
    L = Image.new("RGBA", (w, h), (0, 0, 0, 0)); d = ImageDraw.Draw(L)
    rr(d, [0, 0, w - 1, h - 1], 70, fill=(14, 15, 26, 255), outline=(70, 74, 110, 255), width=6)
    rr(d, [w // 2 - 80, 22, w // 2 + 80, 52], 15, fill=(0, 0, 0, 255))
    content_fn(L, d, t, w, h)
    return shadowed(L)

def sc_hook(fr, t, dur):
    def content(L, d, t, w, h):
        rr(d, [40, 110, w - 40, 190], 40, fill=(38, 40, 66, 255))
        q = "tu negocio"[: int(max(0, t - 0.3) * 14)]
        d.text((80, 128), q + ("|" if int(t * 3) % 2 else ""), font=F("Medium", 38), fill=WHITE)
        if t > 1.4:
            a = ease((t - 1.4) / 0.4)
            ctext(d, 520, "Sin resultados", F("Bold", 50), (255, 110, 110, int(255 * a)), w // 2)
            ctext(d, 590, "No encontramos tu web", F("Medium", 32), MUTED + (int(255 * a),), w // 2)
    p = back(t / 0.5)
    place(fr, phone(content, t), W / 2, 980, 0.6 + 0.4 * p, ease(t / 0.3))
    L = Image.new("RGBA", (W, 300), (0, 0, 0, 0)); d = ImageDraw.Draw(L)
    ctext(d, 30, "¿Y TU WEB?", F("Black", 120), WHITE)
    place(fr, L, W / 2, 300 - 40 * (1 - ease(t / 0.4)), 1, ease(t / 0.4))

def sc_search(fr, t, dur):
    L = Image.new("RGBA", (920, 1050), (0, 0, 0, 0)); d = ImageDraw.Draw(L)
    rr(d, [0, 0, 919, 1049], 46, fill=CARD + (255,))
    rr(d, [40, 40, 880, 130], 45, fill=(42, 45, 74, 255))
    d.ellipse([78, 66, 112, 100], outline=MUTED, width=6); d.line([106, 96, 122, 112], fill=MUTED, width=7)
    d.text((145, 62), "negocios cerca de mí", font=F("Medium", 40), fill=WHITE)
    names = ["La Competencia S.L.", "Otro Negocio", "Tienda Rival", "Más Competencia"]
    for i, n in enumerate(names):
        a = ease((t - 0.3 - i * 0.35) / 0.35)
        if a <= 0: continue
        y = 180 + i * 210 + int(30 * (1 - a))
        rr(d, [40, y, 880, y + 180], 28, fill=(36, 38, 64, int(255 * a)))
        d.ellipse([70, y + 45, 160, y + 135], fill=ACC + (int(255 * a),))
        d.text((190, y + 42), n, font=F("Bold", 44), fill=WHITE + (int(255 * a),))
        d.text((190, y + 102), "★★★★★  ·  Web  ·  Llamar", font=F("Medium", 30), fill=ACC2 + (int(255 * a),))
    place(fr, shadowed(L), W / 2, 960, 0.9 + 0.1 * ease(t / 0.4), ease(t / 0.3))
    if t > 2.6:  # "tu negocio" tachado
        a = back((t - 2.6) / 0.4)
        T = Image.new("RGBA", (760, 150), (0, 0, 0, 0)); d = ImageDraw.Draw(T)
        rr(d, [0, 0, 759, 149], 75, fill=(255, 80, 90, 255))
        ctext(d, 38, "Tu negocio: no aparece", F("Black", 56), WHITE, 380)
        place(fr, T, W / 2, 400, a, 1)

def sc_build(fr, t, dur):
    L = Image.new("RGBA", (900, 1000), (0, 0, 0, 0)); d = ImageDraw.Draw(L)
    rr(d, [0, 0, 899, 999], 36, fill=(245, 246, 252, 255))
    rr(d, [0, 0, 899, 80], 36, fill=(225, 228, 240, 255)); d.rectangle([0, 50, 899, 80], fill=(225, 228, 240, 255))
    for i, c in enumerate([(255, 95, 87), (255, 189, 46), (40, 200, 64)]):
        d.ellipse([30 + i * 44, 25, 60 + i * 44, 55], fill=c)
    rr(d, [190, 20, 860, 62], 21, fill=(255, 255, 255, 255))
    d.text((215, 26), "tunegocio.com", font=F("Medium", 28), fill=(90, 95, 120))
    steps = [0.2, 0.7, 1.2, 1.7, 2.2, 2.7]
    def on(k): return ease((t - steps[k]) / 0.35)
    a = on(0)  # navbar
    if a:
        d.text((50, 115), "TU NEGOCIO", font=F("Black", 34), fill=(20, 20, 40, int(255 * a)))
        for i in range(3): rr(d, [520 + i * 120, 125, 610 + i * 120, 145], 10, fill=(190, 194, 214, int(255 * a)))
    a = on(1)  # hero
    if a:
        rr(d, [50, 200, 850, 520], 28, fill=ACC + (int(255 * a),))
        d.text((90, 250), "Lo mejor para", font=F("Black", 62), fill=(255, 255, 255, int(255 * a)))
        d.text((90, 325), "tus clientes", font=F("Black", 62), fill=(255, 255, 255, int(255 * a)))
    a = on(2)
    if a:
        rr(d, [90, 425, 400, 490], 33, fill=(255, 255, 255, int(255 * a)))
        ctext(d, 437, "Contactar", F("Bold", 34), ACC + (int(255 * a),), 245)
    for k in range(3):
        a = on(3 + k)
        if a:
            x = 50 + k * 270
            rr(d, [x, 570 + int(40 * (1 - a)), x + 250, 900 + int(40 * (1 - a))], 24, fill=(230, 232, 245, int(255 * a)))
            d.ellipse([x + 85, 610, x + 165, 690], fill=ACC2 + (int(255 * a),))
            rr(d, [x + 35, 730, x + 215, 755], 12, fill=(180, 184, 205, int(255 * a)))
            rr(d, [x + 60, 780, x + 190, 800], 10, fill=(200, 204, 222, int(255 * a)))
    place(fr, shadowed(L), W / 2 - 40, 900, 0.85 + 0.15 * ease(t / 0.5), ease(t / 0.3))
    if t > 3.0:  # móvil que entra
        def content(Lp, dp, tt, w, h):
            rr(dp, [24, 80, w - 24, 330], 30, fill=ACC + (255,))
            dp.text((60, 140), "Tu", font=F("Black", 54), fill=WHITE); dp.text((60, 200), "negocio", font=F("Black", 54), fill=WHITE)
            for k in range(3): rr(dp, [24, 370 + k * 180, w - 24, 520 + k * 180], 26, fill=(42, 45, 74, 255))
        place(fr, phone(content, t, 340, 680), 860, 1260 + 300 * (1 - back((t - 3.0) / 0.5)), 1, ease((t - 3.0) / 0.3))
    T = Image.new("RGBA", (W, 200), (0, 0, 0, 0)); d = ImageDraw.Draw(T)
    ctext(d, 20, "Obra", F("Black", 110), WHITE, W // 2 - 120); ctext(d, 20, "Web", F("Black", 110), ACC2, W // 2 + 150)
    place(fr, T, W / 2, 250, 1, ease(t / 0.4))

def sc_checks(fr, t, dur):
    items = ["Diseño a medida", "Perfecta en el móvil", "Carga rápida", "Te ocupas solo de tu negocio"]
    T = Image.new("RGBA", (W, 200), (0, 0, 0, 0)); d = ImageDraw.Draw(T)
    ctext(d, 30, "NOSOTROS LO HACEMOS", F("Black", 74), WHITE)
    place(fr, T, W / 2, 330, 1, ease(t / 0.4))
    for i, it in enumerate(items):
        st = 0.35 + i * 0.6
        a = back((t - st) / 0.45)
        if t < st: continue
        L = Image.new("RGBA", (900, 170), (0, 0, 0, 0)); d = ImageDraw.Draw(L)
        rr(d, [0, 0, 899, 169], 40, fill=CARD + (255,), outline=(44, 70, 130, 255), width=3)
        d.ellipse([40, 40, 130, 130], fill=ACC2)
        ck = ease((t - st - 0.2) / 0.25)
        pts = [(62, 86), (80, 105), (110, 66)]
        if ck > 0:
            if ck < 0.5: d.line([pts[0], (pts[0][0] + (pts[1][0] - pts[0][0]) * ck * 2, pts[0][1] + (pts[1][1] - pts[0][1]) * ck * 2)], fill=WHITE, width=12)
            else: d.line([pts[0], pts[1], (pts[1][0] + (pts[2][0] - pts[1][0]) * (ck - .5) * 2, pts[1][1] + (pts[2][1] - pts[1][1]) * (ck - .5) * 2)], fill=WHITE, width=12, joint="curve")
        d.text((170, 52), it, font=F("Bold", 54 if len(it) < 22 else 44), fill=WHITE)
        place(fr, shadowed(L, 20, 90), W / 2 + 200 * (1 - a), 640 + i * 210, 1, min(1, a))

def sc_cta(fr, t, dur):
    p = back(t / 0.6)
    L = Image.new("RGBA", (W, 300), (0, 0, 0, 0)); d = ImageDraw.Draw(L)
    ctext(d, 40, "Obra", F("Black", 190), WHITE, W // 2 - 205); ctext(d, 40, "Web", F("Black", 190), ACC2, W // 2 + 255)
    glow = L.filter(ImageFilter.GaussianBlur(40))
    place(fr, glow, W / 2, 720, p, 0.8); place(fr, L, W / 2, 720, p, 1)
    S = Image.new("RGBA", (W, 100), (0, 0, 0, 0)); d = ImageDraw.Draw(S)
    ctext(d, 20, "Webs que consiguen clientes", F("Medium", 52), MUTED)
    place(fr, S, W / 2, 900, 1, ease((t - 0.5) / 0.4))
    if t > 0.9:
        pulse = 1 + 0.04 * math.sin((t - 0.9) * 6)
        Bt = Image.new("RGBA", (720, 160), (0, 0, 0, 0)); d = ImageDraw.Draw(Bt)
        rr(d, [0, 0, 719, 159], 80, fill=ACC)
        ctext(d, 42, "Escríbenos hoy  →", F("Black", 62), WHITE, 360)
        place(fr, shadowed(Bt), W / 2, 1120, back((t - 0.9) / 0.5) * pulse, 1)

def sc_price(fr, t, dur):
    T = Image.new("RGBA", (W, 200), (0, 0, 0, 0)); d = ImageDraw.Draw(T)
    ctext(d, 30, "TU WEB PROFESIONAL", F("Black", 80), WHITE)
    place(fr, T, W / 2, 420, 1, ease(t / 0.4))
    S = Image.new("RGBA", (W, 120), (0, 0, 0, 0)); d = ImageDraw.Draw(S)
    ctext(d, 20, "en solo 2 cuotas de", F("Bold", 70), MUTED)
    place(fr, S, W / 2, 580, 1, ease((t - 0.8) / 0.4))
    st = dur * 0.55
    if t > st:
        p = back((t - st) / 0.5)
        P = Image.new("RGBA", (W, 420), (0, 0, 0, 0)); d = ImageDraw.Draw(P)
        ctext(d, 30, "135€", F("Black", 330), ACC2)
        glow = P.filter(ImageFilter.GaussianBlur(45))
        place(fr, glow, W / 2, 900, p, 0.9); place(fr, P, W / 2, 900, p, 1)
        # destellos alrededor
        for k in range(10):
            a = 2 * math.pi * k / 10 + (t - st) * 0.6
            r = 380 + 120 * ease((t - st) / 0.6)
            al = max(0, 1 - (t - st) / 1.2)
            if al <= 0: break
            Sp = Image.new("RGBA", (40, 40), (0, 0, 0, 0)); ImageDraw.Draw(Sp).ellipse([0, 0, 39, 39], fill=(255, 255, 255, 255))
            place(fr, Sp, W / 2 + math.cos(a) * r, 900 + math.sin(a) * r * 0.6, 0.6, al)
        N = Image.new("RGBA", (W, 100), (0, 0, 0, 0)); d = ImageDraw.Draw(N)
        ctext(d, 20, "270 € en total", F("Medium", 48), MUTED)
        place(fr, N, W / 2, 1180, 1, ease((t - st - 0.3) / 0.4))

DRAW = dict(price=sc_price, hook=sc_hook, search=sc_search, build=sc_build, checks=sc_checks, cta=sc_cta)

# ---------- subtítulos ----------
FS = F("Black", 76)
MAXW = W - 140
_m = ImageDraw.Draw(Image.new("RGBA", (1, 1)))
def _tw(ws, f): return _m.textlength(" ".join(ws), font=f) + 18
def sub_layer(txt, hi):
    words, f = txt.split(" "), FS
    lines = [words]
    if _tw(words, f) > MAXW and len(words) > 1:  # partir en 2 líneas lo más equilibradas posible
        k = min(range(1, len(words)), key=lambda k: max(_tw(words[:k], f), _tw(words[k:], f)))
        lines = [words[:k], words[k:]]
    while max(_tw(l, f) for l in lines) > MAXW and f.size > 40:  # palabra suelta demasiado larga
        f = F("Black", f.size - 4)
    lh = int(f.size * 1.18)
    L = Image.new("RGBA", (W, lh * len(lines) + 40), (0, 0, 0, 0)); d = ImageDraw.Draw(L)
    k = 0
    for li, line in enumerate(lines):
        x = (W - _m.textlength(" ".join(line), font=f)) / 2
        for wd in line:
            col = ACC2 if k == hi else WHITE
            d.text((x, 20 + li * lh), wd, font=f, fill=col, stroke_width=9, stroke_fill=(0, 0, 0))
            x += d.textlength(wd + " ", font=f); k += 1
    return L
def groups(text, n=3):
    w = text.upper().split(); return [w[i:i + n] for i in range(0, len(w), n)]

# ---------- portada (Instagram / TikTok) ----------
def make_cover(lines):
    """lines: textos; los que empiezan por '*' van en verde y más grandes."""
    fr = BG.copy(); d = ImageDraw.Draw(fr)
    glow = Image.new("RGBA", (W, H), (0, 0, 0, 0)); g = ImageDraw.Draw(glow)
    g.ellipse([140, 560, 940, 1360], fill=BLUE + (130,)); fr.alpha_composite(glow.filter(ImageFilter.GaussianBlur(170)))
    rows = []
    for ln in lines:
        big = ln.startswith("*"); txt = ln.lstrip("*")
        f = F("Black", 260 if big else 120)
        while d.textlength(txt, font=f) > W - 120: f = F("Black", f.size - 6)
        rows.append((txt, f, ACC2 if big else WHITE))
    total = sum(int(f.size * 1.12) for _, f, _ in rows)
    y = 960 - total / 2 - 60  # centrado dentro de la zona 3:4 que se ve en el perfil
    for txt, f, col in rows:
        tw = d.textlength(txt, font=f)
        d.text(((W - tw) / 2, y), txt, font=f, fill=col, stroke_width=8, stroke_fill=(0, 0, 0))
        y += int(f.size * 1.12)
    fo = F("Black", 90); ow = d.textlength("Obra", font=fo); tw = ow + d.textlength("Web", font=fo)
    d.text(((W - tw) / 2, 1500), "Obra", font=fo, fill=WHITE); d.text(((W - tw) / 2 + ow, 1500), "Web", font=fo, fill=ACC2)
    fr.convert("RGB").save(os.path.join(D, "videos", NAME + "_portada.jpg"), quality=92)
make_cover(scenes[0].get("cover", [scenes[0]["text"].upper()]))

# ---------- render ----------
out_v = os.path.join(B, "video.mp4")
ff = subprocess.Popen(["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}",
                       "-r", str(FPS), "-i", "-", "-c:v", "libx264", "-preset", "medium", "-crf", "19",
                       "-pix_fmt", "yuv420p", out_v], stdin=subprocess.PIPE)
for si, s in enumerate(scenes):
    gs = groups(s.get("sub", s["text"]))
    words = [w for g in gs for w in g]
    wt = np.array([len(w) + 2 for w in words], float)
    wb = np.concatenate([[0], np.cumsum(wt) / wt.sum()]) * s["vd"] + PAD_IN
    nfr = int(round(s["dur"] * FPS))
    for fi in range(nfr):
        t = fi / FPS
        z = 1.04 + 0.03 * (fi / nfr)
        fr = BG.resize((int(W * z), int(H * z)), Image.BILINEAR).crop(
            (int(W * (z - 1) / 2), int(H * (z - 1) / 2), int(W * (z - 1) / 2) + W, int(H * (z - 1) / 2) + H))
        DRAW[s["kind"]](fr, t + (0.9 if si == 0 else 0), s["dur"])  # 1ª escena ya visible desde el fotograma 0
        if PAD_IN * 0.6 <= t:
            wi = int(min(max(np.searchsorted(wb, t, side="right") - 1, 0), len(words) - 1))
            gi, acc = 0, 0
            for gi, g in enumerate(gs):
                if wi < acc + len(g): break
                acc += len(g)
            pop = ease((t - wb[acc]) / 0.12) if t >= wb[acc] else 1
            place(fr, sub_layer(" ".join(gs[gi]), wi - acc), W / 2, 1640, 0.88 + 0.12 * pop, 1)
        rgb = np.asarray(fr.convert("RGB"), np.float32)
        fade = min(1, (t + 0.001) / 0.12, (s["dur"] - t) / 0.12) if si not in (0,) else min(1, (s["dur"] - t) / 0.12)
        if si == len(scenes) - 1: fade = min(1, (t + 0.001) / 0.12)
        ff.stdin.write((rgb * max(0, fade)).astype(np.uint8).tobytes())
    print("escena", si, "ok", flush=True)
ff.stdin.close(); ff.wait()

# ---------- audio: voz + música + whoosh ----------
SR = 24000
voice = []
for s in scenes:
    a = s["audio"] if s["sr"] == SR else np.interp(np.linspace(0, len(s["audio"]) - 1, int(len(s["audio"]) * SR / s["sr"])), np.arange(len(s["audio"])), s["audio"])
    n = int(round(s["dur"] * FPS)) * SR // FPS
    seg = np.zeros(n, np.float32); st = int(PAD_IN * SR); seg[st:st + len(a)] = a[: n - st]
    voice.append(seg)
starts = np.cumsum([0] + [len(v) for v in voice])[:-1]
voice = np.concatenate(voice); n = len(voice); t = np.arange(n) / SR
bpm = 112; beat = 60 / bpm
music = np.zeros(n, np.float32)
roots = [130.81, 110.0, 87.31, 98.0]  # C Am F G
for b in range(int(n / SR / beat) + 1):
    a0 = int(b * beat * SR); tt = np.arange(min(int(beat * SR), n - a0)) / SR
    if len(tt) <= 0: break
    music[a0:a0 + len(tt)] += np.sin(2 * np.pi * 55 * np.exp(-tt * 18) * tt * 8) * np.exp(-tt * 9) * (0.5 if b % 2 == 0 else 0.0)  # kick
    hh = np.random.default_rng(b).standard_normal(len(tt)) * np.exp(-tt * 60) * 0.06
    h0 = int(beat / 2 * SR); music[a0 + h0:a0 + len(tt)] += hh[: len(tt) - h0] if len(tt) > h0 else 0
    r = roots[(b // 4) % 4]
    for m in (1, 1.26, 1.5, 2):
        music[a0:a0 + len(tt)] += np.sin(2 * np.pi * r * m * tt) * np.exp(-tt * 3) * 0.035
    music[a0:a0 + len(tt)] += np.sin(2 * np.pi * r / 2 * tt) * np.minimum(1, tt * 20) * np.exp(-tt * 4) * 0.12
for st in starts[1:]:  # whoosh en cada transición
    L = int(0.35 * SR); nz = np.random.default_rng(int(st)).standard_normal(L)
    env = np.sin(np.linspace(0, np.pi, L)) ** 2
    nz = np.convolve(nz, np.ones(12) / 12, "same") * env * 0.25
    a0 = max(0, st - L // 2); music[a0:a0 + L] += nz[: n - a0]
music *= np.minimum(1, t / 0.5) * np.minimum(1, (t[-1] - t) / 0.8)
# bajar música bajo la voz (ducking)
env = np.convolve(np.abs(voice), np.ones(2400) / 2400, "same"); duck = 1 - 0.55 * np.clip(env / 0.04, 0, 1)
mix = voice * 1.1 + music * 0.5 * duck
mix /= np.abs(mix).max() / 0.95
with wave.open(os.path.join(B, "audio.wav"), "w") as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((mix * 32767).astype(np.int16).tobytes())
final = os.path.join(D, "videos", NAME + ".mp4")
subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", out_v, "-i", os.path.join(B, "audio.wav"), "-c:v", "copy",
                "-c:a", "aac", "-b:a", "192k", "-shortest", "-movflags", "+faststart", final], check=True)
print("listo", final, round(n / SR, 1), "s")
