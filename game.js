// Fold Fit – CIEL Games
// A paper-folding shape puzzle. Every piece is pinned to another piece; fold pieces around
// their pins (pieces attached to them swing along) until the picture fills the dashed outline.
(() => {
'use strict';

const TAU = Math.PI * 2, DEG = Math.PI / 180;
const $ = id => document.getElementById(id);

// ---------------------------------------------------------------------------
// Levels
//  Each row is a list of 2-character cells: '..' empty, or <piece letter><shape>.
//  Shapes: '#' full square, '1'..'4' half-square triangles whose right angle sits in the
//  top-left (1), top-right (2), bottom-right (3) or bottom-left (4) corner.
//  'A' is the pinned base piece. hinges: piece -> [parent, pinX, pinY] (grid corners).
//  scramble: how many fold steps each piece starts rotated by (clockwise).
// ---------------------------------------------------------------------------
// LEVELS-START
const LEVELS = [
  { name: 'Little House', step: 90,
    tip: 'Drag the roof around its pin to fold it back on top.',
    rows: ['..B3B4..',
           'B3B#B#B4',
           'A#A#A#A#',
           'A#A#A#A#'],
    hinges: { B: ['A', 0, 2] },
    scramble: { B: 2 },
    colors: { A: '#f6cf94', B: '#e8574f' } },
  { name: 'Sailboat', step: 90,
    tip: 'Pieces pinned to a moving piece swing along with it.',
    rows: ['..C#C4....',
           '..B4......',
           '..B#B4....',
           '..B#B#B4..',
           'A#A#A#A#A#',
           'A2A#A#A#A1'],
    hinges: { B: ['A', 1, 4], C: ['B', 1, 1] },
    scramble: { B: 1, C: 2 },
    colors: { A: '#b9794a', B: '#fbf8f1', C: '#e8574f' } },
  { name: 'Apple Tree', step: 90,
    tip: 'Tip: tap a piece to fold it a quarter turn.',
    rows: ['....C3C4....',
           '..C3C#C#C4..',
           'B3B#B#B#B#B4',
           'D#B#B#B#B#..',
           '....A#A#....',
           '....A#A#....'],
    hinges: { B: ['A', 2, 4], C: ['B', 1, 2], D: ['B', 1, 4] },
    scramble: { B: 2, C: 1, D: 3 },
    colors: { A: '#8d5b3d', B: '#4fb06a', C: '#78cf86', D: '#e8574f' } },
  { name: 'Heart', step: 90,
    rows: ['A3A4B3B4',
           'A#A#B#B#',
           'C2C#D#D1',
           '..C2D1..'],
    hinges: { B: ['A', 2, 1], C: ['A', 0, 2], D: ['B', 4, 2] },
    scramble: { B: 2, C: 1, D: 3 },
    colors: { A: '#ff6f8e', B: '#ff8fa8', C: '#ea4c72', D: '#ff7b98' } },
  { name: 'Goldfish', step: 90,
    rows: ['....C4....',
           'B4A3A#A#A4',
           'B1A2A#A#A1',
           '......D1..'],
    hinges: { B: ['A', 1, 2], C: ['A', 3, 1], D: ['A', 3, 3] },
    scramble: { B: 2, C: 1, D: 3 },
    colors: { A: '#ff9a3d', B: '#e8742a', C: '#ffd166', D: '#ffc14d' } },
  { name: 'Rocket', step: 90,
    rows: ['..B3B4..',
           '..A#A#..',
           '..A#A#..',
           'C3A#A#D4',
           'C#A#A#D#',
           '..E2E1..'],
    hinges: { B: ['A', 1, 1], C: ['A', 1, 5], D: ['A', 3, 5], E: ['A', 2, 5] },
    scramble: { B: 2, C: 1, D: 3, E: 2 },
    colors: { A: '#e6ebf5', B: '#e8574f', C: '#5b8def', D: '#4a7fd6', E: '#ffb43c' } },
  { name: 'Kitty', step: 90,
    rows: ['B4....C3..',
           'A#A#A#A#..',
           'A#A#A#A#..',
           '..D#D#....',
           'D3D#D#D4E#',
           'D#D#D#D#E#'],
    hinges: { B: ['A', 1, 1], C: ['A', 3, 1], D: ['A', 2, 3], E: ['D', 4, 6] },
    scramble: { B: 1, C: 3, D: 2, E: 1 },
    colors: { A: '#f2a65a', B: '#d9843a', C: '#d9843a', D: '#eb9a4c', E: '#c4713a' } },
  { name: 'Bluebird', step: 90,
    rows: ['..B3B#C#D4',
           'E3A#A#A#..',
           '..A2A#A1..'],
    hinges: { B: ['A', 1, 1], C: ['A', 4, 1], D: ['C', 4, 0], E: ['A', 1, 2] },
    scramble: { B: 1, C: 2, D: 1, E: 3 },
    colors: { A: '#5bb6f2', B: '#3d8fd6', C: '#7fcaf8', D: '#ffb43c', E: '#357fc4' } },
  { name: 'Garden Snake', step: 90,
    tip: 'A long chain! Fix the pieces closest to the base first.',
    rows: ['A#A#B#B#',
           '......C#',
           '..D#D#C#',
           '..E#....',
           '..E#F#F4'],
    hinges: { B: ['A', 2, 1], C: ['B', 4, 1], D: ['C', 3, 3], E: ['D', 1, 3], F: ['E', 2, 5] },
    scramble: { B: 1, C: 2, D: 3, E: 1, F: 2 },
    colors: { A: '#3fa34d', B: '#58ba62', C: '#3fa34d', D: '#58ba62', E: '#3fa34d', F: '#2b8a3b' } },
  { name: 'Windmill', step: 90,
    tip: 'The blades look alike, but each one swings around a different corner.',
    rows: ['....B#....',
           '....B#....',
           'E#E#A#C#C#',
           '....D#....',
           '....D#....'],
    hinges: { B: ['A', 2, 2], C: ['A', 3, 2], D: ['A', 3, 3], E: ['A', 2, 3] },
    scramble: { B: 1, C: 1, D: 1, E: 1 },
    colors: { A: '#5c4a7a', B: '#ff7a6b', C: '#ffc94d', D: '#5bc0a8', E: '#5b8def' } },
  { name: 'Robot Pal', step: 90,
    rows: ['..C#C#..',
           'D#A#A#E#',
           'D#A#A#E#',
           '..F#G#..',
           '..F#G#..'],
    hinges: { C: ['A', 2, 1], D: ['A', 1, 1], E: ['A', 3, 1], F: ['A', 1, 3], G: ['A', 3, 3] },
    scramble: { C: 2, D: 3, E: 1, F: 1, G: 3 },
    colors: { A: '#9aa6c4', C: '#c3cbe2', D: '#7a86a8', E: '#7a86a8', F: '#66729a', G: '#66729a' } },
  { name: 'Umbrella', step: 45,
    tip: 'From here on, pieces fold in 45° steps.',
    rows: ['..A3A#B#B4..',
           'A3A#A#B#B#B4',
           '....C#......',
           '..D#C#......',
           '..D#D#......'],
    hinges: { B: ['A', 3, 0], C: ['A', 2, 2], D: ['C', 2, 4] },
    scramble: { B: 4, C: 3, D: 5 },
    colors: { A: '#8b5cf6', B: '#a98bfa', C: '#6b7280', D: '#4b5563' } },
  { name: 'Racing Car', step: 45,
    rows: ['..B3B#B4....',
           'A#A#A#A#A#E4',
           'A#A#A#A#A#E#',
           '..C#....D#..'],
    hinges: { B: ['A', 1, 1], C: ['A', 2, 3], D: ['A', 4, 3], E: ['A', 5, 3] },
    scramble: { B: 3, C: 2, D: 6, E: 5 },
    colors: { A: '#e8574f', B: '#9ad0f5', C: '#353b52', D: '#353b52', E: '#ffc94d' } },
  { name: 'Butterfly', step: 45,
    rows: ['B#B#A#C#C#',
           'B2B#A#C#C1',
           '..D#A#E#..',
           '..D2A#E1..'],
    hinges: { B: ['A', 2, 0], C: ['A', 3, 0], D: ['A', 2, 4], E: ['A', 3, 4] },
    scramble: { B: 2, C: 6, D: 3, E: 5 },
    colors: { A: '#4a3b2a', B: '#ff8a5c', C: '#ffb36b', D: '#c56cf0', E: '#a855f7' } },
  { name: 'Paper Dragon', step: 45,
    tip: 'The final fold. Work from the tail to the head.',
    rows: ['A#A#B#B#C#C#',
           '..........D#',
           '..F#F#E#E#D#',
           '..G#........',
           '..G#H#H4....'],
    hinges: { B: ['A', 2, 1], C: ['B', 4, 1], D: ['C', 6, 1], E: ['D', 5, 3], F: ['E', 3, 2], G: ['F', 1, 3], H: ['G', 2, 5] },
    scramble: { B: 2, C: 6, D: 4, E: 3, F: 5, G: 2, H: 7 },
    colors: { A: '#2f9e57', B: '#3fb168', C: '#2f9e57', D: '#3fb168', E: '#2f9e57', F: '#3fb168', G: '#2f9e57', H: '#e8574f' } }
];
// LEVELS-END

// ---------------------------------------------------------------------------
// Save data
// ---------------------------------------------------------------------------
const SAVE_KEY = 'foldfit-save-v1';
function loadSave() {
  try {
    const s = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (s && typeof s.unlocked === 'number') {
      return { unlocked: s.unlocked, stars: s.stars || {}, hints: typeof s.hints === 'number' ? s.hints : 3, muted: !!s.muted };
    }
  } catch (e) {}
  return { unlocked: 1, stars: {}, hints: 3, muted: false };
}
const save = loadSave();
function writeSave() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) {} }

