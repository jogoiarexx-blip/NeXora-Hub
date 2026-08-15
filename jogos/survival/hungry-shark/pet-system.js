// ================= SISTEMA DE PETS/COMPANHEIROS =================
// 🐠 Sistema completo de pets que seguem e ajudam o jogador

class PetSystem {
  constructor() {
    this.init();
  }
  
  init() {
    // Definição de todos os pets disponíveis
    this.petTypes = {
      // ========== 1. PEIXE PILOTO ==========
      pilot_fish: {
        id: 'pilot_fish',
        name: 'Peixe Piloto',
        icon: '🐠',
        description: 'Segue o jogador e coleta moedas próximas',
        rarity: 'common',
        maxLevel: 10,
        
        // Estatísticas base
        baseStats: {
          speed: 150,
          followDistance: 50,
          collectionRadius: 80
        },
        
        // Bônus por nível
        levelBonus: {
          collectionRadius: 10 // +10 por nível
        },
        
        // Visual
        colors: {
          primary: '#4169E1',
          secondary: '#87CEEB',
          accent: '#FFD700'
        },
        size: 12,
        
        // Habilidade
        ability: {
          type: 'collect_coins',
          description: 'Coleta moedas automaticamente'
        }
      },
      
      // ========== 2. CARANGUEJO ERMITÃO ==========
      hermit_crab: {
        id: 'hermit_crab',
        name: 'Caranguejo Ermitão',
        icon: '🦀',
        description: 'Defende o jogador bloqueando ataques',
        rarity: 'uncommon',
        maxLevel: 10,
        
        baseStats: {
          speed: 100,
          followDistance: 40,
          blockCooldown: 10 // segundos
        },
        
        levelBonus: {
          blockCooldown: -0.5 // Reduz 0.5s por nível
        },
        
        colors: {
          primary: '#FF6347',
          secondary: '#8B4513',
          accent: '#FFA500'
        },
        size: 15,
        
        ability: {
          type: 'block_damage',
          description: 'Bloqueia 1 ataque a cada X segundos'
        }
      },
      
      // ========== 3. PEIXE LANTERNA ==========
      lantern_fish: {
        id: 'lantern_fish',
        name: 'Peixe Lanterna',
        icon: '🐡',
        description: 'Ilumina áreas escuras',
        rarity: 'uncommon',
        maxLevel: 10,
        
        baseStats: {
          speed: 120,
          followDistance: 60,
          lightRadius: 100
        },
        
        levelBonus: {
          lightRadius: 15 // +15 por nível
        },
        
        colors: {
          primary: '#FFD700',
          secondary: '#FFA500',
          accent: '#FFFF00',
          glow: 'rgba(255, 255, 0, 0.6)'
        },
        size: 10,
        hasGlow: true,
        
        ability: {
          type: 'light',
          description: '+20% visão em áreas escuras'
        }
      },
      
      // ========== 4. TUBARÃO BEBÊ ==========
      baby_shark: {
        id: 'baby_shark',
        name: 'Tubarão Bebê',
        icon: '🦈',
        description: 'Ataca inimigos pequenos',
        rarity: 'rare',
        maxLevel: 10,
        
        baseStats: {
          speed: 180,
          followDistance: 70,
          attackRange: 100,
          damagePercent: 0.3 // 30% do dano do jogador
        },
        
        levelBonus: {
          damagePercent: 0.05 // +5% por nível
        },
        
        colors: {
          primary: '#708090',
          secondary: '#B0C4DE',
          accent: '#FFFFFF'
        },
        size: 20,
        
        ability: {
          type: 'attack_enemies',
          description: 'Ataca inimigos menores automaticamente'
        }
      },
      
      // ========== 5. POLVO AJUDANTE ==========
      helper_octopus: {
        id: 'helper_octopus',
        name: 'Polvo Ajudante',
        icon: '🐙',
        description: 'Pega peixes distantes e traz até o jogador',
        rarity: 'rare',
        maxLevel: 10,
        
        baseStats: {
          speed: 140,
          followDistance: 55,
          grabRange: 120,
          grabCooldown: 3 // segundos
        },
        
        levelBonus: {
          grabRange: 20, // +20 por nível
          grabCooldown: -0.2 // -0.2s por nível
        },
        
        colors: {
          primary: '#FF69B4',
          secondary: '#DB7093',
          accent: '#FFC0CB'
        },
        size: 18,
        hasTentacles: true,
        
        ability: {
          type: 'grab_fish',
          description: 'Puxa peixes para perto do jogador'
        }
      },
      
      // ========== 6. ESTRELA DO MAR ==========
      starfish: {
        id: 'starfish',
        name: 'Estrela do Mar',
        icon: '⭐',
        description: 'Regenera vida continuamente',
        rarity: 'epic',
        maxLevel: 10,
        
        baseStats: {
          speed: 90,
          followDistance: 45,
          healPerSecond: 1
        },
        
        levelBonus: {
          healPerSecond: 0.5 // +0.5 HP/s por nível
        },
        
        colors: {
          primary: '#FFD700',
          secondary: '#FFA500',
          accent: '#FFFF00'
        },
        size: 14,
        hasGlow: true,
        
        ability: {
          type: 'heal',
          description: 'Regenera HP ao longo do tempo e remove veneno'
        }
      }
    };
    
    // Sistema de ovos (para obtenção de pets)
    this.eggs = {
      common_egg: {
        id: 'common_egg',
        name: 'Ovo Comum',
        rarity: 'common',
        possiblePets: ['pilot_fish'],
        hatchTime: 0, // Instantâneo
        price: 100
      },
      
      uncommon_egg: {
        id: 'uncommon_egg',
        name: 'Ovo Incomum',
        rarity: 'uncommon',
        possiblePets: ['hermit_crab', 'lantern_fish'],
        hatchTime: 60, // 1 minuto
        price: 500
      },
      
      rare_egg: {
        id: 'rare_egg',
        name: 'Ovo Raro',
        rarity: 'rare',
        possiblePets: ['baby_shark', 'helper_octopus'],
        hatchTime: 300, // 5 minutos
        price: 2000
      },
      
      epic_egg: {
        id: 'epic_egg',
        name: 'Ovo Épico',
        rarity: 'epic',
        possiblePets: ['starfish'],
        hatchTime: 600, // 10 minutos
        price: 5000
      },
      
      mystery_egg: {
        id: 'mystery_egg',
        name: 'Ovo Misterioso',
        rarity: 'legendary',
        possiblePets: Object.keys(this.petTypes), // Qualquer pet
        hatchTime: 1800, // 30 minutos
        price: 10000
      }
    };
    
    // Estado do jogador
    this.ownedPets = {}; // { petId: { level, xp, unlocked, evolution } }
    this.activePet = null; // Pet atualmente equipado
    this.petInstance = null; // Instância do pet ativo
    this.hatchingEggs = []; // Ovos em processo de eclosão
  }
  
