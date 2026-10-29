// =============================================================================
// Level Devil - Particle System
// Handles death explosions, jump/land dust, portal aura, and shock drops
// =============================================================================

class ParticleSystem {
    constructor() {
        this.particles = [];
    }

    reset() {
        this.particles = [];
    }

    // Death explosion: cubes exploding in 360 degrees, bouncing on ground
    createDeathExplosion(x, y, color = '#f55338') {
        const count = 20;
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 7;
            const size = 3 + Math.random() * 5;
            this.particles.push({
                type: 'chunk',
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 2.5,
                gravity: 0.28,
                bounce: 0.55,
                size: size,
                color: Math.random() > 0.3 ? color : '#ff8450',
                alpha: 1.0,
                fadeRate: 0.015 + Math.random() * 0.01,
                rot: Math.random() * Math.PI,
                vrot: (Math.random() - 0.5) * 0.3,
                alive: true
            });
        }
    }

    // Dust puff for jump or landing
    createDust(x, y, count = 5) {
        for (let i = 0; i < count; i++) {
            const angle = Math.PI + (Math.random() - 0.5) * (Math.PI * 0.8);
            const speed = 0.8 + Math.random() * 2.2;
            this.particles.push({
                type: 'dust',
                x: x + (Math.random() - 0.5) * 16,
                y: y,
                vx: (Math.random() - 0.5) * 2.5,
                vy: -Math.random() * 1.5,
                gravity: -0.02, // drifts up
                size: 2 + Math.random() * 3,
                color: '#ffffff',
                alpha: 0.55,
                fadeRate: 0.035 + Math.random() * 0.02,
                alive: true
            });
        }
    }

    // Swirling portal aura particles around the door
    createPortalParticle(x, y) {
        const offsetAngle = Math.random() * Math.PI * 2;
        const dist = 10 + Math.random() * 14;
        this.particles.push({
            type: 'portal',
            x: x + Math.cos(offsetAngle) * dist,
            y: y + Math.sin(offsetAngle) * dist,
            targetX: x,
            targetY: y,
            size: 2 + Math.random() * 2,
            color: Math.random() > 0.5 ? '#ffd32a' : '#ffffff',
            alpha: 0.8,
            fadeRate: 0.04,
            alive: true
        });
    }

    // Comedic shock sweat drop when troll trap triggers
    createShockDrop(x, y, dir = 1) {
        this.particles.push({
            type: 'sweat',
            x: x + dir * 8,
            y: y - 10,
            vx: dir * (1.5 + Math.random() * 1),
            vy: -3 - Math.random() * 1.5,
            gravity: 0.25,
            size: 4,
            color: '#70a1ff',
            alpha: 1.0,
            fadeRate: 0.03,
            alive: true
        });
    }

    update(blocks = []) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.alpha -= p.fadeRate;

            if (p.alpha <= 0) {
                this.particles.splice(i, 1);
                continue;
            }

            if (p.type === 'chunk') {
                p.vy += p.gravity;
                p.x += p.vx;
                p.y += p.vy;
                p.rot += p.vrot;

                // Simple ground bounce check
                for (let b = 0; b < blocks.length; b++) {
                    const block = blocks[b];
                    if (!block.solid) continue;
                    if (p.x >= block.x && p.x <= block.x + block.w &&
                        p.y >= block.y && p.y <= block.y + block.h) {
                        p.y = block.y;
                        p.vy = -p.vy * p.bounce;
                        p.vx *= 0.75;
                        break;
                    }
                }
            } else if (p.type === 'dust') {
                p.vy += p.gravity;
                p.x += p.vx;
                p.y += p.vy;
                p.size *= 0.96;
            } else if (p.type === 'portal') {
                p.x += (p.targetX - p.x) * 0.08;
                p.y += (p.targetY - p.y) * 0.08;
                p.size *= 0.94;
            } else if (p.type === 'sweat') {
                p.vy += p.gravity;
                p.x += p.vx;
                p.y += p.vy;
            }
        }
    }

    render(ctx) {
        for (let i = 0; i < this.particles.length; i++) {
            const p = this.particles[i];
            ctx.save();
            ctx.globalAlpha = Math.max(0, p.alpha);

            if (p.type === 'chunk') {
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rot);
                ctx.fillStyle = p.color;
                ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
            } else if (p.type === 'dust') {
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            } else if (p.type === 'portal') {
                ctx.fillStyle = p.color;
                ctx.shadowColor = p.color;
                ctx.shadowBlur = 6;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            } else if (p.type === 'sweat') {
                ctx.fillStyle = p.color;
                ctx.beginPath();
                // Tear drop
                ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI);
                ctx.lineTo(p.x, p.y - p.size);
                ctx.closePath();
                ctx.fill();
            }

            ctx.restore();
        }
    }
}

window.ParticleSystem = ParticleSystem;
