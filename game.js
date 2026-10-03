/* =====================================================================
   KuKirin Wheelie Run
   Vanilla JS · Canvas 2D · Web Audio · brak zależności i backendu.
   Sekcje: CONFIG · UTILS · STORE · AUDIO · INPUT · GAME/PHYSICS ·
           SPAWNER · RENDER · HUD · UI · MAIN LOOP
   ===================================================================== */
(function () {
'use strict';

// =====================================================================
// CONFIG — wszystkie parametry "game feel" w jednym miejscu
// =====================================================================
const CONFIG = {
  // ---------- BALANS: odwrócone wahadło wokół tylnej osi (stopnie, sekundy) ----------
  physicsHz: 120,              // częstotliwość stałego kroku fizyki
  gravity: 150,                // [°/s²] moment grawitacji przy 90° odchylenia od punktu równowagi
  damping: 0.9,                // [1/s] tłumienie prędkości kątowej
  inertia: 1.0,                // bezwładność: dzieli wszystkie momenty (więcej = ociężale)
  correctionForce: 400,        // [°/s²] maksymalny moment korekty A/D
  correctionRampUp: 0.20,      // [s] narastanie korekty 0→100% przy trzymaniu klawisza
  correctionRampDown: 0.08,    // [s] wygaszanie korekty po puszczeniu
  correctionCurve: 0.8,        // kształt rampy (<1 = mocniejszy chwyt na starcie)
  catchAssist: 0.35,           // bonus siły, gdy korekta hamuje bieżący obrót ("łapanie")
  maxAngularVelocity: 320,     // [°/s] limit prędkości kątowej
  yellowMargin: 12,            // [°] szerokość żółtej strefy po obu stronach sweet spotu
  perfectBand: 4,              // [°] ± od środka sweet spotu = "perfect"
  perfectTime: 2.5,            // [s] ciągłego perfect = bonus
  startAngle: 44,              // [°] kąt na starcie
  startGrace: 1.6,             // [s] płynne narastanie grawitacji i zakłóceń po starcie
  noiseTorque: 14,             // [°/s²] ciągłe drgania nawierzchni
  microBumpImpulse: 9,         // [°/s] losowe mikro-uderzenia (co ~1 s)
  bumpImpulse: 34,             // [°/s] nierówność drogi
  manholeImpulse: 68,          // [°/s] studzienka
  coneImpulse: 92,             // [°/s] pachołek

  // ---------- PASY ----------
  laneChangeTime: 0.25,        // [s] animacja zmiany pasa
  laneChangeCooldown: 0.12,    // [s] przerwa po zmianie pasa
  laneChangeImpulse: 32,       // [°/s] impuls kątowy przy zmianie pasa (× prędkość/bazowa)
  laneInputBuffer: 0.18,       // [s] bufor wciśnięcia W/S w trakcie animacji

  // ---------- PRĘDKOŚĆ ----------
  baseSpeed: 10,               // [m/s] prędkość początkowa (36 km/h)
  maxSpeed: 24,                // [m/s] prędkość docelowa (86 km/h, bez boosta)
  speedRampTime: 150,          // [s] stała czasowa przyspieszania: po tym czasie ~63% drogi do maxSpeed
  laneImpulseMaxScale: 1.5,    // limit skalowania impulsu zmiany pasa z prędkością
  carSpeedFactor: 0.3,         // prędkość aut na pasach jako ułamek prędkości gracza
  frontDropSlowdown: 0.65,     // mnożnik prędkości tuż po opadnięciu na przednie koło
  frontDropRecover: 1.6,       // [s] powrót do pełnej prędkości

  // ---------- BOOST / BATERIE ----------
  boostCost: 30,               // [%] koszt boosta
  boostDuration: 1.4,          // [s]
  boostSpeedMul: 1.55,         // mnożnik prędkości
  boostKick: 55,               // [°/s] natychmiastowe szarpnięcie kąta w górę
  boostTorque: 70,             // [°/s²] dodatkowy moment unoszący na początku boosta
  boostTorqueTime: 0.5,        // [s] czas działania boostTorque
  boostCooldown: 1.1,          // [s]
  batteryValue: 12,            // [%] ładowanie z jednej baterii
  startBattery: 40,            // [%]

  // ---------- WIATR ----------
  windTorque: 60,              // [°/s²] siła podmuchu
  windStartDistance: 300,      // [m] od kiedy wieje
  windIntervalMin: 8,          // [s]
  windIntervalMax: 16,         // [s]
  windWarnTime: 1.0,           // [s] ostrzeżenie w HUD przed podmuchem

  // ---------- TRUDNOŚĆ W CZASIE ----------
  difficultyRampDistance: 4000, // [m] dystans do pełnej trudności
  difficultyGravityGain: 0.35,  // +35% grawitacji przy pełnej trudności
  difficultyNoiseGain: 1.0,     // +100% zakłóceń
  difficultyWindGain: 0.6,      // +60% siły wiatru

  // ---------- PUNKTY ----------
  comboStepTime: 2.5,          // [s] w sweet spocie na kolejny poziom combo
  maxCombo: 5,
  pointsPerMeter: 1,
  pointsSweetPerSecond: 20,
  pointsBattery: 50,
  pointsCloseCall: 150,
  pointsPerfect: 300,
  pointsChain: 200,
  pointsMission: 1000,
  pedestrianPenalty: 500,
  pedestrianBatteryLoss: 30,
  pedestrianInvuln: 2,         // [s] nietykalności po potrąceniu pieszego

  // ---------- ŚWIAT ----------
  pxPerMeter: 48,
  stageLength: 1000,           // [m] co ile zmienia się pora dnia
  spawnAhead: 90,              // [m] jak daleko z przodu generować wzorce
  introDistance: 60,           // [m] spokojny start (tylko baterie)

  // ---------- OPCJE ----------
  invertBalance: false,        // odwraca kierunek A/D (oraz ◀ ▶ i przechyłu)
  difficulty: 'normal',        // domyślny poziom (nadpisywany zapisanym ustawieniem)
  difficulties: {
    easy:   { label: 'ŁATWY',    sweetMin: 30, sweetMax: 60, gravityMul: 0.75, dampingMul: 1.5,  crashAngle: 85, speedMul: 0.92, noiseMul: 0.7, lives: 4 },
    normal: { label: 'NORMALNY', sweetMin: 35, sweetMax: 55, gravityMul: 1.0,  dampingMul: 1.0,  crashAngle: 80, speedMul: 1.0,  noiseMul: 1.0, lives: 3 },
    hard:   { label: 'TRUDNY',   sweetMin: 40, sweetMax: 52, gravityMul: 1.25, dampingMul: 0.75, crashAngle: 75, speedMul: 1.1,  noiseMul: 1.3, lives: 2 },
  },
  debug: false,
};

// =====================================================================
// UTILS
// =====================================================================
const DEG = Math.PI / 180;
const TAU = Math.PI * 2;
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const smoothstep = t => t * t * (3 - 2 * t);
const easeInOutSine = t => -(Math.cos(Math.PI * t) - 1) / 2;
const sgn = v => (v > 0 ? 1 : v < 0 ? -1 : 0);
const moveToward = (v, target, d) => (Math.abs(target - v) <= d ? target : v + Math.sign(target - v) * d);
const expK = (rate, dt) => 1 - Math.exp(-rate * dt);

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hash1(n) {
  let h = Math.imul((n | 0) ^ 0x9e3779b9, 0x85ebca6b);
  h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35); h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}
const hash2 = (a, b) => hash1(Math.imul(a | 0, 73856093) ^ Math.imul(b | 0, 19349663));
function hexRgb(hex) { const n = parseInt(hex.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
function rgb(c, a) { return a === undefined || a >= 1 ? `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})` : `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a.toFixed(3)})`; }
const fmt = n => String(Math.max(0, Math.floor(n))).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
const pickFrom = (arr, r) => arr[Math.floor(r() * arr.length) % arr.length];

function rr(c, x, y, w, h, r) {
  r = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
  c.beginPath();
  c.moveTo(x + r, y); c.lineTo(x + w - r, y); c.quadraticCurveTo(x + w, y, x + w, y + r);
  c.lineTo(x + w, y + h - r); c.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  c.lineTo(x + r, y + h); c.quadraticCurveTo(x, y + h, x, y + h - r);
  c.lineTo(x, y + r); c.quadraticCurveTo(x, y, x + r, y); c.closePath();
}
function circle(c, x, y, r) { c.beginPath(); c.arc(x, y, Math.max(0.01, r), 0, TAU); c.fill(); }
function line(c, x1, y1, x2, y2) { c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke(); }
const FONT_R = '"Russo One", "Orbitron", sans-serif';
const FONT_O = 'Orbitron, "Russo One", sans-serif';
const fontR = size => `${size}px ${FONT_R}`;
const fontO = (size, w = 900) => `${w} ${size}px ${FONT_O}`;

/** Pula obiektów: brak alokacji w trakcie gry. */
class Pool {
  constructor(factory, size) { this.factory = factory; this.items = []; this.cursor = 0; for (let i = 0; i < size; i++) this.items.push(factory()); }
  spawn() {
    const n = this.items.length;
    for (let k = 0; k < n; k++) {
      const i = (this.cursor + k) % n;
      const it = this.items[i];
      if (!it.active) { it.active = true; this.cursor = (i + 1) % n; return it; }
    }
    const it = this.factory(); it.active = true; this.items.push(it); return it;
  }
  clear() { for (const it of this.items) it.active = false; }
  count() { let c = 0; for (const it of this.items) if (it.active) c++; return c; }
}

// prerenderowane sprite'y poświaty
const glowCache = new Map();
function glowSprite(hex) {
  let cv = glowCache.get(hex);
  if (cv) return cv;
  const c = hexRgb(hex);
  cv = document.createElement('canvas'); cv.width = cv.height = 128;
  const g = cv.getContext('2d');
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, rgb(c, 0.95)); gr.addColorStop(0.3, rgb(c, 0.45)); gr.addColorStop(1, rgb(c, 0.001));
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  glowCache.set(hex, cv);
  return cv;
}
function drawGlow(c, hex, x, y, r, a) {
  if (a <= 0.01 || r <= 0) return;
  const op = c.globalCompositeOperation, ga = c.globalAlpha;
  c.globalCompositeOperation = 'lighter'; c.globalAlpha = ga * Math.min(1, a);
  c.drawImage(glowSprite(hex), x - r, y - r, r * 2, r * 2);
  c.globalCompositeOperation = op; c.globalAlpha = ga;
}

// =====================================================================
// STORE — localStorage (rekordy + ustawienia)
// =====================================================================
const Store = {
  KEY: 'kukirin-wheelie-run-v1',
  data: {
    best: 0, bestDistance: 0, longestWheelie: 0, bestCombo: 1, batteriesTotal: 0, runs: 0,
    settings: { difficulty: CONFIG.difficulty, muted: false, music: 0.6, invert: CONFIG.invertBalance, tilt: false },
  },
  load() {
    try {
      const raw = localStorage.getItem(this.KEY);
      if (!raw) return;
      const d = JSON.parse(raw);
      const settings = Object.assign({}, this.data.settings, d.settings || {});
      Object.assign(this.data, d);
      this.data.settings = settings;
    } catch (e) { /* tryb prywatny lub zablokowany storage — gra działa bez zapisu */ }
  },
  save() { try { localStorage.setItem(this.KEY, JSON.stringify(this.data)); } catch (e) { /* ignoruj */ } },
};

// =====================================================================
// AUDIO — Web Audio API (silnik, efekty, proceduralny synthwave)
// =====================================================================
const Sound = {
  ctx: null, master: null, sfx: null, music: null, noise: null, engine: null,
  muted: false, musicVolume: 0.6, musicLevel: 0.5, seq: null, timer: null,

  init() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {}); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try { this.ctx = new AC(); } catch (e) { this.ctx = null; return; }
    const c = this.ctx;
    this.master = c.createGain(); this.master.gain.value = this.muted ? 0 : 0.9;
    const comp = c.createDynamicsCompressor();
    comp.threshold.value = -16; comp.ratio.value = 4; comp.attack.value = 0.004; comp.release.value = 0.2;
    this.master.connect(comp); comp.connect(c.destination);
    this.sfx = c.createGain(); this.sfx.gain.value = 0.85; this.sfx.connect(this.master);
    this.music = c.createGain(); this.music.gain.value = 0; this.music.connect(this.master);
    const len = c.sampleRate * 2, buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    this.noise = buf;
    this.initEngine();
    this.seq = { step: 0, next: c.currentTime + 0.15, bpm: 104 };
    this.timer = setInterval(() => this.schedule(), 25);
    this.applyMusic();
    if (c.state === 'suspended') c.resume().catch(() => {});
  },
  setMuted(m) {
    this.muted = m;
    if (this.master) this.master.gain.setTargetAtTime(m ? 0 : 0.9, this.ctx.currentTime, 0.03);
  },
  setMusicVolume(v) { this.musicVolume = v; this.applyMusic(); },
  setMusicLevel(l) { this.musicLevel = l; this.applyMusic(); },
  applyMusic() {
    if (!this.music) return;
    this.music.gain.setTargetAtTime(this.musicVolume * 0.55 * this.musicLevel, this.ctx.currentTime, 0.25);
  },

  initEngine() {
    const c = this.ctx;
    const g = c.createGain(); g.gain.value = 0;
    const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 800; f.Q.value = 2;
    const o1 = c.createOscillator(); o1.type = 'sawtooth'; o1.frequency.value = 60;
    const o2 = c.createOscillator(); o2.type = 'square'; o2.frequency.value = 30;
    const o2g = c.createGain(); o2g.gain.value = 0.35;
    const wh = c.createOscillator(); wh.type = 'sine'; wh.frequency.value = 500;
    const whg = c.createGain(); whg.gain.value = 0.3;
    const n = c.createBufferSource(); n.buffer = this.noise; n.loop = true;
    const nf = c.createBiquadFilter(); nf.type = 'bandpass'; nf.frequency.value = 320; nf.Q.value = 0.8;
    const ng = c.createGain(); ng.gain.value = 0.35;
    o1.connect(f); o2.connect(o2g); o2g.connect(f); f.connect(g);
    wh.connect(whg); whg.connect(g);
    n.connect(nf); nf.connect(ng); ng.connect(g);
    g.connect(this.sfx);
    o1.start(); o2.start(); wh.start(); n.start();
    this.engine = { g, f, o1, o2, wh, nf };
  },
  setEngine(on, speed, boost, theta) {
    if (!this.engine) return;
    const t = this.ctx.currentTime, e = this.engine;
    e.g.gain.setTargetAtTime(on ? 0.06 + boost * 0.05 : 0, t, 0.08);
    e.o1.frequency.setTargetAtTime(46 + speed * 5 + boost * 34, t, 0.12);
    e.o2.frequency.setTargetAtTime(23 + speed * 2.5 + boost * 17, t, 0.12);
    e.wh.frequency.setTargetAtTime(360 + speed * 36 + boost * 280 + theta * 1.2, t, 0.12);
    e.f.frequency.setTargetAtTime(450 + speed * 45 + boost * 1000, t, 0.12);
    e.nf.frequency.setTargetAtTime(200 + speed * 22, t, 0.2);
  },

  tone(freq, dur, o = {}) {
    if (!this.ctx) return;
    const c = this.ctx, t = c.currentTime + (o.delay || 0);
    const osc = c.createOscillator(); osc.type = o.type || 'sine';
    osc.frequency.setValueAtTime(freq, t);
    if (o.slide) osc.frequency.exponentialRampToValueAtTime(o.slide, t + dur);
    if (o.detune) osc.detune.value = o.detune;
    const g = c.createGain(), vol = o.vol || 0.2, att = o.attack || 0.005;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + att);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    let node = osc;
    if (o.filter) { const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = o.filter; osc.connect(f); node = f; }
    node.connect(g); g.connect(o.bus || this.sfx);
    osc.start(t); osc.stop(t + dur + 0.05);
  },
  noiseBurst(dur, o = {}) {
    if (!this.ctx) return;
    const c = this.ctx, t = c.currentTime + (o.delay || 0);
    const s = c.createBufferSource(); s.buffer = this.noise; s.loop = true;
    const f = c.createBiquadFilter(); f.type = o.type || 'lowpass'; f.Q.value = o.q || 1;
    f.frequency.setValueAtTime(o.freq || 1000, t);
    if (o.freqEnd) f.frequency.exponentialRampToValueAtTime(o.freqEnd, t + dur);
    const g = c.createGain();
    g.gain.setValueAtTime(o.vol || 0.2, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(o.bus || this.sfx);
    s.start(t, Math.random() * 1.5); s.stop(t + dur + 0.05);
  },

  // ---------- muzyka: sekwencer z wyprzedzeniem ----------
  schedule() {
    if (!this.ctx || this.ctx.state !== 'running') return;
    const s = this.seq, spb = 60 / s.bpm / 4, now = this.ctx.currentTime;
    if (s.next < now - 0.2) s.next = now + 0.05;
    while (s.next < now + 0.14) { this.playStep(s.step, s.next, spb); s.next += spb; s.step = (s.step + 1) % 64; }
  },
  playStep(step, t, spb) {
    const c = this.ctx, bus = this.music, lvl = this.musicLevel;
    const bar = (step >> 4) & 3, st = step & 15;
    const roots = [45, 41, 48, 43];                          // Am F C G
    const chords = [[57, 60, 64], [53, 57, 60], [55, 60, 64], [55, 59, 62]];
    const hz = m => 440 * Math.pow(2, (m - 69) / 12);
    const at = t - c.currentTime;
    const full = lvl > 0.6;
    if (full) {
      if (st % 4 === 0) this.tone(150, 0.28, { slide: 42, vol: 0.55, bus, delay: at });
      if (st === 4 || st === 12) { this.noiseBurst(0.16, { type: 'highpass', freq: 1600, vol: 0.22, bus, delay: at }); this.tone(190, 0.1, { vol: 0.12, bus, delay: at }); }
      if (st % 2 === 1) this.noiseBurst(0.035, { type: 'highpass', freq: 7500, vol: st % 4 === 3 ? 0.07 : 0.035, bus, delay: at });
      const arp = chords[bar][[0, 1, 2, 1][st % 4]] + (st >= 8 ? 12 : 0);
      this.tone(hz(arp + 12), spb * 0.9, { type: 'square', vol: 0.03, filter: 2600, bus, delay: at });
    }
    if (st % 2 === 0) {
      const n = roots[bar] - 12 + (st % 4 === 2 ? 12 : 0);
      this.tone(hz(n), spb * 1.7, { type: 'sawtooth', vol: full ? 0.12 : 0.08, filter: 420, bus, delay: at });
    }
    if (st === 0) {
      for (const m of chords[bar]) {
        this.tone(hz(m), spb * 16, { type: 'sawtooth', vol: 0.028, filter: 1100, attack: 0.35, detune: -8, bus, delay: at });
        this.tone(hz(m), spb * 16, { type: 'sawtooth', vol: 0.028, filter: 1100, attack: 0.35, detune: 8, bus, delay: at });
      }
    }
  },

  // ---------- efekty ----------
  collect(n) {
    const b = 660 * Math.pow(2, Math.min(n - 1, 9) / 12);
    this.tone(b, 0.12, { type: 'triangle', vol: 0.22 });
    this.tone(b * 1.5, 0.15, { type: 'triangle', vol: 0.17, delay: 0.05 });
    this.tone(b * 2, 0.22, { type: 'sine', vol: 0.12, delay: 0.1 });
  },
  boost() {
    this.noiseBurst(0.75, { vol: 0.35, type: 'bandpass', freq: 300, freqEnd: 4200, q: 1.2 });
    this.tone(110, 0.65, { type: 'sawtooth', vol: 0.16, slide: 480, filter: 1900 });
  },
  lane(dir) { this.noiseBurst(0.16, { vol: 0.12, type: 'bandpass', freq: dir < 0 ? 1800 : 1200, freqEnd: dir < 0 ? 4200 : 700, q: 0.8 }); },
  deny() { this.tone(180, 0.09, { type: 'square', vol: 0.07 }); this.tone(140, 0.1, { type: 'square', vol: 0.07, delay: 0.08 }); },
  zone(z) {
    if (z === 'green') { this.tone(880, 0.14, { vol: 0.11, slide: 1320 }); }
    else if (z === 'yellow') this.tone(560, 0.06, { type: 'triangle', vol: 0.08 });
    else if (z === 'red') this.tone(320, 0.12, { type: 'square', vol: 0.06, filter: 1600 });
  },
  warn() { this.tone(1250, 0.05, { type: 'square', vol: 0.045, filter: 3000 }); },
  combo(n) { for (let i = 0; i < n; i++) this.tone(523 * Math.pow(2, (i * 4) / 12), 0.14, { type: 'triangle', vol: 0.14, delay: i * 0.055 }); },
  perfect() { [1047, 1319, 1568, 2093].forEach((f, i) => this.tone(f, 0.55, { type: 'triangle', vol: 0.1, delay: i * 0.06 })); },
  closeCall() { this.noiseBurst(0.4, { vol: 0.28, type: 'bandpass', freq: 4200, freqEnd: 380, q: 2 }); this.tone(700, 0.22, { vol: 0.12, slide: 1500 }); },
  frontDrop() { this.tone(150, 0.28, { vol: 0.5, slide: 42 }); this.noiseBurst(0.22, { vol: 0.25, freq: 700 }); },
  bump(k = 1) { this.tone(95, 0.16, { vol: 0.3 * k, slide: 48 }); this.noiseBurst(0.08, { vol: 0.08 * k, freq: 900 }); },
  manhole() { this.tone(330, 0.2, { type: 'square', vol: 0.07, filter: 1500 }); this.tone(221, 0.28, { type: 'square', vol: 0.06, filter: 1200, delay: 0.03 }); this.bump(1); },
  cone() { this.tone(480, 0.14, { type: 'triangle', vol: 0.22, slide: 170 }); this.noiseBurst(0.1, { vol: 0.1, type: 'bandpass', freq: 1200 }); },
  horn() { this.tone(392, 0.4, { type: 'square', vol: 0.06, filter: 1700 }); this.tone(494, 0.4, { type: 'square', vol: 0.06, filter: 1700 }); },
  crash() {
    this.noiseBurst(1.1, { vol: 0.5, freq: 2200, freqEnd: 110 });
    this.tone(120, 0.55, { vol: 0.5, slide: 30 });
    this.tone(640, 0.3, { type: 'square', vol: 0.05, filter: 2400, slide: 300, delay: 0.05 });
  },
  pedHit() { this.tone(520, 0.12, { vol: 0.2, slide: 950 }); this.tone(950, 0.16, { vol: 0.14, slide: 480, delay: 0.12 }); this.bump(0.8); },
  go() { [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.22, { type: 'square', vol: 0.06, filter: 3000, delay: i * 0.07 })); },
  stage() { [392, 494, 587, 784].forEach((f, i) => this.tone(f, 0.6, { type: 'triangle', vol: 0.1, delay: i * 0.09 })); },
  mission() { [784, 988, 1175, 1568, 1976].forEach((f, i) => this.tone(f, 0.3, { type: 'triangle', vol: 0.12, delay: i * 0.07 })); },
  lowBattery() { this.tone(300, 0.12, { type: 'triangle', vol: 0.1, slide: 200 }); },
  click() { this.tone(1200, 0.04, { type: 'triangle', vol: 0.08 }); },
};

// =====================================================================
// INPUT — klawiatura, dotyk, przechył
// =====================================================================
const Input = {
  keys: new Set(),
  touchBack: false, touchFwd: false,
  tilt: 0, tiltEnabled: false, tiltZero: null,
  /** Oś balansu: +1 = pochylenie do tyłu (unosi przód), -1 = do przodu. */
  axis() {
    const k = this.keys;
    let a = 0;
    if (k.has('KeyA') || k.has('ArrowLeft') || this.touchBack) a += 1;
    if (k.has('KeyD') || k.has('ArrowRight') || this.touchFwd) a -= 1;
    if (a === 0 && this.tiltEnabled) a = this.tilt;
    return a;
  },
};

// =====================================================================
// CANVAS / WSPÓŁRZĘDNE
// =====================================================================
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d', { alpha: false });
let W = 1280, H = 720, SCALE = 1, OX = 0, OY = 0, PSX = 360;

const PX = CONFIG.pxPerMeter;
const HERO = 0.8;               // skala hulajnogi+jeźdźca (px na jednostkę lokalną przy głębokości 1)
const WHEEL_R = 24, WHEELBASE = 118;
const ROAD = { y0: 505, gap: 71.5, s0: 0.8, ds: 0.1 };
const laneY = lf => ROAD.y0 + lf * ROAD.gap;
const laneS = lf => ROAD.s0 + lf * ROAD.ds;
const HORIZON = laneY(-1.08);
const sxAt = (wx, lf, camX) => PSX + (wx - camX) * PX * laneS(lf);

function resize() {
  const cw = Math.max(1, window.innerWidth), ch = Math.max(1, window.innerHeight);
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(cw * dpr); canvas.height = Math.round(ch * dpr);
  H = 720; W = clamp((H * cw) / ch, 960, 1800);
  SCALE = Math.min(canvas.width / W, canvas.height / H);
  OX = (canvas.width - W * SCALE) / 2; OY = (canvas.height - H * SCALE) / 2;
  PSX = Math.min(W * 0.28, 400);
}
const viewAheadMeters = () => (W - PSX) / (PX * 0.75 * 0.9);

// =====================================================================
// GAME STATE
// =====================================================================
const S = { MENU: 'MENU', PLAYING: 'PLAYING', PAUSED: 'PAUSED', GAMEOVER: 'GAMEOVER' };
const G = {
  state: S.MENU, rng: Math.random, seed: 1, runTime: 0, timeScale: 1, diff: 0, score: 0,
  stats: null, mission: null, missionDone: false, trauma: 0, banner: null, stage: 0,
  wind: null, chain: { count: 0, lastT: -9 }, ph1: 0, ph2: 0, ph3: 0,
  crashReal: 0, overT: 0, menuT: 0, difficulty: 'normal', debug: false, fps: 60,
  overReason: '', flash: { color: '#fff', a: 0 }, perfectFx: 0,
};
const ZONE_COL = { green: '#3dff6b', yellow: '#ffd400', redHigh: '#ff3d5a', redLow: '#ff3d5a', ground: '#8fa3c8' };
const isRed = z => z === 'redHigh' || z === 'redLow';

const player = {};
const cam = { zoom: 1, offY: 0 };
const diffDef = () => CONFIG.difficulties[G.difficulty] || CONFIG.difficulties.normal;
const sweetCenter = D => (D.sweetMin + D.sweetMax) / 2;
/** Prędkość bazowa rośnie sama z czasem jazdy (płynnie, asymptotycznie do maxSpeed). */
const speedAtTime = t => (CONFIG.baseSpeed + (CONFIG.maxSpeed - CONFIG.baseSpeed) * (1 - Math.exp(-Math.max(0, t) / CONFIG.speedRampTime))) * diffDef().speedMul;
/** Prędkość bazowa w chwili, gdy gracz dojedzie do pozycji x (do planowania wzorców). */
const baseSpeedAt = x => speedAtTime(G.runTime + Math.max(0, (x - (player.x || 0)) / Math.max(1, player.v || CONFIG.baseSpeed)));

