// ================= SISTEMA DE UI E MENUS =================

// Sistema de loja
const shopItems = [
  {
    id: 'coin_magnet',
    name: '🧲 Ímã de Moedas',
    description: 'Atrai moedas automaticamente',
    cost: 500,
    currency: 'coins',
    type: 'permanent',
    owned: false
  },
  {
    id: 'coin_multiplier',
    name: '💰 Multiplicador +50%',
    description: 'Ganhe 50% mais moedas',
    cost: 1000,
    currency: 'coins',
    type: 'stackable',
    level: 0,
    maxLevel: 5
  },
  {
    id: 'gem_finder',
    name: '💎 Detector de Gemas',
    description: 'Gemas aparecem com mais frequência',
    cost: 2000,
    currency: 'coins',
    type: 'permanent',
    owned: false
  },
  {
    id: 'starting_boost',
    name: '🚀 Impulso Inicial',
    description: 'Comece com +50% de fome',
    cost: 1500,
    currency: 'coins',
    type: 'permanent',
    owned: false
  }
];

// Power-ups ativos
let activePowerups = {
  xpBoost: 0,
  invincible: 0
};

function buyShopItem(itemId) {
  const item = shopItems.find(i => i.id === itemId);
  if (!item) return;
  
  // Verifica se pode comprar
  if (item.currency === 'coins' && coins < item.cost) return;
  if (item.currency === 'gems' && gems < item.cost) return;
  
  // Verifica se já possui (para permanentes)
  if (item.type === 'permanent' && item.owned) return;
  
  // Verifica nível máximo (para stackable)
  if (item.type === 'stackable' && item.level >= item.maxLevel) return;
  
  // Cobra o custo
  if (item.currency === 'coins') coins -= item.cost;
  if (item.currency === 'gems') gems -= item.cost;
  
  // Aplica o efeito
  switch(item.type) {
    case 'permanent':
      item.owned = true;
      break;
      
    case 'stackable':
      item.level++;
      if (item.id === 'coin_multiplier') {
        coinMultiplier = 1 + (item.level * 0.5);
      }
      item.cost = Math.floor(item.cost * 1.5);
      break;
  }
  
  playSFX('mission');
  saveGame();
}

function updatePowerups(dt) {
  if (activePowerups.xpBoost > 0) {
    activePowerups.xpBoost -= dt;
  }
  
  if (activePowerups.invincible > 0) {
    activePowerups.invincible -= dt;
  }
}

// Sistema de missões diárias
const missionTemplates = [
  {type: 'fishEaten', target: 30, reward: 50, text: '🐟 Coma {target} peixes'},
  {type: 'fishEaten', target: 50, reward: 100, text: '🐟 Coma {target} peixes'},
  {type: 'fishEaten', target: 100, reward: 200, text: '🐟 Coma {target} peixes'},
  {type: 'enemiesDefeated', target: 5, reward: 75, text: '⚔️ Derrote {target} inimigos'},
  {type: 'enemiesDefeated', target: 10, reward: 150, text: '⚔️ Derrote {target} inimigos'},
  {type: 'comboReached', target: 5, reward: 80, text: '🔥 Alcance combo x{target}'},
  {type: 'comboReached', target: 8, reward: 150, text: '🔥 Alcance combo x{target}'}
];

let missionStats = {
  fishEaten: 0,
  enemiesDefeated: 0,
  comboReached: 0
};

function generateDailyMissions() {
  const today = new Date().toDateString();
  const savedData = JSON.parse(localStorage.getItem('daily_missions'));
  
  if (savedData && savedData.date === today) {
    dailyMissions = savedData.missions;
    missionStats = savedData.stats;
    return;
  }
  
  dailyMissions = [];
  const usedTypes = new Set();
  
  while(dailyMissions.length < 3) {
    const template = missionTemplates[Math.floor(Math.random() * missionTemplates.length)];
    
    if (!usedTypes.has(template.type)) {
      dailyMissions.push({
        ...template,
        progress: 0,
        completed: false,
        claimed: false
      });
      usedTypes.add(template.type);
    }
  }
  
  missionStats = {
    fishEaten: 0,
    enemiesDefeated: 0,
    comboReached: 0
  };
  
  saveDailyMissions();
}

function saveDailyMissions() {
  const today = new Date().toDateString();
  localStorage.setItem('daily_missions', JSON.stringify({
    date: today,
    missions: dailyMissions,
    stats: missionStats
  }));
}

