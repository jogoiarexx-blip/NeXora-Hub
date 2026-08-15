// ================= SISTEMA DE MENU PRINCIPAL (VERSÃO MELHORADA) =================
// IMPORTANTE: Este arquivo deve ser carregado após as variáveis globais do jogo serem inicializadas

// Declare menuState globalmente se ainda não existir
if (typeof menuState === 'undefined') {
  var menuState = 'main'; // 'main', 'settings', 'credits', 'howtoplay'
}

let selectedMenuOption = 0;
let menuAnimation = 0;

// Partículas de fundo do menu
let menuParticles = [];
let menuWaves = [];

// Inicializar partículas do menu
function initMenuParticles() {
  menuParticles = [];
  for (let i = 0; i < 50; i++) {
    menuParticles.push({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: Math.random() * 3 + 1,
      vx: (Math.random() - 0.5) * 20,
      vy: Math.random() * 30 + 10,
      opacity: Math.random() * 0.5 + 0.2,
      pulsePhase: Math.random() * Math.PI * 2
    });
  }
  
  // Ondas de fundo
  menuWaves = [];
  for (let i = 0; i < 3; i++) {
    menuWaves.push({
      y: window.innerHeight * 0.6 + i * 100,
      amplitude: 30 + i * 10,
      frequency: 0.005 - i * 0.001,
      speed: 0.5 + i * 0.2,
      phase: Math.random() * Math.PI * 2,
      opacity: 0.1 - i * 0.02
    });
  }
}

// Atualizar partículas do menu
function updateMenuParticles(dt) {
  menuParticles.forEach(p => {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.pulsePhase += dt * 2;
    
    // Wrap around
    if (p.y > canvas.height/dpr + 10) {
      p.y = -10;
      p.x = Math.random() * canvas.width/dpr;
    }
    if (p.x < -10) p.x = canvas.width/dpr + 10;
    if (p.x > canvas.width/dpr + 10) p.x = -10;
  });
  
  // Atualizar ondas
  menuWaves.forEach(wave => {
    wave.phase += wave.speed * dt;
  });
}

