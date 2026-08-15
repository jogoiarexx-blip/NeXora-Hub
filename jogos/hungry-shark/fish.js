// ================= SISTEMA DE PEIXES COM OBJECT POOLING =================
// OTIMIZADO: Usa pool de objetos para reduzir garbage collection
// MANTÉM: Todas as mecânicas e qualidade visual original

// ================= GERENCIAMENTO DE PEIXES =================

let fishes = []; // Array de peixes ativos (agora gerenciado pelo pool)

/**
 * Spawn de um novo peixe usando o pool
 */
function spawnFish() {
  // Limitar quantidade máxima
  if (fishes.length >= CONFIG.FISH.MAX_COUNT) {
    return null;
  }
  
  // Obter peixe do pool (já vem configurado)
  const fish = pools.fish.spawn();
  
  if (fish) {
    // Adicionar propriedades extras se necessário (para compatibilidade)
    if (!fish.finPhase) fish.finPhase = 0;
    
    fishes.push(fish);
  }
  
  return fish;
}

/**
 * Remove um peixe e retorna ao pool
 */
function removeFish(fish) {
  const index = fishes.indexOf(fish);
  if (index > -1) {
    fishes.splice(index, 1);
    pools.fish.release(fish);
  }
}

/**
 * Atualiza todos os peixes
 */
function updateFishes(dt) {
  // Atualizar cada peixe (usando for tradicional para melhor performance)
  for (let i = fishes.length - 1; i >= 0; i--) {
    const fish = fishes[i];
    updateFish(fish, dt);
    
    // Remover peixes muito longe da câmera (se existir sistema de câmera)
    if (typeof camera !== 'undefined' && camera) {
      const dx = fish.x - camera.x;
      const dy = fish.y - camera.y;
      const distSq = dx * dx + dy * dy;
      const maxDist = Math.max(camera.width, camera.height) * 2;
      
      // Se muito longe, remover e retornar ao pool
      if (distSq > maxDist * maxDist) {
        fishes.splice(i, 1);
        pools.fish.release(fish);
      }
    }
  }
}

/**
 * Atualiza um peixe individual (mantém lógica original)
 */
function updateFish(fish, dt) {
  // ✅ Atualizar habilidades especiais
  if (typeof fishAbilitySystem !== 'undefined' && fish.typeDef && fish.typeDef.abilities) {
    fishAbilitySystem.updateFishAbilities(fish, dt, player);
  }
  
  // ✅ Atualizar inflação do baiacu
  if (fish.inflated && typeof fishAbilitySystem !== 'undefined') {
    fishAbilitySystem.updateInflate(fish, dt);
  }
  
  // ✅ Atualizar explosão do bombfish
  if (fish.fuseActive && typeof fishAbilitySystem !== 'undefined') {
    fishAbilitySystem.updateExplosion(fish, dt);
  }
  
  // Comportamento de wandering suave (MANTIDO)
  fish.wanderTimer -= dt;
  if (fish.wanderTimer <= 0) {
    fish.wanderAngle = Math.random() * Math.PI * 2;
    fish.wanderTimer = randomRange(1, 3);
  }

  // Interpola suavemente para o ângulo de wander (MANTIDO)
  const angleDiff = fish.wanderAngle - fish.angle;
  fish.angle += Math.sin(angleDiff) * dt * 2;

  // Movimento (MANTIDO)
  fish.x += Math.cos(fish.angle) * fish.speed * dt;
  fish.y += Math.sin(fish.angle) * fish.speed * dt;

  // Atualizar animação de natação (MANTIDO - mais dinâmica)
  fish.swimPhase += dt * 8;
  
  // Animação de barbatanas (MANTIDO)
  if (!fish.finPhase) fish.finPhase = 0;
  fish.finPhase += dt * 10;

  // Wrap around das bordas (usar limites do mundo, não da tela) (MANTIDO)
  const margin = 100;
  const worldWidth = (typeof mapSystem !== 'undefined' && mapSystem) ? mapSystem.width : 3000;
  const worldHeight = (typeof mapSystem !== 'undefined' && mapSystem) ? mapSystem.height : 3000;
  
  if (fish.x < -margin) fish.x = worldWidth + margin;
  if (fish.x > worldWidth + margin) fish.x = -margin;
  if (fish.y < -margin) fish.y = worldHeight + margin;
  if (fish.y > worldHeight + margin) fish.y = -margin;
}

