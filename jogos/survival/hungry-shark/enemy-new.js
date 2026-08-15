// ================= SISTEMA DE INIMIGOS AVANÇADO (VERSÃO CORRIGIDA) =================
// Sistema completo com múltiplos tipos, IA melhorada e gráficos únicos
// REQUER: enemy-types.js e enemy-renderer.js
// ✅ CORREÇÃO BUG #2: Adicionadas verificações de segurança

// ================= GERENCIAMENTO DE INIMIGOS =================

let enemies = []; // Array de inimigos ativos

/**
 * Spawn de um novo inimigo com tipo aleatório
 * ✅ CORRIGIDO: Adiciona verificações de segurança
 */
function spawnEnemy() {
  // Limitar quantidade máxima
  if (enemies.length >= CONFIG.ENEMY.MAX_COUNT) {
    return null;
  }
  
  // ✅ CORREÇÃO: Verificar se funções necessárias existem
  if (typeof selectRandomEnemyType !== 'function') {
    console.error('⚠️ selectRandomEnemyType não está definida. Verifique enemy-types.js');
    return null;
  }
  
  if (typeof createEnemyFromType !== 'function') {
    console.error('⚠️ createEnemyFromType não está definida. Verifique enemy-types.js');
    return null;
  }
  
  // Selecionar tipo aleatório
  const enemyType = selectRandomEnemyType();
  
  // ✅ CORREÇÃO: Verificar se tipo é válido
  if (!enemyType) {
    console.error('⚠️ Tipo de inimigo inválido retornado');
    return null;
  }
  
  // Posição de spawn (fora da tela)
  const spawnPos = getEnemySpawnPosition();
  
  // Criar inimigo do tipo selecionado
  const enemy = createEnemyFromType(enemyType, spawnPos.x, spawnPos.y);
  
  // ✅ CORREÇÃO: Verificar se inimigo foi criado com sucesso
  if (!enemy) {
    console.error('⚠️ Falha ao criar inimigo');
    return null;
  }
  
  enemies.push(enemy);
  
  return enemy;
}

/**
 * Retorna posição de spawn aleatória fora da tela
 */
function getEnemySpawnPosition() {
  const worldWidth = (typeof mapSystem !== 'undefined' && mapSystem) ? mapSystem.width : 3000;
  const worldHeight = (typeof mapSystem !== 'undefined' && mapSystem) ? mapSystem.height : 3000;
  
  const margin = 200;
  const side = Math.floor(Math.random() * 4);
  
  let x, y;
  
  switch(side) {
    case 0: // Top
      x = Math.random() * worldWidth;
      y = -margin;
      break;
    case 1: // Right
      x = worldWidth + margin;
      y = Math.random() * worldHeight;
      break;
    case 2: // Bottom
      x = Math.random() * worldWidth;
      y = worldHeight + margin;
      break;
    case 3: // Left
      x = -margin;
      y = Math.random() * worldHeight;
      break;
  }
  
  return { x, y };
}

/**
 * Remove um inimigo
 * ✅ CORRIGIDO: Verifica se inimigo existe antes de remover
 */
function removeEnemy(enemy) {
  // ✅ CORREÇÃO: Verificar se inimigo é válido
  if (!enemy) {
    return;
  }
  
  const index = enemies.indexOf(enemy);
  if (index > -1) {
    enemies.splice(index, 1);
  }
}

/** Limpa todos os inimigos ativos ao reiniciar/voltar ao menu. */
function clearAllEnemies() {
  enemies.length = 0;
}

/**
 * Atualiza todos os inimigos
 * ✅ CORRIGIDO: Adiciona verificações de segurança
 */
function updateEnemies(dt) {
  // ✅ CORREÇÃO: Verificar se dt é válido
  if (!dt || dt <= 0 || dt > 1) {
    return; // Evitar frames muito grandes que podem causar problemas
  }
  
  // Atualizar cada inimigo
  for (let i = enemies.length - 1; i >= 0; i--) {
    const enemy = enemies[i];
    
    // ✅ CORREÇÃO: Verificar se inimigo ainda existe
    if (!enemy) {
      enemies.splice(i, 1);
      continue;
    }
    
    updateEnemy(enemy, dt);
    
    // Remover inimigos muito longe da câmera
    if (typeof camera !== 'undefined' && camera) {
      const dx = enemy.x - camera.x;
      const dy = enemy.y - camera.y;
      const distSq = dx * dx + dy * dy;
      const maxDist = Math.max(camera.width, camera.height) * 2.5;
      
      if (distSq > maxDist * maxDist) {
        enemies.splice(i, 1);
      }
    }
  }
}