// Desenhar partículas do menu
function drawMenuParticles(ctx) {
  // Desenhar ondas
  menuWaves.forEach(wave => {
    ctx.save();
    ctx.globalAlpha = wave.opacity;
    ctx.fillStyle = '#3b82f6';
    ctx.beginPath();
    ctx.moveTo(0, wave.y);
    
    for (let x = 0; x <= canvas.width/dpr; x += 5) {
      const y = wave.y + Math.sin(x * wave.frequency + wave.phase) * wave.amplitude;
      ctx.lineTo(x, y);
    }
    
    ctx.lineTo(canvas.width/dpr, canvas.height/dpr);
    ctx.lineTo(0, canvas.height/dpr);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  });
  
  // Desenhar partículas (bolhas)
  menuParticles.forEach(p => {
    ctx.save();
    const pulseOpacity = p.opacity + Math.sin(p.pulsePhase) * 0.1;
    ctx.globalAlpha = pulseOpacity;
    
    // Gradiente radial para bolha
    const gradient = ctx.createRadialGradient(p.x - p.r * 0.3, p.y - p.r * 0.3, 0, p.x, p.y, p.r);
    gradient.addColorStop(0, 'rgba(147, 197, 253, 0.8)');
    gradient.addColorStop(0.7, 'rgba(59, 130, 246, 0.5)');
    gradient.addColorStop(1, 'rgba(29, 78, 216, 0.2)');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
    
    // Brilho
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.beginPath();
    ctx.arc(p.x - p.r * 0.3, p.y - p.r * 0.3, p.r * 0.4, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
  });
}

// Opções do menu principal
const mainMenuOptions = [
  { text: '▶ JOGAR', action: 'start', icon: '🎮' },
  { text: '📖 COMO JOGAR', action: 'howtoplay', icon: '📚' },
  { text: '🏆 CONQUISTAS', action: 'achievements', icon: '⭐' },
  { text: '⚙️ CONFIGURAÇÕES', action: 'settings', icon: '🔧' },
  { text: '👥 CRÉDITOS', action: 'credits', icon: '🏆' }
];

// ================= NAVEGAÇÃO POR TECLADO APRIMORADA =================

// Sistema de navegação de menus de upgrade
let selectedUpgradeOption = 0;
const upgradeTypes = ['maxHunger', 'hungerDrain', 'xpBonus', 'speed', 'heal'];

// Sistema de navegação de loja
let selectedShopOption = 0;

// Sistema de navegação de missões
let selectedMissionOption = 0;

// Sistema de navegação de configurações
let selectedSettingOption = 0;
const settingOptions = [
  { key: 'audio', label: 'Áudio', type: 'toggle' },
  { key: 'musicVolume', label: 'Volume Música', type: 'slider', min: 0, max: 1, step: 0.1 },
  { key: 'sfxVolume', label: 'Volume Efeitos', type: 'slider', min: 0, max: 1, step: 0.1 },
  { key: 'particles', label: 'Partículas', type: 'toggle' },
  { key: 'screenShake', label: 'Tremor', type: 'toggle' },
  { key: 'reset', label: 'RESETAR SAVE', type: 'button' }
];

// Sistema de navegação do menu de pause
let selectedPauseOption = 0;

/**
 * Navega entre opções do menu ativo
 */
function navigateMenu(direction) {
  if (gameState === 'paused') {
    navigatePauseMenu(direction);
    return;
  }
  
  if (gameState !== 'menu') {
    if (upgradeMenu) {
      navigateUpgradeMenu(direction);
    } else if (shopMenu) {
      navigateShopMenu(direction);
    } else if (missionsMenu) {
      navigateMissionsMenu(direction);
    }
    return;
  }
  
  if (menuState === 'main') {
    playSFX('eat');
    if (direction === 'up') {
      selectedMenuOption = (selectedMenuOption - 1 + mainMenuOptions.length) % mainMenuOptions.length;
    } else if (direction === 'down') {
      selectedMenuOption = (selectedMenuOption + 1) % mainMenuOptions.length;
    }
  } else if (menuState === 'settings') {
    navigateSettingsMenu(direction);
  }
}

function navigatePauseMenu(direction) {
  playSFX('eat');
  const pauseOptionsCount = 3;
  
  if (direction === 'up') {
    selectedPauseOption = (selectedPauseOption - 1 + pauseOptionsCount) % pauseOptionsCount;
  } else if (direction === 'down') {
    selectedPauseOption = (selectedPauseOption + 1) % pauseOptionsCount;
  }
}

function navigateUpgradeMenu(direction) {
  playSFX('eat');
  if (direction === 'up') {
    selectedUpgradeOption = (selectedUpgradeOption - 1 + upgradeTypes.length) % upgradeTypes.length;
  } else if (direction === 'down') {
    selectedUpgradeOption = (selectedUpgradeOption + 1) % upgradeTypes.length;
  }
}

function navigateShopMenu(direction) {
  playSFX('eat');
  const availableItems = shopItems.slice(0, 4);
  if (direction === 'up') {
    selectedShopOption = (selectedShopOption - 1 + availableItems.length) % availableItems.length;
  } else if (direction === 'down') {
    selectedShopOption = (selectedShopOption + 1) % availableItems.length;
  }
}

function navigateMissionsMenu(direction) {
  playSFX('eat');
  if (direction === 'up') {
    selectedMissionOption = (selectedMissionOption - 1 + dailyMissions.length) % dailyMissions.length;
  } else if (direction === 'down') {
    selectedMissionOption = (selectedMissionOption + 1) % dailyMissions.length;
  }
}

function navigateSettingsMenu(direction) {
  playSFX('eat');
  
  if (direction === 'up') {
    selectedSettingOption = (selectedSettingOption - 1 + settingOptions.length) % settingOptions.length;
  } else if (direction === 'down') {
    selectedSettingOption = (selectedSettingOption + 1) % settingOptions.length;
  } else if (direction === 'left' || direction === 'right') {
    const setting = settingOptions[selectedSettingOption];
    if (setting.type === 'slider') {
      const delta = direction === 'right' ? setting.step : -setting.step;
      if (setting.key === 'musicVolume') {
        musicVolume = Math.max(setting.min, Math.min(setting.max, musicVolume + delta));
        if (musicGain) musicGain.gain.value = musicVolume;
        settingsOptions.musicVolume = musicVolume;
      } else if (setting.key === 'sfxVolume') {
        sfxVolume = Math.max(setting.min, Math.min(setting.max, sfxVolume + delta));
        if (sfxGain) sfxGain.gain.value = sfxVolume;
        settingsOptions.sfxVolume = sfxVolume;
        playSFX('coin');
      }
      saveSettings();
    }
  }
}

function confirmMenuSelection() {
  if (gameState === 'paused') {
    confirmPauseSelection();
    return;
  }
  
  if (gameState === 'menu') {
    if (menuState === 'main') {
      selectMenuOption();
    } else if (menuState === 'settings') {
      confirmSettingSelection();
    }
  } else if (gameState === 'playing') {
    if (upgradeMenu) {
      buyUpgrade(upgradeTypes[selectedUpgradeOption]);
    } else if (shopMenu) {
      const item = shopItems[selectedShopOption];
      if (item) buyShopItem(item.id);
    } else if (missionsMenu) {
      claimMissionReward(selectedMissionOption);
    }
  }
}

function confirmPauseSelection() {
  playSFX('mission');
  
  switch(selectedPauseOption) {
    case 0:
      togglePause();
      break;
    case 1:
      toggleAudio();
      break;
    case 2:
      if (confirm('Deseja voltar ao menu principal? Seu progresso será salvo.')) {
        saveGame();
        returnToMenu();
      }
      break;
  }
}

function confirmSettingSelection() {
  const setting = settingOptions[selectedSettingOption];
  
  switch(setting.key) {
    case 'audio':
      toggleAudio();
      break;
    case 'particles':
      settingsOptions.particles = !settingsOptions.particles;
      saveSettings();
      playSFX('eat');
      break;
    case 'screenShake':
      settingsOptions.screenShake = !settingsOptions.screenShake;
      saveSettings();
      playSFX('eat');
      break;
    case 'reset':
      if (confirm('Tem certeza que deseja resetar todo o progresso?')) {
        resetSave();
      }
      break;
  }
}

let settingsOptions = {
  musicVolume: 0.3,
  sfxVolume: 0.5,
  particles: true,
  screenShake: true
};

function saveSettings() {
  localStorage.setItem('game_settings', JSON.stringify({
    musicVolume,
    sfxVolume,
    particles: settingsOptions.particles,
    screenShake: settingsOptions.screenShake
  }));
}

function selectMenuOption() {
  if (gameState !== 'menu') return;
  
  playSFX('mission');
  const option = mainMenuOptions[selectedMenuOption];
  
  switch(option.action) {
    case 'start':
      startGame();
      break;
    case 'howtoplay':
      menuState = 'howtoplay';
      break;
    case 'achievements':
      menuState = 'achievements';
      break;
    case 'settings':
      menuState = 'settings';
      selectedSettingOption = 0;
      break;
    case 'credits':
      menuState = 'credits';
      break;
  }
}

function startGame() {
  const hasSave = localStorage.getItem(CONFIG.SAVE_KEY) !== null;

  // O save guarda progressão/economia; cada partida precisa começar viva e limpa.
  if (!hasSave) {
    level = 1;
    xp = 0;
    xpToNext = CONFIG.INITIAL_XP_TO_NEXT;
    upgradePoints = 0;
    upgrades = { maxHunger: 0, hungerDrain: 0, xpBonus: 0, speed: 0, heal: 0 };
    coins = 0;
    gems = 0;
  }

  if (!player) initPlayer();
  player.hunger = player.maxHunger || CONFIG.PLAYER_INITIAL_HUNGER;
  player.x = (typeof mapSystem !== 'undefined' && mapSystem) ? mapSystem.width / 2 : canvas.width / (2 * dpr);
  player.y = (typeof mapSystem !== 'undefined' && mapSystem) ? mapSystem.height / 2 : canvas.height / (2 * dpr);
  player.velocity.x = 0;
  player.velocity.y = 0;
  player.dashActive = false;
  player.dashCooldown = 0;
  player.isStunned = false;
  player.damageFlash = 0;
  player.speedBuff = null;
  player.strengthBuff = null;
  player.gemBuff = null;
  player.xpBuff = null;

  // Limpa apenas a run, sem apagar evolução, moedas ou conquistas.
  if (typeof clearAllGameObjects === 'function') clearAllGameObjects();
  else {
    fishes = []; enemies = []; floatingCoins = []; floatingGems = [];
    particles = []; bloodParticles = []; scorePopups = [];
  }
  combo = 0;
  comboTimer = 0;
  comboMultiplier = 1;
  if (typeof V4 !== 'undefined') V4.resetRun();
  missionStats = { fishEaten: 0, enemiesDefeated: 0, comboReached: 0 };

  if (typeof camera !== 'undefined' && camera) {
    camera.setTarget(player);
    camera.x = player.x - camera.width / 2;
    camera.y = player.y - camera.height / 2;
  }

  gameState = 'playing';
  lastTime = performance.now();
  lastFishSpawn = lastTime - CONFIG.FISH_SPAWN_INTERVAL; // já entra com vida no oceano
  lastEnemySpawn = lastTime;

  // Pequeno cardume inicial evita começo vazio.
  for (let i = 0; i < 18; i++) spawnFish();

  if (audioEnabled && !musicPlaying) startMusic();
}

// ================= DESENHO DOS MENUS (VERSÃO MELHORADA) =================

function drawMainMenu() {
  menuAnimation += 0.016;
  
  // Fundo com gradiente animado
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height/dpr);
  gradient.addColorStop(0, '#0a1929');
  gradient.addColorStop(0.5, '#1a3a52');
  gradient.addColorStop(1, '#2a4a62');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width/dpr, canvas.height/dpr);
  
  // Partículas de fundo
  drawMenuParticles(ctx);
  
  const centerX = canvas.width/(2*dpr);
  
  // Logo do jogo com sombra e brilho
  ctx.save();
  ctx.shadowColor = 'rgba(59, 130, 246, 0.8)';
  ctx.shadowBlur = 30;
  ctx.shadowOffsetY = 5;
  
  const titleY = 120 + Math.sin(menuAnimation) * 10;
  
  // Título com gradiente
  const titleGradient = ctx.createLinearGradient(0, titleY - 50, 0, titleY + 50);
  titleGradient.addColorStop(0, '#60a5fa');
  titleGradient.addColorStop(0.5, '#3b82f6');
  titleGradient.addColorStop(1, '#2563eb');
  
  ctx.fillStyle = titleGradient;
  ctx.font = 'bold 64px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('🦈 HUNGRY SHARK', centerX, titleY);
  ctx.restore();
  
  // Subtítulo
  ctx.fillStyle = 'rgba(147, 197, 253, 0.8)';
  ctx.font = '20px Arial';
  ctx.fillText('Sobreviva no Oceano', centerX, titleY + 40);
  
  // Opções do menu com cards
  const menuStartY = 260;
  const menuSpacing = 80;
  const cardWidth = 380;
  const cardHeight = 65;
  
  mainMenuOptions.forEach((option, i) => {
    const isSelected = i === selectedMenuOption;
    const cardY = menuStartY + i * menuSpacing;
    const cardX = centerX - cardWidth/2;
    
    // Animação de hover
    const hoverOffset = isSelected ? Math.sin(menuAnimation * 3) * 3 : 0;
    const scale = isSelected ? 1.05 : 1;
    
    ctx.save();
    ctx.translate(centerX, cardY + cardHeight/2);
    ctx.scale(scale, scale);
    ctx.translate(-centerX, -(cardY + cardHeight/2));
    
    // Sombra do card
    if (isSelected) {
      ctx.shadowColor = 'rgba(59, 130, 246, 0.6)';
      ctx.shadowBlur = 20;
      ctx.shadowOffsetY = 5;
    }
    
    // Background do card com gradiente
    const cardGradient = ctx.createLinearGradient(cardX, cardY, cardX + cardWidth, cardY + cardHeight);
    if (isSelected) {
      cardGradient.addColorStop(0, 'rgba(59, 130, 246, 0.4)');
      cardGradient.addColorStop(1, 'rgba(37, 99, 235, 0.4)');
    } else {
      cardGradient.addColorStop(0, 'rgba(30, 58, 138, 0.3)');
      cardGradient.addColorStop(1, 'rgba(30, 64, 175, 0.3)');
    }
    
    ctx.fillStyle = cardGradient;
    ctx.beginPath();
    ctx.roundRect(cardX, cardY + hoverOffset, cardWidth, cardHeight, 12);
    ctx.fill();
    
    // Borda do card
    ctx.strokeStyle = isSelected ? '#60a5fa' : 'rgba(96, 165, 250, 0.4)';
    ctx.lineWidth = isSelected ? 3 : 2;
    ctx.stroke();
    
    // Brilho interno
    if (isSelected) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.beginPath();
      ctx.roundRect(cardX + 2, cardY + 2 + hoverOffset, cardWidth - 4, cardHeight/2, 10);
      ctx.fill();
    }
    
    // Ícone
    ctx.fillStyle = isSelected ? '#93c5fd' : 'rgba(147, 197, 253, 0.7)';
    ctx.font = '32px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(option.icon, cardX + 25, cardY + cardHeight/2 + 12 + hoverOffset);
    
    // Texto
    ctx.fillStyle = isSelected ? 'white' : 'rgba(255, 255, 255, 0.8)';
    ctx.font = isSelected ? 'bold 24px Arial' : '22px Arial';
    ctx.fillText(option.text, cardX + 75, cardY + cardHeight/2 + 10 + hoverOffset);
    
    // Indicador de seleção
    if (isSelected) {
      ctx.fillStyle = '#60a5fa';
      ctx.fillText('›', cardX + cardWidth - 40, cardY + cardHeight/2 + 10 + hoverOffset);
    }
    
    ctx.restore();
  });
  
  // Rodapé com versão
  ctx.fillStyle = 'rgba(148, 163, 184, 0.6)';
  ctx.font = '14px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('v1.0.0 • Use ↑↓ para navegar • Enter para selecionar', centerX, canvas.height/dpr - 25);
}

