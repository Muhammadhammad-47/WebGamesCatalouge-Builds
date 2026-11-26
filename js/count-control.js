/* ==========================================================================
   COUNT CONTROL LEGENDS — 3D Crowd Runner & Math Gate Battle
   Three.js 3D skybridge, animated stickmen crowd, blue/red math gates,
   spinning saw traps, enemy squad clashes, Giant Boss & Rainbow Staircase!
   ========================================================================== */
(() => {
  'use strict';

  // --------------------------------------------------------------------------
  // 1. SKINS & AUDIO SYNTHESIZER
  // --------------------------------------------------------------------------
  const SKINS = [
    { id: 'blue',   name: 'Classic Blue',  color: 0x2563eb, hex: '#2563eb', price: 0 },
    { id: 'cyan',   name: 'Neon Cyan',     color: 0x06b6d4, hex: '#06b6d4', price: 150 },
    { id: 'gold',   name: 'Gold Knights',  color: 0xf59e0b, hex: '#f59e0b', price: 300 },
    { id: 'purple', name: 'Royal Violet',  color: 0x8b5cf6, hex: '#8b5cf6', price: 450 },
    { id: 'mint',   name: 'Emerald Squad', color: 0x10b981, hex: '#10b981', price: 600 }
  ];

  class CrowdAudio {
    constructor() {
      this.ctx = null;
      this.enabled = localStorage.getItem('ccl_sound') !== 'false';
    }
    init() {
      if (!this.ctx && (window.AudioContext || window.webkitAudioContext)) {
        const AC = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AC();
      }
      if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
    }
    toggle() {
      this.enabled = !this.enabled;
      localStorage.setItem('ccl_sound', String(this.enabled));
      if (this.enabled) this.playTone(620, 0.08, 'sine');
      return this.enabled;
    }
    playTone(freq, dur, type = 'sine', vol = 0.12) {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(vol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
      osc.connect(gain); gain.connect(this.ctx.destination);
      osc.start(now); osc.stop(now + dur + 0.01);
    }
    playGateGood() {
      this.playTone(523, 0.08, 'triangle', 0.14);
      setTimeout(() => this.playTone(784, 0.12, 'triangle', 0.14), 55);
    }
    playGateBad() {
      this.playTone(190, 0.14, 'sawtooth', 0.1);
    }
    playCoin() {
      this.playTone(987, 0.06, 'sine', 0.1);
      setTimeout(() => this.playTone(1318, 0.09, 'sine', 0.1), 45);
    }
    playPop() {
      this.playTone(260 + Math.random() * 140, 0.05, 'triangle', 0.08);
    }
    playStep(idx) {
      this.playTone(440 * Math.pow(1.09, idx), 0.1, 'triangle', 0.12);
    }
    playVictory() {
      [523, 659, 784, 1046].forEach((f, i) => {
        setTimeout(() => this.playTone(f, 0.22, 'triangle', 0.14), i * 85);
      });
    }
  }

  // --------------------------------------------------------------------------
  // 2. CANVAS TEXTURE HELPERS (MATH GATES & RAINBOW STEPS)
  // --------------------------------------------------------------------------
  function createGateTexture(label, isGood) {
    const c = document.createElement('canvas');
    c.width = 256; c.height = 256;
    const ctx = c.getContext('2d');

    ctx.fillStyle = isGood ? 'rgba(14, 165, 233, 0.42)' : 'rgba(244, 63, 94, 0.45)';
    ctx.fillRect(0, 0, 256, 256);

    // Inner glow border
    ctx.strokeStyle = isGood ? '#7dd3fc' : '#fda4af';
    ctx.lineWidth = 14;
    ctx.strokeRect(8, 8, 240, 240);

    // Bold math label
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 84px Fredoka, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0,0,0,0.45)';
    ctx.shadowBlur = 10;
    ctx.fillText(label, 128, 128);

    const tex = new THREE.CanvasTexture(c);
    return tex;
  }

  function createStepTexture(label, colorHex) {
    const c = document.createElement('canvas');
    c.width = 256; c.height = 128;
    const ctx = c.getContext('2d');
    ctx.fillStyle = colorHex;
    ctx.fillRect(0, 0, 256, 128);
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 8;
    ctx.strokeRect(4, 4, 248, 120);
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 56px Fredoka, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, 128, 64);
    return new THREE.CanvasTexture(c);
  }

  // --------------------------------------------------------------------------
  // 3. STICKMAN MESH BUILDER
  // --------------------------------------------------------------------------
  const sharedGeoms = {};
  function getSharedGeoms() {
    if (!sharedGeoms.head) {
      sharedGeoms.head = new THREE.SphereGeometry(0.14, 10, 10);
      sharedGeoms.body = new THREE.CylinderGeometry(0.11, 0.09, 0.34, 8);
      sharedGeoms.limb = new THREE.CylinderGeometry(0.045, 0.04, 0.24, 6);
    }
    return sharedGeoms;
  }

  function createStickmanMesh(mat) {
    const g = getSharedGeoms();
    const group = new THREE.Group();

    const head = new THREE.Mesh(g.head, mat);
    head.position.y = 0.56;
    group.add(head);

    const body = new THREE.Mesh(g.body, mat);
    body.position.y = 0.32;
    group.add(body);

    const legL = new THREE.Mesh(g.limb, mat);
    legL.position.set(-0.06, 0.12, 0);
    group.add(legL);

    const legR = new THREE.Mesh(g.limb, mat);
    legR.position.set(0.06, 0.12, 0);
    group.add(legR);

    group.userData = { legL, legR, phase: Math.random() * Math.PI * 2 };
    return group;
  }

  // --------------------------------------------------------------------------
  // 4. MAIN GAME CLASS
  // --------------------------------------------------------------------------
  class CountControlGame {
    constructor() {
      this.audio = new CrowdAudio();
      this.canvas = document.getElementById('cclCanvas');
      this.overlay = document.getElementById('cclOverlayCanvas');
      this.oCtx = this.overlay.getContext('2d');

      // Progression & Upgrades
      this.coins = parseInt(localStorage.getItem('ccl_coins') || '200', 10);
      this.stage = parseInt(localStorage.getItem('ccl_stage') || '1', 10);
      this.countLvl = parseInt(localStorage.getItem('ccl_count_lvl') || '1', 10);
      this.incomeLvl = parseInt(localStorage.getItem('ccl_income_lvl') || '1', 10);
      this.unlockedSkins = JSON.parse(localStorage.getItem('ccl_skins') || '["blue"]');
      this.equippedSkin = localStorage.getItem('ccl_skin') || 'blue';

      // Game State
      this.state = 'MENU'; // MENU | RUNNING | CLASH | BOSS | STAIRS | VICTORY | DEFEAT
      this.trackLength = 120;
      this.crowdZ = 0;
      this.crowdX = 0;
      this.targetX = 0;
      this.crowdCount = 1;
      this.runSpeed = 13.5;

      // Dynamic Stage Objects
      this.gates = [];
      this.saws = [];
      this.coinsList = [];
      this.enemies = [];
      this.boss = null;
      this.stairSteps = [];
      this.runnerMeshes = [];
      this.clouds = [];
      this.particles = [];
      this.floatingTexts = [];

      // Input
      this.isDragging = false;
      this.lastPtrX = 0;
      this.keys = { left: false, right: false };

      this.initThree();
      this.bindUI();
      this.bindInput();
      this.refreshMenuUI();
      this.buildStage(this.stage, true);

      this.lastTime = performance.now();
      requestAnimationFrame(this.loop.bind(this));
    }

    initThree() {
      this.scene = new THREE.Scene();
      this.scene.fog = new THREE.Fog(0xbae6fd, 35, 110);

      this.camera = new THREE.PerspectiveCamera(52, window.innerWidth / window.innerHeight, 0.1, 160);
      this.camera.position.set(0, 7.5, 9.5);
      this.camera.lookAt(0, 1, -6);

      this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: true });
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      this.renderer.setSize(window.innerWidth, window.innerHeight);

      const hemi = new THREE.HemisphereLight(0xffffff, 0x7dd3fc, 0.9);
      this.scene.add(hemi);

      const dir = new THREE.DirectionalLight(0xfffbeb, 0.85);
      dir.position.set(10, 22, 12);
      this.scene.add(dir);

      this.worldGroup = new THREE.Group();
      this.scene.add(this.worldGroup);

      this.crowdGroup = new THREE.Group();
      this.scene.add(this.crowdGroup);

      // Build background clouds
      const cloudMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.95 });
      for (let i = 0; i < 14; i++) {
        const c = new THREE.Mesh(new THREE.SphereGeometry(1.6 + Math.random() * 1.4, 10, 8), cloudMat);
        c.scale.set(1.8, 0.6, 1.2);
        c.position.set((Math.random() - 0.5) * 45, 5 + Math.random() * 8, -Math.random() * 130);
        this.scene.add(c);
        this.clouds.push(c);
      }

      this.handleResize();
      window.addEventListener('resize', () => this.handleResize());
    }

    handleResize() {
      const w = window.innerWidth;
      const h = window.innerHeight;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
      this.overlay.width = w;
      this.overlay.height = h;
    }

    getPlayerMat() {
      const sk = SKINS.find(s => s.id === this.equippedSkin) || SKINS[0];
      return new THREE.MeshStandardMaterial({ color: sk.color, roughness: 0.45 });
    }

    clearWorld() {
      while (this.worldGroup.children.length > 0) {
        this.worldGroup.remove(this.worldGroup.children[0]);
      }
      while (this.crowdGroup.children.length > 0) {
        this.crowdGroup.remove(this.crowdGroup.children[0]);
      }
      this.gates = [];
      this.saws = [];
      this.coinsList = [];
      this.enemies = [];
      this.boss = null;
      this.stairSteps = [];
      this.runnerMeshes = [];
      this.particles = [];
      this.floatingTexts = [];
    }

    buildStage(stageNum, isPreview = false) {
      this.clearWorld();
      this.trackLength = 110 + Math.min(80, stageNum * 10);
      this.crowdZ = 0;
      this.crowdX = 0;
      this.targetX = 0;
      this.crowdCount = 1 + (this.countLvl - 1) * 2;
      this.runSpeed = 13.5 + Math.min(4.5, stageNum * 0.35);

      // 1. Skybridge Track
      const trackMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.8 });
      const track = new THREE.Mesh(new THREE.BoxGeometry(6.6, 0.8, this.trackLength + 20), trackMat);
      track.position.set(0, -0.4, -this.trackLength / 2 + 2);
      this.worldGroup.add(track);

      // Teal side rails
      const railMat = new THREE.MeshStandardMaterial({ color: 0x0ea5e9, roughness: 0.5 });
      [-3.35, 3.35].forEach(rx => {
        const rail = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.96, this.trackLength + 20), railMat);
        rail.position.set(rx, -0.25, -this.trackLength / 2 + 2);
        this.worldGroup.add(rail);
      });

      // Finish Line Checkered Strip before Boss Arena
      const finishMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.4 });
      const finishLine = new THREE.Mesh(new THREE.BoxGeometry(6.4, 0.05, 1.0), finishMat);
      finishLine.position.set(0, 0.02, -this.trackLength + 12);
      this.worldGroup.add(finishLine);

      // 2. Populate Math Gate Pairs, Saw Traps, Coins, and Enemy Squads along track
      const segs = Math.floor((this.trackLength - 28) / 16);
      for (let i = 1; i <= segs; i++) {
        const z = -i * 15.5;

        // Alternate Math Gate Pairs & Obstacles/Enemies
        if (i % 2 === 1 || i === 1) {
          this.spawnGatePair(z, stageNum, i > 2 && stageNum >= 2);
        } else {
          // Saw Blade or Enemy Squad
          if (i % 4 === 2) {
            this.spawnSawTrap(z);
          } else {
            const enemyCnt = Math.max(4, Math.floor((6 + i * 3 + stageNum * 4) * 0.75));
            this.spawnEnemySquad(z, enemyCnt);
          }
        }

        // Gold Coins between segments
        for (let c = 0; c < 3; c++) {
          this.spawnCoin((Math.random() - 0.5) * 4.2, z - 6 - c * 1.6);
        }
      }

      // 3. Giant Fortress Boss at end of bridge
      const bossHp = 18 + stageNum * 14;
      this.spawnBoss(-this.trackLength + 3, bossHp);

      // 4. Rainbow Multiplier Staircase behind Boss
      const stepColors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'];
      const mults = [1.2, 1.5, 2.0, 2.5, 3.0, 4.0, 5.0, 8.0];
      for (let s = 0; s < stepColors.length; s++) {
        const stepMat = new THREE.MeshStandardMaterial({
          map: createStepTexture(`${mults[s]}x`, stepColors[s]),
          roughness: 0.6
        });
        const step = new THREE.Mesh(new THREE.BoxGeometry(6.6, 0.9, 3.6), stepMat);
        step.position.set(0, s * 0.85, -this.trackLength - 5 - s * 3.6);
        this.worldGroup.add(step);
        this.stairSteps.push({ z: step.position.z, y: step.position.y + 0.45, mult: mults[s] });
      }

      this.syncCrowdVisuals();
      if (!isPreview) {
        this.state = 'RUNNING';
      }
    }

    spawnGatePair(z, stageNum, moving = false) {
      const opsGood = [
        { op: '+', val: 4 + stageNum * 2 },
        { op: '+', val: 8 + stageNum * 3 },
        { op: '×', val: 2 },
        { op: '×', val: stageNum >= 4 ? 3 : 2 }
      ];
      const opsBad = [
        { op: '-', val: 3 + stageNum * 2 },
        { op: '÷', val: 2 }
      ];

      const goodFirst = Math.random() < 0.5;
      const gSpec = opsGood[Math.floor(Math.random() * opsGood.length)];
      const bSpec = opsBad[Math.floor(Math.random() * opsBad.length)];

      const pair = { z, triggered: false, moving, phase: Math.random() * Math.PI * 2, gates: [] };
      const defs = [
        { x: -1.55, isGood: goodFirst, spec: goodFirst ? gSpec : bSpec },
        { x:  1.55, isGood: !goodFirst, spec: !goodFirst ? gSpec : bSpec }
      ];

      defs.forEach(d => {
        const label = `${d.spec.op}${d.spec.val}`;
        const mat = new THREE.MeshBasicMaterial({
          map: createGateTexture(label, d.isGood),
          transparent: true,
          side: THREE.DoubleSide
        });
        const pane = new THREE.Mesh(new THREE.PlaneGeometry(2.75, 2.2), mat);
        pane.position.set(d.x, 1.1, z);
        this.worldGroup.add(pane);

        // Pillars
        const pillarMat = new THREE.MeshStandardMaterial({ color: d.isGood ? 0x0284c7 : 0xe11d48 });
        [-1.38, 1.38].forEach(px => {
          const pil = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 2.3, 8), pillarMat);
          pil.position.set(d.x + px, 1.15, z);
          this.worldGroup.add(pil);
        });

        pair.gates.push({ mesh: pane, baseX: d.x, x: d.x, isGood: d.isGood, op: d.spec.op, val: d.spec.val });
      });

      this.gates.push(pair);
    }

    spawnSawTrap(z) {
      const mat = new THREE.MeshStandardMaterial({ color: 0xe11d48, metalness: 0.4, roughness: 0.3 });
      const saw = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.95, 0.18, 14), mat);
      saw.rotation.x = Math.PI / 2;
      saw.position.set(0, 0.55, z);
      this.worldGroup.add(saw);
      this.saws.push({ mesh: saw, z, phase: Math.random() * Math.PI * 2, hitCooldown: 0 });
    }

    spawnCoin(x, z) {
      const mat = new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.5, roughness: 0.25 });
      const coin = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.08, 12), mat);
      coin.rotation.x = Math.PI / 2;
      coin.position.set(x, 0.5, z);
      this.worldGroup.add(coin);
      this.coinsList.push({ mesh: coin, x, z, collected: false });
    }

    spawnEnemySquad(z, count) {
      const ex = (Math.random() - 0.5) * 2.2;
      const mat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.45 });
      const group = new THREE.Group();
      group.position.set(ex, 0, z);
      const visCount = Math.min(20, count);
      for (let i = 0; i < visCount; i++) {
        const m = createStickmanMesh(mat);
        const r = 0.24 * Math.sqrt(i);
        const a = i * 2.399;
        m.position.set(Math.cos(a) * r, 0, Math.sin(a) * r);
        group.add(m);
      }
      this.worldGroup.add(group);
      this.enemies.push({ group, x: ex, z, count, defeated: false });
    }

    spawnBoss(z, hp) {
      const mat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.4 });
      const bossGroup = new THREE.Group();
      bossGroup.position.set(0, 0, z);
      const giant = createStickmanMesh(mat);
      giant.scale.set(3.2, 3.2, 3.2);
      bossGroup.add(giant);
      this.worldGroup.add(bossGroup);
      this.boss = { group: bossGroup, mesh: giant, z, hp, maxHp: hp, defeated: false };
    }

    syncCrowdVisuals() {
      const targetVis = Math.min(60, Math.max(0, this.crowdCount));
      const mat = this.getPlayerMat();

      while (this.runnerMeshes.length < targetVis) {
        const m = createStickmanMesh(mat);
        this.crowdGroup.add(m);
        this.runnerMeshes.push(m);
      }
      while (this.runnerMeshes.length > targetVis) {
        const m = this.runnerMeshes.pop();
        this.crowdGroup.remove(m);
      }

      // Position in tight phyllotaxis spiral
      this.runnerMeshes.forEach((m, i) => {
        if (this.state !== 'STAIRS') {
          const r = i === 0 ? 0 : 0.25 * Math.sqrt(i);
          const a = i * 2.39996;
          m.position.set(Math.cos(a) * r, 0, Math.sin(a) * r);
        }
      });
    }

    addPopBurst(worldX, worldY, worldZ, colorHex, count = 10) {
      for (let i = 0; i < count; i++) {
        this.particles.push({
          x: worldX, y: worldY, z: worldZ,
          vx: (Math.random() - 0.5) * 6,
          vy: 2 + Math.random() * 5,
          vz: (Math.random() - 0.5) * 6,
          color: colorHex,
          life: 0.6
        });
      }
    }

    // ------------------------------------------------------------------------
    // 5. GAME LOOP & STATE MACHINE
    // ------------------------------------------------------------------------
    startRun() {
      this.audio.init();
      document.getElementById('menuScreen').classList.add('hidden');
      document.getElementById('victoryModal').classList.add('hidden');
      document.getElementById('defeatModal').classList.add('hidden');
      document.getElementById('bossHpWrap').classList.add('hidden');
      document.getElementById('gameHud').classList.remove('hidden');
      document.getElementById('hudStageLabel').textContent = `STAGE ${this.stage}`;
      document.getElementById('hudCoins').textContent = this.coins;
      this.buildStage(this.stage, false);
    }

    loop(now) {
      const dt = Math.min(0.05, (now - this.lastTime) / 1000);
      this.lastTime = now;

      this.update(dt, now * 0.001);
      this.renderer.render(this.scene, this.camera);
      this.renderOverlay(dt);

      requestAnimationFrame(this.loop.bind(this));
    }

    update(dt, t) {
      // Animate clouds
      this.clouds.forEach(c => {
        c.position.x += dt * 0.4;
        if (c.position.x > 26) c.position.x = -26;
      });

      // Animate stickmen running
      this.runnerMeshes.forEach((m) => {
        const u = m.userData;
        if (this.state === 'RUNNING' || this.state === 'MENU' || this.state === 'CLASH' || this.state === 'BOSS') {
          const swing = Math.sin(t * 16 + u.phase) * 0.6;
          u.legL.rotation.x = swing;
          u.legR.rotation.x = -swing;
          m.position.y = Math.abs(Math.sin(t * 16 + u.phase)) * 0.08;
        } else {
          u.legL.rotation.x = 0;
          u.legR.rotation.x = 0;
        }
      });

      if (this.state === 'MENU') {
        this.camera.position.set(Math.sin(t * 0.4) * 1.5, 4.5, 6.2);
        this.camera.lookAt(0, 0.5, -2);
        return;
      }

      if (this.state === 'RUNNING') {
        // Keyboard steer
        if (this.keys.left) this.targetX -= 7.5 * dt;
        if (this.keys.right) this.targetX += 7.5 * dt;
        this.targetX = Math.max(-2.5, Math.min(2.5, this.targetX));
        this.crowdX += (this.targetX - this.crowdX) * (1 - Math.exp(-16 * dt));

        // Forward run
        this.crowdZ -= this.runSpeed * dt;
        this.crowdGroup.position.set(this.crowdX, 0, this.crowdZ);

        // Update HUD Progress
        const pct = Math.min(100, Math.max(0, (-this.crowdZ / (this.trackLength - 5)) * 100));
        document.getElementById('hudTrackFill').style.width = `${pct}%`;

        // 1. Check Math Gates
        this.gates.forEach(pair => {
          if (pair.moving) {
            pair.gates.forEach((g, idx) => {
              const offset = Math.sin(t * 2.2 + pair.phase) * 0.7;
              g.x = g.baseX + (idx === 0 ? offset : -offset);
              g.mesh.position.x = g.x;
            });
          }
          if (!pair.triggered && Math.abs(this.crowdZ - pair.z) < 0.7) {
            pair.triggered = true;
            // Pick closer gate
            const chosen = Math.abs(this.crowdX - pair.gates[0].x) <= Math.abs(this.crowdX - pair.gates[1].x)
              ? pair.gates[0] : pair.gates[1];
            this.applyGateMath(chosen);
          }
        });

        // 2. Check Spinning Saw Traps
        this.saws.forEach(s => {
          s.mesh.rotation.y += dt * 10;
          const sx = Math.sin(t * 2.5 + s.phase) * 2.1;
          s.mesh.position.x = sx;
          if (s.hitCooldown > 0) s.hitCooldown -= dt;
          if (s.hitCooldown <= 0 && Math.abs(this.crowdZ - s.z) < 0.8 && Math.abs(this.crowdX - sx) < 1.25) {
            s.hitCooldown = 0.45;
            const loss = Math.max(1, Math.ceil(this.crowdCount * 0.25));
            this.crowdCount = Math.max(0, this.crowdCount - loss);
            this.audio.playGateBad();
            this.addPopBurst(this.crowdX, 0.5, this.crowdZ, '#ef4444', 12);
            this.syncCrowdVisuals();
            if (this.crowdCount <= 0) this.triggerDefeat('Sliced by a spinning saw!');
          }
        });

        // 3. Check Coins
        this.coinsList.forEach(c => {
          if (c.collected) return;
          c.mesh.rotation.z += dt * 4;
          if (Math.abs(this.crowdZ - c.z) < 1.0 && Math.abs(this.crowdX - c.x) < 1.35) {
            c.collected = true;
            c.mesh.visible = false;
            const gain = Math.round(5 * (1 + (this.incomeLvl - 1) * 0.2));
            this.coins += gain;
            localStorage.setItem('ccl_coins', String(this.coins));
            document.getElementById('hudCoins').textContent = this.coins;
            this.audio.playCoin();
          }
        });

        // 4. Check Enemy Squad Clashes
        this.enemies.forEach(en => {
          if (en.defeated) return;
          if (Math.abs(this.crowdZ - en.z) < 1.5 && Math.abs(this.crowdX - en.x) < 2.1) {
            this.state = 'CLASH';
            this.activeEnemy = en;
          }
        });

        // 5. Check Boss Arena Arrival
        if (this.boss && !this.boss.defeated && this.crowdZ <= this.boss.z + 2.2) {
          this.state = 'BOSS';
          this.crowdX = 0;
          this.crowdGroup.position.x = 0;
          document.getElementById('bossHpWrap').classList.remove('hidden');
        }
      } else if (this.state === 'CLASH' && this.activeEnemy) {
        const en = this.activeEnemy;
        const clashRate = Math.max(12, Math.ceil(this.crowdCount * 2.5)) * dt;
        const step = Math.max(1, Math.round(clashRate));
        if (this.crowdCount > 0 && en.count > 0) {
          this.crowdCount = Math.max(0, this.crowdCount - step);
          en.count = Math.max(0, en.count - step);
          this.audio.playPop();
          this.addPopBurst(this.crowdX, 0.5, this.crowdZ, '#38bdf8', 4);
          this.addPopBurst(en.x, 0.5, en.z, '#ef4444', 4);
          this.syncCrowdVisuals();
        }
        if (this.crowdCount <= 0) {
          this.triggerDefeat('Overwhelmed by the Red Squad!');
        } else if (en.count <= 0) {
          en.defeated = true;
          en.group.visible = false;
          this.activeEnemy = null;
          this.state = 'RUNNING';
        }
      } else if (this.state === 'BOSS' && this.boss) {
        const b = this.boss;
        const hitAmt = Math.max(1, Math.round(dt * 18));
        if (this.crowdCount > 0 && b.hp > 0) {
          this.crowdCount = Math.max(0, this.crowdCount - hitAmt);
          b.hp = Math.max(0, b.hp - hitAmt);
          this.audio.playPop();
          this.addPopBurst(0, 1.2, b.z, '#ef4444', 6);
          this.syncCrowdVisuals();
          document.getElementById('bossHpFill').style.width = `${(b.hp / b.maxHp) * 100}%`;
        }
        if (b.hp <= 0) {
          b.defeated = true;
          b.group.visible = false;
          document.getElementById('bossHpWrap').classList.add('hidden');
          this.addPopBurst(0, 1.5, b.z, '#facc15', 35);
          if (this.crowdCount <= 0) this.crowdCount = 1;
          this.syncCrowdVisuals();
          this.state = 'STAIRS';
          this.stairTimer = 0;
          this.currentMult = 1.2;
          this.lastStepIdx = -1;
        } else if (this.crowdCount <= 0) {
          this.triggerDefeat('The Fortress Boss was too strong!');
        }
      } else if (this.state === 'STAIRS') {
        this.crowdZ -= 9.5 * dt;
        const stepIdx = Math.min(this.stairSteps.length - 1, Math.max(0, Math.floor((-this.crowdZ - this.trackLength - 3) / 3.6)));
        const step = this.stairSteps[stepIdx];
        if (step && stepIdx > this.lastStepIdx) {
          this.lastStepIdx = stepIdx;
          this.currentMult = step.mult;
          this.audio.playStep(stepIdx);
          // Drop off a layer of runners on each rainbow step
          this.crowdCount = Math.max(0, this.crowdCount - Math.max(1, Math.ceil(this.crowdCount * 0.25)));
          this.syncCrowdVisuals();
        }
        const curY = step ? step.y : 0;
        this.crowdGroup.position.set(0, curY, this.crowdZ);
        if (this.crowdCount <= 0 || stepIdx >= this.stairSteps.length - 1) {
          this.triggerVictory();
        }
      }

      // Smooth Chase Camera
      this.camera.position.set(this.crowdX * 0.35, this.crowdGroup.position.y + 7.4, this.crowdZ + 9.2);
      this.camera.lookAt(this.crowdX * 0.25, this.crowdGroup.position.y + 0.8, this.crowdZ - 5.5);
    }

    applyGateMath(gate) {
      const before = this.crowdCount;
      if (gate.op === '+') this.crowdCount += gate.val;
      else if (gate.op === '×') this.crowdCount *= gate.val;
      else if (gate.op === '-') this.crowdCount = Math.max(0, this.crowdCount - gate.val);
      else if (gate.op === '÷') this.crowdCount = Math.max(1, Math.floor(this.crowdCount / gate.val));

      if (gate.isGood) {
        this.audio.playGateGood();
        this.addPopBurst(this.crowdX, 0.8, this.crowdZ, '#38bdf8', 14);
      } else {
        this.audio.playGateBad();
        this.addPopBurst(this.crowdX, 0.8, this.crowdZ, '#f43f5e', 14);
      }

      this.syncCrowdVisuals();
      if (this.crowdCount <= 0) {
        this.triggerDefeat('Your squad dropped to 0!');
      } else if (before !== this.crowdCount) {
        this.floatingTexts.push({
          text: `${gate.op}${gate.val}`,
          x: window.innerWidth / 2,
          y: window.innerHeight * 0.56,
          color: gate.isGood ? '#0284c7' : '#e11d48',
          life: 0.9
        });
      }
    }

    triggerVictory() {
      if (this.state === 'VICTORY') return;
      this.state = 'VICTORY';
      this.audio.playVictory();
      const mult = this.currentMult || 1.5;
      const baseReward = 45 + this.stage * 15;
      const incomeBonus = 1 + (this.incomeLvl - 1) * 0.2;
      const totalCoins = Math.round(baseReward * mult * incomeBonus);

      this.coins += totalCoins;
      this.stage++;
      localStorage.setItem('ccl_coins', String(this.coins));
      localStorage.setItem('ccl_stage', String(this.stage));

      document.getElementById('vicMultBadge').textContent = `🏆 ${mult}x RAINBOW BONUS!`;
      document.getElementById('vicCoinsEarned').textContent = totalCoins;
      document.getElementById('hudCoins').textContent = this.coins;
      document.getElementById('victoryModal').classList.remove('hidden');
      this.refreshMenuUI();
    }

    triggerDefeat(reason) {
      if (this.state === 'DEFEAT') return;
      this.state = 'DEFEAT';
      this.audio.playGateBad();
      document.getElementById('bossHpWrap').classList.add('hidden');
      document.getElementById('loseDesc').textContent = reason;
      document.getElementById('defeatModal').classList.remove('hidden');
    }

    // ------------------------------------------------------------------------
    // 6. 2D OVERLAY (CROWD COUNT BADGE, ENEMY BADGES, PARTICLES)
    // ------------------------------------------------------------------------
    projectToScreen(x, y, z) {
      const v = new THREE.Vector3(x, y, z);
      v.project(this.camera);
      return {
        x: (v.x * 0.5 + 0.5) * window.innerWidth,
        y: (-v.y * 0.5 + 0.5) * window.innerHeight,
        visible: v.z < 1
      };
    }

    renderOverlay(dt) {
      const ctx = this.oCtx;
      ctx.clearRect(0, 0, this.overlay.width, this.overlay.height);

      // Draw Player Crowd Badge
      if (this.state !== 'MENU' && this.crowdCount > 0) {
        const p = this.projectToScreen(this.crowdX, this.crowdGroup.position.y + 1.45, this.crowdZ);
        if (p.visible) {
          this.drawCountPill(ctx, p.x, p.y, `${this.crowdCount}`, '#0284c7');
        }
      }

      // Draw Enemy Squad Badges
      if (this.state === 'RUNNING' || this.state === 'CLASH') {
        this.enemies.forEach(en => {
          if (en.defeated || en.count <= 0) return;
          const p = this.projectToScreen(en.x, 1.45, en.z);
          if (p.visible) {
            this.drawCountPill(ctx, p.x, p.y, `${en.count}`, '#dc2626');
          }
        });
      }

      // Particles
      for (let i = this.particles.length - 1; i >= 0; i--) {
        const pt = this.particles[i];
        pt.life -= dt;
        if (pt.life <= 0) { this.particles.splice(i, 1); continue; }
        pt.vy -= 14 * dt;
        pt.x += pt.vx * dt; pt.y += pt.vy * dt; pt.z += pt.vz * dt;
        const scr = this.projectToScreen(pt.x, pt.y, pt.z);
        if (scr.visible) {
          ctx.save();
          ctx.globalAlpha = Math.min(1, pt.life * 2);
          ctx.fillStyle = pt.color;
          ctx.beginPath();
          ctx.arc(scr.x, scr.y, 5, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }

      // Floating Gate Math Texts
      for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
        const ft = this.floatingTexts[i];
        ft.life -= dt;
        if (ft.life <= 0) { this.floatingTexts.splice(i, 1); continue; }
        ft.y -= 55 * dt;
        ctx.save();
        ctx.globalAlpha = Math.min(1, ft.life * 1.6);
        ctx.font = '900 32px Fredoka, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = ft.color;
        ctx.lineWidth = 6;
        ctx.strokeText(ft.text, ft.x, ft.y);
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.restore();
      }
    }

    drawCountPill(ctx, x, y, text, bgColor) {
      ctx.save();
      ctx.font = '900 16px Fredoka, sans-serif';
      const w = Math.max(42, ctx.measureText(text).width + 22);
      const h = 28;
      ctx.fillStyle = bgColor;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(x - w / 2, y - h / 2, w, h, 14);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, x, y + 1);
      ctx.restore();
    }

    // ------------------------------------------------------------------------
    // 7. INPUT & UI BINDINGS
    // ------------------------------------------------------------------------
    bindInput() {
      this.canvas.addEventListener('pointerdown', (e) => {
        if (this.state !== 'RUNNING') return;
        this.isDragging = true;
        this.lastPtrX = e.clientX;
      });
      window.addEventListener('pointermove', (e) => {
        if (!this.isDragging || this.state !== 'RUNNING') return;
        const dx = e.clientX - this.lastPtrX;
        this.lastPtrX = e.clientX;
        this.targetX = Math.max(-2.5, Math.min(2.5, this.targetX + (dx / window.innerWidth) * 9.5));
      });
      window.addEventListener('pointerup', () => { this.isDragging = false; });

      window.addEventListener('keydown', (e) => {
        if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.keys.left = true;
        if (e.code === 'ArrowRight' || e.code === 'KeyD') this.keys.right = true;
      });
      window.addEventListener('keyup', (e) => {
        if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.keys.left = false;
        if (e.code === 'ArrowRight' || e.code === 'KeyD') this.keys.right = false;
      });
    }

    refreshMenuUI() {
      document.getElementById('menuCoins').textContent = this.coins;
      document.getElementById('menuLevelTag').textContent = `STAGE ${this.stage}`;
      const cCost = this.countLvl * 50;
      const iCost = this.incomeLvl * 60;
      document.getElementById('upgCountLvl').textContent = `Lv.${this.countLvl} (+${(this.countLvl - 1) * 2})`;
      document.getElementById('upgCountCost').textContent = `🪙 ${cCost}`;
      document.getElementById('upgIncomeLvl').textContent = `Lv.${this.incomeLvl} (${(1 + (this.incomeLvl - 1) * 0.2).toFixed(1)}x)`;
      document.getElementById('upgIncomeCost').textContent = `🪙 ${iCost}`;

      const snd = this.audio.enabled ? '🔊' : '🔇';
      document.getElementById('btnMenuSound').textContent = snd;
      document.getElementById('btnSound').textContent = snd;

      const strip = document.getElementById('skinsStrip');
      strip.innerHTML = '';
      SKINS.forEach(sk => {
        const unlocked = this.unlockedSkins.includes(sk.id);
        const btn = document.createElement('button');
        btn.className = `skin-dot ${this.equippedSkin === sk.id ? 'active' : ''} ${!unlocked ? 'locked' : ''}`;
        btn.style.background = sk.hex;
        btn.title = unlocked ? sk.name : `${sk.name} (🪙 ${sk.price})`;
        btn.addEventListener('click', () => {
          if (unlocked) {
            this.equippedSkin = sk.id;
            localStorage.setItem('ccl_skin', sk.id);
            this.buildStage(this.stage, true);
            this.refreshMenuUI();
          } else if (this.coins >= sk.price) {
            this.coins -= sk.price;
            this.unlockedSkins.push(sk.id);
            this.equippedSkin = sk.id;
            localStorage.setItem('ccl_coins', String(this.coins));
            localStorage.setItem('ccl_skins', JSON.stringify(this.unlockedSkins));
            localStorage.setItem('ccl_skin', sk.id);
            this.audio.playGateGood();
            this.buildStage(this.stage, true);
            this.refreshMenuUI();
          }
        });
        strip.appendChild(btn);
      });
    }

    bindUI() {
      document.getElementById('btnStartRun').addEventListener('click', () => this.startRun());
      document.getElementById('btnNextStage').addEventListener('click', () => this.startRun());
      document.getElementById('btnRetryStage').addEventListener('click', () => this.startRun());

      const goMenu = () => {
        this.state = 'MENU';
        document.getElementById('gameHud').classList.add('hidden');
        document.getElementById('bossHpWrap').classList.add('hidden');
        document.getElementById('defeatModal').classList.add('hidden');
        document.getElementById('victoryModal').classList.add('hidden');
        document.getElementById('menuScreen').classList.remove('hidden');
        this.buildStage(this.stage, true);
        this.refreshMenuUI();
      };
      document.getElementById('btnHome').addEventListener('click', goMenu);
      document.getElementById('btnLoseMenu').addEventListener('click', goMenu);

      const toggleSnd = () => { this.audio.toggle(); this.refreshMenuUI(); };
      document.getElementById('btnMenuSound').addEventListener('click', toggleSnd);
      document.getElementById('btnSound').addEventListener('click', toggleSnd);

      document.getElementById('btnUpgradeCount').addEventListener('click', () => {
        const cost = this.countLvl * 50;
        if (this.coins >= cost) {
          this.coins -= cost;
          this.countLvl++;
          localStorage.setItem('ccl_coins', String(this.coins));
          localStorage.setItem('ccl_count_lvl', String(this.countLvl));
          this.audio.playGateGood();
          this.buildStage(this.stage, true);
          this.refreshMenuUI();
        }
      });

      document.getElementById('btnUpgradeIncome').addEventListener('click', () => {
        const cost = this.incomeLvl * 60;
        if (this.coins >= cost) {
          this.coins -= cost;
          this.incomeLvl++;
          localStorage.setItem('ccl_coins', String(this.coins));
          localStorage.setItem('ccl_income_lvl', String(this.incomeLvl));
          this.audio.playGateGood();
          this.refreshMenuUI();
        }
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.cclGame = new CountControlGame(); });
  } else {
    window.cclGame = new CountControlGame();
  }
})();
