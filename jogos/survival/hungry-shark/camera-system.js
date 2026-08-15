// ================= SISTEMA DE CÂMERA =================

/**
 * Sistema completo de câmera com:
 * - Seguimento suave do jogador
 * - Zoom dinâmico
 * - Screen shake
 * - Viewport culling (não renderizar fora da tela)
 * - Conversão de coordenadas tela <-> mundo
 * - Bounds/limites do mundo
 */

class Camera {
  constructor(width, height) {
    // Dimensões do viewport
    this.width = width;
    this.height = height;
    
    // Posição da câmera no mundo
    this.x = 0;
    this.y = 0;
    
    // Zoom (1.0 = normal, 0.5 = afastado, 2.0 = aproximado)
    this.zoom = 1.0;
    this.targetZoom = 1.0;
    this.minZoom = 0.5;
    this.maxZoom = 2.0;
    
    // Seguimento do alvo
    this.target = null;
    this.smoothing = 0.1; // 0 = instantâneo, 1 = sem movimento
    this.followOffset = { x: 0, y: 0 };
    
    // Screen shake
    this.shake = {
      x: 0,
      y: 0,
      intensity: 0,
      duration: 0,
      decay: 0.9
    };
    
    // Limites do mundo (opcional)
    this.bounds = null;
    
    // Deadzone (zona morta onde o jogador pode se mover sem mover a câmera)
    this.deadzone = {
      enabled: false,
      width: 100,
      height: 100
    };
    
    // Efeitos visuais
    this.flash = {
      active: false,
      color: '#FFFFFF',
      alpha: 0,
      duration: 0
    };
    
    // Performance
    this.cullingMargin = 100; // Margem extra para culling
  }
  
  /**
   * Define o alvo para a câmera seguir
   */
  setTarget(target) {
    this.target = target;
  }
  
  /**
   * Define os limites do mundo
   */
  setBounds(minX, minY, maxX, maxY) {
    this.bounds = { minX, minY, maxX, maxY };
  }
  
  /**
   * Atualiza a posição da câmera
   */
  update(dt) {
    if (this.target) {
      this.followTarget(dt);
    }
    
    // Atualizar zoom suave
    if (this.zoom !== this.targetZoom) {
      const zoomDiff = this.targetZoom - this.zoom;
      this.zoom += zoomDiff * 0.1;
      
      // Snap quando muito próximo
      if (Math.abs(zoomDiff) < 0.001) {
        this.zoom = this.targetZoom;
      }
    }
    
    // Aplicar limites se definidos
    if (this.bounds) {
      this.applyBounds();
    }
    
    // Atualizar shake
    this.updateShake(dt);
    
    // Atualizar flash
    this.updateFlash(dt);
  }
  
  /**
   * Segue o alvo com suavização
   */
  followTarget(dt) {
    if (!this.target) return;
    
    // Posição alvo da câmera (centralizar no target)
    let targetX = this.target.x - this.width / (2 * this.zoom);
    let targetY = this.target.y - this.height / (2 * this.zoom);
    
    // Aplicar offset
    targetX += this.followOffset.x;
    targetY += this.followOffset.y;
    
    // Deadzone
    if (this.deadzone.enabled) {
      const dzLeft = this.x + this.width / 2 - this.deadzone.width / 2;
      const dzRight = this.x + this.width / 2 + this.deadzone.width / 2;
      const dzTop = this.y + this.height / 2 - this.deadzone.height / 2;
      const dzBottom = this.y + this.height / 2 + this.deadzone.height / 2;
      
      if (this.target.x < dzLeft) {
        targetX = this.target.x - this.width / 2 + this.deadzone.width / 2;
      } else if (this.target.x > dzRight) {
        targetX = this.target.x - this.width / 2 - this.deadzone.width / 2;
      } else {
        targetX = this.x;
      }
      
      if (this.target.y < dzTop) {
        targetY = this.target.y - this.height / 2 + this.deadzone.height / 2;
      } else if (this.target.y > dzBottom) {
        targetY = this.target.y - this.height / 2 - this.deadzone.height / 2;
      } else {
        targetY = this.y;
      }
    }
    
    // Interpolação suave
    this.x += (targetX - this.x) * this.smoothing;
    this.y += (targetY - this.y) * this.smoothing;
  }
  
  /**
   * Aplica os limites do mundo à câmera
   */
  applyBounds() {
    const halfWidth = this.width / (2 * this.zoom);
    const halfHeight = this.height / (2 * this.zoom);
    
    // Limitar X
    if (this.x < this.bounds.minX) {
      this.x = this.bounds.minX;
    } else if (this.x + this.width / this.zoom > this.bounds.maxX) {
      this.x = this.bounds.maxX - this.width / this.zoom;
    }
    
    // Limitar Y
    if (this.y < this.bounds.minY) {
      this.y = this.bounds.minY;
    } else if (this.y + this.height / this.zoom > this.bounds.maxY) {
      this.y = this.bounds.maxY - this.height / this.zoom;
    }
  }
  