// ---------- pule ----------
const OBJ_DEFAULTS = {
  kind: '', x: 0, px: 0, laneF: 0, plf: 0, v: 0, laneV: 0, walkV: 0, len: 0, half: 0.32,
  state: '', t: 0, t2: 0, color: '#fff', color2: '#333', skin: '#c98d6b', variant: 0,
  hit: false, passed: false, threat: false, minGap: 9, honked: false, travel: 0,
  fx: 0, fy: 0, fvx: 0, fvy: 0, rot: 0, vr: 0, phase: 0, hop: 0, dodgeT: 0, startLane: 0, target: 0,
};
const objects = new Pool(() => Object.assign({ active: false }, OBJ_DEFAULTS), 80);
const particles = new Pool(() => ({ active: false, kind: 0, x: 0, y: 0, vx: 0, vy: 0, g: 0, life: 0, max: 1, size: 1, color: '#fff', screen: false, drag: 0, len: 0 }), 500);
const floaters = new Pool(() => ({ active: false, text: '', x: 0, y: 0, vy: 0, life: 0, max: 1, color: '#fff', size: 24 }), 24);

function newObj(kind) { const o = objects.spawn(); Object.assign(o, OBJ_DEFAULTS); o.kind = kind; return o; }

// ---------- debug ring buffers ----------
const DBG_N = 360;
const dbg = { theta: new Float32Array(DBG_N), omega: new Float32Array(DBG_N), ctrl: new Float32Array(DBG_N), grav: new Float32Array(DBG_N), dist: new Float32Array(DBG_N), idx: 0, tick: 0 };

const MISSIONS = [
  { text: 'Perfect balance łącznie 10 s', goal: 10, get: () => G.stats.perfectTotal, unit: 's' },
  { text: 'Zbierz 15 baterii', goal: 15, get: () => G.stats.batteries, unit: '' },
  { text: 'Zrób 3× CLOSE CALL', goal: 3, get: () => G.stats.closeCalls, unit: '' },
  { text: 'Osiągnij combo x5', goal: 5, get: () => G.stats.maxCombo, unit: '' },
  { text: 'Wheelie 20 s bez przerwy', goal: 20, get: () => Math.max(G.stats.longestWheelie, player.onGround ? 0 : player.wheelieTime), unit: 's' },
  { text: 'Przejedź 1500 m', goal: 1500, get: () => player.x, unit: 'm' },
];

// =====================================================================
// GEOMETRIA JEŹDŹCA (wspólna dla fizyki pozy i renderu)
// =====================================================================
function ik(ax, ay, bx, by, l1, l2, bend) {
  const dx = bx - ax, dy = by - ay;
  const d = Math.max(0.001, Math.hypot(dx, dy));
  const dd = clamp(d, Math.abs(l1 - l2) + 0.01, l1 + l2 - 0.01);
  const a = (l1 * l1 - l2 * l2 + dd * dd) / (2 * dd);
  const h = Math.sqrt(Math.max(0, l1 * l1 - a * a));
  const ux = dx / d, uy = dy / d;
  const mx = ax + ux * a, my = ay + uy * a;
  return [mx - uy * h * bend, my + ux * h * bend];
}
// punkt lokalny hulajnogi (x do przodu, y w dół) → obrócony o kąt wheelie
function bikePt(x, y, co, si) { return [x * co + y * si, -x * si + y * co]; }
const TORSO = 48, REACH = 42;

function hipFor(theta, lean) {
  const th = theta * DEG, co = Math.cos(th), si = Math.sin(th);
  const fR = bikePt(36, -27, co, si), fF = bikePt(70, -27, co, si);
  const mx = (fR[0] + fF[0]) / 2, my = (fR[1] + fF[1]) / 2;
  const beta = th * 0.6 - 0.06 + lean * 0.22;
  const legL = 60 - Math.abs(lean) * 5 + (theta < 4 ? 3 : 0);
  return [mx - Math.sin(beta) * legL, my - Math.cos(beta) * legL, fR, fF];
}
/** Kąt tułowia: tak, by ręce sięgały kierownicy, z preferencją naturalnego odchylenia. */
function psiTargetFor(theta, lean) {
  const th = theta * DEG, co = Math.cos(th), si = Math.sin(th);
  const hip = hipFor(theta, lean);
  const Hd = bikePt(104, -122, co, si);
  const psi0 = th * 0.4 + lean * 0.3 - 0.08;
  let best = psi0, bestC = 1e9;
  const cost = ps => {
    const sx = hip[0] - Math.sin(ps) * TORSO, sy = hip[1] - Math.cos(ps) * TORSO;
    const d = Math.hypot(Hd[0] - sx, Hd[1] - sy);
    return (d - REACH) * (d - REACH) + 900 * (ps - psi0) * (ps - psi0);
  };
  for (let i = 0; i <= 24; i++) { const ps = -0.7 + i * (2.2 / 24); const cs = cost(ps); if (cs < bestC) { bestC = cs; best = ps; } }
  const stepR = 2.2 / 24 / 4;
  const base = best;
  for (let j = -4; j <= 4; j++) { const ps = base + j * stepR; const cs = cost(ps); if (cs < bestC) { bestC = cs; best = ps; } }
  return best;
}
function riderJoints(theta, lean, psi) {
  const th = theta * DEG, co = Math.cos(th), si = Math.sin(th);
  const hp = hipFor(theta, lean);
  const hip = [hp[0], hp[1]], fR = hp[2], fF = hp[3];
  const H = bikePt(104, -122, co, si), Hf = bikePt(99, -121, co, si);
  const dx = -Math.sin(psi), dy = -Math.cos(psi);
  const sh = [hip[0] + dx * TORSO, hip[1] + dy * TORSO];
  const head = [hip[0] + dx * (TORSO + 17), hip[1] + dy * (TORSO + 17)];
  return {
    th, psi, dx, dy, hip, sh, head, fR, fF, H, Hf,
    kneeR: ik(hip[0], hip[1], fR[0], fR[1], 34, 36, -1),
    kneeF: ik(hip[0], hip[1], fF[0], fF[1], 34, 36, -1),
    elbN: ik(sh[0], sh[1], H[0], H[1], 28, 28, 1),
    elbF: ik(sh[0] - 3, sh[1], Hf[0], Hf[1], 28, 28, 1),
  };
}

// =====================================================================
// GAME — start, reset, stany
// =====================================================================
function resetPlayer() {
  const D = diffDef(), p = player;
  Object.assign(p, {
    x: 0, prevX: 0, v: baseSpeedAt(0),
    lane: 1, laneFrom: 1, laneT: 1, laneF: 1, prevLaneF: 1, laneCD: 0, laneBuf: 0, laneBufT: 0,
    theta: CONFIG.startAngle, prevTheta: CONFIG.startAngle, omega: 0, ctrl: 0, lean: 0, prevLean: 0,
    onGround: false, wheelieTime: 0, zone: 'green', zoneRaw: 'green', zoneHold: 0, zoneFlash: 0, redT: 0, warnT: 0,
    combo: 1, comboT: 0, perfectT: 0, perfectGrace: 0,
    battery: CONFIG.startBattery, boosting: false, boostT: 0, boostCD: 0, boostLevel: 0,
    slowT: 0, invuln: 0, lives: D.lives, wheelRot: 0, bounce: 0, bounceV: 0, microT: 1,
    crashed: false, crashType: '', crashT: 0, rag: null,
    dbgCtrl: 0, dbgGrav: 0, dbgDist: 0,
  });
  p.psi = p.prevPsi = psiTargetFor(p.theta, 0);
}

function startRun() {
  Sound.init();
  G.difficulty = Store.data.settings.difficulty;
  G.seed = (Math.random() * 1e9) | 0;
  G.rng = mulberry32(G.seed);
  G.ph1 = G.rng() * TAU; G.ph2 = G.rng() * TAU; G.ph3 = G.rng() * TAU;
  G.runTime = 0; G.score = 0; G.diff = 0; G.speedTier = 99; G.trauma = 0; G.timeScale = 1; G.crashReal = 0; G.stage = 0;
  G.stats = { batteries: 0, closeCalls: 0, perfects: 0, perfectTotal: 0, maxCombo: 1, longestWheelie: 0, sweetTime: 0, pedHits: 0, boosts: 0 };
  G.wind = { state: 'idle', t: 0, next: 6 + G.rng() * 5, dir: 1, dur: 1.5, str: 0, torque: 0 };
  G.chain = { count: 0, lastT: -9 };
  G.flash.a = 0; G.perfectFx = 0;
  objects.clear(); particles.clear(); floaters.clear();
  resetPlayer();
  G.speedTier = Math.floor(speedAtTime(0) * 3.6 / 10);
  Spawner.reset();
  G.mission = MISSIONS[Math.floor(Math.random() * MISSIONS.length)];
  G.missionDone = false;
  dbg.theta.fill(0); dbg.omega.fill(0); dbg.ctrl.fill(0); dbg.grav.fill(0); dbg.dist.fill(0);
  setState(S.PLAYING);
  banner('GO!', diffDef().label, '#ffd400', 1.3);
  Sound.go();
}

function setState(s) {
  G.state = s;
  UI.onState(s);
  if (s === S.PLAYING) Sound.setMusicLevel(1);
  else if (s === S.PAUSED) Sound.setMusicLevel(0.3);
  else if (s === S.GAMEOVER) Sound.setMusicLevel(0.45);
  else Sound.setMusicLevel(0.5);
  if (s !== S.PLAYING) Sound.setEngine(false, 0, 0, 0);
}

function togglePause() {
  if (G.state === S.PLAYING) { if (!player.crashed) setState(S.PAUSED); }
  else if (G.state === S.PAUSED) setState(S.PLAYING);
}

function gameOver() {
  const st = G.stats, d = Store.data, p = player;
  const score = Math.floor(G.score);
  const record = score > d.best;
  if (record) d.best = score;
  d.bestDistance = Math.max(d.bestDistance, Math.floor(p.x));
  d.longestWheelie = Math.max(d.longestWheelie, st.longestWheelie);
  d.bestCombo = Math.max(d.bestCombo, st.maxCombo);
  d.batteriesTotal += st.batteries;
  d.runs++;
  Store.save();
  G.overT = 0;
  UI.showGameOver({ score, record, best: d.best, reason: G.overReason, dist: p.x, st, mission: G.mission, done: G.missionDone });
  setState(S.GAMEOVER);
}

// ---------- feedback helpers ----------
function addShake(a) { G.trauma = Math.min(1, G.trauma + a); }
function vibrate(p) { if (UI.isTouch && navigator.vibrate) { try { navigator.vibrate(p); } catch (e) { /* ignoruj */ } } }
function banner(text, sub, color, dur) { G.banner = { text, sub, color, t: 0, dur }; }
function floater(text, x, y, color, size = 26, life = 1.1) {
  // rozsuń komunikaty, które pojawiły się w tym samym miejscu
  for (let k = 0; k < 6; k++) {
    let moved = false;
    for (const o of floaters.items) {
      if (o.active && Math.abs(o.x - x) < 160 && Math.abs(o.y - y) < size * 0.9) { y = o.y - size * 1.05; moved = true; }
    }
    if (!moved) break;
  }
  const f = floaters.spawn();
  f.text = text; f.x = x; f.y = y; f.vy = -60; f.life = life; f.max = life; f.color = color; f.size = size;
}
function playerScreenPos() {
  const s = laneS(player.laneF);
  return [PSX + 40 * s, laneY(player.laneF) - 150 * s];
}
function emit(kind, x, y, vx, vy, life, size, color, opts) {
  const pt = particles.spawn();
  pt.kind = kind; pt.x = x; pt.y = y; pt.vx = vx; pt.vy = vy; pt.life = life; pt.max = life; pt.size = size; pt.color = color;
  pt.g = (opts && opts.g) || 0; pt.drag = (opts && opts.drag) || 0; pt.screen = !!(opts && opts.screen); pt.len = (opts && opts.len) || 0;
  return pt;
}
// pozycja tylnej osi w "świecie pikselowym" (do emisji cząsteczek)
function rearWheelWorld() {
  const p = player, s = laneS(p.laneF);
  return [p.x * PX, laneY(p.laneF), s];
}
function frontWheelWorld() {
  const p = player, s = laneS(p.laneF), th = p.theta * DEG, k = HERO * s;
  return [p.x * PX + Math.cos(th) * WHEELBASE * k, laneY(p.laneF) - WHEEL_R * k - Math.sin(th) * WHEELBASE * k + WHEEL_R * k, s];
}
function sparks(x, y, n, s, dir = -1) {
  for (let i = 0; i < n; i++) {
    const r = Math.random();
    emit('spark', x, y, (dir * (120 + r * 360) + (Math.random() - 0.5) * 120) * s, (-160 - Math.random() * 300) * s, 0.25 + Math.random() * 0.35, 2 * s,
      Math.random() < 0.5 ? '#ffd400' : '#ff7a1a', { g: 1400 * s, drag: 1.5 });
  }
}
function dust(x, y, n, s) {
  for (let i = 0; i < n; i++) emit('dust', x + (Math.random() - 0.5) * 30 * s, y - 4 * s, (-60 - Math.random() * 120) * s, (-20 - Math.random() * 50) * s, 0.5 + Math.random() * 0.4, (6 + Math.random() * 8) * s, '#c7b8d8', { drag: 2 });
}

// =====================================================================
// PHYSICS — krok o stałym dt
// =====================================================================
const DT = 1 / CONFIG.physicsHz;

function step(dt) {
  const p = player;
  p.prevX = p.x; p.prevTheta = p.theta; p.prevLaneF = p.laneF; p.prevLean = p.lean; p.prevPsi = p.psi;
  if (p.rag) { p.rag.px = p.rag.x; p.rag.py = p.rag.y; p.rag.prot = p.rag.rot; }
  G.runTime += dt;
  G.diff = clamp(p.x / CONFIG.difficultyRampDistance, 0, 1);

  if (!p.crashed) {
    updateLane(dt);
    updateBoost(dt);
    updateSpeed(dt);
    updateBalance(dt);
    if (!p.crashed) updateScoring(dt);
  } else {
    updateCrash(dt);
  }
  p.x += p.v * dt;
  p.wheelRot += (p.v * dt) / ((WHEEL_R * HERO) / PX);
  p.lean += (p.ctrl - p.lean) * expK(12, dt);
  if (!p.crashed) p.psi += (psiTargetFor(p.theta, p.lean) - p.psi) * expK(14, dt);
  p.bounceV += (-p.bounce * 900 - p.bounceV * 16) * dt;
  p.bounce += p.bounceV * dt;
  if (p.invuln > 0) p.invuln -= dt;
  p.zoneFlash = Math.max(0, p.zoneFlash - dt * 2.2);

  Spawner.update();
  updateObjects(dt);
  updateWind(dt);
  if (!p.crashed) { updateMission(); updateStage(); }

  // próbki debug (60 Hz)
  if ((dbg.tick++ & 1) === 0) {
    const i = dbg.idx;
    dbg.theta[i] = p.theta; dbg.omega[i] = p.omega; dbg.ctrl[i] = p.dbgCtrl; dbg.grav[i] = p.dbgGrav; dbg.dist[i] = p.dbgDist;
    dbg.idx = (i + 1) % DBG_N;
  }
}

/** Serce gry: odwrócone wahadło wokół tylnej osi. */
function updateBalance(dt) {
  const p = player, D = diffDef();
  const center = sweetCenter(D);
  const grace = smoothstep(clamp(G.runTime / CONFIG.startGrace, 0, 1));

  // --- wejście z rampą (analogowo płynne) ---
  let axis = Input.axis();
  if (CONFIG.invertBalance) axis = -axis;
  let target = axis;
  if (p.ctrl !== 0 && target !== 0 && sgn(target) !== sgn(p.ctrl)) target = 0; // najpierw puść, potem odwróć
  const rising = Math.abs(target) > Math.abs(p.ctrl);
  p.ctrl = moveToward(p.ctrl, target, (rising ? 1 / CONFIG.correctionRampUp : 1 / CONFIG.correctionRampDown) * dt);
  let ctrlT = sgn(p.ctrl) * Math.pow(Math.abs(p.ctrl), CONFIG.correctionCurve) * CONFIG.correctionForce;
  if (ctrlT !== 0 && sgn(ctrlT) === -sgn(p.omega) && Math.abs(p.omega) > 4) ctrlT *= 1 + CONFIG.catchAssist;

  // --- grawitacja: niestabilna równowaga w środku sweet spotu ---
  const gMul = D.gravityMul * (1 + CONFIG.difficultyGravityGain * G.diff);
  const gravT = CONFIG.gravity * gMul * Math.sin((p.theta - center) * DEG) * grace;

  // --- zakłócenia ---
  const t = G.runTime, nm = D.noiseMul * (1 + CONFIG.difficultyNoiseGain * G.diff);
  const noise = CONFIG.noiseTorque * nm * grace *
    (Math.sin(t * 1.31 + G.ph1) * 0.55 + Math.sin(t * 2.73 + G.ph2) * 0.3 + Math.sin(t * 5.17 + G.ph3) * 0.15);
  let boostT = 0;
  if (p.boosting && p.boostT < CONFIG.boostTorqueTime) boostT = CONFIG.boostTorque * (1 - p.boostT / CONFIG.boostTorqueTime);
  const distT = noise + G.wind.torque + boostT;
  p.microT -= dt;
  if (p.microT <= 0) {
    p.microT = 0.6 + G.rng() * 1.1;
    if (!p.onGround) p.omega += (G.rng() * 2 - 1) * CONFIG.microBumpImpulse * nm * grace;
  }

  // --- całkowanie (semi-implicit Euler) ---
  const damp = CONFIG.damping * D.dampingMul;
  let alpha = (ctrlT + gravT + distT - damp * p.omega) / CONFIG.inertia;
  if (p.onGround) {
    if (alpha > 0 || p.omega > 0) { p.onGround = false; p.wheelieTime = 0; }
    else { p.omega = 0; alpha = 0; }
  }
  p.omega = clamp(p.omega + alpha * dt, -CONFIG.maxAngularVelocity, CONFIG.maxAngularVelocity);
  p.theta += p.omega * dt;
  if (p.theta <= 0) {
    p.theta = 0;
    if (!p.onGround) frontDrop();
    p.onGround = true; p.omega = 0;
  }
  p.dbgCtrl = ctrlT; p.dbgGrav = gravT; p.dbgDist = distT;
  if (p.theta >= D.crashAngle) crash('back');
}

function zoneOf(theta) {
  const D = diffDef(), m = CONFIG.yellowMargin;
  if (player.onGround) return 'ground';
  if (theta >= D.sweetMin && theta <= D.sweetMax) return 'green';
  if (theta >= D.sweetMin - m && theta <= D.sweetMax + m) return 'yellow';
  return theta > D.sweetMax ? 'redHigh' : 'redLow';
}

function onZoneChange(from, to) {
  const p = player;
  if (to === 'green') { Sound.zone('green'); p.zoneFlash = 1; }
  else if (to === 'yellow' && from === 'green') Sound.zone('yellow');
  else if (isRed(to) && !isRed(from)) { Sound.zone('red'); addShake(0.12); vibrate(25); p.zoneFlash = 1; }
  else if (to === 'yellow') p.zoneFlash = 0.6;
}

function updateScoring(dt) {
  const p = player, D = diffDef();
  // strefa z debouncingiem (brak migotania na granicy)
  const raw = zoneOf(p.theta);
  if (raw !== p.zone) {
    if (raw === p.zoneRaw) p.zoneHold += dt; else { p.zoneRaw = raw; p.zoneHold = 0; }
    if (p.zoneHold >= 0.045 || raw === 'ground') { const from = p.zone; p.zone = raw; p.zoneHold = 0; onZoneChange(from, raw); }
  } else { p.zoneRaw = raw; p.zoneHold = 0; }

  G.score += p.v * dt * CONFIG.pointsPerMeter * p.combo * (p.boosting ? 1.5 : 1);

  if (p.zone === 'green') {
    G.score += CONFIG.pointsSweetPerSecond * p.combo * dt;
    G.stats.sweetTime += dt;
    p.comboT += dt;
    if (p.comboT >= CONFIG.comboStepTime) {
      p.comboT = 0;
      if (p.combo < CONFIG.maxCombo) {
        p.combo++;
        G.stats.maxCombo = Math.max(G.stats.maxCombo, p.combo);
        const sp = playerScreenPos();
        floater(`COMBO x${p.combo}`, sp[0], sp[1] - 40, '#3dff6b', 30);
        Sound.combo(p.combo);
        addShake(0.08);
      }
    }
  } else if (p.zone === 'yellow') {
    p.comboT = Math.max(0, p.comboT - dt * 0.5);
  } else if (isRed(p.zone)) {
    p.comboT = 0;
    p.redT += dt;
    if (p.redT > 1.0 && p.combo > 1) {
      p.combo--; p.redT = 0;
      const sp = playerScreenPos();
      floater(`x${p.combo}`, sp[0], sp[1] - 30, '#ff3d5a', 24);
    }
    p.warnT -= dt;
    if (p.warnT <= 0) { Sound.warn(); p.warnT = p.zone === 'redHigh' ? 0.22 : 0.32; }
  }
  if (!isRed(p.zone)) { p.redT = 0; p.warnT = 0; }

  // perfect balance
  const center = sweetCenter(D);
  if (!p.onGround && Math.abs(p.theta - center) < CONFIG.perfectBand) {
    p.perfectT += dt; p.perfectGrace = 0.15; G.stats.perfectTotal += dt;
    if (p.perfectT >= CONFIG.perfectTime) {
      p.perfectT = 0;
      G.stats.perfects++;
      const pts = CONFIG.pointsPerfect * p.combo;
      G.score += pts;
      const sp = playerScreenPos();
      floater('PERFECT BALANCE!', sp[0] + 40, sp[1] - 70, '#ffd400', 32, 1.4);
      floater(`+${pts}`, sp[0] + 40, sp[1] - 36, '#fff', 22);
      Sound.perfect();
      G.perfectFx = 1;
      G.flash.color = '#ffd400'; G.flash.a = 0.18;
      const rw = rearWheelWorld();
      for (let i = 0; i < 24; i++) {
        const a = Math.random() * TAU, v = 160 + Math.random() * 220;
        emit('star', rw[0], rw[1] - 70 * rw[2], Math.cos(a) * v, Math.sin(a) * v, 0.8, 4, i % 2 ? '#ffd400' : '#ffffff', { drag: 2.5 });
      }
    }
  } else {
    p.perfectGrace -= dt;
    if (p.perfectGrace <= 0) p.perfectT = 0;
  }

  if (!p.onGround) {
    p.wheelieTime += dt;
    if (p.wheelieTime > G.stats.longestWheelie) G.stats.longestWheelie = p.wheelieTime;
  }
}

function commitWheelie() {
  const p = player;
  if (p.wheelieTime > G.stats.longestWheelie) G.stats.longestWheelie = p.wheelieTime;
}

function frontDrop() {
  const p = player;
  const hard = Math.abs(p.omega) > 40;
  if (p.wheelieTime < 0.25) return;
  commitWheelie();
  const sp = playerScreenPos();
  floater('FRONT DOWN!', sp[0] + 60, sp[1] - 10, '#ff7a1a', 26);
  if (p.combo > 1) floater('COMBO LOST', sp[0] + 60, sp[1] + 22, '#ff3d5a', 18);
  p.combo = 1; p.comboT = 0; p.perfectT = 0;
  p.slowT = CONFIG.frontDropRecover;
  p.bounceV = hard ? 160 : 90;
  addShake(hard ? 0.45 : 0.25);
  const fw = frontWheelWorld();
  sparks(fw[0], fw[1], hard ? 22 : 12, fw[2], 1);
  dust(fw[0], fw[1], 6, fw[2]);
  Sound.frontDrop();
  vibrate(40);
}

function requestLane(dir) {
  const p = player;
  if (G.state !== S.PLAYING || p.crashed) return;
  p.laneBuf = dir; p.laneBufT = CONFIG.laneInputBuffer;
  tryLaneChange();
}
function tryLaneChange() {
  const p = player;
  if (!p.laneBuf || p.laneT < 1 || p.laneCD > 0) return;
  const dir = p.laneBuf; p.laneBuf = 0;
  const to = p.lane + dir;
  if (to < 0 || to > 2) { Sound.deny(); return; }
  p.laneFrom = p.lane; p.lane = to; p.laneT = 0;
  // impuls kątowy zależny od prędkości: unik kosztuje balans
  const kick = CONFIG.laneChangeImpulse * Math.min(CONFIG.laneImpulseMaxScale, p.v / CONFIG.baseSpeed) * (dir < 0 ? 1 : -1);
  if (!p.onGround || kick > 0) p.omega += kick;
  Sound.lane(dir);
}
function updateLane(dt) {
  const p = player;
  if (p.laneT < 1) {
    p.laneT = Math.min(1, p.laneT + dt / CONFIG.laneChangeTime);
    if (p.laneT >= 1) p.laneCD = CONFIG.laneChangeCooldown;
  } else if (p.laneCD > 0) p.laneCD -= dt;
  p.laneF = lerp(p.laneFrom, p.lane, easeInOutSine(p.laneT));
  if (p.laneBuf) { p.laneBufT -= dt; if (p.laneBufT <= 0) p.laneBuf = 0; else tryLaneChange(); }
}

function tryBoost() {
  const p = player;
  if (G.state !== S.PLAYING || p.crashed) return;
  if (p.boosting || p.boostCD > 0) { Sound.deny(); return; }
  if (p.battery < CONFIG.boostCost) {
    Sound.lowBattery();
    const sp = playerScreenPos();
    floater('LOW BATTERY', sp[0] + 50, sp[1] - 20, '#ff3d5a', 22);
    return;
  }
  p.battery -= CONFIG.boostCost;
  p.boosting = true; p.boostT = 0;
  p.omega += CONFIG.boostKick;
  if (p.onGround) { p.onGround = false; p.wheelieTime = 0; }
  G.stats.boosts++;
  addShake(0.3);
  G.flash.color = '#29d4ff'; G.flash.a = 0.22;
  Sound.boost();
  vibrate(30);
}
function updateBoost(dt) {
  const p = player;
  if (p.boosting) {
    p.boostT += dt;
    if (p.boostT >= CONFIG.boostDuration) { p.boosting = false; p.boostCD = CONFIG.boostCooldown; }
  } else if (p.boostCD > 0) p.boostCD -= dt;
}
function updateSpeed(dt) {
  const p = player;
  p.boostLevel = moveToward(p.boostLevel, p.boosting ? 1 : 0, (p.boosting ? 7 : 2.2) * dt);
  let slow = 1;
  if (p.slowT > 0) {
    p.slowT -= dt;
    slow = lerp(1, CONFIG.frontDropSlowdown, smoothstep(clamp(p.slowT / CONFIG.frontDropRecover, 0, 1)));
  }
  p.v = baseSpeedAt(p.x) * (1 + (CONFIG.boostSpeedMul - 1) * p.boostLevel) * slow;
}

