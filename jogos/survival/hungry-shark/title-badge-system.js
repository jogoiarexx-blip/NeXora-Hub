// ================= SISTEMA DE TÍTULOS E BADGES =================
// 🏆 Sistema completo de títulos equipáveis e badges visuais

class TitleBadgeSystem {
  constructor() {
    this.init();
  }
  
  init() {
    // Títulos disponíveis no jogo
    this.titles = {
      // ========== TÍTULOS POR CONQUISTAS ==========
      the_immortal: {
        id: 'the_immortal',
        name: 'O Imortal',
        description: 'Sobreviveu 30 minutos sem morrer',
        rarity: 'legendary',
        color: '#FFD700',
        requirement: {
          type: 'survival_time',
          value: 1800 // 30 minutos em segundos
        },
        unlocked: false
      },
      
      genocidal: {
        id: 'genocidal',
        name: 'Genocida',
        description: 'Eliminou 1000 peixes',
        rarity: 'epic',
        color: '#8B0000',
        requirement: {
          type: 'fish_killed',
          value: 1000
        },
        unlocked: false
      },
      
      legend_hunter: {
        id: 'legend_hunter',
        name: 'Caçador de Lendas',
        description: 'Derrotou todos os tipos de boss',
        rarity: 'legendary',
        color: '#9370DB',
        requirement: {
          type: 'all_bosses_defeated',
          value: true
        },
        unlocked: false
      },
      
      collector: {
        id: 'collector',
        name: 'Colecionador',
        description: 'Desbloqueou todas as skins',
        rarity: 'epic',
        color: '#FF69B4',
        requirement: {
          type: 'all_skins_unlocked',
          value: true
        },
        unlocked: false
      },
      
      // ========== TÍTULOS POR RANK/LEVEL ==========
      beginner: {
        id: 'beginner',
        name: 'Iniciante',
        description: 'Alcançou nível 1-5',
        rarity: 'common',
        color: '#808080',
        requirement: {
          type: 'level',
          min: 1,
          max: 5
        },
        unlocked: true // Sempre desbloqueado
      },
      
      shark: {
        id: 'shark',
        name: 'Tubarão',
        description: 'Alcançou nível 6-15',
        rarity: 'common',
        color: '#4682B4',
        requirement: {
          type: 'level',
          min: 6,
          max: 15
        },
        unlocked: false
      },
      
      predator: {
        id: 'predator',
        name: 'Predador',
        description: 'Alcançou nível 16-30',
        rarity: 'uncommon',
        color: '#FF4500',
        requirement: {
          type: 'level',
          min: 16,
          max: 30
        },
        unlocked: false
      },
      
      apex: {
        id: 'apex',
        name: 'Apex',
        description: 'Alcançou nível 31-50',
        rarity: 'rare',
        color: '#DC143C',
        requirement: {
          type: 'level',
          min: 31,
          max: 50
        },
        unlocked: false
      },
      
      sea_god: {
        id: 'sea_god',
        name: 'Deus dos Mares',
        description: 'Alcançou nível 50+',
        rarity: 'legendary',
        color: '#00CED1',
        requirement: {
          type: 'level',
          min: 50
        },
        unlocked: false
      },
      
      // ========== TÍTULOS ESPECIAIS ==========
      speedrunner: {
        id: 'speedrunner',
        name: 'Speedrunner',
        description: 'Alcançou nível 25 em menos de 30 minutos',
        rarity: 'epic',
        color: '#FFD700',
        requirement: {
          type: 'speedrun',
          level: 25,
          time: 1800 // 30 minutos
        },
        unlocked: false
      },
      
      pacifist: {
        id: 'pacifist',
        name: 'Pacifista',
        description: 'Alcançou nível 10 sem matar inimigos',
        rarity: 'rare',
        color: '#90EE90',
        requirement: {
          type: 'pacifist',
          level: 10,
          enemies_killed: 0
        },
        unlocked: false
      },
      
      tank: {
        id: 'tank',
        name: 'Tanque',
        description: 'Recebeu 10000 de dano total',
        rarity: 'rare',
        color: '#A9A9A9',
        requirement: {
          type: 'damage_taken',
          value: 10000
        },
        unlocked: false
      },
      
      combo_master: {
        id: 'combo_master',
        name: 'Mestre do Combo',
        description: 'Alcançou combo de 50x',
        rarity: 'epic',
        color: '#FF6347',
        requirement: {
          type: 'max_combo',
          value: 50
        },
        unlocked: false
      },
      
      wealthy: {
        id: 'wealthy',
        name: 'Milionário',
        description: 'Acumulou 1.000.000 moedas',
        rarity: 'rare',
        color: '#FFD700',
        requirement: {
          type: 'total_coins',
          value: 1000000
        },
        unlocked: false
      },
      
      treasure_hunter: {
        id: 'treasure_hunter',
        name: 'Caçador de Tesouros',
        description: 'Coletou 10.000 gemas',
        rarity: 'epic',
        color: '#FF00FF',
        requirement: {
          type: 'total_gems',
          value: 10000
        },
        unlocked: false
      }
    };
    
    // Badges visuais
    this.badges = {
      // ========== BADGES DE CONQUISTA ==========
      first_blood: {
        id: 'first_blood',
        name: 'Primeira Morte',
        icon: '💀',
        description: 'Primeiro peixe eliminado',
        rarity: 'common',
        unlocked: false
      },
      
      century: {
        id: 'century',
        name: 'Centurion',
        icon: '💯',
        description: '100 peixes eliminados',
        rarity: 'uncommon',
        unlocked: false
      },
      
      veteran: {
        id: 'veteran',
        name: 'Veterano',
        icon: '⭐',
        description: '10 horas de jogo',
        rarity: 'rare',
        unlocked: false
      },
      
      boss_slayer: {
        id: 'boss_slayer',
        name: 'Matador de Boss',
        icon: '👑',
        description: 'Primeiro boss derrotado',
        rarity: 'rare',
        unlocked: false
      },
      
      legendary_catch: {
        id: 'legendary_catch',
        name: 'Captura Lendária',
        icon: '🌟',
        description: 'Primeiro peixe lendário',
        rarity: 'epic',
        unlocked: false
      },
      
      // ========== BADGES DE MAESTRIA ==========
      speed_demon: {
        id: 'speed_demon',
        name: 'Demônio da Velocidade',
        icon: '⚡',
        description: 'Velocidade máxima desbloqueada',
        rarity: 'rare',
        unlocked: false
      },
      
      immortal_badge: {
        id: 'immortal_badge',
        name: 'Badge Imortal',
        icon: '🛡️',
        description: 'Sobreviveu 1 hora',
        rarity: 'legendary',
        unlocked: false
      },
      
      prestige_1: {
        id: 'prestige_1',
        name: 'Prestige I',
        icon: '🔱',
        description: 'Primeiro prestige',
        rarity: 'legendary',
        unlocked: false
      },
      
      evolution_complete: {
        id: 'evolution_complete',
        name: 'Evolução Completa',
        icon: '🦈',
        description: 'Alcançou Leviatã',
        rarity: 'legendary',
        unlocked: false
      },
      
      // ========== BADGES ESPECIAIS ==========
      lucky: {
        id: 'lucky',
        name: 'Sortudo',
        icon: '🍀',
        description: 'Encontrou item ultra-raro',
        rarity: 'epic',
        unlocked: false
      },
      
      explorer: {
        id: 'explorer',
        name: 'Explorador',
        icon: '🗺️',
        description: 'Explorou todo o mapa',
        rarity: 'rare',
        unlocked: false
      },
      
      perfect_run: {
        id: 'perfect_run',
        name: 'Run Perfeita',
        icon: '💎',
        description: 'Nível 50 sem morrer',
        rarity: 'legendary',
        unlocked: false
      }
    };
    
    // Estado atual
    this.equippedTitle = 'beginner';
    this.equippedBadges = []; // Máximo 3
    
    // Estatísticas para tracking
    this.statistics = {
      survivalTime: 0,
      fishKilled: 0,
      enemiesKilled: 0,
      bossesDefeated: [],
      damageTaken: 0,
      maxCombo: 0,
      totalCoins: 0,
      totalGems: 0,
      playTime: 0,
      levelReachedTime: {},
      skinsUnlocked: 0
    };
  }
  
