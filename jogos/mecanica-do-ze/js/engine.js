
const canvas=document.getElementById("game");
const ctx=canvas.getContext("2d");
let viewW=window.innerWidth,viewH=window.innerHeight,renderDpr=1;
function getTargetViewport(){
  const ratio=window._aspectRatio||'livre';
  const ratios={'16:9':16/9,'4:3':4/3,'21:9':21/9};
  const r=ratios[ratio];
  if(!r)return {w:window.innerWidth,h:window.innerHeight};
  const ww=window.innerWidth,wh=window.innerHeight;
  if(ww/wh>r)return {w:Math.round(wh*r),h:wh};
  return {w:ww,h:Math.round(ww/r)};
}
function resize(){
  const v=getTargetViewport(); viewW=Math.max(320,v.w); viewH=Math.max(240,v.h);
  const q=window._graphicsQuality||'media';
  const maxDpr=q==='alta'?2:q==='media'?1.5:1;
  renderDpr=Math.max(1,Math.min(window.devicePixelRatio||1,maxDpr));
  canvas.width=Math.round(viewW*renderDpr); canvas.height=Math.round(viewH*renderDpr);
  canvas.style.width=viewW+'px'; canvas.style.height=viewH+'px';
  canvas.style.position='absolute'; canvas.style.left=Math.round((window.innerWidth-viewW)/2)+'px'; canvas.style.top=Math.round((window.innerHeight-viewH)/2)+'px';
  ctx.setTransform(renderDpr,0,0,renderDpr,0,0);
  ctx.imageSmoothingEnabled=q!=='baixa';
}
window.resizeGameCanvas=resize;
resize();window.addEventListener("resize",resize);

// Color utils
const _cc=document.createElement("canvas");_cc.width=_cc.height=1;
const _cctx=_cc.getContext("2d",{willReadFrequently:true});const _cache={};
function colorToRgb(c){if(_cache[c])return _cache[c];_cctx.clearRect(0,0,1,1);_cctx.fillStyle=c;_cctx.fillRect(0,0,1,1);const d=_cctx.getImageData(0,0,1,1).data;return(_cache[c]=[d[0],d[1],d[2]]);}
function withAlpha(c,a){const[r,g,b]=colorToRgb(c);return `rgba(${r},${g},${b},${a})`;}
function lighten(c,a){const[r,g,b]=colorToRgb(c);return `rgb(${Math.min(255,r+a)},${Math.min(255,g+a)},${Math.min(255,b+a)})`;}

// [audio.js] SFX + sound controls — extraído para js/audio.js
// ── State ──────────────────────────────────────────────────────────────────────
let money=200,reputation=0,fixCount=0;
let shopW=1600,shopH=1200; // GARAGEM MAIOR
let playerSpeed=3.5,maxStamina=100,stamina=100,staminaDrain=0.05,staminaRegen=0.04;
let parts=20,maxParts=20,hasAutoOrder=false,hasHelper=false;
let diagnosticLevel=1,toolQuality=1,reputationMult=1;
let gameMinute=8*60,tick=0;
let carsDone=0,totalMoneyEarned=200;

// ── v2.0 NEW STATE ────────────────────────────────────────────────────────────
let hunger=100,maxHunger=100; // Sistema de fome
let hungerDrain=0.008; // drena por tick
let foodItems=[{name:"☕ Café",cost:15,hunger:20},{name:"🥪 Sanduíche",cost:35,hunger:50},{name:"🍱 Marmita",cost:60,hunger:100}];
let hasCantine=false; // upgrade que desbloqueia cantina

// [weatherSystem.js] weatherState, WEATHER_TYPES, rainDrops — extraído para js/weatherSystem.js
// Day report
let dayReportData=null;
let dayStartMoney=200;
let dayStartFix=0;
let dayReportVisible=false;
let dayHistory=[];
let lastReportDay=-1;

let _dayHadClientLeave=false; // rastreia se algum cliente foi embora hoje
// Parts shop
let partsShopVisible=false;
const PART_TYPES=[
  {id:"pastilha",  name:"Pastilha de Freio", emoji:"🛑", cost:25,  stock:5,  forProblems:["Freio"]},
  {id:"pneu",      name:"Pneu",              emoji:"🔄", cost:20,  stock:5,  forProblems:["Pneu","Aquaplanagem"]},
  {id:"oleo",      name:"Óleo de Motor",     emoji:"🛢️", cost:30,  stock:5,  forProblems:["Motor","Óleo"]},
  {id:"vela",      name:"Vela de Ignição",   emoji:"⚡", cost:35,  stock:5,  forProblems:["Elétrica","Bateria"]},
  {id:"correia",   name:"Correia Dentada",   emoji:"⚙️", cost:55,  stock:3,  forProblems:["Transmissão","Motor"]},
  {id:"radiador",  name:"Radiador",          emoji:"🌡️", cost:80,  stock:2,  forProblems:["Superaquecimento"]},
  {id:"filtro",    name:"Filtro de Ar",      emoji:"💨", cost:18,  stock:8,  forProblems:["Óleo","Motor"]},
  {id:"bateria",   name:"Bateria",           emoji:"🔋", cost:90,  stock:2,  forProblems:["Bateria","Elétrica"]},
];
let partInventory={}; // partId -> count
PART_TYPES.forEach(p=>partInventory[p.id]=0);

// Achievements v2
const ACHIEVEMENTS=[
  {id:"first_fix",  name:"Primeiro Conserto",    emoji:"🔧", desc:"Consertou o primeiro carro",           req:()=>fixCount>=1,                                         reward:100,  done:false},
  {id:"fix10",      name:"Mecanico de Verdade",  emoji:"⭐", desc:"Consertou 10 carros",                  req:()=>fixCount>=10,                                        reward:250,  done:false},
  {id:"fix50",      name:"Mao de Ouro",          emoji:"🏅", desc:"Consertou 50 carros",                  req:()=>fixCount>=50,                                        reward:500,  done:false},
  {id:"fix100",     name:"Lenda da Chave",       emoji:"🏆", desc:"Consertou 100 carros",                 req:()=>fixCount>=100,                                       reward:1000, done:false},
  {id:"money1k",    name:"Primeiro Mil",         emoji:"💵", desc:"Acumulou $1000",                       req:()=>totalMoneyEarned>=1000,                              reward:200,  done:false},
  {id:"money5k",    name:"Empreendedor",         emoji:"💰", desc:"Acumulou $5000",                       req:()=>totalMoneyEarned>=5000,                              reward:400,  done:false},
  {id:"money10k",   name:"Empresario",           emoji:"🏦", desc:"Acumulou $10.000",                     req:()=>totalMoneyEarned>=10000,                             reward:800,  done:false},
  {id:"vip5",       name:"Clientela VIP",        emoji:"👑", desc:"Atendeu 5 clientes VIP",               req:()=>vipCount>=5,                                         reward:400,  done:false},
  {id:"rain10",     name:"Mecanico das Chuvas",  emoji:"🌧️", desc:"Consertou 10 carros na chuva",         req:()=>rainFixes>=10,                                       reward:300,  done:false},
  {id:"truck5",     name:"Trucker",              emoji:"🚚", desc:"Consertou 5 caminhoes",                req:()=>truckFixes>=5,                                       reward:350,  done:false},
  {id:"moto10",     name:"Motoqueiro",           emoji:"🏍️", desc:"Consertou 10 motos",                   req:()=>motoFixes>=10,                                       reward:200,  done:false},
  {id:"nofood",     name:"Workaholic",           emoji:"😤", desc:"Trabalhou com fome o dia todo",        req:()=>workedHungryDay,                                      reward:150,  done:false},
  {id:"allweather", name:"Tempo Perfeito",       emoji:"🌈", desc:"Trabalhou com todos os tipos de clima",req:()=>weatherSeen.size>=4,                                 reward:500,  done:false},
  {id:"chain3",     name:"Cascata!",             emoji:"💥", desc:"Detectou 3 falhas em cadeia num carro",req:()=>maxChainFound>=3,                                    reward:600,  done:false},
  {id:"rep100",     name:"Popular",              emoji:"🌟", desc:"Fama chegou a 100",                    req:()=>reputation>=100,                                     reward:300,  done:false},
  {id:"rep500",     name:"Lendario",             emoji:"🔥", desc:"Fama chegou a 500",                    req:()=>reputation>=500,                                     reward:1000, done:false},
  {id:"rep1000",    name:"IMORTAL",              emoji:"👑", desc:"Fama chegou a 1000",                   req:()=>reputation>=1000,                                    reward:3000, done:false},
  {id:"loyal10",    name:"Turma Fiel",           emoji:"🤝", desc:"Atendeu 10 clientes fieis",            req:()=>loyalCount>=10,                                      reward:400,  done:false},
  {id:"helper_ach", name:"Time de Elite",        emoji:"👷", desc:"Contratou um assistente",              req:()=>typeof hasHelper!=='undefined'&&hasHelper,           reward:300,  done:false},
  {id:"all_upg",    name:"Arsenal Completo",     emoji:"🛠️", desc:"Comprou todos os upgrades",            req:()=>upgradesList.filter(u=>u.id).every(u=>u.bought),    reward:2000, done:false},
  {id:"no_leave",   name:"Ninguem Foi Embora",   emoji:"😤", desc:"Um dia inteiro sem perder cliente",    req:()=>window._neverLeft===true,                            reward:500,  done:false},
];
let vipCount=0,rainFixes=0,truckFixes=0,motoFixes=0;
let workedHungryDay=false,hungryWorkTick=0;
let weatherSeen=new Set(["clear"]);
let maxChainFound=0,loyalCount=0;

// Client personalities
const CLIENT_PERSONALITIES=[
  {id:"normal",   name:"Normal",    emoji:"😐", patienceMult:1.0, payMult:1.0,    repMult:1.0,   freq:0.45},
  {id:"rushed",   name:"Apressado", emoji:"😤", patienceMult:0.6, payMult:1.25,   repMult:1.3,   freq:0.20, bonusIfFast:true},
  {id:"complainer",name:"Reclamão", emoji:"😠", patienceMult:0.8, payMult:0.85,   repMult:0.7,   freq:0.15, negReview:true},
  {id:"loyal",    name:"Fiel",      emoji:"🤝", patienceMult:1.4, payMult:1.1,    repMult:1.2,   freq:0.12, discount:true},
  {id:"vip",      name:"VIP",       emoji:"👑", patienceMult:1.2, payMult:1.8,    repMult:1.5,   freq:0.08},
];

// Vehicle types
const VEHICLE_TYPES=[
  {id:"car",     name:"Carro",     emoji:"🚗", sizeW:150,sizeH:90,  payMult:1.0,  repMult:1.0,  freq:0.50, drawFn:"drawCar"},
  {id:"moto",    name:"Moto",      emoji:"🏍️", sizeW:90, sizeH:65,  payMult:0.65, repMult:0.8,  freq:0.20, drawFn:"drawMoto"},
  {id:"truck",   name:"Caminhão",  emoji:"🚚", sizeW:190,sizeH:110, payMult:2.2,  repMult:1.6,  freq:0.15, drawFn:"drawTruck"},
  {id:"luxury",  name:"Luxo",      emoji:"🏎️", sizeW:160,sizeH:95,  payMult:2.8,  repMult:2.0,  freq:0.10, drawFn:"drawLuxury"},
  {id:"bus",     name:"Van",       emoji:"🚐", sizeW:175,sizeH:105, payMult:1.7,  repMult:1.3,  freq:0.05, drawFn:"drawBus"},
];

// Chain failures - some problems can cascade
const CHAIN_PROBLEMS={
  "Motor":    ["Óleo","Superaquecimento"],
  "Transmissão":["Motor","Correia"],
  "Elétrica": ["Bateria","Farol"],
  "Freio":    ["Pneu"],
};

// ══════════════════════════════════════════════════════════════════════════════
// ⭐ SISTEMA DE FAMA — tiers 10 → 1000
// ══════════════════════════════════════════════════════════════════════════════
// [fameSystem.js] FAME_TIERS, fame functions — extraído para js/fameSystem.js
// [weatherSystem.js] getWeather, updateWeather, spawnRainDrops — extraído para js/weatherSystem.js
function openPartsShop(){
  if(!nearShop()){showToast("Vá até a Loja de Peças! 🏪");return;}
  partsShopVisible=true;
  const modal=document.getElementById("parts-shop-modal");
  if(modal)modal.style.display="flex";
  renderPartsShop();
  const bal=document.getElementById("shop-balance");
  if(bal)bal.textContent="$"+money;
}
function closePartsShop(){partsShopVisible=false;const modal=document.getElementById("parts-shop-modal");if(modal)modal.style.display="none";}
window.closePartsShop=closePartsShop;

function nearShop(){
  const dx=player.x+player.w/2-(partsShopArea.x+partsShopArea.w/2);
  const dy=player.y+player.h/2-(partsShopArea.y+partsShopArea.h/2);
  return Math.hypot(dx,dy)<130;
}

function buyPart(partId,qty=1){
  const p=PART_TYPES.find(x=>x.id===partId);if(!p)return;
  const total=p.cost*qty;
  if(money<total){showToast("Sem grana! 💸");return;}
  money-=total;
  partInventory[partId]=(partInventory[partId]||0)+qty;
  SFX.restock();
  showToast(`${p.emoji} ${p.name} x${qty} comprado!`);
  updateHUD();renderPartsShop();
}
window.buyPart=buyPart;

function renderPartsShop(){
  const el=document.getElementById("parts-shop-body");
  if(!el)return;
  el.innerHTML="";
  PART_TYPES.forEach(p=>{
    const have=partInventory[p.id]||0;
    const canAfford=money>=p.cost;
    el.innerHTML+=`<div class="part-item">
      <span class="part-emoji">${p.emoji}</span>
      <div class="part-info">
        <div class="part-name">${p.name}</div>
        <div class="part-for">Para: ${p.forProblems.join(", ")}</div>
      </div>
      <div class="part-right">
        <div class="part-stock">Estoque: <b>${have}</b></div>
        <div class="part-price">$${p.cost}/un</div>
        <button class="part-buy-btn ${canAfford?'':'disabled'}" onclick="buyPart('${p.id}',1)">+1</button>
        <button class="part-buy-btn ${money>=p.cost*5?'':'disabled'}" onclick="buyPart('${p.id}',5)">+5</button>
      </div>
    </div>`;
  });
}

// ── Day report ────────────────────────────────────────────────────────────────
function openDayReport(){
  if(!dayReportData)return;
  dayReportVisible=true;
  renderDayReport();
  const modal=document.getElementById("day-report-modal");
  if(modal)modal.style.display="flex";
}
function closeDayReport(){
  dayReportVisible=false;dayReportData=null;
  const modal=document.getElementById("day-report-modal");
  if(modal)modal.style.display="none";
}
window.closeDayReport=closeDayReport;

function buildDayReport(){
  const day=Math.floor(tick/(24*60*4))+1;
  if(day===lastReportDay)return;
  lastReportDay=day;

  // Notificação de nova baia desbloqueada (dia 6+ com fama > 200)
  if(day >= 6 && reputation > 200){
    const newBayCount = Math.min(5 + (day - 5), bays.length);
    const prevBayCount = Math.min(5 + (day - 6), bays.length);
    if(newBayCount > prevBayCount){
      setTimeout(()=>showToast(`🚗 Baia ${newBayCount} desbloqueada! (+1 cliente/dia)`), 1500);
    }
  }
  const earned=money-dayStartMoney;
  const fixed=fixCount-dayStartFix;
  let bonus=0;
  let bonusReasons=[];
  if(fixed>=10){bonus+=200;bonusReasons.push("🏆 +$200 por 10+ consertos");}
  if(earned>=500){bonus+=150;bonusReasons.push("💰 +$150 por lucro alto");}
  if(weatherState==="rain"||weatherState==="storm"){bonus+=100;bonusReasons.push("🌧️ +$100 Bônus chuva");}
  if(hunger<20){bonusReasons.push("😵 Trabalhou com muita fome — descanse!");}
  if(window._dayReportBonus){bonus+=window._dayReportBonus;bonusReasons.push("📊 +$"+window._dayReportBonus+" Contabilidade");}
  money+=bonus;
  dayReportData={day,earned,fixed,bonus,bonusReasons,
    money,reputation,weather:getWeather()};
  dayHistory.push({day,net:earned+bonus,fixed,reputation,money});
  if(dayHistory.length>14)dayHistory.shift();
  // Conquista "Ninguém Foi Embora": precisa comparar antes de atualizar o marco do dia.
  if(!_dayHadClientLeave && fixed > 0) window._neverLeft=true;
  dayStartMoney=money;dayStartFix=fixCount;
  _dayHadClientLeave=false; // reseta para o próximo dia
  openDayReport();
}

function renderDayReport(){
  const el=document.getElementById("day-report-content");
  if(!el||!dayReportData)return;
  const d=dayReportData;
  el.innerHTML=`
    <div class="report-day">📅 Fim do Dia ${d.day}</div>
    <div class="report-weather">${d.weather.icon} Clima: ${d.weather.label}</div>
    <div class="report-row"><span>🔧 Carros consertados</span><b>${d.fixed}</b></div>
    <div class="report-row"><span>💵 Faturamento</span><b>$${Math.max(0,d.earned)}</b></div>
    <div class="report-row"><span>⭐ Fama atual</span><b>${reputation}</b></div>
    ${d.bonus>0?`<div class="report-row bonus"><span>🎁 Bônus do dia</span><b>+$${d.bonus}</b></div>`:''}
    ${d.bonusReasons.map(r=>`<div class="report-bonus-reason">${r}</div>`).join('')}
    <div class="report-chart-title">📈 Resultado dos últimos dias</div>
    <canvas id="day-report-chart" width="520" height="150"></canvas>
    <div class="report-tip">💡 ${getDayTip()}</div>
  `;
  requestAnimationFrame(drawDayReportChart);
}
function drawDayReportChart(){
  const c=document.getElementById('day-report-chart');if(!c)return;const x=c.getContext('2d');
  const data=dayHistory.slice(-7);x.clearRect(0,0,c.width,c.height);
  x.fillStyle='rgba(0,0,0,.3)';x.fillRect(0,0,c.width,c.height);
  if(!data.length)return;const pad=24,max=Math.max(100,...data.map(d=>Math.abs(d.net)));
  x.strokeStyle='rgba(251,191,36,.25)';x.lineWidth=1;for(let i=0;i<4;i++){const y=pad+(c.height-pad*2)*i/3;x.beginPath();x.moveTo(pad,y);x.lineTo(c.width-pad,y);x.stroke();}
  const bw=(c.width-pad*2)/data.length*.55;data.forEach((d,i)=>{const slot=(c.width-pad*2)/data.length;const h=(Math.abs(d.net)/max)*(c.height-pad*2);const bx=pad+i*slot+(slot-bw)/2;const by=d.net>=0?c.height-pad-h:c.height-pad;x.fillStyle=d.net>=0?'#34d399':'#ef4444';x.fillRect(bx,by,bw,h);x.fillStyle='#ddd';x.font='12px VT323';x.textAlign='center';x.fillText('D'+d.day,bx+bw/2,c.height-7);});
}

function getDayTip(){
  const tips=[
    "Clientes fiéis pagam mais — atenda-os rápido!",
    "Na chuva chegam mais carros. Estoque peças!",
    "Caminhões pagam mais mas precisam de mais peças.",
    "Compre peças específicas na Loja para cada problema.",
    "Falhas em cadeia rendem mais fama!",
    "Clientes apressados pagam bônus se resolvidos rápido.",
    "Descanse o Zé para recuperar stamina mais rápido.",
    "Coma para manter a energia em dia!",
    "Upgrades de ferramentas diminuem tempo de conserto.",
  ];
  return tips[Math.floor(Math.random()*tips.length)];
}

// ── Achievements check ────────────────────────────────────────────────────────
function saveAchievementsToStorage(){
  try{
    const data=ACHIEVEMENTS.map(a=>({id:a.id,done:a.done}));
    localStorage.setItem('mecanicaze_ach_v3',JSON.stringify(data));
  }catch(e){}
}

function loadAchievementsFromStorage(){
  try{
    const raw=localStorage.getItem('mecanicaze_ach_v3');
    if(!raw)return;
    JSON.parse(raw).forEach(ad=>{
      const a=ACHIEVEMENTS.find(x=>x.id===ad.id);
      if(a&&ad.done)a.done=true;
    });
  }catch(e){}
}

function checkAchievements(){
  ACHIEVEMENTS.forEach(a=>{
    if(a.done)return;
    try{
      if(a.req()){
        a.done=true;
        money+=a.reward;
        showToast(`🏅 CONQUISTA: ${a.emoji} ${a.name}! +$${a.reward}`);
        if(typeof showAchievementToast === "function") showAchievementToast(a);
        SFX.missionComplete();
        spawnParticles(viewW/2,viewH/3,"#ffd700",25);
        saveAchievementsToStorage();
      }
    }catch(e){}
  });
}
window.checkAchievements = checkAchievements;

// ── Cars arrays ────────────────────────────────────────────────────────────────
const cars=[];
const particles=[];
const floatTexts=[];
const helpers=[];
const speechBubbles=[]; // v2: client speech bubbles

// Missions (expanded)
const missions=[
  {text:"🔧 Consertar 5 carros",     done:false,target:5,   type:"fix",    progress:0, reward:300},
  {text:"💰 Ganhar $1000",           done:false,target:1000,type:"money",  progress:0, reward:300},
  {text:"⭐ Fama Respeitada (50)",   done:false,target:50,  type:"rep",    progress:0, reward:400},
  {text:"🚗 Atender 10 carros",      done:false,target:10,  type:"cars",   progress:0, reward:400},
  {text:"🌟 Fama Popular (100)",     done:false,target:100, type:"rep",    progress:0, reward:600},
  {text:"🚚 Consertar 3 caminhões",  done:false,target:3,   type:"trucks", progress:0, reward:500},
  {text:"🏍️ Consertar 5 motos",     done:false,target:5,   type:"motos",  progress:0, reward:400},
  {text:"🌧️ Consertos na chuva (5)",done:false,target:5,   type:"rain",   progress:0, reward:500},
  {text:"🏆 Fama Famosa (200)",      done:false,target:200, type:"rep",    progress:0, reward:900},
  {text:"🔥 Fama Lendária (500)",    done:false,target:500, type:"rep",    progress:0, reward:1500},
  {text:"👑 Fama Imortal (1000)",    done:false,target:1000,type:"rep",    progress:0, reward:3000},
];

// Car problems — expanded with chain failures
const problems=[
  {name:"Motor",         emoji:"⚙️", time:180,base:150,parts:2,color:"#ef4444", chainProbs:["Óleo","Superaquecimento"]},
  {name:"Freio",         emoji:"🛑", time:100,base:80, parts:1,color:"#f97316", chainProbs:["Pneu"]},
  {name:"Pneu",          emoji:"🔄", time:60, base:50, parts:1,color:"#eab308", chainProbs:[]},
  {name:"Elétrica",      emoji:"⚡", time:140,base:120,parts:2,color:"#60a5fa", chainProbs:["Bateria"]},
  {name:"Óleo",          emoji:"🛢️", time:80, base:60, parts:1,color:"#84cc16", chainProbs:[]},
  {name:"Transmissão",   emoji:"⚙️", time:200,base:200,parts:3,color:"#a78bfa", chainProbs:["Motor","Correia"]},
  {name:"Bateria",       emoji:"🔋", time:90, base:95, parts:1,color:"#facc15", chainProbs:["Elétrica"]},
  {name:"Superaquecimento",emoji:"🌡️",time:130,base:130,parts:2,color:"#f87171", chainProbs:["Radiador"]},
  {name:"Aquaplanagem",  emoji:"💧", time:70, base:65, parts:1,color:"#38bdf8", chainProbs:["Pneu"], weatherOnly:"rain"},
  {name:"Correia",       emoji:"🔗", time:160,base:175,parts:2,color:"#c084fc", chainProbs:[]},
  {name:"Farol",         emoji:"💡", time:55, base:45, parts:1,color:"#fde68a", chainProbs:[]},
  {name:"Radiador",      emoji:"💨", time:110,base:110,parts:2,color:"#fb7185", chainProbs:[]},
];

const carColors=["#e11d48","#2563eb","#059669","#d97706","#7c3aed","#0891b2","#be185d","#374151","#f5f5f5","#92400e"];

// ── Camera & player ────────────────────────────────────────────────────────────
const camera={x:0,y:0};
const player={x:400,y:600,w:22,h:32,dir:"down",frame:0,frameTimer:0};
const keys={};

// ── Garage layout — EXPANDED ──────────────────────────────────────────────────
const bays=[
  // Row 1
  {x:100, y:120,w:150,h:90,car:null,label:"Baia 1"},
  {x:340, y:120,w:150,h:90,car:null,label:"Baia 2"},
  {x:580, y:120,w:150,h:90,car:null,label:"Baia 3"},
  {x:820, y:120,w:150,h:90,car:null,label:"Baia 4"},
  {x:1060,y:120,w:150,h:90,car:null,label:"Baia 5"},
  // Row 2
  {x:100, y:320,w:150,h:90,car:null,label:"Baia 6"},
  {x:340, y:320,w:150,h:90,car:null,label:"Baia 7"},
  {x:580, y:320,w:150,h:90,car:null,label:"Baia 8"},
  {x:820, y:320,w:150,h:90,car:null,label:"Baia 9"},
  {x:1060,y:320,w:150,h:90,car:null,label:"Baia 10"},
];
const bench={x:80,y:720,w:280,h:65};
const shelf={x:700,y:720,w:180,h:65};
const waitArea={x:100,y:1020,w:1300,h:70};
const desk={x:1350,y:680,w:110,h:90};
const partsShopArea={x:950,y:720,w:200,h:80}; // NEW parts shop counter
const cantineArea={x:400,y:840,w:160,h:80};   // Cantina — faixa central, abaixo dos balcões

let spawnTimer=0,spawnDelay=1800;

