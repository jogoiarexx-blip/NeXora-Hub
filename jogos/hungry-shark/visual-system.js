// ================= SISTEMA DE EVOLUÇÃO VISUAL E SKINS =================

/**
 * Sistema completo de aparência do tubarão
 * - Evolução por nível
 * - Skins desbloqueáveis
 * - Auras de conquistas
 * - Transformações elementais
 */

// ================= EVOLUÇÕES POR NÍVEL =================

const LEVEL_EVOLUTIONS = {
  1: {
    name: 'Filhote',
    sizeMultiplier: 1.0,
    colors: { primary: '#6B7280', secondary: '#9CA3AF', belly: '#E5E7EB' },
    features: ['basicFins']
  },
  5: {
    name: 'Jovem',
    sizeMultiplier: 1.2,
    colors: { primary: '#4B5563', secondary: '#6B7280', belly: '#D1D5DB' },
    features: ['basicFins', 'sharpTeeth']
  },
  10: {
    name: 'Adulto',
    sizeMultiplier: 1.4,
    colors: { primary: '#374151', secondary: '#4B5563', belly: '#9CA3AF' },
    features: ['largeFins', 'sharpTeeth', 'battleScars']
  },
  15: {
    name: 'Veterano',
    sizeMultiplier: 1.6,
    colors: { primary: '#1F2937', secondary: '#374151', belly: '#6B7280' },
    features: ['largeFins', 'razorTeeth', 'battleScars', 'intimidatingEyes']
  },
  25: {
    name: 'Apex',
    sizeMultiplier: 1.8,
    colors: { primary: '#111827', secondary: '#1F2937', belly: '#4B5563' },
    features: ['massiveFins', 'razorTeeth', 'battleScars', 'glowingEyes', 'spikedDorsal']
  },
  50: {
    name: 'Lendário',
    sizeMultiplier: 2.0,
    colors: { primary: '#0F172A', secondary: '#111827', belly: '#374151' },
    features: ['massiveFins', 'razorTeeth', 'deepScars', 'glowingEyes', 'spikedDorsal', 'ancientMarkings']
  }
};

// ================= SKINS DESBLOQUEÁVEIS =================

const SKINS = {
  default: {
    id: 'default',
    name: 'Padrão',
    description: 'Tubarão cinza clássico',
    unlocked: true,
    colors: { primary: '#6B7280', secondary: '#9CA3AF', belly: '#E5E7EB' },
    effects: []
  },
  
  golden: {
    id: 'golden',
    name: 'Dourado',
    description: 'Brilho do ouro',
    achievement: 'level_25',
    unlocked: false,
    colors: { primary: '#F59E0B', secondary: '#FBBF24', belly: '#FDE68A' },
    effects: ['shimmer', 'coinTrail'],
    bonus: { coinMultiplier: 1.2 }
  },
  
  shadow: {
    id: 'shadow',
    name: 'Sombrio',
    description: 'Das profundezas',
    achievement: 'survivor_15min',
    unlocked: false,
    colors: { primary: '#000000', secondary: '#1F2937', belly: '#374151' },
    effects: ['darkAura', 'smokeTrail'],
    bonus: { speedBonus: 20 }
  },
  
  crystal: {
    id: 'crystal',
    name: 'Cristalino',
    description: 'Transparência mágica',
    achievement: 'gem_hoarder',
    unlocked: false,
    colors: { primary: '#A855F7', secondary: '#C084FC', belly: '#E9D5FF' },
    effects: ['sparkle', 'gemTrail'],
    bonus: { gemChance: 1.5 }
  },
  
  volcanic: {
    id: 'volcanic',
    name: 'Vulcânico',
    description: 'Fogo interno',
    achievement: 'combo_legend',
    unlocked: false,
    colors: { primary: '#DC2626', secondary: '#EF4444', belly: '#FCA5A5' },
    effects: ['emberTrail', 'heatWaves'],
    bonus: { damageBonus: 25 }
  },
  
  arctic: {
    id: 'arctic',
    name: 'Ártico',
    description: 'Frio extremo',
    achievement: 'no_damage',
    unlocked: false,
    colors: { primary: '#60A5FA', secondary: '#93C5FD', belly: '#DBEAFE' },
    effects: ['frostTrail', 'iceShards'],
    bonus: { hungerDrain: -20 }
  },
  
  toxic: {
    id: 'toxic',
    name: 'Tóxico',
    description: 'Veneno letal',
    achievement: 'enemy_hunter',
    unlocked: false,
    colors: { primary: '#10B981', secondary: '#34D399', belly: '#A7F3D0' },
    effects: ['poisonTrail', 'toxicGlow'],
    bonus: { enemySlowdown: 0.3 }
  },
  
  spectral: {
    id: 'spectral',
    name: 'Espectral',
    description: 'Alma do oceano',
    achievement: 'thousand_fish',
    unlocked: false,
    colors: { primary: '#8B5CF6', secondary: '#A78BFA', belly: '#C4B5FD' },
    effects: ['ghostTrail', 'etherealGlow'],
    bonus: { xpBonus: 30 }
  },
  
  cybernetic: {
    id: 'cybernetic',
    name: 'Cibernético',
    description: 'Tecnologia avançada',
    achievement: 'max_all_upgrades',
    unlocked: false,
    colors: { primary: '#0EA5E9', secondary: '#38BDF8', belly: '#7DD3FC' },
    effects: ['digitalTrail', 'circuitGlow', 'hologram'],
    bonus: { allStats: 15 }
  }
};

