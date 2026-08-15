// ================= SISTEMA DE HABILIDADES ESPECIAIS =================

/**
 * Sistema completo de habilidades ativas
 * Dash, Ataque Giratório, Escudo e Modo Fúria
 */

const ABILITIES = {
  dash: {
    id: 'dash',
    name: 'Dash Aquático',
    description: 'Movimento rápido instantâneo',
    icon: '💨',
    cooldown: 3000,
    duration: 300,
    key: ' ',
    displayKey: 'ESPAÇO',
    unlockLevel: 1,
    color: '#60A5FA',
    effects: { speedMultiplier: 4, invulnerable: true, distance: 250 }
  },
  spin_attack: {
    id: 'spin_attack',
    name: 'Ataque Giratório',
    icon: '🌀',
    cooldown: 8000,
    duration: 1500,
    key: 'q',
    displayKey: 'Q',
    unlockLevel: 5,
    color: '#EF4444',
    damageRadius: 150,
    damage: 50,
    effects: { spinSpeed: 18, knockback: 80 }
  },
  shield: {
    id: 'shield',
    name: 'Escudo Bolha',
    icon: '🛡️',
    cooldown: 15000,
    duration: 4000,
    key: 'e',
    displayKey: 'E',
    unlockLevel: 8,
    color: '#22C55E',
    shieldHealth: 200,
    effects: { absorbDamage: true, regeneration: 2, reflectDamage: 0.3 }
  },
  rage_mode: {
    id: 'rage_mode',
    name: 'Modo Fúria',
    icon: '😡',
    cooldown: 25000,
    duration: 8000,
    key: 'r',
    displayKey: 'R',
    unlockLevel: 12,
    color: '#A855F7',
    effects: {
      damageMultiplier: 2.5,
      speedMultiplier: 1.8,
      sizeMultiplier: 1.5,
      invulnerable: true,
      autoEat: true,
      auraRadius: 200
    }
  }
};

let activeAbilities = {};
let abilityCooldowns = {};
let abilityParticles = [];

for (const id in ABILITIES) {
  abilityCooldowns[id] = 0;
  activeAbilities[id] = { active: false, timeRemaining: 0, customData: {} };
}

function activateAbility(id) {
  const ability = ABILITIES[id];
  if (!ability || level < ability.unlockLevel || abilityCooldowns[id] > 0) return false;
  
  activeAbilities[id].active = true;
  activeAbilities[id].timeRemaining = ability.duration;
  abilityCooldowns[id] = ability.cooldown;
  
  playSFX('levelup');
  createFloatingText(player.x, player.y - 60, `${ability.icon} ${ability.name}!`, ability.color);
  
  if (id === 'dash') {
    const angle = player.angle;
    activeAbilities.dash.customData = {
      startX: player.x,
      startY: player.y,
      targetX: Math.max(player.r, Math.min(canvas.width/dpr - player.r, player.x + Math.cos(angle) * 250)),
      targetY: Math.max(player.r, Math.min(canvas.height/dpr - player.r, player.y + Math.sin(angle) * 250)),
      progress: 0
    };
  } else if (id === 'spin_attack') {
    activeAbilities.spin_attack.customData = { rotation: 0, hitEnemies: new Set() };
    triggerShake(15, 1.5);
  } else if (id === 'shield') {
    activeAbilities.shield.customData = { health: 200, pulsePhase: 0 };
  } else if (id === 'rage_mode') {
    activeAbilities.rage_mode.customData = { originalSize: player.r, auraPhase: 0 };
    player.r *= 1.5;
    triggerShake(20, 2);
  }
  
  return true;
}

