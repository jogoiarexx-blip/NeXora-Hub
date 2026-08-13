// ===== LÓGICA PRINCIPAL DO JOGO - DRAGON FURY =====
// 🔧 VERSÃO CORRIGIDA - Problema de timers resolvido

const game = {
    
    init() {
        gameData.canvas = document.getElementById('gameCanvas');
        gameData.ctx = gameData.canvas.getContext('2d');
        
        this.setupEventListeners();
        entities.initStars();
        ui.renderAchievements();
        ui.renderUpgrades();
        ui.updateHUD();
    },
    
    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            keys[e.key] = true;
            
            if (gameData.gameState === 'playing') {
                if (e.key === 'Escape') {
                    this.pauseGame();
                }
            } else if (gameData.gameState === 'stage_complete') {
                if (e.key === 'Enter' || e.key === ' ') {
                    this.nextStage();
                }
            }
        });
        
        document.addEventListener('keyup', (e) => {
            keys[e.key] = false;
        });
    },
    
    startGame() {
        document.getElementById('main-menu').style.display = 'none';
        document.getElementById('gameCanvas').style.display = 'block';
        document.getElementById('hud').style.display = 'block';
        
        // 🔧 BUGFIX: Limpar timers ANTES de iniciar novo jogo
        this.clearAllTimers();
        
        gameData.gameState = 'playing';
        this.reset();
        this.loop();
    },
    
    reset() {
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
        gameData.stageTargetKills = stages[1].targetKills;
        
        // Reset combo
        gameData.comboMultiplier = 1;
        gameData.comboCount = 0;
        gameData.lastKillTime = 0;
        
        gameEntities.coins = [];
        gameEntities.fireballs = [];
        gameEntities.enemies = [];
        gameEntities.particles = [];
        gameEntities.powerups = [];
        gameEntities.boss = null;
        
        entities.waveTimer = 0;
        
        // Manter estrelas mas reposicionar
        if (gameEntities.stars.length === 0) {
            entities.initStars();
        }
        
        // ✨ NOVO: Inicializar parallax para fase 1
        if (typeof parallaxSystem !== 'undefined') {
            parallaxSystem.init(1);
        }
        
        // ✨ NOVO: Inicializar efeitos ambientais da fase 1
        if (typeof phaseEffects !== 'undefined') {
            phaseEffects.init(1);
        }
        
        // ✨ RANK SYSTEM: Iniciar tracking
        if (typeof rankSystem !== 'undefined') {
            rankSystem.startPhase();
        }
        
        gameStats.gamesPlayed++;
        localStorage.setItem('dragonGamesPlayed', gameStats.gamesPlayed);
        
        ui.updateHUD();
    },
    
    // 🔧 NOVO: Função centralizada para limpar todos os timers
    clearAllTimers() {
        console.log('🧹 Limpando todos os timers...');
        
        // Limpar timer de auto-avanço de fase
        if (gameData.stageCompleteTimer) {
            clearTimeout(gameData.stageCompleteTimer);
            gameData.stageCompleteTimer = null;
            console.log('  ✅ stageCompleteTimer limpo');
        }
        
        // Limpar contador regressivo visual
        if (gameData.stageCompleteCountdown) {
            clearInterval(gameData.stageCompleteCountdown);
            gameData.stageCompleteCountdown = null;
            console.log('  ✅ stageCompleteCountdown limpo');
        }
        
        // 🔧 ADICIONAL: Limpar animationFrame se existir
        if (gameData.animationId) {
            cancelAnimationFrame(gameData.animationId);
            gameData.animationId = null;
            console.log('  ✅ animationFrame cancelado');
        }
    },
    
    pauseGame() {
        if (gameData.gameState === 'playing') {
            gameData.gameState = 'paused';
            ui.showPauseMenu();
            
            // 🔧 BUGFIX: Usar função centralizada de limpeza
            this.clearAllTimers();
        }
    },
    
    resumeGame() {
        gameData.gameState = 'playing';
        ui.hidePauseMenu();
        gameData.lastTime = performance.now();
        this.loop();
    },
    
    returnToMenu() {
        console.log('🏠 Retornando ao menu principal...');
        
        // 🔧 BUGFIX: Limpar timers PRIMEIRO (antes de mudar estado)
        this.clearAllTimers();
        
        gameData.gameState = 'menu';
        document.getElementById('gameCanvas').style.display = 'none';
        document.getElementById('hud').style.display = 'none';
        
        // Esconder todos os overlays
        ui.hidePauseMenu();
        ui.hideGameOver();
        ui.hideStageComplete();
        ui.hideGameComplete(); // 🔧 ADICIONAL: Garantir que game complete também suma
        
        document.getElementById('main-menu').style.display = 'block';
        
        console.log('✅ Retorno ao menu concluído');
    },
    
    restartGame() {
        console.log('🔄 Reiniciando jogo...');
        
        // 🔧 BUGFIX: Limpar timers antes de reiniciar
        this.clearAllTimers();
        
        ui.hideGameOver();
        ui.hideGameComplete(); // 🔧 ADICIONAL
        
        gameData.gameState = 'playing';
        this.reset();
        this.loop();
    },
    
    completeStage() {
        console.log(`🎉 Fase ${gameData.currentStage} completa!`);
        
        // 🔧 BUGFIX: Limpar timers antigos ANTES de criar novos
        this.clearAllTimers();
        
        gameData.gameState = 'stage_complete';
        
        // Recompensas por completar fase
        const stageBonus = gameData.currentStage * 100;
        gameStats.coins += stageBonus;
        gameStats.totalCoins += stageBonus;
        gameStats.score += stageBonus * 10;
        
        // Atualizar fase máxima alcançada
        if (gameData.currentStage > gameStats.maxStageReached) {
            gameStats.maxStageReached = gameData.currentStage;
            localStorage.setItem('dragonMaxStage', gameStats.maxStageReached);
        }
        
        localStorage.setItem('dragonCoins', gameStats.coins);
        localStorage.setItem('dragonTotalCoins', gameStats.totalCoins);
        
        ui.showStageComplete();
        achievementManager.check();
        
        // ✨ Timer de auto-avanço após 5 segundos
        console.log('⏰ Configurando timer de auto-avanço (5s)...');
        gameData.stageCompleteTimer = setTimeout(() => {
            console.log('⏰ Timer de auto-avanço disparado');
            // 🔧 BUGFIX: Verificação RIGOROSA do estado antes de avançar
            if (gameData.gameState === 'stage_complete') {
                console.log('✅ Estado correto, avançando fase...');
                this.nextStage();
            } else {
                console.log('⚠️ Estado mudou, cancelando auto-avanço. Estado atual:', gameData.gameState);
            }
        }, 5000);
    },
    
    nextStage() {
        console.log(`➡️ Avançando para próxima fase...`);
        
        // 🔧 BUGFIX: Limpar timers IMEDIATAMENTE ao avançar manualmente
        this.clearAllTimers();
        
        ui.hideStageComplete();
        
        // Verificar se há mais fases
        if (gameData.currentStage >= Object.keys(stages).length) {
            // Jogo completo!
            console.log('🏆 Todas as fases completadas!');
            this.gameComplete();
            return;
        }
        
        const previousStage = gameData.currentStage;
        
        // Avançar para próxima fase
        gameData.currentStage++;
        gameData.enemiesKilledThisStage = 0;
        gameData.stageTargetKills = stages[gameData.currentStage].targetKills;
        gameData.bossActive = false;
        gameData.currentWave = 1;
        entities.waveTimer = 0;
        
        console.log(`📍 Nova fase: ${gameData.currentStage} - ${stages[gameData.currentStage].name}`);
        
        // Limpar entidades
        gameEntities.enemies = [];
        gameEntities.fireballs = gameEntities.fireballs.filter(f => f.type === 'player');
        gameEntities.powerups = [];
        gameEntities.boss = null;
        
        // Curar parcialmente o jogador
        const healAmount = 50;
        gameStats.health = Math.min(100 + (upgrades.health.level * 20), 
                                    gameStats.health + healAmount);
        
        // Ajustar velocidade baseado na fase
        gameData.scrollSpeed = 2 * stages[gameData.currentStage].speedMultiplier;
        
        // ✨ NOVO: Iniciar transição visual entre fases
        const transitionTypes = {
            1: 'fade',
            2: 'shake',   // Tempestade chega com tremor
            3: 'flash',   // Fúria ardente com flash de fogo
            4: 'fade',    // Abismo com fade para escuro
            5: 'warp'     // Cósmico com efeito warp
        };
        
        if (typeof phaseTransitions !== 'undefined') {
            phaseTransitions.startTransition(
                previousStage, 
                gameData.currentStage, 
                transitionTypes[gameData.currentStage] || 'fade'
            );
        }
        
        // ✨ NOVO: Inicializar parallax para a nova fase
        if (typeof parallaxSystem !== 'undefined') {
            parallaxSystem.init(gameData.currentStage);
        }
        
        // ✨ NOVO: Inicializar efeitos ambientais da nova fase
        if (typeof phaseEffects !== 'undefined') {
            phaseEffects.init(gameData.currentStage);
        }
        
        // ✨ RANK SYSTEM: Reiniciar tracking para nova fase
        if (typeof rankSystem !== 'undefined') {
            rankSystem.startPhase();
        }
        
        gameData.gameState = 'playing';
        ui.updateHUD();
        ui.showNotification(`🎮 Fase ${gameData.currentStage}: ${stages[gameData.currentStage].name}`);
        this.loop();
    },
    
    gameComplete() {
        console.log('🏆 Jogo completado!');
        
        // 🔧 BUGFIX: Limpar timers ao completar jogo
        this.clearAllTimers();
        
        // Bonus especial por completar o jogo
        gameStats.coins += 1000;
        gameStats.totalCoins += 1000;
        gameStats.score += 10000;
        
        localStorage.setItem('dragonCoins', gameStats.coins);
        localStorage.setItem('dragonTotalCoins', gameStats.totalCoins);
        
        ui.showGameComplete();
        achievementManager.check();
    },
    
    update() {
        // ✨ NOVO: Atualizar transições visuais
        if (typeof phaseTransitions !== 'undefined') {
            phaseTransitions.update();
        }
        
        // ✨ NOVO: Atualizar parallax
        if (typeof parallaxSystem !== 'undefined') {
            parallaxSystem.update();
        }
        
        // Atualizar jogador
        dragon.update();
        
        // ✨ NOVO: Atualizar efeitos ambientais da fase
        if (typeof phaseEffects !== 'undefined') {
            phaseEffects.update();
        }
        
        // Spawn de elementos
        entities.spawnEnemy();
        entities.spawnCoin();
        entities.spawnPowerUp();
        
        // Atualizar todas as entidades
        entities.updateAll();
        
        // Incrementar distância e pontuação
        gameData.distanceTraveled += gameData.scrollSpeed * 0.1;
        gameData.scrollOffset += gameData.scrollSpeed;
        gameStats.score += Math.ceil(gameData.currentStage * 0.5);
        
        // Verificar se completou a fase
        const currentStageData = stages[gameData.currentStage];
        if (gameData.enemiesKilledThisStage >= currentStageData.targetKills && !gameData.bossActive) {
            // Spawnar boss da fase
            entities.spawnStageBoss();
        }
        
        // Verificar conquistas
        achievementManager.check();
        
        // Verificar game over
        if (gameStats.health <= 0) {
            this.gameOver();
        }
        
        ui.updateHUD();
    },
    
    draw() {
        const ctx = gameData.ctx;
        
        // ✨ NOVO: Aplicar offset de tremor se houver transição shake
        let shakeOffset = { x: 0, y: 0 };
        if (typeof phaseTransitions !== 'undefined' && phaseTransitions.isInTransition()) {
            shakeOffset = phaseTransitions.getShakeOffset();
        }
        
        ctx.save();
        ctx.translate(shakeOffset.x, shakeOffset.y);
        
        // Fundo baseado na fase atual
        const currentStageData = stages[gameData.currentStage];
        const gradient = ctx.createLinearGradient(0, 0, 0, gameData.canvas.height);
        gradient.addColorStop(0, currentStageData.background.color1);
        gradient.addColorStop(0.5, currentStageData.background.color2);
        gradient.addColorStop(1, currentStageData.background.color3);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, gameData.canvas.width, gameData.canvas.height);
        
        // ✨ NOVO: Desenhar camadas de parallax (estrelas, nuvens, etc)
        if (typeof parallaxSystem !== 'undefined') {
            parallaxSystem.draw(ctx);
        }
        
        // ✨ NOVO: Desenhar efeitos ambientais da fase (nuvens, raios, fogo, etc)
        if (typeof phaseEffects !== 'undefined') {
            phaseEffects.draw(ctx);
        }
        
        // Desenhar elementos
        entities.drawAll();
        dragon.draw();
        
        ctx.restore();
        
        // ✨ NOVO: Desenhar overlay de transição (sem tremor)
        if (typeof phaseTransitions !== 'undefined') {
            phaseTransitions.draw(ctx);
        }
        
        // Informações na tela (sempre no topo, sem tremor)
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'left';
        ctx.shadowBlur = 3;
        ctx.shadowColor = '#000';
        
        // Fase atual
        ctx.fillText(`Fase: ${gameData.currentStage} - ${currentStageData.name}`, 20, 30);
        
        // Progresso da fase
        const progress = Math.floor((gameData.enemiesKilledThisStage / gameData.stageTargetKills) * 100);
        ctx.fillText(`Progresso: ${gameData.enemiesKilledThisStage}/${gameData.stageTargetKills} (${progress}%)`, 20, 55);
        
        // Distância
        ctx.fillText(`Distância: ${Math.floor(gameData.distanceTraveled)}m`, 20, 80);
        
        // Indicador de power-up
        if (gameStats.powerUpActive) {
            ctx.fillStyle = '#00FF00';
            const timeLeft = Math.ceil(gameStats.powerUpTimer / 60);
            ctx.fillText(`⚡ ${gameStats.powerUpActive.toUpperCase().replace('_', ' ')}: ${timeLeft}s`, 
                        20, 105);
        }
        
        // Sistema de Combo - Indicador Visual
        if (gameData.comboCount > 1) {
            const timeSinceLastKill = Date.now() - gameData.lastKillTime;
            const timeLeft = 2000 - timeSinceLastKill;
            const alpha = Math.min(1, timeLeft / 2000);
            
            ctx.save();
            
            // Fundo do combo
            ctx.fillStyle = `rgba(0, 0, 0, ${0.6 * alpha})`;
            ctx.fillRect(gameData.canvas.width / 2 - 100, gameData.canvas.height - 80, 200, 40);
            
            // Borda animada
            const hue = (Date.now() / 10) % 360;
            ctx.strokeStyle = `hsla(${hue}, 100%, 50%, ${alpha})`;
            ctx.lineWidth = 3;
            ctx.strokeRect(gameData.canvas.width / 2 - 100, gameData.canvas.height - 80, 200, 40);
            
            // Texto do combo
            ctx.fillStyle = gameData.comboCount >= 10 ? '#FFD700' : 
                           gameData.comboCount >= 5 ? '#FF6B35' : '#FFFFFF';
            ctx.font = 'bold 24px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.shadowBlur = 10;
            ctx.shadowColor = ctx.fillStyle;
            
            const scale = 1 + Math.sin(Date.now() / 100) * 0.1;
            ctx.save();
            ctx.translate(gameData.canvas.width / 2, gameData.canvas.height - 60);
            ctx.scale(scale, scale);
            ctx.fillText(`🔥 COMBO ${gameData.comboCount}x`, 0, 0);
            ctx.restore();
            
            // Subtexto com multiplicador
            ctx.font = '14px Arial';
            ctx.fillStyle = `rgba(255, 215, 0, ${alpha})`;
            ctx.shadowBlur = 5;
            ctx.fillText(`${gameData.comboMultiplier.toFixed(1)}x PONTOS`, 
                        gameData.canvas.width / 2, 
                        gameData.canvas.height - 45);
            
            // Barra de tempo
            const barWidth = 180;
            const barProgress = timeLeft / 2000;
            ctx.fillStyle = `rgba(255, 255, 255, 0.3)`;
            ctx.fillRect(gameData.canvas.width / 2 - barWidth / 2, 
                        gameData.canvas.height - 85, 
                        barWidth, 3);
            ctx.fillStyle = barProgress > 0.5 ? '#00FF00' : 
                           barProgress > 0.25 ? '#FFD700' : '#FF0000';
            ctx.fillRect(gameData.canvas.width / 2 - barWidth / 2, 
                        gameData.canvas.height - 85, 
                        barWidth * barProgress, 3);
            
            ctx.restore();
        }
        
        ctx.shadowBlur = 0;
        ctx.textAlign = 'left';
    },
    
    loop(currentTime = 0) {
        if (gameData.gameState !== 'playing') return;
        
        const deltaTime = currentTime - gameData.lastTime;
        gameData.lastTime = currentTime;
        
        this.update();
        this.draw();
        
        gameData.animationId = requestAnimationFrame((time) => this.loop(time));
    },
    
    gameOver() {
        console.log('💀 Game Over');
        
        // 🔧 BUGFIX: Limpar timers ao dar game over
        this.clearAllTimers();
        
        gameData.gameState = 'gameover';
        
        // Atualizar estatísticas totais
        gameStats.totalScore += gameStats.score;
        localStorage.setItem('dragonTotalScore', gameStats.totalScore);
        
        // Atualizar distância máxima
        if (gameData.distanceTraveled > gameStats.maxDistance) {
            gameStats.maxDistance = Math.floor(gameData.distanceTraveled);
            localStorage.setItem('dragonMaxDistance', gameStats.maxDistance);
        }
        
        ui.showGameOver();
        achievementManager.check();
    }
};
