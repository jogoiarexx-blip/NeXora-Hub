"use strict";

/* ============================================================
   UPDATE LOOP
============================================================ */
let lastT = performance.now();
function loop(now){
  const dt = Math.min(0.05, (now-lastT)/1000);
  lastT = now;
  if(G.running && !G.paused) update(dt);
  draw();
  requestAnimationFrame(loop);
}

function update(dt){
  G.time += dt;
  for(const t of G.trees) t.sway += dt;

  // weather
  maybeTriggerWeather(dt);
  const w = G.weather.type;
  const windActive = (w==='wind'||w==='storm');
  const rainActive = (w==='rain'||w==='storm');
  const coldActive = (w==='frio');
  const fogActive = (w==='fog');
  G.fog += ((fogActive?1:0) - G.fog)*Math.min(1,dt*1.5);

  // audio levels
  if(sfx.loops.fire) sfx.loops.fire.setLevel(G.fireIntensity/maxIntensity());
  if(sfx.loops.wind) sfx.loops.wind.setLevel(windActive?1:0);
  if(sfx.loops.rain) sfx.loops.rain.setLevel(rainActive?1:0);

  // multiplicadores que aumentam a dificuldade conforme a noite avança
  const nightP = Math.min(1, G.time/G.nightDuration);
  const campaignDifficulty = 1 + (G.campaignNight-1)*0.045;
  G.comboTimer=Math.max(0,G.comboTimer-dt); if(G.comboTimer<=0) G.combo=0;
  // Noite 10: grande tempestade final no último terço
  if(G.campaignNight===10 && nightP>0.58 && !G.boss && !G.bossDefeated){ spawnFinalBoss(); }
  G.dawn=Math.max(0,Math.min(1,(nightP-.88)/.12));
  const timeDecayMul = 1 + 0.4*Math.pow(nightP,3); // até +40% no fim da madrugada
  const remain = G.nightDuration - G.time;
  const lateWeatherMul = remain<=120 ? 1 + (1-remain/120)*0.9 : 1; // vento/chuva até +90% nos últimos 2min

  // decay
  let decay = 2.35 * decayMultiplier();
  if(rainActive) decay += 4.6 * rainResistMul() * shelterMul() * lateWeatherMul;
  if(windActive) decay += 1.5 * windResistMul() * shelterMul() * lateWeatherMul;
  if(coldActive) decay += 2.1 * shelterMul();
  if(w==='storm') decay += 1.1 * lateWeatherMul;
  decay *= timeDecayMul * campaignDifficulty;
  G.fireIntensity -= decay*dt;

  // combustível: madeira queimando gradualmente alimenta o fogo
  let fuelGain = 0;
  for(let i=G.burningLogs.length-1;i>=0;i--){
    const bl = G.burningLogs[i];
    fuelGain += bl.rate;
    bl.timeLeft -= dt;
    if(bl.timeLeft<=0) G.burningLogs.splice(i,1);
  }
  G.fireIntensity += fuelGain*dt;
  G.fireIntensity = Math.max(0, Math.min(maxIntensity(), G.fireIntensity));
  if(G.running){
    if(G.time>=30) G.minIntensityThisRun = Math.min(G.minIntensityThisRun, G.fireIntensity);
    G.fireIntegral += (G.fireIntensity/maxIntensity())*dt;
    G.fireSampleTime += dt;
  }

  // auto gravetos
  const ag = autoGravetosVal();
  if(ag>0){
    G.autoTimer -= dt;
    if(G.autoTimer<=0){
      G.autoTimer = Math.max(3, 9-ag*1.3);
      const gain = 5*woodValueMul();
      G.fireIntensity = Math.min(maxIntensity(), G.fireIntensity+gain);
      save.coins += 1;
    }
  }

  // animal: ataques frequentes e independentes do clima
  G.animalTimer -= dt;
  if(G.animalTimer<=0){
    G.animalTimer = Math.max(8, 18-G.campaignNight*0.7)+Math.random()*8;
    if(!G.animal) triggerAnimalRaid();
  }

  // tree spawn (cada árvore tem seu próprio temporizador, ~30% mais lento)
  const maxWoodOnGround = 8 + G.trees.length*2;
  for(const tree of G.trees){
    tree.spawnTimer -= dt;
    if(tree.spawnTimer<=0){
      tree.spawnTimer = (3.4+Math.random()*4.2) * spawnIntervalMul();
      if(G.woodPieces.filter(w=>!w.consumed).length < maxWoodOnGround) spawnWood(tree);
    }
  }

  // update wood pieces (falling animation)
  for(const wd of G.woodPieces){
    if(wd.dragging) continue;
    if(wd.falling){
      wd.scale = Math.min(1, wd.scale+dt*4);
      wd.vy += 480*dt;
      wd.x += (wd.tx-wd.x)*Math.min(1,dt*2.4);
      wd.y += wd.vy*dt;
      wd.rot += wd.rotSpeed*dt;
      if(wd.y >= wd.ty){
        wd.y = wd.ty; // nunca atravessa o chão
        if(Math.abs(wd.vy) > 55 && wd.bounces < 3){
          wd.vy = -wd.vy*0.4;
          wd.bounces++;
        } else {
          wd.falling=false; wd.landed=true; wd.x=wd.tx; wd.y=wd.ty; wd.vy=0;
        }
      }
    } else if(wd.landed){
      wd.bob += dt*2;
      if(wd.despawnTimer===null || wd.despawnTimer===undefined){
        wd.despawnTimer = 8+Math.random()*2;
      }
      wd.despawnTimer -= dt;
    }
    // wind blows unattached small wood
    if(windActive && wd.landed && !wd.dragging && wd.type==='graveto'){
      const blowChance = 0.15*windResistMul();
      if(Math.random()<blowChance*dt){
        const idx = G.woodPieces.indexOf(wd);
        if(idx>=0) G.woodPieces.splice(idx,1);
      }
    }
  }
  // remove madeira que expirou no chão
  for(let i=G.woodPieces.length-1;i>=0;i--){
    const wd = G.woodPieces[i];
    if(wd.landed && !wd.dragging && wd.despawnTimer!==undefined && wd.despawnTimer!==null && wd.despawnTimer<=0){
      G.woodPieces.splice(i,1);
    }
  }

  // animais/inimigos — comportamento muda conforme a campanha
  if(G.animal){
    const a = G.animal;
    const type=a.type||'raccoon';
    if(type==='raccoon' || type==='fox'){
      if(a.phase==='enter'){
        a.x += a.vx*dt;
        if(!a.target){
          let candidates = G.woodPieces.filter(w=>w.landed && !w.dragging);
          if(type==='fox') candidates.sort((x,y)=>((y.def.resin||y.type==='dourada')?1:0)-((x.def.resin||x.type==='dourada')?1:0));
          if(candidates.length) a.target = candidates[0] || candidates[Math.floor(Math.random()*candidates.length)]; else a.phase='leave';
        }
        if(a.target && Math.abs(a.x-a.target.x)<18){
          const idx = G.woodPieces.indexOf(a.target); if(idx>=0) G.woodPieces.splice(idx,1);
          a.phase='leave'; a.stolen=true; G.enemiesSurvived++;
          showEventBanner(type==='fox'?'🦊 A raposa roubou uma madeira!':'🦝 O guaxinim levou uma madeira!',1200);
        }
        if(a.x>W+40) a.phase='leave';
      } else if(a.phase==='leave'){
        a.x += a.vx*1.45*dt; if(a.x>W+60) G.animal=null;
      }
    } else {
      // lobo e javali atacam a fogueira em vez de roubar madeira
      if(a.phase==='enter'){
        a.x += a.vx*dt;
        const fear = G.fireIntensity/maxIntensity();
        if(type==='wolf' && fear>0.72 && a.x>W*0.55){ a.phase='leave'; G.enemiesSurvived++; showEventBanner('🔥 A chama alta espantou o lobo!',1100); }
        else if(a.x>=firePos.x-52){
          const hit = type==='boar' ? maxIntensity()*0.13 : maxIntensity()*0.085;
          G.fireIntensity=Math.max(0,G.fireIntensity-hit); G.dangerFlash=1;
          a.phase='leave'; a.hit=true;
          if(type==='boar'){
            // espalha até duas madeiras próximas
            let loose=G.woodPieces.filter(w=>w.landed&&!w.dragging).slice(0,2);
            for(const wd of loose){wd.x=Math.max(10,Math.min(W-10,wd.x+(Math.random()<.5?-1:1)*(35+Math.random()*55)));}
            showEventBanner('🐗 INVESTIDA! O javali derrubou a chama!',1500);
          } else showEventBanner('🐺 O lobo atingiu o acampamento!',1300);
          if(save.settings.vibe && navigator.vibrate) navigator.vibrate([45,35,70]);
        }
      } else if(a.phase==='leave'){
        a.x -= a.vx*1.3*dt; if(a.x<-70){G.enemiesSurvived++;G.animal=null;}
      }
    }
  }

  // boss da noite 10: aproxima, ameaça e investe periodicamente
  if(G.boss){
    const b=G.boss; b.alpha=Math.min(1,b.alpha+dt*0.7); b.timer-=dt;
    if(b.phase==='stalk'){
      b.x += (W*0.78-b.x)*Math.min(1,dt*0.65);
      if(b.timer<=0){ b.phase='charge'; b.timer=3.0; showEventBanner('⚡ A Besta vai atacar — alimente a fogueira!',1500); }
    } else if(b.phase==='charge'){
      b.x -= (95+G.campaignNight*3)*dt;
      if(b.charge>=1){ b.phase='retreat'; b.timer=3.5; b.charge=0; showEventBanner('🔥 A chama fez a Besta recuar!',1100); }
      else if(b.x<=firePos.x+64){
        G.fireIntensity=Math.max(0,G.fireIntensity-maxIntensity()*0.16); G.dangerFlash=1;
        b.phase='retreat'; b.timer=4.0; b.charge=0; showEventBanner('🐺⚡ GOLPE DA TEMPESTADE! -16% de chama',1600);
        if(save.settings.vibe && navigator.vibrate) navigator.vibrate([70,40,90]);
      }
    } else if(b.phase==='retreat'){
      b.x += 150*dt;
      if(b.timer<=0 || b.x>W+65){ b.x=W+65; b.phase='stalk'; b.timer=4.5+Math.random()*2.5; }
    } else if(b.phase==='defeated'){
      b.alpha=Math.max(0,b.alpha-dt*0.55); b.x+=100*dt;
      if(b.timer<=0) G.boss=null;
    }
  }
  G.dangerFlash=Math.max(0,G.dangerFlash-dt*2.8);

  // particles: embers rising from fire
  const intensityRatio = G.fireIntensity/maxIntensity();
  const q = graphicsQualityFactor();
  if(Math.random() < Math.min(1,(0.5+intensityRatio*1.5)*dt*60*q)){
    G.embers.push({ x:firePos.x+(Math.random()*30-15), y:firePos.y-10, vx:(Math.random()-0.5)*20, vy:-40-Math.random()*50*intensityRatio, life:1+Math.random(), age:0, size:1.5+Math.random()*2 });
  }
  // smoke increases when low intensity
  const smokeChance = 0.15 + (1-intensityRatio)*0.5;
  if(Math.random() < Math.min(1,smokeChance*dt*60*q)){
    G.smoke.push({ x:firePos.x+(Math.random()*16-8), y:firePos.y-30, vx:(Math.random()-0.5)*10 + (windActive?30*G.windDir:0), vy:-25-Math.random()*20, life:2.5+Math.random()*1.5, age:0, size:6+Math.random()*8 });
  }
  updateParticleArray(G.embers, dt);
  updateParticleArray(G.smoke, dt);
  updateParticleArray(G.sparks, dt);

  // rain drops
  if(rainActive){
    const rainRate = 180*lateWeatherMul*q;
    const dropCount = Math.floor(rainRate*dt) + (Math.random() < (rainRate*dt)%1 ? 1 : 0);
    for(let i=0;i<dropCount;i++){
      G.rain.push({ x:Math.random()*W, y:-10, vy:(500+Math.random()*200)*Math.min(1.6,lateWeatherMul), len:10+Math.random()*10 });
    }
  }
  for(let i=G.rain.length-1;i>=0;i--){
    const r=G.rain[i]; r.y += r.vy*dt;
    if(r.y>H) G.rain.splice(i,1);
  }
  // leaves during wind
  if(windActive && Math.random()<Math.min(1,6*dt*q) && G.trees.length){
    const t = G.trees[Math.floor(Math.random()*G.trees.length)];
    G.leaves.push({ x:t.x+Math.random()*20-10, y:t.y-90, vx:40+Math.random()*60, vy:20+Math.random()*20, rot:0, rotSpeed:(Math.random()-0.5)*4, life:4, age:0 });
  }
  for(let i=G.leaves.length-1;i>=0;i--){
    const lf=G.leaves[i]; lf.age+=dt;
    lf.x+=lf.vx*dt; lf.y+=lf.vy*dt + Math.sin(lf.age*4)*10*dt; lf.rot+=lf.rotSpeed*dt;
    if(lf.age>lf.life || lf.x>W+20) G.leaves.splice(i,1);
  }
  // lightning
  if(w==='storm'){
    G.lightning -= dt*3;
    if(G.lightning<=0 && Math.random()<0.6*dt) G.lightning = 1;
  } else { G.lightning = Math.max(0, G.lightning-dt*3); }

  // wind direction drift
  G.windDir = Math.sin(G.time*0.3);

  // update HUD
  updateHUD();

  // end conditions
  if(G.fireIntensity<=0){
    endGame(false);
  } else if(G.time>=G.nightDuration){
    if(G.campaignNight!==10 || G.bossDefeated) endGame(true);
    else { G.time=G.nightDuration-0.25; if(G.boss && G.boss.phase==='stalk') G.boss.timer=Math.min(G.boss.timer,1.5); }
  }
}

