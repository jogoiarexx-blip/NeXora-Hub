// ================= INICIALIZAÇÃO DO CANVAS =================
canvas = document.getElementById("game");
ctx = canvas.getContext("2d");

dpr = Math.min(window.devicePixelRatio || 1, CONFIG.MAX_DPR);
canvas.width = window.innerWidth * dpr;
canvas.height = window.innerHeight * dpr;
canvas.style.width = window.innerWidth + 'px';
canvas.style.height = window.innerHeight + 'px';
ctx.scale(dpr, dpr);

// ================= CONTROLES DE TOUCH =================
let joystickCenter = {x: 0, y: 0};
let joystickActive = false;

const joystick = document.getElementById('joystick');
const joystickHandle = document.getElementById('joystick-handle');

canvas.addEventListener('touchstart', handleTouchStart, {passive: false});
canvas.addEventListener('touchmove', handleTouchMove, {passive: false});
canvas.addEventListener('touchend', handleTouchEnd, {passive: false});

canvas.addEventListener('click', (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  
  // Cliques no menu
  if (gameState === 'menu' || gameState === 'gameover' || menuState !== 'main') {
    handleMenuClick(x, y);
    return;
  }
  
  if (missionsMenu) {
    dailyMissions.forEach((mission, i) => {
      const centerX = canvas.width/(2*dpr);
      const centerY = canvas.height/(2*dpr);
      const yPos = centerY - 120 + i * 110;
      
      if (x >= centerX - 180 && x <= centerX + 180 &&
         y >= yPos && y <= yPos + 90) {
        claimMissionReward(i);
      }
    });
  }
  
  if (shopMenu) {
    const shopWidth = 450;
    const shopHeight = 500;
    const shopX = canvas.width/(2*dpr) - shopWidth/2;
    const shopY = canvas.height/(2*dpr) - shopHeight/2;
    const itemsStartY = shopY + 100;
    const itemHeight = 90;
    
    shopItems.slice(0, 4).forEach((item, i) => {
      const itemY = itemsStartY + i * itemHeight;
      
      if (x >= shopX + 20 && x <= shopX + shopWidth - 20 &&
         y >= itemY && y <= itemY + itemHeight - 10) {
        buyShopItem(item.id);
      }
    });
  }
});

function handleTouchStart(e) {
  e.preventDefault();
  const touch = e.touches[0];
  if (touch.clientX < window.innerWidth / 2) {
    joystickActive = true;
    joystick.style.display = 'block';
    joystick.style.left = (touch.clientX - 60) + 'px';
    joystick.style.top = (touch.clientY - 60) + 'px';
    joystickCenter = {x: touch.clientX, y: touch.clientY};
  }
}

function handleTouchMove(e) {
  e.preventDefault();
  if (!joystickActive) return;
  const touch = e.touches[0];
  const dx = touch.clientX - joystickCenter.x;
  const dy = touch.clientY - joystickCenter.y;
  const distance = Math.sqrt(dx*dx + dy*dy);
  const maxDistance = 35;
  
  if (distance > 0) {
    const angle = Math.atan2(dy, dx);
    const clampedDistance = Math.min(distance, maxDistance);
    touchInput.x = Math.cos(angle);
    touchInput.y = Math.sin(angle);
    touchInput.active = true;
    
    const handleX = Math.cos(angle) * clampedDistance;
    const handleY = Math.sin(angle) * clampedDistance;
    joystickHandle.style.transform = `translate(calc(-50% + ${handleX}px), calc(-50% + ${handleY}px))`;
  }
}

function handleTouchEnd(e) {
  e.preventDefault();
  joystickActive = false;
  touchInput.active = false;
  touchInput.x = 0;
  touchInput.y = 0;
  joystick.style.display = 'none';
  joystickHandle.style.transform = 'translate(-50%, -50%)';
}

// Botões de UI mobile
document.getElementById('btn-shop').addEventListener('touchstart', (e) => {
  e.preventDefault();
  shopMenu = !shopMenu;
  if (shopMenu) {
    missionsMenu = false;
    upgradeMenu = false;
  }
});

