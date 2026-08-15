// ================= SISTEMA DE CONQUISTAS (ACHIEVEMENTS) =================

/**
 * Sistema completo de conquistas com:
 * - Múltiplas categorias
 * - Progresso rastreável
 * - Recompensas
 * - Notificações visuais
 * - Persistência no save
 */

// ================= DEFINIÇÃO DAS CONQUISTAS =================

const ACHIEVEMENT_CATEGORIES = {
  PROGRESSION: { name: 'Progressão', icon: '⭐', color: '#FFD700' },
  COMBAT: { name: 'Combate', icon: '⚔️', color: '#EF4444' },
  COLLECTION: { name: 'Coleção', icon: '🎣', color: '#3B82F6' },
  SURVIVAL: { name: 'Sobrevivência', icon: '❤️', color: '#22C55E' },
  SPECIAL: { name: 'Especiais', icon: '🏆', color: '#A855F7' },
  SECRET: { name: 'Secretas', icon: '❓', color: '#6B7280' }
};

const ACHIEVEMENTS = {
  // ===== PROGRESSÃO =====
  first_bite: {
    id: 'first_bite',
    name: 'Primeira Mordida',
    description: 'Coma seu primeiro peixe',
    category: 'PROGRESSION',
    target: 1,
    current: 0,
    unlocked: false,
    secret: false,
    reward: { coins: 50, xp: 10 },
    checkCondition: (stats) => stats.fishEaten >= 1
  },
  
  level_5: {
    id: 'level_5',
    name: 'Tubarão Jovem',
    description: 'Alcance o nível 5',
    category: 'PROGRESSION',
    target: 5,
    current: 0,
    unlocked: false,
    secret: false,
    reward: { coins: 100, gems: 1 },
    checkCondition: (stats) => stats.level >= 5
  },
  
  level_10: {
    id: 'level_10',
    name: 'Tubarão Adulto',
    description: 'Alcance o nível 10',
    category: 'PROGRESSION',
    target: 10,
    current: 0,
    unlocked: false,
    secret: false,
    reward: { coins: 250, gems: 2 },
    checkCondition: (stats) => stats.level >= 10
  },
  
  level_25: {
    id: 'level_25',
    name: 'Apex Predator',
    description: 'Alcance o nível 25',
    category: 'PROGRESSION',
    target: 25,
    current: 0,
    unlocked: false,
    secret: false,
    reward: { coins: 500, gems: 5, unlockSkin: 'golden' },
    checkCondition: (stats) => stats.level >= 25
  },
  
  max_all_upgrades: {
    id: 'max_all_upgrades',
    name: 'Poder Máximo',
    description: 'Maximize todos os upgrades',
    category: 'PROGRESSION',
    target: 5,
    current: 0,
    unlocked: false,
    secret: false,
    reward: { coins: 1000, gems: 10 },
    checkCondition: (stats) => {
      return Object.values(upgrades).every(level => level >= 10);
    }
  },

  // ===== COMBATE =====
  enemy_slayer: {
    id: 'enemy_slayer',
    name: 'Caçador de Predadores',
    description: 'Derrote 10 inimigos',
    category: 'COMBAT',
    target: 10,
    current: 0,
    unlocked: false,
    secret: false,
    reward: { coins: 100, xp: 50 },
    checkCondition: (stats) => stats.enemiesDefeated >= 10
  },
  
  enemy_hunter: {
    id: 'enemy_hunter',
    name: 'Terror dos Mares',
    description: 'Derrote 50 inimigos',
    category: 'COMBAT',
    target: 50,
    current: 0,
    unlocked: false,
    secret: false,
    reward: { coins: 300, gems: 3 },
    checkCondition: (stats) => stats.enemiesDefeated >= 50
  },
  
  combo_master: {
    id: 'combo_master',
    name: 'Mestre dos Combos',
    description: 'Alcance um combo de 10x',
    category: 'COMBAT',
    target: 10,
    current: 0,
    unlocked: false,
    secret: false,
    reward: { coins: 200, xp: 100 },
    checkCondition: (stats) => stats.comboReached >= 10
  },
  
  combo_legend: {
    id: 'combo_legend',
    name: 'Lenda dos Combos',
    description: 'Alcance um combo de 25x',
    category: 'COMBAT',
    target: 25,
    current: 0,
    unlocked: false,
    secret: false,
    reward: { coins: 500, gems: 5 },
    checkCondition: (stats) => stats.comboReached >= 25
  },

  // ===== COLEÇÃO =====
  hundred_fish: {
    id: 'hundred_fish',
    name: 'Pescador Iniciante',
    description: 'Coma 100 peixes',
    category: 'COLLECTION',
    target: 100,
    current: 0,
    unlocked: false,
    secret: false,
    reward: { coins: 150, xp: 50 },
    checkCondition: (stats) => stats.fishEaten >= 100
  },
  
  thousand_fish: {
    id: 'thousand_fish',
    name: 'Pescador Veterano',
    description: 'Coma 1000 peixes',
    category: 'COLLECTION',
    target: 1000,
    current: 0,
    unlocked: false,
    secret: false,
    reward: { coins: 1000, gems: 10 },
    checkCondition: (stats) => stats.fishEaten >= 1000
  },
  
  coin_collector: {
    id: 'coin_collector',
    name: 'Coletor de Moedas',
    description: 'Colete 1000 moedas (total)',
    category: 'COLLECTION',
    target: 1000,
    current: 0,
    unlocked: false,
    secret: false,
    reward: { coins: 500, gems: 2 },
    checkCondition: (stats) => stats.totalCoinsCollected >= 1000
  },
  
  gem_hoarder: {
    id: 'gem_hoarder',
    name: 'Acumulador de Gemas',
    description: 'Colete 100 gemas (total)',
    category: 'COLLECTION',
    target: 100,
    current: 0,
    unlocked: false,
    secret: false,
    reward: { coins: 1000, gems: 20 },
    checkCondition: (stats) => stats.totalGemsCollected >= 100
  },

  // ===== SOBREVIVÊNCIA =====
  survivor_5min: {
    id: 'survivor_5min',
    name: 'Sobrevivente',
    description: 'Sobreviva por 5 minutos',
    category: 'SURVIVAL',
    target: 300, // segundos
    current: 0,
    unlocked: false,
    secret: false,
    reward: { coins: 100, xp: 50 },
    checkCondition: (stats) => stats.survivalTime >= 300
  },
  
  survivor_15min: {
    id: 'survivor_15min',
    name: 'Resistente',
    description: 'Sobreviva por 15 minutos',
    category: 'SURVIVAL',
    target: 900,
    current: 0,
    unlocked: false,
    secret: false,
    reward: { coins: 300, gems: 3 },
    checkCondition: (stats) => stats.survivalTime >= 900
  },
  
  near_death: {
    id: 'near_death',
    name: 'À Beira da Morte',
    description: 'Sobreviva com menos de 10 de fome',
    category: 'SURVIVAL',
    target: 1,
    current: 0,
    unlocked: false,
    secret: false,
    reward: { coins: 200, gems: 2 },
    checkCondition: (stats) => stats.lowestHunger > 0 && stats.lowestHunger < 10
  },
  
  no_damage: {
    id: 'no_damage',
    name: 'Intocável',
    description: 'Complete um jogo sem levar dano',
    category: 'SURVIVAL',
    target: 1,
    current: 0,
    unlocked: false,
    secret: false,
    reward: { coins: 500, gems: 5 },
    checkCondition: (stats) => stats.gameCompleted && stats.damagesTaken === 0
  },

  // ===== ESPECIAIS =====
  speed_demon: {
    id: 'speed_demon',
    name: 'Demônio da Velocidade',
    description: 'Alcance velocidade máxima de upgrade',
    category: 'SPECIAL',
    target: 10,
    current: 0,
    unlocked: false,
    secret: false,
    reward: { coins: 300, gems: 3, unlockSkin: 'speedster' },
    checkCondition: (stats) => upgrades.speed >= 10
  },
  
  hungry_beast: {
    id: 'hungry_beast',
    name: 'Fera Faminta',
    description: 'Alcance fome máxima de upgrade',
    category: 'SPECIAL',
    target: 10,
    current: 0,
    unlocked: false,
    secret: false,
    reward: { coins: 300, gems: 3, unlockSkin: 'tank' },
    checkCondition: (stats) => upgrades.maxHunger >= 10
  },
  
  rich_shark: {
    id: 'rich_shark',
    name: 'Tubarão Milionário',
    description: 'Acumule 10000 moedas',
    category: 'SPECIAL',
    target: 10000,
    current: 0,
    unlocked: false,
    secret: false,
    reward: { coins: 5000, gems: 20, unlockSkin: 'gold' },
    checkCondition: (stats) => coins >= 10000
  },

  // ===== SECRETAS =====
  secret_explorer: {
    id: 'secret_explorer',
    name: 'Explorador Secreto',
    description: '???',
    category: 'SECRET',
    target: 1,
    current: 0,
    unlocked: false,
    secret: true,
    secretCondition: 'Visite todos os cantos do oceano',
    reward: { coins: 500, gems: 10 },
    checkCondition: (stats) => stats.areasExplored >= 4
  },
  
  secret_pacifist: {
    id: 'secret_pacifist',
    name: 'Pacifista',
    description: '???',
    category: 'SECRET',
    target: 1,
    current: 0,
    unlocked: false,
    secret: true,
    secretCondition: 'Sobreviva 5 minutos sem derrotar inimigos',
    reward: { coins: 1000, gems: 15 },
    checkCondition: (stats) => stats.survivalTime >= 300 && stats.enemiesDefeated === 0
  },
  
  secret_perfectionist: {
    id: 'secret_perfectionist',
    name: 'Perfeccionista',
    description: '???',
    category: 'SECRET',
    target: 1,
    current: 0,
    unlocked: false,
    secret: true,
    secretCondition: 'Complete todas as conquistas não-secretas',
    reward: { coins: 10000, gems: 50, unlockSkin: 'ultimate' },
    checkCondition: (stats) => {
      return Object.values(ACHIEVEMENTS).filter(a => !a.secret).every(a => a.unlocked);
    }
  }
};

