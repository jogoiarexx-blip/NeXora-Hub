// paddle.js - Paddle com Gráficos Aprimorados e Efeitos Visuais
class Paddle {
    constructor() {
        this.baseWidth = CONFIG.PADDLE.WIDTH;
        this.height = CONFIG.PADDLE.HEIGHT;
        
        // ✅ FIX: Inicializa width antes de usar
        this.width = this.baseWidth;
        
        this.x = Game.width / 2 - this.width / 2;
        this.y = Game.height - CONFIG.PADDLE.OFFSET_BOTTOM;
        
        this.speed = 0;
        this.moveLeft = false;
        this.moveRight = false;
        
        // 🎨 NOVOS EFEITOS VISUAIS
        this.glowIntensity = 0;
        this.pulsePhase = 0;
        this.trailParticles = [];
        this.energyLevel = 1.0;
        this.lastHitTime = 0;
        this.hitGlowIntensity = 0;
        
        // Cores do gradiente animado
        this.hue = 190; // Ciano base
        this.hueShift = 0;
        
        // Armazena referências para cleanup
        this.keyDownHandler = null;
        this.keyUpHandler = null;
        this.mouseHandler = null;
        
        // Aplica upgrades após inicializar width
        this.applyUpgrades();
        
        this.setupControls();
    }

    applyUpgrades() {
        // ✅ FIX BUG #2: Verifica se width existe antes de salvar oldWidth
        const oldWidth = this.width || this.baseWidth;
        
        const bonus = Game.economy ? Game.economy.getEffect('paddleWidth') : 0;
        this.width = this.baseWidth + bonus;
        
        // ✅ FIX: Ajusta posição para manter centralizado
        if (oldWidth) {
            this.x += (oldWidth - this.width) / 2;
        }
        
        // Garante que não saia dos limites
        this.clampPosition();
    }