function drawHowToPlay() {
  ctx.fillStyle = 'rgba(0,0,0,0.95)';
  ctx.fillRect(0, 0, canvas.width/dpr, canvas.height/dpr);
  
  const centerX = canvas.width/(2*dpr);
  let y = 70;
  
  // Título com estilo
  ctx.save();
  ctx.shadowColor = 'rgba(59, 130, 246, 0.6)';
  ctx.shadowBlur = 15;
  
  ctx.fillStyle = '#60a5fa';
  ctx.font = 'bold 42px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('📚 COMO JOGAR', centerX, y);
  ctx.restore();
  
  y += 70;
  
  // Instruções em cards
  const instructions = [
    { icon: '🎮', title: 'CONTROLES', text: 'WASD/Setas para mover • Shift/Espaço: dash' },
    { icon: '🐟', title: 'OBJETIVO', text: 'Coma peixes menores para crescer' },
    { icon: '⚠️', title: 'CUIDADO', text: 'Evite peixes maiores que você!' },
    { icon: '❤️', title: 'FOME', text: 'Mantenha sua barra de fome cheia' },
    { icon: '⭐', title: 'LEVEL UP', text: 'Ganhe XP e evolua seu tubarão' },
    { icon: '💰', title: 'MOEDAS', text: 'Colete moedas para comprar upgrades' }
  ];
  
  const cardWidth = Math.min(500, canvas.width/dpr - 30);
  const cardHeight = 70;
  const cardX = centerX - cardWidth/2;
  
  instructions.forEach((inst, i) => {
    const cardY = y + i * 85;
    
    // Card
    ctx.fillStyle = 'rgba(30, 58, 138, 0.4)';
    ctx.beginPath();
    ctx.roundRect(cardX, cardY, cardWidth, cardHeight, 10);
    ctx.fill();
    
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Ícone
    ctx.font = '28px Arial';
    ctx.fillStyle = '#60a5fa';
    ctx.textAlign = 'left';
    ctx.fillText(inst.icon, cardX + 20, cardY + 28);
    
    // Título
    ctx.font = 'bold 18px Arial';
    ctx.fillStyle = '#93c5fd';
    ctx.fillText(inst.title, cardX + 70, cardY + 28);
    
    // Texto
    ctx.font = '16px Arial';
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.fillText(inst.text, cardX + 70, cardY + 52);
  });
  
  // Rodapé
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.font = '16px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Pressione ESC ou clique para voltar', centerX, canvas.height/dpr - 30);
}

