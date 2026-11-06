// Hermit Hop – CIEL Games
// Game code: levels, physics, rendering, menus, input and the CIEL loading scene.

(() => {
'use strict';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const T = 30, COLS = 32, ROWS = 18, W = COLS * T, H = ROWS * T, TAU = Math.PI * 2;
const PHYS = {
  g: 2000, jumpShell: 550, jumpBare: 660, shed: 520,
  speedShell: 200, speedBare: 240, pushSpeed: 110,
  accGround: 2400, accAir: 1500, friction: 2600,
  spring: 900, maxFall: 900, coyote: 0.1, buffer: 0.12
};
const PW = 22, PH = 24;   // crab hitbox
const SW = 22, SH = 20;   // loose shell hitbox
const STEP = 1 / 120;

// ---------------------------------------------------------------------------
// Levels — 32 x 18 tiles
//  #  rock        =  driftwood plank (jump up through it)
//  ^  spikes      v  ceiling spikes
//  P  start       s  loose shell (crab starts without it)
//  G  goal pearl  S  spring
//  p  plate       D  gate (open while any plate has weight on it)
// ---------------------------------------------------------------------------
// LEVELS-START
const F = '################################';
const E = '#..............................#';
const rep = (s, n) => Array(n).fill(s);
const LEVELS = [
  { name: 'First Steps',
    hint: 'Move with ← → or A D. Jump with ↑, W or Space.',
    hintTouch: 'Move with ◀ ▶ and jump with ▲.',
    map: [F, ...rep(E, 12),
      '#...................##.........#',
      '#.P.......#.........##......G..#',
      '###############..###############',
      '###############..###############',
      '###############..###############'] },
  { name: 'Pop Out',
    hint: 'Jump, then jump again in mid-air to pop out of your shell!',
    map: [F, ...rep(E, 10),
      ...rep('#.............##...............#', 3),
      '#.P...........##...........G...#',
      F, F, F] },
  { name: 'Heavy Shell',
    hint: 'Plates need weight. Drop your shell on the plate to hold the gate open.',
    map: [F, ...rep('#...................#..........#', 12),
      '#...................D..........#',
      '#.P.......p.........D......G...#',
      F, F, F] },
  { name: 'Back Inside',
    hint: 'Shell-less, you jump higher. Press ↓ or S at your shell to climb back in.',
    hintTouch: 'Shell-less, you jump higher. Tap ⤓ at your shell to climb back in.',
    map: [F, ...rep(E, 7),
      ...rep('#...................##.........#', 3),
      '#...........s.......##.....G...#',
      '#........#######################',
      '#........#######################',
      '#.P......#######################',
      F, F, F] },
  { name: 'Shell Bridge',
    hint: 'Hop across on the driftwood – or pop out and use your shell as a bridge!',
    map: [F, ...rep(E, 12),
      '#............==................#',
      '#.P............................#',
      '###########^^^^^^..........G...#',
      F, F] },
  { name: 'Boing!',
    hint: 'Springs send you sky-high. Steer while you fly.',
    map: [F, ...rep(E, 8),
      '#..........................G...#',
      '#...........######^^^###########',
      ...rep('#...........####################', 3),
      '#.P.......S.####################',
      F, F, F] },
  { name: 'Up and Over',
    hint: 'The plate is up high, the gate is down low.',
    map: [F, ...rep('#...................#..........#', 8),
      '#............p......#..........#',
      '#........#######....#..........#',
      '#...................#..........#',
      '#...................D..........#',
      '#...................D..........#',
      '#.P....S............D......G...#',
      F, F, F] },
  { name: 'Push It',
    hint: 'Shell-less, walk into your shell to push it.',
    map: [F, ...rep('#.....................#........#', 9),
      '#.....................D........#',
      '#.....................D........#',
      '#.....................D.....G..#',
      '#.........######################',
      '#.P...............p#############',
      F, F, F] },
  { name: 'Mind Your Head',
    hint: 'Shell-less jumps go higher… maybe too high in here.',
    map: [F, ...rep(E, 9),
      '#.....#################........#',
      '#.....vvvvvvvvvvvvvvvvv....##..#',
      '#..........................##..#',
      '#..........................##..#',
      '#.P........................##.G#',
      '##########..####..##############',
      '##########..####..##############',
      '##########..####..##############'] },
  { name: 'Driftwood Climb',
    hint: 'You can jump up through driftwood from below.',
    map: [F, E, E,
      '#..........................G...#',
      '#......................#########',
      E, E,
      '#..................===.........#',
      E,
      '#..............===.............#',
      E,
      '#..........===.................#',
      E,
      '#......===.....................#',
      '#.P............................#',
      '######^^^^^^^^^^^^^^^^^^^^^^^^^#',
      F, F] },
  { name: 'High Tide',
    hint: 'Everything you\'ve learned. Good luck, little crab!',
    map: [F, ...rep('#.............#................#', 8),
      '#........p....#................#',
      '#.....######..#................#',
      '#.............#.............G..#',
      '#.............D..........#######',
      '#.............D..........#######',
      '#.P.S.........D..........#######',
      '##################^^^^##########',
      F, F] },
  // ---------------- Hard levels ----------------
  { name: 'Needle Run', hard: true,
    hint: 'Long jumps under the needles. Keep your shell on until the very end.',
    map: [F, ...rep(E, 9),
      '#...######################.....#',
      '#...vvvvvvvvvvvvvvvvvvvvvv.##..#',
      '#..........................##..#',
      '#..........................##..#',
      '#.P........................##.G#',
      '#######^^^###^^^^###^^^^########',
      F, F] },
  { name: 'Spring Hopper', hard: true,
    hint: 'Steer every bounce. Miss a spring and it\'s over.',
    map: [F, ...rep(E, 4),
      '#....#######################...#',
      '#....vvvvvvvvvvvvvvvvvvvvvvv...#',
      ...rep(E, 7),
      '#.P...S....S....S....S....S..G.#',
      '#####^#^^^^#^^^^#^^^^#^^^^#^####',
      F, F] },
  { name: 'Plate Sprint', hard: true,
    hint: 'Weigh the plate, then sprint. The gap is wider than it looks.',
    map: [F, ...rep('#............#.................#', 8),
      '#.......p....#.................#',
      '#....######..#.................#',
      '#............#.............G...#',
      '#............D.........#########',
      '#............D.........#########',
      '#.PS.........D.........#########',
      '################^^^^^###########',
      F, F] },
  { name: 'Deep Dive', hard: true,
    hint: 'Too wide to jump. Pop out late and use your shell.',
    map: [F, ...rep(E, 10),
      '#...........................G..#',
      '#..........................#####',
      '#..........................#####',
      '#.P........................#####',
      '#######^^^^^^^^####^^^^^########',
      F, F] },
  { name: 'Plank Peril', hard: true,
    hint: 'Tiny planks, sharp spikes, one shell. Watch the ceiling.',
    map: [F, E, E,
      '#...........................G..#',
      '#.............#####.......######',
      '#.............vvvvv............#',
      E,
      '#..................=...=.......#',
      E,
      '#...........=...=..............#',
      E,
      '#........=.....................#',
      E,
      '#.....=........................#',
      '#.P............................#',
      '####^^^^^^^^^^^^^^^^^^^^^^^^^^^#',
      F, F] },
  { name: 'Tunnel Trouble', hard: true,
    hint: 'Push, climb, and keep your hops short under the needles.',
    map: [F, ...rep('#.....................#........#', 7),
      '#...........#########.#........#',
      '#...........vvvvvvvvv.#........#',
      '#.....................D........#',
      '#.....................D........#',
      '#.............^^^.....D.....G..#',
      '#.........######################',
      '#.P...............p#############',
      F, F, F] },
  { name: 'Spring Gate', hard: true,
    hint: 'Open the gate from up high, then bounce for your life.',
    map: [F, ...rep('#.........#....................#', 8),
      '#......p..#....................#',
      '#....####.#....................#',
      '#.........#..................G.#',
      '#.........D................#####',
      '#.........D................#####',
      '#P.S......D....S....S....S.#####',
      '#############^^#^^^^#^^^^#^#####',
      F, F] },
  { name: 'The Last Pearl', hard: true,
    hint: 'The final test. Under those needles, only a tiny hop before you pop!',
    map: [F,
      '#.................vvvvv.....#..#',
      ...rep('#...........................#..#', 3),
      '#...................p.......#..#',
      '#.................#####.....#..#',
      ...rep('#...........................#..#', 4),
      '#.....s.........S...........#..#',
      '#....####^^^^##########.....D..#',
      '#....##################.....D..#',
      '#.P..##################.....D.G#',
      '#######################^^^^#####',
      F, F] }
];
// LEVELS-END

// ---------------------------------------------------------------------------
// Save data
// ---------------------------------------------------------------------------
const SAVE_KEY = 'hermit-hop-save-v1';
function loadSave() {
  try {
    const s = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (s && typeof s.unlocked === 'number') return { unlocked: s.unlocked, best: s.best || {}, muted: !!s.muted };
  } catch (e) {}
  return { unlocked: 1, best: {}, muted: false };
}
function writeSave() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) {} }
const save = loadSave();

