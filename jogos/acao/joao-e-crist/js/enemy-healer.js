/**
 * ENEMY-HEALER.JS
 * Inimigo curandeiro - cura inimigos feridos próximos
 */

class HealerEnemy extends Enemy {
    constructor(x, y) {
        super(x, y, 'basic');
        
        // Sobrescrever tipo e stats
        this.type = 'healer';
        this.name = 'Healer';
        this.life = 60;
        this.maxLife = 60;
        this.speed = 1.8;
        this.damage = 5;  // Dano fraco - papel é suporte
        this.color = '#16a085';
        this.secondaryColor = '#138d75';
        this.score = 200;
        this.w = 45;
        this.h = 65;
        
        // ✅ HITBOX PADRONIZADA - Sistema unificado
        this.hitbox = {
            offsetX: Math.floor(this.w * 0.15),  // 15% de margem lateral
            offsetY: Math.floor(this.h * 0.25),  // 25% do topo (cabeça)
            width: Math.floor(this.w * 0.70),    // 70% da largura (corpo)
            height: Math.floor(this.h * 0.65)    // 65% da altura (torso+pernas)
        };
        
        console.log('✅ Healer hitbox:', `${this.hitbox.width}×${this.hitbox.height}`);
        
        // Específico do healer
        this.healAmount = 30;
        this.healRange = 200;
        this.healCooldown = 0;
        this.healCooldownMax = 180;  // 3 segundos
        this.healing = false;
        this.healTarget = null;
        this.healChannelTime = 0;
        this.healChannelDuration = 30;  // 0.5 segundos canalizando
        
        // ✅ VALIDAÇÃO: Re-calcular Y se mudou altura (depois de super e alterações)
        if (this.groundY) {
            this.y = this.groundY - this.h;
        }
    }
    
    /**
     * Update com IA de suporte
     */
    update(players, otherEnemies = []) {
        // Validação e morte
        if (!players || players.length === 0 || this.life <= 0) {
            if (this.life <= 0) {
                this.deathAnim = Math.min(this.deathAnim + 1, 30);
            }
            return;
        }
        
        // Reduzir cooldown
        if (this.healCooldown > 0) this.healCooldown--;
        
        // Procurar inimigo ferido próximo para curar
        if (this.healCooldown === 0 && !this.healing) {
            const injured = this.findInjuredAlly(otherEnemies);
            
            if (injured) {
                this.healTarget = injured;
                this.healing = true;
                this.healChannelTime = 0;
                this.aiState = 'healing';
                this.walkCycle = 0;
            } else {
                // Sem feridos, comportar-se normalmente
                this.healing = false;
                this.healTarget = null;
                super.update(players, otherEnemies);
            }
        } else if (this.healing) {
            // Canalizando cura
            this.channelHeal();
        } else {
            // Em cooldown, comportamento normal
            super.update(players, otherEnemies);
        }
        
        // ✅ SISTEMA DE GRAVIDADE PADRONIZADO (adicional para garantir)
        if (!this.vy) this.vy = 0;
        if (!this.gravity) this.gravity = 0.5;
        if (!this.groundY) this.groundY = 600;
        
        if (this.y + this.h < this.groundY) {
            this.vy += this.gravity;
            this.y += this.vy;
        } else {
            this.y = this.groundY - this.h;
            this.vy = 0;
        }
        
        // Evitar outros inimigos
        this.avoidEnemies(otherEnemies);
    }
    
    /**
     * Encontrar inimigo ferido para curar
     */
    findInjuredAlly(otherEnemies) {
        return otherEnemies.find(e => 
            e !== this &&
            e.life > 0 && 
            e.life < e.maxLife * 0.7 &&  // Menos de 70% HP
            this.distanceTo(e) < this.healRange
        );
    }
    
    /**
     * Canalizar cura
     */
    channelHeal() {
        // Verificar se alvo ainda é válido
        if (!this.healTarget || this.healTarget.life <= 0 || 
            this.distanceTo(this.healTarget) > this.healRange) {
            this.healing = false;
            this.healTarget = null;
            return;
        }
        
        this.healChannelTime++;
        
        // Completou canalização
        if (this.healChannelTime >= this.healChannelDuration) {
            this.performHeal();
        }
    }
    
