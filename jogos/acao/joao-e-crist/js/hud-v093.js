// v0.9.3 - HUD compacto, simétrico e sem lógica de gameplay dentro do draw.
(() => {
  const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
  const panel=(x,y,w,h)=>{ctx.fillStyle='rgba(5,9,16,.78)';ctx.fillRect(x,y,w,h);ctx.strokeStyle='rgba(255,255,255,.18)';ctx.lineWidth=1;ctx.strokeRect(x+.5,y+.5,w-1,h-1)};
  const bar=(x,y,w,h,p,kind='life')=>{
    p=clamp(p); ctx.fillStyle='rgba(255,255,255,.10)';ctx.fillRect(x,y,w,h);
    const g=ctx.createLinearGradient(x,0,x+w,0);
    if(kind==='xp'){g.addColorStop(0,'#31cfff');g.addColorStop(1,'#7a5cff');}
    else if(kind==='ranged'){g.addColorStop(0,'#28d7ff');g.addColorStop(1,'#fff17a');}
    else if(p>.5){g.addColorStop(0,'#38d874');g.addColorStop(1,'#18a653');}
    else if(p>.25){g.addColorStop(0,'#ffbd3b');g.addColorStop(1,'#ed7f20');}
    else {g.addColorStop(0,'#ff5f56');g.addColorStop(1,'#cf2f2f');}
    ctx.fillStyle=g;ctx.fillRect(x,y,w*p,h);ctx.strokeStyle='rgba(255,255,255,.45)';ctx.strokeRect(x+.5,y+.5,w-1,h-1);
  };
  const drawPlayer=(p,index,total)=>{
    const w=286,h=62,y=10,x= total>1 && index===1 ? 704 : 10;
    panel(x,y,w,h);
    ctx.textAlign='left';ctx.fillStyle=p.name==='João'?'#58b8ff':'#ff7878';ctx.font='bold 17px Righteous';ctx.fillText(`${p.name}  P${index+1}`,x+10,y+20);
    // Ícone 16-bit de vida no HUD + fallback em coração.
    const lifeSprite=window.powerUpSprites&&window.powerUpSprites.health;
    if(lifeSprite&&lifeSprite.complete&&lifeSprite.naturalWidth>0){ctx.imageSmoothingEnabled=false;ctx.drawImage(lifeSprite,x+w-78,y+4,18,18);}
    else {ctx.fillStyle='#ff6767';ctx.font='14px Arial';ctx.textAlign='left';ctx.fillText('♥',x+w-78,y+19);}
    ctx.fillStyle='#fff';ctx.font='12px Righteous';ctx.textAlign='right';ctx.fillText(`${Math.max(0,Math.ceil(p.life))}/${p.maxLife}`,x+w-10,y+20);
    bar(x+10,y+28,w-20,13,p.life/p.maxLife,'life');
    if(p.evolution){
      const lv=p.evolution.level||p.evolution.currentLevel||1, xp=p.evolution.xp||p.evolution.currentXP||0, need=p.evolution.xpToNextLevel||p.evolution.nextLevelXP||Math.max(1,xp);
      ctx.textAlign='left';ctx.fillStyle='rgba(255,255,255,.82)';ctx.font='10px Righteous';ctx.fillText(`NV ${lv}`,x+10,y+56);bar(x+48,y+49,94,6,need?xp/need:0,'xp');
    }
    if(p.combo>0){ctx.textAlign='right';ctx.fillStyle='#ffe76a';ctx.font='bold 14px Bebas Neue';ctx.fillText(`${p.combo}x COMBO`,x+w-10,y+57);}
    if(p.name==='João' && typeof p.rangedCooldown==='number'){
      const bx=x+w-126, by=y+49,bw=70;
      const charge=p.rangedCharging?clamp(p.rangedChargeFrames/(p.rangedMaxCharge||90)):clamp(1-p.rangedCooldown/72);
      bar(bx,by,bw,6,charge,'ranged');ctx.textAlign='right';ctx.fillStyle='#c8f7ff';ctx.font='9px Righteous';ctx.fillText(p.rangedCharging?'CARREGANDO':'TIRO',x+w-10,y+57);
    }
  };
  drawHUD = function(){
    ctx.save();
    const total=players.length; players.forEach((p,i)=>drawPlayer(p,i,total));
    const alive=enemies.filter(e=>!e.dead && e.life>0 && !e.isBossMinion);
    const stage=`FASE ${currentLevelIndex+1}/${LEVELS.length}`;
    let center=stage+`  •  ${alive.filter(e=>!e.isBoss).length} INIMIGOS`;
    if(waveSystem && !waveSystem.allWavesDone) center=`${stage}  •  ONDA ${Math.max(1,waveSystem.currentWave)}/${waveSystem.waves.length}  •  ${alive.filter(e=>!e.isBoss).length} INIMIGOS`;
    panel(330,10,340,36);ctx.textAlign='center';ctx.fillStyle='#fff';ctx.font='bold 15px Righteous';ctx.fillText(center,500,33);
    ctx.textAlign='center';ctx.fillStyle='#ffd76a';ctx.font='bold 13px Bebas Neue';ctx.fillText(`SCORE ${score}`,500,63);

    if(bossWarningTimer>0 && !bossSpawned){
      const pulse=.65+Math.sin(performance.now()/100)*.35; panel(280,86,440,48);ctx.globalAlpha=pulse;ctx.fillStyle='#ff4d42';ctx.font='bold 28px Bebas Neue';ctx.fillText('⚠ BOSS CHEGANDO ⚠',500,119);ctx.globalAlpha=1;
    }
    if(bossSpawned && !bossDefeated){
      const b=alive.find(e=>e.isBoss || e.type==='boss'||e.type==='final_boss'||e.name==='REI DE VEGAS');
      if(b){const w=540,x=230,y=594;panel(x-8,y-24,w+16,48);ctx.fillStyle='#ffd76a';ctx.font='bold 15px Bebas Neue';ctx.fillText(b.name||'BOSS',500,y-6);bar(x,y,w,16,b.life/b.maxLife,'life');}
    }
    if(window.trophySystem?.updateNotifications) window.trophySystem.updateNotifications();
    if(window.trophySystem?.drawNotifications) window.trophySystem.drawNotifications(ctx);
    ctx.restore();
  };
})();