// ---------------------------------------------------------------------------
// Sound (tiny synth, no files)
// ---------------------------------------------------------------------------
const Sound = {
  ctx: null, muted: save.muted,
  init() {
    if (!this.ctx) { try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; } }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  },
  tone(freq, dur, type = 'square', vol = 0.12, slide = 0, delay = 0) {
    if (this.muted || !this.ctx) return;
    const t = this.ctx.currentTime + delay;
    const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(this.ctx.destination);
    o.start(t); o.stop(t + dur + 0.02);
  },
  jump()   { this.tone(380, 0.12, 'square', 0.06, 320); },
  pop()    { this.tone(820, 0.07, 'triangle', 0.16, -500); this.tone(520, 0.14, 'sine', 0.12, 700, 0.05); },
  enter()  { this.tone(500, 0.08, 'triangle', 0.14, -250); this.tone(300, 0.1, 'sine', 0.1, -100, 0.06); },
  spring() { this.tone(180, 0.28, 'sine', 0.2, 700); },
  plate()  { this.tone(260, 0.06, 'square', 0.07); },
  gate()   { this.tone(150, 0.2, 'sawtooth', 0.045, 90); },
  thunk()  { this.tone(110, 0.08, 'triangle', 0.14, -40); },
  land()   { this.tone(140, 0.05, 'sine', 0.07, -40); },
  die()    { this.tone(420, 0.4, 'sawtooth', 0.09, -340); },
  win()    { [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.2, 'triangle', 0.12, 0, i * 0.09)); },
  ui()     { this.tone(620, 0.05, 'triangle', 0.08); },
  nope()   { this.tone(140, 0.12, 'square', 0.06); }
};

// ---------------------------------------------------------------------------
// DOM / canvas
// ---------------------------------------------------------------------------
const $ = id => document.getElementById(id);
const canvas = $('game'), ctx = canvas.getContext('2d'), stage = $('stage');
const isTouch = (window.matchMedia && matchMedia('(pointer: coarse)').matches) || ('ontouchstart' in window);
const inFrame = (() => { try { return window.self !== window.top; } catch (e) { return true; } })();
let bgGrad = null;

function resize() {
  const vw = window.innerWidth, vh = window.innerHeight;
  const scale = Math.min(vw / W, vh / H);
  stage.style.transform = `translate(-50%,-50%) scale(${scale})`;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.max(1, Math.round(W * scale * dpr));
  canvas.height = Math.max(1, Math.round(H * scale * dpr));
  ctx.setTransform(canvas.width / W, 0, 0, canvas.height / H, 0, 0);
  bgGrad = null;
}
window.addEventListener('resize', resize);

// ---------------------------------------------------------------------------
// Game state
// ---------------------------------------------------------------------------
const state = { mode: 'title', levelIndex: 0, time: 0, deaths: 0, deathT: 0, winT: 0,
  doorsOpen: false, doorAnim: 0, shellLost: false, t: 0 };
let level = null, tileLayer = null, player = null, shell = null, particles = [];
const input = { left: false, right: false, jump: false, down: false, jumpPressed: false, downPressed: false };

function parseLevel(def) {
  const grid = def.map.map(r => r.split(''));
  const L = { grid, start: null, shellStart: null, goal: null, springs: [], plates: [], doors: [], doorRuns: [], spikes: [] };
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    const ch = grid[r][c];
    if (ch === 'P') { L.start = { x: c * T + (T - PW) / 2, y: (r + 1) * T - PH }; grid[r][c] = '.'; }
    else if (ch === 's') { L.shellStart = { x: c * T + (T - SW) / 2, y: (r + 1) * T - SH }; grid[r][c] = '.'; }
    else if (ch === 'G') { L.goal = { c, r }; grid[r][c] = '.'; }
    else if (ch === 'S') { L.springs.push({ c, r, anim: 0 }); grid[r][c] = '.'; }
    else if (ch === 'p') { L.plates.push({ c, r, pressed: false, anim: 0 }); grid[r][c] = '.'; }
    else if (ch === 'D') L.doors.push({ c, r });
    else if (ch === '^') L.spikes.push({ x: c * T + 4, y: r * T + 15, w: T - 8, h: 15 });
    else if (ch === 'v') L.spikes.push({ x: c * T + 4, y: r * T, w: T - 8, h: 14 });
  }
  for (const d of L.doors) {
    if (d.r > 0 && grid[d.r - 1][d.c] === 'D') continue;
    let r1 = d.r;
    while (r1 + 1 < ROWS && grid[r1 + 1][d.c] === 'D') r1++;
    L.doorRuns.push({ c: d.c, r0: d.r, r1 });
  }
  return L;
}

function loadLevel(i) {
  state.levelIndex = i;
  level = parseLevel(LEVELS[i]);
  tileLayer = buildTileLayer();
  state.time = 0; state.deaths = 0;
  resetRun();
  $('hudNum').textContent = i + 1;
  $('hudName').textContent = LEVELS[i].name;
}

function resetRun() {
  const s = level.start;
  player = { x: s.x, y: s.y, w: PW, h: PH, vx: 0, vy: 0, onGround: false, onShell: false, hasShell: !level.shellStart,
    facing: 1, coyote: 0, jumpBuffer: 0, springing: false, pushing: false, alive: true,
    walk: 0, squash: 1, blinkT: 2 + Math.random() * 3 };
  if (level.shellStart) {
    shell = { x: level.shellStart.x, y: level.shellStart.y, w: SW, h: SH, vx: 0, vy: 0, active: true, ghost: false, onGround: false, facing: -1, wobble: 0 };
  } else {
    shell = { active: false, x: 0, y: 0, w: SW, h: SH };
  }
  state.doorsOpen = false; state.doorAnim = 0; state.shellLost = false;
  for (const p of level.plates) { p.pressed = false; p.anim = 0; }
  for (const s2 of level.springs) s2.anim = 0;
  particles = [];
}

// ---------------------------------------------------------------------------
// Collision helpers
// ---------------------------------------------------------------------------
const overlap = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
const approach = (v, target, d) => v < target ? Math.min(v + d, target) : Math.max(v - d, target);

function solidAt(c, r) {
  if (c < 0 || c >= COLS || r < 0) return true;
  if (r >= ROWS) return false;
  const ch = level.grid[r][c];
  return ch === '#' || (ch === 'D' && !state.doorsOpen);
}
function oneWayAt(c, r) { return r >= 0 && r < ROWS && c >= 0 && c < COLS && level.grid[r][c] === '='; }

function moveX(e, dx) {
  if (!dx) return false;
  e.x += dx;
  const top = Math.floor(e.y / T), bot = Math.floor((e.y + e.h - 0.001) / T);
  if (dx > 0) {
    const c = Math.floor((e.x + e.w - 0.001) / T);
    for (let r = top; r <= bot; r++) if (solidAt(c, r)) { e.x = c * T - e.w; e.vx = 0; return true; }
  } else {
    const c = Math.floor(e.x / T);
    for (let r = top; r <= bot; r++) if (solidAt(c, r)) { e.x = (c + 1) * T; e.vx = 0; return true; }
  }
  return false;
}