    setupControls() {
        // Remove listeners antigos se existirem
        this.removeControls();
        
        // Keyboard controls
        this.keyDownHandler = (e) => {
            if (Game.state !== 'PLAYING') return;
            
            if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
                this.moveLeft = true;
                e.preventDefault();
            }
            if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
                this.moveRight = true;
                e.preventDefault();
            }
        };

        this.keyUpHandler = (e) => {
            if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
                this.moveLeft = false;
            }
            if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
                this.moveRight = false;
            }
        };

        // Mouse/Touch controls
        this.mouseHandler = (e) => {
            if (Game.state !== 'PLAYING') return;
            
            const rect = Game.canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            
            // Move paddle suavemente em direção ao mouse
            const targetX = mouseX - this.width / 2;
            const diff = targetX - this.x;
            
            if (Math.abs(diff) > 5) {
                this.x += diff * 0.2; // Smooth following
                this.clampPosition();
            }
        };

        window.addEventListener('keydown', this.keyDownHandler);
        window.addEventListener('keyup', this.keyUpHandler);
        Game.canvas.addEventListener('mousemove', this.mouseHandler);
        
        // ✅ MOBILE: Touch controls
        this.setupTouchControls();
    }
    
    setupTouchControls() {
        let touchActive = false;
        
        const getTouchPos = (touch) => {
            const rect = Game.canvas.getBoundingClientRect();
            const scaleX = Game.canvas.width / rect.width;
            const touchX = (touch.clientX - rect.left) * scaleX;
            return touchX;
        };
        
        this.touchStartHandler = (e) => {
            if (Game.state !== 'PLAYING') return;
            e.preventDefault();
            touchActive = true;
            
            const touchX = getTouchPos(e.touches[0]);
            this.x = touchX - this.width / 2;
            this.clampPosition();
            
            // Lança bola ao tocar
            if (Game.ball && !Game.ball.active) {
                Game.ball.launch();
                
                // Vibração táctil
                if (navigator.vibrate) {
                    navigator.vibrate(50);
                }
            }
        };
        
        this.touchMoveHandler = (e) => {
            if (Game.state !== 'PLAYING') return;
            e.preventDefault();
            
            if (!touchActive) return;
            
            const touchX = getTouchPos(e.touches[0]);
            this.x = touchX - this.width / 2;
            this.clampPosition();
        };
        
        this.touchEndHandler = (e) => {
            e.preventDefault();
            touchActive = false;
        };
        
        Game.canvas.addEventListener('touchstart', this.touchStartHandler, { passive: false });
        Game.canvas.addEventListener('touchmove', this.touchMoveHandler, { passive: false });
        Game.canvas.addEventListener('touchend', this.touchEndHandler, { passive: false });
        Game.canvas.addEventListener('touchcancel', this.touchEndHandler, { passive: false });
    }

    removeControls() {
        if (this.keyDownHandler) {
            window.removeEventListener('keydown', this.keyDownHandler);
        }
        if (this.keyUpHandler) {
            window.removeEventListener('keyup', this.keyUpHandler);
        }
        if (this.mouseHandler) {
            Game.canvas.removeEventListener('mousemove', this.mouseHandler);
        }
        // ✅ MOBILE: Remove touch handlers
        if (this.touchStartHandler) {
            Game.canvas.removeEventListener('touchstart', this.touchStartHandler);
            Game.canvas.removeEventListener('touchmove', this.touchMoveHandler);
            Game.canvas.removeEventListener('touchend', this.touchEndHandler);
            Game.canvas.removeEventListener('touchcancel', this.touchEndHandler);
        }
    }

    reset() {
        this.x = Game.width / 2 - this.width / 2;
        this.speed = 0;
        this.moveLeft = false;
        this.moveRight = false;
        this.energyLevel = 1.0;
    }
    
    // 🎨 Método para criar efeito de hit
    onHit() {
        this.lastHitTime = Date.now();
        this.hitGlowIntensity = 1.0;
        this.energyLevel = Math.min(this.energyLevel + 0.1, 1.5);
    }

    update() {
        // Keyboard movement
        if (this.moveLeft) {
            this.speed -= CONFIG.PADDLE.ACCELERATION;
        }
        if (this.moveRight) {
            this.speed += CONFIG.PADDLE.ACCELERATION;
        }

        // Apply friction
        this.speed *= CONFIG.PADDLE.FRICTION;

        // Clamp speed
        this.speed = Math.max(-CONFIG.PADDLE.MAX_SPEED, 
                             Math.min(CONFIG.PADDLE.MAX_SPEED, this.speed));

        // Update position
        this.x += this.speed;
        
        this.clampPosition();
        
        // 🎨 ATUALIZAÇÕES DE EFEITOS VISUAIS
        
        // Pulse animation
        this.pulsePhase += 0.05;
        
        // Glow intensity baseado na velocidade
        const speedPercent = Math.abs(this.speed) / CONFIG.PADDLE.MAX_SPEED;
        this.glowIntensity = speedPercent * 0.5 + 0.3;
        
        // Hue shift suave
        this.hueShift += 0.5;
        if (this.hueShift > 360) this.hueShift = 0;
        
        // Decai hit glow
        if (this.hitGlowIntensity > 0) {
            this.hitGlowIntensity -= 0.05;
        }
        
        // Decai energia
        this.energyLevel = Math.max(1.0, this.energyLevel - 0.01);
        
        // Partículas de rastro quando em movimento
        if (Math.abs(this.speed) > 2 && Math.random() < 0.3) {
            this.trailParticles.push({
                x: this.x + this.width / 2 + (Math.random() - 0.5) * this.width,
                y: this.y + this.height / 2,
                life: 1.0,
                size: Math.random() * 3 + 2,
                alpha: 0.8,
                hue: (this.hue + this.hueShift) % 360
            });
            
            // ✅ FIX BUG #3: Limita array para prevenir memory leak
            if (this.trailParticles.length > 100) {
                this.trailParticles.shift(); // Remove a mais antiga
            }
        }
        
        // Atualiza partículas de rastro
        for (let i = this.trailParticles.length - 1; i >= 0; i--) {
            const p = this.trailParticles[i];
            p.life -= 0.05;
            p.y += 2;
            p.alpha = p.life;
            
            if (p.life <= 0) {
                this.trailParticles.splice(i, 1);
            }
        }
        
        // Limita número de partículas
        if (this.trailParticles.length > 30) {
            this.trailParticles.shift();
        }
    }

    clampPosition() {
        // Boundaries
        if (this.x < 0) {
            this.x = 0;
            this.speed = 0;
        }
        if (this.x + this.width > Game.width) {
            this.x = Game.width - this.width;
            this.speed = 0;
        }
    }

    draw() {
        const ctx = Game.ctx;
        
        // 🎨 DESENHA PARTÍCULAS DE RASTRO PRIMEIRO
        this.drawTrailParticles(ctx);
        
        // 🎨 REFLEXO/SOMBRA PROJETADA
        this.drawShadow(ctx);
        
        // 🎨 BRILHO EXTERNO (GLOW)
        this.drawOuterGlow(ctx);
        
        // ✅ FIX BUG #5: Visual do Shield
        if (this.hasShield) {
            this.drawShield(ctx);
        }
        
        // 🎨 CORPO PRINCIPAL COM GRADIENTE 3D
        this.drawMainBody(ctx);
        
        // 🎨 DETALHES METÁLICOS
        this.drawMetallicDetails(ctx);
        
        // 🎨 BORDA COM EFEITO NEON
        this.drawNeonBorder(ctx);
        
        // 🎨 INDICADOR DE ENERGIA
        this.drawEnergyIndicator(ctx);
        
        // 🎨 HIT EFFECT
        if (this.hitGlowIntensity > 0) {
            this.drawHitEffect(ctx);
        }
        
        ctx.shadowBlur = 0;
    }
    
    drawShield(ctx) {
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;
        const radius = Math.max(this.width, this.height) * 0.8;
        const pulse = Math.sin(Date.now() / 200) * 0.2 + 0.8;
        
        // Círculo de escudo externo
        ctx.save();
        ctx.strokeStyle = `rgba(255, 193, 7, ${pulse * 0.6})`;
        ctx.lineWidth = 3;
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#FFC107';
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.stroke();
        
        // Círculo de escudo interno
        ctx.strokeStyle = `rgba(255, 235, 59, ${pulse * 0.4})`;
        ctx.lineWidth = 2;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius - 5, 0, Math.PI * 2);
        ctx.stroke();
        
        // Hexágonos decorativos
        for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI / 3) + (Date.now() / 1000);
            const x = centerX + Math.cos(angle) * radius * 0.8;
            const y = centerY + Math.sin(angle) * radius * 0.8;
            
            ctx.fillStyle = `rgba(255, 215, 0, ${pulse * 0.5})`;
            ctx.beginPath();
            ctx.arc(x, y, 3, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    }
    
    drawTrailParticles(ctx) {
        this.trailParticles.forEach(p => {
            ctx.save();
            ctx.globalAlpha = p.alpha * 0.6;
            
            const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
            gradient.addColorStop(0, `hsla(${p.hue}, 100%, 70%, 1)`);
            gradient.addColorStop(1, `hsla(${p.hue}, 100%, 50%, 0)`);
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.restore();
        });
    }
    
    drawShadow(ctx) {
        // Sombra suave abaixo do paddle
        ctx.save();
        ctx.globalAlpha = 0.3;
        
        const shadowGradient = ctx.createRadialGradient(
            this.x + this.width / 2, 
            this.y + this.height + 5,
            0,
            this.x + this.width / 2,
            this.y + this.height + 5,
            this.width / 2
        );
        shadowGradient.addColorStop(0, 'rgba(0, 0, 0, 0.5)');
        shadowGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        ctx.fillStyle = shadowGradient;
        ctx.fillRect(
            this.x - 10,
            this.y + this.height,
            this.width + 20,
            15
        );
        
        ctx.restore();
    }
    
    drawOuterGlow(ctx) {
        const pulse = Math.sin(this.pulsePhase) * 0.3 + 0.7;
        const glowSize = 20 * this.glowIntensity * pulse * this.energyLevel;
        
        ctx.shadowBlur = glowSize;
        ctx.shadowColor = `hsla(${this.hue}, 100%, 60%, ${this.glowIntensity})`;
        
        // Glow interno
        const glowGradient = ctx.createRadialGradient(
            this.x + this.width / 2,
            this.y + this.height / 2,
            0,
            this.x + this.width / 2,
            this.y + this.height / 2,
            this.width / 2 + glowSize
        );
        glowGradient.addColorStop(0, `hsla(${this.hue}, 100%, 60%, 0.3)`);
        glowGradient.addColorStop(0.5, `hsla(${this.hue}, 100%, 50%, 0.1)`);
        glowGradient.addColorStop(1, `hsla(${this.hue}, 100%, 40%, 0)`);
        
        ctx.fillStyle = glowGradient;
        this.roundRect(ctx, this.x - 5, this.y - 5, this.width + 10, this.height + 10, 10);
        ctx.fill();
    }
    
    drawMainBody(ctx) {
        // Gradiente 3D principal
        const bodyGradient = ctx.createLinearGradient(
            this.x, 
            this.y, 
            this.x, 
            this.y + this.height
        );
        
        const mainHue = (this.hue + this.hueShift * 0.1) % 360;
        
        bodyGradient.addColorStop(0, `hsl(${mainHue}, 90%, 65%)`);
        bodyGradient.addColorStop(0.3, `hsl(${mainHue}, 85%, 55%)`);
        bodyGradient.addColorStop(0.7, `hsl(${mainHue}, 80%, 45%)`);
        bodyGradient.addColorStop(1, `hsl(${mainHue}, 75%, 35%)`);
        
        ctx.fillStyle = bodyGradient;
        ctx.shadowBlur = 15;
        ctx.shadowColor = CONFIG.PADDLE.COLOR;
        this.roundRect(ctx, this.x, this.y, this.width, this.height, 8);
        ctx.fill();
        ctx.shadowBlur = 0;
    }
    
    drawMetallicDetails(ctx) {
        // Brilho superior metálico
        const highlightGradient = ctx.createLinearGradient(
            this.x, 
            this.y, 
            this.x, 
            this.y + this.height * 0.4
        );
        highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
        highlightGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.3)');
        highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        ctx.fillStyle = highlightGradient;
        this.roundRect(ctx, this.x + 2, this.y + 2, this.width - 4, this.height * 0.4, 6);
        ctx.fill();
        
        // Linha de luz no centro
        const centerY = this.y + this.height / 2;
        const centerLightGradient = ctx.createLinearGradient(
            this.x, centerY - 1, this.x, centerY + 1
        );
        centerLightGradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
        centerLightGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.4)');
        centerLightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        ctx.fillStyle = centerLightGradient;
        ctx.fillRect(this.x + 5, centerY - 1, this.width - 10, 2);
        
        // Detalhes geométricos nas bordas
        this.drawEdgeDetails(ctx);
    }
    
    drawEdgeDetails(ctx) {
        const segmentWidth = this.width / 5;
        
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 1;
        
        for (let i = 1; i < 5; i++) {
            const x = this.x + i * segmentWidth;
            ctx.beginPath();
            ctx.moveTo(x, this.y + 3);
            ctx.lineTo(x, this.y + this.height - 3);
            ctx.stroke();
        }
    }
    
    drawNeonBorder(ctx) {
        // Borda externa com efeito neon
        const borderPulse = Math.sin(this.pulsePhase * 1.5) * 0.2 + 0.8;
        
        ctx.strokeStyle = `hsla(${this.hue}, 100%, 70%, ${borderPulse})`;
        ctx.lineWidth = 2;
        ctx.shadowBlur = 10;
        ctx.shadowColor = `hsl(${this.hue}, 100%, 60%)`;
        
        this.roundRect(ctx, this.x, this.y, this.width, this.height, 8);
        ctx.stroke();
        
        // Borda interna mais sutil
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 1;
        ctx.shadowBlur = 5;
        ctx.shadowColor = 'rgba(255, 255, 255, 0.3)';
        
        this.roundRect(ctx, this.x + 2, this.y + 2, this.width - 4, this.height - 4, 6);
        ctx.stroke();
        
        ctx.shadowBlur = 0;
    }
    
    drawEnergyIndicator(ctx) {
        if (this.energyLevel <= 1.0) return;
        
        // Barra de energia no topo do paddle
        const barWidth = this.width - 10;
        const barHeight = 3;
        const barX = this.x + 5;
        const barY = this.y - 8;
        
        const energyPercent = (this.energyLevel - 1.0) / 0.5;
        
        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(barX, barY, barWidth, barHeight);
        
        // Energy bar
        const energyGradient = ctx.createLinearGradient(barX, barY, barX + barWidth, barY);
        energyGradient.addColorStop(0, '#FFD700');
        energyGradient.addColorStop(0.5, '#FF6B00');
        energyGradient.addColorStop(1, '#FF0000');
        
        ctx.fillStyle = energyGradient;
        ctx.fillRect(barX, barY, barWidth * energyPercent, barHeight);
        
        // Glow
        ctx.shadowBlur = 8;
        ctx.shadowColor = '#FFD700';
        ctx.fillRect(barX, barY, barWidth * energyPercent, barHeight);
        ctx.shadowBlur = 0;
    }
    
    drawHitEffect(ctx) {
        const rippleSize = (1 - this.hitGlowIntensity) * 30;
        
        ctx.save();
        ctx.globalAlpha = this.hitGlowIntensity * 0.5;
        
        // Ondas de choque
        for (let i = 0; i < 3; i++) {
            const size = rippleSize + i * 10;
            const alpha = this.hitGlowIntensity * (1 - i * 0.3);
            
            ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.lineWidth = 2;
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#00d2ff';
            
            this.roundRect(
                ctx,
                this.x - size,
                this.y - size,
                this.width + size * 2,
                this.height + size * 2,
                8 + size
            );
            ctx.stroke();
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

    destroy() {
        this.removeControls();
    }
}
