// bricks_enhanced.js - Sistema de Tijolos com Gráficos Premium
class Brick {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.width = CONFIG.BRICKS.WIDTH;
        this.height = CONFIG.BRICKS.HEIGHT;
        this.destroyed = false;
        this.type = type;
        
        const brickTypes = CONFIG.BRICKS.TYPES;
        this.stats = { ...(brickTypes[type] || brickTypes.normal) };
        this.currentHits = this.stats.hits;
        this.shakeOffset = { x: 0, y: 0 };
        this.shakeIntensity = 0;
        
        // 🎨 NOVOS EFEITOS VISUAIS
        this.glowPhase = Math.random() * Math.PI * 2;
        this.floatOffset = 0;
        this.floatPhase = Math.random() * Math.PI * 2;
        this.rotationAngle = 0;
        this.scaleEffect = 1.0;
        this.hitFlash = 0;
        this.birthAnimation = 1.0; // Para animação de entrada
        this.destructionProgress = 0;
        this.sparkles = [];
        
        // Cor com hue shift
        this.baseHue = this.getHueFromColor(this.stats.color);
        this.currentHue = this.baseHue;
        
        // ✅ FIX: Rachaduras pré-geradas para evitar flickering
        this.cracksGenerated = false;
        this.cracks = [];
    }
    
    getHueFromColor(color) {
        // Extrai hue aproximado da cor hex
        const colorMap = {
            '#4CAF50': 120,  // Verde
            '#FF9800': 30,   // Laranja
            '#78909C': 200,  // Cinza-azul
            '#00BCD4': 190,  // Ciano
            '#FFD700': 50,   // Dourado
            '#E91E63': 340   // Rosa
        };
        return colorMap[color] || 180;
    }
    
    // ✅ FIX: Gera rachaduras fixas uma única vez
    generateCracks() {
        this.cracksGenerated = true;
        this.cracks = [];
        
        const healthPercent = this.currentHits / this.stats.hits;
        const damagePercent = 1 - healthPercent;
        const numCracks = Math.floor(damagePercent * 3) + 1;
        
        for (let i = 0; i < numCracks; i++) {
            const crack = {
                startX: 0,
                startY: 0,
                segments: []
            };
            
            // Ponto inicial fixo na borda
            const side = Math.floor(Math.random() * 4);
            
            switch(side) {
                case 0: // topo
                    crack.startX = Math.random() * this.width;
                    crack.startY = 0;
                    break;
                case 1: // direita
                    crack.startX = this.width;
                    crack.startY = Math.random() * this.height;
                    break;
                case 2: // baixo
                    crack.startX = Math.random() * this.width;
                    crack.startY = this.height;
                    break;
                case 3: // esquerda
                    crack.startX = 0;
                    crack.startY = Math.random() * this.height;
                    break;
            }
            
            // Gera segmentos da rachadura
            let currentX = crack.startX;
            let currentY = crack.startY;
            const segments = 3 + Math.floor(damagePercent * 3);
            
            for (let j = 0; j < segments; j++) {
                const angle = Math.random() * Math.PI * 2;
                const length = 5 + Math.random() * 10;
                
                currentX += Math.cos(angle) * length;
                currentY += Math.sin(angle) * length;
                
                currentX = Math.max(0, Math.min(this.width, currentX));
                currentY = Math.max(0, Math.min(this.height, currentY));
                
                crack.segments.push({ x: currentX, y: currentY });
            }
            
            this.cracks.push(crack);
        }
    }

    hit() {
        this.currentHits--;
        this.shake();
        
        // 🎨 Efeito de hit visual
        this.hitFlash = 1.0;
        this.scaleEffect = 1.15;
        
        // ✅ FIX: Gera rachaduras fixas baseadas no dano atual
        if (!this.cracksGenerated && this.currentHits < this.stats.hits) {
            this.generateCracks();
        }
        
        // Cria sparkles no ponto de impacto
        for (let i = 0; i < 5; i++) {
            this.sparkles.push({
                x: this.width / 2,
                y: this.height / 2,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4,
                life: 1.0,
                size: Math.random() * 3 + 1
            });
        }
        
        if (this.currentHits <= 0) {
            this.destroyed = true;
            
            // ✅ STATS: Registra brick destruído
            if (Game.stats) {
                Game.stats.recordBrickDestroyed(this.type);
            }
            
            this.onDestroy();
            return true;
        }
        
        // Feedback visual de dano
        if (Game.particles) {
            Game.particles.emit(
                this.x + this.width / 2, 
                this.y + this.height / 2, 
                8, 
                this.stats.color
            );
        }
        
        return false;
    }

    shake() {
        this.shakeIntensity = 8;
    }

    onDestroy() {
        // Atualiza pontuação e moedas
        Game.data.score += this.stats.points;
        if (Game.economy) {
            Game.economy.addCoins(this.stats.coins);
        }
        
        // Feedback
        if (Game.hud) {
            Game.hud.incrementCombo();
            Game.hud.addNotification(`+${this.stats.points}`, this.stats.color);
        }
        
        // ✅ SOM: Quebra de brick
        if (Game.audio) {
            if (this.type === 'coin') {
                Game.audio.play('coin');
            } else {
                Game.audio.play('brickBreak');
            }
        }
        
        // ✅ POWER-UP: Chance de dropar
        if (Game.powerUpManager) {
            Game.powerUpManager.trySpawnFromBrick(this);
        }
        
        // 🎨 Partículas de destruição mais elaboradas
        if (Game.particles) {
            Game.particles.emit(
                this.x + this.width / 2,
                this.y + this.height / 2,
                25,
                this.stats.color
            );
            
            // Partículas secundárias
            setTimeout(() => {
                if (Game.particles) {
                    Game.particles.emit(
                        this.x + this.width / 2,
                        this.y + this.height / 2,
                        10,
                        '#ffffff'
                    );
                }
            }, 50);
        }
        
        // Efeito especial para tipo explosivo
        if (this.type === 'explosive') {
            this.explode();
        }
    }

    explode() {
        // Efeito visual da explosão principal
        if (Game.particles) {
            Game.particles.emit(
                this.x + this.width / 2,
                this.y + this.height / 2,
                50,
                '#FF6B6B'
            );
        }
        
        // ✅ Previne explosões em cadeia infinitas
        const explosionRadius = 100;
        
        if (!Game.brickManager || !Game.brickManager.bricks) return;
        
        const affectedBricks = [];
        
        Game.brickManager.bricks.forEach(brick => {
            if (brick.destroyed || brick === this) return;
            
            const dx = (brick.x + brick.width / 2) - (this.x + this.width / 2);
            const dy = (brick.y + brick.height / 2) - (this.y + this.height / 2);
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < explosionRadius) {
                affectedBricks.push(brick);
            }
        });
        
        affectedBricks.forEach(brick => {
            brick.currentHits--;
            
            if (brick.currentHits <= 0) {
                brick.destroyed = true;
                Game.data.score += brick.stats.points;
                if (Game.economy) {
                    Game.economy.addCoins(brick.stats.coins);
                }
                if (Game.hud) {
                    Game.hud.incrementCombo();
                }
                // ✅ STATS: Registra kill por explosão
                if (Game.stats) {
                    Game.stats.recordExplosiveKill();
                    Game.stats.recordBrickDestroyed(brick.type);
                }
                if (Game.particles) {
                    Game.particles.emit(
                        brick.x + brick.width / 2,
                        brick.y + brick.height / 2,
                        15,
                        '#FF6B6B'
                    );
                }
            } else {
                if (Game.particles) {
                    Game.particles.emit(
                        brick.x + brick.width / 2,
                        brick.y + brick.height / 2,
                        5,
                        brick.stats.color
                    );
                }
            }
        });
    }

    update() {
        // Shake effect
        if (this.shakeIntensity > 0) {
            this.shakeOffset.x = (Math.random() - 0.5) * this.shakeIntensity;
            this.shakeOffset.y = (Math.random() - 0.5) * this.shakeIntensity;
            this.shakeIntensity *= 0.85;
        } else {
            this.shakeOffset.x = 0;
            this.shakeOffset.y = 0;
        }
        
        // 🎨 ATUALIZAÇÕES DE EFEITOS VISUAIS
        
        // Glow pulse
        this.glowPhase += 0.03;
        
        // Float effect (leve movimento vertical)
        this.floatPhase += 0.02;
        this.floatOffset = Math.sin(this.floatPhase) * 1;
        
        // Hit flash decay
        if (this.hitFlash > 0) {
            this.hitFlash -= 0.05;
        }
        
        // Scale effect return to normal
        if (this.scaleEffect > 1.0) {
            this.scaleEffect -= 0.03;
        } else if (this.scaleEffect < 1.0) {
            this.scaleEffect += 0.03;
        }
        
        // Birth animation
        if (this.birthAnimation > 0) {
            this.birthAnimation -= 0.02;
        }
        
        // Hue shift para tipos especiais
        if (this.type === 'diamond' || this.type === 'coin') {
            this.currentHue = this.baseHue + Math.sin(this.glowPhase) * 20;
        }
        
        // Atualiza sparkles
        for (let i = this.sparkles.length - 1; i >= 0; i--) {
            const s = this.sparkles[i];
            s.x += s.vx;
            s.y += s.vy;
            s.life -= 0.05;
            
            if (s.life <= 0) {
                this.sparkles.splice(i, 1);
            }
        }
    }

    draw() {
        if (this.destroyed) return;
        
        const ctx = Game.ctx;
        
        // Aplica transformações
        const x = this.x + this.shakeOffset.x;
        const y = this.y + this.shakeOffset.y + this.floatOffset;
        
        ctx.save();
        
        // 🎨 ANIMAÇÃO DE NASCIMENTO
        if (this.birthAnimation > 0) {
            const scale = 1 - this.birthAnimation;
            ctx.globalAlpha = 1 - this.birthAnimation;
            ctx.translate(x + this.width / 2, y + this.height / 2);
            ctx.scale(scale, scale);
            ctx.translate(-(x + this.width / 2), -(y + this.height / 2));
        }
        
        // ✅ FIX BUG #8: Visual especial para BOSS
        if (this.isBoss) {
            this.drawBossVisual(ctx, x, y);
        }
        
        // 🎨 BRILHO AMBIENTE
        this.drawAmbientGlow(ctx, x, y);
        
        // 🎨 CORPO PRINCIPAL
        this.drawMainBody(ctx, x, y);
        
        // 🎨 TEXTURAS E DETALHES
        this.drawTypeSpecificDetails(ctx, x, y);
        
        // 🎨 EFEITO DE DANO
        this.drawDamageEffects(ctx, x, y);
        
        // 🎨 BORDAS E HIGHLIGHTS
        this.drawBordersAndHighlights(ctx, x, y);
        
        // 🎨 HIT FLASH
        if (this.hitFlash > 0) {
            this.drawHitFlash(ctx, x, y);
        }
        
        // 🎨 SPARKLES
        this.drawSparkles(ctx, x, y);
        
        ctx.restore();
    }
    
    drawAmbientGlow(ctx, x, y) {
        const glowIntensity = Math.sin(this.glowPhase) * 0.3 + 0.7;
        const glowSize = 15;
        
        ctx.shadowBlur = glowSize * glowIntensity;
        ctx.shadowColor = this.stats.color;
        
        // Glow radial
        const glowGradient = ctx.createRadialGradient(
            x + this.width / 2, y + this.height / 2, 0,
            x + this.width / 2, y + this.height / 2, this.width / 2 + glowSize
        );
        
        glowGradient.addColorStop(0, `${this.stats.color}40`);
        glowGradient.addColorStop(0.7, `${this.stats.color}20`);
        glowGradient.addColorStop(1, `${this.stats.color}00`);
        
        ctx.fillStyle = glowGradient;
        this.roundRect(ctx, x - glowSize/2, y - glowSize/2, 
                      this.width + glowSize, this.height + glowSize, 8);
        ctx.fill();
    }
    
    drawMainBody(ctx, x, y) {
        const healthPercent = this.currentHits / this.stats.hits;
        
        // Gradiente 3D complexo
        const bodyGradient = ctx.createLinearGradient(x, y, x, y + this.height);
        
        const baseColor = this.hexToRgb(this.stats.color);
        const r = baseColor.r, g = baseColor.g, b = baseColor.b;
        
        // Cor mais clara no topo
        bodyGradient.addColorStop(0, `rgb(${Math.min(r + 40, 255)}, ${Math.min(g + 40, 255)}, ${Math.min(b + 40, 255)})`);
        bodyGradient.addColorStop(0.3, this.stats.color);
        bodyGradient.addColorStop(0.7, `rgb(${Math.max(r - 20, 0)}, ${Math.max(g - 20, 0)}, ${Math.max(b - 20, 0)})`);
        bodyGradient.addColorStop(1, this.darkenColor(this.stats.color, 0.4));
        
        ctx.fillStyle = bodyGradient;
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.stats.color;
        
        this.roundRect(ctx, x, y, this.width, this.height, 6);
        ctx.fill();
        ctx.shadowBlur = 0;
        
        // Brilho superior (highlight)
        const highlightGradient = ctx.createLinearGradient(x, y, x, y + this.height * 0.5);
        highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.5)');
        highlightGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.2)');
        highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        ctx.fillStyle = highlightGradient;
        this.roundRect(ctx, x + 2, y + 2, this.width - 4, this.height * 0.5 - 2, 5);
        ctx.fill();
    }
    
    drawTypeSpecificDetails(ctx, x, y) {
        ctx.save();
        
        switch(this.type) {
            case 'metal':
                this.drawMetalEffect(ctx, x, y);
                break;
            case 'diamond':
                this.drawDiamondEffect(ctx, x, y);
                break;
            case 'explosive':
                this.drawExplosiveEffect(ctx, x, y);
                break;
            case 'coin':
                this.drawCoinEffect(ctx, x, y);
                break;
            case 'strong':
                this.drawStrongEffect(ctx, x, y);
                break;
        }
        
        ctx.restore();
    }
    
    drawMetalEffect(ctx, x, y) {
        // Linhas metálicas
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 1;
        
        const lines = 4;
        for (let i = 0; i < lines; i++) {
            const lineY = y + (this.height / (lines + 1)) * (i + 1);
            ctx.beginPath();
            ctx.moveTo(x + 5, lineY);
            ctx.lineTo(x + this.width - 5, lineY);
            ctx.stroke();
        }
        
        // Reflexos metálicos
        const metalShine = ctx.createLinearGradient(x, y, x + this.width, y);
        metalShine.addColorStop(0, 'rgba(255, 255, 255, 0)');
        metalShine.addColorStop(0.5, 'rgba(255, 255, 255, 0.3)');
        metalShine.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        ctx.fillStyle = metalShine;
        ctx.fillRect(x, y + this.height / 2 - 2, this.width, 4);
    }
    
    drawDiamondEffect(ctx, x, y) {
        // Facetas de diamante
        const facets = 6;
        const centerX = x + this.width / 2;
        const centerY = y + this.height / 2;
        const size = Math.min(this.width, this.height) / 3;
        
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 1;
        
        for (let i = 0; i < facets; i++) {
            const angle = (Math.PI * 2 / facets) * i;
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.lineTo(
                centerX + Math.cos(angle) * size,
                centerY + Math.sin(angle) * size
            );
            ctx.stroke();
        }
        
        // Brilho de diamante animado
        const sparkle = Math.sin(this.glowPhase * 2) * 0.5 + 0.5;
        ctx.fillStyle = `rgba(255, 255, 255, ${sparkle * 0.3})`;
        ctx.beginPath();
        ctx.arc(centerX, centerY, size / 2, 0, Math.PI * 2);
        ctx.fill();
    }
    
    drawExplosiveEffect(ctx, x, y) {
        // Símbolo de perigo
        const pulse = Math.sin(this.glowPhase * 3) * 0.5 + 0.5;
        
        ctx.save();
        ctx.globalAlpha = pulse * 0.8;
        ctx.fillStyle = '#FF0000';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#FF0000';
        
        const centerX = x + this.width / 2;
        const centerY = y + this.height / 2;
        
        // Triângulo de aviso
        ctx.beginPath();
        ctx.moveTo(centerX, centerY - 5);
        ctx.lineTo(centerX - 4, centerY + 3);
        ctx.lineTo(centerX + 4, centerY + 3);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        ctx.restore();
        
        // Ondas de energia
        ctx.strokeStyle = `rgba(255, 0, 0, ${pulse * 0.4})`;
        ctx.lineWidth = 2;
        ctx.shadowBlur = 8;
        ctx.shadowColor = '#FF6B6B';
        
        this.roundRect(ctx, x + 3, y + 3, this.width - 6, this.height - 6, 4);
        ctx.stroke();
        ctx.shadowBlur = 0;
    }
    
    drawCoinEffect(ctx, x, y) {
        // Símbolo de moeda
        const centerX = x + this.width / 2;
        const centerY = y + this.height / 2;
        
        // Círculo dourado
        const coinGlow = Math.sin(this.glowPhase * 2) * 0.3 + 0.7;
        
        ctx.fillStyle = `rgba(255, 215, 0, ${coinGlow * 0.4})`;
        ctx.shadowBlur = 12;
        ctx.shadowColor = '#FFD700';
        
        ctx.beginPath();
        ctx.arc(centerX, centerY, 6, 0, Math.PI * 2);
        ctx.fill();
        
        // Símbolo $
        ctx.fillStyle = '#FFA500';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('$', centerX, centerY);
        
        ctx.shadowBlur = 0;
    }
    
    drawStrongEffect(ctx, x, y) {
        // Padrão de grade
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.lineWidth = 1;
        
        const gridSize = 8;
        
        // Linhas verticais
        for (let i = 1; i < this.width / gridSize; i++) {
            ctx.beginPath();
            ctx.moveTo(x + i * gridSize, y);
            ctx.lineTo(x + i * gridSize, y + this.height);
            ctx.stroke();
        }
        
        // Linhas horizontais
        for (let i = 1; i < this.height / gridSize; i++) {
            ctx.beginPath();
            ctx.moveTo(x, y + i * gridSize);
            ctx.lineTo(x + this.width, y + i * gridSize);
            ctx.stroke();
        }
    }
    
    drawDamageEffects(ctx, x, y) {
        const healthPercent = this.currentHits / this.stats.hits;
        const damagePercent = 1 - healthPercent;
        
        if (damagePercent <= 0) return;
        
        // Rachaduras
        this.drawCracks(ctx, x, y, damagePercent);
        
        // Escurecimento
        ctx.fillStyle = `rgba(0, 0, 0, ${damagePercent * 0.3})`;
        this.roundRect(ctx, x, y, this.width, this.height, 6);
        ctx.fill();
    }
    
    drawCracks(ctx, x, y, damagePercent) {
        // ✅ FIX: Desenha rachaduras pré-geradas (sem randomização a cada frame)
        if (this.cracks.length === 0) return;
        
        ctx.save();
        ctx.strokeStyle = `rgba(0, 0, 0, ${damagePercent * 0.8})`;
        ctx.lineWidth = Math.max(1, damagePercent * 2);
        ctx.shadowBlur = 2;
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        
        // Desenha cada rachadura pré-gerada
        this.cracks.forEach(crack => {
            ctx.beginPath();
            ctx.moveTo(x + crack.startX, y + crack.startY);
            
            crack.segments.forEach(segment => {
                ctx.lineTo(x + segment.x, y + segment.y);
            });
            
            ctx.stroke();
        });
        
        ctx.restore();
    }
    
    drawBordersAndHighlights(ctx, x, y) {
        // Borda externa
        ctx.strokeStyle = this.darkenColor(this.stats.color, 0.5);
        ctx.lineWidth = 2;
        this.roundRect(ctx, x, y, this.width, this.height, 6);
        ctx.stroke();
        
        // Borda interna brilhante
        const borderPulse = Math.sin(this.glowPhase) * 0.2 + 0.3;
        ctx.strokeStyle = `rgba(255, 255, 255, ${borderPulse})`;
        ctx.lineWidth = 1;
        this.roundRect(ctx, x + 1.5, y + 1.5, this.width - 3, this.height - 3, 5);
        ctx.stroke();
    }
    
    drawHitFlash(ctx, x, y) {
        ctx.save();
        ctx.globalAlpha = this.hitFlash * 0.7;
        ctx.fillStyle = '#FFFFFF';
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#FFFFFF';
        
        this.roundRect(ctx, x, y, this.width, this.height, 6);
        ctx.fill();
        
        ctx.restore();
    }
    
    drawSparkles(ctx, x, y) {
        this.sparkles.forEach(s => {
            ctx.save();
            ctx.globalAlpha = s.life;
            
            const sparkleGradient = ctx.createRadialGradient(
                x + s.x, y + s.y, 0,
                x + s.x, y + s.y, s.size
            );
            sparkleGradient.addColorStop(0, '#FFFFFF');
            sparkleGradient.addColorStop(1, this.stats.color);
            
            ctx.fillStyle = sparkleGradient;
            ctx.beginPath();
            ctx.arc(x + s.x, y + s.y, s.size, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.restore();
        });
    }
    
    // ✅ FIX BUG #8: Visual especial para boss
    drawBossVisual(ctx, x, y) {
        const pulse = Math.sin(Date.now() / 300) * 0.3 + 0.7;
        
        // Aura vermelha pulsante
        ctx.save();
        ctx.globalAlpha = pulse * 0.4;
        ctx.shadowBlur = 40;
        ctx.shadowColor = '#FF0000';
        ctx.fillStyle = 'rgba(255, 0, 0, 0.2)';
        this.roundRect(ctx, x - 5, y - 5, this.width + 10, this.height + 10, 10);
        ctx.fill();
        ctx.restore();
        
        // Raios ao redor
        ctx.save();
        ctx.strokeStyle = `rgba(255, 0, 0, ${pulse * 0.6})`;
        ctx.lineWidth = 2;
        for (let i = 0; i < 4; i++) {
            const angle = (i * Math.PI / 2) + (Date.now() / 500);
            const dist = 15;
            const x1 = x + this.width / 2 + Math.cos(angle) * dist;
            const y1 = y + this.height / 2 + Math.sin(angle) * dist;
            const x2 = x + this.width / 2 + Math.cos(angle) * (dist + 10);
            const y2 = y + this.height / 2 + Math.sin(angle) * (dist + 10);
            
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
        }
        ctx.restore();
        
        // Texto "BOSS"
        ctx.save();
        ctx.fillStyle = '#FF0000';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.shadowBlur = 5;
        ctx.shadowColor = '#FF0000';
        ctx.fillText('👾 BOSS', x + this.width / 2, y - 10);
        ctx.restore();
        
        // Barra de vida do boss
        if (this.stats && this.currentHits && this.stats.hits) {
            const healthPercent = this.currentHits / this.stats.hits;
            const barWidth = this.width - 4;
            const barHeight = 4;
            
            // Background
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(x + 2, y - 8, barWidth, barHeight);
            
            // Health bar
            ctx.fillStyle = healthPercent > 0.5 ? '#00FF00' : 
                           healthPercent > 0.25 ? '#FFD700' : '#FF0000';
            ctx.fillRect(x + 2, y - 8, barWidth * healthPercent, barHeight);
            
            // Border
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1;
            ctx.strokeRect(x + 2, y - 8, barWidth, barHeight);
        }
    }
    
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : {r: 0, g: 0, b: 0};
    }
    
    darkenColor(hex, percent) {
        const rgb = this.hexToRgb(hex);
        return `rgb(${Math.floor(rgb.r * (1 - percent))}, ${Math.floor(rgb.g * (1 - percent))}, ${Math.floor(rgb.b * (1 - percent))})`;
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
}