function moveY(e, dy) {
  if (!dy) return false;
  const prevBottom = e.y + e.h;
  e.y += dy;
  const l = Math.floor(e.x / T), rr = Math.floor((e.x + e.w - 0.001) / T);
  if (dy > 0) {
    const r = Math.floor((e.y + e.h - 0.001) / T);
    for (let c = l; c <= rr; c++) {
      if (solidAt(c, r) || (oneWayAt(c, r) && prevBottom <= r * T + 0.01)) {
        e.y = r * T - e.h; e.vy = 0; e.onGround = true; return true;
      }
    }
  } else {
    const r = Math.floor(e.y / T);
    for (let c = l; c <= rr; c++) if (solidAt(c, r)) { e.y = (r + 1) * T; e.vy = 0; return true; }
  }
  return false;
}

function overlapsSolid(e) {
  const l = Math.floor(e.x / T), rr = Math.floor((e.x + e.w - 0.001) / T);
  const t = Math.floor(e.y / T), b = Math.floor((e.y + e.h - 0.001) / T);
  for (let r = t; r <= b; r++) for (let c = l; c <= rr; c++) if (solidAt(c, r)) return true;
  return false;
}

function springRect(s) { return { x: s.c * T + 2, y: s.r * T + T - 12, w: T - 4, h: 12 }; }
function plateRect(p) { return { x: p.c * T + 3, y: p.r * T + T - 8, w: T - 6, h: 8 }; }

function bounceSprings(e, isPlayer) {
  if (e.vy < 0) return false;
  for (const s of level.springs) {
    const r = springRect(s);
    if (overlap(e, r)) {
      e.y = r.y - e.h; e.vy = -PHYS.spring; e.onGround = false;
      s.anim = 1;
      if (isPlayer) { e.springing = true; e.squash = 1.3; }
      Sound.spring();
      burst(r.x + r.w / 2, r.y, 8, ['#ffffff', '#ffd6a0'], 140, [2, 4], 300);
      return true;
    }
  }
  return false;
}

// ---------------------------------------------------------------------------
// Simulation
// ---------------------------------------------------------------------------
function shed() {
  const p = player;
  p.hasShell = false;
  shell = { x: p.x + (PW - SW) / 2, y: p.y + PH - SH, w: SW, h: SH, vx: 0, vy: 120,
    active: true, ghost: true, onGround: false, facing: p.facing, wobble: 1 };
  p.vy = -PHYS.shed; p.vx *= 0.3; p.springing = false; p.jumpBuffer = 0; p.squash = 1.25;
  state.shellLost = false;
  Sound.pop();
  burst(p.x + p.w / 2, p.y + p.h / 2, 14, ['#ffffff', '#c3d5ff', '#ffe2a6'], 220, [2, 4.5], 500);
}

function touchingShell() {
  if (!shell.active) return false;
  const pad = 3;
  return overlap({ x: player.x - pad, y: player.y - pad, w: player.w + pad * 2, h: player.h + pad * 2 }, shell);
}

function tryEnterShell() {
  const p = player;
  if (p.hasShell || !touchingShell()) return;
  const ox = p.x, oy = p.y;
  p.x = shell.x + (SW - PW) / 2;
  p.y = shell.y + SH - PH;
  if (overlapsSolid(p)) { p.x = ox; p.y = oy; Sound.nope(); return; }
  p.hasShell = true; p.vx = 0;
  if (p.vy < 0) p.vy = 0;
  shell.active = false;
  p.squash = 0.75;
  Sound.enter();
  burst(p.x + p.w / 2, p.y + p.h - 6, 8, ['#c3d5ff', '#ffffff'], 120, [2, 3.5], 300);
}

function stepShell(dt) {
  const s = shell;
  if (!s.active) return;
  const oy = s.y, preVy = s.vy;
  s.vy = Math.min(s.vy + PHYS.g * dt, PHYS.maxFall);
  if (s.onGround) s.vx = approach(s.vx, 0, PHYS.friction * dt);
  s.onGround = false;
  moveX(s, s.vx * dt);
  moveY(s, s.vy * dt);
  if (s.onGround && preVy > 300) {
    Sound.thunk(); s.wobble = 1;
    burst(s.x + s.w / 2, s.y + s.h, 6, ['#f3d8a8', '#ffffff'], 90, [1.5, 3], 400);
  }
  bounceSprings(s, false);
  const p = player;
  if (p.alive && !p.hasShell) {
    const dy = s.y - oy;
    if (p.onShell && dy) { p.y += dy; if (s.vy < 0) p.vy = Math.min(p.vy, s.vy); }
    else if (!s.ghost && overlap(p, s)) s.ghost = true; // fell onto the crab: let it pass through
  }
  if (s.y > H + 80) { s.active = false; state.shellLost = true; }
}

function stepPlayer(dt) {
  const p = player;
  const dir = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  let max = p.hasShell ? PHYS.speedShell : PHYS.speedBare;
  if (p.pushing) max = PHYS.pushSpeed;
  if (dir) { p.vx = approach(p.vx, dir * max, (p.onGround ? PHYS.accGround : PHYS.accAir) * dt); p.facing = dir; }
  else p.vx = approach(p.vx, 0, (p.onGround ? PHYS.friction : PHYS.accAir * 0.6) * dt);

  if (p.onGround) p.coyote = PHYS.coyote; else p.coyote -= dt;
  p.jumpBuffer -= dt;
  if (input.jumpPressed) p.jumpBuffer = PHYS.buffer;

  if (p.jumpBuffer > 0 && p.coyote > 0) {
    p.vy = -(p.hasShell ? PHYS.jumpShell : PHYS.jumpBare);
    p.jumpBuffer = 0; p.coyote = 0; p.onGround = false; p.springing = false; p.squash = 1.2;
    Sound.jump();
  } else if (input.jumpPressed && !p.onGround && p.coyote <= 0 && p.hasShell) {
    shed();
  }
  input.jumpPressed = false;

  if (input.downPressed) { tryEnterShell(); input.downPressed = false; }

  let grav = PHYS.g;
  if (p.vy < 0 && !input.jump && !p.springing) grav *= 2.2; // short hop when jump is released early
  p.vy = Math.min(p.vy + grav * dt, PHYS.maxFall);
  if (p.vy >= 0) p.springing = false;

  // horizontal
  const dx = p.vx * dt;
  p.pushing = false;
  moveX(p, dx);
  collidePlayerShellX(dx);

  // vertical
  const wasGround = p.onGround, preVy = p.vy;
  const prevBottom = p.y + p.h, prevTop = p.y;
  p.onGround = false;
  moveY(p, p.vy * dt);
  collidePlayerShellY(prevBottom, prevTop);
  bounceSprings(p, true);

  if (!wasGround && p.onGround && preVy > 250) {
    p.squash = 0.72; Sound.land();
    burst(p.x + p.w / 2, p.y + p.h, 5, ['#f3d8a8', '#ffffff'], 80, [1.5, 3], 400);
  }
  if (p.onGround && Math.abs(p.vx) > 5) p.walk += Math.abs(p.vx) * dt * 0.09;
}

function collidePlayerShellX(dx) {
  const p = player, s = shell;
  if (!s.active || s.ghost || p.hasShell || !dx || !overlap(p, s)) return;
  if (p.onGround && s.onGround && Math.abs((p.y + p.h) - (s.y + s.h)) < 4) {
    const push = dx > 0 ? (p.x + p.w) - s.x : p.x - (s.x + s.w);
    const before = s.x;
    moveX(s, push);
    if (s.x !== before) { p.pushing = true; s.facing = dx > 0 ? 1 : -1; s.wobble = Math.max(s.wobble, 0.3); }
  }
  if (overlap(p, s)) { p.x = dx > 0 ? s.x - p.w : s.x + s.w; p.vx = 0; }
}

function collidePlayerShellY(prevBottom, prevTop) {
  const p = player, s = shell;
  p.onShell = false;
  if (!s.active || s.ghost || p.hasShell || !overlap(p, s)) return;
  if (p.vy >= 0 && prevBottom <= s.y + 0.5) { p.y = s.y - p.h; p.vy = 0; p.onGround = true; p.onShell = true; }
  else if (p.vy < 0 && prevTop >= s.y + s.h - 0.5) { p.y = s.y + s.h; p.vy = 0; }
}

