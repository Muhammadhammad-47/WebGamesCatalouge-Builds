// =============================================================================
// Level Devil - Main Game Engine
// Landscape 16:9 Canvas Platformer with authentic troll mechanics & smooth 60fps
// =============================================================================

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');

        // Virtual 16:9 resolution
        this.VIRTUAL_WIDTH = 960;
        this.VIRTUAL_HEIGHT = 540;

        // Game State
        this.currentLevelIndex = parseInt(localStorage.getItem('leveldevil_level') || '0', 10);
        if (this.currentLevelIndex >= LEVELS.length) this.currentLevelIndex = 0;

        this.unlockedLevel = parseInt(localStorage.getItem('leveldevil_unlocked') || '0', 10);
        this.deaths = parseInt(localStorage.getItem('leveldevil_deaths') || '0', 10);
        this.isPaused = false;

        // Screen Shake
        this.shakeIntensity = 0;
        this.shakeDecay = 0.88;

        // Troll Banner Popup
        this.banner = "";
        this.bannerTimer = 0;

        // Level Transition
        this.transitioning = false;
        this.transitionScale = 1.0;

        // Input
        this.input = {
            left: false,
            right: false,
            jump: false,
            jumpJustPressed: false,
            keys: {},
            keysJustPressed: {}
        };

        // Entities
        this.player = new Player(80, 360);
        this.particles = new ParticleSystem();

        this.initInput();
        this.initResize();
        this.loadLevel(this.currentLevelIndex);

        // Start Loop
        this.lastTime = performance.now();
        requestAnimationFrame((t) => this.loop(t));
    }

    initResize() {
        const resize = () => {
            const container = document.getElementById('canvasContainer');
            if (!container) return;

            const winW = window.innerWidth;
            const winH = window.innerHeight;

            // Maintain 16:9 Landscape Aspect Ratio
            const targetRatio = this.VIRTUAL_WIDTH / this.VIRTUAL_HEIGHT;
            let renderW = winW;
            let renderH = winW / targetRatio;

            if (renderH > winH) {
                renderH = winH;
                renderW = winH * targetRatio;
            }

            container.style.width = `${renderW}px`;
            container.style.height = `${renderH}px`;

            // Support crisp high-DPI screens
            const dpr = window.devicePixelRatio || 1;
            this.canvas.width = this.VIRTUAL_WIDTH * dpr;
            this.canvas.height = this.VIRTUAL_HEIGHT * dpr;
            this.ctx.scale(dpr, dpr);
        };

        window.addEventListener('resize', resize);
        window.addEventListener('orientationchange', resize);
        resize();
    }

    initInput() {
        // Keyboard Listeners
        window.addEventListener('keydown', (e) => {
            if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
                e.preventDefault();
            }

            if (!this.input.keys[e.code]) {
                this.input.keysJustPressed[e.code] = true;
            }
            this.input.keys[e.code] = true;

            // Restart shortcut: R
            if (e.code === 'KeyR') {
                this.restartLevel();
            }
            // Pause shortcut: Esc or P
            if (e.code === 'Escape' || e.code === 'KeyP') {
                this.togglePause();
            }

            if (window.soundManager) {
                window.soundManager.ensureContext();
            }
        });

        window.addEventListener('keyup', (e) => {
            this.input.keys[e.code] = false;
        });

        // Touch Controls
        const btnLeft = document.getElementById('touchLeft');
        const btnRight = document.getElementById('touchRight');
        const btnJump = document.getElementById('touchJump');

        const bindTouch = (el, prop, isJump = false) => {
            if (!el) return;
            const start = (e) => {
                e.preventDefault();
                this.input[prop] = true;
                if (isJump) this.input.jumpJustPressed = true;
                if (window.soundManager) window.soundManager.ensureContext();
            };
            const end = (e) => {
                e.preventDefault();
                this.input[prop] = false;
            };

            el.addEventListener('touchstart', start, { passive: false });
            el.addEventListener('touchend', end, { passive: false });
            el.addEventListener('mousedown', start);
            el.addEventListener('mouseup', end);
            el.addEventListener('mouseleave', end);
        };

        bindTouch(btnLeft, 'left');
        bindTouch(btnRight, 'right');
        bindTouch(btnJump, 'jump', true);

        // UI Buttons
        document.getElementById('btnPause')?.addEventListener('click', () => this.togglePause());
        document.getElementById('btnMute')?.addEventListener('click', () => this.toggleMute());
        document.getElementById('btnFullscreen')?.addEventListener('click', () => this.toggleFullscreen());
        document.getElementById('btnRestart')?.addEventListener('click', () => this.restartLevel());
        document.getElementById('btnResume')?.addEventListener('click', () => this.togglePause());
        document.getElementById('btnLevelSelect')?.addEventListener('click', () => this.showLevelSelect());
        document.getElementById('btnCloseLevels')?.addEventListener('click', () => this.hideLevelSelect());
        document.getElementById('btnNextLevel')?.addEventListener('click', () => this.nextLevel());
    }

    loadLevel(index) {
        if (index < 0) index = 0;
        if (index >= LEVELS.length) index = 0;

        this.currentLevelIndex = index;
        localStorage.setItem('leveldevil_level', this.currentLevelIndex);

        // Deep copy level data so mutations don't alter base definitions
        const base = LEVELS[this.currentLevelIndex];
        this.level = JSON.parse(JSON.stringify(base));

        // Reconnect functions
        this.level.trolls = base.trolls;

        // Reset player & particles
        this.player.reset(this.level.playerStart.x, this.level.playerStart.y);
        this.particles.reset();

        this.banner = "";
        this.bannerTimer = 0;
        this.transitioning = false;
        this.transitionScale = 1.0;

        this.updateUI();
    }

    updateUI() {
        const levelNumEl = document.getElementById('uiLevelNumber');
        const levelTitleEl = document.getElementById('uiLevelTitle');
        const deathsEl = document.getElementById('uiDeaths');

        if (levelNumEl) levelNumEl.innerText = `LEVEL ${this.currentLevelIndex + 1}`;
        if (levelTitleEl) levelTitleEl.innerText = this.level.title;
        if (deathsEl) deathsEl.innerText = `DEATHS: ${this.deaths}`;

        // Unlock status
        if (this.currentLevelIndex > this.unlockedLevel) {
            this.unlockedLevel = this.currentLevelIndex;
            localStorage.setItem('leveldevil_unlocked', this.unlockedLevel);
        }
    }

    restartLevel() {
        this.loadLevel(this.currentLevelIndex);
    }

    killPlayer() {
        if (this.player.dead || this.player.won) return;

        this.player.dead = true;
        this.deaths++;
        localStorage.setItem('leveldevil_deaths', this.deaths);
        this.updateUI();

        this.shakeIntensity = 18;
        this.particles.createDeathExplosion(this.player.x + 16, this.player.y + 16);

        if (window.soundManager) {
            window.soundManager.playDeath();
        }

        // Instant snappy respawn after 0.28s
        setTimeout(() => {
            this.restartLevel();
        }, 280);
    }

    winLevel() {
        if (this.player.won || this.player.dead) return;

        this.player.won = true;
        this.transitioning = true;

        if (window.soundManager) {
            window.soundManager.playWin();
        }

        // Check if game completed
        if (this.currentLevelIndex >= LEVELS.length - 1) {
            setTimeout(() => {
                this.showGameComplete();
            }, 500);
            return;
        }

        // Unlock next level
        if (this.currentLevelIndex + 1 > this.unlockedLevel) {
            this.unlockedLevel = this.currentLevelIndex + 1;
            localStorage.setItem('leveldevil_unlocked', this.unlockedLevel);
        }

        setTimeout(() => {
            this.nextLevel();
        }, 450);
    }

    nextLevel() {
        document.getElementById('modalVictory')?.classList.remove('active');
        if (this.currentLevelIndex + 1 < LEVELS.length) {
            this.loadLevel(this.currentLevelIndex + 1);
        } else {
            this.loadLevel(0);
        }
    }

    togglePause() {
        this.isPaused = !this.isPaused;
        const modal = document.getElementById('modalPause');
        if (modal) {
            if (this.isPaused) modal.classList.add('active');
            else modal.classList.remove('active');
        }
    }

    toggleMute() {
        if (window.soundManager) {
            const isMuted = window.soundManager.toggleMute();
            const btn = document.getElementById('btnMute');
            if (btn) btn.innerText = isMuted ? '🔇' : '🔊';
        }
    }

    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => {});
        } else {
            document.exitFullscreen().catch(() => {});
        }
    }

    showLevelSelect() {
        const modal = document.getElementById('modalLevelSelect');
        const grid = document.getElementById('levelGrid');
        if (!modal || !grid) return;

        grid.innerHTML = '';
        LEVELS.forEach((lvl, idx) => {
            const item = document.createElement('div');
            item.className = 'level-item';
            const isUnlocked = idx <= this.unlockedLevel;

            if (isUnlocked) {
                item.classList.add('unlocked');
                if (idx === this.currentLevelIndex) item.classList.add('current');
                item.innerHTML = `<span class="lvl-num">${idx + 1}</span><span class="lvl-title">${lvl.title}</span>`;
                item.onclick = () => {
                    this.loadLevel(idx);
                    this.hideLevelSelect();
                    if (this.isPaused) this.togglePause();
                };
            } else {
                item.classList.add('locked');
                item.innerHTML = `<span class="lvl-num">🔒</span><span class="lvl-title">${idx + 1}</span>`;
            }
            grid.appendChild(item);
        });

        modal.classList.add('active');
    }

    hideLevelSelect() {
        document.getElementById('modalLevelSelect')?.classList.remove('active');
    }

    showGameComplete() {
        const modal = document.getElementById('modalVictory');
        const text = document.getElementById('victoryText');
        if (text) {
            text.innerHTML = `You conquered all 15 devilish levels!<br><br>Total Deaths: <strong>${this.deaths}</strong><br>Devil Rating: ${this.deaths < 15 ? '🔥 MASTER OF TROLLS' : '😈 WELL DONE!'}`;
        }
        if (modal) modal.classList.add('active');
    }

    // =========================================================================
    // MAIN LOOP
    // =========================================================================
    loop(timestamp) {
        const dt = Math.min((timestamp - this.lastTime) / 1000, 0.1);
        this.lastTime = timestamp;

        if (!this.isPaused) {
            this.update();
        }
        this.render();

        // Clear single-frame inputs
        this.input.jumpJustPressed = false;
        this.input.keysJustPressed = {};

        requestAnimationFrame((t) => this.loop(t));
    }

    update() {
        // Update Screen Shake
        if (this.shakeIntensity > 0) {
            this.shakeIntensity *= this.shakeDecay;
            if (this.shakeIntensity < 0.1) this.shakeIntensity = 0;
        }

        // Win transition animation (player shrinks into door)
        if (this.transitioning) {
            this.transitionScale = Math.max(0, this.transitionScale - 0.08);
            this.player.scaleX = this.transitionScale;
            this.player.scaleY = this.transitionScale;
            this.player.x += (this.level.door.x + 5 - this.player.x) * 0.2;
            this.player.y += (this.level.door.y + 15 - this.player.y) * 0.2;
        }

        // Update Player & Particles
        this.player.update(this.input, this.level.blocks, this.particles);
        this.particles.update(this.level.blocks);

        // Ambient Door Aura Particles
        if (Math.random() < 0.3) {
            this.particles.createPortalParticle(this.level.door.x + this.level.door.w / 2, this.level.door.y + this.level.door.h / 2);
        }

        // Execute Level Trolls
        if (this.level.trolls) {
            this.level.trolls.forEach(t => {
                if (t.triggerX && !t.triggered && this.player.x > t.triggerX) {
                    t.triggered = true;
                    if (t.onTrigger) t.onTrigger(this.level, t);
                }
                if (t.onUpdate) {
                    t.onUpdate(this.level, t);
                }
            });
        }

        // Troll Banner Countdown
        if (this.level.banner) {
            this.banner = this.level.banner;
            this.bannerTimer = 90;
            this.level.banner = null;
        }
        if (this.bannerTimer > 0) {
            this.bannerTimer--;
            if (this.bannerTimer <= 0) this.banner = "";
        }

        // Check Spike Collisions
        if (!this.player.dead && !this.player.won) {
            for (let i = 0; i < this.level.spikes.length; i++) {
                const spk = this.level.spikes[i];
                if (this.checkCollision(this.player.x + 4, this.player.y + 4, this.player.w - 8, this.player.h - 8,
                                        spk.x, spk.y, spk.w, spk.h)) {
                    this.killPlayer();
                    break;
                }
            }

            // Pit Fall Check
            if (this.player.y > this.VIRTUAL_HEIGHT + 60 || this.player.y < -120) {
                this.killPlayer();
            }

            // Exit Door Collision Check
            const d = this.level.door;
            if (this.checkCollision(this.player.x, this.player.y, this.player.w, this.player.h,
                                    d.x + 8, d.y + 10, d.w - 16, d.h - 10)) {
                this.winLevel();
            }
        }
    }

    checkCollision(x1, y1, w1, h1, x2, y2, w2, h2) {
        return x1 < x2 + w2 && x1 + w1 > x2 && y1 < y2 + h2 && y1 + h1 > y2;
    }

    // =========================================================================
    // RENDERING
    // =========================================================================
    render() {
        const ctx = this.ctx;

        ctx.save();
        // Screen Shake offset
        if (this.shakeIntensity > 0) {
            const rx = (Math.random() - 0.5) * this.shakeIntensity;
            const ry = (Math.random() - 0.5) * this.shakeIntensity;
            ctx.translate(rx, ry);
        }

        // 1. Background: Deep rich crimson/wine gradient
        const bgGrad = ctx.createLinearGradient(0, 0, 0, this.VIRTUAL_HEIGHT);
        bgGrad.addColorStop(0, '#360602');
        bgGrad.addColorStop(0.5, '#560e05');
        bgGrad.addColorStop(1, '#230301');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, this.VIRTUAL_WIDTH, this.VIRTUAL_HEIGHT);

        // 2. Iconic Devil Horns Watermark (Center Background)
        this.renderHornsWatermark(ctx);

        // 3. Blocks / Platforms
        this.renderBlocks(ctx);

        // 4. Gravity Switch (if present in level)
        if (this.level.switches) {
            this.level.switches.forEach(sw => {
                ctx.fillStyle = sw.pressed ? '#10ac84' : sw.color;
                ctx.fillRect(sw.x, sw.y, sw.w, sw.h);
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(sw.x + 4, sw.y + 2, sw.w - 8, 2);
            });
        }

        // 5. Spikes
        this.renderSpikes(ctx);

        // 6. Decoy Doors (Level 14)
        if (this.level.decoyDoors) {
            this.level.decoyDoors.forEach(dd => {
                if (!dd.popped) this.renderDoor(ctx, dd.x, dd.y, dd.w, dd.h, true);
            });
        }

        // 7. Exit Door (Real)
        this.renderDoor(ctx, this.level.door.x, this.level.door.y, this.level.door.w, this.level.door.h);

        // 8. Particles
        this.particles.render(ctx);

        // 9. Player
        this.player.render(ctx);

        // 10. Troll Banner Text Popup
        if (this.banner) {
            ctx.save();
            ctx.font = 'bold 36px "Fredoka", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#ffeaa7';
            ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
            ctx.shadowBlur = 10;
            ctx.fillText(this.banner, this.VIRTUAL_WIDTH / 2, 180);
            ctx.restore();
        }

        // 11. Subtle CIEL WEBGAMES Branding
        ctx.save();
        ctx.font = 'bold 13px -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
        ctx.fillText('CIEL WEBGAMES', this.VIRTUAL_WIDTH / 2, this.VIRTUAL_HEIGHT - 12);
        ctx.restore();

        ctx.restore();
    }

    renderHornsWatermark(ctx) {
        ctx.save();
        ctx.fillStyle = 'rgba(120, 20, 8, 0.28)';
        const cx = this.VIRTUAL_WIDTH / 2;
        const cy = this.VIRTUAL_HEIGHT / 2 - 20;

        // Left Horn
        ctx.beginPath();
        ctx.moveTo(cx - 140, cy);
        ctx.quadraticCurveTo(cx - 200, cy - 100, cx - 180, cy - 180);
        ctx.quadraticCurveTo(cx - 100, cy - 130, cx - 70, cy - 40);
        ctx.closePath();
        ctx.fill();

        // Right Horn
        ctx.beginPath();
        ctx.moveTo(cx + 140, cy);
        ctx.quadraticCurveTo(cx + 200, cy - 100, cx + 180, cy - 180);
        ctx.quadraticCurveTo(cx + 100, cy - 130, cx + 70, cy - 40);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
    }

    renderBlocks(ctx) {
        for (let i = 0; i < this.level.blocks.length; i++) {
            const b = this.level.blocks[i];
            if (!b.solid && (!b.alpha || b.alpha <= 0)) continue;

            ctx.save();
            if (b.alpha !== undefined) ctx.globalAlpha = b.alpha;

            // Main block body
            ctx.fillStyle = b.color || '#1c100c';
            ctx.fillRect(b.x, b.y, b.w, b.h);

            // Beveled top highlight (Level Devil retro look)
            ctx.fillStyle = '#3a2016';
            ctx.fillRect(b.x, b.y, b.w, 4);

            // Beveled left highlight
            ctx.fillStyle = '#2a160f';
            ctx.fillRect(b.x, b.y, 3, b.h);

            // Subtle dark shadow underneath
            ctx.fillStyle = '#0f0705';
            ctx.fillRect(b.x, b.y + b.h - 3, b.w, 3);

            ctx.restore();
        }
    }

    renderSpikes(ctx) {
        for (let i = 0; i < this.level.spikes.length; i++) {
            const s = this.level.spikes[i];
            ctx.save();

            const spikeCount = Math.max(1, Math.floor(s.w / 20));
            const spikeW = s.w / spikeCount;

            ctx.fillStyle = '#1c0c08';

            for (let j = 0; j < spikeCount; j++) {
                const sx = s.x + j * spikeW;
                ctx.beginPath();
                if (s.dir === 'up') {
                    ctx.moveTo(sx, s.y + s.h);
                    ctx.lineTo(sx + spikeW / 2, s.y);
                    ctx.lineTo(sx + spikeW, s.y + s.h);
                } else if (s.dir === 'down') {
                    ctx.moveTo(sx, s.y);
                    ctx.lineTo(sx + spikeW / 2, s.y + s.h);
                    ctx.lineTo(sx + spikeW, s.y);
                } else if (s.dir === 'right') {
                    ctx.moveTo(s.x, s.y + j * (s.h / spikeCount));
                    ctx.lineTo(s.x + s.w, s.y + (j + 0.5) * (s.h / spikeCount));
                    ctx.lineTo(s.x, s.y + (j + 1) * (s.h / spikeCount));
                }
                ctx.closePath();
                ctx.fill();

                // Razor sharp red edge highlight
                ctx.strokeStyle = '#c0392b';
                ctx.lineWidth = 1.5;
                ctx.stroke();
            }

            ctx.restore();
        }
    }

    renderDoor(ctx, x, y, w, h, isDecoy = false) {
        ctx.save();

        // White Door Outer Frame with arched top
        ctx.fillStyle = '#ffffff';
        this.player.roundRect(ctx, x, y, w, h, 6);
        ctx.fill();

        // Inner glowing arch
        ctx.fillStyle = isDecoy ? '#3a0802' : '#140402';
        this.player.roundRect(ctx, x + 5, y + 5, w - 10, h - 5, 4);
        ctx.fill();

        // Golden glowing star / emblem in center
        ctx.fillStyle = isDecoy ? '#e74c3c' : '#ffd32a';
        ctx.shadowColor = isDecoy ? '#c0392b' : '#ffd32a';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(x + w / 2, y + h / 2, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

// Start Game on window load
window.addEventListener('DOMContentLoaded', () => {
    window.game = new Game();
});