/**
 * Atualiza um inimigo individual com IA baseada em comportamento
 * ✅ CORRIGIDO: Adiciona verificações de propriedades essenciais
 */
function updateEnemy(enemy, dt) {
  // ✅ CORREÇÃO: Verificar se player existe
  if (!player) {
    return;
  }
  
  // ✅ CORREÇÃO: Verificar se propriedades essenciais existem
  if (enemy.x === undefined || enemy.y === undefined || !enemy.r) {
    console.warn('⚠️ Inimigo com propriedades inválidas:', enemy);
    return;
  }
  
  // Calcular distância até o player
  const dx = player.x - enemy.x;
  const dy = player.y - enemy.y;
  const distToPlayer = Math.sqrt(dx * dx + dy * dy);
  
  // ✅ CORREÇÃO: Garantir que comportamento existe
  if (!enemy.behavior) {
    enemy.behavior = 'patrol'; // Comportamento padrão
  }
  
  // Máquina de estados baseada no comportamento do inimigo
  switch(enemy.behavior) {
    case 'aggressive':
      updateAggressiveBehavior(enemy, dt, dx, dy, distToPlayer);
      break;
    case 'defensive':
      updateDefensiveBehavior(enemy, dt, dx, dy, distToPlayer);
      break;
    case 'passive':
      updatePassiveBehavior(enemy, dt, dx, dy, distToPlayer);
      break;
    case 'patrol':
    default:
      updatePatrolBehavior(enemy, dt, dx, dy, distToPlayer);
      break;
  }
  
  // Limites do mundo
  if (typeof mapSystem !== 'undefined' && mapSystem) {
    mapSystem.enforceBoundaries(enemy);
  }
  
  // ✅ CORREÇÃO: Atualizar TODAS as fases de animação
  enemy.swimPhase = (enemy.swimPhase || 0) + dt * 8;
  enemy.finPhase = (enemy.finPhase || 0) + dt * 10;
  
  // Evitar overflow (boa prática)
  if (enemy.swimPhase > Math.PI * 2) enemy.swimPhase -= Math.PI * 2;
  if (enemy.finPhase > Math.PI * 2) enemy.finPhase -= Math.PI * 2;
}

/**
 * Comportamento agressivo - persegue o player
 */
function updateAggressiveBehavior(enemy, dt, dx, dy, distToPlayer) {
  const aggroRange = enemy.aggroRange || 300;
  
  if (distToPlayer < aggroRange) {
    // Perseguir player
    const targetAngle = Math.atan2(dy, dx);
    
    // Rotação suave
    let angleDiff = targetAngle - enemy.angle;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
    enemy.angle += angleDiff * dt * 4;
    
    // Movimento mais rápido ao perseguir
    const chaseSpeed = enemy.speed * 1.5;
    enemy.x += Math.cos(enemy.angle) * chaseSpeed * dt;
    enemy.y += Math.sin(enemy.angle) * chaseSpeed * dt;
    
    enemy.state = 'chase';
  } else {
    // Patrulha quando longe
    updatePatrolBehavior(enemy, dt, dx, dy, distToPlayer);
  }
}

/**
 * Comportamento defensivo - foge do player se for menor
 */
function updateDefensiveBehavior(enemy, dt, dx, dy, distToPlayer) {
  const fleeRange = enemy.aggroRange || 250;
  
  if (distToPlayer < fleeRange && player.r > enemy.r) {
    // Fugir do player
    const fleeAngle = Math.atan2(-dy, -dx);
    
    // Rotação suave
    let angleDiff = fleeAngle - enemy.angle;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
    enemy.angle += angleDiff * dt * 5;
    
    // Movimento rápido ao fugir
    const fleeSpeed = enemy.speed * 1.8;
    enemy.x += Math.cos(enemy.angle) * fleeSpeed * dt;
    enemy.y += Math.sin(enemy.angle) * fleeSpeed * dt;
    
    enemy.state = 'flee';
  } else {
    // Patrulha quando seguro
    updatePatrolBehavior(enemy, dt, dx, dy, distToPlayer);
  }
}