function updateAbilities(dt) {
  const dtMs = dt * 1000;
  
  for (const id in abilityCooldowns) {
    if (abilityCooldowns[id] > 0) {
      abilityCooldowns[id] -= dtMs;
      if (abilityCooldowns[id] <= 0) abilityCooldowns[id] = 0;
    }
  }
  
  for (const id in activeAbilities) {
    const state = activeAbilities[id];
    if (state.active) {
      state.timeRemaining -= dtMs;
      
      if (id === 'dash') {
        const data = state.customData;
        data.progress += dt / 0.3;
        data.progress = Math.min(data.progress, 1);
        const eased = data.progress * (2 - data.progress);
        player.x = data.startX + (data.targetX - data.startX) * eased;
        player.y = data.startY + (data.targetY - data.startY) * eased;
      } else if (id === 'spin_attack') {
        const data = state.customData;
        data.rotation += 18 * dt;
        enemies.forEach((enemy, i) => {
          if (!data.hitEnemies.has(i) && distance(player.x, player.y, enemy.x, enemy.y) < 150) {
            data.hitEnemies.add(i);
            createBloodParticles(enemy.x, enemy.y, 20);
            removeEnemy(i);
          }
        });
      } else if (id === 'shield') {
        const data = state.customData;
        data.pulsePhase += dt * 4;
        player.hunger = Math.min(player.hunger + 2 * dt, player.maxHunger);
      } else if (id === 'rage_mode') {
        const data = state.customData;
        data.auraPhase += dt * 6;
        fishes.forEach((fish, i) => {
          if (distance(player.x, player.y, fish.x, fish.y) < 200) {
            eatFish(fish);
            removeFish(i);
          }
        });
      }
      
      if (state.timeRemaining <= 0) {
        state.active = false;
        if (id === 'rage_mode' && state.customData.originalSize) {
          player.r = state.customData.originalSize;
        }
      }
    }
  }
  
  abilityParticles = abilityParticles.filter(p => {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.life -= dt * 2;
    return p.life > 0;
  });
}

function isPlayerInvulnerable() {
  return (activeAbilities.dash.active || activeAbilities.shield.active || activeAbilities.rage_mode.active);
}

function drawAbilityEffects(ctx) {
  if (!player) return;
  
  if (activeAbilities.shield.active) {
    const data = activeAbilities.shield.customData;
    const pulse = Math.sin(data.pulsePhase) * 0.2 + 1;
    const radius = player.r * 2.5 * pulse;
    
    ctx.save();
    ctx.globalAlpha = 0.4;
    const gradient = ctx.createRadialGradient(player.x, player.y, player.r, player.x, player.y, radius);
    gradient.addColorStop(0, '#22C55E00');
    gradient.addColorStop(0.7, '#22C55E80');
    gradient.addColorStop(1, '#22C55EFF');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(player.x, player.y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  
  if (activeAbilities.rage_mode.active) {
    const data = activeAbilities.rage_mode.customData;
    const pulse = Math.sin(data.auraPhase) * 0.3 + 1;
    
    ctx.save();
    ctx.globalAlpha = 0.2;
    const gradient = ctx.createRadialGradient(player.x, player.y, 0, player.x, player.y, 200 * pulse);
    gradient.addColorStop(0, '#A855F7FF');
    gradient.addColorStop(1, '#A855F700');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(player.x, player.y, 200 * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawAbilityUI(ctx) {
  const abilities = Object.values(ABILITIES);
  const spacing = 70;
  const startX = canvas.width/(2*dpr) - (abilities.length * spacing) / 2;
  const y = canvas.height/dpr - 80;
  
  abilities.forEach((ability, i) => {
    const x = startX + i * spacing;
    const state = activeAbilities[ability.id];
    const cooldown = abilityCooldowns[ability.id];
    
    let bgColor = cooldown > 0 ? 'rgba(100,100,100,0.8)' : 
                  level >= ability.unlockLevel ? 'rgba(50,50,50,0.9)' : 'rgba(30,30,30,0.9)';
    let borderColor = state.active ? ability.color : cooldown > 0 ? 'rgba(150,150,150,0.8)' : ability.color;
    
    ctx.fillStyle = bgColor;
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = state.active ? 3 : 2;
    ctx.beginPath();
    ctx.roundRect(x - 25, y - 25, 50, 50, 8);
    ctx.fill();
    ctx.stroke();
    
    ctx.font = 'bold 28px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = level >= ability.unlockLevel ? 'white' : 'rgba(150,150,150,0.5)';
    ctx.fillText(ability.icon, x, y);
    
    if (cooldown > 0) {
      ctx.font = 'bold 14px Arial';
      ctx.fillStyle = 'white';
      ctx.fillText(Math.ceil(cooldown / 1000), x, y + 5);
    }
    
    ctx.font = 'bold 10px Arial';
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.fillText(ability.displayKey, x, y - 35);
    
    if (level < ability.unlockLevel) {
      ctx.font = 'bold 9px Arial';
      ctx.fillStyle = '#FFA500';
      ctx.fillText(`Lv.${ability.unlockLevel}`, x, y + 20);
    }
  });
}

function handleAbilityKeys(key) {
  for (const id in ABILITIES) {
    if (key === ABILITIES[id].key || key.toLowerCase() === ABILITIES[id].key.toLowerCase()) {
      return activateAbility(id);
    }
  }
  return false;
}

function createFloatingText(x, y, text, color) {
  createScorePopup(x, y, text, color);
}
