// ball.js - Bola com Física Aprimorada
class Ball {
    constructor() {
        this.radius = CONFIG.BALL.RADIUS;
        this.active = false;
        this.lastHitBrick = null; // Evita múltiplas colisões no mesmo frame
        this.reset();
    }

    reset() {
        this.active = false;
        this.x = Game.width / 2;
        this.y = Game.height / 2;
        this.lastHitBrick = null;
        
        // Velocidade base + upgrade
        const speedBonus = Game.economy ? Game.economy.getEffect('ballSpeed') : 0;
        const baseSpeed = CONFIG.BALL.SPEED + speedBonus;
        
        // Ângulo aleatório inicial (evita sempre mesmo padrão)
        const angle = (Math.random() * Math.PI / 3) - Math.PI / 6; // ±30 graus
        this.speedX = baseSpeed * Math.sin(angle);
        this.speedY = -baseSpeed * Math.cos(angle);
    }

    launch() {
        if (!this.active) {
            this.active = true;
            
            // ✅ STATS: Registra lançamento
            if (Game.stats) {
                Game.stats.recordBallLaunched();
            }
            
            if (Game.hud) {
                Game.hud.addNotification('BOA SORTE!', '#00d2ff');
            }
        }
    }

    update(paddle) {
        // ✅ FIX BUG #3: Verifica se paddle existe antes de usar
        if (!paddle) {
            console.warn('Ball.update: paddle não existe');
            return;
        }
        
        if (!this.active) {
            // Segue o paddle
            this.x = paddle.x + paddle.width / 2;
            this.y = paddle.y - this.radius - 5;
            return;
        }

        // ✅ FIX BUG #2: Aplica timeScale para slow motion
        const timeScale = Game.timeScale || 1.0;
        this.x += this.speedX * timeScale;
        this.y += this.speedY * timeScale;

        // Paredes laterais
        if (this.x + this.radius > Game.width) {
            this.x = Game.width - this.radius;
            this.speedX *= -1;
            this.createWallEffect(this.x, this.y);
            // ✅ STATS: Wall bounce
            if (Game.stats) Game.stats.recordWallBounce();
            // ✅ SOM: Bounce na parede
            if (Game.audio) Game.audio.play('wallBounce');
        } else if (this.x - this.radius < 0) {
            this.x = this.radius;
            this.speedX *= -1;
            this.createWallEffect(this.x, this.y);
            // ✅ STATS: Wall bounce
            if (Game.stats) Game.stats.recordWallBounce();
            // ✅ SOM: Bounce na parede
            if (Game.audio) Game.audio.play('wallBounce');
        }
        
        // Teto
        if (this.y - this.radius < 0) {
            this.y = this.radius;
            this.speedY *= -1;
            this.createWallEffect(this.x, this.y);
            // ✅ STATS: Wall bounce
            if (Game.stats) Game.stats.recordWallBounce();
            // ✅ SOM: Bounce no teto
            if (Game.audio) Game.audio.play('wallBounce');
        }
        
        // Chão (Game Over)
        if (this.y - this.radius > Game.height) {
            this.handleDeath();
        }

        // Colisão com Paddle
        this.checkPaddleCollision(paddle);
        
        // Limita velocidade máxima
        this.clampSpeed();
    }

    checkPaddleCollision(paddle) {
        if (!paddle || !this.checkCollisionRect(paddle)) return;
        
        // Posição relativa no paddle (-1 a 1)
        const hitPoint = (this.x - (paddle.x + paddle.width / 2)) / (paddle.width / 2);
        
        // Velocidade atual
        const speed = Math.sqrt(this.speedX * this.speedX + this.speedY * this.speedY);
        const newSpeed = Math.min(speed + CONFIG.BALL.SPEED_INCREMENT, CONFIG.BALL.MAX_SPEED);

        // Ângulo baseado onde bateu (máximo 60 graus)
        const angle = hitPoint * (Math.PI / 3);
        
        this.speedX = newSpeed * Math.sin(angle);
        this.speedY = -Math.abs(newSpeed * Math.cos(angle)); // Sempre pra cima
        
        // Ajusta posição para evitar prender na paddle
        this.y = paddle.y - this.radius - 1;
        
        // 🎨 Ativa efeito visual no paddle
        if (paddle.onHit) {
            paddle.onHit();
        }
        
        // Efeitos
        if (Game.particles) {
            Game.particles.emit(this.x, this.y, 12, CONFIG.PADDLE.COLOR);
        }
        if (Game.hud) Game.hud.resetCombo();
        
        // ✅ STATS: Registra hit no paddle
        if (Game.stats) {
            Game.stats.recordPaddleHit();
        }
        
        // ✅ SOM: Bate no paddle
        if (Game.audio) Game.audio.play('paddleHit');
        
        // Feedback tátil
        this.createPaddleHitEffect(paddle, hitPoint);
    }

    checkCollisionRect(rect) {
        // Ponto mais próximo no retângulo
        const closestX = Math.max(rect.x, Math.min(this.x, rect.x + rect.width));
        const closestY = Math.max(rect.y, Math.min(this.y, rect.y + rect.height));

        // Distância do centro da bola ao ponto mais próximo
        const distX = this.x - closestX;
        const distY = this.y - closestY;
        const distance = Math.sqrt(distX * distX + distY * distY);

        return distance <= this.radius;
    }

