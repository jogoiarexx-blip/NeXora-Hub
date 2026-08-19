// ========== SISTEMA DE SALVAMENTO ==========
class SaveSystem {
    constructor() {
        this.data = {
            highScore: 0,
            highestLevel: 0,
            totalPlaytime: 0,
            gamesPlayed: 0,
            favoriteCharacter: null,
            playerProgress: {
                João: { level: 1, xp: 0, xpToNextLevel: 100, unlockedSkills: [] },
                Crist: { level: 1, xp: 0, xpToNextLevel: 100, unlockedSkills: [] }
            }
        };
        this.loadSave();
    }
    
    load() {
        return this.data;
    }
    
    save(gameData) {
        if (gameData.score) {
            this.updateHighScore(gameData.score);
        }
        if (gameData.level) {
            this.updateHighestLevel(gameData.level);
        }
        if (gameData.playerCharacter) {
            this.updateFavoriteCharacter(gameData.playerCharacter);
        }
        this.incrementGamesPlayed();
    }
    
    updateHighScore(score) {
        if (score > this.data.highScore) {
            this.data.highScore = score;
            this.saveSave();
            return true;
        }
        return false;
    }
    
    updateHighestLevel(level) {
        if (level > this.data.highestLevel) {
            this.data.highestLevel = level;
            this.saveSave();
        }
    }
    
    incrementGamesPlayed() {
        this.data.gamesPlayed++;
        this.saveSave();
    }
    
    updateFavoriteCharacter(character) {
        this.data.favoriteCharacter = character;
        this.saveSave();
    }
    
    savePlayerProgress(characterName, evolutionData) {
        if (!this.data.playerProgress) {
            this.data.playerProgress = {
                João: { level: 1, xp: 0, xpToNextLevel: 100, unlockedSkills: [] },
                Crist: { level: 1, xp: 0, xpToNextLevel: 100, unlockedSkills: [] }
            };
        }
        this.data.playerProgress[characterName] = evolutionData;
        this.saveSave();
    }
    
    loadPlayerProgress(characterName) {
        if (!this.data.playerProgress || !this.data.playerProgress[characterName]) {
            return { level: 1, xp: 0, xpToNextLevel: 100, unlockedSkills: [] };
        }
        return this.data.playerProgress[characterName];
    }
    
    saveSave() {
        try {
            localStorage.setItem('joaoCristSave', JSON.stringify(this.data));
        } catch (e) {
            console.warn('Não foi possível salvar progresso');
        }
    }
    
    loadSave() {
        try {
            const saved = localStorage.getItem('joaoCristSave');
            if (saved) {
                this.data = JSON.parse(saved);
            }
        } catch (e) {
            console.warn('Não foi possível carregar progresso');
        }
    }
    
    resetSave() {
        if (confirm('Tem certeza que deseja resetar todo o progresso?')) {
            this.data = {
                highScore: 0,
                highestLevel: 0,
                totalPlaytime: 0,
                gamesPlayed: 0,
                favoriteCharacter: null,
                playerProgress: {
                    João: { level: 1, xp: 0, xpToNextLevel: 100, unlockedSkills: [] },
                    Crist: { level: 1, xp: 0, xpToNextLevel: 100, unlockedSkills: [] }
                }
            };
            this.saveSave();
            
            // Limpar conquistas também
            localStorage.removeItem('joaoCristAchievements');
            localStorage.removeItem('joaoCristStats');
            localStorage.removeItem('trophies');
        }
    }
}