function crash(type) {
  const p = player;
  if (p.crashed) return;
  p.crashed = true; p.crashType = type; p.crashT = 0;
  G.crashReal = 0;
  commitWheelie();
  p.boosting = false; p.ctrl = 0;
  const J = riderJoints(p.theta, p.lean, p.psi);
  const hx = J.hip[0], hy = J.hip[1];
  const rel = {};
  for (const k of ['hip', 'sh', 'head', 'fR', 'fF', 'H', 'Hf', 'kneeR', 'kneeF', 'elbN', 'elbF']) rel[k] = [J[k][0] - hx, J[k][1] - hy];
  rel.th = J.th; rel.psi = J.psi; rel.dx = J.dx; rel.dy = J.dy;
  const r = {
    pose: rel, x: p.x + (hx * HERO) / PX, y: hy * HERO - WHEEL_R * HERO, rot: 0,
    vx: p.v * 0.55, vy: -380, vr: -5.5,
  };
  if (type === 'car') { r.vx = p.v * 1.05; r.vy = -650; r.vr = 7.5; G.overReason = 'KOLIZJA!'; }
  else if (type === 'ped') { r.vx = p.v * 0.7; r.vy = -320; r.vr = 3.2; G.overReason = 'KONIEC ŻYĆ'; }
  else { G.overReason = 'WYWROTKA!'; }
  r.px = r.x; r.py = r.y; r.prot = 0;
  p.rag = r;
  G.timeScale = 0.28;
  addShake(type === 'car' ? 0.95 : 0.55);
  G.flash.color = '#ff3d5a'; G.flash.a = 0.35;
  Sound.crash();
  if (type === 'car') Sound.horn();
  vibrate([80, 40, 140]);
  const sp = playerScreenPos();
  floater(G.overReason, sp[0] + 80, sp[1] - 40, '#ff3d5a', 40, 2.2);
  commitWheelie();
}
function updateCrash(dt) {
  const p = player, r = p.rag;
  p.crashT += dt;
  if (p.crashType === 'back') {
    if (p.theta < 98) {
      p.omega = Math.min(p.omega + 300 * dt, 280);
      p.theta = Math.min(98, p.theta + p.omega * dt);
      if (p.theta >= 98) { p.omega = 0; addShake(0.3); const rw = rearWheelWorld(); dust(rw[0], rw[1], 10, rw[2]); sparks(rw[0] - 20, rw[1], 10, rw[2], -1); }
    }
    p.v *= Math.exp(-1.6 * dt);
  } else {
    p.v *= Math.exp(-7 * dt);
    p.omega += (-p.theta * 40 - p.omega * 6) * dt;
    p.theta = Math.max(0, p.theta + p.omega * dt);
  }
  if (r) {
    r.vy += 2000 * dt; r.x += r.vx * dt; r.y += r.vy * dt; r.rot += r.vr * dt;
    const floor = -16;
    if (r.y > floor) {
      r.y = floor;
      if (r.vy > 140) {
        r.vy *= -0.36; r.vx *= 0.55; r.vr *= 0.5; addShake(0.2);
        const s = laneS(p.laneF);
        dust(r.x * PX, laneY(p.laneF), 8, s);
      } else r.vy = 0;
    }
    if (r.vy === 0 && r.y >= floor) {
      r.vx *= Math.exp(-5 * dt); r.vr *= Math.exp(-6 * dt);
      const tgt = Math.round(r.rot / (Math.PI / 2)) * (Math.PI / 2);
      r.rot += (tgt - r.rot) * expK(6, dt);
    }
  }
}

function hitPedestrian(o) {
  const p = player;
  o.state = 'dodge'; o.dodgeT = 0; o.walkV = o.walkV || o.laneV;
  o.laneV = (o.laneF <= p.laneF ? -1 : 1) * 3.2;
  p.invuln = CONFIG.pedestrianInvuln;
  p.lives--;
  G.stats.pedHits++;
  G.score = Math.max(0, G.score - CONFIG.pedestrianPenalty);
  p.battery = Math.max(0, p.battery - CONFIG.pedestrianBatteryLoss);
  p.combo = 1; p.comboT = 0;
  p.omega += (G.rng() < 0.5 ? -1 : 1) * 55;
  addShake(0.5);
  G.flash.color = '#ff3d8b'; G.flash.a = 0.25;
  Sound.pedHit();
  vibrate([50, 30, 50]);
  const sp = playerScreenPos();
  floater('UWAGA, PIESZY!', sp[0] + 70, sp[1] - 40, '#ff3d8b', 30, 1.5);
  floater(`-1 ŻYCIE  -${CONFIG.pedestrianPenalty}`, sp[0] + 70, sp[1] - 8, '#fff', 20, 1.5);
  if (p.lives <= 0) crash('ped');
}

function collectBattery(o) {
  const p = player;
  o.hit = true; o.t2 = 0;
  p.battery = Math.min(100, p.battery + CONFIG.batteryValue);
  const now = G.runTime;
  G.chain.count = now - G.chain.lastT < 0.95 ? G.chain.count + 1 : 1;
  G.chain.lastT = now;
  const pts = CONFIG.pointsBattery * p.combo;
  G.score += pts;
  G.stats.batteries++;
  Sound.collect(G.chain.count);
  const s = laneS(o.laneF), bx = o.x * PX, by = laneY(o.laneF) - 40 * s;
  for (let i = 0; i < 12; i++) {
    const a = Math.random() * TAU, v = 80 + Math.random() * 200;
    emit('star', bx, by, Math.cos(a) * v * s, Math.sin(a) * v * s - 60, 0.5 + Math.random() * 0.3, 3.5 * s, i % 3 ? '#3dff6b' : '#ffffff', { drag: 3 });
  }
  const sp = playerScreenPos();
  floater(`+${pts}`, sp[0] + 90, sp[1] - 10, '#3dff6b', 22, 0.8);
  if (G.chain.count === 5 || G.chain.count === 8) {
    const bonus = CONFIG.pointsChain * p.combo * (G.chain.count === 8 ? 2 : 1);
    G.score += bonus;
    floater(`CHAIN x${G.chain.count}! +${bonus}`, sp[0] + 90, sp[1] - 50, '#29d4ff', 28, 1.3);
    Sound.combo(3);
  }
}

function closeCall(o) {
  const p = player;
  G.stats.closeCalls++;
  const pts = CONFIG.pointsCloseCall * p.combo;
  G.score += pts;
  const sp = playerScreenPos();
  floater('CLOSE CALL!', sp[0] + 80, sp[1] - 60, '#29d4ff', 36, 1.3);
  floater(`+${pts}`, sp[0] + 80, sp[1] - 26, '#fff', 22, 1.1);
  Sound.closeCall();
  addShake(0.12);
  G.flash.color = '#29d4ff'; G.flash.a = 0.12;
}

// ---------- obiekty: ruch + kolizje ----------
function updateCrosser(o, dt, front) {
  const p = player;
  if (o.state === 'wait') {
    const tta = (o.x - front) / Math.max(2, p.v);
    if (tta <= o.travel) o.state = 'walk';
    o.phase += dt * 1.5;
  }
  if (o.state === 'walk') {
    o.laneF += o.laneV * dt;
    o.phase += dt * 9;
    if (o.kind === 'ped') {
      if (o.laneV > 0 && o.laneF >= 2.85) { o.laneF = 2.85; o.state = 'end'; }
      else if (o.laneV < 0 && o.laneF <= -0.95) { o.laneF = -0.95; o.state = 'end'; }
    } else if (o.laneF > 3.8) o.state = 'gone';
  } else if (o.state === 'dodge') {
    o.dodgeT += dt;
    o.laneF += o.laneV * dt;
    o.laneV *= Math.exp(-5 * dt);
    o.hop = Math.sin(Math.min(1, o.dodgeT / 0.45) * Math.PI) * 30;
    if (o.dodgeT > 0.7) { o.hop = 0; o.state = 'walk'; o.laneV = o.walkV; }
  }
}

function updateObjects(dt) {
  const p = player;
  const front = p.x + 0.4 + 1.97 * Math.cos(p.theta * DEG), rear = p.x - 0.45;
  const items = objects.items;
  for (let i = 0; i < items.length; i++) {
    const o = items[i];
    if (!o.active) continue;
    o.px = o.x; o.plf = o.laneF; o.t += dt;
    switch (o.kind) {
      case 'car': case 'bus': o.x += o.v * dt; break;
      case 'ped': case 'xcar': updateCrosser(o, dt, front); break;
      case 'cone':
        if (o.hit) {
          o.fvy += 1500 * dt; o.fx += o.fvx * dt; o.fy += o.fvy * dt; o.rot += o.vr * dt;
          if (o.fy > 0) { o.fy = 0; o.fvy *= -0.3; o.fvx *= 0.6; o.vr *= 0.6; }
        }
        break;
      case 'battery': if (o.hit) { o.t2 += dt; if (o.t2 > 0.25) o.active = false; } break;
    }
    if (!o.active) continue;
    const tail = o.kind === 'bus' || o.kind === 'car' ? o.x + o.len : o.x + 3;
    if (tail < p.x - 25 || o.state === 'gone') { o.active = false; continue; }
    if (!p.crashed) collide(o, front, rear);
  }
}

function collide(o, front, rear) {
  const p = player;
  let x0, x1;
  switch (o.kind) {
    case 'car': case 'bus': x0 = o.x; x1 = o.x + o.len; break;
    case 'xcar': x0 = o.x - 0.95; x1 = o.x + 0.95; break;
    case 'ped': x0 = o.x - 0.3; x1 = o.x + 0.3; break;
    case 'cone': x0 = o.x - 0.25; x1 = o.x + 0.25; break;
    case 'battery': x0 = o.x - 0.4; x1 = o.x + 0.4; break;
    default: x0 = o.x - 0.4; x1 = o.x + 0.4;
  }
  const dl = Math.abs(o.laneF - p.laneF);
  const xOver = x0 < front && x1 > rear;
  switch (o.kind) {
    case 'battery':
      if (!o.hit && xOver && dl < 0.5) collectBattery(o);
      return;
    case 'cone':
      if (!o.hit && xOver && dl < 0.5) {
        o.hit = true; o.fvx = 240 + p.v * 22; o.fvy = -440; o.vr = 9;
        p.omega += (G.rng() < 0.5 ? -1 : 1) * CONFIG.coneImpulse;
        p.bounceV = 110; addShake(0.28); Sound.cone();
        const sp = playerScreenPos();
        floater('PACHOŁEK!', sp[0] + 70, sp[1], '#ff7a1a', 22, 0.9);
      }
      return;
    case 'manhole': case 'bump':
      if (!o.hit && p.x >= o.x) {
        o.hit = true;
        if (dl < 0.45) {
          const big = o.kind === 'manhole';
          const imp = (big ? CONFIG.manholeImpulse : CONFIG.bumpImpulse) * (0.75 + G.rng() * 0.5);
          p.omega += (G.rng() < 0.55 ? 1 : -1) * imp * (p.onGround ? 0.4 : 1);
          p.bounceV = big ? 150 : 90;
          addShake(big ? 0.22 : 0.1);
          if (big) Sound.manhole(); else Sound.bump(0.8);
          const rw = rearWheelWorld();
          sparks(rw[0], rw[1], big ? 10 : 4, rw[2]);
          dust(rw[0], rw[1], big ? 5 : 3, rw[2]);
        }
      }
      return;
    case 'car': case 'bus': case 'xcar': case 'ped': {
      const pedSafe = o.kind === 'ped' && (o.state === 'dodge' || p.invuln > 0);
      if (!o.hit && xOver && dl < o.half + 0.26 && !pedSafe) {
        o.hit = true;
        if (o.kind === 'ped') hitPedestrian(o); else crash('car');
        return;
      }
      if (!o.passed) {
        const closing = Math.max(0.5, p.v - o.v);
        const ttc = (x0 - front) / closing;
        if (ttc > 0 && ttc < 0.32 && dl < o.half + 0.31) o.threat = true;
        if (xOver) { const gap = dl - (o.half + 0.26); if (gap < o.minGap) o.minGap = gap; }
        if (o.kind === 'car' && !o.honked && ttc > 0 && ttc < 1.0 && dl < 0.5) { o.honked = true; Sound.horn(); }
        if (x1 < rear) { o.passed = true; if (!o.hit && (o.threat || o.minGap < 0.22)) closeCall(o); }
      }
    }
  }
}

function updateWind(dt) {
  const w = G.wind, p = player;
  if (!w) return;
  if (w.state === 'idle') {
    w.torque = 0;
    if (p.x < CONFIG.windStartDistance || p.crashed) return;
    w.next -= dt;
    if (w.next <= 0) {
      w.state = 'warn'; w.t = CONFIG.windWarnTime;
      w.dir = G.rng() < 0.5 ? -1 : 1;
      w.str = CONFIG.windTorque * (0.7 + 0.5 * G.rng()) * (1 + CONFIG.difficultyWindGain * G.diff) * diffDef().noiseMul;
      w.dur = 1.2 + G.rng() * 1.0;
    }
  } else if (w.state === 'warn') {
    w.t -= dt;
    if (w.t <= 0) { w.state = 'gust'; w.t = 0; Sound.noiseBurst(w.dur, { vol: 0.12, type: 'bandpass', freq: 500, freqEnd: 1400, q: 0.6 }); }
  } else if (w.state === 'gust') {
    w.t += dt;
    w.torque = p.crashed ? 0 : w.dir * w.str * Math.sin(Math.PI * clamp(w.t / w.dur, 0, 1));
    if (Math.random() < dt * 40) {
      emit('wind', W + 20, 90 + Math.random() * (H - 200), -(900 + Math.random() * 600), w.dir * -60, 0.9, 1.5, '#ffffff', { screen: true, len: 80 + Math.random() * 140 });
    }
    if (w.t >= w.dur) {
      w.state = 'idle'; w.torque = 0;
      w.next = lerp(CONFIG.windIntervalMax, CONFIG.windIntervalMin, G.diff) + G.rng() * 4;
    }
  }
}

function updateMission() {
  if (G.missionDone || !G.mission) return;
  if (G.mission.get() >= G.mission.goal) {
    G.missionDone = true;
    G.score += CONFIG.pointsMission;
    banner('MISJA UKOŃCZONA!', `${G.mission.text}  +${CONFIG.pointsMission}`, '#3dff6b', 2.2);
    Sound.mission();
  }
}

function updateStage() {
  // sygnał przyspieszenia co 10 km/h prędkości bazowej
  const kmh = speedAtTime(G.runTime) * 3.6, tierS = Math.floor(kmh / 10);
  if (tierS > G.speedTier) {
    G.speedTier = tierS;
    floater(`SPEED UP! ${tierS * 10} km/h`, W / 2, H * 0.42, '#ff7a1a', 30, 1.6);
    Sound.combo(2);
    G.flash.color = '#ff7a1a'; G.flash.a = Math.max(G.flash.a, 0.1);
  }
  const st = Math.floor(player.x / CONFIG.stageLength);
  if (st > G.stage) {
    G.stage = st;
    banner(`STAGE ${st + 1}`, PALETTES[st % PALETTES.length].label, '#29d4ff', 2.2);
    Sound.stage();
  }
}

// =====================================================================
// SPAWNER — ręcznie zaprojektowane wzorce, zawsze z przejezdnym pasem
// =====================================================================
const CAR_COLORS = ['#29d4ff', '#ff3d8b', '#f2f2f2', '#7a5cff', '#ff7a1a', '#20c997', '#e83a3a', '#3a6cff'];
const SHIRTS = ['#ff3d8b', '#29d4ff', '#ffd400', '#7a5cff', '#20c997', '#ff7a1a', '#f2f2f2'];
const PANTS = ['#1d2433', '#2f3f73', '#3a2a1a', '#4b4f5c'];
const SKINS = ['#f1c7a3', '#d9a07a', '#a86b48', '#6e4429'];
const HAIRS = ['#1b120c', '#3b2414', '#c9a35a', '#7a2a1a', '#222'];

function spawnCar(xMeet, lane, vp, kind) {
  const p = player, rng = G.rng;
  const len = kind === 'bus' ? 11 : 4.4;
  const vc = CONFIG.carSpeedFactor * vp;
  const vAvg = (Math.max(p.v, 1) + vp) / 2;
  const tMeet = Math.max(0, (xMeet - (p.x + 2.4)) / vAvg);
  let x0 = xMeet - vc * tMeet;
  const minX = p.x + viewAheadMeters() + 4;
  if (x0 < minX) x0 = minX;
  const o = newObj(kind);
  o.x = o.px = x0; o.len = len; o.v = vc;
  if (kind === 'bus') { o.laneF = lane + 0.5; o.half = 0.85; o.color = pickFrom(['#1fb6e0', '#ff3d8b', '#ffd400'], rng); }
  else { o.laneF = lane; o.half = 0.34; o.color = pickFrom(CAR_COLORS, rng); o.variant = rng() < 0.18 ? 1 : 0; if (o.variant) o.color = '#ffd400'; }
  o.plf = o.laneF;
  return o;
}
function spawnCrosser(x, kind, target, from, decal) {
  const rng = G.rng, o = newObj(kind);
  o.x = o.px = x;
  if (kind === 'ped') {
    const fromFar = from === undefined ? rng() < 0.5 : from;
    o.startLane = fromFar ? -0.95 : 2.85;
    o.laneV = (fromFar ? 1 : -1) * 0.95 * (1 + 0.3 * G.diff);
    o.half = 0.24; o.len = 0.6;
    o.color = pickFrom(SHIRTS, rng); o.color2 = pickFrom(PANTS, rng); o.skin = pickFrom(SKINS, rng);
    o.variant = Math.floor(rng() * 5);
    o.hair = pickFrom(HAIRS, rng);
  } else {
    o.startLane = -1.35;
    o.laneV = 1.55 * (1 + 0.25 * G.diff);
    o.half = 0.5; o.len = 1.9; o.color = pickFrom(CAR_COLORS, rng);
  }
  o.walkV = o.laneV;
  o.laneF = o.plf = o.startLane;
  o.target = target;
  o.travel = Math.abs(target - o.startLane) / Math.abs(o.laneV);
  o.state = 'wait';
  o.phase = rng() * 6;
  if (decal !== false) { const d = newObj(kind === 'ped' ? 'crosswalk' : 'sidestreet'); d.x = d.px = x; d.laneF = d.plf = -0.5; }
  return o;
}
function spawnStatic(kind, x, lane) {
  const o = newObj(kind);
  o.x = o.px = x;
  o.laneF = o.plf = kind === 'cone' ? lane : lane + (G.rng() - 0.5) * 0.16;
  o.variant = Math.floor(G.rng() * 4);
  return o;
}
function spawnBattery(x, lane) { const o = newObj('battery'); o.x = o.px = x; o.laneF = o.plf = lane; o.phase = G.rng() * 6; return o; }

function makeBuilder(X, vp) {
  const rng = G.rng;
  const carWin = (4.4 + 2.9) / (vp * (1 - CONFIG.carSpeedFactor));
  const busWin = (11 + 2.9) / (vp * (1 - CONFIG.carSpeedFactor));
  const b = {
    X, vp, maxT: 0, carWin, busWin,
    r: () => rng(),
    lane: () => Math.floor(rng() * 3) % 3,
    other: l => (l + 1 + Math.floor(rng() * 2)) % 3,
    gap: (shift = 1) => carWin + 0.4 + 0.45 * shift,
    xAt(t) { if (t > b.maxT) b.maxT = t; return X + t * vp; },
    car(t, l) { spawnCar(b.xAt(t), l, vp, 'car'); b.xAt(t + carWin * 0.5); },
    bus(t, top) { spawnCar(b.xAt(t), top, vp, 'bus'); b.xAt(t + busWin - carWin * 0.5); },
    battery(t, l) { spawnBattery(b.xAt(t), l); },
    chain(t, l, n, st = 0.2) { for (let i = 0; i < n; i++) spawnBattery(b.xAt(t + i * st), l); },
    cone(t, l) { spawnStatic('cone', b.xAt(t), l); },
    manhole(t, l) { spawnStatic('manhole', b.xAt(t), l); },
    bump(t, l) { spawnStatic('bump', b.xAt(t), l); },
    ped(t, target, from, decal) { spawnCrosser(b.xAt(t), 'ped', target, from, decal); },
    xcar(t, target) { spawnCrosser(b.xAt(t), 'xcar', target); },
  };
  return b;
}
const XCAR_TARGETS = [-0.45, 0.55, 1.5, 2.45];

// Zasada: w każdej chwili co najmniej jeden pas jest wolny, a przejście między
// wolnymi pasami jest możliwe w czasie (okna aut liczone w b.carWin / b.gap()).
const PATTERNS = [
  // ---- tier 0: łagodne, ale już z ruchem ----
  { tier: 0, w: 5, build(b) { const l = b.lane(); b.car(0, l); if (b.r() < 0.6) b.chain(0.1, b.other(l), 5); } },
  { tier: 0, w: 4, build(b) { const l = b.lane(); b.chain(0, b.other(l), 5); b.car(0.6, l); } },
  // kolumna: dwa auta jedno za drugim na tym samym pasie
  { tier: 0, w: 3, build(b) { const l = b.lane(); b.car(0, l); b.car(b.carWin + 0.25, l); b.chain(0.2, b.other(l), 6); } },
  // dwa auta na różnych pasach, zachodzące na siebie — trzeci pas wolny
  { tier: 0, w: 3, build(b) { const a = b.lane(), c = b.other(a), f = 3 - a - c; b.car(0, a); b.car(b.carWin * 0.5, c); b.chain(0.1, f, 6); } },
  { tier: 0, w: 2, build(b) { const l = b.lane(), o = b.other(l); b.cone(0, l); b.cone(0.9, o); b.chain(0.15, 3 - l - o, 5, 0.18); } },
  { tier: 0, w: 1, build(b) { b.bump(0, b.lane()); b.manhole(0.7, b.lane()); b.bump(1.4, b.lane()); b.chain(0.1, b.lane(), 6, 0.22); } },
  { tier: 0, w: 2, build(b) { const l = b.lane(); b.ped(0.2, l); b.car(0.2, b.other(l)); } },
  { tier: 0, w: 1, build(b) { const l = b.lane(); b.chain(0, l, 7, 0.18); b.manhole(0.62, l); } },
  // ---- tier 1 ----
  // ściana z dwóch aut
  { tier: 1, w: 4, build(b) { const f = b.lane(); for (let l = 0; l < 3; l++) if (l !== f) b.car(0, l); b.chain(0, f, 5); } },
  { tier: 1, w: 3, build(b) { const a = b.lane(), c = b.other(a); b.car(0, a); b.car(b.gap(Math.abs(c - a)), c); b.chain(0, 3 - a - c, 4); } },
  // gęsty ruch: trzy auta na dwóch pasach, trzeci wolny przez cały czas
  { tier: 1, w: 3, build(b) { const a = b.lane(), c = b.other(a), f = 3 - a - c; b.car(0, a); b.car(b.carWin * 0.55, c); b.car(b.carWin * 1.15, a); b.chain(0, f, 8, 0.2); } },
  { tier: 1, w: 2, build(b) { const top = b.r() < 0.5 ? 0 : 1, free = top === 0 ? 2 : 0; b.bus(0, top); b.chain(0, free, 7, 0.2); } },
  { tier: 1, w: 2, build(b) { b.xcar(0.2, pickFrom(XCAR_TARGETS, b.r)); } },
  // auto na środkowym pasie + auto z przecznicy na skrajnym
  { tier: 1, w: 2, build(b) { const T = b.r() < 0.5 ? -0.45 : 2.45; b.car(0, 1); b.xcar(b.carWin * 0.4, T); } },
  { tier: 1, w: 2, build(b) { const a = b.lane(), c = b.other(a); b.ped(0.2, a, true); b.ped(0.2, c, false, false); } },
  { tier: 1, w: 3, build(b) { const l = b.lane(); b.battery(0, l); b.battery(0.16, l); b.car(0.72, l); b.chain(0.95, b.other(l), 4); } },
  { tier: 1, w: 1, build(b) { b.manhole(0, 0); b.manhole(0.06, 1); b.manhole(0.12, 2); b.chain(0.5, b.lane(), 5); } },
  { tier: 1, w: 2, build(b) { const l = b.lane(); b.cone(0, l); b.car(0.5, b.other(l)); b.bump(0.9, l); } },
  // ---- tier 2: trudne ----
  { tier: 2, w: 3, build(b) {
    let f = b.lane();
    for (let i = 0; i < 3; i++) {
      const t = i * b.gap(1);
      for (let l = 0; l < 3; l++) if (l !== f) b.car(t, l);
      b.battery(t + 0.1, f);
      f = f === 1 ? (b.r() < 0.5 ? 0 : 2) : 1;
    }
  } },
  { tier: 2, w: 2, build(b) { let l = b.lane(); for (let i = 0; i < 5; i++) { b.car(i * b.gap(1) * 0.92, l); l = (l + 1 + (b.r() < 0.5 ? 0 : 1)) % 3; } } },
  // korek: dwie kolumny po dwa auta, jeden pas wolny
  { tier: 2, w: 3, build(b) {
    const a = b.lane(), c = b.other(a), f = 3 - a - c, cw = b.carWin;
    b.car(0, a); b.car(cw + 0.25, a); b.car(cw * 0.4, c); b.car(cw * 1.4 + 0.25, c); b.chain(0, f, 8, 0.25);
  } },
  { tier: 2, w: 2, build(b) { const top = b.r() < 0.5 ? 0 : 1, free = top === 0 ? 2 : 0; b.bus(0, top); b.chain(0, free, 6); b.car(b.busWin + 0.8, free); } },
  { tier: 2, w: 2, build(b) { b.xcar(0, pickFrom(XCAR_TARGETS, b.r)); b.ped(b.gap(2) * 0.85, b.lane()); } },
  { tier: 2, w: 2, build(b) {
    let l = b.lane();
    for (let i = 0; i < 8; i++) {
      const t = i * 0.3;
      b.battery(t, l);
      if (i % 2 === 1) b.cone(t, (l + 1 + (b.r() < 0.5 ? 0 : 1)) % 3);
      if (i === 3 || i === 6) l = clamp(l + (b.r() < 0.5 ? -1 : 1), 0, 2);
    }
  } },
  { tier: 2, w: 2, build(b) { const l = b.lane(), a = b.other(l); b.car(0, l); b.ped(b.carWin * 0.5, a); } },
];