    clampSpeed() {
        const speed = Math.sqrt(this.speedX * this.speedX + this.speedY * this.speedY);
        if (speed > CONFIG.BALL.MAX_SPEED) {
            const ratio = CONFIG.BALL.MAX_SPEED / speed;
            this.speedX *= ratio;
            this.speedY *= ratio;
        }
    }

    createWallEffect(x, y) {
        if (Game.particles) {
            Game.particles.emit(x, y, 8, '#ffffff');
        }
    }

    createPaddleHitEffect(paddle, hitPoint) {
        // Efeito visual no ponto de impacto
        const hitX = paddle.x + paddle.width / 2 + (hitPoint * paddle.width / 2);
        if (Game.particles) {
            Game.particles.emit(hitX, paddle.y, 15, '#00d2ff');
        }
    }

    handleDeath() {
        // ✅ Verifica se Game.data existe
        if (!Game.data) {
            console.error('Game.data não existe!');
            return;
        }
        
        // ✅ FIX BUG #5: Shield protege de perder vida
        if (Game.paddle && Game.paddle.hasShield) {
            // Shield ativado - não perde vida mas remove shield
            Game.paddle.hasShield = false;
            
            // Reset da bola
            this.reset();
            
            // Notifica
            if (Game.hud) {
                Game.hud.addNotification('🛡️ SHIELD PROTEGEU!', '#FFC107', 2);
            }
            
            // Som diferente
            if (Game.audio) {
                Game.audio.play('powerup');
            }
            
            // Partículas douradas
            if (Game.particles) {
                Game.particles.emit(Game.paddle.x + Game.paddle.width / 2, Game.paddle.y, 30, '#FFC107');
            }
            
            return; // NÃO continua perdendo vida
        }
        
        // ✅ STATS: Registra perda de vida
        if (Game.stats) {
            Game.stats.recordLifeLost();
        }
        
        // ✅ SOM: Vida perdida
        if (Game.audio) {
            Game.audio.play('lifeLost');
        }
        
        // Sistema de vidas
        Game.data.lives--;
        
        if (Game.data.lives <= 0) {
            // Game Over - sem mais vidas
            Game.state = 'GAME_OVER';
            
            // ✅ STATS: Registra fim de jogo
            if (Game.stats) {
                Game.stats.recordGameEnd(Game.data.score, Game.data.coins);
            }
            
            // ✅ LEADERBOARD: Verifica se entrou no top 10
            if (Game.leaderboard && Game.leaderboard.isHighScore(Game.data.score)) {
                setTimeout(() => {
                    const playerName = promptPlayerName();
                    const position = Game.leaderboard.addScore(
                        playerName,
                        Game.data.score,
                        Game.data.level,
                        Game.data.coins
                    );
                    
                    if (position > 0) {
                        console.log(`🏆 Novo recorde! Posição #${position}`);
                    }
                }, 1000);
            }
            
            // ✅ SOM: Game over
            if (Game.audio) {
                Game.audio.play('gameOver');
            }
            
            if (Game.particles) {
                Game.particles.emit(this.x, Game.height, 50, '#ff4444');
            }
            
            if (Game.hud) {
                Game.hud.addNotification('GAME OVER', '#ff4444');
            }
        } else {
            // Perde vida mas continua jogando
            this.reset();
            if (Game.paddle) {
                Game.paddle.reset();
            }
            
            if (Game.hud) {
                Game.hud.addNotification(`❤️ Vidas: ${Game.data.lives}`, '#FF9800', 2.0);
                Game.hud.resetCombo();
            }
            
            if (Game.particles) {
                Game.particles.emit(this.x, Game.height, 30, '#FF9800');
            }
        }
    }

    draw() {
        const ctx = Game.ctx;
        
        // Sombra/brilho
        // ✅ FIX BUG #4: Visual especial para fireball
        if (this.fireball) {
            ctx.shadowBlur = 25;
            ctx.shadowColor = '#FF4500';
        } else {
            ctx.shadowBlur = 15;
            ctx.shadowColor = CONFIG.BALL.COLOR;
        }
        
        // Bola principal
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.fireball ? '#FF4500' : CONFIG.BALL.COLOR;
        ctx.fill();
        
        // Gradiente interno (efeito 3D)
        const gradient = ctx.createRadialGradient(
            this.x - this.radius / 3, 
            this.y - this.radius / 3, 
            0,
            this.x, 
            this.y, 
            this.radius
        );
        
        if (this.fireball) {
            gradient.addColorStop(0, 'rgba(255, 255, 0, 0.9)');
            gradient.addColorStop(0.5, 'rgba(255, 140, 0, 0.5)');
            gradient.addColorStop(1, 'rgba(255, 69, 0, 0)');
        } else {
            gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
            gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.3)');
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        }
        
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // Chamas ao redor se fireball
        if (this.fireball) {
            for (let i = 0; i < 3; i++) {
                const angle = (Date.now() / 100 + i * Math.PI * 2 / 3);
                const flameX = this.x + Math.cos(angle) * (this.radius + 3);
                const flameY = this.y + Math.sin(angle) * (this.radius + 3);
                
                ctx.fillStyle = `rgba(255, ${100 + Math.random() * 100}, 0, 0.6)`;
                ctx.beginPath();
                ctx.arc(flameX, flameY, 3, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        ctx.shadowBlur = 0;
        ctx.closePath();
        
        // Trail effect quando ativo
        if (this.active && CONFIG.SYSTEM.DEBUG) {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(this.x - this.speedX * 2, this.y - this.speedY * 2);
            ctx.stroke();
        }
    }
}
