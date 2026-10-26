/**
 * ==============================================================================
 * MAZE ROTATOR - 2D GRAVITY PUZZLE GAME
 * ==============================================================================
 * Vanilla HTML5 Canvas 2D + Web Audio API
 * No external libraries or assets. 100% self-contained.
 * ==============================================================================
 */

(function () {
  'use strict';

  // ============================================================================
  // 1. AUDIO ENGINE (Synthesized with Web Audio API)
  // ============================================================================
  class AudioEngine {
    constructor() {
      this.ctx = null;
      this.isMuted = false;
      this.ambientGain = null;
      this.ambientOsc1 = null;
      this.ambientOsc2 = null;
      this.ambientFilter = null;
      this.initialized = false;
    }

    init() {
      if (this.initialized) return;
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioContext();
        this.initialized = true;
        this.startAmbientDrone();
      } catch (e) {
        console.warn('Web Audio not supported:', e);
      }
    }

    ensureContext() {
      if (!this.initialized) this.init();
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }

    setMuted(muted) {
      this.isMuted = muted;
      if (this.ambientGain && this.ctx) {
        this.ambientGain.gain.setValueAtTime(this.isMuted ? 0 : 0.04, this.ctx.currentTime);
      }
    }

    startAmbientDrone() {
      if (!this.ctx || this.ambientOsc1) return;
      try {
        const t = this.ctx.currentTime;
        this.ambientOsc1 = this.ctx.createOscillator();
        this.ambientOsc2 = this.ctx.createOscillator();
        this.ambientFilter = this.ctx.createBiquadFilter();
        this.ambientGain = this.ctx.createGain();

        this.ambientOsc1.type = 'sine';
        this.ambientOsc1.frequency.setValueAtTime(55, t); // A1 note
        this.ambientOsc2.type = 'triangle';
        this.ambientOsc2.frequency.setValueAtTime(110, t); // A2 note

        this.ambientFilter.type = 'lowpass';
        this.ambientFilter.frequency.setValueAtTime(250, t);

        this.ambientGain.gain.setValueAtTime(this.isMuted ? 0 : 0.035, t);

        this.ambientOsc1.connect(this.ambientFilter);
        this.ambientOsc2.connect(this.ambientFilter);
        this.ambientFilter.connect(this.ambientGain);
        this.ambientGain.connect(this.ctx.destination);

        this.ambientOsc1.start();
        this.ambientOsc2.start();
      } catch (e) {
        // Audio ambient fallback
      }
    }

    playWhoosh(direction = 1) {
      if (this.isMuted || !this.ctx) return;
      this.ensureContext();
      const t = this.ctx.currentTime;

      // Filtered frequency sweep + noise burst for rotation swoosh
      const osc = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      const startFreq = direction > 0 ? 160 : 320;
      const endFreq = direction > 0 ? 320 : 160;

      osc.frequency.setValueAtTime(startFreq, t);
      osc.frequency.exponentialRampToValueAtTime(endFreq, t + 0.25);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(400, t);
      filter.Q.setValueAtTime(2, t);

      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.18, t + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.3);
    }

    playImpact(strength = 1) {
      if (this.isMuted || !this.ctx) return;
      this.ensureContext();
      const t = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(130, t);
      osc.frequency.exponentialRampToValueAtTime(35, t + 0.12);

      const vol = Math.min(0.25, 0.12 * strength);
      gain.gain.setValueAtTime(vol, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.15);
    }

    playGemChime(gemIndex = 0) {
      if (this.isMuted || !this.ctx) return;
      this.ensureContext();
      const t = this.ctx.currentTime;

      // Sparkling triad notes based on gem count
      const notes = [659.25, 830.61, 987.77, 1318.51]; // E5, G#5, B5, E6
      const freq = notes[gemIndex % notes.length];

      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(freq, t);
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(freq * 2, t);

      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.ctx.destination);

      osc1.start(t);
      osc2.start(t);
      osc1.stop(t + 0.48);
      osc2.stop(t + 0.48);
    }

    playTeleport() {
      if (this.isMuted || !this.ctx) return;
      this.ensureContext();
      const t = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(280, t);
      osc.frequency.linearRampToValueAtTime(950, t + 0.18);
      osc.frequency.linearRampToValueAtTime(400, t + 0.3);

      gain.gain.setValueAtTime(0.18, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.32);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.34);
    }

    playSpikeHit() {
      if (this.isMuted || !this.ctx) return;
      this.ensureContext();
      const t = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(120, t);
      osc.frequency.linearRampToValueAtTime(40, t + 0.25);

      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.3);
    }

    playKey() {
      if (this.isMuted || !this.ctx) return;
      this.ensureContext();
      const t = this.ctx.currentTime;

      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const start = t + idx * 0.05;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.15, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.2);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(start);
        osc.stop(start + 0.22);
      });
    }

    playDoorUnlock() {
      if (this.isMuted || !this.ctx) return;
      this.ensureContext();
      const t = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(300, t);
      osc.frequency.exponentialRampToValueAtTime(750, t + 0.22);

      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.32);
    }

    playCrumble() {
      if (this.isMuted || !this.ctx) return;
      this.ensureContext();
      const t = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(90, t);
      osc.frequency.linearRampToValueAtTime(30, t + 0.15);

      gain.gain.setValueAtTime(0.15, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.2);
    }

    playLevelComplete() {
      if (this.isMuted || !this.ctx) return;
      this.ensureContext();
      const t = this.ctx.currentTime;

      // Fanfare: C5, E5, G5, C6 triumphant chord
      const chords = [
        { f: 523.25, time: 0 },
        { f: 659.25, time: 0.08 },
        { f: 783.99, time: 0.16 },
        { f: 1046.50, time: 0.25 }
      ];

      chords.forEach(c => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const start = t + c.time;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(c.f, start);

        gain.gain.setValueAtTime(0.2, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.6);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(start);
        osc.stop(start + 0.65);
      });
    }
  }

  // ============================================================================
  // 2. LEVEL DEFINITIONS (10 Handcrafted, 100% Solvable Levels)
  // ============================================================================
  const LEVELS = [
    // 1: First Spin (6x6)
    {
      id: 1,
      name: "First Spin",
      tutorial: "Rotate the maze with Arrow keys, A/D, or on-screen buttons! Gravity always pulls DOWN.",
      parMoves: 3,
      theme: {
        wall: "#00f5d4",
        wallGlow: "rgba(0, 245, 212, 0.5)",
        floor: "#0f172a",
        accent: "#00bbf9"
      },
      grid: [
        "######",
        "#S#E.#",
        "#.##.#",
        "#....#",
        "#....#",
        "######"
      ]
    },
    // 2: Gravity Well (7x7)
    {
      id: 2,
      name: "Gravity Well",
      tutorial: "Collect 3 shining gems for a bonus score and maximum stars!",
      parMoves: 4,
      theme: {
        wall: "#7928ca",
        wallGlow: "rgba(121, 40, 202, 0.5)",
        floor: "#130924",
        accent: "#ff0080"
      },
      grid: [
        "#######",
        "#S..*.#",
        "#.###.#",
        "#.*.#.#",
        "#.#.#.#",
        "#.#.*E#",
        "#######"
      ]
    },
    // 3: Spiky Business (7x7)
    {
      id: 3,
      name: "Spiky Business",
      tutorial: "Watch out for red spikes! Rotating into them shatters the ball.",
      parMoves: 4,
      theme: {
        wall: "#ff0055",
        wallGlow: "rgba(255, 0, 85, 0.5)",
        floor: "#20050e",
        accent: "#ff5400"
      },
      grid: [
        "#######",
        "#S..*.#",
        "#.###.#",
        "#..X#.#",
        "#.#...#",
        "#X#.*E#",
        "#######"
      ]
    },
    // 4: Ice Palace (8x8)
    {
      id: 4,
      name: "Ice Palace",
      tutorial: "Ice tiles are slick and frictionless. Plan your slides carefully!",
      parMoves: 4,
      theme: {
        wall: "#a0e7e5",
        wallGlow: "rgba(160, 231, 229, 0.6)",
        floor: "#071e22",
        accent: "#b4f8c8"
      },
      grid: [
        "########",
        "#S..II.#",
        "#.##.#.#",
        "#.#..#.#",
        "#.##.I.#",
        "#..#.#.#",
        "#.I..#E#",
        "########"
      ]
    },
    // 5: Portal Hop (8x8)
    {
      id: 5,
      name: "Portal Hop",
      tutorial: "Step into cosmic warp portals to bypass solid walls instantly!",
      parMoves: 5,
      theme: {
        wall: "#9d4edd",
        wallGlow: "rgba(157, 78, 221, 0.6)",
        floor: "#120b24",
        accent: "#39ff14"
      },
      grid: [
        "########",
        "#S.#..*#",
        "#..#T..#",
        "#.####.#",
        "#......#",
        "######.#",
        "#E..T#.#",
        "########"
      ]
    },
    // 6: Locked In (9x9)
    {
      id: 6,
      name: "Locked In",
      tutorial: "Retrieve the golden key to unlock the energy door guarding the portal!",
      parMoves: 5,
      requireKey: true,
      theme: {
        wall: "#ffd166",
        wallGlow: "rgba(255, 209, 102, 0.55)",
        floor: "#0d1b2a",
        accent: "#118ab2"
      },
      grid: [
        "#########",
        "#S..K.*.#",
        "#.#####.#",
        "#.#.*.#.#",
        "#.#.#.#.#",
        "#...#.#.#",
        "#.###.#.#",
        "#...#.D*E",
        "#########"
      ]
    },
    // 7: One Way Street (9x9)
    {
      id: 7,
      name: "One Way Street",
      tutorial: "One-way gates only allow entry in arrow direction. Sticky tiles stop slides instantly!",
      parMoves: 6,
      theme: {
        wall: "#f72585",
        wallGlow: "rgba(247, 37, 133, 0.55)",
        floor: "#1a0826",
        accent: "#7209b7"
      },
      grid: [
        "#########",
        "#S...#..#",
        "#.##...*#",
        "#..#>##.#",
        "#.##.Z#.#",
        "#...#.v.#",
        "#.###.#.#",
        "#*..#.ZE#",
        "#########"
      ]
    },
    // 8: Crumble Zone (10x10)
    {
      id: 8,
      name: "Crumble Zone",
      tutorial: "Cracked floors crumble into pits once crossed. You cannot return over them!",
      parMoves: 5,
      theme: {
        wall: "#06d6a0",
        wallGlow: "rgba(6, 214, 160, 0.55)",
        floor: "#0a1f18",
        accent: "#ccff33"
      },
      grid: [
        "##########",
        "#S....*..#",
        "#.######.#",
        "#..C...X.#",
        "#.####.X.#",
        "#..*#C.I.#",
        "#.####.I.#",
        "#..X#..I.#",
        "#.X...#E.#",
        "##########"
      ]
    },
    // 9: Patrol (10x10)
    {
      id: 9,
      name: "Patrol",
      tutorial: "A patrol drone guards the corridor! Time your rotations so you don't collide.",
      parMoves: 5,
      requireKey: true,
      enemy: { r: 5, c: 5, axis: 'h', range: 2 },
      theme: {
        wall: "#ff007f",
        wallGlow: "rgba(255, 0, 127, 0.55)",
        floor: "#100f2e",
        accent: "#4361ee"
      },
      grid: [
        "##########",
        "#S..K.*..#",
        "#.######.#",
        "#.#....#.#",
        "#.#.##.#.#",
        "#.#....#.#",
        "#.T.##.#.#",
        "#.#.T.*#.#",
        "#...#..D*E",
        "##########"
      ]
    },
    // 10: The Grand Maze (12x12)
    {
      id: 10,
      name: "The Grand Maze",
      tutorial: "The final master puzzle! Master every mechanic to escape the Grand Maze.",
      parMoves: 5,
      requireKey: true,
      enemy: { r: 6, c: 5, axis: 'h', range: 2 },
      theme: {
        wall: "#ffd700",
        wallGlow: "rgba(255, 215, 0, 0.65)",
        floor: "#110826",
        accent: "#00f0ff"
      },
      grid: [
        "############",
        "#S..K....*.#",
        "#.########.#",
        "#.#......#.#",
        "#.#.####.#.#",
        "#.#.T..#.#.#",
        "#.#.##.#.#.#",
        "#.T.##.#.#.#",
        "#.#.##.I.#.#",
        "#.Z.C..#.#.#",
        "#...#..D*E.#",
        "############"
      ]
    }
  ];

  // ============================================================================
  // 3. PERSISTENT STORAGE
  // ============================================================================
  class Storage {
    static getProgress() {
      try {
        const raw = localStorage.getItem('maze_rotator_save');
        if (raw) return JSON.parse(raw);
      } catch (e) {}
      return {
        unlocked: 1,
        levels: {},
        soundMuted: false
      };
    }

    static saveProgress(data) {
      try {
        localStorage.setItem('maze_rotator_save', JSON.stringify(data));
      } catch (e) {}
    }

    static reset() {
      try {
        localStorage.removeItem('maze_rotator_save');
      } catch (e) {}
    }
  }

  // ============================================================================
  // 4. PARTICLES & VISUAL POLISH
  // ============================================================================
  class ParticleSystem {
    constructor() {
      this.particles = [];
      this.confetti = [];
      this.stars = [];
      this.initBackgroundStars();
    }

    initBackgroundStars() {
      this.stars = [];
      for (let i = 0; i < 70; i++) {
        this.stars.push({
          x: Math.random(),
          y: Math.random(),
          r: Math.random() * 1.5 + 0.5,
          alpha: Math.random() * 0.7 + 0.3,
          speed: Math.random() * 0.05 + 0.02
        });
      }
    }

    addSpark(x, y, color = "#00f5d4", count = 8) {
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 140 + 40;
        this.particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: Math.random() * 3.5 + 1.5,
          color,
          alpha: 1,
          life: Math.random() * 0.25 + 0.2,
          maxLife: 0.4
        });
      }
    }

    addTrail(x, y, color = "#ffd166") {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 4,
        y: y + (Math.random() - 0.5) * 4,
        vx: (Math.random() - 0.5) * 10,
        vy: (Math.random() - 0.5) * 10,
        size: Math.random() * 4 + 2,
        color,
        alpha: 0.7,
        life: 0.25,
        maxLife: 0.25
      });
    }

    addConfetti(w, h) {
      const colors = ['#00f5d4', '#f72585', '#ffd166', '#4361ee', '#ffffff', '#7209b7'];
      for (let i = 0; i < 90; i++) {
        this.confetti.push({
          x: w / 2 + (Math.random() - 0.5) * 60,
          y: h / 2 - 50,
          vx: (Math.random() - 0.5) * 400,
          vy: -Math.random() * 380 - 100,
          rot: Math.random() * Math.PI * 2,
          vrot: (Math.random() - 0.5) * 10,
          size: Math.random() * 8 + 5,
          color: colors[Math.floor(Math.random() * colors.length)],
          gravity: 500,
          life: 2.5
        });
      }
    }

    update(dt) {
      // Particles
      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt;
        p.alpha = Math.max(0, p.life / p.maxLife);
        if (p.life <= 0) this.particles.splice(i, 1);
      }

      // Confetti
      for (let i = this.confetti.length - 1; i >= 0; i--) {
        const c = this.confetti[i];
        c.vy += c.gravity * dt;
        c.x += c.vx * dt;
        c.y += c.vy * dt;
        c.rot += c.vrot * dt;
        c.life -= dt;
        if (c.life <= 0) this.confetti.splice(i, 1);
      }

      // Starfield twinkle
      for (const s of this.stars) {
        s.alpha += Math.sin(Date.now() * 0.003 * s.speed) * 0.01;
      }
    }

    drawBackground(ctx, w, h) {
      ctx.save();
      for (const s of this.stars) {
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.max(0.1, Math.min(0.8, s.alpha))})`;
        ctx.beginPath();
        ctx.arc(s.x * w, s.y * h, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    draw(ctx) {
      ctx.save();
      for (const p of this.particles) {
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      for (const c of this.confetti) {
        ctx.save();
        ctx.translate(c.x, c.y);
        ctx.rotate(c.rot);
        ctx.fillStyle = c.color;
        ctx.fillRect(-c.size / 2, -c.size / 2, c.size, c.size * 0.6);
        ctx.restore();
      }
      ctx.restore();
    }

    clear() {
      this.particles = [];
      this.confetti = [];
    }
  }

  // ============================================================================
  // 5. GAME ENGINE
  // ============================================================================
  class MazeRotatorGame {
    constructor() {
      this.canvas = document.getElementById('gameCanvas');
      this.ctx = this.canvas.getContext('2d');
      this.audio = new AudioEngine();
      this.particles = new ParticleSystem();

      // UI Screens
      this.screens = {
        mainMenu: document.getElementById('screenMainMenu'),
        levelSelect: document.getElementById('screenLevelSelect'),
        howToPlay: document.getElementById('screenHowToPlay'),
        pause: document.getElementById('screenPause'),
        levelComplete: document.getElementById('screenLevelComplete'),
        gameComplete: document.getElementById('screenGameComplete'),
        exitConfirm: document.getElementById('screenExitConfirm'),
        hud: document.getElementById('hud')
      };

      // Detect if running inside iframe (editors or portal catalog)
      if (window.self !== window.top) {
        const page = document.getElementById('game-page');
        if (page) page.classList.add('in-iframe');
      }

      this.previousScreen = 'mainMenu';

      // HUD Elements
      this.hud = {
        levelBadge: document.getElementById('hudLevelBadge'),
        levelName: document.getElementById('hudLevelName'),
        moves: document.getElementById('hudMoves'),
        par: document.getElementById('hudPar'),
        timer: document.getElementById('hudTimer'),
        gems: document.getElementById('hudGems'),
        tutorialBanner: document.getElementById('tutorialBanner'),
        tutorialText: document.getElementById('tutorialText')
      };

      // Game state
      this.state = 'MENU'; // MENU, PLAYING, PAUSED, LEVEL_COMPLETE, GAME_COMPLETE
      this.currentLevelIndex = 0;
      this.levelData = null;
      this.saveData = Storage.getProgress();
      this.audio.setMuted(this.saveData.soundMuted || false);

      // Maze orientation & animation
      // 0: Down (r+1), 1: Right (c+1), 2: Up (r-1), 3: Left (c-1)
      this.orientation = 0;
      this.visualAngle = 0;
      this.targetAngle = 0;
      this.isRotating = false;
      this.rotationDuration = 0.28; // ~280ms snappy smooth rotation
      this.rotationTimer = 0;
      this.startAngle = 0;
      this.queuedRotation = 0; // -1 (CCW) or +1 (CW)

      // Ball state & physics
      this.ball = {
        r: 0,
        c: 0,
        renderX: 0,
        renderY: 0,
        isSliding: false,
        slidePath: [],
        slideProgress: 0,
        slideDuration: 0.14,
        scaleX: 1,
        scaleY: 1
      };

      // Level runtime status
      this.movesCount = 0;
      this.elapsedTime = 0;
      this.gemsCollected = [false, false, false];
      this.hasKey = false;
      this.crumbledPits = new Set();
      this.steppedCrumbles = new Set();
      this.teleporters = [];
      this.enemyStep = 0;
      this.enemyVisualOffset = 0;
      this.screenShake = 0;

      // Layout & scaling
      this.dpr = 1;
      this.cellSize = 48;
      this.mazePixelSize = 0;

      // Input drag tracking
      this.dragStartX = 0;
      this.dragStartY = 0;
      this.isDragging = false;

      this.initEvents();
      this.resize();
      this.updateSoundButtons();
      this.renderLevelSelectGrid();

      // Start animation loop
      this.lastTime = performance.now();
      requestAnimationFrame(this.loop.bind(this));
    }

    // ==========================================================================
    // INITIALIZATION & EVENT LISTENERS
    // ==========================================================================
    initEvents() {
      window.addEventListener('resize', () => this.resize());
      document.addEventListener('visibilitychange', () => {
        if (document.hidden && this.state === 'PLAYING') {
          this.pauseGame();
        }
      });

      // Audio unlock on user interaction
      const unlockAudio = () => {
        this.audio.ensureContext();
        window.removeEventListener('pointerdown', unlockAudio);
        window.removeEventListener('keydown', unlockAudio);
      };
      window.addEventListener('pointerdown', unlockAudio);
      window.addEventListener('keydown', unlockAudio);

      // Keyboard Controls
      window.addEventListener('keydown', (e) => {
        if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space'].includes(e.code)) {
          e.preventDefault();
        }

        if (this.state === 'PLAYING') {
          if (e.code === 'ArrowLeft' || e.key === 'a' || e.key === 'A' || e.key === 'q' || e.key === 'Q') {
            this.requestRotation(-1); // CCW
          } else if (e.code === 'ArrowRight' || e.key === 'd' || e.key === 'D' || e.key === 'e' || e.key === 'E') {
            this.requestRotation(1); // CW
          } else if (e.key === 'r' || e.key === 'R') {
            this.restartLevel();
          } else if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
            this.pauseGame();
          } else if (e.key === 'm' || e.key === 'M') {
            this.toggleSound();
          }
        } else if (this.state === 'PAUSED') {
          if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
            this.resumeGame();
          }
        }
      });

      // Touch / Mouse Swipe and Drag Controls
      this.canvas.addEventListener('pointerdown', (e) => {
        if (this.state !== 'PLAYING') return;
        this.dragStartX = e.clientX;
        this.dragStartY = e.clientY;
        this.isDragging = true;
      });

      window.addEventListener('pointerup', (e) => {
        if (!this.isDragging || this.state !== 'PLAYING') return;
        this.isDragging = false;
        const dx = e.clientX - this.dragStartX;
        const dy = e.clientY - this.dragStartY;
        const dist = Math.hypot(dx, dy);

        if (dist > 30 && Math.abs(dx) > Math.abs(dy)) {
          if (dx < -30) this.requestRotation(-1); // CCW swipe
          else if (dx > 30) this.requestRotation(1); // CW swipe
        }
      });

      // On-Screen Rotate Buttons
      document.getElementById('btnRotateCCW').addEventListener('click', () => {
        if (this.state === 'PLAYING') this.requestRotation(-1);
      });
      document.getElementById('btnRotateCW').addEventListener('click', () => {
        if (this.state === 'PLAYING') this.requestRotation(1);
      });

      // Bottom Footer Fullscreen Button
      const btnFullscreen = document.getElementById('btnFullscreen');
      if (btnFullscreen) {
        btnFullscreen.addEventListener('click', () => this.toggleFullscreen());
      }
      document.addEventListener('fullscreenchange', () => this.updateFullscreenUI());
      document.addEventListener('webkitfullscreenchange', () => this.updateFullscreenUI());

      // Top HUD Buttons
      document.getElementById('btnRestart').addEventListener('click', () => this.restartLevel());
      document.getElementById('btnPause').addEventListener('click', () => this.pauseGame());
      document.getElementById('btnSoundToggle').addEventListener('click', () => this.toggleSound());

      // Main Menu Buttons
      document.getElementById('btnPlay').addEventListener('click', () => {
        const nextLvl = Math.min(this.saveData.unlocked || 1, LEVELS.length);
        this.startLevel(nextLvl - 1);
      });
      document.getElementById('btnLevelSelect').addEventListener('click', () => this.showScreen('levelSelect'));
      document.getElementById('btnHowToPlay').addEventListener('click', () => this.showScreen('howToPlay'));
      document.getElementById('btnMenuSound').addEventListener('click', () => this.toggleSound());
      document.getElementById('btnResetProgress').addEventListener('click', () => {
        if (confirm("Reset all unlocked levels and stars?")) {
          Storage.reset();
          this.saveData = Storage.getProgress();
          this.renderLevelSelectGrid();
          alert("Progress reset to Level 1.");
        }
      });

      // Level Select Screen Buttons
      document.getElementById('btnCloseLevelSelect').addEventListener('click', () => this.showScreen('mainMenu'));
      document.getElementById('btnBackToMenu').addEventListener('click', () => this.showScreen('mainMenu'));

      // How To Play Buttons
      document.getElementById('btnCloseHowToPlay').addEventListener('click', () => this.showScreen('mainMenu'));
      document.getElementById('btnHowToPlayGotIt').addEventListener('click', () => this.showScreen('mainMenu'));

      // Pause Screen Buttons
      document.getElementById('btnResume').addEventListener('click', () => this.resumeGame());
      document.getElementById('btnPauseRestart').addEventListener('click', () => {
        this.resumeGame();
        this.restartLevel();
      });
      document.getElementById('btnPauseLevels').addEventListener('click', () => {
        this.showScreen('levelSelect');
      });
      document.getElementById('btnPauseMenu').addEventListener('click', () => {
        this.showScreen('mainMenu');
      });
      document.getElementById('btnPauseSound').addEventListener('click', () => this.toggleSound());

      // Level Complete Buttons
      document.getElementById('btnNextLevel').addEventListener('click', () => {
        if (this.currentLevelIndex + 1 < LEVELS.length) {
          this.startLevel(this.currentLevelIndex + 1);
        } else {
          this.showGameComplete();
        }
      });
      document.getElementById('btnWinRetry').addEventListener('click', () => this.restartLevel());
      document.getElementById('btnWinLevels').addEventListener('click', () => this.showScreen('levelSelect'));

      // Back & Exit Confirmation Buttons
      const btnHudBack = document.getElementById('btnHudBack');
      if (btnHudBack) btnHudBack.addEventListener('click', () => this.showExitConfirm('playing'));

      const btnMainBack = document.getElementById('btnMainBack');
      if (btnMainBack) btnMainBack.addEventListener('click', () => this.showExitConfirm('mainMenu'));

      const btnExitGame = document.getElementById('btnExitGame');
      if (btnExitGame) btnExitGame.addEventListener('click', () => this.showExitConfirm('mainMenu'));

      const btnPauseExit = document.getElementById('btnPauseExit');
      if (btnPauseExit) btnPauseExit.addEventListener('click', () => this.showExitConfirm('pause'));

      const btnConfirmExit = document.getElementById('btnConfirmExit');
      if (btnConfirmExit) btnConfirmExit.addEventListener('click', () => this.exitGame());

      const btnCancelExit = document.getElementById('btnCancelExit');
      if (btnCancelExit) btnCancelExit.addEventListener('click', () => this.hideExitConfirm());

      // Victory Buttons
      document.getElementById('btnVictoryLevelSelect').addEventListener('click', () => this.showScreen('levelSelect'));
      document.getElementById('btnVictoryMainMenu').addEventListener('click', () => this.showScreen('mainMenu'));
    }

    showExitConfirm(previous = 'mainMenu') {
      this.previousScreen = previous;
      if (this.screens.exitConfirm) {
        this.screens.exitConfirm.classList.remove('hidden');
        this.screens.exitConfirm.classList.add('active');
      }
    }

    hideExitConfirm() {
      if (this.screens.exitConfirm) {
        this.screens.exitConfirm.classList.add('hidden');
        this.screens.exitConfirm.classList.remove('active');
      }
    }

    exitGame() {
      // 1. If running inside iframe (e.g. portal modal), notify parent window
      try {
        if (window.parent && window.parent !== window) {
          window.parent.postMessage({ action: 'closeModal', type: 'GAME_ENDED' }, '*');
          window.parent.postMessage('closeModal', '*');
        }
      } catch (e) {}

      // 2. Try window.close()
      try {
        window.close();
      } catch (e) {}

      // 3. Try window.history.back()
      if (window.history && window.history.length > 1) {
        window.history.back();
      } else {
        // 4. Fallback: navigate to catalog portal
        window.location.href = '../';
      }

      // 5. In case the browser blocks closing or going back
      const exitCard = document.querySelector('#screenExitConfirm .exit-card');
      if (exitCard) {
        exitCard.innerHTML = `
          <div class="exit-icon-box" style="color:var(--accent-cyan);border-color:var(--accent-cyan);">✓</div>
          <h2 class="exit-title">Session Ended</h2>
          <p class="exit-desc">You can now safely close this browser tab or return to the CIEL Arcade portal.</p>
          <div class="exit-actions">
            <a href="../" class="menu-btn btn-primary" style="text-decoration:none;">Return to Portal</a>
          </div>
        `;
      }
    }

    resize() {
      const container = document.getElementById('game-container') || document.body;
      const rect = container.getBoundingClientRect();
      const w = Math.max(Math.floor(rect.width), 240);
      const h = Math.max(Math.floor(rect.height), 320);

      this.dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.canvas.width = Math.floor(w * this.dpr);
      this.canvas.height = Math.floor(h * this.dpr);
      this.canvas.style.width = `${w}px`;
      this.canvas.style.height = `${h}px`;

      this.ctx.setTransform(1, 0, 0, 1, 0, 0);
      this.ctx.scale(this.dpr, this.dpr);

      // Re-calculate maze cell size to fit cleanly inside 9:16 portrait container
      if (this.levelData) {
        this.calcCellSize(w, h);
      }
    }

    calcCellSize(w, h) {
      if (!w || !h) {
        const container = document.getElementById('game-container') || document.body;
        const rect = container.getBoundingClientRect();
        w = rect.width;
        h = rect.height;
      }

      const rows = this.levelData.grid.length;
      const cols = this.levelData.grid[0].length;

      // Available space between top HUD (60px) and bottom rotate buttons (98px)
      const availableW = Math.max(120, w - 24);
      const availableH = Math.max(120, h - 165);

      this.cellSize = Math.floor(Math.min(availableW / cols, availableH / rows));
      this.cellSize = Math.max(22, Math.min(this.cellSize, 72));
      this.mazePixelSize = Math.max(rows, cols) * this.cellSize;
    }

    toggleFullscreen() {
      const page = document.getElementById('game-page') || document.documentElement;
      if (!document.fullscreenElement && !document.webkitFullscreenElement) {
        if (page.requestFullscreen) {
          page.requestFullscreen();
        } else if (page.webkitRequestFullscreen) {
          page.webkitRequestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
          document.webkitExitFullscreen();
        }
      }
    }

    updateFullscreenUI() {
      const isFs = !!(document.fullscreenElement || document.webkitFullscreenElement);
      const openIcon = document.querySelector('.fs-icon-open');
      const exitIcon = document.querySelector('.fs-icon-exit');
      const page = document.getElementById('game-page');

      if (page) {
        if (isFs) page.classList.add('fullscreen-active');
        else page.classList.remove('fullscreen-active');
      }

      if (openIcon && exitIcon) {
        if (isFs) {
          openIcon.classList.add('hidden');
          exitIcon.classList.remove('hidden');
        } else {
          openIcon.classList.remove('hidden');
          exitIcon.classList.add('hidden');
        }
      }

      setTimeout(() => this.resize(), 60);
    }

    toggleSound() {
      this.saveData.soundMuted = !this.saveData.soundMuted;
      this.audio.setMuted(this.saveData.soundMuted);
      Storage.saveProgress(this.saveData);
      this.updateSoundButtons();
    }

    updateSoundButtons() {
      const isMuted = this.saveData.soundMuted;
      const text = isMuted ? 'OFF' : 'ON';
      const icon = isMuted ? '🔇' : '🔊';

      const hudSoundBtn = document.getElementById('btnSoundToggle');
      if (hudSoundBtn) hudSoundBtn.innerHTML = `<span>${icon}</span>`;

      const menuSoundText = document.getElementById('menuSoundText');
      const menuSoundIcon = document.getElementById('menuSoundIcon');
      if (menuSoundText) menuSoundText.textContent = text;
      if (menuSoundIcon) menuSoundIcon.textContent = icon;

      const pauseSoundBtn = document.getElementById('btnPauseSound');
      if (pauseSoundBtn) pauseSoundBtn.textContent = `Sound: ${text}`;
    }

    showScreen(screenKey) {
      Object.keys(this.screens).forEach(key => {
        if (key === 'hud') return;
        this.screens[key].classList.add('hidden');
        this.screens[key].classList.remove('active');
      });

      if (screenKey === 'playing') {
        this.screens.hud.classList.remove('hidden');
        this.state = 'PLAYING';
      } else {
        this.screens.hud.classList.add('hidden');
        if (this.screens[screenKey]) {
          this.screens[screenKey].classList.remove('hidden');
          this.screens[screenKey].classList.add('active');
        }
        if (screenKey === 'mainMenu') this.state = 'MENU';
        else if (screenKey === 'levelSelect') {
          this.state = 'LEVEL_SELECT';
          this.renderLevelSelectGrid();
        } else if (screenKey === 'pause') this.state = 'PAUSED';
        else if (screenKey === 'levelComplete') this.state = 'LEVEL_COMPLETE';
        else if (screenKey === 'gameComplete') this.state = 'GAME_COMPLETE';
      }
    }

    renderLevelSelectGrid() {
      const grid = document.getElementById('levelsGrid');
      const totalStarsLabel = document.getElementById('totalStarsCount');
      if (!grid) return;
      grid.innerHTML = '';

      let totalStars = 0;
      const unlockedCount = this.saveData.unlocked || 1;

      LEVELS.forEach((lvl, idx) => {
        const isLocked = (idx + 1) > unlockedCount;
        const stats = (this.saveData.levels && this.saveData.levels[lvl.id]) || { stars: 0 };
        totalStars += (stats.stars || 0);

        const tile = document.createElement('div');
        tile.className = `level-tile ${isLocked ? 'locked' : ''}`;

        let starsHtml = '';
        for (let s = 1; s <= 3; s++) {
          starsHtml += `<span class="${s <= stats.stars ? 'star-active' : ''}">★</span>`;
        }

        tile.innerHTML = `
          <div class="tile-number">${lvl.id}</div>
          <div class="tile-name">${lvl.name}</div>
          ${isLocked ? '<div class="tile-lock-icon">🔒</div>' : `<div class="tile-stars">${starsHtml}</div>`}
        `;

        if (!isLocked) {
          tile.addEventListener('click', () => {
            this.startLevel(idx);
          });
        }

        grid.appendChild(tile);
      });

      if (totalStarsLabel) totalStarsLabel.textContent = totalStars;
    }

    // ==========================================================================
    // LEVEL LIFECYCLE & GAMEPLAY
    // ==========================================================================
    startLevel(index) {
      this.currentLevelIndex = index;
      this.levelData = LEVELS[index];
      this.calcCellSize();

      // Reset level variables
      this.orientation = 0;
      this.visualAngle = 0;
      this.targetAngle = 0;
      this.isRotating = false;
      this.queuedRotation = 0;

      this.movesCount = 0;
      this.elapsedTime = 0;
      this.gemsCollected = [false, false, false];
      this.hasKey = false;
      this.crumbledPits.clear();
      this.steppedCrumbles.clear();
      this.teleporters = [];
      this.enemyStep = 0;
      this.enemyVisualOffset = 0;
      this.screenShake = 0;
      this.particles.clear();

      // Parse grid
      let startPos = { r: 1, c: 1 };
      const rows = this.levelData.grid.length;
      const cols = this.levelData.grid[0].length;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const ch = this.levelData.grid[r][c];
          if (ch === 'S') startPos = { r, c };
          if (ch === 'T') this.teleporters.push({ r, c });
        }
      }

      this.ball.r = startPos.r;
      this.ball.c = startPos.c;
      this.ball.renderX = startPos.c * this.cellSize + this.cellSize / 2;
      this.ball.renderY = startPos.r * this.cellSize + this.cellSize / 2;
      this.ball.isSliding = false;
      this.ball.slidePath = [];
      this.ball.scaleX = 1;
      this.ball.scaleY = 1;

      // Update HUD
      this.hud.levelBadge.textContent = `LEVEL ${this.levelData.id}`;
      this.hud.levelName.textContent = this.levelData.name;
      this.hud.moves.textContent = '0';
      this.hud.par.textContent = `/ Par ${this.levelData.parMoves}`;
      this.hud.timer.textContent = '00:00';
      this.updateHudGems();

      if (this.levelData.tutorial) {
        this.hud.tutorialText.textContent = this.levelData.tutorial;
        this.hud.tutorialBanner.classList.remove('hidden');
      } else {
        this.hud.tutorialBanner.classList.add('hidden');
      }

      this.showScreen('playing');

      // Initial drop under gravity (orientation 0 = down)
      this.applyGravity(0, true);
    }

    restartLevel() {
      this.audio.playImpact(1.2);
      this.startLevel(this.currentLevelIndex);
    }

    pauseGame() {
      if (this.state === 'PLAYING') {
        this.showScreen('pause');
      }
    }

    resumeGame() {
      if (this.state === 'PAUSED') {
        this.showScreen('playing');
      }
    }

    updateHudGems() {
      const gemsEls = this.hud.gems.querySelectorAll('.hud-gem');
      gemsEls.forEach((el, idx) => {
        if (this.gemsCollected[idx]) {
          el.classList.add('collected');
        } else {
          el.classList.remove('collected');
        }
      });
    }

    // ==========================================================================
    // ROTATION & INPUT HANDLING
    // ==========================================================================
    requestRotation(dir) {
      // dir: -1 (CCW) or +1 (CW)
      if (this.state !== 'PLAYING') return;

      // If rotating or ball is mid-slide, queue 1 rotation at most
      if (this.isRotating || this.ball.isSliding) {
        this.queuedRotation = dir;
        return;
      }

      this.executeRotation(dir);
    }

    executeRotation(dir) {
      this.isRotating = true;
      this.rotationTimer = 0;
      this.startAngle = this.visualAngle;
      this.targetAngle = this.visualAngle + (dir * Math.PI / 2);

      // Orientation index: 0..3
      this.orientation = (this.orientation + (dir > 0 ? 1 : 3)) % 4;
      this.audio.playWhoosh(dir);

      this.movesCount++;
      this.hud.moves.textContent = this.movesCount;
      if (this.movesCount > this.levelData.parMoves) {
        this.hud.moves.style.color = 'var(--magenta)';
      } else {
        this.hud.moves.style.color = '#fff';
      }

      // Advance enemy step on rotation
      if (this.levelData.enemy) {
        this.enemyStep++;
      }
    }

    // ==========================================================================
    // DETERMINISTIC GRAVITY & BALL PHYSICS
    // ==========================================================================
    // Directions: 0 = Down (+r), 1 = Right (+c), 2 = Up (-r), 3 = Left (-c)
    static DIRS = [
      { dr: 1, dc: 0 },
      { dr: 0, dc: 1 },
      { dr: -1, dc: 0 },
      { dr: 0, dc: -1 }
    ];

    applyGravity(orientation, isInitial = false) {
      const dir = MazeRotatorGame.DIRS[orientation];
      let cr = this.ball.r;
      let cc = this.ball.c;
      const path = [];
      let died = false;
      let hitSticky = false;
      let reachedExit = false;

      const rows = this.levelData.grid.length;
      const cols = this.levelData.grid[0].length;

      // Enemy check
      const getEnemyPos = () => {
        if (!this.levelData.enemy) return null;
        const p = this.levelData.enemy;
        const offset = Math.abs((this.enemyStep % (2 * p.range)) - p.range);
        return {
          r: p.axis === 'v' ? p.r + offset : p.r,
          c: p.axis === 'h' ? p.c + offset : p.c
        };
      };

      const enemyPos = getEnemyPos();

      while (!hitSticky) {
        const nr = cr + dir.dr;
        const nc = cc + dir.dc;

        // Check bounds
        if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) break;

        const cell = this.levelData.grid[nr][nc];

        // Wall collision
        if (cell === '#') break;

        // Locked door collision
        if (cell === 'D' && !this.hasKey) break;

        // One-way gates
        if (cell === 'v' && dir.dr !== 1) break;
        if (cell === '^' && dir.dr !== -1) break;
        if (cell === '>' && dir.dc !== 1) break;
        if (cell === '<' && dir.dc !== -1) break;

        // Advance to next cell
        cr = nr;
        cc = nc;
        path.push({ r: cr, c: cc });

        // Enemy collision
        if (enemyPos && cr === enemyPos.r && cc === enemyPos.c) {
          died = true;
          break;
        }

        // Spike collision
        if (cell === 'X') {
          died = true;
          break;
        }

        // Crumbled pit collision
        if (this.crumbledPits.has(`${cr},${cc}`)) {
          died = true;
          break;
        }

        // Stepped crumble: mark for crumbling upon departure
        if (cell === 'C') {
          this.steppedCrumbles.add(`${cr},${cc}`);
        }

        // Keys
        if (cell === 'K' && !this.hasKey) {
          this.hasKey = true;
          path[path.length - 1].event = 'key';
        }

        // Gems
        if (cell === '*') {
          const gemIdx = this.getGemIndexAt(cr, cc);
          if (gemIdx !== -1 && !this.gemsCollected[gemIdx]) {
            path[path.length - 1].gemIdx = gemIdx;
          }
        }

        // Exit
        if (cell === 'E') {
          reachedExit = true;
          break;
        }

        // Teleporters
        if (cell === 'T') {
          const partner = this.teleporters.find(t => t.r !== cr || t.c !== cc);
          if (partner) {
            cr = partner.r;
            cc = partner.c;
            path.push({ r: cr, c: cc, teleport: true });
          }
        }

        // Sticky tile: stops slide immediately!
        if (cell === 'Z') {
          hitSticky = true;
          break;
        }
      }

      if (path.length > 0) {
        this.ball.isSliding = true;
        this.ball.slidePath = path;
        this.ball.slideProgress = 0;
        this.ball.slideDuration = Math.max(0.08, path.length * 0.05);
        this.ball.diedOnArrival = died;
        this.ball.winOnArrival = reachedExit;
      } else {
        // Did not move
        if (died) this.handleDeath();
      }
    }

    getGemIndexAt(r, c) {
      let idx = 0;
      for (let row = 0; row < this.levelData.grid.length; row++) {
        for (let col = 0; col < this.levelData.grid[0].length; col++) {
          if (this.levelData.grid[row][col] === '*') {
            if (row === r && col === c) return idx;
            idx++;
          }
        }
      }
      return -1;
    }

    handleDeath() {
      this.screenShake = 0.35;
      this.audio.playSpikeHit();

      // Burst of red particles
      const px = this.ball.c * this.cellSize + this.cellSize / 2;
      const py = this.ball.r * this.cellSize + this.cellSize / 2;
      this.particles.addSpark(px, py, '#ef476f', 24);

      setTimeout(() => {
        if (this.state === 'PLAYING') {
          this.restartLevel();
        }
      }, 350);
    }

    handleWin() {
      this.state = 'LEVEL_COMPLETE';
      this.audio.playLevelComplete();

      // Confetti burst inside portrait canvas
      const cw = this.canvas.width / this.dpr;
      const ch = this.canvas.height / this.dpr;
      this.particles.addConfetti(cw, ch);

      // Calculate Stars (1-3)
      let stars = 1;
      const gemsCount = this.gemsCollected.filter(Boolean).length;
      const par = this.levelData.parMoves;

      if (this.movesCount <= par + 2 || gemsCount >= 2) stars = 2;
      if (this.movesCount <= par && gemsCount === 3) stars = 3;

      // Save progress
      if (!this.saveData.levels) this.saveData.levels = {};
      const prevStats = this.saveData.levels[this.levelData.id] || { stars: 0, bestMoves: 999, bestTime: 999 };

      const bestMoves = Math.min(prevStats.bestMoves || 999, this.movesCount);
      const bestTime = Math.min(prevStats.bestTime || 999, Math.floor(this.elapsedTime));
      const finalStars = Math.max(prevStats.stars || 0, stars);

      this.saveData.levels[this.levelData.id] = {
        stars: finalStars,
        bestMoves,
        bestTime
      };

      // Unlock next level
      this.saveData.unlocked = Math.max(this.saveData.unlocked || 1, this.currentLevelIndex + 2);
      Storage.saveProgress(this.saveData);

      // Populate Level Complete modal
      document.getElementById('winLevelName').textContent = this.levelData.name;
      document.getElementById('winMoves').textContent = this.movesCount;
      document.getElementById('winParMoves').textContent = `Par: ${par}`;
      document.getElementById('winTime').textContent = this.formatTime(this.elapsedTime);
      document.getElementById('winBestTime').textContent = this.formatTime(bestTime);
      document.getElementById('winGems').textContent = `${gemsCount} / 3`;

      const starSlots = document.querySelectorAll('#winStars .win-star-slot');
      starSlots.forEach((slot, idx) => {
        slot.classList.remove('earned');
        if (idx < stars) {
          setTimeout(() => slot.classList.add('earned'), (idx + 1) * 200);
        }
      });

      this.showScreen('levelComplete');
    }

    showGameComplete() {
      this.state = 'GAME_COMPLETE';
      this.audio.playLevelComplete();
      this.particles.addConfetti(this.canvas.width / this.dpr, this.canvas.height / this.dpr);

      let totalStars = 0;
      let totalTime = 0;
      LEVELS.forEach(lvl => {
        const s = (this.saveData.levels && this.saveData.levels[lvl.id]) || {};
        totalStars += (s.stars || 0);
        totalTime += (s.bestTime && s.bestTime !== 999 ? s.bestTime : 0);
      });

      document.getElementById('vicStars').textContent = `${totalStars} / 30`;
      document.getElementById('vicTime').textContent = this.formatTime(totalTime);

      this.showScreen('gameComplete');
    }

    formatTime(seconds) {
      const s = Math.floor(seconds);
      const m = Math.floor(s / 60);
      const remS = s % 60;
      return `${m < 10 ? '0' : ''}${m}:${remS < 10 ? '0' : ''}${remS}`;
    }

    // ==========================================================================
    // MAIN LOOP (UPDATE & RENDER)
    // ==========================================================================
    loop(timestamp) {
      const dt = Math.min((timestamp - this.lastTime) / 1000, 0.1);
      this.lastTime = timestamp;

      this.update(dt);
      this.render();

      requestAnimationFrame(this.loop.bind(this));
    }

    update(dt) {
      if (this.state === 'PLAYING') {
        this.elapsedTime += dt;
        this.hud.timer.textContent = this.formatTime(this.elapsedTime);
      }

      this.particles.update(dt);

      if (this.screenShake > 0) {
        this.screenShake = Math.max(0, this.screenShake - dt * 2);
      }

      // Handle Maze Rotation Animation
      if (this.isRotating) {
        this.rotationTimer += dt;
        const progress = Math.min(1, this.rotationTimer / this.rotationDuration);

        // Smooth cubic ease out
        const ease = 1 - Math.pow(1 - progress, 3);
        this.visualAngle = this.startAngle + (this.targetAngle - this.startAngle) * ease;

        if (progress >= 1) {
          this.visualAngle = this.targetAngle;
          this.isRotating = false;

          // Apply gravity in new orientation once rotation finishes
          this.applyGravity(this.orientation);

          // Turn stepped crumbles into real holes
          if (this.steppedCrumbles.size > 0) {
            this.steppedCrumbles.forEach(pt => this.crumbledPits.add(pt));
            this.steppedCrumbles.clear();
            this.audio.playCrumble();
          }
        }
      }

      // Handle Ball Sliding Animation
      if (this.ball.isSliding) {
        this.ball.slideProgress += dt;
        const total = this.ball.slideDuration;
        const t = Math.min(1, this.ball.slideProgress / total);

        // Find current segment along path
        const path = this.ball.slidePath;
        const floatIdx = t * (path.length - 1);
        const currIdx = Math.floor(floatIdx);
        const nextIdx = Math.min(path.length - 1, currIdx + 1);
        const subT = floatIdx - currIdx;

        const p1 = currIdx === 0 ? { r: this.ball.r, c: this.ball.c } : path[currIdx - 1];
        const p2 = path[currIdx];

        if (p2.teleport) {
          this.ball.renderX = p2.c * this.cellSize + this.cellSize / 2;
          this.ball.renderY = p2.r * this.cellSize + this.cellSize / 2;
          this.audio.playTeleport();
        } else {
          this.ball.renderX = (p1.c + (p2.c - p1.c) * subT) * this.cellSize + this.cellSize / 2;
          this.ball.renderY = (p1.r + (p2.r - p1.r) * subT) * this.cellSize + this.cellSize / 2;
        }

        // Particle trail
        this.particles.addTrail(this.ball.renderX, this.ball.renderY, '#ffd166');

        // Check pickup events on current cell
        if (p2.gemIdx !== undefined && !this.gemsCollected[p2.gemIdx]) {
          this.gemsCollected[p2.gemIdx] = true;
          this.updateHudGems();
          this.audio.playGemChime(p2.gemIdx);
          this.particles.addSpark(this.ball.renderX, this.ball.renderY, '#ffd166', 14);
        }

        if (p2.event === 'key' && this.hasKey) {
          p2.event = null;
          this.audio.playKey();
          this.particles.addSpark(this.ball.renderX, this.ball.renderY, '#00f5d4', 16);
        }

        if (t >= 1) {
          // Slide completed
          const finalPoint = path[path.length - 1];
          this.ball.r = finalPoint.r;
          this.ball.c = finalPoint.c;
          this.ball.renderX = finalPoint.c * this.cellSize + this.cellSize / 2;
          this.ball.renderY = finalPoint.r * this.cellSize + this.cellSize / 2;
          this.ball.isSliding = false;

          // Impact squash & stretch
          this.ball.scaleX = 1.35;
          this.ball.scaleY = 0.72;
          this.audio.playImpact(1.0);
          this.particles.addSpark(this.ball.renderX, this.ball.renderY, '#ffffff', 10);

          if (this.ball.diedOnArrival) {
            this.handleDeath();
          } else if (this.ball.winOnArrival) {
            this.handleWin();
          } else if (this.queuedRotation !== 0) {
            const nextRot = this.queuedRotation;
            this.queuedRotation = 0;
            this.executeRotation(nextRot);
          }
        }
      } else {
        // Spring squash back to 1
        this.ball.scaleX += (1 - this.ball.scaleX) * 0.2;
        this.ball.scaleY += (1 - this.ball.scaleY) * 0.2;
      }
    }

    // ==========================================================================
    // RENDERING PIPELINE
    // ==========================================================================
    render() {
      const w = this.canvas.width / this.dpr;
      const h = this.canvas.height / this.dpr;
      this.ctx.clearRect(0, 0, w, h);

      // Screen shake offset
      let shakeX = 0, shakeY = 0;
      if (this.screenShake > 0) {
        shakeX = (Math.random() - 0.5) * this.screenShake * 30;
        shakeY = (Math.random() - 0.5) * this.screenShake * 30;
      }

      this.ctx.save();
      this.ctx.translate(shakeX, shakeY);

      // Starfield background
      this.particles.drawBackground(this.ctx, w, h);

      if (this.levelData && (this.state === 'PLAYING' || this.state === 'PAUSED' || this.state === 'LEVEL_COMPLETE')) {
        this.renderMaze(w, h);
      }

      this.particles.draw(this.ctx);
      this.ctx.restore();
    }

    renderMaze(screenWidth, screenHeight) {
      const rows = this.levelData.grid.length;
      const cols = this.levelData.grid[0].length;
      const theme = this.levelData.theme;

      this.ctx.save();
      // Center vertically in the active playfield between top HUD (58px) and bottom controls (98px)
      const topOffset = 58;
      const bottomOffset = 98;
      const centerY = topOffset + (screenHeight - topOffset - bottomOffset) / 2;

      this.ctx.translate(screenWidth / 2, centerY);
      // Visual Rotation
      this.ctx.rotate(this.visualAngle);
      // Center maze
      this.ctx.translate(-cols * this.cellSize / 2, -rows * this.cellSize / 2);

      // 1. Draw Maze Floor
      this.ctx.fillStyle = theme.floor;
      this.ctx.fillRect(0, 0, cols * this.cellSize, rows * this.cellSize);

      // 2. Draw Floor Grid & Special Tiles
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const ch = this.levelData.grid[r][c];
          const x = c * this.cellSize;
          const y = r * this.cellSize;
          const sz = this.cellSize;

          // Subtle grid line
          this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
          this.ctx.strokeRect(x, y, sz, sz);

          // Ice tiles
          if (ch === 'I') {
            this.ctx.fillStyle = 'rgba(160, 231, 229, 0.15)';
            this.ctx.fillRect(x + 1, y + 1, sz - 2, sz - 2);
            this.ctx.strokeStyle = 'rgba(160, 231, 229, 0.5)';
            this.ctx.strokeRect(x + 2, y + 2, sz - 4, sz - 4);
          }

          // Sticky tiles
          if (ch === 'Z') {
            this.ctx.fillStyle = 'rgba(255, 183, 3, 0.2)';
            this.ctx.fillRect(x + 1, y + 1, sz - 2, sz - 2);
            this.ctx.strokeStyle = '#ffb703';
            this.ctx.strokeRect(x + 2, y + 2, sz - 4, sz - 4);
          }

          // Crumbling tile / Pit
          if (ch === 'C' || this.crumbledPits.has(`${r},${c}`)) {
            if (this.crumbledPits.has(`${r},${c}`)) {
              this.ctx.fillStyle = '#04070d'; // Bottomless void
              this.ctx.fillRect(x + 2, y + 2, sz - 4, sz - 4);
              this.ctx.strokeStyle = 'rgba(239, 71, 111, 0.4)';
              this.ctx.strokeRect(x + 2, y + 2, sz - 4, sz - 4);
            } else {
              this.ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
              this.ctx.fillRect(x + 2, y + 2, sz - 4, sz - 4);
            }
          }

          // Teleporter
          if (ch === 'T') {
            this.drawTeleporter(x + sz / 2, y + sz / 2, sz * 0.38);
          }

          // One-way gates
          if (['v', '^', '>', '<'].includes(ch)) {
            this.drawOneWayGate(x + sz / 2, y + sz / 2, ch, sz);
          }

          // Locked Door
          if (ch === 'D') {
            if (!this.hasKey) {
              this.drawLockedDoor(x, y, sz);
            }
          }

          // Key
          if (ch === 'K' && !this.hasKey) {
            this.drawKey(x + sz / 2, y + sz / 2, sz * 0.3);
          }

          // Spikes
          if (ch === 'X') {
            this.drawSpikes(x, y, sz);
          }

          // Gems
          if (ch === '*') {
            const gemIdx = this.getGemIndexAt(r, c);
            if (!this.gemsCollected[gemIdx]) {
              this.drawGem(x + sz / 2, y + sz / 2, sz * 0.28);
            }
          }

          // Exit Portal
          if (ch === 'E') {
            this.drawExitPortal(x + sz / 2, y + sz / 2, sz * 0.42);
          }
        }
      }

      // 3. Draw Patrol Enemy
      if (this.levelData.enemy) {
        this.drawEnemy();
      }

      // 4. Draw Ball
      this.drawBall();

      // 5. Draw Walls on Top with Neon Glow
      this.ctx.shadowColor = theme.wallGlow;
      this.ctx.shadowBlur = 14;
      this.ctx.fillStyle = theme.wall;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (this.levelData.grid[r][c] === '#') {
            const x = c * this.cellSize;
            const y = r * this.cellSize;
            const sz = this.cellSize;

            this.ctx.fillRect(x, y, sz, sz);
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(x + 1, y + 1, sz - 2, sz - 2);
          }
        }
      }

      this.ctx.restore();
    }

    // ==========================================================================
    // PROCEDURAL ASSET RENDERERS (CANVAS 2D)
    // ==========================================================================
    drawBall() {
      const x = this.ball.renderX;
      const y = this.ball.renderY;
      const r = this.cellSize * 0.32;

      this.ctx.save();
      this.ctx.translate(x, y);
      this.ctx.scale(this.ball.scaleX, this.ball.scaleY);

      // Glow halo
      this.ctx.shadowColor = 'rgba(255, 209, 102, 0.8)';
      this.ctx.shadowBlur = 16;

      // Outer ball gradient
      const grad = this.ctx.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.1, 0, 0, r);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.4, '#ffd166');
      grad.addColorStop(1, '#ff9f1c');

      this.ctx.fillStyle = grad;
      this.ctx.beginPath();
      this.ctx.arc(0, 0, r, 0, Math.PI * 2);
      this.ctx.fill();

      // Inner shine highlight
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      this.ctx.beginPath();
      this.ctx.arc(-r * 0.35, -r * 0.35, r * 0.25, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.restore();
    }

    drawExitPortal(x, y, radius) {
      const t = Date.now() * 0.003;
      this.ctx.save();
      this.ctx.translate(x, y);

      // Swirling rings
      for (let i = 0; i < 3; i++) {
        const ringR = radius * (0.45 + i * 0.28) + Math.sin(t + i) * 2;
        this.ctx.strokeStyle = i % 2 === 0 ? 'var(--cyan)' : '#f72585';
        this.ctx.shadowColor = i % 2 === 0 ? 'var(--cyan)' : '#f72585';
        this.ctx.shadowBlur = 12;
        this.ctx.lineWidth = 2.5;

        this.ctx.beginPath();
        this.ctx.arc(0, 0, ringR, t * (i % 2 === 0 ? 1 : -1.2) + i, t * (i % 2 === 0 ? 1 : -1.2) + i + Math.PI * 1.5);
        this.ctx.stroke();
      }

      // Center core
      this.ctx.fillStyle = '#ffffff';
      this.ctx.shadowColor = 'var(--cyan)';
      this.ctx.shadowBlur = 15;
      this.ctx.beginPath();
      this.ctx.arc(0, 0, radius * 0.25, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.restore();
    }

    drawGem(x, y, size) {
      const t = Date.now() * 0.0025;
      this.ctx.save();
      this.ctx.translate(x, y);
      this.ctx.rotate(t);

      this.ctx.shadowColor = '#ffd166';
      this.ctx.shadowBlur = 12;
      this.ctx.fillStyle = '#ffd166';

      // Diamond polygon
      this.ctx.beginPath();
      this.ctx.moveTo(0, -size);
      this.ctx.lineTo(size * 0.75, 0);
      this.ctx.lineTo(0, size);
      this.ctx.lineTo(-size * 0.75, 0);
      this.ctx.closePath();
      this.ctx.fill();

      this.ctx.fillStyle = '#ffffff';
      this.ctx.beginPath();
      this.ctx.moveTo(0, -size * 0.6);
      this.ctx.lineTo(size * 0.45, 0);
      this.ctx.lineTo(0, size * 0.6);
      this.ctx.lineTo(-size * 0.45, 0);
      this.ctx.closePath();
      this.ctx.fill();

      this.ctx.restore();
    }

    drawSpikes(x, y, sz) {
      this.ctx.save();
      this.ctx.fillStyle = '#ef476f';
      this.ctx.shadowColor = 'rgba(239, 71, 111, 0.8)';
      this.ctx.shadowBlur = 10;

      // 4 triangular spike teeth
      const toothW = sz / 4;
      for (let i = 0; i < 4; i++) {
        this.ctx.beginPath();
        this.ctx.moveTo(x + i * toothW, y + sz);
        this.ctx.lineTo(x + (i + 0.5) * toothW, y + sz * 0.35);
        this.ctx.lineTo(x + (i + 1) * toothW, y + sz);
        this.ctx.closePath();
        this.ctx.fill();
      }
      this.ctx.restore();
    }

    drawTeleporter(x, y, radius) {
      const t = Date.now() * 0.004;
      this.ctx.save();
      this.ctx.translate(x, y);

      this.ctx.strokeStyle = '#9d4edd';
      this.ctx.shadowColor = '#9d4edd';
      this.ctx.shadowBlur = 14;
      this.ctx.lineWidth = 3;

      this.ctx.beginPath();
      this.ctx.arc(0, 0, radius, 0, Math.PI * 2);
      this.ctx.stroke();

      // Pulsing spiral center
      this.ctx.fillStyle = '#39ff14';
      this.ctx.shadowColor = '#39ff14';
      this.ctx.shadowBlur = 10;
      this.ctx.beginPath();
      this.ctx.arc(0, 0, radius * 0.45 + Math.sin(t) * 2, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.restore();
    }

    drawOneWayGate(x, y, dirChar, sz) {
      this.ctx.save();
      this.ctx.translate(x, y);

      let angle = 0;
      if (dirChar === 'v') angle = Math.PI / 2;
      else if (dirChar === '^') angle = -Math.PI / 2;
      else if (dirChar === '<') angle = Math.PI;

      this.ctx.rotate(angle);
      this.ctx.fillStyle = 'var(--cyan)';
      this.ctx.shadowColor = 'var(--cyan)';
      this.ctx.shadowBlur = 8;

      // Arrow polygon pointing right
      this.ctx.beginPath();
      this.ctx.moveTo(-sz * 0.25, -sz * 0.25);
      this.ctx.lineTo(sz * 0.25, 0);
      this.ctx.lineTo(-sz * 0.25, sz * 0.25);
      this.ctx.lineTo(-sz * 0.1, 0);
      this.ctx.closePath();
      this.ctx.fill();

      this.ctx.restore();
    }

    drawLockedDoor(x, y, sz) {
      this.ctx.save();
      this.ctx.fillStyle = 'rgba(255, 209, 102, 0.4)';
      this.ctx.fillRect(x + 2, y + 2, sz - 4, sz - 4);

      this.ctx.strokeStyle = '#ffd166';
      this.ctx.shadowColor = '#ffd166';
      this.ctx.shadowBlur = 10;
      this.ctx.lineWidth = 2.5;
      this.ctx.strokeRect(x + 3, y + 3, sz - 6, sz - 6);

      // Lock keyhole symbol
      this.ctx.fillStyle = '#ffffff';
      this.ctx.beginPath();
      this.ctx.arc(x + sz / 2, y + sz * 0.42, sz * 0.14, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.beginPath();
      this.ctx.moveTo(x + sz * 0.42, y + sz * 0.45);
      this.ctx.lineTo(x + sz * 0.58, y + sz * 0.45);
      this.ctx.lineTo(x + sz * 0.54, y + sz * 0.7);
      this.ctx.lineTo(x + sz * 0.46, y + sz * 0.7);
      this.ctx.closePath();
      this.ctx.fill();

      this.ctx.restore();
    }

    drawKey(x, y, size) {
      this.ctx.save();
      this.ctx.translate(x, y);

      this.ctx.fillStyle = '#ffd166';
      this.ctx.shadowColor = '#ffd166';
      this.ctx.shadowBlur = 12;

      // Key head ring
      this.ctx.beginPath();
      this.ctx.arc(0, -size * 0.35, size * 0.4, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.fillStyle = '#0f172a';
      this.ctx.beginPath();
      this.ctx.arc(0, -size * 0.35, size * 0.18, 0, Math.PI * 2);
      this.ctx.fill();

      // Key shaft and teeth
      this.ctx.fillStyle = '#ffd166';
      this.ctx.fillRect(-size * 0.12, -size * 0.15, size * 0.24, size * 0.9);
      this.ctx.fillRect(0, size * 0.45, size * 0.35, size * 0.2);

      this.ctx.restore();
    }

    drawEnemy() {
      const p = this.levelData.enemy;
      const offset = Math.abs((this.enemyStep % (2 * p.range)) - p.range);
      const r = p.axis === 'v' ? p.r + offset : p.r;
      const c = p.axis === 'h' ? p.c + offset : p.c;

      const x = c * this.cellSize + this.cellSize / 2;
      const y = r * this.cellSize + this.cellSize / 2;
      const sz = this.cellSize * 0.34;

      this.ctx.save();
      this.ctx.translate(x, y);

      // Glowing drone body
      this.ctx.shadowColor = '#ef476f';
      this.ctx.shadowBlur = 15;
      this.ctx.fillStyle = '#ef476f';

      this.ctx.beginPath();
      this.ctx.arc(0, 0, sz, 0, Math.PI * 2);
      this.ctx.fill();

      // Eye
      this.ctx.fillStyle = '#ffffff';
      this.ctx.beginPath();
      this.ctx.arc(0, 0, sz * 0.4, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.restore();
    }
  }

  // ============================================================================
  // 6. PROGRAMMATIC BFS SOLVER (VERIFY LEVELS FROM CONSOLE)
  // ============================================================================
  window.solveLevel = function (levelNumber) {
    const lvl = LEVELS.find(l => l.id === levelNumber) || LEVELS[levelNumber - 1];
    if (!lvl) return { error: "Level not found" };

    const DIRS = [
      { dr: 1, dc: 0, name: "Down" },
      { dr: 0, dc: 1, name: "Right" },
      { dr: -1, dc: 0, name: "Up" },
      { dr: 0, dc: -1, name: "Left" }
    ];

    const rows = lvl.grid.length;
    const cols = lvl.grid[0].length;
    let start = null;
    const teleports = [];

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (lvl.grid[r][c] === 'S') start = { r, c };
        if (lvl.grid[r][c] === 'T') teleports.push({ r, c });
      }
    }

    let r = start.r, c = start.c;
    while (r + 1 < rows && lvl.grid[r + 1][c] !== '#') r++;

    const initial = { r, c, q: 0, keys: false, enemyStep: 0, crumbled: [] };
    const queue = [{ state: initial, moves: 0, path: [] }];
    const visited = new Set();
    const keyOf = s => `${s.r},${s.c},${s.q},${s.keys},${s.enemyStep % 4}`;
    visited.add(keyOf(initial));

    while (queue.length > 0) {
      const { state, moves, path } = queue.shift();
      if (lvl.grid[state.r][state.c] === 'E') {
        if (!lvl.requireKey || state.keys) {
          return { solved: true, moves, path, keyCollected: state.keys };
        }
      }

      for (const act of ['CW', 'CCW']) {
        const newQ = (state.q + (act === 'CW' ? 1 : 3)) % 4;
        const dir = DIRS[newQ];
        let cr = state.r, cc = state.c, keys = state.keys;
        const enemyStep = state.enemyStep + 1;
        const crumbled = new Set(state.crumbled);

        let enemyPos = null;
        if (lvl.enemy) {
          const p = lvl.enemy;
          const offset = Math.abs((enemyStep % (2 * p.range)) - p.range);
          enemyPos = {
            r: p.axis === 'v' ? p.r + offset : p.r,
            c: p.axis === 'h' ? p.c + offset : p.c
          };
        }

        let died = false;
        let hitSticky = false;

        while (!hitSticky) {
          const nr = cr + dir.dr, nc = cc + dir.dc;
          if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) break;
          const cell = lvl.grid[nr][nc];
          if (cell === '#') break;
          if (cell === 'D' && !keys) break;
          if (cell === 'v' && dir.dr !== 1) break;
          if (cell === '^' && dir.dr !== -1) break;
          if (cell === '>' && dir.dc !== 1) break;
          if (cell === '<' && dir.dc !== -1) break;

          cr = nr; cc = nc;
          if (enemyPos && cr === enemyPos.r && cc === enemyPos.c) { died = true; break; }
          if (cell === 'X' || crumbled.has(`${cr},${cc}`)) { died = true; break; }
          if (cell === 'C') crumbled.add(`${cr},${cc}`);
          if (cell === 'K') keys = true;
          if (cell === 'E') break;
          if (cell === 'T') {
            const partner = teleports.find(t => t.r !== cr || t.c !== cc);
            if (partner) { cr = partner.r; cc = partner.c; }
          }
          if (cell === 'Z') { hitSticky = true; break; }
        }

        if (died) continue;

        const next = { r: cr, c: cc, q: newQ, keys, enemyStep, crumbled: Array.from(crumbled) };
        const k = keyOf(next);
        if (!visited.has(k)) {
          visited.add(k);
          queue.push({ state: next, moves: moves + 1, path: [...path, act] });
        }
      }
    }
    return { solved: false };
  };

  window.verifyAllLevels = function () {
    console.log("=== VERIFYING ALL 10 LEVELS ===");
    let passed = 0;
    LEVELS.forEach(lvl => {
      const res = window.solveLevel(lvl.id);
      if (res.solved) {
        passed++;
        console.log(`✅ Level ${lvl.id} "${lvl.name}": Solved in ${res.moves} moves [${res.path.join(', ')}]`);
      } else {
        console.error(`❌ Level ${lvl.id} "${lvl.name}": UNSOLVABLE`);
      }
    });
    console.log(`Summary: ${passed} / ${LEVELS.length} levels 100% verified solvable.`);
    return passed === LEVELS.length;
  };

  // Launch Game on DOMContentLoaded
  document.addEventListener('DOMContentLoaded', () => {
    window.game = new MazeRotatorGame();
  });
})();
