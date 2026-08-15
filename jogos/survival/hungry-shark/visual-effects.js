// ================= SISTEMA DE FEEDBACK VISUAL AVANÇADO =================

/**
 * Sistema completo de efeitos visuais
 * - Trail de movimento
 * - Speed lines
 * - Distorção de água
 * - Screen shake aprimorado
 * - Chromatic aberration
 * - Motion blur
 */

// ================= CONFIGURAÇÃO =================

const VISUAL_EFFECTS = {
  trail: {
    enabled: true,
    maxPoints: 20,
    fadeDuration: 0.5,
    minSpeed: 100,
    color: '#60A5FA'
  },
  speedLines: {
    enabled: true,
    count: 30,
    minSpeed: 250,
    length: 80,
    thickness: 2,
    opacity: 0.6
  },
  waterDistortion: {
    enabled: true,
    strength: 10,
    minSpeed: 150,
    rippleCount: 5
  },
  motionBlur: {
    enabled: true,
    minSpeed: 200,
    blurAmount: 3
  },
  chromaticAberration: {
    enabled: true,
    minSpeed: 300,
    strength: 2
  },
  impactWaves: {
    enabled: true,
    maxWaves: 10
  }
};

// ================= ESTADO DOS EFEITOS =================

let movementTrail = [];
let speedLines = [];
let waterRipples = [];
let impactWaves = [];
let screenEffects = {
  shake: { intensity: 0, time: 0 },
  flash: { color: null, opacity: 0 },
  vignette: 0,
  blur: 0,
  chromatic: 0
};

// ================= TRAIL DE MOVIMENTO =================

/**
 * Atualiza trail de movimento do player
 */
function updateMovementTrail(dt) {
  if (!player || !VISUAL_EFFECTS.trail.enabled) return;
  
  const speed = Math.sqrt(player.velocity.x ** 2 + player.velocity.y ** 2);
  
  // Adicionar novo ponto se movendo rápido
  if (speed > VISUAL_EFFECTS.trail.minSpeed) {
    movementTrail.push({
      x: player.x,
      y: player.y,
      r: player.r,
      life: 1.0,
      angle: player.angle,
      color: currentTransformation ? currentTransformation.data.visual.color : VISUAL_EFFECTS.trail.color
    });
    
    // Limitar tamanho do trail
    if (movementTrail.length > VISUAL_EFFECTS.trail.maxPoints) {
      movementTrail.shift();
    }
  }
  
  // Atualizar pontos do trail
  for (let i = movementTrail.length - 1; i >= 0; i--) {
    movementTrail[i].life -= dt / VISUAL_EFFECTS.trail.fadeDuration;
    if (movementTrail[i].life <= 0) {
      movementTrail.splice(i, 1);
    }
  }
}

/**
 * Desenha trail de movimento
 */
function drawMovementTrail(ctx) {
  if (!VISUAL_EFFECTS.trail.enabled || movementTrail.length < 2) return;
  
  ctx.save();
  
  for (let i = 0; i < movementTrail.length - 1; i++) {
    const point = movementTrail[i];
    const nextPoint = movementTrail[i + 1];
    
    ctx.globalAlpha = point.life * 0.5;
    ctx.strokeStyle = point.color;
    ctx.lineWidth = point.r * 1.5;
    ctx.lineCap = 'round';
    
    ctx.beginPath();
    ctx.moveTo(point.x, point.y);
    ctx.lineTo(nextPoint.x, nextPoint.y);
    ctx.stroke();
  }
  
  ctx.restore();
}

// ================= SPEED LINES =================

/**
 * Atualiza speed lines baseado na velocidade
 */