function drawSettings() {
  ctx.fillStyle = 'rgba(0,0,0,0.95)';
  ctx.fillRect(0, 0, canvas.width/dpr, canvas.height/dpr);
  
  const centerX = canvas.width/(2*dpr);
  let y = 70;
  
  // Título
  ctx.save();
  ctx.shadowColor = 'rgba(59, 130, 246, 0.6)';
  ctx.shadowBlur = 15;
  
  ctx.fillStyle = '#60a5fa';
  ctx.font = 'bold 42px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('⚙️ CONFIGURAÇÕES', centerX, y);
  ctx.restore();
  
  y += 85;
  
  ctx.textAlign = 'left';
  const leftMargin = centerX - 280;
  
  settingOptions.forEach((setting, i) => {
    const isSelected = i === selectedSettingOption;
    const itemY = y + i * 75;
    
    // Card de configuração
    if (isSelected) {
      ctx.save();
      ctx.shadowColor = 'rgba(59, 130, 246, 0.5)';
      ctx.shadowBlur = 15;
      
      ctx.fillStyle = 'rgba(59, 130, 246, 0.25)';
      ctx.beginPath();
      ctx.roundRect(leftMargin - 15, itemY - 35, 560, 60, 10);
      ctx.fill();
      
      ctx.strokeStyle = '#60a5fa';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
    }
    
    // Label
    ctx.fillStyle = isSelected ? '#93c5fd' : 'white';
    ctx.font = isSelected ? 'bold 22px Arial' : '20px Arial';
    
    switch(setting.type) {
      case 'toggle':
        let value;
        if (setting.key === 'audio') value = audioEnabled;
        else if (setting.key === 'particles') value = settingsOptions.particles;
        else if (setting.key === 'screenShake') value = settingsOptions.screenShake;
        
        ctx.fillText(`${setting.label}:`, leftMargin, itemY);
        
        // Toggle visual bonito
        const toggleX = leftMargin + 280;
        const toggleWidth = 70;
        const toggleHeight = 30;
        
        // Background do toggle
        ctx.fillStyle = value ? 'rgba(34, 197, 94, 0.3)' : 'rgba(100, 100, 100, 0.3)';
        ctx.beginPath();
        ctx.roundRect(toggleX, itemY - 20, toggleWidth, toggleHeight, 15);
        ctx.fill();
        
        // Borda
        ctx.strokeStyle = value ? '#22c55e' : '#6b7280';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Botão do toggle
        const buttonX = value ? toggleX + toggleWidth - 26 : toggleX + 6;
        ctx.fillStyle = value ? '#22c55e' : '#9ca3af';
        ctx.beginPath();
        ctx.arc(buttonX, itemY - 5, 12, 0, Math.PI * 2);
        ctx.fill();
        
        // Texto do status
        ctx.fillStyle = value ? '#22c55e' : '#9ca3af';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'right';
        ctx.fillText(value ? 'ON' : 'OFF', toggleX + toggleWidth + 50, itemY);
        ctx.textAlign = 'left';
        
        if (isSelected) {
          ctx.fillStyle = 'rgba(255,255,255,0.5)';
          ctx.font = '13px Arial';
          ctx.fillText('[Enter]', toggleX + toggleWidth + 65, itemY);
        }
        break;
        
      case 'slider':
        const sliderValue = setting.key === 'musicVolume' ? musicVolume : sfxVolume;
        ctx.fillText(`${setting.label}:`, leftMargin, itemY);
        
        // Barra de slider moderna
        const sliderX = leftMargin + 280;
        const sliderWidth = 180;
        const sliderHeight = 24;
        
        // Background
        ctx.fillStyle = 'rgba(55, 65, 81, 0.6)';
        ctx.beginPath();
        ctx.roundRect(sliderX, itemY - 17, sliderWidth, sliderHeight, 12);
        ctx.fill();
        
        // Preenchimento
        const fillGradient = ctx.createLinearGradient(sliderX, itemY, sliderX + sliderWidth, itemY);
        fillGradient.addColorStop(0, '#3b82f6');
        fillGradient.addColorStop(1, '#60a5fa');
        
        ctx.fillStyle = fillGradient;
        ctx.beginPath();
        ctx.roundRect(sliderX + 2, itemY - 15, (sliderWidth - 4) * sliderValue, sliderHeight - 4, 10);
        ctx.fill();
        
        // Handle
        const handleX = sliderX + (sliderWidth * sliderValue);
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(handleX, itemY - 5, 10, 0, Math.PI * 2);
        ctx.fill();
        
        if (isSelected) {
          ctx.strokeStyle = '#60a5fa';
          ctx.lineWidth = 2;
          ctx.stroke();
        }
        
        // Percentual
        ctx.fillStyle = isSelected ? 'white' : 'rgba(255,255,255,0.7)';
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'right';
        ctx.fillText(`${Math.floor(sliderValue * 100)}%`, sliderX + sliderWidth + 45, itemY);
        ctx.textAlign = 'left';
        
        if (isSelected) {
          ctx.fillStyle = 'rgba(255,255,255,0.5)';
          ctx.font = '13px Arial';
          ctx.fillText('[← →]', sliderX + sliderWidth + 55, itemY);
        }
        break;
        
      case 'button':
        const resetButtonX = centerX - 170;
        const resetButtonY = itemY - 30;
        const resetButtonWidth = 340;
        const resetButtonHeight = 55;
        
        // Botão de reset estilizado
        const buttonGradient = ctx.createLinearGradient(resetButtonX, resetButtonY, resetButtonX, resetButtonY + resetButtonHeight);
        if (isSelected) {
          buttonGradient.addColorStop(0, '#dc2626');
          buttonGradient.addColorStop(1, '#b91c1c');
        } else {
          buttonGradient.addColorStop(0, '#ef4444');
          buttonGradient.addColorStop(1, '#dc2626');
        }
        
        ctx.fillStyle = buttonGradient;
        ctx.beginPath();
        ctx.roundRect(resetButtonX, resetButtonY, resetButtonWidth, resetButtonHeight, 10);
        ctx.fill();
        
        if (isSelected) {
          ctx.strokeStyle = '#fca5a5';
          ctx.lineWidth = 3;
          ctx.stroke();
        }
        
        ctx.fillStyle = 'white';
        ctx.font = 'bold 22px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`🗑️ ${setting.label}`, centerX, resetButtonY + 35);
        
        if (isSelected) {
          ctx.fillStyle = 'rgba(255,255,255,0.7)';
          ctx.font = '14px Arial';
          ctx.fillText('[Enter para confirmar]', centerX, resetButtonY + 65);
        }
        ctx.textAlign = 'left';
        break;
    }
  });
  
  // Instruções
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.font = '15px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('↑↓ navegar • ← → ajustar • Enter selecionar • ESC voltar', centerX, canvas.height/dpr - 30);
}

