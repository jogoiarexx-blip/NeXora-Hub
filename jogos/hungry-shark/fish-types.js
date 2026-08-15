// ================= TIPOS DE PEIXES EXPANDIDO =================
// Variedades de peixes com características únicas

// ✅ NOTA: Tipos especiais com habilidades únicas definidos em fish-types-expanded.js
// Este arquivo contém os tipos básicos. Os tipos serão mesclados automaticamente.

const FISH_TYPES = {
  // ========== PEIXES PEQUENOS (Easy prey) ==========
  
  SARDINE: {
    id: 'sardine',
    name: 'Sardinha',
    weight: 30, // Mais comum
    
    minRadius: 8,
    maxRadius: 12,
    baseSpeed: 90,
    speedVariance: 20,
    
    colors: {
      primary: '#C0C0C0',      // Prata
      secondary: '#E8E8E8',    // Prata claro
      accent: '#A8A8A8',       // Prata escuro
      belly: '#F5F5F5',        // Quase branco
      eye: '#000000'
    },
    
    food: 5,
    xp: 3,
    
    bodyShape: 'sleek',
    tailShape: 'forked',
    hasShimmer: true,        // Brilho metálico
    schooling: true          // Nada em cardumes
  },
  
  GOLDFISH: {
    id: 'goldfish',
    name: 'Peixe Dourado',
    weight: 25,
    
    minRadius: 10,
    maxRadius: 15,
    baseSpeed: 70,
    speedVariance: 15,
    
    colors: {
      primary: '#FFD700',      // Dourado
      secondary: '#FFA500',    // Laranja dourado
      accent: '#FF8C00',       // Laranja escuro
      belly: '#FFFFE0',        // Amarelo claro
      eye: '#8B4513'           // Marrom
    },
    
    food: 8,
    xp: 5,
    
    bodyShape: 'rounded',
    tailShape: 'flowing',    // Cauda fluida
    hasShimmer: true,
    decorative: true         // Peixe decorativo
  },
  
  NEON_TETRA: {
    id: 'neon_tetra',
    name: 'Neon Tetra',
    weight: 20,
    
    minRadius: 6,
    maxRadius: 10,
    baseSpeed: 100,
    speedVariance: 25,
    
    colors: {
      primary: '#00CED1',      // Turquesa neon
      secondary: '#FF1493',    // Rosa neon
      accent: '#00FFFF',       // Ciano brilhante
      belly: '#FFFFFF',        // Branco
      eye: '#000000',
      stripe: '#00FFFF'        // Listra neon
    },
    
    food: 4,
    xp: 4,
    
    bodyShape: 'sleek',
    tailShape: 'small',
    hasStripe: true,
    hasGlow: true,           // Brilha no escuro
    schooling: true
  },
  
  // ========== PEIXES MÉDIOS (Balanced) ==========
  
  CLOWNFISH: {
    id: 'clownfish',
    name: 'Peixe Palhaço',
    weight: 18,
    
    minRadius: 12,
    maxRadius: 18,
    baseSpeed: 75,
    speedVariance: 18,
    
    colors: {
      primary: '#FF6347',      // Laranja coral
      secondary: '#FF4500',    // Laranja vermelho
      accent: '#FFFFFF',       // Branco
      belly: '#FFE4B5',        // Pêssego claro
      eye: '#000000',
      stripe: '#FFFFFF'        // Listras brancas
    },
    
    food: 12,
    xp: 8,
    
    bodyShape: 'rounded',
    tailShape: 'rounded',
    hasBands: true,          // Faixas brancas características
    bandCount: 3
  },
  
  ANGELFISH: {
    id: 'angelfish',
    name: 'Peixe Anjo',
    weight: 15,
    
    minRadius: 15,
    maxRadius: 22,
    baseSpeed: 65,
    speedVariance: 15,
    
    colors: {
      primary: '#4169E1',      // Azul royal
      secondary: '#FFD700',    // Dourado
      accent: '#000080',       // Azul marinho
      belly: '#F0F8FF',        // Azul alice
      eye: '#FFD700',
      stripe: '#FFD700'
    },
    
    food: 15,
    xp: 10,
    
    bodyShape: 'tall',       // Corpo alto e achatado
    tailShape: 'triangular',
    hasFancyFins: true,      // Barbatanas longas e elaboradas
    hasStripe: true,
    stripeCount: 4
  },
  
  BUTTERFLYFISH: {
    id: 'butterflyfish',
    name: 'Peixe Borboleta',
    weight: 12,
    
    minRadius: 13,
    maxRadius: 19,
    baseSpeed: 80,
    speedVariance: 20,
    
    colors: {
      primary: '#FFFF00',      // Amarelo brilhante
      secondary: '#FFFFFF',    // Branco
      accent: '#000000',       // Preto
      belly: '#FFFACD',        // Amarelo limão
      eye: '#000000',
      pattern: '#000000'       // Padrões pretos
    },
    
    food: 14,
    xp: 9,
    
    bodyShape: 'disc',       // Corpo em forma de disco
    tailShape: 'small',
    hasPattern: true,        // Padrões geométricos
    patternType: 'spots',
    decorative: true
  },
  
  // ========== PEIXES GRANDES (Challenging) ==========
  
  GROUPER: {
    id: 'grouper',
    name: 'Garoupa',
    weight: 10,
    
    minRadius: 20,
    maxRadius: 30,
    baseSpeed: 55,
    speedVariance: 12,
    
    colors: {
      primary: '#8B7355',      // Marrom
      secondary: '#A0826D',    // Marrom claro
      accent: '#654321',       // Marrom escuro
      belly: '#D2B48C',        // Tan
      eye: '#DAA520',          // Dourado escuro
      spot: '#2F4F4F'          // Verde escuro
    },
    
    food: 25,
    xp: 15,
    
    bodyShape: 'bulky',
    tailShape: 'rounded',
    hasSpots: true,          // Manchas pelo corpo
    spotCount: 15,
    territorial: true        // Defende território
  },
  
  BARRACUDA: {
    id: 'barracuda',
    name: 'Barracuda',
    weight: 8,
    
    minRadius: 18,
    maxRadius: 28,
    baseSpeed: 110,          // Muito rápido!
    speedVariance: 20,
    
    colors: {
      primary: '#708090',      // Cinza ardósia
      secondary: '#C0C0C0',    // Prata
      accent: '#2F4F4F',       // Cinza ardósia escuro
      belly: '#F5F5F5',        // Branco gelo
      eye: '#FF0000'           // Vermelho (agressivo)
    },
    
    food: 20,
    xp: 18,
    
    bodyShape: 'sleek',      // Muito esguio
    tailShape: 'forked',
    hasTeeth: true,          // Dentes visíveis
    aggressive: true,        // Foge menos
    elongated: true          // Corpo muito alongado
  },
  
  // ========== PEIXES ESPECIAIS (Rare) ==========
  
  LIONFISH: {
    id: 'lionfish',
    name: 'Peixe Leão',
    weight: 5,
    
    minRadius: 16,
    maxRadius: 24,
    baseSpeed: 50,
    speedVariance: 10,
    
    colors: {
      primary: '#DC143C',      // Vermelho carmesim
      secondary: '#FFFFFF',    // Branco
      accent: '#8B0000',       // Vermelho escuro
      belly: '#FFE4E1',        // Rosa misty
      eye: '#000000',
      stripe: '#000000'        // Listras pretas
    },
    
    food: 18,
    xp: 20,
    
    bodyShape: 'spiky',
    tailShape: 'fan',        // Cauda em leque
    hasSpines: true,         // Espinhos venenosos
    spineCount: 12,
    hasStripes: true,
    stripeCount: 8,
    venomous: true,          // Causa dano ao tocar
    slowMoving: true
  },
  
  TRIGGERFISH: {
    id: 'triggerfish',
    name: 'Peixe Gatilho',
    weight: 6,
    
    minRadius: 14,
    maxRadius: 22,
    baseSpeed: 60,
    speedVariance: 15,
    
    colors: {
      primary: '#4682B4',      // Azul aço
      secondary: '#87CEEB',    // Azul céu
      accent: '#FFD700',       // Dourado
      belly: '#F0FFFF',        // Azure
      eye: '#FF6347',          // Tomate
      pattern: '#FFD700'
    },
    
    food: 16,
    xp: 14,
    
    bodyShape: 'compressed', // Lateralmente comprimido
    tailShape: 'truncate',   // Cauda truncada
    hasPattern: true,
    patternType: 'lines',
    territorial: true,
    defensive: true          // Defende-se se ameaçado
  },
  
  SURGEONFISH: {
    id: 'surgeonfish',
    name: 'Peixe Cirurgião',
    weight: 7,
    
    minRadius: 12,
    maxRadius: 20,
    baseSpeed: 85,
    speedVariance: 18,
    
    colors: {
      primary: '#1E90FF',      // Azul dodger
      secondary: '#00BFFF',    // Azul céu profundo
      accent: '#FFD700',       // Dourado
      belly: '#E0FFFF',        // Ciano claro
      eye: '#000000',
      spine: '#FFD700'         // Espinho dourado
    },
    
    food: 14,
    xp: 12,
    
    bodyShape: 'oval',
    tailShape: 'crescent',
    hasSpine: true,          // Espinho afiado na cauda
    hasPattern: true,
    schooling: true
  },
  
  // ========== PEIXES EXÓTICOS (Ultra Rare) ==========
  
  MOORISH_IDOL: {
    id: 'moorish_idol',
    name: 'Ídolo Mouro',
    weight: 3,
    
    minRadius: 15,
    maxRadius: 23,
    baseSpeed: 70,
    speedVariance: 15,
    
    colors: {
      primary: '#FFFFFF',      // Branco puro
      secondary: '#000000',    // Preto
      accent: '#FFD700',       // Dourado
      belly: '#F8F8FF',        // Branco fantasma
      eye: '#000000',
      band: '#000000'          // Bandas pretas
    },
    
    food: 22,
    xp: 25,
    
    bodyShape: 'tall',
    tailShape: 'filament',   // Filamento longo
    hasBands: true,
    bandCount: 2,
    hasFilament: true,       // Barbatana dorsal com filamento longo
    elegant: true,
    rare: true
  },
  
  MANDARIN_FISH: {
    id: 'mandarin_fish',
    name: 'Peixe Mandarim',
    weight: 2,
    
    minRadius: 10,
    maxRadius: 16,
    baseSpeed: 55,
    speedVariance: 12,
    
    colors: {
      primary: '#FF1493',      // Rosa profundo
      secondary: '#00CED1',    // Turquesa
      accent: '#FF8C00',       // Laranja escuro
      belly: '#FFE4B5',        // Moccasin
      eye: '#FF0000',
      pattern: ['#FF1493', '#00CED1', '#FF8C00', '#9400D3'] // Multicolorido
    },
    
    food: 20,
    xp: 30,
    
    bodyShape: 'rounded',
    tailShape: 'rounded',
    hasPsychedelicPattern: true, // Padrão psicodélico único
    multicolored: true,
    rare: true,
    decorative: true
  },
  
  RAINBOW_FISH: {
    id: 'rainbow_fish',
    name: 'Peixe Arco-Íris',
    weight: 4,
    
    minRadius: 11,
    maxRadius: 17,
    baseSpeed: 80,
    speedVariance: 20,
    
    colors: {
      rainbow: true, // Usa todas as cores do arco-íris
      primary: '#FF0000',
      secondary: '#FF7F00',
      accent: '#FFFF00',
      belly: '#FFFFFF',
      eye: '#000000'
    },
    
    food: 18,
    xp: 22,
    
    bodyShape: 'sleek',
    tailShape: 'flowing',
    hasRainbowSheen: true,   // Brilho iridescente
    hasShimmer: true,
    schooling: true,
    magical: true
  }
};

