"use strict";

/* ============================================================
   GAME LAYOUT (positions relative to canvas size)
============================================================ */
let firePos = {x:0,y:0};
let treePos = {x:0,y:0};
let groundY = 0;
const TREE_FRACS = [0.16, 0.045, 0.29, 0.40];
function layoutPositions(){
  groundY = H*0.78;
  firePos = { x: W*0.56, y: groundY - 4 };
  treePos = { x: W*0.16, y: groundY };
  if(G.trees){
    for(let i=0;i<G.trees.length;i++){
      G.trees[i].x = W*(TREE_FRACS[i]!==undefined?TREE_FRACS[i]:0.16+i*0.09);
      G.trees[i].y = groundY;
    }
  }
}

/* ============================================================
   UPGRADE HELPERS
============================================================ */
function up(key){ return save.upgrades[key]||0; }
function decayMultiplier(){ return Math.max(0.4, 1 - up('fireDuration')*0.11); }
function maxIntensity(){ return 100 + up('fireCapacity')*20; }
function spawnIntervalMul(){ return Math.max(0.4, 1 - up('treeProduction')*0.13); }
function woodValueMul(){ return 1 + up('woodValue')*0.15; }
function windResistMul(){ return Math.max(0.15, 1 - up('windResist')*0.18); }
function rainResistMul(){ return Math.max(0.15, 1 - up('rainResist')*0.18); }
function rareChanceVal(){ return 0.03 + up('rareChance')*0.035; }
function autoGravetosVal(){ return up('autoGravetos'); }
function shelterMul(){ return Math.max(0.12, 1 - up('shelter')*0.2); }
function treeCount(){ return 1 + up('extraTrees'); }

/* ============================================================
   GAME STATE
============================================================ */
const G = {
  running:false, paused:false, won:false, lost:false,
  time:0, nightDuration:540,
  fireIntensity:35, minIntensityThisRun:100, fireIntegral:0, fireSampleTime:0,
  woodPieces:[], particles:[], embers:[], smoke:[], sparks:[], rain:[], leaves:[], lightning:0,
  fog:0,
  weather:{ type:null, timer:0, nextCheck:8 },
  weatherQueue:[], weatherEventsCount:0,
  burningLogs:[],
  woodBurnedThisRun:0,
  trees:[],
  animal:null, animalTimer:15,
  dragging:null, selectedWoodId:null,
  camp:{},
  autoTimer:0,
  windDir:1,
  campaignNight:1, specialEvent:null, combo:0, comboTimer:0, maxCombo:0, dawn:0,
  boss:null, bossDefeated:false, enemiesSurvived:0, dangerFlash:0,
};

function setupTrees(){
  const count = treeCount();
  G.trees = [];
  for(let i=0;i<count;i++){
    const fx = TREE_FRACS[i]!==undefined ? TREE_FRACS[i] : 0.16+i*0.09;
    G.trees.push({ x: W*fx, y: groundY, spawnTimer: 1.5+Math.random()*2.5, sway: Math.random()*10 });
  }
}

function scheduleWeather(){
  G.weatherQueue = [];
  const segments = 3;
  const segLen = G.nightDuration/segments;
  for(let i=0;i<segments;i++){
    const segStart = segLen*i + 10;
    const segEnd = segLen*(i+1) - 10;
    const span = Math.max(2, segEnd-segStart);
    G.weatherQueue.push(segStart + Math.random()*span);
  }
  G.weatherQueue.sort((a,b)=>a-b);
}

