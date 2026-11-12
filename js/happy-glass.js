/* ==========================================================================
   HAPPY GLASS - PHYSICS ENGINE & GAMEPLAY
   Fluid particle dynamics, smooth line drawing, facial animations, audio synth
   ========================================================================== */

(function () {
  'use strict';

  // ==========================================================================
  // WEB AUDIO SYNTHESIZER
  // ==========================================================================
  const AudioEngine = (function () {
    let ctx = null;
    let soundEnabled = true;

    function getContext() {
      if (!ctx && (window.AudioContext || window.webkitAudioContext)) {
        ctx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (ctx && ctx.state === 'suspended') {
        ctx.resume();
      }
      return ctx;
    }

    return {
      toggle: function (override) {
        if (typeof override === 'boolean') {
          soundEnabled = override;
        } else {
          soundEnabled = !soundEnabled;
        }
        return soundEnabled;
      },
      isEnabled: function () {
        return soundEnabled;
      },
      playPencil: function () {
        if (!soundEnabled) return;
        const ac = getContext();
        if (!ac) return;
        const now = ac.currentTime;
        // Scratchy pencil sound
        const osc = ac.createOscillator();
        const gain = ac.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(1400 + Math.random() * 400, now);
        osc.frequency.linearRampToValueAtTime(800 + Math.random() * 200, now + 0.04);
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
        osc.connect(gain);
        gain.connect(ac.destination);
        osc.start(now);
        osc.stop(now + 0.04);
      },
      playDrip: function () {
        if (!soundEnabled) return;
        const ac = getContext();
        if (!ac) return;
        const now = ac.currentTime;
        const osc = ac.createOscillator();
        const gain = ac.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600 + Math.random() * 300, now);
        osc.frequency.exponentialRampToValueAtTime(1200 + Math.random() * 200, now + 0.06);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
        osc.connect(gain);
        gain.connect(ac.destination);
        osc.start(now);
        osc.stop(now + 0.06);
      },
      playSplash: function () {
        if (!soundEnabled) return;
        const ac = getContext();
        if (!ac) return;
        const now = ac.currentTime;
        const osc = ac.createOscillator();
        const gain = ac.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(450 + Math.random() * 100, now);
        osc.frequency.linearRampToValueAtTime(250, now + 0.08);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.connect(gain);
        gain.connect(ac.destination);
        osc.start(now);
        osc.stop(now + 0.08);
      },
      playWin: function () {
        if (!soundEnabled) return;
        const ac = getContext();
        if (!ac) return;
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        notes.forEach((freq, idx) => {
          const osc = ac.createOscillator();
          const gain = ac.createGain();
          const t = ac.currentTime + idx * 0.09;
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, t);
          gain.gain.setValueAtTime(0.2, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
          osc.connect(gain);
          gain.connect(ac.destination);
          osc.start(t);
          osc.stop(t + 0.4);
        });
      },
      playStar: function (i) {
        if (!soundEnabled) return;
        const ac = getContext();
        if (!ac) return;
        const freqs = [659.25, 880, 1174.66]; // E5, A5, D6
        const osc = ac.createOscillator();
        const gain = ac.createGain();
        const now = ac.currentTime;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freqs[i % freqs.length], now);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.connect(gain);
        gain.connect(ac.destination);
        osc.start(now);
        osc.stop(now + 0.3);
      },
      playClick: function () {
        if (!soundEnabled) return;
        const ac = getContext();
        if (!ac) return;
        const osc = ac.createOscillator();
        const gain = ac.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, ac.currentTime);
        gain.gain.setValueAtTime(0.12, ac.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.05);
        osc.connect(gain);
        gain.connect(ac.destination);
        osc.start();
        osc.stop(ac.currentTime + 0.05);
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
    const colors = ['#f44336', '#2196f3', '#4caf50', '#ffeb3b', '#9c27b0', '#ff9800'];

    function resize() {
      if (!canvas) return;
      canvas.width = canvas.parentElement.clientWidth;
      canvas.height = canvas.parentElement.clientHeight;
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
        p.vy += 0.25;
        p.rot += p.vr;
        p.alpha -= 0.012;
        if (p.alpha > 0) {
          alive = true;
          ctx.save();
          ctx.globalAlpha = p.alpha;
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 1.4);
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
        const n = count || 80;
        for (let i = 0; i < n; i++) {
          particles.push({
            x: canvas.width * 0.5 + (Math.random() - 0.5) * 100,
            y: canvas.height * 0.45,
            vx: (Math.random() - 0.5) * 16,
            vy: -8 - Math.random() * 12,
            vr: (Math.random() - 0.5) * 0.3,
            rot: Math.random() * Math.PI,
            size: 6 + Math.random() * 8,
            color: colors[Math.floor(Math.random() * colors.length)],
            alpha: 1.0
          });
        }
        running = true;
        requestAnimationFrame(loop);
      }
    };
  })();

  // ==========================================================================
  // LEVEL DEFINITIONS (8 Creative Puzzles)
  // ==========================================================================
  const LEVELS = [
    {
      id: 1,
      name: 'Gentle Slope',
      pipe: { x: 300, y: 120 },
      glass: { x: 480, y: 380 },
      targetDrops: 32,
      blocks: [
        { x: 420, y: 470, w: 160, h: 40 }
      ],
      hint: [
        { x: 280, y: 190 },
        { x: 380, y: 280 },
        { x: 460, y: 360 }
      ]
    },
    {
      id: 2,
      name: 'Deflection Ramp',
      pipe: { x: 400, y: 110 },
      glass: { x: 560, y: 360 },
      targetDrops: 30,
      blocks: [
        { x: 320, y: 240, w: 120, h: 50 },
        { x: 500, y: 450, w: 160, h: 40 }
      ],
      hint: [
        { x: 380, y: 220 },
        { x: 490, y: 270 },
        { x: 550, y: 340 }
      ]
    },
    {
      id: 3,
      name: 'Bridge The Chasm',
      pipe: { x: 260, y: 110 },
      glass: { x: 580, y: 350 },
      targetDrops: 32,
      blocks: [
        { x: 200, y: 300, w: 100, h: 180 },
        { x: 520, y: 440, w: 150, h: 40 }
      ],
      hint: [
        { x: 250, y: 220 },
        { x: 420, y: 260 },
        { x: 565, y: 330 }
      ]
    },
    {
      id: 4,
      name: 'Support & Funnel',
      pipe: { x: 400, y: 110 },
      glass: { x: 400, y: 370 },
      targetDrops: 32,
      blocks: [
        { x: 200, y: 260, w: 110, h: 40 },
        { x: 490, y: 260, w: 110, h: 40 },
        { x: 330, y: 460, w: 140, h: 40 }
      ],
      hint: [
        { x: 320, y: 210 },
        { x: 400, y: 280 },
        { x: 480, y: 210 }
      ]
    },
    {
      id: 5,
      // EXACT LEVEL FROM USER'S SCREENSHOT (Level 5 by Lion Studios)
      name: 'Double Blocks Center Drop',
      pipe: { x: 400, y: 130 },
      glass: { x: 400, y: 310 },
      targetDrops: 30,
      blocks: [
        { x: 260, y: 430, w: 130, h: 50 },
        { x: 510, y: 430, w: 80, h: 50 }
      ],
      hint: [
        { x: 360, y: 210 },
        { x: 395, y: 280 },
        { x: 440, y: 210 }
      ]
    },
    {
      id: 6,
      name: 'Stepped Cascades',
      pipe: { x: 250, y: 110 },
      glass: { x: 380, y: 410 },
      targetDrops: 32,
      blocks: [
        { x: 180, y: 230, w: 90, h: 40 },
        { x: 500, y: 280, w: 120, h: 40 },
        { x: 310, y: 500, w: 150, h: 40 }
      ],
      hint: [
        { x: 250, y: 180 },
        { x: 380, y: 240 },
        { x: 480, y: 260 }
      ]
    },
    {
      id: 7,
      name: 'Split Obstacles',
      pipe: { x: 400, y: 110 },
      glass: { x: 560, y: 390 },
      targetDrops: 32,
      blocks: [
        { x: 370, y: 210, w: 60, h: 60 },
        { x: 240, y: 360, w: 100, h: 40 },
        { x: 490, y: 480, w: 160, h: 40 }
      ],
      hint: [
        { x: 350, y: 170 },
        { x: 480, y: 250 },
        { x: 555, y: 365 }
      ]
    },
    {
      id: 8,
      name: 'Zig-Zag Maestro',
      pipe: { x: 550, y: 110 },
      glass: { x: 260, y: 400 },
      targetDrops: 32,
      blocks: [
        { x: 420, y: 230, w: 160, h: 40 },
        { x: 220, y: 320, w: 140, h: 40 },
        { x: 190, y: 490, w: 160, h: 40 }
      ],
      hint: [
        { x: 560, y: 180 },
        { x: 380, y: 250 },
        { x: 265, y: 370 }
      ]
    },
    {
      id: 9,
      name: 'Fortress Wall',
      pipe: { x: 220, y: 110 },
      glass: { x: 600, y: 340 },
      targetDrops: 30,
      blocks: [
        { x: 380, y: 180, w: 45, h: 260 }, // High central fortress wall
        { x: 530, y: 430, w: 150, h: 40 }
      ],
      hint: [
        { x: 210, y: 180 },
        { x: 340, y: 150 },
        { x: 450, y: 220 },
        { x: 590, y: 310 }
      ]
    },
    {
      id: 10,
      name: 'The Funnel Choke',
      pipe: { x: 400, y: 110 },
      glass: { x: 400, y: 420 },
      targetDrops: 32,
      blocks: [
        { x: 180, y: 250, w: 170, h: 40 },
        { x: 450, y: 250, w: 170, h: 40 },
        { x: 320, y: 510, w: 160, h: 40 }
      ],
      hint: [
        { x: 320, y: 200 },
        { x: 395, y: 240 },
        { x: 400, y: 380 }
      ]
    },
    {
      id: 11,
      name: 'Pendulum Steps',
      pipe: { x: 580, y: 110 },
      glass: { x: 240, y: 420 },
      targetDrops: 30,
      blocks: [
        { x: 480, y: 220, w: 90, h: 35 },
        { x: 360, y: 310, w: 90, h: 35 },
        { x: 160, y: 510, w: 160, h: 40 }
      ],
      hint: [
        { x: 580, y: 170 },
        { x: 420, y: 270 },
        { x: 245, y: 390 }
      ]
    },
    {
      id: 12,
      name: 'Bridge The Abyss',
      pipe: { x: 400, y: 100 },
      glass: { x: 550, y: 280 },
      targetDrops: 32,
      blocks: [
        { x: 240, y: 300, w: 60, h: 200 },
        { x: 500, y: 370, w: 110, h: 140 }
      ],
      hint: [
        { x: 360, y: 180 },
        { x: 440, y: 230 },
        { x: 540, y: 260 }
      ]
    },
    {
      id: 13,
      name: 'Under The Roof',
      pipe: { x: 330, y: 100 },
      glass: { x: 330, y: 410 },
      targetDrops: 30,
      blocks: [
        { x: 240, y: 240, w: 180, h: 35 }, // Protective umbrella roof
        { x: 250, y: 500, w: 160, h: 40 }
      ],
      hint: [
        { x: 320, y: 160 },
        { x: 450, y: 210 },
        { x: 470, y: 320 },
        { x: 340, y: 380 }
      ]
    },
    {
      id: 14,
      name: 'Pachinko Basin',
      pipe: { x: 400, y: 90 },
      glass: { x: 400, y: 430 },
      targetDrops: 30,
      blocks: [
        { x: 320, y: 180, w: 40, h: 40 },
        { x: 440, y: 180, w: 40, h: 40 },
        { x: 380, y: 260, w: 40, h: 40 },
        { x: 320, y: 520, w: 160, h: 40 }
      ],
      hint: [
        { x: 300, y: 230 },
        { x: 400, y: 360 },
        { x: 500, y: 230 }
      ]
    },
    {
      id: 15,
      name: 'Canyon Leap',
      pipe: { x: 220, y: 110 },
      glass: { x: 560, y: 400 },
      targetDrops: 32,
      blocks: [
        { x: 350, y: 260, w: 50, h: 260 },
        { x: 480, y: 490, w: 160, h: 40 }
      ],
      hint: [
        { x: 220, y: 180 },
        { x: 320, y: 210 },
        { x: 460, y: 290 },
        { x: 555, y: 370 }
      ]
    },
    {
      id: 16,
      name: 'The S-Curve Slide',
      pipe: { x: 560, y: 100 },
      glass: { x: 240, y: 410 },
      targetDrops: 30,
      blocks: [
        { x: 320, y: 220, w: 260, h: 35 },
        { x: 200, y: 320, w: 260, h: 35 },
        { x: 160, y: 500, w: 160, h: 40 }
      ],
      hint: [
        { x: 560, y: 170 },
        { x: 280, y: 200 },
        { x: 450, y: 300 },
        { x: 245, y: 380 }
      ]
    },
    {
      id: 17,
      name: 'High Pedestal',
      pipe: { x: 400, y: 90 },
      glass: { x: 400, y: 290 },
      targetDrops: 32,
      blocks: [
        { x: 360, y: 380, w: 80, h: 180 }, // Narrow high pedestal
        { x: 180, y: 340, w: 80, h: 40 },
        { x: 540, y: 340, w: 80, h: 40 }
      ],
      hint: [
        { x: 330, y: 180 },
        { x: 400, y: 250 },
        { x: 470, y: 180 }
      ]
    },
    {
      id: 18,
      name: 'Twin Spires',
      pipe: { x: 260, y: 100 },
      glass: { x: 560, y: 360 },
      targetDrops: 30,
      blocks: [
        { x: 340, y: 220, w: 45, h: 240 },
        { x: 450, y: 160, w: 45, h: 300 },
        { x: 490, y: 450, w: 150, h: 40 }
      ],
      hint: [
        { x: 250, y: 170 },
        { x: 330, y: 160 },
        { x: 440, y: 130 },
        { x: 555, y: 320 }
      ]
    },
    {
      id: 19,
      name: 'The U-Turn Alcove',
      pipe: { x: 520, y: 110 },
      glass: { x: 280, y: 320 },
      targetDrops: 30,
      blocks: [
        { x: 200, y: 220, w: 160, h: 35 },
        { x: 170, y: 220, w: 35, h: 220 },
        { x: 200, y: 410, w: 160, h: 35 },
        { x: 440, y: 340, w: 140, h: 40 }
      ],
      hint: [
        { x: 520, y: 180 },
        { x: 420, y: 280 },
        { x: 330, y: 290 },
        { x: 285, y: 300 }
      ]
    },
    {
      id: 20,
      name: 'Grand Finale - The Master Vault',
      pipe: { x: 400, y: 90 },
      glass: { x: 400, y: 420 },
      targetDrops: 34,
      blocks: [
        { x: 380, y: 190, w: 40, h: 40 }, // Center deflector diamond
        { x: 200, y: 280, w: 90, h: 35 },
        { x: 510, y: 280, w: 90, h: 35 },
        { x: 320, y: 510, w: 160, h: 40 }
      ],
      hint: [
        { x: 280, y: 220 },
        { x: 340, y: 340 },
        { x: 400, y: 390 },
        { x: 460, y: 340 },
        { x: 520, y: 220 }
      ]
    }
  ];

  // ==========================================================================
  // GAME ENGINE STATE
  // ==========================================================================
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');

  const V_WIDTH = 800;
  const V_HEIGHT = 600;
  let canvasW = 800;
  let canvasH = 600;
  let viewScale = 1;
  let viewOffsetX = 0;
  let viewOffsetY = 0;

  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    canvasW = Math.round(rect.width) || window.innerWidth;
    canvasH = Math.round(rect.height) || window.innerHeight;
    canvas.width = canvasW;
    canvas.height = canvasH;

    // Center and scale virtual space (800x600) into canvas viewport
    const topPad = canvasH > 520 ? 55 : 15;
    const availH = Math.max(200, canvasH - topPad);
    viewScale = Math.min(canvasW / V_WIDTH, availH / V_HEIGHT);
    viewOffsetX = (canvasW - V_WIDTH * viewScale) / 2;
    viewOffsetY = topPad + (availH - V_HEIGHT * viewScale) / 2;

    const confCanvas = document.getElementById('confettiCanvas');
    if (confCanvas) {
      confCanvas.width = canvasW;
      confCanvas.height = canvasH;
    }
  }
  window.addEventListener('resize', resizeCanvas);
  window.addEventListener('orientationchange', () => setTimeout(resizeCanvas, 150));

  let currentLevelIdx = parseInt(localStorage.getItem('hg_current_level') || '0', 10);
  if (currentLevelIdx < 0 || currentLevelIdx >= LEVELS.length) currentLevelIdx = 0;

  let levelProgress = JSON.parse(localStorage.getItem('hg_level_stars') || '{}');

  // Drawing & Ink State
  const MAX_INK_LENGTH = 1100;
  let isDrawing = false;
  let currentStroke = [];
  let userLines = []; // array of { points: [{x,y}], length: number }
  let totalInkUsed = 0;

  // Water Simulation
  const TOTAL_DROPLETS = 90;
  let droplets = [];
  let waterPouring = false;
  let dropletsSpawned = 0;
  let trappedDroplets = 0;
  let pourComplete = false;
  let evaluationTimer = 0;

  // Glass State
  let glassLevel = 0; // 0 to 1
  let glassHappy = false;
  let showHint = false;

  // Pen Skin
  let currentPenColor = localStorage.getItem('hg_pen_color') || '#263238';

  // UI Elements
  const levelNumEl = document.getElementById('levelNum');
  const inkBarFill = document.getElementById('inkBarFill');
  const star1 = document.getElementById('star1');
  const star2 = document.getElementById('star2');
  const star3 = document.getElementById('star3');

  const btnRestart = document.getElementById('btnRestart');
  const btnHint = document.getElementById('btnHint');
  const btnHome = document.getElementById('btnHome');
  const btnBrain = document.getElementById('btnBrain');
  const btnPencil = document.getElementById('btnPencil');
  const btnExit = document.getElementById('btnExit');

  const mainMenuScreen = document.getElementById('mainMenuScreen');
  const menuTotalStars = document.getElementById('menuTotalStars');
  const btnMenuPlay = document.getElementById('btnMenuPlay');
  const btnMenuLevels = document.getElementById('btnMenuLevels');
  const btnMenuSettings = document.getElementById('btnMenuSettings');
  const btnMenuExit = document.getElementById('btnMenuExit');

  const winModal = document.getElementById('winModal');
  const winStars = document.getElementById('winStars');
  const btnNextLevel = document.getElementById('btnNextLevel');
  const btnReplayWin = document.getElementById('btnReplayWin');

  const levelSelectModal = document.getElementById('levelSelectModal');
  const levelGrid = document.getElementById('levelGrid');
  const btnCloseLevels = document.getElementById('btnCloseLevels');

  const settingsModal = document.getElementById('settingsModal');
  const btnCloseSettings = document.getElementById('btnCloseSettings');
  const settingSfx = document.getElementById('settingSfx');
  const penColorPicker = document.getElementById('penColorPicker');
  const btnResetProgress = document.getElementById('btnResetProgress');

  const exitModal = document.getElementById('exitModal');
  const btnCancelExit = document.getElementById('btnCancelExit');
  const btnConfirmExit = document.getElementById('btnConfirmExit');

  // ==========================================================================
  // LEVEL INITIALIZATION
  // ==========================================================================
  function loadLevel(idx) {
    currentLevelIdx = idx % LEVELS.length;
    localStorage.setItem('hg_current_level', currentLevelIdx);

    const level = LEVELS[currentLevelIdx];
    levelNumEl.textContent = level.id;

    // Reset physics and drawing
    userLines = [];
    currentStroke = [];
    totalInkUsed = 0;
    droplets = [];
    waterPouring = false;
    dropletsSpawned = 0;
    trappedDroplets = 0;
    pourComplete = false;
    glassHappy = false;
    glassLevel = 0;
    showHint = false;
    evaluationTimer = 0;

    updateInkBar();
    closeAllModals();
    hideMainMenu();
  }

  function updateInkBar() {
    const ratio = Math.max(0, 1 - totalInkUsed / MAX_INK_LENGTH);
    inkBarFill.style.width = (ratio * 100) + '%';

    // Stars thresholds: 3 stars if >= 65%, 2 stars if >= 35%, 1 star if > 0%
    star1.classList.toggle('earned', ratio > 0.05);
    star2.classList.toggle('earned', ratio >= 0.35);
    star3.classList.toggle('earned', ratio >= 0.65);
  }

  function getEarnedStars() {
    const ratio = Math.max(0, 1 - totalInkUsed / MAX_INK_LENGTH);
    if (ratio >= 0.65) return 3;
    if (ratio >= 0.35) return 2;
    if (ratio > 0.05) return 1;
    return 1;
  }

  function closeAllModals() {
    [winModal, levelSelectModal, settingsModal, exitModal].forEach(m => {
      if (m) {
        m.classList.add('hidden');
        m.style.display = 'none';
      }
    });
  }

  function updateTotalStarsDisplay() {
    let total = 0;
    for (let k in levelProgress) {
      total += (levelProgress[k] || 0);
    }
    const maxPossible = LEVELS.length * 3;
    if (menuTotalStars) menuTotalStars.textContent = `${total} / ${maxPossible}`;
  }

  function showMainMenu() {
    updateTotalStarsDisplay();
    closeAllModals();
    if (mainMenuScreen) {
      mainMenuScreen.classList.remove('hidden');
      mainMenuScreen.style.display = 'flex';
    }
  }

  function hideMainMenu() {
    if (mainMenuScreen) {
      mainMenuScreen.classList.add('hidden');
      mainMenuScreen.style.display = 'none';
    }
  }

  function openExitModal() {
    AudioEngine.playClick();
    if (exitModal) {
      exitModal.classList.remove('hidden');
      exitModal.style.display = 'grid';
    }
  }

  function closeExitModal() {
    AudioEngine.playClick();
    if (exitModal) {
      exitModal.classList.add('hidden');
      exitModal.style.display = 'none';
    }
  }

  function doExitGame() {
    AudioEngine.playClick();
    try { window.parent.postMessage('closeModal', '*'); } catch (err) {}
    try { window.parent.postMessage({ action: 'closeModal' }, '*'); } catch (err) {}
    try { window.history.back(); } catch (err) {}
    setTimeout(() => {
      try { window.close(); } catch (err) {}
    }, 250);
  }

  // ==========================================================================
  // DRAWING LOGIC (Smooth Stroke & Ink Calculation)
  // ==========================================================================
  function getCanvasPos(e) {
    const rect = canvas.getBoundingClientRect();
    const cx = (e.touches && e.touches.length > 0) ? e.touches[0].clientX : e.clientX;
    const cy = (e.touches && e.touches.length > 0) ? e.touches[0].clientY : e.clientY;
    const pageX = cx - rect.left;
    const pageY = cy - rect.top;
    return {
      x: (pageX - viewOffsetX) / viewScale,
      y: (pageY - viewOffsetY) / viewScale
    };
  }

  function onPointerDown(e) {
    // If water is already pouring or solved, ignore
    if (waterPouring || pourComplete || glassHappy) return;
    if (e.target && e.target.closest('button, input, .modal-overlay')) return;

    isDrawing = true;
    currentStroke = [];
    const p = getCanvasPos(e);
    currentStroke.push(p);
    AudioEngine.playPencil();
  }

  function onPointerMove(e) {
    if (!isDrawing) return;
    const p = getCanvasPos(e);
    const lastP = currentStroke[currentStroke.length - 1];

    if (lastP) {
      const d = Math.hypot(p.x - lastP.x, p.y - lastP.y);
      if (d > 4) {
        // Ink usage check
        if (totalInkUsed + d <= MAX_INK_LENGTH) {
          totalInkUsed += d;
          currentStroke.push(p);
          updateInkBar();
          if (Math.random() < 0.25) AudioEngine.playPencil();
        } else {
          // Ran out of ink! Auto release
          onPointerUp();
        }
      }
    }
  }

  function onPointerUp() {
    if (!isDrawing) return;
    isDrawing = false;

    if (currentStroke.length >= 2) {
      userLines.push({
        points: currentStroke.slice(),
        color: currentPenColor
      });
      // Once line is drawn, start the water dispenser!
      startWaterFlow();
    }
    currentStroke = [];
  }

  canvas.addEventListener('mousedown', onPointerDown);
  window.addEventListener('mousemove', onPointerMove);
  window.addEventListener('mouseup', onPointerUp);

  canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    onPointerDown(e);
  }, { passive: false });

  window.addEventListener('touchmove', (e) => {
    if (isDrawing) {
      e.preventDefault();
      onPointerMove(e);
    }
  }, { passive: false });

  window.addEventListener('touchend', onPointerUp);

  // ==========================================================================
  // WATER FLUID PHYSICS SIMULATION
  // ==========================================================================
  function startWaterFlow() {
    if (waterPouring) return;
    waterPouring = true;
    dropletsSpawned = 0;
    trappedDroplets = 0;
    pourComplete = false;
  }

  function updatePhysics() {
    const level = LEVELS[currentLevelIdx];
    const gravity = 0.64; // Snappy, realistic liquid gravity

    // 1. Dispense fast, continuous water stream
    if (waterPouring && dropletsSpawned < TOTAL_DROPLETS) {
      for (let k = 0; k < 3; k++) {
        if (dropletsSpawned >= TOTAL_DROPLETS) break;
        const offsetX = (Math.random() - 0.5) * 10;
        droplets.push({
          x: level.pipe.x + offsetX,
          y: level.pipe.y + 26,
          vx: (Math.random() - 0.5) * 0.5,
          vy: 4.8 + Math.random() * 1.4, // Fast initial stream velocity
          radius: 5.8,
          trapped: false
        });
        dropletsSpawned++;
        if (dropletsSpawned % 6 === 0) AudioEngine.playDrip();
      }
    } else if (waterPouring && dropletsSpawned >= TOTAL_DROPLETS) {
      waterPouring = false;
      pourComplete = true;
      evaluationTimer = performance.now();
    }

    // 2. Glass boundaries & target volume
    const gw = 86; // top width
    const gh = 104; // height
    const gx = level.glass.x;
    const gy = level.glass.y;
    const gLeft = gx - gw * 0.5;
    const gRight = gx + gw * 0.5;
    const gBottom = gy + gh;
    const gTop = gy;

    // 3. Update each droplet
    trappedDroplets = 0;

    for (let i = droplets.length - 1; i >= 0; i--) {
      const d = droplets[i];
      d.vy += gravity;
      d.vx *= 0.985;
      d.x += d.vx;
      d.y += d.vy;

      // Inside glass collision
      if (d.x > gLeft + 4 && d.x < gRight - 4 && d.y > gTop + 10 && d.y < gBottom - 4) {
        d.trapped = true;
        trappedDroplets++;

        // Water bottom & wall boundaries inside glass
        if (d.y > gBottom - d.radius - 4) {
          d.y = gBottom - d.radius - 4;
          d.vy = -d.vy * 0.12;
          d.vx *= 0.8;
        }
        if (d.x < gLeft + d.radius + 6) {
          d.x = gLeft + d.radius + 6;
          d.vx = Math.abs(d.vx) * 0.25;
        }
        if (d.x > gRight - d.radius - 6) {
          d.x = gRight - d.radius - 6;
          d.vx = -Math.abs(d.vx) * 0.25;
        }
      } else {
        // Exterior collision with glass outer walls
        if (d.y > gTop && d.y < gBottom + 4) {
          // Left outer edge
          if (Math.abs(d.x - gLeft) < d.radius + 4) {
            d.x = gLeft - d.radius - 4;
            d.vx = -Math.abs(d.vx) * 0.4 - 0.4;
          }
          // Right outer edge
          if (Math.abs(d.x - gRight) < d.radius + 4) {
            d.x = gRight + d.radius + 4;
            d.vx = Math.abs(d.vx) * 0.4 + 0.4;
          }
        }

        // Collision with static level obstacle blocks
        for (let b = 0; b < level.blocks.length; b++) {
          const block = level.blocks[b];
          if (d.x + d.radius > block.x && d.x - d.radius < block.x + block.w &&
              d.y + d.radius > block.y && d.y - d.radius < block.y + block.h) {
            const overlapL = (d.x + d.radius) - block.x;
            const overlapR = (block.x + block.w) - (d.x - d.radius);
            const overlapT = (d.y + d.radius) - block.y;
            const overlapB = (block.y + block.h) - (d.y - d.radius);

            const minOverlap = Math.min(overlapL, overlapR, overlapT, overlapB);

            if (minOverlap === overlapT && d.vy > 0) {
              d.y = block.y - d.radius;
              d.vy = -d.vy * 0.1;
              d.vx *= 0.96;
            } else if (minOverlap === overlapB && d.vy < 0) {
              d.y = block.y + block.h + d.radius;
              d.vy = Math.abs(d.vy) * 0.2;
            } else if (minOverlap === overlapL) {
              d.x = block.x - d.radius;
              d.vx = -Math.abs(d.vx) * 0.4;
            } else if (minOverlap === overlapR) {
              d.x = block.x + block.w + d.radius;
              d.vx = Math.abs(d.vx) * 0.4;
            }
          }
        }

        // Collision with user-drawn lines
        for (let l = 0; l < userLines.length; l++) {
          const pts = userLines[l].points;
          for (let p = 0; p < pts.length - 1; p++) {
            collideDropletWithSegment(d, pts[p], pts[p + 1]);
          }
        }

        // If off-screen, remove
        if (d.y > V_HEIGHT + 120 || d.x < -120 || d.x > V_WIDTH + 120) {
          droplets.splice(i, 1);
        }
      }
    }

    // 4. Calculate Glass Fill Level
    const targetCount = level.targetDrops || 40;
    glassLevel = Math.min(1.0, trappedDroplets / targetCount);

    if (glassLevel >= 0.85 && !glassHappy) {
      triggerVictory();
    }
  }

  function collideDropletWithSegment(d, p1, p2) {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const lenSq = dx * dx + dy * dy;
    if (lenSq === 0) return;

    let t = ((d.x - p1.x) * dx + (d.y - p1.y) * dy) / lenSq;
    t = Math.max(0, Math.min(1, t));

    const projX = p1.x + t * dx;
    const projY = p1.y + t * dy;
    const dist = Math.hypot(d.x - projX, d.y - projY);
    const lineRadius = 5.5;

    if (dist < d.radius + lineRadius) {
      const nx = (d.x - projX) / (dist || 1);
      const ny = (d.y - projY) / (dist || 1);

      // Reposition outside line
      d.x = projX + nx * (d.radius + lineRadius);
      d.y = projY + ny * (d.radius + lineRadius);

      const len = Math.sqrt(lenSq);
      const tx = dx / len;
      const ty = dy / len;

      const vNormal = d.vx * nx + d.vy * ny;
      let vTangent = d.vx * tx + d.vy * ty;

      if (vNormal < 0) {
        // Natural fluid sliding: kill bounce into air, accelerate along ramp downwards
        const bounce = -vNormal * 0.08;

        // Gravity slide assist: water naturally flows downhill
        if (ty > 0 && vTangent < 0) vTangent = -vTangent;
        else if (ty < 0 && vTangent > 0) vTangent = -vTangent;

        vTangent *= 0.985;

        d.vx = nx * bounce + tx * vTangent;
        d.vy = ny * bounce + ty * vTangent;
      }
    }
  }

  function triggerVictory() {
    glassHappy = true;
    AudioEngine.playSplash();
    AudioEngine.playWin();
    Confetti.launch(85);

    const stars = getEarnedStars();
    levelProgress[currentLevelIdx] = Math.max(levelProgress[currentLevelIdx] || 0, stars);
    localStorage.setItem('hg_level_stars', JSON.stringify(levelProgress));

    setTimeout(() => {
      showVictoryModal(stars);
    }, 750);
  }

  function showVictoryModal(stars) {
    winStars.innerHTML = '';
    for (let i = 1; i <= 3; i++) {
      const span = document.createElement('span');
      span.className = 'win-star' + (i <= stars ? ' active' : '');
      span.textContent = '⭐';
      winStars.appendChild(span);
      if (i <= stars) {
        setTimeout(() => AudioEngine.playStar(i - 1), i * 220);
      }
    }
    winModal.classList.remove('hidden');
    winModal.style.display = 'grid';
  }

  // ==========================================================================
  // RENDERING PIPELINE (Exact Lion Studios / Poki Art Style)
  // ==========================================================================
  function render() {
    ctx.clearRect(0, 0, canvasW, canvasH);
    ctx.save();
    ctx.translate(viewOffsetX, viewOffsetY);
    ctx.scale(viewScale, viewScale);

    const level = LEVELS[currentLevelIdx];

    // 1. Draw Hint Line (if active)
    if (showHint && level.hint) {
      ctx.save();
      ctx.strokeStyle = '#fbc02d';
      ctx.lineWidth = 4;
      ctx.setLineDash([8, 8]);
      ctx.beginPath();
      ctx.moveTo(level.hint[0].x, level.hint[0].y);
      for (let i = 1; i < level.hint.length; i++) {
        ctx.lineTo(level.hint[i].x, level.hint[i].y);
      }
      ctx.stroke();
      ctx.restore();
    }

    // 2. Draw Teal Obstacle Blocks
    for (let i = 0; i < level.blocks.length; i++) {
      const b = level.blocks[i];
      ctx.save();
      ctx.fillStyle = '#459a96';
      ctx.strokeStyle = '#234e4c';
      ctx.lineWidth = 3.5;
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.rect(b.x, b.y, b.w, b.h);
      ctx.fill();
      ctx.stroke();

      // Top edge highlight
      ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.fillRect(b.x + 2, b.y + 2, b.w - 4, 4);
      ctx.restore();
    }

    // 3. Draw Water Dispenser Pipe (Top)
    drawPipe(level.pipe.x, level.pipe.y);

    // 4. Draw User Drawn Inks
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 7;

    for (let i = 0; i < userLines.length; i++) {
      const line = userLines[i];
      ctx.strokeStyle = line.color || '#263238';
      ctx.beginPath();
      ctx.moveTo(line.points[0].x, line.points[0].y);
      for (let p = 1; p < line.points.length; p++) {
        ctx.lineTo(line.points[p].x, line.points[p].y);
      }
      ctx.stroke();
    }

    // Current Active Stroke
    if (currentStroke.length > 1) {
      ctx.strokeStyle = currentPenColor;
      ctx.beginPath();
      ctx.moveTo(currentStroke[0].x, currentStroke[0].y);
      for (let p = 1; p < currentStroke.length; p++) {
        ctx.lineTo(currentStroke[p].x, currentStroke[p].y);
      }
      ctx.stroke();
    }
    ctx.restore();

    // 5. Draw Glass Tumbler & Cute Face
    drawGlass(level.glass.x, level.glass.y);

    // 6. Draw Fluid Water Droplets
    drawWaterDroplets();

    ctx.restore();
  }

  function drawPipe(px, py) {
    ctx.save();
    ctx.translate(px, py);

    // If water is actively pouring, draw steady water spout jet
    if (waterPouring) {
      const spoutGrad = ctx.createLinearGradient(0, 34, 0, 56);
      spoutGrad.addColorStop(0, '#00b0ff');
      spoutGrad.addColorStop(1, 'rgba(0, 176, 255, 0.7)');
      ctx.fillStyle = spoutGrad;
      ctx.beginPath();
      ctx.moveTo(-6, 34);
      ctx.lineTo(6, 34);
      ctx.lineTo(4, 52);
      ctx.lineTo(-4, 52);
      ctx.closePath();
      ctx.fill();
    }

    // Dispenser Base Mount Plate
    ctx.fillStyle = '#78909c';
    ctx.strokeStyle = '#37474f';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.rect(-24, 0, 48, 10);
    ctx.fill();
    ctx.stroke();

    // Dispenser Box
    ctx.fillStyle = '#b0bec5';
    ctx.beginPath();
    ctx.rect(-18, 10, 36, 26);
    ctx.fill();
    ctx.stroke();

    // Down Arrow (⬇)
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(0, 30);
    ctx.lineTo(-7, 23);
    ctx.lineTo(-3, 23);
    ctx.lineTo(-3, 16);
    ctx.lineTo(3, 16);
    ctx.lineTo(3, 23);
    ctx.lineTo(7, 23);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawGlass(gx, gy) {
    const gwTop = 86;
    const gwBot = 72;
    const gh = 104;

    ctx.save();
    ctx.translate(gx, gy);

    // Water level fill inside glass
    if (glassLevel > 0) {
      const waterH = gh * 0.75 * glassLevel;
      const fillY = gh - waterH;

      ctx.save();
      // Clip to glass interior
      ctx.beginPath();
      ctx.moveTo(-gwTop * 0.5 + 4, 4);
      ctx.lineTo(-gwBot * 0.5 + 4, gh - 4);
      ctx.lineTo(gwBot * 0.5 - 4, gh - 4);
      ctx.lineTo(gwTop * 0.5 - 4, 4);
      ctx.closePath();
      ctx.clip();

      // Deep rich water gradient
      const waterGrad = ctx.createLinearGradient(0, fillY, 0, gh);
      waterGrad.addColorStop(0, '#40c4ff');
      waterGrad.addColorStop(0.35, '#00b0ff');
      waterGrad.addColorStop(1, '#0077c2');
      ctx.fillStyle = waterGrad;
      ctx.fillRect(-gwTop * 0.5, fillY, gwTop, waterH + 12);

      // Sloshing wave on water surface
      const wavePhase = performance.now() * 0.007;
      ctx.fillStyle = '#80d8ff';
      ctx.beginPath();
      ctx.moveTo(-gwTop * 0.5, fillY);
      for (let wx = -gwTop * 0.5; wx <= gwTop * 0.5; wx += 3) {
        const wy = fillY + Math.sin(wx * 0.14 + wavePhase) * 2.8;
        ctx.lineTo(wx, wy);
      }
      ctx.lineTo(gwTop * 0.5, fillY + 6);
      ctx.lineTo(-gwTop * 0.5, fillY + 6);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    }

    // Glass Tumbler Outline
    ctx.strokeStyle = '#263238';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(-gwTop * 0.5, 0);
    ctx.lineTo(-gwBot * 0.5, gh);
    ctx.lineTo(gwBot * 0.5, gh);
    ctx.lineTo(gwTop * 0.5, 0);
    ctx.stroke();

    // Dotted Target Line
    ctx.strokeStyle = '#78909c';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(-gwTop * 0.46, gh * 0.35);
    ctx.lineTo(gwTop * 0.46, gh * 0.35);
    ctx.stroke();
    ctx.setLineDash([]);

    // Glass Face Expressions
    drawGlassFace(glassHappy, glassLevel);

    ctx.restore();
  }

  function drawGlassFace(isHappy, fillRatio) {
    ctx.save();
    ctx.translate(0, 52);

    if (isHappy) {
      // HAPPY FACE 😃
      // Left Eye: Happy Arc ^
      ctx.strokeStyle = '#263238';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(-14, -6, 7, Math.PI * 1.1, Math.PI * 1.9);
      ctx.stroke();

      // Right Eye: Happy Arc ^
      ctx.beginPath();
      ctx.arc(14, -6, 7, Math.PI * 1.1, Math.PI * 1.9);
      ctx.stroke();

      // Blushing Cheeks
      ctx.fillStyle = 'rgba(255, 112, 166, 0.55)';
      ctx.beginPath();
      ctx.ellipse(-20, 4, 5, 3, 0, 0, Math.PI * 2);
      ctx.ellipse(20, 4, 5, 3, 0, 0, Math.PI * 2);
      ctx.fill();

      // Big Open Smile
      ctx.fillStyle = '#e53935';
      ctx.strokeStyle = '#263238';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 4, 13, 0, Math.PI);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (fillRatio > 0.35) {
      // CURIOUS / NEUTRAL FACE 😐
      ctx.fillStyle = '#263238';
      ctx.beginPath();
      ctx.arc(-14, -4, 4, 0, Math.PI * 2);
      ctx.arc(14, -4, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#263238';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 6, 6, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      // SAD FACE ☹️ (Exact Poki Glass Expression)
      // Slanted sad eyebrows
      ctx.strokeStyle = '#263238';
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-20, -14);
      ctx.lineTo(-8, -10);
      ctx.moveTo(20, -14);
      ctx.lineTo(8, -10);
      ctx.stroke();

      // Eyes
      ctx.fillStyle = '#263238';
      ctx.beginPath();
      ctx.arc(-14, -4, 4.5, 0, Math.PI * 2);
      ctx.arc(14, -4, 4.5, 0, Math.PI * 2);
      ctx.fill();

      // Eye shines
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-15.5, -5.5, 1.8, 0, Math.PI * 2);
      ctx.arc(12.5, -5.5, 1.8, 0, Math.PI * 2);
      ctx.fill();

      // Curved Sad Mouth ☹️
      ctx.strokeStyle = '#263238';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 15, 9, Math.PI * 1.2, Math.PI * 1.8);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawWaterDroplets() {
    ctx.save();
    for (let i = 0; i < droplets.length; i++) {
      const d = droplets[i];
      const speed = Math.hypot(d.vx, d.vy);
      const angle = Math.atan2(d.vy, d.vx);

      ctx.save();
      ctx.translate(d.x, d.y);
      ctx.rotate(angle);

      // Elongate along direction of motion for fast fluid stream
      const stretch = Math.min(16, d.radius + speed * 1.4);

      // Water body
      ctx.fillStyle = '#00b0ff';
      ctx.beginPath();
      ctx.ellipse(0, 0, stretch, d.radius, 0, 0, Math.PI * 2);
      ctx.fill();

      // Deep water core
      ctx.fillStyle = '#0288d1';
      ctx.beginPath();
      ctx.ellipse(0, 0, stretch * 0.7, d.radius * 0.65, 0, 0, Math.PI * 2);
      ctx.fill();

      // Specular highlight glint
      ctx.fillStyle = '#e1f5fe';
      ctx.beginPath();
      ctx.ellipse(-stretch * 0.2, -d.radius * 0.28, stretch * 0.45, d.radius * 0.32, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
    ctx.restore();
  }

  // ==========================================================================
  // GAME LOOP
  // ==========================================================================
  function gameLoop() {
    updatePhysics();
    render();
    requestAnimationFrame(gameLoop);
  }

  // ==========================================================================
  // UI BUTTON EVENT BINDINGS
  // ==========================================================================
  btnRestart.addEventListener('click', () => {
    AudioEngine.playClick();
    loadLevel(currentLevelIdx);
  });

  btnHint.addEventListener('click', () => {
    AudioEngine.playClick();
    showHint = !showHint;
  });

  btnHome.addEventListener('click', () => {
    AudioEngine.playClick();
    showMainMenu();
  });

  btnBrain.addEventListener('click', () => {
    AudioEngine.playClick();
    openLevelSelect();
  });

  btnPencil.addEventListener('click', () => {
    AudioEngine.playClick();
    openSettings();
  });

  if (btnExit) btnExit.addEventListener('click', openExitModal);
  if (btnMenuExit) btnMenuExit.addEventListener('click', openExitModal);
  if (btnCancelExit) btnCancelExit.addEventListener('click', closeExitModal);
  if (btnConfirmExit) btnConfirmExit.addEventListener('click', doExitGame);

  if (btnMenuPlay) {
    btnMenuPlay.addEventListener('click', () => {
      AudioEngine.playClick();
      hideMainMenu();
      loadLevel(currentLevelIdx);
    });
  }

  if (btnMenuLevels) {
    btnMenuLevels.addEventListener('click', () => {
      AudioEngine.playClick();
      openLevelSelect();
    });
  }

  if (btnMenuSettings) {
    btnMenuSettings.addEventListener('click', () => {
      AudioEngine.playClick();
      openSettings();
    });
  }

  // Level Select Modal
  function openLevelSelect() {
    levelGrid.innerHTML = '';
    LEVELS.forEach((lvl, idx) => {
      const tile = document.createElement('div');
      tile.className = 'level-tile' + (idx === currentLevelIdx ? ' current' : '');
      const stars = levelProgress[idx] || 0;
      let starStr = '☆☆☆';
      if (stars === 3) starStr = '⭐⭐⭐';
      else if (stars === 2) starStr = '⭐⭐☆';
      else if (stars === 1) starStr = '⭐☆☆';

      tile.innerHTML = `
        <div class="level-tile-num">${lvl.id}</div>
        <div class="level-tile-stars">${starStr}</div>
      `;
      tile.addEventListener('click', () => {
        AudioEngine.playClick();
        loadLevel(idx);
      });
      levelGrid.appendChild(tile);
    });
    levelSelectModal.classList.remove('hidden');
    levelSelectModal.style.display = 'grid';
  }

  if (btnCloseLevels) {
    btnCloseLevels.addEventListener('click', () => {
      AudioEngine.playClick();
      levelSelectModal.classList.add('hidden');
      levelSelectModal.style.display = 'none';
    });
  }

  // Next Level / Replay on Victory Modal
  btnNextLevel.addEventListener('click', () => {
    AudioEngine.playClick();
    loadLevel(currentLevelIdx + 1);
  });

  btnReplayWin.addEventListener('click', () => {
    AudioEngine.playClick();
    loadLevel(currentLevelIdx);
  });

  // Settings Modal Handlers
  function openSettings() {
    settingsModal.classList.remove('hidden');
    settingsModal.style.display = 'grid';
    if (settingSfx) settingSfx.checked = AudioEngine.isEnabled();
    if (settingFullscreen) settingFullscreen.checked = isFullscreen();
  }

  if (btnCloseSettings) {
    btnCloseSettings.addEventListener('click', () => {
      AudioEngine.playClick();
      settingsModal.classList.add('hidden');
      settingsModal.style.display = 'none';
    });
  }

  if (settingSfx) {
    settingSfx.addEventListener('change', () => {
      AudioEngine.toggle(settingSfx.checked);
      AudioEngine.playClick();
    });
  }

  if (penColorPicker) {
    penColorPicker.addEventListener('click', (e) => {
      const btn = e.target.closest('.pen-color-btn');
      if (!btn) return;
      currentPenColor = btn.dataset.color || '#263238';
      localStorage.setItem('hg_pen_color', currentPenColor);
      penColorPicker.querySelectorAll('.pen-color-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      AudioEngine.playClick();
    });
  }

  if (btnResetProgress) {
    btnResetProgress.addEventListener('click', () => {
      if (confirm('Reset all completed levels and stars?')) {
        levelProgress = {};
        localStorage.removeItem('hg_level_stars');
        localStorage.setItem('hg_current_level', '0');
        loadLevel(0);
        AudioEngine.playClick();
      }
    });
  }

  // ==========================================================================
  // FULLSCREEN ENGINE
  // ==========================================================================
  const btnFullscreen = document.getElementById('btnFullscreen');
  const btnMenuFullscreen = document.getElementById('btnMenuFullscreen');
  const settingFullscreen = document.getElementById('settingFullscreen');

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
    if (fsIcon) fsIcon.textContent = full ? '🗗' : '⛶';
    if (menuFsIcon) menuFsIcon.textContent = full ? '🗗' : '⛶';
    if (settingFullscreen) settingFullscreen.checked = full;
    setTimeout(resizeCanvas, 80);
  }

  if (btnFullscreen) {
    btnFullscreen.addEventListener('click', () => {
      AudioEngine.playClick();
      toggleFullscreen();
    });
  }

  if (btnMenuFullscreen) {
    btnMenuFullscreen.addEventListener('click', () => {
      AudioEngine.playClick();
      toggleFullscreen();
    });
  }

  if (settingFullscreen) {
    settingFullscreen.addEventListener('change', () => {
      AudioEngine.playClick();
      toggleFullscreen();
    });
  }

  document.addEventListener('fullscreenchange', updateFullscreenUI);
  document.addEventListener('webkitfullscreenchange', updateFullscreenUI);
  document.addEventListener('mozfullscreenchange', updateFullscreenUI);

  // Backdrop modal dismiss
  [winModal, levelSelectModal, settingsModal, exitModal].forEach(m => {
    if (m) {
      m.addEventListener('click', (e) => {
        if (e.target === m && m !== winModal) {
          m.classList.add('hidden');
          m.style.display = 'none';
        }
      });
    }
  });

  // ==========================================================================
  // INITIALIZATION
  // ==========================================================================
  document.addEventListener('DOMContentLoaded', () => {
    resizeCanvas();
    showMainMenu();
    requestAnimationFrame(gameLoop);
  });
})();