// ================= ESTATÍSTICAS RASTREADAS =================

let achievementStats = {
  // Progressão
  level: 1,
  
  // Combate
  fishEaten: 0,
  enemiesDefeated: 0,
  comboReached: 0,
  
  // Coleção
  totalCoinsCollected: 0,
  totalGemsCollected: 0,
  
  // Sobrevivência
  survivalTime: 0,
  lowestHunger: 100,
  damagesTaken: 0,
  gameCompleted: false,
  
  // Especiais
  areasExplored: 0,
  
  // Sessão atual
  sessionStartTime: 0,
  currentSessionTime: 0
};

// ================= NOTIFICAÇÕES DE CONQUISTAS =================

let achievementNotifications = [];

class AchievementNotification {
  constructor(achievement) {
    this.achievement = achievement;
    this.x = canvas.width/dpr + 300; // Começa fora da tela (direita)
    this.y = 100;
    this.targetX = canvas.width/dpr - 320;
    this.life = 5; // 5 segundos
    this.phase = 'slide-in'; // 'slide-in', 'display', 'slide-out'
    this.slideSpeed = 8;
  }
  
  update(dt) {
    this.life -= dt;
    
    if (this.phase === 'slide-in') {
      this.x -= this.slideSpeed * (canvas.width/dpr) * dt;
      if (this.x <= this.targetX) {
        this.x = this.targetX;
        this.phase = 'display';
      }
    } else if (this.phase === 'display') {
      if (this.life < 1) {
        this.phase = 'slide-out';
      }
    } else if (this.phase === 'slide-out') {
      this.x += this.slideSpeed * (canvas.width/dpr) * dt;
    }
    
    return this.life > 0 && this.x < canvas.width/dpr + 300;
  }
  