document.getElementById('btn-missions').addEventListener('touchstart', (e) => {
  e.preventDefault();
  missionsMenu = !missionsMenu;
  if (missionsMenu) {
    upgradeMenu = false;
    shopMenu = false;
  }
});

document.getElementById('btn-upgrade').addEventListener('touchstart', (e) => {
  e.preventDefault();
  upgradeMenu = !upgradeMenu;
  if (upgradeMenu) {
    missionsMenu = false;
    shopMenu = false;
  }
});

const dashButton = document.getElementById('btn-dash');
const pauseButton = document.getElementById('btn-pause');

function triggerMobileDash(e) {
  if (e) e.preventDefault();
  if (gameState === 'playing' && player && player.canDash()) {
    player.activateDash();
    triggerShake(4, 0.12);
  }
}

dashButton.addEventListener('touchstart', triggerMobileDash, {passive:false});
dashButton.addEventListener('pointerdown', (e) => {
  if (e.pointerType !== 'touch') triggerMobileDash(e);
});
pauseButton.addEventListener('touchstart', (e) => { e.preventDefault(); togglePause(); }, {passive:false});
pauseButton.addEventListener('pointerdown', (e) => {
  if (e.pointerType !== 'touch') { e.preventDefault(); togglePause(); }
});

// ================= CONTROLES DE TECLADO =================
addEventListener("keydown", e => {
  keys[e.key] = true;
  
  // Navegação do menu
  if (gameState === 'menu') {
    if (e.key === 'ArrowUp' || e.key === 'w') {
      navigateMenu('up');
      e.preventDefault();
    }
    if (e.key === 'ArrowDown' || e.key === 's') {
      navigateMenu('down');
      e.preventDefault();
    }
    if (e.key === 'ArrowLeft' || e.key === 'a') {
      navigateMenu('left');
      e.preventDefault();
    }
    if (e.key === 'ArrowRight' || e.key === 'd') {
      navigateMenu('right');
      e.preventDefault();
    }
    if (e.key === 'Enter' || e.key === 'e' || e.key === ' ') {
      confirmMenuSelection();
      e.preventDefault();
    }
    if (e.key === 'Escape' && menuState !== 'main') {
      menuState = 'main';
      playSFX('eat');
      e.preventDefault();
    }
    return;
  }
  
  // Game Over
  if (gameState === 'gameover') {
    if (e.key === 'Enter') {
      returnToMenu();
    }
    return;
  }
  
  // Pause
  if (e.key === 'Escape') {
    if (upgradeMenu || shopMenu || missionsMenu) {
      // Fecha menus antes de pausar
      upgradeMenu = false;
      shopMenu = false;
      missionsMenu = false;
      playSFX('eat');
      e.preventDefault();
      return;
    }
    togglePause();
    e.preventDefault();
    return;
  }
  
  // Controles durante jogo
  if (gameState === 'playing') {
    // Navegação em menus abertos
    if (upgradeMenu || shopMenu || missionsMenu) {
      if (e.key === 'ArrowUp' || e.key === 'w') {
        navigateMenu('up');
        e.preventDefault();
        return;
      }
      if (e.key === 'ArrowDown' || e.key === 's') {
        navigateMenu('down');
        e.preventDefault();
        return;
      }
      if (e.key === 'Enter' || e.key === 'e' || e.key === ' ') {
        confirmMenuSelection();
        e.preventDefault();
        return;
      }
    }
    
    // Abrir/fechar menus
    if (e.key === "u") {
      upgradeMenu = !upgradeMenu;
      if (upgradeMenu) {
        missionsMenu = false;
        shopMenu = false;
        selectedUpgradeOption = 0;
      }
      e.preventDefault();
    }
    if (e.key === "m") {
      missionsMenu = !missionsMenu;
      if (missionsMenu) {
        upgradeMenu = false;
        shopMenu = false;
        selectedMissionOption = 0;
      }
      e.preventDefault();
    }
    if (e.key === "p") {
      shopMenu = !shopMenu;
      if (shopMenu) {
        upgradeMenu = false;
        missionsMenu = false;
        selectedShopOption = 0;
      }
      e.preventDefault();
    }
    
    // Atalhos de áudio e reset
    if (!upgradeMenu && !shopMenu && !missionsMenu) {
      if (e.key === "v") {
        toggleAudio();
        e.preventDefault();
      }
      if (e.key === "r" && confirm('Resetar save?')) {
        resetSave();
        e.preventDefault();
      }
    }
    
    // Teclas de atalho (1-5) para upgrades
    if (upgradeMenu) {
      const upgradeKeys = ['maxHunger', 'hungerDrain', 'xpBonus', 'speed', 'heal'];
      const keyNum = parseInt(e.key);
      if (keyNum >= 1 && keyNum <= 5) {
        buyUpgrade(upgradeKeys[keyNum - 1]);
        e.preventDefault();
      }
    }
    
    // Teclas de atalho (1-3) para missões
    if (missionsMenu) {
      const keyNum = parseInt(e.key);
      if (keyNum >= 1 && keyNum <= 3) {
        claimMissionReward(keyNum - 1);
        e.preventDefault();
      }
    }
    
    // Teclas de atalho (1-4) para loja
    if (shopMenu) {
      const keyNum = parseInt(e.key);
      if (keyNum >= 1 && keyNum <= 4) {
        const item = shopItems[keyNum - 1];
        if (item) buyShopItem(item.id);
        e.preventDefault();
      }
    }
  }
  
  // Pause menu
  if (gameState === 'paused') {
    if (e.key === 'ArrowUp' || e.key === 'w') {
      navigateMenu('up');
      e.preventDefault();
    }
    if (e.key === 'ArrowDown' || e.key === 's') {
      navigateMenu('down');
      e.preventDefault();
    }
    if (e.key === 'Enter' || e.key === ' ') {
      confirmMenuSelection();
      e.preventDefault();
    }
    if (e.key === 'a') {
      toggleAudio();
      e.preventDefault();
    }
    if (e.key === 'm') {
      if (confirm('Deseja voltar ao menu principal? Seu progresso será salvo.')) {
        saveGame();
        returnToMenu();
      }
      e.preventDefault();
    }
  }
});

