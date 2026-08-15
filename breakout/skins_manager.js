// skins_manager.js - Sistema de Skins com Vantagens
class SkinManager {
    constructor() {
        this.paddleSkins = CONFIG.SKINS.PADDLE;
        this.ballSkins = CONFIG.SKINS.BALL;
        this.currentPaddleSkin = 'default';
        this.currentBallSkin = 'default';
        this.ownedPaddleSkins = ['default'];
        this.ownedBallSkins = ['default'];
        
        this.load();
    }
    
    // ============================================
    // MÉTODOS DE COMPRA
    // ============================================
    
    buyPaddleSkin(skinId) {
        const skin = this.paddleSkins[skinId];
        
        if (!skin) {
            console.error('Skin não encontrada:', skinId);
            return false;
        }
        
        if (this.ownedPaddleSkins.includes(skinId)) {
            console.log('Skin já possui:', skinId);
            return false;
        }
        
        if (Game.data.coins < skin.cost) {
            console.log('Moedas insuficientes para skin:', skinId);
            return false;
        }
        
        // Deduz moedas
        Game.data.coins -= skin.cost;
        
        // Adiciona skin
        this.ownedPaddleSkins.push(skinId);
        
        // Equipa automaticamente
        this.equipPaddleSkin(skinId);
        
        // Salva
        this.save();
        
        // ✅ SOM: Compra
        if (Game.audio) Game.audio.play('upgrade');
        
        console.log('✅ Skin de paddle comprada:', skinId);
        return true;
    }
    
    buyBallSkin(skinId) {
        const skin = this.ballSkins[skinId];
        
        if (!skin) {
            console.error('Skin não encontrada:', skinId);
            return false;
        }
        
        if (this.ownedBallSkins.includes(skinId)) {
            console.log('Skin já possui:', skinId);
            return false;
        }
        
        if (Game.data.coins < skin.cost) {
            console.log('Moedas insuficientes para skin:', skinId);
            return false;
        }
        
        // Deduz moedas
        Game.data.coins -= skin.cost;
        
        // Adiciona skin
        this.ownedBallSkins.push(skinId);
        
        // Equipa automaticamente
        this.equipBallSkin(skinId);
        
        // Salva
        this.save();
        
        // ✅ SOM: Compra
        if (Game.audio) Game.audio.play('upgrade');
        
        console.log('✅ Skin de bola comprada:', skinId);
        return true;
    }
    
    // ============================================
    // MÉTODOS DE EQUIPAR
    // ============================================
    
    equipPaddleSkin(skinId) {
        if (!this.ownedPaddleSkins.includes(skinId)) {
            console.error('Você não possui esta skin:', skinId);
            return false;
        }
        
        this.currentPaddleSkin = skinId;
        
        // Atualiza paddle se existir
        if (Game.paddle) {
            Game.paddle.applySkin(skinId);
        }
        
        this.save();
        return true;
    }
    
    equipBallSkin(skinId) {
        if (!this.ownedBallSkins.includes(skinId)) {
            console.error('Você não possui esta skin:', skinId);
            return false;
        }
        
        this.currentBallSkin = skinId;
        
        // Atualiza ball se existir
        if (Game.ball) {
            Game.ball.applySkin(skinId);
        }
        
        this.save();
        return true;
    }
    
    // ============================================
    // GETTERS DE INFORMAÇÕES
    // ============================================
    
    getPaddleSkinData(skinId) {
        return this.paddleSkins[skinId] || null;
    }
    
    getBallSkinData(skinId) {
        return this.ballSkins[skinId] || null;
    }
    
    getCurrentPaddleSkin() {
        return this.paddleSkins[this.currentPaddleSkin];
    }
    
    getCurrentBallSkin() {
        return this.ballSkins[this.currentBallSkin];
    }
    
    getPaddleBonuses() {
        const skin = this.getCurrentPaddleSkin();
        return skin ? skin.bonus : { width: 0, speed: 0 };
    }
    
    getBallBonuses() {
        const skin = this.getCurrentBallSkin();
        return skin ? skin.bonus : { damage: 0, speed: 0 };
    }
    
    getAllPaddleSkins() {
        return Object.keys(this.paddleSkins).map(id => ({
            id,
            ...this.paddleSkins[id],
            owned: this.ownedPaddleSkins.includes(id),
            equipped: this.currentPaddleSkin === id
        }));
    }
    
    getAllBallSkins() {
        return Object.keys(this.ballSkins).map(id => ({
            id,
            ...this.ballSkins[id],
            owned: this.ownedBallSkins.includes(id),
            equipped: this.currentBallSkin === id
        }));
    }
    
    // ============================================
    // PERSISTÊNCIA
    // ============================================
    
    save() {
        const data = {
            currentPaddleSkin: this.currentPaddleSkin,
            currentBallSkin: this.currentBallSkin,
            ownedPaddleSkins: this.ownedPaddleSkins,
            ownedBallSkins: this.ownedBallSkins
        };
        
        localStorage.setItem(CONFIG.SYSTEM.STORAGE_KEY + '_skins', JSON.stringify(data));
    }
    
    load() {
        try {
            const saved = localStorage.getItem(CONFIG.SYSTEM.STORAGE_KEY + '_skins');
            if (saved) {
                const data = JSON.parse(saved);
                this.currentPaddleSkin = data.currentPaddleSkin || 'default';
                this.currentBallSkin = data.currentBallSkin || 'default';
                this.ownedPaddleSkins = data.ownedPaddleSkins || ['default'];
                this.ownedBallSkins = data.ownedBallSkins || ['default'];
                
                console.log('✅ Skins carregadas');
            }
        } catch (e) {
            console.error('Erro ao carregar skins:', e);
        }
    }
    
    reset() {
        this.currentPaddleSkin = 'default';
        this.currentBallSkin = 'default';
        this.ownedPaddleSkins = ['default'];
        this.ownedBallSkins = ['default'];
        this.save();
    }
    
    // ============================================
    // UTILIDADES
    // ============================================
    
    getSkinsCount() {
        return {
            paddleOwned: this.ownedPaddleSkins.length,
            paddleTotal: Object.keys(this.paddleSkins).length,
            ballOwned: this.ownedBallSkins.length,
            ballTotal: Object.keys(this.ballSkins).length
        };
    }
    
    getTotalSkinsValue() {
        let total = 0;
        
        this.ownedPaddleSkins.forEach(id => {
            if (id !== 'default') {
                total += this.paddleSkins[id].cost;
            }
        });
        
        this.ownedBallSkins.forEach(id => {
            if (id !== 'default') {
                total += this.ballSkins[id].cost;
            }
        });
        
        return total;
    }
}
