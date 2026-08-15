// ================= SISTEMA DE STATS EXPANDIDOS =================

/**
 * Sistema completo de estatísticas avançadas
 * - Velocidade de ataque
 * - Taxa de crítico
 * - Resistência a dano
 * - Penetração
 * - Roubo de vida
 * - Velocidade de movimento extra
 */

// ================= STATS BASE =================

const BASE_STATS = {
  // Ofensivo
  attackSpeed: 1.0,      // Multiplicador de velocidade de ataque
  critChance: 0.05,      // 5% chance base de crítico
  critDamage: 2.0,       // 200% de dano em crítico
  penetration: 0,        // Ignora resistência inimiga
  lifeSteal: 0,          // % de dano convertido em vida
  
  // Defensivo
  damageReduction: 0,    // % de redução de dano
  dodge: 0.05,           // 5% chance de esquiva
  thorns: 0,             // Dano refletido
  
  // Utilidade
  movementSpeed: 1.0,    // Multiplicador de velocidade
  pickupRange: 1.0,      // Alcance de coleta
  xpGain: 1.0,          // Multiplicador de XP
  goldFind: 1.0         // Multiplicador de ouro
};

// ================= STATS ATUAIS DO JOGADOR =================

let playerStats = { ...BASE_STATS };
let statsModifiers = [];  // Lista de modificadores temporários

// ================= FUNÇÕES DE CÁLCULO =================

/**
 * Calcula stats finais do jogador
 */
function calculatePlayerStats() {
  // Resetar para base
  playerStats = { ...BASE_STATS };
  
  // Aplicar bônus de upgrades
  applyUpgradeStatBonuses();
  
  // Aplicar bônus de equipamentos/skins
  applySkinStatBonuses();
  
  // Aplicar modificadores temporários
  applyTemporaryModifiers();
  
  // Aplicar buffs de transformação
  applyTransformationStatBonuses();
  
  return playerStats;
}

/**
 * Aplica bônus de upgrades
 */
function applyUpgradeStatBonuses() {
  // Speed upgrade afeta movimento
  playerStats.movementSpeed += upgrades.speed * 0.1;
  
  // XP bonus upgrade
  playerStats.xpGain += upgrades.xpBonus * 0.2;
  
  // Heal upgrade dá roubo de vida
  playerStats.lifeSteal += upgrades.heal * 0.02;
  
  // MaxHunger dá resistência
  playerStats.damageReduction += upgrades.maxHunger * 0.03;
  
  // HungerDrain dá velocidade de ataque
  playerStats.attackSpeed += upgrades.hungerDrain * 0.1;
}

/**
 * Aplica bônus de skin
 */
function applySkinStatBonuses() {
  if (!currentSkin || !SKINS[currentSkin]) return;
  
  const skin = SKINS[currentSkin];
  if (!skin.bonus) return;
  
  if (skin.bonus.speedBonus) {
    playerStats.movementSpeed += skin.bonus.speedBonus / 100;
  }
  if (skin.bonus.damageBonus) {
    playerStats.critDamage += skin.bonus.damageBonus / 100;
  }
  if (skin.bonus.xpBonus) {
    playerStats.xpGain += skin.bonus.xpBonus / 100;
  }
  if (skin.bonus.allStats) {
    playerStats.attackSpeed += skin.bonus.allStats / 100;
    playerStats.critChance += skin.bonus.allStats / 1000;
    playerStats.movementSpeed += skin.bonus.allStats / 100;
  }
}

/**
 * Aplica modificadores temporários
 */
function applyTemporaryModifiers() {
  const now = Date.now();
  
  // Filtrar modificadores expirados
  statsModifiers = statsModifiers.filter(mod => mod.expireTime > now);
  
  // Aplicar modificadores ativos
  statsModifiers.forEach(mod => {
    if (mod.stat && playerStats[mod.stat] !== undefined) {
      if (mod.type === 'add') {
        playerStats[mod.stat] += mod.value;
      } else if (mod.type === 'multiply') {
        playerStats[mod.stat] *= mod.value;
      }
    }
  });
}

