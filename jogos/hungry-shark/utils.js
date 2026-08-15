// ================= FUNÇÕES UTILITÁRIAS COM OBJECT POOLING =================
// OTIMIZADO: Usa pools para partículas, reduz alocações
// MANTÉM: Todas as funcionalidades e efeitos visuais originais

// ================= FUNÇÕES MATEMÁTICAS (MANTIDAS) =================

function distance(x1, y1, x2, y2) {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

function randomRange(min, max) {
  return Math.random() * (max - min) + min;
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

// ================= SPAWN POSITION (MANTIDO) =================

function getOffscreenPosition() {
  // Usar posição da câmera se disponível, senão usar limites do mundo
  let refX, refY, refWidth, refHeight;
  
  if (typeof camera !== 'undefined' && camera) {
    refX = camera.x;
    refY = camera.y;
    refWidth = camera.width;
    refHeight = camera.height;
  } else if (typeof mapSystem !== 'undefined' && mapSystem) {
    refX = 0;
    refY = 0;
    refWidth = mapSystem.width;
    refHeight = mapSystem.height;
  } else {
    refX = 0;
    refY = 0;
    refWidth = window.innerWidth;
    refHeight = window.innerHeight;
  }
  
  const side = Math.floor(Math.random() * 4);
  const margin = 100;
  
  switch(side) {
    case 0: return {x: randomRange(refX - margin, refX + refWidth + margin), y: refY - margin}; // Top
    case 1: return {x: refX + refWidth + margin, y: randomRange(refY - margin, refY + refHeight + margin)}; // Right
    case 2: return {x: randomRange(refX - margin, refX + refWidth + margin), y: refY + refHeight + margin}; // Bottom
    case 3: return {x: refX - margin, y: randomRange(refY - margin, refY + refHeight + margin)}; // Left
  }
}

// ================= CORES (MANTIDO) =================

function getRandomFishColor() {
  const colors = [
    '#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24',
    '#6c5ce7', '#a29bfe', '#fd79a8', '#fdcb6e',
    '#55efc4', '#81ecec', '#fab1a0', '#e17055'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

/**
 * Ajusta o brilho de uma cor hexadecimal
 * @param {string} color - Cor em formato hex (#RRGGBB)
 * @param {number} amount - Quantidade para ajustar (-255 a 255)
 */
function adjustColorBrightness(color, amount) {
  // Remover # se presente
  color = color.replace('#', '');
  
  // Converter para RGB
  let r = parseInt(color.substring(0, 2), 16);
  let g = parseInt(color.substring(2, 4), 16);
  let b = parseInt(color.substring(4, 6), 16);
  
  // Ajustar brilho
  r = Math.max(0, Math.min(255, r + amount));
  g = Math.max(0, Math.min(255, g + amount));
  b = Math.max(0, Math.min(255, b + amount));
  
  // Converter de volta para hex
  const rHex = r.toString(16).padStart(2, '0');
  const gHex = g.toString(16).padStart(2, '0');
  const bHex = b.toString(16).padStart(2, '0');
  
  return `#${rHex}${gHex}${bHex}`;
}

// ================= EFEITOS VISUAIS COM POOLING (OTIMIZADO) =================

/**
 * Cria partículas usando o pool (OTIMIZADO mas mantém efeito visual)
 */
function createParticles(x, y, color, count = 5) {
  const newParticles = pools.particle.burst(x, y, color, count);
  particles.push(...newParticles);
}

/**
 * Cria partículas de sangue usando o pool (OTIMIZADO mas mantém efeito visual)
 */
function createBloodParticles(x, y, count = 8) {
  const newParticles = pools.bloodParticle.burst(x, y, count);
  bloodParticles.push(...newParticles);
}

/**
 * Cria popup de score usando o pool (OTIMIZADO mas mantém efeito visual)
 */
function createScorePopup(x, y, text, color = 'white') {
  const popup = pools.scorePopup.acquire(x, y, text, color);
  if (popup) {
    scorePopups.push(popup);
  }
}

// ================= UPDATE DE PARTÍCULAS (OTIMIZADO) =================
// Usa técnica swap-and-pop ao invés de splice para melhor performance

/**
 * Atualiza partículas com swap-and-pop (OTIMIZADO)
 */
function updateParticles(dt) {
  let writeIndex = 0;
  
  for (let readIndex = 0; readIndex < particles.length; readIndex++) {
    const p = particles[readIndex];
    
    // Atualizar partícula
    p.x += p.vx;
    p.y += p.vy;
    p.life -= dt * 2;
    
    // Se ainda está viva, manter no array
    if (p.life > 0) {
      particles[writeIndex] = p;
      writeIndex++;
    } else {
      // Retornar ao pool
      if (p._pooled) {
        pools.particle.release(p);
      }
    }
  }
  
  // Truncar array (mais eficiente que splice)
  particles.length = writeIndex;
}

/**
 * Atualiza partículas de sangue com swap-and-pop (OTIMIZADO)
 */
function updateBloodParticles(dt) {
  let writeIndex = 0;
  
  for (let readIndex = 0; readIndex < bloodParticles.length; readIndex++) {
    const p = bloodParticles[readIndex];
    
    // Atualizar partícula
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.1; // Gravidade (MANTIDO)
    p.life -= dt * 1.5;
    
    // Se ainda está viva, manter no array
    if (p.life > 0) {
      bloodParticles[writeIndex] = p;
      writeIndex++;
    } else {
      // Retornar ao pool
      if (p._pooled) {
        pools.bloodParticle.release(p);
      }
    }
  }
  
  // Truncar array
  bloodParticles.length = writeIndex;
}

/**
 * Atualiza score popups com swap-and-pop (OTIMIZADO)
 */
function updateScorePopups(dt) {
  let writeIndex = 0;
  
  for (let readIndex = 0; readIndex < scorePopups.length; readIndex++) {
    const p = scorePopups[readIndex];
    
    // Atualizar popup
    p.y += p.vy;
    p.life -= dt;
    
    // Se ainda está vivo, manter no array
    if (p.life > 0) {
      scorePopups[writeIndex] = p;
      writeIndex++;
    } else {
      // Retornar ao pool
      if (p._pooled) {
        pools.scorePopup.release(p);
      }
    }
  }
  
  // Truncar array
  scorePopups.length = writeIndex;
}

// ================= DESENHAR PARTÍCULAS (MANTÉM QUALIDADE VISUAL) =================

/**
 * Desenha partículas com efeitos visuais (MANTIDO)
 */
function drawParticles() {
  // Usar for loop tradicional (mais rápido que forEach)
  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    
    ctx.save();
    ctx.globalAlpha = p.life;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

/**
 * Desenha partículas de sangue com efeitos visuais (MANTIDO)
 */
function drawBloodParticles() {
  // Usar for loop tradicional
  for (let i = 0; i < bloodParticles.length; i++) {
    const p = bloodParticles[i];
    
    ctx.save();
    ctx.globalAlpha = p.life * 0.7;
    ctx.fillStyle = '#8B0000';
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

/**
 * Desenha score popups com efeitos visuais (MANTIDO)
 */
function drawScorePopups() {
  // Usar for loop tradicional
  for (let i = 0; i < scorePopups.length; i++) {
    const p = scorePopups[i];
    
    ctx.save();
    ctx.globalAlpha = p.life;
    ctx.fillStyle = p.color;
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    
    // Sombra no texto para melhor visibilidade
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetY = 2;
    
    ctx.fillText(p.text, p.x, p.y);
    ctx.restore();
  }
}

// ================= FUNÇÕES DE LIMPEZA (OTIMIZADO COM POOLING) =================

/**
 * Limpa todas as partículas e retorna ao pool (OTIMIZADO)
 */
function clearAllParticles() {
  // Retornar todos ao pool
  for (let i = 0; i < particles.length; i++) {
    if (particles[i]._pooled) {
      pools.particle.release(particles[i]);
    }
  }
  particles.length = 0;
}

/**
 * Limpa todas as partículas de sangue e retorna ao pool (OTIMIZADO)
 */
function clearAllBloodParticles() {
  // Retornar todos ao pool
  for (let i = 0; i < bloodParticles.length; i++) {
    if (bloodParticles[i]._pooled) {
      pools.bloodParticle.release(bloodParticles[i]);
    }
  }
  bloodParticles.length = 0;
}

/**
 * Limpa todos os score popups e retorna ao pool (OTIMIZADO)
 */
function clearAllScorePopups() {
  // Retornar todos ao pool
  for (let i = 0; i < scorePopups.length; i++) {
    if (scorePopups[i]._pooled) {
      pools.scorePopup.release(scorePopups[i]);
    }
  }
  scorePopups.length = 0;
}

/**
 * Limpa TUDO (útil ao reiniciar o jogo) (MANTIDO + OTIMIZADO)
 */
function clearAllGameObjects() {
  clearAllFishes();
  clearAllEnemies();
  clearAllCoins();
  clearAllGems();
  clearAllParticles();
  clearAllBloodParticles();
  clearAllScorePopups();
}

// ================= SISTEMA DE MOEDAS (MANTIDO COM POOLING) =================

/**
 * Spawn de moeda usando pool
 */
function spawnCoin(x, y) {
  const coin = pools.coin.acquire(x, y);
  if (coin) {
    floatingCoins.push(coin);
  }
  return coin;
}

/**
 * Atualiza moedas flutuantes
 */
function updateFloatingCoins(dt) {
  let writeIndex = 0;
  
  for (let readIndex = 0; readIndex < floatingCoins.length; readIndex++) {
    const coin = floatingCoins[readIndex];
    
    // Animação de flutuação
    coin.bobPhase += dt * 3;
    
    // Magnetismo em direção ao player (se próximo)
    if (player) {
      const dx = player.x - coin.x;
      const dy = player.y - coin.y;
      const distSq = dx * dx + dy * dy;
      const magnetRangeSq = CONFIG.COIN_MAGNET_RANGE * CONFIG.COIN_MAGNET_RANGE;
      
      if (distSq < magnetRangeSq) {
        const dist = Math.sqrt(distSq);
        const magnetForce = 300;
        coin.x += (dx / dist) * magnetForce * dt;
        coin.y += (dy / dist) * magnetForce * dt;
        
        // Coletado
        if (distSq < (player.r + coin.r) * (player.r + coin.r)) {
          coins += coin.value * coinMultiplier;
          createScorePopup(coin.x, coin.y, `+${coin.value}`, '#fbbf24');
          playSFX('coin');
          
          // Atualizar conquistas
          if (typeof updateAchievementProgress === 'function') {
            updateAchievementProgress('coins_collected', coin.value);
          }
          
          // Não adicionar ao writeIndex (remover)
          if (coin._pooled) {
            pools.coin.release(coin);
          }
          continue;
        }
      }
    }
    
    // Manter moeda
    floatingCoins[writeIndex] = coin;
    writeIndex++;
  }
  
  floatingCoins.length = writeIndex;
}

/**
 * Desenha moedas flutuantes
 */
function drawFloatingCoins(ctx) {
  for (let i = 0; i < floatingCoins.length; i++) {
    const coin = floatingCoins[i];
    const bobOffset = Math.sin(coin.bobPhase) * 3;
    
    ctx.save();
    
    // Sombra
    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.shadowBlur = 5;
    
    // Gradiente dourado
    const gradient = ctx.createRadialGradient(
      coin.x - coin.r * 0.3, 
      coin.y + bobOffset - coin.r * 0.3, 
      0,
      coin.x, 
      coin.y + bobOffset, 
      coin.r
    );
    gradient.addColorStop(0, '#ffd700');
    gradient.addColorStop(0.5, '#ffa500');
    gradient.addColorStop(1, '#ff8c00');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(coin.x, coin.y + bobOffset, coin.r, 0, Math.PI * 2);
    ctx.fill();
    
    // Borda
    ctx.strokeStyle = '#b8860b';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    
    // Símbolo $
    ctx.fillStyle = '#b8860b';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('$', coin.x, coin.y + bobOffset);
    
    ctx.restore();
  }
}

/**
 * Limpa todas as moedas
 */
function clearAllCoins() {
  for (let i = 0; i < floatingCoins.length; i++) {
    if (floatingCoins[i]._pooled) {
      pools.coin.release(floatingCoins[i]);
    }
  }
  floatingCoins.length = 0;
}

// ================= SISTEMA DE GEMAS (MANTIDO COM POOLING) =================

/**
 * Spawn de gema usando pool
 */
function spawnGem(x, y) {
  const gem = pools.gem.acquire(x, y);
  if (gem) {
    floatingGems.push(gem);
  }
  return gem;
}

/**
 * Atualiza gemas flutuantes
 */
function updateFloatingGems(dt) {
  let writeIndex = 0;
  
  for (let readIndex = 0; readIndex < floatingGems.length; readIndex++) {
    const gem = floatingGems[readIndex];
    
    // Animação de flutuação e brilho
    gem.bobPhase += dt * 3;
    gem.sparklePhase += dt * 5;
    
    // Magnetismo em direção ao player (se próximo)
    if (player) {
      const dx = player.x - gem.x;
      const dy = player.y - gem.y;
      const distSq = dx * dx + dy * dy;
      const magnetRangeSq = CONFIG.COIN_MAGNET_RANGE * CONFIG.COIN_MAGNET_RANGE;
      
      if (distSq < magnetRangeSq) {
        const dist = Math.sqrt(distSq);
        const magnetForce = 350;
        gem.x += (dx / dist) * magnetForce * dt;
        gem.y += (dy / dist) * magnetForce * dt;
        
        // Coletado
        if (distSq < (player.r + gem.r) * (player.r + gem.r)) {
          gems += gem.value;
          createScorePopup(gem.x, gem.y, `+${gem.value} 💎`, '#a855f7');
          playSFX('gem');
          
          // Atualizar conquistas
          if (typeof updateAchievementProgress === 'function') {
            updateAchievementProgress('gems_collected', gem.value);
          }
          
          // Não adicionar ao writeIndex (remover)
          if (gem._pooled) {
            pools.gem.release(gem);
          }
          continue;
        }
      }
    }
    
    // Manter gema
    floatingGems[writeIndex] = gem;
    writeIndex++;
  }
  
  floatingGems.length = writeIndex;
}

/**
 * Desenha gemas flutuantes
 */
function drawFloatingGems(ctx) {
  for (let i = 0; i < floatingGems.length; i++) {
    const gem = floatingGems[i];
    const bobOffset = Math.sin(gem.bobPhase) * 4;
    const sparkle = Math.abs(Math.sin(gem.sparklePhase));
    
    ctx.save();
    
    // Brilho pulsante
    ctx.shadowColor = '#a855f7';
    ctx.shadowBlur = 10 + sparkle * 10;
    
    // Desenhar diamante
    ctx.fillStyle = '#a855f7';
    ctx.beginPath();
    ctx.moveTo(gem.x, gem.y + bobOffset - gem.r);
    ctx.lineTo(gem.x + gem.r, gem.y + bobOffset);
    ctx.lineTo(gem.x, gem.y + bobOffset + gem.r);
    ctx.lineTo(gem.x - gem.r, gem.y + bobOffset);
    ctx.closePath();
    ctx.fill();
    
    // Gradiente interno
    const gradient = ctx.createRadialGradient(
      gem.x, 
      gem.y + bobOffset, 
      0,
      gem.x, 
      gem.y + bobOffset, 
      gem.r
    );
    gradient.addColorStop(0, '#e9d5ff');
    gradient.addColorStop(0.5, '#c084fc');
    gradient.addColorStop(1, '#9333ea');
    
    ctx.fillStyle = gradient;
    ctx.fill();
    
    // Borda
    ctx.strokeStyle = '#7e22ce';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    
    // Facetas (detalhes)
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(gem.x, gem.y + bobOffset - gem.r);
    ctx.lineTo(gem.x, gem.y + bobOffset + gem.r);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(gem.x - gem.r, gem.y + bobOffset);
    ctx.lineTo(gem.x + gem.r, gem.y + bobOffset);
    ctx.stroke();
    
    // Brilho
    if (sparkle > 0.7) {
      ctx.fillStyle = `rgba(255,255,255,${(sparkle - 0.7) * 3})`;
      ctx.beginPath();
      ctx.arc(gem.x, gem.y + bobOffset, gem.r * 0.4, 0, Math.PI * 2);
      ctx.fill();
    }
    
    ctx.restore();
  }
}

/**
 * Limpa todas as gemas
 */
function clearAllGems() {
  for (let i = 0; i < floatingGems.length; i++) {
    if (floatingGems[i]._pooled) {
      pools.gem.release(floatingGems[i]);
    }
  }
  floatingGems.length = 0;
}

// ================= POWERUPS (EXEMPLO - PODE SER EXPANDIDO) =================

/**
 * Atualiza powerups (placeholder para sistema futuro)
 */
function updatePowerups(dt) {
  // Implementar sistema de powerups aqui se necessário
}

// ================= ESTATÍSTICAS DE DEBUG =================

/**
 * Mostra estatísticas de pools no console
 */
function logObjectPoolStats() {
  console.log('=== Object Pool Statistics ===');
  console.log('Fish:', pools.fish.getStats());
  console.log('Enemy:', pools.enemy.getStats());
  console.log('Particle:', pools.particle.getStats());
  console.log('Blood Particle:', pools.bloodParticle.getStats());
  console.log('Score Popup:', pools.scorePopup.getStats());
  console.log('Coin:', pools.coin.getStats());
  console.log('Gem:', pools.gem.getStats());
  console.log('=============================');
}

// Comando disponível no console para debugging
if (typeof window !== 'undefined') {
  window.logObjectPoolStats = logObjectPoolStats;
}
