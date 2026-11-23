/**
 * Gift Wrapped - Core Game Engine
 * Faithful recreation of Nitrome / Poki "Gift Wrapped"
 * Featuring silhouette-tight wrapped presents, trick counterpart decoys,
 * festive Web Audio synthesizer, snow engine, and paper-shredding particle physics.
 */

(function () {
  'use strict';

  // =========================================================================
  // AUDIO SYNTHESIZER (Web Audio API)
  // Upbeat Festive Jingle Bells Chiptune + Realistic Holiday SFX
  // =========================================================================
  class SoundManager {
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
      this.initOnFirstGesture();
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
      this.bgmGain.gain.setValueAtTime(0.35, this.ctx.currentTime);
      this.bgmGain.connect(this.masterGain);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(0.65, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);
    }

    initOnFirstGesture() {
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
      if (!enabled) {
        this.stopBGM();
      } else if (this.isPlayingBgm) {
        this.startBGM();
      }
    }

    setSfx(enabled) {
      this.sfxEnabled = enabled;
    }

    toggleMasterMute() {
      this.isMuted = !this.isMuted;
      if (this.masterGain && this.ctx) {
        this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.75, this.ctx.currentTime);
      }
      return !this.isMuted;
    }

    // Play a single synthesized note
    playTone(freq, type, duration, gainVal, destination = null) {
      if (!this.ctx || this.isMuted) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const now = this.ctx.currentTime;

      osc.type = type || 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(gainVal || 0.2, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      osc.connect(gain);
      gain.connect(destination || this.sfxGain);

      osc.start(now);
      osc.stop(now + duration + 0.05);
    }

    // Festive Jingle Bells Chiptune Arpeggiated Melody
    startBGM() {
      if (!this.musicEnabled || this.isMuted) return;
      this.init();
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      this.stopBGM();
      this.isPlayingBgm = true;

      // Note frequencies (Hz)
      const C4 = 261.63, D4 = 293.66, E4 = 329.63, F4 = 349.23, G4 = 392.00, A4 = 440.00, B4 = 493.88;
      const C5 = 523.25, D5 = 587.33, E5 = 659.25, F5 = 698.46, G5 = 783.99;
      const C3 = 130.81, G3 = 196.00, F3 = 174.61;

      // Melody phrase: "Jingle bells, jingle bells, jingle all the way..."
      const notes = [
        // Measure 1: E E E -
        { m: E5, b: C3, d: 0.22 }, { m: E5, b: null, d: 0.22 }, { m: E5, b: G3, d: 0.44 }, { m: null, b: null, d: 0.22 },
        // Measure 2: E E E -
        { m: E5, b: C3, d: 0.22 }, { m: E5, b: null, d: 0.22 }, { m: E5, b: G3, d: 0.44 }, { m: null, b: null, d: 0.22 },
        // Measure 3: E G C D E - - -
        { m: E5, b: C3, d: 0.22 }, { m: G5, b: null, d: 0.22 }, { m: C5, b: G3, d: 0.33 }, { m: D5, b: null, d: 0.15 },
        { m: E5, b: C3, d: 0.65 }, { m: null, b: null, d: 0.22 },
        // Measure 4: F F F F F E E E E D D E D G
        { m: F5, b: F3, d: 0.22 }, { m: F5, b: null, d: 0.22 }, { m: F5, b: A4, d: 0.33 }, { m: F5, b: null, d: 0.15 },
        { m: F5, b: F3, d: 0.22 }, { m: E5, b: null, d: 0.22 }, { m: E5, b: C3, d: 0.22 }, { m: E5, b: null, d: 0.15 },
        { m: E5, b: null, d: 0.15 }, { m: D5, b: G3, d: 0.22 }, { m: D5, b: null, d: 0.22 }, { m: E5, b: G3, d: 0.22 },
        { m: D5, b: null, d: 0.35 }, { m: G5, b: G3, d: 0.45 }, { m: null, b: null, d: 0.25 }
      ];

      this.bgmStep = 0;
      const bpm = 160;
      const beatMs = (60 / bpm) * 1000 * 0.75; // brisk holiday tempo

      const playNext = () => {
        if (!this.isPlayingBgm || !this.musicEnabled) return;
        const item = notes[this.bgmStep];
        if (item.m) {
          // Lead melody (warm triangle + slight square sub)
          this.playTone(item.m, 'triangle', item.d, 0.22, this.bgmGain);
          this.playTone(item.m * 0.5, 'sine', item.d, 0.12, this.bgmGain);
        }
        if (item.b) {
          // Bass pulse
          this.playTone(item.b, 'square', item.d * 0.8, 0.10, this.bgmGain);
        }
        this.bgmStep = (this.bgmStep + 1) % notes.length;
        this.bgmTimer = setTimeout(playNext, beatMs * (item.d > 0.4 ? 1.4 : 0.85));
      };

      playNext();
    }

    stopBGM() {
      this.isPlayingBgm = false;
      if (this.bgmTimer) {
        clearTimeout(this.bgmTimer);
        this.bgmTimer = null;
      }
    }

    // SFX: Paper Ripping / Tearing sound (Crunchy noise burst + sweep)
    playRip() {
      if (!this.sfxEnabled || this.isMuted) return;
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const bufferSize = this.ctx.sampleRate * 0.28;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);

      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.35));
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1400, now);
      filter.frequency.exponentialRampToValueAtTime(320, now + 0.25);
      filter.Q.setValueAtTime(3.0, now);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.8, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.27);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);

      noise.start(now);
    }

    // SFX: Cheerful success chime (Tada / bells)
    playChime(streak = 1) {
      if (!this.sfxEnabled || this.isMuted) return;
      this.init();
      if (!this.ctx) return;
      const baseFreq = 523.25; // C5
      const mult = Math.min(streak, 4);
      const chords = [
        baseFreq * 1.0,
        baseFreq * 1.25,
        baseFreq * 1.5,
        baseFreq * 2.0 * (1 + (mult - 1) * 0.1)
      ];

      chords.forEach((f, idx) => {
        setTimeout(() => {
          this.playTone(f, 'sine', 0.38, 0.26, this.sfxGain);
          this.playTone(f * 2, 'triangle', 0.22, 0.12, this.sfxGain);
        }, idx * 60);
      });
    }

    // SFX: Penalty Buzzer (Negative low sawtooth wobble)
    playBuzzer() {
      if (!this.sfxEnabled || this.isMuted) return;
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.28);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.3);
    }

    // SFX: Urgent countdown clock tick
    playTick() {
      if (!this.sfxEnabled || this.isMuted) return;
      this.init();
      this.playTone(880, 'sine', 0.05, 0.2, this.sfxGain);
    }

    // SFX: Game Over fanfare
    playGameOver() {
      if (!this.sfxEnabled || this.isMuted) return;
      this.init();
      const notes = [392, 349.2, 329.6, 261.6];
      notes.forEach((freq, i) => {
        setTimeout(() => {
          this.playTone(freq, 'triangle', 0.45, 0.3, this.sfxGain);
        }, i * 180);
      });
    }
  }

  // =========================================================================
  // ITEM DEFINITIONS & SILHOUETTE PATH DRAWING
  // Distinct silhouettes + Nitrome counterpart pairs + Hand-crafted toy visuals
  // =========================================================================
  const ITEMS = [
    {
      id: 'violin',
      name: 'Violin',
      counterpart: 'wine_bottle',
      width: 70,
      height: 140,
      drawSilhouette(ctx, w, h) {
        // Violin silhouette: upper bout, waist C-bouts, lower bout, neck & scroll
        const hw = w / 2;
        const hh = h / 2;
        ctx.beginPath();
        // Top of scroll
        ctx.moveTo(0, -hh);
        ctx.bezierCurveTo(hw * 0.18, -hh - 6, hw * 0.25, -hh + 12, hw * 0.12, -hh + 24);
        // Pegbox & neck
        ctx.lineTo(hw * 0.12, -hh * 0.4);
        // Upper bout
        ctx.bezierCurveTo(hw * 0.75, -hh * 0.4, hw * 0.85, -hh * 0.15, hw * 0.7, hh * 0.05);
        // Waist (C-bout inward curve)
        ctx.bezierCurveTo(hw * 0.32, hh * 0.18, hw * 0.32, hh * 0.32, hw * 0.85, hh * 0.45);
        // Lower bout
        ctx.bezierCurveTo(hw * 0.95, hh * 0.75, hw * 0.55, hh * 0.98, 0, hh);
        // Left side mirror
        ctx.bezierCurveTo(-hw * 0.55, hh * 0.98, -hw * 0.95, hh * 0.75, -hw * 0.85, hh * 0.45);
        // Waist (C-bout inward left)
        ctx.bezierCurveTo(-hw * 0.32, hh * 0.32, -hw * 0.32, hh * 0.18, -hw * 0.7, hh * 0.05);
        // Upper bout left
        ctx.bezierCurveTo(-hw * 0.85, -hh * 0.15, -hw * 0.75, -hh * 0.4, -hw * 0.12, -hh * 0.4);
        // Neck left
        ctx.lineTo(-hw * 0.12, -hh + 24);
        ctx.bezierCurveTo(-hw * 0.25, -hh + 12, -hw * 0.18, -hh - 6, 0, -hh);
        ctx.closePath();
      },
      drawToy(ctx, w, h) {
        const hw = w / 2;
        const hh = h / 2;
        // Varnished amber wood body
        const grad = ctx.createLinearGradient(-hw, 0, hw, 0);
        grad.addColorStop(0, '#78350f');
        grad.addColorStop(0.5, '#d97706');
        grad.addColorStop(1, '#92400e');
        ctx.fillStyle = grad;
        this.drawSilhouette(ctx, w, h);
        ctx.fill();
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = '#451a03';
        ctx.stroke();

        // Fingerboard (Ebony black)
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(-hw * 0.12, -hh * 0.45, hw * 0.24, hh * 0.85);

        // F-holes (waist cutouts)
        ctx.strokeStyle = '#292524';
        ctx.lineWidth = 2;
        [-hw * 0.35, hw * 0.35].forEach((fx) => {
          ctx.beginPath();
          ctx.moveTo(fx, hh * 0.2);
          ctx.bezierCurveTo(fx + (fx > 0 ? 5 : -5), hh * 0.3, fx - (fx > 0 ? 6 : -6), hh * 0.4, fx, hh * 0.5);
          ctx.stroke();
        });

        // Bridge & Tailpiece
        ctx.fillStyle = '#1c1917';
        ctx.beginPath();
        ctx.moveTo(-hw * 0.2, hh * 0.75);
        ctx.lineTo(hw * 0.2, hh * 0.75);
        ctx.lineTo(0, hh * 0.95);
        ctx.closePath();
        ctx.fill();

        // 4 Silver strings
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1;
        [-4, -1.3, 1.3, 4].forEach((sx) => {
          ctx.beginPath();
          ctx.moveTo(sx, -hh + 22);
          ctx.lineTo(sx * 1.5, hh * 0.75);
          ctx.stroke();
        });

        // Pegs
        ctx.fillStyle = '#1c1917';
        [-hh + 8, -hh + 15].forEach((py) => {
          ctx.fillRect(-hw * 0.22, py, hw * 0.44, 3);
        });
      }
    },

    {
      id: 'wine_bottle',
      name: 'Wine Bottle',
      counterpart: 'violin',
      width: 60,
      height: 140,
      drawSilhouette(ctx, w, h) {
        // Wine bottle: cylindrical base, curved shoulders, long slender neck, lip
        const hw = w / 2;
        const hh = h / 2;
        ctx.beginPath();
        ctx.moveTo(-hw * 0.2, -hh);
        ctx.lineTo(hw * 0.2, -hh); // Lip
        ctx.lineTo(hw * 0.2, -hh * 0.4); // Neck
        ctx.bezierCurveTo(hw * 0.22, -hh * 0.2, hw * 0.85, -hh * 0.15, hw * 0.85, 0); // Shoulder
        ctx.lineTo(hw * 0.85, hh * 0.9); // Cylinder
        ctx.bezierCurveTo(hw * 0.85, hh, hw * 0.6, hh, 0, hh); // Bottom round
        ctx.bezierCurveTo(-hw * 0.6, hh, -hw * 0.85, hh, -hw * 0.85, hh * 0.9);
        ctx.lineTo(-hw * 0.85, 0);
        ctx.bezierCurveTo(-hw * 0.85, -hh * 0.15, -hw * 0.22, -hh * 0.2, -hw * 0.2, -hh * 0.4);
        ctx.closePath();
      },
      drawToy(ctx, w, h) {
        const hw = w / 2;
        const hh = h / 2;
        // Deep emerald green glass
        const grad = ctx.createLinearGradient(-hw, 0, hw, 0);
        grad.addColorStop(0, '#064e3b');
        grad.addColorStop(0.3, '#047857');
        grad.addColorStop(0.7, '#065f46');
        grad.addColorStop(1, '#022c22');
        ctx.fillStyle = grad;
        this.drawSilhouette(ctx, w, h);
        ctx.fill();
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = '#022c22';
        ctx.stroke();

        // Gold Foil Neck
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(-hw * 0.2, -hh, hw * 0.4, hh * 0.35);
        ctx.fillStyle = '#b45309';
        ctx.fillRect(-hw * 0.22, -hh, hw * 0.44, 4);

        // Ornate Label
        ctx.fillStyle = '#fef3c7';
        ctx.strokeStyle = '#92400e';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(-hw * 0.65, hh * 0.1, hw * 1.3, hh * 0.65, 4);
        ctx.fill();
        ctx.stroke();

        // Label Details (Grape cluster & text lines)
        ctx.fillStyle = '#78350f';
        ctx.beginPath();
        ctx.arc(0, hh * 0.28, 4, 0, Math.PI * 2);
        ctx.arc(-4, hh * 0.35, 3.5, 0, Math.PI * 2);
        ctx.arc(4, hh * 0.35, 3.5, 0, Math.PI * 2);
        ctx.arc(0, hh * 0.42, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#92400e';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-hw * 0.4, hh * 0.55);
        ctx.lineTo(hw * 0.4, hh * 0.55);
        ctx.moveTo(-hw * 0.3, hh * 0.65);
        ctx.lineTo(hw * 0.3, hh * 0.65);
        ctx.stroke();

        // Glass highlight reflection
        ctx.strokeStyle = 'rgba(255,255,255,0.4)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-hw * 0.6, 0);
        ctx.lineTo(-hw * 0.6, hh * 0.85);
        ctx.stroke();
      }
    },

    {
      id: 'ice_skate',
      name: 'Ice Skate',
      counterpart: 'sock',
      width: 100,
      height: 110,
      drawSilhouette(ctx, w, h) {
        // Boot + horizontal blade runner underneath
        const hw = w / 2;
        const hh = h / 2;
        ctx.beginPath();
        // Top cuff
        ctx.moveTo(-hw * 0.3, -hh);
        ctx.lineTo(hw * 0.35, -hh);
        // Back of boot
        ctx.lineTo(hw * 0.3, hh * 0.3);
        // Heel
        ctx.lineTo(hw * 0.4, hh * 0.5);
        ctx.lineTo(hw * 0.25, hh * 0.5);
        // Blade back stanchion down to blade
        ctx.lineTo(hw * 0.25, hh * 0.85);
        ctx.lineTo(hw * 0.45, hh * 0.85);
        // Blade bottom run
        ctx.lineTo(hw * 0.45, hh);
        ctx.lineTo(-hw * 0.7, hh);
        // Curved toe pick
        ctx.bezierCurveTo(-hw * 0.88, hh, -hw * 0.88, hh * 0.7, -hw * 0.75, hh * 0.65);
        ctx.lineTo(-hw * 0.45, hh * 0.65);
        // Front stanchion up to sole
        ctx.lineTo(-hw * 0.45, hh * 0.5);
        // Sole to toe
        ctx.lineTo(-hw * 0.65, hh * 0.45);
        // Instep / tongue curve up
        ctx.bezierCurveTo(-hw * 0.4, hh * 0.1, -hw * 0.2, -hh * 0.4, -hw * 0.3, -hh);
        ctx.closePath();
      },
      drawToy(ctx, w, h) {
        const hw = w / 2;
        const hh = h / 2;
        // White leather boot body
        ctx.fillStyle = '#f8fafc';
        this.drawSilhouette(ctx, w, h);
        ctx.fill();
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = '#475569';
        ctx.stroke();

        // Metal chrome blade runner
        ctx.fillStyle = '#94a3b8';
        ctx.beginPath();
        ctx.rect(-hw * 0.7, hh * 0.85, hw * 1.15, hh * 0.15);
        ctx.fill();
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(-hw * 0.68, hh * 0.87, hw * 1.1, 2);

        // Brown wooden sole & heel
        ctx.fillStyle = '#78350f';
        ctx.beginPath();
        ctx.moveTo(-hw * 0.65, hh * 0.45);
        ctx.lineTo(hw * 0.38, hh * 0.45);
        ctx.lineTo(hw * 0.38, hh * 0.58);
        ctx.lineTo(hw * 0.2, hh * 0.58);
        ctx.lineTo(-hw * 0.45, hh * 0.5);
        ctx.closePath();
        ctx.fill();

        // Red laces crisscross
        ctx.strokeStyle = '#dc2626';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(-hw * 0.15, -hh * 0.6);
        ctx.lineTo(-hw * 0.05, -hh * 0.4);
        ctx.lineTo(-hw * 0.22, -hh * 0.2);
        ctx.lineTo(-hw * 0.1, 0);
        ctx.lineTo(-hw * 0.3, hh * 0.2);
        ctx.stroke();

        // Fluffy white fur collar at top
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(-hw * 0.35, -hh - 4, hw * 0.75, 16, 8);
        ctx.fill();
        ctx.stroke();
      }
    },

    {
      id: 'sock',
      name: 'Stocking',
      counterpart: 'ice_skate',
      width: 90,
      height: 110,
      drawSilhouette(ctx, w, h) {
        // Holiday stocking: calf opening, curved heel, curved round toe. NO BLADE!
        const hw = w / 2;
        const hh = h / 2;
        ctx.beginPath();
        ctx.moveTo(-hw * 0.4, -hh);
        ctx.lineTo(hw * 0.35, -hh);
        // Straight leg down
        ctx.lineTo(hw * 0.35, hh * 0.1);
        // Rounded soft heel
        ctx.bezierCurveTo(hw * 0.5, hh * 0.3, hw * 0.55, hh * 0.65, hw * 0.25, hh * 0.85);
        // Sole to toe
        ctx.bezierCurveTo(0, hh * 0.95, -hw * 0.45, hh * 0.95, -hw * 0.75, hh * 0.7);
        // Rounded toe cap
        ctx.bezierCurveTo(-hw * 0.9, hh * 0.5, -hw * 0.7, hh * 0.25, -hw * 0.45, hh * 0.25);
        // Instep curving up to calf
        ctx.bezierCurveTo(-hw * 0.25, hh * 0.05, -hw * 0.2, -hh * 0.4, -hw * 0.4, -hh);
        ctx.closePath();
      },
      drawToy(ctx, w, h) {
        const hw = w / 2;
        const hh = h / 2;
        // Festive Red Stocking Body
        ctx.fillStyle = '#dc2626';
        this.drawSilhouette(ctx, w, h);
        ctx.fill();
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = '#991b1b';
        ctx.stroke();

        // Green Heel & Toe patches
        ctx.fillStyle = '#16a34a';
        // Toe
        ctx.beginPath();
        ctx.arc(-hw * 0.55, hh * 0.55, 22, 0, Math.PI * 2);
        ctx.fill();
        // Heel
        ctx.beginPath();
        ctx.arc(hw * 0.32, hh * 0.5, 18, 0, Math.PI * 2);
        ctx.fill();

        // White zigzag knit stripes
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-hw * 0.25, -hh * 0.3);
        ctx.lineTo(-hw * 0.1, -hh * 0.2);
        ctx.lineTo(0.0, -hh * 0.3);
        ctx.lineTo(hw * 0.15, -hh * 0.2);
        ctx.lineTo(hw * 0.3, -hh * 0.3);
        ctx.stroke();

        // White fluffy cuff top + loop
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(-hw * 0.45, -hh - 4, hw * 0.85, 20, 10);
        ctx.fill();
        ctx.stroke();

        // Hanging loop
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(-hw * 0.35, -hh - 5, 8, Math.PI, 0);
        ctx.stroke();
      }
    },

    {
      id: 'robot',
      name: 'Toy Robot',
      counterpart: 'teddy_bear',
      width: 95,
      height: 125,
      drawSilhouette(ctx, w, h) {
        // Boxy robot: antenna ball, square head, boxy shoulders/arms, rectangular legs
        const hw = w / 2;
        const hh = h / 2;
        ctx.beginPath();
        // Antenna
        ctx.arc(0, -hh + 8, 7, 0, Math.PI * 2);
        // Head
        ctx.moveTo(-hw * 0.4, -hh + 18);
        ctx.lineTo(hw * 0.4, -hh + 18);
        ctx.lineTo(hw * 0.4, -hh * 0.3);
        ctx.lineTo(-hw * 0.4, -hh * 0.3);
        ctx.closePath();

        // Body and blocky arms
        ctx.moveTo(-hw * 0.8, -hh * 0.2);
        ctx.lineTo(hw * 0.8, -hh * 0.2);
        ctx.lineTo(hw * 0.8, hh * 0.35);
        ctx.lineTo(hw * 0.5, hh * 0.35);
        ctx.lineTo(hw * 0.5, hh * 0.5);
        // Right leg
        ctx.lineTo(hw * 0.45, hh);
        ctx.lineTo(hw * 0.1, hh);
        ctx.lineTo(hw * 0.1, hh * 0.5);
        // Left leg
        ctx.lineTo(-hw * 0.1, hh * 0.5);
        ctx.lineTo(-hw * 0.1, hh);
        ctx.lineTo(-hw * 0.45, hh);
        ctx.lineTo(-hw * 0.45, hh * 0.5);
        ctx.lineTo(-hw * 0.5, hh * 0.5);
        ctx.lineTo(-hw * 0.5, hh * 0.35);
        ctx.lineTo(-hw * 0.8, hh * 0.35);
        ctx.closePath();
      },
      drawToy(ctx, w, h) {
        const hw = w / 2;
        const hh = h / 2;
        // Metallic retro cyan tin body
        ctx.fillStyle = '#0284c7';
        this.drawSilhouette(ctx, w, h);
        ctx.fill();
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = '#0369a1';
        ctx.stroke();

        // Antenna ball in red
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(0, -hh + 8, 6, 0, Math.PI * 2);
        ctx.fill();

        // Head visor / eyes
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(-hw * 0.3, -hh + 24, hw * 0.6, 18);
        // Glowing yellow circular eyes
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.arc(-hw * 0.15, -hh + 33, 4.5, 0, Math.PI * 2);
        ctx.arc(hw * 0.15, -hh + 33, 4.5, 0, Math.PI * 2);
        ctx.fill();

        // Chest gauge / dial
        ctx.fillStyle = '#e2e8f0';
        ctx.beginPath();
        ctx.arc(0, 0, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Meter needle
        ctx.strokeStyle = '#dc2626';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(8, -8);
        ctx.stroke();

        // Chest buttons
        ctx.fillStyle = '#22c55e';
        ctx.fillRect(-hw * 0.25, hh * 0.2, 8, 8);
        ctx.fillStyle = '#eab308';
        ctx.fillRect(hw * 0.1, hh * 0.2, 8, 8);
      }
    },

    {
      id: 'teddy_bear',
      name: 'Teddy Bear',
      counterpart: 'robot',
      width: 95,
      height: 120,
      drawSilhouette(ctx, w, h) {
        // Round teddy ears, round head, chubby curved arms and plump belly
        const hw = w / 2;
        const hh = h / 2;
        ctx.beginPath();
        // Ears
        ctx.arc(-hw * 0.4, -hh * 0.65, 14, 0, Math.PI * 2);
        ctx.arc(hw * 0.4, -hh * 0.65, 14, 0, Math.PI * 2);
        // Head
        ctx.arc(0, -hh * 0.4, hw * 0.45, 0, Math.PI * 2);
        // Plump Belly & rounded arms
        ctx.arc(0, hh * 0.2, hw * 0.52, 0, Math.PI * 2);
        ctx.arc(-hw * 0.48, 0, 14, 0, Math.PI * 2);
        ctx.arc(hw * 0.48, 0, 14, 0, Math.PI * 2);
        // Rounded feet pads
        ctx.arc(-hw * 0.35, hh * 0.72, 18, 0, Math.PI * 2);
        ctx.arc(hw * 0.35, hh * 0.72, 18, 0, Math.PI * 2);
      },
      drawToy(ctx, w, h) {
        const hw = w / 2;
        const hh = h / 2;
        // Warm cuddly golden-brown plush
        ctx.fillStyle = '#b45309';
        this.drawSilhouette(ctx, w, h);
        ctx.fill();
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = '#78350f';
        ctx.stroke();

        // Inner ears
        ctx.fillStyle = '#fde68a';
        ctx.beginPath();
        ctx.arc(-hw * 0.4, -hh * 0.65, 7, 0, Math.PI * 2);
        ctx.arc(hw * 0.4, -hh * 0.65, 7, 0, Math.PI * 2);
        ctx.fill();

        // Beige Muzzle
        ctx.fillStyle = '#fef3c7';
        ctx.beginPath();
        ctx.ellipse(0, -hh * 0.32, 18, 14, 0, 0, Math.PI * 2);
        ctx.fill();

        // Nose & mouth
        ctx.fillStyle = '#451a03';
        ctx.beginPath();
        ctx.arc(0, -hh * 0.38, 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#451a03';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(0, -hh * 0.34);
        ctx.lineTo(0, -hh * 0.28);
        ctx.moveTo(-5, -hh * 0.26);
        ctx.bezierCurveTo(-2, -hh * 0.22, 2, -hh * 0.22, 5, -hh * 0.26);
        ctx.stroke();

        // Glossy black eyes
        ctx.fillStyle = '#1c1917';
        [-hw * 0.18, hw * 0.18].forEach((ex) => {
          ctx.beginPath();
          ctx.arc(ex, -hh * 0.46, 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(ex + 1, -hh * 0.48, 1.2, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#1c1917';
        });

        // Festive Red Neck Bow
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.moveTo(-16, -hh * 0.1);
        ctx.lineTo(16, -hh * 0.1);
        ctx.lineTo(0, -hh * 0.02);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.arc(0, -hh * 0.08, 4.5, 0, Math.PI * 2);
        ctx.fill();

        // Foot pads
        ctx.fillStyle = '#fef3c7';
        ctx.beginPath();
        ctx.ellipse(-hw * 0.35, hh * 0.72, 11, 13, 0, 0, Math.PI * 2);
        ctx.ellipse(hw * 0.35, hh * 0.72, 11, 13, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    },

    {
      id: 'toy_car',
      name: 'Toy Car',
      counterpart: 'toy_train',
      width: 120,
      height: 70,
      drawSilhouette(ctx, w, h) {
        // Rounded coupe car: curved roof, front hood, rear boot, round wheels
        const hw = w / 2;
        const hh = h / 2;
        ctx.beginPath();
        ctx.moveTo(-hw * 0.9, hh * 0.4);
        // Front bumper to hood
        ctx.bezierCurveTo(-hw * 0.95, hh * 0.1, -hw * 0.8, -hh * 0.1, -hw * 0.5, -hh * 0.15);
        // Windshield to curved roof
        ctx.bezierCurveTo(-hw * 0.35, -hh * 0.8, -hw * 0.1, -hh * 0.85, hw * 0.1, -hh * 0.85);
        // Rear window to trunk
        ctx.bezierCurveTo(hw * 0.4, -hh * 0.85, hw * 0.6, -hh * 0.2, hw * 0.88, -hh * 0.05);
        // Rear bumper
        ctx.lineTo(hw * 0.92, hh * 0.4);
        // Rear wheel cutout
        ctx.lineTo(hw * 0.65, hh * 0.4);
        ctx.arc(hw * 0.45, hh * 0.4, 20, 0, Math.PI, true);
        ctx.lineTo(-hw * 0.25, hh * 0.4);
        // Front wheel cutout
        ctx.arc(-hw * 0.45, hh * 0.4, 20, 0, Math.PI, true);
        ctx.lineTo(-hw * 0.9, hh * 0.4);
        ctx.closePath();
      },
      drawToy(ctx, w, h) {
        const hw = w / 2;
        const hh = h / 2;
        // Cherry red sports body
        ctx.fillStyle = '#dc2626';
        this.drawSilhouette(ctx, w, h);
        ctx.fill();
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = '#991b1b';
        ctx.stroke();

        // White racing stripe
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(-hw * 0.5, -hh * 0.15);
        ctx.lineTo(hw * 0.1, -hh * 0.85);
        ctx.lineTo(hw * 0.2, -hh * 0.85);
        ctx.lineTo(-hw * 0.4, -hh * 0.15);
        ctx.closePath();
        ctx.fill();

        // Glass windows
        ctx.fillStyle = '#bae6fd';
        ctx.strokeStyle = '#0284c7';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-hw * 0.3, -hh * 0.2);
        ctx.lineTo(-hw * 0.15, -hh * 0.65);
        ctx.lineTo(hw * 0.05, -hh * 0.65);
        ctx.lineTo(hw * 0.05, -hh * 0.2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(hw * 0.12, -hh * 0.2);
        ctx.lineTo(hw * 0.12, -hh * 0.65);
        ctx.lineTo(hw * 0.35, -hh * 0.25);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Wheels with chrome hubcaps
        [hw * 0.45, -hw * 0.45].forEach((wx) => {
          ctx.fillStyle = '#1e293b';
          ctx.beginPath();
          ctx.arc(wx, hh * 0.4, 16, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#cbd5e1';
          ctx.beginPath();
          ctx.arc(wx, hh * 0.4, 7, 0, Math.PI * 2);
          ctx.fill();
        });

        // Headlight
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(-hw * 0.86, hh * 0.12, 5, 0, Math.PI * 2);
        ctx.fill();
      }
    },

    {
      id: 'toy_train',
      name: 'Toy Train',
      counterpart: 'toy_car',
      width: 120,
      height: 85,
      drawSilhouette(ctx, w, h) {
        // Steam engine: smokestack chimney, boiler barrel, cab with roof overhang
        const hw = w / 2;
        const hh = h / 2;
        ctx.beginPath();
        // Front wedge cowcatcher
        ctx.moveTo(-hw * 0.95, hh * 0.5);
        ctx.lineTo(-hw * 0.75, hh * 0.2);
        // Boiler front
        ctx.lineTo(-hw * 0.75, -hh * 0.2);
        // Smokestack chimney
        ctx.lineTo(-hw * 0.65, -hh * 0.2);
        ctx.lineTo(-hw * 0.7, -hh);
        ctx.lineTo(-hw * 0.45, -hh);
        ctx.lineTo(-hw * 0.5, -hh * 0.2);
        // Dome
        ctx.arc(-hw * 0.2, -hh * 0.2, 10, Math.PI, 0);
        // Cab wall & roof
        ctx.lineTo(hw * 0.05, -hh * 0.2);
        ctx.lineTo(hw * 0.02, -hh * 0.8);
        ctx.lineTo(hw * 0.9, -hh * 0.8);
        ctx.lineTo(hw * 0.85, hh * 0.5);
        // Bottom run
        ctx.lineTo(-hw * 0.95, hh * 0.5);
        ctx.closePath();
      },
      drawToy(ctx, w, h) {
        const hw = w / 2;
        const hh = h / 2;
        // Emerald green & black vintage engine
        ctx.fillStyle = '#065f46';
        this.drawSilhouette(ctx, w, h);
        ctx.fill();
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = '#064e3b';
        ctx.stroke();

        // Golden brass boiler stripes
        ctx.fillStyle = '#facc15';
        [-hw * 0.35, -hw * 0.05].forEach((bx) => {
          ctx.fillRect(bx, -hh * 0.2, 5, hh * 0.65);
        });

        // Red Cab Roof
        ctx.fillStyle = '#dc2626';
        ctx.beginPath();
        ctx.roundRect(0, -hh * 0.85, hw * 0.95, 10, 4);
        ctx.fill();

        // Cab arched window
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.roundRect(hw * 0.2, -hh * 0.55, hw * 0.4, 24, 6);
        ctx.fill();
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Smokestack top rim (Gold)
        ctx.fillStyle = '#facc15';
        ctx.fillRect(-hw * 0.73, -hh, hw * 0.32, 6);

        // Train wheels with connecting rod
        ctx.fillStyle = '#1e293b';
        [-hw * 0.6, -hw * 0.2, hw * 0.45].forEach((wx, i) => {
          const r = i === 2 ? 18 : 13;
          ctx.beginPath();
          ctx.arc(wx, hh * 0.45, r, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#dc2626';
          ctx.lineWidth = 2;
          ctx.stroke();
        });
      }
    },

    {
      id: 'candy_cane',
      name: 'Candy Cane',
      counterpart: 'diamond_ring',
      width: 60,
      height: 120,
      drawSilhouette(ctx, w, h) {
        // Cane shaft with curved hook at top
        const hw = w / 2;
        const hh = h / 2;
        ctx.beginPath();
        // Inner hook
        ctx.arc(0, -hh * 0.45, hw * 0.4, 0, Math.PI, true);
        ctx.lineTo(-hw * 0.4, hh * 0.85);
        ctx.arc(-hw * 0.15, hh * 0.85, hw * 0.25, Math.PI, 0, true);
        ctx.lineTo(hw * 0.1, -hh * 0.45);
        ctx.arc(0, -hh * 0.45, hw * 0.9, 0, Math.PI, false);
        ctx.lineTo(-hw * 0.9, -hh * 0.2);
        ctx.arc(-hw * 0.65, -hh * 0.2, hw * 0.25, Math.PI, 0, true);
        ctx.closePath();
      },
      drawToy(ctx, w, h) {
        const hw = w / 2;
        const hh = h / 2;
        // Crisp white base
        ctx.fillStyle = '#ffffff';
        this.drawSilhouette(ctx, w, h);
        ctx.fill();
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = '#e2e8f0';
        ctx.stroke();

        // Helical Red Spirals
        ctx.save();
        this.drawSilhouette(ctx, w, h);
        ctx.clip();

        ctx.fillStyle = '#dc2626';
        for (let y = -hh * 1.2; y < hh * 1.2; y += 22) {
          ctx.beginPath();
          ctx.moveTo(-hw * 1.2, y);
          ctx.lineTo(hw * 1.2, y + 25);
          ctx.lineTo(hw * 1.2, y + 36);
          ctx.lineTo(-hw * 1.2, y + 11);
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();

        // Glossy sugar shine highlight
        ctx.strokeStyle = 'rgba(255,255,255,0.7)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, -hh * 0.45, hw * 0.75, Math.PI * 0.8, Math.PI * 1.8);
        ctx.stroke();
      }
    },

    {
      id: 'diamond_ring',
      name: 'Diamond Ring',
      counterpart: 'candy_cane',
      width: 80,
      height: 90,
      drawSilhouette(ctx, w, h) {
        // Hexagonal jewelry ring box + sparkling faceted diamond on top
        const hw = w / 2;
        const hh = h / 2;
        ctx.beginPath();
        // Diamond facet top
        ctx.moveTo(-hw * 0.25, -hh);
        ctx.lineTo(hw * 0.25, -hh);
        ctx.lineTo(hw * 0.45, -hh * 0.65);
        ctx.lineTo(0, -hh * 0.35);
        ctx.lineTo(-hw * 0.45, -hh * 0.65);
        ctx.closePath();

        // Box base
        ctx.moveTo(-hw * 0.85, -hh * 0.25);
        ctx.lineTo(hw * 0.85, -hh * 0.25);
        ctx.lineTo(hw * 0.9, hh * 0.85);
        ctx.lineTo(-hw * 0.9, hh * 0.85);
        ctx.closePath();
      },
      drawToy(ctx, w, h) {
        const hw = w / 2;
        const hh = h / 2;
        // Midnight blue velvet ring box
        ctx.fillStyle = '#1e1b4b';
        ctx.beginPath();
        ctx.roundRect(-hw * 0.85, -hh * 0.25, hw * 1.7, hh * 1.1, 8);
        ctx.fill();
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = '#312e81';
        ctx.stroke();

        // Gold box trim line
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-hw * 0.85, hh * 0.2);
        ctx.lineTo(hw * 0.85, hh * 0.2);
        ctx.stroke();

        // 18K Gold band
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(0, -hh * 0.3, 16, Math.PI, 0, true);
        ctx.lineWidth = 5;
        ctx.strokeStyle = '#f59e0b';
        ctx.stroke();

        // Huge Sparkling Diamond
        ctx.fillStyle = '#e0f2fe';
        ctx.beginPath();
        ctx.moveTo(-hw * 0.28, -hh);
        ctx.lineTo(hw * 0.28, -hh);
        ctx.lineTo(hw * 0.48, -hh * 0.65);
        ctx.lineTo(0, -hh * 0.25);
        ctx.lineTo(-hw * 0.48, -hh * 0.65);
        ctx.closePath();
        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = '#38bdf8';
        ctx.stroke();

        // Diamond facets
        ctx.beginPath();
        ctx.moveTo(-hw * 0.28, -hh);
        ctx.lineTo(0, -hh * 0.25);
        ctx.lineTo(hw * 0.28, -hh);
        ctx.moveTo(-hw * 0.48, -hh * 0.65);
        ctx.lineTo(hw * 0.48, -hh * 0.65);
        ctx.stroke();

        // Glint sparkle
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(-hw * 0.12, -hh * 0.8, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    },

    {
      id: 'drum',
      name: 'Toy Drum',
      counterpart: 'rocking_horse',
      width: 100,
      height: 90,
      drawSilhouette(ctx, w, h) {
        // Drum cylinder with crossed drumsticks protruding above
        const hw = w / 2;
        const hh = h / 2;
        ctx.beginPath();
        // Drumsticks crossing on top
        ctx.moveTo(-hw * 0.8, -hh);
        ctx.lineTo(hw * 0.6, -hh * 0.2);
        ctx.lineTo(hw * 0.8, -hh);
        ctx.lineTo(-hw * 0.6, -hh * 0.2);

        // Drum body cylinder
        ctx.rect(-hw * 0.8, -hh * 0.2, hw * 1.6, hh * 1.1);
        ctx.closePath();
      },
      drawToy(ctx, w, h) {
        const hw = w / 2;
        const hh = h / 2;
        // Red drum barrel with golden zigzags
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(-hw * 0.8, -hh * 0.2, hw * 1.6, hh * 1.1);
        ctx.strokeStyle = '#991b1b';
        ctx.lineWidth = 2.5;
        ctx.strokeRect(-hw * 0.8, -hh * 0.2, hw * 1.6, hh * 1.1);

        // Gold chevron rope pattern
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-hw * 0.8, -hh * 0.2);
        ctx.lineTo(-hw * 0.4, hh * 0.9);
        ctx.lineTo(0, -hh * 0.2);
        ctx.lineTo(hw * 0.4, hh * 0.9);
        ctx.lineTo(hw * 0.8, -hh * 0.2);
        ctx.stroke();

        // Top & bottom brass rims
        ctx.fillStyle = '#eab308';
        ctx.fillRect(-hw * 0.85, -hh * 0.25, hw * 1.7, 10);
        ctx.fillRect(-hw * 0.85, hh * 0.85, hw * 1.7, 10);

        // Crossed wooden drumsticks with round knobs
        ctx.strokeStyle = '#b45309';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(-hw * 0.7, -hh + 5);
        ctx.lineTo(hw * 0.5, -hh * 0.1);
        ctx.moveTo(hw * 0.7, -hh + 5);
        ctx.lineTo(-hw * 0.5, -hh * 0.1);
        ctx.stroke();

        ctx.fillStyle = '#fde68a';
        ctx.beginPath();
        ctx.arc(-hw * 0.7, -hh + 5, 5, 0, Math.PI * 2);
        ctx.arc(hw * 0.7, -hh + 5, 5, 0, Math.PI * 2);
        ctx.fill();
      }
    },

    {
      id: 'rocking_horse',
      name: 'Rocking Horse',
      counterpart: 'drum',
      width: 110,
      height: 100,
      drawSilhouette(ctx, w, h) {
        // Horse body + arched rocker beam at bottom
        const hw = w / 2;
        const hh = h / 2;
        ctx.beginPath();
        // Rocker curved beam bottom
        ctx.arc(0, hh * 0.2, hw * 0.9, Math.PI * 0.18, Math.PI * 0.82, false);
        ctx.lineTo(-hw * 0.9, hh * 0.75);
        // Up left leg
        ctx.lineTo(-hw * 0.4, hh * 0.1);
        // Horse tail
        ctx.lineTo(-hw * 0.7, -hh * 0.15);
        ctx.lineTo(-hw * 0.5, -hh * 0.25);
        // Back / saddle
        ctx.lineTo(-hw * 0.1, -hh * 0.1);
        // Neck & head
        ctx.lineTo(hw * 0.2, -hh * 0.65);
        ctx.lineTo(hw * 0.2, -hh * 0.9); // Ear
        ctx.lineTo(hw * 0.45, -hh * 0.75); // Snout
        ctx.lineTo(hw * 0.25, -hh * 0.35); // Throat
        // Front chest down to front leg
        ctx.lineTo(hw * 0.4, hh * 0.1);
        ctx.lineTo(hw * 0.75, hh * 0.75);
        ctx.closePath();
      },
      drawToy(ctx, w, h) {
        const hw = w / 2;
        const hh = h / 2;
        // Dappled honey wood body
        ctx.fillStyle = '#d97706';
        this.drawSilhouette(ctx, w, h);
        ctx.fill();
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = '#92400e';
        ctx.stroke();

        // Curved Red Rocker runner at bottom
        ctx.strokeStyle = '#dc2626';
        ctx.lineWidth = 7;
        ctx.beginPath();
        ctx.arc(0, hh * 0.2, hw * 0.92, Math.PI * 0.18, Math.PI * 0.82, false);
        ctx.stroke();

        // Red Saddle
        ctx.fillStyle = '#dc2626';
        ctx.beginPath();
        ctx.ellipse(-hw * 0.1, -hh * 0.05, 14, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.ellipse(-hw * 0.1, -hh * 0.05, 10, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Golden Bridle & Reins
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(hw * 0.38, -hh * 0.65);
        ctx.lineTo(hw * 0.2, -hh * 0.45);
        ctx.lineTo(-hw * 0.1, -hh * 0.05);
        ctx.stroke();

        // Eye
        ctx.fillStyle = '#1c1917';
        ctx.beginPath();
        ctx.arc(hw * 0.3, -hh * 0.68, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  ];

  // Festive Wrapping Paper Palettes & Patterns
  const WRAP_PATTERNS = [
    { bg: '#dc2626', ribbon: '#facc15', type: 'stars', patternColor: 'rgba(254, 240, 138, 0.45)' }, // Red & Gold Stars
    { bg: '#15803d', ribbon: '#ef4444', type: 'dots', patternColor: 'rgba(255, 255, 255, 0.5)' },   // Evergreen & Snow Polka
    { bg: '#0284c7', ribbon: '#f8fafc', type: 'stripes', patternColor: 'rgba(255, 255, 255, 0.35)' },// Frost Blue & White Stripes
    { bg: '#7c3aed', ribbon: '#fbbf24', type: 'diamonds', patternColor: 'rgba(253, 230, 138, 0.4)' }, // Royal Purple & Gold
    { bg: '#ea580c', ribbon: '#16a34a', type: 'crosses', patternColor: 'rgba(254, 215, 170, 0.45)' }, // Spiced Orange & Holly
    { bg: '#0d9488', ribbon: '#f43f5e', type: 'snowflakes', patternColor: 'rgba(240, 253, 250, 0.5)' } // Nordic Teal & Pink
  ];

  // =========================================================================
  // PRESENT OBJECT IN THE GAMEPLAY PILE
  // =========================================================================
  class Present {
    constructor(item, x, y, scale = 1, rotation = 0, wrapStyle = null) {
      this.item = item;
      this.x = x;
      this.y = y;
      this.scale = scale;
      this.rotation = rotation; // radians
      this.wrapStyle = wrapStyle || WRAP_PATTERNS[Math.floor(Math.random() * WRAP_PATTERNS.length)];
      this.isUnwrapped = false;
      this.unwrapAnim = 0; // 0 to 1
      this.wobble = 0; // for wrong click shake
      this.wobbleSpeed = 0;
      this.width = item.width * scale;
      this.height = item.height * scale;
      this.zIndex = 0;
    }

    triggerWobble() {
      this.wobble = 1.0;
      this.wobbleSpeed = 35;
    }

    update(dt) {
      if (this.wobble > 0) {
        this.wobble -= dt * 3.5;
        if (this.wobble < 0) this.wobble = 0;
      }
      if (this.isUnwrapped && this.unwrapAnim < 1.0) {
        this.unwrapAnim += dt * 3.5;
        if (this.unwrapAnim > 1.0) this.unwrapAnim = 1.0;
      }
    }

    // Precise hit test in canvas coordinates
    containsPoint(px, py, ctx) {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rotation);
      ctx.scale(this.scale, this.scale);
      this.item.drawSilhouette(ctx, this.item.width, this.item.height);
      const isInside = ctx.isPointInPath(px, py);
      ctx.restore();
      return isInside;
    }

    draw(ctx) {
      ctx.save();
      const shakeX = this.wobble > 0 ? Math.sin(this.wobble * this.wobbleSpeed) * 12 * this.wobble : 0;
      ctx.translate(this.x + shakeX, this.y);
      ctx.rotate(this.rotation);
      ctx.scale(this.scale, this.scale);

      // Drop shadow underneath present
      ctx.save();
      ctx.shadowColor = 'rgba(15, 23, 42, 0.45)';
      ctx.shadowBlur = 18;
      ctx.shadowOffsetY = 10;
      this.item.drawSilhouette(ctx, this.item.width, this.item.height);
      ctx.fillStyle = 'rgba(0,0,0,0.15)';
      ctx.fill();
      ctx.restore();

      if (this.isUnwrapped) {
        // Draw the vibrant unwrapped toy!
        this.item.drawToy(ctx, this.item.width, this.item.height);

        // Celebratory flash sparkle overlay when recently unwrapped
        if (this.unwrapAnim < 1.0) {
          ctx.save();
          this.item.drawSilhouette(ctx, this.item.width, this.item.height);
          ctx.fillStyle = `rgba(255, 255, 255, ${(1.0 - this.unwrapAnim) * 0.7})`;
          ctx.fill();
          ctx.restore();
        }
      } else {
        // Draw the wrapped present hugging the exact silhouette!
        this.drawWrappedPresent(ctx);
      }

      ctx.restore();
    }

    drawWrappedPresent(ctx) {
      const w = this.item.width;
      const h = this.item.height;

      ctx.save();
      // Clip to item's exact silhouette
      this.item.drawSilhouette(ctx, w, h);
      ctx.clip();

      // 1. Wrapping paper base color
      ctx.fillStyle = this.wrapStyle.bg;
      ctx.fillRect(-w, -h, w * 2, h * 2);

      // 2. Pattern fill
      ctx.fillStyle = this.wrapStyle.patternColor;
      this.renderPattern(ctx, w, h, this.wrapStyle.type);

      // 3. Silhouette 3D lighting / bevel shading
      const bevelGrad = ctx.createLinearGradient(-w * 0.5, -h * 0.5, w * 0.5, h * 0.5);
      bevelGrad.addColorStop(0, 'rgba(255, 255, 255, 0.35)');
      bevelGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.0)');
      bevelGrad.addColorStop(1, 'rgba(0, 0, 0, 0.35)');
      ctx.fillStyle = bevelGrad;
      ctx.fillRect(-w, -h, w * 2, h * 2);

      // 4. Wrapping Ribbon Straps (Cross ribbons hugging the silhouette)
      ctx.fillStyle = this.wrapStyle.ribbon;
      // Vertical ribbon
      ctx.fillRect(-7, -h, 14, h * 2);
      // Horizontal ribbon
      ctx.fillRect(-w, -7, w * 2, 14);

      ctx.restore();

      // Outer Silhouette Outline (Clean Nitrome vector style)
      ctx.save();
      this.item.drawSilhouette(ctx, w, h);
      ctx.lineWidth = 3.5;
      ctx.strokeStyle = '#0f172a';
      ctx.stroke();
      ctx.restore();

      // 5. Ornate Golden Holiday Bow placed at ribbon intersection
      this.drawRibbonBow(ctx, this.wrapStyle.ribbon);
    }

    renderPattern(ctx, w, h, type) {
      const step = 20;
      switch (type) {
        case 'stars':
          for (let x = -w; x <= w; x += step) {
            for (let y = -h; y <= h; y += step) {
              const ox = (Math.abs(y) % (step * 2) === 0) ? step / 2 : 0;
              this.drawMiniStar(ctx, x + ox, y, 4);
            }
          }
          break;
        case 'dots':
          for (let x = -w; x <= w; x += step) {
            for (let y = -h; y <= h; y += step) {
              const ox = (Math.abs(y) % (step * 2) === 0) ? step / 2 : 0;
              ctx.beginPath();
              ctx.arc(x + ox, y, 3, 0, Math.PI * 2);
              ctx.fill();
            }
          }
          break;
        case 'stripes':
          ctx.lineWidth = 6;
          ctx.strokeStyle = this.wrapStyle.patternColor;
          for (let d = -w - h; d <= w + h; d += 22) {
            ctx.beginPath();
            ctx.moveTo(d, -h);
            ctx.lineTo(d + h * 2, h);
            ctx.stroke();
          }
          break;
        case 'snowflakes':
          for (let x = -w; x <= w; x += step * 1.4) {
            for (let y = -h; y <= h; y += step * 1.4) {
              this.drawMiniSnowflake(ctx, x, y, 5);
            }
          }
          break;
        default:
          for (let x = -w; x <= w; x += step) {
            for (let y = -h; y <= h; y += step) {
              ctx.fillRect(x, y, 4, 4);
            }
          }
      }
    }

    drawMiniStar(ctx, cx, cy, r) {
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const a1 = (i * Math.PI * 2) / 5 - Math.PI / 2;
        const a2 = a1 + Math.PI / 5;
        const x1 = cx + Math.cos(a1) * r;
        const y1 = cy + Math.sin(a1) * r;
        const x2 = cx + Math.cos(a2) * (r * 0.45);
        const y2 = cy + Math.sin(a2) * (r * 0.45);
        if (i === 0) ctx.moveTo(x1, y1);
        else ctx.lineTo(x1, y1);
        ctx.lineTo(x2, y2);
      }
      ctx.closePath();
      ctx.fill();
    }

    drawMiniSnowflake(ctx, cx, cy, r) {
      ctx.save();
      ctx.strokeStyle = this.wrapStyle.patternColor;
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 3; i++) {
        const ang = (i * Math.PI) / 3;
        ctx.beginPath();
        ctx.moveTo(cx - Math.cos(ang) * r, cy - Math.sin(ang) * r);
        ctx.lineTo(cx + Math.cos(ang) * r, cy + Math.sin(ang) * r);
        ctx.stroke();
      }
      ctx.restore();
    }

    drawRibbonBow(ctx, color) {
      ctx.save();
      ctx.fillStyle = color;
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2;

      // Left loop
      ctx.beginPath();
      ctx.bezierCurveTo(-14, -16, -20, 4, 0, 0);
      ctx.fill();
      ctx.stroke();

      // Right loop
      ctx.beginPath();
      ctx.bezierCurveTo(14, -16, 20, 4, 0, 0);
      ctx.fill();
      ctx.stroke();

      // Ribbon tails
      ctx.beginPath();
      ctx.moveTo(-4, 0);
      ctx.lineTo(-12, 16);
      ctx.lineTo(-4, 12);
      ctx.lineTo(0, 0);
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(4, 0);
      ctx.lineTo(12, 16);
      ctx.lineTo(4, 12);
      ctx.lineTo(0, 0);
      ctx.fill();
      ctx.stroke();

      // Center Knot
      ctx.beginPath();
      ctx.arc(0, 0, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
  }

  // =========================================================================
  // PARTICLE SYSTEM (Paper Tearing, Ribbons, Confetti & Floating Floating Popups)
  // =========================================================================
  class ParticleEngine {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.particles = [];
      this.floatingTexts = [];
    }

    resize(w, h) {
      this.canvas.width = w;
      this.canvas.height = h;
    }

    // Burst of paper shreds, ribbons and sparkles upon correct present click
    spawnPaperRip(x, y, wrapStyle) {
      const colors = [
        wrapStyle.bg,
        wrapStyle.ribbon,
        '#ffffff',
        '#facc15',
        '#f87171',
        '#4ade80'
      ];

      // 40 Paper Shreds (tumbling rectangles)
      for (let i = 0; i < 40; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 380 + 120;
        this.particles.push({
          x: x,
          y: y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 150,
          gravity: 580,
          w: Math.random() * 12 + 6,
          h: Math.random() * 8 + 4,
          rot: Math.random() * Math.PI * 2,
          rotSpeed: (Math.random() - 0.5) * 14,
          color: colors[Math.floor(Math.random() * colors.length)],
          alpha: 1.0,
          life: Math.random() * 0.7 + 0.8
        });
      }

      // 15 Ribbon curly strands
      for (let i = 0; i < 15; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 300 + 80;
        this.particles.push({
          x: x,
          y: y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 180,
          gravity: 420,
          w: Math.random() * 20 + 10,
          h: 3,
          isRibbon: true,
          rot: Math.random() * Math.PI * 2,
          rotSpeed: (Math.random() - 0.5) * 10,
          color: wrapStyle.ribbon,
          alpha: 1.0,
          life: 1.2
        });
      }

      // 20 Golden sparkle stars
      for (let i = 0; i < 20; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 220 + 60;
        this.particles.push({
          x: x,
          y: y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          gravity: 120,
          r: Math.random() * 4 + 2,
          isStar: true,
          color: '#fef08a',
          alpha: 1.0,
          life: Math.random() * 0.5 + 0.5
        });
      }
    }

    // Floating text indicator (e.g. "+5s", "-3s", "+100")
    addFloatingText(x, y, text, color) {
      this.floatingTexts.push({
        x: x,
        y: y,
        text: text,
        color: color,
        vy: -75,
        alpha: 1.0,
        life: 1.1
      });
    }

    update(dt) {
      // Update particles
      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += p.gravity * dt;
        p.rot += p.rotSpeed * dt;
        p.life -= dt;
        p.alpha = Math.max(0, p.life);
        if (p.life <= 0) {
          this.particles.splice(i, 1);
        }
      }

      // Update floating texts
      for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
        const ft = this.floatingTexts[i];
        ft.y += ft.vy * dt;
        ft.life -= dt;
        ft.alpha = Math.max(0, ft.life);
        if (ft.life <= 0) {
          this.floatingTexts.splice(i, 1);
        }
      }
    }

    draw() {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      // Draw particles
      for (const p of this.particles) {
        this.ctx.save();
        this.ctx.globalAlpha = p.alpha;
        this.ctx.translate(p.x, p.y);
        this.ctx.rotate(p.rot);

        if (p.isStar) {
          this.ctx.fillStyle = p.color;
          this.ctx.beginPath();
          this.ctx.arc(0, 0, p.r, 0, Math.PI * 2);
          this.ctx.fill();
        } else {
          this.ctx.fillStyle = p.color;
          this.ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        }
        this.ctx.restore();
      }

      // Draw floating texts
      for (const ft of this.floatingTexts) {
        this.ctx.save();
        this.ctx.globalAlpha = ft.alpha;
        this.ctx.font = '900 24px "Fredoka", "Nunito", sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillStyle = ft.color;
        this.ctx.strokeStyle = '#0f172a';
        this.ctx.lineWidth = 4;
        this.ctx.strokeText(ft.text, ft.x, ft.y);
        this.ctx.fillText(ft.text, ft.x, ft.y);
        this.ctx.restore();
      }
    }
  }

  // =========================================================================
  // BACKGROUND SNOW ENGINE
  // =========================================================================
  class SnowEngine {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.flakes = [];
      this.initFlakes(70);
    }

    resize(w, h) {
      this.canvas.width = w;
      this.canvas.height = h;
    }

    initFlakes(count) {
      this.flakes = [];
      for (let i = 0; i < count; i++) {
        this.flakes.push({
          x: Math.random() * window.innerWidth,
          y: Math.random() * window.innerHeight,
          r: Math.random() * 2.8 + 1,
          speed: Math.random() * 45 + 20,
          sway: Math.random() * 2,
          swaySpeed: Math.random() * 1.5 + 0.5,
          alpha: Math.random() * 0.6 + 0.25
        });
      }
    }

    update(dt) {
      const w = this.canvas.width;
      const h = this.canvas.height;
      for (const f of this.flakes) {
        f.y += f.speed * dt;
        f.x += Math.sin(f.y * 0.02 * f.swaySpeed) * f.sway;
        if (f.y > h + 10) {
          f.y = -10;
          f.x = Math.random() * w;
        }
        if (f.x > w + 10) f.x = -10;
        if (f.x < -10) f.x = w + 10;
      }
    }

    draw() {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.fillStyle = '#ffffff';
      for (const f of this.flakes) {
        this.ctx.save();
        this.ctx.globalAlpha = f.alpha;
        this.ctx.beginPath();
        this.ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();
      }
    }
  }

  // =========================================================================
  // MAIN GAME ENGINE CONTROLLER
  // =========================================================================
  class GiftWrappedGame {
    constructor() {
      // DOM Elements
      this.snowCanvas = document.getElementById('snowCanvas');
      this.gameCanvas = document.getElementById('gameCanvas');
      this.fxCanvas = document.getElementById('fxCanvas');
      this.targetCanvas = document.getElementById('targetCanvas');
      this.ctx = this.gameCanvas.getContext('2d');
      this.targetCtx = this.targetCanvas.getContext('2d');

      // HUD elements
      this.timerBadge = document.getElementById('timerBadge');
      this.timerText = document.getElementById('timerText');
      this.scoreText = document.getElementById('scoreText');
      this.streakBadge = document.getElementById('streakBadge');
      this.targetName = document.getElementById('targetName');
      this.targetCard = document.getElementById('targetCard');
      this.btnHome = document.getElementById('btnHome');
      this.btnSound = document.getElementById('btnSound');
      this.soundIcon = document.getElementById('soundIcon');
      this.btnFullscreen = document.getElementById('btnFullscreen');
      this.gameToast = document.getElementById('gameToast');
      this.toastText = document.getElementById('toastText');

      // Screens & Modals
      this.menuScreen = document.getElementById('menuScreen');
      this.howToModal = document.getElementById('howToModal');
      this.settingsModal = document.getElementById('settingsModal');
      this.gameOverModal = document.getElementById('gameOverModal');
      this.homeModal = document.getElementById('homeModal');
      this.menuBestScore = document.getElementById('menuBestScore');

      // Modal buttons
      this.btnPlay = document.getElementById('btnPlay');
      this.btnHowTo = document.getElementById('btnHowTo');
      this.btnCloseHowTo = document.getElementById('btnCloseHowTo');
      this.btnGotIt = document.getElementById('btnGotIt');
      this.btnSettings = document.getElementById('btnSettings');
      this.btnCloseSettings = document.getElementById('btnCloseSettings');
      this.btnResetScore = document.getElementById('btnResetScore');
      this.toggleMusic = document.getElementById('toggleMusic');
      this.toggleSfx = document.getElementById('toggleSfx');
      this.btnPlayAgain = document.getElementById('btnPlayAgain');
      this.btnMenuFromOver = document.getElementById('btnMenuFromOver');
      this.btnCancelHome = document.getElementById('btnCancelHome');
      this.btnConfirmHome = document.getElementById('btnConfirmHome');
      this.mascotBox = document.getElementById('mascotBox');

      // Game Stats Elements
      this.overScore = document.getElementById('overScore');
      this.overPresents = document.getElementById('overPresents');
      this.overStreak = document.getElementById('overStreak');
      this.overBest = document.getElementById('overBest');

      // Subsystems
      this.sound = new SoundManager();
      this.snow = new SnowEngine(this.snowCanvas);
      this.fx = new ParticleEngine(this.fxCanvas);

      // State variables
      this.state = 'MENU'; // 'MENU' | 'PLAYING' | 'PAUSED' | 'GAMEOVER'
      this.timeRemaining = 20.0;
      this.score = 0;
      this.streak = 1;
      this.bestStreak = 1;
      this.presentsFound = 0;
      this.bestScore = parseInt(localStorage.getItem('gw_best_score') || '0', 10);
      this.roundTargetItem = null;
      this.presents = [];
      this.lastTickTime = 0;
      this.isAdvancingRound = false;

      this.initEvents();
      this.resize();
      this.updateBestScoreDisplay();
      this.renderMenuTargetPreview();

      // Start core loop
      this.lastTimestamp = performance.now();
      requestAnimationFrame(this.loop.bind(this));
    }

    updateBestScoreDisplay() {
      if (this.menuBestScore) this.menuBestScore.textContent = this.bestScore.toLocaleString();
      if (this.overBest) this.overBest.textContent = this.bestScore.toLocaleString();
    }

    resize() {
      const w = window.innerWidth;
      const h = window.innerHeight;
      this.snow.resize(w, h);
      this.fx.resize(w, h);
      this.gameCanvas.width = w;
      this.gameCanvas.height = h;

      // Re-position presents smoothly if already playing
      if (this.state === 'PLAYING' && this.presents.length > 0) {
        // Keep present cluster nicely centered
      }
    }

    initEvents() {
      window.addEventListener('resize', () => this.resize());

      // Play button
      this.btnPlay.addEventListener('click', () => {
        this.startGame();
      });

      // Mascot click in menu
      if (this.mascotBox) {
        this.mascotBox.addEventListener('click', (e) => {
          this.sound.playChime(3);
          const rect = this.mascotBox.getBoundingClientRect();
          this.fx.spawnPaperRip(rect.left + rect.width / 2, rect.top + rect.height / 2, WRAP_PATTERNS[0]);
        });
      }

      // Top HUD Buttons
      this.btnHome.addEventListener('click', () => {
        if (this.state === 'PLAYING') {
          this.showModal(this.homeModal);
        }
      });

      this.btnSound.addEventListener('click', () => {
        const unmuted = this.sound.toggleMasterMute();
        this.soundIcon.textContent = unmuted ? '🔊' : '🔇';
      });

      this.btnFullscreen.addEventListener('click', () => {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {});
        } else {
          document.exitFullscreen().catch(() => {});
        }
      });

      // How to Play modal
      this.btnHowTo.addEventListener('click', () => this.showModal(this.howToModal));
      this.btnCloseHowTo.addEventListener('click', () => this.hideModal(this.howToModal));
      this.btnGotIt.addEventListener('click', () => this.hideModal(this.howToModal));

      // Settings modal
      this.btnSettings.addEventListener('click', () => this.showModal(this.settingsModal));
      this.btnCloseSettings.addEventListener('click', () => this.hideModal(this.settingsModal));
      this.toggleMusic.addEventListener('change', (e) => this.sound.setMusic(e.target.checked));
      this.toggleSfx.addEventListener('change', (e) => this.sound.setSfx(e.target.checked));

      this.btnResetScore.addEventListener('click', () => {
        if (confirm('Reset your high score to 0?')) {
          this.bestScore = 0;
          localStorage.setItem('gw_best_score', '0');
          this.updateBestScoreDisplay();
        }
      });

      // Confirm Home Return
      this.btnCancelHome.addEventListener('click', () => this.hideModal(this.homeModal));
      this.btnConfirmHome.addEventListener('click', () => {
        this.hideModal(this.homeModal);
        this.returnToMenu();
      });

      // Game Over modal buttons
      this.btnPlayAgain.addEventListener('click', () => {
        this.hideModal(this.gameOverModal);
        this.startGame();
      });

      this.btnMenuFromOver.addEventListener('click', () => {
        this.hideModal(this.gameOverModal);
        this.returnToMenu();
      });

      // Pointer / Click interaction on Canvas (Present Hit Test)
      this.gameCanvas.addEventListener('pointerdown', (e) => this.handlePointerDown(e));
    }

    showModal(modal) {
      if (this.state === 'PLAYING') {
        this.prevState = this.state;
        this.state = 'PAUSED';
      }
      modal.classList.remove('hidden');
    }

    hideModal(modal) {
      modal.classList.add('hidden');
      if (this.state === 'PAUSED' && this.prevState === 'PLAYING') {
        this.state = 'PLAYING';
      }
    }

    startGame() {
      this.state = 'PLAYING';
      this.timeRemaining = 20.0;
      this.score = 0;
      this.streak = 1;
      this.bestStreak = 1;
      this.presentsFound = 0;
      this.isAdvancingRound = false;

      this.menuScreen.classList.add('hidden');
      this.updateHud();

      this.sound.startBGM();
      this.setupNextRound();
    }

    returnToMenu() {
      this.state = 'MENU';
      this.sound.stopBGM();
      this.menuScreen.classList.remove('hidden');
      this.updateBestScoreDisplay();
    }

    // Set up a new round: pick a target toy, generate decoy cluster with counterpart
    setupNextRound() {
      this.isAdvancingRound = false;

      // 1. Pick a random target item
      const itemPool = [...ITEMS];
      const targetItem = itemPool[Math.floor(Math.random() * itemPool.length)];
      this.roundTargetItem = targetItem;

      // 2. Render Target Preview in HUD
      this.renderTargetPreview(targetItem);

      // 3. Assemble Items for the Present Pile
      // Difficulty progression: number of presents grows with presents found
      const pileCount = Math.min(6 + Math.floor(this.presentsFound / 2), 14);
      const chosenItems = [targetItem];

      // CRITICAL NITROME TRICK: If target has a counterpart, guaranteed to include it as a decoy!
      if (targetItem.counterpart) {
        const decoy = ITEMS.find((i) => i.id === targetItem.counterpart);
        if (decoy) chosenItems.push(decoy);
      }

      // Fill remaining slots with random items
      while (chosenItems.length < pileCount) {
        const rand = itemPool[Math.floor(Math.random() * itemPool.length)];
        chosenItems.push(rand);
      }

      // Shuffle chosen items array
      for (let i = chosenItems.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [chosenItems[i], chosenItems[j]] = [chosenItems[j], chosenItems[i]];
      }

      // 4. Position presents in a pleasant holiday pile under the tree
      const w = this.gameCanvas.width;
      const h = this.gameCanvas.height;
      const hudHeight = 90;
      const usableWidth = Math.min(w * 0.88, 860);
      const usableHeight = Math.min(h - hudHeight - 80, 520);
      const centerX = w / 2;
      const centerY = hudHeight + usableHeight / 2 + 30;

      this.presents = [];

      // Grid/cluster jitter distribution
      const cols = Math.ceil(Math.sqrt(pileCount * 1.3));
      const rows = Math.ceil(pileCount / cols);
      const colStep = usableWidth / (cols + 1);
      const rowStep = usableHeight / (rows + 1);

      let itemIndex = 0;
      for (let r = 0; r < rows && itemIndex < pileCount; r++) {
        for (let c = 0; c < cols && itemIndex < pileCount; c++) {
          const it = chosenItems[itemIndex];
          const jitterX = (Math.random() - 0.5) * colStep * 0.55;
          const jitterY = (Math.random() - 0.5) * rowStep * 0.55;
          const px = centerX - usableWidth / 2 + (c + 1) * colStep + jitterX;
          const py = centerY - usableHeight / 2 + (r + 1) * rowStep + jitterY;
          const rot = (Math.random() - 0.5) * 0.38; // subtle realistic rotation
          const scale = Math.random() * 0.15 + 0.88;

          const present = new Present(it, px, py, scale, rot);
          present.zIndex = itemIndex;
          this.presents.push(present);
          itemIndex++;
        }
      }

      // Sort z-index so top presents render over bottom presents
      this.presents.sort((a, b) => a.y - b.y);
    }

    renderTargetPreview(item) {
      this.targetName.textContent = item.name;
      const cw = this.targetCanvas.width;
      const ch = this.targetCanvas.height;
      this.targetCtx.clearRect(0, 0, cw, ch);

      this.targetCtx.save();
      this.targetCtx.translate(cw / 2, ch / 2);
      const scale = Math.min((cw * 0.72) / item.width, (ch * 0.72) / item.height);
      this.targetCtx.scale(scale, scale);
      item.drawToy(this.targetCtx, item.width, item.height);
      this.targetCtx.restore();

      // Trigger sparkle pulse animation
      this.targetCard.classList.remove('pulse');
      void this.targetCard.offsetWidth; // trigger reflow
      this.targetCard.classList.add('pulse');
    }

    renderMenuTargetPreview() {
      // Draw a cute violin on the target canvas by default
      const defaultItem = ITEMS[0];
      this.renderTargetPreview(defaultItem);
    }

    handlePointerDown(e) {
      if (this.state !== 'PLAYING' || this.isAdvancingRound) return;

      const rect = this.gameCanvas.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;

      // Hit test presents from top-most (reverse order)
      let clickedPresent = null;
      for (let i = this.presents.length - 1; i >= 0; i--) {
        const p = this.presents[i];
        if (!p.isUnwrapped && p.containsPoint(px, py, this.ctx)) {
          clickedPresent = p;
          break;
        }
      }

      if (!clickedPresent) return;

      // Check if clicked present matches round target
      if (clickedPresent.item.id === this.roundTargetItem.id) {
        this.handleCorrectPresent(clickedPresent);
      } else {
        this.handleWrongPresent(clickedPresent);
      }
    }

    handleCorrectPresent(present) {
      this.sound.playRip();
      this.sound.playChime(this.streak);

      present.isUnwrapped = true;
      this.isAdvancingRound = true;
      this.presentsFound++;

      // Time Bonus & Score
      const timeBonus = 5.0;
      this.timeRemaining = Math.min(this.timeRemaining + timeBonus, 60.0);
      const points = 100 * this.streak;
      this.score += points;

      this.streak++;
      if (this.streak > this.bestStreak) this.bestStreak = this.streak;

      // FX: Paper tearing particle explosion
      this.fx.spawnPaperRip(present.x, present.y, present.wrapStyle);
      this.fx.addFloatingText(present.x, present.y - 30, `+${timeBonus}s`, '#22c55e');
      this.fx.addFloatingText(present.x, present.y + 10, `+${points}`, '#facc15');

      this.showToast(`+${timeBonus}s BONUS! +${points} PTS!`);
      this.updateHud();

      // Short delay so player sees the unwrapped gift reveal, then new round
      setTimeout(() => {
        if (this.state === 'PLAYING') {
          this.setupNextRound();
        }
      }, 420);
    }

    handleWrongPresent(present) {
      this.sound.playBuzzer();
      present.triggerWobble();

      // Time Penalty
      const timePenalty = 3.0;
      this.timeRemaining = Math.max(0, this.timeRemaining - timePenalty);
      this.streak = 1; // Streak reset!

      // FX
      this.fx.addFloatingText(present.x, present.y - 20, `-${timePenalty}s`, '#ef4444');
      this.timerBadge.classList.add('warning');
      setTimeout(() => this.timerBadge.classList.remove('warning'), 500);

      this.showToast(`WRONG GIFT! -${timePenalty}s PENALTY`, '#ef4444');
      this.updateHud();

      if (this.timeRemaining <= 0) {
        this.triggerGameOver();
      }
    }

    showToast(message, color = '#22c55e') {
      if (!this.gameToast) return;
      this.toastText.textContent = message;
      this.gameToast.style.borderColor = color;
      this.gameToast.classList.remove('hidden');
      clearTimeout(this.toastTimer);
      this.toastTimer = setTimeout(() => {
        this.gameToast.classList.add('hidden');
      }, 1200);
    }

    updateHud() {
      // Timer Text
      const t = Math.max(0, Math.ceil(this.timeRemaining));
      this.timerText.textContent = `${t}s`;
      if (this.timeRemaining <= 5.0) {
        this.timerBadge.classList.add('warning');
      } else {
        this.timerBadge.classList.remove('warning');
      }

      // Score Text
      this.scoreText.textContent = this.score.toLocaleString();

      // Streak Badge
      if (this.streak > 1) {
        this.streakBadge.textContent = `x${this.streak}`;
        this.streakBadge.style.display = 'inline-block';
      } else {
        this.streakBadge.style.display = 'none';
      }
    }

    triggerGameOver() {
      this.state = 'GAMEOVER';
      this.sound.stopBGM();
      this.sound.playGameOver();

      if (this.score > this.bestScore) {
        this.bestScore = this.score;
        localStorage.setItem('gw_best_score', this.bestScore.toString());
      }

      this.overScore.textContent = this.score.toLocaleString();
      this.overPresents.textContent = this.presentsFound.toString();
      this.overStreak.textContent = `x${this.bestStreak}`;
      this.overBest.textContent = this.bestScore.toLocaleString();

      this.showModal(this.gameOverModal);
    }

    // Main Game Loop
    loop(timestamp) {
      const dt = Math.min((timestamp - this.lastTimestamp) / 1000, 0.1);
      this.lastTimestamp = timestamp;

      // Update Systems
      this.snow.update(dt);
      this.fx.update(dt);

      if (this.state === 'PLAYING') {
        this.timeRemaining -= dt;

        // Clock tick warning sound when under 5s
        if (this.timeRemaining <= 5.0 && this.timeRemaining > 0) {
          if (timestamp - this.lastTickTime > 1000) {
            this.sound.playTick();
            this.lastTickTime = timestamp;
          }
        }

        if (this.timeRemaining <= 0) {
          this.timeRemaining = 0;
          this.updateHud();
          this.triggerGameOver();
        } else {
          this.updateHud();
        }

        for (const p of this.presents) {
          p.update(dt);
        }
      }

      // Render Everything
      this.render();

      requestAnimationFrame(this.loop.bind(this));
    }

    render() {
      const w = this.gameCanvas.width;
      const h = this.gameCanvas.height;

      // 1. Snow Layer
      this.snow.draw();

      // 2. Clear Main Canvas
      this.ctx.clearRect(0, 0, w, h);

      // Draw Festive Backdrop Floor Shadow / Carpet beneath presents
      if (this.state === 'PLAYING' || this.state === 'PAUSED') {
        this.ctx.save();
        const grad = this.ctx.createRadialGradient(w / 2, h * 0.7, 50, w / 2, h * 0.7, w * 0.55);
        grad.addColorStop(0, 'rgba(15, 23, 42, 0.35)');
        grad.addColorStop(0.7, 'rgba(15, 23, 42, 0.12)');
        grad.addColorStop(1, 'rgba(15, 23, 42, 0.0)');
        this.ctx.fillStyle = grad;
        this.ctx.beginPath();
        this.ctx.ellipse(w / 2, h * 0.7, w * 0.5, h * 0.25, 0, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();

        // Draw Presents
        for (const p of this.presents) {
          p.draw(this.ctx);
        }
      }

      // 3. FX Layer (Particles & Floating texts)
      this.fx.draw();
    }
  }

  // Launch Game on DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new GiftWrappedGame());
  } else {
    new GiftWrappedGame();
  }
})();