// ---------------------------------------------------------------------------
// Sound – small WebAudio synth (no audio files)
// ---------------------------------------------------------------------------
const Sound = {
  ctx: null, muted: save.muted, noiseBuf: null,
  init() {
    if (!this.ctx) {
      try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
      const len = Math.floor(this.ctx.sampleRate * 0.5);
      this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = this.noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  },
  tone(freq, dur, type = 'sine', vol = 0.1, slide = 0, delay = 0) {
    if (this.muted || !this.ctx) return;
    const t = this.ctx.currentTime + delay;
    const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(this.ctx.destination); o.start(t); o.stop(t + dur + 0.02);
  },
  noise(dur, freq, q, vol, delay = 0) {
    if (this.muted || !this.ctx) return;
    const t = this.ctx.currentTime + delay;
    const s = this.ctx.createBufferSource(), f = this.ctx.createBiquadFilter(), g = this.ctx.createGain();
    s.buffer = this.noiseBuf; f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = q;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + dur * 0.25); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(this.ctx.destination); s.start(t); s.stop(t + dur + 0.02);
  },
  rustle() { this.noise(0.14, 2400 + Math.random() * 900, 0.7, 0.07); },
  fold(delay = 0) { this.noise(0.2, 1600, 0.8, 0.16, delay); },
  snap() { this.noise(0.06, 3200, 1.2, 0.18); this.tone(540, 0.07, 'triangle', 0.08); },
  lock() { this.tone(784, 0.14, 'sine', 0.1); this.tone(1175, 0.2, 'sine', 0.07, 0, 0.07); },
  win() { [523, 659, 784, 1047, 1319].forEach((f, i) => this.tone(f, 0.24, 'triangle', 0.1, 0, i * 0.09)); },
  star(i) { this.tone(880 + i * 220, 0.18, 'triangle', 0.1); },
  hint() { [988, 1319, 1568].forEach((f, i) => this.tone(f, 0.16, 'sine', 0.08, 0, i * 0.06)); },
  ui() { this.tone(660, 0.05, 'triangle', 0.07); },
  nope() { this.tone(160, 0.14, 'square', 0.05, -40); }
};

// ---------------------------------------------------------------------------
// Geometry
// ---------------------------------------------------------------------------
const IDENT = [1, 0, 0, 1, 0, 0];
function rotAbout(h, a) {
  const c = Math.cos(a), s = Math.sin(a);
  return [c, s, -s, c, h[0] - c * h[0] + s * h[1], h[1] - s * h[0] - c * h[1]];
}
function mul(m, n) {
  return [m[0] * n[0] + m[2] * n[1], m[1] * n[0] + m[3] * n[1], m[0] * n[2] + m[2] * n[3], m[1] * n[2] + m[3] * n[3],
    m[0] * n[4] + m[2] * n[5] + m[4], m[1] * n[4] + m[3] * n[5] + m[5]];
}
function apply(m, p) { return [m[0] * p[0] + m[2] * p[1] + m[4], m[1] * p[0] + m[3] * p[1] + m[5]]; }
function invert(m) {
  const det = m[0] * m[3] - m[1] * m[2];
  return [m[3] / det, -m[1] / det, -m[2] / det, m[0] / det, (m[2] * m[5] - m[3] * m[4]) / det, (m[1] * m[4] - m[0] * m[5]) / det];
}
const norm = a => a - TAU * Math.round(a / TAU);
const isZero = a => Math.abs(norm(a)) < 1e-3;

