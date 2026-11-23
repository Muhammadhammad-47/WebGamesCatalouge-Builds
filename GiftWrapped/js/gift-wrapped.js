/**
 * Gift Wrapped - Core Game Engine
 * Faithful recreation of Nitrome / Poki "Gift Wrapped"
 * Featuring:
 * - Pure icon button controls & sleek HUD
 * - Warm cozy Christmas room environment (Tree with baubles/star, fireplace with fire & stockings, rug)
 * - Single-path clean unified shrink-wrapped contours (no overlapping interior rings!)
 * - Tactile 3D cellophane gloss, crease lines & fluffy bows
 * - Classic Nitrome trick counterpart decoy pairs
 * - Web Audio API synthesizer for chiptune Jingle Bells & realistic festive SFX
 * - Hover cursor feedback, paper tearing particle physics, and streak multipliers
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
      this.bgmGain.gain.setValueAtTime(0.32, this.ctx.currentTime);
      this.bgmGain.connect(this.masterGain);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(0.68, this.ctx.currentTime);
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

    startBGM() {
      if (!this.musicEnabled || this.isMuted) return;
      this.init();
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      this.stopBGM();
      this.isPlayingBgm = true;

      const C4 = 261.63, D4 = 293.66, E4 = 329.63, F4 = 349.23, G4 = 392.00, A4 = 440.00;
      const C5 = 523.25, D5 = 587.33, E5 = 659.25, F5 = 698.46, G5 = 783.99;
      const C3 = 130.81, G3 = 196.00, F3 = 174.61;

      const notes = [
        { m: E5, b: C3, d: 0.22 }, { m: E5, b: null, d: 0.22 }, { m: E5, b: G3, d: 0.44 }, { m: null, b: null, d: 0.22 },
        { m: E5, b: C3, d: 0.22 }, { m: E5, b: null, d: 0.22 }, { m: E5, b: G3, d: 0.44 }, { m: null, b: null, d: 0.22 },
        { m: E5, b: C3, d: 0.22 }, { m: G5, b: null, d: 0.22 }, { m: C5, b: G3, d: 0.33 }, { m: D5, b: null, d: 0.15 },
        { m: E5, b: C3, d: 0.65 }, { m: null, b: null, d: 0.22 },
        { m: F5, b: F3, d: 0.22 }, { m: F5, b: null, d: 0.22 }, { m: F5, b: A4, d: 0.33 }, { m: F5, b: null, d: 0.15 },
        { m: F5, b: F3, d: 0.22 }, { m: E5, b: null, d: 0.22 }, { m: E5, b: C3, d: 0.22 }, { m: E5, b: null, d: 0.15 },
        { m: E5, b: null, d: 0.15 }, { m: D5, b: G3, d: 0.22 }, { m: D5, b: null, d: 0.22 }, { m: E5, b: G3, d: 0.22 },
        { m: D5, b: null, d: 0.35 }, { m: G5, b: G3, d: 0.45 }, { m: null, b: null, d: 0.25 }
      ];

      this.bgmStep = 0;
      const beatMs = (60 / 160) * 1000 * 0.75;

      const playNext = () => {
        if (!this.isPlayingBgm || !this.musicEnabled) return;
        const item = notes[this.bgmStep];
        if (item.m) {
          this.playTone(item.m, 'triangle', item.d, 0.20, this.bgmGain);
          this.playTone(item.m * 0.5, 'sine', item.d, 0.10, this.bgmGain);
        }
        if (item.b) {
          this.playTone(item.b, 'square', item.d * 0.8, 0.08, this.bgmGain);
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
      filter.frequency.setValueAtTime(1500, now);
      filter.frequency.exponentialRampToValueAtTime(300, now + 0.26);
      filter.Q.setValueAtTime(3.2, now);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.85, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.27);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);

      noise.start(now);
    }

    playChime(streak = 1) {
      if (!this.sfxEnabled || this.isMuted) return;
      this.init();
      if (!this.ctx) return;
      const baseFreq = 523.25;
      const mult = Math.min(streak, 4);
      const chords = [
        baseFreq * 1.0,
        baseFreq * 1.25,
        baseFreq * 1.5,
        baseFreq * 2.0 * (1 + (mult - 1) * 0.1)
      ];

      chords.forEach((f, idx) => {
        setTimeout(() => {
          this.playTone(f, 'sine', 0.40, 0.28, this.sfxGain);
          this.playTone(f * 2, 'triangle', 0.25, 0.14, this.sfxGain);
        }, idx * 60);
      });
    }

    playBuzzer() {
      if (!this.sfxEnabled || this.isMuted) return;
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.exponentialRampToValueAtTime(75, now + 0.28);

      gain.gain.setValueAtTime(0.38, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.3);
    }

    playTick() {
      if (!this.sfxEnabled || this.isMuted) return;
      this.init();
      this.playTone(880, 'sine', 0.05, 0.22, this.sfxGain);
    }

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
  // BACKGROUND ENVIRONMENT RENDERER (Warm Christmas Living Room)
  // Decorated Tree with Baubles/Star, Fireplace with Fire & Stockings, Rug
  // =========================================================================
  class RoomBackground {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.lights = [];
      this.baubles = [];
      this.initDecorations();
    }

    resize(w, h) {
      this.canvas.width = w;
      this.canvas.height = h;
      this.initDecorations();
    }

    initDecorations() {
      this.lights = [];
      this.baubles = [];
      const colors = ['#ef4444', '#facc15', '#4ade80', '#38bdf8', '#fbbf24', '#f43f5e'];

      // Tree fairy lights on left
      for (let i = 0; i < 30; i++) {
        this.lights.push({
          relX: 0.05 + Math.random() * 0.18,
          relY: 0.18 + Math.random() * 0.55,
          r: Math.random() * 3 + 3,
          color: colors[Math.floor(Math.random() * colors.length)],
          phase: Math.random() * Math.PI * 2,
          speed: Math.random() * 2 + 1
        });
      }

      // Hanging glass baubles
      for (let i = 0; i < 14; i++) {
        this.baubles.push({
          relX: 0.06 + Math.random() * 0.16,
          relY: 0.22 + Math.random() * 0.50,
          r: Math.random() * 4 + 6,
          color: colors[i % colors.length]
        });
      }
    }

    draw(time) {
      const w = this.canvas.width;
      const h = this.canvas.height;
      const ctx = this.ctx;
      ctx.clearRect(0, 0, w, h);

      // 1. Cozy Festive Wallpaper
      const wallGrad = ctx.createLinearGradient(0, 0, 0, h);
      wallGrad.addColorStop(0, '#0c1a2e');
      wallGrad.addColorStop(0.5, '#12233b');
      wallGrad.addColorStop(0.65, '#1e293b');
      wallGrad.addColorStop(1, '#0f172a');
      ctx.fillStyle = wallGrad;
      ctx.fillRect(0, 0, w, h);

      // 2. Arched Window with Moon & Snow (Upper Center)
      const winW = 110, winH = 140, winX = w * 0.5 - winW / 2, winY = 18;
      ctx.save();
      ctx.beginPath();
      ctx.arc(winX + winW / 2, winY + winW / 2, winW / 2, Math.PI, 0);
      ctx.lineTo(winX + winW, winY + winH);
      ctx.lineTo(winX, winY + winH);
      ctx.closePath();
      ctx.fillStyle = '#0f2b48';
      ctx.fill();
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 5;
      ctx.stroke();

      // Crescent Moon
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(winX + winW * 0.65, winY + 40, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#0f2b48';
      ctx.beginPath();
      ctx.arc(winX + winW * 0.58, winY + 38, 13, 0, Math.PI * 2);
      ctx.fill();

      // Window Panes
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(winX + winW / 2, winY);
      ctx.lineTo(winX + winW / 2, winY + winH);
      ctx.moveTo(winX, winY + winH * 0.55);
      ctx.lineTo(winX + winW, winY + winH * 0.55);
      ctx.stroke();
      ctx.restore();

      // 3. Decorated Christmas Tree on Left
      ctx.save();
      const treeBaseX = w * 0.13;
      const floorY = h * 0.62;
      const treeTopY = h * 0.08;
      const treeBottomY = floorY + 25;

      // Tree Trunk & Festive Stand
      ctx.fillStyle = '#451a03';
      ctx.fillRect(treeBaseX - 16, treeBottomY - 50, 32, 50);
      ctx.fillStyle = '#991b1b';
      ctx.beginPath();
      ctx.roundRect(treeBaseX - 35, treeBottomY - 14, 70, 20, 6);
      ctx.fill();
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Lush pine tiers
      const branchTiers = [
        { y: treeTopY + 65, w: 110, h: 80 },
        { y: treeTopY + 145, w: 170, h: 100 },
        { y: treeTopY + 235, w: 230, h: 120 },
        { y: treeTopY + 335, w: 290, h: 140 }
      ];

      for (const tier of branchTiers) {
        ctx.fillStyle = '#064e3b';
        ctx.beginPath();
        ctx.moveTo(treeBaseX, tier.y - tier.h);
        ctx.lineTo(treeBaseX + tier.w / 2, tier.y);
        ctx.lineTo(treeBaseX - tier.w / 2, tier.y);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#047857';
        ctx.beginPath();
        ctx.moveTo(treeBaseX, tier.y - tier.h + 10);
        ctx.lineTo(treeBaseX + tier.w * 0.40, tier.y - 6);
        ctx.lineTo(treeBaseX - tier.w * 0.40, tier.y - 6);
        ctx.closePath();
        ctx.fill();

        // Golden garland swag
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.arc(treeBaseX, tier.y - 8, tier.w * 0.35, 0.2, Math.PI - 0.2);
        ctx.stroke();
      }

      // Shiny Baubles on Tree
      for (const b of this.baubles) {
        const bx = b.relX * w;
        const by = b.relY * h;
        ctx.save();
        ctx.fillStyle = b.color;
        ctx.beginPath();
        ctx.arc(bx, by, b.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        // Bauble highlight shine
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.beginPath();
        ctx.arc(bx - b.r * 0.3, by - b.r * 0.3, b.r * 0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Glowing Tree Fairy Lights
      for (const l of this.lights) {
        const lx = l.relX * w;
        const ly = l.relY * h;
        const alpha = 0.5 + 0.5 * Math.sin(time * 0.003 * l.speed + l.phase);
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = l.color;
        ctx.shadowColor = l.color;
        ctx.shadowBlur = 14;
        ctx.beginPath();
        ctx.arc(lx, ly, l.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Golden Star with Glow on Tree Top
      ctx.save();
      ctx.fillStyle = '#fef08a';
      ctx.shadowColor = '#facc15';
      ctx.shadowBlur = 24;
      this.drawStar(ctx, treeBaseX, treeTopY - 14, 5, 22, 10);
      ctx.fill();
      ctx.restore();
      ctx.restore();

      // 4. Cozy Red-Brick Fireplace on Right
      ctx.save();
      const fpW = 160, fpH = 190, fpX = w * 0.86 - fpW / 2;
      const fpY = floorY - fpH + 50;
      // Brick chimney structure
      ctx.fillStyle = '#991b1b';
      ctx.fillRect(fpX, fpY, fpW, fpH);
      ctx.strokeStyle = '#7f1d1d';
      ctx.lineWidth = 2;
      ctx.strokeRect(fpX, fpY, fpW, fpH);

      // Wooden Mantelpiece
      ctx.fillStyle = '#78350f';
      ctx.fillRect(fpX - 12, fpY - 14, fpW + 24, 18);
      ctx.fillStyle = '#b45309';
      ctx.fillRect(fpX - 12, fpY - 14, fpW + 24, 4);

      // Fireplace Opening (Dark arch)
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.roundRect(fpX + 24, fpY + 36, fpW - 48, fpH - 36, [18, 18, 0, 0]);
      ctx.fill();

      // Glowing Fire in Hearth
      const fireAlpha = 0.75 + 0.25 * Math.sin(time * 0.008);
      ctx.save();
      ctx.shadowColor = '#f97316';
      ctx.shadowBlur = 28;
      ctx.fillStyle = `rgba(234, 88, 12, ${fireAlpha})`;
      ctx.beginPath();
      ctx.arc(fpX + fpW / 2, fpY + fpH - 16, 24, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(fpX + fpW / 2, fpY + fpH - 14, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Hanging Stockings on Mantel
      const stockX = [fpX + 30, fpX + fpW / 2, fpX + fpW - 30];
      const stockColors = ['#dc2626', '#16a34a', '#d97706'];
      stockX.forEach((sx, idx) => {
        ctx.fillStyle = stockColors[idx];
        ctx.beginPath();
        ctx.roundRect(sx - 8, fpY + 4, 16, 26, 6);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.roundRect(sx - 10, fpY + 2, 20, 8, 4);
        ctx.fill();
      });
      ctx.restore();

      // 5. Polished Wooden Floorboards
      const floorGrad = ctx.createLinearGradient(0, floorY, 0, h);
      floorGrad.addColorStop(0, '#592c10');
      floorGrad.addColorStop(0.5, '#451a03');
      floorGrad.addColorStop(1, '#290f02');
      ctx.fillStyle = floorGrad;
      ctx.fillRect(0, floorY, w, h - floorY);

      ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.lineWidth = 2;
      for (let y = floorY; y < h; y += 38) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // 6. Plush Holiday Rug in Center where presents rest
      const rugCenterX = w / 2;
      const rugCenterY = floorY + (h - floorY) * 0.50;
      const rugRadiusX = Math.min(w * 0.44, 450);
      const rugRadiusY = Math.min((h - floorY) * 0.48, 160);

      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
      ctx.shadowBlur = 30;
      ctx.shadowOffsetY = 14;

      // Deep Burgundy Velvet Rug
      ctx.fillStyle = '#881337';
      ctx.beginPath();
      ctx.ellipse(rugCenterX, rugCenterY, rugRadiusX, rugRadiusY, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Golden Braided Border
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.ellipse(rugCenterX, rugCenterY, rugRadiusX * 0.94, rugRadiusY * 0.94, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Warm Amber Spotlight from Above
      const spotGrad = ctx.createRadialGradient(rugCenterX, rugCenterY, 30, rugCenterX, rugCenterY, rugRadiusX);
      spotGrad.addColorStop(0, 'rgba(254, 240, 138, 0.20)');
      spotGrad.addColorStop(0.65, 'rgba(254, 240, 138, 0.06)');
      spotGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = spotGrad;
      ctx.beginPath();
      ctx.ellipse(rugCenterX, rugCenterY, rugRadiusX, rugRadiusY, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    drawStar(ctx, cx, cy, spikes, outerRadius, innerRadius) {
      let rot = (Math.PI / 2) * 3;
      let x = cx, y = cy;
      const step = Math.PI / spikes;

      ctx.beginPath();
      ctx.moveTo(cx, cy - outerRadius);
      for (let i = 0; i < spikes; i++) {
        x = cx + Math.cos(rot) * outerRadius;
        y = cy + Math.sin(rot) * outerRadius;
        ctx.lineTo(x, y);
        rot += step;

        x = cx + Math.cos(rot) * innerRadius;
        y = cy + Math.sin(rot) * innerRadius;
        ctx.lineTo(x, y);
        rot += step;
      }
      ctx.lineTo(cx, cy - outerRadius);
      ctx.closePath();
    }
  }

  // =========================================================================
  // ITEM DEFINITIONS & UNIFIED SILHOUETTE PATH DRAWING (NO INTERIOR OVERLAPS!)
  // =========================================================================
  const ITEMS = [
    {
      id: 'violin',
      name: 'Violin',
      counterpart: 'wine_bottle',
      width: 72,
      height: 140,
      drawSilhouette(ctx, w, h) {
        const hw = w / 2, hh = h / 2;
        ctx.beginPath();
        ctx.moveTo(0, -hh);
        ctx.bezierCurveTo(hw * 0.18, -hh - 6, hw * 0.25, -hh + 12, hw * 0.12, -hh + 24);
        ctx.lineTo(hw * 0.12, -hh * 0.4);
        ctx.bezierCurveTo(hw * 0.75, -hh * 0.4, hw * 0.85, -hh * 0.15, hw * 0.7, hh * 0.05);
        ctx.bezierCurveTo(hw * 0.32, hh * 0.18, hw * 0.32, hh * 0.32, hw * 0.85, hh * 0.45);
        ctx.bezierCurveTo(hw * 0.95, hh * 0.75, hw * 0.55, hh * 0.98, 0, hh);
        ctx.bezierCurveTo(-hw * 0.55, hh * 0.98, -hw * 0.95, hh * 0.75, -hw * 0.85, hh * 0.45);
        ctx.bezierCurveTo(-hw * 0.32, hh * 0.32, -hw * 0.32, hh * 0.18, -hw * 0.7, hh * 0.05);
        ctx.bezierCurveTo(-hw * 0.85, -hh * 0.15, -hw * 0.75, -hh * 0.4, -hw * 0.12, -hh * 0.4);
        ctx.lineTo(-hw * 0.12, -hh + 24);
        ctx.bezierCurveTo(-hw * 0.25, -hh + 12, -hw * 0.18, -hh - 6, 0, -hh);
        ctx.closePath();
      },
      drawToy(ctx, w, h) {
        const hw = w / 2, hh = h / 2;
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

        ctx.fillStyle = '#0f172a';
        ctx.fillRect(-hw * 0.12, -hh * 0.45, hw * 0.24, hh * 0.85);

        ctx.strokeStyle = '#292524';
        ctx.lineWidth = 2;
        [-hw * 0.35, hw * 0.35].forEach((fx) => {
          ctx.beginPath();
          ctx.moveTo(fx, hh * 0.2);
          ctx.bezierCurveTo(fx + (fx > 0 ? 5 : -5), hh * 0.3, fx - (fx > 0 ? 6 : -6), hh * 0.4, fx, hh * 0.5);
          ctx.stroke();
        });

        ctx.fillStyle = '#1c1917';
        ctx.beginPath();
        ctx.moveTo(-hw * 0.2, hh * 0.75);
        ctx.lineTo(hw * 0.2, hh * 0.75);
        ctx.lineTo(0, hh * 0.95);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1;
        [-4, -1.3, 1.3, 4].forEach((sx) => {
          ctx.beginPath();
          ctx.moveTo(sx, -hh + 22);
          ctx.lineTo(sx * 1.5, hh * 0.75);
          ctx.stroke();
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
        const hw = w / 2, hh = h / 2;
        ctx.beginPath();
        ctx.moveTo(-hw * 0.2, -hh);
        ctx.lineTo(hw * 0.2, -hh);
        ctx.lineTo(hw * 0.2, -hh * 0.4);
        ctx.bezierCurveTo(hw * 0.22, -hh * 0.2, hw * 0.85, -hh * 0.15, hw * 0.85, 0);
        ctx.lineTo(hw * 0.85, hh * 0.9);
        ctx.bezierCurveTo(hw * 0.85, hh, hw * 0.6, hh, 0, hh);
        ctx.bezierCurveTo(-hw * 0.6, hh, -hw * 0.85, hh, -hw * 0.85, hh * 0.9);
        ctx.lineTo(-hw * 0.85, 0);
        ctx.bezierCurveTo(-hw * 0.85, -hh * 0.15, -hw * 0.22, -hh * 0.2, -hw * 0.2, -hh * 0.4);
        ctx.closePath();
      },
      drawToy(ctx, w, h) {
        const hw = w / 2, hh = h / 2;
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

        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(-hw * 0.2, -hh, hw * 0.4, hh * 0.35);

        ctx.fillStyle = '#fef3c7';
        ctx.strokeStyle = '#92400e';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(-hw * 0.65, hh * 0.1, hw * 1.3, hh * 0.65, 4);
        ctx.fill();
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
        const hw = w / 2, hh = h / 2;
        ctx.beginPath();
        ctx.moveTo(-hw * 0.3, -hh);
        ctx.lineTo(hw * 0.35, -hh);
        ctx.lineTo(hw * 0.3, hh * 0.3);
        ctx.lineTo(hw * 0.4, hh * 0.5);
        ctx.lineTo(hw * 0.25, hh * 0.5);
        ctx.lineTo(hw * 0.25, hh * 0.85);
        ctx.lineTo(hw * 0.45, hh * 0.85);
        ctx.lineTo(hw * 0.45, hh);
        ctx.lineTo(-hw * 0.7, hh);
        ctx.bezierCurveTo(-hw * 0.88, hh, -hw * 0.88, hh * 0.7, -hw * 0.75, hh * 0.65);
        ctx.lineTo(-hw * 0.45, hh * 0.65);
        ctx.lineTo(-hw * 0.45, hh * 0.5);
        ctx.lineTo(-hw * 0.65, hh * 0.45);
        ctx.bezierCurveTo(-hw * 0.4, hh * 0.1, -hw * 0.2, -hh * 0.4, -hw * 0.3, -hh);
        ctx.closePath();
      },
      drawToy(ctx, w, h) {
        const hw = w / 2, hh = h / 2;
        ctx.fillStyle = '#f8fafc';
        this.drawSilhouette(ctx, w, h);
        ctx.fill();
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = '#475569';
        ctx.stroke();

        ctx.fillStyle = '#94a3b8';
        ctx.beginPath();
        ctx.rect(-hw * 0.7, hh * 0.85, hw * 1.15, hh * 0.15);
        ctx.fill();

        ctx.fillStyle = '#78350f';
        ctx.beginPath();
        ctx.moveTo(-hw * 0.65, hh * 0.45);
        ctx.lineTo(hw * 0.38, hh * 0.45);
        ctx.lineTo(hw * 0.38, hh * 0.58);
        ctx.lineTo(hw * 0.2, hh * 0.58);
        ctx.lineTo(-hw * 0.45, hh * 0.5);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = '#dc2626';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(-hw * 0.15, -hh * 0.6);
        ctx.lineTo(-hw * 0.05, -hh * 0.4);
        ctx.lineTo(-hw * 0.22, -hh * 0.2);
        ctx.lineTo(-hw * 0.1, 0);
        ctx.lineTo(-hw * 0.3, hh * 0.2);
        ctx.stroke();

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
        const hw = w / 2, hh = h / 2;
        ctx.beginPath();
        ctx.moveTo(-hw * 0.4, -hh);
        ctx.lineTo(hw * 0.35, -hh);
        ctx.lineTo(hw * 0.35, hh * 0.1);
        ctx.bezierCurveTo(hw * 0.5, hh * 0.3, hw * 0.55, hh * 0.65, hw * 0.25, hh * 0.85);
        ctx.bezierCurveTo(0, hh * 0.95, -hw * 0.45, hh * 0.95, -hw * 0.75, hh * 0.7);
        ctx.bezierCurveTo(-hw * 0.9, hh * 0.5, -hw * 0.7, hh * 0.25, -hw * 0.45, hh * 0.25);
        ctx.bezierCurveTo(-hw * 0.25, hh * 0.05, -hw * 0.2, -hh * 0.4, -hw * 0.4, -hh);
        ctx.closePath();
      },
      drawToy(ctx, w, h) {
        const hw = w / 2, hh = h / 2;
        ctx.fillStyle = '#dc2626';
        this.drawSilhouette(ctx, w, h);
        ctx.fill();
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = '#991b1b';
        ctx.stroke();

        ctx.fillStyle = '#16a34a';
        ctx.beginPath();
        ctx.arc(-hw * 0.55, hh * 0.55, 22, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(hw * 0.32, hh * 0.5, 18, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(-hw * 0.45, -hh - 4, hw * 0.85, 20, 10);
        ctx.fill();
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
        // UNIFIED CONTINUOUS CONTOUR PATH (NO INTERIOR OVERLAPS!)
        const hw = w / 2, hh = h / 2;
        ctx.beginPath();
        // Antenna ball & stem
        ctx.moveTo(-3, -hh * 0.82);
        ctx.lineTo(-3, -hh * 0.92);
        ctx.arc(0, -hh * 0.95, 6, Math.PI, 0);
        ctx.lineTo(3, -hh * 0.82);
        // Head top
        ctx.lineTo(hw * 0.4, -hh * 0.82);
        // Head right side & ear knob
        ctx.lineTo(hw * 0.4, -hh * 0.65);
        ctx.lineTo(hw * 0.52, -hh * 0.65);
        ctx.lineTo(hw * 0.52, -hh * 0.52);
        ctx.lineTo(hw * 0.4, -hh * 0.52);
        ctx.lineTo(hw * 0.4, -hh * 0.38);
        // Neck in & Right shoulder
        ctx.lineTo(hw * 0.22, -hh * 0.38);
        ctx.lineTo(hw * 0.55, -hh * 0.38);
        // Right arm down
        ctx.lineTo(hw * 0.75, -hh * 0.1);
        ctx.lineTo(hw * 0.75, hh * 0.3);
        // Hand claw
        ctx.lineTo(hw * 0.55, hh * 0.3);
        ctx.lineTo(hw * 0.55, hh * 0.15);
        ctx.lineTo(hw * 0.4, hh * 0.15);
        // Torso right side
        ctx.lineTo(hw * 0.4, hh * 0.48);
        // Right leg down & foot
        ctx.lineTo(hw * 0.38, hh);
        ctx.lineTo(hw * 0.08, hh);
        ctx.lineTo(hw * 0.08, hh * 0.55);
        // Crotch
        ctx.lineTo(-hw * 0.08, hh * 0.55);
        // Left leg down & foot
        ctx.lineTo(-hw * 0.08, hh);
        ctx.lineTo(-hw * 0.38, hh);
        ctx.lineTo(-hw * 0.38, hh * 0.48);
        // Torso left side
        ctx.lineTo(-hw * 0.4, hh * 0.15);
        ctx.lineTo(-hw * 0.55, hh * 0.15);
        ctx.lineTo(-hw * 0.55, hh * 0.3);
        // Left hand claw
        ctx.lineTo(-hw * 0.75, hh * 0.3);
        ctx.lineTo(-hw * 0.75, -hh * 0.1);
        // Left shoulder
        ctx.lineTo(-hw * 0.55, -hh * 0.38);
        ctx.lineTo(-hw * 0.22, -hh * 0.38);
        // Neck in & Head left side & ear knob
        ctx.lineTo(-hw * 0.4, -hh * 0.38);
        ctx.lineTo(-hw * 0.4, -hh * 0.52);
        ctx.lineTo(-hw * 0.52, -hh * 0.52);
        ctx.lineTo(-hw * 0.52, -hh * 0.65);
        ctx.lineTo(-hw * 0.4, -hh * 0.65);
        ctx.lineTo(-hw * 0.4, -hh * 0.82);
        ctx.closePath();
      },
      drawToy(ctx, w, h) {
        const hw = w / 2, hh = h / 2;
        ctx.fillStyle = '#0284c7';
        this.drawSilhouette(ctx, w, h);
        ctx.fill();
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = '#0369a1';
        ctx.stroke();

        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(0, -hh * 0.95, 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#1e293b';
        ctx.fillRect(-hw * 0.3, -hh * 0.72, hw * 0.6, 18);
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.arc(-hw * 0.15, -hh * 0.63, 4.5, 0, Math.PI * 2);
        ctx.arc(hw * 0.15, -hh * 0.63, 4.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#e2e8f0';
        ctx.beginPath();
        ctx.arc(0, 0, 16, 0, Math.PI * 2);
        ctx.fill();
      }
    },

    {
      id: 'teddy_bear',
      name: 'Teddy Bear',
      counterpart: 'robot',
      width: 95,
      height: 120,
      drawSilhouette(ctx, w, h) {
        // UNIFIED CONTINUOUS CONTOUR PATH (NO OVERLAPPING CIRCLES!)
        const hw = w / 2, hh = h / 2;
        ctx.beginPath();
        ctx.moveTo(0, -hh * 0.72);
        // Right ear
        ctx.lineTo(hw * 0.22, -hh * 0.7);
        ctx.bezierCurveTo(hw * 0.55, -hh * 0.95, hw * 0.65, -hh * 0.45, hw * 0.35, -hh * 0.45);
        // Right cheek
        ctx.bezierCurveTo(hw * 0.5, -hh * 0.25, hw * 0.45, -hh * 0.05, hw * 0.3, 0);
        // Right arm out & round paw
        ctx.bezierCurveTo(hw * 0.75, 0, hw * 0.85, hh * 0.25, hw * 0.5, hh * 0.32);
        // Right waist & foot
        ctx.bezierCurveTo(hw * 0.55, hh * 0.45, hw * 0.7, hh * 0.65, hw * 0.55, hh * 0.88);
        ctx.bezierCurveTo(hw * 0.4, hh, hw * 0.15, hh, hw * 0.1, hh * 0.72);
        // Inseam
        ctx.lineTo(-hw * 0.1, hh * 0.72);
        // Left foot
        ctx.bezierCurveTo(-hw * 0.15, hh, -hw * 0.4, hh, -hw * 0.55, hh * 0.88);
        // Left waist
        ctx.bezierCurveTo(-hw * 0.7, hh * 0.65, -hw * 0.55, hh * 0.45, -hw * 0.5, hh * 0.32);
        // Left arm & paw
        ctx.bezierCurveTo(-hw * 0.85, hh * 0.25, -hw * 0.75, 0, -hw * 0.3, 0);
        // Left cheek
        ctx.bezierCurveTo(-hw * 0.45, -hh * 0.05, -hw * 0.5, -hh * 0.25, -hw * 0.35, -hh * 0.45);
        // Left ear
        ctx.bezierCurveTo(-hw * 0.65, -hh * 0.45, -hw * 0.55, -hh * 0.95, -hw * 0.22, -hh * 0.7);
        ctx.closePath();
      },
      drawToy(ctx, w, h) {
        const hw = w / 2, hh = h / 2;
        ctx.fillStyle = '#b45309';
        this.drawSilhouette(ctx, w, h);
        ctx.fill();
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = '#78350f';
        ctx.stroke();

        ctx.fillStyle = '#fde68a';
        ctx.beginPath();
        ctx.arc(-hw * 0.38, -hh * 0.62, 7, 0, Math.PI * 2);
        ctx.arc(hw * 0.38, -hh * 0.62, 7, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#fef3c7';
        ctx.beginPath();
        ctx.ellipse(0, -hh * 0.32, 18, 14, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#451a03';
        ctx.beginPath();
        ctx.arc(0, -hh * 0.38, 4.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(0, -hh * 0.08, 6, 0, Math.PI * 2);
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
        const hw = w / 2, hh = h / 2;
        ctx.beginPath();
        ctx.moveTo(-hw * 0.9, hh * 0.4);
        ctx.bezierCurveTo(-hw * 0.95, hh * 0.1, -hw * 0.8, -hh * 0.1, -hw * 0.5, -hh * 0.15);
        ctx.bezierCurveTo(-hw * 0.35, -hh * 0.8, -hw * 0.1, -hh * 0.85, hw * 0.1, -hh * 0.85);
        ctx.bezierCurveTo(hw * 0.4, -hh * 0.85, hw * 0.6, -hh * 0.2, hw * 0.88, -hh * 0.05);
        ctx.lineTo(hw * 0.92, hh * 0.4);
        ctx.lineTo(hw * 0.65, hh * 0.4);
        ctx.arc(hw * 0.45, hh * 0.4, 20, 0, Math.PI, true);
        ctx.lineTo(-hw * 0.25, hh * 0.4);
        ctx.arc(-hw * 0.45, hh * 0.4, 20, 0, Math.PI, true);
        ctx.lineTo(-hw * 0.9, hh * 0.4);
        ctx.closePath();
      },
      drawToy(ctx, w, h) {
        const hw = w / 2, hh = h / 2;
        ctx.fillStyle = '#dc2626';
        this.drawSilhouette(ctx, w, h);
        ctx.fill();
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = '#991b1b';
        ctx.stroke();

        ctx.fillStyle = '#bae6fd';
        ctx.beginPath();
        ctx.moveTo(-hw * 0.3, -hh * 0.2);
        ctx.lineTo(-hw * 0.15, -hh * 0.65);
        ctx.lineTo(hw * 0.05, -hh * 0.65);
        ctx.lineTo(hw * 0.05, -hh * 0.2);
        ctx.closePath();
        ctx.fill();

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
      }
    },

    {
      id: 'toy_train',
      name: 'Toy Train',
      counterpart: 'toy_car',
      width: 120,
      height: 85,
      drawSilhouette(ctx, w, h) {
        const hw = w / 2, hh = h / 2;
        ctx.beginPath();
        ctx.moveTo(-hw * 0.95, hh * 0.5);
        ctx.lineTo(-hw * 0.75, hh * 0.2);
        ctx.lineTo(-hw * 0.75, -hh * 0.2);
        ctx.lineTo(-hw * 0.65, -hh * 0.2);
        ctx.lineTo(-hw * 0.7, -hh);
        ctx.lineTo(-hw * 0.45, -hh);
        ctx.lineTo(-hw * 0.5, -hh * 0.2);
        ctx.arc(-hw * 0.2, -hh * 0.2, 10, Math.PI, 0);
        ctx.lineTo(hw * 0.05, -hh * 0.2);
        ctx.lineTo(hw * 0.02, -hh * 0.8);
        ctx.lineTo(hw * 0.9, -hh * 0.8);
        ctx.lineTo(hw * 0.85, hh * 0.5);
        ctx.lineTo(-hw * 0.95, hh * 0.5);
        ctx.closePath();
      },
      drawToy(ctx, w, h) {
        const hw = w / 2, hh = h / 2;
        ctx.fillStyle = '#065f46';
        this.drawSilhouette(ctx, w, h);
        ctx.fill();
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = '#064e3b';
        ctx.stroke();

        ctx.fillStyle = '#dc2626';
        ctx.beginPath();
        ctx.roundRect(0, -hh * 0.85, hw * 0.95, 10, 4);
        ctx.fill();

        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.roundRect(hw * 0.2, -hh * 0.55, hw * 0.4, 24, 6);
        ctx.fill();

        ctx.fillStyle = '#1e293b';
        [-hw * 0.6, -hw * 0.2, hw * 0.45].forEach((wx, i) => {
          const r = i === 2 ? 18 : 13;
          ctx.beginPath();
          ctx.arc(wx, hh * 0.45, r, 0, Math.PI * 2);
          ctx.fill();
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
        // UNIFIED CONTINUOUS CONTOUR HOOK PATH
        const hw = w / 2, hh = h / 2;
        ctx.beginPath();
        ctx.moveTo(-hw * 0.35, hh * 0.85);
        ctx.arc(-hw * 0.15, hh * 0.85, hw * 0.2, Math.PI, 0, true);
        ctx.lineTo(hw * 0.05, -hh * 0.35);
        ctx.bezierCurveTo(hw * 0.05, -hh * 0.95, -hw * 0.95, -hh * 0.95, -hw * 0.95, -hh * 0.35);
        ctx.arc(-hw * 0.75, -hh * 0.35, hw * 0.2, Math.PI, 0, true);
        ctx.bezierCurveTo(-hw * 0.55, -hh * 0.7, -hw * 0.35, -hh * 0.7, -hw * 0.35, -hh * 0.35);
        ctx.lineTo(-hw * 0.35, hh * 0.85);
        ctx.closePath();
      },
      drawToy(ctx, w, h) {
        const hw = w / 2, hh = h / 2;
        ctx.fillStyle = '#ffffff';
        this.drawSilhouette(ctx, w, h);
        ctx.fill();
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = '#e2e8f0';
        ctx.stroke();

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
      }
    },

    {
      id: 'diamond_ring',
      name: 'Diamond Ring',
      counterpart: 'candy_cane',
      width: 80,
      height: 90,
      drawSilhouette(ctx, w, h) {
        // UNIFIED CONTINUOUS CONTOUR PATH
        const hw = w / 2, hh = h / 2;
        ctx.beginPath();
        ctx.moveTo(-hw * 0.25, -hh * 0.95);
        ctx.lineTo(hw * 0.25, -hh * 0.95);
        ctx.lineTo(hw * 0.48, -hh * 0.65);
        ctx.lineTo(hw * 0.15, -hh * 0.35);
        ctx.lineTo(hw * 0.85, -hh * 0.35);
        ctx.lineTo(hw * 0.85, hh * 0.88);
        ctx.lineTo(-hw * 0.85, hh * 0.88);
        ctx.lineTo(-hw * 0.85, -hh * 0.35);
        ctx.lineTo(-hw * 0.15, -hh * 0.35);
        ctx.lineTo(-hw * 0.48, -hh * 0.65);
        ctx.closePath();
      },
      drawToy(ctx, w, h) {
        const hw = w / 2, hh = h / 2;
        ctx.fillStyle = '#1e1b4b';
        ctx.beginPath();
        ctx.roundRect(-hw * 0.85, -hh * 0.25, hw * 1.7, hh * 1.1, 8);
        ctx.fill();
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = '#312e81';
        ctx.stroke();

        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(0, -hh * 0.3, 16, Math.PI, 0, true);
        ctx.lineWidth = 5;
        ctx.strokeStyle = '#f59e0b';
        ctx.stroke();

        ctx.fillStyle = '#e0f2fe';
        ctx.beginPath();
        ctx.moveTo(-hw * 0.28, -hh);
        ctx.lineTo(hw * 0.28, -hh);
        ctx.lineTo(hw * 0.48, -hh * 0.65);
        ctx.lineTo(0, -hh * 0.25);
        ctx.lineTo(-hw * 0.48, -hh * 0.65);
        ctx.closePath();
        ctx.fill();
      }
    }
  ];

  // Rich Festive Wrapping Paper Palettes & Patterns
  const WRAP_PATTERNS = [
    { bg: '#dc2626', ribbon: '#facc15', type: 'stars', patternColor: 'rgba(254, 240, 138, 0.55)' },
    { bg: '#15803d', ribbon: '#ef4444', type: 'snowflakes', patternColor: 'rgba(255, 255, 255, 0.6)' },
    { bg: '#0284c7', ribbon: '#fef08a', type: 'stripes', patternColor: 'rgba(255, 255, 255, 0.45)' },
    { bg: '#7c3aed', ribbon: '#fbbf24', type: 'dots', patternColor: 'rgba(253, 230, 138, 0.5)' },
    { bg: '#ea580c', ribbon: '#22c55e', type: 'stars', patternColor: 'rgba(254, 215, 170, 0.55)' },
    { bg: '#b91c1c', ribbon: '#38bdf8', type: 'plaid', patternColor: 'rgba(255, 255, 255, 0.35)' }
  ];

  // =========================================================================
  // PRESENT OBJECT IN THE GAMEPLAY PILE
  // Tactile 3D Shrink-Wrapped Silhouette + Cellophane Specular + Thick Ribbons
  // =========================================================================
  class Present {
    constructor(item, x, y, scale = 1, rotation = 0, wrapStyle = null) {
      this.item = item;
      this.x = x;
      this.y = y;
      this.baseScale = scale;
      this.currentScale = scale;
      this.rotation = rotation;
      this.wrapStyle = wrapStyle || WRAP_PATTERNS[Math.floor(Math.random() * WRAP_PATTERNS.length)];
      this.isUnwrapped = false;
      this.unwrapAnim = 0;
      this.wobble = 0;
      this.wobbleSpeed = 0;
      this.isHovered = false;
      this.zIndex = 0;
    }

    triggerWobble() {
      this.wobble = 1.0;
      this.wobbleSpeed = 38;
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

      // Smooth hover scale transition
      const targetScale = this.isHovered && !this.isUnwrapped ? this.baseScale * 1.06 : this.baseScale;
      this.currentScale += (targetScale - this.currentScale) * 0.15;
    }

    containsPoint(px, py, ctx) {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rotation);
      ctx.scale(this.currentScale, this.currentScale);
      this.item.drawSilhouette(ctx, this.item.width, this.item.height);
      const inside = ctx.isPointInPath(px, py);
      ctx.restore();
      return inside;
    }

    draw(ctx) {
      ctx.save();
      const shakeX = this.wobble > 0 ? Math.sin(this.wobble * this.wobbleSpeed) * 12 * this.wobble : 0;
      ctx.translate(this.x + shakeX, this.y);
      ctx.rotate(this.rotation);
      ctx.scale(this.currentScale, this.currentScale);

      // 1. Soft Contact Drop Shadow
      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
      ctx.shadowBlur = this.isHovered ? 26 : 18;
      ctx.shadowOffsetY = this.isHovered ? 14 : 10;
      this.item.drawSilhouette(ctx, this.item.width, this.item.height);
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      ctx.fill();
      ctx.restore();

      // 2. Hover Golden Glow Aura
      if (this.isHovered && !this.isUnwrapped) {
        ctx.save();
        this.item.drawSilhouette(ctx, this.item.width, this.item.height);
        ctx.lineWidth = 10;
        ctx.strokeStyle = 'rgba(250, 204, 21, 0.7)';
        ctx.shadowColor = '#facc15';
        ctx.shadowBlur = 18;
        ctx.stroke();
        ctx.restore();
      }

      if (this.isUnwrapped) {
        this.item.drawToy(ctx, this.item.width, this.item.height);

        if (this.unwrapAnim < 1.0) {
          ctx.save();
          this.item.drawSilhouette(ctx, this.item.width, this.item.height);
          ctx.fillStyle = `rgba(255, 255, 255, ${(1.0 - this.unwrapAnim) * 0.7})`;
          ctx.fill();
          ctx.restore();
        }
      } else {
        this.drawWrappedPresent(ctx);
      }

      ctx.restore();
    }

    drawWrappedPresent(ctx) {
      const w = this.item.width;
      const h = this.item.height;

      ctx.save();
      // Single continuous outline clip
      this.item.drawSilhouette(ctx, w, h);
      ctx.clip();

      // 1. Festive Wrapping Paper Base Color
      ctx.fillStyle = this.wrapStyle.bg;
      ctx.fillRect(-w, -h, w * 2, h * 2);

      // 2. High-contrast Holiday Pattern
      this.renderPattern(ctx, w, h, this.wrapStyle.type);

      // 3. 3D Bevel & Ambient Shading
      const shadeGrad = ctx.createLinearGradient(-w * 0.5, -h * 0.5, w * 0.5, h * 0.5);
      shadeGrad.addColorStop(0, 'rgba(255, 255, 255, 0.38)');
      shadeGrad.addColorStop(0.4, 'rgba(255, 255, 255, 0.0)');
      shadeGrad.addColorStop(0.7, 'rgba(0, 0, 0, 0.15)');
      shadeGrad.addColorStop(1, 'rgba(0, 0, 0, 0.45)');
      ctx.fillStyle = shadeGrad;
      ctx.fillRect(-w, -h, w * 2, h * 2);

      // 4. Chunky Cross-Ribbon Band
      this.drawRibbonBands(ctx, w, h, this.wrapStyle.ribbon);

      // 5. Shrink-wrap Cellophane Specular Sheen (Glossy toy look)
      const glossGrad = ctx.createLinearGradient(-w * 0.4, -h * 0.4, -w * 0.1, -h * 0.1);
      glossGrad.addColorStop(0, 'rgba(255, 255, 255, 0.65)');
      glossGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.25)');
      glossGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = glossGrad;
      ctx.beginPath();
      ctx.ellipse(-w * 0.18, -h * 0.25, w * 0.35, h * 0.18, Math.PI * 0.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      // Clean Bold Vector Contour Border (Nitrome trademark, ZERO interior lines)
      ctx.save();
      this.item.drawSilhouette(ctx, w, h);
      ctx.lineWidth = 3.5;
      ctx.strokeStyle = '#0f172a';
      ctx.stroke();
      ctx.restore();

      // 6. Layered 3D Holiday Bow at Center Knot
      this.draw3DBow(ctx, this.wrapStyle.ribbon);
    }

    drawRibbonBands(ctx, w, h, color) {
      ctx.save();
      ctx.fillStyle = color;
      ctx.fillRect(-8, -h, 16, h * 2);

      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(-8, -h, 16, h * 2);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.fillRect(-3, -h, 6, h * 2);

      ctx.fillStyle = color;
      ctx.fillRect(-w, -8, w * 2, 16);
      ctx.strokeRect(-w, -8, w * 2, 16);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.fillRect(-w, -3, w * 2, 6);
      ctx.restore();
    }

    renderPattern(ctx, w, h, type) {
      ctx.save();
      ctx.fillStyle = this.wrapStyle.patternColor;
      const step = 22;

      switch (type) {
        case 'stars':
          for (let x = -w; x <= w; x += step) {
            for (let y = -h; y <= h; y += step) {
              const ox = (Math.abs(y) % (step * 2) === 0) ? step / 2 : 0;
              this.drawMiniStar(ctx, x + ox, y, 4.5);
            }
          }
          break;
        case 'snowflakes':
          ctx.strokeStyle = this.wrapStyle.patternColor;
          ctx.lineWidth = 1.6;
          for (let x = -w; x <= w; x += step * 1.3) {
            for (let y = -h; y <= h; y += step * 1.3) {
              this.drawMiniSnowflake(ctx, x, y, 6);
            }
          }
          break;
        case 'stripes':
          ctx.lineWidth = 7;
          ctx.strokeStyle = this.wrapStyle.patternColor;
          for (let d = -w - h; d <= w + h; d += 22) {
            ctx.beginPath();
            ctx.moveTo(d, -h);
            ctx.lineTo(d + h * 2, h);
            ctx.stroke();
          }
          break;
        case 'plaid':
          ctx.lineWidth = 4;
          ctx.strokeStyle = this.wrapStyle.patternColor;
          for (let x = -w; x <= w; x += 18) {
            ctx.beginPath();
            ctx.moveTo(x, -h);
            ctx.lineTo(x, h);
            ctx.stroke();
          }
          for (let y = -h; y <= h; y += 18) {
            ctx.beginPath();
            ctx.moveTo(-w, y);
            ctx.lineTo(w, y);
            ctx.stroke();
          }
          break;
        default:
          for (let x = -w; x <= w; x += step) {
            for (let y = -h; y <= h; y += step) {
              const ox = (Math.abs(y) % (step * 2) === 0) ? step / 2 : 0;
              ctx.beginPath();
              ctx.arc(x + ox, y, 3.2, 0, Math.PI * 2);
              ctx.fill();
            }
          }
      }
      ctx.restore();
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
      for (let i = 0; i < 3; i++) {
        const ang = (i * Math.PI) / 3;
        ctx.beginPath();
        ctx.moveTo(cx - Math.cos(ang) * r, cy - Math.sin(ang) * r);
        ctx.lineTo(cx + Math.cos(ang) * r, cy + Math.sin(ang) * r);
        ctx.stroke();
      }
    }

    draw3DBow(ctx, color) {
      ctx.save();
      ctx.fillStyle = color;
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2.2;

      ctx.beginPath();
      ctx.moveTo(-4, 0);
      ctx.lineTo(-14, 18);
      ctx.lineTo(-6, 14);
      ctx.lineTo(0, 0);
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(4, 0);
      ctx.lineTo(14, 18);
      ctx.lineTo(6, 14);
      ctx.lineTo(0, 0);
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.bezierCurveTo(-16, -18, -22, 6, 0, 0);
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.bezierCurveTo(16, -18, 22, 6, 0, 0);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.beginPath();
      ctx.ellipse(-8, -6, 4, 2, -Math.PI * 0.25, 0, Math.PI * 2);
      ctx.ellipse(8, -6, 4, 2, Math.PI * 0.25, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(0, 0, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-1.5, -2, 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }

  // =========================================================================
  // PARTICLE SYSTEM
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

    spawnPaperRip(x, y, wrapStyle) {
      const colors = [wrapStyle.bg, wrapStyle.ribbon, '#ffffff', '#facc15', '#4ade80'];

      for (let i = 0; i < 45; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 400 + 120;
        this.particles.push({
          x: x,
          y: y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 160,
          gravity: 600,
          w: Math.random() * 12 + 6,
          h: Math.random() * 8 + 4,
          rot: Math.random() * Math.PI * 2,
          rotSpeed: (Math.random() - 0.5) * 16,
          color: colors[Math.floor(Math.random() * colors.length)],
          alpha: 1.0,
          life: Math.random() * 0.6 + 0.8
        });
      }

      for (let i = 0; i < 18; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 320 + 80;
        this.particles.push({
          x: x,
          y: y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 180,
          gravity: 420,
          w: Math.random() * 20 + 10,
          h: 3.5,
          rot: Math.random() * Math.PI * 2,
          rotSpeed: (Math.random() - 0.5) * 12,
          color: wrapStyle.ribbon,
          alpha: 1.0,
          life: 1.2
        });
      }

      for (let i = 0; i < 24; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 240 + 60;
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

    addFloatingText(x, y, text, color) {
      this.floatingTexts.push({
        x: x,
        y: y,
        text: text,
        color: color,
        vy: -80,
        alpha: 1.0,
        life: 1.1
      });
    }

    update(dt) {
      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += p.gravity * dt;
        p.rot += p.rotSpeed * dt;
        p.life -= dt;
        p.alpha = Math.max(0, p.life);
        if (p.life <= 0) this.particles.splice(i, 1);
      }

      for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
        const ft = this.floatingTexts[i];
        ft.y += ft.vy * dt;
        ft.life -= dt;
        ft.alpha = Math.max(0, ft.life);
        if (ft.life <= 0) this.floatingTexts.splice(i, 1);
      }
    }

    draw() {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

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

      for (const ft of this.floatingTexts) {
        this.ctx.save();
        this.ctx.globalAlpha = ft.alpha;
        this.ctx.font = '900 24px "Fredoka", sans-serif';
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
      this.bgCanvas = document.getElementById('bgCanvas');
      this.snowCanvas = document.getElementById('snowCanvas');
      this.gameCanvas = document.getElementById('gameCanvas');
      this.fxCanvas = document.getElementById('fxCanvas');
      this.targetCanvas = document.getElementById('targetCanvas');
      this.ctx = this.gameCanvas.getContext('2d');
      this.targetCtx = this.targetCanvas.getContext('2d');

      this.btnHome = document.getElementById('btnHome');
      this.btnSound = document.getElementById('btnSound');
      this.soundIcon = document.getElementById('soundIcon');
      this.btnRestart = document.getElementById('btnRestart');
      this.btnFullscreen = document.getElementById('btnFullscreen');
      this.timerBadge = document.getElementById('timerBadge');
      this.timerText = document.getElementById('timerText');
      this.scoreBadge = document.getElementById('scoreBadge');
      this.scoreText = document.getElementById('scoreText');
      this.streakBadge = document.getElementById('streakBadge');
      this.targetName = document.getElementById('targetName');
      this.targetCard = document.getElementById('targetCard');
      this.gameToast = document.getElementById('gameToast');
      this.toastText = document.getElementById('toastText');

      this.menuScreen = document.getElementById('menuScreen');
      this.howToModal = document.getElementById('howToModal');
      this.settingsModal = document.getElementById('settingsModal');
      this.gameOverModal = document.getElementById('gameOverModal');
      this.homeModal = document.getElementById('homeModal');
      this.menuBestScore = document.getElementById('menuBestScore');

      this.btnPlay = document.getElementById('btnPlay');
      this.btnHowTo = document.getElementById('btnHowTo');
      this.btnMenuSound = document.getElementById('btnMenuSound');
      this.menuSoundIcon = document.getElementById('menuSoundIcon');
      this.btnSettings = document.getElementById('btnSettings');
      this.mascotBox = document.getElementById('mascotBox');

      this.btnCloseHowTo = document.getElementById('btnCloseHowTo');
      this.btnGotIt = document.getElementById('btnGotIt');
      this.btnCloseSettings = document.getElementById('btnCloseSettings');
      this.btnResetScore = document.getElementById('btnResetScore');
      this.toggleMusic = document.getElementById('toggleMusic');
      this.toggleSfx = document.getElementById('toggleSfx');
      this.btnPlayAgain = document.getElementById('btnPlayAgain');
      this.btnMenuFromOver = document.getElementById('btnMenuFromOver');
      this.btnCancelHome = document.getElementById('btnCancelHome');
      this.btnConfirmHome = document.getElementById('btnConfirmHome');

      this.overScore = document.getElementById('overScore');
      this.overPresents = document.getElementById('overPresents');
      this.overStreak = document.getElementById('overStreak');
      this.overBest = document.getElementById('overBest');

      this.sound = new SoundManager();
      this.roomBg = new RoomBackground(this.bgCanvas);
      this.snow = new SnowEngine(this.snowCanvas);
      this.fx = new ParticleEngine(this.fxCanvas);

      this.state = 'MENU';
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
      this.roomBg.resize(w, h);
      this.snow.resize(w, h);
      this.fx.resize(w, h);
      this.gameCanvas.width = w;
      this.gameCanvas.height = h;
    }

    initEvents() {
      window.addEventListener('resize', () => this.resize());

      this.btnPlay.addEventListener('click', () => {
        this.startGame();
      });

      if (this.mascotBox) {
        this.mascotBox.addEventListener('click', () => {
          this.sound.playChime(3);
          const rect = this.mascotBox.getBoundingClientRect();
          this.fx.spawnPaperRip(rect.left + rect.width / 2, rect.top + rect.height / 2, WRAP_PATTERNS[0]);
        });
      }

      this.btnHome.addEventListener('click', () => {
        if (this.state === 'PLAYING') {
          this.showModal(this.homeModal);
        }
      });

      const handleSoundToggle = () => {
        const unmuted = this.sound.toggleMasterMute();
        const icon = unmuted ? '🔊' : '🔇';
        if (this.soundIcon) this.soundIcon.textContent = icon;
        if (this.menuSoundIcon) this.menuSoundIcon.textContent = icon;
      };

      this.btnSound.addEventListener('click', handleSoundToggle);
      if (this.btnMenuSound) {
        this.btnMenuSound.addEventListener('click', handleSoundToggle);
      }

      if (this.btnRestart) {
        this.btnRestart.addEventListener('click', () => {
          if (this.state === 'PLAYING') {
            this.startGame();
          }
        });
      }

      this.btnFullscreen.addEventListener('click', () => {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {});
        } else {
          document.exitFullscreen().catch(() => {});
        }
      });

      this.btnHowTo.addEventListener('click', () => this.showModal(this.howToModal));
      this.btnCloseHowTo.addEventListener('click', () => this.hideModal(this.howToModal));
      this.btnGotIt.addEventListener('click', () => this.hideModal(this.howToModal));

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

      this.btnCancelHome.addEventListener('click', () => this.hideModal(this.homeModal));
      this.btnConfirmHome.addEventListener('click', () => {
        this.hideModal(this.homeModal);
        this.returnToMenu();
      });

      this.btnPlayAgain.addEventListener('click', () => {
        this.hideModal(this.gameOverModal);
        this.startGame();
      });

      this.btnMenuFromOver.addEventListener('click', () => {
        this.hideModal(this.gameOverModal);
        this.returnToMenu();
      });

      this.gameCanvas.addEventListener('pointerdown', (e) => this.handlePointerDown(e));
      this.gameCanvas.addEventListener('pointermove', (e) => this.handlePointerMove(e));
    }

    handlePointerMove(e) {
      if (this.state !== 'PLAYING') return;

      const rect = this.gameCanvas.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;

      let hoveredAny = false;
      for (let i = this.presents.length - 1; i >= 0; i--) {
        const p = this.presents[i];
        if (!p.isUnwrapped && !hoveredAny && p.containsPoint(px, py, this.ctx)) {
          p.isHovered = true;
          hoveredAny = true;
        } else {
          p.isHovered = false;
        }
      }

      this.gameCanvas.style.cursor = hoveredAny ? 'pointer' : 'default';
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
      this.renderMenuTargetPreview();
    }

    setupNextRound() {
      this.isAdvancingRound = false;

      // 1. Pick a random target item
      const itemPool = [...ITEMS];
      const targetItem = itemPool[Math.floor(Math.random() * itemPool.length)];
      this.roundTargetItem = targetItem;

      // 2. Render Target Preview in HUD Spotlight
      this.renderTargetPreview(targetItem);

      // 3. Assemble Items for the Present Pile
      const pileCount = Math.min(6 + Math.floor(this.presentsFound / 2), 12);
      const chosenItems = [targetItem];

      // NITROME DECOY PAIR: Always include the trick counterpart decoy!
      if (targetItem.counterpart) {
        const decoy = ITEMS.find((i) => i.id === targetItem.counterpart);
        if (decoy) chosenItems.push(decoy);
      }

      while (chosenItems.length < pileCount) {
        const rand = itemPool[Math.floor(Math.random() * itemPool.length)];
        chosenItems.push(rand);
      }

      // Shuffle
      for (let i = chosenItems.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [chosenItems[i], chosenItems[j]] = [chosenItems[j], chosenItems[i]];
      }

      // 4. Position presents in a well-spaced, layered holiday pile centered on the rug
      const w = this.gameCanvas.width;
      const h = this.gameCanvas.height;
      const centerX = w / 2;
      const centerY = h * 0.72; // Directly inside the plush holiday rug!

      const spreadX = Math.min(w * 0.32, 340);
      const spreadY = Math.min(h * 0.17, 125);

      this.presents = [];

      // Generate well-distributed positions across the rug ellipse
      const placedPositions = [];
      const minDistance = 75; // minimum separation between present centers

      for (let i = 0; i < pileCount; i++) {
        const it = chosenItems[i];
        let bestPx = centerX, bestPy = centerY;
        let attempts = 0;

        while (attempts < 50) {
          // Angle distributed evenly with slight jitter
          const angle = (i / pileCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.6;
          // Radius between 0.2 and 0.88 of spread
          const dist = 0.25 + Math.random() * 0.65;
          const px = centerX + Math.cos(angle) * (spreadX * dist);
          const py = centerY + Math.sin(angle) * (spreadY * dist);

          let tooClose = false;
          for (const pos of placedPositions) {
            const dx = px - pos.x;
            const dy = (py - pos.y) * 1.5; // weight vertical distance
            if (Math.sqrt(dx * dx + dy * dy) < minDistance) {
              tooClose = true;
              break;
            }
          }

          if (!tooClose || attempts === 49) {
            bestPx = px;
            bestPy = py;
            break;
          }
          attempts++;
        }

        placedPositions.push({ x: bestPx, y: bestPy });
        const rot = (Math.random() - 0.5) * 0.32;
        const scale = Math.random() * 0.12 + 1.14;

        const present = new Present(it, bestPx, bestPy, scale, rot);
        present.zIndex = i;
        this.presents.push(present);
      }

      // Sort z-index by Y coordinate so front gifts naturally overlap back gifts
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

      this.targetCard.classList.remove('pulse');
      void this.targetCard.offsetWidth;
      this.targetCard.classList.add('pulse');
    }

    renderMenuTargetPreview() {
      const defaultItem = ITEMS[0];
      this.renderTargetPreview(defaultItem);
    }

    handlePointerDown(e) {
      if (this.state !== 'PLAYING' || this.isAdvancingRound) return;

      const rect = this.gameCanvas.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;

      let clickedPresent = null;
      for (let i = this.presents.length - 1; i >= 0; i--) {
        const p = this.presents[i];
        if (!p.isUnwrapped && p.containsPoint(px, py, this.ctx)) {
          clickedPresent = p;
          break;
        }
      }

      if (!clickedPresent) return;

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

      const timeBonus = 5.0;
      this.timeRemaining = Math.min(this.timeRemaining + timeBonus, 60.0);
      const points = 100 * this.streak;
      this.score += points;

      this.streak++;
      if (this.streak > this.bestStreak) this.bestStreak = this.streak;

      this.fx.spawnPaperRip(present.x, present.y, present.wrapStyle);
      this.fx.addFloatingText(present.x, present.y - 32, `+${timeBonus}s`, '#22c55e');
      this.fx.addFloatingText(present.x, present.y + 12, `+${points}`, '#facc15');

      this.showToast(`+${timeBonus}s BONUS! +${points} PTS!`);
      this.updateHud();

      setTimeout(() => {
        if (this.state === 'PLAYING') {
          this.setupNextRound();
        }
      }, 420);
    }

    handleWrongPresent(present) {
      this.sound.playBuzzer();
      present.triggerWobble();

      const timePenalty = 3.0;
      this.timeRemaining = Math.max(0, this.timeRemaining - timePenalty);
      this.streak = 1;

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
      const t = Math.max(0, Math.ceil(this.timeRemaining));
      this.timerText.textContent = `${t}s`;
      if (this.timeRemaining <= 5.0) {
        this.timerBadge.classList.add('warning');
      } else {
        this.timerBadge.classList.remove('warning');
      }

      this.scoreText.textContent = this.score.toLocaleString();

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

    loop(timestamp) {
      const dt = Math.min((timestamp - this.lastTimestamp) / 1000, 0.1);
      this.lastTimestamp = timestamp;

      this.roomBg.draw(timestamp);

      this.snow.update(dt);
      this.fx.update(dt);

      if (this.state === 'PLAYING') {
        this.timeRemaining -= dt;

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

      this.render();

      requestAnimationFrame(this.loop.bind(this));
    }

    render() {
      const w = this.gameCanvas.width;
      const h = this.gameCanvas.height;

      this.snow.draw();

      this.ctx.clearRect(0, 0, w, h);
      if (this.state === 'PLAYING' || this.state === 'PAUSED') {
        for (const p of this.presents) {
          p.draw(this.ctx);
        }
      }

      this.fx.draw();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new GiftWrappedGame());
  } else {
    new GiftWrappedGame();
  }
})();