  /**
   * Atualiza o shake da tela
   */
  updateShake(dt) {
    if (this.shake.duration > 0) {
      // Gerar deslocamento aleatório baseado na intensidade
      this.shake.x = (Math.random() - 0.5) * this.shake.intensity * 2;
      this.shake.y = (Math.random() - 0.5) * this.shake.intensity * 2;
      
      // Decair a intensidade
      this.shake.intensity *= this.shake.decay;
      this.shake.duration -= dt;
      
      // Parar quando duração acabar ou intensidade muito baixa
      if (this.shake.duration <= 0 || this.shake.intensity < 0.1) {
        this.shake.x = 0;
        this.shake.y = 0;
        this.shake.intensity = 0;
        this.shake.duration = 0;
      }
    } else {
      this.shake.x = 0;
      this.shake.y = 0;
    }
  }
  
  /**
   * Atualiza o flash da tela
   */
  updateFlash(dt) {
    if (this.flash.active) {
      this.flash.alpha -= dt * 2; // Fade out em 0.5 segundos
      
      if (this.flash.alpha <= 0) {
        this.flash.active = false;
        this.flash.alpha = 0;
      }
    }
  }
  
  /**
   * Aplica a transformação da câmera ao contexto
   */
  apply(ctx) {
    ctx.save();
    
    // Aplicar shake
    ctx.translate(this.shake.x, this.shake.y);
    
    // Aplicar zoom
    ctx.scale(this.zoom, this.zoom);
    
    // Aplicar posição da câmera (inverter para mover o mundo)
    ctx.translate(-this.x, -this.y);
  }
  
  /**
   * Remove a transformação da câmera do contexto
   */
  restore(ctx) {
    ctx.restore();
  }
  
  /**
   * Converte coordenadas da tela para coordenadas do mundo
   */
  screenToWorld(screenX, screenY) {
    return {
      x: (screenX / this.zoom) + this.x - this.shake.x / this.zoom,
      y: (screenY / this.zoom) + this.y - this.shake.y / this.zoom
    };
  }
  
  /**
   * Converte coordenadas do mundo para coordenadas da tela
   */
  worldToScreen(worldX, worldY) {
    return {
      x: (worldX - this.x) * this.zoom + this.shake.x,
      y: (worldY - this.y) * this.zoom + this.shake.y
    };
  }
  
  /**
   * Verifica se um objeto está visível na câmera
   */
  isVisible(obj) {
    const margin = this.cullingMargin;
    
    return (
      obj.x + obj.r > this.x - margin &&
      obj.x - obj.r < this.x + this.width / this.zoom + margin &&
      obj.y + obj.r > this.y - margin &&
      obj.y - obj.r < this.y + this.height / this.zoom + margin
    );
  }
  
  /**
   * Verifica se um ponto está visível
   */
  isPointVisible(x, y, margin = 0) {
    return (
      x > this.x - margin &&
      x < this.x + this.width / this.zoom + margin &&
      y > this.y - margin &&
      y < this.y + this.height / this.zoom + margin
    );
  }
  
  /**
   * Verifica se um retângulo está visível
   */
  isRectVisible(x, y, width, height) {
    return (
      x + width > this.x &&
      x < this.x + this.width / this.zoom &&
      y + height > this.y &&
      y < this.y + this.height / this.zoom
    );
  }
  
  /**
   * Aplica shake à câmera
   * @param {number} intensity - Intensidade do shake (pixels)
   * @param {number} duration - Duração em segundos
   */
  applyShake(intensity, duration) {
    this.shake.intensity = Math.max(this.shake.intensity, intensity);
    this.shake.duration = Math.max(this.shake.duration, duration);
  }
  
  /**
   * Define o zoom da câmera
   */
  setZoom(zoom, instant = false) {
    this.targetZoom = Math.max(this.minZoom, Math.min(this.maxZoom, zoom));
    
    if (instant) {
      this.zoom = this.targetZoom;
    }
  }
  
  /**
   * Aumenta o zoom
   */
  zoomIn(amount = 0.1) {
    this.setZoom(this.targetZoom + amount);
  }
  
  /**
   * Diminui o zoom
   */
  zoomOut(amount = 0.1) {
    this.setZoom(this.targetZoom - amount);
  }
  
  /**
   * Move a câmera para uma posição específica
   */
  moveTo(x, y, instant = false) {
    if (instant) {
      this.x = x - this.width / (2 * this.zoom);
      this.y = y - this.height / (2 * this.zoom);
    } else {
      this.target = { x, y };
    }
  }
  
  /**
   * Flash na tela
   */
  applyFlash(color = '#FFFFFF', alpha = 0.8) {
    this.flash.active = true;
    this.flash.color = color;
    this.flash.alpha = alpha;
  }
  
  /**
   * Desenha o flash se ativo
   */
  drawFlash(ctx) {
    if (this.flash.active && this.flash.alpha > 0) {
      ctx.save();
      ctx.fillStyle = this.flash.color;
      ctx.globalAlpha = this.flash.alpha;
      ctx.fillRect(0, 0, this.width, this.height);
      ctx.restore();
    }
  }
  