/**
 * Aplica bônus de transformação
 */
function applyTransformationStatBonuses() {
  if (!currentTransformation) return;
  
  const transform = currentTransformation.data;
  
  if (transform.effects.damageMultiplier) {
    playerStats.critDamage *= transform.effects.damageMultiplier;
  }
  if (transform.effects.speedMultiplier) {
    playerStats.movementSpeed *= transform.effects.speedMultiplier;
  }
}

/**
 * Adiciona modificador temporário
 */
function addStatModifier(stat, value, duration, type = 'add', name = 'buff') {
  const modifier = {
    stat,
    value,
    type,
    name,
    expireTime: Date.now() + duration
  };
  
  statsModifiers.push(modifier);
  calculatePlayerStats();
  
  // Feedback visual
  createFloatingText(player.x, player.y - 50, `+${stat}!`, '#22C55E');
}

// ================= SISTEMA DE COMBATE AVANÇADO =================

/**
 * Calcula dano de um ataque
 */
function calculateAttackDamage(baseDamage) {
  let finalDamage = baseDamage;
  
  // Verificar crítico
  const isCrit = Math.random() < playerStats.critChance;
  if (isCrit) {
    finalDamage *= playerStats.critDamage;
    
    // Efeito visual de crítico
    createCritEffect();
  }
  
  return {
    damage: finalDamage,
    isCrit
  };
}

/**
 * Processa dano recebido
 */
function processDamageReceived(incomingDamage) {
  // Verificar esquiva
  if (Math.random() < playerStats.dodge) {
    createFloatingText(player.x, player.y - 40, 'ESQUIVA!', '#60A5FA');
    playSFX('coin');
    return 0;
  }
  
  // Aplicar redução de dano
  let finalDamage = incomingDamage * (1 - playerStats.damageReduction);
  
  // Aplicar dano de espinhos
  if (playerStats.thorns > 0) {
    const thornsDamage = incomingDamage * playerStats.thorns;
    createFloatingText(player.x, player.y - 30, `⚡${Math.floor(thornsDamage)}`, '#EF4444');
    
    // Dano em inimigos próximos (simplificado)
    enemies.forEach((enemy, i) => {
      const dist = distance(player.x, player.y, enemy.x, enemy.y);
      if (dist < 100) {
        createBloodParticles(enemy.x, enemy.y, 5);
      }
    });
  }
  
  return finalDamage;
}

/**
 * Aplica roubo de vida de um ataque
 */
function applyLifeSteal(damageDealt) {
  if (playerStats.lifeSteal <= 0) return;
  
  const healing = damageDealt * playerStats.lifeSteal;
  player.hunger = Math.min(player.hunger + healing, player.maxHunger);
  
  if (healing > 0) {
    createFloatingText(player.x, player.y - 35, `+${Math.floor(healing)}❤️`, '#22C55E');
    player.healFlash = 1.0;
  }
}

// ================= EFEITOS VISUAIS DE STATS =================

/**
 * Cria efeito visual de crítico
 */
function createCritEffect() {
  // Texto CRÍTICO!
  createFloatingText(player.x, player.y - 60, 'CRÍTICO!', '#FBBF24');
  
  // Flash amarelo
  applyScreenFlash('#FBBF24', 0.3);
  
  // Shake leve
  applyScreenShake(8, 0.2);
  
  // Partículas douradas
  for (let i = 0; i < 15; i++) {
    const angle = (i / 15) * Math.PI * 2;
    const dist = player.r * 2;
    createAbilityParticle(
      player.x + Math.cos(angle) * dist,
      player.y + Math.sin(angle) * dist,
      '#FBBF24',
      'spark'
    );
  }
  
  playSFX('levelup');
}

/**
 * Cria efeito visual de esquiva
 */
function createDodgeEffect() {
  // Imagem fantasma
  for (let i = 0; i < 3; i++) {
    setTimeout(() => {
      createAbilityParticle(player.x, player.y, '#60A5FA', 'afterimage');
    }, i * 50);
  }
}

/**
 * Desenha indicadores de buffs ativos
 */
