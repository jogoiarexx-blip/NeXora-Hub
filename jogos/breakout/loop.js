// loop.js - Game Loop Otimizado e Seguro

// ============================================
// 1. INICIALIZAÇÃO SEGURA DE SUBSISTEMAS
// ============================================
console.log('🎮 Inicializando Modern Breakout...');

function initializeGame() {
    try {
        // ✅ Verifica se Game.data existe
        if (!Game.data) {
            console.error('❌ Game.data não existe!');
            return false;
        }
        
        // Ordem correta de inicialização
        console.log('📦 Carregando subsistemas...');
        
        // ✅ NOVOS: Audio, PowerUps, Stats, Achievements, Leaderboard, LevelGen
        Game.audio = new AudioManager();
        console.log('✅ Audio carregado');
        
        Game.stats = new Statistics();
        console.log('✅ Statistics carregado');
        
        Game.achievements = new AchievementSystem();
        console.log('✅ Achievements carregado');
        
        Game.leaderboard = new Leaderboard();
        console.log('✅ Leaderboard carregado');
        
        Game.levelGenerator = new LevelGenerator();
        console.log('✅ LevelGenerator carregado');
        
        Game.powerUpManager = new PowerUpManager();
        console.log('✅ PowerUpManager carregado');
        
        Game.economy = new Economy();
        console.log('✅ Economy carregado');
        
        // ✅ FIX: SkinManager existia (skins_manager.js) mas nunca era
        // instanciado — a feature inteira de skins estava morta/inacessível.
        Game.skinManager = new SkinManager();
        console.log('✅ SkinManager carregado');
        
        Game.particles = new ParticleSystem();
        console.log('✅ Particles carregado');
        
        Game.hud = new HUD();
        console.log('✅ HUD carregado');
        
        Game.brickManager = new BrickManager();
        console.log('✅ BrickManager carregado');
        
        Game.paddle = new Paddle();
        console.log('✅ Paddle carregado');
        
        Game.ball = new Ball();
        console.log('✅ Ball carregado');
        
        Game.ui = new UI();
        console.log('✅ UI carregado');
        
        // Carrega nível inicial
        Game.brickManager.loadLevel(Game.data.level);
        
        // ✅ FIX BUG #8: Marca como inicializado
        Game.initialized = true;
        
        console.log('🎮 Jogo inicializado com sucesso!');
        return true;
        
    } catch (error) {
        console.error('❌ ERRO CRÍTICO na inicialização:', error);
        alert('Erro ao inicializar o jogo. Por favor, recarregue a página.\n\nDetalhes: ' + error.message);
        return false;
    }
}

// ============================================
// 2. CONTROLES GLOBAIS DO JOGO
// ============================================
let gameKeyHandler = (e) => {
    if (!Game.initialized) return;
    
    // ESC - Volta ao menu de estados especiais
    if (e.key === 'Escape') {
        if (Game.state === 'ACHIEVEMENTS' || 
            Game.state === 'LEADERBOARD' || 
            Game.state === 'STATISTICS' ||
            Game.state === 'SHOP') {
            Game.state = 'MENU';
            e.preventDefault();
            return;
        }
    }
    
    // R - Reset de estatísticas (só na tela de stats)
    if (e.key === 'r' || e.key === 'R') {
        if (Game.state === 'STATISTICS' && Game.stats) {
            if (confirm('Tem certeza que deseja resetar TODAS as estatísticas?')) {
                Game.stats.reset();
            }
            e.preventDefault();
            return;
        }
    }
    
    // Pausa
    if (Game.state === 'PLAYING') {
        if (e.key === 'p' || e.key === 'P') {
            Game.state = 'PAUSED';
            return;
        }
        
        // Lançamento da bola
        if ((e.code === 'Space' || e.key === ' ') && Game.ball && !Game.ball.active) {
            Game.ball.launch();
            e.preventDefault();
        }
    } 
    // Despausar
    else if (Game.state === 'PAUSED') {
        if (e.key === 'p' || e.key === 'P') {
            Game.state = 'PLAYING';
        }
    }
};

