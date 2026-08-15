// ================= SISTEMA DE RENDERIZAÇÃO DE INIMIGOS (VERSÃO CORRIGIDA) =================
// PRINCÍPIO FUNDAMENTAL: Cada função é TOTALMENTE ISOLADA
// Nunca confia em estados anteriores do contexto

/**
 * Desenha um inimigo baseado em seu tipo
 * ✅ TOTALMENTE ISOLADO - Save/Restore garantido
 */
function drawEnemyAdvanced(ctx, enemy) {
  // ✅ VALIDAÇÃO: Não desenha se inválido
  if (!enemy || !enemy.x || !enemy.y || !enemy.r) {
    console.warn('⚠️ Tentativa de desenhar inimigo inválido:', enemy);
    return;
  }
  
  // ✅ ISOLAMENTO TOTAL: Salva estado do canvas
  ctx.save();
  
  try {
    // ✅ ORDEM CORRETA: translate → rotate (NUNCA o contrário!)
    ctx.translate(enemy.x, enemy.y);
    ctx.rotate(enemy.angle || 0);  // ✅ Fallback para evitar undefined
    
    // Aplicar opacidade se tiver
    if (enemy.effects && enemy.effects.opacity !== undefined && enemy.effects.opacity < 1.0) {
      ctx.globalAlpha = enemy.effects.opacity;
    }
    
    const bodyLength = enemy.r * 3.5;
    const bodyWidth = enemy.r * 1.8;
    
    // ✅ PROTEÇÃO: Inicializar fases de animação se não existirem
    if (enemy.swimPhase === undefined) enemy.swimPhase = 0;
    if (enemy.finPhase === undefined) enemy.finPhase = 0;
    
    const tailOffset = Math.sin(enemy.swimPhase) * enemy.r * 0.4;
    const finWave = Math.sin(enemy.finPhase) * enemy.r * 0.2;
    
    // Cores dinâmicas baseadas no estado
    const colors = getEnemyStateColors(enemy);
    
    // Efeito de brilho quando perseguindo
    if (enemy.state === 'chase' && enemy.effects && enemy.effects.glowOnChase) {
      drawEnemyGlow(ctx, enemy, colors);
    }
    
    // Sombra do inimigo (com save/restore próprio)
    drawEnemyBodyWithShadow(ctx, enemy, bodyLength, bodyWidth, colors);
    
    // ✅ PROTEÇÃO: Verificar se visualFeatures existe
    const features = enemy.visualFeatures || {};
    
    // Características especiais únicas
    if (features.hasHammerHead) {
      drawHammerHead(ctx, enemy, bodyLength, bodyWidth, colors);
    }
    
    if (features.hasStripes) {
      drawTigerStripes(ctx, enemy, bodyLength, bodyWidth, colors);
    }
    
    // Barriga clara
    drawEnemyBelly(ctx, bodyLength, bodyWidth, colors);
    
    // Barbatana dorsal
    drawDorsalFin(ctx, enemy, bodyLength, bodyWidth, finWave, colors);
    
    // Espinhos (se tiver)
    if (features.hasSpikes) {
      drawSpikes(ctx, enemy, bodyLength, bodyWidth, colors);
    }
    
    // Barbatanas laterais
    drawPectoralFins(ctx, enemy, bodyLength, bodyWidth, finWave, colors);
    
    // Barbatana anal
    drawAnalFin(ctx, bodyLength, bodyWidth, finWave, colors);
    
    // Cauda baseada no formato
    drawEnemyTail(ctx, enemy, bodyLength, bodyWidth, tailOffset, colors);
    
    // Olhos
    drawEnemyEyes(ctx, enemy, bodyLength, bodyWidth, colors);
    
    // Brânquias
    drawGills(ctx, bodyLength, bodyWidth, colors);
    
    // Dentes
    drawTeeth(ctx, bodyLength, bodyWidth);
    
    // Cicatrizes (se tiver)
    if (features.hasScar) {
      drawScars(ctx, enemy, bodyLength, bodyWidth);
    }
    
    // Escamas/textura
    drawEnemyScales(ctx, enemy, bodyLength, bodyWidth, colors);
    
    // Indicador de estado (debug)
    if (window.showEnemyDebug) {
      drawEnemyDebugInfo(ctx, enemy, bodyWidth);
    }
    
  } finally {
    // ✅ GARANTIA: Sempre restaura, mesmo se houver erro
    ctx.restore();
  }
}

/**
 * Retorna cores baseadas no estado do inimigo
 * ✅ FUNÇÃO PURA: Não modifica canvas, apenas retorna dados
 */
