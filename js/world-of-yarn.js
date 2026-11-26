/* ==========================================================================
   WORLD OF YARN — Cozy 3D Knitting & Color-Sorting Puzzle
   Three.js 3D knitted models, procedural wool stitch textures, orbit/zoom,
   press-and-hold peek, flying thread unraveling, 3-spool baskets & boosters.
   ========================================================================== */
(() => {
  'use strict';

  // --------------------------------------------------------------------------
  // 1. YARN COLOR PALETTE
  // --------------------------------------------------------------------------
  const YARN_COLORS = {
    coral:   { name: 'Coral',   hex: '#fb7185', num: 0xfb7185, dark: '#be123c' },
    amber:   { name: 'Honey',   hex: '#fbbf24', num: 0xfbbf24, dark: '#b45309' },
    mint:    { name: 'Mint',    hex: '#34d399', num: 0x34d399, dark: '#047857' },
    sky:     { name: 'Sky',     hex: '#38bdf8', num: 0x38bdf8, dark: '#0369a1' },
    lavender:{ name: 'Lilac',   hex: '#c084fc', num: 0xc084fc, dark: '#7e22ce' },
    peach:   { name: 'Peach',   hex: '#fb923c', num: 0xfb923c, dark: '#c2410c' },
    cream:   { name: 'Cream',   hex: '#fef3c7', num: 0xfef3c7, dark: '#b45309' },
    berry:   { name: 'Berry',   hex: '#ec4899', num: 0xec4899, dark: '#9d174d' }
  };
  const COLOR_KEYS = Object.keys(YARN_COLORS);

  // --------------------------------------------------------------------------
  // 2. ASMR WEB AUDIO SYNTHESIZER
  // --------------------------------------------------------------------------
  class YarnAudio {
    constructor() {
      this.ctx = null;
      this.enabled = localStorage.getItem('woy_sound') !== 'false';
    }

    init() {
      if (!this.ctx && (window.AudioContext || window.webkitAudioContext)) {
        const AC = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AC();
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
    }

    toggle() {
      this.enabled = !this.enabled;
      localStorage.setItem('woy_sound', String(this.enabled));
      if (this.enabled) this.playTap();
      return this.enabled;
    }

    playTap() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(760, now + 0.08);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
      osc.connect(gain); gain.connect(this.ctx.destination);
      osc.start(now); osc.stop(now + 0.1);
    }

    playUnravel() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      // Soft wool zip + gentle pluck
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(340, now);
      osc.frequency.exponentialRampToValueAtTime(620, now + 0.14);
      gain.gain.setValueAtTime(0.14, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc.connect(gain); gain.connect(this.ctx.destination);
      osc.start(now); osc.stop(now + 0.19);
    }

    playBasketClear() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.055);
        gain.gain.setValueAtTime(0.11, now + i * 0.055);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.055 + 0.24);
        osc.connect(gain); gain.connect(this.ctx.destination);
        osc.start(now + i * 0.055); osc.stop(now + i * 0.055 + 0.26);
      });
    }

    playPeek() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.linearRampToValueAtTime(390, now + 0.1);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc.connect(gain); gain.connect(this.ctx.destination);
      osc.start(now); osc.stop(now + 0.13);
    }

    playBlocked() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(210, now);
      osc.frequency.linearRampToValueAtTime(150, now + 0.1);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc.connect(gain); gain.connect(this.ctx.destination);
      osc.start(now); osc.stop(now + 0.13);
    }

    playVictory() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5];
      notes.forEach((f, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, now + i * 0.08);
        gain.gain.setValueAtTime(0.14, now + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.35);
        osc.connect(gain); gain.connect(this.ctx.destination);
        osc.start(now + i * 0.08); osc.stop(now + i * 0.08 + 0.36);
      });
    }
  }

  // --------------------------------------------------------------------------
  // 3. PROCEDURAL KNITTED WOOL TEXTURES
  // --------------------------------------------------------------------------
  const woolTexCache = {};
  let woolBumpTex = null;

  function getWoolBumpTexture() {
    if (woolBumpTex) return woolBumpTex;
    const c = document.createElement('canvas');
    c.width = 128; c.height = 128;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#7f7f7f';
    ctx.fillRect(0, 0, 128, 128);
    // Knit V-stitch pattern
    for (let y = 0; y < 128; y += 16) {
      for (let x = 0; x < 128; x += 16) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3.2;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x + 2, y + 2);
        ctx.lineTo(x + 8, y + 13);
        ctx.lineTo(x + 14, y + 2);
        ctx.stroke();

        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(x + 8, y + 13);
        ctx.lineTo(x + 8, y + 16);
        ctx.stroke();
      }
    }
    woolBumpTex = new THREE.CanvasTexture(c);
    woolBumpTex.wrapS = THREE.RepeatWrapping;
    woolBumpTex.wrapT = THREE.RepeatWrapping;
    woolBumpTex.repeat.set(3, 3);
    return woolBumpTex;
  }

  function getWoolMaterial(colorKey, isLocked) {
    const info = YARN_COLORS[colorKey] || YARN_COLORS.coral;
    const cacheKey = `${colorKey}_${isLocked ? 'L' : 'F'}`;
    if (!woolTexCache[cacheKey]) {
      const c = document.createElement('canvas');
      c.width = 128; c.height = 128;
      const ctx = c.getContext('2d');
      ctx.fillStyle = info.hex;
      ctx.fillRect(0, 0, 128, 128);
      for (let y = 0; y < 128; y += 16) {
        for (let x = 0; x < 128; x += 16) {
          ctx.strokeStyle = 'rgba(255,255,255,0.22)';
          ctx.lineWidth = 2.6;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(x + 3, y + 3);
          ctx.lineTo(x + 8, y + 13);
          ctx.lineTo(x + 13, y + 3);
          ctx.stroke();

          ctx.strokeStyle = 'rgba(0,0,0,0.12)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(x + 2, y + 6);
          ctx.lineTo(x + 8, y + 15);
          ctx.lineTo(x + 14, y + 6);
          ctx.stroke();
        }
      }
      const tex = new THREE.CanvasTexture(c);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(3, 3);
      woolTexCache[cacheKey] = tex;
    }

    return new THREE.MeshStandardMaterial({
      map: woolTexCache[cacheKey],
      bumpMap: getWoolBumpTexture(),
      bumpScale: 0.06,
      roughness: 0.88,
      metalness: 0.02,
      transparent: true,
      opacity: 1.0,
      emissive: new THREE.Color(info.num),
      emissiveIntensity: isLocked ? 0.0 : 0.05
    });
  }

  // --------------------------------------------------------------------------
  // 4. 12 HANDCRAFTED 3D KNITTED DIORAMA LEVELS
  //    Each piece belongs to a layer: core (0), mid (1), outer (2).
  //    Colors are assigned in exact multiples of 3 so every level is 100% solvable.
  // --------------------------------------------------------------------------
  const LEVEL_THEMES = [
    { name: 'Cozy Sheep',       icon: '🐑', colors: ['cream', 'coral', 'sky', 'amber'],           baskets: 2 },
    { name: 'Cute Kitty',       icon: '🐱', colors: ['peach', 'cream', 'berry', 'mint'],          baskets: 2 },
    { name: 'Mushroom House',   icon: '🍄', colors: ['coral', 'cream', 'mint', 'amber'],          baskets: 2 },
    { name: 'Teddy Bear',       icon: '🧸', colors: ['peach', 'amber', 'sky', 'coral'],           baskets: 3 },
    { name: 'Potted Cactus',    icon: '🌵', colors: ['mint', 'peach', 'berry', 'amber'],          baskets: 3 },
    { name: 'Little Duckling',  icon: '🐥', colors: ['amber', 'peach', 'sky', 'cream'],           baskets: 3 },
    { name: 'Berry Cake',       icon: '🍰', colors: ['cream', 'berry', 'coral', 'mint', 'amber'], baskets: 3 },
    { name: 'Sleepy Fox',       icon: '🦊', colors: ['peach', 'cream', 'mint', 'lavender', 'sky'],baskets: 3 },
    { name: 'Rocket Ship',      icon: '🚀', colors: ['sky', 'coral', 'amber', 'lavender', 'mint'],baskets: 3 },
    { name: 'Friendly Octopus', icon: '🐙', colors: ['lavender', 'berry', 'sky', 'mint', 'amber'],baskets: 3 },
    { name: 'Winter Penguin',   icon: '🐧', colors: ['sky', 'cream', 'coral', 'amber', 'mint'],   baskets: 3 },
    { name: 'Cozy Teapot',      icon: '🫖', colors: ['berry', 'cream', 'mint', 'lavender', 'peach'], baskets: 3 }
  ];

  // Helper to build a balanced color list (exact multiples of 3)
  function buildColorPool(totalPieces, palette) {
    // Ensure totalPieces is multiple of 3
    const n = Math.floor(totalPieces / 3) * 3;
    const pool = [];
    let ci = 0;
    for (let i = 0; i < n; i += 3) {
      const col = palette[ci % palette.length];
      pool.push(col, col, col);
      ci++;
    }
    // Deterministic-ish shuffle
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return pool;
  }

  // Generate 3D pieces for a given level index (0-based)
  function buildDioramaSpecs(levelIdx) {
    const theme = LEVEL_THEMES[levelIdx % LEVEL_THEMES.length];
    const extraTier = Math.floor(levelIdx / LEVEL_THEMES.length);
    const specs = [];

    // Helper to push a piece spec
    const add = (shape, pos, scale, rot, layer, blockedBy = []) => {
      specs.push({
        id: specs.length,
        shape,
        pos,
        scale: scale || [1, 1, 1],
        rot: rot || [0, 0, 0],
        layer,
        blockedBy
      });
    };

    const idx = levelIdx % 12;

    if (idx === 0) {
      // 1. Cozy Sheep (15 pieces)
      add('sphere', [0, 0, 0], [1.1, 0.95, 1.2], [0, 0, 0], 0); // 0: core
      add('sphere', [0, 0.2, 0.9], [0.65, 0.6, 0.65], [0, 0, 0], 1, [0]); // 1: head
      add('torus', [0, 0.05, 0.65], [0.55, 0.55, 0.55], [Math.PI / 2.2, 0, 0], 2, []); // 2: scarf
      // Fluffy outer wool puffs
      const puffs = [
        [0, 0.9, 0], [0.85, 0.35, 0.2], [-0.85, 0.35, 0.2],
        [0.85, 0.35, -0.45], [-0.85, 0.35, -0.45], [0, 0.55, -0.95],
        [0.55, -0.25, 0.6], [-0.55, -0.25, 0.6], [0, -0.25, -0.85]
      ];
      puffs.forEach((p) => {
        const pId = specs.length;
        add('sphere', p, [0.52, 0.52, 0.52], [0, 0, 0], 2, []);
        specs[0].blockedBy.push(pId);
      });
      // Ears & tail
      add('capsule', [0.62, 0.42, 0.95], [0.22, 0.42, 0.22], [0, 0, -0.8], 2, []);
      add('capsule', [-0.62, 0.42, 0.95], [0.22, 0.42, 0.22], [0, 0, 0.8], 2, []);
      add('sphere', [0, 0.1, -1.25], [0.35, 0.35, 0.35], [0, 0, 0], 2, []);
    } else if (idx === 1) {
      // 2. Cute Kitty (15 pieces)
      add('sphere', [0, -0.35, 0], [0.95, 1.0, 0.95], [0, 0, 0], 0); // 0: core body
      add('sphere', [0, 0.72, 0.1], [0.82, 0.76, 0.78], [0, 0, 0], 1); // 1: head
      add('torus', [0, 0.18, 0.08], [0.62, 0.62, 0.62], [Math.PI / 2, 0, 0], 2, []); // 2: collar
      // Ears
      add('cone', [0.5, 1.38, 0.1], [0.28, 0.45, 0.28], [0, 0, -0.35], 2, []);
      add('cone', [-0.5, 1.38, 0.1], [0.28, 0.45, 0.28], [0, 0, 0.35], 2, []);
      // Cheeks & nose
      add('sphere', [0.36, 0.65, 0.76], [0.25, 0.2, 0.2], [0, 0, 0], 2, []);
      add('sphere', [-0.36, 0.65, 0.76], [0.25, 0.2, 0.2], [0, 0, 0], 2, []);
      // Belly & paws & tail
      add('sphere', [0, -0.35, 0.78], [0.55, 0.62, 0.35], [0, 0, 0], 2, []);
      add('capsule', [0.55, -0.95, 0.55], [0.25, 0.35, 0.3], [0.5, 0, 0], 2, []);
      add('capsule', [-0.55, -0.95, 0.55], [0.25, 0.35, 0.3], [0.5, 0, 0], 2, []);
      add('capsule', [0.65, -0.25, -0.45], [0.24, 0.65, 0.24], [0.4, 0, -0.5], 2, []);
      add('capsule', [0.95, 0.25, -0.65], [0.22, 0.55, 0.22], [-0.3, 0, -0.4], 2, []);
      add('sphere', [0.55, 0.72, -0.55], [0.42, 0.42, 0.42], [0, 0, 0], 2, []);
      add('sphere', [-0.55, 0.72, -0.55], [0.42, 0.42, 0.42], [0, 0, 0], 2, []);
      add('sphere', [0, -0.35, -0.82], [0.48, 0.48, 0.35], [0, 0, 0], 2, []);
      specs[0].blockedBy.push(2, 7, 8, 9, 10, 14);
      specs[1].blockedBy.push(3, 4, 5, 6, 12, 13);
    } else if (idx === 2) {
      // 3. Mushroom House (15 pieces)
      add('cylinder', [0, -0.45, 0], [0.78, 1.15, 0.78], [0, 0, 0], 0); // 0: stem core
      add('sphere', [0, 0.55, 0], [1.35, 0.85, 1.35], [0, 0, 0], 1); // 1: cap core
      // Spots on cap
      const spots = [
        [0, 1.35, 0], [0.85, 0.85, 0.65], [-0.85, 0.85, 0.65],
        [0.85, 0.85, -0.65], [-0.85, 0.85, -0.65], [0, 0.9, 1.1], [0, 0.9, -1.1]
      ];
      spots.forEach((p) => {
        const id = specs.length;
        add('sphere', p, [0.34, 0.26, 0.34], [0, 0, 0], 2, []);
        specs[1].blockedBy.push(id);
      });
      // Door, windows, grass puffs
      add('capsule', [0, -0.65, 0.75], [0.35, 0.48, 0.2], [0, 0, 0], 2, []);
      add('sphere', [0.72, -0.25, 0.35], [0.24, 0.24, 0.2], [0, 0, 0], 2, []);
      add('sphere', [-0.72, -0.25, 0.35], [0.24, 0.24, 0.2], [0, 0, 0], 2, []);
      add('sphere', [0.65, -0.95, 0.55], [0.36, 0.3, 0.36], [0, 0, 0], 2, []);
      add('sphere', [-0.65, -0.95, 0.55], [0.36, 0.3, 0.36], [0, 0, 0], 2, []);
      add('sphere', [0, -0.95, -0.75], [0.42, 0.32, 0.42], [0, 0, 0], 2, []);
      specs[0].blockedBy.push(9, 10, 11, 12, 13, 14);
    } else if (idx === 3) {
      // 4. Teddy Bear (18 pieces)
      add('sphere', [0, -0.35, 0], [0.95, 1.0, 0.85], [0, 0, 0], 0); // 0: torso
      add('sphere', [0, 0.78, 0.05], [0.82, 0.78, 0.78], [0, 0, 0], 1); // 1: head
      add('sphere', [0, -0.35, 0.68], [0.55, 0.62, 0.35], [0, 0, 0], 2, []); // belly
      add('sphere', [0, 0.66, 0.72], [0.38, 0.28, 0.3], [0, 0, 0], 2, []); // snout
      add('sphere', [0.65, 1.35, 0], [0.32, 0.32, 0.22], [0, 0, 0], 2, []); // ear R
      add('sphere', [-0.65, 1.35, 0], [0.32, 0.32, 0.22], [0, 0, 0], 2, []); // ear L
      add('capsule', [0.95, -0.1, 0.25], [0.28, 0.52, 0.28], [0.2, 0, -0.6], 2, []); // arm R
      add('capsule', [-0.95, -0.1, 0.25], [0.28, 0.52, 0.28], [0.2, 0, 0.6], 2, []); // arm L
      add('capsule', [0.55, -1.1, 0.45], [0.32, 0.48, 0.36], [1.1, 0, -0.2], 2, []); // leg R
      add('capsule', [-0.55, -1.1, 0.45], [0.32, 0.48, 0.36], [1.1, 0, 0.2], 2, []); // leg L
      add('cone', [0.24, 0.14, 0.74], [0.2, 0.28, 0.15], [0, 0, 1.4], 2, []); // bow R
      add('cone', [-0.24, 0.14, 0.74], [0.2, 0.28, 0.15], [0, 0, -1.4], 2, []); // bow L
      add('sphere', [0, 0.78, -0.65], [0.46, 0.46, 0.35], [0, 0, 0], 2, []);
      add('sphere', [0.55, 0.85, -0.45], [0.38, 0.38, 0.35], [0, 0, 0], 2, []);
      add('sphere', [-0.55, 0.85, -0.45], [0.38, 0.38, 0.35], [0, 0, 0], 2, []);
      add('sphere', [0, -0.35, -0.72], [0.48, 0.48, 0.32], [0, 0, 0], 2, []);
      add('sphere', [0.55, -0.45, -0.55], [0.38, 0.38, 0.32], [0, 0, 0], 2, []);
      add('sphere', [-0.55, -0.45, -0.55], [0.38, 0.38, 0.32], [0, 0, 0], 2, []);
      specs[0].blockedBy.push(2, 6, 7, 8, 9, 15);
      specs[1].blockedBy.push(3, 4, 5, 12, 13, 14);
    } else {
      // Procedural layered knitted sculpture for levels 5-12+ (18 to 24 pieces)
      const count = 18 + Math.min(6, Math.floor(levelIdx / 3) * 3);
      // 1 core + 3 mid + rest outer shell around a charming silhouette
      add('sphere', [0, 0, 0], [0.95, 1.05, 0.95], [0, 0, 0], 0);
      add('sphere', [0, 0.85, 0], [0.68, 0.65, 0.68], [0, 0, 0], 1);
      add('torus', [0, 0.22, 0], [0.72, 0.72, 0.72], [Math.PI / 2, 0, 0], 1);
      add('sphere', [0, -0.78, 0], [0.75, 0.55, 0.75], [0, 0, 0], 1);

      const outerN = count - 4;
      for (let i = 0; i < outerN; i++) {
        const phi = Math.acos(1 - 2 * ((i + 0.5) / outerN));
        const theta = Math.PI * (1 + Math.sqrt(5)) * i;
        const rad = 1.08;
        const px = rad * Math.sin(phi) * Math.cos(theta);
        const py = rad * Math.cos(phi) * 1.1;
        const pz = rad * Math.sin(phi) * Math.sin(theta);
        const shapes = ['sphere', 'capsule', 'torus'];
        const sh = shapes[i % 3];
        const id = specs.length;
        add(sh, [px, py, pz], [0.42, 0.42, 0.42], [phi * 0.5, theta * 0.5, 0], 2, []);
        if (py > 0.35) specs[1].blockedBy.push(id);
        else if (py < -0.35) specs[3].blockedBy.push(id);
        else specs[2].blockedBy.push(id);
        specs[0].blockedBy.push(id);
      }
      specs[0].blockedBy.push(1, 2, 3);
    }

    // Assign balanced colors (exact multiples of 3)
    const pool = buildColorPool(specs.length, theme.colors);
    specs.forEach((s, i) => {
      s.color = pool[i % pool.length];
    });
    return { theme, specs, extraTier };
  }

  // --------------------------------------------------------------------------
  // 5. MAIN GAME ENGINE
  // --------------------------------------------------------------------------
  class WorldOfYarnGame {
    constructor() {
      this.audio = new YarnAudio();
      this.canvas = document.getElementById('yarnCanvas');
      this.fxCanvas = document.getElementById('threadFxCanvas');
      this.fxCtx = this.fxCanvas.getContext('2d');

      // Progress & Economy
      this.coins = parseInt(localStorage.getItem('woy_coins') || '150', 10);
      this.unlockedLevel = parseInt(localStorage.getItem('woy_unlocked') || '1', 10);
      this.starsMap = JSON.parse(localStorage.getItem('woy_stars') || '{}');
      this.currentLevel = 1;

      // Scene State
      this.state = 'MENU'; // MENU | PLAYING | VICTORY | DEFEAT
      this.pieces = [];    // { id, mesh, color, layer, blockedBy, removed }
      this.baskets = [];   // Active baskets: { id, color, filled: 0 }
      this.basketQueue = [];
      this.spareHoles = []; // Array of colorKeys
      this.maxSpareHoles = 5;
      this.backupJar = [];  // Up to 2 colorKeys
      this.hasJar = false;
      this.shuffleUsedFree = false;
      this.totalPiecesCount = 0;
      this.removedCount = 0;
      this.mistakes = 0;

      // 2D FX state (flying threads & confetti)
      this.flyingThreads = [];
      this.confetti = [];

      // Camera Orbit State
      this.rotY = 0.35;
      this.rotX = 0.25;
      this.targetRotY = 0.35;
      this.targetRotX = 0.25;
      this.camDist = 5.4;
      this.targetCamDist = 5.4;

      // Pointer & Peek State
      this.isDragging = false;
      this.dragMoved = false;
      this.lastPtr = { x: 0, y: 0 };
      this.downPtr = { x: 0, y: 0 };
      this.downTime = 0;
      this.peekTimer = null;
      this.peekingPiece = null;
      this.hoveredPiece = null;
      this.pinchDist = 0;

      this.initThree();
      this.bindUI();
      this.bindInput();
      this.refreshMenuStats();
      this.loadMenuShowcase();

      this.lastTime = performance.now();
      requestAnimationFrame(this.loop.bind(this));
    }

    initThree() {
      this.scene = new THREE.Scene();
      this.camera = new THREE.PerspectiveCamera(44, window.innerWidth / window.innerHeight, 0.1, 100);
      this.camera.position.set(0, 0.3, this.camDist);

      this.renderer = new THREE.WebGLRenderer({
        canvas: this.canvas,
        antialias: true,
        alpha: true
      });
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      this.renderer.setSize(window.innerWidth, window.innerHeight);

      // Warm Cozy Lighting
      const hemi = new THREE.HemisphereLight(0xfffaf0, 0xd8b4fe, 0.9);
      this.scene.add(hemi);

      const dir1 = new THREE.DirectionalLight(0xfff7ed, 0.85);
      dir1.position.set(4, 6, 5);
      this.scene.add(dir1);

      const dir2 = new THREE.DirectionalLight(0xe0f2fe, 0.45);
      dir2.position.set(-5, -2, 3);
      this.scene.add(dir2);

      this.modelGroup = new THREE.Group();
      this.scene.add(this.modelGroup);

      this.raycaster = new THREE.Raycaster();
      this.pointerNdc = new THREE.Vector2();

      this.handleResize();
      window.addEventListener('resize', () => this.handleResize());
    }

    handleResize() {
      const w = window.innerWidth;
      const h = window.innerHeight;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
      this.fxCanvas.width = w;
      this.fxCanvas.height = h;
    }

    loadMenuShowcase() {
      // Render level 1 Cozy Sheep gently spinning in background of menu
      this.buildModel(0);
    }

    clearModel() {
      while (this.modelGroup.children.length > 0) {
        const child = this.modelGroup.children[0];
        this.modelGroup.remove(child);
        if (child.geometry) child.geometry.dispose();
        if (child.material) child.material.dispose();
      }
      this.pieces = [];
    }

    createShapeGeometry(shape) {
      if (shape === 'cylinder') return new THREE.CylinderGeometry(0.55, 0.65, 1.0, 20);
      if (shape === 'cone') return new THREE.ConeGeometry(0.55, 1.0, 20);
      if (shape === 'torus') return new THREE.TorusGeometry(0.6, 0.22, 16, 28);
      if (shape === 'capsule') return new THREE.CylinderGeometry(0.4, 0.4, 1.0, 18);
      return new THREE.SphereGeometry(0.58, 22, 18);
    }

    buildModel(levelIdx) {
      this.clearModel();
      const { theme, specs } = buildDioramaSpecs(levelIdx);

      specs.forEach((sp) => {
        const geom = this.createShapeGeometry(sp.shape);
        const locked = sp.blockedBy.length > 0;
        const mat = getWoolMaterial(sp.color, locked);
        const mesh = new THREE.Mesh(geom, mat);
        mesh.position.set(sp.pos[0], sp.pos[1], sp.pos[2]);
        mesh.scale.set(sp.scale[0], sp.scale[1], sp.scale[2]);
        mesh.rotation.set(sp.rot[0], sp.rot[1], sp.rot[2]);
        mesh.userData.pieceId = sp.id;
        this.modelGroup.add(mesh);

        this.pieces.push({
          id: sp.id,
          mesh,
          color: sp.color,
          layer: sp.layer,
          blockedBy: [...sp.blockedBy],
          removed: false,
          baseScale: [...sp.scale]
        });
      });

      this.refreshPieceLockVisuals();
      return theme;
    }

    isPieceFree(piece) {
      if (!piece || piece.removed) return false;
      return piece.blockedBy.every(bid => {
        const b = this.pieces[bid];
        return !b || b.removed;
      });
    }

    refreshPieceLockVisuals() {
      this.pieces.forEach(p => {
        if (p.removed) return;
        const free = this.isPieceFree(p);
        p.mesh.material.emissiveIntensity = free ? 0.08 : 0.0;
        p.mesh.material.color.setHex(free ? 0xffffff : 0xbdbdbd);
      });
    }

    // ------------------------------------------------------------------------
    // 6. LEVEL START & GAMEPLAY LOOP
    // ------------------------------------------------------------------------
    startLevel(levelNum) {
      this.currentLevel = levelNum;
      this.state = 'PLAYING';
      this.mistakes = 0;
      this.maxSpareHoles = 5;
      this.spareHoles = [];
      this.backupJar = [];
      this.hasJar = false;
      this.shuffleUsedFree = false;
      this.flyingThreads = [];
      this.confetti = [];

      const theme = this.buildModel(levelNum - 1);
      this.totalPiecesCount = this.pieces.length;
      this.removedCount = 0;

      // Build Basket Queue (every 3 pieces of same color = 1 basket)
      const counts = {};
      this.pieces.forEach(p => { counts[p.color] = (counts[p.color] || 0) + 1; });
      const queue = [];
      Object.entries(counts).forEach(([col, cnt]) => {
        const basketsNeeded = Math.round(cnt / 3);
        for (let i = 0; i < basketsNeeded; i++) queue.push(col);
      });

      // Smart ordering: put colors from currently FREE outer pieces at front of queue
      const outerColors = new Set(this.pieces.filter(p => this.isPieceFree(p)).map(p => p.color));
      queue.sort((a, b) => (outerColors.has(b) ? 1 : 0) - (outerColors.has(a) ? 1 : 0));

      const basketSlots = theme.baskets || 2;
      this.baskets = [];
      for (let i = 0; i < basketSlots && queue.length > 0; i++) {
        this.baskets.push({ id: i + 1, color: queue.shift(), filled: 0 });
      }
      this.basketQueue = queue;

      // Reset camera
      this.rotY = 0.35; this.targetRotY = 0.35;
      this.rotX = 0.25; this.targetRotX = 0.25;
      this.camDist = 5.4; this.targetCamDist = 5.4;

      // Show Game UI
      document.getElementById('menuScreen').classList.add('hidden');
      document.getElementById('victoryModal').classList.add('hidden');
      document.getElementById('defeatModal').classList.add('hidden');
      document.getElementById('gameHud').classList.remove('hidden');
      document.getElementById('basketsTray').classList.remove('hidden');
      document.getElementById('bottomTray').classList.remove('hidden');
      document.getElementById('peekPill').classList.remove('hidden');

      document.getElementById('hudLevelBadge').textContent = `LEVEL ${levelNum} · ${theme.icon} ${theme.name}`;
      document.getElementById('costShuffle').textContent = 'FREE';
      document.getElementById('backupJarBox').classList.add('hidden');

      this.renderHUD();
      this.renderBaskets();
      this.renderSpareHoles();
    }

    renderHUD() {
      const pct = this.totalPiecesCount > 0 ? Math.round((this.removedCount / this.totalPiecesCount) * 100) : 0;
      document.getElementById('hudProgressFill').style.width = `${pct}%`;
      document.getElementById('hudProgressText').textContent = `${this.removedCount} / ${this.totalPiecesCount} Unraveled`;
      document.getElementById('hudCoins').textContent = this.coins;
    }

    renderBaskets() {
      const tray = document.getElementById('basketsTray');
      tray.innerHTML = '';
      this.baskets.forEach((b) => {
        const info = YARN_COLORS[b.color];
        const card = document.createElement('div');
        card.className = 'basket-card';
        card.id = `basketCard_${b.id}`;
        let slotsHtml = '';
        for (let s = 0; s < 3; s++) {
          const filled = s < b.filled;
          slotsHtml += `<div class="spool-slot ${filled ? 'filled' : ''}" style="${filled ? `background:${info.hex}` : ''}"></div>`;
        }
        card.innerHTML = `
          <div class="basket-color-dot" style="background:${info.hex}"></div>
          <div class="basket-color-name">${info.name}</div>
          <div class="basket-spools">${slotsHtml}</div>
        `;
        tray.appendChild(card);
      });
    }

    renderSpareHoles() {
      const row = document.getElementById('spareHolesRow');
      row.innerHTML = '';
      for (let i = 0; i < this.maxSpareHoles; i++) {
        const col = this.spareHoles[i];
        const div = document.createElement('div');
        const isFullDanger = !col && this.spareHoles.length >= this.maxSpareHoles - 1;
        div.className = `spare-hole ${col ? 'has-yarn' : ''} ${isFullDanger ? 'danger' : ''}`;
        if (col) {
          div.style.background = YARN_COLORS[col].hex;
        }
        row.appendChild(div);
      }
      document.getElementById('spareCountText').textContent = `${this.spareHoles.length} / ${this.maxSpareHoles} Used`;

      const jarBox = document.getElementById('backupJarBox');
      const jarSlots = document.getElementById('jarSlots');
      if (this.hasJar || this.backupJar.length > 0) {
        jarBox.classList.remove('hidden');
        jarSlots.innerHTML = '';
        this.backupJar.forEach(c => {
          const s = document.createElement('div');
          s.className = 'jar-spool';
          s.style.background = YARN_COLORS[c].hex;
          jarSlots.appendChild(s);
        });
      }
    }

    // Screen position of a 3D mesh for flying thread FX
    getScreenPos(mesh) {
      const vec = new THREE.Vector3();
      mesh.getWorldPosition(vec);
      vec.project(this.camera);
      return {
        x: (vec.x * 0.5 + 0.5) * window.innerWidth,
        y: (-vec.y * 0.5 + 0.5) * window.innerHeight
      };
    }

    spawnFlyingThread(fromPos, toElem, colorHex) {
      let tx = window.innerWidth / 2;
      let ty = 110;
      if (toElem) {
        const r = toElem.getBoundingClientRect();
        tx = r.left + r.width / 2;
        ty = r.top + r.height / 2;
      }
      this.flyingThreads.push({
        sx: fromPos.x,
        sy: fromPos.y,
        ex: tx,
        ey: ty,
        t: 0,
        color: colorHex
      });
    }

    tapPiece(piece) {
      if (this.state !== 'PLAYING' || !piece || piece.removed) return;

      if (!this.isPieceFree(piece)) {
        this.audio.playBlocked();
        this.showToast('🔒 Unravel the outer yarn layer first!');
        return;
      }

      const startPos = this.getScreenPos(piece.mesh);
      piece.removed = true;
      piece.mesh.visible = false;
      this.removedCount++;
      this.audio.playUnravel();
      this.refreshPieceLockVisuals();

      // Try placing into an active matching basket
      const matchBasket = this.baskets.find(b => b.color === piece.color && b.filled < 3);
      if (matchBasket) {
        matchBasket.filled++;
        const el = document.getElementById(`basketCard_${matchBasket.id}`);
        this.spawnFlyingThread(startPos, el, YARN_COLORS[piece.color].hex);
        this.processBasketCompletion();
      } else {
        // Place in spare hole
        if (this.spareHoles.length < this.maxSpareHoles) {
          this.spareHoles.push(piece.color);
          this.spawnFlyingThread(startPos, document.getElementById('spareHolesRow'), YARN_COLORS[piece.color].hex);
        } else {
          // Restore piece if already full? Better: trigger defeat state!
          this.mistakes++;
          this.triggerDefeat();
          return;
        }
      }

      this.renderHUD();
      this.renderBaskets();
      this.renderSpareHoles();

      if (this.removedCount >= this.totalPiecesCount) {
        this.triggerVictory();
      } else {
        // Check if spare holes are full AND no free piece matches any active basket
        if (this.spareHoles.length >= this.maxSpareHoles) {
          const basketCols = new Set(this.baskets.map(b => b.color));
          const anyPlayable = this.pieces.some(p => this.isPieceFree(p) && basketCols.has(p.color));
          if (!anyPlayable) {
            setTimeout(() => {
              if (this.state === 'PLAYING' && this.spareHoles.length >= this.maxSpareHoles) {
                this.triggerDefeat();
              }
            }, 350);
          }
        }
      }
    }

    processBasketCompletion() {
      let clearedAny = false;
      this.baskets.forEach((b) => {
        if (b.filled >= 3) {
          clearedAny = true;
          this.audio.playBasketClear();
          const el = document.getElementById(`basketCard_${b.id}`);
          if (el) {
            const r = el.getBoundingClientRect();
            this.spawnConfetti(r.left + r.width / 2, r.top + r.height / 2, 18);
          }
          if (this.basketQueue.length > 0) {
            b.color = this.basketQueue.shift();
            b.filled = 0;
          } else {
            b.filled = 3; // Level ending
          }
        }
      });

      if (clearedAny) {
        // Sweep matching threads from Backup Jar and Spare Holes into active baskets!
        this.sweepStorageIntoBaskets();
      }
    }

    sweepStorageIntoBaskets() {
      let moved = true;
      while (moved) {
        moved = false;
        for (const b of this.baskets) {
          if (b.filled >= 3) continue;
          const jarIdx = this.backupJar.indexOf(b.color);
          if (jarIdx !== -1) {
            this.backupJar.splice(jarIdx, 1);
            b.filled++;
            moved = true;
            break;
          }
          const spareIdx = this.spareHoles.indexOf(b.color);
          if (spareIdx !== -1) {
            this.spareHoles.splice(spareIdx, 1);
            b.filled++;
            moved = true;
            break;
          }
        }
        // If a basket filled to 3 during sweep, rotate it too
        for (const b of this.baskets) {
          if (b.filled >= 3 && this.basketQueue.length > 0) {
            this.audio.playBasketClear();
            b.color = this.basketQueue.shift();
            b.filled = 0;
            moved = true;
          }
        }
      }
    }

    // ------------------------------------------------------------------------
    // 7. BOOSTERS
    // ------------------------------------------------------------------------
    useShuffle() {
      if (this.state !== 'PLAYING') return;
      const cost = this.shuffleUsedFree ? 40 : 0;
      if (this.coins < cost) { this.showToast('Not enough coins!'); return; }
      if (this.basketQueue.length === 0) { this.showToast('No waiting baskets left!'); return; }

      this.coins -= cost;
      this.shuffleUsedFree = true;
      localStorage.setItem('woy_coins', String(this.coins));
      document.getElementById('costShuffle').textContent = '🪙 40';

      // Swap empty/partially-filled active baskets with colors needed by spare holes or outer pieces
      const priorityCols = [...this.spareHoles, ...this.pieces.filter(p => this.isPieceFree(p)).map(p => p.color)];
      this.baskets.forEach((b) => {
        if (b.filled === 0) {
          const matchIdx = this.basketQueue.findIndex(qCol => priorityCols.includes(qCol));
          if (matchIdx !== -1) {
            const old = b.color;
            b.color = this.basketQueue.splice(matchIdx, 1)[0];
            this.basketQueue.push(old);
          }
        }
      });

      this.sweepStorageIntoBaskets();
      this.audio.playTap();
      this.renderHUD();
      this.renderBaskets();
      this.renderSpareHoles();
      this.showToast('🔀 Baskets shuffled to match your yarn!');
    }

    useExtraHole() {
      if (this.maxSpareHoles >= 7) { this.showToast('Maximum spare holes unlocked!'); return; }
      if (this.coins < 60) { this.showToast('Need 60 coins!'); return; }
      this.coins -= 60;
      localStorage.setItem('woy_coins', String(this.coins));
      this.maxSpareHoles++;
      if (this.state === 'DEFEAT') {
        this.state = 'PLAYING';
        document.getElementById('defeatModal').classList.add('hidden');
      }
      this.audio.playBasketClear();
      this.renderHUD();
      this.renderSpareHoles();
      this.showToast('🕳️ Extra Spare Hole added!');
    }

    useBackupJar() {
      if (this.spareHoles.length === 0) { this.showToast('No spare spools to move!'); return; }
      if (this.coins < 50) { this.showToast('Need 50 coins!'); return; }
      this.coins -= 50;
      localStorage.setItem('woy_coins', String(this.coins));
      this.hasJar = true;
      const moveCount = Math.min(2, this.spareHoles.length);
      for (let i = 0; i < moveCount; i++) {
        this.backupJar.push(this.spareHoles.pop());
      }
      if (this.state === 'DEFEAT') {
        this.state = 'PLAYING';
        document.getElementById('defeatModal').classList.add('hidden');
      }
      this.audio.playBasketClear();
      this.renderHUD();
      this.renderSpareHoles();
      this.showToast('🫙 Moved threads to Backup Jar!');
    }

    // ------------------------------------------------------------------------
    // 8. VICTORY & DEFEAT
    // ------------------------------------------------------------------------
    triggerVictory() {
      this.state = 'VICTORY';
      this.audio.playVictory();
      this.spawnConfetti(window.innerWidth / 2, window.innerHeight * 0.4, 70);

      const stars = this.mistakes === 0 && !this.hasJar ? 3 : 2;
      const reward = 40 + stars * 10;
      this.coins += reward;
      localStorage.setItem('woy_coins', String(this.coins));

      const prev = this.starsMap[this.currentLevel] || 0;
      this.starsMap[this.currentLevel] = Math.max(prev, stars);
      localStorage.setItem('woy_stars', JSON.stringify(this.starsMap));

      if (this.currentLevel >= this.unlockedLevel) {
        this.unlockedLevel = this.currentLevel + 1;
        localStorage.setItem('woy_unlocked', String(this.unlockedLevel));
      }

      const theme = LEVEL_THEMES[(this.currentLevel - 1) % LEVEL_THEMES.length];
      document.getElementById('victoryTitle').textContent = `${theme.name} Complete!`;
      document.getElementById('victoryReward').textContent = reward;
      const starEls = document.querySelectorAll('#victoryStars .star');
      starEls.forEach((el, idx) => el.classList.toggle('lit', idx < stars));

      this.renderHUD();
      this.refreshMenuStats();
      setTimeout(() => {
        if (this.state === 'VICTORY') {
          document.getElementById('victoryModal').classList.remove('hidden');
        }
      }, 650);
    }

    triggerDefeat() {
      this.state = 'DEFEAT';
      this.audio.playBlocked();
      document.getElementById('defeatModal').classList.remove('hidden');
    }

    spawnConfetti(cx, cy, count) {
      const cols = Object.values(YARN_COLORS).map(c => c.hex);
      for (let i = 0; i < count; i++) {
        const a = Math.random() * Math.PI * 2;
        const sp = 120 + Math.random() * 260;
        this.confetti.push({
          x: cx, y: cy,
          vx: Math.cos(a) * sp,
          vy: Math.sin(a) * sp - 120,
          size: 6 + Math.random() * 6,
          color: cols[Math.floor(Math.random() * cols.length)],
          rot: Math.random() * Math.PI,
          life: 1.5
        });
      }
    }

    showToast(msg) {
      const el = document.getElementById('toastMsg');
      el.textContent = msg;
      el.classList.remove('hidden');
      clearTimeout(this._toastT);
      this._toastT = setTimeout(() => el.classList.add('hidden'), 2000);
    }

    // ------------------------------------------------------------------------
    // 9. INPUT: ORBIT ROTATE, ZOOM, RAYCAST TAP & PRESS-AND-HOLD PEEK
    // ------------------------------------------------------------------------
    bindInput() {
      const getPieceAt = (clientX, clientY) => {
        this.pointerNdc.x = (clientX / window.innerWidth) * 2 - 1;
        this.pointerNdc.y = -(clientY / window.innerHeight) * 2 + 1;
        this.raycaster.setFromCamera(this.pointerNdc, this.camera);
        const activeMeshes = this.pieces.filter(p => !p.removed).map(p => p.mesh);
        const hits = this.raycaster.intersectObjects(activeMeshes, false);
        if (hits.length > 0) {
          const pid = hits[0].object.userData.pieceId;
          return this.pieces[pid];
        }
        return null;
      };

      const startPeek = (piece) => {
        if (!piece || !this.isPieceFree(piece)) return;
        this.peekingPiece = piece;
        piece.mesh.material.opacity = 0.28;
        this.audio.playPeek();
        const pill = document.getElementById('peekPill');
        pill.classList.add('peeking');
        document.getElementById('peekText').textContent = '👀 Peeking Underneath...';
      };

      const stopPeek = () => {
        clearTimeout(this.peekTimer);
        if (this.peekingPiece) {
          this.peekingPiece.mesh.material.opacity = 1.0;
          this.peekingPiece = null;
        }
        const pill = document.getElementById('peekPill');
        pill.classList.remove('peeking');
        document.getElementById('peekText').textContent = 'Drag to Rotate · Scroll to Zoom · Hold Piece to Peek';
      };

      this.canvas.addEventListener('pointerdown', (e) => {
        if (this.state !== 'PLAYING') return;
        this.isDragging = true;
        this.dragMoved = false;
        this.lastPtr = { x: e.clientX, y: e.clientY };
        this.downPtr = { x: e.clientX, y: e.clientY };
        this.downTime = performance.now();

        const hitPiece = getPieceAt(e.clientX, e.clientY);
        if (hitPiece && this.isPieceFree(hitPiece)) {
          this.peekTimer = setTimeout(() => {
            if (!this.dragMoved && this.isDragging) startPeek(hitPiece);
          }, 280);
        }
      });

      window.addEventListener('pointermove', (e) => {
        if (!this.isDragging || this.state !== 'PLAYING') return;
        const dx = e.clientX - this.lastPtr.x;
        const dy = e.clientY - this.lastPtr.y;
        if (Math.hypot(e.clientX - this.downPtr.x, e.clientY - this.downPtr.y) > 7) {
          this.dragMoved = true;
          clearTimeout(this.peekTimer);
        }
        this.targetRotY += dx * 0.009;
        this.targetRotX = Math.max(-1.25, Math.min(1.25, this.targetRotX + dy * 0.009));
        this.lastPtr = { x: e.clientX, y: e.clientY };
      });

      window.addEventListener('pointerup', (e) => {
        if (!this.isDragging) return;
        const wasPeeking = !!this.peekingPiece;
        stopPeek();
        this.isDragging = false;
        if (this.state === 'PLAYING' && !this.dragMoved && !wasPeeking) {
          const hitPiece = getPieceAt(e.clientX, e.clientY);
          if (hitPiece) this.tapPiece(hitPiece);
        }
      });

      this.canvas.addEventListener('wheel', (e) => {
        if (this.state !== 'PLAYING') return;
        e.preventDefault();
        this.targetCamDist = Math.max(3.2, Math.min(8.5, this.targetCamDist + e.deltaY * 0.004));
      }, { passive: false });

      // Pinch zoom on touch
      this.canvas.addEventListener('touchstart', (e) => {
        if (e.touches.length === 2) {
          clearTimeout(this.peekTimer);
          this.pinchDist = Math.hypot(
            e.touches[0].clientX - e.touches[1].clientX,
            e.touches[0].clientY - e.touches[1].clientY
          );
        }
      }, { passive: true });

      this.canvas.addEventListener('touchmove', (e) => {
        if (e.touches.length === 2 && this.pinchDist > 0) {
          const d = Math.hypot(
            e.touches[0].clientX - e.touches[1].clientX,
            e.touches[0].clientY - e.touches[1].clientY
          );
          this.targetCamDist = Math.max(3.2, Math.min(8.5, this.targetCamDist - (d - this.pinchDist) * 0.015));
          this.pinchDist = d;
        }
      }, { passive: true });
    }

    // ------------------------------------------------------------------------
    // 10. UI BINDINGS
    // ------------------------------------------------------------------------
    refreshMenuStats() {
      document.getElementById('menuCoins').textContent = this.coins;
      const totalStars = Object.values(this.starsMap).reduce((a, b) => a + b, 0);
      document.getElementById('menuStars').textContent = totalStars;
      const cleared = Object.keys(this.starsMap).length;
      document.getElementById('menuCleared').textContent = `${cleared} / 12`;
      document.getElementById('btnPlaySub').textContent = `LEVEL ${this.unlockedLevel}`;
      const sndLabel = this.audio.enabled ? '🔊 Sound: ON' : '🔇 Sound: OFF';
      document.getElementById('btnMenuSound').textContent = sndLabel;
      document.getElementById('btnSound').textContent = this.audio.enabled ? '🔊' : '🔇';
    }

    renderLevelsGrid() {
      const grid = document.getElementById('levelsGrid');
      grid.innerHTML = '';
      const maxShow = Math.max(12, this.unlockedLevel + 3);
      for (let i = 1; i <= maxShow; i++) {
        const theme = LEVEL_THEMES[(i - 1) % LEVEL_THEMES.length];
        const locked = i > this.unlockedLevel;
        const stars = this.starsMap[i] || 0;
        const btn = document.createElement('button');
        btn.className = `lvl-tile ${locked ? 'locked' : ''} ${i === this.unlockedLevel ? 'current' : ''}`;
        btn.innerHTML = `
          <span class="lvl-num">${i}</span>
          <span class="lvl-name">${theme.icon} ${theme.name}</span>
          <span class="lvl-stars">${'⭐'.repeat(stars)}${'☆'.repeat(3 - stars)}</span>
        `;
        if (!locked) {
          btn.addEventListener('click', () => {
            document.getElementById('levelsModal').classList.add('hidden');
            this.startLevel(i);
          });
        }
        grid.appendChild(btn);
      }
    }

    bindUI() {
      document.getElementById('btnPlay').addEventListener('click', () => {
        this.audio.playTap();
        this.startLevel(this.unlockedLevel);
      });
      document.getElementById('btnLevels').addEventListener('click', () => {
        this.audio.playTap();
        this.renderLevelsGrid();
        document.getElementById('levelsModal').classList.remove('hidden');
      });
      document.getElementById('btnHowTo').addEventListener('click', () => {
        this.audio.playTap();
        document.getElementById('howToModal').classList.remove('hidden');
      });
      const toggleSound = () => {
        this.audio.toggle();
        this.refreshMenuStats();
      };
      document.getElementById('btnMenuSound').addEventListener('click', toggleSound);
      document.getElementById('btnSound').addEventListener('click', toggleSound);

      document.getElementById('btnHome').addEventListener('click', () => {
        this.state = 'MENU';
        document.getElementById('gameHud').classList.add('hidden');
        document.getElementById('basketsTray').classList.add('hidden');
        document.getElementById('bottomTray').classList.add('hidden');
        document.getElementById('peekPill').classList.add('hidden');
        document.getElementById('menuScreen').classList.remove('hidden');
        this.loadMenuShowcase();
        this.refreshMenuStats();
      });

      document.getElementById('btnRestart').addEventListener('click', () => this.startLevel(this.currentLevel));
      document.getElementById('btnResetCam').addEventListener('click', () => {
        this.targetRotY = 0.35; this.targetRotX = 0.25; this.targetCamDist = 5.4;
      });

      document.getElementById('btnBoostShuffle').addEventListener('click', () => this.useShuffle());
      document.getElementById('btnBoostHole').addEventListener('click', () => this.useExtraHole());
      document.getElementById('btnBoostJar').addEventListener('click', () => this.useBackupJar());

      document.getElementById('btnVictoryReplay').addEventListener('click', () => this.startLevel(this.currentLevel));
      document.getElementById('btnNextLevel').addEventListener('click', () => this.startLevel(this.currentLevel + 1));

      document.getElementById('btnDefeatJar').addEventListener('click', () => this.useBackupJar());
      document.getElementById('btnDefeatHole').addEventListener('click', () => this.useExtraHole());
      document.getElementById('btnRetryLevel').addEventListener('click', () => this.startLevel(this.currentLevel));
      document.getElementById('btnDefeatMenu').addEventListener('click', () => {
        document.getElementById('defeatModal').classList.add('hidden');
        document.getElementById('btnHome').click();
      });

      document.querySelectorAll('[data-close]').forEach(el => {
        el.addEventListener('click', () => {
          document.getElementById(el.dataset.close).classList.add('hidden');
        });
      });
    }

    // ------------------------------------------------------------------------
    // 11. RENDER & FX LOOP
    // ------------------------------------------------------------------------
    loop(now) {
      const dt = Math.min(0.05, (now - this.lastTime) / 1000);
      this.lastTime = now;

      if (this.state === 'MENU') {
        this.targetRotY += dt * 0.45;
      }

      this.rotY += (this.targetRotY - this.rotY) * (1 - Math.exp(-12 * dt));
      this.rotX += (this.targetRotX - this.rotX) * (1 - Math.exp(-12 * dt));
      this.camDist += (this.targetCamDist - this.camDist) * (1 - Math.exp(-10 * dt));

      this.modelGroup.rotation.y = this.rotY;
      this.modelGroup.rotation.x = this.rotX;
      this.camera.position.z = this.camDist;

      this.renderer.render(this.scene, this.camera);
      this.renderFxOverlay(dt);

      requestAnimationFrame(this.loop.bind(this));
    }

    renderFxOverlay(dt) {
      const ctx = this.fxCtx;
      ctx.clearRect(0, 0, this.fxCanvas.width, this.fxCanvas.height);

      // Flying Yarn Threads
      for (let i = this.flyingThreads.length - 1; i >= 0; i--) {
        const ft = this.flyingThreads[i];
        ft.t += dt * 2.8;
        if (ft.t >= 1) {
          this.flyingThreads.splice(i, 1);
          continue;
        }
        const cx = (ft.sx + ft.ex) / 2;
        const cy = Math.min(ft.sy, ft.ey) - 90;
        const p = ft.t;
        const x = (1 - p) * (1 - p) * ft.sx + 2 * (1 - p) * p * cx + p * p * ft.ex;
        const y = (1 - p) * (1 - p) * ft.sy + 2 * (1 - p) * p * cy + p * p * ft.ey;

        ctx.save();
        ctx.strokeStyle = ft.color;
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(ft.sx, ft.sy);
        ctx.quadraticCurveTo(cx, cy, x, y);
        ctx.stroke();

        ctx.fillStyle = ft.color;
        ctx.beginPath();
        ctx.arc(x, y, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2.5;
        ctx.stroke();
        ctx.restore();
      }

      // Confetti
      for (let i = this.confetti.length - 1; i >= 0; i--) {
        const c = this.confetti[i];
        c.life -= dt;
        if (c.life <= 0) { this.confetti.splice(i, 1); continue; }
        c.vy += 460 * dt;
        c.x += c.vx * dt;
        c.y += c.vy * dt;
        c.rot += dt * 7;
        ctx.save();
        ctx.translate(c.x, c.y);
        ctx.rotate(c.rot);
        ctx.globalAlpha = Math.min(1, c.life);
        ctx.fillStyle = c.color;
        ctx.fillRect(-c.size / 2, -c.size / 4, c.size, c.size / 2);
        ctx.restore();
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.woyGame = new WorldOfYarnGame(); });
  } else {
    window.woyGame = new WorldOfYarnGame();
  }
})();
