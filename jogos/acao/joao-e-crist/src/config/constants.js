/**
 * Constantes e configurações do jogo
 * Centraliza todos os valores fixos para fácil manutenção
 */

export const GAME_CONFIG = {
    // Dimensões do canvas
    CANVAS_WIDTH: 1000,
    CANVAS_HEIGHT: 650,
    
    // Performance
    MAX_PARTICLES: 500,
    TARGET_FPS: 60,
    
    // Física
    GRAVITY: 0.8,
    GROUND_Y: 490,
    
    // Câmera
    CAMERA_FOLLOW_OFFSET_X: 300,
    CAMERA_FOLLOW_MAX_X: 600,
    CAMERA_MIN_X: 0,
    
    // Timing
    CHARACTER_SELECT_DELAY: 300, // ms
    LEVEL_INTRO_DURATION: 180, // frames
    LEVEL_COMPLETE_DURATION: 240, // frames
    HIT_STOP_FRAMES: 3,
    COMBO_TIMEOUT: 180, // frames (3 segundos)
    
    // Power-ups
    POWERUP_DURATION: {
        speed: 300,
        strength: 300,
        invincible: 180
    },
    
    // Pontuação
    SCORE_ENEMY_KILL: 100,
    SCORE_COMBO_MULTIPLIER: 50,
    SCORE_POWERUP: 500,
    
    // Partículas de fundo
    BG_PARTICLE_COUNT: 50,
    
    // Audio
    DEFAULT_VOLUME: 0.5,
    
    // LocalStorage keys
    STORAGE_KEYS: {
        SAVE_DATA: 'joaoecrist_save',
        ACHIEVEMENTS: 'joaoecrist_achievements',
        SETTINGS: 'joaoecrist_settings'
    }
};

export const GameState = {
    LOADING: 'loading',
    MENU: 'menu',
    TUTORIAL: 'tutorial',
    CHARACTER_SELECT: 'character_select',
    STORY_INTRO: 'story_intro',
    STORY_LEVEL: 'story_level',
    LEVEL_INTRO: 'level_intro',
    PLAYING: 'playing',
    PAUSED: 'paused',
    LEVEL_COMPLETE: 'level_complete',
    GAME_OVER: 'gameover',
    VICTORY: 'victory',
    ACHIEVEMENTS: 'achievements'
};

export const PlayerControls = {
    PLAYER1: {
        left: 'a',
        right: 'd',
        up: 'w',
        attack: 'j',
        dash: 's'
    },
    PLAYER2: {
        left: 'ArrowLeft',
        right: 'ArrowRight',
        up: 'ArrowUp',
        attack: 'l',
        dash: 'ArrowDown'
    }
};

export const Colors = {
    // Personagens
    JOAO_BODY: '#3498db',
    JOAO_SKIN: '#f4d03f',
    JOAO_PANTS: '#2c3e50',
    
    CRIST_BODY: '#e74c3c',
    CRIST_SKIN: '#d4a574',
    CRIST_PANTS: '#34495e',
    
    // UI
    PRIMARY: '#00ffff',
    SECONDARY: '#ff00ff',
    DANGER: '#ff0000',
    SUCCESS: '#00ff00',
    WARNING: '#ff8800',
    
    // Power-ups
    HEALTH: '#00ff00',
    SPEED: '#00ffff',
    STRENGTH: '#ff8800',
    INVINCIBLE: '#ffd700',
    SCORE: '#ff00ff',
    
    // Efeitos
    COMBO_TEXT: '#ffff00',
    DAMAGE_TEXT: '#ff0000'
};