window.addEventListener('keydown', gameKeyHandler);

// ============================================
// 3. GAME LOOP PRINCIPAL COM FIXED TIMESTEP
// ============================================
let lastTime = performance.now();
let deltaTime = 0;
let fps = 0;
let frameCount = 0;
let fpsUpdateTime = 0;

// Fixed timestep para física consistente
const TARGET_FPS = 60;
const FIXED_TIMESTEP = 1 / TARGET_FPS;
let accumulator = 0;

function gameLoop(currentTime) {
    if (!Game.initialized) {
        requestAnimationFrame(gameLoop);
        return;
    }
    
    // Calcula delta time em segundos
    deltaTime = (currentTime - lastTime) / 1000;
    lastTime = currentTime;
    
    // Limita delta time para evitar grandes saltos (ex: tab inativa)
    if (deltaTime > 0.25) deltaTime = 0.25;
    
    // FPS counter (se debug mode)
    if (CONFIG.SYSTEM.DEBUG) {
        frameCount++;
        if (currentTime - fpsUpdateTime > 1000) {
            fps = frameCount;
            frameCount = 0;
            fpsUpdateTime = currentTime;
        }
    }
    
    // Fixed timestep para física consistente
    accumulator += deltaTime;
    
    while (accumulator >= FIXED_TIMESTEP) {
        // Update com timestep fixo
        try {
            updateGameLogic(FIXED_TIMESTEP);
        } catch (error) {
            console.error('❌ Erro no update:', error);
            // Tenta recuperar para o menu
            if (Game.state !== 'MENU') {
                Game.state = 'MENU';
            }
        }
        accumulator -= FIXED_TIMESTEP;
    }
    
    // ========================================
    // RENDER
    // ========================================
    try {
        clearScreen();
        renderCurrentState();
    } catch (error) {
        console.error('❌ Erro no render:', error);
    }
    
    // Debug info
    if (CONFIG.SYSTEM.DEBUG) {
        drawDebugInfo();
    }
    
    // Próximo frame
    requestAnimationFrame(gameLoop);
}

// ============================================
// FUNÇÕES DE UPDATE
// ============================================
function updateGameLogic(dt) {
    switch (Game.state) {
        case 'PLAYING':
            updateGame(dt);
            break;
        case 'MENU':
            updateMenu(dt);
            break;
        // Outros estados não precisam de update
    }
}

function updateGame(dt) {
    // ✅ FIX BUG #1: Adiciona verificações robustas (incluindo economy)
    if (!Game.paddle || !Game.ball || !Game.brickManager || 
        !Game.particles || !Game.hud || !Game.economy) {
        console.warn('⚠️ Componentes não inicializados!');
        return;
    }
    
    Game.paddle.update();
    
    // ✅ Passa paddle para ball.update
    Game.ball.update(Game.paddle);
    
    // ✅ FIX BUG #3: Atualiza e colide extraBalls (multiball)
    if (Game.extraBalls && Game.extraBalls.length > 0) {
        for (let i = Game.extraBalls.length - 1; i >= 0; i--) {
            const extraBall = Game.extraBalls[i];
            
            if (!extraBall.active) {
                Game.extraBalls.splice(i, 1);
                continue;
            }
            
            // Update da extra ball
            extraBall.x += extraBall.speedX * (Game.timeScale || 1.0);
            extraBall.y += extraBall.speedY * (Game.timeScale || 1.0);
            
            // Colisões com paredes
            if (extraBall.x + extraBall.radius > Game.width || extraBall.x - extraBall.radius < 0) {
                extraBall.speedX *= -1;
            }
            if (extraBall.y - extraBall.radius < 0) {
                extraBall.speedY *= -1;
            }
            
            // Colisão com paddle
            if (Game.paddle && extraBall.y + extraBall.radius > Game.paddle.y &&
                extraBall.x > Game.paddle.x && extraBall.x < Game.paddle.x + Game.paddle.width) {
                extraBall.speedY = -Math.abs(extraBall.speedY);
                extraBall.y = Game.paddle.y - extraBall.radius;
            }
            
            // Colisão com bricks
            Game.brickManager.bricks.forEach(brick => {
                if (brick.destroyed) return;
                
                const dx = Math.abs(extraBall.x - (brick.x + brick.width / 2));
                const dy = Math.abs(extraBall.y - (brick.y + brick.height / 2));
                
                if (dx < (brick.width / 2 + extraBall.radius) && 
                    dy < (brick.height / 2 + extraBall.radius)) {
                    extraBall.speedY *= -1;
                    brick.hit();
                }
            });
            
            // Remove se sair pela base
            if (extraBall.y > Game.height + 50) {
                Game.extraBalls.splice(i, 1);
            }
        }
    }
    
    // ✅ Passa ball para checkCollision
    Game.brickManager.checkCollision(Game.ball);
    
    Game.brickManager.update();
    Game.particles.update();
    Game.hud.update();
    
    // ✅ NOVO: Atualiza power-ups
    if (Game.powerUpManager) {
        Game.powerUpManager.update();
    }
    
    // ✅ NOVO: Atualiza achievements (verifica conquistas)
    if (Game.achievements) {
        Game.achievements.update();
    }
}

