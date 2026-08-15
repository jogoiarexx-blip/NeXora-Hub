// ================= SISTEMA DE MAPA E CENÁRIO =================

/**
 * Sistema completo de mapa com:
 * - Múltiplas camadas com parallax
 * - Decorações procedurais (plantas, rochas, corais)
 * - Sistema de zonas com dificuldades diferentes
 * - Minimap
 * - Efeitos ambientes (bolhas, partículas de luz)
 * - Limites do mundo
 */

class MapSystem {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    
    // Limites do mundo
    this.boundaries = {
      minX: 0,
      maxX: width,
      minY: 0,
      maxY: height
    };
    
    // Camadas de parallax
    this.layers = [];
    
    // Decorações estáticas
    this.decorations = [];
    
    // Efeitos ambientes (bolhas, partículas)
    this.ambientEffects = [];
    
    // Cardumes decorativos no fundo
    this.decorativeSchools = [];
    
    // Zonas de gameplay
    this.zones = [];
    
    // Configurações visuais
    this.config = {
      parallaxIntensity: 1.0,
      decorationDensity: 1.0,
      ambientEffectDensity: 1.0
    };
    
    // Inicializar tudo
    this.init();
  }
  
  /**
   * Inicializa o mapa completo
   */
  init() {
    console.log('🗺️ Inicializando sistema de mapa...');
    
    this.createLayers();
    this.generateDecorations();
    this.createZones();
    this.generateAmbientEffects();
    this.generateDecorativeSchools();
    
    console.log(`✅ Mapa criado: ${this.width}x${this.height}`);
    console.log(`   - ${this.layers.length} camadas`);
    console.log(`   - ${this.decorations.length} decorações`);
    console.log(`   - ${this.zones.length} zonas`);
    console.log(`   - ${this.ambientEffects.length} efeitos ambientes`);
    console.log(`   - ${this.decorativeSchools.length} cardumes decorativos`);
  }
  
  // ================= CAMADAS DE PARALLAX =================
  
  /**
   * Cria as camadas de fundo com diferentes velocidades
   */
  createLayers() {
    // Camada 1: Fundo distante (mais lento)
    this.layers.push({
      name: 'far-background',
      parallax: 0.15,
      elements: this.generateFarBackground()
    });
    
    // Camada 2: Raios de luz
    this.layers.push({
      name: 'light-rays',
      parallax: 0.3,
      elements: this.generateLightRays()
    });
    
    // Camada 3: Fundo médio
    this.layers.push({
      name: 'mid-background',
      parallax: 0.5,
      elements: this.generateMidBackground()
    });
    
    // Camada 4: Elementos de frente (mesma velocidade)
    this.layers.push({
      name: 'foreground',
      parallax: 1.0,
      elements: []
    });
  }
  
  /**
   * Gera elementos do fundo distante
   */
  generateFarBackground() {
    const elements = [];
    
    // Montanhas submarinas distantes
    for (let i = 0; i < 5; i++) {
      elements.push({
        type: 'mountain',
        x: (i / 5) * this.width + randomRange(-200, 200),
        y: this.height - randomRange(200, 400),
        width: randomRange(400, 800),
        height: randomRange(300, 600),
        color: '#1e3a5f'
      });
    }
    
    // Silhuetas de kelp gigante
    for (let i = 0; i < 8; i++) {
      elements.push({
        type: 'giant-kelp',
        x: randomRange(0, this.width),
        y: this.height - randomRange(400, 600),
        height: randomRange(400, 700),
        segments: randomInt(5, 8),
        color: '#0f2744',
        swayPhase: Math.random() * Math.PI * 2,
        swaySpeed: randomRange(0.3, 0.8)
      });
    }
    
    // Baleias/Tubarões gigantes ao fundo (3-5 silhuetas)
    const giantCreatureCount = randomInt(3, 5);
    for (let i = 0; i < giantCreatureCount; i++) {
      const isWhale = Math.random() > 0.4; // 60% baleias, 40% tubarões
      elements.push({
        type: 'giant-creature',
        subtype: isWhale ? 'whale' : 'shark',
        x: randomRange(0, this.width),
        y: randomRange(this.height * 0.3, this.height * 0.7),
        size: randomRange(150, 250),
        speed: randomRange(15, 30),
        direction: Math.random() > 0.5 ? 1 : -1,
        color: '#0a1929',
        opacity: randomRange(0.3, 0.5),
        swimPhase: Math.random() * Math.PI * 2,
        swimSpeed: randomRange(1, 2)
      });
    }
    
    return elements;
  }
  
  /**
   * Gera raios de luz
   */
  generateLightRays() {
    const elements = [];
    
    for (let i = 0; i < 12; i++) {
      elements.push({
        type: 'sunray',
        x: (i / 12) * this.width,
        y: -100,
        width: randomRange(100, 200),
        height: randomRange(this.height * 0.6, this.height * 0.8),
        opacity: randomRange(0.05, 0.15),
        angle: randomRange(-0.1, 0.1),
        driftSpeed: randomRange(5, 15),
        driftPhase: Math.random() * Math.PI * 2
      });
    }
    
    return elements;
  }
  
  /**
   * Gera elementos do fundo médio
   */
  generateMidBackground() {
    const elements = [];
    
    // Rochas médias
    for (let i = 0; i < 20; i++) {
      const x = randomRange(0, this.width);
      const y = randomRange(this.height * 0.6, this.height);
      
      elements.push({
        type: 'rock-medium',
        x, y,
        size: randomRange(40, 100),
        shape: randomInt(0, 2),
        color: '#4a5568',
        shadowOffset: randomRange(5, 15)
      });
    }
    
    // Corais distantes
    for (let i = 0; i < 15; i++) {
      elements.push({
        type: 'coral-distant',
        x: randomRange(0, this.width),
        y: randomRange(this.height * 0.7, this.height),
        size: randomRange(30, 70),
        color: this.getRandomCoralColor(),
        shape: randomInt(0, 3),
        opacity: 0.7
      });
    }
    
    return elements;
  }
  
  // ================= DECORAÇÕES =================
  
  /**
   * Gera todas as decorações do mapa
   */
  generateDecorations() {
    this.generateSeaweed();
    this.generateRocks();
    this.generateCorals();
    this.generateExoticPlants(); // Nova função para plantas exóticas
    this.generateSeaFloor();
  }
  
  /**
   * Gera plantas aquáticas
   */
  generateSeaweed() {
    const count = Math.floor(50 * this.config.decorationDensity);
    
    for (let i = 0; i < count; i++) {
      const x = randomRange(0, this.width);
      const y = this.height - randomRange(50, 250);
      
      this.decorations.push({
        type: 'seaweed',
        x, y,
        height: randomRange(60, 180),
        width: randomRange(3, 8),
        segments: randomInt(8, 15),
        swayPhase: Math.random() * Math.PI * 2,
        swaySpeed: randomRange(1.5, 3.5),
        swayAmount: randomRange(10, 25),
        color: `hsl(${randomRange(120, 160)}, ${randomRange(40, 70)}%, ${randomRange(30, 50)}%)`,
        layer: 'foreground'
      });
    }
  }
  
  /**
   * Gera rochas
   */
  generateRocks() {
    const count = Math.floor(30 * this.config.decorationDensity);
    
    for (let i = 0; i < count; i++) {
      const x = randomRange(0, this.width);
      const y = this.height - randomRange(20, 120);
      const size = randomRange(40, 120);
      
      this.decorations.push({
        type: 'rock',
        x, y,
        size,
        width: size * randomRange(1.2, 1.8),
        height: size * randomRange(0.6, 1.0),
        color: this.getRandomRockColor(),
        highlights: randomInt(2, 5),
        layer: 'foreground'
      });
    }
  }
  
  /**
   * Gera corais
   */
  generateCorals() {
    const count = Math.floor(40 * this.config.decorationDensity);
    
    for (let i = 0; i < count; i++) {
      const x = randomRange(0, this.width);
      const y = this.height - randomRange(30, 180);
      
      this.decorations.push({
        type: 'coral',
        x, y,
        size: randomRange(25, 80),
        color: this.getRandomCoralColor(),
        shape: randomInt(0, 4), // Diferentes tipos de coral
        branches: randomInt(3, 8),
        pulsePhase: Math.random() * Math.PI * 2,
        pulseSpeed: randomRange(0.5, 1.5),
        layer: 'foreground'
      });
    }
  }
  
  /**
   * Gera plantas exóticas (anêmonas e algas bioluminescentes)
   */
  generateExoticPlants() {
    // Anêmonas (20-25 espalhadas pelo mapa)
    const anemoneCount = randomInt(20, 25);
    for (let i = 0; i < anemoneCount; i++) {
      const x = randomRange(0, this.width);
      const y = this.height - randomRange(20, 200);
      const size = randomRange(20, 50);
      
      this.decorations.push({
        type: 'anemone',
        x, y,
        size,
        tentacles: randomInt(12, 20),
        color: this.getRandomAnemoneColor(),
        pulsePhase: Math.random() * Math.PI * 2,
        pulseSpeed: randomRange(1.5, 3.0),
        wavePhase: Math.random() * Math.PI * 2,
        waveSpeed: randomRange(2, 4),
        layer: 'foreground'
      });
    }
    
    // Algas bioluminescentes (15-20 espalhadas)
    const bioAlgaeCount = randomInt(15, 20);
    for (let i = 0; i < bioAlgaeCount; i++) {
      const x = randomRange(0, this.width);
      const y = this.height - randomRange(30, 250);
      
      this.decorations.push({
        type: 'bio-algae',
        x, y,
        height: randomRange(40, 120),
        width: randomRange(2, 5),
        segments: randomInt(5, 10),
        glowColor: this.getRandomBioColor(),
        glowIntensity: randomRange(0.4, 0.8),
        glowPhase: Math.random() * Math.PI * 2,
        glowSpeed: randomRange(1.0, 2.5),
        swayPhase: Math.random() * Math.PI * 2,
        swaySpeed: randomRange(1.0, 2.0),
        swayAmount: randomRange(8, 18),
        layer: 'foreground'
      });
    }
  }
  
  /**
   * Retorna cor aleatória para anêmonas
   */
  getRandomAnemoneColor() {
    const colors = [
      '#FF6B9D', // Rosa vibrante
      '#C77DFF', // Roxo claro
      '#4ECDC4', // Turquesa
      '#FFD93D', // Amarelo dourado
      '#FF8C42', // Laranja coral
      '#95E1D3'  // Verde-água
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }
  
  /**
   * Retorna cor aleatória para algas bioluminescentes
   */
  getRandomBioColor() {
    const colors = [
      '#00F5FF', // Ciano elétrico
      '#39FF14', // Verde néon
      '#BC13FE', // Roxo néon
      '#FFFF00', // Amarelo brilhante
      '#00FFFF', // Aqua brilhante
      '#FF10F0'  // Magenta néon
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }
  
  /**
   * Gera decorações do chão do mar
   */
  generateSeaFloor() {
    // Areia/ondulações
    for (let i = 0; i < 30; i++) {
      this.decorations.push({
        type: 'sand-ripple',
        x: randomRange(0, this.width),
        y: this.height - randomRange(5, 30),
        width: randomRange(100, 300),
        height: randomRange(5, 15),
        opacity: randomRange(0.1, 0.3),
        layer: 'foreground'
      });
    }
    
    // Conchas e detalhes pequenos
    for (let i = 0; i < 60; i++) {
      this.decorations.push({
        type: 'shell',
        x: randomRange(0, this.width),
        y: this.height - randomRange(5, 50),
        size: randomRange(4, 12),
        color: this.getRandomShellColor(),
        rotation: Math.random() * Math.PI * 2,
        layer: 'foreground'
      });
    }
  }
  
  // ================= EFEITOS AMBIENTES =================
  
  /**
   * Gera efeitos ambientes (bolhas, partículas) COM MELHORIAS
   */
  generateAmbientEffects() {
    const bubbleCount = Math.floor(100 * this.config.ambientEffectDensity);
    
    // Bolhas flutuantes
    for (let i = 0; i < bubbleCount; i++) {
      this.ambientEffects.push({
        type: 'bubble',
        x: randomRange(0, this.width),
        y: randomRange(0, this.height),
        size: randomRange(2, 12),
        speed: randomRange(15, 50),
        wobblePhase: Math.random() * Math.PI * 2,
        wobbleSpeed: randomRange(2, 5),
        wobbleAmount: randomRange(15, 60),
        opacity: randomRange(0.25, 0.75)
      });
    }
    
    // Partículas de luz (plâncton bioluminescente)
    for (let i = 0; i < 180; i++) {
      this.ambientEffects.push({
        type: 'light-particle',
        x: randomRange(0, this.width),
        y: randomRange(0, this.height),
        size: randomRange(1, 3.5),
        baseOpacity: Math.random(),
        twinkleSpeed: randomRange(1, 4),
        twinklePhase: Math.random() * Math.PI * 2,
        color: randomInt(0, 1) === 0 ? '#E0F2FE' : '#BAE6FD'
      });
    }
    
    // Partículas flutuantes (sedimento e detritos)
    for (let i = 0; i < 120; i++) {
      this.ambientEffects.push({
        type: 'float-particle',
        x: randomRange(0, this.width),
        y: randomRange(0, this.height),
        size: randomRange(0.5, 2.5),
        vx: randomRange(-8, 8),
        vy: randomRange(-15, 15),
        opacity: randomRange(0.15, 0.45),
        color: randomInt(0, 2) === 0 ? '#94A3B8' : (randomInt(0, 1) === 0 ? '#cbd5e1' : '#64748b')
      });
    }
    
    // NOVO: Partículas de profundidade (névoa animada)
    for (let i = 0; i < 60; i++) {
      this.ambientEffects.push({
        type: 'depth-particle',
        x: randomRange(0, this.width),
        y: randomRange(0, this.height),
        size: randomRange(20, 80),
        vx: randomRange(-3, 3),
        vy: randomRange(-5, 5),
        opacity: randomRange(0.02, 0.08),
        pulsePhase: Math.random() * Math.PI * 2,
        pulseSpeed: randomRange(0.5, 2),
        color: '#1e3a5f'
      });
    }
  }
  
  // ================= CARDUMES DECORATIVOS =================
  
  /**
   * Gera cardumes decorativos que nadam em formação no fundo
   */
  generateDecorativeSchools() {
    const schoolCount = 12; // 10-15 cardumes
    
    for (let i = 0; i < schoolCount; i++) {
      const fishCount = randomInt(8, 15); // 8-15 peixes por cardume
      const school = {
        id: i,
        fishes: [],
        centerX: randomRange(0, this.width),
        centerY: randomRange(this.height * 0.2, this.height * 0.8),
        direction: Math.random() * Math.PI * 2,
        speed: randomRange(30, 60),
        radius: randomRange(40, 80),
        color: this.getRandomSchoolColor(),
        size: randomRange(8, 14),
        cohesionStrength: 0.8,
        separationStrength: 0.5,
        alignmentStrength: 0.6,
        wanderTimer: 0,
        wanderInterval: randomRange(3, 6)
      };
      
      // Criar peixes individuais do cardume
      for (let j = 0; j < fishCount; j++) {
        const angle = (j / fishCount) * Math.PI * 2;
        const dist = Math.random() * school.radius;
        school.fishes.push({
          offsetX: Math.cos(angle) * dist,
          offsetY: Math.sin(angle) * dist,
          phase: Math.random() * Math.PI * 2,
          swimSpeed: randomRange(8, 12)
        });
      }
      
      this.decorativeSchools.push(school);
    }
  }
  
  /**
   * Retorna cor aleatória para cardume decorativo
   */
  getRandomSchoolColor() {
    const colors = [
      '#94A3B8', // Cinza azulado
      '#64748B', // Cinza escuro
      '#CBD5E1', // Cinza claro
      '#8B9DC3', // Azul acinzentado
      '#A7B8D4', // Azul pálido
      '#9CA8B8'  // Cinza neutro
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }
  
  // ================= ZONAS DE GAMEPLAY =================
  
  /**
   * Cria zonas com diferentes características
   */
  createZones() {
    // Zona Rasa (0-30% altura) - Mais fácil
    this.zones.push({
      name: 'shallow',
      bounds: {
        x: 0,
        y: 0,
        width: this.width,
        height: this.height * 0.3
      },
      difficulty: 1,
      spawnRates: {
        fish: 1.5,
        enemy: 0.4,
        coin: 1.2
      },
      ambient: {
        light: 1.0,
        color: '#4FC3F7',
        gradient: ['#87CEEB', '#4FC3F7']
      },
      features: ['safe', 'tutorial']
    });
    
    // Zona Média (30-70% altura) - Normal
    this.zones.push({
      name: 'middle',
      bounds: {
        x: 0,
        y: this.height * 0.3,
        width: this.width,
        height: this.height * 0.4
      },
      difficulty: 2,
      spawnRates: {
        fish: 1.0,
        enemy: 1.0,
        coin: 1.0
      },
      ambient: {
        light: 0.7,
        color: '#1E88E5',
        gradient: ['#42A5F5', '#1E88E5']
      },
      features: ['balanced']
    });
    
    // Zona Profunda (70-100% altura) - Difícil
    this.zones.push({
      name: 'deep',
      bounds: {
        x: 0,
        y: this.height * 0.7,
        width: this.width,
        height: this.height * 0.3
      },
      difficulty: 3,
      spawnRates: {
        fish: 0.7,
        enemy: 1.8,
        coin: 0.8
      },
      ambient: {
        light: 0.4,
        color: '#0D47A1',
        gradient: ['#1565C0', '#0D47A1']
      },
      features: ['dangerous', 'high-reward', 'darkness'],
      hazards: ['limited-visibility']
    });
    
    // Zona Abissal (opcional - cantos do mapa)
    if (this.width > 2000) {
      this.zones.push({
        name: 'abyss',
        bounds: {
          x: this.width - 500,
          y: this.height - 500,
          width: 500,
          height: 500
        },
        difficulty: 5,
        spawnRates: {
          fish: 0.3,
          enemy: 2.5,
          coin: 1.5
        },
        ambient: {
          light: 0.2,
          color: '#0C1E3A',
          gradient: ['#0f1f3a', '#050a15']
        },
        features: ['boss-zone', 'extreme-danger'],
        hazards: ['darkness', 'strong-current']
      });
    }
  }
  
  /**
   * Retorna a zona em uma posição específica
   */
  getZoneAt(x, y) {
    for (const zone of this.zones) {
      if (this.isPointInZone(x, y, zone)) {
        return zone;
      }
    }
    return this.zones[0]; // Default: zona rasa
  }
  
  /**
   * Verifica se um ponto está dentro de uma zona
   */
  isPointInZone(x, y, zone) {
    return (
      x >= zone.bounds.x &&
      x <= zone.bounds.x + zone.bounds.width &&
      y >= zone.bounds.y &&
      y <= zone.bounds.y + zone.bounds.height
    );
  }
  
  // ================= UPDATE =================
  
  /**
   * Atualiza elementos dinâmicos do mapa
   */
  update(dt, camera) {
    // Atualizar raios de luz (drift)
    this.layers.forEach(layer => {
      if (layer.name === 'light-rays') {
        layer.elements.forEach(ray => {
          ray.driftPhase += dt * ray.driftSpeed;
          ray.x += Math.sin(ray.driftPhase) * 0.5;
        });
      }
      
      // Atualizar kelp gigante e criaturas gigantes
      if (layer.name === 'far-background') {
        layer.elements.forEach(el => {
          if (el.type === 'giant-kelp') {
            el.swayPhase += dt * el.swaySpeed;
          } else if (el.type === 'giant-creature') {
            // Movimento lento horizontal
            el.x += el.speed * el.direction * dt;
            el.swimPhase += dt * el.swimSpeed;
            
            // Wrap around das bordas
            if (el.direction > 0 && el.x > this.width + el.size) {
              el.x = -el.size;
            } else if (el.direction < 0 && el.x < -el.size) {
              el.x = this.width + el.size;
            }
          }
        });
      }
    });
    
    // Atualizar decorações com animação
    this.decorations.forEach(dec => {
      if (dec.type === 'seaweed') {
        dec.swayPhase += dt * dec.swaySpeed;
      } else if (dec.type === 'coral') {
        dec.pulsePhase += dt * dec.pulseSpeed;
      } else if (dec.type === 'anemone') {
        // Anêmonas pulsam e ondulam
        dec.pulsePhase += dt * dec.pulseSpeed;
        dec.wavePhase += dt * dec.waveSpeed;
      } else if (dec.type === 'bio-algae') {
        // Algas bioluminescentes brilham e balançam
        dec.glowPhase += dt * dec.glowSpeed;
        dec.swayPhase += dt * dec.swaySpeed;
      }
    });
    
    // Atualizar efeitos ambientes
    this.ambientEffects.forEach(effect => {
      if (effect.type === 'bubble') {
        // Movimento para cima
        effect.y -= effect.speed * dt;
        
        // Wobble lateral
        effect.wobblePhase += dt * effect.wobbleSpeed;
        effect.x += Math.sin(effect.wobblePhase) * effect.wobbleAmount * dt;
        
        // Reset quando sair da tela (com margem da câmera)
        if (camera && effect.y < camera.y - 100) {
          effect.y = camera.y + camera.height + 50;
          effect.x = randomRange(camera.x, camera.x + camera.width);
        } else if (!camera && effect.y < -50) {
          effect.y = this.height + 50;
          effect.x = randomRange(0, this.width);
        }
        
      } else if (effect.type === 'light-particle') {
        // Twinkle (piscar)
        effect.twinklePhase += dt * effect.twinkleSpeed;
        
      } else if (effect.type === 'float-particle') {
        // Movimento flutuante
        effect.x += effect.vx * dt;
        effect.y += effect.vy * dt;
        
        // Wrap around
        if (effect.x < 0) effect.x = this.width;
        if (effect.x > this.width) effect.x = 0;
        if (effect.y < 0) effect.y = this.height;
        if (effect.y > this.height) effect.y = 0;
        
      } else if (effect.type === 'depth-particle') {
        // NOVO: Movimento lento e pulsação para partículas de profundidade
        effect.x += effect.vx * dt;
        effect.y += effect.vy * dt;
        effect.pulsePhase += dt * effect.pulseSpeed;
        
        // Wrap around suave
        if (effect.x < -effect.size) effect.x = this.width + effect.size;
        if (effect.x > this.width + effect.size) effect.x = -effect.size;
        if (effect.y < -effect.size) effect.y = this.height + effect.size;
        if (effect.y > this.height + effect.size) effect.y = -effect.size;
      }
    });
    
    // Atualizar cardumes decorativos
    this.decorativeSchools.forEach(school => {
      // Atualizar timer de wander
      school.wanderTimer += dt;
      if (school.wanderTimer >= school.wanderInterval) {
        school.direction += (Math.random() - 0.5) * Math.PI * 0.5;
        school.wanderTimer = 0;
      }
      
      // Mover centro do cardume
      school.centerX += Math.cos(school.direction) * school.speed * dt;
      school.centerY += Math.sin(school.direction) * school.speed * dt;
      
      // Wrap around das bordas
      if (school.centerX < -100) school.centerX = this.width + 100;
      if (school.centerX > this.width + 100) school.centerX = -100;
      if (school.centerY < this.height * 0.1) school.centerY = this.height * 0.1;
      if (school.centerY > this.height * 0.9) school.centerY = this.height * 0.9;
      
      // Atualizar peixes individuais do cardume
      school.fishes.forEach(fish => {
        fish.phase += dt * fish.swimSpeed;
      });
    });
  }
  
  // ================= RENDER =================
  
  /**
   * Desenha o mapa completo
   */
  draw(ctx, camera) {
    // Desenhar gradiente de fundo base
    this.drawBaseGradient(ctx, camera);
    
    // Desenhar camadas com parallax
    this.drawLayers(ctx, camera);
    
    // Desenhar cardumes decorativos (no fundo)
    this.drawDecorativeSchools(ctx, camera);
    
    // Desenhar decorações
    this.drawDecorations(ctx, camera);
    
    // Desenhar efeitos ambientes
    this.drawAmbientEffects(ctx, camera);
  }
  
  /**
   * Desenha gradiente de fundo baseado na zona COM MELHORIAS
   */
  drawBaseGradient(ctx, camera) {
    const zone = camera ? this.getZoneAt(camera.x + camera.width / 2, camera.y + camera.height / 2) : this.zones[0];
    
    // Camada 1: Gradiente vertical principal com mais detalhes
    const mainGradient = ctx.createLinearGradient(0, 0, 0, this.height);
    
    // Gradiente com múltiplas camadas para criar profundidade
    mainGradient.addColorStop(0, '#7dd3fc');     // Azul celeste claro (topo)
    mainGradient.addColorStop(0.1, '#67c9f2');
    mainGradient.addColorStop(0.2, '#4fb3e8');
    mainGradient.addColorStop(0.35, '#3a9bd9');
    mainGradient.addColorStop(0.5, '#2c7fba');   // Zona média
    mainGradient.addColorStop(0.65, '#1e6ba0');
    mainGradient.addColorStop(0.75, '#165283');  // Começando zona profunda
    mainGradient.addColorStop(0.85, '#0e3c66');
    mainGradient.addColorStop(0.93, '#0a2847');
    mainGradient.addColorStop(1, '#051729');     // Abismo - quase preto azulado
    
    ctx.fillStyle = mainGradient;
    ctx.fillRect(0, 0, this.width, this.height);
    
    // Camada 2: Névoa volumétrica para dar sensação de profundidade
    const time = Date.now() * 0.0003;
    
    // Várias névoas em diferentes profundidades
    for (let i = 0; i < 5; i++) {
      const depth = 0.25 + (i * 0.18);
      const centerY = this.height * depth;
      const centerX = this.width * (0.3 + Math.sin(time + i * 0.7) * 0.25);
      
      const fogGradient = ctx.createRadialGradient(
        centerX, centerY, 0,
        centerX, centerY, this.width * 0.65
      );
      
      const fogOpacity = 0.035 + (i * 0.012);
      const fogColor = depth > 0.6 ? '15, 45, 75' : '25, 65, 105';
      fogGradient.addColorStop(0, `rgba(${fogColor}, ${fogOpacity})`);
      fogGradient.addColorStop(0.5, `rgba(${fogColor}, ${fogOpacity * 0.5})`);
      fogGradient.addColorStop(1, 'rgba(10, 30, 50, 0)');
      
      ctx.fillStyle = fogGradient;
      ctx.fillRect(0, 0, this.width, this.height);
    }
    
    // Camada 3: Cáusticas sutis (efeito de luz através da água)
    ctx.save();
    ctx.globalAlpha = 0.03;
    const bandCount = 18;
    for (let i = 0; i < bandCount; i++) {
      const y = (i / bandCount) * this.height;
      const bandHeight = this.height / bandCount;
      const brightness = Math.sin(i * 0.6 + time * 2.5) * 0.5 + 0.5;
      const lightIntensity = Math.max(0, 1 - (y / this.height)); // Mais luz no topo
      
      ctx.fillStyle = `rgba(120, 170, 220, ${brightness * lightIntensity * 0.2})`;
      ctx.fillRect(0, y, this.width, bandHeight * 0.7);
    }
    ctx.restore();
  }
  
  /**
   * Desenha todas as camadas com parallax
   */
  drawLayers(ctx, camera) {
    this.layers.forEach(layer => {
      ctx.save();
      
      // Aplicar parallax offset
      if (camera) {
        const offsetX = camera.x * layer.parallax * this.config.parallaxIntensity;
        const offsetY = camera.y * layer.parallax * this.config.parallaxIntensity;
        ctx.translate(-offsetX, -offsetY);
      }
      
      // Desenhar elementos da camada
      layer.elements.forEach(el => {
        if (!camera || this.isElementVisible(el, camera, layer.parallax)) {
          this.drawElement(ctx, el);
        }
      });
      
      ctx.restore();
    });
  }
  
  /**
   * Desenha decorações
   */
  drawDecorations(ctx, camera) {
    this.decorations.forEach(dec => {
      if (!camera || this.isElementVisible(dec, camera, 1.0)) {
        this.drawDecoration(ctx, dec);
      }
    });
  }
  
  /**
   * Desenha efeitos ambientes
   */
  drawAmbientEffects(ctx, camera) {
    this.ambientEffects.forEach(effect => {
      if (!camera || this.isElementVisible(effect, camera, 1.0)) {
        this.drawAmbientEffect(ctx, effect);
      }
    });
  }
  
  /**
   * Desenha um elemento individual
   */
  drawElement(ctx, el) {
    ctx.save();
    
    switch(el.type) {
      case 'mountain':
        this.drawMountain(ctx, el);
        break;
      case 'giant-kelp':
        this.drawGiantKelp(ctx, el);
        break;
      case 'giant-creature':
        this.drawGiantCreature(ctx, el);
        break;
      case 'sunray':
        this.drawSunray(ctx, el);
        break;
      case 'rock-medium':
        this.drawRockMedium(ctx, el);
        break;
      case 'coral-distant':
        this.drawCoralDistant(ctx, el);
        break;
    }
    
    ctx.restore();
  }
  
  /**
   * Desenha uma decoração
   */
  drawDecoration(ctx, dec) {
    ctx.save();
    
    switch(dec.type) {
      case 'seaweed':
        this.drawSeaweed(ctx, dec);
        break;
      case 'rock':
        this.drawRock(ctx, dec);
        break;
      case 'coral':
        this.drawCoral(ctx, dec);
        break;
      case 'anemone':
        this.drawAnemone(ctx, dec);
        break;
      case 'bio-algae':
        this.drawBioAlgae(ctx, dec);
        break;
      case 'sand-ripple':
        this.drawSandRipple(ctx, dec);
        break;
      case 'shell':
        this.drawShell(ctx, dec);
        break;
    }
    
    ctx.restore();
  }
  
  /**
   * Desenha um efeito ambiente
   */
  drawAmbientEffect(ctx, effect) {
    ctx.save();
    
    switch(effect.type) {
      case 'bubble':
        this.drawBubble(ctx, effect);
        break;
      case 'light-particle':
        this.drawLightParticle(ctx, effect);
        break;
      case 'float-particle':
        this.drawFloatParticle(ctx, effect);
        break;
      case 'depth-particle':
        this.drawDepthParticle(ctx, effect);
        break;
    }
    
    ctx.restore();
  }
  
  // ================= DESENHO DE ELEMENTOS ESPECÍFICOS =================
  
  drawMountain(ctx, el) {
    ctx.fillStyle = el.color;
    ctx.beginPath();
    ctx.moveTo(el.x, el.y + el.height);
    ctx.bezierCurveTo(
      el.x + el.width * 0.2, el.y + el.height * 0.5,
      el.x + el.width * 0.4, el.y,
      el.x + el.width * 0.5, el.y
    );
    ctx.bezierCurveTo(
      el.x + el.width * 0.6, el.y,
      el.x + el.width * 0.8, el.y + el.height * 0.5,
      el.x + el.width, el.y + el.height
    );
    ctx.closePath();
    ctx.fill();
  }
  
  drawGiantKelp(ctx, el) {
    const sway = Math.sin(el.swayPhase) * 15;
    
    ctx.save();
    ctx.translate(el.x, el.y);
    ctx.strokeStyle = el.color;
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    ctx.beginPath();
    ctx.moveTo(0, 0);
    
    for (let i = 1; i <= el.segments; i++) {
      const progress = i / el.segments;
      const x = Math.sin(progress * Math.PI + el.swayPhase) * sway * progress;
      const y = progress * el.height;
      ctx.lineTo(x, y);
    }
    
    ctx.stroke();
    ctx.restore();
  }
  
  drawGiantCreature(ctx, el) {
    ctx.save();
    ctx.globalAlpha = el.opacity;
    ctx.translate(el.x, el.y);
    
    // Inverter direção visual se nadando para esquerda
    if (el.direction < 0) {
      ctx.scale(-1, 1);
    }
    
    const swimOffset = Math.sin(el.swimPhase) * el.size * 0.06;
    const breathe = Math.sin(el.swimPhase * 0.5) * 0.03 + 1; // Respiração sutil
    
    if (el.subtype === 'whale') {
      // ===== BALEIA MELHORADA =====
      ctx.fillStyle = el.color;
      
      // Corpo principal com curvas suaves
      ctx.beginPath();
      ctx.moveTo(-el.size * 0.8, 0);
      // Curva superior do corpo
      ctx.bezierCurveTo(
        -el.size * 0.6, -el.size * 0.35 * breathe,
        el.size * 0.2, -el.size * 0.32 * breathe,
        el.size * 0.7, -el.size * 0.15 * breathe
      );
      // Ponta da cabeça
      ctx.lineTo(el.size * 0.8, 0);
      // Curva inferior do corpo
      ctx.bezierCurveTo(
        el.size * 0.2, el.size * 0.28 * breathe,
        -el.size * 0.6, el.size * 0.3 * breathe,
        -el.size * 0.8, 0
      );
      ctx.closePath();
      ctx.fill();
      
      // Barriga mais clara
      ctx.fillStyle = this.adjustBrightness(el.color, 30);
      ctx.beginPath();
      ctx.moveTo(-el.size * 0.6, 0);
      ctx.bezierCurveTo(
        -el.size * 0.4, el.size * 0.22,
        el.size * 0.1, el.size * 0.2,
        el.size * 0.5, el.size * 0.08
      );
      ctx.bezierCurveTo(
        el.size * 0.3, el.size * 0.12,
        -el.size * 0.2, el.size * 0.15,
        -el.size * 0.6, 0
      );
      ctx.fill();
      
      // Barbatana peitoral
      ctx.fillStyle = el.color;
      ctx.save();
      ctx.translate(el.size * 0.1, el.size * 0.25);
      ctx.rotate(Math.PI * 0.15 + swimOffset * 0.02);
      ctx.beginPath();
      ctx.ellipse(0, 0, el.size * 0.35, el.size * 0.12, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      
      // Cauda com movimento
      ctx.save();
      ctx.translate(-el.size * 0.85, 0);
      ctx.rotate(swimOffset * 0.15);
      
      // Lóbulo superior da cauda
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(
        -el.size * 0.15, -el.size * 0.15,
        -el.size * 0.25, -el.size * 0.3,
        -el.size * 0.35, -el.size * 0.35
      );
      ctx.bezierCurveTo(
        -el.size * 0.3, -el.size * 0.25,
        -el.size * 0.1, -el.size * 0.05,
        0, 0
      );
      ctx.fill();
      
      // Lóbulo inferior da cauda
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(
        -el.size * 0.15, el.size * 0.15,
        -el.size * 0.25, el.size * 0.3,
        -el.size * 0.35, el.size * 0.35
      );
      ctx.bezierCurveTo(
        -el.size * 0.3, el.size * 0.25,
        -el.size * 0.1, el.size * 0.05,
        0, 0
      );
      ctx.fill();
      ctx.restore();
      
      // Detalhes sutis (sulcos da baleia)
      ctx.strokeStyle = this.adjustBrightness(el.color, -15);
      ctx.lineWidth = 1;
      ctx.globalAlpha = el.opacity * 0.4;
      for (let i = 0; i < 4; i++) {
        const xPos = el.size * (0.3 - i * 0.15);
        ctx.beginPath();
        ctx.moveTo(xPos, el.size * 0.15);
        ctx.lineTo(xPos - el.size * 0.05, el.size * 0.2);
        ctx.stroke();
      }
      
    } else {
      // ===== TUBARÃO MELHORADO =====
      ctx.fillStyle = el.color;
      
      // Corpo principal mais anatômico
      ctx.beginPath();
      ctx.moveTo(-el.size * 0.65, 0);
      // Linha superior - mais curvada
      ctx.bezierCurveTo(
        -el.size * 0.5, -el.size * 0.22,
        el.size * 0.3, -el.size * 0.22,
        el.size * 0.95, -el.size * 0.03
      );
      // Ponta do focinho
      ctx.lineTo(el.size * 1.0, 0);
      // Linha inferior
      ctx.bezierCurveTo(
        el.size * 0.4, el.size * 0.18,
        -el.size * 0.4, el.size * 0.18,
        -el.size * 0.65, 0
      );
      ctx.closePath();
      ctx.fill();
      
      // Barriga mais clara
      ctx.fillStyle = this.adjustBrightness(el.color, 25);
      ctx.beginPath();
      ctx.moveTo(-el.size * 0.5, 0);
      ctx.bezierCurveTo(
        -el.size * 0.3, el.size * 0.14,
        el.size * 0.2, el.size * 0.14,
        el.size * 0.7, el.size * 0.02
      );
      ctx.bezierCurveTo(
        el.size * 0.3, el.size * 0.12,
        -el.size * 0.2, el.size * 0.12,
        -el.size * 0.5, 0
      );
      ctx.fill();
      
      // Barbatana dorsal mais realista
      ctx.fillStyle = el.color;
      ctx.save();
      ctx.translate(el.size * 0.05, 0);
      ctx.beginPath();
      ctx.moveTo(0, -el.size * 0.22);
      ctx.bezierCurveTo(
        -el.size * 0.05, -el.size * 0.35,
        el.size * 0.1, -el.size * 0.5,
        el.size * 0.15, -el.size * 0.52
      );
      ctx.bezierCurveTo(
        el.size * 0.18, -el.size * 0.45,
        el.size * 0.25, -el.size * 0.28,
        el.size * 0.28, -el.size * 0.22
      );
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      
      // Barbatanas peitorais
      ctx.save();
      ctx.translate(el.size * 0.2, el.size * 0.12);
      ctx.rotate(-Math.PI * 0.2 + swimOffset * 0.03);
      ctx.beginPath();
      ctx.ellipse(0, 0, el.size * 0.25, el.size * 0.08, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      
      // Cauda em forma de crescente
      ctx.save();
      ctx.translate(-el.size * 0.7, 0);
      ctx.rotate(swimOffset * 0.2);
      
      // Lóbulo superior maior
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(
        -el.size * 0.12, -el.size * 0.2,
        -el.size * 0.2, -el.size * 0.4,
        -el.size * 0.25, -el.size * 0.48
      );
      ctx.bezierCurveTo(
        -el.size * 0.22, -el.size * 0.35,
        -el.size * 0.1, -el.size * 0.08,
        0, 0
      );
      ctx.fill();
      
      // Lóbulo inferior menor
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(
        -el.size * 0.1, el.size * 0.12,
        -el.size * 0.15, el.size * 0.18,
        -el.size * 0.18, el.size * 0.22
      );
      ctx.bezierCurveTo(
        -el.size * 0.16, el.size * 0.18,
        -el.size * 0.08, el.size * 0.05,
        0, 0
      );
      ctx.fill();
      ctx.restore();
      
      // Olho sutil
      ctx.globalAlpha = el.opacity * 0.6;
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(el.size * 0.65, -el.size * 0.08, el.size * 0.02, 0, Math.PI * 2);
      ctx.fill();
      
      // Brânquias
      ctx.globalAlpha = el.opacity * 0.3;
      ctx.strokeStyle = this.adjustBrightness(el.color, -20);
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        const xPos = el.size * (0.35 - i * 0.08);
        ctx.moveTo(xPos, el.size * 0.08);
        ctx.lineTo(xPos - el.size * 0.03, el.size * 0.14);
        ctx.stroke();
      }
    }
    
    ctx.restore();
  }
  
  /**
   * Helper para ajustar brilho de cor hex
   */
  adjustBrightness(hex, percent) {
    const num = parseInt(hex.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.min(255, Math.max(0, (num >> 16) + amt));
    const G = Math.min(255, Math.max(0, (num >> 8 & 0x00FF) + amt));
    const B = Math.min(255, Math.max(0, (num & 0x0000FF) + amt));
    return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
  }
  
  drawSunray(ctx, el) {
    ctx.save();
    ctx.globalAlpha = el.opacity * (0.8 + Math.sin(Date.now() * 0.001 + el.driftPhase) * 0.2);
    ctx.translate(el.x, el.y);
    ctx.rotate(el.angle);
    
    // Gradiente com mais transições suaves
    const gradient = ctx.createLinearGradient(0, 0, 0, el.height);
    gradient.addColorStop(0, '#93c5fd80');    // Azul claro com transparência
    gradient.addColorStop(0.15, '#60a5fa60');
    gradient.addColorStop(0.35, '#3b82f640');
    gradient.addColorStop(0.6, '#2563eb20');
    gradient.addColorStop(0.85, '#1e40af10');
    gradient.addColorStop(1, '#1e3a8a00');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(-el.width / 2, 0, el.width, el.height);
    
    // Adicionar "partículas de poeira" flutuando no raio de luz
    ctx.globalAlpha = el.opacity * 0.4;
    const particleCount = 8;
    for (let i = 0; i < particleCount; i++) {
      const particleY = (i / particleCount) * el.height;
      const particleX = Math.sin(Date.now() * 0.002 + i + el.driftPhase) * el.width * 0.3;
      const particleSize = 1 + Math.sin(Date.now() * 0.003 + i) * 0.5;
      
      ctx.fillStyle = '#bae6fd';
      ctx.beginPath();
      ctx.arc(particleX, particleY, particleSize, 0, Math.PI * 2);
      ctx.fill();
    }
    
    ctx.restore();
  }
  
  drawRockMedium(ctx, el) {
    ctx.fillStyle = el.color;
    ctx.beginPath();
    ctx.ellipse(el.x, el.y, el.size, el.size * 0.7, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Sombra
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath();
    ctx.ellipse(el.x, el.y + el.shadowOffset, el.size * 0.9, el.size * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  
  drawCoralDistant(ctx, el) {
    ctx.save();
    ctx.globalAlpha = el.opacity;
    ctx.fillStyle = el.color;
    ctx.translate(el.x, el.y);
    
    // Forma simples de coral
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2;
      const x = Math.cos(angle) * el.size * 0.5;
      const y = Math.sin(angle) * el.size * 0.5;
      
      ctx.beginPath();
      ctx.arc(x, y, el.size * 0.3, 0, Math.PI * 2);
      ctx.fill();
    }
    
    ctx.restore();
  }
  
  drawSeaweed(ctx, dec) {
    const sway = Math.sin(dec.swayPhase) * dec.swayAmount;
    
    ctx.save();
    ctx.translate(dec.x, dec.y);
    ctx.strokeStyle = dec.color;
    ctx.lineWidth = dec.width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    ctx.beginPath();
    ctx.moveTo(0, 0);
    
    const segmentHeight = dec.height / dec.segments;
    for (let i = 1; i <= dec.segments; i++) {
      const progress = i / dec.segments;
      const x = Math.sin(progress * Math.PI * 2 + dec.swayPhase) * sway * progress;
      const y = i * segmentHeight;
      
      if (i % 2 === 0) {
        // Adicionar folhinhas
        ctx.lineTo(x, y);
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(Math.sin(dec.swayPhase + i) * 0.5);
        ctx.fillStyle = dec.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, dec.width * 2, dec.width * 4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else {
        ctx.lineTo(x, y);
      }
    }
    
    ctx.stroke();
    ctx.restore();
  }
  
  drawRock(ctx, dec) {
    // Rocha principal
    ctx.fillStyle = dec.color;
    ctx.beginPath();
    ctx.ellipse(dec.x, dec.y, dec.width / 2, dec.height / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Sombra
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(dec.x + 5, dec.y + dec.height * 0.3, dec.width * 0.4, dec.height * 0.25, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Destaques
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    for (let i = 0; i < dec.highlights; i++) {
      const angle = (i / dec.highlights) * Math.PI;
      const x = dec.x - dec.width * 0.2 + Math.cos(angle) * dec.width * 0.15;
      const y = dec.y - dec.height * 0.2 + Math.sin(angle) * dec.height * 0.15;
      
      ctx.beginPath();
      ctx.arc(x, y, dec.size * 0.1, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  
  drawCoral(ctx, dec) {
    const pulse = 1 + Math.sin(dec.pulsePhase) * 0.1;
    
    ctx.save();
    ctx.translate(dec.x, dec.y);
    ctx.scale(pulse, pulse);
    ctx.fillStyle = dec.color;
    
    switch(dec.shape) {
      case 0: // Ramificado
        this.drawBranchedCoral(ctx, dec);
        break;
      case 1: // Circular
        this.drawCircularCoral(ctx, dec);
        break;
      case 2: // Leque
        this.drawFanCoral(ctx, dec);
        break;
      case 3: // Cérebro
        this.drawBrainCoral(ctx, dec);
        break;
      default:
        this.drawCircularCoral(ctx, dec);
    }
    
    ctx.restore();
  }
  
  drawAnemone(ctx, dec) {
    const pulse = 1 + Math.sin(dec.pulsePhase) * 0.15;
    
    ctx.save();
    ctx.translate(dec.x, dec.y);
    
    // Base/tronco
    ctx.fillStyle = dec.color;
    ctx.globalAlpha = 0.7;
    ctx.beginPath();
    ctx.arc(0, 0, dec.size * 0.3, 0, Math.PI * 2);
    ctx.fill();
    
    // Tentáculos ondulantes
    ctx.globalAlpha = 0.8;
    for (let i = 0; i < dec.tentacles; i++) {
      const angle = (i / dec.tentacles) * Math.PI * 2;
      const waveOffset = Math.sin(dec.wavePhase + i * 0.5) * 0.2;
      
      ctx.save();
      ctx.rotate(angle + waveOffset);
      
      // Gradiente para tentáculo
      const gradient = ctx.createLinearGradient(0, 0, 0, -dec.size * pulse);
      gradient.addColorStop(0, dec.color);
      gradient.addColorStop(1, dec.color + '40');
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.moveTo(-dec.size * 0.08, 0);
      ctx.quadraticCurveTo(
        -dec.size * 0.04, -dec.size * pulse * 0.5,
        0, -dec.size * pulse
      );
      ctx.quadraticCurveTo(
        dec.size * 0.04, -dec.size * pulse * 0.5,
        dec.size * 0.08, 0
      );
      ctx.closePath();
      ctx.fill();
      
      // Ponta brilhante
      ctx.fillStyle = '#FFFFFF';
      ctx.globalAlpha = 0.4;
      ctx.beginPath();
      ctx.arc(0, -dec.size * pulse, dec.size * 0.05, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.restore();
    }
    
    ctx.restore();
  }
  
  drawBioAlgae(ctx, dec) {
    const sway = Math.sin(dec.swayPhase) * dec.swayAmount;
    const glowIntensity = (Math.sin(dec.glowPhase) * 0.5 + 0.5) * dec.glowIntensity;
    
    ctx.save();
    ctx.translate(dec.x, dec.y);
    
    // Brilho atrás da alga
    ctx.shadowBlur = 15 * glowIntensity;
    ctx.shadowColor = dec.glowColor;
    
    ctx.strokeStyle = dec.glowColor;
    ctx.lineWidth = dec.width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.globalAlpha = 0.6 + glowIntensity * 0.4;
    
    ctx.beginPath();
    ctx.moveTo(0, 0);
    
    const segmentHeight = dec.height / dec.segments;
    for (let i = 1; i <= dec.segments; i++) {
      const progress = i / dec.segments;
      const x = Math.sin(progress * Math.PI * 2 + dec.swayPhase) * sway * progress;
      const y = i * segmentHeight;
      
      ctx.lineTo(x, y);
      
      // Pequenos "nós" brilhantes ao longo da alga
      if (i % 2 === 0) {
        ctx.save();
        const nodeGlow = glowIntensity * (1.2 - progress * 0.5);
        ctx.shadowBlur = 10 * nodeGlow;
        ctx.fillStyle = dec.glowColor;
        ctx.globalAlpha = 0.8 * nodeGlow;
        ctx.beginPath();
        ctx.arc(x, y, dec.width * 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }
    
    ctx.stroke();
    ctx.restore();
  }
  
  drawBranchedCoral(ctx, dec) {
    ctx.strokeStyle = dec.color;
    ctx.lineWidth = dec.size / 15;
    ctx.lineCap = 'round';
    
    const drawBranch = (len, angle, depth) => {
      if (depth <= 0 || len < 5) return;
      
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, -len);
      ctx.stroke();
      
      ctx.translate(0, -len);
      
      ctx.save();
      ctx.rotate(angle);
      drawBranch(len * 0.7, angle, depth - 1);
      ctx.restore();
      
      ctx.save();
      ctx.rotate(-angle);
      drawBranch(len * 0.7, angle, depth - 1);
      ctx.restore();
      
      ctx.translate(0, len);
    };
    
    drawBranch(dec.size / 2, Math.PI / 5, 4);
  }
  
  drawCircularCoral(ctx, dec) {
    for (let i = 0; i < dec.branches; i++) {
      const angle = (i / dec.branches) * Math.PI * 2;
      const x = Math.cos(angle) * dec.size * 0.4;
      const y = Math.sin(angle) * dec.size * 0.4;
      
      ctx.beginPath();
      ctx.arc(x, y, dec.size * 0.25, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Centro
    ctx.beginPath();
    ctx.arc(0, 0, dec.size * 0.2, 0, Math.PI * 2);
    ctx.fill();
  }
  
  drawFanCoral(ctx, dec) {
    ctx.strokeStyle = dec.color;
    ctx.lineWidth = 2;
    
    for (let i = 0; i < dec.branches * 2; i++) {
      const angle = (i / (dec.branches * 2)) * Math.PI - Math.PI / 2;
      ctx.save();
      ctx.rotate(angle);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, -dec.size);
      ctx.stroke();
      ctx.restore();
    }
  }
  
  drawBrainCoral(ctx, dec) {
    ctx.strokeStyle = dec.color;
    ctx.lineWidth = dec.size / 10;
    ctx.lineCap = 'round';
    
    const ridges = 6;
    for (let i = 0; i < ridges; i++) {
      const offset = (i / ridges) * dec.size;
      ctx.beginPath();
      
      for (let a = 0; a < Math.PI * 2; a += 0.2) {
        const r = dec.size * 0.4 + Math.sin(a * 3 + i) * dec.size * 0.1;
        const x = Math.cos(a) * r;
        const y = Math.sin(a) * r * 0.6;
        
        if (a === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      
      ctx.stroke();
    }
  }
  
  drawSandRipple(ctx, dec) {
    ctx.save();
    ctx.globalAlpha = dec.opacity;
    ctx.fillStyle = '#8B7355';
    
    ctx.beginPath();
    ctx.ellipse(dec.x, dec.y, dec.width / 2, dec.height / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
  }
  
  drawShell(ctx, dec) {
    ctx.save();
    ctx.translate(dec.x, dec.y);
    ctx.rotate(dec.rotation);
    ctx.fillStyle = dec.color;
    
    // Concha simples
    ctx.beginPath();
    ctx.arc(0, 0, dec.size, 0, Math.PI);
    ctx.closePath();
    ctx.fill();
    
    // Espiral
    ctx.strokeStyle = 'rgba(0,0,0,0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, 0, dec.size * 0.5, 0, Math.PI);
    ctx.stroke();
    
    ctx.restore();
  }
  
  drawBubble(ctx, effect) {
    ctx.save();
    ctx.globalAlpha = effect.opacity;
    
    // Borda da bolha
    ctx.strokeStyle = '#BFDBFE';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(effect.x, effect.y, effect.size, 0, Math.PI * 2);
    ctx.stroke();
    
    // Reflexo
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.beginPath();
    ctx.arc(
      effect.x - effect.size * 0.3,
      effect.y - effect.size * 0.3,
      effect.size * 0.3,
      0,
      Math.PI * 2
    );
    ctx.fill();
    
    ctx.restore();
  }
  
  drawLightParticle(ctx, effect) {
    const opacity = effect.baseOpacity * (Math.sin(effect.twinklePhase) * 0.5 + 0.5);
    
    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.fillStyle = effect.color;
    ctx.shadowBlur = 3;
    ctx.shadowColor = effect.color;
    ctx.beginPath();
    ctx.arc(effect.x, effect.y, effect.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  
  drawFloatParticle(ctx, effect) {
    ctx.save();
    ctx.globalAlpha = effect.opacity;
    ctx.fillStyle = effect.color;
    ctx.beginPath();
    ctx.arc(effect.x, effect.y, effect.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  
  /**
   * Desenha partículas de profundidade (névoa volumétrica animada)
   */
  drawDepthParticle(ctx, effect) {
    ctx.save();
    
    // Pulsação suave
    const pulse = Math.sin(effect.pulsePhase) * 0.3 + 0.7;
    const currentOpacity = effect.opacity * pulse;
    
    // Gradiente radial para criar efeito de névoa suave
    const gradient = ctx.createRadialGradient(
      effect.x, effect.y, 0,
      effect.x, effect.y, effect.size * pulse
    );
    
    gradient.addColorStop(0, `${effect.color}${Math.floor(currentOpacity * 100).toString(16).padStart(2, '0')}`);
    gradient.addColorStop(0.5, `${effect.color}${Math.floor(currentOpacity * 50).toString(16).padStart(2, '0')}`);
    gradient.addColorStop(1, `${effect.color}00`);
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(effect.x, effect.y, effect.size * pulse, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
  }
  
  /**
   * Desenha cardumes decorativos no fundo
   */
  drawDecorativeSchools(ctx, camera) {
    this.decorativeSchools.forEach(school => {
      // Verificar se está visível na câmera (com margem)
      if (camera) {
        const margin = 200;
        if (school.centerX < camera.x - margin || 
            school.centerX > camera.x + camera.width + margin ||
            school.centerY < camera.y - margin || 
            school.centerY > camera.y + camera.height + margin) {
          return;
        }
      }
      
      ctx.save();
      ctx.globalAlpha = 0.6;
      
      // Desenhar cada peixe do cardume
      school.fishes.forEach(fish => {
        const x = school.centerX + fish.offsetX;
        const y = school.centerY + fish.offsetY;
        
        // Calcular direção baseada na direção do cardume
        const angle = school.direction;
        const swimOffset = Math.sin(fish.phase) * 2;
        
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);
        
        // Corpo do peixe (elipse)
        ctx.fillStyle = school.color;
        ctx.beginPath();
        ctx.ellipse(swimOffset, 0, school.size * 0.6, school.size * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Cauda (triângulo)
        ctx.beginPath();
        ctx.moveTo(-school.size * 0.5 + swimOffset, 0);
        ctx.lineTo(-school.size * 0.8 + swimOffset, -school.size * 0.3);
        ctx.lineTo(-school.size * 0.8 + swimOffset, school.size * 0.3);
        ctx.closePath();
        ctx.fill();
        
        // Barbatana dorsal
        const finPhase = Math.sin(fish.phase * 2) * 0.3 + 0.7;
        ctx.beginPath();
        ctx.moveTo(swimOffset, -school.size * 0.3);
        ctx.lineTo(swimOffset + school.size * 0.2, -school.size * 0.5 * finPhase);
        ctx.lineTo(swimOffset + school.size * 0.3, -school.size * 0.3);
        ctx.closePath();
        ctx.fill();
        
        ctx.restore();
      });
      
      ctx.restore();
    });
  }
  
  // ================= MINIMAP =================
  
  /**
   * Desenha minimap no canto da tela
   */
  drawMinimap(ctx, player, camera, size = 150) {
    const padding = 20;
    const x = padding;
    const y = padding;
    const scale = size / Math.max(this.width, this.height);
    
    ctx.save();
    
    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(x, y, size, size);
    
    // Borda
    ctx.strokeStyle = '#60A5FA';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, size, size);
    
    // Desenhar zonas
    this.zones.forEach(zone => {
      ctx.fillStyle = zone.ambient.color + '40';
      ctx.fillRect(
        x + zone.bounds.x * scale,
        y + zone.bounds.y * scale,
        zone.bounds.width * scale,
        zone.bounds.height * scale
      );
      
      // Label da zona
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.font = 'bold 9px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(
        zone.name.toUpperCase(),
        x + (zone.bounds.x + zone.bounds.width / 2) * scale,
        y + (zone.bounds.y + zone.bounds.height / 2) * scale
      );
    });
    
    // Desenhar player
    if (player) {
      ctx.fillStyle = '#22C55E';
      ctx.shadowBlur = 5;
      ctx.shadowColor = '#22C55E';
      ctx.beginPath();
      ctx.arc(
        x + player.x * scale,
        y + player.y * scale,
        4,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
    
    // Viewport da câmera
    if (camera) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 1;
      ctx.strokeRect(
        x + camera.x * scale,
        y + camera.y * scale,
        camera.width * scale,
        camera.height * scale
      );
    }
    
    ctx.restore();
  }
  
  // ================= UTILIDADES =================
  
  /**
   * Verifica se um elemento está visível na câmera
   */
  isElementVisible(el, camera, parallax) {
    const margin = 200; // Margem extra
    const camX = camera.x * parallax;
    const camY = camera.y * parallax;
    const size = el.size || el.width || el.height || 50;
    
    return (
      el.x + size > camX - margin &&
      el.x - size < camX + camera.width + margin &&
      el.y + size > camY - margin &&
      el.y - size < camY + camera.height + margin
    );
  }
  
  /**
   * Força um objeto a ficar dentro dos limites do mapa
   */
  enforceBoundaries(obj) {
    obj.x = Math.max(this.boundaries.minX + obj.r, Math.min(this.boundaries.maxX - obj.r, obj.x));
    obj.y = Math.max(this.boundaries.minY + obj.r, Math.min(this.boundaries.maxY - obj.r, obj.y));
  }
  
  /**
   * Cores aleatórias
   */
  getRandomCoralColor() {
    const colors = [
      '#ff6b6b', '#4ecdc4', '#f9ca24', '#a29bfe',
      '#fd79a8', '#fdcb6e', '#55efc4', '#e17055'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }
  
  getRandomRockColor() {
    const colors = ['#4a5568', '#64748b', '#475569', '#334155'];
    return colors[Math.floor(Math.random() * colors.length)];
  }
  
  getRandomShellColor() {
    const colors = ['#F5DEB3', '#DEB887', '#D2B48C', '#BC8F8F'];
    return colors[Math.floor(Math.random() * colors.length)];
  }
}

// ================= INSTÂNCIA GLOBAL =================

let mapSystem = null;

/**
 * Inicializa o sistema de mapa
 */
function initMapSystem(width, height) {
  mapSystem = new MapSystem(width, height);
  console.log('🗺️ Sistema de mapa inicializado!');
  return mapSystem;
}

// ================= COMANDOS DE DEBUG =================

if (typeof window !== 'undefined') {
  window.mapDebug = {
    info: () => {
      if (mapSystem) {
        console.log('🗺️ Informações do Mapa:');
        console.log(`   Dimensões: ${mapSystem.width}x${mapSystem.height}`);
        console.log(`   Camadas: ${mapSystem.layers.length}`);
        console.log(`   Decorações: ${mapSystem.decorations.length}`);
        console.log(`   Efeitos: ${mapSystem.ambientEffects.length}`);
        console.log(`   Zonas: ${mapSystem.zones.length}`);
      }
    },
    zones: () => {
      if (mapSystem) {
        console.table(mapSystem.zones.map(z => ({
          Nome: z.name,
          Dificuldade: z.difficulty,
          Posição: `${z.bounds.x},${z.bounds.y}`,
          Tamanho: `${z.bounds.width}x${z.bounds.height}`
        })));
      }
    },
    zoneAt: (x, y) => {
      if (mapSystem) {
        const zone = mapSystem.getZoneAt(x, y);
        console.log(`Zona em (${x}, ${y}):`, zone.name);
        console.log(zone);
      }
    },
    toggleParallax: () => {
      if (mapSystem) {
        mapSystem.config.parallaxIntensity = mapSystem.config.parallaxIntensity > 0 ? 0 : 1;
        console.log('Parallax:', mapSystem.config.parallaxIntensity > 0 ? 'ON' : 'OFF');
      }
    }
  };
}
