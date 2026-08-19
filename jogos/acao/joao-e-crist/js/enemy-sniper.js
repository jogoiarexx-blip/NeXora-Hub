/**
 * ENEMY-SNIPER.JS
 * Inimigo atirador à distância - mantém distância e atira projéteis
 */

class SniperEnemy extends Enemy {
    constructor(x, y) {
        super(x, y, 'basic');
        
        // Sobrescrever tipo e stats
        this.type = 'sniper';
        this.name = 'Sniper';
        this.life = 40;
        this.maxLife = 40;
        this.speed = 2.5;
        this.damage = 15;
        this.color = '#27ae60';
        this.secondaryColor = '#229954';
        this.score = 180;
        this.w = 45;
        this.h = 65;
        
        // ✅ HITBOX PADRONIZADA - Sistema unificado
        this.hitbox = {
            offsetX: Math.floor(this.w * 0.15),  // 15% de margem lateral
            offsetY: Math.floor(this.h * 0.25),  // 25% do topo (cabeça)
            width: Math.floor(this.w * 0.70),    // 70% da largura (corpo)
            height: Math.floor(this.h * 0.65)    // 65% da altura (torso+pernas)
        };
        
        console.log('✅ Sniper hitbox:', `${this.hitbox.width}×${this.hitbox.height}`);
        
        // Específico do sniper
        this.optimalRange = 400;  // Distância ideal para atirar
        this.minRange = 250;      // Distância mínima (recua se player chegar perto)
        this.maxRange = 600;      // Distância máxima (aproxima se muito longe)
        this.aimTime = 0;         // Tempo mirando
        this.aimDuration = 45;    // ~0.75 segundos mirando antes de atirar
        this.laserSight = null;   // Mira laser visual
        this.shootCooldown = 90;  // 1.5 segundos entre tiros
        
        // ✅ VALIDAÇÃO: Re-calcular Y se mudou altura (depois de super e alterações)
        if (this.groundY) {
            this.y = this.groundY - this.h;
        }
    }
    
    /**
     * Update com IA de manutenção de distância
     */
    update(players, otherEnemies = []) {
        // Validação
        if (!players || players.length === 0 || this.life <= 0) {
            if (this.life <= 0) {
                this.deathAnim = Math.min(this.deathAnim + 1, 30);
            }
            return;
        }
        
        // Encontrar jogador vivo mais próximo
        const alivePlayers = players.filter(p => p.life > 0);
        if (alivePlayers.length === 0) return;
        
        const nearestPlayer = this.getNearestPlayer(alivePlayers);
        const distance = this.distanceTo(nearestPlayer);
        
        // Atualizar direção
        this.facingRight = nearestPlayer.x > this.x;
        
        // Reduzir cooldowns
        if (this.attackCooldown > 0) this.attackCooldown--;
        
        // Comportamento baseado em distância
        if (distance < this.minRange) {
            // Muito perto! Recuar rapidamente
            this.retreat(nearestPlayer);
        } else if (distance > this.maxRange) {
            // Muito longe, aproximar
            this.approach(nearestPlayer);
        } else {
            // Distância ideal, mirar e atirar
            if (this.attackCooldown === 0) {
                this.aimAndShoot(nearestPlayer);
            } else {
                // Apenas rastrear o alvo
                this.aiState = 'tracking';
                this.walkCycle = 0;
            }
        }
        
        // ✅ SISTEMA DE GRAVIDADE PADRONIZADO
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
        
        // Limitar aos bounds
        this.x = Math.max(0, Math.min(this.x, 4800));
    }
    
    /**
     * Recuar do jogador
     */
    retreat(player) {
        this.aiState = 'retreating';
        const direction = this.x < player.x ? -1 : 1;
        this.x += direction * this.speed * 1.5;  // Recua mais rápido
        this.walkCycle += 0.3;
        this.aimTime = 0;
        this.laserSight = null;
    }
    
    /**
     * Aproximar do jogador
     */
    approach(player) {
        this.aiState = 'approaching';
        const direction = this.x < player.x ? 1 : -1;
        this.x += direction * this.speed;
        this.walkCycle += 0.2;
        this.aimTime = 0;
        this.laserSight = null;
    }
    
    /**
     * Mirar e atirar
     */
    aimAndShoot(player) {
        this.aiState = 'aiming';
        this.walkCycle = 0;  // Parado enquanto mira
        
        if (this.aimTime < this.aimDuration) {
            // Mirando
            this.aimTime++;
            this.laserSight = {
                x1: this.x + this.w/2,
                y1: this.y + this.h/2,
                x2: player.x + player.w/2,
                y2: player.y + player.h/2
            };
        } else {
            // Atirar!
            this.shoot(player);
            this.aimTime = 0;
            this.attackCooldown = this.shootCooldown;
            this.laserSight = null;
        }
    }
    
    /**
     * Disparar projétil
     */
    shoot(player) {
        // Calcular ângulo para o jogador
        const angle = Math.atan2(
            (player.y + player.h/2) - (this.y + this.h/2),
            (player.x + player.w/2) - (this.x + this.w/2)
        );
        
        // Criar projétil
        const projectile = {
            x: this.x + this.w/2,
            y: this.y + this.h/2,
            w: 8,
            h: 8,
            vx: Math.cos(angle) * 12,
            vy: Math.sin(angle) * 12,
            damage: this.damage,
            type: 'enemy_projectile',
            life: 60,
            maxLife: 60,
            color: '#f1c40f',
            owner: this
        };
        
        // Adicionar ao array global de projéteis
        if (!window.projectiles) window.projectiles = [];
        window.projectiles.push(projectile);
        
        // Som de tiro
        if (window.soundSystem) {
            window.soundSystem.playSound('shoot');
        }
        
        // Efeito visual do disparo
        if (window.particles) {
            for (let i = 0; i < 5; i++) {
                window.particles.push({
                    x: this.x + this.w/2,
                    y: this.y + this.h/2,
                    vx: Math.cos(angle) * (4 + Math.random() * 4) + (Math.random() - 0.5) * 2,
                    vy: Math.sin(angle) * (4 + Math.random() * 4) + (Math.random() - 0.5) * 2,
                    life: 15,
                    maxLife: 15,
                    color: i % 2 === 0 ? '#ff9900' : '#ffcc00',
                    size: 4 + Math.random() * 3
                });
            }
        }
    }
    
