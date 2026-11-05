/* Apex GP – original 3D formula racing game.
 * Rendering: Three.js (bundled in ./lib, MIT licence). All models, textures and sounds are
 * generated in code, so the game ships without third-party art or audio assets. */
import * as THREE from './lib/three.module.min.js';

// ================================================================ config
const params = new URLSearchParams(location.search);
const AUTOPILOT = params.has('autopilot');
const TIME_SCALE = Math.min(20, Math.max(1, +params.get('timescale') || 1));
const COVER = params.get('cover');
const CAPTURE = params.has('capture');   // debug: fixed-step frames for recording trailers

const LAPS = 5;
const SP = 8;               // centre-line sample spacing (world units; ~9 units = 1 m)
const CAR_R = 17;
const STEP = 1 / 120;
const VREF = 860;
const STEER_RATE = 2.7;
const PIT_LIMIT = 230;      // ~80 km/h
const PIT_TIME = { tyres: 2.6, wing: 5.5, repair: 8 };
const PEN_TIME = 5;

// Circuit layouts are hand-drawn approximations inspired by venues on the 2026 calendar.
const TRACKS = [
  { name: 'Spielberg', country: 'Austria', theme: 'alpine', len: 14000, ai: 0.76, reward: 1, rain: 0.25, w: 150, wall: 95,
    pts: [[0,0],[500,0],[800,-120],[1250,-420],[1320,-500],[1250,-540],[900,-330],[520,-270],[400,-330],[280,-320],[180,-220],[-80,-250],[-260,-190],[-220,-60]] },
  { name: 'Monza', country: 'Italy', theme: 'park', len: 15000, ai: 0.82, reward: 1.3, rain: 0.15, w: 150, wall: 100,
    pts: [[-200,0],[900,0],[1010,10],[1070,45],[1140,50],[1300,100],[1460,260],[1520,430],[1500,500],[1530,540],[1520,620],[1460,760],[1360,800],[1240,760],[1000,680],[760,600],[680,560],[630,600],[580,560],[520,520],[200,430],[-150,400],[-350,370],[-460,250],[-430,100],[-330,20]] },
  { name: 'Las Vegas', country: 'USA · Night race', theme: 'vegas', len: 15500, ai: 0.86, reward: 1.6, rain: 0, w: 150, wall: 105, night: true,
    pts: [[0,0],[700,0],[800,-60],[810,-150],[730,-215],[610,-215],[560,-260],[480,-280],[400,-230],[-600,-230],[-700,-200],[-760,-120],[-720,-40],[-620,0],[-500,30],[-420,0]] },
  { name: 'São Paulo', country: 'Brazil', theme: 'urbanpark', len: 13500, ai: 0.90, reward: 1.9, rain: 0.45, w: 150, wall: 95,
    pts: [[0,-100],[-500,-110],[-610,-80],[-650,0],[-600,80],[-560,180],[-450,280],[-100,340],[300,340],[420,300],[450,200],[400,130],[280,120],[180,170],[100,240],[30,230],[0,160],[-80,120],[-120,60],[-40,20],[200,30],[420,10],[520,-60],[460,-110],[300,-110]] },
  { name: 'Spa', country: 'Belgium', theme: 'forest', len: 15500, ai: 0.94, reward: 2.2, rain: 0.6, w: 150, wall: 100,
    pts: [[0,0],[0,-160],[20,-240],[80,-250],[110,-170],[90,40],[60,200],[40,260],[90,300],[70,350],[200,390],[880,420],[970,415],[1030,455],[1100,480],[1160,560],[1200,660],[1150,740],[1040,740],[940,730],[880,800],[900,880],[820,960],[700,1000],[600,960],[450,850],[200,620],[-120,420],[-160,250],[-120,190],[-60,170],[-80,110],[-30,60]] },
  { name: 'Monte Carlo', country: 'Monaco', theme: 'city', len: 11000, ai: 0.97, reward: 2.6, rain: 0.2, w: 125, wall: 80,
    pts: [[0,0],[330,0],[420,40],[460,130],[510,380],[570,470],[650,500],[720,590],[690,690],[620,740],[630,800],[740,830],[760,900],[650,980],[380,990],[300,960],[240,1000],[110,960],[40,860],[80,790],[10,740],[30,680],[-60,600],[-40,480],[-60,250],[-60,90]] },
];

const THEMES = {
  alpine:    { ground: '#4f8a3a', ground2: '#5c9744', runoff: 'grass', deco: 'pine', mountains: true, buildings: 0 },
  park:      { ground: '#4a8a3c', ground2: '#559645', runoff: 'grass', deco: 'tree', mountains: false, buildings: 0 },
  vegas:     { ground: '#2c2d31', ground2: '#323338', runoff: 'asphalt', deco: 'none', mountains: false, buildings: 260, tall: true },
  urbanpark: { ground: '#4d873b', ground2: '#589443', runoff: 'grass', deco: 'tree', mountains: false, buildings: 90 },
  forest:    { ground: '#3f7a35', ground2: '#4a873e', runoff: 'grass', deco: 'pine', mountains: true, buildings: 0, dense: true },
  city:      { ground: '#8d8a84', ground2: '#97948e', runoff: 'asphalt', deco: 'palm', mountains: true, buildings: 320 },
};

const WEATHER = {
  sunny:  { name: 'Sunny',       icon: '☀️', cond: 'dry',  air: [24, 31], track: 16, sky: ['#2f74cf', '#bcd9f2'], sun: 2.8, hemi: 0.85, fog: [3500, 11000], rain: 0, desc: 'Dry track, high grip.' },
  cloudy: { name: 'Overcast',    icon: '☁️', cond: 'dry',  air: [16, 22], track: 7,  sky: ['#6f7b88', '#c4c9ce'], sun: 0.9, hemi: 1.5,  fog: [2500, 8500],  rain: 0, desc: 'Dry but cool – a little less grip.' },
  light:  { name: 'Light rain',  icon: '🌦️', cond: 'damp', air: [13, 18], track: 3,  sky: ['#56616c', '#99a2aa'], sun: 0.45, hemi: 1.3, fog: [1600, 6000],  rain: 700, desc: 'Damp track. Intermediates recommended.' },
  heavy:  { name: 'Heavy rain',  icon: '🌧️', cond: 'wet',  air: [11, 15], track: 1,  sky: ['#3a424a', '#6f777e'], sun: 0.2, hemi: 1.05, fog: [900, 4200],   rain: 1600, desc: 'Standing water! Full wets recommended.' },
  night:  { name: 'Clear night', icon: '🌙', cond: 'dry',  air: [14, 19], track: 4,  sky: ['#03050c', '#1a2244'], sun: 0.55, hemi: 0.55, fog: [2500, 9000], rain: 0, desc: 'Cold track under floodlights.' },
};
const COND_FACTOR = { dry: 1, damp: 0.94, wet: 0.89 };

// wear = fraction of tyre life used per lap
const TYRES = [
  { id: 'S', name: 'Soft',         color: '#e8202a', grip: { dry: 1.06, damp: 0.74, wet: 0.56 }, wear: { dry: 0.22, damp: 0.18, wet: 0.15 }, info: 'Maximum grip, wears quickly – may need a pit stop.' },
  { id: 'M', name: 'Medium',       color: '#f5c400', grip: { dry: 1.00, damp: 0.71, wet: 0.54 }, wear: { dry: 0.12, damp: 0.10, wet: 0.09 }, info: 'Balanced grip and durability.' },
  { id: 'H', name: 'Hard',         color: '#eeeeee', grip: { dry: 0.95, damp: 0.67, wet: 0.51 }, wear: { dry: 0.07, damp: 0.06, wet: 0.06 }, info: 'Lasts the whole race, less grip.' },
  { id: 'I', name: 'Intermediate', color: '#2db34a', grip: { dry: 0.82, damp: 0.98, wet: 0.80 }, wear: { dry: 0.45, damp: 0.12, wet: 0.09 }, info: 'For damp tracks and light rain.' },
  { id: 'W', name: 'Full Wet',     color: '#1f6fe0', grip: { dry: 0.70, damp: 0.88, wet: 0.97 }, wear: { dry: 0.60, damp: 0.15, wet: 0.08 }, info: 'For heavy rain and standing water.' },
];

const LIVERIES = [
  { body: '#d40000', accent: '#ffffff', helmet: '#ffd400' },
  { body: '#1641c9', accent: '#ffd400', helmet: '#ffffff' },
  { body: '#ff8000', accent: '#1a1a1a', helmet: '#2fd0ff' },
  { body: '#00a19b', accent: '#e6e6e6', helmet: '#111111' },
  { body: '#c9ccd1', accent: '#00d2be', helmet: '#e10600' },
  { body: '#f2c400', accent: '#111111', helmet: '#1e5bff' },
  { body: '#6a24c8', accent: '#ffffff', helmet: '#ff2d8a' },
  { body: '#145c27', accent: '#f2c200', helmet: '#ffffff' },
];
const AI_NAMES = ['R. Vance', 'K. Moreau', 'T. Sato', 'L. Brandt', 'D. Okafor', 'A. Novak', 'J. Lindqvist', 'M. Ferro'];
const UPGRADES = [
  { key: 'engine', name: 'Engine', desc: 'Top speed & acceleration' },
  { key: 'tyres',  name: 'Suspension', desc: 'Grip & steering' },
  { key: 'brakes', name: 'Brakes', desc: 'Stopping power' },
];
const UPG_COST = [120, 250, 400, 600, 900];
const UPG_MAX = 5;
const PRIZE = [150, 100, 70, 50, 35, 25];
const POINTS = [25, 18, 15, 12, 10, 8];

// ================================================================ utils
const $ = (id) => document.getElementById(id);
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const wrapAngle = (a) => { while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI; return a; };
const ordinal = (n) => n + (['th', 'st', 'nd', 'rd'][(n % 100 > 10 && n % 100 < 14) ? 0 : (n % 10 < 4 ? n % 10 : 0)]);
const fmtTime = (t) => {
  if (!isFinite(t)) return '--:--.---';
  const m = Math.floor(t / 60), s = t - m * 60;
  return m + ':' + (s < 10 ? '0' : '') + s.toFixed(3);
};
const pct = (v) => Math.round(clamp(v, 0, 1) * 100) + '%';
const condColor = (v) => (v < 0.35 ? '#4cd964' : v < 0.7 ? '#ffcc00' : '#ff3b30');   // v = damage/wear 0..1
function rng(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ================================================================ CrazyGames SDK wrapper
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

// ================================================================ save data
const SAVE_KEY = 'apexgp3d_save_v1';
const save = { coins: 0, unlocked: 1, best: {}, up: { engine: 0, tyres: 0, brakes: 0 }, livery: 0, userMuted: false, races: 0, cam: 0,
  champPts: 0, licence: 0 };
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

// ================================================================ sound (WebAudio synth)
const Sound = {
  ctx: null, master: null, eng: null, rainG: null, adMuted: false,
  ensure() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.connect(this.ctx.destination);
    const g = this.ctx.createGain(); g.gain.value = 0;
    const f = this.ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 900; f.Q.value = 4;
    const o1 = this.ctx.createOscillator(); o1.type = 'sawtooth';
    const o2 = this.ctx.createOscillator(); o2.type = 'square';
    const g2 = this.ctx.createGain(); g2.gain.value = 0.35;
    o1.connect(f); o2.connect(g2); g2.connect(f); f.connect(g); g.connect(this.master);
    o1.start(); o2.start();
    this.eng = { g, f, o1, o2 };
    const len = this.ctx.sampleRate * 2, buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const src = this.ctx.createBufferSource(); src.buffer = buf; src.loop = true;
    const rf = this.ctx.createBiquadFilter(); rf.type = 'highpass'; rf.frequency.value = 1200;
    this.rainG = this.ctx.createGain(); this.rainG.gain.value = 0;
    src.connect(rf); rf.connect(this.rainG); this.rainG.connect(this.master); src.start();
    this.applyMute();
  },
  isMuted() { return save.userMuted || CG.muted || this.adMuted; },
  applyMute() {
    if (this.master) this.master.gain.value = this.isMuted() ? 0 : 0.6;
    $('btnMute').textContent = (save.userMuted || CG.muted) ? '🔇' : '🔊';
  },
  adPause(on) { this.adMuted = on; this.applyMute(); },
  rain(level) { if (this.rainG) this.rainG.gain.setTargetAtTime(level * 0.05, this.ctx.currentTime, 0.3); },
  engine(speed, maxSpd, on) {
    if (!this.eng) return;
    const t = this.ctx.currentTime;
    const v = Math.max(0, speed);
    const gears = 8, frac = clamp(v / (maxSpd * 1.02), 0, 0.999);
    const gear = Math.floor(frac * gears);
    const rpm = gear === 0 ? frac * gears : 0.35 + 0.65 * (frac * gears - gear);
    const freq = 60 + rpm * 170 + gear * 6;
    this.eng.o1.frequency.setTargetAtTime(freq, t, 0.03);
    this.eng.o2.frequency.setTargetAtTime(freq * 0.5, t, 0.03);
    this.eng.f.frequency.setTargetAtTime(500 + rpm * 1800, t, 0.05);
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
  thump() { this.beep(80, 0.15, 'triangle', 0.3); },
  crash() { this.beep(60, 0.5, 'sawtooth', 0.3); this.beep(110, 0.3, 'square', 0.15, 0.05); },
  alert() { this.beep(988, 0.1, 'square', 0.1); this.beep(988, 0.1, 'square', 0.1, 0.18); },
  fanfare(good) {
    const notes = good ? [523, 659, 784, 1047] : [392, 349, 330];
    notes.forEach((n, i) => this.beep(n, 0.25, 'square', 0.12, i * 0.13));
  },
};

// ================================================================ track building (2D centre line)
function catmull(p0, p1, p2, p3, t) {
  const t2 = t * t, t3 = t2 * t;
  const f = (a, b, c, d) => 0.5 * ((2 * b) + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
  return { x: f(p0.x, p1.x, p2.x, p3.x), y: f(p0.y, p1.y, p2.y, p3.y) };
}
function splineRaw(cp) {
  const n = cp.length, raw = [];
  for (let i = 0; i < n; i++) {
    const p0 = cp[(i - 1 + n) % n], p1 = cp[i], p2 = cp[(i + 1) % n], p3 = cp[(i + 2) % n];
    const steps = Math.max(8, Math.ceil(Math.hypot(p2.x - p1.x, p2.y - p1.y) / 2));
    for (let s = 0; s < steps; s++) raw.push(catmull(p0, p1, p2, p3, s / steps));
  }
  return raw;
}
function polyLen(raw) {
  let L = 0;
  for (let i = 0; i < raw.length; i++) { const a = raw[i], b = raw[(i + 1) % raw.length]; L += Math.hypot(b.x - a.x, b.y - a.y); }
  return L;
}

function buildTrack(def, index) {
  const unit = def.pts.map((p) => ({ x: p[0], y: p[1] }));
  const scale = def.len / polyLen(splineRaw(unit));
  const raw = splineRaw(unit.map((p) => ({ x: p.x * scale, y: p.y * scale })));
  const out = [raw[0]];
  let carry = 0;
  for (let i = 0; i < raw.length; i++) {
    const a = raw[i], b = raw[(i + 1) % raw.length];
    const seg = Math.hypot(b.x - a.x, b.y - a.y);
    let d = SP - carry;
    while (d <= seg) { const t = d / seg; out.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }); d += SP; }
    carry = seg - (d - SP);
  }
  if (Math.hypot(out[out.length - 1].x - out[0].x, out[out.length - 1].y - out[0].y) < SP * 0.5) out.pop();
  const shift = Math.floor(600 / SP);   // start line ~600 units into the main straight
  const pts = out.slice(shift).concat(out.slice(0, shift));
  const N = pts.length;
  const px = new Float32Array(N), py = new Float32Array(N), nx = new Float32Array(N), ny = new Float32Array(N);
  const ang = new Float32Array(N), curv = new Float32Array(N), vt = new Float32Array(N), dist = new Float32Array(N + 1);
  for (let i = 0; i < N; i++) { px[i] = pts[i].x; py[i] = pts[i].y; }
  for (let i = 0; i < N; i++) {
    const a = (i - 1 + N) % N, b = (i + 1) % N;
    ang[i] = Math.atan2(py[b] - py[a], px[b] - px[a]);
    nx[i] = -Math.sin(ang[i]); ny[i] = Math.cos(ang[i]);
    dist[i + 1] = dist[i] + Math.hypot(px[b] - px[i], py[b] - py[i]);
  }
  const K = 4;
  for (let i = 0; i < N; i++) curv[i] = Math.abs(wrapAngle(ang[(i + K) % N] - ang[(i - K + N) % N])) / (2 * K * SP);
  const s = STEER_RATE;
  for (let i = 0; i < N; i++) {
    const R = 1 / Math.max(curv[i], 1e-5);
    vt[i] = Math.min(VREF * 1.3, 0.86 * (s * R) / (1 + 0.38 * s * R / VREF));
  }
  for (let pass = 0; pass < 3; pass++) {
    for (let j = N - 1; j >= 0; j--) { const nxt = vt[(j + 1) % N]; vt[j] = Math.min(vt[j], Math.sqrt(nxt * nxt + 2 * 900 * SP)); }
  }
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (let i = 0; i < N; i++) { minX = Math.min(minX, px[i]); maxX = Math.max(maxX, px[i]); minY = Math.min(minY, py[i]); maxY = Math.max(maxY, py[i]); }
  const t = { def, index, theme: THEMES[def.theme], N, px, py, nx, ny, ang, curv, vt, dist, minX, minY, maxX, maxY,
    w: def.w, wall: def.w / 2 + def.wall };
  // pit lane: runs along the main straight on the +normal side, from before the line to after it
  t.pit = { entry: N - Math.round(560 / SP), box: N - Math.round(260 / SP), exit: Math.round(380 / SP),
    inner: t.w / 2 + 14, outer: Math.min(t.w / 2 + 14 + 56, t.wall - CAR_R) };
  t.pit.center = (t.pit.inner + t.pit.outer) / 2;
  t.path = new Path2D();
  for (let i = 0; i < N; i++) (i ? t.path.lineTo(px[i], py[i]) : t.path.moveTo(px[i], py[i]));
  t.path.closePath();
  return t;
}
function inPitRange(t, i) { return i >= t.pit.entry || i <= t.pit.exit; }

