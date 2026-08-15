// ================= SISTEMA DE POOLING DE OBJETOS =================

/**
 * Pool Genérico de Objetos
 * Reduz garbage collection ao reutilizar objetos em vez de criar novos
 */
class ObjectPool {
  constructor(factoryFn, resetFn, initialSize = 10, maxSize = 100) {
    this.factoryFn = factoryFn;    // Função para criar novos objetos
    this.resetFn = resetFn;        // Função para resetar objetos antes de reutilizar
    this.maxSize = maxSize;        // Tamanho máximo do pool
    this.pool = [];                // Array de objetos disponíveis
    this.active = new Set();       // Set de objetos ativos (em uso)
    this.totalCreated = 0;         // Contador total de objetos criados
    
    // Pré-alocar objetos iniciais
    this.expand(initialSize);
  }
  
  /**
   * Expande o pool criando novos objetos
   */
  expand(count) {
    for (let i = 0; i < count; i++) {
      if (this.totalCreated >= this.maxSize) {
        console.warn(`Pool atingiu tamanho máximo: ${this.maxSize}`);
        break;
      }
      
      const obj = this.factoryFn();
      obj._pooled = true; // Marca objeto como gerenciado pelo pool
      this.pool.push(obj);
      this.totalCreated++;
    }
  }
  
  /**
   * Adquire um objeto do pool (ou cria um novo se necessário)
   */
  acquire(...args) {
    let obj;
    
    if (this.pool.length > 0) {
      // Reutiliza objeto existente
      obj = this.pool.pop();
    } else {
      // Pool vazio - cria novo objeto (auto-expansão)
      if (this.totalCreated < this.maxSize) {
        obj = this.factoryFn();
        obj._pooled = true;
        this.totalCreated++;
      } else {
        console.warn('Pool esgotado e limite máximo atingido');
        return null;
      }
    }
    
    // Reseta o objeto com novos parâmetros
    if (this.resetFn) {
      this.resetFn(obj, ...args);
    }
    
    // Adiciona ao set de objetos ativos
    this.active.add(obj);
    
    return obj;
  }
  
  /**
   * Libera um objeto de volta ao pool
   */
  release(obj) {
    if (!obj || !obj._pooled) {
      console.warn('Tentativa de liberar objeto não gerenciado pelo pool');
      return;
    }
    
    // Remove do set de ativos
    if (!this.active.has(obj)) {
      console.warn('Tentativa de liberar objeto já liberado');
      return;
    }
    
    this.active.delete(obj);
    
    // Retorna ao pool
    this.pool.push(obj);
  }
  
  /**
   * Libera múltiplos objetos de uma vez
   */
  releaseAll(objects) {
    objects.forEach(obj => this.release(obj));
  }
  
  /**
   * Obtém estatísticas do pool
   */
  getStats() {
    return {
      available: this.pool.length,
      active: this.active.size,
      total: this.totalCreated,
      maxSize: this.maxSize,
      utilizationPercent: (this.active.size / this.totalCreated * 100).toFixed(1)
    };
  }
  
  /**
   * Limpa completamente o pool (útil para resetar o jogo)
   */
  clear() {
    this.pool.length = 0;
    this.active.clear();
    this.totalCreated = 0;
  }
}

// ================= POOLS ESPECÍFICOS PARA O JOGO =================

/**
 * Pool de Peixes
 */
class FishPool extends ObjectPool {
  constructor(initialSize = 50, maxSize = 200) {
    super(
      // Factory: cria um novo peixe vazio
      () => ({
        x: 0,
        y: 0,
        r: 0,
        speed: 0,
        angle: 0,
        color: '',
        food: 0,
        xp: 0,
        swimPhase: 0,
        wanderTimer: 0,
        wanderAngle: 0,
        _pooled: true
      }),
      
      // Reset: reinicializa peixe com novos valores
      (fish, x, y, r) => {
        // Se tipos de peixes estão definidos, usar tipo aleatório
        if (typeof selectRandomFishType === 'function') {
          const fishType = selectRandomFishType();
          const typedFish = createFishFromType(fishType, x || 0, y || 0);
          
          // Copiar todas as propriedades do peixe tipado
          Object.assign(fish, typedFish);
        } else {
          // Fallback para sistema antigo
          fish.x = x;
          fish.y = y;
          fish.r = r;
          fish.speed = CONFIG.FISH_BASE_SPEED + Math.random() * CONFIG.FISH_SPEED_VARIANCE;
          fish.angle = Math.random() * Math.PI * 2;
          fish.color = getRandomFishColor();
          fish.food = Math.floor(r * 2);
          fish.xp = Math.floor(r);
          fish.swimPhase = Math.random() * Math.PI * 2;
          fish.wanderTimer = 0;
          fish.wanderAngle = fish.angle;
        }
      },
      
      initialSize,
      maxSize
    );
  }
  