function updateMenu(dt) {
    // Partículas decorativas no menu
    if (Game.particles && Math.random() < 0.05) {
        Game.particles.emit(
            Math.random() * Game.width,
            0,
            3,
            `hsl(${Math.random() * 360}, 70%, 60%)`
        );
    }
    if (Game.particles) {
        Game.particles.update();
    }
}

// ============================================
// FUNÇÕES DE RENDER
// ============================================
function clearScreen() {
    Game.ctx.clearRect(0, 0, Game.width, Game.height);
    
    // Background com leve gradiente
    const gradient = Game.ctx.createLinearGradient(0, 0, 0, Game.height);
    gradient.addColorStop(0, '#0a0a0f');
    gradient.addColorStop(1, '#1a1a2e');
    Game.ctx.fillStyle = gradient;
    Game.ctx.fillRect(0, 0, Game.width, Game.height);
}

function renderCurrentState() {
    // Cursor visível nos menus e oculto somente durante a partida.
    const desiredCursor = Game.state === 'PLAYING' ? 'none' : 'pointer';
    if (Game.canvas.style.cursor !== desiredCursor) Game.canvas.style.cursor = desiredCursor;

    switch (Game.state) {
        case 'MENU':
            renderMenu();
            break;
        case 'SHOP':
            renderShop();
            break;
        case 'ACHIEVEMENTS':
            if (Game.achievements) {
                Game.achievements.drawAchievementsScreen(Game.ctx);
            }
            break;
        case 'LEADERBOARD':
            if (Game.leaderboard) {
                Game.leaderboard.draw(Game.ctx);
            }
            break;
        case 'STATISTICS':
            if (Game.stats) {
                Game.stats.drawStatsScreen(Game.ctx);
            }
            break;
        case 'PLAYING':
            renderGame();
            break;
        case 'PAUSED':
            renderGame();
            if (Game.ui) Game.ui.drawPaused();
            break;
        case 'GAME_OVER':
            renderGame();
            if (Game.ui) Game.ui.drawGameOver();
            break;
        default:
            console.warn(`Estado desconhecido: ${Game.state}`);
            Game.state = 'MENU';
    }
}

function renderGame() {
    // ✅ Verifica componentes antes de renderizar
    if (!Game.brickManager || !Game.particles || 
        !Game.paddle || !Game.ball || !Game.hud) {
        return;
    }
    
    // Ordem de renderização (back to front)
    Game.brickManager.draw();
    Game.particles.draw();
    Game.paddle.draw();
    Game.ball.draw();
    
    // ✅ FIX BUG #3: Desenha extra balls (multiball)
    if (Game.extraBalls && Game.extraBalls.length > 0) {
        const ctx = Game.ctx;
        Game.extraBalls.forEach(extraBall => {
            if (extraBall.active) {
                // Brilho
                ctx.shadowBlur = 15;
                ctx.shadowColor = '#00d2ff';
                
                // Bola
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(extraBall.x, extraBall.y, extraBall.radius, 0, Math.PI * 2);
                ctx.fill();
                
                // Border
                ctx.strokeStyle = '#00d2ff';
                ctx.lineWidth = 2;
                ctx.stroke();
                
                ctx.shadowBlur = 0;
            }
        });
    }
    
    // ✅ NOVO: Desenha power-ups
    if (Game.powerUpManager) {
        Game.powerUpManager.draw();
    }
    
    Game.hud.draw();
    
    // ✅ NOVO: Desenha notificações de conquistas (por cima de tudo)
    if (Game.achievements) {
        Game.achievements.draw(Game.ctx);
    }
}