function nearest(t, x, y, hint, win) {
  let bi = hint, bd = Infinity;
  const N = t.N;
  for (let o = -win; o <= win; o++) {
    const i = ((hint + o) % N + N) % N;
    const dx = t.px[i] - x, dy = t.py[i] - y, d = dx * dx + dy * dy;
    if (d < bd) { bd = d; bi = i; }
  }
  const lat = (x - t.px[bi]) * t.nx[bi] + (y - t.py[bi]) * t.ny[bi];
  return { i: bi, d: Math.sqrt(bd), lat };
}
function distToTrack(t, x, y) {
  let bd = Infinity;
  for (let i = 0; i < t.N; i += 3) { const dx = t.px[i] - x, dy = t.py[i] - y, d = dx * dx + dy * dy; if (d < bd) bd = d; }
  return Math.sqrt(bd);
}

// ================================================================ renderer & scene
const canvas = $('game');
const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0 && matchMedia('(pointer: coarse)').matches);
const renderer = new THREE.WebGLRenderer({ canvas, antialias: !isTouchDevice, powerPreference: 'high-performance', preserveDrawingBuffer: !!COVER || CAPTURE });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isTouchDevice ? 1.3 : 1.75));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.outputColorSpace = THREE.SRGBColorSpace;
const MAX_ANISO = renderer.capabilities.getMaxAnisotropy();

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(62, 1, 2, 30000);
const hemi = new THREE.HemisphereLight(0xcfe6ff, 0x4a5a3a, 1);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff2dd, 2.5);
sun.castShadow = true;
sun.shadow.mapSize.set(isTouchDevice ? 1024 : 2048, isTouchDevice ? 1024 : 2048);
const SH = 420;
Object.assign(sun.shadow.camera, { left: -SH, right: SH, top: SH, bottom: -SH, near: 10, far: 3000 });
sun.shadow.bias = -0.0005;
sun.shadow.normalBias = 0.6;
scene.add(sun); scene.add(sun.target);
const SUN_DIR = new THREE.Vector3(0.45, 1, 0.3).normalize();

const skyMat = new THREE.ShaderMaterial({
  side: THREE.BackSide, depthWrite: false, fog: false,
  uniforms: { top: { value: new THREE.Color('#2f74cf') }, bottom: { value: new THREE.Color('#bcd9f2') } },
  vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
  fragmentShader: 'uniform vec3 top; uniform vec3 bottom; varying vec3 vP; void main(){ float h = clamp(vP.y*1.6+0.05,0.0,1.0); gl_FragColor = vec4(mix(bottom, top, pow(h,0.7)),1.0); }',
});
const sky = new THREE.Mesh(new THREE.SphereGeometry(20000, 24, 12), skyMat);
scene.add(sky);
const pmrem = new THREE.PMREMGenerator(renderer);
let envRT = null;

function resize() {
  const W = window.innerWidth, H = window.innerHeight;
  renderer.setSize(W, H, false);
  camera.aspect = W / H;
  camera.updateProjectionMatrix();
  hud.resize();
}

// ================================================================ procedural textures
const TEX = {};
function canvasTex(w, h, draw, repeat = true) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = MAX_ANISO;
  return t;
}
function noise(g, w, h, n, a, b, min = 1, max = 3) {
  for (let i = 0; i < n; i++) { g.fillStyle = Math.random() < 0.5 ? a : b; const s = min + Math.random() * (max - min); g.fillRect(Math.random() * w, Math.random() * h, s, s); }
}
function makeTextures() {
  TEX.asphalt = canvasTex(512, 512, (g, w, h) => {
    g.fillStyle = '#6a6a6e'; g.fillRect(0, 0, w, h);
    noise(g, w, h, 26000, 'rgba(0,0,0,0.18)', 'rgba(255,255,255,0.10)', 1, 2.4);
    for (let i = 0; i < 18; i++) { g.fillStyle = 'rgba(0,0,0,0.05)'; g.beginPath(); g.ellipse(Math.random() * w, Math.random() * h, 30 + Math.random() * 60, 12 + Math.random() * 30, Math.random() * 3, 0, 7); g.fill(); }
    const gr = g.createLinearGradient(0, 0, w, 0);
    gr.addColorStop(0.25, 'rgba(0,0,0,0)'); gr.addColorStop(0.5, 'rgba(0,0,0,0.16)'); gr.addColorStop(0.75, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
  });
  TEX.grassFor = (theme) => canvasTex(512, 512, (g, w, h) => {
    g.fillStyle = theme.ground; g.fillRect(0, 0, w, h);
    g.fillStyle = theme.ground2; g.fillRect(0, 0, w, h / 2);
    noise(g, w, h, 30000, 'rgba(0,0,0,0.07)', 'rgba(255,255,255,0.05)', 1, 3);
  });
  TEX.kerb = canvasTex(128, 32, (g) => {
    for (let i = 0; i < 2; i++) { g.fillStyle = i ? '#f4f4f4' : '#d31a1a'; g.fillRect(i * 64, 0, 64, 32); }
    g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(0, 0, 128, 4);
  });
  TEX.check = canvasTex(64, 64, (g) => {
    for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) { g.fillStyle = (x + y) % 2 ? '#111' : '#f5f5f5'; g.fillRect(x * 16, y * 16, 16, 16); }
  });
  const brands = ['APEX', 'VELOCE', 'NOVA', 'TURBO OIL', 'ZENITH', 'KRONO', 'PULSE', 'ORBIT'];
  const bcols = [['#d40000', '#fff'], ['#111', '#ffd400'], ['#0d47a1', '#fff'], ['#fff', '#d40000'], ['#1b5e20', '#fff'], ['#ff8000', '#111']];
  TEX.ads = canvasTex(1024, 64, (g, w, h) => {
    for (let i = 0; i < 8; i++) {
      const [bg, fg] = bcols[i % bcols.length];
      g.fillStyle = bg; g.fillRect(i * 128, 0, 128, h);
      g.fillStyle = fg; g.font = 'italic 900 26px Arial'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(brands[i], i * 128 + 64, h / 2 + 2);
      g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(i * 128 + 126, 0, 2, h);
    }
  });
  TEX.armco = canvasTex(64, 64, (g) => {
    const gr = g.createLinearGradient(0, 0, 0, 64);
    gr.addColorStop(0, '#d9dde0'); gr.addColorStop(0.5, '#9aa1a6'); gr.addColorStop(1, '#d9dde0');
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
    g.fillStyle = 'rgba(0,0,0,0.15)'; g.fillRect(0, 30, 64, 4);
  });
  TEX.crowd = canvasTex(256, 128, (g, w, h) => {
    g.fillStyle = '#3b4250'; g.fillRect(0, 0, w, h);
    const cols = ['#ff3b3b', '#ffd400', '#2fd0ff', '#ffffff', '#ff8000', '#7cff6b', '#ff63c8', '#222'];
    for (let y = 2; y < h; y += 6) for (let x = 1; x < w; x += 4) { g.fillStyle = cols[(Math.random() * cols.length) | 0]; g.fillRect(x, y, 3, 4); }
  });
  TEX.windowsDay = canvasTex(128, 256, (g, w, h) => {
    g.fillStyle = '#c9c3b8'; g.fillRect(0, 0, w, h);
    for (let y = 6; y < h; y += 16) for (let x = 6; x < w; x += 16) { g.fillStyle = Math.random() < 0.5 ? '#3e5266' : '#5b7188'; g.fillRect(x, y, 10, 10); }
  });
  TEX.windowsNight = canvasTex(128, 256, (g, w, h) => {
    g.fillStyle = '#0d0f16'; g.fillRect(0, 0, w, h);
    for (let y = 6; y < h; y += 16) for (let x = 6; x < w; x += 16) {
      const r = Math.random();
      g.fillStyle = r < 0.45 ? '#ffd88a' : r < 0.6 ? '#9fd7ff' : r < 0.68 ? '#ff6ad5' : '#151a26';
      g.fillRect(x, y, 10, 10);
    }
  });
  TEX.pits = canvasTex(512, 64, (g, w) => {
    g.fillStyle = '#e8e8ea'; g.fillRect(0, 0, w, 64);
    for (let i = 0; i < 8; i++) { g.fillStyle = '#2a2f3a'; g.fillRect(i * 64 + 6, 18, 52, 46); g.fillStyle = '#d40000'; g.fillRect(i * 64 + 6, 10, 52, 6); }
  });
  TEX.pitSign = canvasTex(256, 64, (g, w, h) => {
    g.fillStyle = '#111'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#ffd400'; g.font = '900 40px Arial'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('PIT  ➜', w / 2, h / 2 + 2);
  }, false);
  TEX.dot = canvasTex(64, 64, (g) => {
    const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  }, false);
}

