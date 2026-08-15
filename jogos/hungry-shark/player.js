// ================= CLASSE DO PLAYER (VERSÃO ULTRA MELHORADA) =================
// 🎨 MELHORIAS GRÁFICAS PRINCIPAIS:
// - Modelo 3D-like com iluminação dinâmica e sombras
// - Textura de escamas realista
// - Múltiplas barbatanas com animação independente
// - Olhos expressivos com reflexos
// - Boca animada que abre ao comer
// - Rastro de bolhas e partículas de água
// - Efeitos de brilho e reflexo de luz
// - Barbatanas peitorais, dorsais e caudais animadas
// - Sistema de danos visual (cicatrizes temporárias)

class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.r = CONFIG.PLAYER_INITIAL_RADIUS;
    this.speed = CONFIG.PLAYER_INITIAL_SPEED;
    this.angle = 0;
    this.hunger = CONFIG.PLAYER_INITIAL_HUNGER;
    this.maxHunger = CONFIG.PLAYER_INITIAL_HUNGER;
    this.swimPhase = 0;
    
    // Atributos de animação
    this.targetAngle = 0;
    this.velocity = { x: 0, y: 0 };
    this.isMoving = false;
    this.attackCooldown = 0;
    this.damageFlash = 0;
    this.healFlash = 0;
    
    // 🎨 NOVOS ATRIBUTOS DE ANIMAÇÃO AVANÇADA
    this.finPhase = 0; // Fase de animação das barbatanas
    this.tailPhase = 0; // Fase de animação da cauda
    this.gillPhase = 0; // Fase de animação das brânquias
    this.mouthOpenness = 0; // 0 = fechada, 1 = totalmente aberta
    this.eyeBlinkTimer = 0;
    this.eyeBlinkPhase = 0;
    this.bodyFlexPhase = 0; // Flexão do corpo durante natação
    
    // Partículas de água
    this.waterParticles = [];
    this.bubbles = [];
    this.lightRays = []; // Raios de luz refletidos
    
    // Stats expandidos
    this.skinBonuses = {};
    this.damageMultiplier = 1;
    this.speedMultiplier = 1;
    
    // ✅ NOVOS: Buffs e debuffs do sistema de progressão
    this.speedBuff = null;
    this.strengthBuff = null;
    this.gemBuff = null;
    this.xpBuff = null;
    this.isStunned = false;
    this.stunTimer = 0;
    
    // ✅ NOVOS: Habilidades especiais desbloqueadas
    this.specialAbilities = {};
    this.dashCooldown = 0;
    this.dashActive = false;
    this.dashTimer = 0;
    this.dashSpeed = 0;
    
    // Sistema de combate
    this.lastAttackTime = 0;
    this.comboCount = 0;
    this.comboTimer = 0;
    this.justAte = false; // Flag para animação de comer
    this.ateTimer = 0;
    
    // Sistema de cicatrizes (danos visuais temporários)
    this.scars = [];
  }

  update(dt, keys, touchInput) {
    // ✅ Verificar stun
    if (this.isStunned) {
      this.stunTimer -= dt;
      if (this.stunTimer <= 0) {
        this.isStunned = false;
      }
      // Não pode se mover enquanto stunado
      return;
    }
    
    // ✅ Atualizar cooldown de dash
    if (this.dashCooldown > 0) {
      this.dashCooldown -= dt;
    }
    
    // Movimento
    let dx = 0;
    let dy = 0;

    // Teclado
    if (keys['w'] || keys['ArrowUp']) dy -= 1;
    if (keys['s'] || keys['ArrowDown']) dy += 1;
    if (keys['a'] || keys['ArrowLeft']) dx -= 1;
    if (keys['d'] || keys['ArrowRight']) dx += 1;
    
    // ✅ Verificar Dash (tecla Shift ou Space)
    if ((keys['Shift'] || keys[' ']) && this.canDash()) {
      this.activateDash();
    }

    // Touch
    if (touchInput.active) {
      dx += touchInput.x;
      dy += touchInput.y;
    }

    // Normalizar diagonal
    const len = Math.sqrt(dx * dx + dy * dy);
    this.isMoving = len > 0;
    
    if (len > 0) {
      dx /= len;
      dy /= len;
      this.targetAngle = Math.atan2(dy, dx);
    }

    // Rotação suave
    let angleDiff = this.targetAngle - this.angle;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
    this.angle += angleDiff * 8 * dt;
    
    // ✅ Atualizar dash
    if (this.dashActive) {
      this.updateDash(dt);
      return; // Dash controla movimento
    }

    // Aplicar movimento com aceleração suave
    let finalSpeed = this.speed;
    
    // ✅ Aplicar multiplicador de velocidade de buff
    if (this.speedBuff) {
      finalSpeed *= this.speedBuff.multiplier;
    }
    
    this.velocity.x = dx * finalSpeed;
    this.velocity.y = dy * finalSpeed;
    
    this.x += this.velocity.x * dt;
    this.y += this.velocity.y * dt;

    // Limites do mundo
    if (typeof mapSystem !== 'undefined' && mapSystem) {
      mapSystem.enforceBoundaries(this);
    } else {
      this.x = Math.max(this.r, Math.min(canvas.width/dpr - this.r, this.x));
      this.y = Math.max(this.r, Math.min(canvas.height/dpr - this.r, this.y));
    }

    // V4: crescimento visual progressivo. O raio cresce de forma limitada para
    // deixar a evolução perceptível sem quebrar colisões ou o desenho.
    const targetRadius = Math.min(38, CONFIG.PLAYER_INITIAL_RADIUS + Math.max(0, level - 1) * 0.72);
    this.r += (targetRadius - this.r) * Math.min(1, dt * 2.2);

    // Atualizar stats baseado em upgrades
    this.maxHunger = 100 + upgrades.maxHunger * 25;
    this.speed = CONFIG.PLAYER_INITIAL_SPEED + upgrades.speed * 30;
    
    // Aplicar multiplicadores de stats
    if (typeof playerStats !== 'undefined') {
      this.speed *= playerStats.movementSpeed;
    }
    if (this.speedMultiplier !== 1) {
      this.speed *= this.speedMultiplier;
    }
    
    // Consumo de fome
    this.hunger -= dt * (1 - upgrades.hungerDrain * 0.1);
    if (this.hunger < 0) this.hunger = 0;

    // 🎨 ANIMAÇÕES AVANÇADAS
    // Fase de natação mais complexa
    if (this.isMoving) {
      this.swimPhase += dt * 12;
      this.bodyFlexPhase += dt * 10;
    } else {
      this.swimPhase += dt * 4;
      this.bodyFlexPhase += dt * 3;
    }
    
    // Animação das barbatanas (mais rápida quando se move)
    this.finPhase += dt * (this.isMoving ? 15 : 8);
    
    // Animação da cauda (sincronizada com natação)
    this.tailPhase = this.swimPhase * 1.5;
    
    // Animação das brânquias (respiração constante)
    this.gillPhase += dt * 6;
    
    // Animação de piscar
    this.eyeBlinkTimer -= dt;
    if (this.eyeBlinkTimer <= 0) {
      this.eyeBlinkTimer = randomRange(2, 5); // Piscar a cada 2-5 segundos
      this.eyeBlinkPhase = 1.0;
    }
    if (this.eyeBlinkPhase > 0) {
      this.eyeBlinkPhase -= dt * 8;
    }
    
    // Animação de boca (abre quando come)
    if (this.justAte) {
      this.ateTimer -= dt;
      this.mouthOpenness = Math.max(0, this.ateTimer / 0.3);
      if (this.ateTimer <= 0) {
        this.justAte = false;
      }
    }

    // Cooldowns e efeitos
    if (this.attackCooldown > 0) this.attackCooldown -= dt;
    if (this.damageFlash > 0) this.damageFlash -= dt * 4;
    if (this.healFlash > 0) this.healFlash -= dt * 3;

    // Criar partículas de água quando se move (mais frequente)
    if (this.isMoving && Math.random() < 0.5) {
      this.createWaterParticle();
    }

    // Criar bolhas ocasionalmente (mais frequente)
    if (Math.random() < 0.1) {
      this.createBubble();
    }
    
    // Criar raios de luz ocasionalmente
    if (this.isMoving && Math.random() < 0.05) {
      this.createLightRay();
    }

    // Atualizar partículas
    this.updateParticles(dt);
    
    // Atualizar cicatrizes (desvanecem com o tempo)
    this.scars = this.scars.filter(scar => {
      scar.life -= dt * 0.2;
      return scar.life > 0;
    });
  }

  createWaterParticle() {
    const angle = this.angle + Math.PI + (Math.random() - 0.5) * 0.8;
    const speed = 30 + Math.random() * 40;
    this.waterParticles.push({
      x: this.x - Math.cos(this.angle) * this.r * 2.2,
      y: this.y - Math.sin(this.angle) * this.r * 2.2,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1.0,
      size: Math.random() * 4 + 2,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 5
    });
  }

  createBubble() {
    const offsetX = (Math.random() - 0.5) * this.r * 1.5;
    const offsetY = (Math.random() - 0.5) * this.r * 1.5;
    this.bubbles.push({
      x: this.x + offsetX,
      y: this.y + offsetY,
      vx: (Math.random() - 0.5) * 10,
      vy: -30 - Math.random() * 40,
      life: 1.0,
      size: Math.random() * 5 + 2,
      wobble: Math.random() * Math.PI * 2,
      wobbleSpeed: Math.random() * 3 + 2
    });
  }
  
  createLightRay() {
    this.lightRays.push({
      x: this.x + (Math.random() - 0.5) * this.r * 2,
      y: this.y + (Math.random() - 0.5) * this.r * 2,
      angle: Math.random() * Math.PI * 2,
      length: 20 + Math.random() * 30,
      life: 1.0,
      intensity: 0.3 + Math.random() * 0.4
    });
  }

  updateParticles(dt) {
    // Atualizar partículas de água
    this.waterParticles = this.waterParticles.filter(p => {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.95; // Desaceleração
      p.vy *= 0.95;
      p.rotation += p.rotationSpeed * dt;
      p.life -= dt * 1.5;
      return p.life > 0;
    });

    // Atualizar bolhas
    this.bubbles = this.bubbles.filter(b => {
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.wobble += b.wobbleSpeed * dt;
      b.vx = Math.sin(b.wobble) * 5; // Movimento ondulante
      b.life -= dt * 0.4;
      return b.life > 0;
    });
    
    // Atualizar raios de luz
    this.lightRays = this.lightRays.filter(r => {
      r.life -= dt * 2;
      return r.life > 0;
    });
  }

  draw(ctx) {
    // Desenhar efeitos visuais das habilidades/transformações
    if (typeof drawPlayerVisualEffects === 'function') {
      drawPlayerVisualEffects(ctx);
    }
    
    // Desenhar raios de luz atrás
    this.drawLightRays(ctx);
    
    // Desenhar partículas atrás do tubarão
    this.drawParticles(ctx);
    
    // Desenhar tubarão com efeitos ultra melhorados
    this.drawSharkUltra(ctx);
    
    // Indicador de fome (barra melhorada)
    this.drawHungerBar(ctx);
  }
  
  drawLightRays(ctx) {
    this.lightRays.forEach(ray => {
      ctx.save();
      ctx.globalAlpha = ray.life * ray.intensity;
      ctx.strokeStyle = '#60A5FA';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      
      ctx.beginPath();
      ctx.moveTo(ray.x, ray.y);
      ctx.lineTo(
        ray.x + Math.cos(ray.angle) * ray.length,
        ray.y + Math.sin(ray.angle) * ray.length
      );
      ctx.stroke();
      ctx.restore();
    });
  }

  drawParticles(ctx) {
    // Partículas de água com rotação
    this.waterParticles.forEach(p => {
      ctx.save();
      ctx.globalAlpha = p.life * 0.6;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      
      // Gradiente radial para água
      const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, p.size);
      gradient.addColorStop(0, '#60A5FA');
      gradient.addColorStop(0.5, '#3B82F6');
      gradient.addColorStop(1, 'rgba(59, 130, 246, 0)');
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(0, 0, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // Bolhas com efeito 3D
    this.bubbles.forEach(b => {
      ctx.save();
      ctx.globalAlpha = b.life * 0.7;
      
      // Círculo externo da bolha
      ctx.strokeStyle = '#BFDBFE';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2);
      ctx.stroke();
      
      // Brilho interno da bolha
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.beginPath();
      ctx.arc(b.x - b.size * 0.3, b.y - b.size * 0.3, b.size * 0.4, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.restore();
    });
  }

  drawHungerBar(ctx) {
    const barWidth = 80;
    const barHeight = 10;
    const barX = this.x - barWidth/2;
    const barY = this.y - this.r - 25;
    
    // Sombra da barra
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.4)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetY = 3;
    
    // Background da barra com borda arredondada
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.beginPath();
    ctx.roundRect(barX, barY, barWidth, barHeight, 5);
    ctx.fill();
    ctx.restore();
    
    // Barra de fome com gradiente animado
    const hungerPercent = this.hunger / this.maxHunger;
    let barColor1, barColor2, barColor3;
    
    if (hungerPercent > 0.5) {
      barColor1 = '#22c55e';
      barColor2 = '#16a34a';
      barColor3 = '#15803d';
    } else if (hungerPercent > 0.25) {
      barColor1 = '#f59e0b';
      barColor2 = '#d97706';
      barColor3 = '#b45309';
    } else {
      barColor1 = '#ef4444';
      barColor2 = '#dc2626';
      barColor3 = '#b91c1c';
    }
    
    const gradient = ctx.createLinearGradient(barX, barY, barX + barWidth, barY + barHeight);
    gradient.addColorStop(0, barColor1);
    gradient.addColorStop(0.5, barColor2);
    gradient.addColorStop(1, barColor3);
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.roundRect(barX + 2, barY + 2, (barWidth - 4) * hungerPercent, barHeight - 4, 4);
    ctx.fill();
    
    // Brilho superior na barra (efeito 3D)
    const highlightGradient = ctx.createLinearGradient(barX, barY, barX, barY + barHeight * 0.5);
    highlightGradient.addColorStop(0, 'rgba(255,255,255,0.5)');
    highlightGradient.addColorStop(1, 'rgba(255,255,255,0)');
    
    ctx.fillStyle = highlightGradient;
    ctx.beginPath();
    ctx.roundRect(barX + 2, barY + 2, (barWidth - 4) * hungerPercent, barHeight * 0.4, 4);
    ctx.fill();
    
    // Borda da barra com efeito metálico
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(barX, barY, barWidth, barHeight, 5);
    ctx.stroke();
    
    // Flash de cura com pulso
    if (this.healFlash > 0) {
      ctx.save();
      ctx.globalAlpha = this.healFlash * 0.8;
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 4;
      ctx.shadowColor = '#22c55e';
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.roundRect(barX - 3, barY - 3, barWidth + 6, barHeight + 6, 6);
      ctx.stroke();
      ctx.restore();
    }
    
    // Texto de porcentagem (opcional, apenas quando baixo)
    if (hungerPercent < 0.3) {
      ctx.save();
      ctx.fillStyle = 'white';
      ctx.font = 'bold 10px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.shadowBlur = 3;
      ctx.fillText(`${Math.floor(hungerPercent * 100)}%`, this.x, barY + barHeight / 2);
      ctx.restore();
    }
  }

  drawSharkUltra(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);

    // Flash de dano sem deformar o desenho.
    if (this.damageFlash > 0) {
      ctx.globalAlpha = Math.max(0.55, 1 - this.damageFlash * 0.25);
    }

    // Paleta robusta: skins antigas nem sempre possuem accent/eye.
    const rawColors = typeof getPlayerColors === 'function' ? getPlayerColors() : {};
    const colors = {
      primary: rawColors.primary || '#64748B',
      secondary: rawColors.secondary || '#94A3B8',
      belly: rawColors.belly || '#E2E8F0',
      accent: rawColors.accent || rawColors.primary || '#334155',
      eye: rawColors.eye || '#0F172A'
    };

    // Proporções compactas e estáveis. Antes as nadadeiras usavam múltiplos
    // do bodyWidth e podiam ficar muito maiores que o corpo.
    const L = this.r * 3.55;
    const H = this.r * 1.12;
    const tailWave = Math.sin(this.tailPhase) * this.r * 0.22;
    const finWave = Math.sin(this.finPhase) * this.r * 0.055;
    const bodyFlex = Math.sin(this.bodyFlexPhase) * this.r * 0.055;

    // Sombra suave sob o tubarão.
    ctx.save();
    ctx.globalAlpha *= 0.22;
    ctx.fillStyle = '#020617';
    ctx.beginPath();
    ctx.ellipse(-this.r * 0.1, this.r * 0.32, L * 0.56, H * 0.62, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // ===== NADADEIRAS DE FUNDO =====
    const finGrad = ctx.createLinearGradient(0, -H, 0, H);
    finGrad.addColorStop(0, adjustColorBrightness(colors.primary, -8));
    finGrad.addColorStop(1, colors.secondary);
    ctx.fillStyle = finGrad;

    // Dorsal: triangular-curva, altura limitada.
    ctx.beginPath();
    ctx.moveTo(-L * 0.16, -H * 0.70);
    ctx.quadraticCurveTo(-L * 0.02, -H * 1.55 + finWave, L * 0.15, -H * 0.79);
    ctx.quadraticCurveTo(L * 0.04, -H * 0.68, -L * 0.16, -H * 0.70);
    ctx.closePath();
    ctx.fill();

    // Peitoral de trás: curta e inclinada, nunca atravessa a tela.
    ctx.save();
    ctx.globalAlpha *= 0.78;
    ctx.beginPath();
    ctx.moveTo(L * 0.05, -H * 0.18);
    ctx.quadraticCurveTo(-L * 0.02, -H * 0.85 + finWave, L * 0.23, -H * 1.02 + finWave);
    ctx.quadraticCurveTo(L * 0.18, -H * 0.48, L * 0.05, -H * 0.18);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // ===== CAUDA =====
    const tailRootX = -L * 0.53;
    const tailTipX = -L * 0.88;
    ctx.fillStyle = adjustColorBrightness(colors.primary, -5);
    ctx.beginPath();
    ctx.moveTo(tailRootX, -H * 0.23 + bodyFlex);
    ctx.quadraticCurveTo(-L * 0.70, -H * 0.16 + tailWave, tailTipX, tailWave);
    ctx.quadraticCurveTo(-L * 1.02, -H * 0.78 + tailWave, -L * 0.91, -H * 0.92 + tailWave);
    ctx.quadraticCurveTo(-L * 0.73, -H * 0.38 + tailWave, tailTipX, tailWave);
    ctx.quadraticCurveTo(-L * 1.02, H * 0.72 + tailWave, -L * 0.90, H * 0.88 + tailWave);
    ctx.quadraticCurveTo(-L * 0.71, H * 0.32 + tailWave, tailRootX, H * 0.23 - bodyFlex);
    ctx.closePath();
    ctx.fill();

    // ===== CORPO =====
    const bodyGradient = ctx.createLinearGradient(0, -H, 0, H);
    bodyGradient.addColorStop(0, adjustColorBrightness(colors.accent, -8));
    bodyGradient.addColorStop(0.35, colors.primary);
    bodyGradient.addColorStop(0.70, colors.secondary);
    bodyGradient.addColorStop(1, colors.belly);
    ctx.fillStyle = bodyGradient;
    ctx.beginPath();
    ctx.moveTo(L * 0.58, -H * 0.02); // focinho
    ctx.bezierCurveTo(L * 0.48, -H * 0.48, L * 0.20, -H * 0.66, -L * 0.15, -H * 0.62);
    ctx.bezierCurveTo(-L * 0.35, -H * 0.58 + bodyFlex, -L * 0.50, -H * 0.36 + bodyFlex, tailRootX, -H * 0.23 + bodyFlex);
    ctx.lineTo(tailRootX, H * 0.23 - bodyFlex);
    ctx.bezierCurveTo(-L * 0.38, H * 0.51 - bodyFlex, -L * 0.08, H * 0.61, L * 0.22, H * 0.52);
    ctx.bezierCurveTo(L * 0.43, H * 0.43, L * 0.58, H * 0.20, L * 0.58, -H * 0.02);
    ctx.closePath();
    ctx.fill();

    // Barriga clara integrada ao corpo.
    ctx.save();
    ctx.globalAlpha *= 0.55;
    const bellyGrad = ctx.createRadialGradient(L * 0.10, H * 0.24, 0, L * 0.10, H * 0.24, L * 0.50);
    bellyGrad.addColorStop(0, '#FFFFFF');
    bellyGrad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = bellyGrad;
    ctx.beginPath();
    ctx.ellipse(L * 0.08, H * 0.23, L * 0.39, H * 0.26, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Peitoral da frente, desenhada por cima do corpo e com movimento discreto.
    ctx.save();
    ctx.globalAlpha *= 0.88;
    ctx.fillStyle = adjustColorBrightness(colors.secondary, -5);
    ctx.beginPath();
    ctx.moveTo(-L * 0.02, H * 0.18);
    ctx.quadraticCurveTo(L * 0.02, H * 0.78 - finWave, L * 0.25, H * 0.94 - finWave);
    ctx.quadraticCurveTo(L * 0.19, H * 0.44, -L * 0.02, H * 0.18);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Brânquias discretas.
    ctx.save();
    ctx.strokeStyle = adjustColorBrightness(colors.accent, -22);
    ctx.lineWidth = Math.max(1, this.r * 0.055);
    ctx.globalAlpha *= 0.48;
    for (let i = 0; i < 3; i++) {
      const gx = -L * 0.03 + i * this.r * 0.18;
      ctx.beginPath();
      ctx.arc(gx, -H * 0.03, this.r * 0.22, -0.75, 0.75);
      ctx.stroke();
    }
    ctx.restore();

    // Olho compacto e expressivo.
    const eyeX = L * 0.37;
    const eyeY = -H * 0.23;
    const eyeR = this.r * 0.16;
    ctx.fillStyle = '#EAFBFF';
    ctx.beginPath();
    ctx.arc(eyeX, eyeY, eyeR, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#38BDF8';
    ctx.beginPath();
    ctx.arc(eyeX + eyeR * 0.12, eyeY, eyeR * 0.60, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = colors.eye;
    ctx.beginPath();
    ctx.arc(eyeX + eyeR * 0.22, eyeY, eyeR * 0.31, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(eyeX + eyeR * 0.43, eyeY - eyeR * 0.30, eyeR * 0.19, 0, Math.PI * 2);
    ctx.fill();

    // Boca: os dentes ficam DENTRO da abertura, sem efeito de serra externo.
    const bite = Math.max(0, Math.min(1, this.mouthOpenness));
    const mouthX1 = L * 0.34;
    const mouthX2 = L * 0.57;
    const mouthY = H * 0.12;
    const open = this.r * (0.035 + bite * 0.16);
    ctx.save();
    ctx.strokeStyle = '#1F2937';
    ctx.lineWidth = Math.max(1.4, this.r * 0.07);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(mouthX1, mouthY);
    ctx.quadraticCurveTo(L * 0.48, mouthY + open, mouthX2, mouthY - open * 0.10);
    ctx.stroke();

    if (bite > 0.12) {
      ctx.fillStyle = '#F8FAFC';
      const teeth = 5;
      for (let i = 0; i < teeth; i++) {
        const t = (i + 0.5) / teeth;
        const tx = mouthX1 + (mouthX2 - mouthX1) * t;
        const ty = mouthY + open * (0.25 + 0.35 * Math.sin(t * Math.PI));
        const th = this.r * (0.07 + bite * 0.035);
        ctx.beginPath();
        ctx.moveTo(tx - th * 0.40, ty);
        ctx.lineTo(tx + th * 0.40, ty);
        ctx.lineTo(tx, ty + th);
        ctx.closePath();
        ctx.fill();
      }
    }
    ctx.restore();

    // Pequeno brilho no dorso para dar volume, sem pesar.
    ctx.save();
    ctx.globalAlpha *= 0.18;
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = Math.max(1, this.r * 0.06);
    ctx.beginPath();
    ctx.moveTo(-L * 0.28, -H * 0.42);
    ctx.quadraticCurveTo(L * 0.05, -H * 0.60, L * 0.34, -H * 0.33);
    ctx.stroke();
    ctx.restore();

    // Cicatrizes continuam compatíveis com o sistema existente.
    ctx.save();
    this.scars.forEach(scar => {
      ctx.globalAlpha = Math.max(0, scar.life) * 0.6;
      ctx.strokeStyle = '#7F1D1D';
      ctx.lineWidth = Math.max(1.2, this.r * 0.05);
      ctx.beginPath();
      ctx.moveTo(scar.x1, scar.y1);
      ctx.lineTo(scar.x2, scar.y2);
      ctx.stroke();
    });
    ctx.restore();

    // Aura de velocidade só no dash/alta velocidade.
    const speedSq = this.velocity.x * this.velocity.x + this.velocity.y * this.velocity.y;
    if (this.dashActive || (this.isMoving && speedSq > 190 * 190)) {
      ctx.save();
      ctx.globalAlpha *= this.dashActive ? 0.24 : 0.10;
      ctx.strokeStyle = '#7DD3FC';
      ctx.lineWidth = Math.max(1.5, this.r * 0.06);
      ctx.beginPath();
      ctx.ellipse(-L * 0.08, 0, L * 0.73, H * 0.90, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    ctx.restore();
  }

  eat(food) {
    this.hunger = Math.min(this.hunger + food + upgrades.heal * 5, this.maxHunger);
    this.healFlash = 1.0;
    this.justAte = true;
    this.ateTimer = 0.3; // Boca fica aberta por 0.3 segundos
    
    // Criar partículas extras ao comer
    for (let i = 0; i < 5; i++) {
      this.createBubble();
    }
  }

  takeDamage(damage) {
    // ✅ Redução de dano por skills
    if (typeof playerStats !== 'undefined' && playerStats.damageReduction) {
      damage *= (1 - playerStats.damageReduction);
    }
    
    // ✅ Segundo Fôlego - habilidade especial
    if (this.hunger - damage <= 0 && this.specialAbilities.second_wind) {
      this.hunger = this.maxHunger * 0.3;
      this.specialAbilities.second_wind = false; // Usa apenas 1x por run
      
      // Criar efeito visual
      if (typeof createParticles === 'function') {
        createParticles(this.x, this.y, '#00FF00', 30);
      }
      
      console.log('💚 Segundo Fôlego Ativado!');
      return;
    }
    
    this.hunger -= damage;
    if (this.hunger < 0) this.hunger = 0;
    this.damageFlash = 1.0;
    
    // Adicionar cicatriz temporária
    const scarAngle = Math.random() * Math.PI * 2;
    const scarDist = Math.random() * this.r * 2;
    const scarLength = this.r * (0.3 + Math.random() * 0.4);
    const scarX = Math.cos(scarAngle) * scarDist;
    const scarY = Math.sin(scarAngle) * scarDist;
    
    this.scars.push({
      x1: scarX,
      y1: scarY,
      x2: scarX + Math.cos(scarAngle + Math.PI * 0.3) * scarLength,
      y2: scarY + Math.sin(scarAngle + Math.PI * 0.3) * scarLength,
      life: 1.0
    });
    
    // Limitar número de cicatrizes
    if (this.scars.length > 5) {
      this.scars.shift();
    }
  }
  
  // ✅ NOVOS MÉTODOS DE HABILIDADES ESPECIAIS
  
  canDash() {
    // Dash básico disponível desde o início; evoluções podem melhorar a mobilidade depois.
    return this.dashCooldown <= 0 && !this.isStunned && this.hunger > 6;
  }
  
  activateDash() {
    this.dashActive = true;
    this.dashTimer = 0.28;
    this.dashSpeed = Math.max(520, this.speed * 2.45);
    this.dashCooldown = 2.2;
    this.hunger = Math.max(1, this.hunger - 3); // custo pequeno evita spam infinito
    
    // Efeito sonoro (se disponível)
    if (typeof playSFX === 'function') {
      playSFX('eat'); // Placeholder, usar som de dash se tiver
    }
    
    console.log('⚡ Dash ativado!');
  }
  
  updateDash(dt) {
    this.dashTimer -= dt;
    
    if (this.dashTimer <= 0) {
      this.dashActive = false;
    } else {
      // Movimento em dash
      const dx = Math.cos(this.angle);
      const dy = Math.sin(this.angle);
      this.x += dx * this.dashSpeed * dt;
      this.y += dy * this.dashSpeed * dt;

      // O dash também respeita os limites do mapa.
      if (typeof mapSystem !== 'undefined' && mapSystem) {
        mapSystem.enforceBoundaries(this);
      }
      
      // Criar rastro de partículas
      if (typeof createParticles === 'function' && Math.random() < 0.5) {
        createParticles(this.x, this.y, '#00FFFF', 5);
      }
      
      // Criar bolhas extras
      for (let i = 0; i < 2; i++) {
        this.createBubble();
      }
    }
  }

  isDead() {
    return this.hunger <= 0;
  }
}

// Instância global do player
let player = null;

function initPlayer() {
  player = new Player(300, 300);
}
