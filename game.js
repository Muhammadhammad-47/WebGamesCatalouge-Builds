/* ==========================================================================
   ARROW ESCAPE – CIEL Games
   Tap an arrow and it slides off the board the way it points. If another
   arrow is in its path they crash and you lose a heart. Clear the board.

   Levels are generated from a seed (same level = same puzzle). Each arrow is
   placed only where its path to the edge is clear at that moment, so removing
   arrows in reverse order always works, and removing an arrow only ever frees
   space: every board is solvable and can never get stuck.
   ========================================================================== */
(function () {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const DIRS = [[-1, 0], [0, 1], [1, 0], [0, -1]]; // up, right, down, left  ([dRow, dCol])
  const PALETTE = ['#f97316', '#3b82f6', '#22c55e', '#ec4899', '#8b5cf6', '#eab308', '#06b6d4', '#ef4444', '#14b8a6'];
  const MAX_LEVEL = 100;
  const HEARTS = 3;
  const SAVE_KEY = 'arrowEscape.v1';

  // ------------------------------------------------------------ save data
  const save = (() => {
    let d = { unlocked: 1, stars: {}, sound: true, vibe: true };
    try { Object.assign(d, JSON.parse(localStorage.getItem(SAVE_KEY)) || {}); } catch (e) { /* private mode */ }
    return {
      get: () => d,
      write() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(d)); } catch (e) { /* ignore */ } },
      reset() { d = { unlocked: 1, stars: {}, sound: d.sound, vibe: d.vibe }; this.write(); },
    };
  })();

  // ------------------------------------------------------------ sound (WebAudio synth, no files)
  const Sound = (() => {
    let ctx = null;
    function ac() {
      if (!save.get().sound) return null;
      if (!ctx) { try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; } }
      if (ctx.state === 'suspended') ctx.resume();
      return ctx;
    }
    function tone(freq, dur, type, vol, slideTo, delay) {
      const a = ac(); if (!a) return;
      const t = a.currentTime + (delay || 0);
      const o = a.createOscillator(), g = a.createGain();
      o.type = type || 'sine';
      o.frequency.setValueAtTime(freq, t);
      if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
      g.gain.setValueAtTime(vol || 0.15, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      o.connect(g).connect(a.destination);
      o.start(t); o.stop(t + dur + 0.02);
    }
    return {
      warm: () => ac(),
      whoosh: () => { tone(320, 0.18, 'triangle', 0.14, 900); tone(640, 0.12, 'sine', 0.06, 1400, 0.03); },
      bump: () => { tone(150, 0.16, 'square', 0.08, 70); tone(90, 0.2, 'sine', 0.18, 50); },
      click: () => tone(700, 0.06, 'triangle', 0.08, 1000),
      heart: () => { tone(500, 0.12, 'sawtooth', 0.05, 250); tone(300, 0.2, 'triangle', 0.08, 150, 0.08); },
      win: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.25, 'triangle', 0.13, null, i * 0.1)),
      hint: () => { tone(880, 0.1, 'sine', 0.1); tone(1320, 0.18, 'sine', 0.08, null, 0.08); },
    };
  })();
  const vibrate = (ms) => { if (save.get().vibe && navigator.vibrate) try { navigator.vibrate(ms); } catch (e) { /* ignore */ } };

  // ------------------------------------------------------------ level generation
  function rng(seed) { // mulberry32
    return function () {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function gridSize(level) {
    if (level <= 3) return 4;
    if (level <= 9) return 5;
    if (level <= 20) return 6;
    if (level <= 40) return 7;
    if (level <= 70) return 8;
    return 9;
  }
  function generateLevel(level) {
    const rand = rng(level * 9973 + 17);
    const n = gridSize(level);
    const grid = Array.from({ length: n }, () => Array(n).fill(-1));
    const pieces = [];
    const density = Math.min(0.9, 0.58 + level * 0.006);
    let filled = 0, attempts = 0;
    const inside = (r, c) => r >= 0 && r < n && c >= 0 && c < n;
    // pathCount[r][c] = how many placed arrows would have to pass through this cell to escape.
    // Putting a new arrow on such cells makes it block them, which creates the order-puzzle.
    const pathCount = Array.from({ length: n }, () => Array(n).fill(0));
    const pressure = Math.min(16, 3 + Math.floor(level / 3)); // candidates compared per placement

    function candidate() {
      const r = Math.floor(rand() * n), c = Math.floor(rand() * n), dir = Math.floor(rand() * 4);
      const roll = rand();
      let len = roll < 0.3 ? 1 : roll < 0.75 ? 2 : 3;
      if (n <= 4) len = Math.min(len, 2);
      const [dr, dc] = DIRS[dir];
      const cells = [];
      for (let i = 0; i < len; i++) {
        const rr = r - dr * i, cc = c - dc * i;
        if (!inside(rr, cc) || grid[rr][cc] !== -1) return null;
        cells.push([rr, cc]);
      }
      // path from the head to the edge must be clear right now (this is what keeps it solvable)
      for (let rr = r + dr, cc = c + dc; inside(rr, cc); rr += dr, cc += dc) {
        if (grid[rr][cc] !== -1) return null;
      }
      const blocks = cells.reduce((a, [rr, cc]) => a + pathCount[rr][cc], 0);
      return { dir, len, cells, blocks };
    }

    while (filled / (n * n) < density && attempts < 8000) {
      let best = null;
      for (let k = 0; k < pressure && attempts < 8000; ) {
        attempts++;
        const cand = candidate();
        if (!cand) continue;
        k++;
        if (!best || cand.blocks > best.blocks || (cand.blocks === best.blocks && rand() < 0.5)) best = cand;
      }
      if (!best) continue;
      const id = pieces.length;
      best.cells.forEach(([rr, cc]) => { grid[rr][cc] = id; });
      const [dr, dc] = DIRS[best.dir];
      let [hr, hc] = best.cells[0];
      for (hr += dr, hc += dc; inside(hr, hc); hr += dr, hc += dc) pathCount[hr][hc]++;
      pieces.push({ id, dir: best.dir, len: best.len, cells: best.cells, color: PALETTE[Math.floor(rand() * PALETTE.length)] });
      filled += best.len;
    }
    return { n, pieces };
  }

  // ------------------------------------------------------------ DOM
  const canvas = $('board'), ctx = canvas.getContext('2d'), wrap = $('boardWrap');
  const screens = { menu: $('screenMenu'), game: $('screenGame') };
  let dpr = 1, side = 300, pad = 12, cell = 50;

  function resizeBoard() {
    const r = wrap.getBoundingClientRect();
    side = Math.max(200, Math.floor(Math.min(r.width, r.height, 600)));
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.style.width = canvas.style.height = side + 'px';
    canvas.width = canvas.height = Math.round(side * dpr);
    if (G.level) { pad = side * 0.045; cell = (side - pad * 2) / G.level.n; }
  }

  // ------------------------------------------------------------ game state
  const G = {
    levelNum: 1, level: null, pieces: [], hearts: HEARTS, hintsFree: 1,
    hintPiece: null, hintUntil: 0, over: false, paused: false, particles: [], shakeT: 0,
  };

  function startLevel(num) {
    G.levelNum = Math.max(1, Math.min(MAX_LEVEL, num));
    G.level = generateLevel(G.levelNum);
    G.pieces = G.level.pieces.map((p) => ({ ...p, cells: p.cells.map((c) => c.slice()), state: 'idle', off: 0, vel: 0, bumpT: 0, bumpMax: 0, flash: 0, alpha: 1 }));
    G.hearts = HEARTS; G.hintsFree = 1; G.hintPiece = null; G.over = false; G.particles = []; G.introT = 0;
    $('hudLevel').textContent = 'Level ' + G.levelNum;
    renderHearts(); updateHintBadge(); updateProgress();
    $('gameTip').style.opacity = G.levelNum <= 2 ? 1 : 0;
    hideModals();
    showScreen('game');
    resizeBoard();
  }

  function occupancy(exclude) {
    const n = G.level.n, grid = Array.from({ length: n }, () => Array(n).fill(null));
    for (const p of G.pieces) {
      if (p === exclude || p.state === 'leaving' || p.state === 'gone') continue;
      for (const [r, c] of p.cells) grid[r][c] = p;
    }
    return grid;
  }
  // Returns { clear: true } or { clear: false, steps, blocker }
  function pathOf(p) {
    const n = G.level.n, grid = occupancy(p), [dr, dc] = DIRS[p.dir];
    let [r, c] = p.cells[0], steps = 0;
    for (r += dr, c += dc; r >= 0 && r < n && c >= 0 && c < n; r += dr, c += dc) {
      if (grid[r][c]) return { clear: false, steps, blocker: grid[r][c] };
      steps++;
    }
    return { clear: true };
  }
  const remaining = () => G.pieces.filter((p) => p.state !== 'gone' && p.state !== 'leaving').length;

  function tapPiece(p) {
    if (G.over || p.state !== 'idle') return;
    if (G.hintPiece === p) G.hintPiece = null;
    $('gameTip').style.opacity = 0;
    const path = pathOf(p);
    if (path.clear) {
      p.state = 'leaving'; p.vel = cell * 7;
      Sound.whoosh(); vibrate(12);
      updateProgress();
    } else {
      p.state = 'bump'; p.bumpT = 0; p.bumpMax = (path.steps + 0.22) * cell;
      path.blocker.flash = 1;
      G.shakeT = 0.25;
      Sound.bump(); vibrate([30, 30, 30]);
      loseHeart();
    }
  }

  function loseHeart() {
    G.hearts--;
    renderHearts(true);
    Sound.heart();
    if (G.hearts <= 0) {
      G.over = true;
      setTimeout(() => openModal('modalFail'), 650);
    }
  }

  function checkWin() {
    if (G.over || G.pieces.some((p) => p.state !== 'gone')) return;
    G.over = true;
    const stars = Math.max(1, G.hearts);
    const d = save.get();
    d.stars[G.levelNum] = Math.max(d.stars[G.levelNum] || 0, stars);
    d.unlocked = Math.max(d.unlocked, Math.min(MAX_LEVEL, G.levelNum + 1));
    save.write();
    confetti();
    Sound.win(); vibrate([20, 40, 60]);
    setTimeout(() => {
      [...$('winStars').children].forEach((el, i) => el.classList.toggle('on', i < stars));
      $('winText').textContent = stars === 3 ? 'Perfect! No crashes!' : stars === 2 ? 'Nice planning!' : 'Cleared! Try for 3 stars.';
      $('btnNext').textContent = G.levelNum >= MAX_LEVEL ? 'All done! 🏆' : 'Next Level ➜';
      openModal('modalWin');
    }, 700);
  }

  function useHint() {
    const free = G.pieces.filter((p) => p.state === 'idle' && pathOf(p).clear);
    if (!free.length) return;
    // light up the longest arrow that can escape right now
    G.hintPiece = free.sort((a, b) => b.len - a.len)[0];
    G.hintUntil = performance.now() + 3500;
    Sound.hint();
  }

  // ------------------------------------------------------------ HUD helpers
  function renderHearts(animate) {
    const el = $('hudHearts');
    el.innerHTML = '';
    const total = Math.max(HEARTS, G.hearts);
    for (let i = 0; i < total; i++) {
      const s = document.createElement('span');
      s.className = 'h' + (i >= G.hearts ? ' lost' : '') + (animate && i === G.hearts ? ' pop' : '');
      s.textContent = '❤️';
      el.appendChild(s);
    }
  }
  function updateHintBadge() {
    const b = $('hintBadge');
    b.textContent = G.hintsFree > 0 ? G.hintsFree : 'AD';
    b.classList.toggle('ad', G.hintsFree <= 0);
  }
  function updateProgress() {
    const total = G.pieces.length, done = total - remaining();
    $('progressFill').style.width = (total ? (done / total) * 100 : 0) + '%';
    $('progressText').textContent = done + ' / ' + total;
  }
  let toastT;
  function toast(msg) {
    const t = $('toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 1800);
  }

  // ------------------------------------------------------------ effects
  function confetti() {
    const cols = ['#facc15', '#f97316', '#22c55e', '#3b82f6', '#ec4899', '#8b5cf6'];
    for (let i = 0; i < 90; i++) {
      G.particles.push({
        x: side / 2 + (Math.random() - 0.5) * side * 0.3, y: side * 0.45,
        vx: (Math.random() - 0.5) * side * 2.2, vy: -Math.random() * side * 2 - side * 0.4,
        life: 1.6 + Math.random() * 0.8, size: 5 + Math.random() * 6, color: cols[i % cols.length], rot: Math.random() * 6, vr: (Math.random() - 0.5) * 12, conf: true,
      });
    }
  }
  function sparks(x, y, color) {
    for (let i = 0; i < 10; i++) {
      const a = Math.random() * Math.PI * 2, s = cell * (2 + Math.random() * 4);
      G.particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 0.45 + Math.random() * 0.25, size: 3 + Math.random() * 4, color });
    }
  }

  // ------------------------------------------------------------ update & draw
  function update(dt) {
    const boardMax = side + cell * 3;
    for (const p of G.pieces) {
      if (p.flash > 0) p.flash = Math.max(0, p.flash - dt * 2.2);
      if (p.state === 'leaving') {
        p.vel += cell * 40 * dt;            // accelerate out: snappy, satisfying exit
        p.off += p.vel * dt;
        const [hr, hc] = p.cells[0], [dr, dc] = DIRS[p.dir];
        const hx = pad + (hc + 0.5) * cell + dc * p.off, hy = pad + (hr + 0.5) * cell + dr * p.off;
        if (!p.sparked && (hx < pad || hx > side - pad || hy < pad || hy > side - pad)) {
          p.sparked = true; sparks(Math.max(pad, Math.min(side - pad, hx)), Math.max(pad, Math.min(side - pad, hy)), p.color);
        }
        p.alpha = Math.max(0, 1 - Math.max(0, p.off - (side * 0.55)) / (side * 0.5));
        if (p.off > boardMax) { p.state = 'gone'; checkWin(); }
      } else if (p.state === 'bump') {
        p.bumpT += dt / 0.42;
        const t = Math.min(1, p.bumpT);
        // fast hit, springy return
        p.off = t < 0.35 ? p.bumpMax * easeOut(t / 0.35) : p.bumpMax * (1 - easeOutBack((t - 0.35) / 0.65));
        if (t >= 1) { p.off = 0; p.state = G.over ? 'stuck' : 'idle'; }
      }
    }
    if (G.shakeT > 0) G.shakeT = Math.max(0, G.shakeT - dt);
    G.introT = Math.min(1, (G.introT || 0) + dt * 2.2);
    for (let i = G.particles.length - 1; i >= 0; i--) {
      const q = G.particles[i];
      q.life -= dt; if (q.life <= 0) { G.particles.splice(i, 1); continue; }
      q.x += q.vx * dt; q.y += q.vy * dt;
      if (q.conf) { q.vy += side * 2.4 * dt; q.vx *= 0.985; q.rot += q.vr * dt; } else { q.vx *= 0.9; q.vy *= 0.9; }
    }
    if (G.hintPiece && (performance.now() > G.hintUntil || G.hintPiece.state !== 'idle')) G.hintPiece = null;
  }
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);
  const easeOutBack = (t) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  function shade(hex, amt) {
    const n = parseInt(hex.slice(1), 16);
    const f = (v) => Math.max(0, Math.min(255, Math.round(v + amt)));
    return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`;
  }

  function draw(now) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, side, side);
    if (!G.level) return;
    if (G.shakeT > 0) ctx.translate((Math.random() - 0.5) * 10 * G.shakeT / 0.25, (Math.random() - 0.5) * 10 * G.shakeT / 0.25);

    // board
    ctx.fillStyle = 'rgba(76, 29, 149, 0.28)';
    roundRect(2, 8, side - 4, side - 10, side * 0.06); ctx.fill();
    ctx.fillStyle = '#ffffff';
    roundRect(2, 2, side - 4, side - 10, side * 0.06); ctx.fill();
    const n = G.level.n;
    ctx.fillStyle = '#ede9fe';
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
      ctx.beginPath(); ctx.arc(pad + (c + 0.5) * cell, pad + (r + 0.5) * cell, cell * 0.09, 0, Math.PI * 2); ctx.fill();
    }

    // pieces (leaving ones are drawn on top)
    const order = G.pieces.filter((p) => p.state !== 'gone').sort((a, b) => (a.state === 'leaving') - (b.state === 'leaving'));
    const pop = easeOutBack(G.introT || 1);
    for (const p of order) drawPiece(p, now, pop);

    // particles
    for (const q of G.particles) {
      ctx.globalAlpha = Math.min(1, q.life * 2);
      ctx.fillStyle = q.color;
      if (q.conf) { ctx.save(); ctx.translate(q.x, q.y); ctx.rotate(q.rot); ctx.fillRect(-q.size / 2, -q.size / 4, q.size, q.size / 2); ctx.restore(); }
      else { ctx.beginPath(); ctx.arc(q.x, q.y, q.size, 0, Math.PI * 2); ctx.fill(); }
    }
    ctx.globalAlpha = 1;
  }

  function drawPiece(p, now, pop) {
    const [dr, dc] = DIRS[p.dir];
    const head = p.cells[0], tail = p.cells[p.cells.length - 1];
    const ox = dc * p.off, oy = dr * p.off;
    const hx = pad + (head[1] + 0.5) * cell + ox, hy = pad + (head[0] + 0.5) * cell + oy;
    const tx = pad + (tail[1] + 0.5) * cell + ox, ty = pad + (tail[0] + 0.5) * cell + oy;
    const th = cell * 0.66 * pop;
    const x = Math.min(hx, tx) - th / 2, y = Math.min(hy, ty) - th / 2;
    const w = Math.abs(hx - tx) + th, h = Math.abs(hy - ty) + th;

    ctx.save();
    ctx.globalAlpha = p.alpha;
    // hint glow
    if (G.hintPiece === p) {
      const k = 0.5 + 0.5 * Math.sin(now * 0.012);
      ctx.fillStyle = `rgba(250, 204, 21, ${0.35 + 0.35 * k})`;
      roundRect(x - 7 - k * 3, y - 7 - k * 3, w + 14 + k * 6, h + 14 + k * 6, (th + 14) / 2); ctx.fill();
    }
    // 3D base, body, top shine
    ctx.fillStyle = shade(p.color, -55);
    roundRect(x, y + th * 0.12, w, h, th / 2); ctx.fill();
    ctx.fillStyle = p.flash > 0 ? mix(p.color, '#ff1f3d', p.flash) : p.color;
    roundRect(x, y, w, h, th / 2); ctx.fill();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.28)';
    roundRect(x + th * 0.14, y + th * 0.1, w - th * 0.28, th * 0.26, th * 0.13); ctx.fill();

    // arrow chevron on the head
    ctx.translate(hx, hy);
    ctx.rotate([-Math.PI / 2, 0, Math.PI / 2, Math.PI][p.dir]);
    const s = th * 0.34;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = Math.max(2.5, th * 0.14);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(-s * 0.55, -s); ctx.lineTo(s * 0.55, 0); ctx.lineTo(-s * 0.55, s); ctx.stroke();
    if (p.len > 1) { // direction dots along the body
      ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
      for (let i = 1; i < p.len; i++) { ctx.beginPath(); ctx.arc(-i * cell, 0, th * 0.08, 0, Math.PI * 2); ctx.fill(); }
    }
    ctx.restore();
  }
  function mix(a, b, t) {
    const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
    const ch = (s) => Math.round(((pa >> s) & 255) * (1 - t) + ((pb >> s) & 255) * t);
    return `rgb(${ch(16)},${ch(8)},${ch(0)})`;
  }

  let last = performance.now();
  function loop(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (!G.paused && !screens.game.classList.contains('hidden')) { update(dt); draw(now); }
    requestAnimationFrame(loop);
  }

  // ------------------------------------------------------------ input
  canvas.addEventListener('pointerdown', (e) => {
    if (!G.level || G.paused) return;
    const r = canvas.getBoundingClientRect();
    const x = e.clientX - r.left - pad, y = e.clientY - r.top - pad;
    const col = Math.floor(x / cell), row = Math.floor(y / cell);
    if (row < 0 || col < 0 || row >= G.level.n || col >= G.level.n) return;
    const p = G.pieces.find((q) => q.state === 'idle' && q.cells.some(([rr, cc]) => rr === row && cc === col));
    if (p) tapPiece(p);
  });

  // ------------------------------------------------------------ screens & modals
  function showScreen(name) {
    Object.entries(screens).forEach(([k, el]) => el.classList.toggle('hidden', k !== name));
    if (name === 'menu') refreshMenu();
  }
  function openModal(id) { $(id).classList.remove('hidden'); }
  function closeModal(id) { $(id).classList.add('hidden'); }
  function hideModals() { document.querySelectorAll('.modal').forEach((m) => m.classList.add('hidden')); }
  document.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', () => { Sound.click(); closeModal(b.dataset.close); }));
  document.querySelectorAll('.modal').forEach((m) => m.addEventListener('pointerdown', (e) => {
    if (e.target === m && !['modalWin', 'modalFail'].includes(m.id)) closeModal(m.id);
  }));

  function refreshMenu() {
    const d = save.get();
    const next = Math.min(d.unlocked, MAX_LEVEL);
    $('playLevelLabel').textContent = 'Level ' + next;
    const totalStars = Object.values(d.stars).reduce((a, b) => a + b, 0);
    $('menuStars').textContent = '⭐ ' + totalStars;
    $('menuCleared').textContent = Object.keys(d.stars).length + ' levels cleared';
  }
  function buildLevelGrid() {
    const d = save.get(), g = $('levelGrid');
    g.innerHTML = '';
    for (let i = 1; i <= MAX_LEVEL; i++) {
      const b = document.createElement('button');
      const locked = i > d.unlocked, st = d.stars[i] || 0;
      b.className = 'lvl' + (locked ? ' locked' : st ? ' done' : i === d.unlocked ? ' current' : '');
      b.innerHTML = locked ? '🔒' : `${i}<small>${'★'.repeat(st)}</small>`;
      if (!locked) b.addEventListener('click', () => { Sound.click(); startLevel(i); });
      g.appendChild(b);
    }
  }

  let confirmYes = null;
  function askConfirm(title, text, yes, fn) {
    $('confirmTitle').textContent = title; $('confirmText').textContent = text; $('btnConfirmYes').textContent = yes;
    confirmYes = fn; openModal('modalConfirm');
  }
  $('btnConfirmNo').onclick = () => { Sound.click(); closeModal('modalConfirm'); };
  $('btnConfirmYes').onclick = () => { closeModal('modalConfirm'); if (confirmYes) confirmYes(); };

  function exitGame() {
    try { if (window.parent && window.parent !== window) { window.parent.postMessage({ action: 'closeModal', type: 'GAME_ENDED' }, '*'); return; } } catch (e) { /* ignore */ }
    try { window.close(); } catch (e) { /* ignore */ }
    setTimeout(() => { if (history.length > 1) history.back(); else toast('You can close this tab now'); }, 250);
  }

  // menu buttons
  $('btnPlay').onclick = () => { Sound.click(); startLevel(Math.min(save.get().unlocked, MAX_LEVEL)); };
  $('btnLevels').onclick = () => { Sound.click(); buildLevelGrid(); openModal('modalLevels'); };
  $('btnHowTo').onclick = () => { Sound.click(); openModal('modalHowTo'); };
  $('btnSettings').onclick = () => { Sound.click(); syncSettings(); openModal('modalSettings'); };
  $('btnExit').onclick = () => { Sound.click(); askConfirm('LEAVE GAME?', 'Your progress is saved. Come back any time!', 'Leave', exitGame); };

  // settings
  function syncSettings() {
    $('setSound').setAttribute('aria-checked', String(save.get().sound));
    $('setVibe').setAttribute('aria-checked', String(save.get().vibe));
  }
  $('setSound').onclick = () => { save.get().sound = !save.get().sound; save.write(); syncSettings(); Sound.click(); };
  $('setVibe').onclick = () => { save.get().vibe = !save.get().vibe; save.write(); syncSettings(); vibrate(30); };
  $('btnReset').onclick = () => askConfirm('RESET PROGRESS?', 'All stars and unlocked levels will be erased.', 'Reset', () => {
    save.reset(); refreshMenu(); toast('Progress reset');
  });

  // in-game buttons
  $('btnHome').onclick = () => { Sound.click(); showScreen('menu'); };
  $('btnRestart').onclick = () => { Sound.click(); startLevel(G.levelNum); };
  $('btnHint').onclick = () => {
    if (G.over) return;
    if (G.hintsFree > 0) { G.hintsFree--; updateHintBadge(); useHint(); return; }
    Sound.click(); openModal('modalHint');
  };
  $('btnHintNo').onclick = () => { Sound.click(); closeModal('modalHint'); };
  $('btnHintAd').onclick = () => {
    closeModal('modalHint');
    if (!window.CielAds) { useHint(); return; }
    CielAds.showRewarded(() => useHint(), () => toast('No hint this time'), 'hint');
  };

  // win / fail
  $('btnNext').onclick = () => {
    Sound.click();
    const next = Math.min(G.levelNum + 1, MAX_LEVEL);
    closeModal('modalWin');
    if (G.levelNum >= MAX_LEVEL) { showScreen('menu'); return; }
    // interstitial every 3 levels; the game continues whatever happens
    if (window.CielAds && G.levelNum % 3 === 0) CielAds.showInterstitial(() => startLevel(next), 'level_complete');
    else startLevel(next);
  };
  $('btnWinMenu').onclick = () => { Sound.click(); showScreen('menu'); hideModals(); };
  $('btnRetry').onclick = () => { Sound.click(); startLevel(G.levelNum); };
  $('btnFailMenu').onclick = () => { Sound.click(); showScreen('menu'); hideModals(); };
  $('btnReviveAd').onclick = () => {
    const revive = () => {
      G.hearts = 1; G.over = false;
      G.pieces.forEach((p) => { if (p.state === 'stuck') p.state = 'idle'; });
      renderHearts(); closeModal('modalFail'); toast('+1 ❤️  Keep going!');
    };
    if (!window.CielAds) { revive(); return; }
    CielAds.showRewarded(revive, () => toast('Ad not finished, no heart'), 'revive');
  };

  // keyboard: Escape closes modals / goes back
  window.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    const open = [...document.querySelectorAll('.modal:not(.hidden)')].pop();
    if (open && !['modalWin', 'modalFail'].includes(open.id)) { closeModal(open.id); return; }
    if (!screens.game.classList.contains('hidden')) showScreen('menu');
  });

  // ads pause the game
  if (window.CielAds) CielAds.setGameHooks({ pause: () => { G.paused = true; }, resume: () => { G.paused = false; last = performance.now(); } });

  // audio warm-up on first interaction (avoids a stall later)
  const warm = () => { ['pointerdown', 'keydown'].forEach((t) => window.removeEventListener(t, warm, true)); Sound.warm(); };
  ['pointerdown', 'keydown'].forEach((t) => window.addEventListener(t, warm, true));

  new ResizeObserver(resizeBoard).observe(wrap);
  window.addEventListener('resize', resizeBoard);

  // expose for debugging / tests
  window.ArrowEscape = { G, generateLevel, pathOf, startLevel };

  showScreen('menu');
  requestAnimationFrame(loop);
})();
