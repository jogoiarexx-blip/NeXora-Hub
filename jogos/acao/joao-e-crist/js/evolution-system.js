/**
 * Sistema de XP e Evolução de Personagem
 * O jogador ganha XP matando inimigos e sobe de nível
 */

class PlayerEvolution {
    constructor(player) {
        this.player = player;
        this.level = 1;
        this.xp = 0;
        this.xpToNextLevel = 100;
        this.maxLevel = 50;
        
        // Stats base do personagem
        this.baseStats = {
            maxLife: player.maxLife,
            attackDamage: player.attackDamage || 20,
            speed: player.speed || 5,
            defense: 0
        };
        
        // Multiplicadores por nível
        this.growthRates = {
            maxLife: 10,        // +10 HP por nível
            attackDamage: 2,    // +2 dano por nível
            speed: 0.1,         // +0.1 velocidade por nível
            defense: 1          // +1% redução de dano por nível
        };
        
        // Skills desbloqueadas
        this.unlockedSkills = [];
        this.skillTree = [
            { level: 3,  name: 'Combo Duplo',    description: 'Ataque combo faz 2 hits' },
            { level: 5,  name: 'Super Pulo',      description: 'Pula 50% mais alto' },
            { level: 7,  name: 'Dash Mortal',     description: 'Dash causa dano' },
            { level: 10, name: 'Regeneração',     description: 'Regenera 1 HP a cada 5 segundos' },
            { level: 12, name: 'Impacto Sônico',  description: 'Ataques derrubam inimigos fracos' },
            { level: 14, name: 'Fúria',           description: '+50% dano quando HP < 30%' },
            { level: 16, name: 'Aura Protetora',  description: 'Reduz dano recebido em 15%' },
            { level: 18, name: 'Escudo',          description: 'Bloqueia próximo hit a cada 8s' },
            { level: 20, name: 'Super Força',     description: 'Ataque causa knockback extra' },
            { level: 22, name: 'Reflexos',        description: '25% chance de evasão' },
            { level: 25, name: 'Vampirismo',      description: 'Recupera 5% da vida ao matar' },
            { level: 28, name: 'Combo Triplo',    description: 'Ataque combo faz 3 hits' },
            { level: 30, name: 'Explosão de Combo',description: 'Combos acima de 10x causam onda de choque' },
            { level: 35, name: 'Dash Infinito',   description: 'Cooldown do dash reduzido em 60%' },
            { level: 40, name: 'Imortal',         description: 'Revive 1x por fase com 50% HP' },
            { level: 45, name: 'Modo Berserker',  description: '+100% velocidade de ataque' },
            { level: 50, name: 'LENDÁRIO',        description: 'Todos os stats x2 - Você chegou ao topo' }
        ];
        
        this.lastRegenTime = 0;
        this.lastShieldTime = 0;
        this.hasRevived = false;
        this.shieldActive = false;
    }
    
    /**
     * Adiciona XP e verifica se subiu de nível
     */
    addXP(amount) {
        if (this.level >= this.maxLevel) return;
        
        this.xp += amount;
        
        // Verificar level up
        while (this.xp >= this.xpToNextLevel && this.level < this.maxLevel) {
            this.levelUp();
        }
    }
    
