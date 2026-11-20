/* ==========================================================================
   HIDDEN PIGEON - POKI STYLE SCENIC PUZZLE GAME
   Procedural 2D European cartoon vector art, interactive pigeons, audio synth
   Multi-layer scene occlusion: pigeons partially hidden behind environment elements
   ========================================================================== */

(function () {
  'use strict';

  // ==========================================================================
  // WEB AUDIO SYNTHESIZER (100% self-contained, zero external audio dependency)
  // ==========================================================================
  const AudioEngine = (function () {
    let ctx = null;
    let sfxEnabled = localStorage.getItem('hp_sfx') !== 'false';
    let musicEnabled = localStorage.getItem('hp_music') !== 'false';
    let bgmTimer = null;
    let bgmNoteIdx = 0;

    function getContext() {
      if (!ctx && (window.AudioContext || window.webkitAudioContext)) {
        ctx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (ctx && ctx.state === 'suspended') {
        ctx.resume();
      }
      return ctx;
    }

    // Parisian / Italian cafe acoustic waltz BGM
    const WALTZ_MELODY = [
      { f: 261.63, d: 0.35 }, { f: 329.63, d: 0.25 }, { f: 392.00, d: 0.25 },
      { f: 493.88, d: 0.45 }, { f: 392.00, d: 0.25 }, { f: 329.63, d: 0.25 },
      { f: 220.00, d: 0.35 }, { f: 261.63, d: 0.25 }, { f: 329.63, d: 0.25 },
      { f: 440.00, d: 0.45 }, { f: 329.63, d: 0.25 }, { f: 261.63, d: 0.25 },
      { f: 293.66, d: 0.35 }, { f: 349.23, d: 0.25 }, { f: 440.00, d: 0.25 },
      { f: 523.25, d: 0.45 }, { f: 440.00, d: 0.25 }, { f: 349.23, d: 0.25 },
      { f: 196.00, d: 0.35 }, { f: 246.94, d: 0.25 }, { f: 293.66, d: 0.25 },
      { f: 392.00, d: 0.50 }, { f: 349.23, d: 0.25 }, { f: 293.66, d: 0.25 }
    ];

    function scheduleNextBgmNote() {
      if (!musicEnabled) return;
      const ac = getContext();
      if (!ac) return;

      const note = WALTZ_MELODY[bgmNoteIdx % WALTZ_MELODY.length];
      bgmNoteIdx++;

      const now = ac.currentTime;
      const osc = ac.createOscillator();
      const gain = ac.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(note.f, now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.045, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + note.d);

      osc.connect(gain);
      gain.connect(ac.destination);

      osc.start(now);
      osc.stop(now + note.d);

      bgmTimer = setTimeout(scheduleNextBgmNote, note.d * 1000 + 120);
    }

    return {
      init: function () {
        if (musicEnabled) this.startMusic();
      },
      startMusic: function () {
        if (!musicEnabled) return;
        if (bgmTimer) clearTimeout(bgmTimer);
        scheduleNextBgmNote();
      },
      stopMusic: function () {
        if (bgmTimer) clearTimeout(bgmTimer);
        bgmTimer = null;
      },
      setMusic: function (on) {
        musicEnabled = on;
        localStorage.setItem('hp_music', on ? 'true' : 'false');
        if (on) this.startMusic();
        else this.stopMusic();
        return musicEnabled;
      },
      isMusicOn: function () {
        return musicEnabled;
      },
      setSfx: function (on) {
        sfxEnabled = on;
        localStorage.setItem('hp_sfx', on ? 'true' : 'false');
        return sfxEnabled;
      },
      isSfxOn: function () {
        return sfxEnabled;
      },

      // Pigeon Coo Sound Effect
      playCoo: function () {
        if (!sfxEnabled) return;
        const ac = getContext();
        if (!ac) return;

        const now = ac.currentTime;
        const osc = ac.createOscillator();
        const gain = ac.createGain();
        const filter = ac.createBiquadFilter();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(340, now);
        osc.frequency.linearRampToValueAtTime(420, now + 0.08);
        osc.frequency.linearRampToValueAtTime(280, now + 0.22);
        osc.frequency.linearRampToValueAtTime(320, now + 0.32);
        osc.frequency.exponentialRampToValueAtTime(200, now + 0.45);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(750, now);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.28, now + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ac.destination);

        osc.start(now);
        osc.stop(now + 0.46);
      },

      // Finding Chime / Bell
      playChime: function () {
        if (!sfxEnabled) return;
        const ac = getContext();
        if (!ac) return;

        const notes = [587.33, 739.99, 880.00, 1174.66]; // D5, F#5, A5, D6
        notes.forEach((freq, idx) => {
          const now = ac.currentTime + idx * 0.055;
          const osc = ac.createOscillator();
          const gain = ac.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now);

          gain.gain.setValueAtTime(0.001, now);
          gain.gain.linearRampToValueAtTime(0.18, now + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.38);

          osc.connect(gain);
          gain.connect(ac.destination);

          osc.start(now);
          osc.stop(now + 0.40);
        });
      },

      // Hint pulse sound
      playHint: function () {
        if (!sfxEnabled) return;
        const ac = getContext();
        if (!ac) return;

        const now = ac.currentTime;
        const osc = ac.createOscillator();
        const gain = ac.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.25);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.16, now + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

        osc.connect(gain);
        gain.connect(ac.destination);

        osc.start(now);
        osc.stop(now + 0.29);
      },

      // UI Click Sound
      playClick: function () {
        if (!sfxEnabled) return;
        const ac = getContext();
        if (!ac) return;

        const now = ac.currentTime;
        const osc = ac.createOscillator();
        const gain = ac.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(200, now + 0.06);

        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

        osc.connect(gain);
        gain.connect(ac.destination);

        osc.start(now);
        osc.stop(now + 0.07);
      },

      // Level Win Fanfare
      playVictory: function () {
        if (!sfxEnabled) return;
        const ac = getContext();
        if (!ac) return;

        const fanfare = [
          { f: 523.25, t: 0.00, d: 0.12 }, // C5
          { f: 659.25, t: 0.13, d: 0.12 }, // E5
          { f: 783.99, t: 0.26, d: 0.14 }, // G5
          { f: 1046.50, t: 0.42, d: 0.45 } // C6
        ];

        fanfare.forEach(item => {
          const now = ac.currentTime + item.t;
          const osc = ac.createOscillator();
          const gain = ac.createGain();

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(item.f, now);

          gain.gain.setValueAtTime(0.001, now);
          gain.gain.linearRampToValueAtTime(0.24, now + 0.03);
          gain.gain.exponentialRampToValueAtTime(0.001, now + item.d);

          osc.connect(gain);
          gain.connect(ac.destination);

          osc.start(now);
          osc.stop(now + item.d + 0.02);
        });
      }
    };
  })();

  // ==========================================================================
  // CONFETTI CELEBRATION SYSTEM
  // ==========================================================================
  const Confetti = (function () {
    let canvas, ctx, particles = [], running = false;
    const COLORS = ['#ff5252', '#ff4081', '#7c4dff', '#536dfe', '#40c4ff', '#18ffff', '#64ffda', '#ffd740', '#ff6e40'];

    function init() {
      canvas = document.getElementById('confettiCanvas');
      if (canvas) ctx = canvas.getContext('2d');
      resize();
      window.addEventListener('resize', resize);
    }

    function resize() {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    function launch(count = 80) {
      if (!canvas || !ctx) return;
      particles = [];
      for (let i = 0; i < count; i++) {
        particles.push({
          x: canvas.width * 0.5 + (Math.random() - 0.5) * 200,
          y: canvas.height * 0.4 + (Math.random() - 0.5) * 80,
          vx: (Math.random() - 0.5) * 16,
          vy: -Math.random() * 12 - 4,
          size: Math.random() * 8 + 5,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          rotation: Math.random() * 360,
          vRot: (Math.random() - 0.5) * 12,
          alpha: 1.0
        });
      }
      if (!running) {
        running = true;
        animate();
      }
    }

    function animate() {
      if (!running) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;

      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.35; // gravity
        p.vx *= 0.98;
        p.rotation += p.vRot;
        p.alpha -= 0.006;

        if (p.alpha > 0 && p.y < canvas.height + 30) {
          alive = true;
          ctx.save();
          ctx.globalAlpha = Math.max(0, p.alpha);
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
          ctx.restore();
        }
      });

      if (alive) {
        requestAnimationFrame(animate);
      } else {
        running = false;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }

    return { init, launch };
  })();

  // ==========================================================================
  // GAME WORLD CONFIGURATION & CONSTANTS
  // Base scene coordinate space: 1280 x 800 (high-res vector canvas)
  // ==========================================================================
  const SCENE_W = 1280;
  const SCENE_H = 800;

  // 10 UNIQUE LEVELS WITH 5 BEAUTIFUL ENVIRONMENTS:
  // Environments:
  // - 'park': Beautiful Green Park with lush lawns, oak trees, benches, fountain, blooming bushes
  // - 'river': Riverside with sparkling water, wooden dock pier, canoe, cattail reeds, willow tree
  // - 'night': Dark Night Environment with moon, twinkling stars, lit windows, brick chimneys
  // - 'terrace': Mediterranean Terrace with terracotta roofs, potted lemon trees, pergolas, balustrades
  // - 'market': Old Town Market Square with cobblestones, fruit crates, striped canopies, barrels
  const LEVELS = [
    {
      id: 1,
      name: 'Sunny Green Park',
      theme: 'park',
      totalPigeons: 10,
      description: 'Search behind park benches, flowering hedges, tree foliage and the stone fountain.',
      pigeons: [
        { id: 1, x: 230, y: 550, scale: 0.90, flip: false, occluder: 'bench' },
        { id: 2, x: 640, y: 395, scale: 0.85, flip: true, occluder: 'fountain' },
        { id: 3, x: 145, y: 220, scale: 0.78, flip: false, occluder: 'tree-left' },
        { id: 4, x: 440, y: 510, scale: 0.95, flip: true, occluder: 'hedge-left' },
        { id: 5, x: 880, y: 560, scale: 0.90, flip: false, occluder: 'hedge-right' },
        { id: 6, x: 1060, y: 240, scale: 0.80, flip: true, occluder: 'tree-right' },
        { id: 7, x: 740, y: 680, scale: 1.00, flip: false, occluder: 'flowerbed' },
        { id: 8, x: 995, y: 530, scale: 0.92, flip: true, occluder: 'bench-right' },
        { id: 9, x: 520, y: 250, scale: 0.75, flip: false, occluder: 'gazebo' },
        { id: 10, x: 335, y: 690, scale: 1.05, flip: true, occluder: 'birdbath' }
      ]
    },
    {
      id: 2,
      name: 'Riverside Pier',
      theme: 'river',
      totalPigeons: 11,
      description: 'Pigeons peeking behind river reeds, dock pilings, canoe bow, and weeping willow.',
      pigeons: [
        { id: 1, x: 180, y: 580, scale: 0.95, flip: false, occluder: 'cattails-left' },
        { id: 2, x: 480, y: 520, scale: 0.90, flip: true, occluder: 'canoe' },
        { id: 3, x: 770, y: 460, scale: 0.85, flip: false, occluder: 'dock-railing' },
        { id: 4, x: 920, y: 540, scale: 0.92, flip: true, occluder: 'dock-piling' },
        { id: 5, x: 320, y: 240, scale: 0.80, flip: false, occluder: 'willow-tree' },
        { id: 6, x: 620, y: 340, scale: 0.75, flip: true, occluder: 'bridge-arch' },
        { id: 7, x: 1100, y: 600, scale: 1.00, flip: false, occluder: 'cattails-right' },
        { id: 8, x: 260, y: 430, scale: 0.85, flip: true, occluder: 'stone-pier' },
        { id: 9, x: 980, y: 370, scale: 0.78, flip: false, occluder: 'boathouse' },
        { id: 10, x: 140, y: 700, scale: 1.05, flip: true, occluder: 'river-rocks' },
        { id: 11, x: 670, y: 660, scale: 1.00, flip: false, occluder: 'water-lily' }
      ]
    },
    {
      id: 3,
      name: 'Midnight Stargazing',
      theme: 'night',
      totalPigeons: 12,
      description: 'Dark starry night! Spot pigeons hiding behind chimneys, dormer windows, and lantern posts.',
      pigeons: [
        { id: 1, x: 210, y: 240, scale: 0.82, flip: false, occluder: 'chimney-left' },
        { id: 2, x: 490, y: 310, scale: 0.85, flip: true, occluder: 'window-glow' },
        { id: 3, x: 730, y: 190, scale: 0.75, flip: false, occluder: 'chimney-center' },
        { id: 4, x: 980, y: 280, scale: 0.80, flip: true, occluder: 'mansard-roof' },
        { id: 5, x: 1140, y: 210, scale: 0.72, flip: false, occluder: 'weathervane' },
        { id: 6, x: 340, y: 470, scale: 0.90, flip: true, occluder: 'dormer-left' },
        { id: 7, x: 620, y: 450, scale: 0.90, flip: false, occluder: 'balustrade' },
        { id: 8, x: 860, y: 490, scale: 0.88, flip: true, occluder: 'dormer-right' },
        { id: 9, x: 160, y: 670, scale: 1.05, flip: false, occluder: 'street-lantern' },
        { id: 10, x: 470, y: 650, scale: 1.00, flip: true, occluder: 'stone-steps' },
        { id: 11, x: 810, y: 680, scale: 1.05, flip: false, occluder: 'wall-ivy' },
        { id: 12, x: 1080, y: 640, scale: 1.00, flip: true, occluder: 'clock-tower' }
      ]
    },
    {
      id: 4,
      name: 'Mediterranean Terrace',
      theme: 'terrace',
      totalPigeons: 13,
      description: 'Peeking behind terracotta pots, pergola ivy vines, stone balustrades and shutters.',
      pigeons: [
        { id: 1, x: 160, y: 280, scale: 0.80, flip: false, occluder: 'pergola-vine' },
        { id: 2, x: 390, y: 350, scale: 0.85, flip: true, occluder: 'shutter-left' },
        { id: 3, x: 670, y: 260, scale: 0.75, flip: false, occluder: 'roof-tile' },
        { id: 4, x: 890, y: 340, scale: 0.85, flip: true, occluder: 'shutter-right' },
        { id: 5, x: 1110, y: 270, scale: 0.78, flip: false, occluder: 'potted-cypress' },
        { id: 6, x: 230, y: 520, scale: 0.95, flip: true, occluder: 'balcony-railing' },
        { id: 7, x: 510, y: 560, scale: 0.90, flip: false, occluder: 'lemon-tree' },
        { id: 8, x: 790, y: 510, scale: 0.92, flip: true, occluder: 'stone-urn' },
        { id: 9, x: 1020, y: 530, scale: 0.95, flip: false, occluder: 'olive-pot' },
        { id: 10, x: 110, y: 680, scale: 1.05, flip: true, occluder: 'terracotta-bench' },
        { id: 11, x: 380, y: 690, scale: 1.00, flip: false, occluder: 'flower-border' },
        { id: 12, x: 680, y: 700, scale: 1.05, flip: true, occluder: 'tiled-steps' },
        { id: 13, x: 960, y: 670, scale: 1.00, flip: false, occluder: 'sun-lounger' }
      ]
    },
    {
      id: 5,
      name: 'Old Town Market',
      theme: 'market',
      totalPigeons: 14,
      description: 'Hidden behind colorful striped awnings, apple crates, barrels, and cobblestone carts.',
      pigeons: [
        { id: 1, x: 140, y: 260, scale: 0.80, flip: false, occluder: 'awning-red' },
        { id: 2, x: 370, y: 340, scale: 0.85, flip: true, occluder: 'fruit-crate-apple' },
        { id: 3, x: 590, y: 220, scale: 0.72, flip: false, occluder: 'clock-dial' },
        { id: 4, x: 820, y: 270, scale: 0.82, flip: true, occluder: 'awning-blue' },
        { id: 5, x: 1050, y: 250, scale: 0.78, flip: false, occluder: 'chimney-pot' },
        { id: 6, x: 220, y: 500, scale: 0.95, flip: true, occluder: 'barrel-left' },
        { id: 7, x: 460, y: 480, scale: 0.90, flip: false, occluder: 'vegetable-box' },
        { id: 8, x: 720, y: 490, scale: 0.92, flip: true, occluder: 'cheese-stand' },
        { id: 9, x: 940, y: 470, scale: 0.90, flip: false, occluder: 'flower-basket' },
        { id: 10, x: 1140, y: 510, scale: 0.95, flip: true, occluder: 'barrel-right' },
        { id: 11, x: 120, y: 680, scale: 1.05, flip: false, occluder: 'cart-wheel' },
        { id: 12, x: 390, y: 700, scale: 1.00, flip: true, occluder: 'paving-curb' },
        { id: 13, x: 670, y: 670, scale: 1.05, flip: false, occluder: 'bakery-cart' },
        { id: 14, x: 990, y: 690, scale: 1.00, flip: true, occluder: 'produce-sack' }
      ]
    },
    {
      id: 6,
      name: 'Emerald Pavilion Park',
      theme: 'park',
      totalPigeons: 15,
      description: 'Find sneaky pigeons peeking through gazebo arches, rose bushes, and oak foliage.',
      pigeons: [
        { id: 1, x: 130, y: 230, scale: 0.78, flip: false, occluder: 'tree-left' },
        { id: 2, x: 320, y: 310, scale: 0.82, flip: true, occluder: 'gazebo-roof' },
        { id: 3, x: 520, y: 260, scale: 0.75, flip: false, occluder: 'gazebo-cupola' },
        { id: 4, x: 710, y: 320, scale: 0.82, flip: true, occluder: 'gazebo-column' },
        { id: 5, x: 930, y: 220, scale: 0.76, flip: false, occluder: 'tree-right' },
        { id: 6, x: 1120, y: 280, scale: 0.80, flip: true, occluder: 'topiary-bird' },
        { id: 7, x: 210, y: 480, scale: 0.92, flip: false, occluder: 'rose-bush-left' },
        { id: 8, x: 440, y: 520, scale: 0.90, flip: true, occluder: 'bench' },
        { id: 9, x: 650, y: 450, scale: 0.88, flip: false, occluder: 'fountain' },
        { id: 10, x: 860, y: 510, scale: 0.92, flip: true, occluder: 'rose-bush-right' },
        { id: 11, x: 1040, y: 490, scale: 0.90, flip: false, occluder: 'park-lamp' },
        { id: 12, x: 90, y: 670, scale: 1.05, flip: true, occluder: 'flowerbed' },
        { id: 13, x: 340, y: 680, scale: 1.00, flip: false, occluder: 'birdbath' },
        { id: 14, x: 600, y: 690, scale: 1.05, flip: true, occluder: 'hedge-left' },
        { id: 15, x: 910, y: 670, scale: 1.00, flip: false, occluder: 'hedge-right' }
      ]
    },
    {
      id: 7,
      name: 'Sunset River Harbor',
      theme: 'river',
      totalPigeons: 16,
      description: 'Hidden along the harbor embankment, sailboat cabin, stone arches and reeds.',
      pigeons: [
        { id: 1, x: 150, y: 240, scale: 0.75, flip: false, occluder: 'willow-tree' },
        { id: 2, x: 340, y: 310, scale: 0.80, flip: true, occluder: 'bridge-arch' },
        { id: 3, x: 570, y: 220, scale: 0.72, flip: false, occluder: 'distant-quay' },
        { id: 4, x: 790, y: 320, scale: 0.82, flip: true, occluder: 'sailboat-cabin' },
        { id: 5, x: 1020, y: 230, scale: 0.78, flip: false, occluder: 'boathouse' },
        { id: 6, x: 1150, y: 340, scale: 0.80, flip: true, occluder: 'harbor-crane' },
        { id: 7, x: 210, y: 500, scale: 0.92, flip: false, occluder: 'cattails-left' },
        { id: 8, x: 420, y: 540, scale: 0.90, flip: true, occluder: 'canoe' },
        { id: 9, x: 670, y: 470, scale: 0.88, flip: false, occluder: 'dock-railing' },
        { id: 10, x: 890, y: 520, scale: 0.92, flip: true, occluder: 'dock-piling' },
        { id: 11, x: 1080, y: 490, scale: 0.90, flip: false, occluder: 'stone-pier' },
        { id: 12, x: 110, y: 690, scale: 1.05, flip: true, occluder: 'river-rocks' },
        { id: 13, x: 370, y: 680, scale: 1.00, flip: false, occluder: 'cattails-center' },
        { id: 14, x: 600, y: 700, scale: 1.05, flip: true, occluder: 'water-lily' },
        { id: 15, x: 830, y: 680, scale: 1.00, flip: false, occluder: 'mooring-post' },
        { id: 16, x: 1060, y: 700, scale: 1.05, flip: true, occluder: 'cattails-right' }
      ]
    },
    {
      id: 8,
      name: 'Moonlit City Rooftops',
      theme: 'night',
      totalPigeons: 16,
      description: 'Lurking in shadows behind chimneys, slate mansard roofs, and glowing attics.',
      pigeons: [
        { id: 1, x: 160, y: 220, scale: 0.78, flip: false, occluder: 'chimney-left' },
        { id: 2, x: 360, y: 290, scale: 0.82, flip: true, occluder: 'window-glow' },
        { id: 3, x: 580, y: 180, scale: 0.72, flip: false, occluder: 'clock-tower' },
        { id: 4, x: 800, y: 270, scale: 0.82, flip: true, occluder: 'chimney-center' },
        { id: 5, x: 1010, y: 200, scale: 0.75, flip: false, occluder: 'weathervane' },
        { id: 6, x: 1160, y: 260, scale: 0.80, flip: true, occluder: 'mansard-roof' },
        { id: 7, x: 230, y: 460, scale: 0.90, flip: false, occluder: 'dormer-left' },
        { id: 8, x: 450, y: 440, scale: 0.88, flip: true, occluder: 'balustrade' },
        { id: 9, x: 690, y: 470, scale: 0.90, flip: false, occluder: 'roof-finial' },
        { id: 10, x: 910, y: 450, scale: 0.88, flip: true, occluder: 'dormer-right' },
        { id: 11, x: 1110, y: 480, scale: 0.92, flip: false, occluder: 'attic-window' },
        { id: 12, x: 120, y: 660, scale: 1.05, flip: true, occluder: 'street-lantern' },
        { id: 13, x: 380, y: 670, scale: 1.00, flip: false, occluder: 'stone-steps' },
        { id: 14, x: 620, y: 680, scale: 1.05, flip: true, occluder: 'wall-ivy' },
        { id: 15, x: 870, y: 670, scale: 1.00, flip: false, occluder: 'lantern-right' },
        { id: 16, x: 1080, y: 690, scale: 1.05, flip: true, occluder: 'drainpipe' }
      ]
    },
    {
      id: 9,
      name: 'Grand Piazza Market',
      theme: 'market',
      totalPigeons: 18,
      description: 'Challenging market hunt! Pigeons peeking around bakery stalls, fruit crates and banners.',
      pigeons: [
        { id: 1, x: 120, y: 240, scale: 0.76, flip: false, occluder: 'awning-red' },
        { id: 2, x: 290, y: 310, scale: 0.80, flip: true, occluder: 'shutter-left' },
        { id: 3, x: 480, y: 200, scale: 0.70, flip: false, occluder: 'clock-dial' },
        { id: 4, x: 690, y: 280, scale: 0.80, flip: true, occluder: 'awning-blue' },
        { id: 5, x: 880, y: 210, scale: 0.72, flip: false, occluder: 'chimney-pot' },
        { id: 6, x: 1080, y: 270, scale: 0.78, flip: true, occluder: 'flag-banner' },
        { id: 7, x: 180, y: 470, scale: 0.90, flip: false, occluder: 'fruit-crate-apple' },
        { id: 8, x: 360, y: 490, scale: 0.88, flip: true, occluder: 'barrel-left' },
        { id: 9, x: 550, y: 460, scale: 0.86, flip: false, occluder: 'vegetable-box' },
        { id: 10, x: 740, y: 480, scale: 0.90, flip: true, occluder: 'cheese-stand' },
        { id: 11, x: 920, y: 460, scale: 0.88, flip: false, occluder: 'flower-basket' },
        { id: 12, x: 1120, y: 490, scale: 0.92, flip: true, occluder: 'barrel-right' },
        { id: 13, x: 90, y: 670, scale: 1.05, flip: false, occluder: 'cart-wheel' },
        { id: 14, x: 280, y: 690, scale: 1.00, flip: true, occluder: 'bakery-cart' },
        { id: 15, x: 510, y: 680, scale: 1.05, flip: false, occluder: 'paving-curb' },
        { id: 16, x: 730, y: 700, scale: 1.00, flip: true, occluder: 'produce-sack' },
        { id: 17, x: 940, y: 680, scale: 1.05, flip: false, occluder: 'market-pillar' },
        { id: 18, x: 1140, y: 700, scale: 1.00, flip: true, occluder: 'flower-cart' }
      ]
    },
    {
      id: 10,
      name: 'Royal Botanical Riverside',
      theme: 'river',
      totalPigeons: 20,
      description: 'Master level! 20 clever pigeons hiding along lush riverside weeping willows and stone bridge.',
      pigeons: [
        { id: 1, x: 110, y: 220, scale: 0.74, flip: false, occluder: 'willow-tree' },
        { id: 2, x: 270, y: 290, scale: 0.78, flip: true, occluder: 'stone-balustrade' },
        { id: 3, x: 450, y: 210, scale: 0.70, flip: false, occluder: 'bridge-arch' },
        { id: 4, x: 630, y: 270, scale: 0.78, flip: true, occluder: 'distant-quay' },
        { id: 5, x: 820, y: 200, scale: 0.72, flip: false, occluder: 'boathouse' },
        { id: 6, x: 1000, y: 280, scale: 0.78, flip: true, occluder: 'conservatory-dome' },
        { id: 7, x: 1160, y: 230, scale: 0.75, flip: false, occluder: 'harbor-crane' },
        { id: 8, x: 180, y: 470, scale: 0.88, flip: true, occluder: 'cattails-left' },
        { id: 9, x: 350, y: 510, scale: 0.86, flip: false, occluder: 'canoe' },
        { id: 10, x: 530, y: 450, scale: 0.85, flip: true, occluder: 'dock-railing' },
        { id: 11, x: 710, y: 490, scale: 0.88, flip: false, occluder: 'dock-piling' },
        { id: 12, x: 890, y: 460, scale: 0.86, flip: true, occluder: 'sailboat-cabin' },
        { id: 13, x: 1070, y: 490, scale: 0.90, flip: false, occluder: 'stone-pier' },
        { id: 14, x: 80, y: 680, scale: 1.05, flip: true, occluder: 'river-rocks' },
        { id: 15, x: 260, y: 670, scale: 1.00, flip: false, occluder: 'cattails-center' },
        { id: 16, x: 470, y: 690, scale: 1.05, flip: true, occluder: 'water-lily' },
        { id: 17, x: 670, y: 670, scale: 1.00, flip: false, occluder: 'mooring-post' },
        { id: 18, x: 860, y: 690, scale: 1.05, flip: true, occluder: 'cattails-right' },
        { id: 19, x: 1040, y: 670, scale: 1.00, flip: false, occluder: 'stone-steps' },
        { id: 20, x: 1170, y: 700, scale: 1.05, flip: true, occluder: 'drainpipe' }
      ]
    }
  ];

  // ==========================================================================
  // GAME STATE
  // ==========================================================================
  let canvas, ctx;
  let canvasW = 0, canvasH = 0;
  let currentLevelIdx = 0;
  let currentPigeons = [];
  let foundPigeonsCount = 0;
  let levelStartTime = 0;
  let hintCooldown = false;
  let activeHintPigeon = null;
  let levelProgress = JSON.parse(localStorage.getItem('hp_level_stars') || '{}');

  // Camera Pan & Zoom State
  let panX = 0, panY = 0;
  let zoom = 1.0;
  const MIN_ZOOM = 0.85;
  const MAX_ZOOM = 2.4;
  let isDragging = false;
  let startDragX = 0, startDragY = 0;
  let hasMoved = false;
  let baseScale = 1.0;

  // Floating Particles & Finding Animations
  let floatingFx = [];
  let featherParticles = [];

  // ==========================================================================
  // INITIALIZATION
  // ==========================================================================
  function init() {
    canvas = document.getElementById('gameCanvas');
    if (!canvas) return;
    ctx = canvas.getContext('2d');

    Confetti.init();
    bindEvents();
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Load saved progress or default
    currentLevelIdx = 0;
    loadLevel(0);

    // Render Level Select grid
    renderLevelSelectGrid();

    // Setup Mascot pigeon
    setupMascot();

    // Start Audio Engine on first interaction
    const unlockAudio = () => {
      AudioEngine.init();
      window.removeEventListener('pointerdown', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
    };
    window.addEventListener('pointerdown', unlockAudio);
    window.addEventListener('keydown', unlockAudio);

    // Hide loading screen if CIEL loader finished
    setTimeout(() => {
      const loader = document.getElementById('ciel-loader') || document.querySelector('.ciel-loader-overlay');
      if (loader) loader.style.display = 'none';
    }, 450);

    // Start Main Render Loop
    requestAnimationFrame(render);
  }

  // ==========================================================================
  // LEVEL SETUP & SPAWNING
  // ==========================================================================
  function loadLevel(idx) {
    if (idx < 0) idx = 0;
    if (idx >= LEVELS.length) idx = LEVELS.length - 1;
    currentLevelIdx = idx;

    const level = LEVELS[currentLevelIdx];
    foundPigeonsCount = 0;
    activeHintPigeon = null;
    floatingFx = [];
    featherParticles = [];
    levelStartTime = Date.now();

    // Deep copy pigeons and setup dynamic interactive states
    currentPigeons = level.pigeons.map(p => ({
      ...p,
      found: false,
      disappeared: false,
      alpha: 1.0,
      flyX: 0,
      flyY: 0,
      flySpeed: 2.8 + Math.random() * 1.5,
      flyDir: (Math.random() - 0.5) * 3.0,
      flapSpeed: 18 + Math.random() * 8,
      popAnim: 0,
      accessory: p.accessory || (p.id % 4 === 1 ? 'crumb' : (p.id % 4 === 2 ? 'beret' : null))
    }));

    // Update Top HUD
    updateHUD();

    // Reset camera to fit screen nicely
    fitToScreen();

    // Resume BGM if enabled
    AudioEngine.startMusic();
  }

  function updateHUD() {
    const level = LEVELS[currentLevelIdx];
    const badgeNum = document.getElementById('levelBadgeNum');
    const badgeName = document.getElementById('levelBadgeName');
    const counterText = document.getElementById('pigeonCounterText');

    if (badgeNum) badgeNum.textContent = `Level ${level.id}`;
    if (badgeName) badgeName.textContent = level.name;
    if (counterText) counterText.textContent = `${foundPigeonsCount} / ${level.totalPigeons}`;
  }

  function fitToScreen() {
    baseScale = Math.min(canvasW / SCENE_W, canvasH / SCENE_H);
    zoom = 1.0;
    panX = (canvasW - SCENE_W * baseScale) / 2;
    panY = (canvasH - SCENE_H * baseScale) / 2;
  }

  function resizeCanvas() {
    if (!canvas) return;
    canvasW = canvas.width = window.innerWidth;
    canvasH = canvas.height = window.innerHeight;
    fitToScreen();
  }

  // ==========================================================================
  // FEATHER PARTICLE & FLOATING SCORE FX
  // ==========================================================================
  function spawnFeatherBurst(cx, cy) {
    const count = 14;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 4.5 + 2.0;
      featherParticles.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2.5,
        rot: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.2,
        scale: Math.random() * 0.4 + 0.35,
        alpha: 1.0,
        color: i % 2 === 0 ? '#eceff1' : '#b0bec5'
      });
    }
  }

  function spawnFloatingScore(cx, cy) {
    floatingFx.push({
      x: cx,
      y: cy - 10,
      vy: -2.0,
      alpha: 1.0,
      text: '+1 🕊️'
    });
  }

  function updateFloatingFx() {
    // Feathers
    for (let i = featherParticles.length - 1; i >= 0; i--) {
      const f = featherParticles[i];
      f.x += f.vx;
      f.y += f.vy;
      f.vy += 0.08; // gravity
      f.vx *= 0.98;
      f.rot += f.vRot;
      f.alpha -= 0.022;
      if (f.alpha <= 0) {
        featherParticles.splice(i, 1);
      }
    }

    // Floating text
    for (let i = floatingFx.length - 1; i >= 0; i--) {
      const fx = floatingFx[i];
      fx.y += fx.vy;
      fx.alpha -= 0.02;
      if (fx.alpha <= 0) {
        floatingFx.splice(i, 1);
      }
    }
  }

  function drawFloatingFx() {
    // Draw Feathers
    featherParticles.forEach(f => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, f.alpha);
      ctx.translate(f.x, f.y);
      ctx.rotate(f.rot);
      ctx.scale(f.scale, f.scale);

      // Feather shape
      ctx.fillStyle = f.color;
      ctx.beginPath();
      ctx.ellipse(0, 0, 8, 22, 0, 0, Math.PI * 2);
      ctx.fill();

      // Feather quill line
      ctx.strokeStyle = '#90a4ae';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(0, -22);
      ctx.lineTo(0, 22);
      ctx.stroke();

      ctx.restore();
    });

    // Draw Floating Text
    floatingFx.forEach(fx => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, fx.alpha);
      ctx.font = 'bold 22px Nunito, sans-serif';
      ctx.fillStyle = '#ffb300';
      ctx.strokeStyle = '#3e2723';
      ctx.lineWidth = 3;
      ctx.textAlign = 'center';
      ctx.strokeText(fx.text, fx.x, fx.y);
      ctx.fillText(fx.text, fx.x, fx.y);
      ctx.restore();
    });
  }

  // ==========================================================================
  // PIGEON RENDERING (Peeking out from behind obstacles)
  // ==========================================================================
  function drawPigeon(p, time) {
    if (p.disappeared) return;

    ctx.save();

    // If found, animate flying off & fading away
    if (p.found) {
      p.flyY -= p.flySpeed;
      p.flyX += p.flyDir;
      p.alpha -= 0.032;
      if (p.alpha <= 0) {
        p.alpha = 0;
        p.disappeared = true;
        ctx.restore();
        return;
      }
    }

    ctx.globalAlpha = p.alpha;
    ctx.translate(p.x + p.flyX, p.y + p.flyY);
    ctx.scale(p.scale * (p.flip ? -1 : 1), p.scale);

    // Natural head bob / gentle breathing motion
    const bob = Math.sin(time * 3.5 + p.id * 1.7) * 1.5;
    ctx.translate(0, bob);

    // Radar Hint Pulse Indicator
    if (activeHintPigeon && activeHintPigeon.id === p.id && !p.found) {
      const pulse = (Math.sin(time * 8) + 1) * 0.5;
      ctx.save();
      ctx.strokeStyle = `rgba(255, 193, 7, ${0.4 + pulse * 0.6})`;
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.arc(0, -10, 36 + pulse * 14, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = 'rgba(255, 235, 59, 0.2)';
      ctx.fill();
      ctx.restore();
    }

    // 1. Pigeon Tail Feathers (Peeking up behind)
    ctx.fillStyle = '#37474f';
    ctx.beginPath();
    ctx.moveTo(-16, 8);
    ctx.lineTo(-32, 14);
    ctx.lineTo(-30, 24);
    ctx.lineTo(-14, 18);
    ctx.closePath();
    ctx.fill();

    // 2. Pigeon Body Plump Oval
    ctx.fillStyle = '#78909c';
    ctx.strokeStyle = '#263238';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.ellipse(0, 10, 24, 18, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // 3. Iridescent Emerald / Purple Neck Sheen
    const neckGrad = ctx.createLinearGradient(4, -8, 16, 6);
    neckGrad.addColorStop(0, '#26a69a');
    neckGrad.addColorStop(0.5, '#ab47bc');
    neckGrad.addColorStop(1, '#00897b');
    ctx.fillStyle = neckGrad;
    ctx.beginPath();
    ctx.ellipse(8, 0, 10, 8, 0.25, 0, Math.PI * 2);
    ctx.fill();

    // 4. Pigeon Head & Cheek
    ctx.fillStyle = '#90a4ae';
    ctx.strokeStyle = '#263238';
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.arc(12, -10, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // 5. Expressive Cute Eye
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(17, -12, 4.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#212121';
    ctx.beginPath();
    ctx.arc(18, -12, 2.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(19, -13, 1.0, 0, Math.PI * 2);
    ctx.fill();

    // 6. Orange Beak
    ctx.fillStyle = '#ff9800';
    ctx.strokeStyle = '#e65100';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(24, -13);
    ctx.lineTo(34, -10);
    ctx.lineTo(24, -6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Cere (white wattle on top of beak)
    ctx.fillStyle = '#eceff1';
    ctx.beginPath();
    ctx.arc(24, -12, 2.2, 0, Math.PI * 2);
    ctx.fill();

    // 7. Wing (with animated flutter if flying or happy)
    ctx.save();
    let wingAngle = 0;
    if (p.found) {
      wingAngle = Math.sin(time * p.flapSpeed) * 0.7;
    }
    ctx.translate(-2, 8);
    ctx.rotate(wingAngle);
    ctx.fillStyle = '#607d8b';
    ctx.strokeStyle = '#263238';
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.ellipse(0, 0, 16, 10, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Wing stripe details
    ctx.strokeStyle = '#263238';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(-6, -2);
    ctx.lineTo(-4, 6);
    ctx.moveTo(2, -4);
    ctx.lineTo(4, 5);
    ctx.stroke();
    ctx.restore();

    // 8. Accessories
    if (p.accessory === 'crumb') {
      ctx.fillStyle = '#d7ccc8';
      ctx.beginPath();
      ctx.arc(36, -8, 2.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.accessory === 'beret') {
      ctx.fillStyle = '#c62828';
      ctx.beginPath();
      ctx.ellipse(12, -21, 10, 4.5, -0.15, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(11, -24, 2, 3);
    }

    ctx.restore();
  }

  // ==========================================================================
  // MULTI-LAYER SCENE RENDERING PIPELINE:
  // Layer 1: renderSceneBackground(theme)
  // Layer 2: drawPigeons(currentPigeons)
  // Layer 3: renderSceneForeground(theme) -> occludes bottom half of pigeons!
  // ==========================================================================

  // --- PASS 1: BACKGROUND SCENERY ---
  function renderSceneBackground(theme, time) {
    if (theme === 'park') {
      renderParkBackground(time);
    } else if (theme === 'river') {
      renderRiverBackground(time);
    } else if (theme === 'night') {
      renderNightBackground(time);
    } else if (theme === 'terrace') {
      renderTerraceBackground(time);
    } else {
      renderMarketBackground(time);
    }
  }

  // --- PASS 2: FOREGROUND OCCLUDERS (Draws over pigeons so they are partially hidden!) ---
  function renderSceneForeground(theme, time) {
    if (theme === 'park') {
      renderParkForeground(time);
    } else if (theme === 'river') {
      renderRiverForeground(time);
    } else if (theme === 'night') {
      renderNightForeground(time);
    } else if (theme === 'terrace') {
      renderTerraceForeground(time);
    } else {
      renderMarketForeground(time);
    }
  }

  // --------------------------------------------------------------------------
  // THEME 1: BEAUTIFUL GREEN PARK
  // --------------------------------------------------------------------------
  function renderParkBackground(time) {
    // Sky
    const skyGrad = ctx.createLinearGradient(0, 0, 0, 450);
    skyGrad.addColorStop(0, '#81d4fa');
    skyGrad.addColorStop(1, '#e1f5fe');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, SCENE_W, SCENE_H);

    // Sun with soft halo
    ctx.fillStyle = 'rgba(255, 241, 118, 0.35)';
    ctx.beginPath();
    ctx.arc(1080, 110, 75, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff59d';
    ctx.beginPath();
    ctx.arc(1080, 110, 42, 0, Math.PI * 2);
    ctx.fill();

    // Puffy Clouds
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    drawCloud(220, 90, 75);
    drawCloud(680, 110, 85);

    // Rolling Distant Hills
    ctx.fillStyle = '#a5d6a7';
    ctx.beginPath();
    ctx.moveTo(0, 420);
    ctx.bezierCurveTo(300, 360, 600, 440, SCENE_W, 380);
    ctx.lineTo(SCENE_W, SCENE_H);
    ctx.lineTo(0, SCENE_H);
    ctx.closePath();
    ctx.fill();

    // Lush Midground Lawn
    ctx.fillStyle = '#81c784';
    ctx.beginPath();
    ctx.moveTo(0, 460);
    ctx.bezierCurveTo(400, 420, 800, 480, SCENE_W, 440);
    ctx.lineTo(SCENE_W, SCENE_H);
    ctx.lineTo(0, SCENE_H);
    ctx.closePath();
    ctx.fill();

    // Foreground Main Park Lawn
    ctx.fillStyle = '#66bb6a';
    ctx.fillRect(0, 520, SCENE_W, SCENE_H - 520);

    // Cobblestone Park Pathway
    ctx.fillStyle = '#d7ccc8';
    ctx.beginPath();
    ctx.moveTo(480, 520);
    ctx.bezierCurveTo(540, 620, 510, 720, 440, SCENE_H);
    ctx.lineTo(600, SCENE_H);
    ctx.bezierCurveTo(660, 720, 650, 620, 600, 520);
    ctx.closePath();
    ctx.fill();

    // Tree Trunks (Bases behind leaves)
    ctx.fillStyle = '#5d4037';
    ctx.fillRect(135, 260, 32, 280);
    ctx.fillRect(1050, 280, 34, 260);

    // Gazebo Base / Pillars (Level 1/6)
    ctx.fillStyle = '#efebe9';
    ctx.fillRect(490, 260, 10, 160);
    ctx.fillRect(570, 260, 10, 160);
    ctx.beginPath();
    ctx.moveTo(460, 260);
    ctx.lineTo(535, 200);
    ctx.lineTo(610, 260);
    ctx.closePath();
    ctx.fillStyle = '#8d6e63';
    ctx.fill();

    // Fountain Pedestal & Water Jet (Background base)
    ctx.fillStyle = '#cfd8dc';
    ctx.fillRect(630, 420, 24, 70);
    // Water spray
    ctx.fillStyle = 'rgba(129, 212, 250, 0.65)';
    ctx.beginPath();
    ctx.arc(642, 380 + Math.sin(time * 6) * 4, 18, 0, Math.PI * 2);
    ctx.fill();
  }

  function renderParkForeground(time) {
    // 1. Tree Canopies (Partially hiding pigeons on tree-left & tree-right)
    ctx.fillStyle = '#388e3c';
    // Left Tree Foliage (Covers bottom of p3 x:145, y:220)
    drawFoliageCluster(150, 230, 80);
    // Right Tree Foliage (Covers bottom of p6 x:1060, y:240)
    drawFoliageCluster(1065, 250, 85);

    // 2. Stone Fountain Marble Rim (Covers bottom of p2 x:640, y:395)
    ctx.fillStyle = '#b0bec5';
    ctx.strokeStyle = '#546e7a';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(642, 420, 58, 22, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Translucent sparkling pool water
    ctx.fillStyle = 'rgba(79, 195, 247, 0.65)';
    ctx.beginPath();
    ctx.ellipse(642, 418, 52, 16, 0, 0, Math.PI * 2);
    ctx.fill();

    // 3. Park Benches (Slats covering pigeons at x:230, y:550 and x:995, y:530)
    drawParkBench(200, 560, 130);
    drawParkBench(960, 545, 120);

    // 4. Flowering Hedges & Bushes (Covers pigeons at x:440, y:510 and x:880, y:560)
    drawFlowerHedge(390, 525, 120, '#2e7d32', '#f06292');
    drawFlowerHedge(840, 570, 110, '#33691e', '#ba68c8');

    // 5. Flowerbed Foreground (Covers pigeon at x:740, y:680)
    drawFlowerHedge(700, 690, 140, '#1b5e20', '#ffeb3b');

    // 6. Birdbath (Covers pigeon at x:335, y:690)
    ctx.fillStyle = '#90a4ae';
    ctx.fillRect(332, 700, 14, 50);
    ctx.beginPath();
    ctx.ellipse(339, 700, 34, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  // --------------------------------------------------------------------------
  // THEME 2: RIVER / RIVERSIDE
  // --------------------------------------------------------------------------
  function renderRiverBackground(time) {
    // Sky
    const skyGrad = ctx.createLinearGradient(0, 0, 0, 420);
    skyGrad.addColorStop(0, '#4fc3f7');
    skyGrad.addColorStop(1, '#e0f7fa');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, SCENE_W, SCENE_H);

    drawCloud(190, 80, 70);
    drawCloud(740, 95, 80);

    // Distant Riverbank Green Shore
    ctx.fillStyle = '#a5d6a7';
    ctx.fillRect(0, 360, SCENE_W, 60);

    // Distant Arched Stone Bridge
    ctx.fillStyle = '#cfd8dc';
    ctx.fillRect(520, 330, 220, 50);
    ctx.beginPath();
    ctx.arc(630, 380, 45, Math.PI, 0);
    ctx.fillStyle = '#81d4fa';
    ctx.fill();

    // Flowing Sparkling River Water
    const riverGrad = ctx.createLinearGradient(0, 400, 0, SCENE_H);
    riverGrad.addColorStop(0, '#29b6f6');
    riverGrad.addColorStop(0.5, '#0288d1');
    riverGrad.addColorStop(1, '#01579b');
    ctx.fillStyle = riverGrad;
    ctx.fillRect(0, 400, SCENE_W, SCENE_H - 400);

    // Water Ripple Highlights
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 2.5;
    for (let r = 0; r < 8; r++) {
      const rx = (r * 180 + Math.sin(time * 2 + r) * 30) % SCENE_W;
      const ry = 430 + r * 35;
      ctx.beginPath();
      ctx.moveTo(rx, ry);
      ctx.lineTo(rx + 65, ry);
      ctx.stroke();
    }

    // Wooden Pier Deck Base (Piling posts extending down into water)
    ctx.fillStyle = '#4e342e';
    ctx.fillRect(720, 480, 16, 180);
    ctx.fillRect(860, 480, 16, 180);
    ctx.fillRect(980, 480, 16, 180);

    // Canoe Hull Base (Behind reeds & gunwale)
    ctx.fillStyle = '#8d6e63';
    ctx.beginPath();
    ctx.ellipse(470, 535, 75, 18, -0.05, 0, Math.PI * 2);
    ctx.fill();

    // Weeping Willow Trunk Base
    ctx.fillStyle = '#4e342e';
    ctx.fillRect(305, 260, 28, 220);
  }

  function renderRiverForeground(time) {
    // 1. Weeping Willow Draping Tendrils (Covers p5 x:320, y:240)
    ctx.fillStyle = '#689f38';
    drawWillowTendrils(320, 230, 110, time);

    // 2. Wooden Canoe Gunwale & Oar (Covers bottom of p2 x:480, y:520)
    ctx.fillStyle = '#6d4c41';
    ctx.strokeStyle = '#3e2723';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(400, 530);
    ctx.quadraticCurveTo(475, 545, 550, 530);
    ctx.quadraticCurveTo(475, 515, 400, 530);
    ctx.fill();
    ctx.stroke();

    // 3. Wooden Dock Deck & Railing (Covers p3 x:770, y:460 and p4 x:920, y:540)
    ctx.fillStyle = '#8d6e63';
    ctx.fillRect(700, 475, 320, 22);
    ctx.strokeStyle = '#3e2723';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(700, 475, 320, 22);

    // Pier handrail posts
    for (let p = 0; p < 5; p++) {
      ctx.fillRect(710 + p * 72, 440, 10, 40);
    }
    ctx.fillRect(700, 440, 320, 10);

    // 4. River Reeds & Cattails (Covers pigeons at x:180, y:580 and x:1100, y:600)
    drawCattailReeds(150, 600, 14);
    drawCattailReeds(1070, 615, 16);

    // 5. Riverbank Cobblestones & Water Lily (Covers p10 x:140, y:700 and p11 x:670, y:660)
    drawRiverbankStones(100, 715, 120);
    drawWaterLilyPad(670, 675, 45);
  }

  // --------------------------------------------------------------------------
  // THEME 3: DARK NIGHT ENVIRONMENT (Moon, Twinkling Stars, Lit Windows)
  // --------------------------------------------------------------------------
  function renderNightBackground(time) {
    // Deep Indigo Midnight Sky Gradient
    const nightGrad = ctx.createLinearGradient(0, 0, 0, SCENE_H);
    nightGrad.addColorStop(0, '#0a0e27');
    nightGrad.addColorStop(0.5, '#141b41');
    nightGrad.addColorStop(1, '#232954');
    ctx.fillStyle = nightGrad;
    ctx.fillRect(0, 0, SCENE_W, SCENE_H);

    // Twinkling Stars
    ctx.fillStyle = '#ffffff';
    for (let s = 0; s < 45; s++) {
      const sx = (s * 137 + 50) % SCENE_W;
      const sy = (s * 89 + 30) % 360;
      const twinkle = (Math.sin(time * 3 + s) + 1) * 0.5;
      ctx.globalAlpha = 0.3 + twinkle * 0.7;
      ctx.beginPath();
      ctx.arc(sx, sy, 1.2 + (s % 3 === 0 ? 1.0 : 0), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;

    // Glowing Full Moon with Soft Crater Details & Luminous Aura
    ctx.fillStyle = 'rgba(255, 249, 196, 0.15)';
    ctx.beginPath();
    ctx.arc(220, 110, 65, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#fffde7';
    ctx.beginPath();
    ctx.arc(220, 110, 44, 0, Math.PI * 2);
    ctx.fill();

    // Moon craters
    ctx.fillStyle = 'rgba(230, 238, 156, 0.4)';
    ctx.beginPath();
    ctx.arc(205, 100, 9, 0, Math.PI * 2);
    ctx.arc(235, 122, 12, 0, Math.PI * 2);
    ctx.arc(225, 95, 6, 0, Math.PI * 2);
    ctx.fill();

    // Distant Dark City Rooftop Silhouettes
    ctx.fillStyle = '#1c213a';
    ctx.fillRect(80, 260, 180, 500);
    ctx.fillRect(380, 320, 220, 480);
    ctx.fillRect(680, 220, 190, 580);
    ctx.fillRect(940, 300, 260, 500);

    // Clock Tower Spire
    ctx.beginPath();
    ctx.moveTo(1070, 300);
    ctx.lineTo(1130, 160);
    ctx.lineTo(1190, 300);
    ctx.closePath();
    ctx.fillStyle = '#141829';
    ctx.fill();
  }

  function renderNightForeground(time) {
    // 1. Brick Chimneys (Occluding pigeons at x:210, y:240 and x:730, y:190)
    drawChimneyPot(190, 245, 52, 60);
    drawChimneyPot(710, 195, 50, 70);

    // 2. Glowing Lit Windows & Dormers (Occluding pigeons at x:490, y:310 and x:980, y:280)
    drawDormerWindow(460, 315, 75, 80, true);
    drawDormerWindow(950, 285, 75, 75, true);

    // 3. Mansard Roof Slate Ridges & Balustrade (Occluding pigeons at x:340, y:470 and x:620, y:450)
    drawRoofBalustrade(300, 480, 160);
    drawRoofBalustrade(580, 460, 140);

    // 4. Street Lantern with Warm Cone of Light (Occluding p9 x:160, y:670)
    drawStreetLantern(140, 680, time);

    // 5. Stone Steps & Ivy Wall (Occluding p10 x:470, y:650 and p11 x:810, y:680)
    ctx.fillStyle = '#263238';
    ctx.fillRect(430, 665, 110, 30);
    drawIvyClump(790, 690, 90);
  }

  // --------------------------------------------------------------------------
  // THEME 4: MEDITERRANEAN TERRACE
  // --------------------------------------------------------------------------
  function renderTerraceBackground(time) {
    // Golden Hour Sunset Sky
    const sunsetGrad = ctx.createLinearGradient(0, 0, 0, 420);
    sunsetGrad.addColorStop(0, '#ff8a65');
    sunsetGrad.addColorStop(0.5, '#ffb74d');
    sunsetGrad.addColorStop(1, '#fff9c4');
    ctx.fillStyle = sunsetGrad;
    ctx.fillRect(0, 0, SCENE_W, SCENE_H);

    // Terracotta Villa Facade Walls
    ctx.fillStyle = '#ffccbc';
    ctx.fillRect(100, 260, 340, 500);
    ctx.fillRect(620, 240, 420, 520);

    // Terracotta Tiled Roof Eaves
    drawTileRoof(80, 250, 380, '#d84315');
    drawTileRoof(600, 230, 460, '#bf360c');

    // Stone Terrace Floor
    ctx.fillStyle = '#ffe0b2';
    ctx.fillRect(0, 580, SCENE_W, SCENE_H - 580);
  }

  function renderTerraceForeground(time) {
    // 1. Pergola Wooden Beams & Hanging Grape Ivy (Covers p1 x:160, y:280)
    drawPergolaBeams(120, 285, 140);

    // 2. Rustic Wooden Shutters (Covers p2 x:390, y:350 and p4 x:890, y:340)
    drawWindowShutters(360, 355, 75, 75);
    drawWindowShutters(860, 345, 75, 75);

    // 3. Wrought Iron Balcony Railing (Covers p6 x:230, y:520)
    drawBalconyRailing(180, 530, 150);

    // 4. Terracotta Potted Lemon / Olive Trees (Covers p7 x:510, y:560 and p9 x:1020, y:530)
    drawPottedPlant(480, 570, 70, '#fbc02d'); // lemon
    drawPottedPlant(990, 540, 70, '#558b2f'); // olive

    // 5. Terracotta Bench & Sun Lounger (Covers p10 x:110, y:680 and p13 x:960, y:670)
    drawTerracottaBench(80, 690, 110);
    drawTerracottaBench(920, 680, 110);
  }

  // --------------------------------------------------------------------------
  // THEME 5: OLD TOWN MARKET SQUARE
  // --------------------------------------------------------------------------
  function renderMarketBackground(time) {
    // Sky
    const skyGrad = ctx.createLinearGradient(0, 0, 0, 400);
    skyGrad.addColorStop(0, '#b39ddb');
    skyGrad.addColorStop(1, '#ede7f6');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, SCENE_W, SCENE_H);

    drawCloud(240, 90, 75);
    drawCloud(800, 100, 80);

    // Medieval Town Houses Base
    ctx.fillStyle = '#d7ccc8';
    ctx.fillRect(80, 240, 320, 500);
    ctx.fillRect(560, 220, 240, 520);
    ctx.fillRect(880, 250, 320, 490);

    // Cobblestone Square
    ctx.fillStyle = '#bcaaa4';
    ctx.fillRect(0, 560, SCENE_W, SCENE_H - 560);

    // Clock Dial on Central Town Hall
    ctx.fillStyle = '#fff9c4';
    ctx.strokeStyle = '#3e2723';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(680, 220, 32, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  function renderMarketForeground(time) {
    // 1. Striped Market Awnings (Covers p1 x:140, y:260 and p4 x:820, y:270)
    drawStripedAwning(100, 265, 140, '#e53935', '#ffffff');
    drawStripedAwning(780, 275, 140, '#1e88e5', '#ffffff');

    // 2. Wooden Fruit & Apple Crates (Covers p2 x:370, y:340 and p7 x:460, y:480)
    drawFruitCrate(340, 345, 80, '#d32f2f'); // apples
    drawFruitCrate(430, 485, 80, '#fbc02d'); // oranges

    // 3. Wooden Oak Barrels (Covers p6 x:220, y:500 and p10 x:1140, y:510)
    drawBarrel(195, 510, 60, 70);
    drawBarrel(1115, 520, 60, 70);

    // 4. Old Market Cart Wheel & Bakery Cart (Covers p11 x:120, y:680 and p13 x:670, y:670)
    drawCartWheel(115, 695, 45);
    drawBakeryCart(640, 680, 110);
  }

  // ==========================================================================
  // SHARED PROCEDURAL VECTOR DRAWING HELPERS
  // ==========================================================================
  function drawCloud(cx, cy, r) {
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.5, 0, Math.PI * 2);
    ctx.arc(cx + r * 0.4, cy - r * 0.15, r * 0.45, 0, Math.PI * 2);
    ctx.arc(cx + r * 0.8, cy, r * 0.4, 0, Math.PI * 2);
    ctx.arc(cx + r * 0.35, cy + r * 0.1, r * 0.4, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawFoliageCluster(cx, cy, r) {
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.6, 0, Math.PI * 2);
    ctx.arc(cx - r * 0.35, cy - r * 0.2, r * 0.5, 0, Math.PI * 2);
    ctx.arc(cx + r * 0.35, cy - r * 0.2, r * 0.5, 0, Math.PI * 2);
    ctx.arc(cx - r * 0.3, cy + r * 0.25, r * 0.45, 0, Math.PI * 2);
    ctx.arc(cx + r * 0.3, cy + r * 0.25, r * 0.45, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawParkBench(bx, by, bw) {
    ctx.fillStyle = '#5d4037';
    ctx.strokeStyle = '#3e2723';
    ctx.lineWidth = 2.5;
    // Backrest slats (occluding pigeon body)
    ctx.fillRect(bx, by - 24, bw, 10);
    ctx.strokeRect(bx, by - 24, bw, 10);
    ctx.fillRect(bx, by - 10, bw, 10);
    ctx.strokeRect(bx, by - 10, bw, 10);
    // Bench seat
    ctx.fillRect(bx - 6, by + 4, bw + 12, 12);
    ctx.strokeRect(bx - 6, by + 4, bw + 12, 12);
    // Cast iron legs
    ctx.fillStyle = '#263238';
    ctx.fillRect(bx + 10, by + 16, 8, 28);
    ctx.fillRect(bx + bw - 18, by + 16, 8, 28);
  }

  function drawFlowerHedge(hx, hy, hw, leafColor, flowerColor) {
    ctx.fillStyle = leafColor;
    ctx.beginPath();
    ctx.ellipse(hx + hw / 2, hy, hw / 2, 28, 0, 0, Math.PI * 2);
    ctx.fill();

    // Little flowers
    ctx.fillStyle = flowerColor;
    for (let f = 0; f < 6; f++) {
      ctx.beginPath();
      ctx.arc(hx + 15 + f * 18, hy - 6 + (f % 2 === 0 ? 8 : -4), 4.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawCattailReeds(rx, ry, count) {
    ctx.lineWidth = 2.5;
    for (let i = 0; i < count; i++) {
      const x = rx + i * 8;
      const h = 55 + (i % 4) * 12;
      // Stem
      ctx.strokeStyle = '#33691e';
      ctx.beginPath();
      ctx.moveTo(x, ry);
      ctx.quadraticCurveTo(x + (i % 2 === 0 ? 6 : -6), ry - h / 2, x, ry - h);
      ctx.stroke();

      // Brown cattail sausage top
      ctx.fillStyle = '#4e342e';
      ctx.fillRect(x - 2.5, ry - h, 5, 20);
    }
  }

  function drawWillowTendrils(wx, wy, count, time) {
    ctx.strokeStyle = '#7cb342';
    ctx.lineWidth = 2.0;
    for (let i = 0; i < 9; i++) {
      const x = wx - 40 + i * 14;
      const sway = Math.sin(time * 2.5 + i) * 8;
      ctx.beginPath();
      ctx.moveTo(x, wy);
      ctx.quadraticCurveTo(x + sway, wy + 45, x + sway * 1.5, wy + 90);
      ctx.stroke();
    }
  }

  function drawRiverbankStones(sx, sy, sw) {
    ctx.fillStyle = '#78909c';
    ctx.strokeStyle = '#37474f';
    ctx.lineWidth = 2;
    for (let s = 0; s < 5; s++) {
      ctx.beginPath();
      ctx.ellipse(sx + s * 24, sy, 16, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  }

  function drawWaterLilyPad(lx, ly, lr) {
    ctx.fillStyle = '#2e7d32';
    ctx.beginPath();
    ctx.arc(lx, ly, lr, 0.3, Math.PI * 2);
    ctx.lineTo(lx, ly);
    ctx.closePath();
    ctx.fill();

    // Lotus flower
    ctx.fillStyle = '#f48fb1';
    ctx.beginPath();
    ctx.arc(lx, ly - 4, 10, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawChimneyPot(cx, cy, cw, ch) {
    ctx.fillStyle = '#8d6e63';
    ctx.strokeStyle = '#4e342e';
    ctx.lineWidth = 2.5;
    ctx.fillRect(cx, cy, cw, ch);
    ctx.strokeRect(cx, cy, cw, ch);

    // Brick mortar lines
    ctx.strokeStyle = '#bcaaa4';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(cx, cy + 20);
    ctx.lineTo(cx + cw, cy + 20);
    ctx.moveTo(cx, cy + 40);
    ctx.lineTo(cx + cw, cy + 40);
    ctx.stroke();

    // Chimney pot rim
    ctx.fillStyle = '#6d4c41';
    ctx.fillRect(cx - 5, cy - 6, cw + 10, 8);
    ctx.strokeRect(cx - 5, cy - 6, cw + 10, 8);
  }

  function drawDormerWindow(wx, wy, ww, wh, glowing) {
    ctx.fillStyle = '#37474f';
    ctx.fillRect(wx, wy, ww, wh);

    // Glowing warm glass
    ctx.fillStyle = glowing ? '#fff59d' : '#90a4ae';
    ctx.fillRect(wx + 8, wy + 8, ww - 16, wh - 16);

    // Window muntin frame
    ctx.strokeStyle = '#37474f';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(wx + ww / 2, wy + 8);
    ctx.lineTo(wx + ww / 2, wy + wh - 8);
    ctx.moveTo(wx + 8, wy + wh / 2);
    ctx.lineTo(wx + ww - 8, wy + wh / 2);
    ctx.stroke();

    // Window sill
    ctx.fillStyle = '#78909c';
    ctx.fillRect(wx - 4, wy + wh - 4, ww + 8, 8);
  }

  function drawRoofBalustrade(bx, by, bw) {
    ctx.fillStyle = '#455a64';
    ctx.fillRect(bx, by, bw, 8);
    for (let i = 0; i < 7; i++) {
      ctx.fillRect(bx + i * (bw / 6), by - 18, 6, 18);
    }
    ctx.fillRect(bx, by - 22, bw, 6);
  }

  function drawStreetLantern(lx, ly, time) {
    // Warm luminous light cone
    const coneGrad = ctx.createRadialGradient(lx + 15, ly - 30, 5, lx + 15, ly - 30, 85);
    coneGrad.addColorStop(0, 'rgba(255, 238, 88, 0.45)');
    coneGrad.addColorStop(1, 'rgba(255, 238, 88, 0)');
    ctx.fillStyle = coneGrad;
    ctx.beginPath();
    ctx.arc(lx + 15, ly - 30, 85, 0, Math.PI * 2);
    ctx.fill();

    // Cast iron lantern pole
    ctx.fillStyle = '#263238';
    ctx.fillRect(lx + 12, ly - 20, 8, 70);
    // Lantern cage
    ctx.strokeRect(lx + 4, ly - 45, 24, 25);
    ctx.fillStyle = '#fff59d';
    ctx.fillRect(lx + 6, ly - 43, 20, 21);
  }

  function drawIvyClump(ix, iy, iw) {
    ctx.fillStyle = '#1b5e20';
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.arc(ix + i * 18, iy, 14, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawTileRoof(rx, ry, rw, tileColor) {
    ctx.fillStyle = tileColor;
    ctx.fillRect(rx, ry, rw, 14);
    ctx.strokeStyle = '#3e2723';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < rw; i += 20) {
      ctx.beginPath();
      ctx.arc(rx + i + 10, ry + 14, 10, Math.PI, 0);
      ctx.stroke();
    }
  }

  function drawPergolaBeams(px, py, pw) {
    ctx.fillStyle = '#5d4037';
    ctx.fillRect(px, py, pw, 12);
    // Hanging ivy vine leaves
    ctx.fillStyle = '#33691e';
    for (let v = 0; v < 6; v++) {
      ctx.beginPath();
      ctx.ellipse(px + 15 + v * 22, py + 14, 8, 14, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawWindowShutters(sx, sy, sw, sh) {
    ctx.fillStyle = '#0277bd';
    ctx.strokeStyle = '#01579b';
    ctx.lineWidth = 2;
    // Left Shutter
    ctx.fillRect(sx - 18, sy, 18, sh);
    ctx.strokeRect(sx - 18, sy, 18, sh);
    // Right Shutter
    ctx.fillRect(sx + sw, sy, 18, sh);
    ctx.strokeRect(sx + sw, sy, 18, sh);
    // Flower box at window bottom
    ctx.fillStyle = '#8d6e63';
    ctx.fillRect(sx - 10, sy + sh - 8, sw + 20, 14);
    // Flowers
    ctx.fillStyle = '#e91e63';
    for (let f = 0; f < 5; f++) {
      ctx.beginPath();
      ctx.arc(sx + f * 18, sy + sh - 10, 5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawBalconyRailing(rx, ry, rw) {
    ctx.fillStyle = '#263238';
    ctx.fillRect(rx, ry, rw, 8);
    for (let i = 0; i < 8; i++) {
      ctx.fillRect(rx + i * (rw / 7), ry + 8, 6, 24);
    }
    ctx.fillRect(rx, ry + 32, rw, 8);
  }

  function drawPottedPlant(px, py, pw, fruitColor) {
    // Terracotta Pot
    ctx.fillStyle = '#d84315';
    ctx.strokeStyle = '#bf360c';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(px + 10, py);
    ctx.lineTo(px + pw - 10, py);
    ctx.lineTo(px + pw - 16, py + 45);
    ctx.lineTo(px + 16, py + 45);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Bush foliage
    ctx.fillStyle = '#2e7d32';
    ctx.beginPath();
    ctx.arc(px + pw / 2, py - 15, pw * 0.45, 0, Math.PI * 2);
    ctx.fill();

    // Little lemons or olives
    ctx.fillStyle = fruitColor;
    ctx.beginPath();
    ctx.arc(px + pw * 0.35, py - 20, 5, 0, Math.PI * 2);
    ctx.arc(px + pw * 0.65, py - 12, 5, 0, Math.PI * 2);
    ctx.arc(px + pw * 0.50, py - 5, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawTerracottaBench(tx, ty, tw) {
    ctx.fillStyle = '#d84315';
    ctx.strokeStyle = '#bf360c';
    ctx.lineWidth = 2;
    ctx.fillRect(tx, ty, tw, 14);
    ctx.strokeRect(tx, ty, tw, 14);
    ctx.fillRect(tx + 8, ty + 14, 16, 20);
    ctx.fillRect(tx + tw - 24, ty + 14, 16, 20);
  }

  function drawStripedAwning(ax, ay, aw, color1, color2) {
    const stripes = 6;
    const stripeW = aw / stripes;
    for (let s = 0; s < stripes; s++) {
      ctx.fillStyle = s % 2 === 0 ? color1 : color2;
      ctx.fillRect(ax + s * stripeW, ay, stripeW, 28);

      // Scalloped bottom fringe
      ctx.beginPath();
      ctx.arc(ax + s * stripeW + stripeW / 2, ay + 28, stripeW / 2, 0, Math.PI);
      ctx.fill();
    }
  }

  function drawFruitCrate(cx, cy, cw, fruitColor) {
    ctx.fillStyle = '#8d6e63';
    ctx.strokeStyle = '#4e342e';
    ctx.lineWidth = 2;
    ctx.fillRect(cx, cy, cw, 34);
    ctx.strokeRect(cx, cy, cw, 34);

    // Fruit heaps overflowing
    ctx.fillStyle = fruitColor;
    for (let f = 0; f < 5; f++) {
      ctx.beginPath();
      ctx.arc(cx + 10 + f * 14, cy - 2, 7, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawBarrel(bx, by, bw, bh) {
    ctx.fillStyle = '#5d4037';
    ctx.strokeStyle = '#3e2723';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(bx + bw / 2, by + bh / 2, bw / 2, bh / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Iron hoops
    ctx.strokeStyle = '#78909c';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(bx + 4, by + 16);
    ctx.lineTo(bx + bw - 4, by + 16);
    ctx.moveTo(bx + 4, by + bh - 16);
    ctx.lineTo(bx + bw - 4, by + bh - 16);
    ctx.stroke();
  }

  function drawCartWheel(wx, wy, wr) {
    ctx.strokeStyle = '#4e342e';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(wx, wy, wr, 0, Math.PI * 2);
    ctx.stroke();

    // Spokes
    ctx.lineWidth = 2.5;
    for (let a = 0; a < 6; a++) {
      const ang = (a * Math.PI) / 3;
      ctx.beginPath();
      ctx.moveTo(wx, wy);
      ctx.lineTo(wx + Math.cos(ang) * wr, wy + Math.sin(ang) * wr);
      ctx.stroke();
    }
  }

  function drawBakeryCart(cx, cy, cw) {
    ctx.fillStyle = '#d7ccc8';
    ctx.fillRect(cx, cy, cw, 30);
    ctx.strokeStyle = '#5d4037';
    ctx.lineWidth = 2;
    ctx.strokeRect(cx, cy, cw, 30);

    // Bread loaves & Croissants
    ctx.fillStyle = '#ffb74d';
    for (let b = 0; b < 4; b++) {
      ctx.beginPath();
      ctx.ellipse(cx + 15 + b * 24, cy - 4, 12, 6, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // ==========================================================================
  // CLICK DETECTION & PIGEON DISCOVERY
  // ==========================================================================
  function handlePointerDown(e) {
    isDragging = true;
    hasMoved = false;
    startDragX = e.clientX;
    startDragY = e.clientY;
  }

  function handlePointerMove(e) {
    if (!isDragging) return;
    const dx = e.clientX - startDragX;
    const dy = e.clientY - startDragY;
    if (Math.hypot(dx, dy) > 6) {
      hasMoved = true;
      panX += dx;
      panY += dy;
      startDragX = e.clientX;
      startDragY = e.clientY;
      clampPan();
    }
  }

  function handlePointerUp(e) {
    if (!isDragging) return;
    isDragging = false;

    // If dragged/panned, do not trigger click
    if (hasMoved) return;

    // Convert Screen Coords to World Scene Coords
    const totalScale = baseScale * zoom;
    const rect = canvas.getBoundingClientRect();
    const canvasClickX = e.clientX - rect.left;
    const canvasClickY = e.clientY - rect.top;
    const worldX = (canvasClickX - panX) / totalScale;
    const worldY = (canvasClickY - panY) / totalScale;

    checkPigeonClick(worldX, worldY);
  }

  // Expose helpers for tests/diagnostics
  window.checkPigeonClick = checkPigeonClick;
  window.findPigeonById = function (id) {
    const p = currentPigeons.find(x => x.id === id);
    if (p) return checkPigeonClick(p.x, p.y);
    return false;
  };
  window.loadLevel = loadLevel;
  window.getCurrentLevel = () => LEVELS[currentLevelIdx];
  window.getCurrentPigeons = () => currentPigeons;

  function clampPan() {
    const totalScale = baseScale * zoom;
    const curW = SCENE_W * totalScale;
    const curH = SCENE_H * totalScale;

    // Generous panning limits so player can inspect any corner
    const minX = canvasW - curW - 200;
    const maxX = 200;
    const minY = canvasH - curH - 200;
    const maxY = 200;

    panX = Math.max(minX, Math.min(maxX, panX));
    panY = Math.max(minY, Math.min(maxY, panY));
  }

  function checkPigeonClick(wx, wy) {
    // Search unfound pigeons from front to back
    for (let i = currentPigeons.length - 1; i >= 0; i--) {
      const p = currentPigeons[i];
      if (p.found || p.disappeared) continue;

      // Generous hitbox (48 * scale) so clicking peeking head/beak registers perfectly!
      const radius = 48 * p.scale;
      const dist = Math.hypot(wx - p.x, wy - (p.y - 6)); // target slightly higher toward head

      if (dist <= radius) {
        // PIGEON FOUND!
        p.found = true;
        p.popAnim = 1.0;
        foundPigeonsCount++;

        // SFX: Coo + finding chime
        AudioEngine.playCoo();
        AudioEngine.playChime();

        // Spawn Feather Particles and Floating Score
        spawnFeatherBurst(p.x, p.y);
        spawnFloatingScore(p.x, p.y);

        // Update Pigeon Counter HUD
        updateHUD();

        // Clear active hint if this pigeon was hinted
        if (activeHintPigeon && activeHintPigeon.id === p.id) {
          activeHintPigeon = null;
        }

        // Check Level Win Condition
        const level = LEVELS[currentLevelIdx];
        if (foundPigeonsCount >= level.totalPigeons) {
          setTimeout(handleLevelWin, 750);
        }
        return true;
      }
    }
    return false;
  }

  // ==========================================================================
  // LEVEL COMPLETE & WIN SCREEN
  // ==========================================================================
  function handleLevelWin() {
    AudioEngine.playVictory();
    Confetti.launch(110);

    const elapsedSeconds = Math.round((Date.now() - levelStartTime) / 1000);
    const level = LEVELS[currentLevelIdx];

    // Calculate 3-star rating
    let stars = 3;
    if (elapsedSeconds > 90) stars = 1;
    else if (elapsedSeconds > 45) stars = 2;

    levelProgress[currentLevelIdx] = Math.max(levelProgress[currentLevelIdx] || 0, stars);
    localStorage.setItem('hp_level_stars', JSON.stringify(levelProgress));

    // Unlock next level
    let unlocked = parseInt(localStorage.getItem('hp_unlocked') || '1', 10);
    if (currentLevelIdx + 2 > unlocked) {
      unlocked = currentLevelIdx + 2;
      localStorage.setItem('hp_unlocked', unlocked.toString());
    }

    // Populate Win Modal
    const winModal = document.getElementById('winModal');
    const winStars = document.getElementById('winStars');
    const winTime = document.getElementById('winTime');
    const winPigeons = document.getElementById('winPigeons');

    if (winTime) winTime.textContent = `${elapsedSeconds}s`;
    if (winPigeons) winPigeons.textContent = `${level.totalPigeons} / ${level.totalPigeons}`;

    if (winStars) {
      winStars.innerHTML = '';
      for (let s = 1; s <= 3; s++) {
        const span = document.createElement('span');
        span.className = 'win-star-item' + (s <= stars ? ' active' : '');
        span.textContent = '⭐';
        span.style.animationDelay = `${(s - 1) * 0.18}s`;
        winStars.appendChild(span);
      }
    }

    if (winModal) {
      winModal.classList.remove('hidden');
    }
  }

  // ==========================================================================
  // HINT SYSTEM (Finds one hidden pigeon with gentle radar pulse)
  // ==========================================================================
  function triggerHint() {
    if (hintCooldown) return;
    const unfound = currentPigeons.filter(p => !p.found && !p.disappeared);
    if (unfound.length === 0) return;

    AudioEngine.playHint();
    hintCooldown = true;

    // Pick random unfound pigeon
    activeHintPigeon = unfound[Math.floor(Math.random() * unfound.length)];

    // Pan camera smoothly to center on the pigeon
    const totalScale = baseScale * zoom;
    panX = canvasW / 2 - activeHintPigeon.x * totalScale;
    panY = canvasH / 2 - activeHintPigeon.y * totalScale;
    clampPan();

    // 12-second Cooldown indicator fill
    const hintFill = document.getElementById('hintCooldownFill');
    if (hintFill) {
      hintFill.style.transform = 'scaleY(1)';
      let cd = 12;
      const interval = setInterval(() => {
        cd -= 0.1;
        hintFill.style.transform = `scaleY(${Math.max(0, cd / 12)})`;
        if (cd <= 0) {
          clearInterval(interval);
          hintCooldown = false;
          hintFill.style.transform = 'scaleY(0)';
        }
      }, 100);
    }
  }

  // ==========================================================================
  // MAIN RENDER LOOP
  // ==========================================================================
  function render(timestamp) {
    const time = timestamp * 0.001;

    ctx.clearRect(0, 0, canvasW, canvasH);

    ctx.save();
    ctx.translate(panX, panY);
    const totalScale = baseScale * zoom;
    ctx.scale(totalScale, totalScale);

    const level = LEVELS[currentLevelIdx];

    // PASS 1: Illustrated Scenic Background
    renderSceneBackground(level.theme, time);

    // PASS 2: Interactive Pigeons (Drawn behind foreground elements!)
    currentPigeons.forEach(p => {
      drawPigeon(p, time);
    });

    // PASS 3: Foreground Occluders (Drawn ON TOP of pigeons so they are partially hidden!)
    renderSceneForeground(level.theme, time);

    // PASS 4: Floating Particles (Feathers & Floating text)
    updateFloatingFx();
    drawFloatingFx();

    ctx.restore();

    requestAnimationFrame(render);
  }

  // ==========================================================================
  // FULLSCREEN ENGINE
  // ==========================================================================
  function isFullscreen() {
    return !!(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement);
  }

  function toggleFullscreen() {
    try {
      if (isFullscreen()) {
        const exitFn = document.exitFullscreen || document.webkitExitFullscreen || document.mozCancelFullScreen || document.msExitFullscreen;
        if (exitFn) exitFn.call(document);
      } else {
        const docEl = document.documentElement;
        const reqFn = docEl.requestFullscreen || docEl.webkitRequestFullscreen || docEl.mozRequestFullScreen || docEl.msRequestFullscreen;
        if (reqFn) {
          reqFn.call(docEl, { navigationUI: 'hide' }).catch(() => {});
        }
      }
    } catch (e) {
      console.warn('Fullscreen not supported:', e);
    }
  }

  function updateFullscreenUI() {
    const full = isFullscreen();
    const icon = document.getElementById('fsIcon');
    if (icon) icon.textContent = full ? '🗗' : '⛶';
  }

  document.addEventListener('fullscreenchange', updateFullscreenUI);
  document.addEventListener('webkitfullscreenchange', updateFullscreenUI);

  // ==========================================================================
  // UI EVENT BINDINGS & SCREEN NAVIGATION
  // ==========================================================================
  function bindEvents() {
    // Canvas Pointer events
    canvas.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    // Wheel Zoom
    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const zoomDelta = e.deltaY < 0 ? 0.12 : -0.12;
      setZoom(zoom + zoomDelta, e.clientX, e.clientY);
    }, { passive: false });

    // HUD Buttons
    const btnHome = document.getElementById('btnHome');
    if (btnHome) {
      btnHome.addEventListener('click', () => {
        AudioEngine.playClick();
        const exitModal = document.getElementById('exitModal') || document.getElementById('homeModal');
        if (exitModal) exitModal.classList.remove('hidden');
      });
    }

    const btnHint = document.getElementById('btnHint');
    if (btnHint) {
      btnHint.addEventListener('click', () => {
        triggerHint();
      });
    }

    const btnSettings = document.getElementById('btnSettings');
    if (btnSettings) {
      btnSettings.addEventListener('click', () => {
        AudioEngine.playClick();
        openSettingsModal();
      });
    }

    const btnFullscreen = document.getElementById('btnFullscreen');
    if (btnFullscreen) {
      btnFullscreen.addEventListener('click', () => {
        AudioEngine.playClick();
        toggleFullscreen();
      });
    }

    // Zoom HUD Controls
    const btnZoomIn = document.getElementById('btnZoomIn');
    if (btnZoomIn) {
      btnZoomIn.addEventListener('click', () => {
        AudioEngine.playClick();
        setZoom(zoom + 0.25, canvasW / 2, canvasH / 2);
      });
    }

    const btnZoomOut = document.getElementById('btnZoomOut');
    if (btnZoomOut) {
      btnZoomOut.addEventListener('click', () => {
        AudioEngine.playClick();
        setZoom(zoom - 0.25, canvasW / 2, canvasH / 2);
      });
    }

    const btnZoomFit = document.getElementById('btnZoomFit');
    if (btnZoomFit) {
      btnZoomFit.addEventListener('click', () => {
        AudioEngine.playClick();
        fitToScreen();
      });
    }

    // Main Menu Buttons
    const btnPlay = document.getElementById('btnPlay');
    if (btnPlay) {
      btnPlay.addEventListener('click', () => {
        AudioEngine.playClick();
        const menuScreen = document.getElementById('menuScreen');
        if (menuScreen) menuScreen.classList.add('hidden');
        loadLevel(currentLevelIdx);
      });
    }

    const btnLevels = document.getElementById('btnLevels');
    if (btnLevels) {
      btnLevels.addEventListener('click', () => {
        AudioEngine.playClick();
        openLevelSelectModal();
      });
    }

    const btnHowToPlay = document.getElementById('btnHowToPlay');
    if (btnHowToPlay) {
      btnHowToPlay.addEventListener('click', () => {
        AudioEngine.playClick();
        const howToModal = document.getElementById('howToModal');
        if (howToModal) howToModal.classList.remove('hidden');
      });
    }

    const btnMenuSettings = document.getElementById('btnMenuSettings');
    if (btnMenuSettings) {
      btnMenuSettings.addEventListener('click', () => {
        AudioEngine.playClick();
        openSettingsModal();
      });
    }

    // Modals Close & Action buttons
    setupModals();
  }

  function setZoom(newZoom, focalX, focalY) {
    const oldZoom = zoom;
    zoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newZoom));

    // Zoom toward focal point
    const scaleRatio = zoom / oldZoom;
    panX = focalX - (focalX - panX) * scaleRatio;
    panY = focalY - (focalY - panY) * scaleRatio;

    clampPan();
  }

  function setupModals() {
    // Settings Modal
    const btnCloseSettings = document.getElementById('btnCloseSettings');
    const settingsModal = document.getElementById('settingsModal');
    const toggleSfx = document.getElementById('toggleSfx');
    const toggleMusic = document.getElementById('toggleMusic');

    if (btnCloseSettings && settingsModal) {
      btnCloseSettings.addEventListener('click', () => {
        AudioEngine.playClick();
        settingsModal.classList.add('hidden');
      });
    }

    if (toggleSfx) {
      toggleSfx.checked = AudioEngine.isSfxOn();
      toggleSfx.addEventListener('change', () => {
        AudioEngine.setSfx(toggleSfx.checked);
        AudioEngine.playClick();
      });
    }

    if (toggleMusic) {
      toggleMusic.checked = AudioEngine.isMusicOn();
      toggleMusic.addEventListener('change', () => {
        AudioEngine.setMusic(toggleMusic.checked);
        AudioEngine.playClick();
      });
    }

    // Level Select Modal
    const btnCloseLevels = document.getElementById('btnCloseLevels');
    const levelSelectModal = document.getElementById('levelSelectModal');
    if (btnCloseLevels && levelSelectModal) {
      btnCloseLevels.addEventListener('click', () => {
        AudioEngine.playClick();
        levelSelectModal.classList.add('hidden');
      });
    }

    // How to Play Modal
    const btnCloseHowTo = document.getElementById('btnCloseHowTo');
    const btnGotIt = document.getElementById('btnGotIt');
    const howToModal = document.getElementById('howToModal');
    [btnCloseHowTo, btnGotIt].forEach(btn => {
      if (btn && howToModal) {
        btn.addEventListener('click', () => {
          AudioEngine.playClick();
          howToModal.classList.add('hidden');
        });
      }
    });

    // Home / Exit Confirmation Modal
    const exitModal = document.getElementById('exitModal') || document.getElementById('homeModal');
    const btnCancelExit = document.getElementById('btnCancelExit') || document.getElementById('btnCancelHome');
    const btnConfirmExit = document.getElementById('btnConfirmExit') || document.getElementById('btnConfirmHome');
    if (btnCancelExit && exitModal) {
      btnCancelExit.addEventListener('click', () => {
        AudioEngine.playClick();
        exitModal.classList.add('hidden');
      });
    }
    if (btnConfirmExit && exitModal) {
      btnConfirmExit.addEventListener('click', () => {
        AudioEngine.playClick();
        exitModal.classList.add('hidden');
        returnToMainMenu();
      });
    }

    // Win Modal Buttons
    const btnNextLevel = document.getElementById('btnNextLevel') || document.getElementById('btnWinNext');
    const btnReplayWin = document.getElementById('btnReplayWin') || document.getElementById('btnWinReplay');
    const btnWinHome = document.getElementById('btnWinHome');
    const winModal = document.getElementById('winModal');

    if (btnNextLevel) {
      btnNextLevel.addEventListener('click', () => {
        AudioEngine.playClick();
        if (winModal) winModal.classList.add('hidden');
        if (currentLevelIdx + 1 < LEVELS.length) {
          loadLevel(currentLevelIdx + 1);
        } else {
          // Loop or return to menu
          loadLevel(0);
        }
      });
    }

    if (btnReplayWin) {
      btnReplayWin.addEventListener('click', () => {
        AudioEngine.playClick();
        if (winModal) winModal.classList.add('hidden');
        loadLevel(currentLevelIdx);
      });
    }

    if (btnWinHome) {
      btnWinHome.addEventListener('click', () => {
        AudioEngine.playClick();
        if (winModal) winModal.classList.add('hidden');
        returnToMainMenu();
      });
    }
  }

  function returnToMainMenu() {
    const menuScreen = document.getElementById('menuScreen');
    if (menuScreen) menuScreen.classList.remove('hidden');
    renderLevelSelectGrid();
  }

  function openSettingsModal() {
    const modal = document.getElementById('settingsModal');
    const toggleSfx = document.getElementById('toggleSfx');
    const toggleMusic = document.getElementById('toggleMusic');
    if (toggleSfx) toggleSfx.checked = AudioEngine.isSfxOn();
    if (toggleMusic) toggleMusic.checked = AudioEngine.isMusicOn();
    if (modal) modal.classList.remove('hidden');
  }

  function openLevelSelectModal() {
    renderLevelSelectGrid();
    const modal = document.getElementById('levelSelectModal');
    if (modal) modal.classList.remove('hidden');
  }

  function renderLevelSelectGrid() {
    const grid = document.getElementById('levelsGrid');
    const starText = document.getElementById('levelsTotalStars');
    if (!grid) return;

    grid.innerHTML = '';
    const unlocked = parseInt(localStorage.getItem('hp_unlocked') || '1', 10);

    let totalStars = 0;
    Object.values(levelProgress).forEach(s => totalStars += s);
    if (starText) {
      starText.textContent = `${totalStars} / ${LEVELS.length * 3}`;
    }

    LEVELS.forEach((lvl, idx) => {
      const isLocked = idx + 1 > unlocked;
      const stars = levelProgress[idx] || 0;

      const card = document.createElement('div');
      card.className = 'level-card' + (isLocked ? ' locked' : '');

      let starsHtml = '';
      for (let s = 1; s <= 3; s++) {
        starsHtml += `<span class="star-mini${s <= stars ? ' active' : ''}">⭐</span>`;
      }

      card.innerHTML = `
        <div class="level-card-num">${isLocked ? '🔒' : lvl.id}</div>
        <div class="level-card-name">${lvl.name}</div>
        <div class="level-card-pigeons">🕊️ ${lvl.totalPigeons}</div>
        <div class="level-card-stars">${starsHtml}</div>
      `;

      if (!isLocked) {
        card.addEventListener('click', () => {
          AudioEngine.playClick();
          const modal = document.getElementById('levelSelectModal');
          if (modal) modal.classList.add('hidden');
          const menuScreen = document.getElementById('menuScreen');
          if (menuScreen) menuScreen.classList.add('hidden');
          loadLevel(idx);
        });
      }

      grid.appendChild(card);
    });
  }

  function setupMascot() {
    const mascot = document.getElementById('mascotPigeon');
    if (!mascot) return;
    mascot.addEventListener('click', () => {
      AudioEngine.playCoo();
      mascot.style.transform = 'scale(1.18) rotate(5deg)';
      setTimeout(() => {
        mascot.style.transform = '';
      }, 250);
    });
  }

  // Self-start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
