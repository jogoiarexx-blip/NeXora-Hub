/**
 * Event Bus - Sistema de eventos centralizado
 * Resolve o problema de comunicação via variáveis globais
 */

export class EventBus {
    constructor() {
        this.listeners = new Map();
        this.onceListeners = new Map();
    }
    
    /**
     * Registra um listener para um evento
     * @param {string} event - Nome do evento
     * @param {Function} callback - Função de callback
     * @returns {Function} Função para remover o listener
     */
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        
        this.listeners.get(event).push(callback);
        
        // Retorna função para remover o listener
        return () => this.off(event, callback);
    }
    
    /**
     * Registra um listener que executa apenas uma vez
     * @param {string} event - Nome do evento
     * @param {Function} callback - Função de callback
     */
    once(event, callback) {
        if (!this.onceListeners.has(event)) {
            this.onceListeners.set(event, []);
        }
        
        this.onceListeners.get(event).push(callback);
    }
    
    /**
     * Remove um listener específico
     * @param {string} event - Nome do evento
     * @param {Function} callback - Função de callback a remover
     */
    off(event, callback) {
        if (this.listeners.has(event)) {
            const callbacks = this.listeners.get(event);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }
    
    /**
     * Remove todos os listeners de um evento
     * @param {string} event - Nome do evento
     */
    offAll(event) {
        this.listeners.delete(event);
        this.onceListeners.delete(event);
    }
    
    /**
     * Emite um evento
     * @param {string} event - Nome do evento
     * @param {*} data - Dados do evento
     */
    emit(event, data) {
        // Executar listeners normais
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Erro ao executar listener de "${event}":`, error);
                }
            });
        }
        
        // Executar listeners once
        if (this.onceListeners.has(event)) {
            const callbacks = this.onceListeners.get(event);
            callbacks.forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Erro ao executar once listener de "${event}":`, error);
                }
            });
            // Limpar listeners once após execução
            this.onceListeners.delete(event);
        }
    }
    
    /**
     * Retorna a quantidade de listeners para um evento
     * @param {string} event - Nome do evento
     */
    listenerCount(event) {
        let count = 0;
        if (this.listeners.has(event)) {
            count += this.listeners.get(event).length;
        }
        if (this.onceListeners.has(event)) {
            count += this.onceListeners.get(event).length;
        }
        return count;
    }
    
    /**
     * Remove todos os listeners
     */
    clear() {
        this.listeners.clear();
        this.onceListeners.clear();
    }
}

// Eventos padrão do jogo
export const GameEvents = {
    // Jogo
    GAME_START: 'game:start',
    GAME_PAUSE: 'game:pause',
    GAME_RESUME: 'game:resume',
    GAME_OVER: 'game:over',
    GAME_VICTORY: 'game:victory',
    
    // Level
    LEVEL_START: 'level:start',
    LEVEL_COMPLETE: 'level:complete',
    LEVEL_FAILED: 'level:failed',
    
    // Player
    PLAYER_DAMAGE: 'player:damage',
    PLAYER_HEAL: 'player:heal',
    PLAYER_DEATH: 'player:death',
    PLAYER_RESPAWN: 'player:respawn',
    PLAYER_ATTACK: 'player:attack',
    PLAYER_DASH: 'player:dash',
    
    // Enemy
    ENEMY_SPAWN: 'enemy:spawn',
    ENEMY_DAMAGE: 'enemy:damage',
    ENEMY_DEATH: 'enemy:death',
    
    // Power-ups
    POWERUP_SPAWN: 'powerup:spawn',
    POWERUP_COLLECT: 'powerup:collect',
    
    // Score
    SCORE_ADD: 'score:add',
    COMBO_INCREASE: 'combo:increase',
    COMBO_RESET: 'combo:reset',
    
    // Achievement
    ACHIEVEMENT_UNLOCK: 'achievement:unlock',
    
    // UI
    SHOW_NOTIFICATION: 'ui:notification',
    SHOW_MODAL: 'ui:modal'
};
