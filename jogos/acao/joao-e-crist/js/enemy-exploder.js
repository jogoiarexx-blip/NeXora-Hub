/**
 * ENEMY-EXPLODER.JS
 * Inimigo bomba - explode ao morrer causando dano em área
 */

class ExploderEnemy extends Enemy {
    constructor(x, y) {
        super(x, y, 'basic');
        
        // Sobrescrever tipo e stats
        this.type = 'exploder';
        this.name = 'Exploder';
        this.life = 30;
        this.maxLife = 30;
        this.speed = 3;
        this.damage = 10;
        this.color = '#e67e22';
        this.secondaryColor = '#d35400';
        this.score = 150;
        this.w = 45;
        this.h = 65;
        
        // ✅ HITBOX PADRONIZADA - Sistema unificado
        this.hitbox = {
            offsetX: Math.floor(this.w * 0.15),  // 15% de margem lateral
            offsetY: Math.floor(this.h * 0.25),  // 25% do topo (cabeça)
            width: Math.floor(this.w * 0.70),    // 70% da largura (corpo)
            height: Math.floor(this.h * 0.65)    // 65% da altura (torso+pernas)
        };
        
        console.log('✅ Exploder hitbox:', `${this.hitbox.width}×${this.hitbox.height}`);
        
        // Específico do exploder
        this.explosionRadius = 180;
        this.explosionDamage = 50;
        this.fuseTimer = 0;
        this.fuseActive = false;
        this.fuseDuration = 90;  // 1.5 segundos até explodir
        this.exploded = false;
        this.activationRange = 100;  // Distância para ativar pavio
        
        // ✅ VALIDAÇÃO: Re-calcular Y se mudou altura (depois de super e alterações)
        if (this.groundY) {
            this.y = this.groundY - this.h;
        }
    }
    
