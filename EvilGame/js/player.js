// =============================================================================
// Level Devil - Player Character (The Little Devil)
// Complete with physics, expressive eyes, horns, squash & stretch, and shock face
// =============================================================================

class Player {
    constructor(x, y) {
        this.startX = x;
        this.startY = y;
        this.x = x;
        this.y = y;
        this.w = 32;
        this.h = 32;

        this.vx = 0;
        this.vy = 0;
        this.speed = 5.2;
        this.accel = 0.85;
        this.friction = 0.72;
        this.jumpForce = -11.5;
        this.gravity = 0.62;
        this.maxFallSpeed = 13;

        this.isGrounded = false;
        this.wasGrounded = false;
        this.coyoteTimer = 0; // frames
        this.jumpBuffer = 0;  // frames
        this.facing = 1;      // 1: right, -1: left

        // Visual squash & stretch
        this.scaleX = 1;
        this.scaleY = 1;

        // Troll & emotion state
        this.shockTimer = 0;
        this.blinkTimer = 180 + Math.random() * 120;
        this.isBlinking = false;
        this.controlsInverted = false;
        this.gravityInverted = false;
        this.dead = false;
        this.won = false;
    }

    reset(x = this.startX, y = this.startY) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.isGrounded = false;
        this.wasGrounded = false;
        this.coyoteTimer = 0;
        this.jumpBuffer = 0;
        this.facing = 1;
        this.scaleX = 1;
        this.scaleY = 1;
        this.shockTimer = 0;
        this.controlsInverted = false;
        this.gravityInverted = false;
        this.dead = false;
        this.won = false;
    }

    triggerShock(duration = 60) {
        this.shockTimer = duration;
        if (window.soundManager) {
            window.soundManager.playTroll();
        }
    }

    update(input, blocks = [], particles) {
        if (this.dead || this.won) return;

        // Shock timer countdown
        if (this.shockTimer > 0) {
            this.shockTimer--;
            if (this.shockTimer % 15 === 0 && particles) {
                particles.createShockDrop(this.x + this.w / 2, this.y, this.facing);
            }
        }

        // Blinking logic
        this.blinkTimer--;
        if (this.blinkTimer <= 0) {
            this.isBlinking = !this.isBlinking;
            this.blinkTimer = this.isBlinking ? 8 : 160 + Math.random() * 140;
        }

        // Horizontal Movement Input (handle inverted controls troll)
        let moveDir = 0;
        let leftPressed = input.left || input.keys['ArrowLeft'] || input.keys['KeyA'];
        let rightPressed = input.right || input.keys['ArrowRight'] || input.keys['KeyD'];

        if (this.controlsInverted) {
            const temp = leftPressed;
            leftPressed = rightPressed;
            rightPressed = temp;
        }

        if (leftPressed) moveDir -= 1;
        if (rightPressed) moveDir += 1;

        if (moveDir !== 0) {
            this.vx += moveDir * this.accel;
            if (Math.abs(this.vx) > this.speed) {
                this.vx = Math.sign(this.vx) * this.speed;
            }
            this.facing = moveDir;
        } else {
            this.vx *= this.friction;
            if (Math.abs(this.vx) < 0.1) this.vx = 0;
        }

        // Jump Input & Buffering
        const jumpPressed = input.jumpJustPressed || input.keysJustPressed['ArrowUp'] || input.keysJustPressed['KeyW'] || input.keysJustPressed['Space'];
        const jumpHeld = input.jump || input.keys['ArrowUp'] || input.keys['KeyW'] || input.keys['Space'];

        if (jumpPressed) {
            this.jumpBuffer = 7; // Remember jump intent for 7 frames
        } else if (this.jumpBuffer > 0) {
            this.jumpBuffer--;
        }

        // Coyote Time
        if (this.isGrounded) {
            this.coyoteTimer = 7;
        } else if (this.coyoteTimer > 0) {
            this.coyoteTimer--;
        }

        // Execute Jump
        const currentGrav = this.gravityInverted ? -this.gravity : this.gravity;
        const currentJump = this.gravityInverted ? -this.jumpForce : this.jumpForce;

        if (this.jumpBuffer > 0 && this.coyoteTimer > 0) {
            this.vy = currentJump;
            this.jumpBuffer = 0;
            this.coyoteTimer = 0;
            this.isGrounded = false;

            // Jump stretch
            this.scaleX = 0.82;
            this.scaleY = 1.25;

            if (particles) {
                particles.createDust(this.x + this.w / 2, this.gravityInverted ? this.y : this.y + this.h, 4);
            }
            if (window.soundManager) {
                window.soundManager.playJump();
            }
        }

        // Variable Jump Cut (release jump early to fall sooner)
        if (!jumpHeld) {
            if (!this.gravityInverted && this.vy < -3.5) {
                this.vy *= 0.55;
            } else if (this.gravityInverted && this.vy > 3.5) {
                this.vy *= 0.55;
            }
        }

        // Gravity
        this.vy += currentGrav;
        if (!this.gravityInverted) {
            if (this.vy > this.maxFallSpeed) this.vy = this.maxFallSpeed;
        } else {
            if (this.vy < -this.maxFallSpeed) this.vy = -this.maxFallSpeed;
        }

        // Perform collisions separately along X and Y axes
        this.moveX(blocks);
        this.moveY(blocks, particles);

        // Recover squash & stretch towards 1.0 smoothly
        this.scaleX += (1.0 - this.scaleX) * 0.18;
        this.scaleY += (1.0 - this.scaleY) * 0.18;
    }

    moveX(blocks) {
        this.x += this.vx;
        for (let i = 0; i < blocks.length; i++) {
            const b = blocks[i];
            if (!b.solid) continue;

            if (this.checkCollision(this.x, this.y, this.w, this.h, b.x, b.y, b.w, b.h)) {
                if (this.vx > 0) {
                    this.x = b.x - this.w;
                } else if (this.vx < 0) {
                    this.x = b.x + b.w;
                }
                this.vx = 0;
            }
        }
    }

    moveY(blocks, particles) {
        this.wasGrounded = this.isGrounded;
        this.y += this.vy;
        this.isGrounded = false;

        for (let i = 0; i < blocks.length; i++) {
            const b = blocks[i];
            if (!b.solid) continue;

            if (this.checkCollision(this.x, this.y, this.w, this.h, b.x, b.y, b.w, b.h)) {
                if (this.vy > 0 && !this.gravityInverted) {
                    // Landed on floor
                    this.y = b.y - this.h;
                    this.isGrounded = true;

                    // Landing squash & sound
                    if (!this.wasGrounded && this.vy > 3.0) {
                        this.scaleX = 1.28;
                        this.scaleY = 0.74;
                        if (particles) {
                            particles.createDust(this.x + this.w / 2, this.y + this.h, 6);
                        }
                        if (window.soundManager) {
                            window.soundManager.playLand();
                        }
                    }
                } else if (this.vy < 0 && !this.gravityInverted) {
                    // Hit ceiling
                    this.y = b.y + b.h;
                } else if (this.vy < 0 && this.gravityInverted) {
                    // Landed on ceiling (inverted gravity)
                    this.y = b.y + b.h;
                    this.isGrounded = true;
                    if (!this.wasGrounded && Math.abs(this.vy) > 3.0) {
                        this.scaleX = 1.28;
                        this.scaleY = 0.74;
                        if (particles) {
                            particles.createDust(this.x + this.w / 2, this.y, 6);
                        }
                        if (window.soundManager) {
                            window.soundManager.playLand();
                        }
                    }
                } else if (this.vy > 0 && this.gravityInverted) {
                    // Hit floor while falling up
                    this.y = b.y - this.h;
                }
                this.vy = 0;
            }
        }
    }

    checkCollision(x1, y1, w1, h1, x2, y2, w2, h2) {
        return x1 < x2 + w2 && x1 + w1 > x2 && y1 < y2 + h2 && y1 + h1 > y2;
    }

    render(ctx) {
        if (this.dead) return;

        ctx.save();
        const cx = this.x + this.w / 2;
        const cy = this.y + this.h / 2;

        ctx.translate(cx, cy);
        ctx.scale(this.scaleX, this.scaleY);
        if (this.gravityInverted) {
            ctx.scale(1, -1);
        }

        const halfW = this.w / 2;
        const halfH = this.h / 2;

        // 1. Devil Horns on head
        ctx.fillStyle = '#eb3b1e';
        // Left horn
        ctx.beginPath();
        ctx.moveTo(-halfW + 4, -halfH + 2);
        ctx.lineTo(-halfW + 1, -halfH - 8);
        ctx.lineTo(-halfW + 8, -halfH + 1);
        ctx.closePath();
        ctx.fill();

        // Right horn
        ctx.beginPath();
        ctx.moveTo(halfW - 8, -halfH + 1);
        ctx.lineTo(halfW - 1, -halfH - 8);
        ctx.lineTo(halfW - 4, -halfH + 2);
        ctx.closePath();
        ctx.fill();

        // 2. Main Devil Body: Vibrant orange-red rounded square
        ctx.fillStyle = '#f55338';
        this.roundRect(ctx, -halfW, -halfH, this.w, this.h, 5);
        ctx.fill();

        // Subtle top highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
        this.roundRect(ctx, -halfW + 3, -halfH + 2, this.w - 6, 4, 2);
        ctx.fill();

        // 3. Expressive Eyes
        if (this.isBlinking && this.shockTimer <= 0) {
            // Blink: simple dark slit
            ctx.strokeStyle = '#2d140e';
            ctx.lineWidth = 2;
            const eyeY = -halfH + 13;
            ctx.beginPath();
            ctx.moveTo(-7, eyeY);
            ctx.lineTo(-1, eyeY);
            ctx.moveTo(3, eyeY);
            ctx.lineTo(9, eyeY);
            ctx.stroke();
        } else if (this.shockTimer > 0) {
            // Shock Face: Huge wide white eyes + tiny pupils + open mouth 'O'
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.ellipse(-5, -halfH + 13, 5.5, 6.5, 0, 0, Math.PI * 2);
            ctx.ellipse(6, -halfH + 13, 5.5, 6.5, 0, 0, Math.PI * 2);
            ctx.fill();

            // Tiny dilated pupils
            ctx.fillStyle = '#0f0504';
            ctx.beginPath();
            ctx.arc(-5, -halfH + 13, 1.8, 0, Math.PI * 2);
            ctx.arc(6, -halfH + 13, 1.8, 0, Math.PI * 2);
            ctx.fill();

            // Shocked 'O' mouth
            ctx.fillStyle = '#2d140e';
            ctx.beginPath();
            ctx.ellipse(0.5, -halfH + 22, 3, 4, 0, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // Normal Cute Eyes
            const eyeOffsetX = this.facing * 2.5;
            const eyeOffsetY = Math.abs(this.vy) > 2 ? Math.sign(this.vy) * 1.5 : 0;

            // White sclera
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.ellipse(-5 + eyeOffsetX, -halfH + 13 + eyeOffsetY, 4, 5, 0, 0, Math.PI * 2);
            ctx.ellipse(6 + eyeOffsetX, -halfH + 13 + eyeOffsetY, 4, 5, 0, 0, Math.PI * 2);
            ctx.fill();

            // Black pupils looking in travel direction
            const pupilX = this.facing * 1.6;
            ctx.fillStyle = '#1c0c08';
            ctx.beginPath();
            ctx.arc(-5 + eyeOffsetX + pupilX, -halfH + 13 + eyeOffsetY, 2.2, 0, Math.PI * 2);
            ctx.arc(6 + eyeOffsetX + pupilX, -halfH + 13 + eyeOffsetY, 2.2, 0, Math.PI * 2);
            ctx.fill();

            // Pupil twinkle highlight
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(-6 + eyeOffsetX + pupilX, -halfH + 11.5 + eyeOffsetY, 1.0, 0, Math.PI * 2);
            ctx.arc(5 + eyeOffsetX + pupilX, -halfH + 11.5 + eyeOffsetY, 1.0, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }

    roundRect(ctx, x, y, width, height, radius) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
    }
}

window.Player = Player;
