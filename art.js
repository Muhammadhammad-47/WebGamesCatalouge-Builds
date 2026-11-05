// Tile Trio — every tile icon is drawn procedurally on <canvas> (no image files).
const Art = (() => {
  const TAU = Math.PI * 2;

  function shade(hex, amt) {
    const c = parseInt(hex.slice(1), 16);
    let r = c >> 16, g = (c >> 8) & 255, b = c & 255;
    if (amt >= 0) { r += (255 - r) * amt; g += (255 - g) * amt; b += (255 - b) * amt; }
    else { r *= 1 + amt; g *= 1 + amt; b *= 1 + amt; }
    return `rgb(${r | 0},${g | 0},${b | 0})`;
  }
  const rad = (c, x, y, r, col) => {
    const g = c.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.08, x, y, r * 1.1);
    g.addColorStop(0, shade(col, 0.5)); g.addColorStop(0.55, col); g.addColorStop(1, shade(col, -0.22));
    return g;
  };
  const lin = (c, x0, y0, x1, y1, col) => {
    const g = c.createLinearGradient(x0, y0, x1, y1);
    g.addColorStop(0, shade(col, 0.35)); g.addColorStop(1, shade(col, -0.18));
    return g;
  };
  function fs(c, fill, stroke, lw = 4) {
    if (fill) { c.fillStyle = fill; c.fill(); }
    if (stroke) { c.lineWidth = lw; c.strokeStyle = stroke; c.stroke(); }
  }
  function E(c, x, y, rx, ry, rot = 0) { c.beginPath(); c.ellipse(x, y, rx, ry, rot, 0, TAU); }
  function shine(c, x, y, rx, ry, rot = -0.6, a = 0.6) {
    E(c, x, y, rx, ry, rot); c.fillStyle = `rgba(255,255,255,${a})`; c.fill();
  }
  // Leaf growing from (x,y) along the direction given by rot (0 = down, PI = up).
  function leaf(c, x, y, len, wid, rot, col = '#5cc04a', out = '#2e7a26') {
    c.save(); c.translate(x, y); c.rotate(rot);
    c.beginPath(); c.moveTo(0, 0);
    c.quadraticCurveTo(wid, len / 2, 0, len); c.quadraticCurveTo(-wid, len / 2, 0, 0);
    fs(c, lin(c, 0, 0, 0, len, col), out, 3);
    c.beginPath(); c.moveTo(0, 2); c.lineTo(0, len - 4);
    c.strokeStyle = 'rgba(30,90,30,.45)'; c.lineWidth = 1.6; c.stroke();
    c.restore();
  }
  function sparkle(c, x, y, r, col = '#fff6a8') {
    c.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = i * Math.PI / 4, rr = i % 2 ? r * 0.3 : r;
      c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
    }
    c.closePath(); c.fillStyle = col; c.fill();
  }

  const ICONS = [
    { name: 'apple', color: '#e8323f', draw(c) {
      c.beginPath(); c.moveTo(64, 38);
      c.bezierCurveTo(44, 22, 14, 34, 18, 68); c.bezierCurveTo(22, 100, 46, 118, 64, 106);
      c.bezierCurveTo(82, 118, 106, 100, 110, 68); c.bezierCurveTo(114, 34, 84, 22, 64, 38); c.closePath();
      fs(c, rad(c, 64, 70, 50, '#e8323f'), '#8e1622');
      c.beginPath(); c.moveTo(64, 40); c.quadraticCurveTo(62, 24, 70, 12);
      c.lineWidth = 6; c.strokeStyle = '#6b3f1f'; c.stroke();
      leaf(c, 68, 24, 30, 11, -2.2);
      shine(c, 40, 60, 8, 15, 0.35);
    } },
    { name: 'cherry', color: '#d81e4a', draw(c) {
      c.lineWidth = 5; c.strokeStyle = '#4f7a2a';
      c.beginPath(); c.moveTo(40, 82); c.quadraticCurveTo(46, 44, 74, 20); c.stroke();
      c.beginPath(); c.moveTo(88, 86); c.quadraticCurveTo(86, 48, 74, 20); c.stroke();
      leaf(c, 74, 20, 32, 12, -2.0);
      for (const [x, y] of [[40, 88], [88, 92]]) {
        E(c, x, y, 23, 22); fs(c, rad(c, x, y, 23, '#d81e4a'), '#7d0f28');
        shine(c, x - 9, y - 8, 5, 8, 0.5);
      }
    } },
    { name: 'lemon', color: '#ffd23a', draw(c) {
      c.save(); c.translate(62, 68); c.rotate(-0.5);
      c.beginPath(); c.moveTo(-54, 0);
      c.bezierCurveTo(-46, -42, 46, -42, 54, 0); c.bezierCurveTo(46, 42, -46, 42, -54, 0); c.closePath();
      fs(c, rad(c, 0, 0, 46, '#ffd23a'), '#b07f00');
      c.fillStyle = 'rgba(190,140,0,.28)';
      for (const [x, y] of [[-20, 10], [10, 18], [26, -6], [-6, -14], [-32, -4], [34, 12], [4, 2]]) { E(c, x, y, 2, 2); c.fill(); }
      shine(c, -14, -16, 15, 6, -0.1);
      c.restore();
      leaf(c, 104, 40, 24, 9, 2.6);
    } },
    { name: 'grapes', color: '#8a4fd6', draw(c) {
      c.lineWidth = 6; c.strokeStyle = '#6b3f1f';
      c.beginPath(); c.moveTo(64, 32); c.quadraticCurveTo(62, 18, 70, 10); c.stroke();
      leaf(c, 66, 22, 30, 13, -2.1);
      const rows = [[[64, 102]], [[53, 82], [75, 82]], [[42, 62], [64, 62], [86, 62]], [[31, 42], [53, 42], [75, 42], [97, 42]]];
      for (const row of rows) for (const [x, y] of row) {
        E(c, x, y, 13, 13); fs(c, rad(c, x, y, 13, '#8a4fd6'), '#4a2280', 3);
        shine(c, x - 4, y - 5, 3, 5, 0.5, 0.7);
      }
    } },
    { name: 'strawberry', color: '#ef3b4c', draw(c) {
      c.beginPath(); c.moveTo(64, 116);
      c.bezierCurveTo(30, 102, 14, 62, 28, 44); c.bezierCurveTo(42, 28, 86, 28, 100, 44);
      c.bezierCurveTo(114, 62, 98, 102, 64, 116); c.closePath();
      fs(c, rad(c, 64, 68, 50, '#ef3b4c'), '#8f1524');
      c.fillStyle = '#ffe58a';
      for (const [x, y] of [[44, 54], [64, 52], [84, 54], [34, 72], [54, 70], [74, 70], [94, 72], [44, 88], [64, 88], [84, 88], [54, 103], [74, 103]]) {
        E(c, x, y, 2.4, 4); c.fill();
      }
      for (const r of [1.3, 0.65, 0, -0.65, -1.3]) leaf(c, 64, 36, 24, 9, r);
      c.lineWidth = 5; c.strokeStyle = '#3f8a2a';
      c.beginPath(); c.moveTo(64, 36); c.lineTo(66, 18); c.stroke();
      shine(c, 40, 62, 6, 12, 0.4);
    } },
    { name: 'carrot', color: '#ff8a2a', draw(c) {
      c.save(); c.translate(64, 68); c.rotate(0.65);
      leaf(c, 0, -44, 30, 10, Math.PI);
      leaf(c, 0, -44, 26, 9, Math.PI + 0.5);
      leaf(c, 0, -44, 26, 9, Math.PI - 0.5);
      c.beginPath(); c.moveTo(-18, -42); c.quadraticCurveTo(0, -52, 18, -42);
      c.lineTo(4, 48); c.quadraticCurveTo(0, 54, -4, 48); c.closePath();
      fs(c, lin(c, -18, 0, 18, 0, '#ff8a2a'), '#b0510c');
      c.strokeStyle = 'rgba(150,60,0,.55)'; c.lineWidth = 3;
      for (const [y, x0, x1] of [[-24, -13, -3], [-6, 3, 11], [12, -8, -1], [28, 1, 5]]) {
        c.beginPath(); c.moveTo(x0, y); c.lineTo(x1, y + 2); c.stroke();
      }
      E(c, -8, -18, 4, 14); c.fillStyle = 'rgba(255,255,255,.45)'; c.fill();
      c.restore();
    } },
    { name: 'mushroom', color: '#e5463d', draw(c) {
      c.beginPath(); c.moveTo(50, 66); c.lineTo(46, 104); c.quadraticCurveTo(64, 114, 82, 104); c.lineTo(78, 66); c.closePath();
      fs(c, lin(c, 46, 0, 82, 0, '#fff1dc'), '#a07850');
      c.beginPath(); c.moveTo(14, 72); c.bezierCurveTo(12, 14, 116, 14, 114, 72);
      c.quadraticCurveTo(64, 86, 14, 72); c.closePath();
      fs(c, rad(c, 64, 50, 54, '#e5463d'), '#8a1d16');
      for (const [x, y, r] of [[44, 50, 8], [72, 36, 7], [94, 58, 7], [64, 62, 5], [28, 64, 4]]) {
        E(c, x, y, r, r * 0.85); fs(c, '#fffaf0', 'rgba(138,29,22,.35)', 1.5);
      }
      shine(c, 34, 42, 5, 11, 0.6, 0.5);
    } },
    { name: 'flower', color: '#ff7fbf', draw(c) {
      for (let i = 0; i < 8; i++) {
        c.save(); c.translate(64, 64); c.rotate(i * Math.PI / 4);
        E(c, 0, -32, 13, 24); fs(c, lin(c, 0, -56, 0, -8, '#ff9ccc'), '#c2477f', 3);
        c.restore();
      }
      E(c, 64, 64, 19, 19); fs(c, rad(c, 64, 64, 19, '#ffcf3a'), '#c68a00');
      c.fillStyle = 'rgba(180,110,0,.45)';
      for (const [x, y] of [[58, 60], [68, 58], [62, 70], [72, 68], [55, 68]]) { E(c, x, y, 2, 2); c.fill(); }
      shine(c, 57, 56, 4, 6, 0.5, 0.7);
    } },
    { name: 'leaf', color: '#4fbf5a', draw(c) {
      c.save(); c.translate(64, 62); c.rotate(0.7);
      c.beginPath(); c.moveTo(0, -52);
      c.bezierCurveTo(42, -30, 38, 32, 0, 46); c.bezierCurveTo(-38, 32, -42, -30, 0, -52); c.closePath();
      fs(c, rad(c, 0, 0, 48, '#4fbf5a'), '#23752c');
      c.strokeStyle = '#2b8a35'; c.lineWidth = 3.5;
      c.beginPath(); c.moveTo(0, -42); c.lineTo(0, 58); c.stroke();
      for (const y of [-26, -8, 10, 26]) {
        c.beginPath(); c.moveTo(0, y + 8); c.lineTo(-17, y - 4); c.moveTo(0, y + 8); c.lineTo(17, y - 4); c.stroke();
      }
      E(c, -16, -14, 4, 12, 0.3); c.fillStyle = 'rgba(255,255,255,.4)'; c.fill();
      c.restore();
    } },
    { name: 'star', color: '#ffc02e', draw(c) {
      c.beginPath();
      for (let i = 0; i < 10; i++) {
        const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 23 : 54;
        c.lineTo(64 + Math.cos(a) * r, 70 + Math.sin(a) * r);
      }
      c.closePath();
      fs(c, rad(c, 64, 66, 54, '#ffc02e'), '#c27a00', 5);
      shine(c, 52, 54, 6, 11, 0.5);
      E(c, 55, 72, 3.5, 5); c.fillStyle = '#7a4a00'; c.fill();
      E(c, 73, 72, 3.5, 5); c.fill();
      c.beginPath(); c.arc(64, 80, 6, 0.2, Math.PI - 0.2); c.lineWidth = 3; c.strokeStyle = '#7a4a00'; c.stroke();
    } },
    { name: 'heart', color: '#ff5d8f', draw(c) {
      c.beginPath(); c.moveTo(64, 110);
      c.bezierCurveTo(8, 74, 12, 24, 44, 24); c.bezierCurveTo(56, 24, 62, 32, 64, 42);
      c.bezierCurveTo(66, 32, 72, 24, 84, 24); c.bezierCurveTo(116, 24, 120, 74, 64, 110); c.closePath();
      fs(c, rad(c, 64, 62, 54, '#ff5d8f'), '#a11f4c');
      shine(c, 38, 48, 7, 12, 0.7);
      sparkle(c, 88, 46, 8, 'rgba(255,255,255,.85)');
    } },
    { name: 'moon', color: '#9aa6ff', draw(c) {
      const t = document.createElement('canvas'); t.width = t.height = 256;
      const x = t.getContext('2d'); x.scale(2, 2);
      E(x, 58, 68, 50, 50); x.fillStyle = '#3f43a3'; x.fill();
      x.globalCompositeOperation = 'destination-out';
      E(x, 90, 44, 40, 40); x.fill();
      x.globalCompositeOperation = 'source-atop';
      E(x, 58, 68, 46, 46); x.fillStyle = rad(x, 46, 78, 46, '#9aa6ff'); x.fill();
      x.lineWidth = 8; x.strokeStyle = '#3f43a3'; E(x, 90, 44, 40, 40); x.stroke();
      x.globalCompositeOperation = 'source-over';
      c.drawImage(t, 0, 0, 128, 128);
      shine(c, 26, 74, 5, 14, 0.2, 0.5);
      sparkle(c, 94, 46, 12, '#ffe066');
      sparkle(c, 108, 76, 7, '#ffe066');
    } },
    { name: 'cupcake', color: '#ff9ccf', draw(c) {
      c.beginPath(); c.moveTo(30, 70); c.lineTo(98, 70); c.lineTo(88, 116); c.lineTo(40, 116); c.closePath();
      fs(c, lin(c, 30, 0, 98, 0, '#4fb3e8'), '#1f6f9a');
      c.strokeStyle = 'rgba(255,255,255,.5)'; c.lineWidth = 3;
      for (const xt of [42, 54, 66, 78, 90]) {
        c.beginPath(); c.moveTo(xt, 74); c.lineTo(64 + (xt - 64) * 0.72, 112); c.stroke();
      }
      for (const [x, y, rx, ry] of [[64, 64, 40, 15], [64, 48, 31, 14], [64, 34, 20, 11]]) {
        E(c, x, y, rx, ry); fs(c, rad(c, x, y - 4, rx, '#ff9ccf'), '#c24d8a', 3.5);
      }
      const sp = [['#ffe066', 46, 60, 0.6], ['#7fd8ff', 80, 58, -0.4], ['#8ce35a', 58, 46, 0.2], ['#fff', 74, 42, 1], ['#ffe066', 66, 64, -0.9], ['#7fd8ff', 44, 46, 1.2]];
      for (const [col, x, y, r] of sp) {
        c.save(); c.translate(x, y); c.rotate(r); c.fillStyle = col; c.fillRect(-4, -1.5, 8, 3); c.restore();
      }
      c.lineWidth = 3; c.strokeStyle = '#4f7a2a';
      c.beginPath(); c.moveTo(66, 16); c.quadraticCurveTo(68, 8, 76, 4); c.stroke();
      E(c, 64, 20, 9, 9); fs(c, rad(c, 64, 20, 9, '#e8323f'), '#8e1622', 3);
      shine(c, 61, 17, 2, 3, 0.5, 0.8);
    } },
    { name: 'acorn', color: '#d99a52', draw(c) {
      c.lineWidth = 6; c.strokeStyle = '#5a3714';
      c.beginPath(); c.moveTo(64, 34); c.quadraticCurveTo(66, 22, 74, 14); c.stroke();
      c.beginPath(); c.moveTo(32, 58);
      c.bezierCurveTo(30, 96, 56, 112, 64, 118); c.bezierCurveTo(72, 112, 98, 96, 96, 58); c.closePath();
      fs(c, rad(c, 64, 82, 40, '#d99a52'), '#7a4a1c');
      shine(c, 46, 82, 5, 13, 0.25, 0.5);
      const cap = () => {
        c.beginPath(); c.moveTo(22, 62);
        c.bezierCurveTo(22, 24, 106, 24, 106, 62); c.quadraticCurveTo(64, 74, 22, 62); c.closePath();
      };
      cap(); fs(c, rad(c, 64, 46, 44, '#9a6532'), null);
      c.save(); cap(); c.clip();
      c.strokeStyle = 'rgba(60,30,10,.35)'; c.lineWidth = 2.5;
      for (let i = -60; i < 140; i += 11) {
        c.beginPath(); c.moveTo(i, 20); c.lineTo(i + 50, 80); c.stroke();
        c.beginPath(); c.moveTo(i + 50, 20); c.lineTo(i, 80); c.stroke();
      }
      c.restore();
      cap(); fs(c, null, '#4f2f12');
    } },
    { name: 'melon', color: '#ff4b5c', draw(c) {
      c.save(); c.translate(64, 38);
      const half = (r) => { c.beginPath(); c.arc(0, 0, r, 0, Math.PI); c.closePath(); };
      half(56); fs(c, lin(c, 0, 0, 0, 56, '#3fae4a'), null);
      half(49); c.fillStyle = '#eaffd6'; c.fill();
      half(44); c.fillStyle = rad(c, 0, 12, 44, '#ff4b5c'); c.fill();
      c.fillStyle = '#2b1a1a';
      for (const [x, y, r] of [[-24, 12, 0.4], [0, 16, 0], [24, 12, -0.4], [-12, 30, 0.2], [12, 30, -0.2]]) {
        E(c, x, y, 3, 5.5, r); c.fill();
      }
      c.fillStyle = 'rgba(255,255,255,.4)'; c.fillRect(-40, 3, 80, 4);
      half(56); fs(c, null, '#1f6a28', 4);
      c.restore();
    } },
    { name: 'gem', color: '#3fb9ff', draw(c) {
      const poly = (pts) => { c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.closePath(); };
      poly([[38, 26], [90, 26], [114, 54], [64, 114], [14, 54]]);
      fs(c, lin(c, 14, 26, 114, 114, '#3fb9ff'), null);
      poly([[38, 26], [90, 26], [78, 54], [50, 54]]); c.fillStyle = 'rgba(255,255,255,.4)'; c.fill();
      poly([[14, 54], [50, 54], [64, 114]]); c.fillStyle = 'rgba(255,255,255,.18)'; c.fill();
      poly([[78, 54], [114, 54], [64, 114]]); c.fillStyle = 'rgba(0,40,90,.22)'; c.fill();
      c.strokeStyle = 'rgba(19,102,166,.7)'; c.lineWidth = 2;
      c.beginPath();
      c.moveTo(14, 54); c.lineTo(114, 54);
      c.moveTo(38, 26); c.lineTo(50, 54); c.lineTo(64, 114); c.lineTo(78, 54); c.lineTo(90, 26);
      c.stroke();
      poly([[38, 26], [90, 26], [114, 54], [64, 114], [14, 54]]); fs(c, null, '#1366a6', 4);
      sparkle(c, 42, 38, 9, '#fff');
    } },
  ];

  function build(px) {
    return ICONS.map((ic) => {
      const tmp = document.createElement('canvas'); tmp.width = tmp.height = px;
      const t = tmp.getContext('2d');
      t.scale(px / 128, px / 128); t.lineJoin = 'round'; t.lineCap = 'round';
      ic.draw(t);
      const cv = document.createElement('canvas'); cv.width = cv.height = px;
      const c = cv.getContext('2d');
      c.shadowColor = 'rgba(60,30,0,.25)'; c.shadowOffsetY = px * 0.025; c.shadowBlur = px * 0.02;
      c.drawImage(tmp, px * 0.04, px * 0.02, px * 0.92, px * 0.92);
      return { name: ic.name, color: ic.color, src: cv.toDataURL() };
    });
  }

  return { build, count: ICONS.length };
})();