function pointInPoly(p, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i], b = poly[j];
    if ((a[1] > p[1]) !== (b[1] > p[1]) && p[0] < (b[0] - a[0]) * (p[1] - a[1]) / (b[1] - a[1]) + a[0]) inside = !inside;
  }
  return inside;
}

function cellPoly(c, r, code) {
  const TL = [c, r], TR = [c + 1, r], BR = [c + 1, r + 1], BL = [c, r + 1];
  switch (code) {
    case '#': return [TL, TR, BR, BL];
    case '1': return [TL, TR, BL];
    case '2': return [TL, TR, BR];
    case '3': return [TR, BR, BL];
    case '4': return [TL, BR, BL];
  }
  throw new Error('Unknown cell shape: ' + code);
}

const pkey = p => p[0] + ',' + p[1];
// Merge cell polygons into outline loops; shared edges become crease lines.
function outline(polys) {
  const edges = new Map(), creases = [];
  for (const poly of polys) for (let i = 0; i < poly.length; i++) {
    const a = poly[i], b = poly[(i + 1) % poly.length];
    const rk = pkey(b) + '|' + pkey(a);
    if (edges.has(rk)) { edges.delete(rk); creases.push([a, b]); }
    else edges.set(pkey(a) + '|' + pkey(b), [a, b]);
  }
  const byStart = new Map();
  for (const e of edges.values()) {
    const k = pkey(e[0]);
    if (!byStart.has(k)) byStart.set(k, []);
    byStart.get(k).push(e);
  }
  const loops = [], used = new Set();
  for (const e of edges.values()) {
    if (used.has(e)) continue;
    const loop = [];
    let cur = e;
    while (cur && !used.has(cur)) {
      used.add(cur); loop.push(cur[0]);
      cur = (byStart.get(pkey(cur[1])) || []).find(n => !used.has(n));
    }
    loops.push(dropCollinear(loop));
  }
  return { loops, creases };
}
function dropCollinear(loop) {
  const n = loop.length, out = [];
  for (let i = 0; i < n; i++) {
    const a = loop[(i - 1 + n) % n], b = loop[i], c = loop[(i + 1) % n];
    if (Math.abs((b[0] - a[0]) * (c[1] - b[1]) - (b[1] - a[1]) * (c[0] - b[0])) > 1e-9) out.push(b);
  }
  return out.length >= 3 ? out : loop;
}

function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  const t = amt > 0 ? 255 : 0, k = Math.abs(amt);
  r = Math.round(r + (t - r) * k); g = Math.round(g + (t - g) * k); b = Math.round(b + (t - b) * k);
  return `rgb(${r},${g},${b})`;
}

const parsedCache = {};
function parseLevel(i) {
  if (parsedCache[i]) return parsedCache[i];
  const def = LEVELS[i];
  const cellsBy = {};
  def.rows.forEach((row, r) => {
    for (let c = 0; c * 2 < row.length; c++) {
      const tok = row.substr(c * 2, 2);
      if (tok === '..') continue;
      (cellsBy[tok[0]] = cellsBy[tok[0]] || []).push(cellPoly(c, r, tok[1]));
    }
  });
  const ids = Object.keys(cellsBy).sort();
  const index = {};
  ids.forEach((id, k) => { index[id] = k; });
  const turns = 360 / def.step;
  const proto = ids.map(id => {
    const h = id === 'A' ? null : def.hinges[id];
    const o = outline(cellsBy[id]);
    const color = def.colors[id] || '#cccccc';
    let cx = 0, cy = 0, n = 0;
    for (const poly of cellsBy[id]) for (const p of poly) { cx += p[0]; cy += p[1]; n++; }
    return { id, loops: o.loops, creases: o.creases, polys: cellsBy[id],
      parent: h ? index[h[0]] : -1, hinge: h ? [h[1], h[2]] : null,
      color, light: shade(color, 0.3), dark: shade(color, -0.42),
      scr: ((def.scramble[id] || 0) % turns + turns) % turns, centroid: [cx / n, cy / n] };
  });
  proto.forEach(p => { let d = 0, q = p; while (q.parent >= 0) { d++; q = proto[q.parent]; } p.depth = d; });
  const topo = proto.map((_, k) => k).sort((a, b) => proto[a].depth - proto[b].depth);
  const all = outline(proto.flatMap(p => p.polys));
  const res = { def, idx: i, proto, topo, step: def.step * DEG, target: all.loops,
    // Par: a piece needs at most 2 moves (one drag, or up to two taps); fewer taps if it is close.
    par: proto.reduce((n, p) => n + (p.parent >= 0 && p.scr ? Math.min((turns - p.scr) % turns, 2) : 0), 0) };
  parsedCache[i] = res;
  return res;
}

// ---------------------------------------------------------------------------
// Game state
// ---------------------------------------------------------------------------
const canvas = $('game'), ctx = canvas.getContext('2d');
let W = 0, H = 0, DPR = 1;
const cam = { s: 40, x: 0, y: 0, ts: 40, tx: 0, ty: 0 };
const state = { mode: 'loading', modal: null, idx: 0, moves: 0, hintsUsed: 0, won: false, intro: 0,
  drag: null, anims: [], undo: [], t: 0, winT: 0, dash: 0 };
let level = null, pieces = [], order = [], particles = [];
const isTouch = (window.matchMedia && matchMedia('(pointer: coarse)').matches) || ('ontouchstart' in window);
const inFrame = (() => { try { return window.self !== window.top; } catch (e) { return true; } })();
document.body.classList.toggle('touch', isTouch);

function loadLevel(i) {
  level = parseLevel(i);
  state.idx = i; state.moves = 0; state.hintsUsed = 0; state.won = false;
  state.drag = null; state.anims = []; state.undo = []; state.winT = 0;
  pieces = level.proto.map(p => Object.assign({}, p, { angle: 0, M: IDENT, correct: true, glow: 0, shake: 0 }));
  order = level.topo.slice();
  particles = [];
  updateTransforms();
  fitCamera(true, true);
  $('hudNum').textContent = i + 1;
  $('hudName').textContent = level.def.name;
  $('hudStep').textContent = level.def.step + '° folds';
  $('par').textContent = level.par;
  updateHud();
  const tip = level.def.tip || '';
  $('tip').textContent = tip;
  $('tip').classList.toggle('show', !!tip);
  // Intro: show the finished picture, then fold it into the puzzle.
  state.intro = 1.1;
  setStatus('Remember the shape…');
}

function scrambleIn() {
  let k = 0;
  for (const i of level.topo) {
    const p = pieces[i];
    if (p.parent < 0 || !p.scr) continue;
    state.anims.push({ i, from: 0, to: p.scr * level.step, t: -k * 0.12, dur: 0.55, ease: 'inout' });
    Sound.fold(k * 0.12);
    k++;
  }
  setStatus('');
}