    /**
     * Update com IA suicida
     */
    update(players, otherEnemies = []) {
        // Se já explodiu, apenas animar morte
        if (this.exploded || this.life <= 0) {
            if (!this.exploded && this.life <= 0) {
                this.explode();
            }
            this.deathAnim = Math.min(this.deathAnim + 1, 30);
            return;
        }
        
        // Validação
        if (!players || players.length === 0) return;
        
        const alivePlayers = players.filter(p => p.life > 0);
        if (alivePlayers.length === 0) return;
        
        // Ativar pavio se player muito próximo
        if (!this.fuseActive) {
            const nearPlayer = alivePlayers.some(p => this.distanceTo(p) < this.activationRange);
            
            if (nearPlayer) {
                this.activateFuse();
            }
        }
        
        // Contar regressiva do pavio
        if (this.fuseActive) {
            this.fuseTimer--;
            
            // Piscar cada vez mais rápido
            const blinkSpeed = Math.max(3, Math.floor(this.fuseTimer / 6));
            if (this.fuseTimer % blinkSpeed === 0) {
                this.color = this.color === '#e67e22' ? '#ff0000' : '#e67e22';
            }
            
            // Criar partículas de faísca
            if (this.fuseTimer % 5 === 0 && window.particles) {
                window.particles.push({
                    x: this.x + this.w/2,
                    y: this.y,
                    vx: (Math.random() - 0.5) * 2,
                    vy: -Math.random() * 3 - 1,
                    life: 20,
                    maxLife: 20,
                    color: this.fuseTimer > 30 ? '#ff9900' : '#ff0000',
                    size: 4
                });
            }
            
            // Tempo esgotou - EXPLODIR!
            if (this.fuseTimer <= 0) {
                this.life = 0;  // Força explosão
                return;
            }
            
            // Correr em direção aos jogadores mais rápido
            const nearest = this.getNearestPlayer(alivePlayers);
            const dx = nearest.x - this.x;
            if (Math.abs(dx) > 10) {
                this.x += Math.sign(dx) * (this.speed * 1.5);  // 50% mais rápido
                this.walkCycle += 0.4;
            }
            this.facingRight = dx > 0;
        } else {
            // Comportamento normal quando pavio inativo
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
     * Ativar pavio
     */
    activateFuse() {
        this.fuseActive = true;
        this.fuseTimer = this.fuseDuration;
        this.aiState = 'exploding';
        
        // Som de pavio
        if (window.soundSystem) {
            window.soundSystem.playSound('fuse');
        }
        
        // Efeito visual de ativação
        if (window.particles) {
            for (let i = 0; i < 10; i++) {
                window.particles.push({
                    x: this.x + this.w/2,
                    y: this.y,
                    vx: (Math.random() - 0.5) * 4,
                    vy: -Math.random() * 6 - 2,
                    life: 30,
                    maxLife: 30,
                    color: '#ff6b00',
                    size: 6
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
     * Executar explosão
     */
    explode() {
        if (this.exploded) return;
        this.exploded = true;
        
        const centerX = this.x + this.w / 2;
        const centerY = this.y + this.h / 2;
        
        // Dano em jogadores próximos
        if (window.players) {
            window.players.forEach(player => {
                if (player.life <= 0) return;
                
                const dist = this.distanceTo(player);
                if (dist < this.explosionRadius) {
                    // Dano decai com distância
                    const damageFalloff = 1 - (dist / this.explosionRadius);
                    const damage = Math.floor(this.explosionDamage * damageFalloff);
                    
                    player.takeDamage(damage);
                    
                    // Knockback FORTE
                    const angle = Math.atan2(
                        (player.y + player.h/2) - centerY,
                        (player.x + player.w/2) - centerX
                    );
                    
                    const knockbackPower = 15 * damageFalloff;
                    if (player.vx !== undefined) {
                        player.vx = Math.cos(angle) * knockbackPower;
                    }
                    if (player.vy !== undefined) {
                        player.vy = Math.sin(angle) * knockbackPower - 8;
                    }
                }
            });
        }
        
        // EFEITO VISUAL REFEITO v5.5: explosão forte, mas legível e curta.
        // O Exploder continua sendo especial sem cobrir a tela com centenas de partículas.
        if (window.particles) {
            const colors = ['#ffd166', '#f28c28', '#c94c32'];
            const rays = 18;
            for (let i = 0; i < rays; i++) {
                const angle = (Math.PI * 2 * i) / rays;
                const speed = 4 + (i % 4) * 0.7;
                window.particles.push({
                    x: centerX, y: centerY,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed - 1.5,
                    life: 30 + (i % 8), maxLife: 38,
                    color: colors[i % colors.length],
                    size: 3 + (i % 3), type: 'spark'
                });
            }
            // Pouca fumaça escura, separada das faíscas.
            for (let i = 0; i < 7; i++) {
                const angle = (Math.PI * 2 * i) / 7;
                window.particles.push({
                    x: centerX + Math.cos(angle) * 8,
                    y: centerY + Math.sin(angle) * 5,
                    vx: Math.cos(angle) * 0.7,
                    vy: -1.4 - (i % 3) * 0.25,
                    life: 38 + i * 2, maxLife: 52,
                    color: i % 2 ? '#4b4542' : '#625a54',
                    size: 5 + (i % 3)
                });
            }
            if (window.particles.createText) {
                window.particles.createText(centerX, centerY - 35, 'BOOM!', '#ffd166', { size: 25, maxLife: 40 });
            }
        }
        
        // Screen shake MUITO intenso
        if (window.screenShake !== undefined) {
            window.screenShake = Math.max(window.screenShake || 0, 6);
        }
        
        // Hit stop para freeze frame dramático
        if (window.hitStopFrames !== undefined) {
            window.hitStopFrames = 4;
        }
        
        // Som de explosão
        if (window.soundSystem) {
            window.soundSystem.playSound('explosion');
        }
    }
    
    /**
     * Desenho com indicadores visuais ÉPICOS
     */
    draw(ctx) {
        // Desenho base
        super.draw(ctx);
        
        const centerX = this.x + this.w / 2;
        const centerY = this.y + this.h / 2;
        
        // Indicador de bomba
        if (this.life > 0) {
            ctx.save();
            
            // Pavio/fusível visual quando ativado
            if (this.fuseActive) {
                const pulseSize = Math.sin(Date.now() * 0.01) * 5;
                const intensity = 1 - (this.fuseTimer / this.fuseDuration);
                
                // AURA PULSANTE VERMELHA ao redor
                const auraRadius = 30 + pulseSize + intensity * 20;
                const auraGrad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, auraRadius);
                auraGrad.addColorStop(0, 'rgba(255, 0, 0, 0)');
                auraGrad.addColorStop(0.7, `rgba(255, 0, 0, ${0.2 * intensity})`);
                auraGrad.addColorStop(1, 'rgba(255, 0, 0, 0)');
                ctx.fillStyle = auraGrad;
                ctx.beginPath();
                ctx.arc(centerX, centerY, auraRadius, 0, Math.PI * 2);
                ctx.fill();
                
                // Brilho pulsante vermelho (contorno)
                ctx.strokeStyle = `rgba(255, 0, 0, ${0.5 + intensity * 0.5})`;
                ctx.lineWidth = 4 + pulseSize;
                ctx.shadowBlur = 20 + pulseSize * 2;
                ctx.shadowColor = '#ff0000';
                ctx.strokeRect(
                    this.x - pulseSize,
                    this.y - pulseSize,
                    this.w + pulseSize * 2,
                    this.h + pulseSize * 2
                );
                ctx.shadowBlur = 0;
                
                // ONDAS DE CHOQUE VISUAIS (quando próximo de explodir)
                if (intensity > 0.6) {
                    const waveCount = 3;
                    for (let i = 0; i < waveCount; i++) {
                        const waveTime = (Date.now() * 0.005 + i * (Math.PI * 2 / waveCount)) % (Math.PI * 2);
                        const waveRadius = Math.max(5, 20 + Math.sin(waveTime) * 30);  // PATCH: Garantir mínimo de 5
                        const waveAlpha = (1 - Math.abs(Math.sin(waveTime))) * 0.3 * intensity;
                        
                        ctx.strokeStyle = `rgba(255, 100, 0, ${waveAlpha})`;
                        ctx.lineWidth = 3;
                        ctx.beginPath();
                        ctx.arc(centerX, centerY, waveRadius, 0, Math.PI * 2);
                        ctx.stroke();
                    }
                }
                
                // CONTADOR REGRESSIVO gigante
                const seconds = Math.ceil(this.fuseTimer / 60);
                const counterSize = 24 + pulseSize;
                
                // Sombra do texto
                ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
                ctx.font = `bold ${counterSize}px Impact`;
                ctx.textAlign = 'center';
                ctx.fillText(seconds, centerX + 2, this.y - 23);
                
                // Texto principal
                ctx.fillStyle = seconds <= 1 ? '#ff0000' : '#fff';
                ctx.font = `bold ${counterSize}px Impact`;
                ctx.shadowBlur = 15;
                ctx.shadowColor = seconds <= 1 ? '#ff0000' : '#ffff00';
                ctx.fillText(seconds, centerX, this.y - 25);
                ctx.shadowBlur = 0;
                
                // Borda do contador
                ctx.strokeStyle = '#000';
                ctx.lineWidth = 3;
                ctx.strokeText(seconds, centerX, this.y - 25);
                
                // TEXTO DE ALERTA - DANGER!
                if (this.fuseTimer < 30) {
                    const dangerPulse = Math.sin(Date.now() * 0.02) * 0.3 + 0.7;
                    ctx.fillStyle = `rgba(255, 0, 0, ${dangerPulse})`;
                    ctx.font = 'bold 14px Impact';
                    ctx.shadowBlur = 10;
                    ctx.shadowColor = '#ff0000';
                    ctx.fillText('DANGER!', centerX, this.y - 45);
                    
                    // Símbolos de alerta piscando
                    ctx.fillText('⚠️', centerX - 30, this.y - 45);
                    ctx.fillText('⚠️', centerX + 30, this.y - 45);
                    ctx.shadowBlur = 0;
                }
                
                // Indicador de progresso da explosão (barra)
                const barWidth = 40;
                const barHeight = 4;
                const barX = centerX - barWidth / 2;
                const barY = this.y - 55;
                
                // Fundo da barra
                ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
                ctx.fillRect(barX, barY, barWidth, barHeight);
                
                // Progresso da barra
                const progress = 1 - (this.fuseTimer / this.fuseDuration);
                const barGrad = ctx.createLinearGradient(barX, barY, barX + barWidth * progress, barY);
                barGrad.addColorStop(0, '#ffff00');
                barGrad.addColorStop(0.5, '#ff6b00');
                barGrad.addColorStop(1, '#ff0000');
                ctx.fillStyle = barGrad;
                ctx.fillRect(barX, barY, barWidth * progress, barHeight);
                
                // Borda da barra
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 1;
                ctx.strokeRect(barX, barY, barWidth, barHeight);
                
            } else {
                // Símbolo de bomba quando inativo (mais detalhado)
                const bobbing = Math.sin(Date.now() * 0.003) * 2;
                
                // Sombra do emoji
                ctx.shadowBlur = 5;
                ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
                ctx.fillStyle = '#ff6b00';
                ctx.font = 'bold 24px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('💣', centerX + 1, this.y - 8 + bobbing + 1);
                
                // Emoji principal
                ctx.shadowBlur = 8;
                ctx.shadowColor = '#ff6b00';
                ctx.fillText('💣', centerX, this.y - 8 + bobbing);
                ctx.shadowBlur = 0;
                
                // Texto "EXPLOSIVO"
                ctx.fillStyle = '#ff6b00';
                ctx.font = 'bold 8px Arial';
                ctx.fillText('EXPLOSIVE', centerX, this.y - 25);
            }
            
            ctx.restore();
        }
        
        // RAIO DE EXPLOSÃO (quando ativado)
        if (this.fuseActive && this.fuseTimer < 90) {
            ctx.save();
            const radiusProgress = 1 - (this.fuseTimer / 90);
            const alpha = 0.1 + radiusProgress * 0.3;
            
            // Círculo externo (área de perigo)
            ctx.strokeStyle = `rgba(255, 0, 0, ${alpha})`;
            ctx.lineWidth = 3;
            ctx.setLineDash([10, 10]);
            ctx.beginPath();
            ctx.arc(centerX, centerY, this.explosionRadius, 0, Math.PI * 2);
            ctx.stroke();
            
            // Círculo interno (centro da explosão)
            ctx.strokeStyle = `rgba(255, 100, 0, ${alpha * 1.5})`;
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.arc(centerX, centerY, this.explosionRadius * 0.5, 0, Math.PI * 2);
            ctx.stroke();
            
            // Linhas radiais (indicadores de direção)
            ctx.strokeStyle = `rgba(255, 50, 0, ${alpha * 0.5})`;
            ctx.lineWidth = 1;
            ctx.setLineDash([]);
            for (let i = 0; i < 8; i++) {
                const angle = (Math.PI * 2 * i) / 8;
                ctx.beginPath();
                ctx.moveTo(centerX, centerY);
                ctx.lineTo(
                    centerX + Math.cos(angle) * this.explosionRadius,
                    centerY + Math.sin(angle) * this.explosionRadius
                );
                ctx.stroke();
            }
            
            // Texto "BLAST RADIUS" na borda
            if (this.fuseTimer < 60) {
                ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
                ctx.font = 'bold 10px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('BLAST RADIUS', centerX, centerY - this.explosionRadius - 5);
            }
            
            ctx.restore();
        }
        
        // PARTÍCULAS AMBIENTE quando pavio ativo
        if (this.fuseActive && Math.random() > 0.7 && window.particles) {
            const angleRandom = Math.random() * Math.PI * 2;
            const distRandom = Math.random() * 20;
            window.particles.push({
                x: centerX + Math.cos(angleRandom) * distRandom,
                y: centerY + Math.sin(angleRandom) * distRandom,
                vx: (Math.random() - 0.5) * 2,
                vy: -Math.random() * 3 - 1,
                life: 15 + Math.random() * 15,
                maxLife: 30,
                color: Math.random() > 0.5 ? '#ff6b00' : '#ff0000',
                size: 2 + Math.random() * 2
            });
        }
    }
    
    /**
     * Sobrescrever drawBody para visual ÉPICO de exploder
     */
    drawBody(ctx) {
        const centerX = this.x + this.w / 2;
        const centerY = this.y + this.h / 2;
        
        // SOMBRA DINÂMICA (cresce quando perto de explodir)
        const shadowSize = this.fuseActive ? 1 + (1 - this.fuseTimer / this.fuseDuration) * 0.5 : 1;
        ctx.fillStyle = `rgba(0, 0, 0, ${0.3 * shadowSize})`;
        ctx.beginPath();
        ctx.ellipse(centerX, this.y + this.h + 5, (this.w / 2) * shadowSize, 8 * shadowSize, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // CORPO com gradiente explosivo
        const bodyGradient = ctx.createLinearGradient(this.x, this.y + 20, this.x, this.y + this.h);
        if (this.fuseActive) {
            const intensity = 1 - (this.fuseTimer / this.fuseDuration);
            bodyGradient.addColorStop(0, intensity > 0.7 ? '#ff0000' : '#ff6b00');
            bodyGradient.addColorStop(0.5, '#ff4500');
            bodyGradient.addColorStop(1, intensity > 0.5 ? '#ff0000' : '#d35400');
        } else {
            bodyGradient.addColorStop(0, this.color);
            bodyGradient.addColorStop(0.5, '#d35400');
            bodyGradient.addColorStop(1, this.secondaryColor);
        }
        
        ctx.save();
        ctx.fillStyle = bodyGradient;
        
        // Brilho pulsante quando ativado
        if (this.fuseActive) {
            const pulse = Math.sin(Date.now() * 0.01) * 10;
            ctx.shadowBlur = 15 + pulse;
            ctx.shadowColor = '#ff0000';
        }
        
        ctx.fillRect(this.x + 8, this.y + 20, this.w - 16, this.h - 25);
        ctx.restore();
        
        // COLETE DE DINAMITES (agora com 5 dinamites em 2 fileiras)
        const dynamitePositions = [
            {x: this.x + 10, y: this.y + 28},  // Linha superior
            {x: this.x + 18, y: this.y + 28},
            {x: this.x + 26, y: this.y + 28},
            {x: this.x + 14, y: this.y + 40},  // Linha inferior
            {x: this.x + 22, y: this.y + 40}
        ];
        
        dynamitePositions.forEach((pos, i) => {
            // Corpo da dinamite com gradiente
            const dynamiteGrad = ctx.createLinearGradient(pos.x, pos.y, pos.x, pos.y + 18);
            dynamiteGrad.addColorStop(0, '#a0522d');
            dynamiteGrad.addColorStop(0.5, '#8B4513');
            dynamiteGrad.addColorStop(1, '#654321');
            ctx.fillStyle = dynamiteGrad;
            ctx.fillRect(pos.x, pos.y, 6, 18);
            
            // Borda da dinamite
            ctx.strokeStyle = '#654321';
            ctx.lineWidth = 1;
            ctx.strokeRect(pos.x, pos.y, 6, 18);
            
            // Faixas da dinamite
            ctx.fillStyle = '#2c1810';
            ctx.fillRect(pos.x, pos.y + 4, 6, 2);
            ctx.fillRect(pos.x, pos.y + 12, 6, 2);
            
            // PAVIO de cada dinamite
            if (this.fuseActive) {
                const fuseProgress = 1 - (this.fuseTimer / this.fuseDuration);
                const fuseLength = 8 + Math.sin(Date.now() * 0.02 + i) * 2;
                
                // Pavio animado (treme)
                ctx.strokeStyle = fuseProgress > 0.7 ? '#ff0000' : '#333';
                ctx.lineWidth = 2.5;
                ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.moveTo(pos.x + 3, pos.y);
                
                // Pavio com curva
                const fuseWiggle = Math.sin(Date.now() * 0.05 + i) * 2;
                ctx.quadraticCurveTo(
                    pos.x + 3 + fuseWiggle, 
                    pos.y - fuseLength/2,
                    pos.x + 3, 
                    pos.y - fuseLength
                );
                ctx.stroke();
                
                // FAÍSCA animada na ponta do pavio
                const sparkTime = Date.now() * 0.01 + i;
                const sparkIntensity = Math.sin(sparkTime) * 0.5 + 0.5;
                const sparkSize = 2 + sparkIntensity * 3;
                
                // Brilho da faísca
                const sparkGrad = ctx.createRadialGradient(
                    pos.x + 3, pos.y - fuseLength, 0,
                    pos.x + 3, pos.y - fuseLength, sparkSize * 2
                );
                sparkGrad.addColorStop(0, fuseProgress > 0.7 ? '#ffff00' : '#ff6b00');
                sparkGrad.addColorStop(0.5, fuseProgress > 0.7 ? '#ff4500' : '#ff9900');
                sparkGrad.addColorStop(1, 'rgba(255, 0, 0, 0)');
                
                ctx.fillStyle = sparkGrad;
                ctx.beginPath();
                ctx.arc(pos.x + 3, pos.y - fuseLength, sparkSize * 2, 0, Math.PI * 2);
                ctx.fill();
                
                // Núcleo brilhante da faísca
                ctx.fillStyle = '#ffff00';
                ctx.beginPath();
                ctx.arc(pos.x + 3, pos.y - fuseLength, sparkSize, 0, Math.PI * 2);
                ctx.fill();
                
                // Partículas de fumaça do pavio (menos frequente)
                if (Math.random() > 0.9 && window.particles) {
                    window.particles.push({
                        x: pos.x + 3,
                        y: pos.y - fuseLength,
                        vx: (Math.random() - 0.5) * 0.5,
                        vy: -1 - Math.random() * 0.5,
                        life: 20,
                        maxLife: 20,
                        color: '#666',
                        size: 2
                    });
                }
            }
        });
        
        // CINTOS DE SEGURANÇA cruzados
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        
        // Cinto diagonal esquerda
        ctx.beginPath();
        ctx.moveTo(this.x + 8, this.y + 25);
        ctx.lineTo(this.x + this.w - 8, this.y + 50);
        ctx.stroke();
        
        // Cinto diagonal direita
        ctx.beginPath();
        ctx.moveTo(this.x + this.w - 8, this.y + 25);
        ctx.lineTo(this.x + 8, this.y + 50);
        ctx.stroke();
        
        // Fivela central
        ctx.fillStyle = '#c0c0c0';
        ctx.fillRect(centerX - 4, centerY - 4, 8, 8);
        ctx.strokeStyle = '#888';
        ctx.lineWidth = 1;
        ctx.strokeRect(centerX - 4, centerY - 4, 8, 8);
        
        // CABEÇA com pele realista
        ctx.fillStyle = '#d4a373';
        ctx.beginPath();
        ctx.arc(centerX, this.y + 12, 16, 0, Math.PI * 2);
        ctx.fill();
        
        // Sombra no pescoço
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.beginPath();
        ctx.arc(centerX, this.y + 22, 8, 0, Math.PI);
        ctx.fill();
        
        // CAPACETE DE MINERAÇÃO detalhado
        const helmetGrad = ctx.createLinearGradient(centerX - 16, this.y, centerX + 16, this.y);
        helmetGrad.addColorStop(0, '#d4a017');
        helmetGrad.addColorStop(0.5, '#f39c12');
        helmetGrad.addColorStop(1, '#d4a017');
        ctx.fillStyle = helmetGrad;
        ctx.beginPath();
        ctx.arc(centerX, this.y + 12, 16, Math.PI, 0);
        ctx.fill();
        
        // Borda do capacete
        ctx.strokeStyle = '#b8860b';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(centerX, this.y + 12, 16, Math.PI, 0);
        ctx.stroke();
        
        // Faixa refletora no capacete
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(centerX - 5, this.y + 6, 6, 0.5, 1.5);
        ctx.stroke();
        
        // LUZ DO CAPACETE (lanterna frontal)
        const lightOn = this.fuseActive ? true : (Date.now() % 400 < 200);
        const lightIntensity = this.fuseActive ? (Math.sin(Date.now() * 0.02) * 0.3 + 0.7) : 1;
        
        // Base da lanterna
        ctx.fillStyle = '#333';
        ctx.fillRect(centerX - 5, this.y + 2, 10, 7);
        
        // Luz da lanterna
        if (lightOn) {
            // Brilho externo
            const lightGrad = ctx.createRadialGradient(centerX, this.y + 5, 0, centerX, this.y + 5, 20);
            lightGrad.addColorStop(0, `rgba(255, 255, 100, ${0.6 * lightIntensity})`);
            lightGrad.addColorStop(0.5, `rgba(255, 255, 0, ${0.3 * lightIntensity})`);
            lightGrad.addColorStop(1, 'rgba(255, 255, 0, 0)');
            ctx.fillStyle = lightGrad;
            ctx.beginPath();
            ctx.arc(centerX, this.y + 5, 20, 0, Math.PI * 2);
            ctx.fill();
            
            // Lente brilhante
            ctx.fillStyle = '#ffff00';
            ctx.shadowBlur = 15 * lightIntensity;
            ctx.shadowColor = '#ffff00';
            ctx.fillRect(centerX - 4, this.y + 3, 8, 5);
            ctx.shadowBlur = 0;
            
            // Reflexo na lente
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.fillRect(centerX - 3, this.y + 3, 3, 2);
        } else {
            // Lanterna apagada
            ctx.fillStyle = '#666';
            ctx.fillRect(centerX - 4, this.y + 3, 8, 5);
        }
        
        // OLHOS expressivos
        const eyeWhite = this.fuseActive ? '#ffff00' : '#fff';
        const eyeSize = this.fuseActive ? 7 : 6;
        
        // Olho esquerdo
        ctx.fillStyle = eyeWhite;
        ctx.fillRect(centerX - 10, this.y + 10, eyeSize, eyeSize);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.strokeRect(centerX - 10, this.y + 10, eyeSize, eyeSize);
        
        // Olho direito
        ctx.fillRect(centerX + 4, this.y + 10, eyeSize, eyeSize);
        ctx.strokeRect(centerX + 4, this.y + 10, eyeSize, eyeSize);
        
        // PUPILAS (olhar instável quando ativado)
        ctx.fillStyle = '#000';
        if (this.fuseActive) {
            // Olhar louco e errático
            const pupilOffsetX = Math.sin(Date.now() * 0.02) * 2;
            const pupilOffsetY = Math.cos(Date.now() * 0.03) * 2;
            const pupilSize = 2 + Math.sin(Date.now() * 0.05);
            
            ctx.beginPath();
            ctx.arc(centerX - 7 + pupilOffsetX, this.y + 13 + pupilOffsetY, pupilSize, 0, Math.PI * 2);
            ctx.arc(centerX + 7 + pupilOffsetX, this.y + 13 + pupilOffsetY, pupilSize, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // Olhar normal
            ctx.fillRect(centerX - 8, this.y + 12, 3, 3);
            ctx.fillRect(centerX + 6, this.y + 12, 3, 3);
        }
        
        // BOCA (expressão de loucura quando ativado)
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.beginPath();
        
        if (this.fuseActive && this.fuseTimer < 30) {
            // BOCA ABERTA GRITANDO
            ctx.arc(centerX, this.y + 18, 4, 0, Math.PI);
            ctx.fillStyle = '#000';
            ctx.fill();
        } else if (this.fuseActive) {
            // Sorriso maníaco
            ctx.arc(centerX, this.y + 16, 6, 0, Math.PI);
        } else {
            // Sorriso confiante
            ctx.arc(centerX, this.y + 16, 5, 0, Math.PI, false);
        }
        ctx.stroke();
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
    window.ExploderEnemy = ExploderEnemy;
}