// Upgrade definitions — expanded
const upgradesList=[

  // ════════════════════════════════════════
  {section:"🔧 FERRAMENTAS"},
  // ════════════════════════════════════════
  {id:"tool1",   name:"🔧 Chave de Impacto",    desc:"Reparo mais rápido + velocidade",        cost:300,  bought:false,
    fn:()=>{staminaDrain=Math.max(0.02,staminaDrain*0.8);playerSpeed+=0.5;}},

  {id:"tool2",   name:"🛠️ Kit Profissional",    desc:"2× velocidade de conserto",              cost:700,  reqFame:10, bought:false, req:"tool1",
    fn:()=>{toolQuality=2;}},

  {id:"tool2b",  name:"⚙️ Kit Master",          desc:"3× velocidade de conserto",              cost:1400, reqFame:50, bought:false, req:"tool2",
    fn:()=>{toolQuality=3;}},

  {id:"tool3",   name:"🤖 Scanner OBD",          desc:"Mostra custo estimado no diagnóstico",   cost:500,  bought:false,
    fn:()=>{diagnosticLevel=2;}},

  {id:"tool4",   name:"🔬 Scanner Pro",           desc:"Revela falhas em cadeia",                cost:900,  reqFame:25, bought:false, req:"tool3",
    fn:()=>{diagnosticLevel=3;}},

  {id:"tool5",   name:"🧲 Macaco Hidráulico",    desc:"Reduz stamina gasta por conserto",        cost:600,  reqFame:10, bought:false,
    fn:()=>{staminaDrain=Math.max(0.015,staminaDrain*0.6);}},

  // ════════════════════════════════════════
  {section:"📦 ESTOQUE & PEÇAS"},
  // ════════════════════════════════════════
  {id:"parts1",  name:"📦 Estoque Ampliado",     desc:"Capacidade 40 peças",                    cost:400,  bought:false,
    fn:()=>{maxParts=40;parts=Math.min(parts+20,40);}},

  {id:"parts1b", name:"🗄️ Depósito Grande",      desc:"Capacidade 80 peças",                    cost:900,  reqFame:25, bought:false, req:"parts1",
    fn:()=>{maxParts=80;parts=Math.min(parts+40,80);}},

  {id:"parts2",  name:"🚚 Pedido Automático",    desc:"Reabastece peças sozinho",                cost:800,  reqFame:50, bought:false, req:"parts1",
    fn:()=>{hasAutoOrder=true;}},

  {id:"shop1",   name:"🏪 Loja de Peças",        desc:"Balcão de peças específicas por problema",cost:500,  reqFame:10, bought:false,
    fn:()=>{document.getElementById("parts-shop-hint").style.display="block";}},

  {id:"shop2",   name:"💲 Desconto Fornecedor",  desc:"Peças da loja 25% mais baratas",          cost:750,  reqFame:50, bought:false, req:"shop1",
    fn:()=>{PART_TYPES.forEach(p=>{p.cost=Math.max(10,Math.floor(p.cost*0.75));});}},

  // ════════════════════════════════════════
  {section:"🏗️ GARAGEM"},
  // ════════════════════════════════════════
  {id:"bay1",    name:"🏗️ Baias Extras",         desc:"Desbloqueia a fileira 2. Com Fama 200+, +1 baia por dia a partir do dia 6",          cost:600,  bought:false,
    fn:()=>{ window._bay1Bought = true; showToast("🏗️ Fileira 2 desbloqueada! Ganhe Fama 200+ para expandir mais."); }},

  {id:"ilum1",   name:"💡 Iluminação LED",        desc:"+15% velocidade de trabalho noturno",     cost:450,  reqFame:10, bought:false,
    fn:()=>{window._nightSpeedBonus=1.15;}},

  {id:"piso1",   name:"🪥 Piso Epóxi",           desc:"Zé anda 20% mais rápido",                cost:350,  bought:false,
    fn:()=>{playerSpeed=Math.min(7,playerSpeed*1.2);}},

  {id:"piso2",   name:"🛤️ Trilhos de Serviço",   desc:"Zé anda 30% mais rápido (máx)",          cost:800,  reqFame:25, bought:false, req:"piso1",
    fn:()=>{playerSpeed=Math.min(8,playerSpeed*1.3);}},

  // ════════════════════════════════════════
  {section:"❤️ BEM-ESTAR DO ZÉ"},
  // ════════════════════════════════════════
  {id:"speed1",  name:"⚡ Suplemento Energia",   desc:"Stamina drena menos e regenera mais",     cost:350,  bought:false,
    fn:()=>{staminaDrain*=0.7;staminaRegen*=1.3;}},

  {id:"speed2",  name:"🏋️ Academia",             desc:"Stamina máxima +50",                      cost:700,  reqFame:25, bought:false, req:"speed1",
    fn:()=>{maxStamina+=50;stamina=Math.min(stamina+50,maxStamina);}},

  {id:"cantine", name:"🍔 Cantina",              desc:"Construa uma cantina na oficina. Requer 🔧 Fama 25.", cost:400, reqFame:25, bought:false, reqFame:25,
    fn:()=>{hasCantine=true;document.getElementById("cantine-hint").style.display="block";}},

  {id:"cantine2",name:"👨‍🍳 Chef Contratado",     desc:"Fome drena 40% mais devagar",            cost:650,  reqFame:50, bought:false, req:"cantine",
    fn:()=>{hungerDrain*=0.6;}},

  {id:"thermos", name:"☕ Garrafa Térmica",       desc:"Recupera 10 de stamina ao passar pela bancada",cost:300, bought:false,
    fn:()=>{window._thermosBonus=true;}},

  // ════════════════════════════════════════
  {section:"📣 NEGÓCIO & REPUTAÇÃO"},
  // ════════════════════════════════════════
  {id:"rep1",    name:"📢 Propaganda",           desc:"Carros chegam mais rápido",               cost:250,  bought:false,
    fn:()=>{spawnDelay=Math.max(600,spawnDelay-300);}},

  {id:"rep1b",   name:"📱 Redes Sociais",        desc:"Intervalo de spawn ainda menor",          cost:550,  reqFame:25, bought:false, req:"rep1",
    fn:()=>{spawnDelay=Math.max(400,spawnDelay-250);}},

  {id:"rep2",    name:"⭐ Garantia 1 Ano",       desc:"+50% fama por serviço",                   cost:500,  reqFame:50, bought:false,
    fn:()=>{reputationMult=1.5;}},

  {id:"rep3",    name:"🏆 Certificação INMETRO", desc:"2× fama por serviço",                     cost:1200, reqFame:100, bought:false, req:"rep2",
    fn:()=>{reputationMult=2.0;}},

  {id:"viproom", name:"👑 Sala VIP",             desc:"Clientes VIP chegam 2× mais",             cost:900,  reqFame:100, bought:false,
    fn:()=>{window._vipMult=2;}},

  {id:"loyal1",  name:"🤝 Cartão Fidelidade",    desc:"Clientes fiéis têm 2× mais paciência",    cost:600,  reqFame:50, bought:false,
    fn:()=>{window._loyalPatienceMult=2;}},

  // ════════════════════════════════════════
  {section:"👷 EQUIPE"},
  // ════════════════════════════════════════
  {id:"helper",  name:"👷 Assistente",           desc:"Ajudante com IA que conserta sozinho",    cost:1000, reqFame:50, bought:false,
    fn:()=>{hasHelper=true;spawnHelper();}},

  {id:"helper2", name:"👷👷 2º Assistente",      desc:"Segundo ajudante na oficina",             cost:1800, reqFame:200, bought:false, req:"helper",
    fn:()=>{spawnHelper();}},

  {id:"radio",   name:"📻 Rádio da Oficina",     desc:"Equipe trabalha mais animada (+10% speed)", cost:300, reqFame:25, bought:false,
    fn:()=>{playerSpeed=Math.min(8,playerSpeed+0.3);helpers.forEach(h=>{h._speedBonus=1.1;});}},

  // ════════════════════════════════════════
  {section:"🌦️ CLIMA & AMBIENTE"},
  // ════════════════════════════════════════
  {id:"weather1",  name:"🌂 Kit Anti-Chuva",        desc:"Na chuva: +20% pagamento por conserto",    cost:450,  bought:false,
    fn:()=>{window._rainPayBonus=1.20;}},

  {id:"weather2",  name:"⛈️ Proteção Tempestade",   desc:"Carros não saem mais cedo na tempestade",  cost:800,  reqFame:50, bought:false, req:"weather1",
    fn:()=>{window._stormPatienceBonus=1.35;}},

  {id:"weather3",  name:"☀️ Toldo Solar",           desc:"No sol forte: stamina não drena ao andar", cost:550,  reqFame:25, bought:false,
    fn:()=>{window._solarToldo=true;}},

  {id:"weather4",  name:"🌡️ Ar-Condicionado",       desc:"Stamina regenera 2× mais rápido no calor", cost:700,  reqFame:100, bought:false,
    fn:()=>{window._acBonus=true;}},

  // ════════════════════════════════════════
  {section:"🚗 ESPECIALIZAÇÃO DE VEÍCULOS"},
  // ════════════════════════════════════════
  {id:"spec_moto", name:"🏍️ Oficina de Motos",      desc:"Motos pagam +46% e chegam mais",          cost:400,  reqFame:10, bought:false,
    fn:()=>{const m=VEHICLE_TYPES.find(v=>v.id==='moto');if(m){m.payMult=0.95;m.freq=Math.min(0.32,m.freq+0.12);}}},

  {id:"spec_truck",name:"🚚 Pátio de Caminhões",    desc:"Caminhões pagam +25% e têm mais paciência",cost:650,  reqFame:50, bought:false,
    fn:()=>{const t=VEHICLE_TYPES.find(v=>v.id==='truck');if(t){t.payMult=Math.min(4,t.payMult*1.25);t.patienceMult=1.3;}}},

  {id:"spec_lux",  name:"🏎️ Atendimento Premium",   desc:"Luxo paga +30% e VIPs chegam +20% mais",  cost:900,  reqFame:100, bought:false,
    fn:()=>{const l=VEHICLE_TYPES.find(v=>v.id==='luxury');if(l)l.payMult=Math.min(5,l.payMult*1.3);window._vipMult=(window._vipMult||1)*1.2;}},

  {id:"spec_bus",  name:"🚐 Garagem de Vans",        desc:"Vans aparecem com o dobro de frequência",  cost:350,  reqFame:25, bought:false,
    fn:()=>{const b=VEHICLE_TYPES.find(v=>v.id==='bus');if(b)b.freq=Math.min(0.15,b.freq*2);}},

  // ════════════════════════════════════════
  {section:"🧑‍🤝‍🧑 GESTÃO DE CLIENTES"},
  // ════════════════════════════════════════
  {id:"client1",   name:"😤 Treinamento Urgências", desc:"Apressados ficam 50% mais pacientes",       cost:400,  bought:false,
    fn:()=>{const r=CLIENT_PERSONALITIES.find(p=>p.id==='rushed');if(r)r.patienceMult=Math.min(1.2,r.patienceMult+0.5);}},

  {id:"client2",   name:"😊 Área de Espera",        desc:"Todos clientes com +25% de paciência",      cost:500,  reqFame:50, bought:false,
    fn:()=>{CLIENT_PERSONALITIES.forEach(p=>{p.patienceMult=Math.min(2.5,p.patienceMult*1.25);});}},

  {id:"client3",   name:"😠 Manual do Reclamão",    desc:"Reclamões pagam igual a clientes normais",  cost:350,  reqFame:25, bought:false,
    fn:()=>{const c=CLIENT_PERSONALITIES.find(p=>p.id==='complainer');if(c){c.payMult=1.0;c.negReview=false;}}},

  {id:"client4",   name:"💳 Programa de Pontos",    desc:"Clientes fiéis pagam +25% a mais",          cost:550,  reqFame:100, bought:false,
    fn:()=>{const l=CLIENT_PERSONALITIES.find(p=>p.id==='loyal');if(l)l.payMult=Math.min(2,l.payMult*1.25);}},

  // ════════════════════════════════════════
  {section:"⏰ HORÁRIO & OPERAÇÃO"},
  // ════════════════════════════════════════
  {id:"hours1",    name:"🌙 Turno Noturno",         desc:"Loja fecha às 22h ao invés de 20h",        cost:600,  reqFame:100, bought:false,
    fn:()=>{window._extendedHours=true;}},

  {id:"hours2",    name:"🌅 Abertura Antecipada",   desc:"Loja abre às 6h ao invés de 8h",           cost:500,  reqFame:50, bought:false,
    fn:()=>{window._earlyOpen=true;}},

  {id:"hours3",    name:"📆 Plantão aos Finais",    desc:"Loja abre nos finais de semana (+30% spawn)",cost:700, reqFame:200, bought:false,
    fn:()=>{window._weekendBonus=true;spawnDelay=Math.max(350,spawnDelay-200);}},

  // ════════════════════════════════════════
  {section:"🏦 FINANÇAS"},
  // ════════════════════════════════════════
  {id:"fin1",      name:"💳 Maquininha de Cartão",  desc:"Recebe +8% em todos os pagamentos",        cost:300,  bought:false,
    fn:()=>{window._cardBonus=(window._cardBonus||1)*1.08;}},

  {id:"fin2",      name:"🏦 Conta Empresarial",     desc:"Recebe +15% em todos os pagamentos",       cost:700,  reqFame:50, bought:false, req:"fin1",
    fn:()=>{window._cardBonus=(window._cardBonus||1)*1.15;}},

  {id:"fin3",      name:"📊 Contabilidade",         desc:"Bônus no relatório diário +$300",          cost:450,  reqFame:25, bought:false,
    fn:()=>{window._dayReportBonus=300;}},

  {id:"fin4",      name:"💰 Cofre Seguro",          desc:"Missões completadas dão +$300 extra",       cost:500,  reqFame:100, bought:false,
    fn:()=>{window._missionMoneyBonus=300;}},

  // ════════════════════════════════════════
  {section:"🔗 CADEIA DE FALHAS"},
  // ════════════════════════════════════════
  {id:"chain1",    name:"🔍 Inspeção Prévia",        desc:"Diagnóstico revela se o carro tem falhas em cadeia", cost:400, reqFame:25, bought:false,
    fn:()=>{window._chainHint=true;}},

  {id:"chain2",    name:"💥 Bônus Cascata",          desc:"Cada falha em cadeia encontrada vale +$60 (era +$30)", cost:700, reqFame:100, bought:false, req:"chain1",
    fn:()=>{window._chainValueMult=2;}},

  {id:"chain3u",   name:"🔬 Análise Profunda",       desc:"Chance de detectar falhas em cadeia sobe para 80%", cost:900, reqFame:200, bought:false, req:"chain2",
    fn:()=>{window._chainChance=0.8;}},

  // ════════════════════════════════════════
  {section:"😡 RETENÇÃO DE CLIENTES"},
  // ════════════════════════════════════════
  {id:"ret1",      name:"🔔 Campainha de Aviso",     desc:"Clientes avisam antes de ir embora (toast + som)", cost:300, bought:false,
    fn:()=>{window._patienceWarn=true;}},

  {id:"ret2",      name:"🙏 Pedido de Desculpas",    desc:"Perde metade da fama ao perder cliente (era tudo)", cost:550, reqFame:50, bought:false,
    fn:()=>{window._halfRepLoss=true;}},

  {id:"ret3",      name:"🎁 Voucher de Desconto",    desc:"Cliente que vai embora volta depois com 50% de desconto na paciência extra", cost:700, reqFame:100, bought:false, req:"ret1",
    fn:()=>{window._voucherReturn=true;}},

  // ════════════════════════════════════════
  {section:"⚡ AÇÕES & COOLDOWN"},
  // ════════════════════════════════════════
  {id:"cool1",     name:"🏃 Reflexos Apurados",      desc:"Cooldown entre consertos cai 25%",              cost:350, bought:false,
    fn:()=>{window._cooldownMult=0.75;}},

  {id:"cool2",     name:"⚡ Modo Turbo",             desc:"Cooldown entre consertos cai 50%",              cost:750, reqFame:50, bought:false, req:"cool1",
    fn:()=>{window._cooldownMult=0.5;}},

  {id:"diag1",     name:"🎯 Diagnóstico Rápido",     desc:"Cooldown de diagnóstico cai à metade",          cost:300, bought:false,
    fn:()=>{window._diagCooldownMult=0.5;}},

  {id:"fix_stamina",name:"💪 Luvas de Proteção",     desc:"Consertos gastam 30% menos stamina",            cost:400, reqFame:10, bought:false,
    fn:()=>{window._fixStaminaMult=0.7;}},

  // ════════════════════════════════════════
  {section:"🍕 ALIMENTAÇÃO AVANÇADA"},
  // ════════════════════════════════════════
  {id:"food1",     name:"🧃 Isotônico",              desc:"Nova opção na cantina: +30 stamina por $25",    cost:300, reqFame:25, bought:false, req:"cantine",
    fn:()=>{foodItems.push({name:"🧃 Isotônico",cost:25,hunger:30,stamina:30});}},

  {id:"food2",     name:"🥗 Cardápio Fitness",       desc:"Marmita agora recupera fome + 20 de stamina",   cost:500, reqFame:50, bought:false, req:"cantine",
    fn:()=>{const m=foodItems.find(f=>f.name.includes("Marmita"));if(m)m.staminaBonus=20;}},

  {id:"food3",     name:"🍫 Barra de Proteína",      desc:"Nova opção: recupera 15 fome + 40 stamina por $20", cost:450, reqFame:100, bought:false, req:"food1",
    fn:()=>{foodItems.push({name:"🍫 Barra Proteína",cost:20,hunger:15,stamina:40});}},

  // ════════════════════════════════════════
  {section:"🌟 FAMA & REPUTAÇÃO AVANÇADA"},
  // ════════════════════════════════════════
  {id:"fame1",     name:"📸 Foto com o Zé",          desc:"Clientes satisfeitos geram +1 fama extra",       cost:400, reqFame:50, bought:false,
    fn:()=>{window._fameBonusPerFix=1;}},

  {id:"fame2",     name:"🗞️ Artigo no Jornal",       desc:"Clientes satisfeitos geram +2 fama extra",       cost:800, reqFame:100, bought:false, req:"fame1",
    fn:()=>{window._fameBonusPerFix=2;}},

  {id:"fame3",     name:"📺 Reportagem na TV",        desc:"Clientes satisfeitos geram +4 fama extra",       cost:1500, reqFame:200, bought:false, req:"fame2",
    fn:()=>{window._fameBonusPerFix=4;}},

  {id:"fame_vip",  name:"🤩 Reviews de 5 Estrelas",  desc:"VIPs e Luxo geram +3 fama extra por conserto",   cost:600, reqFame:100, bought:false,
    fn:()=>{window._vipFameBonus=3;}},

  // ════════════════════════════════════════
  {section:"🚘 PEÇAS & QUALIDADE"},
  // ════════════════════════════════════════
  {id:"parts_q1",  name:"🔩 Peças de Qualidade",     desc:"Consertos precisam de 1 peça a menos (mín. 1)",  cost:600, reqFame:50, bought:false,
    fn:()=>{window._partsDiscount=1;}},

  {id:"parts_q2",  name:"🏭 Fornecedor Nacional",    desc:"Peças genéricas custam $20 ao invés de $30",     cost:500, reqFame:25, bought:false,
    fn:()=>{window._restockCost=20;}},

  {id:"parts_q3",  name:"🌐 Fornecedor Importado",   desc:"Todas as peças da loja 50% mais baratas",        cost:1100, reqFame:200, bought:false, req:"shop2",
    fn:()=>{PART_TYPES.forEach(p=>{p.cost=Math.max(8,Math.floor(p.cost*0.5));});}},

  // ════════════════════════════════════════
  {section:"🤖 IA DO AJUDANTE"},
  // ════════════════════════════════════════
  {id:"ai1",       name:"📡 Rádio Comunicador",      desc:"Ajudante reabastece peças automaticamente (todo 3 min)", cost:500, reqFame:100, bought:false, req:"helper",
    fn:()=>{window._helperAutoRestock=true;}},

  {id:"ai2",       name:"🧠 IA Aprimorada",          desc:"Ajudante conserta 2× mais rápido",               cost:900, reqFame:200, bought:false, req:"helper",
    fn:()=>{window._helperSpeedMult=2;}},

  {id:"ai3",       name:"👓 Óculos de Diagnóstico",  desc:"Ajudante diagnostica na metade do tempo",         cost:600, reqFame:100, bought:false, req:"helper",
    fn:()=>{window._helperDiagSpeed=2;}},
];

// ── Estado derivado de upgrades ──────────────────────────────────────────────
// Algumas melhorias alteram objetos/flags globais. Sem restaurar estes valores,
// Novo Jogo e carregamentos na mesma sessão podiam herdar efeitos antigos.
const _BASE_VEHICLE_TYPES = VEHICLE_TYPES.map(v=>({...v}));
const _BASE_CLIENT_PERSONALITIES = CLIENT_PERSONALITIES.map(v=>({...v}));
const _BASE_PART_TYPES = PART_TYPES.map(v=>({...v}));
const _BASE_FOOD_ITEMS = foodItems.map(v=>({...v}));

function resetDerivedUpgradeState(){
  VEHICLE_TYPES.forEach((v,i)=>{ const b=_BASE_VEHICLE_TYPES[i]; Object.keys(v).forEach(k=>delete v[k]); Object.assign(v,b); });
  CLIENT_PERSONALITIES.forEach((v,i)=>{ const b=_BASE_CLIENT_PERSONALITIES[i]; Object.keys(v).forEach(k=>delete v[k]); Object.assign(v,b); });
  PART_TYPES.forEach((v,i)=>{ const b=_BASE_PART_TYPES[i]; Object.keys(v).forEach(k=>delete v[k]); Object.assign(v,b); });
  foodItems.length=0; _BASE_FOOD_ITEMS.forEach(f=>foodItems.push({...f}));
  Object.assign(window, {
    _bay1Bought:false,_nightSpeedBonus:1,_thermosBonus:false,_vipMult:1,_loyalPatienceMult:1,
    _rainPayBonus:1,_stormPatienceBonus:1,_solarToldo:false,_acBonus:false,
    _extendedHours:false,_earlyOpen:false,_weekendBonus:false,_cardBonus:1,
    _dayReportBonus:0,_missionMoneyBonus:0,_chainHint:false,_chainValueMult:1,_chainChance:0.35,
    _patienceWarn:false,_halfRepLoss:false,_voucherReturn:false,_cooldownMult:1,_diagCooldownMult:1,
    _fixStaminaMult:1,_fameBonusPerFix:0,_vipFameBonus:0,_partsDiscount:0,_restockCost:30,
    _helperAutoRestock:false,_helperSpeedMult:1,_helperDiagSpeed:1
  });
  const ph=document.getElementById('parts-shop-hint'); if(ph) ph.style.display='none';
  const ch=document.getElementById('cantine-hint'); if(ch) ch.style.display='none';
}

function restoreDerivedUpgradeState(){
  resetDerivedUpgradeState();
  const bought=id=>!!upgradesList.find(u=>u.id===id && u.bought);
  if(bought('shop1')){const e=document.getElementById('parts-shop-hint');if(e)e.style.display='block';}
  if(bought('shop2')) PART_TYPES.forEach(p=>p.cost=Math.max(10,Math.floor(p.cost*0.75)));
  if(bought('bay1')) window._bay1Bought=true;
  if(bought('ilum1')) window._nightSpeedBonus=1.15;
  if(bought('cantine')){const e=document.getElementById('cantine-hint');if(e)e.style.display='block';}
  if(bought('thermos')) window._thermosBonus=true;
  if(bought('viproom')) window._vipMult=2;
  if(bought('loyal1')) window._loyalPatienceMult=2;
  if(bought('weather1')) window._rainPayBonus=1.20;
  if(bought('weather2')) window._stormPatienceBonus=1.35;
  if(bought('weather3')) window._solarToldo=true;
  if(bought('weather4')) window._acBonus=true;
  if(bought('spec_moto')){const v=VEHICLE_TYPES.find(v=>v.id==='moto');if(v){v.payMult=0.95;v.freq=Math.min(0.32,v.freq+0.12);}}
  if(bought('spec_truck')){const v=VEHICLE_TYPES.find(v=>v.id==='truck');if(v){v.payMult=Math.min(4,v.payMult*1.25);v.patienceMult=1.3;}}
  if(bought('spec_lux')){const v=VEHICLE_TYPES.find(v=>v.id==='luxury');if(v)v.payMult=Math.min(5,v.payMult*1.3);window._vipMult*=1.2;}
  if(bought('spec_bus')){const v=VEHICLE_TYPES.find(v=>v.id==='bus');if(v)v.freq=Math.min(0.15,v.freq*2);}
  if(bought('client1')){const v=CLIENT_PERSONALITIES.find(v=>v.id==='rushed');if(v)v.patienceMult=Math.min(1.2,v.patienceMult+0.5);}
  if(bought('client2')) CLIENT_PERSONALITIES.forEach(v=>v.patienceMult=Math.min(2.5,v.patienceMult*1.25));
  if(bought('client3')){const v=CLIENT_PERSONALITIES.find(v=>v.id==='complainer');if(v){v.payMult=1.0;v.negReview=false;}}
  if(bought('client4')){const v=CLIENT_PERSONALITIES.find(v=>v.id==='loyal');if(v)v.payMult=Math.min(2,v.payMult*1.25);}
  if(bought('hours1')) window._extendedHours=true;
  if(bought('hours2')) window._earlyOpen=true;
  if(bought('hours3')) window._weekendBonus=true;
  if(bought('fin1')) window._cardBonus*=1.08;
  if(bought('fin2')) window._cardBonus*=1.15;
  if(bought('fin3')) window._dayReportBonus=300;
  if(bought('fin4')) window._missionMoneyBonus=300;
  if(bought('chain1')) window._chainHint=true;
  if(bought('chain2')) window._chainValueMult=2;
  if(bought('chain3u')) window._chainChance=0.8;
  if(bought('ret1')) window._patienceWarn=true;
  if(bought('ret2')) window._halfRepLoss=true;
  if(bought('ret3')) window._voucherReturn=true;
  if(bought('cool1')) window._cooldownMult=0.75;
  if(bought('cool2')) window._cooldownMult=0.5;
  if(bought('diag1')) window._diagCooldownMult=0.5;
  if(bought('fix_stamina')) window._fixStaminaMult=0.7;
  if(bought('food1')) foodItems.push({name:'🧃 Isotônico',cost:25,hunger:30,stamina:30});
  if(bought('food2')){const f=foodItems.find(f=>f.name.includes('Marmita'));if(f)f.staminaBonus=20;}
  if(bought('food3')) foodItems.push({name:'🍫 Barra Proteína',cost:20,hunger:15,stamina:40});
  if(bought('fame1')) window._fameBonusPerFix=1;
  if(bought('fame2')) window._fameBonusPerFix=2;
  if(bought('fame3')) window._fameBonusPerFix=4;
  if(bought('fame_vip')) window._vipFameBonus=3;
  if(bought('parts_q1')) window._partsDiscount=1;
  if(bought('parts_q2')) window._restockCost=20;
  if(bought('parts_q3')) PART_TYPES.forEach(p=>p.cost=Math.max(8,Math.floor(p.cost*0.5)));
  if(bought('ai1')) window._helperAutoRestock=true;
  if(bought('ai2')) window._helperSpeedMult=2;
  if(bought('ai3')) window._helperDiagSpeed=2;
}
window.restoreDerivedUpgradeState=restoreDerivedUpgradeState;
window.resetDerivedUpgradeState=resetDerivedUpgradeState;

function spawnHelper(){
  helpers.push({x:450,y:420,w:20,h:30,dir:"down",frame:0,frameTimer:0,skin:"#f5cba7",shirt:"#3b82f6",task:null,taskTimer:0});
}

// ── Upgrade tabs ───────────────────────────────────────────────────────────────
// Cada seção é mapeada para uma das 3 abas
const UPGRADE_TAB_MAP = {
  // 🔧 OFICINA — ferramentas, estrutura e mecânica direta
  "🔧 FERRAMENTAS":               "oficina",
  "📦 ESTOQUE & PEÇAS":           "oficina",
  "🏗️ GARAGEM":                   "oficina",
  "🚘 PEÇAS & QUALIDADE":         "oficina",
  "⚡ AÇÕES & COOLDOWN":          "oficina",
  "🔗 CADEIA DE FALHAS":          "oficina",

  // 🏪 NEGÓCIO — clientes, dinheiro, reputação e operação
  "📣 NEGÓCIO & REPUTAÇÃO":        "negocio",
  "🌟 FAMA & REPUTAÇÃO AVANÇADA":  "negocio",
  "🏦 FINANÇAS":                   "negocio",
  "🧑‍🤝‍🧑 GESTÃO DE CLIENTES":    "negocio",
  "😡 RETENÇÃO DE CLIENTES":       "negocio",
  "🚗 ESPECIALIZAÇÃO DE VEÍCULOS": "negocio",
  "⏰ HORÁRIO & OPERAÇÃO":         "negocio",
  "🌦️ CLIMA & AMBIENTE":           "negocio",

  // 👨‍👩‍👧 EQUIPE & VIDA — o Zé e quem trabalha com ele
  "❤️ BEM-ESTAR DO ZÉ":           "equipe",
  "🍕 ALIMENTAÇÃO AVANÇADA":      "equipe",
  "👷 EQUIPE":                    "equipe",
  "🤖 IA DO AJUDANTE":            "equipe",
};

const UPGRADE_TAB_TITLES = {
  oficina: "🔧 OFICINA",
  negocio: "🏪 NEGÓCIO",
  equipe:  "👨‍👩‍👧 EQUIPE & VIDA",
};

let _currentUpgradeTab = "oficina";

function switchUpgradeTab(tab) {
  _currentUpgradeTab = tab;
  // Atualiza botões ativos
  ["oficina","negocio","equipe"].forEach(t => {
    const btn = document.getElementById("tab-btn-" + t);
    if (btn) btn.classList.toggle("active", t === tab);
  });
  // Abre o painel se não estiver aberto
  const panel = document.getElementById("upgrade-panel");
  panel.classList.add("open");
  renderUpgradePanel();
  SFX.uiClick();
}
window.switchUpgradeTab = switchUpgradeTab;