function updateMissionProgress() {
  let anyCompleted = false;
  
  dailyMissions.forEach(mission => {
    if (mission.completed) return;
    
    const currentProgress = missionStats[mission.type];
    mission.progress = Math.min(currentProgress, mission.target);
    
    if (currentProgress >= mission.target && !mission.completed) {
      mission.completed = true;
      anyCompleted = true;
      playSFX('mission');
      showMissionNotification(`✅ Missão Completa!\n${mission.text.replace('{target}', mission.target)}`);
    }
  });
  
  if (anyCompleted) {
    saveDailyMissions();
  }
}

function claimMissionReward(index) {
  const mission = dailyMissions[index];
  if (!mission.completed || mission.claimed) return;
  
  mission.claimed = true;
  xp += mission.reward;
  showMissionNotification(`🎁 +${mission.reward} XP!`);
  saveDailyMissions();
  checkLevelUp();
}

function showMissionNotification(text) {
  missionNotification = {
    text: text,
    alpha: 1,
    y: 100
  };
}

function updateMissionNotification(dt) {
  if (!missionNotification) return;
  
  missionNotification.alpha -= dt * 0.5;
  missionNotification.y -= dt * 30;
  
  if (missionNotification.alpha <= 0) {
    missionNotification = null;
  }
}

// Desenhar HUD
function drawHUD() {
  const w = canvas.width / dpr;
  const h = canvas.height / dpr;
  const mobile = w < 760 || h < 520;
  const padding = mobile ? 12 : 20;

  // Painel superior compacto e legível.
  const hungerBarWidth = Math.min(mobile ? w * 0.48 : 300, w - padding * 2);
  const hungerBarHeight = mobile ? 20 : 28;
  const hungerX = w / 2 - hungerBarWidth / 2;
  const hungerY = padding;
  const hungerPercent = Math.max(0, Math.min(1, player.hunger / player.maxHunger));
  const hungerColor = hungerPercent > .5 ? '#22c55e' : hungerPercent > .25 ? '#f59e0b' : '#ef4444';

  ctx.save();
  ctx.fillStyle = 'rgba(2,14,25,.74)';
  ctx.beginPath(); ctx.roundRect(hungerX - 5, hungerY - 5, hungerBarWidth + 10, hungerBarHeight + 10, 10); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.08)';
  ctx.beginPath(); ctx.roundRect(hungerX, hungerY, hungerBarWidth, hungerBarHeight, 8); ctx.fill();
  if (hungerPercent > 0) {
    ctx.fillStyle = hungerColor;
    ctx.beginPath(); ctx.roundRect(hungerX, hungerY, Math.max(5, hungerBarWidth * hungerPercent), hungerBarHeight, 8); ctx.fill();
  }
  ctx.strokeStyle = 'rgba(225,248,255,.72)'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.roundRect(hungerX, hungerY, hungerBarWidth, hungerBarHeight, 8); ctx.stroke();
  ctx.fillStyle = 'white'; ctx.textAlign = 'center'; ctx.font = `bold ${mobile ? 11 : 13}px Arial`;
  ctx.fillText(`FOME ${Math.floor(player.hunger)}/${Math.floor(player.maxHunger)}`, w/2, hungerY + hungerBarHeight/2 + (mobile ? 4 : 5));

  // Status esquerdo em uma cápsula.
  const panelW = mobile ? 116 : 218;
  const panelH = mobile ? 70 : 112;
  ctx.fillStyle = 'rgba(2,14,25,.66)';
  ctx.beginPath(); ctx.roundRect(padding, padding, panelW, panelH, 12); ctx.fill();
  ctx.textAlign = 'left';
  ctx.fillStyle = '#facc15'; ctx.font = `bold ${mobile ? 13 : 17}px Arial`;
  ctx.fillText(`LV ${level}`, padding + 9, padding + 18);
  ctx.fillStyle = 'white'; ctx.font = `${mobile ? 10 : 13}px Arial`;
  ctx.fillText(`XP ${Math.floor(xp)}/${xpToNext}`, padding + 9, padding + (mobile ? 34 : 40));
  const xpW = panelW - 18, xpY = padding + (mobile ? 41 : 49);
  ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.fillRect(padding+9, xpY, xpW, mobile ? 5 : 7);
  ctx.fillStyle = '#38bdf8'; ctx.fillRect(padding+9, xpY, xpW * Math.max(0, Math.min(1, xp/xpToNext)), mobile ? 5 : 7);
  ctx.fillStyle = '#facc15'; ctx.font = `bold ${mobile ? 11 : 14}px Arial`;
  ctx.fillText(`💰 ${coins}`, padding+9, padding + (mobile ? 62 : 78));
  ctx.fillStyle = '#c4b5fd';
  ctx.fillText(`💎 ${gems}`, padding + (mobile ? 62 : 104), padding + (mobile ? 62 : 78));
  if (!mobile && upgradePoints > 0) {
    ctx.fillStyle = '#fde68a'; ctx.fillText(`⭐ ${upgradePoints} pontos`, padding+9, padding+101);
  }

  // Dash: feedback visual de cooldown no PC e celular.
  const dashReady = player && player.dashCooldown <= 0;
  const dashText = dashReady ? '⚡ DASH PRONTO' : `⚡ ${Math.max(0, player.dashCooldown).toFixed(1)}s`;
  ctx.textAlign = 'right'; ctx.font = `bold ${mobile ? 10 : 12}px Arial`;
  ctx.fillStyle = dashReady ? '#fde047' : 'rgba(255,255,255,.55)';
  ctx.fillText(dashText, w - padding, mobile ? padding + 15 : padding + 20);

  if (!mobile) {
    ctx.fillStyle = 'rgba(255,255,255,.65)'; ctx.font = '12px Arial';
    ctx.fillText('[Shift/Espaço] Dash', w-padding, padding+42);
    ctx.fillText('[U] Upgrades  [M] Missões  [P] Loja', w-padding, padding+62);
    ctx.fillText('[V] Áudio  [Esc] Pausa', w-padding, padding+82);
    ctx.fillText(audioEnabled ? '🔊 ON' : '🔇 OFF', w-padding, padding+102);
  }

  if (missionNotification) {
    ctx.globalAlpha = missionNotification.alpha;
    const noteW = Math.min(300, w - 24);
    ctx.fillStyle = 'rgba(0,0,0,.82)';
    ctx.beginPath(); ctx.roundRect(w/2-noteW/2, missionNotification.y-30, noteW, 60, 12); ctx.fill();
    ctx.strokeStyle = '#facc15'; ctx.stroke();
    ctx.fillStyle='white'; ctx.font='bold 14px Arial'; ctx.textAlign='center';
    missionNotification.text.split('\n').forEach((line,i)=>ctx.fillText(line,w/2,missionNotification.y+i*18));
  }
  ctx.restore();
}