const Spawner = {
  nextX: 40,
  reset() { this.nextX = 40; },
  update() { while (this.nextX < player.x + CONFIG.spawnAhead) this.spawn(); },
  spawn() {
    const X = this.nextX, vp = baseSpeedAt(X), rng = G.rng;
    if (X < CONFIG.introDistance) {
      const l = Math.floor(rng() * 3) % 3;
      for (let i = 0; i < 5; i++) spawnBattery(X + i * 0.22 * vp, l);
      this.nextX = X + 2.6 * vp;
      return;
    }
    const tier = X < 250 ? 0 : X < 700 ? 1 : 2;
    let total = 0;
    for (const pt of PATTERNS) if (pt.tier <= tier) total += pt.w * (pt.tier === tier ? 1.6 : 1);
    let r = rng() * total, pat = PATTERNS[0];
    for (const pt of PATTERNS) {
      if (pt.tier > tier) continue;
      r -= pt.w * (pt.tier === tier ? 1.6 : 1);
      if (r <= 0) { pat = pt; break; }
    }
    const b = makeBuilder(X, vp);
    pat.build(b);
    // im dalej, tym ciaśniej (ale zawsze z czasem na zmianę pasa)
    const density = lerp(0.85, 0.6, clamp(G.runTime / 240, 0, 1));
    this.nextX = X + (b.maxT + b.gap(2) * density) * vp;
  },
};

// =====================================================================
// RENDER — paleta, tło, droga, sprite'y
// =====================================================================
const PALETTES = [
  { label: 'ZACHÓD SŁOŃCA', skyTop: '#3b1d6e', skyMid: '#ff3d8b', skyLow: '#ffb347', glow: '#ff7a1a', sunY: 318, sunA: 1, stars: 0, moon: 0, far: '#7a3585', bld: '#43205f', rim: '#ff9a3c', win: 0.12, neon: 0.25, side: '#5e3c6c', sideLine: '#7b5486', road: '#352b4c', road2: '#2a2140', line: '#ffe2b0', palm: '#2a0f35', lamp: 0.1, near: '#4a2f5c' },
  { label: 'ZMIERZCH', skyTop: '#0a1a3a', skyMid: '#4b2384', skyLow: '#ff3d8b', glow: '#ff3d8b', sunY: 412, sunA: 0.85, stars: 0.45, moon: 0.3, far: '#3c2066', bld: '#25164c', rim: '#ff3d8b', win: 0.45, neon: 0.7, side: '#3c2d5a', sideLine: '#544378', road: '#241e3a', road2: '#1c1730', line: '#ffd400', palm: '#170a28', lamp: 0.65, near: '#2f2448' },
  { label: 'NOC', skyTop: '#02040f', skyMid: '#0a1a3a', skyLow: '#3b1466', glow: '#7a1fa0', sunY: 560, sunA: 0, stars: 1, moon: 1, far: '#1b1542', bld: '#0e0f2c', rim: '#29d4ff', win: 0.85, neon: 1, side: '#1f1a3a', sideLine: '#2e2852', road: '#16152c', road2: '#100f22', line: '#29d4ff', palm: '#07051a', lamp: 1, near: '#1a1630' },
];
const PAL_KEYS_C = ['skyTop', 'skyMid', 'skyLow', 'glow', 'far', 'bld', 'rim', 'side', 'sideLine', 'road', 'road2', 'line', 'palm', 'near'];
const PAL_KEYS_N = ['sunY', 'sunA', 'stars', 'moon', 'win', 'neon', 'lamp'];
const PAL_RGB = PALETTES.map(pl => { const o = {}; for (const k of PAL_KEYS_C) o[k] = hexRgb(pl[k]); for (const k of PAL_KEYS_N) o[k] = pl[k]; return o; });
const palNow = {}; for (const k of PAL_KEYS_C) palNow[k] = [0, 0, 0];
function paletteAt(x) {
  const L = CONFIG.stageLength;
  const st = Math.max(0, Math.floor(x / L)), within = x - st * L;
  const a = PAL_RGB[st % 3], b = PAL_RGB[(st + 1) % 3];
  const t = smoothstep(clamp((within - (L - 140)) / 140, 0, 1));
  for (const k of PAL_KEYS_C) { const o = palNow[k]; o[0] = lerp(a[k][0], b[k][0], t); o[1] = lerp(a[k][1], b[k][1], t); o[2] = lerp(a[k][2], b[k][2], t); }
  for (const k of PAL_KEYS_N) palNow[k] = lerp(a[k], b[k], t);
  return palNow;
}

// słońce synthwave (prerender)
const sunCanvas = (() => {
  const cv = document.createElement('canvas'); cv.width = cv.height = 320;
  const g = cv.getContext('2d');
  const gr = g.createLinearGradient(0, 20, 0, 300);
  gr.addColorStop(0, '#ffe45c'); gr.addColorStop(0.5, '#ff9a3c'); gr.addColorStop(1, '#ff3d8b');
  g.fillStyle = gr; g.beginPath(); g.arc(160, 160, 140, 0, TAU); g.fill();
  g.globalCompositeOperation = 'destination-out';
  for (let k = 0; k < 7; k++) g.fillRect(0, 168 + k * 20, 320, 2 + k * 1.7);
  return cv;
})();
const STARS = Array.from({ length: 140 }, (_, i) => ({ x: hash1(i * 3 + 1), y: hash1(i * 7 + 2) * 0.55, r: 0.6 + hash1(i * 11) * 1.4, ph: hash1(i * 13) * TAU }));

// okna budynków: cache canvasów
const bldCache = new Map();
const BLD_SLOT = 118;
const NEON_WORDS = ['BAR', 'HOTEL', 'NEON', 'CAFE', '24/7'];
function bInfo(i) {
  const h0 = hash1(i * 7 + 3);
  return {
    w: 72 + hash1(i * 13 + 1) * 40, h: 110 + h0 * h0 * 240 + hash1(i * 5) * 40, dx: hash1(i * 17) * 10,
    neon: hash1(i * 29) < 0.4, neonCol: ['#29d4ff', '#ff3d8b', '#ffd400'][Math.floor(hash1(i * 31) * 3) % 3],
    antenna: hash1(i * 37) < 0.3, brand: hash1(i * 41) < 0.12,
  };
}
function windowsCanvas(i, b) {
  let cv = bldCache.get(i);
  if (cv) return cv;
  cv = document.createElement('canvas');
  cv.width = Math.ceil(b.w); cv.height = Math.ceil(b.h);
  const g = cv.getContext('2d');
  for (let y = 12, r = 0; y < b.h - 14; y += 17, r++) {
    for (let x = 8, k = 0; x < b.w - 12; x += 13, k++) {
      const hv = hash2(i * 97 + r, k);
      if (hv < 0.5) { g.fillStyle = hv < 0.12 ? '#9ff0ff' : hv < 0.2 ? '#ff9ed0' : '#ffd98a'; g.fillRect(x, y, 7, 9); }
    }
  }
  bldCache.set(i, cv);
  if (bldCache.size > 70) bldCache.delete(bldCache.keys().next().value);
  return cv;
}

const OUT = '#07080f'; // kolor konturów (styl "cartoon")
const shadeCache = new Map();
/** Rozjaśnia (amt>0) lub przyciemnia (amt<0) kolor hex. */
function shade(hex, amt) {
  const key = hex + amt;
  let v = shadeCache.get(key);
  if (v) return v;
  const c = hexRgb(hex), t = amt < 0 ? 0 : 255, k = Math.abs(amt);
  v = rgb([lerp(c[0], t, k), lerp(c[1], t, k), lerp(c[2], t, k)]);
  shadeCache.set(key, v);
  return v;
}
const mulRgb = (c, k) => [c[0] * k, c[1] * k, c[2] * k];

// faktura asfaltu (prerender, powtarzana wzorem)
const asphaltCanvas = (() => {
  const cv = document.createElement('canvas'); cv.width = 256; cv.height = 96;
  const g = cv.getContext('2d');
  for (let i = 0; i < 900; i++) {
    const v = hash1(i * 7 + 11);
    g.fillStyle = v < 0.5 ? `rgba(0,0,0,${0.12 + v * 0.2})` : `rgba(255,255,255,${(v - 0.5) * 0.09})`;
    g.fillRect(hash1(i * 3 + 1) * 256, hash1(i * 5 + 2) * 96, 1 + hash1(i) * 2, 1);
  }
  g.strokeStyle = 'rgba(0,0,0,0.18)'; g.lineWidth = 1;
  for (let i = 0; i < 6; i++) {
    let x = hash1(i * 13) * 256, y = hash1(i * 17) * 96;
    g.beginPath(); g.moveTo(x, y);
    for (let k = 0; k < 5; k++) { x += 6 + hash1(i * 31 + k) * 10; y += (hash1(i * 37 + k) - 0.5) * 6; g.lineTo(x, y); }
    g.stroke();
  }
  return cv;
})();
let asphaltPattern = null;

// chmury synthwave (wydłużone pasma)
const CLOUDS = Array.from({ length: 9 }, (_, i) => ({
  x: hash1(i * 5 + 3), y: 90 + hash1(i * 7 + 1) * 190, w: 160 + hash1(i * 11) * 260, h: 9 + hash1(i * 13) * 12, sp: 0.4 + hash1(i * 17),
}));

function drawSky(c, pal, t) {
  const g = c.createLinearGradient(0, 0, 0, HORIZON + 40);
  g.addColorStop(0, rgb(pal.skyTop)); g.addColorStop(0.55, rgb(pal.skyMid)); g.addColorStop(1, rgb(pal.skyLow));
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  if (pal.stars > 0.02) {
    c.fillStyle = '#ffffff';
    for (const s of STARS) {
      c.globalAlpha = pal.stars * (0.45 + 0.55 * Math.sin(t * 2 + s.ph) ** 2);
      c.fillRect(s.x * W, s.y * HORIZON, s.r, s.r);
    }
    c.globalAlpha = 1;
  }
  if (pal.moon > 0.02) {
    const mx = W * 0.8, my = 205;
    drawGlow(c, '#cfe8ff', mx, my, 110, 0.4 * pal.moon);
    c.globalAlpha = pal.moon; c.fillStyle = '#f2f6ff'; circle(c, mx, my, 26);
    c.fillStyle = 'rgba(180,195,230,0.5)'; circle(c, mx - 8, my + 6, 5); circle(c, mx - 2, my - 10, 3);
    c.fillStyle = rgb(pal.skyTop); circle(c, mx + 12, my - 6, 22); c.globalAlpha = 1;
  }
  if (pal.sunA > 0.02) {
    const sx = W * 0.64;
    drawGlow(c, '#ff7a1a', sx, pal.sunY, 360, 0.55 * pal.sunA);
    drawGlow(c, '#ffd400', sx, pal.sunY - 20, 190, 0.35 * pal.sunA);
    c.globalAlpha = pal.sunA; c.drawImage(sunCanvas, sx - 160, pal.sunY - 160); c.globalAlpha = 1;
  }
  // chmury przed słońcem: ciemne ciało + podświetlony spód
  const drift = player.x * PX * 0.012 + t * 6;
  for (const cl of CLOUDS) {
    const span = W + cl.w * 2;
    const x = ((cl.x * span - drift * cl.sp) % span + span) % span - cl.w;
    c.fillStyle = rgb(pal.skyTop, 0.32);
    c.beginPath(); c.ellipse(x - cl.w * 0.22, cl.y + cl.h * 0.25, cl.w * 0.3, cl.h * 0.75, 0, 0, TAU); c.fill();
    c.beginPath(); c.ellipse(x + cl.w * 0.02, cl.y - cl.h * 0.15, cl.w * 0.26, cl.h * 1.15, 0, 0, TAU); c.fill();
    c.beginPath(); c.ellipse(x + cl.w * 0.26, cl.y + cl.h * 0.2, cl.w * 0.24, cl.h * 0.8, 0, 0, TAU); c.fill();
    c.fillStyle = rgb(pal.glow, 0.42);
    c.beginPath(); c.ellipse(x + cl.w * 0.04, cl.y + cl.h * 0.85, cl.w * 0.46, cl.h * 0.22, 0, 0, TAU); c.fill();
    c.fillStyle = rgb(pal.glow, 0.18);
    c.beginPath(); c.ellipse(x + cl.w * 0.3, cl.y + cl.h * 1.3, cl.w * 0.35, cl.h * 0.12, 0, 0, TAU); c.fill();
  }
}

function drawCity(c, pal, camX) {
  const base = HORIZON + 2;
  // góry na horyzoncie (parallax 0.03) z neonową krawędzią
  const offM = camX * PX * 0.03, slotM = 140;
  c.fillStyle = rgb(mulRgb(pal.far, 0.75));
  c.beginPath(); c.moveTo(-200, base);
  const m0 = Math.floor((offM - 300) / slotM), m1 = Math.floor((offM + W + 300) / slotM);
  for (let i = m0; i <= m1; i++) {
    const x = i * slotM - offM - 100;
    c.lineTo(x, base - 30 - hash1(i * 23 + 5) * 40);
    c.lineTo(x + slotM * 0.5, base - 70 - hash1(i * 29 + 7) * 80);
  }
  c.lineTo(W + 200, base); c.closePath(); c.fill();
  c.strokeStyle = rgb(pal.glow, 0.55); c.lineWidth = 1.5;
  c.beginPath();
  for (let i = m0; i <= m1; i++) {
    const x = i * slotM - offM - 100;
    if (i === m0) c.moveTo(x, base - 30 - hash1(i * 23 + 5) * 40); else c.lineTo(x, base - 30 - hash1(i * 23 + 5) * 40);
    c.lineTo(x + slotM * 0.5, base - 70 - hash1(i * 29 + 7) * 80);
  }
  c.stroke();
  // poświata horyzontu
  const hg = c.createLinearGradient(0, base - 170, 0, base);
  hg.addColorStop(0, rgb(pal.glow, 0)); hg.addColorStop(1, rgb(pal.glow, 0.5));
  c.fillStyle = hg; c.fillRect(-200, base - 170, W + 400, 170);
  // daleka panorama (parallax 0.06)
  c.fillStyle = rgb(pal.far);
  const off1 = camX * PX * 0.06, slot1 = 64;
  for (let i = Math.floor((off1 - 200) / slot1); i <= Math.floor((off1 + W + 200) / slot1); i++) {
    const h = 40 + hash1(i * 3 + 9) * 120, w = 40 + hash1(i * 5 + 1) * 34, x = i * slot1 - off1 - 100;
    c.fillRect(x, base - h, w, h);
    if (hash1(i * 7) < 0.3) c.fillRect(x + w * 0.4, base - h - 18, 3, 18);
  }
  // wieżowce (parallax 0.16): bryła z bocznym cieniem, gradientem i detalami dachu
  const off = camX * PX * 0.16;
  const bTop = rgb(mixRgbArr(pal.bld, pal.rim, 0.18)), bBot = rgb(mulRgb(pal.bld, 0.7)), bSide = rgb(mulRgb(pal.bld, 0.55));
  for (let i = Math.floor((off - 300) / BLD_SLOT); i <= Math.floor((off + W + 300) / BLD_SLOT); i++) {
    const b = bInfo(i), x = i * BLD_SLOT - off + b.dx - 150, top = base - b.h;
    const side = 12;
    c.fillStyle = bSide; c.beginPath(); c.moveTo(x + b.w, top); c.lineTo(x + b.w + side, top + 6); c.lineTo(x + b.w + side, base); c.lineTo(x + b.w, base); c.closePath(); c.fill();
    const g = c.createLinearGradient(0, top, 0, base);
    g.addColorStop(0, bTop); g.addColorStop(1, bBot);
    c.fillStyle = g; c.fillRect(x, top, b.w, b.h);
    c.fillStyle = rgb(pal.rim, 0.5); c.fillRect(x, top, 2.5, b.h);
    c.fillStyle = rgb(pal.rim, 0.3); c.fillRect(x, top, b.w, 2.5);
    // gzymsy co kilka pięter
    c.fillStyle = 'rgba(0,0,0,0.18)';
    for (let yy = top + 46; yy < base - 20; yy += 68) c.fillRect(x, yy, b.w, 3);
    // dach: zbiornik / klimatyzatory / antena
    c.fillStyle = bBot;
    const roof = hash1(i * 43);
    if (roof < 0.3) { c.fillRect(x + b.w * 0.2, top - 16, 18, 16); c.beginPath(); c.moveTo(x + b.w * 0.2 - 2, top - 16); c.lineTo(x + b.w * 0.2 + 9, top - 24); c.lineTo(x + b.w * 0.2 + 20, top - 16); c.fill(); }
    else if (roof < 0.6) { c.fillRect(x + b.w * 0.15, top - 8, 14, 8); c.fillRect(x + b.w * 0.55, top - 10, 18, 10); }
    if (b.antenna) {
      c.fillRect(x + b.w * 0.5 - 1.5, top - 34, 3, 34);
      if (pal.neon > 0.2) { c.fillStyle = '#ff3d5a'; c.globalAlpha = 0.5 + 0.5 * Math.sin(G.menuT * 4 + i); c.fillRect(x + b.w * 0.5 - 2.5, top - 38, 5, 5); drawGlow(c, '#ff3d5a', x + b.w * 0.5, top - 36, 10, c.globalAlpha); c.globalAlpha = 1; }
    }
    if (pal.win > 0.03) { c.globalAlpha = pal.win; c.drawImage(windowsCanvas(i, b), x, top); c.globalAlpha = 1; }
    if (b.neon && pal.neon > 0.05) {
      const nx = x + b.w * 0.2, ny = top + 26, nw = b.w * 0.6, nh = 22;
      c.globalAlpha = pal.neon;
      drawGlow(c, b.neonCol, nx + nw / 2, ny + nh / 2, nw * 0.85, 0.5);
      c.fillStyle = 'rgba(5,5,20,0.6)'; rr(c, nx, ny, nw, nh, 5); c.fill();
      c.strokeStyle = b.neonCol; c.lineWidth = 2.5; c.stroke();
      c.fillStyle = b.neonCol; c.font = fontO(b.brand ? 9 : 10, 700); c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText(b.brand ? 'KUKIRIN' : NEON_WORDS[((i % 5) + 5) % 5], nx + nw / 2, ny + nh / 2 + 1);
      c.globalAlpha = 1;
    }
  }
}
function mixRgbArr(a, b, t) { return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)]; }

function drawPalm(c, x, y, s, sway, col, hi) {
  c.strokeStyle = col; c.fillStyle = col; c.lineCap = 'round';
  const tx = x + (14 + sway * 4) * s, ty = y - 150 * s;
  // pień z segmentami
  c.lineWidth = 7 * s;
  c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + 18 * s, y - 70 * s, tx, ty); c.stroke();
  c.lineWidth = 4 * s;
  c.beginPath(); c.moveTo(x - 6 * s, y); c.lineTo(x + 6 * s, y); c.stroke();
  if (hi) {
    c.strokeStyle = hi; c.lineWidth = 1.2 * s;
    for (let k = 1; k < 9; k++) {
      const t = k / 9, px = lerp(lerp(x, x + 18 * s, t), lerp(x + 18 * s, tx, t), t), py = lerp(lerp(y, y - 70 * s, t), lerp(y - 70 * s, ty, t), t);
      line(c, px - 3 * s, py, px + 2 * s, py - 2 * s);
    }
  }
  const angs = [-2.95, -2.5, -2.05, -1.55, -1.1, -0.65, -0.2, 0.2];
  c.fillStyle = col;
  for (let k = 0; k < angs.length; k++) {
    const a = angs[k] + sway * 0.08;
    const L = (50 + (k % 3) * 9) * s;
    const ex = tx + Math.cos(a) * L, ey = ty + Math.sin(a) * L * 0.5 + 30 * s;
    const cx = tx + Math.cos(a) * L * 0.5, cy = ty + Math.sin(a) * L * 0.6 - 14 * s;
    c.beginPath(); c.moveTo(tx, ty); c.quadraticCurveTo(cx, cy - 2 * s, ex, ey); c.quadraticCurveTo(cx, cy + 9 * s, tx, ty + 4 * s); c.fill();
    // ząbki liści
    c.lineWidth = 1.6 * s; c.strokeStyle = col;
    for (let j = 1; j < 5; j++) {
      const t = j / 5, px = lerp(lerp(tx, cx, t), lerp(cx, ex, t), t), py = lerp(lerp(ty, cy, t), lerp(cy, ey, t), t);
      line(c, px, py, px + Math.cos(a + 1.2) * 7 * s, py + 7 * s);
    }
  }
  circle(c, tx, ty + 2 * s, 6 * s);
}
function drawLamp(c, x, y, s, pal) {
  const col = rgb(pal.palm);
  c.strokeStyle = col; c.lineWidth = 3.5 * s; c.lineCap = 'round';
  line(c, x, y, x, y - 128 * s);
  c.fillStyle = col; rr(c, x - 4 * s, y - 10 * s, 8 * s, 10 * s, 2 * s); c.fill();
  c.lineWidth = 3 * s;
  c.beginPath(); c.moveTo(x, y - 128 * s); c.quadraticCurveTo(x + 4 * s, y - 140 * s, x + 24 * s, y - 135 * s); c.stroke();
  rr(c, x + 14 * s, y - 138 * s, 20 * s, 6 * s, 3 * s); c.fill();
  if (pal.lamp > 0.05) {
    c.fillStyle = `rgba(255,236,190,${0.9 * pal.lamp})`; rr(c, x + 16 * s, y - 133 * s, 16 * s, 2.5 * s, 1 * s); c.fill();
    drawGlow(c, '#ffcf7a', x + 24 * s, y - 130 * s, 50 * s, pal.lamp);
    // stożek światła
    c.save(); c.globalCompositeOperation = 'lighter';
    const lg = c.createLinearGradient(0, y - 130 * s, 0, y + 6 * s);
    lg.addColorStop(0, `rgba(255,210,140,${0.18 * pal.lamp})`); lg.addColorStop(1, 'rgba(255,210,140,0)');
    c.fillStyle = lg; c.beginPath(); c.moveTo(x + 18 * s, y - 132 * s); c.lineTo(x + 30 * s, y - 132 * s); c.lineTo(x + 62 * s, y + 6 * s); c.lineTo(x - 14 * s, y + 6 * s); c.closePath(); c.fill();
    c.restore();
    c.fillStyle = `rgba(255,214,140,${0.14 * pal.lamp})`;
    c.beginPath(); c.ellipse(x + 24 * s, y + 6 * s, 44 * s, 9 * s, 0, 0, TAU); c.fill();
  }
}

