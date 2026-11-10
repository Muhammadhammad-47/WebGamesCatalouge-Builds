// =========================================================================
    // COSMOS LINES - AUDIO SYNTHESIZER & AMBIENT DRONE ENGINE
    // =========================================================================
    class SoundEngine {
      constructor() {
        this.ctx = null;
        this.sfxEnabled = localStorage.getItem('cosmos_sfx') !== 'false';
        this.musicEnabled = localStorage.getItem('cosmos_music') !== 'false';
        this.hapticsEnabled = localStorage.getItem('cosmos_haptics') !== 'false';

        // Scale frequencies
        this.scale = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25, 783.99, 880.00, 1046.50];

        // Ambient Drone Nodes
        this.droneOsc1 = null;
        this.droneOsc2 = null;
        this.droneFilter = null;
        this.droneGain = null;
        this.droneIsPlaying = false;
      }

      init() {
        if (!this.ctx) {
          const AudioContext = window.AudioContext || window.webkitAudioContext;
          if (AudioContext) {
            this.ctx = new AudioContext();
          }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
          this.ctx.resume();
        }
        if (this.musicEnabled && !this.droneIsPlaying) {
          this.startAmbientMusic();
        }
      }

      startAmbientMusic() {
        if (!this.ctx || this.droneIsPlaying || !this.musicEnabled) return;
        try {
          const now = this.ctx.currentTime;
          this.droneGain = this.ctx.createGain();
          this.droneGain.gain.setValueAtTime(0.001, now);
          this.droneGain.gain.exponentialRampToValueAtTime(0.08, now + 3);

          this.droneFilter = this.ctx.createBiquadFilter();
          this.droneFilter.type = 'lowpass';
          this.droneFilter.frequency.setValueAtTime(320, now);

          // Deep root oscillator (C2 = 65.41 Hz)
          this.droneOsc1 = this.ctx.createOscillator();
          this.droneOsc1.type = 'triangle';
          this.droneOsc1.frequency.setValueAtTime(65.41, now);

          // Fifth harmonic (G2 = 98.00 Hz) with gentle slow detune
          this.droneOsc2 = this.ctx.createOscillator();
          this.droneOsc2.type = 'sine';
          this.droneOsc2.frequency.setValueAtTime(98.00, now);

          this.droneOsc1.connect(this.droneFilter);
          this.droneOsc2.connect(this.droneFilter);
          this.droneFilter.connect(this.droneGain);
          this.droneGain.connect(this.ctx.destination);

          this.droneOsc1.start(now);
          this.droneOsc2.start(now);
          this.droneIsPlaying = true;
        } catch (_) {}
      }

      stopAmbientMusic() {
        if (!this.ctx || !this.droneIsPlaying) return;
        try {
          const now = this.ctx.currentTime;
          if (this.droneGain) {
            this.droneGain.gain.setValueAtTime(this.droneGain.gain.value, now);
            this.droneGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);
          }
          setTimeout(() => {
            if (this.droneOsc1) { try { this.droneOsc1.stop(); this.droneOsc1.disconnect(); } catch (_) {} }
            if (this.droneOsc2) { try { this.droneOsc2.stop(); this.droneOsc2.disconnect(); } catch (_) {} }
            this.droneIsPlaying = false;
          }, 1300);
        } catch (_) {
          this.droneIsPlaying = false;
        }
      }

      setSfx(enabled) {
        this.sfxEnabled = enabled;
        localStorage.setItem('cosmos_sfx', enabled);
        if (enabled) this.playStep(2, 4);
      }

      setMusic(enabled) {
        this.musicEnabled = enabled;
        localStorage.setItem('cosmos_music', enabled);
        if (enabled) {
          this.init();
          this.startAmbientMusic();
        } else {
          this.stopAmbientMusic();
        }
      }

      setHaptics(enabled) {
        this.hapticsEnabled = enabled;
        localStorage.setItem('cosmos_haptics', enabled);
        if (enabled) this.vibrate(25);
      }

      vibrate(ms = 15) {
        if (!this.hapticsEnabled) return;
        if (navigator.vibrate) {
          try { navigator.vibrate(ms); } catch (_) {}
        }
      }

      playStep(stepIndex, totalSteps) {
        if (!this.sfxEnabled) return;
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const noteIdx = Math.min(stepIndex, this.scale.length - 1);
        const freq = this.scale[noteIdx];

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.exponentialRampToValueAtTime(0.24, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);

        const harmonic = this.ctx.createOscillator();
        const hGain = this.ctx.createGain();
        harmonic.type = 'triangle';
        harmonic.frequency.setValueAtTime(freq * 2, now);
        hGain.gain.setValueAtTime(0.001, now);
        hGain.gain.exponentialRampToValueAtTime(0.08, now + 0.015);
        hGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        harmonic.connect(hGain);
        hGain.connect(this.ctx.destination);

        osc.start(now);
        harmonic.start(now);
        osc.stop(now + 0.3);
        harmonic.stop(now + 0.22);

        this.vibrate(12);
      }

      playRetract() {
        if (!this.sfxEnabled) return;
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(360, now);
        osc.frequency.exponentialRampToValueAtTime(180, now + 0.12);

        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.15);
        this.vibrate(8);
      }

      playNodeLock() {
        if (!this.sfxEnabled) return;
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        [523.25, 659.25, 783.99].forEach((freq, idx) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + idx * 0.04);
          gain.gain.setValueAtTime(0.001, now + idx * 0.04);
          gain.gain.exponentialRampToValueAtTime(0.18, now + idx * 0.04 + 0.03);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.04 + 0.38);

          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(now + idx * 0.04);
          osc.stop(now + idx * 0.04 + 0.4);
        });
        this.vibrate(30);
      }

      playUndo() {
        if (!this.sfxEnabled) return;
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(480, now);
        osc.frequency.exponentialRampToValueAtTime(240, now + 0.15);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.18);
      }

      playReset() {
        if (!this.sfxEnabled) return;
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        [392.00, 329.63, 261.63].forEach((f, i) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(f, now + i * 0.05);
          gain.gain.setValueAtTime(0.12, now + i * 0.05);
          gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.05 + 0.2);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(now + i * 0.05);
          osc.stop(now + i * 0.05 + 0.22);
        });
      }

      playWin() {
        if (!this.sfxEnabled) return;
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const chord = [261.63, 392.00, 523.25, 659.25, 783.99, 987.77, 1046.50];
        chord.forEach((freq, idx) => {
          const t = now + idx * 0.07;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, t);
          gain.gain.setValueAtTime(0.001, t);
          gain.gain.exponentialRampToValueAtTime(0.22, t + 0.04);
          gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.85);

          const shimmer = this.ctx.createOscillator();
          const sGain = this.ctx.createGain();
          shimmer.type = 'triangle';
          shimmer.frequency.setValueAtTime(freq * 1.5, t);
          sGain.gain.setValueAtTime(0.001, t);
          sGain.gain.exponentialRampToValueAtTime(0.06, t + 0.03);
          sGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);

          osc.connect(gain);
          gain.connect(this.ctx.destination);
          shimmer.connect(sGain);
          sGain.connect(this.ctx.destination);

          osc.start(t);
          shimmer.start(t);
          osc.stop(t + 0.9);
          shimmer.stop(t + 0.65);
        });
        this.vibrate([40, 60, 80]);
      }
    }

    const sound = new SoundEngine();

    // =========================================================================
    // STARFIELD BACKGROUND ANIMATION
    // =========================================================================
    const bgCanvas = document.getElementById('bgCanvas');
    const bgCtx = bgCanvas.getContext('2d');
    let stars = [];
    let shootingStar = null;
    let starfieldHighDensity = localStorage.getItem('cosmos_starfield') !== 'false';

    function resizeBg() {
      bgCanvas.width = window.innerWidth;
      bgCanvas.height = window.innerHeight;
      initStars();
    }

    function initStars() {
      const divisor = starfieldHighDensity ? 7500 : 18000;
      const count = Math.floor((bgCanvas.width * bgCanvas.height) / divisor);
      stars = [];
      for (let i = 0; i < count; i++) {
        stars.push({
          x: Math.random() * bgCanvas.width,
          y: Math.random() * bgCanvas.height,
          radius: 0.6 + Math.random() * 1.6,
          baseAlpha: 0.2 + Math.random() * 0.7,
          alpha: 0.5,
          twinkleSpeed: 0.008 + Math.random() * 0.02,
          phase: Math.random() * Math.PI * 2,
          color: ['#00f0ff', '#ff00a0', '#ffbe00', '#ffffff', '#8ce8ff'][Math.floor(Math.random() * 5)]
        });
      }
    }

    function spawnShootingStar() {
      if (shootingStar || Math.random() > 0.012) return;
      shootingStar = {
        x: Math.random() * bgCanvas.width * 0.8,
        y: Math.random() * bgCanvas.height * 0.4,
        len: 120 + Math.random() * 80,
        speed: 12 + Math.random() * 8,
        angle: Math.PI / 4 + (Math.random() - 0.5) * 0.3,
        life: 1.0
      };
    }

    function renderBg() {
      bgCtx.fillStyle = '#060814';
      bgCtx.fillRect(0, 0, bgCanvas.width, bgCanvas.height);

      // Deep ambient cosmic nebulae
      const grad1 = bgCtx.createRadialGradient(
        bgCanvas.width * 0.25, bgCanvas.height * 0.3, 20,
        bgCanvas.width * 0.25, bgCanvas.height * 0.3, bgCanvas.width * 0.6
      );
      grad1.addColorStop(0, 'rgba(0, 110, 255, 0.08)');
      grad1.addColorStop(0.6, 'rgba(170, 0, 255, 0.04)');
      grad1.addColorStop(1, 'transparent');
      bgCtx.fillStyle = grad1;
      bgCtx.fillRect(0, 0, bgCanvas.width, bgCanvas.height);

      const grad2 = bgCtx.createRadialGradient(
        bgCanvas.width * 0.8, bgCanvas.height * 0.75, 40,
        bgCanvas.width * 0.8, bgCanvas.height * 0.75, bgCanvas.width * 0.55
      );
      grad2.addColorStop(0, 'rgba(255, 0, 140, 0.06)');
      grad2.addColorStop(1, 'transparent');
      bgCtx.fillStyle = grad2;
      bgCtx.fillRect(0, 0, bgCanvas.width, bgCanvas.height);

      // Render twinkling stars
      for (const s of stars) {
        s.phase += s.twinkleSpeed;
        s.alpha = s.baseAlpha + Math.sin(s.phase) * 0.25;
        bgCtx.save();
        bgCtx.globalAlpha = Math.max(0.1, Math.min(1, s.alpha));
        bgCtx.fillStyle = s.color;
        bgCtx.beginPath();
        bgCtx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
        bgCtx.fill();
        bgCtx.restore();
      }

      // Shooting star
      spawnShootingStar();
      if (shootingStar) {
        const sx = shootingStar.x;
        const sy = shootingStar.y;
        const ex = sx + Math.cos(shootingStar.angle) * shootingStar.len;
        const ey = sy + Math.sin(shootingStar.angle) * shootingStar.len;

        const sGrad = bgCtx.createLinearGradient(sx, sy, ex, ey);
        sGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
        sGrad.addColorStop(0.8, 'rgba(0, 240, 255, ' + (shootingStar.life * 0.8) + ')');
        sGrad.addColorStop(1, 'rgba(255, 255, 255, ' + shootingStar.life + ')');

        bgCtx.strokeStyle = sGrad;
        bgCtx.lineWidth = 1.8;
        bgCtx.beginPath();
        bgCtx.moveTo(sx, sy);
        bgCtx.lineTo(ex, ey);
        bgCtx.stroke();

        shootingStar.x += Math.cos(shootingStar.angle) * shootingStar.speed;
        shootingStar.y += Math.sin(shootingStar.angle) * shootingStar.speed;
        shootingStar.life -= 0.024;
        if (shootingStar.life <= 0) shootingStar = null;
      }

      requestAnimationFrame(renderBg);
    }

    window.addEventListener('resize', resizeBg);
    resizeBg();
    renderBg();

    // =========================================================================
    // LEVEL DATASET (30 HANDCRAFTED, GUARANTEED SOLVABLE LEVELS)
    // =========================================================================
    const LEVELS = [
  {
    "cols": 3,
    "rows": 3,
    "nodes": [
      {
        "x": 0,
        "y": 0,
        "len": 3,
        "color": 0
      },
      {
        "x": 2,
        "y": 0,
        "len": 4,
        "color": 1
      },
      {
        "x": 0,
        "y": 1,
        "len": 2,
        "color": 2
      }
    ],
    "blocked": [],
    "id": 1,
    "name": "Polaris",
    "sector": "Nebula"
  },
  {
    "cols": 3,
    "rows": 3,
    "nodes": [
      {
        "x": 0,
        "y": 0,
        "len": 5,
        "color": 0
      },
      {
        "x": 2,
        "y": 0,
        "len": 4,
        "color": 1
      }
    ],
    "blocked": [],
    "id": 2,
    "name": "Vega",
    "sector": "Nebula"
  },
  {
    "cols": 3,
    "rows": 3,
    "nodes": [
      {
        "x": 0,
        "y": 0,
        "len": 6,
        "color": 0
      },
      {
        "x": 2,
        "y": 0,
        "len": 3,
        "color": 1
      }
    ],
    "blocked": [],
    "id": 3,
    "name": "Sirius",
    "sector": "Nebula"
  },
  {
    "cols": 3,
    "rows": 3,
    "nodes": [
      {
        "x": 0,
        "y": 0,
        "len": 3,
        "color": 0
      },
      {
        "x": 2,
        "y": 0,
        "len": 3,
        "color": 1
      },
      {
        "x": 0,
        "y": 1,
        "len": 3,
        "color": 2
      }
    ],
    "blocked": [],
    "id": 4,
    "name": "Rigel",
    "sector": "Nebula"
  },
  {
    "cols": 3,
    "rows": 3,
    "nodes": [
      {
        "x": 0,
        "y": 0,
        "len": 3,
        "color": 0
      },
      {
        "x": 2,
        "y": 0,
        "len": 6,
        "color": 1
      }
    ],
    "blocked": [],
    "id": 5,
    "name": "Altair",
    "sector": "Nebula"
  },
  {
    "cols": 4,
    "rows": 4,
    "nodes": [
      {
        "x": 0,
        "y": 0,
        "len": 4,
        "color": 0
      },
      {
        "x": 3,
        "y": 0,
        "len": 6,
        "color": 1
      },
      {
        "x": 0,
        "y": 1,
        "len": 4,
        "color": 2
      },
      {
        "x": 0,
        "y": 3,
        "len": 2,
        "color": 3
      }
    ],
    "blocked": [],
    "id": 6,
    "name": "Cassiopeia",
    "sector": "Aurora"
  },
  {
    "cols": 4,
    "rows": 4,
    "nodes": [
      {
        "x": 0,
        "y": 0,
        "len": 3,
        "color": 0
      },
      {
        "x": 3,
        "y": 0,
        "len": 6,
        "color": 1
      },
      {
        "x": 0,
        "y": 1,
        "len": 5,
        "color": 2
      },
      {
        "x": 2,
        "y": 1,
        "len": 2,
        "color": 3
      }
    ],
    "blocked": [],
    "id": 7,
    "name": "Andromeda",
    "sector": "Aurora"
  },
  {
    "cols": 4,
    "rows": 4,
    "nodes": [
      {
        "x": 0,
        "y": 0,
        "len": 3,
        "color": 0
      },
      {
        "x": 1,
        "y": 0,
        "len": 6,
        "color": 1
      },
      {
        "x": 3,
        "y": 0,
        "len": 3,
        "color": 2
      },
      {
        "x": 0,
        "y": 3,
        "len": 4,
        "color": 3
      }
    ],
    "blocked": [],
    "id": 8,
    "name": "Antares",
    "sector": "Aurora"
  },
  {
    "cols": 4,
    "rows": 4,
    "nodes": [
      {
        "x": 0,
        "y": 0,
        "len": 4,
        "color": 0
      },
      {
        "x": 2,
        "y": 0,
        "len": 4,
        "color": 1
      },
      {
        "x": 0,
        "y": 2,
        "len": 4,
        "color": 2
      },
      {
        "x": 0,
        "y": 3,
        "len": 4,
        "color": 3
      }
    ],
    "blocked": [],
    "id": 9,
    "name": "Aldebaran",
    "sector": "Aurora"
  },
  {
    "cols": 4,
    "rows": 4,
    "nodes": [
      {
        "x": 0,
        "y": 0,
        "len": 3,
        "color": 0
      },
      {
        "x": 3,
        "y": 0,
        "len": 5,
        "color": 1
      },
      {
        "x": 0,
        "y": 1,
        "len": 6,
        "color": 2
      },
      {
        "x": 2,
        "y": 3,
        "len": 2,
        "color": 3
      }
    ],
    "blocked": [],
    "id": 10,
    "name": "Betelgeuse",
    "sector": "Aurora"
  },
  {
    "cols": 4,
    "rows": 4,
    "nodes": [
      {
        "x": 0,
        "y": 0,
        "len": 3,
        "color": 0
      },
      {
        "x": 1,
        "y": 0,
        "len": 5,
        "color": 1
      },
      {
        "x": 0,
        "y": 2,
        "len": 6,
        "color": 2
      },
      {
        "x": 0,
        "y": 3,
        "len": 2,
        "color": 3
      }
    ],
    "blocked": [],
    "id": 11,
    "name": "Spica",
    "sector": "Aurora"
  },
  {
    "cols": 4,
    "rows": 4,
    "nodes": [
      {
        "x": 0,
        "y": 0,
        "len": 6,
        "color": 0
      },
      {
        "x": 2,
        "y": 0,
        "len": 4,
        "color": 1
      },
      {
        "x": 0,
        "y": 1,
        "len": 3,
        "color": 2
      },
      {
        "x": 1,
        "y": 3,
        "len": 3,
        "color": 3
      }
    ],
    "blocked": [],
    "id": 12,
    "name": "Deneb",
    "sector": "Aurora"
  },
  {
    "cols": 5,
    "rows": 5,
    "nodes": [
      {
        "x": 0,
        "y": 0,
        "len": 3,
        "color": 0
      },
      {
        "x": 1,
        "y": 0,
        "len": 5,
        "color": 1
      },
      {
        "x": 2,
        "y": 0,
        "len": 5,
        "color": 2
      },
      {
        "x": 2,
        "y": 1,
        "len": 6,
        "color": 3
      },
      {
        "x": 0,
        "y": 3,
        "len": 3,
        "color": 4
      },
      {
        "x": 2,
        "y": 4,
        "len": 3,
        "color": 5
      }
    ],
    "blocked": [],
    "id": 13,
    "name": "Pleiades",
    "sector": "Pulsar"
  },
  {
    "cols": 5,
    "rows": 5,
    "nodes": [
      {
        "x": 0,
        "y": 0,
        "len": 4,
        "color": 0
      },
      {
        "x": 2,
        "y": 0,
        "len": 4,
        "color": 1
      },
      {
        "x": 0,
        "y": 1,
        "len": 6,
        "color": 2
      },
      {
        "x": 2,
        "y": 1,
        "len": 6,
        "color": 3
      },
      {
        "x": 2,
        "y": 2,
        "len": 3,
        "color": 4
      },
      {
        "x": 3,
        "y": 4,
        "len": 2,
        "color": 5
      }
    ],
    "blocked": [],
    "id": 14,
    "name": "Capella",
    "sector": "Pulsar"
  },
  {
    "cols": 5,
    "rows": 5,
    "nodes": [
      {
        "x": 0,
        "y": 0,
        "len": 4,
        "color": 0
      },
      {
        "x": 1,
        "y": 0,
        "len": 4,
        "color": 1
      },
      {
        "x": 4,
        "y": 0,
        "len": 6,
        "color": 2
      },
      {
        "x": 1,
        "y": 1,
        "len": 4,
        "color": 3
      },
      {
        "x": 0,
        "y": 3,
        "len": 4,
        "color": 4
      },
      {
        "x": 2,
        "y": 4,
        "len": 3,
        "color": 5
      }
    ],
    "blocked": [],
    "id": 15,
    "name": "Procyon",
    "sector": "Pulsar"
  },
  {
    "cols": 5,
    "rows": 5,
    "nodes": [
      {
        "x": 0,
        "y": 0,
        "len": 6,
        "color": 0
      },
      {
        "x": 1,
        "y": 0,
        "len": 6,
        "color": 1
      },
      {
        "x": 2,
        "y": 1,
        "len": 3,
        "color": 2
      },
      {
        "x": 0,
        "y": 2,
        "len": 5,
        "color": 3
      },
      {
        "x": 4,
        "y": 2,
        "len": 5,
        "color": 4
      }
    ],
    "blocked": [],
    "id": 16,
    "name": "Centauri",
    "sector": "Pulsar"
  },
  {
    "cols": 5,
    "rows": 5,
    "nodes": [
      {
        "x": 0,
        "y": 0,
        "len": 6,
        "color": 0
      },
      {
        "x": 2,
        "y": 0,
        "len": 3,
        "color": 1
      },
      {
        "x": 4,
        "y": 0,
        "len": 6,
        "color": 2
      },
      {
        "x": 0,
        "y": 3,
        "len": 6,
        "color": 3
      },
      {
        "x": 4,
        "y": 3,
        "len": 4,
        "color": 4
      }
    ],
    "blocked": [],
    "id": 17,
    "name": "Canopus",
    "sector": "Pulsar"
  },
  {
    "cols": 5,
    "rows": 5,
    "nodes": [
      {
        "x": 0,
        "y": 0,
        "len": 5,
        "color": 0
      },
      {
        "x": 1,
        "y": 0,
        "len": 4,
        "color": 1
      },
      {
        "x": 4,
        "y": 0,
        "len": 4,
        "color": 2
      },
      {
        "x": 2,
        "y": 1,
        "len": 5,
        "color": 3
      },
      {
        "x": 3,
        "y": 2,
        "len": 4,
        "color": 4
      },
      {
        "x": 0,
        "y": 4,
        "len": 3,
        "color": 5
      }
    ],
    "blocked": [],
    "id": 18,
    "name": "Arcturus",
    "sector": "Pulsar"
  },
  {
    "cols": 5,
    "rows": 5,
    "nodes": [
      {
        "x": 1,
        "y": 0,
        "len": 4,
        "color": 0
      },
      {
        "x": 0,
        "y": 1,
        "len": 4,
        "color": 1
      },
      {
        "x": 2,
        "y": 1,
        "len": 3,
        "color": 2
      },
      {
        "x": 4,
        "y": 1,
        "len": 5,
        "color": 3
      },
      {
        "x": 0,
        "y": 3,
        "len": 5,
        "color": 4
      }
    ],
    "blocked": [
      [
        0,
        0
      ],
      [
        4,
        0
      ],
      [
        0,
        4
      ],
      [
        4,
        4
      ]
    ],
    "id": 19,
    "name": "Achernar",
    "sector": "Quasar"
  },
  {
    "cols": 5,
    "rows": 5,
    "nodes": [
      {
        "x": 2,
        "y": 0,
        "len": 3,
        "color": 0
      },
      {
        "x": 0,
        "y": 1,
        "len": 4,
        "color": 1
      },
      {
        "x": 3,
        "y": 1,
        "len": 4,
        "color": 2
      },
      {
        "x": 4,
        "y": 1,
        "len": 4,
        "color": 3
      },
      {
        "x": 1,
        "y": 2,
        "len": 6,
        "color": 4
      }
    ],
    "blocked": [
      [
        0,
        0
      ],
      [
        1,
        0
      ],
      [
        3,
        0
      ],
      [
        4,
        0
      ]
    ],
    "id": 20,
    "name": "Hadar",
    "sector": "Quasar"
  },
  {
    "cols": 5,
    "rows": 5,
    "nodes": [
      {
        "x": 0,
        "y": 0,
        "len": 5,
        "color": 0
      },
      {
        "x": 1,
        "y": 0,
        "len": 5,
        "color": 1
      },
      {
        "x": 2,
        "y": 0,
        "len": 6,
        "color": 2
      },
      {
        "x": 0,
        "y": 3,
        "len": 5,
        "color": 3
      },
      {
        "x": 3,
        "y": 3,
        "len": 3,
        "color": 4
      }
    ],
    "blocked": [
      [
        2,
        2
      ]
    ],
    "id": 21,
    "name": "Acrux",
    "sector": "Quasar"
  },
  {
    "cols": 5,
    "rows": 5,
    "nodes": [
      {
        "x": 1,
        "y": 0,
        "len": 6,
        "color": 0
      },
      {
        "x": 1,
        "y": 1,
        "len": 6,
        "color": 1
      },
      {
        "x": 2,
        "y": 1,
        "len": 4,
        "color": 2
      },
      {
        "x": 1,
        "y": 3,
        "len": 5,
        "color": 3
      }
    ],
    "blocked": [
      [
        0,
        0
      ],
      [
        0,
        1
      ],
      [
        4,
        3
      ],
      [
        4,
        4
      ]
    ],
    "id": 22,
    "name": "Regulus",
    "sector": "Quasar"
  },
  {
    "cols": 5,
    "rows": 5,
    "nodes": [
      {
        "x": 0,
        "y": 0,
        "len": 4,
        "color": 0
      },
      {
        "x": 1,
        "y": 0,
        "len": 5,
        "color": 1
      },
      {
        "x": 2,
        "y": 1,
        "len": 3,
        "color": 2
      },
      {
        "x": 3,
        "y": 2,
        "len": 5,
        "color": 3
      },
      {
        "x": 2,
        "y": 3,
        "len": 4,
        "color": 4
      }
    ],
    "blocked": [
      [
        1,
        1
      ],
      [
        3,
        1
      ],
      [
        1,
        3
      ],
      [
        3,
        3
      ]
    ],
    "id": 23,
    "name": "Adhara",
    "sector": "Quasar"
  },
  {
    "cols": 5,
    "rows": 5,
    "nodes": [
      {
        "x": 1,
        "y": 0,
        "len": 4,
        "color": 0
      },
      {
        "x": 3,
        "y": 0,
        "len": 3,
        "color": 1
      },
      {
        "x": 0,
        "y": 1,
        "len": 3,
        "color": 2
      },
      {
        "x": 1,
        "y": 2,
        "len": 4,
        "color": 3
      },
      {
        "x": 3,
        "y": 2,
        "len": 3,
        "color": 4
      },
      {
        "x": 1,
        "y": 4,
        "len": 3,
        "color": 5
      }
    ],
    "blocked": [
      [
        0,
        0
      ],
      [
        4,
        0
      ],
      [
        2,
        2
      ],
      [
        0,
        4
      ],
      [
        4,
        4
      ]
    ],
    "id": 24,
    "name": "Castor",
    "sector": "Quasar"
  },
  {
    "cols": 6,
    "rows": 6,
    "nodes": [
      {
        "x": 0,
        "y": 0,
        "len": 5,
        "color": 0
      },
      {
        "x": 1,
        "y": 0,
        "len": 3,
        "color": 1
      },
      {
        "x": 2,
        "y": 0,
        "len": 6,
        "color": 2
      },
      {
        "x": 4,
        "y": 0,
        "len": 4,
        "color": 3
      },
      {
        "x": 5,
        "y": 2,
        "len": 4,
        "color": 4
      },
      {
        "x": 0,
        "y": 3,
        "len": 3,
        "color": 5
      },
      {
        "x": 1,
        "y": 3,
        "len": 5,
        "color": 6
      },
      {
        "x": 1,
        "y": 4,
        "len": 6,
        "color": 7
      }
    ],
    "blocked": [],
    "id": 25,
    "name": "Pollux",
    "sector": "Supernova"
  },
  {
    "cols": 6,
    "rows": 6,
    "nodes": [
      {
        "x": 0,
        "y": 0,
        "len": 5,
        "color": 0
      },
      {
        "x": 3,
        "y": 0,
        "len": 4,
        "color": 1
      },
      {
        "x": 2,
        "y": 1,
        "len": 5,
        "color": 2
      },
      {
        "x": 3,
        "y": 1,
        "len": 5,
        "color": 3
      },
      {
        "x": 0,
        "y": 2,
        "len": 5,
        "color": 4
      },
      {
        "x": 5,
        "y": 2,
        "len": 6,
        "color": 5
      },
      {
        "x": 1,
        "y": 4,
        "len": 3,
        "color": 6
      },
      {
        "x": 2,
        "y": 5,
        "len": 3,
        "color": 7
      }
    ],
    "blocked": [],
    "id": 26,
    "name": "Bellatrix",
    "sector": "Supernova"
  },
  {
    "cols": 6,
    "rows": 6,
    "nodes": [
      {
        "x": 0,
        "y": 0,
        "len": 6,
        "color": 0
      },
      {
        "x": 1,
        "y": 0,
        "len": 6,
        "color": 1
      },
      {
        "x": 5,
        "y": 0,
        "len": 4,
        "color": 2
      },
      {
        "x": 3,
        "y": 1,
        "len": 5,
        "color": 3
      },
      {
        "x": 2,
        "y": 2,
        "len": 4,
        "color": 4
      },
      {
        "x": 5,
        "y": 2,
        "len": 4,
        "color": 5
      },
      {
        "x": 0,
        "y": 4,
        "len": 4,
        "color": 6
      },
      {
        "x": 5,
        "y": 4,
        "len": 3,
        "color": 7
      }
    ],
    "blocked": [],
    "id": 27,
    "name": "Alnilam",
    "sector": "Supernova"
  },
  {
    "cols": 6,
    "rows": 6,
    "nodes": [
      {
        "x": 0,
        "y": 0,
        "len": 5,
        "color": 0
      },
      {
        "x": 1,
        "y": 0,
        "len": 6,
        "color": 1
      },
      {
        "x": 3,
        "y": 0,
        "len": 4,
        "color": 2
      },
      {
        "x": 3,
        "y": 1,
        "len": 6,
        "color": 3
      },
      {
        "x": 5,
        "y": 2,
        "len": 4,
        "color": 4
      },
      {
        "x": 2,
        "y": 3,
        "len": 5,
        "color": 5
      },
      {
        "x": 0,
        "y": 4,
        "len": 2,
        "color": 6
      },
      {
        "x": 5,
        "y": 4,
        "len": 4,
        "color": 7
      }
    ],
    "blocked": [],
    "id": 28,
    "name": "Alnitak",
    "sector": "Supernova"
  },
  {
    "cols": 6,
    "rows": 6,
    "nodes": [
      {
        "x": 0,
        "y": 0,
        "len": 6,
        "color": 0
      },
      {
        "x": 4,
        "y": 0,
        "len": 5,
        "color": 1
      },
      {
        "x": 0,
        "y": 1,
        "len": 5,
        "color": 2
      },
      {
        "x": 4,
        "y": 1,
        "len": 5,
        "color": 3
      },
      {
        "x": 0,
        "y": 2,
        "len": 6,
        "color": 4
      },
      {
        "x": 2,
        "y": 3,
        "len": 4,
        "color": 5
      },
      {
        "x": 3,
        "y": 3,
        "len": 5,
        "color": 6
      }
    ],
    "blocked": [],
    "id": 29,
    "name": "Mintaka",
    "sector": "Supernova"
  },
  {
    "cols": 6,
    "rows": 6,
    "nodes": [
      {
        "x": 0,
        "y": 0,
        "len": 6,
        "color": 0
      },
      {
        "x": 4,
        "y": 0,
        "len": 6,
        "color": 1
      },
      {
        "x": 0,
        "y": 1,
        "len": 4,
        "color": 2
      },
      {
        "x": 3,
        "y": 1,
        "len": 2,
        "color": 3
      },
      {
        "x": 0,
        "y": 3,
        "len": 4,
        "color": 4
      },
      {
        "x": 1,
        "y": 3,
        "len": 3,
        "color": 5
      },
      {
        "x": 2,
        "y": 3,
        "len": 5,
        "color": 6
      },
      {
        "x": 4,
        "y": 3,
        "len": 6,
        "color": 7
      }
    ],
    "blocked": [],
    "id": 30,
    "name": "Saiph",
    "sector": "Supernova"
  }
];

    // Neon Star Color Palette
    const COLORS = [
      { hex: '#00f0ff', glow: 'rgba(0, 240, 255, 0.7)', light: '#a6f8ff', name: 'Cyan' },
      { hex: '#ff00a0', glow: 'rgba(255, 0, 160, 0.7)', light: '#ffa3dd', name: 'Magenta' },
      { hex: '#ffc800', glow: 'rgba(255, 200, 0, 0.7)', light: '#ffe88a', name: 'Solar Gold' },
      { hex: '#00ff88', glow: 'rgba(0, 255, 136, 0.7)', light: '#a6ffd0', name: 'Lime' },
      { hex: '#aa44ff', glow: 'rgba(170, 68, 255, 0.7)', light: '#dcb3ff', name: 'Violet' },
      { hex: '#ff4d4d', glow: 'rgba(255, 77, 77, 0.7)', light: '#ffb3b3', name: 'Coral' },
      { hex: '#00e5a3', glow: 'rgba(0, 229, 163, 0.7)', light: '#a8ffdf', name: 'Emerald' },
      { hex: '#8ce8ff', glow: 'rgba(140, 232, 255, 0.7)', light: '#ffffff', name: 'Diamond' }
    ];

    // =========================================================================
    // GAME CORE ENGINE
    // =========================================================================
    class CosmosGame {
      constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.currentLevelIndex = 0;
        this.level = null;
        this.nodes = [];
        this.blocked = new Set();
        this.history = []; // Undo stack

        // Interaction state
        this.activeNodeIdx = null;
        this.isDragging = false;
        this.dragPointer = null;

        // Grid layout metrics
        this.cellSize = 64;
        this.gridX = 0;
        this.gridY = 0;
        this.gridWidth = 0;
        this.gridHeight = 0;

        // Progress & Stats
        this.moves = 0;
        this.startTime = Date.now();
        this.isWon = false;
        this.winPulse = 0;
        this.particles = [];

        // Save data
        this.savedData = this.loadSave();

        this.initEvents();
        this.loadLevel(this.savedData.highestLevel || 0);
        this.animate();
      }

      loadSave() {
        try {
          const raw = localStorage.getItem('cosmos_lines_save');
          return raw ? JSON.parse(raw) : { completed: [], highestLevel: 0 };
        } catch (_) {
          return { completed: [], highestLevel: 0 };
        }
      }

      saveProgress(lvlIdx) {
        if (!this.savedData.completed.includes(lvlIdx)) {
          this.savedData.completed.push(lvlIdx);
        }
        if (lvlIdx + 1 > (this.savedData.highestLevel || 0)) {
          this.savedData.highestLevel = Math.min(lvlIdx + 1, LEVELS.length - 1);
        }
        try {
          localStorage.setItem('cosmos_lines_save', JSON.stringify(this.savedData));
        } catch (_) {}
        updateMainMenuUI();

      // Notify CIEL Loader that game is ready
      if (window.CielLoader && typeof window.CielLoader.done === 'function') {
        window.CielLoader.done();
      }
      }

      resetAllProgress() {
        this.savedData = { completed: [], highestLevel: 0 };
        try {
          localStorage.setItem('cosmos_lines_save', JSON.stringify(this.savedData));
        } catch (_) {}
        this.loadLevel(0);
        updateMainMenuUI();
      }

      loadLevel(idx) {
        if (idx < 0 || idx >= LEVELS.length) idx = 0;
        this.currentLevelIndex = idx;
        this.level = LEVELS[idx];
        this.isWon = false;
        this.winPulse = 0;
        this.moves = 0;
        this.startTime = Date.now();
        this.history = [];
        this.activeNodeIdx = null;
        this.isDragging = false;
        this.particles = [];

        // Initialize blocked set
        this.blocked = new Set();
        (this.level.blocked || []).forEach(([bx, by]) => {
          this.blocked.add(`${bx},${by}`);
        });

        // Initialize nodes and their paths
        this.nodes = this.level.nodes.map((n, i) => ({
          id: i,
          x: n.x,
          y: n.y,
          len: n.len,
          color: COLORS[n.color % COLORS.length],
          path: [[n.x, n.y]] // Starts with its root cell
        }));

        this.updateHeader();
        this.resize();
        updateMainMenuUI();
      }

      updateHeader() {
        document.getElementById('txtLevelNum').textContent = `Level ${this.level.id}`;
        document.getElementById('txtSector').textContent = this.level.sector;
        document.getElementById('txtLevelName').textContent = this.level.name;
        document.getElementById('hintMessage').textContent =
          `Fill all ${this.level.cols * this.level.rows - (this.level.blocked || []).length} tiles with ${this.nodes.length} glowing cosmic lines`;
      }

      resize() {
        const main = document.querySelector('main');
        const availW = Math.max(280, Math.min(window.innerWidth - 32, 600));
        const availH = Math.max(280, Math.min(main.clientHeight - 24, 600));

        const cols = this.level.cols;
        const rows = this.level.rows;

        const maxCellW = Math.floor(availW / (cols + 0.5));
        const maxCellH = Math.floor(availH / (rows + 0.5));
        this.cellSize = Math.max(38, Math.min(maxCellW, maxCellH, 84));

        this.gridWidth = cols * this.cellSize;
        this.gridHeight = rows * this.cellSize;

        const pad = Math.max(16, Math.floor(this.cellSize * 0.4));
        const totalW = this.gridWidth + pad * 2;
        const totalH = this.gridHeight + pad * 2;

        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        this.canvas.width = totalW * dpr;
        this.canvas.height = totalH * dpr;
        this.canvas.style.width = `${totalW}px`;
        this.canvas.style.height = `${totalH}px`;

        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        this.gridX = pad;
        this.gridY = pad;
      }

      getCellOccupant(col, row) {
        for (let i = 0; i < this.nodes.length; i++) {
          const n = this.nodes[i];
          for (let p = 0; p < n.path.length; p++) {
            if (n.path[p][0] === col && n.path[p][1] === row) {
              return { nodeIndex: i, pathIndex: p, isHead: p === n.path.length - 1, isRoot: p === 0 };
            }
          }
        }
        return null;
      }

      saveSnapshot() {
        const snapshot = this.nodes.map(n => n.path.map(pt => [pt[0], pt[1]]));
        this.history.push(snapshot);
        if (this.history.length > 80) this.history.shift();
      }

      undo() {
        if (this.history.length === 0 || this.isWon) return;
        const last = this.history.pop();
        last.forEach((p, i) => {
          this.nodes[i].path = p.map(pt => [pt[0], pt[1]]);
        });
        sound.playUndo();
      }

      reset() {
        if (this.isWon) return;
        this.saveSnapshot();
        this.nodes.forEach(n => {
          n.path = [[n.x, n.y]];
        });
        this.activeNodeIdx = null;
        this.isDragging = false;
        sound.playReset();
      }

      initEvents() {
        window.addEventListener('resize', () => this.resize());
        window.addEventListener('orientationchange', () => setTimeout(() => this.resize(), 100));

        const getCanvasPos = (e) => {
          const rect = this.canvas.getBoundingClientRect();
          return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
          };
        };

        const getCell = (pos) => {
          const c = Math.floor((pos.x - this.gridX) / this.cellSize);
          const r = Math.floor((pos.y - this.gridY) / this.cellSize);
          if (c >= 0 && c < this.level.cols && r >= 0 && r < this.level.rows) {
            return { c, r };
          }
          return null;
        };

        this.canvas.addEventListener('pointerdown', (e) => {
          if (this.isWon) return;
          this.canvas.setPointerCapture(e.pointerId);
          sound.init();

          const pos = getCanvasPos(e);
          const cell = getCell(pos);
          if (!cell) return;

          const occ = this.getCellOccupant(cell.c, cell.r);
          if (occ) {
            const n = this.nodes[occ.nodeIndex];
            this.activeNodeIdx = occ.nodeIndex;
            this.isDragging = true;
            this.dragPointer = pos;

            if (occ.pathIndex < n.path.length - 1) {
              this.saveSnapshot();
              n.path = n.path.slice(0, occ.pathIndex + 1);
              sound.playRetract();
              this.moves++;
            }
          }
        });

        this.canvas.addEventListener('pointermove', (e) => {
          if (!this.isDragging || this.activeNodeIdx === null || this.isWon) return;
          const pos = getCanvasPos(e);
          this.dragPointer = pos;
          const cell = getCell(pos);
          if (!cell) return;

          const n = this.nodes[this.activeNodeIdx];
          const head = n.path[n.path.length - 1];

          if (n.path.length > 1) {
            const prev = n.path[n.path.length - 2];
            if (prev[0] === cell.c && prev[1] === cell.r) {
              this.saveSnapshot();
              n.path.pop();
              sound.playRetract();
              this.moves++;
              return;
            }
          }

          const dist = Math.abs(cell.c - head[0]) + Math.abs(cell.r - head[1]);
          if (dist === 1) {
            if (this.blocked.has(`${cell.c},${cell.r}`)) return;

            const occ = this.getCellOccupant(cell.c, cell.r);
            if (!occ && n.path.length < n.len) {
              this.saveSnapshot();
              n.path.push([cell.c, cell.r]);
              this.moves++;

              this.emitSparkles(cell.c, cell.r, n.color.hex);

              if (n.path.length === n.len) {
                sound.playNodeLock();
              } else {
                sound.playStep(n.path.length, n.len);
              }

              this.checkWinCondition();
            }
          }
        });

        const stopDrag = (e) => {
          if (!this.isDragging) return;
          this.isDragging = false;
          this.dragPointer = null;
          this.checkWinCondition();
        };

        this.canvas.addEventListener('pointerup', stopDrag);
        this.canvas.addEventListener('pointercancel', stopDrag);

        // Keyboard navigation
        window.addEventListener('keydown', (e) => {
          if (e.code === 'KeyZ' || (e.ctrlKey && e.code === 'KeyZ')) {
            this.undo();
          } else if (e.code === 'KeyR') {
            this.reset();
          } else if (e.code === 'KeyF') {
            toggleFullscreen();
          } else if (e.code === 'KeyL') {
            openModal('modalLevels');
          } else if (e.code === 'Escape') {
            const activeModal = document.querySelector('.modal-overlay.active');
            if (activeModal) {
              closeAllModals();
            } else {
              const menu = document.getElementById('screenMainMenu');
              if (menu && menu.classList.contains('hidden')) {
                openMainMenu();
              } else {
                closeMainMenu();
              }
            }
          }
        });
      }

      emitSparkles(c, r, color) {
        const cx = this.gridX + (c + 0.5) * this.cellSize;
        const cy = this.gridY + (r + 0.5) * this.cellSize;
        for (let i = 0; i < 7; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = 1.5 + Math.random() * 3.5;
          this.particles.push({
            x: cx,
            y: cy,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            radius: 1.5 + Math.random() * 2,
            color: color,
            alpha: 1,
            decay: 0.03 + Math.random() * 0.03
          });
        }
      }

      checkWinCondition() {
        if (this.isWon) return;

        const allNodesFull = this.nodes.every(n => n.path.length === n.len);
        if (!allNodesFull) return;

        let totalPathCells = 0;
        this.nodes.forEach(n => totalPathCells += n.path.length);
        const playableCells = this.level.cols * this.level.rows - (this.level.blocked || []).length;

        if (totalPathCells === playableCells) {
          this.triggerWin();
        }
      }

      triggerWin() {
        this.isWon = true;
        this.winPulse = 1.0;
        sound.playWin();
        this.saveProgress(this.currentLevelIndex);

        for (const n of this.nodes) {
          this.emitSparkles(n.x, n.y, n.color.hex);
        }

        setTimeout(() => {
          showWinModal(this.moves, Date.now() - this.startTime);
        }, 650);
      }

      animate() {
        this.render();
        requestAnimationFrame(() => this.animate());
      }

      render() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        const bx = this.gridX - 8;
        const by = this.gridY - 8;
        const bw = this.gridWidth + 16;
        const bh = this.gridHeight + 16;

        ctx.save();
        ctx.fillStyle = 'rgba(10, 15, 34, 0.72)';
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.16)';
        ctx.lineWidth = 1.5;
        this.roundRect(ctx, bx, by, bw, bh, 20);
        ctx.fill();
        ctx.stroke();
        ctx.restore();

        // 1. Grid Slots
        const cols = this.level.cols;
        const rows = this.level.rows;
        const cs = this.cellSize;

        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            if (this.blocked.has(`${c},${r}`)) continue;

            const x = this.gridX + c * cs;
            const y = this.gridY + r * cs;
            const pad = 4;

            ctx.save();
            ctx.fillStyle = 'rgba(255, 255, 255, 0.035)';
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.07)';
            ctx.lineWidth = 1.2;
            this.roundRect(ctx, x + pad, y + pad, cs - pad * 2, cs - pad * 2, 12);
            ctx.fill();
            ctx.stroke();
            ctx.restore();
          }
        }

        // 2. Paths
        this.nodes.forEach(node => {
          if (node.path.length < 2) return;
          const col = node.color;

          ctx.save();
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';

          ctx.strokeStyle = col.glow;
          ctx.lineWidth = cs * 0.46;
          ctx.shadowColor = col.hex;
          ctx.shadowBlur = 18;
          this.tracePath(ctx, node.path);
          ctx.stroke();

          ctx.shadowBlur = 0;
          ctx.strokeStyle = col.hex;
          ctx.lineWidth = cs * 0.32;
          this.tracePath(ctx, node.path);
          ctx.stroke();

          ctx.strokeStyle = col.light;
          ctx.lineWidth = cs * 0.14;
          this.tracePath(ctx, node.path);
          ctx.stroke();

          ctx.restore();
        });

        // 3. Path Head Indicator
        this.nodes.forEach((node) => {
          if (node.path.length > 0) {
            const head = node.path[node.path.length - 1];
            const hx = this.gridX + (head[0] + 0.5) * cs;
            const hy = this.gridY + (head[1] + 0.5) * cs;

            ctx.save();
            ctx.fillStyle = node.color.light;
            ctx.shadowColor = node.color.hex;
            ctx.shadowBlur = 12;
            ctx.beginPath();
            ctx.arc(hx, hy, cs * 0.16, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }
        });

        // 4. Numbered Star Nodes
        this.nodes.forEach(node => {
          const nx = this.gridX + (node.x + 0.5) * cs;
          const ny = this.gridY + (node.y + 0.5) * cs;
          const r = cs * 0.38;
          const isComplete = node.path.length === node.len;

          ctx.save();
          ctx.shadowColor = node.color.hex;
          ctx.shadowBlur = isComplete ? 24 : 14;

          ctx.strokeStyle = isComplete ? '#ffffff' : node.color.hex;
          ctx.lineWidth = isComplete ? 3.5 : 2.5;
          ctx.beginPath();
          ctx.arc(nx, ny, r, 0, Math.PI * 2);
          ctx.stroke();

          const grad = ctx.createRadialGradient(nx, ny, 2, nx, ny, r);
          if (isComplete) {
            grad.addColorStop(0, '#ffffff');
            grad.addColorStop(0.45, node.color.hex);
            grad.addColorStop(1, 'rgba(8, 12, 28, 0.95)');
          } else {
            grad.addColorStop(0, node.color.hex);
            grad.addColorStop(0.3, 'rgba(16, 24, 52, 0.95)');
            grad.addColorStop(1, 'rgba(8, 12, 28, 0.95)');
          }
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(nx, ny, r - 1.5, 0, Math.PI * 2);
          ctx.fill();

          ctx.shadowBlur = 0;
          ctx.fillStyle = isComplete ? '#060814' : '#ffffff';
          ctx.font = `800 ${Math.floor(cs * 0.36)}px ${getComputedStyle(document.body).fontFamily}`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(node.len, nx, ny + 1);

          if (isComplete) {
            ctx.fillStyle = '#ffffff';
            for (let i = 0; i < 4; i++) {
              const a = (i * Math.PI) / 2 + Date.now() * 0.002;
              const px = nx + Math.cos(a) * (r + 4);
              const py = ny + Math.sin(a) * (r + 4);
              ctx.beginPath();
              ctx.arc(px, py, 2, 0, Math.PI * 2);
              ctx.fill();
            }
          }

          ctx.restore();
        });

        // 5. Particles Update & Render
        for (let i = this.particles.length - 1; i >= 0; i--) {
          const p = this.particles[i];
          p.x += p.vx;
          p.y += p.vy;
          p.alpha -= p.decay;
          if (p.alpha <= 0) {
            this.particles.splice(i, 1);
            continue;
          }
          ctx.save();
          ctx.globalAlpha = p.alpha;
          ctx.fillStyle = p.color;
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }

      tracePath(ctx, path) {
        ctx.beginPath();
        const cs = this.cellSize;
        for (let i = 0; i < path.length; i++) {
          const px = this.gridX + (path[i][0] + 0.5) * cs;
          const py = this.gridY + (path[i][1] + 0.5) * cs;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
      }

      roundRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
        ctx.closePath();
      }
    }

    // =========================================================================
    // UI MODALS & CONTROLS BINDING
    // =========================================================================
    let game;

    function openModal(id) {
      document.getElementById(id).classList.add('active');
    }

    function closeModal(id) {
      document.getElementById(id).classList.remove('active');
    }

    function closeAllModals() {
      document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
    }

    function showToast(msg) {
      const t = document.getElementById('toast');
      t.textContent = msg;
      t.classList.add('show');
      setTimeout(() => t.classList.remove('show'), 2400);
    }

    function showWinModal(moves, timeMs) {
      const sec = Math.floor(timeMs / 1000);
      const m = Math.floor(sec / 60);
      const s = sec % 60;
      document.getElementById('winMoves').textContent = moves;
      document.getElementById('winTime').textContent = `${m}:${s < 10 ? '0' : ''}${s}`;
      document.getElementById('winDesc').textContent =
        `You aligned the ${game.level.name} constellation in Sector ${game.level.sector}!`;
      openModal('modalWin');
    }

    function toggleFullscreen() {
      sound.init();
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
      }
    }

    // Main Menu State Management
    function openMainMenu() {
      updateMainMenuUI();
      document.getElementById('screenMainMenu').classList.remove('hidden');
    }

    function closeMainMenu() {
      document.getElementById('screenMainMenu').classList.add('hidden');
      sound.init();
    }

    function updateMainMenuUI() {
      if (!game) return;
      const saved = game.loadSave();
      const completedCount = (saved.completed || []).length;
      const totalLevels = LEVELS.length;
      const pct = Math.round((completedCount / totalLevels) * 100);

      document.getElementById('txtMenuProgress').textContent = `${completedCount} / ${totalLevels} Aligned`;
      document.getElementById('menuProgressFill').style.width = `${pct}%`;

      const curLvl = LEVELS[game.currentLevelIndex] || LEVELS[0];
      const playBtnText = completedCount > 0 ? `Continue (${curLvl.name})` : 'Play Journey';
      document.getElementById('txtMenuPlayBtn').textContent = playBtnText;
    }

    function renderLevelSelector(sectorFilter = 'ALL') {
      const grid = document.getElementById('levelGrid');
      grid.innerHTML = '';
      const saved = game.loadSave();

      LEVELS.forEach((lvl, idx) => {
        if (sectorFilter !== 'ALL' && lvl.sector !== sectorFilter) return;

        const card = document.createElement('div');
        const isCurrent = idx === game.currentLevelIndex;
        const isCompleted = saved.completed.includes(idx);
        const isUnlocked = idx <= (saved.highestLevel || 0) || isCompleted;

        card.className = `level-card ${isCurrent ? 'current' : ''} ${isCompleted ? 'completed' : ''} ${!isUnlocked ? 'locked' : ''}`;

        card.innerHTML = `
          <span class="level-card-status">${isCompleted ? '⭐' : (!isUnlocked ? '🔒' : '')}</span>
          <span class="level-card-num">${lvl.id}</span>
          <span class="level-card-name">${lvl.name}</span>
        `;

        if (isUnlocked) {
          card.onclick = () => {
            sound.init();
            sound.playStep(2, 4);
            game.loadLevel(idx);
            closeModal('modalLevels');
            closeMainMenu();
          };
        }

        grid.appendChild(card);
      });
    }

    // Init App
    window.addEventListener('DOMContentLoaded', () => {
      game = new CosmosGame();

      // Sync settings checkboxes
      const chkSoundFx = document.getElementById('chkSoundFx');
      const chkAmbientMusic = document.getElementById('chkAmbientMusic');
      const chkHaptics = document.getElementById('chkHaptics');
      const chkStarfield = document.getElementById('chkStarfield');

      chkSoundFx.checked = sound.sfxEnabled;
      chkAmbientMusic.checked = sound.musicEnabled;
      chkHaptics.checked = sound.hapticsEnabled;
      chkStarfield.checked = starfieldHighDensity;

      chkSoundFx.onchange = (e) => sound.setSfx(e.target.checked);
      chkAmbientMusic.onchange = (e) => sound.setMusic(e.target.checked);
      chkHaptics.onchange = (e) => sound.setHaptics(e.target.checked);
      chkStarfield.onchange = (e) => {
        starfieldHighDensity = e.target.checked;
        localStorage.setItem('cosmos_starfield', starfieldHighDensity);
        initStars();
      };

      // Main Menu buttons
      document.getElementById('btnMenuPlay').onclick = () => closeMainMenu();
      document.getElementById('btnMenuLevels').onclick = () => {
        sound.init();
        renderLevelSelector('ALL');
        openModal('modalLevels');
      };
      document.getElementById('btnMenuSettings').onclick = () => {
        sound.init();
        openModal('modalSettings');
      };
      document.getElementById('btnMenuHelp').onclick = () => {
        sound.init();
        openModal('modalHelp');
      };

      // Exit button
      document.getElementById('btnMenuExit').onclick = () => {
        if (confirm('Leave Cosmos Lines?\n\nYour progress is saved automatically.')) {
          try { window.parent.postMessage({ action: 'exit_game' }, '*'); } catch(e) {}
          try { window.history.back(); } catch(e) {}
          setTimeout(() => { window.close(); }, 300);
        }
      };

      // Header buttons
      // Back button to Main Menu
      const btnBack = document.getElementById('btnBack');
      if (btnBack) btnBack.onclick = () => { sound.init(); sound.playStep(1, 4); openMainMenu(); };
      document.getElementById('btnHeaderHome').onclick = () => { sound.init(); sound.playStep(1, 4); openMainMenu(); };

      // Modal header Back buttons
      const btnBackLevels = document.getElementById('btnBackLevelsHeader');
      if (btnBackLevels) btnBackLevels.onclick = () => { sound.init(); closeModal('modalLevels'); };
      const btnBackSettings = document.getElementById('btnBackSettingsHeader');
      if (btnBackSettings) btnBackSettings.onclick = () => { sound.init(); closeModal('modalSettings'); };
      const btnBackHelp = document.getElementById('btnBackHelpHeader');
      if (btnBackHelp) btnBackHelp.onclick = () => { sound.init(); closeModal('modalHelp'); };

      // Win modal Menu button
      const btnWinMenu = document.getElementById('btnWinMenu');
      if (btnWinMenu) btnWinMenu.onclick = () => { sound.init(); closeModal('modalWin'); openMainMenu(); };
      document.getElementById('btnSettings').onclick = () => {
        sound.init();
        openModal('modalSettings');
      };
      document.getElementById('btnFullscreen').onclick = toggleFullscreen;
      document.getElementById('btnHelp').onclick = () => { sound.init(); openModal('modalHelp'); };
      document.getElementById('btnLevels').onclick = () => {
        sound.init();
        renderLevelSelector('ALL');
        openModal('modalLevels');
      };

      // Modal close buttons
      document.getElementById('btnCloseLevels').onclick = () => closeModal('modalLevels');
      document.getElementById('btnCloseSettings').onclick = () => closeModal('modalSettings');
      document.getElementById('btnCloseHelp').onclick = () => closeModal('modalHelp');
      document.querySelectorAll('.modal-overlay').forEach(modal => {
        modal.addEventListener('click', (e) => {
          if (e.target === modal) closeModal(modal.id);
        });
      });

      // Reset progress button in Settings
      document.getElementById('btnResetProgress').onclick = () => {
        if (confirm("Reset all 30 constellations and saved stars back to Level 1?")) {
          game.resetAllProgress();
          showToast("All progress reset to Level 1");
          closeModal('modalSettings');
        }
      };

      // Sector tabs filter
      document.querySelectorAll('.sector-tab').forEach(tab => {
        tab.onclick = () => {
          sound.init();
          document.querySelectorAll('.sector-tab').forEach(t => t.classList.remove('active'));
          tab.classList.add('active');
          renderLevelSelector(tab.dataset.sector);
        };
      });

      // Footer buttons
      document.getElementById('btnUndo').onclick = () => game.undo();
      document.getElementById('btnReset').onclick = () => game.reset();

      // Win modal buttons
      document.getElementById('btnWinReplay').onclick = () => {
        closeModal('modalWin');
        game.reset();
      };
      document.getElementById('btnWinNext').onclick = () => {
        closeModal('modalWin');
        const nextIdx = (game.currentLevelIndex + 1) % LEVELS.length;
        game.loadLevel(nextIdx);
      };

      updateMainMenuUI();
    });