// ================= AURAS DE CONQUISTAS =================

const ACHIEVEMENT_AURAS = {
  level_25: {
    name: 'Aura de Apex',
    color: '#FFD700',
    effect: 'goldRings',
    radius: 100
  },
  combo_legend: {
    name: 'Aura de Combo',
    color: '#EF4444',
    effect: 'spiralFlames',
    radius: 120
  },
  thousand_fish: {
    name: 'Aura Pescador',
    color: '#60A5FA',
    effect: 'fishSpirits',
    radius: 90
  },
  max_all_upgrades: {
    name: 'Aura Suprema',
    color: '#A855F7',
    effect: 'powerPulse',
    radius: 150
  }
};

// ================= TRANSFORMAÇÕES =================

const TRANSFORMATIONS = {
  mega: {
    id: 'mega',
    name: 'Mega Shark',
    icon: '🦈',
    duration: 10000,
    cooldown: 60000,
    unlockLevel: 20,
    effects: {
      sizeMultiplier: 3.0,
      damageMultiplier: 5.0,
      speedMultiplier: 0.7,
      invulnerable: true,
      massiveHunger: true
    },
    visual: {
      color: '#1E3A8A',
      aura: '#3B82F6',
      particles: 'waterExplosion'
    }
  },
  
  fire: {
    id: 'fire',
    name: 'Tubarão de Fogo',
    icon: '🔥',
    duration: 8000,
    cooldown: 45000,
    unlockLevel: 15,
    effects: {
      damageMultiplier: 3.0,
      burnEnemies: true,
      fireTrail: true,
      noWaterResistance: true
    },
    visual: {
      color: '#DC2626',
      aura: '#F97316',
      particles: 'flames'
    }
  },
  
  ice: {
    id: 'ice',
    name: 'Tubarão de Gelo',
    icon: '❄️',
    duration: 8000,
    cooldown: 45000,
    unlockLevel: 15,
    effects: {
      slowEnemies: 0.5,
      freezeOnTouch: true,
      iceArmor: 100,
      regeneration: 10
    },
    visual: {
      color: '#3B82F6',
      aura: '#93C5FD',
      particles: 'frost'
    }
  },
  
  electric: {
    id: 'electric',
    name: 'Tubarão Elétrico',
    icon: '⚡',
    duration: 8000,
    cooldown: 45000,
    unlockLevel: 15,
    effects: {
      chainLightning: true,
      speedMultiplier: 2.0,
      stunEnemies: true,
      electricField: 150
    },
    visual: {
      color: '#FBBF24',
      aura: '#FDE047',
      particles: 'lightning'
    }
  }
};

