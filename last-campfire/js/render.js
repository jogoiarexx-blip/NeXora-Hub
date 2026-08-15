"use strict";

/* ============================================================
   DRAWING
============================================================ */
function draw(){
  ctx.clearRect(0,0,W,H);
  drawSky();
  drawGround();
  drawCampDecorations();
  drawTree();
  drawShelter();
  drawRain();
  drawWood();
  drawAnimal();
  drawFire();
  drawSmoke();
  drawEmbers();
  drawSparks();
  drawLeaves();
  drawFog();
  drawLightningFlash();
  drawVignette();
}

function nightProgress(){
  if(!G.running) return 0.3;
  return Math.min(1, G.time/G.nightDuration);
}

function drawSky(){
  const p = nightProgress();
  // deep night -> pre-dawn -> dawn colors
  let top, bottom;
  if(p<0.85){
    // deep night, subtle shift
    const k = p/0.85;
    top = lerpColor([5,8,20],[10,14,34], k);
    bottom = lerpColor([15,20,42],[25,28,55], k);
  } else {
    const k = (p-0.85)/0.15;
    top = lerpColor([10,14,34],[255,175,110], k);
    bottom = lerpColor([25,28,55],[255,222,150], k);
  }
  const g = ctx.createLinearGradient(0,0,0,groundY);
  g.addColorStop(0, rgb(top));
  g.addColorStop(1, rgb(bottom));
  ctx.fillStyle=g;
  ctx.fillRect(0,0,W,groundY+2);

  // stars
  const starAlpha = p<0.8 ? Math.min(1,p*3) * (1-Math.max(0,(p-0.6)/0.2)) : Math.max(0, 1-(p-0.8)/0.1);
  if(starAlpha>0.02){
    ctx.save();
    ctx.globalAlpha = Math.max(0,Math.min(1,starAlpha));
    for(let i=0;i<STAR_FIELD.length;i++){
      const s = STAR_FIELD[i];
      const tw = 0.6+0.4*Math.sin(G.time*2+s.seed);
      ctx.fillStyle='#fff';
      ctx.globalAlpha = Math.max(0,Math.min(1,starAlpha))*tw*s.b;
      ctx.beginPath();
      ctx.arc(s.x*W, s.y*groundY*0.9, s.r, 0, 7);
      ctx.fill();
    }
    ctx.restore();
  }

  // moon arching across sky
  const moonT = p; // 0..1 across whole night
  const mx = W*0.1 + (W*0.8)*moonT;
  const my = groundY*0.75 - Math.sin(moonT*Math.PI)*groundY*0.55;
  ctx.save();
  ctx.globalAlpha = Math.max(0.15, 1-p); // fades near dawn
  ctx.fillStyle='#f4f1e6';
  ctx.shadowColor='#f4f1e688'; ctx.shadowBlur=25;
  ctx.beginPath(); ctx.arc(mx,my,18,0,7); ctx.fill();
  ctx.shadowBlur=0;
  ctx.fillStyle='#dcd6bf';
  ctx.beginPath(); ctx.arc(mx-5,my-4,3.5,0,7); ctx.fill();
  ctx.beginPath(); ctx.arc(mx+6,my+5,2.4,0,7); ctx.fill();
  ctx.restore();
}
let STAR_FIELD = [];
function genStars(){
  STAR_FIELD = [];
  for(let i=0;i<70;i++){
    STAR_FIELD.push({ x:Math.random(), y:Math.random()*0.8, r:0.6+Math.random()*1.3, seed:Math.random()*10, b:0.5+Math.random()*0.5 });
  }
}
genStars();
function lerpColor(a,b,t){ return [a[0]+(b[0]-a[0])*t, a[1]+(b[1]-a[1])*t, a[2]+(b[2]-a[2])*t]; }
function rgb(c){ return `rgb(${c[0]|0},${c[1]|0},${c[2]|0})`; }