  draw(ctx) {
    const category = ACHIEVEMENT_CATEGORIES[this.achievement.category];
    const width = 300;
    const height = 100;
    
    ctx.save();
    
    // Sombra
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 20;
    ctx.shadowOffsetY = 5;
    
    // Background com gradiente
    const gradient = ctx.createLinearGradient(this.x, this.y, this.x + width, this.y + height);
    gradient.addColorStop(0, category.color);
    gradient.addColorStop(1, this.darkenColor(category.color, 0.3));
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.roundRect(this.x, this.y, width, height, 15);
    ctx.fill();
    
    // Borda dourada
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 3;
    ctx.stroke();
    
    ctx.restore();
    
    // Ícone da categoria
    ctx.save();
    ctx.font = '40px Arial';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(category.icon, this.x + 50, this.y + 50);
    ctx.restore();
    
    // Título
    ctx.fillStyle = 'white';
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('CONQUISTA DESBLOQUEADA!', this.x + 85, this.y + 25);
    
    // Nome da conquista
    ctx.font = 'bold 16px Arial';
    ctx.fillText(this.achievement.name, this.x + 85, this.y + 50);
    
    // Descrição
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.font = '12px Arial';
    ctx.fillText(this.achievement.description, this.x + 85, this.y + 70);
    
    // Recompensas
    ctx.font = 'bold 11px Arial';
    ctx.fillStyle = '#FFD700';
    let rewardText = '';
    if (this.achievement.reward.coins) rewardText += `+${this.achievement.reward.coins}💰 `;
    if (this.achievement.reward.gems) rewardText += `+${this.achievement.reward.gems}💎 `;
    if (this.achievement.reward.xp) rewardText += `+${this.achievement.reward.xp}XP`;
    ctx.fillText(rewardText, this.x + 85, this.y + 87);
  }
  