  // ========== GERENCIAMENTO DE PETS ==========
  
  unlockPet(petId) {
    const petType = this.petTypes[petId];
    if (!petType) {
      console.error('Pet não existe:', petId);
      return false;
    }
    
    if (!this.ownedPets[petId]) {
      this.ownedPets[petId] = {
        level: 1,
        xp: 0,
        unlocked: true,
        evolution: 0
      };
      
      console.log(`🎉 Novo pet desbloqueado: ${petType.name}!`);
      
      // Notificação
      if (typeof showNotification === 'function') {
        showNotification(`${petType.icon} ${petType.name} desbloqueado!`, 5000, 'pet');
      }
      
      this.save();
      return true;
    }
    
    return false;
  }
  
  equipPet(petId) {
    if (!this.ownedPets[petId] || !this.ownedPets[petId].unlocked) {
      console.log('Pet não desbloqueado');
      return false;
    }
    
    this.activePet = petId;
    this.createPetInstance();
    
    const petType = this.petTypes[petId];
    console.log(`✨ ${petType.name} equipado!`);
    
    this.save();
    return true;
  }
  
  unequipPet() {
    this.activePet = null;
    this.petInstance = null;
    this.save();
  }
  
  createPetInstance() {
    if (!this.activePet) return;
    
    const petType = this.petTypes[this.activePet];
    const petData = this.ownedPets[this.activePet];
    
    // Calcular stats baseado no nível
    const stats = { ...petType.baseStats };
    
    Object.keys(petType.levelBonus).forEach(stat => {
      const bonus = petType.levelBonus[stat] * (petData.level - 1);
      stats[stat] = (stats[stat] || 0) + bonus;
    });
    
    this.petInstance = {
      type: petType,
      data: petData,
      stats: stats,
      
      // Posição e movimento
      x: 0,
      y: 0,
      angle: 0,
      targetX: 0,
      targetY: 0,
      
      // Estado
      cooldowns: {},
      isAttacking: false,
      isGrabbing: false,
      
      // Animação
      swimPhase: 0,
      animationTimer: 0
    };
  }
  