// ================================================================ geometry helpers
function ribbonGeo(t, offA, offB, y, uScale, vScale, from = 0, to = t.N, closed = true) {
  const cnt = closed ? t.N + 1 : (to - from);
  const pos = new Float32Array(cnt * 2 * 3), uv = new Float32Array(cnt * 2 * 2);
  for (let k = 0; k < cnt; k++) {
    const i = closed ? k % t.N : (from + k) % t.N;
    const d = closed ? t.dist[k] : t.dist[i];
    const ax = t.px[i] + t.nx[i] * offA, az = t.py[i] + t.ny[i] * offA;
    const bx = t.px[i] + t.nx[i] * offB, bz = t.py[i] + t.ny[i] * offB;
    pos.set([ax, y, az, bx, y, bz], k * 6);
    uv.set([0, d / vScale, uScale, d / vScale], k * 4);
  }
  const idx = [];
  for (let k = 0; k < cnt - 1; k++) { const a = k * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  if (g.attributes.normal.getY(0) < 0) {
    for (let k = 0; k < idx.length; k += 3) { const tmp = idx[k + 1]; idx[k + 1] = idx[k + 2]; idx[k + 2] = tmp; }
    g.setIndex(idx); g.computeVertexNormals();
  }
  return g;
}
function wallGeo(t, off, h, vScale, flip = false) {
  const cnt = t.N + 1;
  const pos = new Float32Array(cnt * 2 * 3), uv = new Float32Array(cnt * 2 * 2);
  for (let k = 0; k < cnt; k++) {
    const i = k % t.N, d = t.dist[k];
    const x = t.px[i] + t.nx[i] * off, z = t.py[i] + t.ny[i] * off;
    pos.set([x, 0, z, x, h, z], k * 6);
    const u = (flip ? -d : d) / vScale;
    uv.set([u, 0, u, 1], k * 4);
  }
  const idx = [];
  for (let k = 0; k < cnt - 1; k++) { const a = k * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  g.setIndex(idx); g.computeVertexNormals();
  return g;
}
const std = (opts) => new THREE.MeshStandardMaterial(opts);

// ================================================================ world building
let world = null;
const MAT = {};
const startLights = [];
function disposeWorld() {
  if (!world) return;
  world.traverse((o) => {
    if (o.geometry && !o.geometry.userData.shared) o.geometry.dispose();
    if (o.material && o.material.userData && o.material.userData.temp) o.material.dispose();
  });
  scene.remove(world);
  world = null;
}

function applyWeather(key, t) {
  const W = WEATHER[key];
  skyMat.uniforms.top.value.set(W.sky[0]);
  skyMat.uniforms.bottom.value.set(W.sky[1]);
  scene.fog = new THREE.Fog(W.sky[1], W.fog[0], W.fog[1]);
  sun.intensity = W.sun;
  sun.color.set(key === 'night' ? '#9fb4ff' : '#fff2dd');
  hemi.intensity = W.hemi;
  hemi.color.set(key === 'night' ? '#5a6aa0' : '#cfe6ff');
  hemi.groundColor.set(key === 'night' ? '#202030' : '#4a5a3a');
  renderer.toneMappingExposure = key === 'night' ? 1.25 : 1.0;
  const envScene = new THREE.Scene();
  envScene.add(new THREE.Mesh(new THREE.SphereGeometry(100, 16, 8), skyMat));
  if (envRT) envRT.dispose();
  envRT = pmrem.fromScene(envScene, 0.02);
  scene.environment = envRT.texture;
  scene.environmentIntensity = key === 'night' ? 0.5 : 1;
  MAT.asphalt.roughness = W.cond === 'wet' ? 0.18 : W.cond === 'damp' ? 0.42 : 0.92;
  MAT.asphalt.color.set(W.cond === 'wet' ? '#4a4b50' : W.cond === 'damp' ? '#57585d' : t && t.def.night ? '#6b6c72' : '#7b7c80');
  MAT.asphalt.envMapIntensity = W.cond !== 'dry' ? 1.2 : 0.3;
  MAT.asphalt.needsUpdate = true;
  rainFX.setAmount(W.rain);
}

function initMaterials() {
  MAT.asphalt = std({ map: TEX.asphalt, roughness: 0.9, metalness: 0 });
  MAT.pitlane = std({ color: '#5d5e63', roughness: 0.9, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 });
  MAT.line = std({ color: '#f2f2f2', roughness: 0.6, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  MAT.yellow = std({ color: '#ffd400', roughness: 0.6, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 });
  MAT.kerb = std({ map: TEX.kerb, roughness: 0.6, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 });
  MAT.check = std({ map: TEX.check, roughness: 0.7, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 });
  MAT.ads = std({ map: TEX.ads, roughness: 0.6, side: THREE.DoubleSide });
  MAT.armco = std({ map: TEX.armco, roughness: 0.35, metalness: 0.6, side: THREE.DoubleSide });
  MAT.concrete = std({ color: '#b9b9b4', roughness: 0.95, side: THREE.DoubleSide });
  MAT.crowd = std({ map: TEX.crowd, roughness: 0.9 });
  MAT.steel = std({ color: '#30343c', roughness: 0.5, metalness: 0.7 });
  MAT.white = std({ color: '#e8e8ea', roughness: 0.8 });
  MAT.pits = std({ map: TEX.pits, roughness: 0.7 });
  MAT.pitSign = std({ map: TEX.pitSign, emissiveMap: TEX.pitSign, emissive: '#ffffff', emissiveIntensity: 0.6 });
  MAT.trunk = std({ color: '#5b3d24', roughness: 1 });
  MAT.leaf = std({ color: '#ffffff', roughness: 1, flatShading: true });
  MAT.pine = std({ color: '#7fa088', roughness: 1, flatShading: true });
  MAT.palm = std({ color: '#9fcf8f', roughness: 1, flatShading: true });
  MAT.mountain = std({ color: '#5d6e66', roughness: 1, flatShading: true });
  MAT.lightOff = std({ color: '#2a0505', roughness: 0.4 });
  MAT.lightOn = std({ color: '#ff1a1a', emissive: '#ff1a1a', emissiveIntensity: 3 });
  MAT.lamp = std({ color: '#fff3c4', emissive: '#fff3c4', emissiveIntensity: 2.5 });
  MAT.bDay = std({ map: TEX.windowsDay, roughness: 0.8 });
  MAT.bNight = std({ map: TEX.windowsNight, emissiveMap: TEX.windowsNight, emissive: '#ffffff', emissiveIntensity: 1.2, roughness: 0.8 });
}

function buildWorld(t, weatherKey) {
  disposeWorld();
  world = new THREE.Group();
  scene.add(world);
  const th = t.theme;
  const night = !!t.def.night;
  applyWeather(weatherKey, t);

  const gtex = TEX.grassFor(th);
  const gw = (t.maxX - t.minX) + 16000, gh = (t.maxY - t.minY) + 16000;
  gtex.repeat.set(gw / 700, gh / 700);
  const gmat = std({ map: gtex, roughness: 1 }); gmat.userData.temp = true;
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(gw, gh), gmat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.set((t.minX + t.maxX) / 2, -0.6, (t.minY + t.maxY) / 2);
  ground.receiveShadow = true;
  world.add(ground);

  if (th.runoff === 'asphalt') {
    const rm = std({ color: night ? '#3a3b40' : '#77767a', roughness: 0.95 }); rm.userData.temp = true;
    const ro = new THREE.Mesh(ribbonGeo(t, -t.wall, t.wall, -0.3, 1, 200), rm);
    ro.receiveShadow = true; world.add(ro);
  }
  const road = new THREE.Mesh(ribbonGeo(t, -t.w / 2, t.w / 2, 0, t.w / 160, 160), MAT.asphalt);
  road.receiveShadow = true; world.add(road);
  for (const s of [-1, 1]) {
    const l = new THREE.Mesh(ribbonGeo(t, s * (t.w / 2 - 9), s * (t.w / 2 - 5), 0.05, 1, 100), MAT.line);
    l.receiveShadow = true; world.add(l);
  }
  // kerbs on corners (not alongside the pit lane)
  let i = 0;
  while (i < t.N) {
    if (t.curv[i] > 0.0014) {
      let j = i; while (j < t.N && t.curv[j] > 0.0014) j++;
      const from = Math.max(0, i - 4), to = Math.min(t.N, j + 4);
      if (to - from > 5) for (const s of [-1, 1]) {
        const k = new THREE.Mesh(ribbonGeo(t, s * (t.w / 2 - 4), s * (t.w / 2 + 14), 0.4, 1, 40, from, to, false), MAT.kerb);
        k.receiveShadow = true; world.add(k);
      }
      i = j;
    } else i++;
  }
  // pit lane surface, dividing line and pit box
  {
    const P = t.pit, len = (t.N - P.entry) + P.exit + 1;
    const lane = new THREE.Mesh(ribbonGeo(t, t.w / 2 - 2, P.outer + 6, 0.02, 1, 100, P.entry, P.entry + len, false), MAT.pitlane);
    lane.receiveShadow = true; world.add(lane);
    const line = new THREE.Mesh(ribbonGeo(t, P.inner - 3, P.inner, 0.06, 1, 100, P.entry + 6, P.entry + len - 6, false), MAT.line);
    world.add(line);
    const box = new THREE.Mesh(ribbonGeo(t, P.inner + 3, P.outer - 3, 0.08, 1, 100, P.box - 3, P.box + 4, false), MAT.yellow);
    world.add(box);
    // pit entry sign
    const si = P.entry - 25;
    const sign = new THREE.Mesh(new THREE.BoxGeometry(2, 14, 56), [MAT.pitSign, MAT.pitSign, MAT.steel, MAT.steel, MAT.steel, MAT.steel]);
    sign.position.set(t.px[si] + t.nx[si] * (P.center), 34, t.py[si] + t.ny[si] * (P.center));
    sign.rotation.y = -t.ang[si];
    world.add(sign);
    for (const o of [P.inner - 2, P.outer + 2]) {
      const pole = new THREE.Mesh(new THREE.BoxGeometry(2, 30, 2), MAT.steel);
      pole.position.set(t.px[si] + t.nx[si] * o, 15, t.py[si] + t.ny[si] * o); world.add(pole);
    }
  }
  const sl = new THREE.Mesh(new THREE.PlaneGeometry(16, t.w), MAT.check);
  TEX.check.repeat.set(1, t.w / 16);
  sl.rotation.x = -Math.PI / 2; sl.rotation.z = -t.ang[0];
  sl.position.set(t.px[0], 0.1, t.py[0]);
  world.add(sl);
  for (let k = 0; k < 6; k++) {
    const g = gridSlot(t, k);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(4, 30), MAT.line);
    m.rotation.x = -Math.PI / 2; m.rotation.z = -g.a;
    m.position.set(g.x + Math.cos(g.a) * 30, 0.08, g.y + Math.sin(g.a) * 30);
    world.add(m);
  }
  const wallH = th.runoff === 'asphalt' ? 14 : 10;
  for (const s of [-1, 1]) {
    const wall = new THREE.Mesh(wallGeo(t, s * t.wall, wallH, 220, s > 0), s < 0 ? MAT.ads : (th.runoff === 'asphalt' ? MAT.armco : MAT.ads));
    wall.receiveShadow = true; world.add(wall);
  }
  // start gantry
  {
    const g = new THREE.Group();
    const span = t.wall * 2 + 10;
    const beam = new THREE.Mesh(new THREE.BoxGeometry(6, 8, span), MAT.steel); beam.position.y = 62; g.add(beam);
    for (const s of [-1, 1]) { const p = new THREE.Mesh(new THREE.BoxGeometry(5, 66, 5), MAT.steel); p.position.set(0, 33, s * span / 2); g.add(p); }
    const panel = new THREE.Mesh(new THREE.BoxGeometry(4, 16, 60), MAT.steel); panel.position.set(-2, 48, 0); g.add(panel);
    startLights.length = 0;
    for (let k = 0; k < 5; k++) {
      const l = new THREE.Mesh(new THREE.SphereGeometry(3.2, 12, 8), MAT.lightOff);
      l.position.set(-4.5, 48, -22 + k * 11); g.add(l); startLights.push(l);
    }
    g.position.set(t.px[0], 0, t.py[0]); g.rotation.y = -t.ang[0];
    g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    world.add(g);
  }
  // pit building (+normal side) and grandstands (-normal side)
  {
    const i0 = t.pit.box;
    const off = t.wall + 32;
    const pit = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(620, 34, 50), [MAT.white, MAT.white, MAT.white, MAT.white, MAT.pits, MAT.white]);
    body.position.y = 17; pit.add(body);
    const roof = new THREE.Mesh(new THREE.BoxGeometry(640, 4, 70), MAT.steel); roof.position.set(0, 36, 6); pit.add(roof);
    pit.position.set(t.px[i0] + t.nx[i0] * off, 0, t.py[i0] + t.ny[i0] * off);
    // local +z (garage doors) must face the track, i.e. along -normal
    pit.rotation.y = Math.atan2(-t.nx[i0], -t.ny[i0]);
    pit.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    world.add(pit);
    for (let k = 0; k < 3; k++) {
      const j = (t.N - 110 + k * 55) % t.N;
      const st = grandstand();
      const o2 = t.wall + 10;
      st.position.set(t.px[j] - t.nx[j] * o2, 0, t.py[j] - t.ny[j] * o2);
      st.rotation.y = Math.atan2(t.nx[j], t.ny[j]);
      world.add(st);
    }
  }
  // scenery
  const r = rng(77 + t.index * 31);
  const pad = 2600;
  const i0 = t.pit.box;
  const keepOut = (x, y) => Math.hypot(x - t.px[i0], y - t.py[i0]) < 650 || Math.hypot(x - t.px[0], y - t.py[0]) < 450;
  const treeCount = th.deco === 'none' ? 0 : th.dense ? 1400 : 800;
  const trees = [];
  for (let k = 0; k < treeCount * 4 && trees.length < treeCount; k++) {
    const x = t.minX - pad + r() * (t.maxX - t.minX + pad * 2), y = t.minY - pad + r() * (t.maxY - t.minY + pad * 2);
    const d = distToTrack(t, x, y);
    if (d > t.wall + 40 && !keepOut(x, y) && (th.dense || d < 1600 || r() < 0.3)) trees.push({ x, y, s: 0.8 + r() * 0.8 });
  }
  if (trees.length) addTrees(trees, th.deco);
  if (th.buildings) addBuildings(t, th, night, r, keepOut);
  if (th.mountains) {
    const cx = (t.minX + t.maxX) / 2, cy = (t.minY + t.maxY) / 2;
    const R = Math.max(t.maxX - t.minX, t.maxY - t.minY) / 2 + 5500;
    const mesh = new THREE.InstancedMesh(new THREE.ConeGeometry(1, 1, 7, 1), MAT.mountain, 26);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0);
    for (let k = 0; k < 26; k++) {
      const a = k / 26 * Math.PI * 2 + r() * 0.2;
      const rad = 1800 + r() * 2200, h = 900 + r() * 1700;
      m4.compose(new THREE.Vector3(cx + Math.cos(a) * (R + r() * 1500), h / 2 - 40, cy + Math.sin(a) * (R + r() * 1500)),
        q.setFromAxisAngle(up, r() * 3), new THREE.Vector3(rad, h, rad));
      mesh.setMatrixAt(k, m4);
    }
    world.add(mesh);
  }
  if (night) {
    const n = Math.ceil(t.N / 30) + 1;
    const lamps = new THREE.InstancedMesh(new THREE.SphereGeometry(4, 8, 6), MAT.lamp, n);
    const poles = new THREE.InstancedMesh(new THREE.CylinderGeometry(1.2, 1.6, 50, 6), MAT.steel, n);
    const m4 = new THREE.Matrix4();
    let c = 0;
    for (let k = 0; k < t.N; k += 30, c++) {
      const s = (c % 2) ? 1 : -1, o = s * (t.wall + 8);
      const x = t.px[k] + t.nx[k] * o, z = t.py[k] + t.ny[k] * o;
      m4.makeTranslation(x, 25, z); poles.setMatrixAt(c, m4);
      m4.makeTranslation(x - t.nx[k] * s * 6, 51, z - t.ny[k] * s * 6); lamps.setMatrixAt(c, m4);
    }
    lamps.count = poles.count = c;
    world.add(lamps); world.add(poles);
  }
}

function gridSlot(t, k) {
  const row = Math.floor(k / 2), col = k % 2;
  const back = 50 + row * 80 + col * 40;
  const i = ((t.N - Math.round(back / SP)) % t.N + t.N) % t.N;
  const off = (col === 0 ? -1 : 1) * t.w * 0.22;
  return { i, x: t.px[i] + t.nx[i] * off, y: t.py[i] + t.ny[i] * off, a: t.ang[i], off };
}

function grandstand() {
  // built facing local +z (towards the track)
  const g = new THREE.Group();
  const L = 220;
  for (let k = 0; k < 6; k++) {
    const step = new THREE.Mesh(new THREE.BoxGeometry(L, 6, 9), MAT.concrete);
    step.position.set(0, 3 + k * 6, -(k * 9) - 4.5); g.add(step);
    const crowd = new THREE.Mesh(new THREE.PlaneGeometry(L, 6), MAT.crowd);
    crowd.position.set(0, 9 + k * 6, -(k * 9) - 1); crowd.rotation.x = -0.3; g.add(crowd);
  }
  const back = new THREE.Mesh(new THREE.BoxGeometry(L, 44, 3), MAT.concrete); back.position.set(0, 22, -56); g.add(back);
  const roof = new THREE.Mesh(new THREE.BoxGeometry(L + 10, 2.5, 70), MAT.steel); roof.position.set(0, 64, -26); roof.rotation.x = 0.08; g.add(roof);
  for (const s of [-1, 1]) { const p = new THREE.Mesh(new THREE.BoxGeometry(3, 64, 3), MAT.steel); p.position.set(s * L / 2, 32, -55); g.add(p); }
  g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return g;
}

function addTrees(list, kind) {
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0);
  const trunkG = new THREE.CylinderGeometry(1.6, 2.4, 1, 6);
  let topG, topM, trunkH, topH, topY;
  if (kind === 'pine') { topG = new THREE.ConeGeometry(1, 1, 7); topM = MAT.pine; trunkH = 14; topH = 70; topY = 47; }
  else if (kind === 'palm') { topG = new THREE.ConeGeometry(1, 1, 6); topM = MAT.palm; trunkH = 48; topH = 10; topY = 50; }
  else { topG = new THREE.IcosahedronGeometry(1, 0); topM = MAT.leaf; trunkH = 18; topH = 26; topY = 34; }
  const trunks = new THREE.InstancedMesh(trunkG, MAT.trunk, list.length);
  const tops = new THREE.InstancedMesh(topG, topM, list.length);
  const color = new THREE.Color();
  list.forEach((it, k) => {
    const s = it.s;
    q.setFromAxisAngle(up, it.x * 0.37);
    m4.compose(new THREE.Vector3(it.x, trunkH * s / 2, it.y), q, new THREE.Vector3(s, trunkH * s, s)); trunks.setMatrixAt(k, m4);
    const rad = kind === 'pine' ? 20 * s : kind === 'palm' ? 26 * s : 22 * s;
    m4.compose(new THREE.Vector3(it.x, topY * s, it.y), q, new THREE.Vector3(rad, topH * s * (kind === 'tree' ? 0.9 : 1), rad)); tops.setMatrixAt(k, m4);
    color.setHSL(0.26 + (s - 1.2) * 0.06, 0.5, 0.26 + (s - 1.2) * 0.08); tops.setColorAt(k, color);
  });
  tops.castShadow = true;
  world.add(trunks); world.add(tops);
}