// ================= ESTADO ATUAL =================

let currentSkin = 'default';
let currentTransformation = null;
let transformationCooldowns = {};
let visualEffectParticles = [];
let equippedAuras = [];

// Inicializar cooldowns
for (const id in TRANSFORMATIONS) {
  transformationCooldowns[id] = 0;
}

// ================= FUNÇÕES DE SKIN =================

/**
 * Aplica uma skin
 */
function applySkin(skinId) {
  const skin = SKINS[skinId];
  if (!skin) return false;
  
  if (!skin.unlocked) {
    createFloatingText(player.x, player.y - 50, 'Skin bloqueada!', '#FF6B6B');
    return false;
  }
  
  currentSkin = skinId;
  localStorage.setItem('selected_skin', skinId);
  
  createFloatingText(player.x, player.y - 50, `Skin: ${skin.name}`, skin.colors.primary);
  playSFX('coin');
  
  // Aplicar bônus
  applySkinBonuses(skin);
  
  return true;
}

/**
 * Desbloqueia uma skin
 */
function unlockSkin(skinId) {
  const skin = SKINS[skinId];
  if (!skin || skin.unlocked) return false;
  
  skin.unlocked = true;
  saveSkinProgress();
  
  createFloatingText(player.x, player.y - 50, `🎨 Skin Desbloqueada: ${skin.name}!`, skin.colors.primary);
  playSFX('levelup');
  
  return true;
}

/**
 * Aplica bônus da skin
 */
function applySkinBonuses(skin) {
  if (!skin.bonus) return;
  
  // Resetar bônus anteriores
  player.skinBonuses = skin.bonus;
}

/**
 * Obtém evolução atual baseada no nível
 */
function getCurrentEvolution() {
  let currentEvo = LEVEL_EVOLUTIONS[1];
  
  for (const lvl in LEVEL_EVOLUTIONS) {
    if (level >= parseInt(lvl)) {
      currentEvo = LEVEL_EVOLUTIONS[lvl];
    }
  }
  
  return currentEvo;
}

// ================= FUNÇÕES DE TRANSFORMAÇÃO =================

/**
 * Ativa transformação
 */
function activateTransformation(transformId) {
  const transform = TRANSFORMATIONS[transformId];
  if (!transform) return false;
  
  if (level < transform.unlockLevel) {
    createFloatingText(player.x, player.y - 50, `Desbloqueado no Lv.${transform.unlockLevel}`, '#FF6B6B');
    return false;
  }
  
  if (transformationCooldowns[transformId] > 0) {
    const secondsLeft = Math.ceil(transformationCooldowns[transformId] / 1000);
    createFloatingText(player.x, player.y - 50, `Cooldown: ${secondsLeft}s`, '#FFA500');
    return false;
  }
  
  currentTransformation = {
    id: transformId,
    data: transform,
    timeRemaining: transform.duration,
    originalSize: player.r,
    customData: {}
  };
  
  transformationCooldowns[transformId] = transform.cooldown;
  
  // Aplicar efeitos visuais e stats
  if (transform.effects.sizeMultiplier) {
    player.r *= transform.effects.sizeMultiplier;
  }
  
  // Explosão de partículas
  for (let i = 0; i < 50; i++) {
    const angle = (i / 50) * Math.PI * 2;
    createVisualParticle(
      player.x + Math.cos(angle) * player.r * 2,
      player.y + Math.sin(angle) * player.r * 2,
      transform.visual.color,
      transform.visual.particles
    );
  }
  
  createFloatingText(player.x, player.y - 70, `${transform.icon} ${transform.name}!`, transform.visual.color);
  playSFX('levelup');
  triggerShake(25, 2.5);
  
  return true;
}

