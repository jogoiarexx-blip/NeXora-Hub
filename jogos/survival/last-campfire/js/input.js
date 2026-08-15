"use strict";

/* ============================================================
   INPUT (drag + tap/click selection + desktop shortcuts)
============================================================ */
canvas.addEventListener('pointerdown', onPointerDown, {passive:false});
canvas.addEventListener('pointermove', onPointerMove, {passive:false});
canvas.addEventListener('pointerup', onPointerUp, {passive:false});
canvas.addEventListener('pointercancel', onPointerUp, {passive:false});
let pointerStart=null;

function getLocalPos(e){
  const rect = canvas.getBoundingClientRect();
  return { x: e.clientX-rect.left, y: e.clientY-rect.top };
}
function nearestWood(p, pointerType='mouse'){
  let best=null, bestD=9999;
  for(let i=G.woodPieces.length-1;i>=0;i--){
    const w=G.woodPieces[i];
    if(!w.landed || w.dragging || w.consumed) continue;
    const d=Math.hypot(p.x-w.x,p.y-w.y);
    const hitR=w.def.size + (pointerType==='touch'?30:18);
    if(d<hitR && d<bestD){best=w;bestD=d;}
  }
  return best;
}
function fireHit(p){
  return Math.hypot(p.x-firePos.x,p.y-(firePos.y-28)) < (matchMedia('(max-width:759px)').matches?78:70);
}
function onPointerDown(e){
  if(!G.running || G.paused) return;
  e.preventDefault();
  const p=getLocalPos(e);
  pointerStart={x:p.x,y:p.y,t:performance.now(),pointerType:e.pointerType};
  if(G.selectedWoodId && fireHit(p)){
    const selected=G.woodPieces.find(w=>w.id===G.selectedWoodId);
    if(selected){ consumeWood(selected); G.selectedWoodId=null; return; }
  }
  const best=nearestWood(p,e.pointerType);
  if(best){
    best.dragging=true;
    best.dragOffX=p.x-best.x; best.dragOffY=p.y-best.y;
    G.dragging={woodId:best.id,pointerId:e.pointerId};
    gameEl.classList.add('dragging');
    try{canvas.setPointerCapture(e.pointerId);}catch(_){ }
    document.getElementById('dragGhostHint').classList.add('hidden');
  }
}
function onPointerMove(e){
  if(!G.dragging) return;
  e.preventDefault();
  const p=getLocalPos(e);
  const w=G.woodPieces.find(w=>w.id===G.dragging.woodId);
  if(!w){ G.dragging=null; return; }
  w.x=Math.max(6,Math.min(W-6,p.x-w.dragOffX));
  w.y=Math.max(6,Math.min(H-6,p.y-w.dragOffY));
}
function onPointerUp(e){
  if(!G.dragging) return;
  const p=getLocalPos(e);
  const w=G.woodPieces.find(w=>w.id===G.dragging.woodId);
  G.dragging=null; gameEl.classList.remove('dragging');
  if(!w) return;
  w.dragging=false;
  const moved=pointerStart?Math.hypot(p.x-pointerStart.x,p.y-pointerStart.y):999;
  const quick=pointerStart?(performance.now()-pointerStart.t)<320:false;
  pointerStart=null;
  if(fireHit({x:w.x,y:w.y-5})){
    G.selectedWoodId=null; consumeWood(w); return;
  }
  if(moved<10 && quick){
    G.selectedWoodId = (G.selectedWoodId===w.id?null:w.id);
    showEventBanner(G.selectedWoodId?'🪵 Madeira selecionada — toque/clique na fogueira':'Seleção cancelada',1200);
  }
}

document.addEventListener('keydown', e=>{
  if(!G.running) return;
  if(e.key==='Escape'){ e.preventDefault(); setPaused(!G.paused); }
  if((e.key==='f'||e.key==='F') && !e.ctrlKey && !e.metaKey){
    if(!document.fullscreenElement) gameEl.requestFullscreen?.().catch(()=>{}); else document.exitFullscreen?.();
  }
});

function consumeWood(w){
  w.consumed=true;
  let totalEnergy = w.def.energy * woodValueMul();
  let duration = w.def.burn || 5;
  if(w.def.wet){ totalEnergy*=0.78; showEventBanner('💧 Madeira molhada: queima devagar',1100); }
  if(w.def.resin){ totalEnergy*=1.12; G.fireIntensity=Math.min(maxIntensity(),G.fireIntensity+6); showEventBanner('✨ Resina! A chama ganhou força',1000); }
  G.combo = G.comboTimer>0 ? G.combo+1 : 1; G.comboTimer=3.2; G.maxCombo=Math.max(G.maxCombo,G.combo);
  if(G.combo>=3){ save.coins += Math.floor(G.combo/3); const cb=document.getElementById('comboBadge'); if(cb){cb.textContent='🔥 COMBO x'+G.combo;cb.classList.remove('hidden');setTimeout(()=>cb.classList.add('hidden'),850);} }
  if(G.combo>=8) unlockAch('combo8');
  G.burningLogs.push({ rate: totalEnergy/duration, timeLeft: duration });
  if(G.boss && !G.bossDefeated){
    let bossDamage = 2.2 + totalEnergy*0.17 + Math.min(5,G.combo*0.45);
    if(w.def.resin) bossDamage += 6;
    if(w.type==='dourado') bossDamage += 8;
    damageBoss(bossDamage);
  }
  G.woodBurnedThisRun++;
  save.coins += w.def.coins;
  refreshMenu();
  for(let i=0;i<10;i++){
    G.sparks.push({ x:firePos.x+(Math.random()*20-10), y:firePos.y-20, vx:(Math.random()-0.5)*70, vy:-80-Math.random()*90, life:0.6+Math.random()*0.4, age:0, color: Math.random()<0.5?'#ffcf7a':'#ff9d42' });
  }
  const idx = G.woodPieces.indexOf(w);
  if(idx>=0) G.woodPieces.splice(idx,1);
  sfx.playPop();
  if(save.settings.vibe && navigator.vibrate) navigator.vibrate(18);
}

