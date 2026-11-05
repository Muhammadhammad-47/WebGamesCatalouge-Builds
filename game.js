// =========================================================================
// MONKEY MART - Full HTML5 / CSS / JavaScript Simulation Engine
// Inspired by TinyDobbins' Monkey Mart on Poki
// =========================================================================

(function() {
'use strict';

// -------------------------------------------------------------------------
// 1. SOUND MANAGER (Audio & Sound Effects)
// -------------------------------------------------------------------------
class SoundManager {
    constructor() {
        this.muted = false;
        this.audioContext = null;
        this.bgm = null;
        this.sounds = {};
        this.audioInitialized = false;

        this.soundUrls = {
            bgm: 'assets/audio/sound_1.ogg',
            pop: 'assets/audio/sound_2.ogg',
            step: 'assets/audio/sound_3.ogg',
            drop: 'assets/audio/sound_4.ogg',
            coin: 'assets/audio/sound_5.ogg',
            cashier: 'assets/audio/sound_6.ogg',
            unlock: 'assets/audio/sound_7.ogg',
            chime: 'assets/audio/sound_8.ogg',
            click: 'assets/audio/sound_9.ogg',
            win: 'assets/audio/sound_13.ogg'
        };

        this.loadAudio();
    }

    initContext() {
        if (!this.audioInitialized) {
            try {
                const AudioCtx = window.AudioContext || window.webkitAudioContext;
                if (AudioCtx) {
                    this.audioContext = new AudioCtx();
                }
                this.audioInitialized = true;
                this.playBgm();
            } catch (e) {
                console.warn('WebAudio not supported:', e);
            }
        }
    }

    loadAudio() {
        for (const [key, url] of Object.entries(this.soundUrls)) {
            const audio = new Audio();
            audio.src = url;
            audio.preload = 'auto';
            if (key === 'bgm') {
                audio.loop = true;
                audio.volume = 0.45;
                this.bgm = audio;
            } else {
                audio.volume = 0.6;
                this.sounds[key] = audio;
            }
        }
    }

    playBgm() {
        if (this.muted || !this.bgm) return;
        this.bgm.play().catch(() => {});
    }

    pauseBgm() {
        if (this.bgm) {
            this.bgm.pause();
        }
    }

    play(key) {
        if (this.muted) return;
        const sound = this.sounds[key];
        if (sound) {
            try {
                const clone = sound.cloneNode();
                clone.volume = sound.volume;
                clone.play().catch(() => {});
            } catch (e) {}
        }
    }

    toggleMute() {
        this.muted = !this.muted;
        if (this.muted) {
            this.pauseBgm();
        } else {
            this.playBgm();
        }
        return this.muted;
    }
}

// -------------------------------------------------------------------------
// 2. ASSET MANAGER (Sprite & Image Loader)
// -------------------------------------------------------------------------
class AssetManager {
    constructor(onProgress, onComplete) {
        this.images = {};
        this.total = 0;
        this.loaded = 0;
        this.onProgress = onProgress;
        this.onComplete = onComplete;

        this.spriteList = [
            'banana_shelf', 'banana_tree', 'bonus_parrot', 'bonus_pig',
            'cashier_monkey', 'checkout_counter', 'chicken_coop', 'corn_plot',
            'corn_shelf', 'cow_pen', 'customer_bunny', 'customer_cat',
            'customer_panda', 'egg_shelf', 'hat_chef', 'hat_cowboy',
            'hat_crown', 'hat_party', 'hat_pirate', 'hat_propeller',
            'hat_shop_stand', 'item_banana', 'item_cash', 'item_corn',
            'item_egg', 'item_milk', 'item_popcorn', 'milk_shelf',
            'player_idle', 'player_walk1', 'player_walk2', 'popcorn_machine',
            'ui_coin', 'ui_diamond', 'upgrade_stand', 'worker_monkey'
        ];

        this.loadAll();
    }

    loadAll() {
        this.total = this.spriteList.length;
        if (this.total === 0) {
            this.onComplete();
            return;
        }

        for (const name of this.spriteList) {
            const img = new Image();
            img.src = `assets/sprites/${name}.png`;
            img.onload = () => {
                this.loaded++;
                this.onProgress(this.loaded / this.total);
                if (this.loaded >= this.total) {
                    this.onComplete();
                }
            };
            img.onerror = () => {
                this.loaded++;
                this.onProgress(this.loaded / this.total);
                if (this.loaded >= this.total) {
                    this.onComplete();
                }
            };
            this.images[name] = img;
        }
    }

    get(name) {
        return this.images[name];
    }
}

// -------------------------------------------------------------------------
// 3. PARTICLE & VISUAL EFFECTS
// -------------------------------------------------------------------------
class ParticleSystem {
    constructor() {
        this.particles = [];
        this.texts = [];
        this.floatingCash = [];
    }

    addConfetti(x, y, count = 25) {
        const colors = ['#FFEB3B', '#FF9800', '#4CAF50', '#00E5FF', '#E91E63'];
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 5;
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 2,
                color: colors[Math.floor(Math.random() * colors.length)],
                size: 4 + Math.random() * 5,
                alpha: 1,
                decay: 0.015 + Math.random() * 0.02,
                rot: Math.random() * 360,
                vrot: (Math.random() - 0.5) * 10
            });
        }
    }

    addDust(x, y) {
        this.particles.push({
            x: x + (Math.random() - 0.5) * 10,
            y: y + (Math.random() - 0.5) * 6,
            vx: (Math.random() - 0.5) * 0.8,
            vy: -0.5 - Math.random() * 0.5,
            color: 'rgba(255, 255, 255, 0.4)',
            size: 5 + Math.random() * 4,
            alpha: 0.6,
            decay: 0.04
        });
    }

    addText(x, y, text, color = '#4CAF50') {
        this.texts.push({
            x, y, text, color,
            alpha: 1,
            vy: -1.4
        });
    }

    addFlyingDollar(fromX, fromY, toX, toY, onArrive) {
        this.floatingCash.push({
            x: fromX,
            y: fromY,
            startX: fromX,
            startY: fromY,
            targetX: toX,
            targetY: toY,
            t: 0,
            onArrive
        });
    }

    update() {
        // Update particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.12; // gravity
            p.alpha -= p.decay;
            if (p.rot !== undefined) p.rot += p.vrot;
            if (p.alpha <= 0) {
                this.particles.splice(i, 1);
            }
        }

        // Update floating text
        for (let i = this.texts.length - 1; i >= 0; i--) {
            const t = this.texts[i];
            t.y += t.vy;
            t.alpha -= 0.025;
            if (t.alpha <= 0) {
                this.texts.splice(i, 1);
            }
        }

        // Update flying dollar bills
        for (let i = this.floatingCash.length - 1; i >= 0; i--) {
            const b = this.floatingCash[i];
            b.t += 0.08;
            // Bezier arc
            const arcH = -60;
            const midX = (b.startX + b.targetX) / 2;
            const midY = (b.startY + b.targetY) / 2 + arcH;
            const mt = 1 - b.t;
            b.x = mt * mt * b.startX + 2 * mt * b.t * midX + b.t * b.t * b.targetX;
            b.y = mt * mt * b.startY + 2 * mt * b.t * midY + b.t * b.t * b.targetY;

            if (b.t >= 1) {
                if (b.onArrive) b.onArrive();
                this.floatingCash.splice(i, 1);
            }
        }
    }

    draw(ctx, assets) {
        // Particles
        for (const p of this.particles) {
            ctx.save();
            ctx.globalAlpha = Math.max(0, p.alpha);
            ctx.translate(p.x, p.y);
            if (p.rot) ctx.rotate(p.rot * Math.PI / 180);
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(0, 0, p.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        // Flying cash
        const cashImg = assets.get('item_cash');
        for (const b of this.floatingCash) {
            ctx.save();
            ctx.translate(b.x, b.y);
            if (cashImg) {
                ctx.drawImage(cashImg, -16, -16, 32, 32);
            } else {
                ctx.fillStyle = '#4CAF50';
                ctx.fillRect(-12, -8, 24, 16);
            }
            ctx.restore();
        }

        // Floating texts
        for (const t of this.texts) {
            ctx.save();
            ctx.globalAlpha = Math.max(0, t.alpha);
            ctx.font = 'bold 20px Fredoka One, Nunito, sans-serif';
            ctx.fillStyle = t.color;
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 4;
            ctx.strokeText(t.text, t.x, t.y);
            ctx.fillText(t.text, t.x, t.y);
            ctx.restore();
        }
    }
}

// -------------------------------------------------------------------------
// 4. INPUT CONTROLLER
// -------------------------------------------------------------------------
class InputHandler {
    constructor(canvas, joystickZone, joystickKnob) {
        this.keys = {};
        this.touch = { active: false, x: 0, y: 0, vx: 0, vy: 0 };
        this.joystickZone = joystickZone;
        this.joystickKnob = joystickKnob;
        this.joyRadius = 55;
        this.joyCenter = { x: 70, y: 70 };

        this.initKeyboard();
        this.initTouch();
    }

    initKeyboard() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            this.keys[e.key.toLowerCase()] = true;
        });
        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
            this.keys[e.key.toLowerCase()] = false;
        });
    }

    initTouch() {
        const updateKnob = (dx, dy) => {
            const dist = Math.hypot(dx, dy);
            const clampedDist = Math.min(this.joyRadius, dist);
            const angle = Math.atan2(dy, dx);
            const kx = Math.cos(angle) * clampedDist;
            const ky = Math.sin(angle) * clampedDist;

            this.joystickKnob.style.transform = `translate(${kx}px, ${ky}px)`;
            if (dist > 5) {
                this.touch.vx = kx / this.joyRadius;
                this.touch.vy = ky / this.joyRadius;
                this.touch.active = true;
            } else {
                this.touch.vx = 0;
                this.touch.vy = 0;
            }
        };

        const resetKnob = () => {
            this.joystickKnob.style.transform = 'translate(0px, 0px)';
            this.touch.active = false;
            this.touch.vx = 0;
            this.touch.vy = 0;
        };

        this.joystickZone.addEventListener('touchstart', (e) => {
            const rect = this.joystickZone.getBoundingClientRect();
            const touch = e.touches[0];
            const dx = touch.clientX - (rect.left + rect.width / 2);
            const dy = touch.clientY - (rect.top + rect.height / 2);
            updateKnob(dx, dy);
        }, { passive: false });

        this.joystickZone.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const rect = this.joystickZone.getBoundingClientRect();
            const touch = e.touches[0];
            const dx = touch.clientX - (rect.left + rect.width / 2);
            const dy = touch.clientY - (rect.top + rect.height / 2);
            updateKnob(dx, dy);
        }, { passive: false });

        this.joystickZone.addEventListener('touchend', resetKnob);
        this.joystickZone.addEventListener('touchcancel', resetKnob);

        // Canvas drag support for mouse or touch anywhere
        let canvasDragging = false;
        let startX = 0, startY = 0;
        const canvas = document.getElementById('gameCanvas');

        canvas.addEventListener('mousedown', (e) => {
            canvasDragging = true;
            startX = e.clientX;
            startY = e.clientY;
        });

        window.addEventListener('mousemove', (e) => {
            if (!canvasDragging) return;
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            const dist = Math.hypot(dx, dy);
            if (dist > 8) {
                const angle = Math.atan2(dy, dx);
                this.touch.vx = Math.cos(angle);
                this.touch.vy = Math.sin(angle);
                this.touch.active = true;
            }
        });

        window.addEventListener('mouseup', () => {
            if (canvasDragging) {
                canvasDragging = false;
                this.touch.active = false;
                this.touch.vx = 0;
                this.touch.vy = 0;
            }
        });
    }

    getVector() {
        let x = 0;
        let y = 0;

        if (this.keys['KeyA'] || this.keys['ArrowLeft'] || this.keys['a']) x -= 1;
        if (this.keys['KeyD'] || this.keys['ArrowRight'] || this.keys['d']) x += 1;
        if (this.keys['KeyW'] || this.keys['ArrowUp'] || this.keys['w']) y -= 1;
        if (this.keys['KeyS'] || this.keys['ArrowDown'] || this.keys['s']) y += 1;

        if (x !== 0 || y !== 0) {
            const mag = Math.hypot(x, y);
            return { x: x / mag, y: y / mag };
        }

        if (this.touch.active) {
            return { x: this.touch.vx, y: this.touch.vy };
        }

        return { x: 0, y: 0 };
    }
}