function renderUpgradePanel() {
  const body  = document.getElementById("upgrade-panel-body");
  const title = document.getElementById("upgrade-panel-title");
  if (!body) return;
  body.innerHTML = "";
  if (title) title.textContent = UPGRADE_TAB_TITLES[_currentUpgradeTab] || "UPGRADES";

  const FAME_LABELS = {0:"",10:"🔩",25:"🔧",50:"⭐",100:"🌟",200:"💫",350:"🏆",500:"🔥",700:"💎",900:"👑",1000:"⚡👑"};

  let currentSectionTab = null;
  upgradesList.forEach(u => {
    if (u.section) {
      currentSectionTab = UPGRADE_TAB_MAP[u.section] || "oficina";
      if (currentSectionTab === _currentUpgradeTab) {
        body.innerHTML += `<div class="upgrade-section">${u.section}</div>`;
      }
      return;
    }
    if (currentSectionTab !== _currentUpgradeTab) return;

    const req       = u.req ? upgradesList.find(x => x.id === u.req) : null;
    const fameLock  = u.reqFame && reputation < u.reqFame;
    const locked    = (req && !req.bought) || fameLock;
    const cls       = u.bought ? "maxed" : (locked || money < u.cost ? "disabled" : "");

    // Linha de fama necessária
    let fameTag = "";
    if (!u.bought && u.reqFame) {
      const lbl   = FAME_LABELS[u.reqFame] || "⭐";
      const color = fameLock ? "#ef4444" : "#34d399";
      const check = fameLock ? "" : "✔ ";
      fameTag = `<span style="font-size:10px;color:${color}">${check}${lbl} Fama ${u.reqFame}</span><br>`;
    }

    const priceColor = u.bought ? "#34d399" : (money < u.cost ? "#ef4444" : "#fbbf24");
    const priceLabel = u.bought ? "✔ COMPRADO" : "$" + u.cost;

    body.innerHTML += `<button class="upgrade-btn ${cls}" onclick="buyUpgrade('${u.id}')">
      ${u.name}<br>
      <span style="font-size:11px;color:#888">${u.desc}</span><br>
      ${fameTag}<span style="color:${priceColor}">${priceLabel}</span>
    </button>`;
  });
}

// togglePanel agora apenas fecha o painel (clicar fora ou re-clicar na aba ativa)
function togglePanel() {
  const panel = document.getElementById("upgrade-panel");
  const isOpen = panel.classList.contains("open");
  if (isOpen) {
    panel.classList.remove("open");
  } else {
    panel.classList.add("open");
    renderUpgradePanel();
  }
  SFX.uiClick();
}
window.togglePanel = togglePanel;


function buyUpgrade(id){
  const u=upgradesList.find(x=>x.id===id);if(!u||u.bought)return;
  const req=u.req?upgradesList.find(x=>x.id===u.req):null;
  if(req&&!req.bought){showToast("Desbloqueie o anterior primeiro!");return;}
  if(u.reqFame&&reputation<u.reqFame){
    const tier=getFameTier(u.reqFame);
    showToast(`Precisa de ${tier.emoji} Fama ${u.reqFame} — ${tier.name}!`);
    SFX.error();return;
  }
  if(money<u.cost){showToast("Sem grana! 💸");return;}
  money-=u.cost;u.bought=true;u.fn();
  SFX.upgradeBuy();
  EventBus.emit('upgrade:bought', { id: u.id, name: u.name });
  showToast(`${u.name} comprado! ✅`);updateHUD();renderUpgradePanel();
}
window.buyUpgrade=buyUpgrade;

// ── Personality helper ─────────────────────────────────────────────────────────
function pickPersonality(isVIP){
  if(isVIP) return CLIENT_PERSONALITIES.find(p=>p.id==="vip");
  const roll=Math.random();
  let acc=0;
  for(const p of CLIENT_PERSONALITIES){if(p.id==="vip")continue;acc+=p.freq;if(roll<acc)return p;}
  return CLIENT_PERSONALITIES[0];
}

// ── Speech bubbles ─────────────────────────────────────────────────────────────
const SPEECH_LINES={
  rushed:["Rápido, tô atrasado!","Meu chefe vai me matar!","Apressado aqui!"],
  complainer:["Que demora...","Péssimo serviço!","Vou dar 1 estrela!"],
  loyal:["Confio em você, Zé!","Sempre venho aqui!","Pode caprichar!"],
  vip:["Dinheiro não é problema.","Só o melhor!","Sou cliente premium."],
  normal:["Pode deixar, Zé!","Obrigado!","Bom serviço!"],
};
function spawnSpeech(car,pId){
  const lines=SPEECH_LINES[pId]||SPEECH_LINES.normal;
  const text=lines[Math.floor(Math.random()*lines.length)];
  speechBubbles.push({x:car.x,y:car.y,text,life:1,timer:180,carId:car.id});
}

// ── Car spawn ──────────────────────────────────────────────────────────────────
// Retorna quantas baias estão ativas com base no dia e fama
function getActiveBayCount() {
  // Sem bay1 comprado: apenas fileira 1 (5 baias)
  if (!window._bay1Bought) return 5;

  const day = Math.floor(tick / (24 * 60 * 4)) + 1;
  // Base após comprar bay1: 6 baias (fileira 2 desbloqueada)
  let active = 6;
  // A partir do dia 6, com fama > 200, +1 baia por dia extra
  if (day >= 6 && reputation > 200) {
    active = 6 + (day - 6); // dia 6 = 6, dia 7 = 7... até o máximo de baias
  }
  return Math.min(active, bays.length);
}

function spawnCar(){
  const activeBayCount = getActiveBayCount();
  const freeBay=bays.slice(0, activeBayCount).find(b=>!b.car);if(!freeBay)return;

  // Pick vehicle type
  const roll=Math.random();
  let acc=0,vtype=VEHICLE_TYPES[0];
  for(const v of VEHICLE_TYPES){acc+=v.freq;if(roll<acc){vtype=v;break;}}

  // Pick problem — weather can add specific problems
  let availProbs=[...problems];
  if(weatherState!=="rain"&&weatherState!=="storm") availProbs=availProbs.filter(p=>!p.weatherOnly);
  if(weatherState==="rain"||weatherState==="storm"){
    // Double chance of aquaplaning
    for(let i=0;i<2;i++)availProbs.push(problems.find(p=>p.name==="Aquaplanagem"));
  }
  const prob={...availProbs[Math.floor(Math.random()*availProbs.length)]};

  // Personality
  const _vipMult=window._vipMult||1;const isVIP=vtype.id==="luxury"||Math.random()<getFameVipChance()*_vipMult;
  const personality=pickPersonality(isVIP||vtype.id==="luxury");

  const patienceBase=(isVIP?3200:2400)+Math.random()*1600;
  const _loyalMult=(personality.id==="loyal"&&window._loyalPatienceMult)?window._loyalPatienceMult:1;
  const car={
    x:freeBay.x,y:freeBay.y,
    w:vtype.sizeW||freeBay.w,
    h:vtype.sizeH||freeBay.h,
    color:isVIP?"#ffd700":carColors[Math.floor(Math.random()*carColors.length)],
    problem:{...prob},
    chainProblems:[], // discovered chain failures
    diagnosed:false,fixed:false,
    workProgress:0,maxWork:prob.time/(toolQuality),
    patience:1,maxPatience:patienceBase*getFamePatienceBonus()*personality.patienceMult*getWeather().patienceMult*_loyalMult*(weatherState==="storm"&&window._stormPatienceBonus?window._stormPatienceBonus:1)*(window._diffPatienceMult||1),
    patienceTimer:0,bay:freeBay,
    id:Math.random(),
    needsParts:prob.parts,
    isVIP,
    vtype,
    personality,
    arrivedTick:tick,
  };
  freeBay.car=car;cars.push(car);
  SFX.carArrive();
  EventBus.emit('car:arrive', { car });
  document.getElementById("carcount").textContent=cars.filter(c=>!c.fixed).length;
  updateHUD();
  if(isVIP){spawnFloatText(freeBay.x+freeBay.w/2,freeBay.y,"👑 VIP!","#ffd700");}
  if(vtype.id==="truck")spawnFloatText(freeBay.x+freeBay.w/2,freeBay.y-15,"🚚 CAMINHÃO!","#fb923c");
  if(personality.id!=="normal")spawnSpeech(car,personality.id);
  spawnParticles(freeBay.x+freeBay.w/2,freeBay.y+freeBay.h/2,isVIP?"#ffd700":"#e8820a",isVIP?12:6);
}

// ── Player near object ─────────────────────────────────────────────────────────
function nearBay(){
  for(const b of bays){
    if(!b.car)continue;
    const dx=player.x+player.w/2-(b.x+b.w/2);
    const dy=player.y+player.h/2-(b.y+b.h/2);
    if(Math.hypot(dx,dy)<130)return b;
  }return null;
}
function nearShelf(){
  const dx=player.x+player.w/2-(shelf.x+shelf.w/2);
  const dy=player.y+player.h/2-(shelf.y+shelf.h/2);
  return Math.hypot(dx,dy)<100;
}
function nearDesk(){
  const dx=player.x+player.w/2-(desk.x+desk.w/2);
  const dy=player.y+player.h/2-(desk.y+desk.h/2);
  return Math.hypot(dx,dy)<100;
}
function nearCantine(){
  if(!hasCantine)return false;
  return nearCantineArea();
}
function nearCantineArea(){
  const dx=player.x+player.w/2-(cantineArea.x+cantineArea.w/2);
  const dy=player.y+player.h/2-(cantineArea.y+cantineArea.h/2);
  return Math.hypot(dx,dy)<100;
}
function buyCantineInWorld(){
  const u=upgradesList.find(x=>x.id==="cantine");
  if(!u||u.bought)return;
  if(reputation<(u.reqFame||0)){showToast(`Precisa de 🔧 Fama ${u.reqFame} para construir a Cantina!`);return;}
  if(money<u.cost){showToast("Sem grana! 💸 Precisa de $"+u.cost);return;}
  money-=u.cost;u.bought=true;u.fn();
  SFX.upgradeBuy();
  EventBus.emit('cantina:buy', {});
  EventBus.emit('upgrade:bought', { id: 'cantine', name: '🍔 Cantina' });
  showToast("🍔 Cantina construída! ✅");updateHUD();renderUpgradePanel();
}

// ── Actions ────────────────────────────────────────────────────────────────────
let actionCooldown=0;
let fixingCar=null,fixTimer=0;

function doFix(){
  if(actionCooldown>0||stamina<5)return;
  const bay=nearBay();
  if(!bay||!bay.car){SFX.error();showToast("Nenhum carro aqui! 🚗");return;}
  const car=bay.car;
  if(!car.diagnosed){SFX.error();showToast("Diagnostique primeiro! 🔍");return;}
  if(car.fixed){SFX.error();showToast("Já consertado! ✅");return;}

  // Check if we have the right parts
  const prob=car.problem;
  const partNeeded=PART_TYPES.find(pt=>pt.forProblems.includes(prob.name));
  if(partNeeded && upgradesList.find(u=>u.id==="shop1")?.bought){
    const have=partInventory[partNeeded.id]||0;
    const _actualNeeds=Math.max(1,car.needsParts-(window._partsDiscount||0));
  if(have<_actualNeeds){
      SFX.error();
      showToast(`Precisa de ${car.needsParts}x ${partNeeded.emoji} ${partNeeded.name}! Compre na loja.`);
      return;
    }
    // Consume specific parts
    partInventory[partNeeded.id]-=_actualNeeds;
  } else {
    // Fallback generic parts
    const _gNeeds=Math.max(1,car.needsParts-(window._partsDiscount||0));
    if(parts<_gNeeds){SFX.error();showToast(`Peças insuficientes! Precisa de ${_gNeeds} 📦`);return;}
  }

  fixingCar=car;fixTimer=0;
  stamina=Math.max(0,stamina-12*(window._fixStaminaMult||1));
  hunger=Math.max(0,hunger-3);
  actionCooldown=Math.floor(20*(window._cooldownMult||1));
  SFX.wrench();
  spawnParticles(car.x+car.w/2,car.y+car.h/2,"#fbbf24",8);
  spawnFloatText(car.x+car.w/2,car.y,"🔧 Consertando..","#fbbf24");
  const _nightBonus=(window._nightSpeedBonus&&(Math.floor(gameMinute/60)%24>=20||Math.floor(gameMinute/60)%24<8))?window._nightSpeedBonus:1;
  car.workProgress+=20*_nightBonus;
  if(car.workProgress>=car.maxWork){completeFix(car,bay);}
  else{showToast(`${car.problem.emoji} Progresso: ${Math.floor(car.workProgress/car.maxWork*100)}%`);}
}

function completeFix(car,bay){
  if(car.fixed)return;
  car.fixed=true;bay.car=null;

  // Consume generic parts if specific not used
  const prob=car.problem;
  const partNeeded=PART_TYPES.find(pt=>pt.forProblems.includes(prob.name));
  if(!(partNeeded && upgradesList.find(u=>u.id==="shop1")?.bought)){
    parts-=car.needsParts;
  }

  // Bonuses
  const priceBonus=getFamePriceBonus();
  const vm=car.vtype?car.vtype.payMult:1;
  const pm=car.personality?car.personality.payMult:1;
  // Rushed bonus if fixed fast
  let speedBonus=1;
  if(car.personality?.id==="rushed"&&car.patience>0.6){speedBonus=1.3;spawnFloatText(car.x+car.w/2,car.y-30,"⚡ RÁPIDO! +30%","#facc15");}
  // Bônus clima
  const _wstate=weatherState;
  const _rainPay=(window._rainPayBonus&&(_wstate==="rain"||_wstate==="storm"))?window._rainPayBonus:1;
  const _cardPay=window._cardBonus||1;
  const earn=Math.floor((car.problem.base*reputationMult*priceBonus*vm*pm*speedBonus+(car.patience>0?(car.patience*0.5|0):0))*_rainPay*_cardPay*(window._diffMoneyMult||1));
  const rm=car.personality?car.personality.repMult:1;
  const rep=Math.round(calcRepGain(car.problem,car.vtype)*rm);

  // Chain failure detection (scanner pro)
  let chainBonus=0;
  if(diagnosticLevel>=3&&car.problem.chainProbs&&car.problem.chainProbs.length>0){
    const chainChance=window._chainChance||0.5;
    const found=car.problem.chainProbs.filter(()=>Math.random()<chainChance);
    if(found.length>0){
      const chainVal=30*(window._chainValueMult||1);
      chainBonus=found.length*chainVal;
      maxChainFound=Math.max(maxChainFound,found.length);
      spawnFloatText(car.x+car.w/2,car.y-45,`💥 +${found.length} falha(s)! +$${chainBonus}`,"#fb923c");
    }
  }

  const earned=(earn+chainBonus)|0;
  // Bônus de fama por upgrade
  let extraRep=window._fameBonusPerFix||0;
  if((car.isVIP||car.vtype?.id==="luxury")&&window._vipFameBonus) extraRep+=window._vipFameBonus;
  money+=earned;totalMoneyEarned+=earned;reputation+=(rep+extraRep);fixCount++;carsDone++;

  // Counters for achievements
  if(car.isVIP)vipCount++;
  if(weatherState==="rain"||weatherState==="storm")rainFixes++;
  if(car.vtype?.id==="truck")truckFixes++;
  if(car.vtype?.id==="moto")motoFixes++;
  if(car.personality?.id==="loyal")loyalCount++;

  spawnParticles(car.x+car.w/2,car.y+car.h/2,"#34d399",12);
  spawnParticles(car.x+car.w/2,car.y+car.h/2,"#fbbf24",8);
  spawnFloatText(car.x+car.w/2,car.y,`+$${earned} ✅`,"#34d399");
  spawnFloatText(car.x+car.w/2,car.y-20,`+${rep}⭐`,"#fbbf24");
  SFX.fixComplete();
  setTimeout(()=>SFX.cashRegister(),350);
  EventBus.emit('car:fixed', { car, money: earned, rep });
  showToast(`${car.problem.emoji} ${car.problem.name} consertado! +$${earned} +${rep}⭐`);
  checkTierUp();checkAchievements();
  updateHUD();checkMissions();renderUpgradePanel();
  setTimeout(()=>{const i=cars.indexOf(car);if(i>-1)cars.splice(i,1);},100);
}

function doDiagnose(){
  if(actionCooldown>0)return;
  const bay=nearBay();
  if(!bay||!bay.car){showToast("Nenhum carro perto! 🚗");return;}
  const car=bay.car;
  if(car.diagnosed){showToast(`Já diagnosticado: ${car.problem.emoji} ${car.problem.name}`);return;}
  car.diagnosed=true;actionCooldown=Math.floor(30*(window._diagCooldownMult||1));
  SFX.diagnose();
  spawnFloatText(car.x+car.w/2,car.y,`🔍 ${car.problem.emoji} ${car.problem.name}`,"#60a5fa");
  showToast(`Problema: ${car.problem.emoji} ${car.problem.name} — Peças: ${car.problem.parts}`);
  if(diagnosticLevel>=2){showToast(`Custo estimado: $${car.problem.base} 💰`);}
  if(diagnosticLevel>=3&&car.problem.chainProbs?.length>0){
    const chains=car.problem.chainProbs;
    showToast(`💥 Falhas em cadeia detectadas: ${chains.join(", ")}!`);
    spawnFloatText(car.x+car.w/2,car.y-30,`⚠️ +${chains.length} falha(s)!`,"#fb923c");
  }
}

function doRestock(){
  if(!nearShelf()){return;}
  if(parts>=maxParts){showToast("Estoque cheio! 📦");return;}
  const cost=Math.floor((window._restockCost||30)*(window._diffPartsCostMult||1))*(maxParts-parts);
  if(money<cost){showToast(`Precisa de $${cost} para reabastecer! 💸`);return;}
  money-=cost;parts=maxParts;
  SFX.restock();
  showToast("📦 Peças reabastecidas!");updateHUD();renderUpgradePanel();
  spawnParticles(shelf.x+shelf.w/2,shelf.y,"#60a5fa",8);
}

function doEat(itemIdx){
  if(!nearCantine()){showToast("Vá até a Cantina! 🍔");return;}
  const item=foodItems[itemIdx]||foodItems[0];
  if(money<item.cost){showToast(`Sem grana para ${item.name}! 💸`);return;}
  money-=item.cost;
  hunger=Math.min(maxHunger,hunger+item.hunger);
  if(item.stamina){stamina=Math.min(maxStamina,stamina+item.stamina);}
  if(item.staminaBonus){stamina=Math.min(maxStamina,stamina+item.staminaBonus);}
  SFX.uiClick();
  const _eatExtra=item.stamina||item.staminaBonus;
  showToast(`${item.name} comido! +${item.hunger}🍔${_eatExtra?" +"+_eatExtra+"⚡":""}`);
  updateHUD();
  spawnParticles(player.x+player.w/2,player.y,"#84cc16",6);
  spawnFloatText(player.x+player.w/2,player.y-20,`${item.name} +${item.hunger}🍴`,"#84cc16");
}
window.doEat=doEat;
window.openPartsShop=openPartsShop;

// ── Particles & float texts ────────────────────────────────────────────────────
function spawnParticles(x,y,color,n=6){
  if(window._particlesEnabled === false) return;
  const q = window._graphicsQuality || 'media';
  if(q === 'baixa') n = Math.max(1, Math.ceil(n * 0.35));
  else if(q === 'media') n = Math.max(1, Math.ceil(n * 0.7));
  for(let i=0;i<n;i++){
    const a=Math.random()*Math.PI*2,s=1+Math.random()*2.5;
    particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,r:2+Math.random()*3,color,life:1,type:"spark"});
  }
}
function spawnFloatText(x,y,text,color){floatTexts.push({x,y,text,color,life:1,vy:-0.6});}
function showToast(msg){
  const t=document.getElementById("toast");t.textContent=msg;t.style.opacity=1;
  clearTimeout(t._to);t._to=setTimeout(()=>{t.style.opacity=0;},2200);
}

// ── HUD ────────────────────────────────────────────────────────────────────────
function updateHUD(){
  document.getElementById("money").textContent="$"+money;
  const tier=getFameTier(reputation);
  const repEl=document.getElementById("rep");
  repEl.textContent=`${tier.emoji} ${reputation} — ${tier.name}`;
  const repBox=repEl.closest(".hud-box");
  if(repBox){repBox.style.borderColor=tier.color;repBox.style.color=tier.color;repBox.style.textShadow=`0 0 10px ${tier.color}cc`;repBox.style.boxShadow=`0 0 8px ${tier.color}33`;}
  const prog=getFameProgress(reputation);
  const bar=document.getElementById("fame-bar-fill");
  if(bar){bar.style.width=(prog*100)+"%";bar.style.background=`linear-gradient(90deg,${tier.color}88,${tier.color})`;}
  const fameNext=document.getElementById("fame-next");
  if(fameNext){const tidx=getFameTierIndex(reputation);const next=FAME_TIERS[tidx+1];fameNext.textContent=next?`→ ${next.emoji}${next.name} (${next.min}⭐)`:"👑 MÁXIMO!";}
  document.getElementById("carcount").textContent=cars.filter(c=>!c.fixed).length;
  document.getElementById("fixcount").textContent=fixCount;
  document.getElementById("partscount").textContent=parts+"/"+maxParts;
  document.getElementById("stamina-fill").style.width=(stamina/maxStamina*100)+"%";
  const h=Math.floor(gameMinute/60)%24,m=gameMinute%60;
  document.getElementById("gametime").textContent=`${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}`;
  // Weather indicator
  const wEl=document.getElementById("weather-hud");
  if(wEl){const w=getWeather();wEl.textContent=`${w.icon} ${w.label}`;}
  // Hunger bar
  const hfill=document.getElementById("hunger-fill");
  if(hfill){hfill.style.width=(hunger/maxHunger*100)+"%";hfill.style.background=hunger>50?"#84cc16":hunger>25?"#fbbf24":"#ef4444";}
}

// ── Missions ──────────────────────────────────────────────────────────────────
function checkMissions(){
  const list=document.getElementById("tasks-list");list.innerHTML="";
  missions.forEach(m=>{
    if(!m.done){
      if(m.type==="fix")m.progress=fixCount;
      if(m.type==="money")m.progress=totalMoneyEarned;
      if(m.type==="rep")m.progress=reputation;
      if(m.type==="cars")m.progress=carsDone;
      if(m.type==="trucks")m.progress=truckFixes;
      if(m.type==="motos")m.progress=motoFixes;
      if(m.type==="rain")m.progress=rainFixes;
      if(m.progress>=m.target){m.done=true;SFX.missionComplete();const mBonus=(m.reward||500)+(window._missionMoneyBonus||0);money+=mBonus;showToast("🏆 MISSÃO COMPLETA: "+m.text+" +$"+mBonus);spawnParticles(viewW/2,viewH/2,"#fbbf24",20);}
    }
    const pct=Math.min(1,m.progress/m.target);
    list.innerHTML+=`<div class="task-item${m.done?" done":""}">
      ${m.text}<div class="task-bar"><div class="task-fill" style="width:${pct*100}%"></div></div>
    </div>`;
  });
}
checkMissions();

// ── Day/Night ─────────────────────────────────────────────────────────────────
let _wasOpen=true;
function updateDayNight(){
  const h=(Math.floor(gameMinute/60))%24;
  const dn=document.getElementById("daynight");
  if(h>=8&&h<18)dn.style.background="transparent";
  else if(h>=18&&h<20)dn.style.background="rgba(20,10,0,0.35)";
  else dn.style.background="rgba(0,0,20,0.55)";
  const nowOpen=isOpen();
  if(nowOpen!==_wasOpen){
    if(nowOpen)SFX.shopOpen(); else{SFX.shopClose();buildDayReport();if(typeof BillsSystem!=="undefined")BillsSystem.tick_update();setTimeout(showProgressionTips,2000);}
    _wasOpen=nowOpen;
  }
}

// ── Camera ────────────────────────────────────────────────────────────────────
function tx(x){return x-camera.x;}
function ty(y){return y-camera.y;}

// ── PRE-RENDER: concrete tile texture ─────────────────────────────────────────
const _floorTile=(()=>{
  const sz=80,oc=document.createElement("canvas");oc.width=sz;oc.height=sz;
  const ox=oc.getContext("2d");
  ox.fillStyle="#1e1a14";ox.fillRect(0,0,sz,sz);
  const g=ox.createLinearGradient(0,0,sz,sz);
  g.addColorStop(0,"#252018");g.addColorStop(0.5,"#2a2418");g.addColorStop(1,"#201c10");
  ox.fillStyle=g;ox.fillRect(3,3,sz-6,sz-6);
  ox.strokeStyle="rgba(0,0,0,0.6)";ox.lineWidth=3;ox.strokeRect(0,0,sz,sz);
  for(let i=0;i<30;i++){ox.fillStyle=`rgba(${Math.random()>0.5?40:10},${Math.random()>0.5?35:8},5,${Math.random()*0.15})`;ox.fillRect(Math.random()*sz,Math.random()*sz,2,2);}
  const sg=ox.createLinearGradient(0,0,sz,0);sg.addColorStop(0,"rgba(255,255,255,0.03)");sg.addColorStop(0.5,"rgba(255,255,255,0.06)");sg.addColorStop(1,"rgba(255,255,255,0.01)");ox.fillStyle=sg;ox.fillRect(3,3,sz-6,sz-6);
  return oc;
})();

// ── Draw functions ────────────────────────────────────────────────────────────
function drawFloor(){
  const pat=ctx.createPattern(_floorTile,"repeat");
  ctx.save();ctx.translate(-camera.x,-camera.y);
  ctx.fillStyle=pat;ctx.fillRect(0,0,shopW,shopH);
  ctx.restore();
  [[95,110,1300,10],[95,310,1300,10]].forEach(([lx,ly,lw,lh])=>{
    const lg=ctx.createLinearGradient(tx(lx),0,tx(lx+lw),0);
    lg.addColorStop(0,"rgba(232,180,10,0)");lg.addColorStop(0.1,"rgba(232,180,10,0.12)");lg.addColorStop(0.9,"rgba(232,180,10,0.12)");lg.addColorStop(1,"rgba(232,180,10,0)");
    ctx.fillStyle=lg;ctx.fillRect(tx(lx),ty(ly),lw,lh);
  });
  const stains=[[200,220,38,18,0.4],[550,185,28,14,0.3],[900,425,40,20,0.5],[300,520,32,16,0.35],[700,380,35,18,0.4],[1200,250,25,12,0.25],[150,610,30,14,0.3],[600,650,42,22,0.45],[440,310,20,10,0.2],[1000,550,35,18,0.3]];
  stains.forEach(([sx,sy,rx,ry,rot])=>{
    ctx.save();ctx.globalAlpha=0.18;
    const g=ctx.createRadialGradient(tx(sx),ty(sy),0,tx(sx),ty(sy),rx);
    g.addColorStop(0,"rgba(5,3,0,0.9)");g.addColorStop(0.6,"rgba(10,5,0,0.5)");g.addColorStop(1,"rgba(0,0,0,0)");
    ctx.fillStyle=g;ctx.beginPath();ctx.ellipse(tx(sx),ty(sy),rx,ry,rot,0,Math.PI*2);ctx.fill();ctx.restore();
  });
}