addEventListener("keyup", e => keys[e.key] = false);

// ================= GAME MECHANICS =================
let combo = 0;
let comboTimer = 0;
let comboMultiplier = 1;

// Efeitos visuais
let shakeTime = 0;
let shakeIntensity = 0;
let cameraZoom = 1;
let swimTime = 0;

// Bolhas de fundo
let bubbles = [];
for (let i = 0; i < 30; i++) {
  bubbles.push({
    x: Math.random() * window.innerWidth,
    y: Math.random() * window.innerHeight,
    r: randomRange(2, 8),
    vy: -randomRange(20, 50),
    opacity: randomRange(0.3, 0.7)
  });
}

function triggerShake(intensity, duration) {
  shakeIntensity = intensity;
  shakeTime = duration;
}

function eatFish(f) {
  // V4: mini-bosses realmente exigem múltiplas mordidas.
  if (f && f.typeDef && f.typeDef.requiresMultipleHits) {
    if (f._v4Health == null) f._v4Health = f.typeDef.health || f.health || 2;
    f._v4Health--;
    if (f._v4Health > 0) {
      player.justAte = true; player.ateTimer = .22;
      createParticles(f.x, f.y, '#fb7185', 18);
      createScorePopup(f.x, f.y - f.r, `BOSS ${f._v4Health} HIT${f._v4Health>1?'S':''}`, 'red');
      triggerShake(8, .18);
      f.angle += Math.PI * .75;
      f.speed *= 1.12;
      return false;
    }
  }
  combo++;
  comboTimer = 2.5;
  const oldMultiplier = comboMultiplier;
  comboMultiplier = combo >= 8 ? 5 : combo >= 5 ? 3 : combo >= 3 ? 2 : 1;

  // ✅ Aplicar multiplicadores de prestige
  let prestigeMultipliers = {xp: 1, coins: 1};
  if (typeof progressionSystem !== 'undefined') {
    prestigeMultipliers = progressionSystem.getPrestigeMultipliers();
  }

  // XP com boost ativo e prestige
  let xpMultiplier = (1 + upgrades.xpBonus * 0.2) * prestigeMultipliers.xp;
  if (activePowerups.xpBoost > 0) xpMultiplier *= 2;
  
  // ✅ Aplicar buff de XP do player se ativo
  if (player.xpBuff) {
    xpMultiplier *= player.xpBuff.multiplier;
  }
  
  const earnedXP = f.xp * comboMultiplier * xpMultiplier;
  xp += earnedXP;
  
  // Ganhar moedas com prestige
  const earnedCoins = Math.floor(comboMultiplier * coinMultiplier * prestigeMultipliers.coins);
  coins += earnedCoins;
  
  // ✅ Adicionar gemas se o peixe tiver
  if (f.gems) {
    let gemAmount = f.gems;
    
    // Multiplicar por buff se ativo
    if (player.gemBuff) {
      gemAmount *= player.gemBuff.multiplier;
    }
    
    gems += gemAmount;
    
    if (typeof progressionSystem !== 'undefined') {
      progressionSystem.updateStatistics('gems', gemAmount);
    }
    
    createScorePopup(player.x, player.y - 40, `+${gemAmount}💎`, 'cyan');
  }
  
  player.eat(f.food);
  
  // ✅ Aplicar buff do peixe se ele dá buff
  if (typeof fishAbilitySystem !== 'undefined' && f.typeDef && f.typeDef.givesBuff) {
    fishAbilitySystem.applyFishBuff(f, player);
  }
  
  // ✅ Dano se peixe estiver inflado (baiacu)
  if (f.inflated && !f.safeToEat && f.typeDef && f.typeDef.abilities && f.typeDef.abilities.inflate) {
    const ability = f.typeDef.abilities.inflate;
    player.takeDamage(ability.damage);
    createScorePopup(player.x, player.y, `-${ability.damage}HP`, 'red');
  }

  // ✅ Atualizar estatísticas de progressão
  if (typeof progressionSystem !== 'undefined') {
    progressionSystem.updateStatistics('fishEaten');
    progressionSystem.updateStatistics('coins', earnedCoins);
    
    if (f.type) {
      progressionSystem.updateStatistics('fishType', f.type);
    }
    
    // Verificar se é lendário
    if (f.typeDef && f.typeDef.legendary) {
      progressionSystem.checkAchievement('catch_legendary');
    }
    
    // Verificar se é boss
    if (f.typeDef && f.typeDef.isBoss) {
      progressionSystem.updateStatistics('bossDefeated');
    }
  }

  // ✅ Registrar conquistas
  if (typeof registerFishEaten === 'function') {
    registerFishEaten();
  }
  if (typeof registerCombo === 'function' && combo > 1) {
    registerCombo(combo);
  }

  // Atualiza missões
  missionStats.fishEaten++;
  if (combo > missionStats.comboReached) {
    missionStats.comboReached = combo;
  }
  updateMissionProgress();

  // Efeitos
  playSFX('eat');
  if (comboMultiplier > oldMultiplier) {
    playSFX('combo');
  }

  triggerShake(6, 0.15);
  createParticles(player.x, player.y, f.color, 15);
  
  if (earnedCoins > 0) {
    createScorePopup(player.x, player.y - 20, `+${earnedCoins}💰`, 'gold');
  }
  return true;
}

