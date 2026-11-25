/* ==========================================================================
   DRAW THE ROAD - COMPLETE 2D PHYSICS & GAMEPLAY ENGINE
   Official Poki-style physics vehicle simulation, drawing system, and 20 stages
   ========================================================================== */

(function () {
  'use strict';

  // =========================================================================
  // 1. WEB AUDIO SYNTHESIZER
  // =========================================================================
  class AudioEngine {
    constructor() {
      this.ctx = null;
      this.soundEnabled = localStorage.getItem('dtr_sound') !== 'false';
      this.engineOsc = null;
      this.engineGain = null;
      this.drawOsc = null;
      this.drawGain = null;
    }

    init() {
      if (!this.ctx && (window.AudioContext || window.webkitAudioContext)) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioCtx();
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }

    toggle() {
      this.soundEnabled = !this.soundEnabled;
      localStorage.setItem('dtr_sound', this.soundEnabled.toString());
      if (!this.soundEnabled) {
        this.stopEngine();
        this.stopDraw();
      }
      return this.soundEnabled;
    }

    playClick() {
      if (!this.soundEnabled) return;
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(800, now + 0.04);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.05);
    }

    startDraw() {
      if (!this.soundEnabled) return;
      this.init();
      if (!this.ctx || this.drawOsc) return;
      try {
        const now = this.ctx.currentTime;
        this.drawOsc = this.ctx.createOscillator();
        this.drawGain = this.ctx.createGain();
        this.drawOsc.type = 'sawtooth';
        this.drawOsc.frequency.setValueAtTime(280, now);
        this.drawGain.gain.setValueAtTime(0.03, now);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1400, now);

        this.drawOsc.connect(filter);
        filter.connect(this.drawGain);
        this.drawGain.connect(this.ctx.destination);
        this.drawOsc.start(now);
      } catch (e) {}
    }

    modulateDraw(speed) {
      if (!this.drawOsc || !this.ctx) return;
      const freq = 220 + Math.min(300, speed * 0.8);
      this.drawOsc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    }

    stopDraw() {
      if (this.drawOsc) {
        try {
          this.drawOsc.stop();
          this.drawOsc.disconnect();
        } catch (e) {}
        this.drawOsc = null;
        this.drawGain = null;
      }
    }

    startEngine() {
      if (!this.soundEnabled) return;
      this.init();
      if (!this.ctx || this.engineOsc) return;
      try {
        const now = this.ctx.currentTime;
        this.engineOsc = this.ctx.createOscillator();
        this.engineGain = this.ctx.createGain();
        this.engineOsc.type = 'sawtooth';
        this.engineOsc.frequency.setValueAtTime(75, now);
        this.engineGain.gain.setValueAtTime(0.06, now);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(450, now);

        this.engineOsc.connect(filter);
        filter.connect(this.engineGain);
        this.engineGain.connect(this.ctx.destination);
        this.engineOsc.start(now);
      } catch (e) {}
    }

    updateEngine(speedRatio) {
      if (!this.engineOsc || !this.ctx) return;
      const freq = 65 + Math.min(160, speedRatio * 140);
      this.engineOsc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    }

    stopEngine() {
      if (this.engineOsc) {
        try {
          this.engineOsc.stop();
          this.engineOsc.disconnect();
        } catch (e) {}
        this.engineOsc = null;
        this.engineGain = null;
      }
    }

    playCoin() {
      if (!this.soundEnabled) return;
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      [987.77, 1318.51].forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const t = now + idx * 0.07;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0.18, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.25);
      });
    }

    playSpring() {
      if (!this.soundEnabled) return;
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.exponentialRampToValueAtTime(620, now + 0.25);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.3);
    }

    playExplosion() {
      if (!this.soundEnabled) return;
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const bufferSize = this.ctx.sampleRate * 0.4;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, now);
      filter.frequency.exponentialRampToValueAtTime(60, now + 0.4);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      noise.start(now);
    }

    playCrash() {
      if (!this.soundEnabled) return;
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(50, now + 0.35);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.35);
    }

    playVictory() {
      if (!this.soundEnabled) return;
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const chords = [523.25, 659.25, 783.99, 1046.50];
      chords.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const t = now + idx * 0.09;
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0.25, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.55);
      });
    }
  }

  // =========================================================================
  // 2. VEHICLE CATALOG & STATS
  // =========================================================================
  const VEHICLES = [
    {
      id: 'roadster',
      name: 'Red Roadster',
      price: 0,
      desc: 'Nimble and balanced sports car for all-round racing.',
      primaryColor: '#ef4444',
      accentColor: '#ffffff',
      windowColor: '#38bdf8',
      speed: 520,
      suspension: 65,
      grip: 85,
      mass: 40,
      wheelR: 14,
      wheelBase: 44,
      chassisW: 64,
      chassisH: 22,
      style: 'sports'
    },
    {
      id: 'taxi',
      name: 'City Taxi',
      price: 120,
      desc: 'Fast urban cruiser with high torque for quick acceleration.',
      primaryColor: '#facc15',
      accentColor: '#1e293b',
      windowColor: '#7dd3fc',
      speed: 550,
      suspension: 60,
      grip: 82,
      mass: 42,
      wheelR: 14,
      wheelBase: 46,
      chassisW: 66,
      chassisH: 24,
      style: 'taxi'
    },
    {
      id: 'buggy',
      name: 'Dune Buggy',
      price: 250,
      desc: 'High-travel suspension designed for wild jumps and steep cliffs.',
      primaryColor: '#0ea5e9',
      accentColor: '#f97316',
      windowColor: '#bae6fd',
      speed: 510,
      suspension: 90,
      grip: 88,
      mass: 38,
      wheelR: 16,
      wheelBase: 48,
      chassisW: 62,
      chassisH: 26,
      style: 'buggy'
    },
    {
      id: 'monster',
      name: 'Monster 4x4',
      price: 400,
      desc: 'Giant wheels and crushing power to conquer any terrain gap.',
      primaryColor: '#8b5cf6',
      accentColor: '#22c55e',
      windowColor: '#c084fc',
      speed: 490,
      suspension: 95,
      grip: 92,
      mass: 55,
      wheelR: 20,
      wheelBase: 52,
      chassisW: 70,
      chassisH: 30,
      style: 'monster'
    },
    {
      id: 'police',
      name: 'Police Interceptor',
      price: 600,
      desc: 'High-speed pursuit cruiser equipped with emergency siren flashers.',
      primaryColor: '#0f172a',
      accentColor: '#ffffff',
      windowColor: '#38bdf8',
      speed: 590,
      suspension: 75,
      grip: 88,
      mass: 44,
      wheelR: 15,
      wheelBase: 48,
      chassisW: 68,
      chassisH: 24,
      style: 'police'
    },
    {
      id: 'cyber',
      name: 'Cyber Racer',
      price: 900,
      desc: 'Futuristic hypercar with anti-roll gyro stabilizer and neon glow.',
      primaryColor: '#06b6d4',
      accentColor: '#ec4899',
      windowColor: '#f472b6',
      speed: 640,
      suspension: 85,
      grip: 96,
      mass: 36,
      wheelR: 15,
      wheelBase: 50,
      chassisW: 72,
      chassisH: 20,
      style: 'cyber'
    }
  ];

  // =========================================================================
  // 3. 20 HANDCRAFTED STAGES & OBSTACLE BLUEPRINTS
  // =========================================================================
  const LEVELS = [
    {
      id: 1,
      title: "First Bridge",
      hint: "Draw a simple road across the gap to reach the checkered flag!",
      inkBudget: 450,
      theme: 'plains',
      start: { x: 120, y: 380 },
      platforms: [
        { x: 0, y: 400, w: 220, h: 200 },
        { x: 480, y: 400, w: 320, h: 200 }
      ],
      coins: [{ x: 350, y: 340 }, { x: 520, y: 360 }],
      finish: { x: 680, y: 400 }
    },
    {
      id: 2,
      title: "The Step Down",
      hint: "Draw a gentle downward ramp so your car rolls smoothly!",
      inkBudget: 460,
      theme: 'plains',
      start: { x: 120, y: 300 },
      platforms: [
        { x: 0, y: 320, w: 200, h: 300 },
        { x: 440, y: 460, w: 340, h: 200 }
      ],
      coins: [{ x: 300, y: 360 }, { x: 380, y: 410 }, { x: 550, y: 420 }],
      finish: { x: 660, y: 460 }
    },
    {
      id: 3,
      title: "Spike Canyon",
      hint: "Avoid the sharp red spikes! Draw a curved bridge arched above them.",
      inkBudget: 500,
      theme: 'desert',
      start: { x: 120, y: 360 },
      platforms: [
        { x: 0, y: 380, w: 200, h: 250 },
        { x: 520, y: 380, w: 300, h: 250 }
      ],
      spikes: [
        { x: 260, y: 440, w: 60, h: 24 },
        { x: 340, y: 440, w: 60, h: 24 },
        { x: 420, y: 440, w: 60, h: 24 }
      ],
      coins: [{ x: 310, y: 300 }, { x: 390, y: 280 }, { x: 470, y: 300 }],
      finish: { x: 700, y: 380 }
    },
    {
      id: 4,
      title: "The High Pillar",
      hint: "Draw a ramp up and over the stone pillar to clear the gap.",
      inkBudget: 550,
      theme: 'plains',
      start: { x: 120, y: 420 },
      platforms: [
        { x: 0, y: 440, w: 180, h: 200 },
        { x: 340, y: 320, w: 90, h: 320 },
        { x: 580, y: 440, w: 260, h: 200 }
      ],
      coins: [{ x: 260, y: 370 }, { x: 385, y: 280 }, { x: 500, y: 370 }],
      finish: { x: 720, y: 440 }
    },
    {
      id: 5,
      title: "🎮 FREE DRIVE: Stunt Valley",
      hint: "Every 5th level is Free Drive! Use Arrow Keys / WASD or On-Screen Pedals to race!",
      inkBudget: 600,
      theme: 'canyon',
      isFreeDrive: true,
      start: { x: 100, y: 360 },
      platforms: [
        { x: 0, y: 380, w: 200, h: 250 },
        { x: 180, y: 380, w: 170, h: 24 },
        { x: 330, y: 380, w: 140, h: 260 },
        { x: 450, y: 380, w: 160, h: 24 },
        { x: 590, y: 380, w: 320, h: 250 }
      ],
      boosters: [{ x: 140, y: 370, w: 70, h: 18 }, { x: 480, y: 370, w: 70, h: 18 }],
      springs: [],
      coins: [{ x: 240, y: 330 }, { x: 390, y: 280 }, { x: 520, y: 330 }],
      finish: { x: 780, y: 380 }
    },
    {
      id: 6,
      title: "Spring Bouncer",
      hint: "Steer into the yellow spring pad to rocket over the chasm!",
      inkBudget: 420,
      theme: 'sunset',
      start: { x: 100, y: 360 },
      platforms: [
        { x: 0, y: 380, w: 180, h: 250 },
        { x: 580, y: 380, w: 280, h: 250 }
      ],
      springs: [{ x: 260, y: 420, w: 70, h: 20, force: 750 }],
      coins: [{ x: 320, y: 260 }, { x: 420, y: 230 }, { x: 520, y: 280 }],
      finish: { x: 720, y: 380 }
    },
    {
      id: 7,
      title: "TNT Alley",
      hint: "Explosive barrels! Draw your bridge high above the red TNT crates.",
      inkBudget: 550,
      theme: 'desert',
      start: { x: 100, y: 360 },
      platforms: [
        { x: 0, y: 380, w: 180, h: 250 },
        { x: 560, y: 380, w: 280, h: 250 }
      ],
      tnt: [{ x: 320, y: 420, r: 24 }, { x: 410, y: 420, r: 24 }],
      coins: [{ x: 280, y: 290 }, { x: 365, y: 270 }, { x: 450, y: 290 }],
      finish: { x: 720, y: 380 }
    },
    {
      id: 8,
      title: "The Wave",
      hint: "Rollercoaster dips! Build smooth curved slopes for speed.",
      inkBudget: 620,
      theme: 'plains',
      start: { x: 100, y: 320 },
      platforms: [
        { x: 0, y: 340, w: 160, h: 300 },
        { x: 620, y: 340, w: 240, h: 300 }
      ],
      coins: [{ x: 250, y: 380 }, { x: 390, y: 320 }, { x: 510, y: 380 }],
      finish: { x: 740, y: 340 }
    },
    {
      id: 9,
      title: "Steep Peak",
      hint: "Draw a steady, gradual incline so the engine doesn't stall.",
      inkBudget: 580,
      theme: 'canyon',
      start: { x: 100, y: 450 },
      platforms: [
        { x: 0, y: 470, w: 170, h: 200 },
        { x: 540, y: 240, w: 300, h: 420 }
      ],
      coins: [{ x: 260, y: 390 }, { x: 380, y: 310 }, { x: 470, y: 230 }],
      finish: { x: 720, y: 240 }
    },
    {
      id: 10,
      title: "🎮 FREE DRIVE: Turbo Skyway",
      hint: "Every 5th level is Free Drive! Race over moving sky platforms using Arrow Keys or Pedals!",
      inkBudget: 560,
      theme: 'sky',
      isFreeDrive: true,
      start: { x: 100, y: 360 },
      platforms: [
        { x: 0, y: 380, w: 190, h: 250 },
        { x: 180, y: 380, w: 160, h: 24 },
        { x: 460, y: 380, w: 170, h: 24 },
        { x: 610, y: 380, w: 260, h: 250 }
      ],
      movingPlatforms: [
        { x: 310, y: 380, w: 170, h: 28, minX: 300, maxX: 480, speed: 75 }
      ],
      boosters: [{ x: 120, y: 370, w: 70, h: 18 }, { x: 500, y: 370, w: 70, h: 18 }],
      coins: [{ x: 250, y: 320 }, { x: 390, y: 310 }, { x: 540, y: 320 }],
      finish: { x: 740, y: 380 }
    },
    {
      id: 11,
      title: "Spike Tunnel",
      hint: "Spikes above and below! Draw a flat straight line between them.",
      inkBudget: 520,
      theme: 'desert',
      start: { x: 100, y: 360 },
      platforms: [
        { x: 0, y: 380, w: 180, h: 250 },
        { x: 560, y: 380, w: 280, h: 250 }
      ],
      spikes: [
        { x: 260, y: 440, w: 140, h: 24 },
        { x: 320, y: 240, w: 120, h: 24, ceiling: true }
      ],
      coins: [{ x: 310, y: 350 }, { x: 380, y: 350 }, { x: 450, y: 350 }],
      finish: { x: 720, y: 380 }
    },
    {
      id: 12,
      title: "Turbo Booster",
      hint: "Green chevron boost pad will launch you at supersonic speed!",
      inkBudget: 460,
      theme: 'neon',
      start: { x: 100, y: 380 },
      platforms: [
        { x: 0, y: 400, w: 190, h: 250 },
        { x: 620, y: 400, w: 260, h: 250 }
      ],
      boosters: [{ x: 250, y: 420, w: 80, h: 22 }],
      coins: [{ x: 360, y: 320 }, { x: 460, y: 290 }, { x: 560, y: 340 }],
      finish: { x: 740, y: 400 }
    },
    {
      id: 13,
      title: "Triple Islands",
      hint: "Three tiny islands! Draw links connecting all of them safely.",
      inkBudget: 650,
      theme: 'sky',
      start: { x: 90, y: 360 },
      platforms: [
        { x: 0, y: 380, w: 140, h: 250 },
        { x: 250, y: 380, w: 70, h: 250 },
        { x: 410, y: 380, w: 70, h: 250 },
        { x: 580, y: 380, w: 260, h: 250 }
      ],
      coins: [{ x: 200, y: 340 }, { x: 360, y: 340 }, { x: 520, y: 340 }],
      finish: { x: 720, y: 380 }
    },
    {
      id: 14,
      title: "Crusher Gate",
      hint: "Watch out for the vertical crusher pillar moving up and down!",
      inkBudget: 540,
      theme: 'canyon',
      start: { x: 100, y: 380 },
      platforms: [
        { x: 0, y: 400, w: 200, h: 250 },
        { x: 560, y: 400, w: 280, h: 250 }
      ],
      crushers: [{ x: 370, y: 200, w: 50, h: 180, minY: 150, maxY: 340, speed: 110 }],
      coins: [{ x: 270, y: 360 }, { x: 460, y: 360 }],
      finish: { x: 720, y: 400 }
    },
    {
      id: 15,
      title: "🎮 FREE DRIVE: Mega Stunt Highway",
      hint: "Every 5th level is Free Drive! Floor the accelerator and tilt in mid-air for a clean landing!",
      inkBudget: 480,
      theme: 'sunset',
      isFreeDrive: true,
      start: { x: 100, y: 320 },
      platforms: [
        { x: 0, y: 340, w: 200, h: 300 },
        { x: 180, y: 360, w: 180, h: 24 },
        { x: 340, y: 380, w: 180, h: 24 },
        { x: 500, y: 400, w: 180, h: 24 },
        { x: 660, y: 400, w: 280, h: 250 }
      ],
      boosters: [{ x: 140, y: 330, w: 70, h: 18 }, { x: 360, y: 370, w: 70, h: 18 }],
      springs: [],
      coins: [{ x: 270, y: 320 }, { x: 420, y: 340 }, { x: 570, y: 360 }],
      finish: { x: 800, y: 400 }
    },
    {
      id: 16,
      title: "Minefield Bounce",
      hint: "TNT surrounds the pit! Bounce off the spring pad over them.",
      inkBudget: 460,
      theme: 'desert',
      start: { x: 100, y: 360 },
      platforms: [
        { x: 0, y: 380, w: 160, h: 250 },
        { x: 620, y: 380, w: 260, h: 250 }
      ],
      tnt: [{ x: 260, y: 430, r: 24 }, { x: 490, y: 430, r: 24 }],
      springs: [{ x: 370, y: 410, w: 60, h: 22, force: 820 }],
      coins: [{ x: 310, y: 300 }, { x: 430, y: 240 }, { x: 550, y: 300 }],
      finish: { x: 740, y: 380 }
    },
    {
      id: 17,
      title: "The Floating Ladder",
      hint: "Staggered ledges climbing upwards. Draw a zig-zag ramp.",
      inkBudget: 620,
      theme: 'sky',
      start: { x: 100, y: 450 },
      platforms: [
        { x: 0, y: 470, w: 160, h: 200 },
        { x: 280, y: 360, w: 100, h: 30 },
        { x: 480, y: 260, w: 100, h: 30 },
        { x: 660, y: 190, w: 220, h: 480 }
      ],
      coins: [{ x: 220, y: 400 }, { x: 420, y: 300 }, { x: 600, y: 210 }],
      finish: { x: 760, y: 190 }
    },
    {
      id: 18,
      title: "High Altitude Trampoline",
      hint: "Use spring pads to launch into the clouds!",
      inkBudget: 500,
      theme: 'sky',
      start: { x: 100, y: 360 },
      platforms: [
        { x: 0, y: 380, w: 160, h: 250 },
        { x: 380, y: 260, w: 80, h: 28 },
        { x: 620, y: 380, w: 260, h: 250 }
      ],
      springs: [{ x: 240, y: 410, w: 70, h: 22, force: 780 }],
      coins: [{ x: 310, y: 250 }, { x: 420, y: 210 }, { x: 540, y: 290 }],
      finish: { x: 740, y: 380 }
    },
    {
      id: 19,
      title: "Loop & Hazard",
      hint: "Draw a bold loop path with enough slope to keep momentum.",
      inkBudget: 680,
      theme: 'neon',
      start: { x: 100, y: 380 },
      platforms: [
        { x: 0, y: 400, w: 180, h: 250 },
        { x: 640, y: 400, w: 260, h: 250 }
      ],
      spikes: [{ x: 300, y: 460, w: 160, h: 24 }],
      boosters: [{ x: 210, y: 420, w: 70, h: 20 }],
      coins: [{ x: 350, y: 280 }, { x: 430, y: 260 }, { x: 530, y: 320 }],
      finish: { x: 760, y: 400 }
    },
    {
      id: 20,
      title: "🎮 FREE DRIVE: Grand Gauntlet",
      hint: "The Grand Finale! Speed boosters, moving bridges and loops — drive to glory!",
      inkBudget: 750,
      theme: 'neon',
      isFreeDrive: true,
      start: { x: 90, y: 400 },
      platforms: [
        { x: 0, y: 420, w: 180, h: 250 },
        { x: 160, y: 410, w: 150, h: 24 },
        { x: 440, y: 370, w: 150, h: 24 },
        { x: 660, y: 370, w: 280, h: 290 }
      ],
      movingPlatforms: [
        { x: 290, y: 390, w: 170, h: 26, minX: 270, maxX: 460, speed: 85 }
      ],
      boosters: [{ x: 110, y: 410, w: 70, h: 18 }, { x: 490, y: 360, w: 70, h: 18 }],
      springs: [{ x: 210, y: 400, w: 60, h: 20, force: 750 }],
      coins: [{ x: 240, y: 320 }, { x: 370, y: 270 }, { x: 540, y: 300 }],
      finish: { x: 800, y: 370 }
    }
  ];

  // =========================================================================
  // 4. MAIN GAME ENGINE CLASS
  // =========================================================================
  class DrawTheRoadGame {
    constructor() {
      // DOM Elements
      this.canvas = document.getElementById('gameCanvas');
      this.ctx = this.canvas.getContext('2d');
      this.menuCarCanvas = document.getElementById('menuCarCanvas');
      this.menuCarCtx = this.menuCarCanvas?.getContext('2d');
      this.garagePreviewCanvas = document.getElementById('garagePreviewCanvas');
      this.garagePreviewCtx = this.garagePreviewCanvas?.getContext('2d');

      // Screens & Modals
      this.menuScreen = document.getElementById('menuScreen');
      this.gameHud = document.getElementById('gameHud');
      this.victoryModal = document.getElementById('victoryModal');
      this.defeatModal = document.getElementById('defeatModal');
      this.levelSelectModal = document.getElementById('levelSelectModal');
      this.garageModal = document.getElementById('garageModal');
      this.howToModal = document.getElementById('howToModal');
      this.drawHintToast = document.getElementById('drawHintToast');
      this.hintText = document.getElementById('hintText');

      // Audio & Systems
      this.sound = new AudioEngine();

      // State & Progress
      this.state = 'MENU'; // 'MENU' | 'DRAWING' | 'DRIVING' | 'VICTORY' | 'DEFEAT'
      this.currentLevel = parseInt(localStorage.getItem('dtr_current_level') || '1', 10);
      this.unlockedLevel = parseInt(localStorage.getItem('dtr_unlocked_level') || '1', 10);
      this.coins = parseInt(localStorage.getItem('dtr_coins') || '0', 10);
      this.levelStars = JSON.parse(localStorage.getItem('dtr_stars') || '{}');
      this.unlockedVehicles = JSON.parse(localStorage.getItem('dtr_unlocked_vehicles') || '["roadster"]');
      this.equippedVehicleId = localStorage.getItem('dtr_equipped_vehicle') || 'roadster';

      // Drawing Data
      this.drawnPoints = [];
      this.isDrawing = false;
      this.inkRemaining = 1.0;
      this.maxInkLength = 500;
      this.totalDrawnLength = 0;
      this.lastPointer = { x: 0, y: 0 };

      // Physics World State
      this.car = null;
      this.stagePlatforms = [];
      this.stageSpikes = [];
      this.stageSprings = [];
      this.stageBoosters = [];
      this.stageTnt = [];
      this.stageMovingPlatforms = [];
      this.stageCrushers = [];
      this.stageCoins = [];
      this.stageFinish = null;

      // Particles & VFX
      this.particles = [];
      this.confetti = [];
      this.tireSkids = [];
      this.camera = { x: 0, y: 0, zoom: 1, targetX: 0, targetY: 0 };
      this.shake = 0;
      this.levelStartTime = 0;
      this.stuckTimer = 0;

      // Direct Driving Input & Mode
      this.input = { left: false, right: false, boost: false };
      this.isFreeDrive = false;

      // Initialize
      this.initEvents();
      this.resize();
      this.updateCoinDisplays();
      this.renderLevelGrid();
      this.renderGarageGrid();
      this.updateMenuCarPreview();

      // Start RAF Loop
      this.lastTime = performance.now();
      requestAnimationFrame(this.loop.bind(this));
    }

    getEquippedVehicle() {
      return VEHICLES.find(v => v.id === this.equippedVehicleId) || VEHICLES[0];
    }

    resize() {
      this.dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.viewW = window.innerWidth;
      this.viewH = window.innerHeight;
      this.canvas.width = Math.round(this.viewW * this.dpr);
      this.canvas.height = Math.round(this.viewH * this.dpr);
    }

    updateCoinDisplays() {
      const el1 = document.getElementById('menuCoinBalance');
      const el2 = document.getElementById('hudCoinsText');
      const el3 = document.getElementById('garageCoinsText');
      if (el1) el1.textContent = this.coins.toLocaleString();
      if (el2) el2.textContent = this.coins.toLocaleString();
      if (el3) el3.textContent = this.coins.toLocaleString();
    }

    // =======================================================================
    // 5. STAGE LOADING & INITIALIZATION
    // =========================================================================
    loadLevel(lvlIndex) {
      this.currentLevel = Math.max(1, Math.min(LEVELS.length, lvlIndex));
      localStorage.setItem('dtr_current_level', this.currentLevel.toString());

      const stage = LEVELS[this.currentLevel - 1];
      this.maxInkLength = stage.inkBudget || 500;
      this.inkRemaining = 1.0;
      this.totalDrawnLength = 0;
      this.drawnPoints = [];
      this.isDrawing = false;
      this.particles = [];
      this.confetti = [];
      this.tireSkids = [];
      this.stuckTimer = 0;
      this.levelStartTime = performance.now();

      // Clone Stage Objects
      this.stagePlatforms = JSON.parse(JSON.stringify(stage.platforms || []));
      this.stageSpikes = JSON.parse(JSON.stringify(stage.spikes || []));
      this.stageSprings = JSON.parse(JSON.stringify(stage.springs || []));
      this.stageBoosters = JSON.parse(JSON.stringify(stage.boosters || []));
      this.stageTnt = (stage.tnt || []).map(t => ({ ...t, exploded: false }));
      this.stageMovingPlatforms = (stage.movingPlatforms || []).map(m => ({ ...m, curX: m.x }));
      this.stageCrushers = (stage.crushers || []).map(c => ({ ...c, curY: c.y, dir: 1 }));
      this.stageCoins = (stage.coins || []).map(c => ({ x: c.x, y: c.y, collected: false, spin: Math.random() * Math.PI }));
      this.stageFinish = { ...stage.finish };

      // Initialize Car Entity
      const v = this.getEquippedVehicle();
      const firstPlat = stage.platforms[0];
      const startX = stage.start.x;
      const startY = firstPlat ? (firstPlat.y - v.wheelR - 12) : stage.start.y;

      this.car = {
        x: startX,
        y: startY,
        vx: 0,
        vy: 0,
        angle: 0,
        angularVelocity: 0,
        spec: v,
        rearWheel: { x: startX - v.wheelBase / 2, y: startY + 12, vx: 0, vy: 0, grounded: true, rot: 0 },
        frontWheel: { x: startX + v.wheelBase / 2, y: startY + 12, vx: 0, vy: 0, grounded: true, rot: 0 },
        isCrashed: false,
        isFinished: false,
        driveActive: false
      };

      // Camera init
      this.camera.x = startX;
      this.camera.y = startY;
      this.camera.targetX = startX;
      this.camera.targetY = startY;

      // Update HUD
      document.getElementById('hudLevelText').textContent = `LEVEL ${this.currentLevel}`;
      this.updateInkBar();
      document.getElementById('btnDriveText').textContent = 'DRIVE!';

      // Direct car key controller visible on ALL levels
      this.isFreeDrive = (this.currentLevel % 5 === 0) || !!stage.isFreeDrive;
      const driveOverlay = document.getElementById('driveControlsOverlay');
      const inkPctText = document.getElementById('inkPctText');

      if (driveOverlay) driveOverlay.classList.remove('hidden');
      if (this.isFreeDrive && inkPctText) {
        inkPctText.textContent = 'FREE DRIVE';
      }

      // Show Hint Toast
      if (this.drawHintToast) {
        if (this.isFreeDrive) {
          this.hintText.textContent = stage.hint || `🎮 LEVEL ${this.currentLevel}: FREE DRIVE! Use Arrow Keys / WASD or On-Screen Pedals!`;
        } else {
          this.hintText.textContent = stage.hint || 'Draw a road to the finish line!';
        }
        this.drawHintToast.classList.remove('hidden');
        setTimeout(() => {
          if (this.drawHintToast) this.drawHintToast.classList.add('hidden');
        }, 4200);
      }

      this.state = 'DRAWING';
      this.menuScreen.classList.add('hidden');
      this.victoryModal.classList.add('hidden');
      this.defeatModal.classList.add('hidden');
      this.gameHud.classList.remove('hidden');

      // Auto-start drive on Free Drive levels so player can steer immediately without drawing
      if (this.isFreeDrive) {
        setTimeout(() => {
          if (this.state === 'DRAWING' && this.isFreeDrive) {
            this.startDrive();
          }
        }, 300);
      }
    }

    startDrive() {
      if (!this.car || this.state === 'VICTORY' || this.state === 'DEFEAT') return;
      if (this.state === 'DRIVING') {
        this.loadLevel(this.currentLevel);
        return;
      }
      this.sound.playClick();
      this.sound.startEngine();
      this.state = 'DRIVING';
      this.car.driveActive = true;
      this.car.vx = 0; // Starts at rest: drives ONLY when arrow key / pedal is pressed!
      const btnDriveText = document.getElementById('btnDriveText');
      if (btnDriveText) btnDriveText.textContent = 'RETRY';

      // Always show direct controls while driving
      const driveOverlay = document.getElementById('driveControlsOverlay');
      if (driveOverlay) driveOverlay.classList.remove('hidden');
    }

    // =======================================================================
    // 6. DRAWING ROAD MECHANICS
    // =========================================================================
    handlePointerDown(x, y) {
      if (this.state !== 'DRAWING') return;
      this.isDrawing = true;
      this.lastPointer = { x, y };

      if (this.drawnPoints.length === 0) {
        this.drawnPoints.push({ x, y });
      }
      this.sound.startDraw();
    }

    handlePointerMove(x, y) {
      if (!this.isDrawing || this.state !== 'DRAWING') return;

      const dx = x - this.lastPointer.x;
      const dy = y - this.lastPointer.y;
      const dist = Math.hypot(dx, dy);

      if (dist >= 9) {
        if (this.totalDrawnLength + dist <= this.maxInkLength) {
          this.totalDrawnLength += dist;
          this.drawnPoints.push({ x, y });
          this.lastPointer = { x, y };
          this.updateInkBar();
          this.sound.modulateDraw(dist);

          // Add pencil dust particles
          if (Math.random() < 0.35) {
            this.particles.push({
              x: x + (Math.random() - 0.5) * 6,
              y: y + (Math.random() - 0.5) * 6,
              vx: (Math.random() - 0.5) * 20,
              vy: (Math.random() - 0.5) * 20,
              r: Math.random() * 3 + 2,
              color: '#facc15',
              alpha: 0.8,
              life: 0.35
            });
          }
        } else {
          this.isDrawing = false;
          this.sound.stopDraw();
        }
      }
    }

    handlePointerUp() {
      if (this.isDrawing) {
        this.isDrawing = false;
        this.sound.stopDraw();

        // If player has drawn a bridge line, automatically start driving!
        if (this.drawnPoints.length >= 2 && this.totalDrawnLength > 20 && this.state === 'DRAWING') {
          setTimeout(() => {
            if (this.state === 'DRAWING') {
              this.startDrive();
            }
          }, 180);
        }
      }
    }

    clearDrawnRoad() {
      this.sound.playClick();
      this.drawnPoints = [];
      this.totalDrawnLength = 0;
      this.updateInkBar();
    }

    updateInkBar() {
      const remaining = Math.max(0, 1 - (this.totalDrawnLength / this.maxInkLength));
      this.inkRemaining = remaining;
      const pct = Math.round(remaining * 100);

      const bar = document.getElementById('inkBarFill');
      const text = document.getElementById('inkPctText');
      if (text) text.textContent = `${pct}%`;

      if (bar) {
        bar.style.width = `${pct}%`;
        if (pct > 50) {
          bar.style.background = 'linear-gradient(90deg, #10b981 0%, #22c55e 100%)';
        } else if (pct > 20) {
          bar.style.background = 'linear-gradient(90deg, #f59e0b 0%, #eab308 100%)';
        } else {
          bar.style.background = 'linear-gradient(90deg, #ef4444 0%, #dc2626 100%)';
        }
      }
    }

    // =======================================================================
    // 7. 2D VEHICLE PHYSICS SIMULATION
    // =========================================================================
    updatePhysics(dt) {
      if (!this.car || this.state !== 'DRIVING') return;

      const c = this.car;
      const v = c.spec;

      // Update Moving Platforms & Obstacles
      for (const mp of this.stageMovingPlatforms) {
        mp.curX += (mp.speed || 80) * dt;
        if (mp.curX > mp.maxX) { mp.curX = mp.maxX; mp.speed = -Math.abs(mp.speed); }
        if (mp.curX < mp.minX) { mp.curX = mp.minX; mp.speed = Math.abs(mp.speed); }
      }

      for (const cr of this.stageCrushers) {
        cr.curY += cr.dir * (cr.speed || 100) * dt;
        if (cr.curY > cr.maxY) { cr.curY = cr.maxY; cr.dir = -1; }
        if (cr.curY < cr.minY) { cr.curY = cr.minY; cr.dir = 1; }
      }

      // Coin pickups
      for (const coin of this.stageCoins) {
        if (!coin.collected) {
          coin.spin += dt * 3.5;
          const dist = Math.hypot(c.x - coin.x, c.y - coin.y);
          if (dist < 32) {
            coin.collected = true;
            this.coins += 20;
            localStorage.setItem('dtr_coins', this.coins.toString());
            this.updateCoinDisplays();
            this.sound.playCoin();

            // Gold sparkles
            for (let i = 0; i < 14; i++) {
              const a = Math.random() * Math.PI * 2;
              const s = Math.random() * 120 + 40;
              this.particles.push({
                x: coin.x,
                y: coin.y,
                vx: Math.cos(a) * s,
                vy: Math.sin(a) * s,
                r: Math.random() * 3 + 2,
                color: '#facc15',
                alpha: 1.0,
                life: 0.5
              });
            }
          }
        }
      }

      if (c.isCrashed || c.isFinished) return;

      // Gravity
      const gravity = 880;
      c.vy += gravity * dt;

      // Forward Motor Torque
      const motorAccel = v.speed * (v.grip / 80);
      const forwardX = Math.cos(c.angle);
      const forwardY = Math.sin(c.angle);

      // Check Wheel Ground Contacts
      const wheels = [c.rearWheel, c.frontWheel];
      const halfBase = v.wheelBase / 2;
      const cosA = Math.cos(c.angle);
      const sinA = Math.sin(c.angle);
      const targetWheelOffsets = [
        { dx: -halfBase * cosA - 12 * sinA, dy: -halfBase * sinA + 12 * cosA },
        { dx:  halfBase * cosA - 12 * sinA, dy:  halfBase * sinA + 12 * cosA }
      ];

      let anyGrounded = false;
      let groundHits = 0;
      let avgSlope = 0;

      wheels.forEach((w, idx) => {
        const targetPos = {
          x: c.x + targetWheelOffsets[idx].dx,
          y: c.y + targetWheelOffsets[idx].dy
        };

        // Query collision with terrain, drawn road, moving platforms
        const col = this.checkSurfaceCollision(targetPos.x, targetPos.y, v.wheelR);

        if (col.hit) {
          w.grounded = true;
          anyGrounded = true;
          groundHits++;
          avgSlope += (col.slopeAngle !== undefined ? col.slopeAngle : 0);

          // Direct position penetration resolution (prevents sinking into surface, clamped to prevent catapulting)
          const maxPush = Math.min(col.depth, 5.0);
          const pushFraction = 0.55;
          c.y += col.normalY * maxPush * pushFraction;
          c.x += col.normalX * maxPush * 0.15;

          // Absorb downward velocity into ground
          if (c.vy > 0 && col.normalY < -0.3) {
            c.vy = Math.min(0, c.vy * -0.1);
          }

          // Traction & Forward Drive
          const driveAngle = col.slopeAngle !== undefined ? col.slopeAngle : c.angle;
          const driveX = Math.cos(driveAngle);
          const driveY = Math.sin(driveAngle);

          // Wheel spin visual based on actual car velocity
          w.rot += (c.vx * dt) / v.wheelR;

          // Tire smoke puff when driving forward
          if (this.input.right && Math.abs(c.vx) > 120 && Math.random() < 0.25) {
            this.particles.push({
              x: w.x,
              y: w.y + v.wheelR,
              vx: -driveX * 30 + (Math.random() - 0.5) * 15,
              vy: -15 + (Math.random() - 0.5) * 10,
              r: Math.random() * 4 + 3,
              color: 'rgba(255, 255, 255, 0.7)',
              alpha: 0.7,
              life: 0.35
            });
          }
        } else {
          w.grounded = false;
        }

        w.x = targetPos.x;
        w.y = targetPos.y;
      });

      // Align vehicle chassis smoothly to terrain slope
      if (groundHits > 0) {
        const targetAng = avgSlope / groundHits;
        let diff = targetAng - c.angle;
        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;
        c.angle += diff * 12 * dt;
        c.angularVelocity *= 0.5;
      } else {
        // Natural air self-righting (levels car out)
        c.angle += (0 - c.angle) * 1.5 * dt;
        c.angularVelocity *= Math.exp(-2.5 * dt);
      }

      // ARROW KEY / PEDAL CONTROLS:
      // Pressing arrow key moves car forward; releasing it STOPS the car completely!
      const isGas = this.input.right;
      const isReverse = this.input.left;
      const isBoost = this.input.boost;

      if (isBoost) {
        c.vx += 880 * dt;
        // Nitro flame exhaust particles
        if (Math.random() < 0.5) {
          this.particles.push({
            x: c.x - Math.cos(c.angle) * (v.chassisW / 2 + 8),
            y: c.y - Math.sin(c.angle) * (v.chassisW / 2 + 8) + 4,
            vx: -Math.cos(c.angle) * 140 + (Math.random() - 0.5) * 25,
            vy: -Math.sin(c.angle) * 140 + (Math.random() - 0.5) * 25,
            r: Math.random() * 4 + 3,
            color: '#38bdf8',
            alpha: 1,
            life: 0.25
          });
        }
      }

      if (isGas) {
        // Accelerate forward along road slope
        if (anyGrounded) {
          c.vx += Math.cos(c.angle) * 820 * dt;
          c.vy += Math.sin(c.angle) * 820 * dt * 0.4;
        } else {
          // Mid-air pitch down
          c.angularVelocity += 3.5 * dt;
          c.vx += 160 * dt;
        }
      } else if (isReverse) {
        // Reverse / Brake
        if (anyGrounded) {
          c.vx -= 750 * dt;
        } else {
          // Mid-air pitch up (prevent nose dive crashes)
          c.angularVelocity -= 4.5 * dt;
        }
      } else if (!isBoost) {
        // ARROW KEY RELEASED: Rapidly decelerate to a complete stop!
        if (anyGrounded) {
          c.vx *= Math.exp(-6.5 * dt);
          if (Math.abs(c.vx) < 12) c.vx = 0;
        } else {
          c.vx *= Math.exp(-1.5 * dt);
        }
      }

      // Drag on velocity
      c.vx *= Math.exp(-0.25 * dt);
      c.vy *= Math.exp(-0.15 * dt);
      c.angularVelocity *= Math.exp(-4.0 * dt);

      // Integrate velocities
      c.x += c.vx * dt;
      c.y += c.vy * dt;
      c.angle += c.angularVelocity * dt;

      // Update sound engine pitch
      const speed = Math.hypot(c.vx, c.vy);
      if (isGas || isBoost) {
        this.sound.updateEngine(Math.min(1.4, speed / v.speed + 0.35));
      } else if (isReverse) {
        this.sound.updateEngine(0.5);
      } else {
        // Idle/stopped sound when arrow key is released
        this.sound.updateEngine(speed > 15 ? 0.25 : 0.08);
      }

      // Check Spring Pads
      for (const sp of this.stageSprings) {
        if (sp.cooldown > 0) sp.cooldown -= dt;
        if (c.x >= sp.x && c.x <= sp.x + sp.w && Math.abs(c.y + 12 - sp.y) < 28) {
          if (!sp.cooldown || sp.cooldown <= 0) {
            sp.cooldown = 0.5;
            c.vy = -Math.min(sp.force, 540);
            c.vx = Math.min(v.speed * 1.15, c.vx + 60);
            this.sound.playSpring();
            this.shake = 10;
            // Spring particles
            for (let i = 0; i < 10; i++) {
              this.particles.push({
                x: sp.x + sp.w / 2,
                y: sp.y,
                vx: (Math.random() - 0.5) * 80,
                vy: -Math.random() * 120 - 40,
                r: 3,
                color: '#facc15',
                alpha: 1,
                life: 0.4
              });
            }
          }
        }
      }

      // Check Speed Boosters
      for (const b of this.stageBoosters) {
        if (b.cooldown > 0) b.cooldown -= dt;
        if (c.x >= b.x && c.x <= b.x + b.w && Math.abs(c.y - b.y) < 32) {
          if (!b.cooldown || b.cooldown <= 0) {
            b.cooldown = 0.6;
            c.vx = Math.min(v.speed * 1.25, Math.max(c.vx + 140, 360));
            this.shake = 8;
          }
        }
      }

      // Clamp forward velocity to prevent cosmic escape velocity
      c.vx = Math.min(v.speed * 1.35, Math.max(-200, c.vx));

      // Check Spikes
      for (const spk of this.stageSpikes) {
        const topY = spk.ceiling ? spk.y + spk.h : spk.y;
        if (c.x >= spk.x - 14 && c.x <= spk.x + spk.w + 14 && Math.abs(c.y - topY) < 24) {
          this.triggerCrash("You hit sharp spike traps!");
          return;
        }
      }

      // Check TNT
      for (const tnt of this.stageTnt) {
        if (!tnt.exploded) {
          const dist = Math.hypot(c.x - tnt.x, c.y - tnt.y);
          if (dist < tnt.r + 26) {
            tnt.exploded = true;
            this.sound.playExplosion();
            this.shake = 26;
            this.triggerCrash("TNT explosive barrel detonated!");
            return;
          }
        }
      }

      // Check Crushers
      for (const cr of this.stageCrushers) {
        if (c.x >= cr.x - 18 && c.x <= cr.x + cr.w + 18 && c.y >= cr.curY && c.y <= cr.curY + cr.h) {
          this.triggerCrash("Crushed under the gate!");
          return;
        }
      }

      // Check Fall into Abyss
      if (c.y > 650) {
        this.triggerCrash("Your car fell into the canyon!");
        return;
      }

      // Check Upside Down Rollover Stuck
      const isRolledOver = Math.abs(c.angle) > (Math.PI * 0.65);
      if (isRolledOver && anyGrounded && Math.abs(c.vx) < 35) {
        this.stuckTimer += dt;
        if (this.stuckTimer > 1.4) {
          this.triggerCrash("Your car flipped upside down!");
          return;
        }
      } else {
        this.stuckTimer = 0;
      }

      // Check Finish Line & Platform Landing
      // The car MUST physically land on the deck and cross the finish line to complete the level.
      // If the car overshoots the platform into empty air or the sky, it fails instead of winning.
      if (this.stageFinish) {
        const f = this.stageFinish;
        const finishPlat = this.stagePlatforms.find(p => f.x >= p.x && f.x <= p.x + p.w);
        const platY = finishPlat ? finishPlat.y : f.y;
        const platRight = finishPlat ? (finishPlat.x + finishPlat.w) : (f.x + 120);

        // 1. Overshot platform edge into canyon/sky check
        if (c.x > platRight + 25) {
          this.triggerCrash("You overshot the finish platform!");
          return;
        }

        // 2. Strict deck contact (wheels physically touching finish platform deck)
        const wheelBottomY = c.y + 12 + v.wheelR;
        const isLandedOnDeck = anyGrounded && (Math.abs(wheelBottomY - platY) <= 15 || Math.abs(c.y - (platY - 12 - v.wheelR)) <= 16);

        // 3. Car at or crossing finish line on the platform
        const isAtFinish = (c.x >= f.x - 5) && (c.x <= platRight);

        // 4. Must not be airborne / soaring in the sky (must be settled on the deck)
        const notAirborne = Math.abs(c.vy) < 160 && Math.abs(c.angle) < 0.65;

        if (isLandedOnDeck && isAtFinish && notAirborne) {
          this.triggerVictory();
          return;
        }
      }
    }

    checkSurfaceCollision(px, py, radius) {
      let deepest = { hit: false, depth: 0, normalX: 0, normalY: -1, slopeAngle: 0 };

      // 1. Static Platforms (Solid flat top surfaces)
      for (const p of this.stagePlatforms) {
        if (px >= p.x - radius && px <= p.x + p.w + radius) {
          const surfaceY = p.y;
          if (py + radius >= surfaceY && py - radius <= surfaceY + 32) {
            const depth = (py + radius) - surfaceY;
            if (depth > deepest.depth) {
              deepest = { hit: true, depth, normalX: 0, normalY: -1, slopeAngle: 0 };
            }
          }
        }
      }

      // 2. Moving Platforms
      for (const mp of this.stageMovingPlatforms) {
        if (px >= mp.curX - radius && px <= mp.curX + mp.w + radius) {
          const surfaceY = mp.y;
          if (py + radius >= surfaceY && py - radius <= surfaceY + 32) {
            const depth = (py + radius) - surfaceY;
            if (depth > deepest.depth) {
              deepest = { hit: true, depth, normalX: 0, normalY: -1, slopeAngle: 0 };
            }
          }
        }
      }

      // 3. Hand-Drawn Road Segments (Line to Circle collision)
      const pts = this.drawnPoints;
      const roadRadius = 10; // road half thickness

      for (let i = 0; i < pts.length - 1; i++) {
        const p1 = pts[i];
        const p2 = pts[i + 1];

        const lineDx = p2.x - p1.x;
        const lineDy = p2.y - p1.y;
        const lineLenSq = lineDx * lineDx + lineDy * lineDy;
        if (lineLenSq < 1) continue;

        // Project point onto line segment
        const t = Math.max(0, Math.min(1, ((px - p1.x) * lineDx + (py - p1.y) * lineDy) / lineLenSq));
        const projX = p1.x + t * lineDx;
        const projY = p1.y + t * lineDy;

        const dist = Math.hypot(px - projX, py - projY);
        const touchDist = radius + roadRadius;

        if (dist < touchDist) {
          const depth = touchDist - dist;
          let nx = dist > 0.001 ? (px - projX) / dist : 0;
          let ny = dist > 0.001 ? (py - projY) / dist : -1;
          // Ensure upward support so the car never gets sucked downwards through the road
          if (ny > 0) ny = -ny;

          let sDx = lineDx;
          let sDy = lineDy;
          if (sDx < 0) { sDx = -sDx; sDy = -sDy; }
          const slopeAngle = Math.atan2(sDy, sDx);

          if (depth > deepest.depth) {
            deepest = { hit: true, depth, normalX: nx, normalY: ny, slopeAngle };
          }
        }
      }

      return deepest;
    }

    // =======================================================================
    // 8. WIN & FAIL HANDLERS
    // =========================================================================
    triggerVictory() {
      if (this.car.isFinished) return;
      this.car.isFinished = true;
      this.sound.stopEngine();
      this.sound.playVictory();
      this.state = 'VICTORY';

      const driveOverlay = document.getElementById('driveControlsOverlay');
      if (driveOverlay) driveOverlay.classList.add('hidden');

      const elapsed = ((performance.now() - this.levelStartTime) / 1000).toFixed(1);

      // Star calculation
      let stars = 1;
      const inkPct = Math.round(this.inkRemaining * 100);
      if (inkPct >= 30) stars = 2;
      if (inkPct >= 50) stars = 3;

      // Update progress
      const prevStars = this.levelStars[this.currentLevel] || 0;
      this.levelStars[this.currentLevel] = Math.max(prevStars, stars);
      localStorage.setItem('dtr_stars', JSON.stringify(this.levelStars));

      if (this.currentLevel === this.unlockedLevel && this.unlockedLevel < LEVELS.length) {
        this.unlockedLevel = this.currentLevel + 1;
        localStorage.setItem('dtr_unlocked_level', this.unlockedLevel.toString());
      }

      // Coins reward
      const baseCoins = 50;
      const inkBonus = Math.round(inkPct * 0.4);
      const totalAward = baseCoins + inkBonus;
      this.coins += totalAward;
      localStorage.setItem('dtr_coins', this.coins.toString());
      this.updateCoinDisplays();

      // UI
      document.getElementById('vStatInk').textContent = `${inkPct}%`;
      document.getElementById('vStatTime').textContent = `${elapsed}s`;
      document.getElementById('vStatCoins').textContent = `+${totalAward} 🪙`;

      const s1 = document.getElementById('vStar1');
      const s2 = document.getElementById('vStar2');
      const s3 = document.getElementById('vStar3');
      [s1, s2, s3].forEach((el, idx) => {
        if (el) {
          el.textContent = idx < stars ? '⭐' : '☆';
          el.classList.toggle('earned', idx < stars);
        }
      });

      // Confetti burst
      for (let i = 0; i < 50; i++) {
        this.confetti.push({
          x: this.car.x + (Math.random() - 0.5) * 80,
          y: this.car.y - 60,
          vx: (Math.random() - 0.5) * 320,
          vy: -Math.random() * 260 - 80,
          color: ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#ec4899'][Math.floor(Math.random() * 5)],
          size: Math.random() * 8 + 5,
          rot: Math.random() * Math.PI,
          rotSpd: (Math.random() - 0.5) * 10
        });
      }

      setTimeout(() => {
        if (this.state === 'VICTORY') {
          this.victoryModal.classList.remove('hidden');
          this.renderLevelGrid();
        }
      }, 700);
    }

    triggerCrash(reason) {
      if (this.car.isCrashed) return;
      this.car.isCrashed = true;
      this.sound.stopEngine();
      this.sound.playCrash();
      this.shake = 20;
      this.state = 'DEFEAT';

      const driveOverlay = document.getElementById('driveControlsOverlay');
      if (driveOverlay) driveOverlay.classList.add('hidden');

      // Flying debris parts
      for (let i = 0; i < 20; i++) {
        const a = Math.random() * Math.PI * 2;
        const spd = Math.random() * 220 + 60;
        this.particles.push({
          x: this.car.x,
          y: this.car.y,
          vx: Math.cos(a) * spd,
          vy: Math.sin(a) * spd,
          r: Math.random() * 5 + 3,
          color: this.car.spec.primaryColor,
          alpha: 1.0,
          life: 0.8
        });
      }

      document.getElementById('defeatSub').textContent = reason || 'Your car crashed!';
      setTimeout(() => {
        if (this.state === 'DEFEAT') {
          this.defeatModal.classList.remove('hidden');
        }
      }, 600);
    }

    // =======================================================================
    // 9. RENDERING & VISUAL ART ENGINE
    // =========================================================================
    render() {
      const ctx = this.ctx;
      const w = this.viewW;
      const h = this.viewH;

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

      // Camera shake
      let shakeX = 0;
      let shakeY = 0;
      if (this.shake > 0) {
        shakeX = (Math.random() - 0.5) * this.shake;
        shakeY = (Math.random() - 0.5) * this.shake;
        this.shake *= 0.88;
      }

      // Smooth Camera tracking target
      if (this.car) {
        const targetX = this.car.x + 80;
        const targetY = Math.min(420, this.car.y);
        this.camera.x += (targetX - this.camera.x) * 0.08;
        this.camera.y += (targetY - this.camera.y) * 0.08;
      }

      ctx.save();
      // Center on screen
      ctx.translate(w * 0.32 + shakeX, h * 0.52 + shakeY);
      ctx.translate(-this.camera.x, -this.camera.y);

      // 1. Draw Background Parallax Hills & Clouds
      this.drawBackdrop(ctx);

      // 2. Draw Platforms & Chasm Pillars
      this.drawPlatforms(ctx);

      // 3. Draw Hazards & Specials (Spikes, TNT, Springs, Boosters)
      this.drawHazards(ctx);

      // 4. Draw Collectible Coins
      this.drawCoins(ctx);

      // 5. Draw Finish Line Banner
      this.drawFinishLine(ctx);

      // 6. Draw Hand-Drawn Road
      this.drawRoad(ctx);

      // 7. Draw Physics Vehicle
      if (this.car && !this.car.isCrashed) {
        this.drawVehicle(ctx, this.car);
      }

      // 8. Draw Particles & Confetti
      this.drawParticles(ctx);

      ctx.restore();
    }

    drawBackdrop(ctx) {
      // Minimalist parallax mountains
      const camX = this.camera.x;
      ctx.save();

      // Distant rolling hills
      ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.beginPath();
      ctx.arc(camX * 0.2 + 200, 520, 400, Math.PI, 0);
      ctx.arc(camX * 0.2 + 750, 560, 480, Math.PI, 0);
      ctx.fill();

      // Midground trees & hills
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.beginPath();
      ctx.arc(camX * 0.4 + 400, 600, 320, Math.PI, 0);
      ctx.arc(camX * 0.4 + 900, 620, 360, Math.PI, 0);
      ctx.fill();

      ctx.restore();
    }

    drawPlatforms(ctx) {
      const allPlatforms = [
        ...this.stagePlatforms,
        ...this.stageMovingPlatforms.map(m => ({ x: m.curX, y: m.y, w: m.w, h: m.h, isMoving: true }))
      ];

      for (const p of allPlatforms) {
        ctx.save();

        // 3D platform side shadow
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.roundRect(p.x, p.y + 12, p.w, p.h, [0, 0, 16, 16]);
        ctx.fill();

        // Main platform block (Clean stone / concrete)
        ctx.fillStyle = p.isMoving ? '#0284c7' : '#334155';
        ctx.beginPath();
        ctx.roundRect(p.x, p.y, p.w, p.h, 16);
        ctx.fill();

        // Platform top grass / road deck
        ctx.fillStyle = p.isMoving ? '#38bdf8' : '#22c55e';
        ctx.beginPath();
        ctx.roundRect(p.x, p.y, p.w, 14, [16, 16, 4, 4]);
        ctx.fill();

        // Cheerful road dashes on top deck
        ctx.fillStyle = '#ffffff';
        for (let dx = 16; dx < p.w - 20; dx += 32) {
          ctx.fillRect(p.x + dx, p.y + 5, 14, 3);
        }

        ctx.restore();
      }
    }

    drawHazards(ctx) {
      // 1. Spikes
      for (const spk of this.stageSpikes) {
        ctx.save();
        const count = Math.max(2, Math.floor(spk.w / 14));
        const step = spk.w / count;

        ctx.fillStyle = '#ef4444';
        ctx.strokeStyle = '#991b1b';
        ctx.lineWidth = 2;

        for (let i = 0; i < count; i++) {
          const sx = spk.x + i * step;
          ctx.beginPath();
          if (spk.ceiling) {
            ctx.moveTo(sx, spk.y);
            ctx.lineTo(sx + step / 2, spk.y + spk.h);
            ctx.lineTo(sx + step, spk.y);
          } else {
            ctx.moveTo(sx, spk.y + spk.h);
            ctx.lineTo(sx + step / 2, spk.y);
            ctx.lineTo(sx + step, spk.y + spk.h);
          }
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        }
        ctx.restore();
      }

      // 2. TNT Barrels
      for (const tnt of this.stageTnt) {
        if (tnt.exploded) continue;
        ctx.save();
        ctx.translate(tnt.x, tnt.y);

        // Red Barrel Body
        ctx.fillStyle = '#dc2626';
        ctx.strokeStyle = '#7f1d1d';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(-tnt.r, -tnt.r, tnt.r * 2, tnt.r * 2, 6);
        ctx.fill();
        ctx.stroke();

        // Yellow warning stripes
        ctx.fillStyle = '#facc15';
        ctx.fillRect(-tnt.r, -6, tnt.r * 2, 12);

        // TNT Label
        ctx.fillStyle = '#0f172a';
        ctx.font = '900 11px Fredoka, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('TNT', 0, 0);

        ctx.restore();
      }

      // 3. Spring Pads
      for (const sp of this.stageSprings) {
        ctx.save();
        ctx.fillStyle = '#f59e0b';
        ctx.strokeStyle = '#b45309';
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.roundRect(sp.x, sp.y, sp.w, sp.h, 8);
        ctx.fill();
        ctx.stroke();

        // Spring coils visual
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(sp.x + 8, sp.y + sp.h / 2);
        ctx.lineTo(sp.x + sp.w - 8, sp.y + sp.h / 2);
        ctx.stroke();

        ctx.restore();
      }

      // 4. Boosters
      for (const b of this.stageBoosters) {
        ctx.save();
        ctx.fillStyle = '#10b981';
        ctx.beginPath();
        ctx.roundRect(b.x, b.y, b.w, b.h, 6);
        ctx.fill();

        // Chevrons
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 14px Fredoka, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('>>>', b.x + b.w / 2, b.y + b.h / 2);
        ctx.restore();
      }

      // 5. Crushers
      for (const cr of this.stageCrushers) {
        ctx.save();
        ctx.fillStyle = '#64748b';
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(cr.x, cr.curY, cr.w, cr.h, 8);
        ctx.fill();
        ctx.stroke();

        // Hazard stripes
        ctx.fillStyle = '#facc15';
        ctx.fillRect(cr.x + 4, cr.curY + cr.h - 18, cr.w - 8, 14);
        ctx.restore();
      }
    }

    drawCoins(ctx) {
      for (const coin of this.stageCoins) {
        if (coin.collected) continue;
        ctx.save();
        ctx.translate(coin.x, coin.y);

        const widthScale = Math.cos(coin.spin || 0);

        // Gold coin body with 3D bevel
        ctx.fillStyle = '#facc15';
        ctx.strokeStyle = '#b45309';
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.ellipse(0, 0, Math.max(2, Math.abs(widthScale) * 12), 12, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Inner Star / Engraving
        if (Math.abs(widthScale) > 0.4) {
          ctx.fillStyle = '#d97706';
          ctx.beginPath();
          ctx.arc(0, 0, 4, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }
    }

    drawFinishLine(ctx) {
      if (!this.stageFinish) return;
      const f = this.stageFinish;

      ctx.save();
      ctx.translate(f.x, f.y);

      // 1. Checkered Ground Finish Strip (Painted onto the platform road deck)
      const stripCols = 8;
      const stripRows = 2;
      const sW = 6;
      const sH = 7;
      for (let r = 0; r < stripRows; r++) {
        for (let c = 0; c < stripCols; c++) {
          ctx.fillStyle = (r + c) % 2 === 0 ? '#ffffff' : '#0f172a';
          ctx.fillRect(-12 + c * sW, r * sH, sW, sH);
        }
      }

      // 2. Twin Archway Flagpoles
      ctx.fillStyle = '#64748b';
      ctx.fillRect(-6, -72, 6, 72);
      ctx.fillRect(36, -72, 6, 72);

      // 3. Checkered Overhead Archway Banner
      const rows = 3;
      const cols = 6;
      const cellW = 7;
      const cellH = 6;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          ctx.fillStyle = (r + c) % 2 === 0 ? '#ffffff' : '#0f172a';
          ctx.fillRect(-2 + c * cellW, -72 + r * cellH, cellW, cellH);
        }
      }

      // 4. "FINISH" Label on Arch
      ctx.fillStyle = '#facc15';
      ctx.font = '900 10px Fredoka, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('FINISH', 19, -80);

      ctx.restore();
    }

    drawRoad(ctx) {
      const pts = this.drawnPoints;
      if (pts.length < 2) return;

      ctx.save();

      // 1. Dark Road Asphalt Underlay / Border
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 20;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) {
        ctx.lineTo(pts[i].x, pts[i].y);
      }
      ctx.stroke();

      // 2. Bright Road Surface
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 14;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) {
        ctx.lineTo(pts[i].x, pts[i].y);
      }
      ctx.stroke();

      // 3. Center White Dashes
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([8, 10]);
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) {
        ctx.lineTo(pts[i].x, pts[i].y);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.restore();
    }

    drawVehicle(ctx, car) {
      const v = car.spec;
      ctx.save();
      ctx.translate(car.x, car.y);
      ctx.rotate(car.angle);

      // Draw Chassis Body
      ctx.fillStyle = v.primaryColor;
      ctx.strokeStyle = 'rgba(0,0,0,0.2)';
      ctx.lineWidth = 2;

      // Sport / Buggy / Monster body contours
      ctx.beginPath();
      ctx.roundRect(-v.chassisW / 2, -v.chassisH / 2, v.chassisW, v.chassisH, [6, 12, 4, 4]);
      ctx.fill();
      ctx.stroke();

      // Cabin / Roof
      ctx.fillStyle = v.accentColor;
      ctx.beginPath();
      ctx.roundRect(-v.chassisW * 0.25, -v.chassisH * 0.95, v.chassisW * 0.55, v.chassisH * 0.65, [8, 8, 0, 0]);
      ctx.fill();

      // Windshield
      ctx.fillStyle = v.windowColor;
      ctx.beginPath();
      ctx.roundRect(-v.chassisW * 0.15, -v.chassisH * 0.85, v.chassisW * 0.38, v.chassisH * 0.5, 4);
      ctx.fill();

      // Headlight & Taillight
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(v.chassisW / 2 - 4, -4, 4, 8);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(-v.chassisW / 2, -4, 4, 8);

      // Special Police Light / Siren
      if (v.style === 'police') {
        const blink = Math.floor(performance.now() / 150) % 2 === 0;
        ctx.fillStyle = blink ? '#ef4444' : '#38bdf8';
        ctx.fillRect(-4, -v.chassisH * 1.25, 8, 6);
      }

      ctx.restore();

      // Draw Wheels
      const wheels = [car.rearWheel, car.frontWheel];
      wheels.forEach(w => {
        ctx.save();
        ctx.translate(w.x, w.y);
        ctx.rotate(w.rot || 0);

        // Tire Black Rubber
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.arc(0, 0, v.wheelR, 0, Math.PI * 2);
        ctx.fill();

        // Rim Accent
        ctx.fillStyle = '#e2e8f0';
        ctx.beginPath();
        ctx.arc(0, 0, v.wheelR * 0.55, 0, Math.PI * 2);
        ctx.fill();

        // Rim Spokes
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-v.wheelR * 0.45, 0); ctx.lineTo(v.wheelR * 0.45, 0);
        ctx.moveTo(0, -v.wheelR * 0.45); ctx.lineTo(0, v.wheelR * 0.45);
        ctx.stroke();

        ctx.restore();
      });
    }

    drawParticles(ctx) {
      // 1. Dust & Smoke
      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.x += p.vx * 0.016;
        p.y += p.vy * 0.016;
        p.life -= 0.016;
        p.alpha = Math.max(0, p.life * 2.5);

        if (p.life <= 0) {
          this.particles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // 2. Victory Confetti
      for (let i = this.confetti.length - 1; i >= 0; i--) {
        const cf = this.confetti[i];
        cf.x += cf.vx * 0.016;
        cf.y += cf.vy * 0.016;
        cf.vy += 450 * 0.016; // gravity
        cf.rot += cf.rotSpd * 0.016;

        ctx.save();
        ctx.translate(cf.x, cf.y);
        ctx.rotate(cf.rot);
        ctx.fillStyle = cf.color;
        ctx.fillRect(-cf.size / 2, -cf.size / 2, cf.size, cf.size * 0.7);
        ctx.restore();
      }
    }

    // =======================================================================
    // 10. PREVIEWS & MODAL RENDERING
    // =========================================================================
    updateMenuCarPreview() {
      const canvas = this.menuCarCanvas;
      const ctx = this.menuCarCtx;
      if (!canvas || !ctx) return;

      const v = this.getEquippedVehicle();
      document.getElementById('menuCarName').textContent = v.name;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const fakeCar = {
        x: canvas.width / 2,
        y: canvas.height / 2 - 2,
        angle: 0,
        spec: v,
        rearWheel: { x: canvas.width / 2 - v.wheelBase / 2, y: canvas.height / 2 + 16, rot: 0 },
        frontWheel: { x: canvas.width / 2 + v.wheelBase / 2, y: canvas.height / 2 + 16, rot: 0 }
      };

      this.drawVehicle(ctx, fakeCar);
    }

    updateGaragePreview(v) {
      const canvas = this.garagePreviewCanvas;
      const ctx = this.garagePreviewCtx;
      if (!canvas || !ctx) return;

      document.getElementById('garageCarTitle').textContent = v.name;
      document.getElementById('garageCarDesc').textContent = v.desc;

      // Update stat bars
      document.getElementById('statBarSpeed').style.width = `${Math.min(100, (v.speed / 640) * 100)}%`;
      document.getElementById('statBarSusp').style.width = `${v.suspension}%`;
      document.getElementById('statBarGrip').style.width = `${v.grip}%`;

      const btnAction = document.getElementById('btnGarageAction');
      const isOwned = this.unlockedVehicles.includes(v.id);
      const isEquipped = this.equippedVehicleId === v.id;

      if (isEquipped) {
        btnAction.textContent = 'EQUIPPED';
        btnAction.className = 'btn-garage-action equipped';
      } else if (isOwned) {
        btnAction.textContent = 'EQUIP VEHICLE';
        btnAction.className = 'btn-garage-action equip';
      } else {
        btnAction.textContent = `UNLOCK FOR ${v.price} 🪙`;
        btnAction.className = 'btn-garage-action buy';
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const fakeCar = {
        x: canvas.width / 2,
        y: canvas.height / 2 - 4,
        angle: 0,
        spec: v,
        rearWheel: { x: canvas.width / 2 - v.wheelBase / 2, y: canvas.height / 2 + 18, rot: 0 },
        frontWheel: { x: canvas.width / 2 + v.wheelBase / 2, y: canvas.height / 2 + 18, rot: 0 }
      };

      this.drawVehicle(ctx, fakeCar);
    }

    renderLevelGrid() {
      const grid = document.getElementById('levelsGrid');
      if (!grid) return;
      grid.innerHTML = '';

      let totalStars = 0;

      LEVELS.forEach(lvl => {
        const isUnlocked = lvl.id <= this.unlockedLevel;
        const isActive = lvl.id === this.currentLevel;
        const isFree = (lvl.id % 5 === 0) || !!lvl.isFreeDrive;
        const stars = this.levelStars[lvl.id] || 0;
        totalStars += stars;

        const btn = document.createElement('button');
        btn.className = `level-btn ${isUnlocked ? 'unlocked' : 'locked'} ${isActive ? 'active' : ''} ${isFree ? 'free-drive-level' : ''}`;

        let starsStr = '';
        for (let i = 0; i < 3; i++) {
          starsStr += (i < stars) ? '⭐' : '☆';
        }

        btn.innerHTML = `
          <span class="level-num">${lvl.id}</span>
          <span class="level-stars-slot">${isUnlocked ? starsStr : '🔒'}</span>
        `;

        if (isUnlocked) {
          btn.addEventListener('click', () => {
            this.sound.playClick();
            this.levelSelectModal.classList.add('hidden');
            this.loadLevel(lvl.id);
          });
        }

        grid.appendChild(btn);
      });

      const starsTotalEl = document.getElementById('totalStarsCount');
      if (starsTotalEl) starsTotalEl.textContent = `⭐ ${totalStars} / 60`;
    }

    renderGarageGrid() {
      const grid = document.getElementById('garageVehiclesGrid');
      if (!grid) return;
      grid.innerHTML = '';

      VEHICLES.forEach(v => {
        const isOwned = this.unlockedVehicles.includes(v.id);
        const isActive = this.equippedVehicleId === v.id;

        const btn = document.createElement('button');
        btn.className = `garage-thumb-btn ${isActive ? 'active' : ''}`;
        btn.innerHTML = `
          <span style="font-size: 24px;">🚗</span>
          <span class="garage-thumb-name">${v.name}</span>
          <span class="garage-thumb-price">${isOwned ? 'OWNED' : `${v.price} 🪙`}</span>
        `;

        btn.addEventListener('click', () => {
          this.sound.playClick();
          document.querySelectorAll('.garage-thumb-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          this.selectedGarageVehicle = v;
          this.updateGaragePreview(v);
        });

        grid.appendChild(btn);
      });

      // Default select equipped
      this.selectedGarageVehicle = this.getEquippedVehicle();
      this.updateGaragePreview(this.selectedGarageVehicle);
    }

    // =======================================================================
    // 11. EVENT LISTENERS & UI WIRING
    // =========================================================================
    initEvents() {
      window.addEventListener('resize', () => this.resize());

      // Warm audio on first interaction
      const warmAudio = () => {
        ['pointerdown', 'keydown', 'touchstart'].forEach(t => window.removeEventListener(t, warmAudio, true));
        this.sound.init();
      };
      ['pointerdown', 'keydown', 'touchstart'].forEach(t => window.addEventListener(t, warmAudio, true));

      // Pointer / Drawing Input on Canvas
      const getCoords = (e) => {
        const rect = this.canvas.getBoundingClientRect();
        const clientX = e.clientX || (e.touches && e.touches[0]?.clientX) || 0;
        const clientY = e.clientY || (e.touches && e.touches[0]?.clientY) || 0;

        // Invert camera transform to get world coordinates
        const screenX = clientX - rect.left;
        const screenY = clientY - rect.top;

        const worldX = screenX - (this.viewW * 0.32) + this.camera.x;
        const worldY = screenY - (this.viewH * 0.52) + this.camera.y;
        return { x: worldX, y: worldY };
      };

      this.canvas.addEventListener('pointerdown', (e) => {
        const p = getCoords(e);
        this.handlePointerDown(p.x, p.y);
      });

      window.addEventListener('pointermove', (e) => {
        const p = getCoords(e);
        this.handlePointerMove(p.x, p.y);
      });

      window.addEventListener('pointerup', () => this.handlePointerUp());
      window.addEventListener('pointercancel', () => this.handlePointerUp());

      // Tap on car directly to start drive
      this.canvas.addEventListener('click', (e) => {
        if (this.state === 'DRAWING' && this.car && this.totalDrawnLength < 15) {
          const p = getCoords(e);
          const distToCar = Math.hypot(p.x - this.car.x, p.y - this.car.y);
          if (distToCar < 90) {
            this.startDrive();
          }
        }
      });

      // Keyboard Controls (Continuous Input Tracking & Button Highlighting)
      const btnGas = document.getElementById('btnTouchGas');
      const btnBrake = document.getElementById('btnTouchBrake');
      const btnNitro = document.getElementById('btnTouchNitro');

      const setKey = (code, isDown) => {
        if (['ArrowRight', 'KeyD'].includes(code)) {
          this.input.right = isDown;
          if (btnGas) btnGas.classList.toggle('active', isDown);
          if (isDown && this.state === 'DRAWING') this.startDrive();
        } else if (['ArrowLeft', 'KeyA'].includes(code)) {
          this.input.left = isDown;
          if (btnBrake) btnBrake.classList.toggle('active', isDown);
          if (isDown && this.state === 'DRAWING') this.startDrive();
        } else if (['ArrowUp', 'KeyW', 'Space', 'ShiftLeft', 'ShiftRight'].includes(code)) {
          this.input.boost = isDown;
          if (btnNitro) btnNitro.classList.toggle('active', isDown);
          if (isDown && this.state === 'DRAWING') this.startDrive();
        } else if (code === 'KeyR' && isDown) {
          if (this.state === 'DRIVING' || this.state === 'DRAWING' || this.state === 'DEFEAT') {
            this.loadLevel(this.currentLevel);
          }
        }
      };

      window.addEventListener('keydown', (e) => setKey(e.code, true));
      window.addEventListener('keyup', (e) => setKey(e.code, false));

      // On-Screen Touch / Mouse Pedals
      const wireTouchBtn = (elId, prop) => {
        const btn = document.getElementById(elId);
        if (!btn) return;
        const press = (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.input[prop] = true;
          btn.classList.add('active');
          if (this.state === 'DRAWING') this.startDrive();
        };
        const release = (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.input[prop] = false;
          btn.classList.remove('active');
        };
        ['pointerdown', 'touchstart', 'mousedown'].forEach(t => btn.addEventListener(t, press));
        ['pointerup', 'pointercancel', 'touchend', 'mouseup', 'mouseleave'].forEach(t => btn.addEventListener(t, release));
      };

      wireTouchBtn('btnTouchGas', 'right');
      wireTouchBtn('btnTouchBrake', 'left');
      wireTouchBtn('btnTouchNitro', 'boost');

      // Menu Actions
      document.getElementById('btnPlayGame').addEventListener('click', () => {
        this.sound.playClick();
        this.loadLevel(this.currentLevel);
      });

      document.getElementById('btnOpenLevels').addEventListener('click', () => {
        this.sound.playClick();
        this.renderLevelGrid();
        this.levelSelectModal.classList.remove('hidden');
      });

      document.getElementById('btnOpenGarage').addEventListener('click', () => {
        this.sound.playClick();
        this.renderGarageGrid();
        this.garageModal.classList.remove('hidden');
      });

      document.getElementById('btnOpenHowTo').addEventListener('click', () => {
        this.sound.playClick();
        this.howToModal.classList.remove('hidden');
      });

      // Sound Toggles
      const toggleSound = () => {
        const active = this.sound.toggle();
        const icon = active ? '🔊' : '🔇';
        document.getElementById('soundIcon').textContent = icon;
        document.getElementById('menuSoundIcon').textContent = icon;
      };
      document.getElementById('btnSound').addEventListener('click', toggleSound);
      document.getElementById('btnMenuSound').addEventListener('click', toggleSound);

      // HUD Actions
      document.getElementById('btnHome').addEventListener('click', () => {
        this.sound.playClick();
        this.sound.stopEngine();
        this.state = 'MENU';
        this.gameHud.classList.add('hidden');
        const driveOverlay = document.getElementById('driveControlsOverlay');
        if (driveOverlay) driveOverlay.classList.add('hidden');
        this.menuScreen.classList.remove('hidden');
        this.updateMenuCarPreview();
      });

      document.getElementById('btnRestart').addEventListener('click', () => {
        this.sound.playClick();
        this.loadLevel(this.currentLevel);
      });

      document.getElementById('btnUndo').addEventListener('click', () => {
        this.clearDrawnRoad();
      });

      document.getElementById('btnDrive').addEventListener('click', () => {
        if (this.state === 'DRAWING') {
          this.startDrive();
        } else {
          this.loadLevel(this.currentLevel);
        }
      });

      // Victory Modal Actions
      document.getElementById('btnVictoryNext').addEventListener('click', () => {
        this.sound.playClick();
        if (this.currentLevel < LEVELS.length) {
          this.loadLevel(this.currentLevel + 1);
        } else {
          this.loadLevel(1);
        }
      });

      document.getElementById('btnVictoryRetry').addEventListener('click', () => {
        this.sound.playClick();
        this.loadLevel(this.currentLevel);
      });

      document.getElementById('btnVictoryHome').addEventListener('click', () => {
        this.sound.playClick();
        this.state = 'MENU';
        this.victoryModal.classList.add('hidden');
        this.gameHud.classList.add('hidden');
        this.menuScreen.classList.remove('hidden');
        this.updateMenuCarPreview();
      });

      // Defeat Modal Actions
      document.getElementById('btnDefeatRetry').addEventListener('click', () => {
        this.sound.playClick();
        this.loadLevel(this.currentLevel);
      });

      document.getElementById('btnDefeatHome').addEventListener('click', () => {
        this.sound.playClick();
        this.state = 'MENU';
        this.defeatModal.classList.add('hidden');
        this.gameHud.classList.add('hidden');
        this.menuScreen.classList.remove('hidden');
        this.updateMenuCarPreview();
      });

      // Close Modals
      document.getElementById('btnCloseLevels').addEventListener('click', () => {
        this.sound.playClick();
        this.levelSelectModal.classList.add('hidden');
      });

      document.getElementById('btnCloseGarage').addEventListener('click', () => {
        this.sound.playClick();
        this.garageModal.classList.add('hidden');
        this.updateMenuCarPreview();
      });

      document.getElementById('btnCloseHowTo').addEventListener('click', () => {
        this.sound.playClick();
        this.howToModal.classList.add('hidden');
      });

      document.getElementById('btnHowToGotIt').addEventListener('click', () => {
        this.sound.playClick();
        this.howToModal.classList.add('hidden');
      });

      // Garage Buy / Equip Action
      document.getElementById('btnGarageAction').addEventListener('click', () => {
        const v = this.selectedGarageVehicle || this.getEquippedVehicle();
        const isOwned = this.unlockedVehicles.includes(v.id);

        if (isOwned) {
          this.sound.playClick();
          this.equippedVehicleId = v.id;
          localStorage.setItem('dtr_equipped_vehicle', v.id);
          this.renderGarageGrid();
        } else if (this.coins >= v.price) {
          this.sound.playCoin();
          this.coins -= v.price;
          this.unlockedVehicles.push(v.id);
          this.equippedVehicleId = v.id;
          localStorage.setItem('dtr_coins', this.coins.toString());
          localStorage.setItem('dtr_unlocked_vehicles', JSON.stringify(this.unlockedVehicles));
          localStorage.setItem('dtr_equipped_vehicle', v.id);
          this.updateCoinDisplays();
          this.renderGarageGrid();
        } else {
          this.sound.playCrash();
          alert(`Not enough coins! You need ${v.price} 🪙 to unlock ${v.name}.`);
        }
      });
    }

    // =======================================================================
    // 12. MAIN LOOP
    // =========================================================================
    loop(timestamp) {
      const dt = Math.min((timestamp - this.lastTime) / 1000, 0.05);
      this.lastTime = timestamp;

      this.updatePhysics(dt);
      this.render();

      requestAnimationFrame(this.loop.bind(this));
    }
  }

  // Launch on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.game = new DrawTheRoadGame(); });
  } else {
    window.game = new DrawTheRoadGame();
  }
})();
