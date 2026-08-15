// stats.js - Sistema de Estatísticas do Jogador
class Statistics {
    constructor() {
        this.stats = this.load() || this.getDefaultStats();
        this.sessionStart = Date.now();
        this.levelStartTime = 0;
        this.levelStartLives = 3;
        
        console.log('📊 Statistics inicializado');
    }
    
    getDefaultStats() {
        return {
            // Gerais
            totalGamesPlayed: 0,
            totalScore: 0,
            totalCoins: 0,
            totalPlaytime: 0, // em segundos
            
            // Bricks
            bricksDestroyed: 0,
            normalBricksDestroyed: 0,
            strongBricksDestroyed: 0,
            metalBricksDestroyed: 0,
            diamondBricksDestroyed: 0,
            coinBricksDestroyed: 0,
            explosiveBricksDestroyed: 0,
            explosiveKills: 0, // Bricks destruídos por explosão
            
            // Níveis
            levelsCompleted: 0,
            highestLevel: 0,
            perfectLevels: 0, // Sem perder vida
            fastestLevel: Infinity,
            
            // Combos
            maxCombo: 0,
            totalCombos: 0,
            
            // Vidas
            totalLivesLost: 0,
            extraLivesCollected: 0,
            
            // Power-ups
            powerUpsCollected: 0,
            multiballCollected: 0,
            widePaddleCollected: 0,
            fireballCollected: 0,
            slowmoCollected: 0,
            coinRainCollected: 0,
            shieldCollected: 0,
            
            // Upgrades
            upgradesBought: 0,
            totalCoinsSpent: 0,
            
            // Bosses
            bossesDefeated: 0,
            bossAttempts: 0,
            
            // Acurácia
            ballsLaunched: 0,
            paddleHits: 0,
            wallBounces: 0,
            consecutiveHits: 0,
            maxConsecutiveHits: 0,
            
            // Recordes de sessão
            sessionHighScore: 0,
            sessionMaxCombo: 0,
            
            // Flags temporárias (para conquistas)
            perfectLevel: false,
            currentConsecutiveHits: 0
        };
    }
    
    load() {
        const saved = localStorage.getItem('breakout_stats');
        return saved ? JSON.parse(saved) : null;
    }
    
    save() {
        // Atualiza tempo de jogo
        const sessionTime = (Date.now() - this.sessionStart) / 1000;
        this.stats.totalPlaytime += sessionTime;
        this.sessionStart = Date.now();
        
        localStorage.setItem('breakout_stats', JSON.stringify(this.stats));
    }
    
    reset() {
        this.stats = this.getDefaultStats();
        this.save();
    }
    
    // ========================================
    // MÉTODOS DE REGISTRO
    // ========================================
    
    recordBrickDestroyed(type) {
        this.stats.bricksDestroyed++;
        
        switch(type) {
            case 'normal':
                this.stats.normalBricksDestroyed++;
                break;
            case 'strong':
                this.stats.strongBricksDestroyed++;
                break;
            case 'metal':
                this.stats.metalBricksDestroyed++;
                break;
            case 'diamond':
                this.stats.diamondBricksDestroyed++;
                break;
            case 'coin':
                this.stats.coinBricksDestroyed++;
                break;
            case 'explosive':
                this.stats.explosiveBricksDestroyed++;
                break;
        }
        
        this.stats.currentConsecutiveHits++;
        if (this.stats.currentConsecutiveHits > this.stats.maxConsecutiveHits) {
            this.stats.maxConsecutiveHits = this.stats.currentConsecutiveHits;
        }
    }
    
    recordExplosiveKill() {
        this.stats.explosiveKills++;
    }
    
    recordCombo(combo) {
        if (combo > this.stats.maxCombo) {
            this.stats.maxCombo = combo;
        }
        if (combo > this.stats.sessionMaxCombo) {
            this.stats.sessionMaxCombo = combo;
        }
        if (combo >= 2) {
            this.stats.totalCombos++;
        }
    }
    
    recordPowerUpCollected(type) {
        this.stats.powerUpsCollected++;
        
        switch(type) {
            case 'multiball':
                this.stats.multiballCollected++;
                break;
            case 'widePaddle':
                this.stats.widePaddleCollected++;
                break;
            case 'fireball':
                this.stats.fireballCollected++;
                break;
            case 'slowmo':
                this.stats.slowmoCollected++;
                break;
            case 'extraLife':
                this.stats.extraLivesCollected++;
                break;
            case 'coinRain':
                this.stats.coinRainCollected++;
                break;
            case 'shield':
                this.stats.shieldCollected++;
                break;
        }
    }
    
