// ui.js - Interface de Menus Otimizada
class UI {
    constructor() {
        this.menuOption = 0;
        this.shopOption = 0;
        this.lastInputTime = 0;
        this.inputDelay = 150; // ms entre inputs
        
        // Armazena handler para cleanup
        this.keyHandler = null;
        this.setupInput();
    }

    setupInput() {
        // Remove handler anterior se existir
        if (this.keyHandler) {
            window.removeEventListener('keydown', this.keyHandler);
        }
        
        this.keyHandler = (e) => {
            const now = Date.now();
            if (now - this.lastInputTime < this.inputDelay) return;
            
            switch(Game.state) {
                case 'MENU':
                    this.handleMenuInput(e);
                    break;
                case 'SHOP':
                    this.handleShopInput(e);
                    break;
                case 'PAUSED':
                    this.handlePausedInput(e);
                    break;
                case 'GAME_OVER':
                    this.handleGameOverInput(e);
                    break;
            }
            
            this.lastInputTime = now;
        };
        
        window.addEventListener('keydown', this.keyHandler);
    }

    handleMenuInput(e) {
        const maxOptions = 7; // 7 opções no menu
        
        if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
            this.menuOption = Math.max(0, this.menuOption - 1);
        }
        if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
            this.menuOption = Math.min(maxOptions - 1, this.menuOption + 1);
        }
        if (e.key === 'Enter' || e.code === 'Space') {
            this.selectMenuOption();
        }
    }

    selectMenuOption() {
        switch(this.menuOption) {
            case 0: // Jogar
                this.startGame();
                break;
            case 1: // Loja
                Game.state = 'SHOP';
                this.shopOption = 0;
                break;
            case 2: // Conquistas
                Game.state = 'ACHIEVEMENTS';
                break;
            case 3: // Placar
                Game.state = 'LEADERBOARD';
                break;
            case 4: // Estatísticas
                Game.state = 'STATISTICS';
                break;
            case 5: // Controles
                this.showControls();
                break;
            case 6: // Créditos
                this.showCredits();
                break;
        }
    }

    startGame() {
        // ✅ Valida que componentes existem
        if (!Game.brickManager || !Game.ball || !Game.paddle) {
            console.error('❌ Game components not initialized!');
            alert('Erro ao iniciar jogo. Por favor, recarregue a página.');
            return;
        }
        
        // ✅ Verifica se Game.data existe
        if (!Game.data) {
            console.error('❌ Game.data não existe!');
            alert('Erro ao iniciar jogo. Por favor, recarregue a página.');
            return;
        }
        
        // Reset do jogo
        Game.data.score = 0;
        Game.data.level = 1;
        
        // ✅ SEMPRE reseta vidas para o máximo
        Game.data.lives = Game.data.maxLives || 3;
        
        // ✅ STATS: Registra início de jogo
        if (Game.stats) {
            Game.stats.recordGameStart();
        }
        
        Game.brickManager.loadLevel(1);
        Game.ball.reset();
        Game.paddle.reset();
        
        if (Game.hud) {
            Game.hud.combo = 0;
            Game.hud.maxCombo = 0;
            Game.hud.displayScore = 0;
        }
        
        // ✅ POWER-UPS: Limpa power-ups ativos
        if (Game.powerUpManager) {
            Game.powerUpManager.clear();
        }
        
        // ✅ FIX: Cancela timers de power-ups de duração pendentes da partida anterior
        if (Game.activePowerUpTimers) {
            Object.values(Game.activePowerUpTimers).forEach(t => clearTimeout(t));
            Game.activePowerUpTimers = {};
        }
        
        Game.state = 'PLAYING';
    }

    handleShopInput(e) {
        // ✅ Verifica se Game.economy existe
        if (!Game.economy) {
            console.error('Game.economy não existe!');
            return;
        }
        
        const upgrades = Object.keys(Game.economy.upgrades);
        const maxOptions = upgrades.length;
        
        if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
            this.shopOption = Math.max(0, this.shopOption - 1);
        }
        if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
            this.shopOption = Math.min(maxOptions - 1, this.shopOption + 1);
        }
        if (e.key === 'Escape') {
            Game.state = 'MENU';
            this.menuOption = 0;
        }
        if (e.key === 'Enter' || e.code === 'Space') {
            this.buyUpgrade(upgrades[this.shopOption]);
        }
    }

    buyUpgrade(key) {
        if (!Game.economy) {
            console.error('Game.economy não existe!');
            return;
        }
        
        if (Game.economy.buy(key)) {
            // Sucesso
            Game.particles.emit(Game.width / 2, Game.height / 2, 30, '#FFD700');
        } else {
            // Falha - moedas insuficientes ou max level
            const upgrade = Game.economy.upgrades[key];
            if (upgrade.level >= upgrade.maxLevel) {
                // Já está no máximo
                Game.particles.emit(Game.width / 2, Game.height / 2, 20, '#888');
            } else {
                // Moedas insuficientes
                Game.particles.emit(Game.width / 2, Game.height / 2, 20, '#f44336');
            }
        }
    }

    handlePausedInput(e) {
        if (e.key === 'p' || e.key === 'P') {
            Game.state = 'PLAYING';
        }
        if (e.key === 'Escape') {
            Game.state = 'MENU';
        }
    }

    handleGameOverInput(e) {
        if (e.key === 'r' || e.key === 'R') {
            this.startGame();
        }
        if (e.key === 'Escape') {
            Game.state = 'MENU';
        }
    }

    showControls() {
        alert(
            '🎮 CONTROLES 🎮\n\n' +
            '⌨️ MOVIMENTO:\n' +
            '• Setas ← → ou teclas A/D\n' +
            '• Siga o mouse\n\n' +
            '🎯 AÇÕES:\n' +
            '• ESPAÇO - Lançar bola\n' +
            '• P - Pausar\n' +
            '• ESC - Menu\n\n' +
            '💰 SISTEMA:\n' +
            '• Quebre tijolos para ganhar moedas\n' +
            '• Use moedas para comprar upgrades\n' +
            '• Mantenha combos para bônus!'
        );
    }

    showCredits() {
        alert(
            '🎮 MODERN BREAKOUT 🎮\n\n' +
            'Desenvolvido com JavaScript Puro\n' +
            'Canvas API & HTML5\n\n' +
            '✨ Features:\n' +
            '• Sistema de Upgrades\n' +
            '• Combo System\n' +
            '• Particle Effects\n' +
            '• Progressive Difficulty\n\n' +
            'Versão 2.0 - Refatorada'
        );
    }

    drawMenu() {
        const ctx = Game.ctx;
        
        // Background com gradiente animado
        const time = Date.now() / 1000;
        const gradient = ctx.createLinearGradient(0, 0, Game.width, Game.height);
        gradient.addColorStop(0, '#0a0a0f');
        gradient.addColorStop(0.5, `rgba(0, ${100 + Math.sin(time) * 50}, ${150 + Math.cos(time) * 50}, 0.3)`);
        gradient.addColorStop(1, '#0a0a0f');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, Game.width, Game.height);

        // Título com efeito
        ctx.textAlign = 'center';
        ctx.font = 'bold 72px Arial';
        
        // Sombra do título
        ctx.fillStyle = 'rgba(0, 210, 255, 0.3)';
        ctx.fillText('BREAKOUT', Game.width / 2 + 4, 154);
        
        // Título principal
        ctx.fillStyle = '#00d2ff';
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#00d2ff';
        ctx.fillText('BREAKOUT', Game.width / 2, 150);
        ctx.shadowBlur = 0;

        // Subtítulo
        ctx.font = '20px Arial';
        ctx.fillStyle = '#888';
        ctx.fillText('Modern Edition', Game.width / 2, 190);

        // Opções do menu
        const options = [
            { text: '▶ JOGAR', icon: '🎮' },
            { text: '💰 LOJA', icon: '🛒' },
            { text: '🏆 CONQUISTAS', icon: '⭐' },
            { text: '📊 PLACAR', icon: '🏅' },
            { text: '📈 ESTATÍSTICAS', icon: '📉' },
            { text: '🎮 CONTROLES', icon: '⌨️' },
            { text: 'ℹ️ CRÉDITOS', icon: '📜' }
        ];
        
        const startY = 280;
        const spacing = 70;
        
        options.forEach((opt, i) => {
            const y = startY + i * spacing;
            const isSelected = i === this.menuOption;
            
            // Background da opção selecionada
            if (isSelected) {
                ctx.fillStyle = 'rgba(0, 210, 255, 0.2)';
                const boxWidth = 300;
                const boxHeight = 50;
                ctx.fillRect(
                    Game.width / 2 - boxWidth / 2,
                    y - 35,
                    boxWidth,
                    boxHeight
                );
                
                // Borda
                ctx.strokeStyle = '#00d2ff';
                ctx.lineWidth = 2;
                ctx.strokeRect(
                    Game.width / 2 - boxWidth / 2,
                    y - 35,
                    boxWidth,
                    boxHeight
                );
            }
            
            // Texto da opção
            ctx.fillStyle = isSelected ? '#FFD700' : '#ccc';
            ctx.font = isSelected ? 'bold 32px Arial' : '28px Arial';
            
            if (isSelected) {
                ctx.shadowBlur = 15;
                ctx.shadowColor = '#FFD700';
            }
            
            ctx.fillText(opt.text, Game.width / 2, y);
            
            ctx.shadowBlur = 0;
        });

        // Informações na parte inferior
        this.drawMenuFooter();
    }

    drawMenuFooter() {
        const ctx = Game.ctx;
        const y = Game.height - 80;
        
        // ✅ Verifica se Game.data existe
        if (!Game.data) {
            console.warn('Game.data não existe ao desenhar footer');
            return;
        }
        
        // Painel de estatísticas
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, y - 20, Game.width, 100);
        
        ctx.textAlign = 'center';
        ctx.font = '18px Arial';
        
        // Moedas
        ctx.fillStyle = '#FFD700';
        ctx.fillText(`💰 Moedas: ${Game.data.coins}`, Game.width / 2, y + 10);
        
        // High Score
        if (Game.data.highScore > 0) {
            ctx.fillStyle = '#fff';
            ctx.fillText(`🏆 Recorde: ${Game.data.highScore}`, Game.width / 2, y + 35);
        }
        
        // Controles
        ctx.fillStyle = '#666';
        ctx.font = '14px Arial';
        ctx.fillText('↑↓ Navegar | ENTER Selecionar', Game.width / 2, y + 60);
    }

    drawShop() {
        const ctx = Game.ctx;
        
        // Background
        ctx.fillStyle = '#0f0f15';
        ctx.fillRect(0, 0, Game.width, Game.height);

        // Header
        this.drawShopHeader();
        
        // ✅ Verifica se Game.economy existe
        if (!Game.economy) {
            ctx.fillStyle = '#ff4444';
            ctx.font = '24px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Erro: Sistema de economia não carregado', Game.width / 2, Game.height / 2);
            return;
        }
        
        // Lista de upgrades
        const upgrades = Game.economy.getAllUpgrades();
        const startY = 130;
        const itemHeight = 90;
        
        upgrades.forEach((upgrade, i) => {
            const y = startY + i * itemHeight;
            this.drawUpgradeItem(upgrade, i, y);
        });
        
        // Footer
        this.drawShopFooter();
    }

    drawShopHeader() {
        const ctx = Game.ctx;
        
        // Título
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#FFD700';
        ctx.fillText('🛒 LOJA', Game.width / 2, 60);
        ctx.shadowBlur = 0;
        
        // Saldo
        ctx.font = 'bold 24px Arial';
        ctx.fillStyle = '#4CAF50';
        
        // ✅ Verifica Game.data
        const coins = Game.data ? Game.data.coins : 0;
        ctx.fillText(`💰 Saldo: $${coins}`, Game.width / 2, 95);
    }

    drawUpgradeItem(upgrade, index, y) {
        const ctx = Game.ctx;
        const isSelected = index === this.shopOption;
        const boxPadding = 30;
        const boxWidth = Game.width - boxPadding * 2;
        const boxHeight = 75;
        
        // Background
        if (isSelected) {
            ctx.fillStyle = 'rgba(0, 210, 255, 0.15)';
        } else {
            ctx.fillStyle = 'rgba(50, 50, 60, 0.3)';
        }
        ctx.fillRect(boxPadding, y - 10, boxWidth, boxHeight);
        
        // Borda
        ctx.strokeStyle = isSelected ? '#00d2ff' : 'rgba(100, 100, 120, 0.5)';
        ctx.lineWidth = isSelected ? 3 : 1;
        ctx.strokeRect(boxPadding, y - 10, boxWidth, boxHeight);
        
        // Nome do upgrade
        ctx.textAlign = 'left';
        ctx.fillStyle = isSelected ? '#00d2ff' : '#fff';
        ctx.font = isSelected ? 'bold 24px Arial' : 'bold 20px Arial';
        ctx.fillText(upgrade.name, boxPadding + 20, y + 15);
        
        // Descrição
        ctx.font = '14px Arial';
        ctx.fillStyle = '#aaa';
        ctx.fillText(upgrade.description, boxPadding + 20, y + 38);
        
        // Nível
        ctx.font = '16px Arial';
        ctx.fillStyle = '#888';
        const levelText = `Nível ${upgrade.level}/${upgrade.maxLevel}`;
        ctx.fillText(levelText, boxPadding + 20, y + 58);
        
        // Barra de progresso do nível
        const barWidth = 100;
        const barHeight = 6;
        const barX = boxPadding + 150;
        const barY = y + 50;
        
        ctx.fillStyle = 'rgba(100, 100, 100, 0.3)';
        ctx.fillRect(barX, barY, barWidth, barHeight);
        
        ctx.fillStyle = '#4CAF50';
        ctx.fillRect(barX, barY, barWidth * (upgrade.level / upgrade.maxLevel), barHeight);
        
        // Custo/Status
        ctx.textAlign = 'right';
        
        if (upgrade.level >= upgrade.maxLevel) {
            ctx.fillStyle = '#4CAF50';
            ctx.font = 'bold 20px Arial';
            ctx.fillText('✓ MÁXIMO', Game.width - boxPadding - 20, y + 30);
        } else {
            const canAfford = upgrade.canBuy;
            ctx.fillStyle = canAfford ? '#FFD700' : '#f44336';
            ctx.font = 'bold 24px Arial';
            ctx.fillText(`$${upgrade.cost}`, Game.width - boxPadding - 20, y + 30);
            
            // Indicador de disponibilidade
            if (canAfford && isSelected) {
                ctx.fillStyle = '#4CAF50';
                ctx.font = '14px Arial';
                ctx.fillText('ENTER para comprar', Game.width - boxPadding - 20, y + 50);
            }
        }
    }

    drawShopFooter() {
        const ctx = Game.ctx;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, Game.height - 50, Game.width, 50);
        
        ctx.textAlign = 'center';
        ctx.fillStyle = '#666';
        ctx.font = '16px Arial';
        ctx.fillText(
            '↑↓ Navegar | ENTER Comprar | ESC Voltar',
            Game.width / 2,
            Game.height - 20
        );
    }

    drawPaused() {
        if (Game.hud) {
            Game.hud.drawPauseMenu();
        }
    }

    drawGameOver() {
        if (Game.hud) {
            Game.hud.drawGameOverScreen();
        }
    }

    destroy() {
        if (this.keyHandler) {
            window.removeEventListener('keydown', this.keyHandler);
        }
    }
}