function drawCredits() {
  ctx.fillStyle = 'rgba(0,0,0,0.95)';
  ctx.fillRect(0, 0, canvas.width/dpr, canvas.height/dpr);
  
  const centerX = canvas.width/(2*dpr);
  let y = 70;
  
  // Título
  ctx.save();
  ctx.shadowColor = 'rgba(59, 130, 246, 0.6)';
  ctx.shadowBlur = 15;
  
  ctx.fillStyle = '#60a5fa';
  ctx.font = 'bold 42px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('🏆 CRÉDITOS', centerX, y);
  ctx.restore();
  
  y += 80;
  
  const credits = [
    { title: '🎮 DESENVOLVIMENTO', name: 'Claude AI & Desenvolvedor' },
    { title: '🎨 DESIGN', name: 'Sistema de Design Modular' },
    { title: '🎵 ÁUDIO', name: 'Web Audio API Procedural' },
    { title: '💻 TECNOLOGIA', name: 'JavaScript Vanilla + HTML5 Canvas' }
  ];
  
  const cardWidth = Math.min(500, canvas.width/dpr - 30);
  const cardX = centerX - cardWidth/2;
  
  credits.forEach((credit, i) => {
    const cardY = y + i * 85;
    
    // Card
    ctx.fillStyle = 'rgba(30, 58, 138, 0.4)';
    ctx.beginPath();
    ctx.roundRect(cardX, cardY, cardWidth, 70, 10);
    ctx.fill();
    
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Título
    ctx.fillStyle = '#60a5fa';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(credit.title, cardX + 20, cardY + 28);
    
    // Nome
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.font = '18px Arial';
    ctx.fillText(credit.name, cardX + 20, cardY + 52);
  });
  
  y += 360;
  
  // Agradecimento
  ctx.fillStyle = '#60a5fa';
  ctx.font = 'bold 28px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('🙏 OBRIGADO POR JOGAR!', centerX, y);
  
  y += 50;
  
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.font = '17px Arial';
  ctx.fillText('Este jogo foi criado com JavaScript puro', centerX, y);
  y += 28;
  ctx.fillText('Sem bibliotecas externas - 100% vanilla!', centerX, y);
  
  // Rodapé
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.font = '15px Arial';
  ctx.fillText('Pressione ESC para voltar', centerX, canvas.height/dpr - 30);
}