function updateSpeedLines(dt) {
  if (!player || !VISUAL_EFFECTS.speedLines.enabled) return;
  
  const speed = Math.sqrt(player.velocity.x ** 2 + player.velocity.y ** 2);
  
  // Criar novas linhas se movendo rápido
  if (speed > VISUAL_EFFECTS.speedLines.minSpeed) {
    const intensity = Math.min((speed - VISUAL_EFFECTS.speedLines.minSpeed) / 200, 1);
    
    if (Math.random() < intensity * 0.5) {
      const angle = player.angle + Math.PI + (Math.random() - 0.5) * Math.PI * 0.3;
      const distance = 200 + Math.random() * 100;
      
      speedLines.push({
        x: player.x + Math.cos(angle) * distance,
        y: player.y + Math.sin(angle) * distance,
        angle: player.angle,
        length: VISUAL_EFFECTS.speedLines.length * (0.5 + intensity * 0.5),
        life: 1.0,
        opacity: VISUAL_EFFECTS.speedLines.opacity * intensity
      });
    }
  }
  
  // Atualizar linhas existentes
  for (let i = speedLines.length - 1; i >= 0; i--) {
    const line = speedLines[i];
    
    // Mover na direção oposta ao movimento
    line.x += Math.cos(line.angle + Math.PI) * 400 * dt;
    line.y += Math.sin(line.angle + Math.PI) * 400 * dt;
    
    line.life -= dt * 3;
    
    if (line.life <= 0) {
      speedLines.splice(i, 1);
    }
  }
  
  // Limitar quantidade
  if (speedLines.length > VISUAL_EFFECTS.speedLines.count) {
    speedLines.splice(0, speedLines.length - VISUAL_EFFECTS.speedLines.count);
  }
}

/**
 * Desenha speed lines
 */
function drawSpeedLines(ctx) {
  if (!VISUAL_EFFECTS.speedLines.enabled) return;
  
  ctx.save();
  
  speedLines.forEach(line => {
    ctx.globalAlpha = line.life * line.opacity;
    ctx.strokeStyle = 'white';
    ctx.lineWidth = VISUAL_EFFECTS.speedLines.thickness;
    ctx.lineCap = 'round';
    
    const endX = line.x + Math.cos(line.angle) * line.length;
    const endY = line.y + Math.sin(line.angle) * line.length;
    
    ctx.beginPath();
    ctx.moveTo(line.x, line.y);
    ctx.lineTo(endX, endY);
    ctx.stroke();
  });
  
  ctx.restore();
}

// ================= DISTORÇÃO DE ÁGUA =================

/**
 * Atualiza efeito de distorção de água
 */
function updateWaterDistortion(dt) {
  if (!player || !VISUAL_EFFECTS.waterDistortion.enabled) return;
  
  const speed = Math.sqrt(player.velocity.x ** 2 + player.velocity.y ** 2);
  
  // Criar ondulações se movendo rápido
  if (speed > VISUAL_EFFECTS.waterDistortion.minSpeed) {
    if (Math.random() < 0.3) {
      waterRipples.push({
        x: player.x + (Math.random() - 0.5) * player.r * 2,
        y: player.y + (Math.random() - 0.5) * player.r * 2,
        radius: player.r,
        maxRadius: player.r * 4,
        life: 1.0,
        speed: 150
      });
    }
  }
  
  // Atualizar ondulações
  for (let i = waterRipples.length - 1; i >= 0; i--) {
    const ripple = waterRipples[i];
    
    ripple.radius += ripple.speed * dt;
    ripple.life -= dt * 1.5;
    
    if (ripple.life <= 0 || ripple.radius > ripple.maxRadius) {
      waterRipples.splice(i, 1);
    }
  }
  
  // Limitar quantidade
  if (waterRipples.length > VISUAL_EFFECTS.waterDistortion.rippleCount) {
    waterRipples.shift();
  }
}

/**
 * Desenha ondulações de água
 */
