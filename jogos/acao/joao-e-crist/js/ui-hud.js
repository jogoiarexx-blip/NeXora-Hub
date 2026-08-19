/**
 * UI/HUD SYSTEM - Interface gráfica do jogo
 * Sistema completo de interface com HUD, menus e notificações
 */

class GameUI {
    constructor() {
        this.notifications = [];
        this.combos = [];
        this.damageTexts = [];
        this.levelComplete = false;
        this.showFPS = false;
        this.fps = 60;
        this.lastFrameTime = Date.now();
    }

    /**
     * Desenhar HUD principal do jogo
     */
    drawHUD(ctx, players, enemies, currentLevel, score) {
        // Fundo semi-transparente no topo
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, 1000, 80);

        // === PLAYER 1 - JOÃO ===
        if (players[0]) {
            this.drawPlayerHUD(ctx, players[0], 20, 15, '#00ffff', 'JOÃO');
        }

        // === PLAYER 2 - CRIST ===
        if (players[1]) {
            this.drawPlayerHUD(ctx, players[1], 520, 15, '#ff00ff', 'CRIST');
        }

        // === INFO DO NÍVEL ===
        this.drawLevelInfo(ctx, currentLevel, 330, 15);

        // === SCORE ===
        this.drawScore(ctx, score, 850, 20);

        // === CONTADOR DE INIMIGOS ===
        this.drawEnemyCount(ctx, enemies, 850, 50);

        // === FPS (se ativado) ===
        if (this.showFPS) {
            this.drawFPS(ctx);
        }

        // === NOTIFICAÇÕES ===
        this.drawNotifications(ctx);

        // === TEXTOS DE DANO ===
        this.drawDamageTexts(ctx);

