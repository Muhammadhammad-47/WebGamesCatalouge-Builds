/* ==========================================================================
   RESCUE THE FISH - PHYSICS ENGINE & GAMEPLAY
   Fluid particle dynamics, pull-pin physics, audio synth, and 20 levels
   ========================================================================== */

(function () {
  'use strict';

  // ==========================================================================
  // WEB AUDIO SYNTHESIZER
  // ==========================================================================
  var AudioEngine = (function () {
    var ctx = null;
    var soundEnabled = true;

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
      toggle: function () {
        soundEnabled = !soundEnabled;
        return soundEnabled;
      },
      isEnabled: function () {
        return soundEnabled;
      },
      playPin: function () {
        if (!soundEnabled) return;
        var ac = getContext();
        if (!ac) return;
        // Metallic clink followed by slide
        var osc = ac.createOscillator();
        var gain = ac.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(1200, ac.currentTime);
        osc.frequency.exponentialRampToValueAtTime(300, ac.currentTime + 0.18);
        gain.gain.setValueAtTime(0.3, ac.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ac.currentTime + 0.18);
        osc.connect(gain);
        gain.connect(ac.destination);
        osc.start();
        osc.stop(ac.currentTime + 0.18);
      },
      playWater: function () {
        if (!soundEnabled) return;
        var ac = getContext();
        if (!ac) return;
        var osc = ac.createOscillator();
        var gain = ac.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(500 + Math.random() * 200, ac.currentTime);
        osc.frequency.exponentialRampToValueAtTime(800 + Math.random() * 200, ac.currentTime + 0.08);
        gain.gain.setValueAtTime(0.12, ac.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ac.currentTime + 0.08);
        osc.connect(gain);
        gain.connect(ac.destination);
        osc.start();
        osc.stop(ac.currentTime + 0.08);
      },
      playSizzle: function () {
        if (!soundEnabled) return;
        var ac = getContext();
        if (!ac) return;
        // White noise burst for steam sizzle
        var bufferSize = ac.sampleRate * 0.15;
        var buffer = ac.createBuffer(1, bufferSize, ac.sampleRate);
        var data = buffer.getChannelData(0);
        for (var i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }
        var noise = ac.createBufferSource();
        noise.buffer = buffer;
        var filter = ac.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 1000;
        var gain = ac.createGain();
        gain.gain.setValueAtTime(0.2, ac.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ac.currentTime + 0.15);
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ac.destination);
        noise.start();
      },
      playWin: function () {
        if (!soundEnabled) return;
        var ac = getContext();
        if (!ac) return;
        var notes = [440, 554.37, 659.25, 880]; // A4, C#5, E5, A5
        notes.forEach(function (freq, i) {
          var osc = ac.createOscillator();
          var gain = ac.createGain();
          var t = ac.currentTime + i * 0.1;
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, t);
          gain.gain.setValueAtTime(0.25, t);
          gain.gain.exponentialRampToValueAtTime(0.01, t + 0.4);
          osc.connect(gain);
          gain.connect(ac.destination);
          osc.start(t);
          osc.stop(t + 0.4);
        });
      },
      playFail: function () {
        if (!soundEnabled) return;
        var ac = getContext();
        if (!ac) return;
        var osc = ac.createOscillator();
        var gain = ac.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(280, ac.currentTime);
        osc.frequency.linearRampToValueAtTime(140, ac.currentTime + 0.35);
        gain.gain.setValueAtTime(0.25, ac.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ac.currentTime + 0.35);
        osc.connect(gain);
        gain.connect(ac.destination);
        osc.start();
        osc.stop(ac.currentTime + 0.35);
      },
      playCoin: function () {
        if (!soundEnabled) return;
        var ac = getContext();
        if (!ac) return;
        var osc = ac.createOscillator();
        var gain = ac.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(987.77, ac.currentTime); // B5
        osc.frequency.setValueAtTime(1318.51, ac.currentTime + 0.08); // E6
        gain.gain.setValueAtTime(0.2, ac.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ac.currentTime + 0.28);
        osc.connect(gain);
        gain.connect(ac.destination);
        osc.start();
        osc.stop(ac.currentTime + 0.28);
      }
    };
  })();

  // ==========================================================================
  // CONFETTI SYSTEM
  // ==========================================================================
  var Confetti = (function () {
    var canvas = document.getElementById('confettiCanvas');
    var ctx = canvas ? canvas.getContext('2d') : null;
    var particles = [];
    var animating = false;
    var colors = ['#ff7a00', '#00b4d8', '#2ecc71', '#facc15', '#a855f7', '#ff4d6d'];

    function resize() {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resize);
    resize();

    function update() {
      if (!animating || !ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      var alive = false;
      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.gravity;
        p.rotation += p.rotSpeed;
        p.alpha -= 0.008;

        if (p.alpha > 0) {
          alive = true;
          ctx.save();
          ctx.globalAlpha = Math.max(0, p.alpha);
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 1.5);
          ctx.restore();
        }
      }

      if (alive) {
        requestAnimationFrame(update);
      } else {
        animating = false;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }

    return {
      launch: function (count) {
        if (!canvas) return;
        resize();
        particles = [];
        var num = count || 90;
        var startX = canvas.width / 2;
        var startY = canvas.height * 0.45;

        for (var i = 0; i < num; i++) {
          var angle = Math.random() * Math.PI * 2;
          var speed = 5 + Math.random() * 12;
          particles.push({
            x: startX + (Math.random() - 0.5) * 80,
            y: startY + (Math.random() - 0.5) * 40,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 6,
            gravity: 0.35,
            size: 8 + Math.random() * 8,
            rotation: Math.random() * Math.PI * 2,
            rotSpeed: (Math.random() - 0.5) * 0.25,
            color: colors[Math.floor(Math.random() * colors.length)],
            alpha: 1
          });
        }
        if (!animating) {
          animating = true;
          requestAnimationFrame(update);
        }
      }
    };
  })();

  // ==========================================================================
  // GAME STATE & PERSISTENCE
  // ==========================================================================
  var TOTAL_LEVELS = 20;
  var STORAGE_KEY = 'ciel_rescuefish_save_v1';
  var gameState = {
    unlockedLevels: 1,
    levelStars: {}
  };

  function loadGameState() {
    try {
      var saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        gameState = JSON.parse(saved);
      }
    } catch (e) { }
  }

  function saveGameState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(gameState));
    } catch (e) { }
  }

  loadGameState();

  // ==========================================================================
  // 2D FLUID PHYSICS & PIN SIMULATOR
  // Virtual World coordinate space: 400 x 540
  // ==========================================================================
  var V_WIDTH = 400;
  var V_HEIGHT = 540;

  var PARTICLE_WATER = 1;
  var PARTICLE_LAVA = 2;
  var PARTICLE_STONE = 3;
  var PARTICLE_STEAM = 4;

  function PhysicsWorld() {
    this.particles = [];
    this.walls = [];
    this.pins = [];
    this.fish = null;
    this.crabs = [];
    this.coins = [];
    this.steamParticles = [];
    this.waterDelivered = 0;
    this.waterTarget = 12;
    this.isOver = false;
    this.won = false;
  }

  PhysicsWorld.prototype.addWall = function (x1, y1, x2, y2, thickness) {
    this.walls.push({
      x1: x1, y1: y1,
      x2: x2, y2: y2,
      thickness: thickness || 8
    });
  };

  PhysicsWorld.prototype.addPin = function (id, x1, y1, x2, y2, pullDir, handleSide) {
    // Pin is a movable wall segment that can be pulled
    var len = Math.hypot(x2 - x1, y2 - y1);
    this.pins.push({
      id: id,
      x1: x1, y1: y1,
      x2: x2, y2: y2,
      origX1: x1, origY1: y1,
      origX2: x2, origY2: y2,
      pullDir: pullDir || 'right', // 'right', 'left', 'up', 'down'
      handleSide: handleSide || 'end', // 'start' or 'end'
      length: len,
      pulled: false,
      pullProgress: 0, // 0 to 1
      isAnimating: false,
      isRemoved: false
    });
  };

  PhysicsWorld.prototype.addFluid = function (type, cx, cy, count, radius) {
    radius = radius || 30;
    for (var i = 0; i < count; i++) {
      var angle = Math.random() * Math.PI * 2;
      var dist = Math.random() * radius;
      this.particles.push({
        type: type,
        x: cx + Math.cos(angle) * dist,
        y: cy + Math.sin(angle) * dist,
        vx: (Math.random() - 0.5) * 0.8,
        vy: (Math.random() - 0.5) * 0.8,
        radius: type === PARTICLE_WATER ? 5.2 : type === PARTICLE_LAVA ? 5.8 : 6.0,
        alive: true
      });
    }
  };

  PhysicsWorld.prototype.setFish = function (x, y) {
    this.fish = {
      x: x,
      y: y,
      targetX: x,
      targetY: y,
      width: 58,
      height: 40,
      isAlive: true,
      isSaved: false,
      isFried: false,
      flopOffset: 0,
      flopSpeed: 0.15,
      swimAnim: 0
    };
  };

  PhysicsWorld.prototype.addCrab = function (x, y, patrolLeft, patrolRight) {
    this.crabs.push({
      x: x,
      y: y,
      origY: y,
      patrolLeft: patrolLeft,
      patrolRight: patrolRight,
      vx: 0.7,
      isAlive: true,
      animTick: 0
    });
  };

  PhysicsWorld.prototype.addCoin = function (x, y) {
    this.coins.push({
      x: x,
      y: y,
      radius: 12,
      collected: false,
      shineTick: Math.random() * 10
    });
  };

  // Line segment distance helper for collisions
  function pointToSegmentDistSq(px, py, x1, y1, x2, y2) {
    var l2 = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
    if (l2 === 0) return (px - x1) * (px - x1) + (py - y1) * (py - y1);
    var t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
    t = Math.max(0, Math.min(1, t));
    var projX = x1 + t * (x2 - x1);
    var projY = y1 + t * (y2 - y1);
    return (px - projX) * (px - projX) + (py - projY) * (py - projY);
  }

  function closestPointOnSegment(px, py, x1, y1, x2, y2) {
    var l2 = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
    if (l2 === 0) return { x: x1, y: y1 };
    var t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
    t = Math.max(0, Math.min(1, t));
    return { x: x1 + t * (x2 - x1), y: y1 + t * (y2 - y1) };
  }

  PhysicsWorld.prototype.update = function () {
    if (this.isOver) return;

    var i, j;
    var gravity = 0.22;
    var damping = 0.985;

    // 1. Update Pin animations
    for (i = 0; i < this.pins.length; i++) {
      var pin = this.pins[i];
      if (pin.isAnimating && !pin.isRemoved) {
        pin.pullProgress += 0.08;
        var dx = 0, dy = 0;
        var shift = pin.length * 1.35 * pin.pullProgress;
        if (pin.pullDir === 'right') dx = shift;
        else if (pin.pullDir === 'left') dx = -shift;
        else if (pin.pullDir === 'up') dy = -shift;
        else if (pin.pullDir === 'down') dy = shift;

        pin.x1 = pin.origX1 + dx;
        pin.y1 = pin.origY1 + dy;
        pin.x2 = pin.origX2 + dx;
        pin.y2 = pin.origY2 + dy;

        if (pin.pullProgress >= 1) {
          pin.isAnimating = false;
          pin.isRemoved = true;
          pin.pulled = true;
        }
      }
    }

    // 2. Update Crabs
    for (i = 0; i < this.crabs.length; i++) {
      var crab = this.crabs[i];
      if (crab.isAlive) {
        crab.animTick += 0.12;
        crab.x += crab.vx;
        if (crab.x <= crab.patrolLeft || crab.x >= crab.patrolRight) {
          crab.vx = -crab.vx;
        }

        // Check if crab touches fish
        if (this.fish && this.fish.isAlive && !this.fish.isSaved) {
          var distToFish = Math.hypot(crab.x - this.fish.x, crab.y - this.fish.y);
          if (distToFish < 38) {
            this.fish.isAlive = false;
            this.isOver = true;
            this.won = false;
            AudioEngine.playFail();
            if (this.onFail) this.onFail("The crab pinched the fish!");
            return;
          }
        }
      }
    }

    // 3. Update Particles
    for (i = 0; i < this.particles.length; i++) {
      var p = this.particles[i];
      if (!p.alive) continue;
      p.prevX = p.x;
      p.prevY = p.y;

      if (p.type === PARTICLE_STONE) {
        // Falling stone
        p.vy += gravity * 1.2;
        p.vx *= 0.95;
      } else {
        // Fluid gravity
        p.vy += gravity;
        p.vx *= damping;
        p.vy *= damping;
      }

      p.x += p.vx;
      p.y += p.vy;

      // World bounds
      if (p.x < p.radius) { p.x = p.radius; p.vx = -p.vx * 0.4; }
      if (p.x > V_WIDTH - p.radius) { p.x = V_WIDTH - p.radius; p.vx = -p.vx * 0.4; }
      if (p.y > V_HEIGHT - p.radius) { p.y = V_HEIGHT - p.radius; p.vy = -p.vy * 0.3; }

      // Wall Collisions
      for (j = 0; j < this.walls.length; j++) {
        var w = this.walls[j];
        var cp = closestPointOnSegment(p.x, p.y, w.x1, w.y1, w.x2, w.y2);
        var distSq = (p.x - cp.x) * (p.x - cp.x) + (p.y - cp.y) * (p.y - cp.y);
        var minDist = p.radius + w.thickness / 2;
        if (distSq < minDist * minDist && distSq > 0) {
          var dist = Math.sqrt(distSq);
          var nx = (p.x - cp.x) / dist;
          var ny = (p.y - cp.y) / dist;
          p.x = cp.x + nx * minDist;
          p.y = cp.y + ny * minDist;

          // Reflect velocity with friction
          var dot = p.vx * nx + p.vy * ny;
          p.vx = (p.vx - 1.4 * dot * nx) * 0.65;
          p.vy = (p.vy - 1.4 * dot * ny) * 0.65;
        }
      }

      // Pin Collisions (with strict anti-tunneling barrier containment)
      for (j = 0; j < this.pins.length; j++) {
        var pinEl = this.pins[j];
        if (pinEl.isRemoved) continue;
        var pminDist = p.radius + 6;

        // Strict barrier check for horizontal pins
        if (Math.abs(pinEl.y1 - pinEl.y2) < 3) {
          var minX = Math.min(pinEl.x1, pinEl.x2) - 8;
          var maxX = Math.max(pinEl.x1, pinEl.x2) + 8;
          var pinY = (pinEl.y1 + pinEl.y2) * 0.5;
          if (p.x >= minX && p.x <= maxX) {
            if ((p.prevY === undefined || p.prevY <= pinY + 1) && p.y >= pinY - pminDist) {
              p.y = pinY - pminDist;
              p.vy = -Math.abs(p.vy) * 0.45;
              continue;
            } else if (p.prevY !== undefined && p.prevY >= pinY - 1 && p.y <= pinY + pminDist) {
              p.y = pinY + pminDist;
              p.vy = Math.abs(p.vy) * 0.45;
              continue;
            }
          }
        }

        // Strict barrier check for vertical pins
        if (Math.abs(pinEl.x1 - pinEl.x2) < 3) {
          var minY = Math.min(pinEl.y1, pinEl.y2) - 8;
          var maxY = Math.max(pinEl.y1, pinEl.y2) + 8;
          var pinX = (pinEl.x1 + pinEl.x2) * 0.5;
          if (p.y >= minY && p.y <= maxY) {
            if ((p.prevX === undefined || p.prevX <= pinX + 1) && p.x >= pinX - pminDist) {
              p.x = pinX - pminDist;
              p.vx = -Math.abs(p.vx) * 0.45;
              continue;
            } else if (p.prevX !== undefined && p.prevX >= pinX - 1 && p.x <= pinX + pminDist) {
              p.x = pinX + pminDist;
              p.vx = Math.abs(p.vx) * 0.45;
              continue;
            }
          }
        }

        // Segment fallback
        var pcp = closestPointOnSegment(p.x, p.y, pinEl.x1, pinEl.y1, pinEl.x2, pinEl.y2);
        var pdistSq = (p.x - pcp.x) * (p.x - pcp.x) + (p.y - pcp.y) * (p.y - pcp.y);
        if (pdistSq < pminDist * pminDist && pdistSq > 0) {
          var pdist = Math.sqrt(pdistSq);
          var pnx = (p.x - pcp.x) / pdist;
          var pny = (p.y - pcp.y) / pdist;
          p.x = pcp.x + pnx * pminDist;
          p.y = pcp.y + pny * pminDist;
          var pdot = p.vx * pnx + p.vy * pny;
          p.vx = (p.vx - 1.4 * pdot * pnx) * 0.65;
          p.vy = (p.vy - 1.4 * pdot * pny) * 0.65;
        }
      }

      // Lava hits Crab
      if (p.type === PARTICLE_LAVA || p.type === PARTICLE_STONE) {
        for (var k = 0; k < this.crabs.length; k++) {
          var cr = this.crabs[k];
          if (cr.isAlive && Math.hypot(p.x - cr.x, p.y - cr.y) < 26) {
            cr.isAlive = false;
            AudioEngine.playSizzle();
            // Spawn steam
            this.addSteam(cr.x, cr.y);
          }
        }
      }

      // Particle vs Fish interactions
      if (this.fish && this.fish.isAlive) {
        var fdx = p.x - this.fish.x;
        var fdy = p.y - this.fish.y;
        var fDist = Math.hypot(fdx, fdy);

        // Water delivers to fish!
        if (p.type === PARTICLE_WATER && fDist < 36) {
          this.waterDelivered++;
          if (this.waterDelivered % 5 === 0) {
            AudioEngine.playWater();
          }
          if (this.waterDelivered >= this.waterTarget && !this.fish.isSaved) {
            this.fish.isSaved = true;
            this.isOver = true;
            this.won = true;
            AudioEngine.playWin();
            Confetti.launch(85);
            if (this.onWin) this.onWin();
          }
        }

        // Lava touches fish -> BURN!
        if (p.type === PARTICLE_LAVA && fDist < 26) {
          this.fish.isAlive = false;
          this.fish.isFried = true;
          this.isOver = true;
          this.won = false;
          AudioEngine.playSizzle();
          AudioEngine.playFail();
          if (this.onFail) this.onFail("Hot lava burned the fish!");
          return;
        }
      }

      // Coins Collection
      for (var ci = 0; ci < this.coins.length; ci++) {
        var coin = this.coins[ci];
        if (!coin.collected && Math.hypot(p.x - coin.x, p.y - coin.y) < coin.radius + p.radius) {
          coin.collected = true;
          AudioEngine.playCoin();
        }
      }
    }

    // 4. Particle-to-Particle Inter-fluid Reactions (Water + Lava -> Stone & Steam)
    var pCount = this.particles.length;
    for (i = 0; i < pCount; i++) {
      var p1 = this.particles[i];
      if (!p1.alive) continue;

      for (j = i + 1; j < pCount; j++) {
        var p2 = this.particles[j];
        if (!p2.alive) continue;

        var dx2 = p2.x - p1.x;
        var dy2 = p2.y - p1.y;
        var distSq2 = dx2 * dx2 + dy2 * dy2;
        var rSum = p1.radius + p2.radius;

        if (distSq2 < rSum * rSum && distSq2 > 0) {
          var d2 = Math.sqrt(distSq2);
          var overlap = (rSum - d2) * 0.5;
          var normX = dx2 / d2;
          var normY = dy2 / d2;

          // Water meets Lava -> Steam & Stone transformation!
          if ((p1.type === PARTICLE_WATER && p2.type === PARTICLE_LAVA) ||
            (p1.type === PARTICLE_LAVA && p2.type === PARTICLE_WATER)) {
            p1.type = PARTICLE_STONE;
            p2.type = PARTICLE_STONE;
            p1.radius = 6.2;
            p2.radius = 6.2;
            AudioEngine.playSizzle();
            this.addSteam(p1.x, p1.y);
          } else {
            // Elastic fluid push-apart
            p1.x -= normX * overlap;
            p1.y -= normY * overlap;
            p2.x += normX * overlap;
            p2.y += normY * overlap;

            var pushSpeed = (p1.vx - p2.vx) * normX + (p1.vy - p2.vy) * normY;
            if (pushSpeed > 0) {
              p1.vx -= pushSpeed * normX * 0.45;
              p1.vy -= pushSpeed * normY * 0.45;
              p2.vx += pushSpeed * normX * 0.45;
              p2.vy += pushSpeed * normY * 0.45;
            }
          }
        }
      }
    }

    // 5. Update Steam particles
    for (i = this.steamParticles.length - 1; i >= 0; i--) {
      var st = this.steamParticles[i];
      st.y -= 1.2;
      st.x += (Math.random() - 0.5) * 1.2;
      st.radius += 0.25;
      st.alpha -= 0.025;
      if (st.alpha <= 0) {
        this.steamParticles.splice(i, 1);
      }
    }

    // 6. Update Fish animation
    if (this.fish) {
      if (this.fish.isSaved) {
        this.fish.swimAnim += 0.1;
        this.fish.y = this.fish.targetY + Math.sin(this.fish.swimAnim) * 8;
        this.fish.x = this.fish.targetX + Math.cos(this.fish.swimAnim * 0.7) * 12;
      } else if (this.fish.isAlive) {
        // Flapping helplessly on dry ground
        this.fish.flopOffset += this.fish.flopSpeed;
      }
    }
  };

  PhysicsWorld.prototype.addSteam = function (x, y) {
    for (var i = 0; i < 6; i++) {
      this.steamParticles.push({
        x: x + (Math.random() - 0.5) * 12,
        y: y + (Math.random() - 0.5) * 8,
        radius: 6 + Math.random() * 6,
        alpha: 0.85
      });
    }
  };

  PhysicsWorld.prototype.pullPinById = function (pinId) {
    for (var i = 0; i < this.pins.length; i++) {
      var pin = this.pins[i];
      if (pin.id === pinId && !pin.pulled && !pin.isAnimating) {
        pin.isAnimating = true;
        AudioEngine.playPin();
        return true;
      }
    }
    return false;
  };

  // Check if click hits a pin handle or body
  PhysicsWorld.prototype.checkPinClick = function (vx, vy) {
    for (var i = 0; i < this.pins.length; i++) {
      var pin = this.pins[i];
      if (pin.isRemoved || pin.pulled || pin.isAnimating) continue;

      // Handle circle check
      var hx = pin.handleSide === 'end' ? pin.x2 : pin.x1;
      var hy = pin.handleSide === 'end' ? pin.y2 : pin.y1;
      var distToHandle = Math.hypot(vx - hx, vy - hy);

      if (distToHandle < 28) {
        this.pullPinById(pin.id);
        return true;
      }

      // Segment check
      var distToSeg = Math.sqrt(pointToSegmentDistSq(vx, vy, pin.x1, pin.y1, pin.x2, pin.y2));
      if (distToSeg < 18) {
        this.pullPinById(pin.id);
        return true;
      }
    }
    return false;
  };

  // ==========================================================================
  // RENDERER
  // ==========================================================================
  function renderWorld(ctx, world, scaleX, scaleY) {
    ctx.clearRect(0, 0, V_WIDTH * scaleX, V_HEIGHT * scaleY);

    ctx.save();
    ctx.scale(scaleX, scaleY);

    var i;

    // 1. Draw Chambers / Solid Walls
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (i = 0; i < world.walls.length; i++) {
      var w = world.walls[i];
      // Outer border
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = w.thickness + 5;
      ctx.beginPath();
      ctx.moveTo(w.x1, w.y1);
      ctx.lineTo(w.x2, w.y2);
      ctx.stroke();

      // Metallic pipe core
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = w.thickness;
      ctx.beginPath();
      ctx.moveTo(w.x1, w.y1);
      ctx.lineTo(w.x2, w.y2);
      ctx.stroke();

      // Top pipe highlight
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = Math.max(2, w.thickness * 0.3);
      ctx.beginPath();
      ctx.moveTo(w.x1, w.y1);
      ctx.lineTo(w.x2, w.y2);
      ctx.stroke();
    }

    // 2. Draw Interactive Pins
    for (i = 0; i < world.pins.length; i++) {
      var pin = world.pins[i];
      if (pin.isRemoved) continue;

      // Golden Pin Shadow
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.lineWidth = 14;
      ctx.beginPath();
      ctx.moveTo(pin.x1 + 3, pin.y1 + 4);
      ctx.lineTo(pin.x2 + 3, pin.y2 + 4);
      ctx.stroke();

      // Pin Outer Border
      ctx.strokeStyle = '#2d3748';
      ctx.lineWidth = 13;
      ctx.beginPath();
      ctx.moveTo(pin.x1, pin.y1);
      ctx.lineTo(pin.x2, pin.y2);
      ctx.stroke();

      // Pin Golden Body
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 9;
      ctx.beginPath();
      ctx.moveTo(pin.x1, pin.y1);
      ctx.lineTo(pin.x2, pin.y2);
      ctx.stroke();

      // Pin Golden Center Highlight
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(pin.x1, pin.y1);
      ctx.lineTo(pin.x2, pin.y2);
      ctx.stroke();

      // Golden Ring Handle
      var hx = pin.handleSide === 'end' ? pin.x2 : pin.x1;
      var hy = pin.handleSide === 'end' ? pin.y2 : pin.y1;

      // Outer Handle Ring
      ctx.fillStyle = '#f59e0b';
      ctx.strokeStyle = '#2d3748';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.arc(hx, hy, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Inner Handle Hole
      ctx.fillStyle = '#0c4a6e';
      ctx.beginPath();
      ctx.arc(hx, hy, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    // 3. Draw Coins
    for (i = 0; i < world.coins.length; i++) {
      var c = world.coins[i];
      if (c.collected) continue;
      c.shineTick += 0.08;

      ctx.save();
      ctx.translate(c.x, c.y);
      ctx.fillStyle = '#facc15';
      ctx.strokeStyle = '#ca8a04';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 0, c.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Star / Stamp inside coin
      ctx.fillStyle = '#ca8a04';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('★', 0, 1);
      ctx.restore();
    }

    // 4. Draw Crabs
    for (i = 0; i < world.crabs.length; i++) {
      var crab = world.crabs[i];
      if (!crab.isAlive) continue;

      ctx.save();
      ctx.translate(crab.x, crab.y);

      // Pincers snapping
      var clawAngle = Math.sin(crab.animTick) * 0.3;
      ctx.fillStyle = '#dc2626';
      ctx.strokeStyle = '#2d3748';
      ctx.lineWidth = 2;

      // Left claw
      ctx.save();
      ctx.translate(-14, -8);
      ctx.rotate(-clawAngle);
      ctx.beginPath();
      ctx.arc(0, 0, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      // Right claw
      ctx.save();
      ctx.translate(14, -8);
      ctx.rotate(clawAngle);
      ctx.beginPath();
      ctx.arc(0, 0, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      // Crab Body
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.ellipse(0, 0, 15, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Eyes
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-5, -6, 3.5, 0, Math.PI * 2);
      ctx.arc(5, -6, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(-5, -6, 1.8, 0, Math.PI * 2);
      ctx.arc(5, -6, 1.8, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    // 5. Draw Fluid Particles
    for (i = 0; i < world.particles.length; i++) {
      var p = world.particles[i];
      if (!p.alive) continue;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);

      if (p.type === PARTICLE_WATER) {
        ctx.fillStyle = '#00b4d8';
        ctx.fill();
        // Highlight dot
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.beginPath();
        ctx.arc(p.x - 1.2, p.y - 1.2, p.radius * 0.4, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === PARTICLE_LAVA) {
        // Glowing hot magma
        ctx.fillStyle = '#ef4444';
        ctx.fill();
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * 0.55, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === PARTICLE_STONE) {
        // Hardened rock
        ctx.fillStyle = '#475569';
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 1.5;
        ctx.fill();
        ctx.stroke();
      }
    }

    // 6. Draw Steam Vapors
    for (i = 0; i < world.steamParticles.length; i++) {
      var st = world.steamParticles[i];
      ctx.fillStyle = 'rgba(255, 255, 255, ' + st.alpha + ')';
      ctx.beginPath();
      ctx.arc(st.x, st.y, st.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // 7. Draw The Fish
    if (world.fish) {
      var f = world.fish;
      ctx.save();
      ctx.translate(f.x, f.y);

      if (f.isFried) {
        // Charred fishbone
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-18, 0);
        ctx.lineTo(18, 0);
        // ribs
        ctx.moveTo(-8, -10); ctx.lineTo(-8, 10);
        ctx.moveTo(2, -10); ctx.lineTo(2, 10);
        ctx.moveTo(12, -8); ctx.lineTo(12, 8);
        ctx.stroke();
        // Skull
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(18, 0, 8, 0, Math.PI * 2);
        ctx.fill();
      } else if (!f.isSaved) {
        // Flapping dry on floor
        var flopRot = Math.sin(f.flopOffset) * 0.28;
        ctx.rotate(flopRot);

        // Flapping Tail
        ctx.fillStyle = '#ff7a00';
        ctx.strokeStyle = '#2d3748';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(-16, 0);
        ctx.lineTo(-32, -12);
        ctx.lineTo(-32, 12);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Fish Body
        ctx.fillStyle = '#ff8c00';
        ctx.beginPath();
        ctx.ellipse(0, 0, 20, 14, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // White Stripe
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(-4, 0, 4, 13, 0, 0, Math.PI * 2);
        ctx.fill();

        // Gasping Mouth
        ctx.strokeStyle = '#2d3748';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(17, 3, 4, 0, Math.PI);
        ctx.stroke();

        // Worried Eye
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(10, -4, 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.arc(11, -4, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Sweat droplet
        ctx.fillStyle = '#38bdf8';
        ctx.font = '14px sans-serif';
        ctx.fillText('💧', -4, -18);
      } else {
        // Joyfully swimming in water
        var swimAngle = Math.sin(f.swimAnim * 1.5) * 0.15;
        ctx.rotate(swimAngle);

        // Happy swimming tail
        ctx.fillStyle = '#ff7a00';
        ctx.strokeStyle = '#2d3748';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(-18, 0);
        ctx.lineTo(-36, -14);
        ctx.lineTo(-36, 14);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Body
        ctx.fillStyle = '#ff8c00';
        ctx.beginPath();
        ctx.ellipse(0, 0, 22, 15, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // White stripes
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(-5, 0, 5, 14, 0, 0, Math.PI * 2);
        ctx.fill();

        // Happy wink eye
        ctx.strokeStyle = '#2d3748';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(12, -4, 4, Math.PI, 0);
        ctx.stroke();

        // Cute smiling mouth
        ctx.beginPath();
        ctx.arc(16, 2, 4, 0, Math.PI);
        ctx.stroke();

        // Bubble
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.beginPath();
        ctx.arc(28, -8, 4, 0, Math.PI * 2);
        ctx.arc(36, -16, 6, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    ctx.restore();
  }

  // ==========================================================================
  // LEVEL DEFINITIONS (20 Levels with progressive mechanics)
  // ==========================================================================
  var LEVEL_CONFIGS = [
    // ------------------------------------------------------------------------
    // LEVEL 1: Tutorial — 1 pin, pure water above fish
    // ------------------------------------------------------------------------
    {
      level: 1,
      objective: "Pull the golden pin to release water onto the fish!",
      hint: "Click or tap the golden pin handle on the right to slide it out!",
      setup: function (world) {
        // Outer box
        world.addWall(100, 60, 100, 480, 10);
        world.addWall(300, 60, 300, 480, 10);
        world.addWall(100, 480, 300, 480, 10);

        // Single Pin in middle
        world.addPin('pin1', 98, 260, 302, 260, 'right', 'end');

        // Water above pin
        world.addFluid(PARTICLE_WATER, 200, 160, 35, 45);

        // Fish below
        world.setFish(200, 440);
      }
    },

    // ------------------------------------------------------------------------
    // LEVEL 2: Water meets Lava — Cool lava into stone first!
    // ------------------------------------------------------------------------
    {
      level: 2,
      objective: "Extinguish the hot lava with water before reaching the fish!",
      hint: "Pull the top pin first so water turns lava into solid stone!",
      setup: function (world) {
        // Outer vertical shaft
        world.addWall(100, 60, 100, 480, 10);
        world.addWall(300, 60, 300, 480, 10);
        world.addWall(100, 480, 300, 480, 10);

        // Pin 1 (Top: separates Water from Lava)
        world.addPin('pin1', 98, 180, 302, 180, 'right', 'end');

        // Pin 2 (Bottom: separates Lava from Fish)
        world.addPin('pin2', 98, 320, 302, 320, 'left', 'start');

        // Top chamber: Pure cool water (52 particles)
        world.addFluid(PARTICLE_WATER, 200, 120, 52, 40);

        // Middle chamber: Hot bubbling lava (16 particles)
        world.addFluid(PARTICLE_LAVA, 200, 250, 16, 28);

        // Bottom chamber: The Fish waiting to be saved
        world.setFish(200, 440);
      }
    },

    // ------------------------------------------------------------------------
    // LEVEL 3: Crab Hazard — Eliminate the crab with lava!
    // ------------------------------------------------------------------------
    {
      level: 3,
      objective: "Defeat the nasty crab with lava, then rescue the fish!",
      hint: "Drop the lava onto the crab to defeat it, then pour water for the fish!",
      setup: function (world) {
        world.addWall(80, 60, 80, 480, 10);
        world.addWall(320, 60, 320, 480, 10);
        world.addWall(80, 480, 320, 480, 10);

        // Divider between left (crab/lava) and right (fish/water)
        world.addWall(200, 60, 200, 360, 10);

        // Pin 1 (Lava above crab on left)
        world.addPin('pin1', 85, 200, 195, 200, 'left', 'start');

        // Pin 2 (Water above fish on right)
        world.addPin('pin2', 205, 240, 315, 240, 'right', 'end');

        // Lava top left
        world.addFluid(PARTICLE_LAVA, 140, 120, 24, 30);

        // Crab bottom left
        world.addCrab(140, 440, 100, 180);

        // Water top right (42 particles)
        world.addFluid(PARTICLE_WATER, 260, 140, 42, 35);

        // Fish bottom right
        world.setFish(260, 440);
      }
    },

    // ------------------------------------------------------------------------
    // LEVEL 4: Sequence Puzzle — Lava, Water, and 3 Pins
    // ------------------------------------------------------------------------
    {
      level: 4,
      objective: "Pull the pins in the correct order to save the fish!",
      hint: "Drop the water onto the lava to solidify it before pulling the bottom pin!",
      setup: function (world) {
        world.addWall(90, 60, 90, 490, 10);
        world.addWall(310, 60, 310, 490, 10);
        world.addWall(90, 490, 310, 490, 10);

        // 3 Horizontal Pins in a stack
        world.addPin('pin1', 88, 170, 312, 170, 'right', 'end');
        world.addPin('pin2', 88, 290, 312, 290, 'left', 'start');
        world.addPin('pin3', 88, 390, 312, 390, 'right', 'end');

        // Top: Water (52 particles)
        world.addFluid(PARTICLE_WATER, 200, 110, 52, 40);

        // Middle: Lava (16 particles)
        world.addFluid(PARTICLE_LAVA, 200, 230, 16, 30);

        // Bottom: Fish
        world.setFish(200, 450);
      }
    },

    // ------------------------------------------------------------------------
    // LEVEL 5: Collect Bonus Coins!
    // ------------------------------------------------------------------------
    {
      level: 5,
      objective: "Wash the gold coins into the fish bowl!",
      hint: "Release the water so it sweeps through the coins and fills the fish chamber!",
      setup: function (world) {
        world.addWall(80, 60, 80, 480, 10);
        world.addWall(320, 60, 320, 480, 10);
        world.addWall(80, 480, 320, 480, 10);

        world.addWall(80, 260, 220, 260, 10);
        world.addPin('pin1', 225, 260, 315, 260, 'right', 'end');

        world.addCoin(140, 230);
        world.addCoin(250, 350);
        world.addCoin(150, 420);

        world.addFluid(PARTICLE_WATER, 150, 150, 40, 45);
        world.setFish(240, 440);
      }
    },

    // ------------------------------------------------------------------------
    // LEVEL 6: Dual Lava Pits — Double Neutralization
    // ------------------------------------------------------------------------
    {
      level: 6,
      objective: "Neutralize both lava pits with clean water!",
      hint: "Release water so it flows across both lava chambers, then free the fish!",
      setup: function (world) {
        world.addWall(70, 60, 70, 490, 10);
        world.addWall(330, 60, 330, 490, 10);
        world.addWall(70, 490, 330, 490, 10);

        world.addWall(195, 180, 205, 360, 10);
        world.addPin('pinTop', 75, 180, 325, 180, 'right', 'end');
        world.addPin('pinBot', 75, 360, 325, 360, 'left', 'start');

        world.addFluid(PARTICLE_WATER, 200, 110, 56, 45);
        world.addFluid(PARTICLE_LAVA, 130, 280, 14, 25);
        world.addFluid(PARTICLE_LAVA, 270, 280, 14, 25);

        world.setFish(200, 450);
      }
    },

    // ------------------------------------------------------------------------
    // LEVEL 7: Cross Chambers
    // ------------------------------------------------------------------------
    {
      level: 7,
      objective: "Guide water through the diagonal chute!",
      hint: "Make sure lava doesn't touch the fish! Turn lava to rock first!",
      setup: function (world) {
        world.addWall(80, 60, 80, 480, 10);
        world.addWall(320, 60, 320, 480, 10);
        world.addWall(80, 480, 320, 480, 10);

        world.addWall(80, 220, 210, 220, 10);
        world.addPin('pin1', 215, 220, 315, 220, 'right', 'end');
        world.addPin('pin2', 85, 340, 195, 340, 'left', 'start');
        world.addWall(195, 340, 320, 340, 10);

        world.addFluid(PARTICLE_WATER, 150, 140, 36, 40);
        world.addFluid(PARTICLE_LAVA, 260, 290, 18, 28);

        world.setFish(140, 440);
      }
    },

    // ------------------------------------------------------------------------
    // LEVEL 8: Defeat the Double Crabs!
    // ------------------------------------------------------------------------
    {
      level: 8,
      objective: "Defeat both crabs with lava before sending water!",
      hint: "The crabs will pinch the fish! Pour lava down the left shoot to cook them!",
      setup: function (world) {
        world.addWall(80, 60, 80, 480, 10);
        world.addWall(320, 60, 320, 480, 10);
        world.addWall(80, 480, 320, 480, 10);

        world.addWall(190, 60, 190, 360, 10);
        world.addPin('pinLava', 85, 180, 185, 180, 'left', 'start');
        world.addPin('pinWater', 195, 180, 315, 180, 'right', 'end');

        world.addFluid(PARTICLE_LAVA, 135, 110, 25, 28);
        world.addCrab(135, 330, 95, 175);
        world.addCrab(135, 440, 95, 175);

        world.addFluid(PARTICLE_WATER, 255, 110, 40, 35);
        world.setFish(255, 440);
      }
    },

    // ------------------------------------------------------------------------
    // LEVEL 9: T-Junction Trap
    // ------------------------------------------------------------------------
    {
      level: 9,
      objective: "Navigate the T-junction pipes!",
      hint: "Cool down the lava reservoir before opening the fish passage!",
      setup: function (world) {
        world.addWall(80, 60, 80, 480, 10);
        world.addWall(320, 60, 320, 480, 10);
        world.addWall(80, 480, 320, 480, 10);

        world.addPin('pinTop', 85, 190, 315, 190, 'right', 'end');
        world.addPin('pinMid', 85, 310, 200, 310, 'left', 'start');
        world.addWall(200, 310, 320, 310, 10);

        world.addFluid(PARTICLE_WATER, 200, 120, 42, 40);
        world.addFluid(PARTICLE_LAVA, 140, 250, 16, 25);
        world.setFish(250, 430);
      }
    },

    // ------------------------------------------------------------------------
    // LEVEL 10: The Triple Chamber Lock
    // ------------------------------------------------------------------------
    {
      level: 10,
      objective: "Three chambers, one true path!",
      hint: "Mix water with lava on the right, then clear the lower gate!",
      setup: function (world) {
        world.addWall(70, 60, 70, 490, 10);
        world.addWall(330, 60, 330, 490, 10);
        world.addWall(70, 490, 330, 490, 10);

        world.addWall(195, 60, 195, 260, 10);
        world.addPin('p1', 75, 260, 190, 260, 'left', 'start');
        world.addPin('p2', 200, 260, 325, 260, 'right', 'end');
        world.addPin('p3', 75, 380, 325, 380, 'right', 'end');

        world.addFluid(PARTICLE_WATER, 135, 150, 42, 40);
        world.addFluid(PARTICLE_LAVA, 260, 150, 22, 35);

        world.setFish(200, 450);
      }
    },

    // ------------------------------------------------------------------------
    // LEVELS 11 - 20 (Master puzzle challenges with coins & mixed hazards)
    // ------------------------------------------------------------------------
    {
      level: 11,
      objective: "Keep the fish safe from cascading lava!",
      hint: "Let water flow down first to create a solid rock barrier!",
      setup: function (world) {
        world.addWall(80, 60, 80, 480, 10);
        world.addWall(320, 60, 320, 480, 10);
        world.addWall(80, 480, 320, 480, 10);

        world.addPin('p1', 85, 170, 315, 170, 'right', 'end');
        world.addPin('p2', 85, 310, 315, 310, 'left', 'start');

        world.addFluid(PARTICLE_WATER, 200, 110, 44, 40);
        world.addFluid(PARTICLE_LAVA, 200, 240, 20, 35);
        world.setFish(200, 430);
      }
    },
    {
      level: 12,
      objective: "Gather the shiny sunken gems!",
      hint: "Direct the water flow through the gems into the fish tank!",
      setup: function (world) {
        world.addWall(80, 60, 80, 480, 10);
        world.addWall(320, 60, 320, 480, 10);
        world.addWall(80, 480, 320, 480, 10);

        world.addWall(80, 240, 220, 240, 10);
        world.addPin('p1', 225, 240, 315, 240, 'right', 'end');

        world.addCoin(140, 200);
        world.addCoin(260, 320);
        world.addCoin(140, 420);

        world.addFluid(PARTICLE_WATER, 150, 130, 42, 40);
        world.setFish(230, 430);
      }
    },
    {
      level: 13,
      objective: "Crab patrol ahead! Use lava strategically!",
      hint: "Drop the lava onto the crab before pulling the water pin!",
      setup: function (world) {
        world.addWall(80, 60, 80, 480, 10);
        world.addWall(320, 60, 320, 480, 10);
        world.addWall(80, 480, 320, 480, 10);

        world.addWall(200, 60, 200, 360, 10);
        world.addPin('pLava', 85, 190, 195, 190, 'left', 'start');
        world.addPin('pWater', 205, 190, 315, 190, 'right', 'end');

        world.addFluid(PARTICLE_LAVA, 140, 110, 20, 30);
        world.addCrab(140, 420, 95, 185);

        world.addFluid(PARTICLE_WATER, 260, 110, 40, 35);
        world.setFish(260, 430);
      }
    },
    {
      level: 14,
      objective: "Build a stone dam with water and lava!",
      hint: "Solid stone will plug the dangerous bottom gap!",
      setup: function (world) {
        world.addWall(70, 60, 70, 490, 10);
        world.addWall(330, 60, 330, 490, 10);
        world.addWall(70, 490, 330, 490, 10);

        world.addPin('p1', 75, 180, 325, 180, 'right', 'end');
        world.addPin('p2', 75, 330, 325, 330, 'left', 'start');

        world.addFluid(PARTICLE_WATER, 200, 110, 46, 40);
        world.addFluid(PARTICLE_LAVA, 200, 250, 22, 35);
        world.setFish(200, 440);
      }
    },
    {
      level: 15,
      objective: "Split flow chamber challenge!",
      hint: "Cool the left lava and right lava one at a time!",
      setup: function (world) {
        world.addWall(70, 60, 70, 490, 10);
        world.addWall(330, 60, 330, 490, 10);
        world.addWall(70, 490, 330, 490, 10);

        world.addWall(195, 180, 205, 360, 10);
        world.addPin('pTop', 75, 180, 325, 180, 'right', 'end');
        world.addPin('pBot', 75, 360, 325, 360, 'left', 'start');

        world.addFluid(PARTICLE_WATER, 200, 110, 56, 45);
        world.addFluid(PARTICLE_LAVA, 130, 270, 16, 25);
        world.addFluid(PARTICLE_LAVA, 270, 270, 16, 25);

        world.setFish(200, 445);
      }
    },
    {
      level: 16,
      objective: "Clean the water reservoir!",
      hint: "Let water stream down smoothly to extinguish any threats!",
      setup: function (world) {
        world.addWall(80, 60, 80, 480, 10);
        world.addWall(320, 60, 320, 480, 10);
        world.addWall(80, 480, 320, 480, 10);

        world.addPin('p1', 85, 220, 315, 220, 'right', 'end');
        world.addCoin(150, 340);
        world.addCoin(250, 340);

        world.addFluid(PARTICLE_WATER, 200, 130, 44, 40);
        world.setFish(200, 430);
      }
    },
    {
      level: 17,
      objective: "Careful timing with the golden pins!",
      hint: "Remove pins in order: top first, then bottom!",
      setup: function (world) {
        world.addWall(80, 60, 80, 480, 10);
        world.addWall(320, 60, 320, 480, 10);
        world.addWall(80, 480, 320, 480, 10);

        world.addPin('p1', 85, 170, 315, 170, 'left', 'start');
        world.addPin('p2', 85, 320, 315, 320, 'right', 'end');

        world.addFluid(PARTICLE_WATER, 200, 110, 44, 40);
        world.addFluid(PARTICLE_LAVA, 200, 240, 18, 30);
        world.setFish(200, 435);
      }
    },
    {
      level: 18,
      objective: "Crabs and coins in the deep!",
      hint: "Eliminate the crab with lava, collect the gems, and refresh the fish!",
      setup: function (world) {
        world.addWall(80, 60, 80, 480, 10);
        world.addWall(320, 60, 320, 480, 10);
        world.addWall(80, 480, 320, 480, 10);

        world.addWall(190, 60, 190, 350, 10);
        world.addPin('pL', 85, 180, 185, 180, 'left', 'start');
        world.addPin('pR', 195, 180, 315, 180, 'right', 'end');

        world.addFluid(PARTICLE_LAVA, 135, 110, 20, 25);
        world.addCrab(135, 320, 95, 175);
        world.addCoin(250, 280);

        world.addFluid(PARTICLE_WATER, 255, 110, 42, 35);
        world.setFish(255, 435);
      }
    },
    {
      level: 19,
      objective: "The Grand Chamber Lock!",
      hint: "Step 1: Cool top lava. Step 2: Open passage to the fish tank!",
      setup: function (world) {
        world.addWall(70, 60, 70, 490, 10);
        world.addWall(330, 60, 330, 490, 10);
        world.addWall(70, 490, 330, 490, 10);

        world.addPin('p1', 75, 160, 325, 160, 'right', 'end');
        world.addPin('p2', 75, 290, 325, 290, 'left', 'start');
        world.addPin('p3', 75, 400, 325, 400, 'right', 'end');

        world.addFluid(PARTICLE_WATER, 200, 100, 46, 40);
        world.addFluid(PARTICLE_LAVA, 200, 220, 20, 35);
        world.setFish(200, 455);
      }
    },
    {
      level: 20,
      objective: "Master Level: The Ultimate Rescue!",
      hint: "You have all the skills! Extinguish lava, defeat the crab, and free the fish!",
      setup: function (world) {
        world.addWall(70, 60, 70, 490, 10);
        world.addWall(330, 60, 330, 490, 10);
        world.addWall(70, 490, 330, 490, 10);

        world.addWall(195, 60, 195, 340, 10);
        world.addPin('p1', 75, 180, 190, 180, 'left', 'start');
        world.addPin('p2', 200, 180, 325, 180, 'right', 'end');
        world.addPin('p3', 75, 340, 325, 340, 'right', 'end');

        world.addFluid(PARTICLE_LAVA, 135, 110, 22, 28);
        world.addCrab(135, 280, 95, 175);

        world.addCoin(260, 240);
        world.addFluid(PARTICLE_WATER, 260, 110, 48, 38);

        world.setFish(200, 450);
      }
    }
  ];

  // ==========================================================================
  // GAME CONTROLLER & UI WIRING
  // ==========================================================================
  var currentLevelIdx = 0;
  var currentWorld = null;
  var animFrameId = null;

  var canvas = document.getElementById('gameCanvas');
  var ctx = canvas ? canvas.getContext('2d') : null;

  // DOM Elements
  var screenMenu = document.getElementById('screenMenu');
  var screenLevels = document.getElementById('screenLevels');
  var screenGame = document.getElementById('screenGame');

  var hudLevelBadge = document.getElementById('hudLevelBadge');
  var hudObjectiveText = document.getElementById('hudObjectiveText');
  var menuProgressLabel = document.getElementById('menuProgressLabel');
  var menuProgFill = document.getElementById('menuProgFill');
  var levelsGrid = document.getElementById('levelsGrid');
  var soundIconSpan = document.getElementById('soundIconSpan');

  var modalWin = document.getElementById('modalWin');
  var modalFail = document.getElementById('modalFail');
  var failReasonText = document.getElementById('failReasonText');
  var modalHint = document.getElementById('modalHint');
  var hintBodyText = document.getElementById('hintBodyText');
  var modalHelp = document.getElementById('modalHelp');

  function showScreen(targetScreen) {
    [screenMenu, screenLevels, screenGame].forEach(function (s) {
      s.classList.remove('active');
    });
    targetScreen.classList.add('active');
  }

  function resizeCanvas() {
    if (!canvas) return;
    var rect = canvas.parentElement.getBoundingClientRect();
    var dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    if (ctx) {
      ctx.imageSmoothingEnabled = true;
    }
  }
  window.addEventListener('resize', resizeCanvas);

  function getCanvasCoords(clientX, clientY) {
    if (!canvas) return { x: 0, y: 0 };
    var rect = canvas.getBoundingClientRect();
    var scaleX = V_WIDTH / rect.width;
    var scaleY = V_HEIGHT / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  }

  function updateMenuProgress() {
    var maxLvl = TOTAL_LEVELS;
    var unlocked = Math.min(gameState.unlockedLevels, maxLvl);
    menuProgressLabel.textContent = 'Level ' + unlocked + ' of ' + maxLvl;
    menuProgFill.style.width = ((unlocked / maxLvl) * 100) + '%';
  }

  function renderLevelsGrid() {
    levelsGrid.innerHTML = '';
    for (var i = 0; i < TOTAL_LEVELS; i++) {
      var lvlNum = i + 1;
      var isCompleted = lvlNum < gameState.unlockedLevels;
      var isCurrent = lvlNum === gameState.unlockedLevels;
      var isLocked = lvlNum > gameState.unlockedLevels;

      var tile = document.createElement('button');
      tile.className = 'level-tile' + (isCompleted ? ' completed' : isCurrent ? ' current' : ' locked');

      if (isLocked) {
        tile.innerHTML = '🔒';
        tile.disabled = true;
      } else {
        var stars = gameState.levelStars[lvlNum] || 3;
        tile.innerHTML = [
          '<span>' + lvlNum + '</span>',
          isCompleted ? '<span class="tile-stars">' + '⭐'.repeat(stars) + '</span>' : ''
        ].join('');

        (function (levelIndex) {
          tile.onclick = function () {
            AudioEngine.playPin();
            startLevel(levelIndex);
            showScreen(screenGame);
          };
        })(i);
      }
      levelsGrid.appendChild(tile);
    }
  }

  // Start Level
  function startLevel(index) {
    if (index < 0) index = 0;
    if (index >= LEVEL_CONFIGS.length) index = 0;

    currentLevelIdx = index;
    var config = LEVEL_CONFIGS[index];

    // Hide modals
    modalWin.classList.add('hidden');
    modalFail.classList.add('hidden');
    modalHint.classList.add('hidden');

    // Update HUD
    hudLevelBadge.textContent = 'LEVEL ' + config.level;
    hudObjectiveText.textContent = config.objective;

    // Build World
    currentWorld = new PhysicsWorld();
    config.setup(currentWorld);

    currentWorld.onWin = function () {
      if (config.level >= gameState.unlockedLevels) {
        gameState.unlockedLevels = config.level + 1;
      }
      gameState.levelStars[config.level] = 3;
      saveGameState();
      updateMenuProgress();

      setTimeout(function () {
        modalWin.classList.remove('hidden');
      }, 700);
    };

    currentWorld.onFail = function (reason) {
      failReasonText.textContent = reason || "The fish couldn't be saved!";
      setTimeout(function () {
        modalFail.classList.remove('hidden');
      }, 700);
    };

    resizeCanvas();
    startLoop();
  }

  // Animation Loop
  function startLoop() {
    if (animFrameId) {
      cancelAnimationFrame(animFrameId);
    }

    function loop() {
      if (currentWorld && ctx && canvas) {
        currentWorld.update();
        var dpr = window.devicePixelRatio || 1;
        var rect = canvas.parentElement.getBoundingClientRect();
        var scaleX = (rect.width * dpr) / V_WIDTH;
        var scaleY = (rect.height * dpr) / V_HEIGHT;
        renderWorld(ctx, currentWorld, scaleX, scaleY);
      }
      animFrameId = requestAnimationFrame(loop);
    }
    animFrameId = requestAnimationFrame(loop);
  }

  // Canvas Touch / Mouse Input
  function handlePointerDown(e) {
    if (!currentWorld || currentWorld.isOver) return;
    var pt = e.touches && e.touches.length > 0 ? e.touches[0] : e;
    var coords = getCanvasCoords(pt.clientX, pt.clientY);
    currentWorld.checkPinClick(coords.x, coords.y);
  }

  if (canvas) {
    canvas.addEventListener('mousedown', handlePointerDown);
    canvas.addEventListener('touchstart', handlePointerDown, { passive: false });
  }

  // ==========================================================================
  // BUTTON ACTIONS
  // ==========================================================================
  document.getElementById('btnPlay').onclick = function () {
    AudioEngine.playPin();
    startLevel(gameState.unlockedLevels - 1);
    showScreen(screenGame);
  };

  document.getElementById('btnLevels').onclick = function () {
    AudioEngine.playPin();
    renderLevelsGrid();
    showScreen(screenLevels);
  };

  document.getElementById('btnBackFromLevels').onclick = function () {
    AudioEngine.playPin();
    showScreen(screenMenu);
    updateMenuProgress();
  };

  document.getElementById('btnHomeFromGame').onclick = function () {
    AudioEngine.playPin();
    showScreen(screenMenu);
    updateMenuProgress();
  };

  document.getElementById('btnResetLevel').onclick = function () {
    AudioEngine.playPin();
    startLevel(currentLevelIdx);
  };

  document.getElementById('btnSoundToggle').onclick = function () {
    var on = AudioEngine.toggle();
    soundIconSpan.textContent = on ? '🔊' : '🔇';
    AudioEngine.playPin();
  };

  document.getElementById('btnHint').onclick = function () {
    AudioEngine.playPin();
    if (LEVEL_CONFIGS[currentLevelIdx]) {
      hintBodyText.textContent = LEVEL_CONFIGS[currentLevelIdx].hint;
      modalHint.classList.remove('hidden');
    }
  };

  document.getElementById('btnCloseHint').onclick = function () {
    AudioEngine.playPin();
    modalHint.classList.add('hidden');
  };

  document.getElementById('btnHowToPlay').onclick = function () {
    AudioEngine.playPin();
    modalHelp.classList.remove('hidden');
  };

  document.getElementById('btnCloseHelp').onclick = function () {
    AudioEngine.playPin();
    modalHelp.classList.add('hidden');
  };

  document.getElementById('btnExit').onclick = function () {
    AudioEngine.playPin();
    if (confirm('Exit Rescue The Fish? Your progress is saved!')) {
      try { window.parent.postMessage({ action: 'exit_game' }, '*'); } catch (e) { }
      try { window.history.back(); } catch (e) { }
      setTimeout(function () { window.close(); }, 300);
    }
  };

  document.getElementById('btnNextLevel').onclick = function () {
    AudioEngine.playPin();
    if (currentLevelIdx + 1 < TOTAL_LEVELS) {
      startLevel(currentLevelIdx + 1);
    } else {
      modalWin.classList.add('hidden');
      renderLevelsGrid();
      showScreen(screenLevels);
    }
  };

  document.getElementById('btnReplayWin').onclick = function () {
    AudioEngine.playPin();
    startLevel(currentLevelIdx);
  };

  document.getElementById('btnRetryFail').onclick = function () {
    AudioEngine.playPin();
    startLevel(currentLevelIdx);
  };

  // ==========================================================================
  // INITIALIZATION
  // ==========================================================================
  updateMenuProgress();
  showScreen(screenMenu);

})();

