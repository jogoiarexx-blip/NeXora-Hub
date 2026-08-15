// hud.js - Interface de Usuário Aprimorada
class HUD {
    constructor() {
        this.notifications = [];
        this.comboTimer = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.scoreAnimation = 0;
        this.displayScore = 0;
    }

    addNotification(text, color = '#fff', duration = 2.0) {
        this.notifications.push({
            text: text,
            color: color,
            life: duration,
            maxLife: duration,
            y: 120,
            alpha: 1
        });
        
        // Limita número de notificações
        if (this.notifications.length > 5) {
            this.notifications.shift();
        }
    }

    incrementCombo() {
        this.combo++;
        this.comboTimer = 90; // 1.5 segundos a 60fps
        
        if (this.combo > this.maxCombo) {
            this.maxCombo = this.combo;
        }
        
        // ✅ STATS: Registra combo
        if (Game.stats) {
            Game.stats.recordCombo(this.combo);
        }
        
        // Notificações especiais em milestones
        if (this.combo === 5) {
            this.addNotification('COMBO INICIADO!', '#FFD700');
            // ✅ FIX BUG #10: Verifica conquistas apenas em milestones importantes
            if (Game.achievements) Game.achievements.check();
        } else if (this.combo === 10) {
            this.addNotification('ÓTIMO COMBO!', '#FF6B6B');
            if (Game.achievements) Game.achievements.check();
        } else if (this.combo === 20) {
            this.addNotification('INCRÍVEL!', '#4ECDC4');
        } else if (this.combo === 50) {
            this.addNotification('LENDÁRIO!!!', '#FF00FF', 3.0);
        }
    }

    resetCombo() {
        if (this.combo > 5) {
            const bonus = this.combo * 5;
            Game.data.score += bonus;
            this.addNotification(`Combo Bônus +${bonus}`, '#FFD700');
        }
        
        this.combo = 0;
        this.comboTimer = 0;
    }

    update() {
        // Timer do combo
        if (this.comboTimer > 0) {
            this.comboTimer--;
        } else if (this.combo > 0) {
            this.resetCombo();
        }

        // Atualiza notificações
        for (let i = this.notifications.length - 1; i >= 0; i--) {
            const notif = this.notifications[i];
            notif.life -= 0.016; // ~60fps
            notif.y -= 0.8; // Sobe mais rápido
            
            // Fade out no final
            if (notif.life < 0.5) {
                notif.alpha = notif.life * 2;
            }
            
            if (notif.life <= 0) {
                this.notifications.splice(i, 1);
            }
        }

        // Anima pontuação
        if (this.displayScore < Game.data.score) {
            const diff = Game.data.score - this.displayScore;
            this.displayScore += Math.ceil(diff * 0.1);
        }
    }

    draw() {
        const ctx = Game.ctx;
        
        // Painel superior
        this.drawTopPanel();
        
        // Combo display
        if (this.combo > 2) {
            this.drawCombo();
        }

        // Notificações
        this.drawNotifications();
        
        // Barra de progresso do nível
        if (Game.brickManager) {
            this.drawLevelProgress();
        }
    }