  // ========== SISTEMA DE XP E LEVEL ==========
  
  addPetXP(amount) {
    if (!this.activePet) return;
    
    const petData = this.ownedPets[this.activePet];
    const petType = this.petTypes[this.activePet];
    
    petData.xp += amount;
    
    // XP necessário para próximo nível
    const xpNeeded = this.getXPNeeded(petData.level);
    
    if (petData.xp >= xpNeeded && petData.level < petType.maxLevel) {
      petData.xp -= xpNeeded;
      petData.level++;
      
      console.log(`⭐ ${petType.name} subiu para nível ${petData.level}!`);
      
      // Atualizar instância com novos stats
      this.createPetInstance();
      
      // Verificar evolução
      this.checkEvolution();
      
      this.save();
    }
  }
  
  getXPNeeded(level) {
    return Math.floor(100 * Math.pow(1.5, level - 1));
  }
  
  checkEvolution() {
    if (!this.activePet) return;
    
    const petData = this.ownedPets[this.activePet];
    const petType = this.petTypes[this.activePet];
    
    // Evolução nos níveis 5 e 10
    if (petData.level === 5 && petData.evolution === 0) {
      petData.evolution = 1;
      console.log(`✨ ${petType.name} evoluiu!`);
    } else if (petData.level === 10 && petData.evolution === 1) {
      petData.evolution = 2;
      console.log(`🌟 ${petType.name} alcançou forma final!`);
    }
  }
  
  // ========== SISTEMA DE OVOS ==========
  
  buyEgg(eggId) {
    const egg = this.eggs[eggId];
    if (!egg) return false;
    
    // Verificar se tem moedas (precisa integrar com sistema de economia)
    if (typeof coins !== 'undefined' && coins < egg.price) {
      console.log('Moedas insuficientes');
      return false;
    }
    
    // Deduzir moedas
    if (typeof coins !== 'undefined') {
      coins -= egg.price;
    }
    
    // Adicionar ovo para eclosão
    const hatchingEgg = {
      eggId: eggId,
      startTime: Date.now(),
      hatchTime: egg.hatchTime
    };
    
    this.hatchingEggs.push(hatchingEgg);
    
    console.log(`🥚 Ovo adquirido: ${egg.name}`);
    
    // Se tempo de eclosão for 0, eclodir imediatamente
    if (egg.hatchTime === 0) {
      this.hatchEgg(0);
    }
    
    this.save();
    return true;
  }
  
  updateEggs(dt) {
    const now = Date.now();
    
    for (let i = this.hatchingEggs.length - 1; i >= 0; i--) {
      const egg = this.hatchingEggs[i];
      const eggType = this.eggs[egg.eggId];
      const elapsedTime = (now - egg.startTime) / 1000; // em segundos
      
      if (elapsedTime >= eggType.hatchTime) {
        this.hatchEgg(i);
      }
    }
  }
  
  hatchEgg(index) {
    const egg = this.hatchingEggs[index];
    const eggType = this.eggs[egg.eggId];
    
    // Selecionar pet aleatório
    const randomPet = eggType.possiblePets[
      Math.floor(Math.random() * eggType.possiblePets.length)
    ];
    
    // Desbloquear pet
    this.unlockPet(randomPet);
    
    // Remover ovo da lista
    this.hatchingEggs.splice(index, 1);
    
    const petType = this.petTypes[randomPet];
    console.log(`🎉 Ovo eclodiu: ${petType.name}!`);
    
    this.save();
  }
  
