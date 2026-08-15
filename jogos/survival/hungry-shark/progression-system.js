// ================= SISTEMA DE PROGRESSÃO EXPANDIDO =================
// 🎮 Meta-game completo com evolução, skills, achievements e prestige

class ProgressionSystem {
  constructor() {
    this.init();
  }
  
  init() {
    this.sharkEvolution = {
      currentTier: 0,
      tiers: [
        {
          id: 0,
          name: 'Tubarão Bebê',
          minLevel: 1,
          sizeMultiplier: 1.0,
          speedBonus: 0,
          specialAbility: null,
          unlocked: true
        },
        {
          id: 1,
          name: 'Tubarão Jovem',
          minLevel: 5,
          sizeMultiplier: 1.2,
          speedBonus: 10,
          specialAbility: 'dash',
          unlocked: false
        },
        {
          id: 2,
          name: 'Tubarão Adulto',
          minLevel: 10,
          sizeMultiplier: 1.5,
          speedBonus: 20,
          specialAbility: 'frenzy',
          unlocked: false
        },
        {
          id: 3,
          name: 'Tubarão Alfa',
          minLevel: 20,
          sizeMultiplier: 1.8,
          speedBonus: 35,
          specialAbility: 'bloodrush',
          unlocked: false
        },
        {
          id: 4,
          name: 'Mega Tubarão',
          minLevel: 35,
          sizeMultiplier: 2.2,
          speedBonus: 50,
          specialAbility: 'tsunami',
          unlocked: false
        },
        {
          id: 5,
          name: 'Leviatã',
          minLevel: 50,
          sizeMultiplier: 3.0,
          speedBonus: 75,
          specialAbility: 'devour',
          unlocked: false
        }
      ]
    };
    
    this.skillTree = {
      combat: {
        name: 'Combate',
        icon: '⚔️',
        skills: [
          {
            id: 'bite_damage',
            name: 'Mordida Poderosa',
            description: 'Aumenta o dano da mordida',
            maxLevel: 10,
            currentLevel: 0,
            cost: (level) => 2 + level * 2,
            effect: (level) => ({ damageMultiplier: 1 + level * 0.1 })
          },
          {
            id: 'attack_speed',
            name: 'Ataque Rápido',
            description: 'Reduz cooldown entre ataques',
            maxLevel: 5,
            currentLevel: 0,
            cost: (level) => 3 + level * 3,
            effect: (level) => ({ attackCooldownReduction: level * 0.15 })
          },
          {
            id: 'critical_strike',
            name: 'Golpe Crítico',
            description: 'Chance de causar dano crítico',
            maxLevel: 5,
            currentLevel: 0,
            cost: (level) => 4 + level * 4,
            effect: (level) => ({ critChance: level * 0.05, critMultiplier: 2.0 }),
            requires: ['bite_damage', 3]
          },
          {
            id: 'tail_whip',
            name: 'Chicote de Cauda',
            description: 'Desbloqueia ataque de cauda em área',
            maxLevel: 1,
            currentLevel: 0,
            cost: () => 10,
            effect: () => ({ unlockAbility: 'tail_whip' }),
            requires: ['attack_speed', 3]
          },
          {
            id: 'blood_frenzy',
            name: 'Frenesi Sanguinário',
            description: 'Aumenta dano quando com pouca vida',
            maxLevel: 3,
            currentLevel: 0,
            cost: (level) => 5 + level * 5,
            effect: (level) => ({ frenzyThreshold: 0.3, frenzyBonus: 1 + level * 0.3 }),
            requires: ['critical_strike', 3]
          }
        ]
      },
      
      survival: {
        name: 'Sobrevivência',
        icon: '🛡️',
        skills: [
          {
            id: 'max_health',
            name: 'Vigor',
            description: 'Aumenta fome máxima',
            maxLevel: 15,
            currentLevel: 0,
            cost: (level) => 2 + level,
            effect: (level) => ({ maxHungerBonus: level * 20 })
          },
          {
            id: 'health_regen',
            name: 'Regeneração',
            description: 'Regenera fome ao longo do tempo',
            maxLevel: 10,
            currentLevel: 0,
            cost: (level) => 3 + level * 2,
            effect: (level) => ({ hungerRegenPerSecond: level * 0.5 })
          },
          {
            id: 'damage_reduction',
            name: 'Pele Grossa',
            description: 'Reduz dano recebido',
            maxLevel: 5,
            currentLevel: 0,
            cost: (level) => 4 + level * 3,
            effect: (level) => ({ damageReduction: level * 0.08 }),
            requires: ['max_health', 5]
          },
          {
            id: 'lifesteal',
            name: 'Vampirismo',
            description: 'Recupera vida ao atacar',
            maxLevel: 5,
            currentLevel: 0,
            cost: (level) => 5 + level * 4,
            effect: (level) => ({ lifestealPercent: level * 0.05 }),
            requires: ['health_regen', 5]
          },
          {
            id: 'second_wind',
            name: 'Segundo Fôlego',
            description: 'Sobrevive a um golpe fatal (1x por run)',
            maxLevel: 1,
            currentLevel: 0,
            cost: () => 15,
            effect: () => ({ unlockAbility: 'second_wind' }),
            requires: ['damage_reduction', 3, 'lifesteal', 3]
          }
        ]
      },
      
      mobility: {
        name: 'Mobilidade',
        icon: '⚡',
        skills: [
          {
            id: 'swim_speed',
            name: 'Nado Veloz',
            description: 'Aumenta velocidade de nado',
            maxLevel: 10,
            currentLevel: 0,
            cost: (level) => 2 + level,
            effect: (level) => ({ speedBonus: level * 15 })
          },
          {
            id: 'acceleration',
            name: 'Aceleração',
            description: 'Aumenta aceleração',
            maxLevel: 5,
            currentLevel: 0,
            cost: (level) => 3 + level * 2,
            effect: (level) => ({ accelerationBonus: level * 0.2 })
          },
          {
            id: 'dash',
            name: 'Investida',
            description: 'Desbloqueia habilidade de dash',
            maxLevel: 1,
            currentLevel: 0,
            cost: () => 8,
            effect: () => ({ unlockAbility: 'dash', dashSpeed: 500, dashDuration: 0.5, dashCooldown: 3 }),
            requires: ['swim_speed', 5]
          },
          {
            id: 'water_jet',
            name: 'Jato d\'Água',
            description: 'Dash deixa rastro que empurra peixes',
            maxLevel: 3,
            currentLevel: 0,
            cost: (level) => 4 + level * 3,
            effect: (level) => ({ waterJetRange: 50 + level * 20, waterJetForce: 100 + level * 50 }),
            requires: ['dash', 1]
          },
          {
            id: 'breach',
            name: 'Salto',
            description: 'Permite saltar fora d\'água',
            maxLevel: 1,
            currentLevel: 0,
            cost: () => 12,
            effect: () => ({ unlockAbility: 'breach', jumpHeight: 200 }),
            requires: ['water_jet', 2]
          }
        ]
      },
      
      hunting: {
        name: 'Caça',
        icon: '🎯',
        skills: [
          {
            id: 'detection_range',
            name: 'Sentidos Aguçados',
            description: 'Aumenta range de detecção de presas',
            maxLevel: 10,
            currentLevel: 0,
            cost: (level) => 2 + level,
            effect: (level) => ({ detectionRangeBonus: level * 20 })
          },
          {
            id: 'xp_gain',
            name: 'Caçador Experiente',
            description: 'Aumenta XP ganho',
            maxLevel: 15,
            currentLevel: 0,
            cost: (level) => 2 + level * 2,
            effect: (level) => ({ xpMultiplier: 1 + level * 0.08 })
          },
          {
            id: 'coin_magnet',
            name: 'Magnetismo',
            description: 'Atrai moedas e gemas',
            maxLevel: 5,
            currentLevel: 0,
            cost: (level) => 3 + level * 2,
            effect: (level) => ({ coinMagnetRange: 50 + level * 30 })
          },
          {
            id: 'lucky_strike',
            name: 'Sorte',
            description: 'Aumenta chance de drop raro',
            maxLevel: 5,
            currentLevel: 0,
            cost: (level) => 4 + level * 3,
            effect: (level) => ({ luckBonus: level * 0.1 }),
            requires: ['xp_gain', 5]
          },
          {
            id: 'treasure_hunter',
            name: 'Caçador de Tesouros',
            description: 'Revela itens raros no mapa',
            maxLevel: 3,
            currentLevel: 0,
            cost: (level) => 5 + level * 4,
            effect: (level) => ({ treasureRange: 100 + level * 50 }),
            requires: ['lucky_strike', 3]
          }
        ]
      }
    };
    
    this.prestige = {
      level: 0,
      totalPrestiges: 0,
      bonusPerPrestige: {
        xpMultiplier: 0.05,      // +5% XP por prestige
        coinMultiplier: 0.05,    // +5% moedas por prestige
        startingLevel: 1,        // +1 level inicial por prestige
        skillPointBonus: 2       // +2 skill points por prestige
      },
      requirements: {
        minLevel: 100,
        unlockCost: 0            // Grátis, mas perde progresso
      }
    };
    
    this.achievements = {
      categories: {
        progression: [
          { id: 'reach_level_10', name: 'Crescendo', desc: 'Alcance level 10', requirement: 10, reward: { gems: 10 } },
          { id: 'reach_level_25', name: 'Em Ascensão', desc: 'Alcance level 25', requirement: 25, reward: { gems: 25 } },
          { id: 'reach_level_50', name: 'Mestre', desc: 'Alcance level 50', requirement: 50, reward: { gems: 50, skillPoints: 5 } },
          { id: 'reach_level_100', name: 'Lenda', desc: 'Alcance level 100', requirement: 100, reward: { gems: 100, skillPoints: 10 } },
          { id: 'first_evolution', name: 'Primeira Evolução', desc: 'Evolua pela primeira vez', reward: { coins: 500 } },
          { id: 'max_evolution', name: 'Forma Final', desc: 'Alcance a evolução máxima', reward: { gems: 75 } }
        ],
        
        combat: [
          { id: 'eat_100', name: 'Fome Insaciável', desc: 'Coma 100 peixes', requirement: 100, reward: { coins: 100 } },
          { id: 'eat_1000', name: 'Predador Nato', desc: 'Coma 1000 peixes', requirement: 1000, reward: { gems: 25 } },
          { id: 'eat_10000', name: 'Apocalipse Aquático', desc: 'Coma 10000 peixes', requirement: 10000, reward: { gems: 100, title: 'Devorador' } },
          { id: 'combo_10', name: 'Combo Master', desc: 'Consiga combo de 10', requirement: 10, reward: { coins: 200 } },
          { id: 'combo_50', name: 'Combo Insano', desc: 'Consiga combo de 50', requirement: 50, reward: { gems: 50 } },
          { id: 'defeat_boss', name: 'Caçador de Gigantes', desc: 'Derrote um boss', reward: { gems: 30, skillPoints: 3 } },
          { id: 'perfect_run', name: 'Run Perfeita', desc: 'Complete uma run sem dano', reward: { gems: 75 } }
        ],
        
        collection: [
          { id: 'catch_legendary', name: 'Sorte Lendária', desc: 'Capture um peixe lendário', reward: { gems: 50 } },
          { id: 'catch_all_types', name: 'Colecionador', desc: 'Capture todos tipos de peixe', reward: { gems: 100, title: 'Enciclopédia Viva' } },
          { id: 'collect_1000_coins', name: 'Rico', desc: 'Colete 1000 moedas total', requirement: 1000, reward: { coinMultiplier: 1.1 } },
          { id: 'collect_100_gems', name: 'Caçador de Gemas', desc: 'Colete 100 gemas total', requirement: 100, reward: { gemSpawnRate: 1.2 } }
        ],
        
        exploration: [
          { id: 'explore_all_zones', name: 'Explorador', desc: 'Visite todas as zonas', reward: { gems: 40 } },
          { id: 'dive_deep', name: 'Mergulhador Profundo', desc: 'Alcance profundidade máxima', reward: { coins: 500 } },
          { id: 'distance_1000', name: 'Maratonista', desc: 'Nade 1000 unidades', requirement: 1000, reward: { speedBonus: 1.05 } }
        ],
        
        special: [
          { id: 'first_prestige', name: 'Recomeço', desc: 'Faça seu primeiro prestige', reward: { prestigeBonus: 0.02 } },
          { id: 'prestige_5', name: 'Veterano', desc: 'Alcance prestige 5', requirement: 5, reward: { gems: 150, skillPoints: 15 } },
          { id: 'unlock_all_skills', name: 'Mestre de Todas', desc: 'Desbloqueie todas habilidades', reward: { gems: 200, title: 'Onisciente' } }
        ]
      },
      
      completed: new Set(),
      progress: {}
    };
    
    this.statistics = {
      totalFishEaten: 0,
      totalDistance: 0,
      totalCoins: 0,
      totalGems: 0,
      highestCombo: 0,
      highestLevel: 0,
      bossesDefeated: 0,
      runsCompleted: 0,
      totalPlayTime: 0,
      fishTypes: {},
      zonesVisited: new Set()
    };
  }
  
