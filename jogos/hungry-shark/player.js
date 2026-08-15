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
    
    // Flash de dano
    if (this.damageFlash > 0) {
      ctx.globalAlpha = 1 - this.damageFlash * 0.3;
      ctx.filter = `hue-rotate(${this.damageFlash * 30}deg)`;
    }
    
    const bodyLength = this.r * 3.2;
    const bodyWidth = this.r * 1.6;
    const tailOffset = Math.sin(this.tailPhase) * this.r * 0.4;
    const bodyFlex = Math.sin(this.bodyFlexPhase) * this.r * 0.15;
    
    // Obter cores do sistema visual (skins/transformações/evolução)
    const colors = typeof getPlayerColors === 'function' ? 
                   getPlayerColors() : 
                   { 
                     primary: '#4A5568', 
                     secondary: '#718096', 
                     belly: '#CBD5E0',
                     accent: '#2D3748',
                     eye: '#1A202C'
                   };
    
    // ========== SOMBRA PROJETADA ==========
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 20;
    ctx.shadowOffsetX = 6;
    ctx.shadowOffsetY = 6;
    
    // ========== CORPO PRINCIPAL COM ILUMINAÇÃO 3D ==========
    const bodyGradient = ctx.createLinearGradient(
      -bodyLength*0.5, -bodyWidth*0.7, 
      bodyLength*0.7, bodyWidth*0.7
    );
    bodyGradient.addColorStop(0, colors.accent);
    bodyGradient.addColorStop(0.2, colors.primary);
    bodyGradient.addColorStop(0.45, colors.secondary);
    bodyGradient.addColorStop(0.6, colors.belly);
    bodyGradient.addColorStop(0.8, colors.secondary);
    bodyGradient.addColorStop(1, colors.primary);
    
    ctx.fillStyle = bodyGradient;
    ctx.beginPath();
    
    // Nariz/focinho afiado
    ctx.moveTo(bodyLength * 0.75, 0);
    
    // Parte superior do corpo com curvatura realista
    ctx.bezierCurveTo(
      bodyLength * 0.65, -bodyWidth * 0.3,
      bodyLength * 0.45, -bodyWidth * 0.5,
      bodyLength * 0.2, -bodyWidth * 0.55
    );
    ctx.bezierCurveTo(
      bodyLength * 0.05, -bodyWidth * 0.56,
      -bodyLength * 0.1, -bodyWidth * 0.54,
      -bodyLength * 0.25, -bodyWidth * 0.5
    );
    
    // Costas com flexão de natação
    ctx.bezierCurveTo(
      -bodyLength * 0.35, -bodyWidth * 0.45 + bodyFlex,
      -bodyLength * 0.5, -bodyWidth * 0.3 + bodyFlex * 1.5,
      -bodyLength * 0.65, -bodyWidth * 0.15 + bodyFlex * 0.8
    );
    
    // Base da cauda
    ctx.lineTo(-bodyLength * 0.7, 0);
    
    // Parte inferior do corpo
    ctx.bezierCurveTo(
      -bodyLength * 0.5, bodyWidth * 0.3 - bodyFlex * 0.8,
      -bodyLength * 0.35, bodyWidth * 0.45 - bodyFlex,
      -bodyLength * 0.25, bodyWidth * 0.5
    );
    ctx.bezierCurveTo(
      -bodyLength * 0.1, bodyWidth * 0.54,
      bodyLength * 0.05, bodyWidth * 0.56,
      bodyLength * 0.2, bodyWidth * 0.55
    );
    
    // Barriga e retorno ao focinho
    ctx.bezierCurveTo(
      bodyLength * 0.45, bodyWidth * 0.5,
      bodyLength * 0.65, bodyWidth * 0.3,
      bodyLength * 0.75, 0
    );
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    
    // ========== BARRIGA CLARA COM GRADIENTE SUAVE ==========
    const bellyGradient = ctx.createRadialGradient(0, bodyWidth * 0.2, 0, 0, bodyWidth * 0.2, bodyLength * 0.5);
    bellyGradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
    bellyGradient.addColorStop(0.6, 'rgba(203, 213, 224, 0.5)');
    bellyGradient.addColorStop(1, 'rgba(203, 213, 224, 0)');
    
    ctx.fillStyle = bellyGradient;
    ctx.beginPath();
    ctx.ellipse(bodyLength * 0.1, bodyWidth * 0.2, bodyLength * 0.45, bodyWidth * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // ========== TEXTURA DE ESCAMAS ==========
    ctx.save();
    ctx.globalAlpha = 0.12;
    ctx.strokeStyle = colors.accent;
    ctx.lineWidth = 0.8;
    
    // Padrão de escamas em arco
    for (let i = -4; i <= 4; i++) {
      for (let j = -2; j <= 2; j++) {
        const scaleX = bodyLength * 0.05 + i * this.r * 0.35;
        const scaleY = j * bodyWidth * 0.3;
        const scaleSize = this.r * 0.18;
        
        ctx.beginPath();
        ctx.arc(scaleX, scaleY, scaleSize, 0, Math.PI * 2);
        ctx.stroke();
        
        // Linhas de detalhe nas escamas
        ctx.beginPath();
        ctx.moveTo(scaleX - scaleSize * 0.5, scaleY);
        ctx.lineTo(scaleX + scaleSize * 0.5, scaleY);
        ctx.stroke();
      }
    }
    ctx.restore();
    
    // ========== BARBATANA DORSAL PRINCIPAL ==========
    const finWave = Math.sin(this.finPhase) * this.r * 0.2;
    
    const dorsalGradient = ctx.createLinearGradient(
      0, -bodyWidth * 0.55, 
      bodyLength * 0.2, -bodyWidth * 1.4
    );
    dorsalGradient.addColorStop(0, colors.primary);
    dorsalGradient.addColorStop(0.4, colors.secondary);
    dorsalGradient.addColorStop(0.7, adjustColorBrightness(colors.secondary, 20));
    dorsalGradient.addColorStop(1, adjustColorBrightness(colors.primary, -20));
    
    ctx.fillStyle = dorsalGradient;
    ctx.beginPath();
    ctx.moveTo(-bodyLength * 0.05, -bodyWidth * 0.55);
    ctx.bezierCurveTo(
      0, -bodyWidth * 0.85 + finWave * 0.5,
      bodyLength * 0.08, -bodyWidth * 1.25 + finWave,
      bodyLength * 0.18, -bodyWidth * 1.35 + finWave
    );
    ctx.bezierCurveTo(
      bodyLength * 0.22, -bodyWidth * 1.25 + finWave * 0.8,
      bodyLength * 0.32, -bodyWidth * 0.9 + finWave * 0.5,
      bodyLength * 0.4, -bodyWidth * 0.65 + finWave * 0.3
    );
    ctx.bezierCurveTo(
      bodyLength * 0.42, -bodyWidth * 0.58,
      bodyLength * 0.35, -bodyWidth * 0.55,
      bodyLength * 0.25, -bodyWidth * 0.55
    );
    ctx.closePath();
    ctx.fill();
    
    // Detalhes da barbatana dorsal (raios)
    ctx.save();
    ctx.strokeStyle = adjustColorBrightness(colors.primary, -30);
    ctx.lineWidth = 1.2;
    ctx.globalAlpha = 0.6;
    
    for (let i = 0; i < 6; i++) {
      const t = i / 5;
      const startX = -bodyLength * 0.05 + t * bodyLength * 0.3;
      const startY = -bodyWidth * 0.55;
      const endX = bodyLength * (0.08 + t * 0.1);
      const endY = -bodyWidth * (0.9 + t * 0.4) + finWave * (1 - t * 0.5);
      
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.stroke();
    }
    ctx.restore();
    
    // ========== BARBATANAS PEITORAIS (LATERAIS) ==========
    const pectoralWave = Math.sin(this.finPhase * 1.2) * this.r * 0.15;
    
    // Barbatana peitoral superior (direita)
    ctx.save();
    ctx.globalAlpha = 0.85;
    const pectoralGradient1 = ctx.createLinearGradient(
      bodyLength * 0.08, -bodyWidth * 0.45,
      bodyLength * 0.35, -bodyWidth * 0.7
    );
    pectoralGradient1.addColorStop(0, colors.primary);
    pectoralGradient1.addColorStop(0.6, colors.secondary);
    pectoralGradient1.addColorStop(1, adjustColorBrightness(colors.secondary, -15));
    
    ctx.fillStyle = pectoralGradient1;
    ctx.beginPath();
    ctx.moveTo(bodyLength * 0.08, -bodyWidth * 0.45);
    ctx.bezierCurveTo(
      bodyLength * 0.15, -bodyWidth * 0.55 + pectoralWave,
      bodyLength * 0.25, -bodyWidth * 0.65 + pectoralWave * 1.2,
      bodyLength * 0.35, -bodyWidth * 0.7 + pectoralWave * 1.3
    );
    ctx.bezierCurveTo(
      bodyLength * 0.32, -bodyWidth * 0.6 + pectoralWave,
      bodyLength * 0.25, -bodyWidth * 0.5 + pectoralWave * 0.7,
      bodyLength * 0.15, -bodyWidth * 0.42
    );
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    
    // Barbatana peitoral inferior (esquerda)
    ctx.save();
    ctx.globalAlpha = 0.85;
    const pectoralGradient2 = ctx.createLinearGradient(
      bodyLength * 0.08, bodyWidth * 0.45,
      bodyLength * 0.35, bodyWidth * 0.7
    );
    pectoralGradient2.addColorStop(0, colors.primary);
    pectoralGradient2.addColorStop(0.6, colors.secondary);
    pectoralGradient2.addColorStop(1, adjustColorBrightness(colors.secondary, -15));
    
    ctx.fillStyle = pectoralGradient2;
    ctx.beginPath();
    ctx.moveTo(bodyLength * 0.08, bodyWidth * 0.45);
    ctx.bezierCurveTo(
      bodyLength * 0.15, bodyWidth * 0.55 - pectoralWave,
      bodyLength * 0.25, bodyWidth * 0.65 - pectoralWave * 1.2,
      bodyLength * 0.35, bodyWidth * 0.7 - pectoralWave * 1.3
    );
    ctx.bezierCurveTo(
      bodyLength * 0.32, bodyWidth * 0.6 - pectoralWave,
      bodyLength * 0.25, bodyWidth * 0.5 - pectoralWave * 0.7,
      bodyLength * 0.15, bodyWidth * 0.42
    );
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    
    // ========== BARBATANA ANAL (INFERIOR TRASEIRA) ==========
    ctx.save();
    ctx.globalAlpha = 0.9;
    const analFinGradient = ctx.createLinearGradient(
      -bodyLength * 0.2, bodyWidth * 0.5,
      -bodyLength * 0.1, bodyWidth * 0.8
    );
    analFinGradient.addColorStop(0, colors.primary);
    analFinGradient.addColorStop(1, colors.secondary);
    
    ctx.fillStyle = analFinGradient;
    ctx.beginPath();
    ctx.moveTo(-bodyLength * 0.2, bodyWidth * 0.5);
    ctx.bezierCurveTo(
      -bodyLength * 0.18, bodyWidth * 0.65 - finWave * 0.5,
      -bodyLength * 0.12, bodyWidth * 0.75 - finWave * 0.8,
      -bodyLength * 0.08, bodyWidth * 0.78 - finWave
    );
    ctx.bezierCurveTo(
      -bodyLength * 0.1, bodyWidth * 0.7,
      -bodyLength * 0.15, bodyWidth * 0.58,
      -bodyLength * 0.12, bodyWidth * 0.5
    );
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    
    // ========== CAUDA COMPLEXA COM MOVIMENTO FLUIDO ==========
    const tailGradient = ctx.createLinearGradient(
      -bodyLength * 0.7, 0, 
      -bodyLength * 1.3, 0
    );
    tailGradient.addColorStop(0, colors.primary);
    tailGradient.addColorStop(0.3, colors.secondary);
    tailGradient.addColorStop(0.6, adjustColorBrightness(colors.secondary, 15));
    tailGradient.addColorStop(1, adjustColorBrightness(colors.primary, -25));
    
    ctx.fillStyle = tailGradient;
    ctx.beginPath();
    ctx.moveTo(-bodyLength * 0.7, 0);
    
    // Lóbulo superior da cauda
    ctx.bezierCurveTo(
      -bodyLength * 0.82, -bodyWidth * 0.25 + tailOffset * 0.3,
      -bodyLength * 1.0, -bodyWidth * 0.5 + tailOffset * 0.7,
      -bodyLength * 1.2, -bodyWidth * 0.7 + tailOffset
    );
    
    // Ponta superior afiada
    ctx.bezierCurveTo(
      -bodyLength * 1.28, -bodyWidth * 0.65 + tailOffset * 0.95,
      -bodyLength * 1.32, -bodyWidth * 0.5 + tailOffset * 0.85,
      -bodyLength * 1.25, -bodyWidth * 0.35 + tailOffset * 0.7
    );
    
    // Meio da cauda (chanfro)
    ctx.bezierCurveTo(
      -bodyLength * 1.15, -bodyWidth * 0.15 + tailOffset * 0.4,
      -bodyLength * 1.0, -bodyWidth * 0.05 + tailOffset * 0.2,
      -bodyLength * 0.9, 0
    );
    
    // Lóbulo inferior da cauda
    ctx.bezierCurveTo(
      -bodyLength * 1.0, bodyWidth * 0.05 - tailOffset * 0.2,
      -bodyLength * 1.15, bodyWidth * 0.15 - tailOffset * 0.4,
      -bodyLength * 1.25, bodyWidth * 0.35 - tailOffset * 0.7
    );
    
    // Ponta inferior afiada
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
    ctx.closePath();
    ctx.fill();
    
    // Detalhes da cauda (raios)
    ctx.save();
    ctx.strokeStyle = adjustColorBrightness(colors.primary, -35);
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = 0.5;
    
    for (let i = 0; i < 7; i++) {
      const offset = (i - 3) * bodyWidth * 0.15;
      const tailMult = offset > 0 ? -0.8 : 0.8;
      
      ctx.beginPath();
      ctx.moveTo(-bodyLength * 0.8, offset * 0.5);
      ctx.lineTo(
        -bodyLength * 1.15, 
        offset * 1.6 + tailOffset * tailMult
      );
      ctx.stroke();
    }
    ctx.restore();
    
    // ========== BRÂNQUIAS (GILLS) COM ANIMAÇÃO ==========
    const gillOpen = Math.abs(Math.sin(this.gillPhase)) * 0.3;
    
    ctx.save();
    ctx.strokeStyle = adjustColorBrightness(colors.primary, -40);
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.globalAlpha = 0.6 + gillOpen;
    
    for (let i = 0; i < 4; i++) {
      const gillX = -bodyLength * 0.15 + i * this.r * 0.25;
      const gillY1 = -bodyWidth * 0.35;
      const gillY2 = -bodyWidth * 0.2;
      const gillCurve = this.r * 0.1 * (1 + gillOpen);
      
      ctx.beginPath();
      ctx.moveTo(gillX, gillY1);
      ctx.quadraticCurveTo(
        gillX - gillCurve, (gillY1 + gillY2) / 2,
        gillX, gillY2
      );
      ctx.stroke();
    }
    ctx.restore();
    
    // ========== OLHO ULTRA DETALHADO COM EXPRESSÃO ==========
    const eyeX = bodyLength * 0.52;
    const eyeY = -bodyWidth * 0.25;
    const eyeSize = this.r * 0.28;
    const blinkAmount = Math.max(0, this.eyeBlinkPhase);
    
    // Órbita do olho (sombra)
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath();
    ctx.ellipse(eyeX, eyeY, eyeSize * 1.15, eyeSize * 1.15 * (1 - blinkAmount * 0.8), 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    
    // Branco do olho
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.ellipse(eyeX, eyeY, eyeSize, eyeSize * (1 - blinkAmount * 0.8), 0, 0, Math.PI * 2);
    ctx.fill();
    
    if (blinkAmount < 0.5) { // Só desenhar detalhes se não estiver piscando
      // Íris com gradiente
      const irisGradient = ctx.createRadialGradient(
        eyeX + eyeSize * 0.1, eyeY, 0,
        eyeX + eyeSize * 0.1, eyeY, eyeSize * 0.7
      );
      irisGradient.addColorStop(0, '#2DD4BF');
      irisGradient.addColorStop(0.4, '#14B8A6');
      irisGradient.addColorStop(0.8, '#0D9488');
      irisGradient.addColorStop(1, '#0F766E');
      
      ctx.fillStyle = irisGradient;
      ctx.beginPath();
      ctx.arc(eyeX + eyeSize * 0.1, eyeY, eyeSize * 0.7, 0, Math.PI * 2);
      ctx.fill();
      
      // Pupila com brilho
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(eyeX + eyeSize * 0.15, eyeY, eyeSize * 0.4, 0, Math.PI * 2);
      ctx.fill();
      
      // Brilho principal no olho
      const highlightGradient = ctx.createRadialGradient(
        eyeX + eyeSize * 0.35, eyeY - eyeSize * 0.25, 0,
        eyeX + eyeSize * 0.35, eyeY - eyeSize * 0.25, eyeSize * 0.35
      );
      highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
      highlightGradient.addColorStop(0.6, 'rgba(255, 255, 255, 0.5)');
      highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      
      ctx.fillStyle = highlightGradient;
      ctx.beginPath();
      ctx.arc(eyeX + eyeSize * 0.35, eyeY - eyeSize * 0.25, eyeSize * 0.35, 0, Math.PI * 2);
      ctx.fill();
      
      // Brilho secundário
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.beginPath();
      ctx.arc(eyeX - eyeSize * 0.15, eyeY + eyeSize * 0.2, eyeSize * 0.15, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Pálpebra (quando pisca)
    if (blinkAmount > 0) {
      ctx.save();
      ctx.fillStyle = colors.primary;
      ctx.beginPath();
      ctx.ellipse(eyeX, eyeY, eyeSize * 1.05, eyeSize * blinkAmount, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    
    // ========== BOCA ANIMADA ==========
    const mouthX = bodyLength * 0.68;
    const mouthY = bodyWidth * 0.05;
    const mouthOpen = this.mouthOpenness * this.r * 0.25;
    
    // Contorno da boca
    ctx.save();
    ctx.strokeStyle = adjustColorBrightness(colors.primary, -50);
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    
    ctx.beginPath();
    ctx.moveTo(mouthX - this.r * 0.3, mouthY - mouthOpen);
    ctx.quadraticCurveTo(
      mouthX, mouthY + mouthOpen * 2,
      mouthX + this.r * 0.1, mouthY - mouthOpen * 0.5
    );
    ctx.stroke();
    ctx.restore();
    
    // ========== DENTES ULTRA REALISTAS ==========
    ctx.save();
    ctx.strokeStyle = '#FFFFFF';
    ctx.fillStyle = '#F8F9FA';
    ctx.lineWidth = 2.8;
    ctx.lineCap = 'round';
    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.shadowBlur = 2;
    
    const teethCount = 9;
    for (let i = 0; i < teethCount; i++) {
      const tx = bodyLength * 0.58 + i * this.r * 0.18;
      const toothLength = (i % 2 === 0) ? 12 : 9;
      const toothAngle = (i % 2 === 0) ? -0.1 : 0.1;
      const ty = i % 2 === 0 ? -4 : -2;
      
      // Dente como triângulo preenchido
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.lineTo(tx - 2 + Math.cos(toothAngle) * 2, ty + toothLength);
      ctx.lineTo(tx + 2 + Math.cos(toothAngle) * 2, ty + toothLength);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
    
    // ========== CICATRIZES TEMPORÁRIAS DE COMBATE ==========
    ctx.save();
    this.scars.forEach(scar => {
      ctx.globalAlpha = scar.life * 0.7;
      ctx.strokeStyle = '#8B0000';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      
      ctx.beginPath();
      ctx.moveTo(scar.x1, scar.y1);
      ctx.lineTo(scar.x2, scar.y2);
      ctx.stroke();
    });
    ctx.restore();
    
    // ========== EFEITO DE BRILHO QUANDO SE MOVE RÁPIDO ==========
    if (this.isMoving && this.velocity.x * this.velocity.x + this.velocity.y * this.velocity.y > 150 * 150) {
      ctx.save();
      ctx.globalAlpha = 0.15;
      ctx.strokeStyle = '#60A5FA';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#3B82F6';
      ctx.shadowBlur = 15;
      
      // Aura ao redor do tubarão
      ctx.beginPath();
      ctx.ellipse(0, 0, bodyLength * 1.1, bodyWidth * 1.1, 0, 0, Math.PI * 2);
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
