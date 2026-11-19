# Banda sonora y efectos de la animación OBRAWEB (16,4 s), sincronizados con las escenas de obraweb-cine.html.
# Uso: python3 sonido.py salida.wav     (solo necesita numpy)
import sys, wave, numpy as np
SR = 48000; DUR = 16.4; N = int(SR * DUR)
rng = np.random.default_rng(11)
L = np.zeros(N); Rch = np.zeros(N)

def at(t): return int(t * SR)
def add(sig, t, gain=1.0, pan=0.0):
    i = at(t); j = min(N, i + len(sig))
    if j <= i or i >= N: return
    s = sig[: j - i] * gain
    L[i:j] += s * np.sqrt((1 - pan) / 2) * 1.414; Rch[i:j] += s * np.sqrt((1 + pan) / 2) * 1.414
def tt(d): return np.arange(int(d * SR)) / SR
def env(d, a=0.005, r=None):
    x = tt(d); e = np.minimum(1, x / max(a, 1e-4))
    return e * (np.exp(-x / r) if r else 1)
def lowpass(x, fc):  # FIR de seno enventanado
    k = 255; n = np.arange(k) - k // 2; h = np.sinc(2 * fc / SR * n) * np.hamming(k); h /= h.sum()
    return np.convolve(x, h, mode="same")
def sweep_lp(x, f0, f1):  # filtro de un polo con corte variable (para barridos)
    y = np.zeros_like(x); s = 0.0; fc = np.geomspace(f0, f1, len(x)); a = 1 - np.exp(-2 * np.pi * fc / SR)
    for i in range(len(x)): s += a[i] * (x[i] - s); y[i] = s
    return y
def saw(f, d):
    x = tt(d); ph = (x * f) % 1; return 2 * ph - 1
def note(n): return 440 * 2 ** ((n - 69) / 12)

# --- instrumentos ---
def kick():
    x = tt(0.45); f = 45 + 110 * np.exp(-x / 0.03); ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) * np.exp(-x / 0.16) * 1.0
def hat(d=0.05):
    n = rng.standard_normal(int(d * SR)); return (n - lowpass(n, 7000)) * np.exp(-tt(d) / (d / 4)) * 0.35
def clap():
    n = rng.standard_normal(int(0.25 * SR)); b = lowpass(n, 3500) - lowpass(n, 900)
    return b * np.exp(-tt(0.25) / 0.06) * 0.9
def impact(big=1.0):
    x = tt(2.2); f = 30 + 40 * np.exp(-x / 0.25); sub = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-x / 0.7)
    n = rng.standard_normal(len(x)); crash = lowpass(n, 5000) * np.exp(-x / 0.35) * 0.35
    return (sub * 1.1 + crash) * big
def whoosh(d=0.5, up=True):
    n = rng.standard_normal(int(d * SR)); y = sweep_lp(n, 300 if up else 6000, 6000 if up else 300)
    e = np.sin(np.linspace(0, np.pi, len(y))) ** 2; return y * e * 0.9
def riser(d):
    x = tt(d); n = sweep_lp(rng.standard_normal(len(x)), 200, 9000) * 0.6
    f = np.geomspace(180, 1600, len(x)); tone = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.25
    return (n + tone) * (x / d) ** 2
def blip(f=2200, d=0.04): return np.sin(2 * np.pi * f * tt(d)) * np.exp(-tt(d) / 0.012) * 0.5
def ping(f=1760, d=0.8): return (np.sin(2 * np.pi * f * tt(d)) + .3 * np.sin(2 * np.pi * 2 * f * tt(d))) * np.exp(-tt(d) / 0.25) * 0.25
def pluck(n, d=0.35, br=2500): return lowpass(saw(note(n), d) * env(d, 0.003, 0.12), br) * 0.5
def pad(notes, d, br=1400):
    s = sum(saw(note(m) * (1 + k * 0.004), d) for m in notes for k in (-1, 1)) / (2 * len(notes))
    e = np.minimum(1, tt(d) / 0.4) * np.minimum(1, (d - tt(d)) / 0.5); return lowpass(s, br) * e * 0.5
def bassnote(n, d): return lowpass(saw(note(n), d) + 0.5 * np.sign(np.sin(2 * np.pi * note(n) / 2 * tt(d))), 600) * env(d, 0.004, 0.25) * 0.55

BPM = 128; B = 60 / BPM
CH = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]]  # Am F C G
ROOT = [45, 41, 36, 43]

# --- 0–1,2: latido y zumbido ---
for k in range(3): add(kick() * 0.6, 0.12 + k * 0.52, 0.8)
add(lowpass(saw(note(33), 1.2), 300) * np.minimum(1, tt(1.2) / 0.8) * 0.25, 0)
add(whoosh(0.45), 0.8, 0.8)
# --- 1,2: explosión del punto ---
add(impact(1.0), 1.2, 1.0)
for i in range(7): add(blip(1500 + i * 120, 0.03), 1.30 + i * 0.05, 0.6, pan=-0.6 + i * 0.2)  # letras de OBRAWEB
add(whoosh(0.5), 2.05, 0.5, pan=0.5)  # barrido de luz
# --- ritmo principal (de 1,2 a 14,6 con huecos) ---
def bar_beats(t0, t1, kick_on=True, clap_on=True, hats=True, bass=True, lp=None):
    t = t0; b = 0
    while t < t1 - 1e-6:
        bar = int((t - 1.2) / (4 * B)) % 4
        if kick_on: add(kick(), t, 0.9)
        if clap_on and b % 2 == 1: add(clap(), t, 0.5)
        if hats: add(hat(), t + B / 2, 0.6, pan=0.3); add(hat(0.03), t + B / 4 * 3, 0.3, pan=-0.3)
        if bass:
            bn = bassnote(ROOT[bar], B * 0.9); add(lowpass(bn, lp) if lp else bn, t + B / 2, 0.8)
        t += B; b += 1
