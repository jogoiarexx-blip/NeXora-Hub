"use strict";

/* ============================================================
   CANVAS SETUP
============================================================ */
const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');
const gameEl = document.getElementById('game');
let W = 0, H = 0, DPR = 1;

function resize(){
  const rect = gameEl.getBoundingClientRect();
  W = rect.width; H = rect.height;
  DPR = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.floor(W * DPR);
  canvas.height = Math.floor(H * DPR);
  ctx.setTransform(DPR,0,0,DPR,0,0);
  layoutPositions();
}
window.addEventListener('resize', resize);
window.addEventListener('orientationchange', ()=>setTimeout(resize,200));

/* ============================================================
   PERSISTENT SAVE
============================================================ */
const SAVE_KEY = 'lastCampfireSave_v1';
function defaultSave(){
  return {
    coins: 0,
    campLevel: 1,
    upgrades: { fireDuration:0, treeProduction:0, fireCapacity:0, woodValue:0, windResist:0, rainResist:0, autoGravetos:0, rareChance:0 },
    achievements: {},
    stats: { totalWoodBurned:0, nightsSurvived:0, bestTime:0 },
    settings: { sound:true, vibe:true, volume:0.6 }
  };
}
let save = loadSave();
function loadSave(){
  try{
    const raw = localStorage.getItem(SAVE_KEY);
    if(!raw) return defaultSave();
    const parsed = JSON.parse(raw);
    const d = defaultSave();
    return Object.assign(d, parsed, {
      upgrades: Object.assign(d.upgrades, parsed.upgrades||{}),
      achievements: Object.assign({}, parsed.achievements||{}),
      stats: Object.assign(d.stats, parsed.stats||{}),
      settings: Object.assign(d.settings, parsed.settings||{})
    });
  }catch(e){ return defaultSave(); }
}
let saveTimer=null;
function persist(){
  clearTimeout(saveTimer);
  saveTimer = setTimeout(()=>{
    try{ localStorage.setItem(SAVE_KEY, JSON.stringify(save)); }catch(e){}
  }, 250);
}

/* ============================================================
   UPGRADE DEFINITIONS
============================================================ */
const UPGRADES = [
  { key:'extraTrees', icon:'🌲', name:'Plantar Árvores', desc:'Planta árvores extras que também derrubam madeira', maxLv:3, baseCost:70, isNew:true },
  { key:'shelter', icon:'🛖', name:'Abrigo da Fogueira', desc:'Essencial: reduz drasticamente o dano do vento, chuva e frio', maxLv:5, baseCost:55, isNew:true },
  { key:'fireDuration', icon:'🔥', name:'Fogo Duradouro', desc:'Reduz a queda de intensidade do fogo', maxLv:5, baseCost:25 },
  { key:'treeProduction', icon:'🌳', name:'Árvore Produtiva', desc:'A árvore derruba madeira com mais frequência', maxLv:5, baseCost:30 },
  { key:'fireCapacity', icon:'⛺', name:'Fogueira Maior', desc:'Aumenta a capacidade máxima do fogo', maxLv:5, baseCost:35 },
  { key:'woodValue', icon:'🪓', name:'Madeira Valiosa', desc:'Cada madeira gera mais energia e moedas', maxLv:5, baseCost:28 },
  { key:'windResist', icon:'💨', name:'Resistência ao Vento', desc:'Reduz efeitos do vento e evita perder madeira', maxLv:5, baseCost:22 },
  { key:'rainResist', icon:'🌧', name:'Resistência à Chuva', desc:'Reduz o quanto a chuva apaga o fogo', maxLv:5, baseCost:22 },
  { key:'autoGravetos', icon:'✨', name:'Coleta Automática', desc:'Gera gravetos automaticamente com o tempo', maxLv:5, baseCost:40 },
  { key:'rareChance', icon:'💎', name:'Madeira Rara', desc:'Chance de encontrar madeira dourada valiosa', maxLv:5, baseCost:45 },
];
function upgradeCost(def, lvl){ return Math.round(def.baseCost * Math.pow(1.6, lvl)); }

/* ============================================================
   ACHIEVEMENT DEFINITIONS
============================================================ */
const ACHIEVEMENTS = [
  { key:'firstNight', icon:'🌅', name:'Primeira Noite', desc:'Sobreviva até o amanhecer' },
  { key:'wood100', icon:'🪵', name:'Lenhador', desc:'Queime 100 madeiras' },
  { key:'wood1000', icon:'🪓', name:'Mestre Lenhador', desc:'Queime 1000 madeiras' },
  { key:'survive10min', icon:'⏱', name:'Resistente', desc:'Sobreviva 10 minutos em uma partida' },
  { key:'neverBelow50', icon:'💪', name:'Guardião da Chama', desc:'Vença uma noite sem o fogo cair abaixo de 50%' },
  { key:'surviveStorm', icon:'⚡', name:'Tempestade Vencida', desc:'Sobreviva a uma tempestade' },
];
function unlockAch(key){
  if(save.achievements[key]) return;
  save.achievements[key] = true;
  persist();
  showAchToast(ACHIEVEMENTS.find(a=>a.key===key));
}
let achToastTimer=null;
function showAchToast(def){
  if(!def) return;
  const el = document.getElementById('achToast');
  el.textContent = '🏆 ' + def.name + ' desbloqueada!';
  el.classList.add('show');
  clearTimeout(achToastTimer);
  achToastTimer = setTimeout(()=>el.classList.remove('show'), 2600);
  sfx.playChime();
}