    /**
     * Executar cura
     */
    performHeal() {
        if (!this.healTarget || this.healTarget.life <= 0) {
            this.healing = false;
            return;
        }
        
        // Curar
        const healedAmount = Math.min(
            this.healAmount,
            this.healTarget.maxLife - this.healTarget.life
        );
        
        this.healTarget.life = Math.min(
            this.healTarget.maxLife,
            this.healTarget.life + this.healAmount
        );
        
        // Resetar estado
        this.healCooldown = this.healCooldownMax;
        this.healing = false;
        this.healChannelTime = 0;
        
        // Efeito visual de cura
        if (window.particles) {
            // Partículas verdes subindo
            for (let i = 0; i < 20; i++) {
                window.particles.push({
                    x: this.healTarget.x + this.healTarget.w/2 + (Math.random() - 0.5) * this.healTarget.w,
                    y: this.healTarget.y + this.healTarget.h,
                    vx: (Math.random() - 0.5) * 2,
                    vy: -Math.random() * 4 - 2,
                    life: 50,
                    maxLife: 50,
                    color: '#2ecc71',
                    size: 6
                });
            }
            
            // Texto de cura
            window.particles.push({
                x: this.healTarget.x + this.healTarget.w/2,
                y: this.healTarget.y - 10,
                vx: 0,
                vy: -2,
                life: 50,
                maxLife: 50,
                color: '#2ecc71',
                text: `+${healedAmount}`,
                size: 18
            });
            
            // Pulso de cura
            for (let i = 0; i < 12; i++) {
                const angle = (Math.PI * 2 * i) / 12;
                window.particles.push({
                    x: this.healTarget.x + this.healTarget.w/2,
                    y: this.healTarget.y + this.healTarget.h/2,
                    vx: Math.cos(angle) * 6,
                    vy: Math.sin(angle) * 6,
                    life: 30,
                    maxLife: 30,
                    color: '#27ae60',
                    size: 4
                });
            }
        }
        
        // Som de cura
        if (window.soundSystem) {
            window.soundSystem.playSound('powerup');
        }
    }
    
    /**
     * Desenho com efeitos de cura
     */
    draw(ctx) {
        // Desenho base
        super.draw(ctx);
        
        // Cruz verde de healer acima da cabeça
        if (this.life > 0) {
            ctx.save();
            
            // Fundo da cruz
            ctx.fillStyle = this.healing ? '#27ae60' : '#2ecc71';
            ctx.shadowBlur = this.healing ? 15 : 8;
            ctx.shadowColor = '#2ecc71';
            
            // Cruz vertical
            ctx.fillRect(this.x + this.w/2 - 2, this.y - 12, 4, 14);
            // Cruz horizontal
            ctx.fillRect(this.x + this.w/2 - 7, this.y - 7, 14, 4);
            
            ctx.restore();
        }
        
        // Indicador de cooldown
        if (this.healCooldown > 0 && !this.healing) {
            ctx.save();
            const cooldownPercent = 1 - (this.healCooldown / this.healCooldownMax);
            
            // Círculo de progresso
            ctx.strokeStyle = 'rgba(46, 204, 113, 0.5)';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(
                this.x + this.w/2, 
                this.y - 5, 
                10, 
                -Math.PI/2, 
                -Math.PI/2 + (Math.PI * 2 * cooldownPercent)
            );
            ctx.stroke();
            
            ctx.restore();
        }
        
        // Linha para alvo de cura (quando canalizando)
        if (this.healing && this.healTarget && this.healTarget.life > 0) {
            ctx.save();
            
            // Linha pulsante
            const pulse = Math.sin(Date.now() / 100);
            const alpha = 0.5 + pulse * 0.3;
            ctx.strokeStyle = `rgba(46, 204, 113, ${alpha})`;
            ctx.lineWidth = 3 + pulse * 2;
            ctx.setLineDash([5, 5]);
            
            ctx.beginPath();
            ctx.moveTo(this.x + this.w/2, this.y + this.h/2);
            ctx.lineTo(
                this.healTarget.x + this.healTarget.w/2,
                this.healTarget.y + this.healTarget.h/2
            );
            ctx.stroke();
            
            // Partículas ao longo da linha
            const progress = this.healChannelTime / this.healChannelDuration;
            const particleX = this.x + this.w/2 + 
                (this.healTarget.x + this.healTarget.w/2 - this.x - this.w/2) * progress;
            const particleY = this.y + this.h/2 + 
                (this.healTarget.y + this.healTarget.h/2 - this.y - this.h/2) * progress;
            
            ctx.fillStyle = '#2ecc71';
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#2ecc71';
            ctx.beginPath();
            ctx.arc(particleX, particleY, 6, 0, Math.PI * 2);
            ctx.fill();
            
            // Barra de canalização
            const barWidth = 40;
            const barHeight = 4;
            const barX = this.x + this.w/2 - barWidth/2;
            const barY = this.y - 20;
            
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 2;
            ctx.strokeRect(barX, barY, barWidth, barHeight);
            
            ctx.fillStyle = '#1a1a1a';
            ctx.fillRect(barX, barY, barWidth, barHeight);
            
            ctx.fillStyle = '#2ecc71';
            ctx.fillRect(barX, barY, barWidth * progress, barHeight);
            
            ctx.restore();
        }
    }
    
