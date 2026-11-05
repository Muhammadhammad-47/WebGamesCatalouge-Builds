// All pet art is drawn procedurally on <canvas> — no external images.
const PETS = [
  { name: 'Speckled Egg',      type: 'egg',     color: '#fff3dc', spot: '#f6b26b' },
  { name: 'Chirpy Chick',      type: 'chick',   color: '#ffd84a' },
  { name: 'Kitten Puff',       type: 'cat',     color: '#ffad60', belly: '#fff1de', stripe: '#d9772f' },
  { name: 'Pudding Pup',       type: 'dog',     color: '#dcab7e', ear: '#8b5a3c', belly: '#fff1de' },
  { name: 'Mochi Bunny',       type: 'bunny',   color: '#ffcadd', belly: '#ffffff', inner: '#ff8fb5' },
  { name: 'Ember Fox',         type: 'fox',     color: '#ff7f3f', belly: '#fff6ec' },
  { name: 'Bamboo Panda',      type: 'panda',   color: '#fbfbfb', dark: '#3a3340' },
  { name: 'Cloud Koala',       type: 'koala',   color: '#aeb9cc', inner: '#f6d4e2' },
  { name: 'Frost Penguin',     type: 'penguin', color: '#3f4d73', belly: '#ffffff' },
  { name: 'Starlight Unicorn', type: 'unicorn', color: '#fff7ff' },
  { name: 'Mossy Dragon',      type: 'dragon',  color: '#72d38f', belly: '#effbd0' },
  { name: 'Sunburst Phoenix',  type: 'phoenix', color: '#ffbe3b' },
  { name: 'Cosmic Spirit',     type: 'spirit',  color: '#8d7bff' },
];

function shade(hex, amt) {
  const c = parseInt(hex.slice(1), 16);
  let r = c >> 16, g = (c >> 8) & 255, b = c & 255;
  if (amt >= 0) { r += (255 - r) * amt; g += (255 - g) * amt; b += (255 - b) * amt; }
  else { r *= 1 + amt; g *= 1 + amt; b *= 1 + amt; }
  return `rgb(${r | 0},${g | 0},${b | 0})`;
}

function renderPet(level, px) {
  const cv = document.createElement('canvas');
  cv.width = cv.height = px;
  const ctx = cv.getContext('2d');
  ctx.scale(px / 200, px / 200);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  drawPet(ctx, PETS[level - 1]);
  return cv;
}