// -------------------------------------------------------------------------
// 5. CAMERA SYSTEM
// -------------------------------------------------------------------------
class Camera {
    constructor(width, height) {
        this.x = 0;
        this.y = 0;
        this.width = width;
        this.height = height;
        this.zoom = 1.0;
        this.targetZoom = 1.0;
    }

    update(targetX, targetY, mapW, mapH) {
        // Smooth follow
        this.x += (targetX - this.x) * 0.12;
        this.y += (targetY - this.y) * 0.12;

        // Clamp camera to map boundaries
        const halfW = (this.width / this.zoom) / 2;
        const halfH = (this.height / this.zoom) / 2;

        this.x = Math.max(halfW - 50, Math.min(mapW - halfW + 50, this.x));
        this.y = Math.max(halfH - 50, Math.min(mapH - halfH + 50, this.y));
    }

    apply(ctx) {
        ctx.save();
        ctx.translate(this.width / 2, this.height / 2);
        ctx.scale(this.zoom, this.zoom);
        ctx.translate(-this.x, -this.y);
    }

    restore(ctx) {
        ctx.restore();
    }
}

// -------------------------------------------------------------------------
// 6. MAIN GAME ENGINE
// -------------------------------------------------------------------------
class MonkeyMartGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.joystickZone = document.getElementById('joystick-zone');
        this.joystickKnob = document.getElementById('joystick-knob');

        // Core Systems
        this.sounds = new SoundManager();
        this.particles = new ParticleSystem();
        this.input = new InputHandler(this.canvas, this.joystickZone, this.joystickKnob);
        this.camera = new Camera(window.innerWidth, window.innerHeight);

        // Game Economy & Progress
        this.cash = 25; // Starting cash
        this.diamonds = 10;
        this.equippedHat = null;
        this.purchasedHats = [];

        // Upgrades Levels
        this.upgrades = {
            playerSpeed: 1,      // Base speed = 3.8
            playerCapacity: 1,   // Base capacity = 4
            workerSpeed: 1,      // Base worker speed = 2.4
            workerCapacity: 1    // Base worker capacity = 3
        };

        // Player Monkey
        this.player = {
            x: 450,
            y: 500,
            radius: 26,
            facing: 'down',
            speed: 4.2,
            maxStack: 4,
            stack: [], // list of item strings e.g. ['banana', 'corn']
            walkTimer: 0,
            walkFrame: 0,
            tilt: 0
        };

        // Map Dimension
        this.mapWidth = 1400;
        this.mapHeight = 1100;

        // Assistants
        this.workers = []; // stockman, cashier

        // Customers
        this.customers = [];
        this.maxCustomers = 5;
        this.customerSpawnTimer = 0;

        // World Stations & Objects
        this.stations = {};
        this.unlockPads = [];

        // Bonus Entities
        this.goldenPig = null;
        this.parrot = null;
        this.bonusTimer = 0;

        // UI references
        this.cashEl = document.getElementById('hud-cash');
        this.diamondEl = document.getElementById('hud-diamonds');
        this.toastEl = document.getElementById('toast-banner');

        this.initResize();
        this.initStations();
        this.initUI();
        this.loadSave();

        // Start Asset Loading
        this.assets = new AssetManager(
            (progress) => {
                const fill = document.getElementById('loading-bar-fill');
                if (fill) fill.style.width = `${Math.floor(progress * 100)}%`;
            },
            () => {
                const loadingScreen = document.getElementById('loading-screen');
                if (loadingScreen) {
                    loadingScreen.classList.add('hidden');
                }
                this.lastTime = performance.now();
                requestAnimationFrame((t) => this.loop(t));
                this.showToast('🍌 Welcome to Monkey Mart! Harvest Bananas to start!');
            }
        );

        // Auto Save Every 4 Seconds
        setInterval(() => this.saveGame(), 4000);
    }

    initResize() {
        const resize = () => {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
            this.camera.width = window.innerWidth;
            this.camera.height = window.innerHeight;
            // Responsive zoom based on screen aspect/size
            if (window.innerWidth < 600) {
                this.camera.zoom = 0.75;
            } else if (window.innerWidth < 1000) {
                this.camera.zoom = 0.88;
            } else {
                this.camera.zoom = 1.0;
            }
        };
        window.addEventListener('resize', resize);
        resize();
    }

    // ---------------------------------------------------------------------
    // WORLD & STATIONS INITIALIZATION
    // ---------------------------------------------------------------------
    initStations() {
        // 1. Banana Tree Plantation (Always unlocked initially)
        this.stations.bananaTree = {
            id: 'bananaTree',
            name: 'Banana Tree',
            type: 'producer',
            itemType: 'banana',
            x: 240,
            y: 420,
            width: 130,
            height: 140,
            stock: 6,
            maxStock: 8,
            growTimer: 0,
            growInterval: 1.8,
            unlocked: true,
            sprite: 'banana_tree'
        };

        // 2. Banana Display Shelf
        this.stations.bananaShelf = {
            id: 'bananaShelf',
            name: 'Banana Shelf',
            type: 'shelf',
            itemType: 'banana',
            x: 520,
            y: 420,
            width: 120,
            height: 95,
            stock: 0,
            maxStock: 12,
            unlocked: false,
            sprite: 'banana_shelf'
        };

        // 3. Checkout Counter
        this.stations.checkout = {
            id: 'checkout',
            name: 'Checkout Counter',
            type: 'checkout',
            x: 800,
            y: 430,
            width: 140,
            height: 95,
            unlocked: false,
            cashOnCounter: 0,
            cashPosition: { x: 840, y: 470 },
            sprite: 'checkout_counter',
            queueSpots: [
                { x: 840, y: 340 },
                { x: 840, y: 270 },
                { x: 840, y: 200 }
            ]
        };

        // 4. Corn Farm Plot
        this.stations.cornPlot = {
            id: 'cornPlot',
            name: 'Corn Field',
            type: 'producer',
            itemType: 'corn',
            x: 240,
            y: 720,
            width: 130,
            height: 110,
            stock: 4,
            maxStock: 8,
            growTimer: 0,
            growInterval: 2.2,
            unlocked: false,
            sprite: 'corn_plot'
        };

        // 5. Corn Display Shelf
        this.stations.cornShelf = {
            id: 'cornShelf',
            name: 'Corn Shelf',
            type: 'shelf',
            itemType: 'corn',
            x: 520,
            y: 720,
            width: 120,
            height: 95,
            stock: 0,
            maxStock: 12,
            unlocked: false,
            sprite: 'corn_shelf'
        };

        // 6. Cow Pen (Dairy Station)
        this.stations.cowPen = {
            id: 'cowPen',
            name: 'Dairy Cow',
            type: 'factory',
            inputItem: 'corn',
            itemType: 'milk',
            x: 240,
            y: 960,
            width: 140,
            height: 115,
            rawStock: 0,
            maxRawStock: 6,
            stock: 0,
            maxStock: 6,
            processTimer: 0,
            processInterval: 2.5,
            unlocked: false,
            sprite: 'cow_pen'
        };

        // 7. Milk Cooler Shelf
        this.stations.milkShelf = {
            id: 'milkShelf',
            name: 'Milk Cooler',
            type: 'shelf',
            itemType: 'milk',
            x: 520,
            y: 960,
            width: 120,
            height: 95,
            stock: 0,
            maxStock: 10,
            unlocked: false,
            sprite: 'milk_shelf'
        };

        // 8. Chicken Coop (Egg Station)
        this.stations.chickenCoop = {
            id: 'chickenCoop',
            name: 'Chicken Coop',
            type: 'factory',
            inputItem: 'corn',
            itemType: 'egg',
            x: 820,
            y: 720,
            width: 130,
            height: 105,
            rawStock: 0,
            maxRawStock: 6,
            stock: 0,
            maxStock: 8,
            processTimer: 0,
            processInterval: 2.8,
            unlocked: false,
            sprite: 'chicken_coop'
        };

        // 9. Egg Display Shelf
        this.stations.eggShelf = {
            id: 'eggShelf',
            name: 'Egg Shelf',
            type: 'shelf',
            itemType: 'egg',
            x: 1080,
            y: 720,
            width: 120,
            height: 95,
            stock: 0,
            maxStock: 10,
            unlocked: false,
            sprite: 'egg_shelf'
        };

        // 10. Popcorn Machine
        this.stations.popcornMachine = {
            id: 'popcornMachine',
            name: 'Popcorn Machine',
            type: 'factory',
            inputItem: 'corn',
            itemType: 'popcorn',
            x: 1080,
            y: 430,
            width: 120,
            height: 110,
            rawStock: 0,
            maxRawStock: 6,
            stock: 0,
            maxStock: 8,
            processTimer: 0,
            processInterval: 3.0,
            unlocked: false,
            sprite: 'popcorn_machine'
        };

        // Upgrade Stand & Hat Shop Stand
        this.stations.upgradeStand = {
            id: 'upgradeStand',
            name: 'Upgrades',
            type: 'interactable',
            x: 540,
            y: 220,
            width: 90,
            height: 90,
            unlocked: true,
            sprite: 'upgrade_stand',
            onInteract: () => this.openModal('upgrades-modal')
        };

        this.stations.hatShopStand = {
            id: 'hatShopStand',
            name: 'Hat Shop',
            type: 'interactable',
            x: 690,
            y: 220,
            width: 90,
            height: 90,
            unlocked: true,
            sprite: 'hat_shop_stand',
            onInteract: () => this.openModal('hats-modal')
        };

        // -----------------------------------------------------------------
        // UNLOCK PADS (Progressive Supermarket Expansion)
        // -----------------------------------------------------------------
        this.unlockPads = [
            {
                stationId: 'bananaShelf',
                name: 'Banana Stand',
                cost: 15,
                paid: 0,
                x: 520,
                y: 420,
                radius: 46,
                prereq: []
            },
            {
                stationId: 'checkout',
                name: 'Cash Register',
                cost: 20,
                paid: 0,
                x: 800,
                y: 430,
                radius: 46,
                prereq: ['bananaShelf']
            },
            {
                stationId: 'cornPlot',
                name: 'Corn Field',
                cost: 35,
                paid: 0,
                x: 240,
                y: 720,
                radius: 46,
                prereq: ['checkout']
            },
            {
                stationId: 'cornShelf',
                name: 'Corn Shelf',
                cost: 50,
                paid: 0,
                x: 520,
                y: 720,
                radius: 46,
                prereq: ['cornPlot']
            },
            {
                workerType: 'stockman',
                name: 'Hire Stockman',
                cost: 60,
                paid: 0,
                x: 380,
                y: 570,
                radius: 44,
                prereq: ['cornShelf']
            },
            {
                stationId: 'cowPen',
                name: 'Dairy Cow',
                cost: 80,
                paid: 0,
                x: 240,
                y: 960,
                radius: 46,
                prereq: ['cornShelf']
            },
            {
                stationId: 'milkShelf',
                name: 'Milk Shelf',
                cost: 100,
                paid: 0,
                x: 520,
                y: 960,
                radius: 46,
                prereq: ['cowPen']
            },
            {
                workerType: 'cashier',
                name: 'Hire Cashier',
                cost: 120,
                paid: 0,
                x: 800,
                y: 540,
                radius: 44,
                prereq: ['milkShelf']
            },
            {
                stationId: 'chickenCoop',
                name: 'Chicken Coop',
                cost: 150,
                paid: 0,
                x: 820,
                y: 720,
                radius: 46,
                prereq: ['milkShelf']
            },
            {
                stationId: 'eggShelf',
                name: 'Egg Shelf',
                cost: 180,
                paid: 0,
                x: 1080,
                y: 720,
                radius: 46,
                prereq: ['chickenCoop']
            },
            {
                stationId: 'popcornMachine',
                name: 'Popcorn Cart',
                cost: 220,
                paid: 0,
                x: 1080,
                y: 430,
                radius: 46,
                prereq: ['eggShelf']
            }
        ];
    }

    // ---------------------------------------------------------------------
    // UI & MODAL INTERACTION
    // ---------------------------------------------------------------------
    initUI() {
        // Sound toggle
        const btnSound = document.getElementById('btn-sound');
        if (btnSound) {
            btnSound.addEventListener('click', () => {
                const muted = this.sounds.toggleMute();
                btnSound.style.opacity = muted ? '0.5' : '1';
                this.showToast(muted ? '🔇 Sound Muted' : '🔊 Sound Enabled');
            });
        }

        // Upgrades button
        const btnUpgrade = document.getElementById('btn-upgrade');
        if (btnUpgrade) {
            btnUpgrade.addEventListener('click', () => {
                this.sounds.play('click');
                this.openModal('upgrades-modal');
            });
        }

        // Hats button
        const btnHats = document.getElementById('btn-hats');
        if (btnHats) {
            btnHats.addEventListener('click', () => {
                this.sounds.play('click');
                this.openModal('hats-modal');
            });
        }

        // Pause / Exit button
        const btnPause = document.getElementById('btn-pause');
        if (btnPause) {
            btnPause.addEventListener('click', () => {
                this.sounds.play('click');
                this.openModal('exit-modal');
            });
        }

        // Modal Close Buttons
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.sounds.play('click');
                const overlay = e.target.closest('.modal-overlay');
                if (overlay) overlay.classList.remove('active');
            });
        });

        // Resume Game
        const btnResume = document.getElementById('btn-resume');
        if (btnResume) {
            btnResume.addEventListener('click', () => {
                this.sounds.play('click');
                document.getElementById('exit-modal').classList.remove('active');
            });
        }

        // Exit Game
        const btnConfirmExit = document.getElementById('btn-confirm-exit');
        if (btnConfirmExit) {
            btnConfirmExit.addEventListener('click', () => {
                window.parent.postMessage('closeModal', '*');
                this.showToast('Exiting game...');
            });
        }

        // First click gesture to initiate audio
        window.addEventListener('click', () => this.sounds.initContext(), { once: true });
        window.addEventListener('touchstart', () => this.sounds.initContext(), { once: true });

        this.renderUpgradeModal();
        this.renderHatsModal();
    }

    openModal(id) {
        const modal = document.getElementById(id);
        if (modal) {
            if (id === 'upgrades-modal') this.renderUpgradeModal();
            if (id === 'hats-modal') this.renderHatsModal();
            modal.classList.add('active');
        }
    }

    showToast(message) {
        if (!this.toastEl) return;
        this.toastEl.textContent = message;
        this.toastEl.classList.add('show');
        clearTimeout(this.toastTimeout);
        this.toastTimeout = setTimeout(() => {
            this.toastEl.classList.remove('show');
        }, 2800);
    }

    renderUpgradeModal() {
        const container = document.getElementById('upgrades-list');
        if (!container) return;

        const upgradeDefs = [
            {
                key: 'playerSpeed',
                name: 'Player Speed',
                baseCost: 20,
                costMult: 1.8,
                getStat: lvl => `${(3.8 + lvl * 0.45).toFixed(1)} m/s`,
                getNext: lvl => `${(3.8 + (lvl + 1) * 0.45).toFixed(1)} m/s`
            },
            {
                key: 'playerCapacity',
                name: 'Stack Capacity',
                baseCost: 25,
                costMult: 2.0,
                getStat: lvl => `${3 + lvl * 2} items`,
                getNext: lvl => `${3 + (lvl + 1) * 2} items`
            },
            {
                key: 'workerSpeed',
                name: 'Worker Speed',
                baseCost: 35,
                costMult: 1.9,
                getStat: lvl => `${(2.2 + lvl * 0.4).toFixed(1)} m/s`,
                getNext: lvl => `${(2.2 + (lvl + 1) * 0.4).toFixed(1)} m/s`
            },
            {
                key: 'workerCapacity',
                name: 'Worker Capacity',
                baseCost: 40,
                costMult: 2.1,
                getStat: lvl => `${2 + lvl * 2} items`,
                getNext: lvl => `${2 + (lvl + 1) * 2} items`
            }
        ];

        container.innerHTML = '';
        upgradeDefs.forEach(u => {
            const currentLvl = this.upgrades[u.key] || 1;
            const cost = Math.floor(u.baseCost * Math.pow(u.costMult, currentLvl - 1));
            const canAfford = this.cash >= cost;

            const card = document.createElement('div');
            card.className = 'upgrade-card';
            card.innerHTML = `
                <div class="upgrade-info">
                    <div class="upgrade-name">${u.name} (Lvl ${currentLvl})</div>
                    <div class="upgrade-stat">${u.getStat(currentLvl)} ➔ ${u.getNext(currentLvl)}</div>
                </div>
                <button class="btn-buy-upgrade" ${canAfford ? '' : 'disabled'}>
                    <span>$${cost}</span>
                </button>
            `;

            const btn = card.querySelector('button');
            btn.addEventListener('click', () => {
                if (this.cash >= cost) {
                    this.cash -= cost;
                    this.upgrades[u.key]++;
                    this.sounds.play('unlock');
                    this.particles.addConfetti(this.player.x, this.player.y, 20);
                    this.showToast(`✨ ${u.name} Upgraded to Level ${this.upgrades[u.key]}!`);
                    this.updateStats();
                    this.renderUpgradeModal();
                    this.updateHUD();
                }
            });

            container.appendChild(card);
        });
    }

    renderHatsModal() {
        const grid = document.getElementById('hats-grid');
        if (!grid) return;

        const hats = [
            { id: 'cowboy', name: 'Cowboy Hat', price: 40, sprite: 'hat_cowboy' },
            { id: 'chef', name: 'Chef Hat', price: 75, sprite: 'hat_chef' },
            { id: 'party', name: 'Party Cone', price: 120, sprite: 'hat_party' },
            { id: 'pirate', name: 'Pirate Tricorn', price: 200, sprite: 'hat_pirate' },
            { id: 'propeller', name: 'Propeller Beanie', price: 300, sprite: 'hat_propeller' },
            { id: 'crown', name: 'Royal Crown', price: 500, sprite: 'hat_crown' }
        ];

        grid.innerHTML = '';
        hats.forEach(h => {
            const owned = this.purchasedHats.includes(h.id);
            const isEquipped = this.equippedHat === h.id;

            const card = document.createElement('div');
            card.className = `hat-card ${isEquipped ? 'equipped' : ''}`;
            card.innerHTML = `
                <img src="assets/sprites/${h.sprite}.png" alt="${h.name}">
                <div class="hat-name">${h.name}</div>
                <button class="hat-btn ${isEquipped ? 'equipped' : (owned ? 'equip' : 'buy')}">
                    ${isEquipped ? 'Equipped' : (owned ? 'Equip' : `$${h.price}`)}
                </button>
            `;

            const btn = card.querySelector('button');
            btn.addEventListener('click', () => {
                if (isEquipped) {
                    this.equippedHat = null;
                    this.sounds.play('click');
                } else if (owned) {
                    this.equippedHat = h.id;
                    this.sounds.play('unlock');
                    this.showToast(`🤠 Equipped ${h.name}!`);
                } else if (this.cash >= h.price) {
                    this.cash -= h.price;
                    this.purchasedHats.push(h.id);
                    this.equippedHat = h.id;
                    this.sounds.play('unlock');
                    this.particles.addConfetti(this.player.x, this.player.y, 25);
                    this.showToast(`🎉 Purchased & Equipped ${h.name}!`);
                    this.updateHUD();
                } else {
                    this.sounds.play('step');
                    this.showToast(`Not enough cash for ${h.name}!`);
                }
                this.renderHatsModal();
            });

            grid.appendChild(card);
        });
    }

    updateStats() {
        this.player.speed = 3.8 + (this.upgrades.playerSpeed || 1) * 0.45;
        this.player.maxStack = 3 + (this.upgrades.playerCapacity || 1) * 2;

        const wSpeed = 2.2 + (this.upgrades.workerSpeed || 1) * 0.4;
        const wCap = 2 + (this.upgrades.workerCapacity || 1) * 2;
        this.workers.forEach(w => {
            w.speed = wSpeed;
            w.maxStack = wCap;
        });
    }

    updateHUD() {
        if (this.cashEl) this.cashEl.textContent = `$${this.cash}`;
        if (this.diamondEl) this.diamondEl.textContent = this.diamonds;
    }

    // ---------------------------------------------------------------------
    // PERSISTENCE (Save & Load)
    // ---------------------------------------------------------------------
    saveGame() {
        const unlockedStations = Object.keys(this.stations).filter(k => this.stations[k].unlocked);
        const data = {
            cash: this.cash,
            diamonds: this.diamonds,
            upgrades: this.upgrades,
            equippedHat: this.equippedHat,
            purchasedHats: this.purchasedHats,
            unlockedStations,
            padProgress: this.unlockPads.map(p => ({
                id: p.stationId || p.workerType,
                paid: p.paid
            }))
        };
        try {
            localStorage.setItem('ciel_monkey_mart_save', JSON.stringify(data));
        } catch (e) {}
    }

    loadSave() {
        try {
            const raw = localStorage.getItem('ciel_monkey_mart_save');
            if (raw) {
                const data = JSON.parse(raw);
                if (typeof data.cash === 'number') this.cash = data.cash;
                if (typeof data.diamonds === 'number') this.diamonds = data.diamonds;
                if (data.upgrades) this.upgrades = data.upgrades;
                if (data.equippedHat) this.equippedHat = data.equippedHat;
                if (Array.isArray(data.purchasedHats)) this.purchasedHats = data.purchasedHats;

                if (Array.isArray(data.unlockedStations)) {
                    data.unlockedStations.forEach(k => {
                        if (this.stations[k]) this.stations[k].unlocked = true;
                    });
                }

                if (Array.isArray(data.padProgress)) {
                    data.padProgress.forEach(savedP => {
                        const pad = this.unlockPads.find(p => (p.stationId || p.workerType) === savedP.id);
                        if (pad) pad.paid = savedP.paid || 0;
                    });
                }

                // Restore workers if unlocked
                const hasStockman = this.unlockPads.find(p => p.workerType === 'stockman' && p.paid >= p.cost);
                if (hasStockman) this.spawnWorker('stockman');

                const hasCashier = this.unlockPads.find(p => p.workerType === 'cashier' && p.paid >= p.cost);
                if (hasCashier) this.spawnWorker('cashier');
            }
        } catch (e) {}

        this.updateStats();
        this.updateHUD();
    }

    // ---------------------------------------------------------------------
    // SPAWNERS & WORKERS
    // ---------------------------------------------------------------------
    spawnWorker(type) {
        if (this.workers.some(w => w.type === type)) return;

        const w = {
            type,
            x: type === 'cashier' ? 800 : 400,
            y: type === 'cashier' ? 490 : 500,
            targetX: 400,
            targetY: 500,
            speed: 2.2 + (this.upgrades.workerSpeed || 1) * 0.4,
            stack: [],
            maxStack: 2 + (this.upgrades.workerCapacity || 1) * 2,
            actionTimer: 0,
            state: 'idle',
            sleepy: false,
            sleepTimer: 0
        };
        this.workers.push(w);
    }

    spawnCustomer() {
        if (this.customers.length >= this.maxCustomers) return;

        // Choose item based on available unlocked shelves
        const availableItems = [];
        if (this.stations.bananaShelf.unlocked) availableItems.push('banana');
        if (this.stations.cornShelf.unlocked) availableItems.push('corn');
        if (this.stations.milkShelf.unlocked) availableItems.push('milk');
        if (this.stations.eggShelf.unlocked) availableItems.push('egg');
        if (this.stations.popcornMachine.unlocked) availableItems.push('popcorn');

        if (availableItems.length === 0) return;

        const animalTypes = ['customer_monkey', 'customer_panda', 'customer_cat', 'customer_bunny'];
        const chosenAnimal = animalTypes[Math.floor(Math.random() * animalTypes.length)];
        const desiredItem = availableItems[Math.floor(Math.random() * availableItems.length)];

        const c = {
            x: 750 + (Math.random() - 0.5) * 40,
            y: 80, // Entrance at the top
            targetX: 750,
            targetY: 80,
            speed: 2.2 + Math.random() * 0.4,
            sprite: chosenAnimal,
            item: desiredItem,
            hasItem: false,
            state: 'enter', // enter, to_shelf, browse, to_queue, in_queue, leaving
            queueIndex: -1,
            browseTimer: 0
        };

        this.customers.push(c);
        this.sounds.play('chime');
    }

    // ---------------------------------------------------------------------
    // MAIN GAME LOOP & UPDATES
    // ---------------------------------------------------------------------
    loop(currentTime) {
        const dt = Math.min(0.05, (currentTime - this.lastTime) / 1000);
        this.lastTime = currentTime;

        this.update(dt);
        this.draw();

        requestAnimationFrame((t) => this.loop(t));
    }

    update(dt) {
        this.updatePlayer(dt);
        this.updateStations(dt);
        this.updateUnlockPads(dt);
        this.updateCustomers(dt);
        this.updateWorkers(dt);
        this.updateBonusEvents(dt);
        this.particles.update();
        this.camera.update(this.player.x, this.player.y, this.mapWidth, this.mapHeight);
    }

    updatePlayer(dt) {
        const dir = this.input.getVector();

        if (dir.x !== 0 || dir.y !== 0) {
            this.player.x += dir.x * this.player.speed;
            this.player.y += dir.y * this.player.speed;

            // Facing
            if (Math.abs(dir.x) > Math.abs(dir.y)) {
                this.player.facing = dir.x > 0 ? 'right' : 'left';
            } else {
                this.player.facing = dir.y > 0 ? 'down' : 'up';
            }

            // Walk animation
            this.player.walkTimer += dt * 9;
            this.player.walkFrame = Math.floor(this.player.walkTimer) % 2 + 1;

            // Tilt carried stack
            this.player.tilt = dir.x * -0.15;

            // Step particles
            if (Math.random() < 0.25) {
                this.particles.addDust(this.player.x, this.player.y + 20);
            }
        } else {
            this.player.walkFrame = 0;
            this.player.tilt = 0;
        }

        // Keep player in supermarket bounds
        this.player.x = Math.max(120, Math.min(this.mapWidth - 120, this.player.x));
        this.player.y = Math.max(150, Math.min(this.mapHeight - 120, this.player.y));

        // Player Harvesting / Restocking Collisions
        this.handlePlayerInteractions();
    }

    handlePlayerInteractions() {
        // Interact with Tree / Plots
        for (const [id, st] of Object.entries(this.stations)) {
            if (!st.unlocked) continue;

            const dist = Math.hypot(this.player.x - st.x, this.player.y - st.y);
            if (dist < 75) {
                // Producer: Harvest ripe items into player stack
                if (st.type === 'producer' && st.stock > 0) {
                    if (this.player.stack.length < this.player.maxStack) {
                        st.stock--;
                        this.player.stack.push(st.itemType);
                        this.sounds.play('pop');
                        this.particles.addText(this.player.x, this.player.y - 40, `+1 🍌`);
                    }
                }

                // Shelf: Restock items from player stack
                if (st.type === 'shelf') {
                    const itemIdx = this.player.stack.indexOf(st.itemType);
                    if (itemIdx !== -1 && st.stock < st.maxStock) {
                        this.player.stack.splice(itemIdx, 1);
                        st.stock++;
                        this.sounds.play('drop');
                        this.particles.addText(st.x, st.y - 40, `+1 Shelf`, '#8BC34A');
                    }
                }

                // Factory: Supply raw materials & collect produced goods
                if (st.type === 'factory') {
                    // Collect finished goods
                    if (st.stock > 0 && this.player.stack.length < this.player.maxStack) {
                        st.stock--;
                        this.player.stack.push(st.itemType);
                        this.sounds.play('pop');
                        this.particles.addText(this.player.x, this.player.y - 40, `+1 ${st.itemType.toUpperCase()}`);
                    }
                    // Supply corn/raw item
                    const rawIdx = this.player.stack.indexOf(st.inputItem);
                    if (rawIdx !== -1 && st.rawStock < st.maxRawStock) {
                        this.player.stack.splice(rawIdx, 1);
                        st.rawStock++;
                        this.sounds.play('drop');
                    }
                }

                // Checkout Counter: Collect cash
                if (st.type === 'checkout' && st.cashOnCounter > 0) {
                    const gained = st.cashOnCounter;
                    this.cash += gained;
                    st.cashOnCounter = 0;
                    this.sounds.play('coin');
                    this.particles.addText(this.player.x, this.player.y - 50, `+$${gained}`, '#FFD700');
                    this.particles.addConfetti(st.cashPosition.x, st.cashPosition.y, 12);
                    this.updateHUD();
                }

                // Interactable stands
                if (st.type === 'interactable' && st.onInteract && !this.lastInteract) {
                    st.onInteract();
                    this.lastInteract = true;
                    setTimeout(() => { this.lastInteract = false; }, 800);
                }
            }
        }
    }

    updateStations(dt) {
        // Grow banana tree
        const tree = this.stations.bananaTree;
        if (tree && tree.unlocked && tree.stock < tree.maxStock) {
            tree.growTimer += dt;
            if (tree.growTimer >= tree.growInterval) {
                tree.growTimer = 0;
                tree.stock++;
            }
        }

        // Grow corn plot
        const corn = this.stations.cornPlot;
        if (corn && corn.unlocked && corn.stock < corn.maxStock) {
            corn.growTimer += dt;
            if (corn.growTimer >= corn.growInterval) {
                corn.growTimer = 0;
                corn.stock++;
            }
        }

        // Process Cow Milk
        const cow = this.stations.cowPen;
        if (cow && cow.unlocked && cow.rawStock > 0 && cow.stock < cow.maxStock) {
            cow.processTimer += dt;
            if (cow.processTimer >= cow.processInterval) {
                cow.processTimer = 0;
                cow.rawStock--;
                cow.stock++;
            }
        }

        // Process Chicken Eggs
        const coop = this.stations.chickenCoop;
        if (coop && coop.unlocked && coop.rawStock > 0 && coop.stock < coop.maxStock) {
            coop.processTimer += dt;
            if (coop.processTimer >= coop.processInterval) {
                coop.processTimer = 0;
                coop.rawStock--;
                coop.stock++;
            }
        }

        // Process Popcorn
        const pop = this.stations.popcornMachine;
        if (pop && pop.unlocked && pop.rawStock > 0 && pop.stock < pop.maxStock) {
            pop.processTimer += dt;
            if (pop.processTimer >= pop.processInterval) {
                pop.processTimer = 0;
                pop.rawStock--;
                pop.stock++;
            }
        }
    }

    updateUnlockPads(dt) {
        for (const pad of this.unlockPads) {
            // Check prerequisites
            const ready = pad.prereq.every(pId => {
                if (this.stations[pId]) return this.stations[pId].unlocked;
                return true;
            });

            if (!ready) continue;

            const isUnlocked = pad.stationId ? this.stations[pad.stationId].unlocked : (pad.paid >= pad.cost);
            if (isUnlocked) continue;

            // Player stepping on pad
            const dist = Math.hypot(this.player.x - pad.x, this.player.y - pad.y);
            if (dist < pad.radius + 15 && this.cash > 0 && pad.paid < pad.cost) {
                const streamAmount = Math.min(this.cash, Math.min(2, pad.cost - pad.paid));
                this.cash -= streamAmount;
                pad.paid += streamAmount;
                this.updateHUD();

                this.particles.addFlyingDollar(this.player.x, this.player.y, pad.x, pad.y);
                this.sounds.play('step');

                // Completion
                if (pad.paid >= pad.cost) {
                    if (pad.stationId && this.stations[pad.stationId]) {
                        this.stations[pad.stationId].unlocked = true;
                    }
                    if (pad.workerType) {
                        this.spawnWorker(pad.workerType);
                    }
                    this.sounds.play('unlock');
                    this.particles.addConfetti(pad.x, pad.y, 40);
                    this.showToast(`🎉 UNLOCKED: ${pad.name}!`);
                    this.renderUpgradeModal();
                }
            }
        }
    }

    updateCustomers(dt) {
        this.customerSpawnTimer += dt;
        if (this.customerSpawnTimer >= 2.5) {
            this.customerSpawnTimer = 0;
            this.spawnCustomer();
        }

        const checkout = this.stations.checkout;
        const isCheckoutUnlocked = checkout && checkout.unlocked;

        for (let i = this.customers.length - 1; i >= 0; i--) {
            const c = this.customers[i];

            // 1. Entering -> Walking to Shelf
            if (c.state === 'enter') {
                const targetShelf = this.getShelfForItem(c.item);
                if (targetShelf) {
                    c.targetX = targetShelf.x;
                    c.targetY = targetShelf.y + 60;
                    c.state = 'to_shelf';
                } else {
                    c.state = 'leaving';
                    c.targetX = 750;
                    c.targetY = 60;
                }
            }

            // 2. Walking to Shelf
            if (c.state === 'to_shelf') {
                this.moveEntity(c, c.targetX, c.targetY, c.speed);
                if (Math.hypot(c.x - c.targetX, c.y - c.targetY) < 15) {
                    c.state = 'browse';
                    c.browseTimer = 1.0;
                }
            }

            // 3. Browsing & Grabbing Item
            if (c.state === 'browse') {
                c.browseTimer -= dt;
                const shelf = this.getShelfForItem(c.item);
                if (c.browseTimer <= 0) {
                    if (shelf && shelf.stock > 0) {
                        shelf.stock--;
                        c.hasItem = true;
                        this.sounds.play('pop');
                        this.particles.addText(c.x, c.y - 30, `+1 Bag`, '#E91E63');

                        if (isCheckoutUnlocked) {
                            c.state = 'to_queue';
                        } else {
                            // If no register yet, customer pays directly and leaves!
                            this.cash += 8;
                            this.updateHUD();
                            c.state = 'leaving';
                            c.targetX = 750;
                            c.targetY = 60;
                        }
                    } else {
                        // Shelf is empty, wait briefly then re-check
                        c.browseTimer = 1.2;
                    }
                }
            }

            // 4. In Checkout Queue
            if (c.state === 'to_queue' || c.state === 'in_queue') {
                // Find queue index
                const inQueueCustomers = this.customers.filter(cust => cust.state === 'in_queue' || cust.state === 'to_queue');
                const qIdx = inQueueCustomers.indexOf(c);
                c.queueIndex = qIdx;

                const spot = checkout.queueSpots[Math.min(qIdx, checkout.queueSpots.length - 1)];
                c.targetX = spot.x;
                c.targetY = spot.y;
                this.moveEntity(c, c.targetX, c.targetY, c.speed);

                if (Math.hypot(c.x - c.targetX, c.y - c.targetY) < 15) {
                    c.state = 'in_queue';
                }

                // If first in line, check if cashier or player is at counter!
                if (qIdx === 0 && Math.hypot(c.x - spot.x, c.y - spot.y) < 20) {
                    const isPlayerAtCounter = Math.hypot(this.player.x - checkout.x, this.player.y - (checkout.y + 50)) < 70;
                    const isCashierPresent = this.workers.some(w => w.type === 'cashier' && !w.sleepy);

                    if (isPlayerAtCounter || isCashierPresent) {
                        c.payTimer = (c.payTimer || 0) + dt;
                        if (c.payTimer >= 0.8) {
                            c.payTimer = 0;
                            checkout.cashOnCounter += 12; // Pay $12
                            this.sounds.play('cashier');
                            this.particles.addText(checkout.cashPosition.x, checkout.cashPosition.y - 30, `+$12`, '#4CAF50');
                            c.state = 'leaving';
                            c.targetX = 750;
                            c.targetY = 60;
                        }
                    }
                }
            }

            // 5. Leaving Store
            if (c.state === 'leaving') {
                this.moveEntity(c, c.targetX, c.targetY, c.speed);
                if (Math.hypot(c.x - c.targetX, c.y - c.targetY) < 25) {
                    this.customers.splice(i, 1);
                }
            }
        }
    }

    getShelfForItem(item) {
        if (item === 'banana') return this.stations.bananaShelf;
        if (item === 'corn') return this.stations.cornShelf;
        if (item === 'milk') return this.stations.milkShelf;
        if (item === 'egg') return this.stations.eggShelf;
        if (item === 'popcorn') return this.stations.popcornMachine;
        return null;
    }

    updateWorkers(dt) {
        for (const w of this.workers) {
            // Wakeup on bump
            if (w.sleepy) {
                if (Math.hypot(this.player.x - w.x, this.player.y - w.y) < 40) {
                    w.sleepy = false;
                    w.sleepTimer = 0;
                    this.sounds.play('chime');
                    this.particles.addText(w.x, w.y - 30, `Wake Up! 🐵`, '#FFA000');
                }
                continue;
            }

            // Random sleep chance
            w.sleepTimer += dt;
            if (w.sleepTimer > 35 && Math.random() < 0.005) {
                w.sleepy = true;
                continue;
            }

            // Stockman Logic
            if (w.type === 'stockman') {
                if (w.stack.length < w.maxStack) {
                    // Go to Banana tree or Corn plot
                    const tree = this.stations.bananaTree;
                    w.targetX = tree.x;
                    w.targetY = tree.y + 40;
                    this.moveEntity(w, w.targetX, w.targetY, w.speed);

                    if (Math.hypot(w.x - w.targetX, w.y - w.targetY) < 20 && tree.stock > 0) {
                        tree.stock--;
                        w.stack.push('banana');
                        this.sounds.play('pop');
                    }
                } else {
                    // Go to shelf to restock
                    const shelf = this.stations.bananaShelf;
                    w.targetX = shelf.x;
                    w.targetY = shelf.y + 50;
                    this.moveEntity(w, w.targetX, w.targetY, w.speed);

                    if (Math.hypot(w.x - w.targetX, w.y - w.targetY) < 20 && shelf.stock < shelf.maxStock) {
                        shelf.stock++;
                        w.stack.pop();
                        this.sounds.play('drop');
                    }
                }
            }

            // Cashier Logic
            if (w.type === 'cashier') {
                const checkout = this.stations.checkout;
                w.targetX = checkout.x;
                w.targetY = checkout.y + 40;
                this.moveEntity(w, w.targetX, w.targetY, w.speed);
            }
        }
    }

    updateBonusEvents(dt) {
        this.bonusTimer += dt;
        if (this.bonusTimer > 45 && !this.goldenPig && !this.parrot) {
            this.bonusTimer = 0;
            if (Math.random() < 0.6) {
                // Spawn Golden Pig
                this.goldenPig = {
                    x: 100,
                    y: 600,
                    targetX: this.mapWidth - 100,
                    targetY: 600,
                    speed: 3.5
                };
                this.sounds.play('win');
                this.showToast('🐷 Golden Piggy entered the Mart! Catch it for bonus coins!');
            } else {
                // Spawn Parrot
                this.parrot = {
                    x: 100,
                    y: 300,
                    targetX: this.mapWidth - 100,
                    targetY: 300,
                    speed: 4.0
                };
                this.sounds.play('win');
                this.showToast('🦜 Lucky Parrot is flying over with cash drops!');
            }
        }

        // Move Golden Pig
        if (this.goldenPig) {
            this.moveEntity(this.goldenPig, this.goldenPig.targetX, this.goldenPig.targetY, this.goldenPig.speed);
            if (Math.hypot(this.player.x - this.goldenPig.x, this.player.y - this.goldenPig.y) < 45) {
                this.cash += 30;
                this.sounds.play('coin');
                this.particles.addConfetti(this.goldenPig.x, this.goldenPig.y, 35);
                this.particles.addText(this.goldenPig.x, this.goldenPig.y - 40, '+$30 BONUS!', '#FFD700');
                this.goldenPig = null;
                this.updateHUD();
            } else if (Math.hypot(this.goldenPig.x - this.goldenPig.targetX, this.goldenPig.y - this.goldenPig.targetY) < 30) {
                this.goldenPig = null;
            }
        }

        // Move Parrot
        if (this.parrot) {
            this.moveEntity(this.parrot, this.parrot.targetX, this.parrot.targetY, this.parrot.speed);
            if (Math.random() < 0.05) {
                this.particles.addFlyingDollar(this.parrot.x, this.parrot.y, this.parrot.x + (Math.random()-0.5)*40, this.parrot.y + 40, () => {
                    this.cash += 5;
                    this.updateHUD();
                });
            }
            if (Math.hypot(this.parrot.x - this.parrot.targetX, this.parrot.y - this.parrot.targetY) < 30) {
                this.parrot = null;
            }
        }
    }

    moveEntity(entity, tx, ty, speed) {
        const dx = tx - entity.x;
        const dy = ty - entity.y;
        const dist = Math.hypot(dx, dy);
        if (dist > 4) {
            entity.x += (dx / dist) * speed;
            entity.y += (dy / dist) * speed;
        }
    }

    // ---------------------------------------------------------------------
    // RENDERING PIPELINE
    // ---------------------------------------------------------------------
    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.camera.apply(this.ctx);

        this.drawSupermarketFloor();
        this.drawUnlockPads();
        this.drawStations();
        this.drawCustomers();
        this.drawWorkers();
        this.drawBonusEntities();
        this.drawPlayer();
        this.particles.draw(this.ctx, this.assets);

        this.camera.restore(this.ctx);
    }

    drawSupermarketFloor() {
        const ctx = this.ctx;
        // Background grass
        ctx.fillStyle = '#2E7D32';
        ctx.fillRect(-100, -100, this.mapWidth + 200, this.mapHeight + 200);

        // Supermarket Mart Interior (Checkerboard light green tiles matching Poki)
        const martX = 80;
        const martY = 120;
        const martW = this.mapWidth - 160;
        const martH = this.mapHeight - 200;

        ctx.fillStyle = '#43B858';
        ctx.fillRect(martX, martY, martW, martH);

        // Rounded store border
        ctx.strokeStyle = '#277435';
        ctx.lineWidth = 10;
        ctx.strokeRect(martX, martY, martW, martH);

        // Subtle tile pattern
        const tileSize = 60;
        ctx.fillStyle = '#3CB051';
        for (let x = martX; x < martX + martW; x += tileSize * 2) {
            for (let y = martY; y < martY + martH; y += tileSize * 2) {
                ctx.fillRect(x, y, tileSize, tileSize);
                ctx.fillRect(x + tileSize, y + tileSize, tileSize, tileSize);
            }
        }

        // Entrance rug at top
        ctx.fillStyle = '#E53935';
        ctx.fillRect(700, 120, 100, 45);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 13px Fredoka One, sans-serif';
        ctx.fillText('WELCOME', 716, 148);
    }

    drawUnlockPads() {
        const ctx = this.ctx;
        for (const pad of this.unlockPads) {
            // Check prerequisites
            const ready = pad.prereq.every(pId => {
                if (this.stations[pId]) return this.stations[pId].unlocked;
                return true;
            });

            if (!ready) continue;

            const isUnlocked = pad.stationId ? this.stations[pad.stationId].unlocked : (pad.paid >= pad.cost);
            if (isUnlocked) continue;

            ctx.save();
            ctx.translate(pad.x, pad.y);

            // Glowing yellow circle pad
            ctx.fillStyle = 'rgba(255, 235, 59, 0.35)';
            ctx.beginPath();
            ctx.arc(0, 0, pad.radius, 0, Math.PI * 2);
            ctx.fill();

            // Dashed outline
            ctx.strokeStyle = '#FBC02D';
            ctx.lineWidth = 4;
            ctx.setLineDash([8, 6]);
            ctx.beginPath();
            ctx.arc(0, 0, pad.radius, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);

            // Progress fill ring
            const pct = pad.paid / pad.cost;
            if (pct > 0) {
                ctx.strokeStyle = '#4CAF50';
                ctx.lineWidth = 6;
                ctx.beginPath();
                ctx.arc(0, 0, pad.radius, -Math.PI / 2, -Math.PI / 2 + pct * Math.PI * 2);
                ctx.stroke();
            }

            // Pad Cost Badge ($XX)
            ctx.fillStyle = '#4CAF50';
            ctx.beginPath();
            ctx.roundRect(-36, -18, 72, 36, 18);
            ctx.fill();
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 16px Fredoka One, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`$${pad.cost - pad.paid}`, 0, 0);

            // Pad Title below
            ctx.font = 'bold 12px Nunito, sans-serif';
            ctx.fillStyle = '#FFFFFF';
            ctx.fillText(pad.name, 0, pad.radius + 14);

            ctx.restore();
        }
    }

    drawStations() {
        const ctx = this.ctx;
        for (const [id, st] of Object.entries(this.stations)) {
            if (!st.unlocked) continue;

            ctx.save();
            ctx.translate(st.x, st.y);

            const sprite = this.assets.get(st.sprite);
            if (sprite) {
                ctx.drawImage(sprite, -st.width / 2, -st.height / 2, st.width, st.height);
            } else {
                ctx.fillStyle = '#8D6E63';
                ctx.fillRect(-st.width / 2, -st.height / 2, st.width, st.height);
            }

            // Draw Stock / Badge above shelves
            if (st.stock !== undefined && st.maxStock !== undefined) {
                ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
                ctx.beginPath();
                ctx.roundRect(-24, -st.height / 2 - 24, 48, 20, 10);
                ctx.fill();

                ctx.fillStyle = st.stock > 0 ? '#FFEB3B' : '#FF5252';
                ctx.font = 'bold 12px Fredoka One, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(`${st.stock}/${st.maxStock}`, 0, -st.height / 2 - 10);
            }

            // Draw Cash on Counter
            if (st.type === 'checkout' && st.cashOnCounter > 0) {
                const cashImg = this.assets.get('item_cash');
                if (cashImg) {
                    ctx.drawImage(cashImg, 25, 0, 36, 36);
                }
            }

            ctx.restore();
        }
    }

    drawPlayer() {
        const ctx = this.ctx;
        ctx.save();
        ctx.translate(this.player.x, this.player.y);

        // Pick sprite based on walk cycle
        let spriteName = 'player_idle';
        if (this.player.walkFrame === 1) spriteName = 'player_walk1';
        if (this.player.walkFrame === 2) spriteName = 'player_walk2';

        const sprite = this.assets.get(spriteName);

        // Flip if facing left
        if (this.player.facing === 'left') {
            ctx.scale(-1, 1);
        }

        // Draw Monkey
        if (sprite) {
            ctx.drawImage(sprite, -38, -50, 76, 76);
        }

        // Draw Equipped Hat
        if (this.equippedHat) {
            const hatSprite = this.assets.get(`hat_${this.equippedHat}`);
            if (hatSprite) {
                ctx.drawImage(hatSprite, -24, -68, 48, 36);
            }
        }

        // Draw Carried Stack of Items (Dynamic physics bouncing stack!)
        this.drawCarriedStack(ctx, this.player.stack, this.player.tilt);

        ctx.restore();
    }

    drawCarriedStack(ctx, stack, tilt) {
        if (!stack || stack.length === 0) return;

        ctx.save();
        ctx.translate(0, -42);
        ctx.rotate(tilt);

        stack.forEach((item, idx) => {
            const yOffset = -idx * 16;
            const itemSprite = this.assets.get(`item_${item}`);
            if (itemSprite) {
                ctx.drawImage(itemSprite, -16, yOffset - 16, 32, 32);
            }
        });

        ctx.restore();
    }

    drawCustomers() {
        const ctx = this.ctx;
        for (const c of this.customers) {
            ctx.save();
            ctx.translate(c.x, c.y);

            const sprite = this.assets.get(c.sprite);
            if (sprite) {
                ctx.drawImage(sprite, -34, -45, 68, 68);
            }

            // Draw Thought Bubble (what they want to buy)
            if (!c.hasItem && c.state !== 'leaving') {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
                ctx.strokeStyle = '#BDBDBD';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(28, -35, 16, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();

                const itemImg = this.assets.get(`item_${c.item}`);
                if (itemImg) {
                    ctx.drawImage(itemImg, 18, -45, 20, 20);
                }
            }

            ctx.restore();
        }
    }

    drawWorkers() {
        const ctx = this.ctx;
        for (const w of this.workers) {
            ctx.save();
            ctx.translate(w.x, w.y);

            const sprite = this.assets.get(w.type === 'cashier' ? 'cashier_monkey' : 'worker_monkey');
            if (sprite) {
                ctx.drawImage(sprite, -34, -45, 68, 68);
            }

            // Draw Carried Stack
            this.drawCarriedStack(ctx, w.stack, 0);

            // Sleepy "Zzz" Bubble
            if (w.sleepy) {
                ctx.fillStyle = 'rgba(33, 150, 243, 0.9)';
                ctx.beginPath();
                ctx.roundRect(14, -50, 36, 22, 11);
                ctx.fill();
                ctx.fillStyle = '#FFFFFF';
                ctx.font = 'bold 12px Fredoka One, sans-serif';
                ctx.fillText('Zzz', 22, -35);
            }

            ctx.restore();
        }
    }

    drawBonusEntities() {
        const ctx = this.ctx;
        if (this.goldenPig) {
            ctx.save();
            ctx.translate(this.goldenPig.x, this.goldenPig.y);
            const sprite = this.assets.get('bonus_pig');
            if (sprite) {
                ctx.drawImage(sprite, -32, -32, 64, 64);
            }
            ctx.restore();
        }

        if (this.parrot) {
            ctx.save();
            ctx.translate(this.parrot.x, this.parrot.y);
            const sprite = this.assets.get('bonus_parrot');
            if (sprite) {
                ctx.drawImage(sprite, -32, -32, 64, 64);
            }
            ctx.restore();
        }
    }
}

// -------------------------------------------------------------------------
// INITIALIZE GAME ON DOM READY
// -------------------------------------------------------------------------
window.addEventListener('DOMContentLoaded', () => {
    window.game = new MonkeyMartGame();
});

})();

