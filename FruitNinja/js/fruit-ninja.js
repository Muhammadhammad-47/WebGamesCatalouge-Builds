/* ==========================================================================
   FRUIT NINJA - DOJO ENGINE & GAMEPLAY
   Fluid blade physics, procedural fruit slicing, combo system, audio synth
   ========================================================================== */

(function () {
  'use strict';

  // ==========================================================================
  // WEB AUDIO SYNTHESIZER (Zero network dependency, 100% reliable)
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
      playSwish: function (intensity) {
        if (!soundEnabled) return;
        const ac = getContext();
        if (!ac) return;

        // Metallic whoosh: bandpass filtered noise + rapid sine sweep
        const now = ac.currentTime;
        const duration = 0.16;

        const bufferSize = Math.floor(ac.sampleRate * duration);
        const buffer = ac.createBuffer(1, bufferSize, ac.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }

        const noise = ac.createBufferSource();
        noise.buffer = buffer;

        const filter = ac.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(600, now);
        filter.frequency.exponentialRampToValueAtTime(1800, now + duration * 0.4);
        filter.frequency.exponentialRampToValueAtTime(400, now + duration);
        filter.Q.value = 3.0;

        const gain = ac.createGain();
        const vol = Math.min(0.28, 0.12 + (intensity || 1) * 0.05);
        gain.gain.setValueAtTime(0.01, now);
        gain.gain.linearRampToValueAtTime(vol, now + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ac.destination);
        noise.start(now);
      },
      playSplat: function () {
        if (!soundEnabled) return;
        const ac = getContext();
        if (!ac) return;

        const now = ac.currentTime;
        // Wet juicy slice: pop oscillator + squirt noise
        const osc = ac.createOscillator();
        const oscGain = ac.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(420, now);
        osc.frequency.exponentialRampToValueAtTime(90, now + 0.12);
        oscGain.gain.setValueAtTime(0.35, now);
        oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
        osc.connect(oscGain);
        oscGain.connect(ac.destination);
        osc.start(now);
        osc.stop(now + 0.12);

        // Squirt burst
        const bufferSize = Math.floor(ac.sampleRate * 0.09);
        const buffer = ac.createBuffer(1, bufferSize, ac.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }
        const noise = ac.createBufferSource();
        noise.buffer = buffer;
        const filter = ac.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 2400;
        const noiseGain = ac.createGain();
        noiseGain.gain.setValueAtTime(0.2, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.09);
        noise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(ac.destination);
        noise.start(now);
      },
      playCombo: function (count) {
        if (!soundEnabled) return;
        const ac = getContext();
        if (!ac) return;

        // Celebratory arpeggio chord
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        notes.forEach((freq, idx) => {
          const osc = ac.createOscillator();
          const gain = ac.createGain();
          const t = ac.currentTime + idx * 0.06;
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, t);
          gain.gain.setValueAtTime(0.18, t);
          gain.gain.exponentialRampToValueAtTime(0.005, t + 0.35);
          osc.connect(gain);
          gain.connect(ac.destination);
          osc.start(t);
          osc.stop(t + 0.35);
        });
      },
      playExplosion: function () {
        if (!soundEnabled) return;
        const ac = getContext();
        if (!ac) return;

        const now = ac.currentTime;
        // Deep sub-bass boom
        const osc = ac.createOscillator();
        const oscGain = ac.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(25, now + 0.7);
        oscGain.gain.setValueAtTime(0.5, now);
        oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
        osc.connect(oscGain);
        oscGain.connect(ac.destination);
        osc.start(now);
        osc.stop(now + 0.7);

        // Noise rumble
        const bufferSize = Math.floor(ac.sampleRate * 0.6);
        const buffer = ac.createBuffer(1, bufferSize, ac.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }
        const noise = ac.createBufferSource();
        noise.buffer = buffer;
        const filter = ac.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, now);
        filter.frequency.linearRampToValueAtTime(100, now + 0.6);
        const noiseGain = ac.createGain();
        noiseGain.gain.setValueAtTime(0.4, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
        noise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(ac.destination);
        noise.start(now);
      },
      playStrike: function () {
        if (!soundEnabled) return;
        const ac = getContext();
        if (!ac) return;
        const now = ac.currentTime;
        // Harsh buzzer / clapper
        const osc = ac.createOscillator();
        const gain = ac.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.setValueAtTime(110, now + 0.1);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
        osc.connect(gain);
        gain.connect(ac.destination);
        osc.start(now);
        osc.stop(now + 0.25);
      },
      playClick: function () {
        if (!soundEnabled) return;
        const ac = getContext();
        if (!ac) return;
        const osc = ac.createOscillator();
        const gain = ac.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, ac.currentTime);
        gain.gain.setValueAtTime(0.15, ac.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.05);
        osc.connect(gain);
        gain.connect(ac.destination);
        osc.start();
        osc.stop(ac.currentTime + 0.05);
      }
    };
  })();

  // ==========================================================================
  // FRUIT DEFINITIONS & PROCEDURAL GRAPHICS
  // ==========================================================================
  const FRUIT_SPECS = {
    watermelon: {
      name: 'Watermelon',
      radius: 46,
      score: 1,
      rindColor: '#2e7d32',
      rindStripe: '#1b5e20',
      pulpColor: '#e53935',
      juiceColor: '#e53935',
      seedColor: '#1a1a1a',
      draw: function (ctx, r) {
        // Outer green striped sphere
        ctx.fillStyle = this.rindColor;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();

        // Dark green curvy stripes
        ctx.strokeStyle = this.rindStripe;
        ctx.lineWidth = r * 0.14;
        ctx.lineCap = 'round';
        for (let i = -2; i <= 2; i++) {
          ctx.beginPath();
          ctx.ellipse(i * (r * 0.35), 0, r * 0.15, r * 0.88, 0, 0, Math.PI * 2);
          ctx.stroke();
        }

        // 3D Lighting shine
        const grad = ctx.createRadialGradient(-r * 0.3, -r * 0.3, 2, 0, 0, r);
        grad.addColorStop(0, 'rgba(255,255,255,0.4)');
        grad.addColorStop(0.6, 'rgba(255,255,255,0)');
        grad.addColorStop(1, 'rgba(0,0,0,0.3)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();
      },
      drawHalf: function (ctx, r, isLeft) {
        // Cut watermelon half showing red pulp and black seeds
        ctx.beginPath();
        ctx.arc(0, 0, r, isLeft ? Math.PI * 0.5 : -Math.PI * 0.5, isLeft ? -Math.PI * 0.5 : Math.PI * 0.5);
        ctx.closePath();

        // Green Rind
        ctx.fillStyle = this.rindColor;
        ctx.fill();

        // White Pith
        ctx.save();
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.9, isLeft ? Math.PI * 0.5 : -Math.PI * 0.5, isLeft ? -Math.PI * 0.5 : Math.PI * 0.5);
        ctx.closePath();
        ctx.fillStyle = '#f1f8e9';
        ctx.fill();

        // Red Pulp
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.82, isLeft ? Math.PI * 0.5 : -Math.PI * 0.5, isLeft ? -Math.PI * 0.5 : Math.PI * 0.5);
        ctx.closePath();
        ctx.fillStyle = this.pulpColor;
        ctx.fill();

        // Seeds
        ctx.fillStyle = this.seedColor;
        const seedAngles = isLeft ? [Math.PI * 0.8, Math.PI, Math.PI * 1.2] : [-Math.PI * 0.2, 0, Math.PI * 0.2];
        seedAngles.forEach(a => {
          const sx = Math.cos(a) * (r * 0.55);
          const sy = Math.sin(a) * (r * 0.55);
          ctx.beginPath();
          ctx.ellipse(sx, sy, 3, 5, a, 0, Math.PI * 2);
          ctx.fill();
        });
        ctx.restore();
      }
    },
    orange: {
      name: 'Orange',
      radius: 38,
      score: 1,
      rindColor: '#ff9800',
      pulpColor: '#ffb74d',
      juiceColor: '#ff9800',
      draw: function (ctx, r) {
        ctx.fillStyle = this.rindColor;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();

        // Dimpled texture
        ctx.fillStyle = 'rgba(230, 81, 0, 0.25)';
        for (let i = 0; i < 14; i++) {
          const ang = (i / 14) * Math.PI * 2;
          const dist = (i % 2 === 0 ? 0.4 : 0.75) * r;
          ctx.beginPath();
          ctx.arc(Math.cos(ang) * dist, Math.sin(ang) * dist, 1.8, 0, Math.PI * 2);
          ctx.fill();
        }

        // Stem dot
        ctx.fillStyle = '#4e342e';
        ctx.beginPath();
        ctx.arc(0, -r * 0.85, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Lighting
        const grad = ctx.createRadialGradient(-r * 0.3, -r * 0.3, 2, 0, 0, r);
        grad.addColorStop(0, 'rgba(255,255,255,0.45)');
        grad.addColorStop(0.7, 'rgba(255,255,255,0)');
        grad.addColorStop(1, 'rgba(0,0,0,0.25)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();
      },
      drawHalf: function (ctx, r, isLeft) {
        ctx.beginPath();
        ctx.arc(0, 0, r, isLeft ? Math.PI * 0.5 : -Math.PI * 0.5, isLeft ? -Math.PI * 0.5 : Math.PI * 0.5);
        ctx.closePath();
        ctx.fillStyle = this.rindColor;
        ctx.fill();

        // White pith
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.88, isLeft ? Math.PI * 0.5 : -Math.PI * 0.5, isLeft ? -Math.PI * 0.5 : Math.PI * 0.5);
        ctx.closePath();
        ctx.fillStyle = '#fffde7';
        ctx.fill();

        // Orange pulp segments
        ctx.fillStyle = this.pulpColor;
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.8, isLeft ? Math.PI * 0.5 : -Math.PI * 0.5, isLeft ? -Math.PI * 0.5 : Math.PI * 0.5);
        ctx.closePath();
        ctx.fill();

        // Segment lines
        ctx.strokeStyle = '#fffde7';
        ctx.lineWidth = 1.5;
        const segs = isLeft ? [Math.PI * 0.65, Math.PI * 0.85, Math.PI * 1.05, Math.PI * 1.25] : [-Math.PI * 0.35, -Math.PI * 0.15, Math.PI * 0.05, Math.PI * 0.25];
        segs.forEach(a => {
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(Math.cos(a) * (r * 0.78), Math.sin(a) * (r * 0.78));
          ctx.stroke();
        });
      }
    },
    apple: {
      name: 'Apple',
      radius: 38,
      score: 1,
      rindColor: '#d32f2f',
      pulpColor: '#fff9c4',
      juiceColor: '#d32f2f',
      draw: function (ctx, r) {
        // Red heart-shaped apple silhouette
        ctx.fillStyle = this.rindColor;
        ctx.beginPath();
        ctx.moveTo(0, -r * 0.7);
        ctx.bezierCurveTo(-r * 0.8, -r * 1.1, -r * 1.2, r * 0.4, 0, r * 0.95);
        ctx.bezierCurveTo(r * 1.2, r * 0.4, r * 0.8, -r * 1.1, 0, -r * 0.7);
        ctx.fill();

        // Brown stem & green leaf
        ctx.strokeStyle = '#4e342e';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, -r * 0.65);
        ctx.quadraticCurveTo(r * 0.15, -r * 1.15, r * 0.25, -r * 1.25);
        ctx.stroke();

        ctx.fillStyle = '#43a047';
        ctx.beginPath();
        ctx.ellipse(r * 0.3, -r * 1.0, 7, 3, Math.PI * 0.25, 0, Math.PI * 2);
        ctx.fill();

        // Highlight
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.beginPath();
        ctx.ellipse(-r * 0.35, -r * 0.35, r * 0.2, r * 0.4, -Math.PI * 0.15, 0, Math.PI * 2);
        ctx.fill();
      },
      drawHalf: function (ctx, r, isLeft) {
        ctx.beginPath();
        ctx.arc(0, 0, r, isLeft ? Math.PI * 0.5 : -Math.PI * 0.5, isLeft ? -Math.PI * 0.5 : Math.PI * 0.5);
        ctx.closePath();
        ctx.fillStyle = this.rindColor;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(0, 0, r * 0.85, isLeft ? Math.PI * 0.5 : -Math.PI * 0.5, isLeft ? -Math.PI * 0.5 : Math.PI * 0.5);
        ctx.closePath();
        ctx.fillStyle = this.pulpColor;
        ctx.fill();

        // Core and seed
        ctx.fillStyle = '#3e2723';
        ctx.beginPath();
        const sx = isLeft ? -r * 0.25 : r * 0.25;
        ctx.ellipse(sx, 0, 3, 5, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    },
    banana: {
      name: 'Banana',
      radius: 42,
      score: 1,
      rindColor: '#fbc02d',
      pulpColor: '#fffde7',
      juiceColor: '#fdd835',
      draw: function (ctx, r) {
        ctx.save();
        ctx.rotate(-0.3);
        ctx.fillStyle = this.rindColor;
        ctx.beginPath();
        ctx.moveTo(-r * 0.9, -r * 0.4);
        ctx.quadraticCurveTo(0, -r * 0.9, r * 0.9, -r * 0.1);
        ctx.quadraticCurveTo(0, r * 0.5, -r * 0.9, -r * 0.4);
        ctx.fill();

        // Brown tip & stem
        ctx.fillStyle = '#4e342e';
        ctx.beginPath();
        ctx.arc(r * 0.9, -r * 0.1, 4, 0, Math.PI * 2);
        ctx.arc(-r * 0.9, -r * 0.4, 4, 0, Math.PI * 2);
        ctx.fill();

        // Ridge line
        ctx.strokeStyle = '#f57f17';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-r * 0.85, -r * 0.35);
        ctx.quadraticCurveTo(0, -r * 0.3, r * 0.85, -r * 0.08);
        ctx.stroke();
        ctx.restore();
      },
      drawHalf: function (ctx, r, isLeft) {
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.8, isLeft ? Math.PI * 0.5 : -Math.PI * 0.5, isLeft ? -Math.PI * 0.5 : Math.PI * 0.5);
        ctx.closePath();
        ctx.fillStyle = this.rindColor;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(0, 0, r * 0.65, isLeft ? Math.PI * 0.5 : -Math.PI * 0.5, isLeft ? -Math.PI * 0.5 : Math.PI * 0.5);
        ctx.closePath();
        ctx.fillStyle = this.pulpColor;
        ctx.fill();
      }
    },
    strawberry: {
      name: 'Strawberry',
      radius: 34,
      score: 1,
      rindColor: '#e91e63',
      pulpColor: '#f8bbd0',
      juiceColor: '#e91e63',
      draw: function (ctx, r) {
        // Berry cone
        ctx.fillStyle = this.rindColor;
        ctx.beginPath();
        ctx.moveTo(0, -r * 0.6);
        ctx.bezierCurveTo(-r * 0.8, -r * 0.6, -r * 0.9, r * 0.2, 0, r);
        ctx.bezierCurveTo(r * 0.9, r * 0.2, r * 0.8, -r * 0.6, 0, -r * 0.6);
        ctx.fill();

        // Yellow seed specks
        ctx.fillStyle = '#fff59d';
        for (let row = -1; row <= 2; row++) {
          const y = row * (r * 0.25);
          const cols = 4 - Math.abs(row);
          for (let c = 0; c < cols; c++) {
            const x = (c - (cols - 1) / 2) * (r * 0.35);
            ctx.beginPath();
            ctx.arc(x, y, 1.3, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        // Green leaves
        ctx.fillStyle = '#43a047';
        for (let i = -2; i <= 2; i++) {
          ctx.beginPath();
          ctx.ellipse(i * (r * 0.22), -r * 0.65, 5, 8, i * 0.3, 0, Math.PI * 2);
          ctx.fill();
        }
      },
      drawHalf: function (ctx, r, isLeft) {
        ctx.beginPath();
        ctx.arc(0, 0, r, isLeft ? Math.PI * 0.5 : -Math.PI * 0.5, isLeft ? -Math.PI * 0.5 : Math.PI * 0.5);
        ctx.closePath();
        ctx.fillStyle = this.rindColor;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(0, 0, r * 0.8, isLeft ? Math.PI * 0.5 : -Math.PI * 0.5, isLeft ? -Math.PI * 0.5 : Math.PI * 0.5);
        ctx.closePath();
        ctx.fillStyle = this.pulpColor;
        ctx.fill();
      }
    },
    bomb: {
      name: 'Bomb',
      radius: 40,
      isBomb: true,
      score: 0,
      draw: function (ctx, r, tick) {
        // Black iron cannonball
        const grad = ctx.createRadialGradient(-r * 0.3, -r * 0.3, 2, 0, 0, r);
        grad.addColorStop(0, '#555');
        grad.addColorStop(0.5, '#222');
        grad.addColorStop(1, '#0a0a0a');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();

        // Cap & Rim
        ctx.fillStyle = '#616161';
        ctx.fillRect(-6, -r - 4, 12, 6);

        // Rope Fuse
        ctx.strokeStyle = '#d7ccc8';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, -r - 4);
        ctx.quadraticCurveTo(8, -r - 14, 16, -r - 18);
        ctx.stroke();

        // Glowing Sparks on Fuse
        const sparkX = 16;
        const sparkY = -r - 18;
        const sparkR = 6 + Math.sin((tick || 0) * 0.3) * 3;
        const sparkGrad = ctx.createRadialGradient(sparkX, sparkY, 1, sparkX, sparkY, sparkR * 2);
        sparkGrad.addColorStop(0, '#ffffff');
        sparkGrad.addColorStop(0.3, '#ffeb3b');
        sparkGrad.addColorStop(0.7, '#ff5722');
        sparkGrad.addColorStop(1, 'rgba(255,87,34,0)');
        ctx.fillStyle = sparkGrad;
        ctx.beginPath();
        ctx.arc(sparkX, sparkY, sparkR * 2, 0, Math.PI * 2);
        ctx.fill();

        // Red Hazard Cross on front
        ctx.fillStyle = '#e53935';
        ctx.font = 'bold 24px ' + getComputedStyle(document.body).getPropertyValue('--font-dojo');
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('☠', 0, 2);
      }
    }
  };

  const FRUIT_KEYS = ['watermelon', 'orange', 'apple', 'banana', 'strawberry'];

  // ==========================================================================
  // GAME ENGINE STATE
  // ==========================================================================
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');

  // Viewport & Scaling
  let canvasW = 960;
  let canvasH = 640;

  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    canvasW = rect.width;
    canvasH = rect.height;
    canvas.width = canvasW;
    canvas.height = canvasH;
  }
  window.addEventListener('resize', resizeCanvas);

  // Gameplay State
  let gameState = 'MENU'; // 'MENU', 'PLAYING', 'GAMEOVER'
  let score = 0;
  let bestScore = parseInt(localStorage.getItem('fn_best_score') || '0', 10);
  let slicedCount = 0;
  let strikes = 0;
  const MAX_STRIKES = 3;

  let fruits = [];
  let fruitHalves = [];
  let particles = [];
  let wallSplats = [];
  let floatingTexts = [];

  // Blade Trail
  let swipePath = [];
  let isSwiping = false;
  let lastSwishTime = 0;

  // Combo tracking
  let currentStrokeSliced = 0;
  let lastSliceTime = 0;

  // Wave Spawner
  let lastSpawnTime = 0;
  let spawnInterval = 1800; // ms between launches
  let gameTick = 0;

  // UI Element Refs
  const scoreEl = document.getElementById('scoreVal');
  const bestEl = document.getElementById('bestVal');
  const strikeEls = [
    document.getElementById('strike1'),
    document.getElementById('strike2'),
    document.getElementById('strike3')
  ];
  const soundBtn = document.getElementById('btnSound');
  const restartBtn = document.getElementById('btnRestart');
  const backBtn = document.getElementById('btnBack');
  const settingsBtn = document.getElementById('btnSettings');
  const exitBtn = document.getElementById('btnExit');
  const menuScreen = document.getElementById('menuScreen');
  const gameOverScreen = document.getElementById('gameOverScreen');
  const hintModal = document.getElementById('hintModal');
  const closeHintBtn = document.getElementById('btnCloseHint');

  const settingsModal = document.getElementById('settingsModal');
  const btnCloseSettings = document.getElementById('btnCloseSettings');
  const btnCloseSettingsX = document.getElementById('btnCloseSettingsX');
  const settingSfx = document.getElementById('settingSfx');
  const settingSplats = document.getElementById('settingSplats');
  const btnResetScore = document.getElementById('btnResetScore');
  const bladeColorPicker = document.getElementById('bladeColorPicker');

  const exitModal = document.getElementById('exitModal');
  const btnCancelExit = document.getElementById('btnCancelExit');
  const btnConfirmExit = document.getElementById('btnConfirmExit');

  const btnMenuSettings = document.getElementById('btnMenuSettings');
  const btnMenuRules = document.getElementById('btnMenuRules');
  const btnMenuExit = document.getElementById('btnMenuExit');

  const goScoreEl = document.getElementById('goScore');
  const goBestEl = document.getElementById('goBest');
  const goSlicedEl = document.getElementById('goSliced');
  const btnPlayAgain = document.getElementById('btnPlayAgain');

  // Menu Floating Watermelon
  const menuTarget = {
    x: 0,
    y: 0,
    radius: 54,
    rotation: 0,
    sliced: false
  };

  const menuWatermelonCanvas = document.getElementById('menuWatermelonCanvas');
  const menuWatermelonCtx = menuWatermelonCanvas ? menuWatermelonCanvas.getContext('2d') : null;
  let menuRotation = 0;

  function drawMenuWatermelon() {
    if (!menuWatermelonCtx) return;
    menuWatermelonCtx.clearRect(0, 0, 120, 120);
    menuWatermelonCtx.save();
    menuWatermelonCtx.translate(60, 60);
    menuRotation += 0.02;
    menuWatermelonCtx.rotate(menuRotation);
    FRUIT_SPECS.watermelon.draw(menuWatermelonCtx, 46);
    menuWatermelonCtx.restore();
  }

  // ==========================================================================
  // SPAWNER & PHYSICS
  // ==========================================================================
  function spawnWave() {
    if (gameState !== 'PLAYING') return;

    // Launch 1 to 4 items per wave depending on score
    const count = Math.min(4, 1 + Math.floor(Math.random() * (1 + score / 25)));
    const hasBomb = score > 15 && Math.random() < 0.28;

    for (let i = 0; i < count; i++) {
      const isBomb = hasBomb && i === count - 1;
      const typeKey = isBomb ? 'bomb' : FRUIT_KEYS[Math.floor(Math.random() * FRUIT_KEYS.length)];
      const spec = FRUIT_SPECS[typeKey];

      // Spawn near bottom
      const margin = canvasW * 0.15;
      const x = margin + Math.random() * (canvasW - margin * 2);
      const y = canvasH + spec.radius;

      // Arc towards center
      const targetX = canvasW * 0.25 + Math.random() * (canvasW * 0.5);
      const vx = (targetX - x) * (0.012 + Math.random() * 0.006);
      const vy = -(canvasH * 0.021 + Math.random() * (canvasH * 0.007));
      const vr = (Math.random() - 0.5) * 0.12;

      fruits.push({
        type: typeKey,
        spec: spec,
        x: x,
        y: y,
        vx: vx,
        vy: vy,
        rotation: Math.random() * Math.PI * 2,
        vr: vr,
        sliced: false,
        missed: false
      });
    }

    // Dynamic wave pacing
    spawnInterval = Math.max(900, 2000 - score * 15);
  }

  function updatePhysics(dt) {
    const gravity = 0.38;

    // 1. Active Fruits
    for (let i = fruits.length - 1; i >= 0; i--) {
      const f = fruits[i];
      f.vy += gravity;
      f.x += f.vx;
      f.y += f.vy;
      f.rotation += f.vr;

      // Check if dropped off bottom without being sliced
      if (f.y > canvasH + f.spec.radius + 40 && f.vy > 0) {
        if (!f.spec.isBomb && !f.missed && gameState === 'PLAYING') {
          f.missed = true;
          addStrike();
        }
        fruits.splice(i, 1);
      }
    }

    // 2. Sliced Halves
    for (let i = fruitHalves.length - 1; i >= 0; i--) {
      const h = fruitHalves[i];
      h.vy += gravity;
      h.x += h.vx;
      h.y += h.vy;
      h.rotation += h.vr;

      if (h.y > canvasH + h.radius + 60) {
        fruitHalves.splice(i, 1);
      }
    }

    // 3. Juice & Splatter Particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.2; // slight gravity on droplets
      p.life -= 0.025;
      p.size = Math.max(0, p.size - 0.06);

      if (p.life <= 0 || p.size <= 0) {
        particles.splice(i, 1);
      }
    }

    // 4. Wall Juice Splats (Fade slowly over 14s)
    for (let i = wallSplats.length - 1; i >= 0; i--) {
      const s = wallSplats[i];
      s.alpha -= 0.001;
      if (s.alpha <= 0) {
        wallSplats.splice(i, 1);
      }
    }

    // 5. Floating Combo texts
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
      const ft = floatingTexts[i];
      ft.y += ft.vy;
      ft.alpha -= 0.02;
      if (ft.alpha <= 0) {
        floatingTexts.splice(i, 1);
      }
    }

    // 6. Prune blade trail points older than 180ms
    const now = performance.now();
    while (swipePath.length > 0 && now - swipePath[0].time > 180) {
      swipePath.shift();
    }
  }

  // ==========================================================================
  // SLICING & COLLISION LOGIC
  // ==========================================================================
  function distToSegment(px, py, x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const lenSq = dx * dx + dy * dy;
    if (lenSq === 0) return Math.hypot(px - x1, py - y1);
    let t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
    t = Math.max(0, Math.min(1, t));
    const projX = x1 + t * dx;
    const projY = y1 + t * dy;
    return Math.hypot(px - projX, py - projY);
  }

  function triggerMenuSlice(e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (gameState !== 'MENU' || menuTarget.sliced) return;
    menuTarget.sliced = true;

    // Slice effect at center
    sliceFruitObj({
      spec: FRUIT_SPECS.watermelon,
      x: menuTarget.x || canvasW * 0.5,
      y: menuTarget.y || canvasH * 0.55,
      rotation: menuRotation,
      vx: 0,
      vy: 0
    }, -0.5);

    AudioEngine.playSplat();
    AudioEngine.playSwish(2.5);

    setTimeout(() => {
      startGame();
    }, 380);
  }

  function handleSlicing(p1, p2) {
    const cutAngle = Math.atan2(p2.y - p1.y, p2.x - p1.x);

    // Menu Target Slice Check
    if (gameState === 'MENU' && !menuTarget.sliced) {
      const targetWrap = document.getElementById('menuTargetWrap');
      let targetHit = false;

      if (targetWrap) {
        const rect = targetWrap.getBoundingClientRect();
        const canvasRect = canvas.getBoundingClientRect();
        const wrapCenterX = (rect.left + rect.width / 2 - canvasRect.left) * (canvasW / canvasRect.width);
        const wrapCenterY = (rect.top + rect.height / 2 - canvasRect.top) * (canvasH / canvasRect.height);
        const d = distToSegment(wrapCenterX, wrapCenterY, p1.x, p1.y, p2.x, p2.y);
        if (d <= Math.max(rect.width, rect.height) * 0.7) {
          targetHit = true;
        }
      }

      if (!targetHit) {
        const d = distToSegment(menuTarget.x, menuTarget.y, p1.x, p1.y, p2.x, p2.y);
        if (d <= menuTarget.radius + 30) {
          targetHit = true;
        }
      }

      if (targetHit) {
        triggerMenuSlice();
        return;
      }
    }

    if (gameState !== 'PLAYING') return;

    for (let i = fruits.length - 1; i >= 0; i--) {
      const f = fruits[i];
      if (f.sliced) continue;

      const dist = distToSegment(f.x, f.y, p1.x, p1.y, p2.x, p2.y);
      if (dist <= f.spec.radius) {
        f.sliced = true;

        if (f.spec.isBomb) {
          // BOMB DETONATION!
          detonateBomb(f.x, f.y);
          return;
        }

        // Sliced Fruit
        sliceFruitObj(f, cutAngle);
        fruits.splice(i, 1);

        // Scoring & Combos
        score += f.spec.score;
        slicedCount++;
        scoreEl.textContent = score;

        currentStrokeSliced++;
        lastSliceTime = performance.now();

        AudioEngine.playSplat();
      }
    }
  }

  function sliceFruitObj(f, cutAngle) {
    const spec = f.spec;
    const r = spec.radius;

    // Normal to cut angle pushes halves outward
    const normX = Math.cos(cutAngle + Math.PI * 0.5);
    const normY = Math.sin(cutAngle + Math.PI * 0.5);

    // Left Half
    fruitHalves.push({
      spec: spec,
      radius: r,
      x: f.x - normX * 8,
      y: f.y - normY * 8,
      vx: f.vx - normX * (3 + Math.random() * 2),
      vy: f.vy - 1 - Math.random() * 2,
      rotation: cutAngle,
      vr: -0.1 - Math.random() * 0.1,
      isLeft: true
    });

    // Right Half
    fruitHalves.push({
      spec: spec,
      radius: r,
      x: f.x + normX * 8,
      y: f.y + normY * 8,
      vx: f.vx + normX * (3 + Math.random() * 2),
      vy: f.vy - 1 - Math.random() * 2,
      rotation: cutAngle,
      vr: 0.1 + Math.random() * 0.1,
      isLeft: false
    });

    // Juice Droplet Particles
    const dropCount = 22;
    for (let i = 0; i < dropCount; i++) {
      const speed = 2 + Math.random() * 7;
      const angle = cutAngle + (Math.random() - 0.5) * Math.PI;
      particles.push({
        x: f.x,
        y: f.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 3 + Math.random() * 5,
        color: spec.juiceColor,
        life: 1.0
      });
    }

    // Wall Splat Stain (stamp onto the wooden dojo wall)
    if (enableSplats) {
      wallSplats.push({
        x: f.x,
        y: f.y,
        radius: r * (0.8 + Math.random() * 0.4),
        color: spec.juiceColor,
        alpha: 0.45
      });
    }
  }

  function detonateBomb(bx, by) {
    AudioEngine.playExplosion();

    // Huge particle explosion
    for (let i = 0; i < 60; i++) {
      const spd = 4 + Math.random() * 12;
      const ang = Math.random() * Math.PI * 2;
      particles.push({
        x: bx,
        y: by,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        size: 4 + Math.random() * 8,
        color: i % 2 === 0 ? '#ffeb3b' : '#ff5722',
        life: 1.2
      });
    }

    // Flash canvas screen
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fillRect(0, 0, canvasW, canvasH);

    setTimeout(() => {
      endGame('BOMB DETONATED!');
    }, 400);
  }

  function addStrike() {
    strikes++;
    AudioEngine.playStrike();

    for (let i = 0; i < MAX_STRIKES; i++) {
      if (strikeEls[i]) {
        if (i < strikes) strikeEls[i].classList.add('active');
        else strikeEls[i].classList.remove('active');
      }
    }

    if (strikes >= MAX_STRIKES) {
      endGame('3 STRIKES!');
    }
  }

  function checkCombos() {
    if (currentStrokeSliced >= 3) {
      const bonus = currentStrokeSliced;
      score += bonus;
      scoreEl.textContent = score;

      const lastP = swipePath[swipePath.length - 1] || { x: canvasW / 2, y: canvasH / 2 };
      floatingTexts.push({
        text: currentStrokeSliced + 'x COMBO! +' + bonus,
        x: lastP.x,
        y: lastP.y - 30,
        vy: -1.2,
        alpha: 1.0
      });

      AudioEngine.playCombo(currentStrokeSliced);
    }
    currentStrokeSliced = 0;
  }

  // ==========================================================================
  // RENDER PIPELINE
  // ==========================================================================
  function render() {
    ctx.clearRect(0, 0, canvasW, canvasH);

    // 1. Draw Wooden Wall Planks
    drawWoodWall();

    // 2. Draw Juice Splats on Wall
    for (let i = 0; i < wallSplats.length; i++) {
      const s = wallSplats[i];
      ctx.save();
      ctx.globalAlpha = Math.max(0, s.alpha);
      ctx.fillStyle = s.color;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();

      // Splatter drip
      ctx.beginPath();
      ctx.ellipse(s.x + 4, s.y + s.radius * 0.7, s.radius * 0.35, s.radius * 0.55, 0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 3. Draw Menu Target Watermelon
    if (gameState === 'MENU' && !menuTarget.sliced) {
      ctx.save();
      ctx.translate(menuTarget.x, menuTarget.y);
      ctx.rotate(menuTarget.rotation);
      FRUIT_SPECS.watermelon.draw(ctx, menuTarget.radius);
      ctx.restore();
    }

    // 4. Draw Active Fruits
    for (let i = 0; i < fruits.length; i++) {
      const f = fruits[i];
      ctx.save();
      ctx.translate(f.x, f.y);
      ctx.rotate(f.rotation);
      f.spec.draw(ctx, f.spec.radius, gameTick);
      ctx.restore();
    }

    // 5. Draw Sliced Fruit Halves
    for (let i = 0; i < fruitHalves.length; i++) {
      const h = fruitHalves[i];
      ctx.save();
      ctx.translate(h.x, h.y);
      ctx.rotate(h.rotation);
      h.spec.drawHalf(ctx, h.radius, h.isLeft);
      ctx.restore();
    }

    // 6. Draw Juice Particles
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 7. Draw Floating Combo Texts
    for (let i = 0; i < floatingTexts.length; i++) {
      const ft = floatingTexts[i];
      ctx.save();
      ctx.globalAlpha = Math.max(0, ft.alpha);
      ctx.font = 'bold 32px ' + getComputedStyle(document.body).getPropertyValue('--font-dojo');
      ctx.fillStyle = '#ffeb3b';
      ctx.strokeStyle = '#d84315';
      ctx.lineWidth = 4;
      ctx.textAlign = 'center';
      ctx.strokeText(ft.text, ft.x, ft.y);
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    }

    // 8. Draw Razor Katana Blade Trail
    drawBladeTrail();
  }

  function drawWoodWall() {
    const plankH = 54;
    const count = Math.ceil(canvasH / plankH) + 1;

    for (let i = 0; i < count; i++) {
      const y = i * plankH;
      const isAlt = i % 2 === 0;

      // Plank base
      ctx.fillStyle = isAlt ? '#331a0c' : '#2c1509';
      ctx.fillRect(0, y, canvasW, plankH);

      // Plank highlight border
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.fillRect(0, y, canvasW, 2);

      // Plank dark shadow border
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.fillRect(0, y + plankH - 2, canvasW, 2);

      // Subtle wood grain streaks
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.025)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, y + plankH * 0.45);
      ctx.bezierCurveTo(canvasW * 0.3, y + plankH * 0.3, canvasW * 0.7, y + plankH * 0.6, canvasW, y + plankH * 0.45);
      ctx.stroke();
    }
  }

  const BLADE_THEMES = {
    cyan: { outer: '0, 229, 255', mid: '128, 222, 234' },
    gold: { outer: '245, 176, 65', mid: '255, 224, 130' },
    crimson: { outer: '255, 56, 56', mid: '255, 138, 128' },
    emerald: { outer: '46, 204, 113', mid: '165, 214, 167' }
  };
  let currentBladeColor = localStorage.getItem('fn_blade_color') || 'cyan';
  let enableSplats = localStorage.getItem('fn_enable_splats') !== 'false';

  function drawBladeTrail() {
    if (swipePath.length < 2) return;

    // Glowing Katana Blade: Multi-layered stroke with tapering width
    const points = swipePath;
    const len = points.length;
    const theme = BLADE_THEMES[currentBladeColor] || BLADE_THEMES.cyan;

    // Layer 1: Outer Blade Aura Glow
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (let i = 1; i < len; i++) {
      const p1 = points[i - 1];
      const p2 = points[i];
      const ratio = i / len;

      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);

      // Outer blade aura
      ctx.strokeStyle = 'rgba(' + theme.outer + ', ' + (0.4 * ratio) + ')';
      ctx.lineWidth = 14 * ratio;
      ctx.stroke();

      // Mid blade edge
      ctx.strokeStyle = 'rgba(' + theme.mid + ', ' + (0.8 * ratio) + ')';
      ctx.lineWidth = 7 * ratio;
      ctx.stroke();

      // Sharp white inner core
      ctx.strokeStyle = 'rgba(255, 255, 255, ' + (0.95 * ratio) + ')';
      ctx.lineWidth = 3 * ratio;
      ctx.stroke();
    }
    ctx.restore();
  }

  // ==========================================================================
  // GAME LOOP & LIFECYCLE
  // ==========================================================================
  function gameLoop(timestamp) {
    gameTick++;
    const dt = 16.67;

    updatePhysics(dt);

    if (gameState === 'PLAYING') {
      if (Date.now() - lastSpawnTime > spawnInterval) {
        spawnWave();
        lastSpawnTime = Date.now();
      }

      // Check if slice stroke has finished for combos
      if (currentStrokeSliced > 0 && performance.now() - lastSliceTime > 280) {
        checkCombos();
      }
    } else if (gameState === 'MENU') {
      menuTarget.x = canvasW * 0.5;
      menuTarget.y = canvasH * 0.58;
      menuTarget.rotation += 0.02;
      drawMenuWatermelon();
    }

    render();
    requestAnimationFrame(gameLoop);
  }

  function startGame() {
    gameState = 'PLAYING';
    score = 0;
    slicedCount = 0;
    strikes = 0;
    fruits = [];
    fruitHalves = [];
    particles = [];
    wallSplats = [];
    floatingTexts = [];
    currentStrokeSliced = 0;

    scoreEl.textContent = '0';
    bestEl.textContent = bestScore;
    strikeEls.forEach(el => el && el.classList.remove('active'));

    menuScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    hintModal.classList.add('hidden');
    hintModal.style.display = 'none';

    lastSpawnTime = Date.now();
    spawnWave();
  }

  function endGame(reason) {
    gameState = 'GAMEOVER';

    if (score > bestScore) {
      bestScore = score;
      localStorage.setItem('fn_best_score', bestScore);
      bestEl.textContent = bestScore;
    }

    goScoreEl.textContent = score;
    goBestEl.textContent = bestScore;
    goSlicedEl.textContent = slicedCount;

    gameOverScreen.classList.remove('hidden');
  }

  function showMenu() {
    gameState = 'MENU';
    menuTarget.sliced = false;
    fruits = [];
    fruitHalves = [];
    menuScreen.classList.remove('hidden');
    gameOverScreen.classList.add('hidden');
    hintModal.classList.add('hidden');
    hintModal.style.display = 'none';
  }

  // ==========================================================================
  // INPUT CONTROLS (Touch & Mouse Drag)
  // ==========================================================================
  function getCanvasPos(e) {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) * (canvasW / rect.width),
      y: (clientY - rect.top) * (canvasH / rect.height),
      time: performance.now()
    };
  }

  function startSlice(e) {
    isSwiping = true;
    swipePath = [];
    const p = getCanvasPos(e);
    swipePath.push(p);
  }

  function moveSlice(e) {
    if (!isSwiping) return;
    const p = getCanvasPos(e);
    swipePath.push(p);

    if (swipePath.length >= 2) {
      const p1 = swipePath[swipePath.length - 2];
      const p2 = swipePath[swipePath.length - 1];
      const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);

      // Play whoosh if slice is swift
      const now = performance.now();
      if (dist > 18 && now - lastSwishTime > 140) {
        AudioEngine.playSwish(dist / 20);
        lastSwishTime = now;
      }

      handleSlicing(p1, p2);
    }
  }

  function endSlice() {
    if (isSwiping && currentStrokeSliced >= 3) {
      checkCombos();
    }
    isSwiping = false;
  }

  // Viewport & Window Event Listeners for seamless Katana slicing everywhere
  const viewport = document.querySelector('.game-viewport') || canvas;

  viewport.addEventListener('mousedown', (e) => {
    // If clicking a button, input, or control, do not start slice
    if (e.target && e.target.closest('button, input, label, a, .modal-card, .menu-action-btn, .dojo-btn, #btnSliceToPlay, #menuTargetWrap, .switch')) {
      return;
    }
    // Also don't start slice if any modal overlay is active
    if (document.querySelector('.modal-overlay:not(.hidden)')) {
      return;
    }
    startSlice(e);
  });
  window.addEventListener('mousemove', moveSlice);
  window.addEventListener('mouseup', endSlice);

  viewport.addEventListener('touchstart', (e) => {
    if (e.target && e.target.closest('button, input, label, a, .modal-card, .menu-action-btn, .dojo-btn, #btnSliceToPlay, #menuTargetWrap, .switch')) {
      return;
    }
    if (document.querySelector('.modal-overlay:not(.hidden)')) {
      return;
    }
    e.preventDefault();
    startSlice(e);
  }, { passive: false });

  window.addEventListener('touchmove', (e) => {
    if (isSwiping) {
      e.preventDefault();
      moveSlice(e);
    }
  }, { passive: false });

  window.addEventListener('touchend', endSlice);
  window.addEventListener('touchcancel', endSlice);

  // Direct Click handlers on "SLICE TO PLAY"
  const btnSliceToPlay = document.getElementById('btnSliceToPlay');
  const menuTargetWrap = document.getElementById('menuTargetWrap');

  if (btnSliceToPlay) {
    btnSliceToPlay.addEventListener('click', triggerMenuSlice);
  }
  if (menuTargetWrap) {
    menuTargetWrap.addEventListener('click', triggerMenuSlice);
  }

  // ==========================================================================
  // UI BUTTON EVENT BINDINGS
  // ==========================================================================
  soundBtn.addEventListener('click', () => {
    const enabled = AudioEngine.toggle();
    soundBtn.querySelector('.btn-icon').textContent = enabled ? '🔊' : '🔇';
    if (settingSfx) settingSfx.checked = enabled;
    AudioEngine.playClick();
  });

  restartBtn.addEventListener('click', () => {
    AudioEngine.playClick();
    startGame();
  });

  backBtn.addEventListener('click', () => {
    AudioEngine.playClick();
    showMenu();
  });

  // How to play / Rules Modal
  function openHintModal(e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    AudioEngine.playClick();
    hintModal.classList.remove('hidden');
    hintModal.style.display = 'grid';
  }

  function closeHintModal(e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    AudioEngine.playClick();
    hintModal.classList.add('hidden');
    hintModal.style.display = 'none';
  }

  if (btnMenuRules) {
    btnMenuRules.addEventListener('click', openHintModal);
  }

  closeHintBtn.addEventListener('click', closeHintModal);

  hintModal.addEventListener('click', (e) => {
    if (e.target === hintModal) {
      closeHintModal(e);
    }
  });

  // Settings Modal Handlers
  function openSettingsModal(e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    AudioEngine.playClick();
    if (settingSfx) settingSfx.checked = AudioEngine.isEnabled();
    if (settingSplats) settingSplats.checked = enableSplats;
    if (settingFullscreen) settingFullscreen.checked = isFullscreen();
    updateBladeColorButtons();
    settingsModal.classList.remove('hidden');
    settingsModal.style.display = 'grid';
  }

  function closeSettingsModal(e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    AudioEngine.playClick();
    settingsModal.classList.add('hidden');
    settingsModal.style.display = 'none';
  }

  if (settingsBtn) {
    settingsBtn.addEventListener('click', openSettingsModal);
    settingsBtn.addEventListener('touchend', openSettingsModal);
  }
  if (btnMenuSettings) {
    btnMenuSettings.addEventListener('click', openSettingsModal);
    btnMenuSettings.addEventListener('touchend', openSettingsModal);
  }
  if (btnCloseSettings) {
    btnCloseSettings.addEventListener('click', closeSettingsModal);
    btnCloseSettings.addEventListener('touchend', closeSettingsModal);
  }
  if (btnCloseSettingsX) {
    btnCloseSettingsX.addEventListener('click', closeSettingsModal);
    btnCloseSettingsX.addEventListener('touchend', closeSettingsModal);
  }
  if (settingsModal) {
    settingsModal.addEventListener('click', (e) => {
      if (e.target === settingsModal) closeSettingsModal(e);
    });
  }

  if (settingSfx) {
    settingSfx.addEventListener('change', () => {
      const enabled = AudioEngine.toggle(settingSfx.checked);
      soundBtn.querySelector('.btn-icon').textContent = enabled ? '🔊' : '🔇';
      AudioEngine.playClick();
    });
  }

  if (settingSplats) {
    settingSplats.addEventListener('change', () => {
      enableSplats = settingSplats.checked;
      localStorage.setItem('fn_enable_splats', enableSplats ? 'true' : 'false');
      AudioEngine.playClick();
    });
  }

  function updateBladeColorButtons() {
    if (!bladeColorPicker) return;
    const btns = bladeColorPicker.querySelectorAll('.blade-color-btn');
    btns.forEach(btn => {
      if (btn.dataset.color === currentBladeColor) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  if (bladeColorPicker) {
    bladeColorPicker.addEventListener('click', (e) => {
      const btn = e.target.closest('.blade-color-btn');
      if (!btn) return;
      currentBladeColor = btn.dataset.color || 'cyan';
      localStorage.setItem('fn_blade_color', currentBladeColor);
      updateBladeColorButtons();
      AudioEngine.playClick();
      AudioEngine.playSwish(1.8);
    });
  }

  if (btnResetScore) {
    btnResetScore.addEventListener('click', () => {
      if (confirm('Reset your high score to 0?')) {
        bestScore = 0;
        localStorage.setItem('fn_best_score', '0');
        bestEl.textContent = '0';
        AudioEngine.playClick();
      }
    });
  }

  // Exit Modal Handlers
  function openExitModal(e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    AudioEngine.playClick();
    exitModal.classList.remove('hidden');
    exitModal.style.display = 'grid';
  }

  function closeExitModal(e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    AudioEngine.playClick();
    exitModal.classList.add('hidden');
    exitModal.style.display = 'none';
  }

  function doExitGame(e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    AudioEngine.playClick();
    try { window.parent.postMessage('closeModal', '*'); } catch (err) {}
    try { window.parent.postMessage({ action: 'closeModal' }, '*'); } catch (err) {}
    try { window.history.back(); } catch (err) {}
    setTimeout(() => {
      try { window.close(); } catch (err) {}
    }, 250);
  }

  if (exitBtn) {
    exitBtn.addEventListener('click', openExitModal);
    exitBtn.addEventListener('touchend', openExitModal);
  }
  if (btnMenuExit) {
    btnMenuExit.addEventListener('click', openExitModal);
    btnMenuExit.addEventListener('touchend', openExitModal);
  }
  if (btnCancelExit) {
    btnCancelExit.addEventListener('click', closeExitModal);
    btnCancelExit.addEventListener('touchend', closeExitModal);
  }
  if (btnConfirmExit) {
    btnConfirmExit.addEventListener('click', doExitGame);
    btnConfirmExit.addEventListener('touchend', doExitGame);
  }
  if (exitModal) {
    exitModal.addEventListener('click', (e) => {
      if (e.target === exitModal) closeExitModal(e);
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
    if (menuFsIcon) menuFsIcon.textContent = full ? '🗗 Windowed' : '⛶ Fullscreen';
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

  btnPlayAgain.addEventListener('click', () => {
    AudioEngine.playClick();
    startGame();
  });

  // ==========================================================================
  // INITIALIZATION
  // ==========================================================================
  document.addEventListener('DOMContentLoaded', () => {
    resizeCanvas();
    bestEl.textContent = bestScore;
    showMenu();
    requestAnimationFrame(gameLoop);
  });
})();