  // ========== UPDATE DO PET ==========
  
  update(dt, player) {
    if (!this.petInstance || !player) return;
    
    const pet = this.petInstance;
    const stats = pet.stats;
    
    // Atualizar cooldowns
    Object.keys(pet.cooldowns).forEach(key => {
      if (pet.cooldowns[key] > 0) {
        pet.cooldowns[key] -= dt;
      }
    });
    
    // Movimento de seguimento
    this.updateMovement(dt, player);
    
    // Atualização de animação
    pet.swimPhase += dt * 8;
    pet.animationTimer += dt;
    
    // Executar habilidade do pet
    this.executeAbility(dt, player);
    
    // Pet ganha XP com o jogador (uma fração do XP do jogador)
    // Isso é chamado externamente quando player ganha XP
  }
  
  updateMovement(dt, player) {
    const pet = this.petInstance;
    const stats = pet.stats;
    
    // Calcular distância do jogador
    const dx = player.x - pet.x;
    const dy = player.y - pet.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Se muito longe, teleportar
    if (distance > 500) {
      pet.x = player.x - stats.followDistance * Math.cos(player.angle);
      pet.y = player.y - stats.followDistance * Math.sin(player.angle);
      return;
    }
    
    // Seguir jogador mantendo distância
    if (distance > stats.followDistance) {
      const moveAngle = Math.atan2(dy, dx);
      
      pet.x += Math.cos(moveAngle) * stats.speed * dt;
      pet.y += Math.sin(moveAngle) * stats.speed * dt;
      
      // Suavizar rotação
      pet.angle += (moveAngle - pet.angle) * 0.1;
    } else {
      // Flutuar ao redor do jogador
      pet.x += Math.sin(pet.swimPhase * 0.5) * 20 * dt;
      pet.y += Math.cos(pet.swimPhase * 0.5) * 15 * dt;
    }
  }
  
  executeAbility(dt, player) {
    const pet = this.petInstance;
    const abilityType = pet.type.ability.type;
    
    switch (abilityType) {
      case 'collect_coins':
        this.abilityCollectCoins(player);
        break;
        
      case 'block_damage':
        // Gerenciado externamente quando player recebe dano
        break;
        
      case 'light':
        this.abilityLight(player);
        break;
        
      case 'attack_enemies':
        this.abilityAttackEnemies(dt, player);
        break;
        
      case 'grab_fish':
        this.abilityGrabFish(dt, player);
        break;
        
      case 'heal':
        this.abilityHeal(dt, player);
        break;
    }
  }
  
  // ========== HABILIDADES DOS PETS ==========
  