function drawStreet(c, pal, camX, t) {
  const yTop = laneY(-0.5), yBot = laneY(2.5);
  // dalszy chodnik (promenada)
  const sg = c.createLinearGradient(0, HORIZON, 0, yTop);
  sg.addColorStop(0, rgb(mulRgb(pal.side, 0.8))); sg.addColorStop(1, rgb(pal.side));
  c.fillStyle = sg; c.fillRect(-200, HORIZON, W + 400, yTop - HORIZON + 1);
  c.strokeStyle = rgb(pal.sideLine); c.lineWidth = 1.5;
  const sF = laneS(-0.5), w0 = camX - (PSX + 300) / (PX * sF), w1 = camX + (W - PSX + 300) / (PX * sF);
  c.beginPath();
  for (let k = Math.floor(w0 / 3); k <= Math.ceil(w1 / 3); k++) {
    const wx = k * 3;
    c.moveTo(sxAt(wx, -0.5, camX), yTop); c.lineTo(sxAt(wx, -1.08, camX), HORIZON);
  }
  c.moveTo(-200, laneY(-0.8)); c.lineTo(W + 200, laneY(-0.8));
  c.stroke();
  // balustrada promenady na tylnej krawędzi
  const sR = laneS(-1.05), yR = laneY(-1.05);
  c.strokeStyle = rgb(mixRgbArr(pal.sideLine, pal.rim, 0.25)); c.lineWidth = 2;
  c.beginPath();
  c.moveTo(-200, yR - 20 * sR); c.lineTo(W + 200, yR - 20 * sR);
  c.moveTo(-200, yR - 11 * sR); c.lineTo(W + 200, yR - 11 * sR);
  const r0 = camX - (PSX + 200) / (PX * sR), r1 = camX + (W - PSX + 200) / (PX * sR);
  for (let k = Math.floor(r0 / 2); k <= Math.ceil(r1 / 2); k++) { const px = sxAt(k * 2, -1.05, camX); c.moveTo(px, yR); c.lineTo(px, yR - 22 * sR); }
  c.stroke();
  if (pal.neon > 0.1) { c.fillStyle = `rgba(41,212,255,${0.35 * pal.neon})`; c.fillRect(-200, yR - 21 * sR, W + 400, 1.5); }
  // przecznice (wyjazdy aut)
  for (const o of objects.items) {
    if (!o.active || o.kind !== 'sidestreet') continue;
    const xa = sxAt(o.x - 2.6, -0.5, camX), xb = sxAt(o.x + 2.6, -0.5, camX), xc = sxAt(o.x + 2.6, -1.08, camX), xd = sxAt(o.x - 2.6, -1.08, camX);
    c.fillStyle = rgb(pal.road2); c.beginPath(); c.moveTo(xa, yTop + 1); c.lineTo(xb, yTop + 1); c.lineTo(xc, HORIZON - 2); c.lineTo(xd, HORIZON - 2); c.closePath(); c.fill();
    c.fillStyle = 'rgba(255,255,255,0.6)'; c.fillRect(xa, yTop - 4, xb - xa, 2.5);
    c.fillStyle = 'rgba(255,212,0,0.6)'; c.fillRect((xa + xd) / 2 + (xb - xa) * 0.48, HORIZON, 2, yTop - HORIZON - 6);
  }
  // palmy i latarnie na dalszym chodniku
  const sP = laneS(-0.98), yP = laneY(-0.98);
  const p0 = camX - (PSX + 200) / (PX * sP), p1 = camX + (W - PSX + 200) / (PX * sP);
  const palmCol = rgb(pal.palm), palmHi = rgb(pal.rim, 0.35);
  for (let k = Math.floor(p0 / 11); k <= Math.ceil(p1 / 11); k++) {
    const wx = k * 11 + hash1(k * 3) * 4;
    if (hash1(k * 19) < 0.78) drawPalm(c, sxAt(wx, -0.98, camX), yP, sP * (0.9 + hash1(k) * 0.25), Math.sin(t * 1.3 + k), palmCol, palmHi);
  }
  const sL = laneS(-0.62), yL = laneY(-0.62);
  for (let k = Math.floor(p0 / 15); k <= Math.ceil(p1 / 15); k++) drawLamp(c, sxAt(k * 15 + 6, -0.62, camX), yL, sL, pal);
  // krawężnik dalszy (bryła)
  c.fillStyle = rgb(mixRgbArr(pal.sideLine, [255, 255, 255], 0.12)); c.fillRect(-200, yTop - 5, W + 400, 3);
  c.fillStyle = rgb(mulRgb(pal.side, 0.6)); c.fillRect(-200, yTop - 2, W + 400, 4);
  // jezdnia + faktura
  const rg = c.createLinearGradient(0, yTop, 0, yBot);
  rg.addColorStop(0, rgb(pal.road2)); rg.addColorStop(1, rgb(pal.road));
  c.fillStyle = rg; c.fillRect(-200, yTop + 2, W + 400, yBot - yTop - 2);
  if (!asphaltPattern) asphaltPattern = c.createPattern(asphaltCanvas, 'repeat');
  if (asphaltPattern) {
    const ox = -((camX * PX * laneS(1)) % 256);
    c.save(); c.translate(ox, yTop); c.fillStyle = asphaltPattern; c.globalAlpha = 0.9;
    c.fillRect(-256, 2, W + 712, yBot - yTop - 2); c.restore();
  }
  // łaty asfaltu
  c.fillStyle = 'rgba(0,0,0,0.12)';
  for (let l = 0; l < 3; l++) {
    const s = laneS(l), y = laneY(l), a0 = camX - (PSX + 200) / (PX * s), a1 = camX + (W - PSX + 200) / (PX * s);
    for (let k = Math.floor(a0 / 9); k <= Math.ceil(a1 / 9); k++) {
      if (hash2(k, l) > 0.35) continue;
      c.beginPath(); c.ellipse(sxAt(k * 9 + hash2(l, k) * 6, l, camX), y + 10 * s, (30 + hash2(k + 7, l) * 40) * s, 7 * s, 0, 0, TAU); c.fill();
    }
  }
  // mokre odbicia latarni i neonów (zmierzch/noc)
  if (pal.lamp > 0.1) {
    for (let k = Math.floor(p0 / 15); k <= Math.ceil(p1 / 15); k++) {
      const lx = sxAt(k * 15 + 6, -0.62, camX) + 24 * sL;
      c.save(); c.translate(lx, yTop + 34); c.scale(0.28, 1.5);
      drawGlow(c, '#ffcf7a', 0, 0, 40, 0.3 * pal.lamp);
      c.restore();
    }
  }
  // neonowe linie krawędzi
  c.fillStyle = rgb(pal.line, 0.85); c.fillRect(-200, laneY(-0.42), W + 400, 2.5); c.fillRect(-200, laneY(2.42), W + 400, 3);
  if (pal.neon > 0.1) {
    c.fillStyle = `rgba(41,212,255,${0.2 * pal.neon})`; c.fillRect(-200, laneY(-0.42) - 3, W + 400, 8);
    c.fillStyle = `rgba(255,61,139,${0.2 * pal.neon})`; c.fillRect(-200, laneY(2.42) - 4, W + 400, 10);
    c.fillStyle = `rgba(255,61,139,${0.07 * pal.neon})`; c.fillRect(-200, laneY(2.42) - 30, W + 400, 26);
  }
  // przerywane linie pasów
  c.fillStyle = rgb(pal.line, 0.85);
  for (const lf of [0.5, 1.5]) {
    const s = laneS(lf), y = laneY(lf), a0 = camX - (PSX + 200) / (PX * s), a1 = camX + (W - PSX + 200) / (PX * s);
    for (let k = Math.floor(a0 / 5); k <= Math.ceil(a1 / 5); k++) {
      const xa = sxAt(k * 5, lf, camX), xb = sxAt(k * 5 + 2.4, lf, camX);
      c.fillRect(xa, y - 1.5 * s, xb - xa, 3 * s);
    }
  }
  // przejścia dla pieszych
  for (const o of objects.items) {
    if (!o.active || o.kind !== 'crosswalk') continue;
    c.fillStyle = 'rgba(240,240,255,0.8)';
    for (let j = 0; j < 12; j++) {
      const la = -0.46 + j * 0.25, lb = la + 0.13;
      const ya = laneY(la), yb = laneY(lb);
      c.beginPath();
      c.moveTo(sxAt(o.x - 1.3, la, camX), ya); c.lineTo(sxAt(o.x + 1.3, la, camX), ya);
      c.lineTo(sxAt(o.x + 1.3, lb, camX), yb); c.lineTo(sxAt(o.x - 1.3, lb, camX), yb);
      c.closePath(); c.fill();
    }
  }
  // bliższy chodnik: krawężnik z bryłą + płyty
  c.fillStyle = rgb(mixRgbArr(pal.sideLine, [255, 255, 255], 0.15)); c.fillRect(-200, yBot, W + 400, 4);
  c.fillStyle = rgb(mulRgb(pal.near, 0.6)); c.fillRect(-200, yBot + 4, W + 400, 7);
  c.fillStyle = rgb(pal.near); c.fillRect(-200, yBot + 11, W + 400, H - yBot + 200);
  c.strokeStyle = 'rgba(0,0,0,0.25)'; c.lineWidth = 2;
  const sN = laneS(2.5), b0 = camX - (PSX + 200) / (PX * sN), b1 = camX + (W - PSX + 200) / (PX * sN);
  c.beginPath();
  for (let k = Math.floor(b0 / 3); k <= Math.ceil(b1 / 3); k++) { c.moveTo(sxAt(k * 3, 2.5, camX), yBot + 11); c.lineTo(sxAt(k * 3, 3.4, camX), laneY(3.4)); }
  c.stroke();
}

/** Pierwszy plan: donice z neonem i słupki na bliższym chodniku. */
function drawForeground(c, pal, camX) {
  const lf = 2.8, s = laneS(lf), y = laneY(lf) + 8;
  const a0 = camX - (PSX + 300) / (PX * s), a1 = camX + (W - PSX + 300) / (PX * s);
  const neon = Math.max(0.25, pal.neon);
  for (let k = Math.floor(a0 / 4); k <= Math.ceil(a1 / 4); k++) {
    const x = sxAt(k * 4, lf, camX);
    if (k % 4 === 0) {
      // donica z krzewem
      const w = 70 * s, h = 24 * s;
      c.fillStyle = OUT; rr(c, x - w / 2 - 2, y - h - 2, w + 4, h + 4, 5 * s); c.fill();
      c.fillStyle = rgb(mulRgb(pal.near, 0.75)); rr(c, x - w / 2, y - h, w, h, 4 * s); c.fill();
      c.fillStyle = `rgba(255,61,139,${0.9 * neon})`; c.fillRect(x - w / 2, y - h, w, 2.5 * s);
      drawGlow(c, '#ff3d8b', x, y - h, w * 0.6, 0.35 * neon);
      c.fillStyle = rgb(mixRgbArr(pal.palm, [20, 90, 70], 0.35));
      for (let j = 0; j < 5; j++) circle(c, x - w * 0.35 + j * w * 0.175, y - h - (6 + hash1(k * 7 + j) * 8) * s, (10 + hash1(k * 3 + j) * 5) * s);
    } else {
      // słupek
      c.fillStyle = OUT; rr(c, x - 5 * s, y - 30 * s, 10 * s, 30 * s, 4 * s); c.fill();
      c.fillStyle = rgb(mulRgb(pal.sideLine, 0.8)); rr(c, x - 3.5 * s, y - 28.5 * s, 7 * s, 27 * s, 3 * s); c.fill();
      c.fillStyle = `rgba(41,212,255,${0.9 * neon})`; c.fillRect(x - 3.5 * s, y - 24 * s, 7 * s, 2.5 * s);
    }
  }
}

