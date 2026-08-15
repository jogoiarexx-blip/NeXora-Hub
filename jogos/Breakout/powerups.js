// powerups.js - Sistema de Power-ups
const POWERUPS = {
    multiball: {
        name: "Multi-Bola",
        icon: '⚽',
        color: '#4CAF50',
        dropChance: 0.05,
        duration: 0,
        effect: (game) => {
            // Cria 2 bolas extras
            if (!game.extraBalls) game.extraBalls = [];
            
            for (let i = 0; i < 2; i++) {
                const angle = (Math.random() - 0.5) * Math.PI / 3;
                const speed = Math.sqrt(game.ball.speedX**2 + game.ball.speedY**2);
                
                game.extraBalls.push({
                    x: game.ball.x,
                    y: game.ball.y,
                    radius: game.ball.radius,
                    speedX: Math.sin(angle) * speed,
                    speedY: -Math.abs(Math.cos(angle) * speed),
                    active: true
                });
            }
            
            if (game.audio) game.audio.play('powerup');
        }
    },
    
    widePaddle: {
        name: "Paddle Largo",
        icon: '📏',
        color: '#2196F3',
        dropChance: 0.08,
        duration: 10000,
        effect: (game) => {
            if (!game.paddle.originalWidth) {
                game.paddle.originalWidth = game.paddle.baseWidth;
            }
            const oldWidth = game.paddle.width;
            game.paddle.baseWidth = game.paddle.originalWidth * 1.5;
            game.paddle.applyUpgrades();
            // Centraliza paddle
            game.paddle.x += (oldWidth - game.paddle.width) / 2;
            game.paddle.clampPosition();
            
            if (game.audio) game.audio.play('powerup');
        },
        onEnd: (game) => {
            if (game.paddle.originalWidth) {
                game.paddle.baseWidth = game.paddle.originalWidth;
                game.paddle.applyUpgrades();
                // ✅ FIX BUG #9: Limpa originalWidth após uso
                delete game.paddle.originalWidth;
            }
        }
    },
    
    fireball: {
        name: "Bola de Fogo",
        icon: '🔥',
        color: '#FF5722',
        dropChance: 0.06,
        duration: 8000,
        effect: (game) => {
            game.ball.fireball = true;
            if (game.audio) game.audio.play('powerup');
        },
        onEnd: (game) => {
            game.ball.fireball = false;
        }
    },
    
    slowmo: {
        name: "Slow Motion",
        icon: '⏱️',
        color: '#9C27B0',
        dropChance: 0.04,
        duration: 5000,
        effect: (game) => {
            if (!game.originalTimeScale) {
                game.originalTimeScale = 1.0;
            }
            game.timeScale = 0.5;
            
            if (game.audio) game.audio.play('powerup');
        },
        onEnd: (game) => {
            game.timeScale = game.originalTimeScale || 1.0;
        }
    },
    
    extraLife: {
        name: "Vida Extra",
        icon: '❤️',
        color: '#E91E63',
        dropChance: 0.02,
        duration: 0,
        effect: (game) => {
            game.data.lives = Math.min(game.data.lives + 1, game.data.maxLives);
            if (game.hud) {
                game.hud.addNotification('+1 VIDA!', '#E91E63', 2);
            }
            if (game.audio) game.audio.play('powerup');
        }
    },
    
    coinRain: {
        name: "Chuva de Moedas",
        icon: '💰',
        color: '#FFD700',
        dropChance: 0.07,
        duration: 15000,
        effect: (game) => {
            if (!game.originalCoinMultiplier) {
                game.originalCoinMultiplier = 1;
            }
            game.coinMultiplier = 3;
            
            if (game.audio) game.audio.play('powerup');
        },
        onEnd: (game) => {
            game.coinMultiplier = game.originalCoinMultiplier || 1;
        }
    },
    
    shield: {
        name: "Escudo",
        icon: '🛡️',
        color: '#FFC107',
        dropChance: 0.03,
        duration: 20000,
        effect: (game) => {
            game.paddle.hasShield = true;
            if (game.audio) game.audio.play('powerup');
        },
        onEnd: (game) => {
            game.paddle.hasShield = false;
        }
    }
};

