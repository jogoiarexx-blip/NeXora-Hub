// config_enhanced.js - Configurações Premium com Gráficos Avançados
const CONFIG = {
    SCREEN: {
        WIDTH: 800,
        HEIGHT: 600,
        BACKGROUND: '#0a0a0f'
    },
    
    PADDLE: {
        WIDTH: 100,
        HEIGHT: 20,
        COLOR: '#00d2ff',
        MAX_SPEED: 10,
        FRICTION: 0.9,
        ACCELERATION: 1.2,
        OFFSET_BOTTOM: 50
    },
    
    BALL: {
        RADIUS: 8,
        SPEED: 5,
        MAX_SPEED: 12,
        SPEED_INCREMENT: 0.05,
        COLOR: '#ffffff',
        TRAIL_LENGTH: 15 // ✨ NOVO: Rastro da bola
    },
    
    // ✨ NOVO: Sistema de tijolos aprimorado com mais variedades
    BRICKS: {
        WIDTH: 75,
        HEIGHT: 20,
        PADDING: 5,
        OFFSET_TOP: 60,
        CRACK_SYSTEM: true, // Sistema de rachaduras
        TYPES: {
            // Básicos
            normal: { 
                hits: 1, 
                points: 10, 
                coins: 1, 
                color: '#4CAF50',
                gradient: ['#66BB6A', '#4CAF50', '#388E3C'],
                crackable: false
            },
            strong: { 
                hits: 2, 
                points: 25, 
                coins: 3, 
                color: '#FF9800',
                gradient: ['#FFB74D', '#FF9800', '#F57C00'],
                crackable: true
            },
            metal: { 
                hits: 4, 
                points: 50, 
                coins: 5, 
                color: '#78909C',
                gradient: ['#90A4AE', '#78909C', '#546E7A'],
                crackable: true,
                metallic: true
            },
            diamond: { 
                hits: 5, 
                points: 100, 
                coins: 10, 
                color: '#00BCD4',
                gradient: ['#4DD0E1', '#00BCD4', '#0097A7'],
                crackable: true,
                sparkle: true
            },
            
            // ✨ NOVOS TIPOS
            titanium: {
                hits: 7,
                points: 150,
                coins: 15,
                color: '#B0BEC5',
                gradient: ['#CFD8DC', '#B0BEC5', '#90A4AE'],
                crackable: true,
                metallic: true,
                hardness: 'very_hard'
            },
            obsidian: {
                hits: 10,
                points: 200,
                coins: 20,
                color: '#1A1A1A',
                gradient: ['#2C2C2C', '#1A1A1A', '#0D0D0D'],
                crackable: true,
                darkGlow: true,
                hardness: 'extreme'
            },
            rainbow: {
                hits: 3,
                points: 75,
                coins: 8,
                color: '#FF00FF',
                gradient: ['#FF00FF', '#00FFFF', '#FFFF00'],
                animated: true,
                crackable: true
            },
            crystal: {
                hits: 6,
                points: 120,
                coins: 12,
                color: '#E1BEE7',
                gradient: ['#F3E5F5', '#E1BEE7', '#CE93D8'],
                crackable: true,
                sparkle: true,
                transparent: true
            },
            
            // Especiais
            coin: { 
                hits: 1, 
                points: 5, 
                coins: 10, 
                color: '#FFD700',
                gradient: ['#FFF176', '#FFD700', '#FFA000'],
                goldGlow: true
            },
            explosive: { 
                hits: 1, 
                points: 30, 
                coins: 4, 
                color: '#E91E63',
                gradient: ['#F48FB1', '#E91E63', '#C2185B'],
                explosive: true,
                pulsate: true
            },
            
            // ✨ NOVOS ESPECIAIS
            mystery: {
                hits: 2,
                points: 50,
                coins: 5,
                color: '#9C27B0',
                gradient: ['#BA68C8', '#9C27B0', '#7B1FA2'],
                animated: true,
                mystery: true,
                randomReward: true
            },
            regenerative: {
                hits: 3,
                points: 80,
                coins: 7,
                color: '#00E676',
                gradient: ['#69F0AE', '#00E676', '#00C853'],
                regenerates: true,
                healEffect: true
            }
        }
    },
    
    // ✨ NOVO: Sistema de Skins para Paddle e Ball
    SKINS: {
        PADDLE: {
            default: {
                name: 'Clássico',
                cost: 0,
                color: '#00d2ff',
                gradient: ['#4DD0E1', '#00BCD4', '#0097A7'],
                bonus: { width: 0, speed: 0 },
                description: 'Paddle padrão'
            },
            neon: {
                name: 'Neon',
                cost: 100,
                color: '#FF00FF',
                gradient: ['#FF00FF', '#00FFFF', '#FF00FF'],
                animated: true,
                bonus: { width: 10, speed: 0 },
                description: '+10 largura'
            },
            gold: {
                name: 'Dourado',
                cost: 250,
                color: '#FFD700',
                gradient: ['#FFF176', '#FFD700', '#FFA000'],
                metallic: true,
                bonus: { width: 0, speed: 1.2 },
                description: '+20% velocidade'
            },
            diamond: {
                name: 'Diamante',
                cost: 500,
                color: '#00BCD4',
                gradient: ['#4DD0E1', '#00BCD4', '#0097A7'],
                sparkle: true,
                bonus: { width: 15, speed: 0.8 },
                description: '+15 largura, +10% velocidade'
            },
            fire: {
                name: 'Flamejante',
                cost: 300,
                color: '#FF4500',
                gradient: ['#FF6347', '#FF4500', '#DC143C'],
                animated: true,
                particles: 'fire',
                bonus: { width: 0, speed: 1.5 },
                description: '+30% velocidade, efeito fogo'
            },
            ice: {
                name: 'Gélido',
                cost: 300,
                color: '#00FFFF',
                gradient: ['#E0F7FA', '#00FFFF', '#00BCD4'],
                animated: true,
                particles: 'ice',
                bonus: { width: 20, speed: 0 },
                description: '+20 largura, efeito gelo'
            },
            toxic: {
                name: 'Tóxico',
                cost: 400,
                color: '#39FF14',
                gradient: ['#76FF03', '#39FF14', '#00E676'],
                animated: true,
                particles: 'toxic',
                bonus: { width: 5, speed: 1.0, poison: true },
                description: '+5 largura, +15% velocidade, efeito veneno'
            },
            rainbow: {
                name: 'Arco-íris',
                cost: 750,
                color: '#FF00FF',
                gradient: ['#FF0000', '#FFFF00', '#00FF00', '#00FFFF', '#0000FF', '#FF00FF'],
                animated: true,
                particles: 'rainbow',
                bonus: { width: 25, speed: 1.3, lucky: true },
                description: '+25 largura, +20% velocidade, +10% sorte'
            }
        },
        
        BALL: {
            default: {
                name: 'Clássica',
                cost: 0,
                color: '#ffffff',
                bonus: { damage: 0, speed: 0 },
                description: 'Bola padrão'
            },
            plasma: {
                name: 'Plasma',
                cost: 150,
                color: '#00FFFF',
                glow: true,
                trail: true,
                bonus: { damage: 1, speed: 0.5 },
                description: '+1 dano, +10% velocidade'
            },
            meteor: {
                name: 'Meteoro',
                cost: 200,
                color: '#FF4500',
                particles: 'fire',
                trail: true,
                bonus: { damage: 2, speed: 1.0 },
                description: '+2 dano, +20% velocidade'
            },
            galaxy: {
                name: 'Galáxia',
                cost: 400,
                color: '#9C27B0',
                animated: true,
                sparkle: true,
                trail: true,
                bonus: { damage: 1, speed: 0.8, multihit: 0.15 },
                description: '+1 dano, +15% velocidade, 15% chance multi-hit'
            },
            atomic: {
                name: 'Atômica',
                cost: 600,
                color: '#39FF14',
                glow: true,
                particles: 'energy',
                trail: true,
                bonus: { damage: 3, speed: 1.2, explosive: true },
                description: '+3 dano, +25% velocidade, explosões ao acertar'
            }
        }
    },
    
    PARTICLES: {
        GRAVITY: 0.3,
        MAX_PARTICLES: 300, // ✨ Aumentado para mais efeitos
        QUALITY: 'high' // ✨ NOVO: Qualidade das partículas
    },
    
    GRAPHICS: {
        SHADOWS: true,
        GLOW_EFFECTS: true,
        PARTICLE_TRAILS: true,
        SCREEN_SHAKE: true,
        POST_PROCESSING: true,
        ANTIALIASING: true
    },
    
    SYSTEM: {
        STORAGE_KEY: 'modern_breakout_premium_save',
        FPS: 60,
        DEBUG: false
    },
    
    AUDIO: {
        ENABLED: true,
        VOLUME: 0.3,
        MUSIC_VOLUME: 0.2
    }
};
