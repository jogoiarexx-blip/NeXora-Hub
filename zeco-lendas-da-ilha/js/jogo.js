// =============================================================
// Zeco e a Ilha das Gemas — Motor do Jogo (JS principal)
// Referências DOM, entrada (teclado/toque), física, colisão,
// partículas, desenho e o loop principal.
// Depende de: fases.js (levels) — carregar ANTES deste arquivo.
// =============================================================

// ---------- Referências DOM, tamanho da tela e entrada ----------
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
// Tamanho lógico do jogo (o que a lógica/desenho sempre usa). A resolução real
// do canvas é multiplicada pelo devicePixelRatio para não ficar borrado em
// telas HiDPI (celulares, retina), e o contexto é escalado de volta para que
// todo o resto do código continue desenhando em coordenadas 800x450 normais.
const W = 800, H = 450;
const DPR = window.devicePixelRatio || 1;
const wrap = document.getElementById('wrap');

// Preferência de "menos movimento" do sistema: usada para suavizar tremidas
// de câmera e reduzir um pouco a quantidade de partículas.
const REDUCED_MOTION = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Ajusta o tamanho do quadro do jogo para caber inteiro na tela (sem cortar),
// respeitando a proporção 800x450, tanto na largura quanto na altura disponíveis.
// Em telas de PC (bem mais largas que altas) o jogo antes ficava travado num
// máximo de 800px de largura, o que sobrava um monte de tela vazia ao redor
// e fazia o jogo parecer pequeno demais nesses monitores. Agora o limite
// escala com a altura disponível da janela, então em monitores grandes o
// jogo ocupa a tela de verdade, igual já acontecia no celular.
function fitWrap() {
  const aspect = 800 / 450;
  const maxH = window.innerHeight * 0.95;
  let h = maxH;
  let w = h * aspect;
  if (w > window.innerWidth * 0.97) {
    w = window.innerWidth * 0.97;
    h = w / aspect;
  }
  wrap.style.width = w + 'px';
  wrap.style.height = h + 'px';

  // Redimensiona o buffer real do canvas para bater com o tamanho exibido
  // (multiplicado pelo devicePixelRatio), em vez de deixá-lo fixo em 800x450
  // e esticado via CSS — isso é o que mantinha a imagem nítida antes, mas
  // borrava o jogo ao exibi-lo maior que 800px em telas de PC.
  canvas.width = Math.round(w * DPR);
  canvas.height = Math.round(h * DPR);
  ctx.setTransform(canvas.width / W, 0, 0, canvas.height / H, 0, 0);
}
fitWrap();
window.addEventListener('resize', fitWrap);
window.addEventListener('orientationchange', () => setTimeout(fitWrap, 150));

const scoreDisplay = document.getElementById('scoreDisplay');
const livesDisplay = document.getElementById('livesDisplay');
const gemProgressDisplay = document.getElementById('gemProgressDisplay');
const objectiveDisplay = document.getElementById('objectiveDisplay');
const levelDisplay = document.getElementById('levelDisplay');
const powerupStatus = document.getElementById('powerupStatus');
const muteBtn = document.getElementById('muteBtn');
const bestScoreDisplay = document.getElementById('bestScoreDisplay');
const overlay = document.getElementById('overlay');
const screenMenu = document.getElementById('screenMenu');
const screenHowTo = document.getElementById('screenHowTo');
const screenEnd = document.getElementById('screenEnd');
const screenLevelSelect = document.getElementById('screenLevelSelect');
const levelGrid = document.getElementById('levelGrid');
const overlayTitle = document.getElementById('overlayTitle');
const overlayText = document.getElementById('overlayText');
const playBtn = document.getElementById('playBtn');
const levelSelectBtn = document.getElementById('levelSelectBtn');
const levelSelectBackBtn = document.getElementById('levelSelectBackBtn');
const howToBtn = document.getElementById('howToBtn');
const howToBackBtn = document.getElementById('howToBackBtn');
const startBtn = document.getElementById('startBtn');
const menuBtn = document.getElementById('menuBtn');

const GRAVITY = 0.6;
const FRICTION = 0.82;
const MOVE_SPEED = 0.9;
const MAX_SPEED = 5.5;
const JUMP_FORCE = -12.5;
const STAR_FRAMES = 360;   // 6s a 60fps
const WING_FRAMES = 480;   // 8s a 60fps

let keys = {};
document.addEventListener('keydown', e => {
  keys[e.key.toLowerCase()] = true;
  if ([' ','arrowup','arrowdown','arrowleft','arrowright'].includes(e.key.toLowerCase())) e.preventDefault();
  const k = e.key.toLowerCase();
  if ((k === 'p' || k === 'escape') && state.running) {
    state.paused = !state.paused;
  }
});
document.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);

// ---------- Touch controls ----------
function bindTouchBtn(el, keyName) {
  const press = ev => { ev.preventDefault(); keys[keyName] = true; el.classList.add('active'); };
  const release = ev => { ev.preventDefault(); keys[keyName] = false; el.classList.remove('active'); };
  el.addEventListener('touchstart', press, {passive:false});
  el.addEventListener('touchend', release, {passive:false});
  el.addEventListener('touchcancel', release, {passive:false});
  el.addEventListener('mousedown', press);
  el.addEventListener('mouseup', release);
  el.addEventListener('mouseleave', release);
  // Suporte a teclado/leitor de tela, já que os botões têm role="button"
  el.addEventListener('keydown', ev => {
    if (ev.key === ' ' || ev.key === 'Enter') { ev.preventDefault(); press(ev); }
  });
  el.addEventListener('keyup', ev => {
    if (ev.key === ' ' || ev.key === 'Enter') { ev.preventDefault(); release(ev); }
  });
}
bindTouchBtn(document.getElementById('leftBtn'), 'arrowleft');
bindTouchBtn(document.getElementById('rightBtn'), 'arrowright');
bindTouchBtn(document.getElementById('jumpBtn'), ' ');


// ---------- Tela cheia + travar em paisagem ao iniciar ----------
function goFullscreenLandscape() {
  const el = document.documentElement;
  const req = el.requestFullscreen || el.webkitRequestFullscreen || el.msRequestFullscreen;
  if (req) {
    try { req.call(el).catch(() => {}); } catch (e) {}
  }
  if (screen.orientation && screen.orientation.lock) {
    screen.orientation.lock('landscape').catch(() => {});
  }
  setTimeout(fitWrap, 200);
}