function drawBuffIndicators(ctx) {
  if (statsModifiers.length === 0) return;
  
  const x = canvas.width/dpr - 150;
  let y = 150;
  
  ctx.save();
  ctx.font = 'bold 11px Arial';
  ctx.textAlign = 'right';
  
  statsModifiers.forEach(mod => {
    const timeLeft = Math.ceil((mod.expireTime - Date.now()) / 1000);
    
    // Background
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(x - 120, y - 12, 120, 20);
    
    // Nome do buff
    ctx.fillStyle = '#22C55E';
    ctx.fillText(mod.name, x - 5, y + 3);
    
    // Tempo restante
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.font = 'bold 9px Arial';
    ctx.fillText(`${timeLeft}s`, x - 5, y - 2);
    
    // Barra de tempo
    const percent = (mod.expireTime - Date.now()) / (mod.expireTime - (mod.expireTime - 5000));
    ctx.fillStyle = '#22C55E';
    ctx.fillRect(x - 118, y + 6, 116 * percent, 2);
    
    y += 25;
  });
  
  ctx.restore();
}

// ================= UI DE STATS =================

/**
 * Desenha painel de stats detalhados
 */
function drawDetailedStatsPanel(ctx) {
  const x = 20;
  const y = 150;
  const lineHeight = 18;
  
  ctx.save();
  
  // Background semi-transparente
  ctx.fillStyle = 'rgba(0,0,0,0.8)';
  ctx.fillRect(x - 5, y - 5, 200, 200);
  
  ctx.strokeStyle = '#60A5FA';
  ctx.lineWidth = 2;
  ctx.strokeRect(x - 5, y - 5, 200, 200);
  
  // Título
  ctx.fillStyle = '#60A5FA';
  ctx.font = 'bold 14px Arial';
  ctx.textAlign = 'left';
  ctx.fillText('📊 ESTATÍSTICAS', x, y + 15);
  
  ctx.font = '11px Arial';
  ctx.fillStyle = 'white';
  
  let currentY = y + 35;
  
  // Stats ofensivos
  ctx.fillStyle = '#F59E0B';
  ctx.fillText('⚔️ Ofensivo:', x, currentY);
  currentY += lineHeight;
  
  ctx.fillStyle = 'white';
  ctx.fillText(`Vel. Ataque: ${(playerStats.attackSpeed * 100).toFixed(0)}%`, x + 10, currentY);
  currentY += lineHeight;
  
  ctx.fillText(`Crítico: ${(playerStats.critChance * 100).toFixed(1)}%`, x + 10, currentY);
  currentY += lineHeight;
  
  ctx.fillText(`Dano Crit: ${(playerStats.critDamage * 100).toFixed(0)}%`, x + 10, currentY);
  currentY += lineHeight;
  
  ctx.fillText(`Roubo Vida: ${(playerStats.lifeSteal * 100).toFixed(1)}%`, x + 10, currentY);
  currentY += lineHeight + 5;
  
  // Stats defensivos
  ctx.fillStyle = '#22C55E';
  ctx.fillText('🛡️ Defensivo:', x, currentY);
  currentY += lineHeight;
  
  ctx.fillStyle = 'white';
  ctx.fillText(`Red. Dano: ${(playerStats.damageReduction * 100).toFixed(1)}%`, x + 10, currentY);
  currentY += lineHeight;
  
  ctx.fillText(`Esquiva: ${(playerStats.dodge * 100).toFixed(1)}%`, x + 10, currentY);
  currentY += lineHeight;
  
  ctx.fillText(`Espinhos: ${(playerStats.thorns * 100).toFixed(1)}%`, x + 10, currentY);
  currentY += lineHeight + 5;
  
  // Stats utilitários
  ctx.fillStyle = '#A855F7';
  ctx.fillText('⚡ Utilidade:', x, currentY);
  currentY += lineHeight;
  
  ctx.fillStyle = 'white';
  ctx.fillText(`Velocidade: ${(playerStats.movementSpeed * 100).toFixed(0)}%`, x + 10, currentY);
  currentY += lineHeight;
  
  ctx.fillText(`Ganho XP: ${(playerStats.xpGain * 100).toFixed(0)}%`, x + 10, currentY);
  
  ctx.restore();
}