function drawFlatHazard(c, o, x, y, s) {
  if (o.kind === 'manhole') {
    c.fillStyle = 'rgba(0,0,0,0.35)'; c.beginPath(); c.ellipse(x, y + 1.5 * s, 26 * s, 8.5 * s, 0, 0, TAU); c.fill();
    const g = c.createLinearGradient(0, y - 7 * s, 0, y + 7 * s);
    g.addColorStop(0, '#5a5c6c'); g.addColorStop(1, '#25262f');
    c.fillStyle = g; c.beginPath(); c.ellipse(x, y, 24 * s, 7.5 * s, 0, 0, TAU); c.fill();
    c.strokeStyle = '#8a8c9c'; c.lineWidth = 1.6 * s; c.stroke();
    c.strokeStyle = 'rgba(20,20,28,0.8)'; c.lineWidth = 1.4 * s;
    for (let k = -2; k <= 2; k++) line(c, x + k * 8 * s, y - 5 * s, x + k * 8 * s, y + 5 * s);
    c.beginPath(); c.ellipse(x, y, 15 * s, 4.5 * s, 0, 0, TAU); c.stroke();
  } else {
    c.fillStyle = 'rgba(15,10,25,0.55)';
    c.beginPath(); c.ellipse(x, y, 34 * s, 8 * s, 0, 0, TAU); c.fill();
    c.fillStyle = 'rgba(255,255,255,0.1)';
    c.beginPath(); c.ellipse(x - 3 * s, y - 2.5 * s, 28 * s, 4 * s, 0, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(0,0,0,0.5)'; c.lineWidth = 1.5 * s;
    c.beginPath(); c.moveTo(x - 26 * s, y - 2 * s); c.lineTo(x - 8 * s, y + 3 * s); c.lineTo(x + 6 * s, y - 3 * s); c.lineTo(x + 24 * s, y + 2 * s); c.stroke();
    c.fillStyle = '#ffd400'; c.globalAlpha = 0.75;
    for (let k = 0; k < 4; k++) c.fillRect(x - 30 * s + k * 17 * s, y - 10 * s, 8 * s, 2.5 * s);
    c.globalAlpha = 1;
  }
}

// ---------- pojazdy, piesi, przedmioty ----------
function carWheel(c, x, y, r, rot) {
  c.fillStyle = OUT; circle(c, x, y, r + 1.5);
  c.fillStyle = '#111218'; circle(c, x, y, r);
  const g = c.createRadialGradient(x - r * 0.2, y - r * 0.2, 1, x, y, r * 0.6);
  g.addColorStop(0, '#f2f5fb'); g.addColorStop(1, '#6b7388');
  c.fillStyle = g; circle(c, x, y, r * 0.58);
  c.strokeStyle = '#2f3442'; c.lineWidth = 2.6;
  for (let k = 0; k < 5; k++) { const a = rot + (k * TAU) / 5; line(c, x + Math.cos(a) * r * 0.15, y + Math.sin(a) * r * 0.15, x + Math.cos(a) * r * 0.55, y + Math.sin(a) * r * 0.55); }
  c.fillStyle = '#2a2e3a'; circle(c, x, y, r * 0.16);
}
function carBodyPath(c, L) {
  c.beginPath();
  c.moveTo(4, -20); c.lineTo(2, -46); c.quadraticCurveTo(4, -62, 22, -64);
  c.lineTo(L * 0.22, -64); c.quadraticCurveTo(L * 0.3, -98, L * 0.42, -99);
  c.lineTo(L * 0.6, -99); c.quadraticCurveTo(L * 0.7, -97, L * 0.78, -66);
  c.lineTo(L - 16, -60); c.quadraticCurveTo(L, -56, L - 1, -40); c.lineTo(L - 3, -20); c.closePath();
}
function drawCar(c, x, y, s, o, pal) {
  const L = o.len * PX, night = pal.lamp;
  c.save(); c.translate(x, y); c.scale(s, s);
  c.fillStyle = 'rgba(0,0,0,0.4)'; c.beginPath(); c.ellipse(L * 0.5, 2, L * 0.56, 10, 0, 0, TAU); c.fill();
  if (night > 0.3) { c.save(); c.scale(1, 0.22); drawGlow(c, o.variant === 1 ? '#ffd400' : '#ff3d8b', L * 0.5, -10, L * 0.55, 0.55 * night); c.restore(); }
  // karoseria z gradientem i konturem
  carBodyPath(c, L);
  const g = c.createLinearGradient(0, -100, 0, -18);
  g.addColorStop(0, shade(o.color, 0.4)); g.addColorStop(0.42, o.color); g.addColorStop(1, shade(o.color, -0.5));
  c.fillStyle = g; c.fill();
  c.strokeStyle = OUT; c.lineWidth = 2.5; c.lineJoin = 'round'; c.stroke();
  // linia światła na "ramieniu" auta
  c.strokeStyle = 'rgba(255,255,255,0.5)'; c.lineWidth = 2;
  c.beginPath(); c.moveTo(12, -58); c.quadraticCurveTo(L * 0.5, -62, L - 22, -57); c.stroke();
  c.fillStyle = 'rgba(0,0,0,0.3)'; c.fillRect(6, -31, L - 12, 10);
  // szyby odbijające niebo
  const wg = c.createLinearGradient(0, -95, 0, -66);
  wg.addColorStop(0, rgb(pal.skyMid)); wg.addColorStop(1, '#0d1430');
  c.fillStyle = wg; c.strokeStyle = OUT; c.lineWidth = 1.6;
  c.beginPath(); c.moveTo(L * 0.25, -66); c.quadraticCurveTo(L * 0.31, -92, L * 0.42, -93); c.lineTo(L * 0.49, -93); c.lineTo(L * 0.49, -66); c.closePath(); c.fill(); c.stroke();
  c.beginPath(); c.moveTo(L * 0.52, -66); c.lineTo(L * 0.52, -93); c.lineTo(L * 0.6, -93); c.quadraticCurveTo(L * 0.67, -91, L * 0.74, -66); c.closePath(); c.fill(); c.stroke();
  c.fillStyle = 'rgba(255,255,255,0.28)';
  c.beginPath(); c.moveTo(L * 0.33, -68); c.lineTo(L * 0.39, -90); c.lineTo(L * 0.42, -90); c.lineTo(L * 0.36, -68); c.closePath(); c.fill();
  c.beginPath(); c.moveTo(L * 0.6, -68); c.lineTo(L * 0.64, -86); c.lineTo(L * 0.655, -86); c.lineTo(L * 0.615, -68); c.closePath(); c.fill();
  c.strokeStyle = 'rgba(0,0,0,0.35)'; c.lineWidth = 2; line(c, L * 0.505, -64, L * 0.505, -24); line(c, L * 0.27, -62, L * 0.27, -26);
  c.fillStyle = 'rgba(0,0,0,0.45)'; c.fillRect(L * 0.4, -54, 11, 3); c.fillRect(L * 0.62, -54, 11, 3);
  // lusterko
  c.fillStyle = shade(o.color, -0.3); c.beginPath(); c.moveTo(L * 0.75, -66); c.lineTo(L * 0.79, -73); c.lineTo(L * 0.81, -66); c.closePath(); c.fill();
  // nadkola i koła
  c.fillStyle = '#07080d';
  c.beginPath(); c.arc(L * 0.2, -19, 24, Math.PI, TAU); c.fill();
  c.beginPath(); c.arc(L * 0.8, -19, 24, Math.PI, TAU); c.fill();
  const rot = o.x / 0.4;
  carWheel(c, L * 0.2, -19, 19, rot); carWheel(c, L * 0.8, -19, 19, rot);
  // światła
  c.fillStyle = OUT; rr(c, L - 10, -55, 9, 12, 2); c.fill();
  c.fillStyle = '#fff6c8'; rr(c, L - 9, -54, 7, 10, 2); c.fill();
  c.fillStyle = OUT; rr(c, 0, -55, 8, 13, 2); c.fill();
  c.fillStyle = '#ff2d55'; rr(c, 1, -54, 6, 11, 2); c.fill();
  if (o.variant === 1) {
    c.fillStyle = OUT; rr(c, L * 0.44 - 1, -113, L * 0.13 + 2, 14, 3); c.fill();
    c.fillStyle = '#ffd400'; rr(c, L * 0.44, -112, L * 0.13, 12, 3); c.fill();
    c.fillStyle = '#111'; c.font = fontO(8); c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('TAXI', L * 0.505, -106);
    c.fillStyle = '#111'; for (let k = 0; k < 6; k++) c.fillRect(L * 0.3 + k * 16, -40, 8, 4);
  }
  c.restore();
  drawGlow(c, '#ff2d55', x + 4 * s, y - 49 * s, 16 * s, 0.3 + night * 0.6);
  if (night > 0.2) {
    drawGlow(c, '#fff3c0', x + (L - 4) * s, y - 49 * s, 26 * s, night);
    c.save(); c.globalCompositeOperation = 'lighter';
    const bg = c.createLinearGradient(x + L * s, 0, x + (L + 170) * s, 0);
    bg.addColorStop(0, `rgba(255,240,190,${0.22 * night})`); bg.addColorStop(1, 'rgba(255,240,190,0)');
    c.fillStyle = bg; c.beginPath(); c.moveTo(x + L * s, y - 52 * s); c.lineTo(x + (L + 170) * s, y - 70 * s); c.lineTo(x + (L + 170) * s, y + 4 * s); c.lineTo(x + L * s, y - 44 * s); c.closePath(); c.fill();
    c.restore();
  }
}
function drawBus(c, x, y, s, o, pal) {
  const L = o.len * PX;
  c.save(); c.translate(x, y); c.scale(s, s);
  c.fillStyle = 'rgba(0,0,0,0.42)'; c.beginPath(); c.ellipse(L * 0.5, 4, L * 0.54, 22, 0, 0, TAU); c.fill();
  rr(c, 0, -160, L, 140, 16);
  const g = c.createLinearGradient(0, -160, 0, -20);
  g.addColorStop(0, shade(o.color, 0.35)); g.addColorStop(0.5, o.color); g.addColorStop(1, shade(o.color, -0.45));
  c.fillStyle = g; c.fill(); c.strokeStyle = OUT; c.lineWidth = 3; c.stroke();
  c.fillStyle = 'rgba(255,255,255,0.25)'; c.fillRect(8, -156, L - 16, 4);
  c.fillStyle = 'rgba(0,0,0,0.25)'; c.fillRect(2, -48, L - 4, 28);
  // okna z odbiciem nieba
  const wg = c.createLinearGradient(0, -142, 0, -92);
  wg.addColorStop(0, rgb(pal.skyMid)); wg.addColorStop(1, '#0d1430');
  c.fillStyle = wg; rr(c, 14, -142, L - 40, 50, 6); c.fill(); c.strokeStyle = OUT; c.lineWidth = 2; c.stroke();
  c.fillStyle = shade(o.color, -0.2);
  for (let k = 1; k < 8; k++) c.fillRect(14 + k * ((L - 40) / 8) - 3, -142, 6, 50);
  c.fillStyle = 'rgba(255,255,255,0.22)';
  for (let k = 0; k < 8; k++) { const bx = 22 + k * ((L - 40) / 8); c.beginPath(); c.moveTo(bx, -96); c.lineTo(bx + 12, -138); c.lineTo(bx + 20, -138); c.lineTo(bx + 8, -96); c.closePath(); c.fill(); }
  c.fillStyle = wg; rr(c, L - 22, -146, 18, 76, 6); c.fill(); c.stroke();
  // reklama KuKirin na boku
  c.fillStyle = OUT; rr(c, L * 0.12 - 2, -86, L * 0.42 + 4, 34, 6); c.fill();
  c.fillStyle = '#14161e'; rr(c, L * 0.12, -84, L * 0.42, 30, 5); c.fill();
  c.fillStyle = '#ff7a1a'; c.fillRect(L * 0.12, -60, L * 0.42, 4);
  c.fillStyle = '#ffffff'; c.font = fontO(15); c.textAlign = 'left'; c.textBaseline = 'middle'; c.fillText('KUKIRIN', L * 0.12 + 12, -72);
  c.fillStyle = '#ffd400'; c.font = fontO(10, 700); c.fillText('RIDE THE NIGHT', L * 0.12 + 104, -72);
  // drzwi
  c.fillStyle = '#0f1424'; rr(c, L * 0.62, -88, 44, 66, 4); c.fill(); c.strokeStyle = OUT; c.stroke();
  c.strokeStyle = 'rgba(255,255,255,0.35)'; c.lineWidth = 2; line(c, L * 0.62 + 22, -88, L * 0.62 + 22, -22);
  c.fillStyle = '#111'; rr(c, L * 0.25, -158, 120, 16, 4); c.fill();
  c.fillStyle = '#ffb000'; c.font = fontO(11, 700); c.textAlign = 'center'; c.fillText('42 PROMENADA', L * 0.25 + 60, -150);
  c.fillStyle = '#07080d';
  c.beginPath(); c.arc(L * 0.15, -20, 30, Math.PI, TAU); c.fill();
  c.beginPath(); c.arc(L * 0.83, -20, 30, Math.PI, TAU); c.fill();
  const rot = o.x / 0.5;
  carWheel(c, L * 0.15, -22, 24, rot); carWheel(c, L * 0.83, -22, 24, rot);
  c.fillStyle = '#fff6c8'; rr(c, L - 8, -52, 7, 14, 2); c.fill();
  c.fillStyle = '#ff2d55'; rr(c, 1, -56, 6, 18, 2); c.fill();
  c.restore();
  if (pal.lamp > 0.2) { drawGlow(c, '#fff3c0', x + (L - 4) * s, y - 45 * s, 30 * s, pal.lamp); drawGlow(c, '#ff2d55', x + 4 * s, y - 47 * s, 22 * s, pal.lamp * 0.8); }
}
function drawCrossCar(c, x, y, s, o, pal) {
  c.save(); c.translate(x, y); c.scale(s, s);
  c.fillStyle = 'rgba(0,0,0,0.4)'; c.beginPath(); c.ellipse(0, 2, 56, 11, 0, 0, TAU); c.fill();
  c.fillStyle = OUT; rr(c, -48, -25, 17, 26, 5); c.fill(); rr(c, 31, -25, 17, 26, 5); c.fill();
  c.fillStyle = '#16171e'; rr(c, -47, -24, 15, 24, 4); c.fill(); rr(c, 32, -24, 15, 24, 4); c.fill();
  // kabina
  c.beginPath(); c.moveTo(-37, -60); c.lineTo(-28, -94); c.lineTo(28, -94); c.lineTo(37, -60); c.closePath();
  c.fillStyle = shade(o.color, 0.15); c.fill(); c.strokeStyle = OUT; c.lineWidth = 2.5; c.stroke();
  const wg = c.createLinearGradient(0, -90, 0, -62);
  wg.addColorStop(0, rgb(pal.skyMid)); wg.addColorStop(1, '#0d1430');
  c.fillStyle = wg; c.beginPath(); c.moveTo(-31, -63); c.lineTo(-24, -89); c.lineTo(24, -89); c.lineTo(31, -63); c.closePath(); c.fill();
  c.fillStyle = 'rgba(255,255,255,0.28)'; c.beginPath(); c.moveTo(-20, -66); c.lineTo(-13, -86); c.lineTo(-6, -86); c.lineTo(-13, -66); c.closePath(); c.fill();
  // przód z gradientem
  rr(c, -49, -62, 98, 46, 12);
  const g = c.createLinearGradient(0, -62, 0, -16);
  g.addColorStop(0, shade(o.color, 0.3)); g.addColorStop(1, shade(o.color, -0.45));
  c.fillStyle = g; c.fill(); c.strokeStyle = OUT; c.lineWidth = 2.5; c.stroke();
  c.fillStyle = 'rgba(0,0,0,0.3)'; c.fillRect(-48, -30, 96, 12);
  c.fillStyle = '#0c0d12'; rr(c, -22, -43, 44, 12, 3); c.fill();
  c.strokeStyle = '#3a3f50'; c.lineWidth = 1; for (let k = -18; k <= 18; k += 6) line(c, k, -42, k, -32);
  c.fillStyle = OUT; rr(c, -46, -53, 19, 11, 4); c.fill(); rr(c, 27, -53, 19, 11, 4); c.fill();
  c.fillStyle = '#fff6c8'; rr(c, -45, -52, 17, 9, 4); c.fill(); rr(c, 28, -52, 17, 9, 4); c.fill();
  c.fillStyle = '#eee'; rr(c, -12, -28, 24, 8, 2); c.fill();
  c.restore();
  const a = 0.35 + pal.lamp * 0.65;
  drawGlow(c, '#fff3c0', x - 36 * s, y - 48 * s, 24 * s, a); drawGlow(c, '#fff3c0', x + 36 * s, y - 48 * s, 24 * s, a);
}
function drawPed(c, x, y, s, o) {
  c.fillStyle = 'rgba(0,0,0,0.3)'; c.beginPath(); c.ellipse(x, y + 1, 18 * s, 5 * s, 0, 0, TAU); c.fill();
  c.save(); c.translate(x, y - o.hop * s); c.scale(s, s);
  const walking = o.state === 'walk', dodge = o.state === 'dodge';
  const sw = walking ? Math.sin(o.phase) : 0;
  const toward = o.laneV > 0;
  const l1 = walking ? Math.max(0, sw) * 8 : 0, l2 = walking ? Math.max(0, -sw) * 8 : 0;
  c.lineJoin = 'round';
  // nogi
  c.strokeStyle = OUT; c.lineWidth = 2;
  c.fillStyle = o.color2;
  rr(c, -10, -48, 9, 48 - l1, 3); c.fill(); c.stroke(); rr(c, 1, -48, 9, 48 - l2, 3); c.fill(); c.stroke();
  c.fillStyle = '#f2f2f2'; rr(c, -12, -6 - l1, 12, 6, 2); c.fill(); c.stroke(); rr(c, 0, -6 - l2, 12, 6, 2); c.fill(); c.stroke();
  const bob = walking ? Math.abs(sw) * 2 : 0;
  c.translate(0, -bob);
  // ręce
  c.lineCap = 'round';
  const arm = (x1, y1, x2, y2) => { c.strokeStyle = OUT; c.lineWidth = 10; line(c, x1, y1, x2, y2); c.strokeStyle = shade(o.color, -0.15); c.lineWidth = 7; line(c, x1, y1, x2, y2); };
  let hx1, hy1, hx2, hy2;
  if (dodge) { hx1 = -24; hy1 = -108; hx2 = 24; hy2 = -108; } else { hx1 = -17; hy1 = -56 + sw * 6; hx2 = 17; hy2 = -56 - sw * 6; }
  arm(-12, -80, hx1, hy1); arm(12, -80, hx2, hy2);
  c.fillStyle = o.skin; c.strokeStyle = OUT; c.lineWidth = 1.5;
  c.beginPath(); c.arc(hx1, hy1 - 2, 4.5, 0, TAU); c.fill(); c.stroke();
  c.beginPath(); c.arc(hx2, hy2 - 2, 4.5, 0, TAU); c.fill(); c.stroke();
  // tułów z cieniowaniem
  rr(c, -14, -88, 28, 44, 9);
  const g = c.createLinearGradient(-14, 0, 14, 0);
  g.addColorStop(0, shade(o.color, 0.2)); g.addColorStop(1, shade(o.color, -0.3));
  c.fillStyle = g; c.fill(); c.strokeStyle = OUT; c.lineWidth = 2; c.stroke();
  if (o.variant === 1) { c.fillStyle = 'rgba(255,255,255,0.35)'; c.fillRect(-14, -68, 28, 4); }
  if (o.variant === 2 && !toward) { c.fillStyle = '#3a2a1a'; rr(c, -11, -84, 22, 26, 5); c.fill(); c.stroke(); }
  // szyja i głowa
  c.fillStyle = o.skin; c.fillRect(-4, -94, 8, 8);
  c.beginPath(); c.arc(0, -100, 11, 0, TAU); c.fill(); c.strokeStyle = OUT; c.lineWidth = 2; c.stroke();
  c.fillStyle = o.hair || '#222';
  if (toward) {
    c.beginPath(); c.arc(0, -102, 11.5, Math.PI * 1.05, Math.PI * 1.95); c.fill();
    if (o.variant === 4) { c.fillRect(-12, -102, 4, 16); c.fillRect(8, -102, 4, 16); }
    c.fillStyle = '#1b1b1b'; circle(c, -4, -99, 1.7); circle(c, 4, -99, 1.7);
    c.fillStyle = 'rgba(255,120,120,0.35)'; circle(c, -7, -95, 2.2); circle(c, 7, -95, 2.2);
    if (dodge) { c.fillStyle = '#3a1010'; circle(c, 0, -93, 2.6); }
    else { c.strokeStyle = '#6a3020'; c.lineWidth = 1.3; c.beginPath(); c.arc(0, -96, 3, 0.2, Math.PI - 0.2); c.stroke(); }
  } else {
    c.beginPath(); c.arc(0, -101, 11.8, 0, TAU); c.fill();
    if (o.variant === 4) { c.fillRect(-10, -100, 20, 18); }
  }
  if (o.variant === 0) { c.fillStyle = o.hair || '#222'; circle(c, 0, -113, 5); }
  if (o.variant === 3) {
    c.fillStyle = '#ffd400'; c.beginPath(); c.arc(0, -105, 12, Math.PI, TAU); c.fill(); c.strokeStyle = OUT; c.lineWidth = 1.5; c.stroke();
    c.fillRect(toward ? -2 : -14, -106, 16, 3);
  }
  c.restore();
}
function drawCone(c, x, y, s, o) {
  c.save(); c.translate(x + o.fx * s, y + o.fy * s); c.rotate(o.rot); c.scale(s, s);
  if (!o.hit) { c.fillStyle = 'rgba(0,0,0,0.35)'; c.beginPath(); c.ellipse(0, 1, 19, 4.5, 0, 0, TAU); c.fill(); }
  c.lineJoin = 'round'; c.strokeStyle = OUT; c.lineWidth = 2;
  c.fillStyle = '#b8460c'; rr(c, -16, -6, 32, 6, 2); c.fill(); c.stroke();
  c.beginPath(); c.moveTo(-11, -5); c.lineTo(-3, -37); c.lineTo(3, -37); c.lineTo(11, -5); c.closePath();
  const g = c.createLinearGradient(-11, 0, 11, 0); g.addColorStop(0, '#ffa04d'); g.addColorStop(0.6, '#ff7a1a'); g.addColorStop(1, '#c4500e');
  c.fillStyle = g; c.fill(); c.stroke();
  c.fillStyle = '#f5f5f5';
  c.beginPath(); c.moveTo(-8.4, -14); c.lineTo(-6.6, -21); c.lineTo(6.6, -21); c.lineTo(8.4, -14); c.closePath(); c.fill();
  c.beginPath(); c.moveTo(-5.4, -26); c.lineTo(-4.4, -30); c.lineTo(4.4, -30); c.lineTo(5.4, -26); c.closePath(); c.fill();
  c.restore();
}
function drawBattery(c, x, y, s, o, t) {
  const bob = Math.sin(t * 3 + o.phase) * 5 * s;
  const pop = o.hit ? 1 + o.t2 * 4 : 1, a = o.hit ? Math.max(0, 1 - o.t2 * 4) : 1;
  const cy = y - 38 * s + bob;
  c.fillStyle = 'rgba(0,0,0,0.25)'; c.beginPath(); c.ellipse(x, y + 1, 14 * s, 3.5 * s, 0, 0, TAU); c.fill();
  drawGlow(c, '#3dff6b', x, cy, 46 * s * pop, (0.75 + 0.15 * Math.sin(t * 6 + o.phase)) * a);
  c.save(); c.globalAlpha = a; c.translate(x, cy); c.scale(s * pop, s * pop);
  c.rotate(Math.sin(t * 2 + o.phase) * 0.12);
  c.fillStyle = OUT; rr(c, -12, -18, 24, 36, 6); c.fill();
  c.fillStyle = '#0f3d1d'; rr(c, -10.5, -16.5, 21, 33, 5); c.fill();
  const g = c.createLinearGradient(-9, 0, 9, 0); g.addColorStop(0, '#2bd957'); g.addColorStop(0.45, '#b6ffca'); g.addColorStop(1, '#22b84a');
  c.fillStyle = g; rr(c, -9, -15, 18, 30, 4); c.fill();
  c.fillStyle = OUT; rr(c, -6, -22.5, 12, 6.5, 2); c.fill();
  c.fillStyle = '#d6ffe2'; rr(c, -5, -21.5, 10, 4.5, 1.5); c.fill();
  c.fillStyle = OUT;
  c.beginPath(); c.moveTo(2.6, -13.5); c.lineTo(-7.2, 3); c.lineTo(-1.5, 3); c.lineTo(-3.8, 13.5); c.lineTo(7.2, -4); c.lineTo(1.4, -4); c.closePath(); c.fill();
  c.fillStyle = '#ffd400';
  c.beginPath(); c.moveTo(2, -12); c.lineTo(-6, 2); c.lineTo(-1, 2); c.lineTo(-3, 12); c.lineTo(6, -3); c.lineTo(1, -3); c.closePath(); c.fill();
  // przesuwający się połysk
  const sh = ((t * 0.8 + o.phase) % 2) * 30 - 20;
  c.fillStyle = 'rgba(255,255,255,0.45)'; c.fillRect(-9, sh - 15, 18, 2.5);
  c.restore();
}

// ---------- hulajnoga KuKirin + jeździec ----------
const RIDER = {
  hood: '#f6f7fb', hoodShade: '#c5ccdc', hoodDeep: '#99a3ba',
  pants: '#26324f', pantsFar: '#18203a', pantsHi: '#3e5080',
  skin: '#e2a982', glove: '#17181f', gloveAcc: '#ff7a1a',
  shoe: '#ffffff', shoeSole: '#1a1b22', shoeAcc: '#ff7a1a',
  bag: '#15171e', bagHi: '#2c3040', bagAcc: '#ff7a1a',
  helmet: '#15171e', helmetHi: '#474e63', helmetAcc: '#ff7a1a',
};

function drawWheel(c, x, y, r, rot, blur) {
  blur = blur || 0;
  c.fillStyle = OUT; circle(c, x, y, r + 1.8);
  c.fillStyle = '#131319'; circle(c, x, y, r);
  // klocki bieżnika (opona terenowa)
  c.fillStyle = '#2a2b34';
  for (let k = 0; k < 16; k++) {
    const a = rot + (k * TAU) / 16, w = 0.085, r0 = r - 0.5, r1 = r - 5;
    c.beginPath();
    c.moveTo(x + Math.cos(a - w) * r0, y + Math.sin(a - w) * r0);
    c.lineTo(x + Math.cos(a + w) * r0, y + Math.sin(a + w) * r0);
    c.lineTo(x + Math.cos(a + w * 0.6) * r1, y + Math.sin(a + w * 0.6) * r1);
    c.lineTo(x + Math.cos(a - w * 0.6) * r1, y + Math.sin(a - w * 0.6) * r1);
    c.closePath(); c.fill();
  }
  c.strokeStyle = 'rgba(255,255,255,0.12)'; c.lineWidth = 1.5;
  c.beginPath(); c.arc(x, y, r * 0.78, Math.PI * 1.1, Math.PI * 1.6); c.stroke();
  // felga
  const g = c.createRadialGradient(x - r * 0.2, y - r * 0.25, 1, x, y, r * 0.68);
  g.addColorStop(0, '#4f566c'); g.addColorStop(1, '#191c26');
  c.fillStyle = g; circle(c, x, y, r * 0.66);
  c.strokeStyle = OUT; c.lineWidth = 1.2; c.beginPath(); c.arc(x, y, r * 0.66, 0, TAU); c.stroke();
  // tarcza hamulcowa
  c.strokeStyle = '#cdd4e2'; c.lineWidth = 3.4; c.beginPath(); c.arc(x, y, r * 0.42, 0, TAU); c.stroke();
  c.fillStyle = '#69708a';
  for (let k = 0; k < 8; k++) { const a = rot * 1 + (k * TAU) / 8; circle(c, x + Math.cos(a) * r * 0.42, y + Math.sin(a) * r * 0.42, 0.9); }
  // szprychy (rozmyte przy dużej prędkości)
  c.globalAlpha *= 1 - blur * 0.75;
  c.strokeStyle = '#d4dbea'; c.lineWidth = 2.4; c.lineCap = 'round';
  for (let k = 0; k < 5; k++) {
    const a = rot + (k * TAU) / 5;
    line(c, x + Math.cos(a) * r * 0.16, y + Math.sin(a) * r * 0.16, x + Math.cos(a - 0.14) * r * 0.62, y + Math.sin(a - 0.14) * r * 0.62);
    line(c, x + Math.cos(a) * r * 0.16, y + Math.sin(a) * r * 0.16, x + Math.cos(a + 0.14) * r * 0.62, y + Math.sin(a + 0.14) * r * 0.62);
  }
  c.globalAlpha /= 1 - blur * 0.75;
  if (blur > 0.05) { c.fillStyle = `rgba(180,190,210,${0.22 * blur})`; circle(c, x, y, r * 0.62); }
  c.fillStyle = '#ffd400'; circle(c, x, y, r * 0.17);
  c.fillStyle = OUT; circle(c, x, y, r * 0.07);
}
/** Kończyna z konturem: najpierw obrys obu segmentów, potem wypełnienie. */
function limb(c, a, b, cpt, w1, w2, col) {
  c.lineCap = 'round'; c.lineJoin = 'round';
  c.strokeStyle = OUT;
  c.lineWidth = w1 + 3.5; line(c, a[0], a[1], b[0], b[1]);
  c.lineWidth = w2 + 3.5; line(c, b[0], b[1], cpt[0], cpt[1]);
  c.strokeStyle = col;
  c.lineWidth = w1; line(c, a[0], a[1], b[0], b[1]);
  c.lineWidth = w2; line(c, b[0], b[1], cpt[0], cpt[1]);
}
/** Połysk wzdłuż segmentu (przesunięty o off w bok). */
function sheen(c, a, b, off, col, w) {
  const dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1;
  const nx = (-dy / d) * off, ny = (dx / d) * off;
  c.strokeStyle = col; c.lineWidth = w; c.lineCap = 'round';
  line(c, a[0] + nx + dx * 0.15, a[1] + ny + dy * 0.15, b[0] + nx - dx * 0.15, b[1] + ny - dy * 0.15);
}
function shoe(c, f, th) {
  c.save(); c.translate(f[0], f[1]); c.rotate(-th);
  c.fillStyle = OUT; rr(c, -8.5, -8.5, 23, 11, 5); c.fill();
  c.fillStyle = RIDER.shoe; rr(c, -7, -7, 20, 8, 4); c.fill();
  c.fillStyle = RIDER.shoeSole; rr(c, -7, -1.5, 20, 3, 1.5); c.fill();
  c.strokeStyle = RIDER.shoeAcc; c.lineWidth = 1.8; c.lineCap = 'round';
  c.beginPath(); c.moveTo(-3, -3); c.quadraticCurveTo(4, -2, 9, -6); c.stroke();
  c.restore();
}
function glove(c, h) {
  c.fillStyle = OUT; circle(c, h[0], h[1], 6.5);
  c.fillStyle = RIDER.glove; circle(c, h[0], h[1], 5);
  c.fillStyle = 'rgba(255,255,255,0.18)'; circle(c, h[0] - 1.5, h[1] - 1.5, 1.8);
}
function cuff(c, e, h) {
  const t = 0.78, x = lerp(e[0], h[0], t), y = lerp(e[1], h[1], t);
  c.fillStyle = RIDER.gloveAcc; circle(c, x, y, 4.2);
}
function drawRiderBack(c, J) {
  limb(c, J.hip, J.kneeR, J.fR, 13, 11, RIDER.pantsFar);
  shoe(c, J.fR, J.th);
  limb(c, J.sh, J.elbF, J.Hf, 9, 8, RIDER.hoodDeep);
  cuff(c, J.elbF, J.Hf);
  glove(c, J.Hf);
}
function drawRiderMid(c, J) {
  const mx = (J.hip[0] + J.sh[0]) / 2, my = (J.hip[1] + J.sh[1]) / 2;
  // plecak KuKirin
  c.save(); c.translate(mx, my); c.rotate(-J.psi);
  c.fillStyle = OUT; rr(c, -29.5, -23.5, 21, 40, 7); c.fill();
  const bg = c.createLinearGradient(-28, 0, -10, 0); bg.addColorStop(0, RIDER.bag); bg.addColorStop(1, RIDER.bagHi);
  c.fillStyle = bg; rr(c, -28, -22, 18, 37, 6); c.fill();
  c.fillStyle = RIDER.bagAcc; c.fillRect(-28, -6, 18, 3.5);
  c.fillStyle = '#d8dde8'; c.fillRect(-28, 8, 18, 1.5); // odblask
  c.fillStyle = RIDER.bagAcc; c.font = fontO(8); c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('K', -19, 2);
  c.restore();
  // tułów: bluza z kapturem (kontur + cieniowanie)
  const tx = J.sh[0] - J.dx * 2, ty = J.sh[1] - J.dy * 2;
  c.lineCap = 'round';
  c.strokeStyle = OUT; c.lineWidth = 28; line(c, J.hip[0], J.hip[1], tx, ty);
  c.strokeStyle = RIDER.hood; c.lineWidth = 24.5; line(c, J.hip[0], J.hip[1], tx, ty);
  c.save(); c.translate(mx, my); c.rotate(-J.psi);
  const half = Math.hypot(J.sh[0] - J.hip[0], J.sh[1] - J.hip[1]) / 2;
  c.fillStyle = RIDER.hoodShade; rr(c, -12, -half + 2, 7, half * 2 - 2, 3.5); c.fill();
  c.fillStyle = 'rgba(255,255,255,0.9)'; rr(c, 5, -half + 6, 3, half * 1.4, 1.5); c.fill();
  // kieszeń kangurka + sznurki + ściągacz
  c.strokeStyle = RIDER.hoodDeep; c.lineWidth = 1.4;
  c.beginPath(); c.moveTo(-1, half - 16); c.lineTo(9, half - 18); c.lineTo(10, half - 6); c.stroke();
  c.fillStyle = RIDER.hoodShade; rr(c, -12, half - 4, 24, 5, 2.5); c.fill();
  c.strokeStyle = '#8e97ae'; c.lineWidth = 1.3; line(c, 6, -half + 4, 7, -half + 15); line(c, 9, -half + 4, 10, -half + 13);
  // pasek plecaka przez ramię
  c.strokeStyle = RIDER.bag; c.lineWidth = 3.5; c.beginPath(); c.moveTo(-11, -half + 4); c.quadraticCurveTo(0, -half - 1, 8, -half + 10); c.stroke();
  c.restore();
  // kaptur zebrany na karku
  const hdx = J.sh[0] - Math.cos(J.psi) * 7, hdy = J.sh[1] + Math.sin(J.psi) * 7 - 2;
  c.fillStyle = OUT; circle(c, hdx, hdy, 11.5);
  c.fillStyle = RIDER.hood; circle(c, hdx, hdy, 9.8);
  c.fillStyle = RIDER.hoodShade; circle(c, hdx - 2, hdy + 1, 5.5);
  // szyja
  c.fillStyle = RIDER.skin; c.fillRect(J.sh[0] - 4, J.sh[1] - 9, 8, 9);
  // głowa w kasku
  c.save(); c.translate(J.head[0], J.head[1]); c.rotate(-J.psi * 0.5);
  c.fillStyle = OUT; circle(c, 1, 2, 12.5);
  c.fillStyle = RIDER.skin; circle(c, 1, 2, 11);
  c.beginPath(); c.moveTo(10, 1); c.lineTo(14.5, 4); c.lineTo(10, 6); c.fill(); // nos
  c.strokeStyle = '#8b4a35'; c.lineWidth = 1.4; line(c, 6, 8.5, 10, 8);
  // skorupa kasku
  c.beginPath(); c.arc(-1, -1, 14.5, Math.PI * 0.74, Math.PI * 2.04); c.lineTo(9, 2); c.lineTo(-6, 4); c.lineTo(-11, 9); c.closePath();
  c.fillStyle = OUT; c.lineWidth = 4; c.strokeStyle = OUT; c.stroke();
  const hg = c.createLinearGradient(0, -16, 0, 8); hg.addColorStop(0, RIDER.helmetHi); hg.addColorStop(1, RIDER.helmet);
  c.fillStyle = hg; c.fill();
  c.strokeStyle = RIDER.helmetAcc; c.lineWidth = 3; c.beginPath(); c.arc(-1, -1, 10.5, Math.PI * 1.15, Math.PI * 1.75); c.stroke();
  c.fillStyle = 'rgba(255,255,255,0.35)'; c.beginPath(); c.ellipse(-3, -10, 6, 2.2, -0.3, 0, TAU); c.fill();
  // wizjer
  c.beginPath(); c.moveTo(3, -7); c.lineTo(14.5, -5); c.lineTo(13.5, 2.5); c.lineTo(4, 1.5); c.closePath();
  const vg = c.createLinearGradient(4, -7, 13, 2); vg.addColorStop(0, '#9ff0ff'); vg.addColorStop(0.5, '#29d4ff'); vg.addColorStop(1, '#5b2a9a');
  c.fillStyle = vg; c.fill(); c.strokeStyle = OUT; c.lineWidth = 1.5; c.stroke();
  c.strokeStyle = 'rgba(255,255,255,0.8)'; c.lineWidth = 1.2; line(c, 5.5, -5, 12, -3.8);
  c.restore();
  // bliższa noga + połysk dżinsu
  limb(c, J.hip, J.kneeF, J.fF, 14, 12, RIDER.pants);
  sheen(c, J.hip, J.kneeF, -3.5, RIDER.pantsHi, 2.5);
  sheen(c, J.kneeF, J.fF, -3, RIDER.pantsHi, 2);
  shoe(c, J.fF, J.th);
}
function drawRiderFront(c, J) {
  limb(c, J.sh, J.elbN, J.H, 10, 9, RIDER.hood);
  sheen(c, J.sh, J.elbN, 2.5, RIDER.hoodShade, 2.5);
  cuff(c, J.elbN, J.H);
  glove(c, J.H);
}
function drawScooterBody(c, led) {
  c.lineCap = 'round'; c.lineJoin = 'round';
  // wahacz tylny
  c.strokeStyle = OUT; c.lineWidth = 12; line(c, 0, 0, 26, -17);
  c.strokeStyle = '#2b2f3c'; c.lineWidth = 8.5; line(c, 0, 0, 26, -17);
  c.strokeStyle = '#4a5166'; c.lineWidth = 2; line(c, 2, -3, 24, -17);
  // amortyzator ze sprężyną
  c.strokeStyle = OUT; c.lineWidth = 7; line(c, 6, -4, 22, -31);
  c.strokeStyle = '#c9d0de'; c.lineWidth = 3.5; line(c, 6, -4, 22, -31);
  c.strokeStyle = '#ffd400'; c.lineWidth = 2.2;
  c.beginPath();
  for (let k = 0; k <= 8; k++) { const t = k / 8, px = lerp(8, 20, t), py = lerp(-8, -27, t), o = k % 2 ? 3.6 : -3.6; c.lineTo(px + 0.85 * o, py + 0.52 * o); }
  c.stroke();
  // zacisk hamulca tylnego
  c.fillStyle = OUT; rr(c, -14.5, -10.5, 11, 9, 3); c.fill();
  c.fillStyle = '#e8193f'; rr(c, -13, -9, 8, 6, 2); c.fill();
  // błotnik tylny
  c.strokeStyle = OUT; c.lineWidth = 9; c.beginPath(); c.arc(0, 0, 31, Math.PI * 1.0, Math.PI * 1.68); c.stroke();
  c.strokeStyle = '#1f2330'; c.lineWidth = 5.5; c.beginPath(); c.arc(0, 0, 31, Math.PI * 1.0, Math.PI * 1.68); c.stroke();
  c.strokeStyle = '#ff7a1a'; c.lineWidth = 1.8; c.beginPath(); c.arc(0, 0, 33.5, Math.PI * 1.06, Math.PI * 1.6); c.stroke();
  // tylne światło
  c.fillStyle = OUT; rr(c, -16, -28, 10, 10, 3); c.fill();
  c.fillStyle = '#ff2d55'; rr(c, -14.5, -26.5, 7, 7, 2); c.fill();
  drawGlow(c, '#ff2d55', -11, -23, 16, 0.7);
  // rama / podest
  c.beginPath();
  c.moveTo(-6, -24); c.lineTo(14, -32); c.lineTo(100, -32); c.lineTo(112, -45); c.lineTo(122, -41); c.lineTo(108, -12); c.lineTo(10, -10); c.closePath();
  const dg = c.createLinearGradient(0, -32, 0, -10); dg.addColorStop(0, '#454b5f'); dg.addColorStop(0.35, '#262a36'); dg.addColorStop(1, '#101219');
  c.fillStyle = dg; c.fill(); c.strokeStyle = OUT; c.lineWidth = 2.4; c.stroke();
  // gumowa nakładka z fakturą
  c.fillStyle = '#0b0c10'; rr(c, 16, -35, 84, 4.5, 2); c.fill();
  c.fillStyle = '#25272f'; for (let x = 20; x < 97; x += 6) c.fillRect(x, -34.5, 3, 2);
  // panel boczny
  c.beginPath(); c.moveTo(24, -22); c.lineTo(99, -22); c.lineTo(95, -16); c.lineTo(28, -16); c.closePath();
  const og = c.createLinearGradient(0, -22, 0, -16); og.addColorStop(0, '#ffa04d'); og.addColorStop(1, '#e05a00');
  c.fillStyle = og; c.fill();
  c.fillStyle = '#eef1f8'; c.font = fontO(6.5, 900); c.textAlign = 'left'; c.textBaseline = 'middle'; c.fillText('KUKIRIN', 34, -26.5);
  c.fillStyle = '#ffd400'; c.font = fontO(5, 700); c.fillText('G2 PRO', 76, -26.5);
  c.fillStyle = '#9aa3b8'; circle(c, 20, -19, 1.4); circle(c, 102, -19, 1.4);
  // neonowy LED pod podestem
  c.strokeStyle = '#29d4ff'; c.lineWidth = 2.2; line(c, 18, -9.5, 104, -11);
  if (led > 0.02) { drawGlow(c, '#29d4ff', 36, -7, 26, led); drawGlow(c, '#29d4ff', 66, -7, 26, led); drawGlow(c, '#29d4ff', 96, -8, 22, led); }
}
function drawFrontAssembly(c, frontRot, blur) {
  c.lineCap = 'round'; c.lineJoin = 'round';
  // widelec z amortyzatorami (srebrne golenie, pomarańczowe lagi)
  c.strokeStyle = OUT; c.lineWidth = 11; line(c, 115, -46, 118, 0);
  c.strokeStyle = '#d6dce8'; c.lineWidth = 5; line(c, 115, -46, 116.6, -24);
  c.strokeStyle = '#ff7a1a'; c.lineWidth = 7.5; line(c, 116.3, -27, 118, -3);
  c.strokeStyle = 'rgba(255,255,255,0.45)'; c.lineWidth = 1.5; line(c, 115.2, -25, 116.4, -6);
  drawWheel(c, 118, 0, WHEEL_R, frontRot, blur);
  // zacisk przedni
  c.fillStyle = OUT; rr(c, 103.5, -12.5, 11, 9, 3); c.fill();
  c.fillStyle = '#e8193f'; rr(c, 105, -11, 8, 6, 2); c.fill();
  // błotnik przedni
  c.strokeStyle = OUT; c.lineWidth = 8.5; c.beginPath(); c.arc(118, 0, 31, Math.PI * 1.18, Math.PI * 1.8); c.stroke();
  c.strokeStyle = '#1f2330'; c.lineWidth = 5; c.beginPath(); c.arc(118, 0, 31, Math.PI * 1.18, Math.PI * 1.8); c.stroke();
  c.strokeStyle = '#ff7a1a'; c.lineWidth = 1.6; c.beginPath(); c.arc(118, 0, 33.3, Math.PI * 1.25, Math.PI * 1.72); c.stroke();
  // kolumna kierownicy
  c.strokeStyle = OUT; c.lineWidth = 11.5; line(c, 114.5, -44, 105, -118);
  c.strokeStyle = '#272b37'; c.lineWidth = 8; line(c, 114.5, -44, 105, -118);
  c.strokeStyle = '#5a6278'; c.lineWidth = 2; line(c, 112.5, -46, 103.6, -114);
  // zatrzask składania
  c.fillStyle = OUT; circle(c, 111.6, -74, 5); c.fillStyle = '#ff7a1a'; circle(c, 111.6, -74, 3.4);
  // reflektor
  c.fillStyle = OUT; circle(c, 121, -58, 7.5);
  c.fillStyle = '#20232d'; circle(c, 121, -58, 6.2);
  c.fillStyle = '#eaffff'; circle(c, 122, -58, 4);
  // wyświetlacz
  c.save(); c.translate(104, -114); c.rotate(-0.12);
  c.fillStyle = OUT; rr(c, -7, -4.5, 14, 9, 2.5); c.fill();
  c.fillStyle = '#0b0c10'; rr(c, -5.5, -3, 11, 6, 1.5); c.fill();
  c.fillStyle = '#29d4ff'; c.fillRect(-4, -1.5, 6, 3);
  c.restore();
  drawGlow(c, '#29d4ff', 104, -114, 9, 0.6);
  // lusterko
  c.strokeStyle = OUT; c.lineWidth = 3.5; line(c, 99, -123, 95, -138);
  c.strokeStyle = '#3a3f50'; c.lineWidth = 1.8; line(c, 99, -123, 95, -138);
  c.fillStyle = OUT; c.beginPath(); c.ellipse(94.5, -141, 6.5, 4.2, -0.2, 0, TAU); c.fill();
  c.fillStyle = '#9ff0ff'; c.beginPath(); c.ellipse(95, -141.3, 4.5, 2.6, -0.2, 0, TAU); c.fill();
  // kierownica + manetki
  c.strokeStyle = OUT; c.lineWidth = 8.5; line(c, 93, -121, 114, -126);
  c.strokeStyle = '#17181f'; c.lineWidth = 5.5; line(c, 93, -121, 114, -126);
  c.strokeStyle = '#3a3f50'; c.lineWidth = 7; line(c, 93, -121, 98.5, -122.3);
  c.strokeStyle = '#9aa3b8'; c.lineWidth = 1.5; line(c, 101, -124, 111, -120.5);
}

/** Rysuje gracza. sx,gy = punkt styku tylnego koła z ziemią. */
function drawPlayer(c, sx, gy, s, theta, J, o) {
  const k = HERO * s, th = theta * DEG;
  const ax = sx, ay = gy - WHEEL_R * k - (o.bounce || 0) * s;
  const blur = o.blur || 0, night = o.night || 0;
  // światło reflektora (noc) — snop w kierunku przodu hulajnogi
  if (night > 0.2) {
    const hx = ax + (121 * Math.cos(th) - 58 * Math.sin(th)) * k, hy = ay + (-121 * Math.sin(th) - 58 * Math.cos(th)) * k;
    const dx = Math.cos(th), dy = -Math.sin(th), L = 230 * s, sp = 0.32;
    c.save(); c.globalCompositeOperation = 'lighter';
    const bg = c.createLinearGradient(hx, hy, hx + dx * L, hy + dy * L);
    bg.addColorStop(0, `rgba(210,245,255,${0.28 * night})`); bg.addColorStop(1, 'rgba(210,245,255,0)');
    c.fillStyle = bg; c.beginPath(); c.moveTo(hx, hy);
    c.lineTo(hx + Math.cos(-th - sp) * L, hy + Math.sin(-th - sp) * L);
    c.lineTo(hx + Math.cos(-th + sp) * L, hy + Math.sin(-th + sp) * L);
    c.closePath(); c.fill(); c.restore();
    drawGlow(c, '#dff8ff', hx, hy, 26 * s, night);
  }
  // poświata boosta pod kołem
  if (o.boost > 0.02) {
    drawGlow(c, '#29d4ff', sx, gy - 4 * s, 80 * s, o.boost * 0.95);
    drawGlow(c, '#ffffff', sx, gy - 6 * s, 28 * s, o.boost * 0.75);
  }
  c.save();
  c.translate(ax, ay); c.scale(k, k);
  const baseA = o.alpha === undefined ? 1 : o.alpha;
  c.globalAlpha = baseA;
  // łuk strefy wokół tylnego koła
  if (o.zoneCol) {
    const zf = o.zoneFlash || 0;
    drawGlow(c, o.zoneCol, 0, 0, 50 + zf * 26, 0.35 + zf * 0.5);
    c.strokeStyle = o.zoneCol; c.lineWidth = 4; c.globalAlpha = baseA * 0.9;
    c.beginPath(); c.arc(0, 0, 36, Math.PI * 0.9, Math.PI * 2.1); c.stroke();
    c.globalAlpha = baseA;
  }
  drawWheel(c, 0, 0, WHEEL_R, o.wheelRot, blur);
  if (J) drawRiderBack(c, J);
  c.save(); c.rotate(-th); drawScooterBody(c, 0.35 + night * 0.55 + (o.boost || 0) * 0.4); c.restore();
  if (J) drawRiderMid(c, J);
  c.save(); c.rotate(-th); drawFrontAssembly(c, o.wheelRot * 1.0 + 0.7, blur); c.restore();
  if (J) drawRiderFront(c, J);
  c.restore();
}

/** Łuk-protraktor wokół tylnej osi: strefy balansu widoczne wprost w świecie. */
function drawBalanceArc(c, ax, ay, s, theta, zone, alpha) {
  const D = diffDef(), m = CONFIG.yellowMargin, R = 150 * HERO * s;
  const seg = (lo, hi, col, w, a) => {
    if (hi <= lo) return;
    c.strokeStyle = col; c.globalAlpha = a; c.lineWidth = w;
    c.beginPath(); c.arc(ax, ay, R, -lo * DEG, -hi * DEG, true); c.stroke();
  };
  c.save(); c.lineCap = 'butt';
  const base = 0.28 * alpha;
  seg(0, D.sweetMin - m, '#ff3d5a', 5 * s, base);
  seg(D.sweetMin - m, D.sweetMin, '#ffd400', 5 * s, base);
  seg(D.sweetMin, D.sweetMax, '#3dff6b', 7 * s, base + (zone === 'green' ? 0.45 * alpha : 0.15 * alpha));
  seg(D.sweetMax, D.sweetMax + m, '#ffd400', 5 * s, base);
  seg(D.sweetMax + m, D.crashAngle, '#ff3d5a', 5 * s, base + (zone === 'redHigh' ? 0.4 * alpha : 0));
  const center = sweetCenter(D);
  seg(center - CONFIG.perfectBand, center + CONFIG.perfectBand, '#ffffff', 2 * s, 0.45 * alpha);
  // znacznik kąta
  const a = -theta * DEG, col = ZONE_COL[zone] || '#fff';
  c.globalAlpha = 0.95 * alpha;
  const tx = ax + Math.cos(a) * R, ty = ay + Math.sin(a) * R;
  drawGlow(c, col, tx, ty, 18 * s, 0.8 * alpha);
  c.strokeStyle = col; c.lineWidth = 3.5 * s; c.lineCap = 'round';
  line(c, tx - Math.cos(a) * 12 * s, ty - Math.sin(a) * 12 * s, tx + Math.cos(a) * 10 * s, ty + Math.sin(a) * 10 * s);
  c.restore();
}

function drawRagdoll(c, r, alpha, camX, laneF) {
  const s = laneS(laneF), gy = laneY(laneF);
  const x = lerp(r.px, r.x, alpha), y = lerp(r.py, r.y, alpha), rot = lerp(r.prot, r.rot, alpha);
  const sx = PSX + (x - camX) * PX * s;
  c.fillStyle = 'rgba(0,0,0,0.3)'; c.beginPath(); c.ellipse(sx, gy, 30 * s, 6 * s, 0, 0, TAU); c.fill();
  c.save(); c.translate(sx, gy + y * s); c.rotate(rot); c.scale(HERO * s, HERO * s);
  drawRiderBack(c, r.pose); drawRiderMid(c, r.pose); drawRiderFront(c, r.pose);
  c.restore();
  if (player.crashT > 0.25 && r.vy === 0) {
    const t = G.menuT * 5;
    for (let i = 0; i < 3; i++) {
      const a = t + (i * TAU) / 3;
      c.fillStyle = '#ffd400';
      c.font = fontR(16 * s); c.textAlign = 'center';
      c.fillText('★', sx + Math.cos(a) * 26 * s, gy + y * s - 46 * s + Math.sin(a) * 8 * s);
    }
  }
}

// ---------- cząsteczki ----------
function updateParticles(dt) {
  for (const p of particles.items) {
    if (!p.active) continue;
    p.life -= dt;
    if (p.life <= 0) { p.active = false; continue; }
    if (p.drag) { const k = Math.exp(-p.drag * dt); p.vx *= k; p.vy *= k; }
    p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt;
  }
  for (const f of floaters.items) {
    if (!f.active) continue;
    f.life -= dt; f.y += f.vy * dt; f.vy *= Math.exp(-2.5 * dt);
    if (f.life <= 0) f.active = false;
  }
}
function drawParticles(c, camX, screen) {
  const offX = PSX - camX * PX;
  for (const p of particles.items) {
    if (!p.active || p.screen !== screen) continue;
    const a = p.life / p.max, x = screen ? p.x : p.x + offX, y = p.y;
    switch (p.kind) {
      case 'spark':
        c.strokeStyle = p.color; c.globalAlpha = a; c.lineWidth = p.size;
        line(c, x, y, x - p.vx * 0.03, y - p.vy * 0.03); break;
      case 'dust':
        c.fillStyle = p.color; c.globalAlpha = a * 0.35; circle(c, x, y, p.size * (1.6 - a * 0.6)); break;
      case 'boost':
        drawGlow(c, p.color, x, y, p.size * (0.5 + a), a * 0.8); break;
      case 'star':
        c.fillStyle = p.color; c.globalAlpha = a; c.fillRect(x - p.size / 2, y - p.size / 2, p.size, p.size); break;
      case 'speed': case 'wind':
        c.strokeStyle = p.color; c.globalAlpha = a * (p.kind === 'wind' ? 0.35 : 0.5); c.lineWidth = p.size;
        line(c, x, y, x + p.len, y); break;
    }
  }
  c.globalAlpha = 1;
}

// =====================================================================
// SCENA
// =====================================================================
const drawList = [];
function renderScene(alpha, rdt) {
  const p = player, c = ctx;
  const playing = G.state === S.PLAYING || G.state === S.PAUSED || G.state === S.GAMEOVER;
  const camX = playing ? lerp(p.prevX, p.x, alpha) : p.x;
  const theta = playing ? lerp(p.prevTheta, p.theta, alpha) : p.theta;
  const laneF = playing ? lerp(p.prevLaneF, p.laneF, alpha) : p.laneF;
  const lean = playing ? lerp(p.prevLean, p.lean, alpha) : p.lean;
  const psi = playing ? lerp(p.prevPsi, p.psi, alpha) : p.psi;
  const pal = paletteAt(camX);
  const t = G.menuT;

  c.setTransform(1, 0, 0, 1, 0, 0);
  c.fillStyle = '#000'; c.fillRect(0, 0, canvas.width, canvas.height);
  c.setTransform(SCALE, 0, 0, SCALE, OX, OY);
  c.save(); c.beginPath(); c.rect(0, 0, W, H); c.clip();

  drawSky(c, pal, t);

  // kamera: lekki zoom przy wysokim kącie, odjazd FOV przy boostcie
  const thN = clamp(theta / 60, 0, 1.3);
  const tz = 1 + 0.045 * thN - 0.085 * p.boostLevel;
  cam.zoom += (tz - cam.zoom) * expK(4, rdt);
  cam.offY += (thN * 22 - cam.offY) * expK(4, rdt);
  const tr = G.trauma * G.trauma;
  const shX = tr * 16 * (Math.sin(t * 47.3) * 0.6 + Math.sin(t * 91.7) * 0.4);
  const shY = tr * 12 * (Math.sin(t * 53.1 + 1) * 0.6 + Math.sin(t * 77.9) * 0.4);
  const fx = PSX + 40, fy = laneY(laneF) - 70;
  c.save();
  c.translate(fx + shX, fy + shY + cam.offY); c.scale(cam.zoom, cam.zoom); c.translate(-fx, -fy);

  drawCity(c, pal, camX);
  drawStreet(c, pal, camX, t);

  // płaskie przeszkody (studzienki, nierówności)
  for (const o of objects.items) {
    if (!o.active || (o.kind !== 'manhole' && o.kind !== 'bump')) continue;
    const lf = o.laneF, s = laneS(lf), x = sxAt(o.x, lf, camX);
    if (x < -100 || x > W + 100) continue;
    drawFlatHazard(c, o, x, laneY(lf) + 4 * s, s);
  }

  // sprite'y sortowane wg głębokości
  drawList.length = 0;
  for (const o of objects.items) {
    if (!o.active) continue;
    if (o.kind === 'manhole' || o.kind === 'bump' || o.kind === 'crosswalk' || o.kind === 'sidestreet') continue;
    const lfDraw = o.kind === 'bus' ? o.laneF + 0.35 : lerp(o.plf, o.laneF, alpha);
    drawList.push({ o, z: lfDraw });
  }
  drawList.push({ o: null, z: laneF + 0.001 });
  drawList.sort((a, b) => a.z - b.z);

  const zone = playing ? p.zone : 'green';
  for (const it of drawList) {
    const o = it.o;
    if (!o) { drawPlayerAt(c, camX, theta, laneF, lean, psi, zone, pal, alpha); continue; }
    const lf = it.z, s = laneS(o.kind === 'bus' ? lf : lf), x = sxAt(lerp(o.px, o.x, alpha), lf, camX), y = laneY(lf);
    if (x < -700 || x > W + 300) continue;
    switch (o.kind) {
      case 'car': drawCar(c, x, y, s, o, pal); break;
      case 'bus': drawBus(c, x, y, s, o, pal); break;
      case 'xcar': drawCrossCar(c, x, y, s, o, pal); break;
      case 'ped': drawPed(c, x, y, s, o); break;
      case 'cone': drawCone(c, x, y, s, o); break;
      case 'battery': drawBattery(c, x, y, s, o, t); break;
    }
  }
  if (p.rag) drawRagdoll(c, p.rag, alpha, camX, laneF);
  drawParticles(c, camX, false);
  drawForeground(c, pal, camX);
  c.restore(); // kamera

  // światło / poświata nocy
  drawParticles(c, camX, true);
  drawScreenFx(c, rdt, theta);
  c.restore(); // clip
}

function drawPlayerAt(c, camX, theta, laneF, lean, psi, zone, pal, alpha) {
  const p = player, s = laneS(laneF), gy = laneY(laneF), sx = PSX;
  const k = HERO * s, th = theta * DEG;
  // cień na aktualnym pasie
  const fxw = Math.cos(th) * WHEELBASE * k;
  c.fillStyle = 'rgba(0,0,0,0.4)';
  c.beginPath(); c.ellipse(sx + fxw * 0.5, gy + 1, Math.max(6, fxw * 0.5 + 34 * s), 8 * s, 0, 0, TAU); c.fill();
  c.fillStyle = 'rgba(0,0,0,0.35)'; c.beginPath(); c.ellipse(sx, gy + 1, 22 * s, 6 * s, 0, 0, TAU); c.fill();
  const showUI = G.state !== S.MENU && !p.crashed;
  const ay = gy - WHEEL_R * k - p.bounce * s;
  if (showUI) drawBalanceArc(c, sx, ay, s, theta, zone, 1);
  const J = p.rag ? null : riderJoints(theta, lean, psi);
  const blink = p.invuln > 0 && !p.crashed ? (Math.sin(G.menuT * 30) > 0 ? 0.35 : 1) : 1;
  drawPlayer(c, sx, gy, s, theta, J, {
    wheelRot: p.wheelRot, bounce: p.bounce, boost: p.boostLevel, night: pal.lamp, blur: G.state === S.MENU ? 0.2 : clamp((p.v - 7) / 10, 0, 1),
    zoneCol: showUI ? ZONE_COL[zone] : (G.state === S.MENU ? '#3dff6b' : null), zoneFlash: p.zoneFlash, alpha: blink,
  });
  // efekty boosta: płomień pod kołem
  if (p.boostLevel > 0.05 && G.state === S.PLAYING) {
    if (Math.random() < 0.9) {
      const rw = rearWheelWorld();
      emit('boost', rw[0] - 10 * s, rw[1] - 6 * s, -(200 + Math.random() * 200) * s, -(Math.random() * 40) * s, 0.25, 22 * s, '#29d4ff');
    }
  }
  // iskry z koła przy wysokim kącie (szuranie błotnikiem)
  if (G.state === S.PLAYING && !p.crashed && theta > diffDef().sweetMax + CONFIG.yellowMargin && Math.random() < 0.6) {
    const rw = rearWheelWorld();
    sparks(rw[0] - 18 * s, rw[1] - 2, 1, s, -1);
  }
}

let postCanvas = null, postW = 0;
function postFx() {
  if (postCanvas && postW === W) return postCanvas;
  postW = W;
  postCanvas = document.createElement('canvas');
  postCanvas.width = Math.ceil(W); postCanvas.height = H;
  const g = postCanvas.getContext('2d');
  const vg = g.createRadialGradient(W / 2, H * 0.48, H * 0.45, W / 2, H * 0.48, H * 1.05);
  vg.addColorStop(0, 'rgba(8,0,24,0)'); vg.addColorStop(1, 'rgba(8,0,24,0.55)');
  g.fillStyle = vg; g.fillRect(0, 0, W, H);
  g.fillStyle = 'rgba(0,0,0,0.05)';
  for (let y = 0; y < H; y += 3) g.fillRect(0, y, W, 1);
  return postCanvas;
}
function drawScreenFx(c, rdt, theta) {
  const p = player;
  // smugi prędkości
  if (G.state === S.PLAYING) {
    const rate = p.boostLevel * 70 + Math.max(0, p.v - 11) * 3;
    let n = rate * rdt;
    while (n > 0) {
      if (Math.random() < n) {
        emit('speed', W + 10, 40 + Math.random() * (H - 80), -(2200 + Math.random() * 1400), 0, 0.5, 1 + Math.random() * 2, p.boostLevel > 0.3 ? '#9ff0ff' : '#ffffff', { screen: true, len: 90 + Math.random() * 220 });
      }
      n -= 1;
    }
  }
  // winieta strefy czerwonej
  if (G.state === S.PLAYING && isRed(p.zone) && !p.crashed) {
    const a = 0.25 + 0.2 * Math.sin(G.menuT * 14);
    const g = c.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 0.95);
    g.addColorStop(0, 'rgba(255,61,90,0)'); g.addColorStop(1, `rgba(255,61,90,${a})`);
    c.fillStyle = g; c.fillRect(0, 0, W, H);
  }
  // boost: niebieskie krawędzie
  if (p.boostLevel > 0.02) {
    const g = c.createRadialGradient(W / 2, H / 2, H * 0.4, W / 2, H / 2, H);
    g.addColorStop(0, 'rgba(41,212,255,0)'); g.addColorStop(1, `rgba(41,212,255,${0.3 * p.boostLevel})`);
    c.fillStyle = g; c.fillRect(0, 0, W, H);
  }
  // perfect: złoty pierścień
  if (G.perfectFx > 0) {
    const s = laneS(p.laneF), cx = PSX + 30 * s, cy = laneY(p.laneF) - 80 * s, r = (1 - G.perfectFx) * 260 + 40;
    c.strokeStyle = `rgba(255,212,0,${G.perfectFx})`; c.lineWidth = 6 * G.perfectFx + 1;
    c.beginPath(); c.arc(cx, cy, r, 0, TAU); c.stroke();
    G.perfectFx = Math.max(0, G.perfectFx - rdt * 1.6);
  }
  // stała winieta + delikatne scanlines (klimat retro)
  c.drawImage(postFx(), 0, 0, W, H);
  // błysk ekranu
  if (G.flash.a > 0) {
    c.fillStyle = G.flash.color; c.globalAlpha = G.flash.a; c.fillRect(0, 0, W, H); c.globalAlpha = 1;
    G.flash.a = Math.max(0, G.flash.a - rdt * 1.8);
  }
}

