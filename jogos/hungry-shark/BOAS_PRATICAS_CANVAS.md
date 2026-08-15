# 🎨 GUIA DE BOAS PRÁTICAS - Renderização Canvas 2D

## 📚 ÍNDICE
1. [Transformações Corretas](#transformações-corretas)
2. [Sistema de Pivot/Anchor](#sistema-de-pivotanchor)
3. [Animações Suaves](#animações-suaves)
4. [Otimização de Performance](#otimização-de-performance)
5. [Debugging Visual](#debugging-visual)

---

## 🔄 TRANSFORMAÇÕES CORRETAS

### Regra de Ouro

```
SEMPRE: save → translate → rotate → scale → draw → restore
```

### ❌ ERROS COMUNS

#### Erro #1: Esquecer save/restore
```javascript
// ❌ MUITO RUIM - Transformações acumulam!
function drawEnemy(ctx, enemy) {
    ctx.translate(enemy.x, enemy.y);
    ctx.rotate(enemy.angle);
    // ... desenhar ...
}
// Próximo objeto será desenhado com transformações acumuladas!
```

#### Erro #2: Ordem errada de transformações
```javascript
// ❌ ERRADO - Rotação antes de translate
ctx.rotate(angle);      // Rotaciona ao redor da origem global
ctx.translate(x, y);    // Move DEPOIS de rotacionar = posição errada
```

#### Erro #3: Transformações aninhadas sem controle
```javascript
// ❌ RUIM - Múltiplos save sem restore
ctx.save();
ctx.translate(x, y);
ctx.save();  // Outro save
ctx.rotate(angle);
// Esqueceu de restore() = memory leak
```

### ✅ CÓDIGO CORRETO

#### Exemplo 1: Sprite Simples
```javascript
function drawSprite(ctx, sprite) {
    ctx.save();
    
    // 1º - Posição
    ctx.translate(sprite.x, sprite.y);
    
    // 2º - Rotação
    ctx.rotate(sprite.angle);
    
    // 3º - Escala (opcional)
    if (sprite.scale) {
        ctx.scale(sprite.scale, sprite.scale);
    }
    
    // 4º - Desenhar centrado no pivot
    ctx.fillStyle = sprite.color;
    ctx.fillRect(-sprite.width/2, -sprite.height/2, sprite.width, sprite.height);
    
    ctx.restore();
}
```

#### Exemplo 2: Sprite Animado
```javascript
function drawAnimatedEnemy(ctx, enemy) {
    ctx.save();
    
    // Posição e rotação
    ctx.translate(enemy.x, enemy.y);
    ctx.rotate(enemy.angle);
    
    // Opacidade (se aplicável)
    if (enemy.opacity < 1) {
        ctx.globalAlpha = enemy.opacity;
    }
    
    // Calcular animação
    const tailWave = Math.sin(enemy.animPhase) * 10;
    
    // Corpo
    ctx.fillStyle = enemy.color;
    ctx.fillRect(-40, -20, 80, 40);
    
    // Cauda animada
    ctx.save();  // Sub-transformação para cauda
    ctx.translate(-40, 0);  // Posição da cauda
    ctx.rotate(tailWave * 0.1);  // Balanço da cauda
    ctx.fillRect(-20, -10, 20, 20);
    ctx.restore();  // Restaurar apenas cauda
    
    ctx.restore();  // Restaurar tudo
}
```

#### Exemplo 3: Hierarquia de Objetos
```javascript
function drawTurret(ctx, turret) {
    ctx.save();
    
    // Base (não rotaciona)
    ctx.translate(turret.x, turret.y);
    ctx.fillStyle = '#666';
    ctx.fillRect(-30, -30, 60, 60);
    
    // Canhão (rotaciona independente)
    ctx.save();
    ctx.rotate(turret.barrelAngle);  // Rotação do canhão
    ctx.fillStyle = '#333';
    ctx.fillRect(0, -10, 50, 20);  // Canhão
    ctx.restore();
    
    ctx.restore();
}
```

---

## 📍 SISTEMA DE PIVOT/ANCHOR

### O Que É Pivot?

**Pivot (ou Anchor)** = Ponto de origem para transformações

```
    ┌─────────┐
    │         │
    │    ⊕    │  ← Pivot no centro
    │         │
    └─────────┘

Rotação ocorre AO REDOR do pivot
```

### Diferentes Posições de Pivot

#### Centro (Mais Comum para Inimigos)
```javascript
// Pivot no centro
function drawCentered(ctx, x, y, width, height) {
    ctx.fillRect(-width/2, -height/2, width, height);
}
```

#### Canto Superior Esquerdo (UI Elements)
```javascript
// Pivot no canto superior esquerdo
function drawTopLeft(ctx, x, y, width, height) {
    ctx.fillRect(0, 0, width, height);
}
```

#### Base (Personagens em Plataforma)
```javascript
// Pivot na base do sprite
function drawCharacter(ctx, x, y, width, height) {
    ctx.fillRect(-width/2, -height, width, height);
}
```

### Sistema de Pivot Customizável

```javascript
class Sprite {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.pivotX = 0.5;  // 0-1, onde 0.5 = centro
        this.pivotY = 0.5;  // 0-1, onde 0.5 = centro
        this.angle = 0;
    }
    
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        
        const offsetX = -this.width * this.pivotX;
        const offsetY = -this.height * this.pivotY;
        
        ctx.fillRect(offsetX, offsetY, this.width, this.height);
        ctx.restore();
    }
}

// Uso:
const enemy = new Sprite(100, 100, 50, 30);
enemy.pivotX = 0.5;  // Centro horizontal
enemy.pivotY = 0.5;  // Centro vertical
```

---

## 🎬 ANIMAÇÕES SUAVES

### Princípios Fundamentais

1. **Use Delta Time (dt)** para animações consistentes
2. **Normalize fases** para evitar overflow
3. **Use Math.sin/cos** para movimentos naturais
4. **Interpole valores** para suavidade

### Exemplo Completo: Natação Realista

```javascript
class Fish {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.angle = 0;
        
        // Fases de animação
        this.bodyWave = 0;      // Ondulação do corpo
        this.tailWave = 0;      // Balanço da cauda
        this.finWave = 0;       // Movimento das barbatanas
        
        // Velocidades de animação
        this.bodySpeed = 5;
        this.tailSpeed = 8;
        this.finSpeed = 10;
    }
    
    update(dt) {
        // Atualizar fases
        this.bodyWave += dt * this.bodySpeed;
        this.tailWave += dt * this.tailSpeed;
        this.finWave += dt * this.finSpeed;
        
        // Normalizar (evitar overflow)
        const TWO_PI = Math.PI * 2;
        if (this.bodyWave > TWO_PI) this.bodyWave -= TWO_PI;
        if (this.tailWave > TWO_PI) this.tailWave -= TWO_PI;
        if (this.finWave > TWO_PI) this.finWave -= TWO_PI;
        
        // Movimento
        this.x += Math.cos(this.angle) * 50 * dt;
        this.y += Math.sin(this.angle) * 50 * dt;
    }
    
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        
        // Ondulação do corpo
        const bodyOffset = Math.sin(this.bodyWave) * 2;
        
        // Corpo
        ctx.fillStyle = '#FF6B6B';
        ctx.beginPath();
        ctx.ellipse(bodyOffset, 0, 30, 15, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Cauda (balança mais que o corpo)
        const tailOffset = Math.sin(this.tailWave) * 8;
        ctx.save();
        ctx.translate(-30, bodyOffset);
        ctx.rotate(tailOffset * 0.15);
        ctx.fillStyle = '#FF4444';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-15, -10);
        ctx.lineTo(-15, 10);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
        
        // Barbatanas (movimento sutil)
        const finOffset = Math.sin(this.finWave) * 3;
        ctx.fillStyle = '#FF8888';
        
        // Barbatana superior
        ctx.beginPath();
        ctx.moveTo(10, -15);
        ctx.lineTo(15, -20 + finOffset);
        ctx.lineTo(20, -15);
        ctx.closePath();
        ctx.fill();
        
        // Barbatana inferior
        ctx.beginPath();
        ctx.moveTo(10, 15);
        ctx.lineTo(15, 20 - finOffset);
        ctx.lineTo(20, 15);
        ctx.closePath();
        ctx.fill();
        
        ctx.restore();
    }
}

// Uso:
const fish = new Fish(200, 200);

function gameLoop(timestamp) {
    const dt = (timestamp - lastTime) / 1000;
    lastTime = timestamp;
    
    fish.update(dt);
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    fish.draw(ctx);
    
    requestAnimationFrame(gameLoop);
}
```

### Interpolação Suave (Lerp)

```javascript
// Linear interpolation
function lerp(start, end, t) {
    return start + (end - start) * t;
}

// Smooth step (ease in/out)
function smoothstep(t) {
    return t * t * (3 - 2 * t);
}

// Uso em rotação suave
function updateRotation(current, target, dt) {
    // Normalizar diferença de ângulo
    let diff = target - current;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    
    // Interpolar suavemente
    const speed = 5;  // Velocidade de rotação
    return current + diff * dt * speed;
}

// Exemplo:
enemy.angle = updateRotation(enemy.angle, targetAngle, dt);
```

---

## ⚡ OTIMIZAÇÃO DE PERFORMANCE

### 1. Minimizar Chamadas de Estado

#### ❌ RUIM - Muitas mudanças de estado
```javascript
for (let enemy of enemies) {
    ctx.fillStyle = enemy.color;  // Mudança de cor a cada loop
    ctx.fillRect(enemy.x, enemy.y, 20, 20);
}
```

#### ✅ BOM - Agrupar por cor
```javascript
// Agrupar inimigos por cor
const byColor = enemies.reduce((acc, e) => {
    (acc[e.color] = acc[e.color] || []).push(e);
    return acc;
}, {});

// Desenhar em lotes
for (let color in byColor) {
    ctx.fillStyle = color;  // Mudança de cor uma vez por lote
    for (let enemy of byColor[color]) {
        ctx.fillRect(enemy.x, enemy.y, 20, 20);
    }
}
```

### 2. Culling (Não Desenhar Invisíveis)

```javascript
function isVisible(obj, camera) {
    const margin = 100;
    return obj.x + obj.width > camera.x - margin &&
           obj.x < camera.x + camera.width + margin &&
           obj.y + obj.height > camera.y - margin &&
           obj.y < camera.y + camera.height + margin;
}

// Uso:
for (let enemy of enemies) {
    if (isVisible(enemy, camera)) {
        enemy.draw(ctx);
    }
}
```

### 3. Object Pooling (Reutilizar Objetos)

```javascript
class EnemyPool {
    constructor(size) {
        this.pool = [];
        this.active = [];
        
        // Pre-criar objetos
        for (let i = 0; i < size; i++) {
            this.pool.push(this.createEnemy());
        }
    }
    
    createEnemy() {
        return {
            x: 0, y: 0,
            active: false,
            swimPhase: 0,
            finPhase: 0
        };
    }
    
    spawn(x, y) {
        let enemy = this.pool.pop();
        
        if (!enemy) {
            enemy = this.createEnemy();
        }
        
        // Resetar propriedades
        enemy.x = x;
        enemy.y = y;
        enemy.active = true;
        enemy.swimPhase = 0;
        enemy.finPhase = 0;
        
        this.active.push(enemy);
        return enemy;
    }
    
    despawn(enemy) {
        const index = this.active.indexOf(enemy);
        if (index > -1) {
            this.active.splice(index, 1);
            enemy.active = false;
            this.pool.push(enemy);
        }
    }
}

// Uso:
const pool = new EnemyPool(50);
const enemy = pool.spawn(100, 100);
// ... uso ...
pool.despawn(enemy);  // Retorna ao pool ao invés de destruir
```

---

## 🔍 DEBUGGING VISUAL

### Sistema de Debug Overlay

```javascript
class DebugRenderer {
    constructor() {
        this.enabled = false;
    }
    
    toggle() {
        this.enabled = !this.enabled;
    }
    
    drawBounds(ctx, obj) {
        if (!this.enabled) return;
        
        ctx.save();
        ctx.strokeStyle = '#00FF00';
        ctx.lineWidth = 2;
        ctx.strokeRect(obj.x - obj.width/2, obj.y - obj.height/2, obj.width, obj.height);
        ctx.restore();
    }
    
    drawPivot(ctx, x, y) {
        if (!this.enabled) return;
        
        ctx.save();
        ctx.strokeStyle = '#FF0000';
        ctx.lineWidth = 2;
        
        // Cruz no pivot
        ctx.beginPath();
        ctx.moveTo(x - 10, y);
        ctx.lineTo(x + 10, y);
        ctx.moveTo(x, y - 10);
        ctx.lineTo(x, y + 10);
        ctx.stroke();
        
        // Círculo
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.restore();
    }
    
    drawVector(ctx, x, y, vx, vy, color = '#FFFF00') {
        if (!this.enabled) return;
        
        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        
        const scale = 50;
        const endX = x + vx * scale;
        const endY = y + vy * scale;
        
        // Linha
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(endX, endY);
        ctx.stroke();
        
        // Seta
        const angle = Math.atan2(vy, vx);
        ctx.beginPath();
        ctx.moveTo(endX, endY);
        ctx.lineTo(
            endX - 10 * Math.cos(angle - Math.PI/6),
            endY - 10 * Math.sin(angle - Math.PI/6)
        );
        ctx.moveTo(endX, endY);
        ctx.lineTo(
            endX - 10 * Math.cos(angle + Math.PI/6),
            endY - 10 * Math.sin(angle + Math.PI/6)
        );
        ctx.stroke();
        
        ctx.restore();
    }
    
    drawText(ctx, x, y, text) {
        if (!this.enabled) return;
        
        ctx.save();
        ctx.fillStyle = '#FFFFFF';
        ctx.strokeStyle = '#000000';
        ctx.font = '12px monospace';
        ctx.lineWidth = 3;
        ctx.strokeText(text, x, y);
        ctx.fillText(text, x, y);
        ctx.restore();
    }
}

// Uso:
const debug = new DebugRenderer();

function drawEnemy(ctx, enemy) {
    // Renderização normal
    ctx.save();
    ctx.translate(enemy.x, enemy.y);
    ctx.rotate(enemy.angle);
    // ... desenhar sprite ...
    ctx.restore();
    
    // Debug overlay
    debug.drawBounds(ctx, enemy);
    debug.drawPivot(ctx, enemy.x, enemy.y);
    debug.drawVector(ctx, enemy.x, enemy.y, 
                     Math.cos(enemy.angle), Math.sin(enemy.angle));
    debug.drawText(ctx, enemy.x, enemy.y - 40, 
                   `Phase: ${enemy.swimPhase.toFixed(2)}`);
}

// Ativar/desativar com tecla
window.addEventListener('keypress', (e) => {
    if (e.key === 'd') debug.toggle();
});
```

### Console Helpers

```javascript
// Adicionar ao objeto global para debug
window.gameDebug = {
    // Listar todos os inimigos
    listEnemies() {
        console.table(enemies.map(e => ({
            x: e.x.toFixed(0),
            y: e.y.toFixed(0),
            angle: (e.angle * 180 / Math.PI).toFixed(0) + '°',
            swimPhase: e.swimPhase.toFixed(2),
            finPhase: e.finPhase.toFixed(2)
        })));
    },
    
    // Verificar valores inválidos
    checkNaN() {
        const invalid = enemies.filter(e => 
            isNaN(e.x) || isNaN(e.y) || 
            isNaN(e.angle) || 
            isNaN(e.swimPhase) || 
            isNaN(e.finPhase)
        );
        
        if (invalid.length > 0) {
            console.error('⚠️ Inimigos com valores NaN:', invalid);
        } else {
            console.log('✅ Todos os inimigos válidos');
        }
    },
    
    // Pausar/despausar
    togglePause() {
        this.paused = !this.paused;
        console.log(this.paused ? '⏸️ Pausado' : '▶️ Rodando');
    }
};

// Uso no console:
// gameDebug.listEnemies()
// gameDebug.checkNaN()
// gameDebug.togglePause()
```

---

## 📋 CHECKLIST FINAL

Antes de lançar, verifique:

### Renderização
```
✅ [ ] ctx.save() e ctx.restore() em todas as funções de desenho
✅ [ ] Transformações na ordem: translate → rotate → scale
✅ [ ] Sprites desenhados centrados no pivot
✅ [ ] Sem transformações acumulativas
✅ [ ] Valores de animação inicializados (não undefined)
```

### Performance
```
✅ [ ] Culling implementado (não desenhar invisíveis)
✅ [ ] Estados agrupados (cores, texturas)
✅ [ ] Object pooling para objetos frequentes
✅ [ ] Sem cálculos pesados no loop de renderização
```

### Animação
```
✅ [ ] Delta time usado em todas as animações
✅ [ ] Fases normalizadas (evitar overflow)
✅ [ ] Interpolação suave para rotações
✅ [ ] Proteção contra NaN/undefined
```

### Debug
```
✅ [ ] Sistema de debug visual implementado
✅ [ ] Console helpers disponíveis
✅ [ ] Validação de valores (checkNaN)
✅ [ ] Modo de pausa para inspeção
```

---

## 🎓 RECURSOS ADICIONAIS

### Leitura Recomendada
- [MDN: Canvas Tutorial](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial)
- [HTML5 Canvas Performance](https://www.html5rocks.com/en/tutorials/canvas/performance/)
- [Game Programming Patterns](https://gameprogrammingpatterns.com/)

### Ferramentas Úteis
- Chrome DevTools Performance Tab
- Canvas Inspector (Firefox Developer Tools)
- Spector.js (WebGL debugging)

---

**Happy Coding! 🚀**