  /**
   * Verifica se pode evoluir
   */
  canEvolve() {
    const currentTier = this.sharkEvolution.currentTier;
    const nextTier = this.sharkEvolution.tiers[currentTier + 1];
    
    if (!nextTier) return false;
    return level >= nextTier.minLevel;
  }
  
  /**
   * Evolui o tubarão
   */
  evolve() {
    if (!this.canEvolve()) return false;
    
    this.sharkEvolution.currentTier++;
    const newTier = this.getCurrentTier();
    newTier.unlocked = true;
    
    // Aplicar bônus
    this.applyEvolutionBonuses();
    
    // Achievement
    this.checkAchievement('first_evolution');
    if (this.sharkEvolution.currentTier === this.sharkEvolution.tiers.length - 1) {
      this.checkAchievement('max_evolution');
    }
    
    return true;
  }
  
  /**
   * Retorna tier atual
   */
  getCurrentTier() {
    return this.sharkEvolution.tiers[this.sharkEvolution.currentTier];
  }
  
  /**
   * Aplica bônus de evolução
   */
  applyEvolutionBonuses() {
    const tier = this.getCurrentTier();
    
    if (player) {
      player.r = CONFIG.PLAYER_INITIAL_RADIUS * tier.sizeMultiplier;
      player.speed = CONFIG.PLAYER_INITIAL_SPEED + tier.speedBonus;
      
      // Desbloquear habilidade especial
      if (tier.specialAbility) {
        this.unlockSpecialAbility(tier.specialAbility);
      }
    }
  }
  
