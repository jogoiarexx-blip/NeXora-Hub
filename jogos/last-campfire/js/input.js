"use strict";

/* ============================================================
   INPUT (pointer events for drag)
============================================================ */
canvas.addEventListener('pointerdown', onPointerDown, {passive:false});
canvas.addEventListener('pointermove', onPointerMove, {passive:false});
canvas.addEventListener('pointerup', onPointerUp, {passive:false});
canvas.addEventListener('pointercancel', onPointerUp, {passive:false});

function getLocalPos(e){
  const rect = canvas.getBoundingClientRect();
  return { x: e.clientX-rect.left, y: e.clientY-rect.top };
}
function onPointerDown(e){
  if(!G.running || G.paused) return;
  e.preventDefault();
  const p = getLocalPos(e);
  // find closest wood piece within radius, prefer landed, topmost (last drawn)
  let best=null, bestD=9999;
  for(let i=G.woodPieces.length-1;i>=0;i--){
    const w = G.woodPieces[i];
    if(!w.landed || w.dragging || w.consumed) continue;
    const d = Math.hypot(p.x-w.x, p.y-w.y);
    const hitR = w.def.size + 16;
    if(d<hitR && d<bestD){ best=w; bestD=d; }
  }
  if(best){
    best.dragging=true;
    best.dragOffX = p.x-best.x; best.dragOffY = p.y-best.y;
    G.dragging = { woodId: best.id, pointerId: e.pointerId };
    document.getElementById('dragGhostHint').classList.add('hidden');
  }
}
function onPointerMove(e){
  if(!G.dragging) return;
  e.preventDefault();
  const p = getLocalPos(e);
  const w = G.woodPieces.find(w=>w.id===G.dragging.woodId);
  if(!w){ G.dragging=null; return; }
  w.x = p.x - w.dragOffX;
  w.y = p.y - w.dragOffY;
}
function onPointerUp(e){
  if(!G.dragging) return;
  const w = G.woodPieces.find(w=>w.id===G.dragging.woodId);
  G.dragging=null;
  if(!w) return;
  w.dragging=false;
  const d = Math.hypot(w.x-firePos.x, w.y-(firePos.y-30));
  if(d < 55){
    consumeWood(w);
  }
}
function consumeWood(w){
  w.consumed=true;
  const totalEnergy = w.def.energy * woodValueMul();
  const duration = w.def.burn || 5;
  G.burningLogs.push({ rate: totalEnergy/duration, timeLeft: duration });
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