/**
 * Seleciona um tipo de peixe aleatório baseado nos pesos
 */
function selectRandomFishType() {
  const totalWeight = Object.values(FISH_TYPES).reduce((sum, type) => sum + type.weight, 0);
  let random = Math.random() * totalWeight;
  
  for (const type of Object.values(FISH_TYPES)) {
    random -= type.weight;
    if (random <= 0) {
      return type;
    }
  }
  
  return FISH_TYPES.SARDINE; // Fallback
}

/**
 * Cria um peixe baseado em um tipo específico
 */
function createFishFromType(fishType, x, y) {
  const radius = randomRange(fishType.minRadius, fishType.maxRadius);
  const speed = fishType.baseSpeed + Math.random() * fishType.speedVariance;
  
  return {
    x: x,
    y: y,
    r: radius,
    speed: speed,
    angle: Math.random() * Math.PI * 2,
    
    // Tipo e características
    type: fishType.id,
    typeDef: fishType,
    
    // Cor (pode ser array para multicolorido)
    color: fishType.colors.primary,
    colors: { ...fishType.colors },
    
    // Comida e XP
    food: fishType.food,
    xp: fishType.xp,
    
    // Animação
    swimPhase: Math.random() * Math.PI * 2,
    finPhase: Math.random() * Math.PI * 2,
    
    // Comportamento
    wanderTimer: randomRange(1, 3),
    wanderAngle: Math.random() * Math.PI * 2,
    
    // Características visuais
    visualFeatures: {
      bodyShape: fishType.bodyShape || 'sleek',
      tailShape: fishType.tailShape || 'forked',
      hasShimmer: fishType.hasShimmer || false,
      hasGlow: fishType.hasGlow || false,
      hasStripe: fishType.hasStripe || false,
      hasStripes: fishType.hasStripes || false,
      stripeCount: fishType.stripeCount || 0,
      hasBands: fishType.hasBands || false,
      bandCount: fishType.bandCount || 0,
      hasSpots: fishType.hasSpots || false,
      spotCount: fishType.spotCount || 0,
      hasSpines: fishType.hasSpines || false,
      spineCount: fishType.spineCount || 0,
      hasPattern: fishType.hasPattern || false,
      patternType: fishType.patternType || 'none',
      hasFancyFins: fishType.hasFancyFins || false,
      hasTeeth: fishType.hasTeeth || false,
      hasSpine: fishType.hasSpine || false,
      hasFilament: fishType.hasFilament || false,
      hasPsychedelicPattern: fishType.hasPsychedelicPattern || false,
      hasRainbowSheen: fishType.hasRainbowSheen || false,
      multicolored: fishType.multicolored || false,
      elongated: fishType.elongated || false
    },
    
    // Comportamento especial
    schooling: fishType.schooling || false,
    territorial: fishType.territorial || false,
    aggressive: fishType.aggressive || false,
    defensive: fishType.defensive || false,
    venomous: fishType.venomous || false,
    rare: fishType.rare || false,
    
    _pooled: true
  };
}

/**
 * Retorna informações sobre um tipo de peixe
 */
function getFishTypeInfo(typeId) {
  const type = Object.values(FISH_TYPES).find(t => t.id === typeId);
  if (!type) return null;
  
  return {
    name: type.name,
    rarity: type.weight < 3 ? 'Ultra Raro' : 
            type.weight < 8 ? 'Raro' : 
            type.weight < 15 ? 'Incomum' : 'Comum',
    weight: type.weight,
    size: `${type.minRadius}-${type.maxRadius}`,
    speed: type.baseSpeed,
    food: type.food,
    xp: type.xp
  };
}

// ✅ INTEGRAÇÃO: Mesclar tipos especiais com tipos básicos
if (typeof SPECIAL_FISH_TYPES !== 'undefined') {
  Object.assign(FISH_TYPES, SPECIAL_FISH_TYPES);
  console.log('✅ Tipos especiais de peixes integrados:', Object.keys(SPECIAL_FISH_TYPES).length);
}