function addBuildings(t, th, night, r, keepOut) {
  const list = [];
  const pad = 2200;
  for (let k = 0; k < th.buildings * 6 && list.length < th.buildings; k++) {
    const x = t.minX - pad + r() * (t.maxX - t.minX + pad * 2), y = t.minY - pad + r() * (t.maxY - t.minY + pad * 2);
    const d = distToTrack(t, x, y);
    if (d > t.wall + 130 && d < 2000 && !keepOut(x, y)) list.push({ x, y, w: 80 + r() * 120, d: 80 + r() * 120, h: (th.tall ? 120 : 50) + r() * (th.tall ? 520 : 160), a: r() * Math.PI });
  }
  const mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), night ? MAT.bNight : MAT.bDay, list.length);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0), col = new THREE.Color();
  list.forEach((b, k) => {
    m4.compose(new THREE.Vector3(b.x, b.h / 2, b.y), q.setFromAxisAngle(up, b.a), new THREE.Vector3(b.w, b.h, b.d));
    mesh.setMatrixAt(k, m4);
    col.setHSL(0.08 + r() * 0.08, night ? 0 : 0.25, night ? 1 : 0.75 + r() * 0.25); mesh.setColorAt(k, col);
  });
  mesh.castShadow = !night; mesh.receiveShadow = true;
  world.add(mesh);
}

// ================================================================ car models
const CARGEO = {};
function carGeos() {
  if (CARGEO.done) return;
  const mk = (g) => { g.userData.shared = true; return g; };
  CARGEO.floor = mk(new THREE.BoxGeometry(40, 1.4, 15));
  CARGEO.nose = mk(new THREE.CylinderGeometry(1.4, 3.4, 18, 10)); CARGEO.nose.rotateZ(-Math.PI / 2);
  CARGEO.tub = mk(new THREE.BoxGeometry(16, 5, 7.5));
  CARGEO.pod = mk(new THREE.BoxGeometry(14, 4.2, 4.5));
  CARGEO.cover = mk(new THREE.CylinderGeometry(1.2, 3.6, 18, 10)); CARGEO.cover.rotateZ(Math.PI / 2);
  CARGEO.fin = mk(new THREE.BoxGeometry(12, 4, 0.5));
  CARGEO.fwing = mk(new THREE.BoxGeometry(4.5, 0.7, 22));
  CARGEO.fplate = mk(new THREE.BoxGeometry(5, 3, 0.5));
  CARGEO.rwing = mk(new THREE.BoxGeometry(4.5, 0.8, 18));
  CARGEO.rplate = mk(new THREE.BoxGeometry(7, 8, 0.6));
  CARGEO.pillar = mk(new THREE.BoxGeometry(1.5, 6, 1));
  CARGEO.helmet = mk(new THREE.SphereGeometry(2.3, 14, 10));
  CARGEO.halo = mk(new THREE.TorusGeometry(3.6, 0.45, 6, 16, Math.PI)); CARGEO.halo.rotateX(-Math.PI / 2); CARGEO.halo.rotateY(Math.PI / 2);
  CARGEO.tyreF = mk(new THREE.CylinderGeometry(3.8, 3.8, 4.2, 18)); CARGEO.tyreF.rotateX(Math.PI / 2);
  CARGEO.tyreR = mk(new THREE.CylinderGeometry(4.3, 4.3, 5.4, 18)); CARGEO.tyreR.rotateX(Math.PI / 2);
  CARGEO.band = mk(new THREE.TorusGeometry(2.9, 0.35, 4, 18));
  CARGEO.rim = mk(new THREE.CylinderGeometry(2.4, 2.4, 0.6, 12)); CARGEO.rim.rotateX(Math.PI / 2);
  CARGEO.light = mk(new THREE.BoxGeometry(0.6, 1.2, 2.4));
  CARGEO.done = true;
  MAT.carbon = std({ color: '#141518', roughness: 0.45, metalness: 0.3 });
  MAT.rubber = std({ color: '#151515', roughness: 0.95 });
  MAT.rim = std({ color: '#2a2d33', roughness: 0.3, metalness: 0.9 });
}
const paintCache = {};
function paint(color, rough = 0.25, metal = 0.45) {
  const k = color + rough + metal;
  return paintCache[k] || (paintCache[k] = std({ color, roughness: rough, metalness: metal, envMapIntensity: 1.2 }));
}
function buildCarMesh(liv, tyre) {
  carGeos();
  const g = new THREE.Group();
  const body = paint(liv.body), acc = paint(liv.accent, 0.35, 0.2), hel = paint(liv.helmet, 0.2, 0.3);
  const add = (geo, mat, x, y, z, shadow = true, parent = g) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = shadow; parent.add(m); return m; };
  add(CARGEO.floor, MAT.carbon, -1, 1.6, 0);
  add(CARGEO.nose, body, 15, 3.4, 0);
  add(CARGEO.tub, body, 0, 4.6, 0);
  add(CARGEO.pod, body, -4, 4, 6.4); add(CARGEO.pod, body, -4, 4, -6.4);
  add(CARGEO.cover, body, -13, 5.6, 0);
  add(CARGEO.fin, acc, -14, 8.2, 0);
  // front wing is its own group so damage can bend/hide it
  const fwing = new THREE.Group(); g.add(fwing);
  add(CARGEO.fwing, MAT.carbon, 23, 1.4, 0, true, fwing);
  const fw2 = add(CARGEO.fwing, acc, 21.5, 2.3, 0, true, fwing); fw2.scale.set(0.6, 1, 0.92);
  const fpL = add(CARGEO.fplate, body, 23, 2.6, 11, true, fwing); const fpR = add(CARGEO.fplate, body, 23, 2.6, -11, true, fwing);
  add(CARGEO.rwing, body, -22, 9.4, 0);
  const rw2 = add(CARGEO.rwing, MAT.carbon, -23.5, 11.2, 0); rw2.scale.set(0.6, 1, 1);
  add(CARGEO.rplate, acc, -22.5, 7.5, 9.1); add(CARGEO.rplate, acc, -22.5, 7.5, -9.1);
  add(CARGEO.pillar, MAT.carbon, -20, 5.8, 0);
  add(CARGEO.helmet, hel, -1, 7.6, 0);
  add(CARGEO.halo, MAT.carbon, 0.5, 8.6, 0);
  const rearMat = std({ color: '#ff2020', emissive: '#ff0000', emissiveIntensity: 0 });
  const rl = add(CARGEO.light, rearMat, -25, 5, 0, false);
  const wheels = [], steer = [], bands = [];
  const bandMat = paint(TYRES[tyre].color, 0.6, 0);
  for (const [x, z, front] of [[14, 9.6, 1], [14, -9.6, 1], [-15, 9.8, 0], [-15, -9.8, 0]]) {
    const pivot = new THREE.Group(); pivot.position.set(x, front ? 3.8 : 4.3, z); g.add(pivot);
    const spin = new THREE.Group(); pivot.add(spin);
    const ty = new THREE.Mesh(front ? CARGEO.tyreF : CARGEO.tyreR, MAT.rubber); ty.castShadow = true; spin.add(ty);
    const w2 = front ? 2.15 : 2.75;
    const rim = new THREE.Mesh(CARGEO.rim, MAT.rim); rim.position.z = Math.sign(z) * w2; spin.add(rim);
    const band = new THREE.Mesh(CARGEO.band, bandMat); band.position.z = Math.sign(z) * (w2 + 0.05); band.scale.setScalar(front ? 1 : 1.12); spin.add(band);
    wheels.push(spin); bands.push(band); if (front) steer.push(pivot);
  }
  g.userData = { wheels, steer, bands, rearLight: rl, fwing, fpL, fpR };
  return g;
}
function setCarTyre(c) { for (const b of c.mesh.userData.bands) b.material = paint(TYRES[c.tyre].color, 0.6, 0); }

// ================================================================ particles: spray / smoke / debris, and rain
const particles = (() => {
  const MAX = 700;
  const pos = new Float32Array(MAX * 3), col = new Float32Array(MAX * 3);
  const vel = new Float32Array(MAX * 3), life = new Float32Array(MAX);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const mat = new THREE.PointsMaterial({ size: 26, vertexColors: true, transparent: true, opacity: 0.55, depthWrite: false, sizeAttenuation: true });
  const pts = new THREE.Points(geo, mat);
  pts.frustumCulled = false;
  let n = 0;
  return {
    init() { mat.map = TEX.dot; mat.needsUpdate = true; scene.add(pts); },
    emit(x, y, z, vx, vy, vz, c, l) {
      if (n >= MAX) return;
      pos[n * 3] = x; pos[n * 3 + 1] = y; pos[n * 3 + 2] = z;
      vel[n * 3] = vx; vel[n * 3 + 1] = vy; vel[n * 3 + 2] = vz;
      col[n * 3] = c[0]; col[n * 3 + 1] = c[1]; col[n * 3 + 2] = c[2]; life[n] = l; n++;
    },
    clear() { n = 0; geo.setDrawRange(0, 0); },
    update(dt) {
      for (let i = n - 1; i >= 0; i--) {
        life[i] -= dt;
        if (life[i] <= 0) {
          n--;
          pos.copyWithin(i * 3, n * 3, n * 3 + 3); vel.copyWithin(i * 3, n * 3, n * 3 + 3); col.copyWithin(i * 3, n * 3, n * 3 + 3); life[i] = life[n];
          continue;
        }
        pos[i * 3] += vel[i * 3] * dt; pos[i * 3 + 1] = Math.max(0.5, pos[i * 3 + 1] + vel[i * 3 + 1] * dt); pos[i * 3 + 2] += vel[i * 3 + 2] * dt;
        vel[i * 3 + 1] -= 30 * dt;
      }
      geo.setDrawRange(0, n);
      geo.attributes.position.needsUpdate = true; geo.attributes.color.needsUpdate = true;
    },
  };
})();

const rainFX = (() => {
  const MAX = 1600, BOX = 900, HGT = 500;
  const pos = new Float32Array(MAX * 6);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.LineBasicMaterial({ color: 0xc8d4e0, transparent: true, opacity: 0.45 });
  const lines = new THREE.LineSegments(geo, mat);
  lines.frustumCulled = false;
  let count = 0;
  const drop = (o, y) => {
    const x = (Math.random() - 0.5) * BOX, z = (Math.random() - 0.5) * BOX;
    pos[o] = x; pos[o + 1] = y; pos[o + 2] = z; pos[o + 3] = x + 3; pos[o + 4] = y + 22; pos[o + 5] = z + 2;
  };
  for (let i = 0; i < MAX; i++) drop(i * 6, Math.random() * HGT);
  return {
    init() { scene.add(lines); },
    setAmount(n) { count = n; geo.setDrawRange(0, n * 2); lines.visible = n > 0; },
    get amount() { return count; },
    update(dt, cx, cz) {
      if (!count) return;
      lines.position.set(cx, 0, cz);
      for (let i = 0; i < count; i++) {
        const o = i * 6;
        pos[o + 1] -= 1100 * dt; pos[o + 4] -= 1100 * dt;
        if (pos[o + 1] < 0) drop(o, HGT * (0.8 + Math.random() * 0.2));
      }
      geo.attributes.position.needsUpdate = true;
    },
  };
})();