function updateTransforms() {
  for (const i of level.topo) {
    const p = pieces[i];
    p.M = p.parent < 0 ? IDENT : mul(pieces[p.parent].M, rotAbout(p.hinge, p.angle));
  }
}

function isPieceCorrect(i) {
  let p = pieces[i];
  while (p.parent >= 0) { if (!isZero(p.angle)) return false; p = pieces[p.parent]; }
  return true;
}
function isAncestor(a, i) { // is a an ancestor of (or equal to) i
  for (let p = i; p >= 0; p = pieces[p].parent) if (p === a) return true;
  return false;
}
function pivotOf(i) { const p = pieces[i]; return apply(pieces[p.parent].M, p.hinge); }

// ---------------------------------------------------------------------------
// Camera
// ---------------------------------------------------------------------------
function insets() {
  const hud = $('hud'), bar = $('bottomBar');
  const top = (hud && hud.offsetHeight ? hud.offsetHeight : 64) + 18;
  const bottom = (bar && bar.offsetHeight ? bar.offsetHeight : 60) + ($('tip').classList.contains('show') ? 52 : 0) + 22;
  return { top, bottom };
}
function poseBBox(includeTarget) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  const add = p => { if (p[0] < x0) x0 = p[0]; if (p[0] > x1) x1 = p[0]; if (p[1] < y0) y0 = p[1]; if (p[1] > y1) y1 = p[1]; };
  for (const p of pieces) for (const loop of p.loops) for (const q of loop) add(apply(p.M, q));
  if (includeTarget) for (const loop of level.target) for (const q of loop) add(q);
  return { x0, y0, x1, y1 };
}
// The camera fits the union of the outline and every pose the scramble will reach.
function fitCamera(instant, includeScramble) {
  if (!level) return;
  let bb = poseBBox(true);
  if (includeScramble) {
    const saved = pieces.map(p => p.angle);
    pieces.forEach(p => { p.angle = p.scr * level.step; });
    updateTransforms();
    const b2 = poseBBox(false);
    pieces.forEach((p, k) => { p.angle = saved[k]; });
    updateTransforms();
    bb = { x0: Math.min(bb.x0, b2.x0), y0: Math.min(bb.y0, b2.y0), x1: Math.max(bb.x1, b2.x1), y1: Math.max(bb.y1, b2.y1) };
  }
  const pad = 0.7;
  const bw = bb.x1 - bb.x0 + pad * 2, bh = bb.y1 - bb.y0 + pad * 2;
  const ins = insets();
  const aw = Math.max(120, W - 32), ah = Math.max(120, H - ins.top - ins.bottom);
  cam.ts = Math.min(aw / bw, ah / bh, 96);
  cam.tx = (bb.x0 + bb.x1) / 2; cam.ty = (bb.y0 + bb.y1) / 2;
  if (instant) { cam.s = cam.ts; cam.x = cam.tx; cam.y = cam.ty; }
}
function viewCenterY() { const ins = insets(); return ins.top + (H - ins.top - ins.bottom) / 2; }
function toScreen(p) { return [(p[0] - cam.x) * cam.s + W / 2, (p[1] - cam.y) * cam.s + viewCenterY()]; }
function toWorld(sx, sy) { return [(sx - W / 2) / cam.s + cam.x, (sy - viewCenterY()) / cam.s + cam.y]; }

function resize() {
  DPR = Math.min(window.devicePixelRatio || 1, 2);
  W = window.innerWidth; H = window.innerHeight;
  canvas.width = Math.round(W * DPR); canvas.height = Math.round(H * DPR);
  canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
  if (level) fitCamera(true, state.intro > 0);
}
window.addEventListener('resize', resize);

// ---------------------------------------------------------------------------
// Interaction
// ---------------------------------------------------------------------------
function canInteract() { return state.mode === 'play' && !state.modal && !state.won && state.intro <= 0; }

// Topmost piece under the pointer. A piece that already sits in its final place never needs
// to move again, so an unsolved piece underneath it wins the click – nothing gets buried.
function hitTest(sx, sy) {
  const w = toWorld(sx, sy);
  let fallback = -1;
  for (let k = order.length - 1; k >= 0; k--) {
    const i = order[k], p = pieces[i];
    const local = apply(invert(p.M), w);
    if (!p.polys.some(poly => pointInPoly(local, poly))) continue;
    if (p.parent >= 0 && !isPieceCorrect(i)) return i;
    if (fallback < 0) fallback = i;
  }
  return fallback;
}

function bringToFront(i) {
  const sub = order.filter(k => isAncestor(i, k));
  order = order.filter(k => !isAncestor(i, k)).concat(sub);
}

function snapshot() { return pieces.map(p => p.angle); }
function snapped(a) { return Math.round(a / level.step) * level.step; }

canvas.addEventListener('pointerdown', e => {
  Sound.init();
  if (!canInteract() || state.drag) return;
  const i = hitTest(e.clientX, e.clientY);
  if (i < 0) return;
  const p = pieces[i];
  if (p.parent < 0) { p.shake = 1; Sound.nope(); toast('The base piece is pinned in place'); return; }
  // stop any running animation on this piece and keep its current angle
  state.anims = state.anims.filter(a => a.i !== i);
  const pv = pivotOf(i), w = toWorld(e.clientX, e.clientY);
  state.drag = { i, id: e.pointerId, pivot: pv, last: Math.atan2(w[1] - pv[1], w[0] - pv[0]),
    start: snapped(p.angle), before: snapshot(), sx: e.clientX, sy: e.clientY, moved: false, rustle: 0 };
  bringToFront(i);
  try { canvas.setPointerCapture(e.pointerId); } catch (_) {}
  canvas.classList.add('grabbing');
  Sound.rustle();
});

canvas.addEventListener('pointermove', e => {
  const d = state.drag;
  if (!d) {
    if (!isTouch && canInteract()) {
      const i = hitTest(e.clientX, e.clientY);
      canvas.style.cursor = i < 0 ? 'default' : (pieces[i].parent < 0 ? 'not-allowed' : 'grab');
    }
    return;
  }
  if (e.pointerId !== d.id) return;
  const w = toWorld(e.clientX, e.clientY);
  const dx = w[0] - d.pivot[0], dy = w[1] - d.pivot[1];
  if (Math.hypot(dx, dy) * cam.s < 12) return; // too close to the pin to read an angle
  const a = Math.atan2(dy, dx);
  const delta = norm(a - d.last);
  d.last = a;
  pieces[d.i].angle += delta;
  if (!d.moved && Math.hypot(e.clientX - d.sx, e.clientY - d.sy) > 7) d.moved = true;
  d.rustle += Math.abs(delta);
  if (d.rustle > 0.45) { d.rustle = 0; Sound.rustle(); }
});