    recordUpgradeBought(cost) {
        this.stats.upgradesBought++;
        this.stats.totalCoinsSpent += cost;
    }
    
    recordLifeLost() {
        this.stats.totalLivesLost++;
        this.stats.perfectLevel = false;
        this.stats.currentConsecutiveHits = 0;
    }
    
    recordBallLaunched() {
        this.stats.ballsLaunched++;
    }
    
    recordPaddleHit() {
        this.stats.paddleHits++;
        // NÃO reseta consecutiveHits aqui - paddle hit é bom!
    }
    
    recordWallBounce() {
        this.stats.wallBounces++;
        // ✅ FIX BUG #7: Reset consecutiveHits ao bater na parede (erro)
        this.stats.currentConsecutiveHits = 0;
    }
    
    startLevel(level) {
        this.levelStartTime = Date.now();
        this.levelStartLives = Game.data.lives;
        this.stats.perfectLevel = true;
        
        if (level > this.stats.highestLevel) {
            this.stats.highestLevel = level;
        }
    }
    
    recordLevelComplete() {
        this.stats.levelsCompleted++;
        
        // Tempo do nível
        const levelTime = (Date.now() - this.levelStartTime) / 1000;
        if (levelTime < this.stats.fastestLevel) {
            this.stats.fastestLevel = levelTime;
        }
        
        // Nível perfeito? (não perdeu vida — ganhar vida extra no meio não deve invalidar)
        if (this.stats.perfectLevel && Game.data.lives >= this.levelStartLives) {
            this.stats.perfectLevels++;
        }
    }
    
    recordBossAttempt() {
        this.stats.bossAttempts++;
    }
    
    recordBossDefeated() {
        this.stats.bossesDefeated++;
    }
    
    recordGameStart() {
        this.stats.totalGamesPlayed++;
    }
    
    recordGameEnd(score, coins) {
        this.stats.totalScore += score;
        this.stats.totalCoins += coins;
        
        if (score > this.stats.sessionHighScore) {
            this.stats.sessionHighScore = score;
        }
        
        this.save();
    }
    
    // ========================================
    // GETTERS
    // ========================================
    
    getAccuracy() {
        if (this.stats.ballsLaunched === 0) return 0;
        return Math.floor((this.stats.paddleHits / this.stats.ballsLaunched) * 100);
    }
    
    getAverageScore() {
        if (this.stats.totalGamesPlayed === 0) return 0;
        return Math.floor(this.stats.totalScore / this.stats.totalGamesPlayed);
    }
    
    getAverageCombo() {
        if (this.stats.totalCombos === 0) return 0;
        return (this.stats.totalCombos / this.stats.levelsCompleted).toFixed(1);
    }
    
    getPlaytimeFormatted() {
        const hours = Math.floor(this.stats.totalPlaytime / 3600);
        const mins = Math.floor((this.stats.totalPlaytime % 3600) / 60);
        return `${hours}h ${mins}m`;
    }
    
    getMostCollectedPowerUp() {
        const powerUps = [
            { name: 'Multi-Bola', count: this.stats.multiballCollected },
            { name: 'Paddle Largo', count: this.stats.widePaddleCollected },
            { name: 'Bola de Fogo', count: this.stats.fireballCollected },
            { name: 'Slow Motion', count: this.stats.slowmoCollected },
            { name: 'Chuva de Moedas', count: this.stats.coinRainCollected },
            { name: 'Escudo', count: this.stats.shieldCollected }
        ];
        
        powerUps.sort((a, b) => b.count - a.count);
        return powerUps[0].count > 0 ? powerUps[0].name : 'Nenhum';
    }
    
    // ========================================
    // TELA DE ESTATÍSTICAS
    // ========================================
    
    drawStatsScreen(ctx) {
        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.95)';
        ctx.fillRect(0, 0, Game.width, Game.height);
        
        // Título
        ctx.fillStyle = '#00d2ff';
        ctx.font = 'bold 40px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('📊 ESTATÍSTICAS', Game.width / 2, 50);
        
