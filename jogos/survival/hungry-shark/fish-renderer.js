// ================= SISTEMA DE RENDERIZAÇÃO DE PEIXES AVANÇADO =================
// Renderiza cada tipo de peixe com gráficos únicos e detalhados

/**
 * Desenha um peixe baseado em seu tipo
 */
function drawFishAdvanced(ctx, fish) {
  ctx.save();
  ctx.translate(fish.x, fish.y);
  ctx.rotate(fish.angle);
  
  const bodyLength = fish.r * 2.5;
  const bodyWidth = fish.r * 1.5;
  const tailOffset = Math.sin(fish.swimPhase) * fish.r * 0.35;
  const finWave = Math.sin(fish.finPhase) * fish.r * 0.15;
  
  // Sombra do peixe
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.3)';
  ctx.shadowBlur = 10;
  ctx.shadowOffsetX = 3;
  ctx.shadowOffsetY = 3;
  
  // Corpo baseado no formato
  drawFishBody(ctx, fish, bodyLength, bodyWidth);
  
  ctx.restore();
  
  // Características especiais únicas
  if (fish.visualFeatures.hasStripes || fish.visualFeatures.hasStripe) {
    drawFishStripes(ctx, fish, bodyLength, bodyWidth);
  }
  
  if (fish.visualFeatures.hasBands) {
    drawFishBands(ctx, fish, bodyLength, bodyWidth);
  }
  
  if (fish.visualFeatures.hasSpots) {
    drawFishSpots(ctx, fish, bodyLength, bodyWidth);
  }
  
  if (fish.visualFeatures.hasPattern) {
    drawFishPattern(ctx, fish, bodyLength, bodyWidth);
  }
  
  if (fish.visualFeatures.hasPsychedelicPattern) {
    drawPsychedelicPattern(ctx, fish, bodyLength, bodyWidth);
  }
  
  // Barriga clara
  drawFishBelly(ctx, bodyLength, bodyWidth, fish.colors);
  
  // Barbatanas
  if (fish.visualFeatures.hasFancyFins) {
    drawFancyFins(ctx, fish, bodyLength, bodyWidth, finWave);
  } else {
    drawStandardFins(ctx, fish, bodyLength, bodyWidth, finWave);
  }
  
  // Espinhos (se tiver)
  if (fish.visualFeatures.hasSpines) {
    drawFishSpines(ctx, fish, bodyLength, bodyWidth);
  }
  
  // Espinho na cauda (peixe cirurgião)
  if (fish.visualFeatures.hasSpine) {
    drawTailSpine(ctx, fish, bodyLength, bodyWidth);
  }
  
  // Cauda baseada no formato
  drawFishTail(ctx, fish, bodyLength, bodyWidth, tailOffset);
  
  // Filamento (Moorish Idol)
  if (fish.visualFeatures.hasFilament) {
    drawDorsalFilament(ctx, fish, bodyLength, bodyWidth);
  }
  
  // Olhos
  drawFishEyes(ctx, fish, bodyLength, bodyWidth);
  
  // Boca/dentes (se tiver)
  if (fish.visualFeatures.hasTeeth) {
    drawFishTeeth(ctx, bodyLength, bodyWidth);
  }
  
  // Efeitos especiais
  if (fish.visualFeatures.hasShimmer) {
    drawFishShimmer(ctx, fish, bodyLength, bodyWidth);
  }
  
  if (fish.visualFeatures.hasGlow) {
    drawFishGlow(ctx, fish);
  }
  
  if (fish.visualFeatures.hasRainbowSheen) {
    drawRainbowSheen(ctx, fish, bodyLength, bodyWidth);
  }
  
  // Escamas/textura
  drawFishScales(ctx, fish, bodyLength, bodyWidth);
  
  ctx.restore();
}

/**
 * Desenha o corpo principal do peixe
 */
