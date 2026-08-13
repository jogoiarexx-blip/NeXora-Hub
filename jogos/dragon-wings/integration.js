// ===== INTEGRAÇÃO DOS NOVOS SISTEMAS - DRAGON FURY =====

/**
 * Este arquivo integra todos os novos sistemas ao jogo principal
 * Sistemas incluídos:
 * - Dragon Escorts (Dragões Escolta)
 * - Enemy System (6 tipos de inimigos)
 * - Boss System (3 bosses únicos)
 * - Phase System (6 fases progressivas)
 * - Spawn System (Sistema inteligente de spawn)
 * - Collision System (Detecção otimizada)
 * - HUD System (Interface desenhada no Canvas)
 * - Rank System (Sistema de classificação)
 */

const gameIntegration = {
    initialized: false,
    
    init() {
        if (this.initialized) return;
        
        console.log('🔧 Inicializando sistemas avançados...');
        
        // Inicializar sistemas
        phaseSystem.init();
        spawnSystem.init();
        rankSystem.init();
        escortManager.init();
        
        // Sobrescrever métodos do jogo original
        this.integrateWithGameLoop();
        this.integrateWithReset();
        this.integrateWithDraw();
        
        this.initialized = true;
        console.log('✅ Sistemas avançados carregados!');
    },
    
    integrateWithGameLoop() {
        // Salvar update original
        const originalUpdate = game.update.bind(game);
        
        // Sobrescrever update
        game.update = function() {
            // Update do jogador
            dragon.update();
            
            // Update dos sistemas novos
            spawnSystem.update();
            spawnSystem.spawnPowerUp();
            spawnSystem.spawnCoin();
            
            // Update de dragões escolta
            if (escortManager.isActive()) {
                escortManager.updateAll();
            }
            
            // Update de inimigos (novo sistema)
            gameEntities.enemies.forEach(enemy => enemy.update());
            
            // Update de boss
            if (gameData.bossActive && gameEntities.boss) {
                gameEntities.boss.update();
            }
            
            // Update de fireballs
            gameEntities.fireballs.forEach(fb => {
                if (fb.vx !== undefined) fb.x += fb.vx;
                if (fb.vy !== undefined) {
                    fb.y += fb.vy;
                } else {
                    fb.y += fb.type === 'player' ? -fb.speed : fb.speed;
                }
            });
            
            // Update de moedas
            gameEntities.coins.forEach(coin => {
                if (coin.vx) coin.x += coin.vx;
                if (coin.vy) {
                    coin.y += coin.vy;
                } else {
                    coin.y += coin.speed || 2;
                }
                
                // Gravidade suave
                if (coin.vy !== undefined) {
                    coin.vy += 0.2;
                }
            });
            
            // Update de power-ups
            gameEntities.powerups.forEach(pu => {
                pu.y += pu.speed;
            });
            
            // Update de partículas
            gameEntities.particles.forEach((particle, index) => {
                particle.x += particle.vx;
                particle.y += particle.vy;
                particle.life--;
                
                if (particle.life <= 0) {
                    gameEntities.particles.splice(index, 1);
                }
            });
            
            // Sistema de colisão
            collisionSystem.checkAll();
            
            // Limpeza
            spawnSystem.cleanupOffscreen();
            
            // Verificar spawn de boss
            if (phaseSystem.shouldSpawnBoss()) {
                phaseSystem.spawnBoss();
            }
            
            // Incrementar distância e pontuação
            gameData.distanceTraveled += gameData.scrollSpeed * 0.1;
            gameData.scrollOffset += gameData.scrollSpeed;
            gameStats.score += Math.ceil(gameData.currentStage * 0.5);
            
            // Verificar conquistas
            achievementManager.check();
            
            // Verificar game over
            if (gameStats.health <= 0) {
                game.gameOver();
            }
            
            // Atualizar HUD
            ui.updateHUD();
        };
    },
    
    integrateWithDraw() {
        // Salvar draw original
        const originalDraw = game.draw.bind(game);
        
        // Sobrescrever draw
        game.draw = function() {
            const ctx = gameData.ctx;
            
            // Fundo da fase
            phaseSystem.drawBackground(ctx);
            
            // Desenhar estrelas
            entities.drawStars();
            
            // Desenhar moedas
            gameEntities.coins.forEach(coin => {
                ctx.fillStyle = '#FFD700';
                ctx.shadowBlur = 10;
                ctx.shadowColor = '#FFD700';
                ctx.beginPath();
                ctx.arc(coin.x + coin.width / 2, coin.y + coin.height / 2, 
                       coin.width / 2, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;
            });
            
            // Desenhar power-ups
            gameEntities.powerups.forEach(pu => {
                const icons = {
                    'health': '❤️',
                    'rapid_fire': '⚡',
                    'shield': '🛡️',
                    'bomb': '💣'
                };
                
                ctx.fillStyle = '#00FF00';
                ctx.shadowBlur = 15;
                ctx.shadowColor = '#00FF00';
                ctx.fillRect(pu.x, pu.y, pu.width, pu.height);
                
                ctx.font = '24px Arial';
                ctx.fillText(icons[pu.type] || '?', pu.x + 3, pu.y + 22);
                ctx.shadowBlur = 0;
            });
            
            // Desenhar inimigos
            gameEntities.enemies.forEach(enemy => enemy.draw(ctx));
            
            // Desenhar boss
            if (gameData.bossActive && gameEntities.boss) {
                gameEntities.boss.draw(ctx);
            }
            
            // Desenhar dragões escolta
            if (escortManager.isActive()) {
                escortManager.drawAll();
            }
            
            // Desenhar jogador
            dragon.draw();
            
            // Desenhar fireballs
            gameEntities.fireballs.forEach(fb => {
                ctx.fillStyle = fb.color || (fb.type === 'player' ? '#FF6B35' : '#FF0000');
                ctx.shadowBlur = 8;
                ctx.shadowColor = ctx.fillStyle;
                ctx.fillRect(fb.x, fb.y, fb.width, fb.height);
                ctx.shadowBlur = 0;
            });
            
            // Desenhar partículas
            gameEntities.particles.forEach(particle => {
                ctx.fillStyle = particle.color;
                ctx.globalAlpha = particle.life / 30;
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1;
            });
            
            // HUD Sistema
            hudSystem.draw(ctx);
        };
    },
    
    integrateWithReset() {
        // Salvar reset original
        const originalReset = game.reset.bind(game);
        
        // Sobrescrever reset
        game.reset = function() {
            // Reset original
            dragon.reset();
            
            gameStats.score = 0;
            gameStats.health = 100 + (upgrades.health.level * 20);
            gameStats.firepower = 1 + upgrades.firepower.level;
            gameStats.powerUpActive = null;
            gameStats.powerUpTimer = 0;
            
            gameData.scrollSpeed = 2;
            gameData.scrollOffset = 0;
            gameData.distanceTraveled = 0;
            gameData.bossActive = false;
            gameData.currentWave = 1;
            gameData.currentStage = 1;
            gameData.enemiesKilledThisStage = 0;
            
            gameEntities.coins = [];
            gameEntities.fireballs = [];
            gameEntities.enemies = [];
            gameEntities.particles = [];
            gameEntities.powerups = [];
            gameEntities.boss = null;
            
            // Reset dos novos sistemas
            phaseSystem.init();
            spawnSystem.init();
            rankSystem.init();
            escortManager.init();
            
            // Aplicar upgrade de escolta se comprado
            if (upgrades.escorts && upgrades.escorts.level > 0) {
                escortManager.activate();
            }
            
            gameStats.gamesPlayed++;
            localStorage.setItem('dragonGamesPlayed', gameStats.gamesPlayed);
            
            ui.updateHUD();
        };
    },
    
    // Método auxiliar para completar fase
    completePhase() {
        const finalRank = rankSystem.getFinalRank();
        
        // Bônus de rank
        gameStats.coins += finalRank.bonus;
        gameStats.totalCoins += finalRank.bonus;
        
        localStorage.setItem('dragonCoins', gameStats.coins);
        localStorage.setItem('dragonTotalCoins', gameStats.totalCoins);
        
        // Mostrar rank
        ui.showNotification(`🏆 Rank ${finalRank.letter} - Bônus: ${finalRank.bonus} moedas!`);
        
        // Avançar fase
        const hasNextPhase = phaseSystem.nextPhase();
        
        if (hasNextPhase) {
            // Curar jogador
            const healAmount = 50;
            gameStats.health = Math.min(
                100 + (upgrades.health.level * 20),
                gameStats.health + healAmount
            );
            
            // Reset do rank para próxima fase
            rankSystem.init();
            
            ui.showNotification(`✨ Fase ${phaseSystem.currentPhase} iniciada!`);
        } else {
            // Jogo completo!
            game.gameComplete();
        }
    }
};

// Auto-inicializar quando o DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        gameIntegration.init();
    });
} else {
    gameIntegration.init();
}

// Exportar para debug
if (typeof window !== 'undefined') {
    window.advancedSystems = {
        phaseSystem,
        spawnSystem,
        collisionSystem,
        hudSystem,
        rankSystem,
        escortManager
    };
}
