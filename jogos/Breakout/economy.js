// economy.js - Sistema Econômico Robusto
class Economy {
    constructor() {
        this.upgrades = {
            paddleWidth: {
                name: 'Largura do Paddle',
                level: 0,
                maxLevel: 5,
                cost: 50,
                effect: 20,
                description: 'Aumenta a largura do paddle em 20px'
            },
            ballSpeed: {
                name: 'Velocidade da Bola',
                level: 0,
                maxLevel: 3,
                cost: 100,
                effect: 0.5,
                description: 'Aumenta a velocidade inicial'
            },
            // ✅ Multiball removido temporariamente
            // TODO: Implementar sistema de múltiplas bolas antes de reativar
            coinMultiplier: {
                name: 'Multiplicador de Moedas',
                level: 0,
                maxLevel: 5,
                cost: 75,
                effect: 0.25,
                description: '+25% de moedas por nível'
            },
            extraLife: {
                name: 'Vida Extra',
                level: 0,
                maxLevel: 3,
                cost: 150,
                effect: 1,
                description: 'Aumenta o número de vidas'
            }
        };
        
        this.load();
    }

    canBuy(key) {
        const upgrade = this.upgrades[key];
        if (!upgrade) return false;
        
        // ✅ FIX BUG #7: Verifica se Game.data existe
        if (!Game.data) {
            console.error('Game.data não existe!');
            return false;
        }
        
        return upgrade.level < upgrade.maxLevel && 
               Game.data.coins >= this.getCost(key);
    }

    getCost(key) {
        const upgrade = this.upgrades[key];
        if (!upgrade) return Infinity;
        
        // Custo escala exponencialmente
        return Math.floor(upgrade.cost * Math.pow(1.5, upgrade.level));
    }

    buy(key) {
        if (!this.canBuy(key)) {
            console.warn(`Cannot buy upgrade: ${key}`);
            return false;
        }
        
        // ✅ Verifica Game.data novamente
        if (!Game.data) {
            console.error('Game.data não existe!');
            return false;
        }
        
        const cost = this.getCost(key);
        const upgrade = this.upgrades[key];
        
        // Deduz moedas
        Game.data.coins -= cost;
        upgrade.level++;
        
        // ✅ STATS: Registra compra de upgrade
        if (Game.stats) {
            Game.stats.recordUpgradeBought(cost);
        }
        
        // ✅ SOM: Upgrade comprado
        if (Game.audio) {
            Game.audio.play('upgrade');
        }
        
        // Salva progresso
        this.save();
        
        // Aplica efeitos imediatos
        this.applyUpgradeEffects(key);
        
        console.log(`Purchased: ${upgrade.name} (Level ${upgrade.level})`);
        return true;
    }

    applyUpgradeEffects(key) {
        switch(key) {
            case 'paddleWidth':
                if (Game.paddle) {
                    Game.paddle.applyUpgrades();
                }
                break;
            
            case 'ballSpeed':
                // Será aplicado no próximo reset da bola
                break;
            
            case 'extraLife':
                // ✅ Verifica Game.data
                if (!Game.data) {
                    console.error('Game.data não existe!');
                    return;
                }
                
                if (!Game.data.lives) Game.data.lives = 3;
                
                // ✅ Adiciona vida imediatamente ao comprar
                const oldMaxLives = Game.data.maxLives || 3;
                Game.data.maxLives = 3 + this.getEffect('extraLife');
                
                // Adiciona as vidas extras que foram desbloqueadas
                const livesAdded = Game.data.maxLives - oldMaxLives;
                Game.data.lives += livesAdded;
                
                // Feedback visual para o jogador
                if (Game.hud && livesAdded > 0) {
                    Game.hud.addNotification(`+${livesAdded} Vida Extra!`, '#4CAF50', 2.0);
                }
                break;
        }
    }

    getEffect(key) {
        const upgrade = this.upgrades[key];
        return upgrade ? upgrade.effect * upgrade.level : 0;
    }

    addCoins(amount) {
        if (amount <= 0) return;
        
        // ✅ Verifica Game.data
        if (!Game.data) {
            console.error('Game.data não existe!');
            return;
        }
        
        // ✅ FIX BUG #1: Aplica multiplicador do upgrade E do power-up
        let multiplier = 1 + this.getEffect('coinMultiplier');
        
        // Aplica multiplicador do power-up Coin Rain se ativo
        if (Game.coinMultiplier && Game.coinMultiplier > 1) {
            multiplier *= Game.coinMultiplier;
        }
        
        const finalAmount = Math.floor(amount * multiplier);
        
        Game.data.coins += finalAmount;
        
        // ✅ FIX: auto-save por contador de eventos, não por "coins % 50 === 0".
        // O total pode saltar por cima de um múltiplo de 50 (ex: 45 -> 57) e o
        // save antigo nunca disparava nesse ciclo, arriscando perder progresso.
        this._coinEventsSinceSave = (this._coinEventsSinceSave || 0) + 1;
        if (this._coinEventsSinceSave >= 10) {
            this._coinEventsSinceSave = 0;
            this.saveGlobalData();
        }
    }

    save() {
        try {
            const saveData = {};
            for (let key in this.upgrades) {
                saveData[key] = {
                    level: this.upgrades[key].level
                };
            }
            
            localStorage.setItem('breakoutEconomy', JSON.stringify(saveData));
            this.saveGlobalData();
            
            console.log('Economy saved');
        } catch (error) {
            console.error('Failed to save economy:', error);
        }
    }

    saveGlobalData() {
        try {
            // ✅ Verifica se Game.data existe antes de salvar
            if (!Game.data) {
                console.error('Cannot save: Game.data não existe');
                return;
            }
            
            localStorage.setItem(CONFIG.SYSTEM.STORAGE_KEY, JSON.stringify(Game.data));
        } catch (error) {
            console.error('Failed to save game data:', error);
        }
    }

    load() {
        try {
            // Carrega upgrades
            const economyData = localStorage.getItem('breakoutEconomy');
            if (economyData) {
                const loaded = JSON.parse(economyData);
                for (let key in loaded) {
                    if (this.upgrades[key]) {
                        this.upgrades[key].level = loaded[key].level || 0;
                    }
                }
                console.log('Economy loaded');
            }
            
            // Carrega dados do jogo
            const gameData = localStorage.getItem(CONFIG.SYSTEM.STORAGE_KEY);
            if (gameData) {
                const loaded = JSON.parse(gameData);
                
                // ✅ Garante que Game.data existe antes de mesclar
                if (Game.data) {
                    Game.data = { ...Game.data, ...loaded };
                } else {
                    Game.data = loaded;
                }
                
                console.log('Game data loaded');
            }
        } catch (error) {
            console.error('Failed to load data:', error);
            this.reset();
        }
    }

    reset() {
        // Reset de emergência
        for (let key in this.upgrades) {
            this.upgrades[key].level = 0;
        }
        
        // ✅ Cria Game.data se não existir
        Game.data = {
            score: 0,
            coins: 0,
            level: 1,
            lives: 3,
            maxLives: 3,
            highScore: Game.data?.highScore || 0
        };
        
        this.save();
    }

    getAllUpgrades() {
        return Object.keys(this.upgrades).map(key => ({
            key: key,
            ...this.upgrades[key],
            cost: this.getCost(key),
            canBuy: this.canBuy(key)
        }));
    }
}