  // ========== GERENCIAMENTO DE TÍTULOS ==========
  
  checkTitleUnlock(titleId) {
    const title = this.titles[titleId];
    if (!title || title.unlocked) return false;
    
    const req = title.requirement;
    let unlocked = false;
    
    switch (req.type) {
      case 'survival_time':
        unlocked = this.statistics.survivalTime >= req.value;
        break;
        
      case 'fish_killed':
        unlocked = this.statistics.fishKilled >= req.value;
        break;
        
      case 'all_bosses_defeated':
        // Verificar se todos os bosses foram derrotados
        const allBosses = ['dragon', 'kraken', 'megalodon']; // Exemplo
        unlocked = allBosses.every(boss => this.statistics.bossesDefeated.includes(boss));
        break;
        
      case 'all_skins_unlocked':
        // Verificar total de skins (precisa ser integrado com sistema de skins)
        const totalSkins = 10; // Placeholder
        unlocked = this.statistics.skinsUnlocked >= totalSkins;
        break;
        
      case 'level':
        if (typeof level !== 'undefined') {
          unlocked = level >= req.min && (!req.max || level <= req.max);
        }
        break;
        
      case 'speedrun':
        const timeForLevel = this.statistics.levelReachedTime[req.level];
        unlocked = timeForLevel && timeForLevel <= req.time;
        break;
        
      case 'pacifist':
        unlocked = typeof level !== 'undefined' && 
                   level >= req.level && 
                   this.statistics.enemiesKilled === 0;
        break;
        
      case 'damage_taken':
        unlocked = this.statistics.damageTaken >= req.value;
        break;
        
      case 'max_combo':
        unlocked = this.statistics.maxCombo >= req.value;
        break;
        
      case 'total_coins':
        unlocked = this.statistics.totalCoins >= req.value;
        break;
        
      case 'total_gems':
        unlocked = this.statistics.totalGems >= req.value;
        break;
    }
    
    if (unlocked) {
      title.unlocked = true;
      this.onTitleUnlocked(titleId);
      return true;
    }
    
    return false;
  }
  
