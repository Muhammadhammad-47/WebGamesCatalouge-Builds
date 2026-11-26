/* ==========================================================================
   COUNT CONTROL LEGENDS — 3D Crowd Runner & Math Gate Battle
   Three.js 3D skybridge, animated stickmen crowd, blue/red math gates,
   spinning saw traps, enemy squad clashes, Giant Boss & Rainbow Staircase!
   ========================================================================== */
(() => {
  'use strict';

  // --------------------------------------------------------------------------
  // 1. SKINS & AUDIO SYNTHESIZER
  // --------------------------------------------------------------------------
  const SKINS = [
    { id: 'blue',   name: 'Classic Blue',  color: 0x2563eb, hex: '#2563eb', price: 0 },
    { id: 'cyan',   name: 'Neon Cyan',     color: 0x06b6d4, hex: '#06b6d4', price: 150 },
    { id: 'gold',   name: 'Gold Knights',  color: 0xf59e0b, hex: '#f59e0b', price: 300 },
    { id: 'purple', name: 'Royal Violet',  color: 0x8b5cf6, hex: '#8b5cf6', price: 450 },
    { id: 'mint',   name: 'Emerald Squad', color: 0x10b981, hex: '#10b981', price: 600 }
  ];

  // --------------------------------------------------------------------------
  // LEVELS: 30 fixed levels (same layout every time), each harder than the last
  // --------------------------------------------------------------------------
  const MAX_LEVEL = 30;
  // Level design tweaks: a few level layouts were re-rolled after bot playtesting showed them unfair.
  const LAYOUT_VARIANT = { 24: 1, 27: 1 };
  // A new colour world every 5 levels: sky, road, rails, bridge and the player's squad colour.
  const THEMES = [
    { name: 'SKY CITY',      icon: '☁️', sky: ['#0284c7', '#38bdf8', '#e0f2fe'], track: 0xf1f5f9, rail: 0x0ea5e9, bridge: 0xfbbf24, player: 0x2563eb },
    { name: 'SUNSET CLIFFS', icon: '🌅', sky: ['#c2410c', '#fb923c', '#fde68a'], track: 0xfff7ed, rail: 0xf97316, bridge: 0x8b5cf6, player: 0x7c3aed },
    { name: 'MINT VALLEY',   icon: '🌿', sky: ['#047857', '#34d399', '#d1fae5'], track: 0xf0fdf4, rail: 0x10b981, bridge: 0xf59e0b, player: 0x0891b2 },
    { name: 'NEON NIGHT',    icon: '🌙', sky: ['#0f172a', '#312e81', '#6d28d9'], track: 0x334155, rail: 0xe879f9, bridge: 0x22d3ee, player: 0x84cc16 },
    { name: 'CANDY LAND',    icon: '🍭', sky: ['#be185d', '#f472b6', '#fce7f3'], track: 0xfdf2f8, rail: 0xec4899, bridge: 0x38bdf8, player: 0x0ea5e9 },
    { name: 'GOLDEN DESERT', icon: '🏜️', sky: ['#92400e', '#f59e0b', '#fef3c7'], track: 0xfde68a, rail: 0xb45309, bridge: 0x0d9488, player: 0x059669 },
  ];
  // The gift box at the top of the stairs gets better with every world: new look, bigger, more loot.
  const GIFT_TIERS = [
    { name: 'WOODEN CRATE',     box: 0x92400e, ribbon: 0x57534e, metal: 0.1,  rough: 0.8,  scale: 1.0,  drops: 8,  value: 10, gem: false, glow: null },
    { name: 'RED GIFT BOX',     box: 0xf43f5e, ribbon: 0xfacc15, metal: 0.2,  rough: 0.35, scale: 1.1,  drops: 12, value: 10, gem: false, glow: null },
    { name: 'SILVER CHEST',     box: 0xe2e8f0, ribbon: 0x2563eb, metal: 0.3,  rough: 0.3, shine: 0x64748b, scale: 1.2,  drops: 14, value: 15, gem: false, glow: 0x93c5fd },
    { name: 'GOLDEN CHEST',     box: 0xfacc15, ribbon: 0xdc2626, metal: 0.35, rough: 0.25, shine: 0xa16207,  scale: 1.3,  drops: 16, value: 20, gem: false, glow: 0xfde047 },
    { name: 'DIAMOND BOX',      box: 0x67e8f9, ribbon: 0xffffff, metal: 0.3,  rough: 0.05, scale: 1.4,  drops: 18, value: 25, gem: true,  glow: 0x22d3ee },
    { name: 'LEGENDARY CHEST',  box: 0x8b5cf6, ribbon: 0xfacc15, metal: 0.3,  rough: 0.2, shine: 0x6d28d9, scale: 1.55, drops: 22, value: 30, gem: true,  glow: 0xf0abfc },
  ];
  const giftTierFor = (L) => GIFT_TIERS[Math.min(GIFT_TIERS.length - 1, Math.floor((L - 1) / 5))];

  const themeFor = (L) => THEMES[Math.min(THEMES.length - 1, Math.floor((L - 1) / 5))];

  function mkRng(seed) { // mulberry32: deterministic per level
    return function () {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  // Every value climbs with the level. enemyRatio / bossRatio = how much of your BEST possible army
  // the red squads and the boss take: big safety margin early, very little margin late.
  function levelParams(L) {
    const k = (L - 1) / (MAX_LEVEL - 1); // 0 → 1
    return {
      track: Math.round(110 + (L - 1) * 7),          // longer track = more gates & obstacles
      speed: 8.8 + k * 4.4,                          // run speed 8.8 → 13.2
      sawSpeed: 2.3 + k * 1.9,                       // saws sweep faster
      doubleSaw: false,                              // always a single blade
      moveAmp: L >= 3 ? 0.5 + k * 1.0 : 0,           // gates slide further side to side
      divideGate: L >= 8,                            // "÷2" bad gates appear
      enemyRatio: 0.3 + k * 0.2,                     // red squad size vs your expected army: 30% → 50%
      bossRatio: 0.35 + k * 0.25,                    // boss HP vs your expected army: 35% → 60%
      nOpen: L >= 14 ? 3 : L >= 7 ? 2 : L >= 2 ? 1 : 0,
      nBridge: L >= 18 ? 3 : L >= 5 ? 2 : L >= 3 ? 1 : 0,
      nJumps: L >= 15 ? 3 : L >= 8 ? 2 : L >= 3 ? 1 : 0,   // broken road with a jump ramp in front
      rampHalf: Math.max(1.8, 3.2 - (L - 3) * 0.055),       // ramps get narrower: aim for the middle
    };
  }

  // Jump ramp layout relative to a gate pair at z: ramp, then a gap in the road, then road again.
  const RAMP_START = 6, RAMP_END = 8.5, GAP_END = 13, RAMP_H = 0.9, JUMP_PEAK = 2.6;

  class CrowdAudio {
    constructor() {
      this.ctx = null;
      this.enabled = localStorage.getItem('ccl_sound') !== 'false';
    }
    init() {
      if (!this.ctx && (window.AudioContext || window.webkitAudioContext)) {
        const AC = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AC();
      }
      if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
    }
    toggle() {
      this.enabled = !this.enabled;
      localStorage.setItem('ccl_sound', String(this.enabled));
      if (this.enabled) this.playTone(620, 0.08, 'sine');
      return this.enabled;
    }
    playTone(freq, dur, type = 'sine', vol = 0.12) {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(vol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
      osc.connect(gain); gain.connect(this.ctx.destination);
      osc.start(now); osc.stop(now + dur + 0.01);
    }
    playGateGood() {
      this.playTone(523, 0.08, 'triangle', 0.14);
      setTimeout(() => this.playTone(784, 0.12, 'triangle', 0.14), 55);
    }
    playGateBad() {
      this.playTone(190, 0.14, 'sawtooth', 0.1);
    }
    playCoin() {
      this.playTone(987, 0.06, 'sine', 0.1);
      setTimeout(() => this.playTone(1318, 0.09, 'sine', 0.1), 45);
    }
    playPop() {
      this.playTone(260 + Math.random() * 140, 0.05, 'triangle', 0.08);
    }
    playStep(idx) {
      this.playTone(440 * Math.pow(1.09, idx), 0.1, 'triangle', 0.12);
    }
    playVictory() {
      [523, 659, 784, 1046].forEach((f, i) => {
        setTimeout(() => this.playTone(f, 0.22, 'triangle', 0.14), i * 85);
      });
    }
  }

  // --------------------------------------------------------------------------
  // 2. CANVAS TEXTURE HELPERS (MATH GATES & RAINBOW STEPS)
  // --------------------------------------------------------------------------
  function createGateTexture(label, isGood) {
    const c = document.createElement('canvas');
    c.width = 256; c.height = 256;
    const ctx = c.getContext('2d');

    ctx.fillStyle = isGood ? 'rgba(14, 165, 233, 0.42)' : 'rgba(244, 63, 94, 0.45)';
    ctx.fillRect(0, 0, 256, 256);

    // Inner glow border
    ctx.strokeStyle = isGood ? '#7dd3fc' : '#fda4af';
    ctx.lineWidth = 14;
    ctx.strokeRect(8, 8, 240, 240);

    // Bold math label
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 84px Fredoka, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0,0,0,0.45)';
    ctx.shadowBlur = 10;
    ctx.fillText(label, 128, 128);

    const tex = new THREE.CanvasTexture(c);
    return tex;
  }

  function createStepTexture(label, colorHex) {
    const c = document.createElement('canvas');
    c.width = 256; c.height = 128;
    const ctx = c.getContext('2d');
    ctx.fillStyle = colorHex;
    ctx.fillRect(0, 0, 256, 128);
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 8;
    ctx.strokeRect(4, 4, 248, 120);
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 56px Fredoka, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, 128, 64);
    return new THREE.CanvasTexture(c);
  }

  // --------------------------------------------------------------------------
  // 3. STICKMAN MESH BUILDER
  // --------------------------------------------------------------------------
  const sharedGeoms = {};
  function createWarningTexture() {
    const c = document.createElement('canvas'); c.width = 32; c.height = 64;
    const x = c.getContext('2d');
    x.fillStyle = '#ffffff'; x.fillRect(0, 0, 32, 64);
    x.fillStyle = '#ef4444'; x.fillRect(0, 0, 32, 32);
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    return t;
  }

  function createRampTexture() {
    const c = document.createElement('canvas'); c.width = 128; c.height = 128;
    const x = c.getContext('2d');
    const g = x.createLinearGradient(0, 0, 0, 128); g.addColorStop(0, '#fb923c'); g.addColorStop(1, '#ea580c');
    x.fillStyle = g; x.fillRect(0, 0, 128, 128);
    x.strokeStyle = '#ffffff'; x.lineWidth = 12; x.lineCap = 'round'; x.lineJoin = 'round';
    for (const y of [36, 84]) { x.beginPath(); x.moveTo(34, y + 16); x.lineTo(64, y - 10); x.lineTo(94, y + 16); x.stroke(); }
    return new THREE.CanvasTexture(c);
  }

  function getSharedGeoms() {
    if (!sharedGeoms.head) {
      sharedGeoms.head = new THREE.SphereGeometry(0.14, 10, 10);
      sharedGeoms.body = new THREE.CylinderGeometry(0.11, 0.09, 0.34, 8);
      sharedGeoms.limb = new THREE.CylinderGeometry(0.045, 0.04, 0.24, 6);
    }
    return sharedGeoms;
  }

  function createStickmanMesh(mat) {
    const g = getSharedGeoms();
    const group = new THREE.Group();

    const head = new THREE.Mesh(g.head, mat);
    head.position.y = 0.56;
    group.add(head);

    const body = new THREE.Mesh(g.body, mat);
    body.position.y = 0.32;
    group.add(body);

    const legL = new THREE.Mesh(g.limb, mat);
    legL.position.set(-0.06, 0.12, 0);
    group.add(legL);

    const legR = new THREE.Mesh(g.limb, mat);
    legR.position.set(0.06, 0.12, 0);
    group.add(legR);

    group.userData = { legL, legR, phase: Math.random() * Math.PI * 2 };
    return group;
  }

  // Fortress Boss: a big horned brute with a spiked club. Later worlds add armour.
  function createBossMesh(level) {
    const M = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.5, ...o });
    const skin = M(0xdc2626, { roughness: 0.45, emissive: 0x7f1d1d, emissiveIntensity: 0.15 });
    const skinLight = M(0xf87171);
    const dark = M(0x1f2937);
    const white = M(0xffffff, { roughness: 0.3 });
    const bone = M(0xfef3c7, { roughness: 0.35 });
    const wood = M(0x78350f, { roughness: 0.8 });
    const iron = M(0x9ca3af, { metalness: 0.4, roughness: 0.35 });
    const gold = M(0xfacc15, { metalness: 0.4, roughness: 0.25, emissive: 0xa16207, emissiveIntensity: 0.3 });
    const add = (parent, geo, mat, x, y, z) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); parent.add(m); return m; };

    const root = new THREE.Group();
    const body = new THREE.Group();          // everything above the legs (breathes / leans)
    root.add(body);

    // legs and feet
    [-0.55, 0.55].forEach(x => {
      add(root, new THREE.CylinderGeometry(0.36, 0.42, 1.0, 12), skin, x, 0.5, 0);
      add(root, new THREE.BoxGeometry(0.7, 0.28, 0.9), dark, x, 0.14, 0.12);
    });

    // torso, belly, belt
    const torso = add(body, new THREE.SphereGeometry(1, 20, 16), skin, 0, 2.0, 0);
    torso.scale.set(1.25, 1.15, 0.95);
    const belly = add(body, new THREE.SphereGeometry(0.7, 16, 12), skinLight, 0, 1.75, 0.45);
    belly.scale.set(1.1, 1, 0.6);
    add(body, new THREE.CylinderGeometry(1.08, 1.12, 0.32, 20), dark, 0, 1.1, 0);
    add(body, new THREE.BoxGeometry(0.5, 0.4, 0.2), gold, 0, 1.1, 1.05);       // belt buckle

    // head with horns, angry face and tusks
    const head = new THREE.Group(); head.position.set(0, 3.55, 0.05); body.add(head);
    add(head, new THREE.SphereGeometry(0.78, 20, 16), skin, 0, 0.2, 0);
    [-1, 1].forEach(sx => {
      const horn = add(head, new THREE.ConeGeometry(0.17, 0.75, 10), bone, sx * 0.52, 0.85, 0);
      horn.rotation.z = -sx * 0.55;
      add(head, new THREE.SphereGeometry(0.17, 12, 10), white, sx * 0.28, 0.32, 0.66);   // eye
      add(head, new THREE.SphereGeometry(0.085, 10, 8), dark, sx * 0.26, 0.3, 0.81);     // pupil
      const brow = add(head, new THREE.BoxGeometry(0.34, 0.09, 0.1), dark, sx * 0.27, 0.53, 0.72);
      brow.rotation.z = sx * 0.45;                                                      // angry slant
      const tusk = add(head, new THREE.ConeGeometry(0.07, 0.26, 8), bone, sx * 0.24, -0.06, 0.7);
      tusk.rotation.x = -0.2;
    });
    add(head, new THREE.BoxGeometry(0.6, 0.14, 0.12), dark, 0, -0.14, 0.7);              // mouth

    // arms (pivot at the shoulder so they can swing); the right one holds a spiked club
    const arms = [-1, 1].map(sx => {
      const arm = new THREE.Group(); arm.position.set(sx * 1.25, 2.85, 0); body.add(arm);
      add(arm, new THREE.SphereGeometry(0.5, 14, 12), skin, 0, 0, 0);                    // shoulder
      const upper = add(arm, new THREE.CylinderGeometry(0.3, 0.26, 1.4, 12), skin, sx * 0.22, -0.75, 0);
      upper.rotation.z = sx * 0.28;
      add(arm, new THREE.SphereGeometry(0.42, 14, 12), skin, sx * 0.42, -1.5, 0.05);      // fist
      return arm;
    });
    const club = new THREE.Group(); club.position.set(0.42, -1.5, 0.1); club.rotation.set(0.5, 0, -0.45); arms[1].add(club);
    add(club, new THREE.CylinderGeometry(0.3, 0.13, 1.9, 12), wood, 0, 0.85, 0);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const sp = add(club, new THREE.ConeGeometry(0.08, 0.26, 6), iron, Math.cos(a) * 0.28, 1.35 + (i % 2) * 0.3, Math.sin(a) * 0.28);
      sp.rotation.z = -Math.cos(a) * Math.PI / 2; sp.rotation.x = Math.sin(a) * Math.PI / 2;
    }

    // armour for later worlds: spiked shoulder pads from level 11, a golden crown from level 21
    if (level >= 11) arms.forEach((arm, i) => {
      const sx = i ? 1 : -1;
      const pad = add(arm, new THREE.SphereGeometry(0.58, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2), iron, 0, 0.08, 0);
      pad.scale.set(1, 0.8, 1);
      [-0.25, 0, 0.25].forEach(dz => { const sp = add(arm, new THREE.ConeGeometry(0.09, 0.36, 8), iron, sx * 0.1, 0.55, dz); sp.rotation.z = -sx * 0.3; });
    });
    if (level >= 21) {
      add(head, new THREE.CylinderGeometry(0.5, 0.55, 0.22, 16, 1, true), gold, 0, 0.88, 0);
      for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2; add(head, new THREE.ConeGeometry(0.09, 0.3, 6), gold, Math.cos(a) * 0.5, 1.12, Math.sin(a) * 0.5); }
    }

    const scale = 0.85 + Math.min(0.35, level * 0.012);   // the boss grows a little every level
    root.scale.setScalar(scale);
    root.userData = { body, head, arms, skin, baseScale: scale };
    return root;
  }

  // --------------------------------------------------------------------------
  // 4. MAIN GAME CLASS
  // --------------------------------------------------------------------------
  class CountControlGame {
    constructor() {
      this.audio = new CrowdAudio();
      this.canvas = document.getElementById('cclCanvas');
      this.overlay = document.getElementById('cclOverlayCanvas');
      this.oCtx = this.overlay.getContext('2d');

      // Progression & Upgrades
      this.coins = parseInt(localStorage.getItem('ccl_coins') || '200', 10);
      this.stage = Math.min(MAX_LEVEL, parseInt(localStorage.getItem('ccl_stage') || '1', 10));
      this.unlocked = Math.min(MAX_LEVEL, Math.max(this.stage, parseInt(localStorage.getItem('ccl_unlocked') || '1', 10)));
      try { this.bestStars = JSON.parse(localStorage.getItem('ccl_stars') || '{}'); } catch (e) { this.bestStars = {}; }
      this.countLvl = parseInt(localStorage.getItem('ccl_count_lvl') || '1', 10);
      this.incomeLvl = parseInt(localStorage.getItem('ccl_income_lvl') || '1', 10);
      this.unlockedSkins = JSON.parse(localStorage.getItem('ccl_skins') || '["blue"]');
      this.equippedSkin = localStorage.getItem('ccl_skin') || 'blue';

      // Game State
      this.state = 'MENU'; // MENU | RUNNING | CLASH | BOSS | STAIRS | VICTORY | DEFEAT
      this.trackLength = 120;
      this.crowdZ = 0;
      this.crowdX = 0;
      this.targetX = 0;
      this.crowdCount = 1;
      this.runSpeed = 13.5;

      // Dynamic Stage Objects
      this.gates = [];
      this.saws = [];
      this.coinsList = [];
      this.enemies = [];
      this.boss = null;
      this.giftBox = null;
      this.giftBonus = 0;
      this.stairSteps = [];
      this.runnerMeshes = [];
      this.clouds = [];
      this.particles = [];
      this.floatingTexts = [];
      this.edgeZones = [];   // track sections without rails / narrow bridges where runners can fall off
      this.jumps = [];       // broken road sections with a jump ramp in front
      this.fallers = [];     // runners currently falling off the track

      // Input
      this.isDragging = false;
      this.lastPtrX = 0;
      this.keys = { left: false, right: false };

      this.initThree();
      this.bindUI();
      this.bindInput();
      this.refreshMenuUI();
      this.buildStage(this.stage, true);

      this.lastTime = performance.now();
      requestAnimationFrame(this.loop.bind(this));
    }

    initThree() {
      this.scene = new THREE.Scene();
      this.scene.fog = new THREE.Fog(0xbae6fd, 35, 110);

      this.camera = new THREE.PerspectiveCamera(52, window.innerWidth / window.innerHeight, 0.1, 160);
      this.camera.position.set(0, 7.5, 9.5);
      this.camera.lookAt(0, 1, -6);

      this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: true });
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      this.renderer.setSize(window.innerWidth, window.innerHeight);

      const hemi = new THREE.HemisphereLight(0xffffff, 0x7dd3fc, 0.9);
      this.scene.add(hemi);

      const dir = new THREE.DirectionalLight(0xfffbeb, 0.85);
      dir.position.set(10, 22, 12);
      this.scene.add(dir);

      this.worldGroup = new THREE.Group();
      this.scene.add(this.worldGroup);

      this.crowdGroup = new THREE.Group();
      this.scene.add(this.crowdGroup);

      this.handleResize();
      window.addEventListener('resize', () => this.handleResize());
    }

    handleResize() {
      const w = window.innerWidth;
      const h = window.innerHeight;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
      this.overlay.width = w;
      this.overlay.height = h;
    }

    getPlayerMat() {
      const sk = SKINS.find(s => s.id === this.equippedSkin) || SKINS[0];
      // the default skin takes the colour of the current world; bought skins keep their own colour
      const color = sk.id === 'blue' && this.theme ? this.theme.player : sk.color;
      return new THREE.MeshStandardMaterial({ color, roughness: 0.45 });
    }

    clearWorld() {
      while (this.worldGroup.children.length > 0) {
        this.worldGroup.remove(this.worldGroup.children[0]);
      }
      while (this.crowdGroup.children.length > 0) {
        this.crowdGroup.remove(this.crowdGroup.children[0]);
      }
      this.gates = [];
      this.saws = [];
      this.coinsList = [];
      this.enemies = [];
      this.boss = null;
      this.giftBox = null;
      this.giftBonus = 0;
      this.stairSteps = [];
      this.runnerMeshes = [];
      this.particles = [];
      this.floatingTexts = [];
      this.edgeZones = [];
      this.jumps = [];
      this.fallers = [];
    }

    buildStage(stageNum, isPreview = false) {
      this.clearWorld();
      this.rng = mkRng(stageNum * 7919 + 13 + (LAYOUT_VARIANT[stageNum] || 0) * 104729);
      this.lv = levelParams(stageNum);
      this.applyTheme(themeFor(stageNum));
      this.trackLength = this.lv.track;
      this.crowdZ = 0;
      this.crowdX = 0;
      this.targetX = 0;
      this.crowdCount = 1 + (this.countLvl - 1) * 2;
      this.runSpeed = this.lv.speed;

      // 1. Skybridge Track. Newer stages get "edge zones": open sections with no side rails
      //    (stage 2+) and narrow bridges (stage 3+). Runners that end up over the side fall off.
      const segsPlan = Math.floor((this.trackLength - 28) / 16);
      const obstacleSegs = [];
      for (let i = 2; i <= segsPlan - 1; i += 2) obstacleSegs.push(i);
      const nOpen = this.lv.nOpen, nBridge = this.lv.nBridge;
      const shuffled = obstacleSegs.map(v => [this.rng(), v]).sort((a, b) => a[0] - b[0]).map(x => x[1]);
      const picks = shuffled.slice(0, nOpen + nBridge).sort((a, b) => a - b);
      // exact mix: nOpen open edges + nBridge bridges, alternated along the track (open edge first)
      const kinds = [];
      for (let k = 0; k < Math.max(nOpen, nBridge); k++) { if (k < nOpen) kinds.push('open'); if (k < nBridge) kinds.push('bridge'); }
      picks.forEach((seg, k) => {
        const zMid = -seg * 15.5, kind = kinds[k];
        this.edgeZones.push({ z0: zMid - 3.5, z1: zMid - 12, half: kind === 'bridge' ? 1.6 + this.rng() * 0.3 : 3.3, kind, warned: false });
      });
      // Jumps go after gate pairs (odd segments, never the first or last one)
      const jrng = mkRng(stageNum * 4243 + 777);
      const gateSegs = [];
      // only gate segments followed by an enemy squad (never land straight into a saw)
      for (let i = 3; i <= segsPlan - 1; i += 4) gateSegs.push(i);
      gateSegs.map(v => [jrng(), v]).sort((a, b) => a[0] - b[0]).slice(0, this.lv.nJumps).forEach(([, seg]) => {
        const z = -seg * 15.5;
        this.jumps.push({ seg, rampZ0: z - RAMP_START, rampZ1: z - RAMP_END, gapZ1: z - GAP_END, half: this.lv.rampHalf, launched: false, warned: false });
      });
      const trackTop = 12, trackEnd = -this.trackLength - 8;
      this.trackTop = trackTop; this.trackEnd = trackEnd;
      const th = this.theme;
      const trackMat = new THREE.MeshStandardMaterial({ color: th.track, roughness: 0.8 });
      const bridgeMat = new THREE.MeshStandardMaterial({ color: th.bridge, roughness: 0.7 });
      const railMat = new THREE.MeshStandardMaterial({ color: th.rail, roughness: 0.5 });
      const warnTex = createWarningTexture();
      const addPiece = (zFrom, zTo, half, rails, mat) => {
        const len = zFrom - zTo; if (len <= 0.01) return;
        const zc = (zFrom + zTo) / 2;
        const deck = new THREE.Mesh(new THREE.BoxGeometry(half * 2, 0.8, len), mat);
        deck.position.set(0, -0.4, zc);
        this.worldGroup.add(deck);
        if (rails) {
          [-(half + 0.05), half + 0.05].forEach(rx => {
            const rail = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.96, len), railMat);
            rail.position.set(rx, -0.25, zc);
            this.worldGroup.add(rail);
          });
        } else {
          // red/white warning stripes along the open edges
          [-(half - 0.18), half - 0.18].forEach(ex => {
            const tex = warnTex.clone(); tex.needsUpdate = true; tex.repeat.set(1, Math.max(1, Math.round(len / 1.2)));
            const strip = new THREE.Mesh(new THREE.PlaneGeometry(0.36, len), new THREE.MeshBasicMaterial({ map: tex }));
            strip.rotation.x = -Math.PI / 2;
            strip.position.set(ex, 0.015, zc);
            this.worldGroup.add(strip);
          });
        }
      };
      let zCursor = trackTop;
      const cuts = this.edgeZones.map(zn => ({ z0: zn.z0, z1: zn.z1, zn }))
        .concat(this.jumps.map(j => ({ z0: j.rampZ1, z1: j.gapZ1, gap: true })))
        .sort((a, b) => b.z0 - a.z0);
      cuts.forEach(c => {
        addPiece(zCursor, c.z0, 3.3, true, trackMat);
        if (!c.gap) addPiece(c.z0, c.z1, c.zn.half, false, c.zn.kind === 'bridge' ? bridgeMat : trackMat); // a gap: no road at all
        zCursor = c.z1;
      });
      addPiece(zCursor, trackEnd, 3.3, true, trackMat);
      this.jumps.forEach(j => this.spawnRamp(j));

      // Finish Line Checkered Strip before Boss Arena
      const finishMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.4 });
      const finishLine = new THREE.Mesh(new THREE.BoxGeometry(6.4, 0.05, 1.0), finishMat);
      finishLine.position.set(0, 0.02, -this.trackLength + 12);
      this.worldGroup.add(finishLine);

      // 2. Populate Math Gate Pairs, Saw Traps, Coins, and Enemy Squads along track
      const segs = Math.floor((this.trackLength - 28) / 16);
      // best = the biggest army perfect gate choices can have at this point (from the base squad of 1).
      // Red squads and the boss are sized from it, so a level is always winnable with good play.
      const applyOp = (n, g) => g.op === '+' ? n + g.val : g.op === '×' ? n * g.val : g.op === '-' ? n - g.val : Math.max(1, Math.floor(n / g.val));
      let best = 1;
      for (let i = 1; i <= segs; i++) {
        const z = -i * 15.5;

        // Alternate Math Gate Pairs & Obstacles/Enemies
        if (i % 2 === 1 || i === 1) {
          const pair = this.spawnGatePair(z, stageNum, i > 2 && this.lv.moveAmp > 0, i === 1);
          best = Math.max(...pair.gates.map(g => applyOp(best, g)));
        } else if (i % 4 === 2) {
          this.spawnSawTrap(z);
          if (this.lv.doubleSaw) this.spawnSawTrap(z - 4.5);
          // a big crowd is wider than the gap a saw leaves, so even good play loses some runners here
          best = Math.max(1, Math.floor(best * (this.lv.doubleSaw ? 0.45 : 0.7)));
        } else {
          // never more than the best army minus 2, so the level always stays winnable
          const enemyCnt = Math.max(1, Math.min(best - 2, Math.round(best * this.lv.enemyRatio)));
          const jPrev = this.jumps.find(j => j.seg === i - 1);
          this.spawnEnemySquad(jPrev ? Math.min(z, jPrev.gapZ1 - 5) : z, enemyCnt);
          best -= enemyCnt;
        }

        // Gold Coins between segments (down the middle on narrow bridges)
        const onBridge = this.edgeZones.some(zn => zn.kind === 'bridge' && z - 6 <= zn.z0 && z - 6 >= zn.z1);
        const jump = this.jumps.find(j => j.seg === i);
        for (let c = 0; c < 3; c++) {
          const rx = onBridge ? 0 : (this.rng() - 0.5) * 4.2; // same draws as before, so level layouts stay the same
          const cz = z - 6 - c * 1.6;
          if (jump) this.spawnCoin(0, cz, this.jumpHeight(cz) + 0.6); // floating along the jump arc
          else this.spawnCoin(rx, cz);
        }
      }

      // 3. Giant Fortress Boss at end of bridge
      const bossHp = Math.max(1, Math.min(best - 2, Math.round(best * this.lv.bossRatio)));
      this.bestArmyAtBoss = best;
      this.spawnBoss(-this.trackLength + 3, bossHp);

      // 4. Rainbow Multiplier Staircase behind Boss + End Gift Box with Coins!
      const stepColors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'];
      const mults = [1.2, 1.5, 2.0, 2.5, 3.0, 4.0, 5.0, 8.0];
      for (let s = 0; s < stepColors.length; s++) {
        const stepMat = new THREE.MeshStandardMaterial({
          map: createStepTexture(`${mults[s]}x`, stepColors[s]),
          roughness: 0.6
        });
        const step = new THREE.Mesh(new THREE.BoxGeometry(6.6, 0.9, 3.6), stepMat);
        step.position.set(0, s * 0.85, -this.trackLength - 5 - s * 3.6);
        this.worldGroup.add(step);
        this.stairSteps.push({ z: step.position.z, y: step.position.y + 0.45, mult: mults[s] });
      }

      // 5. 3D Gift Box with Coins waiting at the top / end of the track!
      const topStep = this.stairSteps[this.stairSteps.length - 1];
      if (topStep) {
        this.spawnGiftBox(0, topStep.y, topStep.z);
      }

      this.syncCrowdVisuals();
      if (!isPreview) {
        this.state = 'RUNNING';
      }
    }

    spawnGatePair(z, stageNum, moving = false, bothGood = false) {
      const opsGood = [
        { op: '+', val: 8 + stageNum * 2 },
        { op: '+', val: 12 + stageNum * 3 },
        { op: '×', val: 2 },
        { op: '×', val: 3 },
        { op: '×', val: stageNum >= 3 ? 4 : 2 }
      ];
      const opsBad = [
        { op: '-', val: 2 + stageNum },
        { op: '-', val: 4 + stageNum * 2 }
      ];
      if (this.lv && this.lv.divideGate) opsBad.push({ op: '÷', val: 2 });

      const rnd = this.rng || Math.random;
      const goodFirst = rnd() < 0.5;
      // the first pair of every level offers a solid "+" start so you never begin a hard level with 2 runners
      const gSpec = bothGood ? { op: '+', val: 6 + stageNum } : opsGood[Math.floor(rnd() * opsGood.length)];
      const gSpec2 = { op: '×', val: 2 };
      const bSpec = bothGood ? gSpec2 : opsBad[Math.floor(rnd() * opsBad.length)];

      const pair = { z, triggered: false, moving, amp: this.lv ? this.lv.moveAmp : 0.7, phase: rnd() * Math.PI * 2, gates: [] };
      const defs = [
        { x: -1.55, isGood: goodFirst || bothGood, spec: goodFirst ? gSpec : bSpec },
        { x:  1.55, isGood: !goodFirst || bothGood, spec: !goodFirst ? gSpec : bSpec }
      ];

      defs.forEach(d => {
        const label = `${d.spec.op}${d.spec.val}`;
        const mat = new THREE.MeshBasicMaterial({
          map: createGateTexture(label, d.isGood),
          transparent: true,
          side: THREE.DoubleSide
        });
        const pane = new THREE.Mesh(new THREE.PlaneGeometry(2.75, 2.2), mat);
        pane.position.set(d.x, 1.1, z);
        this.worldGroup.add(pane);

        // Pillars
        const pillarMat = new THREE.MeshStandardMaterial({ color: d.isGood ? 0x0284c7 : 0xe11d48 });
        [-1.38, 1.38].forEach(px => {
          const pil = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 2.3, 8), pillarMat);
          pil.position.set(d.x + px, 1.15, z);
          this.worldGroup.add(pil);
        });

        pair.gates.push({ mesh: pane, baseX: d.x, x: d.x, isGood: d.isGood, op: d.spec.op, val: d.spec.val });
      });

      this.gates.push(pair);
      return pair;
    }

    // Orange ramp with white arrows, rising toward the gap.
    spawnRamp(j) {
      const len = j.rampZ0 - j.rampZ1, w = j.half * 2;
      const slope = Math.atan2(RAMP_H, len);
      const rampLen = Math.hypot(len, RAMP_H);
      const mat = new THREE.MeshStandardMaterial({ map: createRampTexture(), roughness: 0.5 });
      const ramp = new THREE.Mesh(new THREE.BoxGeometry(w, 0.2, rampLen), mat);
      ramp.rotation.x = slope;
      ramp.position.set(0, RAMP_H / 2, (j.rampZ0 + j.rampZ1) / 2);
      this.worldGroup.add(ramp);
      // red/white warning lip on the far edge of the gap and the near edge
      const lipMat = new THREE.MeshStandardMaterial({ color: 0xef4444 });
      [j.rampZ1 - 0.05, j.gapZ1 + 0.1].forEach(z => {
        const lip = new THREE.Mesh(new THREE.BoxGeometry(6.6, 0.12, 0.2), lipMat);
        lip.position.set(0, 0.02, z);
        this.worldGroup.add(lip);
      });
    }

    // Height of the crowd over the ground at depth z: up the ramp, then an arc over the gap.
    jumpHeight(z) {
      for (const j of this.jumps) {
        if (z <= j.rampZ0 && z > j.rampZ1) return ((j.rampZ0 - z) / (j.rampZ0 - j.rampZ1)) * RAMP_H;
        if (z <= j.rampZ1 && z >= j.gapZ1) {
          const u = (j.rampZ1 - z) / (j.rampZ1 - j.gapZ1);
          return RAMP_H * (1 - u) + Math.sin(Math.PI * u) * JUMP_PEAK;
        }
      }
      return 0;
    }

    spawnSawTrap(z) {
      const mat = new THREE.MeshStandardMaterial({ color: 0xe11d48, metalness: 0.4, roughness: 0.3 });
      const saw = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.95, 0.18, 14), mat);
      saw.rotation.x = Math.PI / 2;
      saw.position.set(0, 0.55, z);
      this.worldGroup.add(saw);
      this.saws.push({ mesh: saw, z, phase: (this.rng || Math.random)() * Math.PI * 2, spd: this.lv ? this.lv.sawSpeed : 2.5, hitCooldown: 0 });
    }

    spawnCoin(x, z, y = 0.5) {
      const mat = new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.5, roughness: 0.25 });
      const coin = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.08, 12), mat);
      coin.rotation.x = Math.PI / 2;
      coin.position.set(x, y, z);
      this.worldGroup.add(coin);
      this.coinsList.push({ mesh: coin, x, z, collected: false });
    }

    spawnEnemySquad(z, count) {
      const ex = ((this.rng || Math.random)() - 0.5) * 2.2;
      const mat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.45 });
      const group = new THREE.Group();
      group.position.set(ex, 0, z);
      const visCount = Math.min(20, count);
      for (let i = 0; i < visCount; i++) {
        const m = createStickmanMesh(mat);
        const r = 0.24 * Math.sqrt(i);
        const a = i * 2.399;
        m.position.set(Math.cos(a) * r, 0, Math.sin(a) * r);
        group.add(m);
      }
      this.worldGroup.add(group);
      this.enemies.push({ group, x: ex, z, count, defeated: false });
    }

    spawnBoss(z, hp) {
      const bossGroup = new THREE.Group();
      bossGroup.position.set(0, 0, z);
      const giant = createBossMesh(this.stage);
      bossGroup.add(giant);
      this.worldGroup.add(bossGroup);
      this.boss = { group: bossGroup, mesh: giant, z, hp, maxHp: hp, defeated: false, hitFlash: 0, dieT: -1 };
    }

    spawnGiftBox(x, y, z) {
      const tier = giftTierFor(this.stage);
      const boxGroup = new THREE.Group();
      const baseY = y + 0.1 + 0.65 * tier.scale;
      boxGroup.position.set(x, baseY, z);
      boxGroup.scale.setScalar(tier.scale);

      const boxMat = new THREE.MeshStandardMaterial({
        color: tier.box, metalness: tier.metal, roughness: tier.rough,
        emissive: tier.shine || (tier.gem ? tier.box : 0x000000), emissiveIntensity: tier.shine ? 0.35 : tier.gem ? 0.25 : 0,
      });
      const ribbonMat = new THREE.MeshStandardMaterial({ color: tier.ribbon, metalness: 0.35, roughness: 0.25 });

      const cube = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.3, 1.4), boxMat);
      boxGroup.add(cube);

      const lid = new THREE.Mesh(new THREE.BoxGeometry(1.56, 0.32, 1.56), boxMat);
      lid.position.y = 0.72;
      boxGroup.add(lid);

      const rib1 = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.48, 0.26), ribbonMat);
      rib1.position.y = 0.08;
      boxGroup.add(rib1);

      const rib2 = new THREE.Mesh(new THREE.BoxGeometry(0.26, 1.48, 1.6), ribbonMat);
      rib2.position.y = 0.08;
      boxGroup.add(rib2);

      // Emblem floating above the box: a gold coin, or a diamond for the top tiers
      const emblemMat = new THREE.MeshStandardMaterial({ color: tier.gem ? 0x67e8f9 : 0xfacc15, metalness: 0.6, roughness: 0.15, emissive: tier.gem ? 0x0891b2 : 0x000000, emissiveIntensity: 0.4 });
      const coinTop = tier.gem
        ? new THREE.Mesh(new THREE.OctahedronGeometry(0.5), emblemMat)
        : new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.12, 16), emblemMat);
      if (!tier.gem) coinTop.rotation.x = Math.PI / 2;
      coinTop.position.y = 1.42;
      boxGroup.add(coinTop);

      // Better boxes shine: a glowing halo ring around them
      let halo = null;
      if (tier.glow) {
        halo = new THREE.Mesh(new THREE.TorusGeometry(1.25, 0.07, 8, 40),
          new THREE.MeshBasicMaterial({ color: tier.glow, transparent: true, opacity: 0.85 }));
        halo.rotation.x = Math.PI / 2;
        halo.position.y = -0.45;
        boxGroup.add(halo);
      }

      this.worldGroup.add(boxGroup);
      this.giftBox = { group: boxGroup, lid, coinTop, halo, tier, baseY, z, opened: false };
      this.giftCoins = [];
      this.giftOpenTimer = 0;
    }

    applyTheme(th) {
      this.theme = th;
      const root = document.documentElement.style;
      root.setProperty('--sky-top', th.sky[0]);
      root.setProperty('--sky-mid', th.sky[1]);
      root.setProperty('--sky-bot', th.sky[2]);
      this.scene.fog.color.set(th.sky[2]);
    }

    syncCrowdVisuals() {
      const targetVis = Math.min(110, Math.max(0, this.crowdCount));
      const mat = this.getPlayerMat();

      while (this.runnerMeshes.length < targetVis) {
        const m = createStickmanMesh(mat);
        this.crowdGroup.add(m);
        this.runnerMeshes.push(m);
      }
      while (this.runnerMeshes.length > targetVis) {
        const m = this.runnerMeshes.pop();
        this.crowdGroup.remove(m);
      }

      // Each runner gets a slot in a tight phyllotaxis spiral and glides to it (see updateFormation),
      // so when runners are destroyed the rest close the gap smoothly instead of jumping.
      this.runnerMeshes.forEach((m, i) => {
        const r = i === 0 ? 0 : 0.25 * Math.sqrt(i);
        const a = i * 2.39996;
        m.userData.slotX = Math.cos(a) * r;
        m.userData.slotZ = Math.sin(a) * r;
        if (m.userData.fresh !== false) {
          // mid-run newcomers appear in the middle of the squad and walk out, never straight onto an edge
          const midRun = this.state === 'RUNNING' || this.state === 'CLASH';
          m.position.x = midRun ? 0 : m.userData.slotX;
          m.position.z = m.userData.slotZ;
          if (midRun) m.position.y = this.jumpHeight(this.crowdZ + m.position.z) - this.crowdGroup.position.y;
          m.userData.fresh = false;
        }
      });
    }

    // Lateral squeeze needed to fit the crowd on the track section it is about to run on.
    crowdSqueeze() {
      const radius = 0.25 * Math.sqrt(Math.max(1, this.runnerMeshes.length - 1)) + 0.15;
      const ramp = this.jumps.find(j => this.crowdZ - 5 <= j.rampZ0 && this.crowdZ + 1 >= j.gapZ1);
      const zone = ramp || this.edgeZones.find(zn => zn.kind === 'bridge' && this.crowdZ - 3 <= zn.z0 && this.crowdZ + 2 >= zn.z1);
      if (!zone) return 1;
      return Math.min(1, Math.max(0.15, (zone.half - 0.3) / radius));
    }

    // What is under depth z: road with rails, a rail-less section (bridge / open edge / ramp), a gap, or nothing we manage.
    surfaceAt(z) {
      for (const j of this.jumps) {
        if (z <= j.rampZ0 && z > j.rampZ1) return { half: j.half, rails: false };
        if (z <= j.rampZ1 && z >= j.gapZ1) return { gap: true, half: 3.3 }; // flying: steer freely, but miss the road and you fall
      }
      for (const zn of this.edgeZones) if (z <= zn.z0 && z >= zn.z1) return { half: zn.half, rails: false };
      if (this.trackEnd !== undefined && z <= this.trackTop && z >= this.trackEnd) return { half: 3.3, rails: true };
      return null;
    }

    updateFormation(dt) {
      if (this.state === 'STAIRS' || this.state === 'GIFT_OPEN') return;
      const sq = this.crowdSqueeze();
      const k = 1 - Math.exp(-10 * dt);
      const railsOn = this.state === 'RUNNING' || this.state === 'CLASH';
      this.runnerMeshes.forEach(m => {
        const u = m.userData;
        if (u.slotX === undefined) return;
        m.position.x += (u.slotX * sq - m.position.x) * k;
        m.position.z += (u.slotZ * (sq < 1 ? 1 + (1 - sq) * 1.5 : 1) - m.position.z) * k; // squeezed crowd stretches into a column
        if (railsOn) {
          // rails are walls: runners press against them instead of standing in the air outside the road
          const surf = this.surfaceAt(this.crowdZ + m.position.z);
          if (surf && surf.rails) {
            const lim = surf.half - 0.3;
            m.position.x = Math.max(-lim - this.crowdX, Math.min(lim - this.crowdX, m.position.x));
          }
        }
      });
    }

    // Every runner standing outside a rail-less road falls off. Returns true if the whole squad is gone.
    checkFalls(reason) {
      const off = this.runnerMeshes.filter(m => {
        const surf = this.surfaceAt(this.crowdZ + m.position.z);
        return surf && !surf.rails && Math.abs(this.crowdX + m.position.x) > surf.half + 0.05;
      });
      if (!off.length) return false;
      this.audio.playGateBad();
      this.destroyRunners(off, 'fall');
      if (this.crowdCount <= 0) { this.triggerDefeat(reason); return true; }
      return false;
    }

    // Remove specific runner meshes (the ones that were actually hit or fell) and keep the count in step.
    destroyRunners(list, cause) {
      if (!list.length) return 0;
      const ratio = this.crowdCount / Math.max(1, this.runnerMeshes.length); // one mesh can stand for several runners
      list.forEach(m => {
        const i = this.runnerMeshes.indexOf(m);
        if (i >= 0) this.runnerMeshes.splice(i, 1);
        if (cause === 'fall') {
          // keep the mesh and let it tumble down off the track
          const wx = this.crowdX + m.position.x, wz = this.crowdZ + m.position.z;
          this.crowdGroup.remove(m);
          m.position.set(wx, this.crowdGroup.position.y, wz);
          this.worldGroup.add(m);
          this.fallers.push({ mesh: m, vy: 1.5, vx: Math.sign(m.position.x || 1) * 1.6, spin: (Math.random() - 0.5) * 8 });
        } else {
          this.crowdGroup.remove(m);
          this.addPopBurst(this.crowdX + m.position.x, 0.5, this.crowdZ + m.position.z, '#ef4444', 4);
        }
      });
      const loss = Math.min(this.crowdCount, Math.max(list.length, Math.round(list.length * ratio)));
      this.crowdCount = Math.max(0, this.crowdCount - loss);
      this.syncCrowdVisuals();
      this.floatingTexts.push({ text: `-${loss}`, x: window.innerWidth / 2, y: window.innerHeight * 0.5, color: '#e11d48', life: 0.8 });
      return loss;
    }

    addPopBurst(worldX, worldY, worldZ, colorHex, count = 10) {
      for (let i = 0; i < count; i++) {
        this.particles.push({
          x: worldX, y: worldY, z: worldZ,
          vx: (Math.random() - 0.5) * 6,
          vy: 2 + Math.random() * 5,
          vz: (Math.random() - 0.5) * 6,
          color: colorHex,
          life: 0.6
        });
      }
    }

    // ------------------------------------------------------------------------
    // 5. GAME LOOP & STATE MACHINE
    // ------------------------------------------------------------------------
    startRun() {
      this.audio.init();
      document.getElementById('menuScreen').classList.add('hidden');
      document.getElementById('victoryModal').classList.add('hidden');
      document.getElementById('defeatModal').classList.add('hidden');
      document.getElementById('bossHpWrap').classList.add('hidden');
      document.getElementById('gameHud').classList.remove('hidden');
      document.getElementById('hudStageLabel').textContent = `LEVEL ${this.stage}`;
      document.getElementById('hudCoins').textContent = this.coins;
      this.buildStage(this.stage, false);
      if ((this.stage - 1) % 5 === 0) {
        this.floatingTexts.push({ text: `${this.theme.icon} ${this.theme.name}`, x: window.innerWidth / 2, y: window.innerHeight * 0.3, color: "#0f172a", life: 2.2 });
      }
    }

    loop(now) {
      const dt = Math.min(0.05, (now - this.lastTime) / 1000);
      this.lastTime = now;

      this.update(dt, now * 0.001);
      this.renderer.render(this.scene, this.camera);
      this.renderOverlay(dt);

      requestAnimationFrame(this.loop.bind(this));
    }

    update(dt, t) {
      // Animate the Fortress Boss
      if (this.boss) {
        const b = this.boss, u = b.mesh.userData;
        if (!b.defeated) {
          const fighting = this.state === 'BOSS';
          u.body.scale.y = 1 + Math.sin(t * (fighting ? 9 : 2.5)) * 0.03;           // breathing
          u.head.rotation.z = Math.sin(t * 1.7) * 0.08;
          if (fighting) {
            u.arms[1].rotation.x = -1.3 + Math.sin(t * 9) * 1.1;                     // club smashes down
            u.arms[0].rotation.x = -0.4 + Math.sin(t * 9 + Math.PI) * 0.5;
            b.mesh.position.y = Math.abs(Math.sin(t * 9)) * 0.12;                    // stomping
          } else {
            u.arms[1].rotation.x = -0.35 + Math.sin(t * 2.5) * 0.12;
            u.arms[0].rotation.x = Math.sin(t * 2.5 + 1) * 0.1;
          }
          b.hitFlash = Math.max(0, b.hitFlash - dt * 6);
          u.skin.emissiveIntensity = 0.15 + b.hitFlash * 0.9;
        } else if (b.dieT >= 0 && b.dieT < 1) {
          b.dieT += dt * 1.4;                                                        // topples over and shrinks away
          b.mesh.rotation.z = Math.min(1, b.dieT * 1.6) * 1.45;
          b.mesh.scale.setScalar(u.baseScale * Math.max(0.01, 1 - Math.max(0, b.dieT - 0.45) * 1.8));
          if (b.dieT >= 1) b.group.visible = false;
        }
      }

      // Animate Gift Box at the end of the track
      if (this.giftBox && !this.giftBox.opened) {
        this.giftBox.group.rotation.y += dt * 1.4;
        this.giftBox.group.position.y = this.giftBox.baseY + Math.sin(t * 3.5) * 0.14;
        if (this.giftBox.halo) this.giftBox.halo.scale.setScalar(1 + Math.sin(t * 5) * 0.08);
      }

      this.updateFormation(dt);
      for (let i = this.fallers.length - 1; i >= 0; i--) {
        const f = this.fallers[i];
        f.vy -= 22 * dt;
        f.mesh.position.y += f.vy * dt;
        f.mesh.position.x += f.vx * dt;
        f.mesh.rotation.z += f.spin * dt;
        f.mesh.rotation.x += f.spin * 0.6 * dt;
        if (f.mesh.position.y < -14) { this.worldGroup.remove(f.mesh); this.fallers.splice(i, 1); }
      }

      // Animate stickmen running
      this.runnerMeshes.forEach((m) => {
        const u = m.userData;
        if (this.state === 'RUNNING' || this.state === 'MENU' || this.state === 'CLASH' || this.state === 'BOSS') {
          const swing = Math.sin(t * 16 + u.phase) * 0.6;
          u.legL.rotation.x = swing;
          u.legR.rotation.x = -swing;
          m.position.y = Math.abs(Math.sin(t * 16 + u.phase)) * 0.08;
          if (this.jumps.length && (this.state === 'RUNNING' || this.state === 'CLASH')) {
            m.position.y += this.jumpHeight(this.crowdZ + m.position.z) - this.crowdGroup.position.y;
          }
        } else {
          u.legL.rotation.x = 0;
          u.legR.rotation.x = 0;
        }
      });

      if (this.state === 'MENU') {
        this.camera.position.set(Math.sin(t * 0.4) * 1.5, 4.5, 6.2);
        this.camera.lookAt(0, 0.5, -2);
        return;
      }

      if (this.state === 'RUNNING') {
        // Keyboard steer
        if (this.keys.left) this.targetX -= 7.5 * dt;
        if (this.keys.right) this.targetX += 7.5 * dt;
        this.targetX = Math.max(-2.5, Math.min(2.5, this.targetX));
        this.crowdX += (this.targetX - this.crowdX) * (1 - Math.exp(-16 * dt));

        // Forward run
        this.crowdZ -= this.runSpeed * dt;
        this.crowdGroup.position.set(this.crowdX, this.jumpHeight(this.crowdZ), this.crowdZ);

        // Update HUD Progress
        const pct = Math.min(100, Math.max(0, (-this.crowdZ / (this.trackLength - 5)) * 100));
        document.getElementById('hudTrackFill').style.width = `${pct}%`;

        // 1. Check Math Gates
        this.gates.forEach(pair => {
          if (pair.moving) {
            pair.gates.forEach((g, idx) => {
              const offset = Math.sin(t * 2.2 + pair.phase) * (pair.amp || 0.7);
              g.x = g.baseX + (idx === 0 ? offset : -offset);
              g.mesh.position.x = g.x;
            });
          }
          if (!pair.triggered && Math.abs(this.crowdZ - pair.z) < 0.7) {
            pair.triggered = true;
            // Pick closer gate
            const chosen = Math.abs(this.crowdX - pair.gates[0].x) <= Math.abs(this.crowdX - pair.gates[1].x)
              ? pair.gates[0] : pair.gates[1];
            this.applyGateMath(chosen);
          }
        });

        // 2. Per-Runner Spinning Saw Trap Collision (only touching runners take damage!)
        this.saws.forEach(s => {
          s.mesh.rotation.y += dt * 10;
          const sx = Math.sin(t * (s.spd || 2.5) + s.phase) * 2.1;
          s.mesh.position.x = sx;
          // The blade is a thin vertical disc (radius 0.95) across the track: a runner is cut only if it is
          // inside the blade's thin slice in Z and within its reach in X. Only those runners are destroyed.
          if (Math.abs(this.crowdZ - s.z) < 3.2) {
            const hit = this.runnerMeshes.filter(m => {
              const rx = this.crowdX + m.position.x, rz = this.crowdZ + m.position.z;
              return Math.abs(rz - s.z) < 0.32 && Math.abs(rx - sx) < 1.05;
            });
            if (hit.length) {
              this.audio.playGateBad();
              this.addPopBurst(sx, 0.55, s.z, '#ef4444', Math.min(18, 3 + hit.length * 2));
              this.destroyRunners(hit, 'saw');
              if (this.crowdCount <= 0) this.triggerDefeat('Sliced by a spinning saw!');
            }
          }
        });

        // 2a. Jump ramps: warn before, and at take-off any runner that is not on the ramp drops into the gap
        for (const j of this.jumps) {
          if (!j.warned && this.crowdZ - 10 <= j.rampZ0) {
            j.warned = true;
            this.floatingTexts.push({ text: '⬆ JUMP!', x: window.innerWidth / 2, y: window.innerHeight * 0.38, color: '#f97316', life: 1.3 });
          }
          if (!j.launched && this.crowdZ <= j.rampZ1) {
            j.launched = true;
            this.audio.playGateGood();
            const off = this.runnerMeshes.filter(m => Math.abs(this.crowdX + m.position.x) > j.half + 0.05);
            if (off.length) {
              this.destroyRunners(off, 'fall');
              if (this.crowdCount <= 0) { this.triggerDefeat('Your squad fell into the gap!'); break; }
            }
          }
        }

        // 2b. Edge zones: runners hanging over the side fall off the track
        for (const zn of this.edgeZones) {
          if (this.crowdZ - 3 > zn.z0 || this.crowdZ + 3 < zn.z1) continue;
          if (!zn.warned && this.crowdZ - 6 <= zn.z0) {
            zn.warned = true;
            this.floatingTexts.push({ text: zn.kind === 'bridge' ? '⚠ NARROW BRIDGE!' : '⚠ NO RAILS!', x: window.innerWidth / 2, y: window.innerHeight * 0.38, color: '#f59e0b', life: 1.4 });
          }
        }
        if (this.state === 'RUNNING') this.checkFalls('Your squad fell off the edge!');

        // 3. Check Coins
        this.coinsList.forEach(c => {
          if (c.collected) return;
          c.mesh.rotation.z += dt * 4;
          if (Math.abs(this.crowdZ - c.z) < 1.0 && Math.abs(this.crowdX - c.x) < 1.35) {
            c.collected = true;
            c.mesh.visible = false;
            const gain = Math.round(5 * (1 + (this.incomeLvl - 1) * 0.2));
            this.coins += gain;
            localStorage.setItem('ccl_coins', String(this.coins));
            document.getElementById('hudCoins').textContent = this.coins;
            this.audio.playCoin();
          }
        });

        // 4. Enemy Squad Aggro Charge & Head-On Clashes (cannot slip past from the side!)
        this.enemies.forEach(en => {
          if (en.defeated) return;
          const dz = this.crowdZ - en.z;
          if (dz > 0 && dz < 8.5) {
            // Enemy squad spots player in its zone, charges forward & homes in laterally
            en.z += 5.2 * dt;
            // never charge into a gap: wait on solid ground just past the landing point
            const land = this.jumps.find(j => j.gapZ1 > en.z - 0.01 && j.gapZ1 - en.z < 10);
            if (land) en.z = Math.min(en.z, land.gapZ1 - 5);
            en.x += (this.crowdX - en.x) * (1 - Math.exp(-8 * dt));
            en.group.position.set(en.x, 0, en.z);
            en.group.children.forEach(m => {
              const u = m.userData;
              if (u && u.legL) {
                const sw = Math.sin(t * 18 + u.phase) * 0.65;
                u.legL.rotation.x = sw;
                u.legR.rotation.x = -sw;
              }
            });
          }
          if (Math.abs(this.crowdZ - en.z) < 1.75) {
            this.state = 'CLASH';
            this.activeEnemy = en;
          }
        });

        // 5. Check Boss Arena Arrival
        if (this.boss && !this.boss.defeated && this.crowdZ <= this.boss.z + 2.2) {
          this.state = 'BOSS';
          this.crowdX = 0;
          this.crowdGroup.position.x = 0;
          document.getElementById('bossHpWrap').classList.remove('hidden');
        }
      } else if (this.state === 'CLASH' && this.activeEnemy && this.checkFalls('Your squad fell off the edge!')) {
        // whole squad fell during the clash
      } else if (this.state === 'CLASH' && this.activeEnemy) {
        const en = this.activeEnemy;
        en.x += (this.crowdX - en.x) * (1 - Math.exp(-10 * dt));
        en.group.position.set(en.x, 0, en.z);
        const clashRate = Math.max(12, Math.ceil(this.crowdCount * 2.5)) * dt;
        const step = Math.max(1, Math.round(clashRate));
        if (this.crowdCount > 0 && en.count > 0) {
          this.crowdCount = Math.max(0, this.crowdCount - step);
          en.count = Math.max(0, en.count - step);
          this.audio.playPop();
          this.addPopBurst(this.crowdX, 0.5, this.crowdZ, '#38bdf8', 4);
          this.addPopBurst(en.x, 0.5, en.z, '#ef4444', 4);
          this.syncCrowdVisuals();
        }
        if (this.crowdCount <= 0) {
          this.triggerDefeat('Overwhelmed by the Red Squad!');
        } else if (en.count <= 0) {
          en.defeated = true;
          en.group.visible = false;
          this.activeEnemy = null;
          this.state = 'RUNNING';
        }
      } else if (this.state === 'BOSS' && this.boss) {
        const b = this.boss;
        const hitAmt = Math.max(1, Math.round(dt * 18));
        if (this.crowdCount > 0 && b.hp > 0) {
          this.crowdCount = Math.max(0, this.crowdCount - hitAmt);
          b.hp = Math.max(0, b.hp - hitAmt);
          b.hitFlash = 1;
          this.audio.playPop();
          this.addPopBurst(0, 1.2, b.z, '#ef4444', 6);
          this.syncCrowdVisuals();
          document.getElementById('bossHpFill').style.width = `${(b.hp / b.maxHp) * 100}%`;
        }
        if (b.hp <= 0) {
          b.defeated = true;
          b.dieT = 0;
          document.getElementById('bossHpWrap').classList.add('hidden');
          this.addPopBurst(0, 1.5, b.z, '#facc15', 35);
          if (this.crowdCount <= 0) this.crowdCount = 1;
          this.syncCrowdVisuals();
          this.state = 'STAIRS';
          this.stairTimer = 0;
          this.currentMult = 1.2;
          this.lastStepIdx = -1;
        } else if (this.crowdCount <= 0) {
          this.triggerDefeat('The Fortress Boss was too strong!');
        }
      } else if (this.state === 'STAIRS') {
        this.crowdZ -= 9.5 * dt;
        const stepIdx = Math.min(this.stairSteps.length - 1, Math.max(0, Math.floor((-this.crowdZ - this.trackLength - 3) / 3.6)));
        const step = this.stairSteps[stepIdx];
        if (step && stepIdx > this.lastStepIdx) {
          this.lastStepIdx = stepIdx;
          this.currentMult = step.mult;
          this.audio.playStep(stepIdx);
          // Drop off a layer of runners on each rainbow step
          this.crowdCount = Math.max(0, this.crowdCount - Math.max(1, Math.ceil(this.crowdCount * 0.25)));
          this.syncCrowdVisuals();
        }
        const curY = step ? step.y : 0;
        this.crowdGroup.position.set(0, curY, this.crowdZ);
        if (stepIdx >= this.stairSteps.length - 1 && this.giftBox && !this.giftBox.opened) {
          // Reached the Gift Box at the top! Start opening & coin collection sequence
          this.giftBox.opened = true;
          this.state = 'GIFT_OPEN';
          this.giftOpenTimer = 0;
          this.giftCoins = [];
          this.giftBonus = 0;
          this.giftSpawned = false;
          this.floatingTexts.push({ text: `🎁 ${this.giftBox.tier.name}!`, x: window.innerWidth / 2, y: window.innerHeight * 0.3, color: '#7c3aed', life: 1.8 });
          if (this.crowdCount <= 0) {
            this.crowdCount = 1;
            this.syncCrowdVisuals();
          }
        } else if (this.crowdCount <= 0) {
          this.triggerVictory();
        }
      } else if (this.state === 'GIFT_OPEN' && this.giftBox) {
        this.giftOpenTimer += dt;
        const gb = this.giftBox;
        // Phase 1 (0 - 0.5s): Lid pops up and tilts open!
        const openP = Math.min(1, this.giftOpenTimer / 0.45);
        gb.lid.position.y = 0.72 + openP * 0.85;
        gb.lid.position.z = -openP * 0.65;
        gb.lid.rotation.x = -openP * 1.15;
        gb.coinTop.visible = false;

        // Phase 2 (at 0.4s): Fountain 12 gold coins out of the box!
        if (!this.giftSpawned && this.giftOpenTimer >= 0.4) {
          this.giftSpawned = true;
          this.audio.playGateGood();
          const tier = gb.tier;
          const coinMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.6, roughness: 0.2 });
          const coinGeom = new THREE.CylinderGeometry(0.32, 0.32, 0.08, 12);
          const gemMat = new THREE.MeshStandardMaterial({ color: 0x67e8f9, metalness: 0.3, roughness: 0.05, emissive: 0x0891b2, emissiveIntensity: 0.5 });
          const gemGeom = new THREE.OctahedronGeometry(0.3);
          for (let i = 0; i < tier.drops; i++) {
            const isGem = tier.gem && i % 3 === 0;   // every third drop is a diamond, worth double
            const cm = new THREE.Mesh(isGem ? gemGeom : coinGeom, isGem ? gemMat : coinMat);
            if (!isGem) cm.rotation.x = Math.PI / 2;
            cm.position.set(0, gb.baseY + 0.5 * tier.scale, gb.z);
            this.worldGroup.add(cm);
            const angle = (i / tier.drops) * Math.PI * 2;
            this.giftCoins.push({
              mesh: cm,
              vx: Math.cos(angle) * (2.0 + Math.random() * 1.2),
              vy: 4.8 + Math.random() * 2.2,
              vz: Math.sin(angle) * (1.8 + Math.random() * 1.0) + 1.2,
              collected: false,
              value: isGem ? tier.value * 2 : tier.value,
              collectDelay: 0.65 + i * (0.96 / tier.drops)
            });
          }
        }

        // Phase 3: Bounce & magnetize coins into player crowd!
        let remainingCoins = 0;
        this.giftCoins.forEach((gc) => {
          if (gc.collected) return;
          remainingCoins++;
          gc.mesh.rotation.z += dt * 8;
          if (this.giftOpenTimer < gc.collectDelay) {
            gc.vy -= 13 * dt;
            gc.mesh.position.x += gc.vx * dt;
            gc.mesh.position.y = Math.max(gb.baseY - 0.3, gc.mesh.position.y + gc.vy * dt);
            gc.mesh.position.z += gc.vz * dt;
          } else {
            // Fly into player crowd & collect!
            const tx = 0;
            const ty = this.crowdGroup.position.y + 0.6;
            const tz = this.crowdZ;
            gc.mesh.position.x += (tx - gc.mesh.position.x) * Math.min(1, dt * 12);
            gc.mesh.position.y += (ty - gc.mesh.position.y) * Math.min(1, dt * 12);
            gc.mesh.position.z += (tz - gc.mesh.position.z) * Math.min(1, dt * 12);
            if (Math.hypot(gc.mesh.position.x - tx, gc.mesh.position.z - tz) < 0.6) {
              gc.collected = true;
              gc.mesh.visible = false;
              this.giftBonus += gc.value;
              this.coins += gc.value;
              localStorage.setItem('ccl_coins', String(this.coins));
              document.getElementById('hudCoins').textContent = this.coins;
              this.audio.playCoin();
              this.addPopBurst(tx, ty, tz, '#facc15', 5);
            }
          }
        });

        if (this.giftSpawned && remainingCoins === 0 && this.giftOpenTimer > 1.85) {
          this.triggerVictory();
        }
      }

      // Smooth Chase Camera
      // during a jump the camera rises only a little, so the crowd visibly flies up over the gap
      const camY = this.state === 'RUNNING' ? this.crowdGroup.position.y * 0.3 : this.crowdGroup.position.y;
      this.camera.position.set(this.crowdX * 0.35, camY + 7.4, this.crowdZ + 9.2);
      this.camera.lookAt(this.crowdX * 0.25, camY + 0.8, this.crowdZ - 5.5);
    }

    applyGateMath(gate) {
      const before = this.crowdCount;
      if (gate.op === '+') this.crowdCount += gate.val;
      else if (gate.op === '×') this.crowdCount *= gate.val;
      else if (gate.op === '-') this.crowdCount = Math.max(0, this.crowdCount - gate.val);
      else if (gate.op === '÷') this.crowdCount = Math.max(1, Math.floor(this.crowdCount / gate.val));

      if (gate.isGood) {
        this.audio.playGateGood();
        this.addPopBurst(this.crowdX, 0.8, this.crowdZ, '#38bdf8', 14);
      } else {
        this.audio.playGateBad();
        this.addPopBurst(this.crowdX, 0.8, this.crowdZ, '#f43f5e', 14);
      }

      this.syncCrowdVisuals();
      if (this.crowdCount <= 0) {
        this.triggerDefeat('Your squad dropped to 0!');
      } else if (before !== this.crowdCount) {
        this.floatingTexts.push({
          text: `${gate.op}${gate.val}`,
          x: window.innerWidth / 2,
          y: window.innerHeight * 0.56,
          color: gate.isGood ? '#0284c7' : '#e11d48',
          life: 0.9
        });
      }
    }

    triggerVictory() {
      if (this.state === 'VICTORY') return;
      this.state = 'VICTORY';
      this.audio.playVictory();
      const mult = this.currentMult || 1.5;
      const baseReward = 45 + this.stage * 15;
      const incomeBonus = 1 + (this.incomeLvl - 1) * 0.2;
      const giftCoins = this.giftBonus || 0;
      const stageCoins = Math.round(baseReward * mult * incomeBonus);
      const totalCoins = stageCoins + giftCoins;

      // Stage coins added here (giftCoins were already added live during collection)
      this.coins += stageCoins;
      // Stars: 1 = cleared, 2 = reached the 3x step, 3 = opened the gift box at the top
      const stars = giftCoins > 0 ? 3 : mult >= 3 ? 2 : 1;
      const cleared = this.stage;
      this.bestStars[cleared] = Math.max(this.bestStars[cleared] || 0, stars);
      this.unlocked = Math.min(MAX_LEVEL, Math.max(this.unlocked, cleared + 1));
      this.stage = Math.min(MAX_LEVEL, cleared + 1);
      localStorage.setItem('ccl_coins', String(this.coins));
      localStorage.setItem('ccl_stage', String(this.stage));
      localStorage.setItem('ccl_unlocked', String(this.unlocked));
      localStorage.setItem('ccl_stars', JSON.stringify(this.bestStars));
      document.getElementById('vicTitle').textContent = `Level ${cleared} Cleared! ${'★'.repeat(stars)}${'☆'.repeat(3 - stars)}`;
      document.getElementById('btnNextStage').textContent = cleared >= MAX_LEVEL ? 'ALL LEVELS DONE 🏆' : `LEVEL ${cleared + 1} ➜`;

      document.getElementById('vicMultBadge').textContent = giftCoins > 0
        ? `🎁 ${giftTierFor(cleared).name} +${giftCoins} 🪙 · ${mult}x BONUS!`
        : `🏆 ${mult}x RAINBOW BONUS!`;
      document.getElementById('vicDesc').textContent = giftCoins > 0
        ? `You reached the top and opened the ${giftTierFor(cleared).name.toLowerCase().replace(/\b\w/g, c => c.toUpperCase())}!`
        : 'You defeated the Boss Fortress!';
      document.getElementById('vicCoinsEarned').textContent = totalCoins;
      document.getElementById('hudCoins').textContent = this.coins;
      document.getElementById('victoryModal').classList.remove('hidden');
      this.refreshMenuUI();
    }

    triggerDefeat(reason) {
      if (this.state === 'DEFEAT') return;
      this.state = 'DEFEAT';
      this.audio.playGateBad();
      document.getElementById('bossHpWrap').classList.add('hidden');
      document.getElementById('loseDesc').textContent = reason;
      document.getElementById('defeatModal').classList.remove('hidden');
    }

    // ------------------------------------------------------------------------
    // 6. 2D OVERLAY (CROWD COUNT BADGE, ENEMY BADGES, PARTICLES)
    // ------------------------------------------------------------------------
    projectToScreen(x, y, z) {
      const v = new THREE.Vector3(x, y, z);
      v.project(this.camera);
      return {
        x: (v.x * 0.5 + 0.5) * window.innerWidth,
        y: (-v.y * 0.5 + 0.5) * window.innerHeight,
        visible: v.z < 1
      };
    }

    renderOverlay(dt) {
      const ctx = this.oCtx;
      ctx.clearRect(0, 0, this.overlay.width, this.overlay.height);

      // Draw Player Crowd Badge
      if (this.state !== 'MENU' && this.crowdCount > 0) {
        const p = this.projectToScreen(this.crowdX, this.crowdGroup.position.y + 1.45, this.crowdZ);
        if (p.visible) {
          this.drawCountPill(ctx, p.x, p.y, `${this.crowdCount}`, '#0284c7');
        }
      }

      // Draw Enemy Squad Badges
      if (this.state === 'RUNNING' || this.state === 'CLASH') {
        this.enemies.forEach(en => {
          if (en.defeated || en.count <= 0) return;
          const p = this.projectToScreen(en.x, 1.45, en.z);
          if (p.visible) {
            this.drawCountPill(ctx, p.x, p.y, `${en.count}`, '#dc2626');
          }
        });
      }

      // Particles
      for (let i = this.particles.length - 1; i >= 0; i--) {
        const pt = this.particles[i];
        pt.life -= dt;
        if (pt.life <= 0) { this.particles.splice(i, 1); continue; }
        pt.vy -= 14 * dt;
        pt.x += pt.vx * dt; pt.y += pt.vy * dt; pt.z += pt.vz * dt;
        const scr = this.projectToScreen(pt.x, pt.y, pt.z);
        if (scr.visible) {
          ctx.save();
          ctx.globalAlpha = Math.min(1, pt.life * 2);
          ctx.fillStyle = pt.color;
          ctx.beginPath();
          ctx.arc(scr.x, scr.y, 5, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }

      // Floating Gate Math Texts
      for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
        const ft = this.floatingTexts[i];
        ft.life -= dt;
        if (ft.life <= 0) { this.floatingTexts.splice(i, 1); continue; }
        ft.y -= 55 * dt;
        ctx.save();
        ctx.globalAlpha = Math.min(1, ft.life * 1.6);
        ctx.font = '900 32px Fredoka, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = ft.color;
        ctx.lineWidth = 6;
        ctx.strokeText(ft.text, ft.x, ft.y);
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.restore();
      }
    }

    drawCountPill(ctx, x, y, text, bgColor) {
      ctx.save();
      ctx.font = '900 16px Fredoka, sans-serif';
      const w = Math.max(42, ctx.measureText(text).width + 22);
      const h = 28;
      ctx.fillStyle = bgColor;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(x - w / 2, y - h / 2, w, h, 14);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, x, y + 1);
      ctx.restore();
    }

    // ------------------------------------------------------------------------
    // 7. INPUT & UI BINDINGS
    // ------------------------------------------------------------------------
    bindInput() {
      this.canvas.addEventListener('pointerdown', (e) => {
        if (this.state !== 'RUNNING') return;
        this.isDragging = true;
        this.lastPtrX = e.clientX;
      });
      window.addEventListener('pointermove', (e) => {
        if (!this.isDragging || this.state !== 'RUNNING') return;
        const dx = e.clientX - this.lastPtrX;
        this.lastPtrX = e.clientX;
        this.targetX = Math.max(-2.5, Math.min(2.5, this.targetX + (dx / window.innerWidth) * 9.5));
      });
      window.addEventListener('pointerup', () => { this.isDragging = false; });

      window.addEventListener('keydown', (e) => {
        if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.keys.left = true;
        if (e.code === 'ArrowRight' || e.code === 'KeyD') this.keys.right = true;
      });
      window.addEventListener('keyup', (e) => {
        if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.keys.left = false;
        if (e.code === 'ArrowRight' || e.code === 'KeyD') this.keys.right = false;
      });
    }

    refreshMenuUI() {
      document.getElementById('menuCoins').textContent = this.coins;
      document.getElementById('menuLevelTag').textContent = `LEVEL ${this.stage} / ${MAX_LEVEL}`;
      const cCost = this.countLvl * 50;
      const iCost = this.incomeLvl * 60;
      document.getElementById('upgCountLvl').textContent = `Lv.${this.countLvl} (+${(this.countLvl - 1) * 2})`;
      document.getElementById('upgCountCost').textContent = `🪙 ${cCost}`;
      document.getElementById('upgIncomeLvl').textContent = `Lv.${this.incomeLvl} (${(1 + (this.incomeLvl - 1) * 0.2).toFixed(1)}x)`;
      document.getElementById('upgIncomeCost').textContent = `🪙 ${iCost}`;

      const snd = this.audio.enabled ? '🔊' : '🔇';
      document.getElementById('btnMenuSound').textContent = snd;
      document.getElementById('btnSound').textContent = snd;

      const strip = document.getElementById('skinsStrip');
      strip.innerHTML = '';
      SKINS.forEach(sk => {
        const unlocked = this.unlockedSkins.includes(sk.id);
        const btn = document.createElement('button');
        btn.className = `skin-dot ${this.equippedSkin === sk.id ? 'active' : ''} ${!unlocked ? 'locked' : ''}`;
        btn.style.background = sk.hex;
        btn.title = unlocked ? sk.name : `${sk.name} (🪙 ${sk.price})`;
        btn.addEventListener('click', () => {
          if (unlocked) {
            this.equippedSkin = sk.id;
            localStorage.setItem('ccl_skin', sk.id);
            this.buildStage(this.stage, true);
            this.refreshMenuUI();
          } else if (this.coins >= sk.price) {
            this.coins -= sk.price;
            this.unlockedSkins.push(sk.id);
            this.equippedSkin = sk.id;
            localStorage.setItem('ccl_coins', String(this.coins));
            localStorage.setItem('ccl_skins', JSON.stringify(this.unlockedSkins));
            localStorage.setItem('ccl_skin', sk.id);
            this.audio.playGateGood();
            this.buildStage(this.stage, true);
            this.refreshMenuUI();
          }
        });
        strip.appendChild(btn);
      });
    }

    // used by playtest tooling to try other layouts for a level
    setLayoutVariant(level, v) { LAYOUT_VARIANT[level] = v; }

    renderLevelGrid() {
      const grid = document.getElementById('levelGrid');
      grid.innerHTML = '';
      for (let n = 1; n <= MAX_LEVEL; n++) {
        const locked = n > this.unlocked, st = this.bestStars[n] || 0;
        const b = document.createElement('button');
        b.className = 'lvl-btn' + (locked ? ' locked' : '') + (n === this.stage ? ' current' : '') + (st ? ' done' : '');
        b.innerHTML = locked ? '🔒' : `<b>${n}</b><small>${st ? '★'.repeat(st) : '&nbsp;'}</small>`;
        if (!locked) b.addEventListener('click', () => {
          this.stage = n; localStorage.setItem('ccl_stage', String(n));
          document.getElementById('levelsModal').classList.add('hidden');
          this.startRun();
        });
        grid.appendChild(b);
      }
    }

    bindUI() {
      document.getElementById('btnStartRun').addEventListener('click', () => this.startRun());
      document.getElementById('btnLevels').addEventListener('click', () => {
        this.renderLevelGrid();
        document.getElementById('levelsModal').classList.remove('hidden');
      });
      document.getElementById('btnCloseLevels').addEventListener('click', () => document.getElementById('levelsModal').classList.add('hidden'));
      document.getElementById('btnNextStage').addEventListener('click', () => this.startRun());
      document.getElementById('btnRetryStage').addEventListener('click', () => this.startRun());

      const goMenu = () => {
        this.state = 'MENU';
        document.getElementById('gameHud').classList.add('hidden');
        document.getElementById('bossHpWrap').classList.add('hidden');
        document.getElementById('defeatModal').classList.add('hidden');
        document.getElementById('victoryModal').classList.add('hidden');
        document.getElementById('menuScreen').classList.remove('hidden');
        this.buildStage(this.stage, true);
        this.refreshMenuUI();
      };
      document.getElementById('btnHome').addEventListener('click', goMenu);
      document.getElementById('btnLoseMenu').addEventListener('click', goMenu);

      const toggleSnd = () => { this.audio.toggle(); this.refreshMenuUI(); };
      document.getElementById('btnMenuSound').addEventListener('click', toggleSnd);
      document.getElementById('btnSound').addEventListener('click', toggleSnd);

      document.getElementById('btnUpgradeCount').addEventListener('click', () => {
        const cost = this.countLvl * 50;
        if (this.coins >= cost) {
          this.coins -= cost;
          this.countLvl++;
          localStorage.setItem('ccl_coins', String(this.coins));
          localStorage.setItem('ccl_count_lvl', String(this.countLvl));
          this.audio.playGateGood();
          this.buildStage(this.stage, true);
          this.refreshMenuUI();
        }
      });

      document.getElementById('btnUpgradeIncome').addEventListener('click', () => {
        const cost = this.incomeLvl * 60;
        if (this.coins >= cost) {
          this.coins -= cost;
          this.incomeLvl++;
          localStorage.setItem('ccl_coins', String(this.coins));
          localStorage.setItem('ccl_income_lvl', String(this.incomeLvl));
          this.audio.playGateGood();
          this.refreshMenuUI();
        }
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.cclGame = new CountControlGame(); });
  } else {
    window.cclGame = new CountControlGame();
  }
})();