function endDrag(e) {
  const d = state.drag;
  if (!d || (e && e.pointerId !== d.id)) return;
  state.drag = null;
  canvas.classList.remove('grabbing');
  const p = pieces[d.i];
  const target = d.moved ? snapped(p.angle) : snapped(p.angle) + level.step;
  state.anims.push({ i: d.i, from: p.angle, to: target, t: 0, dur: d.moved ? 0.26 : 0.32, ease: 'back' });
  if (!isZero(target - d.start)) {
    state.moves++; state.undo.push(d.before);
    if (state.undo.length > 100) state.undo.shift();
    Sound.fold(); setTimeout(() => Sound.snap(), 160);
  } else Sound.snap();
  updateHud();
}
canvas.addEventListener('pointerup', endDrag);
canvas.addEventListener('pointercancel', endDrag);
canvas.addEventListener('lostpointercapture', endDrag);
canvas.addEventListener('contextmenu', e => e.preventDefault());

function animateTo(angles, dur) {
  pieces.forEach((p, i) => {
    if (!isZero(p.angle - angles[i]) || Math.abs(p.angle - angles[i]) > 1e-3) {
      state.anims = state.anims.filter(a => a.i !== i);
      state.anims.push({ i, from: p.angle, to: angles[i], t: 0, dur, ease: 'inout' });
    }
  });
}

function undo() {
  if (!canInteract() || state.drag || !state.undo.length) { Sound.nope(); return; }
  animateTo(state.undo.pop(), 0.3);
  Sound.fold(); updateHud();
}

function useHint() {
  if (!canInteract() || state.drag) return;
  if (save.hints <= 0) { Sound.nope(); toast('No hints left – earn more with 3-star solves'); return; }
  let best = -1;
  for (const i of level.topo) {
    const p = pieces[i];
    if (p.parent >= 0 && !isZero(p.angle) && (best < 0 || p.depth < pieces[best].depth)) best = i;
  }
  if (best < 0) return;
  state.undo.push(snapshot());
  const p = pieces[best];
  state.anims = state.anims.filter(a => a.i !== best);
  state.anims.push({ i: best, from: p.angle, to: snapped(p.angle) - norm(snapped(p.angle)), t: 0, dur: 0.6, ease: 'inout' });
  bringToFront(best);
  save.hints--; state.hintsUsed++; writeSave();
  p.glow = 1;
  Sound.hint(); updateHud();
}

function restart() {
  if (state.mode !== 'play' || state.modal) return;
  if (state.intro > 0) return;
  state.undo = []; state.moves = 0; state.hintsUsed = 0;
  const target = pieces.map(p => p.scr * level.step);
  animateTo(target, 0.45);
  Sound.fold(); updateHud();
}

// ---------------------------------------------------------------------------
// Simulation
// ---------------------------------------------------------------------------
const easeBack = k => { const s = 1.5; k -= 1; return k * k * ((s + 1) * k + s) + 1; };
const easeInOut = k => k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;

function update(dt) {
  state.t += dt;
  state.dash = (state.dash + dt * 14) % 30;
  if (!level) return;

  if (state.mode === 'play' && state.intro > 0 && !state.modal) {
    state.intro -= dt;
    if (state.intro <= 0) scrambleIn();
  }

  for (let k = state.anims.length - 1; k >= 0; k--) {
    const a = state.anims[k];
    a.t += dt / a.dur;
    if (a.t < 0) continue;
    const e = Math.min(1, a.t);
    pieces[a.i].angle = a.from + (a.to - a.from) * (a.ease === 'back' ? easeBack(e) : easeInOut(e));
    if (e >= 1) { pieces[a.i].angle = norm(a.to); state.anims.splice(k, 1); }
  }
  updateTransforms();

  for (const p of pieces) { p.glow = Math.max(0, p.glow - dt * 1.4); p.shake = Math.max(0, p.shake - dt * 3); }

  const settled = !state.drag && state.anims.length === 0 && state.intro <= 0;
  if (state.mode === 'play' && settled && !state.won) {
    let all = true;
    pieces.forEach((p, i) => {
      const ok = isPieceCorrect(i);
      if (ok && !p.correct && p.parent >= 0) {
        p.glow = 1; Sound.lock();
        const c = toScreen(apply(p.M, p.centroid));
        sparkle(c[0], c[1], 10);
      }
      p.correct = ok;
      if (!ok) all = false;
    });
    if (all) win();
  }
  if (!state.drag) {
    fitCamera(false, false);
    const k = Math.min(1, dt * 4);
    cam.s += (cam.ts - cam.s) * k;
    cam.x += (cam.tx - cam.x) * k; cam.y += (cam.ty - cam.y) * k;
  }

  if (state.won && state.mode === 'winning') {
    state.winT -= dt;
    if (state.winT <= 0) setMode('win');
  }

  for (let k = particles.length - 1; k >= 0; k--) {
    const q = particles[k];
    q.vy += q.g * dt; q.vx *= 1 - dt * 0.6;
    q.x += q.vx * dt; q.y += q.vy * dt; q.r += q.vr * dt; q.life -= dt;
    if (q.life <= 0) particles.splice(k, 1);
  }
}

function win() {
  state.won = true;
  const i = state.idx, par = level.par;
  let stars = state.moves <= par ? 3 : state.moves <= par + Math.max(2, Math.ceil(par / 2)) ? 2 : 1;
  if (state.hintsUsed > 0) stars = Math.min(stars, 2);
  const prev = save.stars[i] || 0;
  let bonus = false;
  if (stars === 3 && prev < 3) { save.hints++; bonus = true; }
  save.stars[i] = Math.max(prev, stars);
  save.unlocked = Math.max(save.unlocked, Math.min(LEVELS.length, i + 2));
  writeSave();
  state.lastStars = stars; state.lastBonus = bonus;
  pieces.forEach((p, k) => { p.glow = 1.6 + k * 0.08; });
  Sound.win();
  confetti();
  state.winT = 1.2;
  setMode('winning');
}