  /**
   * Desbloqueia habilidade especial
   */
  unlockSpecialAbility(abilityId) {
    if (!player.specialAbilities) {
      player.specialAbilities = {};
    }
    
    player.specialAbilities[abilityId] = true;
  }
  
  /**
   * Investe ponto em skill
   */
  investSkillPoint(category, skillId) {
    const skill = this.findSkill(category, skillId);
    if (!skill) return false;
    
    // Verificar se pode investir
    if (skill.currentLevel >= skill.maxLevel) return false;
    if (upgradePoints < skill.cost(skill.currentLevel)) return false;
    
    // Verificar requisitos
    if (skill.requires) {
      const [reqSkillId, reqLevel] = skill.requires;
      const reqSkill = this.findSkillInTree(reqSkillId);
      if (!reqSkill || reqSkill.currentLevel < reqLevel) return false;
    }
    
    // Investir
    upgradePoints -= skill.cost(skill.currentLevel);
    skill.currentLevel++;
    
    // Aplicar efeito
    this.applySkillEffect(skill);
    
    return true;
  }
  
  /**
   * Encontra skill
   */
  findSkill(category, skillId) {
    const cat = this.skillTree[category];
    if (!cat) return null;
    return cat.skills.find(s => s.id === skillId);
  }
  
  /**
   * Encontra skill em toda tree
   */
  findSkillInTree(skillId) {
    for (const category of Object.values(this.skillTree)) {
      const skill = category.skills.find(s => s.id === skillId);
      if (skill) return skill;
    }
    return null;
  }
  