  /**
   * Desenha a deadzone (debug)
   */
  drawDeadzone(ctx) {
    if (!this.deadzone.enabled) return;
    
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
    ctx.lineWidth = 2;
    ctx.strokeRect(
      this.width / 2 - this.deadzone.width / 2,
      this.height / 2 - this.deadzone.height / 2,
      this.deadzone.width,
      this.deadzone.height
    );
    ctx.restore();
  }
  
  /**
   * Redimensiona a câmera (quando a janela muda de tamanho)
   */
  resize(width, height) {
    this.width = width;
    this.height = height;
  }
  
  /**
   * Reseta a câmera para o estado inicial
   */
  reset() {
    this.x = 0;
    this.y = 0;
    this.zoom = 1.0;
    this.targetZoom = 1.0;
    this.shake = { x: 0, y: 0, intensity: 0, duration: 0, decay: 0.9 };
    this.flash = { active: false, color: '#FFFFFF', alpha: 0 };
  }
  
  /**
   * Obtém informações da câmera (debug)
   */
  getInfo() {
    return {
      position: { x: this.x.toFixed(0), y: this.y.toFixed(0) },
      zoom: this.zoom.toFixed(2),
      viewport: `${this.width}x${this.height}`,
      target: this.target ? `(${this.target.x.toFixed(0)}, ${this.target.y.toFixed(0)})` : 'none',
      shake: this.shake.intensity > 0 ? 'active' : 'inactive'
    };
  }
}

// ================= INSTÂNCIA GLOBAL =================

let camera = null;

/**
 * Inicializa a câmera
 */
function initCamera(width, height) {
  camera = new Camera(width, height);
  console.log('📷 Câmera inicializada:', camera.getInfo());
  return camera;
}

/**
 * Helper: Aplicar shake (atalho global)
 */
function triggerShake(intensity, duration) {
  if (camera) {
    camera.applyShake(intensity, duration);
  }
}

/**
 * Helper: Aplicar flash (atalho global)
 */
function triggerFlash(color, alpha) {
  if (camera) {
    camera.applyFlash(color, alpha);
  }
}

/**
 * Helper: Verificar visibilidade (atalho global)
 */
function isVisibleToCamera(obj) {
  return camera ? camera.isVisible(obj) : true;
}

// ================= COMANDOS DE DEBUG =================

if (typeof window !== 'undefined') {
  window.cameraDebug = {
    info: () => console.table(camera.getInfo()),
    shake: (intensity = 10, duration = 0.5) => triggerShake(intensity, duration),
    flash: (color = '#FFFFFF', alpha = 0.8) => triggerFlash(color, alpha),
    zoom: (level) => camera.setZoom(level),
    smoothing: (value) => { camera.smoothing = value; console.log('Smoothing:', value); },
    deadzone: (enabled) => { 
      camera.deadzone.enabled = enabled; 
      console.log('Deadzone:', enabled ? 'ON' : 'OFF');
    }
  };
}

// ================= EXEMPLOS DE USO =================

/**
 * EXEMPLO 1: Inicialização básica
 * 
 * // No game.js, na função init():
 * initCamera(canvas.width / dpr, canvas.height / dpr);
 * camera.setTarget(player);
 * camera.setBounds(0, 0, 2000, 2000);
 */

/**
 * EXEMPLO 2: Renderização com câmera
 * 
 * function draw() {
 *   ctx.clearRect(0, 0, canvas.width, canvas.height);
 *   
 *   // Aplicar câmera para objetos do mundo
 *   camera.apply(ctx);
 *   
 *   // Desenhar objetos do mundo
 *   fishes.forEach(fish => {
 *     if (camera.isVisible(fish)) {
 *       fish.draw(ctx);
 *     }
 *   });
 *   
 *   player.draw(ctx);
 *   
 *   // Restaurar transformação
 *   camera.restore(ctx);
 *   
 *   // Desenhar UI (sem transformação da câmera)
 *   drawUI(ctx);
 *   
 *   // Desenhar flash se ativo
 *   camera.drawFlash(ctx);
 * }
 */

/**
 * EXEMPLO 3: Efeitos de câmera
 * 
 * // Quando o jogador toma dano:
 * player.takeDamage(damage);
 * triggerShake(15, 0.3);
 * triggerFlash('#FF0000', 0.3);
 * 
 * // Quando o jogador sobe de nível:
 * levelUp();
 * triggerFlash('#FFD700', 0.5);
 * camera.zoomIn(0.2);
 * setTimeout(() => camera.zoomOut(0.2), 500);
 */

/**
 * EXEMPLO 4: Input com câmera
 * 
 * canvas.addEventListener('click', (e) => {
 *   const rect = canvas.getBoundingClientRect();
 *   const screenX = (e.clientX - rect.left) * dpr;
 *   const screenY = (e.clientY - rect.top) * dpr;
 *   
 *   const worldPos = camera.screenToWorld(screenX, screenY);
 *   console.log('Clicou em:', worldPos);
 * });
 */

/**
 * EXEMPLO 5: Redimensionamento
 * 
 * window.addEventListener('resize', () => {
 *   canvas.width = window.innerWidth * dpr;
 *   canvas.height = window.innerHeight * dpr;
 *   camera.resize(canvas.width / dpr, canvas.height / dpr);
 * });
 */
