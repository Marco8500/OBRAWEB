# Banda sonora del reel vertical (13,6 s). Reutiliza los instrumentos de ../pantalla-cine/sonido.py
# Uso: python3 sonido_reel.py salida.wav
import os, sys
base = open(os.path.join(os.path.dirname(__file__), "..", "pantalla-cine", "sonido.py"), encoding="utf-8").read()
inst, rest = base.split("# --- 0–1,2")[0], base.split("# --- reverberación")[1]
exec(inst.replace("DUR = 16.4", "DUR = 13.6"))

def beats(t0, t1, **kw):
    kw.setdefault("clap_on", True)
    t = t0; b = 0
    while t < t1 - 1e-6:
        bar = int((t - 1.0) / (4 * B)) % 4
        if kw.get("kick_on", True): add(kick(), t, 0.9)
        if kw["clap_on"] and b % 2 == 1: add(clap(), t, 0.5)
        if kw.get("hats", True): add(hat(), t + B / 2, 0.6, pan=0.3); add(hat(0.03), t + B * .75, 0.3, pan=-0.3)
        if kw.get("bass", True): add(bassnote(ROOT[bar], B * 0.9), t + B / 2, 0.8)
        t += B; b += 1

# 0–1,0: punto que late
for k in range(2): add(kick() * 0.6, 0.1 + k * 0.45, 0.8)
add(lowpass(saw(note(33), 1.0), 300) * np.minimum(1, tt(1.0) / 0.7) * 0.25, 0)
add(whoosh(0.4), 0.7, 0.8)
# 1,0: logo
add(impact(0.9), 1.0)
for i, n in enumerate([57, 64, 69]): add(pluck(n, 0.4, 3500), 1.05 + i * 0.09, 0.6, pan=-0.4 + i * 0.4)
beats(1.0, 2.0, clap_on=False)
# 2,0–4,6: la web haciendo scroll
add(whoosh(0.35, up=False), 1.85, 0.6)
beats(2.0, 4.6)
add(blip(2400, 0.04), 2.2, 0.6)                       # rótulo «Rápida y lista para móvil»
add(pad(CH[0], 2.6, 1800), 2.0, 0.35)
# 4,6: zoom a precios
add(whoosh(0.4), 4.4, 0.7, pan=0.4); add(blip(2400, 0.04), 4.7, 0.6)
add(riser(1.0), 4.6, 0.7)
beats(4.6, 5.6, clap_on=False, bass=False)
# 5,6: golpe del «450 €»
add(impact(1.2), 5.6, 1.1); add(clap(), 5.6, 0.6)
beats(5.6, 6.8)
add(pad(CH[2], 1.2, 2400), 5.6, 0.4)
# 6,8: asistente (chat)
add(whoosh(0.4), 6.6, 0.7, pan=-0.4); add(blip(2400, 0.04), 6.9, 0.6)
for i in range(5): add(blip(1800 + 200 * (i % 2), 0.025), 7.05 + i * 0.08, 0.35)   # «escribiendo…»
add(ping(1760, 0.7), 7.5, 0.7)                                                     # llega la respuesta
beats(6.8, 8.6, clap_on=False)
# 8,6–10,2: cortes del portfolio (un golpe seco por corte)
for k in range(4):
    add(impact(0.35)[: int(0.5 * SR)], 8.6 + k * 0.4, 0.8); add(hat(0.06), 8.6 + k * 0.4, 0.6, pan=(-1) ** k * 0.5)
beats(8.6, 10.2)
add(blip(2400, 0.04), 8.7, 0.6)
# 10,2: muestra gratis
add(sweep_lp(rng.standard_normal(int(0.5 * SR)), 400, 5000) * np.sin(np.linspace(0, np.pi, int(0.5 * SR))) * 0.5, 10.2, 0.7)
add(impact(0.6), 10.5, 0.7); add(blip(2400, 0.04), 10.3, 0.6)
beats(10.2, 11.2, clap_on=False, hats=False)
add(riser(0.5), 11.1, 1.0); add(whoosh(0.4), 11.3, 0.9)
# 11,6: OBRAWEB. y botón
add(impact(1.3), 11.6, 1.1)
beats(11.6, 13.2)
add(pad(CH[0] + [69], 2.0, 2500), 11.6, 0.45)
add(ping(2093, 0.8), 12.05, 0.6)
for i, n in enumerate([81, 76, 72]): add(ping(note(n), 0.8), 12.6 + i * 0.25, 0.35, pan=-0.4 + i * 0.4)

exec("#" + rest)  # reverberación, mezcla y escritura del WAV (igual que en sonido.py)
