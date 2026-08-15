// ================= SISTEMA DE HABILIDADES ESPECIAIS DOS PEIXES =================
// 🎮 Gerencia as mecânicas únicas de cada tipo de peixe especial

class FishAbilitySystem {
  constructor() {
    this.activeCooldowns = new Map();
    this.activeEffects = new Map();
    this.buffedFish = new Map();
  }
  
  /**
   * Inicializa uma habilidade para um peixe
   */
  initFishAbility(fish) {
    if (!fish.typeDef || !fish.typeDef.abilities) return;
    
    fish.abilityState = {
      cooldowns: {},
      activeAbility: null,
      abilityPhase: 0,
      lastActivation: 0
    };
    
    // Inicializar cooldowns
    for (const [abilityName, ability] of Object.entries(fish.typeDef.abilities)) {
      if (ability.enabled) {
        fish.abilityState.cooldowns[abilityName] = 0;
      }
    }
  }
  
  /**
   * Atualiza habilidades de um peixe
   */
  updateFishAbilities(fish, dt, player) {
    if (!fish.abilityState) {
      this.initFishAbility(fish);
      return;
    }
    
    const state = fish.abilityState;
    const abilities = fish.typeDef.abilities;
    
    if (!abilities) return;
    
    // Atualizar cooldowns
    for (const abilityName in state.cooldowns) {
      if (state.cooldowns[abilityName] > 0) {
        state.cooldowns[abilityName] -= dt;
      }
    }
    
    // Processar habilidade ativa
    if (state.activeAbility) {
      this.processActiveAbility(fish, state.activeAbility, dt, player);
    }
    
    // Verificar se deve ativar alguma habilidade
    this.checkAbilityTriggers(fish, player, dt);
  }
  
  /**
   * Verifica se alguma habilidade deve ser ativada
   */
  checkAbilityTriggers(fish, player, dt) {
    const abilities = fish.typeDef.abilities;
    if (!abilities) return;
    
    const distToPlayer = Math.hypot(player.x - fish.x, player.y - fish.y);
    
    // ELECTRIC SHOCK - Ativa quando é atacado/tocado
    if (abilities.electricShock && abilities.electricShock.triggerOnDamage) {
      if (distToPlayer < fish.r + player.r + 5) {
        this.activateElectricShock(fish, player);
      }
    }
    
    // INFLATE - Ativa quando ameaçado
    if (abilities.inflate && abilities.inflate.triggerOnThreat) {
      const threatDist = abilities.inflate.threatDistance;
      if (distToPlayer < threatDist && !fish.inflated) {
        this.activateInflate(fish);
      }
    }
    
    // EXPLODE - Ativa pavio quando tocado
    if (abilities.explode && distToPlayer < fish.r + player.r + 10) {
      if (!fish.fuseActive) {
        this.activateExplosionFuse(fish);
      }
    }
    
    // PHASE SHIFT - Ciclo automático
    if (abilities.phaseShift && !fish.abilityState.activeAbility) {
      fish.abilityState.phaseTimer = (fish.abilityState.phaseTimer || 0) + dt;
      this.updatePhaseShift(fish, dt);
    }
    
    // SHADOW STEP - Teleporte quando ameaçado
    if (abilities.shadowStep && abilities.shadowStep.teleportOnThreat) {
      if (distToPlayer < 80 && fish.abilityState.cooldowns.shadowStep <= 0) {
        this.activateShadowStep(fish, player);
      }
    }
    
    // GOLDEN BOOST - Sempre ativo para peixe lendário
    if (abilities.goldenBoost) {
      this.updateGoldenBoost(fish, player, dt);
    }
    
    // AMBUSH - Verifica se deve emboscar
    if (abilities.ambush) {
      this.updateAmbush(fish, player, dt);
    }
  }
  
  /**
   * Ativa choque elétrico
   */
  activateElectricShock(fish, player) {
    const ability = fish.typeDef.abilities.electricShock;
    
    if (fish.abilityState.cooldowns.electricShock > 0) return;
    
    // Aplicar stun e dano ao player
    player.isStunned = true;
    player.stunTimer = ability.stunDuration;
    player.takeDamage(ability.damage);
    
    // Efeito visual
    this.createElectricEffect(fish);
    
    // Cooldown
    fish.abilityState.cooldowns.electricShock = ability.cooldown;
    
    // SFX
    if (typeof audioManager !== 'undefined') {
      audioManager.playSfx('electric');
    }
  }
  