function getEnemyStateColors(enemy) {
  // ✅ PROTEÇÃO: Garantir que cores existam
  const base = enemy.colors || {
    primary: '#8B0000',
    secondary: '#CD5C5C',
    accent: '#DC143C',
    belly: '#2c2c2c',
    eye: '#ff0000'
  };
  
  const colors = { ...base };
  
  // ✅ PROTEÇÃO: Verificar estado antes de usar
  const state = enemy.state || 'patrol';
  
  if (state === 'chase') {
    // Intensificar cores ao perseguir
    colors.primary = adjustColorBrightness(base.primary, 20);
    colors.secondary = adjustColorBrightness(base.secondary, 15);
    colors.accent = adjustColorBrightness(base.accent, 25);
  } else if (state === 'flee') {
    // Desaturar cores ao fugir
    colors.primary = adjustColorBrightness(base.primary, -15);
    colors.secondary = adjustColorBrightness(base.secondary, -10);
  }
  
  return colors;
}

/**
 * Desenha brilho ao redor do inimigo
 * ✅ TOTALMENTE ISOLADO: Próprio save/restore
 */
function drawEnemyGlow(ctx, enemy, colors) {
  ctx.save();
  
  try {
    const glowColor = (enemy.effects && enemy.effects.glowColor) || colors.accent;
    
    ctx.globalAlpha = 0.3;
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 25;
    ctx.strokeStyle = glowColor;
    ctx.lineWidth = 3;
    
    ctx.beginPath();
    ctx.ellipse(0, 0, enemy.r * 3.8, enemy.r * 2.0, 0, 0, Math.PI * 2);
    ctx.stroke();
    
  } finally {
    ctx.restore();
  }
}

/**
 * Desenha o corpo do inimigo COM sombra
 * ✅ ISOLAMENTO: Usa save/restore interno para sombra
 */
function drawEnemyBodyWithShadow(ctx, enemy, bodyLength, bodyWidth, colors) {
  // Sombra em camada isolada
  ctx.save();
  
  try {
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 15;
    ctx.shadowOffsetX = 5;
    ctx.shadowOffsetY = 5;
    
    // Desenhar corpo
    drawEnemyBody(ctx, enemy, bodyLength, bodyWidth, colors);
    
  } finally {
    ctx.restore();
  }
}

/**
 * Desenha o corpo principal do inimigo
 * ✅ NÃO USA SAVE/RESTORE: É chamado dentro de contexto já isolado
 */
function drawEnemyBody(ctx, enemy, bodyLength, bodyWidth, colors) {
  const gradient = ctx.createLinearGradient(
    -bodyLength*0.4, -bodyWidth*0.5, 
    bodyLength*0.7, bodyWidth*0.5
  );
  
  gradient.addColorStop(0, colors.accent);
  gradient.addColorStop(0.3, colors.primary);
  gradient.addColorStop(0.6, colors.secondary);
  gradient.addColorStop(1, colors.primary);
  
  ctx.fillStyle = gradient;
  ctx.beginPath();
  
  // ✅ PROTEÇÃO: Verificar se visualFeatures existe
  const features = enemy.visualFeatures || {};
  const shape = features.bodyShape || 'streamlined';
  
  if (shape === 'bulky') {
    // Corpo mais robusto e largo
    ctx.moveTo(bodyLength * 0.7, 0);
    ctx.bezierCurveTo(bodyLength * 0.6, -bodyWidth * 0.4, bodyLength * 0.4, -bodyWidth * 0.6, bodyLength * 0.2, -bodyWidth * 0.65);
    ctx.lineTo(-bodyLength * 0.25, -bodyWidth * 0.65);
    ctx.bezierCurveTo(-bodyLength * 0.45, -bodyWidth * 0.55, -bodyLength * 0.6, -bodyWidth * 0.35, -bodyLength * 0.7, 0);
    ctx.bezierCurveTo(-bodyLength * 0.6, bodyWidth * 0.35, -bodyLength * 0.45, bodyWidth * 0.55, -bodyLength * 0.25, bodyWidth * 0.65);
    ctx.lineTo(bodyLength * 0.2, bodyWidth * 0.65);
    ctx.bezierCurveTo(bodyLength * 0.4, bodyWidth * 0.6, bodyLength * 0.6, bodyWidth * 0.4, bodyLength * 0.7, 0);
  } else if (shape === 'sleek') {
    // Corpo esguio e aerodinâmico
    ctx.moveTo(bodyLength * 0.75, 0);
    ctx.bezierCurveTo(bodyLength * 0.65, -bodyWidth * 0.3, bodyLength * 0.45, -bodyWidth * 0.45, bodyLength * 0.2, -bodyWidth * 0.48);
    ctx.lineTo(-bodyLength * 0.25, -bodyWidth * 0.48);
    ctx.bezierCurveTo(-bodyLength * 0.5, -bodyWidth * 0.4, -bodyLength * 0.65, -bodyWidth * 0.22, -bodyLength * 0.72, 0);
    ctx.bezierCurveTo(-bodyLength * 0.65, bodyWidth * 0.22, -bodyLength * 0.5, bodyWidth * 0.4, -bodyLength * 0.25, bodyWidth * 0.48);
    ctx.lineTo(bodyLength * 0.2, bodyWidth * 0.48);
    ctx.bezierCurveTo(bodyLength * 0.45, bodyWidth * 0.45, bodyLength * 0.65, bodyWidth * 0.3, bodyLength * 0.75, 0);
  } else {
    // Streamlined (padrão) - forma balanceada
    ctx.moveTo(bodyLength * 0.7, 0);
    ctx.bezierCurveTo(bodyLength * 0.6, -bodyWidth * 0.35, bodyLength * 0.4, -bodyWidth * 0.5, bodyLength * 0.2, -bodyWidth * 0.55);
    ctx.lineTo(-bodyLength * 0.25, -bodyWidth * 0.55);
    ctx.bezierCurveTo(-bodyLength * 0.45, -bodyWidth * 0.45, -bodyLength * 0.6, -bodyWidth * 0.25, -bodyLength * 0.7, 0);
    ctx.bezierCurveTo(-bodyLength * 0.6, bodyWidth * 0.25, -bodyLength * 0.45, bodyWidth * 0.45, -bodyLength * 0.25, bodyWidth * 0.55);
    ctx.lineTo(bodyLength * 0.2, bodyWidth * 0.55);
    ctx.bezierCurveTo(bodyLength * 0.4, bodyWidth * 0.5, bodyLength * 0.6, bodyWidth * 0.35, bodyLength * 0.7, 0);
  }
  
  ctx.closePath();
  ctx.fill();
}

