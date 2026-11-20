/* ==========================================================================
   HIDDEN PIGEON - HAND-DRAWN 2D EUROPEAN ILLUSTRATED PUZZLE GAME
   Rich architectural scenes, botanical details, multi-layer natural occlusion,
   atmospheric day & night environments, interactive pigeons & audio synth
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

    // Melodic notes for Parisian / Italian acoustic cafe waltz
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
      gain.gain.linearRampToValueAtTime(0.040, now + 0.04);
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

      playChime: function () {
        if (!sfxEnabled) return;
        const ac = getContext();
        if (!ac) return;

        const notes = [587.33, 739.99, 880.00, 1174.66];
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

      playVictory: function () {
        if (!sfxEnabled) return;
        const ac = getContext();
        if (!ac) return;

        const fanfare = [
          { f: 523.25, t: 0.00, d: 0.12 },
          { f: 659.25, t: 0.13, d: 0.12 },
          { f: 783.99, t: 0.26, d: 0.14 },
          { f: 1046.50, t: 0.42, d: 0.45 }
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
        p.vy += 0.35;
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
  // SCENE DIMENSIONS & LEVEL CONFIGURATIONS
  // Canvas virtual coordinate space: 1280 x 800
  // ==========================================================================
  const SCENE_W = 1280;
  const SCENE_H = 800;

  // 10 UNIQUE LEVELS WITH DETAILED HAND-DRAWN ENVIRONMENTS
  // Themes:
  // - 'park': French Town Square with grand fountain, mansard townhouses, lush oak trees, flowering borders, cafe terrace
  // - 'river': Picturesque Riverside with stone quay, arched masonry bridge, moored riverboat, weeping willows, cattail reeds
  // - 'night': Atmospheric Dark Night with glowing moon, stars, detailed European rooftops, glowing windows, Victorian gas lamps
  // - 'terrace': Mediterranean Coastal Terrace with terracotta roofs, potted lemon trees, bougainvillea pergolas, wrought-iron balconies
  // - 'market': Old Town Marketplace with half-timbered houses, clock tower, striped fruit stalls, oak barrels, flower carts
  const LEVELS = [
    {
      id: 1,
      name: 'Sunlit Town Square',
      theme: 'park',
      totalPigeons: 10,
      description: 'Search carefully behind townhouse chimneys, window shutters, tree canopies, park benches and the stone fountain.',
      pigeons: [
        { id: 1, x: 235, y: 560, scale: 0.88, flip: false, spot: 'bench-left' },
        { id: 2, x: 640, y: 405, scale: 0.85, flip: true, spot: 'fountain-rim' },
        { id: 3, x: 155, y: 235, scale: 0.78, flip: false, spot: 'oak-leaves-left' },
        { id: 4, x: 445, y: 520, scale: 0.90, flip: true, spot: 'rose-hedge-left' },
        { id: 5, x: 885, y: 555, scale: 0.88, flip: false, spot: 'rose-hedge-right' },
        { id: 6, x: 1060, y: 245, scale: 0.80, flip: true, spot: 'oak-leaves-right' },
        { id: 7, x: 745, y: 685, scale: 0.96, flip: false, spot: 'tulip-bed' },
        { id: 8, x: 995, y: 540, scale: 0.90, flip: true, spot: 'bench-right' },
        { id: 9, x: 375, y: 285, scale: 0.75, flip: false, spot: 'dormer-window-left' },
        { id: 10, x: 890, y: 275, scale: 0.76, flip: true, spot: 'chimney-pot-right' }
      ]
    },
    {
      id: 2,
      name: 'Riverside Promenade',
      theme: 'river',
      totalPigeons: 11,
      description: 'Clever pigeons hiding behind river reeds, wooden dock pilings, the moored riverboat and weeping willows.',
      pigeons: [
        { id: 1, x: 180, y: 585, scale: 0.92, flip: false, spot: 'reeds-left' },
        { id: 2, x: 480, y: 530, scale: 0.88, flip: true, spot: 'boat-gunwale' },
        { id: 3, x: 775, y: 470, scale: 0.85, flip: false, spot: 'pier-railing' },
        { id: 4, x: 925, y: 545, scale: 0.90, flip: true, spot: 'pier-post' },
        { id: 5, x: 325, y: 250, scale: 0.80, flip: false, spot: 'willow-branches' },
        { id: 6, x: 625, y: 345, scale: 0.75, flip: true, spot: 'bridge-parapet' },
        { id: 7, x: 1105, y: 605, scale: 0.96, flip: false, spot: 'reeds-right' },
        { id: 8, x: 265, y: 435, scale: 0.84, flip: true, spot: 'stone-quay-edge' },
        { id: 9, x: 985, y: 375, scale: 0.78, flip: false, spot: 'boathouse-eaves' },
        { id: 10, x: 145, y: 705, scale: 1.00, flip: true, spot: 'river-boulders' },
        { id: 11, x: 675, y: 665, scale: 0.95, flip: false, spot: 'water-lily-cluster' }
      ]
    },
    {
      id: 3,
      name: 'Midnight Stargazing',
      theme: 'night',
      totalPigeons: 12,
      description: 'Atmospheric dark night! Pigeons resting behind brick chimneys, glowing dormer windows, and moonlit roof ridges.',
      pigeons: [
        { id: 1, x: 215, y: 245, scale: 0.80, flip: false, spot: 'chimney-flue-left' },
        { id: 2, x: 495, y: 315, scale: 0.84, flip: true, spot: 'glowing-dormer-left' },
        { id: 3, x: 735, y: 195, scale: 0.75, flip: false, spot: 'tall-chimney-center' },
        { id: 4, x: 985, y: 285, scale: 0.80, flip: true, spot: 'slate-mansard-roof' },
        { id: 5, x: 1145, y: 215, scale: 0.72, flip: false, spot: 'copper-weathervane' },
        { id: 6, x: 345, y: 475, scale: 0.88, flip: true, spot: 'balustrade-pediment' },
        { id: 7, x: 625, y: 455, scale: 0.88, flip: false, spot: 'dormer-balcony' },
        { id: 8, x: 865, y: 495, scale: 0.86, flip: true, spot: 'glowing-dormer-right' },
        { id: 9, x: 165, y: 675, scale: 1.00, flip: false, spot: 'gas-lamp-post' },
        { id: 10, x: 475, y: 655, scale: 0.96, flip: true, spot: 'cobblestone-curb' },
        { id: 11, x: 815, y: 685, scale: 1.00, flip: false, spot: 'ivy-clad-wall' },
        { id: 12, x: 1085, y: 645, scale: 0.95, flip: true, spot: 'clock-tower-balcony' }
      ]
    },
    {
      id: 4,
      name: 'Mediterranean Terrace',
      theme: 'terrace',
      totalPigeons: 13,
      description: 'Sun-drenched coastal villa with terracotta tiles, lemon tree pots, bougainvillea pergolas and sea view.',
      pigeons: [
        { id: 1, x: 165, y: 285, scale: 0.80, flip: false, spot: 'pergola-ivy' },
        { id: 2, x: 395, y: 355, scale: 0.84, flip: true, spot: 'blue-shutter-left' },
        { id: 3, x: 675, y: 265, scale: 0.75, flip: false, spot: 'terracotta-roof-tile' },
        { id: 4, x: 895, y: 345, scale: 0.84, flip: true, spot: 'blue-shutter-right' },
        { id: 5, x: 1115, y: 275, scale: 0.78, flip: false, spot: 'cypress-foliage' },
        { id: 6, x: 235, y: 525, scale: 0.92, flip: true, spot: 'wrought-iron-balcony' },
        { id: 7, x: 515, y: 565, scale: 0.88, flip: false, spot: 'potted-lemon-tree' },
        { id: 8, x: 795, y: 515, scale: 0.90, flip: true, spot: 'glazed-terracotta-urn' },
        { id: 9, x: 1025, y: 535, scale: 0.92, flip: false, spot: 'olive-tree-pot' },
        { id: 10, x: 115, y: 685, scale: 1.00, flip: true, spot: 'terracotta-seat' },
        { id: 11, x: 385, y: 695, scale: 0.96, flip: false, spot: 'tiled-planter-bed' },
        { id: 12, x: 685, y: 705, scale: 1.00, flip: true, spot: 'mosaic-steps' },
        { id: 13, x: 965, y: 675, scale: 0.96, flip: false, spot: 'sun-terrace-wall' }
      ]
    },
    {
      id: 5,
      name: 'Old Town Marketplace',
      theme: 'market',
      totalPigeons: 14,
      description: 'Bustling town square flanked by medieval timbered houses, striped stalls, fruit crates and bakery carts.',
      pigeons: [
        { id: 1, x: 145, y: 265, scale: 0.80, flip: false, spot: 'striped-awning-red' },
        { id: 2, x: 375, y: 345, scale: 0.84, flip: true, spot: 'apple-fruit-crate' },
        { id: 3, x: 595, y: 225, scale: 0.72, flip: false, spot: 'clock-tower-gable' },
        { id: 4, x: 825, y: 275, scale: 0.80, flip: true, spot: 'striped-awning-blue' },
        { id: 5, x: 1055, y: 255, scale: 0.76, flip: false, spot: 'timber-house-dormer' },
        { id: 6, x: 225, y: 505, scale: 0.92, flip: true, spot: 'oak-wine-barrel' },
        { id: 7, x: 465, y: 485, scale: 0.88, flip: false, spot: 'vegetable-crate' },
        { id: 8, x: 725, y: 495, scale: 0.90, flip: true, spot: 'cheese-stall-counter' },
        { id: 9, x: 945, y: 475, scale: 0.88, flip: false, spot: 'flower-basket-stand' },
        { id: 10, x: 1145, y: 515, scale: 0.92, flip: true, spot: 'barrel-stack' },
        { id: 11, x: 125, y: 685, scale: 1.00, flip: false, spot: 'wooden-cart-wheel' },
        { id: 12, x: 395, y: 705, scale: 0.96, flip: true, spot: 'cobblestone-gutter' },
        { id: 13, x: 675, y: 675, scale: 1.00, flip: false, spot: 'bakery-bread-cart' },
        { id: 14, x: 995, y: 695, scale: 0.96, flip: true, spot: 'burlap-sack-stack' }
      ]
    },
    {
      id: 6,
      name: 'Royal Botanical Conservatory',
      theme: 'park',
      totalPigeons: 15,
      description: 'Lush palace grounds featuring an ornate garden gazebo, blooming rose hedges and stone sculptures.',
      pigeons: [
        { id: 1, x: 135, y: 235, scale: 0.76, flip: false, spot: 'left-oak-tree' },
        { id: 2, x: 325, y: 315, scale: 0.80, flip: true, spot: 'gazebo-dome-eave' },
        { id: 3, x: 525, y: 265, scale: 0.74, flip: false, spot: 'gazebo-cupola' },
        { id: 4, x: 715, y: 325, scale: 0.80, flip: true, spot: 'marble-column-capital' },
        { id: 5, x: 935, y: 225, scale: 0.75, flip: false, spot: 'cherry-blossom-canopy' },
        { id: 6, x: 1125, y: 285, scale: 0.78, flip: true, spot: 'botanical-glass-arch' },
        { id: 7, x: 215, y: 485, scale: 0.90, flip: false, spot: 'rose-hedge-arch' },
        { id: 8, x: 445, y: 525, scale: 0.88, flip: true, spot: 'ornate-park-bench' },
        { id: 9, x: 655, y: 455, scale: 0.86, flip: false, spot: 'sculpted-fountain-tier' },
        { id: 10, x: 865, y: 515, scale: 0.90, flip: true, spot: 'flowering-hydrangea' },
        { id: 11, x: 1045, y: 495, scale: 0.88, flip: false, spot: 'cast-iron-lamppost' },
        { id: 12, x: 95, y: 675, scale: 1.00, flip: true, spot: 'manicured-flowerbed' },
        { id: 13, x: 345, y: 685, scale: 0.96, flip: false, spot: 'carved-birdbath' },
        { id: 14, x: 605, y: 695, scale: 1.00, flip: true, spot: 'boxwood-hedgerow' },
        { id: 15, x: 915, y: 675, scale: 0.96, flip: false, spot: 'ornamental-urn' }
      ]
    },
    {
      id: 7,
      name: 'Sunset River Harbor',
      theme: 'river',
      totalPigeons: 16,
      description: 'Picturesque harbor embankment with stone quay, traditional boat cabin, bridge piers and weeping willows.',
      pigeons: [
        { id: 1, x: 155, y: 245, scale: 0.75, flip: false, spot: 'willow-canopy' },
        { id: 2, x: 345, y: 315, scale: 0.80, flip: true, spot: 'bridge-keystone-arch' },
        { id: 3, x: 575, y: 225, scale: 0.72, flip: false, spot: 'distant-stone-quay' },
        { id: 4, x: 795, y: 325, scale: 0.80, flip: true, spot: 'sailboat-cabin-roof' },
        { id: 5, x: 1025, y: 235, scale: 0.76, flip: false, spot: 'boathouse-gable' },
        { id: 6, x: 1155, y: 345, scale: 0.78, flip: true, spot: 'quay-crane-arm' },
        { id: 7, x: 215, y: 505, scale: 0.90, flip: false, spot: 'riverbank-cattails-left' },
        { id: 8, x: 425, y: 545, scale: 0.88, flip: true, spot: 'wooden-punt-gunwale' },
        { id: 9, x: 675, y: 475, scale: 0.86, flip: false, spot: 'timber-pier-deck' },
        { id: 10, x: 895, y: 525, scale: 0.90, flip: true, spot: 'harbor-mooring-piling' },
        { id: 11, x: 1085, y: 495, scale: 0.88, flip: false, spot: 'stone-breakwater' },
        { id: 12, x: 115, y: 695, scale: 1.00, flip: true, spot: 'riverside-boulders' },
        { id: 13, x: 375, y: 685, scale: 0.96, flip: false, spot: 'reed-cluster-center' },
        { id: 14, x: 605, y: 705, scale: 1.00, flip: true, spot: 'water-lily-pad' },
        { id: 15, x: 835, y: 685, scale: 0.96, flip: false, spot: 'iron-mooring-cleat' },
        { id: 16, x: 1065, y: 705, scale: 1.00, flip: true, spot: 'reed-cluster-right' }
      ]
    },
    {
      id: 8,
      name: 'Moonlit City Skyline',
      theme: 'night',
      totalPigeons: 16,
      description: 'Mysterious dark night over slate roofs! Find pigeons concealed along chimney flues and glowing attics.',
      pigeons: [
        { id: 1, x: 165, y: 225, scale: 0.76, flip: false, spot: 'chimney-pot-left' },
        { id: 2, x: 365, y: 295, scale: 0.80, flip: true, spot: 'amber-lit-window' },
        { id: 3, x: 585, y: 185, scale: 0.72, flip: false, spot: 'bell-tower-belfry' },
        { id: 4, x: 805, y: 275, scale: 0.80, flip: true, spot: 'brick-chimney-center' },
        { id: 5, x: 1015, y: 205, scale: 0.74, flip: false, spot: 'copper-spire' },
        { id: 6, x: 1165, y: 265, scale: 0.78, flip: true, spot: 'slate-mansard-eaves' },
        { id: 7, x: 235, y: 465, scale: 0.88, flip: false, spot: 'dormer-stone-sill' },
        { id: 8, x: 455, y: 445, scale: 0.86, flip: true, spot: 'rooftop-balustrade' },
        { id: 9, x: 695, y: 475, scale: 0.88, flip: false, spot: 'cast-iron-finial' },
        { id: 10, x: 915, y: 455, scale: 0.86, flip: true, spot: 'arched-dormer-glow' },
        { id: 11, x: 1115, y: 485, scale: 0.90, flip: false, spot: 'attic-skylight' },
        { id: 12, x: 125, y: 665, scale: 1.00, flip: true, spot: 'victorian-lantern-pole' },
        { id: 13, x: 385, y: 675, scale: 0.96, flip: false, spot: 'wet-cobblestone-curb' },
        { id: 14, x: 625, y: 685, scale: 1.00, flip: true, spot: 'moonlit-ivy-creeper' },
        { id: 15, x: 875, y: 675, scale: 0.96, flip: false, spot: 'street-gas-lamp-glow' },
        { id: 16, x: 1085, y: 695, scale: 1.00, flip: true, spot: 'copper-downspout' }
      ]
    },
    {
      id: 9,
      name: 'Grand Piazza Marketplace',
      theme: 'market',
      totalPigeons: 18,
      description: 'Master hidden-object level! Search through colorful market stalls, bakery counters and shop gables.',
      pigeons: [
        { id: 1, x: 125, y: 245, scale: 0.75, flip: false, spot: 'awning-scallop-red' },
        { id: 2, x: 295, y: 315, scale: 0.78, flip: true, spot: 'rustic-window-shutter' },
        { id: 3, x: 485, y: 205, scale: 0.70, flip: false, spot: 'clock-tower-cornice' },
        { id: 4, x: 695, y: 285, scale: 0.78, flip: true, spot: 'awning-scallop-blue' },
        { id: 5, x: 885, y: 215, scale: 0.72, flip: false, spot: 'terracotta-chimney-top' },
        { id: 6, x: 1085, y: 275, scale: 0.76, flip: true, spot: 'heraldic-banner-pole' },
        { id: 7, x: 185, y: 475, scale: 0.88, flip: false, spot: 'apple-produce-box' },
        { id: 8, x: 365, y: 495, scale: 0.86, flip: true, spot: 'wine-cask-rim' },
        { id: 9, x: 555, y: 465, scale: 0.84, flip: false, spot: 'pear-vegetable-crate' },
        { id: 10, x: 745, y: 485, scale: 0.88, flip: true, spot: 'cheese-market-table' },
        { id: 11, x: 925, y: 465, scale: 0.86, flip: false, spot: 'wicker-flower-basket' },
        { id: 12, x: 1125, y: 495, scale: 0.90, flip: true, spot: 'oak-barrel-lid' },
        { id: 13, x: 95, y: 675, scale: 1.00, flip: false, spot: 'heavy-cart-wheel' },
        { id: 14, x: 285, y: 695, scale: 0.96, flip: true, spot: 'croissant-bakery-cart' },
        { id: 15, x: 515, y: 685, scale: 1.00, flip: false, spot: 'sandstone-paving-edge' },
        { id: 16, x: 735, y: 705, scale: 0.96, flip: true, spot: 'grain-produce-sack' },
        { id: 17, x: 945, y: 685, scale: 1.00, flip: false, spot: 'arcaded-piazza-pillar' },
        { id: 18, x: 1145, y: 705, scale: 0.96, flip: true, spot: 'sun-parasol-edge' }
      ]
    },
    {
      id: 10,
      name: 'Starlight Harbor & Village',
      theme: 'night',
      totalPigeons: 20,
      description: 'Grand Finale! 20 masterfully hidden pigeons nestled along moonlit riverside rooftops, pier lanterns and boat decks.',
      pigeons: [
        { id: 1, x: 115, y: 225, scale: 0.74, flip: false, spot: 'willow-night-canopy' },
        { id: 2, x: 275, y: 295, scale: 0.76, flip: true, spot: 'moonlit-balustrade-rail' },
        { id: 3, x: 455, y: 215, scale: 0.70, flip: false, spot: 'stone-bridge-arch' },
        { id: 4, x: 635, y: 275, scale: 0.76, flip: true, spot: 'quayside-brick-parapet' },
        { id: 5, x: 825, y: 205, scale: 0.72, flip: false, spot: 'boathouse-cupola' },
        { id: 6, x: 1005, y: 285, scale: 0.76, flip: true, spot: 'conservatory-dome-finial' },
        { id: 7, x: 1165, y: 235, scale: 0.74, flip: false, spot: 'harbor-mast-crosstree' },
        { id: 8, x: 185, y: 475, scale: 0.86, flip: true, spot: 'night-cattail-cluster' },
        { id: 9, x: 355, y: 515, scale: 0.84, flip: false, spot: 'river-punt-cabin' },
        { id: 10, x: 535, y: 455, scale: 0.84, flip: true, spot: 'dock-timber-railing' },
        { id: 11, x: 715, y: 495, scale: 0.86, flip: false, spot: 'pier-heavy-piling' },
        { id: 12, x: 895, y: 465, scale: 0.84, flip: true, spot: 'moored-sailboat-deck' },
        { id: 13, x: 1075, y: 495, scale: 0.88, flip: false, spot: 'quayside-stone-bollard' },
        { id: 14, x: 85, y: 685, scale: 1.00, flip: true, spot: 'embankment-boulders' },
        { id: 15, x: 265, y: 675, scale: 0.96, flip: false, spot: 'river-reed-bed-center' },
        { id: 16, x: 475, y: 695, scale: 1.00, flip: true, spot: 'flowering-water-lily' },
        { id: 17, x: 675, y: 675, scale: 0.96, flip: false, spot: 'iron-mooring-ring' },
        { id: 18, x: 865, y: 695, scale: 1.00, flip: true, spot: 'river-reed-bed-right' },
        { id: 19, x: 1045, y: 675, scale: 0.96, flip: false, spot: 'gas-lantern-quayside' },
        { id: 20, x: 1175, y: 705, scale: 1.00, flip: true, spot: 'stone-pier-staircase' }
      ]
    }
  ];

  // ==========================================================================
  // GAME RUNTIME STATE
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

  // Particle & Floating Text Systems
  let floatingFx = [];
  let featherParticles = [];
  let sparkleParticles = [];

  // Pan inertia / coasting velocity
  let velX = 0, velY = 0;
  let lastDragX = 0, lastDragY = 0;

  // Praise phrases on spotting pigeons
  const PRAISES = ['Spotted! 🕊️', 'Eagle Eye! 🎯', 'Great Find! ✨', 'Gotcha! 🕊️', 'Sharp Eyes! 🔍', 'Found It! 🌟'];

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

    currentLevelIdx = 0;
    loadLevel(0);
    renderLevelSelectGrid();
    setupMascot();
    updateMenuPlayButton();

    const unlockAudio = () => {
      AudioEngine.init();
      window.removeEventListener('pointerdown', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
    };
    window.addEventListener('pointerdown', unlockAudio);
    window.addEventListener('keydown', unlockAudio);

    // Dismiss CIEL loader automatically
    const dismissLoader = () => {
      const loader = document.getElementById('ciel-loader') || document.querySelector('.ciel-loader-overlay');
      if (loader) {
        loader.classList.add('cl-done');
        loader.style.pointerEvents = 'none';
        loader.style.display = 'none';
      }
    };
    setTimeout(dismissLoader, 450);
    window.addEventListener('ciel-loader:done', dismissLoader);

    requestAnimationFrame(render);
  }

  function showLevelToast(title, sub) {
    const toast = document.getElementById('levelToast');
    const tTitle = document.getElementById('toastTitle');
    const tSub = document.getElementById('toastSub');
    if (!toast) return;

    if (tTitle) tTitle.textContent = title;
    if (tSub) tSub.textContent = sub;

    toast.classList.remove('hidden');
    toast.style.animation = 'none';
    void toast.offsetWidth;
    toast.style.animation = 'toastSlide 2.6s cubic-bezier(0.16, 1, 0.3, 1) forwards';

    setTimeout(() => {
      toast.classList.add('hidden');
    }, 2700);
  }

  function updateMenuPlayButton() {
    const btn = document.getElementById('btnMenuPlay') || document.getElementById('btnPlay');
    if (!btn) return;
    const unlocked = parseInt(localStorage.getItem('hp_unlocked') || '1', 10);
    const labelSpan = btn.querySelector('span:last-child');
    if (labelSpan) {
      labelSpan.textContent = unlocked > 1 ? `CONTINUE (LVL ${unlocked})` : 'PLAY NOW';
    }
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
    sparkleParticles = [];
    velX = 0;
    velY = 0;
    levelStartTime = Date.now();

    currentPigeons = level.pigeons.map(p => ({
      ...p,
      found: false,
      disappeared: false,
      alpha: 1.0,
      flyX: 0,
      flyY: 0,
      flySpeed: 2.8 + Math.random() * 1.4,
      flyDir: (Math.random() - 0.5) * 3.0,
      flapSpeed: 18 + Math.random() * 8,
      popAnim: 0,
      accessory: p.accessory || (p.id % 4 === 1 ? 'crumb' : (p.id % 4 === 2 ? 'beret' : null))
    }));

    updateHUD();
    fitToScreen();
    showLevelToast(`Level ${level.id}: ${level.name}`, `Find ${level.totalPigeons} hidden pigeons!`);
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
  // PARTICLES (Hand-Drawn Feathers, Golden Sparkles & Floating Scores)
  // ==========================================================================
  function spawnFeatherBurst(cx, cy) {
    const count = 16;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 4.6 + 2.0;
      featherParticles.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2.8,
        rot: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.22,
        scale: Math.random() * 0.4 + 0.35,
        alpha: 1.0,
        color: i % 3 === 0 ? '#eceff1' : (i % 3 === 1 ? '#cfd8dc' : '#90a4ae')
      });
    }

    // Burst of 10 golden sparkle stars
    for (let s = 0; s < 10; s++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = Math.random() * 3.6 + 1.8;
      sparkleParticles.push({
        x: cx,
        y: cy,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd - 2.0,
        rot: Math.random() * Math.PI,
        vRot: (Math.random() - 0.5) * 0.25,
        scale: Math.random() * 0.5 + 0.5,
        alpha: 1.0,
        color: s % 2 === 0 ? '#fde047' : '#fbbf24'
      });
    }
  }

  function spawnFloatingScore(cx, cy, customText) {
    floatingFx.push({
      x: cx,
      y: cy - 12,
      vy: -2.2,
      alpha: 1.0,
      text: customText || '+1 🕊️'
    });
  }

  function updateFloatingFx() {
    // Feathers
    for (let i = featherParticles.length - 1; i >= 0; i--) {
      const f = featherParticles[i];
      f.x += f.vx;
      f.y += f.vy;
      f.vy += 0.08;
      f.vx *= 0.98;
      f.rot += f.vRot;
      f.alpha -= 0.022;
      if (f.alpha <= 0) featherParticles.splice(i, 1);
    }

    // Sparkles
    for (let i = sparkleParticles.length - 1; i >= 0; i--) {
      const sp = sparkleParticles[i];
      sp.x += sp.vx;
      sp.y += sp.vy;
      sp.vy += 0.06;
      sp.vx *= 0.97;
      sp.rot += sp.vRot;
      sp.alpha -= 0.026;
      if (sp.alpha <= 0) sparkleParticles.splice(i, 1);
    }

    // Floating text
    for (let i = floatingFx.length - 1; i >= 0; i--) {
      const fx = floatingFx[i];
      fx.y += fx.vy;
      fx.alpha -= 0.018;
      if (fx.alpha <= 0) floatingFx.splice(i, 1);
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

      ctx.fillStyle = f.color;
      ctx.beginPath();
      ctx.ellipse(0, 0, 7, 20, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#546e7a';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(0, -20);
      ctx.lineTo(0, 20);
      ctx.stroke();

      ctx.restore();
    });

    // Draw Golden Sparkle Stars
    sparkleParticles.forEach(sp => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, sp.alpha);
      ctx.translate(sp.x, sp.y);
      ctx.rotate(sp.rot);
      ctx.scale(sp.scale, sp.scale);
      ctx.fillStyle = sp.color;
      ctx.beginPath();
      for (let i = 0; i < 4; i++) {
        ctx.lineTo(Math.cos((i * Math.PI) / 2) * 8, Math.sin((i * Math.PI) / 2) * 8);
        ctx.lineTo(Math.cos((i * Math.PI) / 2 + Math.PI / 4) * 3, Math.sin((i * Math.PI) / 2 + Math.PI / 4) * 3);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    });

    // Draw Floating Text
    floatingFx.forEach(fx => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, fx.alpha);
      ctx.font = '800 24px Nunito, sans-serif';
      ctx.fillStyle = '#ffb300';
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 4.0;
      ctx.textAlign = 'center';
      ctx.strokeText(fx.text, fx.x, fx.y);
      ctx.fillText(fx.text, fx.x, fx.y);
      ctx.restore();
    });
  }
      ctx.lineWidth = 3.5;
      ctx.textAlign = 'center';
      ctx.strokeText(fx.text, fx.x, fx.y);
      ctx.fillText(fx.text, fx.x, fx.y);
      ctx.restore();
    });
  }

  // ==========================================================================
  // HAND-DRAWN NATURAL PIGEON RENDERING
  // Authentic European slate-gray plumage, natural camouflage, subtle head bob
  // ==========================================================================
  function drawPigeon(p, time) {
    if (p.disappeared) return;

    ctx.save();

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
    const bob = Math.sin(time * 3.5 + p.id * 1.7) * 1.4;
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

    // 1. Pigeon Tail Feathers
    ctx.fillStyle = '#37474f';
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(-16, 8);
    ctx.lineTo(-32, 14);
    ctx.lineTo(-30, 24);
    ctx.lineTo(-14, 18);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 2. Plump Hand-Drawn Body
    ctx.fillStyle = '#64748b'; // Slate gray body
    ctx.strokeStyle = '#1e293b'; // Storybook ink outline
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.ellipse(0, 10, 24, 18, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // 3. Subtle Iridescent Neck Plumage
    const neckGrad = ctx.createLinearGradient(4, -8, 16, 6);
    neckGrad.addColorStop(0, '#0d9488'); // Emerald sheen
    neckGrad.addColorStop(0.5, '#9333ea'); // Amethyst sheen
    neckGrad.addColorStop(1, '#0f766e');
    ctx.fillStyle = neckGrad;
    ctx.beginPath();
    ctx.ellipse(8, 0, 10, 8, 0.25, 0, Math.PI * 2);
    ctx.fill();

    // 4. Natural Round Pigeon Head
    ctx.fillStyle = '#78909c';
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(12, -10, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // 5. Bright Alert Eye (White sclera, dark iris, tiny gleam)
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(17, -12, 4.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(18, -12, 2.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(19, -13, 1.0, 0, Math.PI * 2);
    ctx.fill();

    // 6. Natural Pigeon Beak (Coral-orange with white cere)
    ctx.fillStyle = '#fb923c';
    ctx.strokeStyle = '#c2410c';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(24, -13);
    ctx.lineTo(34, -10);
    ctx.lineTo(24, -6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Cere wattle
    ctx.fillStyle = '#f1f5f9';
    ctx.beginPath();
    ctx.arc(24, -12, 2.2, 0, Math.PI * 2);
    ctx.fill();

    // 7. Folded Wing with Flutter Animation
    ctx.save();
    let wingAngle = 0;
    if (p.found) {
      wingAngle = Math.sin(time * p.flapSpeed) * 0.7;
    }
    ctx.translate(-2, 8);
    ctx.rotate(wingAngle);
    ctx.fillStyle = '#475569';
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.ellipse(0, 0, 16, 10, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Wing stripe detail
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(-6, -2);
    ctx.lineTo(-4, 6);
    ctx.moveTo(2, -4);
    ctx.lineTo(4, 5);
    ctx.stroke();
    ctx.restore();

    // 8. Cute Optional Accessories
    if (p.accessory === 'crumb') {
      ctx.fillStyle = '#fde68a';
      ctx.strokeStyle = '#b45309';
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.arc(36, -8, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else if (p.accessory === 'beret') {
      ctx.fillStyle = '#b91c1c';
      ctx.beginPath();
      ctx.ellipse(12, -21, 10, 4.5, -0.15, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(11, -24, 2, 3);
    }

    ctx.restore();
  }

  // ==========================================================================
  // 3-PASS MULTI-LAYER RENDERING PIPELINE
  // Pass 1: renderSceneBackground(theme, time) -> Sky, distant hills/city, facade bases
  // Pass 2: drawPigeons -> Pigeons rendered at hiding spots
  // Pass 3: renderSceneForeground(theme, time) -> Foliage, window frames, shutters, chimneys, bench slats, reeds, crates
  // ==========================================================================

  function renderSceneBackground(theme, time) {
    if (theme === 'park') renderParkBackground(time);
    else if (theme === 'river') renderRiverBackground(time);
    else if (theme === 'night') renderNightBackground(time);
    else if (theme === 'terrace') renderTerraceBackground(time);
    else renderMarketBackground(time);
  }

  function renderSceneForeground(theme, time) {
    if (theme === 'park') renderParkForeground(time);
    else if (theme === 'river') renderRiverForeground(time);
    else if (theme === 'night') renderNightForeground(time);
    else if (theme === 'terrace') renderTerraceForeground(time);
    else renderMarketForeground(time);
  }

  // --------------------------------------------------------------------------
  // THEME 1: SUNLIT EUROPEAN TOWN SQUARE & PARK (Hand-Drawn Illustrated)
  // --------------------------------------------------------------------------
  function renderParkBackground(time) {
    // Soft Azure French Sky Gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, 420);
    skyGrad.addColorStop(0, '#7dd3fc');
    skyGrad.addColorStop(0.6, '#bae6fd');
    skyGrad.addColorStop(1, '#f0f9ff');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, SCENE_W, SCENE_H);

    // Warm Morning Sun with Soft Radiant Halo
    const sunGrad = ctx.createRadialGradient(1080, 110, 10, 1080, 110, 95);
    sunGrad.addColorStop(0, '#fef08a');
    sunGrad.addColorStop(0.4, 'rgba(254, 240, 138, 0.45)');
    sunGrad.addColorStop(1, 'rgba(254, 240, 138, 0)');
    ctx.fillStyle = sunGrad;
    ctx.beginPath();
    ctx.arc(1080, 110, 95, 0, Math.PI * 2);
    ctx.fill();

    // Hand-Drawn Drifting Fluffy Clouds
    drawDetailedCloud(200, 90, 75, time * 2);
    drawDetailedCloud(660, 115, 90, time * 1.5);

    // Distant Rolling European Hills & Forest Canopy
    ctx.fillStyle = '#86efac';
    ctx.beginPath();
    ctx.moveTo(0, 410);
    ctx.bezierCurveTo(320, 360, 680, 430, SCENE_W, 375);
    ctx.lineTo(SCENE_W, SCENE_H);
    ctx.lineTo(0, SCENE_H);
    ctx.closePath();
    ctx.fill();

    // Midground Rolling Lawn
    ctx.fillStyle = '#4ade80';
    ctx.beginPath();
    ctx.moveTo(0, 455);
    ctx.bezierCurveTo(380, 425, 820, 475, SCENE_W, 435);
    ctx.lineTo(SCENE_W, SCENE_H);
    ctx.lineTo(0, SCENE_H);
    ctx.closePath();
    ctx.fill();

    // Illustrated French Mansard Townhouses (Left & Right Flanks)
    // Left Townhouse (Stucco wall, stone quoins)
    drawTownhouseFacade(40, 220, 280, 460, '#fde68a', '#d97706');
    // Right Townhouse
    drawTownhouseFacade(960, 210, 280, 470, '#fbcfe8', '#db2777');

    // Foreground Park Lawn
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(0, 520, SCENE_W, SCENE_H - 520);

    // Winding Cobblestone Park Promenade
    drawCurvedCobblestonePath(460, 520, 580, SCENE_H);

    // Gnarled Tree Trunks with Hand-Drawn Bark Crevices
    drawGnarledTreeTrunk(145, 270, 34, 270);
    drawGnarledTreeTrunk(1055, 280, 36, 260);

    // Central Gazebo Base Pillars & Arch (Background)
    ctx.fillStyle = '#f8fafc';
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2.5;
    ctx.fillRect(490, 260, 12, 170);
    ctx.strokeRect(490, 260, 12, 170);
    ctx.fillRect(575, 260, 12, 170);
    ctx.strokeRect(575, 260, 12, 170);

    // Fountain Pedestal Base (Behind splashing water)
    ctx.fillStyle = '#cbd5e1';
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2.5;
    ctx.fillRect(630, 430, 24, 70);
    ctx.strokeRect(630, 430, 24, 70);

    // Splashing fountain water jet spray
    drawWaterJets(642, 390, time);
  }

  function renderParkForeground(time) {
    // 1. Lush Hand-Drawn Oak Tree Canopies (Partially hiding pigeons on tree-left & tree-right)
    drawIllustratedFoliageCluster(155, 245, 95, '#15803d', '#4ade80');
    drawIllustratedFoliageCluster(1065, 260, 98, '#166534', '#22c55e');

    // 2. Townhouse Dormer Pediments & Chimneys (Covers p9 x:375, y:285 & p10 x:890, y:275)
    drawIllustratedChimney(870, 280, 54, 75);
    drawIllustratedDormer(350, 290, 70, 80, false);

    // 3. Carved Stone Fountain Marble Rim (Covers bottom of p2 x:640, y:405)
    ctx.fillStyle = '#e2e8f0';
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.ellipse(642, 430, 68, 24, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Sparkling pool water surface inside fountain
    ctx.fillStyle = 'rgba(56, 189, 248, 0.75)';
    ctx.beginPath();
    ctx.ellipse(642, 428, 60, 18, 0, 0, Math.PI * 2);
    ctx.fill();

    // 4. Carved Wooden Park Benches (Slats covering pigeons at x:235, y:560 and x:995, y:540)
    drawIllustratedParkBench(200, 570, 135);
    drawIllustratedParkBench(960, 550, 125);

    // 5. Blooming Rose Hedges & Flowerbeds (Covers p4 x:445, y:520 and p5 x:885, y:555)
    drawDetailedFlowerHedge(395, 535, 130, '#15803d', '#f43f5e', '#ec4899');
    drawDetailedFlowerHedge(845, 575, 120, '#166534', '#a855f7', '#d946ef');

    // 6. Foreground Tulip Flowerbed (Covers p7 x:745, y:685)
    drawTulipFlowerbed(700, 700, 140);
  }

  // --------------------------------------------------------------------------
  // THEME 2: PICTURESQUE RIVERSIDE PROMENADE (Hand-Drawn Illustrated)
  // --------------------------------------------------------------------------
  function renderRiverBackground(time) {
    // Cerulean Blue Sky Gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, 420);
    skyGrad.addColorStop(0, '#38bdf8');
    skyGrad.addColorStop(0.7, '#bae6fd');
    skyGrad.addColorStop(1, '#e0f2fe');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, SCENE_W, SCENE_H);

    drawDetailedCloud(190, 85, 75, time * 1.8);
    drawDetailedCloud(750, 100, 85, time * 1.4);

    // Distant Green Riverbank with Willow Trees
    ctx.fillStyle = '#86efac';
    ctx.fillRect(0, 355, SCENE_W, 65);

    // Distant Arched Stone Bridge with Masonry Keystones
    drawStoneBridgeArch(500, 330, 260, 65);

    // Flowing Sparkling River Water with Layered Gradients
    const riverGrad = ctx.createLinearGradient(0, 400, 0, SCENE_H);
    riverGrad.addColorStop(0, '#0284c7');
    riverGrad.addColorStop(0.4, '#0369a1');
    riverGrad.addColorStop(1, '#075985');
    ctx.fillStyle = riverGrad;
    ctx.fillRect(0, 400, SCENE_W, SCENE_H - 400);

    // Hand-Drawn Water Ripple Highlights
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.lineWidth = 2.5;
    for (let r = 0; r < 9; r++) {
      const rx = (r * 160 + Math.sin(time * 2 + r) * 35) % SCENE_W;
      const ry = 425 + r * 38;
      ctx.beginPath();
      ctx.moveTo(rx, ry);
      ctx.lineTo(rx + 68, ry);
      ctx.stroke();
    }

    // Heavy Timber Dock Pilings (Extending down into water)
    ctx.fillStyle = '#451a03';
    ctx.fillRect(720, 485, 18, 190);
    ctx.fillRect(860, 485, 18, 190);
    ctx.fillRect(980, 485, 18, 190);

    // Wooden Boat Hull Body (Moored at pier)
    ctx.fillStyle = '#78350f';
    ctx.beginPath();
    ctx.ellipse(470, 545, 80, 20, -0.05, 0, Math.PI * 2);
    ctx.fill();

    // Weeping Willow Trunk Base
    drawGnarledTreeTrunk(310, 270, 30, 220);
  }

  function renderRiverForeground(time) {
    // 1. Weeping Willow Tendrils (Covers p5 x:325, y:250)
    drawWeepingWillowTendrils(325, 240, time);

    // 2. Wooden Riverboat Gunwale & Oar (Covers bottom of p2 x:480, y:530)
    ctx.fillStyle = '#92400e';
    ctx.strokeStyle = '#451a03';
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.moveTo(395, 538);
    ctx.quadraticCurveTo(475, 555, 555, 538);
    ctx.quadraticCurveTo(475, 520, 395, 538);
    ctx.fill();
    ctx.stroke();

    // 3. Wooden Dock Deck & Handrail (Covers p3 x:775, y:470 and p4 x:925, y:545)
    ctx.fillStyle = '#78350f';
    ctx.fillRect(690, 485, 340, 24);
    ctx.strokeStyle = '#291e13';
    ctx.lineWidth = 2.8;
    ctx.strokeRect(690, 485, 340, 24);

    for (let p = 0; p < 6; p++) {
      ctx.fillRect(700 + p * 64, 445, 12, 42);
      ctx.strokeRect(700 + p * 64, 445, 12, 42);
    }
    ctx.fillRect(690, 445, 340, 12);
    ctx.strokeRect(690, 445, 340, 12);

    // 4. Dense River Reeds & Cattails (Covers pigeons at x:180, y:585 and x:1105, y:605)
    drawIllustratedCattails(145, 610, 16);
    drawIllustratedCattails(1070, 620, 18);

    // 5. Riverbank Boulders & Water Lilies (Covers p10 x:145, y:705 and p11 x:675, y:665)
    drawIllustratedRiverBoulders(100, 720, 130);
    drawIllustratedWaterLily(675, 680, 48);
  }

  // --------------------------------------------------------------------------
  // THEME 3: BEAUTIFUL DARK NIGHT ENVIRONMENT (Hand-Drawn Illustrated)
  // Deep navy sky, glowing moon with craters, twinkling stars, lit windows,
  // streetlights casting warm cones of light, detailed European architecture
  // --------------------------------------------------------------------------
  function renderNightBackground(time) {
    // Deep Midnight Indigo Sky Gradient
    const nightGrad = ctx.createLinearGradient(0, 0, 0, SCENE_H);
    nightGrad.addColorStop(0, '#020617'); // Darkest midnight
    nightGrad.addColorStop(0.35, '#0f172a');
    nightGrad.addColorStop(0.7, '#1e1b4b');
    nightGrad.addColorStop(1, '#2e1065'); // Soft twilight purple base
    ctx.fillStyle = nightGrad;
    ctx.fillRect(0, 0, SCENE_W, SCENE_H);

    // 45+ Hand-Drawn Twinkling Stars
    drawTwinklingStars(time);

    // Atmospheric Glowing Full Moon with Craters & Celestial Halo
    drawIllustratedFullMoon(220, 110, 52, time);

    // Dramatic European Skyline Rooftops & Mansard Slopes
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2.5;

    // Distant roofs & towers
    ctx.fillRect(70, 270, 190, 500);
    ctx.fillRect(360, 330, 240, 470);
    ctx.fillRect(660, 230, 210, 570);
    ctx.fillRect(930, 310, 280, 490);

    // Bell Tower Spire
    ctx.beginPath();
    ctx.moveTo(1060, 310);
    ctx.lineTo(1125, 150);
    ctx.lineTo(1190, 310);
    ctx.closePath();
    ctx.fillStyle = '#090d16';
    ctx.fill();
    ctx.stroke();

    // Night Cobblestone Street Ground
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 600, SCENE_W, SCENE_H - 600);
  }

  function renderNightForeground(time) {
    // 1. Detailed Brick Chimneys (Occluding pigeons at x:215, y:245 and x:735, y:195)
    drawNightChimney(190, 250, 58, 70);
    drawNightChimney(710, 200, 54, 80);

    // 2. Glowing Lit Windows & Dormers (Occluding pigeons at x:495, y:315 and x:985, y:285)
    drawIllustratedDormer(465, 320, 78, 85, true);
    drawIllustratedDormer(955, 290, 78, 80, true);

    // 3. Mansard Slate Roof Ridges & Balustrade (Occluding pigeons at x:345, y:475 and x:625, y:455)
    drawNightRoofBalustrade(300, 485, 170);
    drawNightRoofBalustrade(580, 465, 150);

    // 4. Victorian Cast-Iron Street Lanterns Casting Warm Cones of Light (Occluding p9 x:165, y:675)
    drawVictorianStreetlight(140, 685, true, time);
    drawVictorianStreetlight(850, 685, true, time);

    // 5. Wet Moonlit Cobblestone Steps & Ivy Wall (Occluding p10 x:475, y:655 & p11 x:815, y:685)
    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2.5;
    ctx.fillRect(435, 670, 115, 30);
    ctx.strokeRect(435, 670, 115, 30);

    drawNightIvyClump(795, 695, 95);
  }

  // --------------------------------------------------------------------------
  // THEME 4: MEDITERRANEAN COASTAL TERRACE (Hand-Drawn Illustrated)
  // --------------------------------------------------------------------------
  function renderTerraceBackground(time) {
    // Golden Hour Apricot Sunset Sky
    const sunsetGrad = ctx.createLinearGradient(0, 0, 0, 420);
    sunsetGrad.addColorStop(0, '#f97316');
    sunsetGrad.addColorStop(0.5, '#fbbf24');
    sunsetGrad.addColorStop(1, '#fef3c7');
    ctx.fillStyle = sunsetGrad;
    ctx.fillRect(0, 0, SCENE_W, SCENE_H);

    // Terracotta Stucco Villas
    ctx.fillStyle = '#fed7aa';
    ctx.fillRect(90, 270, 350, 500);
    ctx.fillRect(610, 250, 440, 520);

    // Curved Terracotta Roof Tile Eaves
    drawTerracottaRoofTiles(70, 260, 390, '#ea580c');
    drawTerracottaRoofTiles(590, 240, 480, '#c2410c');

    // Stone Terrace Floor
    ctx.fillStyle = '#ffedd5';
    ctx.fillRect(0, 580, SCENE_W, SCENE_H - 580);
  }

  function renderTerraceForeground(time) {
    // 1. Wooden Pergola & Hanging Grape Ivy (Covers p1 x:165, y:285)
    drawPergolaBeams(120, 290, 150);

    // 2. Mediterranean Blue Wooden Shutters (Covers p2 x:395, y:355 & p4 x:895, y:345)
    drawWindowShutters(365, 360, 80, 80);
    drawWindowShutters(865, 350, 80, 80);

    // 3. Wrought Iron Balcony Railing (Covers p6 x:235, y:525)
    drawBalconyRailing(180, 535, 160);

    // 4. Terracotta Potted Lemon & Olive Trees (Covers p7 x:515, y:565 & p9 x:1025, y:535)
    drawPottedPlant(485, 575, 75, '#eab308');
    drawPottedPlant(995, 545, 75, '#65a30d');

    // 5. Terracotta Bench & Stone Step Borders (Covers p10 x:115, y:685 & p12 x:685, y:705)
    drawTerracottaBench(85, 695, 115);
    drawTerracottaBench(925, 685, 115);
  }

  // --------------------------------------------------------------------------
  // THEME 5: OLD TOWN MARKET SQUARE (Hand-Drawn Illustrated)
  // --------------------------------------------------------------------------
  function renderMarketBackground(time) {
    // Twilight Lavender Sky
    const skyGrad = ctx.createLinearGradient(0, 0, 0, 400);
    skyGrad.addColorStop(0, '#c084fc');
    skyGrad.addColorStop(0.6, '#e9d5ff');
    skyGrad.addColorStop(1, '#f5f3ff');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, SCENE_W, SCENE_H);

    drawDetailedCloud(240, 95, 80, time * 1.5);
    drawDetailedCloud(810, 105, 85, time * 1.2);

    // Medieval Half-Timbered Town Houses
    drawHalfTimberedHouse(80, 240, 320, 500, '#fed7aa');
    drawHalfTimberedHouse(560, 220, 240, 520, '#e2e8f0');
    drawHalfTimberedHouse(880, 250, 320, 490, '#fbcfe8');

    // Cobblestone Square Paving
    drawCobblestonePiazza(0, 560, SCENE_W, SCENE_H - 560);

    // Central Town Hall Clock Dial
    ctx.fillStyle = '#fef08a';
    ctx.strokeStyle = '#451a03';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(680, 225, 34, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  function renderMarketForeground(time) {
    // 1. Striped Canvas Market Awnings (Covers p1 x:145, y:265 & p4 x:825, y:275)
    drawStripedAwning(100, 270, 150, '#ef4444', '#ffffff');
    drawStripedAwning(780, 280, 150, '#3b82f6', '#ffffff');

    // 2. Wooden Fruit & Apple Crates (Covers p2 x:375, y:345 & p7 x:465, y:485)
    drawDetailedFruitCrate(345, 350, 85, '#dc2626'); // Crisp red apples
    drawDetailedFruitCrate(435, 490, 85, '#f59e0b'); // Juicy oranges

    // 3. Heavy Oak Wine Barrels (Covers p6 x:225, y:505 & p10 x:1145, y:515)
    drawDetailedBarrel(200, 515, 65, 75);
    drawDetailedBarrel(1120, 525, 65, 75);

    // 4. Old Market Cart Wheel & Bakery Cart (Covers p11 x:125, y:685 & p13 x:675, y:675)
    drawDetailedCartWheel(120, 700, 48);
    drawDetailedBakeryCart(640, 685, 120);
  }

  // ==========================================================================
  // SHARED HAND-DRAWN 2D PROCEDURAL VECTOR DRAWING HELPERS
  // ==========================================================================

  function drawDetailedCloud(cx, cy, r, offset) {
    ctx.save();
    ctx.translate(Math.sin(offset * 0.05) * 15, 0);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.88)';
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.52, 0, Math.PI * 2);
    ctx.arc(cx + r * 0.42, cy - r * 0.16, r * 0.46, 0, Math.PI * 2);
    ctx.arc(cx + r * 0.82, cy, r * 0.42, 0, Math.PI * 2);
    ctx.arc(cx + r * 0.38, cy + r * 0.12, r * 0.42, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawTownhouseFacade(fx, fy, fw, fh, wallColor, trimColor) {
    ctx.fillStyle = wallColor;
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 3.2;
    ctx.fillRect(fx, fy, fw, fh);
    ctx.strokeRect(fx, fy, fw, fh);

    // Stone quoins (corner stone blocks)
    ctx.fillStyle = '#e2e8f0';
    for (let q = 0; q < fh; q += 32) {
      const qw = (q % 64 === 0) ? 22 : 14;
      ctx.fillRect(fx, fy + q, qw, 20);
      ctx.strokeRect(fx, fy + q, qw, 20);
      ctx.fillRect(fx + fw - qw, fy + q, qw, 20);
      ctx.strokeRect(fx + fw - qw, fy + q, qw, 20);
    }

    // Floor stringcourses
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.moveTo(fx, fy + 140);
    ctx.lineTo(fx + fw, fy + 140);
    ctx.moveTo(fx, fy + 280);
    ctx.lineTo(fx + fw, fy + 280);
    ctx.stroke();
  }

  function drawGnarledTreeTrunk(tx, ty, tw, th) {
    ctx.fillStyle = '#5c2c16';
    ctx.strokeStyle = '#29140a';
    ctx.lineWidth = 3.0;

    ctx.beginPath();
    ctx.moveTo(tx - 6, ty + th);
    ctx.quadraticCurveTo(tx + 4, ty + th * 0.5, tx, ty);
    ctx.lineTo(tx + tw, ty);
    ctx.quadraticCurveTo(tx + tw - 4, ty + th * 0.5, tx + tw + 10, ty + th);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Bark groove lines
    ctx.strokeStyle = '#3d1a0b';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(tx + 8, ty + 20);
    ctx.lineTo(tx + 12, ty + th - 20);
    ctx.moveTo(tx + tw - 8, ty + 40);
    ctx.lineTo(tx + tw - 6, ty + th - 30);
    ctx.stroke();
  }

  function drawIllustratedFoliageCluster(cx, cy, r, darkColor, lightColor) {
    // Dark shadow base
    ctx.fillStyle = darkColor;
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 3.0;
    ctx.beginPath();
    ctx.arc(cx, cy + 4, r * 0.62, 0, Math.PI * 2);
    ctx.arc(cx - r * 0.36, cy - r * 0.18 + 4, r * 0.52, 0, Math.PI * 2);
    ctx.arc(cx + r * 0.36, cy - r * 0.18 + 4, r * 0.52, 0, Math.PI * 2);
    ctx.arc(cx - r * 0.32, cy + r * 0.28 + 4, r * 0.46, 0, Math.PI * 2);
    ctx.arc(cx + r * 0.32, cy + r * 0.28 + 4, r * 0.46, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Light sunlit leaf clusters on top
    ctx.fillStyle = lightColor;
    ctx.beginPath();
    ctx.arc(cx, cy - 8, r * 0.45, 0, Math.PI * 2);
    ctx.arc(cx - r * 0.25, cy - r * 0.22, r * 0.38, 0, Math.PI * 2);
    ctx.arc(cx + r * 0.25, cy - r * 0.22, r * 0.38, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawWaterJets(jx, jy, time) {
    ctx.save();
    ctx.strokeStyle = 'rgba(125, 211, 252, 0.85)';
    ctx.lineWidth = 3.0;
    for (let a = -1; a <= 1; a += 2) {
      ctx.beginPath();
      ctx.moveTo(jx, jy);
      const sway = Math.sin(time * 6 + a) * 4;
      ctx.quadraticCurveTo(jx + a * 24 + sway, jy - 35, jx + a * 38, jy + 15);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawIllustratedParkBench(bx, by, bw) {
    // Cast iron frame legs
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(bx + 12, by + 18, 10, 32);
    ctx.fillRect(bx + bw - 22, by + 18, 10, 32);

    // Polished teak wood slats
    ctx.fillStyle = '#92400e';
    ctx.strokeStyle = '#451a03';
    ctx.lineWidth = 2.4;

    // Backrest slats (occlude pigeon body)
    ctx.fillRect(bx, by - 26, bw, 11);
    ctx.strokeRect(bx, by - 26, bw, 11);
    ctx.fillRect(bx, by - 12, bw, 11);
    ctx.strokeRect(bx, by - 12, bw, 11);

    // Bench seat
    ctx.fillRect(bx - 6, by + 4, bw + 12, 14);
    ctx.strokeRect(bx - 6, by + 4, bw + 12, 14);
  }

  function drawDetailedFlowerHedge(hx, hy, hw, leafColor, flower1, flower2) {
    ctx.fillStyle = leafColor;
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.ellipse(hx + hw / 2, hy, hw / 2, 32, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    for (let f = 0; f < 8; f++) {
      ctx.fillStyle = (f % 2 === 0) ? flower1 : flower2;
      ctx.beginPath();
      ctx.arc(hx + 12 + f * 14, hy - 8 + (f % 2 === 0 ? 10 : -6), 5.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawTulipFlowerbed(tx, ty, tw) {
    ctx.fillStyle = '#166534';
    ctx.fillRect(tx, ty, tw, 22);

    const colors = ['#ef4444', '#f59e0b', '#ec4899', '#a855f7'];
    for (let i = 0; i < 9; i++) {
      ctx.fillStyle = colors[i % colors.length];
      const x = tx + 10 + i * 14;
      ctx.beginPath();
      ctx.arc(x, ty - 6, 6, 0, Math.PI);
      ctx.lineTo(x - 6, ty - 14);
      ctx.lineTo(x, ty - 8);
      ctx.lineTo(x + 6, ty - 14);
      ctx.closePath();
      ctx.fill();
    }
  }

  function drawStoneBridgeArch(bx, by, bw, bh) {
    ctx.fillStyle = '#cbd5e1';
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 3.0;
    ctx.fillRect(bx, by, bw, bh);
    ctx.strokeRect(bx, by, bw, bh);

    // Keystone arch cut
    ctx.beginPath();
    ctx.arc(bx + bw / 2, by + bh, 55, Math.PI, 0);
    ctx.fillStyle = '#0284c7';
    ctx.fill();
    ctx.stroke();
  }

  function drawWeepingWillowTendrils(wx, wy, time) {
    ctx.strokeStyle = '#4ade80';
    ctx.lineWidth = 2.2;
    for (let i = 0; i < 11; i++) {
      const x = wx - 45 + i * 14;
      const sway = Math.sin(time * 2.5 + i) * 8;
      ctx.beginPath();
      ctx.moveTo(x, wy);
      ctx.quadraticCurveTo(x + sway, wy + 48, x + sway * 1.6, wy + 95);
      ctx.stroke();
    }
  }

  function drawIllustratedCattails(rx, ry, count) {
    ctx.lineWidth = 2.6;
    for (let i = 0; i < count; i++) {
      const x = rx + i * 8;
      const h = 58 + (i % 4) * 12;

      ctx.strokeStyle = '#15803d';
      ctx.beginPath();
      ctx.moveTo(x, ry);
      ctx.quadraticCurveTo(x + (i % 2 === 0 ? 7 : -7), ry - h / 2, x, ry - h);
      ctx.stroke();

      ctx.fillStyle = '#451a03';
      ctx.fillRect(x - 3, ry - h, 6, 22);
    }
  }

  function drawIllustratedRiverBoulders(bx, by, bw) {
    ctx.fillStyle = '#64748b';
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2.4;
    for (let b = 0; b < 6; b++) {
      ctx.beginPath();
      ctx.ellipse(bx + b * 22, by, 18, 12, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  }

  function drawIllustratedWaterLily(lx, ly, lr) {
    ctx.fillStyle = '#16a34a';
    ctx.beginPath();
    ctx.arc(lx, ly, lr, 0.35, Math.PI * 2);
    ctx.lineTo(lx, ly);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#f472b6';
    ctx.beginPath();
    ctx.arc(lx, ly - 5, 12, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawTwinklingStars(time) {
    for (let s = 0; s < 48; s++) {
      const sx = (s * 137 + 40) % SCENE_W;
      const sy = (s * 89 + 25) % 360;
      const twinkle = (Math.sin(time * 3.2 + s) + 1) * 0.5;

      ctx.fillStyle = `rgba(255, 255, 255, ${0.35 + twinkle * 0.65})`;
      ctx.beginPath();
      ctx.arc(sx, sy, 1.2 + (s % 4 === 0 ? 1.0 : 0), 0, Math.PI * 2);
      ctx.fill();

      // 4-point cross glint on the brightest stars
      if (s % 7 === 0) {
        ctx.strokeStyle = `rgba(255, 255, 255, ${twinkle * 0.5})`;
        ctx.lineWidth = 1.0;
        ctx.beginPath();
        ctx.moveTo(sx - 4, sy);
        ctx.lineTo(sx + 4, sy);
        ctx.moveTo(sx, sy - 4);
        ctx.lineTo(sx, sy + 4);
        ctx.stroke();
      }
    }
  }

  function drawIllustratedFullMoon(mx, my, mr, time) {
    // Celestial luminous glow halo
    const halo = ctx.createRadialGradient(mx, my, mr * 0.6, mx, my, mr * 2.2);
    halo.addColorStop(0, 'rgba(254, 240, 138, 0.45)');
    halo.addColorStop(0.5, 'rgba(254, 240, 138, 0.15)');
    halo.addColorStop(1, 'rgba(254, 240, 138, 0)');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(mx, my, mr * 2.2, 0, Math.PI * 2);
    ctx.fill();

    // Radiant Moon Disc
    ctx.fillStyle = '#fef9c3';
    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.arc(mx, my, mr, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Lunar Crater Details & Mare Basins
    ctx.fillStyle = 'rgba(234, 179, 8, 0.22)';
    ctx.beginPath();
    ctx.arc(mx - 15, my - 8, 12, 0, Math.PI * 2);
    ctx.arc(mx + 18, my + 14, 15, 0, Math.PI * 2);
    ctx.arc(mx + 8, my - 16, 8, 0, Math.PI * 2);
    ctx.arc(mx - 8, my + 18, 9, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawNightChimney(cx, cy, cw, ch) {
    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2.8;
    ctx.fillRect(cx, cy, cw, ch);
    ctx.strokeRect(cx, cy, cw, ch);

    // Brick mortar lines
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(cx, cy + 22);
    ctx.lineTo(cx + cw, cy + 22);
    ctx.moveTo(cx, cy + 44);
    ctx.lineTo(cx + cw, cy + 44);
    ctx.stroke();

    // Chimney pot top rim
    ctx.fillStyle = '#334155';
    ctx.fillRect(cx - 5, cy - 8, cw + 10, 10);
    ctx.strokeRect(cx - 5, cy - 8, cw + 10, 10);
  }

  function drawIllustratedChimney(cx, cy, cw, ch) {
    ctx.fillStyle = '#b45309';
    ctx.strokeStyle = '#451a03';
    ctx.lineWidth = 2.8;
    ctx.fillRect(cx, cy, cw, ch);
    ctx.strokeRect(cx, cy, cw, ch);

    ctx.strokeStyle = '#fde68a';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(cx, cy + 22);
    ctx.lineTo(cx + cw, cy + 22);
    ctx.moveTo(cx, cy + 44);
    ctx.lineTo(cx + cw, cy + 44);
    ctx.stroke();

    ctx.fillStyle = '#78350f';
    ctx.fillRect(cx - 6, cy - 8, cw + 12, 10);
    ctx.strokeRect(cx - 6, cy - 8, cw + 12, 10);
  }

  function drawIllustratedDormer(wx, wy, ww, wh, glowing) {
    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2.8;
    ctx.fillRect(wx, wy, ww, wh);
    ctx.strokeRect(wx, wy, ww, wh);

    // Window pane (Glowing amber yellow in night scene)
    ctx.fillStyle = glowing ? '#fde047' : '#94a3b8';
    ctx.fillRect(wx + 8, wy + 8, ww - 16, wh - 16);

    // Muntin frame
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(wx + ww / 2, wy + 8);
    ctx.lineTo(wx + ww / 2, wy + wh - 8);
    ctx.moveTo(wx + 8, wy + wh / 2);
    ctx.lineTo(wx + ww - 8, wy + wh / 2);
    ctx.stroke();

    // Window sill
    ctx.fillStyle = '#475569';
    ctx.fillRect(wx - 4, wy + wh - 4, ww + 8, 8);
    ctx.strokeRect(wx - 4, wy + wh - 4, ww + 8, 8);
  }

  function drawNightRoofBalustrade(bx, by, bw) {
    ctx.fillStyle = '#334155';
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2.0;
    ctx.fillRect(bx, by, bw, 8);
    ctx.strokeRect(bx, by, bw, 8);

    for (let i = 0; i < 7; i++) {
      ctx.fillRect(bx + i * (bw / 6), by - 18, 6, 18);
    }
    ctx.fillRect(bx, by - 22, bw, 6);
  }

  function drawVictorianStreetlight(lx, ly, isLit, time) {
    if (isLit) {
      // Warm luminous cone of light illuminating the street
      const cone = ctx.createRadialGradient(lx + 15, ly - 32, 6, lx + 15, ly - 32, 95);
      cone.addColorStop(0, 'rgba(253, 224, 71, 0.55)');
      cone.addColorStop(0.6, 'rgba(253, 224, 71, 0.18)');
      cone.addColorStop(1, 'rgba(253, 224, 71, 0)');
      ctx.fillStyle = cone;
      ctx.beginPath();
      ctx.arc(lx + 15, ly - 32, 95, 0, Math.PI * 2);
      ctx.fill();
    }

    // Cast iron lantern pole
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(lx + 12, ly - 22, 8, 72);
    ctx.strokeRect(lx + 4, ly - 48, 24, 26);
    ctx.fillStyle = isLit ? '#fef08a' : '#94a3b8';
    ctx.fillRect(lx + 6, ly - 46, 20, 22);
  }

  function drawNightIvyClump(ix, iy, iw) {
    ctx.fillStyle = '#14532d';
    for (let i = 0; i < 6; i++) {
      ctx.beginPath();
      ctx.arc(ix + i * 16, iy, 14, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawTerracottaRoofTiles(rx, ry, rw, tileColor) {
    ctx.fillStyle = tileColor;
    ctx.fillRect(rx, ry, rw, 16);
    ctx.strokeStyle = '#431407';
    ctx.lineWidth = 2.0;

    for (let i = 0; i < rw; i += 22) {
      ctx.beginPath();
      ctx.arc(rx + i + 11, ry + 16, 11, Math.PI, 0);
      ctx.stroke();
    }
  }

  function drawPergolaBeams(px, py, pw) {
    ctx.fillStyle = '#78350f';
    ctx.fillRect(px, py, pw, 14);

    ctx.fillStyle = '#15803d';
    for (let v = 0; v < 7; v++) {
      ctx.beginPath();
      ctx.ellipse(px + 14 + v * 22, py + 16, 8, 15, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawWindowShutters(sx, sy, sw, sh) {
    ctx.fillStyle = '#0284c7';
    ctx.strokeStyle = '#0369a1';
    ctx.lineWidth = 2.2;

    ctx.fillRect(sx - 18, sy, 18, sh);
    ctx.strokeRect(sx - 18, sy, 18, sh);

    ctx.fillRect(sx + sw, sy, 18, sh);
    ctx.strokeRect(sx + sw, sy, 18, sh);

    // Bottom flower box
    ctx.fillStyle = '#78350f';
    ctx.fillRect(sx - 10, sy + sh - 8, sw + 20, 16);

    ctx.fillStyle = '#f43f5e';
    for (let f = 0; f < 5; f++) {
      ctx.beginPath();
      ctx.arc(sx + f * 18, sy + sh - 10, 5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawBalconyRailing(rx, ry, rw) {
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(rx, ry, rw, 8);
    for (let i = 0; i < 9; i++) {
      ctx.fillRect(rx + i * (rw / 8), ry + 8, 6, 26);
    }
    ctx.fillRect(rx, ry + 34, rw, 8);
  }

  function drawPottedPlant(px, py, pw, fruitColor) {
    // Terracotta pot
    ctx.fillStyle = '#ea580c';
    ctx.strokeStyle = '#9a3412';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(px + 10, py);
    ctx.lineTo(px + pw - 10, py);
    ctx.lineTo(px + pw - 16, py + 46);
    ctx.lineTo(px + 16, py + 46);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Bush foliage
    ctx.fillStyle = '#15803d';
    ctx.beginPath();
    ctx.arc(px + pw / 2, py - 16, pw * 0.46, 0, Math.PI * 2);
    ctx.fill();

    // Lemons or olives
    ctx.fillStyle = fruitColor;
    ctx.beginPath();
    ctx.arc(px + pw * 0.35, py - 22, 5.5, 0, Math.PI * 2);
    ctx.arc(px + pw * 0.65, py - 14, 5.5, 0, Math.PI * 2);
    ctx.arc(px + pw * 0.50, py - 6, 5.5, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawTerracottaBench(tx, ty, tw) {
    ctx.fillStyle = '#ea580c';
    ctx.strokeStyle = '#9a3412';
    ctx.lineWidth = 2.4;
    ctx.fillRect(tx, ty, tw, 14);
    ctx.strokeRect(tx, ty, tw, 14);
    ctx.fillRect(tx + 8, ty + 14, 16, 22);
    ctx.fillRect(tx + tw - 24, ty + 14, 16, 22);
  }

  function drawHalfTimberedHouse(hx, hy, hw, hh, wallColor) {
    ctx.fillStyle = wallColor;
    ctx.strokeStyle = '#451a03';
    ctx.lineWidth = 3.0;
    ctx.fillRect(hx, hy, hw, hh);
    ctx.strokeRect(hx, hy, hw, hh);

    // Diagonal timber beams
    ctx.beginPath();
    ctx.moveTo(hx, hy);
    ctx.lineTo(hx + hw, hy + 120);
    ctx.moveTo(hx + hw, hy);
    ctx.lineTo(hx, hy + 120);
    ctx.stroke();
  }

  function drawCobblestonePiazza(px, py, pw, ph) {
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(px, py, pw, ph);

    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.2;
    for (let y = py; y < py + ph; y += 18) {
      ctx.beginPath();
      ctx.moveTo(px, y);
      ctx.lineTo(px + pw, y);
      ctx.stroke();
    }
  }

  function drawStripedAwning(ax, ay, aw, color1, color2) {
    const stripes = 6;
    const stripeW = aw / stripes;
    for (let s = 0; s < stripes; s++) {
      ctx.fillStyle = (s % 2 === 0) ? color1 : color2;
      ctx.fillRect(ax + s * stripeW, ay, stripeW, 30);

      // Scalloped fringe
      ctx.beginPath();
      ctx.arc(ax + s * stripeW + stripeW / 2, ay + 30, stripeW / 2, 0, Math.PI);
      ctx.fill();
    }
  }

  function drawDetailedFruitCrate(cx, cy, cw, fruitColor) {
    ctx.fillStyle = '#92400e';
    ctx.strokeStyle = '#451a03';
    ctx.lineWidth = 2.2;
    ctx.fillRect(cx, cy, cw, 36);
    ctx.strokeRect(cx, cy, cw, 36);

    ctx.fillStyle = fruitColor;
    for (let f = 0; f < 5; f++) {
      ctx.beginPath();
      ctx.arc(cx + 12 + f * 15, cy - 2, 7.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawDetailedBarrel(bx, by, bw, bh) {
    ctx.fillStyle = '#78350f';
    ctx.strokeStyle = '#29140a';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.ellipse(bx + bw / 2, by + bh / 2, bw / 2, bh / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.moveTo(bx + 4, by + 18);
    ctx.lineTo(bx + bw - 4, by + 18);
    ctx.moveTo(bx + 4, by + bh - 18);
    ctx.lineTo(bx + bw - 4, by + bh - 18);
    ctx.stroke();
  }

  function drawDetailedCartWheel(wx, wy, wr) {
    ctx.strokeStyle = '#451a03';
    ctx.lineWidth = 5.5;
    ctx.beginPath();
    ctx.arc(wx, wy, wr, 0, Math.PI * 2);
    ctx.stroke();

    ctx.lineWidth = 2.8;
    for (let a = 0; a < 6; a++) {
      const ang = (a * Math.PI) / 3;
      ctx.beginPath();
      ctx.moveTo(wx, wy);
      ctx.lineTo(wx + Math.cos(ang) * wr, wy + Math.sin(ang) * wr);
      ctx.stroke();
    }
  }

  function drawDetailedBakeryCart(cx, cy, cw) {
    ctx.fillStyle = '#fde68a';
    ctx.fillRect(cx, cy, cw, 32);
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 2.2;
    ctx.strokeRect(cx, cy, cw, 32);

    ctx.fillStyle = '#f59e0b';
    for (let b = 0; b < 4; b++) {
      ctx.beginPath();
      ctx.ellipse(cx + 16 + b * 26, cy - 4, 12, 6.5, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawCurvedCobblestonePath(startX, startY, endX, endY) {
    ctx.fillStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.bezierCurveTo(startX + 80, startY + 100, endX - 80, endY - 100, endX - 60, endY);
    ctx.lineTo(endX + 60, endY);
    ctx.bezierCurveTo(endX + 40, endY - 100, startX + 180, startY + 100, startX + 120, startY);
    ctx.closePath();
    ctx.fill();
  }

  // ==========================================================================
  // CLICK DETECTION & PIGEON FINDING
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

    if (hasMoved) return;

    const totalScale = baseScale * zoom;
    const rect = canvas.getBoundingClientRect();
    const canvasClickX = e.clientX - rect.left;
    const canvasClickY = e.clientY - rect.top;
    const worldX = (canvasClickX - panX) / totalScale;
    const worldY = (canvasClickY - panY) / totalScale;

    checkPigeonClick(worldX, worldY);
  }

  function clampPan() {
    const totalScale = baseScale * zoom;
    const curW = SCENE_W * totalScale;
    const curH = SCENE_H * totalScale;

    const minX = canvasW - curW - 200;
    const maxX = 200;
    const minY = canvasH - curH - 200;
    const maxY = 200;

    panX = Math.max(minX, Math.min(maxX, panX));
    panY = Math.max(minY, Math.min(maxY, panY));
  }

  function checkPigeonClick(wx, wy) {
    for (let i = currentPigeons.length - 1; i >= 0; i--) {
      const p = currentPigeons[i];
      if (p.found || p.disappeared) continue;

      const radius = 48 * p.scale;
      const dist = Math.hypot(wx - p.x, wy - (p.y - 6));

      if (dist <= radius) {
        p.found = true;
        p.popAnim = 1.0;
        foundPigeonsCount++;

        AudioEngine.playCoo();
        AudioEngine.playChime();

        spawnFeatherBurst(p.x, p.y);
        spawnFloatingScore(p.x, p.y);

        updateHUD();

        if (activeHintPigeon && activeHintPigeon.id === p.id) {
          activeHintPigeon = null;
        }

        const level = LEVELS[currentLevelIdx];
        if (foundPigeonsCount >= level.totalPigeons) {
          setTimeout(handleLevelWin, 750);
        }
        return true;
      }
    }
    return false;
  }

  window.checkPigeonClick = checkPigeonClick;
  window.findPigeonById = function (id) {
    const p = currentPigeons.find(x => x.id === id);
    if (p) return checkPigeonClick(p.x, p.y);
    return false;
  };
  window.loadLevel = loadLevel;
  window.getCurrentLevel = () => LEVELS[currentLevelIdx];
  window.getCurrentPigeons = () => currentPigeons;

  // ==========================================================================
  // LEVEL COMPLETE & WIN SCREEN
  // ==========================================================================
  function handleLevelWin() {
    AudioEngine.playVictory();
    Confetti.launch(110);

    const elapsedSeconds = Math.round((Date.now() - levelStartTime) / 1000);
    const level = LEVELS[currentLevelIdx];

    let stars = 3;
    if (elapsedSeconds > 90) stars = 1;
    else if (elapsedSeconds > 45) stars = 2;

    levelProgress[currentLevelIdx] = Math.max(levelProgress[currentLevelIdx] || 0, stars);
    localStorage.setItem('hp_level_stars', JSON.stringify(levelProgress));

    let unlocked = parseInt(localStorage.getItem('hp_unlocked') || '1', 10);
    if (currentLevelIdx + 2 > unlocked) {
      unlocked = currentLevelIdx + 2;
      localStorage.setItem('hp_unlocked', unlocked.toString());
    }

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

    if (winModal) winModal.classList.remove('hidden');
  }

  // ==========================================================================
  // HINT RADAR
  // ==========================================================================
  function triggerHint() {
    if (hintCooldown) return;
    const unfound = currentPigeons.filter(p => !p.found && !p.disappeared);
    if (unfound.length === 0) return;

    AudioEngine.playHint();
    hintCooldown = true;

    activeHintPigeon = unfound[Math.floor(Math.random() * unfound.length)];

    const totalScale = baseScale * zoom;
    panX = canvasW / 2 - activeHintPigeon.x * totalScale;
    panY = canvasH / 2 - activeHintPigeon.y * totalScale;
    clampPan();

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

    // PASS 1: Illustrated Background
    renderSceneBackground(level.theme, time);

    // PASS 2: Interactive Pigeons
    currentPigeons.forEach(p => {
      drawPigeon(p, time);
    });

    // PASS 3: Foreground Natural Occluders
    renderSceneForeground(level.theme, time);

    // PASS 4: Floating Particle Effects
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
        if (reqFn) reqFn.call(docEl, { navigationUI: 'hide' }).catch(() => {});
      }
    } catch (e) {
      console.warn('Fullscreen error:', e);
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
  // UI & NAVIGATION EVENT BINDINGS
  // ==========================================================================
  function bindEvents() {
    canvas.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

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

    // Zoom Controls
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
    const btnPlay = document.getElementById('btnMenuPlay') || document.getElementById('btnPlay');
    if (btnPlay) {
      btnPlay.addEventListener('click', () => {
        AudioEngine.playClick();
        const menuScreen = document.getElementById('menuScreen');
        if (menuScreen) menuScreen.classList.add('hidden');
        loadLevel(currentLevelIdx);
      });
    }

    const btnLevels = document.getElementById('btnMenuLevels') || document.getElementById('btnLevels');
    if (btnLevels) {
      btnLevels.addEventListener('click', () => {
        AudioEngine.playClick();
        openLevelSelectModal();
      });
    }

    const btnMenuSettings = document.getElementById('btnMenuSettings');
    if (btnMenuSettings) {
      btnMenuSettings.addEventListener('click', () => {
        AudioEngine.playClick();
        openSettingsModal();
      });
    }

    const btnMenuFullscreen = document.getElementById('btnMenuFullscreen');
    if (btnMenuFullscreen) {
      btnMenuFullscreen.addEventListener('click', () => {
        AudioEngine.playClick();
        toggleFullscreen();
      });
    }

    setupModals();
  }

  function setZoom(newZoom, focalX, focalY) {
    const oldZoom = zoom;
    zoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newZoom));

    const scaleRatio = zoom / oldZoom;
    panX = focalX - (focalX - panX) * scaleRatio;
    panY = focalY - (focalY - panY) * scaleRatio;

    clampPan();
  }

  function setupModals() {
    const btnCloseSettings = document.getElementById('btnCloseSettings');
    const settingsModal = document.getElementById('settingsModal');
    const toggleSfx = document.getElementById('settingSfx') || document.getElementById('toggleSfx');
    const toggleMusic = document.getElementById('settingMusic') || document.getElementById('toggleMusic');
    const settingFullscreen = document.getElementById('settingFullscreen');
    const btnResetProgress = document.getElementById('btnResetProgress');

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

    if (settingFullscreen) {
      settingFullscreen.addEventListener('change', () => {
        AudioEngine.playClick();
        toggleFullscreen();
      });
    }

    if (btnResetProgress) {
      btnResetProgress.addEventListener('click', () => {
        AudioEngine.playClick();
        if (confirm('Reset all game progress and stars?')) {
          localStorage.removeItem('hp_level_stars');
          localStorage.removeItem('hp_unlocked');
          levelProgress = {};
          renderLevelSelectGrid();
          loadLevel(0);
          if (settingsModal) settingsModal.classList.add('hidden');
        }
      });
    }

    const btnCloseLevels = document.getElementById('btnCloseLevels');
    const levelSelectModal = document.getElementById('levelSelectModal');
    if (btnCloseLevels && levelSelectModal) {
      btnCloseLevels.addEventListener('click', () => {
        AudioEngine.playClick();
        levelSelectModal.classList.add('hidden');
      });
    }

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

    const btnNextLevel = document.getElementById('btnNextLevel') || document.getElementById('btnWinNext');
    const btnReplayWin = document.getElementById('btnReplayWin') || document.getElementById('btnWinReplay');
    const winModal = document.getElementById('winModal');

    if (btnNextLevel) {
      btnNextLevel.addEventListener('click', () => {
        AudioEngine.playClick();
        if (winModal) winModal.classList.add('hidden');
        if (currentLevelIdx + 1 < LEVELS.length) {
          loadLevel(currentLevelIdx + 1);
        } else {
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
  }

  function returnToMainMenu() {
    const menuScreen = document.getElementById('menuScreen');
    if (menuScreen) menuScreen.classList.remove('hidden');
    renderLevelSelectGrid();
  }

  function openSettingsModal() {
    const modal = document.getElementById('settingsModal');
    const toggleSfx = document.getElementById('settingSfx') || document.getElementById('toggleSfx');
    const toggleMusic = document.getElementById('settingMusic') || document.getElementById('toggleMusic');
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
    const grid = document.getElementById('levelGrid') || document.getElementById('levelsGrid');
    const starText = document.getElementById('menuTotalStars') || document.getElementById('levelsTotalStars');
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

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