  /**
   * Ativa inflação do baiacu
   */
  activateInflate(fish) {
    const ability = fish.typeDef.abilities.inflate;
    
    fish.inflated = true;
    fish.inflatePhase = 0;
    fish.originalRadius = fish.r;
    fish.targetRadius = fish.r * ability.inflateSize;
    fish.inflateTimer = 0;
    fish.safeToEat = false;
    
    // Timer para ficar seguro de comer
    setTimeout(() => {
      fish.safeToEat = true;
    }, ability.safeEatTime * 1000);
  }
  
  /**
   * Atualiza inflação
   */
  updateInflate(fish, dt) {
    if (!fish.inflated) return;
    
    const ability = fish.typeDef.abilities.inflate;
    fish.inflateTimer += dt;
    
    // Animar crescimento
    if (fish.inflateTimer < ability.inflateTime) {
      const progress = fish.inflateTimer / ability.inflateTime;
      fish.r = fish.originalRadius + (fish.targetRadius - fish.originalRadius) * progress;
    } else {
      fish.r = fish.targetRadius;
    }
  }
  
  /**
   * Ativa pavio de explosão
   */
  activateExplosionFuse(fish) {
    fish.fuseActive = true;
    fish.fuseTimer = fish.typeDef.abilities.explode.fuseTime;
    
    if (typeof audioManager !== 'undefined') {
      audioManager.playSfx('fuse');
    }
  }
  
  /**
   * Atualiza explosão
   */
  updateExplosion(fish, dt) {
    if (!fish.fuseActive) return;
    
    fish.fuseTimer -= dt;
    
    // Piscar quando está perto de explodir
    fish.blinkPhase = (fish.blinkPhase || 0) + dt * 10;
    
    if (fish.fuseTimer <= 0) {
      this.triggerExplosion(fish);
    }
  }
  
  /**
   * Dispara explosão
   */
  triggerExplosion(fish) {
    const ability = fish.typeDef.abilities.explode;
    
    // Criar efeito de explosão
    this.createExplosionEffect(fish, ability.explosionRadius);
    
    // Dano em área ao player
    if (player && typeof player !== 'undefined') {
      const dist = Math.hypot(player.x - fish.x, player.y - fish.y);
      if (dist < ability.explosionRadius) {
        player.takeDamage(ability.damage);
        
        // Knockback
        const angle = Math.atan2(player.y - fish.y, player.x - fish.x);
        player.velocity.x += Math.cos(angle) * ability.knockback;
        player.velocity.y += Math.sin(angle) * ability.knockback;
      }
    }
    
    // Destruir peixes próximos
    if (ability.destroysNearbyFish && typeof fishes !== 'undefined') {
      for (const otherFish of fishes) {
        if (otherFish === fish) continue;
        const dist = Math.hypot(otherFish.x - fish.x, otherFish.y - fish.y);
        if (dist < ability.explosionRadius) {
          otherFish.destroyed = true;
        }
      }
    }
    
    // SFX
    if (typeof audioManager !== 'undefined') {
      audioManager.playSfx('explosion');
    }
    
    // Remover peixe
    fish.remove = true;
  }
  
  /**
   * Atualiza phase shift (peixe fantasma)
   */
  updatePhaseShift(fish, dt) {
    const ability = fish.typeDef.abilities.phaseShift;
    
    if (!fish.phaseState) {
      fish.phaseState = {
        isVisible: true,
        timer: ability.visibleDuration,
        isFading: false,
        opacity: 1.0
      };
    }
    
    const state = fish.phaseState;
    state.timer -= dt;
    
    if (state.isVisible) {
      // Visible phase
      if (state.timer <= 0) {
        state.isVisible = false;
        state.isFading = true;
        state.timer = ability.fadeOutTime;
      }
    } else {
      // Invisible phase
      if (state.timer <= 0) {
        state.isVisible = true;
        state.isFading = true;
        state.timer = ability.fadeInTime;
      }
    }
    
    // Animar opacidade
    if (state.isFading) {
      if (state.isVisible) {
        // Fade in
        state.opacity = 1.0 - (state.timer / ability.fadeInTime);
      } else {
        // Fade out
        state.opacity = state.timer / ability.fadeOutTime;
      }
      
      if (state.timer <= 0) {
        state.isFading = false;
        state.opacity = state.isVisible ? 1.0 : 0.1;
        state.timer = state.isVisible ? ability.visibleDuration : ability.invisibleDuration;
      }
    }
    
    // Não pode ser pego enquanto está fadando ou invisível
    fish.canBeCaught = state.isVisible && !state.isFading && state.opacity > 0.8;
  }
  
