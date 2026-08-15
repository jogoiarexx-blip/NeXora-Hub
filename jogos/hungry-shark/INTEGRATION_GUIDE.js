// ================= INTEGRAÇÃO DO AUTO-SAVE NO GAME LOOP =================
// Este arquivo mostra como integrar o sistema de auto-save no game.js

// PASSO 1: Adicionar no início do arquivo (após as importações)
// -----------------------------------------------------------------
// Já está em save-system.js, apenas certifique-se de que está carregado

// PASSO 2: Modificar a função loop() em game.js
// -----------------------------------------------------------------

// ANTES:
function loop(time) {
  const dt = Math.min((time - lastTime) / 1000, 0.1);
  lastTime = time;

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

// DEPOIS (com auto-save):
function loop(time) {
  const dt = Math.min((time - lastTime) / 1000, 0.1);
  lastTime = time;

  // Auto-save periódico (a cada 60 segundos durante gameplay)
  if (typeof autoSave === 'function') {
    autoSave(time);
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

// PASSO 3: Salvar ao completar eventos importantes
// -----------------------------------------------------------------

// Exemplo 1: Salvar ao subir de nível
function checkLevelUp() {
  while (xp >= xpToNext) {
    xp -= xpToNext;
    level++;
    upgradePoints++;
    xpToNext = Math.floor(xpToNext * 1.3);
    createParticles(player.x, player.y, 'gold', 30);
    playSFX('levelup');
    
    // ADICIONAR: Salvar ao subir de nível
    if (typeof saveGame === 'function') {
      saveGame();
    }
  }
}

// Exemplo 2: Salvar ao comprar upgrade
function buyUpgrade(type) {
  if (upgradePoints <= 0) return;
  
  // ... código de upgrade ...
  
  // ADICIONAR: Salvar após compra
  if (typeof saveGame === 'function') {
    saveGame();
  }
}

// Exemplo 3: Salvar ao game over
function update(dt) {
  // ... código existente ...
  
  // Game over
  if (player.isDead()) {
    gameState = 'gameover';
    playSFX('damage');
    
    // ADICIONAR: Salvar ao morrer
    if (typeof saveGame === 'function') {
      saveGame();
    }
  }
}

// PASSO 4: (Opcional) Adicionar indicador visual de auto-save
// -----------------------------------------------------------------

let showSaveIndicator = false;
let saveIndicatorTime = 0;

function autoSave(currentTime) {
  if (currentTime - lastAutoSave > AUTO_SAVE_INTERVAL) {
    if (gameState === 'playing') {
      const result = saveGame();
      if (result.success) {
        console.log('Auto-save realizado');
        
        // Mostrar indicador visual
        showSaveIndicator = true;
        saveIndicatorTime = 2; // 2 segundos
      }
      lastAutoSave = currentTime;
    }
  }
  
  // Atualizar timer do indicador
  if (showSaveIndicator) {
    saveIndicatorTime -= 0.016; // ~60fps
    if (saveIndicatorTime <= 0) {
      showSaveIndicator = false;
    }
  }
}

function draw() {
  // ... código de desenho existente ...
  
  // ADICIONAR: Desenhar indicador de auto-save
  if (showSaveIndicator && gameState === 'playing') {
    ctx.save();
    ctx.globalAlpha = Math.min(saveIndicatorTime, 1);
    ctx.fillStyle = 'rgba(16, 185, 129, 0.9)';
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    
    const x = canvas.width/dpr - 100;
    const y = 30;
    
    // Background
    ctx.fillRect(x - 5, y - 5, 90, 30);
    ctx.strokeRect(x - 5, y - 5, 90, 30);
    
    // Texto
    ctx.fillStyle = 'white';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('💾 Salvo!', x, y + 15);
    
    ctx.restore();
  }
}

// PASSO 5: Tratar erros de save graciosamente
// -----------------------------------------------------------------

// Wrapper para saveGame() com tratamento de erro
function safeSaveGame() {
  try {
    const result = saveGame();
    if (!result.success) {
      console.error('Erro ao salvar:', result.error);
      // Tentar novamente após 5 segundos
      setTimeout(safeSaveGame, 5000);
    }
    return result;
  } catch (error) {
    console.error('Erro crítico ao salvar:', error);
    return { success: false, error: error.message };
  }
}

// Usar safeSaveGame() em vez de saveGame() em código crítico

// PASSO 6: Verificar saúde do storage ao iniciar
// -----------------------------------------------------------------

// ADICIONAR no início do jogo (após carregar tudo):
window.addEventListener('load', () => {
  // Verificar saúde do localStorage
  if (typeof checkLocalStorageHealth === 'function') {
    const health = checkLocalStorageHealth();
    if (!health.healthy) {
      console.error('Problema no localStorage:', health.message);
      alert('Aviso: O sistema de save pode não funcionar corretamente. ' + 
            'Verifique o espaço disponível no navegador.');
    }
  }
  
  // ... resto da inicialização ...
});

// PASSO 7: (Opcional) Adicionar comandos de debug no console
// -----------------------------------------------------------------

// Adicionar no escopo global para facilitar debug
window.debugSave = {
  export: exportSave,
  import: importSave,
  validate: () => {
    const saved = localStorage.getItem(CONFIG.SAVE_KEY);
    if (!saved) {
      console.log('Nenhum save encontrado');
      return;
    }
    const data = JSON.parse(saved);
    const validation = validateSaveData(data);
    console.log('Validação:', validation);
  },
  backup: () => {
    const saved = localStorage.getItem(CONFIG.SAVE_KEY);
    if (saved) {
      localStorage.setItem(CONFIG.SAVE_KEY + '_backup', saved);
      console.log('Backup manual criado');
    }
  },
  restore: attemptBackupRestore,
  info: () => {
    const saved = localStorage.getItem(CONFIG.SAVE_KEY);
    if (saved) {
      const data = JSON.parse(saved);
      console.log('Informações do save:', {
        versão: data.version,
        level: data.level,
        xp: data.xp,
        coins: data.coins,
        gems: data.gems,
        timestamp: new Date(data.timestamp),
        checksum: data.checksum
      });
    }
  }
};

// Uso no console:
// debugSave.info()      - Ver info do save
// debugSave.validate()  - Validar save
// debugSave.export()    - Exportar save
// debugSave.backup()    - Criar backup manual
// debugSave.restore()   - Restaurar do backup

// RESUMO DAS MUDANÇAS NECESSÁRIAS:
// -----------------------------------------------------------------
// 1. ✅ Adicionar save-system.js no index.html ANTES de utils.js
// 2. ✅ Adicionar autoSave(time) no loop principal
// 3. ✅ Adicionar saveGame() após eventos importantes (level up, compras)
// 4. ⚠️ Opcional: Adicionar indicador visual de auto-save
// 5. ⚠️ Opcional: Adicionar comandos de debug
// 6. ✅ Verificar localStorage na inicialização