  /**
   * Cria um peixe em posição aleatória fora da tela
   */
  spawn() {
    const pos = getOffscreenPosition();
    const r = randomRange(CONFIG.FISH_MIN_RADIUS, CONFIG.FISH_MAX_RADIUS);
    return this.acquire(pos.x, pos.y, r);
  }
}

/**
 * Pool de Inimigos
 */
class EnemyPool extends ObjectPool {
  constructor(initialSize = 10, maxSize = 50) {
    super(
      // Factory: cria um novo inimigo vazio
      () => ({
        x: 0,
        y: 0,
        r: 0,
        speed: 0,
        angle: 0,
        damage: 0,
        swimPhase: 0,
        aggroRange: 250,
        state: 'patrol',
        patrolAngle: 0,
        patrolTimer: 0,
        _pooled: true
      }),
      
      // Reset: reinicializa inimigo com novos valores
      (enemy, x, y, r) => {
        enemy.x = x;
        enemy.y = y;
        enemy.r = r;
        enemy.speed = CONFIG.ENEMY_BASE_SPEED + Math.random() * CONFIG.ENEMY_SPEED_VARIANCE;
        enemy.angle = 0;
        enemy.damage = Math.floor(r * 1.5);
        enemy.swimPhase = Math.random() * Math.PI * 2;
        enemy.aggroRange = 250;
        enemy.state = 'patrol';
        enemy.patrolAngle = Math.random() * Math.PI * 2;
        enemy.patrolTimer = randomRange(2, 4);
      },
      
      initialSize,
      maxSize
    );
  }
  
  /**
   * Cria um inimigo em posição aleatória fora da tela
   */
  spawn() {
    const pos = getOffscreenPosition();
    const r = randomRange(CONFIG.ENEMY_MIN_RADIUS, CONFIG.ENEMY_MAX_RADIUS);
    return this.acquire(pos.x, pos.y, r);
  }
}

/**
 * Pool de Partículas
 */
class ParticlePool extends ObjectPool {
  constructor(initialSize = 50, maxSize = 200) {
    super(
      // Factory: cria uma nova partícula vazia
      () => ({
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        life: 0,
        color: '',
        _pooled: true
      }),
      
      // Reset: reinicializa partícula com novos valores
      (particle, x, y, color) => {
        particle.x = x;
        particle.y = y;
        particle.vx = randomRange(-2, 2);
        particle.vy = randomRange(-2, 2);
        particle.life = 1;
        particle.color = color;
      },
      
      initialSize,
      maxSize
    );
  }
  
  /**
   * Cria múltiplas partículas de uma vez
   */
  burst(x, y, color, count) {
    const particles = [];
    for (let i = 0; i < count; i++) {
      const particle = this.acquire(x, y, color);
      if (particle) {
        particles.push(particle);
      }
    }
    return particles;
  }
}

/**
 * Pool de Partículas de Sangue
 */
class BloodParticlePool extends ObjectPool {
  constructor(initialSize = 30, maxSize = 100) {
    super(
      // Factory: cria uma nova partícula de sangue vazia
      () => ({
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        life: 0,
        size: 0,
        _pooled: true
      }),
      
      // Reset: reinicializa partícula de sangue
      (particle, x, y) => {
        particle.x = x;
        particle.y = y;
        particle.vx = randomRange(-3, 3);
        particle.vy = randomRange(-3, 3);
        particle.life = 1;
        particle.size = randomRange(2, 6);
      },
      
      initialSize,
      maxSize
    );
  }
  
  /**
   * Cria múltiplas partículas de sangue de uma vez
   */
  burst(x, y, count) {
    const particles = [];
    for (let i = 0; i < count; i++) {
      const particle = this.acquire(x, y);
      if (particle) {
        particles.push(particle);
      }
    }
    return particles;
  }
}

/**
 * Pool de Score Popups
 */
