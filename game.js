/* ==========================================================================
   GRAVITY FLIP PAINTER – CIEL Games
   Splotch the paint-blob rolls through a tunnel on its own. Tap to flip
   gravity between the floor and the ceiling. Every tile it rolls over gets
   painted. Gaps and spikes are deadly. Collect 3 paint drops for 3 stars.
   ========================================================================== */
(function () {
  'use strict';
  const $ = (id) => document.getElementById(id);

  // ------------------------------------------------------------ constants
  const LH = 480;                 // logical height (width adapts to the screen)
  const TILE = 44;
  const EDGE = 34;                // outside strip above the ceiling / below the floor
  const TY0 = EDGE + TILE;        // inner ceiling surface
  const TY1 = LH - EDGE - TILE;   // inner floor surface
  const R = 18;                   // Splotch radius
  const GRAVITY = 2400;
  const FLIP_KICK = 140;          // small push away from the surface when flipping
  const COYOTE = 0.09;            // s: you can still flip just after rolling off an edge
  const FLIP_BUF = 0.13;          // s: a tap slightly before landing still counts
  const FIX_DT = 1 / 120;
  const SPIKE_H = 20;
  const LEVEL_COUNT = 30;
  const SAVE_KEY = 'gravityFlipPainter.v2';

  const PALETTES = [
    { paint: '#fb923c', deep: '#c2410c', sky: ['#bae6fd', '#e0e7ff'], name: 'Tangerine' },
    { paint: '#22c55e', deep: '#15803d', sky: ['#bbf7d0', '#e0f2fe'], name: 'Mint' },
    { paint: '#ec4899', deep: '#be185d', sky: ['#fbcfe8', '#ede9fe'], name: 'Bubblegum' },
    { paint: '#3b82f6', deep: '#1d4ed8', sky: ['#bfdbfe', '#e0e7ff'], name: 'Ocean' },
    { paint: '#a855f7', deep: '#7e22ce', sky: ['#e9d5ff', '#fae8ff'], name: 'Grape' },
    { paint: '#eab308', deep: '#a16207', sky: ['#fef08a', '#ffedd5'], name: 'Lemon' },
    { paint: '#14b8a6', deep: '#0f766e', sky: ['#99f6e4', '#e0f2fe'], name: 'Lagoon' },
    { paint: '#ef4444', deep: '#b91c1c', sky: ['#fecaca', '#ffe4e6'], name: 'Cherry' },
  ];

  // Each level gets its own look: theme (6) x paint colour (8), so no two levels in a row look alike.
  const THEMES = [
    { name: 'Meadow', out: ['#7dd3fc', '#c4b5fd'], inner: null, deco: 'clouds' },
    { name: 'Sunset', out: ['#fdba74', '#f472b6'], inner: ['#fed7aa', '#fce7f3'], deco: 'sun' },
    { name: 'Starry Night', out: ['#312e81', '#6d28d9'], inner: ['#c7d2fe', '#ddd6fe'], deco: 'stars' },
    { name: 'Candy', out: ['#f9a8d4', '#c4b5fd'], inner: ['#fce7f3', '#fdf4ff'], deco: 'dots' },
    { name: 'Ocean', out: ['#38bdf8', '#2563eb'], inner: ['#bae6fd', '#cffafe'], deco: 'bubbles' },
    { name: 'Space', out: ['#1e1b4b', '#4c1d95'], inner: ['#e0e7ff', '#f5d0fe'], deco: 'planets' },
  ];
  // New mechanics are introduced gradually (0-based level -> [title, explanation]).
  const INTROS = {
    2: ['Spikes!', "Don't land on the spikes."],
    4: ['Double gaps!', 'Flip away, then flip straight back!'],
    7: ['Spike strips!', 'Spikes on your side: flip over them.'],
    10: ['Tricky drops!', 'Some paint drops wait on the far side of a gap.'],
  };

  // ------------------------------------------------------------ save data
  const save = (() => {
    const blank = () => ({ unlocked: 1, stars: {}, paint: {}, coins: 0, sound: true, vibe: true });
    let d = blank();
    try { Object.assign(d, JSON.parse(localStorage.getItem(SAVE_KEY)) || {}); } catch (e) { /* private mode */ }
    return {
      get: () => d,
      write() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(d)); } catch (e) { /* ignore */ } },
      reset() { const s = d.sound, v = d.vibe; d = blank(); d.sound = s; d.vibe = v; this.write(); },
      addCoins(n) { d.coins = Math.max(0, (d.coins || 0) + n); this.write(); },
    };
  })();

  // ------------------------------------------------------------ sound (synth, no files)
  const Sound = (() => {
    let ctx = null;
    const ac = () => {
      if (!save.get().sound) return null;
      if (!ctx) { try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; } }
      if (ctx.state === 'suspended') ctx.resume();
      return ctx;
    };
    function tone(f, dur, type, vol, slide, delay) {
      const a = ac(); if (!a) return;
      const t = a.currentTime + (delay || 0), o = a.createOscillator(), g = a.createGain();
      o.type = type || 'sine'; o.frequency.setValueAtTime(f, t);
      if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + dur);
      g.gain.setValueAtTime(vol || 0.15, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      o.connect(g).connect(a.destination); o.start(t); o.stop(t + dur + 0.02);
    }
    return {
      warm: () => ac(),
      flip: () => { tone(420, 0.12, 'triangle', 0.12, 820); },
      land: () => tone(140, 0.08, 'sine', 0.22, 90),
      drop: () => [660, 880, 1175].forEach((f, i) => tone(f, 0.12, 'sine', 0.12, null, i * 0.06)),
      die: () => { tone(320, 0.35, 'sawtooth', 0.09, 60); tone(120, 0.3, 'sine', 0.2, 50); },
      win: () => [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 0.22, 'triangle', 0.12, null, i * 0.09)),
      click: () => tone(700, 0.06, 'triangle', 0.08, 1000),
      // each coin in a combo plays one semitone higher: the classic "rising reward" sound
      coin: (combo) => { const f = 880 * Math.pow(2, Math.min(combo, 24) / 12); tone(f, 0.09, 'square', 0.05); tone(f * 1.5, 0.12, 'sine', 0.06, null, 0.04); },
      gem: () => [1047, 1319, 1568, 2093].forEach((f, i) => tone(f, 0.12, 'triangle', 0.09, null, i * 0.05)),
      boost: () => tone(300, 0.35, 'sawtooth', 0.06, 1200),
      cheer: () => [784, 988, 1175, 1568].forEach((f, i) => tone(f, 0.16, 'triangle', 0.1, null, i * 0.07)),
    };
  })();
  const vibrate = (p) => { if (save.get().vibe && navigator.vibrate) try { navigator.vibrate(p); } catch (e) { /* ignore */ } };

  // ------------------------------------------------------------ level generation
  function mkRng(seed) {
    let s = (seed ^ 0xdeadbeef) >>> 0 || 1;
    return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return (s >>> 0) / 4294967296; };
  }
  const speedOf = (lvl) => 200 + lvl * 6.5;           // faster every single level: 200 → 389 px/s
  // Horizontal tiles travelled while crossing from one side to the other.
  const airTiles = (lvl) => speedOf(lvl) * Math.sqrt(2 * (TY1 - TY0 - 2 * R) / GRAVITY) / TILE;

  // One candidate layout for a level. `score` estimates how many flips it demands.
  function genVariant(lvl, variant) {
    const rng = mkRng(lvl * 987654321 + 777 + variant * 7919);
    let score = 0;
    const cols = [], coins = [];
    const push = (floor, ceil, floorSpike = false, ceilSpike = false) => cols.push({ floor, ceil, floorSpike, ceilSpike, drop: null });
    // Difficulty grows every level: more hazards, shorter safe stretches, longer gaps, more spikes and double gaps.
    const segs = Math.min(4 + Math.round(lvl * 0.75), 26) + Math.floor(variant / 6); // later variants add a hazard
    const spikes = lvl >= 2;
    const spikeChance = Math.min(0.12 + lvl * 0.014, 0.52);
    const air = Math.ceil(airTiles(lvl));
    const dropSegs = new Set([0, 1, 2].map((k) => Math.floor((segs * (k + 0.5)) / 3)));
    let side = 'floor';

    for (let i = 0; i < 8; i++) push(true, true);
    for (let seg = 0; seg < segs; seg++) {
      const opp = side === 'floor' ? 'ceil' : 'floor';
      const safeLen = Math.max(2, 6 - Math.floor(lvl / 5)) + Math.floor(rng() * 3);
      // safe stretch: spikes on the far side punish flipping too early
      for (let i = 0; i < safeLen; i++) {
        const spike = spikes && i > 0 && i < safeLen - 2 && rng() < spikeChance;
        push(true, true, spike && opp === 'floor', spike && opp === 'ceil');
        if (spike) score += 0.5;
        else if (i > 0 && rng() < 0.3) coins.push({ x: (cols.length - 0.5) * TILE, y: side === 'floor' ? TY1 - 24 : TY0 + 24, v: 1 });
      }
      // paint drop: normally on the current side right before the hazard; from level 11 sometimes
      // floating on the far side in the middle of the hazard ("tricky drop")
      const tricky = dropSegs.has(seg) && lvl >= 10 && rng() < 0.5;
      if (dropSegs.has(seg) && !tricky) cols[cols.length - 1].drop = side;
      const hazStart = cols.length;
      const hazLen = 2 + Math.floor(lvl / 6) + Math.floor(rng() * (2 + Math.min(5, Math.floor(lvl / 4))));
      const zig = lvl >= 4 && rng() < Math.min(0.6, 0.1 + lvl * 0.02);
      score += zig ? 2 : 1;
      if (zig) {
        // gap on this side (flip away), then a gap on the other side (flip back)
        const a = Math.max(hazLen, air + 2), b = 2 + Math.floor(rng() * 3);
        for (let i = 0; i < a; i++) push(side !== 'floor', side !== 'ceil');
        for (let i = 0; i < b; i++) push(opp !== 'floor', opp !== 'ceil');
        // side stays the same after a zig
      } else if (lvl >= 7 && rng() < Math.min(0.5, 0.18 + (lvl - 7) * 0.03)) {
        // spike strip: both surfaces exist, but your side is covered in spikes
        for (let i = 0; i < hazLen; i++) push(true, true, side === 'floor', side === 'ceil');
        score += 0.5;
        side = opp;
      } else {
        for (let i = 0; i < hazLen; i++) push(side !== 'floor', side !== 'ceil');
        side = opp;
      }
      if (tricky) {
        // the far side of the first hazard columns always has a safe surface
        cols[hazStart + Math.floor(Math.min(hazLen, cols.length - hazStart) / 2)].drop = opp;
        score += 0.5;
      }
    }
    for (let i = 0; i < 12; i++) push(true, true);
    let k = 0;
    cols.forEach((c) => { if (c.drop) c.dropIdx = k++; });
    const paintable = cols.reduce((a, c) => a + (c.floor ? 1 : 0) + (c.ceil ? 1 : 0), 0);
    const pal = PALETTES[lvl % PALETTES.length], theme = THEMES[lvl % THEMES.length];
    return { cols, coins, finish: cols.length - 7, paintable, pal, theme, name: pal.name + ' ' + theme.name, speed: speedOf(lvl), score };
  }

  // ------------------------------------------------------------ bonus stages (after every 3 levels)
  // A safe, fast, coin-packed run: no gaps or spikes, coin arcs that follow the exact flip path,
  // boost pads and gems. Pure reward between the hard levels.
  const BONUS_THEME = { name: 'Bonus', out: ['#f472b6', '#facc15'], inner: ['#fef9c3', '#fce7f3'], deco: 'rainbow' };
  const BONUS_PAL = { paint: '#f59e0b', deep: '#b45309', sky: ['#fef9c3', '#fce7f3'], name: 'Gold' };
  const BOOST_TIME = 0.8, BOOST_MUL = 1.5;
  const REVIVE_COST = 100; // coins to continue after a crash (a bonus stage pays roughly 300-400)
  // Path of a flip from one surface to the other at a given speed (same physics as the game).
  function flightPath(speed, fromGrav) {
    let y = fromGrav === 1 ? TY1 - R : TY0 + R, x = 0;
    const grav = -fromGrav; let vy = FLIP_KICK * grav;
    const pts = [];
    for (let t = 0; t < 2; t += FIX_DT) {
      vy += GRAVITY * grav * FIX_DT; x += speed * FIX_DT; y += vy * FIX_DT;
      if (grav === -1 ? y - R <= TY0 : y + R >= TY1) break;
      pts.push({ dx: x, y });
    }
    return pts;
  }
  function genBonus(k) {
    const rng = mkRng(4242 + k * 131), speed = Math.min(360, 290 + k * 8), n = 150;
    const cols = [], coins = [];
    for (let i = 0; i < n; i++) cols.push({ floor: true, ceil: true, floorSpike: false, ceilSpike: false, drop: null });
    const surfY = (g) => (g === 1 ? TY1 - 24 : TY0 + 24);
    let ci = 8, side = 1;
    while (ci < n - 26) {
      const boost = rng() < 0.4;
      const run = (boost ? 7 : 4) + Math.floor(rng() * 4);
      if (boost) cols[ci].boost = side;
      for (let i = 0; i < run; i++) coins.push({ x: (ci + i + 0.5) * TILE, y: surfY(side), v: 1 });
      ci += run + (boost ? 5 : 0); // after a boost, a plain stretch lets the speed settle before the arc
      cols[ci].flipMark = side;   // glowing ring: flip here to ride the coin arc
      const pts = flightPath(speed, side), startX = (ci + 0.5) * TILE;
      let lastX = -99;
      const gemAt = rng() < 0.6 ? Math.floor(pts.length / 2) : -1;
      pts.forEach((pt, i) => {
        if (i === gemAt) { coins.push({ x: startX + pt.dx, y: pt.y, v: 5, gem: true }); lastX = pt.dx; return; }
        if (pt.dx - lastX >= 34) { lastX = pt.dx; coins.push({ x: startX + pt.dx, y: pt.y, v: 1 }); }
      });
      ci = Math.ceil((startX + pts[pts.length - 1].dx) / TILE) + 1;
      side = -side;
    }
    return { cols, coins, finish: n - 7, paintable: n * 2, pal: BONUS_PAL, theme: BONUS_THEME, name: 'Bonus Stage', speed, bonus: true, score: 0 };
  }
  // Every level must demand more than the one before: try a few variants, keep the first that does.
  function genLevel(lvl, minScore) {
    let best = null;
    for (let v = 0; v < 48; v++) {
      const L = genVariant(lvl, v);
      if (L.score > minScore) return L;
      if (!best || L.score > best.score) best = L;
    }
    return best;
  }
  const LEVELS = [];
  for (let i = 0; i < LEVEL_COUNT; i++) LEVELS.push(genLevel(i, i ? LEVELS[i - 1].score : -1));

  // ------------------------------------------------------------ canvas sizing
  const canvas = $('game'), stage = $('stage');
  const gameCtx = canvas.getContext('2d');
  let X = gameCtx; // active drawing context (the menu hero art borrows the same renderers)
  let LW = 800, scale = 1, dpr = 1;
  function resize() {
    const r = stage.getBoundingClientRect();
    if (r.width < 10 || r.height < 10) return;
    LW = Math.max(440, Math.min(1000, Math.round(LH * (r.width / r.height)))); // narrower world on portrait phones = bigger play area
    scale = Math.min(r.width / LW, r.height / LH);
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.style.width = Math.floor(LW * scale) + 'px';
    canvas.style.height = Math.floor(LH * scale) + 'px';
    canvas.width = Math.round(LW * scale * dpr);
    canvas.height = Math.round(LH * scale * dpr);
  }

  // Splotch sits further left on narrow screens so you still see far enough ahead.
  const camAnchor = () => (LW < 640 ? 0.2 : 0.3);

  // ------------------------------------------------------------ game state
  const G = {
    scene: 'menu',  // menu | ready | playing | dead | win | paused
    lvl: 0, L: null, ball: null, camX: 0, flipBuf: 0, acc: 0,
    paintF: null, paintC: null, drops: [false, false, false], revived: false, lastSafe: null,
    parts: [], time: 0, deathCause: '',
    coins: null, coinsGot: 0, combo: 0, comboT: 0, bestCombo: 0, floats: [], speedMul: 1, boostT: 0,
    nextAfterBonus: null, bonusIdx: 0,
  };
  const levelIsBonusAfter = (n) => n % 3 === 0 && n < LEVEL_COUNT; // after levels 3, 6, 9 ... (1-based)
  const painted = () => G.paintF.reduce((a, v) => a + (v ? 1 : 0), 0) + G.paintC.reduce((a, v) => a + (v ? 1 : 0), 0);
  const paintPct = () => (G.L.paintable ? Math.round((painted() / G.L.paintable) * 100) : 0);

  function startLevel(lvl) {
    G.lvl = Math.max(0, Math.min(LEVEL_COUNT - 1, lvl));
    G.L = LEVELS[G.lvl];
    G.paintF = new Array(G.L.cols.length).fill(0);
    G.paintC = new Array(G.L.cols.length).fill(0);
    G.drops = [false, false, false];
    G.parts = []; G.flipBuf = 0; G.acc = 0; G.revived = false;
    resetRun();
    G.ball = newBall(3.5 * TILE, 1);
    G.lastSafe = { x: G.ball.x, grav: 1 };
    G.camX = G.ball.x - LW * camAnchor();
    G.scene = 'ready';
    $('hudLevel').textContent = 'Level ' + (G.lvl + 1);
    $('hudDrops').classList.remove('hidden');
    renderDrops(); updatePaintBar();
    clearTimeout(G.hintTimer); // a hint timer from the previous attempt must not hide this start card
    const intro = INTROS[G.lvl];
    $('hintLevel').textContent = `Level ${G.lvl + 1} · ${G.L.name}`;
    $('hintNew').classList.toggle('hidden', !intro);
    if (intro) $('hintNew').textContent = 'NEW: ' + intro[0];
    $('hintMain').textContent = 'Tap to start!';
    $('hintSub').textContent = intro ? intro[1] : 'or press Space';
    $('tapHint').classList.remove('gone');
    hideModals(); showScreen('game');
  }
  function resetRun() {
    G.coins = G.L.coins.map((c) => ({ ...c, got: false }));
    G.coinsGot = 0; G.combo = 0; G.comboT = 0; G.bestCombo = 0; G.floats = []; G.speedMul = 1; G.boostT = 0;
    updateCoinHud();
  }

  function startBonus(k, nextLvl) {
    G.L = genBonus(k); G.bonusIdx = k; G.nextAfterBonus = nextLvl;
    G.paintF = new Array(G.L.cols.length).fill(0);
    G.paintC = new Array(G.L.cols.length).fill(0);
    G.drops = [false, false, false];
    G.parts = []; G.flipBuf = 0; G.acc = 0; G.revived = true;
    resetRun();
    G.ball = newBall(3.5 * TILE, 1);
    G.lastSafe = { x: G.ball.x, grav: 1 };
    G.camX = G.ball.x - LW * camAnchor();
    G.scene = 'ready';
    $('hudLevel').textContent = '★ BONUS ★';
    $('hudDrops').classList.add('hidden');
    updatePaintBar();
    clearTimeout(G.hintTimer);
    $('hintLevel').textContent = 'BONUS STAGE';
    $('hintNew').classList.remove('hidden'); $('hintNew').textContent = 'BONUS! 🎁';
    $('hintMain').textContent = 'Tap to start!';
    $('hintSub').textContent = "Flip at the glowing rings to grab whole coin arcs. You can't fall here!";
    $('tapHint').classList.remove('gone');
    hideModals(); showScreen('game');
  }

  function newBall(x, grav) {
    return { x, y: grav === 1 ? TY1 - R : TY0 + R, vy: 0, grav, onGnd: true, coyote: COYOTE, sqx: 1, sqy: 1, svx: 0, svy: 0, roll: 0, blink: 2 };
  }

  function tryFlip() {
    const b = G.ball;
    if (b.onGnd || b.coyote > 0) {
      b.grav *= -1; b.vy = FLIP_KICK * b.grav; b.onGnd = false; b.coyote = 0; G.flipBuf = 0;
      b.sqx = 0.72; b.sqy = 1.36;
      Sound.flip(); vibrate(8);
      emit(b.x, b.grav === -1 ? TY1 : TY0, G.L.pal.paint, 6, 90);
    } else {
      G.flipBuf = FLIP_BUF;
    }
  }

  function tap() {
    Sound.warm();
    if (G.scene === 'ready') {
      G.scene = 'playing';
      if (G.lvl < 2) { $('hintMain').textContent = 'Tap to flip gravity!'; $('hintNew').classList.add('hidden'); clearTimeout(G.hintTimer); G.hintTimer = setTimeout(() => $('tapHint').classList.add('gone'), 1600); }
      else $('tapHint').classList.add('gone');
      return;
    }
    if (G.scene === 'playing') tryFlip();
  }

  // ------------------------------------------------------------ physics
  function step(dt) {
    const b = G.ball, L = G.L;
    G.flipBuf = Math.max(0, G.flipBuf - dt);
    if (!b.onGnd) b.coyote = Math.max(0, b.coyote - dt);
    const prevY = b.y;
    b.vy += GRAVITY * b.grav * dt;
    G.boostT = Math.max(0, G.boostT - dt);
    G.speedMul += ((G.boostT > 0 ? BOOST_MUL : 1) - G.speedMul) * (1 - Math.exp(-12 * dt));
    const speed = L.speed * G.speedMul;
    b.x += speed * dt;
    b.y += b.vy * dt;
    b.roll += ((speed * dt) / R) * b.grav;     // rolls clockwise on the floor, the other way on the ceiling
    if (G.comboT > 0) { G.comboT -= dt; if (G.comboT <= 0) G.combo = 0; }

    const ci = Math.floor(b.x / TILE);
    const col = L.cols[ci];
    const wasGnd = b.onGnd;
    b.onGnd = false;

    if (col) {
      if (b.grav === 1) {
        if (b.y + R >= TY1) {
          if (col.floor && prevY + R <= TY1 + 6) land(ci, col, TY1 - R, wasGnd);
          else if (col.floor) return die('wall');        // slid into the side of a tile from inside a gap
        }
      } else if (b.y - R <= TY0) {
        if (col.ceil && prevY - R >= TY0 - 6) land(ci, col, TY0 + R, wasGnd);
        else if (col.ceil) return die('wall');
      }
    }
    if (!b.onGnd && wasGnd) b.coyote = COYOTE;            // just rolled off an edge

    // spikes: any spike column overlapping the ball's position
    for (let k = ci - 1; k <= ci + 1; k++) {
      const c = L.cols[k]; if (!c) continue;
      const cx = (k + 0.5) * TILE;
      if (Math.abs(b.x - cx) > TILE * 0.42) continue;
      if (c.floorSpike && b.y + R > TY1 - SPIKE_H * 0.7) return die('spike');
      if (c.ceilSpike && b.y - R < TY0 + SPIKE_H * 0.7) return die('spike');
    }

    // fell out through a gap
    if (b.y > LH + 60 || b.y < -60) return die('gap');

    // paint drops
    L.cols.forEach((c, k) => {
      if (!c.drop || G.drops[c.dropIdx]) return;
      const dx = b.x - (k + 0.5) * TILE, dy = b.y - (c.drop === 'floor' ? TY1 - 22 : TY0 + 22);
      if (dx * dx + dy * dy < (R + 16) * (R + 16)) {
        G.drops[c.dropIdx] = true;
        emit((k + 0.5) * TILE, b.y, '#facc15', 18, 160);
        Sound.drop(); vibrate(15); renderDrops(c.dropIdx);
      }
    });

    // coins & gems
    for (const c of G.coins) {
      if (c.got || Math.abs(c.x - b.x) > 40) continue;
      const dx = c.x - b.x, dy = c.y - b.y, rr2 = R + (c.gem ? 16 : 12);
      if (dx * dx + dy * dy < rr2 * rr2) collectCoin(c);
    }

    // squash & stretch spring (critically damped, stable at any dt)
    const springK = 220;
    const dampC = 22;
    b.svx += (-springK * (b.sqx - 1) - dampC * b.svx) * dt;
    b.svy += (-springK * (b.sqy - 1) - dampC * b.svy) * dt;
    b.sqx = clamp(b.sqx + b.svx * dt, 0.72, 1.35);
    b.sqy = clamp(b.sqy + b.svy * dt, 0.72, 1.35);

    if (ci >= L.finish) return winLevel();
    G.camX = b.x - LW * camAnchor();
  }

  function land(ci, col, y, wasGnd) {
    const b = G.ball;
    b.y = y; b.vy = 0; b.onGnd = true; b.coyote = COYOTE;
    if (!wasGnd) {
      b.sqx = 1.3; b.sqy = 0.72;
      emit(b.x, b.grav === 1 ? TY1 : TY0, G.L.pal.paint, 10, 120);
      Sound.land();
      if (G.flipBuf > 0) { tryFlip(); return; }
    }
    const arr = b.grav === 1 ? G.paintF : G.paintC;
    if (!arr[ci]) { arr[ci] = G.time; updatePaintBar(); }
    if (col.boost === b.grav && G.boostT <= 0) {
      G.boostT = BOOST_TIME; Sound.boost(); vibrate(20);
      addFloat(b.x + 30, b.y - b.grav * 30, 'BOOST!', '#f97316', 18);
    }
    if (col.floor && col.ceil && !col.floorSpike && !col.ceilSpike) G.lastSafe = { x: (ci + 0.5) * TILE, grav: b.grav };
    if (Math.random() < 0.25) G.parts.push({ x: b.x - R * 0.6, y: b.grav === 1 ? TY1 - 2 : TY0 + 2, vx: -30, vy: 0, r: 2 + Math.random() * 3, life: 0.6, color: G.L.pal.paint, g: 0 });
  }

  function collectCoin(c) {
    c.got = true;
    G.combo = G.comboT > 0 ? G.combo + 1 : 1;
    G.comboT = 0.7;
    G.bestCombo = Math.max(G.bestCombo, G.combo);
    const mult = 1 + Math.floor(G.combo / 10);       // every 10 in a row = one more coin per pickup
    const gain = c.v * mult;
    G.coinsGot += gain;
    if (c.gem) { Sound.gem(); vibrate(25); emit(c.x, c.y, '#22d3ee', 16, 180); }
    else { Sound.coin(G.combo); emit(c.x, c.y, '#facc15', 6, 110); }
    addFloat(c.x, c.y - 14, '+' + gain, c.gem ? '#0891b2' : '#a16207', c.gem ? 22 : 15);
    if (G.combo > 0 && G.combo % 10 === 0) {
      addFloat(G.ball.x + 40, (TY0 + TY1) / 2, G.combo >= 30 ? 'INCREDIBLE!' : G.combo >= 20 ? 'AMAZING!' : 'AWESOME!', '#ec4899', 30);
      Sound.cheer(); vibrate([15, 20, 15]); confettiBurst(c.x, c.y);
    }
    updateCoinHud(true);
  }
  function addFloat(x, y, text, color, size) { G.floats.push({ x, y, text, color, size, life: 0.9 }); }
  function updateCoinHud(bump) {
    $('hudCoinNum').textContent = G.coinsGot;
    if (bump) { const el = $('hudCoins'); el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); }
    if (G.L && G.L.bonus) updatePaintBar();
  }

  const DEATH_TEXT = { gap: 'Splotch fell into a gap!', spike: 'Ouch! Splotch hit the spikes.', wall: 'Splat! Splotch hit a wall.' };
  function die(cause) {
    if (G.scene !== 'playing') return;
    G.scene = 'dead'; G.deathCause = cause;
    const b = G.ball;
    emit(b.x, clamp(b.y, TY0, TY1), G.L.pal.paint, 26, 220);
    emit(b.x, clamp(b.y, TY0, TY1), '#ffffff', 10, 150);
    Sound.die(); vibrate([40, 30, 60]);
    $('failText').textContent = DEATH_TEXT[cause] || DEATH_TEXT.gap;
    $('failTitle').textContent = cause === 'spike' ? 'OUCH!' : 'SPLAT!';
    $('btnReviveAd').classList.toggle('hidden', G.revived);
    $('btnReviveCoins').classList.toggle('hidden', G.revived);
    $('btnReviveCoins').disabled = (save.get().coins || 0) < REVIVE_COST;
    setTimeout(() => { if (G.scene === 'dead') openModal('modalFail'); }, 700);
  }

  function revive() {
    G.revived = true;
    G.ball = newBall(G.lastSafe.x, G.lastSafe.grav);
    G.camX = G.ball.x - LW * camAnchor(); G.flipBuf = 0; G.acc = 0;
    G.scene = 'ready';
    clearTimeout(G.hintTimer);
    $('hintMain').textContent = 'Tap to continue!'; $('hintNew').classList.add('hidden'); $('hintSub').textContent = 'or press Space';
    $('tapHint').classList.remove('gone');
    closeModal('modalFail');
  }

  function winLevel() {
    if (G.scene !== 'playing') return;
    G.scene = 'win';
    if (G.L.bonus) return bonusComplete();
    const stars = G.drops.filter(Boolean).length, pct = paintPct(), d = save.get(), n = G.lvl + 1;
    d.stars[n] = Math.max(d.stars[n] || 0, stars);
    d.paint[n] = Math.max(d.paint[n] || 0, pct);
    d.unlocked = Math.max(d.unlocked, Math.min(LEVEL_COUNT, n + 1));
    save.write();
    save.addCoins(G.coinsGot);
    confetti(); Sound.win(); vibrate([20, 40, 60]);
    setTimeout(() => {
      [...$('winStars').children].forEach((el, i) => el.classList.toggle('on', i < stars));
      $('winText').textContent = `You painted ${pct}% of the tunnel` + (stars < 3 ? ` and found ${stars}/3 paint drops.` : ' and found every paint drop!') + (G.coinsGot ? `  +${G.coinsGot} 🪙` : '');
      $('btnNext').textContent = G.lvl >= LEVEL_COUNT - 1 ? 'All done! 🏆' : levelIsBonusAfter(n) ? 'Bonus Stage! 🎁' : 'Next Level ➜';
      openModal('modalWin');
    }, 650);
  }

  function bonusComplete() {
    confetti(); Sound.win(); vibrate([20, 40, 60]);
    save.addCoins(G.coinsGot);
    G.bonusDoubled = false;
    setTimeout(() => {
      $('bonusText').textContent = `coins collected · best combo ×${G.bestCombo}`;
      $('btnBonusDouble').classList.toggle('hidden', G.coinsGot === 0);
      openModal('modalBonus');
      countUp($('bonusCount'), 0, G.coinsGot, 900);
    }, 600);
  }
  // Animated number count-up with a tick sound: the payoff moment.
  function countUp(el, from, to, ms) {
    const t0 = performance.now(); let lastTick = from;
    const tick = (now) => {
      const k = Math.min(1, (now - t0) / ms), v = Math.round(from + (to - from) * (1 - Math.pow(1 - k, 3)));
      el.textContent = v;
      if (v - lastTick >= Math.max(1, Math.floor((to - from) / 12))) { lastTick = v; Sound.coin(Math.min(24, Math.floor(k * 18))); }
      if (k < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  // ------------------------------------------------------------ particles
  function emit(x, y, color, n, sp) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, s = sp * (0.35 + Math.random() * 0.8);
      G.parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, r: 2 + Math.random() * 4, life: 0.5 + Math.random() * 0.5, color, g: 500 });
    }
  }
  function confetti() {
    const cols = ['#facc15', '#f97316', '#22c55e', '#3b82f6', '#ec4899', '#8b5cf6'];
    for (let i = 0; i < 80; i++) {
      G.parts.push({ x: G.camX + LW * (0.2 + Math.random() * 0.6), y: TY0 + 10, vx: (Math.random() - 0.5) * 300, vy: Math.random() * 200,
        r: 3 + Math.random() * 4, life: 1.4 + Math.random(), color: cols[i % cols.length], g: 380, conf: true, rot: Math.random() * 6 });
    }
  }
  function confettiBurst(x, y) {
    const cols = ['#facc15', '#f97316', '#22c55e', '#3b82f6', '#ec4899', '#8b5cf6'];
    for (let i = 0; i < 24; i++) G.parts.push({ x, y, vx: (Math.random() - 0.5) * 360, vy: -Math.random() * 300, r: 3 + Math.random() * 3, life: 1, color: cols[i % 6], g: 500, conf: true, rot: Math.random() * 6 });
  }
  function updateParts(dt) {
    for (let i = G.floats.length - 1; i >= 0; i--) { const f = G.floats[i]; f.life -= dt; f.y -= 40 * dt; if (f.life <= 0) G.floats.splice(i, 1); }
    for (let i = G.parts.length - 1; i >= 0; i--) {
      const p = G.parts[i];
      p.life -= dt; if (p.life <= 0) { G.parts.splice(i, 1); continue; }
      p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; if (p.conf) p.rot += dt * 8;
    }
  }

  // ------------------------------------------------------------ drawing
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  function rr(x, y, w, h, r) {
    X.beginPath(); X.moveTo(x + r, y); X.arcTo(x + w, y, x + w, y + h, r); X.arcTo(x + w, y + h, x, y + h, r);
    X.arcTo(x, y + h, x, y, r); X.arcTo(x, y, x + w, y, r); X.closePath();
  }
  const CLOUDS = Array.from({ length: 9 }, (_, i) => ({ x: i * 260 + Math.random() * 120, y: 6 + Math.random() * 18, s: 0.7 + Math.random() * 0.6 }));
  const BOKEH = Array.from({ length: 16 }, (_, i) => ({ x: i * 170 + Math.random() * 90, y: TY0 + 30 + Math.random() * (TY1 - TY0 - 60), r: 18 + Math.random() * 40 }));

  function drawWorld(now) {
    const L = G.L, pal = L.pal, th = L.theme;
    X.setTransform(scale * dpr, 0, 0, scale * dpr, 0, 0);
    // outside sky (visible above/below the tunnel and through gaps)
    const sky = X.createLinearGradient(0, 0, 0, LH);
    sky.addColorStop(0, th.out[0]); sky.addColorStop(1, th.out[1]);
    X.fillStyle = sky; X.fillRect(0, 0, LW, LH);
    // tunnel interior
    const inner = X.createLinearGradient(0, TY0, 0, TY1);
    const ic = th.inner || pal.sky;
    inner.addColorStop(0, ic[0]); inner.addColorStop(1, ic[1]);
    X.fillStyle = inner; X.fillRect(0, TY0, LW, TY1 - TY0);
    drawDeco(th.deco, now);

    const c0 = Math.max(0, Math.floor(G.camX / TILE) - 1), c1 = Math.min(L.cols.length, Math.ceil((G.camX + LW) / TILE) + 1);
    for (let ci = c0; ci < c1; ci++) {
      const col = L.cols[ci], sx = ci * TILE - G.camX;
      tile(sx, TY1, col.floor, G.paintF[ci], false);
      tile(sx, EDGE, col.ceil, G.paintC[ci], true);
      if (col.floorSpike) spikes(sx, TY1, false);
      if (col.ceilSpike) spikes(sx, TY0, true);
      if (col.drop && !G.drops[col.dropIdx]) dropIcon(sx + TILE / 2, col.drop === 'floor' ? TY1 - 22 : TY0 + 22, now, col.dropIdx);
      if (col.boost) boostPad(sx, col.boost, now);
      if (col.flipMark) flipRing(sx + TILE / 2, col.flipMark, now);
    }
    finishGate(L.finish * TILE - G.camX);

    // coins & gems (spinning + bobbing)
    for (const c of G.coins) {
      const x = c.x - G.camX;
      if (c.got || x < -30 || x > LW + 30) continue;
      coinIcon(x, c.y + Math.sin(now / 260 + c.x * 0.05) * 3, now + c.x * 4, c.gem);
    }
    // particles
    for (const p of G.parts) {
      X.globalAlpha = clamp(p.life * 2, 0, 1); X.fillStyle = p.color;
      if (p.conf) { X.save(); X.translate(p.x - G.camX, p.y); X.rotate(p.rot); X.fillRect(-p.r, -p.r / 2, p.r * 2, p.r); X.restore(); }
      else { X.beginPath(); X.arc(p.x - G.camX, p.y, p.r, 0, Math.PI * 2); X.fill(); }
    }
    X.globalAlpha = 1;
    // speed lines while boosting
    if (G.speedMul > 1.05) {
      X.strokeStyle = 'rgba(255,255,255,0.8)'; X.lineWidth = 3; X.lineCap = 'round';
      for (let i = 0; i < 6; i++) {
        const y = G.ball.y + (i - 2.5) * 9, len = 30 + ((now / 7 + i * 37) % 40);
        X.globalAlpha = (G.speedMul - 1) * 1.6;
        X.beginPath(); X.moveTo(G.ball.x - G.camX - R - 6, y); X.lineTo(G.ball.x - G.camX - R - 6 - len, y); X.stroke();
      }
      X.globalAlpha = 1;
    }
    if (G.scene !== 'dead') splotch(G.ball.x - G.camX, G.ball.y, G.ball, pal, now);
    // floating "+1", "BOOST!", "AWESOME!" texts
    X.textAlign = 'center'; X.textBaseline = 'middle';
    for (const f of G.floats) {
      X.globalAlpha = clamp(f.life * 2, 0, 1);
      X.font = `700 ${f.size}px Fredoka, sans-serif`;
      X.lineWidth = 4; X.strokeStyle = '#ffffff'; X.strokeText(f.text, f.x - G.camX, f.y);
      X.fillStyle = f.color; X.fillText(f.text, f.x - G.camX, f.y);
    }
    X.globalAlpha = 1;
    // combo meter
    if (G.combo >= 3) {
      const pulse = 1 + Math.max(0, G.comboT - 0.5) * 0.6;
      X.save(); X.translate(LW / 2, TY0 + 34); X.scale(pulse, pulse);
      X.font = '700 24px Fredoka, sans-serif';
      X.lineWidth = 6; X.strokeStyle = '#ffffff'; X.strokeText(`COMBO ×${G.combo}`, 0, 0);
      X.fillStyle = G.combo >= 20 ? '#db2777' : G.combo >= 10 ? '#7c3aed' : '#ea580c'; X.fillText(`COMBO ×${G.combo}`, 0, 0);
      X.restore();
    }
  }

  const wrap = (x, span) => ((x % span) + span) % span - 120;
  // Theme decoration behind the tiles. Cheap shapes only, parallax with the camera.
  function drawDeco(kind, now) {
    if (kind === 'clouds') {
      for (const o of BOKEH) { X.fillStyle = 'rgba(255,255,255,0.35)'; X.beginPath(); X.arc(wrap(o.x - G.camX * 0.25, 2720), o.y, o.r, 0, Math.PI * 2); X.fill(); }
      for (const c of CLOUDS) { const x = wrap(c.x - G.camX * 0.15, 2340); cloud(x, c.y, c.s); cloud(x + 90, LH - EDGE + 4 + c.y * 0.5, c.s * 0.8); cloud(x + 40, TY0 + 50 + c.y * 3, c.s * 1.3); }
    } else if (kind === 'sun') {
      const sx = LW * 0.72 - ((G.camX * 0.02) % 60);
      X.fillStyle = 'rgba(255,237,213,0.9)'; X.beginPath(); X.arc(sx, TY1 - 20, 90, Math.PI, 0); X.fill();
      X.fillStyle = 'rgba(251,146,60,0.25)';
      for (let i = 0; i < 4; i++) X.fillRect(0, TY1 - 30 - i * 26, LW, 6);
      for (const c of CLOUDS) cloud(wrap(c.x - G.camX * 0.12, 2340), c.y + 2, c.s * 0.9);
    } else if (kind === 'stars' || kind === 'planets') {
      for (const o of BOKEH) {
        const tw = 0.5 + 0.5 * Math.sin(now / 400 + o.r);
        X.fillStyle = `rgba(255,255,255,${0.35 + tw * 0.6})`;
        X.beginPath(); X.arc(wrap(o.x - G.camX * 0.1, 2720), (o.r * 7) % EDGE, 1.6, 0, Math.PI * 2); X.fill();
        X.fillStyle = kind === 'stars' ? `rgba(99,102,241,${0.18 + tw * 0.2})` : 'rgba(168,85,247,0.15)';
        X.beginPath(); X.arc(wrap(o.x + 60 - G.camX * 0.2, 2720), o.y, 2.5 + (o.r % 3), 0, Math.PI * 2); X.fill();
      }
      if (kind === 'planets') {
        const px = wrap(900 - G.camX * 0.08, 1800);
        X.fillStyle = 'rgba(244,114,182,0.45)'; X.beginPath(); X.arc(px, TY0 + 110, 46, 0, Math.PI * 2); X.fill();
        X.strokeStyle = 'rgba(124,58,237,0.45)'; X.lineWidth = 6; X.beginPath(); X.ellipse(px, TY0 + 110, 78, 16, -0.3, 0, Math.PI * 2); X.stroke();
        const qx = wrap(1500 - G.camX * 0.12, 1800);
        X.fillStyle = 'rgba(56,189,248,0.4)'; X.beginPath(); X.arc(qx, TY1 - 80, 26, 0, Math.PI * 2); X.fill();
      }
    } else if (kind === 'dots') {
      for (let gx = 0; gx < LW + 80; gx += 56) for (let gy = TY0 + 20; gy < TY1; gy += 56) {
        X.fillStyle = (gx / 56 + gy / 56) % 2 < 1 ? 'rgba(236,72,153,0.16)' : 'rgba(255,255,255,0.6)';
        X.beginPath(); X.arc(gx - ((G.camX * 0.3) % 56), gy, 9, 0, Math.PI * 2); X.fill();
      }
    } else if (kind === 'rainbow') {
      const cx = wrap(700 - G.camX * 0.1, 1400), cy = TY1 + 40;
      ['#f87171', '#fb923c', '#facc15', '#4ade80', '#60a5fa', '#a78bfa'].forEach((c, i) => {
        X.strokeStyle = c; X.globalAlpha = 0.35; X.lineWidth = 14;
        X.beginPath(); X.arc(cx, cy, 240 - i * 14, Math.PI, 0); X.stroke();
      });
      X.globalAlpha = 1;
      for (const o of BOKEH) {
        const tw = 0.5 + 0.5 * Math.sin(now / 250 + o.r);
        X.fillStyle = `rgba(255,255,255,${0.4 + tw * 0.6})`;
        const x = wrap(o.x - G.camX * 0.3, 2720), y = o.y;
        X.beginPath(); X.moveTo(x, y - 6); X.lineTo(x + 2, y - 2); X.lineTo(x + 6, y); X.lineTo(x + 2, y + 2); X.lineTo(x, y + 6); X.lineTo(x - 2, y + 2); X.lineTo(x - 6, y); X.lineTo(x - 2, y - 2); X.closePath(); X.fill();
      }
    } else if (kind === 'bubbles') {
      for (const o of BOKEH) {
        const y = TY1 - ((now / 40 + o.r * 37) % (TY1 - TY0));
        X.strokeStyle = 'rgba(255,255,255,0.7)'; X.lineWidth = 2;
        X.beginPath(); X.arc(wrap(o.x - G.camX * 0.3, 2720), y, 4 + (o.r % 10), 0, Math.PI * 2); X.stroke();
      }
      X.fillStyle = 'rgba(14,165,233,0.25)';
      for (let i = 0; i < 3; i++) { X.beginPath(); X.ellipse(wrap(i * 600 - G.camX * 0.2, 1800), TY1 - 6, 120, 30, 0, Math.PI, 0); X.fill(); }
    }
  }

  function coinIcon(x, y, t, gem) {
    X.save(); X.translate(x, y);
    if (gem) {
      const s = 1 + Math.sin(t / 150) * 0.08;
      X.scale(s, s);
      X.fillStyle = 'rgba(34,211,238,0.3)'; X.beginPath(); X.arc(0, 0, 18, 0, Math.PI * 2); X.fill();
      X.fillStyle = '#22d3ee'; X.strokeStyle = '#0e7490'; X.lineWidth = 2;
      X.beginPath(); X.moveTo(0, -14); X.lineTo(12, -3); X.lineTo(0, 14); X.lineTo(-12, -3); X.closePath(); X.fill(); X.stroke();
      X.fillStyle = 'rgba(255,255,255,0.75)'; X.beginPath(); X.moveTo(-6, -4); X.lineTo(0, -10); X.lineTo(3, -4); X.closePath(); X.fill();
    } else {
      const w = Math.max(0.18, Math.abs(Math.cos(t / 180)));   // spinning
      X.scale(w, 1);
      X.fillStyle = '#a16207'; X.beginPath(); X.arc(0, 1.5, 10, 0, Math.PI * 2); X.fill();
      X.fillStyle = '#facc15'; X.beginPath(); X.arc(0, 0, 10, 0, Math.PI * 2); X.fill();
      X.fillStyle = '#fde68a'; X.beginPath(); X.arc(0, 0, 6, 0, Math.PI * 2); X.fill();
      X.fillStyle = '#ca8a04'; X.fillRect(-1.5, -4, 3, 8);
    }
    X.restore();
  }
  function boostPad(sx, side, now) {
    const surf = side === 1 ? TY1 : TY0, d = side === 1 ? -1 : 1;
    X.fillStyle = '#f97316'; rr(sx + 3, side === 1 ? surf - 6 : surf, TILE - 6, 6, 3); X.fill();
    const glow = 0.5 + 0.5 * Math.sin(now / 90);
    X.strokeStyle = `rgba(255,255,255,${0.6 + glow * 0.4})`; X.lineWidth = 3; X.lineJoin = 'round';
    for (let i = 0; i < 2; i++) {
      const x0 = sx + 10 + i * 12, y0 = surf + d * 14;
      X.beginPath(); X.moveTo(x0, y0 - 6); X.lineTo(x0 + 7, y0); X.lineTo(x0, y0 + 6); X.stroke();
    }
  }
  function flipRing(x, side, now) {
    const y = side === 1 ? TY1 - R : TY0 + R, k = (now % 900) / 900;
    X.strokeStyle = `rgba(250,204,21,${1 - k})`; X.lineWidth = 3;
    X.beginPath(); X.arc(x, y, R + 4 + k * 16, 0, Math.PI * 2); X.stroke();
    X.strokeStyle = '#facc15'; X.lineWidth = 3;
    X.beginPath(); X.arc(x, y, R + 4, 0, Math.PI * 2); X.stroke();
    // arrow pointing to the other side: "flip here"
    const d = side === 1 ? -1 : 1, ay = y + d * (R + 12);
    X.fillStyle = '#facc15'; X.beginPath(); X.moveTo(x, ay + d * 10); X.lineTo(x - 8, ay); X.lineTo(x + 8, ay); X.closePath(); X.fill();
  }

  function cloud(x, y, s) {
    X.fillStyle = 'rgba(255,255,255,0.9)';
    X.beginPath(); X.ellipse(x, y + 10 * s, 34 * s, 10 * s, 0, 0, Math.PI * 2); X.fill();
    X.beginPath(); X.arc(x - 12 * s, y + 6 * s, 12 * s, 0, Math.PI * 2); X.arc(x + 8 * s, y + 2 * s, 15 * s, 0, Math.PI * 2); X.fill();
  }

  function tile(sx, y, solid, paintedAt, top) {
    if (!solid) {
      // a hole: dark with hazard stripes so it reads as danger at a glance
      X.fillStyle = '#2e1065'; X.fillRect(sx, y, TILE, TILE);
      X.save(); X.beginPath(); X.rect(sx, top ? y + TILE - 7 : y, TILE, 7); X.clip();
      X.fillStyle = '#facc15'; X.fillRect(sx, top ? y + TILE - 7 : y, TILE, 7);
      X.fillStyle = '#1e1b4b';
      for (let s = -10; s < TILE + 10; s += 12) { X.beginPath(); X.moveTo(sx + s, top ? y + TILE : y + 7); X.lineTo(sx + s + 6, top ? y + TILE : y + 7); X.lineTo(sx + s + 13, top ? y + TILE - 7 : y); X.lineTo(sx + s + 7, top ? y + TILE - 7 : y); X.fill(); }
      X.restore();
      return;
    }
    const pal = G.L.pal;
    const fresh = paintedAt ? clamp((G.time - paintedAt) / 0.25, 0, 1) : 0;
    // base block
    X.fillStyle = paintedAt ? pal.deep : '#cbd5e1';
    rr(sx + 1, y + 1, TILE - 2, TILE - 2, 7); X.fill();
    X.fillStyle = paintedAt ? pal.paint : '#ffffff';
    rr(sx + 1, top ? y + 1 : y + 1, TILE - 2, TILE - 6, 7); X.fill();
    if (paintedAt) {
      // paint splash grows in, with drips toward the tunnel
      X.fillStyle = 'rgba(255,255,255,0.35)';
      rr(sx + 6, y + 6, TILE - 14, 6, 3); X.fill();
      X.fillStyle = pal.paint;
      const dir = top ? 1 : -1, base = top ? y + TILE - 3 : y + 3;
      X.beginPath(); X.arc(sx + 12, base + dir * 2, 4 * fresh, 0, Math.PI * 2); X.fill();
      X.beginPath(); X.arc(sx + 30, base + dir * 3, 3 * fresh, 0, Math.PI * 2); X.fill();
      if (fresh < 1) { X.globalAlpha = 1 - fresh; X.fillStyle = '#ffffff'; rr(sx + 1, y + 1, TILE - 2, TILE - 6, 7); X.fill(); X.globalAlpha = 1; }
    } else {
      X.fillStyle = '#eef2ff';
      X.beginPath(); X.arc(sx + 13, y + 15, 3, 0, Math.PI * 2); X.arc(sx + 30, y + 26, 2.5, 0, Math.PI * 2); X.fill();
    }
  }

  function spikes(sx, surf, down) {
    for (let i = 0; i < 3; i++) {
      const x0 = sx + 4 + i * 12, d = down ? 1 : -1;
      X.fillStyle = '#4c1d95';
      X.beginPath(); X.moveTo(x0, surf); X.lineTo(x0 + 6, surf + d * SPIKE_H); X.lineTo(x0 + 12, surf); X.closePath(); X.fill();
      X.strokeStyle = '#ffffff'; X.lineWidth = 1.5; X.stroke();
    }
  }

  function dropIcon(x, y, now, idx) {
    const bob = Math.sin(now / 300 + idx * 1.4) * 4;
    X.save(); X.translate(x, y + bob);
    X.fillStyle = 'rgba(250,204,21,0.35)'; X.beginPath(); X.arc(0, 0, 17 + Math.sin(now / 200) * 2, 0, Math.PI * 2); X.fill();
    X.fillStyle = '#facc15'; X.strokeStyle = '#a16207'; X.lineWidth = 2;
    X.beginPath(); X.moveTo(0, -13); X.bezierCurveTo(10, -1, 10, 10, 0, 11); X.bezierCurveTo(-10, 10, -10, -1, 0, -13); X.fill(); X.stroke();
    X.fillStyle = 'rgba(255,255,255,0.8)'; X.beginPath(); X.ellipse(-3, 2, 2.5, 4, -0.4, 0, Math.PI * 2); X.fill();
    X.restore();
  }

  function finishGate(sx) {
    if (sx < -60 || sx > LW + 60) return;
    const h = TY1 - TY0, sq = 11;
    for (let r = 0; r * sq < h; r++) for (let c = 0; c < 2; c++) {
      X.fillStyle = (r + c) % 2 ? '#2e1065' : '#ffffff';
      X.fillRect(sx + c * sq, TY0 + r * sq, sq, Math.min(sq, h - r * sq));
    }
    X.fillStyle = '#2e1065'; rr(sx + sq - 34, 4, 68, 24, 12); X.fill();
    X.fillStyle = '#facc15'; X.font = '700 15px Fredoka, sans-serif'; X.textAlign = 'center'; X.textBaseline = 'middle';
    X.fillText('FINISH', sx + sq, 17);
  }

  // Splotch: a round paint-blob with big eyes, rolling paint spots and squash & stretch.
  function splotch(x, y, b, pal, now) {
    X.save(); X.translate(x, y);
    // soft shadow on the surface it is rolling on (floor or ceiling)
    X.fillStyle = 'rgba(46,16,101,0.18)'; X.beginPath(); X.ellipse(0, (b.grav || 1) * (R + 2), R * 0.85, 4, 0, 0, Math.PI * 2); X.fill();
    X.scale(b.sqx, b.sqy);   // squash & stretch stays lined up with the floor/ceiling
    X.rotate(b.roll);        // the whole blob (face included) rolls
    // body + paint spots
    X.fillStyle = '#2e1065'; X.beginPath(); X.arc(0, 0, R + 2.5, 0, Math.PI * 2); X.fill();
    X.fillStyle = pal.paint; X.beginPath(); X.arc(0, 0, R, 0, Math.PI * 2); X.fill();
    X.fillStyle = pal.deep;
    X.beginPath(); X.arc(-R * 0.55, R * 0.5, 4.5, 0, Math.PI * 2); X.arc(-R * 0.62, -R * 0.38, 3.5, 0, Math.PI * 2); X.arc(R * 0.1, R * 0.72, 3, 0, Math.PI * 2); X.fill();
    // eyes (look ahead), blink every few seconds
    b.blink -= 1 / 60;
    const blinking = b.blink < 0.12;
    if (b.blink < 0) b.blink = 2 + Math.random() * 3;
    for (const ex of [R * 0.05, R * 0.5]) {
      X.fillStyle = '#ffffff';
      X.beginPath(); X.ellipse(ex, -R * 0.12, 5.2, blinking ? 1 : 6.4, 0, 0, Math.PI * 2); X.fill();
      if (!blinking) { X.fillStyle = '#2e1065'; X.beginPath(); X.arc(ex + 1.6, -R * 0.08, 3, 0, Math.PI * 2); X.fill(); X.fillStyle = '#fff'; X.beginPath(); X.arc(ex + 2.6, -R * 0.2, 1.1, 0, Math.PI * 2); X.fill(); }
    }
    // cheeks + smile (open "wee!" mouth in the air)
    X.fillStyle = 'rgba(255,255,255,0.35)';
    X.beginPath(); X.arc(-R * 0.25, R * 0.25, 3.4, 0, Math.PI * 2); X.arc(R * 0.78, R * 0.22, 2.6, 0, Math.PI * 2); X.fill();
    X.fillStyle = '#2e1065';
    if (b.onGnd) { X.strokeStyle = '#2e1065'; X.lineWidth = 2; X.lineCap = 'round'; X.beginPath(); X.arc(R * 0.3, R * 0.2, 4.5, 0.15 * Math.PI, 0.85 * Math.PI); X.stroke(); }
    else { X.beginPath(); X.ellipse(R * 0.3, R * 0.3, 3.4, 4.2, 0, 0, Math.PI * 2); X.fill(); }
    // shine stays fixed (light from the top-left) while the body rolls underneath it
    X.rotate(-b.roll);
    X.fillStyle = 'rgba(255,255,255,0.45)'; X.beginPath(); X.ellipse(-R * 0.35, -R * 0.45, R * 0.32, R * 0.2, -0.5, 0, Math.PI * 2); X.fill();
    X.restore();
  }

  // ------------------------------------------------------------ loop
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (G.L && !screens.game.classList.contains('hidden')) {
      G.time += dt;
      if (G.scene === 'playing') {
        G.acc += dt;
        while (G.acc >= FIX_DT) { G.acc -= FIX_DT; step(FIX_DT); if (G.scene !== 'playing') break; }
      }
      if (G.scene !== 'paused') updateParts(dt);
      drawWorld(now);
    } else if (!screens.menu.classList.contains('hidden')) {
      drawHero(now);
    }
    requestAnimationFrame(frame);
  }

  // menu hero: Splotch rolling over freshly painted tiles
  const hero = $('heroArt'), H = hero.getContext('2d');
  const heroBall = newBall(0, 1);
  function drawHero(now) {
    const w = 300, h = 120, d = Math.min(window.devicePixelRatio || 1, 2);
    if (hero.width !== w * d) { hero.width = w * d; hero.height = h * d; }
    H.setTransform(d, 0, 0, d, 0, 0); H.clearRect(0, 0, w, h);
    const pal = PALETTES[Math.floor(now / 2500) % PALETTES.length];
    const t = (now / 1000) % 3;
    const bx = 30 + (t / 3) * 240;
    for (let i = 0; i < 7; i++) {
      const tx = 10 + i * 40, paintedTile = tx + 20 < bx;
      H.fillStyle = paintedTile ? pal.deep : '#cbd5e1'; rrOn(H, tx, 84, 38, 30, 7); H.fill();
      H.fillStyle = paintedTile ? pal.paint : '#ffffff'; rrOn(H, tx, 84, 38, 26, 7); H.fill();
    }
    heroBall.roll = bx / R; heroBall.onGnd = true; heroBall.sqx = 1 + Math.sin(now / 120) * 0.04; heroBall.sqy = 2 - heroBall.sqx;
    drawSplotchOn(H, bx, 84 - R, heroBall, pal, now);
  }
  function rrOn(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
  function drawSplotchOn(ctx, x, y, b, pal, now) {
    X = ctx; splotch(x, y, b, pal, now); X = gameCtx; // splotch() draws on X: point it at the hero canvas for one call
  }

  // ------------------------------------------------------------ HUD helpers
  function renderDrops(popIdx) {
    const el = $('hudDrops'); el.innerHTML = '';
    G.drops.forEach((got, i) => {
      const s = document.createElement('span');
      s.className = 'd' + (got ? '' : ' off') + (popIdx === i ? ' pop' : '');
      s.textContent = '💧'; el.appendChild(s);
    });
  }
  function updatePaintBar() {
    if (G.L && G.L.bonus) {
      const total = G.L.coins.reduce((a, c) => a + c.v, 0);
      $('paintFill').style.width = Math.min(100, (G.coinsGot / total) * 100) + '%';
      $('paintText').textContent = `🪙 ${G.coinsGot} / ${total} coins`;
      return;
    }
    const pct = paintPct();
    $('paintFill').style.width = pct + '%';
    $('paintText').textContent = '🖌 ' + pct + '% painted';
  }
  let toastT;
  function toast(msg) { const t = $('toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 1800); }

  // ------------------------------------------------------------ screens & modals
  const screens = { menu: $('screenMenu'), game: $('screenGame') };
  function showScreen(name) {
    Object.entries(screens).forEach(([k, el]) => el.classList.toggle('hidden', k !== name));
    if (name === 'menu') refreshMenu();
    if (name === 'game') requestAnimationFrame(resize);
  }
  const openModal = (id) => $(id).classList.remove('hidden');
  const closeModal = (id) => $(id).classList.add('hidden');
  const hideModals = () => document.querySelectorAll('.modal').forEach((m) => m.classList.add('hidden'));
  document.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', () => { Sound.click(); closeModal(b.dataset.close); }));

  function refreshMenu() {
    const d = save.get();
    $('playLevelLabel').textContent = 'Level ' + Math.min(d.unlocked, LEVEL_COUNT);
    const stars = Object.values(d.stars).reduce((a, b) => a + b, 0);
    $('menuStars').textContent = `⭐ ${stars} / ${LEVEL_COUNT * 3}`;
    $('menuCleared').textContent = Object.keys(d.stars).length + ' levels cleared';
    $('menuCoins').textContent = '🪙 ' + (d.coins || 0);
  }
  function buildLevelGrid() {
    const d = save.get(), g = $('levelGrid'); g.innerHTML = '';
    for (let i = 1; i <= LEVEL_COUNT; i++) {
      const b = document.createElement('button'), locked = i > d.unlocked, st = d.stars[i];
      b.className = 'lvl' + (locked ? ' locked' : st !== undefined ? ' done' : i === d.unlocked ? ' current' : '');
      b.innerHTML = locked ? '🔒' : `${i}<small>${st !== undefined ? '★'.repeat(st) || '✓' : ''}</small>`;
      if (!locked) b.addEventListener('click', () => { Sound.click(); startLevel(i - 1); });
      g.appendChild(b);
    }
  }
  function pause() { if (G.scene !== 'playing' && G.scene !== 'ready') return; G.prevScene = G.scene; G.scene = 'paused'; openModal('modalPause'); }
  function resume() { closeModal('modalPause'); G.scene = G.prevScene === 'playing' ? 'ready' : G.prevScene || 'ready'; G.acc = 0; last = performance.now();
    if (G.scene === 'ready') { $('hintMain').textContent = 'Tap to continue!'; $('hintNew').classList.add('hidden'); $('hintSub').textContent = 'or press Space'; $('tapHint').classList.remove('gone'); } }

  let confirmYes = null;
  function askConfirm(title, text, yes, fn) { $('confirmTitle').textContent = title; $('confirmText').textContent = text; $('btnConfirmYes').textContent = yes; confirmYes = fn; openModal('modalConfirm'); }
  $('btnConfirmNo').onclick = () => { Sound.click(); closeModal('modalConfirm'); };
  $('btnConfirmYes').onclick = () => { closeModal('modalConfirm'); if (confirmYes) confirmYes(); };
  function exitGame() {
    try { if (window.parent && window.parent !== window) { window.parent.postMessage({ action: 'closeModal', type: 'GAME_ENDED' }, '*'); return; } } catch (e) { /* ignore */ }
    try { window.close(); } catch (e) { /* ignore */ }
    setTimeout(() => { if (history.length > 1) history.back(); else toast('You can close this tab now'); }, 250);
  }

  // menu
  $('btnPlay').onclick = () => { Sound.click(); startLevel(Math.min(save.get().unlocked, LEVEL_COUNT) - 1); };
  $('btnLevels').onclick = () => { Sound.click(); buildLevelGrid(); openModal('modalLevels'); };
  $('btnHowTo').onclick = () => { Sound.click(); openModal('modalHowTo'); };
  $('btnSettings').onclick = () => { Sound.click(); syncSettings(); openModal('modalSettings'); };
  $('btnExit').onclick = () => { Sound.click(); askConfirm('LEAVE GAME?', 'Your progress is saved. Come back any time!', 'Leave', exitGame); };
  function syncSettings() {
    $('setSound').setAttribute('aria-checked', String(save.get().sound));
    $('setVibe').setAttribute('aria-checked', String(save.get().vibe));
    $('btnSound').classList.toggle('muted', !save.get().sound);
  }
  $('setSound').onclick = () => { save.get().sound = !save.get().sound; save.write(); syncSettings(); Sound.click(); };
  $('setVibe').onclick = () => { save.get().vibe = !save.get().vibe; save.write(); syncSettings(); vibrate(30); };
  $('btnReset').onclick = () => askConfirm('RESET PROGRESS?', 'All stars and unlocked levels will be erased.', 'Reset', () => { save.reset(); refreshMenu(); toast('Progress reset'); });

  // game
  $('btnPause').onclick = () => { Sound.click(); pause(); };
  $('btnSound').onclick = () => { save.get().sound = !save.get().sound; save.write(); syncSettings(); Sound.click(); };
  $('btnResume').onclick = () => { Sound.click(); resume(); };
  $('btnPauseMenu').onclick = () => { Sound.click(); hideModals(); showScreen('menu'); G.scene = 'menu'; };
  $('btnPauseRestart').onclick = () => { Sound.click(); if (G.L.bonus) startBonus(G.bonusIdx, G.nextAfterBonus); else startLevel(G.lvl); };
  $('btnRetry').onclick = () => { Sound.click(); startLevel(G.lvl); };
  $('btnFailMenu').onclick = () => { Sound.click(); hideModals(); showScreen('menu'); G.scene = 'menu'; };
  $('btnReviveAd').onclick = () => {
    if (!window.CielAds) { revive(); return; }
    CielAds.showRewarded(revive, () => toast('Ad not finished'), 'revive');
  };
  $('btnWinReplay').onclick = () => { Sound.click(); startLevel(G.lvl); };
  $('btnWinMenu').onclick = () => { Sound.click(); hideModals(); showScreen('menu'); G.scene = 'menu'; };
  $('btnNext').onclick = () => {
    Sound.click();
    if (G.lvl >= LEVEL_COUNT - 1) { hideModals(); showScreen('menu'); return; }
    const next = G.lvl + 1;
    closeModal('modalWin');
    if (levelIsBonusAfter(G.lvl + 1)) startBonus((G.lvl + 1) / 3 - 1, next); // reward stage after every 3 levels
    else startLevel(next);
  };
  $('btnBonusDouble').onclick = () => {
    const extra = G.coinsGot;
    const doubled = () => {
      save.addCoins(extra); G.coinsGot += extra; $('btnBonusDouble').classList.add('hidden');
      countUp($('bonusCount'), extra, G.coinsGot, 700); Sound.cheer(); refreshMenu();
    };
    if (!window.CielAds) { doubled(); return; }
    CielAds.showRewarded(doubled, () => toast('Ad not finished'), 'bonus_double');
  };
  $('btnBonusNext').onclick = () => {
    Sound.click(); closeModal('modalBonus');
    const next = G.nextAfterBonus;
    // the interstitial sits here, after the reward, not in the middle of the challenge
    if (window.CielAds) CielAds.showInterstitial(() => startLevel(next), 'after_bonus');
    else startLevel(next);
  };
  $('btnReviveCoins').onclick = () => {
    if ((save.get().coins || 0) < REVIVE_COST) { toast('Not enough coins yet'); return; }
    save.addCoins(-REVIVE_COST); Sound.coin(12); revive();
  };

  // input: tap anywhere on the play area, or Space / Up / W
  stage.addEventListener('pointerdown', (e) => { e.preventDefault(); tap(); });
  window.addEventListener('keydown', (e) => {
    const open = [...document.querySelectorAll('.modal:not(.hidden)')].pop();
    if (e.code === 'Escape') {
      if (open && ['modalLevels', 'modalHowTo', 'modalSettings', 'modalConfirm'].includes(open.id)) { closeModal(open.id); return; }
      if (G.scene === 'paused') resume(); else if (!screens.game.classList.contains('hidden')) pause();
      return;
    }
    if (['Space', 'ArrowUp', 'KeyW'].includes(e.code) && !open && !screens.game.classList.contains('hidden')) { e.preventDefault(); if (!e.repeat) tap(); }
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden && G.scene === 'playing') pause(); });
  if (window.CielAds) CielAds.setGameHooks({ pause: () => { G.adPaused = G.scene; if (G.scene === 'playing') G.scene = 'paused'; }, resume: () => { if (G.adPaused === 'playing') G.scene = 'ready'; last = performance.now(); } });
  const warm = () => { ['pointerdown', 'keydown'].forEach((t) => window.removeEventListener(t, warm, true)); Sound.warm(); };
  ['pointerdown', 'keydown'].forEach((t) => window.addEventListener(t, warm, true));

  new ResizeObserver(resize).observe(stage);
  window.addEventListener('resize', resize);
  syncSettings();
  showScreen('menu');
  window.GFP = { G, LEVELS, airTiles, startLevel, step, tap };
  requestAnimationFrame(frame);
})();