// ---------------------------------------------------------------------------
// Particles
// ---------------------------------------------------------------------------
const CONFETTI = ['#6c3fb2', '#8a5cf6', '#4a90e0', '#ff7a6b', '#ffc94d', '#5bc0a8'];
function confetti() {
  for (let k = 0; k < 120; k++) {
    const a = -Math.PI / 2 + (Math.random() - 0.5) * 1.6, sp = 380 + Math.random() * 520;
    particles.push({ x: W / 2 + (Math.random() - 0.5) * 120, y: H * 0.62, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
      g: 760, r: Math.random() * TAU, vr: (Math.random() - 0.5) * 14, w: 7 + Math.random() * 6, h: 4 + Math.random() * 4,
      c: CONFETTI[k % CONFETTI.length], life: 1.6 + Math.random() * 1.2, max: 2.8, kind: 'rect' });
  }
}
function sparkle(x, y, n) {
  for (let k = 0; k < n; k++) {
    const a = Math.random() * TAU, sp = 60 + Math.random() * 140;
    particles.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, g: 0, r: 0, vr: 0, w: 2 + Math.random() * 3, h: 0,
      c: k % 2 ? '#ffffff' : '#ffd977', life: 0.5 + Math.random() * 0.4, max: 0.9, kind: 'dot' });
  }
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------
function piecePath(p) {
  const path = new Path2D();
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const loop of p.loops) {
    loop.forEach((q, k) => {
      const s = toScreen(apply(p.M, q));
      if (k) path.lineTo(s[0], s[1]); else path.moveTo(s[0], s[1]);
      if (s[0] < x0) x0 = s[0]; if (s[0] > x1) x1 = s[0]; if (s[1] < y0) y0 = s[1]; if (s[1] > y1) y1 = s[1];
    });
    path.closePath();
  }
  return { path, x0, y0, x1, y1 };
}

function drawTarget() {
  const path = new Path2D();
  for (const loop of level.target) {
    loop.forEach((q, k) => { const s = toScreen(q); if (k) path.lineTo(s[0], s[1]); else path.moveTo(s[0], s[1]); });
    path.closePath();
  }
  ctx.save();
  ctx.fillStyle = 'rgba(108,63,178,0.08)';
  ctx.fill(path);
  ctx.setLineDash([9, 7]);
  ctx.lineDashOffset = -state.dash;
  ctx.lineWidth = 2.5; ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(108,63,178,0.55)';
  ctx.stroke(path);
  ctx.restore();
}

function drawPiece(i) {
  const p = pieces[i];
  const { path, x0, y0, x1, y1 } = piecePath(p);
  const lifted = state.drag && isAncestor(state.drag.i, i);
  const shake = p.shake ? Math.sin(state.t * 60) * 4 * p.shake : 0;
  ctx.save();
  if (shake) ctx.translate(shake, 0);
  ctx.shadowColor = 'rgba(52,28,96,0.28)';
  ctx.shadowBlur = lifted ? 24 : 8;
  ctx.shadowOffsetY = lifted ? 14 : 4;
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  g.addColorStop(0, p.light); g.addColorStop(0.55, p.color); g.addColorStop(1, p.color);
  ctx.fillStyle = g;
  ctx.fill(path);
  ctx.shadowColor = 'transparent';
  // paper fold creases
  if (p.creases.length) {
    ctx.beginPath();
    for (const [a, b] of p.creases) {
      const sa = toScreen(apply(p.M, a)), sb = toScreen(apply(p.M, b));
      ctx.moveTo(sa[0], sa[1]); ctx.lineTo(sb[0], sb[1]);
    }
    ctx.strokeStyle = 'rgba(40,20,70,0.10)'; ctx.lineWidth = 1; ctx.stroke();
  }
  ctx.lineJoin = 'round';
  ctx.lineWidth = lifted ? 3 : 2;
  ctx.strokeStyle = lifted ? '#6c3fb2' : p.dark;
  ctx.stroke(path);
  if (p.glow > 0) {
    ctx.globalAlpha = Math.min(1, p.glow);
    ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(255,255,255,0.95)';
    ctx.stroke(path);
    ctx.globalAlpha = Math.min(1, p.glow) * 0.35; ctx.fillStyle = '#ffffff'; ctx.fill(path);
  }
  ctx.restore();
}

function drawPins() {
  for (const i of order) {
    const p = pieces[i];
    if (p.parent < 0) continue;
    const s = toScreen(pivotOf(i));
    const active = state.drag && state.drag.i === i;
    const r = Math.max(4.5, Math.min(8, cam.s * 0.11));
    if (active) {
      ctx.save();
      ctx.beginPath(); ctx.arc(s[0], s[1], r * 2.6 + Math.sin(state.t * 8) * 2, 0, TAU);
      ctx.strokeStyle = 'rgba(108,63,178,0.35)'; ctx.lineWidth = 3; ctx.stroke();
      ctx.restore();
    }
    ctx.beginPath(); ctx.arc(s[0], s[1], r, 0, TAU);
    ctx.fillStyle = '#ffffff'; ctx.fill();
    ctx.lineWidth = 2.4; ctx.strokeStyle = active ? '#4c2a86' : '#6c3fb2'; ctx.stroke();
    ctx.beginPath(); ctx.arc(s[0], s[1], r * 0.36, 0, TAU);
    ctx.fillStyle = '#6c3fb2'; ctx.fill();
  }
}

function drawParticles() {
  for (const q of particles) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, q.life / (q.max * 0.5)));
    ctx.fillStyle = q.c;
    if (q.kind === 'rect') { ctx.translate(q.x, q.y); ctx.rotate(q.r); ctx.fillRect(-q.w / 2, -q.h / 2, q.w, q.h); }
    else { ctx.beginPath(); ctx.arc(q.x, q.y, q.w, 0, TAU); ctx.fill(); }
    ctx.restore();
  }
}

function render() {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.clearRect(0, 0, W, H);
  if (level && (state.mode === 'play' || state.mode === 'winning' || state.mode === 'win')) {
    drawTarget();
    for (const i of order) drawPiece(i);
    drawPins();
  }
  drawParticles();
}

// Level-select thumbnail of the finished picture
function drawThumb(cv, i, locked) {
  const L = parseLevel(i), g = cv.getContext('2d');
  const dpr = Math.min(window.devicePixelRatio || 1, 2), size = 76;
  cv.width = size * dpr; cv.height = size * dpr;
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const loop of L.target) for (const q of loop) { x0 = Math.min(x0, q[0]); x1 = Math.max(x1, q[0]); y0 = Math.min(y0, q[1]); y1 = Math.max(y1, q[1]); }
  const s = Math.min((size - 14) / (x1 - x0), (size - 14) / (y1 - y0));
  const ox = (size - (x1 - x0) * s) / 2 - x0 * s, oy = (size - (y1 - y0) * s) / 2 - y0 * s;
  for (const p of L.proto) {
    g.beginPath();
    for (const loop of p.loops) { loop.forEach((q, k) => { const X = q[0] * s + ox, Y = q[1] * s + oy; if (k) g.lineTo(X, Y); else g.moveTo(X, Y); }); g.closePath(); }
    g.fillStyle = locked ? 'rgba(76,52,128,0.18)' : p.color; g.fill();
    g.lineWidth = 1.4; g.lineJoin = 'round'; g.strokeStyle = locked ? 'rgba(76,52,128,0.25)' : p.dark; g.stroke();
  }
}