        // === COMBOS ===
        this.drawCombos(ctx);
    }

    /**
     * Desenhar HUD de um jogador individual
     */
    drawPlayerHUD(ctx, player, x, y, color, name) {
        // Nome do jogador
        ctx.font = 'bold 16px Righteous, Arial';
        ctx.fillStyle = color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = color;
        ctx.fillText(name, x, y);
        ctx.shadowBlur = 0;

        // Barra de vida
        const healthBarWidth = 150;
        const healthBarHeight = 20;
        const healthPercent = player.life / player.maxLife;

        // Fundo da barra
        ctx.fillStyle = 'rgba(100, 0, 0, 0.8)';
        ctx.fillRect(x, y + 5, healthBarWidth, healthBarHeight);

        // Barra de vida com gradiente
        const healthColor = healthPercent > 0.6 ? '#2ecc71' : 
                           healthPercent > 0.3 ? '#f39c12' : '#e74c3c';
        
        const gradient = ctx.createLinearGradient(x, y + 5, x + healthBarWidth * healthPercent, y + 5);
        gradient.addColorStop(0, healthColor);
        gradient.addColorStop(1, this.adjustBrightness(healthColor, -30));
        
        ctx.fillStyle = gradient;
        ctx.fillRect(x, y + 5, healthBarWidth * healthPercent, healthBarHeight);

        // Brilho na barra
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(x, y + 5, healthBarWidth * healthPercent, healthBarHeight / 2);

        // Texto da vida
        ctx.font = 'bold 12px Arial';
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.fillText(`${player.life} / ${player.maxLife}`, x + healthBarWidth / 2, y + 20);
        ctx.textAlign = 'left';

        // Borda da barra
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y + 5, healthBarWidth, healthBarHeight);

        // XP e Nível (se existir)
        if (player.level !== undefined) {
            ctx.font = 'bold 10px Arial';
            ctx.fillStyle = '#ffd700';
            ctx.fillText(`LV ${player.level}`, x, y + 40);

            // Barra de XP
            if (player.xp !== undefined && player.xpToNextLevel !== undefined) {
                const xpPercent = player.xp / player.xpToNextLevel;
                ctx.fillStyle = 'rgba(0, 0, 100, 0.8)';
                ctx.fillRect(x + 30, y + 32, 120, 8);
                
                ctx.fillStyle = '#ffd700';
                ctx.fillRect(x + 30, y + 32, 120 * xpPercent, 8);
                
                ctx.strokeStyle = '#ffd700';
                ctx.lineWidth = 1;
                ctx.strokeRect(x + 30, y + 32, 120, 8);
                
                ctx.font = '8px Arial';
                ctx.fillText(`${player.xp}/${player.xpToNextLevel} XP`, x + 32, y + 38);
            }
        }

        // Ícones de poder ativo
        if (player.powerActive) {
            const icon = player.powerType === 'speed' ? '⚡' :
                        player.powerType === 'strength' ? '💪' :
                        player.powerType === 'invincible' ? '🛡️' : '⭐';
            
            ctx.font = '20px Arial';
            ctx.fillText(icon, x + 160, y + 20);
            
            // Timer do poder
            ctx.font = '10px Arial';
            ctx.fillStyle = '#fff';
            ctx.fillText(Math.ceil(player.powerTimer / 60) + 's', x + 165, y + 35);
        }
    }

    /**
     * Desenhar informações do nível
     */
    drawLevelInfo(ctx, level, x, y) {
        if (!level) return;

        ctx.font = 'bold 14px Righteous, Arial';
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.shadowBlur = 5;
        ctx.shadowColor = '#000';
        
        ctx.fillText(`FASE ${level.id}`, x, y);
        ctx.font = '10px Arial';
        ctx.fillText(level.name, x, y + 15);
        
        ctx.shadowBlur = 0;
        ctx.textAlign = 'left';
    }

    /**
     * Desenhar pontuação
     */
    drawScore(ctx, score, x, y) {
        ctx.font = 'bold 16px Righteous, Arial';
        ctx.fillStyle = '#ffd700';
        ctx.textAlign = 'right';
        ctx.shadowBlur = 8;
        ctx.shadowColor = '#ffd700';
        
        ctx.fillText('SCORE', x, y);
        ctx.font = 'bold 20px Righteous, Arial';
        ctx.fillText(score.toLocaleString(), x, y + 20);
        
        ctx.shadowBlur = 0;
        ctx.textAlign = 'left';
    }

    /**
     * Desenhar contador de inimigos
     */
    drawEnemyCount(ctx, enemies, x, y) {
        const aliveEnemies = enemies.filter(e => e.life > 0).length;
        
        ctx.font = 'bold 12px Arial';
        ctx.fillStyle = '#ff4444';
        ctx.textAlign = 'right';
        ctx.fillText(`INIMIGOS: ${aliveEnemies}`, x, y);
        ctx.textAlign = 'left';
    }

    /**
     * Desenhar FPS
     */
    drawFPS(ctx) {
        const now = Date.now();
        const delta = now - this.lastFrameTime;
        this.fps = Math.round(1000 / delta);
        this.lastFrameTime = now;

        ctx.font = 'bold 12px monospace';
        ctx.fillStyle = '#0f0';
        ctx.textAlign = 'left';
        ctx.fillText(`FPS: ${this.fps}`, 10, 650 - 10);
    }

    /**
     * Adicionar notificação
     */
    addNotification(text, color = '#fff', duration = 3000) {
        this.notifications.push({
            text,
            color,
            duration,
            life: duration,
            y: 100,
            alpha: 1
        });
    }

    /**
     * Desenhar notificações
     */
    drawNotifications(ctx) {
        let yOffset = 100;
        
        this.notifications.forEach((notif, index) => {
            notif.life--;
            
            // Fade out nos últimos 30 frames
            if (notif.life < 30) {
                notif.alpha = notif.life / 30;
            }
            
            // Subir levemente
            notif.y -= 0.5;
            
            ctx.save();
            ctx.globalAlpha = notif.alpha;
            ctx.font = 'bold 20px Righteous, Arial';
            ctx.fillStyle = notif.color;
            ctx.textAlign = 'center';
            ctx.shadowBlur = 15;
            ctx.shadowColor = notif.color;
            ctx.fillText(notif.text, 500, notif.y + (index * 30));
            ctx.restore();
        });
        
        // Remover notificações expiradas
        this.notifications = this.notifications.filter(n => n.life > 0);
    }

    /**
     * Adicionar texto de dano
     */
    addDamageText(x, y, text, color = '#fff') {
        this.damageTexts.push({
            x, y, text, color,
            life: 60,
            vx: (Math.random() - 0.5) * 2,
            vy: -3,
            alpha: 1
        });
    }

    /**
     * Desenhar textos de dano
     */
    drawDamageTexts(ctx) {
        this.damageTexts.forEach(dt => {
            dt.life--;
            dt.y += dt.vy;
            dt.x += dt.vx;
            dt.vy += 0.2; // Gravidade
            
            if (dt.life < 20) {
                dt.alpha = dt.life / 20;
            }
            
            ctx.save();
            ctx.globalAlpha = dt.alpha;
            ctx.font = 'bold 18px Arial';
            ctx.fillStyle = dt.color;
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 3;
            ctx.textAlign = 'center';
            ctx.strokeText(dt.text, dt.x, dt.y);
            ctx.fillText(dt.text, dt.x, dt.y);
            ctx.restore();
        });
        
        this.damageTexts = this.damageTexts.filter(dt => dt.life > 0);
    }

    /**
     * Adicionar combo
     */
    addCombo(hits) {
        this.combos.push({
            hits,
            life: 120,
            scale: 2,
            alpha: 1
        });
    }

    /**
     * Desenhar combos
     */
    drawCombos(ctx) {
        this.combos.forEach(combo => {
            combo.life--;
            combo.scale = Math.max(1, combo.scale - 0.02);
            
            if (combo.life < 30) {
                combo.alpha = combo.life / 30;
            }
            
            ctx.save();
            ctx.globalAlpha = combo.alpha;
            ctx.font = `bold ${24 * combo.scale}px Righteous, Arial`;
            ctx.fillStyle = combo.hits >= 10 ? '#ff00ff' : 
                          combo.hits >= 5 ? '#ffd700' : '#fff';
            ctx.textAlign = 'center';
            ctx.shadowBlur = 20;
            ctx.shadowColor = ctx.fillStyle;
            ctx.fillText(`${combo.hits} HIT COMBO!`, 500, 200);
            ctx.restore();
        });
        
        this.combos = this.combos.filter(c => c.life > 0);
    }

    /**
     * Desenhar tela de pausa
     */
    drawPauseScreen(ctx) {
        // Overlay escuro
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, 1000, 650);
        
        // Texto PAUSA
        ctx.font = 'bold 80px Righteous, Arial';
        ctx.fillStyle = '#00ffff';
        ctx.textAlign = 'center';
        ctx.shadowBlur = 30;
        ctx.shadowColor = '#00ffff';
        ctx.fillText('PAUSA', 500, 300);
        
        // Instruções
        ctx.font = '20px Arial';
        ctx.fillStyle = '#fff';
        ctx.shadowBlur = 0;
        ctx.fillText('Pressione ESC para continuar', 500, 370);
        ctx.fillText('R para reiniciar nível', 500, 400);
        
        ctx.textAlign = 'left';
    }

    /**
     * Desenhar tela de vitória de nível
     */
    drawLevelCompleteScreen(ctx, stats) {
        // Overlay
        ctx.fillStyle = 'rgba(0, 20, 40, 0.95)';
        ctx.fillRect(0, 0, 1000, 650);
        
        // Título
        ctx.font = 'bold 60px Righteous, Arial';
        ctx.fillStyle = '#ffd700';
        ctx.textAlign = 'center';
        ctx.shadowBlur = 30;
        ctx.shadowColor = '#ffd700';
        ctx.fillText('FASE COMPLETA!', 500, 150);
        
        // Estatísticas
        ctx.font = '24px Arial';
        ctx.fillStyle = '#fff';
        ctx.shadowBlur = 0;
        
        const statsY = 250;
        const lineHeight = 40;
        
        if (stats) {
            ctx.fillText(`Inimigos Derrotados: ${stats.enemiesKilled || 0}`, 500, statsY);
            ctx.fillText(`Tempo: ${this.formatTime(stats.time || 0)}`, 500, statsY + lineHeight);
            ctx.fillText(`Pontos Ganhos: ${stats.score || 0}`, 500, statsY + lineHeight * 2);
            
            // Rank
            ctx.font = 'bold 40px Righteous, Arial';
            const rank = this.calculateRank(stats);
            const rankColor = rank === 'S' ? '#ffd700' : 
                            rank === 'A' ? '#00ff00' :
                            rank === 'B' ? '#00ffff' : '#fff';
            ctx.fillStyle = rankColor;
            ctx.shadowBlur = 20;
            ctx.shadowColor = rankColor;
            ctx.fillText(`RANK: ${rank}`, 500, statsY + lineHeight * 4);
        }
        
        // Instrução
        ctx.font = '18px Arial';
        ctx.fillStyle = '#aaa';
        ctx.shadowBlur = 0;
        ctx.fillText('Pressione ESPAÇO para continuar', 500, 550);
        
        ctx.textAlign = 'left';
    }

    /**
     * Calcular rank baseado em estatísticas
     */
    calculateRank(stats) {
        if (!stats) return 'C';
        
        let score = 0;
        if (stats.time < 60) score += 30;
        else if (stats.time < 120) score += 20;
        else score += 10;
        
        if (stats.enemiesKilled >= 20) score += 30;
        else if (stats.enemiesKilled >= 10) score += 20;
        else score += 10;
        
        if (stats.damageTaken < 50) score += 40;
        else if (stats.damageTaken < 100) score += 30;
        else if (stats.damageTaken < 200) score += 20;
        else score += 10;
        
        if (score >= 90) return 'S';
        if (score >= 75) return 'A';
        if (score >= 60) return 'B';
        return 'C';
    }

    /**
     * Formatar tempo em minutos:segundos
     */
    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    /**
     * Ajustar brilho de cor
     */
    adjustBrightness(color, amount) {
        const hex = color.replace('#', '');
        const r = Math.max(0, Math.min(255, parseInt(hex.substr(0, 2), 16) + amount));
        const g = Math.max(0, Math.min(255, parseInt(hex.substr(2, 2), 16) + amount));
        const b = Math.max(0, Math.min(255, parseInt(hex.substr(4, 2), 16) + amount));
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }

    /**
     * Toggle FPS display
     */
    toggleFPS() {
        this.showFPS = !this.showFPS;
    }
}

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.GameUI = GameUI;
}
