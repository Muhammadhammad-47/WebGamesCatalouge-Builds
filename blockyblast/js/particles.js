class ParticleSystem {
    constructor(container) {
        this.container = container;
        this.particles = [];
        this.running = false;
    }

    createBlast(x, y, color = '#FF6B6B') {
        const count = 16;
        for (let i = 0; i < count; i++) {
            const el = document.createElement('div');
            el.className = 'blast-particle';
            el.style.backgroundColor = color;
            el.style.left = `${x}px`;
            el.style.top = `${y}px`;

            const angle = Math.random() * Math.PI * 2;
            const speed = 150 + Math.random() * 250;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed - 60; // slight upward bias
            const size = 6 + Math.random() * 10;
            el.style.width = `${size}px`;
            el.style.height = `${size}px`;

            this.container.appendChild(el);
            this.particles.push({
                el,
                x,
                y,
                vx,
                vy,
                alpha: 1,
                rot: Math.random() * 360,
                vrot: (Math.random() - 0.5) * 400,
                life: 0.6 + Math.random() * 0.3
            });
        }

        if (!this.running) {
            this.running = true;
            this.lastTime = performance.now();
            requestAnimationFrame(this.update.bind(this));
        }
    }

    showPopup(text, x, y, isCombo = false) {
        const el = document.createElement('div');
        el.className = isCombo ? 'combo-popup' : 'score-popup';
        el.innerText = text;
        el.style.left = `${x}px`;
        el.style.top = `${y}px`;
        this.container.appendChild(el);

        setTimeout(() => {
            if (el.parentNode) {
                el.parentNode.removeChild(el);
            }
        }, 1200);
    }

    update(time) {
        const dt = Math.min((time - this.lastTime) / 1000, 0.1);
        this.lastTime = time;

        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.life -= dt;
            if (p.life <= 0) {
                if (p.el.parentNode) p.el.parentNode.removeChild(p.el);
                this.particles.splice(i, 1);
                continue;
            }

            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vy += 600 * dt; // gravity
            p.rot += p.vrot * dt;
            p.alpha = Math.max(0, p.life / 0.8);

            p.el.style.transform = `translate3d(${p.x}px, ${p.y}px, 0) rotate(${p.rot}deg)`;
            p.el.style.opacity = p.alpha;
        }

        if (this.particles.length > 0) {
            requestAnimationFrame(this.update.bind(this));
        } else {
            this.running = false;
        }
    }
}