  /**
   * Aplica efeito de skill
   */
  applySkillEffect(skill) {
    const effect = skill.effect(skill.currentLevel);
    
    // Aplicar ao player
    if (typeof playerStats !== 'undefined') {
      Object.assign(playerStats, effect);
    }
  }
  
  /**
   * Faz prestige
   */
  doPrestige() {
    if (level < this.prestige.requirements.minLevel) return false;
    
    // Confirmar com usuário
    const confirmed = confirm(
      `Fazer Prestige?\n\n` +
      `Você perderá seu progresso atual mas ganhará bônus permanentes:\n` +
      `- +${this.prestige.bonusPerPrestige.xpMultiplier * 100}% XP\n` +
      `- +${this.prestige.bonusPerPrestige.coinMultiplier * 100}% Moedas\n` +
      `- Começa no level ${this.prestige.bonusPerPrestige.startingLevel}\n` +
      `- +${this.prestige.bonusPerPrestige.skillPointBonus} Skill Points`
    );
    
    if (!confirmed) return false;
    
    // Salvar stats importantes
    const savedGems = gems;
    const savedSkills = JSON.parse(JSON.stringify(this.skillTree));
    
    // Reset progresso
    level = 1 + this.prestige.level * this.prestige.bonusPerPrestige.startingLevel;
    xp = 0;
    xpToNext = CONFIG.INITIAL_XP_TO_NEXT;
    coins = 0;
    upgradePoints = this.prestige.bonusPerPrestige.skillPointBonus * (this.prestige.level + 1);
    
    // Reset upgrades
    upgrades = {
      maxHunger: 0,
      hungerDrain: 0,
      xpBonus: 0,
      speed: 0,
      heal: 0
    };
    
    // Manter gemas
    gems = savedGems;
    
    // Incrementar prestige
    this.prestige.level++;
    this.prestige.totalPrestiges++;
    
    // Achievement
    this.checkAchievement('first_prestige');
    if (this.prestige.level >= 5) {
      this.checkAchievement('prestige_5');
    }
    
    // Resetar shark
    this.sharkEvolution.currentTier = 0;
    
    return true;
  }
  