// ---------- Partículas ----------
// =====================================================================
// PARTÍCULAS
// =====================================================================
let particles = [];
function spawnParticles(x, y, count, opts={}) {
  const {
    color='#ffd166', speed=3, life=30, gravity=0.15, size=3
  } = opts;
  if (REDUCED_MOTION) count = Math.ceil(count * 0.5);
  for (let i=0;i<count;i++) {
    const ang = Math.random()*Math.PI*2;
    const spd = (0.4 + Math.random()*0.6) * speed;
    particles.push({
      x, y,
      vx: Math.cos(ang)*spd,
      vy: Math.sin(ang)*spd - (opts.up ? 2 : 0),
      life, maxLife: life,
      color, size: size*(0.6+Math.random()*0.8),
      gravity
    });
  }
}
function updateParticles() {
  for (let i=particles.length-1;i>=0;i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy += p.gravity;
    p.vx *= 0.96;
    p.life--;
    if (p.life <= 0) particles.splice(i,1);
  }
}
function drawParticles() {
  for (const p of particles) {
    ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI*2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

// ---------- Estado do jogo, jogador e carregamento de fase ----------
let state = {
  running: false,
  paused: false,
  levelIndex: 0,
  score: 0,
  bestScore: 0,
  lives: 3,
  gemStreak: 0,
  objectives: 0,
  camX: 0,
  shake: {x:0, y:0, timer:0},
  levelProgress: levels.map(() => ({completed:false, objective:false})),
};

// ---------- Progresso salvo (localStorage) ----------
// Guarda quais fases/objetivos já foram concluídos e a maior pontuação já
// alcançada, para não perder tudo ao fechar a aba ou dar F5.
const SAVE_KEY = 'zeco_save_v1';

function saveProgress() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({
      levelProgress: state.levelProgress,
      bestScore: state.bestScore,
    }));
  } catch (e) { /* localStorage indisponível (modo privado, etc.) — ignora */ }
}

function loadProgress() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);
    if (Array.isArray(data.levelProgress) && data.levelProgress.length === levels.length) {
      state.levelProgress = data.levelProgress;
    }
    if (typeof data.bestScore === 'number') state.bestScore = data.bestScore;
  } catch (e) { /* dados corrompidos — ignora e começa do zero */ }
  updateBestScoreDisplay();
}

function updateBestScoreDisplay() {
  if (state.bestScore > 0) {
    bestScoreDisplay.textContent = '🏆 Recorde: ' + state.bestScore;
    bestScoreDisplay.classList.remove('hidden');
  } else {
    bestScoreDisplay.classList.add('hidden');
  }
}

let player, gems, enemies, portalX, worldWidth, groundY, platforms, spikes, powerups, boxes, silverGem, checkpoints;
let jumpKeyPrev = false;
let lastCheckpoint = null; // {x,y} do último checkpoint tocado na fase atual, ou null
let riddenPlatform = null; // plataforma móvel em que o jogador está em pé no frame atual, ou null

// Relógio de jogo: ao contrário de Date.now(), só avança enquanto o jogo
// não está pausado. Usado para toda animação/física que depende de tempo
// (plataformas móveis, efeitos visuais), para que uma pausa longa não faça
// nada "teleportar" para onde estaria se o tempo nunca tivesse parado.
let gameClock = 0;
let lastFrameTime = null;
function tickGameClock() {
  const now = Date.now();
  if (lastFrameTime === null) lastFrameTime = now;
  const dt = (now - lastFrameTime) / 1000;
  lastFrameTime = now;
  if (!state.paused && state.running) gameClock += dt;
  return gameClock;
}

function loadLevel(idx) {
  const lvl = levels[idx];
  groundY = lvl.groundY;
  platforms = lvl.platforms.map(p => ({...p, baseX:p.x, baseY:p.y, dx:0, dy:0}));
  gems = lvl.gems.map(g => ({...g, taken:false}));
  enemies = lvl.enemies.map(e => ({...e, alive:true, x:e.x}));
  spikes = lvl.spikes.map(s => ({...s}));
  boxes = lvl.boxes.map(b => ({...b, broken:false}));
  powerups = lvl.powerups.map(p => ({...p, taken:false}));
  silverGem = lvl.silverGem ? {...lvl.silverGem, taken:false} : null;
  checkpoints = (lvl.checkpoints || []).map(c => ({...c, active:false}));
  portalX = lvl.portalX;
  worldWidth = lvl.worldWidth;
  lastCheckpoint = null;
  player = {
    x: lvl.playerStart.x,
    y: lvl.playerStart.y,
    w: 34, h: 40,
    vx: 0, vy: 0,
    onGround: false,
    facing: 1,
    invuln: 0,
    squash: 1,
    starTimer: 0,
    wingTimer: 0,
    shield: false,
    doubleJumpUsed: false,
    walkPhase: 0,
    dustTimer: 0,
  };
  particles = [];
  state.camX = 0;
  state.paused = false;
  riddenPlatform = null;
  levelDisplay.textContent = 'Fase ' + (idx+1);
  updatePowerupHUD();
}

function resetGame(startIndex) {
  state.score = 0;
  state.lives = 3;
  state.gemStreak = 0;
  state.objectives = 0;
  state.levelIndex = startIndex || 0;
  loadLevel(state.levelIndex);
  updateHUD();
}

function updateHUD() {
  scoreDisplay.textContent = '💎 ' + state.score;
  livesDisplay.textContent = '❤️ ' + state.lives;
  gemProgressDisplay.textContent = '💗 ' + state.gemStreak + '/100';
  objectiveDisplay.textContent = '🥈 ' + state.objectives + '/' + levels.length;
}

function updatePowerupHUD() {
  let html = '';
  if (player.starTimer > 0) html += '<span>⭐</span>';
  if (player.wingTimer > 0) html += '<span>🪽</span>';
  if (player.shield) html += '<span>🛡️</span>';
  powerupStatus.innerHTML = html;
}

// ---------- Colisão, física e regras do jogo ----------
// ---------- Collision helpers ----------
function rectsOverlap(a,b) {
  return a.x < b.x+b.w && a.x+a.w > b.x && a.y < b.y+b.h && a.y+a.h > b.y;
}