// ================================================================ cars / physics
function makeCar(o) {
  return Object.assign({
    x: 0, y: 0, a: 0, vx: 0, vy: 0, speed: 0, steer: 0, slip: 0,
    maxSpd: VREF, accel: 520, grip: 8, brake: 1300, steerRate: STEER_RATE, corner: 1,
    idx: 0, lat: 0, dist: 0, lap: 0, finished: false, finishTime: 0, lapStart: 0, bestLap: Infinity, lastLap: 0,
    lane: 0, laneTarget: 0, laneT: 0, stuckTime: 0, wrongTime: 0, flash: 0, wear: 0, tyre: 1, gripF: 1, spin: 0,
    dmgWing: 0, dmgBody: 0, spinT: 0, spinDir: 1, wasGrass: false,
    inPit: false, pitDone: false, pitHold: 0, pitPlan: null, pits: 0,
    tlDist: 0, tlCount: 0, penalty: 0, penalties: [], hitCooldown: 0,
    input: { gas: 0, brake: 0, steer: 0 }, isPlayer: false, name: '', liv: LIVERIES[0], mesh: null,
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
function tyreGrip(c, cond) {
  const T = TYRES[c.tyre];
  const worn = c.wear >= 1 ? 0.55 : (1 - 0.35 * c.wear);       // fully worn = puncture-like
  return T.grip[cond] * COND_FACTOR[cond] * worn * (1 - 0.3 * c.dmgWing);
}
function bodyFactor(c) { return 1 - 0.4 * c.dmgBody; }

function addPenalty(c, reason, secs, licencePts) {
  c.penalty += secs;
  c.penalties.push(reason);
  if (c.isPlayer) {
    race.licence += licencePts;
    toast(`+${secs}s PENALTY – ${reason}`);
    Sound.alert();
  }
}

function damage(c, wing, body, why) {
  const before = c.dmgWing + c.dmgBody;
  c.dmgWing = clamp(c.dmgWing + wing, 0, 1);
  c.dmgBody = clamp(c.dmgBody + body, 0, 1);
  if (c.isPlayer && before < 0.6 && c.dmgWing + c.dmgBody >= 0.6) { toast('Damage! Box this lap'); Sound.alert(); }
}

function updateCar(c, dt, t, cond) {
  const near = nearest(t, c.x, c.y, c.idx, 40);
  const prevIdx = c.idx;
  c.idx = near.i; c.dist = near.d; c.lat = near.lat;
  const P = t.pit;
  const pitZone = inPitRange(t, c.idx) && near.lat > P.inner - 10;
  c.inPit = pitZone && near.lat > P.inner - 4;
  const off = Math.abs(near.lat) > t.w / 2 + 8 && !pitZone;
  c.off = off;
  const grass = off && t.theme.runoff === 'grass';
  const inp = c.input;
  const gf = c.gripF = tyreGrip(c, cond);
  const bf = bodyFactor(c);
  let maxSpd = c.maxSpd * bf * (grass ? 0.5 : 1);
  if (c.inPit) maxSpd = Math.min(maxSpd, PIT_LIMIT);

  // pit stop: car is held in its box while the crew works
  if (c.pitHold > 0) {
    c.pitHold -= dt;
    c.vx = c.vy = 0; c.speed = 0;
    if (c.pitHold <= 0) finishPitWork(c);
    return;
  }

  let steerIn = inp.steer, gas = inp.gas, brake = inp.brake;
  if (c.spinT > 0) { c.spinT -= dt; steerIn = 0; gas = 0; brake = 0.6; }

  c.steer += (steerIn - c.steer) * Math.min(1, dt * 10);
  let fwd = c.vx * Math.cos(c.a) + c.vy * Math.sin(c.a);
  const sp = Math.abs(fwd);
  const steerScale = Math.min(1, sp / 180) * (1 - 0.38 * Math.min(1, sp / VREF));
  c.a += c.steer * c.steerRate * gf * steerScale * (fwd < -5 ? -1 : 1) * dt;
  if (c.spinT > 0) c.a += c.spinDir * 7 * Math.min(1, c.spinT) * dt;

  const cos = Math.cos(c.a), sin = Math.sin(c.a);
  fwd = c.vx * cos + c.vy * sin;
  let lat = -c.vx * sin + c.vy * cos;
  const traction = Math.min(1, 0.45 + 0.55 * gf);
  if (gas > 0 && fwd < maxSpd) fwd += c.accel * bf * traction * gas * dt * (1 - Math.max(0, fwd) / maxSpd * 0.55);
  if (brake > 0) {
    if (fwd > 0) fwd = Math.max(0, fwd - c.brake * gf * brake * dt);
    else fwd = Math.max(-180, fwd - 380 * brake * dt);
  }
  if (!gas && !brake) fwd -= Math.sign(fwd) * Math.min(Math.abs(fwd), 110 * dt);
  fwd -= fwd * (grass ? 1.5 : 0.12) * dt;
  if (fwd > maxSpd) fwd += (maxSpd - fwd) * Math.min(1, dt * (c.inPit ? 6 : 2.5));
  lat *= Math.exp(-c.grip * gf * (grass ? 0.5 : 1) * (c.spinT > 0 ? 0.3 : 1) * dt);
  c.slip = Math.abs(lat);
  c.vx = cos * fwd - sin * lat;
  c.vy = sin * fwd + cos * lat;
  c.x += c.vx * dt; c.y += c.vy * dt;
  c.speed = fwd;
  c.spin += fwd * dt / 4;

  // running onto the grass fast can spin you around
  if (grass && !c.wasGrass && sp > 480 && state === 'race') {
    c.spinT = 1.1; c.spinDir = near.lat > 0 ? 1 : -1;
    damage(c, 0.05, 0.02);
    if (c.isPlayer) toast('SPIN!');
  }
  c.wasGrass = grass;

  // barriers
  const i = c.idx;
  const lat2 = (c.x - t.px[i]) * t.nx[i] + (c.y - t.py[i]) * t.ny[i];
  const lim = t.wall - CAR_R * 0.75;
  if (Math.abs(lat2) > lim) {
    const s = Math.sign(lat2), over = Math.abs(lat2) - lim;
    c.x -= t.nx[i] * over * s; c.y -= t.ny[i] * over * s;
    const vn = Math.abs(c.vx * t.nx[i] + c.vy * t.ny[i]);
    const vns = c.vx * t.nx[i] + c.vy * t.ny[i];
    if (vns * s > 0) {
      c.vx -= t.nx[i] * vns * 1.4; c.vy -= t.ny[i] * vns * 1.4;
      const k = clamp(1 - vn / 1100, 0.5, 0.97);
      c.vx *= k; c.vy *= k;
      if (vn > 110) damage(c, (vn - 110) / 800, Math.max(0, vn - 200) / 1500);
      if (vn > 330 && state === 'race') {
        // heavy crash: car spins and stops
        c.spinT = 1.4; c.spinDir = s; c.vx *= 0.35; c.vy *= 0.35;
        if (c.isPlayer) { toast('CRASH!'); Sound.crash(); shake = 1; }
        for (let k2 = 0; k2 < 30; k2++) particles.emit(c.x, 6, c.y, (Math.random() - 0.5) * 160, 40 + Math.random() * 80, (Math.random() - 0.5) * 160, [0.12, 0.12, 0.14], 1.2);
      } else if (c.isPlayer && vn > 70) { Sound.thump(); shake = Math.min(1, vn / 400); }
    }
  }

  // lap counting
  const N = t.N;
  if (prevIdx > N * 0.7 && c.idx < N * 0.3) {
    c.lap++;
    if (c.lap >= 1 && c.lap <= LAPS && race) {
      const lt = race.time - c.lapStart;
      c.lastLap = lt; c.bestLap = Math.min(c.bestLap, lt); c.lapStart = race.time;
      if (c.isPlayer && c.lap < LAPS) { toast(c.lap === LAPS - 1 ? 'FINAL LAP' : 'LAP ' + (c.lap + 1)); Sound.beep(660, 0.15); }
    }
    if (c.lap >= LAPS && !c.finished && race) { c.finished = true; c.finishTime = race.time + c.penalty; }
  } else if (prevIdx < N * 0.3 && c.idx > N * 0.7) c.lap--;

  // pit lane: arriving at the box opens the pit menu (player) or does a stop (AI)
  if (!inPitRange(t, c.idx)) c.pitDone = false;
  if (c.inPit && !c.pitDone && state === 'race') {
    const d = (c.idx - P.box + N) % N;
    if (d < 4 || d > N - 2) {
      c.pitDone = true;
      c.x = t.px[P.box] + t.nx[P.box] * P.center; c.y = t.py[P.box] + t.ny[P.box] * P.center; c.a = t.ang[P.box];
      c.vx = c.vy = 0; c.speed = 0;
      if (c.isPlayer && !AUTOPILOT) openPitMenu(c);
      else beginPitWork(c, { tyre: bestTyre(cond), wing: c.dmgWing > 0.2, repair: c.dmgBody > 0.2 });
    }
  }

  // tyre wear (per lap distance travelled, sliding wears more)
  if (fwd > 0) c.wear = Math.min(1, c.wear + TYRES[c.tyre].wear[cond] * (fwd * dt) / t.dist[N] * (1 + c.slip / 250));

  // track limits (player): all four wheels past the kerb
  if (c.isPlayer && state === 'race' && !c.finished) {
    if (Math.abs(near.lat) > t.w / 2 + 22 && !pitZone) c.tlDist += Math.max(0, fwd) * dt;
    else if (c.tlDist > 0) {
      if (c.tlDist > 60) {
        c.tlCount++;
        if (c.tlCount < 3) { toast(`TRACK LIMITS – warning ${c.tlCount}/2`); Sound.alert(); }
        else addPenalty(c, 'Track limits', PEN_TIME, 1);
      }
      c.tlDist = 0;
    }
  }
  if (c.hitCooldown > 0) c.hitCooldown -= dt;

  const tang = c.vx * Math.cos(t.ang[c.idx]) + c.vy * Math.sin(t.ang[c.idx]);
  c.wrongTime = (tang < -60) ? c.wrongTime + dt : 0;
  c.stuckTime = (sp < 25 && c.spinT <= 0) ? c.stuckTime + dt : 0;
  if ((c.stuckTime > 3.5 && state === 'race' && !c.inPit) || (!c.isPlayer && c.wrongTime > 1.5)) resetCar(c, t);
}
let shake = 0;

function beginPitWork(c, plan) {
  c.pitPlan = plan;
  let tm = 1.2;    // in/out of the box
  if (plan.tyre !== null && plan.tyre !== undefined) tm += PIT_TIME.tyres;
  if (plan.wing) tm += PIT_TIME.wing;
  if (plan.repair) tm += PIT_TIME.repair;
  c.pitHold = tm; c.pits++;
}
function finishPitWork(c) {
  const p = c.pitPlan || {};
  if (p.tyre !== null && p.tyre !== undefined) { c.tyre = p.tyre; c.wear = 0; setCarTyre(c); }
  if (p.wing) c.dmgWing = 0;
  if (p.repair) c.dmgBody = 0;
  c.pitPlan = null; c.pitHold = 0;
  if (c.isPlayer) toast('GO GO GO!');
}

function resetCar(c, t) {
  const i = (c.idx + 3) % t.N;
  c.x = t.px[i]; c.y = t.py[i]; c.a = t.ang[i]; c.vx = c.vy = 0; c.speed = 0;
  c.stuckTime = 0; c.wrongTime = 0; c.flash = 1.5; c.spinT = 0;
}
function progress(c, t) { return c.lap * t.N + c.idx; }

function aiControl(c, t, dt) {
  const N = t.N;
  const spd = Math.max(0, c.speed);
  // AI pits when tyres are gone or the car is badly damaged
  const wantsPit = !c.finished && c.lap < LAPS - 1 && (c.wear > 0.8 || c.dmgWing + c.dmgBody > 0.8);
  const nearEntry = ((t.pit.entry - c.idx + N) % N) < 90;
  if (wantsPit && (nearEntry || c.inPit || inPitRange(t, c.idx)) && !c.pitDone) c.laneTarget = t.pit.center, c.laneT = 1;
  else {
    c.laneT -= dt;
    if (c.laneT <= 0) { c.laneTarget = (Math.random() * 2 - 1) * t.w * 0.2; c.laneT = 2 + Math.random() * 3; }
    for (const o of race.cars) {
      if (o === c) continue;
      const dx = o.x - c.x, dy = o.y - c.y;
      const ahead = dx * Math.cos(c.a) + dy * Math.sin(c.a);
      const side = -dx * Math.sin(c.a) + dy * Math.cos(c.a);
      if (ahead > 0 && ahead < 110 && Math.abs(side) < 34 && o.speed < c.speed + 30) {
        c.laneTarget = clamp(o.lat + (o.lat > 0 ? -1 : 1) * 46, -t.w * 0.36, t.w * 0.36);
        c.laneT = 1.2;
      }
    }
    if (c.lat > t.w / 2 && inPitRange(t, c.idx)) c.laneTarget = Math.min(c.laneTarget, t.w * 0.3);
  }
  c.lane += (c.laneTarget - c.lane) * Math.min(1, dt * 1.5);
  const look = Math.floor(9 + spd * 0.032);
  const ti = (c.idx + look) % N;
  const lane = c.lane * (c.lane > t.w / 2 ? 1 : clamp(1 - t.curv[ti] * 250, 0.2, 1));
  const tx = t.px[ti] + t.nx[ti] * lane, ty = t.py[ti] + t.ny[ti] * lane;
  const diff = wrapAngle(Math.atan2(ty - c.y, tx - c.x) - c.a);
  c.input.steer = clamp(diff * 2.4, -1, 1);
  let target = Infinity;
  const ahead = Math.floor(3 + spd * 0.014);
  for (let k = 0; k <= ahead; k += 2) target = Math.min(target, t.vt[(c.idx + k) % N]);
  target *= c.corner * c.gripF;
  if (Math.abs(diff) > 0.6) target = Math.min(target, 260);
  if (c.inPit || (c.lane > t.w / 2 && nearEntry)) target = Math.min(target, PIT_LIMIT);
  if (spd < target - 8) { c.input.gas = 1; c.input.brake = 0; }
  else if (spd > target + 35) { c.input.gas = 0; c.input.brake = 1; }
  else { c.input.gas = 0.35; c.input.brake = 0; }
}

function collide(cars) {
  for (let i = 0; i < cars.length; i++) {
    for (let j = i + 1; j < cars.length; j++) {
      const a = cars[i], b = cars[j];
      if (a.pitHold > 0 || b.pitHold > 0) continue;
      const dx = b.x - a.x, dy = b.y - a.y, d2 = dx * dx + dy * dy, min = CAR_R * 2;
      if (d2 < min * min && d2 > 0.0001) {
        const d = Math.sqrt(d2), nx = dx / d, ny = dy / d, push = (min - d) / 2;
        a.x -= nx * push; a.y -= ny * push; b.x += nx * push; b.y += ny * push;
        const rv = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
        if (rv < 0) {
          const imp = -rv * 0.6;
          a.vx -= nx * imp; a.vy -= ny * imp; b.vx += nx * imp; b.vy += ny * imp;
          if (imp > 60) {
            damage(a, imp / 1400, imp / 4000); damage(b, imp / 1400, imp / 4000);
            if (a.isPlayer || b.isPlayer) { Sound.thump(); shake = Math.min(1, imp / 300); }
          }
          // causing a collision: player hits a car ahead of them hard
          for (const [me, other, sgn] of [[a, b, 1], [b, a, -1]]) {
            if (!me.isPlayer || me.hitCooldown > 0 || state !== 'race') continue;
            const aheadDot = (nx * sgn) * Math.cos(me.a) + (ny * sgn) * Math.sin(me.a);
            if (aheadDot > 0.7 && imp > 210) {
              me.hitCooldown = 4;
              other.spinT = 0.9; other.spinDir = Math.random() < 0.5 ? 1 : -1;
              addPenalty(me, 'Causing a collision', PEN_TIME, 2);
            }
          }
        }
      }
    }
  }
}

// ================================================================ input
const keys = {};
const touch = { left: false, right: false, brake: false };
let isTouch = isTouchDevice;
const GAME_KEYS = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'Space'];
window.addEventListener('keydown', (e) => {
  if (GAME_KEYS.includes(e.key) || GAME_KEYS.includes(e.code)) e.preventDefault();
  keys[e.code] = true;
  Sound.ensure();
  if (e.code === 'Escape' || e.code === 'KeyP') { if (state === 'race' || state === 'countdown') pauseGame(); else if (state === 'paused') resumeGame(); }
  if (e.code === 'KeyR' && state === 'race' && race.player && !race.player.finished && !race.player.inPit) resetCar(race.player, race.track);
  if (e.code === 'KeyM') toggleMute();
  if (e.code === 'KeyC') cycleCam();
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
  el.addEventListener('pointerdown', on); el.addEventListener('pointerup', off);
  el.addEventListener('pointercancel', off); el.addEventListener('pointerleave', off);
}
bindTouch('tLeft', 'left'); bindTouch('tRight', 'right'); bindTouch('tBrake', 'brake');
function readPlayerInput(c) {
  const left = keys.ArrowLeft || keys.KeyA || touch.left;
  const right = keys.ArrowRight || keys.KeyD || touch.right;
  const kGas = keys.ArrowUp || keys.KeyW;
  const kBrake = keys.ArrowDown || keys.KeyS || keys.Space || touch.brake;
  c.input.steer = (right ? 1 : 0) - (left ? 1 : 0);
  c.input.gas = (kGas || (isTouch && !kBrake)) ? 1 : 0;
  c.input.brake = kBrake ? 1 : 0;
}

// ================================================================ race flow
let state = 'loading';
let race = null;
let currentTrack = 0;
let carsGroup = null;
const trackCache = {};
function getTrack(i) { return trackCache[i] || (trackCache[i] = buildTrack(TRACKS[i], i)); }
let builtFor = null;
function ensureWorld(ti, wx) {
  const key = ti + ':' + wx;
  if (builtFor !== key) { buildWorld(getTrack(ti), wx); builtFor = key; }
}
function rollWeather(def) {
  if (def.night) return 'night';
  const r = Math.random();
  if (r < def.rain * 0.45) return 'heavy';
  if (r < def.rain) return 'light';
  return r < def.rain + (1 - def.rain) * 0.35 ? 'cloudy' : 'sunny';
}
function tyreScore(i, cond) {
  const T = TYRES[i];
  const avgWear = Math.min(1, T.wear[cond] * LAPS) / 2;
  return T.grip[cond] * (1 - 0.35 * avgWear) - (T.wear[cond] * LAPS > 1 ? 0.06 : 0);
}
function bestTyre(cond) {
  let best = 0, bv = -1;
  TYRES.forEach((T, i) => { const v = tyreScore(i, cond); if (v > bv) { bv = v; best = i; } });
  return best;
}

// ---------------------------------------------------------------- pre-race briefing
const brief = { track: 0, weather: 'sunny', tyre: 1, temps: null };
function openBrief(ti) {
  brief.track = ti;
  brief.weather = rollWeather(TRACKS[ti]);
  const W = WEATHER[brief.weather];
  const air = Math.round(W.air[0] + Math.random() * (W.air[1] - W.air[0]));
  brief.temps = { air, track: air + W.track + Math.round(Math.random() * 4) };
  brief.tyre = bestTyre(W.cond);
  ensureWorld(ti, brief.weather);
  menuTrack = ti;
  renderBrief();
  state = 'brief';
  showScreen('brief');
}
function tyreButtons(box, selected, cond, onPick, keepOption) {
  box.innerHTML = '';
  const rec = bestTyre(cond);
  if (keepOption) {
    const k = document.createElement('div');
    k.className = 'tyre keep' + (selected === null ? ' on' : '');
    k.style.borderColor = '#666'; k.style.color = '#ccc'; k.textContent = 'KEEP';
    k.addEventListener('click', () => onPick(null));
    box.appendChild(k);
  }
  TYRES.forEach((T, i) => {
    const d = document.createElement('div');
    d.className = 'tyre' + (i === selected ? ' on' : '');
    d.style.borderColor = T.color; d.style.color = T.color;
    d.innerHTML = T.id + (i === rec ? '<span class="rec">BEST</span>' : '');
    d.title = T.name;
    d.addEventListener('click', () => onPick(i));
    box.appendChild(d);
  });
}
function tyreInfoHTML(i, cond) {
  const T = TYRES[i];
  const g = T.grip[cond], life = 1 / (T.wear[cond] * LAPS);
  let warn = '';
  if (cond !== 'dry' && i <= 2) warn = '⚠ Slick tyres on a wet track – very low grip!';
  else if (cond === 'dry' && i >= 3) warn = '⚠ Rain tyres on a dry track – slow and they overheat.';
  else if (life < 1) warn = `⚠ Won't last ${LAPS} laps – plan a pit stop (~lap ${Math.max(1, Math.floor(LAPS * life))}).`;
  return `<b style="color:${T.color}">${T.name}</b> – ${T.info}
    <div style="margin-top:8px">Grip in these conditions</div><div class="bar"><div style="width:${Math.round(g * 100)}%"></div></div>
    <div>Durability (${LAPS}-lap race)</div><div class="bar"><div style="width:${Math.round(clamp(life, 0.05, 1) * 100)}%"></div></div>
    ${warn ? `<div class="warn">${warn}</div>` : ''}`;
}
function renderBrief() {
  const def = TRACKS[brief.track], t = getTrack(brief.track), W = WEATHER[brief.weather];
  $('bRound').textContent = 'Round ' + (brief.track + 1) + ' · ' + def.country;
  $('bTrack').textContent = def.name;
  drawMap($('bMap'), t, null);
  $('bIcon').textContent = W.icon;
  $('bWx').textContent = W.name;
  const chance = W.cond === 'wet' ? 95 : W.cond === 'damp' ? 70 : Math.round(def.rain * 60);
  $('bWxMeta').innerHTML = `Air ${brief.temps.air}°C · Track ${brief.temps.track}°C · Rain ${chance}%<br>${W.desc}<br>${LAPS} laps`;
  tyreButtons($('bTyres'), brief.tyre, W.cond, (i) => { brief.tyre = i; Sound.beep(700, 0.06); renderBrief(); }, false);
  $('bTyreInfo').innerHTML = tyreInfoHTML(brief.tyre, W.cond);
}

// ---------------------------------------------------------------- pit stop menu
const pitSel = { tyre: null, wing: false, repair: false };
function openPitMenu(c) {
  state = 'pitmenu';
  pitSel.tyre = c.wear > 0.45 ? bestTyre(race.cond) : null;
  pitSel.wing = c.dmgWing > 0.25;
  pitSel.repair = c.dmgBody > 0.3;
  Sound.engine(0, 1, false);
  renderPitMenu();
  showScreen('pit'); updateTouchUI();
}
function renderPitMenu() {
  const c = race.player;
  const T = TYRES[c.tyre];
  const row = (key, label, dmg, secs) => `
    <label class="pitrow"><input type="checkbox" data-k="${key}" ${pitSel[key] ? 'checked' : ''}>
      <span class="plbl">${label}</span><span class="pdmg" style="color:${condColor(dmg)}">${pct(dmg)} damaged</span>
      <span class="psec">+${secs.toFixed(1)}s</span></label>`;
  let total = 1.2 + (pitSel.tyre !== null ? PIT_TIME.tyres : 0) + (pitSel.wing ? PIT_TIME.wing : 0) + (pitSel.repair ? PIT_TIME.repair : 0);
  $('pitBody').innerHTML = `
    <div class="pitstat">Lap ${clamp(c.lap + 1, 1, LAPS)}/${LAPS} · ${WEATHER[race.weather].icon} ${WEATHER[race.weather].name}</div>
    ${row('wing', 'Replace front wing', c.dmgWing, PIT_TIME.wing)}
    ${row('repair', 'Repair bodywork & suspension', c.dmgBody, PIT_TIME.repair)}
    <div class="pitrow" style="display:block">
      <div><span class="plbl">Tyres</span> – current <b style="color:${T.color}">${T.name}</b>,
        <span style="color:${condColor(c.wear)}">${pct(c.wear)} worn</span> <span class="psec">+${PIT_TIME.tyres.toFixed(1)}s</span></div>
      <div class="tyres" id="pitTyres" style="margin-top:8px"></div>
    </div>
    <div class="pittotal">Stationary time: <b>${total.toFixed(1)}s</b></div>`;
  $('pitBody').querySelectorAll('input[type=checkbox]').forEach((el) => el.addEventListener('change', () => { pitSel[el.dataset.k] = el.checked; renderPitMenu(); }));
  tyreButtons($('pitTyres'), pitSel.tyre, race.cond, (i) => { pitSel.tyre = i; Sound.beep(700, 0.06); renderPitMenu(); }, true);
}
function confirmPit() {
  const c = race.player;
  beginPitWork(c, { tyre: pitSel.tyre, wing: pitSel.wing, repair: pitSel.repair });
  state = 'race';
  showScreen(null); updateTouchUI();
}

// ---------------------------------------------------------------- race start / end
function startRace(ti, weather, tyre) {
  currentTrack = ti;
  ensureWorld(ti, weather);
  const t = getTrack(ti);
  const def = TRACKS[ti];
  const cond = WEATHER[weather].cond;
  if (carsGroup) scene.remove(carsGroup);
  carsGroup = new THREE.Group(); scene.add(carsGroup);
  particles.clear();
  const cars = [];
  const aiLiv = LIVERIES.map((l, i) => i).filter((i) => i !== save.livery);
  const nCars = 6;
  for (let k = 0; k < nCars; k++) {
    const isPlayer = k === nCars - 1;
    const gs = gridSlot(t, k);
    let aiTyre = bestTyre(cond);
    if (!isPlayer && Math.random() < 0.35) aiTyre = cond === 'dry' ? [0, 1, 2][(Math.random() * 3) | 0] : (aiTyre === 3 ? 4 : 3);
    const c = makeCar({
      x: gs.x, y: gs.y, a: gs.a, idx: gs.i, lap: gs.i > t.N / 2 ? -1 : 0,
      isPlayer, name: isPlayer ? 'YOU' : AI_NAMES[(k + ti * 3) % AI_NAMES.length],
      liv: isPlayer ? LIVERIES[save.livery] : LIVERIES[aiLiv[k % aiLiv.length]], lane: gs.off, laneTarget: gs.off,
      tyre: isPlayer ? tyre : aiTyre,
    });
    if (isPlayer) playerStats(c);
    else {
      const skill = def.ai * (0.95 + (k / (nCars - 1)) * 0.06) * (0.99 + Math.random() * 0.02);
      c.skill = skill; c.maxSpd = VREF * skill; c.accel = 500 * skill; c.corner = 0.60 + 0.38 * skill; c.grip = 8;
    }
    c.mesh = buildCarMesh(c.liv, c.tyre);
    carsGroup.add(c.mesh);
    cars.push(c);
  }
  const player = cars[cars.length - 1];
  race = { track: t, cars, player, time: 0, countdown: 3.6, lights: 0, finished: false, weather, cond, tyre,
    hintTime: 9, coins: 0, camYaw: player.a, camPos: null, licence: 0 };
  startLights.forEach((l) => (l.material = MAT.lightOff));
  state = 'countdown';
  showScreen(null);
  $('topBtns').classList.remove('hidden');
  updateTouchUI();
  CG.gameplayStart();
}

function pauseGame() {
  if (!race) return;
  race.prevState = state; state = 'paused';
  Sound.engine(0, 1, false); Sound.rain(0);
  CG.gameplayStop();
  showScreen('pause'); updateTouchUI();
}
function resumeGame() {
  if (!race) return;
  state = race.prevState || 'race';
  showScreen(state === 'pitmenu' ? 'pit' : null); updateTouchUI();
  CG.gameplayStart();
}
function toMenu() {
  race = null;
  if (carsGroup) { scene.remove(carsGroup); carsGroup = null; }
  particles.clear();
  Sound.engine(0, 1, false); Sound.rain(0);
  CG.gameplayStop();
  $('topBtns').classList.add('hidden');
  showMenu();
  updateTouchUI();
}

function finishRace() {
  const r = race, t = r.track, p = r.player;
  r.finished = true;
  CG.gameplayStop();
  const avg = (p.finishTime - p.penalty) / (LAPS * t.N);
  for (const c of r.cars) if (!c.finished) c.estTime = (p.finishTime - p.penalty) + (LAPS * t.N - progress(c, t)) * avg * 1.02 + c.penalty;
  // classification by total time including penalties
  const order = r.cars.slice().sort((a, b) => (a.finished ? a.finishTime : a.estTime) - (b.finished ? b.finishTime : b.estTime));
  const pos = order.indexOf(p) + 1;
  let coins = Math.round(PRIZE[pos - 1] * TRACKS[t.index].reward);
  const npen = p.penalties.length;
  let pts = Math.max(0, POINTS[pos - 1] - npen * 2);
  coins = Math.max(0, coins - npen * 15);
  r.coins = coins; r.pos = pos;
  save.coins += coins; save.races++; save.champPts += pts;
  save.licence = r.licence > 0 ? save.licence + r.licence : Math.max(0, save.licence - 1);
  const b = save.best[t.index];
  if (!b || pos < b.pos || (pos === b.pos && p.finishTime < b.time)) save.best[t.index] = { pos, time: p.finishTime };
  let unlockedNew = false;
  if (pos <= 3 && t.index + 1 < TRACKS.length && save.unlocked <= t.index + 1) { save.unlocked = t.index + 2; unlockedNew = true; }
  writeSave();
  if (pos <= 3) CG.happytime();
  Sound.fanfare(pos <= 3);
  $('resPos').textContent = ordinal(pos);
  $('resPos').style.color = pos === 1 ? '#ffd400' : pos <= 3 ? '#fff' : '#bbb';
  let msg = pos === 1 ? 'Victory! ' : pos <= 3 ? 'Podium! ' : 'Finish top 3 to unlock the next round. ';
  if (unlockedNew) msg += 'Next round unlocked! ';
  $('resMsg').innerHTML = msg + `<br><span style="color:#ffd400">+${pts} championship pts</span> (season: ${save.champPts})` +
    (npen ? `<br><span style="color:#ff6b6b">${npen} penalt${npen > 1 ? 'ies' : 'y'}: −${npen * 2} pts, +${r.licence} licence points (total ${save.licence}/12)</span>` :
      `<br><span style="opacity:.75">Clean race! Licence points: ${save.licence}/12</span>`);
  $('resTable').innerHTML = order.map((c, i) =>
    `<tr class="${c.isPlayer ? 'me' : ''}"><td>${i + 1}</td><td><span style="color:${c.liv.body}">■</span> ${c.name}
     <span style="color:${TYRES[c.tyre].color};font-weight:900">${TYRES[c.tyre].id}</span>${c.pits ? ` <small>${c.pits} stop</small>` : ''}</td>
     <td>${fmtTime(c.finished ? c.finishTime : c.estTime)}${c.penalty ? ` <small style="color:#ff6b6b">(+${c.penalty}s)</small>` : ''}</td></tr>`
  ).join('') + `<tr><td></td><td>Best lap</td><td>${fmtTime(p.bestLap)}</td></tr>`;
  $('resCoins').textContent = '+' + coins;
  const dbl = $('btnDouble');
  dbl.disabled = false; dbl.textContent = '▶ Watch ad: 2× coins'; dbl.classList.toggle('hidden', !CG.sdk || coins === 0);
  $('btnNext').classList.toggle('hidden', !(t.index + 1 < TRACKS.length && save.unlocked > t.index + 1));
  setTimeout(() => { if (race === r) { state = 'results'; showScreen('results'); updateTouchUI(); } }, 1800);
}
function sortOrder(r) {
  const t = r.track;
  return r.cars.slice().sort((a, b) => {
    if (a.finished && b.finished) return a.finishTime - b.finishTime;
    if (a.finished) return -1;
    if (b.finished) return 1;
    return progress(b, t) - progress(a, t);
  });
}
async function afterRace(action) {
  if (CG.sdk) await CG.ad('midgame');
  if (action === 'next') { toMenu(); openBrief(currentTrack + 1); }
  else if (action === 'retry') { toMenu(); openBrief(currentTrack); }
  else toMenu();
}

// ================================================================ simulation
function step(dt) {
  const r = race; if (!r) return;
  const t = r.track;
  if (state === 'countdown') {
    r.countdown -= dt;
    const lights = clamp(Math.floor((3.6 - r.countdown) / 0.55), 0, 5);
    if (lights !== r.lights && lights > 0 && r.countdown > 0.6) {
      r.lights = lights; Sound.beep(440, 0.12, 'square', 0.12);
      startLights.forEach((l, k) => (l.material = k < lights ? MAT.lightOn : MAT.lightOff));
    }
    if (r.countdown <= 0) {
      state = 'race'; r.lights = 0; Sound.beep(880, 0.4, 'square', 0.16); toast('GO!');
      startLights.forEach((l) => (l.material = MAT.lightOff));
    }
    for (const c of r.cars) { c.input.gas = 0; c.input.brake = 1; c.gripF = tyreGrip(c, r.cond); }
    return;
  }
  if (state !== 'race' && state !== 'results') return;
  r.time += dt; r.hintTime -= dt;
  for (const c of r.cars) {
    if (c.isPlayer && !AUTOPILOT && !c.finished) readPlayerInput(c);
    else aiControl(c, t, dt);
  }
  const pp = progress(r.player, t);
  for (const c of r.cars) {
    if (c.isPlayer) continue;
    const gap = progress(c, t) - pp;
    c.maxSpd = VREF * c.skill * clamp(1 - gap / 4000, 0.95, 1.04);
  }
  for (const c of r.cars) updateCar(c, dt, t, r.cond);
  collide(r.cars);
  if (r.player.finished && !r.finished) finishRace();
  for (const c of r.cars) if (c.flash > 0) c.flash -= dt;
}

function emitFX() {
  const r = race; if (!r) return;
  const wet = r.cond !== 'dry';
  for (const c of r.cars) {
    const sp = Math.max(0, c.speed);
    const bx = c.x - Math.cos(c.a) * 24, bz = c.y - Math.sin(c.a) * 24;
    if (wet && sp > 150 && Math.random() < (r.cond === 'wet' ? 0.9 : 0.45)) {
      for (let k = 0; k < 2; k++) particles.emit(bx + (Math.random() - 0.5) * 18, 3 + Math.random() * 3, bz + (Math.random() - 0.5) * 18,
        -c.vx * 0.15 + (Math.random() - 0.5) * 40, 25 + Math.random() * 30, -c.vy * 0.15 + (Math.random() - 0.5) * 40, [0.82, 0.86, 0.9], 0.6);
    } else if (!wet && (c.slip > 110 || c.spinT > 0 || (c.input.brake && sp > 350)) && Math.random() < 0.5) {
      particles.emit(bx, 3, bz, (Math.random() - 0.5) * 20, 15, (Math.random() - 0.5) * 20, [0.85, 0.85, 0.85], 0.8);
    }
    if (c.off && r.track.theme.runoff === 'grass' && sp > 80 && Math.random() < 0.6) {
      particles.emit(bx, 2, bz, (Math.random() - 0.5) * 30, 20, (Math.random() - 0.5) * 30, [0.45, 0.36, 0.22], 0.7);
    }
    if (c.dmgBody > 0.6 && Math.random() < c.dmgBody * 0.5) {
      particles.emit(c.x - Math.cos(c.a) * 14, 9, c.y - Math.sin(c.a) * 14, (Math.random() - 0.5) * 10, 30, (Math.random() - 0.5) * 10, [0.25, 0.25, 0.27], 1.0);
    }
  }
}

// ================================================================ camera & visuals sync
let camMode = 0;
const CAM_MODES = ['Chase', 'Far chase', 'Cockpit'];
function cycleCam() { camMode = (camMode + 1) % 3; save.cam = camMode; writeSave(); toast('Camera: ' + CAM_MODES[camMode]); }

const tmpV = new THREE.Vector3(), tmpL = new THREE.Vector3();
function syncCars() {
  if (!race) return;
  for (const c of race.cars) {
    const m = c.mesh;
    m.position.set(c.x, 0, c.y);
    m.rotation.y = -c.a;
    m.visible = !(c.isPlayer && camMode === 2) && !(c.flash > 0 && Math.floor(c.flash * 8) % 2);
    const ud = m.userData;
    for (const w of ud.wheels) w.rotation.z = -c.spin;
    for (const s of ud.steer) s.rotation.y = -c.steer * 0.35;
    ud.rearLight.material.emissiveIntensity = (race.cond !== 'dry' || c.input.brake) ? 3 : 0;
    // visible wing damage: endplates fall off, wing droops
    ud.fpL.visible = c.dmgWing < 0.45; ud.fpR.visible = c.dmgWing < 0.75;
    ud.fwing.rotation.x = c.dmgWing * 0.25; ud.fwing.position.y = -c.dmgWing * 1.2;
  }
}
function updateCamera(dt) {
  const W = window.innerWidth, H = window.innerHeight;
  const portrait = W < H;
  if (race) {
    const p = race.player;
    const sp = Math.max(0, p.speed);
    race.camYaw += wrapAngle(p.a - race.camYaw) * Math.min(1, dt * (camMode === 2 ? 30 : p.spinT > 0 ? 1.5 : 5));
    const fx = Math.cos(race.camYaw), fz = Math.sin(race.camYaw);
    const back = [70, 125, -3][camMode] + (portrait ? 25 : 0), h = [24, 46, 9.5][camMode];
    tmpV.set(p.x - fx * back, h, p.y - fz * back);
    if (!race.camPos || camMode === 2) race.camPos = tmpV.clone();
    else race.camPos.lerp(tmpV, 1 - Math.exp(-dt * 10));
    camera.position.copy(race.camPos);
    if (shake > 0) { camera.position.x += (Math.random() - 0.5) * shake * 4; camera.position.y += (Math.random() - 0.5) * shake * 3; shake = Math.max(0, shake - dt * 2.5); }
    tmpL.set(p.x + fx * (camMode === 2 ? 100 : 55), camMode === 2 ? 8 : 9, p.y + fz * (camMode === 2 ? 100 : 55));
    camera.lookAt(tmpL);
    camera.fov = (portrait ? 78 : 62) + 12 * Math.min(1, sp / VREF);
    camera.updateProjectionMatrix();
    sun.position.set(p.x + SUN_DIR.x * 1200, SUN_DIR.y * 1200, p.y + SUN_DIR.z * 1200);
    sun.target.position.set(p.x, 0, p.y);
  } else {
    const t = getTrack(menuTrack);
    menuT += dt;
    const i = Math.floor(menuT * 22) % t.N;
    const j = (i + 25) % t.N;
    camera.position.set(t.px[i] - t.nx[i] * t.w * 1.4, 90 + Math.sin(menuT * 0.3) * 20, t.py[i] - t.ny[i] * t.w * 1.4);
    camera.lookAt(t.px[j], 0, t.py[j]);
    camera.fov = portrait ? 75 : 55; camera.updateProjectionMatrix();
    sun.position.set(t.px[i] + SUN_DIR.x * 1200, SUN_DIR.y * 1200, t.py[i] + SUN_DIR.z * 1200);
    sun.target.position.set(t.px[j], 0, t.py[j]);
  }
  rainFX.update(dt, camera.position.x, camera.position.z);
  sky.position.copy(camera.position);
}

// ================================================================ HUD (2D overlay)
const hud = {
  cv: $('hud'), ctx: $('hud').getContext('2d'), W: 0, H: 0, dpr: 1,
  resize() {
    this.dpr = Math.min(2, window.devicePixelRatio || 1);
    this.W = window.innerWidth; this.H = window.innerHeight;
    this.cv.width = Math.round(this.W * this.dpr); this.cv.height = Math.round(this.H * this.dpr);
  },
};
function drawMap(cv, t, bg) {
  const g = cv.getContext('2d'), w = cv.width, h = cv.height;
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.clearRect(0, 0, w, h);
  if (bg) { g.fillStyle = bg; g.fillRect(0, 0, w, h); }
  const sc = Math.min((w - 30) / (t.maxX - t.minX), (h - 30) / (t.maxY - t.minY));
  g.translate(w / 2 - (t.minX + t.maxX) / 2 * sc, h / 2 - (t.minY + t.maxY) / 2 * sc); g.scale(sc, sc);
  g.lineJoin = 'round';
  g.strokeStyle = '#fff'; g.lineWidth = 9 / sc; g.stroke(t.path);
  g.strokeStyle = '#2b3142'; g.lineWidth = 5 / sc; g.stroke(t.path);
  g.fillStyle = '#ff2d2d'; g.beginPath(); g.arc(t.px[0], t.py[0], 6 / sc, 0, 7); g.fill();
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
function drawCarStatus(ctx, x, y, c) {
  // top-down car diagram: front wing, 4 tyres, body
  const tw = condColor(c.wear), wing = condColor(c.dmgWing), body = condColor(c.dmgBody);
  ctx.fillStyle = wing; ctx.fillRect(x + 4, y, 22, 4);                  // front wing
  ctx.fillStyle = tw;
  ctx.fillRect(x, y + 7, 6, 10); ctx.fillRect(x + 24, y + 7, 6, 10);    // front tyres
  ctx.fillRect(x - 1, y + 30, 7, 12); ctx.fillRect(x + 24, y + 30, 7, 12); // rear tyres
  ctx.fillStyle = body;
  ctx.beginPath(); ctx.moveTo(x + 13, y + 5); ctx.lineTo(x + 17, y + 5); ctx.lineTo(x + 21, y + 22); ctx.lineTo(x + 21, y + 40);
  ctx.lineTo(x + 9, y + 40); ctx.lineTo(x + 9, y + 22); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#ccc'; ctx.fillRect(x + 6, y + 44, 18, 3);           // rear wing
}
function drawHUD() {
  const ctx = hud.ctx, W = hud.W, H = hud.H;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, hud.cv.width, hud.cv.height);
  if (!race || COVER || CAPTURE) return;
  ctx.setTransform(hud.dpr, 0, 0, hud.dpr, 0, 0);
  const r = race, t = r.track, p = r.player;
  const small = W < 700 || H < 500;
  const PW = small ? 170 : 210;
  ctx.textBaseline = 'top';
  const order = sortOrder(r);
  const pos = order.indexOf(p) + 1;
  ctx.fillStyle = 'rgba(10,12,20,0.6)';
  ctx.fillRect(10, 10, PW, small ? 66 : 80);
  ctx.fillStyle = '#fff';
  ctx.font = `italic 900 ${small ? 34 : 42}px system-ui, Arial`;
  ctx.fillText(pos + '', 20, 16);
  const pw = ctx.measureText(pos + '').width;
  ctx.font = `italic 800 ${small ? 14 : 18}px system-ui, Arial`;
  ctx.fillText('/' + r.cars.length, 22 + pw, small ? 20 : 22);
  ctx.font = `800 ${small ? 13 : 15}px system-ui, Arial`;
  ctx.fillText('LAP ' + clamp(p.lap + 1, 1, LAPS) + '/' + LAPS, small ? 72 : 92, small ? 18 : 20);
  ctx.font = `600 ${small ? 12 : 14}px system-ui, Arial`;
  ctx.fillStyle = '#cfd3dc';
  ctx.fillText(fmtTime(r.time) + (p.penalty ? `  +${p.penalty}s` : ''), small ? 72 : 92, small ? 36 : 42);
  if (p.bestLap < Infinity) ctx.fillText('Best ' + fmtTime(p.bestLap), small ? 72 : 92, small ? 52 : 60);
  // car status panel
  const T = TYRES[p.tyre];
  const sy = small ? 82 : 96, sh = 56;
  ctx.fillStyle = 'rgba(10,12,20,0.6)'; ctx.fillRect(10, sy, PW, sh);
  drawCarStatus(ctx, 20, sy + 4, p);
  ctx.font = '700 12px system-ui, Arial'; ctx.fillStyle = '#fff';
  ctx.fillText('Tyre ', 62, sy + 6); ctx.fillStyle = T.color; ctx.font = '900 12px system-ui, Arial';
  ctx.fillText(T.id, 92, sy + 6);
  ctx.fillStyle = condColor(p.wear); ctx.font = '700 12px system-ui, Arial'; ctx.fillText(pct(p.wear) + ' worn', 106, sy + 6);
  ctx.fillStyle = condColor(p.dmgWing); ctx.fillText('Wing ' + pct(p.dmgWing), 62, sy + 22);
  ctx.fillStyle = condColor(p.dmgBody); ctx.fillText('Body ' + pct(p.dmgBody), 62, sy + 38);
  ctx.font = '18px system-ui'; ctx.fillText(WEATHER[r.weather].icon, PW - 16, sy + 30);
  // box box warning
  const needPit = p.wear > 0.8 || p.dmgWing > 0.55 || p.dmgBody > 0.55;
  if (needPit && !p.inPit && p.pitHold <= 0 && !p.finished && Math.floor(performance.now() / 500) % 2) {
    ctx.textAlign = 'center'; ctx.font = 'italic 900 22px system-ui, Arial'; ctx.fillStyle = '#ffd400';
    ctx.fillText('BOX BOX – pit lane on the right before the finish', W / 2, H * 0.12);
    ctx.textAlign = 'left';
  }
  if (p.inPit && p.pitHold <= 0 && state === 'race') {
    ctx.textAlign = 'center'; ctx.font = '900 18px system-ui, Arial'; ctx.fillStyle = '#ffd400';
    ctx.fillText('PIT LIMITER  80 km/h – stop in the yellow box', W / 2, H * 0.12); ctx.textAlign = 'left';
  }
  if (p.pitHold > 0) {
    ctx.textAlign = 'center'; ctx.font = 'italic 900 34px system-ui, Arial'; ctx.fillStyle = '#fff';
    ctx.fillText('PIT STOP  ' + p.pitHold.toFixed(1) + 's', W / 2, H * 0.3); ctx.textAlign = 'left';
  }
  if (!small) {
    let y = sy + sh + 8;
    for (let i = 0; i < order.length; i++) {
      const c = order[i];
      ctx.fillStyle = c.isPlayer ? 'rgba(225,6,0,0.85)' : 'rgba(10,12,20,0.6)';
      ctx.fillRect(10, y, 180, 22);
      ctx.fillStyle = c.liv.body; ctx.fillRect(10, y, 5, 22);
      ctx.fillStyle = '#fff'; ctx.font = '700 13px system-ui, Arial';
      ctx.fillText((i + 1) + '  ' + c.name + (c.pitHold > 0 || c.inPit ? '  PIT' : ''), 22, y + 4);
      ctx.fillStyle = TYRES[c.tyre].color; ctx.font = '900 12px system-ui, Arial'; ctx.fillText(TYRES[c.tyre].id, 172, y + 5);
      y += 24;
    }
  }
  // speed + gear
  const kmh = Math.round(Math.max(0, p.speed) * 0.36);
  const gear = p.speed < 5 ? 'N' : Math.min(8, 1 + Math.floor(Math.max(0, p.speed) / (p.maxSpd * 1.02) * 8));
  const sx = isTouch ? W / 2 : W - 20, by = H - 20;
  ctx.textAlign = isTouch ? 'center' : 'right'; ctx.textBaseline = 'bottom';
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.font = `italic 900 ${small ? 38 : 54}px system-ui, Arial`;
  ctx.fillText(kmh, sx + 2, by - 16);
  ctx.fillStyle = '#fff'; ctx.fillText(kmh, sx, by - 18);
  ctx.font = '800 13px system-ui, Arial'; ctx.fillText('KM/H  ·  GEAR ' + gear, sx, by);
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
  if (state === 'countdown') {
    const n = 5, rad = small ? 14 : 20, gap = rad * 2.6, w0 = gap * n;
    const x0 = W / 2 - w0 / 2, y0 = H * 0.16;
    ctx.fillStyle = 'rgba(10,12,20,0.85)'; ctx.fillRect(x0 - 8, y0 - rad - 10, w0 + 16, rad * 2 + 20);
    for (let i = 0; i < n; i++) {
      ctx.fillStyle = i < r.lights ? '#ff1a1a' : '#3a0d0d';
      ctx.beginPath(); ctx.arc(x0 + gap * (i + 0.5), y0, rad, 0, 7); ctx.fill();
    }
  }
  if (r.hintTime > 0 && !p.finished) {
    ctx.globalAlpha = clamp(r.hintTime, 0, 1);
    ctx.textAlign = 'center';
    const msg = isTouch ? 'Car accelerates by itself  •  ◀ ▶ steer  •  BRAKE before corners'
      : '↑ / W  Gas    ↓ / S  Brake    ← →  Steer    C  Camera';
    ctx.font = `800 ${small ? 14 : 18}px system-ui, Arial`;
    const tw = ctx.measureText(msg).width;
    const hy = H * (isTouch ? 0.44 : 0.72);
    ctx.fillStyle = 'rgba(10,12,20,0.75)'; ctx.fillRect(W / 2 - tw / 2 - 14, hy - 8, tw + 28, 36);
    ctx.fillStyle = '#fff'; ctx.fillText(msg, W / 2, hy);
    ctx.font = `600 ${small ? 12 : 14}px system-ui, Arial`;
    ctx.fillText('Finish in the top 3 · stay inside the white lines · avoid crashes', W / 2, hy + 34);
    ctx.globalAlpha = 1; ctx.textAlign = 'left';
  }
  if (p.wrongTime > 1 && state === 'race') {
    ctx.textAlign = 'center'; ctx.font = 'italic 900 40px system-ui, Arial';
    ctx.fillStyle = Math.floor(performance.now() / 300) % 2 ? '#ffd400' : '#ff2d2d';
    ctx.fillText('WRONG WAY', W / 2, H * 0.3);
    ctx.textAlign = 'left';
  }
}

// ================================================================ menus
let menuTrack = 0, menuT = 0;
const screens = ['menu', 'tracks', 'garage', 'pause', 'results', 'brief', 'pit'];
function showScreen(id) { for (const s of screens) $(s).classList.toggle('hidden', s !== id); }
function updateTouchUI() { $('touch').classList.toggle('hidden', !(isTouch && race && (state === 'race' || state === 'countdown'))); }
let toastTimer = 0;
function toast(msg) {
  const el = $('toast');
  el.textContent = msg; el.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.add('hidden'), 1600);
}
function nextTrackToPlay() {
  for (let i = 0; i < save.unlocked; i++) { const b = save.best[i]; if (!b || b.pos > 3) return i; }
  return save.unlocked - 1;
}
function showMenu() {
  state = 'menu';
  menuTrack = nextTrackToPlay();
  ensureWorld(menuTrack, TRACKS[menuTrack].night ? 'night' : 'sunny');
  $('menuCoins').textContent = save.coins;
  $('menuHint').innerHTML = `Season points: <b>${save.champPts}</b> · Licence points: <b>${save.licence}/12</b><br>` +
    (isTouch ? 'Tip: your car accelerates automatically – just steer and brake.'
      : 'Arrow keys / WASD to drive · C camera · P pause · R reset car · M mute');
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
    drawMap(cv, t, THEMES[def.theme].ground);
    const b = save.best[i];
    const medal = b ? (b.pos === 1 ? '🥇' : b.pos === 2 ? '🥈' : b.pos === 3 ? '🥉' : ordinal(b.pos)) : '';
    card.appendChild(cv);
    card.insertAdjacentHTML('beforeend', `<div class="name">${locked ? '🔒 ' : ''}R${i + 1} ${def.name} ${medal}</div>
      <div class="meta">${def.country} · ${locked ? 'Top 3 in previous round' : (b ? 'Best ' + fmtTime(b.time) : 'Not raced yet')}</div>`);
    if (!locked) card.addEventListener('click', () => openBrief(i));
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
      if (save.coins >= cost && save.up[u.key] < UPG_MAX) { save.coins -= cost; save.up[u.key]++; writeSave(); Sound.beep(880, 0.12, 'square', 0.12); buildGarage(); }
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
click('btnPlay', () => openBrief(nextTrackToPlay()));
click('btnTracks', () => { buildTrackCards(); showScreen('tracks'); });
click('btnGarage', () => { buildGarage(); showScreen('garage'); });
document.querySelectorAll('[data-back]').forEach((b) => b.addEventListener('click', showMenu));
click('bBack', showMenu);
click('bStart', () => startRace(brief.track, brief.weather, brief.tyre));
click('pitGo', confirmPit);
click('btnPause', () => { if (state === 'paused') resumeGame(); else if (state === 'race' || state === 'countdown' || state === 'pitmenu') pauseGame(); });
click('btnMute', toggleMute);
click('btnCam', cycleCam);
click('btnResume', resumeGame);
click('btnRestart', () => startRace(currentTrack, race.weather, race.tyre));
click('btnQuit', toMenu);
click('btnNext', () => afterRace('next'));
click('btnRetry', () => afterRace('retry'));
click('btnMenu', () => afterRace('menu'));
click('btnDouble', async () => {
  const b = $('btnDouble');
  if (b.disabled || !race) return;
  b.disabled = true;
  const ok = await CG.ad('rewarded');
  if (ok && race) { save.coins += race.coins; writeSave(); $('resCoins').textContent = '+' + race.coins * 2; b.textContent = '✓ Coins doubled'; }
  else { b.disabled = false; toast('Ad not available right now'); }
});

// ================================================================ main loop
let last = performance.now(), acc = 0;
function frame(now) {
  const dt = CAPTURE ? 1 / 30 : Math.min(0.1, (now - last) / 1000);
  last = now;
  if (race && state !== 'paused' && state !== 'cover' && state !== 'pitmenu') {
    acc += dt * TIME_SCALE;
    let n = 0;
    while (acc >= STEP && n < 60 * TIME_SCALE) { step(STEP); acc -= STEP; n++; }
    const p = race.player;
    Sound.engine(p.speed, p.maxSpd, state === 'race' || state === 'countdown' || state === 'results');
    Sound.rain(rainFX.amount / 1600);
    emitFX();
    particles.update(dt);
  } else acc = 0;
  if (state !== 'cover') { syncCars(); updateCamera(dt); }
  renderer.render(scene, camera);
  drawHUD();
  if (!CAPTURE) requestAnimationFrame(frame);
}

// ================================================================ boot
async function boot() {
  await CG.init();
  CG.loadingStart();
  loadSave();
  camMode = save.cam || 0;
  makeTextures();
  initMaterials();
  particles.init(); rainFX.init();
  resize();
  window.addEventListener('resize', resize);
  Sound.applyMute();
  CG.onSettings(() => Sound.applyMute());
  if (COVER) setupCover();
  else if (AUTOPILOT || params.has('race')) {
    const ti = +params.get('race') || 0;
    const wx = params.get('weather') || rollWeather(TRACKS[ti]);
    startRace(ti, wx, params.has('tyre') ? +params.get('tyre') : bestTyre(WEATHER[wx].cond));
  } else showMenu();
  $('loading').classList.add('hidden');
  CG.loadingStop();
  window.__game = { get race() { return race; }, get state() { return state; } };
  if (CAPTURE) {
    document.body.classList.add('capture');
    window.__advance = (n = 1) => { for (let i = 0; i < n; i++) frame(performance.now()); };
  } else requestAnimationFrame(frame);
}

function setupCover() {
  const ti = +params.get('track') || 0;
  const wx = params.get('weather') || 'sunny';
  startRace(ti, wx, 0);
  const t = race.track;
  const base = Math.floor(t.N * (+params.get('at') || 0.05));
  race.cars.forEach((c, k) => {
    const i = (base + (5 - k) * 9) % t.N, off = ((k % 3) - 1) * t.w * 0.27;
    c.x = t.px[i] + t.nx[i] * off; c.y = t.py[i] + t.ny[i] * off; c.a = t.ang[i]; c.idx = i; c.steer = 0.2;
  });
  syncCars();
  const p = race.player;
  const fx = Math.cos(p.a), fz = Math.sin(p.a);
  camera.position.set(p.x - fx * 55 - fz * 30, 16, p.y - fz * 55 + fx * 30);
  camera.lookAt(p.x + fx * 60, 6, p.y + fz * 60);
  camera.fov = 55; camera.updateProjectionMatrix();
  sun.position.set(p.x + SUN_DIR.x * 1200, SUN_DIR.y * 1200, p.y + SUN_DIR.z * 1200);
  sun.target.position.set(p.x, 0, p.y);
  sky.position.copy(camera.position);
  $('topBtns').classList.add('hidden');
  $('touch').classList.add('hidden');
  state = 'cover';
  window.__coverReady = true;
}

boot().catch((e) => { console.error(e); $('loading').textContent = 'Error: ' + e.message; });