  /**
   * Calcula multiplicadores de prestige
   */
  getPrestigeMultipliers() {
    const level = this.prestige.level;
    return {
      xp: 1 + level * this.prestige.bonusPerPrestige.xpMultiplier,
      coins: 1 + level * this.prestige.bonusPerPrestige.coinMultiplier
    };
  }
  
  /**
   * Checa achievement
   */
  checkAchievement(achievementId) {
    // Verificar se já completou
    if (this.achievements.completed.has(achievementId)) return;
    
    // Procurar achievement
    let achievement = null;
    for (const category of Object.values(this.achievements.categories)) {
      achievement = category.find(a => a.id === achievementId);
      if (achievement) break;
    }
    
    if (!achievement) return;
    
    // Verificar requirement
    if (achievement.requirement) {
      const progress = this.achievements.progress[achievementId] || 0;
      if (progress < achievement.requirement) return;
    }
    
    // Completar
    this.achievements.completed.add(achievementId);
    this.grantAchievementReward(achievement);
    this.showAchievementNotification(achievement);
  }
  
  /**
   * Concede recompensa de achievement
   */
  grantAchievementReward(achievement) {
    const reward = achievement.reward;
    
    if (reward.coins) coins += reward.coins;
    if (reward.gems) gems += reward.gems;
    if (reward.skillPoints) upgradePoints += reward.skillPoints;
    
    if (reward.xpMultiplier) {
      // Bônus permanente
      playerStats.xpMultiplier = (playerStats.xpMultiplier || 1) * reward.xpMultiplier;
    }
    
    if (reward.title) {
      // Desbloquear título
      if (!this.unlockedTitles) this.unlockedTitles = [];
      this.unlockedTitles.push(reward.title);
    }
  }
  
  /**
   * Mostra notificação de achievement
   */
  showAchievementNotification(achievement) {
    if (typeof ui !== 'undefined' && ui.showNotification) {
      ui.showNotification(
        `🏆 Achievement Desbloqueado!\n${achievement.name}\n${achievement.desc}`,
        5000,
        'achievement'
      );
    }
  }
  