function drawWaterDistortion(ctx) {
  if (!VISUAL_EFFECTS.waterDistortion.enabled) return;
  
  ctx.save();
  
  waterRipples.forEach(ripple => {
    ctx.globalAlpha = ripple.life * 0.3;
    ctx.strokeStyle = '#60A5FA';
    ctx.lineWidth = 2;
    
    ctx.beginPath();
    ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
    ctx.stroke();
    
    // Onda interna
    if (ripple.life > 0.5) {
      ctx.globalAlpha = (ripple.life - 0.5) * 0.4;
      ctx.beginPath();
      ctx.arc(ripple.x, ripple.y, ripple.radius * 0.7, 0, Math.PI * 2);
      ctx.stroke();
    }
  });
  
  ctx.restore();
}

// ================= ONDAS DE IMPACTO =================

/**
 * Cria onda de impacto
 */
function createImpactWave(x, y, intensity = 1.0, color = '#FFFFFF') {
  if (!VISUAL_EFFECTS.impactWaves.enabled) return;
  
  impactWaves.push({
    x, y,
    radius: 0,
    maxRadius: 100 * intensity,
    life: 1.0,
    color,
    thickness: 3 + intensity * 2
  });
  
  // Limitar quantidade
  if (impactWaves.length > VISUAL_EFFECTS.impactWaves.maxWaves) {
    impactWaves.shift();
  }
}

/**
 * Atualiza ondas de impacto
 */
function updateImpactWaves(dt) {
  for (let i = impactWaves.length - 1; i >= 0; i--) {
    const wave = impactWaves[i];
    
    wave.radius += 300 * dt;
    wave.life -= dt * 2;
    
    if (wave.life <= 0 || wave.radius > wave.maxRadius) {
      impactWaves.splice(i, 1);
    }
  }
}

/**
 * Desenha ondas de impacto
 */
function drawImpactWaves(ctx) {
  ctx.save();
  
  impactWaves.forEach(wave => {
    ctx.globalAlpha = wave.life * 0.6;
    ctx.strokeStyle = wave.color;
    ctx.lineWidth = wave.thickness;
    
    ctx.beginPath();
    ctx.arc(wave.x, wave.y, wave.radius, 0, Math.PI * 2);
    ctx.stroke();
  });
  
  ctx.restore();
}

// ================= EFEITOS DE TELA =================

/**
 * Atualiza efeitos de tela
 */
function updateScreenEffects(dt) {
  if (!player) return;
  
  const speed = Math.sqrt(player.velocity.x ** 2 + player.velocity.y ** 2);
  
  // Motion blur baseado em velocidade
  if (VISUAL_EFFECTS.motionBlur.enabled) {
    const targetBlur = speed > VISUAL_EFFECTS.motionBlur.minSpeed ? 
      (speed - VISUAL_EFFECTS.motionBlur.minSpeed) / 100 : 0;
    screenEffects.blur += (targetBlur - screenEffects.blur) * dt * 5;
  }
  
  // Chromatic aberration em alta velocidade
  if (VISUAL_EFFECTS.chromaticAberration.enabled) {
    const targetChromatic = speed > VISUAL_EFFECTS.chromaticAberration.minSpeed ? 
      VISUAL_EFFECTS.chromaticAberration.strength : 0;
    screenEffects.chromatic += (targetChromatic - screenEffects.chromatic) * dt * 5;
  }
  
  // Atualizar shake
  if (screenEffects.shake.time > 0) {
    screenEffects.shake.time -= dt;
    if (screenEffects.shake.time < 0) {
      screenEffects.shake.time = 0;
      screenEffects.shake.intensity = 0;
    }
  }
  
  // Atualizar flash
  if (screenEffects.flash.opacity > 0) {
    screenEffects.flash.opacity -= dt * 3;
    if (screenEffects.flash.opacity < 0) {
      screenEffects.flash.opacity = 0;
      screenEffects.flash.color = null;
    }
  }
  
  // Vignette em combate
  const targetVignette = combo > 5 ? 0.3 : 0.1;
  screenEffects.vignette += (targetVignette - screenEffects.vignette) * dt * 2;
}

