/* Apex GP – original top-down formula racing game.
 * All graphics are drawn in code and all sounds are synthesised with WebAudio,
 * so the game ships with zero external assets. */
'use strict';
(() => {
  // ---------------------------------------------------------------- config
  const params = new URLSearchParams(location.search);
  const AUTOPILOT = params.has('autopilot');          // debug: player car drives itself
  const TIME_SCALE = Math.min(20, Math.max(1, +params.get('timescale') || 1));
  const COVER = params.get('cover');                   // debug: render cover art

  const LAPS = 3;
  const TRACK_W = 150;
  const SP = 8;              // centre-line sample spacing (px)
  const CAR_R = 17;
  const STEP = 1 / 120;      // physics step
  const VREF = 860;          // reference top speed used for the speed table
  const STEER_RATE = 2.7;

  const TRACKS = [
    { name: 'Harbor Loop', theme: 'green', scale: 2.4, ai: 0.76, reward: 1,
      pts: [[0,0],[800,0],[1300,100],[1500,400],[1400,800],[1000,950],[600,850],[300,1000],[-100,900],[-300,500],[-250,150]] },
    { name: 'Alpine Ring', theme: 'snow', scale: 2.2, ai: 0.85, reward: 1.4,
      pts: [[0,0],[600,-100],[1000,100],[1100,500],[800,700],[900,1000],[1300,1100],[1500,1500],[1100,1800],[500,1700],[200,1300],[-200,1200],[-400,800],[-200,400]] },
    { name: 'Dune Sprint', theme: 'sand', scale: 2.0, ai: 0.93, reward: 1.8,
      pts: [[0,0],[500,0],[900,-200],[1300,0],[1300,400],[900,500],[700,800],[1100,1000],[1500,900],[1700,1300],[1300,1600],[700,1500],[300,1700],[-200,1500],[-300,1000],[100,800],[0,400],[-300,300],[-300,50]] },
    { name: 'Neon City', theme: 'night', scale: 2.0, ai: 0.98, reward: 2.4,
      pts: [[0,0],[700,0],[900,150],[900,500],[1200,600],[1500,500],[1700,700],[1600,1100],[1200,1200],[1000,1000],[700,1100],[400,1300],[0,1200],[-200,900],[100,700],[100,400],[-150,250]] },
  ];

  const THEMES = {
    green: { ground: '#3f8a3c', ground2: '#479642', runoff: '#8a8a8e', asphalt: '#3a3b41', deco: 'tree', c1: '#2b6b2a', c2: '#3c8a36' },
    snow:  { ground: '#dfe7ec', ground2: '#eaf0f4', runoff: '#a3abb2', asphalt: '#45474e', deco: 'pine', c1: '#2c5a38', c2: '#3c7549' },
    sand:  { ground: '#d8b06c', ground2: '#e0bb7c', runoff: '#bfa071', asphalt: '#4a4744', deco: 'cactus', c1: '#6f8a36', c2: '#88a446' },
    night: { ground: '#18211c', ground2: '#1c2620', runoff: '#34353b', asphalt: '#2a2b31', deco: 'lamp', c1: '#11291a', c2: '#183622' },
  };

  const LIVERIES = [
    { body: '#e10600', accent: '#ffffff', helmet: '#ffd400' },
    { body: '#1e5bff', accent: '#ffd400', helmet: '#ffffff' },
    { body: '#ff8000', accent: '#1a1a1a', helmet: '#2fd0ff' },
    { body: '#00a19b', accent: '#e6e6e6', helmet: '#111111' },
    { body: '#c9ccd1', accent: '#00d2be', helmet: '#e10600' },
    { body: '#ffd400', accent: '#111111', helmet: '#1e5bff' },
    { body: '#7a2bd8', accent: '#ffffff', helmet: '#ff2d8a' },
    { body: '#1b7a2f', accent: '#f2c200', helmet: '#ffffff' },
  ];
  const AI_NAMES = ['R. Vance', 'K. Moreau', 'T. Sato', 'L. Brandt', 'D. Okafor', 'A. Novak', 'J. Lindqvist', 'M. Ferro'];

  const UPGRADES = [
    { key: 'engine', name: 'Engine', desc: 'Top speed & acceleration' },
    { key: 'tyres',  name: 'Tyres',  desc: 'Grip & steering' },
    { key: 'brakes', name: 'Brakes', desc: 'Stopping power' },
  ];
  const UPG_COST = [120, 250, 400, 600, 900];
  const UPG_MAX = 5;
  const PRIZE = [150, 100, 70, 50, 35, 25];

  // ---------------------------------------------------------------- utils
  const $ = (id) => document.getElementById(id);
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const wrapAngle = (a) => { while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI; return a; };
  const ordinal = (n) => n + (['th', 'st', 'nd', 'rd'][(n % 100 > 10 && n % 100 < 14) ? 0 : (n % 10 < 4 ? n % 10 : 0)]);
  const fmtTime = (t) => {
    if (!isFinite(t)) return '--:--.---';
    const m = Math.floor(t / 60), s = t - m * 60;
    return m + ':' + (s < 10 ? '0' : '') + s.toFixed(3);
  };
  function rng(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // ---------------------------------------------------------------- CrazyGames SDK wrapper
  const CG = {
    sdk: null,
    async init() {
      try {
        if (window.CrazyGames && window.CrazyGames.SDK) {
          await window.CrazyGames.SDK.init();
          this.sdk = window.CrazyGames.SDK;
        }
      } catch (e) { console.warn('CrazyGames SDK unavailable', e); this.sdk = null; }
    },
    call(fn) { try { if (this.sdk) fn(this.sdk); } catch (e) { console.warn(e); } },
    loadingStart() { this.call((s) => s.game.loadingStart()); },
    loadingStop() { this.call((s) => s.game.loadingStop()); },
    playing: false,
    gameplayStart() { if (!this.playing) { this.playing = true; this.call((s) => s.game.gameplayStart()); } },
    gameplayStop() { if (this.playing) { this.playing = false; this.call((s) => s.game.gameplayStop()); } },
    happytime() { this.call((s) => s.game.happytime()); },
    get muted() { try { return !!(this.sdk && this.sdk.game.settings.muteAudio); } catch (e) { return false; } },
    onSettings(cb) { this.call((s) => s.game.addSettingsChangeListener(cb)); },
    // type: 'midgame' | 'rewarded'. Resolves true if the ad completed.
    ad(type) {
      return new Promise((resolve) => {
        if (!this.sdk) { resolve(type !== 'rewarded'); return; }
        let done = false;
        const finish = (ok) => { if (done) return; done = true; Sound.adPause(false); resolve(ok); };
        try {
          this.sdk.ad.requestAd(type, {
            adStarted: () => Sound.adPause(true),
            adFinished: () => finish(true),
            adError: () => finish(false),
          });
        } catch (e) { finish(false); }
      });
    },
    getItem(k) {
      try { if (this.sdk && this.sdk.data) return this.sdk.data.getItem(k); } catch (e) { /* fall back */ }
      try { return localStorage.getItem(k); } catch (e) { return null; }
    },
    setItem(k, v) {
      try { if (this.sdk && this.sdk.data) { this.sdk.data.setItem(k, v); return; } } catch (e) { /* fall back */ }
      try { localStorage.setItem(k, v); } catch (e) { /* ignore */ }
    },
  };

  // ---------------------------------------------------------------- save data
  const SAVE_KEY = 'apexgp_save_v1';
  const save = { coins: 0, unlocked: 1, best: {}, up: { engine: 0, tyres: 0, brakes: 0 }, livery: 0, userMuted: false, races: 0 };
  function loadSave() {
    try {
      const raw = CG.getItem(SAVE_KEY);
      if (raw) {
        const d = JSON.parse(raw);
        Object.assign(save, d);
        save.up = Object.assign({ engine: 0, tyres: 0, brakes: 0 }, d.up || {});
        save.best = d.best || {};
      }
    } catch (e) { /* corrupt save – start fresh */ }
  }
  function writeSave() { CG.setItem(SAVE_KEY, JSON.stringify(save)); }

  // ---------------------------------------------------------------- sound (WebAudio synth)
  const Sound = {
    ctx: null, master: null, eng: null, adMuted: false,
    ensure() {
      if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.connect(this.ctx.destination);
      // engine: two detuned oscillators through a low-pass
      const g = this.ctx.createGain(); g.gain.value = 0;
      const f = this.ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 900; f.Q.value = 4;
      const o1 = this.ctx.createOscillator(); o1.type = 'sawtooth';
      const o2 = this.ctx.createOscillator(); o2.type = 'square';
      const g2 = this.ctx.createGain(); g2.gain.value = 0.35;
      o1.connect(f); o2.connect(g2); g2.connect(f); f.connect(g); g.connect(this.master);
      o1.start(); o2.start();
      this.eng = { g, f, o1, o2 };
      this.applyMute();
    },
    isMuted() { return save.userMuted || CG.muted || this.adMuted; },
    applyMute() {
      if (this.master) this.master.gain.value = this.isMuted() ? 0 : 0.6;
      $('btnMute').textContent = (save.userMuted || CG.muted) ? '🔇' : '🔊';
    },
    adPause(on) { this.adMuted = on; this.applyMute(); },
    engine(speed, maxSpd, on) {
      if (!this.eng) return;
      const t = this.ctx.currentTime;
      const v = Math.max(0, speed);
      const gears = 7, frac = clamp(v / (maxSpd * 1.02), 0, 0.999);
      const gear = Math.floor(frac * gears);
      const rpm = gear === 0 ? frac * gears : 0.35 + 0.65 * (frac * gears - gear);
      const freq = 55 + rpm * 150 + gear * 6;
      this.eng.o1.frequency.setTargetAtTime(freq, t, 0.03);
      this.eng.o2.frequency.setTargetAtTime(freq * 0.5, t, 0.03);
      this.eng.f.frequency.setTargetAtTime(500 + rpm * 1600, t, 0.05);
      this.eng.g.gain.setTargetAtTime(on ? 0.10 + rpm * 0.06 : 0, t, 0.08);
    },
    beep(freq, dur, type = 'square', vol = 0.15, delay = 0) {
      if (!this.ctx) return;
      const t = this.ctx.currentTime + delay;
      const o = this.ctx.createOscillator(), g = this.ctx.createGain();
      o.type = type; o.frequency.value = freq;
      g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(this.master); o.start(t); o.stop(t + dur + 0.02);
    },
    thump() { this.beep(90, 0.12, 'triangle', 0.25); },
    fanfare(good) {
      const notes = good ? [523, 659, 784, 1047] : [392, 349, 330];
      notes.forEach((n, i) => this.beep(n, 0.25, 'square', 0.12, i * 0.13));
    },
  };

  // ---------------------------------------------------------------- track building
  function catmull(p0, p1, p2, p3, t) {
    const t2 = t * t, t3 = t2 * t;
    const f = (a, b, c, d) => 0.5 * ((2 * b) + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
    return { x: f(p0.x, p1.x, p2.x, p3.x), y: f(p0.y, p1.y, p2.y, p3.y) };
  }

  function buildTrack(def, index) {
    const cp = def.pts.map((p) => ({ x: p[0] * def.scale, y: p[1] * def.scale }));
    const n = cp.length, raw = [];
    for (let i = 0; i < n; i++) {
      const p0 = cp[(i - 1 + n) % n], p1 = cp[i], p2 = cp[(i + 1) % n], p3 = cp[(i + 2) % n];
      const steps = Math.max(8, Math.ceil(Math.hypot(p2.x - p1.x, p2.y - p1.y) / 4));
      for (let s = 0; s < steps; s++) raw.push(catmull(p0, p1, p2, p3, s / steps));
    }
    // resample to uniform spacing
    const out = [raw[0]];
    let carry = 0;
    for (let i = 0; i < raw.length; i++) {
      const a = raw[i], b = raw[(i + 1) % raw.length];
      const seg = Math.hypot(b.x - a.x, b.y - a.y);
      let d = SP - carry;
      while (d <= seg) {
        const t = d / seg;
        out.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
        d += SP;
      }
      carry = seg - (d - SP);
    }
    if (Math.hypot(out[out.length - 1].x - out[0].x, out[out.length - 1].y - out[0].y) < SP * 0.5) out.pop();
    // shift the start line ~220px into the first straight
    const shift = Math.floor(220 / SP);
    const pts = out.slice(shift).concat(out.slice(0, shift));
    const N = pts.length;
    const px = new Float32Array(N), py = new Float32Array(N), nx = new Float32Array(N), ny = new Float32Array(N);
    const ang = new Float32Array(N), curv = new Float32Array(N), vt = new Float32Array(N);
    for (let i = 0; i < N; i++) { px[i] = pts[i].x; py[i] = pts[i].y; }
    for (let i = 0; i < N; i++) {
      const a = (i - 1 + N) % N, b = (i + 1) % N;
      ang[i] = Math.atan2(py[b] - py[a], px[b] - px[a]);
      nx[i] = -Math.sin(ang[i]); ny[i] = Math.cos(ang[i]);
    }
    const K = 4;
    for (let i = 0; i < N; i++) {
      curv[i] = Math.abs(wrapAngle(ang[(i + K) % N] - ang[(i - K + N) % N])) / (2 * K * SP);
    }
    // cornering speed table
    const s = STEER_RATE;
    for (let i = 0; i < N; i++) {
      const R = 1 / Math.max(curv[i], 1e-5);
      vt[i] = Math.min(VREF * 1.3, 0.86 * (s * R) / (1 + 0.38 * s * R / VREF));
    }
    for (let pass = 0; pass < 3; pass++) {
      for (let j = N - 1; j >= 0; j--) {
        const nxt = vt[(j + 1) % N];
        vt[j] = Math.min(vt[j], Math.sqrt(nxt * nxt + 2 * 900 * SP));
      }
    }
    // bounds
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (let i = 0; i < N; i++) {
      minX = Math.min(minX, px[i]); maxX = Math.max(maxX, px[i]);
      minY = Math.min(minY, py[i]); maxY = Math.max(maxY, py[i]);
    }
    const track = { def, index, theme: THEMES[def.theme], N, px, py, nx, ny, ang, curv, vt,
      minX, minY, maxX, maxY };
    track.path = polyPath(track, 0, 0, N, true);
    track.edgeL = polyPath(track, -(TRACK_W / 2 - 5), 0, N, true);
    track.edgeR = polyPath(track, TRACK_W / 2 - 5, 0, N, true);
    // kerbs on corners
    track.kerbs = new Path2D();
    let i = 0;
    while (i < N) {
      if (curv[i] > 0.0016) {
        let j = i;
        while (j < N && curv[j] > 0.0016) j++;
        const from = Math.max(0, i - 3), to = Math.min(N, j + 3);
        if (to - from > 4) {
          track.kerbs.addPath(polyPath(track, -(TRACK_W / 2 + 2), from, to, false));
          track.kerbs.addPath(polyPath(track, TRACK_W / 2 + 2, from, to, false));
        }
        i = j;
      } else i++;
    }
    track.deco = makeDeco(track);
    track.minimap = null;
    return track;
  }

  function polyPath(t, off, from, to, closed) {
    const p = new Path2D();
    for (let i = from; i < to; i++) {
      const x = t.px[i] + t.nx[i] * off, y = t.py[i] + t.ny[i] * off;
      if (i === from) p.moveTo(x, y); else p.lineTo(x, y);
    }
    if (closed) p.closePath();
    return p;
  }

  function distToTrack(t, x, y) {
    let bd = Infinity;
    for (let i = 0; i < t.N; i += 2) {
      const dx = t.px[i] - x, dy = t.py[i] - y, d = dx * dx + dy * dy;
      if (d < bd) bd = d;
    }
    return Math.sqrt(bd);
  }

  function makeDeco(t) {
    const r = rng(1234 + t.index * 99);
    const items = [];
    const pad = 500;
    const area = (t.maxX - t.minX + pad * 2) * (t.maxY - t.minY + pad * 2);
    const count = Math.floor(area / 26000);
    for (let k = 0; k < count; k++) {
      const x = t.minX - pad + r() * (t.maxX - t.minX + pad * 2);
      const y = t.minY - pad + r() * (t.maxY - t.minY + pad * 2);
      const d = distToTrack(t, x, y);
      if (d > TRACK_W / 2 + 70) items.push({ x, y, s: 0.7 + r() * 0.7, v: r() });
    }
    // grandstands along the start straight (outside, left side of travel)
    const stands = [];
    for (let k = 0; k < 3; k++) {
      const i = (t.N - 30 + k * 32) % t.N;
      const side = -1;
      const off = TRACK_W / 2 + 85;
      stands.push({ x: t.px[i] + t.nx[i] * off * side, y: t.py[i] + t.ny[i] * off * side, a: t.ang[i], seed: k });
    }
    // remove deco overlapping grandstands
    const filtered = items.filter((it) => stands.every((s) => Math.hypot(it.x - s.x, it.y - s.y) > 150));
    // night lamps along the edge
    const lamps = [];
    if (t.def.theme === 'night') {
      for (let i = 0; i < t.N; i += 22) {
        const side = (Math.floor(i / 22) % 2) ? 1 : -1;
        const off = (TRACK_W / 2 + 40) * side;
        lamps.push({ x: t.px[i] + t.nx[i] * off, y: t.py[i] + t.ny[i] * off });
      }
    }
    return { items: filtered, stands, lamps };
  }

  function nearest(t, x, y, hint, win) {
    let bi = hint, bd = Infinity;
    const N = t.N;
    if (hint < 0) { hint = 0; win = N; }
    for (let o = -win; o <= win; o++) {
      const i = ((hint + o) % N + N) % N;
      const dx = t.px[i] - x, dy = t.py[i] - y, d = dx * dx + dy * dy;
      if (d < bd) { bd = d; bi = i; }
    }
    // signed lateral distance from the centre line
    const lat = (x - t.px[bi]) * t.nx[bi] + (y - t.py[bi]) * t.ny[bi];
    return { i: bi, d: Math.sqrt(bd), lat };
  }

  // ---------------------------------------------------------------- cars
  function makeCar(o) {
    return Object.assign({
      x: 0, y: 0, a: 0, vx: 0, vy: 0, speed: 0, steer: 0, slip: 0,
      maxSpd: VREF, accel: 520, grip: 8, brake: 1300, steerRate: STEER_RATE, corner: 1,
      idx: 0, lat: 0, dist: 0, lap: 0, finished: false, finishTime: 0, lapStart: 0, bestLap: Infinity, lastLap: 0,
      lane: 0, laneTarget: 0, laneT: 0, offTime: 0, stuckTime: 0, wrongTime: 0, flash: 0,
      input: { gas: 0, brake: 0, steer: 0 }, isPlayer: false, name: '', liv: LIVERIES[0],
    }, o);
  }

  function playerStats(car) {
    const u = save.up;
    car.maxSpd = 840 * (1 + 0.05 * u.engine);
    car.accel = 500 * (1 + 0.08 * u.engine);
    car.grip = 7.5 + 0.9 * u.tyres;
    car.steerRate = STEER_RATE * (1 + 0.03 * u.tyres);
    car.brake = 1250 * (1 + 0.12 * u.brakes);
  }

  function updateCar(c, dt, t) {
    const near = nearest(t, c.x, c.y, c.idx, 40);
    const prevIdx = c.idx;
    c.idx = near.i; c.dist = near.d; c.lat = near.lat;
    const off = near.d > TRACK_W / 2 + 6;
    c.off = off;
    const inp = c.input;
    const maxSpd = c.maxSpd * (off ? 0.45 : 1);

    // steering (smoothed) – rotate heading first, velocity lags => natural slide
    c.steer += (inp.steer - c.steer) * Math.min(1, dt * 12);
    let fwd = c.vx * Math.cos(c.a) + c.vy * Math.sin(c.a);
    const sp = Math.abs(fwd);
    const steerScale = Math.min(1, sp / 180) * (1 - 0.38 * Math.min(1, sp / VREF));
    c.a += c.steer * c.steerRate * steerScale * (fwd < -5 ? -1 : 1) * dt;

    const cos = Math.cos(c.a), sin = Math.sin(c.a);
    fwd = c.vx * cos + c.vy * sin;
    let lat = -c.vx * sin + c.vy * cos;

    if (inp.gas > 0 && fwd < maxSpd) fwd += c.accel * inp.gas * dt * (1 - Math.max(0, fwd) / maxSpd * 0.55);
    if (inp.brake > 0) {
      if (fwd > 0) fwd = Math.max(0, fwd - c.brake * inp.brake * dt);
      else fwd = Math.max(-180, fwd - 380 * inp.brake * dt);
    }
    if (!inp.gas && !inp.brake) fwd -= Math.sign(fwd) * Math.min(Math.abs(fwd), 110 * dt);
    fwd -= fwd * (off ? 1.6 : 0.12) * dt;
    if (fwd > maxSpd) fwd += (maxSpd - fwd) * Math.min(1, dt * 2.5);

    lat *= Math.exp(-c.grip * (off ? 0.55 : 1) * dt);
    c.slip = Math.abs(lat);
    c.vx = cos * fwd - sin * lat;
    c.vy = sin * fwd + cos * lat;
    c.x += c.vx * dt; c.y += c.vy * dt;
    c.speed = fwd;

    // lap counting
    const N = t.N;
    if (prevIdx > N * 0.7 && c.idx < N * 0.3) {
      c.lap++;
      if (c.lap >= 1 && c.lap <= LAPS && race) {
        const lt = race.time - c.lapStart;
        c.lastLap = lt; c.bestLap = Math.min(c.bestLap, lt); c.lapStart = race.time;
        if (c.isPlayer && c.lap < LAPS) { toast(c.lap === LAPS - 1 ? 'FINAL LAP' : 'LAP ' + (c.lap + 1)); Sound.beep(660, 0.15); }
      }
      if (c.lap >= LAPS && !c.finished && race) { c.finished = true; c.finishTime = race.time; }
    } else if (prevIdx < N * 0.3 && c.idx > N * 0.7) c.lap--;

    // wrong way / stuck handling
    const tang = c.vx * Math.cos(t.ang[c.idx]) + c.vy * Math.sin(t.ang[c.idx]);
    c.wrongTime = (tang < -60) ? c.wrongTime + dt : 0;
    c.stuckTime = (near.d > TRACK_W * 1.2 || (off && sp < 40)) ? c.stuckTime + dt : 0;
    if (c.stuckTime > 2.5 || (!c.isPlayer && c.wrongTime > 1.5)) resetCar(c, t);
  }

  function resetCar(c, t) {
    const i = (c.idx + 2) % t.N;
    c.x = t.px[i]; c.y = t.py[i]; c.a = t.ang[i]; c.vx = c.vy = 0; c.speed = 0;
    c.stuckTime = 0; c.wrongTime = 0; c.flash = 1.5;
  }

  function progress(c, t) { return c.lap * t.N + c.idx; }

  function aiControl(c, t, dt) {
    const N = t.N;
    const spd = Math.max(0, c.speed);
    c.laneT -= dt;
    if (c.laneT <= 0) { c.laneTarget = (Math.random() * 2 - 1) * TRACK_W * 0.22; c.laneT = 2 + Math.random() * 3; }
    // overtaking: if someone is close ahead, move to the other side
    for (const o of race.cars) {
      if (o === c) continue;
      const dx = o.x - c.x, dy = o.y - c.y;
      const ahead = dx * Math.cos(c.a) + dy * Math.sin(c.a);
      const side = -dx * Math.sin(c.a) + dy * Math.cos(c.a);
      if (ahead > 0 && ahead < 110 && Math.abs(side) < 34 && o.speed < c.speed + 30) {
        c.laneTarget = clamp(o.lat + (o.lat > 0 ? -1 : 1) * 46, -TRACK_W * 0.36, TRACK_W * 0.36);
        c.laneT = 1.2;
      }
    }
    c.lane += (c.laneTarget - c.lane) * Math.min(1, dt * 1.5);
    const look = Math.floor(9 + spd * 0.032);
    const ti = (c.idx + look) % N;
    const lane = c.lane * clamp(1 - t.curv[ti] * 250, 0.2, 1);
    const tx = t.px[ti] + t.nx[ti] * lane, ty = t.py[ti] + t.ny[ti] * lane;
    const diff = wrapAngle(Math.atan2(ty - c.y, tx - c.x) - c.a);
    c.input.steer = clamp(diff * 2.4, -1, 1);
    // speed: look a little ahead in the speed table
    let target = Infinity;
    const ahead = Math.floor(3 + spd * 0.012);
    for (let k = 0; k <= ahead; k += 2) target = Math.min(target, t.vt[(c.idx + k) % N]);
    target *= c.corner;
    if (Math.abs(diff) > 0.6) target = Math.min(target, 260);
    if (spd < target - 8) { c.input.gas = 1; c.input.brake = 0; }
    else if (spd > target + 35) { c.input.gas = 0; c.input.brake = 1; }
    else { c.input.gas = 0.35; c.input.brake = 0; }
  }

  function collide(cars) {
    for (let i = 0; i < cars.length; i++) {
      for (let j = i + 1; j < cars.length; j++) {
        const a = cars[i], b = cars[j];
        const dx = b.x - a.x, dy = b.y - a.y, d2 = dx * dx + dy * dy, min = CAR_R * 2;
        if (d2 < min * min && d2 > 0.0001) {
          const d = Math.sqrt(d2), nx = dx / d, ny = dy / d, push = (min - d) / 2;
          a.x -= nx * push; a.y -= ny * push; b.x += nx * push; b.y += ny * push;
          const rv = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
          if (rv < 0) {
            const imp = -rv * 0.6;
            a.vx -= nx * imp; a.vy -= ny * imp; b.vx += nx * imp; b.vy += ny * imp;
            if ((a.isPlayer || b.isPlayer) && imp > 60) Sound.thump();
          }
        }
      }
    }
  }

  // ---------------------------------------------------------------- input
  const keys = {};
  const touch = { left: false, right: false, brake: false };
  let isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0 && matchMedia('(pointer: coarse)').matches);
  const GAME_KEYS = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'Space'];
  window.addEventListener('keydown', (e) => {
    if (GAME_KEYS.includes(e.key) || GAME_KEYS.includes(e.code)) e.preventDefault();
    keys[e.code] = true;
    Sound.ensure();
    if (e.code === 'Escape' || e.code === 'KeyP') { if (state === 'race' || state === 'countdown') pauseGame(); else if (state === 'paused') resumeGame(); }
    if (e.code === 'KeyR' && state === 'race' && race.player && !race.player.finished) resetCar(race.player, race.track);
    if (e.code === 'KeyM') toggleMute();
  });
  window.addEventListener('keyup', (e) => { keys[e.code] = false; });
  window.addEventListener('blur', () => { for (const k in keys) keys[k] = false; });
  window.addEventListener('wheel', (e) => e.preventDefault(), { passive: false });
  window.addEventListener('contextmenu', (e) => e.preventDefault());
  document.addEventListener('visibilitychange', () => { if (document.hidden && (state === 'race' || state === 'countdown')) pauseGame(); });
  window.addEventListener('pointerdown', () => Sound.ensure());
  window.addEventListener('touchstart', () => { Sound.ensure(); if (!isTouch) { isTouch = true; updateTouchUI(); } }, { passive: true });

  function bindTouch(id, prop) {
    const el = $(id);
    const on = (e) => { e.preventDefault(); touch[prop] = true; el.classList.add('on'); };
    const off = (e) => { e.preventDefault(); touch[prop] = false; el.classList.remove('on'); };
    el.addEventListener('pointerdown', on);
    el.addEventListener('pointerup', off);
    el.addEventListener('pointercancel', off);
    el.addEventListener('pointerleave', off);
  }
  bindTouch('tLeft', 'left'); bindTouch('tRight', 'right'); bindTouch('tBrake', 'brake');

  function readPlayerInput(c) {
    const left = keys.ArrowLeft || keys.KeyA || touch.left;
    const right = keys.ArrowRight || keys.KeyD || touch.right;
    const kGas = keys.ArrowUp || keys.KeyW;
    const kBrake = keys.ArrowDown || keys.KeyS || keys.Space || touch.brake;
    c.input.steer = (right ? 1 : 0) - (left ? 1 : 0);
    // on touch devices the car accelerates automatically
    c.input.gas = (kGas || (isTouch && !kBrake)) ? 1 : 0;
    c.input.brake = kBrake ? 1 : 0;
  }

  // ---------------------------------------------------------------- race state
  let state = 'loading';
  let race = null;
  let currentTrack = 0;
  const trackCache = {};
  function getTrack(i) { return trackCache[i] || (trackCache[i] = buildTrack(TRACKS[i], i)); }

  function startRace(ti) {
    currentTrack = ti;
    const t = getTrack(ti);
    const cars = [];
    const def = TRACKS[ti];
    const aiLiv = LIVERIES.map((l, i) => i).filter((i) => i !== save.livery);
    const nCars = 6;
    for (let k = 0; k < nCars; k++) {
      const isPlayer = k === nCars - 1;   // player starts at the back of the grid
      const row = Math.floor(k / 2), col = k % 2;
      const back = 40 + row * 70 + col * 30;
      const i = ((t.N - Math.round(back / SP)) % t.N + t.N) % t.N;
      const side = col === 0 ? -1 : 1;
      const off = side * TRACK_W * 0.22;
      const c = makeCar({
        x: t.px[i] + t.nx[i] * off, y: t.py[i] + t.ny[i] * off, a: t.ang[i], idx: i, lap: 0,
        isPlayer, name: isPlayer ? 'YOU' : AI_NAMES[(k + ti * 3) % AI_NAMES.length],
        liv: isPlayer ? LIVERIES[save.livery] : LIVERIES[aiLiv[k % aiLiv.length]], lane: off, laneTarget: off,
      });
      if (c.idx > t.N / 2) c.lap = -1;
      if (isPlayer) playerStats(c);
      else {
        const skill = def.ai * (0.95 + (k / (nCars - 1)) * 0.06) * (0.99 + Math.random() * 0.02);
        c.skill = skill;
        c.maxSpd = VREF * skill;
        c.accel = 500 * skill;
        c.corner = 0.60 + 0.38 * skill;
        c.grip = 8;
      }
      cars.push(c);
    }
    const player = cars[cars.length - 1];
    race = { track: t, cars, player, time: 0, countdown: 3.4, lights: 0, finished: false, resultsShown: false,
      cam: { x: player.x, y: player.y, z: 1 }, particles: [], hintTime: 8, coins: 0 };
    state = 'countdown';
    showScreen(null);
    $('topBtns').classList.remove('hidden');
    updateTouchUI();
    CG.gameplayStart();
  }

  function pauseGame() {
    if (!race) return;
    race.prevState = state;
    state = 'paused';
    Sound.engine(0, 1, false);
    CG.gameplayStop();
    showScreen('pause');
    updateTouchUI();
  }
  function resumeGame() {
    if (!race) return;
    state = race.prevState || 'race';
    showScreen(null);
    updateTouchUI();
    CG.gameplayStart();
  }
  function toMenu() {
    state = 'menu';
    race = null;
    Sound.engine(0, 1, false);
    CG.gameplayStop();
    $('topBtns').classList.add('hidden');
    updateTouchUI();
    showMenu();
  }

  function finishRace() {
    const r = race, t = r.track, p = r.player;
    r.finished = true;
    CG.gameplayStop();
    // order: finished cars by time, then the rest by progress
    const order = r.cars.slice().sort((a, b) => {
      if (a.finished && b.finished) return a.finishTime - b.finishTime;
      if (a.finished) return -1;
      if (b.finished) return 1;
      return progress(b, t) - progress(a, t);
    });
    const pos = order.indexOf(p) + 1;
    const avg = p.finishTime / (LAPS * t.N);
    for (const c of order) {
      if (!c.finished) c.estTime = p.finishTime + (LAPS * t.N - progress(c, t)) * avg * 1.02;
    }
    const coins = Math.round(PRIZE[pos - 1] * TRACKS[r.track.index].reward);
    r.coins = coins; r.pos = pos;
    save.coins += coins;
    save.races++;
    const b = save.best[t.index];
    if (!b || pos < b.pos || (pos === b.pos && p.finishTime < b.time)) save.best[t.index] = { pos, time: p.finishTime };
    let unlockedNew = false;
    if (pos <= 3 && t.index + 1 < TRACKS.length && save.unlocked <= t.index + 1) { save.unlocked = t.index + 2; unlockedNew = true; }
    writeSave();
    if (pos <= 3) CG.happytime();
    Sound.fanfare(pos <= 3);

    $('resPos').textContent = ordinal(pos);
    $('resPos').style.color = pos === 1 ? '#ffd400' : pos <= 3 ? '#fff' : '#bbb';
    $('resMsg').textContent = pos === 1 ? 'Victory! ' + (unlockedNew ? 'New circuit unlocked!' : '')
      : pos <= 3 ? 'Podium! ' + (unlockedNew ? 'New circuit unlocked!' : '')
      : 'Finish top 3 to unlock the next circuit. Upgrade your car in the Garage!';
    $('resTable').innerHTML = order.map((c, i) =>
      `<tr class="${c.isPlayer ? 'me' : ''}"><td>${i + 1}</td><td><span style="color:${c.liv.body}">■</span> ${c.name}</td><td>${fmtTime(c.finished ? c.finishTime : c.estTime)}</td></tr>`
    ).join('') + `<tr><td></td><td>Best lap</td><td>${fmtTime(p.bestLap)}</td></tr>`;
    $('resCoins').textContent = '+' + coins;
    const dbl = $('btnDouble');
    dbl.disabled = false; dbl.classList.toggle('hidden', !CG.sdk);
    const next = t.index + 1 < TRACKS.length && save.unlocked > t.index + 1;
    $('btnNext').classList.toggle('hidden', !next);
    setTimeout(() => { if (race === r) { state = 'results'; showScreen('results'); updateTouchUI(); } }, 1600);
  }

  async function afterRace(action) {
    // midgame ad between races (SDK handles frequency capping)
    if (CG.sdk) await CG.ad('midgame');
    if (action === 'next') startRace(currentTrack + 1);
    else if (action === 'retry') startRace(currentTrack);
    else toMenu();
  }

  // ---------------------------------------------------------------- simulation step
  function step(dt) {
    const r = race; if (!r) return;
    const t = r.track;
    if (state === 'countdown') {
      r.countdown -= dt;
      const lights = clamp(Math.floor((3.4 - r.countdown) / 0.55) + 1, 0, 5);
      if (lights !== r.lights && lights > 0 && r.countdown > 0.6) { r.lights = lights; Sound.beep(440, 0.12, 'square', 0.12); }
      if (r.countdown <= 0) { state = 'race'; r.lights = 0; Sound.beep(880, 0.4, 'square', 0.16); toast('GO!'); }
      for (const c of r.cars) { c.input.gas = 0; c.input.brake = 1; }
      return;
    }
    if (state !== 'race' && state !== 'results') return;
    r.time += dt;
    r.hintTime -= dt;
    for (const c of r.cars) {
      if (c.isPlayer && !AUTOPILOT && !c.finished) readPlayerInput(c);
      else aiControl(c, t, dt);
    }
    // gentle rubber-banding keeps races close
    const pp = progress(r.player, t);
    for (const c of r.cars) {
      if (c.isPlayer) continue;
      const gap = progress(c, t) - pp;
      c.band = clamp(1 - gap / 4000, 0.95, 1.04);
      const ms = VREF * c.skill * c.band;
      c.maxSpd = ms;
    }
    for (const c of r.cars) updateCar(c, dt, t);
    collide(r.cars);
    if (r.player.finished && !r.finished) finishRace();
    // particles
    for (const c of r.cars) {
      if (c.flash > 0) c.flash -= dt;
      const smoke = c.slip > 110 || (c.input.brake && c.speed > 300);
      const dust = c.off && Math.abs(c.speed) > 80;
      if ((smoke || dust) && Math.random() < 0.5 && r.particles.length < 220) {
        r.particles.push({ x: c.x - Math.cos(c.a) * 18 + (Math.random() - 0.5) * 12, y: c.y - Math.sin(c.a) * 18 + (Math.random() - 0.5) * 12,
          vx: (Math.random() - 0.5) * 30, vy: (Math.random() - 0.5) * 30, life: 0.7, max: 0.7, dust });
      }
    }
    for (let i = r.particles.length - 1; i >= 0; i--) {
      const p = r.particles[i];
      p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.life <= 0) r.particles.splice(i, 1);
    }
  }

  // ---------------------------------------------------------------- rendering
  const canvas = $('game');
  const ctx = canvas.getContext('2d');
  let W = 0, H = 0, DPR = 1;
  function resize() {
    DPR = Math.min(2, window.devicePixelRatio || 1);
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = Math.round(W * DPR); canvas.height = Math.round(H * DPR);
  }
  window.addEventListener('resize', resize);
  resize();

  const patterns = {};
  function groundPattern(theme) {
    if (patterns[theme.ground]) return patterns[theme.ground];
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const g = c.getContext('2d'), r = rng(7);
    g.fillStyle = theme.ground; g.fillRect(0, 0, 128, 128);
    g.fillStyle = theme.ground2; g.fillRect(0, 0, 128, 64);
    for (let i = 0; i < 260; i++) {
      g.fillStyle = r() < 0.5 ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)';
      g.fillRect(r() * 128, r() * 128, 2 + r() * 3, 2 + r() * 3);
    }
    return (patterns[theme.ground] = ctx.createPattern(c, 'repeat'));
  }

  function drawTrack(g, t, view) {
    const th = t.theme;
    g.lineJoin = 'round'; g.lineCap = 'round';
    g.strokeStyle = th.runoff; g.lineWidth = TRACK_W + 60; g.stroke(t.path);
    g.strokeStyle = th.asphalt; g.lineWidth = TRACK_W; g.stroke(t.path);
    g.strokeStyle = 'rgba(255,255,255,0.85)'; g.lineWidth = 3; g.stroke(t.edgeL); g.stroke(t.edgeR);
    g.lineCap = 'butt';
    g.strokeStyle = '#d61c1c'; g.lineWidth = 12; g.stroke(t.kerbs);
    g.setLineDash([16, 16]); g.strokeStyle = '#ffffff'; g.stroke(t.kerbs); g.setLineDash([]);
    // start / finish line
    const i = 0, sq = 10, cols = Math.floor(TRACK_W / sq);
    g.save(); g.translate(t.px[i], t.py[i]); g.rotate(t.ang[i]);
    for (let r = 0; r < 2; r++) for (let k = 0; k < cols; k++) {
      g.fillStyle = (r + k) % 2 ? '#111' : '#fff';
      g.fillRect(-sq + r * sq, -TRACK_W / 2 + k * sq, sq, sq);
    }
    g.restore();
    // grid boxes
    g.strokeStyle = 'rgba(255,255,255,0.7)'; g.lineWidth = 3;
    for (let k = 0; k < 6; k++) {
      const row = Math.floor(k / 2), col = k % 2, back = 40 + row * 70 + col * 30;
      const j = ((t.N - Math.round(back / SP)) % t.N + t.N) % t.N, off = (col === 0 ? -1 : 1) * TRACK_W * 0.22;
      g.save(); g.translate(t.px[j] + t.nx[j] * off, t.py[j] + t.ny[j] * off); g.rotate(t.ang[j]);
      g.beginPath(); g.moveTo(26, -14); g.lineTo(30, -14); g.lineTo(30, 14); g.lineTo(26, 14); g.stroke();
      g.restore();
    }
  }

  function inView(view, x, y, m) { return x > view.x0 - m && x < view.x1 + m && y > view.y0 - m && y < view.y1 + m; }

  function drawStands(g, t, view) {
    for (const s of t.deco.stands) {
      if (!inView(view, s.x, s.y, 200)) continue;
      g.save(); g.translate(s.x, s.y); g.rotate(s.a);
      g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(-118, -26, 240, 60);
      g.fillStyle = '#5b6170'; g.fillRect(-120, -30, 240, 56);
      const r = rng(s.seed + 3);
      const cols = ['#ff3b3b', '#ffd400', '#2fd0ff', '#ffffff', '#ff8000', '#7cff6b', '#ff63c8'];
      for (let y = -24; y < 20; y += 8) for (let x = -114; x < 114; x += 7) {
        g.fillStyle = cols[Math.floor(r() * cols.length)]; g.fillRect(x, y, 4, 4);
      }
      g.fillStyle = '#e10600'; g.fillRect(-120, 26, 240, 6);
      g.restore();
    }
  }

  function drawDeco(g, t, view) {
    const th = t.theme;
    for (const it of t.deco.items) {
      if (!inView(view, it.x, it.y, 60)) continue;
      const s = it.s;
      if (th.deco === 'tree' || th.deco === 'lamp') {
        g.fillStyle = 'rgba(0,0,0,0.22)'; g.beginPath(); g.arc(it.x + 8 * s, it.y + 8 * s, 26 * s, 0, 7); g.fill();
        g.fillStyle = th.c1; g.beginPath(); g.arc(it.x, it.y, 26 * s, 0, 7); g.fill();
        g.fillStyle = th.c2; g.beginPath(); g.arc(it.x - 6 * s, it.y - 6 * s, 16 * s, 0, 7); g.fill();
      } else if (th.deco === 'pine') {
        g.fillStyle = 'rgba(0,0,0,0.15)'; g.beginPath(); g.arc(it.x + 8 * s, it.y + 8 * s, 22 * s, 0, 7); g.fill();
        for (let k = 0; k < 3; k++) {
          const rr = (24 - k * 7) * s;
          g.fillStyle = k % 2 ? th.c2 : th.c1;
          g.beginPath();
          for (let a = 0; a < 8; a++) {
            const ang = a / 8 * Math.PI * 2 + it.v, rad = a % 2 ? rr * 0.6 : rr;
            g.lineTo(it.x + Math.cos(ang) * rad, it.y + Math.sin(ang) * rad);
          }
          g.fill();
        }
        g.fillStyle = '#fff'; g.beginPath(); g.arc(it.x - 2 * s, it.y - 2 * s, 4 * s, 0, 7); g.fill();
      } else if (th.deco === 'cactus') {
        if (it.v < 0.5) {
          g.fillStyle = 'rgba(0,0,0,0.18)'; g.beginPath(); g.ellipse(it.x + 6, it.y + 6, 16 * s, 12 * s, 0.4, 0, 7); g.fill();
          g.fillStyle = '#9c8a6a'; g.beginPath(); g.ellipse(it.x, it.y, 16 * s, 12 * s, 0.4, 0, 7); g.fill();
          g.fillStyle = '#b6a483'; g.beginPath(); g.ellipse(it.x - 3, it.y - 3, 9 * s, 6 * s, 0.4, 0, 7); g.fill();
        } else {
          g.fillStyle = th.c1; g.beginPath(); g.arc(it.x, it.y, 12 * s, 0, 7); g.fill();
          g.fillStyle = th.c2;
          for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 + it.v * 3; g.beginPath(); g.arc(it.x + Math.cos(a) * 11 * s, it.y + Math.sin(a) * 11 * s, 6 * s, 0, 7); g.fill(); }
        }
      }
    }
  }

  function drawLamps(g, t, view) {
    g.save(); g.globalCompositeOperation = 'lighter';
    for (const l of t.deco.lamps) {
      if (!inView(view, l.x, l.y, 160)) continue;
      const gr = g.createRadialGradient(l.x, l.y, 0, l.x, l.y, 150);
      gr.addColorStop(0, 'rgba(255,220,150,0.28)'); gr.addColorStop(1, 'rgba(255,220,150,0)');
      g.fillStyle = gr; g.beginPath(); g.arc(l.x, l.y, 150, 0, 7); g.fill();
    }
    g.restore();
    for (const l of t.deco.lamps) {
      if (!inView(view, l.x, l.y, 20)) continue;
      g.fillStyle = '#fff6cf'; g.beginPath(); g.arc(l.x, l.y, 5, 0, 7); g.fill();
    }
  }

  function drawCar(g, c, night) {
    g.save(); g.translate(c.x, c.y); g.rotate(c.a);
    if (c.flash > 0 && Math.floor(c.flash * 8) % 2) g.globalAlpha = 0.45;
    if (night) {
      g.save(); g.globalCompositeOperation = 'lighter';
      const gr = g.createLinearGradient(20, 0, 170, 0);
      gr.addColorStop(0, 'rgba(255,250,210,0.35)'); gr.addColorStop(1, 'rgba(255,250,210,0)');
      g.fillStyle = gr; g.beginPath(); g.moveTo(22, -6); g.lineTo(170, -50); g.lineTo(170, 50); g.lineTo(22, 6); g.fill();
      g.restore();
    }
    // shadow
    g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(-22, -11, 48, 26);
    const L = c.liv;
    // tyres
    g.fillStyle = '#111';
    g.fillRect(-20, -14, 13, 7); g.fillRect(-20, 7, 13, 7);
    g.save(); g.translate(14, -11.5); g.rotate(c.steer * 0.35); g.fillRect(-5, -3, 10, 6); g.restore();
    g.save(); g.translate(14, 11.5); g.rotate(c.steer * 0.35); g.fillRect(-5, -3, 10, 6); g.restore();
    // rear wing
    g.fillStyle = '#1a1a1a'; g.fillRect(-25, -11, 5, 22);
    g.fillStyle = L.accent; g.fillRect(-25, -11, 5, 3); g.fillRect(-25, 8, 5, 3);
    // body
    g.fillStyle = L.body;
    g.beginPath();
    g.moveTo(26, 0); g.lineTo(20, -3); g.lineTo(6, -4); g.lineTo(0, -9); g.lineTo(-14, -9); g.lineTo(-20, -4);
    g.lineTo(-20, 4); g.lineTo(-14, 9); g.lineTo(0, 9); g.lineTo(6, 4); g.lineTo(20, 3); g.closePath(); g.fill();
    // stripe
    g.fillStyle = L.accent; g.fillRect(-14, -1.5, 36, 3);
    // front wing
    g.fillStyle = L.body; g.fillRect(21, -13, 5, 26);
    g.fillStyle = L.accent; g.fillRect(24, -13, 2, 26);
    // cockpit + helmet
    g.fillStyle = '#111'; g.beginPath(); g.ellipse(-3, 0, 6, 4.5, 0, 0, 7); g.fill();
    g.fillStyle = L.helmet; g.beginPath(); g.arc(-3, 0, 3.6, 0, 7); g.fill();
    g.restore();
  }

  function render() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const t = race ? race.track : getTrack(menuTrack);
    const th = t.theme;
    ctx.fillStyle = th.ground; ctx.fillRect(0, 0, canvas.width, canvas.height);

    // camera
    let cam;
    if (race && state === 'cover') {
      cam = race.cam;
    } else if (race) {
      cam = race.cam;
      const p = race.player;
      const sp = Math.max(0, p.speed);
      const baseZ = clamp(Math.min(W, H) / 640, 0.5, 1.5);
      const tz = baseZ * (1 - 0.2 * Math.min(1, sp / VREF));
      cam.z += (tz - cam.z) * 0.05;
      const tx = p.x + p.vx * 0.35, ty = p.y + p.vy * 0.35;
      cam.x += (tx - cam.x) * 0.12; cam.y += (ty - cam.y) * 0.12;
    } else {
      // menu: slow orbit along the track
      menuT += 1 / 60;
      const i = Math.floor(menuT * 30) % t.N;
      cam = { x: t.px[i], y: t.py[i], z: clamp(Math.min(W, H) / 700, 0.45, 1.2) };
      menuCam = cam;
    }
    const z = cam.z * DPR;
    ctx.setTransform(z, 0, 0, z, canvas.width / 2 - cam.x * z, canvas.height / 2 - cam.y * z);
    const view = { x0: cam.x - W / 2 / cam.z, x1: cam.x + W / 2 / cam.z, y0: cam.y - H / 2 / cam.z, y1: cam.y + H / 2 / cam.z };
    ctx.fillStyle = groundPattern(th);
    ctx.fillRect(view.x0, view.y0, view.x1 - view.x0, view.y1 - view.y0);
    drawTrack(ctx, t, view);
    drawStands(ctx, t, view);
    if (race) {
      for (const p of race.particles) {
        const a = p.life / p.max;
        ctx.fillStyle = p.dust ? `rgba(120,95,60,${0.35 * a})` : `rgba(220,220,220,${0.4 * a})`;
        ctx.beginPath(); ctx.arc(p.x, p.y, 6 + (1 - a) * 12, 0, 7); ctx.fill();
      }
      for (const c of race.cars) if (inView(view, c.x, c.y, 200)) drawCar(ctx, c, th.deco === 'lamp');
    } else if (menuCars) {
      for (const c of menuCars) drawCar(ctx, c, th.deco === 'lamp');
    }
    drawDeco(ctx, t, view);
    if (th.deco === 'lamp') drawLamps(ctx, t, view);

    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    if (race && !COVER) drawHUD(race);
  }

  function minimap(t) {
    if (t.minimap) return t.minimap;
    const size = 150, pad = 10;
    const c = document.createElement('canvas'); c.width = c.height = size * 2;
    const g = c.getContext('2d');
    const sc = (size - pad * 2) / Math.max(t.maxX - t.minX, t.maxY - t.minY);
    const ox = pad + ((size - pad * 2) - (t.maxX - t.minX) * sc) / 2, oy = pad + ((size - pad * 2) - (t.maxY - t.minY) * sc) / 2;
    g.scale(2, 2);
    g.fillStyle = 'rgba(10,12,20,0.55)'; g.beginPath(); g.roundRect ? g.roundRect(0, 0, size, size, 12) : g.rect(0, 0, size, size); g.fill();
    g.translate(ox - t.minX * sc, oy - t.minY * sc); g.scale(sc, sc);
    g.lineJoin = 'round'; g.strokeStyle = '#fff'; g.lineWidth = 7 / sc; g.stroke(t.path);
    g.strokeStyle = '#555'; g.lineWidth = 3.5 / sc; g.stroke(t.path);
    t.minimap = { canvas: c, size, sc, ox, oy };
    return t.minimap;
  }

  function drawHUD(r) {
    const t = r.track, p = r.player;
    const small = W < 700 || H < 500;
    ctx.textBaseline = 'top';
    // standings
    const order = r.cars.slice().sort((a, b) => {
      if (a.finished && b.finished) return a.finishTime - b.finishTime;
      return progress(b, t) - progress(a, t);
    });
    const pos = order.indexOf(p) + 1;
    ctx.fillStyle = 'rgba(10,12,20,0.6)';
    ctx.fillRect(10, 10, small ? 150 : 190, small ? 70 : 84);
    ctx.fillStyle = '#fff';
    ctx.font = `italic 900 ${small ? 34 : 42}px system-ui, Arial`;
    ctx.fillText(pos + '', 20, 16);
    const pw = ctx.measureText(pos + '').width;
    ctx.font = `italic 800 ${small ? 14 : 18}px system-ui, Arial`;
    ctx.fillText('/' + r.cars.length, 22 + pw, small ? 20 : 22);
    ctx.font = `800 ${small ? 13 : 15}px system-ui, Arial`;
    const lapShown = clamp(p.lap + 1, 1, LAPS);
    ctx.fillText('LAP ' + lapShown + '/' + LAPS, small ? 70 : 90, small ? 18 : 20);
    ctx.font = `600 ${small ? 12 : 14}px system-ui, Arial`;
    ctx.fillStyle = '#cfd3dc';
    ctx.fillText(fmtTime(r.time), small ? 70 : 90, small ? 38 : 44);
    if (p.bestLap < Infinity) ctx.fillText('Best ' + fmtTime(p.bestLap), 20, small ? 58 : 68);

    // timing tower (desktop only)
    if (!small) {
      let y = 104;
      for (let i = 0; i < order.length; i++) {
        const c = order[i];
        ctx.fillStyle = c.isPlayer ? 'rgba(225,6,0,0.85)' : 'rgba(10,12,20,0.6)';
        ctx.fillRect(10, y, 150, 22);
        ctx.fillStyle = c.liv.body; ctx.fillRect(10, y, 5, 22);
        ctx.fillStyle = '#fff'; ctx.font = '700 13px system-ui, Arial';
        ctx.fillText((i + 1) + '  ' + c.name, 22, y + 4);
        y += 24;
      }
    }

    // speed
    const kmh = Math.round(Math.max(0, p.speed) * 0.36);
    const sx = isTouch ? W / 2 : W - 20, sy = H - 20;
    ctx.textAlign = isTouch ? 'center' : 'right'; ctx.textBaseline = 'bottom';
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.font = `italic 900 ${small ? 38 : 54}px system-ui, Arial`;
    ctx.fillText(kmh, sx + 2, sy - 16);
    ctx.fillStyle = '#fff'; ctx.fillText(kmh, sx, sy - 18);
    ctx.font = '800 13px system-ui, Arial'; ctx.fillText('KM/H', sx, sy);
    ctx.textAlign = 'left'; ctx.textBaseline = 'top';

    // minimap
    const mm = minimap(t);
    const ms = small ? 110 : 150;
    const mx = W - ms - 10, my = 64;
    ctx.drawImage(mm.canvas, mx, my, ms, ms);
    const k = ms / mm.size;
    for (const c of r.cars) {
      const x = mx + (mm.ox + (c.x - t.minX) * mm.sc) * k, y = my + (mm.oy + (c.y - t.minY) * mm.sc) * k;
      ctx.fillStyle = c.isPlayer ? '#fff' : c.liv.body;
      ctx.beginPath(); ctx.arc(x, y, c.isPlayer ? 4.5 : 3.2, 0, 7); ctx.fill();
      if (c.isPlayer) { ctx.strokeStyle = '#e10600'; ctx.lineWidth = 2; ctx.stroke(); }
    }

    // start lights
    if (state === 'countdown') {
      const n = 5, rad = small ? 14 : 20, gap = rad * 2.6, w0 = gap * n;
      const x0 = W / 2 - w0 / 2, y0 = H * 0.16;
      ctx.fillStyle = 'rgba(10,12,20,0.85)'; ctx.fillRect(x0 - 8, y0 - rad - 10, w0 + 16, rad * 2 + 20);
      for (let i = 0; i < n; i++) {
        ctx.fillStyle = i < r.lights ? '#ff1a1a' : '#3a0d0d';
        ctx.beginPath(); ctx.arc(x0 + gap * (i + 0.5), y0, rad, 0, 7); ctx.fill();
      }
    }

    // controls hint for the first seconds
    if (r.hintTime > 0 && !p.finished) {
      const a = clamp(r.hintTime, 0, 1);
      ctx.globalAlpha = a;
      ctx.textAlign = 'center';
      const msg = isTouch ? 'Car accelerates by itself  •  ◀ ▶ steer  •  BRAKE before corners'
        : '↑ / W  Gas    ↓ / S  Brake    ← →  Steer';
      ctx.font = `800 ${small ? 14 : 18}px system-ui, Arial`;
      const tw = ctx.measureText(msg).width;
      const hy = H * (isTouch ? 0.26 : 0.78);
      ctx.fillStyle = 'rgba(10,12,20,0.75)'; ctx.fillRect(W / 2 - tw / 2 - 14, hy - 8, tw + 28, 36);
      ctx.fillStyle = '#fff'; ctx.fillText(msg, W / 2, hy);
      ctx.font = `600 ${small ? 12 : 14}px system-ui, Arial`;
      ctx.fillText('Finish in the top 3 after ' + LAPS + ' laps!', W / 2, hy + 34);
      ctx.globalAlpha = 1; ctx.textAlign = 'left';
    }

    if (p.wrongTime > 1 && state === 'race') {
      ctx.textAlign = 'center'; ctx.font = 'italic 900 40px system-ui, Arial';
      ctx.fillStyle = Math.floor(performance.now() / 300) % 2 ? '#ffd400' : '#ff2d2d';
      ctx.fillText('WRONG WAY', W / 2, H * 0.3);
      ctx.textAlign = 'left';
    } else if (p.off && p.stuckTime > 0.8 && state === 'race') {
      ctx.textAlign = 'center'; ctx.font = '800 16px system-ui, Arial'; ctx.fillStyle = '#fff';
      ctx.fillText('Returning to track…', W / 2, H * 0.3);
      ctx.textAlign = 'left';
    }
  }

  // ---------------------------------------------------------------- menus
  let menuTrack = 0, menuT = 0, menuCam = null, menuCars = null;
  const screens = ['menu', 'tracks', 'garage', 'pause', 'results'];
  function showScreen(id) {
    for (const s of screens) $(s).classList.toggle('hidden', s !== id);
  }
  function updateTouchUI() {
    $('touch').classList.toggle('hidden', !(isTouch && race && (state === 'race' || state === 'countdown')));
  }
  let toastTimer = 0;
  function toast(msg) {
    const el = $('toast');
    el.textContent = msg; el.classList.remove('hidden');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.add('hidden'), 1300);
  }

  function nextTrackToPlay() {
    // first unbeaten unlocked circuit, otherwise the last unlocked one
    for (let i = 0; i < save.unlocked; i++) { const b = save.best[i]; if (!b || b.pos > 3) return i; }
    return save.unlocked - 1;
  }

  function showMenu() {
    state = 'menu';
    menuTrack = nextTrackToPlay();
    menuCars = null;
    $('menuCoins').textContent = save.coins;
    $('menuHint').textContent = isTouch ? 'Tip: your car accelerates automatically – just steer and brake.'
      : 'Arrow keys or WASD to drive.  P = pause, R = reset car, M = mute.';
    showScreen('menu');
  }

  function buildTrackCards() {
    const wrap = $('trackCards');
    wrap.innerHTML = '';
    TRACKS.forEach((def, i) => {
      const t = getTrack(i);
      const locked = i >= save.unlocked;
      const card = document.createElement('div');
      card.className = 'card' + (locked ? ' locked' : '');
      const cv = document.createElement('canvas'); cv.width = 300; cv.height = 200;
      const g = cv.getContext('2d');
      g.fillStyle = t.theme.ground; g.fillRect(0, 0, 300, 200);
      const sc = Math.min(260 / (t.maxX - t.minX), 160 / (t.maxY - t.minY));
      g.translate(150 - (t.minX + t.maxX) / 2 * sc, 100 - (t.minY + t.maxY) / 2 * sc); g.scale(sc, sc);
      g.lineJoin = 'round'; g.strokeStyle = '#fff'; g.lineWidth = 12 / sc; g.stroke(t.path);
      g.strokeStyle = t.theme.asphalt; g.lineWidth = 7 / sc; g.stroke(t.path);
      const b = save.best[i];
      const medal = b ? (b.pos === 1 ? '🥇' : b.pos === 2 ? '🥈' : b.pos === 3 ? '🥉' : ordinal(b.pos)) : '';
      card.appendChild(cv);
      card.insertAdjacentHTML('beforeend', `<div class="name">${locked ? '🔒 ' : ''}${def.name} ${medal}</div>
        <div class="meta">${locked ? 'Top 3 on previous circuit' : (b ? 'Best: ' + fmtTime(b.time) : 'Not raced yet') + ' • ×' + def.reward + ' coins'}</div>`);
      if (!locked) card.addEventListener('click', () => startRace(i));
      wrap.appendChild(card);
    });
  }

  function buildGarage() {
    $('garageCoins').textContent = save.coins;
    const up = $('upgrades');
    up.innerHTML = '';
    for (const u of UPGRADES) {
      const lvl = save.up[u.key];
      const cost = lvl < UPG_MAX ? UPG_COST[lvl] : 0;
      const row = document.createElement('div'); row.className = 'upg';
      row.innerHTML = `<div><div class="lbl">${u.name}</div><div class="desc">${u.desc}</div>
        <div class="pips">${Array.from({ length: UPG_MAX }, (_, i) => `<div class="pip ${i < lvl ? 'on' : ''}"></div>`).join('')}</div></div>`;
      const b = document.createElement('button');
      b.className = 'btn';
      if (lvl >= UPG_MAX) { b.textContent = 'MAX'; b.disabled = true; }
      else { b.textContent = '● ' + cost; b.disabled = save.coins < cost; }
      b.addEventListener('click', () => {
        if (save.coins >= cost && save.up[u.key] < UPG_MAX) {
          save.coins -= cost; save.up[u.key]++; writeSave(); Sound.beep(880, 0.12, 'square', 0.12); buildGarage();
        }
      });
      row.appendChild(b); up.appendChild(row);
    }
    const sw = $('swatches');
    sw.innerHTML = '';
    LIVERIES.forEach((l, i) => {
      const d = document.createElement('div');
      d.className = 'sw' + (i === save.livery ? ' on' : '');
      d.style.background = `linear-gradient(135deg, ${l.body} 60%, ${l.accent} 60%)`;
      d.addEventListener('click', () => { save.livery = i; writeSave(); buildGarage(); });
      sw.appendChild(d);
    });
  }

  function toggleMute() { save.userMuted = !save.userMuted; writeSave(); Sound.ensure(); Sound.applyMute(); }

  function click(id, fn) { $(id).addEventListener('click', (e) => { Sound.ensure(); fn(e); }); }
  click('btnPlay', () => startRace(nextTrackToPlay()));
  click('btnTracks', () => { buildTrackCards(); showScreen('tracks'); });
  click('btnGarage', () => { buildGarage(); showScreen('garage'); });
  document.querySelectorAll('[data-back]').forEach((b) => b.addEventListener('click', showMenu));
  click('btnPause', () => { if (state === 'paused') resumeGame(); else if (state === 'race' || state === 'countdown') pauseGame(); });
  click('btnMute', toggleMute);
  click('btnResume', resumeGame);
  click('btnRestart', () => startRace(currentTrack));
  click('btnQuit', toMenu);
  click('btnNext', () => afterRace('next'));
  click('btnRetry', () => afterRace('retry'));
  click('btnMenu', () => afterRace('menu'));
  click('btnDouble', async () => {
    const b = $('btnDouble');
    if (b.disabled || !race) return;
    b.disabled = true;
    const ok = await CG.ad('rewarded');
    if (ok && race) {
      save.coins += race.coins; writeSave();
      $('resCoins').textContent = '+' + race.coins * 2;
      b.textContent = '✓ Coins doubled';
    } else { b.disabled = false; toast('Ad not available right now'); }
  });

  // ---------------------------------------------------------------- main loop
  let last = performance.now(), acc = 0;
  function frame(now) {
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    if (race && state !== 'paused') {
      acc += dt * TIME_SCALE;
      let n = 0;
      while (acc >= STEP && n < 60 * TIME_SCALE) { step(STEP); acc -= STEP; n++; }
      const p = race.player;
      Sound.engine(p.speed, p.maxSpd, state === 'race' || state === 'countdown' || state === 'results');
    } else acc = 0;
    render();
    requestAnimationFrame(frame);
  }

  // ---------------------------------------------------------------- boot
  async function boot() {
    await CG.init();
    CG.loadingStart();
    loadSave();
    Sound.applyMute();
    CG.onSettings(() => Sound.applyMute());
    getTrack(0);
    CG.loadingStop();
    if (COVER) { setupCover(); }
    else if (AUTOPILOT || params.has('race')) startRace(+params.get('race') || 0);
    else showMenu();
    requestAnimationFrame(frame);
  }

  // cover art helper: ?cover=1 renders a staged shot for store thumbnails
  function setupCover() {
    const ti = +params.get('track') || 0;
    startRace(ti);
    state = 'race';
    const t = race.track;
    const base = Math.floor(t.N * (+params.get('at') || 0.03));
    race.cars.forEach((c, k) => {
      const i = (base + (5 - k) * 7) % t.N, off = ((k % 3) - 1) * TRACK_W * 0.27;
      c.x = t.px[i] + t.nx[i] * off; c.y = t.py[i] + t.ny[i] * off; c.a = t.ang[i]; c.vx = c.vy = 0; c.idx = i;
    });
    race.cam = { x: race.player.x + 40, y: race.player.y, z: clamp(Math.min(W, H) / 420, 0.8, 3) };
    $('topBtns').classList.add('hidden');
    $('touch').classList.add('hidden');
    state = 'cover';
    window.__coverReady = true;
  }

  boot();
})();