// Todos os retângulos sólidos: chão, plataformas e caixas ainda inteiras.
// Chamada uma única vez por frame em update() (o resultado é reaproveitado
// na resolução de colisão X e Y) para não remontar a lista duas vezes.
function collidableRects() {
  const rects = [{x:-50,y:groundY,w:worldWidth+100,h:60, type:'ground'}];
  for (const p of platforms) rects.push({x:p.x,y:p.y,w:p.w,h:p.h, type:'platform', ref:p});
  for (const b of boxes) if (!b.broken) rects.push({x:b.x,y:b.y,w:b.w,h:b.h, type:'box', ref:b});
  return rects;
}

// Move as plataformas com propriedade `move` (vaivém senoidal) e guarda o
// deslocamento (dx/dy) deste frame, usado para "carregar" o jogador junto.
function updateMovingPlatforms() {
  const t = gameClock;
  for (const p of platforms) {
    if (!p.move) { p.dx = 0; p.dy = 0; continue; }
    const prevX = p.x, prevY = p.y;
    const offset = Math.sin(t * p.move.speed) * p.move.range;
    if (p.move.axis === 'y') p.y = p.baseY + offset;
    else p.x = p.baseX + offset;
    p.dx = p.x - prevX;
    p.dy = p.y - prevY;
  }
}

// Fase atual pode ter zonas de vento (empurram o jogador) e de gelo
// (reduzem o atrito no chão), definidas em fases.js.
function currentWindForce(playerBox) {
  const lvl = levels[state.levelIndex];
  if (!lvl.windZones) return 0;
  let force = 0;
  for (const wz of lvl.windZones) {
    if (rectsOverlap(playerBox, wz)) force += wz.strength;
  }
  return force;
}
function isOnIce(playerBox) {
  const lvl = levels[state.levelIndex];
  if (!lvl.iceZones) return false;
  for (const iz of lvl.iceZones) {
    if (playerBox.x + playerBox.w > iz.x && playerBox.x < iz.x + iz.w) return true;
  }
  return false;
}

function breakBox(box) {
  if (box.broken) return;
  box.broken = true;
  playBreak();
  spawnParticles(box.x+box.w/2, box.y+box.h/2, 12, {color:'#a9662f', speed:3.5, life:24, gravity:0.25, size:3});
  if (box.contents === 'coin') {
    state.score += 15;
    playCoin();
    spawnParticles(box.x+box.w/2, box.y, 8, {color:'#ffd166', speed:2.5, life:20, gravity:-0.02, size:2.5});
    updateHUD();
  } else if (box.contents && box.contents.startsWith('powerup:')) {
    const type = box.contents.split(':')[1];
    activatePowerUp(type);
    playPowerUp();
    const colorMap = {star:'#ffd166', wing:'#a0e8ff', shield:'#8fe388'};
    spawnParticles(box.x+box.w/2, box.y, 14, {color: colorMap[type], speed:3, life:26, gravity:-0.02, size:3});
    updatePowerupHUD();
  }
}