function startGame(){
  G.running=true; G.paused=false; G.won=false; G.lost=false;
  G.time=0;
  G.campaignNight = Math.max(1, Math.min(10, (save.campaign&&save.campaign.night)||1));
  // campanha: noites iniciais mais curtas, crescendo até a tempestade final
  G.nightDuration = 300 + (G.campaignNight-1)*18 + Math.random()*20;
  G.fireIntensity = maxIntensity()*0.35; // começa com apenas 35%
  G.minIntensityThisRun = maxIntensity();
  G.fireIntegral=0; G.fireSampleTime=0;
  G.woodPieces=[]; G.particles=[]; G.embers=[]; G.smoke=[]; G.sparks=[]; G.rain=[]; G.leaves=[];
  G.burningLogs=[];
  G.weather={ type:null, timer:0, nextCheck: 18+Math.random()*10 };
  G.weatherEventsCount = 0;
  scheduleWeather();
  G.woodBurnedThisRun=0;
  setupTrees();
  G.animal=null;
  G.animalTimer = 14+Math.random()*10;
  G.dragging=null; G.selectedWoodId=null;
  G.autoTimer=0;
  G.lightning=0; G.fog=0; G.specialEvent=null; G.combo=0; G.comboTimer=0; G.maxCombo=0; G.dawn=0;
  G.boss=null; G.bossDefeated=false; G.enemiesSurvived=0; G.dangerFlash=0;
  document.getElementById('hud').classList.remove('hidden');
  document.getElementById('pauseBtn').classList.remove('hidden');
  document.getElementById('pauseBtn').textContent='⏸';
  document.getElementById('pauseScreen').classList.add('hidden');
  const nb=document.getElementById('nightBadge'); if(nb){nb.textContent='NOITE '+G.campaignNight+'/10';nb.classList.remove('hidden');}
  document.getElementById('dragGhostHint').classList.remove('hidden');
  setTimeout(()=>document.getElementById('dragGhostHint').classList.add('hidden'), 4500);
  showScreen(''); // hide all
  document.querySelectorAll('.screen').forEach(s=>{s.classList.add('hidden'); s.classList.remove('active');});
  sfx.ensure();
  sfx.startLoop('fire', sfx.fireLoop);
  sfx.startLoop('wind', sfx.windLoop);
  sfx.startLoop('rain', sfx.rainLoop);
}

function endGame(won){
  G.running=false; G.won=won; G.lost=!won;
  sfx.stopLoop('fire'); sfx.stopLoop('wind'); sfx.stopLoop('rain');
  document.getElementById('hud').classList.add('hidden');
  document.getElementById('pauseBtn').classList.add('hidden');
  const nb=document.getElementById('nightBadge'); if(nb) nb.classList.add('hidden');

  // stats & coins (progressão mais gradual)
  let coinGain = Math.floor(G.woodBurnedThisRun * 0.3 * woodValueMul());
  coinGain += Math.floor(G.time/15);
  if(won){
    coinGain += 25 + G.campaignNight*4 + G.maxCombo; save.campLevel += 1; save.stats.nightsSurvived += 1; unlockAch('firstNight');
    save.stats.campaignWins=(save.stats.campaignWins||0)+1;
    save.campaign=save.campaign||{night:1,completed:false,streak:0};
    save.campaign.streak=(save.campaign.streak||0)+1; save.stats.bestStreak=Math.max(save.stats.bestStreak||0,save.campaign.streak);
    if(G.campaignNight>=10){ save.campaign.completed=true; save.campaign.night=10; unlockAch('campaign10'); }
    else save.campaign.night=G.campaignNight+1;
  } else { if(save.campaign) save.campaign.streak=0; }
  save.coins += coinGain;
  save.stats.totalWoodBurned += G.woodBurnedThisRun;
  save.stats.bestTime = Math.max(save.stats.bestTime, G.time);
  save.stats.totalWeather=(save.stats.totalWeather||0)+G.weatherEventsCount;
  save.stats.enemiesSurvived=(save.stats.enemiesSurvived||0)+G.enemiesSurvived;
  if(G.bossDefeated) save.stats.bossesDefeated=(save.stats.bossesDefeated||0)+1;
  if(save.stats.totalWoodBurned>=100) unlockAch('wood100');
  if(save.stats.totalWoodBurned>=1000) unlockAch('wood1000');
  if(G.time>=360) unlockAch('survive10min');
  if(won && G.minIntensityThisRun>=maxIntensity()*0.5) unlockAch('neverBelow50');
  persist();

  document.getElementById('endTitle').textContent = won? '🌅 Amanheceu!' : '💀 A fogueira apagou...';
  document.getElementById('endCoins').textContent = '+'+coinGain+' 🪙';
  document.getElementById('endTime').textContent = formatTime(G.time);
  document.getElementById('endWood').textContent = G.woodBurnedThisRun;
  const avgFirePct = G.fireSampleTime>0 ? (G.fireIntegral/G.fireSampleTime)*100 : 0;
  document.getElementById('endFire').textContent = Math.round(avgFirePct)+'%';
  const en=document.getElementById('endNight'); if(en) en.textContent = G.campaignNight+'/10';
  const ec=document.getElementById('endCombo'); if(ec) ec.textContent = 'x'+G.maxCombo;
  showScreen('endScreen');
  if(won) sfx.playVictory(); else sfx.playDefeat();
}

function formatTime(s){
  s = Math.floor(s);
  const m = Math.floor(s/60), sec = s%60;
  return m+':'+(sec<10?'0':'')+sec;
}