class ScorePopupPool extends ObjectPool {
  constructor(initialSize = 20, maxSize = 50) {
    super(
      // Factory: cria um novo score popup vazio
      () => ({
        x: 0,
        y: 0,
        text: '',
        color: '',
        life: 0,
        vy: 0,
        _pooled: true
      }),
      
      // Reset: reinicializa score popup
      (popup, x, y, text, color) => {
        popup.x = x;
        popup.y = y;
        popup.text = text;
        popup.color = color || 'white';
        popup.life = 1;
        popup.vy = -1;
      },
      
      initialSize,
      maxSize
    );
  }
}

/**
 * Pool de Moedas Flutuantes
 */
class CoinPool extends ObjectPool {
  constructor(initialSize = 15, maxSize = 50) {
    super(
      // Factory: cria uma nova moeda vazia
      () => ({
        x: 0,
        y: 0,
        r: CONFIG.COIN_RADIUS,
        value: 1,
        collected: false,
        bobPhase: 0,
        _pooled: true
      }),
      
      // Reset: reinicializa moeda
      (coin, x, y) => {
        coin.x = x;
        coin.y = y;
        coin.r = CONFIG.COIN_RADIUS;
        coin.value = 1;
        coin.collected = false;
        coin.bobPhase = Math.random() * Math.PI * 2;
      },
      
      initialSize,
      maxSize
    );
  }
}

/**
 * Pool de Gemas Flutuantes
 */
class GemPool extends ObjectPool {
  constructor(initialSize = 10, maxSize = 30) {
    super(
      // Factory: cria uma nova gema vazia
      () => ({
        x: 0,
        y: 0,
        r: CONFIG.GEM_RADIUS,
        value: 1,
        collected: false,
        bobPhase: 0,
        sparklePhase: 0,
        _pooled: true
      }),
      
      // Reset: reinicializa gema
      (gem, x, y) => {
        gem.x = x;
        gem.y = y;
        gem.r = CONFIG.GEM_RADIUS;
        gem.value = 1;
        gem.collected = false;
        gem.bobPhase = Math.random() * Math.PI * 2;
        gem.sparklePhase = Math.random() * Math.PI * 2;
      },
      
      initialSize,
      maxSize
    );
  }
}

// ================= INSTÂNCIAS GLOBAIS DOS POOLS =================

const pools = {
  fish: new FishPool(24, 125),
  enemy: new EnemyPool(10, 50),
  particle: new ParticlePool(50, 200),
  bloodParticle: new BloodParticlePool(30, 100),
  scorePopup: new ScorePopupPool(20, 50),
  coin: new CoinPool(15, 50),
  gem: new GemPool(10, 30)
};

// ================= FUNÇÕES DE CONVENIÊNCIA =================

/**
 * Obtém estatísticas de todos os pools
 */
function getPoolStats() {
  const stats = {};
  for (const [name, pool] of Object.entries(pools)) {
    stats[name] = pool.getStats();
  }
  return stats;
}

/**
 * Limpa todos os pools (útil ao reiniciar o jogo)
 */
function clearAllPools() {
  for (const pool of Object.values(pools)) {
    pool.clear();
  }
}

/**
 * Loga estatísticas dos pools no console
 */
function logPoolStats() {
  console.log('=== Pool Statistics ===');
  const stats = getPoolStats();
  for (const [name, stat] of Object.entries(stats)) {
    console.log(`${name.padEnd(15)} | Available: ${stat.available.toString().padStart(3)} | Active: ${stat.active.toString().padStart(3)} | Total: ${stat.total.toString().padStart(3)} | Utilization: ${stat.utilizationPercent}%`);
  }
  console.log('======================');
}

// ================= COMANDOS DE DEBUG =================

// Disponibilizar no console para debugging
if (typeof window !== 'undefined') {
  window.pools = pools;
  window.getPoolStats = getPoolStats;
  window.logPoolStats = logPoolStats;
  window.clearAllPools = clearAllPools;
}

// Auto-log de estatísticas a cada 30 segundos (apenas em desenvolvimento)
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
  setInterval(() => {
    const stats = getPoolStats();
    const totalActive = Object.values(stats).reduce((sum, s) => sum + s.active, 0);
    const totalAvailable = Object.values(stats).reduce((sum, s) => sum + s.available, 0);
    console.log(`Pools: ${totalActive} ativos, ${totalAvailable} disponíveis`);
  }, 30000);
}