  darkenColor(color, amount) {
    const num = parseInt(color.replace("#",""), 16);
    const r = Math.max(0, (num >> 16) - amount * 255);
    const g = Math.max(0, ((num >> 8) & 0x00FF) - amount * 255);
    const b = Math.max(0, (num & 0x0000FF) - amount * 255);
    return "#" + (0x1000000 + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }
}

// ================= FUNÇÕES PRINCIPAIS =================

/**
 * Inicializa o sistema de conquistas
 */
function initAchievements() {
  achievementStats.sessionStartTime = Date.now();
  loadAchievementProgress();
}

/**
 * Atualiza estatísticas e verifica conquistas
 */
function updateAchievements(dt) {
  // Atualizar tempo de sobrevivência
  if (gameState === 'playing') {
    achievementStats.survivalTime += dt;
    achievementStats.currentSessionTime = (Date.now() - achievementStats.sessionStartTime) / 1000;
  }
  
  // Atualizar level
  achievementStats.level = level;
  
  // Atualizar fome mínima
  if (player && player.hunger < achievementStats.lowestHunger) {
    achievementStats.lowestHunger = player.hunger;
  }
  
  // Verificar todas as conquistas
  checkAllAchievements();
  
  // Atualizar notificações
  achievementNotifications = achievementNotifications.filter(notif => notif.update(dt));
}

/**
 * Verifica todas as conquistas
 */
function checkAllAchievements() {
  for (const achievement of Object.values(ACHIEVEMENTS)) {
    if (!achievement.unlocked && achievement.checkCondition(achievementStats)) {
      unlockAchievement(achievement.id);
    }
  }
}

/**
 * Desbloqueia uma conquista
 */
function unlockAchievement(achievementId) {
  const achievement = ACHIEVEMENTS[achievementId];
  
  if (!achievement || achievement.unlocked) return;
  
  achievement.unlocked = true;
  achievement.current = achievement.target;
  
  // Som
  playSFX('mission');
  
  // Criar notificação
  const notification = new AchievementNotification(achievement);
  achievementNotifications.push(notification);
  
  // Dar recompensas
  if (achievement.reward.coins) {
    coins += achievement.reward.coins;
    createScorePopup(player.x, player.y - 30, `+${achievement.reward.coins}💰`, '#FFD700');
  }
  
  if (achievement.reward.gems) {
    gems += achievement.reward.gems;
    createScorePopup(player.x, player.y - 50, `+${achievement.reward.gems}💎`, '#A855F7');
  }
  
  if (achievement.reward.xp) {
    xp += achievement.reward.xp;
    createScorePopup(player.x, player.y - 70, `+${achievement.reward.xp}XP`, '#60A5FA');
  }
  
  if (achievement.reward.unlockSkin) {
    console.log(`Skin desbloqueada: ${achievement.reward.unlockSkin}`);
    // TODO: Implementar sistema de skins
  }
  
  // Salvar progresso
  saveAchievementProgress();
  
  console.log(`🏆 Conquista desbloqueada: ${achievement.name}`);
}

/**
 * Registra que um peixe foi comido
 */
function registerFishEaten() {
  achievementStats.fishEaten++;
}

/**
 * Registra que um inimigo foi derrotado
 */
function registerEnemyDefeated() {
  achievementStats.enemiesDefeated++;
}

/**
 * Registra combo alcançado
 */
function registerCombo(comboValue) {
  if (comboValue > achievementStats.comboReached) {
    achievementStats.comboReached = comboValue;
  }
}

/**
 * Registra moeda coletada
 */
function registerCoinCollected(amount = 1) {
  achievementStats.totalCoinsCollected += amount;
}

/**
 * Registra gema coletada
 */
function registerGemCollected(amount = 1) {
  achievementStats.totalGemsCollected += amount;
}

/**
 * Registra dano recebido
 */
function registerDamageTaken() {
  achievementStats.damagesTaken++;
}

/**
 * Registra área explorada
 */
function registerAreaExplored(areaId) {
  // TODO: Implementar sistema de áreas
  achievementStats.areasExplored++;
}

/**
 * Marca jogo como completo
 */
function markGameCompleted() {
  achievementStats.gameCompleted = true;
}

// ================= DESENHO =================

/**
 * Desenha notificações de conquistas
 */
function drawAchievementNotifications(ctx) {
  achievementNotifications.forEach(notif => notif.draw(ctx));
}

/**
 * Desenha menu de conquistas
 */
function drawAchievementsMenu(ctx) {
  ctx.fillStyle = 'rgba(0,0,0,0.95)';
  ctx.fillRect(0, 0, canvas.width/dpr, canvas.height/dpr);
  
  const centerX = canvas.width/(2*dpr);
  let y = 70;
  
  // Título
  ctx.save();
  ctx.shadowColor = 'rgba(255, 215, 0, 0.6)';
  ctx.shadowBlur = 15;
  
  ctx.fillStyle = '#FFD700';
  ctx.font = 'bold 42px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('🏆 CONQUISTAS', centerX, y);
  ctx.restore();
  
  y += 60;
  
  // Estatísticas gerais
  const totalAchievements = Object.keys(ACHIEVEMENTS).length;
  const unlockedAchievements = Object.values(ACHIEVEMENTS).filter(a => a.unlocked).length;
  const percentage = Math.floor((unlockedAchievements / totalAchievements) * 100);
  
  ctx.fillStyle = 'white';
  ctx.font = 'bold 20px Arial';
  ctx.fillText(`${unlockedAchievements}/${totalAchievements} Desbloqueadas (${percentage}%)`, centerX, y);
  
  y += 40;
  
  // Barra de progresso
  const barWidth = 600;
  const barHeight = 30;
  const barX = centerX - barWidth/2;
  
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  ctx.beginPath();
  ctx.roundRect(barX, y, barWidth, barHeight, 15);
  ctx.fill();
  
  const progressGradient = ctx.createLinearGradient(barX, y, barX + barWidth, y);
  progressGradient.addColorStop(0, '#FFD700');
  progressGradient.addColorStop(1, '#FFA500');
  
  ctx.fillStyle = progressGradient;
  ctx.beginPath();
  ctx.roundRect(barX, y, barWidth * (unlockedAchievements/totalAchievements), barHeight, 15);
  ctx.fill();
  
  y += 50;
  
  // Grid de conquistas
  const columns = 3;
  const cardWidth = 220;
  const cardHeight = 140;
  const gap = 20;
  const startX = centerX - (columns * cardWidth + (columns-1) * gap) / 2;
  
  let col = 0;
  let row = 0;
  
  for (const achievement of Object.values(ACHIEVEMENTS)) {
    const x = startX + col * (cardWidth + gap);
    const cardY = y + row * (cardHeight + gap);
    
    drawAchievementCard(ctx, achievement, x, cardY, cardWidth, cardHeight);
    
    col++;
    if (col >= columns) {
      col = 0;
      row++;
    }
  }
  
  // Instruções
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.font = '15px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Pressione ESC para voltar', centerX, canvas.height/dpr - 30);
}

