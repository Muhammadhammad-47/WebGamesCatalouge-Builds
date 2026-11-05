(() => {
  'use strict';

  const COLS = 6, ROWS = 6, N = COLS * ROWS, MAX = PETS.length;
  const SAVE_KEY = 'petMergeHaven.v2';
  // Tiles open at the start: a small 2x3 patch in the middle of the yard.
  const START_OPEN = [8, 9, 14, 15, 20, 21];
  const $ = (s) => document.querySelector(s);

  const IMGS = PETS.map((_, i) => renderPet(i + 1, 180).toDataURL());
  const LOCK_SVG = '<svg class="lock" viewBox="0 0 24 24"><rect x="5" y="10" width="14" height="11" rx="2.5" fill="currentColor"/><path d="M8 10V7.5a4 4 0 0 1 8 0V10" fill="none" stroke="currentColor" stroke-width="2.6"/></svg>';

  const UPG = {
    egg: {
      name: 'Golden Nest', icon: '🪺', bg: '#ffe9a8', max: MAX - 6,
      desc: (l) => `New eggs hatch as ${PETS[Math.min(l + 1, MAX - 1)].name}`,
      cost: (l) => Math.floor(900 * Math.pow(28, l)),
    },
    hatch: {
      name: 'Warm Incubator', icon: '🔥', bg: '#ffd6c4', max: 8,
      desc: (l) => `Free egg every ${hatchInterval(l + 1).toFixed(1)}s (now ${hatchInterval(l).toFixed(1)}s)`,
      cost: (l) => Math.floor(150 * Math.pow(3, l)),
    },
    charm: {
      name: 'Lucky Clover', icon: '🍀', bg: '#d4f5cf', max: 30,
      desc: (l) => `+25% coins from every pet (now +${l * 25}%)`,
      cost: (l) => Math.floor(400 * Math.pow(3.1, l)),
    },
  };

  // ---------- state ----------
  let S = load() || fresh();

  function fresh() {
    const grid = Array(N).fill(0), open = Array(N).fill(0);
    START_OPEN.forEach((i) => (open[i] = 1));
    grid[14] = 1; grid[15] = 1; grid[20] = 1;
    return {
      coins: 20, grid, open, bought: 0, maxLevel: 1, discovered: [1],
      upg: { egg: 0, hatch: 0, charm: 0 }, orders: [null, null, null], served: 0,
      level: 1, xp: 0, hatchT: 0, last: Date.now(), sound: true,
    };
  }
  function load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      const s = JSON.parse(raw);
      if (!Array.isArray(s.grid) || s.grid.length !== N || !Array.isArray(s.open)) return null;
      return Object.assign(fresh(), s);
    } catch (e) { return null; }
  }
  function save() {
    S.last = Date.now();
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) {}
  }

  // ---------- economy ----------
  const baseIncome = (L) => Math.round(Math.pow(2.3, L - 1));
  const income = (L) => baseIncome(L) * (1 + 0.25 * S.upg.charm);
  const totalIncome = () => S.grid.reduce((a, L) => a + (L ? income(L) : 0), 0);
  const eggCost = () => Math.floor(15 * Math.pow(1.07, S.bought));
  const spawnLevel = () => 1 + S.upg.egg;
  function hatchInterval(l = S.upg.hatch) { return Math.max(2, 8 - 0.75 * l); }
  const sellValue = (L) => Math.floor(income(L) * 12);
  const openCount = () => S.open.reduce((a, b) => a + b, 0);
  const unlockCost = () => Math.floor(30 * Math.pow(1.45, openCount() - START_OPEN.length));
  const xpNeed = (lv) => Math.floor(10 * Math.pow(1.45, lv - 1));

  function neighbors(i) {
    const r = Math.floor(i / COLS), c = i % COLS, out = [];
    if (r > 0) out.push(i - COLS);
    if (r < ROWS - 1) out.push(i + COLS);
    if (c > 0) out.push(i - 1);
    if (c < COLS - 1) out.push(i + 1);
    return out;
  }
  const buyable = (i) => !S.open[i] && neighbors(i).some((j) => S.open[j]);

  function fmt(n) {
    n = Math.floor(n);
    if (n < 1000) return String(n);
    const u = ['K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp'];
    let i = -1;
    while (n >= 1000 && i < u.length - 1) { n /= 1000; i++; }
    return (n < 10 ? n.toFixed(2) : n < 100 ? n.toFixed(1) : Math.floor(n)) + u[i];
  }

  // ---------- audio ----------
  let AC;
  function tone(f, d = 0.1, type = 'sine', vol = 0.15, slide = 0) {
    if (!S.sound) return;
    try {
      AC = AC || new (window.AudioContext || window.webkitAudioContext)();
      const t = AC.currentTime, o = AC.createOscillator(), g = AC.createGain();
      o.type = type; o.frequency.setValueAtTime(f, t);
      if (slide) o.frequency.exponentialRampToValueAtTime(f * slide, t + d);
      g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + d);
      o.connect(g).connect(AC.destination); o.start(t); o.stop(t + d + 0.02);
    } catch (e) {}
  }
  const SFX = {
    merge: (l) => { tone(300 + l * 50, 0.15, 'triangle', 0.2, 2); setTimeout(() => tone(500 + l * 70, 0.2, 'sine', 0.14, 1.5), 70); },
    pop: () => tone(620, 0.07, 'sine', 0.1, 1.5),
    tap: () => tone(1100, 0.06, 'square', 0.035, 1.3),
    buy: () => tone(420, 0.12, 'triangle', 0.16, 1.7),
    bad: () => tone(170, 0.16, 'sawtooth', 0.07, 0.7),
    cash: () => { tone(880, 0.08, 'square', 0.05); setTimeout(() => tone(1320, 0.12, 'square', 0.05), 80); },
    unlock: () => { tone(330, 0.1, 'square', 0.06, 1.5); setTimeout(() => tone(660, 0.18, 'triangle', 0.14, 1.3), 90); },
    fanfare: () => [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => tone(f, 0.25, 'triangle', 0.16), i * 110)),
  };

  // ---------- DOM ----------
  const board = $('#board'), ordersEl = $('#orders'), fx = $('#fx');
  const cells = [];
  for (let i = 0; i < N; i++) {
    const c = document.createElement('div');
    c.className = 'cell'; c.dataset.i = i;
    board.appendChild(c); cells.push(c);
  }

  function renderCell(i, anim) {
    const c = cells[i], L = S.grid[i];
    const alt = (Math.floor(i / COLS) + (i % COLS)) % 2 === 1;
    c.className = 'cell' + (alt ? ' alt' : '');
    c.innerHTML = '';
    if (!S.open[i]) {
      c.classList.add('locked');
      if (buyable(i)) {
        c.classList.add('buyable');
        c.innerHTML = `<div class="price"><i class="coin"></i>${fmt(unlockCost())}</div>`;
        if (S.coins >= unlockCost()) c.classList.add('afford');
      } else c.innerHTML = LOCK_SVG;
      return;
    }
    if (L) {
      const im = new Image();
      im.src = IMGS[L - 1]; im.className = 'pet'; im.draggable = false; im.alt = PETS[L - 1].name;
      im.style.animationDelay = (-Math.random() * 2.4).toFixed(2) + 's';
      c.appendChild(im);
      const b = document.createElement('span'); b.className = 'lv'; b.textContent = L; c.appendChild(b);
      if (anim) { void c.offsetWidth; c.classList.add('pop'); }
    }
  }
  function renderLocked() { for (let i = 0; i < N; i++) if (!S.open[i]) renderCell(i); }
  function renderAll() { for (let i = 0; i < N; i++) renderCell(i); renderOrders(); renderHUD(); renderXP(); }

  let lastAfford = null;
  function renderHUD() {
    $('#coins').textContent = fmt(S.coins);
    $('#rate').textContent = fmt(totalIncome()) + '/s';
    const cost = eggCost();
    $('#cost').textContent = fmt(cost);
    $('#buyBtn').classList.toggle('disabled', S.coins < cost || !emptyCells().length);
    $('#buyIcon').src = IMGS[spawnLevel() - 1];
    $('#soundBtn').classList.toggle('muted', !S.sound);
    const afford = S.coins >= unlockCost();
    if (afford !== lastAfford) {
      lastAfford = afford;
      document.querySelectorAll('.cell.buyable').forEach((c) => c.classList.toggle('afford', afford));
    }
  }
  function renderXP() {
    const need = xpNeed(S.level);
    $('#lvl').textContent = S.level;
    $('#xpFill').style.width = Math.min(100, (S.xp / need) * 100) + '%';
    $('#xpText').textContent = `${fmt(S.xp)} / ${fmt(need)} XP`;
  }

  function renderOrders() {
    ordersEl.innerHTML = '';
    S.orders.forEach((o, k) => {
      const d = document.createElement('div');
      d.dataset.k = k;
      if (o && o.level) {
        const known = S.discovered.includes(o.level);
        d.className = 'order' + (S.grid.includes(o.level) ? ' ready' : '');
        d.innerHTML = `<img src="${IMGS[o.level - 1]}" class="${known ? '' : 'unknown'}" alt="">
          <div class="otxt"><div class="oname">${known ? PETS[o.level - 1].name : 'Merge to discover!'}</div>
          <div class="reward"><i class="coin sm"></i>${fmt(o.reward)}</div></div>`;
      } else {
        d.className = 'order empty';
        d.innerHTML = '<div class="wait">A new family<br>is on the way…</div>';
      }
      ordersEl.appendChild(d);
    });
  }

  // ---------- fx ----------
  function centerOf(el) { const r = el.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; }
  function floatText(x, y, text, cls = '') {
    const d = document.createElement('div');
    d.className = 'float ' + cls;
    d.textContent = text; d.style.left = x + 'px'; d.style.top = y + 'px';
    fx.appendChild(d); setTimeout(() => d.remove(), 1000);
  }
  function sparks(x, y, n = 12) {
    const cols = ['#ffd23a', '#ff7fa8', '#7fd3ff', '#9be67a', '#ffffff'];
    for (let k = 0; k < n; k++) {
      const s = document.createElement('div');
      s.className = 'spark';
      const a = Math.random() * Math.PI * 2, r = 30 + Math.random() * 40;
      s.style.left = x - 5 + 'px'; s.style.top = y - 5 + 'px';
      s.style.background = cols[k % cols.length];
      s.style.setProperty('--dx', Math.cos(a) * r + 'px'); s.style.setProperty('--dy', Math.sin(a) * r + 'px');
      fx.appendChild(s); setTimeout(() => s.remove(), 600);
    }
  }
  let toastT;
  function toast(msg) {
    const t = $('#toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 1800);
  }
  function shake(el) { el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); }

  // ---------- modal ----------
  const modal = $('#modal'), card = $('#modalCard');
  const modalQueue = [];
  function openModal(html, onBind) {
    if (!modal.classList.contains('hidden')) { modalQueue.push([html, onBind]); return; }
    card.innerHTML = html; modal.classList.remove('hidden');
    card.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', closeModal));
    if (onBind) onBind(card);
  }
  function closeModal() {
    modal.classList.add('hidden');
    if (modalQueue.length) { const [h, b] = modalQueue.shift(); setTimeout(() => openModal(h, b), 120); }
  }
  modal.addEventListener('pointerdown', (e) => { if (e.target === modal) closeModal(); });

  function showDiscovery(L) {
    SFX.fanfare();
    openModal(`<h2>New pet!</h2><img class="hero" src="${IMGS[L - 1]}" alt="">
      <p style="font-size:22px;color:var(--ink);font-weight:700;margin-top:4px">${PETS[L - 1].name}</p>
      <p>Level ${L} · earns <b>${fmt(income(L))}</b> coins/sec</p>
      ${L === MAX ? '<p><b>You found the rarest pet of all!</b></p>' : ''}
      <div class="actions"><button class="btn go" data-close>Yay!</button></div>`);
  }

  function showBook() {
    const items = PETS.map((p, i) => {
      const L = i + 1, known = S.discovered.includes(L);
      return `<div class="${known ? '' : 'locked'}"><img src="${IMGS[i]}" alt="">${known ? p.name : '???'}
        <small>Lv ${L}${known ? ' · ' + fmt(income(L)) + '/s' : ''}</small></div>`;
    }).join('');
    openModal(`<h2>Pet Collection</h2><p>${S.discovered.length} / ${MAX} discovered · ${S.served} adoptions</p>
      <div class="book">${items}</div><div class="actions"><button class="btn go" data-close>Close</button></div>`);
  }

  function showShop() {
    const body = () => Object.entries(UPG).map(([k, u]) => {
      const l = S.upg[k], maxed = l >= u.max, c = maxed ? 0 : u.cost(l);
      return `<div class="shop-item"><div class="ic" style="background:${u.bg}">${u.icon}</div>
        <div class="txt"><b>${u.name} <small>Lv ${l}</small></b><small>${maxed ? 'Maxed out!' : u.desc(l)}</small></div>
        <button class="btn ${maxed || S.coins < c ? 'disabled' : ''}" data-up="${k}">${maxed ? 'MAX' : `<i class="coin sm"></i>${fmt(c)}`}</button></div>`;
    }).join('');
    const bind = (root) => {
      root.querySelectorAll('[data-up]').forEach((b) => b.addEventListener('click', () => {
        const k = b.dataset.up, u = UPG[k], l = S.upg[k];
        if (l >= u.max) return;
        const c = u.cost(l);
        if (S.coins < c) { SFX.bad(); shake(b); return; }
        S.coins -= c; S.upg[k]++; SFX.buy(); save();
        root.querySelector('#shopList').innerHTML = body(); bind(root); renderAll();
      }));
      const r = root.querySelector('.reset');
      if (r) r.onclick = () => {
        if (confirm('Reset all progress? This cannot be undone.')) {
          S = fresh(); save(); closeModal(); lastAfford = null; renderAll();
        }
      };
    };
    openModal(`<h2>Shop</h2><div id="shopList">${body()}</div>
      <div class="actions"><button class="btn go" data-close>Close</button></div>
      <button class="reset">Reset progress</button>`, bind);
  }

  // ---------- core actions ----------
  function emptyCells() { const e = []; for (let i = 0; i < N; i++) if (S.open[i] && !S.grid[i]) e.push(i); return e; }

  function addCoins(v) { S.coins += v; }

  function addXP(v, x, y) {
    S.xp += v;
    if (x != null) floatText(x, y + 14, `+${fmt(v)} XP`, 'xp');
    while (S.xp >= xpNeed(S.level)) {
      S.xp -= xpNeed(S.level); S.level++;
      const bonus = Math.max(50, Math.round(totalIncome() * 30));
      addCoins(bonus);
      SFX.fanfare();
      openModal(`<h2>Level ${S.level}!</h2>
        <p style="font-size:18px">Your pet haven is growing.</p>
        <p>Level-up bonus: <b style="color:var(--ink)">${fmt(bonus)}</b> coins</p>
        <div class="actions"><button class="btn go" data-close>Great!</button></div>`);
      renderHUD();
    }
    renderXP();
  }

  function spawn(level) {
    const e = emptyCells();
    if (!e.length) return false;
    const i = e[(Math.random() * e.length) | 0];
    S.grid[i] = level; renderCell(i, true); SFX.pop();
    discover(level);
    renderOrders();
    return true;
  }

  function buyEgg() {
    const c = eggCost();
    if (!emptyCells().length) { SFX.bad(); shake($('#buyBtn')); toast('No free tiles — merge pets or unlock more tiles!'); return; }
    if (S.coins < c) { SFX.bad(); shake($('#buyBtn')); toast('Not enough coins yet!'); return; }
    S.coins -= c; S.bought++; spawn(spawnLevel()); SFX.buy(); renderHUD();
  }

  function tryUnlock(i) {
    if (!buyable(i)) { SFX.bad(); shake(cells[i]); toast('Unlock the tiles next to your yard first!'); return; }
    const c = unlockCost();
    if (S.coins < c) { SFX.bad(); shake(cells[i]); toast(`You need ${fmt(c)} coins to unlock this tile.`); return; }
    S.coins -= c; S.open[i] = 1;
    lastAfford = null;
    renderLocked(); renderCell(i);
    cells[i].classList.add('unlocking');
    const [x, y] = centerOf(cells[i]); sparks(x, y, 14); SFX.unlock();
    addXP(3, x, y);
    renderHUD(); save();
    if (openCount() === N) toast('Your whole yard is unlocked!');
  }

  function discover(L) {
    if (S.discovered.includes(L)) return;
    S.discovered.push(L);
    S.maxLevel = Math.max(S.maxLevel, L);
    showDiscovery(L);
    save();
  }

  function merge(from, to) {
    const L = S.grid[from] + 1;
    S.grid[from] = 0; S.grid[to] = L;
    renderCell(from); renderCell(to, true);
    const [x, y] = centerOf(cells[to]);
    sparks(x, y, 14); SFX.merge(L);
    discover(L);
    addXP(L, x, y);
    renderOrders(); renderHUD();
  }

  function fulfill(from, k) {
    const o = S.orders[k];
    const reward = o.reward, L = o.level;
    S.grid[from] = 0; renderCell(from);
    addCoins(reward); S.served++;
    const el = ordersEl.children[k], [x, y] = centerOf(el);
    floatText(x, y, '+' + fmt(reward), 'big'); sparks(x, y, 16); SFX.cash();
    addXP(L * 4, x, y + 10);
    S.orders[k] = { until: Date.now() + 3500 };
    renderOrders(); renderHUD(); save();
  }

  function newOrder() {
    const lo = Math.max(spawnLevel() + 1, S.maxLevel - 2);
    let hi = Math.max(lo, S.maxLevel);
    if (S.maxLevel < MAX && Math.random() < 0.2) hi = S.maxLevel + 1;
    const level = Math.min(MAX, lo + Math.floor(Math.random() * (hi - lo + 1)));
    const reward = Math.round(income(level) * (40 + Math.random() * 30) + 25);
    return { level, reward };
  }

  // ---------- drag & drop ----------
  let drag = null;
  function targetAt(x, y) {
    const el = document.elementFromPoint(x, y);
    if (!el) return null;
    const c = el.closest('.cell'); if (c) return { kind: 'cell', el: c, i: +c.dataset.i };
    const o = el.closest('.order'); if (o) return { kind: 'order', el: o, k: +o.dataset.k };
    const s = el.closest('#sell'); if (s) return { kind: 'sell', el: s };
    return null;
  }
  function clearOver() { document.querySelectorAll('.over').forEach((e) => e.classList.remove('over')); }

  board.addEventListener('pointerdown', (e) => {
    const c = e.target.closest('.cell');
    if (!c || drag) return;
    const i = +c.dataset.i;
    if (!S.open[i]) { e.preventDefault(); tryUnlock(i); return; }
    if (!S.grid[i]) return;
    e.preventDefault();
    drag = { i, x0: e.clientX, y0: e.clientY, moved: false, ghost: null, id: e.pointerId };
  });

  window.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    if (!drag.moved && Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) > 6) {
      drag.moved = true;
      const L = S.grid[drag.i], size = cells[drag.i].getBoundingClientRect().width;
      const g = new Image(); g.id = 'ghost'; g.src = IMGS[L - 1];
      g.style.width = g.style.height = size + 'px';
      document.body.appendChild(g); drag.ghost = g;
      cells[drag.i].classList.add('dragging');
      S.grid.forEach((l, j) => { if (j !== drag.i && S.open[j] && l === L && L < MAX) cells[j].classList.add('match'); });
    }
    if (drag.moved) {
      drag.ghost.style.left = e.clientX + 'px'; drag.ghost.style.top = e.clientY + 'px';
      clearOver();
      const t = targetAt(e.clientX, e.clientY);
      if (t && !(t.kind === 'cell' && (t.i === drag.i || !S.open[t.i]))) t.el.classList.add('over');
    }
  });

  function endDrag(e) {
    if (!drag || e.pointerId !== drag.id) return;
    const d = drag; drag = null;
    clearOver();
    document.querySelectorAll('.match').forEach((c) => c.classList.remove('match'));
    if (!d.moved) { tapPet(d.i); return; }
    d.ghost.remove(); cells[d.i].classList.remove('dragging');
    if (e.type === 'pointercancel') return;

    const t = targetAt(e.clientX, e.clientY), L = S.grid[d.i];
    if (!t) return;
    if (t.kind === 'cell') {
      const j = t.i;
      if (j === d.i) return;
      if (!S.open[j]) { SFX.bad(); shake(cells[j]); return; }
      if (!S.grid[j]) { S.grid[j] = L; S.grid[d.i] = 0; renderCell(d.i); renderCell(j, true); SFX.pop(); }
      else if (S.grid[j] === L && L < MAX) merge(d.i, j);
      else { S.grid[d.i] = S.grid[j]; S.grid[j] = L; renderCell(d.i, true); renderCell(j, true); SFX.pop(); }
      renderOrders();
    } else if (t.kind === 'order') {
      const o = S.orders[t.k];
      if (o && o.level === L) fulfill(d.i, t.k);
      else { SFX.bad(); shake(t.el); if (o && o.level) toast(`This family wants a ${S.discovered.includes(o.level) ? PETS[o.level - 1].name : 'pet you have not discovered yet'}!`); }
    } else if (t.kind === 'sell') {
      const v = sellValue(L);
      S.grid[d.i] = 0; renderCell(d.i); addCoins(v);
      const [x, y] = centerOf(t.el); floatText(x, y - 30, '+' + fmt(v)); SFX.cash();
      renderOrders(); renderHUD();
    }
    save();
  }
  window.addEventListener('pointerup', endDrag);
  window.addEventListener('pointercancel', endDrag);

  function tapPet(i) {
    const L = S.grid[i]; if (!L) return;
    const c = cells[i]; c.classList.remove('tap'); void c.offsetWidth; c.classList.add('tap');
    const v = income(L); addCoins(v);
    const [x, y] = centerOf(c); floatText(x, y - 20, '+' + fmt(v)); SFX.tap(); renderHUD();
  }

  // ---------- full screen ----------
  function isFull() { return document.fullscreenElement || document.webkitFullscreenElement; }
  async function toggleFullscreen() {
    try {
      if (isFull()) { await (document.exitFullscreen || document.webkitExitFullscreen).call(document); return; }
      const el = document.documentElement;
      await (el.requestFullscreen || el.webkitRequestFullscreen).call(el, { navigationUI: 'hide' });
      if (screen.orientation && screen.orientation.lock) screen.orientation.lock('landscape').catch(() => {});
    } catch (e) { toast('Full screen is not available in this browser.'); }
  }

  // ---------- buttons ----------
  $('#buyBtn').addEventListener('click', buyEgg);
  $('#shopBtn').addEventListener('click', showShop);
  $('#bookBtn').addEventListener('click', showBook);
  $('#fsBtn').addEventListener('click', toggleFullscreen);
  $('#soundBtn').addEventListener('click', () => { S.sound = !S.sound; renderHUD(); save(); if (S.sound) SFX.pop(); });

  // ---------- exit confirmation modal ("Leave the Tab" & "Keep Playing") ----------
  const backBtn = $('#gameBackBtn');
  const exitModal = $('#gameExitModal');
  const confirmExitBtn = $('#btnConfirmExit');
  const cancelExitBtn = $('#btnCancelExit');
  const exitModalPetImg = $('#exitModalPetImg');

  function openExitModal() {
    SFX.pop();
    if (exitModalPetImg) {
      const petIndex = Math.min(Math.max(0, S.maxLevel - 1), IMGS.length - 1);
      exitModalPetImg.src = IMGS[petIndex] || IMGS[2]; // Default to Kitten Puff or highest pet
    }
    if (exitModal) exitModal.classList.add('active');
  }

  function closeExitModal() {
    SFX.tap();
    if (exitModal) exitModal.classList.remove('active');
  }

  function doLeaveTab() {
    SFX.bad();
    save();

    // 1. If inside an iframe (e.g. CIEL games portal modal), notify parent window
    try {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({ action: 'closeModal', type: 'GAME_ENDED' }, '*');
        window.parent.postMessage('closeModal', '*');
      }
    } catch (e) {}

    // 2. Try window.close()
    try { window.close(); } catch (e) {}

    // 3. Fallback: browser history or back to game portal root
    setTimeout(() => {
      if (window.history && window.history.length > 1) {
        window.history.back();
      } else {
        window.location.href = '../';
      }
    }, 120);
  }

  if (backBtn) backBtn.addEventListener('click', openExitModal);
  if (cancelExitBtn) cancelExitBtn.addEventListener('click', closeExitModal);
  if (confirmExitBtn) confirmExitBtn.addEventListener('click', doLeaveTab);
  if (exitModal) {
    exitModal.addEventListener('click', (e) => {
      if (e.target === exitModal) closeExitModal();
    });
  }

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (exitModal && exitModal.classList.contains('active')) {
        closeExitModal();
        return;
      }
      if (!modal.classList.contains('hidden')) {
        closeModal();
        return;
      }
      openExitModal();
      return;
    }
    if (!modal.classList.contains('hidden') || (exitModal && exitModal.classList.contains('active'))) return;
    if (e.code === 'Space') { e.preventDefault(); buyEgg(); }
    if (e.code === 'KeyF') toggleFullscreen();
  });

  // ---------- ciel games loading screen & art generation ----------
  function initLoadingScreen() {
    const loadingScreen = $('#ciel-loading-screen');
    const heroCanvas = $('#loading-hero-canvas');
    const petsRow = $('#loading-pets-row');
    const progressBar = $('#ciel-progress-bar');
    const statusText = $('#ciel-loading-status');
    const percentText = $('#ciel-loading-percent');

    // 1. Procedural art generation for loading hero banner
    if (typeof renderLoadingHero === 'function' && heroCanvas) {
      try {
        renderLoadingHero(heroCanvas);
      } catch (err) {
        console.warn('Hero canvas render:', err);
      }
    }

    // 2. Procedural mini pets row generation
    if (petsRow && typeof renderPet === 'function') {
      petsRow.innerHTML = '';
      [1, 2, 3, 4, 5].forEach((lv, idx) => {
        try {
          const miniCv = renderPet(lv, 76);
          miniCv.className = 'mini-loader-pet';
          miniCv.style.animationDelay = `${idx * 0.16}s`;
          miniCv.title = PETS[lv - 1]?.name || 'Cute Pet';
          petsRow.appendChild(miniCv);
        } catch (e) {}
      });
    }

    // 3. Smooth animated loading sequence
    let currentPct = 0;
    const stages = [
      { at: 20, text: 'Waking up baby pets...' },
      { at: 50, text: 'Gathering pet treats & cushions...' },
      { at: 75, text: 'Preparing Adoption Haven...' },
      { at: 95, text: 'Finalizing cuddles & toys...' },
      { at: 100, text: 'Welcome to Pet Haven!' }
    ];

    const timer = setInterval(() => {
      // Advance progress smoothly
      const inc = Math.floor(Math.random() * 8) + 4;
      currentPct = Math.min(100, currentPct + inc);

      if (progressBar) progressBar.style.width = `${currentPct}%`;
      if (percentText) percentText.textContent = `${currentPct}%`;

      const curStage = stages.find((s) => currentPct <= s.at) || stages[stages.length - 1];
      if (statusText) statusText.textContent = curStage.text;

      if (currentPct >= 100) {
        clearInterval(timer);
        setTimeout(() => {
          if (loadingScreen) {
            loadingScreen.classList.add('fade-out');
            setTimeout(() => {
              loadingScreen.style.display = 'none';
            }, 450);
          }
        }, 300);
      }
    }, 45);
  }

  // ---------- loop ----------
  let tick = 0, lastFrame = performance.now(), acc = 0;
  function secondTick() {
    tick++;
    // Every pet pays out every 3 seconds, staggered across the board.
    for (let i = 0; i < N; i++) {
      const L = S.grid[i];
      if (!L || (i + tick) % 3) continue;
      const v = income(L) * 3; addCoins(v);
      const [x, y] = centerOf(cells[i]); floatText(x, y - 18, '+' + fmt(v));
    }
    const now = Date.now();
    let changed = false;
    S.orders = S.orders.map((o) => {
      if (!o || (o.until && now >= o.until)) { changed = true; return newOrder(); }
      return o;
    });
    if (changed) renderOrders();
    renderHUD();
    if (tick % 5 === 0) save();
  }

  function frame(t) {
    const dt = Math.min(0.25, (t - lastFrame) / 1000); lastFrame = t;
    acc += dt;
    if (acc >= 1) { acc -= 1; secondTick(); }
    const iv = hatchInterval();
    if (emptyCells().length) {
      S.hatchT += dt;
      if (S.hatchT >= iv) { S.hatchT = 0; spawn(spawnLevel()); renderHUD(); }
    } else S.hatchT = Math.min(S.hatchT + dt, iv);
    $('#hatchFill').style.width = (S.hatchT / iv) * 100 + '%';
    requestAnimationFrame(frame);
  }

  document.addEventListener('visibilitychange', () => { if (document.hidden) save(); else lastFrame = performance.now(); });
  window.addEventListener('pagehide', save);

  // ---------- boot ----------
  initLoadingScreen();
  renderAll();
  const away = Math.min(7200, (Date.now() - S.last) / 1000);
  if (away > 60 && totalIncome() > 0) {
    const earned = Math.floor(totalIncome() * away * 0.5);
    addCoins(earned);
    openModal(`<h2>Welcome back!</h2><img class="hero" src="${IMGS[S.maxLevel - 1]}" alt="">
      <p>Your pets earned <b style="color:var(--ink)">${fmt(earned)}</b> coins while you were away.</p>
      <div class="actions"><button class="btn go" data-close>Collect</button></div>`);
    renderHUD();
  }
  save();
  requestAnimationFrame(frame);
})();