function update() {
  if (!state.running || state.paused) return;

  updateMovingPlatforms();

  // Se o jogador estava em pé sobre uma plataforma móvel no fim do frame
  // anterior, aplica o deslocamento dela ANTES de qualquer outra física deste
  // frame. Fazer isso depois (junto com a resolução de colisão) causava o
  // jogador ser "empurrado" para o lado, porque a plataforma já tinha se
  // movido para a nova posição quando a colisão horizontal era checada.
  if (riddenPlatform) {
    player.x += riddenPlatform.dx;
    if (riddenPlatform.move.axis === 'y') player.y += riddenPlatform.dy;
  }

  const effMax = player.starTimer > 0 ? MAX_SPEED * 1.6 : MAX_SPEED;

  // Horizontal input
  if (keys['a'] || keys['arrowleft']) {
    player.vx -= MOVE_SPEED;
    player.facing = -1;
  }
  if (keys['d'] || keys['arrowright']) {
    player.vx += MOVE_SPEED;
    player.facing = 1;
  }

  // Vento da fase (se houver) empurra o jogador horizontalmente
  const wind = currentWindForce(player);
  if (wind !== 0) player.vx += wind;

  // Gelo reduz bastante o atrito, deixando o personagem escorregar
  const onIce = isOnIce(player) && player.onGround;
  player.vx *= onIce ? 0.97 : FRICTION;
  if (player.vx > effMax) player.vx = effMax;
  if (player.vx < -effMax) player.vx = -effMax;

  // Jump (com pulo duplo se tiver asas)
  const jumpHeld = keys[' '] || keys['w'] || keys['arrowup'];
  if (jumpHeld && player.onGround) {
    player.vy = JUMP_FORCE;
    player.onGround = false;
    player.squash = 1.3;
    player.doubleJumpUsed = false;
    playJump(false);
    spawnParticles(player.x+player.w/2, player.y+player.h, 6, {color:'#fff', speed:2, life:16, gravity:0.05, size:2});
  } else if (jumpHeld && !jumpKeyPrev && !player.onGround && player.wingTimer > 0 && !player.doubleJumpUsed) {
    player.vy = JUMP_FORCE * 0.85;
    player.doubleJumpUsed = true;
    playJump(true);
    spawnParticles(player.x+player.w/2, player.y+player.h/2, 10, {color:'#a0e8ff', speed:3, life:20, gravity:0.05, size:2.5});
  }
  jumpKeyPrev = jumpHeld;

  player.vy += GRAVITY;
  if (player.vy > 15) player.vy = 15;

  const prevVy = player.vy;
  const prevOnGround = player.onGround;

  // Rects sólidos deste frame: montados uma única vez e reaproveitados nas
  // duas resoluções de colisão abaixo (X e Y), em vez de reconstruir a lista
  // duas vezes por frame.
  const rects = collidableRects();

  // Move X then resolve collisions
  player.x += player.vx;
  player.x = Math.max(0, Math.min(player.x, worldWidth - player.w));
  for (const r of rects) {
    if (r.type === 'box' && r.ref.broken) continue;
    if (rectsOverlap(player, r)) {
      if (player.vx > 0) player.x = r.x - player.w;
      else if (player.vx < 0) player.x = r.x + r.w;
    }
  }

  // Move Y then resolve collisions
  player.onGround = false;
  riddenPlatform = null;
  player.y += player.vy;
  for (const r of rects) {
    if (r.type === 'box' && r.ref.broken) continue;
    if (!rectsOverlap(player, r)) continue;
    if (player.vy > 0) {
      if (r.type === 'box') {
        player.y = r.y - player.h;
        breakBox(r.ref);
        player.vy = JUMP_FORCE * 0.45;
      } else {
        player.y = r.y - player.h;
        player.vy = 0;
        player.onGround = true;
        if (r.type === 'platform' && r.ref.move) riddenPlatform = r.ref;
      }
    } else if (player.vy < 0) {
      if (r.type === 'box') {
        player.y = r.y + r.h;
        breakBox(r.ref);
        player.vy = 1;
      } else {
        player.y = r.y + r.h;
        player.vy = 0;
      }
    }
  }

  // Poeira ao correr no chão
  if (player.onGround && Math.abs(player.vx) > 1.2) {
    player.dustTimer--;
    if (player.dustTimer <= 0) {
      spawnParticles(player.x + player.w/2 - player.facing*10, player.y + player.h - 2, 2,
        {color:'#e8d7b0', speed:0.8, life:18, gravity:0.05, size:2});
      player.dustTimer = 8;
    }
    player.walkPhase += Math.abs(player.vx) * 0.15;
  }

  // Poeira ao aterrissar
  if (!prevOnGround && player.onGround && prevVy > 6) {
    spawnParticles(player.x + player.w/2, player.y + player.h, 8, {color:'#e8d7b0', speed:2, life:16, gravity:0.1, size:2.5});
  }

  player.squash += (1 - player.squash) * 0.2;
  if (player.invuln > 0) player.invuln--;
  if (player.starTimer > 0) player.starTimer--;
  if (player.wingTimer > 0) player.wingTimer--;
  updatePowerupHUD();

  // Rastro de estrelinha quando invencível
  if (player.starTimer > 0 && Math.random() < 0.5) {
    spawnParticles(player.x+player.w/2, player.y+player.h/2, 1,
      {color: ['#ff5fa2','#ffd166','#7ee8fa'][Math.floor(Math.random()*3)], speed:1, life:22, gravity:-0.02, size:2.5});
  }

  updateParticles();
  if (state.shake.timer > 0) state.shake.timer--;

  // Fall off world
  if (player.y > H + 100) {
    loseLife();
    return;
  }

  // Spikes
  for (const s of spikes) {
    if (rectsOverlap(player, s) && player.invuln === 0 && player.starTimer === 0) {
      damagePlayer();
      return;
    }
  }

  // Checkpoints — tocar na bandeira salva o ponto de reaparecimento na fase
  for (const cp of checkpoints) {
    if (!cp.active) {
      const cpBox = {x:cp.x-14, y:cp.y-40, w:28, h:40};
      if (rectsOverlap(player, cpBox)) {
        cp.active = true;
        lastCheckpoint = {x:cp.x - player.w/2, y:cp.y - player.h};
        playCheckpoint();
        spawnParticles(cp.x, cp.y-20, 12, {color:'#9be8ff', speed:2.5, life:22, gravity:-0.02, size:2.5});
      }
    }
  }

  // Gems
  for (const g of gems) {
    if (!g.taken) {
      const gemBox = {x:g.x-10,y:g.y-10,w:20,h:20};
      if (rectsOverlap(player, gemBox)) {
        g.taken = true;
        state.score += 10;
        playCoin();
        spawnParticles(g.x, g.y, 8, {color:'#ff5fa2', speed:2.5, life:22, gravity:0.08, size:2.5});
        state.gemStreak++;
        if (state.gemStreak >= 100) {
          state.gemStreak -= 100;
          state.lives++;
          playExtraLife();
          spawnParticles(player.x+player.w/2, player.y+player.h/2, 24, {color:'#ff5fa2', speed:4, life:32, gravity:-0.05, size:3.5});
          triggerShake(3);
        }
        updateHUD();
      }
    }
  }

  // Gema de prata (objetivo da fase)
  if (silverGem && !silverGem.taken) {
    const sBox = {x:silverGem.x-16,y:silverGem.y-16,w:32,h:32};
    if (rectsOverlap(player, sBox)) {
      silverGem.taken = true;
      state.score += 100;
      if (!state.levelProgress[state.levelIndex].objective) state.objectives++;
      state.levelProgress[state.levelIndex].objective = true;
      saveProgress();
      playObjective();
      spawnParticles(silverGem.x, silverGem.y, 24, {color:'#e8eef2', speed:4, life:30, gravity:-0.02, size:3.5});
      triggerShake(3);
      updateHUD();
    }
  }

  // Power-ups (cristais)
  for (const pu of powerups) {
    if (!pu.taken) {
      const puBox = {x:pu.x-14,y:pu.y-14,w:28,h:28};
      if (rectsOverlap(player, puBox)) {
        pu.taken = true;
        activatePowerUp(pu.type);
        playPowerUp();
        const colorMap = {star:'#ffd166', wing:'#a0e8ff', shield:'#8fe388'};
        spawnParticles(pu.x, pu.y, 16, {color: colorMap[pu.type], speed:3.5, life:28, gravity:0.03, size:3});
        updatePowerupHUD();
      }
    }
  }

  // Enemies
  for (const e of enemies) {
    if (!e.alive) continue;
    e.x += e.dir * 1.6;
    if (e.x > e.baseX + e.range) e.dir = -1;
    if (e.x < e.baseX - e.range) e.dir = 1;

    const eBox = {x:e.x-16,y:e.y-24,w:32,h:24};
    if (rectsOverlap(player, eBox)) {
      const playerBottom = player.y + player.h;
      const stomping = player.vy > 0 && playerBottom - eBox.y < 18;
      if (stomping || player.starTimer > 0) {
        e.alive = false;
        if (stomping) player.vy = JUMP_FORCE * 0.6;
        state.score += 25;
        playStomp();
        spawnParticles(e.x, e.y-12, 10, {color:'#6b3fa0', speed:3, life:20, gravity:0.15, size:3});
        updateHUD();
      } else if (player.invuln === 0) {
        damagePlayer();
        return;
      }
    }
  }

  // Portal / win
  if (player.x + player.w > portalX) {
    nextLevel();
    return;
  }

  // Camera
  state.camX = Math.max(0, Math.min(player.x - W/2 + player.w/2, worldWidth - W));
}