// ================= DESENHAR MENUS COM NAVEGAÇÃO POR TECLADO =================

// Desenhar menus
function drawMenus() {
  // Menu de Missões
  if (missionsMenu) {
    // ✅ CORREÇÃO MOBILE: largura responsiva (era fixa em 400px, estourava a tela)
    const menuWidth = getOverlayWidth(400);
    const menuHeight = 400;
    const menuX = canvas.width/(2*dpr) - menuWidth/2;
    const menuY = canvas.height/(2*dpr) - menuHeight/2;
    
    ctx.fillStyle = 'rgba(0,0,0,0.9)';
    ctx.fillRect(menuX, menuY, menuWidth, menuHeight);
    
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 3;
    ctx.strokeRect(menuX, menuY, menuWidth, menuHeight);
    
    ctx.fillStyle = '#3b82f6';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText("📋 MISSÕES DIÁRIAS", canvas.width/(2*dpr), menuY + 40);
    
    ctx.textAlign = 'left';
    ctx.font = '14px Arial';
    
    dailyMissions.forEach((mission, i) => {
      const yPos = menuY + 80 + i * 100;
      const isSelected = i === selectedMissionOption;
      
      // Highlight da seleção
      if (isSelected) {
        ctx.fillStyle = mission.completed ? 'rgba(34,197,94,0.3)' : 'rgba(59,130,246,0.2)';
      } else {
        ctx.fillStyle = mission.completed ? 'rgba(34,197,94,0.2)' : 'rgba(59,130,246,0.1)';
      }
      ctx.fillRect(menuX + 20, yPos, menuWidth - 40, 80);
      
      ctx.strokeStyle = isSelected ? (mission.completed ? '#10b981' : '#60a5fa') : (mission.completed ? '#22c55e' : '#3b82f6');
      ctx.lineWidth = isSelected ? 3 : 2;
      ctx.strokeRect(menuX + 20, yPos, menuWidth - 40, 80);
      
      ctx.fillStyle = 'white';
      ctx.font = 'bold 16px Arial';
      ctx.fillText(mission.text.replace('{target}', mission.target), menuX + 35, yPos + 25);
      
      const progressPercent = mission.progress / mission.target;
      ctx.font = '14px Arial';
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.fillText(`${Math.floor(mission.progress)}/${mission.target}`, menuX + 35, yPos + 50);
      
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(menuX + 35, yPos + 55, menuWidth - 90, 12);
      
      const barColor = mission.completed ? '#22c55e' : '#3b82f6';
      ctx.fillStyle = barColor;
      ctx.fillRect(menuX + 35, yPos + 55, (menuWidth - 90) * Math.min(progressPercent, 1), 12);
      
      if (mission.completed && !mission.claimed) {
        ctx.fillStyle = 'gold';
        ctx.font = 'bold 12px Arial';
        if (isSelected) {
          ctx.fillText(`🎁 [Enter] +${mission.reward} XP`, menuX + 230, yPos + 50);
        } else {
          ctx.fillText(`🎁 [${i+1}] +${mission.reward} XP`, menuX + 230, yPos + 50);
        }
      } else if (mission.claimed) {
        ctx.fillStyle = '#22c55e';
        ctx.fillText(`✅ RESGATADO`, menuX + 250, yPos + 50);
      }
    });
    
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('↑↓ navegar | Enter resgatar | [M] fechar', canvas.width/(2*dpr), menuY + menuHeight - 20);
  }
  
  // Menu de Loja
  if (shopMenu) {
    // ✅ CORREÇÃO MOBILE: largura responsiva (era fixa em 450px, estourava a tela)
    const menuWidth = getOverlayWidth(450);
    const menuHeight = 500;
    const menuX = canvas.width/(2*dpr) - menuWidth/2;
    const menuY = canvas.height/(2*dpr) - menuHeight/2;
    
    ctx.fillStyle = 'rgba(0,0,0,0.95)';
    ctx.fillRect(menuX, menuY, menuWidth, menuHeight);
    
    ctx.strokeStyle = 'gold';
    ctx.lineWidth = 4;
    ctx.strokeRect(menuX, menuY, menuWidth, menuHeight);
    
    ctx.fillStyle = 'gold';
    ctx.font = 'bold 28px Arial';
    ctx.textAlign = 'center';
    ctx.fillText("🏪 LOJA", canvas.width/(2*dpr), menuY + 40);
    
    ctx.font = '18px Arial';
    ctx.fillStyle = 'gold';
    ctx.fillText(`💰 ${coins}`, canvas.width/(2*dpr) - 80, menuY + 75);
    ctx.fillStyle = '#8b5cf6';
    ctx.fillText(`💎 ${gems}`, canvas.width/(2*dpr) + 80, menuY + 75);
    
    ctx.textAlign = 'left';
    
    const itemHeight = 90;
    shopItems.slice(0, 4).forEach((item, i) => {
      const itemY = menuY + 100 + i * itemHeight;
      const isSelected = i === selectedShopOption;
      
      const canBuy = (item.currency === 'coins' && coins >= item.cost) ||
                     (item.currency === 'gems' && gems >= item.cost);
      const isMaxed = item.type === 'stackable' && item.level >= item.maxLevel;
      const alreadyOwned = item.type === 'permanent' && item.owned;
      
      // Highlight da seleção
      if (isSelected) {
        if (alreadyOwned || isMaxed) {
          ctx.fillStyle = 'rgba(34,197,94,0.3)';
        } else if (canBuy) {
          ctx.fillStyle = 'rgba(59,130,246,0.3)';
        } else {
          ctx.fillStyle = 'rgba(100,100,100,0.3)';
        }
      } else {
        if (alreadyOwned || isMaxed) {
          ctx.fillStyle = 'rgba(34,197,94,0.2)';
        } else if (canBuy) {
          ctx.fillStyle = 'rgba(59,130,246,0.2)';
        } else {
          ctx.fillStyle = 'rgba(100,100,100,0.2)';
        }
      }
      
      ctx.fillRect(menuX + 20, itemY, menuWidth - 40, itemHeight - 10);
      
      ctx.strokeStyle = isSelected ? (alreadyOwned || isMaxed ? '#10b981' : canBuy ? '#60a5fa' : '#888') : (alreadyOwned || isMaxed ? '#22c55e' : canBuy ? '#3b82f6' : '#666');
      ctx.lineWidth = isSelected ? 3 : 2;
      ctx.strokeRect(menuX + 20, itemY, menuWidth - 40, itemHeight - 10);
      
      ctx.fillStyle = 'white';
      ctx.font = 'bold 16px Arial';
      ctx.fillText(item.name, menuX + 35, itemY + 25);
      
      ctx.font = '13px Arial';
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.fillText(item.description, menuX + 35, itemY + 45);
      
      if (item.type === 'stackable') {
        ctx.fillText(`Nível: ${item.level}/${item.maxLevel}`, menuX + 35, itemY + 63);
      }
      
      ctx.font = 'bold 15px Arial';
      if (alreadyOwned) {
        ctx.fillStyle = '#22c55e';
        ctx.fillText('✅ COMPRADO', menuX + 280, itemY + 25);
      } else if (isMaxed) {
        ctx.fillStyle = '#22c55e';
        ctx.fillText('⭐ MÁXIMO', menuX + 280, itemY + 25);
      } else {
        const costColor = item.currency === 'coins' ? 'gold' : '#8b5cf6';
        const icon = item.currency === 'coins' ? '💰' : '💎';
        ctx.fillStyle = canBuy ? costColor : '#999';
        ctx.fillText(`${icon} ${item.cost}`, menuX + 280, itemY + 25);
        
        if (canBuy) {
          ctx.fillStyle = '#3b82f6';
          ctx.font = '12px Arial';
          if (isSelected) {
            ctx.fillText(`[Enter] Comprar`, menuX + 280, itemY + 45);
          } else {
            ctx.fillText(`[${i+1}] Comprar`, menuX + 280, itemY + 45);
          }
        }
      }
    });
    
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.font = '11px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('↑↓ navegar | Enter comprar | [1-4] atalho | [P] fechar', canvas.width/(2*dpr), menuY + menuHeight - 20);
    ctx.textAlign = 'left';
  }
  
  // Menu de Upgrades
  if (upgradeMenu) {
    // ✅ CORREÇÃO MOBILE: largura responsiva (era fixa em 380px)
    const menuWidth = getOverlayWidth(380);
    const menuHeight = 400;
    const menuX = canvas.width/(2*dpr) - menuWidth/2;
    const menuY = canvas.height/(2*dpr) - menuHeight/2;
    
    ctx.fillStyle = 'rgba(0,0,0,0.9)';
    ctx.fillRect(menuX, menuY, menuWidth, menuHeight);
    
    ctx.strokeStyle = 'gold';
    ctx.lineWidth = 3;
    ctx.strokeRect(menuX, menuY, menuWidth, menuHeight);
    
    ctx.fillStyle = 'gold';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText("⭐ UPGRADES", canvas.width/(2*dpr), menuY + 40);
    
    ctx.fillStyle = 'white';
    ctx.font = '16px Arial';
    ctx.textAlign = 'left';
    
    const upgradesData = [
      { key: 'maxHunger', label: 'Fome Máx', icon: '❤️', desc: '+25 fome máxima' },
      { key: 'hungerDrain', label: '-Consumo', icon: '⏱️', desc: '-10% consumo' },
      { key: 'xpBonus', label: '+XP', icon: '⭐', desc: '+20% XP ganho' },
      { key: 'speed', label: 'Velocidade', icon: '⚡', desc: '+30 velocidade' },
      { key: 'heal', label: 'Cura', icon: '💚', desc: '+5 cura por peixe' }
    ];
    
    upgradesData.forEach((upgrade, i) => {
      const itemY = menuY + 80 + i * 55;
      const isSelected = i === selectedUpgradeOption;
      const level = upgrades[upgrade.key];
      
      // Highlight da seleção
      if (isSelected) {
        ctx.fillStyle = 'rgba(59, 130, 246, 0.3)';
        ctx.fillRect(menuX + 20, itemY - 5, menuWidth - 40, 50);
        ctx.strokeStyle = '#60a5fa';
        ctx.lineWidth = 2;
        ctx.strokeRect(menuX + 20, itemY - 5, menuWidth - 40, 50);
      }
      
      ctx.fillStyle = 'white';
      ctx.font = 'bold 18px Arial';
      ctx.fillText(`${upgrade.icon} ${upgrade.label} (${level})`, menuX + 30, itemY + 15);
      
      ctx.font = '12px Arial';
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.fillText(upgrade.desc, menuX + 30, itemY + 32);
      
      // Botão de compra
      if (upgradePoints > 0) {
        if (isSelected) {
          ctx.fillStyle = '#10b981';
          ctx.font = 'bold 14px Arial';
          ctx.fillText('[Enter]', menuX + 280, itemY + 20);
        } else {
          ctx.fillStyle = '#3b82f6';
          ctx.font = '12px Arial';
          ctx.fillText(`[${i+1}]`, menuX + 280, itemY + 20);
        }
      }
    });
    
    ctx.fillStyle = 'gold';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`💎 Pontos: ${upgradePoints}`, canvas.width/(2*dpr), menuY + 360);
    
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = '12px Arial';
    ctx.fillText('↑↓ navegar | Enter comprar | [1-5] atalho | [U] fechar', canvas.width/(2*dpr), menuY + 385);
  }
}

function buyUpgrade(type) {
  if (upgradePoints <= 0) return;
  upgrades[type]++;
  upgradePoints--;
  playSFX('mission');
  saveGame();
}
