// ================= NOVOS TIPOS DE PEIXES ESPECIAIS =================
// 🎮 PEIXES COM MECÂNICAS ÚNICAS E GAMEPLAY DIFERENCIADO

const SPECIAL_FISH_TYPES = {
  
  // ========== CATEGORIA: PEIXES ELÉTRICOS ==========
  
  ELECTRIC_EEL: {
    id: 'electric_eel',
    name: 'Enguia Elétrica',
    weight: 4,
    category: 'electric',
    
    minRadius: 14,
    maxRadius: 22,
    baseSpeed: 75,
    speedVariance: 15,
    
    colors: {
      primary: '#00BFFF',      // Azul elétrico
      secondary: '#1E90FF',    // Azul dodger
      accent: '#FFFF00',       // Amarelo (sparks)
      belly: '#E0FFFF',        // Ciano claro
      eye: '#FFFF00',
      electric: '#00FFFF'      // Ciano brilhante para efeitos
    },
    
    food: 20,
    xp: 25,
    coins: 15,
    
    bodyShape: 'elongated',
    tailShape: 'small',
    hasElectricField: true,
    electricRange: 40,         // Raio do campo elétrico
    
    // Mecânica única: Descarga elétrica
    abilities: {
      electricShock: {
        enabled: true,
        stunDuration: 1.5,     // Segundos de stun
        damage: 10,            // Dano ao jogador
        cooldown: 3,           // Cooldown entre descargas
        visualEffect: 'lightning',
        triggerOnDamage: true  // Ativa quando é atacado
      }
    },
    
    behavior: 'defensive',
    dangerous: true,
    rare: true
  },
  
  // ========== CATEGORIA: PEIXES BOMBA ==========
  
  PUFFERFISH: {
    id: 'pufferfish',
    name: 'Baiacu',
    weight: 6,
    category: 'explosive',
    
    minRadius: 10,
    maxRadius: 18,
    baseSpeed: 50,
    speedVariance: 12,
    
    colors: {
      primary: '#FFD700',      // Dourado
      secondary: '#FFA500',    // Laranja
      accent: '#FF6347',       // Tomate
      belly: '#FFFACD',        // Amarelo limão
      eye: '#000000',
      spike: '#8B4513'         // Marrom para espinhos
    },
    
    food: 15,
    xp: 20,
    coins: 12,
    
    bodyShape: 'rounded',
    tailShape: 'small',
    canInflate: true,
    
    // Mecânica única: Inflar
    abilities: {
      inflate: {
        enabled: true,
        inflateTime: 0.5,      // Tempo para inflar completamente
        inflateSize: 2.5,      // Multiplica tamanho por 2.5x
        damage: 15,            // Dano se comido inflado
        safeEatTime: 1.0,      // Tempo seguro após inflar para comer
        spikeDamage: 5,        // Dano dos espinhos
        triggerOnThreat: true, // Infla quando ameaçado
        threatDistance: 60
      }
    },
    
    behavior: 'defensive',
    requiresTiming: true,      // Requer timing para comer com segurança
    dangerous: true
  },
  
  BOMBFISH: {
    id: 'bombfish',
    name: 'Peixe Bomba',
    weight: 3,
    category: 'explosive',
    
    minRadius: 12,
    maxRadius: 20,
    baseSpeed: 60,
    speedVariance: 15,
    
    colors: {
      primary: '#DC143C',      // Carmesim
      secondary: '#FF0000',    // Vermelho
      accent: '#000000',       // Preto
      belly: '#FFB6C1',        // Rosa claro
      eye: '#FF0000',
      fuse: '#FFD700'          // Dourado para pavio
    },
    
    food: 25,
    xp: 35,
    coins: 25,
    
    bodyShape: 'rounded',
    tailShape: 'small',
    hasFuse: true,             // Pavio como uma antena
    
    // Mecânica única: Explosão
    abilities: {
      explode: {
        enabled: true,
        fuseTime: 3.0,         // Tempo até explodir após ser tocado
        explosionRadius: 80,   // Raio da explosão
        damage: 25,            // Dano da explosão
        knockback: 200,        // Força de knockback
        destroysNearbyFish: true,
        rewardMultiplier: 2,   // Recompensa x2 se comido antes de explodir
        visualEffect: 'explosion'
      }
    },
    
    behavior: 'erratic',
    dangerous: true,
    rare: true,
    highRisk: true,
    highReward: true
  },
  
  // ========== CATEGORIA: PEIXES FANTASMA ==========
  
  GHOST_FISH: {
    id: 'ghost_fish',
    name: 'Peixe Fantasma',
    weight: 3,
    category: 'spectral',
    
    minRadius: 12,
    maxRadius: 18,
    baseSpeed: 85,
    speedVariance: 20,
    
    colors: {
      primary: '#E0FFFF',      // Ciano claro (transparente)
      secondary: '#B0E0E6',    // Azul powder
      accent: '#ADD8E6',       // Azul claro
      belly: '#F0FFFF',        // Azure
      eye: '#00FFFF',
      aura: '#00CED1'          // Turquesa para aura
    },
    
    food: 18,
    xp: 30,
    coins: 20,
    
    bodyShape: 'sleek',
    tailShape: 'flowing',
    isTranslucent: true,
    
    // Mecânica única: Fade In/Out
    abilities: {
      phaseShift: {
        enabled: true,
        fadeInTime: 1.5,       // Tempo para aparecer
        fadeOutTime: 1.0,      // Tempo para desaparecer
        visibleDuration: 3.0,  // Tempo que fica visível
        invisibleDuration: 2.0,// Tempo que fica invisível
        canBeCaughtWhileFading: false,
        bonusXPMultiplier: 1.5,// XP x1.5 se pego
        visualEffect: 'ethereal'
      }
    },
    
    behavior: 'evasive',
    difficultToCatch: true,
    rare: true,
    magical: true
  },
  
  SHADOW_FISH: {
    id: 'shadow_fish',
    name: 'Peixe Sombra',
    weight: 2,
    category: 'spectral',
    
    minRadius: 14,
    maxRadius: 22,
    baseSpeed: 95,
    speedVariance: 25,
    
    colors: {
      primary: '#2F4F4F',      // Cinza ardósia escuro
      secondary: '#000000',    // Preto
      accent: '#483D8B',       // Azul ardósia escuro
      belly: '#696969',        // Cinza escuro
      eye: '#9370DB',          // Roxo médio
      aura: '#4B0082'          // Indigo
    },
    
    food: 22,
    xp: 40,
    coins: 30,
    
    bodyShape: 'sleek',
    tailShape: 'crescent',
    hasShadowTrail: true,
    
    // Mecânica única: Teleporte
    abilities: {
      shadowStep: {
        enabled: true,
        teleportDistance: 150, // Distância do teleporte
        teleportCooldown: 4.0, // Cooldown entre teleportes
        teleportOnThreat: true,
        createDecoy: true,     // Deixa uma sombra falsa
        decoyDuration: 1.5,
        visualEffect: 'shadow_burst'
      }
    },
    
    behavior: 'evasive',
    veryDifficultToCatch: true,
    rare: true,
    legendary: true
  },
  
  // ========== CATEGORIA: PEIXES DOURADOS ==========
  
  LEGENDARY_GOLDFISH: {
    id: 'legendary_goldfish',
    name: 'Peixe Dourado Lendário',
    weight: 1,                 // MUITO raro (1% spawn)
    category: 'legendary',
    
    minRadius: 16,
    maxRadius: 24,
    baseSpeed: 120,            // MUITO rápido
    speedVariance: 30,
    
    colors: {
      primary: '#FFD700',      // Dourado
      secondary: '#FFA500',    // Laranja dourado
      accent: '#FF8C00',       // Laranja escuro
      belly: '#FFFFE0',        // Amarelo claro
      eye: '#8B4513',
      aura: '#FFD700',         // Aura dourada
      particle: '#FFFF00'      // Partículas amarelas
    },
    
    food: 30,
    xp: 100,                   // XP massivo
    coins: 500,                // Muitas moedas!
    gems: 5,                   // Dá gemas também!
    
    bodyShape: 'sleek',
    tailShape: 'flowing',
    hasGoldenAura: true,
    leavesGoldenTrail: true,
    
    // Mecânica única: Velocidade extrema
    abilities: {
      goldenBoost: {
        enabled: true,
        speedMultiplier: 1.8,  // 80% mais rápido
        zigzagMovement: true,  // Movimento em zigzag
        changeDirectionFrequency: 1.5,
        escapeWhenChased: true,
        visualEffect: 'golden_sparkle'
      }
    },
    
    behavior: 'evasive',
    veryDifficultToCatch: true,
    rare: true,
    legendary: true,
    announceSpawn: true,       // Anuncia na tela quando spawna!
    despawnTime: 15            // Desaparece após 15 segundos
  },
  
  // ========== CATEGORIA: PEIXES DE BUFF ==========
  
  RAINBOW_SPEEDFISH: {
    id: 'rainbow_speedfish',
    name: 'Peixe Arco-íris Veloz',
    weight: 4,
    category: 'buff',
    
    minRadius: 13,
    maxRadius: 19,
    baseSpeed: 90,
    speedVariance: 20,
    
    colors: {
      rainbow: true,
      primary: '#FF0000',
      secondary: '#FF7F00',
      accent: '#FFFF00',
      belly: '#FFFFFF',
      eye: '#000000'
    },
    
    food: 20,
    xp: 25,
    coins: 15,
    
    bodyShape: 'sleek',
    tailShape: 'flowing',
    hasRainbowTrail: true,
    
    // Mecânica única: Buff de velocidade
    abilities: {
      speedBuff: {
        enabled: true,
        speedMultiplier: 1.5,  // +50% velocidade
        duration: 10.0,        // 10 segundos
        visualEffect: 'rainbow_aura',
        particleTrail: true
      }
    },
    
    behavior: 'neutral',
    givesBuff: true,
    desirable: true
  },
  
  HEALING_JELLYFISH: {
    id: 'healing_jellyfish',
    name: 'Água-viva Curativa',
    weight: 5,
    category: 'buff',
    
    minRadius: 15,
    maxRadius: 23,
    baseSpeed: 40,             // Lenta
    speedVariance: 10,
    
    colors: {
      primary: '#FFB6C1',      // Rosa claro
      secondary: '#FFC0CB',    // Rosa
      accent: '#FF69B4',       // Rosa choque
      belly: '#FFF0F5',        // Lavanda blush
      eye: '#FF1493',
      tentacle: '#FFB6C1',
      glow: '#FF69B4'
    },
    
    food: 25,
    xp: 20,
    coins: 10,
    
    bodyShape: 'jellyfish',    // Forma especial
    tailShape: 'tentacles',
    hasTentacles: true,
    tentacleCount: 8,
    pulsingGlow: true,
    
    // Mecânica única: Cura
    abilities: {
      heal: {
        enabled: true,
        healAmount: 30,        // Recupera 30 de fome
        healPercentage: 0.3,   // Ou 30% da fome máxima
        instantHeal: true,
        visualEffect: 'healing_sparkles',
        healingAura: true,
        auraRange: 50          // Cura ao se aproximar
      }
    },
    
    behavior: 'slow',
    givesBuff: true,
    beneficial: true
  },
  
  STRENGTH_FISH: {
    id: 'strength_fish',
    name: 'Peixe da Força',
    weight: 3,
    category: 'buff',
    
    minRadius: 18,
    maxRadius: 26,
    baseSpeed: 65,
    speedVariance: 12,
    
    colors: {
      primary: '#DC143C',      // Carmesim
      secondary: '#8B0000',    // Vermelho escuro
      accent: '#FF4500',       // Laranja vermelho
      belly: '#FFE4E1',        // Rosa misty
      eye: '#FFFF00',
      muscle: '#8B0000'        // Linhas de músculo
    },
    
    food: 28,
    xp: 30,
    coins: 20,
    
    bodyShape: 'bulky',
    tailShape: 'powerful',
    hasMuscles: true,
    
    // Mecânica única: Buff de tamanho e dano
    abilities: {
      strengthBuff: {
        enabled: true,
        sizeMultiplier: 1.3,   // +30% tamanho
        damageMultiplier: 2.0, // Dano x2
        duration: 8.0,         // 8 segundos
        canEatLargerFish: true,// Pode comer peixes maiores
        visualEffect: 'power_aura',
        redAura: true
      }
    },
    
    behavior: 'neutral',
    givesBuff: true,
    powerful: true
  },
  
  // ========== CATEGORIA: PEIXES DE PROFUNDIDADE ==========
  
  ABYSSAL_FISH: {
    id: 'abyssal_fish',
    name: 'Peixe Abissal',
    weight: 5,
    category: 'deep',
    
    minRadius: 20,
    maxRadius: 30,
    baseSpeed: 55,
    speedVariance: 10,
    
    colors: {
      primary: '#000080',      // Azul marinho
      secondary: '#191970',    // Azul meia-noite
      accent: '#000000',       // Preto
      belly: '#483D8B',        // Azul ardósia escuro
      eye: '#00FFFF',          // Ciano brilhante
      biolum: '#00CED1',       // Turquesa (bioluminescência)
      light: '#00FFFF'
    },
    
    food: 35,
    xp: 40,
    coins: 25,
    
    bodyShape: 'bulky',
    tailShape: 'fan',
    hasBioluminescence: true,
    biolumCount: 6,            // Pontos de luz
    hasLure: true,             // Antena luminosa
    
    // Mecânica única: Zona de profundidade
    spawnConditions: {
      minDepth: 0.7,           // Só spawna abaixo de 70% do mapa
      preferDarkness: true,
      deepWaterOnly: true
    },
    
    abilities: {
      lureFish: {
        enabled: true,
        lureRange: 60,         // Atrai outros peixes
        attractsSmallFish: true,
        slowsNearbyFish: true
      }
    },
    
    behavior: 'territorial',
    deepWater: true,
    rare: true
  },
  
  ANGLER_FISH: {
    id: 'angler_fish',
    name: 'Peixe Pescador',
    weight: 4,
    category: 'deep',
    
    minRadius: 22,
    maxRadius: 32,
    baseSpeed: 45,
    speedVariance: 8,
    
    colors: {
      primary: '#2F4F4F',      // Cinza ardósia escuro
      secondary: '#000000',    // Preto
      accent: '#696969',       // Cinza escuro
      belly: '#4B4B4B',        // Cinza dim
      eye: '#FFFFFF',
      lure: '#FFFF00',         // Amarelo brilhante
      teeth: '#FFFFFF'
    },
    
    food: 40,
    xp: 45,
    coins: 30,
    
    bodyShape: 'bulky',
    tailShape: 'small',
    hasAnglerLure: true,       // Antena com luz
    hasSharpTeeth: true,
    intimidating: true,
    
    spawnConditions: {
      minDepth: 0.6,
      preferDarkness: true
    },
    
    // Mecânica única: Emboscada
    abilities: {
      ambush: {
        enabled: true,
        hideInDarkness: true,
        lureRadius: 80,        // Range da isca
        lureDamage: 20,        // Dano se pego pela isca
        surpriseAttack: true,
        visualEffect: 'lure_glow'
      }
    },
    
    behavior: 'ambush',
    dangerous: true,
    deepWater: true
  },
  
  // ========== CATEGORIA: MINI-BOSS ==========
  
  GIANT_SQUID: {
    id: 'giant_squid',
    name: 'Lula Gigante',
    weight: 1,                 // Muito raro
    category: 'boss',
    
    minRadius: 40,
    maxRadius: 60,
    baseSpeed: 70,
    speedVariance: 15,
    
    colors: {
      primary: '#8B0000',      // Vermelho escuro
      secondary: '#DC143C',    // Carmesim
      accent: '#FF4500',       // Laranja vermelho
      belly: '#FFB6C1',        // Rosa claro
      eye: '#FFD700',          // Dourado
      tentacle: '#8B0000',
      sucker: '#FFA500'        // Laranja
    },
    
    food: 100,                 // Muita comida!
    xp: 150,                   // XP massivo
    coins: 100,
    gems: 10,
    
    bodyShape: 'squid',        // Forma especial
    tailShape: 'tentacles',
    hasTentacles: true,
    tentacleCount: 8,
    
    // Mecânica única: Mini-boss que foge
    health: 3,                 // Precisa ser mordido 3x
    
    abilities: {
      escape: {
        enabled: true,
        fleeWhenDamaged: true,
        fleeSpeed: 150,        // Muito rápido quando foge
        inkCloud: true,        // Solta tinta ao fugir
        inkDuration: 3.0,
        inkSlowsPlayer: true,
        tentacleWhip: true,    // Ataque com tentáculos
        whipDamage: 15,
        whipRange: 80
      }
    },
    
    behavior: 'boss',
    isBoss: true,
    requiresMultipleHits: true,
    announces: true,
    despawnTime: 30,           // 30 segundos para derrotar
    legendary: true
  },
  
  MECHANICAL_FISH: {
    id: 'mechanical_fish',
    name: 'Peixe Mecânico',
    weight: 2,
    category: 'boss',
    
    minRadius: 30,
    maxRadius: 45,
    baseSpeed: 80,
    speedVariance: 20,
    
    colors: {
      primary: '#708090',      // Cinza ardósia
      secondary: '#C0C0C0',    // Prata
      accent: '#FFD700',       // Dourado
      belly: '#DCDCDC',        // Gainsboro
      eye: '#FF0000',          // Vermelho (LED)
      metal: '#A9A9A9',        // Cinza escuro
      gear: '#FFD700'
    },
    
    food: 50,
    xp: 80,
    coins: 80,
    gems: 5,
    
    bodyShape: 'mechanical',
    tailShape: 'propeller',
    hasGears: true,
    hasSteamVents: true,
    
    health: 2,                 // 2 hits para derrotar
    
    // Mecânica única: Padrões de movimento programados
    abilities: {
      programmedMovement: {
        enabled: true,
        movementPatterns: ['circle', 'zigzag', 'spiral'],
        changePatternTime: 4.0,
        predictable: false,    // Muda padrões aleatoriamente
        shootProjectiles: true,// Atira projéteis
        projectileSpeed: 150,
        projectileDamage: 10
      }
    },
    
    behavior: 'boss',
    isBoss: true,
    requiresMultipleHits: true,
    mechanical: true,
    rare: true
  },
  
  // ========== CATEGORIA: PEIXES MÁGICOS ==========
  
  CRYSTAL_FISH: {
    id: 'crystal_fish',
    name: 'Peixe de Cristal',
    weight: 3,
    category: 'magical',
    
    minRadius: 14,
    maxRadius: 20,
    baseSpeed: 75,
    speedVariance: 18,
    
    colors: {
      primary: '#E0FFFF',      // Ciano claro
      secondary: '#B0E0E6',    // Azul powder
      accent: '#ADD8E6',       // Azul claro
      belly: '#F0FFFF',        // Azure
      eye: '#00CED1',
      crystal: '#00FFFF',      // Ciano
      sparkle: '#FFFFFF'
    },
    
    food: 22,
    xp: 35,
    coins: 25,
    gems: 3,                   // Dá gemas!
    
    bodyShape: 'crystalline',
    tailShape: 'sharp',
    isCrystalline: true,
    reflectsLight: true,
    sparkles: true,
    
    // Mecânica única: Multiplicador de gemas
    abilities: {
      gemBonus: {
        enabled: true,
        gemMultiplier: 2,      // Dobra gemas coletadas
        duration: 15.0,
        visualEffect: 'crystal_sparkle',
        attractsGems: true,
        gemMagnetRange: 100
      }
    },
    
    behavior: 'neutral',
    magical: true,
    valuable: true,
    rare: true
  },
  
  STAR_FISH: {
    id: 'star_fish',
    name: 'Peixe Estrela',
    weight: 2,
    category: 'magical',
    
    minRadius: 16,
    maxRadius: 24,
    baseSpeed: 70,
    speedVariance: 15,
    
    colors: {
      primary: '#FFD700',      // Dourado
      secondary: '#FFFF00',    // Amarelo
      accent: '#FFA500',       // Laranja
      belly: '#FFFACD',        // Amarelo limão
      eye: '#FFFFFF',
      star: '#FFFFFF',         // Pontos de estrela
      sparkle: '#FFFF00'
    },
    
    food: 25,
    xp: 50,
    coins: 40,
    
    bodyShape: 'star',         // Forma de estrela
    tailShape: 'none',
    isStarShaped: true,
    hasCelestialAura: true,
    leavesStarTrail: true,
    
    // Mecânica única: XP multiplicador
    abilities: {
      xpBonus: {
        enabled: true,
        xpMultiplier: 2,       // XP x2
        duration: 12.0,
        visualEffect: 'star_burst',
        goldenAura: true
      }
    },
    
    behavior: 'neutral',
    magical: true,
    legendary: true,
    rare: true
  }
};