    drawTopPanel() {
        const ctx = Game.ctx;
        
        // Background do painel com gradiente
        const gradient = ctx.createLinearGradient(0, 0, 0, 50);
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0.8)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0.4)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, Game.width, 50);

        // Linha divisória
        ctx.strokeStyle = 'rgba(0, 210, 255, 0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, 50);
        ctx.lineTo(Game.width, 50);
        ctx.stroke();

        // Score (animado)
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'left';
        ctx.shadowBlur = 5;
        ctx.shadowColor = '#fff';
        ctx.fillText(`⭐ ${this.displayScore}`, 20, 32);
        ctx.shadowBlur = 0;

        // Moedas
        ctx.fillStyle = '#FFD700';
        ctx.shadowBlur = 5;
        ctx.shadowColor = '#FFD700';
        ctx.fillText(`💰 ${Game.data.coins}`, 180, 32);
        ctx.shadowBlur = 0;

        // Nível (centro)
        ctx.fillStyle = '#00d2ff';
        ctx.textAlign = 'center';
        ctx.font = 'bold 22px Arial';
        ctx.shadowBlur = 5;
        ctx.shadowColor = '#00d2ff';
        ctx.fillText(`NÍVEL ${Game.data.level}`, Game.width / 2, 32);
        ctx.shadowBlur = 0;

        // Upgrades ativos (direita)
        ctx.textAlign = 'right';
        ctx.font = '18px Arial';
        
        let rightX = Game.width - 20;
        
        const paddleUpgrade = Game.economy.getEffect('paddleWidth');
        if (paddleUpgrade > 0) {
            ctx.fillStyle = '#4CAF50';
            ctx.fillText(`🛡 +${Math.floor(paddleUpgrade)}`, rightX, 32);
            rightX -= 80;
        }
        
        // Vidas (se implementado)
        if (Game.data.lives !== undefined) {
            ctx.fillStyle = '#ff4444';
            ctx.fillText(`❤️ ${Game.data.lives}`, rightX, 32);
        }
    }

    drawCombo() {
        const ctx = Game.ctx;
        
        const x = Game.width / 2;
        const y = 90;

        // Escala baseada no combo
        const scale = Math.min(1 + (this.combo / 30), 2);
        const baseSize = 30;
        const size = baseSize * scale;

        // Efeito de pulse
        const pulse = Math.sin(Date.now() / 100) * 0.15 + 0.85;
        const finalSize = size * pulse;

        ctx.font = `bold ${finalSize}px Arial`;
        ctx.textAlign = 'center';

        // Cor baseada no combo
        let color = '#FFD700';
        if (this.combo > 10) color = '#FF6B6B';
        if (this.combo > 20) color = '#4ECDC4';
        if (this.combo > 50) color = '#FF00FF';

        // Brilho
        ctx.shadowBlur = 20;
        ctx.shadowColor = color;
        
        // Texto principal
        ctx.fillStyle = color;
        ctx.fillText(`${this.combo}x`, x, y);
        
        // Subtexto
        ctx.font = 'bold 16px Arial';
        ctx.shadowBlur = 10;
        ctx.fillText('COMBO', x, y + 25);
        
        ctx.shadowBlur = 0;
        
        // Barra de timer do combo
        this.drawComboTimer(x, y + 35);
    }

    drawComboTimer(x, y) {
        const ctx = Game.ctx;
        const barWidth = 100;
        const barHeight = 4;
        const progress = this.comboTimer / 90; // 90 frames max
        
        // Background
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.fillRect(x - barWidth / 2, y, barWidth, barHeight);
        
        // Progress
        const color = progress > 0.5 ? '#4CAF50' : progress > 0.25 ? '#FF9800' : '#f44336';
        ctx.fillStyle = color;
        ctx.fillRect(x - barWidth / 2, y, barWidth * progress, barHeight);
    }

    drawNotifications() {
        const ctx = Game.ctx;
        
        this.notifications.forEach((notif, index) => {
            ctx.save();
            ctx.globalAlpha = notif.alpha;
            ctx.fillStyle = notif.color;
            ctx.font = 'bold 26px Arial';
            ctx.textAlign = 'center';
            ctx.shadowBlur = 15;
            ctx.shadowColor = notif.color;
            
            const y = notif.y + index * 35;
            ctx.fillText(notif.text, Game.width / 2, y);
            
            ctx.restore();
        });
    }

    drawLevelProgress() {
        const ctx = Game.ctx;
        const total = Game.brickManager.bricks.length;
        const remaining = Game.brickManager.getActiveBricksCount();
        
        if (total === 0) return;
        
        const progress = 1 - (remaining / total);
        const barWidth = 200;
        const barHeight = 6;
        const x = Game.width - barWidth - 20;
        const y = 58;
        
        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(x, y, barWidth, barHeight);
        
        // Progress bar com gradiente
        const gradient = ctx.createLinearGradient(x, 0, x + barWidth, 0);
        gradient.addColorStop(0, '#4CAF50');
        gradient.addColorStop(0.5, '#FFD700');
        gradient.addColorStop(1, '#00d2ff');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, barWidth * progress, barHeight);
        
        // Borda
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, barWidth, barHeight);
        
        // Texto
        ctx.fillStyle = '#fff';
        ctx.font = '12px Arial';
        ctx.textAlign = 'right';
        ctx.fillText(`${remaining}/${total}`, x + barWidth, y - 5);
    }

    drawPauseMenu() {
        const ctx = Game.ctx;
        
        // Overlay escuro
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, Game.width, Game.height);
        
        // Título
        ctx.fillStyle = '#00d2ff';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#00d2ff';
        ctx.fillText('PAUSADO', Game.width / 2, Game.height / 2 - 50);
        ctx.shadowBlur = 0;
        
        // Instruções
        ctx.fillStyle = '#fff';
        ctx.font = '20px Arial';
        ctx.fillText('Pressione P para continuar', Game.width / 2, Game.height / 2 + 20);
        ctx.fillText('ESC para menu principal', Game.width / 2, Game.height / 2 + 50);
    }

    drawGameOverScreen() {
        const ctx = Game.ctx;
        
        // Overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, Game.width, Game.height);
        
        // Game Over
        ctx.fillStyle = '#ff4444';
        ctx.font = 'bold 60px Arial';
        ctx.textAlign = 'center';
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#ff4444';
        ctx.fillText('GAME OVER', Game.width / 2, Game.height / 2 - 80);
        ctx.shadowBlur = 0;
        
        // Estatísticas
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 24px Arial';
        ctx.fillText(`Pontuação Final: ${Game.data.score}`, Game.width / 2, Game.height / 2);
        ctx.fillText(`Nível Alcançado: ${Game.data.level}`, Game.width / 2, Game.height / 2 + 40);
        ctx.fillText(`Melhor Combo: ${this.maxCombo}x`, Game.width / 2, Game.height / 2 + 80);
        
        // High Score
        if (Game.data.score > (Game.data.highScore || 0)) {
            ctx.fillStyle = '#FFD700';
            ctx.font = 'bold 20px Arial';
            ctx.fillText('🏆 NOVO RECORDE! 🏆', Game.width / 2, Game.height / 2 + 120);
            Game.data.highScore = Game.data.score;
            Game.economy.saveGlobalData();
        }
        
        // Instruções
        ctx.fillStyle = '#888';
        ctx.font = '18px Arial';
        ctx.fillText('R - Reiniciar | ESC - Menu', Game.width / 2, Game.height - 40);
    }
}