bar_beats(1.2, 2.6)
# --- 2,6–4,0: hiperespacio (subida) ---
add(riser(1.4), 2.6, 0.9)
for k in range(12): add(hat(0.03), 2.6 + k * 0.116, 0.4 + k * 0.03, pan=(k % 2) * 0.6 - 0.3)
add(whoosh(0.6), 3.0, 0.7, pan=-0.4); add(whoosh(0.6), 3.4, 0.7, pan=0.4)
# --- 4,0: SIN WEB (oscuro, notas que bajan) ---
add(impact(0.7), 4.0, 0.9)
bar_beats(4.0, 5.7, clap_on=False, hats=False, lp=250)
for i, n in enumerate([64, 60, 57, 52, 45]): add(pluck(n, 0.45, 1200), 4.25 + i * 0.27, 0.7)
add(pad(CH[0], 1.7, 600), 4.0, 0.5)
# --- 5,7: CON OBRAWEB (brillante, notas que suben) ---
add(whoosh(0.4), 5.45, 0.7); add(impact(0.6), 5.7, 0.7)
bar_beats(5.7, 7.3)
for i, n in enumerate([57, 60, 64, 67, 69, 72, 76, 81]): add(pluck(n, 0.3, 4000), 5.85 + i * 0.13, 0.55, pan=-0.5 + i * 0.14)
add(ping(1760), 7.0, 0.8)  # círculo completado ✓
add(pad(CH[2], 1.6, 2200), 5.7, 0.4)
# --- 7,3: 24/7 (anillos que giran) ---
bar_beats(7.3, 8.8, clap_on=False)
for i in range(6): add(ping(1318 if i % 2 else 1760, 0.6), 7.35 + i * 0.25, 0.35, pan=0.7 if i % 2 else -0.7)
add(impact(0.5), 7.55, 0.5)
# --- 8,8: tarjeta (clics de interfaz) ---
bar_beats(8.8, 10.3, kick_on=True, clap_on=True, hats=False)
add(whoosh(0.35, up=False), 8.8, 0.6)
for i in range(3): add(blip(2600, 0.035), 9.15 + i * 0.12, 0.8)
add(blip(900, 0.06) + np.pad(blip(1800, 0.05), (int(0.02 * SR), 0))[: int(0.06 * SR)], 9.75, 1.0)  # interruptor
add(ping(2093, 0.7), 9.85, 0.6)
# --- 10,3: forma naranja (bajo que se ondula) ---
x = tt(1.3); wob = lowpass(saw(note(33), 1.3), 300 + 0) * (0.6 + 0.4 * np.sin(2 * np.pi * 6 * x)); add(wob * 0.5, 10.3, 0.8)
bar_beats(10.3, 11.6, clap_on=False)
add(impact(0.6), 10.75, 0.7)  # «Te enseñamos tu web GRATIS»
# --- 11,6: rejilla + estallido de luz ---
add(sweep_lp(rng.standard_normal(int(0.5 * SR)), 400, 5000) * np.sin(np.linspace(0, np.pi, int(0.5 * SR))) * 0.5, 11.6, 0.7)
add(riser(0.7), 12.1, 1.0)
add(whoosh(0.5), 12.35, 1.0)
# --- 12,8: OBRAWEB. (golpe final) ---
add(impact(1.3), 12.8, 1.1)
bar_beats(12.8, 14.6)
add(pad(CH[0] + [69], 1.8, 2500), 12.8, 0.45)
add(ping(2093, 0.8), 13.45, 0.5)  # botón
add(whoosh(0.5), 13.9, 0.5, pan=0.5)  # barrido de luz
# --- 14,6: malla 3D (ambiente y cierre en bucle) ---
add(whoosh(0.5, up=False), 14.45, 0.6)
add(pad([57, 64, 69, 72], 1.8, 1800), 14.6, 0.6)
for i, n in enumerate([81, 76, 72, 69]): add(ping(note(n), 0.9), 14.8 + i * 0.3, 0.45, pan=-0.5 + i * 0.33)

# --- reverberación simple y mezcla ---
def reverb(x, secs=1.4, mix=0.18):
    ir = rng.standard_normal(int(secs * SR)) * np.exp(-tt(secs) / (secs / 5)); ir[0] = 0
    nfft = 1 << int(np.ceil(np.log2(len(x) + len(ir))))
    y = np.fft.irfft(np.fft.rfft(x, nfft) * np.fft.rfft(ir, nfft), nfft)[: len(x)]
    y /= np.max(np.abs(y)) + 1e-9; return x + y * mix * np.max(np.abs(x))
L = reverb(L); Rch = reverb(Rch)
fade = np.ones(N); fl = at(0.5); fade[-fl:] = np.linspace(1, 0, fl)   # final suave para que el bucle no pegue un salto
fi = at(0.02); fade[:fi] = np.linspace(0, 1, fi)
mix = np.stack([L, Rch], 1) * fade[:, None]
mix = np.tanh(mix / (np.max(np.abs(mix)) + 1e-9) * 1.6) / np.tanh(1.6) * 0.89
out = sys.argv[1] if len(sys.argv) > 1 else "obraweb_sonido.wav"
with wave.open(out, "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((mix * 32767).astype("<i2").tobytes())
print("ok", out)