// ---------------------------------------------------------------------------
// HUD, screens and popups
// ---------------------------------------------------------------------------
function updateHud() {
  $('moves').textContent = state.moves;
  $('hintCount').textContent = save.hints;
  $('btnHint').classList.toggle('empty', save.hints <= 0);
  $('btnUndo').disabled = !state.undo.length;
}
function setStatus(text) { const el = $('status'); el.textContent = text; el.classList.toggle('show', !!text); }
let toastTimer = 0;
function toast(text) {
  const el = $('toast'); el.textContent = text; el.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('show'), 1800);
}

const SCREENS = { title: 'scrTitle', levels: 'scrLevels', win: 'scrWin', end: 'scrEnd', bye: 'scrBye' };
function setMode(m) {
  state.mode = m;
  closeModal(true);
  for (const id of Object.values(SCREENS)) $(id).classList.remove('show');
  if (SCREENS[m]) $(SCREENS[m]).classList.add('show');
  const inGame = m === 'play' || m === 'winning';
  document.body.classList.toggle('in-game', inGame);
  if (m === 'title') updateTitle();
  if (m === 'levels') buildLevelGrid();
  if (m === 'win') showWin();
  if (inGame) requestAnimationFrame(() => fitCamera(true, false));
}

function openModal(id) { closeModal(true); state.modal = id; $(id).classList.add('show'); Sound.ui(); }
function closeModal(silent) {
  if (!state.modal) return;
  $(state.modal).classList.remove('show'); state.modal = null;
  if (!silent) Sound.ui();
}

function totalStars() { let n = 0; for (let i = 0; i < LEVELS.length; i++) n += save.stars[i] || 0; return n; }
function updateTitle() {
  const t = totalStars(), max = LEVELS.length * 3;
  $('titleProgress').textContent = `${t} / ${max}`;
  $('titleTrack').style.width = '0%';
  requestAnimationFrame(() => requestAnimationFrame(() => { $('titleTrack').style.width = (t / max * 100) + '%'; }));
  const next = Math.min(save.unlocked, LEVELS.length);
  $('playSub').textContent = save.unlocked > 1 ? `Level ${next}` : 'Start';
}

const STAR_SVG = '<svg viewBox="0 0 24 24"><path d="M12 2.6l2.85 5.9 6.5.85-4.75 4.5 1.2 6.45L12 17.2l-5.8 3.1 1.2-6.45L2.65 9.35l6.5-.85z"/></svg>';
const LOCK_SVG = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 10V8a5 5 0 0 1 10 0v2h.5A1.5 1.5 0 0 1 19 11.5v8a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 19.5v-8A1.5 1.5 0 0 1 6.5 10zm2.5 0h5V8a2.5 2.5 0 0 0-5 0z"/></svg>';
function buildLevelGrid() {
  const grid = $('levelGrid');
  grid.innerHTML = '';
  LEVELS.forEach((L, i) => {
    const unlocked = i < save.unlocked, stars = save.stars[i] || 0;
    const b = document.createElement('button');
    b.className = 'lvl' + (unlocked ? '' : ' locked') + (unlocked && !stars ? ' next' : '');
    b.style.setProperty('--i', i);
    b.setAttribute('aria-label', unlocked ? `Level ${i + 1}: ${L.name}` : `Level ${i + 1} locked`);
    const cv = document.createElement('canvas');
    cv.className = 'thumb';
    b.innerHTML = `<span class="lvl-n">${i + 1}</span>${L.step === 45 ? '<span class="lvl-tag">45°</span>' : ''}`;
    b.appendChild(cv);
    const foot = document.createElement('span');
    foot.className = 'lvl-stars';
    foot.innerHTML = unlocked ? [0, 1, 2].map(k => `<i class="${k < stars ? 'on' : ''}">${STAR_SVG}</i>`).join('') : LOCK_SVG;
    b.appendChild(foot);
    drawThumb(cv, i, !unlocked);
    b.addEventListener('click', () => {
      if (unlocked) { Sound.ui(); startLevel(i); return; }
      Sound.nope(); b.classList.remove('shake'); void b.offsetWidth; b.classList.add('shake');
    });
    grid.appendChild(b);
  });
  $('lvlProgress').textContent = `★ ${totalStars()} / ${LEVELS.length * 3}`;
}

function showWin() {
  const stars = state.lastStars || 1;
  $('winName').textContent = level.def.name + '!';
  $('winMoves').textContent = state.moves;
  $('winPar').textContent = level.par;
  $('winHints').textContent = state.hintsUsed;
  const box = $('winStars');
  box.innerHTML = [0, 1, 2].map(k => `<i class="${k < stars ? 'on' : ''}" style="--k:${k}">${STAR_SVG}</i>`).join('');
  for (let k = 0; k < stars; k++) setTimeout(() => Sound.star(k), 420 + k * 220);
  $('winBonus').classList.toggle('show', !!state.lastBonus);
  $('btnWinNext').querySelector('span').textContent = state.idx + 1 < LEVELS.length ? 'Next' : 'Finish';
}

function startLevel(i) { loadLevel(i); setMode('play'); }
function nextLevel() {
  if (state.idx + 1 < LEVELS.length) startLevel(state.idx + 1);
  else { $('endStars').textContent = `${totalStars()} / ${LEVELS.length * 3}`; setMode('end'); }
}

const ICON_SOUND_ON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor"/><path d="M15.5 9a4.5 4.5 0 0 1 0 6M18 6.5a8 8 0 0 1 0 11"/></svg>';
const ICON_SOUND_OFF = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor"/><path d="M16 9.5l5 5M21 9.5l-5 5"/></svg>';
function refreshSoundIcons() {
  document.querySelectorAll('.sound-btn').forEach(b => { b.innerHTML = Sound.muted ? ICON_SOUND_OFF : ICON_SOUND_ON; });
}
function toggleSound() {
  Sound.muted = !Sound.muted; save.muted = Sound.muted; writeSave(); refreshSoundIcons();
  Sound.init(); Sound.ui();
}

// Inside the portal iframe we ask the portal to close us; as a standalone tab we try
// window.close() (only allowed for script-opened tabs) and otherwise show a goodbye screen.
function exitGame() {
  closeModal(true);
  if (inFrame) { try { window.parent.postMessage('closeModal', '*'); } catch (e) {} }
  try { window.close(); } catch (e) {}
  setTimeout(() => { if (!window.closed) setMode('bye'); }, 250);
}

