/* ==========================================================================
   HIDDEN PIGEON - POKI STYLE SCENIC PUZZLE GAME
   Procedural 2D European cartoon vector art, interactive pigeons, audio synth
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

    // Melodic notes for Parisian / Italian cafe acoustic waltz BGM
    // Chords: Cmaj7 - Am7 - Dm7 - G7
    const WALTZ_MELODY = [
      { f: 261.63, d: 0.35 }, { f: 329.63, d: 0.25 }, { f: 392.00, d: 0.25 }, // C E G
      { f: 493.88, d: 0.45 }, { f: 392.00, d: 0.25 }, { f: 329.63, d: 0.25 }, // B G E
      { f: 220.00, d: 0.35 }, { f: 261.63, d: 0.25 }, { f: 329.63, d: 0.25 }, // A C E
      { f: 440.00, d: 0.45 }, { f: 329.63, d: 0.25 }, { f: 261.63, d: 0.25 }, // A E C
      { f: 293.66, d: 0.35 }, { f: 349.23, d: 0.25 }, { f: 440.00, d: 0.25 }, // D F A
      { f: 523.25, d: 0.45 }, { f: 440.00, d: 0.25 }, { f: 349.23, d: 0.25 }, // C A F
      { f: 196.00, d: 0.35 }, { f: 246.94, d: 0.25 }, { f: 293.66, d: 0.25 }, // G B D
      { f: 392.00, d: 0.50 }, { f: 349.23, d: 0.25 }, { f: 293.66, d: 0.25 }  // G F D
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

      // Soft warm acoustic pluck tone
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
      playClick: function () {
        if (!sfxEnabled) return;
        const ac = getContext();
        if (!ac) return;
        const now = ac.currentTime;
        const osc = ac.createOscillator();
        const gain = ac.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(620, now);
        osc.frequency.exponentialRampToValueAtTime(320, now + 0.06);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.06);
        osc.connect(gain);
        gain.connect(ac.destination);
        osc.start(now);
        osc.stop(now + 0.06);
      },
      // Realistic cute pigeon cooing
      playCoo: function () {
        if (!sfxEnabled) return;
        const ac = getContext();
        if (!ac) return;
        const now = ac.currentTime;

        // Two-part coo sound: "Coo - roooo"
        [
          { t: 0, f1: 340, f2: 380, dur: 0.18, vol: 0.16 },
          { t: 0.22, f1: 360, f2: 290, dur: 0.35, vol: 0.22 }
        ].forEach(p => {
          const osc = ac.createOscillator();
          const vibrato = ac.createOscillator();
          const vibGain = ac.createGain();
          const gain = ac.createGain();

          osc.type = 'sine';
          vibrato.frequency.value = 18; // Flutter
          vibGain.gain.value = 15;
          vibrato.connect(osc.frequency);

          osc.frequency.setValueAtTime(p.f1, now + p.t);
          osc.frequency.exponentialRampToValueAtTime(p.f2, now + p.t + p.dur);

          gain.gain.setValueAtTime(0.001, now + p.t);
          gain.gain.linearRampToValueAtTime(p.vol, now + p.t + 0.04);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + p.t + p.dur);

          osc.connect(gain);
          gain.connect(ac.destination);

          vibrato.start(now + p.t);
          vibrato.stop(now + p.t + p.dur);
          osc.start(now + p.t);
          osc.stop(now + p.t + p.dur);
        });

        // Wing flap noise
        this.playWingFlutter();
      },
      playWingFlutter: function () {
        if (!sfxEnabled) return;
        const ac = getContext();
        if (!ac) return;
        const now = ac.currentTime;
        const bufferSize = Math.floor(ac.sampleRate * 0.22);
        const buffer = ac.createBuffer(1, bufferSize, ac.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = (Math.random() * 2 - 1) * Math.sin(i / 180);
        }
        const noise = ac.createBufferSource();
        noise.buffer = buffer;

        const filter = ac.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(450, now);
        filter.frequency.exponentialRampToValueAtTime(150, now + 0.2);

        const gain = ac.createGain();
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ac.destination);

        noise.start(now);
      },
      playChime: function () {
        if (!sfxEnabled) return;
        const ac = getContext();
        if (!ac) return;
        const now = ac.currentTime;
        [523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
          const osc = ac.createOscillator();
          const gain = ac.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.06);

          gain.gain.setValueAtTime(0.001, now + idx * 0.06);
          gain.gain.linearRampToValueAtTime(0.14, now + idx * 0.06 + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.06 + 0.4);

          osc.connect(gain);
          gain.connect(ac.destination);
          osc.start(now + idx * 0.06);
          osc.stop(now + idx * 0.06 + 0.45);
        });
      },
      playHint: function () {
        if (!sfxEnabled) return;
        const ac = getContext();
        if (!ac) return;
        const now = ac.currentTime;
        const osc = ac.createOscillator();
        const gain = ac.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.exponentialRampToValueAtTime(1320, now + 0.15);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.connect(gain);
        gain.connect(ac.destination);
        osc.start(now);
        osc.stop(now + 0.25);
      },
      playVictory: function () {
        if (!sfxEnabled) return;
        const ac = getContext();
        if (!ac) return;
        const now = ac.currentTime;
        // Joyful fanfare: C - G - C - E - G
        const fanfare = [
          { f: 523.25, t: 0, d: 0.15 },
          { f: 659.25, t: 0.14, d: 0.15 },
          { f: 783.99, t: 0.28, d: 0.18 },
          { f: 1046.50, t: 0.46, d: 0.45 }
        ];
        fanfare.forEach(note => {
          const osc = ac.createOscillator();
          const gain = ac.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(note.f, now + note.t);
          gain.gain.setValueAtTime(0.001, now + note.t);
          gain.gain.linearRampToValueAtTime(0.2, now + note.t + 0.03);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + note.t + note.d);
          osc.connect(gain);
          gain.connect(ac.destination);
          osc.start(now + note.t);
          osc.stop(now + note.t + note.d);
        });
      }
    };
  })();

  // ==========================================================================
  // CONFETTI BURST SYSTEM
  // ==========================================================================
  const Confetti = (function () {
    const canvas = document.getElementById('confettiCanvas');
    const ctx = canvas ? canvas.getContext('2d') : null;
    let particles = [];
    let running = false;
    const colors = ['#f44336', '#2196f3', '#4caf50', '#ffeb3b', '#9c27b0', '#ff9800', '#e91e63'];

    function resize() {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resize);

    function loop() {
      if (!running || !ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.24;
        p.rot += p.vr;
        p.alpha -= 0.011;
        if (p.alpha > 0) {
          alive = true;
          ctx.save();
          ctx.globalAlpha = p.alpha;
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 1.3);
          ctx.restore();
        }
      }
      if (alive) {
        requestAnimationFrame(loop);
      } else {
        running = false;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }

    return {
      launch: function (count) {
        if (!canvas) return;
        resize();
        particles = [];
        const n = count || 90;
        for (let i = 0; i < n; i++) {
          particles.push({
            x: canvas.width * 0.5 + (Math.random() - 0.5) * 200,
            y: canvas.height * 0.45,
            vx: (Math.random() - 0.5) * 18,
            vy: -9 - Math.random() * 14,
            vr: (Math.random() - 0.5) * 0.35,
            rot: Math.random() * Math.PI,
            size: 7 + Math.random() * 9,
            color: colors[Math.floor(Math.random() * colors.length)],
            alpha: 1
          });
        }
        running = true;
        requestAnimationFrame(loop);
      }
    };
  })();

  // ==========================================================================
  // LEVEL DEFINITIONS & SCENIC ART CONFIGURATIONS
  // Each level features a unique European setting with 10 to 18 hidden pigeons
  // ==========================================================================
  const LEVELS = [
    {
      id: 1,
      name: 'Venetian Piazza',
      theme: 'venice',
      totalPigeons: 10,
      skyColor: '#b3e5fc',
      groundColor: '#d7ccc8',
      pigeons: [
        { id: 1, x: 260, y: 310, scale: 0.85, rot: 0, accessory: 'crumb', flip: false },
        { id: 2, x: 580, y: 190, scale: 0.75, rot: -0.1, accessory: null, flip: true },
        { id: 3, x: 840, y: 440, scale: 0.90, rot: 0, accessory: 'sunglasses', flip: false },
        { id: 4, x: 420, y: 520, scale: 0.95, rot: 0.05, accessory: null, flip: true },
        { id: 5, x: 160, y: 640, scale: 1.05, rot: 0, accessory: 'beret', flip: false },
        { id: 6, x: 990, y: 280, scale: 0.70, rot: 0, accessory: null, flip: true },
        { id: 7, x: 710, y: 590, scale: 0.95, rot: 0, accessory: null, flip: false },
        { id: 8, x: 330, y: 730, scale: 1.10, rot: -0.05, accessory: 'crumb', flip: true },
        { id: 9, x: 1120, y: 660, scale: 1.00, rot: 0, accessory: null, flip: false },
        { id: 10, x: 50, y: 400, scale: 0.80, rot: 0.1, accessory: null, flip: false }
      ]
    },
    {
      id: 2,
      name: 'Parisian Boulangerie',
      theme: 'paris',
      totalPigeons: 12,
      skyColor: '#e0f2f1',
      groundColor: '#cfd8dc',
      pigeons: [
        { id: 1, x: 180, y: 220, scale: 0.80, rot: 0, accessory: 'beret', flip: false },
        { id: 2, x: 440, y: 340, scale: 0.85, rot: 0.05, accessory: 'croissant', flip: true },
        { id: 3, x: 720, y: 170, scale: 0.70, rot: -0.1, accessory: null, flip: false },
        { id: 4, x: 890, y: 430, scale: 0.95, rot: 0, accessory: null, flip: true },
        { id: 5, x: 290, y: 580, scale: 1.00, rot: 0, accessory: 'sunglasses', flip: false },
        { id: 6, x: 620, y: 640, scale: 1.05, rot: 0.05, accessory: 'crumb', flip: true },
        { id: 7, x: 1050, y: 290, scale: 0.75, rot: 0, accessory: null, flip: false },
        { id: 8, x: 130, y: 710, scale: 1.10, rot: -0.05, accessory: null, flip: true },
        { id: 9, x: 790, y: 740, scale: 1.15, rot: 0, accessory: 'beret', flip: false },
        { id: 10, x: 980, y: 580, scale: 0.90, rot: 0.08, accessory: null, flip: true },
        { id: 11, x: 510, y: 210, scale: 0.65, rot: 0, accessory: null, flip: false },
        { id: 12, x: 1160, y: 710, scale: 1.00, rot: 0, accessory: 'crumb', flip: false }
      ]
    },
    {
      id: 3,
      name: 'Rooftop Garden Terrace',
      theme: 'terrace',
      totalPigeons: 14,
      skyColor: '#fff3e0',
      groundColor: '#ffe0b2',
      pigeons: [
        { id: 1, x: 140, y: 180, scale: 0.75, rot: 0, accessory: null, flip: false },
        { id: 2, x: 380, y: 290, scale: 0.85, rot: 0.05, accessory: 'flower', flip: true },
        { id: 3, x: 640, y: 210, scale: 0.70, rot: -0.1, accessory: null, flip: false },
        { id: 4, x: 860, y: 350, scale: 0.90, rot: 0, accessory: 'sunglasses', flip: true },
        { id: 5, x: 1080, y: 240, scale: 0.75, rot: 0.08, accessory: null, flip: false },
        { id: 6, x: 230, y: 480, scale: 0.95, rot: 0, accessory: null, flip: true },
        { id: 7, x: 520, y: 560, scale: 1.00, rot: -0.05, accessory: 'crumb', flip: false },
        { id: 8, x: 760, y: 510, scale: 0.90, rot: 0, accessory: null, flip: true },
        { id: 9, x: 990, y: 490, scale: 0.95, rot: 0.06, accessory: 'flower', flip: false },
        { id: 10, x: 1150, y: 620, scale: 1.05, rot: 0, accessory: null, flip: true },
        { id: 11, x: 90, y: 670, scale: 1.10, rot: 0, accessory: 'sunglasses', flip: false },
        { id: 12, x: 380, y: 720, scale: 1.15, rot: -0.05, accessory: null, flip: true },
        { id: 13, x: 670, y: 710, scale: 1.10, rot: 0, accessory: 'crumb', flip: false },
        { id: 14, x: 880, y: 690, scale: 1.05, rot: 0.04, accessory: null, flip: true }
      ]
    },
    {
      id: 4,
      name: 'Old Town Market Square',
      theme: 'market',
      totalPigeons: 16,
      skyColor: '#f3e5f5',
      groundColor: '#d7ccc8',
      pigeons: [
        { id: 1, x: 120, y: 200, scale: 0.70, rot: 0, accessory: null, flip: false },
        { id: 2, x: 310, y: 330, scale: 0.85, rot: -0.05, accessory: 'crumb', flip: true },
        { id: 3, x: 530, y: 190, scale: 0.65, rot: 0, accessory: null, flip: false },
        { id: 4, x: 780, y: 260, scale: 0.75, rot: 0.08, accessory: 'beret', flip: true },
        { id: 5, x: 960, y: 180, scale: 0.70, rot: -0.06, accessory: null, flip: false },
        { id: 6, x: 1130, y: 320, scale: 0.80, rot: 0, accessory: null, flip: true },
        { id: 7, x: 210, y: 490, scale: 0.95, rot: 0, accessory: 'sunglasses', flip: false },
        { id: 8, x: 440, y: 440, scale: 0.90, rot: 0.05, accessory: null, flip: true },
        { id: 9, x: 680, y: 460, scale: 0.95, rot: -0.04, accessory: 'crumb', flip: false },
        { id: 10, x: 890, y: 480, scale: 0.90, rot: 0, accessory: null, flip: true },
        { id: 11, x: 70, y: 680, scale: 1.10, rot: 0, accessory: null, flip: false },
        { id: 12, x: 310, y: 670, scale: 1.05, rot: -0.05, accessory: 'flower', flip: true },
        { id: 13, x: 560, y: 650, scale: 1.00, rot: 0, accessory: null, flip: false },
        { id: 14, x: 790, y: 690, scale: 1.12, rot: 0.05, accessory: 'crumb', flip: true },
        { id: 15, x: 1020, y: 640, scale: 1.05, rot: 0, accessory: null, flip: false },
        { id: 16, x: 1180, y: 720, scale: 1.15, rot: -0.04, accessory: 'beret', flip: true }
      ]
    },
    {
      id: 5,
      name: 'Royal Botanical Conservatory',
      theme: 'conservatory',
      totalPigeons: 18,
      skyColor: '#e8f5e9',
      groundColor: '#c8e6c9',
      pigeons: [
        { id: 1, x: 110, y: 190, scale: 0.70, rot: 0, accessory: null, flip: false },
        { id: 2, x: 290, y: 260, scale: 0.75, rot: 0.05, accessory: 'crown', flip: true },
        { id: 3, x: 480, y: 180, scale: 0.65, rot: -0.08, accessory: null, flip: false },
        { id: 4, x: 690, y: 220, scale: 0.70, rot: 0, accessory: 'flower', flip: true },
        { id: 5, x: 890, y: 170, scale: 0.65, rot: 0.06, accessory: null, flip: false },
        { id: 6, x: 1090, y: 240, scale: 0.75, rot: 0, accessory: null, flip: true },
        { id: 7, x: 190, y: 410, scale: 0.85, rot: -0.05, accessory: null, flip: false },
        { id: 8, x: 390, y: 440, scale: 0.90, rot: 0, accessory: 'sunglasses', flip: true },
        { id: 9, x: 590, y: 390, scale: 0.85, rot: 0.05, accessory: null, flip: false },
        { id: 10, x: 790, y: 420, scale: 0.90, rot: -0.04, accessory: 'crumb', flip: true },
        { id: 11, x: 990, y: 410, scale: 0.88, rot: 0, accessory: null, flip: false },
        { id: 12, x: 1170, y: 470, scale: 0.95, rot: 0.06, accessory: null, flip: true },
        { id: 13, x: 80, y: 640, scale: 1.05, rot: 0, accessory: 'flower', flip: false },
        { id: 14, x: 310, y: 670, scale: 1.10, rot: -0.05, accessory: null, flip: true },
        { id: 15, x: 540, y: 620, scale: 1.00, rot: 0, accessory: 'crown', flip: false },
        { id: 16, x: 760, y: 680, scale: 1.12, rot: 0.04, accessory: null, flip: true },
        { id: 17, x: 970, y: 650, scale: 1.05, rot: 0, accessory: 'crumb', flip: false },
        { id: 18, x: 1190, y: 730, scale: 1.15, rot: -0.05, accessory: 'sunglasses', flip: true }
      ]
    }
  ];

  // ==========================================================================
  // GAME ENGINE STATE
  // ==========================================================================
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');

  // Virtual Scene Resolution (Reference Canvas dimensions)
  const SCENE_W = 1280;
  const SCENE_H = 820;

  let canvasW = window.innerWidth;
  let canvasH = window.innerHeight;

  // Viewport Transform (Pan & Zoom)
  let zoom = 1.0;
  let baseScale = 1.0;
  let panX = 0;
  let panY = 0;
  let isPanning = false;
  let startPanX = 0;
  let startPanY = 0;
  let hasMoved = false;

  // Touch Pinch State
  let lastTouchDist = 0;

  // Gameplay State
  let currentLevelIdx = parseInt(localStorage.getItem('hp_current_level') || '0', 10);
  if (currentLevelIdx < 0 || currentLevelIdx >= LEVELS.length) currentLevelIdx = 0;

  let levelProgress = JSON.parse(localStorage.getItem('hp_level_stars') || '{}');
  let currentPigeons = [];
  let foundPigeonsCount = 0;
  let levelStartTime = Date.now();
  let hintCooldown = false;
  let activeHintPigeon = null;
  let hintPulseTimer = 0;

  // Floating score animations & feathers
  let floatingFx = [];

  // ==========================================================================
  // RESIZE & VIEWPORT SCALING
  // ==========================================================================
  function resizeCanvas() {
    canvasW = window.innerWidth;
    canvasH = window.innerHeight;
    canvas.width = canvasW;
    canvas.height = canvasH;

    // Fit virtual scene into window
    baseScale = Math.min(canvasW / SCENE_W, canvasH / SCENE_H);
    resetCamera();
  }

  function resetCamera() {
    zoom = 1.0;
    panX = (canvasW - SCENE_W * baseScale) / 2;
    panY = (canvasH - SCENE_H * baseScale) / 2;
  }

  window.addEventListener('resize', resizeCanvas);
  window.addEventListener('orientationchange', () => setTimeout(resizeCanvas, 150));

  // ==========================================================================
  // LEVEL INITIALIZATION
  // ==========================================================================
  function loadLevel(idx) {
    if (idx < 0) idx = 0;
    if (idx >= LEVELS.length) idx = LEVELS.length - 1;
    currentLevelIdx = idx;
    localStorage.setItem('hp_current_level', idx.toString());

    const level = LEVELS[currentLevelIdx];
    foundPigeonsCount = 0;
    levelStartTime = Date.now();
    activeHintPigeon = null;
    floatingFx = [];

    // Clone pigeons with state
    currentPigeons = level.pigeons.map(p => ({
      ...p,
      found: false,
      popAnim: 0,
      flapAnim: 0,
      flyOffX: 0,
      flyOffY: 0,
      wingCycle: Math.random() * Math.PI * 2
    }));

    updateHUD();
    resetCamera();
    closeAllModals();

    document.getElementById('levelBadgeNum').textContent = `Level ${level.id}`;
    document.getElementById('levelBadgeName').textContent = level.name;
  }

  function updateHUD() {
    const level = LEVELS[currentLevelIdx];
    const counterText = document.getElementById('pigeonCounterText');
    if (counterText) {
      counterText.textContent = `${foundPigeonsCount} / ${level.totalPigeons}`;
    }

    const badge = document.getElementById('pigeonCounterBadge');
    if (badge) {
      badge.classList.remove('bump');
      void badge.offsetWidth; // Trigger reflow
      badge.classList.add('bump');
    }
  }

  // ==========================================================================
  // PIGEON VECTOR ART DRAWING
  // Renders plump, cute, expressive pigeons with accessories and animations
  // ==========================================================================
  function drawPigeon(p, time) {
    ctx.save();
    ctx.translate(p.x + p.flyOffX, p.y + p.flyOffY);
    ctx.scale((p.flip ? -1 : 1) * p.scale, p.scale);
    ctx.rotate(p.rot);

    // Subtle breathing / head bob animation
    const bob = Math.sin(time * 0.004 + p.id) * 2;
    const wingFlap = p.flapAnim > 0 ? Math.sin(time * 0.035) * 18 : 0;

    // Discovery Glow Aura (if just found)
    if (p.popAnim > 0) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(0, bob, 42 * (1 + (1 - p.popAnim) * 0.5), 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 215, 0, ${p.popAnim * 0.55})`;
      ctx.fill();
      ctx.restore();
    }

    // Hint Radar Target Pulse
    if (activeHintPigeon && activeHintPigeon.id === p.id && !p.found) {
      ctx.save();
      const pulseSize = 35 + Math.sin(time * 0.01) * 8;
      ctx.beginPath();
      ctx.arc(0, bob, pulseSize, 0, Math.PI * 2);
      ctx.strokeStyle = '#ff9800';
      ctx.lineWidth = 4;
      ctx.setLineDash([8, 6]);
      ctx.stroke();
      ctx.fillStyle = 'rgba(255, 152, 0, 0.2)';
      ctx.fill();
      ctx.restore();
    }

    // 1. Little Pink Feet
    ctx.fillStyle = '#ff8a80';
    ctx.beginPath();
    ctx.arc(-8, 24 + bob, 3.5, 0, Math.PI * 2);
    ctx.arc(6, 24 + bob, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // 2. Main Plump Pigeon Body (Soft Blue-Grey Gradient)
    const bodyGrad = ctx.createRadialGradient(-4, -2 + bob, 6, 0, bob, 26);
    bodyGrad.addColorStop(0, '#90a4ae');
    bodyGrad.addColorStop(0.7, '#607d8b');
    bodyGrad.addColorStop(1, '#455a64');
    ctx.fillStyle = bodyGrad;

    ctx.beginPath();
    ctx.ellipse(0, bob, 22, 18, 0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#37474f';
    ctx.stroke();

    // 3. Pigeon Tail Feathers
    ctx.fillStyle = '#37474f';
    ctx.beginPath();
    ctx.moveTo(-16, bob - 2);
    ctx.lineTo(-32, bob + 4);
    ctx.lineTo(-30, bob + 12);
    ctx.lineTo(-14, bob + 8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 4. Pigeon Head & Neck
    ctx.fillStyle = '#78909c';
    ctx.beginPath();
    ctx.arc(14, -12 + bob, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Iridescent Neck Sheen (Purple & Green Ring)
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(12, -4 + bob, 8, 4, 0.2, 0, Math.PI * 2);
    const sheenGrad = ctx.createLinearGradient(6, -6, 18, -2);
    sheenGrad.addColorStop(0, '#ab47bc');
    sheenGrad.addColorStop(1, '#26a69a');
    ctx.fillStyle = sheenGrad;
    ctx.fill();
    ctx.restore();

    // 5. Cute Eye with Shiny Highlight
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(18, -14 + bob, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#212121';
    ctx.beginPath();
    ctx.arc(19, -14 + bob, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(20, -15 + bob, 1.2, 0, Math.PI * 2);
    ctx.fill();

    // 6. Orange Beak
    ctx.fillStyle = '#ff9800';
    ctx.beginPath();
    ctx.moveTo(25, -13 + bob);
    ctx.lineTo(33, -11 + bob);
    ctx.lineTo(25, -8 + bob);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#e65100';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // 7. Folded Wing (with flapping motion when spotted)
    ctx.save();
    ctx.translate(-2, -4 + bob);
    ctx.rotate(wingFlap * Math.PI / 180);
    const wingGrad = ctx.createLinearGradient(-14, -8, 10, 14);
    wingGrad.addColorStop(0, '#78909c');
    wingGrad.addColorStop(0.6, '#546e7a');
    wingGrad.addColorStop(1, '#37474f');
    ctx.fillStyle = wingGrad;
    ctx.beginPath();
    ctx.ellipse(0, 0, 16, 10, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#263238';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Feather Accent Stripes on Wing
    ctx.strokeStyle = '#263238';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(-6, -2);
    ctx.lineTo(8, 4);
    ctx.moveTo(-8, 3);
    ctx.lineTo(6, 8);
    ctx.stroke();
    ctx.restore();

    // 8. Unique Cheeky Accessories
    if (p.accessory === 'beret') {
      // Classic French Black Beret
      ctx.fillStyle = '#212121';
      ctx.beginPath();
      ctx.ellipse(14, -24 + bob, 10, 4.5, 0.25, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(14, -27 + bob, 1.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.accessory === 'sunglasses') {
      // Cool Pixel / Black shades
      ctx.fillStyle = '#111';
      ctx.fillRect(15, -17 + bob, 9, 6);
      ctx.fillRect(10, -16 + bob, 5, 2);
    } else if (p.accessory === 'crumb' || p.accessory === 'croissant') {
      // Tiny Breadcrumb / Croissant in Beak
      ctx.fillStyle = '#d7ccc8';
      ctx.strokeStyle = '#8d6e63';
      ctx.beginPath();
      ctx.arc(35, -10 + bob, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else if (p.accessory === 'flower') {
      // Little Pink Rose / Daisy on head
      ctx.fillStyle = '#ff4081';
      ctx.beginPath();
      ctx.arc(12, -24 + bob, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffeb3b';
      ctx.beginPath();
      ctx.arc(12, -24 + bob, 1.8, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.accessory === 'crown') {
      // Golden Royal Crown
      ctx.fillStyle = '#ffd700';
      ctx.strokeStyle = '#b78103';
      ctx.beginPath();
      ctx.moveTo(7, -23 + bob);
      ctx.lineTo(9, -29 + bob);
      ctx.lineTo(13, -25 + bob);
      ctx.lineTo(17, -29 + bob);
      ctx.lineTo(19, -23 + bob);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    // 9. Found Stamp Badge (Golden Laurel / Star Stamp)
    if (p.found) {
      ctx.save();
      ctx.font = '20px Fredoka';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#ffb300';
      ctx.shadowColor = 'rgba(0,0,0,0.4)';
      ctx.shadowBlur = 4;
      ctx.fillText('⭐', 0, -28 + bob);
      ctx.restore();
    }

    ctx.restore();
  }

  // ==========================================================================
  // SCENIC 2D CARTOON ILLUSTRATED BACKGROUNDS
  // ==========================================================================
  function renderScene(theme) {
    // 1. Scenic Sky
    const skyGrad = ctx.createLinearGradient(0, 0, 0, SCENE_H * 0.55);
    if (theme === 'venice') {
      skyGrad.addColorStop(0, '#81d4fa');
      skyGrad.addColorStop(1, '#e1f5fe');
    } else if (theme === 'paris') {
      skyGrad.addColorStop(0, '#b2dfdb');
      skyGrad.addColorStop(1, '#e0f2f1');
    } else if (theme === 'terrace') {
      skyGrad.addColorStop(0, '#ffe0b2');
      skyGrad.addColorStop(1, '#fff8e1');
    } else if (theme === 'market') {
      skyGrad.addColorStop(0, '#ce93d8');
      skyGrad.addColorStop(1, '#f3e5f5');
    } else {
      skyGrad.addColorStop(0, '#a5d6a7');
      skyGrad.addColorStop(1, '#e8f5e9');
    }
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, SCENE_W, SCENE_H);

    // Fluffy Cartoon Clouds
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    drawCloud(180, 70, 70);
    drawCloud(620, 95, 90);
    drawCloud(1040, 60, 65);

    if (theme === 'venice') {
      renderVeniceScene();
    } else if (theme === 'paris') {
      renderParisScene();
    } else if (theme === 'terrace') {
      renderTerraceScene();
    } else if (theme === 'market') {
      renderMarketScene();
    } else {
      renderConservatoryScene();
    }
  }

  function drawCloud(cx, cy, r) {
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.5, 0, Math.PI * 2);
    ctx.arc(cx + r * 0.4, cy - r * 0.15, r * 0.45, 0, Math.PI * 2);
    ctx.arc(cx + r * 0.8, cy, r * 0.4, 0, Math.PI * 2);
    ctx.arc(cx + r * 0.35, cy + r * 0.1, r * 0.4, 0, Math.PI * 2);
    ctx.fill();
  }

  // Venetian Piazza & Canal Scene
  function renderVeniceScene() {
    // Distant San Marco Clock Tower & Domes
    ctx.fillStyle = '#b0bec5';
    ctx.fillRect(480, 100, 75, 280);
    ctx.beginPath();
    ctx.moveTo(470, 100);
    ctx.lineTo(517, 30);
    ctx.lineTo(565, 100);
    ctx.closePath();
    ctx.fillStyle = '#d84315';
    ctx.fill();

    // Terracotta Palazzos (Left & Right)
    // Left Palazzo (Peach / Terracotta)
    ctx.fillStyle = '#ffab91';
    ctx.strokeStyle = '#3e2723';
    ctx.lineWidth = 3;
    ctx.fillRect(40, 180, 360, 460);
    ctx.strokeRect(40, 180, 360, 460);

    // Palazzo Windows & Shutters
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        const wx = 80 + col * 105;
        const wy = 230 + row * 115;
        // Arched Window
        ctx.fillStyle = '#263238';
        ctx.beginPath();
        ctx.arc(wx + 22, wy, 22, Math.PI, 0);
        ctx.rect(wx, wy, 44, 50);
        ctx.fill();
        ctx.stroke();

        // Green Shutters
        ctx.fillStyle = '#2e7d32';
        ctx.fillRect(wx - 16, wy - 4, 14, 54);
        ctx.fillRect(wx + 46, wy - 4, 14, 54);
        ctx.strokeRect(wx - 16, wy - 4, 14, 54);
        ctx.strokeRect(wx + 46, wy - 4, 14, 54);
      }
    }

    // Right Palazzo (Warm Tuscan Ochre)
    ctx.fillStyle = '#ffe082';
    ctx.fillRect(820, 160, 420, 480);
    ctx.strokeRect(820, 160, 420, 480);
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        const wx = 860 + c * 115;
        const wy = 210 + r * 120;
        ctx.fillStyle = '#37474f';
        ctx.beginPath();
        ctx.arc(wx + 20, wy, 20, Math.PI, 0);
        ctx.rect(wx, wy, 40, 52);
        ctx.fill();
        ctx.stroke();
        // Burgundy Shutters
        ctx.fillStyle = '#880e4f';
        ctx.fillRect(wx - 14, wy - 2, 12, 54);
        ctx.fillRect(wx + 42, wy - 2, 12, 54);
        ctx.strokeRect(wx - 14, wy - 2, 12, 54);
        ctx.strokeRect(wx + 42, wy - 2, 12, 54);
      }
    }

    // Grand Arched Stone Bridge in the middle
    ctx.fillStyle = '#eceff1';
    ctx.beginPath();
    ctx.moveTo(360, 430);
    ctx.bezierCurveTo(520, 310, 680, 310, 840, 430);
    ctx.lineTo(840, 530);
    ctx.bezierCurveTo(680, 420, 520, 420, 360, 530);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Bridge Balustrades
    for (let b = 390; b <= 810; b += 32) {
      ctx.fillStyle = '#b0bec5';
      ctx.fillRect(b, 375 - Math.sin((b - 360) / 480 * Math.PI) * 45, 12, 28);
      ctx.strokeRect(b, 375 - Math.sin((b - 360) / 480 * Math.PI) * 45, 12, 28);
    }

    // Sparkling Venetian Canal Water
    const canalGrad = ctx.createLinearGradient(0, 480, 0, SCENE_H);
    canalGrad.addColorStop(0, '#00838f');
    canalGrad.addColorStop(0.5, '#006064');
    canalGrad.addColorStop(1, '#004d40');
    ctx.fillStyle = canalGrad;
    ctx.fillRect(360, 480, 480, 340);

    // Water ripple highlights
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 2;
    for (let rip = 520; rip < SCENE_H; rip += 26) {
      ctx.beginPath();
      ctx.moveTo(400, rip);
      ctx.bezierCurveTo(460, rip - 4, 540, rip + 4, 600, rip);
      ctx.bezierCurveTo(660, rip - 4, 740, rip + 4, 800, rip);
      ctx.stroke();
    }

    // Classic Venetian Gondola floating
    ctx.save();
    ctx.translate(560, 660);
    ctx.fillStyle = '#212121';
    ctx.beginPath();
    ctx.moveTo(-90, -10);
    ctx.quadraticCurveTo(0, 24, 90, -15);
    ctx.lineTo(105, -35); // Metal prow (ferro)
    ctx.quadraticCurveTo(0, 10, -100, -25);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Metal Ferro tip
    ctx.fillStyle = '#b0bec5';
    ctx.fillRect(96, -42, 6, 22);
    // Red velvet passenger seat
    ctx.fillStyle = '#c62828';
    ctx.fillRect(-25, -6, 50, 12);
    ctx.restore();

    // Cobblestone Quayside Piazzas (Left & Right Foregrounds)
    ctx.fillStyle = '#bcaaa4';
    ctx.fillRect(0, 600, 380, 220);
    ctx.fillRect(820, 600, 460, 220);
    ctx.strokeRect(0, 600, 380, 220);
    ctx.strokeRect(820, 600, 460, 220);

    // Cafe Outdoor Table & Umbrella (Left)
    drawCafeUmbrella(240, 570, '#e53935');
    // Vintage Wrought Iron Lampposts
    drawLamppost(360, 470);
    drawLamppost(840, 470);
  }

  // Parisian Boulangerie Scene
  function renderParisScene() {
    // Parisian Haussmann Buildings (Cream stone, Mansard roof)
    ctx.fillStyle = '#fff8e1';
    ctx.strokeStyle = '#37474f';
    ctx.lineWidth = 3;
    ctx.fillRect(60, 160, 1160, 480);
    ctx.strokeRect(60, 160, 1160, 480);

    // Zinc Mansard Roof with Dormer Windows
    ctx.fillStyle = '#78909c';
    ctx.fillRect(40, 80, 1200, 100);
    ctx.strokeRect(40, 80, 1200, 100);

    // Boulangerie Storefront Awning (Red & Cream Stripes)
    drawAwning(140, 340, 520, 60, '#c62828', '#fff8e1');
    drawAwning(720, 340, 440, 60, '#1565c0', '#fff8e1');

    // Storefront Signs
    ctx.fillStyle = '#3e2723';
    ctx.fillRect(200, 305, 400, 38);
    ctx.strokeRect(200, 305, 400, 38);
    ctx.fillStyle = '#ffd54f';
    ctx.font = '700 20px Fredoka';
    ctx.textAlign = 'center';
    ctx.fillText('🥖 BOULANGERIE PATISSERIE 🥐', 400, 331);

    // Display Windows with pastries
    ctx.fillStyle = '#e0f7fa';
    ctx.fillRect(160, 410, 480, 180);
    ctx.strokeRect(160, 410, 480, 180);

    // Pastry baskets
    ctx.fillStyle = '#d7ccc8';
    ctx.fillRect(200, 490, 80, 50);
    ctx.fillRect(320, 490, 80, 50);
    ctx.fillRect(440, 490, 80, 50);

    // French Wrought Iron Balconies
    for (let col = 0; col < 5; col++) {
      const bx = 120 + col * 220;
      drawFrenchBalcony(bx, 240);
    }

    // Cobblestone Rue (Street)
    ctx.fillStyle = '#b0bec5';
    ctx.fillRect(0, 610, SCENE_W, 210);
    ctx.strokeRect(0, 610, SCENE_W, 210);

    // Vintage French Bicycle with Flower Basket
    drawBicycle(980, 670);
    drawCafeTable(780, 660);
  }

  // Mediterranean Rooftop Terrace Scene
  function renderTerraceScene() {
    // Beautiful Ocean Sea Horizon
    const seaGrad = ctx.createLinearGradient(0, 220, 0, 420);
    seaGrad.addColorStop(0, '#0288d1');
    seaGrad.addColorStop(1, '#01579b');
    ctx.fillStyle = seaGrad;
    ctx.fillRect(0, 200, SCENE_W, 240);

    // Distant Sailboats
    drawSailboat(320, 240);
    drawSailboat(820, 225);

    // Terrace Wooden Decking
    ctx.fillStyle = '#d7ccc8';
    ctx.strokeStyle = '#5d4037';
    ctx.lineWidth = 3;
    ctx.fillRect(60, 380, 1160, 440);
    ctx.strokeRect(60, 380, 1160, 440);

    // Wooden Pergola with Vines
    ctx.fillStyle = '#8d6e63';
    ctx.fillRect(100, 140, 24, 400);
    ctx.fillRect(520, 140, 24, 400);
    ctx.fillRect(940, 140, 24, 400);
    ctx.fillRect(80, 140, 960, 28);

    // Lush Green Grapevines
    ctx.fillStyle = '#388e3c';
    for (let v = 100; v <= 1020; v += 45) {
      ctx.beginPath();
      ctx.arc(v, 160 + Math.sin(v) * 15, 26, 0, Math.PI * 2);
      ctx.fill();
    }

    // Terra Cotta Pots & Plants
    for (let p = 140; p <= 1100; p += 220) {
      drawTerracottaPot(p, 580);
    }

    // Wooden Lounge Chair
    ctx.fillStyle = '#ffb74d';
    ctx.fillRect(620, 610, 120, 22);
    ctx.fillRect(720, 550, 20, 80);
  }

  // Old Town Market Square Scene
  function renderMarketScene() {
    // Gothic Church Tower & Arches
    ctx.fillStyle = '#cfd8dc';
    ctx.strokeStyle = '#37474f';
    ctx.lineWidth = 3;
    ctx.fillRect(440, 80, 400, 520);
    ctx.strokeRect(440, 80, 400, 520);

    // Big Tower Clock
    ctx.fillStyle = '#fff9c4';
    ctx.beginPath();
    ctx.arc(640, 210, 55, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Clock Hands
    ctx.strokeStyle = '#263238';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(640, 210);
    ctx.lineTo(640, 175);
    ctx.moveTo(640, 210);
    ctx.lineTo(670, 210);
    ctx.stroke();

    // Market Stalls (Striped Canopies)
    drawAwning(120, 390, 280, 55, '#f57c00', '#fff3e0');
    drawAwning(880, 390, 280, 55, '#7cb342', '#f1f8e9');

    // Central Stone Fountain
    drawStoneFountain(640, 630);

    // Market Street Floor
    ctx.fillStyle = '#bcaaa4';
    ctx.fillRect(0, 600, SCENE_W, 220);
    ctx.strokeRect(0, 600, SCENE_W, 220);
  }

  // Royal Botanical Conservatory Scene
  function renderConservatoryScene() {
    // Curved Glass Greenhouse Ceiling Arches
    ctx.strokeStyle = '#78909c';
    ctx.lineWidth = 3;
    for (let a = 120; a < SCENE_W; a += 160) {
      ctx.beginPath();
      ctx.moveTo(a, 600);
      ctx.quadraticCurveTo(a, 80, a + 80, 60);
      ctx.stroke();
    }

    // Lush Palm Trees & Tropical Foliage
    drawPalmTree(220, 460);
    drawPalmTree(1060, 460);

    // Marble Walkway Floor
    ctx.fillStyle = '#eceff1';
    ctx.strokeStyle = '#90a4ae';
    ctx.lineWidth = 3;
    ctx.fillRect(0, 580, SCENE_W, 240);
    ctx.strokeRect(0, 580, SCENE_W, 240);

    // Classical Marble Birdbath Fountain
    drawBirdbath(640, 640);
  }

  // Scene Helper Drawings
  function drawAwning(x, y, w, h, c1, c2) {
    ctx.save();
    const stripes = Math.floor(w / 30);
    for (let i = 0; i < stripes; i++) {
      ctx.fillStyle = (i % 2 === 0) ? c1 : c2;
      ctx.fillRect(x + i * 30, y, 30, h);
      ctx.strokeRect(x + i * 30, y, 30, h);
    }
    // Scalloped Bottom Edge
    ctx.fillStyle = c1;
    for (let i = 0; i < stripes; i++) {
      ctx.beginPath();
      ctx.arc(x + i * 30 + 15, y + h, 15, 0, Math.PI);
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawCafeUmbrella(x, y, color) {
    ctx.save();
    ctx.fillStyle = '#5d4037';
    ctx.fillRect(x - 3, y - 80, 6, 120);
    ctx.fillStyle = color;
    ctx.strokeStyle = '#263238';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(x, y - 80, 70, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  function drawLamppost(x, y) {
    ctx.save();
    ctx.strokeStyle = '#263238';
    ctx.fillStyle = '#37474f';
    ctx.lineWidth = 3;
    ctx.fillRect(x - 4, y, 8, 140);
    // Lantern head
    ctx.fillStyle = '#fff9c4';
    ctx.beginPath();
    ctx.arc(x, y - 10, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  function drawFrenchBalcony(x, y) {
    ctx.save();
    ctx.strokeStyle = '#263238';
    ctx.lineWidth = 2.5;
    ctx.fillStyle = '#eceff1';
    ctx.fillRect(x, y, 90, 40);
    ctx.strokeRect(x, y, 90, 40);
    // Flowerbox on balcony
    ctx.fillStyle = '#8d6e63';
    ctx.fillRect(x + 5, y + 20, 80, 16);
    ctx.fillStyle = '#e91e63';
    for (let f = 0; f < 5; f++) {
      ctx.beginPath();
      ctx.arc(x + 14 + f * 16, y + 16, 6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawBicycle(x, y) {
    ctx.save();
    ctx.strokeStyle = '#0288d1';
    ctx.lineWidth = 3;
    // Wheels
    ctx.beginPath();
    ctx.arc(x - 35, y, 22, 0, Math.PI * 2);
    ctx.arc(x + 35, y, 22, 0, Math.PI * 2);
    ctx.stroke();
    // Frame
    ctx.beginPath();
    ctx.moveTo(x - 35, y);
    ctx.lineTo(x, y - 28);
    ctx.lineTo(x + 35, y);
    ctx.lineTo(x + 5, y);
    ctx.lineTo(x - 15, y - 28);
    ctx.stroke();
    ctx.restore();
  }

  function drawCafeTable(x, y) {
    ctx.save();
    ctx.fillStyle = '#efebe9';
    ctx.strokeStyle = '#4e342e';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.ellipse(x, y, 42, 18, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Table leg
    ctx.fillRect(x - 3, y + 16, 6, 45);
    ctx.restore();
  }

  function drawSailboat(x, y) {
    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(x, y - 28);
    ctx.lineTo(x + 16, y);
    ctx.lineTo(x, y);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#5d4037';
    ctx.fillRect(x - 14, y, 28, 8);
    ctx.restore();
  }

  function drawTerracottaPot(x, y) {
    ctx.save();
    ctx.fillStyle = '#d84315';
    ctx.strokeStyle = '#bf360c';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - 18, y);
    ctx.lineTo(x + 18, y);
    ctx.lineTo(x + 14, y + 36);
    ctx.lineTo(x - 14, y + 36);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Bushy Plant
    ctx.fillStyle = '#2e7d32';
    ctx.beginPath();
    ctx.arc(x, y - 10, 24, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawStoneFountain(x, y) {
    ctx.save();
    ctx.fillStyle = '#cfd8dc';
    ctx.strokeStyle = '#455a64';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(x, y, 100, 36, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Water pool
    ctx.fillStyle = '#29b6f6';
    ctx.beginPath();
    ctx.ellipse(x, y, 86, 28, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawPalmTree(x, y) {
    ctx.save();
    ctx.fillStyle = '#6d4c41';
    ctx.fillRect(x - 10, y, 20, 220);
    // Fronds
    ctx.fillStyle = '#2e7d32';
    for (let f = 0; f < 6; f++) {
      ctx.beginPath();
      ctx.ellipse(x, y, 70, 22, f * Math.PI / 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawBirdbath(x, y) {
    ctx.save();
    ctx.fillStyle = '#eceff1';
    ctx.strokeStyle = '#78909c';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(x, y, 48, 18, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillRect(x - 6, y + 16, 12, 50);
    ctx.restore();
  }

  // ==========================================================================
  // FLOATING SCORE PARTICLES & WING FLUTTERS
  // ==========================================================================
  function spawnFloatingScore(x, y) {
    floatingFx.push({
      x: x,
      y: y - 15,
      text: '🕊️ +1',
      alpha: 1,
      vy: -1.8
    });
  }

  function updateFloatingFx() {
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
    ctx.save();
    ctx.font = '800 24px Fredoka';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    floatingFx.forEach(fx => {
      ctx.globalAlpha = fx.alpha;
      ctx.fillStyle = '#ffd600';
      ctx.strokeStyle = '#e65100';
      ctx.lineWidth = 3;
      ctx.strokeText(fx.text, fx.x, fx.y);
      ctx.fillText(fx.text, fx.x, fx.y);
    });
    ctx.restore();
  }

  // ==========================================================================
  // CLICK & HIT DETECTION (Desktop & Touch)
  // ==========================================================================
  function screenToSceneCoords(clientX, clientY) {
    const totalScale = baseScale * zoom;
    const x = (clientX - panX) / totalScale;
    const y = (clientY - panY) / totalScale;
    return { x, y };
  }

  function handleInteraction(clientX, clientY) {
    const pt = screenToSceneCoords(clientX, clientY);

    // Check hit test for each unfound pigeon
    for (let i = 0; i < currentPigeons.length; i++) {
      const p = currentPigeons[i];
      if (p.found) continue;

      const hitRadius = 36 * p.scale;
      const dx = pt.x - p.x;
      const dy = pt.y - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist <= hitRadius) {
        // Pigeon Found!
        p.found = true;
        p.popAnim = 1.0;
        p.flapAnim = 1.0;
        foundPigeonsCount++;

        AudioEngine.playCoo();
        AudioEngine.playChime();
        spawnFloatingScore(p.x, p.y);
        updateHUD();

        // Clear active hint if this was the hint pigeon
        if (activeHintPigeon && activeHintPigeon.id === p.id) {
          activeHintPigeon = null;
        }

        // Check Level Win Condition
        const level = LEVELS[currentLevelIdx];
        if (foundPigeonsCount >= level.totalPigeons) {
          setTimeout(handleLevelWin, 700);
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

    // Unlock next level if available
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
    const unfound = currentPigeons.filter(p => !p.found);
    if (unfound.length === 0) return;

    AudioEngine.playHint();
    hintCooldown = true;

    // Pick random unfound pigeon
    activeHintPigeon = unfound[Math.floor(Math.random() * unfound.length)];

    // Gently focus pan toward the pigeon
    const totalScale = baseScale * zoom;
    panX = canvasW / 2 - activeHintPigeon.x * totalScale;
    panY = canvasH / 2 - activeHintPigeon.y * totalScale;

    // Cooldown Animation (12 seconds)
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
        }
      }, 100);
    } else {
      setTimeout(() => { hintCooldown = false; }, 12000);
    }
  }

  // ==========================================================================
  // ZOOM & PAN ENGINE
  // ==========================================================================
  function setZoom(newZoom, centerX, centerY) {
    const minZoom = 0.85;
    const maxZoom = 2.5;
    const clampedZoom = Math.max(minZoom, Math.min(maxZoom, newZoom));

    const cx = centerX !== undefined ? centerX : canvasW / 2;
    const cy = centerY !== undefined ? centerY : canvasH / 2;

    const prevScale = baseScale * zoom;
    const nextScale = baseScale * clampedZoom;

    panX = cx - (cx - panX) * (nextScale / prevScale);
    panY = cy - (cy - panY) * (nextScale / prevScale);
    zoom = clampedZoom;
  }

  // Wheel Zoom
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.15 : 0.87;
    setZoom(zoom * factor, e.clientX, e.clientY);
  }, { passive: false });

  // Mouse Drag / Pan & Click
  canvas.addEventListener('mousedown', (e) => {
    isPanning = true;
    hasMoved = false;
    startPanX = e.clientX - panX;
    startPanY = e.clientY - panY;
  });

  window.addEventListener('mousemove', (e) => {
    if (!isPanning) return;
    const dx = e.clientX - startPanX - panX;
    const dy = e.clientY - startPanY - panY;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
      hasMoved = true;
    }
    panX = e.clientX - startPanX;
    panY = e.clientY - startPanY;
  });

  window.addEventListener('mouseup', (e) => {
    if (isPanning) {
      isPanning = false;
      if (!hasMoved) {
        handleInteraction(e.clientX, e.clientY);
      }
    }
  });

  // Touch Support (Tap, Pan, Pinch to Zoom)
  canvas.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
      isPanning = true;
      hasMoved = false;
      startPanX = e.touches[0].clientX - panX;
      startPanY = e.touches[0].clientY - panY;
    } else if (e.touches.length === 2) {
      isPanning = false;
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      lastTouchDist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
    }
  }, { passive: false });

  canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (e.touches.length === 1 && isPanning) {
      const dx = e.touches[0].clientX - startPanX - panX;
      const dy = e.touches[0].clientY - startPanY - panY;
      if (Math.abs(dx) > 6 || Math.abs(dy) > 6) {
        hasMoved = true;
      }
      panX = e.touches[0].clientX - startPanX;
      panY = e.touches[0].clientY - startPanY;
    } else if (e.touches.length === 2) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      if (lastTouchDist > 0) {
        const factor = dist / lastTouchDist;
        const midX = (t1.clientX + t2.clientX) / 2;
        const midY = (t1.clientY + t2.clientY) / 2;
        setZoom(zoom * factor, midX, midY);
      }
      lastTouchDist = dist;
    }
  }, { passive: false });

  canvas.addEventListener('touchend', (e) => {
    if (isPanning && e.changedTouches.length > 0) {
      isPanning = false;
      if (!hasMoved) {
        handleInteraction(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
      }
    }
  });

  // ==========================================================================
  // MAIN RENDERING LOOP
  // ==========================================================================
  function render(time) {
    ctx.clearRect(0, 0, canvasW, canvasH);

    ctx.save();
    ctx.translate(panX, panY);
    const totalScale = baseScale * zoom;
    ctx.scale(totalScale, totalScale);

    // 1. Draw Illustrated Scenic Background
    const level = LEVELS[currentLevelIdx];
    renderScene(level.theme);

    // 2. Draw Hidden Pigeons
    currentPigeons.forEach(p => {
      // Decay animations
      if (p.popAnim > 0) p.popAnim = Math.max(0, p.popAnim - 0.02);
      if (p.flapAnim > 0) p.flapAnim = Math.max(0, p.flapAnim - 0.03);

      drawPigeon(p, time);
    });

    // 3. Draw Floating Score Stars
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
    const fsIcon = document.getElementById('fsIcon');
    const menuFsIcon = document.getElementById('menuFsIcon');
    const settingFs = document.getElementById('settingFullscreen');
    if (fsIcon) fsIcon.textContent = full ? '🗗' : '⛶';
    if (menuFsIcon) menuFsIcon.textContent = full ? '🗗' : '⛶';
    if (settingFs) settingFs.checked = full;
    setTimeout(resizeCanvas, 80);
  }

  document.addEventListener('fullscreenchange', updateFullscreenUI);
  document.addEventListener('webkitfullscreenchange', updateFullscreenUI);
  document.addEventListener('mozfullscreenchange', updateFullscreenUI);

  // ==========================================================================
  // UI MODALS & SCREENS
  // ==========================================================================
  const menuScreen = document.getElementById('menuScreen');
  const settingsModal = document.getElementById('settingsModal');
  const levelSelectModal = document.getElementById('levelSelectModal');
  const winModal = document.getElementById('winModal');
  const exitModal = document.getElementById('exitModal');

  function closeAllModals() {
    [settingsModal, levelSelectModal, winModal, exitModal].forEach(m => {
      if (m) m.classList.add('hidden');
    });
  }

  function showMainMenu() {
    closeAllModals();
    if (menuScreen) {
      menuScreen.classList.remove('hidden');
      updateMenuStats();
    }
  }

  function hideMainMenu() {
    if (menuScreen) menuScreen.classList.add('hidden');
  }

  function updateMenuStats() {
    let totalStars = 0;
    Object.values(levelProgress).forEach(s => totalStars += s);
    const starText = document.getElementById('menuTotalStars');
    if (starText) {
      starText.textContent = `${totalStars} / ${LEVELS.length * 3}`;
    }
  }

  // Level Select Grid Builder
  function openLevelSelect() {
    const grid = document.getElementById('levelGrid');
    if (!grid) return;
    grid.innerHTML = '';

    const unlocked = parseInt(localStorage.getItem('hp_unlocked') || '1', 10);

    LEVELS.forEach((lvl, idx) => {
      const card = document.createElement('div');
      const isLocked = (idx + 1) > unlocked;
      const isCurrent = idx === currentLevelIdx;
      card.className = 'level-card' + (isLocked ? ' locked' : '') + (isCurrent ? ' current' : '');

      const stars = levelProgress[idx] || 0;
      let starStr = '☆☆☆';
      if (stars === 3) starStr = '⭐⭐⭐';
      else if (stars === 2) starStr = '⭐⭐☆';
      else if (stars === 1) starStr = '⭐☆☆';

      card.innerHTML = `
        <div class="level-card-num">${isLocked ? '🔒' : lvl.id}</div>
        <div style="font-size: 11px; font-weight: 700; color: #546e7a;">${lvl.name}</div>
        <div class="level-card-stars">${isLocked ? '' : starStr}</div>
      `;

      if (!isLocked) {
        card.addEventListener('click', () => {
          AudioEngine.playClick();
          hideMainMenu();
          loadLevel(idx);
        });
      }

      grid.appendChild(card);
    });

    closeAllModals();
    if (levelSelectModal) levelSelectModal.classList.remove('hidden');
  }

  // ==========================================================================
  // EVENT LISTENERS & BINDINGS
  // ==========================================================================
  // Top HUD Buttons
  document.getElementById('btnHome').addEventListener('click', () => {
    AudioEngine.playClick();
    if (exitModal) exitModal.classList.remove('hidden');
  });

  document.getElementById('btnHint').addEventListener('click', () => {
    triggerHint();
  });

  document.getElementById('btnZoomIn').addEventListener('click', () => {
    AudioEngine.playClick();
    setZoom(zoom * 1.25);
  });

  document.getElementById('btnZoomOut').addEventListener('click', () => {
    AudioEngine.playClick();
    setZoom(zoom * 0.8);
  });

  document.getElementById('btnZoomFit').addEventListener('click', () => {
    AudioEngine.playClick();
    resetCamera();
  });

  document.getElementById('btnSettings').addEventListener('click', () => {
    AudioEngine.playClick();
    if (settingsModal) {
      document.getElementById('settingMusic').checked = AudioEngine.isMusicOn();
      document.getElementById('settingSfx').checked = AudioEngine.isSfxOn();
      document.getElementById('settingFullscreen').checked = isFullscreen();
      settingsModal.classList.remove('hidden');
    }
  });

  document.getElementById('btnFullscreen').addEventListener('click', () => {
    AudioEngine.playClick();
    toggleFullscreen();
  });

  // Main Menu Buttons
  document.getElementById('btnMenuPlay').addEventListener('click', () => {
    AudioEngine.playClick();
    AudioEngine.init();
    hideMainMenu();
    loadLevel(currentLevelIdx);
  });

  document.getElementById('btnMenuLevels').addEventListener('click', () => {
    AudioEngine.playClick();
    openLevelSelect();
  });

  document.getElementById('btnMenuSettings').addEventListener('click', () => {
    AudioEngine.playClick();
    if (settingsModal) {
      document.getElementById('settingMusic').checked = AudioEngine.isMusicOn();
      document.getElementById('settingSfx').checked = AudioEngine.isSfxOn();
      document.getElementById('settingFullscreen').checked = isFullscreen();
      settingsModal.classList.remove('hidden');
    }
  });

  document.getElementById('btnMenuFullscreen').addEventListener('click', () => {
    AudioEngine.playClick();
    toggleFullscreen();
  });

  // Mascot Click Coo
  const mascot = document.getElementById('mascotPigeon');
  if (mascot) {
    mascot.addEventListener('click', () => {
      AudioEngine.playCoo();
    });
  }

  // Settings Toggles
  document.getElementById('settingMusic').addEventListener('change', (e) => {
    AudioEngine.setMusic(e.target.checked);
    AudioEngine.playClick();
  });

  document.getElementById('settingSfx').addEventListener('change', (e) => {
    AudioEngine.setSfx(e.target.checked);
    AudioEngine.playClick();
  });

  document.getElementById('settingFullscreen').addEventListener('change', () => {
    AudioEngine.playClick();
    toggleFullscreen();
  });

  document.getElementById('btnResetProgress').addEventListener('click', () => {
    if (confirm('Reset all completed levels and stars?')) {
      levelProgress = {};
      localStorage.removeItem('hp_level_stars');
      localStorage.setItem('hp_unlocked', '1');
      localStorage.setItem('hp_current_level', '0');
      AudioEngine.playClick();
      loadLevel(0);
      showMainMenu();
    }
  });

  // Close Modal Buttons
  document.getElementById('btnCloseSettings').addEventListener('click', () => {
    AudioEngine.playClick();
    if (settingsModal) settingsModal.classList.add('hidden');
  });

  document.getElementById('btnCloseLevels').addEventListener('click', () => {
    AudioEngine.playClick();
    if (levelSelectModal) levelSelectModal.classList.add('hidden');
  });

  // Exit Confirmation
  document.getElementById('btnCancelExit').addEventListener('click', () => {
    AudioEngine.playClick();
    if (exitModal) exitModal.classList.add('hidden');
  });

  document.getElementById('btnConfirmExit').addEventListener('click', () => {
    AudioEngine.playClick();
    showMainMenu();
  });

  // Win Modal Actions
  document.getElementById('btnNextLevel').addEventListener('click', () => {
    AudioEngine.playClick();
    if (winModal) winModal.classList.add('hidden');
    if (currentLevelIdx + 1 < LEVELS.length) {
      loadLevel(currentLevelIdx + 1);
    } else {
      openLevelSelect();
    }
  });

  document.getElementById('btnReplayWin').addEventListener('click', () => {
    AudioEngine.playClick();
    if (winModal) winModal.classList.add('hidden');
    loadLevel(currentLevelIdx);
  });

  // Backdrop clicks dismiss modals
  [settingsModal, levelSelectModal, exitModal].forEach(m => {
    if (m) {
      m.addEventListener('click', (e) => {
        if (e.target === m) m.classList.add('hidden');
      });
    }
  });

  // ==========================================================================
  // INITIALIZATION
  // ==========================================================================
  document.addEventListener('DOMContentLoaded', () => {
    resizeCanvas();
    showMainMenu();
    requestAnimationFrame(render);
  });
})();
