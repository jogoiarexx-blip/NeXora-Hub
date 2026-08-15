# 🎮 GUIA DE INTEGRAÇÃO - Sistemas de Pets e Títulos

## 📦 Arquivos Novos

1. **pet-system.js** - Sistema completo de pets/companheiros
2. **title-badge-system.js** - Sistema de títulos e badges

---

## 🔧 INTEGRAÇÃO PASSO A PASSO

### 1. Adicionar Scripts ao index.html

```html
<!-- Antes do fechamento de </body>, após os outros scripts -->
<script src="title-badge-system.js"></script>
<script src="pet-system.js"></script>
```

---

### 2. Modificar game.js

#### 2.1 Inicialização

Adicione após a inicialização dos outros sistemas:

```javascript
// ================= INICIALIZAÇÃO =================
// ... código existente ...

// ✅ Inicializar sistema de títulos e badges
if (typeof TitleBadgeSystem === 'function') {
  window.titleBadgeSystem = new TitleBadgeSystem();
  titleBadgeSystem.load();
  console.log('✅ Sistema de títulos inicializado');
}

// ✅ Inicializar sistema de pets
if (typeof PetSystem === 'function') {
  window.petSystem = new PetSystem();
  petSystem.load();
  console.log('✅ Sistema de pets inicializado');
  
  // Desbloquear peixe piloto de graça (starter pet)
  if (!petSystem.ownedPets.pilot_fish) {
    petSystem.unlockPet('pilot_fish');
  }
}
```

#### 2.2 Loop de Update

Adicione no `update(dt)`:

```javascript
function update(dt) {
  // ... código existente ...
  
  // ✅ Atualizar pet
  if (typeof petSystem !== 'undefined' && petSystem.petInstance && player) {
    petSystem.update(dt, player);
  }
  
  // ✅ Atualizar ovos em eclosão
  if (typeof petSystem !== 'undefined') {
    petSystem.updateEggs(dt);
  }
  
  // ✅ Atualizar estatísticas de títulos
  if (typeof titleBadgeSystem !== 'undefined') {
    titleBadgeSystem.updateStatistics('survivalTime', dt);
    titleBadgeSystem.updateStatistics('playTime', dt);
  }
  
  // ... resto do código ...
}
```

#### 2.3 Função de Draw

Adicione no `draw()`:

```javascript
function draw() {
  // ... código de desenho existente ...
  
  // ✅ Desenhar pet
  if (typeof petSystem !== 'undefined' && petSystem.petInstance) {
    petSystem.draw(ctx, camera);
  }
  
  // ✅ Desenhar título equipado (HUD)
  if (typeof titleBadgeSystem !== 'undefined') {
    drawPlayerTitle();
  }
  
  // ✅ Desenhar badges equipados (HUD)
  if (typeof titleBadgeSystem !== 'undefined') {
    drawPlayerBadges();
  }
  
  // ... resto do código ...
}
```

---

### 3. Modificar Funções de Eventos

#### 3.1 Quando Player Come Peixe (eatFish)

```javascript
function eatFish(f) {
  // ... código existente ...
  
  // ✅ Pet ganha XP (10% do XP do peixe)
  if (typeof petSystem !== 'undefined' && petSystem.activePet) {
    petSystem.addPetXP(f.xp * 0.1);
  }
  
  // ✅ Atualizar estatísticas de títulos
  if (typeof titleBadgeSystem !== 'undefined') {
    titleBadgeSystem.updateStatistics('fishKilled', 1);
  }
  
  // ... resto do código ...
}
```

#### 3.2 Quando Player Recebe Dano (takeDamage no player.js)

```javascript
takeDamage(damage) {
  // ✅ Pet pode bloquear o dano
  if (typeof petSystem !== 'undefined' && petSystem.canBlockDamage()) {
    // Efeito visual de bloqueio
    if (typeof createParticles === 'function') {
      createParticles(this.x, this.y, '#00FFFF', 20);
    }
    return; // Dano bloqueado!
  }
  
  // ... código existente de takeDamage ...
  
  // ✅ Atualizar estatística de dano recebido
  if (typeof titleBadgeSystem !== 'undefined') {
    titleBadgeSystem.updateStatistics('damageTaken', damage);
  }
}
```