/**
 * Desenha indicador compacto de stats principais
 */
function drawCompactStatsHUD(ctx) {
  const x = 20;
  const y = canvas.height/dpr - 120;
  
  ctx.save();
  ctx.font = 'bold 10px Arial';
  ctx.textAlign = 'left';
  
  // Crítico
  if (playerStats.critChance > 0.05) {
    ctx.fillStyle = '#FBBF24';
    ctx.fillText(`⚡ ${(playerStats.critChance * 100).toFixed(1)}%`, x, y);
  }
  
  // Redução de dano
  if (playerStats.damageReduction > 0) {
    ctx.fillStyle = '#22C55E';
    ctx.fillText(`🛡️ ${(playerStats.damageReduction * 100).toFixed(0)}%`, x, y + 15);
  }
  
  // Roubo de vida
  if (playerStats.lifeSteal > 0) {
    ctx.fillStyle = '#EF4444';
    ctx.fillText(`❤️ ${(playerStats.lifeSteal * 100).toFixed(1)}%`, x, y + 30);
  }
  
  ctx.restore();
}

// ================= POWERUPS TEMPORÁRIOS =================

/**
 * Cria powerup de stat aleatório
 */
function createStatPowerup(x, y) {
  const powerups = [
    { stat: 'attackSpeed', value: 0.5, duration: 10000, name: 'Ataque Rápido', color: '#F59E0B' },
    { stat: 'critChance', value: 0.2, duration: 8000, name: 'Sorte Crítica', color: '#FBBF24' },
    { stat: 'damageReduction', value: 0.3, duration: 12000, name: 'Pele Dura', color: '#22C55E' },
    { stat: 'movementSpeed', value: 0.5, duration: 10000, name: 'Velocidade', color: '#60A5FA' },
    { stat: 'lifeSteal', value: 0.15, duration: 15000, name: 'Vampirismo', color: '#EF4444' }
  ];
  
  const powerup = powerups[Math.floor(Math.random() * powerups.length)];
  
  return {
    x, y,
    ...powerup,
    r: 12,
    collected: false,
    bobPhase: Math.random() * Math.PI * 2
  };
}

// ================= ATUALIZAÇÃO =================

/**
 * Atualiza sistema de stats
 */
function updateStatsSystem(dt) {
  // Recalcular stats
  calculatePlayerStats();
  
  // Aplicar multiplicadores de movimento
  if (player) {
    player.speed = CONFIG.PLAYER_INITIAL_SPEED * playerStats.movementSpeed;
  }
}

// ================= INICIALIZAÇÃO =================

/**
 * Inicializa sistema de stats
 */
function initStatsSystem() {
  calculatePlayerStats();
  console.log('📊 Sistema de Stats inicializado!');
}

// Debug
if (typeof window !== 'undefined') {
  window.stats = {
    show: () => {
      console.table({
        'Vel. Ataque': (playerStats.attackSpeed * 100).toFixed(0) + '%',
        'Crítico': (playerStats.critChance * 100).toFixed(1) + '%',
        'Dano Crit': (playerStats.critDamage * 100).toFixed(0) + '%',
        'Red. Dano': (playerStats.damageReduction * 100).toFixed(1) + '%',
        'Esquiva': (playerStats.dodge * 100).toFixed(1) + '%',
        'Roubo Vida': (playerStats.lifeSteal * 100).toFixed(1) + '%',
        'Velocidade': (playerStats.movementSpeed * 100).toFixed(0) + '%',
        'Ganho XP': (playerStats.xpGain * 100).toFixed(0) + '%'
      });
    },
    addBuff: (stat, value, duration) => addStatModifier(stat, value, duration, 'add', `Buff ${stat}`),
    buffs: () => console.log('Buffs ativos:', statsModifiers.length),
    crit: () => {
      const result = calculateAttackDamage(100);
      console.log(`Dano: ${result.damage.toFixed(0)} ${result.isCrit ? '(CRÍTICO!)' : ''}`);
    }
  };
}
