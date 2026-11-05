/**
 * MONKEY MART - Complete Source Code
 * High Fidelity 2.5D Supermarket Simulation
 * Authentic art, 360° analog controls, physics, assistants, customers & progression.
 */

(function () {
    'use strict';

    // ==========================================================================
    // AUDIO ENGINE (Web Audio API + Authentic Game Soundtracks)
    // ==========================================================================
    class SoundManager {
        constructor() {
            this.musicEnabled = true;
            this.sfxEnabled = true;
            this.ctx = null;
            this.bgmAudio = null;
            this.buffers = {};
            this.soundFiles = {
                bgm: 'assets/audio/sound_1.ogg',
                pop: 'assets/audio/sound_4.ogg',
                drop: 'assets/audio/sound_5.ogg',
                cash: 'assets/audio/sound_7.ogg',
                coin: 'assets/audio/sound_3.ogg',
                unlock: 'assets/audio/sound_6.ogg',
                upgrade: 'assets/audio/sound_2.ogg',
                snore: 'assets/audio/sound_10.ogg',
                wake: 'assets/audio/sound_8.ogg',
                pig: 'assets/audio/sound_9.ogg'
            };

            const savedMusic = localStorage.getItem('mm_music_enabled');
            if (savedMusic !== null) this.musicEnabled = (savedMusic === 'true');

            const savedSfx = localStorage.getItem('mm_sfx_enabled');
            if (savedSfx !== null) this.sfxEnabled = (savedSfx === 'true');

            this.initAudioContext();
        }

        initAudioContext() {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) {
                this.ctx = new AudioCtx();
            }
        }

        ensureUnlocked() {
            if (this.ctx && this.ctx.state === 'suspended') {
                this.ctx.resume();
            }
            if (this.musicEnabled && !this.bgmAudio) {
                this.playBGM();
            }
        }

        toggleMusic() {
            this.musicEnabled = !this.musicEnabled;
            localStorage.setItem('mm_music_enabled', this.musicEnabled);
            if (this.musicEnabled) {
                this.playBGM();
            } else {
                if (this.bgmAudio) {
                    this.bgmAudio.pause();
                    this.bgmAudio = null;
                }
            }
            return this.musicEnabled;
        }

        toggleSFX() {
            this.sfxEnabled = !this.sfxEnabled;
            localStorage.setItem('mm_sfx_enabled', this.sfxEnabled);
            return this.sfxEnabled;
        }

        playBGM() {
            if (!this.musicEnabled) return;
            try {
                if (!this.bgmAudio) {
                    this.bgmAudio = new Audio(this.soundFiles.bgm);
                    this.bgmAudio.loop = true;
                    this.bgmAudio.volume = 0.45;
                }
                this.bgmAudio.play().catch(() => {});
            } catch (e) {}
        }

        play(name, volume = 0.6) {
            if (!this.sfxEnabled) return;
            try {
                const url = this.soundFiles[name];
                if (url) {
                    const audio = new Audio(url);
                    audio.volume = Math.min(1, Math.max(0, volume));
                    audio.play().catch(() => {
                        this.playSynth(name);
                    });
                } else {
                    this.playSynth(name);
                }
            } catch (e) {
                this.playSynth(name);
            }
        }

        playSynth(name) {
            if (!this.sfxEnabled || !this.ctx) return;
            try {
                const now = this.ctx.currentTime;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.connect(gain);
                gain.connect(this.ctx.destination);

                if (name === 'pop') {
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(400, now);
                    osc.frequency.exponentialRampToValueAtTime(800, now + 0.08);
                    gain.gain.setValueAtTime(0.3, now);
                    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
                    osc.start(now);
                    osc.stop(now + 0.08);
                } else if (name === 'drop') {
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(320, now);
                    osc.frequency.exponentialRampToValueAtTime(160, now + 0.09);
                    gain.gain.setValueAtTime(0.25, now);
                    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.09);
                    osc.start(now);
                    osc.stop(now + 0.09);
                } else if (name === 'cash' || name === 'coin') {
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(987.77, now); // B5
                    osc.frequency.setValueAtTime(1318.51, now + 0.07); // E6
                    gain.gain.setValueAtTime(0.2, now);
                    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
                    osc.start(now);
                    osc.stop(now + 0.25);
                } else if (name === 'unlock' || name === 'upgrade') {
                    const notes = [523.25, 659.25, 783.99, 1046.50]; // C E G C
                    notes.forEach((f, idx) => {
                        const o = this.ctx.createOscillator();
                        const g = this.ctx.createGain();
                        o.connect(g);
                        g.connect(this.ctx.destination);
                        o.type = 'triangle';
                        o.frequency.setValueAtTime(f, now + idx * 0.07);
                        g.gain.setValueAtTime(0.25, now + idx * 0.07);
                        g.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.07 + 0.15);
                        o.start(now + idx * 0.07);
                        o.stop(now + idx * 0.07 + 0.15);
                    });
                }
            } catch (e) {}
        }
    }

    // ==========================================================================
    // INPUT SYSTEM (Dual Keyboard + 360° Floating Dynamic Joystick)
    // ==========================================================================
    class InputManager {
        constructor(canvas, joystickContainer, joystickKnob) {
            this.canvas = canvas;
            this.joystickContainer = joystickContainer;
            this.joystickKnob = joystickKnob;

            this.moveX = 0;
            this.moveY = 0;
            this.keys = {};

            this.isPointerDown = false;
            this.startX = 0;
            this.startY = 0;
            this.currentX = 0;
            this.currentY = 0;
            this.maxRadius = 50;
            this.mode = localStorage.getItem('mm_joystick_mode') || 'dynamic';

            this.setupKeyboard();
            this.setupPointer();

            if (this.mode === 'fixed') {
                this.setMode('fixed');
            }
        }

        setMode(m) {
            this.mode = m;
            localStorage.setItem('mm_joystick_mode', m);
            if (m === 'fixed') {
                this.joystickContainer.style.display = 'block';
                this.joystickContainer.style.left = '100px';
                this.joystickContainer.style.top = `${window.innerHeight - 100}px`;
                this.startX = 100;
                this.startY = window.innerHeight - 100;
            } else {
                this.joystickContainer.style.display = 'none';
            }
        }

        setupKeyboard() {
            window.addEventListener('keydown', (e) => {
                this.keys[e.key.toLowerCase()] = true;
                if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(e.key.toLowerCase())) {
                    e.preventDefault();
                }
            });
            window.addEventListener('keyup', (e) => {
                this.keys[e.key.toLowerCase()] = false;
            });
        }

        setupPointer() {
            const onDown = (clientX, clientY) => {
                this.isPointerDown = true;

                if (this.mode === 'fixed') {
                    this.startX = 100;
                    this.startY = window.innerHeight - 100;
                } else {
                    this.startX = clientX;
                    this.startY = clientY;
                    this.joystickContainer.style.display = 'block';
                    this.joystickContainer.style.left = `${clientX}px`;
                    this.joystickContainer.style.top = `${clientY}px`;
                }

                this.currentX = clientX;
                this.currentY = clientY;
                this.joystickKnob.style.transform = `translate(0px, 0px)`;
            };

            const onMove = (clientX, clientY) => {
                if (!this.isPointerDown) return;
                this.currentX = clientX;
                this.currentY = clientY;

                const dx = this.currentX - this.startX;
                const dy = this.currentY - this.startY;
                const dist = Math.hypot(dx, dy);

                if (dist > 0) {
                    const clampedDist = Math.min(dist, this.maxRadius);
                    const angle = Math.atan2(dy, dx);
                    const knobX = Math.cos(angle) * clampedDist;
                    const knobY = Math.sin(angle) * clampedDist;

                    this.joystickKnob.style.transform = `translate(${knobX}px, ${knobY}px)`;

                    // Normalize move vector (0 to 1)
                    const power = clampedDist / this.maxRadius;
                    this.moveX = Math.cos(angle) * power;
                    this.moveY = Math.sin(angle) * power;
                }
            };

            const onUp = () => {
                this.isPointerDown = false;
                this.joystickKnob.style.transform = 'translate(0px, 0px)';
                if (this.mode !== 'fixed') {
                    this.joystickContainer.style.display = 'none';
                }
                this.moveX = 0;
                this.moveY = 0;
            };

            // Touch events
            window.addEventListener('touchstart', (e) => {
                if (e.target.closest('#hud') && !e.target.closest('#game-container')) return;
                const touch = e.touches[0];
                onDown(touch.clientX, touch.clientY);
            }, { passive: true });

            window.addEventListener('touchmove', (e) => {
                if (e.touches.length > 0) {
                    const touch = e.touches[0];
                    onMove(touch.clientX, touch.clientY);
                }
            }, { passive: true });

            window.addEventListener('touchend', onUp);
            window.addEventListener('touchcancel', onUp);

            // Mouse events
            window.addEventListener('mousedown', (e) => {
                if (e.button !== 0) return;
                if (e.target.closest('.hud-btn') || e.target.closest('.modal-overlay')) return;
                onDown(e.clientX, e.clientY);
            });

            window.addEventListener('mousemove', (e) => {
                onMove(e.clientX, e.clientY);
            });

            window.addEventListener('mouseup', onUp);
        }

        getVector() {
            let kx = 0;
            let ky = 0;

            if (this.keys['a'] || this.keys['arrowleft']) kx -= 1;
            if (this.keys['d'] || this.keys['arrowright']) kx += 1;
            if (this.keys['w'] || this.keys['arrowup']) ky -= 1;
            if (this.keys['s'] || this.keys['arrowdown']) ky += 1;

            if (kx !== 0 || ky !== 0) {
                const len = Math.hypot(kx, ky);
                return { x: kx / len, y: ky / len, magnitude: 1 };
            }

            if (this.isPointerDown) {
                const mag = Math.hypot(this.moveX, this.moveY);
                return { x: this.moveX, y: this.moveY, magnitude: Math.min(1, mag) };
            }

            return { x: 0, y: 0, magnitude: 0 };
        }
    }

    // Helper: angle interpolation for continuous rotation
    function lerpAngle(from, to, t) {
        let diff = (to - from) % (Math.PI * 2);
        if (diff < -Math.PI) diff += Math.PI * 2;
        if (diff > Math.PI) diff -= Math.PI * 2;
        return from + diff * t;
    }

    // ==========================================================================
    // GAME ENGINE & SIMULATION
    // ==========================================================================
    class Game {
        constructor() {
            this.canvas = document.getElementById('game-canvas');
            this.ctx = this.canvas.getContext('2d');
            this.joystickContainer = document.getElementById('joystick-container');
            this.joystickKnob = this.joystickContainer.querySelector('.joystick-knob');

            // UI Elements
            this.cashDisplay = document.getElementById('cash-display');
            this.cashBadge = document.getElementById('cash-badge');
            this.capacityDisplay = document.getElementById('capacity-display');
            this.btnSettings = document.getElementById('btn-settings');
            this.btnUpgrades = document.getElementById('btn-upgrades');
            this.btnHats = document.getElementById('btn-hats');
            this.modalUpgrades = document.getElementById('modal-upgrades');
            this.modalHats = document.getElementById('modal-hats');
            this.modalSettings = document.getElementById('modal-settings');
            this.closeUpgrades = document.getElementById('close-upgrades');
            this.closeHats = document.getElementById('close-hats');
            this.closeSettings = document.getElementById('close-settings');
            this.toggleMusic = document.getElementById('toggle-music');
            this.toggleSfx = document.getElementById('toggle-sfx');
            this.toggleJoystick = document.getElementById('toggle-joystick');
            this.joystickDesc = document.getElementById('joystick-desc');
            this.toggleFullscreen = document.getElementById('toggle-fullscreen');
            this.btnResetData = document.getElementById('btn-reset-data');
            this.upgradeListEl = document.getElementById('upgrade-list');
            this.hatsGridEl = document.getElementById('hats-grid');

            this.sound = new SoundManager();
            this.input = new InputManager(this.canvas, this.joystickContainer, this.joystickKnob);

            // World Dimensions (2.5D store)
            this.worldWidth = 2000;
            this.worldHeight = 1600;
            this.camera = { x: 400, y: 350, zoom: 1 };

            // Game State
            this.cash = 0;
            this.flyingBills = [];
            this.particles = [];
            this.popups = [];

            // Upgrades levels
            this.upgrades = {
                playerSpeed: 1,
                playerCapacity: 1,
                workerSpeed: 1,
                workerCapacity: 1
            };

            // Selected hat
            this.selectedHat = 'none';
            this.unlockedHats = ['none'];

            // Player character
            this.player = {
                x: 420,
                y: 360,
                vx: 0,
                vy: 0,
                baseSpeed: 230,
                currentSpeed: 230,
                angle: Math.PI / 2,
                stepCycle: 0,
                stack: [], // carried items
                maxCapacity: 4,
                stackSwayX: 0,
                stackSwayY: 0
            };

            // Stands, Farms & Unlock Pads definitions
            this.initStands();

            // Assistant Workers
            this.workers = [];

            // Customers
            this.customers = [];
            this.customerSpawnTimer = 0;
            this.maxCustomers = 5;

            // Golden Pig event
            this.goldenPig = null;
            this.pigSpawnTimer = 35;

            // Setup
            this.loadSave();
            this.setupUI();
            this.resize();

            window.addEventListener('resize', () => this.resize());

            // Start main loop
            this.lastTime = performance.now();
            requestAnimationFrame((time) => this.loop(time));
        }

        initStands() {
            // Layout matching authentic Poki Monkey Mart supermarket
            this.stands = [
                // 1. Banana Tree Plot (Always unlocked)
                {
                    id: 'banana_tree',
                    type: 'tree',
                    product: 'banana',
                    x: 200,
                    y: 240,
                    w: 140,
                    h: 140,
                    unlocked: true,
                    cost: 0,
                    stock: 6,
                    maxStock: 8,
                    timer: 0,
                    interval: 1.8,
                    name: 'Banana Tree'
                },
                // 2. Banana Display Shelf
                {
                    id: 'banana_shelf',
                    type: 'shelf',
                    product: 'banana',
                    price: 5,
                    x: 420,
                    y: 180,
                    w: 130,
                    h: 100,
                    unlocked: false,
                    cost: 15,
                    stock: 0,
                    maxStock: 8,
                    name: 'Banana Stand',
                    unlockPad: { x: 420, y: 260, r: 42 }
                },
                // 3. Checkout Cashier Counter (Unlocked by default)
                {
                    id: 'cashbox',
                    type: 'cashbox',
                    x: 720,
                    y: 260,
                    w: 160,
                    h: 120,
                    unlocked: true,
                    cost: 0,
                    billsOnCounter: 0,
                    name: 'Checkout Counter'
                },
                // 4. Corn Farm Plot
                {
                    id: 'corn_farm',
                    type: 'farm',
                    product: 'corn',
                    x: 200,
                    y: 520,
                    w: 150,
                    h: 140,
                    unlocked: false,
                    cost: 35,
                    stock: 4,
                    maxStock: 8,
                    timer: 0,
                    interval: 2.2,
                    name: 'Corn Field',
                    unlockPad: { x: 200, y: 520, r: 46 }
                },
                // 5. Corn Display Shelf
                {
                    id: 'corn_shelf',
                    type: 'shelf',
                    product: 'corn',
                    price: 8,
                    x: 420,
                    y: 460,
                    w: 130,
                    h: 100,
                    unlocked: false,
                    cost: 50,
                    stock: 0,
                    maxStock: 8,
                    name: 'Corn Stand',
                    unlockPad: { x: 420, y: 540, r: 42 }
                },
                // 6. Stockman Assistant
                {
                    id: 'stockman_worker',
                    type: 'worker_pad',
                    workerType: 'stockman',
                    x: 600,
                    y: 400,
                    w: 90,
                    h: 90,
                    unlocked: false,
                    cost: 75,
                    name: 'Hire Stockman',
                    unlockPad: { x: 600, y: 400, r: 44 }
                },
                // 7. Chicken Coop / Egg Station
                {
                    id: 'chicken_coop',
                    type: 'coop',
                    product: 'egg',
                    x: 200,
                    y: 800,
                    w: 150,
                    h: 140,
                    unlocked: false,
                    cost: 110,
                    stock: 4,
                    maxStock: 8,
                    timer: 0,
                    interval: 2.5,
                    name: 'Chicken Coop',
                    unlockPad: { x: 200, y: 800, r: 46 }
                },
                // 8. Egg Display Shelf
                {
                    id: 'egg_shelf',
                    type: 'shelf',
                    product: 'egg',
                    price: 12,
                    x: 420,
                    y: 740,
                    w: 130,
                    h: 100,
                    unlocked: false,
                    cost: 140,
                    stock: 0,
                    maxStock: 8,
                    name: 'Egg Stand',
                    unlockPad: { x: 420, y: 820, r: 42 }
                },
                // 9. Cashier Assistant
                {
                    id: 'cashier_worker',
                    type: 'worker_pad',
                    workerType: 'cashier',
                    x: 720,
                    y: 420,
                    w: 90,
                    h: 90,
                    unlocked: false,
                    cost: 180,
                    name: 'Hire Cashier',
                    unlockPad: { x: 720, y: 420, r: 44 }
                },
                // 10. Popcorn Microwave Stand
                {
                    id: 'popcorn_stand',
                    type: 'machine',
                    product: 'popcorn',
                    price: 18,
                    x: 720,
                    y: 640,
                    w: 140,
                    h: 110,
                    unlocked: false,
                    cost: 240,
                    stock: 0,
                    maxStock: 6,
                    timer: 0,
                    interval: 2.6,
                    name: 'Popcorn Machine',
                    unlockPad: { x: 720, y: 640, r: 46 }
                },
                // 11. Dairy Cow Pen & Milk Stand
                {
                    id: 'cow_pen',
                    type: 'pen',
                    product: 'milk',
                    price: 25,
                    x: 200,
                    y: 1100,
                    w: 160,
                    h: 150,
                    unlocked: false,
                    cost: 320,
                    stock: 0,
                    maxStock: 6,
                    timer: 0,
                    interval: 3.0,
                    name: 'Dairy Cow Pen',
                    unlockPad: { x: 200, y: 1100, r: 48 }
                }
            ];
        }

        setupUI() {
            // Unlock audio on first user touch/click
            window.addEventListener('pointerdown', () => {
                this.sound.ensureUnlocked();
            }, { once: true });

            // Upgrades modal
            this.btnUpgrades.addEventListener('click', () => {
                this.renderUpgradeModal();
                this.modalUpgrades.classList.add('active');
            });
            this.closeUpgrades.addEventListener('click', () => {
                this.modalUpgrades.classList.remove('active');
            });

            // Hats modal
            this.btnHats.addEventListener('click', () => {
                this.renderHatsModal();
                this.modalHats.classList.add('active');
            });
            this.closeHats.addEventListener('click', () => {
                this.modalHats.classList.remove('active');
            });

            // Settings Modal
            this.btnSettings.addEventListener('click', () => {
                this.syncSettingsUI();
                this.modalSettings.classList.add('active');
            });
            this.closeSettings.addEventListener('click', () => {
                this.modalSettings.classList.remove('active');
            });

            // Music Toggle
            this.toggleMusic.addEventListener('click', () => {
                const on = this.sound.toggleMusic();
                this.toggleMusic.innerText = on ? 'ON' : 'OFF';
                this.toggleMusic.classList.toggle('active', on);
            });

            // SFX Toggle
            this.toggleSfx.addEventListener('click', () => {
                const on = this.sound.toggleSFX();
                this.toggleSfx.innerText = on ? 'ON' : 'OFF';
                this.toggleSfx.classList.toggle('active', on);
            });

            // Joystick Mode Toggle
            this.toggleJoystick.addEventListener('click', () => {
                const current = this.input.mode || 'dynamic';
                const next = current === 'dynamic' ? 'fixed' : 'dynamic';
                this.input.setMode(next);
                this.toggleJoystick.innerText = next.toUpperCase();
                this.toggleJoystick.classList.toggle('active', next === 'fixed');
                this.joystickDesc.innerText = next === 'dynamic' ? 'Dynamic (Follows Touch)' : 'Fixed (Bottom-Left Corner)';
            });

            // Fullscreen Toggle
            this.toggleFullscreen.addEventListener('click', () => {
                if (!document.fullscreenElement) {
                    document.documentElement.requestFullscreen().catch(() => {});
                    this.toggleFullscreen.innerText = 'EXIT';
                    this.toggleFullscreen.classList.add('active');
                } else {
                    document.exitFullscreen().catch(() => {});
                    this.toggleFullscreen.innerText = 'EXPAND';
                    this.toggleFullscreen.classList.remove('active');
                }
            });

            // Reset Game Progress
            this.btnResetData.addEventListener('click', () => {
                const sure = confirm('Are you sure you want to reset all progress and restart?');
                if (sure) {
                    localStorage.removeItem('monkey_mart_save_v1');
                    window.location.reload();
                }
            });

            // Close modals on clicking background
            [this.modalUpgrades, this.modalHats, this.modalSettings].forEach(modal => {
                modal.addEventListener('click', (e) => {
                    if (e.target === modal) modal.classList.remove('active');
                });
            });
        }

        syncSettingsUI() {
            this.toggleMusic.innerText = this.sound.musicEnabled ? 'ON' : 'OFF';
            this.toggleMusic.classList.toggle('active', this.sound.musicEnabled);

            this.toggleSfx.innerText = this.sound.sfxEnabled ? 'ON' : 'OFF';
            this.toggleSfx.classList.toggle('active', this.sound.sfxEnabled);

            const mode = this.input.mode || 'dynamic';
            this.toggleJoystick.innerText = mode.toUpperCase();
            this.toggleJoystick.classList.toggle('active', mode === 'fixed');
            this.joystickDesc.innerText = mode === 'dynamic' ? 'Dynamic (Follows Touch)' : 'Fixed (Bottom-Left Corner)';
        }

        resize() {
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            this.canvas.width = window.innerWidth * dpr;
            this.canvas.height = window.innerHeight * dpr;
            this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            this.viewportWidth = window.innerWidth;
            this.viewportHeight = window.innerHeight;
        }

        loadSave() {
            try {
                const data = localStorage.getItem('monkey_mart_save_v1');
                if (data) {
                    const obj = JSON.parse(data);
                    if (typeof obj.cash === 'number') this.cash = obj.cash;
                    if (obj.upgrades) this.upgrades = Object.assign(this.upgrades, obj.upgrades);
                    if (obj.unlockedHats) this.unlockedHats = obj.unlockedHats;
                    if (obj.selectedHat) this.selectedHat = obj.selectedHat;

                    if (obj.unlockedStands && Array.isArray(obj.unlockedStands)) {
                        this.stands.forEach(s => {
                            if (obj.unlockedStands.includes(s.id)) {
                                s.unlocked = true;
                                if (s.workerType) {
                                    this.spawnWorker(s.workerType, s.x, s.y);
                                }
                            }
                        });
                    }
                }
            } catch (e) {}

            this.applyUpgrades();
            this.updateHUD();
        }

        saveGame() {
            try {
                const unlockedIds = this.stands.filter(s => s.unlocked).map(s => s.id);
                const obj = {
                    cash: this.cash,
                    upgrades: this.upgrades,
                    unlockedHats: this.unlockedHats,
                    selectedHat: this.selectedHat,
                    unlockedStands: unlockedIds
                };
                localStorage.setItem('monkey_mart_save_v1', JSON.stringify(obj));
            } catch (e) {}
        }

        applyUpgrades() {
            this.player.currentSpeed = this.player.baseSpeed + (this.upgrades.playerSpeed - 1) * 35;
            this.player.maxCapacity = 4 + (this.upgrades.playerCapacity - 1) * 2;
            this.workers.forEach(w => {
                w.speed = 150 + (this.upgrades.workerSpeed - 1) * 30;
                w.maxCapacity = 3 + (this.upgrades.workerCapacity - 1) * 2;
            });
        }

        spawnWorker(type, x, y) {
            // Check if worker already exists
            if (this.workers.some(w => w.type === type)) return;

            const worker = {
                type: type, // 'stockman' or 'cashier'
                x: x,
                y: y,
                targetX: x,
                targetY: y,
                angle: 0,
                speed: 150 + (this.upgrades.workerSpeed - 1) * 30,
                stack: [],
                maxCapacity: 3 + (this.upgrades.workerCapacity - 1) * 2,
                stepCycle: 0,
                isAsleep: false,
                sleepTimer: 25 + Math.random() * 20,
                snoreTime: 0,
                state: 'idle'
            };
            this.workers.push(worker);
        }

        // ==========================================================================
        // UPGRADES & HATS SYSTEM
        // ==========================================================================
        renderUpgradeModal() {
            const list = [
                {
                    key: 'playerSpeed',
                    name: 'Player Speed',
                    icon: '⚡',
                    baseCost: 30,
                    costMult: 1.8,
                    desc: 'Run faster through the store'
                },
                {
                    key: 'playerCapacity',
                    name: 'Player Capacity',
                    icon: '🎒',
                    baseCost: 40,
                    costMult: 2.0,
                    desc: 'Carry more stacked goods on your head'
                },
                {
                    key: 'workerSpeed',
                    name: 'Worker Speed',
                    icon: '👟',
                    baseCost: 60,
                    costMult: 1.9,
                    desc: 'Assistant monkeys move faster'
                },
                {
                    key: 'workerCapacity',
                    name: 'Worker Capacity',
                    icon: '📦',
                    baseCost: 70,
                    costMult: 2.1,
                    desc: 'Assistant monkeys carry larger stacks'
                }
            ];

            this.upgradeListEl.innerHTML = '';
            list.forEach(item => {
                const lvl = this.upgrades[item.key] || 1;
                const cost = Math.round(item.baseCost * Math.pow(item.costMult, lvl - 1));
                const canAfford = this.cash >= cost;

                const card = document.createElement('div');
                card.className = 'upgrade-card';
                card.innerHTML = `
                    <div class="upgrade-info">
                        <div class="upgrade-icon">${item.icon}</div>
                        <div>
                            <div class="upgrade-name">${item.name}</div>
                            <div class="upgrade-lvl">Level ${lvl} &bull; ${item.desc}</div>
                        </div>
                    </div>
                    <button class="upgrade-action-btn ${canAfford ? '' : 'disabled'}">
                        $${cost}
                    </button>
                `;

                const btn = card.querySelector('.upgrade-action-btn');
                btn.addEventListener('click', () => {
                    if (this.cash >= cost) {
                        this.cash -= cost;
                        this.upgrades[item.key] = lvl + 1;
                        this.applyUpgrades();
                        this.saveGame();
                        this.sound.play('upgrade');
                        this.updateHUD();
                        this.renderUpgradeModal();
                    }
                });

                this.upgradeListEl.appendChild(card);
            });
        }

        renderHatsModal() {
            const hats = [
                { id: 'none', name: 'Default', icon: '🐵', cost: 0 },
                { id: 'cap', name: 'Baseball Cap', icon: '🧢', cost: 50 },
                { id: 'chef', name: 'Chef Toque', icon: '👨‍🍳', cost: 100 },
                { id: 'cowboy', name: 'Cowboy Hat', icon: '🤠', cost: 160 },
                { id: 'party', name: 'Party Cone', icon: '🥳', cost: 220 },
                { id: 'crown', name: 'Royal Crown', icon: '👑', cost: 350 }
            ];

            this.hatsGridEl.innerHTML = '';
            hats.forEach(hat => {
                const isUnlocked = this.unlockedHats.includes(hat.id);
                const isSelected = this.selectedHat === hat.id;
                const canAfford = this.cash >= hat.cost;

                const card = document.createElement('div');
                card.className = `hat-card ${isSelected ? 'selected' : ''}`;
                card.innerHTML = `
                    <div class="hat-preview">${hat.icon}</div>
                    <div class="hat-name">${hat.name}</div>
                    <div class="hat-status ${isSelected ? 'equipped' : (isUnlocked ? '' : 'buy')}">
                        ${isSelected ? 'EQUIPPED' : (isUnlocked ? 'SELECT' : '$' + hat.cost)}
                    </div>
                `;

                card.addEventListener('click', () => {
                    if (isUnlocked) {
                        this.selectedHat = hat.id;
                        this.sound.play('pop');
                        this.saveGame();
                        this.renderHatsModal();
                    } else if (canAfford) {
                        this.cash -= hat.cost;
                        this.unlockedHats.push(hat.id);
                        this.selectedHat = hat.id;
                        this.sound.play('unlock');
                        this.saveGame();
                        this.updateHUD();
                        this.renderHatsModal();
                    }
                });

                this.hatsGridEl.appendChild(card);
            });
        }

        updateHUD() {
            this.cashDisplay.innerText = this.cash;
            this.capacityDisplay.innerText = `${this.player.stack.length} / ${this.player.maxCapacity}`;
        }

        // ==========================================================================
        // MAIN UPDATE CYCLE
        // ==========================================================================
        loop(time) {
            const dt = Math.min((time - this.lastTime) / 1000, 0.05); // cap delta
            this.lastTime = time;

            this.update(dt);
            this.render();

            requestAnimationFrame((t) => this.loop(t));
        }

        update(dt) {
            this.updatePlayer(dt);
            this.updateCamera(dt);
            this.updateStands(dt);
            this.updateWorkers(dt);
            this.updateCustomers(dt);
            this.updateFlyingBills(dt);
            this.updateParticles(dt);
            this.updatePopups(dt);
            this.updateGoldenPig(dt);
        }

        updatePlayer(dt) {
            const vec = this.input.getVector();

            if (vec.magnitude > 0.05) {
                // Accelerate
                const targetVx = vec.x * this.player.currentSpeed;
                const targetVy = vec.y * this.player.currentSpeed;
                this.player.vx += (targetVx - this.player.vx) * 12 * dt;
                this.player.vy += (targetVy - this.player.vy) * 12 * dt;

                const targetAngle = Math.atan2(this.player.vy, this.player.vx);
                this.player.angle = lerpAngle(this.player.angle, targetAngle, 0.25);

                const speed = Math.hypot(this.player.vx, this.player.vy);
                this.player.stepCycle += speed * dt * 0.05;
            } else {
                // Decelerate
                this.player.vx += (0 - this.player.vx) * 14 * dt;
                this.player.vy += (0 - this.player.vy) * 14 * dt;
            }

            // Move & clamp within store boundaries
            this.player.x += this.player.vx * dt;
            this.player.y += this.player.vy * dt;

            this.player.x = Math.max(60, Math.min(this.worldWidth - 60, this.player.x));
            this.player.y = Math.max(60, Math.min(this.worldHeight - 60, this.player.y));

            // Stack sway physics
            const targetSwayX = -this.player.vx * 0.08;
            const targetSwayY = -this.player.vy * 0.08;
            this.player.stackSwayX += (targetSwayX - this.player.stackSwayX) * 10 * dt;
            this.player.stackSwayY += (targetSwayY - this.player.stackSwayY) * 10 * dt;

            // Check interactions with stands, harvest plots, checkout & unlock pads
            this.checkPlayerInteractions(dt);
        }

        checkPlayerInteractions(dt) {
            // 1. Check Unlock Pads
            this.stands.forEach(stand => {
                if (!stand.unlocked && stand.unlockPad) {
                    const pad = stand.unlockPad;
                    const dist = Math.hypot(this.player.x - pad.x, this.player.y - pad.y);
                    if (dist < pad.r + 20) {
                        // Absorb cash into pad
                        if (this.cash > 0 && stand.cost > 0) {
                            const payment = Math.min(this.cash, Math.min(stand.cost, Math.max(1, Math.ceil(stand.cost * 0.05))));
                            this.cash -= payment;
                            stand.cost -= payment;
                            this.sound.play('coin', 0.4);
                            this.spawnFlyingBill(this.player.x, this.player.y, pad.x, pad.y);
                            this.updateHUD();

                            if (stand.cost <= 0) {
                                // Stand unlocked!
                                stand.unlocked = true;
                                this.sound.play('unlock');
                                this.createBurst(pad.x, pad.y, '#ffd11a', 25);
                                this.addPopup(pad.x, pad.y - 40, 'UNLOCKED!', '#38b000');
                                if (stand.workerType) {
                                    this.spawnWorker(stand.workerType, stand.x, stand.y);
                                }
                                this.saveGame();
                            }
                        }
                    }
                }
            });

            // 2. Check Harvesting Produce (Banana Tree, Corn Farm, Chicken Coop, etc.)
            this.stands.forEach(stand => {
                if (stand.unlocked && ['tree', 'farm', 'coop', 'pen'].includes(stand.type)) {
                    const dist = Math.hypot(this.player.x - stand.x, this.player.y - stand.y);
                    if (dist < 75) {
                        if (stand.stock > 0 && this.player.stack.length < this.player.maxCapacity) {
                            stand.stock--;
                            this.player.stack.push(stand.product);
                            this.sound.play('pop', 0.5);
                            this.createBurst(stand.x, stand.y, '#ffd11a', 8);
                            this.updateHUD();
                        }
                    }
                }
            });

            // 3. Check Filling Produce Shelves
            this.stands.forEach(stand => {
                if (stand.unlocked && stand.type === 'shelf') {
                    const dist = Math.hypot(this.player.x - stand.x, this.player.y - stand.y);
                    if (dist < 80) {
                        // Find matching item in stack
                        const idx = this.player.stack.lastIndexOf(stand.product);
                        if (idx !== -1 && stand.stock < stand.maxStock) {
                            this.player.stack.splice(idx, 1);
                            stand.stock++;
                            this.sound.play('drop', 0.5);
                            this.createBurst(stand.x, stand.y, '#ffffff', 6);
                            this.updateHUD();
                        }
                    }
                }
            });

            // 4. Check Collecting Cash from Cashier Counter
            const cashbox = this.stands.find(s => s.id === 'cashbox');
            if (cashbox && cashbox.billsOnCounter > 0) {
                const dist = Math.hypot(this.player.x - cashbox.x, this.player.y - cashbox.y);
                if (dist < 90) {
                    const take = cashbox.billsOnCounter;
                    cashbox.billsOnCounter = 0;
                    this.cash += take;
                    this.sound.play('cash', 0.7);
                    this.cashBadge.classList.add('pulse');
                    setTimeout(() => this.cashBadge.classList.remove('pulse'), 200);
                    this.addPopup(cashbox.x, cashbox.y - 40, `+$${take}`, '#ffd11a');
                    this.updateHUD();
                    this.saveGame();
                }
            }

            // 5. Check Waking up Sleepy Assistant Workers
            this.workers.forEach(w => {
                if (w.isAsleep) {
                    const dist = Math.hypot(this.player.x - w.x, this.player.y - w.y);
                    if (dist < 60) {
                        w.isAsleep = false;
                        w.sleepTimer = 30 + Math.random() * 20;
                        this.sound.play('wake', 0.6);
                        this.createBurst(w.x, w.y, '#ffd11a', 15);
                        this.addPopup(w.x, w.y - 30, 'AWAKE!', '#5ce1e6');
                    }
                }
            });

            // 6. Check Catching the Golden Pig
            if (this.goldenPig) {
                const dist = Math.hypot(this.player.x - this.goldenPig.x, this.player.y - this.goldenPig.y);
                if (dist < 55) {
                    const reward = 50 + Math.floor(Math.random() * 50);
                    this.cash += reward;
                    this.sound.play('pig', 0.8);
                    this.createBurst(this.goldenPig.x, this.goldenPig.y, '#ffd11a', 30);
                    this.addPopup(this.goldenPig.x, this.goldenPig.y - 50, `JACKPOT! +$${reward}`, '#ffd11a');
                    this.goldenPig = null;
                    this.updateHUD();
                    this.saveGame();
                }
            }
        }

        updateCamera(dt) {
            // Smooth follow player with boundary clamping
            const targetX = this.player.x;
            const targetY = this.player.y;
            this.camera.x += (targetX - this.camera.x) * 6 * dt;
            this.camera.y += (targetY - this.camera.y) * 6 * dt;
        }

        updateStands(dt) {
            this.stands.forEach(stand => {
                if (stand.unlocked && stand.interval) {
                    stand.timer = (stand.timer || 0) + dt;
                    if (stand.timer >= stand.interval) {
                        stand.timer = 0;
                        if (stand.stock < stand.maxStock) {
                            stand.stock++;
                        }
                    }
                }
            });
        }

        updateWorkers(dt) {
            this.workers.forEach(w => {
                // Sleep cycle timer
                if (!w.isAsleep) {
                    w.sleepTimer -= dt;
                    if (w.sleepTimer <= 0) {
                        w.isAsleep = true;
                        this.sound.play('snore', 0.3);
                    }
                }

                if (w.isAsleep) {
                    w.snoreTime += dt;
                    return;
                }

                // AI Behaviors
                if (w.type === 'stockman') {
                    this.updateStockmanAI(w, dt);
                } else if (w.type === 'cashier') {
                    this.updateCashierAI(w, dt);
                }
            });
        }

        updateStockmanAI(w, dt) {
            // 1. If stack is empty, look for unlocked producer with stock
            if (w.stack.length === 0) {
                const producers = this.stands.filter(s => s.unlocked && ['tree', 'farm', 'coop'].includes(s.type) && s.stock > 0);
                if (producers.length > 0) {
                    const target = producers[0];
                    w.targetX = target.x;
                    w.targetY = target.y;

                    const dist = Math.hypot(w.x - target.x, w.y - target.y);
                    if (dist < 40) {
                        while (target.stock > 0 && w.stack.length < w.maxCapacity) {
                            target.stock--;
                            w.stack.push(target.product);
                        }
                        this.sound.play('pop', 0.3);
                    }
                }
            } else {
                // 2. If stack has items, carry to matching shelf needing stock
                const product = w.stack[0];
                const shelves = this.stands.filter(s => s.unlocked && s.type === 'shelf' && s.product === product && s.stock < s.maxStock);
                if (shelves.length > 0) {
                    const target = shelves[0];
                    w.targetX = target.x;
                    w.targetY = target.y + 40;

                    const dist = Math.hypot(w.x - w.targetX, w.y - w.targetY);
                    if (dist < 40) {
                        while (w.stack.length > 0 && target.stock < target.maxStock) {
                            w.stack.pop();
                            target.stock++;
                        }
                        this.sound.play('drop', 0.3);
                    }
                }
            }

            // Move worker towards target
            const dx = w.targetX - w.x;
            const dy = w.targetY - w.y;
            const dist = Math.hypot(dx, dy);

            if (dist > 10) {
                w.x += (dx / dist) * w.speed * dt;
                w.y += (dy / dist) * w.speed * dt;
                w.angle = Math.atan2(dy, dx);
                w.stepCycle += w.speed * dt * 0.05;
            }
        }

        updateCashierAI(w, dt) {
            // Cashier stands behind cash register and rings up customers
            const cashbox = this.stands.find(s => s.id === 'cashbox');
            if (!cashbox) return;

            w.targetX = cashbox.x;
            w.targetY = cashbox.y - 30;
            w.angle = Math.PI / 2; // face customers

            const dx = w.targetX - w.x;
            const dy = w.targetY - w.y;
            if (Math.hypot(dx, dy) > 5) {
                w.x += dx * 4 * dt;
                w.y += dy * 4 * dt;
            }
        }

        updateCustomers(dt) {
            // Customer Spawner
            this.customerSpawnTimer += dt;
            if (this.customerSpawnTimer >= 3.0 && this.customers.length < this.maxCustomers) {
                this.customerSpawnTimer = 0;
                this.spawnCustomer();
            }

            const cashbox = this.stands.find(s => s.id === 'cashbox');

            // Update each customer
            for (let i = this.customers.length - 1; i >= 0; i--) {
                const c = this.customers[i];
                c.stepCycle += dt * 8;

                if (c.state === 'walk_to_shelf') {
                    // Navigate to chosen shelf
                    const shelf = this.stands.find(s => s.id === c.targetShelfId);
                    if (!shelf || !shelf.unlocked) {
                        c.state = 'leaving';
                        continue;
                    }

                    const targetX = shelf.x;
                    const targetY = shelf.y + 55;
                    const dx = targetX - c.x;
                    const dy = targetY - c.y;
                    const dist = Math.hypot(dx, dy);

                    if (dist > 15) {
                        c.x += (dx / dist) * c.speed * dt;
                        c.y += (dy / dist) * c.speed * dt;
                        c.angle = Math.atan2(dy, dx);
                    } else {
                        // At shelf: wait for item
                        if (shelf.stock >= c.itemsNeeded) {
                            shelf.stock -= c.itemsNeeded;
                            c.hasItems = true;
                            c.state = 'walk_to_cashbox';
                            this.sound.play('drop', 0.3);
                        }
                    }
                } else if (c.state === 'walk_to_cashbox') {
                    if (!cashbox) continue;
                    // Queue position
                    const queueIndex = this.customers.filter(other => other.state === 'queueing' || other.state === 'paying').length;
                    const targetX = cashbox.x;
                    const targetY = cashbox.y + 60 + queueIndex * 40;

                    const dx = targetX - c.x;
                    const dy = targetY - c.y;
                    const dist = Math.hypot(dx, dy);

                    if (dist > 15) {
                        c.x += (dx / dist) * c.speed * dt;
                        c.y += (dy / dist) * c.speed * dt;
                        c.angle = Math.atan2(dy, dx);
                    } else {
                        c.state = queueIndex === 0 ? 'paying' : 'queueing';
                    }
                } else if (c.state === 'queueing') {
                    // Check if at front
                    const payingCustomer = this.customers.find(other => other.state === 'paying');
                    if (!payingCustomer) {
                        c.state = 'paying';
                    }
                } else if (c.state === 'paying') {
                    // Pay timer
                    c.payTimer = (c.payTimer || 0) + dt;

                    // Faster payment if cashier or player is attending cashbox
                    const cashierWorker = this.workers.find(w => w.type === 'cashier' && !w.isAsleep);
                    const playerAtCashbox = Math.hypot(this.player.x - cashbox.x, this.player.y - cashbox.y) < 70;
                    const speedMult = (cashierWorker || playerAtCashbox) ? 2.5 : 1.0;

                    if (c.payTimer >= 1.5 / speedMult) {
                        // Done paying!
                        const payment = c.itemPrice * c.itemsNeeded;
                        cashbox.billsOnCounter += payment;
                        this.sound.play('cash', 0.5);
                        this.addPopup(c.x, c.y - 40, '❤️', '#ff4757');
                        c.state = 'leaving';
                    }
                } else if (c.state === 'leaving') {
                    // Walk out towards entrance
                    const targetX = 100;
                    const targetY = 1400;
                    const dx = targetX - c.x;
                    const dy = targetY - c.y;
                    const dist = Math.hypot(dx, dy);

                    if (dist > 25) {
                        c.x += (dx / dist) * c.speed * dt;
                        c.y += (dy / dist) * c.speed * dt;
                        c.angle = Math.atan2(dy, dx);
                    } else {
                        // Remove customer
                        this.customers.splice(i, 1);
                    }
                }
            }
        }

        spawnCustomer() {
            // Find an unlocked shelf
            const unlockedShelves = this.stands.filter(s => s.unlocked && s.type === 'shelf');
            if (unlockedShelves.length === 0) return;

            const shelf = unlockedShelves[Math.floor(Math.random() * unlockedShelves.length)];
            const animalTypes = ['panda', 'cat', 'bunny', 'monkey'];
            const type = animalTypes[Math.floor(Math.random() * animalTypes.length)];

            const customer = {
                type: type,
                x: 120 + Math.random() * 40,
                y: 1350,
                speed: 120 + Math.random() * 25,
                angle: -Math.PI / 2,
                stepCycle: 0,
                targetShelfId: shelf.id,
                product: shelf.product,
                itemPrice: shelf.price || 5,
                itemsNeeded: 1 + Math.floor(Math.random() * 2),
                hasItems: false,
                state: 'walk_to_shelf'
            };
            this.customers.push(customer);
        }

        updateGoldenPig(dt) {
            if (!this.goldenPig) {
                this.pigSpawnTimer -= dt;
                if (this.pigSpawnTimer <= 0) {
                    this.pigSpawnTimer = 50 + Math.random() * 30;
                    this.goldenPig = {
                        x: 50,
                        y: 350 + Math.random() * 400,
                        vx: 180,
                        vy: (Math.random() - 0.5) * 80,
                        stepCycle: 0
                    };
                }
            } else {
                this.goldenPig.stepCycle += dt * 16;
                this.goldenPig.x += this.goldenPig.vx * dt;
                this.goldenPig.y += this.goldenPig.vy * dt;

                // Sparkles
                if (Math.random() < 0.3) {
                    this.particles.push({
                        x: this.goldenPig.x,
                        y: this.goldenPig.y,
                        vx: (Math.random() - 0.5) * 30,
                        vy: (Math.random() - 0.5) * 30,
                        color: '#ffd11a',
                        size: 3 + Math.random() * 3,
                        alpha: 1,
                        life: 0.6
                    });
                }

                if (this.goldenPig.x > this.worldWidth + 100) {
                    this.goldenPig = null;
                }
            }
        }

        spawnFlyingBill(x1, y1, x2, y2) {
            this.flyingBills.push({
                x1: x1,
                y1: y1,
                x2: x2,
                y2: y2,
                progress: 0,
                speed: 2.2 + Math.random() * 0.8,
                arcH: 40 + Math.random() * 30
            });
        }

        updateFlyingBills(dt) {
            for (let i = this.flyingBills.length - 1; i >= 0; i--) {
                const b = this.flyingBills[i];
                b.progress += dt * b.speed;
                if (b.progress >= 1) {
                    this.flyingBills.splice(i, 1);
                }
            }
        }

        createBurst(x, y, color, count = 12) {
            for (let i = 0; i < count; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = 60 + Math.random() * 120;
                this.particles.push({
                    x: x,
                    y: y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    color: color,
                    size: 4 + Math.random() * 4,
                    alpha: 1,
                    life: 0.5 + Math.random() * 0.4
                });
            }
        }

        updateParticles(dt) {
            for (let i = this.particles.length - 1; i >= 0; i--) {
                const p = this.particles[i];
                p.x += p.vx * dt;
                p.y += p.vy * dt;
                p.life -= dt;
                p.alpha = Math.max(0, p.life);
                if (p.life <= 0) {
                    this.particles.splice(i, 1);
                }
            }
        }

        addPopup(x, y, text, color = '#ffffff') {
            this.popups.push({
                x: x,
                y: y,
                text: text,
                color: color,
                alpha: 1,
                life: 1.0
            });
        }

        updatePopups(dt) {
            for (let i = this.popups.length - 1; i >= 0; i--) {
                const pop = this.popups[i];
                pop.y -= 35 * dt;
                pop.life -= dt;
                pop.alpha = Math.max(0, pop.life);
                if (pop.life <= 0) {
                    this.popups.splice(i, 1);
                }
            }
        }

        // ==========================================================================
        // GRAPHICS & RENDERING (High Fidelity 2.5D Isometric Aesthetics)
        // ==========================================================================
        render() {
            const ctx = this.ctx;
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            ctx.clearRect(0, 0, this.viewportWidth, this.viewportHeight);

            ctx.save();
            // Camera transform
            const cx = this.viewportWidth / 2 - this.camera.x;
            const cy = this.viewportHeight / 2 - this.camera.y;
            ctx.translate(cx, cy);

            // 1. Draw Supermarket Floor & Store Borders
            this.drawStoreFloor(ctx);

            // 2. Depth Sorting: Collect all entities (Stands, Characters, Customers, Props)
            const entities = [];

            // Stands
            this.stands.forEach(s => {
                entities.push({ type: 'stand', y: s.y, data: s });
            });

            // Workers
            this.workers.forEach(w => {
                entities.push({ type: 'worker', y: w.y, data: w });
            });

            // Customers
            this.customers.forEach(c => {
                entities.push({ type: 'customer', y: c.y, data: c });
            });

            // Golden Pig
            if (this.goldenPig) {
                entities.push({ type: 'pig', y: this.goldenPig.y, data: this.goldenPig });
            }

            // Player
            entities.push({ type: 'player', y: this.player.y, data: this.player });

            // Sort by Y for 2.5D top-down isometric occlusion
            entities.sort((a, b) => a.y - b.y);

            // 3. Render Sorted Entities
            entities.forEach(ent => {
                if (ent.type === 'stand') this.drawStand(ctx, ent.data);
                else if (ent.type === 'player') this.drawPlayer(ctx, ent.data);
                else if (ent.type === 'worker') this.drawWorker(ctx, ent.data);
                else if (ent.type === 'customer') this.drawCustomer(ctx, ent.data);
                else if (ent.type === 'pig') this.drawGoldenPig(ctx, ent.data);
            });

            // 4. Draw Flying Money Bills & Particle FX
            this.drawFlyingBills(ctx);
            this.drawParticles(ctx);
            this.drawPopups(ctx);

            ctx.restore();
        }

        drawStoreFloor(ctx) {
            // Parquet Wooden Border (Outer Store Rim)
            ctx.fillStyle = '#b8824f';
            ctx.fillRect(0, 0, this.worldWidth, this.worldHeight);

            // Wood plank grain stripes
            ctx.fillStyle = 'rgba(0, 0, 0, 0.06)';
            for (let y = 0; y < this.worldHeight; y += 48) {
                ctx.fillRect(0, y, this.worldWidth, 3);
            }

            // Supermarket Checkerboard Green Floor
            const margin = 80;
            const w = this.worldWidth - margin * 2;
            const h = this.worldHeight - margin * 2;
            const tileSize = 64;

            for (let x = margin; x < margin + w; x += tileSize) {
                for (let y = margin; y < margin + h; y += tileSize) {
                    const tileX = Math.floor((x - margin) / tileSize);
                    const tileY = Math.floor((y - margin) / tileSize);
                    const isEven = (tileX + tileY) % 2 === 0;
                    ctx.fillStyle = isEven ? '#3bb859' : '#33ac50';
                    ctx.fillRect(x, y, tileSize, tileSize);

                    // Tile border seam
                    ctx.strokeStyle = '#2b9b47';
                    ctx.lineWidth = 1;
                    ctx.strokeRect(x, y, tileSize, tileSize);
                }
            }

            // Store entrance mat & sliding door graphics at bottom
            ctx.fillStyle = '#2b5735';
            ctx.fillRect(80, 1300, 180, 140);
            ctx.fillStyle = '#ffde59';
            ctx.fillRect(160, 1310, 20, 120);
        }

        drawStand(ctx, stand) {
            if (!stand.unlocked) {
                // Draw Locked Pad on Floor
                if (stand.unlockPad) {
                    this.drawUnlockPad(ctx, stand.unlockPad, stand.cost, stand.name);
                }
                return;
            }

            // Draw based on stand type
            if (stand.type === 'tree') {
                this.drawBananaTree(ctx, stand);
            } else if (stand.type === 'farm') {
                this.drawCornFarm(ctx, stand);
            } else if (stand.type === 'shelf') {
                this.drawProduceShelf(ctx, stand);
            } else if (stand.type === 'cashbox') {
                this.drawCashierCounter(ctx, stand);
            } else if (stand.type === 'coop') {
                this.drawChickenCoop(ctx, stand);
            } else if (stand.type === 'pen') {
                this.drawCowPen(ctx, stand);
            } else if (stand.type === 'machine') {
                this.drawPopcornMachine(ctx, stand);
            }
        }

        drawUnlockPad(ctx, pad, cost, name) {
            const time = performance.now() * 0.003;

            // Outer Pulsing Glow
            const pulse = 1 + Math.sin(time * 3) * 0.05;
            ctx.save();
            ctx.translate(pad.x, pad.y);
            ctx.scale(pulse, pulse);

            // Base Circle
            ctx.fillStyle = 'rgba(255, 224, 102, 0.4)';
            ctx.beginPath();
            ctx.arc(0, 0, pad.r, 0, Math.PI * 2);
            ctx.fill();

            // Rotating Dashed Border
            ctx.strokeStyle = '#ffd11a';
            ctx.lineWidth = 4;
            ctx.setLineDash([8, 8]);
            ctx.lineDashOffset = -time * 20;
            ctx.beginPath();
            ctx.arc(0, 0, pad.r - 2, 0, Math.PI * 2);
            ctx.stroke();

            // Inner Badge
            ctx.fillStyle = '#2cb34a';
            ctx.beginPath();
            ctx.arc(0, 0, pad.r - 12, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 3;
            ctx.setLineDash([]);
            ctx.stroke();

            // Cost Text
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 18px Fredoka, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`$${cost}`, 0, 1);

            // Title Label below
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 12px Fredoka, sans-serif';
            ctx.shadowColor = 'rgba(0,0,0,0.6)';
            ctx.shadowBlur = 4;
            ctx.fillText(name, 0, pad.r + 16);

            ctx.restore();
        }

        drawBananaTree(ctx, stand) {
            ctx.save();
            ctx.translate(stand.x, stand.y);

            // Soil Plot & White Wooden Fence
            ctx.fillStyle = '#5c3d20';
            ctx.beginPath();
            ctx.ellipse(0, 35, 75, 45, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#7c5430';
            ctx.lineWidth = 4;
            ctx.stroke();

            // Tree Trunk with bark rings
            ctx.fillStyle = '#8b5a2b';
            ctx.beginPath();
            ctx.moveTo(-16, 35);
            ctx.lineTo(-10, -50);
            ctx.lineTo(10, -50);
            ctx.lineTo(16, 35);
            ctx.closePath();
            ctx.fill();

            // Tropical Banana Palm Fronds (6 layered drooping leaves)
            const leafAngles = [0, 1.05, 2.1, 3.14, 4.2, 5.25];
            leafAngles.forEach((ang, idx) => {
                ctx.save();
                ctx.translate(0, -50);
                ctx.rotate(ang + Math.sin(performance.now() * 0.002 + idx) * 0.05);

                ctx.fillStyle = idx % 2 === 0 ? '#4caf50' : '#388e3c';
                ctx.beginPath();
                ctx.ellipse(45, 0, 48, 16, 0.2, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#2e7d32';
                ctx.lineWidth = 2;
                ctx.stroke();
                ctx.restore();
            });

            // Hanging Ripe Bananas
            for (let i = 0; i < stand.stock; i++) {
                const offX = ((i % 3) - 1) * 16;
                const offY = -25 + Math.floor(i / 3) * 14;
                this.drawBananaItem(ctx, offX, offY, 0.9);
            }

            // Stand Title & Inventory Badge
            this.drawStandBadge(ctx, 0, 75, '🍌', `${stand.stock}/${stand.maxStock}`);

            ctx.restore();
        }

        drawCornFarm(ctx, stand) {
            ctx.save();
            ctx.translate(stand.x, stand.y);

            // Wooden Fence & Tilled Soil Bed
            ctx.fillStyle = '#4a2f1b';
            ctx.fillRect(-70, -20, 140, 90);
            ctx.strokeStyle = '#8d5524';
            ctx.lineWidth = 4;
            ctx.strokeRect(-70, -20, 140, 90);

            // Soil ridges
            ctx.fillStyle = '#3a2414';
            for (let y = -10; y < 70; y += 18) {
                ctx.fillRect(-65, y, 130, 4);
            }

            // Corn Stalks with ears
            for (let i = 0; i < stand.stock; i++) {
                const cx = -50 + (i % 4) * 32;
                const cy = 0 + Math.floor(i / 4) * 35;

                // Green stalk
                ctx.strokeStyle = '#558b2f';
                ctx.lineWidth = 4;
                ctx.beginPath();
                ctx.moveTo(cx, cy + 20);
                ctx.lineTo(cx, cy - 25);
                ctx.stroke();

                // Leaf
                ctx.fillStyle = '#7cb342';
                ctx.beginPath();
                ctx.ellipse(cx + 8, cy - 10, 12, 5, 0.4, 0, Math.PI * 2);
                ctx.fill();

                // Golden Corn Cob
                this.drawCornItem(ctx, cx, cy - 15, 0.8);
            }

            this.drawStandBadge(ctx, 0, 95, '🌽', `${stand.stock}/${stand.maxStock}`);
            ctx.restore();
        }

        drawProduceShelf(ctx, stand) {
            ctx.save();
            ctx.translate(stand.x, stand.y);

            // Drop Shadow
            ctx.fillStyle = 'rgba(0,0,0,0.2)';
            ctx.beginPath();
            ctx.ellipse(0, 45, 60, 20, 0, 0, Math.PI * 2);
            ctx.fill();

            // Wooden Display Rack
            ctx.fillStyle = '#8d5524';
            ctx.fillRect(-55, -20, 110, 60);
            ctx.fillStyle = '#a66d3b';
            ctx.fillRect(-50, -15, 100, 24);
            ctx.fillRect(-50, 14, 100, 22);

            // Red & White Striped Canopy Awning
            ctx.fillStyle = '#e53935';
            ctx.beginPath();
            ctx.moveTo(-60, -20);
            ctx.lineTo(-50, -45);
            ctx.lineTo(50, -45);
            ctx.lineTo(60, -20);
            ctx.closePath();
            ctx.fill();

            // Awning Stripes
            ctx.fillStyle = '#ffffff';
            for (let x = -40; x < 50; x += 22) {
                ctx.fillRect(x, -45, 11, 26);
            }

            // Render Stocked Items inside rack
            for (let i = 0; i < stand.stock; i++) {
                const ix = -38 + (i % 4) * 25;
                const iy = i < 4 ? -4 : 24;

                if (stand.product === 'banana') {
                    this.drawBananaItem(ctx, ix, iy, 0.75);
                } else if (stand.product === 'corn') {
                    this.drawCornItem(ctx, ix, iy, 0.7);
                } else if (stand.product === 'egg') {
                    this.drawEggItem(ctx, ix, iy, 0.8);
                }
            }

            // Price & Stock Tag
            const icon = stand.product === 'banana' ? '🍌' : (stand.product === 'corn' ? '🌽' : '🥚');
            this.drawStandBadge(ctx, 0, 65, `${icon} $${stand.price}`, `${stand.stock}/${stand.maxStock}`);

            ctx.restore();
        }

        drawCashierCounter(ctx, stand) {
            ctx.save();
            ctx.translate(stand.x, stand.y);

            // Drop shadow
            ctx.fillStyle = 'rgba(0,0,0,0.25)';
            ctx.beginPath();
            ctx.ellipse(0, 40, 75, 24, 0, 0, Math.PI * 2);
            ctx.fill();

            // Modern Counter Body
            ctx.fillStyle = '#455a64';
            ctx.fillRect(-65, -25, 130, 65);
            ctx.fillStyle = '#78909c';
            ctx.fillRect(-60, -20, 120, 28); // conveyor surface

            // Cash Register Till
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(20, -45, 34, 30);
            ctx.fillStyle = '#263238';
            ctx.fillRect(24, -41, 26, 12); // digital screen
            ctx.fillStyle = '#00e676';
            ctx.fillRect(26, -39, 10, 4); // price numbers

            // Queuing Footprint Floor Guides
            ctx.fillStyle = 'rgba(255,255,255,0.4)';
            for (let i = 1; i <= 3; i++) {
                ctx.beginPath();
                ctx.arc(0, 50 + i * 42, 10, 0, Math.PI * 2);
                ctx.fill();
            }

            // Stacks of Green Cash Bills on Counter
            if (stand.billsOnCounter > 0) {
                const stackCount = Math.min(6, Math.ceil(stand.billsOnCounter / 15));
                for (let i = 0; i < stackCount; i++) {
                    ctx.fillStyle = '#2e7d32';
                    ctx.fillRect(-45, -5 - i * 5, 28, 14);
                    ctx.strokeStyle = '#ffffff';
                    ctx.lineWidth = 1;
                    ctx.strokeRect(-45, -5 - i * 5, 28, 14);
                }

                // Dollar sign badge
                ctx.fillStyle = '#ffd11a';
                ctx.font = 'bold 14px Fredoka, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(`$${stand.billsOnCounter}`, -31, -25);
            }

            ctx.restore();
        }

        drawChickenCoop(ctx, stand) {
            ctx.save();
            ctx.translate(stand.x, stand.y);

            // Slanted Wooden Coop Roof & Straw Box
            ctx.fillStyle = '#e65100';
            ctx.beginPath();
            ctx.moveTo(-65, -10);
            ctx.lineTo(0, -55);
            ctx.lineTo(65, -10);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = '#8d5524';
            ctx.fillRect(-55, -10, 110, 60);

            // Straw Bedding
            ctx.fillStyle = '#fbc02d';
            ctx.fillRect(-48, 15, 96, 25);

            // Cute White Hen
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(0, 5, 18, 0, Math.PI * 2);
            ctx.fill();
            // Red Comb & Beak
            ctx.fillStyle = '#d50000';
            ctx.beginPath();
            ctx.arc(0, -12, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#ff9800';
            ctx.fillRect(8, 2, 8, 5);

            // Laid Eggs
            for (let i = 0; i < stand.stock; i++) {
                const ex = -35 + (i % 4) * 22;
                const ey = 30 + Math.floor(i / 4) * 8;
                this.drawEggItem(ctx, ex, ey, 0.85);
            }

            this.drawStandBadge(ctx, 0, 75, '🥚', `${stand.stock}/${stand.maxStock}`);
            ctx.restore();
        }

        drawCowPen(ctx, stand) {
            ctx.save();
            ctx.translate(stand.x, stand.y);

            // Pasture Fence & Grass
            ctx.fillStyle = '#4caf50';
            ctx.fillRect(-70, -30, 140, 90);
            ctx.strokeStyle = '#8d5524';
            ctx.lineWidth = 4;
            ctx.strokeRect(-70, -30, 140, 90);

            // Cute Spotted Holstein Dairy Cow
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.ellipse(0, 10, 36, 24, 0, 0, Math.PI * 2);
            ctx.fill();
            // Black spots
            ctx.fillStyle = '#212121';
            ctx.beginPath();
            ctx.arc(-10, 5, 12, 0, Math.PI * 2);
            ctx.arc(14, 12, 10, 0, Math.PI * 2);
            ctx.fill();

            // Head
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(28, -5, 16, 0, Math.PI * 2);
            ctx.fill();
            // Pink snout
            ctx.fillStyle = '#ff80ab';
            ctx.beginPath();
            ctx.ellipse(36, 0, 10, 7, 0, 0, Math.PI * 2);
            ctx.fill();

            // Milk bottles
            for (let i = 0; i < stand.stock; i++) {
                this.drawMilkItem(ctx, -50 + i * 20, 45, 0.8);
            }

            this.drawStandBadge(ctx, 0, 85, '🥛', `${stand.stock}/${stand.maxStock}`);
            ctx.restore();
        }

        drawPopcornMachine(ctx, stand) {
            ctx.save();
            ctx.translate(stand.x, stand.y);

            // Red Popcorn Cart Frame
            ctx.fillStyle = '#d50000';
            ctx.fillRect(-45, -20, 90, 60);

            // Glass heating chamber
            ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.fillRect(-38, -48, 76, 32);

            // Popping kernels
            ctx.fillStyle = '#ffee58';
            for (let i = 0; i < 12; i++) {
                ctx.beginPath();
                ctx.arc(-25 + (i * 7) % 55, -25 - (i * 5) % 18, 4, 0, Math.PI * 2);
                ctx.fill();
            }

            this.drawStandBadge(ctx, 0, 65, '🍿', `$${stand.price}`);
            ctx.restore();
        }

        drawStandBadge(ctx, x, y, icon, text) {
            ctx.save();
            ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
            ctx.beginPath();
            ctx.roundRect(x - 42, y - 12, 84, 24, 12);
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 12px Fredoka, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`${icon} ${text}`, x, y);
            ctx.restore();
        }

        // ==========================================================================
        // CHARACTER RENDERING (Spine-Inspired Procedural 2.5D Rig)
        // ==========================================================================
        drawPlayer(ctx, p) {
            ctx.save();
            ctx.translate(p.x, p.y);

            // Drop Shadow
            ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
            ctx.beginPath();
            ctx.ellipse(0, 18, 22, 10, 0, 0, Math.PI * 2);
            ctx.fill();

            // Run-cycle squash & stretch bobbing
            const speed = Math.hypot(p.vx, p.vy);
            const isMoving = speed > 10;
            const bobY = isMoving ? Math.abs(Math.sin(p.stepCycle * 4)) * -6 : 0;
            const stretch = isMoving ? 1 + Math.sin(p.stepCycle * 8) * 0.08 : 1;

            ctx.translate(0, bobY);
            ctx.scale(2 - stretch, stretch);

            // Draw Monkey Body Rig
            this.drawMonkeyRig(ctx, p.angle, this.selectedHat);

            // Draw Dynamic Carried Stack on Head
            if (p.stack.length > 0) {
                this.drawCarriedStack(ctx, p.stack, p.stackSwayX, p.stackSwayY);
            }

            ctx.restore();
        }

        drawWorker(ctx, w) {
            ctx.save();
            ctx.translate(w.x, w.y);

            // Shadow
            ctx.fillStyle = 'rgba(0,0,0,0.22)';
            ctx.beginPath();
            ctx.ellipse(0, 16, 20, 9, 0, 0, Math.PI * 2);
            ctx.fill();

            if (w.isAsleep) {
                // Sleepy head drooping
                ctx.translate(0, 4);
                this.drawMonkeyRig(ctx, w.angle, w.type === 'stockman' ? 'cap' : 'chef', true);

                // Animated floating "Zzz"
                const t = (w.snoreTime * 2) % 3;
                ctx.fillStyle = '#5ce1e6';
                ctx.font = 'bold 18px Fredoka, sans-serif';
                ctx.fillText('Z', 12 + t * 4, -30 - t * 14);
                ctx.font = 'bold 14px Fredoka, sans-serif';
                ctx.fillText('z', 6 + t * 3, -20 - t * 10);
            } else {
                const isMoving = Math.hypot(w.targetX - w.x, w.targetY - w.y) > 10;
                const bobY = isMoving ? Math.abs(Math.sin(w.stepCycle * 4)) * -5 : 0;
                ctx.translate(0, bobY);

                this.drawMonkeyRig(ctx, w.angle, w.type === 'stockman' ? 'cap' : 'chef');

                if (w.stack && w.stack.length > 0) {
                    this.drawCarriedStack(ctx, w.stack, 0, 0);
                }
            }

            ctx.restore();
        }

        drawMonkeyRig(ctx, angle, hat = 'none', isSleeping = false) {
            ctx.save();
            // Facing orientation (flip horizontally if moving left)
            const isFacingLeft = Math.cos(angle) < 0;
            if (isFacingLeft) ctx.scale(-1, 1);

            // Curled Monkey Tail
            ctx.strokeStyle = '#6d3c1c';
            ctx.lineWidth = 5;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(-10, 6);
            ctx.quadraticCurveTo(-26, 2, -22, -14);
            ctx.stroke();

            // Feet
            ctx.fillStyle = '#f6c99c';
            ctx.beginPath();
            ctx.ellipse(-8, 16, 6, 4, 0, 0, Math.PI * 2);
            ctx.ellipse(8, 16, 6, 4, 0, 0, Math.PI * 2);
            ctx.fill();

            // Main Brown Body
            ctx.fillStyle = '#794427';
            ctx.beginPath();
            ctx.ellipse(0, 4, 18, 16, 0, 0, Math.PI * 2);
            ctx.fill();

            // Peach Tummy Patch
            ctx.fillStyle = '#f6c99c';
            ctx.beginPath();
            ctx.ellipse(2, 6, 11, 10, 0, 0, Math.PI * 2);
            ctx.fill();

            // Big Round Ears
            ctx.fillStyle = '#794427';
            ctx.beginPath();
            ctx.arc(-18, -14, 9, 0, Math.PI * 2);
            ctx.arc(18, -14, 9, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#f6c99c';
            ctx.beginPath();
            ctx.arc(-18, -14, 5, 0, Math.PI * 2);
            ctx.arc(18, -14, 5, 0, Math.PI * 2);
            ctx.fill();

            // Head
            ctx.fillStyle = '#794427';
            ctx.beginPath();
            ctx.arc(0, -14, 17, 0, Math.PI * 2);
            ctx.fill();

            // Tan Muzzle & Smiling Face
            ctx.fillStyle = '#f6c99c';
            ctx.beginPath();
            ctx.ellipse(2, -10, 13, 10, 0, 0, Math.PI * 2);
            ctx.fill();

            if (isSleeping) {
                // Closed sleepy eyes (curved arcs)
                ctx.strokeStyle = '#2b1406';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(-4, -14, 3, 0.2, Math.PI - 0.2);
                ctx.stroke();
                ctx.beginPath();
                ctx.arc(6, -14, 3, 0.2, Math.PI - 0.2);
                ctx.stroke();
            } else {
                // Large expressive cartoon eyes with specular highlights
                ctx.fillStyle = '#2b1406';
                ctx.beginPath();
                ctx.arc(-4, -14, 3.5, 0, Math.PI * 2);
                ctx.arc(6, -14, 3.5, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(-5, -15, 1.2, 0, Math.PI * 2);
                ctx.arc(5, -15, 1.2, 0, Math.PI * 2);
                ctx.fill();

                // Cute Smile
                ctx.strokeStyle = '#794427';
                ctx.lineWidth = 1.8;
                ctx.beginPath();
                ctx.arc(2, -8, 4, 0.1, Math.PI - 0.1);
                ctx.stroke();
            }

            // Draw Hat if equipped
            if (hat !== 'none') {
                this.drawHat(ctx, hat);
            }

            ctx.restore();
        }

        drawHat(ctx, hat) {
            ctx.save();
            ctx.translate(0, -28);

            if (hat === 'cap') {
                ctx.fillStyle = '#d50000';
                ctx.beginPath();
                ctx.arc(0, 0, 14, Math.PI, 0);
                ctx.fill();
                ctx.fillRect(4, -3, 16, 5); // visor
            } else if (hat === 'chef') {
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.ellipse(0, -10, 16, 12, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillRect(-12, -2, 24, 6);
            } else if (hat === 'cowboy') {
                ctx.fillStyle = '#795548';
                ctx.beginPath();
                ctx.ellipse(0, 0, 22, 6, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillRect(-10, -14, 20, 14);
            } else if (hat === 'party') {
                ctx.fillStyle = '#ff4081';
                ctx.beginPath();
                ctx.moveTo(-10, 0);
                ctx.lineTo(0, -24);
                ctx.lineTo(10, 0);
                ctx.closePath();
                ctx.fill();
                ctx.fillStyle = '#ffd600';
                ctx.beginPath();
                ctx.arc(0, -24, 4, 0, Math.PI * 2);
                ctx.fill();
            } else if (hat === 'crown') {
                ctx.fillStyle = '#ffd700';
                ctx.beginPath();
                ctx.moveTo(-12, 0);
                ctx.lineTo(-12, -14);
                ctx.lineTo(-6, -8);
                ctx.lineTo(0, -16);
                ctx.lineTo(6, -8);
                ctx.lineTo(12, -14);
                ctx.lineTo(12, 0);
                ctx.closePath();
                ctx.fill();
                ctx.strokeStyle = '#e65100';
                ctx.lineWidth = 1.5;
                ctx.stroke();
            }

            ctx.restore();
        }

        drawCarriedStack(ctx, stack, swayX, swayY) {
            ctx.save();
            ctx.translate(0, -32);

            stack.forEach((item, idx) => {
                const itemY = -idx * 16;
                // Harmonic sway delay
                const delaySway = (idx + 1) * (swayX * 0.4);
                ctx.save();
                ctx.translate(delaySway, itemY);

                if (item === 'banana') {
                    this.drawBananaItem(ctx, 0, 0, 0.9);
                } else if (item === 'corn') {
                    this.drawCornItem(ctx, 0, 0, 0.85);
                } else if (item === 'egg') {
                    this.drawEggItem(ctx, 0, 0, 0.95);
                } else if (item === 'milk') {
                    this.drawMilkItem(ctx, 0, 0, 0.9);
                } else if (item === 'popcorn') {
                    this.drawPopcornBucket(ctx, 0, 0, 0.85);
                }

                ctx.restore();
            });

            ctx.restore();
        }

        // ==========================================================================
        // ITEM ASSETS (Pure Procedural Vector Graphics)
        // ==========================================================================
        drawBananaItem(ctx, x, y, scale = 1) {
            ctx.save();
            ctx.translate(x, y);
            ctx.scale(scale, scale);

            // Curved Yellow Banana bunch
            ctx.fillStyle = '#ffe438';
            ctx.beginPath();
            ctx.arc(0, -6, 14, 0.4, 2.7);
            ctx.lineWidth = 7;
            ctx.strokeStyle = '#ffe438';
            ctx.lineCap = 'round';
            ctx.stroke();

            // Green stem tip
            ctx.fillStyle = '#7cb342';
            ctx.fillRect(8, -1, 3, 3);
            ctx.restore();
        }

        drawCornItem(ctx, x, y, scale = 1) {
            ctx.save();
            ctx.translate(x, y);
            ctx.scale(scale, scale);

            // Golden Corn Cob
            ctx.fillStyle = '#fbc02d';
            ctx.beginPath();
            ctx.roundRect(-5, -12, 10, 22, 5);
            ctx.fill();

            // Green Leafy Husk Wrap
            ctx.fillStyle = '#689f38';
            ctx.beginPath();
            ctx.moveTo(-6, 8);
            ctx.quadraticCurveTo(-10, -2, -4, -8);
            ctx.lineTo(-4, 10);
            ctx.closePath();
            ctx.fill();

            ctx.restore();
        }

        drawEggItem(ctx, x, y, scale = 1) {
            ctx.save();
            ctx.translate(x, y);
            ctx.scale(scale, scale);

            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.ellipse(0, 0, 7, 10, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#cfd8dc';
            ctx.lineWidth = 1;
            ctx.stroke();

            ctx.restore();
        }

        drawMilkItem(ctx, x, y, scale = 1) {
            ctx.save();
            ctx.translate(x, y);
            ctx.scale(scale, scale);

            // Glass Bottle
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.roundRect(-6, -10, 12, 20, 3);
            ctx.fill();
            // Blue foil cap
            ctx.fillStyle = '#1e88e5';
            ctx.fillRect(-4, -13, 8, 3);
            // Red label band
            ctx.fillStyle = '#e53935';
            ctx.fillRect(-6, -2, 12, 6);

            ctx.restore();
        }

        drawPopcornBucket(ctx, x, y, scale = 1) {
            ctx.save();
            ctx.translate(x, y);
            ctx.scale(scale, scale);

            // Striped Bucket
            ctx.fillStyle = '#e53935';
            ctx.beginPath();
            ctx.moveTo(-8, -8);
            ctx.lineTo(8, -8);
            ctx.lineTo(6, 10);
            ctx.lineTo(-6, 10);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = '#ffffff';
            ctx.fillRect(-3, -8, 6, 18);

            // Fluffy Popcorn top
            ctx.fillStyle = '#fff59d';
            ctx.beginPath();
            ctx.arc(-4, -9, 4, 0, Math.PI * 2);
            ctx.arc(0, -11, 4, 0, Math.PI * 2);
            ctx.arc(4, -9, 4, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        }

        // ==========================================================================
        // CUSTOMER ANIMALS (Panda, Cat, Bunny, Monkey)
        // ==========================================================================
        drawCustomer(ctx, c) {
            ctx.save();
            ctx.translate(c.x, c.y);

            // Shadow
            ctx.fillStyle = 'rgba(0,0,0,0.2)';
            ctx.beginPath();
            ctx.ellipse(0, 14, 18, 8, 0, 0, Math.PI * 2);
            ctx.fill();

            // Bob cycle
            const bobY = Math.abs(Math.sin(c.stepCycle)) * -4;
            ctx.translate(0, bobY);

            // Draw based on animal variety
            if (c.type === 'panda') this.drawPanda(ctx, c);
            else if (c.type === 'cat') this.drawCat(ctx, c);
            else if (c.type === 'bunny') this.drawBunny(ctx, c);
            else this.drawMonkeyRig(ctx, c.angle);

            // Carried item in hands
            if (c.hasItems) {
                if (c.product === 'banana') this.drawBananaItem(ctx, 8, 4, 0.7);
                else if (c.product === 'corn') this.drawCornItem(ctx, 8, 4, 0.7);
                else if (c.product === 'egg') this.drawEggItem(ctx, 8, 4, 0.8);
            }

            // Thought Bubble
            this.drawThoughtBubble(ctx, c);

            ctx.restore();
        }

        drawPanda(ctx, c) {
            // White Chubby Body
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.ellipse(0, 4, 17, 15, 0, 0, Math.PI * 2);
            ctx.fill();

            // Black Panda Ears
            ctx.fillStyle = '#212121';
            ctx.beginPath();
            ctx.arc(-14, -18, 7, 0, Math.PI * 2);
            ctx.arc(14, -18, 7, 0, Math.PI * 2);
            ctx.fill();

            // Head
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(0, -12, 16, 0, Math.PI * 2);
            ctx.fill();

            // Black Eye Patches
            ctx.fillStyle = '#212121';
            ctx.beginPath();
            ctx.ellipse(-6, -12, 4, 6, 0.2, 0, Math.PI * 2);
            ctx.ellipse(6, -12, 4, 6, -0.2, 0, Math.PI * 2);
            ctx.fill();

            // Eyes & Snout
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(-6, -12, 1.5, 0, Math.PI * 2);
            ctx.arc(6, -12, 1.5, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#212121';
            ctx.beginPath();
            ctx.arc(0, -7, 2.5, 0, Math.PI * 2);
            ctx.fill();
        }

        drawCat(ctx, c) {
            // Ginger Tabby Body
            ctx.fillStyle = '#ff9800';
            ctx.beginPath();
            ctx.ellipse(0, 4, 16, 14, 0, 0, Math.PI * 2);
            ctx.fill();

            // Pointy Ears
            ctx.fillStyle = '#e65100';
            ctx.beginPath();
            ctx.moveTo(-14, -12);
            ctx.lineTo(-8, -26);
            ctx.lineTo(-2, -12);
            ctx.closePath();
            ctx.fill();

            ctx.beginPath();
            ctx.moveTo(14, -12);
            ctx.lineTo(8, -26);
            ctx.lineTo(2, -12);
            ctx.closePath();
            ctx.fill();

            // Head
            ctx.fillStyle = '#ff9800';
            ctx.beginPath();
            ctx.arc(0, -10, 14, 0, Math.PI * 2);
            ctx.fill();

            // Eyes
            ctx.fillStyle = '#212121';
            ctx.beginPath();
            ctx.arc(-4, -10, 2, 0, Math.PI * 2);
            ctx.arc(4, -10, 2, 0, Math.PI * 2);
            ctx.fill();
        }

        drawBunny(ctx, c) {
            // White Bunny Body
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.ellipse(0, 4, 15, 14, 0, 0, Math.PI * 2);
            ctx.fill();

            // Long Bunny Ears
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.ellipse(-6, -26, 5, 14, -0.1, 0, Math.PI * 2);
            ctx.ellipse(6, -26, 5, 14, 0.1, 0, Math.PI * 2);
            ctx.fill();
            // Pink inner ear
            ctx.fillStyle = '#f48fb1';
            ctx.beginPath();
            ctx.ellipse(-6, -26, 2.5, 9, -0.1, 0, Math.PI * 2);
            ctx.ellipse(6, -26, 2.5, 9, 0.1, 0, Math.PI * 2);
            ctx.fill();

            // Head & Face
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(0, -10, 13, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#f06292';
            ctx.beginPath();
            ctx.arc(0, -7, 2, 0, Math.PI * 2);
            ctx.fill();
        }

        drawThoughtBubble(ctx, c) {
            if (c.state === 'leaving') return;

            ctx.save();
            ctx.translate(0, -42);

            // Cloud bubble
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.roundRect(-20, -14, 40, 26, 12);
            ctx.fill();
            ctx.strokeStyle = '#4a2810';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Small connecting circles
            ctx.beginPath();
            ctx.arc(-4, 16, 3, 0, Math.PI * 2);
            ctx.arc(-2, 22, 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Icon inside bubble
            if (!c.hasItems) {
                const icon = c.product === 'banana' ? '🍌' : (c.product === 'corn' ? '🌽' : '🥚');
                ctx.font = '14px Fredoka, sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(icon, 0, 0);
            } else {
                ctx.fillStyle = '#38b000';
                ctx.font = 'bold 16px Fredoka, sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('✓', 0, 0);
            }

            ctx.restore();
        }

        drawGoldenPig(ctx, pig) {
            ctx.save();
            ctx.translate(pig.x, pig.y);

            // Running bounce
            const bobY = Math.abs(Math.sin(pig.stepCycle)) * -6;
            ctx.translate(0, bobY);

            // Golden Piggy Bank Body
            ctx.fillStyle = '#ffd700';
            ctx.beginPath();
            ctx.ellipse(0, 0, 22, 16, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#e65100';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Snout
            ctx.fillStyle = '#ffb300';
            ctx.beginPath();
            ctx.ellipse(18, 0, 7, 5, 0, 0, Math.PI * 2);
            ctx.fill();

            // Ears
            ctx.beginPath();
            ctx.arc(-8, -14, 6, 0, Math.PI * 2);
            ctx.fill();

            // Coin Slot on Back
            ctx.fillStyle = '#212121';
            ctx.fillRect(-6, -16, 12, 3);

            ctx.restore();
        }

        // ==========================================================================
        // FLYING MONEY & PARTICLE EFFECTS
        // ==========================================================================
        drawFlyingBills(ctx) {
            this.flyingBills.forEach(b => {
                const t = b.progress;
                // Parabolic Bezier trajectory
                const x = b.x1 + (b.x2 - b.x1) * t;
                const baseY = b.y1 + (b.y2 - b.y1) * t;
                const arc = Math.sin(t * Math.PI) * -b.arcH;
                const y = baseY + arc;

                ctx.save();
                ctx.translate(x, y);
                ctx.rotate(t * 6);

                // Green Dollar Bill
                ctx.fillStyle = '#2e7d32';
                ctx.fillRect(-12, -6, 24, 12);
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 1;
                ctx.strokeRect(-12, -6, 24, 12);
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 9px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('$', 0, 3);

                ctx.restore();
            });
        }

        drawParticles(ctx) {
            this.particles.forEach(p => {
                ctx.save();
                ctx.globalAlpha = p.alpha;
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            });
        }

        drawPopups(ctx) {
            this.popups.forEach(pop => {
                ctx.save();
                ctx.globalAlpha = pop.alpha;
                ctx.fillStyle = pop.color;
                ctx.font = 'bold 18px Fredoka, sans-serif';
                ctx.shadowColor = 'rgba(0,0,0,0.5)';
                ctx.shadowBlur = 4;
                ctx.textAlign = 'center';
                ctx.fillText(pop.text, pop.x, pop.y);
                ctx.restore();
            });
        }
    }

    // Initialize Game on DOM ready
    window.addEventListener('DOMContentLoaded', () => {
        window.game = new Game();
    });
})();