function checkLevelUp() {
  while (xp >= xpToNext) {
    xp -= xpToNext;
    level++;
    upgradePoints++;
    xpToNext = Math.floor(xpToNext * 1.3);
    createParticles(player.x, player.y, 'gold', 30);
    playSFX('levelup');
    
    // ✅ Integração com sistema de progressão
    if (typeof progressionSystem !== 'undefined') {
      // Verificar evolução disponível
      if (progressionSystem.canEvolve()) {
        // Mostrar notificação de evolução (se tiver sistema de UI para isso)
        console.log('🦈 Evolução disponível! Level:', level);
      }
      
      // Atualizar estatísticas
      progressionSystem.updateStatistics('level', level);
      
      // Salvar progresso
      progressionSystem.save();
    }
    
    saveGame();
  }
}

function updateBubbles(dt) {
  bubbles.forEach(b => {
    b.y += b.vy * dt;
    b.x += Math.sin(b.y * 0.01) * 0.5;
    if (b.y < -10) {
      b.y = canvas.height/dpr + 10;
      b.x = Math.random() * canvas.width/dpr;
    }
  });
}

// ================= GAME LOOP =================
function update(dt) {
  // Atualizar bolhas sempre (mesmo no menu)
  updateBubbles(dt);
  
  // Não atualizar jogo se não estiver jogando
  if (gameState !== 'playing') return;
  if (!player) return;
  
  // Atualizar player
  player.update(dt, keys, touchInput);

  // ✅ Atualizar buffs do player
  if (typeof fishAbilitySystem !== 'undefined' && fishAbilitySystem.updatePlayerBuffs) {
    fishAbilitySystem.updatePlayerBuffs(player, dt);
  }

  // ✅ Atualizar estatísticas de progressão
  if (typeof progressionSystem !== 'undefined' && player.isMoving) {
    progressionSystem.updateStatistics('distance', player.speed * dt / 60);
  }

  // Atualizar combo
  if (combo > 0) {
    comboTimer -= dt;
    if (comboTimer <= 0) {
      combo = 0;
      comboMultiplier = 1;
    }
  }

  // ✅ SISTEMA DE COLISÃO OTIMIZADO
  // Atualizar spatial grid
  if (typeof updateCollisionSystem === 'function') {
    updateCollisionSystem();
  }
  
  // Checar colisões do player usando spatial grid
  if (typeof checkPlayerCollisionsOptimized === 'function') {
    const collisions = checkPlayerCollisionsOptimized();
    
    // Processar colisões com peixes
    collisions.fishes.forEach(fish => {
      const index = fishes.indexOf(fish);
      if (index !== -1) {
        if (eatFish(fish) !== false) removeFish(fish); // CORRIGIDO: passar o objeto fish, não o índice
      }
    });
    
    // Processar colisões com inimigos
    collisions.enemies.forEach(enemy => {
      const index = enemies.indexOf(enemy);
      if (index !== -1) {
        if (activePowerups.invincible > 0) {
          createParticles(enemy.x, enemy.y, 'yellow', 15);
          
          // ✅ Registrar derrota de inimigo
          if (typeof registerEnemyDefeated === 'function') {
            registerEnemyDefeated();
          }
          
          removeEnemy(enemy); // CORRIGIDO: passar o objeto enemy, não o índice
          return;
        }
        
        player.takeDamage(enemy.damage);
        
        // ✅ Registrar dano recebido
        if (typeof registerDamageTaken === 'function') {
          registerDamageTaken();
        }
        
        combo = 0;
        triggerShake(10, 0.3);
        createParticles(player.x, player.y, 'red', 20);
        createBloodParticles(player.x, player.y, 8);
        playSFX('damage');
        
        if (player.hunger > 0) {
          missionStats.enemiesDefeated++;
          updateMissionProgress();
        }
        
        removeEnemy(enemy); // CORRIGIDO: passar o objeto enemy, não o índice
      }
    });
  } else {
    // FALLBACK: Sistema antigo (se collision-system.js não estiver carregado)
    for (let i = fishes.length - 1; i >= 0; i--) {
      const f = fishes[i];
      // Collision check inline (fallback)
      const dx = player.x - f.x;
      const dy = player.y - f.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < player.r + f.r) {
        if (eatFish(f) !== false) removeFish(f); // CORRIGIDO: passar o objeto, não o índice
      }
    }
    
    for (let i = enemies.length - 1; i >= 0; i--) {
      const e = enemies[i];
      // Collision check inline (fallback)
      const dx = player.x - e.x;
      const dy = player.y - e.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < player.r + e.r) {
        if (activePowerups.invincible > 0) {
          createParticles(e.x, e.y, 'yellow', 15);
          if (typeof registerEnemyDefeated === 'function') registerEnemyDefeated();
          removeEnemy(e); // CORRIGIDO: passar o objeto, não o índice
          continue;
        }
        
        player.takeDamage(e.damage);
        if (typeof registerDamageTaken === 'function') registerDamageTaken();
        combo = 0;
        triggerShake(10, 0.3);
        createParticles(player.x, player.y, 'red', 20);
        createBloodParticles(player.x, player.y, 8);
        playSFX('damage');
        
        if (player.hunger > 0) {
          missionStats.enemiesDefeated++;
          updateMissionProgress();
        }
        
        removeEnemy(e); // CORRIGIDO: passar o objeto, não o índice
      }
    }
  }

  if (typeof V4 !== 'undefined') V4.update(dt);

  // Atualizar entidades
  updateFishes(dt);
  updateEnemies(dt);
  updateParticles(dt);
  updateBloodParticles(dt);
  updateScorePopups(dt);
  updateMissionNotification(dt);
  updateFloatingCoins(dt);
  updateFloatingGems(dt);
  updatePowerups(dt);
  checkLevelUp();

  // Efeitos de câmera
  if (shakeTime > 0) shakeTime -= dt;
  else shakeIntensity = 0;
  cameraZoom += ((comboMultiplier >= 5 ? 1.1 : 1) - cameraZoom) * 0.1;
  swimTime += dt * 8;

  // Game over
  if (player.isDead()) {
    gameState = 'gameover';
    playSFX('damage');
  }
}


