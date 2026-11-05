// Tile Trio — original triple-match tile puzzle.
(() => {
  'use strict';
  const $ = (s) => document.querySelector(s);
  const TRAY = 7;
  const KEY = 'tileTrio.save.v1';
  const PRICE = 60;
  const NAMES = { undo: 'Undo', magnet: 'Magnet', shuffle: 'Shuffle' };

  const app = $('#app'), stage = $('#stage'), fx = $('#fx'), trayEl = $('#tray');

  // ---------- Save data ----------
  let S = { level: 1, coins: 100, boosters: { undo: 3, magnet: 2, shuffle: 2 }, sound: true, music: true };
  try {
    const d = JSON.parse(localStorage.getItem(KEY));
    if (d) S = { ...S, ...d, boosters: { ...S.boosters, ...(d.boosters || {}) } };
  } catch (e) { /* storage unavailable */ }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* ignore */ } };

  Sound.setSound(S.sound);
  Sound.setMusic(S.music);
  const ICONS = Art.build(160);

  // ---------- Level generation ----------
  function mulberry32(a) {
    return () => {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function shuffle(a, r = Math.random) {
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }
  const overlaps = (a, b) => Math.abs(a.x - b.x) < 2 && Math.abs(a.y - b.y) < 2;
  const coveredBy = (t, list) => list.some((o) => o !== t && o.z > t.z && overlaps(o, t));

  const PATTERNS = ['full', 'diamond', 'ring', 'checker', 'random', 'bars', 'random'];
  function keepFn(pat, r, density) {
    return (i, j, c, rows) => {
      const cx = (c - 1) / 2, cy = (rows - 1) / 2;
      switch (pat) {
        case 'full': return true;
        case 'diamond': return Math.abs(i - cx) / (c / 2 + 0.3) + Math.abs(j - cy) / (rows / 2 + 0.3) <= 1.05;
        case 'ring': return i === 0 || j === 0 || i === c - 1 || j === rows - 1 || (Math.abs(i - cx) < 1 && Math.abs(j - cy) < 1);
        case 'checker': return (i + j) % 2 === 0 || r() < 0.25;
        case 'bars': return j % 2 === 0 || i === 0 || i === c - 1;
        default: return r() < density;
      }
    };
  }

  function levelParams(n) {
    if (n === 1) return { cols: 3, rows: 3, layers: 1, types: 3, win: 3, min: 9 };
    if (n === 2) return { cols: 4, rows: 4, layers: 2, types: 4, win: 3, min: 18 };
    if (n === 3) return { cols: 4, rows: 5, layers: 3, types: 5, win: 6, min: 24 };
    return {
      cols: Math.min(4 + Math.floor(n / 5), 7),
      rows: Math.min(5 + Math.floor(n / 4), 8),
      layers: Math.min(3 + Math.floor((n - 3) / 3), 6),
      types: Math.min(5 + Math.floor(n * 0.5), Art.count),
      win: n < 8 ? 6 : 9,
      min: 27,
    };
  }

  function genLevel(n) {
    const r = mulberry32(n * 7919 + 1234567);
    const P = levelParams(n);
    let out = [];
    for (let attempt = 0; attempt < 12; attempt++) {
      out = [];
      for (let k = 0; k < P.layers; k++) {
        const inset = Math.floor(k / 2), off = k % 2;
        const c = P.cols - 2 * inset - off, rows = P.rows - 2 * inset - off;
        if (c < 1 || rows < 1) break;
        const pat = n <= 3 || attempt > 8 ? 'full' : PATTERNS[Math.floor(r() * PATTERNS.length)];
        const keep = keepFn(pat, r, 0.55 + r() * 0.35);
        const half = Math.ceil(c / 2);
        for (let j = 0; j < rows; j++) {
          for (let i = 0; i < half; i++) {
            if (!keep(i, j, c, rows)) continue;
            const cols = c - 1 - i !== i ? [i, c - 1 - i] : [i];
            for (const ii of cols) {
              const t = { x: inset * 2 + off + ii * 2, y: inset * 2 + off + j * 2, z: k };
              if (k > 0 && !out.some((o) => o.z < k && overlaps(o, t))) continue; // needs support
              out.push(t);
            }
          }
        }
      }
      while (out.length % 3) {
        const maxZ = Math.max(...out.map((t) => t.z));
        const top = out.filter((t) => t.z === maxZ);
        out.splice(out.indexOf(top[Math.floor(r() * top.length)]), 1);
      }
      if (out.length >= P.min) break;
    }

    // Assign types along a valid clearing order so every level is solvable.
    const alive = out.slice(), order = [];
    while (alive.length) {
      const free = alive.filter((t) => !coveredBy(t, alive));
      const pick = free[Math.floor(r() * free.length)];
      order.push(pick); alive.splice(alive.indexOf(pick), 1);
    }
    const pool = shuffle([...Array(P.types).keys()], r);
    let tp = 0;
    for (let s = 0; s < order.length; s += P.win) {
      const chunk = order.slice(s, s + P.win), seq = [];
      for (let k = 0; k < chunk.length / 3; k++) { const ty = pool[tp++ % pool.length]; seq.push(ty, ty, ty); }
      shuffle(seq, r);
      chunk.forEach((t, i) => { t.type = seq[i]; });
    }
    return out;
  }

  // ---------- Game state ----------
  let G = null;   // current round
  let L = null;   // layout metrics

  function startLevel(n) {
    closeModal();
    stage.innerHTML = '';
    fx.innerHTML = '';
    const g = {
      level: n, tiles: [], tray: [], history: [], over: false,
      combo: 0, bestCombo: 0, lastMatch: 0, used: 0,
    };
    G = g;
    g.tiles = genLevel(n).map((t, id) => ({ ...t, id, state: 'board', blocked: false, clearing: false }));
    g.tiles.forEach(makeTile);
    updateBlocked();
    measure();
    layoutAll(true);
    const intro = g.tiles.map((t) => t.el.animate(
      [{ transform: 'translateY(-60px) scale(.5)', opacity: 0 }, { transform: 'none', opacity: 1 }],
      { duration: 420, delay: t.z * 140 + Math.random() * 220, easing: 'cubic-bezier(.2,.9,.3,1.25)', fill: 'backwards' },
    ));
    // Safety net: never leave tiles invisible if the animation timeline is throttled.
    later(() => intro.forEach((a) => { try { a.finish(); } catch (e) { /* ignore */ } }), 2200);
    $('#tip').textContent =
      n === 1 ? 'Tap tiles to move them to the tray. Three of a kind clear!' :
      n === 2 ? 'Darker tiles are covered. Clear the tiles on top first.' :
      n === 3 ? "Don't let the tray fill up with 7 tiles!" : '';
    trayEl.classList.remove('danger');
    hud();
    // tip changes board height on the first levels
    requestAnimationFrame(() => { measure(); layoutAll(true); });
  }

  function makeTile(t) {
    const el = document.createElement('div');
    el.className = 'tile';
    const img = new Image();
    img.src = ICONS[t.type].src; img.alt = ''; img.draggable = false;
    el.appendChild(img);
    el.addEventListener('pointerdown', (e) => { e.preventDefault(); tap(t); });
    t.el = el; t.img = img;
    stage.appendChild(el);
  }

  function updateBlocked() {
    const board = G.tiles.filter((t) => t.state === 'board');
    for (const t of board) {
      const b = coveredBy(t, board);
      if (b !== t.blocked) { t.blocked = b; t.el.classList.toggle('blocked', b); }
    }
  }

  // ---------- Layout ----------
  function measure() {
    if (!G) return;
    const a = app.getBoundingClientRect(), b = $('#board').getBoundingClientRect(), tr = trayEl.getBoundingClientRect();
    const ts = G.tiles;
    const minX = Math.min(...ts.map((t) => t.x)), maxX = Math.max(...ts.map((t) => t.x));
    const minY = Math.min(...ts.map((t) => t.y)), maxY = Math.max(...ts.map((t) => t.y));
    const maxZ = Math.max(...ts.map((t) => t.z));
    const lift = 0.16;
    const wU = maxX - minX + 2, hU = maxY - minY + 2 + maxZ * lift + 0.2;
    const unit = Math.min(b.width / wU, b.height / hU, 46);
    L = {
      unit, lift,
      ox: b.left - a.left + (b.width - wU * unit) / 2 - minX * unit,
      oy: b.top - a.top + (b.height - hU * unit) / 2 + maxZ * lift * unit - minY * unit,
      tx: tr.left - a.left + 8, ty: tr.top - a.top, th: tr.height, tw: tr.width - 16,
    };
  }

  function boardRect(t) {
    const gap = L.unit * 0.06, w = L.unit * 2 - gap * 2;
    return { x: L.ox + t.x * L.unit + gap, y: L.oy + t.y * L.unit - t.z * L.lift * L.unit + gap - w * 0.03, w };
  }
  function trayRect(i, n) {
    const slot = L.tw / Math.max(TRAY, n);
    const w = Math.min(slot * 0.86, L.th * 0.74);
    return { x: L.tx + slot * i + (slot - w) / 2, y: L.ty + (L.th - w) / 2 - w * 0.05, w };
  }
  function place(t, r) {
    const s = t.el.style;
    s.left = r.x + 'px'; s.top = r.y + 'px'; s.width = s.height = r.w + 'px';
    s.setProperty('--e', Math.max(2, r.w * 0.085).toFixed(1) + 'px');
  }
  const boardZ = (t) => 10 + t.z * 400 + t.y * 10 + t.x;

  function layoutTray() {
    G.tray.forEach((t, i) => { place(t, trayRect(i, G.tray.length)); t.el.style.zIndex = 5000 + i; });
    const n = G.tray.filter((x) => !x.clearing).length;
    trayEl.classList.toggle('danger', n >= TRAY - 2 && !G.over);
  }
  function layoutAll(instant) {
    if (!G || !L) return;
    if (instant) stage.classList.add('noanim');
    G.tiles.forEach((t) => {
      if (t.state === 'board') { place(t, boardRect(t)); t.el.style.zIndex = boardZ(t); }
    });
    layoutTray();
    if (instant) { void stage.offsetWidth; stage.classList.remove('noanim'); }
  }

  let rz = 0;
  window.addEventListener('resize', () => {
    cancelAnimationFrame(rz);
    rz = requestAnimationFrame(() => { measure(); layoutAll(true); });
  });

  // ---------- Core play ----------
  function tap(t) {
    if (!G || G.over || t.state !== 'board') return;
    Sound.unlock();
    if (t.blocked) {
      Sound.blocked();
      t.el.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-4px)' }, { transform: 'translateX(4px)' }, { transform: 'translateX(0)' }], { duration: 200 });
      return;
    }
    const active = G.tray.filter((x) => !x.clearing);
    if (active.length >= TRAY) return;

    t.state = 'tray';
    let at = -1;
    for (let i = G.tray.length - 1; i >= 0; i--) {
      const x = G.tray[i];
      if (!x.clearing && x.type === t.type) { at = i; break; }
    }
    if (at < 0) G.tray.push(t); else G.tray.splice(at + 1, 0, t);
    G.history.push(t);
    t.el.classList.add('intray');
    Sound.tap(active.length);
    updateBlocked();
    layoutTray();

    const same = G.tray.filter((x) => !x.clearing && x.type === t.type);
    if (same.length >= 3) {
      same.forEach((x) => { x.clearing = true; });
      G.history = G.history.filter((h) => !same.includes(h));
      layoutTray();
      later(() => clearSet(same), 300);
    } else {
      later(() => Sound.land(), 250);
      if (active.length + 1 >= TRAY) { G.over = true; layoutTray(); later(lose, 450); }
    }
  }

  // setTimeout bound to the current round
  function later(fn, ms) {
    const g = G;
    setTimeout(() => { if (G === g) fn(); }, ms);
  }

  function clearSet(set) {
    const now = performance.now();
    G.combo = now - G.lastMatch < 4500 ? G.combo + 1 : 1;
    G.lastMatch = now;
    G.bestCombo = Math.max(G.bestCombo, G.combo);
    const mid = set[1];
    const mx = parseFloat(mid.el.style.left), my = parseFloat(mid.el.style.top), mw = parseFloat(mid.el.style.width);
    set.forEach((x) => { x.el.style.left = mx + 'px'; x.el.style.top = my + 'px'; });
    later(() => {
      Sound.match(G.combo);
      set.forEach((x) => { x.el.classList.add('pop'); x.state = 'gone'; });
      burst(mx + mw / 2, my + mw / 2, ICONS[mid.type].color);
      if (G.combo >= 2) floatText(`Combo x${G.combo}!`, mx + mw / 2, my - 10);
      later(() => {
        set.forEach((x) => x.el.remove());
        G.tray = G.tray.filter((x) => !set.includes(x));
        layoutTray();
        checkWin();
      }, 230);
    }, 150);
  }

  function checkWin() {
    if (G.over) return;
    if (G.tiles.every((t) => t.state === 'gone')) { G.over = true; later(win, 350); }
  }

  function returnToBoard(t) {
    G.tray.splice(G.tray.indexOf(t), 1);
    t.state = 'board';
    t.el.classList.remove('intray');
    t.el.style.zIndex = 9000;
    place(t, boardRect(t));
    later(() => { if (t.state === 'board') t.el.style.zIndex = boardZ(t); }, 320);
    updateBlocked();
    layoutTray();
  }

  // ---------- Boosters ----------
  function undoOne(quiet) {
    while (G.history.length) {
      const t = G.history.pop();
      if (t.state === 'tray' && !t.clearing) {
        returnToBoard(t);
        if (!quiet) Sound.undo();
        return true;
      }
    }
    if (!quiet) toast('Nothing to undo');
    return false;
  }

  function magnet() {
    const board = G.tiles.filter((t) => t.state === 'board');
    if (!board.length) return false;
    const active = G.tray.filter((x) => !x.clearing);
    let type = null, best = 0;
    for (const x of active) {
      const c = active.filter((y) => y.type === x.type).length;
      if (c > best) { best = c; type = x.type; }
    }
    if (type === null) {
      const score = {};
      board.forEach((t) => { score[t.type] = (score[t.type] || 0) + (t.blocked ? 1 : 3); });
      type = +Object.keys(score).sort((a, b) => score[b] - score[a])[0];
    }
    const inTray = active.filter((x) => x.type === type);
    const need = 3 - inTray.length;
    const picked = board.filter((t) => t.type === type)
      .sort((a, b) => (a.blocked - b.blocked) || (b.z - a.z))
      .slice(0, need);
    if (picked.length < need) return false;

    const set = [...inTray, ...picked];
    set.forEach((x) => { x.clearing = true; x.state = 'tray'; x.el.classList.remove('blocked'); x.el.classList.add('intray'); });
    G.history = G.history.filter((h) => !set.includes(h));
    G.tray = G.tray.filter((x) => !set.includes(x));
    const w = trayRect(0, TRAY).w;
    const cx = L.tx + L.tw / 2 - w / 2, cy = L.ty - w * 1.35;
    set.forEach((x, i) => { x.el.style.zIndex = 9000 + i; place(x, { x: cx + (i - 1) * w * 1.08, y: cy, w }); });
    Sound.magnet();
    updateBlocked();
    layoutTray();
    later(() => clearSet(set), 420);
    return true;
  }

  function shuffleBoard() {
    const bt = G.tiles.filter((t) => t.state === 'board');
    if (bt.length < 2) return false;
    const types = shuffle(bt.map((t) => t.type));
    Sound.shuffle();
    bt.forEach((t, i) => {
      t.el.animate(
        [{ transform: 'scale(1) rotate(0)' }, { transform: 'scale(.15) rotate(180deg)' }, { transform: 'scale(1) rotate(360deg)' }],
        { duration: 520, easing: 'ease-in-out' },
      );
      t.type = types[i];
      later(() => { t.img.src = ICONS[t.type].src; }, 260);
    });
    return true;
  }

  const BOOST = { undo: () => undoOne(false), magnet, shuffle: shuffleBoard };
  document.querySelectorAll('.booster').forEach((btn) => {
    btn.addEventListener('click', () => {
      const k = btn.dataset.b;
      if (!G || G.over) return;
      Sound.unlock();
      if (S.boosters[k] <= 0) {
        if (S.coins >= PRICE) {
          S.coins -= PRICE; S.boosters[k]++; save(); hud(); Sound.coin();
          toast(`+1 ${NAMES[k]}`);
        } else { Sound.blocked(); toast(`Need ${PRICE} coins`); }
        return;
      }
      if (BOOST[k]()) {
        S.boosters[k]--; G.used++; save(); hud();
        btn.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.18)' }, { transform: 'scale(1)' }], { duration: 250 });
      }
    });
  });

  // ---------- Win / lose ----------
  function win() {
    Sound.win();
    confetti();
    const stars = G.used === 0 ? 3 : G.used <= 2 ? 2 : 1;
    const reward = 15 + stars * 5 + Math.min(G.bestCombo, 10) * 3;
    S.coins += reward;
    let gift = '';
    if (G.level % 3 === 0) {
      const k = ['undo', 'magnet', 'shuffle'][(G.level / 3) % 3];
      S.boosters[k]++;
      gift = `<div class="gift">Bonus: +1 ${NAMES[k]}</div>`;
    }
    const done = G.level;
    S.level = done + 1;
    save(); hud();
    const starHtml = [0, 1, 2].map((i) => `<i class="${i < stars ? 'on' : ''}">★</i>`).join('');
    later(() => modal(
      `<div class="mtitle">Level ${done} Clear!</div>
       <div class="stars">${starHtml}</div>
       <div class="reward"><i class="coin"></i>+${reward}</div>${gift}
       <button class="btn green" id="mNext">Next Level</button>`,
      { mNext: () => startLevel(S.level) },
    ), 700);
  }

  function lose() {
    Sound.lose();
    trayEl.classList.add('shake');
    later(() => trayEl.classList.remove('shake'), 500);
    later(() => {
      const n = S.boosters.undo;
      const can = n > 0 || S.coins >= PRICE;
      modal(
        `<div class="mtitle red">Tray Full!</div>
         <p>No room left for another tile.</p>
         <button class="btn green ${can ? '' : 'disabled'}" id="mCont">Undo 3 tiles ${n > 0 ? `<span class="badge">${n}</span>` : `<i class="coin"></i>${PRICE}`}</button>
         <button class="btn" id="mRetry">Retry Level</button>`,
        {
          mCont: () => {
            if (S.boosters.undo > 0) S.boosters.undo--;
            else if (S.coins >= PRICE) S.coins -= PRICE;
            else { toast(`Need ${PRICE} coins`); return; }
            G.used++; save(); hud(); closeModal();
            G.over = false;
            for (let i = 0; i < 3; i++) undoOne(true);
            Sound.undo();
          },
          mRetry: () => startLevel(G.level),
        },
      );
    }, 650);
  }

  // ---------- FX ----------
  function burst(x, y, color) {
    for (let i = 0; i < 14; i++) {
      const p = document.createElement('div');
      p.className = 'particle';
      const s = 6 + Math.random() * 8, a = Math.random() * Math.PI * 2, d = 40 + Math.random() * 60;
      Object.assign(p.style, { width: s + 'px', height: s + 'px', left: x - s / 2 + 'px', top: y - s / 2 + 'px', background: i % 3 ? color : '#fff' });
      fx.appendChild(p);
      p.animate([{ transform: 'translate(0,0) scale(1)', opacity: 1 }, { transform: `translate(${Math.cos(a) * d}px,${Math.sin(a) * d}px) scale(.2)`, opacity: 0 }],
        { duration: 520 + Math.random() * 200, easing: 'cubic-bezier(.2,.8,.4,1)' }).onfinish = () => p.remove();
    }
    const ring = document.createElement('div');
    ring.className = 'ring';
    Object.assign(ring.style, { left: x - 30 + 'px', top: y - 30 + 'px', width: '60px', height: '60px' });
    fx.appendChild(ring);
    ring.animate([{ transform: 'scale(.3)', opacity: 1 }, { transform: 'scale(1.6)', opacity: 0 }], { duration: 420, easing: 'ease-out' }).onfinish = () => ring.remove();
  }
  function floatText(text, x, y) {
    const el = document.createElement('div');
    el.className = 'float-text'; el.textContent = text;
    Object.assign(el.style, { left: x + 'px', top: y + 'px' });
    fx.appendChild(el);
    el.animate([{ transform: 'translate(-50%,-50%) scale(.4)', opacity: 0 }, { transform: 'translate(-50%,-90%) scale(1.1)', opacity: 1, offset: 0.25 }, { transform: 'translate(-50%,-220%) scale(1)', opacity: 0 }],
      { duration: 1000, easing: 'ease-out' }).onfinish = () => el.remove();
  }
  function confetti() {
    const cols = ['#ffd25a', '#ff5d8f', '#7fd8ff', '#8ce35a', '#c7a0ff', '#ff9b2e'];
    const W = app.clientWidth, H = app.clientHeight;
    for (let i = 0; i < 70; i++) {
      const c = document.createElement('div');
      c.className = 'confetti';
      c.style.left = Math.random() * W + 'px';
      c.style.background = cols[i % cols.length];
      fx.appendChild(c);
      const dx = (Math.random() - 0.5) * 160, rot = (Math.random() - 0.5) * 1080;
      c.animate([{ transform: 'translate(0,0) rotate(0)' }, { transform: `translate(${dx}px,${H + 40}px) rotate(${rot}deg)` }],
        { duration: 1800 + Math.random() * 1400, delay: Math.random() * 400, easing: 'cubic-bezier(.3,.4,.6,1)' }).onfinish = () => c.remove();
    }
  }

  // ---------- UI ----------
  function hud() {
    $('#lvl').textContent = G ? G.level : S.level;
    $('#coins').textContent = S.coins;
    $('#playLvl').textContent = S.level;
    document.querySelectorAll('.booster').forEach((btn) => {
      const n = S.boosters[btn.dataset.b];
      btn.classList.toggle('buy', n <= 0);
      btn.classList.toggle('disabled', n <= 0 && S.coins < PRICE);
      btn.querySelector('.count').textContent = n > 0 ? n : '+';
    });
    $('#sndBtn').classList.toggle('off', !S.sound);
    $('#musBtn').classList.toggle('off', !S.music);
  }

  function modal(html, binds = {}) {
    $('#card').innerHTML = html;
    $('#modal').classList.remove('hidden');
    for (const [id, fn] of Object.entries(binds)) {
      const b = document.getElementById(id);
      if (b) b.onclick = () => { Sound.click(); fn(); };
    }
  }
  function closeModal() { $('#modal').classList.add('hidden'); }

  let toastT = 0;
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg; t.classList.add('show');
    clearTimeout(toastT);
    toastT = setTimeout(() => t.classList.remove('show'), 1500);
  }

  function showHome() {
    G = null;
    stage.innerHTML = ''; fx.innerHTML = '';
    closeModal();
    hud();
    $('#home').classList.remove('hidden');
  }

  function toggleSound() { S.sound = !S.sound; Sound.setSound(S.sound); save(); hud(); Sound.click(); }
  function toggleMusic() { S.music = !S.music; Sound.unlock(); Sound.setMusic(S.music); save(); hud(); Sound.click(); }

  $('#playBtn').addEventListener('click', () => {
    Sound.unlock(); Sound.setMusic(S.music); Sound.click();
    $('#home').classList.add('hidden');
    startLevel(S.level);
  });
  // ---------- Exit ----------
  function exitGame() {
    closeModal();
    if (window.parent !== window) {
      // Embedded in the CIEL Games portal: ask it to close the game window.
      try { window.parent.postMessage({ action: 'closeModal' }, '*'); } catch (e) { /* ignore */ }
      return;
    }
    window.close();
    // Browsers only allow scripts to close tabs they opened; fall back gracefully.
    setTimeout(() => {
      if (window.closed) return;
      if (history.length > 1) history.back();
      else toast('You can close this tab now');
    }, 300);
  }

  function exitPrompt() {
    Sound.unlock(); Sound.click();
    modal(
      `<div class="exit-icon"><svg viewBox="0 0 24 24"><path d="M10 5H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h4M15 8l4 4-4 4M19 12H9" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
       <div class="mtitle red">Leaving so soon?</div>
       <p>Your progress is saved. Do you want to close the game?</p>
       <button class="btn green" id="mKeep">Keep Playing</button>
       <button class="btn red" id="mExit">Close Game</button>
       <div class="brand"><span class="brand-mark">CIEL</span><span class="brand-word">GAMES</span></div>`,
      { mKeep: closeModal, mExit: exitGame },
    );
  }

  $('#backBtn').addEventListener('click', exitPrompt);
  $('#modal').addEventListener('click', (e) => { if (e.target.id === 'modal' && $('#mKeep')) closeModal(); });
  $('#sndBtn').addEventListener('click', toggleSound);
  $('#musBtn').addEventListener('click', toggleMusic);
  $('#homeBtn').addEventListener('click', () => { Sound.click(); showHome(); });
  $('#settingsBtn').addEventListener('click', () => {
    if (!G) return;
    Sound.click();
    modal(
      `<div class="mtitle">Paused</div>
       <div class="set-row">
         <button class="toggle ${S.sound ? '' : 'off'}" id="mSnd">Sound</button>
         <button class="toggle ${S.music ? '' : 'off'}" id="mMus">Music</button>
       </div>
       <button class="btn green" id="mResume">Resume</button>
       <button class="btn blue" id="mRestart">Restart Level</button>
       <button class="btn" id="mHome">Home</button>
       <div class="brand"><span class="brand-mark">CIEL</span><span class="brand-word">GAMES</span></div>`,
      {
        mSnd: () => { toggleSound(); $('#mSnd').classList.toggle('off', !S.sound); },
        mMus: () => { toggleMusic(); $('#mMus').classList.toggle('off', !S.music); },
        mResume: closeModal,
        mRestart: () => startLevel(G.level),
        mHome: showHome,
      },
    );
  });

  // Home logo tiles
  [0, 9, 4].forEach((i) => {
    const el = document.createElement('div');
    el.className = 'tile';
    const img = new Image(); img.src = ICONS[i].src; img.alt = '';
    el.appendChild(img);
    $('#logoTiles').appendChild(el);
  });

  hud();
})();