/**
 * Atualiza transformações
 */
function updateTransformations(dt) {
  const dtMs = dt * 1000;
  
  // Atualizar cooldowns
  for (const id in transformationCooldowns) {
    if (transformationCooldowns[id] > 0) {
      transformationCooldowns[id] -= dtMs;
      if (transformationCooldowns[id] < 0) {
        transformationCooldowns[id] = 0;
      }
    }
  }
  
  // Atualizar transformação ativa
  if (currentTransformation) {
    currentTransformation.timeRemaining -= dtMs;
    
    const transform = currentTransformation.data;
    
    // Efeitos específicos
    if (transform.effects.burnEnemies) {
      enemies.forEach((enemy, i) => {
        const dist = distance(player.x, player.y, enemy.x, enemy.y);
        if (dist < 150) {
          createVisualParticle(enemy.x, enemy.y, '#F97316', 'flames');
        }
      });
    }
    
    if (transform.effects.chainLightning) {
      if (Math.random() < 0.1) {
        enemies.forEach(enemy => {
          const dist = distance(player.x, player.y, enemy.x, enemy.y);
          if (dist < transform.effects.electricField) {
            createVisualParticle(enemy.x, enemy.y, '#FBBF24', 'lightning');
          }
        });
      }
    }
    
    // Criar partículas do rastro
    if (Math.random() < 0.5) {
      createVisualParticle(
        player.x + (Math.random() - 0.5) * player.r,
        player.y + (Math.random() - 0.5) * player.r,
        transform.visual.color,
        transform.visual.particles
      );
    }
    
    // Desativar se tempo acabou
    if (currentTransformation.timeRemaining <= 0) {
      deactivateTransformation();
    }
  }
  
  // Atualizar partículas visuais
  updateVisualParticles(dt);
}

/**
 * Desativa transformação
 */
function deactivateTransformation() {
  if (!currentTransformation) return;
  
  // Restaurar tamanho
  if (currentTransformation.originalSize) {
    player.r = currentTransformation.originalSize;
  }
  
  createFloatingText(player.x, player.y - 50, 'Transformação encerrada', '#888888');
  
  currentTransformation = null;
}

/**
 * Verifica se está transformado
 */
function isTransformed() {
  return currentTransformation !== null;
}

// ================= EFEITOS VISUAIS =================

/**
 * Cria partícula visual
 */
function createVisualParticle(x, y, color, type) {
  visualEffectParticles.push({
    x, y,
    vx: (Math.random() - 0.5) * 100,
    vy: (Math.random() - 0.5) * 100,
    life: 1.0,
    color,
    type,
    size: Math.random() * 8 + 4,
    rotation: Math.random() * Math.PI * 2,
    rotationSpeed: (Math.random() - 0.5) * 10
  });
}

/**
 * Atualiza partículas visuais
 */
function updateVisualParticles(dt) {
  for (let i = visualEffectParticles.length - 1; i >= 0; i--) {
    const p = visualEffectParticles[i];
    
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vx *= 0.92;
    p.vy *= 0.92;
    p.life -= dt * 1.5;
    p.rotation += p.rotationSpeed * dt;
    
    if (p.life <= 0) {
      visualEffectParticles.splice(i, 1);
    }
  }
}

/**
 * Desenha partículas visuais
 */
function drawVisualParticles(ctx) {
  visualEffectParticles.forEach(p => {
    ctx.save();
    ctx.globalAlpha = p.life;
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rotation);
    
    if (p.type === 'flames') {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.moveTo(0, -p.size);
      ctx.bezierCurveTo(p.size/2, -p.size/2, p.size/2, p.size/2, 0, p.size);
      ctx.bezierCurveTo(-p.size/2, p.size/2, -p.size/2, -p.size/2, 0, -p.size);
      ctx.fill();
    } else if (p.type === 'lightning') {
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-p.size, 0);
      ctx.lineTo(0, -p.size);
      ctx.lineTo(p.size/2, 0);
      ctx.lineTo(0, p.size);
      ctx.stroke();
    } else if (p.type === 'frost') {
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 2;
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(angle) * p.size, Math.sin(angle) * p.size);
        ctx.stroke();
      }
    } else {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(0, 0, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    
    ctx.restore();
  });
}