function drawFishBody(ctx, fish, bodyLength, bodyWidth) {
  const colors = fish.colors;
  const shape = fish.visualFeatures.bodyShape;
  
  // Gradiente baseado na forma
  const gradient = ctx.createLinearGradient(
    -bodyLength*0.3, -bodyWidth*0.5, 
    bodyLength*0.7, bodyWidth*0.5
  );
  
  const darkColor = adjustColorBrightness(colors.primary, -30);
  const lightColor = adjustColorBrightness(colors.primary, 20);
  
  gradient.addColorStop(0, darkColor);
  gradient.addColorStop(0.4, colors.primary);
  gradient.addColorStop(0.8, lightColor);
  gradient.addColorStop(1, colors.secondary);
  
  ctx.fillStyle = gradient;
  ctx.beginPath();
  
  if (shape === 'sleek') {
    // Corpo esguio e hidrodinâmico
    ctx.moveTo(bodyLength * 0.65, 0);
    ctx.bezierCurveTo(bodyLength * 0.5, -bodyWidth * 0.35, bodyLength * 0.3, -bodyWidth * 0.48, bodyLength * 0.1, -bodyWidth * 0.52);
    ctx.bezierCurveTo(-bodyLength * 0.1, -bodyWidth * 0.48, -bodyLength * 0.25, -bodyWidth * 0.35, -bodyLength * 0.4, 0);
    ctx.bezierCurveTo(-bodyLength * 0.25, bodyWidth * 0.35, -bodyLength * 0.1, bodyWidth * 0.48, bodyLength * 0.1, bodyWidth * 0.52);
    ctx.bezierCurveTo(bodyLength * 0.3, bodyWidth * 0.48, bodyLength * 0.5, bodyWidth * 0.35, bodyLength * 0.65, 0);
  } else if (shape === 'rounded') {
    // Corpo arredondado
    ctx.moveTo(bodyLength * 0.6, 0);
    ctx.bezierCurveTo(bodyLength * 0.45, -bodyWidth * 0.45, bodyLength * 0.25, -bodyWidth * 0.58, 0, -bodyWidth * 0.62);
    ctx.bezierCurveTo(-bodyLength * 0.2, -bodyWidth * 0.58, -bodyLength * 0.35, -bodyWidth * 0.4, -bodyLength * 0.42, 0);
    ctx.bezierCurveTo(-bodyLength * 0.35, bodyWidth * 0.4, -bodyLength * 0.2, bodyWidth * 0.58, 0, bodyWidth * 0.62);
    ctx.bezierCurveTo(bodyLength * 0.25, bodyWidth * 0.58, bodyLength * 0.45, bodyWidth * 0.45, bodyLength * 0.6, 0);
  } else if (shape === 'tall' || shape === 'disc') {
    // Corpo alto e achatado lateralmente
    const heightMult = shape === 'disc' ? 1.4 : 1.2;
    ctx.moveTo(bodyLength * 0.55, 0);
    ctx.bezierCurveTo(bodyLength * 0.4, -bodyWidth * 0.55 * heightMult, bodyLength * 0.2, -bodyWidth * 0.68 * heightMult, 0, -bodyWidth * 0.72 * heightMult);
    ctx.bezierCurveTo(-bodyLength * 0.15, -bodyWidth * 0.68 * heightMult, -bodyLength * 0.28, -bodyWidth * 0.48 * heightMult, -bodyLength * 0.35, 0);
    ctx.bezierCurveTo(-bodyLength * 0.28, bodyWidth * 0.48 * heightMult, -bodyLength * 0.15, bodyWidth * 0.68 * heightMult, 0, bodyWidth * 0.72 * heightMult);
    ctx.bezierCurveTo(bodyLength * 0.2, bodyWidth * 0.68 * heightMult, bodyLength * 0.4, bodyWidth * 0.55 * heightMult, bodyLength * 0.55, 0);
  } else if (shape === 'bulky') {
    // Corpo robusto
    ctx.moveTo(bodyLength * 0.68, 0);
    ctx.bezierCurveTo(bodyLength * 0.52, -bodyWidth * 0.42, bodyLength * 0.32, -bodyWidth * 0.62, bodyLength * 0.08, -bodyWidth * 0.68);
    ctx.bezierCurveTo(-bodyLength * 0.12, -bodyWidth * 0.64, -bodyLength * 0.28, -bodyWidth * 0.48, -bodyLength * 0.38, 0);
    ctx.bezierCurveTo(-bodyLength * 0.28, bodyWidth * 0.48, -bodyLength * 0.12, bodyWidth * 0.64, bodyLength * 0.08, bodyWidth * 0.68);
    ctx.bezierCurveTo(bodyLength * 0.32, bodyWidth * 0.62, bodyLength * 0.52, bodyWidth * 0.42, bodyLength * 0.68, 0);
  } else if (shape === 'compressed') {
    // Lateralmente comprimido
    ctx.moveTo(bodyLength * 0.58, 0);
    ctx.bezierCurveTo(bodyLength * 0.42, -bodyWidth * 0.52, bodyLength * 0.22, -bodyWidth * 0.72, 0, -bodyWidth * 0.78);
    ctx.bezierCurveTo(-bodyLength * 0.18, -bodyWidth * 0.74, -bodyLength * 0.32, -bodyWidth * 0.52, -bodyLength * 0.38, 0);
    ctx.bezierCurveTo(-bodyLength * 0.32, bodyWidth * 0.52, -bodyLength * 0.18, bodyWidth * 0.74, 0, bodyWidth * 0.78);
    ctx.bezierCurveTo(bodyLength * 0.22, bodyWidth * 0.72, bodyLength * 0.42, bodyWidth * 0.52, bodyLength * 0.58, 0);
  } else if (shape === 'spiky') {
    // Corpo com forma angular
    ctx.moveTo(bodyLength * 0.62, 0);
    ctx.lineTo(bodyLength * 0.48, -bodyWidth * 0.38);
    ctx.lineTo(bodyLength * 0.28, -bodyWidth * 0.58);
    ctx.lineTo(0, -bodyWidth * 0.65);
    ctx.lineTo(-bodyLength * 0.22, -bodyWidth * 0.52);
    ctx.lineTo(-bodyLength * 0.35, -bodyWidth * 0.28);
    ctx.lineTo(-bodyLength * 0.4, 0);
    ctx.lineTo(-bodyLength * 0.35, bodyWidth * 0.28);
    ctx.lineTo(-bodyLength * 0.22, bodyWidth * 0.52);
    ctx.lineTo(0, bodyWidth * 0.65);
    ctx.lineTo(bodyLength * 0.28, bodyWidth * 0.58);
    ctx.lineTo(bodyLength * 0.48, bodyWidth * 0.38);
  } else {
    // Oval padrão
    ctx.ellipse(0, 0, bodyLength * 0.5, bodyWidth * 0.55, 0, 0, Math.PI * 2);
  }
  
  ctx.closePath();
  ctx.fill();
  
  // Contorno sutil
  ctx.strokeStyle = adjustColorBrightness(colors.primary, -40);
  ctx.lineWidth = 1.5;
  ctx.globalAlpha = 0.4;
  ctx.stroke();
  ctx.globalAlpha = 1.0;
}