/**
 * Desenha card individual de conquista
 */
function drawAchievementCard(ctx, achievement, x, y, width, height) {
  const category = ACHIEVEMENT_CATEGORIES[achievement.category];
  const isLocked = !achievement.unlocked;
  
  ctx.save();
  
  // Background
  if (isLocked) {
    ctx.fillStyle = 'rgba(30, 30, 30, 0.8)';
  } else {
    const gradient = ctx.createLinearGradient(x, y, x + width, y + height);
    gradient.addColorStop(0, category.color + '40');
    gradient.addColorStop(1, category.color + '20');
    ctx.fillStyle = gradient;
  }
  
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, 10);
  ctx.fill();
  
  // Borda
  ctx.strokeStyle = isLocked ? 'rgba(100,100,100,0.5)' : category.color;
  ctx.lineWidth = 2;
  ctx.stroke();
  
  // Ícone
  ctx.font = '36px Arial';
  ctx.fillStyle = isLocked ? 'rgba(150,150,150,0.5)' : 'white';
  ctx.textAlign = 'center';
  ctx.fillText(achievement.secret && isLocked ? '❓' : category.icon, x + width/2, y + 40);
  
  // Nome
  ctx.font = 'bold 14px Arial';
  ctx.fillStyle = isLocked ? 'rgba(150,150,150,0.7)' : 'white';
  const name = achievement.secret && isLocked ? '???' : achievement.name;
  ctx.fillText(name, x + width/2, y + 65);
  
  // Descrição
  ctx.font = '11px Arial';
  ctx.fillStyle = isLocked ? 'rgba(120,120,120,0.7)' : 'rgba(255,255,255,0.8)';
  const desc = achievement.secret && isLocked ? achievement.secretCondition || '???' : achievement.description;
  wrapText(ctx, desc, x + width/2, y + 85, width - 20, 13);
  
  // Progress bar (se aplicável)
  if (!achievement.unlocked && achievement.current > 0) {
    const progressBarWidth = width - 20;
    const progressBarHeight = 6;
    const progressBarX = x + 10;
    const progressBarY = y + height - 20;
    
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.fillRect(progressBarX, progressBarY, progressBarWidth, progressBarHeight);
    
    ctx.fillStyle = category.color;
    const progress = Math.min(achievement.current / achievement.target, 1);
    ctx.fillRect(progressBarX, progressBarY, progressBarWidth * progress, progressBarHeight);
    
    // Porcentagem
    ctx.font = '10px Arial';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'right';
    ctx.fillText(`${achievement.current}/${achievement.target}`, x + width - 10, progressBarY - 3);
  }
  
  ctx.restore();
}