  checkBadgeUnlock(badgeId) {
    const badge = this.badges[badgeId];
    if (!badge || badge.unlocked) return false;
    
    let unlocked = false;
    
    // Lógica específica para cada badge
    switch (badgeId) {
      case 'first_blood':
        unlocked = this.statistics.fishKilled >= 1;
        break;
        
      case 'century':
        unlocked = this.statistics.fishKilled >= 100;
        break;
        
      case 'veteran':
        unlocked = this.statistics.playTime >= 36000; // 10 horas
        break;
        
      case 'boss_slayer':
        unlocked = this.statistics.bossesDefeated.length >= 1;
        break;
        
      case 'legendary_catch':
        // Precisa ser integrado com sistema de peixes lendários
        unlocked = false; // Placeholder
        break;
        
      case 'immortal_badge':
        unlocked = this.statistics.survivalTime >= 3600; // 1 hora
        break;
        
      case 'evolution_complete':
        if (typeof progressionSystem !== 'undefined') {
          unlocked = progressionSystem.sharkEvolution.currentTier >= 5;
        }
        break;
    }
    
    if (unlocked) {
      badge.unlocked = true;
      this.onBadgeUnlocked(badgeId);
      return true;
    }
    
    return false;
  }
  
  checkAllTitles() {
    Object.keys(this.titles).forEach(titleId => {
      this.checkTitleUnlock(titleId);
    });
  }
  
  checkAllBadges() {
    Object.keys(this.badges).forEach(badgeId => {
      this.checkBadgeUnlock(badgeId);
    });
  }
  
  // ========== EQUIPAR/DESEQUIPAR ==========
  
  equipTitle(titleId) {
    const title = this.titles[titleId];
    if (!title || !title.unlocked) {
      console.log('Título não desbloqueado ou inexistente');
      return false;
    }
    
    this.equippedTitle = titleId;
    console.log(`✨ Título equipado: ${title.name}`);
    return true;
  }
  
  equipBadge(badgeId) {
    const badge = this.badges[badgeId];
    if (!badge || !badge.unlocked) {
      console.log('Badge não desbloqueado ou inexistente');
      return false;
    }
    
    if (this.equippedBadges.length >= 3) {
      console.log('Máximo de 3 badges equipados');
      return false;
    }
    
    if (this.equippedBadges.includes(badgeId)) {
      console.log('Badge já equipado');
      return false;
    }
    
    this.equippedBadges.push(badgeId);
    console.log(`✨ Badge equipado: ${badge.name}`);
    return true;
  }
  
  unequipBadge(badgeId) {
    const index = this.equippedBadges.indexOf(badgeId);
    if (index > -1) {
      this.equippedBadges.splice(index, 1);
      return true;
    }
    return false;
  }
  
  // ========== ATUALIZAÇÃO DE ESTATÍSTICAS ==========
  