class PowerUp {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.data = POWERUPS[type];
        this.width = 30;
        this.height = 30;
        this.speedY = 2;
        this.active = true;
        this.rotation = 0;
        this.glowPhase = 0;
    }
    
    update() {
        this.y += this.speedY;
        this.rotation += 0.1;
        this.glowPhase += 0.05;
        
        // Verifica colisão com paddle
        if (this.checkPaddleCollision()) {
            this.collect();
        }
        
        // Remove se sair da tela
        if (this.y > Game.height + 50) {
            this.active = false;
        }
    }
    
    checkPaddleCollision() {
        const paddle = Game.paddle;
        if (!paddle) return false;
        
        return this.x + this.width > paddle.x &&
               this.x < paddle.x + paddle.width &&
               this.y + this.height > paddle.y &&
               this.y < paddle.y + paddle.height;
    }
    
    collect() {
        this.active = false;
        
        // ✅ STATS: Registra power-up coletado
        if (Game.stats) {
            Game.stats.recordPowerUpCollected(this.type);
        }
        
        // Efeito visual
        if (Game.particles) {
            Game.particles.emit(this.x + 15, this.y + 15, 20, this.data.color);
        }
        
        // Notificação
        if (Game.hud) {
            Game.hud.addNotification(`${this.data.icon} ${this.data.name}`, this.data.color, 2);
        }
        
        // Ativa efeito
        this.data.effect(Game);
        
        // Se tem duração, agenda fim do efeito
        if (this.data.duration > 0) {
            // ✅ FIX BUG: pegar o mesmo power-up 2x antes de acabar o primeiro
            // fazia o timer mais antigo desligar o efeito prematuramente.
            // Agora cancela o timer anterior desse tipo e reinicia a contagem.
            if (!Game.activePowerUpTimers) Game.activePowerUpTimers = {};
            if (Game.activePowerUpTimers[this.type]) {
                clearTimeout(Game.activePowerUpTimers[this.type]);
            }
            Game.activePowerUpTimers[this.type] = setTimeout(() => {
                if (this.data.onEnd) {
                    this.data.onEnd(Game);
                }
                delete Game.activePowerUpTimers[this.type];
            }, this.data.duration);
        }
    }
    
    draw() {
        const ctx = Game.ctx;
        
        ctx.save();
        ctx.translate(this.x + 15, this.y + 15);
        ctx.rotate(this.rotation);
        
        // Glow pulsante
        const glowSize = 25 + Math.sin(this.glowPhase) * 5;
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, glowSize);
        gradient.addColorStop(0, this.data.color);
        gradient.addColorStop(0.5, this.data.color + '80');
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, glowSize, 0, Math.PI * 2);
        ctx.fill();
        
        // Background circle
        ctx.fillStyle = this.data.color;
        ctx.beginPath();
        ctx.arc(0, 0, 15, 0, Math.PI * 2);
        ctx.fill();
        
        // Border
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Icon
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#fff';
        ctx.fillText(this.data.icon, 0, 0);
        
        ctx.restore();
    }
}

class PowerUpManager {
    constructor() {
        this.powerUps = [];
        console.log('⚡ PowerUpManager inicializado');
    }
    
    trySpawnFromBrick(brick) {
        // Rola chance de dropar power-up
        const powerupTypes = Object.keys(POWERUPS);
        
        for (let type of powerupTypes) {
            const powerup = POWERUPS[type];
            if (Math.random() < powerup.dropChance) {
                this.spawn(brick.x + brick.width / 2, brick.y + brick.height / 2, type);
                return; // Só um power-up por brick
            }
        }
    }
    
    spawn(x, y, type) {
        this.powerUps.push(new PowerUp(x - 15, y - 15, type));
    }
    
    update() {
        for (let i = this.powerUps.length - 1; i >= 0; i--) {
            const powerup = this.powerUps[i];
            powerup.update();
            
            if (!powerup.active) {
                this.powerUps.splice(i, 1);
            }
        }
    }
    
    draw() {
        this.powerUps.forEach(powerup => powerup.draw());
    }
    
    clear() {
        this.powerUps = [];
    }
}