function renderMenu() {
    if (Game.ui) {
        Game.ui.drawMenu();
    }
    
    if (Game.particles) {
        Game.particles.draw();
    }
}

function renderShop() {
    if (Game.ui) {
        Game.ui.drawShop();
    }
}

// ============================================
// DEBUG INFO
// ============================================
function drawDebugInfo() {
    const ctx = Game.ctx;
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(10, 70, 220, 160);
    
    ctx.fillStyle = '#0f0';
    ctx.font = '12px monospace';
    ctx.textAlign = 'left';
    
    const debugInfo = [
        `FPS: ${fps}`,
        `State: ${Game.state}`,
        `Lives: ${Game.data.lives}/${Game.data.maxLives}`,
        `Ball: ${Game.ball?.active ? 'Active' : 'Inactive'}`,
        `Speed: ${Game.ball ? Math.sqrt(Game.ball.speedX**2 + Game.ball.speedY**2).toFixed(2) : 0}`,
        `Bricks: ${Game.brickManager?.getActiveBricksCount() || 0}`,
        `Particles: ${Game.particles?.particles.length || 0}`,
        `Pool Free: ${Game.particles?.pool.filter(p => !p.active).length || 0}`,
        `Combo: ${Game.hud?.combo || 0}x`,
        `Delta: ${(deltaTime * 1000).toFixed(2)}ms`,
        `Accumulator: ${(accumulator * 1000).toFixed(2)}ms`
    ];
    
    debugInfo.forEach((line, i) => {
        ctx.fillText(line, 15, 85 + i * 14);
    });
}

// ============================================
// TRATAMENTO DE ERROS GLOBAL
// ============================================
window.addEventListener('error', (e) => {
    console.error('🔴 Erro fatal:', e.error);
    
    // Tenta recuperar para o menu
    if (Game.state !== 'MENU') {
        Game.state = 'MENU';
        alert('Ocorreu um erro. Retornando ao menu principal.');
    }
});

// ============================================
// CLEANUP AO SAIR
// ============================================
window.addEventListener('beforeunload', () => {
    console.log('💾 Salvando progresso...');
    
    if (Game.economy) {
        Game.economy.save();
    }
    
    // Cleanup de event listeners
    if (gameKeyHandler) {
        window.removeEventListener('keydown', gameKeyHandler);
    }
    
    if (Game.paddle) Game.paddle.destroy();
    if (Game.ui) Game.ui.destroy();
});

// ============================================
// INICIAR GAME
// ============================================
if (initializeGame()) {
    console.log('🚀 Iniciando game loop...');
    requestAnimationFrame(gameLoop);
    
    // Mensagem de boas-vindas
    setTimeout(() => {
        if (Game.state === 'MENU') {
            console.log('%c🎮 MODERN BREAKOUT v2.0', 'color: #00d2ff; font-size: 20px; font-weight: bold');
            console.log('%cControles:', 'color: #FFD700; font-weight: bold');
            console.log('  Movimento: ← → ou A D ou Mouse');
            console.log('  Lançar: SPACE');
            console.log('  Pausar: P');
            console.log('  Menu: ESC');
            console.log('\n%c⚠️ DEBUG MODE:', 'color: #ff0; font-weight: bold');
            console.log('  CONFIG.SYSTEM.DEBUG =', CONFIG.SYSTEM.DEBUG);
        }
    }, 1000);
} else {
    console.error('💥 Falha na inicialização do jogo');
}
