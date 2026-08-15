"use strict";

/* ============================================================
   WOOD PIECE ENTITY
============================================================ */
const WOOD_TYPES = {
  graveto: { energy:8, coins:1, size:10, color:'#8a6237', burn:3 },
  galho:   { energy:18, coins:1, size:15, color:'#6b4a2a', burn:8 },
  tronco:  { energy:35, coins:2, size:21, color:'#4d341d', burn:15 },
  molhada: { energy:24, coins:2, size:18, color:'#40545b', burn:14, wet:true },
  resina:  { energy:46, coins:3, size:17, color:'#a95f28', burn:9, resin:true },
  dourado: { energy:60, coins:5, size:17, color:'#e8c04a', burn:25 },
};
let woodIdCounter=1;
function spawnWood(tree){
  const origin = tree || treePos;
  let type='graveto';
  const r = Math.random();
  if(r<rareChanceVal()) type='dourado';
  else if(G.weather.type==='rain' && r<0.20) type='molhada';
  else if(G.campaignNight>=4 && r<0.16) type='resina';
  else if(r<0.28) type='tronco';
  else if(r<0.56) type='galho';
  const def = WOOD_TYPES[type];
  const startX = origin.x + (Math.random()*20-10);
  const startY = origin.y - 150 - Math.random()*30;
  const targetX = Math.max(14, Math.min(W-14, origin.x + 26 + Math.random()*55));
  const targetY = groundY + (Math.random()*6-3);
  G.woodPieces.push({
    id: woodIdCounter++, type, def,
    x:startX, y:startY, tx:targetX, ty:targetY,
    vy:-30-Math.random()*30, falling:true, landed:false, bounces:0,
    rot: Math.random()*Math.PI*2, rotSpeed:(Math.random()-0.5)*3,
    scale:0, dragging:false, dragOffX:0, dragOffY:0,
    bob: Math.random()*Math.PI*2,
    despawnTimer: null,
  });
}

/* ============================================================
   WEATHER SYSTEM
============================================================ */
const WEATHER_TYPES = ['rain','wind','frio','storm','fog'];
const WEATHER_LABEL = { rain:'🌧 Está chovendo', wind:'💨 Vento forte', frio:'❄ Frio intenso', animal:'🦝 Um animal ronda o acampamento!', storm:'⚡ Tempestade!', fog:'🌫 Neblina densa' };
let eventBannerTimer=null;
function showEventBanner(text, ms=2500){
  const banner=document.getElementById('eventBanner');
  banner.textContent=text; banner.classList.add('show');
  clearTimeout(eventBannerTimer);
  eventBannerTimer=setTimeout(()=>banner.classList.remove('show'), ms);
}


function maybeTriggerWeather(dt){
  if(G.weather.type){
    G.weather.timer -= dt;
    if(G.weather.timer<=0){
      endWeather();
    }
    return;
  }
  // eventos garantidos (pelo menos 3 por noite)
  if(G.weatherQueue && G.weatherQueue.length && G.time>=G.weatherQueue[0]){
    G.weatherQueue.shift();
    const t = WEATHER_TYPES[Math.floor(Math.random()*WEATHER_TYPES.length)];
    startWeather(t);
    return;
  }
  // eventos extras aleatórios, além dos garantidos
  G.weather.nextCheck -= dt;
  if(G.weather.nextCheck<=0){
    G.weather.nextCheck = 22+Math.random()*14;
    if(Math.random()<0.4){
      const t = WEATHER_TYPES[Math.floor(Math.random()*WEATHER_TYPES.length)];
      startWeather(t);
    }
  }
}
function startWeather(type){
  G.weather.type = type;
  G.weather.timer = type==='storm' ? 14+Math.random()*6 : (type==='rain' ? 16+Math.random()*10 : 9+Math.random()*7);
  G.weather.totalDuration = G.weather.timer;
  G.weatherEventsCount++;
  showEventBanner(WEATHER_LABEL[type], 2600);
}
function endWeather(){
  if(G.weather.type==='storm' && G.running && G.fireIntensity>0){
    unlockAch('surviveStorm');
  }
  G.weather.type=null; G.weather.timer=0;
}
function triggerAnimalRaid(){ spawnAnimal(); }
function enemyForNight(){
  if(G.campaignNight<=2) return 'raccoon';
  if(G.campaignNight<=4) return 'fox';
  if(G.campaignNight<=6) return 'wolf';
  return 'boar';
}
function enemyLabel(type){
  return ({raccoon:'🦝 Guaxinim: vai roubar sua madeira!',fox:'🦊 Raposa: proteja as madeiras raras!',wolf:'🐺 Lobo: mantenha a chama alta!',boar:'🐗 Javali: cuidado com a investida!'})[type] || '🐾 Algo se aproxima...';
}
function spawnAnimal(){
  if(G.campaignNight===10 && G.boss) return;
  const type=enemyForNight();
  if((type==='raccoon'||type==='fox') && G.woodPieces.filter(w=>w.landed && !w.dragging).length===0) return;
  const cfg={
    raccoon:{vx:62,scale:0.9}, fox:{vx:82,scale:1.0}, wolf:{vx:76,scale:1.15}, boar:{vx:92,scale:1.3}
  }[type];
  G.animal = { type, x:-45, y:groundY+6, vx: cfg.vx+Math.random()*18, scale:cfg.scale, target:null, phase:'enter', timer:0, hit:false };
  showEventBanner(enemyLabel(type), 2200);
}
function spawnFinalBoss(){
  if(G.boss || G.bossDefeated) return;
  G.boss={type:'stormBeast',x:W+90,y:groundY-2,hp:100,maxHp:100,phase:'stalk',timer:5.5,charge:0,alpha:0};
  G.specialEvent='finalBoss';
  startWeather('storm');
  G.weather.timer=Math.max(G.weather.timer,G.nightDuration-G.time+30);
  showEventBanner('🐺⚡ BESTA DA TEMPESTADE — mantenha a fogueira forte!',3800);
}
function damageBoss(amount){
  if(!G.boss || G.bossDefeated) return;
  G.boss.hp=Math.max(0,G.boss.hp-amount);
  G.boss.charge=Math.min(1,G.boss.charge+amount/45);
  if(G.boss.hp<=0){
    G.bossDefeated=true; G.enemiesSurvived++; G.boss.phase='defeated'; G.boss.timer=2.8;
    showEventBanner('🔥 A Besta foi expulsa pela chama!',3000);
    save.coins+=40;
    sfx.playVictory();
  }
}