const on = (id, fn) => $(id).addEventListener('click', e => { e.stopPropagation(); Sound.init(); fn(); });
on('btnPlay', () => { Sound.ui(); startLevel(Math.min(save.unlocked, LEVELS.length) - 1); });
on('btnLevels', () => { Sound.ui(); setMode('levels'); });
on('btnHow', () => openModal('mdlHow'));
on('btnHowClose', () => closeModal());
on('btnExitTitle', () => openModal('mdlExit'));
on('btnExitYes', exitGame);
on('btnExitNo', () => closeModal());
on('btnLevelsBack', () => { Sound.ui(); setMode('title'); });
on('btnMenu', () => { if (state.mode === 'play') openModal('mdlPause'); });
on('btnResume', () => closeModal());
on('btnPauseRestart', () => { closeModal(true); restart(); });
on('btnPauseLevels', () => { Sound.ui(); setMode('levels'); });
on('btnPauseHome', () => { Sound.ui(); setMode('title'); });
on('btnUndo', undo);
on('btnRestart', restart);
on('btnHint', useHint);
on('btnWinLevels', () => { Sound.ui(); setMode('levels'); });
on('btnWinReplay', () => { Sound.ui(); startLevel(state.idx); });
on('btnWinNext', () => { Sound.ui(); nextLevel(); });
on('btnEndLevels', () => { Sound.ui(); setMode('levels'); });
on('btnEndHome', () => { Sound.ui(); setMode('title'); });
on('btnByeHome', () => { Sound.ui(); setMode('title'); });
document.querySelectorAll('.sound-btn').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); toggleSound(); }));
for (const id of ['mdlExit', 'mdlHow', 'mdlPause']) $(id).addEventListener('click', e => { if (e.target.id === id) closeModal(); });

// Ripple feedback on buttons (coordinates in CSS pixels)
document.addEventListener('pointerdown', e => {
  const el = e.target.closest('.btn, .ibtn, .lvl');
  if (!el || el.disabled) return;
  const r = el.getBoundingClientRect();
  const size = Math.max(r.width, r.height) * 2.2;
  const s = document.createElement('span');
  s.className = 'ripple';
  s.style.width = s.style.height = size + 'px';
  s.style.left = (e.clientX - r.left - size / 2) + 'px';
  s.style.top = (e.clientY - r.top - size / 2) + 'px';
  el.appendChild(s);
  s.addEventListener('animationend', () => s.remove());
});

window.addEventListener('keydown', e => {
  Sound.init();
  if (state.mode === 'loading' || e.repeat) return;
  if (state.modal) {
    if (e.key === 'Escape') closeModal();
    else if (e.key === 'Enter') { const b = $(state.modal).querySelector('[data-primary]'); if (b) b.click(); }
    return;
  }
  if (state.mode === 'play') {
    const k = e.key.toLowerCase();
    if (k === 'z') undo();
    else if (k === 'r') restart();
    else if (k === 'h') useHint();
    else if (e.key === 'Escape') openModal('mdlPause');
    return;
  }
  if (e.key === 'Escape') {
    if (state.mode === 'levels') setMode('title');
    else if (state.mode === 'title') openModal('mdlExit');
  } else if (e.key === 'Enter') {
    const scr = SCREENS[state.mode] && $(SCREENS[state.mode]);
    const b = scr && scr.querySelector('[data-primary]');
    if (b) b.click();
  }
});
document.addEventListener('visibilitychange', () => {
  if (!Sound.ctx) return;
  if (document.hidden) Sound.ctx.suspend(); else if (!Sound.muted) Sound.ctx.resume();
});

// ---------------------------------------------------------------------------
// CIEL Games loading scene
// ---------------------------------------------------------------------------
function runLoader() {
  const fill = $('ldFill'), pct = $('ldPct'), tip = $('ldTip');
  const tips = ['Folding paper…', 'Sharpening creases…', 'Sorting shapes…', 'Pinning pieces…', 'Almost there…'];
  const bub = $('ldBubbles');
  for (let k = 0; k < 16; k++) {
    const b = document.createElement('span'), s = 6 + Math.random() * 22;
    b.className = 'ld-bubble';
    b.style.cssText = `left:${Math.random() * 100}%;width:${s}px;height:${s}px;--dx:${(Math.random() - 0.5) * 120}px;` +
      `animation-duration:${6 + Math.random() * 7}s;animation-delay:${-Math.random() * 10}s;`;
    bub.appendChild(b);
  }
  let ready = false;
  const loaded = new Promise(r => document.readyState === 'complete' ? r() : window.addEventListener('load', r));
  const fonts = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
  Promise.race([Promise.all([loaded, fonts]), new Promise(r => setTimeout(r, 4000))]).then(() => { ready = true; });
  const t0 = performance.now(), MIN = 3600, BAR_DELAY = 2200;
  let p = 0, tipI = 0, lastTip = t0;
  const tick = now => {
    const el = now - t0;
    const target = el < BAR_DELAY ? 0 : Math.min(1, (el - BAR_DELAY) / (MIN - BAR_DELAY)) * (ready ? 100 : 88);
    p += (target - p) * 0.12;
    if (ready && el >= MIN && target - p < 0.6) p = 100;
    fill.style.width = p + '%';
    pct.textContent = Math.round(p) + '%';
    if (now - lastTip > 650 && p < 100) {
      lastTip = now; tipI = (tipI + 1) % tips.length;
      tip.style.opacity = 0;
      setTimeout(() => { tip.textContent = tips[tipI]; tip.style.opacity = 1; }, 200);
    }
    if (p >= 100) {
      tip.textContent = 'Ready!';
      setTimeout(() => {
        $('loader').classList.add('done');
        setMode('title');
        setTimeout(() => $('loader').remove(), 1100);
      }, 280);
      return;
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

// ---------------------------------------------------------------------------
// Main loop
// ---------------------------------------------------------------------------
let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  update(dt);
  render();
  requestAnimationFrame(frame);
}

// Test hook, only with #debug in the URL.
if (location.hash === '#debug') {
  window.__ff = {
    state, LEVELS, startLevel, parseLevel,
    get pieces() { return pieces; }, get level() { return level; },
    toScreen, pivotOf, hitTest, solveAll() { pieces.forEach(p => { p.angle = 0; }); state.anims = []; },
    // screen-space centre of every cell of piece i in its current pose
    cellPoints(i) {
      const p = pieces[i];
      return p.polys.map(poly => {
        const c = poly.reduce((s, q) => [s[0] + q[0] / poly.length, s[1] + q[1] / poly.length], [0, 0]);
        return toScreen(apply(p.M, c));
      });
    },
    skipIntro() { state.intro = 0.0001; }
  };
}

resize();
refreshSoundIcons();
loadLevel(Math.min(save.unlocked, LEVELS.length) - 1);
state.mode = 'loading';
runLoader();
requestAnimationFrame(frame);
})();