  /**
   * Ativa shadow step (teleporte)
   */
  activateShadowStep(fish, player) {
    const ability = fish.typeDef.abilities.shadowStep;
    
    // Criar sombra falsa
    if (ability.createDecoy) {
      this.createShadowDecoy(fish, ability.decoyDuration);
    }
    
    // Teleportar para posição aleatória longe do player
    const angle = Math.random() * Math.PI * 2;
    const newX = fish.x + Math.cos(angle) * ability.teleportDistance;
    const newY = fish.y + Math.sin(angle) * ability.teleportDistance;
    
    // Verificar limites do mapa
    if (typeof mapSystem !== 'undefined') {
      const bounds = mapSystem.getBounds();
      fish.x = Math.max(bounds.minX, Math.min(bounds.maxX, newX));
      fish.y = Math.max(bounds.minY, Math.min(bounds.maxY, newY));
    } else {
      fish.x = newX;
      fish.y = newY;
    }
    
    // Efeito visual
    this.createShadowBurstEffect(fish);
    
    // Cooldown
    fish.abilityState.cooldowns.shadowStep = ability.teleportCooldown;
    
    // SFX
    if (typeof audioManager !== 'undefined') {
      audioManager.playSfx('teleport');
    }
  }
  
  /**
   * Atualiza movimento do peixe dourado lendário
   */
  updateGoldenBoost(fish, player, dt) {
    const ability = fish.typeDef.abilities.goldenBoost;
    
    if (!fish.goldenState) {
      fish.goldenState = {
        currentPattern: 'zigzag',
        patternTimer: 0,
        changeTimer: ability.changeDirectionFrequency
      };
    }
    
    const state = fish.goldenState;
    state.patternTimer += dt;
    state.changeTimer -= dt;
    
    // Mudar padrão de movimento
    if (state.changeTimer <= 0) {
      const patterns = ability.movementPatterns || ['zigzag'];
      state.currentPattern = patterns[Math.floor(Math.random() * patterns.length)];
      state.changeTimer = ability.changeDirectionFrequency;
    }
    
    // Fugir se perseguido
    if (ability.escapeWhenChased) {
      const distToPlayer = Math.hypot(player.x - fish.x, player.y - fish.y);
      if (distToPlayer < 100) {
        // Fugir na direção oposta
        const escapeAngle = Math.atan2(fish.y - player.y, fish.x - player.x);
        fish.angle = escapeAngle;
        fish.speed = fish.typeDef.baseSpeed * ability.speedMultiplier * 1.5;
      }
    }
    
    // Aplicar multiplicador de velocidade
    fish.speed = fish.typeDef.baseSpeed * ability.speedMultiplier;
  }
  
  /**
   * Atualiza emboscada do peixe pescador
   */
  updateAmbush(fish, player, dt) {
    const ability = fish.typeDef.abilities.ambush;
    
    if (!fish.ambushState) {
      fish.ambushState = {
        isHiding: true,
        lureTimer: 0
      };
    }
    
    const state = fish.ambushState;
    const distToPlayer = Math.hypot(player.x - fish.x, player.y - fish.y);
    
    // Atrair com a isca
    if (distToPlayer < ability.lureRadius) {
      state.lureTimer += dt;
      
      // Criar efeito de isca
      if (state.lureTimer > 0.5) {
        this.createLureEffect(fish);
        state.lureTimer = 0;
      }
      
      // Atacar se muito perto
      if (distToPlayer < 50) {
        player.takeDamage(ability.lureDamage);
        if (typeof audioManager !== 'undefined') {
          audioManager.playSfx('bite');
        }
      }
    }
  }
  
  /**
   * Aplica buff ao player quando come peixe
   */
  applyFishBuff(fish, player) {
    if (!fish.typeDef || !fish.typeDef.abilities) return;
    
    const abilities = fish.typeDef.abilities;
    
    // Speed buff
    if (abilities.speedBuff) {
      this.applySpeedBuff(player, abilities.speedBuff);
    }
    
    // Heal
    if (abilities.heal) {
      this.applyHeal(player, abilities.heal);
    }
    
    // Strength buff
    if (abilities.strengthBuff) {
      this.applyStrengthBuff(player, abilities.strengthBuff);
    }
    
    // Gem bonus
    if (abilities.gemBonus) {
      this.applyGemBonus(player, abilities.gemBonus);
    }
    
    // XP bonus
    if (abilities.xpBonus) {
      this.applyXpBonus(player, abilities.xpBonus);
    }
  }
  
