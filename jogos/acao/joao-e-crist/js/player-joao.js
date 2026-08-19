const JOAO_SPRITE_SHEET = new Image();
JOAO_SPRITE_SHEET.src = 'assets/joao-sprites.png';

// Classe específica para o personagem JOÃO
class PlayerJoao {
    constructor(x, y, controlPlayer = 1) {
        this.name = 'João';
        this.x = x;
        this.w = 50;
        this.h = 70;
        
        // ✅ PADRONIZADO: Mesmo sistema de chão dos inimigos
        this.groundY = y;        // y é a posição do chão
        this.y = y - this.h;     // Ajustar para base tocar o chão
        
        this.speed = 6;
        this.life = 100;
        this.maxLife = 100;
        this.attacking = false;
        this.attackTimer = 0;
        this.attackCooldown = 0;
        this.facingRight = true;
        
        // PATCH: Hitbox ajustada para corpo real
        this.hitbox = {
            offsetX: 5,
            offsetY: 25,
            width: 40,
            height: 45  // 65% da altura
        };
        
        // Controles de João (WASD + Shift)
        this.controlPlayer = controlPlayer;
        this.controls = sistemControles.obterControles(controlPlayer);
        
        // Sistema de dash/esquiva
        this.dashing = false;
        this.dashTimer = 0;
        this.dashCooldown = 0;
        this.dashSpeed = 15;
        this.dashDuration = 8;
        
        // Cores de João (azul)
        this.primaryColor = '#3498db';
        this.secondaryColor = '#2980b9';
        this.skinColor = '#ffdbac';
        
        // Física
        this.jumpPower = 0;
        this.gravity = 0.5;  // ✅ PADRONIZADO: Mesma gravidade dos inimigos
        this.vy = 0;          // ✅ Velocidade vertical para sistema padronizado
        this.isJumping = false;
        
        // Sistema de combate
        this.combo = 0;
        this.invulnerable = 0;
        this.walkCycle = 0;
        this.comboTimer = 0;
        this.activePowerUps = [];
        this.isMoving = false;
        this.isRunning = false;
        this.moveHoldFrames = 0;
    }
    
    // ===== MÉTODOS DE POWER-UPS =====
    activatePowerUp(type, duration) {
        this.activePowerUps = this.activePowerUps.filter(p => p.type !== type);
        this.activePowerUps.push({
            type: type,
            duration: duration,
            timer: 0
        });
    }
    
    hasActivePowerUp(type) {
        return this.activePowerUps.some(p => p.type === type);
    }
    
