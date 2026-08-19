
const canvas = document.getElementById('gameCanvas');

// ===== V4.5 fullscreen + landscape =====
async function enterGameDisplayMode(){
  document.body.classList.add('playing','game-landscape');
  try {
    const el = document.documentElement;
    if (!document.fullscreenElement && el.requestFullscreen) {
      await el.requestFullscreen({navigationUI:'hide'});
    }
  } catch(e) {}
  try {
    if (screen.orientation && screen.orientation.lock) {
      await screen.orientation.lock('landscape');
    }
  } catch(e) {}
  setViewportHeight();
}
function leaveGameDisplayMode(){
  document.body.classList.remove('playing','game-landscape');
  try {
    if (screen.orientation && screen.orientation.unlock) screen.orientation.unlock();
  } catch(e) {}
}
function setViewportHeight(){
  document.documentElement.style.setProperty('--vh',(window.innerHeight*.01)+'px');
}
window.addEventListener('resize',setViewportHeight,{passive:true});
window.addEventListener('orientationchange',()=>setTimeout(setViewportHeight,180),{passive:true});
setViewportHeight();

const ctx = canvas.getContext('2d');
const W = canvas.width, H = canvas.height;

// ===== V4.1 SPRITES EMBUTIDOS =====
const userBaseSprite = new Image();
userBaseSprite.src = 'assets/sprites/base.png';

const spriteSniperV54=new Image();
spriteSniperV54.src='assets/sprites/sniper.png';
const spriteTankV54=new Image();
spriteTankV54.src='assets/sprites/tanque.png';
const spriteJeepV54=new Image();
spriteJeepV54.src='assets/sprites/jipe.png';
const spriteBazookaV54=new Image();
spriteBazookaV54.src='assets/sprites/bazuca.png';
const spriteGunnerV54=new Image();
spriteGunnerV54.src='assets/sprites/metralhador.png';
const spriteCommandV55=new Image();
spriteCommandV55.src='assets/sprites/comando.png';
const unitSpriteAtlas = new Image();
const tankUserSprite = new Image();
tankUserSprite.src = 'assets/sprites/tanque-antigo.png';

const sniperUserSprite = new Image();
sniperUserSprite.src = 'assets/sprites/sniper-antigo.png';

const heavyFinalSprite = new Image();
heavyFinalSprite.src = 'assets/sprites/pesado.png';

const userBazookaSprite = new Image();
userBazookaSprite.src = 'assets/sprites/bazuca-antigo.png';

const recruitAnimSheetV59 = new Image();
recruitAnimSheetV59.src = 'assets/sprites/recruta-animacoes.png';
const recruitFinalSprite = new Image();
recruitFinalSprite.src = 'assets/sprites/recruta.png';

unitSpriteAtlas.src = 'assets/sprites/atlas-unidades-legado.png';
const SPRITE_CELL = 144;

const bossColossoV56=new Image();
bossColossoV56.src='assets/sprites/boss-colosso-mk1.png';
const bossFalcaoV56=new Image();
bossFalcaoV56.src='assets/sprites/boss-falcao-de-guerra.png';
const bossOmegaV56=new Image();
bossOmegaV56.src='assets/sprites/boss-mecha-omega.png';
const bossFxAtlas = new Image();
bossFxAtlas.src = 'assets/sprites/atlas-boss-efeitos-legado.png';
const BOSS_SPRITES = {
  boss5:  {x:0,y:0,w:256,h:160},
  boss10: {x:256,y:0,w:256,h:160},
  boss15: {x:512,y:0,w:256,h:160}
};
const BASE_FRAMES = Array.from({length:8},(_,i)=>({x:i*128,y:176,w:128,h:160}));
const FX_FRAMES = Array.from({length:4},(_,i)=>({x:i*128,y:352,w:128,h:128}));