function drawPet(ctx, p) {
  const T = p.type, C = p.color, OUT = shade(C === '#fbfbfb' || C === '#fff7ff' ? '#8a7fa0' : C, -0.45);
  const E = (x, y, rx, ry, rot = 0) => { ctx.beginPath(); ctx.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2); };
  const fs = (fill, stroke = OUT, lw = 5) => {
    ctx.fillStyle = fill; ctx.fill();
    if (stroke) { ctx.lineWidth = lw; ctx.strokeStyle = stroke; ctx.stroke(); }
  };
  const grad = (col, x, y, r) => {
    const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.45, r * 0.05, x, y, r * 1.15);
    g.addColorStop(0, shade(col, 0.45)); g.addColorStop(0.55, col); g.addColorStop(1, shade(col, -0.15));
    return g;
  };
  const star = (x, y, r, col) => {
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = i * Math.PI / 4, rr = i % 2 ? r * 0.35 : r;
      ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
    }
    ctx.closePath(); ctx.fillStyle = col; ctx.fill();
  };

  // Glow for legendary pets
  if (T === 'unicorn' || T === 'phoenix' || T === 'spirit') {
    const glowCol = T === 'unicorn' ? '255,190,250' : T === 'phoenix' ? '255,200,80' : '160,140,255';
    const g = ctx.createRadialGradient(100, 105, 20, 100, 105, 100);
    g.addColorStop(0, `rgba(${glowCol},.7)`); g.addColorStop(1, `rgba(${glowCol},0)`);
    ctx.fillStyle = g; ctx.fillRect(0, 0, 200, 200);
  }

  // Ground shadow
  E(100, 183, 56, 9); ctx.fillStyle = 'rgba(40,30,60,.18)'; ctx.fill();

  if (T === 'egg') { drawEgg(); return; }

  // ---------- behind body ----------
  if (T === 'fox') {
    E(160, 140, 22, 38, -0.7); fs(grad(C, 160, 140, 38));
    E(175, 118, 12, 14, -0.7); fs('#fff6ec', null);
  }
  if (T === 'dragon') {
    wings('#4fae6a', '#a6e8b6');
    ctx.beginPath(); ctx.moveTo(140, 150); ctx.quadraticCurveTo(185, 165, 182, 128);
    ctx.lineTo(192, 120); ctx.lineTo(176, 118); ctx.quadraticCurveTo(170, 145, 135, 135); ctx.closePath();
    fs(grad(C, 160, 140, 30));
  }
  if (T === 'phoenix') {
    for (let i = -1; i <= 1; i++) {
      E(100 + i * 22, 168, 10, 30, i * 0.5); fs(i === 0 ? '#ff5b3a' : '#ff8a3d');
    }
    wings('#ff6a3d', '#ffd36b');
  }
  if (T === 'spirit') {
    ctx.save(); ctx.globalAlpha = 0.85; wings('#b6a8ff', '#efeaff'); ctx.restore();
  }

  // Ears behind the head
  if (T === 'cat' || T === 'fox') {
    for (const s of [-1, 1]) {
      ctx.beginPath(); ctx.moveTo(100 + s * 20, 70); ctx.lineTo(100 + s * 56, 24); ctx.lineTo(100 + s * 68, 84); ctx.closePath();
      fs(grad(C, 100 + s * 50, 50, 40));
      ctx.beginPath(); ctx.moveTo(100 + s * 32, 68); ctx.lineTo(100 + s * 54, 40); ctx.lineTo(100 + s * 60, 76); ctx.closePath();
      fs(T === 'fox' ? '#5a2a1a' : '#ffb3c6', null);
    }
  }
  if (T === 'bunny') {
    for (const s of [-1, 1]) {
      E(100 + s * 26, 34, 15, 40, s * 0.18); fs(grad(C, 100 + s * 26, 34, 40));
      E(100 + s * 26, 38, 7, 28, s * 0.18); fs(p.inner, null);
    }
  }
  if (T === 'panda') {
    for (const s of [-1, 1]) { E(100 + s * 48, 62, 22, 22); fs(p.dark, '#221d27'); }
  }
  if (T === 'koala') {
    for (const s of [-1, 1]) {
      E(100 + s * 58, 74, 32, 30); fs(grad(C, 100 + s * 58, 74, 32));
      E(100 + s * 58, 76, 18, 17); fs(p.inner, null);
    }
  }
  if (T === 'dragon') {
    for (const s of [-1, 1]) {
      ctx.beginPath(); ctx.moveTo(100 + s * 18, 62); ctx.quadraticCurveTo(100 + s * 34, 18, 100 + s * 50, 26);
      ctx.quadraticCurveTo(100 + s * 40, 45, 100 + s * 42, 66); ctx.closePath(); fs('#fff3c4', '#b08b4a');
    }
  }

  // ---------- body ----------
  const bodyRy = T === 'penguin' ? 64 : 60;
  E(100, 114, 66, bodyRy); fs(grad(C, 100, 114, 66));

  // Belly / markings
  if (p.belly && T !== 'penguin') { E(100, 140, 36, 25); fs(p.belly, null); }
  if (T === 'penguin') {
    E(83, 108, 28, 28); fs('#fff', null); E(117, 108, 28, 28); fs('#fff', null);
    E(100, 138, 40, 32); fs('#fff', null);
    for (const s of [-1, 1]) { E(100 + s * 64, 125, 12, 26, s * -0.35); fs(grad(C, 100 + s * 64, 125, 26)); }
  }
  if (T === 'cat') {
    ctx.strokeStyle = p.stripe; ctx.lineWidth = 5;
    for (const dx of [-12, 0, 12]) { ctx.beginPath(); ctx.moveTo(100 + dx, 56); ctx.lineTo(100 + dx * 0.8, 72); ctx.stroke(); }
  }
  if (T === 'dog') { E(124, 98, 18, 16, 0.3); fs('rgba(139,90,60,.45)', null); }
  if (T === 'fox') { E(100, 132, 46, 30); fs(p.belly, null); }
  if (T === 'panda') {
    for (const s of [-1, 1]) { E(100 + s * 24, 106, 15, 19, s * -0.5); fs(p.dark, null); }
  }
  if (T === 'chick') {
    for (const s of [-1, 1]) { E(100 + s * 64, 125, 14, 22, s * -0.5); fs(grad(C, 100 + s * 64, 125, 22)); }
  }
  if (T === 'dragon') {
    ctx.strokeStyle = 'rgba(120,150,80,.5)'; ctx.lineWidth = 3;
    for (const dy of [130, 142, 154]) { ctx.beginPath(); ctx.moveTo(78, dy); ctx.quadraticCurveTo(100, dy + 5, 122, dy); ctx.stroke(); }
  }
  if (T === 'spirit') {
    star(70, 145, 7, 'rgba(255,255,255,.85)'); star(135, 150, 5, 'rgba(255,255,255,.8)');
    star(128, 72, 4, 'rgba(255,255,255,.7)'); star(62, 90, 4, 'rgba(255,255,255,.7)');
  }

  // Feet
  if (T !== 'spirit') {
    const footCol = T === 'penguin' || T === 'chick' || T === 'phoenix' ? '#ff9a3c' : T === 'unicorn' ? '#d8c2ff' : shade(C, -0.08);
    for (const s of [-1, 1]) { E(100 + s * 26, 170, 17, 10); fs(footCol); }
  }

  // ---------- face ----------
  const happy = T === 'spirit';
  const eyeY = 104, eyeDX = 24;
  for (const s of [-1, 1]) {
    const x = 100 + s * eyeDX;
    if (happy) {
      ctx.beginPath(); ctx.moveTo(x - 9, eyeY + 3); ctx.quadraticCurveTo(x, eyeY - 9, x + 9, eyeY + 3);
      ctx.lineWidth = 5; ctx.strokeStyle = '#2b1d3a'; ctx.stroke();
    } else {
      E(x, eyeY, 9, 10); ctx.fillStyle = T === 'panda' ? '#000' : '#2b1d2a'; ctx.fill();
      E(x - 3, eyeY - 4, 3.6, 3.6); ctx.fillStyle = '#fff'; ctx.fill();
      E(x + 3, eyeY + 3, 1.6, 1.6); ctx.fill();
    }
    E(100 + s * 40, 122, 10, 6); ctx.fillStyle = 'rgba(255,100,140,.42)'; ctx.fill();
  }

  if (T === 'chick' || T === 'penguin' || T === 'phoenix') {
    ctx.beginPath(); ctx.moveTo(90, 116); ctx.lineTo(110, 116); ctx.lineTo(100, 128); ctx.closePath();
    fs('#ff9a3c', '#c0611d', 3);
  } else {
    if (T === 'dog' || T === 'koala' || T === 'panda' || T === 'fox' || T === 'cat' || T === 'bunny') {
      E(100, 114, T === 'koala' ? 9 : 5, T === 'koala' ? 7 : 3.5); ctx.fillStyle = '#3a2630'; ctx.fill();
    }
    if (T === 'dragon') { E(94, 116, 2, 2); E(106, 116, 2, 2); ctx.fillStyle = '#2f6b40'; ctx.fill(); }
    ctx.beginPath(); ctx.moveTo(92, 120); ctx.quadraticCurveTo(96, 126, 100, 120); ctx.quadraticCurveTo(104, 126, 108, 120);
    ctx.lineWidth = 3.5; ctx.strokeStyle = '#3a2630'; ctx.stroke();
  }

  // ---------- front extras ----------
  if (T === 'dog') {
    for (const s of [-1, 1]) { E(100 + s * 60, 92, 17, 33, s * -0.35); fs(grad(p.ear, 100 + s * 60, 92, 33), shade(p.ear, -0.4)); }
  }
  if (T === 'chick') {
    ctx.strokeStyle = shade(C, -0.35); ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(100, 56); ctx.quadraticCurveTo(92, 36, 104, 30); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(100, 56); ctx.quadraticCurveTo(112, 40, 120, 42); ctx.stroke();
  }
  if (T === 'unicorn') {
    const mane = ['#ff9ec7', '#ffcf7a', '#9ee6a6', '#8fd3ff', '#c3a6ff'];
    for (let i = 0; i < 6; i++) {
      const a = Math.PI * (1.05 + i * 0.12);
      E(100 + Math.cos(a) * 62, 112 + Math.sin(a) * 56, 16, 16); fs(mane[i % 5], null);
    }
    ctx.beginPath(); ctx.moveTo(86, 60); ctx.lineTo(100, 8); ctx.lineTo(114, 60); ctx.closePath();
    const hg = ctx.createLinearGradient(86, 0, 114, 0); hg.addColorStop(0, '#ffe58a'); hg.addColorStop(1, '#f5b93c');
    fs(hg, '#b9862a', 4);
    ctx.strokeStyle = '#d99a2b'; ctx.lineWidth = 2.5;
    for (const y of [24, 36, 48]) { ctx.beginPath(); ctx.moveTo(100 - (y - 8) * 0.25, y + 3); ctx.lineTo(100 + (y - 8) * 0.25, y - 3); ctx.stroke(); }
  }
  if (T === 'phoenix') {
    const flames = [['#ff4d2e', -18, 40, -0.4], ['#ffd34d', 18, 40, 0.4], ['#ff7a2e', 0, 30, 0]];
    for (const [col, dx, len, rot] of flames) {
      ctx.save(); ctx.translate(100 + dx, 58); ctx.rotate(rot);
      ctx.beginPath(); ctx.moveTo(0, 6); ctx.quadraticCurveTo(-14, -len * 0.4, 0, -len); ctx.quadraticCurveTo(14, -len * 0.4, 0, 6);
      fs(col, '#c2421d', 3); ctx.restore();
    }
  }
  if (T === 'spirit') {
    E(100, 40, 34, 9); ctx.lineWidth = 6; ctx.strokeStyle = '#ffd95e'; ctx.stroke();
    star(100, 22, 12, '#fff3a8');
  }

  function wings(col, tip) {
    for (const s of [-1, 1]) {
      ctx.beginPath(); ctx.moveTo(100 + s * 40, 96);
      ctx.quadraticCurveTo(100 + s * 80, 40, 100 + s * 96, 58);
      ctx.quadraticCurveTo(100 + s * 82, 72, 100 + s * 94, 88);
      ctx.quadraticCurveTo(100 + s * 78, 96, 100 + s * 88, 114);
      ctx.quadraticCurveTo(100 + s * 70, 118, 100 + s * 52, 138);
      ctx.closePath();
      const g = ctx.createLinearGradient(100 + s * 40, 0, 100 + s * 96, 0);
      g.addColorStop(0, col); g.addColorStop(1, tip);
      fs(g, shade(col.length === 7 ? col : '#888888', -0.4));
    }
  }

  function drawEgg() {
    ctx.beginPath(); ctx.moveTo(100, 30);
    ctx.bezierCurveTo(146, 30, 160, 110, 156, 128);
    ctx.bezierCurveTo(152, 168, 128, 178, 100, 178);
    ctx.bezierCurveTo(72, 178, 48, 168, 44, 128);
    ctx.bezierCurveTo(40, 110, 54, 30, 100, 30); ctx.closePath();
    fs(grad(C, 100, 110, 70), '#c99a5e');
    ctx.save(); ctx.clip();
    for (const [x, y, r] of [[72, 70, 10], [128, 84, 13], [62, 150, 12], [140, 150, 9], [104, 58, 6], [100, 160, 7]]) {
      E(x, y, r, r * 0.85); ctx.fillStyle = p.spot; ctx.globalAlpha = 0.75; ctx.fill();
    }
    ctx.globalAlpha = 1; ctx.restore();
    for (const s of [-1, 1]) {
      E(100 + s * 18, 118, 7, 8); ctx.fillStyle = '#2b1d2a'; ctx.fill();
      E(100 + s * 18 - 2, 115, 2.6, 2.6); ctx.fillStyle = '#fff'; ctx.fill();
      E(100 + s * 32, 132, 8, 5); ctx.fillStyle = 'rgba(255,100,140,.4)'; ctx.fill();
    }
    ctx.beginPath(); ctx.moveTo(94, 132); ctx.quadraticCurveTo(100, 138, 106, 132);
    ctx.lineWidth = 3.5; ctx.strokeStyle = '#3a2630'; ctx.stroke();
  }
}