// BrickManager permanece igual
class BrickManager {
    constructor() {
        this.bricks = [];
        this.patterns = this.createPatterns();
        this.levelCompleting = false;  // ✅ FIX: Previne múltiplas chamadas de onLevelComplete
    }

    createPatterns() {
        return {
            1: { rows: 4, types: ['normal', 'normal', 'strong', 'metal'], holes: 0.05 },
            2: { rows: 5, types: ['normal', 'strong', 'strong', 'metal'], holes: 0.08 },
            3: { rows: 5, types: ['normal', 'strong', 'coin', 'metal'], holes: 0.1 },
            4: { rows: 6, types: ['strong', 'strong', 'metal', 'diamond'], holes: 0.12 },
            5: { rows: 6, types: ['strong', 'metal', 'diamond', 'explosive'], holes: 0.1 },
            6: { rows: 7, types: ['metal', 'metal', 'diamond', 'explosive'], holes: 0.15 }
        };
    }

    loadLevel(level) {
        this.bricks = [];
        this.levelCompleting = false;
        
        // ✅ USA GERADOR PROCEDURAL
        if (Game.levelGenerator) {
            console.log(`📦 Carregando nível ${level} procedural...`);
            const layout = Game.levelGenerator.generate(level);
            
            // Calcula posições dos bricks
            const cols = 10;
            const totalWidth = cols * (CONFIG.BRICKS.WIDTH + CONFIG.BRICKS.PADDING);
            const offsetX = (Game.width - totalWidth) / 2;
            
            layout.forEach(brickData => {
                const x = brickData.col * (CONFIG.BRICKS.WIDTH + CONFIG.BRICKS.PADDING) + offsetX;
                const y = brickData.row * (CONFIG.BRICKS.HEIGHT + CONFIG.BRICKS.PADDING) + CONFIG.BRICKS.OFFSET_TOP;
                
                const brick = new Brick(x, y, brickData.type);
                
                // Boss brick especial
                if (brickData.isBoss) {
                    brick.isBoss = true;
                    brick.currentHits = brickData.bossHealth;
                    brick.stats.hits = brickData.bossHealth;
                }
                
                this.bricks.push(brick);
            });
            
            // Notifica início de nível boss
            if (level % 10 === 0) {
                if (Game.hud) {
                    Game.hud.addNotification('👾 BOSS LEVEL!', '#FF0000', 3);
                }
                if (Game.stats) {
                    Game.stats.recordBossAttempt();
                }
            }
            
            // Registra início de nível nas estatísticas
            if (Game.stats) {
                Game.stats.startLevel(level);
            }
            
        } else {
            // Fallback para padrão antigo se não tiver gerador
            console.warn('⚠️ LevelGenerator não encontrado, usando padrão antigo');
            this.loadLevelOldWay(level);
        }
    }
    
