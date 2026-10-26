/**
 * PRISM LASER - Pure HTML5 / Canvas 2D Optics Puzzle Game
 * Responsive 9:16 Portrait on Desktop & 100% Fullscreen on Mobile/Editors
 * Zero external libraries or assets. Procedural graphics & Web Audio API.
 */

(function () {
  'use strict';

  // ==========================================================================
  // 1. PROCEDURAL WEB AUDIO ENGINE
  // ==========================================================================
  class WebAudioEngine {
    constructor() {
      this.ctx = null;
      this.isMuted = localStorage.getItem('prism_laser_muted') === 'true';
      this.humOsc = null;
      this.humGain = null;
    }

    init() {
      if (this.ctx) return;
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioContext();
      } catch (e) {
        console.warn('Web Audio API not supported', e);
      }
    }

    resume() {
      this.init();
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }

    toggleMute() {
      this.isMuted = !this.isMuted;
      localStorage.setItem('prism_laser_muted', this.isMuted);
      if (this.isMuted && this.humGain) {
        this.humGain.gain.setValueAtTime(0, this.ctx.currentTime);
      }
      return this.isMuted;
    }

    // Snappy mechanical mirror click
    playMirrorClick() {
      if (this.isMuted || !this.ctx) return;
      this.resume();
      const now = this.ctx.currentTime;

      // Click transient
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.05);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.06);

      // High glass chime
      const chime = this.ctx.createOscillator();
      const chimeGain = this.ctx.createGain();
      chime.type = 'sine';
      chime.frequency.setValueAtTime(1400, now);
      chime.frequency.exponentialRampToValueAtTime(900, now + 0.08);

      chimeGain.gain.setValueAtTime(0.15, now);
      chimeGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      chime.connect(chimeGain);
      chimeGain.connect(this.ctx.destination);
      chime.start(now);
      chime.stop(now + 0.09);
    }

    // Prism dispersion shimmer
    playPrismChime() {
      if (this.isMuted || !this.ctx) return;
      this.resume();
      const now = this.ctx.currentTime;
      [1046.5, 1318.5, 1567.98].forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.03);

        gain.gain.setValueAtTime(0.08, now + idx * 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.03 + 0.2);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + idx * 0.03);
        osc.stop(now + idx * 0.03 + 0.22);
      });
    }

    // Portal warp sound
    playPortalWarp() {
      if (this.isMuted || !this.ctx) return;
      this.resume();
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.15);
      osc.frequency.exponentialRampToValueAtTime(440, now + 0.25);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.26);
    }

    // Target core charging sound
    playTargetCharge() {
      if (this.isMuted || !this.ctx) return;
      this.resume();
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1200, now);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.16);
    }

    // Star collection chime
    playStarChime() {
      if (this.isMuted || !this.ctx) return;
      this.resume();
      const now = this.ctx.currentTime;
      [880, 1174.66, 1760].forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.05);

        gain.gain.setValueAtTime(0.15, now + i * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.05 + 0.25);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + i * 0.05);
        osc.stop(now + i * 0.05 + 0.26);
      });
    }

    // Victory level clear fanfare
    playVictory() {
      if (this.isMuted || !this.ctx) return;
      this.resume();
      const now = this.ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51];
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = idx === notes.length - 1 ? 'triangle' : 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);

        gain.gain.setValueAtTime(0.2, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + (idx === notes.length - 1 ? 0.6 : 0.3));

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.65);
      });
    }

    // Standard UI tap
    playTap() {
      if (this.isMuted || !this.ctx) return;
      this.resume();
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(540, now);
      osc.frequency.exponentialRampToValueAtTime(280, now + 0.04);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.05);
    }
  }

  // ==========================================================================
  // 2. ALL 12 VERIFIED SOLVABLE LEVELS
  // ==========================================================================
  const LEVELS = [
    // 1: First Light (1 mirror)
    {
      id: 1,
      name: "First Light",
      tutorial: "Tap the mirror to rotate its reflection angle into the energy core!",
      par: 1,
      grid: [
        "######",
        "#....#",
        "#....#",
        "#....#",
        "#....#",
        "#....#",
        "######"
      ],
      emitters: [{ r: 5, c: 1, dx: 0, dy: -1, color: "#00f5d4" }],
      mirrors: [{ r: 1, c: 1, type: '\\' }],
      targets: [{ r: 1, c: 4 }],
      stars: [{ r: 1, c: 2 }, { r: 1, c: 3 }]
    },

    // 2: Corner Shot (2 mirrors)
    {
      id: 2,
      name: "Corner Shot",
      tutorial: "Align multiple mirrors to guide the beam around obstacles.",
      par: 2,
      grid: [
        "#######",
        "#.....#",
        "#.###.#",
        "#.#...#",
        "#.#...#",
        "#.....#",
        "#######"
      ],
      emitters: [{ r: 5, c: 1, dx: 0, dy: -1, color: "#00f5d4" }],
      mirrors: [{ r: 1, c: 1, type: '\\' }, { r: 1, c: 5, type: '/' }],
      targets: [{ r: 5, c: 5 }],
      stars: [{ r: 1, c: 3 }, { r: 3, c: 5 }]
    },

    // 3: The Zigzag (3 mirrors)
    {
      id: 3,
      name: "The Zigzag",
      tutorial: "Bounce the beam back and forth to navigate the maze corridors.",
      par: 3,
      grid: [
        "########",
        "#......#",
        "#.####.#",
        "#......#",
        "#.####.#",
        "#......#",
        "########"
      ],
      emitters: [{ r: 5, c: 1, dx: 0, dy: -1, color: "#00f5d4" }],
      mirrors: [{ r: 3, c: 1, type: '\\' }, { r: 3, c: 6, type: '/' }, { r: 1, c: 6, type: '\\' }],
      targets: [{ r: 1, c: 1 }],
      stars: [{ r: 3, c: 3 }, { r: 1, c: 3 }]
    },

    // 4: Dual Reflection (3 mirrors)
    {
      id: 4,
      name: "Dual Reflection",
      tutorial: "Use precision angles to route laser through narrow gaps.",
      par: 3,
      grid: [
        "########",
        "#......#",
        "#.##.#.#",
        "#......#",
        "#.##.#.#",
        "#......#",
        "########"
      ],
      emitters: [{ r: 5, c: 1, dx: 0, dy: -1, color: "#00f5d4" }],
      mirrors: [{ r: 1, c: 1, type: '\\' }, { r: 1, c: 6, type: '/' }, { r: 5, c: 6, type: '\\' }],
      targets: [{ r: 5, c: 4 }],
      stars: [{ r: 1, c: 4 }, { r: 3, c: 6 }]
    },

    // 5: Prism Split (2 mirrors, 1 prism)
    {
      id: 5,
      name: "Prism Split",
      tutorial: "Prisms split white laser into Cyan and Magenta! Power both matching cores.",
      par: 2,
      grid: [
        "########",
        "#......#",
        "#......#",
        "#......#",
        "#......#",
        "#......#",
        "########"
      ],
      emitters: [{ r: 3, c: 1, dx: 1, dy: 0, color: "#ffffff" }],
      prisms: [{ r: 3, c: 3 }],
      mirrors: [{ r: 1, c: 3, type: '/' }, { r: 5, c: 3, type: '\\' }],
      targets: [
        { r: 1, c: 6, requiredColor: "#00f5d4" },
        { r: 5, c: 6, requiredColor: "#f72585" }
      ],
      stars: [{ r: 1, c: 4 }, { r: 5, c: 4 }]
    },

    // 6: Color Gate (2 mirrors, 1 filter)
    {
      id: 6,
      name: "Color Gate",
      tutorial: "Filters allow only their matching light color to pass through.",
      par: 2,
      grid: [
        "#########",
        "#.......#",
        "#.#####.#",
        "#.......#",
        "#.#####.#",
        "#.......#",
        "#########"
      ],
      emitters: [{ r: 5, c: 1, dx: 0, dy: -1, color: "#ffffff" }],
      filters: [{ r: 3, c: 1, color: "#00f5d4" }],
      mirrors: [{ r: 1, c: 1, type: '\\' }, { r: 1, c: 7, type: '/' }],
      targets: [{ r: 5, c: 7, requiredColor: "#00f5d4" }],
      stars: [{ r: 1, c: 4 }]
    },

    // 7: Warp Gateway (1 mirror, 2 portals)
    {
      id: 7,
      name: "Warp Gateway",
      tutorial: "Portals warp laser beams across solid barriers instantly!",
      par: 1,
      grid: [
        "#########",
        "#.......#",
        "#.#####.#",
        "#.#...#.#",
        "#.#####.#",
        "#.......#",
        "#########"
      ],
      emitters: [{ r: 5, c: 1, dx: 0, dy: -1, color: "#00f5d4" }],
      portals: [{ r: 3, c: 1 }, { r: 3, c: 7 }],
      mirrors: [{ r: 1, c: 7, type: '\\' }],
      targets: [{ r: 1, c: 3 }],
      stars: [{ r: 1, c: 5 }]
    },

    // 8: Hall of Mirrors (4 mirrors)
    {
      id: 8,
      name: "Hall of Mirrors",
      tutorial: "A grand chamber with 4 mirrors. Plan your reflections carefully!",
      par: 4,
      grid: [
        "#########",
        "#.......#",
        "#.###.#.#",
        "#.......#",
        "#.#.###.#",
        "#.......#",
        "#########"
      ],
      emitters: [{ r: 5, c: 1, dx: 0, dy: -1, color: "#00f5d4" }],
      mirrors: [
        { r: 1, c: 1, type: '\\' },
        { r: 1, c: 5, type: '/' },
        { r: 3, c: 5, type: '\\' },
        { r: 3, c: 7, type: '/' }
      ],
      targets: [{ r: 5, c: 7 }],
      stars: [{ r: 1, c: 3 }, { r: 3, c: 6 }]
    },

    // 9: Spectrum Split (4 mirrors, 1 prism)
    {
      id: 9,
      name: "Spectrum Split",
      tutorial: "Split white light and route the two colors to opposite sides.",
      par: 4,
      grid: [
        "##########",
        "#........#",
        "#........#",
        "#........#",
        "#........#",
        "#........#",
        "##########"
      ],
      emitters: [{ r: 3, c: 1, dx: 1, dy: 0, color: "#ffffff" }],
      prisms: [{ r: 3, c: 4 }],
      mirrors: [
        { r: 1, c: 4, type: '\\' },
        { r: 5, c: 4, type: '/' },
        { r: 1, c: 8, type: '/' },
        { r: 5, c: 8, type: '\\' }
      ],
      targets: [
        { r: 3, c: 8, requiredColor: "#00f5d4" },
        { r: 4, c: 8, requiredColor: "#f72585" }
      ],
      stars: [{ r: 1, c: 6 }, { r: 5, c: 6 }]
    },

    // 10: Warp & Split (3 mirrors, 1 prism, 2 portals)
    {
      id: 10,
      name: "Warp & Split",
      tutorial: "Combine portals and prisms to conquer separated chambers.",
      par: 3,
      grid: [
        "##########",
        "#...#....#",
        "#...#....#",
        "#...#....#",
        "#...#....#",
        "#...#....#",
        "##########"
      ],
      emitters: [{ r: 5, c: 1, dx: 0, dy: -1, color: "#ffffff" }],
      mirrors: [
        { r: 3, c: 1, type: '\\' },
        { r: 5, c: 3, type: '/' },
        { r: 1, c: 7, type: '/' }
      ],
      prisms: [{ r: 3, c: 3 }],
      portals: [{ r: 1, c: 3 }, { r: 5, c: 7 }],
      targets: [
        { r: 1, c: 8, requiredColor: "#00f5d4" },
        { r: 5, c: 2, requiredColor: "#f72585" }
      ],
      stars: [{ r: 3, c: 2 }, { r: 1, c: 7 }]
    },

    // 11: Dual Emitters (4 mirrors)
    {
      id: 11,
      name: "Dual Emitters",
      tutorial: "Two lasers simultaneously! Cross the beams to hit both sensors.",
      par: 4,
      grid: [
        "##########",
        "#........#",
        "#.######.#",
        "#........#",
        "#.######.#",
        "#........#",
        "##########"
      ],
      emitters: [
        { r: 5, c: 1, dx: 0, dy: -1, color: "#00f5d4" },
        { r: 5, c: 8, dx: 0, dy: -1, color: "#f72585" }
      ],
      mirrors: [
        { r: 1, c: 1, type: '\\' },
        { r: 1, c: 5, type: '/' },
        { r: 3, c: 5, type: '\\' },
        { r: 1, c: 8, type: '/' }
      ],
      targets: [
        { r: 3, c: 1, requiredColor: "#00f5d4" },
        { r: 1, c: 6, requiredColor: "#f72585" }
      ],
      stars: [{ r: 1, c: 3 }, { r: 1, c: 7 }]
    },

    // 12: The Master Prism (4 mirrors, 1 prism)
    {
      id: 12,
      name: "The Master Prism",
      tutorial: "The final optical challenge! Combine every element you have mastered.",
      par: 4,
      grid: [
        "###########",
        "#.........#",
        "#.##.####.#",
        "#.........#",
        "#.##.####.#",
        "#.........#",
        "###########"
      ],
      emitters: [{ r: 3, c: 1, dx: 1, dy: 0, color: "#ffffff" }],
      prisms: [{ r: 3, c: 4 }],
      mirrors: [
        { r: 1, c: 4, type: '\\' },
        { r: 5, c: 4, type: '/' },
        { r: 1, c: 9, type: '/' },
        { r: 5, c: 9, type: '\\' }
      ],
      targets: [
        { r: 2, c: 9, requiredColor: "#00f5d4" },
        { r: 4, c: 9, requiredColor: "#f72585" }
      ],
      stars: [{ r: 1, c: 6 }, { r: 5, c: 6 }]
    }
  ];

  // ==========================================================================
  // 3. STORAGE & PROGRESS MANAGER
  // ==========================================================================
  class ProgressManager {
    constructor() {
      this.key = 'prism_laser_progress_v1';
      this.data = this.load();
    }

    load() {
      try {
        const raw = localStorage.getItem(this.key);
        if (raw) return JSON.parse(raw);
      } catch (e) {
        console.warn('Failed to load progress', e);
      }
      return {
        unlocked: 1,
        levels: {} // { [lvlId]: { bestMoves, stars: 1-3, cleared: true } }
      };
    }

    save() {
      try {
        localStorage.setItem(this.key, JSON.stringify(this.data));
      } catch (e) {
        console.warn('Failed to save progress', e);
      }
    }

    recordWin(levelId, moves, par, starsCount) {
      if (!this.data.levels[levelId]) {
        this.data.levels[levelId] = { bestMoves: moves, stars: starsCount, cleared: true };
      } else {
        const prev = this.data.levels[levelId];
        prev.bestMoves = Math.min(prev.bestMoves || moves, moves);
        prev.stars = Math.max(prev.stars || 0, starsCount);
        prev.cleared = true;
      }

      if (levelId === this.data.unlocked && levelId < LEVELS.length) {
        this.data.unlocked = levelId + 1;
      }
      this.save();
    }

    isUnlocked(levelId) {
      return levelId <= (this.data.unlocked || 1);
    }

    getLevelData(levelId) {
      return this.data.levels[levelId] || null;
    }

    getTotalStats() {
      let cleared = 0;
      let stars = 0;
      Object.keys(this.data.levels).forEach(id => {
        const item = this.data.levels[id];
        if (item.cleared) cleared++;
        stars += item.stars || 0;
      });
      return { cleared, stars };
    }

    unlockAll() {
      this.data.unlocked = LEVELS.length;
      for (let i = 1; i <= LEVELS.length; i++) {
        if (!this.data.levels[i]) {
          this.data.levels[i] = { bestMoves: 1, stars: 3, cleared: true };
        }
      }
      this.save();
    }
  }

  // ==========================================================================
  // 4. MAIN GAME ENGINE
  // ==========================================================================
  class PrismLaserGame {
    constructor() {
      this.audio = new WebAudioEngine();
      this.progress = new ProgressManager();

      this.canvas = document.getElementById('gameCanvas');
      this.ctx = this.canvas.getContext('2d');

      // State
      this.state = 'MENU'; // 'MENU' | 'PLAYING' | 'PAUSED' | 'WIN'
      this.currentLevelIndex = 0;
      this.currentLevel = null;
      this.mirrors = []; // current level mirrors with angle animation
      this.movesCount = 0;
      this.startTime = 0;
      this.elapsedTime = 0;
      this.timerInterval = null;
      this.starsCollected = new Set();
      this.isLevelSolved = false;
      this.solveDelayTimer = null;

      // Rendering properties
      this.dpr = window.devicePixelRatio || 1;
      this.gridOffsetX = 0;
      this.gridOffsetY = 0;
      this.cellSize = 48;
      this.particles = [];
      this.photons = [];
      this.animTime = 0;

      // Active ray segments for rendering
      this.laserRays = [];

      this.initDom();
      this.initEvents();
      this.resizeCanvas();
      this.updateMenuStats();
      this.renderLevelGrid();

      // Start animation loop
      requestAnimationFrame(t => this.gameLoop(t));
    }

    initDom() {
      // Detect if running inside iframe (editors or portal catalogs)
      try {
        if (window.self !== window.top) {
          const page = document.getElementById('game-page');
          if (page) page.classList.add('in-iframe');
        }
      } catch (e) {
        const page = document.getElementById('game-page');
        if (page) page.classList.add('in-iframe');
      }

      // DOM Elements
      this.dom = {
        page: document.getElementById('game-page'),
        container: document.getElementById('game-container'),
        hud: document.getElementById('hud'),
        tutorialBanner: document.getElementById('tutorialBanner'),
        tutorialText: document.getElementById('tutorialText'),
        hudLevelBadge: document.getElementById('hudLevelBadge'),
        hudLevelName: document.getElementById('hudLevelName'),
        hudMoves: document.getElementById('hudMoves'),
        hudPar: document.getElementById('hudPar'),
        hudTimer: document.getElementById('hudTimer'),
        hudStars: document.querySelectorAll('#hudStars .hud-star'),

        screenMainMenu: document.getElementById('screenMainMenu'),
        screenLevelSelect: document.getElementById('screenLevelSelect'),
        screenHowToPlay: document.getElementById('screenHowToPlay'),
        screenPause: document.getElementById('screenPause'),
        screenWin: document.getElementById('screenWin'),
        screenExitConfirm: document.getElementById('screenExitConfirm'),

        // Buttons
        btnPlay: document.getElementById('btnPlay'),
        btnLevelSelect: document.getElementById('btnLevelSelect'),
        btnHowToPlay: document.getElementById('btnHowToPlay'),
        btnMainBack: document.getElementById('btnMainBack'),
        btnHudBack: document.getElementById('btnHudBack'),
        btnSoundToggle: document.getElementById('btnSoundToggle'),
        btnSoundMenu: document.getElementById('btnSoundMenu'),
        soundMenuIcon: document.getElementById('soundMenuIcon'),
        btnRestart: document.getElementById('btnRestart'),
        btnPause: document.getElementById('btnPause'),
        btnResume: document.getElementById('btnResume'),
        btnPauseRestart: document.getElementById('btnPauseRestart'),
        btnPauseSelect: document.getElementById('btnPauseSelect'),
        btnPauseQuit: document.getElementById('btnPauseQuit'),
        btnSelectBack: document.getElementById('btnSelectBack'),
        btnHelpBack: document.getElementById('btnHelpBack'),
        btnHelpGotIt: document.getElementById('btnHelpGotIt'),
        btnNextLevel: document.getElementById('btnNextLevel'),
        btnReplayLevel: document.getElementById('btnReplayLevel'),
        btnWinMenu: document.getElementById('btnWinMenu'),
        btnConfirmExit: document.getElementById('btnConfirmExit'),
        btnCancelExit: document.getElementById('btnCancelExit'),
        btnFullscreen: document.getElementById('btnFullscreen'),
        btnDismissTutorial: document.getElementById('btnDismissTutorial'),

        // Stats
        statLevelsDone: document.getElementById('statLevelsDone'),
        statStarsCollected: document.getElementById('statStarsCollected'),
        levelGrid: document.getElementById('levelGrid'),

        // Win modal fields
        winLevelName: document.getElementById('winLevelName'),
        winMoves: document.getElementById('winMoves'),
        winParText: document.getElementById('winParText'),
        winTime: document.getElementById('winTime'),
        winStarsCount: document.getElementById('winStarsCount'),
        winStars: document.querySelectorAll('#winStarsContainer .win-star')
      };

      this.updateSoundIcons();
    }

    initEvents() {
      window.addEventListener('resize', () => this.resizeCanvas());

      // Fullscreen button
      if (this.dom.btnFullscreen) {
        this.dom.btnFullscreen.addEventListener('click', () => this.toggleFullscreen());
      }

      // Sound toggle
      const handleSound = () => {
        const muted = this.audio.toggleMute();
        this.updateSoundIcons();
        if (!muted) this.audio.playTap();
      };
      if (this.dom.btnSoundToggle) this.dom.btnSoundToggle.addEventListener('click', handleSound);
      if (this.dom.btnSoundMenu) this.dom.btnSoundMenu.addEventListener('click', handleSound);

      // Dismiss tutorial banner
      if (this.dom.btnDismissTutorial) {
        this.dom.btnDismissTutorial.addEventListener('click', (e) => {
          e.stopPropagation();
          this.dom.tutorialBanner.classList.add('hidden');
        });
      }
      if (this.dom.tutorialBanner) {
        this.dom.tutorialBanner.addEventListener('click', () => {
          this.dom.tutorialBanner.classList.add('hidden');
        });
      }

      // Play button
      this.dom.btnPlay.addEventListener('click', () => {
        this.audio.playTap();
        const startLvl = this.progress.data.unlocked || 1;
        this.loadLevel(startLvl - 1);
      });

      // Level select
      this.dom.btnLevelSelect.addEventListener('click', () => {
        this.audio.playTap();
        this.showScreen(this.dom.screenLevelSelect);
        this.renderLevelGrid();
      });

      this.dom.btnSelectBack.addEventListener('click', () => {
        this.audio.playTap();
        this.showScreen(this.dom.screenMainMenu);
        this.updateMenuStats();
      });

      // How to Play
      this.dom.btnHowToPlay.addEventListener('click', () => {
        this.audio.playTap();
        this.showScreen(this.dom.screenHowToPlay);
      });

      this.dom.btnHelpBack.addEventListener('click', () => {
        this.audio.playTap();
        this.showScreen(this.dom.screenMainMenu);
      });

      this.dom.btnHelpGotIt.addEventListener('click', () => {
        this.audio.playTap();
        this.showScreen(this.dom.screenMainMenu);
      });

      // Back buttons -> Exit Confirmation Modal
      const promptExit = () => {
        this.audio.playTap();
        this.dom.screenExitConfirm.classList.remove('hidden');
      };

      this.dom.btnMainBack.addEventListener('click', promptExit);
      this.dom.btnHudBack.addEventListener('click', promptExit);

      this.dom.btnCancelExit.addEventListener('click', () => {
        this.audio.playTap();
        this.dom.screenExitConfirm.classList.add('hidden');
      });

      this.dom.btnConfirmExit.addEventListener('click', () => {
        this.audio.playTap();
        this.executeExit();
      });

      // In-game controls
      this.dom.btnRestart.addEventListener('click', () => {
        this.audio.playTap();
        this.loadLevel(this.currentLevelIndex);
      });

      this.dom.btnPause.addEventListener('click', () => {
        this.audio.playTap();
        this.pauseGame();
      });

      this.dom.btnResume.addEventListener('click', () => {
        this.audio.playTap();
        this.resumeGame();
      });

      this.dom.btnPauseRestart.addEventListener('click', () => {
        this.audio.playTap();
        this.dom.screenPause.classList.add('hidden');
        this.loadLevel(this.currentLevelIndex);
      });

      this.dom.btnPauseSelect.addEventListener('click', () => {
        this.audio.playTap();
        this.dom.screenPause.classList.add('hidden');
        this.dom.hud.classList.add('hidden');
        this.state = 'MENU';
        this.showScreen(this.dom.screenLevelSelect);
        this.renderLevelGrid();
      });

      this.dom.btnPauseQuit.addEventListener('click', () => {
        this.audio.playTap();
        this.dom.screenPause.classList.add('hidden');
        this.dom.hud.classList.add('hidden');
        this.state = 'MENU';
        this.showScreen(this.dom.screenMainMenu);
        this.updateMenuStats();
      });

      // Win modal buttons
      this.dom.btnNextLevel.addEventListener('click', () => {
        this.audio.playTap();
        this.dom.screenWin.classList.add('hidden');
        if (this.currentLevelIndex + 1 < LEVELS.length) {
          this.loadLevel(this.currentLevelIndex + 1);
        } else {
          this.showScreen(this.dom.screenMainMenu);
          this.updateMenuStats();
        }
      });

      this.dom.btnReplayLevel.addEventListener('click', () => {
        this.audio.playTap();
        this.dom.screenWin.classList.add('hidden');
        this.loadLevel(this.currentLevelIndex);
      });

      this.dom.btnWinMenu.addEventListener('click', () => {
        this.audio.playTap();
        this.dom.screenWin.classList.add('hidden');
        this.dom.hud.classList.add('hidden');
        this.state = 'MENU';
        this.showScreen(this.dom.screenMainMenu);
        this.updateMenuStats();
      });

      // Canvas Interaction: Tap or Click to rotate mirrors
      const handlePointer = (clientX, clientY) => {
        if (this.state !== 'PLAYING' || this.isLevelSolved) return;
        const rect = this.canvas.getBoundingClientRect();
        const px = clientX - rect.left;
        const py = clientY - rect.top;

        // Check which mirror was tapped
        for (let i = 0; i < this.mirrors.length; i++) {
          const m = this.mirrors[i];
          const mx = this.gridOffsetX + m.c * this.cellSize + this.cellSize / 2;
          const my = this.gridOffsetY + m.r * this.cellSize + this.cellSize / 2;
          const dist = Math.hypot(px - mx, py - my);

          if (dist < this.cellSize * 0.6) {
            this.rotateMirror(i);
            break;
          }
        }
      };

      this.canvas.addEventListener('pointerdown', (e) => {
        handlePointer(e.clientX, e.clientY);
      });

      // Keyboard Controls
      window.addEventListener('keydown', (e) => {
        if (e.key === 'r' || e.key === 'R') {
          if (this.state === 'PLAYING') {
            this.audio.playTap();
            this.loadLevel(this.currentLevelIndex);
          }
        } else if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
          if (this.state === 'PLAYING') {
            this.pauseGame();
          } else if (this.state === 'PAUSED') {
            this.resumeGame();
          }
        }
      });

      // Cheats for grading & testing in console
      window.solveLevel = (lvlId) => {
        const id = lvlId !== undefined ? lvlId : (this.currentLevelIndex + 1);
        const lvl = LEVELS[id - 1];
        if (!lvl) return console.log('Level not found');
        const sol = this.computeSolution(lvl);
        if (sol) {
          console.log(`Solution for Level ${id}:`, sol);
          if (this.currentLevelIndex === id - 1 && this.state === 'PLAYING') {
            this.mirrors.forEach((m, i) => {
              if (sol[i] && m.type !== sol[i]) {
                this.rotateMirror(i, true);
              }
            });
          }
        } else {
          console.log('No solution found');
        }
      };

      window.verifyAllLevels = () => {
        console.log('--- VERIFYING ALL 12 LEVELS ---');
        let ok = true;
        LEVELS.forEach(l => {
          const s = this.computeSolution(l);
          if (s) console.log(`✅ Level ${l.id} "${l.name}": Solved!`, s);
          else { console.log(`❌ Level ${l.id} "${l.name}": FAILED!`); ok = false; }
        });
        console.log('Overall verification:', ok ? '100% SOLVED!' : 'FAILED');
      };

      window.unlockAllLevels = () => {
        this.progress.unlockAll();
        this.renderLevelGrid();
        this.updateMenuStats();
        console.log('All 12 levels unlocked!');
      };
    }

    updateSoundIcons() {
      const isMuted = this.audio.isMuted;
      const icon = isMuted ? '🔇' : '🔊';
      if (this.dom.btnSoundToggle) {
        this.dom.btnSoundToggle.querySelector('.sound-icon').textContent = icon;
      }
      if (this.dom.soundMenuIcon) {
        this.dom.soundMenuIcon.textContent = icon;
      }
    }

    executeExit() {
      // 1. Post message to potential parent portal / iframe
      try {
        if (window.parent && window.parent !== window) {
          window.parent.postMessage({ type: 'closeModal', action: 'exitGame' }, '*');
        }
      } catch (e) {
        console.warn(e);
      }

      // 2. Try window.close()
      try {
        window.close();
      } catch (e) {}

      // 3. Fallback to portal navigation
      setTimeout(() => {
        try {
          window.location.href = '../';
        } catch (e) {
          window.location.reload();
        }
      }, 100);
    }

    toggleFullscreen() {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else {
        if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
      }
    }

    showScreen(screenEl) {
      const screens = [
        this.dom.screenMainMenu,
        this.dom.screenLevelSelect,
        this.dom.screenHowToPlay,
        this.dom.screenPause,
        this.dom.screenWin,
        this.dom.screenExitConfirm
      ];
      screens.forEach(s => {
        if (s) s.classList.add('hidden');
      });
      if (screenEl) screenEl.classList.remove('hidden');
    }

    updateMenuStats() {
      const stats = this.progress.getTotalStats();
      this.dom.statLevelsDone.textContent = `${stats.cleared} / ${LEVELS.length}`;
      this.dom.statStarsCollected.textContent = `${stats.stars} / ${LEVELS.length * 3}`;
    }

    renderLevelGrid() {
      const container = this.dom.levelGrid;
      container.innerHTML = '';

      LEVELS.forEach((lvl, idx) => {
        const btn = document.createElement('button');
        btn.className = 'level-card-btn';
        const isUnlocked = this.progress.isUnlocked(lvl.id);
        const data = this.progress.getLevelData(lvl.id);

        if (!isUnlocked) {
          btn.classList.add('locked');
        }
        if (idx === this.currentLevelIndex) {
          btn.classList.add('current');
        }

        const numSpan = document.createElement('span');
        numSpan.className = 'level-num';
        numSpan.textContent = lvl.id;
        btn.appendChild(numSpan);

        // Stars mini indicator
        const starsWrap = document.createElement('div');
        starsWrap.className = 'level-stars-mini';
        const starsEarned = data ? (data.stars || 0) : 0;
        for (let s = 1; s <= 3; s++) {
          const starIcon = document.createElement('span');
          starIcon.textContent = '★';
          if (s <= starsEarned) starIcon.className = 'active';
          starsWrap.appendChild(starIcon);
        }
        btn.appendChild(starsWrap);

        if (isUnlocked) {
          btn.addEventListener('click', () => {
            this.audio.playTap();
            this.loadLevel(idx);
          });
        }

        container.appendChild(btn);
      });
    }

    resizeCanvas() {
      const rect = this.dom.container.getBoundingClientRect();
      const w = Math.floor(rect.width);
      const h = Math.floor(rect.height);

      this.canvas.width = w * this.dpr;
      this.canvas.height = h * this.dpr;
      this.canvas.style.width = `${w}px`;
      this.canvas.style.height = `${h}px`;

      this.ctx.setTransform(1, 0, 0, 1, 0, 0);
      this.ctx.scale(this.dpr, this.dpr);

      this.calcGridLayout(w, h);
    }

    calcGridLayout(w, h) {
      if (!this.currentLevel) return;
      const rows = this.currentLevel.grid.length;
      const cols = this.currentLevel.grid[0].length;

      // Available area inside container leaving room for HUD (top ~90px, bottom ~60px)
      const availW = w - 24;
      const availH = h - 170;

      const sizeW = Math.floor(availW / cols);
      const sizeH = Math.floor(availH / rows);
      this.cellSize = Math.min(sizeW, sizeH, 56);

      this.gridOffsetX = Math.floor((w - cols * this.cellSize) / 2);
      this.gridOffsetY = Math.floor(95 + (availH - rows * this.cellSize) / 2);
    }

    loadLevel(index) {
      if (index < 0 || index >= LEVELS.length) index = 0;
      this.currentLevelIndex = index;
      const raw = LEVELS[index];

      // Deep clone level
      this.currentLevel = {
        ...raw,
        grid: [...raw.grid],
        emitters: raw.emitters.map(e => ({ ...e })),
        targets: raw.targets.map(t => ({ ...t, powered: false, chargeProgress: 0 })),
        prisms: raw.prisms ? raw.prisms.map(p => ({ ...p })) : [],
        portals: raw.portals ? raw.portals.map(p => ({ ...p })) : [],
        filters: raw.filters ? raw.filters.map(f => ({ ...f })) : [],
        stars: raw.stars ? raw.stars.map(s => ({ ...s, collected: false })) : []
      };

      // Clone mirrors with smooth rotation angles
      this.mirrors = raw.mirrors.map((m) => {
        const isSlash = m.type === '/';
        const targetAngle = isSlash ? Math.PI / 4 : -Math.PI / 4;
        return {
          ...m,
          currentAngle: targetAngle,
          targetAngle: targetAngle,
          rotProgress: 1
        };
      });

      this.movesCount = 0;
      this.startTime = Date.now();
      this.elapsedTime = 0;
      this.starsCollected.clear();
      this.isLevelSolved = false;
      if (this.solveDelayTimer) clearTimeout(this.solveDelayTimer);

      this.state = 'PLAYING';
      this.showScreen(null); // hide overlays
      this.dom.hud.classList.remove('hidden');

      // Update HUD
      this.dom.hudLevelBadge.textContent = `LEVEL ${this.currentLevel.id}`;
      this.dom.hudLevelName.textContent = this.currentLevel.name;
      this.dom.hudMoves.textContent = '0';
      this.dom.hudPar.textContent = `/ Par ${this.currentLevel.par}`;
      this.dom.hudTimer.textContent = '00:00';

      if (this.currentLevel.tutorial) {
        this.dom.tutorialText.textContent = this.currentLevel.tutorial;
        this.dom.tutorialBanner.classList.remove('hidden');
      } else {
        this.dom.tutorialBanner.classList.add('hidden');
      }

      this.updateHudStars();
      this.resizeCanvas();
      this.recalculateOptics();

      // Start timer
      if (this.timerInterval) clearInterval(this.timerInterval);
      this.timerInterval = setInterval(() => {
        if (this.state === 'PLAYING') {
          this.elapsedTime = Math.floor((Date.now() - this.startTime) / 1000);
          const mins = String(Math.floor(this.elapsedTime / 60)).padStart(2, '0');
          const secs = String(this.elapsedTime % 60).padStart(2, '0');
          this.dom.hudTimer.textContent = `${mins}:${secs}`;
        }
      }, 1000);
    }

    rotateMirror(mirrorIndex, silent = false) {
      if (mirrorIndex < 0 || mirrorIndex >= this.mirrors.length) return;
      const m = this.mirrors[mirrorIndex];

      // Toggle between '/' and '\'
      m.type = m.type === '/' ? '\\' : '/';
      m.targetAngle += Math.PI / 2;
      m.rotProgress = 0;

      if (!silent) {
        this.movesCount++;
        this.dom.hudMoves.textContent = this.movesCount;
        this.audio.playMirrorClick();
      }

      // Auto-hide tutorial banner once player makes a move
      if (this.dom.tutorialBanner && !this.dom.tutorialBanner.classList.contains('hidden')) {
        this.dom.tutorialBanner.classList.add('hidden');
      }

      this.createMirrorSparks(m.c, m.r);
      this.recalculateOptics();
    }

    recalculateOptics() {
      if (!this.currentLevel) return;

      const rows = this.currentLevel.grid.length;
      const cols = this.currentLevel.grid[0].length;
      const maxBounces = 35;

      this.currentLevel.targets.forEach(t => (t.powered = false));
      this.laserRays = [];

      const queue = [];
      this.currentLevel.emitters.forEach(e => {
        queue.push({
          x: e.c,
          y: e.r,
          dx: e.dx,
          dy: e.dy,
          color: e.color || '#00f5d4',
          bounces: 0
        });
      });

      while (queue.length > 0) {
        const ray = queue.shift();
        if (ray.bounces > maxBounces) continue;

        let cx = ray.x;
        let cy = ray.y;
        let terminated = false;
        const segmentStart = { x: cx, y: cy };

        while (!terminated) {
          const nx = cx + ray.dx;
          const ny = cy + ray.dy;

          if (nx < 0 || nx >= cols || ny < 0 || ny >= rows) {
            this.laserRays.push({
              x1: segmentStart.x,
              y1: segmentStart.y,
              x2: cx + ray.dx * 0.5,
              y2: cy + ray.dy * 0.5,
              color: ray.color
            });
            break;
          }

          cx = nx;
          cy = ny;

          // Check stars along the path
          if (this.currentLevel.stars) {
            const star = this.currentLevel.stars.find(s => s.r === cy && s.c === cx);
            if (star && !star.collected) {
              star.collected = true;
              this.starsCollected.add(`${cy},${cx}`);
              this.audio.playStarChime();
              this.createStarBurst(cx, cy);
              this.updateHudStars();
            }
          }

          // Check walls
          if (this.currentLevel.grid[cy][cx] === '#') {
            this.laserRays.push({
              x1: segmentStart.x,
              y1: segmentStart.y,
              x2: cx - ray.dx * 0.45,
              y2: cy - ray.dy * 0.45,
              color: ray.color
            });
            this.createWallSparks(cx - ray.dx * 0.45, cy - ray.dy * 0.45, ray.color);
            terminated = true;
            break;
          }

          // Check targets
          const target = this.currentLevel.targets.find(t => t.r === cy && t.c === cx);
          if (target) {
            if (!target.requiredColor || target.requiredColor === ray.color) {
              target.powered = true;
            }
            this.laserRays.push({
              x1: segmentStart.x,
              y1: segmentStart.y,
              x2: cx,
              y2: cy,
              color: ray.color
            });
            this.createTargetSparks(cx, cy, ray.color);
            terminated = true;
            break;
          }

          // Check mirrors
          const mirror = this.mirrors.find(m => m.r === cy && m.c === cx);
          if (mirror) {
            this.laserRays.push({
              x1: segmentStart.x,
              y1: segmentStart.y,
              x2: cx,
              y2: cy,
              color: ray.color
            });

            let ndx = 0;
            let ndy = 0;
            if (mirror.type === '/') {
              ndx = -ray.dy;
              ndy = -ray.dx;
            } else if (mirror.type === '\\') {
              ndx = ray.dy;
              ndy = ray.dx;
            }

            if (ndx !== 0 || ndy !== 0) {
              queue.push({
                x: cx,
                y: cy,
                dx: ndx,
                dy: ndy,
                color: ray.color,
                bounces: ray.bounces + 1
              });
            }
            terminated = true;
            break;
          }

          // Check prisms
          const prism = this.currentLevel.prisms.find(p => p.r === cy && p.c === cx);
          if (prism) {
            this.laserRays.push({
              x1: segmentStart.x,
              y1: segmentStart.y,
              x2: cx,
              y2: cy,
              color: ray.color
            });

            this.audio.playPrismChime();
            this.createPrismSparks(cx, cy);

            if (ray.dx !== 0) {
              queue.push({ x: cx, y: cy, dx: 0, dy: -1, color: '#00f5d4', bounces: ray.bounces + 1 });
              queue.push({ x: cx, y: cy, dx: 0, dy: 1, color: '#f72585', bounces: ray.bounces + 1 });
            } else {
              queue.push({ x: cx, y: cy, dx: -1, dy: 0, color: '#00f5d4', bounces: ray.bounces + 1 });
              queue.push({ x: cx, y: cy, dx: 1, dy: 0, color: '#f72585', bounces: ray.bounces + 1 });
            }
            terminated = true;
            break;
          }

          // Check portals
          const portal = this.currentLevel.portals.find(p => p.r === cy && p.c === cx);
          if (portal) {
            this.laserRays.push({
              x1: segmentStart.x,
              y1: segmentStart.y,
              x2: cx,
              y2: cy,
              color: ray.color
            });

            const partner = this.currentLevel.portals.find(p => p.r !== cy || p.c !== cx);
            if (partner) {
              this.audio.playPortalWarp();
              this.createPortalSparks(partner.c, partner.r, ray.color);
              queue.push({
                x: partner.c,
                y: partner.r,
                dx: ray.dx,
                dy: ray.dy,
                color: ray.color,
                bounces: ray.bounces + 1
              });
            }
            terminated = true;
            break;
          }

          // Check filters
          const filter = this.currentLevel.filters.find(f => f.r === cy && f.c === cx);
          if (filter) {
            if (ray.color === filter.color || ray.color === '#ffffff') {
              ray.color = filter.color;
            } else {
              this.laserRays.push({
                x1: segmentStart.x,
                y1: segmentStart.y,
                x2: cx,
                y2: cy,
                color: ray.color
              });
              terminated = true;
              break;
            }
          }
        }
      }

      // Check win condition: ALL targets simultaneously powered
      const allPowered = this.currentLevel.targets.length > 0 && this.currentLevel.targets.every(t => t.powered);
      if (allPowered && !this.isLevelSolved) {
        this.isLevelSolved = true;
        this.audio.playTargetCharge();
        this.solveDelayTimer = setTimeout(() => {
          this.triggerWin();
        }, 500);
      }
    }

    updateHudStars() {
      const totalStars = this.currentLevel && this.currentLevel.stars ? this.currentLevel.stars.length : 0;
      const count = this.starsCollected.size;
      this.dom.hudStars.forEach((starEl, idx) => {
        if (idx < count) {
          starEl.classList.add('active');
        } else {
          starEl.classList.remove('active');
        }
      });
    }

    triggerWin() {
      this.state = 'WIN';
      if (this.timerInterval) clearInterval(this.timerInterval);
      this.audio.playVictory();

      // Par stars calculation:
      // 1 star: cleared level
      // 2 stars: collected all stars or within par
      // 3 stars: collected all stars AND within par
      let starScore = 1;
      const totalStarsOnMap = this.currentLevel.stars ? this.currentLevel.stars.length : 0;
      const collectedAllStars = this.starsCollected.size >= totalStarsOnMap;
      const withinPar = this.movesCount <= this.currentLevel.par;

      if (collectedAllStars && withinPar) {
        starScore = 3;
      } else if (collectedAllStars || withinPar) {
        starScore = 2;
      }

      this.progress.recordWin(this.currentLevel.id, this.movesCount, this.currentLevel.par, starScore);

      // Populate Win Modal
      this.dom.winLevelName.textContent = this.currentLevel.name;
      this.dom.winMoves.textContent = this.movesCount;
      this.dom.winParText.textContent = `Par: ${this.currentLevel.par}`;
      const mins = String(Math.floor(this.elapsedTime / 60)).padStart(2, '0');
      const secs = String(this.elapsedTime % 60).padStart(2, '0');
      this.dom.winTime.textContent = `${mins}:${secs}`;
      this.dom.winStarsCount.textContent = `${this.starsCollected.size} / ${totalStarsOnMap}`;

      this.dom.winStars.forEach((sEl, i) => {
        if (i < starScore) {
          setTimeout(() => sEl.classList.add('active'), i * 200 + 100);
        } else {
          sEl.classList.remove('active');
        }
      });

      this.dom.hud.classList.add('hidden');
      this.showScreen(this.dom.screenWin);
    }

    pauseGame() {
      if (this.state !== 'PLAYING') return;
      this.state = 'PAUSED';
      document.getElementById('pauseLevelLabel').textContent = `Level ${this.currentLevel.id}: ${this.currentLevel.name}`;
      this.showScreen(this.dom.screenPause);
    }

    resumeGame() {
      if (this.state !== 'PAUSED') return;
      this.state = 'PLAYING';
      this.showScreen(null);
      this.dom.hud.classList.remove('hidden');
    }

    // Solver logic for window.solveLevel() testing helper
    computeSolution(level) {
      const n = level.mirrors ? level.mirrors.length : 0;
      const total = 1 << n;
      for (let mask = 0; mask < total; mask++) {
        const overrides = {};
        for (let i = 0; i < n; i++) {
          overrides[i] = (mask & (1 << i)) ? '/' : '\\';
        }
        if (this.testTrace(level, overrides)) {
          return overrides;
        }
      }
      return null;
    }

    testTrace(level, overrides) {
      const rows = level.grid.length;
      const cols = level.grid[0].length;
      const targets = level.targets.map(t => ({ ...t, powered: false }));
      const queue = [];
      level.emitters.forEach(e => {
        queue.push({ x: e.c, y: e.r, dx: e.dx, dy: e.dy, color: e.color || '#00f5d4', b: 0 });
      });

      const activeMirrors = level.mirrors.map((m, idx) => ({
        ...m,
        type: overrides[idx] !== undefined ? overrides[idx] : m.type
      }));

      while (queue.length > 0) {
        const ray = queue.shift();
        if (ray.b > 35) continue;
        let cx = ray.x;
        let cy = ray.y;
        while (true) {
          cx += ray.dx;
          cy += ray.dy;
          if (cx < 0 || cx >= cols || cy < 0 || cy >= rows) break;
          if (level.grid[cy][cx] === '#') break;

          const t = targets.find(t => t.r === cy && t.c === cx);
          if (t) {
            if (!t.requiredColor || t.requiredColor === ray.color) t.powered = true;
            break;
          }

          const m = activeMirrors.find(m => m.r === cy && m.c === cx);
          if (m) {
            let ndx = m.type === '/' ? -ray.dy : ray.dy;
            let ndy = m.type === '/' ? -ray.dx : ray.dx;
            if (ndx !== 0 || ndy !== 0) {
              queue.push({ x: cx, y: cy, dx: ndx, dy: ndy, color: ray.color, b: ray.b + 1 });
            }
            break;
          }

          const p = level.prisms && level.prisms.find(p => p.r === cy && p.c === cx);
          if (p) {
            if (ray.dx !== 0) {
              queue.push({ x: cx, y: cy, dx: 0, dy: -1, color: '#00f5d4', b: ray.b + 1 });
              queue.push({ x: cx, y: cy, dx: 0, dy: 1, color: '#f72585', b: ray.b + 1 });
            } else {
              queue.push({ x: cx, y: cy, dx: -1, dy: 0, color: '#00f5d4', b: ray.b + 1 });
              queue.push({ x: cx, y: cy, dx: 1, dy: 0, color: '#f72585', b: ray.b + 1 });
            }
            break;
          }

          const portal = level.portals && level.portals.find(p => p.r === cy && p.c === cx);
          if (portal) {
            const partner = level.portals.find(p => p.r !== cy || p.c !== cx);
            if (partner) {
              queue.push({ x: partner.c, y: partner.r, dx: ray.dx, dy: ray.dy, color: ray.color, b: ray.b + 1 });
            }
            break;
          }

          const filter = level.filters && level.filters.find(f => f.r === cy && f.c === cx);
          if (filter) {
            if (ray.color === filter.color || ray.color === '#ffffff') ray.color = filter.color;
            else break;
          }
        }
      }

      return targets.every(t => t.powered);
    }

    // ========================================================================
    // 5. PARTICLE EFFECTS
    // ========================================================================
    createMirrorSparks(c, r) {
      const cx = this.gridOffsetX + c * this.cellSize + this.cellSize / 2;
      const cy = this.gridOffsetY + r * this.cellSize + this.cellSize / 2;
      for (let i = 0; i < 14; i++) {
        const ang = Math.random() * Math.PI * 2;
        const spd = 1.5 + Math.random() * 3.5;
        this.particles.push({
          x: cx,
          y: cy,
          vx: Math.cos(ang) * spd,
          vy: Math.sin(ang) * spd,
          life: 1,
          decay: 0.04 + Math.random() * 0.03,
          color: '#ffffff',
          size: 2 + Math.random() * 2.5
        });
      }
    }

    createStarBurst(c, r) {
      const cx = this.gridOffsetX + c * this.cellSize + this.cellSize / 2;
      const cy = this.gridOffsetY + r * this.cellSize + this.cellSize / 2;
      for (let i = 0; i < 20; i++) {
        const ang = Math.random() * Math.PI * 2;
        const spd = 2 + Math.random() * 4;
        this.particles.push({
          x: cx,
          y: cy,
          vx: Math.cos(ang) * spd,
          vy: Math.sin(ang) * spd,
          life: 1,
          decay: 0.03 + Math.random() * 0.02,
          color: '#ffd166',
          size: 2.5 + Math.random() * 3
        });
      }
    }

    createPrismSparks(c, r) {
      if (Math.random() > 0.4) return;
      const cx = this.gridOffsetX + c * this.cellSize + this.cellSize / 2;
      const cy = this.gridOffsetY + r * this.cellSize + this.cellSize / 2;
      const color = Math.random() > 0.5 ? '#00f5d4' : '#f72585';
      this.particles.push({
        x: cx + (Math.random() - 0.5) * 16,
        y: cy + (Math.random() - 0.5) * 16,
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5,
        life: 0.8,
        decay: 0.05,
        color: color,
        size: 2
      });
    }

    createPortalSparks(c, r, color) {
      const cx = this.gridOffsetX + c * this.cellSize + this.cellSize / 2;
      const cy = this.gridOffsetY + r * this.cellSize + this.cellSize / 2;
      for (let i = 0; i < 5; i++) {
        const ang = Math.random() * Math.PI * 2;
        const dist = 12 + Math.random() * 8;
        this.particles.push({
          x: cx + Math.cos(ang) * dist,
          y: cy + Math.sin(ang) * dist,
          vx: -Math.cos(ang) * 1.2,
          vy: -Math.sin(ang) * 1.2,
          life: 0.7,
          decay: 0.04,
          color: color || '#4cc9f0',
          size: 2
        });
      }
    }

    createWallSparks(gx, gy, color) {
      if (Math.random() > 0.3) return;
      const cx = this.gridOffsetX + gx * this.cellSize + this.cellSize / 2;
      const cy = this.gridOffsetY + gy * this.cellSize + this.cellSize / 2;
      this.particles.push({
        x: cx + (Math.random() - 0.5) * 6,
        y: cy + (Math.random() - 0.5) * 6,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        life: 0.6,
        decay: 0.08,
        color: color,
        size: 1.5
      });
    }

    createTargetSparks(c, r, color) {
      if (Math.random() > 0.35) return;
      const cx = this.gridOffsetX + c * this.cellSize + this.cellSize / 2;
      const cy = this.gridOffsetY + r * this.cellSize + this.cellSize / 2;
      const ang = Math.random() * Math.PI * 2;
      this.particles.push({
        x: cx + Math.cos(ang) * 10,
        y: cy + Math.sin(ang) * 10,
        vx: Math.cos(ang) * 1.5,
        vy: Math.sin(ang) * 1.5,
        life: 0.7,
        decay: 0.05,
        color: color,
        size: 2
      });
    }

    // ========================================================================
    // 6. RENDER LOOP
    // ========================================================================
    gameLoop(timestamp) {
      this.animTime = timestamp * 0.001;

      // Update mirror rotation interpolations
      if (this.mirrors) {
        this.mirrors.forEach(m => {
          if (m.rotProgress < 1) {
            m.rotProgress += 0.15;
            if (m.rotProgress > 1) m.rotProgress = 1;
            m.currentAngle = m.currentAngle + (m.targetAngle - m.currentAngle) * 0.25;
          }
        });
      }

      // Update particles
      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= p.decay;
        if (p.life <= 0) {
          this.particles.splice(i, 1);
        }
      }

      // Clear Canvas
      const w = this.canvas.width / this.dpr;
      const h = this.canvas.height / this.dpr;
      this.ctx.clearRect(0, 0, w, h);

      // Render scene
      this.renderBackground(w, h);

      if (this.currentLevel && (this.state === 'PLAYING' || this.state === 'PAUSED' || this.state === 'WIN')) {
        this.renderGrid(w, h);
        this.renderElements();
        this.renderLaserBeams();
        this.renderParticles();
      }

      requestAnimationFrame(t => this.gameLoop(t));
    }

    renderBackground(w, h) {
      // Tech workbench background with circuit grid
      const bgGrad = this.ctx.createRadialGradient(w / 2, h / 2, 50, w / 2, h / 2, Math.max(w, h));
      bgGrad.addColorStop(0, '#0c101d');
      bgGrad.addColorStop(1, '#030408');
      this.ctx.fillStyle = bgGrad;
      this.ctx.fillRect(0, 0, w, h);

      // Subtle isometric background grid dots
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
      const step = 28;
      for (let x = step / 2; x < w; x += step) {
        for (let y = step / 2; y < h; y += step) {
          this.ctx.fillRect(x, y, 1.5, 1.5);
        }
      }
    }

    renderGrid(w, h) {
      const rows = this.currentLevel.grid.length;
      const cols = this.currentLevel.grid[0].length;
      const cs = this.cellSize;
      const ox = this.gridOffsetX;
      const oy = this.gridOffsetY;

      // Board container shadow & glass bevel
      this.ctx.save();
      this.ctx.shadowColor = 'rgba(0, 245, 212, 0.15)';
      this.ctx.shadowBlur = 24;
      this.ctx.fillStyle = 'rgba(10, 15, 26, 0.85)';
      this.ctx.beginPath();
      this.ctx.roundRect(ox - 8, oy - 8, cols * cs + 16, rows * cs + 16, 14);
      this.ctx.fill();

      this.ctx.strokeStyle = 'rgba(0, 245, 212, 0.25)';
      this.ctx.lineWidth = 1.5;
      this.ctx.stroke();
      this.ctx.restore();

      // Render cells
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const char = this.currentLevel.grid[r][c];
          const x = ox + c * cs;
          const y = oy + r * cs;

          if (char === '#') {
            // High-tech wall block
            this.ctx.fillStyle = '#161b2c';
            this.ctx.beginPath();
            this.ctx.roundRect(x + 2, y + 2, cs - 4, cs - 4, 6);
            this.ctx.fill();

            // Wall border
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
            this.ctx.lineWidth = 1;
            this.ctx.stroke();

            // Circuit cross mark
            this.ctx.strokeStyle = 'rgba(0, 245, 212, 0.12)';
            this.ctx.lineWidth = 1.5;
            this.ctx.beginPath();
            this.ctx.moveTo(x + cs * 0.35, y + cs * 0.5);
            this.ctx.lineTo(x + cs * 0.65, y + cs * 0.5);
            this.ctx.moveTo(x + cs * 0.5, y + cs * 0.35);
            this.ctx.lineTo(x + cs * 0.5, y + cs * 0.65);
            this.ctx.stroke();
          } else {
            // Floor tile
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.015)';
            this.ctx.fillRect(x + 1, y + 1, cs - 2, cs - 2);

            // Subtle tile outline
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
            this.ctx.lineWidth = 0.5;
            this.ctx.strokeRect(x, y, cs, cs);
          }
        }
      }
    }

    renderElements() {
      const cs = this.cellSize;
      const ox = this.gridOffsetX;
      const oy = this.gridOffsetY;

      // 1. Render Portals
      if (this.currentLevel.portals) {
        this.currentLevel.portals.forEach(p => {
          const x = ox + p.c * cs + cs / 2;
          const y = oy + p.r * cs + cs / 2;
          const rad = cs * 0.38;

          this.ctx.save();
          this.ctx.translate(x, y);

          // Vortex swirl
          this.ctx.rotate(this.animTime * 2);
          const portalGrad = this.ctx.createRadialGradient(0, 0, 2, 0, 0, rad);
          portalGrad.addColorStop(0, '#ffffff');
          portalGrad.addColorStop(0.4, '#4cc9f0');
          portalGrad.addColorStop(0.8, '#7209b7');
          portalGrad.addColorStop(1, 'transparent');

          this.ctx.fillStyle = portalGrad;
          this.ctx.beginPath();
          this.ctx.arc(0, 0, rad, 0, Math.PI * 2);
          this.ctx.fill();

          // Outer pulsing ring
          this.ctx.strokeStyle = '#4cc9f0';
          this.ctx.lineWidth = 2;
          this.ctx.shadowColor = '#4cc9f0';
          this.ctx.shadowBlur = 10;
          this.ctx.beginPath();
          this.ctx.arc(0, 0, rad * (0.85 + Math.sin(this.animTime * 4) * 0.1), 0, Math.PI * 2);
          this.ctx.stroke();

          this.ctx.restore();
        });
      }

      // 2. Render Prisms
      if (this.currentLevel.prisms) {
        this.currentLevel.prisms.forEach(p => {
          const x = ox + p.c * cs + cs / 2;
          const y = oy + p.r * cs + cs / 2;
          const s = cs * 0.42;

          this.ctx.save();
          this.ctx.translate(x, y);

          // Prism pedestal glow
          this.ctx.shadowColor = 'rgba(255, 255, 255, 0.6)';
          this.ctx.shadowBlur = 14;

          // Triangular glass prism
          this.ctx.beginPath();
          this.ctx.moveTo(0, -s);
          this.ctx.lineTo(s * 0.95, s * 0.7);
          this.ctx.lineTo(-s * 0.95, s * 0.7);
          this.ctx.closePath();

          const prismGrad = this.ctx.createLinearGradient(-s, -s, s, s);
          prismGrad.addColorStop(0, 'rgba(255, 255, 255, 0.85)');
          prismGrad.addColorStop(0.5, 'rgba(0, 245, 212, 0.4)');
          prismGrad.addColorStop(1, 'rgba(247, 37, 133, 0.4)');
          this.ctx.fillStyle = prismGrad;
          this.ctx.fill();

          this.ctx.strokeStyle = '#ffffff';
          this.ctx.lineWidth = 2;
          this.ctx.stroke();

          // Prism inner reflection facets
          this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
          this.ctx.lineWidth = 1;
          this.ctx.beginPath();
          this.ctx.moveTo(0, -s);
          this.ctx.lineTo(0, s * 0.7);
          this.ctx.stroke();

          this.ctx.restore();
        });
      }

      // 3. Render Filters
      if (this.currentLevel.filters) {
        this.currentLevel.filters.forEach(f => {
          const x = ox + f.c * cs;
          const y = oy + f.r * cs;

          this.ctx.save();
          this.ctx.fillStyle = f.color === '#00f5d4' ? 'rgba(0, 245, 212, 0.25)' : 'rgba(247, 37, 133, 0.25)';
          this.ctx.fillRect(x + cs * 0.2, y + cs * 0.2, cs * 0.6, cs * 0.6);

          this.ctx.strokeStyle = f.color;
          this.ctx.lineWidth = 2;
          this.ctx.shadowColor = f.color;
          this.ctx.shadowBlur = 8;
          this.ctx.strokeRect(x + cs * 0.2, y + cs * 0.2, cs * 0.6, cs * 0.6);

          // Filter line bar
          this.ctx.beginPath();
          this.ctx.moveTo(x + cs * 0.5, y + cs * 0.2);
          this.ctx.lineTo(x + cs * 0.5, y + cs * 0.8);
          this.ctx.stroke();

          this.ctx.restore();
        });
      }

      // 4. Render Stars
      if (this.currentLevel.stars) {
        this.currentLevel.stars.forEach(st => {
          if (st.collected) return;
          const x = ox + st.c * cs + cs / 2;
          const y = oy + st.r * cs + cs / 2;
          const s = cs * 0.22;

          this.ctx.save();
          this.ctx.translate(x, y);
          this.ctx.rotate(this.animTime * 1.5);

          this.ctx.fillStyle = '#ffd166';
          this.ctx.shadowColor = '#ffd166';
          this.ctx.shadowBlur = 12;

          // 5-point star
          this.ctx.beginPath();
          for (let i = 0; i < 5; i++) {
            const a1 = (i * Math.PI * 2) / 5 - Math.PI / 2;
            const a2 = a1 + Math.PI / 5;
            this.ctx.lineTo(Math.cos(a1) * s, Math.sin(a1) * s);
            this.ctx.lineTo(Math.cos(a2) * (s * 0.45), Math.sin(a2) * (s * 0.45));
          }
          this.ctx.closePath();
          this.ctx.fill();

          this.ctx.restore();
        });
      }

      // 5. Render Targets / Energy Cores
      if (this.currentLevel.targets) {
        this.currentLevel.targets.forEach(t => {
          const x = ox + t.c * cs + cs / 2;
          const y = oy + t.r * cs + cs / 2;
          const rad = cs * 0.38;
          const color = t.requiredColor || '#00f5d4';

          this.ctx.save();
          this.ctx.translate(x, y);

          // Outer housing
          this.ctx.fillStyle = '#111726';
          this.ctx.beginPath();
          this.ctx.arc(0, 0, rad, 0, Math.PI * 2);
          this.ctx.fill();
          this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
          this.ctx.lineWidth = 1.5;
          this.ctx.stroke();

          // Target power status
          if (t.powered) {
            // Intense core glow
            this.ctx.shadowColor = color;
            this.ctx.shadowBlur = 18;

            const radGrad = this.ctx.createRadialGradient(0, 0, 1, 0, 0, rad * 0.75);
            radGrad.addColorStop(0, '#ffffff');
            radGrad.addColorStop(0.5, color);
            radGrad.addColorStop(1, 'rgba(0,0,0,0.2)');

            this.ctx.fillStyle = radGrad;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, rad * 0.75, 0, Math.PI * 2);
            this.ctx.fill();

            // Pulsing target halo
            const pulse = 1 + Math.sin(this.animTime * 6) * 0.08;
            this.ctx.strokeStyle = color;
            this.ctx.lineWidth = 2.5;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, rad * 0.85 * pulse, 0, Math.PI * 2);
            this.ctx.stroke();
          } else {
            // Unpowered ring
            this.ctx.strokeStyle = color;
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, rad * 0.65, 0, Math.PI * 2);
            this.ctx.stroke();

            // Inner center dot
            this.ctx.fillStyle = color;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, 3, 0, Math.PI * 2);
            this.ctx.fill();
          }

          this.ctx.restore();
        });
      }

      // 6. Render Emitters (Laser Cannons)
      if (this.currentLevel.emitters) {
        this.currentLevel.emitters.forEach(e => {
          const x = ox + e.c * cs + cs / 2;
          const y = oy + e.r * cs + cs / 2;
          const color = e.color || '#00f5d4';

          this.ctx.save();
          this.ctx.translate(x, y);

          // Turret base
          this.ctx.fillStyle = '#1e2436';
          this.ctx.beginPath();
          this.ctx.arc(0, 0, cs * 0.32, 0, Math.PI * 2);
          this.ctx.fill();

          this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
          this.ctx.lineWidth = 1.5;
          this.ctx.stroke();

          // Laser nozzle oriented to emission direction
          const angle = Math.atan2(e.dy, e.dx);
          this.ctx.rotate(angle);

          this.ctx.fillStyle = '#2a324b';
          this.ctx.fillRect(cs * 0.1, -cs * 0.12, cs * 0.24, cs * 0.24);

          // Glowing cannon chamber
          this.ctx.fillStyle = color;
          this.ctx.shadowColor = color;
          this.ctx.shadowBlur = 12;
          this.ctx.beginPath();
          this.ctx.arc(0, 0, cs * 0.16, 0, Math.PI * 2);
          this.ctx.fill();

          this.ctx.restore();
        });
      }

      // 7. Render Mirrors (Interactive 45° Pedestals)
      if (this.mirrors) {
        this.mirrors.forEach((m, idx) => {
          const x = ox + m.c * cs + cs / 2;
          const y = oy + m.r * cs + cs / 2;
          const rad = cs * 0.42;

          this.ctx.save();
          this.ctx.translate(x, y);

          // Interactive tap ring indicator
          this.ctx.strokeStyle = 'rgba(0, 245, 212, 0.3)';
          this.ctx.lineWidth = 1;
          this.ctx.setLineDash([3, 3]);
          this.ctx.beginPath();
          this.ctx.arc(0, 0, rad + 2, 0, Math.PI * 2);
          this.ctx.stroke();
          this.ctx.setLineDash([]);

          // Base mount
          this.ctx.fillStyle = '#1a2236';
          this.ctx.beginPath();
          this.ctx.arc(0, 0, rad * 0.85, 0, Math.PI * 2);
          this.ctx.fill();

          this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
          this.ctx.lineWidth = 1.5;
          this.ctx.stroke();

          // Smoothly rotated mirror bar
          this.ctx.rotate(m.currentAngle);

          // Mirror backing
          this.ctx.fillStyle = '#334155';
          this.ctx.fillRect(-rad * 0.8, -3, rad * 1.6, 6);

          // Reflective silver-cyan glass surface
          const mirrorGrad = this.ctx.createLinearGradient(-rad * 0.8, 0, rad * 0.8, 0);
          mirrorGrad.addColorStop(0, '#ffffff');
          mirrorGrad.addColorStop(0.5, '#a5f3fc');
          mirrorGrad.addColorStop(1, '#00f5d4');

          this.ctx.shadowColor = 'rgba(0, 245, 212, 0.6)';
          this.ctx.shadowBlur = 8;
          this.ctx.fillStyle = mirrorGrad;
          this.ctx.fillRect(-rad * 0.78, -1.5, rad * 1.56, 3);

          this.ctx.restore();
        });
      }
    }

    renderLaserBeams() {
      if (!this.laserRays || this.laserRays.length === 0) return;
      const cs = this.cellSize;
      const ox = this.gridOffsetX;
      const oy = this.gridOffsetY;

      this.ctx.save();

      // Multi-pass glow rendering for realistic intense laser light
      // Pass 1: Outer diffuse bloom
      this.ctx.globalCompositeOperation = 'screen';
      this.laserRays.forEach(ray => {
        const x1 = ox + ray.x1 * cs + cs / 2;
        const y1 = oy + ray.y1 * cs + cs / 2;
        const x2 = ox + ray.x2 * cs + cs / 2;
        const y2 = oy + ray.y2 * cs + cs / 2;

        this.ctx.strokeStyle = ray.color;
        this.ctx.lineWidth = 10;
        this.ctx.shadowColor = ray.color;
        this.ctx.shadowBlur = 18;
        this.ctx.globalAlpha = 0.35;

        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.stroke();
      });

      // Pass 2: Saturated mid beam
      this.laserRays.forEach(ray => {
        const x1 = ox + ray.x1 * cs + cs / 2;
        const y1 = oy + ray.y1 * cs + cs / 2;
        const x2 = ox + ray.x2 * cs + cs / 2;
        const y2 = oy + ray.y2 * cs + cs / 2;

        this.ctx.strokeStyle = ray.color;
        this.ctx.lineWidth = 4.5;
        this.ctx.shadowColor = ray.color;
        this.ctx.shadowBlur = 10;
        this.ctx.globalAlpha = 0.85;

        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.stroke();
      });

      // Pass 3: White-hot filament core
      this.laserRays.forEach(ray => {
        const x1 = ox + ray.x1 * cs + cs / 2;
        const y1 = oy + ray.y1 * cs + cs / 2;
        const x2 = ox + ray.x2 * cs + cs / 2;
        const y2 = oy + ray.y2 * cs + cs / 2;

        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 1.8;
        this.ctx.shadowBlur = 4;
        this.ctx.shadowColor = '#ffffff';
        this.ctx.globalAlpha = 1;

        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.stroke();
      });

      this.ctx.restore();
    }

    renderParticles() {
      if (this.particles.length === 0) return;
      this.ctx.save();
      this.ctx.globalCompositeOperation = 'screen';
      this.particles.forEach(p => {
        this.ctx.fillStyle = p.color;
        this.ctx.globalAlpha = Math.max(0, p.life);
        this.ctx.shadowColor = p.color;
        this.ctx.shadowBlur = 6;
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        this.ctx.fill();
      });
      this.ctx.restore();
    }
  }

  // Initialize game on DOM ready
  window.addEventListener('DOMContentLoaded', () => {
    window.game = new PrismLaserGame();
  });
})();