function activatePowerUp(type) {
  if (type === 'star') player.starTimer = STAR_FRAMES;
  else if (type === 'wing') { player.wingTimer = WING_FRAMES; player.doubleJumpUsed = false; }
  else if (type === 'shield') player.shield = true;
}

function damagePlayer() {
  if (player.shield) {
    player.shield = false;
    player.invuln = 60;
    updatePowerupHUD();
    playHurt();
    spawnParticles(player.x+player.w/2, player.y+player.h/2, 14, {color:'#8fe388', speed:3, life:24, gravity:0.1, size:3});
    triggerShake(4);
    return;
  }
  loseLife();
}

function triggerShake(amount) {
  state.shake.timer = 12;
  state.shake.amount = amount;
}

function loseLife() {
  state.lives--;
  playHurt();
  triggerShake(6);
  spawnParticles(player.x+player.w/2, player.y+player.h/2, 14, {color:'#e63946', speed:3.5, life:26, gravity:0.1, size:3});
  updateHUD();
  if (state.lives <= 0) {
    gameOver(false);
  } else {
    // Reaparece no último checkpoint tocado nesta fase, se houver, em vez de
    // sempre voltar para o início inteiro da fase.
    const respawn = lastCheckpoint || levels[state.levelIndex].playerStart;
    player.x = respawn.x;
    player.y = respawn.y;
    player.vx = 0; player.vy = 0;
    player.invuln = 60;
    riddenPlatform = null; // evita aplicar o deslocamento da plataforma antiga logo após o respawn
  }
}

function nextLevel() {
  const finishedIndex = state.levelIndex;
  state.levelProgress[finishedIndex].completed = true;
  saveProgress();
  playWin();
  triggerShake(3);
  spawnParticles(player.x + player.w/2, player.y + player.h/2, 22, {color:'#ffd166', speed:4, life:34, gravity:-0.03, size:3.5});

  if (finishedIndex + 1 >= levels.length) {
    // Última fase concluída: mostra a tela de vitória
    gameOver(true);
    return;
  }

  // Ao terminar uma fase (que não seja a última), leva para o seletor de fases
  // em vez de carregar a próxima automaticamente.
  state.running = false;
  openLevelSelect({ continueRun: true, justCompletedIndex: finishedIndex });
}

function gameOver(won) {
  state.running = false;
  if (state.score > state.bestScore) state.bestScore = state.score;
  saveProgress();
  updateBestScoreDisplay();
  overlay.classList.remove('hidden');
  screenMenu.classList.add('hidden');
  screenHowTo.classList.add('hidden');
  screenLevelSelect.classList.add('hidden');
  screenEnd.classList.remove('hidden');
  if (won) {
    playWin();
    overlayTitle.textContent = '🏆 Você venceu!';
    overlayText.textContent = 'Zeco recuperou todas as gemas e salvou a ilha! Pontuação final: ' + state.score;
    startBtn.textContent = 'Jogar Novamente';
  } else {
    playGameOver();
    overlayTitle.textContent = '💀 Fim de Jogo';
    overlayText.textContent = 'O Barão Sombra venceu desta vez... Pontuação final: ' + state.score;
    startBtn.textContent = 'Tentar Novamente';
  }
}

// ---------- Desenho ----------
// ---------- Drawing ----------
// Paletas por cenário/tema de fase. 'ilha' é o visual original (dia); os
// demais são usados pelas fases novas para dar uma cara diferente a cada uma.
const THEMES = {
  ilha:   { skyTop:'#7ec8e3', skyBot:'#c9e8d8', hill:'#8fc99b', ground:'#8c5a2b', grass:'#4caf50', grassDark:'#3f9c4a', sun:true },
  gelo:   { skyTop:'#8fb8e8', skyBot:'#dbeeff', hill:'#c7dff0', ground:'#7f8fa6', grass:'#eaf6ff', grassDark:'#cfe9ff', sun:true },
  vento:  { skyTop:'#6fa8c9', skyBot:'#d7ece0', hill:'#7fb08f', ground:'#8c5a2b', grass:'#59b06a', grassDark:'#3f9c4a', sun:true },
  noite:  { skyTop:'#1b1140', skyBot:'#3a2a63', hill:'#241a45', ground:'#3a2c55', grass:'#5a3f86', grassDark:'#46316b', sun:false },
};
function currentTheme() {
  return THEMES[levels[state.levelIndex].theme || 'ilha'];
}