function updatePlatesAndDoors(dt) {
  const p = player;
  let any = false;
  for (const pl of level.plates) {
    const r = plateRect(pl);
    const was = pl.pressed;
    pl.pressed = (shell.active && overlap(shell, r)) || (p.alive && p.hasShell && overlap(p, r));
    if (pl.pressed && !was) Sound.plate();
    any = any || pl.pressed;
  }
  if (any && !state.doorsOpen) { state.doorsOpen = true; if (level.doors.length) Sound.gate(); }
  else if (!any && state.doorsOpen) {
    // never slam a gate shut on top of something
    let blocked = false;
    for (const d of level.doors) {
      const r = { x: d.c * T, y: d.r * T, w: T, h: T };
      if ((p.alive && overlap(p, r)) || (shell.active && overlap(shell, r))) { blocked = true; break; }
    }
    if (!blocked) { state.doorsOpen = false; if (level.doors.length) Sound.gate(); }
  }
  state.doorAnim = approach(state.doorAnim, state.doorsOpen ? 1 : 0, dt * 5);
}

function physics(dt) {
  state.time += dt;
  if (!player.alive) {
    state.deathT -= dt;
    if (state.deathT <= 0) resetRun();
    return;
  }
  stepShell(dt);
  stepPlayer(dt);
  if (shell.active && shell.ghost && !overlap(player, shell)) shell.ghost = false;
  updatePlatesAndDoors(dt);

  const p = player;
  const hit = { x: p.x + 3, y: p.y + 4, w: p.w - 6, h: p.h - 6 };
  for (const s of level.spikes) if (overlap(hit, s)) { die(); return; }
  if (p.y > H + 40) { die(); return; }
  const g = level.goal;
  if (overlap(p, { x: g.c * T + 4, y: g.r * T - 10, w: T - 8, h: T + 10 })) win();
}

function die() {
  const p = player;
  p.alive = false; state.deathT = 0.9; state.deaths++;
  Sound.die();
  const cx = p.x + p.w / 2, cy = Math.min(p.y + p.h / 2, H - 10);
  burst(cx, cy, 22, ['#ff7f6e', '#ffa48c', '#ffffff'], 300, [2, 5], 700);
  if (p.hasShell) burst(cx, cy, 10, ['#6a96f2', '#c3d5ff'], 260, [2, 5], 700);
}

function win() {
  const i = state.levelIndex;
  Sound.win();
  const g = level.goal;
  burst(g.c * T + T / 2, g.r * T + 6, 40, ['#ffe2a6', '#ff7f6e', '#6a96f2', '#ffffff', '#7fd6a8'], 380, [2.5, 5.5], 500);
  const prev = save.best[i];
  const isBest = prev === undefined || state.time < prev;
  if (isBest) save.best[i] = state.time;
  save.unlocked = Math.max(save.unlocked, Math.min(LEVELS.length, i + 2));
  writeSave();
  $('winTime').textContent = fmt(state.time);
  $('winBest').textContent = fmt(save.best[i]);
  $('winDeaths').textContent = state.deaths;
  $('winBadge').classList.toggle('on', isBest && prev !== undefined);
  $('btnWinNext').textContent = i + 1 < LEVELS.length ? 'Next' : 'Finish';
  state.winT = 0.8;
  setMode('winning');
}

// ---------------------------------------------------------------------------
// Particles
// ---------------------------------------------------------------------------
function burst(x, y, n, colors, speed, size, grav) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * TAU, sp = speed * (0.35 + Math.random() * 0.65);
    const life = 0.45 + Math.random() * 0.5;
    particles.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - speed * 0.3, life, max: life,
      c: colors[(Math.random() * colors.length) | 0], s: size[0] + Math.random() * (size[1] - size[0]), g: grav });
  }
}
function updateParticles(dt) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const q = particles[i];
    q.vy += q.g * dt; q.x += q.vx * dt; q.y += q.vy * dt; q.life -= dt;
    if (q.life <= 0) particles.splice(i, 1);
  }
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------
function hash(a, b) { let h = (a * 374761393 + b * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177; return (h ^ (h >>> 16)) >>> 0; }

function rr(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
}

function buildTileLayer() {
  const c = document.createElement('canvas');
  c.width = W * 2; c.height = H * 2;
  const g = c.getContext('2d');
  g.scale(2, 2);
  const grid = level.grid;
  const rock = (cc, r) => cc < 0 || cc >= COLS || r < 0 || r >= ROWS || grid[r][cc] === '#';
  for (let r = 0; r < ROWS; r++) for (let cc = 0; cc < COLS; cc++) {
    const ch = grid[r][cc], x = cc * T, y = r * T, h = hash(cc, r);
    if (ch === '#') {
      g.fillStyle = '#c98c5a'; g.fillRect(x, y, T, T);
      for (let k = 0; k < 3; k++) {
        g.fillStyle = k === 2 ? 'rgba(255,230,190,.18)' : 'rgba(110,60,30,.22)';
        g.beginPath();
        g.arc(x + 4 + ((h >>> (k * 6)) % 22), y + 5 + ((h >>> (k * 6 + 3)) % 21), 1.4 + ((h >>> k) & 1), 0, TAU);
        g.fill();
      }
      g.fillStyle = '#9c6440';
      if (!rock(cc - 1, r)) g.fillRect(x, y, 3, T);
      if (!rock(cc + 1, r)) g.fillRect(x + T - 3, y, 3, T);
      if (!rock(cc, r + 1)) g.fillRect(x, y + T - 3, T, 3);
      if (!rock(cc, r - 1)) {
        const deco = r === 0 || (grid[r - 1][cc] !== '^' && grid[r - 1][cc] !== '=');
        g.fillStyle = '#e3b56f';
        g.beginPath(); g.moveTo(x, y);
        g.lineTo(x + T, y); g.lineTo(x + T, y + 9);
        for (let i = T; i > 0; i -= 6) g.quadraticCurveTo(x + i - 3, y + 13, x + i - 6, y + 9);
        g.closePath(); g.fill();
        g.fillStyle = '#f5d491'; g.fillRect(x, y, T, 7);
        g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(x, y, T, 2);
        if (deco && h % 6 === 0) { // seaweed tuft
          g.strokeStyle = '#3fa77a'; g.lineWidth = 2.2; g.lineCap = 'round';
          const bx = x + 8 + (h % 14);
          for (let k = -1; k <= 1; k++) {
            g.beginPath(); g.moveTo(bx + k * 3, y + 1);
            g.quadraticCurveTo(bx + k * 5 + 2, y - 6, bx + k * 4, y - 10 - (k === 0 ? 3 : 0)); g.stroke();
          }
        } else if (deco && h % 7 === 0) { // pebble shell
          g.fillStyle = '#fff1f4'; g.strokeStyle = '#e7a7b8'; g.lineWidth = 1;
          const bx = x + 6 + (h % 16);
          g.beginPath(); g.arc(bx, y + 1, 3.2, Math.PI, 0); g.closePath(); g.fill(); g.stroke();
        }
      }
    } else if (ch === '=') {
      g.fillStyle = '#7a4d31'; rr(g, x - 1, y, T + 2, 10, 3); g.fill();
      g.fillStyle = '#b07a52'; g.fillRect(x + 1, y + 1, T - 2, 4);
      g.strokeStyle = 'rgba(70,40,20,.5)'; g.lineWidth = 1;
      g.beginPath(); g.moveTo(x + 4 + (h % 8), y + 7); g.lineTo(x + 16 + (h % 8), y + 7); g.stroke();
      g.fillStyle = '#4c2f1d';
      g.beginPath(); g.arc(x + 5, y + 5, 1.3, 0, TAU); g.arc(x + T - 5, y + 5, 1.3, 0, TAU); g.fill();
    } else if (ch === '^' || ch === 'v') {
      const up = ch === '^';
      g.fillStyle = '#e9eef5'; g.strokeStyle = '#45506a'; g.lineWidth = 1.6; g.lineJoin = 'round';
      for (let i = 0; i < 3; i++) {
        const bx = x + 1 + i * 9.33;
        g.beginPath();
        if (up) { g.moveTo(bx, y + T); g.lineTo(bx + 4.67, y + 14); g.lineTo(bx + 9.33, y + T); }
        else { g.moveTo(bx, y); g.lineTo(bx + 4.67, y + 15); g.lineTo(bx + 9.33, y); }
        g.closePath(); g.fill(); g.stroke();
      }
      g.fillStyle = '#7c86a0';
      g.fillRect(x, up ? y + T - 3 : y, T, 3);
    }
  }
  return c;
}

const clouds = [{ x: 80, y: 70, s: 1, sp: 6 }, { x: 420, y: 110, s: 0.7, sp: 4 }, { x: 700, y: 60, s: 0.85, sp: 5 }];
const bubbles = Array.from({ length: 20 }, () => ({ x: Math.random() * W, y: Math.random() * H, r: 1.5 + Math.random() * 3.5, sp: 10 + Math.random() * 22, ph: Math.random() * TAU }));

function drawBackground() {
  const t = state.t;
  if (!bgGrad) {
    bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, '#ffe1b3'); bgGrad.addColorStop(0.42, '#ffb59a'); bgGrad.addColorStop(0.75, '#8fcfd6'); bgGrad.addColorStop(1, '#5fb1c4');
  }
  ctx.fillStyle = bgGrad; ctx.fillRect(0, 0, W, H);
  const sg = ctx.createRadialGradient(740, 150, 20, 740, 150, 150);
  sg.addColorStop(0, 'rgba(255,250,228,.9)'); sg.addColorStop(0.4, 'rgba(255,238,200,.35)'); sg.addColorStop(1, 'rgba(255,230,190,0)');
  ctx.fillStyle = sg; ctx.fillRect(590, 0, 300, 300);
  ctx.fillStyle = '#fff4d6'; ctx.beginPath(); ctx.arc(740, 150, 44, 0, TAU); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.6)';
  for (const c of clouds) {
    const x = ((c.x + t * c.sp) % (W + 220)) - 110;
    ctx.beginPath();
    ctx.ellipse(x, c.y, 46 * c.s, 15 * c.s, 0, 0, TAU);
    ctx.ellipse(x - 26 * c.s, c.y + 4 * c.s, 26 * c.s, 11 * c.s, 0, 0, TAU);
    ctx.ellipse(x + 20 * c.s, c.y - 9 * c.s, 26 * c.s, 15 * c.s, 0, 0, TAU);
    ctx.fill();
  }
  // far island
  ctx.fillStyle = 'rgba(214,120,110,.35)';
  ctx.beginPath(); ctx.moveTo(90, 330); ctx.quadraticCurveTo(200, 250, 330, 330); ctx.fill();
  ctx.beginPath(); ctx.moveTo(520, 335); ctx.quadraticCurveTo(580, 290, 650, 335); ctx.fill();
  const waves = [
    { y: 330, a: 6, l: 170, s: 0.6, c: 'rgba(120,196,214,.55)' },
    { y: 372, a: 8, l: 130, s: -0.8, c: 'rgba(84,170,198,.55)' },
    { y: 420, a: 7, l: 100, s: 1.1, c: 'rgba(58,142,180,.6)' }
  ];
  for (const w of waves) {
    ctx.fillStyle = w.c; ctx.beginPath(); ctx.moveTo(0, H);
    for (let x = 0; x <= W; x += 16) ctx.lineTo(x, w.y + Math.sin(x / w.l * TAU + t * w.s) * w.a);
    ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
  }
  ctx.strokeStyle = 'rgba(255,255,255,.4)'; ctx.lineWidth = 1.2;
  for (const b of bubbles) {
    const y = ((b.y - t * b.sp) % (H + 20) + H + 20) % (H + 20);
    if (y < 330) continue;
    ctx.beginPath(); ctx.arc(b.x + Math.sin(t + b.ph) * 4, y, b.r, 0, TAU); ctx.stroke();
  }
}