  updateStatistics(stat, value) {
    switch (stat) {
      case 'survivalTime':
        this.statistics.survivalTime += value;
        break;
        
      case 'fishKilled':
        this.statistics.fishKilled += value;
        this.checkBadgeUnlock('first_blood');
        this.checkBadgeUnlock('century');
        break;
        
      case 'enemiesKilled':
        this.statistics.enemiesKilled += value;
        break;
        
      case 'bossDefeated':
        if (!this.statistics.bossesDefeated.includes(value)) {
          this.statistics.bossesDefeated.push(value);
          this.checkBadgeUnlock('boss_slayer');
        }
        break;
        
      case 'damageTaken':
        this.statistics.damageTaken += value;
        break;
        
      case 'maxCombo':
        if (value > this.statistics.maxCombo) {
          this.statistics.maxCombo = value;
        }
        break;
        
      case 'totalCoins':
        this.statistics.totalCoins += value;
        break;
        
      case 'totalGems':
        this.statistics.totalGems += value;
        break;
        
      case 'playTime':
        this.statistics.playTime += value;
        this.checkBadgeUnlock('veteran');
        break;
        
      case 'levelReached':
        if (!this.statistics.levelReachedTime[value]) {
          this.statistics.levelReachedTime[value] = this.statistics.playTime;
        }
        break;
    }
    
    // Verificar títulos relacionados
    this.checkAllTitles();
    this.checkAllBadges();
  }
  
  // ========== EVENTOS ==========
  
  onTitleUnlocked(titleId) {
    const title = this.titles[titleId];
    console.log(`🏆 Novo título desbloqueado: ${title.name}`);
    
    // Mostrar notificação visual (se tiver sistema de UI)
    if (typeof showNotification === 'function') {
      showNotification(`🏆 Novo título: ${title.name}`, 5000, 'achievement');
    }
    
    this.save();
  }
  
  onBadgeUnlocked(badgeId) {
    const badge = this.badges[badgeId];
    console.log(`🎖️ Novo badge desbloqueado: ${badge.name}`);
    
    // Mostrar notificação visual
    if (typeof showNotification === 'function') {
      showNotification(`${badge.icon} ${badge.name}`, 5000, 'achievement');
    }
    
    this.save();
  }
  
  // ========== INTERFACE ==========
  
  getEquippedTitle() {
    return this.titles[this.equippedTitle];
  }
  
  getEquippedBadges() {
    return this.equippedBadges.map(id => this.badges[id]);
  }
  
  getUnlockedTitles() {
    return Object.values(this.titles).filter(t => t.unlocked);
  }
  
  getUnlockedBadges() {
    return Object.values(this.badges).filter(b => b.unlocked);
  }
  
  getTitleProgress(titleId) {
    const title = this.titles[titleId];
    if (!title) return null;
    
    const req = title.requirement;
    let current = 0;
    let total = req.value || 1;
    
    switch (req.type) {
      case 'survival_time':
        current = this.statistics.survivalTime;
        break;
      case 'fish_killed':
        current = this.statistics.fishKilled;
        break;
      case 'damage_taken':
        current = this.statistics.damageTaken;
        break;
      case 'max_combo':
        current = this.statistics.maxCombo;
        break;
      case 'total_coins':
        current = this.statistics.totalCoins;
        break;
      case 'total_gems':
        current = this.statistics.totalGems;
        break;
    }
    
    return {
      current: Math.min(current, total),
      total: total,
      percentage: Math.min((current / total) * 100, 100)
    };
  }
  
  // ========== SAVE/LOAD ==========
  
  save() {
    const saveData = {
      equippedTitle: this.equippedTitle,
      equippedBadges: this.equippedBadges,
      statistics: this.statistics,
      unlockedTitles: Object.keys(this.titles).filter(id => this.titles[id].unlocked),
      unlockedBadges: Object.keys(this.badges).filter(id => this.badges[id].unlocked)
    };
    
    localStorage.setItem('title_badge_system', JSON.stringify(saveData));
  }
  
  load() {
    const saved = localStorage.getItem('title_badge_system');
    if (!saved) return;
    
    try {
      const data = JSON.parse(saved);
      
      this.equippedTitle = data.equippedTitle || 'beginner';
      this.equippedBadges = data.equippedBadges || [];
      this.statistics = { ...this.statistics, ...data.statistics };
      
      // Restaurar títulos desbloqueados
      if (data.unlockedTitles) {
        data.unlockedTitles.forEach(id => {
          if (this.titles[id]) {
            this.titles[id].unlocked = true;
          }
        });
      }
      
      // Restaurar badges desbloqueados
      if (data.unlockedBadges) {
        data.unlockedBadges.forEach(id => {
          if (this.badges[id]) {
            this.badges[id].unlocked = true;
          }
        });
      }
      
      console.log('✅ Sistema de títulos e badges carregado');
    } catch (e) {
      console.error('Erro ao carregar títulos/badges:', e);
    }
  }
}

// Instância global (será criada no game.js)
// window.titleBadgeSystem = new TitleBadgeSystem();