function drawGameOver() {
  ctx.fillStyle = 'rgba(0,0,0,0.92)';
  ctx.fillRect(0, 0, canvas.width/dpr, canvas.height/dpr);
  
  const centerX = canvas.width/(2*dpr);
  const centerY = canvas.height/(2*dpr);
  
  // Título com efeito
  ctx.save();
  ctx.shadowColor = 'rgba(239, 68, 68, 0.8)';
  ctx.shadowBlur = 25;
  
  const titleGradient = ctx.createLinearGradient(0, centerY - 130, 0, centerY - 70);
  titleGradient.addColorStop(0, '#ef4444');
  titleGradient.addColorStop(1, '#dc2626');
  
  ctx.fillStyle = titleGradient;
  ctx.font = 'bold 76px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('GAME OVER', centerX, centerY - 80);
  ctx.restore();
  
  // Stats em cards
  const stats = [
    { label: 'Level Alcançado', value: level, icon: '⭐' },
    { label: 'Peixes Comidos', value: missionStats.fishEaten, icon: '🐟' },
    { label: 'Maior Combo', value: `x${missionStats.comboReached}`, icon: '🔥' }
  ];
  
  stats.forEach((stat, i) => {
    const statY = centerY - 10 + i * 50;
    
    ctx.fillStyle = 'rgba(30, 58, 138, 0.4)';
    ctx.beginPath();
    ctx.roundRect(centerX - 200, statY - 25, 400, 45, 8);
    ctx.fill();
    
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.4)';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    ctx.font = '22px Arial';
    ctx.fillStyle = '#93c5fd';
    ctx.textAlign = 'left';
    ctx.fillText(`${stat.icon} ${stat.label}:`, centerX - 180, statY + 5);
    
    ctx.fillStyle = 'white';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'right';
    ctx.fillText(stat.value, centerX + 180, statY + 5);
  });
  
  // Botão voltar
  const buttonY = centerY + 140;
  const buttonGradient = ctx.createLinearGradient(0, buttonY, 0, buttonY + 55);
  buttonGradient.addColorStop(0, '#3b82f6');
  buttonGradient.addColorStop(1, '#2563eb');
  
  ctx.fillStyle = buttonGradient;
  ctx.beginPath();
  ctx.roundRect(centerX - 170, buttonY, 340, 55, 10);
  ctx.fill();
  
  ctx.strokeStyle = '#60a5fa';
  ctx.lineWidth = 3;
  ctx.stroke();
  
  ctx.fillStyle = 'white';
  ctx.font = 'bold 24px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('VOLTAR AO MENU', centerX, buttonY + 35);
  
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.font = '15px Arial';
  ctx.fillText('Pressione Enter ou clique', centerX, buttonY + 80);
}