function drawWalls(){
  const wallGrad=ctx.createLinearGradient(0,ty(0),0,ty(60));
  wallGrad.addColorStop(0,"#0a0800");wallGrad.addColorStop(1,"#2a2010");
  ctx.fillStyle=wallGrad;ctx.fillRect(tx(0),ty(0),shopW,55);
  const bH=14,bW=36;
  for(let row=0;row<3;row++){
    const off=row%2===0?0:bW/2;
    for(let col=-1;col<Math.ceil(shopW/bW)+1;col++){
      const bx2=tx(col*bW+off),by2=ty(row*bH+2);
      if(bx2>viewW+bW||bx2<-bW)continue;
      ctx.fillStyle=row===0?"#1a1206":row===1?"#181005":"#1e1508";
      ctx.fillRect(bx2+1,by2+1,bW-2,bH-2);
      ctx.strokeStyle="rgba(0,0,0,0.5)";ctx.lineWidth=1;ctx.strokeRect(bx2,by2,bW,bH);
    }
  }
  [0,shopW-14].forEach(wx=>{
    const wg=ctx.createLinearGradient(tx(wx),0,tx(wx+14),0);
    wg.addColorStop(0,wx===0?"#0a0800":"#1a1208");wg.addColorStop(1,wx===0?"#1a1208":"#0a0800");
    ctx.fillStyle=wg;ctx.fillRect(tx(wx),ty(0),14,shopH);
  });
  const doorPositions=[110,380,650,920,1190];
  doorPositions.forEach(gx=>{
    const dw=140,dh=48;
    const isAnyCarInBay=bays.some(b=>Math.abs(b.x-gx)<20&&b.car&&!b.car.fixed);
    ctx.fillStyle="#0d0d0d";ctx.fillRect(tx(gx-4),ty(-2),dw+8,dh+6);
    const dg=ctx.createLinearGradient(tx(gx),ty(0),tx(gx),ty(dh));
    dg.addColorStop(0,"#484848");dg.addColorStop(1,"#282828");
    ctx.fillStyle=dg;ctx.fillRect(tx(gx),ty(0),dw,dh);
    for(let s=0;s<6;s++){
      const sy2=ty(s*8+1);
      ctx.fillStyle=s%2===0?"rgba(255,255,255,0.04)":"rgba(0,0,0,0.1)";ctx.fillRect(tx(gx+2),sy2,dw-4,7);
      ctx.fillStyle="rgba(255,255,255,0.02)";ctx.fillRect(tx(gx+2),sy2,dw-4,2);
    }
    for(let r=0;r<5;r++){ctx.strokeStyle="rgba(0,0,0,0.3)";ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(tx(gx+28*r),ty(0));ctx.lineTo(tx(gx+28*r),ty(dh));ctx.stroke();}
    const lightColor=isAnyCarInBay?"#ef4444":"#22c55e";
    const lightPulse=isAnyCarInBay?0.6+0.4*Math.sin(tick*0.15):0.7+0.3*Math.sin(tick*0.05);
    ctx.fillStyle=withAlpha(lightColor,lightPulse);ctx.beginPath();ctx.arc(tx(gx+dw-10),ty(6),5,0,Math.PI*2);ctx.fill();
    ctx.fillStyle=withAlpha(lightColor,0.3*lightPulse);ctx.beginPath();ctx.arc(tx(gx+dw-10),ty(6),9,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle="rgba(100,80,40,0.6)";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(tx(gx),ty(dh));ctx.lineTo(tx(gx+dw),ty(dh));ctx.stroke();
  });
  const eg=ctx.createLinearGradient(0,ty(shopH-16),0,ty(shopH));
  eg.addColorStop(0,"rgba(0,0,0,0)");eg.addColorStop(1,"rgba(0,0,0,0.8)");
  ctx.fillStyle=eg;ctx.fillRect(tx(100),ty(shopH-16),1400,16);
  const lampPositions=[200,450,700,950,1250,1450];
  lampPositions.forEach(lx=>{
    const lx2=tx(lx),ly2=ty(55);
    ctx.fillStyle="#333";ctx.fillRect(lx2-30,ly2,60,8);ctx.fillStyle="#444";ctx.fillRect(lx2-28,ly2+2,56,4);
    const lg2=ctx.createRadialGradient(lx2,ly2+8,0,lx2,ly2+8,120);
    const h=Math.floor(gameMinute/60)%24;const dayBright=h>=8&&h<18?0.06:0.13;
    lg2.addColorStop(0,`rgba(255,240,200,${dayBright})`);lg2.addColorStop(0.4,`rgba(255,230,150,${dayBright*0.5})`);lg2.addColorStop(1,"rgba(255,200,100,0)");
    ctx.fillStyle=lg2;ctx.beginPath();ctx.moveTo(lx2-30,ly2+8);ctx.lineTo(lx2+30,ly2+8);ctx.lineTo(lx2+120,ly2+220);ctx.lineTo(lx2-120,ly2+220);ctx.closePath();ctx.fill();
    const flicker=0.8+0.2*Math.sin(tick*0.3+lx);ctx.fillStyle=`rgba(255,250,230,${flicker*0.9})`;ctx.fillRect(lx2-26,ly2+2,52,4);
  });
}

function drawRadio(){
  const radioUpgrade = upgradesList.find(u => u.id === 'radio');
  if (!radioUpgrade || !radioUpgrade.bought) return;

  // Posição: em cima da bancada, lado direito
  const rx = tx(bench.x + bench.w - 68);
  const ry = ty(bench.y - 32 - 28); // acima da bancada
  const rw = 52, rh = 24;

  // Sombra
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fillRect(rx + 3, ry + 4, rw, rh);

  // Corpo do rádio
  const rg = ctx.createLinearGradient(rx, ry, rx, ry + rh);
  rg.addColorStop(0, '#4a3520');
  rg.addColorStop(1, '#2a1a0a');
  ctx.fillStyle = rg;
  ctx.beginPath();
  ctx.roundRect(rx, ry, rw, rh, 4);
  ctx.fill();
  ctx.strokeStyle = '#8a5a20';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(rx, ry, rw, rh, 4);
  ctx.stroke();

  // Grade do alto-falante (lado esquerdo)
  ctx.fillStyle = '#1a0f05';
  ctx.fillRect(rx + 3, ry + 4, 18, rh - 8);
  ctx.strokeStyle = '#3a2510';
  ctx.lineWidth = 1;
  for (let g = 0; g < 5; g++) {
    ctx.beginPath();
    ctx.moveTo(rx + 3, ry + 5 + g * 3);
    ctx.lineTo(rx + 21, ry + 5 + g * 3);
    ctx.stroke();
  }

  // Botão de liga/desliga (pequeno círculo laranja)
  ctx.fillStyle = '#e8820a';
  ctx.beginPath();
  ctx.arc(rx + 27, ry + 8, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,200,100,0.6)';
  ctx.beginPath();
  ctx.arc(rx + 27, ry + 7, 1.5, 0, Math.PI * 2);
  ctx.fill();

  // Dial de frequência (retângulo pequeno com linha)
  ctx.fillStyle = '#111';
  ctx.fillRect(rx + 33, ry + 5, 14, 7);
  ctx.strokeStyle = '#fbbf24';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(rx + 38, ry + 5);
  ctx.lineTo(rx + 38, ry + 12);
  ctx.stroke();

  // Antena
  ctx.strokeStyle = '#8a8a8a';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(rx + rw - 6, ry);
  ctx.lineTo(rx + rw - 2, ry - 14);
  ctx.stroke();

  // Ondas sonoras animadas — pulsam com base no tick
  const on = SFX.isRadioOn();
  if (on) {
    const pulse = Math.sin(tick * 0.15) * 0.5 + 0.5; // 0..1
    const waves = [
      { r: 10, a: 0.5 },
      { r: 16, a: 0.32 },
      { r: 22, a: 0.18 },
    ];
    waves.forEach(({ r, a }, i) => {
      const phase = Math.sin(tick * 0.12 - i * 0.8) * 0.5 + 0.5;
      ctx.strokeStyle = `rgba(232,130,10,${a * (0.4 + phase * 0.6)})`;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      // Arco de onda à esquerda do rádio
      ctx.arc(rx - 2, ry + rh / 2, r, -Math.PI * 0.55, Math.PI * 0.55);
      ctx.stroke();
    });

    // Nota musical flutuante ocasional
    if (tick % 90 < 3) {
      const noteX = rx - 8 + Math.sin(tick * 0.05) * 6;
      const noteY = ry - 10 - ((tick % 90) * 0.4);
      ctx.font = '11px sans-serif';
      ctx.globalAlpha = 1 - (tick % 90) / 90;
      ctx.fillText(['♪','♫','♩'][Math.floor(tick / 90) % 3], noteX, noteY);
      ctx.globalAlpha = 1;
    }
  }

  // Label "FM" pequeno
  ctx.fillStyle = '#e8820a';
  ctx.font = "bold 7px 'VT323'";
  ctx.textAlign = 'center';
  ctx.fillText('FM', rx + rw / 2, ry + rh - 3);
}


function hasUpgradeVisual(id){const u=upgradesList.find(x=>x.id===id);return !!(u&&u.bought);}
function drawUpgradeDecorations(){
  const q=window._graphicsQuality||'media';
  // Piso epóxi: brilho sutil e linhas de acabamento.
  if(hasUpgradeVisual('piso1')){
    ctx.save();ctx.globalAlpha=q==='baixa'?.08:.14;ctx.fillStyle='#4aa3c7';ctx.fillRect(tx(40),ty(70),shopW-80,shopH-120);
    if(q!=='baixa'){ctx.strokeStyle='rgba(180,230,255,.16)';ctx.lineWidth=2;for(let y=180;y<shopH;y+=180){ctx.beginPath();ctx.moveTo(tx(60),ty(y));ctx.lineTo(tx(shopW-60),ty(y));ctx.stroke();}}
    ctx.restore();
  }
  // Iluminação LED visível na parede superior.
  if(hasUpgradeVisual('ilum1')){
    ctx.save();const glow=.55+.2*Math.sin(tick*.05);for(let x=170;x<shopW-100;x+=260){const sx=tx(x),sy=ty(92);if(sx<-120||sx>viewW+120)continue;ctx.fillStyle=`rgba(255,244,190,${glow*.18})`;ctx.fillRect(sx-30,sy-12,180,30);ctx.fillStyle='#fff2b0';ctx.fillRect(sx,sy,120,5);}ctx.restore();
  }
  // Ar-condicionado na parede.
  if(hasUpgradeVisual('weather4')){
    const x=tx(shopW-260),y=ty(120);ctx.save();ctx.fillStyle='#e5edf2';ctx.beginPath();ctx.roundRect(x,y,120,34,6);ctx.fill();ctx.fillStyle='#7aa2b8';ctx.fillRect(x+12,y+24,94,3);ctx.fillStyle='#5fd0ff';ctx.fillRect(x+98,y+7,8,5);ctx.restore();
  }
  // Toldo solar na entrada.
  if(hasUpgradeVisual('weather3')){
    const x=tx(80),y=ty(52);ctx.save();for(let i=0;i<6;i++){ctx.fillStyle=i%2?'#f5f5e8':'#d98a16';ctx.fillRect(x+i*42,y,42,28);}ctx.strokeStyle='rgba(0,0,0,.35)';ctx.strokeRect(x,y,252,28);ctx.restore();
  }
  // Sala VIP/área de espera melhorada.
  if(hasUpgradeVisual('viproom')||hasUpgradeVisual('client2')){
    const x=tx(shopW-390),y=ty(shopH-250);ctx.save();ctx.fillStyle='rgba(18,24,35,.86)';ctx.beginPath();ctx.roundRect(x,y,260,120,10);ctx.fill();ctx.strokeStyle=hasUpgradeVisual('viproom')?'#fbbf24':'#60a5fa';ctx.lineWidth=2;ctx.strokeRect(x,y,260,120);ctx.fillStyle='#ddd';ctx.font="bold 16px 'VT323'";ctx.textAlign='center';ctx.fillText(hasUpgradeVisual('viproom')?'👑 SALA VIP':'☕ ÁREA DE ESPERA',x+130,y+22);for(let i=0;i<3;i++){ctx.fillStyle='#374151';ctx.fillRect(x+30+i*72,y+62,52,28);ctx.fillStyle='#1f2937';ctx.fillRect(x+34+i*72,y+84,44,10);}ctx.restore();
  }
}

function drawBench(){
  const bx2=tx(bench.x),by2=ty(bench.y),bw=bench.w,bh=bench.h;
  [[5,bh-6],[bw-12,bh-6]].forEach(([lx,ly])=>{ctx.fillStyle="#1a1008";ctx.fillRect(bx2+lx,by2+ly,7,8);ctx.fillStyle="#2a1808";ctx.fillRect(bx2+lx+1,by2+ly+1,5,6);});
  ctx.fillStyle="rgba(0,0,0,0.35)";ctx.fillRect(bx2+6,by2+6,bw,bh*0.7);
  const bg=ctx.createLinearGradient(bx2,by2-30,bx2,by2);bg.addColorStop(0,"#1a1008");bg.addColorStop(1,"#2d1f0a");
  ctx.fillStyle=bg;ctx.fillRect(bx2,by2-32,bw,34);
  ctx.strokeStyle="#3d2a10";ctx.lineWidth=1;
  for(let pgx=0;pgx<bw;pgx+=8){for(let pgy=0;pgy<32;pgy+=8){ctx.strokeRect(bx2+pgx,by2-32+pgy,8,8);}}
  const sg2=ctx.createLinearGradient(bx2,by2,bx2,by2+bh*0.45);sg2.addColorStop(0,"#6b4a1e");sg2.addColorStop(1,"#4a3012");
  ctx.fillStyle=sg2;ctx.fillRect(bx2,by2,bw,bh*0.45);
  ctx.strokeStyle="rgba(0,0,0,0.12)";ctx.lineWidth=1;for(let g=0;g<bw;g+=12){ctx.beginPath();ctx.moveTo(bx2+g,by2);ctx.lineTo(bx2+g+3,by2+bh*0.45);ctx.stroke();}
  const fp=ctx.createLinearGradient(bx2,by2+bh*0.45,bx2,by2+bh);fp.addColorStop(0,"#3d2a10");fp.addColorStop(1,"#2a1a08");
  ctx.fillStyle=fp;ctx.fillRect(bx2,by2+bh*0.45,bw,bh*0.55);
  ctx.strokeStyle="#8a6030";ctx.lineWidth=2;ctx.strokeRect(bx2,by2,bw,bh);
  const toolIcons=[["🔧",30],["🔩",80],["🪛",130],["⚙️",180],["🔨",230]];
  toolIcons.forEach(([ico,ox2])=>{ctx.font="18px sans-serif";ctx.textAlign="center";ctx.fillText(ico,bx2+ox2,by2-12);ctx.strokeStyle="#555";ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(bx2+ox2,by2-6);ctx.lineTo(bx2+ox2,by2);ctx.stroke();});
  ctx.fillStyle="#e8820a";ctx.font="bold 15px 'VT323'";ctx.textAlign="center";ctx.fillText("🛠️  BANCADA",bx2+bw/2,by2+bh*0.3);
}

function drawPartsShelf(){
  const sx2=tx(shelf.x),sy2=ty(shelf.y),sw=shelf.w,sh=shelf.h;
  ctx.fillStyle="#1a1005";ctx.fillRect(sx2,sy2-20,sw,sh+20);
  ctx.strokeStyle="#3d2a10";ctx.lineWidth=1;for(let gr=0;gr<sw;gr+=16){ctx.beginPath();ctx.moveTo(sx2+gr,sy2-20);ctx.lineTo(sx2+gr,sy2+sh);ctx.stroke();}
  [0,0.33,0.66].forEach(row=>{
    const plankY=sy2-20+row*(sh+20)*0.8+8;
    const pg2=ctx.createLinearGradient(sx2,plankY,sx2,plankY+10);pg2.addColorStop(0,"#6b4a1e");pg2.addColorStop(1,"#4a3012");ctx.fillStyle=pg2;ctx.fillRect(sx2,plankY,sw,10);ctx.strokeStyle="#2a1808";ctx.lineWidth=1;ctx.strokeRect(sx2,plankY,sw,10);
  });
  const boxColors=["#ef4444","#3b82f6","#22c55e","#f59e0b","#8b5cf6"];
  const numBoxes=Math.ceil(parts/maxParts*8);
  for(let bi=0;bi<Math.min(numBoxes,8);bi++){
    const bx3=sx2+8+bi*(sw/9),by3=sy2+2;const bc=boxColors[bi%boxColors.length];
    ctx.fillStyle=bc;ctx.fillRect(bx3,by3,sw/10,14);ctx.fillStyle=lighten(bc,30);ctx.fillRect(bx3+1,by3+1,sw/10-4,5);ctx.strokeStyle="rgba(0,0,0,0.4)";ctx.lineWidth=1;ctx.strokeRect(bx3,by3,sw/10,14);
  }
  ctx.fillStyle="#2a1a0a";ctx.fillRect(sx2,sy2,sw,sh);ctx.strokeStyle="#b45309";ctx.lineWidth=2;ctx.strokeRect(sx2,sy2,sw,sh);
  ctx.fillStyle="#3d2a0a";ctx.fillRect(sx2+2,sy2+2,sw-4,12);
  const pct2=parts/maxParts;ctx.fillStyle="#111";ctx.fillRect(sx2+6,sy2+sh-12,sw-12,8);
  const barG=ctx.createLinearGradient(sx2+6,0,sx2+6+(sw-12)*pct2,0);barG.addColorStop(0,pct2>0.5?"#22c55e":pct2>0.25?"#fbbf24":"#ef4444");barG.addColorStop(1,pct2>0.5?"#16a34a":pct2>0.25?"#d97706":"#dc2626");
  ctx.fillStyle=barG;ctx.fillRect(sx2+6,sy2+sh-12,((sw-12)*pct2)|0,8);ctx.fillStyle="rgba(255,255,255,0.15)";ctx.fillRect(sx2+6,sy2+sh-12,((sw-12)*pct2)|0,3);
  ctx.fillStyle="#e8820a";ctx.font="bold 13px 'VT323'";ctx.textAlign="center";ctx.fillText(`📦 PEÇAS: ${parts}/${maxParts}`,sx2+sw/2,sy2+sh*0.55);
}

function drawPartsShopCounter(){
  const px=tx(partsShopArea.x),py=ty(partsShopArea.y),pw=partsShopArea.w,ph=partsShopArea.h;
  const isNear=nearShop();
  // Counter body
  const cg=ctx.createLinearGradient(px,py,px,py+ph);cg.addColorStop(0,"#1a2a1a");cg.addColorStop(1,"#0a1a0a");
  ctx.fillStyle=cg;ctx.fillRect(px,py,pw,ph);
  ctx.strokeStyle=isNear?"#22c55e":"#2a4a2a";ctx.lineWidth=isNear?2:1;ctx.strokeRect(px,py,pw,ph);
  // Top panel
  ctx.fillStyle="#2a4a2a";ctx.fillRect(px,py,pw,14);
  // Parts display boxes on counter
  const dispParts=PART_TYPES.slice(0,5);
  dispParts.forEach((p,i)=>{
    const bx=px+6+i*(pw/5.2);const by=py+16;
    const have=partInventory[p.id]||0;
    ctx.fillStyle=have>0?"#1a3a1a":"#1a1a1a";ctx.fillRect(bx,by,pw/5.5,ph-24);
    ctx.strokeStyle=have>0?"#22c55e":"#333";ctx.lineWidth=1;ctx.strokeRect(bx,by,pw/5.5,ph-24);
    ctx.font="12px sans-serif";ctx.textAlign="center";ctx.fillText(p.emoji,bx+pw/11,by+14);
    ctx.fillStyle=have>0?"#22c55e":"#555";ctx.font="bold 10px 'VT323'";ctx.fillText(have,bx+pw/11,by+26);
  });
  const pulse=isNear?0.7+0.3*Math.sin(tick*0.12):0.5;
  ctx.fillStyle=`rgba(34,197,94,${pulse})`;ctx.font="bold 14px 'VT323'";ctx.textAlign="center";
  ctx.fillText("🏪 LOJA DE PEÇAS",px+pw/2,py+ph+14);
  if(isNear){ctx.fillStyle="rgba(34,197,94,0.9)";ctx.font="11px 'VT323'";ctx.fillText("[E] Abrir Loja",px+pw/2,py+ph+26);}
}

function drawCantineArea(){
  const cx=tx(cantineArea.x),cy=ty(cantineArea.y),cw=cantineArea.w,ch=cantineArea.h;

  if(!hasCantine){
    const isNearBuy=nearCantineArea();
    const cantUpg=upgradesList.find(x=>x.id==="cantine");
    const canAfford=cantUpg&&money>=(cantUpg.cost||400);
    const hasFame=cantUpg&&reputation>=(cantUpg.reqFame||25);
    const pulseBuy=isNearBuy?0.6+0.4*Math.sin(tick*0.14):0.35;
    ctx.save();
    ctx.globalAlpha=isNearBuy?0.75:0.4;
    ctx.fillStyle="#1a0f05";ctx.fillRect(cx,cy,cw,ch);
    // Borda pulsante quando perto
    ctx.strokeStyle=isNearBuy?(canAfford&&hasFame?"#fbbf24":"#ef4444"):"#3a1f05";
    ctx.lineWidth=isNearBuy?2:1;ctx.strokeRect(cx,cy,cw,ch);
    ctx.fillStyle=isNearBuy?"#c8a060":"#5a3a10";ctx.font="bold 13px 'VT323'";ctx.textAlign="center";
    ctx.fillText("🍔 CANTINA",cx+cw/2,cy+ch/2-10);
    if(isNearBuy){
      ctx.font="11px 'VT323'";
      if(!hasFame){
        ctx.fillStyle="#ef4444";ctx.fillText(`🔧 Fama ${cantUpg.reqFame} necessária`,cx+cw/2,cy+ch/2+8);
        ctx.fillStyle="#888";ctx.fillText(`(você tem ${reputation})`,cx+cw/2,cy+ch/2+22);
      } else if(!canAfford){
        ctx.fillStyle="#ef4444";ctx.fillText(`Precisa de $${cantUpg.cost}`,cx+cw/2,cy+ch/2+8);
        ctx.fillStyle="#888";ctx.fillText(`(você tem $${Math.floor(money)})`,cx+cw/2,cy+ch/2+22);
      } else {
        ctx.fillStyle="#22c55e";ctx.fillText(`[E] Comprar — $${cantUpg.cost}`,cx+cw/2,cy+ch/2+8);
        ctx.fillStyle="rgba(251,191,36,0.9)";ctx.fillText("Clique aqui também!",cx+cw/2,cy+ch/2+22);
      }
      // Halo de destaque
      ctx.globalAlpha=0.1*pulseBuy;
      ctx.fillStyle=canAfford&&hasFame?"#fbbf24":"#ef4444";
      ctx.fillRect(cx-4,cy-4,cw+8,ch+8);
    } else {
      ctx.font="10px 'VT323'";ctx.fillStyle="#4a2a08";
      ctx.fillText("🏗️ Terreno disponível",cx+cw/2,cy+ch/2+8);
    }
    ctx.restore();
    // Label fora
    ctx.fillStyle=`rgba(180,120,40,${isNearBuy?0.9:0.45})`;ctx.font="bold 12px 'VT323'";ctx.textAlign="center";
    ctx.fillText("🍔 CANTINA",cx+cw/2,cy+ch+15);
    if(isNearBuy){ctx.fillStyle="rgba(255,255,255,0.7)";ctx.font="10px 'VT323'";ctx.fillText("Aproxime-se e pressione [E]",cx+cw/2,cy+ch+27);}
    return;
  }

  const isNear=nearCantine();
  const pulse=isNear?0.85+0.15*Math.sin(tick*0.14):0.6;

  // Sombra
  ctx.fillStyle="rgba(0,0,0,0.4)";ctx.fillRect(cx+4,cy+4,cw,ch);

  // Corpo principal — balcão de madeira escura
  const bg=ctx.createLinearGradient(cx,cy,cx,cy+ch);
  bg.addColorStop(0,"#3d2208");bg.addColorStop(0.5,"#2a1505");bg.addColorStop(1,"#1a0d03");
  ctx.fillStyle=bg;ctx.fillRect(cx,cy,cw,ch);

  // Faixa do topo (toldo)
  const toldoColors=["#c0392b","#e74c3c","#c0392b","#e74c3c","#c0392b"];
  const stripeW=cw/toldoColors.length;
  toldoColors.forEach((col,i)=>{ctx.fillStyle=col;ctx.fillRect(cx+i*stripeW,cy-8,stripeW,12);});
  ctx.fillStyle="rgba(0,0,0,0.5)";ctx.fillRect(cx,cy+4,cw,3);

  // Balcão (superfície)
  const counter=ctx.createLinearGradient(cx,cy+ch*0.55,cx,cy+ch);
  counter.addColorStop(0,"#5a3010");counter.addColorStop(1,"#3a1a08");
  ctx.fillStyle=counter;ctx.fillRect(cx,cy+ch*0.55,cw,ch*0.45);
  ctx.strokeStyle="#7a4a18";ctx.lineWidth=2;
  ctx.beginPath();ctx.moveTo(cx,cy+ch*0.55);ctx.lineTo(cx+cw,cy+ch*0.55);ctx.stroke();

  // Itens de comida na prateleira
  const foods=foodItems.slice(0,Math.min(foodItems.length,5));
  const iconSpacing=cw/(foods.length+1);
  foods.forEach((item,i)=>{
    const fx=cx+iconSpacing*(i+1);const fy=cy+ch*0.42;
    // mini prato
    ctx.fillStyle="rgba(255,255,255,0.15)";ctx.beginPath();ctx.ellipse(fx,fy+4,10,4,0,0,Math.PI*2);ctx.fill();
    ctx.font="15px sans-serif";ctx.textAlign="center";ctx.fillText(item.name.split(" ")[0],fx,fy);
    // preço
    ctx.fillStyle="rgba(251,191,36,0.8)";ctx.font="bold 9px 'VT323'";
    ctx.fillText("$"+item.cost,fx,fy+16);
  });

  // Borda com glow quando perto
  ctx.strokeStyle=isNear?`rgba(251,191,36,${pulse})`:"rgba(120,60,10,0.6)";
  ctx.lineWidth=isNear?2.5:1;ctx.strokeRect(cx,cy,cw,ch);

  if(isNear){
    // Halo de destaque
    ctx.save();ctx.globalAlpha=0.12*pulse;
    ctx.fillStyle="#fbbf24";ctx.fillRect(cx-4,cy-4,cw+8,ch+8);
    ctx.restore();
  }

  // Label
  const lp=isNear?pulse:0.55;
  ctx.fillStyle=`rgba(251,191,36,${lp})`;ctx.font="bold 13px 'VT323'";ctx.textAlign="center";
  ctx.fillText("🍔 CANTINA",cx+cw/2,cy+ch+15);

  if(isNear){
    ctx.fillStyle="rgba(255,255,255,0.85)";ctx.font="10px 'VT323'";
    // Mostra teclas dinamicamente baseado em quantos itens tem
    const keys=["[1]","[2]","[3]","[4]","[5]"];
    const labels=foodItems.slice(0,5).map((f,i)=>keys[i]+" "+f.name.split(" ")[0]).join("  ");
    ctx.fillText(labels,cx+cw/2,cy+ch+27);
    // Fome atual
    const hungerPct=Math.round(hunger/maxHunger*100);
    ctx.fillStyle=hunger>50?"#84cc16":hunger>25?"#fbbf24":"#ef4444";
    ctx.fillText("🍔 Fome: "+hungerPct+"%",cx+cw/2,cy-14);
  }
}

function drawDesk(){
  const dx2=tx(desk.x),dy2=ty(desk.y),dw=desk.w,dh=desk.h;
  ctx.fillStyle="rgba(0,0,0,0.3)";ctx.fillRect(dx2+5,dy2+5,dw,dh);
  [[4,dh-5],[dw-10,dh-5]].forEach(([lx,ly])=>{ctx.fillStyle="#1a1008";ctx.fillRect(dx2+lx,dy2+ly,6,8);});
  const dg2=ctx.createLinearGradient(dx2,dy2,dx2,dy2+dh);dg2.addColorStop(0,"#3d2a10");dg2.addColorStop(1,"#1a0f05");
  ctx.fillStyle=dg2;ctx.fillRect(dx2,dy2,dw,dh);
  const dt=ctx.createLinearGradient(dx2,dy2,dx2,dy2+12);dt.addColorStop(0,"#6b4a1e");dt.addColorStop(1,"#4a3012");
  ctx.fillStyle=dt;ctx.fillRect(dx2,dy2,dw,12);
  const screenGlow=ctx.createRadialGradient(dx2+dw/2,dy2+dh*0.55,0,dx2+dw/2,dy2+dh*0.55,30);
  screenGlow.addColorStop(0,"rgba(100,200,255,0.25)");screenGlow.addColorStop(1,"rgba(0,100,200,0)");
  ctx.fillStyle=screenGlow;ctx.beginPath();ctx.arc(dx2+dw/2,dy2+dh*0.55,28,0,Math.PI*2);ctx.fill();
  ctx.fillStyle="#0a1a2a";ctx.fillRect(dx2+dw*0.15,dy2+dh*0.2,dw*0.7,dh*0.4);
  const scanLine=tick%12;ctx.fillStyle="rgba(0,200,255,0.3)";ctx.fillRect(dx2+dw*0.15,dy2+dh*0.2+scanLine,dw*0.7,2);
  ctx.fillStyle="rgba(0,255,180,0.8)";ctx.font="bold 9px 'VT323'";ctx.textAlign="center";ctx.fillText("$$$",dx2+dw/2,dy2+dh*0.45);
  ctx.strokeStyle="#e8820a";ctx.lineWidth=2;ctx.strokeRect(dx2,dy2,dw,dh);
  ctx.fillStyle="#e8820a";ctx.font="bold 13px 'VT323'";ctx.textAlign="center";ctx.fillText("💵 CAIXA",dx2+dw/2,dy2+dh*0.85);
}

function drawWaitArea(){
  const wx2=tx(waitArea.x),wy2=ty(waitArea.y),ww=waitArea.w,wh=waitArea.h;
  ctx.save();ctx.globalAlpha=0.2;ctx.fillStyle="#e8820a";
  for(let ax=waitArea.x+60;ax<waitArea.x+ww-60;ax+=120){
    ctx.save();ctx.translate(tx(ax),ty(waitArea.y+wh/2));
    ctx.beginPath();ctx.moveTo(0,-10);ctx.lineTo(15,5);ctx.lineTo(5,5);ctx.lineTo(5,10);ctx.lineTo(-5,10);ctx.lineTo(-5,5);ctx.lineTo(-15,5);ctx.closePath();ctx.fill();ctx.restore();
  }
  ctx.restore();
  ctx.strokeStyle="rgba(232,130,10,0.4)";ctx.lineWidth=2;ctx.setLineDash([10,6]);ctx.strokeRect(wx2,wy2,ww,wh);ctx.setLineDash([]);
  const wg2=ctx.createLinearGradient(0,wy2,0,wy2+wh);wg2.addColorStop(0,"rgba(232,130,10,0.08)");wg2.addColorStop(1,"rgba(232,130,10,0.03)");
  ctx.fillStyle=wg2;ctx.fillRect(wx2,wy2,ww,wh);
  ctx.fillStyle="#e8820a";ctx.font="bold 13px 'VT323'";ctx.textAlign="center";ctx.fillText("🚗  FILA DE ESPERA  🚗",wx2+ww/2,wy2+wh/2+5);
}

function drawBay(b){
  const bx2=tx(b.x),by2=ty(b.y),bw=b.w,bh=b.h;
  const active=b.car&&!b.car.fixed;
  const pulse=active?0.4+0.6*Math.abs(Math.sin(tick*0.07)):0;
  ctx.fillStyle="rgba(0,0,0,0.5)";ctx.fillRect(bx2+4,by2+4,bw,bh);
  const liftG=ctx.createLinearGradient(bx2,by2,bx2,by2+bh);liftG.addColorStop(0,active?"#2a2010":"#1a1810");liftG.addColorStop(1,active?"#1a1408":"#121008");
  ctx.fillStyle=liftG;ctx.fillRect(bx2,by2,bw,bh);
  ctx.fillStyle="rgba(0,0,0,0.4)";ctx.fillRect(bx2+bw*0.1,by2+bh*0.1,bw*0.8,bh*0.8);
  const railColor=active?`rgba(${180+pulse*40},${110+pulse*30},${10+pulse*20},${0.7+pulse*0.3})`:"rgba(60,50,30,0.5)";
  ctx.fillStyle=railColor;
  [[bw*0.2,0,8,bh],[bw*0.75,0,8,bh]].forEach(([rx,ry,rw,rh])=>{ctx.fillRect(bx2+rx,by2+ry,rw,rh);ctx.fillStyle="rgba(255,255,255,0.1)";ctx.fillRect(bx2+rx,by2,2,rh);ctx.fillStyle=railColor;});
  for(let cb=0;cb<3;cb++){ctx.fillStyle=railColor;ctx.fillRect(bx2+bw*0.2,by2+bh*(0.25+cb*0.25),bw*0.55+8,5);}
  if(active){ctx.strokeStyle=`rgba(232,180,10,${0.4+pulse*0.4})`;ctx.lineWidth=2;}
  else{ctx.strokeStyle="rgba(80,70,50,0.3)";ctx.lineWidth=1;}
  ctx.setLineDash(active?[6,4]:[]);ctx.strokeRect(bx2-3,by2-3,bw+6,bh+6);ctx.setLineDash([]);
  if(active){
    const bayGlow=ctx.createRadialGradient(bx2+bw/2,by2+bh/2,0,bx2+bw/2,by2+bh/2,bw*0.7);
    bayGlow.addColorStop(0,`rgba(232,130,10,${0.07+pulse*0.05})`);bayGlow.addColorStop(1,"rgba(232,130,10,0)");
    ctx.fillStyle=bayGlow;ctx.fillRect(bx2-10,by2-10,bw+20,bh+20);
  }
  const labelColor=active?"#fbbf24":"#444";
  ctx.fillStyle=active?"rgba(0,0,0,0.7)":"rgba(0,0,0,0.4)";ctx.fillRect(bx2+bw/2-20,by2-18,40,13);
  ctx.strokeStyle=labelColor;ctx.lineWidth=1;ctx.strokeRect(bx2+bw/2-20,by2-18,40,13);
  ctx.fillStyle=labelColor;ctx.font="bold 11px 'VT323'";ctx.textAlign="center";ctx.fillText(b.label,bx2+bw/2,by2-8);
}

// ── Vehicle draw functions ─────────────────────────────────────────────────────
function drawCar(car){
  if(car.fixed)return;
  const bx=tx(car.x),by=ty(car.y),cw=car.w,ch=car.h;
  const isWorking=car.diagnosed&&car.workProgress>0&&car.workProgress<car.maxWork;
  const sa=isWorking?tick*0.05:0;
  const c=car.color;

  // ── Sombra elíptica ────────────────────────────────────────────────────────
  ctx.save();ctx.globalAlpha=0.45;
  const shG=ctx.createRadialGradient(bx+cw/2,by+ch*0.92,2,bx+cw/2,by+ch*0.92,cw*0.52);
  shG.addColorStop(0,"rgba(0,0,0,0.7)");shG.addColorStop(1,"rgba(0,0,0,0)");
  ctx.fillStyle=shG;ctx.beginPath();ctx.ellipse(bx+cw/2,by+ch*0.92,cw*0.52,ch*0.14,0,0,Math.PI*2);ctx.fill();
  ctx.restore();

  // ── Chassi / undercarriage ─────────────────────────────────────────────────
  ctx.fillStyle="#0d0d0d";ctx.beginPath();ctx.roundRect(bx+cw*0.06,by+ch*0.55,cw*0.88,ch*0.42,3);ctx.fill();

  // ── Corpo principal ────────────────────────────────────────────────────────
  const bodyG=ctx.createLinearGradient(bx,by+ch*0.12,bx+cw*0.3,by+ch*0.72);
  bodyG.addColorStop(0,lighten(c,55));bodyG.addColorStop(0.25,lighten(c,20));
  bodyG.addColorStop(0.6,c);bodyG.addColorStop(1,lighten(c,-35));
  ctx.fillStyle=bodyG;ctx.beginPath();ctx.roundRect(bx+cw*0.04,by+ch*0.14,cw*0.92,ch*0.62,5);ctx.fill();

  // ── Teto com curvatura ─────────────────────────────────────────────────────
  const roofG=ctx.createLinearGradient(bx+cw*0.15,by,bx+cw*0.85,by+ch*0.42);
  roofG.addColorStop(0,lighten(c,70));roofG.addColorStop(0.3,lighten(c,35));
  roofG.addColorStop(0.7,lighten(c,10));roofG.addColorStop(1,c);
  ctx.fillStyle=roofG;ctx.beginPath();ctx.roundRect(bx+cw*0.14,by+ch*0.02,cw*0.72,ch*0.42,6);ctx.fill();

  // ── Pilar A/B ──────────────────────────────────────────────────────────────
  ctx.fillStyle=lighten(c,-25);
  ctx.fillRect(bx+cw*0.14,by+ch*0.38,cw*0.04,ch*0.18);
  ctx.fillRect(bx+cw*0.82,by+ch*0.38,cw*0.04,ch*0.18);
  ctx.fillRect(bx+cw*0.44,by+ch*0.38,cw*0.04,ch*0.18);
  ctx.fillRect(bx+cw*0.52,by+ch*0.38,cw*0.04,ch*0.18);

  // ── Pára-brisa ────────────────────────────────────────────────────────────
  const wshG=ctx.createLinearGradient(bx+cw*0.15,by+ch*0.03,bx+cw*0.85,by+ch*0.35);
  wshG.addColorStop(0,"rgba(180,230,255,0.75)");wshG.addColorStop(0.4,"rgba(140,210,255,0.55)");
  wshG.addColorStop(1,"rgba(80,160,220,0.35)");
  ctx.fillStyle=wshG;ctx.beginPath();ctx.roundRect(bx+cw*0.15,by+ch*0.04,cw*0.7,ch*0.32,4);ctx.fill();
  // Reflexo no pára-brisa
  ctx.fillStyle="rgba(255,255,255,0.22)";ctx.beginPath();
  ctx.moveTo(bx+cw*0.17,by+ch*0.05);ctx.lineTo(bx+cw*0.42,by+ch*0.05);
  ctx.lineTo(bx+cw*0.36,by+ch*0.19);ctx.lineTo(bx+cw*0.17,by+ch*0.19);
  ctx.closePath();ctx.fill();

  // ── Janelas laterais ──────────────────────────────────────────────────────
  [[0.15,0.38,0.3,0.18],[0.55,0.38,0.3,0.18]].forEach(([wx,wy,ww,wh])=>{
    const wG=ctx.createLinearGradient(bx+cw*wx,by+ch*wy,bx+cw*(wx+ww),by+ch*(wy+wh));
    wG.addColorStop(0,"rgba(160,220,255,0.5)");wG.addColorStop(1,"rgba(80,150,210,0.3)");
    ctx.fillStyle=wG;ctx.fillRect(bx+cw*wx,by+ch*wy,cw*ww,ch*wh);
    ctx.fillStyle="rgba(255,255,255,0.15)";ctx.fillRect(bx+cw*wx+2,by+ch*wy+2,cw*ww*0.35,ch*wh*0.4);
    ctx.strokeStyle="rgba(0,0,0,0.25)";ctx.lineWidth=1;ctx.strokeRect(bx+cw*wx,by+ch*wy,cw*ww,ch*wh);
  });

  // ── Grade dianteira ───────────────────────────────────────────────────────
  ctx.fillStyle=lighten(c,-40);ctx.beginPath();ctx.roundRect(bx+cw*0.15,by+ch*0.76,cw*0.7,ch*0.08,2);ctx.fill();
  for(let g=0;g<5;g++){ctx.fillStyle="rgba(0,0,0,0.4)";ctx.fillRect(bx+cw*(0.19+g*0.13),by+ch*0.77,cw*0.07,ch*0.06);}

  // ── Faróis ────────────────────────────────────────────────────────────────
  [[0.06,0.76],[0.82,0.76]].forEach(([lx,ly])=>{
    ctx.fillStyle="#fffde0";ctx.beginPath();ctx.roundRect(bx+cw*lx,by+ch*ly,cw*0.12,ch*0.08,2);ctx.fill();
    ctx.fillStyle="rgba(255,250,200,0.6)";ctx.beginPath();ctx.roundRect(bx+cw*lx,by+ch*ly,cw*0.12,ch*0.08,2);ctx.fill();
    // lente interna
    ctx.fillStyle="rgba(255,240,150,0.9)";ctx.beginPath();ctx.ellipse(bx+cw*(lx+0.06),by+ch*(ly+0.04),cw*0.04,ch*0.03,0,0,Math.PI*2);ctx.fill();
  });

  // ── Lanternas traseiras ───────────────────────────────────────────────────
  [[0.06,0.03],[0.82,0.03]].forEach(([lx,ly])=>{
    ctx.fillStyle="#cc2020";ctx.beginPath();ctx.roundRect(bx+cw*lx,by+ch*ly,cw*0.12,ch*0.07,2);ctx.fill();
    ctx.fillStyle="rgba(255,80,80,0.7)";ctx.beginPath();ctx.ellipse(bx+cw*(lx+0.06),by+ch*(ly+0.035),cw*0.04,ch*0.025,0,0,Math.PI*2);ctx.fill();
  });

  // ── Rodas ─────────────────────────────────────────────────────────────────
  [[0.1,0.64],[0.1,0.89],[0.9,0.64],[0.9,0.89]].forEach(([rx,ry])=>{
    const wx2=bx+cw*rx,wy2=by+ch*ry,wr=cw*0.1;
    // Pneu
    ctx.fillStyle="#111";ctx.beginPath();ctx.arc(wx2,wy2,wr,0,Math.PI*2);ctx.fill();
    // banda de rodagem
    ctx.strokeStyle="#222";ctx.lineWidth=wr*0.22;ctx.beginPath();ctx.arc(wx2,wy2,wr*0.82,0,Math.PI*2);ctx.stroke();
    // Aro
    const rimG=ctx.createRadialGradient(wx2-wr*0.25,wy2-wr*0.25,0,wx2,wy2,wr*0.66);
    rimG.addColorStop(0,"#ccc");rimG.addColorStop(0.3,"#888");rimG.addColorStop(0.7,"#444");rimG.addColorStop(1,"#1a1a1a");
    ctx.fillStyle=rimG;ctx.beginPath();ctx.arc(wx2,wy2,wr*0.62,0,Math.PI*2);ctx.fill();
    // Raios animados
    ctx.strokeStyle="#999";ctx.lineWidth=1.5;
    for(let sp=0;sp<5;sp++){const ang=sa+sp*(Math.PI*2/5);ctx.beginPath();ctx.moveTo(wx2,wy2);ctx.lineTo(wx2+Math.cos(ang)*wr*0.56,wy2+Math.sin(ang)*wr*0.56);ctx.stroke();}
    // Centro
    ctx.fillStyle="#ddd";ctx.beginPath();ctx.arc(wx2,wy2,wr*0.14,0,Math.PI*2);ctx.fill();
    ctx.fillStyle="#555";ctx.beginPath();ctx.arc(wx2,wy2,wr*0.07,0,Math.PI*2);ctx.fill();
  });

  // ── Reflexo de brilho no capô ─────────────────────────────────────────────
  ctx.save();ctx.globalAlpha=0.18;
  ctx.fillStyle="rgba(255,255,255,1)";ctx.beginPath();
  ctx.ellipse(bx+cw*0.32,by+ch*0.22,cw*0.12,ch*0.06,-0.4,0,Math.PI*2);ctx.fill();
  ctx.restore();

  // ── Fumaça / faísca quando consertando ───────────────────────────────────
  if(isWorking&&tick%3===0){
    spawnParticles(bx+cw*0.15-(camera.x-camera.x),by+ch*0.9-(camera.y-camera.y),"rgba(80,80,80,0.5)",1);
  }

  drawVehicleDamageFx(car,bx,by,cw,ch);
  drawCarBadges(car,bx,by,cw,ch);
}

function drawMoto(car){
  if(car.fixed)return;
  const bx=tx(car.x),by=ty(car.y),cw=car.w,ch=car.h;
  const isWorking=car.diagnosed&&car.workProgress>0&&car.workProgress<car.maxWork;
  const sa=isWorking?tick*0.09:0;
  const c=car.color;

  // ── Sombra ─────────────────────────────────────────────────────────────────
  ctx.save();ctx.globalAlpha=0.35;
  const shG=ctx.createRadialGradient(bx+cw/2,by+ch*0.9,1,bx+cw/2,by+ch*0.9,cw*0.4);
  shG.addColorStop(0,"rgba(0,0,0,0.7)");shG.addColorStop(1,"rgba(0,0,0,0)");
  ctx.fillStyle=shG;ctx.beginPath();ctx.ellipse(bx+cw/2,by+ch*0.9,cw*0.4,ch*0.1,0,0,Math.PI*2);ctx.fill();
  ctx.restore();

  // ── Rodas (desenhadas primeiro, por baixo) ────────────────────────────────
  [0.1,0.9].forEach(wx=>{
    const wr=cw*0.13,wx2=bx+cw*wx,wy2=by+ch*0.78;
    // Pneu com perfil
    ctx.fillStyle="#111";ctx.beginPath();ctx.arc(wx2,wy2,wr,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle="#1e1e1e";ctx.lineWidth=wr*0.28;ctx.beginPath();ctx.arc(wx2,wy2,wr*0.78,0,Math.PI*2);ctx.stroke();
    // Aro com gradiente metálico
    const rimG=ctx.createRadialGradient(wx2-wr*0.2,wy2-wr*0.2,0,wx2,wy2,wr*0.6);
    rimG.addColorStop(0,"#ddd");rimG.addColorStop(0.35,"#777");rimG.addColorStop(0.7,"#333");rimG.addColorStop(1,"#111");
    ctx.fillStyle=rimG;ctx.beginPath();ctx.arc(wx2,wy2,wr*0.6,0,Math.PI*2);ctx.fill();
    // Raios
    ctx.strokeStyle="rgba(200,200,200,0.85)";ctx.lineWidth=1.5;
    for(let sp=0;sp<6;sp++){const ang=sa+sp*(Math.PI/3);ctx.beginPath();ctx.moveTo(wx2,wy2);ctx.lineTo(wx2+Math.cos(ang)*wr*0.55,wy2+Math.sin(ang)*wr*0.55);ctx.stroke();}
    ctx.fillStyle="#bbb";ctx.beginPath();ctx.arc(wx2,wy2,wr*0.13,0,Math.PI*2);ctx.fill();
    ctx.fillStyle="#444";ctx.beginPath();ctx.arc(wx2,wy2,wr*0.06,0,Math.PI*2);ctx.fill();
  });

  // ── Corrente / eixo traseiro ───────────────────────────────────────────────
  ctx.strokeStyle="#333";ctx.lineWidth=2;ctx.setLineDash([3,2]);
  ctx.beginPath();ctx.moveTo(bx+cw*0.1+cw*0.13,by+ch*0.78);ctx.lineTo(bx+cw*0.9-cw*0.13,by+ch*0.78);ctx.stroke();
  ctx.setLineDash([]);

  // ── Escapamento ───────────────────────────────────────────────────────────
  ctx.fillStyle="#555";ctx.beginPath();ctx.roundRect(bx+cw*0.04,by+ch*0.6,cw*0.15,ch*0.1,3);ctx.fill();
  ctx.strokeStyle="#333";ctx.lineWidth=1.5;ctx.beginPath();ctx.roundRect(bx+cw*0.04,by+ch*0.6,cw*0.15,ch*0.1,3);ctx.stroke();
  // ponta do escapamento
  ctx.fillStyle="#444";ctx.beginPath();ctx.ellipse(bx+cw*0.05,by+ch*0.65,cw*0.03,ch*0.04,0,0,Math.PI*2);ctx.fill();

  // ── Chassi / quadro ────────────────────────────────────────────────────────
  ctx.strokeStyle=lighten(c,-50);ctx.lineWidth=4;
  ctx.beginPath();ctx.moveTo(bx+cw*0.2,by+ch*0.78);ctx.lineTo(bx+cw*0.35,by+ch*0.4);ctx.lineTo(bx+cw*0.65,by+ch*0.4);ctx.lineTo(bx+cw*0.8,by+ch*0.78);ctx.stroke();
  ctx.beginPath();ctx.moveTo(bx+cw*0.35,by+ch*0.4);ctx.lineTo(bx+cw*0.5,by+ch*0.18);ctx.lineTo(bx+cw*0.65,by+ch*0.4);ctx.stroke();

  // ── Motor / bloco central ─────────────────────────────────────────────────
  const engG=ctx.createLinearGradient(bx+cw*0.32,by+ch*0.48,bx+cw*0.68,by+ch*0.72);
  engG.addColorStop(0,"#555");engG.addColorStop(0.5,"#333");engG.addColorStop(1,"#222");
  ctx.fillStyle=engG;ctx.beginPath();ctx.roundRect(bx+cw*0.32,by+ch*0.48,cw*0.36,ch*0.24,4);ctx.fill();
  ctx.strokeStyle="#666";ctx.lineWidth=1;ctx.strokeRect(bx+cw*0.32,by+ch*0.48,cw*0.36,ch*0.24);
  // aletas do motor
  for(let a=0;a<4;a++){ctx.strokeStyle="#444";ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(bx+cw*(0.35+a*0.08),by+ch*0.48);ctx.lineTo(bx+cw*(0.35+a*0.08),by+ch*0.72);ctx.stroke();}

  // ── Tanque de combustível ─────────────────────────────────────────────────
  const tankG=ctx.createLinearGradient(bx+cw*0.3,by+ch*0.1,bx+cw*0.5,by+ch*0.45);
  tankG.addColorStop(0,lighten(c,55));tankG.addColorStop(0.4,lighten(c,20));
  tankG.addColorStop(0.8,c);tankG.addColorStop(1,lighten(c,-20));
  ctx.fillStyle=tankG;ctx.beginPath();ctx.roundRect(bx+cw*0.3,by+ch*0.12,cw*0.4,ch*0.36,8);ctx.fill();
  // brilho no tanque
  ctx.save();ctx.globalAlpha=0.25;
  ctx.fillStyle="#fff";ctx.beginPath();ctx.ellipse(bx+cw*0.4,by+ch*0.2,cw*0.07,ch*0.07,-0.3,0,Math.PI*2);ctx.fill();
  ctx.restore();
  ctx.strokeStyle=lighten(c,-30);ctx.lineWidth=1.5;ctx.beginPath();ctx.roundRect(bx+cw*0.3,by+ch*0.12,cw*0.4,ch*0.36,8);ctx.stroke();

  // ── Banco/assento ─────────────────────────────────────────────────────────
  const seatG=ctx.createLinearGradient(bx+cw*0.18,by+ch*0.36,bx+cw*0.82,by+ch*0.5);
  seatG.addColorStop(0,"#2a2a2a");seatG.addColorStop(0.5,"#1a1a1a");seatG.addColorStop(1,"#111");
  ctx.fillStyle=seatG;ctx.beginPath();ctx.roundRect(bx+cw*0.18,by+ch*0.36,cw*0.64,ch*0.16,5);ctx.fill();
  // costura do banco
  ctx.strokeStyle="rgba(255,255,255,0.12)";ctx.lineWidth=1;ctx.setLineDash([4,3]);
  ctx.beginPath();ctx.moveTo(bx+cw*0.22,by+ch*0.44);ctx.lineTo(bx+cw*0.78,by+ch*0.44);ctx.stroke();
  ctx.setLineDash([]);

  // ── Guidão ────────────────────────────────────────────────────────────────
  ctx.strokeStyle="#888";ctx.lineWidth=3.5;ctx.lineCap="round";
  ctx.beginPath();ctx.moveTo(bx+cw*0.18,by+ch*0.14);ctx.lineTo(bx+cw*0.82,by+ch*0.14);ctx.stroke();
  // manoplas
  [[0.14,0.14],[0.82,0.14]].forEach(([gx,gy])=>{
    ctx.fillStyle="#333";ctx.beginPath();ctx.roundRect(bx+cw*gx-3,by+ch*gy-4,cw*0.06,ch*0.08,3);ctx.fill();
    ctx.strokeStyle="#555";ctx.lineWidth=1;ctx.strokeRect(bx+cw*gx-3,by+ch*gy-4,cw*0.06,ch*0.08);
  });
  ctx.fillStyle="#aaa";ctx.beginPath();ctx.arc(bx+cw*0.5,by+ch*0.14,cw*0.03,0,Math.PI*2);ctx.fill();

  // ── Farol ─────────────────────────────────────────────────────────────────
  ctx.fillStyle="#fffde0";ctx.beginPath();ctx.roundRect(bx+cw*0.38,by+ch*0.76,cw*0.24,ch*0.1,3);ctx.fill();
  ctx.fillStyle="rgba(255,245,150,0.7)";ctx.beginPath();ctx.ellipse(bx+cw*0.5,by+ch*0.81,cw*0.09,ch*0.04,0,0,Math.PI*2);ctx.fill();

  // ── Lanterna traseira ─────────────────────────────────────────────────────
  ctx.fillStyle="#cc2020";ctx.beginPath();ctx.roundRect(bx+cw*0.38,by+ch*0.02,cw*0.24,ch*0.08,3);ctx.fill();
  ctx.fillStyle="rgba(255,60,60,0.7)";ctx.beginPath();ctx.ellipse(bx+cw*0.5,by+ch*0.06,cw*0.08,ch*0.03,0,0,Math.PI*2);ctx.fill();

  // ── Fumaça do escapamento ─────────────────────────────────────────────────
  if(isWorking&&tick%4<3){
    spawnParticles(tx(car.x+car.w*0.05),ty(car.y+car.h*0.65),"rgba(120,120,120,0.4)",2);
  }

  drawVehicleDamageFx(car,bx,by,cw,ch);
  drawCarBadges(car,bx,by,cw,ch);
}

function drawTruck(car){
  if(car.fixed)return;
  const bx=tx(car.x),by=ty(car.y),cw=car.w,ch=car.h;
  const isWorking=car.diagnosed&&car.workProgress>0&&car.workProgress<car.maxWork;
  const sa=isWorking?tick*0.04:0;
  const c=car.color;

  // ── Sombra grande ──────────────────────────────────────────────────────────
  ctx.save();ctx.globalAlpha=0.5;
  const shG=ctx.createRadialGradient(bx+cw*0.45,by+ch*0.95,2,bx+cw*0.45,by+ch*0.95,cw*0.55);
  shG.addColorStop(0,"rgba(0,0,0,0.8)");shG.addColorStop(1,"rgba(0,0,0,0)");
  ctx.fillStyle=shG;ctx.beginPath();ctx.ellipse(bx+cw*0.45,by+ch*0.95,cw*0.52,ch*0.1,0,0,Math.PI*2);ctx.fill();
  ctx.restore();

  // ── Chassis / underframe ───────────────────────────────────────────────────
  ctx.fillStyle="#0a0a0a";ctx.beginPath();ctx.roundRect(bx+cw*0.03,by+ch*0.6,cw*0.94,ch*0.38,3);ctx.fill();
  // vigas do chassi
  ctx.strokeStyle="#1a1a1a";ctx.lineWidth=3;
  ctx.beginPath();ctx.moveTo(bx+cw*0.07,by+ch*0.65);ctx.lineTo(bx+cw*0.93,by+ch*0.65);ctx.stroke();
  ctx.beginPath();ctx.moveTo(bx+cw*0.07,by+ch*0.88);ctx.lineTo(bx+cw*0.93,by+ch*0.88);ctx.stroke();

  // ── Carroceria (carga) ────────────────────────────────────────────────────
  const bedG=ctx.createLinearGradient(bx+cw*0.03,by+ch*0.08,bx+cw*0.2,by+ch*0.65);
  bedG.addColorStop(0,lighten(c,15));bedG.addColorStop(0.4,c);
  bedG.addColorStop(0.8,lighten(c,-20));bedG.addColorStop(1,lighten(c,-35));
  ctx.fillStyle=bedG;ctx.beginPath();ctx.roundRect(bx+cw*0.03,by+ch*0.08,cw*0.52,ch*0.57,3);ctx.fill();

  // Ripas laterais da carroceria
  ctx.save();ctx.beginPath();ctx.rect(bx+cw*0.03,by+ch*0.08,cw*0.52,ch*0.57);ctx.clip();
  for(let s=0;s<7;s++){
    const sx=bx+cw*(0.05+s*0.075);
    ctx.strokeStyle="rgba(0,0,0,0.18)";ctx.lineWidth=1.5;
    ctx.beginPath();ctx.moveTo(sx,by+ch*0.08);ctx.lineTo(sx,by+ch*0.65);ctx.stroke();
  }
  ctx.restore();

  // Borda metálica da carroceria
  ctx.strokeStyle=lighten(c,-45);ctx.lineWidth=2;ctx.beginPath();ctx.roundRect(bx+cw*0.03,by+ch*0.08,cw*0.52,ch*0.57,3);ctx.stroke();
  // topo da carroceria (aresta superior)
  const topBarG=ctx.createLinearGradient(bx+cw*0.03,by+ch*0.08,bx+cw*0.03,by+ch*0.14);
  topBarG.addColorStop(0,lighten(c,40));topBarG.addColorStop(1,c);
  ctx.fillStyle=topBarG;ctx.fillRect(bx+cw*0.03,by+ch*0.08,cw*0.52,ch*0.06);

  // ── Cabine ────────────────────────────────────────────────────────────────
  const cabG=ctx.createLinearGradient(bx+cw*0.54,by,bx+cw*0.54+10,by+ch*0.68);
  cabG.addColorStop(0,lighten(c,50));cabG.addColorStop(0.3,lighten(c,25));
  cabG.addColorStop(0.7,c);cabG.addColorStop(1,lighten(c,-25));
  ctx.fillStyle=cabG;ctx.beginPath();ctx.roundRect(bx+cw*0.54,by+ch*0.02,cw*0.43,ch*0.66,5);ctx.fill();

  // Topo da cabine (mais claro)
  const cabTopG=ctx.createLinearGradient(bx+cw*0.54,by+ch*0.02,bx+cw*0.97,by+ch*0.18);
  cabTopG.addColorStop(0,lighten(c,65));cabTopG.addColorStop(1,lighten(c,30));
  ctx.fillStyle=cabTopG;ctx.beginPath();ctx.roundRect(bx+cw*0.54,by+ch*0.02,cw*0.43,ch*0.16,5);ctx.fill();

  // ── Pára-brisa da cabine ──────────────────────────────────────────────────
  const wsG=ctx.createLinearGradient(bx+cw*0.57,by+ch*0.04,bx+cw*0.95,by+ch*0.3);
  wsG.addColorStop(0,"rgba(190,235,255,0.8)");wsG.addColorStop(0.5,"rgba(140,210,255,0.6)");
  wsG.addColorStop(1,"rgba(80,160,220,0.4)");
  ctx.fillStyle=wsG;ctx.beginPath();ctx.roundRect(bx+cw*0.57,by+ch*0.05,cw*0.36,ch*0.28,4);ctx.fill();
  // reflexo no pára-brisa
  ctx.fillStyle="rgba(255,255,255,0.25)";ctx.beginPath();
  ctx.moveTo(bx+cw*0.59,by+ch*0.06);ctx.lineTo(bx+cw*0.74,by+ch*0.06);
  ctx.lineTo(bx+cw*0.71,by+ch*0.17);ctx.lineTo(bx+cw*0.59,by+ch*0.17);ctx.closePath();ctx.fill();

  // ── Janela lateral da cabine ──────────────────────────────────────────────
  ctx.fillStyle="rgba(140,205,250,0.5)";ctx.beginPath();ctx.roundRect(bx+cw*0.57,by+ch*0.35,cw*0.36,ch*0.18,3);ctx.fill();
  ctx.fillStyle="rgba(255,255,255,0.14)";ctx.fillRect(bx+cw*0.58,by+ch*0.36,cw*0.12,ch*0.08);
  ctx.strokeStyle="rgba(0,0,0,0.25)";ctx.lineWidth=1;ctx.strokeRect(bx+cw*0.57,by+ch*0.35,cw*0.36,ch*0.18);

  // ── Borda da cabine ────────────────────────────────────────────────────────
  ctx.strokeStyle=lighten(c,-35);ctx.lineWidth=1.5;ctx.beginPath();ctx.roundRect(bx+cw*0.54,by+ch*0.02,cw*0.43,ch*0.66,5);ctx.stroke();

  // ── Faróis ────────────────────────────────────────────────────────────────
  [[bx+cw*0.56,by+ch*0.72],[bx+cw*0.85,by+ch*0.72]].forEach(([lx,ly])=>{
    ctx.fillStyle="#fffde0";ctx.beginPath();ctx.roundRect(lx,ly,cw*0.11,ch*0.07,2);ctx.fill();
    ctx.fillStyle="rgba(255,245,150,0.8)";ctx.beginPath();ctx.ellipse(lx+cw*0.055,ly+ch*0.035,cw*0.038,ch*0.025,0,0,Math.PI*2);ctx.fill();
    // halo
    ctx.save();ctx.globalAlpha=0.2;
    const hG=ctx.createRadialGradient(lx+cw*0.055,ly+ch*0.035,0,lx+cw*0.055,ly+ch*0.035,cw*0.07);
    hG.addColorStop(0,"rgba(255,250,180,1)");hG.addColorStop(1,"rgba(255,250,180,0)");
    ctx.fillStyle=hG;ctx.beginPath();ctx.arc(lx+cw*0.055,ly+ch*0.035,cw*0.07,0,Math.PI*2);ctx.fill();
    ctx.restore();
  });

  // ── Lanternas traseiras ────────────────────────────────────────────────────
  [[bx+cw*0.04,by+ch*0.08],[bx+cw*0.44,by+ch*0.08]].forEach(([lx,ly])=>{
    ctx.fillStyle="#bb1a1a";ctx.beginPath();ctx.roundRect(lx,ly,cw*0.07,ch*0.08,2);ctx.fill();
    ctx.fillStyle="rgba(255,60,60,0.7)";ctx.beginPath();ctx.ellipse(lx+cw*0.035,ly+ch*0.04,cw*0.025,ch*0.03,0,0,Math.PI*2);ctx.fill();
  });

  // ── Espelhos retrovisores ─────────────────────────────────────────────────
  ctx.fillStyle="#333";
  ctx.fillRect(bx+cw*0.54-8,by+ch*0.25,7,ch*0.09);
  ctx.fillRect(bx+cw*0.97,by+ch*0.25,7,ch*0.09);

  // ── 6 Rodas com duplos traseiros ──────────────────────────────────────────
  const wheelSets=[
    [0.08,0.73,0.08],[0.08,0.87,0.08],  // dianteiros
    [0.31,0.73,0.08],[0.31,0.88,0.08],  // traseiros carroceria
    [0.69,0.73,0.08],[0.69,0.88,0.08],  // traseiros cabine
  ];
  wheelSets.forEach(([rx,ry,wr])=>{
    const wx2=bx+cw*rx,wy2=by+ch*ry,r=cw*wr;
    ctx.fillStyle="#0d0d0d";ctx.beginPath();ctx.arc(wx2,wy2,r,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle="#1e1e1e";ctx.lineWidth=r*0.3;ctx.beginPath();ctx.arc(wx2,wy2,r*0.8,0,Math.PI*2);ctx.stroke();
    const rimG=ctx.createRadialGradient(wx2-r*0.2,wy2-r*0.2,0,wx2,wy2,r*0.62);
    rimG.addColorStop(0,"#bbb");rimG.addColorStop(0.35,"#666");rimG.addColorStop(0.7,"#333");rimG.addColorStop(1,"#111");
    ctx.fillStyle=rimG;ctx.beginPath();ctx.arc(wx2,wy2,r*0.6,0,Math.PI*2);ctx.fill();
    // 8 raios
    ctx.strokeStyle="rgba(180,180,180,0.8)";ctx.lineWidth=1.2;
    for(let sp=0;sp<8;sp++){const ang=sa+sp*(Math.PI/4);ctx.beginPath();ctx.moveTo(wx2,wy2);ctx.lineTo(wx2+Math.cos(ang)*r*0.54,wy2+Math.sin(ang)*r*0.54);ctx.stroke();}
    ctx.fillStyle="#ccc";ctx.beginPath();ctx.arc(wx2,wy2,r*0.13,0,Math.PI*2);ctx.fill();
    ctx.fillStyle="#555";ctx.beginPath();ctx.arc(wx2,wy2,r*0.06,0,Math.PI*2);ctx.fill();
  });

  // ── Escapamento ───────────────────────────────────────────────────────────
  ctx.fillStyle="#3a3a3a";ctx.beginPath();ctx.roundRect(bx+cw*0.94,by+ch*0.25,cw*0.04,ch*0.35,3);ctx.fill();
  ctx.strokeStyle="#555";ctx.lineWidth=1;ctx.strokeRect(bx+cw*0.94,by+ch*0.25,cw*0.04,ch*0.35);
  ctx.fillStyle="#222";ctx.beginPath();ctx.ellipse(bx+cw*0.96,by+ch*0.26,cw*0.015,ch*0.02,0,0,Math.PI*2);ctx.fill();
  if(isWorking&&tick%5<4){spawnParticles(bx+cw*0.96,by+ch*0.22,"rgba(100,100,100,0.45)",2);}

  // ── Reflexo brilho capô cabine ────────────────────────────────────────────
  ctx.save();ctx.globalAlpha=0.16;
  ctx.fillStyle="#fff";ctx.beginPath();ctx.ellipse(bx+cw*0.68,by+ch*0.08,cw*0.09,ch*0.04,-0.3,0,Math.PI*2);ctx.fill();
  ctx.restore();

  drawVehicleDamageFx(car,bx,by,cw,ch);
  drawCarBadges(car,bx,by,cw,ch);
}

function drawLuxury(car){
  if(car.fixed)return;
  const bx=tx(car.x),by=ty(car.y),cw=car.w,ch=car.h;
  const shimmer=0.65+0.35*Math.sin(tick*0.07);
  const shimmer2=0.65+0.35*Math.sin(tick*0.07+1.2);
  const isWorking=car.diagnosed&&car.workProgress>0&&car.workProgress<car.maxWork;
  const sa=isWorking?tick*0.045:0;
  const c=car.color;

  // ── Sombra longa (carro esportivo é baixo) ────────────────────────────────
  ctx.save();ctx.globalAlpha=0.55;
  const shG=ctx.createRadialGradient(bx+cw/2,by+ch*0.94,2,bx+cw/2,by+ch*0.94,cw*0.58);
  shG.addColorStop(0,"rgba(0,0,0,0.85)");shG.addColorStop(1,"rgba(0,0,0,0)");
  ctx.fillStyle=shG;ctx.beginPath();ctx.ellipse(bx+cw/2,by+ch*0.94,cw*0.56,ch*0.1,0,0,Math.PI*2);ctx.fill();
  ctx.restore();

  // ── Chassis baixo ─────────────────────────────────────────────────────────
  ctx.fillStyle="#080808";ctx.beginPath();ctx.roundRect(bx+cw*0.05,by+ch*0.58,cw*0.9,ch*0.4,4);ctx.fill();
  // difusor traseiro
  ctx.fillStyle="#111";ctx.beginPath();ctx.roundRect(bx+cw*0.08,by+ch*0.05,cw*0.18,ch*0.08,2);ctx.fill();
  ctx.fillStyle="#111";ctx.beginPath();ctx.roundRect(bx+cw*0.74,by+ch*0.05,cw*0.18,ch*0.08,2);ctx.fill();
  for(let d=0;d<3;d++){ctx.strokeStyle="#1a1a1a";ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(bx+cw*(0.1+d*0.05),by+ch*0.05);ctx.lineTo(bx+cw*(0.1+d*0.05),by+ch*0.13);ctx.stroke();}

  // ── Corpo — perfil aerodinâmico ───────────────────────────────────────────
  const bodyG=ctx.createLinearGradient(bx+cw*0.05,by+ch*0.12,bx+cw*0.3,by+ch*0.75);
  bodyG.addColorStop(0,lighten(c,65));bodyG.addColorStop(0.2,lighten(c,30));
  bodyG.addColorStop(0.55,c);bodyG.addColorStop(0.85,lighten(c,-28));
  bodyG.addColorStop(1,lighten(c,-42));
  ctx.fillStyle=bodyG;ctx.beginPath();
  // silhueta esportiva mais agressiva
  ctx.moveTo(bx+cw*0.05,by+ch*0.72);
  ctx.lineTo(bx+cw*0.05,by+ch*0.28);
  ctx.quadraticCurveTo(bx+cw*0.08,by+ch*0.14,bx+cw*0.16,by+ch*0.18);
  ctx.lineTo(bx+cw*0.84,by+ch*0.18);
  ctx.quadraticCurveTo(bx+cw*0.92,by+ch*0.14,bx+cw*0.95,by+ch*0.28);
  ctx.lineTo(bx+cw*0.95,by+ch*0.72);ctx.closePath();ctx.fill();

  // ── Teto panorâmico baixo ─────────────────────────────────────────────────
  const roofG=ctx.createLinearGradient(bx+cw*0.2,by,bx+cw*0.5,by+ch*0.3);
  roofG.addColorStop(0,lighten(c,75));roofG.addColorStop(0.4,lighten(c,40));
  roofG.addColorStop(1,lighten(c,10));
  ctx.fillStyle=roofG;ctx.beginPath();ctx.roundRect(bx+cw*0.2,by+ch*0.02,cw*0.6,ch*0.3,7);ctx.fill();

  // ── Vidro fumê ────────────────────────────────────────────────────────────
  ctx.fillStyle="rgba(20,35,60,0.82)";ctx.beginPath();ctx.roundRect(bx+cw*0.22,by+ch*0.03,cw*0.56,ch*0.24,5);ctx.fill();
  // reflexo diagonal no vidro
  ctx.fillStyle="rgba(255,255,255,0.14)";ctx.beginPath();
  ctx.moveTo(bx+cw*0.24,by+ch*0.04);ctx.lineTo(bx+cw*0.44,by+ch*0.04);
  ctx.lineTo(bx+cw*0.4,by+ch*0.16);ctx.lineTo(bx+cw*0.24,by+ch*0.16);ctx.closePath();ctx.fill();
  // linha de separação do vidro
  ctx.strokeStyle="rgba(255,215,0,0.4)";ctx.lineWidth=1;
  ctx.beginPath();ctx.moveTo(bx+cw*0.5,by+ch*0.03);ctx.lineTo(bx+cw*0.5,by+ch*0.27);ctx.stroke();

  // ── Piller C e friso lateral dourado ─────────────────────────────────────
  ctx.strokeStyle=`rgba(255,215,0,${shimmer*0.9})`;ctx.lineWidth=1.5;
  ctx.beginPath();ctx.moveTo(bx+cw*0.06,by+ch*0.28);ctx.lineTo(bx+cw*0.94,by+ch*0.28);ctx.stroke();
  ctx.beginPath();ctx.moveTo(bx+cw*0.06,by+ch*0.62);ctx.lineTo(bx+cw*0.94,by+ch*0.62);ctx.stroke();

  // ── Grade dianteira agressiva ─────────────────────────────────────────────
  ctx.fillStyle=lighten(c,-50);ctx.beginPath();ctx.roundRect(bx+cw*0.12,by+ch*0.74,cw*0.76,ch*0.1,3);ctx.fill();
  // listras da grade
  for(let g=0;g<7;g++){
    ctx.strokeStyle="rgba(0,0,0,0.5)";ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(bx+cw*(0.15+g*0.1),by+ch*0.74);ctx.lineTo(bx+cw*(0.15+g*0.1),by+ch*0.84);ctx.stroke();
  }
  // logo no centro da grade
  ctx.save();ctx.globalAlpha=shimmer*0.7;
  ctx.fillStyle="gold";ctx.beginPath();ctx.arc(bx+cw*0.5,by+ch*0.79,cw*0.04,0,Math.PI*2);ctx.fill();
  ctx.fillStyle=c;ctx.font=`bold ${cw*0.05}px sans-serif`;ctx.textAlign="center";ctx.fillText("★",bx+cw*0.5,by+ch*0.82);
  ctx.restore();

  // ── Faróis LED angulares ──────────────────────────────────────────────────
  [[0.05,0.74],[0.83,0.74]].forEach(([lx,ly],i)=>{
    // carcaça
    ctx.fillStyle="#111";ctx.beginPath();ctx.roundRect(bx+cw*lx,by+ch*ly,cw*0.12,ch*0.09,2);ctx.fill();
    // lente
    ctx.fillStyle="#fffde0";ctx.beginPath();ctx.roundRect(bx+cw*lx+1,by+ch*ly+1,cw*0.1,ch*0.07,2);ctx.fill();
    // DRL (luz diurna) em L
    ctx.strokeStyle=`rgba(255,245,180,${shimmer})`;ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(bx+cw*(lx+0.01),by+ch*(ly+0.02));ctx.lineTo(bx+cw*(lx+0.01),by+ch*(ly+0.07));ctx.lineTo(bx+cw*(lx+0.1),by+ch*(ly+0.07));ctx.stroke();
    // halo
    ctx.save();ctx.globalAlpha=0.18*shimmer2;
    const hG=ctx.createRadialGradient(bx+cw*(lx+0.06),by+ch*(ly+0.045),0,bx+cw*(lx+0.06),by+ch*(ly+0.045),cw*0.08);
    hG.addColorStop(0,"rgba(255,250,200,1)");hG.addColorStop(1,"rgba(255,250,200,0)");
    ctx.fillStyle=hG;ctx.beginPath();ctx.arc(bx+cw*(lx+0.06),by+ch*(ly+0.045),cw*0.08,0,Math.PI*2);ctx.fill();
    ctx.restore();
  });

  // ── Lanternas traseiras em L ──────────────────────────────────────────────
  [[0.05,0.03],[0.83,0.03]].forEach(([lx,ly])=>{
    ctx.fillStyle="#880000";ctx.beginPath();ctx.roundRect(bx+cw*lx,by+ch*ly,cw*0.12,ch*0.09,2);ctx.fill();
    ctx.strokeStyle=`rgba(255,50,50,${shimmer2*0.8})`;ctx.lineWidth=1.5;
    ctx.beginPath();ctx.moveTo(bx+cw*(lx+0.01),by+ch*(ly+0.02));ctx.lineTo(bx+cw*(lx+0.01),by+ch*(ly+0.07));ctx.lineTo(bx+cw*(lx+0.1),by+ch*(ly+0.07));ctx.stroke();
  });

  // ── Saídas de escapamento duplas ──────────────────────────────────────────
  [[0.08,0.04],[0.16,0.04]].forEach(([ex,ey])=>{
    ctx.fillStyle="#222";ctx.beginPath();ctx.ellipse(bx+cw*ex,by+ch*ey,cw*0.03,ch*0.025,0,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle="#444";ctx.lineWidth=1.5;ctx.beginPath();ctx.ellipse(bx+cw*ex,by+ch*ey,cw*0.03,ch*0.025,0,0,Math.PI*2);ctx.stroke();
    if(isWorking&&tick%4<3){spawnParticles(bx+cw*ex,by+ch*(ey-0.02),"rgba(120,120,120,0.35)",1);}
  });

  // ── Rodas com aro dourado ─────────────────────────────────────────────────
  [[0.09,0.65],[0.09,0.89],[0.91,0.65],[0.91,0.89]].forEach(([rx,ry])=>{
    const wx2=bx+cw*rx,wy2=by+ch*ry,wr=cw*0.1;
    ctx.fillStyle="#0a0a0a";ctx.beginPath();ctx.arc(wx2,wy2,wr,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle="#1a1a1a";ctx.lineWidth=wr*0.3;ctx.beginPath();ctx.arc(wx2,wy2,wr*0.83,0,Math.PI*2);ctx.stroke();
    // aro dourado gradiente
    const rimG=ctx.createRadialGradient(wx2-wr*0.25,wy2-wr*0.25,0,wx2,wy2,wr*0.68);
    rimG.addColorStop(0,`rgba(255,230,80,${shimmer})`);
    rimG.addColorStop(0.3,`rgba(200,160,20,${shimmer*0.8})`);
    rimG.addColorStop(0.65,"#555");rimG.addColorStop(1,"#111");
    ctx.fillStyle=rimG;ctx.beginPath();ctx.arc(wx2,wy2,wr*0.66,0,Math.PI*2);ctx.fill();
    // 6 raios dourados
    ctx.strokeStyle=`rgba(255,215,0,${shimmer*0.85})`;ctx.lineWidth=2;
    for(let sp=0;sp<6;sp++){const ang=sa+sp*(Math.PI/3);ctx.beginPath();ctx.moveTo(wx2,wy2);ctx.lineTo(wx2+Math.cos(ang)*wr*0.6,wy2+Math.sin(ang)*wr*0.6);ctx.stroke();}
    ctx.fillStyle=`rgba(255,215,0,${shimmer})`;ctx.beginPath();ctx.arc(wx2,wy2,wr*0.14,0,Math.PI*2);ctx.fill();
    ctx.fillStyle="#333";ctx.beginPath();ctx.arc(wx2,wy2,wr*0.07,0,Math.PI*2);ctx.fill();
  });

  // ── Friso e moldura dourada ───────────────────────────────────────────────
  ctx.strokeStyle=`rgba(255,215,0,${shimmer*0.7})`;ctx.lineWidth=2;
  ctx.beginPath();ctx.moveTo(bx+cw*0.06,by+ch*0.28);ctx.lineTo(bx+cw*0.06,by+ch*0.72);
  ctx.quadraticCurveTo(bx+cw*0.06,by+ch*0.78,bx+cw*0.12,by+ch*0.78);ctx.stroke();
  ctx.beginPath();ctx.moveTo(bx+cw*0.94,by+ch*0.28);ctx.lineTo(bx+cw*0.94,by+ch*0.72);
  ctx.quadraticCurveTo(bx+cw*0.94,by+ch*0.78,bx+cw*0.88,by+ch*0.78);ctx.stroke();

  // ── Reflexo brilho capô ────────────────────────────────────────────────────
  ctx.save();ctx.globalAlpha=0.22*shimmer;
  ctx.fillStyle="#fff";ctx.beginPath();ctx.ellipse(bx+cw*0.35,by+ch*0.22,cw*0.1,ch*0.05,-0.4,0,Math.PI*2);ctx.fill();
  ctx.restore();

  drawVehicleDamageFx(car,bx,by,cw,ch);
  drawCarBadges(car,bx,by,cw,ch);
}

function drawBus(car){
  if(car.fixed)return;
  const bx=tx(car.x),by=ty(car.y),cw=car.w,ch=car.h;
  const isWorking=car.diagnosed&&car.workProgress>0&&car.workProgress<car.maxWork;
  const sa=isWorking?tick*0.035:0;
  const c=car.color;

  // ── Sombra ─────────────────────────────────────────────────────────────────
  ctx.save();ctx.globalAlpha=0.45;
  const shG=ctx.createRadialGradient(bx+cw/2,by+ch*0.95,2,bx+cw/2,by+ch*0.95,cw*0.5);
  shG.addColorStop(0,"rgba(0,0,0,0.75)");shG.addColorStop(1,"rgba(0,0,0,0)");
  ctx.fillStyle=shG;ctx.beginPath();ctx.ellipse(bx+cw/2,by+ch*0.95,cw*0.5,ch*0.1,0,0,Math.PI*2);ctx.fill();
  ctx.restore();

  // ── Chassis ────────────────────────────────────────────────────────────────
  ctx.fillStyle="#0a0a0a";ctx.beginPath();ctx.roundRect(bx+cw*0.03,by+ch*0.65,cw*0.94,ch*0.33,3);ctx.fill();

  // ── Corpo principal ────────────────────────────────────────────────────────
  const bodyG=ctx.createLinearGradient(bx+cw*0.04,by,bx+cw*0.25,by+ch*0.72);
  bodyG.addColorStop(0,lighten(c,55));bodyG.addColorStop(0.2,lighten(c,28));
  bodyG.addColorStop(0.6,c);bodyG.addColorStop(0.9,lighten(c,-22));
  bodyG.addColorStop(1,lighten(c,-38));
  ctx.fillStyle=bodyG;ctx.beginPath();ctx.roundRect(bx+cw*0.03,by+ch*0.01,cw*0.94,ch*0.69,5);ctx.fill();

  // ── Faixa lateral ─────────────────────────────────────────────────────────
  ctx.fillStyle=lighten(c,-35);ctx.fillRect(bx+cw*0.03,by+ch*0.47,cw*0.94,ch*0.06);
  ctx.fillStyle=lighten(c,40);ctx.fillRect(bx+cw*0.03,by+ch*0.44,cw*0.94,ch*0.03);

  // ── Pára-brisa dianteiro ──────────────────────────────────────────────────
  const wsG=ctx.createLinearGradient(bx+cw*0.6,by+ch*0.04,bx+cw*0.94,by+ch*0.35);
  wsG.addColorStop(0,"rgba(190,235,255,0.78)");wsG.addColorStop(0.5,"rgba(140,210,255,0.6)");
  wsG.addColorStop(1,"rgba(80,160,220,0.38)");
  ctx.fillStyle=wsG;ctx.beginPath();ctx.roundRect(bx+cw*0.62,by+ch*0.04,cw*0.3,ch*0.28,4);ctx.fill();
  ctx.fillStyle="rgba(255,255,255,0.18)";ctx.beginPath();
  ctx.moveTo(bx+cw*0.64,by+ch*0.05);ctx.lineTo(bx+cw*0.77,by+ch*0.05);
  ctx.lineTo(bx+cw*0.74,by+ch*0.17);ctx.lineTo(bx+cw*0.64,by+ch*0.17);ctx.closePath();ctx.fill();

  // ── Janelas laterais ──────────────────────────────────────────────────────
  for(let w=0;w<5;w++){
    const wx=bx+cw*(0.05+w*0.115),wy=by+ch*0.05,ww=cw*0.1,wh=ch*0.34;
    const wG=ctx.createLinearGradient(wx,wy,wx+ww,wy+wh);
    wG.addColorStop(0,"rgba(170,225,255,0.52)");wG.addColorStop(1,"rgba(90,160,220,0.32)");
    ctx.fillStyle=wG;ctx.beginPath();ctx.roundRect(wx,wy,ww,wh,2);ctx.fill();
    ctx.fillStyle="rgba(255,255,255,0.16)";ctx.fillRect(wx+1,wy+1,ww*0.3,wh*0.35);
    ctx.strokeStyle="rgba(0,0,0,0.28)";ctx.lineWidth=1;ctx.strokeRect(wx,wy,ww,wh);
    // caixilho central
    ctx.strokeStyle="rgba(0,0,0,0.2)";ctx.lineWidth=0.8;
    ctx.beginPath();ctx.moveTo(wx+ww/2,wy);ctx.lineTo(wx+ww/2,wy+wh);ctx.stroke();
  }

  // ── Porta de entrada ──────────────────────────────────────────────────────
  const doorG=ctx.createLinearGradient(bx+cw*0.04,by+ch*0.39,bx+cw*0.18,by+ch*0.7);
  doorG.addColorStop(0,lighten(c,-10));doorG.addColorStop(1,lighten(c,-40));
  ctx.fillStyle=doorG;ctx.beginPath();ctx.roundRect(bx+cw*0.04,by+ch*0.39,cw*0.16,ch*0.3,2);ctx.fill();
  // vidro da porta
  ctx.fillStyle="rgba(130,200,250,0.5)";ctx.fillRect(bx+cw*0.05,by+ch*0.41,cw*0.14,ch*0.14);
  // detalhe da porta (degraus)
  ctx.strokeStyle="rgba(0,0,0,0.3)";ctx.lineWidth=1;
  ctx.beginPath();ctx.moveTo(bx+cw*0.04,by+ch*0.55);ctx.lineTo(bx+cw*0.2,by+ch*0.55);ctx.stroke();
  ctx.beginPath();ctx.moveTo(bx+cw*0.04,by+ch*0.61);ctx.lineTo(bx+cw*0.2,by+ch*0.61);ctx.stroke();
  // puxador da porta
  ctx.fillStyle="#888";ctx.beginPath();ctx.roundRect(bx+cw*0.175,by+ch*0.45,cw*0.015,ch*0.04,2);ctx.fill();

  // ── Borda da carroceria ────────────────────────────────────────────────────
  ctx.strokeStyle=lighten(c,-30);ctx.lineWidth=1.8;ctx.beginPath();ctx.roundRect(bx+cw*0.03,by+ch*0.01,cw*0.94,ch*0.69,5);ctx.stroke();

  // ── Para-choque dianteiro ─────────────────────────────────────────────────
  const bumperG=ctx.createLinearGradient(bx+cw*0.03,by+ch*0.72,bx+cw*0.03,by+ch*0.82);
  bumperG.addColorStop(0,"#666");bumperG.addColorStop(0.5,"#444");bumperG.addColorStop(1,"#222");
  ctx.fillStyle=bumperG;ctx.beginPath();ctx.roundRect(bx+cw*0.5,by+ch*0.72,cw*0.47,ch*0.1,3);ctx.fill();
  // Para-choque traseiro
  ctx.fillStyle=bumperG;ctx.beginPath();ctx.roundRect(bx+cw*0.03,by+ch*0.72,cw*0.12,ch*0.1,3);ctx.fill();

  // ── Faróis ────────────────────────────────────────────────────────────────
  [[bx+cw*0.62,by+ch*0.72],[bx+cw*0.84,by+ch*0.72]].forEach(([lx,ly])=>{
    ctx.fillStyle="#fffde0";ctx.beginPath();ctx.roundRect(lx,ly,cw*0.12,ch*0.08,2);ctx.fill();
    ctx.fillStyle="rgba(255,245,150,0.75)";ctx.beginPath();ctx.ellipse(lx+cw*0.06,ly+ch*0.04,cw*0.04,ch*0.03,0,0,Math.PI*2);ctx.fill();
    ctx.save();ctx.globalAlpha=0.15;
    const hG=ctx.createRadialGradient(lx+cw*0.06,ly+ch*0.04,0,lx+cw*0.06,ly+ch*0.04,cw*0.07);
    hG.addColorStop(0,"rgba(255,250,180,1)");hG.addColorStop(1,"rgba(255,250,180,0)");
    ctx.fillStyle=hG;ctx.beginPath();ctx.arc(lx+cw*0.06,ly+ch*0.04,cw*0.07,0,Math.PI*2);ctx.fill();
    ctx.restore();
  });

  // ── Lanternas traseiras ────────────────────────────────────────────────────
  [[bx+cw*0.03,by+ch*0.02],[bx+cw*0.2,by+ch*0.02]].forEach(([lx,ly])=>{
    ctx.fillStyle="#880000";ctx.beginPath();ctx.roundRect(lx,ly,cw*0.09,ch*0.08,2);ctx.fill();
    ctx.fillStyle="rgba(255,50,50,0.65)";ctx.beginPath();ctx.ellipse(lx+cw*0.045,ly+ch*0.04,cw*0.03,ch*0.025,0,0,Math.PI*2);ctx.fill();
  });

  // ── 6 Rodas (3 eixos) ─────────────────────────────────────────────────────
  [[0.12,0.85],[0.12,0.93],[0.5,0.85],[0.5,0.93],[0.88,0.85],[0.88,0.93]].forEach(([rx,ry])=>{
    const wx2=bx+cw*rx,wy2=by+ch*ry,wr=cw*0.09;
    ctx.fillStyle="#0e0e0e";ctx.beginPath();ctx.arc(wx2,wy2,wr,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle="#1e1e1e";ctx.lineWidth=wr*0.28;ctx.beginPath();ctx.arc(wx2,wy2,wr*0.79,0,Math.PI*2);ctx.stroke();
    const rimG=ctx.createRadialGradient(wx2-wr*0.2,wy2-wr*0.2,0,wx2,wy2,wr*0.62);
    rimG.addColorStop(0,"#ccc");rimG.addColorStop(0.3,"#777");rimG.addColorStop(0.65,"#333");rimG.addColorStop(1,"#111");
    ctx.fillStyle=rimG;ctx.beginPath();ctx.arc(wx2,wy2,wr*0.6,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle="rgba(180,180,180,0.8)";ctx.lineWidth=1.2;
    for(let sp=0;sp<6;sp++){const ang=sa+sp*(Math.PI/3);ctx.beginPath();ctx.moveTo(wx2,wy2);ctx.lineTo(wx2+Math.cos(ang)*wr*0.53,wy2+Math.sin(ang)*wr*0.53);ctx.stroke();}
    ctx.fillStyle="#ccc";ctx.beginPath();ctx.arc(wx2,wy2,wr*0.12,0,Math.PI*2);ctx.fill();
    ctx.fillStyle="#555";ctx.beginPath();ctx.arc(wx2,wy2,wr*0.05,0,Math.PI*2);ctx.fill();
  });

  // ── Espelhos retrovisores ─────────────────────────────────────────────────
  ctx.fillStyle="#444";
  ctx.beginPath();ctx.roundRect(bx+cw*0.96,by+ch*0.22,cw*0.03,ch*0.1,2);ctx.fill();
  ctx.beginPath();ctx.roundRect(bx+cw*0.61,by+ch*0.22,cw*0.03,ch*0.1,2);ctx.fill();

  // ── Numeração / marca ─────────────────────────────────────────────────────
  ctx.fillStyle="rgba(0,0,0,0.35)";ctx.beginPath();ctx.roundRect(bx+cw*0.25,by+ch*0.5,cw*0.3,ch*0.08,2);ctx.fill();
  ctx.fillStyle="rgba(255,255,255,0.55)";ctx.font=`bold ${ch*0.07}px 'VT323'`;ctx.textAlign="center";
  ctx.fillText("VAN RÁPIDA",bx+cw*0.4,by+ch*0.56);

  // ── Reflexo brilho lateral ────────────────────────────────────────────────
  ctx.save();ctx.globalAlpha=0.14;
  ctx.fillStyle="#fff";ctx.beginPath();ctx.ellipse(bx+cw*0.3,by+ch*0.22,cw*0.12,ch*0.04,-0.2,0,Math.PI*2);ctx.fill();
  ctx.restore();

  if(isWorking&&tick%5<4){spawnParticles(bx+cw*0.95,by+ch*0.25,"rgba(100,100,100,0.4)",1);}

  drawVehicleDamageFx(car,bx,by,cw,ch);
  drawCarBadges(car,bx,by,cw,ch);
}


function drawVehicleDamageFx(car,bx,by,cw,ch){
  if(car.fixed||!car.problem)return;
  const id=(car.problem.id||car.problem.name||'').toLowerCase();
  const q=window._graphicsQuality||'media';
  ctx.save();
  if(/pneu|tire/.test(id)){ctx.strokeStyle='#222';ctx.lineWidth=4;ctx.beginPath();ctx.ellipse(bx+cw*.18,by+ch*.9,cw*.12,ch*.035,0,0,Math.PI*2);ctx.stroke();}
  if(/el[eé]tr|bateria|farol/.test(id)){const blink=.35+.65*Math.abs(Math.sin(tick*.18));ctx.fillStyle=`rgba(255,220,80,${blink})`;ctx.beginPath();ctx.arc(bx+cw*.12,by+ch*.8,6,0,Math.PI*2);ctx.fill();}
  if(/motor|radiador|superaquec|óleo|oleo/.test(id) && window._particlesEnabled!==false){
    for(let i=0;i<(q==='alta'?3:1);i++){const ox=Math.sin((tick+i*17)*.08)*5;ctx.fillStyle=`rgba(120,120,120,${.14+i*.05})`;ctx.beginPath();ctx.arc(bx+cw*.5+ox,by+ch*.04-i*7,5+i*2,0,Math.PI*2);ctx.fill();}
  }
  if(/vidro|parabrisa|para-brisa/.test(id)){ctx.strokeStyle='rgba(220,245,255,.85)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(bx+cw*.52,by+ch*.08);ctx.lineTo(bx+cw*.45,by+ch*.2);ctx.lineTo(bx+cw*.58,by+ch*.28);ctx.moveTo(bx+cw*.45,by+ch*.2);ctx.lineTo(bx+cw*.35,by+ch*.27);ctx.stroke();}
  ctx.restore();
}
function drawCarBadges(car,bx,by,cw,ch){
  const isWorking=car.diagnosed&&car.workProgress>0&&car.workProgress<car.maxWork;
  // VIP badge
  if(car.isVIP||car.personality?.id==="vip"){
    const vp=0.7+0.3*Math.sin(tick*0.14);
    const vglow=ctx.createRadialGradient(bx+10,by-14,0,bx+10,by-14,18);vglow.addColorStop(0,`rgba(255,215,0,${0.6*vp})`);vglow.addColorStop(1,"rgba(255,215,0,0)");
    ctx.fillStyle=vglow;ctx.beginPath();ctx.arc(bx+10,by-14,18,0,Math.PI*2);ctx.fill();
    ctx.fillStyle="#ffd700";ctx.beginPath();ctx.arc(bx+10,by-14,11,0,Math.PI*2);ctx.fill();
    ctx.fillStyle="rgba(0,0,0,0.6)";ctx.font="13px sans-serif";ctx.textAlign="center";ctx.fillText("👑",bx+10,by-10);
  }
  // Personality badge
  if(car.personality&&car.personality.id!=="normal"&&car.personality.id!=="vip"){
    ctx.fillStyle="rgba(0,0,0,0.7)";ctx.beginPath();ctx.roundRect(bx+cw-28,by-26,26,16,3);ctx.fill();
    ctx.font="12px sans-serif";ctx.textAlign="center";ctx.fillText(car.personality.emoji,bx+cw-15,by-14);
  }
  // Vehicle type badge
  if(car.vtype&&car.vtype.id!=="car"){
    ctx.fillStyle="rgba(0,0,0,0.65)";ctx.beginPath();ctx.roundRect(bx+cw/2-14,by-38,28,14,3);ctx.fill();
    ctx.fillStyle="#fff";ctx.font="11px sans-serif";ctx.textAlign="center";ctx.fillText(car.vtype.emoji,bx+cw/2,by-27);
  }
  // Problem badge
  if(car.diagnosed){
    ctx.fillStyle="rgba(0,0,0,0.7)";ctx.fillRect(bx,by-26,cw,9);
    ctx.strokeStyle="rgba(255,255,255,0.1)";ctx.lineWidth=1;ctx.strokeRect(bx,by-26,cw,9);
    const pct=car.workProgress/car.maxWork;
    const prg=ctx.createLinearGradient(bx,0,bx+cw,0);prg.addColorStop(0,"#22c55e");prg.addColorStop(0.5,"#fbbf24");prg.addColorStop(1,"#ef4444");
    ctx.fillStyle=prg;ctx.fillRect(bx,by-26,cw*pct,9);ctx.fillStyle="rgba(255,255,255,0.2)";ctx.fillRect(bx,by-26,cw*pct,3);
    const pulse=0.7+0.3*Math.sin(tick*0.12);const badgeColor=car.problem.color;
    const bg3=ctx.createRadialGradient(bx+cw-12,by-14,0,bx+cw-12,by-14,20);bg3.addColorStop(0,withAlpha(badgeColor,0.5*pulse));bg3.addColorStop(1,"rgba(0,0,0,0)");
    ctx.fillStyle=bg3;ctx.beginPath();ctx.arc(bx+cw-12,by-14,20,0,Math.PI*2);ctx.fill();
    ctx.fillStyle=badgeColor;ctx.beginPath();ctx.arc(bx+cw-12,by-14,13,0,Math.PI*2);ctx.fill();
    ctx.fillStyle="#fff";ctx.font="14px sans-serif";ctx.textAlign="center";ctx.fillText(car.problem.emoji,bx+cw-12,by-10);
    ctx.fillStyle="#fff";ctx.font="bold 11px 'VT323'";ctx.textAlign="left";ctx.fillText(car.problem.name,bx+2,by-30);
  } else {
    const pulse=0.5+0.5*Math.abs(Math.sin(tick*0.09));
    const qbg=ctx.createRadialGradient(bx+cw/2,by-14,0,bx+cw/2,by-14,16);qbg.addColorStop(0,`rgba(250,200,50,${0.8*pulse})`);qbg.addColorStop(1,"rgba(200,150,0,0)");
    ctx.fillStyle=qbg;ctx.beginPath();ctx.arc(bx+cw/2,by-14,16,0,Math.PI*2);ctx.fill();
    ctx.fillStyle=`rgba(255,240,100,${0.9*pulse})`;ctx.font="bold 22px 'VT323'";ctx.textAlign="center";ctx.fillText("?",bx+cw/2,by-6);
  }
  // Patience bar
  if(car.patience<1){
    const p=Math.max(0,car.patience);const bw2=cw+10;const px2=bx-5;const py2=by-38;
    ctx.fillStyle="rgba(0,0,0,0.6)";ctx.fillRect(px2,py2,bw2,8);
    const pBarG=ctx.createLinearGradient(px2,0,px2+bw2,0);pBarG.addColorStop(0,p>0.6?"#22c55e":"#ef4444");pBarG.addColorStop(1,p>0.6?"#16a34a":p>0.3?"#f59e0b":"#dc2626");
    ctx.fillStyle=pBarG;ctx.fillRect(px2,py2,bw2*p,8);ctx.fillStyle="rgba(255,255,255,0.15)";ctx.fillRect(px2,py2,bw2*p,3);
    ctx.strokeStyle="rgba(255,255,255,0.15)";ctx.lineWidth=1;ctx.strokeRect(px2,py2,bw2,8);
    if(p<0.3){const ang=0.5+0.5*Math.sin(tick*0.2);ctx.fillStyle=`rgba(239,68,68,${ang})`;ctx.font="14px sans-serif";ctx.textAlign="center";ctx.fillText("😡",bx+cw/2,py2-4);}
  }
  if(isWorking&&tick%4<2){ctx.save();ctx.globalAlpha=0.8;ctx.fillStyle="#fbbf24";ctx.font="10px sans-serif";ctx.textAlign="center";ctx.fillText("✦",bx+cw*0.5+Math.sin(tick)*15,by+ch*0.9-5);ctx.fillText("✦",bx+cw*0.3+Math.cos(tick*0.7)*10,by+ch*0.85-3);ctx.restore();}
}

function drawAllVehicles(){
  cars.filter(c=>!c.fixed).forEach(c=>{
    const dt=c.vtype?c.vtype.id:"car";
    if(dt==="moto")drawMoto(c);
    else if(dt==="truck")drawTruck(c);
    else if(dt==="luxury")drawLuxury(c);
    else if(dt==="bus")drawBus(c);
    else drawCar(c);
  });
}

// ── Person drawing ────────────────────────────────────────────────────────────
function drawPerson(px2,py2,pw,ph,skin,shirt,dir,frame,isHelper=false){
  const bx=tx(px2),by=ty(py2);const walkCycle=Math.sin(tick*0.18+frame*Math.PI)*ph*0.08;
  const shadowG2=ctx.createRadialGradient(bx+pw/2,by+ph+2,0,bx+pw/2,by+ph+2,pw*0.8);shadowG2.addColorStop(0,"rgba(0,0,0,0.4)");shadowG2.addColorStop(1,"rgba(0,0,0,0)");
  ctx.fillStyle=shadowG2;ctx.beginPath();ctx.ellipse(bx+pw/2,by+ph+2,pw*0.7,ph*0.12,0,0,Math.PI*2);ctx.fill();
  const legColors=["#1e3a6e","#162d56"];
  ctx.fillStyle=legColors[frame%2===0?0:1];ctx.fillRect(bx+pw*0.12,by+ph*0.55+walkCycle,pw*0.32,ph*0.43);
  ctx.fillStyle=legColors[frame%2===0?1:0];ctx.fillRect(bx+pw*0.56,by+ph*0.55-walkCycle,pw*0.32,ph*0.43);
  ctx.fillStyle="#111";ctx.fillRect(bx+pw*0.07,by+ph*0.92+walkCycle,pw*0.38,ph*0.09);ctx.fillRect(bx+pw*0.54,by+ph*0.92-walkCycle,pw*0.38,ph*0.09);
  const torsoColor=isHelper?"#2563eb":"#a16207";
  const torsoG=ctx.createLinearGradient(bx+pw*0.05,by+ph*0.26,bx+pw*0.95,by+ph*0.26);torsoG.addColorStop(0,isHelper?"#3b82f6":lighten(torsoColor,15));torsoG.addColorStop(0.5,torsoColor);torsoG.addColorStop(1,isHelper?"#1d4ed8":lighten(torsoColor,-15));
  ctx.fillStyle=torsoG;ctx.fillRect(bx+pw*0.05,by+ph*0.26,pw*0.9,ph*0.34);
  ctx.fillStyle=isHelper?"#1d4ed8":"#92400e";ctx.fillRect(bx+pw*0.28,by+ph*0.26,pw*0.44,ph*0.2);
  ctx.fillStyle=isHelper?"#2563eb":"#a16207";ctx.fillRect(bx+pw*0.32,by+ph*0.29,pw*0.16,ph*0.1);
  ctx.fillStyle="#ccc";ctx.fillRect(bx+pw*0.34,by+ph*0.27,2,ph*0.1);
  const armSwing=Math.sin(tick*0.18+(frame%2)*Math.PI)*4;const armColor=isHelper?"#3b82f6":"#a16207";
  ctx.fillStyle=armColor;ctx.fillRect(bx-pw*0.08,by+ph*0.27+armSwing,pw*0.17,ph*0.28);ctx.fillRect(bx+pw*0.91,by+ph*0.27-armSwing,pw*0.17,ph*0.28);
  ctx.fillStyle=skin;ctx.beginPath();ctx.arc(bx-pw*0.005,by+ph*0.53+armSwing,pw*0.11,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(bx+pw*0.995,by+ph*0.53-armSwing,pw*0.11,0,Math.PI*2);ctx.fill();
  const headG=ctx.createRadialGradient(bx+pw*0.45,by+ph*0.1,0,bx+pw/2,by+ph*0.14,pw*0.5);headG.addColorStop(0,lighten(skin,20));headG.addColorStop(1,skin);
  ctx.fillStyle=headG;ctx.beginPath();ctx.roundRect(bx+pw*0.1,by+ph*0.01,pw*0.8,ph*0.26,3);ctx.fill();
  ctx.fillStyle=skin;ctx.fillRect(bx+pw*0.35,by+ph*0.25,pw*0.3,ph*0.04);
  if(dir!=="up"){
    ctx.fillStyle="#1a1a2a";ctx.beginPath();ctx.arc(bx+pw*0.3,by+ph*0.1,2.5,0,Math.PI*2);ctx.fill();ctx.fillStyle="#1a1a2a";ctx.beginPath();ctx.arc(bx+pw*0.7,by+ph*0.1,2.5,0,Math.PI*2);ctx.fill();
    ctx.fillStyle="#fff";ctx.beginPath();ctx.arc(bx+pw*0.29,by+ph*0.09,1,0,Math.PI*2);ctx.fill();ctx.fillStyle="#fff";ctx.beginPath();ctx.arc(bx+pw*0.69,by+ph*0.09,1,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle="#6b3a1a";ctx.lineWidth=1.2;ctx.beginPath();ctx.arc(bx+pw*0.5,by+ph*0.13,pw*0.14,0.2,Math.PI-0.2);ctx.stroke();
    ctx.fillStyle="rgba(220,120,100,0.2)";ctx.beginPath();ctx.arc(bx+pw*0.2,by+ph*0.13,4,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(bx+pw*0.8,by+ph*0.13,4,0,Math.PI*2);ctx.fill();
  }
  const hatColor=isHelper?"#1d4ed8":"#7c2d12";
  const hatG=ctx.createLinearGradient(bx+pw*0.05,by-6,bx+pw*0.95,by-6);hatG.addColorStop(0,lighten(hatColor,20));hatG.addColorStop(1,hatColor);
  ctx.fillStyle=hatG;ctx.beginPath();ctx.roundRect(bx+pw*0.03,by-8,pw*0.94,10,[4,4,0,0]);ctx.fill();
  ctx.fillStyle=lighten(hatColor,-10);ctx.fillRect(bx-pw*0.05,by+2,pw*1.1,4);
  ctx.fillStyle="rgba(255,255,255,0.5)";ctx.font="bold 7px sans-serif";ctx.textAlign="center";ctx.fillText(isHelper?"H":"Z",bx+pw/2,by-1);
  // Hunger visual — tired face
  if(!isHelper&&hunger<25){
    const hf=0.5+0.5*Math.sin(tick*0.15);
    ctx.fillStyle=`rgba(251,191,36,${hf})`;ctx.font="11px sans-serif";ctx.textAlign="center";ctx.fillText("😵",bx+pw/2,by-22);
  }
}

function drawPlayer(){
  drawPerson(player.x,player.y,player.w,player.h,"#f5cba7","#b45309",player.dir,player.frame,false);
  const nameX=tx(player.x+player.w/2);const nameY=ty(player.y-28);
  ctx.fillStyle="rgba(0,0,0,0.8)";ctx.fillRect(nameX-20,nameY,40,15);
  const glowPulse=0.6+0.4*Math.sin(tick*0.1);
  ctx.strokeStyle=`rgba(232,130,10,${glowPulse})`;ctx.lineWidth=1.5;ctx.strokeRect(nameX-20,nameY,40,15);
  ctx.fillStyle="#e8820a";ctx.font="bold 13px 'VT323'";ctx.textAlign="center";ctx.fillText("ZÉ",nameX,nameY+11);
  if(window._particlesEnabled !== false && window._graphicsQuality !== 'baixa' && moving&&tick%3===0){for(let i=0;i<2;i++){particles.push({x:player.x+Math.random()*player.w,y:player.y+player.h,vx:(Math.random()-0.5),vy:Math.random()*-0.3,r:2+Math.random()*2,color:"rgba(150,120,80,0.4)",life:0.5,type:"dust"});}}
  if(stamina<maxStamina*0.2){const p=0.5+0.5*Math.sin(tick*0.2);ctx.fillStyle=`rgba(249,115,22,${p})`;ctx.font="bold 13px 'VT323'";ctx.textAlign="center";ctx.fillText("⚡ CANSADO!",tx(player.x+player.w/2),ty(player.y-44));}
}

function drawHelpers(){
  helpers.forEach(h=>{
    drawPerson(h.x,h.y,h.w,h.h,"#fdbcb4","#3b82f6",h.dir,h.frame,true);
    drawHelperStateIcon(h);
    drawHelperSpeech(h);
  });
}

function drawSpeechBubbles(){
  const now=tick;
  speechBubbles.forEach(b=>{
    b.timer--;b.life=b.timer/180;
    if(b.life<=0)return;
    ctx.save();ctx.globalAlpha=Math.min(1,b.life*3);
    const bw=Math.max(80,b.text.length*7);const bh=22;
    const bx=tx(b.x)-bw/2;const by=ty(b.y)-50;
    ctx.fillStyle="rgba(0,0,0,0.85)";ctx.beginPath();ctx.roundRect(bx,by,bw,bh,5);ctx.fill();
    ctx.strokeStyle="rgba(255,255,255,0.3)";ctx.lineWidth=1;ctx.beginPath();ctx.roundRect(bx,by,bw,bh,5);ctx.stroke();
    // Bubble tail
    ctx.fillStyle="rgba(0,0,0,0.85)";ctx.beginPath();ctx.moveTo(tx(b.x)-4,by+bh);ctx.lineTo(tx(b.x)+4,by+bh);ctx.lineTo(tx(b.x),by+bh+8);ctx.closePath();ctx.fill();
    ctx.fillStyle="#fff";ctx.font="11px 'VT323'";ctx.textAlign="center";ctx.fillText(b.text,bx+bw/2,by+15);
    ctx.restore();
  });
  for(let i=speechBubbles.length-1;i>=0;i--){if(speechBubbles[i].timer<=0)speechBubbles.splice(i,1);}
}

function drawNearbyHint(){
  bays.forEach(b=>{
    if(!b.car||b.car.fixed)return;
    const dx=player.x+player.w/2-(b.x+b.w/2);const dy=player.y+player.h/2-(b.y+b.h/2);const dist=Math.hypot(dx,dy);
    if(dist<130){
      const p=0.4+0.6*Math.abs(Math.sin(tick*0.12));
      ctx.strokeStyle=`rgba(232,180,10,${p})`;ctx.lineWidth=2;ctx.setLineDash([6,4]);ctx.strokeRect(tx(b.x-6),ty(b.y-6),b.w+12,b.h+12);ctx.setLineDash([]);
      ctx.save();ctx.globalAlpha=0.4*p;ctx.strokeStyle="#fbbf24";ctx.lineWidth=1.5;ctx.setLineDash([4,6]);ctx.beginPath();ctx.moveTo(tx(player.x+player.w/2),ty(player.y+player.h/2));ctx.lineTo(tx(b.x+b.w/2),ty(b.y+b.h/2));ctx.stroke();ctx.setLineDash([]);ctx.restore();
    }
  });
}

function drawParticles(){
  if(window._particlesEnabled === false) return;
  const q = window._graphicsQuality || 'media';
  const step = q === 'baixa' ? 2 : 1;
  particles.forEach((p,i)=>{
    if(i % step) return;
    ctx.save();ctx.globalAlpha=p.life;
    if(p.type==="dust"){ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(tx(p.x),ty(p.y),p.r,0,Math.PI*2);ctx.fill();}
    else{const sg3=ctx.createRadialGradient(tx(p.x),ty(p.y),0,tx(p.x),ty(p.y),p.r*2.5);sg3.addColorStop(0,"rgba(255,255,200,1)");sg3.addColorStop(0.3,p.color);sg3.addColorStop(1,"rgba(0,0,0,0)");ctx.fillStyle=sg3;ctx.beginPath();ctx.arc(tx(p.x),ty(p.y),p.r*2.5,0,Math.PI*2);ctx.fill();}
    ctx.restore();
  });
}

function drawFloatTexts(){
  floatTexts.forEach(f=>{
    ctx.save();ctx.globalAlpha=Math.min(f.life*2,1);ctx.font="bold 22px 'VT323'";ctx.textAlign="center";
    ctx.fillStyle="rgba(0,0,0,0.8)";ctx.fillText(f.text,tx(f.x)+1,ty(f.y)+1);ctx.fillStyle=f.color;ctx.fillText(f.text,tx(f.x),ty(f.y));ctx.restore();
  });
}

function drawRain(){
  if(weatherState!=="rain"&&weatherState!=="storm")return;
  const q = window._graphicsQuality || 'media';
  const intensity=weatherState==="storm"?0.7:0.4;
  ctx.save();ctx.strokeStyle=`rgba(170,210,255,${intensity})`;ctx.lineWidth=1;
  rainDrops.forEach((r,i)=>{
    if(q === 'baixa' && i % 3 !== 0) return;
    if(q === 'media' && i % 2 !== 0) return;
    ctx.beginPath();ctx.moveTo(tx(r.x),ty(r.y));ctx.lineTo(tx(r.x+r.vx*2),ty(r.y-r.len));ctx.stroke();
  });
  ctx.restore();
  if(weatherState==="storm"){
    ctx.fillStyle="rgba(100,150,255,0.06)";ctx.fillRect(0,0,viewW,viewH);
  }
}

function drawOutside(){
  if(camera.x<0){ctx.fillStyle="rgba(0,0,0,0.85)";ctx.fillRect(0,0,tx(0),viewH);}
  if(camera.x+viewW>shopW){ctx.fillStyle="rgba(0,0,0,0.85)";ctx.fillRect(tx(shopW),0,viewW,viewH);}
  if(camera.y<0){ctx.fillStyle="rgba(0,0,0,0.85)";ctx.fillRect(0,0,viewW,ty(0));}
  if(camera.y+viewH>shopH){ctx.fillStyle="rgba(0,0,0,0.85)";ctx.fillRect(0,ty(shopH),viewW,viewH);}
}

function isOpen(){const h=Math.floor(gameMinute/60)%24;const open=window._earlyOpen?6:8;const close=window._extendedHours?22:20;return h>=open&&h<close;}
function drawClosedBanner(){
  if(isOpen())return;
  const p=0.6+0.4*Math.sin(tick*0.08);
  ctx.fillStyle=`rgba(150,0,0,${p*0.25})`;ctx.fillRect(0,0,viewW,viewH);
  ctx.fillStyle=`rgba(220,50,50,${p})`;ctx.font="bold 18px 'Press Start 2P'";ctx.textAlign="center";ctx.fillText("🔒 FECHADA",viewW/2,viewH/2);
  ctx.font="bold 9px 'Press Start 2P'";ctx.fillStyle="rgba(255,255,255,0.5)";ctx.fillText("Abre às 08:00",viewW/2,viewH/2+28);
}

// ── Update ────────────────────────────────────────────────────────────────────
let joyDX=0,joyDY=0;
let moving=false;
function update(){
  tick++;
  if(tick%4===0){gameMinute++;if(gameMinute>=24*60)gameMinute=0;}
  if(tick%60===0)updateDayNight();
  updateWeather();

  // Movement
  let dx=0,dy=0;
  if(keys["w"]||keys["arrowup"])dy=-1;
  if(keys["s"]||keys["arrowdown"])dy=1;
  if(keys["a"]||keys["arrowleft"])dx=-1;
  if(keys["d"]||keys["arrowright"]){if(!keys["arrowleft"])dx=1;}
  if(joyDX||joyDY){dx=joyDX;dy=joyDY;}
  moving=dx!==0||dy!==0;
  if(moving){
    const mag=Math.hypot(dx,dy)||1; dx/=mag; dy/=mag;
    const spd=playerSpeed*(stamina>0?1:0.4)*(hunger>20?1:0.7);
    player.x=Math.max(10,Math.min(shopW-player.w-10,player.x+dx*spd));
    player.y=Math.max(25,Math.min(shopH-player.h-10,player.y+dy*spd));
    if(dx>0)player.dir="right";else if(dx<0)player.dir="left";else if(dy>0)player.dir="down";else player.dir="up";
    player.frameTimer++;if(player.frameTimer>8){player.frame=(player.frame+1)%4;player.frameTimer=0;}
    stamina=Math.max(0,stamina-staminaDrain);
    hunger=Math.max(0,hunger-hungerDrain);
    if(tick%18===0)SFX.footstep();
  } else {
    stamina=Math.min(maxStamina,stamina+staminaRegen);
    hunger=Math.max(0,hunger-hungerDrain*0.3);
  }

  // Camera
  camera.x=Math.max(0,Math.min(shopW-viewW,player.x+player.w/2-viewW/2));
  camera.y=Math.max(0,Math.min(shopH-viewH,player.y+player.h/2-viewH/2));

  // Hunger effects
  if(hunger<20&&tick%90===0)showToast("😵 Com fome! Vá à cantina!");
  if(hunger<10){hungryWorkTick++;if(hungryWorkTick>3600)workedHungryDay=true;}

  // Auto order parts
  if(hasAutoOrder&&tick%300===0&&parts<maxParts){const cost=10;if(money>=cost){money-=cost;parts=Math.min(parts+3,maxParts);}}
  // Ajudante reabastece automaticamente a cada 3 min se tiver _helperAutoRestock
  if(window._helperAutoRestock&&helpers.length>0&&tick%3600===0&&parts<maxParts){
    const rcost=Math.floor((window._restockCost||30)*(window._diffPartsCostMult||1))*(maxParts-parts);
    if(money>=rcost){money-=rcost;parts=maxParts;SFX.restock();showToast("🤖 Ajudante reabasteceu automaticamente! 📦");updateHUD();}
  }

  // Toldo Solar: sem drain de stamina no sol forte
  if(window._solarToldo && weatherState==="sun" && moving) {
    stamina=Math.min(maxStamina,stamina+staminaDrain);// cancela o drain que já foi feito
  }
  // Ar-condicionado: regen 2× mais rápido no calor
  if(window._acBonus && (weatherState==="sun"||weatherState==="storm") && !moving){
    stamina=Math.min(maxStamina,stamina+staminaRegen);
  }
  // Garrafa Térmica: recupera stamina ao passar pela bancada
  if(window._thermosBonus){
    const bdx=player.x+player.w/2-(bench.x+bench.w/2);
    const bdy=player.y+player.h/2-(bench.y+bench.h/2);
    if(Math.hypot(bdx,bdy)<90&&tick%60===0){
      stamina=Math.min(maxStamina,stamina+10);
      spawnFloatText(player.x+player.w/2,player.y-20,"☕ +10⚡","#fbbf24");
    }
  }

  // Helper AI — v2.0 com estados inteligentes
  helpers.forEach(h => updateHelperAI(h));

  // Update rain drops
  // Rain drops physics — delegado ao WeatherSystem
  WeatherSystem.tickDrops();

  // Car patience
  [...cars].forEach(car=>{
    if(car.fixed)return;
    car.patienceTimer++;car.patience=1-car.patienceTimer/car.maxPatience;
    if(window._patienceWarn&&car.patience>0&&car.patience<=0.1&&!car._warned){
      car._warned=true;
      SFX.staminaWarn();
      showToast(`⚠️ ${car.personality?.emoji||"🚗"} Cliente prestes a ir embora!`);
    }
    if(car.patience<=0){
      const bay=bays.find(b=>b.car===car);if(bay)bay.car=null;
      const i=cars.indexOf(car);if(i>-1)cars.splice(i,1);
      const loss=calcRepLoss();reputation=Math.max(0,reputation-loss);
      SFX.carLeave();
      _dayHadClientLeave = true;
      EventBus.emit('car:left', { car, repLoss: loss });
      if(car.personality?.id==="complainer"){showToast(`😠 Reclamão foi embora! -${loss+2}⭐ ← review negativo!`);reputation=Math.max(0,reputation-2);}
      else showToast(`🚗 Cliente foi embora! -${loss}⭐`);
      updateHUD();
      // Voucher de Desconto (ret3): cliente volta em 45s com +50% paciencia
      if(window._voucherReturn && car.personality?.id !== "complainer" && isOpen()){
        const returnCar={...car,fixed:false,diagnosed:false,workProgress:0,patience:1,patienceTimer:0,maxPatience:car.maxPatience*1.5,_wasVoucher:true,id:Math.random()};
        setTimeout(()=>{
          if(!isOpen())return;
          const freeBay=bays.slice(0,getActiveBayCount()).find(b=>!b.car);
          if(!freeBay)return;
          returnCar.x=freeBay.x;returnCar.y=freeBay.y;
          returnCar.w=freeBay.w;returnCar.h=freeBay.h;
          returnCar.bay=freeBay;freeBay.car=returnCar;
          cars.push(returnCar);
          SFX.carArrive();
          spawnFloatText(freeBay.x+freeBay.w/2,freeBay.y,"🎁 Voltou c/ voucher!","#34d399");
          showToast("🎁 Cliente voltou com voucher! (+50% paciencia)");
          updateHUD();
        },45000);
      }
    }
  });

  // Spawn
  spawnTimer++;if(spawnTimer>getFameSpawnDelay()){spawnTimer=0;if(isOpen())spawnCar();}

  // Particles
  if(window._particlesEnabled === false && particles.length) particles.length = 0;
  particles.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=p.type==="dust"?0.01:0.06;p.life-=p.type==="dust"?0.04:0.025;});
  for(let i=particles.length-1;i>=0;i--){if(particles[i].life<=0)particles.splice(i,1);}
  floatTexts.forEach(f=>{f.y+=f.vy;f.life-=0.015;});
  for(let i=floatTexts.length-1;i>=0;i--){if(floatTexts[i].life<=0)floatTexts.splice(i,1);}

  if(stamina<maxStamina*0.2&&stamina>0&&tick%90===0)SFX.staminaWarn();
  if(actionCooldown>0)actionCooldown--;
  if(tick%120===0){updateHUD();checkMissions();renderUpgradePanel();checkAchievements();checkBankruptcy();checkBankruptcyRecovery();}
}

function draw(){
  ctx.setTransform(renderDpr,0,0,renderDpr,0,0);
  ctx.clearRect(0,0,viewW,viewH);
  ctx.fillStyle="#050402";ctx.fillRect(0,0,viewW,viewH);
  drawFloor();
  drawWalls();
  drawUpgradeDecorations();
  bays.forEach(b=>drawBay(b));
  drawBench();drawPartsShelf();drawDesk();drawWaitArea();
  drawRadio();
  drawPartsShopCounter();
  drawCantineArea();
  drawAllVehicles();
  drawOutside();
  drawHelpers();
  drawPlayer();
  drawNearbyHint();
  drawSpeechBubbles();
  drawParticles();
  drawFloatTexts();
  drawRain();
  drawClosedBanner();
  // Tier-up anim
  if(_tierUpAnim&&_tierUpAnim.timer>0){
    _tierUpAnim.timer--;const t2=_tierUpAnim;
    const alpha=Math.min(1,t2.timer/40)*Math.min(1,(t2.timer)/60);const scale=1+0.3*(1-Math.min(1,t2.timer/60));
    ctx.save();ctx.fillStyle=withAlpha(t2.color,alpha*0.12);ctx.fillRect(0,0,viewW,viewH);
    ctx.globalAlpha=alpha;ctx.translate(viewW/2,viewH/2-40);ctx.scale(scale,scale);
    const cw2=340,ch2=100;const cardG=ctx.createLinearGradient(-cw2/2,-ch2/2,cw2/2,ch2/2);cardG.addColorStop(0,"rgba(0,0,0,0.9)");cardG.addColorStop(1,"rgba(20,10,0,0.92)");
    ctx.fillStyle=cardG;ctx.beginPath();ctx.roundRect(-cw2/2,-ch2/2,cw2,ch2,12);ctx.fill();
    ctx.strokeStyle=t2.color;ctx.lineWidth=3;ctx.beginPath();ctx.roundRect(-cw2/2,-ch2/2,cw2,ch2,12);ctx.stroke();
    ctx.shadowColor=t2.color;ctx.shadowBlur=30;ctx.strokeStyle=t2.color;ctx.lineWidth=1.5;ctx.beginPath();ctx.roundRect(-cw2/2+2,-ch2/2+2,cw2-4,ch2-4,10);ctx.stroke();ctx.shadowBlur=0;
    ctx.textAlign="center";ctx.fillStyle=t2.color;ctx.font="bold 14px 'Press Start 2P'";ctx.fillText("NOVA FAMA!",0,-22);
    ctx.font="bold 28px 'VT323'";ctx.fillStyle="#fff";ctx.fillText(`${t2.emoji}  ${t2.name}`,0,12);
    const tier2=getFameTier(reputation);ctx.font="13px 'VT323'";ctx.fillStyle="rgba(255,255,255,0.7)";ctx.fillText(tier2.desc,0,36);
    ctx.font="11px 'VT323'";ctx.fillStyle=t2.color;
    const bonuses=[];if(tier2.spawnBonus>0)bonuses.push(`+${Math.round(tier2.spawnBonus*100)}% clientes`);if(tier2.priceBonus>0)bonuses.push(`+${Math.round(tier2.priceBonus*100)}% preço`);if(tier2.vipChance>0)bonuses.push(`VIP ${Math.round(tier2.vipChance*100)}%`);
    ctx.fillText(bonuses.join("  |  "),0,54);ctx.restore();
  }
  // Vignette (configurável)
  if(window._vignetteEnabled !== false && window._graphicsQuality !== 'baixa'){
    const vig=ctx.createRadialGradient(viewW/2,viewH/2,viewH*0.3,viewW/2,viewH/2,viewH*0.85);vig.addColorStop(0,"rgba(0,0,0,0)");vig.addColorStop(1,"rgba(0,0,0,0.55)");
    ctx.fillStyle=vig;ctx.fillRect(0,0,viewW,viewH);
  }
  // GameState indicator (debug/HUD)
  if(currentGameState===GAME_STATE.PAUSE){
    ctx.fillStyle='rgba(0,0,0,0.45)';ctx.fillRect(0,0,viewW,viewH);
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// 🎮 SISTEMA DE GAMESTATE — Menu / Playing / Pause / GameOver
// ══════════════════════════════════════════════════════════════════════════════
// [gameState.js] GAME_STATE, setGameState, state helpers — extraído para js/gameState.js
let _lastFrame=performance.now(),_accumulator=0;
const FIXED_STEP=1000/60;
function loop(now=performance.now()){
  let elapsed=Math.min(250,Math.max(0,now-_lastFrame)); _lastFrame=now;
  const fpsCap=window._fpsCap||0;
  _accumulator+=elapsed;
  if (currentGameState !== GAME_STATE.MENU) {
    if (currentGameState === GAME_STATE.PLAYING) {
      let steps=0;
      while(_accumulator>=FIXED_STEP&&steps<8){update();_accumulator-=FIXED_STEP;steps++;}
      if(steps===8)_accumulator=0;
    } else _accumulator=0;
    const shouldDraw=!fpsCap || !window._lastRenderAt || now-window._lastRenderAt>=1000/fpsCap;
    if(shouldDraw){draw();window._lastRenderAt=now;}
  } else _accumulator=0;
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

// ── Input ─────────────────────────────────────────────────────────────────────
document.addEventListener("keydown",e=>{
  if(document.getElementById("tutorial").style.display!=="none")return;
  if(currentGameState===GAME_STATE.MENU)return;
  if(currentGameState===GAME_STATE.PAUSE)return;
  keys[e.key.toLowerCase()]=true;
  if(e.key===" "){e.preventDefault();doFix();}
  if(e.key.toLowerCase()==="f"){doFix();}
  if(e.key.toLowerCase()==="e"){
    if(nearShop())openPartsShop();
    else if(!hasCantine&&nearCantineArea())buyCantineInWorld();
    else doDiagnose();
  }
  if(e.key.toLowerCase()==="q"){doDiagnose();}
  if(e.key.toLowerCase()==="r"){doRestock();}
  if(e.key==="1"&&nearCantine())doEat(0);
  if(e.key==="2"&&nearCantine())doEat(1);
  if(e.key==="3"&&nearCantine())doEat(2);
  if(e.key==="4"&&nearCantine())doEat(3);
  if(e.key==="5"&&nearCantine())doEat(4);
});
document.addEventListener("keyup",e=>{keys[e.key.toLowerCase()]=false;});

// ── Controles mobile ──────────────────────────────────────────────────────────
(function initMobileControls(){
  const root=document.getElementById('mobile-controls'); if(!root) return;
  const releaseAll=()=>{['w','a','s','d'].forEach(k=>keys[k]=false); joyDX=0; joyDY=0;const k=root.querySelector('.joystick-knob');if(k)k.style.transform='translate(-50%,-50%)';};
  const zone=root.querySelector('.mobile-dpad'); const knob=root.querySelector('.joystick-knob');
  if(zone&&knob){
    const move=e=>{e.preventDefault();const r=zone.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;let dx=e.clientX-cx,dy=e.clientY-cy;const max=r.width*.32,m=Math.hypot(dx,dy)||1;if(m>max){dx=dx/m*max;dy=dy/m*max;}joyDX=dx/max;joyDY=dy/max;knob.style.transform=`translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px))`;};
    zone.addEventListener('pointerdown',e=>{zone.setPointerCapture?.(e.pointerId);move(e);});zone.addEventListener('pointermove',e=>{if(e.buttons||e.pressure>0)move(e);});zone.addEventListener('pointerup',releaseAll);zone.addEventListener('pointercancel',releaseAll);
  }
  const buzz=ms=>{if(window._vibrationEnabled!==false&&navigator.vibrate)navigator.vibrate(ms);};
  const runAction=(action)=>{
    if(currentGameState!==GAME_STATE.PLAYING) return;
    buzz(18);
    if(action==='fix') doFix();
    else if(action==='diagnose') doDiagnose();
    else if(action==='restock') doRestock();
    else if(action==='interact'){if(nearShop()) openPartsShop();else if(!hasCantine&&nearCantineArea()) buyCantineInWorld();else if(nearCantine()) doEat(0);else doDiagnose();}
  };
  root.querySelectorAll('[data-action]').forEach(btn=>btn.addEventListener('pointerdown',e=>{e.preventDefault();runAction(btn.dataset.action);btn.classList.add('pressed');setTimeout(()=>btn.classList.remove('pressed'),120);}));
  window.addEventListener('blur',releaseAll);document.addEventListener('visibilitychange',()=>{if(document.hidden)releaseAll();});
})();

// ── Tela Cheia ────────────────────────────────────────────────────────────────
function toggleFS(){if(!document.fullscreenElement){document.documentElement.requestFullscreen().catch(()=>{});}else{document.exitFullscreen();}}
document.getElementById("fs-btn").addEventListener("click",toggleFS);
document.addEventListener("keydown",e=>{if(e.key==="F11"){e.preventDefault();toggleFS();}},true);
document.addEventListener("fullscreenchange",()=>{const btn=document.getElementById("fs-btn");btn.textContent=document.fullscreenElement?"✕ SAIR TELA CHEIA":"⛶ TELA CHEIA";});

// ── SAVE SYSTEM ──────────────────────────────────────────────────────────────
// [saveSystem.js] SaveSystem completo — extraído para js/saveSystem.js
let currentSlot = null;
let tutorialReturnTarget = null;
// ── MENU SYSTEM ───────────────────────────────────────────────────────────────
let saveScreenMode='load';
function openSaveScreen(mode){
  saveScreenMode=mode;
  const title=document.getElementById("save-title");
  if(mode==='new')title.textContent="NOVO JOGO — ESCOLHA O SLOT";
  else if(mode==='save')title.textContent="💾 SALVAR JOGO";
  else title.textContent="CARREGAR JOGO";
  renderSaveSlots();document.getElementById("save-screen").style.display="flex";
}
function closeSaveScreen(){document.getElementById("save-screen").style.display="none";}
function renderSaveSlots(){
  const container=document.getElementById("save-slots-list");container.innerHTML="";
  for(let i=1;i<=3;i++){
    const info=getSlotInfo(i);const isEmpty=!info;let inner="";
    if(isEmpty){inner=`<div class="slot-icon">💿</div><div class="slot-info"><div class="slot-name">SLOT ${i} — VAZIO</div><div class="slot-details" style="color:#555">Nenhum dado salvo</div></div>`;}
    else{
      const upgBought=(info.upgrades||[]).filter(u=>u.bought).length;
      inner=`<div class="slot-icon">🔧</div><div class="slot-info"><div class="slot-name">SLOT ${i}</div><div class="slot-details"><span>💰$${info.money}</span><span>⭐${info.reputation}</span><span>🔧${info.fixCount||0} consertos</span><span>📦${upgBought} upgrades</span></div><div class="slot-date">${info.date||""}</div></div><div class="slot-actions"><button class="slot-del" onclick="event.stopPropagation();confirmDeleteSlot(${i})">🗑 DEL</button></div>`;
    }
    const slot=document.createElement("div");slot.className="save-slot"+(isEmpty?" empty":"");slot.innerHTML=inner;slot.addEventListener("click",()=>selectSlot(i,isEmpty));container.appendChild(slot);
  }
}
function selectSlot(slot,isEmpty){
  if(saveScreenMode==='save'){saveToSlot(slot);closeSaveScreen();document.getElementById("pause-menu").style.display="none";showToast(`💾 Salvo no Slot ${slot}!`);return;}
  if(saveScreenMode==='new'){resetGameState();currentSlot=slot;saveToSlot(slot);closeSaveScreen();startGame();return;}
  if(isEmpty){resetGameState();currentSlot=slot;saveToSlot(slot);closeSaveScreen();startGame();}
  else{if(loadFromSlot(slot)){closeSaveScreen();startGame();}else{showToast("Erro ao carregar slot!");}}
}
function confirmDeleteSlot(slot){if(confirm(`Deletar o Slot ${slot}?`)){deleteSlot(slot);renderSaveSlots();showToast(`Slot ${slot} deletado.`);}}
function resetGameState(){
  money=200;reputation=0;fixCount=0;carsDone=0;totalMoneyEarned=200;
  parts=20;maxParts=20;hasAutoOrder=false;hasHelper=false;
  playerSpeed=3.5;maxStamina=100;stamina=100;hunger=100;hasCantine=false;
  staminaDrain=0.05;staminaRegen=0.04;
  diagnosticLevel=1;toolQuality=1;reputationMult=1;
  gameMinute=8*60;tick=0;spawnDelay=1800;spawnTimer=0;
  _lastTierIdx=0;_tierUpAnim=null;
  cars.length=0;particles.length=0;floatTexts.length=0;helpers.length=0;speechBubbles.length=0;
  bays.forEach(b=>b.car=null);
  player.x=400;player.y=600;player.dir="down";player.frame=0;
  camera.x=0;camera.y=0;
  missions.forEach(m=>{m.done=false;m.progress=0;});
  upgradesList.forEach(u=>{if(u.id)u.bought=false;});
  resetDerivedUpgradeState();
  ACHIEVEMENTS.forEach(a=>a.done=false);
  PART_TYPES.forEach(p=>partInventory[p.id]=0);
  vipCount=0;rainFixes=0;truckFixes=0;motoFixes=0;loyalCount=0;
  weatherState="clear";rainDrops=[];
  dayStartMoney=200;dayStartFix=0;dayReportData=null;dayHistory=[];_dayHadClientLeave=false;window._neverLeft=false;
  if(typeof BillsSystem!=="undefined" && BillsSystem.reset) BillsSystem.reset();
  ["task-board","bills-panel","upgrade-panel"].forEach(id=>{const el=document.getElementById(id);if(el)el.classList.remove("open");});
}

function startGame(){
  loadAchievementsFromStorage();
  if(typeof applyDifficulty === "function") applyDifficulty();
  document.getElementById("save-screen").style.display="none";
  document.getElementById("tutorial").style.display="none";
  setGameState(GAME_STATE.PLAYING);
  updateDayNight();updateHUD();renderUpgradePanel();checkMissions();
  setTimeout(spawnCar,3000);setTimeout(spawnCar,8000);
  // Dicas de progressão para novos jogos
  if(money<=200&&fixCount===0) setTimeout(showProgressionTips, 4000);
}
function returnToMenu(){
  if(currentSlot!==null)saveToSlot(currentSlot);
  cars.length=0;particles.length=0;floatTexts.length=0;speechBubbles.length=0;
  bays.forEach(b=>b.car=null);
  setGameState(GAME_STATE.MENU);
}
// [gameState.js] pauseGame, resumeGame — extraído para js/gameState.js
function showTutorialFromMenu(){tutorialReturnTarget='menu';document.getElementById("tutorial").style.display="flex";}
function showTutorialFromPause(){tutorialReturnTarget='pause';document.getElementById("pause-menu").style.display="none";document.getElementById("tutorial").style.display="flex";}
function closeTutorial(){document.getElementById("tutorial").style.display="none";if(tutorialReturnTarget==='pause')document.getElementById("pause-menu").style.display="flex";tutorialReturnTarget=null;}
window.closeTutorial=closeTutorial;window.showTutorialFromMenu=showTutorialFromMenu;window.showTutorialFromPause=showTutorialFromPause;
window.openSaveScreen=openSaveScreen;window.closeSaveScreen=closeSaveScreen;window.selectSlot=selectSlot;window.confirmDeleteSlot=confirmDeleteSlot;window.resumeGame=resumeGame;window.returnToMenu=returnToMenu;

document.addEventListener("keydown",e=>{
  if(e.key==="Escape"){
    e.preventDefault();
    const tut=document.getElementById("tutorial");const menu=document.getElementById("main-menu");const save=document.getElementById("save-screen");const pause=document.getElementById("pause-menu");
    if(tut.style.display!=="none"){closeTutorial();return;}
    if(save.style.display!=="none"){closeSaveScreen();return;}
    if(menu.style.display!=="none")return;
    if(gamePaused){resumeGame();}else{pauseGame();}
  }
},true);

updateDayNight();updateHUD();renderUpgradePanel();checkMissions();

// ── Canvas click: comprar Cantina clicando nela ──────────────────────────────
canvas.addEventListener("click",e=>{
  if(currentGameState!==GAME_STATE.PLAYING)return;
  if(hasCantine)return;
  const rect=canvas.getBoundingClientRect();
  const mx=e.clientX-rect.left;const my=e.clientY-rect.top;
  const cx=tx(cantineArea.x),cy=ty(cantineArea.y),cw=cantineArea.w,ch=cantineArea.h;
  if(mx>=cx&&mx<=cx+cw&&my>=cy&&my<=cy+ch){
    buyCantineInWorld();
  }
});

// ── Tutorial de Progressão de Upgrades ───────────────────────────────────────
const PROGRESSION_TIPS = [
  { day: 0, tip: "💡 Compre <b>📢 Propaganda</b> primeiro! Mais clientes = mais dinheiro rápido.", upg: "rep1" },
  { day: 0, tip: "💡 <b>🔧 Chave de Impacto</b> acelera seus consertos — compre cedo!", upg: "tool1" },
  { day: 1, tip: "💡 <b>📦 Estoque Ampliado</b> evita ficar sem peças na correria.", upg: "parts1" },
  { day: 2, tip: "💡 Com Fama 25, desbloqueie a <b>🍔 Cantina</b> para recuperar energia!", upg: "cantine" },
  { day: 3, tip: "💡 <b>🔔 Campainha de Aviso</b> te alerta antes do cliente ir embora — vale muito!", upg: "ret1" },
  { day: 4, tip: "💡 No <b>Dia 6</b> chegam as contas! Prepare pelo menos $800 no caixa. 💸", upg: null },
  { day: 5, tip: "💡 Com Fama 50, contrate o <b>👷 Assistente</b> para consertar enquanto você diagnostica!", upg: "helper" },
];

let _shownTips = new Set();

function showProgressionTips() {
  const day = Math.floor(tick / (24 * 60 * 4)) + 1;
  PROGRESSION_TIPS.forEach(t => {
    if(t.day !== day - 1) return;
    const key = t.upg || ('day'+t.day);
    if(_shownTips.has(key)) return;
    // Não mostra se o upgrade já foi comprado
    if(t.upg) {
      const u = upgradesList.find(x => x.id === t.upg);
      if(u && u.bought) return;
    }
    _shownTips.add(key);
    showProgressionToast(t.tip);
  });
}

function showProgressionToast(html) {
  const el = document.createElement('div');
  el.className = 'prog-tip';
  el.innerHTML = html;
  document.body.appendChild(el);
  setTimeout(() => el.classList.add('prog-tip-show'), 50);
  setTimeout(() => { el.classList.remove('prog-tip-show'); setTimeout(() => el.remove(), 500); }, 6000);
}

// Verifica dicas a cada fim de dia
EventBus.on('game:resume', () => { setTimeout(showProgressionTips, 1500); });

// ── Condição Leve de Falência ─────────────────────────────────────────────────
let _brokeDay    = -1;  // dia em que ficou zerado/negativo
let _brokeWarned = false;

function checkBankruptcy() {
  if(money > 0) {
    _brokeDay    = -1;
    _brokeWarned = false;
    const moneyEl = document.getElementById('money');
    if(moneyEl) moneyEl.style.color = '';
    return;
  }

  const day = Math.floor(tick / (24 * 60 * 4)) + 1;

  // Primeiro dia sem dinheiro
  if(_brokeDay === -1) {
    _brokeDay = day;
    showToast('⚠️ Caixa zerado! Conserte carros para recuperar!');
  }

  // Dois dias seguidos sem dinheiro = alerta vermelho
  if(day >= _brokeDay + 1 && !_brokeWarned) {
    _brokeWarned = true;
    showToast('🚨 ALERTA: 2 dias no vermelho! Você pode perder a oficina!');
    // Congela upgrades visualmente
    const moneyEl = document.getElementById('money');
    if(moneyEl) moneyEl.style.color = '#f87171';
    // Penalidade leve: -20 fama (clientes desconfiando)
    reputation = Math.max(0, reputation - 20);
    updateHUD();
    if(typeof SFX !== 'undefined') SFX.error();
  }

  // Três dias seguidos = bloqueio de upgrades
  if(day >= _brokeDay + 2) {
    const panel = document.getElementById('upgrade-panel');
    if(panel) panel.style.opacity = '0.4';
    if(panel) panel.style.pointerEvents = 'none';
    if(!document.getElementById('broke-overlay')) {
      const overlay = document.createElement('div');
      overlay.id = 'broke-overlay';
      overlay.innerHTML = '🚨 OFICINA EM CRISE!<br><small>Quite as dívidas para operar normalmente</small>';
      overlay.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(220,38,38,0.95);color:white;font-family:"Press Start 2P",monospace;font-size:10px;padding:20px 30px;border-radius:12px;z-index:500;text-align:center;line-height:2;border:2px solid #f87171;box-shadow:0 0 40px rgba(220,38,38,0.6);animation:bills-pulse 1s infinite alternate;pointer-events:none;';
      document.body.appendChild(overlay);
      setTimeout(() => { const o = document.getElementById('broke-overlay'); if(o) o.remove(); }, 5000);
    }
  }
}

// Restaura ao ter dinheiro de novo
function checkBankruptcyRecovery() {
  if(money > 0 && _brokeDay !== -1) {
    _brokeDay    = -1;
    _brokeWarned = false;
    const panel = document.getElementById('upgrade-panel');
    if(panel) { panel.style.opacity = ''; panel.style.pointerEvents = ''; }
    const moneyEl = document.getElementById('money');
    if(moneyEl) moneyEl.style.color = '';
    showToast('✅ Caixa recuperado! Oficina voltando ao normal.');
  }
}