    /**
     * Encontrar jogador mais próximo
     */
    getNearestPlayer(players) {
        return players.reduce((nearest, player) => {
            return this.distanceTo(player) < this.distanceTo(nearest) ? player : nearest;
        }, players[0]);
    }
    
    /**
     * Desenho com mira laser
     */
    draw(ctx) {
        // Desenho base do inimigo
        super.draw(ctx);
        
        // Desenhar mira laser quando mirando
        if (this.laserSight && this.aimTime > 10) {
            ctx.save();
            
            // Alpha aumenta conforme mira
            const alpha = Math.min((this.aimTime / this.aimDuration) * 0.8, 0.8);
            
            // Linha laser
            ctx.strokeStyle = `rgba(255, 0, 0, ${alpha})`;
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.moveTo(this.laserSight.x1, this.laserSight.y1);
            ctx.lineTo(this.laserSight.x2, this.laserSight.y2);
            ctx.stroke();
            
            // Ponto de mira no alvo
            ctx.strokeStyle = `rgba(255, 0, 0, ${alpha})`;
            ctx.lineWidth = 2;
            ctx.setLineDash([]);
            ctx.beginPath();
            ctx.arc(this.laserSight.x2, this.laserSight.y2, 8, 0, Math.PI * 2);
            ctx.stroke();
            
            // Cruz no centro da mira
            ctx.beginPath();
            ctx.moveTo(this.laserSight.x2 - 12, this.laserSight.y2);
            ctx.lineTo(this.laserSight.x2 + 12, this.laserSight.y2);
            ctx.moveTo(this.laserSight.x2, this.laserSight.y2 - 12);
            ctx.lineTo(this.laserSight.x2, this.laserSight.y2 + 12);
            ctx.stroke();
            
            ctx.restore();
        }
        
        // Indicador de rifle acima da cabeça
        if (this.life > 0) {
            ctx.save();
            ctx.fillStyle = this.color;
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('🎯', this.x + this.w/2, this.y - 35);
            ctx.restore();
        }
    }
    
    /**
     * Sobrescrever drawBody para visual de sniper
     */
    drawBody(ctx) {
        // Corpo verde camuflado
        const gradient = ctx.createLinearGradient(this.x, this.y + 20, this.x, this.y + this.h);
        gradient.addColorStop(0, this.color);
        gradient.addColorStop(1, this.secondaryColor);
        ctx.fillStyle = gradient;
        ctx.fillRect(this.x + 8, this.y + 20, this.w - 16, this.h - 25);
        
        // Colete camuflado
        ctx.fillStyle = '#1e8449';
        ctx.fillRect(this.x + 12, this.y + 25, this.w - 24, this.h - 35);
        
        // Padrão de camuflagem (manchas)
        ctx.fillStyle = '#145a32';
        for (let i = 0; i < 3; i++) {
            const offsetX = (i * 8) + 14;
            const offsetY = 28 + (i * 6);
            ctx.fillRect(this.x + offsetX, this.y + offsetY, 6, 4);
        }
        
        // Cabeça com capacete
        ctx.fillStyle = '#1a5a2e';
        ctx.beginPath();
        ctx.arc(this.x + this.w / 2, this.y + 12, 16, 0, Math.PI * 2);
        ctx.fill();
        
        // Capacete (borda)
        ctx.strokeStyle = '#0d3d1f';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(this.x + this.w / 2, this.y + 12, 16, Math.PI, 0);
        ctx.stroke();
        
        // Óculos de sniper (visão noturna)
        ctx.fillStyle = '#000';
        ctx.fillRect(this.x + this.w / 2 - 12, this.y + 8, 10, 6);
        ctx.fillRect(this.x + this.w / 2 + 2, this.y + 8, 10, 6);
        
        // Lentes verdes
        ctx.fillStyle = this.aimTime > 0 ? '#ff0000' : '#00ff00';
        ctx.fillRect(this.x + this.w / 2 - 11, this.y + 9, 8, 4);
        ctx.fillRect(this.x + this.w / 2 + 3, this.y + 9, 8, 4);
        
        // Rifle (quando mirando)
        if (this.aiState === 'aiming') {
            ctx.save();
            ctx.strokeStyle = '#2c3e50';
            ctx.lineWidth = 4;
            
            const angle = this.laserSight ? 
                Math.atan2(
                    this.laserSight.y2 - this.laserSight.y1,
                    this.laserSight.x2 - this.laserSight.x1
                ) : 0;
            
            ctx.translate(this.x + this.w/2, this.y + this.h/2);
            ctx.rotate(angle);
            
            // Corpo do rifle
            ctx.beginPath();
            ctx.moveTo(5, 0);
            ctx.lineTo(35, 0);
            ctx.stroke();
            
            // Mira do rifle
            ctx.strokeStyle = '#555';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(30, -3);
            ctx.lineTo(30, 3);
            ctx.stroke();
            
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
    window.SniperEnemy = SniperEnemy;
}