    /**
     * Sobe de nível e melhora stats
     */
    levelUp() {
        this.level++;
        this.xp -= this.xpToNextLevel;
        this.xpToNextLevel = Math.floor(this.xpToNextLevel * 1.15); // +15% XP necessário
        
        // Aumentar stats
        this.player.maxLife += this.growthRates.maxLife;
        
        // ✅ CORREÇÃO: Garantir que a vida seja restaurada completamente ao subir de nível
        this.player.life = this.player.maxLife; 
        
        // Remover invulnerabilidade se tiver (para evitar bugs)
        if (this.player.invulnerable) {
            this.player.invulnerable = false;
            this.player.invulnerableTimer = 0;
        }
        
        if (this.player.attackDamage) {
            this.player.attackDamage += this.growthRates.attackDamage;
        }
        
        this.player.speed += this.growthRates.speed;
        
        // Verificar skills desbloqueadas
        const newSkills = this.skillTree.filter(skill => 
            skill.level === this.level && !this.unlockedSkills.includes(skill.name)
        );
        
        newSkills.forEach(skill => {
            this.unlockedSkills.push(skill.name);
            this.applySkill(skill);
        });
        
        // Efeitos visuais e sonoros
        if (window.particles) {
            window.particles.explosion(this.player.x + this.player.w/2, this.player.y + this.player.h/2, 30, {
                color: '#ffd700',
                speed: 6,
                size: 5
            });
            window.particles.createText(this.player.x + this.player.w/2, this.player.y - 30, 
                'LEVEL UP!', '#ffd700', { size: 32, maxLife: 120 });
        }
        
        if (window.soundSystem) {
            window.soundSystem.playSound('powerup');
        }
        
        // Notificar evento
        if (window.eventBus) {
            window.eventBus.emit('player:levelup', {
                level: this.level,
                player: this.player,
                newSkills: newSkills
            });
        }
        
        return newSkills;
    }
    
    /**
     * Aplica efeito de skill desbloqueada
     */
    applySkill(skill) {
        console.log(`🎯 Skill desbloqueada: ${skill.name} - ${skill.description}`);
        
        switch(skill.name) {
            case 'Super Pulo':
                this.player.jumpPower = (this.player.jumpPower || 15) * 1.5;
                break;
            case 'Aura Protetora':
                this.player._auraProtection = true;
                break;
            case 'Vampirismo':
                this.player._vampirism = true;
                break;
            case 'Combo Triplo':
                this.player._comboTriple = true;
                break;
            case 'Dash Infinito':
                if (this.player.dashDuration) this.player.dashDuration = Math.ceil(this.player.dashDuration * 0.4);
                break;
            case 'Modo Berserker':
                if (this.player.attackCooldownBase) this.player.attackCooldownBase = Math.ceil(this.player.attackCooldownBase * 0.5);
                break;
            case 'LENDÁRIO':
                this.player.maxLife *= 2;
                this.player.life = this.player.maxLife;
                if (this.player.attackDamage) this.player.attackDamage *= 2;
                this.player.speed *= 2;
                break;
        }
    }
    
    /**
     * Verifica se tem uma skill específica
     */
    hasSkill(skillName) {
        return this.unlockedSkills.includes(skillName);
    }
    
    /**
     * Calcula redução de dano baseada em defesa
     */
    calculateDamageReduction(damage) {
        const defensePercent = Math.min(this.level * this.growthRates.defense, 75); // Max 75% redução
        const reduction = damage * (defensePercent / 100);
        return Math.max(1, damage - reduction);
    }
    
    /**
     * Tenta evasão (Skill: Reflexos)
     */
    tryEvade() {
        if (this.hasSkill('Reflexos')) {
            return Math.random() < 0.2; // 20% chance
        }
        return false;
    }
    
    /**
     * Ativa escudo se disponível (Skill: Escudo)
     */
    tryShield() {
        if (this.hasSkill('Escudo')) {
            const now = Date.now();
            if (now - this.lastShieldTime >= 10000) { // 10 segundos
                this.lastShieldTime = now;
                this.shieldActive = true;
                
                if (window.particles) {
                    window.particles.createText(this.player.x + this.player.w/2, this.player.y - 20, 
                        'BLOQUEADO!', '#00ffff', { size: 24 });
                }
                
                return true;
            }
        }
        return false;
    }
    
    /**
     * Tenta reviver (Skill: Imortal)
     */
    tryRevive() {
        if (this.hasSkill('Imortal') && !this.hasRevived) {
            this.hasRevived = true;
            this.player.life = Math.floor(this.player.maxLife * 0.5);
            
            if (window.particles) {
                window.particles.explosion(this.player.x + this.player.w/2, this.player.y + this.player.h/2, 50, {
                    color: '#ff00ff',
                    speed: 8,
                    size: 6
                });
                window.particles.createText(this.player.x + this.player.w/2, this.player.y, 
                    'REVIVEU!', '#ff00ff', { size: 36, maxLife: 150 });
            }
            
            return true;
        }
        return false;
    }
    