function drawGround(){
  const g = ctx.createLinearGradient(0,groundY,0,H);
  g.addColorStop(0,'#1c1710');
  g.addColorStop(1,'#0a0806');
  ctx.fillStyle=g;
  ctx.fillRect(0,groundY,W,H-groundY);
  // fire glow on ground
  const glow = Math.max(0, G.fireIntensity/maxIntensity());
  const rg = ctx.createRadialGradient(firePos.x, groundY, 10, firePos.x, groundY, 220);
  rg.addColorStop(0, `rgba(255,140,50,${0.25*glow})`);
  rg.addColorStop(1, 'rgba(255,140,50,0)');
  ctx.fillStyle=rg;
  ctx.fillRect(0,groundY-40,W,H-groundY+40);
}

function drawFog(){
  if(G.fog<=0.01) return;
  ctx.save();
  ctx.globalAlpha = G.fog*0.35;
  const g = ctx.createLinearGradient(0,groundY-100,0,H);
  g.addColorStop(0,'rgba(200,205,220,0)');
  g.addColorStop(0.5,'rgba(200,205,220,0.6)');
  g.addColorStop(1,'rgba(200,205,220,0.2)');
  ctx.fillStyle=g;
  ctx.fillRect(0,groundY-100,W,H-groundY+100);
  ctx.restore();
}

function drawLightningFlash(){
  if(G.lightning>0){
    ctx.save();
    ctx.globalAlpha = G.lightning*0.5;
    ctx.fillStyle='#ffffff';
    ctx.fillRect(0,0,W,H);
    ctx.restore();
  }
}

function drawVignette(){
  const g = ctx.createRadialGradient(W/2,H/2,H*0.35,W/2,H/2,H*0.75);
  g.addColorStop(0,'rgba(0,0,0,0)');
  g.addColorStop(1,'rgba(0,0,0,0.45)');
  ctx.fillStyle=g;
  ctx.fillRect(0,0,W,H);
}

/* ---- TREE ---- */
function drawTree(){
  for(const t of G.trees){
    const sway = Math.sin(t.sway*1.1)*4 + (G.weather.type==='wind'||G.weather.type==='storm' ? Math.sin(t.sway*5)*8 : 0);
    ctx.save();
    ctx.translate(t.x, t.y);
    // trunk
    ctx.fillStyle='#3b2a1a';
    ctx.beginPath();
    ctx.moveTo(-9,4); ctx.lineTo(9,4); ctx.lineTo(5+sway*0.1,-90); ctx.lineTo(-5+sway*0.1,-90);
    ctx.closePath(); ctx.fill();
    // foliage clusters
    ctx.fillStyle='#22421f';
    drawLeafCluster(sway*0.6,-110,46);
    ctx.fillStyle='#2b512a';
    drawLeafCluster(-24+sway,-90,34);
    drawLeafCluster(26+sway,-95,32);
    drawLeafCluster(sway*0.8,-135,30);
    ctx.restore();
  }
}
function drawLeafCluster(x,y,r){
  ctx.beginPath();
  ctx.arc(x,y,r,0,7);
  ctx.fill();
}

