/**
 * Stickman Climb 2 - Core Physics Game Engine
 * Faithful recreation of No Pressure Studios / Poki's Stickman Climb 2
 * Featuring:
 * - Precision rotational pickaxe physics, leverage impulses, edge-hooking & vaulting
 * - 10 Handcrafted obstacle levels with progressive difficulty, checkpoints & springs
 * - 1 Player Solo Campaign & 2 Player Local VS Race Mode
 * - Complete Garage Customization (Skins, Pots, Pickaxes) with live preview
 * - Web Audio API procedural synthesizer (rock strikes, slides, chimes, BGM)
 * - Parallax backgrounds, spark/dust particle physics & responsive mobile touch controls
 */

(function () {
  'use strict';

  // =========================================================================
  // AUDIO SYNTHESIZER (Web Audio API)
  // =========================================================================
  class SoundEngine {
    constructor() {
      this.ctx = null;
      this.masterGain = null;
      this.bgmGain = null;
      this.sfxGain = null;
      this.musicEnabled = true;
      this.sfxEnabled = true;
      this.isMuted = false;
      this.isPlayingBgm = false;
      this.bgmTimer = null;
      this.bgmStep = 0;
      this.initOnGesture();
    }

    init() {
      if (this.ctx) return;
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.75, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.bgmGain = this.ctx.createGain();
      this.bgmGain.gain.setValueAtTime(0.28, this.ctx.currentTime);
      this.bgmGain.connect(this.masterGain);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(0.72, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);
    }

    initOnGesture() {
      const unlock = () => {
        this.init();
        if (this.ctx && this.ctx.state === 'suspended') {
          this.ctx.resume();
        }
        window.removeEventListener('pointerdown', unlock);
        window.removeEventListener('keydown', unlock);
      };
      window.addEventListener('pointerdown', unlock, { passive: true });
      window.addEventListener('keydown', unlock, { passive: true });
    }

    setMusic(enabled) {
      this.musicEnabled = enabled;
      if (!enabled) this.stopBGM();
      else if (this.isPlayingBgm) this.startBGM();
    }

    setSfx(enabled) {
      this.sfxEnabled = enabled;
    }

    toggleMute() {
      this.isMuted = !this.isMuted;
      if (this.masterGain && this.ctx) {
        this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.75, this.ctx.currentTime);
      }
      return !this.isMuted;
    }

    playTone(freq, type, duration, gainVal, destination = null) {
      if (!this.ctx || this.isMuted) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const now = this.ctx.currentTime;

      osc.type = type || 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(gainVal || 0.2, now + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      osc.connect(gain);
      gain.connect(destination || this.sfxGain);

      osc.start(now);
      osc.stop(now + duration + 0.05);
    }

    // Catchy Upbeat Arcade Platformer BGM Loop
    startBGM() {
      if (!this.musicEnabled || this.isMuted) return;
      this.init();
      if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
      this.stopBGM();
      this.isPlayingBgm = true;

      const A3 = 220.00, C4 = 261.63, D4 = 293.66, E4 = 329.63, G4 = 392.00, A4 = 440.00, B4 = 493.88, C5 = 523.25;
      const A2 = 110.00, F2 = 87.31, G2 = 98.00, E2 = 82.41;

      const riff = [
        { m: A4, b: A2, d: 0.18 }, { m: C5, b: null, d: 0.18 }, { m: E4, b: A2, d: 0.18 }, { m: G4, b: null, d: 0.18 },
        { m: A4, b: F2, d: 0.18 }, { m: G4, b: null, d: 0.18 }, { m: E4, b: F2, d: 0.18 }, { m: D4, b: null, d: 0.18 },
        { m: C4, b: G2, d: 0.18 }, { m: D4, b: null, d: 0.18 }, { m: E4, b: G2, d: 0.18 }, { m: G4, b: null, d: 0.18 },
        { m: A4, b: E2, d: 0.36 }, { m: null, b: null, d: 0.18 }, { m: E4, b: E2, d: 0.18 }, { m: null, b: null, d: 0.18 }
      ];

      this.bgmStep = 0;
      const stepMs = 150;

      const tick = () => {
        if (!this.isPlayingBgm || !this.musicEnabled) return;
        const item = riff[this.bgmStep];
        if (item.m) {
          this.playTone(item.m, 'triangle', item.d, 0.16, this.bgmGain);
          this.playTone(item.m * 0.5, 'sine', item.d, 0.10, this.bgmGain);
        }
        if (item.b) {
          this.playTone(item.b, 'square', item.d * 0.9, 0.08, this.bgmGain);
        }
        this.bgmStep = (this.bgmStep + 1) % riff.length;
        this.bgmTimer = setTimeout(tick, stepMs);
      };

      tick();
    }

    stopBGM() {
      this.isPlayingBgm = false;
      if (this.bgmTimer) {
        clearTimeout(this.bgmTimer);
        this.bgmTimer = null;
      }
    }

    // SFX: Pickaxe Strike (Stone/Metal impact clink)
    playHit(intensity = 1.0) {
      if (!this.sfxEnabled || this.isMuted) return;
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      // High metal ping
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1400 + Math.random() * 400, now);
      osc.frequency.exponentialRampToValueAtTime(320, now + 0.08);

      const vol = Math.min(0.5, 0.15 + intensity * 0.35);
      gain.gain.setValueAtTime(vol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.09);

      // Low stone thump
      this.playTone(180, 'triangle', 0.10, vol * 0.8, this.sfxGain);
    }

    // SFX: Spring Booster Launch
    playSpring() {
      if (!this.sfxEnabled || this.isMuted) return;
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(260, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.22);

      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.25);
    }

    // SFX: Checkpoint Bell Chime
    playCheckpoint() {
      if (!this.sfxEnabled || this.isMuted) return;
      this.init();
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, idx) => {
        setTimeout(() => {
          this.playTone(freq, 'sine', 0.35, 0.28, this.sfxGain);
        }, idx * 70);
      });
    }

    // SFX: Coin Pickup
    playCoin() {
      if (!this.sfxEnabled || this.isMuted) return;
      this.init();
      this.playTone(987.77, 'sine', 0.12, 0.22, this.sfxGain);
      setTimeout(() => this.playTone(1318.5, 'sine', 0.18, 0.26, this.sfxGain), 70);
    }

    // SFX: Spike Splat / Death
    playDeath() {
      if (!this.sfxEnabled || this.isMuted) return;
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(50, now + 0.28);

      gain.gain.setValueAtTime(0.5, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.3);
    }

    // SFX: Level Victory Fanfare
    playVictory() {
      if (!this.sfxEnabled || this.isMuted) return;
      this.init();
      const notes = [440, 554.37, 659.25, 880];
      notes.forEach((freq, idx) => {
        setTimeout(() => {
          this.playTone(freq, 'triangle', 0.45, 0.35, this.sfxGain);
        }, idx * 100);
      });
    }
  }

  // =========================================================================
  // GARAGE ITEMS DEFINITIONS (Skins, Pots, Pickaxes)
  // =========================================================================
  const GARAGE_ITEMS = {
    skins: [
      { id: 'classic', name: 'Classic Stick', price: 0, color: '#0f172a', headColor: '#0f172a', emoji: '🧍' },
      { id: 'red', name: 'Crimson Red', price: 100, color: '#ef4444', headColor: '#ef4444', emoji: '🔴' },
      { id: 'blue', name: 'Azure Blue', price: 150, color: '#0ea5e9', headColor: '#0ea5e9', emoji: '🔵' },
      { id: 'ninja', name: 'Shadow Ninja', price: 300, color: '#1e293b', headColor: '#0f172a', hasHeadband: true, emoji: '🥷' },
      { id: 'golden', name: 'Gold Champion', price: 600, color: '#facc15', headColor: '#facc15', isGlowing: true, emoji: '👑' },
      { id: 'alien', name: 'Cosmic Alien', price: 450, color: '#22c55e', headColor: '#22c55e', hasAntenna: true, emoji: '👽' }
    ],
    pots: [
      { id: 'cauldron', name: 'Iron Cauldron', price: 0, type: 'cauldron', fill: '#334155', rim: '#1e293b', emoji: '🫕' },
      { id: 'barrel', name: 'Wood Barrel', price: 120, type: 'barrel', fill: '#78350f', rim: '#b45309', emoji: '🛢️' },
      { id: 'cardboard', name: 'Cardboard Box', price: 200, type: 'box', fill: '#d97706', rim: '#b45309', emoji: '📦' },
      { id: 'golden_pot', name: 'Golden Cauldron', price: 500, type: 'cauldron', fill: '#facc15', rim: '#ca8a04', emoji: '🏆' },
      { id: 'coconut', name: 'Coconut Shell', price: 280, type: 'coconut', fill: '#451a03', rim: '#78350f', emoji: '🥥' },
      { id: 'coffee_mug', name: 'Coffee Mug', price: 350, type: 'mug', fill: '#ef4444', rim: '#ffffff', emoji: '☕' }
    ],
    axes: [
      { id: 'pickaxe', name: 'Steel Pickaxe', price: 0, type: 'pickaxe', shaft: '#92400e', head: '#94a3b8', emoji: '⛏️' },
      { id: 'war_pick', name: 'Gold War Pick', price: 250, type: 'pickaxe', shaft: '#78350f', head: '#facc15', emoji: '🪓' },
      { id: 'hammer', name: 'Sledgehammer', price: 350, type: 'hammer', shaft: '#475569', head: '#1e293b', emoji: '🔨' },
      { id: 'candycane', name: 'Candy Cane', price: 300, type: 'candycane', shaft: '#ffffff', head: '#dc2626', emoji: '🦯' },
      { id: 'katana', name: 'Katana Pick', price: 550, type: 'katana', shaft: '#1e293b', head: '#e2e8f0', emoji: '🗡️' },
      { id: 'plasma', name: 'Plasma Laser', price: 700, type: 'plasma', shaft: '#0f172a', head: '#38bdf8', emoji: '⚡' }
    ]
  };

  // =========================================================================
  // HANDCRAFTED OBSTACLE LEVELS (10 Progressive Challenges)
  // =========================================================================
  const LEVELS = [
    // Level 1: Rocky Steps (Intro to pickaxe swinging and ascending)
    {
      id: 1,
      name: 'Rocky Steps',
      theme: 'canyon',
      startX: 120,
      startY: 450,
      platforms: [
        { x: 0, y: 520, w: 420, h: 220 },
        { x: 420, y: 460, w: 260, h: 280 },
        { x: 680, y: 390, w: 240, h: 350 },
        { x: 920, y: 310, w: 280, h: 430 },
        { x: 1200, y: 240, w: 320, h: 500 }
      ],
      spikes: [],
      springs: [],
      coins: [
        { x: 530, y: 410, collected: false },
        { x: 780, y: 340, collected: false },
        { x: 1040, y: 260, collected: false }
      ],
      checkpoints: [
        { x: 780, y: 390, reached: false }
      ],
      goal: { x: 1420, y: 240 },
      parTime: 14.0
    },

    // Level 2: The Chasm (Vaulting over wide gaps)
    {
      id: 2,
      name: 'The Chasm',
      theme: 'canyon',
      startX: 100,
      startY: 420,
      platforms: [
        { x: 0, y: 480, w: 350, h: 120 },
        { x: 460, y: 430, w: 180, h: 170 },
        { x: 760, y: 370, w: 190, h: 230 },
        { x: 1060, y: 420, w: 160, h: 180 },
        { x: 1320, y: 330, w: 320, h: 270 }
      ],
      spikes: [
        { x: 350, y: 560, w: 110, h: 40 },
        { x: 640, y: 560, w: 120, h: 40 },
        { x: 950, y: 560, w: 110, h: 40 }
      ],
      springs: [],
      coins: [
        { x: 550, y: 380, collected: false },
        { x: 850, y: 320, collected: false },
        { x: 1140, y: 370, collected: false }
      ],
      checkpoints: [
        { x: 850, y: 370, reached: false }
      ],
      goal: { x: 1540, y: 330 },
      parTime: 18.0
    },

    // Level 3: Spike Valley (Precision hooking over danger)
    {
      id: 3,
      name: 'Spike Valley',
      theme: 'cavern',
      startX: 100,
      startY: 450,
      platforms: [
        { x: 0, y: 500, w: 280, h: 100 },
        { x: 360, y: 440, w: 140, h: 160 },
        { x: 580, y: 360, w: 150, h: 240 },
        { x: 810, y: 280, w: 140, h: 320 },
        { x: 1030, y: 340, w: 130, h: 260 },
        { x: 1240, y: 240, w: 350, h: 360 }
      ],
      spikes: [
        { x: 280, y: 560, w: 80, h: 40 },
        { x: 500, y: 560, w: 80, h: 40 },
        { x: 730, y: 560, w: 80, h: 40 },
        { x: 950, y: 560, w: 80, h: 40 }
      ],
      springs: [],
      coins: [
        { x: 430, y: 380, collected: false },
        { x: 650, y: 300, collected: false },
        { x: 880, y: 220, collected: false },
        { x: 1100, y: 280, collected: false }
      ],
      checkpoints: [
        { x: 650, y: 360, reached: false },
        { x: 1100, y: 340, reached: false }
      ],
      goal: { x: 1480, y: 240 },
      parTime: 22.0
    },

    // Level 4: The Tower Wall (Vertical wall scaling)
    {
      id: 4,
      name: 'The Tower Wall',
      theme: 'castle',
      startX: 100,
      startY: 550,
      platforms: [
        { x: 0, y: 620, w: 300, h: 100 },
        { x: 340, y: 520, w: 160, h: 200 },
        // High vertical wall with stepping ledges spaced ~75-80px for smooth climbing
        { x: 540, y: 150, w: 80, h: 570 },
        { x: 450, y: 440, w: 90, h: 24 },
        { x: 450, y: 360, w: 90, h: 24 },
        { x: 450, y: 280, w: 90, h: 24 },
        { x: 450, y: 200, w: 90, h: 24 },
        { x: 540, y: 150, w: 220, h: 40 },
        { x: 820, y: 280, w: 240, h: 440 },
        { x: 1120, y: 220, w: 350, h: 500 }
      ],
      spikes: [
        { x: 300, y: 680, w: 40, h: 40 },
        { x: 760, y: 680, w: 60, h: 40 }
      ],
      springs: [],
      coins: [
        { x: 495, y: 400, collected: false },
        { x: 495, y: 320, collected: false },
        { x: 495, y: 240, collected: false },
        { x: 650, y: 100, collected: false },
        { x: 940, y: 230, collected: false }
      ],
      checkpoints: [
        { x: 420, y: 520, reached: false },
        { x: 650, y: 150, reached: false }
      ],
      goal: { x: 1350, y: 220 },
      parTime: 26.0
    },

    // Level 5: Bounce Valley (Spring pads launching player across)
    {
      id: 5,
      name: 'Bounce Valley',
      theme: 'neon',
      startX: 100,
      startY: 480,
      platforms: [
        { x: 0, y: 550, w: 280, h: 100 },
        { x: 360, y: 520, w: 120, h: 130 },
        { x: 620, y: 420, w: 140, h: 230 },
        { x: 880, y: 320, w: 150, h: 330 },
        { x: 1180, y: 480, w: 120, h: 170 },
        { x: 1420, y: 260, w: 350, h: 390 }
      ],
      spikes: [
        { x: 280, y: 610, w: 80, h: 40 },
        { x: 480, y: 610, w: 140, h: 40 },
        { x: 760, y: 610, w: 120, h: 40 },
        { x: 1030, y: 610, w: 150, h: 40 }
      ],
      springs: [
        { x: 410, y: 520, force: 850 },
        { x: 1230, y: 480, force: 950 }
      ],
      coins: [
        { x: 410, y: 300, collected: false },
        { x: 690, y: 360, collected: false },
        { x: 950, y: 260, collected: false },
        { x: 1230, y: 240, collected: false }
      ],
      checkpoints: [
        { x: 690, y: 420, reached: false },
        { x: 950, y: 320, reached: false }
      ],
      goal: { x: 1620, y: 260 },
      parTime: 20.0
    },

    // Level 6: The Overhang (Ceiling hooking and tight ledges)
    {
      id: 6,
      name: 'The Overhang',
      theme: 'cavern',
      startX: 100,
      startY: 480,
      platforms: [
        { x: 0, y: 540, w: 300, h: 100 },
        { x: 380, y: 480, w: 180, h: 160 },
        // Ceiling overhang
        { x: 480, y: 220, w: 260, h: 40 },
        { x: 680, y: 430, w: 180, h: 210 },
        { x: 960, y: 360, w: 170, h: 280 },
        { x: 1220, y: 280, w: 350, h: 360 }
      ],
      spikes: [
        { x: 300, y: 600, w: 80, h: 40 },
        { x: 560, y: 600, w: 120, h: 40 },
        { x: 860, y: 600, w: 100, h: 40 },
        { x: 1130, y: 600, w: 90, h: 40 }
      ],
      springs: [],
      coins: [
        { x: 470, y: 420, collected: false },
        { x: 600, y: 170, collected: false },
        { x: 770, y: 370, collected: false },
        { x: 1040, y: 300, collected: false }
      ],
      checkpoints: [
        { x: 470, y: 480, reached: false },
        { x: 770, y: 430, reached: false },
        { x: 1040, y: 360, reached: false }
      ],
      goal: { x: 1440, y: 280 },
      parTime: 28.0
    },

    // Level 7: Castle Spire (High pillars and precision leaps)
    {
      id: 7,
      name: 'Castle Spire',
      theme: 'castle',
      startX: 100,
      startY: 520,
      platforms: [
        { x: 0, y: 580, w: 260, h: 100 },
        { x: 330, y: 470, w: 120, h: 210 },
        { x: 520, y: 370, w: 110, h: 310 },
        { x: 700, y: 270, w: 110, h: 410 },
        { x: 890, y: 390, w: 120, h: 290 },
        { x: 1080, y: 280, w: 120, h: 400 },
        { x: 1280, y: 200, w: 350, h: 480 }
      ],
      spikes: [
        { x: 260, y: 640, w: 70, h: 40 },
        { x: 450, y: 640, w: 70, h: 40 },
        { x: 630, y: 640, w: 70, h: 40 },
        { x: 810, y: 640, w: 80, h: 40 },
        { x: 1010, y: 640, w: 70, h: 40 },
        { x: 1200, y: 640, w: 80, h: 40 }
      ],
      springs: [
        { x: 950, y: 390, force: 880 }
      ],
      coins: [
        { x: 390, y: 410, collected: false },
        { x: 575, y: 310, collected: false },
        { x: 755, y: 210, collected: false },
        { x: 950, y: 220, collected: false },
        { x: 1140, y: 220, collected: false }
      ],
      checkpoints: [
        { x: 575, y: 370, reached: false },
        { x: 890, y: 390, reached: false },
        { x: 1140, y: 280, reached: false }
      ],
      goal: { x: 1520, y: 200 },
      parTime: 32.0
    },

    // Level 8: Neon Grid (Fast springs and cyber ramps)
    {
      id: 8,
      name: 'Neon Grid',
      theme: 'neon',
      startX: 100,
      startY: 460,
      platforms: [
        { x: 0, y: 530, w: 260, h: 100 },
        { x: 320, y: 470, w: 140, h: 160 },
        { x: 540, y: 390, w: 150, h: 240 },
        { x: 770, y: 300, w: 160, h: 330 },
        { x: 1010, y: 420, w: 140, h: 210 },
        { x: 1220, y: 320, w: 150, h: 310 },
        { x: 1440, y: 210, w: 350, h: 420 }
      ],
      spikes: [
        { x: 260, y: 590, w: 60, h: 40 },
        { x: 460, y: 590, w: 80, h: 40 },
        { x: 690, y: 590, w: 80, h: 40 },
        { x: 930, y: 590, w: 80, h: 40 },
        { x: 1150, y: 590, w: 70, h: 40 },
        { x: 1370, y: 590, w: 70, h: 40 }
      ],
      springs: [
        { x: 390, y: 470, force: 900 },
        { x: 1080, y: 420, force: 920 }
      ],
      coins: [
        { x: 390, y: 260, collected: false },
        { x: 615, y: 330, collected: false },
        { x: 850, y: 240, collected: false },
        { x: 1080, y: 200, collected: false },
        { x: 1295, y: 260, collected: false }
      ],
      checkpoints: [
        { x: 615, y: 390, reached: false },
        { x: 850, y: 300, reached: false },
        { x: 1295, y: 320, reached: false }
      ],
      goal: { x: 1660, y: 210 },
      parTime: 25.0
    },

    // Level 9: Inferno Ridge (Spike gauntlet)
    {
      id: 9,
      name: 'Inferno Ridge',
      theme: 'canyon',
      startX: 100,
      startY: 480,
      platforms: [
        { x: 0, y: 550, w: 240, h: 100 },
        { x: 300, y: 470, w: 120, h: 180 },
        { x: 480, y: 390, w: 110, h: 260 },
        { x: 650, y: 310, w: 110, h: 340 },
        { x: 820, y: 230, w: 110, h: 420 },
        { x: 990, y: 340, w: 120, h: 310 },
        { x: 1170, y: 250, w: 130, h: 400 },
        { x: 1370, y: 180, w: 350, h: 470 }
      ],
      spikes: [
        { x: 240, y: 610, w: 60, h: 40 },
        { x: 420, y: 610, w: 60, h: 40 },
        { x: 590, y: 610, w: 60, h: 40 },
        { x: 760, y: 610, w: 60, h: 40 },
        { x: 930, y: 610, w: 60, h: 40 },
        { x: 1110, y: 610, w: 60, h: 40 },
        { x: 1300, y: 610, w: 70, h: 40 }
      ],
      springs: [],
      coins: [
        { x: 360, y: 410, collected: false },
        { x: 535, y: 330, collected: false },
        { x: 705, y: 250, collected: false },
        { x: 875, y: 170, collected: false },
        { x: 1050, y: 280, collected: false },
        { x: 1235, y: 190, collected: false }
      ],
      checkpoints: [
        { x: 535, y: 390, reached: false },
        { x: 875, y: 230, reached: false },
        { x: 1235, y: 250, reached: false }
      ],
      goal: { x: 1600, y: 180 },
      parTime: 35.0
    },

    // Level 10: Summit of Champions (The Ultimate Test)
    {
      id: 10,
      name: 'Summit of Champions',
      theme: 'castle',
      startX: 100,
      startY: 550,
      platforms: [
        { x: 0, y: 620, w: 260, h: 100 },
        { x: 320, y: 520, w: 130, h: 200 },
        { x: 510, y: 430, w: 120, h: 290 },
        { x: 700, y: 330, w: 130, h: 390 },
        { x: 890, y: 460, w: 110, h: 260 },
        { x: 1070, y: 350, w: 120, h: 370 },
        { x: 1260, y: 240, w: 130, h: 480 },
        { x: 1470, y: 150, w: 400, h: 570 }
      ],
      spikes: [
        { x: 260, y: 680, w: 60, h: 40 },
        { x: 450, y: 680, w: 60, h: 40 },
        { x: 630, y: 680, w: 70, h: 40 },
        { x: 830, y: 680, w: 60, h: 40 },
        { x: 1000, y: 680, w: 70, h: 40 },
        { x: 1190, y: 680, w: 70, h: 40 },
        { x: 1390, y: 680, w: 80, h: 40 }
      ],
      springs: [
        { x: 945, y: 460, force: 940 }
      ],
      coins: [
        { x: 385, y: 460, collected: false },
        { x: 570, y: 370, collected: false },
        { x: 765, y: 270, collected: false },
        { x: 945, y: 230, collected: false },
        { x: 1130, y: 290, collected: false },
        { x: 1325, y: 180, collected: false }
      ],
      checkpoints: [
        { x: 570, y: 430, reached: false },
        { x: 765, y: 330, reached: false },
        { x: 1130, y: 350, reached: false },
        { x: 1325, y: 240, reached: false }
      ],
      goal: { x: 1720, y: 150 },
      parTime: 40.0
    }
  ];

  // =========================================================================
  // CLIMBER RIGID BODY & PICKAXE PHYSICS
  // =========================================================================
  class Climber {
    constructor(id, x, y, isP2 = false) {
      this.id = id;
      this.isP2 = isP2;
      this.x = x;
      this.y = y;
      this.vx = 0;
      this.vy = 0;
      this.radius = 24; // pot radius
      this.axeAngle = -Math.PI / 4; // pickaxe angle
      this.axeAngularVel = 0;
      this.axeLength = 62;
      this.axeHeadRadius = 12;
      this.respawnX = x;
      this.respawnY = y;
      this.isDead = false;
      this.deadTimer = 0;
      this.hasFinished = false;
      this.finishTime = 0;

      // Customization config
      this.skinId = isP2 ? 'blue' : 'red';
      this.potId = 'cauldron';
      this.axeId = 'pickaxe';
    }

    applyCustomization(skinId, potId, axeId) {
      if (!this.isP2) {
        this.skinId = skinId || this.skinId;
        this.potId = potId || this.potId;
        this.axeId = axeId || this.axeId;
      }
    }

    getHeadPos() {
      return {
        x: this.x + Math.cos(this.axeAngle) * this.axeLength,
        y: this.y + Math.sin(this.axeAngle) * this.axeLength
      };
    }

    respawn() {
      this.x = this.respawnX;
      this.y = this.respawnY;
      this.vx = 0;
      this.vy = 0;
      this.axeAngularVel = 0;
      this.axeAngle = -Math.PI / 4;
      this.isDead = false;
      this.deadTimer = 0;
    }

    update(dt, level, sound, fx, inputLeft = false, inputRight = false) {
      if (this.isDead) {
        this.deadTimer -= dt;
        if (this.deadTimer <= 0) {
          this.respawn();
          fx.spawnDust(this.x, this.y);
        }
        return;
      }

      // Physics sub-stepping for ultra-stable non-penetrating collision & leverage
      const SUB_STEPS = 4;
      const sdt = dt / SUB_STEPS;
      const GRAVITY = 960;

      for (let step = 0; step < SUB_STEPS; step++) {
        // 1. Process Rotational Input (Snap & Smooth Torque)
        if (inputRight) {
          if (this.axeAngularVel < 3.0) this.axeAngularVel = 3.0;
          this.axeAngularVel += 90 * sdt;
        } else if (inputLeft) {
          if (this.axeAngularVel > -3.0) this.axeAngularVel = -3.0;
          this.axeAngularVel -= 90 * sdt;
        }
        const MAX_ANG_VEL = 17.5;
        this.axeAngularVel = Math.max(-MAX_ANG_VEL, Math.min(MAX_ANG_VEL, this.axeAngularVel));
        this.axeAngularVel *= Math.pow(0.95, sdt / 0.016);
        this.axeAngle += this.axeAngularVel * sdt;

        // 2. Linear motion (Pot)
        this.vy += GRAVITY * sdt;
        this.vx *= Math.pow(0.986, sdt / 0.016);
        this.vy *= Math.pow(0.996, sdt / 0.016);
        this.x += this.vx * sdt;
        this.y += this.vy * sdt;

        // 3. Pot vs Terrain Collision (Circular Body)
        for (const p of level.platforms) {
          // If thin stepping ledge/rung (h <= 30), allow jump-through from below
          const isThinRung = p.h <= 30;
          if (isThinRung && this.vy < -40 && this.y > p.y + 10) {
            continue;
          }

          const nearestX = Math.max(p.x, Math.min(this.x, p.x + p.w));
          const nearestY = Math.max(p.y, Math.min(this.y, p.y + p.h));
          const dx = this.x - nearestX;
          const dy = this.y - nearestY;
          const distSq = dx * dx + dy * dy;

          if (distSq < this.radius * this.radius) {
            const dist = Math.sqrt(distSq) || 0.001;
            const overlap = this.radius - dist;
            const nx = dx / dist;
            const ny = dy / dist;

            this.x += nx * overlap;
            this.y += ny * overlap;

            const velDotNormal = this.vx * nx + this.vy * ny;
            if (velDotNormal < 0) {
              this.vx -= (1 + 0.15) * velDotNormal * nx;
              this.vy -= (1 + 0.15) * velDotNormal * ny;
              this.vx *= 0.88; // ground rolling friction

              if (Math.abs(velDotNormal) > 140) {
                sound.playHit(Math.min(1.0, Math.abs(velDotNormal) / 500));
                fx.spawnDust(nearestX, nearestY);
              }
            }
          }
        }

        // 4. Rigid Pickaxe Head & Shaft vs Terrain (NON-PENETRATION & VAULT LEVERAGE)
        let hx = this.x + Math.cos(this.axeAngle) * this.axeLength;
        let hy = this.y + Math.sin(this.axeAngle) * this.axeLength;

        for (const p of level.platforms) {
          // Check collision with platform top surface and corners
          const margin = 2;
          if (hx >= p.x - margin && hx <= p.x + p.w + margin && hy >= p.y - margin && hy <= p.y + p.h + margin) {
            const penTop = hy - p.y;
            const penLeft = hx - p.x;
            const penRight = (p.x + p.w) - hx;
            const penBottom = (p.y + p.h) - hy;
            const minPen = Math.min(penTop, penLeft, penRight, penBottom);

            if (minPen === penTop && penTop > 0) {
              // Pickaxe touching platform top!
              // 1. Fulcrum position constraint: NEVER allow axe to penetrate below surface!
              this.y -= penTop;
              hy = p.y;

              // 2. Powerful vertical vault launch into the air:
              if (this.axeAngularVel > 0) {
                // Clockwise (D) -> vault forward & launch high into air
                const launchUp = -Math.abs(this.axeAngularVel) * 32; // up to -560 px/s!
                const forwardBoost = Math.abs(this.axeAngularVel) * 26; // up to +440 px/s!
                this.vy = Math.min(this.vy, launchUp);
                this.vx = Math.max(this.vx, this.vx * 0.7 + forwardBoost);
              } else if (this.axeAngularVel < 0) {
                // Counter-clockwise (A) -> vault backward & launch high
                const launchUp = -Math.abs(this.axeAngularVel) * 32;
                const backwardBoost = -Math.abs(this.axeAngularVel) * 26;
                this.vy = Math.min(this.vy, launchUp);
                this.vx = Math.min(this.vx, this.vx * 0.7 + backwardBoost);
              }

              // Sound & sparks
              if (Math.random() < 0.22) {
                sound.playHit(0.35);
                fx.spawnSparks(hx, hy, 0, -1);
              }

              this.axeAngularVel *= 0.84;

              // Solid rotational limit: clamp axe angle so head sits strictly on or above surface
              const maxSin = Math.max(-1, Math.min(1, (p.y - this.y) / this.axeLength));
              const clampedAngle = Math.asin(maxSin);
              if (Math.sin(this.axeAngle) > maxSin) {
                this.axeAngle = this.axeAngle > Math.PI / 2 ? Math.PI - clampedAngle : clampedAngle;
              }
            } else if (minPen === penLeft && penLeft > 0) {
              // Pickaxe touching left vertical wall (scaling cliff)
              this.x -= penLeft;
              hx = p.x;

              if (this.axeAngularVel > 0) {
                // Clockwise against wall launches climber UP and over the ledge!
                this.vy = Math.min(this.vy, -480);
                this.vx = Math.max(this.vx, 70);
              } else if (this.axeAngularVel < 0) {
                this.vy = Math.min(this.vy, -360);
                this.vx = Math.min(this.vx, -60);
              }

              if (Math.random() < 0.25) {
                sound.playHit(0.35);
                fx.spawnSparks(hx, hy, -1, 0);
              }
              this.axeAngularVel *= 0.84;
            } else if (minPen === penRight && penRight > 0) {
              this.x += penRight;
              hx = p.x + p.w;
              if (this.axeAngularVel < 0) {
                this.vy = Math.min(this.vy, -480);
                this.vx = Math.min(this.vx, -70);
              }
              this.axeAngularVel *= 0.84;
            }
          }

          // Ledge Grab / Corner Hooking: Top-Left Corner (p.x, p.y)
          // When pickaxe blade crosses over the corner, hook and pull up!
          const cornerDist = Math.hypot(this.x - p.x, this.y - p.y);
          if (cornerDist < this.axeLength + 16 && this.y > p.y - 20) {
            if (hx >= p.x - 6 && hx <= p.x + 45 && hy >= p.y - 20 && hy <= p.y + 25) {
              if (this.axeAngularVel > 0) {
                // Pull pot up and over the ledge!
                this.vy = Math.min(this.vy, -540);
                this.vx = Math.max(this.vx, 250);
                this.y = Math.min(this.y, p.y - 12);
                if (Math.random() < 0.3) {
                  sound.playHit(0.4);
                  fx.spawnSparks(p.x, p.y, 0, -1);
                }
              }
            }
          }
        }
      }

      // 5. Spring Boosters
      for (const s of level.springs) {
        const dx = Math.abs(this.x - s.x);
        const dy = Math.abs(this.y - s.y);
        if (dx < 36 && dy < 32 && this.vy > -200) {
          this.vy = -s.force;
          sound.playSpring();
          fx.spawnDust(s.x, s.y);
        }
      }

      // 6. Checkpoints
      level.checkpoints.forEach((cp, idx) => {
        const dist = Math.hypot(this.x - cp.x, this.y - cp.y);
        if (dist < 46 && !cp.reached) {
          cp.reached = true;
          this.respawnX = cp.x;
          this.respawnY = cp.y - 10;
          sound.playCheckpoint();
          fx.spawnCheckpointStars(cp.x, cp.y - 30);
          window.dispatchEvent(new CustomEvent('cp-reached', { detail: { count: idx + 1 } }));
        }
      });

      // 8. Coins
      level.coins.forEach((c) => {
        if (!c.collected && Math.hypot(this.x - c.x, this.y - c.y) < 32) {
          c.collected = true;
          sound.playCoin();
          fx.spawnCoinSparkles(c.x, c.y);
          window.dispatchEvent(new Event('coin-collected'));
        }
      });

      // 9. Spikes Hazard (Death)
      for (const sp of level.spikes) {
        if (this.x >= sp.x && this.x <= sp.x + sp.w && this.y >= sp.y && this.y <= sp.y + sp.h + 20) {
          this.triggerDeath(sound, fx);
          break;
        }
      }

      // Void death (Fell off bottom of screen)
      if (this.y > 900) {
        this.triggerDeath(sound, fx);
      }

      // 10. Goal Flag Check
      const distToGoal = Math.hypot(this.x - level.goal.x, this.y - level.goal.y);
      if (distToGoal < 48 && !this.hasFinished) {
        this.hasFinished = true;
        sound.playVictory();
        fx.spawnVictoryConfetti(level.goal.x, level.goal.y - 30);
        window.dispatchEvent(new CustomEvent('goal-reached', { detail: { climber: this } }));
      }
    }

    triggerDeath(sound, fx) {
      if (this.isDead) return;
      this.isDead = true;
      this.deadTimer = 0.65;
      sound.playDeath();
      fx.spawnDeathBurst(this.x, this.y);
    }

    draw(ctx) {
      if (this.isDead) return;

      const skin = GARAGE_ITEMS.skins.find(s => s.id === this.skinId) || GARAGE_ITEMS.skins[0];
      const pot = GARAGE_ITEMS.pots.find(p => p.id === this.potId) || GARAGE_ITEMS.pots[0];
      const axe = GARAGE_ITEMS.axes.find(a => a.id === this.axeId) || GARAGE_ITEMS.axes[0];

      ctx.save();
      ctx.translate(this.x, this.y);

      // 1. Pickaxe & Handle
      ctx.save();
      ctx.rotate(this.axeAngle);

      // Pickaxe Shaft
      ctx.fillStyle = axe.shaft;
      ctx.fillRect(0, -3.5, this.axeLength, 7);
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1.8;
      ctx.strokeRect(0, -3.5, this.axeLength, 7);

      // Pickaxe Head
      ctx.translate(this.axeLength, 0);
      this.drawAxeHead(ctx, axe);
      ctx.restore();

      // 2. Stickman Torso & Arms Gripping Pickaxe
      ctx.strokeStyle = skin.color;
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';

      // Stickman Body extending up from pot
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, -22);
      ctx.stroke();

      // Arms reaching towards axe handle
      const armTargetX = Math.cos(this.axeAngle) * 20;
      const armTargetY = Math.sin(this.axeAngle) * 20;
      ctx.beginPath();
      ctx.moveTo(0, -16);
      ctx.lineTo(armTargetX, armTargetY);
      ctx.stroke();

      // Stickman Head with Skin Extras (Headband, Antenna, etc.)
      ctx.fillStyle = skin.headColor;
      ctx.beginPath();
      ctx.arc(0, -32, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      if (skin.hasHeadband) {
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(-10, -36, 20, 4);
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.moveTo(10, -34);
        ctx.lineTo(18, -30);
        ctx.lineTo(16, -38);
        ctx.closePath();
        ctx.fill();
      }

      if (skin.hasAntenna) {
        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, -42);
        ctx.lineTo(0, -50);
        ctx.stroke();
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.arc(0, -52, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Cute Stickman Eye
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(4, -33, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(4.5, -33, 1.4, 0, Math.PI * 2);
      ctx.fill();

      // 3. The Pot / Container
      this.drawPot(ctx, pot);

      ctx.restore();
    }

    drawPot(ctx, pot) {
      const r = this.radius;
      ctx.save();

      // Drop shadow underneath pot
      ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
      ctx.shadowBlur = 10;
      ctx.shadowOffsetY = 4;

      if (pot.type === 'box') {
        // Cardboard Box
        ctx.fillStyle = pot.fill;
        ctx.beginPath();
        ctx.roundRect(-r, -r * 0.4, r * 2, r * 1.4, 6);
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = pot.rim;
        ctx.stroke();

        // Box Tape
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.fillRect(-6, -r * 0.4, 12, r * 1.4);
      } else if (pot.type === 'barrel') {
        // Wooden Barrel
        ctx.fillStyle = pot.fill;
        ctx.beginPath();
        ctx.arc(0, r * 0.2, r, Math.PI * 0.15, Math.PI * 0.85);
        ctx.lineTo(-r, -r * 0.2);
        ctx.lineTo(r, -r * 0.2);
        ctx.closePath();
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#334155';
        ctx.stroke();

        // Steel bands
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(-r * 0.95, -r * 0.05, r * 1.9, 5);
        ctx.fillRect(-r * 0.85, r * 0.55, r * 1.7, 5);
      } else {
        // Classic Rounded Iron / Golden Cauldron
        ctx.fillStyle = pot.fill;
        ctx.beginPath();
        ctx.arc(0, r * 0.2, r, 0, Math.PI);
        ctx.closePath();
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = pot.rim;
        ctx.stroke();

        // Pot Flanged Lip
        ctx.fillStyle = pot.rim;
        ctx.beginPath();
        ctx.roundRect(-r * 1.1, r * 0.15, r * 2.2, 7, 3);
        ctx.fill();

        // Metallic Rim Highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.beginPath();
        ctx.ellipse(-r * 0.35, r * 0.45, 6, 3, Math.PI * 0.2, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }

    drawAxeHead(ctx, axe) {
      if (axe.type === 'hammer') {
        // Sledgehammer
        ctx.fillStyle = axe.head;
        ctx.beginPath();
        ctx.roundRect(-8, -14, 16, 28, 4);
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#0f172a';
        ctx.stroke();
      } else if (axe.type === 'candycane') {
        // Candy Cane Hook
        ctx.fillStyle = axe.head;
        ctx.beginPath();
        ctx.arc(0, -10, 12, 0, Math.PI, true);
        ctx.lineWidth = 8;
        ctx.strokeStyle = axe.head;
        ctx.stroke();
      } else if (axe.type === 'katana') {
        // Katana Blade
        ctx.fillStyle = axe.head;
        ctx.beginPath();
        ctx.moveTo(-4, -18);
        ctx.lineTo(8, -18);
        ctx.lineTo(2, 18);
        ctx.lineTo(-4, 18);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      } else {
        // Classic Curved Pickaxe Head
        ctx.fillStyle = axe.head;
        ctx.beginPath();
        ctx.moveTo(0, -18);
        ctx.quadraticCurveTo(8, 0, 0, 18);
        ctx.lineTo(-8, 12);
        ctx.quadraticCurveTo(0, 0, -8, -12);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Center Eye Collar
        ctx.fillStyle = '#475569';
        ctx.beginPath();
        ctx.arc(0, 0, 5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // =========================================================================
  // PARTICLE SYSTEM (Sparks, Dust, Stars & Confetti)
  // =========================================================================
  class ParticleEngine {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.particles = [];
    }

    resize(w, h) {
      this.canvas.width = w;
      this.canvas.height = h;
    }

    spawnSparks(x, y, nx, ny) {
      for (let i = 0; i < 7; i++) {
        const speed = Math.random() * 220 + 80;
        const angle = Math.atan2(ny, nx) + (Math.random() - 0.5) * 1.4;
        this.particles.push({
          x, y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          gravity: 400,
          r: Math.random() * 2.5 + 1.5,
          color: Math.random() > 0.4 ? '#facc15' : '#f97316',
          alpha: 1.0,
          life: 0.35
        });
      }
    }

    spawnDust(x, y) {
      for (let i = 0; i < 6; i++) {
        this.particles.push({
          x: x + (Math.random() - 0.5) * 14,
          y: y,
          vx: (Math.random() - 0.5) * 80,
          vy: -Math.random() * 60 - 20,
          gravity: 120,
          r: Math.random() * 5 + 3,
          color: '#cbd5e1',
          alpha: 0.7,
          life: 0.45
        });
      }
    }

    spawnCheckpointStars(x, y) {
      for (let i = 0; i < 16; i++) {
        const ang = Math.random() * Math.PI * 2;
        const spd = Math.random() * 160 + 60;
        this.particles.push({
          x, y,
          vx: Math.cos(ang) * spd,
          vy: Math.sin(ang) * spd,
          gravity: 180,
          r: Math.random() * 3.5 + 2,
          isStar: true,
          color: '#22c55e',
          alpha: 1.0,
          life: 0.65
        });
      }
    }

    spawnCoinSparkles(x, y) {
      for (let i = 0; i < 12; i++) {
        const ang = Math.random() * Math.PI * 2;
        const spd = Math.random() * 140 + 40;
        this.particles.push({
          x, y,
          vx: Math.cos(ang) * spd,
          vy: Math.sin(ang) * spd,
          gravity: 150,
          r: Math.random() * 3 + 2,
          isStar: true,
          color: '#facc15',
          alpha: 1.0,
          life: 0.5
        });
      }
    }

    spawnDeathBurst(x, y) {
      for (let i = 0; i < 24; i++) {
        const ang = Math.random() * Math.PI * 2;
        const spd = Math.random() * 300 + 80;
        this.particles.push({
          x, y,
          vx: Math.cos(ang) * spd,
          vy: Math.sin(ang) * spd,
          gravity: 500,
          r: Math.random() * 4 + 2,
          color: Math.random() > 0.5 ? '#ef4444' : '#0f172a',
          alpha: 1.0,
          life: 0.65
        });
      }
    }

    spawnVictoryConfetti(x, y) {
      const colors = ['#facc15', '#ef4444', '#0ea5e9', '#22c55e', '#a855f7'];
      for (let i = 0; i < 60; i++) {
        const ang = Math.random() * Math.PI * 2;
        const spd = Math.random() * 400 + 100;
        this.particles.push({
          x, y,
          vx: Math.cos(ang) * spd,
          vy: Math.sin(ang) * spd - 160,
          gravity: 450,
          w: Math.random() * 10 + 5,
          h: Math.random() * 6 + 3,
          rot: Math.random() * Math.PI * 2,
          rotSpeed: (Math.random() - 0.5) * 12,
          color: colors[Math.floor(Math.random() * colors.length)],
          alpha: 1.0,
          life: 1.2
        });
      }
    }

    update(dt) {
      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += p.gravity * dt;
        if (p.rot !== undefined) p.rot += p.rotSpeed * dt;
        p.life -= dt;
        p.alpha = Math.max(0, p.life * 1.5);
        if (p.life <= 0) this.particles.splice(i, 1);
      }
    }

    draw(cameraX, cameraY) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      for (const p of this.particles) {
        this.ctx.save();
        this.ctx.globalAlpha = p.alpha;
        this.ctx.translate(p.x - cameraX, p.y - cameraY);

        if (p.rot !== undefined) {
          this.ctx.rotate(p.rot);
          this.ctx.fillStyle = p.color;
          this.ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        } else {
          this.ctx.fillStyle = p.color;
          this.ctx.beginPath();
          this.ctx.arc(0, 0, p.r, 0, Math.PI * 2);
          this.ctx.fill();
        }
        this.ctx.restore();
      }
    }
  }

  // =========================================================================
  // PARALLAX BACKGROUND RENDERER
  // =========================================================================
  class ParallaxBackground {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
    }

    resize(w, h) {
      this.canvas.width = w;
      this.canvas.height = h;
    }

    draw(cameraX, cameraY, theme = 'canyon') {
      const w = this.canvas.width;
      const h = this.canvas.height;
      const ctx = this.ctx;
      ctx.clearRect(0, 0, w, h);

      // Sky gradient
      const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
      if (theme === 'neon') {
        skyGrad.addColorStop(0, '#0f172a');
        skyGrad.addColorStop(0.5, '#1e1b4b');
        skyGrad.addColorStop(1, '#312e81');
      } else if (theme === 'castle') {
        skyGrad.addColorStop(0, '#1e293b');
        skyGrad.addColorStop(0.5, '#334155');
        skyGrad.addColorStop(1, '#475569');
      } else {
        // Canyon / Mountain default
        skyGrad.addColorStop(0, '#0284c7');
        skyGrad.addColorStop(0.45, '#38bdf8');
        skyGrad.addColorStop(0.85, '#fdba74');
        skyGrad.addColorStop(1, '#f97316');
      }
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, h);

      // Layer 1: Distant Mountain Silhouettes (Slowest parallax 0.15)
      ctx.save();
      const mtnX = -(cameraX * 0.15) % 600;
      ctx.fillStyle = theme === 'neon' ? '#1e1b4b' : 'rgba(30, 41, 59, 0.45)';
      ctx.beginPath();
      for (let x = -600; x < w + 600; x += 300) {
        ctx.lineTo(x + mtnX, h * 0.45);
        ctx.lineTo(x + mtnX + 150, h * 0.28);
        ctx.lineTo(x + mtnX + 300, h * 0.45);
      }
      ctx.lineTo(w, h);
      ctx.lineTo(0, h);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // Layer 2: Midground Ridge (Parallax 0.35)
      ctx.save();
      const ridgeX = -(cameraX * 0.35) % 400;
      ctx.fillStyle = theme === 'neon' ? '#0f172a' : 'rgba(15, 23, 42, 0.65)';
      ctx.beginPath();
      for (let x = -400; x < w + 400; x += 200) {
        ctx.lineTo(x + ridgeX, h * 0.62);
        ctx.lineTo(x + ridgeX + 100, h * 0.48);
        ctx.lineTo(x + ridgeX + 200, h * 0.62);
      }
      ctx.lineTo(w, h);
      ctx.lineTo(0, h);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }

  // =========================================================================
  // MAIN GAME ENGINE CONTROLLER
  // =========================================================================
  class StickmanClimbGame {
    constructor() {
      // DOM Canvases
      this.bgCanvas = document.getElementById('bgCanvas');
      this.worldCanvas = document.getElementById('worldCanvas');
      this.fxCanvas = document.getElementById('fxCanvas');
      this.menuCanvas = document.getElementById('menuPreviewCanvas');
      this.garageCanvas = document.getElementById('garageCanvas');

      this.ctx = this.worldCanvas.getContext('2d');
      this.menuCtx = this.menuCanvas ? this.menuCanvas.getContext('2d') : null;
      this.garageCtx = this.garageCanvas ? this.garageCanvas.getContext('2d') : null;

      // Top HUD Elements
      this.btnHome = document.getElementById('btnHome');
      this.btnSound = document.getElementById('btnSound');
      this.soundIcon = document.getElementById('soundIcon');
      this.btnRestart = document.getElementById('btnRestart');
      this.btnFullscreen = document.getElementById('btnFullscreen');
      this.hudLevelNum = document.getElementById('hudLevelNum');
      this.hudModeTag = document.getElementById('hudModeTag');
      this.hudCheckpoints = document.getElementById('hudCheckpoints');
      this.hudTimer = document.getElementById('hudTimer');
      this.hudCoins = document.getElementById('hudCoins');
      this.raceBarHud = document.getElementById('raceBarHud');
      this.raceMarkerP1 = document.getElementById('raceMarkerP1');
      this.raceMarkerP2 = document.getElementById('raceMarkerP2');
      this.gameToast = document.getElementById('gameToast');
      this.toastText = document.getElementById('toastText');

      // Screens & Modals
      this.menuScreen = document.getElementById('menuScreen');
      this.levelSelectModal = document.getElementById('levelSelectModal');
      this.garageModal = document.getElementById('garageModal');
      this.howToModal = document.getElementById('howToModal');
      this.settingsModal = document.getElementById('settingsModal');
      this.victoryModal = document.getElementById('victoryModal');

      // Buttons
      this.btnStart1P = document.getElementById('btnStart1P');
      this.btnStart2P = document.getElementById('btnStart2P');
      this.btnOpenLevels = document.getElementById('btnOpenLevels');
      this.btnOpenGarage = document.getElementById('btnOpenGarage');
      this.btnOpenHowTo = document.getElementById('btnOpenHowTo');
      this.btnOpenSettings = document.getElementById('btnOpenSettings');
      this.btnCloseLevels = document.getElementById('btnCloseLevels');
      this.btnCloseGarage = document.getElementById('btnCloseGarage');
      this.btnCloseHowTo = document.getElementById('btnCloseHowTo');
      this.btnCloseSettings = document.getElementById('btnCloseSettings');
      this.btnGotIt = document.getElementById('btnGotIt');
      this.btnVicNext = document.getElementById('btnVicNext');
      this.btnVicReplay = document.getElementById('btnVicReplay');
      this.btnVicMenu = document.getElementById('btnVicMenu');
      this.btnResetProgress = document.getElementById('btnResetProgress');

      // Mobile Touch Controls
      this.mobileControls = document.getElementById('mobileControls');
      this.p2TouchControls = document.getElementById('p2TouchControls');
      this.btnTouchLeft = document.getElementById('btnTouchLeft');
      this.btnTouchRight = document.getElementById('btnTouchRight');
      this.btnTouchRespawn = document.getElementById('btnTouchRespawn');
      this.btnTouchLeftP2 = document.getElementById('btnTouchLeftP2');
      this.btnTouchRightP2 = document.getElementById('btnTouchRightP2');
      this.btnTouchRespawnP2 = document.getElementById('btnTouchRespawnP2');

      // Settings toggles
      this.toggleMusic = document.getElementById('toggleMusic');
      this.toggleSfx = document.getElementById('toggleSfx');
      this.toggleTouchControls = document.getElementById('toggleTouchControls');

      // Subsystems
      this.sound = new SoundEngine();
      this.bg = new ParallaxBackground(this.bgCanvas);
      this.fx = new ParticleEngine(this.fxCanvas);

      // State
      this.state = 'MENU'; // 'MENU' | 'PLAYING' | 'PAUSED' | 'VICTORY'
      this.gameMode = '1P'; // '1P' or '2P'
      this.currentLevelIndex = 0;
      this.levelStartTime = 0;
      this.elapsedLevelTime = 0;
      this.coins = parseInt(localStorage.getItem('sc2_coins') || '50', 10);
      this.unlockedLevels = parseInt(localStorage.getItem('sc2_unlocked') || '1', 10);
      this.levelBestTimes = JSON.parse(localStorage.getItem('sc2_best_times') || '{}');
      this.levelStars = JSON.parse(localStorage.getItem('sc2_stars') || '{}');

      // Equipped items
      this.equippedSkin = localStorage.getItem('sc2_skin') || 'classic';
      this.equippedPot = localStorage.getItem('sc2_pot') || 'cauldron';
      this.equippedAxe = localStorage.getItem('sc2_axe') || 'pickaxe';
      this.unlockedItems = JSON.parse(localStorage.getItem('sc2_unlocked_items') || '["classic","cauldron","pickaxe"]');

      // Players
      this.p1 = null;
      this.p2 = null;

      // Camera
      this.cameraX = 0;
      this.cameraY = 0;

      // Input Map
      this.keys = {};

      this.initEvents();
      this.resize();
      this.updateCoinsDisplay();

      // Start loop
      this.lastTimestamp = performance.now();
      requestAnimationFrame(this.loop.bind(this));
    }

    updateCoinsDisplay() {
      if (this.hudCoins) this.hudCoins.textContent = this.coins.toString();
      const garageCoinsEl = document.getElementById('garageCoins');
      if (garageCoinsEl) garageCoinsEl.textContent = this.coins.toString();
      localStorage.setItem('sc2_coins', this.coins.toString());
    }

    resize() {
      const w = window.innerWidth;
      const h = window.innerHeight;
      this.bg.resize(w, h);
      this.fx.resize(w, h);
      this.worldCanvas.width = w;
      this.worldCanvas.height = h;
    }

    initEvents() {
      window.addEventListener('resize', () => this.resize());

      // Keyboard Controls
      window.addEventListener('keydown', (e) => {
        this.keys[e.code] = true;
        this.sound.init();

        // P1 Respawn (R)
        if (e.code === 'KeyR' && this.state === 'PLAYING') {
          if (this.p1) this.p1.respawn();
        }

        // P2 Respawn (Enter)
        if (e.code === 'Enter' && this.state === 'PLAYING' && this.gameMode === '2P') {
          if (this.p2) this.p2.respawn();
        }
      });

      window.addEventListener('keyup', (e) => {
        this.keys[e.code] = false;
      });

      // Mouse drag controls on canvas (alternative intuitive input)
      let isDragging = false;
      let lastMouseX = 0;
      this.worldCanvas.addEventListener('pointerdown', (e) => {
        isDragging = true;
        lastMouseX = e.clientX;
      });
      window.addEventListener('pointermove', (e) => {
        if (isDragging && this.state === 'PLAYING' && this.p1) {
          const deltaX = e.clientX - lastMouseX;
          this.p1.axeAngularVel += deltaX * 0.12;
          lastMouseX = e.clientX;
        }
      });
      window.addEventListener('pointerup', () => { isDragging = false; });

      // Custom Event Listeners
      window.addEventListener('coin-collected', () => {
        this.coins += 10;
        this.updateCoinsDisplay();
      });

      window.addEventListener('cp-reached', (e) => {
        this.showToast(`CHECKPOINT ${e.detail.count} REACHED!`);
        this.updateCheckpointHUD();
      });

      window.addEventListener('goal-reached', (e) => {
        this.handleLevelVictory(e.detail.climber);
      });

      // Mode Selection
      this.btnStart1P.addEventListener('click', () => this.startNewGame('1P'));
      this.btnStart2P.addEventListener('click', () => this.startNewGame('2P'));

      // Top HUD Buttons
      this.btnHome.addEventListener('click', () => this.returnToMenu());
      this.btnSound.addEventListener('click', () => {
        const unmuted = this.sound.toggleMute();
        this.soundIcon.textContent = unmuted ? '🔊' : '🔇';
      });
      this.btnRestart.addEventListener('click', () => {
        if (this.state === 'PLAYING') this.restartCurrentLevel();
      });
      this.btnFullscreen.addEventListener('click', () => {
        if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => {});
        else document.exitFullscreen().catch(() => {});
      });

      // Modals
      this.btnOpenLevels.addEventListener('click', () => this.openLevelSelect());
      this.btnCloseLevels.addEventListener('click', () => this.hideModal(this.levelSelectModal));

      this.btnOpenGarage.addEventListener('click', () => this.openGarage());
      this.btnCloseGarage.addEventListener('click', () => this.hideModal(this.garageModal));

      this.btnOpenHowTo.addEventListener('click', () => this.showModal(this.howToModal));
      this.btnCloseHowTo.addEventListener('click', () => this.hideModal(this.howToModal));
      this.btnGotIt.addEventListener('click', () => this.hideModal(this.howToModal));

      this.btnOpenSettings.addEventListener('click', () => this.showModal(this.settingsModal));
      this.btnCloseSettings.addEventListener('click', () => this.hideModal(this.settingsModal));

      // Settings switches
      this.toggleMusic.addEventListener('change', (e) => this.sound.setMusic(e.target.checked));
      this.toggleSfx.addEventListener('change', (e) => this.sound.setSfx(e.target.checked));
      this.toggleTouchControls.addEventListener('change', (e) => {
        this.mobileControls.style.display = e.target.checked ? 'flex' : 'none';
      });

      this.btnResetProgress.addEventListener('click', () => {
        if (confirm('Reset all level progress and records?')) {
          localStorage.removeItem('sc2_unlocked');
          localStorage.removeItem('sc2_best_times');
          localStorage.removeItem('sc2_stars');
          this.unlockedLevels = 1;
          this.levelBestTimes = {};
          this.levelStars = {};
          this.openLevelSelect();
        }
      });

      // Victory Buttons
      this.btnVicNext.addEventListener('click', () => {
        this.hideModal(this.victoryModal);
        this.loadLevel((this.currentLevelIndex + 1) % LEVELS.length);
      });
      this.btnVicReplay.addEventListener('click', () => {
        this.hideModal(this.victoryModal);
        this.restartCurrentLevel();
      });
      this.btnVicMenu.addEventListener('click', () => {
        this.hideModal(this.victoryModal);
        this.returnToMenu();
      });

      // Mobile Touch Button Bindings
      this.setupTouchButton(this.btnTouchLeft, 'KeyA');
      this.setupTouchButton(this.btnTouchRight, 'KeyD');
      if (this.btnTouchRespawn) {
        this.btnTouchRespawn.addEventListener('click', () => {
          if (this.p1) this.p1.respawn();
        });
      }

      this.setupTouchButton(this.btnTouchLeftP2, 'ArrowLeft');
      this.setupTouchButton(this.btnTouchRightP2, 'ArrowRight');
      if (this.btnTouchRespawnP2) {
        this.btnTouchRespawnP2.addEventListener('click', () => {
          if (this.p2) this.p2.respawn();
        });
      }
    }

    setupTouchButton(btn, keyCode) {
      if (!btn) return;
      const start = (e) => { e.preventDefault(); this.keys[keyCode] = true; };
      const end = (e) => { e.preventDefault(); this.keys[keyCode] = false; };
      btn.addEventListener('pointerdown', start);
      btn.addEventListener('pointerup', end);
      btn.addEventListener('pointercancel', end);
    }

    showModal(modal) {
      modal.classList.remove('hidden');
    }

    hideModal(modal) {
      modal.classList.add('hidden');
    }

    showToast(text) {
      if (!this.gameToast) return;
      this.toastText.textContent = text;
      this.gameToast.classList.remove('hidden');
      clearTimeout(this.toastTimer);
      this.toastTimer = setTimeout(() => {
        this.gameToast.classList.add('hidden');
      }, 1400);
    }

    startNewGame(mode = '1P') {
      this.gameMode = mode;
      this.menuScreen.classList.add('hidden');
      this.hudModeTag.textContent = mode === '2P' ? '2P RACE' : 'LEVEL';

      if (mode === '2P') {
        this.raceBarHud.classList.remove('hidden');
        if (this.p2TouchControls) this.p2TouchControls.classList.remove('hidden');
      } else {
        this.raceBarHud.classList.add('hidden');
        if (this.p2TouchControls) this.p2TouchControls.classList.add('hidden');
      }

      this.sound.startBGM();
      this.loadLevel(0);
    }

    returnToMenu() {
      this.state = 'MENU';
      this.sound.stopBGM();
      this.menuScreen.classList.remove('hidden');
    }

    restartCurrentLevel() {
      this.loadLevel(this.currentLevelIndex);
    }

    loadLevel(index) {
      this.currentLevelIndex = index;
      const levelData = LEVELS[index];

      // Clone coins and checkpoints for fresh state
      this.activeLevel = JSON.parse(JSON.stringify(levelData));

      // Instantiate Player 1
      this.p1 = new Climber(1, this.activeLevel.startX, this.activeLevel.startY, false);
      this.p1.applyCustomization(this.equippedSkin, this.equippedPot, this.equippedAxe);

      // Instantiate Player 2 if in 2P mode
      if (this.gameMode === '2P') {
        this.p2 = new Climber(2, this.activeLevel.startX - 30, this.activeLevel.startY, true);
        this.p2.applyCustomization('blue', 'barrel', 'war_pick');
      } else {
        this.p2 = null;
      }

      this.hudLevelNum.textContent = (index + 1).toString();
      this.updateCheckpointHUD();
      this.levelStartTime = performance.now();
      this.elapsedLevelTime = 0;
      this.state = 'PLAYING';
    }

    updateCheckpointHUD() {
      if (!this.activeLevel) return;
      const total = this.activeLevel.checkpoints.length;
      const reached = this.activeLevel.checkpoints.filter(cp => cp.reached).length;
      this.hudCheckpoints.textContent = `${reached} / ${total}`;
    }

    openLevelSelect() {
      const grid = document.getElementById('levelSelectGrid');
      grid.innerHTML = '';

      LEVELS.forEach((lvl, idx) => {
        const isUnlocked = idx < this.unlockedLevels;
        const stars = this.levelStars[lvl.id] || 0;
        const bestTime = this.levelBestTimes[lvl.id];

        const tile = document.createElement('div');
        tile.className = `level-tile ${isUnlocked ? '' : 'locked'}`;
        tile.innerHTML = `
          <span class="tile-level-num">${lvl.id}</span>
          <span class="tile-stars">${isUnlocked ? '⭐'.repeat(stars) : '🔒'}</span>
          <span style="font-size: 10px; font-weight: 700; color: #64748b; margin-top: 2px;">
            ${bestTime ? bestTime.toFixed(1) + 's' : lvl.name}
          </span>
        `;

        if (isUnlocked) {
          tile.addEventListener('click', () => {
            this.hideModal(this.levelSelectModal);
            this.startNewGame('1P');
            this.loadLevel(idx);
          });
        }

        grid.appendChild(tile);
      });

      this.showModal(this.levelSelectModal);
    }

    openGarage() {
      const tabSkins = document.getElementById('tabSkins');
      const tabPots = document.getElementById('tabPots');
      const tabAxes = document.getElementById('tabAxes');
      let currentTab = 'skins';

      const renderTab = (tabName) => {
        currentTab = tabName;
        [tabSkins, tabPots, tabAxes].forEach(t => t.classList.remove('active'));
        if (tabName === 'skins') tabSkins.classList.add('active');
        if (tabName === 'pots') tabPots.classList.add('active');
        if (tabName === 'axes') tabAxes.classList.add('active');

        const grid = document.getElementById('garageItemsGrid');
        grid.innerHTML = '';

        const items = GARAGE_ITEMS[tabName];
        items.forEach((item) => {
          const isUnlocked = this.unlockedItems.includes(item.id) || item.price === 0;
          let isEquipped = false;
          if (tabName === 'skins') isEquipped = this.equippedSkin === item.id;
          if (tabName === 'pots') isEquipped = this.equippedPot === item.id;
          if (tabName === 'axes') isEquipped = this.equippedAxe === item.id;

          const card = document.createElement('div');
          card.className = `garage-card ${isEquipped ? 'equipped' : ''}`;
          card.innerHTML = `
            <span class="garage-item-emoji">${item.emoji}</span>
            <span class="garage-item-name">${item.name}</span>
            <span class="garage-item-status">
              ${isEquipped ? 'EQUIPPED' : (isUnlocked ? 'SELECT' : `${item.price} 🪙`)}
            </span>
          `;

          card.addEventListener('click', () => {
            if (isUnlocked) {
              if (tabName === 'skins') { this.equippedSkin = item.id; localStorage.setItem('sc2_skin', item.id); }
              if (tabName === 'pots') { this.equippedPot = item.id; localStorage.setItem('sc2_pot', item.id); }
              if (tabName === 'axes') { this.equippedAxe = item.id; localStorage.setItem('sc2_axe', item.id); }
              if (this.p1) this.p1.applyCustomization(this.equippedSkin, this.equippedPot, this.equippedAxe);
              renderTab(tabName);
            } else if (this.coins >= item.price) {
              this.coins -= item.price;
              this.unlockedItems.push(item.id);
              localStorage.setItem('sc2_unlocked_items', JSON.stringify(this.unlockedItems));
              this.updateCoinsDisplay();
              renderTab(tabName);
            } else {
              alert(`Not enough coins! Need ${item.price} 🪙.`);
            }
          });

          grid.appendChild(card);
        });
      };

      tabSkins.onclick = () => renderTab('skins');
      tabPots.onclick = () => renderTab('pots');
      tabAxes.onclick = () => renderTab('axes');

      renderTab('skins');
      this.showModal(this.garageModal);
    }

    handleLevelVictory(winningClimber) {
      this.state = 'VICTORY';
      const timeSec = this.elapsedLevelTime;
      const level = this.activeLevel;

      // Calculate Stars (1 to 3 stars based on par time)
      let stars = 1;
      if (timeSec <= level.parTime * 0.9) stars = 3;
      else if (timeSec <= level.parTime * 1.3) stars = 2;

      this.levelStars[level.id] = Math.max(this.levelStars[level.id] || 0, stars);
      localStorage.setItem('sc2_stars', JSON.stringify(this.levelStars));

      // Record best time
      const prevBest = this.levelBestTimes[level.id] || 999;
      if (timeSec < prevBest) {
        this.levelBestTimes[level.id] = timeSec;
        localStorage.setItem('sc2_best_times', JSON.stringify(this.levelBestTimes));
      }

      // Unlock next level
      if (this.currentLevelIndex + 1 >= this.unlockedLevels) {
        this.unlockedLevels = Math.min(LEVELS.length, this.currentLevelIndex + 2);
        localStorage.setItem('sc2_unlocked', this.unlockedLevels.toString());
      }

      // Coins reward
      const coinsReward = stars * 25;
      this.coins += coinsReward;
      this.updateCoinsDisplay();

      // Populate Victory Modal
      document.getElementById('vicTime').textContent = timeSec.toFixed(1) + 's';
      document.getElementById('vicCoins').textContent = `+${coinsReward} 🪙`;
      document.getElementById('vicBestTime').textContent = Math.min(timeSec, prevBest).toFixed(1) + 's';

      const vicStarsEl = document.getElementById('vicStars');
      vicStarsEl.innerHTML = '';
      for (let i = 0; i < 3; i++) {
        const s = document.createElement('span');
        s.textContent = i < stars ? '⭐' : '⚪';
        s.style.opacity = i < stars ? '1' : '0.3';
        vicStarsEl.appendChild(s);
      }

      const vic2PBanner = document.getElementById('vic2PBanner');
      if (this.gameMode === '2P') {
        vic2PBanner.classList.remove('hidden');
        document.getElementById('vic2PText').textContent =
          winningClimber.isP2 ? 'PLAYER 2 WINS THE RACE! 🔵' : 'PLAYER 1 WINS THE RACE! 🔴';
      } else {
        vic2PBanner.classList.add('hidden');
      }

      this.showModal(this.victoryModal);
    }

    loop(timestamp) {
      const dt = Math.min((timestamp - this.lastTimestamp) / 1000, 0.05);
      this.lastTimestamp = timestamp;

      // 1. Process Player Input
      if (this.state === 'PLAYING') {
        this.elapsedLevelTime = (performance.now() - this.levelStartTime) / 1000;
        this.hudTimer.textContent = this.formatTime(this.elapsedLevelTime);

        // Player 1 Input (A / D or Left / Right in 1P mode)
        if (this.p1) {
          const p1Left = !!(this.keys['KeyA'] || this.keys['KeyQ'] || (this.gameMode === '1P' && this.keys['ArrowLeft']));
          const p1Right = !!(this.keys['KeyD'] || (this.gameMode === '1P' && this.keys['ArrowRight']));
          this.p1.update(dt, this.activeLevel, this.sound, this.fx, p1Left, p1Right);
        }

        // Player 2 Input (ArrowLeft / ArrowRight)
        if (this.p2) {
          const p2Left = !!(this.keys['ArrowLeft']);
          const p2Right = !!(this.keys['ArrowRight']);
          this.p2.update(dt, this.activeLevel, this.sound, this.fx, p2Left, p2Right);
        }

        // Smooth Camera Follow
        const targetX = this.p2 ? (this.p1.x + this.p2.x) / 2 : this.p1.x;
        const targetY = this.p2 ? (this.p1.y + this.p2.y) / 2 : this.p1.y;

        const viewW = this.worldCanvas.width;
        const viewH = this.worldCanvas.height;

        this.cameraX += (targetX - viewW / 2 - this.cameraX) * 0.12;
        this.cameraY += (targetY - viewH / 2 - this.cameraY) * 0.12;

        // Update 2P Race Bar
        if (this.gameMode === '2P' && this.activeLevel) {
          const totalDist = this.activeLevel.goal.x - this.activeLevel.startX;
          const p1Pct = Math.max(0, Math.min(100, ((this.p1.x - this.activeLevel.startX) / totalDist) * 100));
          const p2Pct = Math.max(0, Math.min(100, ((this.p2.x - this.activeLevel.startX) / totalDist) * 100));
          if (this.raceMarkerP1) this.raceMarkerP1.style.left = `${p1Pct}%`;
          if (this.raceMarkerP2) this.raceMarkerP2.style.left = `${p2Pct}%`;
        }
      }

      // Update Particles
      this.fx.update(dt);

      // Render Everything
      this.render();

      // Render Mini Previews
      this.renderMenuPreview(timestamp);
      this.renderGaragePreview(timestamp);

      requestAnimationFrame(this.loop.bind(this));
    }

    formatTime(sec) {
      const m = Math.floor(sec / 60);
      const s = Math.floor(sec % 60);
      const ms = Math.floor((sec % 1) * 10);
      return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}.${ms}`;
    }

    render() {
      const w = this.worldCanvas.width;
      const h = this.worldCanvas.height;
      const theme = this.activeLevel ? this.activeLevel.theme : 'canyon';

      // 1. Draw Parallax Background
      this.bg.draw(this.cameraX, this.cameraY, theme);

      // 2. Clear & Draw Physics World
      this.ctx.clearRect(0, 0, w, h);

      if (this.state === 'PLAYING' || this.state === 'PAUSED' || this.state === 'VICTORY') {
        this.ctx.save();
        this.ctx.translate(-this.cameraX, -this.cameraY);

        // Draw Platforms
        for (const p of this.activeLevel.platforms) {
          this.drawPlatform(this.ctx, p, theme);
        }

        // Draw Spikes
        for (const sp of this.activeLevel.spikes) {
          this.drawSpikes(this.ctx, sp);
        }

        // Draw Springs
        for (const s of this.activeLevel.springs) {
          this.drawSpring(this.ctx, s);
        }

        // Draw Checkpoints
        for (const cp of this.activeLevel.checkpoints) {
          this.drawCheckpoint(this.ctx, cp);
        }

        // Draw Coins
        for (const c of this.activeLevel.coins) {
          if (!c.collected) this.drawCoin(this.ctx, c);
        }

        // Draw Goal Finish Flag
        this.drawGoalFlag(this.ctx, this.activeLevel.goal);

        // Draw Players
        if (this.p1) this.p1.draw(this.ctx);
        if (this.p2) this.p2.draw(this.ctx);

        this.ctx.restore();
      }

      // 3. Draw Particle FX
      this.fx.draw(this.cameraX, this.cameraY);
    }

    drawPlatform(ctx, p, theme) {
      ctx.save();
      // Drop Shadow
      ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
      ctx.shadowBlur = 14;
      ctx.shadowOffsetY = 6;

      // Platform Base
      ctx.fillStyle = theme === 'neon' ? '#1e1b4b' : (theme === 'castle' ? '#334155' : '#451a03');
      ctx.beginPath();
      ctx.roundRect(p.x, p.y, p.w, p.h, 6);
      ctx.fill();
      ctx.restore();

      // Top Trim Surface
      ctx.save();
      ctx.fillStyle = theme === 'neon' ? '#38bdf8' : (theme === 'castle' ? '#64748b' : '#16a34a');
      ctx.beginPath();
      ctx.roundRect(p.x, p.y, p.w, 10, [6, 6, 0, 0]);
      ctx.fill();

      // Rock bevel border
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 3;
      ctx.strokeRect(p.x, p.y, p.w, p.h);
      ctx.restore();
    }

    drawSpikes(ctx, sp) {
      ctx.save();
      ctx.fillStyle = '#ef4444';
      ctx.strokeStyle = '#7f1d1d';
      ctx.lineWidth = 2;

      const count = Math.max(2, Math.floor(sp.w / 18));
      const step = sp.w / count;

      for (let i = 0; i < count; i++) {
        const sx = sp.x + i * step;
        ctx.beginPath();
        ctx.moveTo(sx, sp.y + sp.h);
        ctx.lineTo(sx + step / 2, sp.y);
        ctx.lineTo(sx + step, sp.y + sp.h);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
      ctx.restore();
    }

    drawSpring(ctx, s) {
      ctx.save();
      ctx.fillStyle = '#facc15';
      ctx.strokeStyle = '#ca8a04';
      ctx.lineWidth = 2.5;

      // Spring coil base
      ctx.beginPath();
      ctx.roundRect(s.x - 20, s.y - 12, 40, 12, 4);
      ctx.fill();
      ctx.stroke();

      // Red/Yellow chevron warning stripes
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(s.x - 12, s.y - 10, 8, 8);
      ctx.fillRect(s.x + 4, s.y - 10, 8, 8);
      ctx.restore();
    }

    drawCheckpoint(ctx, cp) {
      ctx.save();
      // Pole
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(cp.x, cp.y);
      ctx.lineTo(cp.x, cp.y - 50);
      ctx.stroke();

      // Flag
      ctx.fillStyle = cp.reached ? '#22c55e' : '#ef4444';
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cp.x, cp.y - 50);
      ctx.lineTo(cp.x + 24, cp.y - 38);
      ctx.lineTo(cp.x, cp.y - 26);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    drawCoin(ctx, c) {
      ctx.save();
      ctx.fillStyle = '#facc15';
      ctx.strokeStyle = '#ca8a04';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(c.x, c.y, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#854d0e';
      ctx.font = '900 12px "Fredoka", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('$', c.x, c.y);
      ctx.restore();
    }

    drawGoalFlag(ctx, goal) {
      ctx.save();
      // Pole
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(goal.x, goal.y);
      ctx.lineTo(goal.x, goal.y - 65);
      ctx.stroke();

      // Checkered Flag
      const fx = goal.x, fy = goal.y - 65;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(fx, fy, 32, 22);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(fx, fy, 8, 11);
      ctx.fillRect(fx + 16, fy, 8, 11);
      ctx.fillRect(fx + 8, fy + 11, 8, 11);
      ctx.fillRect(fx + 24, fy + 11, 8, 11);

      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2;
      ctx.strokeRect(fx, fy, 32, 22);

      // Gold Trophy Top
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(goal.x, goal.y - 66, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Mini Live Preview on Main Menu
    renderMenuPreview(time) {
      if (!this.menuCtx) return;
      const ctx = this.menuCtx;
      const w = this.menuCanvas.width;
      const h = this.menuCanvas.height;
      ctx.clearRect(0, 0, w, h);

      ctx.save();
      ctx.translate(w / 2, h / 2 + 10);
      const angle = Math.sin(time * 0.003) * 1.2 - 0.3;

      // Dummy Climber in Menu
      const dummy = new Climber(99, 0, 0);
      dummy.axeAngle = angle;
      dummy.draw(ctx);
      ctx.restore();
    }

    // Live Interactive Preview in Garage
    renderGaragePreview(time) {
      if (!this.garageCtx) return;
      const ctx = this.garageCtx;
      const w = this.garageCanvas.width;
      const h = this.garageCanvas.height;
      ctx.clearRect(0, 0, w, h);

      ctx.save();
      ctx.translate(w / 2, h / 2 + 15);
      const angle = Math.sin(time * 0.0025) * 0.8 - 0.4;

      const previewClimber = new Climber(999, 0, 0);
      previewClimber.applyCustomization(this.equippedSkin, this.equippedPot, this.equippedAxe);
      previewClimber.axeAngle = angle;
      previewClimber.draw(ctx);
      ctx.restore();
    }
  }

  // Launch on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.game = new StickmanClimbGame(); });
  } else {
    window.game = new StickmanClimbGame();
  }
})();