function updateParticleArray(arr, dt){
  for(let i=arr.length-1;i>=0;i--){
    const p = arr[i];
    p.age += dt;
    p.x += (p.vx||0)*dt;
    if(arr===G.sparks) p.vy += 200*dt;
    p.y += (p.vy||0)*dt;
    if(p.vy!==undefined && p.life!==undefined){}
    if(p.age>=p.life) arr.splice(i,1);
  }
}

function graphicsQualityFactor(){
  const pref = save.settings.quality || 'auto';
  if(pref==='eco') return 0.45;
  if(pref==='high') return 1.25;
  const mobile = matchMedia('(max-width: 759px)').matches;
  const cores = navigator.hardwareConcurrency || 4;
  return mobile || cores<=4 ? 0.65 : 1;
}

function updateHUD(){
  const pct = Math.max(0, Math.min(100, (G.fireIntensity/maxIntensity())*100));
  document.getElementById('fireBar').style.width = pct+'%';
  const bar = document.getElementById('fireBar');
  if(pct>55) bar.style.background = 'linear-gradient(90deg,#ff5b2e,#ffcf7a)';
  else if(pct>25) bar.style.background = 'linear-gradient(90deg,#e07b1f,#ffb85c)';
  else bar.style.background = 'linear-gradient(90deg,#8a2a1a,#c94b2a)';
  const remain = Math.max(0, G.nightDuration-G.time);
  document.getElementById('timeLeft').textContent = formatTime(remain);
  document.getElementById('woodBadge').textContent = G.woodPieces.filter(w=>!w.consumed).length;
  document.getElementById('coinBadge').textContent = save.coins;
  document.getElementById('campBadge').textContent = save.campLevel;
}

