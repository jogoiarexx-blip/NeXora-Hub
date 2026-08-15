// ================= CONFIGURAÇÕES GLOBAIS =================
const CONFIG = {
  SAVE_KEY: "hungry_like_save_v2",
  VERSION: "4.0",
  GRAPHICS_QUALITY: "auto",
  
  // Canvas
  MAX_DPR: 2,
  
  // Player
  PLAYER_INITIAL_RADIUS: 20,
  PLAYER_INITIAL_SPEED: 200,
  PLAYER_INITIAL_HUNGER: 100,
  
  // Progressão
  INITIAL_XP_TO_NEXT: 100,
  
  // Peixes
  FISH: {
    MAX_COUNT: 125, // equilíbrio visual/performance em PC e celular
    SPAWN_INTERVAL: 950, // oceano mais vivo sem sobrecarregar a renderização
    MIN_RADIUS: 6, // Peixes menores para mais variedade
    MAX_RADIUS: 45, // Peixes maiores para mais variedade
    BASE_SPEED: 50,
    SPEED_VARIANCE: 60 // Maior variação de velocidade
  },
  
  // Inimigos
  ENEMY: {
    MAX_COUNT: 15,
    SPAWN_INTERVAL: 8000,
    MIN_RADIUS: 25,
    MAX_RADIUS: 60,
    BASE_SPEED: 80,
    SPEED_VARIANCE: 40
  },
  
  // Compatibilidade com código antigo (deprecated)
  FISH_SPAWN_INTERVAL: 950,
  FISH_MIN_RADIUS: 6,
  FISH_MAX_RADIUS: 45,
  FISH_BASE_SPEED: 50,
  FISH_SPEED_VARIANCE: 60,
  ENEMY_SPAWN_INTERVAL: 8000,
  ENEMY_MIN_RADIUS: 25,
  ENEMY_MAX_RADIUS: 60,
  ENEMY_BASE_SPEED: 80,
  ENEMY_SPEED_VARIANCE: 40,
  
  // Moedas
  COIN_SPAWN_CHANCE: 0.3,
  GEM_SPAWN_CHANCE: 0.05,
  COIN_MAGNET_RANGE: 150,
  COIN_RADIUS: 8,
  GEM_RADIUS: 6,
  
  // Áudio
  MUSIC_VOLUME: 0.3,
  SFX_VOLUME: 0.5
};

// ================= VARIÁVEIS GLOBAIS =================
let canvas, ctx, dpr;
let keys = {};
let touchInput = {x: 0, y: 0, active: false};

// Progressão
let level = 1;
let xp = 0;
let xpToNext = CONFIG.INITIAL_XP_TO_NEXT;
let upgradePoints = 0;

// Upgrades
let upgrades = {
  maxHunger: 0,
  hungerDrain: 0,
  xpBonus: 0,
  speed: 0,
  heal: 0
};

// Economia
let coins = 0;
let gems = 0;
let coinMultiplier = 1;

// Estados de menu
let gameState = 'menu'; // 'menu', 'playing', 'paused', 'gameover'
let upgradeMenu = false;
let shopMenu = false;
let missionsMenu = false;

// Arrays do jogo
// fishes e enemies são declarados em seus respectivos arquivos (fish.js e enemy.js)
let floatingCoins = [];
let floatingGems = [];
let particles = [];
let bloodParticles = [];
let scorePopups = [];

// Missões
let dailyMissions = [];
let missionNotification = null;

// Tempo
let lastTime = 0;
let lastFishSpawn = 0;
let lastEnemySpawn = 0;