function drawShellShape(g, cx, cy, r, f, opening) {
  g.save(); g.translate(cx, cy); g.scale(f, 1);
  const gr = g.createRadialGradient(-r * 0.35, -r * 0.45, 1, 0, 0, r * 1.25);
  gr.addColorStop(0, '#c3d5ff'); gr.addColorStop(0.5, '#6a96f2'); gr.addColorStop(1, '#3557b7');
  g.fillStyle = gr; g.strokeStyle = '#22397f'; g.lineWidth = 2; g.lineJoin = 'round';
  g.beginPath();
  g.moveTo(-r * 1.3, -r * 0.75);
  g.quadraticCurveTo(-r * 0.55, -r * 1.15, r * 0.15, -r * 0.99);
  g.arc(0, 0, r, Math.atan2(-0.99, 0.15), Math.PI * 0.92, false);
  g.quadraticCurveTo(-r * 1.25, -r * 0.05, -r * 1.3, -r * 0.75);
  g.closePath(); g.fill(); g.stroke();
  g.beginPath();
  for (let i = 0; i <= 36; i++) {
    const k = i / 36, a = -0.3 + k * Math.PI * 3.4, rad = r * 0.8 * (1 - k * 0.92);
    const px = Math.cos(a) * rad + r * 0.05, py = Math.sin(a) * rad + r * 0.03;
    if (i) g.lineTo(px, py); else g.moveTo(px, py);
  }
  g.strokeStyle = 'rgba(235,242,255,.85)'; g.lineWidth = 1.6; g.stroke();
  g.strokeStyle = 'rgba(34,57,127,.5)'; g.lineWidth = 1.2;
  g.beginPath(); g.moveTo(-r * 0.98, -r * 0.92); g.lineTo(-r * 0.86, -r * 0.42); g.stroke();
  g.fillStyle = 'rgba(255,255,255,.55)';
  g.beginPath(); g.ellipse(-r * 0.3, -r * 0.55, r * 0.28, r * 0.14, -0.5, 0, TAU); g.fill();
  if (opening) {
    g.fillStyle = '#1e2f6b';
    g.beginPath(); g.ellipse(r * 0.52, r * 0.6, r * 0.42, r * 0.22, -0.5, 0, TAU); g.fill();
  }
  g.restore();
}

function drawCrab(g, x, y, f, o) {
  g.save(); g.translate(x, y); g.scale(f / o.sq, o.sq);
  g.strokeStyle = '#b8443b'; g.lineWidth = 2.2; g.lineCap = 'round'; g.lineJoin = 'round';
  for (let i = 0; i < 3; i++) {
    const lx = -5 + i * 5, ph = o.walk + i * 2.1;
    const lift = o.moving ? Math.max(0, Math.sin(ph)) * 2.5 : 0, sw = o.moving ? Math.cos(ph) * 1.5 : 0;
    g.beginPath(); g.moveTo(lx, -7); g.lineTo(lx - 2 + sw, -4 - lift * 0.4); g.lineTo(lx - 1 + sw * 1.5, -lift); g.stroke();
  }
  if (!o.shell) { // soft, curly tail
    g.fillStyle = '#ffb8a8'; g.strokeStyle = '#d9675c'; g.lineWidth = 1.6;
    g.beginPath(); g.ellipse(-8, -12, 5.5, 6.2, -0.4, 0, TAU); g.fill(); g.stroke();
    g.beginPath(); g.moveTo(-12, -14); g.lineTo(-7, -15.5); g.moveTo(-12.5, -10); g.lineTo(-7, -11.5); g.stroke();
  }
  const bg = g.createLinearGradient(0, -18, 0, -3);
  bg.addColorStop(0, '#ffa48c'); bg.addColorStop(1, '#ff6b5a');
  g.fillStyle = bg; g.strokeStyle = '#b8443b'; g.lineWidth = 2;
  g.beginPath(); g.ellipse(1, -10, 10, 7.5, 0, 0, TAU); g.fill(); g.stroke();
  g.fillStyle = 'rgba(255,255,255,.35)';
  g.beginPath(); g.ellipse(2, -14, 4.5, 1.8, 0, 0, TAU); g.fill();
  if (o.shell) drawShellShape(g, -4, -15, 10, 1, false);
  // claw
  g.strokeStyle = '#b8443b'; g.lineWidth = 2;
  const cy = o.push ? -9 : -10 - Math.sin(o.t * 3) * 0.6;
  g.beginPath(); g.moveTo(8, -8); g.lineTo(11, cy + 1); g.stroke();
  g.fillStyle = '#ff8c76';
  g.beginPath(); g.ellipse(13.5, cy, 4.2, 3.4, -0.3, 0, TAU); g.fill(); g.stroke();
  g.beginPath(); g.moveTo(17.2, cy - 1.6); g.lineTo(13.8, cy); g.stroke();
  // eye stalks
  for (const [bx, tx, ty] of [[3, 2, -22], [7, 8, -23]]) {
    g.strokeStyle = '#b8443b'; g.lineWidth = 2;
    g.beginPath(); g.moveTo(bx, -15); g.lineTo(tx, ty + 2); g.stroke();
    g.fillStyle = '#fff'; g.lineWidth = 1.4;
    g.beginPath(); g.ellipse(tx, ty, 3.3, Math.max(0.3, 3.3 * o.blink), 0, 0, TAU); g.fill(); g.stroke();
    if (o.blink > 0.4) { g.fillStyle = '#1d2238'; g.beginPath(); g.arc(tx + 1.1, ty + 0.3, 1.6, 0, TAU); g.fill(); }
  }
  g.restore();
}