function drawBossAtlas(u){
  const cfg={boss5:{img:bossColossoV56,w:126,h:94,y:0},boss10:{img:bossFalcaoV56,w:138,h:82,y:-18},boss15:{img:bossOmegaV56,w:122,h:112,y:0}}[u.def.key];
  if(!cfg||!cfg.img.complete||!cfg.img.naturalWidth)return false;
  const facing=u.side==='player'?1:-1,p=spriteAnimPose(u,u.def.key==='boss10',true),pulse=.5+Math.sin(performance.now()*.006)*.5;
  const ratio=cfg.img.naturalWidth/cfg.img.naturalHeight;let dw=cfg.w,dh=dw/ratio;if(dh>cfg.h){dh=cfg.h;dw=dh*ratio;}
  ctx.save();ctx.globalAlpha=.34;ctx.fillStyle='#000';ctx.beginPath();ctx.ellipse(u.x+u.def.w/2,GROUND_Y+2,dw*.32,u.def.key==='boss10'?5:8,0,0,Math.PI*2);ctx.fill();ctx.restore();
  const hover=u.def.key==='boss10'?Math.sin(performance.now()*.004)*4:0;
  ctx.save();ctx.translate(u.x+u.def.w/2-p.recoil*facing,u.y+u.def.h+cfg.y+p.bob+hover);ctx.scale(facing*p.sx,p.sy);ctx.rotate(p.tilt*facing);
  if(p.hit){ctx.shadowBlur=20;ctx.shadowColor='#fff';}ctx.imageSmoothingEnabled=true;ctx.drawImage(cfg.img,-dw/2,-dh,dw,dh);ctx.shadowBlur=0;
  ctx.globalCompositeOperation='source-atop';ctx.globalAlpha=.045+.055*pulse;ctx.fillStyle='#ff2015';ctx.fillRect(-dw/2,-dh,dw,dh);ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1;
  if((u.muzzle||0)>0){ctx.globalAlpha=Math.min(1,u.muzzle/4);ctx.fillStyle='#ffb12b';ctx.shadowBlur=18;ctx.shadowColor='#ff3a16';ctx.beginPath();ctx.arc(dw*.39,-dh*.50,5+5*pulse,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;}
  ctx.restore();return true;
}

function drawBaseAtlas(x,side,hp){
  if(!bossFxAtlas.complete || !bossFxAtlas.naturalWidth) return false;
  const idx=Math.min(7,Math.max(0,Math.floor((1-Math.max(0,hp))*8)));
  const s=BASE_FRAMES[idx];
  const dw=68,dh=102;
  ctx.save();
  ctx.translate(x+(side==='player'?0:BASE_W),GROUND_Y);
  ctx.scale(side==='player'?1:-1,1);
  ctx.imageSmoothingEnabled=false;
  ctx.drawImage(bossFxAtlas,s.x,s.y,s.w,s.h,-6,-dh,dw,dh);
  if(side==='player'){ctx.globalCompositeOperation='source-atop';ctx.globalAlpha=.12;ctx.fillStyle='#42a5ff';ctx.fillRect(-6,-dh,dw,dh);}
  else {ctx.globalCompositeOperation='source-atop';ctx.globalAlpha=.12;ctx.fillStyle='#ff3b2f';ctx.fillRect(-6,-dh,dw,dh);}
  ctx.restore();
  return true;
}

function drawFxSprite(p){
  if(!bossFxAtlas.complete || !bossFxAtlas.naturalWidth) return false;
  const a=Math.max(p.life/p.maxLife,0);
  const fi=Math.min(3,Math.floor((1-a)*4));
  const s=FX_FRAMES[fi];
  const sz=Math.max(22,p.size*3.1);
  ctx.save();ctx.globalAlpha=Math.min(1,a*1.35);ctx.imageSmoothingEnabled=false;
  ctx.drawImage(bossFxAtlas,s.x,s.y,s.w,s.h,p.x-sz/2,p.y-sz/2,sz,sz);
  ctx.restore();return true;
}

const SPRITE_COL = {
  recruta:0, bazuca:1, pesado:2, sniper:3,
  metralha:4, jipe:5, tanque:6, comando:7
};
function spriteFrameFor(u) {
  if ((u.recoil||0) > .35 || (u.muzzle||0) > 0) return 3;
  if ((u.hitFlash||0) > 0) return 4;
  if (u.moving) return 1 + (Math.floor(u.animTime/8)%2);
  return 0;
}
function drawTankUser(u){
  if(u.def.key!=='tanque' || !tankUserSprite.complete || !tankUserSprite.naturalWidth) return false;
  const facing=u.side==='player'?1:-1;
  const recoil=(u.recoil||0)*3.5;
  const dw=118,dh=82;
  ctx.save();
  ctx.globalAlpha=.30;ctx.fillStyle='#000';
  ctx.beginPath();ctx.ellipse(u.x+u.def.w/2,u.y+u.def.h-1,42,7,0,0,Math.PI*2);ctx.fill();
  ctx.globalAlpha=1;
  ctx.translate(u.x+u.def.w/2-recoil*facing,u.y+u.def.h);
  ctx.scale(facing,1);
  if(u.hitFlash>0){ctx.shadowBlur=15;ctx.shadowColor='#fff';}
  ctx.imageSmoothingEnabled=true;
  ctx.drawImage(tankUserSprite,0,0,640,512,-dw/2,-dh,dw,dh);
  if(u.side==='enemy'){
    ctx.globalCompositeOperation='source-atop';
    ctx.globalAlpha=.20;ctx.fillStyle='#ff2418';ctx.fillRect(-dw/2,-dh,dw,dh);
    ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1;
  }
  if((u.muzzle||0)>0){
    ctx.globalAlpha=Math.min(1,u.muzzle/4);ctx.fillStyle='#ffd15b';
    ctx.beginPath();ctx.moveTo(dw*.46,-dh*.60);ctx.lineTo(dw*.72,-dh*.66);ctx.lineTo(dw*.61,-dh*.53);ctx.closePath();ctx.fill();
  }
  ctx.restore();return true;
}

function drawSniperUser(u){
  if(u.def.key!=='sniper' || !sniperUserSprite.complete || !sniperUserSprite.naturalWidth) return false;
  const facing=u.side==='player'?1:-1;
  const bob=u.moving?Math.abs(Math.sin(u.animTime*.20))*1.0:0;
  const recoil=(u.recoil||0)*2.5;
  const dw=72,dh=72;
  ctx.save();
  ctx.globalAlpha=.27;ctx.fillStyle='#000';
  ctx.beginPath();ctx.ellipse(u.x+u.def.w/2,u.y+u.def.h-1,21,4.5,0,0,Math.PI*2);ctx.fill();
  ctx.globalAlpha=1;
  ctx.translate(u.x+u.def.w/2-recoil*facing,u.y+u.def.h+bob);
  ctx.scale(facing,1);
  if(u.hitFlash>0){ctx.shadowBlur=12;ctx.shadowColor='#fff';}
  ctx.imageSmoothingEnabled=true;
  ctx.drawImage(sniperUserSprite,0,0,512,512,-dw/2,-dh,dw,dh);
  if(u.side==='enemy'){
    ctx.globalCompositeOperation='source-atop';
    ctx.globalAlpha=.24;ctx.fillStyle='#ff2418';ctx.fillRect(-dw/2,-dh,dw,dh);
    ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1;
  }
  if((u.muzzle||0)>0){
    ctx.globalAlpha=Math.min(1,u.muzzle/4);ctx.fillStyle='#ffe08a';
    ctx.beginPath();ctx.moveTo(dw*.43,-dh*.61);ctx.lineTo(dw*.74,-dh*.64);ctx.lineTo(dw*.62,-dh*.55);ctx.closePath();ctx.fill();
  }
  ctx.restore();return true;
}

function drawHeavyFinal(u){
  if(u.def.key!=='pesado' || !heavyFinalSprite.complete || !heavyFinalSprite.naturalWidth) return false;
  const facing=u.side==='player'?1:-1;
  const ap=spriteAnimPose(u,false,false); const bob=ap.bob; const recoil=ap.recoil;
  const dw=72,dh=72;
  ctx.save();
  ctx.globalAlpha=.30;ctx.fillStyle='#000';
  ctx.beginPath();ctx.ellipse(u.x+u.def.w/2,u.y+u.def.h-1,22,5,0,0,Math.PI*2);ctx.fill();
  ctx.globalAlpha=1;
  ctx.translate(u.x+u.def.w/2-recoil*facing,u.y+u.def.h+bob);
  ctx.scale(facing*ap.sx,ap.sy);ctx.rotate(ap.tilt*facing);
  if(u.hitFlash>0){ctx.shadowBlur=14;ctx.shadowColor='#fff';}
  ctx.imageSmoothingEnabled=true;
  ctx.drawImage(heavyFinalSprite,0,0,512,512,-dw/2,-dh,dw,dh);
  if(u.side==='enemy'){
    ctx.globalCompositeOperation='source-atop';
    ctx.globalAlpha=.24;ctx.fillStyle='#ff2418';ctx.fillRect(-dw/2,-dh,dw,dh);
    ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1;
  }
  if((u.muzzle||0)>0){
    ctx.globalAlpha=Math.min(1,u.muzzle/4);ctx.fillStyle='#ffd24f';
    ctx.beginPath();ctx.moveTo(dw*.43,-dh*.47);ctx.lineTo(dw*.76,-dh*.54);ctx.lineTo(dw*.63,-dh*.39);ctx.closePath();ctx.fill();
  }
  ctx.restore();return true;
}

function drawUserBazooka(u){
  if(u.def.key!=='bazuca' || !userBazookaSprite.complete || !userBazookaSprite.naturalWidth) return false;
  const facing=u.side==='player'?1:-1;
  const bob=u.moving?Math.abs(Math.sin(u.animTime*.21))*1.15:0;
  const recoil=(u.recoil||0)*2.8;
  const dw=68, dh=68;
  ctx.save();
  ctx.globalAlpha=.28; ctx.fillStyle='#000';
  ctx.beginPath(); ctx.ellipse(u.x+u.def.w/2,u.y+u.def.h-1,21,4.5,0,0,Math.PI*2); ctx.fill();
  ctx.globalAlpha=1;
  ctx.translate(u.x+u.def.w/2-recoil*facing,u.y+u.def.h+bob);
  ctx.scale(facing,1);
  if(u.hitFlash>0){ctx.shadowBlur=12;ctx.shadowColor='#fff';}
  ctx.imageSmoothingEnabled=true;
  ctx.drawImage(userBazookaSprite,0,0,512,512,-dw/2,-dh,dw,dh);
  if(u.side==='enemy'){
    ctx.globalCompositeOperation='source-atop';
    ctx.globalAlpha=.24;ctx.fillStyle='#ff2418';ctx.fillRect(-dw/2,-dh,dw,dh);
    ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1;
  }
  if((u.muzzle||0)>0){
    ctx.globalAlpha=Math.min(1,u.muzzle/4);ctx.fillStyle='#ffd24f';
    ctx.beginPath();ctx.moveTo(dw*.43,-dh*.63);ctx.lineTo(dw*.74,-dh*.68);ctx.lineTo(dw*.63,-dh*.55);ctx.closePath();ctx.fill();
  }
  ctx.restore();
  return true;
}

function drawRecruitFinal(u){
  if(u.def.key!=='recruta') return false;

  const facing=u.side==='player'?1:-1;
  const t=u.animTime||0;
  const moving=!!u.moving;
  const firing=(u.muzzle||0)>0 || (u.recoil||0)>0;

  // Coordenadas das poses produzidas na nova folha.
  // Cada quadro é recortado individualmente; o jogo alterna poses de verdade.
  const idleFrames=[
    {x:7,y:39,w:130,h:174},{x:143,y:39,w:132,h:174},{x:278,y:40,w:130,h:173}
  ];
  const walkFrames=[
    {x:409,y:39,w:131,h:174},{x:540,y:39,w:128,h:174},
    {x:665,y:39,w:130,h:174},{x:792,y:39,w:128,h:174}
  ];
  const attackFrames=[
    {x:8,y:247,w:133,h:188},{x:147,y:247,w:135,h:188},
    {x:286,y:247,w:139,h:188},{x:430,y:247,w:140,h:188}
  ];

  let frames=firing?attackFrames:(moving?walkFrames:idleFrames);
  let speed=firing?4.6:(moving?5.6:1.8);
  let idx=Math.floor(t*speed/60)%frames.length;
  let f=frames[idx];

  // A folha tem cenário ilustrado; para não criar quadrados no campo,
  // o sprite original continua sendo a camada principal e a pose gerada
  // funciona como animação estrutural/efeito durante movimento e disparo.
  const baseOK=recruitFinalSprite.complete&&recruitFinalSprite.naturalWidth;
  if(!baseOK) return false;

  const step=Math.sin(t*.22);
  const bob=moving?Math.abs(step)*1.6:Math.sin(t*.055)*.5;
  const recoil=(u.recoil||0)*3.0;
  const dw=52,dh=62;

  ctx.save();
  ctx.globalAlpha=.28;ctx.fillStyle='#000';
  ctx.beginPath();ctx.ellipse(u.x+u.def.w/2,u.y+u.def.h-1,18,4.5,0,0,Math.PI*2);ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.translate(u.x+u.def.w/2-recoil*facing,u.y+u.def.h+bob);
  ctx.scale(facing,1);
  if(moving) ctx.rotate(step*.018*facing);
  if(u.hitFlash>0){ctx.shadowBlur=12;ctx.shadowColor='#fff';}
  ctx.imageSmoothingEnabled=false;
  ctx.drawImage(recruitFinalSprite,0,0,256,256,-dw/2,-dh,dw,dh);

  if(u.side==='enemy'){
    ctx.globalCompositeOperation='source-atop';ctx.globalAlpha=.28;
    ctx.fillStyle='#ff2118';ctx.fillRect(-dw/2,-dh,dw,dh);
    ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1;
  }

  // Passos mais perceptíveis.
  if(moving){
    ctx.globalAlpha=.32;
    ctx.fillStyle='#a58a62';
    const footX=step>0?-10:7;
    ctx.beginPath();ctx.ellipse(footX,1,4.5,1.4,0,0,Math.PI*2);ctx.fill();
  }

  // Ataque em 4 estágios: preparação -> tiro -> recuo -> recuperação.
  if(firing){
    const phase=idx;
    ctx.translate(phase===2?-2.2:phase===3?-1:0,0);
    if(phase===1 || phase===2){
      ctx.globalAlpha=.95;ctx.fillStyle='#ffd34e';ctx.shadowBlur=12;ctx.shadowColor='#ff8a16';
      ctx.beginPath();
      ctx.moveTo(dw*.39,-dh*.58);
      ctx.lineTo(dw*.72,-dh*.65);
      ctx.lineTo(dw*.59,-dh*.52);
      ctx.closePath();ctx.fill();
      ctx.shadowBlur=0;
    }
    if(phase===2){
      ctx.globalAlpha=.8;ctx.fillStyle='#d8d8d8';
      ctx.beginPath();ctx.arc(dw*.42,-dh*.64,2.2,0,Math.PI*2);ctx.fill();
    }
  }
  ctx.restore();
  return true;
}



// ===== V5.9 animações procedurais para sprites estáticos =====
function spriteAnimPose(u, vehicle=false, boss=false){
  const t=(u.animTime||0);
  const moving=!!u.moving;
  const idle=Math.sin(t*.055);
  const step=Math.sin(t*(vehicle?.11:.22));
  return {
    bob: moving ? Math.abs(step)*(vehicle?1.2:1.8) : idle*(boss?1.15:.55),
    tilt: moving ? step*(vehicle?.006:.022) : idle*(boss?.004:.006),
    sx: moving ? 1 + Math.abs(step)*(vehicle?.006:.012) : 1 + idle*.003,
    sy: moving ? 1 - Math.abs(step)*(vehicle?.004:.008) : 1 - idle*.004,
    recoil:(u.recoil||0)*(vehicle?4.2:3.1),
    hit:(u.hitFlash||0)>0
  };
}
function drawAnimatedShadow(u,dw,vehicle=false,a=.27){
  const p=spriteAnimPose(u,vehicle,false);
  ctx.save();ctx.globalAlpha=a;ctx.fillStyle='#000';
  ctx.beginPath();ctx.ellipse(u.x+u.def.w/2,u.y+u.def.h-1,dw*(vehicle?.34:.29)*(1-p.bob*.012),vehicle?6:4.5,0,0,Math.PI*2);ctx.fill();ctx.restore();
}
function spawnStepDust(u){
  const vehicle=u.def.key==='jipe'||u.def.key==='tanque'||u.def.tank;
  const dir=u.side==='player'?1:-1;
  const count=vehicle?2:1;
  for(let i=0;i<count;i++) particles.push({type:'smoke',x:u.x+u.def.w/2-dir*(vehicle?12:4)+(Math.random()-.5)*10,y:GROUND_Y-2,
    vx:-dir*(.15+Math.random()*.28),vy:-.12-Math.random()*.18,life:10+Math.random()*9,maxLife:19,size:(vehicle?2.8:1.8)+Math.random()*2,color:'#78664d'});
}
function spriteImageForKey(key){
  const map={recruta:recruitFinalSprite,bazuca:spriteBazookaV54,pesado:heavyFinalSprite,sniper:spriteSniperV54,
    metralha:spriteGunnerV54,jipe:spriteJeepV54,tanque:spriteTankV54,comando:spriteCommandV55,
    boss5:bossColossoV56,boss10:bossFalcaoV56,boss15:bossOmegaV56};
  return map[key]||null;
}

function drawCommandV55(u){
  if(u.def.key!=='comando'||!spriteCommandV55.complete||!spriteCommandV55.naturalWidth)return false;
  const facing=u.side==='player'?1:-1,p=spriteAnimPose(u,false,false),maxW=76,maxH=74;
  const ratio=spriteCommandV55.naturalWidth/spriteCommandV55.naturalHeight;let dw=maxW,dh=dw/ratio;if(dh>maxH){dh=maxH;dw=dh*ratio;}
  drawAnimatedShadow(u,dw,false,.28);
  ctx.save();ctx.translate(u.x+u.def.w/2-p.recoil*facing,u.y+u.def.h+p.bob);ctx.scale(facing*p.sx,p.sy);ctx.rotate(p.tilt*facing);
  if(p.hit){ctx.shadowBlur=14;ctx.shadowColor='#fff';}ctx.imageSmoothingEnabled=true;ctx.drawImage(spriteCommandV55,-dw/2,-dh,dw,dh);ctx.shadowBlur=0;
  if(u.side==='enemy'){ctx.globalCompositeOperation='source-atop';ctx.globalAlpha=.22;ctx.fillStyle='#ff2418';ctx.fillRect(-dw/2,-dh,dw,dh);ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1;}
  if((u.muzzle||0)>0){ctx.globalAlpha=Math.min(1,u.muzzle/4);ctx.fillStyle='#ffd35a';ctx.beginPath();ctx.moveTo(dw*.42,-dh*.54);ctx.lineTo(dw*.72,-dh*.60);ctx.lineTo(dw*.59,-dh*.45);ctx.closePath();ctx.fill();}
  ctx.restore();return true;
}

function drawUserReplacementV54(u){
  const map={sniper:{img:spriteSniperV54,w:72,h:70},tanque:{img:spriteTankV54,w:122,h:82},jipe:{img:spriteJeepV54,w:96,h:66},bazuca:{img:spriteBazookaV54,w:70,h:68},metralha:{img:spriteGunnerV54,w:72,h:70}};
  const s=map[u.def.key];if(!s||!s.img.complete||!s.img.naturalWidth)return false;
  const facing=u.side==='player'?1:-1,vehicle=u.def.key==='tanque'||u.def.key==='jipe',p=spriteAnimPose(u,vehicle,false);
  const ratio=s.img.naturalWidth/s.img.naturalHeight;let dw=s.w,dh=s.h;if(dw/dh>ratio)dw=dh*ratio;else dh=dw/ratio;
  drawAnimatedShadow(u,dw,vehicle,.28);
  ctx.save();ctx.translate(u.x+u.def.w/2-p.recoil*facing,u.y+u.def.h+p.bob);ctx.scale(facing*p.sx,p.sy);ctx.rotate(p.tilt*facing);
  if(p.hit){ctx.shadowBlur=14;ctx.shadowColor='#fff';}ctx.imageSmoothingEnabled=true;ctx.drawImage(s.img,-dw/2,-dh,dw,dh);ctx.shadowBlur=0;
  if(u.side==='enemy'){ctx.globalCompositeOperation='source-atop';ctx.globalAlpha=.22;ctx.fillStyle='#ff2418';ctx.fillRect(-dw/2,-dh,dw,dh);ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1;}
  if((u.muzzle||0)>0&&u.def.key!=='jipe'){
    const flash=(u.def.key==='tanque'?10:u.def.key==='bazuca'?8:5);ctx.globalAlpha=Math.min(1,u.muzzle/4);ctx.fillStyle='#ffd35a';ctx.shadowBlur=10;ctx.shadowColor='#ff8b22';
    ctx.beginPath();ctx.moveTo(dw*.41,-dh*.53);ctx.lineTo(dw*.41+flash,-dh*.59);ctx.lineTo(dw*.41+flash*.72,-dh*.45);ctx.closePath();ctx.fill();ctx.shadowBlur=0;
  }
  ctx.restore();return true;
}

function drawAtlasUnit(u) {
  if(drawCommandV55(u)) return true;
  if(drawUserReplacementV54(u)) return true;
  if (drawRecruitFinal(u)) return true;
  if (drawUserBazooka(u)) return true;
  if (drawHeavyFinal(u)) return true;
  if (drawSniperUser(u)) return true;
  if (drawTankUser(u)) return true;
  const col = SPRITE_COL[u.def.key];
  if (col === undefined || !unitSpriteAtlas.complete || !unitSpriteAtlas.naturalWidth) return false;
  const facing = u.side==='player' ? 1 : -1;
  const isVehicle = u.def.key==='jipe' || u.def.key==='tanque';
  const isHeavy = u.def.key==='pesado';
  const dw = isVehicle ? (u.def.key==='tanque'?82:70) : (isHeavy?54:46);
  const dh = isVehicle ? Math.round(dw*.72) : Math.round(dw*1.28);
  const bob = u.moving && !isVehicle ? Math.abs(Math.sin(u.animTime*.22))*1.6 : 0;
  const walkTilt = u.moving && !isVehicle ? Math.sin(u.animTime*.18)*0.025 : 0;
  const recoil = (u.recoil||0) * (isVehicle?4:2.5);
  ctx.save();
  ctx.globalAlpha=.28; ctx.fillStyle='#000';
  ctx.beginPath(); ctx.ellipse(u.x+u.def.w/2, u.y+u.def.h-1, dw*.34, 5, 0,0,Math.PI*2); ctx.fill();
  ctx.globalAlpha=1;
  ctx.translate(u.x+u.def.w/2 - recoil*facing, u.y+u.def.h+bob);
  ctx.scale(facing,1);
  ctx.rotate(walkTilt*facing);
  if(u.hitFlash>0){ctx.shadowBlur=13;ctx.shadowColor='#fff';}
  ctx.imageSmoothingEnabled=true;
  ctx.drawImage(unitSpriteAtlas, col*SPRITE_CELL, 0, SPRITE_CELL, SPRITE_CELL, -dw/2, -dh, dw, dh);
  ctx.shadowBlur=0;
  if(u.side==='enemy'){
    ctx.globalCompositeOperation='source-atop';
    ctx.globalAlpha=.22; ctx.fillStyle='#ff2418'; ctx.fillRect(-dw/2,-dh,dw,dh);
    ctx.globalCompositeOperation='source-over'; ctx.globalAlpha=1;
  }
  if((u.muzzle||0)>0){
    ctx.globalAlpha=Math.min(1,u.muzzle/4);
    ctx.fillStyle='#ffd24f';
    const mx=dw*.48, my=-dh*.48;
    ctx.beginPath();ctx.moveTo(mx,my);ctx.lineTo(mx+10,my-4);ctx.lineTo(mx+7,my+4);ctx.closePath();ctx.fill();
  }
  ctx.restore();
  return true;
}
const GROUND_Y = H - 70;
const BASE_W = 56;

const moneyEl = document.getElementById('money');
const playerHpEl = document.getElementById('playerHp');
const enemyHpEl = document.getElementById('enemyHp');
const overlay = document.getElementById('overlay');

// ---------- Unit definitions ----------
const UNIT_DEFS = [
  { key:'recruta', name:'Recruta', cost:20, hp:40, dmg:6,  speed:1.5, range:26, atkRate:26, ranged:false, w:22, h:42, color:'#4b5320', cooldown:40 },
  { key:'bazuca',  name:'Bazuca',  cost:45, hp:32, dmg:16, speed:1.0, range:210, atkRate:55, ranged:true,  w:22, h:42, color:'#6b4726', projSpeed:7, splash:34, cooldown:80 },
  { key:'pesado',  name:'Pesado',  cost:70, hp:110,dmg:11, speed:0.75,range:30, atkRate:34, ranged:false, w:26, h:46, color:'#3d3423', cooldown:110 },
  { key:'tanque',  name:'Tanque',  cost:120,hp:230,dmg:30, speed:0.5, range:250, atkRate:70, ranged:true, w:62, h:36, color:'#4b5320', tank:true, projSpeed:5, splash:52, cooldown:180 },
  { key:'sniper', name:'Sniper', cost:95, hp:42, dmg:48, speed:0.8, range:330, atkRate:105, ranged:true, w:22,h:42,color:'#35546b',projSpeed:11,cooldown:145 },
  { key:'metralha', name:'Metralha', cost:110, hp:85, dmg:8, speed:0.9, range:175, atkRate:14, ranged:true, w:24,h:44,color:'#556b2f',projSpeed:10,cooldown:150 },
  { key:'jipe', name:'Jipe', cost:150, hp:175, dmg:18, speed:1.8, range:125, atkRate:25, ranged:true, w:52,h:30,color:'#6b5a32',tank:true,projSpeed:9,cooldown:210 },
  { key:'comando', name:'Comando', cost:220, hp:260, dmg:36, speed:1.05, range:145, atkRate:28, ranged:true, w:28,h:48,color:'#263f2b',projSpeed:10,splash:18,cooldown:300 }
];
const ENEMY_DEFS = UNIT_DEFS.map(d => ({...d, color: d.tank ? '#5a2020' : '#7a1f1f'}));

// ---------- evolution / upgrades (persisted) ----------
let upgrades = { recruta:0, bazuca:0, pesado:0, tanque:0, sniper:0, metralha:0, jipe:0, comando:0 };
let evoPoints = 0;
const MAX_LEVEL = 10;
const UPG_BONUS = 0.12; // +12% vida e dano por nível

function getEffectiveDef(def) {
  const lvl = upgrades[def.key] || 0;
  if (!lvl) return def;
  return {
    ...def,
    hp: Math.round(def.hp * (1 + lvl*UPG_BONUS)),
    dmg: Math.round(def.dmg * (1 + lvl*UPG_BONUS))
  };
}

function updateEvoHud() {
  document.getElementById('evoPoints').textContent = evoPoints;
}

function loadProgress() {
  try {
    const raw = localStorage.getItem('base-wars-progress-v3');
    if (raw) {
      const data = JSON.parse(raw);
      if (data.upgrades) upgrades = Object.assign(upgrades, data.upgrades);
      if (Number.isFinite(data.evoPoints)) evoPoints = data.evoPoints;
      if (Number.isFinite(data.bestTime)) bestTime = data.bestTime;
      if (Number.isFinite(data.wins)) wins = data.wins;
      if (Number.isFinite(data.unlockedStage)) unlockedStage = Math.max(1, Math.min(15, data.unlockedStage));
    }
  } catch (e) { console.warn('Progresso inválido, iniciando novo save.', e); }
  updateEvoHud();
}

function saveProgress() {
  try {
    localStorage.setItem('base-wars-progress-v3', JSON.stringify({ upgrades, evoPoints, bestTime, wins, unlockedStage }));
  } catch (e) { console.warn('Não foi possível salvar o progresso.', e); }
}

// ---------- state ----------
let units = [];        // {def, hp, x, y, side, atkTimer, engaged, id}
let projectiles = [];  // {x,y,vx,dmg,side,w,h}
let particles = [];
let deathEffects = [];
let cameraShake = 0;
let money = 100;
let playerBase = { hp:200, maxHp:200 };
let enemyBase = { hp:200, maxHp:200 };
let elapsed = 0;
let running = false;
let gameOver = false;
let uid = 0;
let incomeLevel = 1, baseLevel = 1;
let enemyMoney = 100, enemyIncomeLevel = 1;
let spawnCooldowns = Array(UNIT_DEFS.length).fill(0);
let airCooldown = 0;
let bestTime = 0, wins = 0;
let lastTs = 0;
let currentStage = 1, unlockedStage = 1, bossSpawned = false;
let tutorialStep = -1;
let bossUnit = null;
let weatherClock = 0;
const UNIT_UNLOCK_STAGE = [1,1,3,5,7,9,11,13];
const STAGES = Array.from({length:15}, (_,i) => {
  const n=i+1;
  if (n===1) return {
    n, name:'TREINAMENTO', enemyBaseHp:150, playerBaseHp:360, enemyIncome:3.2,
    spawnRate:155, reward:12, boss:false, tutorial:true, enemyStatScale:.62
  };
  return {
    n, name: ['FRONTEIRA','DESERTO','PONTE','RUÍNAS','FORTALEZA'][i%5],
    enemyBaseHp: 220 + i*55 + (n%5===0?220:0),
    playerBaseHp: 220 + Math.floor(i/3)*20,
    enemyIncome: 7 + i*0.8,
    spawnRate: Math.max(92-i*3,44),
    reward: 8 + n*2,
    boss: n%5===0, tutorial:false, enemyStatScale:1
  };
});
function stageDef(){ return STAGES[currentStage-1]; }

let incomeTimer = 0;
let enemySpawnTimer = 90;
let enemyBudgetGrowth = 0;

function resetGame() {
  units = []; projectiles = []; particles = []; deathEffects = []; cameraShake = 0;
  const st = stageDef();
  money = currentStage===1 ? 180 : 100;
  elapsed = 0; incomeTimer = 0; enemySpawnTimer = st.spawnRate; enemyBudgetGrowth = 0;
  incomeLevel = 1; baseLevel = 1; enemyMoney = currentStage===1 ? 25 : 90 + currentStage*12; enemyIncomeLevel = 1;
  spawnCooldowns = Array(UNIT_DEFS.length).fill(0); airCooldown = 0; bossSpawned = false;
  playerBase.maxHp = playerBase.hp = st.playerBaseHp; enemyBase.maxHp = enemyBase.hp = st.enemyBaseHp;
  gameOver = false; lastTs = 0; tutorialStep = -1; bossUnit = null;
  const bb=document.getElementById('bossBar'); if(bb) bb.style.display='none';
  updateTutorial(true);
  updateHud();
}

function updateHud() {
  moneyEl.textContent = '$' + Math.floor(money);
  playerHpEl.style.width = Math.max(playerBase.hp/playerBase.maxHp*100,0) + '%';
  enemyHpEl.style.width = Math.max(enemyBase.hp/enemyBase.maxHp*100,0) + '%';
  const enemyBox=document.getElementById('enemyMoneyBox'); if(enemyBox) enemyBox.textContent = 'IA: $' + Math.floor(enemyMoney);
  const sb=document.getElementById('stageBadge'); if(sb) sb.textContent = `FASE ${currentStage} • ${stageDef().name}${stageDef().boss?' • CHEFE':''}`;
  const incCost = 80 + (incomeLevel-1)*70;
  document.getElementById('incomeBtn') && (document.getElementById('incomeBtn').innerHTML = `RENDA Nv.${incomeLevel}<span class="sub">$${incCost} • +${8+(incomeLevel-1)*4}/s</span>`);
  const baseCost = 100 + (baseLevel-1)*90;
  document.getElementById('baseBtn') && (document.getElementById('baseBtn').innerHTML = `BASE Nv.${baseLevel}<span class="sub">$${baseCost} • +100 HP</span>`);
  document.getElementById('airBtn') && (document.getElementById('airBtn').innerHTML = `ATAQUE AÉREO<span class="sub">${airCooldown>0 ? Math.ceil(airCooldown/60)+'s' : '$140 • área'}</span>`);

}

function updateTutorial(force=false) {
  const tip = document.getElementById('tutorialTip');
  if (!tip) return;
  if (currentStage !== 1 || gameOver) { tip.classList.add('hiddenTip'); return; }
  let step = 0, text = '';
  if (elapsed < 7) { step=0; text='TUTORIAL: você começa com vantagem. Toque em RECRUTA ou BAZUCA para mandar tropas contra a base inimiga.'; }
  else if (elapsed < 18) { step=1; text='Cada segundo você recebe dinheiro. Tente manter algumas tropas no campo sem gastar tudo de uma vez.'; }
  else if (elapsed < 32) { step=2; text='Use RENDA para ganhar mais dinheiro por segundo. Nesta primeira fase o inimigo demora mais para atacar.'; }
  else if (elapsed < 48) { step=3; text='Se precisar, melhore a BASE para ganhar +100 HP. Destrua a base vermelha para vencer.'; }
  else { step=4; text='Agora é com você! A partir da fase 2 o inimigo fica mais agressivo.'; }
  if (force || step !== tutorialStep) { tutorialStep=step; tip.textContent=text; tip.classList.remove('hiddenTip'); }
  if (elapsed > 58) tip.classList.add('hiddenTip');
}

// ---------- spawning ----------
function spawnUnit(def, side) {
  const x = side==='player' ? BASE_W+4 : W-BASE_W-4-def.w;
  units.push({
    def, hp: def.hp, maxHp: def.hp, x, y: GROUND_Y-def.h, side,
    atkTimer:0, engaged:false, id:uid++, animTime:Math.random()*100, moving:false, recoil:0, muzzle:0, hitFlash:0, fireRamp:0
  });
}

function trySpawnPlayer(index) {
  if (gameOver) return;
  const def = getEffectiveDef(UNIT_DEFS[index]);
  if (money < def.cost || spawnCooldowns[index] > 0) return;
  money -= def.cost;
  spawnCooldowns[index] = def.cooldown || 60;
  spawnUnit(def, 'player');
  updateHud();
}

function spawnEnemyAI() {
  const affordable = ENEMY_DEFS
    .map((d,i)=>({d,i}))
    .filter(x => x.d.cost <= enemyMoney && x.i <= (currentStage===1 ? 0 : Math.min(UNIT_DEFS.length-1, Math.floor((currentStage+1)/2))) && (elapsed > x.i*4));
  if (!affordable.length) return;

  // reage à composição do jogador, sem ser perfeito
  const playerTypes = units.filter(u=>u.side==='player').map(u=>u.def.key);
  let preferred = affordable;
  if (playerTypes.filter(k=>k==='pesado'||k==='tanque').length >= 2) {
    const ranged = affordable.filter(x=>x.d.ranged); if (ranged.length) preferred = ranged;
  } else if (playerTypes.filter(k=>k==='bazuca').length >= 2) {
    const melee = affordable.filter(x=>!x.d.ranged); if (melee.length) preferred = melee;
  }
  const pick = preferred[Math.floor(Math.random()*preferred.length)];
  enemyMoney -= pick.d.cost;
  const scale = stageDef().enemyStatScale || 1;
  const enemyDef = scale===1 ? pick.d : {...pick.d, hp:Math.max(1,Math.round(pick.d.hp*scale)), dmg:Math.max(1,Math.round(pick.d.dmg*scale)), speed:pick.d.speed*.82};
  spawnUnit(enemyDef, 'enemy');
}

// ---------- particles ----------
function spawnExplosion(x,y,color,power=1) {
  cameraShake = Math.max(cameraShake, Math.min(11, 2.5*power));
  const sparks = Math.round(9 + power*5);
  for (let i=0;i<sparks;i++) {
    particles.push({ type:'spark', x,y, vx:(Math.random()-0.5)*6*power, vy:(Math.random()-1.1)*4.5*power,
      life:18+Math.random()*18, maxLife:36, color, size:2+Math.random()*3*power });
  }
  const smokeCount=Math.round(3+power*2);
  for(let i=0;i<smokeCount;i++) particles.push({type:'smoke',x:x+(Math.random()-.5)*12,y:y+(Math.random()-.5)*8,
    vx:(Math.random()-.5)*.7,vy:-.5-Math.random()*1.1,life:34+Math.random()*28,maxLife:62,size:7+Math.random()*8*power,color:'#292722'});
  particles.push({type:'flash',x,y,vx:0,vy:0,life:7,maxLife:7,size:10+power*9,color:'#ffd27a'});
}
function spawnMuzzle(u) {
  const dir=u.side==='player'?1:-1;
  const mx=u.x+(dir>0?u.def.w+8:-8), my=u.y+u.def.h*.38;
  particles.push({type:'flash',x:mx,y:my,vx:0,vy:0,life:4,maxLife:4,size:u.def.tank?13:7,color:'#fff0a8'});
  for(let i=0;i<(u.def.tank?5:2);i++) particles.push({type:'smoke',x:mx,y:my,vx:dir*(.3+Math.random()*.7),vy:-.3-Math.random()*.5,life:18+Math.random()*15,maxLife:33,size:3+Math.random()*5,color:'#55524b'});
}
function spawnDeathEffect(u){
  deathEffects.push({x:u.x+u.def.w/2,y:u.y+u.def.h/2,def:u.def,key:u.def.key,side:u.side,life:(u.def.tank||u.def.mecha||u.def.aerial)?48:34,maxLife:(u.def.tank||u.def.mecha||u.def.aerial)?48:34,rot:(Math.random()-.5)*.08,fall:(Math.random()>.5?1:-1)});
}
function updateParticles(dt=1) {
  particles.forEach(p => {
    p.x+=p.vx*dt; p.y+=p.vy*dt;
    if(p.type==='spark') p.vy+=0.2*dt;
    if(p.type==='smoke'){p.vx*=.985;p.size+=.06*dt;}
    p.life-=dt;
  });
  particles = particles.filter(p=>p.life>0);
  deathEffects.forEach(d=>{d.life-=dt;d.y+=.32*dt;d.rot+=(d.side==='player'?1:-1)*.012*dt;});
  deathEffects=deathEffects.filter(d=>d.life>0);
  cameraShake=Math.max(0,cameraShake-.55*dt);
}
function drawParticles() {
  particles.forEach(p => {
    const a=Math.max(p.life/p.maxLife,0);
    ctx.globalAlpha = p.type==='smoke' ? a*.38 : a;
    ctx.fillStyle = p.color;
    if(p.type==='smoke'){ctx.beginPath();ctx.arc(p.x,p.y,p.size,0,Math.PI*2);ctx.fill();}
    else if(p.type==='flash'){ if(!drawFxSprite(p)){ctx.beginPath();ctx.arc(p.x,p.y,p.size*(.45+.55*a),0,Math.PI*2);ctx.fill();} }
    else ctx.fillRect(p.x-p.size/2,p.y-p.size/2,p.size,p.size);
  });
  ctx.globalAlpha = 1;
}
function drawDeathEffects(){
  deathEffects.forEach(d=>{
    const a=Math.max(d.life/d.maxLife,0),img=spriteImageForKey(d.key);ctx.save();ctx.globalAlpha=a*.9;ctx.translate(d.x,d.y+(1-a)*14);ctx.rotate(d.rot+(1-a)*d.fall*.75);
    if(img&&img.complete&&img.naturalWidth){
      const vehicle=d.key==='tanque'||d.key==='jipe'||d.def.tank||d.def.aerial||d.def.mecha;
      let maxW=vehicle?Math.max(80,d.def.w*1.55):Math.max(48,d.def.w*1.9),maxH=vehicle?95:72;
      if(d.key==='boss5')maxW=126;if(d.key==='boss10')maxW=138;if(d.key==='boss15')maxW=122;
      const ratio=img.naturalWidth/img.naturalHeight;let dw=maxW,dh=dw/ratio;if(dh>maxH){dh=maxH;dw=dh*ratio;}
      ctx.imageSmoothingEnabled=true;ctx.drawImage(img,-dw/2,-dh/2,dw,dh);
    }else{ctx.fillStyle=d.def.color;ctx.fillRect(-d.def.w*.35,-3,d.def.w*.7,6);}
    ctx.restore();
  });ctx.globalAlpha=1;
}

function findTarget(unit) {
  const dir = unit.side==='player' ? 1 : -1;
  const enemies = units.filter(o=>o.side!==unit.side && o.hp>0);
  if(!enemies.length) return {target:null,dist:Infinity};
  // Sniper procura alvos de alto valor dentro do alcance potencial.
  if(unit.def.key==='sniper'){
    const inFront=enemies.map(o=>({o,d:(o.x-unit.x)*dir})).filter(v=>v.d>-20 && v.d<=unit.def.range+35);
    if(inFront.length){
      inFront.sort((a,b)=>(b.o.maxHp+b.o.def.dmg*4)-(a.o.maxHp+a.o.def.dmg*4));
      return {target:inFront[0].o,dist:inFront[0].d};
    }
  }
  let best=null,bestDist=Infinity;
  enemies.forEach(o=>{
    const d=(o.x-unit.x)*dir;
    if(d>-20 && d<bestDist){bestDist=d;best=o;}
  });
  return {target:best,dist:bestDist};
}

function commandAuraMultiplier(u){
  if(u.side!=='player') return 1;
  return units.some(o=>o!==u && o.side==='player' && o.def.key==='comando' && Math.abs(o.x-u.x)<125) ? 1.18 : 1;
}
function applyDamage(target, amount, attackerSide, sourceX){
  if(!target || target.hp<=0) return;
  let final=amount;
  if(target.def.key==='pesado') final*=0.72;
  if(target.def.key==='boss5') final*=0.82;
  // blindagem frontal do mecha final
  if(target.def.key==='boss15' && sourceX!=null){
    const hitFront = target.side==='enemy' ? sourceX < target.x : sourceX > target.x;
    if(hitFront) final*=0.68;
  }
  target.hp-=final;
  target.hitFlash=4;
}

function unitInBaseRange(unit) {
  if (unit.side==='player') return unit.x + unit.def.w >= W - BASE_W;
  return unit.x <= BASE_W;
}

// ---------- update ----------
function update(dt=1) {
  if (!running || gameOver) return;
  elapsed += dt/60;
  updateTutorial();

  // income
  incomeTimer += dt;
  if (incomeTimer >= 60) { incomeTimer -= 60; money += (currentStage===1 ? 11 : 8) + (incomeLevel-1)*4; enemyMoney += stageDef().enemyIncome + (enemyIncomeLevel-1)*2; if (elapsed>45 && enemyIncomeLevel<5) enemyIncomeLevel = 1 + Math.floor(elapsed/45); updateHud(); }

  // enemy spawns, ramps up
  enemySpawnTimer -= dt;
  if (enemySpawnTimer <= 0) {
    spawnEnemyAI();
    enemySpawnTimer = currentStage===1 ? 145 + Math.random()*35 : Math.max(stageDef().spawnRate - elapsed*0.18, 28) + Math.random()*22;
  }

  // units
  units.forEach(u => {
    if (u.hp<=0) return;
    u.animTime += dt; u.recoil=Math.max(0,u.recoil-dt*.12); u.muzzle=Math.max(0,u.muzzle-dt); u.hitFlash=Math.max(0,(u.hitFlash||0)-dt); u.moving=false;
    const dir = u.side==='player' ? 1 : -1;
    const { target, dist } = findTarget(u);

    if (target && dist <= u.def.range) {
      // engage
      u.atkTimer -= dt;
      if (u.atkTimer<=0) {
        u.fireRamp = u.def.key==='metralha' ? Math.min(8,(u.fireRamp||0)+1) : 0;
        u.atkTimer = u.def.key==='metralha' ? Math.max(7,u.def.atkRate-u.fireRamp) : u.def.atkRate;
        if (u.def.ranged) {
          u.recoil=1; u.muzzle=4; spawnMuzzle(u);
          const sy=u.y+u.def.h*0.4, tx=target?target.x+target.def.w/2:u.x+dir*100, ty=target?target.y+target.def.h/2:sy;
          const travel=Math.max(8,Math.abs(tx-u.x)/Math.max(1,u.def.projSpeed));
          projectiles.push({
            x:u.x + (dir>0?u.def.w:0), y:sy,
            vx: u.def.projSpeed*dir, vy:(ty-sy)/travel, dmg:u.def.dmg*commandAuraMultiplier(u), side:u.side, w:(u.def.tank||u.def.aerial)?12:8,h:(u.def.tank||u.def.aerial)?6:4, splash:u.def.splash||0, sourceX:u.x
          });
        } else {
          u.recoil=1;
          applyDamage(target,u.def.dmg*commandAuraMultiplier(u),u.side,u.x);
          spawnExplosion(target.x+target.def.w/2, target.y+target.def.h/2, '#e8a13a', .65);
        }
      }
    } else if (unitInBaseRange(u)) {
      // attack base
      u.atkTimer -= dt;
      if (u.atkTimer<=0) {
        u.atkTimer = u.def.atkRate; u.recoil=1; if(u.def.ranged){u.muzzle=4;spawnMuzzle(u);}
        if (u.side==='player') { enemyBase.hp -= u.def.dmg; spawnExplosion(W-BASE_W, u.y+10, '#c1440e'); }
        else { playerBase.hp -= u.def.dmg; spawnExplosion(BASE_W, u.y+10, '#c1440e'); }
        updateHud();
        if (enemyBase.hp<=0) return endGame(true);
        if (playerBase.hp<=0) return endGame(false);
      }
    } else {
      // evita que aliados se empilhem
       const blocked = units.some(o => o!==u && o.side===u.side && o.hp>0 && ((o.x-u.x)*dir)>0 && ((o.x-u.x)*dir) < Math.max(38,u.def.w*1.15));
       if (!blocked) { u.x += u.def.speed * dir * dt; u.moving=true; u.fireRamp=0; if((u.animTime-(u.lastStepDust||0))>(u.def.tank?12:18)){spawnStepDust(u);u.lastStepDust=u.animTime;} }
    }
  });

  // remove dead units with explosion
  units.forEach(u => {
    if (u.hp<=0 && !u.dead) {
      u.dead = true;
      spawnDeathEffect(u);
      spawnExplosion(u.x+u.def.w/2, u.y+u.def.h/2, '#e8a13a', u.def.key==='boss'?2.5:(u.def.tank?1.7:1));
      if (u.def.key==='jipe' && u.side==='player') { const rd=getEffectiveDef(UNIT_DEFS[0]); const child={...rd,hp:Math.round(rd.hp*.75)}; spawnUnit(child,'player'); units[units.length-1].x=u.x; }
      if (u.side==='enemy') { money += 6; evoPoints += 1; updateHud(); updateEvoHud(); }
    }
  });
  units = units.filter(u => u.hp>0);

  // projectiles
  projectiles.forEach(p => {
    p.x += p.vx * dt; p.y += (p.vy||0)*dt;
    // hit check vs opposing units
    let hitSomething = false;
    units.forEach(o => {
      if (hitSomething || o.side===p.side || o.hp<=0) return;
      if (p.x >= o.x && p.x <= o.x+o.def.w) {
        o.hp -= p.dmg;
        if (p.splash) units.forEach(v=>{ if(v.side!==p.side && v!==o && Math.hypot((v.x+v.def.w/2)-p.x,(v.y+v.def.h/2)-p.y)<=p.splash) applyDamage(v,p.dmg*0.45,p.side,p.sourceX); });
        spawnExplosion(p.x,p.y,'#e8a13a', p.splash?1.4:.7);
        hitSomething = true;
      }
    });
    if (!hitSomething) {
      if (p.side==='player' && p.x >= W-BASE_W) {
        enemyBase.hp -= p.dmg; hitSomething = true; updateHud();
        spawnExplosion(W-BASE_W, p.y, '#c1440e');
        if (enemyBase.hp<=0) return endGame(true);
      } else if (p.side==='enemy' && p.x <= BASE_W) {
        playerBase.hp -= p.dmg; hitSomething = true; updateHud();
        spawnExplosion(BASE_W, p.y, '#c1440e');
        if (playerBase.hp<=0) return endGame(false);
      }
    }
    if (hitSomething) p.dead = true;
  });
  projectiles = projectiles.filter(p => !p.dead && p.x>-20 && p.x<W+20);

  spawnCooldowns = spawnCooldowns.map(v => Math.max(0, v-dt));
  airCooldown = Math.max(0, airCooldown-dt);
  const st=stageDef();
  if (st.boss && !bossSpawned && elapsed>42) {
    bossSpawned=true;
    let boss;
    if(currentStage===5){
      const b=ENEMY_DEFS[3]; boss={...b,key:'boss5',name:'COLOSSO MK-I',hp:780,dmg:48,w:92,h:54,color:'#681411',splash:78,atkRate:62,range:285};
    } else if(currentStage===10){
      const b=ENEMY_DEFS[4]; boss={...b,key:'boss10',name:'FALCÃO DE GUERRA',hp:940,dmg:34,w:86,h:38,color:'#4c3030',splash:46,atkRate:38,range:330,speed:.72,aerial:true};
    } else {
      const b=ENEMY_DEFS[3]; boss={...b,key:'boss15',name:'MECHA ÔMEGA',hp:1550,dmg:58,w:104,h:68,color:'#4e0b12',splash:88,atkRate:52,range:310,speed:.42,mecha:true};
    }
    spawnUnit(boss,'enemy'); bossUnit=units[units.length-1];
    if(boss.aerial) bossUnit.y=GROUND_Y-145;
    const bb=document.getElementById('bossBar'); if(bb){bb.style.display='block';document.getElementById('bossName').textContent=boss.name;}
  }
  if(bossUnit && bossUnit.hp>0){
    const bf=document.getElementById('bossFill'); if(bf) bf.style.width=Math.max(0,bossUnit.hp/bossUnit.maxHp*100)+'%';
    if(currentStage===10 && !bossUnit.lastSpecial) bossUnit.lastSpecial=elapsed;
    if(currentStage===10 && elapsed-bossUnit.lastSpecial>9){bossUnit.lastSpecial=elapsed;units.filter(u=>u.side==='player').slice(0,3).forEach(u=>{applyDamage(u,12,'enemy',bossUnit.x);spawnExplosion(u.x,u.y,'#ff744f',1.1);});}
    if(currentStage===15 && bossUnit.hp<bossUnit.maxHp*.5 && !bossUnit.phase2){bossUnit.phase2=true;bossUnit.def={...bossUnit.def,atkRate:36,speed:.55,dmg:72};spawnExplosion(bossUnit.x+40,bossUnit.y+30,'#ff3b22',2.6);}
  } else if(bossUnit){ const bb=document.getElementById('bossBar'); if(bb) bb.style.display='none'; }
  updateParticles(dt);
  updateButtons();
}

function updateButtons() {
  UNIT_DEFS.forEach((d,i) => {
    const b=document.getElementById('btn'+i);
     const locked = currentStage < UNIT_UNLOCK_STAGE[i];
     b.disabled = locked || money < d.cost || spawnCooldowns[i] > 0; b.classList.toggle('locked',locked); b.classList.toggle('ready',!b.disabled);
     const costEl=b.querySelector('.cost');
     costEl.textContent = locked ? `Fase ${UNIT_UNLOCK_STAGE[i]}` : (spawnCooldowns[i]>0 ? (spawnCooldowns[i]/60).toFixed(1)+'s' : '$'+d.cost);
  });
}

// ---------- drawing ----------
let bgOffset = 0;
function drawBackground() {
  weatherClock+=.01;
  const idx=(currentStage-1)%5;
  const themes=[
    {sky:['#34485b','#8e7654','#c8a66d'],ground:'#7b6c45',kind:'field'},
    {sky:['#3c2920','#a45c2e','#d1a05e'],ground:'#9b7144',kind:'desert'},
    {sky:['#1f3039','#53646a','#7b8584'],ground:'#5e625f',kind:'city'},
    {sky:['#172b28','#3b6253','#70836b'],ground:'#56634d',kind:'forest'},
    {sky:['#261c2a','#653b40','#a15a48'],ground:'#51413f',kind:'fort'}
  ];
  const t=themes[idx],g=ctx.createLinearGradient(0,0,0,GROUND_Y);
  g.addColorStop(0,t.sky[0]);g.addColorStop(.62,t.sky[1]);g.addColorStop(1,t.sky[2]);ctx.fillStyle=g;ctx.fillRect(0,0,W,GROUND_Y);
  // sun / moon
  ctx.globalAlpha=.3;ctx.fillStyle=(idx===2||idx===4)?'#d8e2ea':'#ffd58a';ctx.beginPath();ctx.arc(790,76,idx===4?32:42,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
  // distant silhouette
  ctx.fillStyle='rgba(15,17,18,.28)';
  if(t.kind==='city'||t.kind==='fort'){
    for(let i=0;i<12;i++){let x=i*90-(bgOffset*.06%90);let hh=55+(i%4)*30;ctx.fillRect(x,GROUND_Y-90-hh,62,hh+90);if(t.kind==='city'){ctx.clearRect(x+12,GROUND_Y-60-hh,7,9);ctx.clearRect(x+37,GROUND_Y-34-hh,7,9);}}
  } else {
    for(let i=0;i<6;i++){const x=((i*210-bgOffset*.07)%(W+300))-160;ctx.beginPath();ctx.moveTo(x,GROUND_Y);ctx.lineTo(x+100,GROUND_Y-90-(i%2)*35);ctx.lineTo(x+220,GROUND_Y);ctx.closePath();ctx.fill();}
  }
  // midground identities
  if(t.kind==='field'){ctx.fillStyle='rgba(35,48,28,.6)';for(let i=0;i<16;i++){let x=i*72-(bgOffset*.15%72);ctx.fillRect(x,GROUND_Y-36,4,36);ctx.fillRect(x-7,GROUND_Y-29,18,4);}}
  if(t.kind==='desert'){ctx.fillStyle='rgba(84,55,35,.48)';for(let i=0;i<5;i++){let x=120+i*210;ctx.beginPath();ctx.ellipse(x,GROUND_Y-3,115,32,0,Math.PI,0,true);ctx.fill();}}
  if(t.kind==='forest'){ctx.fillStyle='rgba(20,43,32,.68)';for(let i=0;i<12;i++){let x=i*92-(bgOffset*.12%92);ctx.fillRect(x,GROUND_Y-85,7,85);ctx.beginPath();ctx.arc(x+3,GROUND_Y-100,24,0,Math.PI*2);ctx.fill();}}
  if(t.kind==='fort'){ctx.fillStyle='rgba(40,32,32,.7)';ctx.fillRect(340,GROUND_Y-95,280,95);for(let x=360;x<610;x+=42)ctx.fillRect(x,GROUND_Y-122,24,28);}
  ctx.fillStyle=t.ground;ctx.fillRect(0,GROUND_Y,W,H-GROUND_Y);
  ctx.fillStyle='rgba(31,27,22,.34)';for(let i=0;i<8;i++){const x=80+i*125;ctx.beginPath();ctx.ellipse(x,GROUND_Y+47+(i%2)*7,18+(i%3)*5,6,0,0,Math.PI*2);ctx.fill();}
  // debris
  ctx.fillStyle='rgba(25,23,20,.55)';for(let i=0;i<11;i++){let x=(i*97+35)%W;ctx.fillRect(x,GROUND_Y+18+(i%3)*14,10+(i%4)*4,3);}
  // weather
  if(idx===1){ctx.strokeStyle='rgba(224,190,130,.18)';for(let i=0;i<38;i++){let x=(i*41+(weatherClock*170)%W)%W,y=(i*67)%GROUND_Y;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+18,y-3);ctx.stroke();}}
  if(idx===2){ctx.strokeStyle='rgba(190,215,225,.25)';for(let i=0;i<50;i++){let x=(i*53+(weatherClock*250)%W)%W,y=(i*31+(weatherClock*130)%GROUND_Y)%GROUND_Y;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-7,y+18);ctx.stroke();}}
  if(idx===3){ctx.globalAlpha=.12;ctx.fillStyle='#d7eee1';ctx.fillRect(0,GROUND_Y-68,W,50);ctx.globalAlpha=1;}
  if(idx===4 && Math.sin(weatherClock*1.4)>.995){ctx.fillStyle='rgba(235,235,255,.28)';ctx.fillRect(0,0,W,GROUND_Y);}
  bgOffset+=.45;
  
  // cinematic battlefield lighting
  const sunGlow=ctx.createRadialGradient(W*.76,H*.16,4,W*.76,H*.16,180);
  sunGlow.addColorStop(0,'rgba(255,224,145,.20)');
  sunGlow.addColorStop(1,'rgba(255,224,145,0)');
  ctx.fillStyle=sunGlow; ctx.fillRect(0,0,W,GROUND_Y);
  // foreground grass/rubble line for depth
  ctx.fillStyle='rgba(18,25,20,.65)';
  for(let i=0;i<W;i+=18){
    const gh=3+((i*7)%9);
    ctx.fillRect(i,GROUND_Y-gh,2,gh);
    if(i%54===0){ctx.beginPath();ctx.moveTo(i,GROUND_Y);ctx.lineTo(i+8,GROUND_Y-6);ctx.lineTo(i+13,GROUND_Y);ctx.fill();}
  }
  // subtle cinematic vignette
  const vg=ctx.createRadialGradient(W/2,H/2,170,W/2,H/2,600);
  vg.addColorStop(.55,'rgba(0,0,0,0)');
  vg.addColorStop(1,'rgba(0,0,0,.28)');
  ctx.fillStyle=vg;ctx.fillRect(0,0,W,H);

  drawBase(0,'#3d6b2e','player');drawBase(W-BASE_W,'#8b1f1f','enemy');
}

