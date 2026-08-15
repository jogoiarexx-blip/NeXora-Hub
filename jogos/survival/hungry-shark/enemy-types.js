// ================= TIPOS DE INIMIGOS (ENEMY TYPES) =================
// Define as características e aparências únicas de cada tipo de inimigo

const ENEMY_TYPES = {
  // ========== TUBARÃO VERMELHO (Red Shark) - Agressivo básico ==========
  RED_SHARK: {
    id: 'red_shark',
    name: 'Tubarão Vermelho',
    weight: 40, // Probabilidade de spawn (40%)
    
    // Stats base
    minRadius: 25,
    maxRadius: 45,
    baseSpeed: 80,
    speedVariance: 20,
    baseDamage: 15,
    aggroRange: 250,
    
    // Comportamento
    behavior: 'aggressive', // aggressive, defensive, ambush, patrol
    chaseSpeedMultiplier: 1.3,
    fleeSpeedMultiplier: 1.5,
    
    // Cores
    colors: {
      primary: '#8B0000',      // Vermelho escuro
      secondary: '#CD5C5C',    // Vermelho claro
      accent: '#DC143C',       // Vermelho carmesim
      belly: '#2c2c2c',        // Barriga escura
      eye: '#ff0000'           // Olho vermelho
    },
    
    // Características visuais
    hasSpikes: false,
    hasScar: true,
    finSize: 1.0,
    bodyShape: 'streamlined', // streamlined, bulky, sleek
    tailShape: 'crescent',    // crescent, forked, rounded
    
    // Efeitos especiais
    glowOnChase: true,
    trailColor: '#DC143C',
    particleColor: '#ff0000'
  },
  
  // ========== TUBARÃO TIGRE (Tiger Shark) - Médio com padrões ==========
  TIGER_SHARK: {
    id: 'tiger_shark',
    name: 'Tubarão Tigre',
    weight: 25,
    
    minRadius: 30,
    maxRadius: 50,
    baseSpeed: 70,
    speedVariance: 15,
    baseDamage: 20,
    aggroRange: 280,
    
    behavior: 'aggressive',
    chaseSpeedMultiplier: 1.2,
    fleeSpeedMultiplier: 1.4,
    
    colors: {
      primary: '#4A5568',      // Cinza azulado
      secondary: '#718096',    // Cinza claro
      accent: '#2D3748',       // Cinza escuro
      belly: '#CBD5E0',        // Barriga clara
      eye: '#1A202C',          // Olho escuro
      stripe: '#1A202C'        // Listras escuras
    },
    
    hasSpikes: false,
    hasScar: false,
    hasStripes: true,        // ÚNICO: Listras de tigre
    stripeCount: 6,
    finSize: 1.1,
    bodyShape: 'bulky',
    tailShape: 'crescent',
    
    glowOnChase: false,
    trailColor: '#4A5568',
    particleColor: '#718096'
  },
  
  // ========== TUBARÃO MARTELO (Hammerhead Shark) - Cabeça única ==========
  HAMMERHEAD: {
    id: 'hammerhead',
    name: 'Tubarão Martelo',
    weight: 15,
    
    minRadius: 28,
    maxRadius: 48,
    baseSpeed: 75,
    speedVariance: 20,
    baseDamage: 18,
    aggroRange: 300, // Maior visão devido ao formato da cabeça
    
    behavior: 'patrol',
    chaseSpeedMultiplier: 1.25,
    fleeSpeedMultiplier: 1.3,
    
    colors: {
      primary: '#5D6D7E',      // Cinza azulado
      secondary: '#85929E',    // Cinza médio
      accent: '#34495E',       // Azul aço escuro
      belly: '#D5DBDB',        // Barriga clara
      eye: '#2C3E50'           // Olho azul escuro
    },
    
    hasSpikes: false,
    hasScar: false,
    hasHammerHead: true,     // ÚNICO: Cabeça em formato de martelo
    hammerWidth: 2.0,
    finSize: 1.2,
    bodyShape: 'streamlined',
    tailShape: 'forked',
    
    glowOnChase: false,
    trailColor: '#5D6D7E',
    particleColor: '#85929E'
  },
  
  // ========== TUBARÃO ESPINHO (Spike Shark) - Defensivo com espinhos ==========
  SPIKE_SHARK: {
    id: 'spike_shark',
    name: 'Tubarão Espinho',
    weight: 10,
    
    minRadius: 32,
    maxRadius: 52,
    baseSpeed: 60,
    speedVariance: 15,
    baseDamage: 25, // Mais dano devido aos espinhos
    aggroRange: 200,
    
    behavior: 'defensive',
    chaseSpeedMultiplier: 1.1,
    fleeSpeedMultiplier: 1.6, // Foge mais rápido
    
    colors: {
      primary: '#566573',      // Cinza chumbo
      secondary: '#7B7D7D',    // Cinza metálico
      accent: '#424949',       // Cinza escuro
      belly: '#99A3A4',        // Barriga metálica
      eye: '#1C2833',          // Olho negro
      spike: '#F8F9F9'         // Espinhos claros
    },
    
    hasSpikes: true,         // ÚNICO: Espinhos nas costas
    spikeCount: 8,
    spikeLength: 1.2,
    hasScar: true,
    finSize: 0.9,
    bodyShape: 'bulky',
    tailShape: 'rounded',
    
    glowOnChase: false,
    trailColor: '#566573',
    particleColor: '#7B7D7D',
    damageReflection: 0.3    // ESPECIAL: Reflete 30% do dano recebido
  },
  
  // ========== TUBARÃO FANTASMA (Ghost Shark) - Rápido e evasivo ==========
  GHOST_SHARK: {
    id: 'ghost_shark',
    name: 'Tubarão Fantasma',
    weight: 8,
    
    minRadius: 22,
    maxRadius: 38,
    baseSpeed: 110, // Muito rápido!
    speedVariance: 25,
    baseDamage: 12,
    aggroRange: 220,
    
    behavior: 'ambush',
    chaseSpeedMultiplier: 1.5,
    fleeSpeedMultiplier: 1.8,
    
    colors: {
      primary: '#BDC3C7',      // Cinza claro fantasmagórico
      secondary: '#D5DBDB',    // Quase branco
      accent: '#95A5A6',       // Cinza névoa
      belly: '#ECF0F1',        // Branco névoa
      eye: '#5DADE2'           // Olho azul brilhante
    },
    
    hasSpikes: false,
    hasScar: false,
    finSize: 1.3, // Barbatanas grandes para velocidade
    bodyShape: 'sleek',
    tailShape: 'forked',
    
    glowOnChase: true,
    glowColor: '#5DADE2',
    trailColor: '#BDC3C7',
    particleColor: '#D5DBDB',
    opacity: 0.85,           // ESPECIAL: Semi-transparente
    phaseAbility: true       // ESPECIAL: Pode passar através de obstáculos
  },
  
  // ========== TUBARÃO TOURO (Bull Shark) - Tanque pesado ==========
  BULL_SHARK: {
    id: 'bull_shark',
    name: 'Tubarão Touro',
    weight: 2, // Raro
    
    minRadius: 40,
    maxRadius: 65,
    baseSpeed: 55, // Lento mas poderoso
    speedVariance: 10,
    baseDamage: 35, // MUITO dano!
    aggroRange: 180,
    
    behavior: 'aggressive',
    chaseSpeedMultiplier: 1.15,
    fleeSpeedMultiplier: 1.0, // Quase não foge
    
    colors: {
      primary: '#626567',      // Cinza ferro
      secondary: '#797D7F',    // Cinza aço
      accent: '#424949',       // Cinza carvão
      belly: '#85929E',        // Barriga metálica
      eye: '#C0392B',          // Olho vermelho intenso
      scar: '#922B21'          // Cicatrizes vermelhas
    },
    
    hasSpikes: false,
    hasScar: true,
    scarCount: 3,            // ÚNICO: Múltiplas cicatrizes de batalha
    finSize: 0.8,
    bodyShape: 'bulky',
    tailShape: 'rounded',
    
    glowOnChase: true,
    glowColor: '#C0392B',
    trailColor: '#626567',
    particleColor: '#797D7F',
    armorScale: 1.2          // ESPECIAL: 20% mais resistente
  }
};

