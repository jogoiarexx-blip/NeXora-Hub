/**
 * State Machine - Gerenciamento robusto de estados do jogo
 * Resolve o bug de estados travados e melhora a arquitetura
 */

export class StateMachine {
    constructor() {
        this.states = new Map();
        this.currentState = null;
        this.previousState = null;
        this.stateData = {};
        this.listeners = new Map();
    }
    
    /**
     * Registra um novo estado
     * @param {string} name - Nome do estado
     * @param {Object} callbacks - { enter, update, draw, exit }
     */
    addState(name, callbacks = {}) {
        this.states.set(name, {
            enter: callbacks.enter || (() => {}),
            update: callbacks.update || (() => {}),
            draw: callbacks.draw || (() => {}),
            exit: callbacks.exit || (() => {})
        });
    }
    
    /**
     * Transiciona para um novo estado
     * @param {string} newState - Nome do novo estado
     * @param {Object} data - Dados opcionais para o novo estado
     */
    transition(newState, data = {}) {
        if (!this.states.has(newState)) {
            console.error(`Estado "${newState}" não existe!`);
            return false;
        }
        
        // Executar callback de saída do estado atual
        if (this.currentState && this.states.has(this.currentState)) {
            this.states.get(this.currentState).exit(this.stateData);
        }
        
        // Guardar estado anterior
        this.previousState = this.currentState;
        this.currentState = newState;
        this.stateData = data;
        
        // Executar callback de entrada do novo estado
        this.states.get(newState).enter(data);
        
        // Notificar listeners
        this.emit('stateChange', { 
            from: this.previousState, 
            to: newState, 
            data 
        });
        
        return true;
    }
    
    /**
     * Retorna ao estado anterior
     */
    back() {
        if (this.previousState) {
            this.transition(this.previousState);
            return true;
        }
        return false;
    }
    
    /**
     * Atualiza o estado atual
     * @param {number} deltaTime - Tempo desde o último frame
     */
    update(deltaTime) {
        if (this.currentState && this.states.has(this.currentState)) {
            this.states.get(this.currentState).update(deltaTime, this.stateData);
        }
    }
    
    /**
     * Desenha o estado atual
     * @param {CanvasRenderingContext2D} ctx - Contexto do canvas
     */
    draw(ctx) {
        if (this.currentState && this.states.has(this.currentState)) {
            this.states.get(this.currentState).draw(ctx, this.stateData);
        }
    }
    
    /**
     * Verifica se está em um estado específico
     * @param {string} stateName - Nome do estado
     */
    is(stateName) {
        return this.currentState === stateName;
    }
    
    /**
     * Registra um listener para mudanças de estado
     * @param {string} event - Nome do evento
     * @param {Function} callback - Função de callback
     */
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    }
    
    /**
     * Emite um evento
     * @param {string} event - Nome do evento
     * @param {*} data - Dados do evento
     */
    emit(event, data) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach(callback => callback(data));
        }
    }
    
    /**
     * Obtém o nome do estado atual
     */
    getCurrentState() {
        return this.currentState;
    }
    
    /**
     * Obtém os dados do estado atual
     */
    getStateData() {
        return this.stateData;
    }
}