function drawBase(x,color,side) {
  const isLeft=side==='player', base=isLeft?playerBase:enemyBase;
  const hp=Math.max(0,base.hp/base.maxHp);

  if(userBaseSprite.complete && userBaseSprite.naturalWidth){
    const dw=150, dh=108;
    const dx=isLeft ? -8 : W-dw+8;
    const dy=GROUND_Y-dh+2;

    ctx.save();
    ctx.imageSmoothingEnabled=true;

    // Base inimiga usa o mesmo sprite espelhado para manter o estilo.
    if(!isLeft){
      ctx.translate(W,0);
      ctx.scale(-1,1);
      ctx.drawImage(userBaseSprite,0,0,userBaseSprite.naturalWidth,userBaseSprite.naturalHeight,
                    8,dy,dw,dh);
    }else{
      ctx.drawImage(userBaseSprite,0,0,userBaseSprite.naturalWidth,userBaseSprite.naturalHeight,
                    dx,dy,dw,dh);
    }
    ctx.restore();

    // Danos continuam visíveis sem alterar a arte original.
    if(hp < .55){
      ctx.save();
      const bx=isLeft?72:W-72;
      ctx.globalAlpha=.20+(1-hp)*.25;
      ctx.fillStyle='#222';
      ctx.beginPath(); ctx.arc(bx,GROUND_Y-104,15+(1-hp)*12,0,Math.PI*2); ctx.fill();
      ctx.restore();
    }
    if(hp < .28){
      const bx=isLeft?82:W-82;
      ctx.save();
      ctx.globalAlpha=.75;
      ctx.fillStyle='#e85a20';
      ctx.beginPath();ctx.arc(bx,GROUND_Y-72,6,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#ffc04d';
      ctx.beginPath();ctx.arc(bx+2,GROUND_Y-75,3.5,0,Math.PI*2);ctx.fill();
      ctx.restore();
    }
    return;
  }

  // Fallback simples caso a imagem ainda não tenha carregado.
  ctx.save();
  ctx.fillStyle=color;
  ctx.fillRect(x,GROUND_Y-82,BASE_W,82);
  ctx.restore();
}

function drawSoldier(u) {
  if (drawAtlasUnit(u)) return;
  const {x,y,def}=u,w=def.w,h=def.h,facing=u.side==='player'?1:-1,key=def.key;
  const walk=u.moving?Math.sin(u.animTime*.22):0,bob=u.moving?Math.abs(Math.sin(u.animTime*.22))*1.5:0,recoil=(u.recoil||0)*3;
  ctx.save();ctx.translate(x+w/2,y+bob);ctx.scale(facing,1);ctx.translate(-w/2,0);
  if(u.hitFlash>0){ctx.shadowBlur=12;ctx.shadowColor='#fff';}
  ctx.globalAlpha=.28;ctx.fillStyle='#000';ctx.beginPath();ctx.ellipse(w/2,h-1,w*.65,4,0,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
  ctx.fillStyle='#151613';ctx.save();ctx.translate(7,h-14);ctx.rotate(walk*.24);ctx.fillRect(-3,0,6,14);ctx.restore();ctx.save();ctx.translate(w-7,h-14);ctx.rotate(-walk*.24);ctx.fillRect(-3,0,6,14);ctx.restore();
  ctx.fillStyle=key==='comando'?'#1c241d':'#25281d';ctx.fillRect(2,h-4,9,4);ctx.fillRect(w-11,h-4,9,4);
  // body silhouette by role
  ctx.fillStyle=def.color;ctx.fillRect(key==='pesado'?0:2,h-(key==='pesado'?39:36),key==='pesado'?w:w-4,key==='pesado'?27:23);
  if(key==='pesado'){ctx.fillStyle='#20211d';ctx.fillRect(-2,h-34,5,18);ctx.fillRect(w-3,h-34,5,18);ctx.fillStyle='#5d5a4a';ctx.fillRect(4,h-33,w-8,7);}
  if(key==='comando'){ctx.fillStyle='#b08d3b';ctx.fillRect(4,h-33,w-8,3);ctx.fillRect(w/2-1,h-36,2,24);}
  if(key==='metralha'){ctx.fillStyle='#3c3529';ctx.fillRect(3,h-31,w-6,8);}
  ctx.fillStyle='#c9a876';ctx.fillRect(w/2-5,h-47,10,10);
  ctx.fillStyle=def.color;ctx.fillRect(w/2-7,h-50,14,7);ctx.fillRect(w/2-5,h-52,10,3);
  if(key==='sniper'){ctx.fillStyle='#2b342d';ctx.fillRect(w/2-8,h-51,16,4);ctx.fillStyle='#111';ctx.fillRect(w/2+3,h-45,2,2);}
  if(key==='comando'){ctx.fillStyle='#d1b85a';ctx.fillRect(w/2-7,h-52,14,2);}
  ctx.save();ctx.translate(-recoil,0);ctx.fillStyle='#171717';
  if(key==='bazuca'){ctx.fillRect(w-4,h-36,22,7);ctx.fillStyle='#5b5a50';ctx.fillRect(w+11,h-38,8,11);}
  else if(key==='sniper'){ctx.fillRect(w-4,h-31,27,3);ctx.fillStyle='#4b402f';ctx.fillRect(w+4,h-29,8,2);ctx.fillStyle='#888';ctx.fillRect(w+5,h-34,7,2);}
  else if(key==='metralha'){ctx.fillRect(w-5,h-32,21,5);ctx.fillStyle='#5c4d36';ctx.fillRect(w+8,h-28,5,7);}
  else if(key==='comando'){ctx.fillRect(w-4,h-32,19,4);ctx.fillStyle='#6e5b39';ctx.fillRect(w+8,h-30,6,2);}
  else {ctx.fillRect(w-3,h-31,15,4);ctx.fillStyle='#4c4232';ctx.fillRect(w+7,h-30,7,2);}
  ctx.restore();ctx.shadowBlur=0;ctx.restore();
}

function drawTank(u) {
  const {x,y,def}=u,facing=u.side==='player'?1:-1,key=def.key,tread=u.moving?Math.floor(u.animTime*.35)%8:0,recoil=(u.recoil||0)*7;
  if ((key==='boss5' || key==='boss10' || key==='boss15') && drawBossAtlas(u)) return;
  if ((key==='jipe' || key==='tanque') && drawAtlasUnit(u)) return;
  ctx.save();ctx.translate(x,y);
  if(key==='boss10'){
    ctx.globalAlpha=.3;ctx.fillStyle='#000';ctx.beginPath();ctx.ellipse(def.w/2,def.h+85,34,7,0,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
    ctx.fillStyle=def.color;ctx.fillRect(12,8,62,22);ctx.fillStyle='#2d2525';ctx.fillRect(30,0,28,12);ctx.fillStyle='#141414';ctx.fillRect(4,16,18,5);ctx.fillRect(70,16,16,5);
    const rotor=(performance.now()*.2)%70;ctx.fillStyle='#202020';ctx.fillRect(43-rotor/2,-7,rotor,3);ctx.fillRect(8,32,70,3);ctx.fillStyle='#ffcf3d';ctx.fillRect(64,12,6,5);ctx.restore();return;
  }
  if(key==='boss15'){
    const pulse=.25+Math.sin(performance.now()*.008)*.12;ctx.globalAlpha=pulse;ctx.fillStyle='#ff3925';ctx.beginPath();ctx.ellipse(def.w/2,def.h/2,def.w*.68,def.h*.65,0,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
    ctx.fillStyle='#252128';ctx.fillRect(12,15,def.w-24,def.h-20);ctx.fillStyle=def.color;ctx.fillRect(25,3,def.w-50,34);ctx.fillStyle='#111';ctx.fillRect(9,def.h-18,30,18);ctx.fillRect(def.w-39,def.h-18,30,18);ctx.fillStyle='#ff6a46';ctx.fillRect(def.w/2-6,15,12,8);ctx.fillStyle='#2c2927';ctx.fillRect(-8,24,30,8);ctx.fillRect(def.w-22,24,30,8);ctx.restore();return;
  }
  if(key==='jipe'){
    ctx.globalAlpha=.28;ctx.fillStyle='#000';ctx.beginPath();ctx.ellipse(def.w/2,def.h-1,def.w*.5,5,0,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
    ctx.fillStyle=def.color;ctx.fillRect(4,10,def.w-8,14);ctx.fillRect(14,2,20,12);ctx.fillStyle='#1c1c1b';ctx.beginPath();ctx.arc(12,def.h-4,6,0,Math.PI*2);ctx.arc(def.w-12,def.h-4,6,0,Math.PI*2);ctx.fill();ctx.fillStyle='#151515';ctx.fillRect(def.w*.5,0,4,10);ctx.fillRect(def.w*.5,0,18,3);ctx.restore();return;
  }
  if(key==='boss5'){const pulse=.30+Math.sin(performance.now()*.008)*.13;ctx.globalAlpha=pulse;ctx.fillStyle='#ff3b22';ctx.beginPath();ctx.ellipse(def.w/2,def.h/2,def.w*.68,def.h*.75,0,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;}
  ctx.globalAlpha=.3;ctx.fillStyle='#000';ctx.beginPath();ctx.ellipse(def.w/2,def.h-1,def.w*.52,6,0,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
  ctx.fillStyle='#151515';ctx.fillRect(0,def.h-13,def.w,12);ctx.fillStyle=def.color;ctx.fillRect(2,7,def.w-4,def.h-19);ctx.fillStyle='rgba(255,255,255,.10)';ctx.fillRect(5,10,def.w*.45,4);
  ctx.fillStyle='#24221c';for(let i=0;i<6;i++){ctx.beginPath();ctx.arc(7+i*(def.w-14)/5,def.h-7,4,0,Math.PI*2);ctx.fill();}ctx.fillStyle='#6d6657';for(let i=-1;i<8;i++)ctx.fillRect((i*12+tread)%(def.w+12)-6,def.h-12,5,2);
  ctx.fillStyle=def.color;ctx.fillRect(def.w*.25,-5,def.w*.42,15);ctx.fillStyle='#1c1b17';ctx.fillRect(def.w*.36,-8,def.w*.12,5);ctx.save();ctx.translate(-recoil*facing,0);ctx.fillStyle='#292820';if(facing>0)ctx.fillRect(def.w*.60,-1,def.w*.52,6);else ctx.fillRect(-def.w*.12,-1,def.w*.52,6);ctx.restore();
  if(key==='boss5'){ctx.fillStyle='#ffcf3d';ctx.fillRect(def.w*.42,-13,def.w*.16,4);ctx.fillStyle='#1b1713';ctx.font='bold 10px monospace';ctx.textAlign='center';ctx.fillText('COLOSSO',def.w/2,-18);}ctx.restore();
}

function drawUnits() {
  units.forEach(u => {
    if (u.def.tank || u.def.aerial || u.def.mecha) drawTank(u); else drawSoldier(u);
    ctx.fillStyle = '#000'; ctx.fillRect(u.x, u.y-8, u.def.w, 4);
    ctx.fillStyle = u.side==='player' ? '#7fbf4d' : '#c1440e';
    ctx.fillRect(u.x, u.y-8, u.def.w*(u.hp/u.maxHp), 4);
  });
}

function drawProjectiles() {
  projectiles.forEach(p => {
    const dir=Math.sign(p.vx)||1;
    ctx.globalAlpha=.35;ctx.fillStyle=p.side==='player'?'#ffe8a6':'#ff9687';ctx.fillRect(p.x-dir*10,p.y+1,10,p.h-2);
    ctx.globalAlpha=1;ctx.fillStyle = p.side==='player' ? '#ffd27a' : '#ff6a5a';
    ctx.fillRect(p.x,p.y,p.w,p.h);
    if(p.splash){ctx.globalAlpha=.35;ctx.beginPath();ctx.arc(p.x+p.w/2,p.y+p.h/2,8,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;}
  });
}
function draw() {
  ctx.save();
  if(cameraShake>0){ctx.translate((Math.random()-.5)*cameraShake,(Math.random()-.5)*cameraShake);}
  drawBackground();
  drawProjectiles();
  drawDeathEffects();
  drawUnits();
  drawParticles();
  ctx.restore();
}

function loop(ts=0) {
  const dt = lastTs ? Math.min((ts-lastTs)/16.6667, 2.5) : 1;
  lastTs = ts;
  update(dt); draw(); requestAnimationFrame(loop);
}

function renderUpgradePanel(returnFn) {
  const rows = UNIT_DEFS.map(d => {
    const lvl = upgrades[d.key] || 0;
    const cost = 4 + lvl*3;
    const maxed = lvl >= MAX_LEVEL;
    return `
      <div class="upgrade-row" style="display:flex;align-items:center;justify-content:space-between;gap:10px;width:380px;padding:6px 10px;border:2px solid #4b5320;margin-bottom:6px;background:#241f14;">
        <div style="text-align:left;">
          <div style="font-size:13px;color:#e8a13a;">${d.name} — Nível ${lvl}/${MAX_LEVEL}</div>
          <div style="font-size:10px;opacity:.8;">+${Math.round(lvl*UPG_BONUS*100)}% vida e dano • ${lvl>=10?'VETERANO':lvl>=5?'ESPECIAL LIBERADO':'próximo marco Nv.5'}</div>
        </div>
        <button class="upgBtn" data-key="${d.key}" ${maxed || evoPoints<cost ? 'disabled':''}
          style="padding:8px 12px;font-size:11px;background:#c1440e;color:#e8dcc0;border:2px solid #e8a13a;cursor:pointer;font-family:inherit;">
          ${maxed ? 'MÁXIMO' : cost + ' PE'}
        </button>
      </div>`;
  }).join('');
  overlay.innerHTML = `
    <h1 style="font-size:26px;">EVOLUIR BONECOS</h1>
    <div style="font-size:13px;color:#7fd1e8;margin-bottom:6px;">Pontos de Evolução: ${evoPoints}</div>
    ${rows}
    <button id="backBtn">VOLTAR</button>
  `;
  overlay.querySelectorAll('.upgBtn').forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.getAttribute('data-key');
      const lvl = upgrades[key] || 0;
      const cost = 4 + lvl*3;
      if (lvl < MAX_LEVEL && evoPoints >= cost) {
        evoPoints -= cost;
        upgrades[key] = lvl + 1;
        updateEvoHud();
        saveProgress();
        renderUpgradePanel(returnFn);
      }
    });
  });
  document.getElementById('backBtn').addEventListener('click', returnFn);
}

function renderStartScreen() {
  leaveGameDisplayMode();
  overlay.classList.remove('hidden');
  document.getElementById('pauseBtn').classList.add('hidden');
  running=false;
  overlay.innerHTML=`
    <div class="main-menu">
      <section class="menu-hero">
        <div class="menu-kicker">V5.9 • SPRITES ANIMADOS • V4</div>
        <div class="menu-title">GUERRA <span>DE BASES</span></div>
        <div class="menu-subtitle">Monte seu exército, invista na economia, segure a linha e atravesse o campo até destruir a base inimiga.</div>
        <div class="menu-stats">
          <div class="stat-chip"><b>${unlockedStage}/15</b><span>FASES</span></div>
          <div class="stat-chip"><b>${wins}</b><span>VITÓRIAS</span></div>
          <div class="stat-chip"><b>${evoPoints}</b><span>PONTOS PE</span></div>
          <div class="stat-chip"><b>${bestTime?Math.floor(bestTime)+'s':'--'}</b><span>MELHOR TEMPO</span></div>
        </div>
      </section>
      <nav class="menu-actions">
        <button class="menuBtn primary" id="campaignBtn"><strong>▶ CAMPANHA</strong><small>Escolha uma das 15 batalhas e avance pela guerra.</small></button>
        <button class="menuBtn" id="armyBtn"><strong>♟ EXÉRCITO</strong><small>Veja tropas, atributos e desbloqueios.</small></button>
        <button class="menuBtn" id="evoBtn"><strong>⚡ EVOLUÇÃO</strong><small>Use PE para melhorar vida e dano permanentemente.</small></button>
        <button class="menuBtn" id="statsBtn"><strong>★ ESTATÍSTICAS</strong><small>Confira seu progresso geral na campanha.</small></button>
      </nav>
    </div>`;
  document.getElementById('campaignBtn').onclick=renderCampaignScreen;
  document.getElementById('armyBtn').onclick=renderArmyScreen;
  document.getElementById('evoBtn').onclick=()=>renderUpgradePanel(renderStartScreen);
  document.getElementById('statsBtn').onclick=renderStatsScreen;
}

function renderCampaignScreen(){
  const cards=STAGES.map(st=>`<button class="stageBtn" data-stage="${st.n}" ${st.n>unlockedStage?'disabled':''} style="padding:9px;font-size:10px;background:${st.n===currentStage?'#75401e':'#272219'};color:${st.n===currentStage?'#ffd079':'#e8dcc0'};border:2px solid ${st.n===currentStage?'#e8a13a':'#51442e'};">FASE ${st.n}${st.boss?' 👑':''}${st.tutorial?' 🎓':''}<br><span style="font-size:8px;color:#a99c83">${st.n>unlockedStage?'BLOQUEADA':st.name}</span></button>`).join('');
  overlay.innerHTML=`<div class="screen-card"><div class="screen-head"><div><div class="menu-kicker">MAPA DE OPERAÇÕES</div><h2>CAMPANHA</h2></div><button id="backBtn">VOLTAR</button></div><div class="stage-grid">${cards}</div><div style="margin-top:15px;padding:12px;border:1px solid #57472f;background:#17140f;text-align:left;font-size:10px;line-height:1.55;"><b style="color:#e8a13a">FASE ${currentStage} — ${stageDef().name}</b><br>${stageDef().tutorial?'Treinamento: renda alta, inimigos enfraquecidos e dicas durante a batalha.':stageDef().boss?'Operação de chefe: prepare tropas fortes e melhore sua base antes do confronto.':'Batalha regular. A IA fica mais rica e agressiva conforme a campanha avança.'}</div><button id="startBtn" style="margin-top:14px;">INICIAR FASE ${currentStage}</button></div>`;
  overlay.querySelectorAll('.stageBtn').forEach(b=>b.onclick=()=>{currentStage=Number(b.dataset.stage);renderCampaignScreen();});
  document.getElementById('backBtn').onclick=renderStartScreen;document.getElementById('startBtn').onclick=startGame;
}

function renderArmyScreen(){
 const cards=UNIT_DEFS.map((d,i)=>{const locked=unlockedStage<UNIT_UNLOCK_STAGE[i];return `<div class="army-card ${locked?'locked':''}"><h3>${locked?'🔒 ':''}${d.name}</h3><p>Custo: $${d.cost}<br>Vida: ${d.hp} • Dano: ${d.dmg}<br>Alcance: ${d.range} • Velocidade: ${d.speed}<br>${locked?'Desbloqueia na Fase '+UNIT_UNLOCK_STAGE[i]:'Nível permanente: '+(upgrades[d.key]||0)+'/'+MAX_LEVEL}</p></div>`}).join('');
 overlay.innerHTML=`<div class="screen-card"><div class="screen-head"><div><div class="menu-kicker">ARSENAL</div><h2>EXÉRCITO</h2></div><button id="backBtn">VOLTAR</button></div><div class="army-grid">${cards}</div></div>`;document.getElementById('backBtn').onclick=renderStartScreen;
}

function renderStatsScreen(){
 const totalLevels=Object.values(upgrades).reduce((a,b)=>a+b,0);
 overlay.innerHTML=`<div class="screen-card"><div class="screen-head"><div><div class="menu-kicker">REGISTRO DE COMBATE</div><h2>ESTATÍSTICAS</h2></div><button id="backBtn">VOLTAR</button></div><div class="menu-stats" style="justify-content:center"><div class="stat-chip"><b>${wins}</b><span>VITÓRIAS</span></div><div class="stat-chip"><b>${unlockedStage}</b><span>FASE MÁXIMA</span></div><div class="stat-chip"><b>${totalLevels}</b><span>UPGRADES</span></div><div class="stat-chip"><b>${evoPoints}</b><span>PE DISPONÍVEL</span></div><div class="stat-chip"><b>${bestTime?Math.floor(bestTime)+'s':'--'}</b><span>MELHOR TEMPO</span></div></div><p style="margin:18px auto 0!important">Complete a campanha, evolua suas tropas e tente vencer as fases novamente em menos tempo.</p></div>`;document.getElementById('backBtn').onclick=renderStartScreen;
}
function endGame(won) {
  gameOver = true; running = false; document.getElementById('pauseBtn').classList.add('hidden'); const bb=document.getElementById('bossBar'); if(bb) bb.style.display='none';
  const tutorialTip=document.getElementById('tutorialTip'); if(tutorialTip) tutorialTip.classList.add('hiddenTip');
  const reward = won ? stageDef().reward : Math.max(3, Math.floor(stageDef().reward/4));
  evoPoints += reward;
  if (won) { wins++; if (!bestTime || elapsed<bestTime) bestTime=elapsed; if(currentStage<15) unlockedStage=Math.max(unlockedStage,currentStage+1); }
  updateEvoHud();
  saveProgress();
  overlay.classList.remove('hidden');
  const renderEnd = () => {
    overlay.innerHTML = `
      <h1>${won ? 'BASE INIMIGA DESTRUÍDA!' : 'SUA BASE CAIU'}</h1>
      <p>${won ? 'Sua ofensiva quebrou as linhas inimigas.' : 'As forças inimigas dominaram sua base.'}<br>
         Você lutou ${Math.floor(elapsed)} segundos e ganhou ${reward} Pontos de Evolução.<br>Vitórias: ${wins}${bestTime ? ' • Melhor vitória: '+Math.floor(bestTime)+'s' : ''}</p>
      <div style="display:flex;gap:12px;">
        <button id="restartBtn">${won && currentStage<15 ? 'PRÓXIMA FASE' : 'JOGAR NOVAMENTE'}</button>
        <button id="evoBtn2">EVOLUIR BONECOS (${evoPoints} PE)</button><button id="menuBtn2">MENU PRINCIPAL</button>
      </div>
    `;
    document.getElementById('restartBtn').addEventListener('click', () => { if(won && currentStage<15) currentStage=Math.min(unlockedStage,currentStage+1); startGame(); });
    document.getElementById('evoBtn2').addEventListener('click', () => renderUpgradePanel(renderEnd));
    document.getElementById('menuBtn2').addEventListener('click', renderStartScreen);
  };
  renderEnd();
}

async function startGame() {
  await enterGameDisplayMode();
  overlay.classList.add('hidden');
  document.getElementById('pauseBtn').classList.remove('hidden');
  resetGame();
  running = true;
}

// unit buttons + detailed sprite card icons
UNIT_DEFS.forEach((d,i) => {
  document.getElementById('btn'+i).addEventListener('click', () => trySpawnPlayer(i));
});
function redrawUnitCardIcons(){

  const replacements={
    bazuca:spriteBazookaV54,
    sniper:spriteSniperV54,
    metralha:spriteGunnerV54,
    jipe:spriteJeepV54,
    tanque:spriteTankV54
  };

  if(!unitSpriteAtlas.complete || !unitSpriteAtlas.naturalWidth) return;
  UNIT_DEFS.forEach((d,i)=>{
    const iconCanvas=document.querySelector('#btn'+i+' .icon');
    if(!iconCanvas) return;
    iconCanvas.width=42; iconCanvas.height=42;
    const ic=iconCanvas.getContext('2d');
    ic.clearRect(0,0,42,42);
    const col=SPRITE_COL[d.key];
    if(col===undefined) return;
    ic.imageSmoothingEnabled=true;
    if(d.key==='comando' && spriteCommandV55.complete && spriteCommandV55.naturalWidth){
      const ratio=spriteCommandV55.naturalWidth/spriteCommandV55.naturalHeight;
      let dw=38,dh=dw/ratio;if(dh>39){dh=39;dw=dh*ratio;}
      ic.drawImage(spriteCommandV55,(42-dw)/2,42-dh-1,dw,dh);
      return;
    }
    const rep=replacements[d.key];
    if(rep && rep.complete && rep.naturalWidth){
      const pad=2, maxW=38, maxH=39, ratio=rep.naturalWidth/rep.naturalHeight;
      let dw=maxW, dh=dw/ratio;
      if(dh>maxH){dh=maxH;dw=dh*ratio;}
      ic.drawImage(rep,(42-dw)/2,42-dh-1,dw,dh);
      return;
    }
    if(d.key==='recruta' && recruitFinalSprite.complete && recruitFinalSprite.naturalWidth){
      ic.drawImage(recruitFinalSprite,0,0,256,256,4,2,34,39);
      return;
    }
    if(d.key==='bazuca' && userBazookaSprite.complete && userBazookaSprite.naturalWidth){
      ic.drawImage(userBazookaSprite,0,0,512,512,1,0,40,41);
      return;
    }
    if(d.key==='pesado' && heavyFinalSprite.complete && heavyFinalSprite.naturalWidth){
      ic.drawImage(heavyFinalSprite,0,0,512,512,1,0,40,41);
      return;
    }
    if(d.key==='sniper' && sniperUserSprite.complete && sniperUserSprite.naturalWidth){
      ic.drawImage(sniperUserSprite,0,0,512,512,1,0,40,41);
      return;
    }
    if(d.key==='tanque' && tankUserSprite.complete && tankUserSprite.naturalWidth){
      ic.drawImage(tankUserSprite,0,0,640,512,0,5,42,34);
      return;
    }
    // dark vignette behind icon
    const grad=ic.createRadialGradient(21,20,3,21,21,24);
    grad.addColorStop(0,'rgba(36,100,140,.28)');
    grad.addColorStop(1,'rgba(0,0,0,0)');
    ic.fillStyle=grad; ic.fillRect(0,0,42,42);
    const vehicle=d.key==='jipe'||d.key==='tanque';
    const dw=vehicle?40:34, dh=vehicle?30:39;
    ic.drawImage(unitSpriteAtlas,col*SPRITE_CELL,0,SPRITE_CELL,SPRITE_CELL,
                 (42-dw)/2,42-dh-1,dw,dh);
  });
}
unitSpriteAtlas.addEventListener('load',redrawUnitCardIcons);
recruitFinalSprite.addEventListener('load',redrawUnitCardIcons);
userBazookaSprite.addEventListener('load',redrawUnitCardIcons);
heavyFinalSprite.addEventListener('load',redrawUnitCardIcons);
sniperUserSprite.addEventListener('load',redrawUnitCardIcons);
tankUserSprite.addEventListener('load',redrawUnitCardIcons);
if(unitSpriteAtlas.complete) redrawUnitCardIcons();

spriteCommandV55.addEventListener('load',redrawUnitCardIcons);
[spriteBazookaV54,spriteSniperV54,spriteGunnerV54,spriteJeepV54,spriteTankV54].forEach(img=>{
  img.addEventListener('load',redrawUnitCardIcons);
});


resetGame();
loadProgress(); renderStartScreen();
loop();


document.getElementById('incomeBtn').addEventListener('click', () => {
  if (!running || gameOver) return;
  const cost = 80 + (incomeLevel-1)*70;
  if (money < cost || incomeLevel>=6) return;
  money -= cost; incomeLevel++; updateHud();
});

document.getElementById('baseBtn').addEventListener('click', () => {
  if (!running || gameOver) return;
  const cost = 100 + (baseLevel-1)*90;
  if (money < cost || baseLevel>=5) return;
  money -= cost; baseLevel++; playerBase.maxHp += 100; playerBase.hp += 100; updateHud();
});

document.getElementById('airBtn').addEventListener('click', () => {
  if (!running || gameOver || money < 140 || airCooldown>0) return;
  money -= 140; airCooldown = 12*60;
  units.filter(u=>u.side==='enemy').forEach(u=>{ u.hp -= 42; spawnExplosion(u.x+u.def.w/2,u.y+u.def.h/2,'#ffd27a',1.9); });
  enemyBase.hp -= 25; spawnExplosion(W-BASE_W,GROUND_Y-65,'#ffd27a',2.4);
  if (enemyBase.hp<=0) endGame(true);
  updateHud();
});

document.getElementById('pauseBtn').addEventListener('click',()=>{
  if(gameOver||!running)return; running=false; overlay.classList.remove('hidden');
  overlay.innerHTML=`<div class="screen-card" style="max-width:430px"><div class="menu-kicker">BATALHA PAUSADA</div><h1 style="font-size:28px">PAUSA</h1><p>Fase ${currentStage} — ${stageDef().name}</p><div class="menu-actions"><button class="menuBtn primary" id="resumeBtn"><strong>▶ CONTINUAR</strong></button><button class="menuBtn" id="pauseEvoBtn"><strong>⚡ EVOLUIR</strong></button><button class="menuBtn" id="quitBtn"><strong>⌂ MENU PRINCIPAL</strong><small>O progresso desta tentativa não será salvo como vitória.</small></button></div></div>`;
  document.getElementById('resumeBtn').onclick=()=>{overlay.classList.add('hidden');running=true;};
  document.getElementById('pauseEvoBtn').onclick=()=>renderUpgradePanel(()=>{overlay.classList.add('hidden');running=true;});
  document.getElementById('quitBtn').onclick=()=>{gameOver=true;renderStartScreen();};
});

document.getElementById('liveEvoBtn').addEventListener('click', () => {
  if (gameOver || !running) return; // só pausa durante uma partida em andamento
  running = false;
  overlay.classList.remove('hidden');
  renderUpgradePanel(() => {
    overlay.classList.add('hidden');
    if (!gameOver) running = true;
  });
});