/**
 * Desenha listras no peixe
 */
function drawFishStripes(ctx, fish, bodyLength, bodyWidth) {
  ctx.save();
  const colors = fish.colors;
  ctx.strokeStyle = colors.stripe || colors.accent;
  ctx.lineWidth = fish.r * 0.12;
  ctx.lineCap = 'round';
  ctx.globalAlpha = 0.7;
  
  const stripeCount = fish.visualFeatures.stripeCount || 3;
  const spacing = (bodyLength * 0.7) / (stripeCount + 1);
  
  for (let i = 0; i < stripeCount; i++) {
    const x = -bodyLength * 0.25 + i * spacing;
    const curve = Math.sin((i / stripeCount) * Math.PI) * bodyWidth * 0.15;
    
    ctx.beginPath();
    ctx.moveTo(x, -bodyWidth * 0.45 + curve);
    ctx.quadraticCurveTo(
      x + spacing * 0.25, 0,
      x, bodyWidth * 0.45 - curve
    );
    ctx.stroke();
  }
  
  ctx.restore();
}

/**
 * Desenha bandas no peixe (tipo peixe palhaço)
 */
function drawFishBands(ctx, fish, bodyLength, bodyWidth) {
  ctx.save();
  const colors = fish.colors;
  ctx.fillStyle = colors.accent || colors.stripe || '#FFFFFF';
  ctx.globalAlpha = 0.9;
  
  const bandCount = fish.visualFeatures.bandCount || 3;
  const bandWidth = bodyLength * 0.15;
  const spacing = (bodyLength * 0.8) / bandCount;
  
  for (let i = 0; i < bandCount; i++) {
    const x = -bodyLength * 0.15 + i * spacing;
    
    ctx.beginPath();
    ctx.ellipse(x, 0, bandWidth, bodyWidth * 0.65, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  
  ctx.restore();
}

/**
 * Desenha manchas no peixe
 */
function drawFishSpots(ctx, fish, bodyLength, bodyWidth) {
  ctx.save();
  const colors = fish.colors;
  ctx.fillStyle = colors.spot || adjustColorBrightness(colors.primary, -40);
  ctx.globalAlpha = 0.6;
  
  const spotCount = fish.visualFeatures.spotCount || 10;
  
  for (let i = 0; i < spotCount; i++) {
    const x = (Math.random() - 0.5) * bodyLength * 0.8;
    const y = (Math.random() - 0.5) * bodyWidth * 0.9;
    const size = fish.r * (0.08 + Math.random() * 0.12);
    
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }
  
  ctx.restore();
}

/**
 * Desenha padrão geométrico
 */
function drawFishPattern(ctx, fish, bodyLength, bodyWidth) {
  ctx.save();
  const colors = fish.colors;
  const patternType = fish.visualFeatures.patternType;
  
  ctx.strokeStyle = colors.pattern || colors.accent;
  ctx.lineWidth = 1.5;
  ctx.globalAlpha = 0.5;
  
  if (patternType === 'spots') {
    // Pontos pequenos
    ctx.fillStyle = colors.pattern || colors.accent;
    for (let i = 0; i < 20; i++) {
      const x = (Math.random() - 0.5) * bodyLength * 0.7;
      const y = (Math.random() - 0.5) * bodyWidth * 0.8;
      ctx.beginPath();
      ctx.arc(x, y, fish.r * 0.06, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (patternType === 'lines') {
    // Linhas horizontais
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(-bodyLength * 0.3, i * bodyWidth * 0.2);
      ctx.lineTo(bodyLength * 0.4, i * bodyWidth * 0.2);
      ctx.stroke();
    }
  }
  
  ctx.restore();
}

/**
 * Desenha padrão psicodélico (Peixe Mandarim)
 */
function drawPsychedelicPattern(ctx, fish, bodyLength, bodyWidth) {
  ctx.save();
  const colors = fish.colors;
  const patterns = colors.pattern || [colors.primary, colors.secondary, colors.accent];
  
  ctx.globalAlpha = 0.7;
  ctx.lineWidth = 2;
  
  // Linhas onduladas multicoloridas
  for (let i = 0; i < 8; i++) {
    ctx.strokeStyle = patterns[i % patterns.length];
    ctx.beginPath();
    
    const yStart = -bodyWidth * 0.5 + (i / 7) * bodyWidth;
    ctx.moveTo(-bodyLength * 0.3, yStart);
    
    for (let x = -bodyLength * 0.3; x <= bodyLength * 0.5; x += 5) {
      const wave = Math.sin((x / bodyLength + fish.swimPhase) * 4) * bodyWidth * 0.1;
      ctx.lineTo(x, yStart + wave);
    }
    
    ctx.stroke();
  }
  
  ctx.restore();
}

/**
 * Desenha barriga clara
 */
function drawFishBelly(ctx, bodyLength, bodyWidth, colors) {
  ctx.save();
  ctx.fillStyle = colors.belly || 'rgba(255, 255, 255, 0.5)';
  ctx.globalAlpha = 0.6;
  
  ctx.beginPath();
  ctx.ellipse(0, bodyWidth * 0.15, bodyLength * 0.35, bodyWidth * 0.28, 0, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.restore();
}

/**
 * Desenha barbatanas padrão
 */
function drawStandardFins(ctx, fish, bodyLength, bodyWidth, finWave) {
  const colors = fish.colors;
  const baseColor = colors.secondary || colors.primary;
  const lightColor = adjustColorBrightness(baseColor, 15);
  
  // Barbatana dorsal
  const dorsalGradient = ctx.createLinearGradient(0, -bodyWidth * 0.5, 0, -bodyWidth * 0.9);
  dorsalGradient.addColorStop(0, baseColor);
  dorsalGradient.addColorStop(1, lightColor);
  
  ctx.fillStyle = dorsalGradient;
  ctx.beginPath();
  ctx.moveTo(0, -bodyWidth * 0.55);
  ctx.bezierCurveTo(
    bodyLength * 0.1, -bodyWidth * 0.7 + finWave,
    bodyLength * 0.15, -bodyWidth * 0.85 + finWave,
    bodyLength * 0.12, -bodyWidth * 0.9 + finWave
  );
  ctx.bezierCurveTo(
    bodyLength * 0.18, -bodyWidth * 0.8 + finWave * 0.7,
    bodyLength * 0.25, -bodyWidth * 0.65 + finWave * 0.5,
    bodyLength * 0.3, -bodyWidth * 0.55
  );
  ctx.closePath();
  ctx.fill();
  
  // Barbatanas peitorais
  ctx.save();
  ctx.fillStyle = adjustColorBrightness(baseColor, -10);
  ctx.globalAlpha = 0.8;
  
  // Superior
  ctx.beginPath();
  ctx.ellipse(
    bodyLength * 0.05, 
    -bodyWidth * 0.4 + finWave * 0.3, 
    bodyLength * 0.2, 
    bodyWidth * 0.12, 
    -0.4, 
    0, 
    Math.PI * 2
  );
  ctx.fill();
  
  // Inferior
  ctx.beginPath();
  ctx.ellipse(
    bodyLength * 0.05, 
    bodyWidth * 0.4 - finWave * 0.3, 
    bodyLength * 0.2, 
    bodyWidth * 0.12, 
    0.4, 
    0, 
    Math.PI * 2
  );
  ctx.fill();
  
  ctx.restore();
  
  // Barbatana anal
  ctx.save();
  ctx.fillStyle = adjustColorBrightness(baseColor, -5);
  ctx.globalAlpha = 0.7;
  
  ctx.beginPath();
  ctx.moveTo(-bodyLength * 0.1, bodyWidth * 0.55);
  ctx.bezierCurveTo(
    -bodyLength * 0.05, bodyWidth * 0.65 - finWave * 0.4,
    0, bodyWidth * 0.72 - finWave * 0.5,
    bodyLength * 0.05, bodyWidth * 0.68 - finWave * 0.45
  );
  ctx.bezierCurveTo(
    bodyLength * 0.08, bodyWidth * 0.62 - finWave * 0.3,
    bodyLength * 0.12, bodyWidth * 0.58 - finWave * 0.2,
    bodyLength * 0.15, bodyWidth * 0.55
  );
  ctx.closePath();
  ctx.fill();
  
  ctx.restore();
}

/**
 * Desenha barbatanas elaboradas (Peixe Anjo)
 */
function drawFancyFins(ctx, fish, bodyLength, bodyWidth, finWave) {
  const colors = fish.colors;
  const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, bodyLength);
  gradient.addColorStop(0, colors.primary);
  gradient.addColorStop(0.5, colors.secondary);
  gradient.addColorStop(1, adjustColorBrightness(colors.accent, 20));
  
  ctx.fillStyle = gradient;
  ctx.globalAlpha = 0.9;
  
  // Barbatana dorsal longa e fluida
  ctx.beginPath();
  ctx.moveTo(-bodyLength * 0.2, -bodyWidth * 0.6);
  ctx.bezierCurveTo(
    -bodyLength * 0.1, -bodyWidth * 1.0 + finWave,
    bodyLength * 0.1, -bodyWidth * 1.2 + finWave,
    bodyLength * 0.25, -bodyWidth * 1.0 + finWave * 0.8
  );
  ctx.bezierCurveTo(
    bodyLength * 0.3, -bodyWidth * 0.85 + finWave * 0.6,
    bodyLength * 0.35, -bodyWidth * 0.7 + finWave * 0.4,
    bodyLength * 0.35, -bodyWidth * 0.6
  );
  ctx.closePath();
  ctx.fill();
  
  // Barbatana anal longa
  ctx.beginPath();
  ctx.moveTo(-bodyLength * 0.15, bodyWidth * 0.6);
  ctx.bezierCurveTo(
    -bodyLength * 0.05, bodyWidth * 0.95 - finWave * 0.7,
    bodyLength * 0.1, bodyWidth * 1.1 - finWave * 0.9,
    bodyLength * 0.22, bodyWidth * 0.95 - finWave * 0.75
  );
  ctx.bezierCurveTo(
    bodyLength * 0.28, bodyWidth * 0.8 - finWave * 0.5,
    bodyLength * 0.32, bodyWidth * 0.68 - finWave * 0.3,
    bodyLength * 0.32, bodyWidth * 0.6
  );
  ctx.closePath();
  ctx.fill();
  
  ctx.globalAlpha = 1.0;
  
  // Raios das barbatanas
  ctx.save();
  ctx.strokeStyle = adjustColorBrightness(colors.primary, -30);
  ctx.lineWidth = 0.8;
  ctx.globalAlpha = 0.4;
  
  for (let i = 0; i < 7; i++) {
    const t = i / 6;
    ctx.beginPath();
    ctx.moveTo(-bodyLength * 0.15 + t * bodyLength * 0.45, -bodyWidth * 0.6);
    ctx.lineTo(-bodyLength * 0.1 + t * bodyLength * 0.4, -bodyWidth * 0.95 + finWave * (1 - t));
    ctx.stroke();
  }
  
  ctx.restore();
}

/**
 * Desenha espinhos
 */
function drawFishSpines(ctx, fish, bodyLength, bodyWidth) {
  const colors = fish.colors;
  const spineCount = fish.visualFeatures.spineCount || 8;
  
  ctx.save();
  ctx.fillStyle = colors.accent || adjustColorBrightness(colors.primary, -20);
  ctx.strokeStyle = adjustColorBrightness(colors.primary, -40);
  ctx.lineWidth = 1;
  
  for (let i = 0; i < spineCount; i++) {
    const t = i / (spineCount - 1);
    const x = -bodyLength * 0.25 + t * bodyLength * 0.6;
    const baseY = -bodyWidth * 0.55;
    const height = fish.r * 0.4 * (1 - Math.abs(t - 0.5) * 2);
    
    ctx.beginPath();
    ctx.moveTo(x - 2, baseY);
    ctx.lineTo(x, baseY - height);
    ctx.lineTo(x + 2, baseY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  
  ctx.restore();
}

/**
 * Desenha espinho na cauda (peixe cirurgião)
 */
function drawTailSpine(ctx, fish, bodyLength, bodyWidth) {
  const colors = fish.colors;
  
  ctx.save();
  ctx.fillStyle = colors.spine || colors.accent || '#FFD700';
  ctx.strokeStyle = adjustColorBrightness(colors.spine || '#FFD700', -30);
  ctx.lineWidth = 1.5;
  
  const spineX = -bodyLength * 0.35;
  const spineY = bodyWidth * 0.35;
  
  ctx.beginPath();
  ctx.moveTo(spineX, spineY);
  ctx.lineTo(spineX - fish.r * 0.25, spineY + fish.r * 0.15);
  ctx.lineTo(spineX - fish.r * 0.15, spineY + fish.r * 0.05);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  
  ctx.restore();
}

/**
 * Desenha cauda baseada no formato
 */
function drawFishTail(ctx, fish, bodyLength, bodyWidth, tailOffset) {
  const colors = fish.colors;
  const tailShape = fish.visualFeatures.tailShape;
  
  const tailGradient = ctx.createLinearGradient(-bodyLength * 0.4, 0, -bodyLength * 0.85, 0);
  tailGradient.addColorStop(0, colors.primary);
  tailGradient.addColorStop(0.5, colors.secondary);
  tailGradient.addColorStop(1, adjustColorBrightness(colors.primary, -20));
  
  ctx.fillStyle = tailGradient;
  ctx.beginPath();
  
  if (tailShape === 'forked') {
    // Cauda bifurcada
    ctx.moveTo(-bodyLength * 0.4, 0);
    // Lóbulo superior
    ctx.bezierCurveTo(
      -bodyLength * 0.55, -bodyWidth * 0.25 + tailOffset * 0.5,
      -bodyLength * 0.75, -bodyWidth * 0.45 + tailOffset * 0.9,
      -bodyLength * 0.9, -bodyWidth * 0.6 + tailOffset
    );
    ctx.bezierCurveTo(
      -bodyLength * 0.92, -bodyWidth * 0.5 + tailOffset * 0.95,
      -bodyLength * 0.88, -bodyWidth * 0.35 + tailOffset * 0.8,
      -bodyLength * 0.75, -bodyWidth * 0.2 + tailOffset * 0.6
    );
    // Centro
    ctx.lineTo(-bodyLength * 0.55, -bodyWidth * 0.05);
    ctx.lineTo(-bodyLength * 0.55, bodyWidth * 0.05);
    // Lóbulo inferior
    ctx.bezierCurveTo(
      -bodyLength * 0.88, bodyWidth * 0.35 - tailOffset * 0.8,
      -bodyLength * 0.92, bodyWidth * 0.5 - tailOffset * 0.95,
      -bodyLength * 0.9, bodyWidth * 0.6 - tailOffset
    );
    ctx.bezierCurveTo(
      -bodyLength * 0.75, bodyWidth * 0.45 - tailOffset * 0.9,
      -bodyLength * 0.55, bodyWidth * 0.25 - tailOffset * 0.5,
      -bodyLength * 0.4, 0
    );
  } else if (tailShape === 'rounded') {
    // Cauda arredondada
    ctx.moveTo(-bodyLength * 0.4, 0);
    ctx.bezierCurveTo(
      -bodyLength * 0.52, -bodyWidth * 0.28 + tailOffset * 0.4,
      -bodyLength * 0.68, -bodyWidth * 0.48 + tailOffset * 0.8,
      -bodyLength * 0.8, -bodyWidth * 0.55 + tailOffset
    );
    ctx.bezierCurveTo(
      -bodyLength * 0.85, -bodyWidth * 0.45 + tailOffset * 0.9,
      -bodyLength * 0.82, -bodyWidth * 0.3 + tailOffset * 0.7,
      -bodyLength * 0.72, -bodyWidth * 0.15 + tailOffset * 0.4
    );
    ctx.lineTo(-bodyLength * 0.55, 0);
    ctx.bezierCurveTo(
      -bodyLength * 0.82, bodyWidth * 0.3 - tailOffset * 0.7,
      -bodyLength * 0.85, bodyWidth * 0.45 - tailOffset * 0.9,
      -bodyLength * 0.8, bodyWidth * 0.55 - tailOffset
    );
    ctx.bezierCurveTo(
      -bodyLength * 0.68, bodyWidth * 0.48 - tailOffset * 0.8,
      -bodyLength * 0.52, bodyWidth * 0.28 - tailOffset * 0.4,
      -bodyLength * 0.4, 0
    );
  } else if (tailShape === 'flowing') {
    // Cauda fluida e longa
    ctx.moveTo(-bodyLength * 0.4, 0);
    ctx.bezierCurveTo(
      -bodyLength * 0.6, -bodyWidth * 0.35 + tailOffset * 0.6,
      -bodyLength * 0.85, -bodyWidth * 0.55 + tailOffset,
      -bodyLength * 1.0, -bodyWidth * 0.65 + tailOffset * 1.1
    );
    ctx.bezierCurveTo(
      -bodyLength * 1.05, -bodyWidth * 0.55 + tailOffset * 1.05,
      -bodyLength * 1.02, -bodyWidth * 0.4 + tailOffset * 0.9,
      -bodyLength * 0.92, -bodyWidth * 0.25 + tailOffset * 0.7
    );
    ctx.lineTo(-bodyLength * 0.65, 0);
    ctx.bezierCurveTo(
      -bodyLength * 1.02, bodyWidth * 0.4 - tailOffset * 0.9,
      -bodyLength * 1.05, bodyWidth * 0.55 - tailOffset * 1.05,
      -bodyLength * 1.0, bodyWidth * 0.65 - tailOffset * 1.1
    );
    ctx.bezierCurveTo(
      -bodyLength * 0.85, bodyWidth * 0.55 - tailOffset,
      -bodyLength * 0.6, bodyWidth * 0.35 - tailOffset * 0.6,
      -bodyLength * 0.4, 0
    );
  } else if (tailShape === 'fan') {
    // Cauda em leque (peixe leão)
    ctx.moveTo(-bodyLength * 0.4, 0);
    for (let i = -5; i <= 5; i++) {
      const angle = (i / 5) * 0.6;
      const rayLength = bodyLength * 0.55;
      const x = -bodyLength * 0.4 - Math.cos(angle) * rayLength;
      const y = Math.sin(angle) * bodyWidth * 0.8 + tailOffset * (i / 5);
      ctx.lineTo(x, y);
    }
    ctx.lineTo(-bodyLength * 0.4, 0);
  } else if (tailShape === 'triangular' || tailShape === 'truncate') {
    // Cauda triangular ou truncada
    const spread = tailShape === 'truncate' ? 0.35 : 0.45;
    ctx.moveTo(-bodyLength * 0.4, 0);
    ctx.lineTo(-bodyLength * 0.75, -bodyWidth * spread + tailOffset * 0.7);
    ctx.lineTo(-bodyLength * 0.82, -bodyWidth * (spread * 0.6) + tailOffset * 0.5);
    ctx.lineTo(-bodyLength * 0.65, 0);
    ctx.lineTo(-bodyLength * 0.82, bodyWidth * (spread * 0.6) - tailOffset * 0.5);
    ctx.lineTo(-bodyLength * 0.75, bodyWidth * spread - tailOffset * 0.7);
  } else if (tailShape === 'small') {
    // Cauda pequena
    ctx.moveTo(-bodyLength * 0.4, 0);
    ctx.bezierCurveTo(
      -bodyLength * 0.48, -bodyWidth * 0.2 + tailOffset * 0.4,
      -bodyLength * 0.58, -bodyWidth * 0.3 + tailOffset * 0.6,
      -bodyLength * 0.65, -bodyWidth * 0.35 + tailOffset * 0.7
    );
    ctx.bezierCurveTo(
      -bodyLength * 0.62, -bodyWidth * 0.25 + tailOffset * 0.55,
      -bodyLength * 0.58, -bodyWidth * 0.15 + tailOffset * 0.35,
      -bodyLength * 0.5, 0
    );
    ctx.bezierCurveTo(
      -bodyLength * 0.58, bodyWidth * 0.15 - tailOffset * 0.35,
      -bodyLength * 0.62, bodyWidth * 0.25 - tailOffset * 0.55,
      -bodyLength * 0.65, bodyWidth * 0.35 - tailOffset * 0.7
    );
    ctx.bezierCurveTo(
      -bodyLength * 0.58, bodyWidth * 0.3 - tailOffset * 0.6,
      -bodyLength * 0.48, bodyWidth * 0.2 - tailOffset * 0.4,
      -bodyLength * 0.4, 0
    );
  } else {
    // Cauda padrão (crescent)
    ctx.moveTo(-bodyLength * 0.4, 0);
    ctx.bezierCurveTo(
      -bodyLength * 0.52, -bodyWidth * 0.25 + tailOffset * 0.4,
      -bodyLength * 0.7, -bodyWidth * 0.45 + tailOffset * 0.8,
      -bodyLength * 0.85, -bodyWidth * 0.55 + tailOffset
    );
    ctx.bezierCurveTo(
      -bodyLength * 0.9, -bodyWidth * 0.48 + tailOffset * 0.95,
      -bodyLength * 0.88, -bodyWidth * 0.35 + tailOffset * 0.8,
      -bodyLength * 0.78, -bodyWidth * 0.22 + tailOffset * 0.6
    );
    ctx.lineTo(-bodyLength * 0.6, 0);
    ctx.bezierCurveTo(
      -bodyLength * 0.88, bodyWidth * 0.35 - tailOffset * 0.8,
      -bodyLength * 0.9, bodyWidth * 0.48 - tailOffset * 0.95,
      -bodyLength * 0.85, bodyWidth * 0.55 - tailOffset
    );
    ctx.bezierCurveTo(
      -bodyLength * 0.7, bodyWidth * 0.45 - tailOffset * 0.8,
      -bodyLength * 0.52, bodyWidth * 0.25 - tailOffset * 0.4,
      -bodyLength * 0.4, 0
    );
  }
  
  ctx.closePath();
  ctx.fill();
  
  // Raios da cauda
  ctx.save();
  ctx.strokeStyle = adjustColorBrightness(colors.primary, -35);
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.5;
  
  const rayCount = tailShape === 'fan' ? 11 : (tailShape === 'small' ? 3 : 5);
  for (let i = 0; i < rayCount; i++) {
    const offset = (i - (rayCount-1)/2) * bodyWidth * 0.12;
    const tailMult = offset > 0 ? -0.7 : 0.7;
    
    ctx.beginPath();
    ctx.moveTo(-bodyLength * 0.5, offset * 0.5);
    ctx.lineTo(
      -bodyLength * 0.8, 
      offset * 1.4 + tailOffset * tailMult
    );
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * Desenha filamento dorsal (Moorish Idol)
 */
function drawDorsalFilament(ctx, fish, bodyLength, bodyWidth) {
  const colors = fish.colors;
  
  ctx.save();
  ctx.strokeStyle = colors.accent || '#FFD700';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  
  const wave = Math.sin(fish.swimPhase * 0.8) * fish.r * 0.3;
  
  ctx.beginPath();
  ctx.moveTo(0, -bodyWidth * 0.7);
  ctx.bezierCurveTo(
    bodyLength * 0.1, -bodyWidth * 1.2 + wave,
    bodyLength * 0.15, -bodyWidth * 1.6 + wave * 1.2,
    bodyLength * 0.12, -bodyWidth * 1.9 + wave * 1.4
  );
  ctx.stroke();
  
  // Ponta do filamento
  ctx.beginPath();
  ctx.arc(bodyLength * 0.12, -bodyWidth * 1.9 + wave * 1.4, fish.r * 0.08, 0, Math.PI * 2);
  ctx.fillStyle = colors.accent || '#FFD700';
  ctx.fill();
  
  ctx.restore();
}

/**
 * Desenha olhos do peixe
 */
function drawFishEyes(ctx, fish, bodyLength, bodyWidth) {
  const eyeX = bodyLength * 0.4;
  const eyeY = -bodyWidth * 0.25;
  const eyeSize = fish.r * 0.18;
  
  // Branco do olho
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(eyeX, eyeY, eyeSize, 0, Math.PI * 2);
  ctx.fill();
  
  // Íris
  const irisColor = fish.colors.eye || '#2c3e50';
  ctx.fillStyle = irisColor;
  ctx.beginPath();
  ctx.arc(eyeX + eyeSize * 0.1, eyeY, eyeSize * 0.7, 0, Math.PI * 2);
  ctx.fill();
  
  // Pupila
  ctx.fillStyle = '#000000';
  ctx.beginPath();
  ctx.arc(eyeX + eyeSize * 0.15, eyeY, eyeSize * 0.4, 0, Math.PI * 2);
  ctx.fill();
  
  // Brilho no olho
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.beginPath();
  ctx.arc(eyeX + eyeSize * 0.3, eyeY - eyeSize * 0.2, eyeSize * 0.22, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * Desenha dentes (barracuda, etc)
 */
function drawFishTeeth(ctx, bodyLength, bodyWidth) {
  ctx.save();
  ctx.fillStyle = '#FFFFFF';
  ctx.strokeStyle = '#E0E0E0';
  ctx.lineWidth = 1;
  
  const teethCount = 6;
  for (let i = 0; i < teethCount; i++) {
    const tx = bodyLength * 0.45 + i * 4;
    const ty = i % 2 === 0 ? -3 : -1.5;
    const toothLength = i % 2 === 0 ? 8 : 6;
    
    ctx.beginPath();
    ctx.moveTo(tx, ty);
    ctx.lineTo(tx - 1.5, ty + toothLength);
    ctx.lineTo(tx + 1.5, ty + toothLength);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  
  ctx.restore();
}

/**
 * Desenha brilho metálico
 */
function drawFishShimmer(ctx, fish, bodyLength, bodyWidth) {
  ctx.save();
  
  const shimmerGradient = ctx.createLinearGradient(
    -bodyLength * 0.2, -bodyWidth * 0.3,
    bodyLength * 0.4, bodyWidth * 0.3
  );
  shimmerGradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
  shimmerGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.4)');
  shimmerGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
  
  ctx.fillStyle = shimmerGradient;
  ctx.beginPath();
  ctx.ellipse(0, 0, bodyLength * 0.4, bodyWidth * 0.45, 0, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.restore();
}

/**
 * Desenha brilho neon
 */
function drawFishGlow(ctx, fish) {
  ctx.save();
  
  const glowColor = fish.colors.accent || fish.colors.primary;
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = 15;
  ctx.globalAlpha = 0.6;
  
  ctx.strokeStyle = glowColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(0, 0, fish.r * 2.3, fish.r * 1.4, 0, 0, Math.PI * 2);
  ctx.stroke();
  
  ctx.restore();
}

/**
 * Desenha brilho arco-íris
 */
function drawRainbowSheen(ctx, fish, bodyLength, bodyWidth) {
  ctx.save();
  
  const rainbowColors = [
    'rgba(255, 0, 0, 0.2)',
    'rgba(255, 127, 0, 0.2)',
    'rgba(255, 255, 0, 0.2)',
    'rgba(0, 255, 0, 0.2)',
    'rgba(0, 0, 255, 0.2)',
    'rgba(75, 0, 130, 0.2)',
    'rgba(148, 0, 211, 0.2)'
  ];
  
  for (let i = 0; i < rainbowColors.length; i++) {
    const offset = (i - 3) * fish.r * 0.15;
    ctx.fillStyle = rainbowColors[i];
    ctx.beginPath();
    ctx.ellipse(
      offset,
      0,
      bodyLength * 0.35,
      bodyWidth * 0.4,
      Math.sin(fish.swimPhase + i) * 0.2,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }
  
  ctx.restore();
}

/**
 * Desenha textura de escamas
 */
function drawFishScales(ctx, fish, bodyLength, bodyWidth) {
  ctx.save();
  ctx.globalAlpha = 0.12;
  ctx.strokeStyle = fish.colors.accent || adjustColorBrightness(fish.colors.primary, 30);
  ctx.lineWidth = 0.6;
  
  for (let i = -2; i <= 2; i++) {
    for (let j = -1; j <= 1; j++) {
      const scaleX = bodyLength * 0.05 + i * fish.r * 0.28;
      const scaleY = j * bodyWidth * 0.28;
      const scaleSize = fish.r * 0.18;
      
      ctx.beginPath();
      ctx.arc(scaleX, scaleY, scaleSize, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  
  ctx.restore();
}
