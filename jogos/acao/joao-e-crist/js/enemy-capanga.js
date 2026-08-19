/**
 * CAPANGA MELHORADO - Gangster de rua
 * Visual detalhado: terno, gravata, óculos escuros, arma
 */

class CapangaEnemy extends Enemy {
    constructor(x, y) {
        super(x, y, 'basic');
        
        // Substituir stats base
        this.w = 60;
        this.h = 80;
        this.life = 50;
        this.maxLife = 50;
        this.speed = 2;
        this.damage = 12;
        this.score = 100;
        this.name = 'Capanga';
        
        // ✅ HITBOX PADRONIZADA
        this.hitbox = {
            offsetX: Math.floor(this.w * 0.20),
            offsetY: Math.floor(this.h * 0.25),
            width: Math.floor(this.w * 0.60),
            height: Math.floor(this.h * 0.65)
        };
        
        console.log('👔 Capanga criado em:', this.x, this.y, 'Ground:', this.groundY);
        
        // Cores do gangster
        const suitColors = ['#1a1a1a', '#2c2c2c', '#1a0033', '#330000'];
        const tieColors = ['#ff0000', '#ffd700', '#ffffff', '#00ffff'];
        const shirtColors = ['#ffffff', '#e8e8e8', '#ffcccc', '#ccccff'];
        
        this.suitColor = suitColors[Math.floor(Math.random() * suitColors.length)];
        this.tieColor = tieColors[Math.floor(Math.random() * tieColors.length)];
        this.shirtColor = shirtColors[Math.floor(Math.random() * shirtColors.length)];
        this.skinColor = '#d4a574';
        this.hairColor = ['#1a1a1a', '#3d2817', '#5a3d28'][Math.floor(Math.random() * 3)];
        
        // Variações visuais
        this.hasHat = Math.random() > 0.5;
        this.hasGun = Math.random() > 0.6;
        this.hasCigar = Math.random() > 0.7;
        this.sunglasses = Math.random() > 0.4;
        
        // Animação de caminhada
        this.walkCycle = 0;
        this.walkSpeed = 0.15;
        
        // ✅ VALIDAÇÃO: Re-calcular Y
        if (this.groundY) {
            this.y = this.groundY - this.h;
        }
    }
    
    draw(ctx) {
        if (this.life <= 0 && this.deathAnim >= 30) return;
        
        ctx.save();
        
        // Animação de morte
        if (this.life <= 0) {
            ctx.globalAlpha = 1 - (this.deathAnim / 30);
            ctx.translate(this.x + this.w / 2, this.y + this.h);
            ctx.rotate(this.deathAnim * 0.1);
            ctx.translate(-(this.x + this.w / 2), -(this.y + this.h));
            this.deathAnim = Math.min(this.deathAnim + 1, 30);
        }
        
        // Flip horizontal
        if (this.facingRight) {
            ctx.translate(this.x + this.w, this.y);
            ctx.scale(-1, 1);
            ctx.translate(-this.x, -this.y);
        }
        
        // Sombra
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(
            this.x + this.w / 2,
            this.y + this.h + 2,
            this.w / 2,
            6,
            0, 0, Math.PI * 2
        );
        ctx.fill();
        
        // Animação de caminhada (bounce)
        const bounce = this.aiState === 'chasing' || this.aiState === 'patrol' 
            ? Math.sin(this.walkCycle) * 2 
            : 0;
        
        const scale = this.w / 60; // Escala proporcional
        const baseX = this.x + this.w * 0.2;
        const baseY = this.y + this.h * 0.25 + bounce;
        
        // === PERNAS (andando) ===
        this.drawLegs(ctx, baseX, baseY, scale);
        
        // === CORPO (terno) ===
        this.drawBody(ctx, baseX, baseY, scale);
        
        // === CABEÇA ===
        this.drawHead(ctx, baseX, baseY, scale);
        
        // === ARMA (se tiver) ===
        if (this.hasGun) {
            this.drawGun(ctx, baseX, baseY, scale);
        }
        
        // Flash de hit
        if (this.hitFlash > 0) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.fillRect(this.x, this.y, this.w, this.h);
            this.hitFlash--;
        }
        
        ctx.restore();
        