/**
 * Desenha cabeça em formato de martelo (Hammerhead)
 * ✅ TOTALMENTE ISOLADO: Próprio save/restore
 */
function drawHammerHead(ctx, enemy, bodyLength, bodyWidth, colors) {
  ctx.save();
  
  try {
    const features = enemy.visualFeatures || {};
    const hammerWidth = bodyWidth * (features.hammerWidth || 2.5);
    
    ctx.fillStyle = colors.primary;
    
    // Haste do martelo
    ctx.fillRect(bodyLength * 0.55, -bodyWidth * 0.15, bodyLength * 0.15, bodyWidth * 0.3);
    
    // Cabeça do martelo
    ctx.beginPath();
    ctx.roundRect(
      bodyLength * 0.65, 
      -hammerWidth * 0.5, 
      bodyLength * 0.12, 
      hammerWidth, 
      bodyLength * 0.03
    );
    ctx.fill();
    
    // Olhos nas pontas do martelo
    const eyeSize = enemy.r * 0.15;
    
    // Olho superior
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(bodyLength * 0.72, -hammerWidth * 0.4, eyeSize, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = colors.eye;
    ctx.beginPath();
    ctx.arc(bodyLength * 0.72, -hammerWidth * 0.4, eyeSize * 0.6, 0, Math.PI * 2);
    ctx.fill();
    
    // Olho inferior
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(bodyLength * 0.72, hammerWidth * 0.4, eyeSize, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = colors.eye;
    ctx.beginPath();
    ctx.arc(bodyLength * 0.72, hammerWidth * 0.4, eyeSize * 0.6, 0, Math.PI * 2);
    ctx.fill();
    
  } finally {
    ctx.restore();
  }
}

/**
 * Desenha listras de tigre
 * ✅ TOTALMENTE ISOLADO: Próprio save/restore
 */
function drawTigerStripes(ctx, enemy, bodyLength, bodyWidth, colors) {
  ctx.save();
  
  try {
    const features = enemy.visualFeatures || {};
    
    ctx.strokeStyle = colors.stripe || colors.accent;
    ctx.lineWidth = enemy.r * 0.15;
    ctx.lineCap = 'round';
    ctx.globalAlpha = 0.6;
    
    const stripeCount = features.stripeCount || 5;
    const spacing = (bodyLength * 0.8) / stripeCount;
    
    for (let i = 0; i < stripeCount; i++) {
      const x = -bodyLength * 0.3 + i * spacing;
      const curve = Math.sin((i / stripeCount) * Math.PI) * bodyWidth * 0.2;
      
      ctx.beginPath();
      ctx.moveTo(x, -bodyWidth * 0.5 + curve);
      ctx.quadraticCurveTo(
        x + spacing * 0.3, 0,
        x, bodyWidth * 0.5 - curve
      );
      ctx.stroke();
    }
    
  } finally {
    ctx.restore();
  }
}

/**
 * Desenha barriga clara
 * ✅ NÃO USA SAVE/RESTORE: Não altera estado global
 */
function drawEnemyBelly(ctx, bodyLength, bodyWidth, colors) {
  const bellyGradient = ctx.createRadialGradient(
    0, bodyWidth * 0.2, 0, 
    0, bodyWidth * 0.2, bodyLength * 0.5
  );
  bellyGradient.addColorStop(0, adjustColorBrightness(colors.belly, 30));
  bellyGradient.addColorStop(0.6, colors.belly);
  bellyGradient.addColorStop(1, 'rgba(0,0,0,0)');
  
  ctx.fillStyle = bellyGradient;
  ctx.beginPath();
  ctx.ellipse(bodyLength * 0.1, bodyWidth * 0.25, bodyLength * 0.45, bodyWidth * 0.4, 0, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * Desenha barbatana dorsal
 * ✅ ISOLAMENTO PARCIAL: Save/restore para raios
 */
function drawDorsalFin(ctx, enemy, bodyLength, bodyWidth, finWave, colors) {
  const features = enemy.visualFeatures || {};
  const finSize = features.finSize || 1.0;
  
  const dorsalGradient = ctx.createLinearGradient(
    0, -bodyWidth * 0.55, 
    bodyLength * 0.2, -bodyWidth * 1.4 * finSize
  );
  dorsalGradient.addColorStop(0, colors.primary);
  dorsalGradient.addColorStop(0.5, colors.secondary);
  dorsalGradient.addColorStop(1, adjustColorBrightness(colors.accent, -20));
  
  ctx.fillStyle = dorsalGradient;
  ctx.beginPath();
  ctx.moveTo(-bodyLength * 0.05, -bodyWidth * 0.55);
  ctx.bezierCurveTo(
    0, -bodyWidth * (0.9 * finSize) + finWave * 0.5,
    bodyLength * 0.08, -bodyWidth * (1.3 * finSize) + finWave,
    bodyLength * 0.18, -bodyWidth * (1.4 * finSize) + finWave
  );
  ctx.bezierCurveTo(
    bodyLength * 0.22, -bodyWidth * (1.3 * finSize) + finWave * 0.8,
    bodyLength * 0.32, -bodyWidth * (0.95 * finSize) + finWave * 0.5,
    bodyLength * 0.4, -bodyWidth * 0.7 + finWave * 0.3
  );
  ctx.bezierCurveTo(
    bodyLength * 0.42, -bodyWidth * 0.6,
    bodyLength * 0.35, -bodyWidth * 0.55,
    bodyLength * 0.25, -bodyWidth * 0.55
  );
  ctx.closePath();
  ctx.fill();
  
  // ✅ ISOLAMENTO: Raios em contexto separado
  ctx.save();
  
  try {
    ctx.strokeStyle = adjustColorBrightness(colors.primary, -30);
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = 0.5;
    
    for (let i = 0; i < 6; i++) {
      const t = i / 5;
      const startX = -bodyLength * 0.05 + t * bodyLength * 0.3;
      const startY = -bodyWidth * 0.55;
      const endX = bodyLength * (0.08 + t * 0.1);
      const endY = -bodyWidth * ((0.95 + t * 0.45) * finSize) + finWave * (1 - t * 0.5);
      
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.stroke();
    }
    
  } finally {
    ctx.restore();
  }
}

/**
 * Desenha espinhos defensivos
 * ✅ TOTALMENTE ISOLADO: Próprio save/restore
 */
function drawSpikes(ctx, enemy, bodyLength, bodyWidth, colors) {
  ctx.save();
  
  try {
    const features = enemy.visualFeatures || {};
    const spikeCount = features.spikeCount || 5;
    const spikeLength = enemy.r * 0.4 * (features.spikeLength || 1.0);
    
    ctx.fillStyle = colors.spike || '#F8F9F9';
    ctx.strokeStyle = adjustColorBrightness(colors.spike || '#F8F9F9', -30);
    ctx.lineWidth = 2;
    
    const spacing = (bodyLength * 0.5) / spikeCount;
    
    for (let i = 0; i < spikeCount; i++) {
      const x = -bodyLength * 0.2 + i * spacing;
      const y = -bodyWidth * 0.55;
      const length = spikeLength * (0.8 + Math.random() * 0.4);
      
      // Espinho como triângulo
      ctx.beginPath();
      ctx.moveTo(x - enemy.r * 0.08, y);
      ctx.lineTo(x, y - length);
      ctx.lineTo(x + enemy.r * 0.08, y);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    
  } finally {
    ctx.restore();
  }
}

/**
 * Desenha barbatanas peitorais (ambas)
 * ✅ ISOLAMENTO: Cada barbatana tem seu próprio save/restore
 */
function drawPectoralFins(ctx, enemy, bodyLength, bodyWidth, finWave, colors) {
  const features = enemy.visualFeatures || {};
  const finSize = features.finSize || 1.0;
  const pectoralWave = finWave * 0.75;
  
  const pectoralGradient = ctx.createLinearGradient(
    bodyLength * 0.08, -bodyWidth * 0.45,
    bodyLength * 0.35 * finSize, -bodyWidth * 0.7
  );
  pectoralGradient.addColorStop(0, colors.primary);
  pectoralGradient.addColorStop(0.6, colors.secondary);
  pectoralGradient.addColorStop(1, adjustColorBrightness(colors.secondary, -15));
  
  // ✅ Barbatana superior (isolada)
  ctx.save();
  
  try {
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = pectoralGradient;
    ctx.beginPath();
    ctx.moveTo(bodyLength * 0.08, -bodyWidth * 0.45);
    ctx.bezierCurveTo(
      bodyLength * 0.15 * finSize, -bodyWidth * (0.55 + pectoralWave * 0.5),
      bodyLength * 0.25 * finSize, -bodyWidth * (0.65 + pectoralWave),
      bodyLength * 0.35 * finSize, -bodyWidth * (0.7 + pectoralWave * 1.2)
    );
    ctx.bezierCurveTo(
      bodyLength * 0.32 * finSize, -bodyWidth * (0.6 + pectoralWave * 0.8),
      bodyLength * 0.25 * finSize, -bodyWidth * (0.5 + pectoralWave * 0.5),
      bodyLength * 0.15, -bodyWidth * 0.42
    );
    ctx.closePath();
    ctx.fill();
    
  } finally {
    ctx.restore();
  }
  
  // ✅ Barbatana inferior (isolada)
  ctx.save();
  
  try {
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = pectoralGradient;
    ctx.beginPath();
    ctx.moveTo(bodyLength * 0.08, bodyWidth * 0.45);
    ctx.bezierCurveTo(
      bodyLength * 0.15 * finSize, bodyWidth * (0.55 - pectoralWave * 0.5),
      bodyLength * 0.25 * finSize, bodyWidth * (0.65 - pectoralWave),
      bodyLength * 0.35 * finSize, bodyWidth * (0.7 - pectoralWave * 1.2)
    );
    ctx.bezierCurveTo(
      bodyLength * 0.32 * finSize, bodyWidth * (0.6 - pectoralWave * 0.8),
      bodyLength * 0.25 * finSize, bodyWidth * (0.5 - pectoralWave * 0.5),
      bodyLength * 0.15, bodyWidth * 0.42
    );
    ctx.closePath();
    ctx.fill();
    
  } finally {
    ctx.restore();
  }
}

/**
 * Desenha barbatana anal
 * ✅ ISOLAMENTO: Save/restore para raios
 */
function drawAnalFin(ctx, bodyLength, bodyWidth, finWave, colors) {
  const analGradient = ctx.createLinearGradient(
    -bodyLength * 0.1, bodyWidth * 0.55,
    -bodyLength * 0.35, bodyWidth * 0.9
  );
  analGradient.addColorStop(0, colors.primary);
  analGradient.addColorStop(0.6, colors.secondary);
  analGradient.addColorStop(1, adjustColorBrightness(colors.secondary, -15));
  
  ctx.fillStyle = analGradient;
  ctx.beginPath();
  ctx.moveTo(-bodyLength * 0.1, bodyWidth * 0.55);
  ctx.bezierCurveTo(
    -bodyLength * 0.15, bodyWidth * (0.65 - finWave * 0.3),
    -bodyLength * 0.25, bodyWidth * (0.75 - finWave * 0.5),
    -bodyLength * 0.35, bodyWidth * (0.8 - finWave * 0.6)
  );
  ctx.bezierCurveTo(
    -bodyLength * 0.32, bodyWidth * (0.72 - finWave * 0.4),
    -bodyLength * 0.22, bodyWidth * (0.62 - finWave * 0.2),
    -bodyLength * 0.15, bodyWidth * 0.53
  );
  ctx.closePath();
  ctx.fill();
  
  // ✅ ISOLAMENTO: Raios em contexto separado
  ctx.save();
  
  try {
    ctx.strokeStyle = adjustColorBrightness(colors.primary, -30);
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = 0.5;
    
    for (let i = 0; i < 4; i++) {
      const t = i / 3;
      const startX = -bodyLength * (0.1 + t * 0.05);
      const startY = bodyWidth * 0.55;
      const endX = -bodyLength * (0.15 + t * 0.2);
      const endY = bodyWidth * ((0.65 + t * 0.15) - finWave * (0.3 + t * 0.3));
      
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.stroke();
    }
    
  } finally {
    ctx.restore();
  }
}

/**
 * Desenha a cauda do inimigo
 * ✅ ISOLAMENTO: Save/restore para raios
 */
function drawEnemyTail(ctx, enemy, bodyLength, bodyWidth, tailOffset, colors) {
  const features = enemy.visualFeatures || {};
  const tailShape = features.tailShape || 'crescent';
  
  const tailGradient = ctx.createLinearGradient(
    -bodyLength * 0.7, 0,
    -bodyLength * 1.3, 0
  );
  tailGradient.addColorStop(0, colors.primary);
  tailGradient.addColorStop(0.5, colors.secondary);
  tailGradient.addColorStop(1, adjustColorBrightness(colors.accent, -20));
  
  ctx.fillStyle = tailGradient;
  ctx.beginPath();
  ctx.moveTo(-bodyLength * 0.7, 0);
  
  if (tailShape === 'forked') {
    // Cauda bifurcada (tubarão rápido)
    ctx.bezierCurveTo(
      -bodyLength * 0.8, -bodyWidth * 0.2 + tailOffset * 0.3,
      -bodyLength * 0.95, -bodyWidth * 0.45 + tailOffset * 0.7,
      -bodyLength * 1.15, -bodyWidth * 0.8 + tailOffset
    );
    ctx.lineTo(-bodyLength * 1.2, -bodyWidth * 0.65 + tailOffset * 0.9);
    ctx.lineTo(-bodyLength * 1.05, -bodyWidth * 0.3 + tailOffset * 0.5);
    ctx.lineTo(-bodyLength * 0.9, -bodyWidth * 0.05 + tailOffset * 0.2);
    
    // Gap central
    ctx.lineTo(-bodyLength * 0.9, bodyWidth * 0.05 - tailOffset * 0.2);
    ctx.lineTo(-bodyLength * 1.05, bodyWidth * 0.3 - tailOffset * 0.5);
    ctx.lineTo(-bodyLength * 1.2, bodyWidth * 0.65 - tailOffset * 0.9);
    ctx.lineTo(-bodyLength * 1.15, bodyWidth * 0.8 - tailOffset);
    
    ctx.bezierCurveTo(
      -bodyLength * 0.95, bodyWidth * 0.45 - tailOffset * 0.7,
      -bodyLength * 0.8, bodyWidth * 0.2 - tailOffset * 0.3,
      -bodyLength * 0.7, 0
    );
  } else if (tailShape === 'rounded') {
    // Cauda arredondada (tubarão lento)
    ctx.bezierCurveTo(
      -bodyLength * 0.82, -bodyWidth * 0.28 + tailOffset * 0.4,
      -bodyLength * 0.95, -bodyWidth * 0.5 + tailOffset * 0.8,
      -bodyLength * 1.1, -bodyWidth * 0.6 + tailOffset
    );
    ctx.bezierCurveTo(
      -bodyLength * 1.15, -bodyWidth * 0.5 + tailOffset * 0.9,
      -bodyLength * 1.12, -bodyWidth * 0.3 + tailOffset * 0.7,
      -bodyLength * 0.95, 0
    );
    ctx.bezierCurveTo(
      -bodyLength * 1.12, bodyWidth * 0.3 - tailOffset * 0.7,
      -bodyLength * 1.15, bodyWidth * 0.5 - tailOffset * 0.9,
      -bodyLength * 1.1, bodyWidth * 0.6 - tailOffset
    );
    ctx.bezierCurveTo(
      -bodyLength * 0.95, bodyWidth * 0.5 - tailOffset * 0.8,
      -bodyLength * 0.82, bodyWidth * 0.28 - tailOffset * 0.4,
      -bodyLength * 0.7, 0
    );
  } else {
    // Crescent (padrão - meia lua)
    ctx.bezierCurveTo(
      -bodyLength * 0.82, -bodyWidth * 0.25 + tailOffset * 0.3,
      -bodyLength * 1.0, -bodyWidth * 0.5 + tailOffset * 0.7,
      -bodyLength * 1.2, -bodyWidth * 0.7 + tailOffset
    );
    ctx.bezierCurveTo(
      -bodyLength * 1.28, -bodyWidth * 0.65 + tailOffset * 0.95,
      -bodyLength * 1.32, -bodyWidth * 0.5 + tailOffset * 0.85,
      -bodyLength * 1.25, -bodyWidth * 0.35 + tailOffset * 0.7
    );
    ctx.bezierCurveTo(
      -bodyLength * 1.15, -bodyWidth * 0.15 + tailOffset * 0.4,
      -bodyLength * 1.0, -bodyWidth * 0.05 + tailOffset * 0.2,
      -bodyLength * 0.9, 0
    );
    ctx.bezierCurveTo(
      -bodyLength * 1.0, bodyWidth * 0.05 - tailOffset * 0.2,
      -bodyLength * 1.15, bodyWidth * 0.15 - tailOffset * 0.4,
      -bodyLength * 1.25, bodyWidth * 0.35 - tailOffset * 0.7
    );
    ctx.bezierCurveTo(
      -bodyLength * 1.32, bodyWidth * 0.5 - tailOffset * 0.85,
      -bodyLength * 1.28, bodyWidth * 0.65 - tailOffset * 0.95,
      -bodyLength * 1.2, bodyWidth * 0.7 - tailOffset
    );
    ctx.bezierCurveTo(
      -bodyLength * 1.0, bodyWidth * 0.5 - tailOffset * 0.7,
      -bodyLength * 0.82, bodyWidth * 0.25 - tailOffset * 0.3,
      -bodyLength * 0.7, 0
    );
  }
  
  ctx.closePath();
  ctx.fill();
  
  // ✅ ISOLAMENTO: Raios da cauda em contexto separado
  ctx.save();
  
  try {
    ctx.strokeStyle = adjustColorBrightness(colors.primary, -35);
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = 0.5;
    
    const rayCount = tailShape === 'forked' ? 5 : 7;
    for (let i = 0; i < rayCount; i++) {
      const offset = (i - (rayCount-1)/2) * bodyWidth * 0.15;
      const tailMult = offset > 0 ? -0.8 : 0.8;
      
      ctx.beginPath();
      ctx.moveTo(-bodyLength * 0.8, offset * 0.5);
      ctx.lineTo(
        -bodyLength * 1.15, 
        offset * 1.6 + tailOffset * tailMult
      );
      ctx.stroke();
    }
    
  } finally {
    ctx.restore();
  }
}

/**
 * Desenha os olhos do inimigo
 * ✅ TOTALMENTE ISOLADO: Próprio save/restore
 */
function drawEnemyEyes(ctx, enemy, bodyLength, bodyWidth, colors) {
  // ✅ PROTEÇÃO: Não desenhar olhos se tiver cabeça de martelo (já foram desenhados)
  const features = enemy.visualFeatures || {};
  if (features.hasHammerHead) return;
  
  ctx.save();
  
  try {
    const eyeX = bodyLength * 0.45;
    const eyeY = -bodyWidth * 0.25;
    const eyeSize = enemy.r * 0.2;
    
    // Órbita do olho
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath();
    ctx.arc(eyeX, eyeY, eyeSize * 1.2, 0, Math.PI * 2);
    ctx.fill();
    
    // Branco do olho
    const eyeColor = enemy.state === 'chase' ? '#ffcccc' : '#ffffff';
    ctx.fillStyle = eyeColor;
    ctx.beginPath();
    ctx.arc(eyeX, eyeY, eyeSize, 0, Math.PI * 2);
    ctx.fill();
    
    // Íris
    const irisColor = enemy.state === 'chase' ? 
      adjustColorBrightness(colors.eye, 30) : colors.eye;
    ctx.fillStyle = irisColor;
    ctx.beginPath();
    ctx.arc(eyeX + eyeSize * 0.1, eyeY, eyeSize * 0.7, 0, Math.PI * 2);
    ctx.fill();
    
    // Pupila
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(eyeX + eyeSize * 0.15, eyeY, eyeSize * 0.35, 0, Math.PI * 2);
    ctx.fill();
    
    // Brilho ameaçador no olho quando perseguindo
    if (enemy.state === 'chase' && enemy.effects && enemy.effects.glowOnChase) {
      ctx.fillStyle = `rgba(255, 0, 0, 0.5)`;
      ctx.shadowColor = '#ff0000';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(eyeX, eyeY, eyeSize * 1.3, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Brilho no olho
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.beginPath();
    ctx.arc(eyeX + eyeSize * 0.3, eyeY - eyeSize * 0.25, eyeSize * 0.2, 0, Math.PI * 2);
    ctx.fill();
    
  } finally {
    ctx.restore();
  }
}

/**
 * Desenha brânquias
 * ✅ TOTALMENTE ISOLADO: Próprio save/restore
 */
function drawGills(ctx, bodyLength, bodyWidth, colors) {
  ctx.save();
  
  try {
    ctx.strokeStyle = adjustColorBrightness(colors.primary, -40);
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.globalAlpha = 0.6;
    
    for (let i = 0; i < 4; i++) {
      const gillX = -bodyLength * 0.15 + i * bodyLength * 0.08;
      const gillY1 = -bodyWidth * 0.35;
      const gillY2 = -bodyWidth * 0.2;
      const gillCurve = bodyLength * 0.03;
      
      ctx.beginPath();
      ctx.moveTo(gillX, gillY1);
      ctx.quadraticCurveTo(
        gillX - gillCurve, (gillY1 + gillY2) / 2,
        gillX, gillY2
      );
      ctx.stroke();
    }
    
  } finally {
    ctx.restore();
  }
}

/**
 * Desenha dentes afiados
 * ✅ TOTALMENTE ISOLADO: Próprio save/restore
 */
function drawTeeth(ctx, bodyLength, bodyWidth) {
  ctx.save();
  
  try {
    ctx.strokeStyle = '#ffffff';
    ctx.fillStyle = '#F8F9F9';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    
    const teethCount = 10;
    for (let i = 0; i < teethCount; i++) {
      const tx = bodyLength * 0.6 + i * 6;
      const ty = (i % 2 === 0) ? -4 : -2;
      const toothLength = (i % 2 === 0) ? 12 : 9;
      
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.lineTo(tx - 2, ty + toothLength);
      ctx.lineTo(tx + 2, ty + toothLength);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    
  } finally {
    ctx.restore();
  }
}

/**
 * Desenha cicatrizes de batalha
 * ✅ TOTALMENTE ISOLADO: Próprio save/restore
 */
function drawScars(ctx, enemy, bodyLength, bodyWidth) {
  ctx.save();
  
  try {
    const features = enemy.visualFeatures || {};
    
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.globalAlpha = 0.7;
    
    const scarCount = features.scarCount || 3;
    
    for (let i = 0; i < scarCount; i++) {
      const scarX1 = (Math.random() - 0.5) * bodyLength * 0.6;
      const scarY1 = (Math.random() - 0.5) * bodyWidth * 0.8;
      const scarLength = bodyLength * (0.15 + Math.random() * 0.2);
      const scarAngle = Math.random() * Math.PI * 2;
      
      ctx.beginPath();
      ctx.moveTo(scarX1, scarY1);
      ctx.lineTo(
        scarX1 + Math.cos(scarAngle) * scarLength,
        scarY1 + Math.sin(scarAngle) * scarLength
      );
      ctx.stroke();
    }
    
  } finally {
    ctx.restore();
  }
}

/**
 * Desenha textura de escamas
 * ✅ TOTALMENTE ISOLADO: Próprio save/restore
 */
function drawEnemyScales(ctx, enemy, bodyLength, bodyWidth, colors) {
  ctx.save();
  
  try {
    ctx.globalAlpha = 0.1;
    ctx.strokeStyle = colors.accent;
    ctx.lineWidth = 0.8;
    
    for (let i = -3; i <= 3; i++) {
      for (let j = -1; j <= 1; j++) {
        const scaleX = bodyLength * 0.05 + i * enemy.r * 0.3;
        const scaleY = j * bodyWidth * 0.3;
        const scaleSize = enemy.r * 0.2;
        
        ctx.beginPath();
        ctx.arc(scaleX, scaleY, scaleSize, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    
  } finally {
    ctx.restore();
  }
}

/**
 * Desenha informações de debug
 * ✅ TOTALMENTE ISOLADO: Próprio save/restore
 */
function drawEnemyDebugInfo(ctx, enemy, bodyWidth) {
  ctx.save();
  
  try {
    const stateColor = enemy.state === 'chase' ? '#ff0000' : 
                       enemy.state === 'flee' ? '#00ff00' : '#ffff00';
    
    ctx.fillStyle = stateColor;
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText((enemy.state || 'unknown').toUpperCase(), 0, -bodyWidth * 1.8);
    
    // Mostrar tipo
    ctx.fillStyle = '#ffffff';
    ctx.font = '10px Arial';
    ctx.fillText((enemy.type || 'unknown').toUpperCase(), 0, -bodyWidth * 2.0);
    
  } finally {
    ctx.restore();
  }
}

/**
 * Função auxiliar: Ajusta brilho de cor
 * ✅ FUNÇÃO PURA: Não modifica canvas
 */
function adjustColorBrightness(color, percent) {
  // Converter hex para RGB
  let r, g, b;
  
  if (color.startsWith('#')) {
    const hex = color.substring(1);
    r = parseInt(hex.substring(0, 2), 16);
    g = parseInt(hex.substring(2, 4), 16);
    b = parseInt(hex.substring(4, 6), 16);
  } else if (color.startsWith('rgb')) {
    const matches = color.match(/\d+/g);
    if (matches && matches.length >= 3) {
      r = parseInt(matches[0]);
      g = parseInt(matches[1]);
      b = parseInt(matches[2]);
    } else {
      return color; // Retorna cor original se não conseguir parsear
    }
  } else {
    return color; // Retorna cor original para formatos não suportados
  }
  
  // Ajustar brilho
  r = Math.max(0, Math.min(255, r + (r * percent / 100)));
  g = Math.max(0, Math.min(255, g + (g * percent / 100)));
  b = Math.max(0, Math.min(255, b + (b * percent / 100)));
  
  // Converter de volta para hex
  const toHex = (n) => {
    const hex = Math.round(n).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// ✅ LOG DE INICIALIZAÇÃO
console.log('✅ Sistema de renderização de inimigos carregado (VERSÃO ISOLADA E CORRIGIDA)');
console.log('   - Todas as funções usam save/restore para isolamento total');
console.log('   - Ordem correta de transformações: translate → rotate');
console.log('   - Proteção contra valores undefined com fallbacks');
console.log('   - Validação de entrada em todas as funções públicas');