#### 3.3 Quando Level Up

```javascript
function checkLevelUp() {
  while (xp >= xpToNext) {
    // ... código existente ...
    
    // ✅ Registrar level alcançado no tempo
    if (typeof titleBadgeSystem !== 'undefined') {
      titleBadgeSystem.updateStatistics('levelReached', level);
    }
  }
}
```

#### 3.4 Quando Boss é Derrotado

```javascript
// Na função que derrota boss
function defeatBoss(bossId) {
  // ... código existente ...
  
  // ✅ Registrar boss derrotado
  if (typeof titleBadgeSystem !== 'undefined') {
    titleBadgeSystem.updateStatistics('bossDefeated', bossId);
  }
}
```

#### 3.5 Quando Combo Aumenta

```javascript
// Quando combo aumenta
if (combo > missionStats.comboReached) {
  missionStats.comboReached = combo;
  
  // ✅ Atualizar max combo
  if (typeof titleBadgeSystem !== 'undefined') {
    titleBadgeSystem.updateStatistics('maxCombo', combo);
  }
}
```

#### 3.6 Quando Ganha Moedas/Gemas

```javascript
// Ao ganhar moedas
coins += earnedCoins;

if (typeof titleBadgeSystem !== 'undefined') {
  titleBadgeSystem.updateStatistics('totalCoins', earnedCoins);
}

// Ao ganhar gemas
gems += earnedGems;

if (typeof titleBadgeSystem !== 'undefined') {
  titleBadgeSystem.updateStatistics('totalGems', earnedGems);
}
```

---

### 4. Adicionar Funções de UI

Adicione estas funções no `ui.js` ou no final do `game.js`:

```javascript
// ========== UI DE TÍTULOS E BADGES ==========

function drawPlayerTitle() {
  const title = titleBadgeSystem.getEquippedTitle();
  if (!title) return;
  
  ctx.save();
  
  // Desenhar no topo da tela
  const x = canvas.width / (2 * dpr);
  const y = 30;
  
  // Background do título
  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.fillRect(x - 100, y - 15, 200, 30);
  
  // Border colorido
  ctx.strokeStyle = title.color;
  ctx.lineWidth = 2;
  ctx.strokeRect(x - 100, y - 15, 200, 30);
  
  // Texto do título
  ctx.font = 'bold 16px Arial';
  ctx.fillStyle = title.color;
  ctx.textAlign = 'center';
  ctx.fillText(title.name, x, y + 5);
  
  ctx.restore();
}

function drawPlayerBadges() {
  const badges = titleBadgeSystem.getEquippedBadges();
  if (badges.length === 0) return;
  
  ctx.save();
  
  const startX = 20;
  let y = 100;
  
  badges.forEach((badge, index) => {
    // Background do badge
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(startX, y, 40, 40);
    
    // Border
    const rarityColors = {
      common: '#808080',
      uncommon: '#00FF00',
      rare: '#0080FF',
      epic: '#9370DB',
      legendary: '#FFD700'
    };
    
    ctx.strokeStyle = rarityColors[badge.rarity] || '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.strokeRect(startX, y, 40, 40);
    
    // Ícone do badge
    ctx.font = '24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(badge.icon, startX + 20, y + 28);
    
    y += 50;
  });
  
  ctx.restore();
}

// ========== MENU DE PETS ==========

function drawPetMenu() {
  // Menu para selecionar e equipar pets
  ctx.save();
  
  // Background
  ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
  ctx.fillRect(0, 0, canvas.width / dpr, canvas.height / dpr);
  
  // Título
  ctx.fillStyle = '#FFD700';
  ctx.font = 'bold 48px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('PETS', canvas.width / (2 * dpr), 60);
  
  // Lista de pets
  const ownedPets = Object.keys(petSystem.ownedPets);
  const startX = 100;
  let y = 150;
  
  ownedPets.forEach(petId => {
    const petType = petSystem.petTypes[petId];
    const petData = petSystem.ownedPets[petId];
    const isEquipped = petSystem.activePet === petId;
    
    // Card do pet
    ctx.fillStyle = isEquipped ? 'rgba(50, 150, 50, 0.8)' : 'rgba(50, 50, 50, 0.8)';
    ctx.fillRect(startX, y, 300, 80);
    
    ctx.strokeStyle = isEquipped ? '#00FF00' : '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.strokeRect(startX, y, 300, 80);
    
    // Ícone
    ctx.font = '32px Arial';
    ctx.fillText(petType.icon, startX + 40, y + 50);
    
    // Nome e nível
    ctx.font = 'bold 20px Arial';
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'left';
    ctx.fillText(petType.name, startX + 80, y + 30);
    
    ctx.font = '16px Arial';
    ctx.fillStyle = '#FFD700';
    ctx.fillText(`Nível ${petData.level}`, startX + 80, y + 55);
    
    // Barra de XP
    const xpNeeded = petSystem.getXPNeeded(petData.level);
    const xpPercent = petData.xp / xpNeeded;
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(startX + 80, y + 60, 200, 10);
    
    ctx.fillStyle = '#00FFFF';
    ctx.fillRect(startX + 80, y + 60, 200 * xpPercent, 10);
    
    y += 100;
  });
  
  // Instruções
  ctx.font = '16px Arial';
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'center';
  ctx.fillText('Clique em um pet para equipar | ESC para fechar', canvas.width / (2 * dpr), canvas.height / dpr - 30);
  
  ctx.restore();
}

// ========== LOJA DE OVOS ==========

function drawEggShop() {
  ctx.save();
  
  // Background
  ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
  ctx.fillRect(0, 0, canvas.width / dpr, canvas.height / dpr);
  
  // Título
  ctx.fillStyle = '#FFD700';
  ctx.font = 'bold 48px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('🥚 LOJA DE OVOS', canvas.width / (2 * dpr), 60);
  
  // Lista de ovos
  const eggs = Object.values(petSystem.eggs);
  const startX = 100;
  let y = 150;
  
  eggs.forEach(egg => {
    // Card do ovo
    ctx.fillStyle = 'rgba(70, 50, 100, 0.8)';
    ctx.fillRect(startX, y, 400, 100);
    
    ctx.strokeStyle = '#9370DB';
    ctx.lineWidth = 2;
    ctx.strokeRect(startX, y, 400, 100);
    
    // Nome
    ctx.font = 'bold 24px Arial';
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'left';
    ctx.fillText(egg.name, startX + 20, y + 35);
    
    // Preço
    ctx.font = '20px Arial';
    ctx.fillStyle = '#FFD700';
    ctx.fillText(`💰 ${egg.price}`, startX + 20, y + 65);
    
    // Tempo de eclosão
    ctx.fillStyle = '#AAAAAA';
    const hatchText = egg.hatchTime === 0 ? 'Instantâneo' : `${egg.hatchTime / 60}min`;
    ctx.fillText(`⏱️ ${hatchText}`, startX + 150, y + 65);
    
    // Botão de compra
    ctx.fillStyle = coins >= egg.price ? '#00FF00' : '#666666';
    ctx.fillRect(startX + 300, y + 40, 80, 40);
    
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('COMPRAR', startX + 340, y + 65);
    
    y += 120;
  });
  
  ctx.restore();
}
```

---

## 🎮 FUNCIONALIDADES IMPLEMENTADAS

### Sistema de Títulos

#### Títulos Disponíveis:
- **Por Conquistas:**
  - O Imortal (30min sem morrer)
  - Genocida (1000 peixes)
  - Caçador de Lendas (todos os bosses)
  - Colecionador (todas as skins)

- **Por Rank:**
  - Iniciante (1-5)
  - Tubarão (6-15)
  - Predador (16-30)
  - Apex (31-50)
  - Deus dos Mares (50+)

- **Especiais:**
  - Speedrunner (nv25 em <30min)
  - Pacifista (nv10 sem matar inimigos)
  - Tanque (10000 dano recebido)
  - Mestre do Combo (combo 50x)
  - Milionário (1M moedas)
  - Caçador de Tesouros (10K gemas)