    // ===== MÉTODO DE DESENHO =====
    draw(ctx) {
        // Piscar quando invulnerável
        if (this.invulnerable > 0 && Math.floor(this.invulnerable / 5) % 2 === 0) {
            ctx.globalAlpha = 0.5;
        }
        
        // Efeito de rastro durante dash
        if (this.dashing) {
            for (let i = 0; i < 3; i++) {
                ctx.globalAlpha = 0.3 - (i * 0.1);
                const offsetX = this.facingRight ? -i * 10 : i * 10;
                
                ctx.fillStyle = 'rgba(52, 152, 219, 0.5)'; // Azul para João
                ctx.beginPath();
                ctx.ellipse(this.x + this.w / 2 + offsetX, this.y + this.h / 2, 
                           this.w / 2, this.h / 2, 0, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = 1;
        }

        // Sombra
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(this.x + this.w / 2, this.y + this.h + 5, this.w / 2, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        // Desenhar João
        this.drawJoaoSprite(ctx);

        ctx.globalAlpha = 1;

        // Nome do personagem
        ctx.save();
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.primaryColor;
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 14px Righteous';
        ctx.textAlign = 'center';
        ctx.fillText(this.name, this.x + this.w / 2, this.y - 25);
        ctx.restore();

        // Barra de vida
        this.drawHealthBar(ctx);
        
        // Indicador de combo
        if (this.combo > 1) {
            ctx.save();
            ctx.shadowBlur = 15;
            
            const comboTimePercent = this.comboTimer / 120;
            let comboColor = '#ffff00';
            
            if (comboTimePercent > 0.75) {
                comboColor = Math.floor(Date.now() / 100) % 2 === 0 ? '#ff0000' : '#ff8800';
            } else if (comboTimePercent > 0.5) {
                comboColor = '#ff8800';
            }
            
            ctx.shadowColor = comboColor;
            ctx.fillStyle = comboColor;
            ctx.font = 'bold 12px Righteous';
            ctx.textAlign = 'center';
            ctx.fillText(`COMBO x${this.combo}`, this.x + this.w / 2, this.y - 45);
            ctx.restore();
        }
        
        // Indicador de dash disponível
        if (this.dashCooldown === 0 && !this.dashing) {
            const pulse = Math.abs(Math.sin(Date.now() / 200));
            ctx.globalAlpha = 0.5 + pulse * 0.5;
            ctx.fillStyle = '#00ffff';
            ctx.beginPath();
            ctx.arc(this.x + this.w + 5, this.y + 10, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        }
    }

    drawJoaoSprite(ctx) {
        const sheet = JOAO_SPRITE_SHEET;
        if (!sheet.complete || sheet.naturalWidth === 0) {
            // Fallback temporário enquanto o sprite carrega.
            this.drawJoao(ctx);
            return;
        }

        // Linhas do atlas: idle, andar, correr, pular, ataque, ataque cima,
        // dano, agachar, bloquear, morrer, dash.
        let state = 'idle';
        let frames = 4;
        let row = 0;
        let frame = 0;

        if (this.dashing) {
            state = 'dash'; row = 10; frames = this.name === 'Crist' ? 4 : 3;
            frame = Math.floor((this.dashDuration - Math.max(0, this.dashTimer)) / 2) % frames;
        } else if (this.attacking) {
            state = 'attack'; row = 4; frames = 4;
            frame = Math.min(frames - 1, Math.floor((15 - Math.max(0, this.attackTimer)) / 4));
        } else if (this.isJumping) {
            state = 'jump'; row = 3; frames = this.name === 'Crist' ? 4 : 5;
            frame = Math.min(frames - 1, Math.max(0, Math.floor((-this.jumpPower + 18) / 7)));
        } else if (this.invulnerable > 15) {
            state = 'damage'; row = 6; frames = 3;
            frame = Math.floor(Date.now() / 90) % frames;
        } else if (this.walkCycle !== 0) {
            state = this.isRunning ? 'run' : 'walk'; row = this.isRunning ? 2 : 1; frames = 6;
            frame = Math.floor(this.walkCycle / 0.3) % frames;
        }

        // O sprite foi desenhado virado para a direita. Espelhamos quando anda para a esquerda.
        const cell = 128;
        const sx = frame * cell;
        const sy = row * cell;
        const drawW = 82;
        const drawH = 92;
        const dx = this.x + this.w / 2 - drawW / 2;
        const dy = this.y + this.h - drawH + 7;

        ctx.save();
        if (this.invulnerable > 0 && Math.floor(this.invulnerable / 5) % 2 === 0) ctx.globalAlpha = 0.55;
        if (!this.facingRight) {
            ctx.translate(dx + drawW, 0);
            ctx.scale(-1, 1);
            ctx.drawImage(sheet, sx, sy, cell, cell, 0, dy, drawW, drawH);
        } else {
            ctx.drawImage(sheet, sx, sy, cell, cell, dx, dy, drawW, drawH);
        }
        ctx.restore();
    }

    drawJoao(ctx) {
        const armOffset = Math.sin(this.walkCycle) * 5;
        const legOffset = Math.sin(this.walkCycle) * 8;

        // Pernas - Calça azul
        ctx.fillStyle = '#2b5ca8';
        ctx.fillRect(this.x + 14, this.y + 50, 10, 25 + legOffset);
        ctx.fillRect(this.x + 26, this.y + 50, 10, 25 - legOffset);

        // Botinas marrons
        ctx.fillStyle = '#6b4423';
        ctx.fillRect(this.x + 12, this.y + 73 + legOffset, 14, 8);
        ctx.fillRect(this.x + 24, this.y + 73 - legOffset, 14, 8);
        
        // Detalhes das botinas
        ctx.fillStyle = '#4a2f1a';
        ctx.fillRect(this.x + 12, this.y + 73 + legOffset, 14, 3);
        ctx.fillRect(this.x + 24, this.y + 73 - legOffset, 14, 3);

        // Camisa verde
        ctx.fillStyle = '#4a7c2e';
        ctx.fillRect(this.x + 10, this.y + 25, 30, 28);
        
        // Detalhe da camisa
        ctx.fillStyle = '#3a6224';
        ctx.fillRect(this.x + 23, this.y + 25, 4, 28);

        // Suspensórios
        ctx.strokeStyle = '#2c2c2c';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(this.x + 17, this.y + 25);
        ctx.lineTo(this.x + 17, this.y + 50);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(this.x + 33, this.y + 25);
        ctx.lineTo(this.x + 33, this.y + 50);
        ctx.stroke();
        
        // Fivelas dos suspensórios
        ctx.fillStyle = '#8b7355';
        ctx.fillRect(this.x + 15, this.y + 48, 4, 4);
        ctx.fillRect(this.x + 31, this.y + 48, 4, 4);

        // Braços
        ctx.fillStyle = '#d4a574';
        
        if (this.attacking) {
            // Braço de soco
            const punchX = this.facingRight ? this.x + this.w - 5 : this.x - 20;
            ctx.fillRect(punchX, this.y + 28, 30, 10);
            
            // Manga verde
            ctx.fillStyle = '#4a7c2e';
            ctx.fillRect(punchX + (this.facingRight ? 0 : 18), this.y + 28, 12, 10);
            
            // Efeito de impacto
            ctx.fillStyle = '#ffff00';
            const impactX = this.facingRight ? punchX + 30 : punchX - 10;
            ctx.beginPath();
            ctx.arc(impactX, this.y + 33, 8, 0, Math.PI * 2);
            ctx.fill();
            
            // Linhas de velocidade
            ctx.strokeStyle = '#ffff00';
            ctx.lineWidth = 2;
            for (let i = 0; i < 3; i++) {
                const lineX = this.facingRight ? impactX - 15 - i * 8 : impactX + 15 + i * 8;
                ctx.beginPath();
                ctx.moveTo(lineX, this.y + 28 + i * 3);
                ctx.lineTo(lineX + (this.facingRight ? -10 : 10), this.y + 28 + i * 3);
                ctx.stroke();
            }
        } else {
            // Braços normais
            ctx.fillRect(this.x + 5, this.y + 28 + armOffset, 10, 26);
            ctx.fillRect(this.x + 35, this.y + 28 - armOffset, 10, 26);
            
            // Mangas verdes
            ctx.fillStyle = '#4a7c2e';
            ctx.fillRect(this.x + 5, this.y + 28 + armOffset, 10, 12);
            ctx.fillRect(this.x + 35, this.y + 28 - armOffset, 10, 12);
        }

        // Cabeça
        ctx.fillStyle = '#d4a574';
        ctx.beginPath();
        ctx.arc(this.x + 25, this.y + 13, 14, 0, Math.PI * 2);
        ctx.fill();
        
        // Chapéu de palha
        ctx.fillStyle = '#8b7355';
        ctx.beginPath();
        ctx.ellipse(this.x + 25, this.y + 5, 18, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(this.x + 15, this.y - 5, 20, 10);
        ctx.fillRect(this.x + 18, this.y - 8, 14, 8);
        
        // Detalhe do chapéu
        ctx.fillStyle = '#6b5844';
        ctx.fillRect(this.x + 15, this.y + 3, 20, 3);

        // Olhos
        ctx.fillStyle = '#fff';
        ctx.fillRect(this.x + 17, this.y + 9, 6, 6);
        ctx.fillRect(this.x + 27, this.y + 9, 6, 6);
        
        ctx.fillStyle = '#000';
        const eyeOffsetX = this.facingRight ? 3 : 1;
        ctx.fillRect(this.x + 17 + eyeOffsetX, this.y + 10, 3, 4);
        ctx.fillRect(this.x + 27 + eyeOffsetX, this.y + 10, 3, 4);

        // Sobrancelhas grossas
        ctx.fillStyle = '#8b7355';
        ctx.fillRect(this.x + 16, this.y + 7, 7, 2);
        ctx.fillRect(this.x + 27, this.y + 7, 7, 2);
        
        // Bigode característico
        ctx.fillStyle = '#8b7355';
        ctx.fillRect(this.x + 15, this.y + 18, 8, 4);
        ctx.fillRect(this.x + 27, this.y + 18, 8, 4);
        ctx.fillRect(this.x + 20, this.y + 17, 10, 3);
        
        // Sorriso discreto
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.x + 25, this.y + 20, 6, 0.2, Math.PI - 0.2);
        ctx.stroke();
    }

    drawHealthBar(ctx) {
        const barWidth = this.w;
        const barHeight = 8;
        const barX = this.x;
        const barY = this.y - 15;

        // Borda externa
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.strokeRect(barX - 1, barY - 1, barWidth + 2, barHeight + 2);

        // Fundo da barra
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(barX, barY, barWidth, barHeight);

        // Vida atual com gradiente
        const lifePercent = this.life / this.maxLife;
        const gradient = ctx.createLinearGradient(barX, 0, barX + barWidth, 0);
        
        if (lifePercent > 0.5) {
            gradient.addColorStop(0, '#00ff00');
            gradient.addColorStop(1, '#00cc00');
        } else if (lifePercent > 0.25) {
            gradient.addColorStop(0, '#ffaa00');
            gradient.addColorStop(1, '#ff8800');
        } else {
            gradient.addColorStop(0, '#ff0000');
            gradient.addColorStop(1, '#cc0000');
        }
        
        ctx.fillStyle = gradient;
        ctx.fillRect(barX, barY, barWidth * lifePercent, barHeight);

        // Brilho na barra
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(barX, barY, barWidth * lifePercent, barHeight / 2);
    }

    // ===== MÉTODO DE ATUALIZAÇÃO (MOVIMENTAÇÃO) =====
    update(keys) {
        // DEBUG: Proteção contra estados indefinidos
        if (this.attackTimer === undefined || this.attackTimer === null || this.attackTimer < 0) {
            this.attacking = false;
            this.attackTimer = 0;
        }
        if (this.dashTimer === undefined || this.dashTimer === null || this.dashTimer < 0) {
            this.dashing = false;
            this.dashTimer = 0;
        }
        
        // Sistema de Dash (S para João)
        if (sistemControles.acaoAtiva(this.controlPlayer, 'dash', keys) && !this.dashing && this.dashCooldown === 0 && !this.attacking) {
            this.dashing = true;
            this.dashTimer = this.dashDuration;
            this.dashCooldown = 60;
            this.invulnerable = this.dashDuration;
        }
        
        // Processar dash
        if (this.dashing) {
            this.dashTimer--;
            const dashDirection = this.facingRight ? 1 : -1;
            this.x += this.dashSpeed * dashDirection;
            
            if (this.dashTimer <= 0) {
                this.dashing = false;
            }
        }
        
        // Reduzir cooldown do dash
        if (this.dashCooldown > 0) {
            this.dashCooldown--;
        }
        
        // Movimento horizontal
        let moving = false;
        let currentSpeed = this.speed;
        
        // Aplicar power-up de velocidade
        if (this.hasActivePowerUp('speed')) {
            currentSpeed *= 1.5;
        }
        
        if (!this.dashing && !this.attacking) {
            if (sistemControles.acaoAtiva(this.controlPlayer, 'left', keys)) {
                this.x -= currentSpeed;
                this.facingRight = false;
                moving = true;
            }
            if (sistemControles.acaoAtiva(this.controlPlayer, 'right', keys)) {
                this.x += currentSpeed;
                this.facingRight = true;
                moving = true;
            }
        }

        // Caminhada vira corrida depois de alguns frames segurando direção.
        this.isMoving = moving && !this.isJumping && !this.dashing && !this.attacking;
        this.moveHoldFrames = this.isMoving ? (this.moveHoldFrames || 0) + 1 : 0;
        this.isRunning = this.isMoving && (this.moveHoldFrames > 22 || currentSpeed > this.speed + 0.01);
        if (this.isMoving) this.walkCycle += this.isRunning ? 0.5 : 0.3; else this.walkCycle = 0;

        // Pulo
        if (sistemControles.acaoAtiva(this.controlPlayer, 'up', keys) && !this.isJumping && this.y + this.h >= this.groundY && !this.dashing) {
            this.jumpPower = -18;
            this.isJumping = true;
        }

        // Aplicar gravidade
        this.y += this.jumpPower;
        this.jumpPower += this.gravity;

        // Colisão com chão (base do personagem)
        if (this.y + this.h >= this.groundY) {
            this.y = this.groundY - this.h;
            this.jumpPower = 0;
            this.isJumping = false;
        }

        // Ataque
        if (this.attackCooldown > 0) {
            this.attackCooldown--;
        }

        if (sistemControles.acaoAtiva(this.controlPlayer, 'attack', keys) && !this.attacking && this.attackCooldown === 0 && !this.dashing) {
            this.attacking = true;
            this.attackTimer = 15;
            this.attackCooldown = 20;
        }

        if (this.attacking) {
            this.attackTimer--;
            if (this.attackTimer <= 0) {
                this.attacking = false;
            }
        }

        // Invulnerabilidade
        if (this.invulnerable > 0) {
            this.invulnerable--;
        }

        // Sistema de combo
        if (this.combo > 0) {
            this.comboTimer++;
            if (this.comboTimer > 120) {
                this.combo = 0;
                this.comboTimer = 0;
            }
        }
        
        // Atualizar power-ups
        this.activePowerUps = this.activePowerUps.filter(powerUp => {
            powerUp.timer++;
            
            if (powerUp.type === 'invincible') {
                this.invulnerable = 2;
            }
            
            return powerUp.timer < powerUp.duration;
        });

        // Limites da tela
        if (this.x < 0) this.x = 0;
        if (this.x > 4950) this.x = 4950;
    }

    // ===== MÉTODOS DE COMBATE =====
    getHitbox() {
        // Janela ativa sincronizada com a animação do soco.
        if (!this.attacking || this.attackTimer > 10 || this.attackTimer < 6) return null;
        const hitboxW = 46;
        const hitboxH = 38;
        return {
            x: this.facingRight ? this.x + this.w - 8 : this.x - hitboxW + 8,
            y: this.y + 18,
            w: hitboxW,
            h: hitboxH
        };
    }

    takeDamage(damage) {
        if (this.invulnerable > 0 || this.hasActivePowerUp('invincible')) return false;
        
        this.life -= damage;
        if (window.gamepadSystem?.rumble) window.gamepadSystem.rumble(this.controlPlayer || 1, 130, 0.7, 0.35);
        this.invulnerable = 40;
        this.combo = Math.floor(this.combo / 2);
        this.comboTimer = 0;
        if (this.life < 0) this.life = 0;
        
        if (this.life === 0) {
            console.log(`💀 ${this.name} MORREU!`);
        }
        
        return true;
    }

    heal(amount) {
        this.life += amount;
        if (this.life > this.maxLife) this.life = this.maxLife;
    }

    addCombo() {
        this.combo++;
        this.comboTimer = 0;
        
        if (this.combo === 10) {
            this.heal(10);
        } else if (this.combo === 20) {
            this.heal(20);
        } else if (this.combo === 30) {
            this.heal(30);
        }
    }

    resetForNewLevel() {
        this.x = 150;
        this.y = this.groundY - this.h;  // ✅ Base no chão
        this.jumpPower = 0;
        this.isJumping = false;
        this.attacking = false;
        this.attackTimer = 0;
        this.attackCooldown = 0;
        this.invulnerable = 0;
        this.combo = 0;
        this.comboTimer = 0;
        this.dashing = false;
        this.dashTimer = 0;
        this.dashCooldown = 0;
        this.heal(30);
    }
}
