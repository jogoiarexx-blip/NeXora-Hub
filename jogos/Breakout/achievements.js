// achievements.js - Sistema de Conquistas
const ACHIEVEMENTS = {
    firstBlood: {
        id: 'firstBlood',
        name: "First Blood",
        desc: "Quebre seu primeiro brick",
        icon: "🎯",
        reward: 10,
        condition: () => Game.stats.stats.bricksDestroyed >= 1
    },
    
    combo5: {
        id: 'combo5',
        name: "Combo Master",
        desc: "Alcance combo de 5x",
        icon: "🔥",
        reward: 50,
        condition: () => Game.stats.stats.maxCombo >= 5
    },
    
    combo10: {
        id: 'combo10',
        name: "Combo God",
        desc: "Alcance combo de 10x",
        icon: "⚡",
        reward: 100,
        condition: () => Game.stats.stats.maxCombo >= 10
    },
    
    noLife: {
        id: 'noLife',
        name: "Perfeição",
        desc: "Complete um nível sem perder vidas",
        icon: "⭐",
        reward: 100,
        condition: () => Game.stats.stats.perfectLevel
    },
    
    speedRunner: {
        id: 'speedRunner',
        name: "Velocista",
        desc: "Complete um nível em menos de 60s",
        icon: "⏱️",
        reward: 75,
        condition: () => Game.stats.stats.fastestLevel < 60
    },
    
    richPlayer: {
        id: 'richPlayer',
        name: "Milionário",
        desc: "Acumule 1000 moedas",
        icon: "💰",
        reward: 200,
        condition: () => Game.stats.stats.totalCoins >= 1000
    },
    
    explosive: {
        id: 'explosive',
        name: "Demolidor",
        desc: "Destrua 50 bricks com explosões",
        icon: "💥",
        reward: 150,
        condition: () => Game.stats.stats.explosiveKills >= 50
    },
    
    survivor: {
        id: 'survivor',
        name: "Sobrevivente",
        desc: "Complete 10 níveis",
        icon: "🛡️",
        reward: 100,
        condition: () => Game.stats.stats.levelsCompleted >= 10
    },
    
    veteran: {
        id: 'veteran',
        name: "Veterano",
        desc: "Complete 25 níveis",
        icon: "🏆",
        reward: 250,
        condition: () => Game.stats.stats.levelsCompleted >= 25
    },
    
    legend: {
        id: 'legend',
        name: "Lenda",
        desc: "Complete 50 níveis",
        icon: "👑",
        reward: 500,
        condition: () => Game.stats.stats.levelsCompleted >= 50
    },
    
    bossSlayer: {
        id: 'bossSlayer',
        name: "Caçador de Bosses",
        desc: "Derrote seu primeiro boss",
        icon: "⚔️",
        reward: 200,
        condition: () => Game.stats.stats.bossesDefeated >= 1
    },
    
    powerCollector: {
        id: 'powerCollector',
        name: "Colecionador",
        desc: "Colete 50 power-ups",
        icon: "🎁",
        reward: 100,
        condition: () => Game.stats.stats.powerUpsCollected >= 50
    },
    
    sharpshooter: {
        id: 'sharpshooter',
        name: "Atirador Elite",
        desc: "Acerte 100 bricks consecutivos",
        icon: "🎯",
        reward: 150,
        // ✅ FIX: a propriedade real chama-se maxConsecutiveHits (não consecutiveHits)
        condition: () => Game.stats.stats.maxConsecutiveHits >= 100
    },
    
    lucky: {
        id: 'lucky',
        name: "Sortudo",
        desc: "Pegue um power-up de vida extra",
        icon: "🍀",
        reward: 50,
        condition: () => Game.stats.stats.extraLivesCollected >= 1
    },
    
    hoarder: {
        id: 'hoarder',
        name: "Acumulador",
        desc: "Tenha 500 moedas de uma vez",
        icon: "💎",
        reward: 100,
        condition: () => Game.data.coins >= 500
    },
    
    upgraded: {
        id: 'upgraded',
        name: "Evoluído",
        desc: "Compre 10 upgrades",
        icon: "📈",
        reward: 150,
        condition: () => Game.stats.stats.upgradesBought >= 10
    }
};