/**
 * Helper para quebrar texto em múltiplas linhas
 */
function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(' ');
  let line = '';
  
  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    
    if (metrics.width > maxWidth && n > 0) {
      ctx.fillText(line, x, y);
      line = words[n] + ' ';
      y += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, y);
}

// ================= PERSISTÊNCIA =================

/**
 * Salva progresso de conquistas
 */
function saveAchievementProgress() {
  const data = {
    achievements: {},
    stats: achievementStats
  };
  
  // Salvar apenas estado de desbloqueio e progresso
  for (const [id, achievement] of Object.entries(ACHIEVEMENTS)) {
    data.achievements[id] = {
      unlocked: achievement.unlocked,
      current: achievement.current
    };
  }
  
  localStorage.setItem('achievements_data', JSON.stringify(data));
}

/**
 * Carrega progresso de conquistas
 */
function loadAchievementProgress() {
  const savedData = localStorage.getItem('achievements_data');
  
  if (!savedData) return;
  
  try {
    const data = JSON.parse(savedData);
    
    // Restaurar conquistas
    for (const [id, savedAchievement] of Object.entries(data.achievements)) {
      if (ACHIEVEMENTS[id]) {
        ACHIEVEMENTS[id].unlocked = savedAchievement.unlocked;
        ACHIEVEMENTS[id].current = savedAchievement.current;
      }
    }
    
    // Restaurar estatísticas
    if (data.stats) {
      achievementStats = { ...achievementStats, ...data.stats };
    }
    
    console.log('Progresso de conquistas carregado');
  } catch (error) {
    console.error('Erro ao carregar conquistas:', error);
  }
}

/**
 * Reseta todas as conquistas (para debug)
 */
function resetAchievements() {
  for (const achievement of Object.values(ACHIEVEMENTS)) {
    achievement.unlocked = false;
    achievement.current = 0;
  }
  
  achievementStats = {
    level: 1,
    fishEaten: 0,
    enemiesDefeated: 0,
    comboReached: 0,
    totalCoinsCollected: 0,
    totalGemsCollected: 0,
    survivalTime: 0,
    lowestHunger: 100,
    damagesTaken: 0,
    gameCompleted: false,
    areasExplored: 0,
    sessionStartTime: Date.now(),
    currentSessionTime: 0
  };
  
  localStorage.removeItem('achievements_data');
  console.log('Conquistas resetadas');
}

// ================= DEBUG =================

// Disponibilizar no console para debug
if (typeof window !== 'undefined') {
  window.achievements = {
    unlock: unlockAchievement,
    reset: resetAchievements,
    list: () => {
      console.table(
        Object.values(ACHIEVEMENTS).map(a => ({
          Nome: a.name,
          Categoria: a.category,
          Desbloqueada: a.unlocked ? '✅' : '❌',
          Progresso: `${a.current}/${a.target}`
        }))
      );
    },
    stats: () => console.log(achievementStats)
  };
}