/**
 * Desenha efeitos da skin e transformação no player
 */
function drawPlayerVisualEffects(ctx) {
  if (!player) return;
  
  const skin = SKINS[currentSkin];
  
  // Efeitos da skin
  if (skin.effects.includes('shimmer')) {
    ctx.save();
    ctx.globalAlpha = (Math.sin(Date.now() / 300) + 1) * 0.3;
    ctx.fillStyle = '#FBBF24';
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.r * 1.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  
  // Efeitos de transformação
  if (currentTransformation) {
    const transform = currentTransformation.data;
    const pulse = Math.sin(Date.now() / 200) * 0.3 + 1;
    
    ctx.save();
    ctx.globalAlpha = 0.4;
    const gradient = ctx.createRadialGradient(player.x, player.y, player.r, player.x, player.y, player.r * 3 * pulse);
    gradient.addColorStop(0, transform.visual.aura + 'FF');
    gradient.addColorStop(1, transform.visual.aura + '00');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.r * 3 * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

/**
 * Aplica cores da skin/evolução ao desenhar
 */
function getPlayerColors() {
  const evolution = getCurrentEvolution();
  const skin = SKINS[currentSkin];
  
  // Transformação sobrescreve cores
  if (currentTransformation) {
    const color = currentTransformation.data.visual.color;
    return { primary: color, secondary: color, belly: adjustBrightness(color, 40) };
  }
  
  // Skin sobrescreve evolução
  if (currentSkin !== 'default') {
    return skin.colors;
  }
  
  // Cores da evolução
  return evolution.colors;
}

// ================= HELPERS =================

function adjustBrightness(hex, percent) {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.min(255, Math.max(0, (num >> 16) + amt));
  const G = Math.min(255, Math.max(0, (num >> 8 & 0x00FF) + amt));
  const B = Math.min(255, Math.max(0, (num & 0x0000FF) + amt));
  return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
}

// ================= PERSISTÊNCIA =================

function saveSkinProgress() {
  const data = {
    unlockedSkins: Object.entries(SKINS)
      .filter(([_, skin]) => skin.unlocked)
      .map(([id]) => id),
    currentSkin
  };
  localStorage.setItem('skin_progress', JSON.stringify(data));
}

function loadSkinProgress() {
  const saved = localStorage.getItem('skin_progress');
  if (!saved) return;
  
  try {
    const data = JSON.parse(saved);
    data.unlockedSkins.forEach(id => {
      if (SKINS[id]) SKINS[id].unlocked = true;
    });
    if (data.currentSkin && SKINS[data.currentSkin]?.unlocked) {
      currentSkin = data.currentSkin;
    }
  } catch (e) {
    console.error('Erro ao carregar skins:', e);
  }
}

// ================= INICIALIZAÇÃO =================

function initVisualSystem() {
  loadSkinProgress();
  console.log('🎨 Sistema Visual inicializado!');
}

// Debug
if (typeof window !== 'undefined') {
  window.skins = {
    list: () => console.table(Object.values(SKINS).map(s => ({
      Nome: s.name,
      Desbloqueada: s.unlocked ? '✅' : '❌',
      Conquista: s.achievement || 'N/A'
    }))),
    unlock: (id) => unlockSkin(id),
    apply: (id) => applySkin(id),
    current: () => SKINS[currentSkin].name
  };
  
  window.transformations = {
    list: () => console.table(Object.values(TRANSFORMATIONS).map(t => ({
      Nome: t.name,
      Nível: t.unlockLevel,
      Duração: `${t.duration/1000}s`,
      Cooldown: `${t.cooldown/1000}s`
    }))),
    activate: (id) => activateTransformation(id)
  };
}