  /**
   * Atualiza progresso de achievement
   */
  updateAchievementProgress(achievementId, value) {
    this.achievements.progress[achievementId] = value;
    this.checkAchievement(achievementId);
  }
  
  /**
   * Incrementa progresso
   */
  incrementAchievementProgress(achievementId, amount = 1) {
    const current = this.achievements.progress[achievementId] || 0;
    this.updateAchievementProgress(achievementId, current + amount);
  }
  
  /**
   * Atualiza estatísticas
   */
  updateStatistics(type, value) {
    switch(type) {
      case 'fishEaten':
        this.statistics.totalFishEaten++;
        this.incrementAchievementProgress('eat_100');
        this.incrementAchievementProgress('eat_1000');
        this.incrementAchievementProgress('eat_10000');
        break;
      
      case 'fishType':
        if (!this.statistics.fishTypes[value]) {
          this.statistics.fishTypes[value] = 0;
        }
        this.statistics.fishTypes[value]++;
        
        // Verificar se pegou todos tipos
        const allTypes = Object.keys(getAllFishTypes()).length;
        if (Object.keys(this.statistics.fishTypes).length >= allTypes) {
          this.checkAchievement('catch_all_types');
        }
        break;
      
      case 'coins':
        this.statistics.totalCoins += value;
        this.updateAchievementProgress('collect_1000_coins', this.statistics.totalCoins);
        break;
      
      case 'gems':
        this.statistics.totalGems += value;
        this.updateAchievementProgress('collect_100_gems', this.statistics.totalGems);
        break;
      
      case 'combo':
        if (value > this.statistics.highestCombo) {
          this.statistics.highestCombo = value;
          this.updateAchievementProgress('combo_10', value);
          this.updateAchievementProgress('combo_50', value);
        }
        break;
      
      case 'level':
        if (value > this.statistics.highestLevel) {
          this.statistics.highestLevel = value;
          this.updateAchievementProgress('reach_level_10', value);
          this.updateAchievementProgress('reach_level_25', value);
          this.updateAchievementProgress('reach_level_50', value);
          this.updateAchievementProgress('reach_level_100', value);
        }
        break;
      
      case 'distance':
        this.statistics.totalDistance += value;
        this.updateAchievementProgress('distance_1000', this.statistics.totalDistance);
        break;
      
      case 'bossDefeated':
        this.statistics.bossesDefeated++;
        this.checkAchievement('defeat_boss');
        break;
    }
  }
  
  /**
   * Salva progresso
   */
  save() {
    const saveData = {
      sharkEvolution: this.sharkEvolution,
      skillTree: this.skillTree,
      prestige: this.prestige,
      achievements: {
        completed: Array.from(this.achievements.completed),
        progress: this.achievements.progress
      },
      statistics: this.statistics,
      unlockedTitles: this.unlockedTitles || []
    };
    
    localStorage.setItem('progression_save', JSON.stringify(saveData));
  }
  
  /**
   * Carrega progresso
   */
  load() {
    const saved = localStorage.getItem('progression_save');
    if (!saved) return;
    
    try {
      const data = JSON.parse(saved);
      
      if (data.sharkEvolution) this.sharkEvolution = data.sharkEvolution;
      if (data.skillTree) this.skillTree = data.skillTree;
      if (data.prestige) this.prestige = data.prestige;
      if (data.achievements) {
        this.achievements.completed = new Set(data.achievements.completed);
        this.achievements.progress = data.achievements.progress;
      }
      if (data.statistics) this.statistics = data.statistics;
      if (data.unlockedTitles) this.unlockedTitles = data.unlockedTitles;
      
      // Reaplicar efeitos de skills
      this.reapplyAllSkillEffects();
      
    } catch (e) {
      console.error('Erro ao carregar progressão:', e);
    }
  }
  
  /**
   * Reaplica efeitos de todas skills
   */
  reapplyAllSkillEffects() {
    for (const category of Object.values(this.skillTree)) {
      for (const skill of category.skills) {
        if (skill.currentLevel > 0) {
          this.applySkillEffect(skill);
        }
      }
    }
  }
}

// Instância global
const progressionSystem = new ProgressionSystem();