/**
 * Desenha todos os peixes
 */
function drawFishes(ctx) {
  // Desenhar em batch para melhor performance
  for (let i = 0; i < fishes.length; i++) {
    drawFish(ctx, fishes[i]);
  }
}

/**
 * Desenha um peixe com gráficos melhorados
 */
function drawFish(ctx, fish) {
  // Se tem renderizador avançado E características visuais definidas, usar ele
  if (typeof drawFishAdvanced === 'function' && fish.visualFeatures) {
    drawFishAdvanced(ctx, fish);
    return;
  }
  
  // Caso contrário, usar renderização padrão (fallback)
  ctx.save();
  ctx.translate(fish.x, fish.y);
  ctx.rotate(fish.angle);
  
  const bodyLength = fish.r * 2.2;
  const bodyWidth = fish.r * 1.3;
  const tailOffset = Math.sin(fish.swimPhase) * fish.r * 0.35;
  const finWave = Math.sin(fish.finPhase) * fish.r * 0.15;
  
  // Sombra do peixe (MANTIDO)
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.25)';
  ctx.shadowBlur = 8;
  ctx.shadowOffsetX = 3;
  ctx.shadowOffsetY = 3;
  
  // Corpo principal com gradiente (MANTIDO)
  const bodyGradient = ctx.createLinearGradient(-bodyLength*0.3, -bodyWidth*0.5, bodyLength*0.7, bodyWidth*0.5);
  
  // Cores variadas baseadas na cor do peixe (MANTIDO)
  const baseColor = fish.color;
  const darkColor = adjustColorBrightness(baseColor, -30);
  const lightColor = adjustColorBrightness(baseColor, 20);
  
  bodyGradient.addColorStop(0, darkColor);
  bodyGradient.addColorStop(0.4, baseColor);
  bodyGradient.addColorStop(0.8, lightColor);
  bodyGradient.addColorStop(1, baseColor);
  
  ctx.fillStyle = bodyGradient;
  ctx.beginPath();
  ctx.moveTo(bodyLength * 0.65, 0);
  ctx.bezierCurveTo(
    bodyLength * 0.5, -bodyWidth * 0.4,
    bodyLength * 0.3, -bodyWidth * 0.55,
    bodyLength * 0.1, -bodyWidth * 0.6
  );
  ctx.bezierCurveTo(
    -bodyLength * 0.1, -bodyWidth * 0.55,
    -bodyLength * 0.25, -bodyWidth * 0.4,
    -bodyLength * 0.35, -bodyWidth * 0.25
  );
  ctx.lineTo(-bodyLength * 0.45, 0);
  ctx.bezierCurveTo(
    -bodyLength * 0.25, bodyWidth * 0.4,
    -bodyLength * 0.1, bodyWidth * 0.55,
    bodyLength * 0.1, bodyWidth * 0.6
  );
  ctx.bezierCurveTo(
    bodyLength * 0.3, bodyWidth * 0.55,
    bodyLength * 0.5, bodyWidth * 0.4,
    bodyLength * 0.65, 0
  );
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  
  // Barriga mais clara (MANTIDO)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.beginPath();
  ctx.ellipse(0, bodyWidth * 0.15, bodyLength * 0.35, bodyWidth * 0.25, 0, 0, Math.PI * 2);
  ctx.fill();
  
  // Barbatana dorsal (MANTIDO)
  const dorsalGradient = ctx.createLinearGradient(0, -bodyWidth * 0.5, 0, -bodyWidth * 0.9);
  dorsalGradient.addColorStop(0, baseColor);
  dorsalGradient.addColorStop(1, lightColor);
  
  ctx.fillStyle = dorsalGradient;
  ctx.beginPath();
  ctx.moveTo(0, -bodyWidth * 0.6);
  ctx.bezierCurveTo(
    bodyLength * 0.1, -bodyWidth * 0.75 + finWave,
    bodyLength * 0.15, -bodyWidth * 0.9 + finWave,
    bodyLength * 0.12, -bodyWidth * 0.95 + finWave
  );
  ctx.bezierCurveTo(
    bodyLength * 0.18, -bodyWidth * 0.85 + finWave * 0.7,
    bodyLength * 0.25, -bodyWidth * 0.7 + finWave * 0.5,
    bodyLength * 0.3, -bodyWidth * 0.6
  );
  ctx.closePath();
  ctx.fill();
  
  // Barbatanas laterais (MANTIDO)
  ctx.fillStyle = adjustColorBrightness(baseColor, -10);
  
  // Barbatana superior
  ctx.save();
  ctx.globalAlpha = 0.8;
  ctx.beginPath();
  ctx.ellipse(
    bodyLength * 0.05, 
    -bodyWidth * 0.45 + finWave * 0.3, 
    bodyLength * 0.2, 
    bodyWidth * 0.12, 
    -0.4, 
    0, 
    Math.PI * 2
  );
  ctx.fill();
  ctx.restore();
  
  // Barbatana inferior
  ctx.save();
  ctx.globalAlpha = 0.8;
  ctx.beginPath();
  ctx.ellipse(
    bodyLength * 0.05, 
    bodyWidth * 0.45 - finWave * 0.3, 
    bodyLength * 0.2, 
    bodyWidth * 0.12, 
    0.4, 
    0, 
    Math.PI * 2
  );
  ctx.fill();
  ctx.restore();
  
  // Cauda com movimento fluido (MANTIDO)
  const tailGradient = ctx.createLinearGradient(-bodyLength * 0.45, 0, -bodyLength * 0.85, 0);
  tailGradient.addColorStop(0, baseColor);
  tailGradient.addColorStop(0.5, lightColor);
  tailGradient.addColorStop(1, adjustColorBrightness(baseColor, -20));
  
  ctx.fillStyle = tailGradient;
  ctx.beginPath();
  ctx.moveTo(-bodyLength * 0.45, 0);
  
  // Cauda superior
  ctx.bezierCurveTo(
    -bodyLength * 0.55, -bodyWidth * 0.25 + tailOffset * 0.5,
    -bodyLength * 0.7, -bodyWidth * 0.4 + tailOffset * 0.8,
    -bodyLength * 0.85, -bodyWidth * 0.5 + tailOffset
  );
  
  // Ponta da cauda
  ctx.bezierCurveTo(
    -bodyLength * 0.88, -bodyWidth * 0.45 + tailOffset * 0.9,
    -bodyLength * 0.88, -bodyWidth * 0.35 + tailOffset * 0.8,
    -bodyLength * 0.82, -bodyWidth * 0.2 + tailOffset * 0.6
  );
  
  // Centro da cauda
  ctx.lineTo(-bodyLength * 0.6, 0);
  
  // Cauda inferior
  ctx.bezierCurveTo(
    -bodyLength * 0.82, bodyWidth * 0.2 - tailOffset * 0.6,
    -bodyLength * 0.88, bodyWidth * 0.35 - tailOffset * 0.8,
    -bodyLength * 0.88, bodyWidth * 0.45 - tailOffset * 0.9
  );
  
  ctx.bezierCurveTo(
    -bodyLength * 0.7, bodyWidth * 0.4 - tailOffset * 0.8,
    -bodyLength * 0.55, bodyWidth * 0.25 - tailOffset * 0.5,
    -bodyLength * 0.45, 0
  );
  
  ctx.closePath();
  ctx.fill();
  
  // Detalhes da cauda (linhas) (MANTIDO)
  ctx.strokeStyle = adjustColorBrightness(baseColor, -40);
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.5;
  
  for (let i = 0; i < 3; i++) {
    const offset = (i - 1) * bodyWidth * 0.15;
    ctx.beginPath();
    ctx.moveTo(-bodyLength * 0.55, offset + tailOffset * (i === 0 ? 0.5 : i === 2 ? -0.5 : 0));
    ctx.lineTo(-bodyLength * 0.8, offset * 1.5 + tailOffset * (i === 0 ? 0.8 : i === 2 ? -0.8 : 0));
    ctx.stroke();
  }
  
  ctx.globalAlpha = 1;
  
  // Olho (MANTIDO - com detalhes)
  const eyeX = bodyLength * 0.4;
  const eyeY = -bodyWidth * 0.2;
  const eyeSize = fish.r * 0.15;
  
  // Branco do olho
  ctx.fillStyle = 'white';
  ctx.beginPath();
  ctx.arc(eyeX, eyeY, eyeSize, 0, Math.PI * 2);
  ctx.fill();
  
  // Íris
  ctx.fillStyle = '#2c3e50';
  ctx.beginPath();
  ctx.arc(eyeX + eyeSize * 0.1, eyeY, eyeSize * 0.7, 0, Math.PI * 2);
  ctx.fill();
  
  // Pupila
  ctx.fillStyle = 'black';
  ctx.beginPath();
  ctx.arc(eyeX + eyeSize * 0.15, eyeY, eyeSize * 0.4, 0, Math.PI * 2);
  ctx.fill();
  
  // Brilho no olho
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.beginPath();
  ctx.arc(eyeX + eyeSize * 0.3, eyeY - eyeSize * 0.2, eyeSize * 0.25, 0, Math.PI * 2);
  ctx.fill();
  
  // Escamas (detalhes sutis) (MANTIDO)
  ctx.save();
  ctx.globalAlpha = 0.15;
  ctx.strokeStyle = 'white';
  ctx.lineWidth = 0.5;
  
  for (let i = -2; i <= 2; i++) {
    for (let j = -1; j <= 1; j++) {
      ctx.beginPath();
      ctx.arc(
        bodyLength * 0.1 + i * fish.r * 0.25,
        j * bodyWidth * 0.25,
        fish.r * 0.15,
        0,
        Math.PI * 2
      );
      ctx.stroke();
    }
  }
  
  ctx.restore();
  
  ctx.restore();
}