  abilityCollectCoins(player) {
    // Coletar moedas próximas
    if (typeof floatingCoins === 'undefined') return;
    
    const pet = this.petInstance;
    const radius = pet.stats.collectionRadius;
    
    for (let i = floatingCoins.length - 1; i >= 0; i--) {
      const coin = floatingCoins[i];
      const dx = pet.x - coin.x;
      const dy = pet.y - coin.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < radius) {
        // Mover moeda para o player
        coin.targetX = player.x;
        coin.targetY = player.y;
        coin.magnetized = true;
      }
    }
  }
  
  canBlockDamage() {
    if (!this.petInstance) return false;
    if (this.petInstance.type.id !== 'hermit_crab') return false;
    
    const cooldownKey = 'block';
    const pet = this.petInstance;
    
    if (!pet.cooldowns[cooldownKey] || pet.cooldowns[cooldownKey] <= 0) {
      pet.cooldowns[cooldownKey] = pet.stats.blockCooldown;
      console.log('🛡️ Caranguejo bloqueou o ataque!');
      return true;
    }
    
    return false;
  }
  
  abilityLight(player) {
    // Aplicar bônus de visão (gerenciado no render)
    // Aqui apenas verificamos se está ativo
    return true;
  }
  
  abilityAttackEnemies(dt, player) {
    if (typeof enemies === 'undefined') return;
    
    const pet = this.petInstance;
    const range = pet.stats.attackRange;
    
    // Encontrar inimigo próximo
    let nearestEnemy = null;
    let nearestDist = range;
    
    enemies.forEach(enemy => {
      const dx = pet.x - enemy.x;
      const dy = pet.y - enemy.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < nearestDist && enemy.r < player.r * 0.8) { // Apenas inimigos menores
        nearestEnemy = enemy;
        nearestDist = dist;
      }
    });
    
    if (nearestEnemy && !pet.isAttacking) {
      pet.isAttacking = true;
      
      // Calcular dano
      const damage = (typeof playerStats !== 'undefined' ? playerStats.damage : 10) * pet.stats.damagePercent;
      
      // Aplicar dano ao inimigo
      nearestEnemy.health = (nearestEnemy.health || nearestEnemy.damage) - damage;
      
      if (nearestEnemy.health <= 0) {
        // Remover inimigo
        const index = enemies.indexOf(nearestEnemy);
        if (index > -1) {
          enemies.splice(index, 1);
        }
      }
      
      setTimeout(() => { pet.isAttacking = false; }, 500);
    }
  }
  
  abilityGrabFish(dt, player) {
    if (typeof fishes === 'undefined') return;
    
    const pet = this.petInstance;
    const cooldownKey = 'grab';
    
    if (pet.cooldowns[cooldownKey] && pet.cooldowns[cooldownKey] > 0) return;
    
    const range = pet.stats.grabRange;
    
    // Encontrar peixe próximo
    let nearestFish = null;
    let nearestDist = range;
    
    fishes.forEach(fish => {
      const dx = pet.x - fish.x;
      const dy = pet.y - fish.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < nearestDist) {
        nearestFish = fish;
        nearestDist = dist;
      }
    });
    
    if (nearestFish) {
      // Puxar peixe para perto do jogador
      const angle = Math.atan2(player.y - nearestFish.y, player.x - nearestFish.x);
      nearestFish.x += Math.cos(angle) * 200 * dt;
      nearestFish.y += Math.sin(angle) * 200 * dt;
      
      pet.cooldowns[cooldownKey] = pet.stats.grabCooldown;
      pet.isGrabbing = true;
      setTimeout(() => { pet.isGrabbing = false; }, 300);
    }
  }
  
  abilityHeal(dt, player) {
    const pet = this.petInstance;
    const healAmount = pet.stats.healPerSecond * dt;
    
    player.hunger = Math.min(player.hunger + healAmount, player.maxHunger);
    
    // Remover veneno (se tiver sistema de status)
    if (player.poisoned) {
      player.poisoned = false;
    }
  }
  
  // ========== RENDER ==========
  
  draw(ctx, camera) {
    if (!this.petInstance) return;
    
    const pet = this.petInstance;
    const type = pet.type;
    
    ctx.save();
    
    // Transformar para posição do pet
    ctx.translate(pet.x, pet.y);
    ctx.rotate(pet.angle);
    
    // Escala baseada na evolução
    const scale = 1 + pet.data.evolution * 0.2;
    ctx.scale(scale, scale);
    
    // Desenhar sombra
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.ellipse(2, 2, type.size * 1.1, type.size * 0.6, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Corpo do pet
    ctx.fillStyle = type.colors.primary;
    ctx.strokeStyle = type.colors.secondary;
    ctx.lineWidth = 2;
    
    ctx.beginPath();
    ctx.ellipse(0, 0, type.size, type.size * 0.7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    
    // Detalhes específicos do tipo
    this.drawPetDetails(ctx, pet);
    
    // Efeito de brilho (se pet tiver)
    if (type.hasGlow) {
      ctx.shadowColor = type.colors.glow || type.colors.accent;
      ctx.shadowBlur = 10 + Math.sin(pet.animationTimer * 3) * 3;
      ctx.strokeStyle = type.colors.accent;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(0, 0, type.size * 1.2, type.size * 0.9, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    
    ctx.restore();
    
    // UI do pet (nível, HP bar se estiver atacando, etc)
    this.drawPetUI(ctx, pet);
  }
  
  drawPetDetails(ctx, pet) {
    const type = pet.type;
    const size = type.size;
    
    switch (type.id) {
      case 'pilot_fish':
        // Listras
        ctx.fillStyle = type.colors.accent;
        for (let i = 0; i < 3; i++) {
          ctx.fillRect(-size * 0.3 + i * size * 0.3, -size * 0.5, size * 0.1, size);
        }
        break;
        
      case 'hermit_crab':
        // Casca
        ctx.fillStyle = type.colors.secondary;
        ctx.beginPath();
        ctx.arc(-size * 0.3, 0, size * 0.8, 0, Math.PI * 2);
        ctx.fill();
        // Garras
        ctx.fillStyle = type.colors.accent;
        ctx.fillRect(size * 0.5, -size * 0.3, size * 0.4, size * 0.2);
        ctx.fillRect(size * 0.5, size * 0.1, size * 0.4, size * 0.2);
        break;
        
      case 'lantern_fish':
        // Antena com luz
        ctx.strokeStyle = type.colors.secondary;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, -size * 0.7);
        ctx.lineTo(0, -size * 1.5);
        ctx.stroke();
        // Luz
        ctx.fillStyle = type.colors.accent;
        ctx.beginPath();
        ctx.arc(0, -size * 1.5, size * 0.3, 0, Math.PI * 2);
        ctx.fill();
        break;
        
      case 'baby_shark':
        // Barbatana dorsal
        ctx.fillStyle = type.colors.secondary;
        ctx.beginPath();
        ctx.moveTo(0, -size * 0.7);
        ctx.lineTo(-size * 0.3, -size * 1.2);
        ctx.lineTo(size * 0.3, -size * 0.7);
        ctx.closePath();
        ctx.fill();
        // Dentes
        ctx.fillStyle = '#FFFFFF';
        for (let i = 0; i < 3; i++) {
          const tx = size * 0.3 + i * size * 0.2;
          ctx.fillRect(tx, -size * 0.2, size * 0.1, size * 0.3);
        }
        break;
        
      case 'helper_octopus':
        // Tentáculos
        ctx.strokeStyle = type.colors.primary;
        ctx.lineWidth = 3;
        for (let i = 0; i < 8; i++) {
          const angle = (Math.PI * 2 / 8) * i + pet.swimPhase * 0.5;
          const length = size * 1.2;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.quadraticCurveTo(
            Math.cos(angle) * length * 0.5,
            Math.sin(angle) * length * 0.5 + Math.sin(pet.swimPhase + i) * 5,
            Math.cos(angle) * length,
            Math.sin(angle) * length
          );
          ctx.stroke();
        }
        break;
        
      case 'starfish':
        // Pontas da estrela
        ctx.fillStyle = type.colors.primary;
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
          const angle = (Math.PI * 2 / 5) * i - Math.PI / 2;
          const x = Math.cos(angle) * size * 1.2;
          const y = Math.sin(angle) * size * 1.2;
          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        break;
    }
    
    // Olho
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(size * 0.4, -size * 0.2, size * 0.15, 0, Math.PI * 2);
    ctx.fill();
  }
  
  drawPetUI(ctx, pet) {
    // Nível do pet acima dele
    ctx.save();
    ctx.font = 'bold 12px Arial';
    ctx.fillStyle = '#FFD700';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.textAlign = 'center';
    
    const text = `Lv.${pet.data.level}`;
    ctx.strokeText(text, pet.x, pet.y - pet.type.size * 2);
    ctx.fillText(text, pet.x, pet.y - pet.type.size * 2);
    
    ctx.restore();
  }
  
  // ========== SAVE/LOAD ==========
  
  save() {
    const saveData = {
      ownedPets: this.ownedPets,
      activePet: this.activePet,
      hatchingEggs: this.hatchingEggs
    };
    
    localStorage.setItem('pet_system', JSON.stringify(saveData));
  }
  
  load() {
    const saved = localStorage.getItem('pet_system');
    if (!saved) return;
    
    try {
      const data = JSON.parse(saved);
      
      this.ownedPets = data.ownedPets || {};
      this.activePet = data.activePet || null;
      this.hatchingEggs = data.hatchingEggs || [];
      
      // Recriar instância do pet ativo
      if (this.activePet) {
        this.createPetInstance();
      }
      
      console.log('✅ Sistema de pets carregado');
    } catch (e) {
      console.error('Erro ao carregar pets:', e);
    }
  }
}

// Instância global (será criada no game.js)
// window.petSystem = new PetSystem();