function drawPlayer() {
  const p = player;
  p.squash += (1 - p.squash) * Math.min(1, STEP * 14);
  let sq = p.squash;
  if (!p.onGround) sq *= p.vy < 0 ? 1.06 : 0.97;
  p.blinkT -= 1 / 60;
  if (p.blinkT < -0.12) p.blinkT = 2 + Math.random() * 3;
  const blink = p.blinkT < 0 ? 0.1 : 1;
  drawCrab(ctx, p.x + p.w / 2, p.y + p.h, p.facing, {
    walk: p.walk, moving: p.onGround && Math.abs(p.vx) > 5, sq, shell: p.hasShell, blink, push: p.pushing, t: state.t
  });
}

function drawLooseShell() {
  const s = shell;
  s.wobble = Math.max(0, (s.wobble || 0) - 1 / 30);
  ctx.save();
  ctx.translate(s.x + s.w / 2, s.y + s.h);
  ctx.rotate(Math.sin(state.t * 30) * 0.12 * s.wobble);
  drawShellShape(ctx, 0, -s.h / 2 + 0.5, 10, s.facing, true);
  ctx.restore();
  // "climb in" prompt
  if (player.alive && !player.hasShell && touchingShell() && state.mode === 'play') {
    const x = s.x + s.w / 2, y = s.y - 30 - Math.abs(Math.sin(state.t * 5)) * 4;
    ctx.fillStyle = 'rgba(255,247,234,.95)'; rr(ctx, x - 13, y - 13, 26, 24, 8); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x - 5, y + 11); ctx.lineTo(x + 5, y + 11); ctx.lineTo(x, y + 16); ctx.fill();
    ctx.strokeStyle = '#24314f'; ctx.lineWidth = 2.6; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(x, y - 7); ctx.lineTo(x, y + 4); ctx.moveTo(x - 5, y - 1); ctx.lineTo(x, y + 4); ctx.lineTo(x + 5, y - 1); ctx.stroke();
  }
}

function drawPlates(dt) {
  for (const pl of level.plates) {
    pl.anim = approach(pl.anim, pl.pressed ? 1 : 0, dt * 10);
    const x = pl.c * T, y = pl.r * T;
    if (pl.pressed) {
      const gl = ctx.createRadialGradient(x + T / 2, y + T - 4, 1, x + T / 2, y + T - 4, 22);
      gl.addColorStop(0, 'rgba(255,220,120,.7)'); gl.addColorStop(1, 'rgba(255,220,120,0)');
      ctx.fillStyle = gl; ctx.fillRect(x - 10, y, T + 20, T);
    }
    ctx.fillStyle = '#5c6178'; rr(ctx, x + 2, y + T - 5, T - 4, 5, 2); ctx.fill();
    const h = 6 - pl.anim * 4;
    ctx.fillStyle = pl.pressed ? '#ffe08a' : '#ffc94d'; ctx.strokeStyle = '#9a6b12'; ctx.lineWidth = 1.5;
    rr(ctx, x + 5, y + T - 5 - h, T - 10, h + 1, 2); ctx.fill(); ctx.stroke();
  }
}

function drawSprings(dt) {
  for (const s of level.springs) {
    s.anim = Math.max(0, s.anim - dt * 4);
    const x = s.c * T, y = s.r * T, base = y + T - 3;
    const h = 11 + Math.sin(s.anim * Math.PI) * 10;
    ctx.fillStyle = '#4b556e'; rr(ctx, x + 4, base, T - 8, 3, 1.5); ctx.fill();
    ctx.strokeStyle = '#a7b1c9'; ctx.lineWidth = 2.4; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(x + T / 2, base);
    const n = 4;
    for (let i = 1; i <= n; i++) ctx.lineTo(x + (i % 2 ? 8 : T - 8), base - (h - 4) * i / n);
    ctx.stroke();
    ctx.fillStyle = '#ff5d5d'; ctx.strokeStyle = '#a92f3a'; ctx.lineWidth = 1.5;
    rr(ctx, x + 3, base - h - 2, T - 6, 6, 3); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.fillRect(x + 6, base - h - 1, T - 14, 1.5);
  }
}

function drawDoors() {
  const a = state.doorAnim;
  for (const run of level.doorRuns) {
    const x = run.c * T, y0 = run.r0 * T, full = (run.r1 - run.r0 + 1) * T;
    const vis = full * (1 - a);
    ctx.fillStyle = 'rgba(40,30,60,.18)'; ctx.fillRect(x + 2, y0, T - 4, full);
    if (vis > 1) {
      ctx.fillStyle = '#ffc94d'; ctx.strokeStyle = '#9a6b12'; ctx.lineWidth = 1.5;
      for (let i = 0; i < 4; i++) {
        const bx = x + 3 + i * 6.6;
        rr(ctx, bx, y0, 4.4, vis, 2); ctx.fill(); ctx.stroke();
      }
      ctx.fillStyle = '#e8a92a'; rr(ctx, x + 1, y0 + vis - 6, T - 2, 6, 2); ctx.fill(); ctx.stroke();
    }
    ctx.fillStyle = '#5c6178'; rr(ctx, x - 1, y0 - 2, T + 2, 6, 2); ctx.fill();
  }
}

function drawGoal() {
  const g = level.goal, t = state.t;
  const x = g.c * T + T / 2, base = (g.r + 1) * T;
  const py = base - 20 + Math.sin(t * 2.6) * 2.5;
  const glow = ctx.createRadialGradient(x, py, 2, x, py, 34);
  glow.addColorStop(0, 'rgba(255,248,210,.85)'); glow.addColorStop(1, 'rgba(255,248,210,0)');
  ctx.fillStyle = glow; ctx.fillRect(x - 36, py - 36, 72, 72);
  // clam top (open, behind pearl)
  ctx.fillStyle = '#ffa9c0'; ctx.strokeStyle = '#c45c7e'; ctx.lineWidth = 1.8;
  ctx.beginPath(); ctx.moveTo(x - 15, base - 8); ctx.quadraticCurveTo(x - 18, base - 34, x + 2, base - 38);
  ctx.quadraticCurveTo(x + 10, base - 30, x + 15, base - 8); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = 'rgba(196,92,126,.5)'; ctx.lineWidth = 1.2;
  for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(x + i * 4.5, base - 9); ctx.lineTo(x + i * 3 - 1, base - 33); ctx.stroke(); }
  // pearl
  const pg = ctx.createRadialGradient(x - 2.5, py - 3, 1, x, py, 8);
  pg.addColorStop(0, '#ffffff'); pg.addColorStop(0.6, '#fbe6f0'); pg.addColorStop(1, '#d9aac4');
  ctx.fillStyle = pg; ctx.beginPath(); ctx.arc(x, py, 7.5, 0, TAU); ctx.fill();
  // clam bottom
  ctx.fillStyle = '#ffbdd0'; ctx.strokeStyle = '#c45c7e'; ctx.lineWidth = 1.8;
  ctx.beginPath(); ctx.moveTo(x - 16, base - 9); ctx.quadraticCurveTo(x, base - 3, x + 16, base - 9);
  ctx.quadraticCurveTo(x + 12, base, x, base); ctx.quadraticCurveTo(x - 12, base, x - 16, base - 9); ctx.closePath(); ctx.fill(); ctx.stroke();
  // sparkles
  for (let i = 0; i < 3; i++) {
    const a = t * 1.4 + i * TAU / 3, sx = x + Math.cos(a) * 17, sy = py + Math.sin(a) * 12, s = 2.5 + Math.sin(t * 5 + i) * 1.2;
    ctx.fillStyle = 'rgba(255,255,255,.9)';
    ctx.beginPath(); ctx.moveTo(sx, sy - s * 1.6); ctx.lineTo(sx + s * 0.45, sy); ctx.lineTo(sx, sy + s * 1.6); ctx.lineTo(sx - s * 0.45, sy); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(sx - s * 1.6, sy); ctx.lineTo(sx, sy + s * 0.45); ctx.lineTo(sx + s * 1.6, sy); ctx.lineTo(sx, sy - s * 0.45); ctx.closePath(); ctx.fill();
  }
}