/**
 * Aplica screen shake melhorado
 */
function applyScreenShake(intensity, duration) {
  screenEffects.shake.intensity = intensity;
  screenEffects.shake.time = duration;
}

/**
 * Aplica flash de tela
 */
function applyScreenFlash(color, opacity = 0.8) {
  screenEffects.flash.color = color;
  screenEffects.flash.opacity = opacity;
}

/**
 * Aplica efeitos de tela ao contexto
 */
function applyScreenEffectsToContext(ctx) {
  // Screen shake
  let shakeX = 0, shakeY = 0;
  if (screenEffects.shake.time > 0) {
    shakeX = (Math.random() - 0.5) * screenEffects.shake.intensity;
    shakeY = (Math.random() - 0.5) * screenEffects.shake.intensity;
  }
  
  return { shakeX, shakeY };
}

/**
 * Desenha overlay de efeitos de tela
 */
function drawScreenOverlay(ctx) {
  const w = canvas.width / dpr;
  const h = canvas.height / dpr;
  
  // Flash
  if (screenEffects.flash.opacity > 0 && screenEffects.flash.color) {
    ctx.save();
    ctx.globalAlpha = screenEffects.flash.opacity;
    ctx.fillStyle = screenEffects.flash.color;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }
  
  // Vignette
  if (screenEffects.vignette > 0) {
    ctx.save();
    ctx.globalAlpha = screenEffects.vignette;
    
    const gradient = ctx.createRadialGradient(w/2, h/2, 0, w/2, h/2, Math.max(w, h));
    gradient.addColorStop(0, 'rgba(0,0,0,0)');
    gradient.addColorStop(0.7, 'rgba(0,0,0,0)');
    gradient.addColorStop(1, 'rgba(0,0,0,0.8)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }
  
  // Chromatic aberration (simulado com deslocamento de cores)
  if (screenEffects.chromatic > 0.5) {
    ctx.save();
    ctx.globalAlpha = 0.3;
    ctx.globalCompositeOperation = 'screen';
    
    // Não podemos fazer chromatic aberration real sem WebGL,
    // mas podemos simular com bordas coloridas
    ctx.strokeStyle = '#FF0000';
    ctx.lineWidth = screenEffects.chromatic;
    ctx.strokeRect(2, 2, w - 4, h - 4);
    
    ctx.strokeStyle = '#00FF00';
    ctx.strokeRect(0, 0, w, h);
    
    ctx.strokeStyle = '#0000FF';
    ctx.strokeRect(-2, -2, w + 4, h + 4);
    
    ctx.restore();
  }
}

// ================= PARTÍCULAS DE VELOCIDADE =================

/**
 * Cria explosão de partículas de velocidade
 */
function createSpeedBurst(x, y, angle, count = 20) {
  for (let i = 0; i < count; i++) {
    const spreadAngle = angle + (Math.random() - 0.5) * Math.PI * 0.5;
    const speed = 200 + Math.random() * 200;
    
    createAbilityParticle(
      x,
      y,
      '#60A5FA',
      'trail'
    );
  }
}

// ================= INDICADORES VISUAIS =================

/**
 * Desenha indicador de direção
 */
function drawDirectionIndicator(ctx) {
  if (!player || !player.isMoving) return;
  
  ctx.save();
  
  const distance = player.r * 3;
  const x = player.x + Math.cos(player.angle) * distance;
  const y = player.y + Math.sin(player.angle) * distance;
  
  ctx.globalAlpha = 0.4;
  ctx.fillStyle = '#60A5FA';
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(
    x + Math.cos(player.angle + Math.PI * 0.8) * 15,
    y + Math.sin(player.angle + Math.PI * 0.8) * 15
  );
  ctx.lineTo(
    x + Math.cos(player.angle - Math.PI * 0.8) * 15,
    y + Math.sin(player.angle - Math.PI * 0.8) * 15
  );
  ctx.closePath();
  ctx.fill();
  
  ctx.restore();
}

/**
 * Desenha indicador de velocidade
 */
function drawSpeedometer(ctx) {
  if (!player) return;
  
  const speed = Math.sqrt(player.velocity.x ** 2 + player.velocity.y ** 2);
  const maxSpeed = player.speed * 2;
  const percent = Math.min(speed / maxSpeed, 1);
  
  const x = 60;
  const y = canvas.height/dpr - 60;
  const radius = 40;
  
  ctx.save();
  
  // Background
  ctx.globalAlpha = 0.3;
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
  
  // Arc de velocidade
  ctx.globalAlpha = 0.8;
  ctx.strokeStyle = percent > 0.7 ? '#EF4444' : percent > 0.4 ? '#F59E0B' : '#22C55E';
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(x, y, radius - 5, Math.PI * 0.75, Math.PI * 0.75 + Math.PI * 1.5 * percent);
  ctx.stroke();
  
  // Texto
  ctx.globalAlpha = 1;
  ctx.fillStyle = 'white';
  ctx.font = 'bold 12px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(Math.floor(speed), x, y);
  
  ctx.restore();
}

// ================= ATUALIZAÇÃO GERAL =================

/**
 * Atualiza todos os efeitos visuais
 */
function updateAllVisualEffects(dt) {
  updateMovementTrail(dt);
  updateSpeedLines(dt);
  updateWaterDistortion(dt);
  updateImpactWaves(dt);
  updateScreenEffects(dt);
}

/**
 * Desenha todos os efeitos visuais (background layer)
 */
function drawVisualEffectsBackground(ctx) {
  drawMovementTrail(ctx);
  drawWaterDistortion(ctx);
}

/**
 * Desenha todos os efeitos visuais (foreground layer)
 */
function drawVisualEffectsForeground(ctx) {
  drawSpeedLines(ctx);
  drawImpactWaves(ctx);
  drawDirectionIndicator(ctx);
}

/**
 * Desenha todos os efeitos visuais (overlay layer)
 */
function drawVisualEffectsOverlay(ctx) {
  drawScreenOverlay(ctx);
  drawSpeedometer(ctx);
}

// ================= CONFIGURAÇÕES =================

/**
 * Ativa/desativa efeito específico
 */
function toggleVisualEffect(effectName, enabled) {
  if (VISUAL_EFFECTS[effectName]) {
    VISUAL_EFFECTS[effectName].enabled = enabled;
    localStorage.setItem(`visual_${effectName}`, enabled);
  }
}

/**
 * Carrega configurações salvas
 */
function loadVisualEffectSettings() {
  for (const effectName in VISUAL_EFFECTS) {
    const saved = localStorage.getItem(`visual_${effectName}`);
    if (saved !== null) {
      VISUAL_EFFECTS[effectName].enabled = saved === 'true';
    }
  }
}

/**
 * Inicializa sistema visual
 */
function initVisualEffectsSystem() {
  loadVisualEffectSettings();
  console.log('✨ Sistema de Efeitos Visuais inicializado!');
}

// Debug
if (typeof window !== 'undefined') {
  window.visualEffects = {
    list: () => {
      console.table(
        Object.entries(VISUAL_EFFECTS).map(([name, config]) => ({
          Efeito: name,
          Ativo: config.enabled ? '✅' : '❌'
        }))
      );
    },
    toggle: (name) => {
      toggleVisualEffect(name, !VISUAL_EFFECTS[name].enabled);
      console.log(`${name}: ${VISUAL_EFFECTS[name].enabled ? 'ON' : 'OFF'}`);
    },
    flash: (color) => applyScreenFlash(color),
    shake: (intensity, duration) => applyScreenShake(intensity, duration),
    impact: (x, y) => createImpactWave(x, y, 1.5, '#FFFFFF')
  };
}