    /**
     * Update - chamado a cada frame
     */
    update() {
        // Regeneração (Skill)
        if (this.hasSkill('Regeneração')) {
            const now = Date.now();
            if (now - this.lastRegenTime >= 5000) { // 5 segundos
                this.lastRegenTime = now;
                if (this.player.life < this.player.maxLife) {
                    this.player.life = Math.min(this.player.maxLife, this.player.life + 1);
                    
                    if (window.particles) {
                        window.particles.createText(this.player.x + this.player.w/2, this.player.y - 10, 
                            '+1', '#00ff00', { size: 16, maxLife: 60 });
                    }
                }
            }
        }
        
        // Desativar escudo após usar
        if (this.shieldActive) {
            this.shieldActive = false;
        }
    }
    
    /**
     * Desenha barra de XP e indicadores
     */
    draw(ctx, x, y) {
        // Barra de XP
        const barWidth = 200;
        const barHeight = 12;
        const barX = x;
        const barY = y;
        
        // Fundo
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(barX - 2, barY - 2, barWidth + 4, barHeight + 4);
        
        // Borda
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 2;
        ctx.strokeRect(barX, barY, barWidth, barHeight);
        
        // Progresso
        const progress = this.level >= this.maxLevel ? 1 : this.xp / this.xpToNextLevel;
        const gradient = ctx.createLinearGradient(barX, barY, barX + barWidth, barY);
        gradient.addColorStop(0, '#4169e1');
        gradient.addColorStop(1, '#1e90ff');
        ctx.fillStyle = gradient;
        ctx.fillRect(barX, barY, barWidth * progress, barHeight);
        
        // Texto
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`LVL ${this.level}`, barX + barWidth/2, barY - 6);
        
        if (this.level < this.maxLevel) {
            ctx.font = '10px Arial';
            ctx.fillText(`${this.xp}/${this.xpToNextLevel} XP`, barX + barWidth/2, barY + barHeight + 12);
        } else {
            ctx.font = 'bold 10px Arial';
            ctx.fillStyle = '#ffd700';
            ctx.fillText('MAX LEVEL', barX + barWidth/2, barY + barHeight + 12);
        }
    }
    
    /**
     * Reseta evolução para nova fase
     */
    resetForNewLevel() {
        this.hasRevived = false;
    }
    
    /**
     * Salva progresso
     */
    save() {
        return {
            level: this.level,
            xp: this.xp,
            xpToNextLevel: this.xpToNextLevel,
            unlockedSkills: this.unlockedSkills
        };
    }
    
    /**
     * Carrega progresso salvo
     */
    load(data) {
        if (!data) return;
        
        this.level = data.level || 1;
        this.xp = data.xp || 0;
        this.xpToNextLevel = data.xpToNextLevel || 100;
        this.unlockedSkills = data.unlockedSkills || [];
        
        // Reaplicar stats
        const levelDiff = this.level - 1;
        this.player.maxLife = this.baseStats.maxLife + (levelDiff * this.growthRates.maxLife);
        
        // ✅ CORREÇÃO: Sempre começar com vida cheia ao iniciar novo jogo
        this.player.life = this.player.maxLife;
        
        if (this.player.attackDamage) {
            this.player.attackDamage = this.baseStats.attackDamage + (levelDiff * this.growthRates.attackDamage);
        }
        this.player.speed = this.baseStats.speed + (levelDiff * this.growthRates.speed);
        
        // Reaplicar skills
        this.unlockedSkills.forEach(skillName => {
            const skill = this.skillTree.find(s => s.name === skillName);
            if (skill) this.applySkill(skill);
        });
    }
}

/**
 * Tabela de XP por tipo de inimigo
 */
const XP_REWARDS = {
    'basic': 10,
    'ciclista': 12,
    'fast': 15,
    'strong': 20,
    'tank': 30,
    'berserker': 25,
    'elite': 40,
    'ghost': 35,
    'assassin': 50,
    'boss': 500,
    'final_boss': 1000,
    'tech_boss': 1500,
    'shadow_boss': 2000,
    'god_boss': 5000
};
