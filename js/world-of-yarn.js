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
    amber:   { name: 'Honey',   hex: '#f59e0b', num: 0xf59e0b, dark: '#b45309' },
    mint:    { name: 'Mint',    hex: '#34d399', num: 0x34d399, dark: '#047857' },
    sky:     { name: 'Sky',     hex: '#38bdf8', num: 0x38bdf8, dark: '#0369a1' },
    lavender:{ name: 'Lilac',   hex: '#c084fc', num: 0xc084fc, dark: '#7e22ce' },
    peach:   { name: 'Peach',   hex: '#fb923c', num: 0xfb923c, dark: '#c2410c' },
    cream:   { name: 'Latte',   hex: '#e7b98a', num: 0xe7b98a, dark: '#9a6534' },
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
  // 4. 12 HANDCRAFTED 3D KNITTED ANIMAL DIORAMAS
  //    Each animal has cohesive anatomy, button eyes, nose, and layered pieces.
  //    Colors are assigned in exact multiples of 3 so every level is 100% solvable.
  // --------------------------------------------------------------------------
  const LEVEL_THEMES = [
    { name: 'Teddy Bear',       icon: '🧸', colors: ['cream', 'peach', 'coral', 'sky'],           baskets: 2 },
    { name: 'Cute Bunny',       icon: '🐰', colors: ['cream', 'berry', 'lavender', 'mint'],       baskets: 2 },
    { name: 'Cute Kitty',       icon: '🐱', colors: ['peach', 'cream', 'berry', 'sky'],           baskets: 2 },
    { name: 'Cozy Sheep',       icon: '🐑', colors: ['cream', 'coral', 'sky', 'amber'],           baskets: 3 },
    { name: 'Panda Bear',       icon: '🐼', colors: ['cream', 'sky', 'mint', 'coral'],            baskets: 3 },
    { name: 'Little Duckling',  icon: '🐥', colors: ['amber', 'peach', 'sky', 'mint'],            baskets: 3 },
    { name: 'Happy Frog',       icon: '🐸', colors: ['mint', 'amber', 'coral', 'sky', 'cream'],   baskets: 3 },
    { name: 'Winter Penguin',   icon: '🐧', colors: ['sky', 'cream', 'coral', 'amber', 'mint'],   baskets: 3 },
    { name: 'Sleepy Fox',       icon: '🦊', colors: ['peach', 'cream', 'mint', 'lavender', 'sky'],baskets: 3 },
    { name: 'Little Piggy',     icon: '🐷', colors: ['coral', 'berry', 'cream', 'sky', 'mint'],   baskets: 3 },
    { name: 'Puppy Dog',        icon: '🐶', colors: ['cream', 'peach', 'sky', 'coral', 'amber'],  baskets: 3 },
    { name: 'Cute Koala',       icon: '🐨', colors: ['lavender', 'cream', 'mint', 'sky', 'coral'],baskets: 3 }
  ];

  // Helper to build a balanced color list (exact multiples of 3)
  function buildColorPool(totalPieces, palette) {
    const n = Math.floor(totalPieces / 3) * 3;
    const pool = [];
    let ci = 0;
    for (let i = 0; i < n; i += 3) {
      const col = palette[ci % palette.length];
      pool.push(col, col, col);
      ci++;
    }
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return pool;
  }

  // Generate cohesive 3D knitted animal pieces for a given level index (0-based)
  function buildDioramaSpecs(levelIdx) {
    const theme = LEVEL_THEMES[levelIdx % LEVEL_THEMES.length];
    const extraTier = Math.floor(levelIdx / LEVEL_THEMES.length);
    const specs = [];

    const add = (shape, pos, scale, rot, layer, blockedBy = [], fixedColor = null) => {
      specs.push({
        id: specs.length,
        shape,
        pos,
        scale: scale || [1, 1, 1],
        rot: rot || [0, 0, 0],
        layer,
        blockedBy,
        fixedColor
      });
    };

    const idx = levelIdx % 12;
    let faceSpec = { headId: 1, eyePos: [0.22, 0.78, 0.56], nosePos: [0, 0.65, 0.72], noseColor: 0x3b2618, beak: false };

    if (idx === 0 || idx === 4 || idx === 11) {
      // TEDDY BEAR (idx 0), PANDA BEAR (idx 4), CUTE KOALA (idx 11) — 15 cohesive pieces
      const isKoala = idx === 11;
      const isPanda = idx === 4;
      add('sphere', [0, -0.38, 0], [1.0, 1.05, 0.88], [0, 0, 0], 0); // 0: torso core
      add('sphere', [0, 0.66, 0.04], [0.95, 0.86, 0.86], [0, 0, 0], 1); // 1: head
      add('sphere', [0, -0.36, 0.44], [0.64, 0.72, 0.34], [0, 0, 0], 2); // 2: belly patch
      add('sphere', [0, 0.55, 0.48], [0.42, 0.32, 0.34], [0, 0, 0], 2); // 3: snout
      // Ears (Koala has bigger round ears!)
      const earScale = isKoala ? [0.44, 0.44, 0.24] : [0.34, 0.34, 0.22];
      const earX = isKoala ? 0.62 : 0.48;
      add('sphere', [earX, 1.12, 0.02], earScale, [0, 0, 0], 2); // 4: ear R
      add('sphere', [-earX, 1.12, 0.02], earScale, [0, 0, 0], 2); // 5: ear L
      // Arms hugging in front
      add('capsule', [0.68, -0.18, 0.22], [0.26, 0.54, 0.26], [0.35, 0, -0.55], 2); // 6: arm R
      add('capsule', [-0.68, -0.18, 0.22], [0.26, 0.54, 0.26], [0.35, 0, 0.55], 2); // 7: arm L
      // Sitting legs
      add('capsule', [0.42, -0.96, 0.32], [0.3, 0.48, 0.34], [1.15, 0, -0.2], 2); // 8: leg R
      add('capsule', [-0.42, -0.96, 0.32], [0.3, 0.48, 0.34], [1.15, 0, 0.2], 2); // 9: leg L
      // Bow tie / Collar
      add('cone', [0.2, 0.12, 0.52], [0.18, 0.26, 0.14], [0, 0, 1.45], 2); // 10: bow R
      add('cone', [-0.2, 0.12, 0.52], [0.18, 0.26, 0.14], [0, 0, -1.45], 2); // 11: bow L
      // Fluffy round tail & back head puffs
      add('sphere', [0, -0.68, -0.56], [0.28, 0.28, 0.28], [0, 0, 0], 2); // 12: tail
      add('sphere', [0.34, 0.66, -0.42], [0.36, 0.36, 0.32], [0, 0, 0], 2); // 13: back head R
      add('sphere', [-0.34, 0.66, -0.42], [0.36, 0.36, 0.32], [0, 0, 0], 2); // 14: back head L

      specs[0].blockedBy.push(2, 6, 7, 8, 9, 12);
      specs[1].blockedBy.push(3, 4, 5, 13, 14);
      faceSpec = {
        headId: 1,
        eyePos: [0.22, 0.76, 0.54],
        nosePos: [0, 0.62, 0.68],
        noseColor: isPanda ? 0x1e293b : (isKoala ? 0x312e81 : 0x451a03),
        noseScale: isKoala ? [0.11, 0.15, 0.08] : [0.09, 0.07, 0.07],
        beak: false
      };
    } else if (idx === 1) {
      // CUTE BUNNY (15 cohesive pieces)
      add('sphere', [0, -0.42, 0], [0.95, 1.0, 0.9], [0, 0, 0], 0); // 0: body
      add('sphere', [0, 0.58, 0.05], [0.88, 0.82, 0.82], [0, 0, 0], 1); // 1: head
      add('sphere', [0, -0.42, 0.42], [0.58, 0.66, 0.32], [0, 0, 0], 2); // 2: belly
      // Tall floppy bunny ears
      add('capsule', [0.26, 1.32, 0.02], [0.22, 0.68, 0.18], [0.1, 0, -0.18], 2); // 3: ear R
      add('capsule', [-0.26, 1.32, 0.02], [0.22, 0.68, 0.18], [0.1, 0, 0.18], 2); // 4: ear L
      // Chubby cheeks
      add('sphere', [0.34, 0.5, 0.44], [0.22, 0.18, 0.18], [0, 0, 0], 2); // 5: cheek R
      add('sphere', [-0.34, 0.5, 0.44], [0.22, 0.18, 0.18], [0, 0, 0], 2); // 6: cheek L
      // Front paws & big bunny feet
      add('capsule', [0.58, -0.22, 0.24], [0.22, 0.46, 0.22], [0.4, 0, -0.5], 2); // 7
      add('capsule', [-0.58, -0.22, 0.24], [0.22, 0.46, 0.22], [0.4, 0, 0.5], 2); // 8
      add('capsule', [0.38, -0.98, 0.36], [0.26, 0.48, 0.34], [1.3, 0, -0.15], 2); // 9
      add('capsule', [-0.38, -0.98, 0.36], [0.26, 0.48, 0.34], [1.3, 0, 0.15], 2); // 10
      // Cotton tail & collar
      add('sphere', [0, -0.62, -0.54], [0.34, 0.34, 0.34], [0, 0, 0], 2); // 11
      add('torus', [0, 0.08, 0.06], [0.52, 0.52, 0.52], [Math.PI / 2, 0, 0], 2); // 12
      add('sphere', [0.3, 0.58, -0.4], [0.34, 0.34, 0.3], [0, 0, 0], 2); // 13
      add('sphere', [-0.3, 0.58, -0.4], [0.34, 0.34, 0.3], [0, 0, 0], 2); // 14

      specs[0].blockedBy.push(2, 7, 8, 9, 10, 11, 12);
      specs[1].blockedBy.push(3, 4, 5, 6, 13, 14);
      faceSpec = { headId: 1, eyePos: [0.2, 0.68, 0.5], nosePos: [0, 0.56, 0.56], noseColor: 0xf43f5e, beak: false };
    } else if (idx === 2 || idx === 8 || idx === 10) {
      // CUTE KITTY (idx 2), SLEEPY FOX (idx 8), PUPPY DOG (idx 10) — 15 cohesive pieces
      const isPuppy = idx === 10;
      const isFox = idx === 8;
      add('sphere', [0, -0.4, 0], [0.95, 1.0, 0.9], [0, 0, 0], 0); // 0: body
      add('sphere', [0, 0.62, 0.06], [0.88, 0.8, 0.82], [0, 0, 0], 1); // 1: head
      add('torus', [0, 0.12, 0.06], [0.52, 0.52, 0.52], [Math.PI / 2, 0, 0], 2); // 2: collar/scarf
      if (isPuppy) {
        // Floppy drooping ears
        add('capsule', [0.56, 0.48, 0.08], [0.24, 0.54, 0.18], [0, 0, 0.28], 2); // 3
        add('capsule', [-0.56, 0.48, 0.08], [0.24, 0.54, 0.18], [0, 0, -0.28], 2); // 4
      } else {
        // Pointy cat/fox ears
        add('cone', [0.38, 1.18, 0.06], [0.26, 0.44, 0.24], [0, 0, -0.32], 2); // 3
        add('cone', [-0.38, 1.18, 0.06], [0.26, 0.44, 0.24], [0, 0, 0.32], 2); // 4
      }
      add('sphere', [0, 0.5, 0.46], [0.38, 0.28, 0.34], [0, 0, 0], 2); // 5: muzzle
      add('sphere', [0, -0.4, 0.44], [0.58, 0.64, 0.32], [0, 0, 0], 2); // 6: belly
      // 4 paws
      add('capsule', [0.56, -0.26, 0.24], [0.22, 0.44, 0.22], [0.4, 0, -0.45], 2); // 7
      add('capsule', [-0.56, -0.26, 0.24], [0.22, 0.44, 0.22], [0.4, 0, 0.45], 2); // 8
      add('capsule', [0.36, -0.96, 0.34], [0.24, 0.44, 0.28], [1.2, 0, -0.15], 2); // 9
      add('capsule', [-0.36, -0.96, 0.34], [0.24, 0.44, 0.28], [1.2, 0, 0.15], 2); // 10
      // Curled/bushy tail (2 segments)
      add('capsule', [0.46, -0.45, -0.46], [isFox ? 0.32 : 0.22, 0.58, isFox ? 0.32 : 0.22], [0.5, 0, -0.6], 2); // 11
      add('sphere', [0.68, -0.05, -0.62], [isFox ? 0.34 : 0.24, isFox ? 0.34 : 0.24, 0.26], [0, 0, 0], 2); // 12
      add('sphere', [0.32, 0.62, -0.38], [0.34, 0.34, 0.3], [0, 0, 0], 2); // 13
      add('sphere', [-0.32, 0.62, -0.38], [0.34, 0.34, 0.3], [0, 0, 0], 2); // 14

      specs[0].blockedBy.push(2, 6, 7, 8, 9, 10, 11);
      specs[1].blockedBy.push(3, 4, 5, 13, 14);
      faceSpec = { headId: 1, eyePos: [0.2, 0.72, 0.52], nosePos: [0, 0.58, 0.66], noseColor: isFox ? 0x1e293b : 0xf43f5e, beak: false };
    } else if (idx === 3) {
      // COZY SHEEP (15 tightly-packed cloud wool puffs + cute peeking face!)
      add('sphere', [0, 0, 0], [1.05, 0.92, 1.05], [0, 0, 0], 0); // 0: body core
      add('sphere', [0, 0.16, 0.64], [0.62, 0.58, 0.62], [0, 0, 0], 1); // 1: face
      add('torus', [0, -0.08, 0.44], [0.48, 0.48, 0.48], [Math.PI / 2.2, 0, 0], 2); // 2: collar
      // Tightly nestled wool puffs around body
      const puffs = [
        [0, 0.68, 0.1], [0.58, 0.28, 0.18], [-0.58, 0.28, 0.18],
        [0.54, 0.25, -0.38], [-0.54, 0.25, -0.38], [0, 0.42, -0.62],
        [0.42, -0.28, 0.35], [-0.42, -0.28, 0.35], [0, -0.3, -0.58]
      ];
      puffs.forEach((p) => {
        const pId = specs.length;
        add('sphere', p, [0.46, 0.46, 0.46], [0, 0, 0], 2);
        specs[0].blockedBy.push(pId);
      });
      // Cute floppy sheep ears & little tail
      add('capsule', [0.46, 0.34, 0.66], [0.18, 0.38, 0.18], [0, 0, -0.95], 2);
      add('capsule', [-0.46, 0.34, 0.66], [0.18, 0.38, 0.18], [0, 0, 0.95], 2);
      add('sphere', [0, 0.05, -0.82], [0.3, 0.3, 0.3], [0, 0, 0], 2);
      specs[0].blockedBy.push(1, 2);
      faceSpec = { headId: 1, eyePos: [0.16, 0.24, 0.96], nosePos: [0, 0.12, 1.02], noseColor: 0xf43f5e, beak: false };
    } else if (idx === 5 || idx === 7) {
      // LITTLE DUCKLING (idx 5) & WINTER PENGUIN (idx 7) — 15 cohesive pieces
      const isPenguin = idx === 7;
      add('sphere', [0, -0.34, 0], [0.96, 1.04, 0.9], [0, 0, 0], 0); // 0: body
      add('sphere', [0, 0.66, 0.05], [0.84, 0.78, 0.8], [0, 0, 0], 1); // 1: head
      add('sphere', [0, -0.34, 0.44], [0.64, 0.74, 0.32], [0, 0, 0], 2); // 2: belly
      // Beak
      add('cone', [0, 0.56, 0.56], [0.24, 0.34, 0.2], [Math.PI / 2, 0, 0], 2); // 3: beak
      // Wings / Flippers
      add('capsule', [0.68, -0.22, 0.06], [0.22, 0.52, 0.3], [0, 0, -0.45], 2); // 4
      add('capsule', [-0.68, -0.22, 0.06], [0.22, 0.52, 0.3], [0, 0, 0.45], 2); // 5
      // Feet
      add('capsule', [0.34, -0.96, 0.24], [0.22, 0.36, 0.32], [Math.PI / 2, 0, 0], 2); // 6
      add('capsule', [-0.34, -0.96, 0.24], [0.22, 0.36, 0.32], [Math.PI / 2, 0, 0], 2); // 7
      // Hat / Head tuft
      add('cone', [0, 1.18, 0.04], [isPenguin ? 0.48 : 0.2, isPenguin ? 0.52 : 0.32, isPenguin ? 0.48 : 0.2], [0, 0, 0], 2); // 8
      add('sphere', [0, 1.46, 0.04], [0.24, 0.24, 0.24], [0, 0, 0], 2); // 9: pom-pom
      // Scarf & back puffs
      add('torus', [0, 0.14, 0.05], [0.54, 0.54, 0.54], [Math.PI / 2, 0, 0], 2); // 10
      add('sphere', [0, -0.58, -0.52], [0.32, 0.26, 0.34], [0, 0, 0], 2); // 11: tail
      add('sphere', [0.34, 0.64, -0.38], [0.34, 0.34, 0.3], [0, 0, 0], 2); // 12
      add('sphere', [-0.34, 0.64, -0.38], [0.34, 0.34, 0.3], [0, 0, 0], 2); // 13
      add('sphere', [0, -0.28, -0.5], [0.46, 0.46, 0.3], [0, 0, 0], 2); // 14

      specs[0].blockedBy.push(2, 4, 5, 6, 7, 10, 11, 14);
      specs[1].blockedBy.push(3, 8, 9, 12, 13);
      faceSpec = { headId: 1, eyePos: [0.22, 0.78, 0.48], nosePos: [0, 0.56, 0.68], noseColor: 0xf97316, beak: true };
    } else if (idx === 6) {
      // HAPPY FROG (15 cohesive pieces)
      add('sphere', [0, -0.38, 0], [1.05, 0.92, 0.92], [0, 0, 0], 0); // 0: body
      add('sphere', [0, 0.56, 0.06], [1.02, 0.68, 0.84], [0, 0, 0], 1); // 1: wide frog head
      add('sphere', [0, -0.38, 0.45], [0.68, 0.64, 0.32], [0, 0, 0], 2); // 2: belly
      // Raised frog eye bumps!
      add('sphere', [0.34, 0.96, 0.14], [0.28, 0.28, 0.28], [0, 0, 0], 2); // 3
      add('sphere', [-0.34, 0.96, 0.14], [0.28, 0.28, 0.28], [0, 0, 0], 2); // 4
      // Cheeks
      add('sphere', [0.44, 0.5, 0.42], [0.22, 0.18, 0.18], [0, 0, 0], 2); // 5
      add('sphere', [-0.44, 0.5, 0.42], [0.22, 0.18, 0.18], [0, 0, 0], 2); // 6
      // Legs & arms
      add('capsule', [0.66, -0.24, 0.22], [0.22, 0.46, 0.22], [0.3, 0, -0.5], 2); // 7
      add('capsule', [-0.66, -0.24, 0.22], [0.22, 0.46, 0.22], [0.3, 0, 0.5], 2); // 8
      add('capsule', [0.54, -0.88, 0.3], [0.28, 0.5, 0.32], [1.2, 0, -0.3], 2); // 9
      add('capsule', [-0.54, -0.88, 0.3], [0.28, 0.5, 0.32], [1.2, 0, 0.3], 2); // 10
      add('torus', [0, 0.1, 0.06], [0.56, 0.56, 0.56], [Math.PI / 2, 0, 0], 2); // 11
      add('sphere', [0.36, 0.56, -0.4], [0.34, 0.34, 0.3], [0, 0, 0], 2); // 12
      add('sphere', [-0.36, 0.56, -0.4], [0.34, 0.34, 0.3], [0, 0, 0], 2); // 13
      add('sphere', [0, -0.38, -0.52], [0.46, 0.46, 0.3], [0, 0, 0], 2); // 14

      specs[0].blockedBy.push(2, 7, 8, 9, 10, 11, 14);
      specs[1].blockedBy.push(3, 4, 5, 6, 12, 13);
      faceSpec = { headId: 1, eyePos: [0.34, 0.98, 0.32], nosePos: [0, 0.58, 0.56], noseColor: 0x065f46, beak: false };
    } else {
      // LITTLE PIGGY (idx 9) — 15 cohesive pieces
      add('sphere', [0, -0.38, 0], [1.04, 0.98, 0.96], [0, 0, 0], 0); // 0: chubby body
      add('sphere', [0, 0.6, 0.06], [0.92, 0.84, 0.84], [0, 0, 0], 1); // 1: head
      add('cylinder', [0, 0.52, 0.56], [0.28, 0.22, 0.28], [Math.PI / 2, 0, 0], 2); // 2: pig snout
      add('cone', [0.46, 1.06, 0.06], [0.24, 0.38, 0.2], [0.3, 0, -0.55], 2); // 3: floppy ear R
      add('cone', [-0.46, 1.06, 0.06], [0.24, 0.38, 0.2], [0.3, 0, 0.55], 2); // 4: floppy ear L
      add('sphere', [0, -0.38, 0.46], [0.6, 0.64, 0.32], [0, 0, 0], 2); // 5: belly
      add('capsule', [0.62, -0.22, 0.2], [0.24, 0.44, 0.24], [0.3, 0, -0.5], 2); // 6
      add('capsule', [-0.62, -0.22, 0.2], [0.24, 0.44, 0.24], [0.3, 0, 0.5], 2); // 7
      add('capsule', [0.38, -0.96, 0.32], [0.26, 0.42, 0.28], [1.1, 0, -0.15], 2); // 8
      add('capsule', [-0.38, -0.96, 0.32], [0.26, 0.42, 0.28], [1.1, 0, 0.15], 2); // 9
      add('torus', [0, -0.45, -0.56], [0.2, 0.2, 0.2], [0, 0.4, 0], 2); // 10: curly tail
      add('torus', [0, 0.1, 0.06], [0.54, 0.54, 0.54], [Math.PI / 2, 0, 0], 2); // 11: collar
      add('sphere', [0.34, 0.6, -0.4], [0.34, 0.34, 0.3], [0, 0, 0], 2); // 12
      add('sphere', [-0.34, 0.6, -0.4], [0.34, 0.34, 0.3], [0, 0, 0], 2); // 13
      add('sphere', [0, -0.38, -0.52], [0.46, 0.46, 0.3], [0, 0, 0], 2); // 14

      specs[0].blockedBy.push(5, 6, 7, 8, 9, 10, 11, 14);
      specs[1].blockedBy.push(2, 3, 4, 12, 13);
      faceSpec = { headId: 1, eyePos: [0.22, 0.74, 0.52], nosePos: [0, 0.54, 0.72], noseColor: 0xf43f5e, beak: false };
    }

    // Assign balanced colors (exact multiples of 3)
    const pool = buildColorPool(specs.length, theme.colors);
    specs.forEach((s, i) => {
      s.color = pool[i % pool.length];
    });
    return { theme, specs, extraTier, faceSpec };
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

      // Warm Cozy Lighting (balanced so knitted V-stitches pop cleanly)
      const hemi = new THREE.HemisphereLight(0xfffaf0, 0xc4b5fd, 0.78);
      this.scene.add(hemi);

      const dir1 = new THREE.DirectionalLight(0xfff7ed, 0.68);
      dir1.position.set(4, 6, 5);
      this.scene.add(dir1);

      const dir2 = new THREE.DirectionalLight(0xe0f2fe, 0.35);
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
      if (shape === 'capsule') return new THREE.SphereGeometry(0.52, 20, 16); // Plump plush limb!
      return new THREE.SphereGeometry(0.58, 22, 18);
    }

    buildFaceDetails(faceSpec) {
      const fg = new THREE.Group();
      const eyeMat = new THREE.MeshStandardMaterial({ color: 0x1e1b18, roughness: 0.2, metalness: 0.1 });
      const shineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const eyeGeom = new THREE.SphereGeometry(0.068, 14, 12);
      const shineGeom = new THREE.SphereGeometry(0.022, 8, 8);

      [-1, 1].forEach((side) => {
        const eye = new THREE.Mesh(eyeGeom, eyeMat);
        eye.position.set(side * faceSpec.eyePos[0], faceSpec.eyePos[1], faceSpec.eyePos[2]);
        fg.add(eye);

        const shine = new THREE.Mesh(shineGeom, shineMat);
        shine.position.set(side * faceSpec.eyePos[0] + 0.02, faceSpec.eyePos[1] + 0.025, faceSpec.eyePos[2] + 0.055);
        fg.add(shine);
      });

      // Button nose (if not a bird beak)
      if (!faceSpec.beak) {
        const noseMat = new THREE.MeshStandardMaterial({ color: faceSpec.noseColor || 0x3b2618, roughness: 0.35 });
        const nose = new THREE.Mesh(new THREE.SphereGeometry(0.08, 14, 12), noseMat);
        nose.position.set(faceSpec.nosePos[0], faceSpec.nosePos[1], faceSpec.nosePos[2]);
        const ns = faceSpec.noseScale || [1.1, 0.85, 0.85];
        nose.scale.set(ns[0] * 10, ns[1] * 10, ns[2] * 10);
        // Normalize small nose scale
        if (faceSpec.noseScale) nose.scale.set(faceSpec.noseScale[0] * 10, faceSpec.noseScale[1] * 10, faceSpec.noseScale[2] * 10);
        else nose.scale.set(1.1, 0.85, 0.85);
        fg.add(nose);
      }
      return fg;
    }

    buildModel(levelIdx) {
      this.clearModel();
      const { theme, specs, faceSpec } = buildDioramaSpecs(levelIdx);

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

      this.faceHeadId = faceSpec ? faceSpec.headId : -1;
      this.faceGroup = faceSpec ? this.buildFaceDetails(faceSpec) : null;
      if (this.faceGroup) this.modelGroup.add(this.faceGroup);

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
        p.mesh.material.emissiveIntensity = free ? 0.02 : 0.0;
        p.mesh.material.color.setHex(free ? 0xffffff : 0xc8c8c8);
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
      if (this.faceGroup && piece.id === this.faceHeadId) {
        this.faceGroup.visible = false;
      }
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