// ================= FUNÇÕES AUXILIARES =================

/**
 * Seleciona um tipo de inimigo aleatório baseado nos pesos
 */
function selectRandomEnemyType() {
  const totalWeight = Object.values(ENEMY_TYPES).reduce((sum, type) => sum + type.weight, 0);
  let random = Math.random() * totalWeight;
  
  for (const type of Object.values(ENEMY_TYPES)) {
    random -= type.weight;
    if (random <= 0) {
      return type;
    }
  }
  
  return ENEMY_TYPES.RED_SHARK; // Fallback
}

/**
 * Cria um inimigo baseado em um tipo específico
 */
function createEnemyFromType(enemyType, x, y) {
  const radius = randomRange(enemyType.minRadius, enemyType.maxRadius);
  const speed = enemyType.baseSpeed + Math.random() * enemyType.speedVariance;
  
  return {
    // Posição e física
    x: x,
    y: y,
    r: radius,
    speed: speed,
    angle: Math.random() * Math.PI * 2,
    
    // Tipo e características
    type: enemyType.id,
    typeDef: enemyType,
    
    // Combat stats
    damage: enemyType.baseDamage,
    aggroRange: enemyType.aggroRange,
    
    // Estado e comportamento
    state: 'patrol',
    behavior: enemyType.behavior,
    
    // Timers de IA
    patrolTimer: randomRange(2, 4),
    patrolAngle: Math.random() * Math.PI * 2,
    
    // Animação
    swimPhase: Math.random() * Math.PI * 2,
    finPhase: Math.random() * Math.PI * 2,
    
    // XP e recompensas (baseado no tamanho e raridade)
    xp: Math.floor(radius * 2 * (1 + (100 - enemyType.weight) / 100)),
    
    // Cores do tipo
    colors: { ...enemyType.colors },
    
    // Características visuais
    visualFeatures: {
      hasSpikes: enemyType.hasSpikes || false,
      spikeCount: enemyType.spikeCount || 0,
      spikeLength: enemyType.spikeLength || 1.0,
      hasScar: enemyType.hasScar || false,
      scarCount: enemyType.scarCount || 1,
      hasStripes: enemyType.hasStripes || false,
      stripeCount: enemyType.stripeCount || 0,
      hasHammerHead: enemyType.hasHammerHead || false,
      hammerWidth: enemyType.hammerWidth || 1.0,
      finSize: enemyType.finSize || 1.0,
      bodyShape: enemyType.bodyShape || 'streamlined',
      tailShape: enemyType.tailShape || 'crescent'
    },
    
    // Efeitos especiais
    effects: {
      glowOnChase: enemyType.glowOnChase || false,
      glowColor: enemyType.glowColor || null,
      trailColor: enemyType.trailColor || '#ffffff',
      particleColor: enemyType.particleColor || '#ffffff',
      opacity: enemyType.opacity || 1.0,
      phaseAbility: enemyType.phaseAbility || false,
      damageReflection: enemyType.damageReflection || 0,
      armorScale: enemyType.armorScale || 1.0
    },
    
    // Multiplicadores de velocidade por estado
    chaseSpeedMult: enemyType.chaseSpeedMultiplier || 1.3,
    fleeSpeedMult: enemyType.fleeSpeedMultiplier || 1.5
  };
}

/**
 * Retorna informações de debug sobre um tipo de inimigo
 */
function getEnemyTypeInfo(typeId) {
  const type = Object.values(ENEMY_TYPES).find(t => t.id === typeId);
  if (!type) return null;
  
  return {
    name: type.name,
    rarity: type.weight < 5 ? 'Lendário' : 
            type.weight < 15 ? 'Raro' : 
            type.weight < 30 ? 'Incomum' : 'Comum',
    weight: type.weight,
    damage: type.baseDamage,
    speed: type.baseSpeed,
    special: 
      type.hasHammerHead ? 'Cabeça de Martelo' :
      type.hasSpikes ? 'Espinhos Defensivos' :
      type.phaseAbility ? 'Forma Fantasmagórica' :
      type.hasStripes ? 'Camuflagem Tigrada' :
      type.armorScale > 1 ? 'Armadura Reforçada' :
      'Nenhuma'
  };
}