#### Badges Disponíveis:
- Primeira Morte 💀
- Centurion 💯
- Veterano ⭐
- Matador de Boss 👑
- Captura Lendária 🌟
- Demônio da Velocidade ⚡
- Badge Imortal 🛡️
- Prestige I 🔱
- Evolução Completa 🦈
- Sortudo 🍀
- Explorador 🗺️
- Run Perfeita 💎

### Sistema de Pets

#### 6 Pets Únicos:

1. **🐠 Peixe Piloto**
   - Coleta moedas automaticamente
   - Raio aumenta com nível

2. **🦀 Caranguejo Ermitão**
   - Bloqueia 1 ataque a cada 10s
   - Cooldown reduz com nível

3. **🐡 Peixe Lanterna**
   - Ilumina áreas escuras
   - Raio de luz aumenta

4. **🦈 Tubarão Bebê**
   - Ataca inimigos pequenos
   - Dano aumenta com nível

5. **🐙 Polvo Ajudante**
   - Puxa peixes distantes
   - Range aumenta com nível

6. **⭐ Estrela do Mar**
   - Regenera HP continuamente
   - Cura veneno

#### Sistema de Ovos:
- Ovo Comum (100 moedas)
- Ovo Incomum (500 moedas)
- Ovo Raro (2000 moedas)
- Ovo Épico (5000 moedas)
- Ovo Misterioso (10000 moedas)

#### Progressão:
- Pets ganham 10% do XP do player
- Máximo nível 10
- Evoluem nos níveis 5 e 10
- Stats melhoram com cada nível

---

## 🎨 COMANDOS DE TESTE (Console do Navegador)

```javascript
// ========== TÍTULOS ==========

// Desbloquear título
titleBadgeSystem.unlockTitle('genocidal');

// Equipar título
titleBadgeSystem.equipTitle('sea_god');

// Ver títulos desbloqueados
console.log(titleBadgeSystem.getUnlockedTitles());

// Equipar badge
titleBadgeSystem.equipBadge('boss_slayer');

// ========== PETS ==========

// Desbloquear pet
petSystem.unlockPet('baby_shark');

// Equipar pet
petSystem.equipPet('baby_shark');

// Dar XP ao pet
petSystem.addPetXP(100);

// Comprar ovo
petSystem.buyEgg('rare_egg');

// Ver pets desbloqueados
console.log(petSystem.ownedPets);

// ========== DEBUGGING ==========

// Forçar unlock de tudo (teste)
Object.keys(titleBadgeSystem.titles).forEach(id => {
  titleBadgeSystem.titles[id].unlocked = true;
});

Object.keys(petSystem.petTypes).forEach(id => {
  petSystem.unlockPet(id);
});
```

---

## ✅ CHECKLIST DE INTEGRAÇÃO

- [ ] Adicionar scripts ao index.html
- [ ] Inicializar sistemas no game.js
- [ ] Adicionar updates no loop
- [ ] Integrar com eatFish
- [ ] Integrar com takeDamage
- [ ] Integrar com levelUp
- [ ] Adicionar funções de UI
- [ ] Testar títulos desbloqueando
- [ ] Testar badges desbloqueando
- [ ] Testar pets seguindo player
- [ ] Testar habilidades dos pets
- [ ] Testar sistema de ovos
- [ ] Testar save/load

---

## 🎉 PRONTO PARA USAR!

Ambos os sistemas estão completamente funcionais e prontos para integração.

**Recursos:**
- ✅ Sistema completo de títulos (15+)
- ✅ Sistema de badges (12+)
- ✅ 6 pets únicos com habilidades
- ✅ Sistema de ovos e eclosão
- ✅ Progressão de pets (XP e levels)
- ✅ Evolução de pets
- ✅ Save/Load automático
- ✅ Integração com sistemas existentes

**Benefícios:**
- 🎯 Objetivos de longo prazo
- 🏆 Conquistas visíveis
- 🐠 Companhia no jogo
- ⚡ Gameplay auxiliado
- 🎨 Personalização do jogador
- 📊 Tracking de estatísticas

Boa sorte com a integração! 🎮🦈