        // Seções
        const sections = [
            {
                title: '🎮 Gerais',
                stats: [
                    ['Partidas Jogadas', this.stats.totalGamesPlayed],
                    ['Pontuação Total', this.stats.totalScore.toLocaleString()],
                    ['Pontuação Média', this.getAverageScore().toLocaleString()],
                    ['Tempo de Jogo', this.getPlaytimeFormatted()]
                ]
            },
            {
                title: '🎯 Níveis',
                stats: [
                    ['Níveis Completos', this.stats.levelsCompleted],
                    ['Nível Máximo', this.stats.highestLevel],
                    ['Níveis Perfeitos', this.stats.perfectLevels],
                    ['Recorde de Tempo', this.stats.fastestLevel === Infinity ? '-' : `${this.stats.fastestLevel.toFixed(1)}s`]
                ]
            },
            {
                title: '🧱 Bricks',
                stats: [
                    ['Total Destruídos', this.stats.bricksDestroyed],
                    ['💎 Diamante', this.stats.diamondBricksDestroyed],
                    ['🪙 Moeda', this.stats.coinBricksDestroyed],
                    ['💥 Por Explosão', this.stats.explosiveKills]
                ]
            },
            {
                title: '🔥 Combos & Acurácia',
                stats: [
                    ['Maior Combo', `${this.stats.maxCombo}x`],
                    ['Total de Combos', this.stats.totalCombos],
                    ['Sequência Máxima', this.stats.maxConsecutiveHits],
                    ['Acurácia', `${this.getAccuracy()}%`]
                ]
            },
            {
                title: '⚡ Power-ups',
                stats: [
                    ['Total Coletados', this.stats.powerUpsCollected],
                    ['Mais Coletado', this.getMostCollectedPowerUp()],
                    ['💚 Vidas Extras', this.stats.extraLivesCollected],
                    ['🛡️ Escudos', this.stats.shieldCollected]
                ]
            },
            {
                title: '👾 Bosses',
                stats: [
                    ['Derrotados', this.stats.bossesDefeated],
                    ['Tentativas', this.stats.bossAttempts],
                    ['Taxa de Vitória', this.stats.bossAttempts > 0 ? 
                        `${Math.floor((this.stats.bossesDefeated / this.stats.bossAttempts) * 100)}%` : '0%']
                ]
            }
        ];
        
        // Layout em grid 3x2
        const cols = 3;
        const startX = 30;
        const startY = 90;
        const sectionWidth = 240;
        const sectionHeight = 150;
        const spacing = 15;
        
        sections.forEach((section, index) => {
            const col = index % cols;
            const row = Math.floor(index / cols);
            
            const x = startX + col * (sectionWidth + spacing);
            const y = startY + row * (sectionHeight + spacing);
            
            // Background da seção
            ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
            ctx.fillRect(x, y, sectionWidth, sectionHeight);
            
            // Border
            ctx.strokeStyle = '#00d2ff';
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, sectionWidth, sectionHeight);
            
            // Título da seção
            ctx.fillStyle = '#FFD700';
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'left';
            ctx.fillText(section.title, x + 10, y + 25);
            
            // Stats
            section.stats.forEach((stat, i) => {
                const statY = y + 50 + (i * 25);
                
                // Label
                ctx.fillStyle = '#aaa';
                ctx.font = '13px Arial';
                ctx.fillText(stat[0], x + 10, statY);
                
                // Valor
                ctx.fillStyle = '#fff';
                ctx.font = 'bold 14px Arial';
                ctx.textAlign = 'right';
                ctx.fillText(String(stat[1]), x + sectionWidth - 10, statY);
                ctx.textAlign = 'left';
            });
        });
        
        // Recordes da sessão
        if (this.stats.sessionHighScore > 0) {
            const boxY = startY + 2 * (sectionHeight + spacing) + 20;
            
            ctx.fillStyle = 'rgba(255, 215, 0, 0.1)';
            ctx.fillRect(startX, boxY, Game.width - 60, 50);
            
            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = 2;
            ctx.strokeRect(startX, boxY, Game.width - 60, 50);
            
            ctx.fillStyle = '#FFD700';
            ctx.font = 'bold 18px Arial';
            ctx.textAlign = 'left';
            ctx.fillText('🏆 Recordes da Sessão:', startX + 15, boxY + 28);
            
            ctx.fillStyle = '#fff';
            ctx.font = '16px Arial';
            ctx.fillText(`Pontuação: ${this.stats.sessionHighScore.toLocaleString()}`, 
                startX + 250, boxY + 28);
            ctx.fillText(`Combo: ${this.stats.sessionMaxCombo}x`, 
                startX + 500, boxY + 28);
        }
        
        // Instruções
        ctx.fillStyle = '#888';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Pressione ESC para voltar | R para resetar estatísticas', 
            Game.width / 2, Game.height - 20);
    }
}