class AchievementSystem {
    constructor() {
        this.unlocked = this.load();
        this.queue = []; // Fila de notificações
        this.totalAchievements = Object.keys(ACHIEVEMENTS).length;
        
        console.log(`🏆 AchievementSystem inicializado (${this.unlocked.length}/${this.totalAchievements} desbloqueadas)`);
    }
    
    load() {
        const saved = localStorage.getItem('breakout_achievements');
        return saved ? JSON.parse(saved) : [];
    }
    
    save() {
        localStorage.setItem('breakout_achievements', JSON.stringify(this.unlocked));
    }
    
    check() {
        if (!Game.stats) return;
        
        for (let key in ACHIEVEMENTS) {
            if (this.unlocked.includes(key)) continue;
            
            const achievement = ACHIEVEMENTS[key];
            try {
                if (achievement.condition()) {
                    this.unlock(key);
                }
            } catch(e) {
                // Ignora erros de condição
            }
        }
    }
    
    unlock(key) {
        if (this.unlocked.includes(key)) return;
        
        this.unlocked.push(key);
        const achievement = ACHIEVEMENTS[key];
        
        console.log(`🏆 CONQUISTA DESBLOQUEADA: ${achievement.name}`);
        
        // Adiciona à fila de notificações
        this.queue.push({
            achievement,
            time: Date.now()
        });
        
        // Recompensa em moedas
        if (Game.economy && achievement.reward) {
            Game.economy.addCoins(achievement.reward);
        }
        
        // Som
        if (Game.audio) {
            Game.audio.play('upgrade');
        }
        
        // Partículas de celebração
        if (Game.particles) {
            for (let i = 0; i < 30; i++) {
                Game.particles.emit(
                    Game.width / 2 + (Math.random() - 0.5) * 200,
                    Game.height / 2,
                    1,
                    '#FFD700'
                );
            }
        }
        
        this.save();
    }
    
    getProgress() {
        return {
            unlocked: this.unlocked.length,
            total: this.totalAchievements,
            percentage: Math.floor((this.unlocked.length / this.totalAchievements) * 100)
        };
    }
    
    isUnlocked(id) {
        return this.unlocked.includes(id);
    }
    
    update() {
        // Remove notificações antigas
        this.queue = this.queue.filter(item => {
            return Date.now() - item.time < 5000; // 5 segundos
        });
    }
    
    draw(ctx) {
        // Desenha notificações da fila
        this.queue.forEach((item, i) => {
            const elapsed = Date.now() - item.time;
            const y = 100 + i * 100;
            
            // Fade in/out
            let alpha;
            if (elapsed < 300) {
                alpha = elapsed / 300;
            } else if (elapsed > 4700) {
                alpha = (5000 - elapsed) / 300;
            } else {
                alpha = 1;
            }
            
            // Slide in
            const slideOffset = elapsed < 300 ? (1 - elapsed / 300) * 100 : 0;
            
            ctx.save();
            ctx.globalAlpha = alpha;
            
            const x = Game.width - 320 + slideOffset;
            
            // Background
            ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
            ctx.fillRect(x, y, 300, 80);
            
            // Border dourado
            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = 3;
            ctx.strokeRect(x, y, 300, 80);
            
            // Brilho
            const gradient = ctx.createLinearGradient(x, y, x, y + 80);
            gradient.addColorStop(0, 'rgba(255, 215, 0, 0.3)');
            gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
            ctx.fillStyle = gradient;
            ctx.fillRect(x, y, 300, 80);
            
            // Icon
            ctx.font = '40px Arial';
            ctx.fillText(item.achievement.icon, x + 20, y + 55);
            
            // Texto
            ctx.fillStyle = '#FFD700';
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'left';
            ctx.fillText('🏆 CONQUISTA DESBLOQUEADA!', x + 80, y + 25);
            
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 16px Arial';
            ctx.fillText(item.achievement.name, x + 80, y + 45);
            
            ctx.fillStyle = '#aaa';
            ctx.font = '12px Arial';
            ctx.fillText(item.achievement.desc, x + 80, y + 62);
            
            // Reward
            if (item.achievement.reward) {
                ctx.fillStyle = '#FFD700';
                ctx.font = 'bold 12px Arial';
                ctx.textAlign = 'right';
                ctx.fillText(`+${item.achievement.reward} 💰`, x + 285, y + 75);
            }
            
            ctx.restore();
        });
    }
    