function drawPauseMenu() {
  ctx.fillStyle = 'rgba(0,0,0,0.85)';
  ctx.fillRect(0, 0, canvas.width/dpr, canvas.height/dpr);
  
  const centerX = canvas.width/(2*dpr);
  const centerY = canvas.height/(2*dpr);
  
  // Título
  ctx.save();
  ctx.shadowColor = 'rgba(59, 130, 246, 0.6)';
  ctx.shadowBlur = 15;
  
  ctx.fillStyle = '#60a5fa';
  ctx.font = 'bold 52px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('⏸️ PAUSADO', centerX, centerY - 130);
  ctx.restore();
  
  const pauseOptions = [
    { text: 'Continuar', key: 'ESC', icon: '▶️' },
    { text: `Áudio: ${audioEnabled ? 'LIGADO' : 'DESLIGADO'}`, key: 'A', icon: '🔊' },
    { text: 'Voltar ao Menu', key: 'M', icon: '🏠' }
  ];
  
  const cardWidth = 480;
  const cardHeight = 60;
  
  pauseOptions.forEach((option, i) => {
    const isSelected = i === selectedPauseOption;
    const cardY = centerY - 50 + i * 75;
    const cardX = centerX - cardWidth/2;
    
    // Card da opção
    ctx.save();
    if (isSelected) {
      ctx.shadowColor = 'rgba(59, 130, 246, 0.5)';
      ctx.shadowBlur = 15;
    }
    
    const cardGradient = ctx.createLinearGradient(cardX, cardY, cardX + cardWidth, cardY);
    if (isSelected) {
      cardGradient.addColorStop(0, 'rgba(59, 130, 246, 0.4)');
      cardGradient.addColorStop(1, 'rgba(37, 99, 235, 0.4)');
    } else {
      cardGradient.addColorStop(0, 'rgba(30, 58, 138, 0.3)');
      cardGradient.addColorStop(1, 'rgba(30, 64, 175, 0.3)');
    }
    
    ctx.fillStyle = cardGradient;
    ctx.beginPath();
    ctx.roundRect(cardX, cardY, cardWidth, cardHeight, 10);
    ctx.fill();
    
    ctx.strokeStyle = isSelected ? '#60a5fa' : 'rgba(59, 130, 246, 0.4)';
    ctx.lineWidth = isSelected ? 3 : 2;
    ctx.stroke();
    ctx.restore();
    
    // Ícone
    ctx.font = '28px Arial';
    ctx.fillStyle = isSelected ? '#93c5fd' : 'rgba(147, 197, 253, 0.7)';
    ctx.textAlign = 'left';
    ctx.fillText(option.icon, cardX + 25, cardY + 40);
    
    // Texto
    ctx.fillStyle = isSelected ? 'white' : 'rgba(255, 255, 255, 0.8)';
    ctx.font = isSelected ? 'bold 22px Arial' : '20px Arial';
    ctx.fillText(option.text, cardX + 75, cardY + 38);
    
    // Tecla
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = '16px Arial';
    ctx.textAlign = 'right';
    ctx.fillText(`(${option.key})`, cardX + cardWidth - 20, cardY + 38);
  });
  
  // Stats
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.font = '17px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(`Level ${level} • ${Math.floor(player.hunger)}/${player.maxHunger} Fome • ${coins} 💰`, centerX, centerY + 200);
  
  // Instruções
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.font = '15px Arial';
  ctx.fillText('↑↓ para navegar • Enter para selecionar', centerX, centerY + 230);
}

function handleMenuClick(x, y) {
  if (gameState === 'menu' && menuState === 'main') {
    const menuStartY = 260;
    const menuSpacing = 80;
    const cardWidth = 380;
    const cardHeight = 65;
    const centerX = canvas.width/(2*dpr);
    
    mainMenuOptions.forEach((option, i) => {
      const cardY = menuStartY + i * menuSpacing;
      const cardX = centerX - cardWidth/2;
      
      if (x >= cardX && x <= cardX + cardWidth &&
          y >= cardY && y <= cardY + cardHeight) {
        selectedMenuOption = i;
        selectMenuOption();
      }
    });
  } else if (gameState === 'gameover') {
    const centerX = canvas.width/(2*dpr);
    const centerY = canvas.height/(2*dpr);
    
    if (x >= centerX - 170 && x <= centerX + 170 &&
        y >= centerY + 140 && y <= centerY + 195) {
      returnToMenu();
    }
  }
}

// Inicializar partículas ao carregar
if (typeof window !== 'undefined') {
  initMenuParticles();
}