/* ---- WOOD PIECES ---- */
function drawWood(){
  for(const w of G.woodPieces){
    if(w.consumed) continue;
    const bobY = w.landed ? Math.sin(w.bob)*1.2 : 0;
    let alpha = 1;
    if(w.landed && !w.dragging && w.despawnTimer!==undefined && w.despawnTimer!==null && w.despawnTimer<2.5){
      const t = Math.max(0, w.despawnTimer);
      alpha = 0.35 + 0.65*Math.abs(Math.sin(t*6));
    }
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(w.x, w.y+bobY - (w.dragging?10:0));
    ctx.rotate(w.rot);
    ctx.scale(w.scale||1, w.scale||1);
    if(w.dragging){
      ctx.shadowColor='#000a'; ctx.shadowBlur=10;
    }
    drawLog(w.def.size, w.def.color, w.type==='dourado');
    ctx.restore();
    if(w.dragging){
      ctx.save();
      ctx.globalAlpha=0.25;
      ctx.fillStyle='#000';
      ctx.beginPath(); ctx.ellipse(w.x, w.y+4, w.def.size*0.7, 4, 0,0,7); ctx.fill();
      ctx.restore();
    }
  }
}
function hexToRgb(hex){ hex=hex.replace('#',''); const n=parseInt(hex,16); return [(n>>16)&255,(n>>8)&255,n&255]; }
function shade(hex, amt){
  const [r,g,b]=hexToRgb(hex);
  const c=v=>Math.max(0,Math.min(255,v+amt));
  return `rgb(${c(r)},${c(g)},${c(b)})`;
}
function roundRectPath(x,y,w,h,r){
  const rr = Math.min(r, w/2, h/2);
  ctx.beginPath();
  ctx.moveTo(x+rr,y);
  ctx.lineTo(x+w-rr,y);
  ctx.arcTo(x+w,y,x+w,y+rr,rr);
  ctx.lineTo(x+w,y+h-rr);
  ctx.arcTo(x+w,y+h,x+w-rr,y+h,rr);
  ctx.lineTo(x+rr,y+h);
  ctx.arcTo(x,y+h,x,y+h-rr,rr);
  ctx.lineTo(x,y+rr);
  ctx.arcTo(x,y,x+rr,y,rr);
  ctx.closePath();
}
function drawLog(size, color, golden){
  const len = size*2.5;
  const th = size*1.05;

  // corpo cilíndrico com sombreamento (casca)
  const grad = ctx.createLinearGradient(0,-th/2,0,th/2);
  grad.addColorStop(0, shade(color, 38));
  grad.addColorStop(0.45, color);
  grad.addColorStop(1, shade(color, -45));
  ctx.fillStyle = grad;
  roundRectPath(-len/2, -th/2, len-th*0.35, th, th/2);
  ctx.fill();

  // veios/textura da casca
  ctx.strokeStyle = shade(color,-55)+'';
  ctx.globalAlpha = 0.55;
  ctx.lineWidth = 1;
  for(let i=0;i<3;i++){
    const oy = -th*0.3 + i*th*0.3;
    ctx.beginPath();
    ctx.moveTo(-len/2+th*0.3, oy);
    ctx.quadraticCurveTo(0, oy+2, len/2-th*0.6, oy);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // brilho superior (luz)
  ctx.strokeStyle = shade(color, 55)+'';
  ctx.globalAlpha = 0.35;
  ctx.lineWidth = th*0.16;
  ctx.beginPath();
  ctx.moveTo(-len/2+th*0.4, -th*0.22);
  ctx.lineTo(len/2-th*0.9, -th*0.22);
  ctx.stroke();
  ctx.globalAlpha = 1;

  // face cortada (topo com anéis de crescimento)
  const capX = len/2 - th*0.5;
  ctx.fillStyle = golden ? '#f5e6a0' : shade(color, 60);
  ctx.beginPath(); ctx.ellipse(capX, 0, th*0.42, th*0.52, 0, 0, 7); ctx.fill();
  ctx.strokeStyle = golden ? '#c9a53d' : shade(color, -10);
  ctx.lineWidth = 1;
  for(let r=0.16; r<0.42; r+=0.09){
    ctx.beginPath(); ctx.ellipse(capX, 0, th*r, th*r*1.24, 0, 0, 7); ctx.stroke();
  }
  ctx.fillStyle = golden ? '#8a6a1a' : shade(color,-25);
  ctx.beginPath(); ctx.ellipse(capX, 0, th*0.05, th*0.06, 0, 0, 7); ctx.fill();

  // contorno geral
  if(golden){ ctx.shadowColor='#ffe08a'; ctx.shadowBlur=14; }
  ctx.strokeStyle = golden? '#fff2b0':'rgba(0,0,0,0.35)';
  ctx.lineWidth = 1.3;
  roundRectPath(-len/2, -th/2, len-th*0.35, th, th/2);
  ctx.stroke();
  ctx.beginPath(); ctx.ellipse(capX, 0, th*0.42, th*0.52, 0, 0, 7); ctx.stroke();
  ctx.shadowBlur=0;
}

/* ---- ANIMAL ---- */
function drawAnimal(){
  if(!G.animal) return;
  const a = G.animal;
  ctx.save();
  ctx.translate(a.x, a.y);
  ctx.fillStyle='#4a4a52';
  ctx.beginPath(); ctx.ellipse(0,0,14,8,0,0,7); ctx.fill();
  ctx.beginPath(); ctx.arc(12,-4,6,0,7); ctx.fill();
  ctx.fillStyle='#2c2c30';
  ctx.beginPath(); ctx.arc(15,-7,2,0,7); ctx.fill();
  ctx.restore();
}

/* ---- FIRE ---- */
/* ---- SHELTER (proteção da fogueira) ---- */
function drawShelter(){
  const lvl = up('shelter');
  if(lvl<=0) return;
  const fx = firePos.x, fy = firePos.y;
  ctx.save();
  ctx.translate(fx, fy);
  ctx.strokeStyle='#4a3018';
  ctx.lineWidth=4;
  ctx.lineCap='round';
  // postes de apoio (2 a 4 conforme nível)
  const posts = Math.min(4, 2+Math.floor((lvl-1)/2));
  const spread = 46;
  for(let i=0;i<posts;i++){
    const px = -spread + (i*(spread*2/(posts-1||1)));
    ctx.beginPath();
    ctx.moveTo(px*0.6, 6);
    ctx.lineTo(px, -70-lvl*6);
    ctx.stroke();
  }
  // cobertura de galhos (cresce com o nível)
  const coverage = Math.min(1, lvl/5);
  ctx.fillStyle='rgba(58,40,24,'+(0.55+coverage*0.3)+')';
  ctx.beginPath();
  ctx.moveTo(-spread-10, -70-lvl*6);
  ctx.quadraticCurveTo(0, -100-lvl*10, spread+10, -70-lvl*6);
  ctx.lineTo(spread-16, -60-lvl*6);
  ctx.quadraticCurveTo(0, -86-lvl*9, -spread+16, -60-lvl*6);
  ctx.closePath();
  ctx.fill();
  // painéis laterais de vento (níveis mais altos)
  if(lvl>=3){
    ctx.fillStyle='rgba(58,40,24,0.5)';
    ctx.beginPath(); ctx.moveTo(-spread-6,-4); ctx.lineTo(-spread-6,-70-lvl*4); ctx.lineTo(-spread+14,-60-lvl*4); ctx.lineTo(-spread+14,-2); ctx.closePath(); ctx.fill();
  }
  if(lvl>=4){
    ctx.beginPath(); ctx.moveTo(spread+6,-4); ctx.lineTo(spread+6,-70-lvl*4); ctx.lineTo(spread-14,-60-lvl*4); ctx.lineTo(spread-14,-2); ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}

function drawFire(){
  const ratio = Math.max(0, G.fireIntensity/maxIntensity());
  const baseH = 40 + ratio*90;
  const baseW = 26 + ratio*22;
  const flicker = Math.sin(G.time*14)*3 + Math.sin(G.time*23)*2;
  const fx = firePos.x, fy = firePos.y;

  // glow
  ctx.save();
  const glowR = 60+ratio*140;
  const rg = ctx.createRadialGradient(fx,fy-baseH*0.4,4, fx,fy-baseH*0.4, glowR);
  rg.addColorStop(0, `rgba(255,190,110,${0.5*ratio+0.1})`);
  rg.addColorStop(1, 'rgba(255,140,60,0)');
  ctx.fillStyle=rg;
  ctx.beginPath(); ctx.arc(fx,fy-baseH*0.4, glowR,0,7); ctx.fill();
  ctx.restore();

  // logs at base
  ctx.save();
  ctx.translate(fx,fy);
  ctx.fillStyle='#3a2415';
  ctx.beginPath(); ctx.ellipse(-14,4,18,6,0.3,0,7); ctx.fill();
  ctx.beginPath(); ctx.ellipse(14,4,18,6,-0.3,0,7); ctx.fill();
  ctx.beginPath(); ctx.ellipse(0,6,20,7,0,0,7); ctx.fill();
  ctx.restore();

  // flame layers
  ctx.save();
  ctx.translate(fx, fy);
  const colors = ratio>0.55 ? ['#fff3c4','#ffcf5c','#ff9d2e','#ff5b1f'] :
                 ratio>0.25 ? ['#ffe6a8','#ffb04c','#e0631f','#a83a12'] :
                               ['#ffd9a0','#e0793a','#a8451f','#6b2410'];
  for(let i=3;i>=0;i--){
    const layerH = (baseH*(0.4+i*0.22)) + flicker*(0.3+i*0.15);
    const layerW = baseW*(1-i*0.16);
    ctx.fillStyle = colors[i];
    if(i===0){ ctx.shadowColor=colors[0]; ctx.shadowBlur=18*ratio; }
    drawFlameShape(0, -layerH*0.5, layerW, layerH, i);
    ctx.shadowBlur=0;
  }
  ctx.restore();

  // brasas at base
  ctx.save();
  ctx.translate(fx,fy-2);
  for(let i=0;i<5;i++){
    const bx = (i-2)*8 + Math.sin(G.time*3+i)*2;
    const flick = 0.5+0.5*Math.sin(G.time*9+i*2);
    ctx.fillStyle = `rgba(255,${100+Math.floor(flick*80)},40,${0.5+0.5*flick})`;
    ctx.beginPath(); ctx.arc(bx,2,2+flick*1.5,0,7); ctx.fill();
  }
  ctx.restore();
}
function drawFlameShape(cx,cy,w,h,seedOffset){
  const t = G.time*6+seedOffset*2;
  ctx.beginPath();
  const points=10;
  for(let i=0;i<=points;i++){
    const a = (i/points);
    const wob = Math.sin(t+i*1.3)*w*0.12;
    const px = cx + Math.sin(a*Math.PI)*w*0.5*(1-a*0.3) + wob*(a);
    const py = cy + h*0.5 - a*h;
    if(i===0) ctx.moveTo(px,py); else ctx.lineTo(px,py);
  }
  for(let i=points;i>=0;i--){
    const a=(i/points);
    const wob = Math.cos(t*1.1+i*1.3)*w*0.12;
    const px = cx - Math.sin(a*Math.PI)*w*0.5*(1-a*0.3) + wob*(a);
    const py = cy + h*0.5 - a*h;
    ctx.lineTo(px,py);
  }
  ctx.closePath();
  ctx.fill();
}

function drawSmoke(){
  for(const p of G.smoke){
    const t = p.age/p.life;
    ctx.save();
    ctx.globalAlpha = (1-t)*0.28;
    ctx.fillStyle='#cfcfcf';
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size*(0.6+t*1.4), 0, 7);
    ctx.fill();
    ctx.restore();
  }
}
function drawEmbers(){
  for(const p of G.embers){
    const t = p.age/p.life;
    ctx.save();
    ctx.globalAlpha = 1-t;
    ctx.fillStyle = t<0.6? '#ffcf7a':'#ff5b1f';
    ctx.beginPath();
    ctx.arc(p.x,p.y,p.size*(1-t*0.5),0,7);
    ctx.fill();
    ctx.restore();
  }
}
function drawSparks(){
  for(const p of G.sparks){
    p.vy += 200*0.016;
    const t = p.age/p.life;
    ctx.save();
    ctx.globalAlpha = 1-t;
    ctx.fillStyle = p.color;
    ctx.beginPath(); ctx.arc(p.x,p.y,2.2*(1-t*0.5),0,7); ctx.fill();
    ctx.restore();
  }
}
function drawRain(){
  if(G.rain.length===0) return;
  ctx.save();
  ctx.strokeStyle='rgba(190,210,255,0.5)';
  ctx.lineWidth=1.4;
  for(const r of G.rain){
    ctx.beginPath();
    ctx.moveTo(r.x,r.y);
    ctx.lineTo(r.x-2, r.y+r.len);
    ctx.stroke();
  }
  ctx.restore();
}
function drawLeaves(){
  for(const l of G.leaves){
    ctx.save();
    ctx.globalAlpha = Math.max(0,1-l.age/l.life);
    ctx.translate(l.x,l.y);
    ctx.rotate(l.rot);
    ctx.fillStyle='#3f6b2f';
    ctx.beginPath(); ctx.ellipse(0,0,5,2.6,0,0,7); ctx.fill();
    ctx.restore();
  }
}

/* ---- CAMP DECORATIONS ---- */
const CAMP_ITEMS = ['barraca','banco','cerca','lampiao','fogueira_maior','abrigo','carroca','poco','decoracao'];
function drawCampDecorations(){
  const lvl = G.running ? save.campLevel : save.campLevel; // unlocked count = campLevel-1
  const unlocked = Math.max(0, save.campLevel-1);
  for(let i=0;i<unlocked && i<CAMP_ITEMS.length;i++){
    drawCampItem(CAMP_ITEMS[i], i);
  }
}
function drawCampItem(name, idx){
  const slotX = W*0.78 + (idx%3)*26 - 20;
  const slotY = groundY - 6 - Math.floor(idx/3)*0;
  ctx.save();
  ctx.translate(slotX, slotY);
  switch(name){
    case 'barraca':
      ctx.fillStyle='#7a4a2a';
      ctx.beginPath(); ctx.moveTo(-16,0); ctx.lineTo(0,-28); ctx.lineTo(16,0); ctx.closePath(); ctx.fill();
      ctx.fillStyle='#5a3018'; ctx.beginPath(); ctx.moveTo(0,-28); ctx.lineTo(0,0); ctx.lineTo(16,0); ctx.closePath(); ctx.fill();
      break;
    case 'banco':
      ctx.fillStyle='#4a3018';
      ctx.fillRect(-14,-6,28,4);
      ctx.fillRect(-12,-2,3,8); ctx.fillRect(9,-2,3,8);
      break;
    case 'cerca':
      ctx.strokeStyle='#5a4028'; ctx.lineWidth=3;
      ctx.beginPath(); ctx.moveTo(-18,-2); ctx.lineTo(18,-2); ctx.moveTo(-18,-8); ctx.lineTo(18,-8); ctx.stroke();
      for(let i=-1;i<=1;i++){ ctx.beginPath(); ctx.moveTo(i*16,4); ctx.lineTo(i*16,-16); ctx.stroke(); }
      break;
    case 'lampiao':
      ctx.strokeStyle='#333'; ctx.lineWidth=2;
      ctx.beginPath(); ctx.moveTo(0,4); ctx.lineTo(0,-26); ctx.stroke();
      ctx.fillStyle='#ffd98a'; ctx.shadowColor='#ffd98a'; ctx.shadowBlur=12;
      ctx.beginPath(); ctx.arc(0,-30,6,0,7); ctx.fill(); ctx.shadowBlur=0;
      break;
    case 'fogueira_maior':
      ctx.fillStyle='#3a2415';
      ctx.beginPath(); ctx.arc(0,0,10,0,7); ctx.fill();
      ctx.fillStyle='#ff9d42'; ctx.beginPath(); ctx.arc(0,-6,4,0,7); ctx.fill();
      break;
    case 'abrigo':
      ctx.fillStyle='#5c4530';
      ctx.beginPath(); ctx.moveTo(-18,-2); ctx.lineTo(-14,-20); ctx.lineTo(14,-20); ctx.lineTo(18,-2); ctx.closePath(); ctx.fill();
      break;
    case 'carroca':
      ctx.fillStyle='#5a3a20'; ctx.fillRect(-16,-10,26,10);
      ctx.strokeStyle='#2a2a2a'; ctx.lineWidth=2;
      ctx.beginPath(); ctx.arc(-10,0,4,0,7); ctx.stroke();
      ctx.beginPath(); ctx.arc(6,0,4,0,7); ctx.stroke();
      break;
    case 'poco':
      ctx.fillStyle='#6b6b6b';
      ctx.beginPath(); ctx.ellipse(0,0,10,5,0,0,7); ctx.fill();
      ctx.fillStyle='#3a3a3a'; ctx.beginPath(); ctx.ellipse(0,0,6,3,0,0,7); ctx.fill();
      break;
    case 'decoracao':
      ctx.fillStyle='#c94b8a';
      for(let i=0;i<3;i++){ ctx.beginPath(); ctx.arc(-8+i*8,-4,3,0,7); ctx.fill(); }
      ctx.strokeStyle='#3f6b2f'; ctx.lineWidth=2;
      ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(0,-8); ctx.stroke();
      break;
  }
  ctx.restore();
}

/* ============================================================
   INIT
============================================================ */
resize();
refreshMenu();
requestAnimationFrame((t)=>{ lastT=t; requestAnimationFrame(loop); });

// prevent page scroll/zoom gestures
document.addEventListener('touchmove', e=>{
  if(e.target.closest('.panel-box')) return; // permite rolar dentro de loja/conquistas/config
  e.preventDefault();
}, {passive:false});
document.addEventListener('gesturestart', e=>{ e.preventDefault(); });

