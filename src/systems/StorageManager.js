/**
 * Storage System - Sistema de armazenamento seguro
 * Correções: Race conditions, validação, integridade de dados
 */

import { debounce, validateSaveData, createChecksum, deepClone } from '../utils/helpers.js';
import { GAME_CONFIG } from '../config/constants.js';

export class StorageManager {
    constructor() {
        this.saveQueue = [];
        this.saving = false;
        
        // Debounce para prevenir race conditions (Bug #6)
        this.debouncedSave = debounce((key, data) => {
            this._saveImmediate(key, data);
        }, 100);
    }
    
    /**
     * Salva dados no localStorage
     * @param {string} key - Chave do storage
     * @param {*} data - Dados a salvar
     * @param {boolean} immediate - Se true, salva imediatamente
     */
    save(key, data, immediate = false) {
        if (immediate) {
            return this._saveImmediate(key, data);
        } else {
            this.debouncedSave(key, data);
        }
    }
    
    /**
     * Salva imediatamente (uso interno)
     */
    _saveImmediate(key, data) {
        try {
            // Criar objeto com checksum para integridade
            const saveObject = {
                data: data,
                checksum: createChecksum(data),
                timestamp: Date.now(),
                version: '1.0.0'
            };
            
            const serialized = JSON.stringify(saveObject);
            localStorage.setItem(key, serialized);
            
            return true;
        } catch (error) {
            console.error('Erro ao salvar dados:', error);
            
            // Se quota excedida, tentar limpar dados antigos
            if (error.name === 'QuotaExceededError') {
                this._cleanOldData();
                // Tentar salvar novamente
                try {
                    const saveObject = {
                        data: data,
                        checksum: createChecksum(data),
                        timestamp: Date.now(),
                        version: '1.0.0'
                    };
                    localStorage.setItem(key, JSON.stringify(saveObject));
                    return true;
                } catch (retryError) {
                    console.error('Falha ao salvar mesmo após limpeza:', retryError);
                    return false;
                }
            }
            
            return false;
        }
    }
    
    /**
     * Carrega dados do localStorage
     * @param {string} key - Chave do storage
     * @param {*} defaultValue - Valor padrão se não encontrar
     */
    load(key, defaultValue = null) {
        try {
            const serialized = localStorage.getItem(key);
            
            if (!serialized) {
                return defaultValue;
            }
            
            const saveObject = JSON.parse(serialized);
            
            // Validar estrutura básica
            if (!saveObject.data || !saveObject.checksum) {
                console.warn('Dados corrompidos - estrutura inválida');
                return defaultValue;
            }
            
            // Verificar integridade com checksum
            const calculatedChecksum = createChecksum(saveObject.data);
            if (calculatedChecksum !== saveObject.checksum) {
                console.warn('Dados corrompidos - checksum não corresponde');
                return defaultValue;
            }
            
            // Validação específica para dados de save
            if (key === GAME_CONFIG.STORAGE_KEYS.SAVE_DATA) {
                if (!validateSaveData(saveObject.data)) {
                    console.warn('Dados de save inválidos');
                    return defaultValue;
                }
            }
            
            return deepClone(saveObject.data);
            
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            return defaultValue;
        }
    }
    
    /**
     * Remove dados do localStorage
     * @param {string} key - Chave do storage
     */
    remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('Erro ao remover dados:', error);
            return false;
        }
    }
    
    /**
     * Verifica se uma chave existe
     * @param {string} key - Chave do storage
     */
    exists(key) {
        return localStorage.getItem(key) !== null;
    }
    
    /**
     * Limpa todos os dados do jogo
     */
    clearAll() {
        try {
            Object.values(GAME_CONFIG.STORAGE_KEYS).forEach(key => {
                localStorage.removeItem(key);
            });
            return true;
        } catch (error) {
            console.error('Erro ao limpar dados:', error);
            return false;
        }
    }
    
    /**
     * Limpa dados antigos para liberar espaço
     */
    _cleanOldData() {
        try {
            // Remover itens que não são do jogo
            const gameKeys = Object.values(GAME_CONFIG.STORAGE_KEYS);
            const allKeys = Object.keys(localStorage);
            
            allKeys.forEach(key => {
                if (!gameKeys.includes(key)) {
                    // Não remover, pois pode ser de outro site
                    return;
                }
                
                // Verificar timestamp
                try {
                    const data = JSON.parse(localStorage.getItem(key));
                    const age = Date.now() - (data.timestamp || 0);
                    
                    // Remover se tiver mais de 30 dias
                    if (age > 30 * 24 * 60 * 60 * 1000) {
                        localStorage.removeItem(key);
                    }
                } catch (e) {
                    // Dados corrompidos, remover
                    localStorage.removeItem(key);
                }
            });
        } catch (error) {
            console.error('Erro ao limpar dados antigos:', error);
        }
    }
    
    /**
     * Obtém tamanho aproximado usado no localStorage
     */
    getStorageSize() {
        let total = 0;
        Object.values(GAME_CONFIG.STORAGE_KEYS).forEach(key => {
            const item = localStorage.getItem(key);
            if (item) {
                total += item.length;
            }
        });
        return total;
    }
    
    /**
     * Exporta todos os dados do jogo
     */
    exportData() {
        const data = {};
        Object.entries(GAME_CONFIG.STORAGE_KEYS).forEach(([name, key]) => {
            data[name] = this.load(key);
        });
        return data;
    }
    
    /**
     * Importa dados do jogo
     */
    importData(data) {
        try {
            Object.entries(data).forEach(([name, value]) => {
                const key = GAME_CONFIG.STORAGE_KEYS[name];
                if (key && value !== null) {
                    this.save(key, value, true);
                }
            });
            return true;
        } catch (error) {
            console.error('Erro ao importar dados:', error);
            return false;
        }
    }
}