    /**
     * Sobrescrever drawBody para visual de healer
     */
    drawBody(ctx) {
        // Robes verdes/azuis de curandeiro
        const gradient = ctx.createLinearGradient(this.x, this.y + 20, this.x, this.y + this.h);
        gradient.addColorStop(0, this.color);
        gradient.addColorStop(0.5, '#1abc9c');
        gradient.addColorStop(1, this.secondaryColor);
        ctx.fillStyle = gradient;
        ctx.fillRect(this.x + 8, this.y + 20, this.w - 16, this.h - 25);
        
        // Detalhes da robe (bordas douradas)
        ctx.strokeStyle = '#f1c40f';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x + 10, this.y + 22, this.w - 20, this.h - 29);
        
        // Cristal de cura no peito
        ctx.save();
        ctx.fillStyle = this.healing ? '#2ecc71' : '#27ae60';
        ctx.shadowBlur = this.healing ? 15 : 5;
        ctx.shadowColor = '#2ecc71';
        ctx.beginPath();
        ctx.arc(this.x + this.w/2, this.y + 35, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        
        // Cabeça com capuz
        ctx.fillStyle = '#148f77';
        ctx.beginPath();
        ctx.arc(this.x + this.w / 2, this.y + 12, 16, 0, Math.PI * 2);
        ctx.fill();
        
        // Capuz (parte de cima)
        ctx.fillStyle = '#117a65';
        ctx.beginPath();
        ctx.arc(this.x + this.w / 2, this.y + 12, 16, Math.PI, 0);
        ctx.fill();
        
        // Olhos brilhantes (azuis = benevolente)
        ctx.fillStyle = '#3498db';
        ctx.shadowBlur = 8;
        ctx.shadowColor = '#3498db';
        ctx.fillRect(this.x + this.w / 2 - 10, this.y + 8, 5, 5);
        ctx.fillRect(this.x + this.w / 2 + 5, this.y + 8, 5, 5);
        ctx.shadowBlur = 0;
        
        // Cajado (se visível)
        if (this.aiState === 'healing' || this.aiState === 'idle') {
            ctx.save();
            ctx.strokeStyle = '#8b4513';
            ctx.lineWidth = 4;
            
            // Haste do cajado
            ctx.beginPath();
            ctx.moveTo(this.x + this.w - 10, this.y + 15);
            ctx.lineTo(this.x + this.w - 10, this.y + this.h);
            ctx.stroke();
            
            // Cristal no topo
            ctx.fillStyle = this.healing ? '#2ecc71' : '#27ae60';
            ctx.shadowBlur = this.healing ? 20 : 10;
            ctx.shadowColor = '#2ecc71';
            ctx.beginPath();
            ctx.arc(this.x + this.w - 10, this.y + 15, 7, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.restore();
        }
    }
    
    checkHitPlayer(player) {
        if (!this.attacking || !player || player.life <= 0) {
            return false;
        }
        
        return this.x < player.x + player.w &&
               this.x + this.w > player.x &&
               this.y < player.y + player.h &&
               this.y + this.h > player.y;
    }
    
    /**
     * ✅ SISTEMA DE HITBOX PADRONIZADO
     * Retorna a caixa de colisão ajustada (corpo real sem extremidades)
     */
    getCollisionBox() {
        return {
            x: this.x + this.hitbox.offsetX,
            y: this.y + this.hitbox.offsetY,
            w: this.hitbox.width,
            h: this.hitbox.height
        };
    }
}

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.HealerEnemy = HealerEnemy;
}