/**
 * Comportamento passivo - apenas nada pelo mapa
 */
function updatePassiveBehavior(enemy, dt, dx, dy, distToPlayer) {
  updatePatrolBehavior(enemy, dt, dx, dy, distToPlayer);
}

/**
 * Comportamento de patrulha - movimento aleatório
 */
function updatePatrolBehavior(enemy, dt, dx, dy, distToPlayer) {
  enemy.state = 'patrol';
  
  // Inicializar waypoint se não existir
  if (!enemy.waypoint) {
    enemy.waypoint = {
      x: enemy.x + (Math.random() - 0.5) * 500,
      y: enemy.y + (Math.random() - 0.5) * 500,
      timer: 0
    };
  }
  
  // Mover em direção ao waypoint
  const wpDx = enemy.waypoint.x - enemy.x;
  const wpDy = enemy.waypoint.y - enemy.y;
  const distToWaypoint = Math.sqrt(wpDx * wpDx + wpDy * wpDy);
  
  if (distToWaypoint < 50 || enemy.waypoint.timer > 8) {
    // Escolher novo waypoint
    enemy.waypoint.x = enemy.x + (Math.random() - 0.5) * 500;
    enemy.waypoint.y = enemy.y + (Math.random() - 0.5) * 500;
    enemy.waypoint.timer = 0;
  }
  
  enemy.waypoint.timer += dt;
  
  // Rotação suave em direção ao waypoint
  const targetAngle = Math.atan2(wpDy, wpDx);
  let angleDiff = targetAngle - enemy.angle;
  while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
  while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
  enemy.angle += angleDiff * dt * 2;
  
  // Movimento normal
  enemy.x += Math.cos(enemy.angle) * enemy.speed * dt;
  enemy.y += Math.sin(enemy.angle) * enemy.speed * dt;
}

/**
 * Desenha todos os inimigos
 * ✅ CORRIGIDO: Adiciona verificações antes de desenhar
 */
function drawEnemies(ctx) {
  // ✅ CORREÇÃO: Verificar se contexto existe
  if (!ctx) {
    return;
  }
  
  // ✅ CORREÇÃO: Verificar se função de desenho existe
  if (typeof drawEnemyAdvanced !== 'function') {
    console.error('⚠️ drawEnemyAdvanced não está definida. Verifique enemy-renderer.js');
    return;
  }
  
  // Ordenar inimigos por Y para correto Z-ordering
  const sorted = [...enemies].sort((a, b) => a.y - b.y);
  
  // Desenhar cada inimigo
  for (let i = 0; i < sorted.length; i++) {
    const enemy = sorted[i];
    
    // ✅ CORREÇÃO: Verificar se inimigo é válido antes de desenhar
    if (!enemy || enemy.x === undefined || enemy.y === undefined) {
      continue;
    }
    
    drawEnemyAdvanced(ctx, sorted[i]);
  }
}

/**
 * Desenha debug info de inimigos
 */
function drawEnemyDebug(ctx) {
  if (!ctx) return;
  
  ctx.save();
  ctx.fillStyle = 'white';
  ctx.font = '14px monospace';
  ctx.fillText(`Inimigos ativos: ${enemies.length}/${CONFIG.ENEMY.MAX_COUNT}`, 10, 100);
  
  // Info de cada inimigo
  enemies.forEach((enemy, i) => {
    if (!enemy) return;
    
    const stateColor = {
      'chase': '#ff4444',
      'flee': '#44ff44',
      'patrol': '#4444ff'
    }[enemy.state] || '#ffffff';
    
    ctx.fillStyle = stateColor;
    ctx.fillText(
      `#${i}: ${enemy.type || 'unknown'} [${enemy.state || 'unknown'}] @ (${Math.floor(enemy.x)}, ${Math.floor(enemy.y)})`,
      10,
      120 + i * 20
    );
  });
  
  ctx.restore();
}

/**
 * Limpa todos os inimigos (útil ao voltar ao menu)
 */
function clearEnemies() {
  enemies = [];
}

// ✅ LOG DE INICIALIZAÇÃO
console.log('✅ Sistema de inimigos avançado carregado (versão corrigida)');