function drawParticles() {
  for (const q of particles) {
    ctx.globalAlpha = Math.max(0, q.life / q.max);
    ctx.fillStyle = q.c; ctx.beginPath(); ctx.arc(q.x, q.y, q.s, 0, TAU); ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawBanner(text, y) {
  ctx.font = '600 16px Fredoka, system-ui, sans-serif';
  const w = ctx.measureText(text).width + 30;
  ctx.fillStyle = 'rgba(255,247,234,.9)'; rr(ctx, W / 2 - w / 2, y, w, 30, 15); ctx.fill();
  ctx.fillStyle = '#24314f'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(text, W / 2, y + 15.5);
}

function render(dt) {
  drawBackground();
  if (!level) return;
  ctx.drawImage(tileLayer, 0, 0, W, H);
  drawPlates(dt); drawSprings(dt); drawDoors(); drawGoal();
  if (shell.active) drawLooseShell();
  if (player.alive) drawPlayer();
  drawParticles();
  if (state.mode === 'play' || state.mode === 'paused') {
    const L = LEVELS[state.levelIndex];
    if (state.shellLost && !player.hasShell && player.alive) drawBanner('Your shell washed away! Press R to retry.', 52);
    else drawBanner((isTouch && L.hintTouch) || L.hint, 52);
  }
}

// ---------------------------------------------------------------------------
// UI / modes
// ---------------------------------------------------------------------------
function fmt(s) {
  if (s === undefined || s === null) return '–';
  const m = Math.floor(s / 60), sec = s - m * 60;
  return m + ':' + (sec < 10 ? '0' : '') + sec.toFixed(1);
}

const SCREENS = { title: 'scrTitle', levels: 'scrLevels', paused: 'scrPause', win: 'scrWin', end: 'scrEnd', bye: 'scrBye' };
function setMode(m) {
  state.mode = m;
  closeModal(true);
  for (const id of Object.values(SCREENS)) $(id).classList.remove('show');
  if (SCREENS[m]) $(SCREENS[m]).classList.add('show');
  $('hud').classList.toggle('show', m === 'play' || m === 'winning');
  $('touch').classList.toggle('show', isTouch && m === 'play');
  clearInput();
  if (m === 'title') updateTitle();
  if (m === 'levels') buildLevelGrid();
  if (m === 'paused') $('pauseSub').textContent = `Level ${state.levelIndex + 1} · ${LEVELS[state.levelIndex].name}`;
  if (m === 'win') countUp($('winTime'), state.time);
}

function clearedCount() { let n = 0; for (let i = 0; i < LEVELS.length; i++) if (save.best[i] !== undefined) n++; return n; }
function updateTitle() {
  const next = Math.min(save.unlocked, LEVELS.length);
  $('playSub').textContent = save.unlocked > 1 ? `Level ${next}` : 'Start';
  const c = clearedCount();
  $('titleProgress').textContent = `${c} / ${LEVELS.length} cleared`;
  $('titleTrack').style.width = '0%';
  requestAnimationFrame(() => requestAnimationFrame(() => { $('titleTrack').style.width = (c / LEVELS.length * 100) + '%'; }));
}

function openModal(id) {
  closeModal(true);
  state.modal = id;
  $(id).classList.add('show');
  Sound.ui();
}
function closeModal(silent) {
  if (!state.modal) return;
  $(state.modal).classList.remove('show');
  state.modal = null;
  if (!silent) Sound.ui();
}

function countUp(el, target) {
  const t0 = performance.now(), dur = 700;
  const tick = now => {
    const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 3);
    el.textContent = fmt(target * e);
    if (k < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

function clearInput() {
  input.left = input.right = input.jump = input.down = false;
  input.jumpPressed = input.downPressed = false;
  document.querySelectorAll('.tbtn.on').forEach(b => b.classList.remove('on'));
}

function startLevel(i) { loadLevel(i); setMode('play'); }
function restartLevel() { loadLevel(state.levelIndex); setMode('play'); }

function nextLevel() {
  const n = state.levelIndex + 1;
  if (n < LEVELS.length) startLevel(n);
  else {
    let total = 0;
    for (let i = 0; i < LEVELS.length; i++) total += save.best[i] || 0;
    $('endTotal').textContent = fmt(total);
    setMode('end');
  }
}

const ICON_LOCK = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 10V8a5 5 0 0 1 10 0v2h.5A1.5 1.5 0 0 1 19 11.5v8a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 19.5v-8A1.5 1.5 0 0 1 6.5 10zm2.5 0h5V8a2.5 2.5 0 0 0-5 0z"/></svg>';
const ICON_STAR = '<svg class="star" viewBox="0 0 24 24"><path d="M12 2.5l2.9 6 6.6.8-4.9 4.6 1.3 6.6L12 17.3 6.1 20.5l1.3-6.6L2.5 9.3l6.6-.8z" fill="#ffc94d" stroke="#9a6b12" stroke-width="1.5" stroke-linejoin="round"/></svg>';
function buildLevelGrid() {
  const grid = $('levelGrid');
  grid.innerHTML = '';
  LEVELS.forEach((L, i) => {
    const b = document.createElement('button');
    const unlocked = i < save.unlocked, done = save.best[i] !== undefined;
    b.className = 'lvl' + (done ? ' done' : '') + (unlocked ? '' : ' locked') + (unlocked && !done ? ' next' : '');
    b.style.setProperty('--i', i);
    b.title = unlocked ? L.name : 'Locked – clear the level before it';
    b.innerHTML = unlocked
      ? `${i + 1}${done ? `<small>${fmt(save.best[i])}</small>${ICON_STAR}` : '<small class="new">NEW</small>'}`
      : ICON_LOCK;
    b.addEventListener('click', () => {
      if (unlocked) { Sound.ui(); startLevel(i); return; }
      Sound.nope();
      b.classList.remove('shake'); void b.offsetWidth; b.classList.add('shake');
    });
    grid.appendChild(b);
  });
  $('lvlProgress').textContent = `${clearedCount()} / ${LEVELS.length} cleared`;
}

const ICON_SOUND_ON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor"/><path d="M15.5 9a4.5 4.5 0 0 1 0 6M18 6.5a8 8 0 0 1 0 11"/></svg>';
const ICON_SOUND_OFF = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor"/><path d="M16 9.5l5 5M21 9.5l-5 5"/></svg>';
function refreshSoundIcons() {
  const html = Sound.muted ? ICON_SOUND_OFF : ICON_SOUND_ON;
  $('btnSound').innerHTML = html; $('btnSoundTitle').innerHTML = html;
}
function toggleSound() {
  Sound.muted = !Sound.muted; save.muted = Sound.muted; writeSave(); refreshSoundIcons();
  Sound.init(); Sound.ui();
}

// Exit: inside the portal iframe we ask the portal to close us; as a standalone tab we try
// window.close() (browsers only allow it for script-opened tabs) and otherwise say goodbye.
function exitGame() {
  closeModal(true);
  if (inFrame) { try { window.parent.postMessage('closeModal', '*'); } catch (e) {} }
  try { window.close(); } catch (e) {}
  setTimeout(() => { if (!window.closed) setMode('bye'); }, 250);
}

function drawExitArt() {
  const c = $('exitArt'), g = c.getContext('2d'), t = state.t;
  g.setTransform(2, 0, 0, 2, 0, 0);
  g.clearRect(0, 0, 240, 130);
  g.fillStyle = 'rgba(0,0,0,.22)';
  g.beginPath(); g.ellipse(112, 118, 46, 7, 0, 0, TAU); g.fill();
  g.save();
  g.translate(112, 116 - Math.abs(Math.sin(t * 3)) * 4);
  g.scale(3.3, 3.3);
  drawCrab(g, 0, 0, 1, { walk: 0, moving: false, sq: 1 + Math.sin(t * 6) * 0.025, shell: true,
    blink: (t % 3.2) < 0.12 ? 0.1 : 1, push: false, t: t * 4 });
  g.restore();
  // speech bubble
  const bx = 190, by = 34 + Math.sin(t * 2.5) * 2;
  g.fillStyle = '#fff7ea'; rr(g, bx - 30, by - 17, 60, 32, 14); g.fill();
  g.beginPath(); g.moveTo(bx - 18, by + 12); g.lineTo(bx - 30, by + 26); g.lineTo(bx - 6, by + 14); g.fill();
  g.fillStyle = '#16213d'; g.font = '700 16px Fredoka, system-ui, sans-serif';
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('Stay?', bx, by);
}

function pause() { if (state.mode === 'play') { Sound.ui(); setMode('paused'); } }

const on = (id, fn) => $(id).addEventListener('click', e => { e.stopPropagation(); Sound.init(); fn(); });
on('btnPlay', () => { Sound.ui(); startLevel(Math.min(save.unlocked, LEVELS.length) - 1); });
on('btnLevels', () => { Sound.ui(); setMode('levels'); });
on('btnLevelsBack', () => { Sound.ui(); setMode('title'); });
on('btnPause', pause);
on('btnRestart', () => { if (state.mode === 'play') restartLevel(); });
on('btnSound', toggleSound);
on('btnSoundTitle', toggleSound);
on('btnExitTitle', () => openModal('mdlExit'));
on('btnExitYes', exitGame);
on('btnExitNo', () => closeModal());
on('btnHow', () => openModal('mdlHow'));
on('btnHowClose', () => closeModal());
on('btnByeMenu', () => { Sound.ui(); setMode('title'); });
// click on the dark backdrop of a popup = keep playing
for (const id of ['mdlExit', 'mdlHow']) $(id).addEventListener('click', e => { if (e.target.id === id) closeModal(); });
on('btnResume', () => { Sound.ui(); setMode('play'); });
on('btnPauseRestart', () => { Sound.ui(); restartLevel(); });
on('btnPauseLevels', () => { Sound.ui(); setMode('levels'); });
on('btnPauseMenu', () => { Sound.ui(); setMode('title'); });
on('btnWinLevels', () => { Sound.ui(); setMode('levels'); });
on('btnWinReplay', () => { Sound.ui(); restartLevel(); });
on('btnWinNext', () => { Sound.ui(); nextLevel(); });
on('btnEndLevels', () => { Sound.ui(); setMode('levels'); });
on('btnEndMenu', () => { Sound.ui(); setMode('title'); });
document.body.classList.toggle('touch', isTouch);

// Ripple on every button press (coordinates corrected for the scaled stage)
document.addEventListener('pointerdown', e => {
  const el = e.target.closest('.btn, .ibtn, .lvl');
  if (!el) return;
  const r = el.getBoundingClientRect(), k = el.offsetWidth / r.width;
  const size = Math.max(el.offsetWidth, el.offsetHeight) * 2.2;
  const s = document.createElement('span');
  s.className = 'ripple';
  s.style.width = s.style.height = size + 'px';
  s.style.left = ((e.clientX - r.left) * k - size / 2) + 'px';
  s.style.top = ((e.clientY - r.top) * k - size / 2) + 'px';
  el.appendChild(s);
  s.addEventListener('animationend', () => s.remove());
});

// ---------------------------------------------------------------------------
// Input
// ---------------------------------------------------------------------------
const KEYS = {
  ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right',
  ArrowUp: 'jump', KeyW: 'jump', Space: 'jump', ArrowDown: 'down', KeyS: 'down'
};
function press(k) {
  if (k === 'jump' && !input.jump) input.jumpPressed = true;
  if (k === 'down' && !input.down) input.downPressed = true;
  input[k] = true;
}
window.addEventListener('keydown', e => {
  Sound.init();
  const k = KEYS[e.code];
  if (k || e.code === 'Space') e.preventDefault();
  if (state.mode === 'loading') return;
  if (state.modal) {
    if (e.repeat) return;
    if (e.code === 'Escape' || e.code === 'KeyB') closeModal();
    else if (e.code === 'Enter' || e.code === 'Space') { const b = $(state.modal).querySelector('[data-primary]'); if (b) b.click(); }
    return;
  }
  if (state.mode === 'play') {
    if (k) { if (!e.repeat) press(k); else input[k] = true; return; }
    if (e.code === 'KeyR' && !e.repeat) restartLevel();
    else if (e.code === 'Escape' || e.code === 'KeyP' || e.code === 'KeyB') pause();
    return;
  }
  if (e.repeat) return;
  if (e.code === 'Escape' || e.code === 'KeyB') {
    if (state.mode === 'paused') setMode('play');
    else if (state.mode === 'levels') setMode('title');
    else if (state.mode === 'title') openModal('mdlExit');
    return;
  }
  if (e.code === 'Enter' || e.code === 'Space') {
    const scr = SCREENS[state.mode] && $(SCREENS[state.mode]);
    const btn = scr && scr.querySelector('[data-primary]');
    if (btn) btn.click();
  }
});
window.addEventListener('keyup', e => { const k = KEYS[e.code]; if (k) input[k] = false; });
window.addEventListener('blur', () => { clearInput(); pause(); });
document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
window.addEventListener('pointerdown', () => { Sound.init(); try { window.focus(); } catch (e) {} });

document.querySelectorAll('.tbtn').forEach(b => {
  const k = b.dataset.k;
  const down = e => { e.preventDefault(); Sound.init(); press(k); b.classList.add('on'); try { b.setPointerCapture(e.pointerId); } catch (_) {} };
  const up = e => { e.preventDefault(); input[k] = false; b.classList.remove('on'); };
  b.addEventListener('pointerdown', down);
  b.addEventListener('pointerup', up);
  b.addEventListener('pointercancel', up);
  b.addEventListener('lostpointercapture', up);
  b.addEventListener('contextmenu', e => e.preventDefault());
});

// ---------------------------------------------------------------------------
// Main loop
// ---------------------------------------------------------------------------
let last = performance.now(), acc = 0, shownTime = '';
// Test hook, only with #debug in the URL: lets a script step the simulation frame by frame.
const debug = { manual: false };
if (location.hash === '#debug') {
  window.__hh = {
    debug, input, state, startLevel, LEVELS, T,
    get player() { return player; }, get shell() { return shell; },
    step(n) { for (let i = 0; i < n && state.mode === 'play'; i++) physics(STEP); }
  };
}
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  state.t += dt;
  if (state.mode === 'play' && !debug.manual) {
    acc += dt;
    let n = 0;
    while (acc >= STEP && n < 12) { physics(STEP); acc -= STEP; n++; if (state.mode !== 'play') break; }
    if (n >= 12) acc = 0;
  } else acc = 0;
  if (state.mode === 'winning') { state.winT -= dt; if (state.winT <= 0) setMode('win'); }
  if (state.mode !== 'paused') updateParticles(dt);
  const tt = fmt(state.time);
  if (tt !== shownTime) { $('timer').textContent = tt; shownTime = tt; }
  render(state.mode === 'paused' ? 0 : dt);
  if (state.modal === 'mdlExit') drawExitArt();
  requestAnimationFrame(frame);
}

// ---------------------------------------------------------------------------
// CIEL Games loading scene
// ---------------------------------------------------------------------------
function runLoader() {
  const fill = $('ldFill'), pct = $('ldPct'), tip = $('ldTip');
  const tips = ['Polishing shells…', 'Filling tide pools…', 'Winding up springs…', 'Waking up the crab…', 'Almost there…'];
  const bub = $('ldBubbles');
  for (let i = 0; i < 16; i++) {
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

resize();
refreshSoundIcons();
loadLevel(Math.min(save.unlocked, LEVELS.length) - 1);
state.mode = 'loading';
state.modal = null;
runLoader();
requestAnimationFrame(frame);
if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { bgGrad = null; });
})();