/**
 * Combina os tipos de peixes originais com os especiais
 */
function getAllFishTypes() {
  return { ...FISH_TYPES, ...SPECIAL_FISH_TYPES };
}

/**
 * Seleciona um tipo de peixe com base em profundidade e raridade
 */
function selectFishTypeByDepth(normalizedDepth) {
  const allTypes = getAllFishTypes();
  const availableTypes = [];
  
  // Filtrar peixes disponíveis baseado na profundidade
  for (const [key, type] of Object.entries(allTypes)) {
    // Verificar condições de spawn
    if (type.spawnConditions) {
      const { minDepth, maxDepth } = type.spawnConditions;
      
      if (minDepth !== undefined && normalizedDepth < minDepth) continue;
      if (maxDepth !== undefined && normalizedDepth > maxDepth) continue;
    }
    
    availableTypes.push(type);
  }
  
  // Selecionar baseado em peso
  const totalWeight = availableTypes.reduce((sum, type) => sum + type.weight, 0);
  let random = Math.random() * totalWeight;
  
  for (const type of availableTypes) {
    random -= type.weight;
    if (random <= 0) {
      return type;
    }
  }
  
  // Fallback
  return FISH_TYPES.SARDINE;
}

/**
 * Verifica se um peixe deve anunciar seu spawn
 */
function shouldAnnounceFishSpawn(fishType) {
  return fishType.announceSpawn || fishType.legendary || fishType.isBoss;
}

/**
 * Retorna informações sobre categorias de peixes especiais
 */
function getSpecialFishCategories() {
  const categories = {};
  
  for (const type of Object.values(SPECIAL_FISH_TYPES)) {
    const cat = type.category || 'other';
    if (!categories[cat]) {
      categories[cat] = [];
    }
    categories[cat].push(type);
  }
  
  return categories;
}

/**
 * Retorna estatísticas sobre tipos de peixes
 */
function getFishTypeStats() {
  const all = getAllFishTypes();
  const special = SPECIAL_FISH_TYPES;
  
  return {
    total: Object.keys(all).length,
    original: Object.keys(FISH_TYPES).length,
    special: Object.keys(special).length,
    legendary: Object.values(all).filter(t => t.legendary).length,
    boss: Object.values(all).filter(t => t.isBoss).length,
    buffGivers: Object.values(all).filter(t => t.givesBuff).length,
    dangerous: Object.values(all).filter(t => t.dangerous).length
  };
}
