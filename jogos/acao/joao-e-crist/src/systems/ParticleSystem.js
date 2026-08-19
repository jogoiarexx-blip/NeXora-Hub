/**
 * Particle System - Sistema de partículas otimizado
 * Correções: Memory leak, performance, batch rendering
 */

import { GAME_CONFIG } from '../config/constants.js';
import { ObjectPool } from '../utils/helpers.js';

export class Particle {
    constructor() {
        this.reset();
    }
    
    reset() {
        this.x = 0;
        this.y = 0;
        this.vx = 0;
        this.vy = 0;
        this.life = 0;
        this.maxLife = 60;
        this.size = 5;
        this.color = '#ffffff';
        this.type = 'circle';
        this.gravity = true;
        this.alpha = 1;
        this.rotation = 0;
        this.rotationSpeed = 0;
    }
    
    update() {
        this.x += this.vx;
        this.y += this.vy;
        
        if (this.gravity) {
            this.vy += GAME_CONFIG.GRAVITY * 0.5;
        }
        
        this.rotation += this.rotationSpeed;
        this.life++;
        
        // Fade out nos últimos frames
        const fadeStart = this.maxLife * 0.7;
        if (this.life > fadeStart) {
            this.alpha = 1 - ((this.life - fadeStart) / (this.maxLife - fadeStart));
        }
        
        return this.life < this.maxLife;
    }
    
    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        
        if (this.type === 'circle') {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.type === 'square') {
            ctx.translate(this.x, this.y);
            ctx.rotate(this.rotation);
            ctx.fillRect(-this.size/2, -this.size/2, this.size, this.size);
        } else if (this.type === 'spark') {
            ctx.translate(this.x, this.y);
            ctx.rotate(Math.atan2(this.vy, this.vx));
            ctx.fillRect(0, -1, this.size * 2, 2);
        }
        
        ctx.restore();
    }
}

export class ParticleSystem {
    constructor() {
        // Object pool para evitar memory leak (Bug #5)
        this.pool = new ObjectPool(
            () => new Particle(),
            (p) => p.reset(),
            GAME_CONFIG.MAX_PARTICLES / 2
        );
        
        this.particles = [];
        this.textParticles = [];
    }
    
    /**
     * Cria partícula única
     */
    emit(x, y, options = {}) {
        // Limitar quantidade (Bug #5 corrigido)
        if (this.particles.length >= GAME_CONFIG.MAX_PARTICLES) {
            return null;
        }
        
        const particle = this.pool.acquire();
        
        particle.x = x;
        particle.y = y;
        particle.vx = options.vx || 0;
        particle.vy = options.vy || 0;
        particle.life = 0;
        particle.maxLife = options.maxLife || 60;
        particle.size = options.size || 5;
        particle.color = options.color || '#ffffff';
        particle.type = options.type || 'circle';
        particle.gravity = options.gravity !== undefined ? options.gravity : true;
        particle.rotation = options.rotation || 0;
        particle.rotationSpeed = options.rotationSpeed || 0;
        
        this.particles.push(particle);
        return particle;
    }
    
    /**
     * Cria explosão de partículas
     */
    explosion(x, y, count = 20, options = {}) {
        const particles = [];
        
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count;
            const speed = options.speed || 3 + Math.random() * 2;
            
            const particle = this.emit(x, y, {
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: options.size || 3 + Math.random() * 3,
                color: options.color || '#ff8800',
                type: options.type || 'circle',
                maxLife: options.maxLife || 40 + Math.random() * 20,
                gravity: options.gravity !== undefined ? options.gravity : true
            });
            
            if (particle) particles.push(particle);
        }
        
        return particles;
    }
    
    /**
     * Cria jato de partículas (para dash, etc)
     */
    jet(x, y, angle, count = 5, options = {}) {
        const particles = [];
        
        for (let i = 0; i < count; i++) {
            const spread = (Math.random() - 0.5) * 0.5;
            const actualAngle = angle + spread;
            const speed = options.speed || 2 + Math.random() * 3;
            
            const particle = this.emit(x, y, {
                vx: Math.cos(actualAngle) * speed,
                vy: Math.sin(actualAngle) * speed,
                size: options.size || 2 + Math.random() * 2,
                color: options.color || '#00ffff',
                type: options.type || 'spark',
                maxLife: options.maxLife || 20 + Math.random() * 10,
                gravity: false
            });
            
            if (particle) particles.push(particle);
        }
        
        return particles;
    }
    
    /**
     * Cria texto flutuante
     */
    createText(x, y, text, color = '#ffffff', options = {}) {
        if (this.textParticles.length >= 20) {
            this.textParticles.shift(); // Remover o mais antigo
        }
        
        this.textParticles.push({
            x,
            y,
            text,
            color,
            vy: options.vy || -2,
            life: 0,
            maxLife: options.maxLife || 90,
            size: options.size || 24,
            alpha: 1
        });
    }
    
    /**
     * Atualiza todas as partículas
     */
    update() {
        // Atualizar partículas normais
        this.particles = this.particles.filter(particle => {
            const alive = particle.update();
            if (!alive) {
                this.pool.release(particle);
            }
            return alive;
        });
        
        // Atualizar partículas de texto
        this.textParticles = this.textParticles.filter(text => {
            text.y += text.vy;
            text.life++;
            
            // Fade out
            const fadeStart = text.maxLife * 0.6;
            if (text.life > fadeStart) {
                text.alpha = 1 - ((text.life - fadeStart) / (text.maxLife - fadeStart));
            }
            
            return text.life < text.maxLife;
        });
    }
    
    /**
     * Desenha todas as partículas (batch rendering para performance)
     * Melhoria #15: Batch rendering
     */
    draw(ctx) {
        // Desenhar partículas normais
        // Agrupar por tipo para batch rendering
        const byType = new Map();
        
        this.particles.forEach(particle => {
            if (!byType.has(particle.type)) {
                byType.set(particle.type, []);
            }
            byType.get(particle.type).push(particle);
        });
        
        // Desenhar cada grupo
        byType.forEach((particles, type) => {
            particles.forEach(particle => particle.draw(ctx));
        });
        
        // Desenhar textos
        this.textParticles.forEach(text => {
            ctx.save();
            ctx.globalAlpha = text.alpha;
            ctx.fillStyle = text.color;
            ctx.font = `bold ${text.size}px 'Bebas Neue', sans-serif`;
            ctx.textAlign = 'center';
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 3;
            ctx.strokeText(text.text, text.x, text.y);
            ctx.fillText(text.text, text.x, text.y);
            ctx.restore();
        });
    }
    
    /**
     * Limpa todas as partículas
     */
    clear() {
        this.particles.forEach(p => this.pool.release(p));
        this.particles = [];
        this.textParticles = [];
    }
    
    /**
     * Obtém contagem de partículas
     */
    getCount() {
        return this.particles.length + this.textParticles.length;
    }
}
