/**
 * Utilitários do jogo
 * Funções auxiliares com correções de bugs
 */

/**
 * Verifica colisão entre dois retângulos
 * Bug corrigido: Agora com verificações de segurança
 */
export function checkCollision(a, b) {
    if (!a || !b) return false;
    
    return a.x < b.x + b.w && 
           a.x + a.w > b.x && 
           a.y < b.y + b.h && 
           a.y + a.h > b.y;
}

/**
 * Verifica colisão com hitbox ajustável
 * Melhoria #10: Hitboxes mais precisas
 */
export function checkCollisionWithOffset(a, b, offsetA = {}, offsetB = {}) {
    if (!a || !b) return false;
    
    const aLeft = a.x + (offsetA.left || 0);
    const aRight = a.x + a.w - (offsetA.right || 0);
    const aTop = a.y + (offsetA.top || 0);
    const aBottom = a.y + a.h - (offsetA.bottom || 0);
    
    const bLeft = b.x + (offsetB.left || 0);
    const bRight = b.x + b.w - (offsetB.right || 0);
    const bTop = b.y + (offsetB.top || 0);
    const bBottom = b.y + b.h - (offsetB.bottom || 0);
    
    return aLeft < bRight && 
           aRight > bLeft && 
           aTop < bBottom && 
           aBottom > bTop;
}

/**
 * Clamp - Limita um valor entre min e max
 */
export function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

/**
 * Lerp - Interpolação linear
 */
export function lerp(start, end, t) {
    return start + (end - start) * clamp(t, 0, 1);
}

/**
 * Distância entre dois pontos
 */
export function distance(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Normaliza um ângulo entre 0 e 2π
 */
export function normalizeAngle(angle) {
    while (angle < 0) angle += Math.PI * 2;
    while (angle >= Math.PI * 2) angle -= Math.PI * 2;
    return angle;
}

/**
 * Gera número aleatório entre min e max
 */
export function random(min, max) {
    return Math.random() * (max - min) + min;
}

/**
 * Gera inteiro aleatório entre min e max (inclusivo)
 */
export function randomInt(min, max) {
    return Math.floor(random(min, max + 1));
}

/**
 * Escolhe elemento aleatório de um array
 */
export function randomChoice(array) {
    return array[randomInt(0, array.length - 1)];
}

/**
 * Sanitiza texto para prevenir XSS
 * Bug #7: Previne XSS em nomes de personagens
 */
export function sanitizeText(text) {
    if (typeof text !== 'string') return '';
    
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Formata número com separador de milhares
 */
export function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

/**
 * Formata tempo em MM:SS
 */
export function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Debounce - Atrasa execução de função
 * Útil para prevenir race conditions em localStorage
 */
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Throttle - Limita frequência de execução
 */
export function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * Deep clone de objeto
 */
export function deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj);
    if (obj instanceof Array) return obj.map(item => deepClone(item));
    
    const clonedObj = {};
    for (let key in obj) {
        if (obj.hasOwnProperty(key)) {
            clonedObj[key] = deepClone(obj[key]);
        }
    }
    return clonedObj;
}

/**
 * Valida estrutura de dados salvos
 * Bug #32: Validação de localStorage
 */
export function validateSaveData(data) {
    if (!data || typeof data !== 'object') return false;
    
    // Validar estrutura básica
    const requiredFields = ['achievements', 'stats', 'settings'];
    for (let field of requiredFields) {
        if (!(field in data)) return false;
    }
    
    // Validar tipos
    if (!Array.isArray(data.achievements)) return false;
    if (typeof data.stats !== 'object') return false;
    if (typeof data.settings !== 'object') return false;
    
    return true;
}

/**
 * Cria checksum simples para integridade de dados
 */
export function createChecksum(data) {
    const str = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString(36);
}

/**
 * Verifica se está em dispositivo móvel
 */
export function isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

/**
 * Verifica se tab está ativa
 * Melhoria #18: Page Visibility API
 */
export function isTabVisible() {
    return !document.hidden;
}

/**
 * Cria um timer com callback
 */
export class Timer {
    constructor(duration, callback) {
        this.duration = duration;
        this.callback = callback;
        this.elapsed = 0;
        this.active = true;
    }
    
    update(deltaTime = 1) {
        if (!this.active) return;
        
        this.elapsed += deltaTime;
        if (this.elapsed >= this.duration) {
            this.callback();
            this.active = false;
        }
    }
    
    reset() {
        this.elapsed = 0;
        this.active = true;
    }
    
    getProgress() {
        return clamp(this.elapsed / this.duration, 0, 1);
    }
    
    getRemainingTime() {
        return Math.max(0, this.duration - this.elapsed);
    }
}

/**
 * Pool de objetos para performance
 */
export class ObjectPool {
    constructor(createFunc, resetFunc, initialSize = 10) {
        this.createFunc = createFunc;
        this.resetFunc = resetFunc;
        this.available = [];
        this.inUse = new Set();
        
        // Pré-criar objetos
        for (let i = 0; i < initialSize; i++) {
            this.available.push(this.createFunc());
        }
    }
    
    acquire() {
        let obj;
        if (this.available.length > 0) {
            obj = this.available.pop();
        } else {
            obj = this.createFunc();
        }
        this.inUse.add(obj);
        return obj;
    }
    
    release(obj) {
        if (this.inUse.has(obj)) {
            this.inUse.delete(obj);
            this.resetFunc(obj);
            this.available.push(obj);
        }
    }
    
    releaseAll() {
        this.inUse.forEach(obj => {
            this.resetFunc(obj);
            this.available.push(obj);
        });
        this.inUse.clear();
    }
}
