"use strict";

/* ============================================================
   WOOD PIECE ENTITY
============================================================ */
const WOOD_TYPES = {
  graveto: { energy:8, coins:1, size:10, color:'#8a6237', burn:3 },
  galho:   { energy:18, coins:1, size:15, color:'#6b4a2a', burn:8 },
  tronco:  { energy:35, coins:2, size:21, color:'#4d341d', burn:15 },
  dourado: { energy:60, coins:5, size:17, color:'#e8c04a', burn:25 },
};
let woodIdCounter=1;
function spawnWood(tree){
  const origin = tree || treePos;
  let type='graveto';
  const r = Math.random();
  if(r<rareChanceVal()) type='dourado';
  else if(r<0.18) type='tronco';
  else if(r<0.48) type='galho';
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
  const banner = document.getElementById('eventBanner');
  banner.textContent = WEATHER_LABEL[type];
  banner.classList.add('show');
  setTimeout(()=>banner.classList.remove('show'), 2600);
}
function endWeather(){
  if(G.weather.type==='storm' && G.running && G.fireIntensity>0){
    unlockAch('surviveStorm');
  }
  G.weather.type=null; G.weather.timer=0;
}
function triggerAnimalRaid(){
  spawnAnimal();
  if(G.animal){
    const banner = document.getElementById('eventBanner');
    banner.textContent = WEATHER_LABEL['animal'];
    banner.classList.add('show');
    setTimeout(()=>banner.classList.remove('show'), 2200);
  }
}
function spawnAnimal(){
  if(G.woodPieces.filter(w=>w.landed && !w.dragging).length===0) return;
  G.animal = { x:-30, y:groundY+6, vx: 60+Math.random()*30, target:null, phase:'enter', timer:0 };
}

