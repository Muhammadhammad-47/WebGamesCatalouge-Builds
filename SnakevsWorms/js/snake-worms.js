/* ==========================================================================
   SNAKE VS WORMS - COMPLETE ARCADE & BATTLE ROYALE ENGINE
   Faithful Poki / CrioDev recreation with Arena, Royale & Infinity Modes
   ========================================================================== */

(function () {
  'use strict';

  // =========================================================================
  // 1. WEB AUDIO SYNTHESIZER ENGINE
  // =========================================================================
  class SoundEngine {
    constructor() {
      this.ctx = null;
      this.isMuted = localStorage.getItem('svw_muted') === 'true';
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

    playEat() {
      if (this.isMuted) return;
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(420 + Math.random() * 220, now);
      osc.frequency.exponentialRampToValueAtTime(860, now + 0.07);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.08);
    }

    playPowerup() {
      if (this.isMuted) return;
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const notes = [440, 554, 659, 880];
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const t = now + idx * 0.06;
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0.15, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.13);
      });
    }

    playExplosion() {
      if (this.isMuted) return;
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      // White noise buffer burst
      const bufferSize = this.ctx.sampleRate * 0.35;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(700, now);
      filter.frequency.exponentialRampToValueAtTime(80, now + 0.35);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      whiteNoise.start(now);
    }

    playDeath() {
      if (this.isMuted) return;
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(60, now + 0.45);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.45);
    }

    playWheelTick() {
      if (this.isMuted) return;
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(900, now);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.03);
    }

    playFanfare() {
      if (this.isMuted) return;
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const chords = [523.25, 659.25, 783.99, 1046.50];
      chords.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const t = now + idx * 0.08;
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0.22, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.55);
      });
    }

    toggleMute() {
      this.isMuted = !this.isMuted;
      localStorage.setItem('svw_muted', this.isMuted.toString());
      return this.isMuted;
    }
  }

  // =========================================================================
  // 2. SKINS, THEMES & CONSTANTS
  // =========================================================================
  const SKINS_CATALOGUE = [
    { id: 'classic', name: 'Classic Viper', price: 0, primary: '#22c55e', secondary: '#86efac', pattern: 'stripes', eyes: 'cute', hat: 'none' },
    { id: 'reddy', name: 'Reddy Flame', price: 150, primary: '#ef4444', secondary: '#facc15', pattern: 'dots', eyes: 'angry', hat: 'horns' },
    { id: 'ocean', name: 'Ocean Aqua', price: 200, primary: '#0ea5e9', secondary: '#38bdf8', pattern: 'rings', eyes: 'cool', hat: 'none' },
    { id: 'neon', name: 'Electric Cyber', price: 300, primary: '#a855f7', secondary: '#38bdf8', pattern: 'stripes', eyes: 'cool', hat: 'none' },
    { id: 'rainbow', name: 'Rainbow Swirl', price: 350, primary: '#ec4899', secondary: '#facc15', pattern: 'rainbow', eyes: 'anime', hat: 'crown' },
    { id: 'ninja', name: 'Shadow Ninja', price: 400, primary: '#1e293b', secondary: '#ef4444', pattern: 'solid', eyes: 'angry', hat: 'ninja' },
    { id: 'tiger', name: 'Tiger Beast', price: 450, primary: '#f97316', secondary: '#0f172a', pattern: 'stripes', eyes: 'angry', hat: 'none' },
    { id: 'candy', name: 'Sweet Candy', price: 500, primary: '#f43f5e', secondary: '#ffffff', pattern: 'rings', eyes: 'cute', hat: 'none' },
    { id: 'dragon', name: 'Imperial Dragon', price: 650, primary: '#eab308', secondary: '#dc2626', pattern: 'scales', eyes: 'angry', hat: 'horns' },
    { id: 'mecha', name: 'Cyber Mecha', price: 750, primary: '#64748b', secondary: '#38bdf8', pattern: 'dots', eyes: 'cool', hat: 'none' },
    { id: 'skeleton', name: 'Bone Skeleton', price: 850, primary: '#e2e8f0', secondary: '#475569', pattern: 'rings', eyes: 'cool', hat: 'none' },
    { id: 'gold', name: '24K Golden VIP', price: 1200, primary: '#facc15', secondary: '#713f12', pattern: 'scales', eyes: 'cool', hat: 'crown' }
  ];

  const BACKGROUND_THEMES = [
    { id: 'hex', name: 'Dark Sci-Fi Hex', price: 0, bg: '#090d16', grid: '#1e293b', style: 'hex' },
    { id: 'forest', name: 'Emerald Forest', price: 200, bg: '#052e16', grid: '#14532d', style: 'grid' },
    { id: 'space', name: 'Deep Space Nebula', price: 350, bg: '#030712', grid: '#312e81', style: 'stars' },
    { id: 'candy', name: 'Candy Wonderland', price: 400, bg: '#4c0519', grid: '#831843', style: 'checker' },
    { id: 'volcano', name: 'Molten Obsidian', price: 500, bg: '#1c1917', grid: '#7f1d1d', style: 'magma' }
  ];

  const BOT_NAMES = [
    'SlitherKing', 'Worminator', 'ApexViper', 'SpeedyBooster', 'ShadowCobra', 'MegaAnaconda',
    'NeonSerpent', 'ToxicFang', 'GhostWorm', 'BiteMe', 'DragonTail', 'BlazeStriker',
    'SnakyPoki', 'VenomBite', 'ChompMaster', 'GigaWorm', 'SlitherBot_X', 'PixelSnake',
    'CoilCrusher', 'HydroWorm', 'TurboStrike', 'PhantomCoil', 'VortexSnake', 'TitanBoa',
    'FrostBite', 'InfernoScale', 'SwiftCrawler', 'QuantumWorm', 'HyperSlither', 'ChaosReptile'
  ];

  const FOOD_TYPES = [
    // Fresh Delicious Fruits
    { name: 'apple', category: 'fruit', emoji: '🍎', mass: 1.5, r: 12 },
    { name: 'strawberry', category: 'fruit', emoji: '🍓', mass: 1.8, r: 12 },
    { name: 'banana', category: 'fruit', emoji: '🍌', mass: 2.0, r: 13 },
    { name: 'watermelon', category: 'fruit', emoji: '🍉', mass: 3.5, r: 15 },
    { name: 'grapes', category: 'fruit', emoji: '🍇', mass: 2.2, r: 13 },
    { name: 'orange', category: 'fruit', emoji: '🍊', mass: 1.8, r: 12 },
    // Crispy & Cheesy Fast Food
    { name: 'burger', category: 'fastfood', emoji: '🍔', mass: 3.2, r: 14 },
    { name: 'pizza', category: 'fastfood', emoji: '🍕', mass: 2.8, r: 13 },
    { name: 'donut', category: 'fastfood', emoji: '🍩', mass: 2.5, r: 13 },
    { name: 'fries', category: 'fastfood', emoji: '🍟', mass: 2.6, r: 13 },
    { name: 'hotdog', category: 'fastfood', emoji: '🌭', mass: 3.0, r: 14 },
    { name: 'cupcake', category: 'fastfood', emoji: '🧁', mass: 2.4, r: 12 },
    // Special Star
    { name: 'star', category: 'special', emoji: '⭐', mass: 4.5, r: 15 }
  ];

  const POWERUP_TYPES = [
    { id: 'magnet', name: 'Food Magnet', emoji: '🧲', color: '#ec4899', duration: 10 },
    { id: 'boost', name: 'Free Turbo', emoji: '⚡', color: '#f59e0b', duration: 8 },
    { id: 'zoom', name: 'Eagle Eye Zoom', emoji: '👁️', color: '#38bdf8', duration: 12 },
    { id: 'multiplier', name: '2X Score', emoji: '✨', color: '#a855f7', duration: 10 }
  ];

  const CAMPAIGN_LEVELS = [
    { level: 1, title: "Fruit Feeder", desc: "Eat Fruits & Snacks to Reach 45 Mass", type: "mass", target: 45, bots: 3, arenaR: 1400, rewardCoins: 100, timePar: 35 },
    { level: 2, title: "Fast Food Feast", desc: "Eat 15 Food Snacks to Reach 70 Mass", type: "food", target: 15, targetMass: 70, bots: 4, arenaR: 1500, rewardCoins: 120, timePar: 40 },
    { level: 3, title: "Snake Evasion", desc: "Grow to 95 Mass while dodging 5 Rivals", type: "mass", target: 95, bots: 5, arenaR: 1600, rewardCoins: 150, timePar: 45 },
    { level: 4, title: "Turbo Rush", desc: "Reach 120 Mass & Boost for 5s (Space/Click)", type: "mass_and_boost", targetMass: 120, targetBoost: 5, bots: 6, arenaR: 1700, rewardCoins: 180, timePar: 50 },
    { level: 5, title: "Magnet Master", desc: "Collect 2 Magnet Orbs & Reach 150 Mass", type: "collect_powerup", powerup: "magnet", target: 2, targetMass: 150, bots: 7, arenaR: 1800, rewardCoins: 200, timePar: 55 },
    { level: 6, title: "Leaderboard Climb", desc: "Reach Top 5 on Leaderboard & 190 Mass", type: "rank_and_mass", targetRank: 5, targetMass: 190, bots: 8, arenaR: 1900, rewardCoins: 240, timePar: 60 },
    { level: 7, title: "Coil Crusher", desc: "Trap 2 Rivals (2 Kills) & Reach 230 Mass", type: "kills_and_mass", targetKills: 2, targetMass: 230, bots: 10, arenaR: 2000, rewardCoins: 280, timePar: 65 },
    { level: 8, title: "Apex Predator", desc: "Reach Rank #1 on Leaderboard & 270 Mass", type: "rank", target: 1, targetMass: 270, bots: 12, arenaR: 2100, rewardCoins: 350, timePar: 70 },
    { level: 9, title: "Mythic Dragon King", desc: "Defeat 3 Worms & Reach 340 Mass (Final Stage)", type: "mass_and_kills", targetMass: 340, targetKills: 3, bots: 14, isFinal: true, arenaR: 2200, rewardCoins: 1000, timePar: 90 }
  ];

  // =========================================================================
  // 3. SNAKE KINEMATIC RIGID BODY ENTITY
  // =========================================================================
  class Snake {
    constructor(id, name, x, y, skin, isPlayer = false) {
      this.id = id;
      this.name = name;
      this.isPlayer = isPlayer;
      this.skin = skin;

      // Position & Angle
      this.x = x;
      this.y = y;
      this.angle = Math.random() * Math.PI * 2;
      this.targetAngle = this.angle;
      this.turnSpeed = 4.2;

      // Mass & Speed
      this.mass = 20;
      this.score = 0;
      this.kills = 0;
      this.speed = 190;
      this.boostSpeed = 345;
      this.isBoosting = false;
      this.boostShedTimer = 0;
      this.spawnImmunity = 3.0; // 3 seconds spawn protection

      // Segments array: [{ x, y }]
      this.segments = [];
      const initLength = 16;
      for (let i = 0; i < initLength; i++) {
        this.segments.push({
          x: x - Math.cos(this.angle) * i * 14,
          y: y - Math.sin(this.angle) * i * 14
        });
      }

      this.isDead = false;
      this.deadTimer = 0;

      // Eye animation
      this.blinkTimer = Math.random() * 3 + 2;
      this.isBlinking = false;
      this.tongueTimer = 0;

      // Active power-ups: { magnet: time, freeBoost: time, doublePoints: time }
      this.powerups = {};
    }

    getRadius() {
      return Math.min(34, 13 + Math.sqrt(this.mass) * 0.42);
    }

    getSegmentCount() {
      return Math.max(12, Math.floor(10 + this.mass * 0.65));
    }

    update(dt, arenaRadius, isBattleRoyale, stormRadius) {
      if (this.isDead) return;
      if (this.spawnImmunity > 0) this.spawnImmunity -= dt;

      // 1. Process active power-ups timers
      for (const key in this.powerups) {
        if (this.powerups[key] > 0) {
          this.powerups[key] -= dt;
          if (this.powerups[key] <= 0) delete this.powerups[key];
        }
      }

      // 2. Determine Speed & Boosting
      const hasFreeBoost = !!(this.powerups.boost || this.powerups.freeBoost);
      let curSpeed = this.speed;
      if ((this.isBoosting || hasFreeBoost) && (this.mass > 12 || hasFreeBoost)) {
        curSpeed = this.boostSpeed;
        if (!hasFreeBoost) {
          this.boostShedTimer += dt;
          if (this.boostShedTimer >= 0.14) {
            this.boostShedTimer = 0;
            this.mass = Math.max(10, this.mass - 0.7);
            // Shed food dropped from tail
            if (this.segments.length > 0 && window.game) {
              const tail = this.segments[this.segments.length - 1];
              window.game.spawnRemnant(tail.x, tail.y, 1.2, this.skin.primary);
            }
          }
        }
      } else {
        this.isBoosting = false;
      }

      // 3. Smooth Angular Rotation
      let diff = this.targetAngle - this.angle;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      const turnRate = this.isPlayer ? 7.5 : this.turnSpeed;
      this.angle += Math.max(-turnRate * dt, Math.min(turnRate * dt, diff * 12 * dt));

      // 4. Move Head
      this.x += Math.cos(this.angle) * curSpeed * dt;
      this.y += Math.sin(this.angle) * curSpeed * dt;

      // 5. Constrain Segments Kinematics
      const spacing = 13;
      let prevX = this.x;
      let prevY = this.y;

      for (let i = 0; i < this.segments.length; i++) {
        const seg = this.segments[i];
        const dx = seg.x - prevX;
        const dy = seg.y - prevY;
        const dist = Math.hypot(dx, dy) || 0.001;
        if (dist > spacing) {
          seg.x = prevX + (dx / dist) * spacing;
          seg.y = prevY + (dy / dist) * spacing;
        }
        prevX = seg.x;
        prevY = seg.y;
      }

      // Adjust segment count to match mass
      const targetSegs = this.getSegmentCount();
      while (this.segments.length < targetSegs) {
        const last = this.segments[this.segments.length - 1] || { x: this.x, y: this.y };
        this.segments.push({ x: last.x, y: last.y });
      }
      while (this.segments.length > targetSegs) {
        this.segments.pop();
      }

      // 6. Eye Blink & Tongue animation
      this.blinkTimer -= dt;
      if (this.blinkTimer <= 0) {
        this.isBlinking = true;
        if (this.blinkTimer <= -0.15) {
          this.isBlinking = false;
          this.blinkTimer = Math.random() * 4 + 2;
        }
      }
      this.tongueTimer += dt;

      // 7. Check Battle Royale Storm Hazard
      if (isBattleRoyale) {
        const distFromCenter = Math.hypot(this.x, this.y);
        if (distFromCenter > stormRadius) {
          // Inside storm danger zone! Take damage
          this.mass -= dt * 7;
          if (this.mass <= 8) {
            this.triggerDeath();
          }
        }
      }
    }

    triggerDeath() {
      if (this.isDead) return;
      this.isDead = true;
      if (window.game) {
        window.game.handleSnakeDeath(this);
      }
    }

    draw(ctx, camera) {
      if (this.isDead) return;

      const r = this.getRadius();
      const segs = this.segments;
      if (segs.length === 0) return;

      // 1. Draw Body Segments (From tail to head for proper 3D stacking)
      for (let i = segs.length - 1; i >= 0; i--) {
        const seg = segs[i];
        const screenX = seg.x - camera.x;
        const screenY = seg.y - camera.y;

        // Viewport culling
        if (screenX < -60 || screenX > camera.w + 60 || screenY < -60 || screenY > camera.h + 60) {
          continue;
        }

        // Taper tail towards the end
        const taper = Math.max(0.45, Math.min(1.0, (i + 4) / segs.length));
        const segRadius = r * taper;

        // Drop shadow for depth
        ctx.save();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
        ctx.shadowBlur = 8;
        ctx.shadowOffsetY = 3;

        // Outer Dark Outline
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(screenX, screenY, segRadius + 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Base Segment Color
        let fillColor = this.skin.primary;
        if (this.skin.pattern === 'stripes' && i % 3 === 0) {
          fillColor = this.skin.secondary;
        } else if (this.skin.pattern === 'rings' && i % 2 === 0) {
          fillColor = this.skin.secondary;
        } else if (this.skin.pattern === 'rainbow') {
          const hue = (i * 12 + performance.now() * 0.1) % 360;
          fillColor = `hsl(${hue}, 85%, 60%)`;
        }

        ctx.fillStyle = fillColor;
        ctx.beginPath();
        ctx.arc(screenX, screenY, segRadius, 0, Math.PI * 2);
        ctx.fill();

        // Pattern Accents (Dots or Scales)
        if (this.skin.pattern === 'dots' && i % 2 === 0) {
          ctx.fillStyle = this.skin.secondary;
          ctx.beginPath();
          ctx.arc(screenX, screenY, segRadius * 0.45, 0, Math.PI * 2);
          ctx.fill();
        } else if (this.skin.pattern === 'scales') {
          ctx.strokeStyle = this.skin.secondary;
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.arc(screenX, screenY, segRadius * 0.65, 0, Math.PI);
          ctx.stroke();
        }

        // Metallic Gloss Highlight on top of each segment
        ctx.fillStyle = 'rgba(255, 255, 255, 0.28)';
        ctx.beginPath();
        ctx.ellipse(screenX - segRadius * 0.28, screenY - segRadius * 0.3, segRadius * 0.45, segRadius * 0.25, -Math.PI / 4, 0, Math.PI * 2);
        ctx.fill();
      }

      // 2. Draw Snake Head
      const hx = this.x - camera.x;
      const hy = this.y - camera.y;

      ctx.save();
      ctx.translate(hx, hy);
      ctx.rotate(this.angle);

      // Flicking Tongue
      const tongueLen = Math.max(0, Math.sin(this.tongueTimer * 7) * (r * 0.8));
      if (tongueLen > 4) {
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(r, 0);
        ctx.lineTo(r + tongueLen, 0);
        ctx.lineTo(r + tongueLen + 5, -3.5);
        ctx.moveTo(r + tongueLen, 0);
        ctx.lineTo(r + tongueLen + 5, 3.5);
        ctx.stroke();
      }

      // Head Outline & Base
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(0, 0, r + 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = this.skin.primary;
      ctx.beginPath();
      ctx.arc(0, 0, r + 0.5, 0, Math.PI * 2);
      ctx.fill();

      // Big Expressive Googly Eyes
      const eyeR = r * 0.46;
      const eyeOffsetX = r * 0.28;
      const eyeOffsetY = r * 0.55;

      [-eyeOffsetY, eyeOffsetY].forEach(ey => {
        // Eye White
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(eyeOffsetX, ey, eyeR, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 1.8;
        ctx.stroke();

        if (!this.isBlinking) {
          // Pupils looking dynamically forward / toward target
          ctx.fillStyle = '#0f172a';
          ctx.beginPath();
          ctx.arc(eyeOffsetX + eyeR * 0.35, ey, eyeR * 0.55, 0, Math.PI * 2);
          ctx.fill();

          // Cute white sparkle
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(eyeOffsetX + eyeR * 0.25, ey - eyeR * 0.2, eyeR * 0.22, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Closed blink slit
          ctx.strokeStyle = '#0f172a';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(eyeOffsetX - eyeR * 0.8, ey);
          ctx.lineTo(eyeOffsetX + eyeR * 0.8, ey);
          ctx.stroke();
        }
      });

      // Head Accessory / Hat
      this.drawHeadwear(ctx, r);

      ctx.restore();

      // 3. Floating Name & Mass Tag
      ctx.save();
      ctx.font = '800 11.5px "Fredoka", sans-serif';
      ctx.textAlign = 'center';
      const labelText = `${this.name} (${Math.round(this.mass)})`;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
      ctx.fillRect(hx - 48, hy - r - 20, 96, 17);
      ctx.fillStyle = this.isPlayer ? '#facc15' : '#ffffff';
      ctx.fillText(labelText, hx, hy - r - 7);
      ctx.restore();
    }

    drawHeadwear(ctx, r) {
      if (!this.skin.hat || this.skin.hat === 'none') return;

      if (this.skin.hat === 'crown') {
        // Golden King Crown
        ctx.fillStyle = '#facc15';
        ctx.strokeStyle = '#ca8a04';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(-r * 0.6, -r * 0.5);
        ctx.lineTo(-r * 0.6, -r * 1.2);
        ctx.lineTo(-r * 0.2, -r * 0.8);
        ctx.lineTo(0, -r * 1.3);
        ctx.lineTo(r * 0.2, -r * 0.8);
        ctx.lineTo(r * 0.6, -r * 1.2);
        ctx.lineTo(r * 0.6, -r * 0.5);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else if (this.skin.hat === 'ninja') {
        // Crimson Ninja Headband
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(-r * 0.8, -r * 0.35, r * 1.6, 7);
        // Ribbon ties behind head
        ctx.beginPath();
        ctx.moveTo(-r * 0.8, -r * 0.2);
        ctx.lineTo(-r * 1.3, -r * 0.6);
        ctx.lineTo(-r * 1.2, 0);
        ctx.fill();
      } else if (this.skin.hat === 'horns') {
        // Devil Horns
        ctx.fillStyle = '#ef4444';
        ctx.strokeStyle = '#7f1d1d';
        ctx.lineWidth = 1.5;
        [-r * 0.6, r * 0.6].forEach(hx => {
          ctx.beginPath();
          ctx.moveTo(hx - 4, -r * 0.3);
          ctx.quadraticCurveTo(hx * 1.4, -r * 1.2, hx * 1.3, -r * 1.4);
          ctx.lineTo(hx + 4, -r * 0.3);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        });
      } else if (this.skin.hat === 'cap') {
        // Baseball Cap
        ctx.fillStyle = '#0284c7';
        ctx.beginPath();
        ctx.arc(0, -r * 0.2, r * 0.85, Math.PI, 0);
        ctx.fill();
        // Visor brim
        ctx.fillRect(0, -r * 0.2, r * 1.1, 4.5);
      }
    }
  }

  // =========================================================================
  // 4. AI BOT CONTROLLER
  // =========================================================================
  class BotBrain {
    constructor(snake) {
      this.snake = snake;
      this.decisionTimer = 0;
      this.personality = ['hunter', 'scavenger', 'cautious', 'wanderer'][Math.floor(Math.random() * 4)];
      this.boostCooldown = Math.random() * 5 + 3;
    }

    update(dt, foods, snakes, arenaRadius) {
      this.decisionTimer -= dt;
      this.boostCooldown -= dt;

      if (this.decisionTimer <= 0) {
        this.decisionTimer = 0.2 + Math.random() * 0.25;
        this.makeDecision(foods, snakes, arenaRadius);
      }
    }

    makeDecision(foods, snakes, arenaRadius) {
      const s = this.snake;

      // 1. Boundary Avoidance (Highest priority)
      const distFromCenter = Math.hypot(s.x, s.y);
      if (distFromCenter > arenaRadius - 320) {
        // Steer hard back towards arena center (0, 0)
        s.targetAngle = Math.atan2(-s.y, -s.x);
        s.isBoosting = false;
        return;
      }

      // 2. Obstacle & Body Collision Avoidance
      let closestDanger = null;
      let minDangerDist = 120 + s.getRadius();

      for (const other of snakes) {
        if (other.isDead || other === s) continue;
        for (let i = 0; i < other.segments.length; i += 2) {
          const seg = other.segments[i];
          const dist = Math.hypot(s.x - seg.x, s.y - seg.y);
          if (dist < minDangerDist) {
            minDangerDist = dist;
            closestDanger = seg;
          }
        }
      }

      if (closestDanger) {
        // Steer away perpendicularly from danger
        const awayAngle = Math.atan2(s.y - closestDanger.y, s.x - closestDanger.x);
        s.targetAngle = awayAngle;
        s.isBoosting = false;
        return;
      }

      // 3. Hunter Behavior: Target smaller snake to intercept
      if (this.personality === 'hunter' && s.mass > 35) {
        let bestTarget = null;
        let minHuntDist = 450;
        for (const other of snakes) {
          if (other.isDead || other === s) continue;
          if (other.mass < s.mass * 0.8) {
            const dist = Math.hypot(other.x - s.x, other.y - s.y);
            if (dist < minHuntDist) {
              minHuntDist = dist;
              bestTarget = other;
            }
          }
        }

        if (bestTarget) {
          // Intercept ahead of their trajectory
          const leadX = bestTarget.x + Math.cos(bestTarget.angle) * 80;
          const leadY = bestTarget.y + Math.sin(bestTarget.angle) * 80;
          s.targetAngle = Math.atan2(leadY - s.y, leadX - s.x);
          if (this.boostCooldown <= 0 && minHuntDist < 260) {
            s.isBoosting = true;
            this.boostCooldown = 4.0;
          }
          return;
        }
      }

      // 4. Food Seeking
      let nearestFood = null;
      let minFoodDist = 380;
      for (const f of foods) {
        const dist = Math.hypot(f.x - s.x, f.y - s.y);
        if (dist < minFoodDist) {
          minFoodDist = dist;
          nearestFood = f;
        }
      }

      if (nearestFood) {
        s.targetAngle = Math.atan2(nearestFood.y - s.y, nearestFood.x - s.x);
        // Boost if large remnant food cluster
        if (nearestFood.isRemnant && minFoodDist > 160 && s.mass > 30) {
          s.isBoosting = true;
        }
      } else {
        // Wander randomly
        s.targetAngle += (Math.random() - 0.5) * 0.6;
        s.isBoosting = false;
      }
    }
  }

  // =========================================================================
  // 5. MAIN SNAKE VS WORMS ENGINE
  // =========================================================================
  class SnakeVsWormsGame {
    constructor() {
      // DOM Elements
      this.canvas = document.getElementById('gameCanvas');
      this.ctx = this.canvas.getContext('2d');
      this.minimapCanvas = document.getElementById('minimapCanvas');
      this.minimapCtx = this.minimapCanvas.getContext('2d');

      // Screens & Modals
      this.menuScreen = document.getElementById('menuScreen');
      this.gameHud = document.getElementById('gameHud');
      this.leaderboardCard = document.getElementById('leaderboardCard');
      this.leaderboardList = document.getElementById('leaderboardList');
      this.minimapContainer = document.getElementById('minimapContainer');
      this.minimapCoords = document.getElementById('minimapCoords');
      this.stormWarning = document.getElementById('stormWarning');
      this.mobileTouchLayer = document.getElementById('mobileTouchLayer');

      // Modals
      this.shopModal = document.getElementById('shopModal');
      this.wheelModal = document.getElementById('wheelModal');
      this.customModal = document.getElementById('customModal');
      this.howToModal = document.getElementById('howToModal');
      this.gameOverModal = document.getElementById('gameOverModal');
      this.levelSelectModal = document.getElementById('levelSelectModal');
      this.levelCompleteModal = document.getElementById('levelCompleteModal');

      // HUD Badges & Trackers
      this.hudScore = document.getElementById('hudScore');
      this.hudRank = document.getElementById('hudRank');
      this.hudKills = document.getElementById('hudKills');
      this.hudModePill = document.getElementById('hudModePill');
      this.hudModeIcon = document.getElementById('hudModeIcon');
      this.hudModeText = document.getElementById('hudModeText');
      this.hudControlsBar = document.getElementById('hudControlsBar');
      this.goalToast = document.getElementById('goalToast');
      this.btnCloseGoalToast = document.getElementById('btnCloseGoalToast');
      this.levelHudTracker = document.getElementById('levelHudTracker');
      this.hudLevelTag = document.getElementById('hudLevelTag');
      this.hudLevelGoalName = document.getElementById('hudLevelGoalName');
      this.hudLevelNumVal = document.getElementById('hudLevelNumVal');
      this.hudLevelProgressBar = document.getElementById('hudLevelProgressBar');
      this.powerupsHud = document.getElementById('powerupsHud');
      this.toastTimer = null;

      // Systems
      this.sound = new SoundEngine();

      // State & Modes
      this.state = 'MENU'; // 'MENU' | 'PLAYING' | 'GAMEOVER'
      this.mode = 'levels'; // 'levels' | 'arena' | 'battleroyale' | 'infinity'
      this.currentLevel = parseInt(localStorage.getItem('svw_current_level') || '1', 10);
      this.levelProgress = JSON.parse(localStorage.getItem('svw_level_progress') || JSON.stringify({ unlocked: 1, stars: {} }));
      this.levelStats = { foodEaten: 0, boostTime: 0, powerupsCollected: 0, magnetCollected: 0, completed: false, startTime: 0 };
      this.arenaRadius = 2600;
      this.stormRadius = 2600;

      // Entities
      this.player = null;
      this.snakes = [];
      this.bots = [];
      this.foods = [];
      this.powerupItems = [];
      this.particles = [];

      // Camera
      this.camera = { x: 0, y: 0, w: window.innerWidth, h: window.innerHeight, zoom: 1 };
      this.cameraShake = 0;

      // User Economy & Inventory
      this.coins = parseInt(localStorage.getItem('svw_coins') || '250', 10);
      this.equippedSkinId = localStorage.getItem('svw_skin') || 'classic';
      this.equippedThemeId = localStorage.getItem('svw_theme') || 'hex';
      this.unlockedSkins = JSON.parse(localStorage.getItem('svw_unlocked_skins') || '["classic"]');
      this.unlockedThemes = JSON.parse(localStorage.getItem('svw_unlocked_themes') || '["hex"]');
      this.customSkin = JSON.parse(localStorage.getItem('svw_custom_skin') || JSON.stringify({
        primary: '#22c55e', secondary: '#facc15', pattern: 'stripes', eyes: 'cute', hat: 'none'
      }));

      // Input Map & Pointer Tracking
      this.mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2, isDown: false };
      this.mouseMoved = false;
      this.activeInput = 'keyboard';
      this.keys = {};

      // Init subsystems
      this.initEvents();
      this.initLevels();
      this.resize();
      this.updateCoinDisplays();
      this.initShop();
      this.initWheel();
      this.initCustomizer();

      // Main Loop
      this.lastTime = performance.now();
      requestAnimationFrame(this.loop.bind(this));
    }

    resize() {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
      this.camera.w = this.canvas.width;
      this.camera.h = this.canvas.height;
    }

    updateCoinDisplays() {
      const el1 = document.getElementById('menuCoinBalance');
      const el2 = document.getElementById('shopCoins');
      if (el1) el1.textContent = this.coins.toString();
      if (el2) el2.textContent = this.coins.toString();
      localStorage.setItem('svw_coins', this.coins.toString());
    }

    getActiveSkin() {
      if (this.equippedSkinId === 'custom') {
        return { id: 'custom', name: 'Custom Worm', ...this.customSkin };
      }
      return SKINS_CATALOGUE.find(s => s.id === this.equippedSkinId) || SKINS_CATALOGUE[0];
    }

    startNewGame() {
      this.sound.init();
      const nicknameInput = document.getElementById('inputNickname');
      const nickname = (nicknameInput && nicknameInput.value.trim()) || 'SlitherPro';

      const startBigger = document.getElementById('checkStartBigger')?.checked;
      const initialMass = startBigger ? 60 : 20;

      // Reset Entities & Stats
      this.snakes = [];
      this.bots = [];
      this.foods = [];
      this.powerupItems = [];
      this.particles = [];
      this.levelStats = { foodEaten: 0, boostTime: 0, powerupsCollected: 0, magnetCollected: 0, completed: false, startTime: performance.now() };

      this.arenaRadius = (this.mode === 'infinity') ? 99999 : (this.mode === 'levels' ? (CAMPAIGN_LEVELS[this.currentLevel - 1]?.arenaR || 1600) : 2600);
      this.stormRadius = this.arenaRadius;

      // Spawn Player
      this.player = new Snake('p1', nickname, 0, 0, this.getActiveSkin(), true);
      this.player.mass = initialMass;
      this.snakes.push(this.player);

      // Spawn AI Bots
      let botCount = 45;
      if (this.mode === 'infinity') botCount = 35;
      if (this.mode === 'levels') {
        const lvl = CAMPAIGN_LEVELS[this.currentLevel - 1] || CAMPAIGN_LEVELS[0];
        botCount = lvl.bots || Math.min(14, 3 + this.currentLevel);
      }

      for (let i = 0; i < botCount; i++) {
        this.spawnBot();
      }

      // Populate Initial Food (Clean, spacious, uncrowded)
      const foodCount = this.mode === 'infinity' ? 280 : (this.mode === 'levels' ? Math.min(200, 95 + this.currentLevel * 12) : 200);
      for (let i = 0; i < foodCount; i++) {
        this.spawnFood();
      }

      // Populate Floating Power-Ups
      for (let i = 0; i < 6; i++) {
        this.spawnPowerup();
      }

      // Update UI Mode Tag
      const modeData = {
        levels: { icon: '🎯', name: `LEVEL ${this.currentLevel}` },
        arena: { icon: '🏟️', name: 'ARENA' },
        battleroyale: { icon: '👑', name: 'BATTLE ROYALE' },
        infinity: { icon: '♾️', name: 'INFINITY' }
      }[this.mode] || { icon: '🎯', name: `LEVEL ${this.currentLevel}` };
      this.hudModeIcon.textContent = modeData.icon;
      this.hudModeText.textContent = modeData.name;

      // Configure Level Tracker HUD
      if (this.mode === 'levels') {
        const lvl = CAMPAIGN_LEVELS[this.currentLevel - 1] || CAMPAIGN_LEVELS[0];
        if (this.levelHudTracker) {
          this.levelHudTracker.classList.remove('hidden');
          if (this.hudLevelTag) this.hudLevelTag.textContent = `LVL ${lvl.level}`;
          if (this.hudLevelGoalName) this.hudLevelGoalName.textContent = lvl.desc;
          if (this.hudLevelProgressBar) this.hudLevelProgressBar.style.width = '0%';
        }
      } else {
        if (this.levelHudTracker) this.levelHudTracker.classList.add('hidden');
      }

      // Switch Screens
      this.menuScreen.classList.add('hidden');
      this.gameHud.classList.remove('hidden');
      this.leaderboardCard.classList.remove('hidden');
      this.minimapContainer.classList.remove('hidden');
      this.gameOverModal.classList.add('hidden');
      if (this.levelSelectModal) this.levelSelectModal.classList.add('hidden');
      if (this.levelCompleteModal) this.levelCompleteModal.classList.add('hidden');

      // Show In-Game HUD Controls Hint & Quick Goal Toast
      if (this.hudControlsBar) this.hudControlsBar.classList.remove('hidden');
      if (this.goalToast) {
        this.goalToast.classList.remove('hidden', 'fade-out');
        if (this.toastTimer) clearTimeout(this.toastTimer);
        this.toastTimer = setTimeout(() => {
          if (this.goalToast) this.goalToast.classList.add('fade-out');
        }, 5500);
      }

      // Check Mobile
      if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
        this.mobileTouchLayer.classList.remove('hidden');
      }

      this.gameStartTime = performance.now();
      this.state = 'PLAYING';
    }

    spawnPowerup() {
      const angle = Math.random() * Math.PI * 2;
      const dist = 120 + Math.random() * Math.max(200, this.arenaRadius - 300);
      const pType = POWERUP_TYPES[Math.floor(Math.random() * POWERUP_TYPES.length)];
      this.powerupItems.push({
        x: Math.cos(angle) * dist,
        y: Math.sin(angle) * dist,
        type: pType,
        bobPhase: Math.random() * Math.PI * 2
      });
    }

    spawnBot() {
      const angle = Math.random() * Math.PI * 2;
      const dist = 500 + Math.random() * Math.max(100, this.arenaRadius - 900);
      const x = Math.cos(angle) * dist;
      const y = Math.sin(angle) * dist;

      const randomSkin = SKINS_CATALOGUE[Math.floor(Math.random() * SKINS_CATALOGUE.length)];
      const randomName = BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)];

      const botSnake = new Snake('bot_' + Math.random().toString(36).substr(2, 6), randomName, x, y, randomSkin, false);
      botSnake.mass = Math.floor(Math.random() * 80 + 15);

      this.snakes.push(botSnake);
      this.bots.push(new BotBrain(botSnake));
    }

    spawnFood() {
      // Pick a spaced location to prevent dense clustering
      for (let attempt = 0; attempt < 6; attempt++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = 80 + Math.random() * Math.max(200, this.arenaRadius - 200);
        const x = Math.cos(angle) * dist;
        const y = Math.sin(angle) * dist;

        // Check distance to nearby foods to keep arena clean
        let tooClose = false;
        const checkCount = Math.min(30, this.foods.length);
        for (let i = 0; i < checkCount; i++) {
          const sample = this.foods[Math.floor(Math.random() * this.foods.length)];
          if (sample && Math.hypot(x - sample.x, y - sample.y) < 75) {
            tooClose = true;
            break;
          }
        }

        if (!tooClose || attempt === 5) {
          const fType = FOOD_TYPES[Math.floor(Math.random() * FOOD_TYPES.length)];
          this.foods.push({
            x,
            y,
            type: fType,
            isRemnant: false
          });
          break;
        }
      }
    }

    spawnRemnant(x, y, massValue, color) {
      this.foods.push({
        x: x + (Math.random() - 0.5) * 16,
        y: y + (Math.random() - 0.5) * 16,
        type: { name: 'remnant', emoji: '✨', mass: massValue, r: 12 },
        isRemnant: true,
        color: color || '#facc15'
      });
    }

    handleSnakeDeath(snake) {
      this.sound.playExplosion();

      // Drop food scatter from body segments (spaced every 4 segments to avoid clutter)
      for (let i = 0; i < snake.segments.length; i += 4) {
        const seg = snake.segments[i];
        this.spawnRemnant(seg.x, seg.y, 4.5, snake.skin.primary);
      }

      // Particle death burst
      for (let i = 0; i < 28; i++) {
        const ang = Math.random() * Math.PI * 2;
        const spd = Math.random() * 260 + 60;
        this.particles.push({
          x: snake.x,
          y: snake.y,
          vx: Math.cos(ang) * spd,
          vy: Math.sin(ang) * spd,
          r: Math.random() * 5 + 3,
          color: snake.skin.primary,
          alpha: 1.0,
          life: 0.6
        });
      }

      // Check if Player died
      if (snake.isPlayer) {
        this.sound.playDeath();
        this.state = 'GAMEOVER';
        this.cameraShake = 24;
        this.showGameOverModal(false);
      } else {
        // If an AI bot died in Arena/Infinity mode, respawn a replacement after delay
        if (this.mode !== 'battleroyale') {
          setTimeout(() => {
            if (this.state === 'PLAYING') this.spawnBot();
          }, 2500);
        } else {
          // Battle Royale: check if player is last survivor!
          const alive = this.snakes.filter(s => !s.isDead);
          if (alive.length === 1 && alive[0].isPlayer) {
            this.sound.playFanfare();
            this.state = 'GAMEOVER';
            this.showGameOverModal(true);
          }
        }
      }
    }

    showGameOverModal(isVictory = false) {
      const p = this.player;
      const elapsed = Math.floor((performance.now() - this.gameStartTime) / 1000);
      const mins = Math.floor(elapsed / 60);
      const secs = elapsed % 60;

      const earnedCoins = Math.floor(p.score * 0.1) + p.kills * 25 + (isVictory ? 200 : 0);
      this.coins += earnedCoins;
      this.updateCoinDisplays();

      document.getElementById('gameOverEmoji').textContent = isVictory ? '👑' : '💥';
      document.getElementById('gameOverTitle').textContent = isVictory ? 'VICTORY ROYALE!' : '💥 SNAKE DESTROYED!';
      document.getElementById('gameOverTitle').style.color = isVictory ? '#facc15' : '#ef4444';
      document.getElementById('gameOverSub').textContent = isVictory
        ? 'You outsmarted all rival worms and won the crown!'
        : (this.mode === 'levels'
            ? 'Aapka snake doosre snake se takra gaya! Game shuru se restart hogi.'
            : 'Your head crashed into an enemy worm!');

      const replayBtn = document.getElementById('btnGoReplay');
      if (replayBtn) {
        replayBtn.innerHTML = `<span>🔄</span> ${this.mode === 'levels' ? 'RESTART LEVEL' : 'PLAY AGAIN'}`;
      }
      const btnRestartLvl1 = document.getElementById('btnGoRestartLvl1');
      if (btnRestartLvl1) {
        btnRestartLvl1.style.display = (this.mode === 'levels') ? 'block' : 'none';
      }

      document.getElementById('goScore').textContent = Math.round(p.score).toString();
      document.getElementById('goLength').textContent = Math.round(p.mass).toString();
      document.getElementById('goKills').textContent = p.kills.toString();
      document.getElementById('goTime').textContent = `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
      document.getElementById('goRank').textContent = `#${this.calculatePlayerRank()}`;
      document.getElementById('goCoins').textContent = `+${earnedCoins} 🪙`;

      if (this.hudControlsBar) this.hudControlsBar.classList.add('hidden');
      if (this.goalToast) this.goalToast.classList.add('hidden');

      this.gameOverModal.classList.remove('hidden');
    }

    calculatePlayerRank() {
      if (!this.player) return 1;
      const sorted = [...this.snakes].filter(s => !s.isDead).sort((a, b) => b.mass - a.mass);
      const idx = sorted.findIndex(s => s === this.player);
      return idx >= 0 ? idx + 1 : sorted.length + 1;
    }

    loop(timestamp) {
      const dt = Math.min((timestamp - this.lastTime) / 1000, 0.05);
      this.lastTime = timestamp;

      if (this.state === 'PLAYING') {
        this.updateGame(dt);
      }

      this.render();
      requestAnimationFrame(this.loop.bind(this));
    }

    updateGame(dt) {
      const p = this.player;

      // 1. Update Player Target Angle from Keyboard or Mouse / Touch
      if (p && !p.isDead) {
        let keyX = 0;
        let keyY = 0;
        if (this.keys['ArrowUp'] || this.keys['KeyW']) keyY -= 1;
        if (this.keys['ArrowDown'] || this.keys['KeyS']) keyY += 1;
        if (this.keys['ArrowLeft'] || this.keys['KeyA']) keyX -= 1;
        if (this.keys['ArrowRight'] || this.keys['KeyD']) keyX += 1;

        if (keyX !== 0 || keyY !== 0) {
          // Direct 8-Way Responsive Keyboard Movement
          this.activeInput = 'keyboard';
          p.targetAngle = Math.atan2(keyY, keyX);
        } else if (this.activeInput === 'mouse' && this.mouseMoved) {
          const screenCenterX = this.canvas.width / 2;
          const screenCenterY = this.canvas.height / 2;
          const dx = this.mouse.x - screenCenterX;
          const dy = this.mouse.y - screenCenterY;
          if (Math.hypot(dx, dy) > 25) {
            p.targetAngle = Math.atan2(dy, dx);
          }
        }

        p.isBoosting = this.mouse.isDown || !!this.keys['Space'] || !!this.keys['ShiftLeft'] || !!this.keys['ShiftRight'] || !!this.keys['KeyJ'] || !!this.keys['KeyK'];
        if (p.isBoosting) {
          this.levelStats.boostTime += dt;
        }

        // Magnet Power-Up: Sucks nearby food towards player head
        if (p.powerups.magnet) {
          for (const f of this.foods) {
            const dx = p.x - f.x;
            const dy = p.y - f.y;
            const dist = Math.hypot(dx, dy);
            if (dist < 360 && dist > 5) {
              f.x += (dx / dist) * 440 * dt;
              f.y += (dy / dist) * 440 * dt;
            }
          }
        }
      }

      // 2. Battle Royale Storm Shrinkage
      if (this.mode === 'battleroyale') {
        this.stormRadius = Math.max(280, this.stormRadius - dt * 18);
        const pDist = Math.hypot(p.x, p.y);
        if (pDist > this.stormRadius) {
          this.stormWarning.classList.remove('hidden');
        } else {
          this.stormWarning.classList.add('hidden');
        }
      }

      // 3. Update AI Bots Brains
      for (let i = 0; i < this.bots.length; i++) {
        this.bots[i].update(dt, this.foods, this.snakes, this.arenaRadius);
      }

      // 4. Update All Snakes Physics
      for (const s of this.snakes) {
        s.update(dt, this.arenaRadius, this.mode === 'battleroyale', this.stormRadius);
      }

      // 5. Food Consumption Checks
      for (const s of this.snakes) {
        if (s.isDead) continue;
        const sr = s.getRadius();
        const eatRadius = sr + 14;
        const mult = s.powerups.multiplier ? 2 : 1;

        for (let i = this.foods.length - 1; i >= 0; i--) {
          const f = this.foods[i];
          const dist = Math.hypot(s.x - f.x, s.y - f.y);
          if (dist < eatRadius) {
            s.mass += f.type.mass * mult;
            s.score += f.type.mass * 10 * mult;
            if (s.isPlayer) {
              this.sound.playEat();
              this.levelStats.foodEaten += 1;
            }
            this.foods.splice(i, 1);

            // Replenish regular food in arena (Capped at clean 180 food items)
            const maxFood = this.mode === 'infinity' ? 260 : 180;
            if (!f.isRemnant && this.foods.length < maxFood) {
              this.spawnFood();
            }
          }
        }
      }

      // 5b. Power-Up Pickups Collection
      for (const s of this.snakes) {
        if (s.isDead) continue;
        const hr = s.getRadius();
        for (let i = this.powerupItems.length - 1; i >= 0; i--) {
          const pu = this.powerupItems[i];
          const dist = Math.hypot(s.x - pu.x, s.y - pu.y);
          if (dist < hr + 18) {
            s.powerups[pu.type.id] = pu.type.duration;
            if (s.isPlayer) {
              this.sound.playPowerup();
              this.levelStats.powerupsCollected += 1;
              if (pu.type.id === 'magnet') {
                this.levelStats.magnetCollected = (this.levelStats.magnetCollected || 0) + 1;
              }
            }
            this.powerupItems.splice(i, 1);
          }
        }
      }
      if (this.powerupItems.length < 6 && Math.random() < 0.02) {
        this.spawnPowerup();
      }

      // 6. Combat & Body Collision Checks
      for (const attacker of this.snakes) {
        if (attacker.isDead || attacker.spawnImmunity > 0) continue;

        // Arena boundary collision
        if (this.mode !== 'infinity') {
          const distCenter = Math.hypot(attacker.x, attacker.y);
          if (distCenter >= this.arenaRadius) {
            attacker.triggerDeath();
            continue;
          }
        }

        // Check head vs other snakes' heads and bodies
        const hr = attacker.getRadius();
        for (const target of this.snakes) {
          if (target === attacker || target.isDead || target.spawnImmunity > 0) continue;

          // 1. Head-to-Head Collision Check
          const headDist = Math.hypot(attacker.x - target.x, attacker.y - target.y);
          if (headDist < hr + target.getRadius() * 0.85) {
            if (attacker.isPlayer) {
              attacker.triggerDeath();
              target.kills += 1;
              target.score += 250;
              break;
            } else if (target.isPlayer) {
              attacker.triggerDeath();
              target.kills += 1;
              target.score += 250;
              break;
            } else {
              if (attacker.mass <= target.mass) {
                attacker.triggerDeath();
                target.kills += 1;
                break;
              }
            }
          }

          // 2. Check against target segments (i >= 1)
          let collided = false;
          for (let i = 1; i < target.segments.length; i++) {
            const seg = target.segments[i];
            const dist = Math.hypot(attacker.x - seg.x, attacker.y - seg.y);
            if (dist < hr + target.getRadius() * 0.75) {
              // Attacker crashed into target's body!
              attacker.triggerDeath();
              target.kills += 1;
              target.score += 250;
              collided = true;
              break;
            }
          }
          if (collided) break;
        }
      }

      // Clean dead bots
      this.snakes = this.snakes.filter(s => !s.isDead);
      this.bots = this.bots.filter(b => !b.snake.isDead);

      // 7. Update Particles
      for (let i = this.particles.length - 1; i >= 0; i--) {
        const pt = this.particles[i];
        pt.x += pt.vx * dt;
        pt.y += pt.vy * dt;
        pt.life -= dt;
        pt.alpha = Math.max(0, pt.life * 1.5);
        if (pt.life <= 0) this.particles.splice(i, 1);
      }

      // 8. Smooth Camera Tracking
      if (p) {
        let targetZoom = Math.max(0.68, 1.0 - (p.mass - 20) * 0.001);
        if (p.powerups.zoom) targetZoom = 0.54; // Eagle Eye Zoom
        this.camera.zoom += (targetZoom - this.camera.zoom) * 0.08;
        this.camera.x += (p.x - this.camera.x) * 0.12;
        this.camera.y += (p.y - this.camera.y) * 0.12;
      }

      // Camera Shake Effect on Destruction
      if (this.cameraShake > 0) {
        this.camera.x += (Math.random() - 0.5) * this.cameraShake;
        this.camera.y += (Math.random() - 0.5) * this.cameraShake;
        this.cameraShake *= 0.88;
        if (this.cameraShake < 0.5) this.cameraShake = 0;
      }

      // 9. Update In-Game HUD & Leaderboard
      this.updateHUD();
    }

    updateHUD() {
      if (!this.player) return;
      this.hudScore.textContent = Math.round(this.player.score).toString();
      this.hudKills.textContent = this.player.kills.toString();

      const rank = this.calculatePlayerRank();
      const totalAlive = this.snakes.filter(s => !s.isDead).length;
      this.hudRank.textContent = `#${rank} / ${totalAlive}`;

      // Update Leaderboard List (Top 10)
      const sorted = [...this.snakes].filter(s => !s.isDead).sort((a, b) => b.mass - a.mass).slice(0, 10);
      this.leaderboardList.innerHTML = '';
      sorted.forEach((snk, idx) => {
        const row = document.createElement('li');
        row.className = `lb-row ${snk.isPlayer ? 'player-row' : ''}`;
        row.innerHTML = `
          <span class="lb-rank">#${idx + 1}</span>
          <span class="lb-name">${snk.name}</span>
          <span class="lb-score">${Math.round(snk.mass)}</span>
        `;
        this.leaderboardList.appendChild(row);
      });

      // Update Power-Ups HUD Badges
      this.updatePowerupsHUD();

      // Update Campaign Level Tracker
      this.updateLevelTracker();

      // Update Minimap Coordinates
      this.minimapCoords.textContent = `${Math.round(this.player.x)}, ${Math.round(this.player.y)}`;
      this.renderMinimap();
    }

    render() {
      const w = this.canvas.width;
      const h = this.canvas.height;
      const ctx = this.ctx;

      ctx.clearRect(0, 0, w, h);

      if (this.state === 'PLAYING' || this.state === 'GAMEOVER') {
        ctx.save();
        // Camera translation & zoom centered at screen
        ctx.translate(w / 2, h / 2);
        ctx.scale(this.camera.zoom, this.camera.zoom);
        ctx.translate(-this.camera.x, -this.camera.y);

        // 1. Draw Background Theme
        this.drawBackground(ctx);

        // 2. Draw Battle Royale Storm Zone
        if (this.mode === 'battleroyale') {
          this.drawStormZone(ctx);
        }

        // 3. Draw Arena Boundary Barrier
        if (this.mode !== 'infinity') {
          this.drawArenaBoundary(ctx);
        }

        // 4. Draw Food & Star Remnants
        this.drawFoods(ctx);

        // 4b. Draw Floating Power-Ups
        this.drawPowerups(ctx);

        // 5. Draw All Snakes
        for (const s of this.snakes) {
          s.draw(ctx, {
            x: this.camera.x - (w / 2) / this.camera.zoom,
            y: this.camera.y - (h / 2) / this.camera.zoom,
            w: w / this.camera.zoom,
            h: h / this.camera.zoom
          });
        }

        // 6. Draw Particles
        for (const pt of this.particles) {
          ctx.save();
          ctx.globalAlpha = pt.alpha;
          ctx.fillStyle = pt.color;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, pt.r, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        ctx.restore();
      }
    }

    drawBackground(ctx) {
      const theme = BACKGROUND_THEMES.find(t => t.id === this.equippedThemeId) || BACKGROUND_THEMES[0];
      const viewW = this.canvas.width / this.camera.zoom;
      const viewH = this.canvas.height / this.camera.zoom;
      const startX = Math.floor((this.camera.x - viewW / 2) / 100) * 100;
      const endX = this.camera.x + viewW / 2 + 100;
      const startY = Math.floor((this.camera.y - viewH / 2) / 100) * 100;
      const endY = this.camera.y + viewH / 2 + 100;

      // Fill base
      ctx.fillStyle = theme.bg;
      ctx.fillRect(this.camera.x - viewW, this.camera.y - viewH, viewW * 2, viewH * 2);

      // Grid Lines
      ctx.strokeStyle = theme.grid;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      for (let x = startX; x <= endX; x += 100) {
        ctx.moveTo(x, startY);
        ctx.lineTo(x, endY);
      }
      for (let y = startY; y <= endY; y += 100) {
        ctx.moveTo(startX, y);
        ctx.lineTo(endX, y);
      }
      ctx.stroke();
    }

    drawArenaBoundary(ctx) {
      ctx.save();
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 14;
      ctx.shadowColor = 'rgba(239, 68, 68, 0.7)';
      ctx.shadowBlur = 24;
      ctx.beginPath();
      ctx.arc(0, 0, this.arenaRadius, 0, Math.PI * 2);
      ctx.stroke();

      // Pulsing energy ring
      const pulse = (Math.sin(performance.now() * 0.005) + 1) * 0.5;
      ctx.strokeStyle = `rgba(254, 202, 202, ${0.4 + pulse * 0.4})`;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, 0, this.arenaRadius - 6, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    drawStormZone(ctx) {
      ctx.save();
      // Safe zone circle border
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.arc(0, 0, this.stormRadius, 0, Math.PI * 2);
      ctx.stroke();

      // Outer Danger Hazard Tint
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
      ctx.lineWidth = Math.max(1, this.arenaRadius - this.stormRadius);
      ctx.beginPath();
      ctx.arc(0, 0, (this.arenaRadius + this.stormRadius) / 2, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    drawFoods(ctx) {
      const viewW = this.canvas.width / this.camera.zoom;
      const viewH = this.canvas.height / this.camera.zoom;
      const minX = this.camera.x - viewW / 2 - 40;
      const maxX = this.camera.x + viewW / 2 + 40;
      const minY = this.camera.y - viewH / 2 - 40;
      const maxY = this.camera.y + viewH / 2 + 40;

      for (const f of this.foods) {
        if (f.x < minX || f.x > maxX || f.y < minY || f.y > maxY) continue;

        if (f.isRemnant) {
          // Glowing star orb remnant
          ctx.save();
          ctx.shadowColor = f.color;
          ctx.shadowBlur = 12;
          ctx.fillStyle = f.color;
          ctx.beginPath();
          ctx.arc(f.x, f.y, 8, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(f.x, f.y, 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        } else {
          // Cartoon Food Emoji Item (clean, crisp, spacious)
          ctx.save();
          ctx.font = '18px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.shadowColor = 'rgba(0,0,0,0.4)';
          ctx.shadowBlur = 4;
          ctx.fillText(f.type.emoji, f.x, f.y);
          ctx.restore();
        }
      }
    }

    drawPowerups(ctx) {
      const viewW = this.canvas.width / this.camera.zoom;
      const viewH = this.canvas.height / this.camera.zoom;
      const minX = this.camera.x - viewW / 2 - 50;
      const maxX = this.camera.x + viewW / 2 + 50;
      const minY = this.camera.y - viewH / 2 - 50;
      const maxY = this.camera.y + viewH / 2 + 50;
      const now = performance.now() * 0.005;

      for (const pu of this.powerupItems) {
        if (pu.x < minX || pu.x > maxX || pu.y < minY || pu.y > maxY) continue;
        const bob = Math.sin(now + pu.bobPhase) * 4;

        ctx.save();
        // Pulsing glow aura
        ctx.shadowColor = pu.type.color;
        ctx.shadowBlur = 18;

        // Outer Neon Ring
        ctx.strokeStyle = pu.type.color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(pu.x, pu.y + bob, 18, 0, Math.PI * 2);
        ctx.stroke();

        // Inner translucent dark capsule
        ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
        ctx.beginPath();
        ctx.arc(pu.x, pu.y + bob, 16, 0, Math.PI * 2);
        ctx.fill();

        // Emoji Icon
        ctx.font = '16px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(pu.type.emoji, pu.x, pu.y + bob);

        ctx.restore();
      }
    }

    updatePowerupsHUD() {
      if (!this.player || !this.powerupsHud) return;
      const activeKeys = Object.keys(this.player.powerups);
      if (activeKeys.length === 0) {
        this.powerupsHud.classList.add('hidden');
        this.powerupsHud.innerHTML = '';
        return;
      }

      this.powerupsHud.classList.remove('hidden');
      this.powerupsHud.innerHTML = '';

      for (const key of activeKeys) {
        const timeLeft = this.player.powerups[key];
        const pType = POWERUP_TYPES.find(p => p.id === key);
        if (!pType) continue;

        const maxDuration = pType.duration;
        const pct = Math.max(0, Math.min(100, (timeLeft / maxDuration) * 100));

        const badge = document.createElement('div');
        badge.className = 'powerup-badge';
        badge.style.setProperty('--pu-color', pType.color);
        badge.innerHTML = `
          <span>${pType.emoji}</span>
          <span>${pType.name}</span>
          <div class="pu-timer-bar">
            <div class="pu-timer-fill" style="width: ${pct}%"></div>
          </div>
          <span>${Math.ceil(timeLeft)}s</span>
        `;
        this.powerupsHud.appendChild(badge);
      }
    }

    updateLevelTracker() {
      if (this.mode !== 'levels' || !this.player || this.levelStats.completed) return;
      const lvl = CAMPAIGN_LEVELS[this.currentLevel - 1] || CAMPAIGN_LEVELS[0];
      const p = this.player;
      let cur = 0;
      let max = 1;
      let text = '';
      let isComplete = false;

      switch (lvl.type) {
        case 'mass':
          cur = Math.round(p.mass);
          max = lvl.target;
          text = `${cur} / ${max}`;
          isComplete = (cur >= max);
          break;
        case 'food':
          cur = this.levelStats.foodEaten;
          max = lvl.target;
          text = `Snacks ${cur}/${max} · Mass ${Math.round(p.mass)}/${lvl.targetMass || 70}`;
          isComplete = (cur >= max || p.mass >= (lvl.targetMass || 70));
          break;
        case 'kills':
          cur = p.kills;
          max = lvl.target;
          text = `${cur} / ${max}`;
          isComplete = (cur >= max);
          break;
        case 'mass_and_boost':
          cur = Math.round(p.mass);
          max = lvl.targetMass;
          const bCur = Math.round(this.levelStats.boostTime);
          text = `Mass ${cur}/${max} · Boost ${bCur}/${lvl.targetBoost}s`;
          isComplete = (cur >= max && this.levelStats.boostTime >= lvl.targetBoost);
          break;
        case 'collect_powerup':
          cur = this.levelStats.magnetCollected || 0;
          max = lvl.target;
          text = `Magnets ${cur}/${max} · Mass ${Math.round(p.mass)}/${lvl.targetMass || 150}`;
          isComplete = (cur >= max && p.mass >= (lvl.targetMass || 150));
          break;
        case 'rank_and_mass':
          const curRank = this.calculatePlayerRank();
          cur = Math.round(p.mass);
          max = lvl.targetMass;
          text = `Mass ${cur}/${max} · Rank #${curRank} (Top ${lvl.targetRank})`;
          isComplete = (curRank <= lvl.targetRank && p.mass >= lvl.targetMass);
          break;
        case 'kills_and_mass':
          cur = Math.round(p.mass);
          max = lvl.targetMass;
          text = `Mass ${cur}/${max} · Kills ${p.kills}/${lvl.targetKills}`;
          isComplete = (p.kills >= lvl.targetKills && p.mass >= lvl.targetMass);
          break;
        case 'rank':
          const rank = this.calculatePlayerRank();
          cur = Math.round(p.mass);
          max = lvl.targetMass || 270;
          text = `Rank #${rank} (Target: #${lvl.target}) · Mass ${cur}/${max}`;
          isComplete = (rank <= lvl.target && p.mass >= max);
          break;
        case 'any_powerup':
          cur = this.levelStats.powerupsCollected;
          max = lvl.target;
          text = `${cur} / ${max}`;
          isComplete = (cur >= max);
          break;
        case 'survive_rank':
          const elapsed = Math.floor((performance.now() - this.gameStartTime) / 1000);
          const r = this.calculatePlayerRank();
          cur = elapsed;
          max = lvl.targetTime;
          text = `${elapsed}s/${max}s · Rank #${r}`;
          isComplete = (elapsed >= max && r <= lvl.targetRank);
          break;
        case 'mass_and_kills':
          cur = Math.round(p.mass);
          max = lvl.targetMass;
          text = `Mass ${cur}/${max} · Kills ${p.kills}/${lvl.targetKills}`;
          isComplete = (p.mass >= lvl.targetMass && p.kills >= lvl.targetKills);
          break;
        default:
          cur = Math.round(p.mass);
          max = 50;
          text = `${cur} / 50`;
          isComplete = (cur >= 50);
          break;
      }

      const pct = Math.max(0, Math.min(100, (cur / max) * 100));
      if (this.hudLevelProgressBar) this.hudLevelProgressBar.style.width = `${pct}%`;
      if (this.hudLevelNumVal) this.hudLevelNumVal.textContent = text;

      if (isComplete && !this.levelStats.completed) {
        this.levelStats.completed = true;
        this.triggerLevelVictory(lvl);
      }
    }

    triggerLevelVictory(lvl) {
      this.sound.playFanfare();
      this.state = 'GAMEOVER';

      const elapsed = Math.floor((performance.now() - this.gameStartTime) / 1000);
      const mins = Math.floor(elapsed / 60);
      const secs = elapsed % 60;
      const timeStr = `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;

      // Calculate Stars (1 to 3)
      let stars = 1;
      if (elapsed <= lvl.timePar) stars = 2;
      if (elapsed <= lvl.timePar * 0.75) stars = 3;

      // Save level progress
      const prevStars = this.levelProgress.stars[lvl.level] || 0;
      this.levelProgress.stars[lvl.level] = Math.max(prevStars, stars);
      if (this.levelProgress.unlocked <= lvl.level && lvl.level < 9) {
        this.levelProgress.unlocked = lvl.level + 1;
      }
      localStorage.setItem('svw_level_progress', JSON.stringify(this.levelProgress));

      // Award Coins
      const coinsEarned = lvl.rewardCoins + (stars === 3 ? 50 : (stars === 2 ? 25 : 0));
      this.coins += coinsEarned;
      localStorage.setItem('svw_coins', this.coins.toString());
      this.updateCoinDisplays();

      // UI
      const btnNextLevel = document.getElementById('btnNextLevel');
      if (lvl.level === 9) {
        document.getElementById('completeLevelTitle').textContent = '👑 ALL 9 LEVELS CONQUERED! 👑';
        document.getElementById('completeLevelSub').textContent = 'Mubarak ho! Aapne Snake vs Worms ke saare 9 levels jeet liye!';
        if (btnNextLevel) btnNextLevel.innerHTML = '<span>🏆</span> CAMPAIGN COMPLETE';
      } else {
        document.getElementById('completeLevelTitle').textContent = 'STAGE CLEAR!';
        document.getElementById('completeLevelSub').textContent = `Stage ${lvl.level}: ${lvl.title} Completed!`;
        if (btnNextLevel) btnNextLevel.innerHTML = '<span>▶</span> NEXT LEVEL';
      }
      document.getElementById('lvlFinalMass').textContent = Math.round(this.player.mass).toString();
      document.getElementById('lvlWormsKilled').textContent = this.player.kills.toString();
      document.getElementById('lvlTimeTaken').textContent = timeStr;
      document.getElementById('lvlCoinsEarned').textContent = `+${coinsEarned} 🪙`;

      const starIcons = [document.getElementById('star1'), document.getElementById('star2'), document.getElementById('star3')];
      starIcons.forEach((st, idx) => {
        if (st) {
          st.textContent = idx < stars ? '⭐' : '☆';
          st.style.opacity = idx < stars ? '1' : '0.3';
        }
      });

      if (this.hudControlsBar) this.hudControlsBar.classList.add('hidden');
      if (this.goalToast) this.goalToast.classList.add('hidden');
      if (this.levelHudTracker) this.levelHudTracker.classList.add('hidden');
      this.levelCompleteModal.classList.remove('hidden');
      this.renderLevelSelect();
    }

    initLevels() {
      this.renderLevelSelect();

      // Level Select Open / Close
      const btnOpenLevels = document.getElementById('btnOpenLevels');
      if (btnOpenLevels) {
        btnOpenLevels.addEventListener('click', () => {
          this.renderLevelSelect();
          this.levelSelectModal.classList.remove('hidden');
        });
      }

      const btnCloseLevels = document.getElementById('btnCloseLevels');
      if (btnCloseLevels) {
        btnCloseLevels.addEventListener('click', () => {
          this.levelSelectModal.classList.add('hidden');
        });
      }

      // Level Complete Buttons
      const btnLvlLevels = document.getElementById('btnLvlLevels');
      if (btnLvlLevels) {
        btnLvlLevels.addEventListener('click', () => {
          this.levelCompleteModal.classList.add('hidden');
          this.levelSelectModal.classList.remove('hidden');
        });
      }

      const btnNextLevel = document.getElementById('btnNextLevel');
      if (btnNextLevel) {
        btnNextLevel.addEventListener('click', () => {
          this.levelCompleteModal.classList.add('hidden');
          if (this.currentLevel < 9) {
            this.currentLevel += 1;
            localStorage.setItem('svw_current_level', this.currentLevel.toString());
            this.startNewGame();
          } else {
            this.renderLevelSelect();
            this.levelSelectModal.classList.remove('hidden');
          }
        });
      }
    }

    renderLevelSelect() {
      const grid = document.getElementById('levelsGrid');
      if (!grid) return;
      grid.innerHTML = '';

      let totalStars = 0;
      for (const k in this.levelProgress.stars) {
        totalStars += this.levelProgress.stars[k];
      }
      const totalStarsPill = document.getElementById('totalStarsPill');
      if (totalStarsPill) totalStarsPill.textContent = `⭐ ${totalStars} / 27`;

      CAMPAIGN_LEVELS.forEach(lvl => {
        const isUnlocked = lvl.level <= this.levelProgress.unlocked;
        const isActive = lvl.level === this.currentLevel;
        const stars = this.levelProgress.stars[lvl.level] || 0;

        const card = document.createElement('div');
        card.className = `level-card ${isUnlocked ? 'unlocked' : 'locked'} ${isActive ? 'active-lvl' : ''}`;
        
        let starsStr = '';
        if (isUnlocked) {
          starsStr = '⭐'.repeat(stars) + '☆'.repeat(3 - stars);
        } else {
          starsStr = '🔒';
        }

        card.innerHTML = `
          <span class="lvl-num">${lvl.level}</span>
          <span class="lvl-stars">${starsStr}</span>
          <span class="lvl-desc">${lvl.desc}</span>
          <span class="lvl-reward">+${lvl.rewardCoins} 🪙</span>
        `;

        if (isUnlocked) {
          card.addEventListener('click', () => {
            this.currentLevel = lvl.level;
            localStorage.setItem('svw_current_level', this.currentLevel.toString());
            this.mode = 'levels';
            this.levelSelectModal.classList.add('hidden');
            this.startNewGame();
          });
        }

        grid.appendChild(card);
      });
    }

    renderMinimap() {
      const mCtx = this.minimapCtx;
      const w = this.minimapCanvas.width;
      const h = this.minimapCanvas.height;
      const cx = w / 2;
      const cy = h / 2;
      const scale = (cx - 8) / (this.arenaRadius || 2600);

      mCtx.clearRect(0, 0, w, h);

      // Arena Circle
      mCtx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      mCtx.beginPath();
      mCtx.arc(cx, cy, cx - 8, 0, Math.PI * 2);
      mCtx.fill();
      mCtx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      mCtx.lineWidth = 1.5;
      mCtx.stroke();

      // Battle Royale Storm Ring
      if (this.mode === 'battleroyale') {
        mCtx.strokeStyle = '#ef4444';
        mCtx.lineWidth = 2;
        mCtx.beginPath();
        mCtx.arc(cx, cy, this.stormRadius * scale, 0, Math.PI * 2);
        mCtx.stroke();
      }

      // Draw rival worms dots
      for (const s of this.snakes) {
        if (s.isDead || s.isPlayer) continue;
        mCtx.fillStyle = '#ef4444';
        mCtx.beginPath();
        mCtx.arc(cx + s.x * scale, cy + s.y * scale, 2.2, 0, Math.PI * 2);
        mCtx.fill();
      }

      // Draw Player dot (Bright Yellow / Cyan)
      if (this.player && !this.player.isDead) {
        mCtx.fillStyle = '#facc15';
        mCtx.beginPath();
        mCtx.arc(cx + this.player.x * scale, cy + this.player.y * scale, 4.5, 0, Math.PI * 2);
        mCtx.fill();
        mCtx.strokeStyle = '#ffffff';
        mCtx.lineWidth = 1.5;
        mCtx.stroke();
      }
    }

    // =======================================================================
    // 6. UI & MODAL INTERACTION CONTROLLERS
    // =======================================================================
    initEvents() {
      window.addEventListener('resize', () => this.resize());

      // Mouse & Pointer
      window.addEventListener('mousemove', (e) => {
        this.mouse.x = e.clientX;
        this.mouse.y = e.clientY;
        this.mouseMoved = true;
        this.activeInput = 'mouse';
      });

      window.addEventListener('mousedown', () => { this.mouse.isDown = true; });
      window.addEventListener('mouseup', () => { this.mouse.isDown = false; });

      // Keyboard Controls (WASD, Arrow Keys, Space, Shift)
      const GAME_KEYS = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space'];
      window.addEventListener('keydown', (e) => {
        this.keys[e.code] = true;
        // Immediate restart on Game Over if Space / Enter / KeyR is pressed
        if (this.state === 'GAMEOVER') {
          if (['Space', 'Enter', 'KeyR'].includes(e.code)) {
            this.gameOverModal.classList.add('hidden');
            this.startNewGame();
            return;
          }
        }
        if (GAME_KEYS.includes(e.code)) {
          this.activeInput = 'keyboard';
          if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
            e.preventDefault(); // prevent browser scrolling
          }
        }
      });
      window.addEventListener('keyup', (e) => {
        this.keys[e.code] = false;
        if (GAME_KEYS.includes(e.code)) {
          if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
            e.preventDefault();
          }
        }
      });

      // Quick Goal Toast Dismiss
      if (this.btnCloseGoalToast) {
        this.btnCloseGoalToast.addEventListener('click', () => {
          if (this.goalToast) this.goalToast.classList.add('fade-out');
        });
      }

      // Mobile Boost Button
      const btnBoost = document.getElementById('btnMobileBoost');
      if (btnBoost) {
        const start = (e) => { e.preventDefault(); this.mouse.isDown = true; };
        const end = (e) => { e.preventDefault(); this.mouse.isDown = false; };
        btnBoost.addEventListener('pointerdown', start);
        btnBoost.addEventListener('pointerup', end);
        btnBoost.addEventListener('pointercancel', end);
      }

      // Virtual Joystick on Mobile
      const vJoy = document.getElementById('virtualJoystick');
      const knob = document.getElementById('joystickKnob');
      if (vJoy && knob) {
        let joyActive = false;
        let joyOriginX = 0, joyOriginY = 0;

        vJoy.addEventListener('pointerdown', (e) => {
          joyActive = true;
          const rect = vJoy.getBoundingClientRect();
          joyOriginX = rect.left + rect.width / 2;
          joyOriginY = rect.top + rect.height / 2;
        });

        window.addEventListener('pointermove', (e) => {
          if (!joyActive) return;
          const dx = e.clientX - joyOriginX;
          const dy = e.clientY - joyOriginY;
          const dist = Math.min(38, Math.hypot(dx, dy));
          const angle = Math.atan2(dy, dx);
          knob.style.transform = `translate(${Math.cos(angle) * dist}px, ${Math.sin(angle) * dist}px)`;
          if (this.player) {
            this.player.targetAngle = angle;
          }
        });

        const resetJoy = () => {
          joyActive = false;
          knob.style.transform = 'translate(0, 0)';
        };
        window.addEventListener('pointerup', resetJoy);
        window.addEventListener('pointercancel', resetJoy);
      }

      // Mode Selection Buttons on Menu
      const modeCards = document.querySelectorAll('.mode-card');
      modeCards.forEach(mc => {
        mc.addEventListener('click', () => {
          modeCards.forEach(c => c.classList.remove('active'));
          mc.classList.add('active');
          this.mode = mc.dataset.mode;
        });
      });

      // Main Menu Play Button
      document.getElementById('btnPlayGame').addEventListener('click', () => {
        this.startNewGame();
      });

      // HUD Buttons
      document.getElementById('btnSound').addEventListener('click', () => {
        const muted = this.sound.toggleMute();
        document.getElementById('soundIcon').textContent = muted ? '🔇' : '🔊';
      });

      document.getElementById('btnFullscreen').addEventListener('click', () => {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {});
        } else {
          document.exitFullscreen().catch(() => {});
        }
      });

      document.getElementById('btnPause').addEventListener('click', () => {
        this.state = 'MENU';
        this.gameHud.classList.add('hidden');
        this.leaderboardCard.classList.add('hidden');
        this.minimapContainer.classList.add('hidden');
        this.mobileTouchLayer.classList.add('hidden');
        if (this.hudControlsBar) this.hudControlsBar.classList.add('hidden');
        if (this.goalToast) this.goalToast.classList.add('hidden');
        if (this.levelHudTracker) this.levelHudTracker.classList.add('hidden');
        if (this.powerupsHud) this.powerupsHud.classList.add('hidden');
        this.menuScreen.classList.remove('hidden');
      });

      // Modal Open Buttons
      document.getElementById('btnOpenShop').addEventListener('click', () => {
        this.shopModal.classList.remove('hidden');
      });
      document.getElementById('btnOpenWheel').addEventListener('click', () => {
        this.wheelModal.classList.remove('hidden');
      });
      document.getElementById('btnOpenCustom').addEventListener('click', () => {
        this.customModal.classList.remove('hidden');
      });
      document.getElementById('btnOpenHowTo').addEventListener('click', () => {
        this.howToModal.classList.remove('hidden');
      });

      // Modal Close Buttons
      document.getElementById('btnCloseShop').addEventListener('click', () => this.shopModal.classList.add('hidden'));
      document.getElementById('btnCloseWheel').addEventListener('click', () => this.wheelModal.classList.add('hidden'));
      document.getElementById('btnCloseCustom').addEventListener('click', () => this.customModal.classList.add('hidden'));
      document.getElementById('btnCloseHowTo').addEventListener('click', () => this.howToModal.classList.add('hidden'));
      document.getElementById('btnGotIt').addEventListener('click', () => this.howToModal.classList.add('hidden'));

      // Game Over Action Buttons
      document.getElementById('btnGoMenu').addEventListener('click', () => {
        this.gameOverModal.classList.add('hidden');
        if (this.levelCompleteModal) this.levelCompleteModal.classList.add('hidden');
        this.gameHud.classList.add('hidden');
        this.leaderboardCard.classList.add('hidden');
        this.minimapContainer.classList.add('hidden');
        this.mobileTouchLayer.classList.add('hidden');
        if (this.hudControlsBar) this.hudControlsBar.classList.add('hidden');
        if (this.goalToast) this.goalToast.classList.add('hidden');
        if (this.levelHudTracker) this.levelHudTracker.classList.add('hidden');
        if (this.powerupsHud) this.powerupsHud.classList.add('hidden');
        this.menuScreen.classList.remove('hidden');
        this.state = 'MENU';
      });

      document.getElementById('btnGoReplay').addEventListener('click', () => {
        this.gameOverModal.classList.add('hidden');
        this.startNewGame();
      });

      const btnGoRestartLvl1 = document.getElementById('btnGoRestartLvl1');
      if (btnGoRestartLvl1) {
        btnGoRestartLvl1.addEventListener('click', () => {
          this.currentLevel = 1;
          localStorage.setItem('svw_current_level', '1');
          this.gameOverModal.classList.add('hidden');
          this.startNewGame();
        });
      }
    }

    // =======================================================================
    // 7. SHOP SUBSYSTEM
    // =======================================================================
    initShop() {
      const tabSkins = document.getElementById('tabShopSkins');
      const tabBgs = document.getElementById('tabShopBgs');
      let currentTab = 'skins';

      const renderGrid = () => {
        const grid = document.getElementById('shopItemsGrid');
        grid.innerHTML = '';

        if (currentTab === 'skins') {
          SKINS_CATALOGUE.forEach(skin => {
            const isUnlocked = this.unlockedSkins.includes(skin.id) || skin.price === 0;
            const isEquipped = this.equippedSkinId === skin.id;

            const card = document.createElement('div');
            card.className = `shop-item-card ${isEquipped ? 'equipped' : ''}`;
            card.innerHTML = `
              <div class="item-thumb" style="background: ${skin.primary}; border: 3px solid ${skin.secondary};">
                ${skin.hat === 'crown' ? '👑' : (skin.hat === 'ninja' ? '🥷' : '👀')}
              </div>
              <div class="item-name">${skin.name}</div>
              <div class="item-status">
                ${isEquipped ? 'EQUIPPED' : (isUnlocked ? 'SELECT' : `${skin.price} 🪙`)}
              </div>
            `;

            card.addEventListener('click', () => {
              if (isUnlocked) {
                this.equippedSkinId = skin.id;
                localStorage.setItem('svw_skin', skin.id);
                renderGrid();
              } else if (this.coins >= skin.price) {
                this.coins -= skin.price;
                this.unlockedSkins.push(skin.id);
                localStorage.setItem('svw_unlocked_skins', JSON.stringify(this.unlockedSkins));
                this.equippedSkinId = skin.id;
                localStorage.setItem('svw_skin', skin.id);
                this.updateCoinDisplays();
                renderGrid();
              } else {
                alert(`Not enough coins! Need ${skin.price} 🪙.`);
              }
            });

            grid.appendChild(card);
          });
        } else {
          BACKGROUND_THEMES.forEach(theme => {
            const isUnlocked = this.unlockedThemes.includes(theme.id) || theme.price === 0;
            const isEquipped = this.equippedThemeId === theme.id;

            const card = document.createElement('div');
            card.className = `shop-item-card ${isEquipped ? 'equipped' : ''}`;
            card.innerHTML = `
              <div class="item-thumb" style="background: ${theme.bg}; border: 3px solid ${theme.grid}; font-size: 20px;">
                🎨
              </div>
              <div class="item-name">${theme.name}</div>
              <div class="item-status">
                ${isEquipped ? 'EQUIPPED' : (isUnlocked ? 'SELECT' : `${theme.price} 🪙`)}
              </div>
            `;

            card.addEventListener('click', () => {
              if (isUnlocked) {
                this.equippedThemeId = theme.id;
                localStorage.setItem('svw_theme', theme.id);
                renderGrid();
              } else if (this.coins >= theme.price) {
                this.coins -= theme.price;
                this.unlockedThemes.push(theme.id);
                localStorage.setItem('svw_unlocked_themes', JSON.stringify(this.unlockedThemes));
                this.equippedThemeId = theme.id;
                localStorage.setItem('svw_theme', theme.id);
                this.updateCoinDisplays();
                renderGrid();
              } else {
                alert(`Not enough coins! Need ${theme.price} 🪙.`);
              }
            });

            grid.appendChild(card);
          });
        }
      };

      tabSkins.addEventListener('click', () => {
        currentTab = 'skins';
        tabSkins.classList.add('active');
        tabBgs.classList.remove('active');
        renderGrid();
      });

      tabBgs.addEventListener('click', () => {
        currentTab = 'bgs';
        tabBgs.classList.add('active');
        tabSkins.classList.remove('active');
        renderGrid();
      });

      renderGrid();
    }

    // =======================================================================
    // 8. LUCKY SPIN WHEEL SUBSYSTEM
    // =======================================================================
    initWheel() {
      const canvas = document.getElementById('wheelCanvas');
      const ctx = canvas.getContext('2d');
      const btnSpin = document.getElementById('btnSpinWheel');
      const wheelStatus = document.getElementById('wheelStatus');

      const prizes = [
        { label: '50 🪙', val: 50, color: '#f97316' },
        { label: '100 🪙', val: 100, color: '#3b82f6' },
        { label: '250 🪙', val: 250, color: '#22c55e' },
        { label: 'FREE SKIN', val: 'skin', color: '#a855f7' },
        { label: '500 🪙', val: 500, color: '#eab308' },
        { label: '150 🪙', val: 150, color: '#06b6d4' },
        { label: '75 🪙', val: 75, color: '#ec4899' },
        { label: '1000 🪙', val: 1000, color: '#ef4444' }
      ];

      let wheelAngle = 0;
      let isSpinning = false;

      const drawWheel = () => {
        const cx = canvas.width / 2;
        const cy = canvas.height / 2;
        const r = cx - 12;
        const segAngle = (Math.PI * 2) / prizes.length;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw Slices
        prizes.forEach((p, idx) => {
          const start = wheelAngle + idx * segAngle;
          const end = start + segAngle;

          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.arc(cx, cy, r, start, end);
          ctx.closePath();
          ctx.fill();

          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2.5;
          ctx.stroke();

          // Slice Label
          ctx.save();
          ctx.translate(cx, cy);
          ctx.rotate(start + segAngle / 2);
          ctx.textAlign = 'right';
          ctx.fillStyle = '#ffffff';
          ctx.font = '900 14px "Fredoka", sans-serif';
          ctx.fillText(p.label, r - 18, 5);
          ctx.restore();
        });

        // Center Pin Cap
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(cx, cy, 22, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.arc(cx, cy, 10, 0, Math.PI * 2);
        ctx.fill();
      };

      drawWheel();

      btnSpin.addEventListener('click', () => {
        if (isSpinning) return;
        isSpinning = true;
        btnSpin.disabled = true;
        wheelStatus.textContent = 'Spinning... Good luck!';

        const totalRounds = 5 + Math.random() * 4;
        const targetSlice = Math.floor(Math.random() * prizes.length);
        const segAngle = (Math.PI * 2) / prizes.length;
        // Top pointer is at -Math.PI / 2
        const finalAngle = totalRounds * Math.PI * 2 + (prizes.length - targetSlice) * segAngle - segAngle / 2 - Math.PI / 2;

        let startTime = performance.now();
        const duration = 4000;

        const animate = (t) => {
          const elapsed = t - startTime;
          const progress = Math.min(1, elapsed / duration);
          // Ease-out cubic
          const ease = 1 - Math.pow(1 - progress, 3);
          wheelAngle = ease * finalAngle;

          drawWheel();
          if (Math.random() < 0.2) this.sound.playWheelTick();

          if (progress < 1) {
            requestAnimationFrame(animate);
          } else {
            isSpinning = false;
            btnSpin.disabled = false;
            const won = prizes[targetSlice];
            this.sound.playFanfare();

            if (won.val === 'skin') {
              // Unlock a random skin
              const locked = SKINS_CATALOGUE.filter(s => !this.unlockedSkins.includes(s.id));
              if (locked.length > 0) {
                const award = locked[0];
                this.unlockedSkins.push(award.id);
                localStorage.setItem('svw_unlocked_skins', JSON.stringify(this.unlockedSkins));
                wheelStatus.textContent = `🎉 JACKPOT! You unlocked ${award.name}!`;
              } else {
                this.coins += 500;
                this.updateCoinDisplays();
                wheelStatus.textContent = `🎉 You won 500 🪙 bonus coins!`;
              }
            } else {
              this.coins += won.val;
              this.updateCoinDisplays();
              wheelStatus.textContent = `🎉 CONGRATULATIONS! You won +${won.val} 🪙!`;
            }
          }
        };

        requestAnimationFrame(animate);
      });
    }

    // =======================================================================
    // 9. CUSTOM SKIN BUILDER SUBSYSTEM
    // =======================================================================
    initCustomizer() {
      const previewCanvas = document.getElementById('customPreviewCanvas');
      const pCtx = previewCanvas.getContext('2d');

      const paletteBase = document.getElementById('paletteBase');
      const paletteAccent = document.getElementById('paletteAccent');
      const palettePattern = document.getElementById('palettePattern');
      const paletteEyes = document.getElementById('paletteEyes');
      const paletteHat = document.getElementById('paletteHat');
      const btnSave = document.getElementById('btnSaveCustom');

      const colors = ['#22c55e', '#ef4444', '#0ea5e9', '#a855f7', '#f97316', '#facc15', '#ec4899', '#ffffff', '#0f172a', '#14b8a6'];

      // Populate Color Swatches
      colors.forEach(c => {
        const s1 = document.createElement('div');
        s1.className = `color-swatch ${c === this.customSkin.primary ? 'active' : ''}`;
        s1.style.background = c;
        s1.onclick = () => {
          paletteBase.querySelectorAll('.color-swatch').forEach(sw => sw.classList.remove('active'));
          s1.classList.add('active');
          this.customSkin.primary = c;
          drawPreview();
        };
        paletteBase.appendChild(s1);

        const s2 = document.createElement('div');
        s2.className = `color-swatch ${c === this.customSkin.secondary ? 'active' : ''}`;
        s2.style.background = c;
        s2.onclick = () => {
          paletteAccent.querySelectorAll('.color-swatch').forEach(sw => sw.classList.remove('active'));
          s2.classList.add('active');
          this.customSkin.secondary = c;
          drawPreview();
        };
        paletteAccent.appendChild(s2);
      });

      // Chips bindings
      const bindChips = (container, prop) => {
        container.querySelectorAll('.chip').forEach(chip => {
          chip.onclick = () => {
            container.querySelectorAll('.chip').forEach(cp => cp.classList.remove('active'));
            chip.classList.add('active');
            this.customSkin[prop] = chip.dataset[prop];
            drawPreview();
          };
        });
      };
      bindChips(palettePattern, 'pattern');
      bindChips(paletteEyes, 'eyes');
      bindChips(paletteHat, 'hat');

      const drawPreview = () => {
        pCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
        const previewSnake = new Snake('prev', 'Custom', 110, 110, {
          primary: this.customSkin.primary,
          secondary: this.customSkin.secondary,
          pattern: this.customSkin.pattern,
          eyes: this.customSkin.eyes,
          hat: this.customSkin.hat
        });
        previewSnake.segments = [
          { x: 110, y: 110 }, { x: 95, y: 110 }, { x: 80, y: 115 },
          { x: 65, y: 125 }, { x: 50, y: 140 }, { x: 38, y: 160 }
        ];
        previewSnake.draw(pCtx, { x: 0, y: 0, w: 220, h: 220 });
      };

      drawPreview();

      btnSave.addEventListener('click', () => {
        localStorage.setItem('svw_custom_skin', JSON.stringify(this.customSkin));
        this.equippedSkinId = 'custom';
        localStorage.setItem('svw_skin', 'custom');
        alert('🎉 Custom Skin Saved and Equipped!');
        this.customModal.classList.add('hidden');
      });
    }
  }

  // Launch on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.game = new SnakeVsWormsGame(); });
  } else {
    window.game = new SnakeVsWormsGame();
  }
})();