function drawScreenAtmosphere() {
  const w = canvas.width / dpr;
  const h = canvas.height / dpr;
  ctx.save();
  ctx.globalCompositeOperation = 'source-over';

  // Vinheta submarina dá profundidade sem esconder o gameplay.
  const vignette = ctx.createRadialGradient(w * 0.5, h * 0.44, Math.min(w,h) * 0.18, w * 0.5, h * 0.5, Math.max(w,h) * 0.72);
  vignette.addColorStop(0, 'rgba(24,154,204,0)');
  vignette.addColorStop(0.72, 'rgba(0,34,59,0.08)');
  vignette.addColorStop(1, 'rgba(0,9,20,0.34)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, w, h);

  // Brilho da superfície.
  const surface = ctx.createLinearGradient(0, 0, 0, Math.min(170, h * 0.3));
  surface.addColorStop(0, 'rgba(157,231,255,0.12)');
  surface.addColorStop(1, 'rgba(86,196,235,0)');
  ctx.fillStyle = surface;
  ctx.fillRect(0, 0, w, Math.min(190, h * 0.34));
  ctx.restore();
}

function draw() {
  // Desenhar menu
  if (gameState === 'menu') {
    if (menuState === 'main') {
      drawMainMenu();
    } else if (menuState === 'howtoplay') {
      drawHowToPlay();
    } else if (menuState === 'achievements') {
      // ✅ Desenhar menu de conquistas
      if (typeof drawAchievementsMenu === 'function') {
        drawAchievementsMenu(ctx);
      }
    } else if (menuState === 'settings') {
      drawSettings();
    } else if (menuState === 'credits') {
      drawCredits();
    }
    return;
  }
  
  // Desenhar game over
  if (gameState === 'gameover') {
    drawGameOver();
    return;
  }
  
  // Desenhar jogo (playing ou paused)
  let sx = 0, sy = 0;
  if (shakeTime > 0 && settingsOptions.screenShake) {
    sx = (Math.random() - 0.5) * shakeIntensity;
    sy = (Math.random() - 0.5) * shakeIntensity;
  }

  ctx.save();
  ctx.translate(sx, sy);
  
  // ✅ Aplicar transformação da câmera
  if (typeof camera !== 'undefined' && camera) {
    camera.apply(ctx);
  } else {
    // Fallback para o sistema antigo
    ctx.save();
    ctx.translate(canvas.width/(2*dpr), canvas.height/(2*dpr));
    ctx.scale(cameraZoom, cameraZoom);
    ctx.translate(-canvas.width/(2*dpr), -canvas.height/(2*dpr));
  }

  // ✅ Desenhar mapa (substitui background antigo)
  if (typeof mapSystem !== 'undefined' && mapSystem) {
    mapSystem.draw(ctx, camera);
  } else {
    // Fallback: background antigo
    const bgGradient = ctx.createLinearGradient(0, 0, 0, canvas.height/dpr);
    bgGradient.addColorStop(0, '#0a1929');
    bgGradient.addColorStop(0.5, '#1a3a52');
    bgGradient.addColorStop(1, '#2a4a62');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, canvas.width/dpr, canvas.height/dpr);
    
    // Raios de luz (antigo)
    ctx.save();
    ctx.globalAlpha = 0.1;
    for (let i = 0; i < 5; i++) {
      ctx.fillStyle = 'rgba(173, 216, 230, 0.3)';
      ctx.beginPath();
      ctx.moveTo(canvas.width/dpr * (i/5), 0);
      ctx.lineTo(canvas.width/dpr * (i/5 + 0.1), 0);
      ctx.lineTo(canvas.width/dpr * (i/5 + 0.15) + Math.sin(swimTime * 0.5 + i) * 20, canvas.height/dpr);
      ctx.lineTo(canvas.width/dpr * (i/5 + 0.05) + Math.sin(swimTime * 0.5 + i) * 20, canvas.height/dpr);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }
  
  // Moedas e gemas
  drawFloatingCoins(ctx);
  drawFloatingGems(ctx);
  
  // Entidades
  drawFishes(ctx);
  drawEnemies(ctx);
  if (player) player.draw(ctx);
  
  // Partículas
  if (settingsOptions.particles) {
    drawParticles();
    drawBloodParticles();
  }
  drawScorePopups();
  
  // Combo
  if (combo > 1) {
    ctx.fillStyle = comboMultiplier >= 5 ? 'red' : comboMultiplier >= 3 ? 'orange' : 'yellow';
    ctx.font = `bold ${20 + comboMultiplier * 5}px Arial`;
    ctx.textAlign = 'center';
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 4;
    ctx.strokeText(`COMBO x${comboMultiplier}`, canvas.width/(2*dpr), 100);
    ctx.fillText(`COMBO x${comboMultiplier}`, canvas.width/(2*dpr), 100);
  }

  ctx.restore();
  
  // ✅ Restaurar transformação da câmera
  if (typeof camera !== 'undefined' && camera) {
    camera.restore(ctx);
  }
  ctx.restore();

  drawScreenAtmosphere();

  // HUD e Menus (sem zoom)
  if (gameState === 'playing') {
    drawHUD();
    if (typeof V4 !== 'undefined') V4.draw(ctx);
    drawMenus();
    
    // ✅ Desenhar notificações de conquistas (por cima de tudo)
    if (typeof drawAchievementNotifications === 'function') {
      drawAchievementNotifications(ctx);
    }
    
    // ✅ Desenhar minimap
    if (typeof mapSystem !== 'undefined' && mapSystem && player) {
      mapSystem.drawMinimap(ctx, player, camera, 150);
    }
    
    // ✅ Desenhar debug do collision system (se ativo)
    if (window.showCollisionDebug && typeof collisionManager !== 'undefined' && collisionManager) {
      collisionManager.drawStatsHUD(ctx);
    }
  }
  
  // ✅ Desenhar flash da câmera (se ativo)
  if (typeof camera !== 'undefined' && camera) {
    camera.drawFlash(ctx);
  }
  
  // Menu de pause
  if (gameState === 'paused') {
    drawPauseMenu();
  }
}

function loop(time) {
  const dt = Math.min((time - lastTime) / 1000, 0.1);
  lastTime = time;

  // Auto-save periódico (a cada 60 segundos durante gameplay)
  if (typeof autoSave === 'function') {
    autoSave(time);
  }

  // ✅ Atualizar conquistas
  if (typeof updateAchievements === 'function') {
    updateAchievements(dt);
  }
  
  // ✅ Atualizar câmera
  if (typeof camera !== 'undefined' && camera) {
    camera.update(dt);
  }
  
  // ✅ Atualizar mapa
  if (typeof mapSystem !== 'undefined' && mapSystem) {
    mapSystem.update(dt, camera);
  }

  // Spawn apenas durante o jogo
  if (gameState === 'playing') {
    // Spawn de peixes
    if (time - lastFishSpawn > CONFIG.FISH_SPAWN_INTERVAL) {
      spawnFish();
      lastFishSpawn = time;
    }

    // Spawn de inimigos
    if (time - lastEnemySpawn > CONFIG.ENEMY_SPAWN_INTERVAL) {
      spawnEnemy();
      lastEnemySpawn = time;
    }
  }

  update(dt);
  draw();
  requestAnimationFrame(loop);
}

// ================= FUNÇÕES DE CONTROLE DO JOGO =================

function togglePause() {
  if (gameState === 'playing') {
    gameState = 'paused';
    selectedPauseOption = 0; // Reset selection
    playSFX('eat');
  } else if (gameState === 'paused') {
    gameState = 'playing';
    playSFX('eat');
  }
}

function returnToMenu() {
  saveGame();
  gameState = 'menu';
  menuState = 'main';
  selectedMenuOption = 0;
  upgradeMenu = false;
  shopMenu = false;
  missionsMenu = false;
  
  // Limpar entidades
  clearAllGameObjects();
  
  playSFX('eat');
}

// ================= INICIALIZAÇÃO =================
loadAudioSettings();
generateDailyMissions();
loadGame();

// ✅ Inicializar sistema de progressão
if (typeof ProgressionSystem === 'function') {
  window.progressionSystem = new ProgressionSystem();
  progressionSystem.load();
}

// ✅ Inicializar sistema de habilidades dos peixes
if (typeof FishAbilitySystem === 'function') {
  window.fishAbilitySystem = new FishAbilitySystem();
}

// ✅ Inicializar conquistas
if (typeof initAchievements === 'function') {
  initAchievements();
}

initPlayer();

// ✅ Inicializar câmera
initCamera(canvas.width / dpr, canvas.height / dpr);
camera.setTarget(player);
camera.setBounds(0, 0, 3000, 3000); // Mundo 3000x3000
camera.smoothing = 0.15; // Suavidade do seguimento

// ✅ Inicializar mapa
initMapSystem(3000, 3000); // Mesmo tamanho do mundo

// ✅ Inicializar sistema de colisão otimizado
initCollisionSystem(3000, 3000, 150); // cellSize = 150px

// Carregar configurações de settings
const savedSettings = localStorage.getItem('game_settings');
if (savedSettings) {
  const settings = JSON.parse(savedSettings);
  settingsOptions = { ...settingsOptions, ...settings };
  if (settings.musicVolume !== undefined) musicVolume = settings.musicVolume;
  if (settings.sfxVolume !== undefined) sfxVolume = settings.sfxVolume;
}

// Iniciar no menu
gameState = 'menu';

// Iniciar música após primeira interação
const startAudioOnInteraction = () => {
  if (audioEnabled && !musicPlaying) {
    startMusic();
  }
  document.removeEventListener('click', startAudioOnInteraction);
  document.removeEventListener('touchstart', startAudioOnInteraction);
  document.removeEventListener('keydown', startAudioOnInteraction);
};

document.addEventListener('click', startAudioOnInteraction);
document.addEventListener('touchstart', startAudioOnInteraction);
document.addEventListener('keydown', startAudioOnInteraction);

loop(0);

// Resize handler
function resizeGameCanvas() {
  dpr = Math.min(window.devicePixelRatio || 1, CONFIG.MAX_DPR);
  canvas.width = Math.max(1, Math.floor(window.innerWidth * dpr));
  canvas.height = Math.max(1, Math.floor(window.innerHeight * dpr));
  canvas.style.width = window.innerWidth + 'px';
  canvas.style.height = window.innerHeight + 'px';
  // Alterar width/height reseta o transform; aplicar DPR uma única vez evita escala acumulada.
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  if (typeof camera !== 'undefined' && camera) {
    camera.resize(window.innerWidth, window.innerHeight);
  }
}
window.addEventListener('resize', resizeGameCanvas);
window.addEventListener('orientationchange', () => setTimeout(resizeGameCanvas, 60));