  /**
   * Aplica buff de velocidade
   */
  applySpeedBuff(player, ability) {
    player.speedBuff = {
      multiplier: ability.speedMultiplier,
      timer: ability.duration,
      visualEffect: ability.visualEffect
    };
    
    this.createBuffEffect(player, 'speed');
  }
  
  /**
   * Aplica cura
   */
  applyHeal(player, ability) {
    const healAmount = ability.instantHeal 
      ? ability.healAmount 
      : player.maxHunger * ability.healPercentage;
    
    player.hunger = Math.min(player.maxHunger, player.hunger + healAmount);
    player.healFlash = 1.0;
    
    this.createBuffEffect(player, 'heal');
  }
  
  /**
   * Aplica buff de força
   */
  applyStrengthBuff(player, ability) {
    player.strengthBuff = {
      sizeMultiplier: ability.sizeMultiplier,
      damageMultiplier: ability.damageMultiplier,
      canEatLargerFish: ability.canEatLargerFish,
      timer: ability.duration,
      visualEffect: ability.visualEffect
    };
    
    this.createBuffEffect(player, 'strength');
  }
  
  /**
   * Aplica bonus de gemas
   */
  applyGemBonus(player, ability) {
    player.gemBuff = {
      multiplier: ability.gemMultiplier,
      timer: ability.duration,
      magnetRange: ability.gemMagnetRange
    };
    
    this.createBuffEffect(player, 'gem');
  }
  
  /**
   * Aplica bonus de XP
   */
  applyXpBonus(player, ability) {
    player.xpBuff = {
      multiplier: ability.xpMultiplier,
      timer: ability.duration
    };
    
    this.createBuffEffect(player, 'xp');
  }
  
  /**
   * Atualiza buffs do player
   */
  updatePlayerBuffs(player, dt) {
    // Speed buff
    if (player.speedBuff) {
      player.speedBuff.timer -= dt;
      if (player.speedBuff.timer <= 0) {
        delete player.speedBuff;
      } else {
        player.speedMultiplier = player.speedBuff.multiplier;
      }
    } else {
      player.speedMultiplier = 1.0;
    }
    
    // Strength buff
    if (player.strengthBuff) {
      player.strengthBuff.timer -= dt;
      if (player.strengthBuff.timer <= 0) {
        delete player.strengthBuff;
      }
    }
    
    // Gem buff
    if (player.gemBuff) {
      player.gemBuff.timer -= dt;
      if (player.gemBuff.timer <= 0) {
        delete player.gemBuff;
      }
    }
    
    // XP buff
    if (player.xpBuff) {
      player.xpBuff.timer -= dt;
      if (player.xpBuff.timer <= 0) {
        delete player.xpBuff;
      }
    }
    
    // Stun
    if (player.isStunned) {
      player.stunTimer -= dt;
      if (player.stunTimer <= 0) {
        player.isStunned = false;
      }
    }
  }
  
  // ===== EFEITOS VISUAIS =====
  
  createElectricEffect(fish) {
    // Implementar partículas elétricas
    if (typeof visualEffects !== 'undefined') {
      visualEffects.createElectricSparks(fish.x, fish.y, fish.r * 2);
    }
  }
  
  createExplosionEffect(fish, radius) {
    if (typeof visualEffects !== 'undefined') {
      visualEffects.createExplosion(fish.x, fish.y, radius);
    }
  }
  
  createShadowDecoy(fish, duration) {
    if (typeof visualEffects !== 'undefined') {
      visualEffects.createDecoy(fish.x, fish.y, fish.r, duration);
    }
  }
  
  createShadowBurstEffect(fish) {
    if (typeof visualEffects !== 'undefined') {
      visualEffects.createShadowBurst(fish.x, fish.y);
    }
  }
  
  createLureEffect(fish) {
    if (typeof visualEffects !== 'undefined') {
      visualEffects.createLureGlow(fish.x, fish.y - fish.r * 1.5);
    }
  }
  
  createBuffEffect(player, buffType) {
    if (typeof visualEffects !== 'undefined') {
      visualEffects.createBuffAura(player, buffType);
    }
  }
}

// Instância global
const fishAbilitySystem = new FishAbilitySystem();