function drawBackground() {
  const theme = currentTheme();
  const grad = ctx.createLinearGradient(0,0,0,H);
  grad.addColorStop(0, theme.skyTop);
  grad.addColorStop(1, theme.skyBot);
  ctx.fillStyle = grad;
  ctx.fillRect(0,0,W,H);

  if (theme.sun) {
    // sol
    const sunGrad = ctx.createRadialGradient(680,70,5,680,70,70);
    sunGrad.addColorStop(0,'rgba(255,244,190,0.95)');
    sunGrad.addColorStop(1,'rgba(255,244,190,0)');
    ctx.fillStyle = sunGrad;
    ctx.beginPath();
    ctx.arc(680,70,70,0,Math.PI*2);
    ctx.fill();
    ctx.fillStyle = '#fff3b0';
    ctx.beginPath();
    ctx.arc(680,70,26,0,Math.PI*2);
    ctx.fill();
  } else {
    // lua + estrelas (cenário noturno)
    const moonGrad = ctx.createRadialGradient(680,70,5,680,70,55);
    moonGrad.addColorStop(0,'rgba(230,230,255,0.9)');
    moonGrad.addColorStop(1,'rgba(230,230,255,0)');
    ctx.fillStyle = moonGrad;
    ctx.beginPath(); ctx.arc(680,70,55,0,Math.PI*2); ctx.fill();
    ctx.fillStyle = '#f4f4ff';
    ctx.beginPath(); ctx.arc(680,70,22,0,Math.PI*2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    for (let i=0;i<40;i++) {
      const sx = (i*97) % W;
      const sy = (i*53) % 220;
      const tw = 0.5 + 0.5*Math.sin((gameClock*1000)/500 + i);
      ctx.globalAlpha = 0.3 + tw*0.5;
      ctx.fillRect(sx, sy, 2, 2);
    }
    ctx.globalAlpha = 1;
  }

  // pássaros (só de dia)
  if (theme.sun) {
    ctx.strokeStyle = 'rgba(60,40,70,0.5)';
    ctx.lineWidth = 2;
    const t = (gameClock*1000)/1000;
    for (let i=0;i<3;i++) {
      const bx = ((t*30 + i*180) % (W+100)) - 50;
      const by = 50 + i*22 + Math.sin(t*2+i)*5;
      ctx.beginPath();
      ctx.moveTo(bx-8,by); ctx.quadraticCurveTo(bx-4,by-6,bx,by);
      ctx.quadraticCurveTo(bx+4,by-6,bx+8,by);
      ctx.stroke();
    }
  }

  // nuvens parallax
  ctx.save();
  ctx.translate(-state.camX * 0.3, 0);
  ctx.fillStyle = theme.sun ? 'rgba(255,255,255,0.8)' : 'rgba(180,180,220,0.25)';
  for (let i=0;i<16;i++) {
    const cx = i*260 + 80;
    ctx.beginPath();
    ctx.ellipse(cx,80,40,20,0,0,Math.PI*2);
    ctx.ellipse(cx+30,70,30,18,0,0,Math.PI*2);
    ctx.fill();
  }
  ctx.restore();

  // colinas + coqueiros parallax
  ctx.save();
  ctx.translate(-state.camX * 0.6, 0);
  ctx.fillStyle = theme.hill;
  for (let i=0;i<20;i++) {
    const hx = i*220;
    ctx.beginPath();
    ctx.moveTo(hx, H);
    ctx.quadraticCurveTo(hx+110, H-140, hx+220, H);
    ctx.fill();
  }
  for (let i=0;i<14;i++) {
    const px = i*300 + 150;
    const py = H-150;
    ctx.strokeStyle = theme.sun ? '#6b4226' : '#2b2040';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(px, py+70);
    ctx.quadraticCurveTo(px+10, py+30, px+4, py);
    ctx.stroke();
    ctx.fillStyle = theme.sun ? '#4a9d5c' : '#4a3d78';
    for (let j=0;j<5;j++) {
      const ang = (j/5)*Math.PI*2;
      ctx.beginPath();
      ctx.ellipse(px+4+Math.cos(ang)*14, py+Math.sin(ang)*8, 14, 6, ang, 0, Math.PI*2);
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawGround() {
  ctx.save();
  ctx.translate(-state.camX, 0);
  const theme = currentTheme();

  ctx.fillStyle = theme.ground;
  ctx.fillRect(0, groundY, worldWidth, 60);
  ctx.fillStyle = theme.grass;
  ctx.fillRect(0, groundY, worldWidth, 14);
  ctx.fillStyle = theme.grassDark;
  for (let gx=0; gx<worldWidth; gx+=18) {
    ctx.beginPath();
    ctx.moveTo(gx, groundY+2);
    ctx.lineTo(gx+4, groundY-6);
    ctx.lineTo(gx+8, groundY+2);
    ctx.fill();
  }

  // zonas de gelo: trecho de chão translúcido azulado + brilho
  const lvl = levels[state.levelIndex];
  if (lvl.iceZones) {
    for (const iz of lvl.iceZones) {
      ctx.fillStyle = 'rgba(190,230,255,0.55)';
      ctx.fillRect(iz.x, groundY, iz.w, 14);
      ctx.strokeStyle = 'rgba(255,255,255,0.7)';
      ctx.lineWidth = 1.5;
      for (let k=0;k<iz.w;k+=22) {
        ctx.beginPath();
        ctx.moveTo(iz.x+k, groundY+2);
        ctx.lineTo(iz.x+k+10, groundY+10);
        ctx.stroke();
      }
    }
  }
  // zonas de vento: riscos horizontais animados indicando a direção do vento
  if (lvl.windZones) {
    const t = (gameClock*1000)/1000;
    ctx.strokeStyle = 'rgba(255,255,255,0.45)';
    ctx.lineWidth = 2;
    for (const wz of lvl.windZones) {
      const dir = wz.strength >= 0 ? 1 : -1;
      for (let i=0;i<6;i++) {
        const rowY = wz.y + 20 + i*((wz.h-40)/6);
        const phase = (t*160*dir + i*70) % (wz.w+80) - 40;
        const sx = wz.x + ((phase % wz.w) + wz.w) % wz.w;
        ctx.beginPath();
        ctx.moveTo(sx, rowY);
        ctx.lineTo(sx + 26*dir, rowY);
        ctx.stroke();
      }
    }
  }

  for (const p of platforms) {
    ctx.fillStyle = p.move ? '#c98a3f' : '#a9662f';
    ctx.fillRect(p.x, p.y, p.w, p.h);
    ctx.fillStyle = p.move ? '#7fd98f' : '#5fbf6e';
    ctx.fillRect(p.x, p.y, p.w, 6);
  }

  // bandeiras de checkpoint
  for (const cp of checkpoints) {
    ctx.strokeStyle = '#7a5230';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cp.x, cp.y);
    ctx.lineTo(cp.x, cp.y-40);
    ctx.stroke();
    ctx.fillStyle = cp.active ? '#5fe0a0' : '#e3e3e3';
    ctx.beginPath();
    ctx.moveTo(cp.x, cp.y-40);
    ctx.lineTo(cp.x+18, cp.y-32);
    ctx.lineTo(cp.x, cp.y-24);
    ctx.fill();
    if (cp.active) {
      ctx.fillStyle = 'rgba(95,224,160,0.25)';
      ctx.beginPath();
      ctx.arc(cp.x, cp.y-20, 22, 0, Math.PI*2);
      ctx.fill();
    }
  }

  // caixas quebráveis
  for (const b of boxes) {
    if (b.broken) continue;
    ctx.fillStyle = '#b5772f';
    ctx.fillRect(b.x, b.y, b.w, b.h);
    ctx.strokeStyle = '#5c3a15';
    ctx.lineWidth = 2;
    ctx.strokeRect(b.x+1.5, b.y+1.5, b.w-3, b.h-3);
    ctx.beginPath();
    ctx.moveTo(b.x+4, b.y+4); ctx.lineTo(b.x+b.w-4, b.y+b.h-4);
    ctx.moveTo(b.x+b.w-4, b.y+4); ctx.lineTo(b.x+4, b.y+b.h-4);
    ctx.stroke();
    if (b.contents && b.contents.startsWith('powerup:')) {
      ctx.fillStyle = '#ffe27a';
      ctx.beginPath();
      ctx.arc(b.x+b.w/2, b.y+5, 4, 0, Math.PI*2);
      ctx.fill();
    }
  }

  ctx.fillStyle = '#c94c4c';
  for (const s of spikes) {
    const count = Math.floor(s.w/15);
    for (let i=0;i<count;i++) {
      ctx.beginPath();
      ctx.moveTo(s.x + i*15, s.y+s.h);
      ctx.lineTo(s.x + i*15+7.5, s.y);
      ctx.lineTo(s.x + i*15+15, s.y+s.h);
      ctx.fill();
    }
  }

  // gems
  for (const g of gems) {
    if (g.taken) continue;
    const bob = Math.sin((gameClock*1000)/300 + g.x) * 4;
    ctx.save();
    ctx.translate(g.x, g.y+bob);
    ctx.rotate((gameClock*1000)/500 % (Math.PI*2));
    ctx.fillStyle = '#ff5fa2';
    ctx.beginPath();
    ctx.moveTo(0,-10); ctx.lineTo(9,0); ctx.lineTo(0,10); ctx.lineTo(-9,0);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ffd1e6';
    ctx.beginPath();
    ctx.moveTo(0,-10); ctx.lineTo(4,-2); ctx.lineTo(-4,-2);
    ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  // gema de prata (objetivo da fase)
  if (silverGem && !silverGem.taken) {
    const bob = Math.sin((gameClock*1000)/280 + silverGem.x) * 5;
    const glow = 0.6 + Math.sin((gameClock*1000)/220)*0.4;
    ctx.save();
    ctx.translate(silverGem.x, silverGem.y+bob);
    ctx.rotate((gameClock*1000)/650 % (Math.PI*2));
    ctx.shadowColor = '#eef3f6';
    ctx.shadowBlur = 18*glow;
    ctx.fillStyle = '#aebcc7';
    ctx.beginPath();
    ctx.moveTo(0,-18); ctx.lineTo(15,0); ctx.lineTo(0,18); ctx.lineTo(-15,0);
    ctx.closePath(); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#f2f7fa';
    ctx.beginPath();
    ctx.moveTo(0,-18); ctx.lineTo(7,-5); ctx.lineTo(-7,-5);
    ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  // power-ups (cristais)
  for (const pu of powerups) {
    if (pu.taken) continue;
    const bob = Math.sin((gameClock*1000)/250 + pu.x) * 5;
    const glow = 0.6 + Math.sin((gameClock*1000)/200)*0.3;
    ctx.save();
    ctx.translate(pu.x, pu.y+bob);
    const colorMap = {star:'#ffd166', wing:'#a0e8ff', shield:'#8fe388'};
    ctx.shadowColor = colorMap[pu.type];
    ctx.shadowBlur = 15*glow;
    ctx.font = '22px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const emoji = pu.type === 'star' ? '⭐' : pu.type === 'wing' ? '🪽' : '🛡️';
    ctx.fillText(emoji, 0, 0);
    ctx.restore();
  }

  // portal
  const pgrad = ctx.createRadialGradient(portalX,groundY-60,5,portalX,groundY-60,50);
  pgrad.addColorStop(0,'#fff2c2');
  pgrad.addColorStop(1,'#ffb703');
  ctx.fillStyle = pgrad;
  ctx.beginPath();
  ctx.ellipse(portalX, groundY-60, 26, 60, 0, 0, Math.PI*2);
  ctx.fill();

  // enemies
  for (const e of enemies) {
    if (!e.alive) continue;
    const bob = Math.sin((gameClock*1000)/150 + e.x) * 2;
    ctx.save();
    ctx.translate(e.x, e.y+bob);
    ctx.scale(e.dir, 1);
    ctx.fillStyle = '#6b3fa0';
    ctx.beginPath();
    ctx.ellipse(0,-12,16,12,0,0,Math.PI*2);
    ctx.fill();
    ctx.fillStyle = 'white';
    ctx.beginPath(); ctx.arc(6,-16,4,0,Math.PI*2); ctx.fill();
    ctx.fillStyle = 'black';
    ctx.beginPath(); ctx.arc(7,-16,2,0,Math.PI*2); ctx.fill();
    ctx.fillStyle = '#4a2a70';
    ctx.fillRect(-10,-4,8,6);
    ctx.fillRect(4,-4,8,6);
    ctx.restore();
  }

  drawPlayer();
  drawParticles();

  ctx.restore();
}

function drawPlayer() {
  ctx.save();
  ctx.translate(player.x + player.w/2, player.y + player.h/2);
  ctx.scale(player.facing, 1);
  const squashY = player.squash;
  const squashX = 2 - player.squash;
  ctx.scale(squashX, squashY);

  if (player.invuln % 10 < 5 && player.invuln > 0) {
    ctx.globalAlpha = 0.4;
  }

  if (player.starTimer > 0) {
    const hue = ((gameClock*1000)/5) % 360;
    ctx.shadowColor = `hsl(${hue},90%,60%)`;
    ctx.shadowBlur = 20;
  }

  // sombra de contato no chão
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.beginPath();
  ctx.ellipse(0,23,13,4,0,0,Math.PI*2);
  ctx.fill();

  const legSwing = player.onGround ? Math.sin(player.walkPhase) * 10 : 0;
  ctx.save();
  ctx.translate(-7,10);
  ctx.rotate(legSwing * Math.PI/180 * 0.05);
  ctx.fillStyle = '#4a3220';
  ctx.fillRect(-5,0,10,12);
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.fillRect(1,0,4,9);
  ctx.fillStyle = '#2e1c10';
  ctx.fillRect(-5,9,10,4);
  ctx.restore();
  ctx.save();
  ctx.translate(7,10);
  ctx.rotate(-legSwing * Math.PI/180 * 0.05);
  ctx.fillStyle = '#4a3220';
  ctx.fillRect(-5,0,10,12);
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.fillRect(1,0,4,9);
  ctx.fillStyle = '#2e1c10';
  ctx.fillRect(-5,9,10,4);
  ctx.restore();

  // camisa verde (com sombra lateral)
  ctx.fillStyle = '#3f9a4f';
  ctx.beginPath();
  ctx.ellipse(0,0,15,16,0,0,Math.PI*2);
  ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  ctx.beginPath();
  ctx.ellipse(6,2,9,14,0,0,Math.PI*2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  ctx.beginPath();
  ctx.ellipse(-6,-3,6,9,0,0,Math.PI*2);
  ctx.fill();

  // gola em V
  ctx.fillStyle = '#2b6b37';
  ctx.beginPath();
  ctx.moveTo(-5,-9); ctx.lineTo(0,-1); ctx.lineTo(5,-9);
  ctx.closePath();
  ctx.fill();

  // cinto/faixa vermelha na cintura
  ctx.fillStyle = '#c0392b';
  ctx.fillRect(-15,6,30,4);
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.fillRect(-15,6,30,1);
  ctx.fillStyle = '#8f2419';
  ctx.fillRect(-3,6,6,4);

  // cabeça
  ctx.fillStyle = '#f4c28a';
  ctx.beginPath();
  ctx.arc(0,-16,12,0,Math.PI*2);
  ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,0.08)';
  ctx.beginPath();
  ctx.arc(5,-13,8,0,Math.PI*2);
  ctx.fill();
  ctx.fillStyle = 'rgba(230,110,90,0.35)';
  ctx.beginPath();
  ctx.arc(6,-11,2.8,0,Math.PI*2);
  ctx.fill();

  // cabelo castanho espetado (sombra + camada principal + brilho)
  ctx.fillStyle = '#2a1810';
  ctx.beginPath();
  ctx.moveTo(-10,-26);
  ctx.lineTo(-9,-37);
  ctx.lineTo(-4,-29);
  ctx.lineTo(-1,-40);
  ctx.lineTo(2,-28);
  ctx.lineTo(6,-37);
  ctx.lineTo(10,-25);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#4a2c18';
  ctx.beginPath();
  ctx.moveTo(-9,-27);
  ctx.lineTo(-8,-38);
  ctx.lineTo(-3,-30);
  ctx.lineTo(0,-41);
  ctx.lineTo(3,-29);
  ctx.lineTo(7,-38);
  ctx.lineTo(9,-26);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.22)';
  ctx.beginPath();
  ctx.moveTo(-1,-40); ctx.lineTo(1,-33); ctx.lineTo(-2,-34);
  ctx.closePath();
  ctx.fill();

  // bandana vermelha com nó e pontas
  ctx.fillStyle = '#d62828';
  ctx.beginPath();
  ctx.ellipse(0,-27,10.5,4,0,0,Math.PI*2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  ctx.fillRect(-9,-29,18,1.5);
  ctx.fillStyle = '#a01f1f';
  ctx.beginPath();
  ctx.moveTo(-17,-21); ctx.lineTo(-13,-19); ctx.lineTo(-9,-21);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#d62828';
  ctx.beginPath();
  ctx.moveTo(-10,-26);
  ctx.lineTo(-17,-21);
  ctx.lineTo(-9,-21);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-9,-21);
  ctx.lineTo(-15,-14);
  ctx.lineTo(-8,-17);
  ctx.closePath();
  ctx.fill();

  // sobrancelha decidida
  ctx.fillStyle = '#3b2415';
  ctx.fillRect(4,-21,6,2);

  const blink = Math.sin((gameClock*1000)/900) > 0.96;
  ctx.fillStyle = 'white';
  if (!blink) {
    ctx.beginPath(); ctx.arc(6,-17,4,0,Math.PI*2); ctx.fill();
    ctx.fillStyle = 'black';
    ctx.beginPath(); ctx.arc(8,-17,2,0,Math.PI*2); ctx.fill();
  } else {
    ctx.fillStyle = '#c99a6b';
    ctx.fillRect(2,-18,8,2);
  }

  // sorriso confiante
  ctx.strokeStyle = '#a3673d';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.arc(5,-9,3,0.1,Math.PI-0.3);
  ctx.stroke();

  // mangas verdes com sombra, munhequeiras e mãos
  ctx.fillStyle = '#357a41';
  ctx.fillRect(-18,-4,7,13);
  ctx.fillRect(11,-4,7,13);
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.fillRect(-14,-4,3,13);
  ctx.fillRect(15,-4,3,13);
  ctx.fillStyle = '#2b2b2b';
  ctx.fillRect(-18,5,7,3);
  ctx.fillRect(11,5,7,3);
  ctx.fillStyle = '#f4c28a';
  ctx.beginPath(); ctx.arc(-14,11,4,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(14,11,4,0,Math.PI*2); ctx.fill();

  if (player.wingTimer > 0) {
    ctx.fillStyle = 'rgba(160,232,255,0.85)';
    const flap = Math.sin((gameClock*1000)/80) * 6;
    ctx.beginPath();
    ctx.ellipse(-14, -6+flap, 10, 5, -0.4, 0, Math.PI*2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(-14, -6-flap, 10, 5, 0.4, 0, Math.PI*2);
    ctx.fill();
  }

  if (player.shield) {
    ctx.strokeStyle = 'rgba(143,227,136,0.8)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0,-4,24,0,Math.PI*2);
    ctx.stroke();
  }

  ctx.shadowBlur = 0;
  ctx.globalAlpha = 1;
  ctx.restore();
}

function draw() {
  ctx.save();
  if (state.shake.timer > 0) {
    const amt = REDUCED_MOTION ? (state.shake.amount || 4) * 0.35 : (state.shake.amount || 4);
    ctx.translate((Math.random()-0.5)*amt, (Math.random()-0.5)*amt);
  }
  drawBackground();
  drawGround();
  ctx.restore();

  if (state.paused) {
    ctx.save();
    ctx.fillStyle = 'rgba(10,5,20,0.55)';
    ctx.fillRect(0,0,W,H);
    ctx.fillStyle = '#ffd166';
    ctx.font = 'bold 34px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('⏸ PAUSADO', W/2, H/2 - 12);
    ctx.font = '16px sans-serif';
    ctx.fillStyle = '#fff8e7';
    ctx.fillText('Pressione P ou ESC para continuar', W/2, H/2 + 24);
    ctx.restore();
  }
}

function loop() {
  tickGameClock();
  update();
  draw();
  requestAnimationFrame(loop);
}