/**
 * Verifica colisão com player (mantém lógica original)
 */
function checkFishPlayerCollision() {
  if (!player) return;
  
  for (let i = fishes.length - 1; i >= 0; i--) {
    const fish = fishes[i];
    const dx = fish.x - player.x;
    const dy = fish.y - player.y;
    const distSq = dx * dx + dy * dy;
    const minDist = fish.r + player.r;
    
    if (distSq < minDist * minDist) {
      // Player comeu o peixe
      if (player.r > fish.r) {
        // Adicionar comida/xp
        player.eat(fish.food);
        xp += fish.xp * (1 + upgrades.xpBonus * 0.1);
        
        // Efeitos visuais
        createParticles(fish.x, fish.y, fish.color, 8);
        createScorePopup(fish.x, fish.y, `+${fish.xp} XP`, '#fbbf24');
        
        // Sons
        playSFX('eat');
        
        // Spawn moeda/gema ocasionalmente
        if (Math.random() < CONFIG.COIN_SPAWN_CHANCE) {
          spawnCoin(fish.x, fish.y);
        }
        if (Math.random() < CONFIG.GEM_SPAWN_CHANCE) {
          spawnGem(fish.x, fish.y);
        }
        
        // Atualizar conquistas
        if (typeof updateAchievementProgress === 'function') {
          updateAchievementProgress('fish_eaten', 1);
        }
        
        // Remover peixe e retornar ao pool
        fishes.splice(i, 1);
        pools.fish.release(fish);
      }
      // Peixe maior machuca o player
      else {
        player.takeDamage(10);
        createBloodParticles(player.x, player.y, 5);
        playSFX('damage');
      }
    }
  }
}

/**
 * Limpa todos os peixes (retorna ao pool)
 */
function clearAllFishes() {
  while (fishes.length > 0) {
    const fish = fishes.pop();
    pools.fish.release(fish);
  }
}

/**
 * Desenha estatísticas de debug
 */
function drawFishDebug(ctx) {
  if (!window.showFishDebug) return;
  
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.fillRect(10, 100, 200, 60);
  
  ctx.fillStyle = '#00ff00';
  ctx.font = '14px monospace';
  ctx.textAlign = 'left';
  
  const stats = pools.fish.getStats();
  ctx.fillText(`Peixes Ativos: ${fishes.length}`, 20, 120);
  ctx.fillText(`Pool Disponível: ${stats.available}`, 20, 140);
  ctx.fillText(`Pool Total: ${stats.total}`, 20, 160);
  
  ctx.restore();
}