// =====================================================================
// HUD
// =====================================================================
function hudPanel(c, x, y, w, h) {
  c.fillStyle = 'rgba(10,26,58,0.62)'; rr(c, x, y, w, h, 12); c.fill();
  c.strokeStyle = 'rgba(41,212,255,0.35)'; c.lineWidth = 1.5; c.stroke();
}
function heart(c, x, y, r, col) {
  c.fillStyle = col;
  c.beginPath(); c.moveTo(x, y + r * 0.9);
  c.bezierCurveTo(x - r * 1.4, y - r * 0.2, x - r * 0.7, y - r * 1.3, x, y - r * 0.45);
  c.bezierCurveTo(x + r * 0.7, y - r * 1.3, x + r * 1.4, y - r * 0.2, x, y + r * 0.9);
  c.fill();
}
function drawHUD(rdt) {
  const c = ctx, p = player, D = diffDef();
  c.save();
  c.setTransform(SCALE, 0, 0, SCALE, OX, OY);
  c.textBaseline = 'alphabetic';

  // --- lewy górny: wynik ---
  hudPanel(c, 16, 14, 270, 98);
  c.textAlign = 'left';
  c.fillStyle = '#29d4ff'; c.font = fontO(12, 700); c.fillText('SCORE', 32, 38);
  c.fillStyle = '#ffd400'; c.font = fontO(32); c.fillText(fmt(G.score), 32, 74);
  c.fillStyle = '#fff'; c.font = fontO(15, 700); c.fillText(`${fmt(p.x)} m`, 32, 100);
  c.textAlign = 'right'; c.fillStyle = '#ff3d8b'; c.font = fontO(12, 700); c.fillText(`STAGE ${G.stage + 1}`, 272, 100);
  c.fillStyle = 'rgba(255,255,255,0.5)'; c.font = fontO(10, 500); c.fillText(D.label, 272, 38);
  // misja
  if (G.mission) {
    const v = Math.min(G.mission.goal, G.mission.get());
    const txt = G.missionDone ? `MISJA ✓ ${G.mission.text}` : `MISJA: ${G.mission.text}  ${G.mission.unit === 's' ? v.toFixed(1) : Math.floor(v)}/${G.mission.goal}`;
    c.textAlign = 'left'; c.font = '600 12px system-ui, sans-serif';
    c.fillStyle = G.missionDone ? '#3dff6b' : 'rgba(220,232,255,0.85)';
    c.fillText(txt, 20, 132);
  }

  // --- środek: wskaźnik balansu (łuk 0–90°, kąt widoczny wprost) ---
  const gx = W / 2 - 80, gy = 150, R = 96;
  const m = CONFIG.yellowMargin;
  c.fillStyle = 'rgba(10,26,58,0.62)';
  c.beginPath(); c.moveTo(gx, gy); c.arc(gx, gy, R + 22, 0, -Math.PI / 2, true); c.closePath(); c.fill();
  const arcSeg = (lo, hi, col, w, a) => { c.strokeStyle = col; c.globalAlpha = a; c.lineWidth = w; c.beginPath(); c.arc(gx, gy, R, -lo * DEG, -hi * DEG, true); c.stroke(); };
  c.lineCap = 'butt';
  arcSeg(0, 90, '#000', 18, 0.35);
  arcSeg(0, D.sweetMin - m, '#ff3d5a', 12, 0.85);
  arcSeg(D.sweetMin - m, D.sweetMin, '#ffd400', 12, 0.9);
  arcSeg(D.sweetMin, D.sweetMax, '#3dff6b', 14, 1);
  arcSeg(D.sweetMax, D.sweetMax + m, '#ffd400', 12, 0.9);
  arcSeg(D.sweetMax + m, D.crashAngle, '#ff3d5a', 12, 0.85);
  arcSeg(D.crashAngle, 90, '#5a0d1a', 12, 0.9);
  const cen = sweetCenter(D);
  c.strokeStyle = '#fff'; c.globalAlpha = 0.85; c.lineWidth = 3;
  c.beginPath(); c.arc(gx, gy, R - 14, -(cen - CONFIG.perfectBand) * DEG, -(cen + CONFIG.perfectBand) * DEG, true); c.stroke();
  c.globalAlpha = 1;
  const zc = ZONE_COL[p.zone] || '#fff';
  const na = -clamp(p.theta, 0, 95) * DEG;
  drawGlow(c, zc, gx + Math.cos(na) * R, gy + Math.sin(na) * R, 26 + p.zoneFlash * 20, 0.6 + p.zoneFlash * 0.4);
  c.strokeStyle = '#fff'; c.lineWidth = 4; c.lineCap = 'round';
  line(c, gx, gy, gx + Math.cos(na) * (R + 14), gy + Math.sin(na) * (R + 14));
  c.strokeStyle = zc; c.lineWidth = 2; line(c, gx, gy, gx + Math.cos(na) * (R + 14), gy + Math.sin(na) * (R + 14));
  c.fillStyle = '#fff'; circle(c, gx, gy, 6);
  c.textAlign = 'right'; c.fillStyle = zc; c.font = fontO(24); c.fillText(`${Math.round(p.theta)}°`, gx - 10, gy + 2);
  const zl = { green: 'SWEET SPOT', yellow: 'UWAGA', redHigh: 'ZA WYSOKO!', redLow: 'ZA NISKO!', ground: 'NA KOŁACH' }[p.zone] || '';
  c.font = fontO(11, 700); c.fillText(zl, gx - 10, gy + 20);
  // perfect: pasek
  if (p.perfectT > 0.15) {
    const pw = 120, px0 = gx - 10 - pw;
    c.fillStyle = 'rgba(0,0,0,0.4)'; c.fillRect(px0, gy + 28, pw, 5);
    c.fillStyle = '#ffd400'; c.fillRect(px0, gy + 28, pw * clamp(p.perfectT / CONFIG.perfectTime, 0, 1), 5);
    c.font = fontO(9, 700); c.fillText('PERFECT', gx - 10, gy + 46);
  }

  // combo
  const cx0 = gx + R + 44;
  const comboCols = ['#ffffff', '#ffffff', '#29d4ff', '#3dff6b', '#ffd400', '#ff3d8b'];
  c.textAlign = 'left';
  c.fillStyle = 'rgba(255,255,255,0.6)'; c.font = fontO(11, 700); c.fillText('COMBO', cx0, gy - 74);
  c.fillStyle = comboCols[p.combo] || '#fff'; c.font = fontO(46); c.fillText(`x${p.combo}`, cx0, gy - 28);
  if (p.combo > 1) drawGlow(c, comboCols[p.combo], cx0 + 40, gy - 44, 50, 0.25);
  c.fillStyle = 'rgba(0,0,0,0.4)'; c.fillRect(cx0, gy - 18, 100, 6);
  c.fillStyle = p.combo >= CONFIG.maxCombo ? '#ff3d8b' : '#3dff6b';
  c.fillRect(cx0, gy - 18, 100 * (p.combo >= CONFIG.maxCombo ? 1 : clamp(p.comboT / CONFIG.comboStepTime, 0, 1)), 6);

  // wiatr
  const w = G.wind;
  if (w && (w.state === 'warn' || w.state === 'gust')) {
    const blink = w.state === 'warn' ? (Math.sin(G.menuT * 18) > 0 ? 1 : 0.35) : 1;
    c.globalAlpha = blink; c.textAlign = 'left';
    c.fillStyle = '#9ff0ff'; c.font = fontO(16);
    c.fillText(w.dir > 0 ? 'WIATR ▲ unosi przód' : 'WIATR ▼ dociska przód', cx0, gy + 14);
    c.globalAlpha = 1;
  }

  // --- prawy górny: prędkość, życia, boost ---
  const rx = W - 16;
  hudPanel(c, W - 286, 14, 270, 116);
  c.textAlign = 'right';
  c.fillStyle = '#fff'; c.font = fontO(34); c.fillText(`${Math.round(p.v * 3.6)}`, rx - 58, 54);
  c.fillStyle = '#29d4ff'; c.font = fontO(12, 700); c.fillText('km/h', rx - 16, 54);
  for (let i = 0; i < D.lives; i++) heart(c, W - 270 + i * 26, 38, 9, i < p.lives ? '#ff3d8b' : 'rgba(255,255,255,0.18)');
  // pasek boosta
  const bx = W - 270, by = 78, bw = 238, bh = 20;
  c.fillStyle = 'rgba(0,0,0,0.45)'; rr(c, bx, by, bw, bh, 5); c.fill();
  const lvl = clamp(p.battery / 100, 0, 1);
  const bcol = p.boosting ? (Math.sin(G.menuT * 30) > 0 ? '#29d4ff' : '#9ff0ff') : p.battery >= CONFIG.boostCost ? '#3dff6b' : '#ff7a1a';
  c.fillStyle = bcol; rr(c, bx + 2, by + 2, Math.max(0, (bw - 4) * lvl), bh - 4, 4); c.fill();
  if (p.battery >= CONFIG.boostCost && !p.boosting && p.boostCD <= 0) drawGlow(c, '#3dff6b', bx + bw * lvl, by + bh / 2, 22, 0.5);
  c.fillStyle = 'rgba(255,255,255,0.8)'; c.fillRect(bx + bw * (CONFIG.boostCost / 100), by - 2, 2, bh + 4);
  if (p.boostCD > 0) { c.fillStyle = 'rgba(10,26,58,0.6)'; c.fillRect(bx, by, bw * clamp(p.boostCD / CONFIG.boostCooldown, 0, 1), bh); }
  c.fillStyle = '#0a1a3a'; c.font = fontO(12); c.textAlign = 'left'; c.fillText(`BOOST ${Math.round(p.battery)}%`, bx + 8, by + 15);
  c.textAlign = 'right'; c.fillStyle = 'rgba(255,255,255,0.65)'; c.font = fontO(10, 700); c.fillText(UI.isTouch ? 'BOOST' : 'SHIFT', rx - 16, by + 36);

  // podpowiedź: na ziemi
  if (p.onGround && !p.crashed && G.state === S.PLAYING) {
    c.globalAlpha = 0.6 + 0.4 * Math.sin(G.menuT * 8);
    c.textAlign = 'center'; c.fillStyle = '#ffd400'; c.font = fontR(26);
    c.fillText(UI.isTouch ? 'PRZYTRZYMAJ ◀ — PODNIEŚ PRZÓD' : 'PRZYTRZYMAJ A — PODNIEŚ PRZÓD', W / 2, H * 0.34);
    c.globalAlpha = 1;
  }

  drawWarnings(c);
  drawFloaters(c);
  drawBanner(c, rdt);
  if (G.debug) drawDebug(c);
  c.restore();
}

