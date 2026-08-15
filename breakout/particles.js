// particles.js - Sistema de Partículas Otimizado
class Particle {
    constructor() {
        this.reset();
        // ✅ FIX CRÍTICO: partículas do pool devem nascer INATIVAS.
        // reset() sempre marca active=true, então sem esta linha o pool
        // inteiro nasce "ocupado" e getParticle() nunca acha uma livre —
        // ou seja, NENHUM efeito de partícula (explosões, hits, etc.) aparecia.
        this.active = false;
    }

    reset(x = 0, y = 0, color = '#fff') {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 6;
        this.vy = (Math.random() - 0.5) * 6 - 2; // Bias para cima
        this.life = 1.0;
        this.decay = Math.random() * 0.02 + 0.01;
        this.size = Math.random() * 4 + 2;
        this.color = color;
        this.active = true;
    }

    update() {
        if (!this.active) return false;
        
        this.x += this.vx;
        this.y += this.vy;
        this.vy += CONFIG.PARTICLES.GRAVITY;
        this.life -= this.decay;
        
        if (this.life <= 0) {
            this.active = false;
            return false;
        }
        return true;
    }

    draw(ctx) {
        if (!this.active) return;
        
        ctx.save();
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

class ParticleSystem {
    constructor() {
        this.particles = [];
        this.pool = [];
        
        // Pre-allocate particle pool
        for (let i = 0; i < CONFIG.PARTICLES.MAX_PARTICLES; i++) {
            this.pool.push(new Particle());
        }
    }

    emit(x, y, count, color) {
        count = Math.min(count, 50); // Limit per emission
        
        for (let i = 0; i < count; i++) {
            const particle = this.getParticle();
            if (particle) {
                particle.reset(x, y, color);
                this.particles.push(particle);
            }
        }
    }

    getParticle() {
        // Reuse from pool
        const particle = this.pool.find(p => !p.active);
        return particle || null;
    }

    update() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            if (!this.particles[i].update()) {
                this.particles.splice(i, 1);
            }
        }
    }

    draw() {
        const ctx = Game.ctx;
        this.particles.forEach(p => p.draw(ctx));
    }

    clear() {
        this.particles.forEach(p => p.active = false);
        this.particles = [];
    }
}