        // Barra de vida
        if (this.life > 0 && this.life < this.maxLife) {
            const barWidth = this.w;
            const barHeight = 4;
            const barY = this.y - 8;
            
            ctx.fillStyle = '#000';
            ctx.fillRect(this.x, barY, barWidth, barHeight);
            
            ctx.fillStyle = '#ff0000';
            ctx.fillRect(this.x, barY, (this.life / this.maxLife) * barWidth, barHeight);
            
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1;
            ctx.strokeRect(this.x, barY, barWidth, barHeight);
        }
    }
    
    drawLegs(ctx, baseX, baseY, scale) {
        const legOffset = Math.sin(this.walkCycle) * 8 * scale;
        
        // Calças
        ctx.fillStyle = this.suitColor;
        
        // Perna esquerda
        ctx.fillRect(
            baseX + 15 * scale - legOffset,
            baseY + 35 * scale,
            8 * scale,
            25 * scale
        );
        
        // Perna direita
        ctx.fillRect(
            baseX + 15 * scale + legOffset,
            baseY + 35 * scale,
            8 * scale,
            25 * scale
        );
        
        // Sapatos
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(baseX + 13 * scale - legOffset, baseY + 58 * scale, 12 * scale, 6 * scale);
        ctx.fillRect(baseX + 13 * scale + legOffset, baseY + 58 * scale, 12 * scale, 6 * scale);
    }
    
    drawBody(ctx, baseX, baseY, scale) {
        // Terno (paletó)
        ctx.fillStyle = this.suitColor;
        ctx.fillRect(baseX + 8 * scale, baseY + 15 * scale, 24 * scale, 28 * scale);
        
        // Camisa (gola)
        ctx.fillStyle = this.shirtColor;
        ctx.fillRect(baseX + 15 * scale, baseY + 15 * scale, 10 * scale, 8 * scale);
        
        // Gravata
        ctx.fillStyle = this.tieColor;
        ctx.beginPath();
        ctx.moveTo(baseX + 20 * scale, baseY + 20 * scale);
        ctx.lineTo(baseX + 18 * scale, baseY + 35 * scale);
        ctx.lineTo(baseX + 22 * scale, baseY + 35 * scale);
        ctx.closePath();
        ctx.fill();
        
        // Botões do paletó
        ctx.fillStyle = '#ffd700';
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.arc(
                baseX + 12 * scale,
                baseY + (20 + i * 7) * scale,
                1.5 * scale,
                0, Math.PI * 2
            );
            ctx.fill();
        }
        
        // Braços
        const armSwing = Math.sin(this.walkCycle) * 3 * scale;
        
        // Braço esquerdo
        ctx.fillStyle = this.suitColor;
        ctx.fillRect(
            baseX + 4 * scale,
            baseY + 18 * scale - armSwing,
            6 * scale,
            20 * scale
        );
        
        // Braço direito
        ctx.fillRect(
            baseX + 30 * scale,
            baseY + 18 * scale + armSwing,
            6 * scale,
            20 * scale
        );
        
        // Mãos
        ctx.fillStyle = this.skinColor;
        ctx.beginPath();
        ctx.arc(baseX + 7 * scale, baseY + 38 * scale - armSwing, 3 * scale, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(baseX + 33 * scale, baseY + 38 * scale + armSwing, 3 * scale, 0, Math.PI * 2);
        ctx.fill();
    }
    
    drawHead(ctx, baseX, baseY, scale) {
        // Pescoço
        ctx.fillStyle = this.skinColor;
        ctx.fillRect(baseX + 17 * scale, baseY + 10 * scale, 6 * scale, 6 * scale);
        
        // Cabeça
        ctx.fillStyle = this.skinColor;
        ctx.beginPath();
        ctx.arc(baseX + 20 * scale, baseY + 8 * scale, 8 * scale, 0, Math.PI * 2);
        ctx.fill();
        
        // Cabelo
        ctx.fillStyle = this.hairColor;
        ctx.beginPath();
        ctx.arc(baseX + 20 * scale, baseY + 5 * scale, 8 * scale, Math.PI, Math.PI * 2);
        ctx.fill();
        
        // Chapéu (se tiver)
        if (this.hasHat) {
            ctx.fillStyle = '#1a1a1a';
            // Aba
            ctx.fillRect(baseX + 10 * scale, baseY + 2 * scale, 20 * scale, 2 * scale);
            // Copa
            ctx.fillRect(baseX + 13 * scale, baseY - 4 * scale, 14 * scale, 6 * scale);
        }
        
        // Óculos escuros (se tiver)
        if (this.sunglasses) {
            ctx.fillStyle = '#000';
            ctx.fillRect(baseX + 14 * scale, baseY + 7 * scale, 5 * scale, 3 * scale);
            ctx.fillRect(baseX + 21 * scale, baseY + 7 * scale, 5 * scale, 3 * scale);
            
            // Armação
            ctx.strokeStyle = '#1a1a1a';
            ctx.lineWidth = 1 * scale;
            ctx.strokeRect(baseX + 14 * scale, baseY + 7 * scale, 5 * scale, 3 * scale);
            ctx.strokeRect(baseX + 21 * scale, baseY + 7 * scale, 5 * scale, 3 * scale);
        } else {
            // Olhos normais
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.arc(baseX + 16 * scale, baseY + 8 * scale, 1.5 * scale, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(baseX + 24 * scale, baseY + 8 * scale, 1.5 * scale, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Boca (sério/carrancudo)
        ctx.strokeStyle = '#1a1a1a';
        ctx.lineWidth = 1.5 * scale;
        ctx.beginPath();
        ctx.moveTo(baseX + 16 * scale, baseY + 12 * scale);
        ctx.lineTo(baseX + 24 * scale, baseY + 12 * scale);
        ctx.stroke();
        
        // Charuto (se tiver)
        if (this.hasCigar) {
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(baseX + 26 * scale, baseY + 12 * scale, 6 * scale, 2 * scale);
            
            // Brasa
            ctx.fillStyle = '#ff4500';
            ctx.beginPath();
            ctx.arc(baseX + 32 * scale, baseY + 13 * scale, 1.5 * scale, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    drawGun(ctx, baseX, baseY, scale) {
        // Arma na mão direita
        ctx.fillStyle = '#2c2c2c';
        
        // Cabo
        ctx.fillRect(baseX + 30 * scale, baseY + 35 * scale, 4 * scale, 6 * scale);
        
        // Cano
        ctx.fillRect(baseX + 30 * scale, baseY + 33 * scale, 8 * scale, 3 * scale);
        
        // Detalhes metálicos
        ctx.fillStyle = '#666';
        ctx.fillRect(baseX + 32 * scale, baseY + 34 * scale, 2 * scale, 1 * scale);
    }
    
    update(players, allEnemies) {
        if (this.life <= 0) {
            this.deathAnim++;
            return;
        }
        
        // Atualizar animação de caminhada
        if (this.aiState === 'chasing' || this.aiState === 'patrol') {
            this.walkCycle += this.walkSpeed;
        }
        
        // Lógica padrão do Enemy
        super.update(players, allEnemies);
    }
}

// Exportar
if (typeof window !== 'undefined') {
    window.CapangaEnemy = CapangaEnemy;
}