    // Método antigo como fallback
    loadLevelOldWay(level) {
        const patternKey = Math.min(level, 5);
        const pattern = this.patterns[patternKey] || this.patterns[5];
        
        const rows = pattern.rows;
        const cols = 8;
        const totalWidth = cols * (CONFIG.BRICKS.WIDTH + CONFIG.BRICKS.PADDING);
        const offsetX = (Game.width - totalWidth) / 2;
        
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (Math.random() < pattern.holes) continue;
                
                let type = pattern.types[Math.min(r, pattern.types.length - 1)];
                
                if (Math.random() > 0.9 && level > 2) {
                    type = Math.random() > 0.5 ? 'coin' : 'explosive';
                }
                
                const x = c * (CONFIG.BRICKS.WIDTH + CONFIG.BRICKS.PADDING) + offsetX;
                const y = r * (CONFIG.BRICKS.HEIGHT + CONFIG.BRICKS.PADDING) + CONFIG.BRICKS.OFFSET_TOP;
                
                this.bricks.push(new Brick(x, y, type));
            }
        }
    }

    checkCollision(ball) {
        if (!ball.active) return;
        
        const potentialBricks = this.bricks.filter(brick => {
            if (brick.destroyed) return false;
            
            const dx = Math.abs((brick.x + brick.width / 2) - ball.x);
            const dy = Math.abs((brick.y + brick.height / 2) - ball.y);
            
            return dx < brick.width + ball.radius * 2 && 
                   dy < brick.height + ball.radius * 2;
        });
        
        // ✅ FIX PERFORMANCE: Early exit se não há colisões possíveis
        if (potentialBricks.length === 0) return;
        
        // ✅ FIX BUG #4: Se fireball ativo, destrói todos sem inverter direção
        if (ball.fireball) {
            for (let brick of potentialBricks) {
                if (ball.checkCollisionRect(brick)) {
                    brick.hit();
                    // NÃO quebra o loop - continua destruindo todos no caminho
                }
            }
            return; // Não inverte direção da bola
        }
        
        // Colisão normal (inverte direção)
        for (let brick of potentialBricks) {
            if (ball.checkCollisionRect(brick)) {
                const ballCenterX = ball.x;
                const ballCenterY = ball.y;
                const brickCenterX = brick.x + brick.width / 2;
                const brickCenterY = brick.y + brick.height / 2;
                
                const dx = ballCenterX - brickCenterX;
                const dy = ballCenterY - brickCenterY;
                
                if (Math.abs(dx / brick.width) > Math.abs(dy / brick.height)) {
                    ball.speedX *= -1;
                    ball.x = dx > 0 ? brick.x + brick.width + ball.radius : brick.x - ball.radius;
                } else {
                    ball.speedY *= -1;
                    ball.y = dy > 0 ? brick.y + brick.height + ball.radius : brick.y - ball.radius;
                }
                
                brick.hit();
                break;
            }
        }
    }

    update() {
        // ✅ FIX: Se já está completando level, não executa update
        if (this.levelCompleting) {
            return;
        }
        
        this.bricks.forEach(brick => brick.update());
        
        const activeBricks = this.bricks.filter(b => !b.destroyed);
        
        // ✅ FIX: Adiciona verificação da flag
        if (activeBricks.length === 0 && this.bricks.length > 0 && !this.levelCompleting) {
            this.onLevelComplete();
        }
    }

    onLevelComplete() {
        // ✅ FIX: Marca que está processando level complete
        this.levelCompleting = true;
        
        const currentLevel = Game.data.level;
        Game.data.level++;
        
        const bonus = 100 * currentLevel;
        Game.data.score += bonus;
        Game.economy.addCoins(Math.floor(bonus / 10));
        
        // ✅ STATS: Registra level completo
        if (Game.stats) {
            Game.stats.recordLevelComplete();
            
            // Boss derrotado?
            if (currentLevel % 10 === 0) {
                Game.stats.recordBossDefeated();
            }
        }
        
        // ✅ CONQUISTAS: Verifica
        if (Game.achievements) {
            Game.achievements.check();
        }
        
        // ✅ SOM: Level complete
        if (Game.audio) {
            Game.audio.play('levelComplete');
        }
        
        if (Game.hud) {
            Game.hud.addNotification(`NÍVEL ${currentLevel} COMPLETO!`, '#00d2ff', 2);
            Game.hud.addNotification(`BÔNUS +${bonus}`, '#FFD700', 2);
        }
        
        Game.particles.emit(Game.width / 2, Game.height / 2, 50, '#FFD700');
        
        setTimeout(() => {
            this.loadLevel(Game.data.level);
            Game.ball.reset();
            this.levelCompleting = false;
        }, 2000);
    }

    draw() {
        this.bricks.forEach(brick => brick.draw());
    }

    getActiveBricksCount() {
        return this.bricks.filter(b => !b.destroyed).length;
    }
}