    drawAchievementsScreen(ctx) {
        // Título
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 40px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('🏆 CONQUISTAS', Game.width / 2, 60);
        
        // Progresso
        const progress = this.getProgress();
        ctx.fillStyle = '#fff';
        ctx.font = '20px Arial';
        ctx.fillText(`${progress.unlocked}/${progress.total} (${progress.percentage}%)`, Game.width / 2, 90);
        
        // Barra de progresso
        const barWidth = 400;
        const barX = Game.width / 2 - barWidth / 2;
        const barY = 100;
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.fillRect(barX, barY, barWidth, 20);
        
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(barX, barY, barWidth * (progress.percentage / 100), 20);
        
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 2;
        ctx.strokeRect(barX, barY, barWidth, 20);
        
        // Grid de conquistas
        const startY = 140;
        const cols = 4;
        const cellWidth = 180;
        const cellHeight = 100;
        const spacing = 10;
        
        let index = 0;
        for (let key in ACHIEVEMENTS) {
            const achievement = ACHIEVEMENTS[key];
            const unlocked = this.isUnlocked(key);
            
            const col = index % cols;
            const row = Math.floor(index / cols);
            
            const x = 20 + col * (cellWidth + spacing);
            const y = startY + row * (cellHeight + spacing);
            
            // Background
            ctx.fillStyle = unlocked ? 'rgba(255, 215, 0, 0.2)' : 'rgba(255, 255, 255, 0.1)';
            ctx.fillRect(x, y, cellWidth, cellHeight);
            
            // Border
            ctx.strokeStyle = unlocked ? '#FFD700' : '#555';
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, cellWidth, cellHeight);
            
            // Icon
            ctx.font = '30px Arial';
            ctx.fillStyle = unlocked ? '#FFD700' : '#555';
            ctx.textAlign = 'center';
            ctx.fillText(achievement.icon, x + 30, y + 45);
            
            // Nome
            ctx.font = 'bold 14px Arial';
            ctx.fillStyle = unlocked ? '#fff' : '#777';
            ctx.textAlign = 'left';
            ctx.fillText(achievement.name, x + 60, y + 30);
            
            // Descrição
            ctx.font = '11px Arial';
            ctx.fillStyle = unlocked ? '#ccc' : '#666';
            
            // Quebra texto em linhas
            const words = achievement.desc.split(' ');
            let line = '';
            let lineY = y + 50;
            
            words.forEach(word => {
                const testLine = line + word + ' ';
                const metrics = ctx.measureText(testLine);
                
                if (metrics.width > cellWidth - 70 && line !== '') {
                    ctx.fillText(line, x + 60, lineY);
                    line = word + ' ';
                    lineY += 15;
                } else {
                    line = testLine;
                }
            });
            ctx.fillText(line, x + 60, lineY);
            
            // Reward
            if (unlocked && achievement.reward) {
                ctx.fillStyle = '#FFD700';
                ctx.font = 'bold 12px Arial';
                ctx.textAlign = 'right';
                ctx.fillText(`${achievement.reward} 💰`, x + cellWidth - 10, y + cellHeight - 10);
            }
            
            // Lock icon se não desbloqueada
            if (!unlocked) {
                ctx.font = '20px Arial';
                ctx.fillStyle = '#555';
                ctx.textAlign = 'center';
                ctx.fillText('🔒', x + cellWidth - 25, y + 25);
            }
            
            index++;
        }
        
        // Instruções
        ctx.fillStyle = '#888';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Pressione ESC para voltar', Game.width / 2, Game.height - 30);
    }
}