/** Czerwone "!" — piesi i auta z przecznic, z wyprzedzeniem. */
function drawWarnings(c) {
  const p = player;
  if (p.crashed) return;
  const front = p.x + 2.4;
  for (const o of objects.items) {
    if (!o.active || (o.kind !== 'ped' && o.kind !== 'xcar') || o.passed || o.state === 'gone' || o.state === 'end') continue;
    const tta = (o.x - front) / Math.max(2, p.v);
    if (tta < 0 || tta > 3.2) continue;
    const lf = clamp(o.laneF, -0.6, 2.6), s = laneS(lf);
    let x = sxAt(o.x, lf, p.x), y = laneY(lf) - (o.kind === 'ped' ? 140 : 120) * s;
    const off = x > W - 50;
    if (off) { x = W - 46; y = laneY(clamp(o.laneF, -0.4, 2.4)) - 40; }
    const pulse = 1 + 0.15 * Math.sin(G.menuT * 16);
    const r = 17 * pulse;
    drawGlow(c, '#ff3d5a', x, y, 44, 0.6);
    c.fillStyle = '#e8193f'; circle(c, x, y, r);
    c.strokeStyle = '#fff'; c.lineWidth = 2.5; c.beginPath(); c.arc(x, y, r, 0, TAU); c.stroke();
    c.fillStyle = '#fff'; c.font = fontR(24); c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('!', x, y + 1);
    if (o.state === 'walk' || o.state === 'wait') {
      c.fillStyle = '#fff'; c.font = fontO(14);
      c.fillText(o.laneV > 0 ? '▼' : '▲', x, y + (o.laneV > 0 ? 30 : -30));
    }
    c.textBaseline = 'alphabetic';
  }
}
function drawFloaters(c) {
  c.textAlign = 'center';
  for (const f of floaters.items) {
    if (!f.active) continue;
    const a = clamp(f.life / f.max * 1.6, 0, 1);
    const sc = 1 + Math.max(0, (f.life - f.max + 0.15) / 0.15) * 0.4;
    c.globalAlpha = a;
    c.font = fontR(Math.round(f.size * sc));
    c.lineWidth = 5; c.strokeStyle = 'rgba(10,10,30,0.75)'; c.lineJoin = 'round';
    c.strokeText(f.text, f.x, f.y);
    c.fillStyle = f.color; c.fillText(f.text, f.x, f.y);
  }
  c.globalAlpha = 1;
}
function drawBanner(c, rdt) {
  const b = G.banner;
  if (!b) return;
  b.t += rdt;
  if (b.t > b.dur) { G.banner = null; return; }
  const inT = clamp(b.t / 0.25, 0, 1), outT = clamp((b.dur - b.t) / 0.35, 0, 1);
  const a = Math.min(inT, outT), sc = 0.6 + 0.4 * smoothstep(inT);
  c.save(); c.translate(W / 2, H * 0.3); c.scale(sc, sc); c.globalAlpha = a;
  c.textAlign = 'center'; c.font = fontR(64);
  c.lineWidth = 10; c.strokeStyle = 'rgba(10,10,30,0.8)'; c.lineJoin = 'round'; c.strokeText(b.text, 0, 0);
  c.fillStyle = b.color; c.fillText(b.text, 0, 0);
  if (b.sub) { c.font = fontO(20, 700); c.lineWidth = 6; c.strokeText(b.sub, 0, 38); c.fillStyle = '#fff'; c.fillText(b.sub, 0, 38); }
  c.restore();
}

function drawDebug(c) {
  const x = 16, y = H - 268, w = 470, h = 200, p = player, D = diffDef();
  c.fillStyle = 'rgba(5,8,22,0.85)'; rr(c, x, y, w, h + 60, 8); c.fill();
  c.strokeStyle = 'rgba(41,212,255,0.4)'; c.lineWidth = 1; c.stroke();
  // pasma stref
  const ty = v => y + h - (v / 90) * h;
  c.fillStyle = 'rgba(61,255,107,0.12)'; c.fillRect(x, ty(D.sweetMax), w, ty(D.sweetMin) - ty(D.sweetMax));
  c.fillStyle = 'rgba(255,61,90,0.12)'; c.fillRect(x, ty(90), w, ty(D.sweetMax + CONFIG.yellowMargin) - ty(90));
  c.strokeStyle = 'rgba(255,255,255,0.15)'; line(c, x, y + h / 2, x + w, y + h / 2);
  const series = [
    [dbg.theta, '#ffffff', v => ty(v)],
    [dbg.omega, '#29d4ff', v => y + h / 2 - v * 0.3],
    [dbg.ctrl, '#ffd400', v => y + h / 2 - v * 0.2],
    [dbg.grav, '#ff3d8b', v => y + h / 2 - v * 0.2],
    [dbg.dist, '#ff7a1a', v => y + h / 2 - v * 0.2],
  ];
  for (const [arr, col, fy] of series) {
    c.strokeStyle = col; c.lineWidth = 1.5; c.beginPath();
    for (let i = 0; i < DBG_N; i++) {
      const v = arr[(dbg.idx + i) % DBG_N], px = x + (i / (DBG_N - 1)) * w, py = clamp(fy(v), y, y + h);
      if (i === 0) c.moveTo(px, py); else c.lineTo(px, py);
    }
    c.stroke();
  }
  c.font = '12px monospace'; c.textAlign = 'left';
  const lines = [
    [`θ ${p.theta.toFixed(1)}°  ω ${p.omega.toFixed(0)}°/s  ctrl ${p.ctrl.toFixed(2)}  v ${p.v.toFixed(1)} m/s  fps ${G.fps.toFixed(0)}`, '#fff'],
    [`τ ctrl ${p.dbgCtrl.toFixed(0)}  τ grav ${p.dbgGrav.toFixed(0)}  τ dist ${p.dbgDist.toFixed(0)}  diff ${G.diff.toFixed(2)}  obj ${objects.count()} prt ${particles.count()}`, '#ccc'],
    [`[1/2] gravity ${CONFIG.gravity}  [3/4] force ${CONFIG.correctionForce}  [5/6] damping ${CONFIG.damping.toFixed(1)}  [7/8] ramp ${CONFIG.correctionRampUp.toFixed(2)}`, '#ffd400'],
  ];
  lines.forEach((l, i) => { c.fillStyle = l[1]; c.fillText(l[0], x + 8, y + h + 18 + i * 16); });
  c.fillStyle = '#fff'; c.fillText('θ', x + w - 90, y + 14); c.fillStyle = '#29d4ff'; c.fillText('ω', x + w - 76, y + 14);
  c.fillStyle = '#ffd400'; c.fillText('ctrl', x + w - 62, y + 14); c.fillStyle = '#ff3d8b'; c.fillText('g', x + w - 30, y + 14); c.fillStyle = '#ff7a1a'; c.fillText('d', x + w - 18, y + 14);
}

// =====================================================================
// UI — ekrany DOM, dotyk, kafelki menu
// =====================================================================
const $ = id => document.getElementById(id);
const UI = {
  isTouch: false, tiles: [],
  init() {
    this.isTouch = (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) || 'ontouchstart' in window;
    if (this.isTouch) document.body.classList.add('is-touch');
    const st = Store.data.settings;
    Sound.muted = st.muted; Sound.musicVolume = st.music;
    CONFIG.invertBalance = !!st.invert;
    G.difficulty = st.difficulty;

    $('btn-start').addEventListener('click', () => startRun());
    $('btn-again').addEventListener('click', () => startRun());
    $('btn-resume').addEventListener('click', () => togglePause());
    $('btn-restart').addEventListener('click', () => startRun());
    $('btn-menu').addEventListener('click', () => this.toMenu());
    $('btn-over-menu').addEventListener('click', () => this.toMenu());
    $('btn-mute').addEventListener('click', () => this.toggleMute());
    $('btn-mute-menu').addEventListener('click', () => this.toggleMute());
    $('btn-invert').addEventListener('click', () => { CONFIG.invertBalance = !CONFIG.invertBalance; st.invert = CONFIG.invertBalance; Store.save(); this.sync(); });
    $('btn-debug').addEventListener('click', () => { G.debug = !G.debug; this.sync(); });
    $('btn-tilt').addEventListener('click', () => this.toggleTilt());
    $('rng-music').addEventListener('input', e => { st.music = e.target.value / 100; Sound.setMusicVolume(st.music); Store.save(); });
    document.querySelectorAll('.chip[data-diff]').forEach(b => b.addEventListener('click', () => {
      st.difficulty = b.dataset.diff; Store.save(); this.sync(); Sound.init(); Sound.click();
      if (G.state === S.MENU) G.difficulty = st.difficulty;
    }));
    this.tiles = Array.from(document.querySelectorAll('.tile-cv')).map(cv => ({ cv, ctx: cv.getContext('2d'), id: +cv.dataset.tile }));
    this.initTouch();
    this.sync();
  },
  sync() {
    const st = Store.data.settings;
    document.querySelectorAll('.chip[data-diff]').forEach(b => b.classList.toggle('active', b.dataset.diff === st.difficulty));
    const setT = (id, on, txt) => { const b = $(id); b.textContent = txt || (on ? 'ON' : 'OFF'); b.classList.toggle('on', on); };
    setT('btn-mute', !Sound.muted);
    $('btn-mute-menu').textContent = `DŹWIĘK: ${Sound.muted ? 'OFF' : 'ON'}`;
    setT('btn-invert', CONFIG.invertBalance);
    setT('btn-debug', G.debug);
    setT('btn-tilt', Input.tiltEnabled);
    $('rng-music').value = Math.round(st.music * 100);
    $('menu-best').textContent = `REKORD: ${fmt(Store.data.best)}`;
  },
  toggleMute() {
    Sound.init();
    Sound.setMuted(!Sound.muted);
    Store.data.settings.muted = Sound.muted; Store.save();
    this.sync();
  },
  toggleTilt() {
    const enable = () => {
      Input.tiltEnabled = true; Input.tiltZero = null;
      Store.data.settings.tilt = true; Store.save(); this.sync();
    };
    if (Input.tiltEnabled) { Input.tiltEnabled = false; Store.data.settings.tilt = false; Store.save(); this.sync(); return; }
    if (window.DeviceOrientationEvent && typeof DeviceOrientationEvent.requestPermission === 'function') {
      DeviceOrientationEvent.requestPermission().then(r => { if (r === 'granted') enable(); }).catch(() => {});
    } else enable();
  },
  toMenu() {
    objects.clear(); particles.clear(); floaters.clear();
    G.difficulty = Store.data.settings.difficulty;
    resetPlayer();
    player.rag = null;
    G.banner = null;
    this.sync();
    setState(S.MENU);
  },
  onState(s) {
    $('screen-menu').classList.toggle('hidden', s !== S.MENU);
    $('screen-pause').classList.toggle('hidden', s !== S.PAUSED);
    $('screen-over').classList.toggle('hidden', s !== S.GAMEOVER);
    $('touch').classList.toggle('hidden', !(this.isTouch && s === S.PLAYING));
    document.querySelector('.tbtn.pause').style.display = this.isTouch && s === S.PLAYING ? 'block' : 'none';
    if (s === S.PAUSED) this.sync();
    if (s === S.MENU) this.sizeTiles();
  },
  showGameOver(d) {
    $('over-title').textContent = d.reason || 'GAME OVER';
    $('over-record').classList.toggle('hidden', !d.record);
    $('over-score').textContent = fmt(d.score);
    $('over-best').textContent = fmt(d.best);
    $('st-dist').textContent = `${fmt(d.dist)} m`;
    $('st-wheelie').textContent = `${d.st.longestWheelie.toFixed(1)} s`;
    $('st-combo').textContent = `x${d.st.maxCombo}`;
    $('st-bat').textContent = `${d.st.batteries}`;
    $('st-close').textContent = `${d.st.closeCalls}`;
    $('st-perfect').textContent = `${d.st.perfects}`;
    const mEl = $('over-mission');
    mEl.textContent = d.mission ? `Misja: ${d.mission.text} — ${d.done ? 'UKOŃCZONA ✓' : 'nieukończona'}` : '';
    mEl.classList.toggle('done', !!d.done);
  },
  sizeTiles() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    for (const t of this.tiles) {
      const r = t.cv.getBoundingClientRect();
      const w = Math.max(10, Math.round(r.width * dpr)), h = Math.max(10, Math.round(r.height * dpr));
      if (t.cv.width !== w || t.cv.height !== h) { t.cv.width = w; t.cv.height = h; }
    }
  },
  drawTiles(time) {
    for (const t of this.tiles) {
      const c = t.ctx, cw = t.cv.width, ch = t.cv.height;
      if (cw < 20) continue;
      c.setTransform(1, 0, 0, 1, 0, 0);
      c.clearRect(0, 0, cw, ch);
      const sc = Math.min(cw / 200, ch / 120);
      c.setTransform(sc, 0, 0, sc, (cw - 200 * sc) / 2, (ch - 120 * sc) / 2);
      drawTile(c, t.id, time);
    }
  },
  initTouch() {
    const set = (act, on) => {
      if (act === 'back') Input.touchBack = on;
      else if (act === 'fwd') Input.touchFwd = on;
    };
    document.querySelectorAll('.tbtn').forEach(b => {
      const act = b.dataset.act;
      b.addEventListener('pointerdown', e => {
        e.preventDefault(); Sound.init();
        try { b.setPointerCapture(e.pointerId); } catch (err) { /* ignoruj */ }
        b.classList.add('pressed');
        if (act === 'up') requestLane(-1);
        else if (act === 'down') requestLane(1);
        else if (act === 'boost') tryBoost();
        else if (act === 'pause') togglePause();
        else set(act, true);
      });
      const up = () => { b.classList.remove('pressed'); set(act, false); };
      b.addEventListener('pointerup', up); b.addEventListener('pointercancel', up); b.addEventListener('lostpointercapture', up);
    });
    // swipe góra/dół na prawej połowie ekranu
    let sw = null;
    canvas.addEventListener('pointerdown', e => {
      Sound.init();
      if (G.state !== S.PLAYING || e.pointerType === 'mouse') return;
      if (e.clientX > window.innerWidth * 0.45) sw = { id: e.pointerId, y: e.clientY };
    });
    canvas.addEventListener('pointermove', e => {
      if (!sw || e.pointerId !== sw.id) return;
      const dy = e.clientY - sw.y;
      if (Math.abs(dy) > 34) { requestLane(dy < 0 ? -1 : 1); sw.y = e.clientY; }
    });
    const end = e => { if (sw && e.pointerId === sw.id) sw = null; };
    canvas.addEventListener('pointerup', end); canvas.addEventListener('pointercancel', end);
    // przechył
    window.addEventListener('deviceorientation', e => {
      if (!Input.tiltEnabled || e.beta === null) return;
      const ang = (screen.orientation && screen.orientation.angle) || window.orientation || 0;
      let v = ang === 90 ? e.beta : ang === -90 || ang === 270 ? -e.beta : e.gamma;
      if (Input.tiltZero === null) Input.tiltZero = v;
      v -= Input.tiltZero;
      const dz = 3;
      Input.tilt = Math.abs(v) < dz ? 0 : clamp((v - Math.sign(v) * dz) / 16, -1, 1);
    });
  },
};

// mini-sceny w kafelkach "How to Play"
function drawTile(c, id, t) {
  const g = c.createLinearGradient(0, 0, 0, 120);
  g.addColorStop(0, '#2a1458'); g.addColorStop(0.7, '#5b2384'); g.addColorStop(1, '#ff3d8b');
  c.fillStyle = g; c.fillRect(0, 0, 200, 120);
  c.fillStyle = '#241e3a'; c.fillRect(0, 92, 200, 28);
  c.fillStyle = '#ffd400'; c.globalAlpha = 0.6;
  for (let i = 0; i < 6; i++) c.fillRect(((i * 40 - t * 90) % 240 + 240) % 240 - 20, 104, 18, 2);
  c.globalAlpha = 1;
  if (id === 1) {
    const th = 45 + Math.sin(t * 1.6) * 16;
    const J = riderJoints(th, Math.sin(t * 1.6 + 1.5) * 0.6, psiTargetFor(th, Math.sin(t * 1.6 + 1.5) * 0.6));
    const z = th > 55 ? 'yellow' : th < 35 ? 'yellow' : 'green';
    const s = 0.62, ay = 98 - WHEEL_R * HERO * s;
    // mini łuk
    const D = CONFIG.difficulties.normal;
    c.lineWidth = 4; c.globalAlpha = 0.6;
    const arc = (lo, hi, col) => { c.strokeStyle = col; c.beginPath(); c.arc(62, ay, 82, -lo * DEG, -hi * DEG, true); c.stroke(); };
    arc(0, D.sweetMin - 12, '#ff3d5a'); arc(D.sweetMin - 12, D.sweetMin, '#ffd400'); arc(D.sweetMin, D.sweetMax, '#3dff6b'); arc(D.sweetMax, D.sweetMax + 12, '#ffd400'); arc(D.sweetMax + 12, 80, '#ff3d5a');
    c.globalAlpha = 1;
    drawPlayer(c, 62, 98, s, th, J, { wheelRot: t * 8, zoneCol: ZONE_COL[z], zoneFlash: 0, boost: 0, night: 0 });
    c.fillStyle = '#fff'; c.font = fontO(13); c.textAlign = 'right';
    c.fillText(`${Math.round(th)}°`, 192, 22);
  } else if (id === 2) {
    c.fillStyle = '#241e3a'; c.fillRect(0, 50, 200, 70);
    c.fillStyle = '#ffd400'; c.globalAlpha = 0.6;
    for (let i = 0; i < 6; i++) { const x = ((i * 40 - t * 90) % 240 + 240) % 240 - 20; c.fillRect(x, 72, 18, 2); c.fillRect(x, 94, 18, 2); }
    c.globalAlpha = 1;
    const ph = (Math.sin(t * 1.8) + 1) / 2, lf = smoothstep(ph);
    const gy = 64 + lf * 44, s = 0.38 + lf * 0.08;
    const th = 42 + Math.sin(t * 3) * 6;
    drawPlayer(c, 70, gy, s, th, riderJoints(th, 0, psiTargetFor(th, 0)), { wheelRot: t * 8, boost: 0, night: 0 });
    c.fillStyle = '#fff'; c.font = fontO(16); c.textAlign = 'center';
    c.fillText('▲', 160, 40); c.fillText('▼', 160, 116);
  } else if (id === 3) {
    const cx = 200 - ((t * 60) % 300);
    drawCar(c, cx, 100, 0.38, { len: 4.4, color: '#29d4ff', x: t * 5, variant: 0 }, PAL_RGB[0]);
    const pedY = 80 + Math.sin(t * 1.2) * 14;
    drawPed(c, 150, pedY + 20, 0.55, { state: 'walk', phase: t * 9, laneV: 1, color: '#ff3d8b', color2: '#1d2433', skin: '#d9a07a', hair: '#222', hop: 0, variant: 0 });
    const pulse = 1 + 0.15 * Math.sin(t * 14);
    drawGlow(c, '#ff3d5a', 150, 22, 30, 0.6);
    c.fillStyle = '#e8193f'; circle(c, 150, 22, 13 * pulse);
    c.fillStyle = '#fff'; c.font = fontR(18); c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('!', 150, 23); c.textBaseline = 'alphabetic';
  } else if (id === 4) {
    for (let i = 0; i < 3; i++) drawBattery(c, 50 + i * 50, 104, 0.9, { phase: i, hit: false, t2: 0 }, t);
    c.fillStyle = '#3dff6b'; c.font = fontO(14); c.textAlign = 'center';
    c.globalAlpha = 0.6 + 0.4 * Math.sin(t * 5); c.fillText('+12% BOOST', 100, 22); c.globalAlpha = 1;
  } else if (id === 5) {
    for (let i = 0; i < 9; i++) {
      const y = 20 + ((i * 37) % 80), x = 200 - ((t * 500 + i * 70) % 260);
      c.strokeStyle = 'rgba(159,240,255,0.7)'; c.lineWidth = 1.5; line(c, x, y, x + 50, y);
    }
    const th = 50 + Math.sin(t * 5) * 4;
    drawPlayer(c, 70, 98, 0.6, th, riderJoints(th, -0.4, psiTargetFor(th, -0.4)), { wheelRot: t * 14, boost: 0.85 + 0.15 * Math.sin(t * 20), night: 0 });
    c.fillStyle = '#29d4ff'; c.font = fontO(14); c.textAlign = 'right'; c.fillText('BOOST!', 192, 22);
  }
}

// =====================================================================
// WEJŚCIE — klawiatura
// =====================================================================
const PREVENT = new Set(['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'F1', 'ShiftLeft', 'ShiftRight']);
window.addEventListener('keydown', e => {
  const code = e.code;
  if (PREVENT.has(code)) e.preventDefault();
  Sound.init();
  if (e.repeat) { Input.keys.add(code); return; }
  Input.keys.add(code);
  switch (code) {
    case 'Space':
      if (G.state === S.MENU) startRun();
      else if (G.state === S.GAMEOVER && G.overT > 0.35) startRun();
      else if (G.state === S.PAUSED) togglePause();
      break;
    case 'KeyW': case 'ArrowUp': requestLane(-1); break;
    case 'KeyS': case 'ArrowDown': requestLane(1); break;
    case 'ShiftLeft': case 'ShiftRight': tryBoost(); break;
    case 'KeyP': case 'Escape': togglePause(); break;
    case 'KeyM': UI.toggleMute(); break;
    case 'F1': G.debug = !G.debug; UI.sync(); break;
    default:
      if (G.debug) {
        const tune = { Digit1: ['gravity', -10], Digit2: ['gravity', 10], Digit3: ['correctionForce', -20], Digit4: ['correctionForce', 20], Digit5: ['damping', -0.1], Digit6: ['damping', 0.1], Digit7: ['correctionRampUp', -0.02], Digit8: ['correctionRampUp', 0.02] }[code];
        if (tune) { CONFIG[tune[0]] = Math.max(0.01, +(CONFIG[tune[0]] + tune[1]).toFixed(2)); }
      }
  }
});
window.addEventListener('keyup', e => { Input.keys.delete(e.code); });
window.addEventListener('blur', () => { Input.keys.clear(); Input.touchBack = Input.touchFwd = false; if (G.state === S.PLAYING && !player.crashed) setState(S.PAUSED); });
document.addEventListener('visibilitychange', () => { if (document.hidden && G.state === S.PLAYING && !player.crashed) setState(S.PAUSED); });
window.addEventListener('resize', () => { resize(); if (G.state === S.MENU) UI.sizeTiles(); });
window.addEventListener('pointerdown', () => Sound.init(), { passive: true });

// =====================================================================
// MAIN LOOP — fixed timestep + interpolacja renderu
// =====================================================================
let acc = 0, last = performance.now(), fpsAcc = 0, fpsN = 0;
function frame(now) {
  let real = (now - last) / 1000;
  last = now;
  if (!(real > 0)) real = 0;
  if (real > 0.1) real = 0.1;
  fpsAcc += real; fpsN++;
  if (fpsAcc >= 0.5) { G.fps = fpsN / fpsAcc; fpsAcc = 0; fpsN = 0; }
  G.menuT += real;
  const p = player;

  if (G.state === S.PLAYING) {
    // slow motion przy wywrotce
    if (p.crashed) {
      G.crashReal += real;
      G.timeScale = G.crashReal < 1.1 ? 0.28 : Math.min(0.7, G.timeScale + real * 0.6);
      if (G.crashReal > 2.0) gameOver();
    } else G.timeScale = moveToward(G.timeScale, 1, real * 2);
    acc += real * G.timeScale;
    let steps = 0;
    while (acc >= DT && steps < 30) { step(DT); acc -= DT; steps++; }
    if (steps >= 30) acc = 0;
    Sound.setEngine(!p.crashed, p.v, p.boostLevel, p.theta);
  } else if (G.state === S.MENU) {
    // demo w tle: płynny wheelie
    p.prevX = p.x; p.x += 8 * real;
    p.theta = 44 + Math.sin(G.menuT * 1.3) * 7 + Math.sin(G.menuT * 3.1) * 2;
    p.prevTheta = p.theta;
    p.lean = Math.sin(G.menuT * 1.3 + 1.6) * 0.5; p.prevLean = p.lean;
    p.psi = psiTargetFor(p.theta, p.lean); p.prevPsi = p.psi;
    p.wheelRot += (8 * real) / ((WHEEL_R * HERO) / PX);
    acc = 0;
  } else if (G.state === S.GAMEOVER) {
    G.overT += real;
  }
  if (G.state !== S.PAUSED) updateParticles(real * (G.state === S.PLAYING ? G.timeScale : 1));
  G.trauma = Math.max(0, G.trauma - real * 1.6);

  const alpha = G.state === S.PLAYING ? acc / DT : 1;
  renderScene(alpha, real);
  if (G.state !== S.MENU) drawHUD(real);
  if (G.state === S.MENU) UI.drawTiles(G.menuT);
  requestAnimationFrame(frame);
}

// =====================================================================
// START
// =====================================================================
Store.load();
resize();
UI.init();
resetPlayer();
setState(S.MENU);
requestAnimationFrame(t => { last = t; requestAnimationFrame(frame); });

// dostęp do strojenia z konsoli: window.KUKIRIN.CONFIG.gravity = 180
window.KUKIRIN = { CONFIG, G, player, Input, objects, startRun, requestLane, tryBoost, step, DT };
})();
