/* João & Crist v0.9.3 - sequência modular do ônibus / minigame Estrada para Vegas */
(function () {
    'use strict';

    const W = 1000, H = 650;
    const LANES = [335, 430, 525];
    const BUS_X = 245;
    const BUS_W = 220;
    const BUS_H = 94;
    const COURSE_DISTANCE = 100;
    const SPEEDRUN_TARGET = 72; // segundos; equilibrado para percurso nominal de ~75s

    const spritePaths = {
        idle: 'assets/bus/idle.png', moving: 'assets/bus/andando.png', accelerating: 'assets/bus/acelerando.png', braking: 'assets/bus/freando.png',
        turning: 'assets/bus/virando.png', collision: 'assets/bus/colisao.png', damaged: 'assets/bus/danificado.png', critical: 'assets/bus/muito-danificado.png',
        doorClosed: 'assets/bus/porta-fechada.png', doorOpening: 'assets/bus/porta-abrindo.png', doorOpen: 'assets/bus/porta-aberta.png', doorClosing: 'assets/bus/porta-fechando.png',
        leaving: 'assets/bus/saida.png', arriving: 'assets/bus/chegada.png'
    };
    const obstaclePaths = { cone:'assets/bus/obstacles/cone.png', pothole:'assets/bus/obstacles/pothole.png', rock:'assets/bus/obstacles/rock.png', car:'assets/bus/obstacles/car.png', moto:'assets/bus/obstacles/moto.png' };
    const itemPaths = { repair:'assets/bus/items/repair.png', money:'assets/bus/items/money.png', star:'assets/bus/items/star.png', turbo:'assets/bus/items/turbo.png' };

    function loadImages(map) {
        const result = {};
        Object.keys(map).forEach(key => {
            const img = new Image(); img.src = map[key]; result[key] = img;
        });
        return result;
    }

    class BusSequenceController {
        constructor() {
            this.sprites = loadImages(spritePaths);
            this.obstacleSprites = loadImages(obstaclePaths);
            this.itemSprites = loadImages(itemPaths);
            this.phase2Waiting = false;
            this.boarding = null;
            this.arrival = null;
            this.run = null;
            this.lastTime = performance.now();
            this.hornWasDown = false;
            this.errorMessage = null;
            this.bonusMode = false;
        }

        log(msg) {
            console.log(msg);
            if (window.GameDebugConsole) window.GameDebugConsole.log(msg);
        }

        reportError(err) {
            const stack = err && (err.stack || err.message) ? (err.stack || err.message) : String(err);
            const match = stack.match(/([^/\\\s]+\.js):(\d+):(\d+)/);
            const where = match ? `${match[1]}:${match[2]}:${match[3]}` : 'js/bus-sequence.js';
            this.errorMessage = { title:'ERRO NO MINIGAME DO ÔNIBUS', where, stack };
            if (window.GameDebugConsole) window.GameDebugConsole.error(`ERRO NO MINIGAME DO ÔNIBUS | ${where}\n${stack}`);
            console.error('[BUS] ERRO NO MINIGAME DO ÔNIBUS', err);
        }

        isPhase2Waiting() { return this.phase2Waiting; }

        preparePhase2Exit(level, players) {
            if (this.phase2Waiting || this.boarding || this.run) return;
            this.phase2Waiting = true;
            this.boardingPoint = Math.max(650, (level?.width || 5000) - 390);
            this.busWorldX = Math.max(700, (level?.width || 5000) - 320);
            this.log('[BUS] Ônibus disponível para embarque no final da Fase 2');
            players.forEach(p => { if (p) p._busReady = false; });
        }

        updatePhase2Waiting(players) {
            if (!this.phase2Waiting) return false;
            const alive = (players || []).filter(p => p && p.life > 0);
            if (!alive.length) return false;
            alive.forEach(p => { p._busReady = (p.x + (p.w || 0) * .5) >= this.boardingPoint; });
            if (alive.every(p => p._busReady)) {
                this.phase2Waiting = false;
                this.startBoarding(alive);
                return true;
            }
            return false;
        }

        drawBusFacingRight(ctx, sprite, x, y, w=BUS_W, h=BUS_H) {
            if (!sprite?.complete || !sprite.naturalWidth) return;
            ctx.save();
            ctx.translate(x + w, y);
            ctx.scale(-1, 1);
            ctx.drawImage(sprite, 0, 0, w, h);
            ctx.restore();
        }

        drawPhase2Bus(ctx) {
            if (!this.phase2Waiting) return;
            const img = this.sprites.idle;
            this.drawBusFacingRight(ctx, img, this.busWorldX - BUS_W, 454);
            ctx.save();
            ctx.fillStyle = 'rgba(0,0,0,.72)'; ctx.fillRect(this.busWorldX - 285, 400, 260, 38);
            ctx.strokeStyle = '#ffd66b'; ctx.strokeRect(this.busWorldX - 285, 400, 260, 38);
            ctx.fillStyle = '#fff5d6'; ctx.font = 'bold 17px Righteous'; ctx.textAlign='center';
            ctx.fillText('VÁ ATÉ O ÔNIBUS', this.busWorldX - 155, 425);
            ctx.restore();
        }

        startBoarding(players) {
            this.boarding = { start:performance.now(), duration:6200, players:players.map((p,i)=>({p, startX:p.x, startY:p.y, index:i})) };
            this.log('[BUS] Cutscene de embarque iniciada');
        }

        getBoardingCameraX(level) {
            const bx = this.busWorldX || ((level?.width || 5000) - 320);
            return Math.max(0, Math.min((level?.width || 5000)-W, bx - 700));
        }

        updateDrawBoarding(ctx, level, players) {
            try {
                const b = this.boarding;
                if (!b) return 'MINIGAME';
                const elapsed = performance.now() - b.start;
                const t = Math.min(1, elapsed / b.duration);
                const cam = this.getBoardingCameraX(level);
                ctx.save(); ctx.translate(-cam,0);
                level?.drawBackground?.(ctx, cam);
                const bx = this.busWorldX || ((level?.width || 5000)-320);
                let sprite = this.sprites.doorClosed;
                if (t < .16) sprite=this.sprites.idle;
                else if (t < .28) sprite=this.sprites.doorOpening;
                else if (t < .62) sprite=this.sprites.doorOpen;
                else if (t < .73) sprite=this.sprites.doorClosing;
                else sprite=this.sprites.leaving;
                let busX = bx - BUS_W;
                if (t > .74) busX += (t-.74)/.26 * 600;
                this.drawBusFacingRight(ctx, sprite, busX, 454);

                b.players.forEach((entry, i) => {
                    const p = entry.p; const enterStart=.26+i*.07, enterEnd=.57+i*.07;
                    if (t < enterStart) { p.draw?.(ctx); return; }
                    if (t <= enterEnd) {
                        const q=Math.min(1,(t-enterStart)/(enterEnd-enterStart));
                        p.x=entry.startX+(bx-115-entry.startX)*q; p.y=entry.startY+(482-entry.startY)*q;
                        p.draw?.(ctx);
                    }
                });
                if (t > .76) this.drawDust(ctx, busX+42, 535, 3);
                ctx.restore();
                this.drawFade(ctx, t > .88 ? (t-.88)/.12 : 0);
                if (t >= 1) { this.boarding=null; this.startMinigame(false); return 'MINIGAME'; }
                return null;
            } catch (e) { this.reportError(e); return 'ERROR'; }
        }

        startMinigame(bonusMode=false, checkpoint=null) {
            this.bonusMode=!!bonusMode;
            const progress = checkpoint ? checkpoint.progress : 0;
            const elapsed = checkpoint ? checkpoint.elapsed : 0;
            this.run = {
                progress, elapsed, resistance:100, lane:1, targetLane:1, y:LANES[1], speed:1, score:0,
                obstacles:[], items:[], spawnTimer:.6, itemTimer:6, hornCooldown:0, hornText:0,
                invincible:0, turbo:0, collisionFlash:0, collisions:0, checkpointReached:!!checkpoint,
                checkpoint: checkpoint || null, state:'running', stateTimer:0, distanceLabel:'12 km', shake:0,
                roadsideSeed:Math.random()*10000, safeLane:1, safeLaneWaves:0, nextSafeLane:null, safeLaneTransition:0
            };
            this.lastTime=performance.now(); this.hornWasDown=false; this.errorMessage=null;
            this.log('[BUS] Minigame iniciado');
        }

        input(keys, gamepadSystem, controls) {
            const pad=gamepadSystem?.getPadForPlayer?.(1);
            const ax=pad?.axes?.[0]||0, ay=pad?.axes?.[1]||0;
            const cfg=controls?.obterControles?.(1)||{};
            const downKey = !!keys.ArrowDown || !!keys.s;
            const upKey = !!keys.ArrowUp || !!keys.w;
            const leftKey = !!keys.ArrowLeft || !!keys.a;
            const rightKey = !!keys.ArrowRight || !!keys.d;
            const attackKey = cfg.attack ? !!keys[cfg.attack] : !!keys[' '];
            return {
                up: upKey || ay < -.45,
                down: downKey || ay > .45,
                left: leftKey || ax < -.45,
                right: rightKey || ax > .45,
                horn: attackKey || !!gamepadSystem?.isActionDown?.(1,'attack')
            };
        }

        updateDrawMinigame(ctx, keys, gamepadSystem, controls) {
            try {
                if (this.errorMessage) { this.drawError(ctx); return 'ERROR'; }
                if (!this.run) this.startMinigame(this.bonusMode);
                const now=performance.now(), dt=Math.min(.034,Math.max(.001,(now-this.lastTime)/1000)); this.lastTime=now;
                const r=this.run;
                if (r.state==='broken') { this.updateBroken(ctx,dt); return null; }
                if (r.state==='finish') { this.updateFinish(ctx,dt); return r.stateTimer>2.8 ? (this.bonusMode?'BONUS_DONE':'ARRIVAL') : null; }
                const inp=this.input(keys,gamepadSystem,controls);

                if (inp.up && !r._upLatch) { r.targetLane=Math.max(0,r.targetLane-1); r._upLatch=true; }
                if (!inp.up) r._upLatch=false;
                if (inp.down && !r._downLatch) { r.targetLane=Math.min(2,r.targetLane+1); r._downLatch=true; }
                if (!inp.down) r._downLatch=false;
                r.y += (LANES[r.targetLane]-r.y)*Math.min(1,dt*8);

                const targetSpeed = inp.left ? .58 : inp.right ? 1.35 : 1.0;
                r.speed += (targetSpeed-r.speed)*Math.min(1,dt*2.8);
                if (r.turbo>0) { r.turbo-=dt; r.speed=Math.max(r.speed,1.55); }
                if (r.invincible>0) r.invincible-=dt;
                if (r.hornCooldown>0) r.hornCooldown-=dt;
                if (r.hornText>0) r.hornText-=dt;
                if (r.collisionFlash>0) r.collisionFlash-=dt;
                if (r.shake>0) r.shake=Math.max(0,r.shake-dt*12);

                if (inp.horn && !this.hornWasDown && r.hornCooldown<=0) this.honk();
                this.hornWasDown=inp.horn;

                r.elapsed += dt;
                r.progress += dt * (COURSE_DISTANCE/78) * r.speed;
                const difficulty=.85+Math.min(1.25,r.progress/100*1.25);
                r.spawnTimer-=dt;
                if(r.spawnTimer<=0){ this.spawnSafePattern(difficulty); r.spawnTimer=Math.max(.62,1.35-difficulty*.22)+Math.random()*.35; }
                r.itemTimer-=dt; if(r.itemTimer<=0){this.spawnItem();r.itemTimer=7+Math.random()*5;}
                this.updateObjects(dt);
                if(!r.checkpointReached && r.progress>=50){r.checkpointReached=true;r.checkpoint={progress:50,elapsed:r.elapsed};this.log('[BUS] Checkpoint alcançado');}
                if(r.progress>=COURSE_DISTANCE){r.progress=COURSE_DISTANCE;r.state='finish';r.stateTimer=0;this.completeRun();}

                this.drawRoadScene(ctx,r);
                return null;
            } catch(e){ this.reportError(e); this.drawError(ctx); return 'ERROR'; }
        }

        spawnSafePattern(difficulty) {
            const r=this.run;
            // Reserva uma rota segura por várias ondas. Ao trocar de rota, duas
            // faixas ficam livres por duas ondas para dar tempo real de mudança.
            if (r.safeLane == null) { r.safeLane=r.targetLane; r.safeLaneWaves=0; }
            r.safeLaneWaves++;
            if (r.safeLaneWaves>=4 && r.safeLaneTransition<=0 && Math.random()<.42) {
                const candidates=[0,1,2].filter(l=>l!==r.safeLane);
                r.nextSafeLane=candidates[Math.floor(Math.random()*candidates.length)];
                r.safeLaneTransition=2;
                r.safeLaneWaves=0;
            }
            const protectedLanes=[r.safeLane];
            if(r.safeLaneTransition>0 && r.nextSafeLane!=null){
                protectedLanes.push(r.nextSafeLane);
                r.safeLaneTransition--;
                if(r.safeLaneTransition===0){r.safeLane=r.nextSafeLane;r.nextSafeLane=null;}
            }
            const available=[0,1,2].filter(l=>!protectedLanes.includes(l));
            const maxBlocked=Math.min(available.length,difficulty<1.05?1:2);
            const blockedCount=maxBlocked<=1?maxBlocked:(Math.random()<.62?1:2);
            const lanes=available.sort(()=>Math.random()-.5).slice(0,blockedCount);
            lanes.forEach((lane,idx)=>{
                const roll=Math.random(); let type='cone';
                if(roll<.18)type='pothole';else if(roll<.35)type='rock';else if(roll<.68)type='car';else if(roll<.86)type='moto';
                r.obstacles.push({type,lane,x:1060+idx*62,y:LANES[lane],w:type==='car'?58:48,h:type==='car'?58:48,hit:false,drift:type==='moto'?(Math.random()-.5)*8:0});
            });
        }

        ensureSafeRoute(){
            const r=this.run;if(!r)return;
            // Defesa adicional: na zona de decisão à frente do ônibus nunca
            // permite três faixas simultaneamente ocupadas.
            const danger=r.obstacles.filter(o=>!o.hit&&!o.removed&&o.x>BUS_X+70&&o.x<BUS_X+430);
            const occupied=new Set(danger.map(o=>o.lane));
            if(occupied.size<3)return;
            const preferred=[r.targetLane,r.lane,r.safeLane,1,0,2].find(l=>l!=null&&occupied.has(l));
            const candidates=danger.filter(o=>o.lane===preferred).sort((a,b)=>a.x-b.x);
            if(candidates[0]){candidates[0].removed=true;this.log('[BUS] Rota segura corrigida automaticamente');}
        }

        spawnItem(){const r=this.run;const types=['repair','money','money','star','turbo'];const type=types[Math.floor(Math.random()*types.length)];const lane=Math.floor(Math.random()*3);r.items.push({type,lane,x:1100,y:LANES[lane],w:42,h:42,collected:false});}

        updateObjects(dt){
            const r=this.run; const worldSpeed=310*r.speed;
            r.obstacles.forEach(o=>{o.x-=worldSpeed*dt; if(o.type==='moto')o.y+=Math.sin(r.elapsed*3+o.x*.01)*o.drift*dt;});
            this.ensureSafeRoute();
            r.items.forEach(i=>i.x-=worldSpeed*dt);
            const busBox={x:BUS_X+25,y:r.y-BUS_H/2+25,w:142,h:55};
            r.obstacles.forEach(o=>{if(o.hit)return; const box={x:o.x,y:o.y-o.h/2,w:o.w,h:o.h};if(this.rects(busBox,box)){o.hit=true;this.collide(o.type);}});
            r.items.forEach(i=>{if(i.collected)return;const box={x:i.x,y:i.y-i.h/2,w:i.w,h:i.h};if(this.rects(busBox,box)){i.collected=true;this.collect(i.type);}});
            r.obstacles=r.obstacles.filter(o=>o.x>-100&&!o.removed); r.items=r.items.filter(i=>i.x>-80&&!i.collected);
        }

        collide(type){
            const r=this.run;if(r.invincible>0)return;
            const damage={cone:2,pothole:5,rock:10,car:15,moto:10}[type]||5;
            r.resistance=Math.max(0,r.resistance-damage);r.collisions++;r.speed=Math.max(.45,r.speed*.62);r.collisionFlash=.32;r.shake=7;
            this.log(`[BUS] Colisão: ${type} -${damage}`);
            window.gamepadSystem?.rumble?.(1,130,.48,.28);
            if(r.resistance<=0){r.state='broken';r.stateTimer=0;}
        }

        collect(type){const r=this.run;if(type==='repair')r.resistance=Math.min(100,r.resistance+20);else if(type==='money')r.score+=250;else if(type==='star')r.invincible=5;else if(type==='turbo')r.turbo=4;}

        honk(){
            const r=this.run;r.hornCooldown=2;r.hornText=.8;let affected=0;
            r.obstacles.forEach(o=>{if(o.x>BUS_X+120&&o.x<BUS_X+430&&(o.type==='cone'||o.type==='moto'||o.type==='car')){if(o.type==='cone'||o.type==='moto')o.removed=true;else{o.lane=(o.lane+1)%3;o.y=LANES[o.lane];}affected++;}});
            r.score+=affected*100;
        }

        updateBroken(ctx,dt){const r=this.run;r.stateTimer+=dt;this.drawRoadScene(ctx,r);ctx.save();ctx.fillStyle='rgba(0,0,0,.62)';ctx.fillRect(0,0,W,H);ctx.fillStyle='#ffdb6f';ctx.font='bold 54px Bebas Neue';ctx.textAlign='center';ctx.fillText('ÔNIBUS QUEBROU!',500,300);ctx.fillStyle='#fff';ctx.font='20px Righteous';ctx.fillText(r.checkpointReached?'Reiniciando do checkpoint...':'Reiniciando o percurso...',500,342);ctx.restore();if(r.stateTimer>2.2){const cp=r.checkpointReached?r.checkpoint:null;this.startMinigame(this.bonusMode,cp);}}
        updateFinish(ctx,dt){const r=this.run;r.stateTimer+=dt;this.drawRoadScene(ctx,r,true);this.drawFade(ctx,Math.max(0,(r.stateTimer-1.7)/1.1));}

        completeRun(){
            const r=this.run;this.log('[BUS] Minigame concluído');
            const save=window.saveSystem; if(save?.recordBusResult) save.recordBusResult({time:r.elapsed,resistance:r.resistance,noCollision:r.collisions===0});
            if(window.trophySystem){
                const ts=window.trophySystem;ts.stats.busCompleted=Math.max(1,ts.stats.busCompleted||0);ts.stats.busBestResistance=Math.max(ts.stats.busBestResistance||0,r.resistance);ts.stats.busNoCollision=!!(ts.stats.busNoCollision||r.collisions===0);ts.stats.busBestTime=Math.min(Number.isFinite(ts.stats.busBestTime)?ts.stats.busBestTime:Infinity,r.elapsed);ts.checkTrophies();ts.saveProgress();
            }
            window.refreshMenuOptions?.();
        }

        startArrival(players){this.arrival={start:performance.now(),duration:6500,players:(players||[]).map((p,i)=>({p,index:i}))};this.log('[BUS] Iniciando Fase 3');}

        updateDrawArrival(ctx, level, players){
            try{
                if(!this.arrival)this.startArrival(players);const a=this.arrival;const t=Math.min(1,(performance.now()-a.start)/a.duration);
                level?.drawBackground?.(ctx,0);
                let bx=-BUS_W+Math.min(1,t/.28)*500; if(t>.72)bx=308+(t-.72)/.28*620;
                let spr=t<.24?this.sprites.arriving:t<.38?this.sprites.braking:t<.48?this.sprites.doorOpening:t<.67?this.sprites.doorOpen:t<.73?this.sprites.doorClosing:this.sprites.leaving;
                this.drawBusFacingRight(ctx, spr, bx, 454);
                a.players.forEach((entry,i)=>{const p=entry.p;const s=.49+i*.055,e=.64+i*.055;if(t<s)return;const q=Math.min(1,(t-s)/(e-s));p.x=365+i*60+q*70;p.y=455;p.draw?.(ctx);});
                if(t>.76)this.drawDust(ctx,bx+45,535,3);
                this.drawFade(ctx,t<.08?1-t/.08:0);
                if(t>=1){this.arrival=null;return 'DONE';}return null;
            }catch(e){this.reportError(e);this.drawError(ctx);return 'ERROR';}
        }

        drawRoadScene(ctx,r,finishing=false){
            const sx=r.shake?(Math.random()-.5)*r.shake:0, sy=r.shake?(Math.random()-.5)*r.shake*.5:0;ctx.save();ctx.translate(sx,sy);
            const grad=ctx.createLinearGradient(0,0,0,H);grad.addColorStop(0,'#4d78a8');grad.addColorStop(.48,'#e4aa61');grad.addColorStop(1,'#bb6f3d');ctx.fillStyle=grad;ctx.fillRect(-20,-20,W+40,H+40);
            // montanhas parallax
            const off1=(r.progress*8)%360;ctx.fillStyle='#9c684e';for(let x=-360;x<W+360;x+=360){ctx.beginPath();ctx.moveTo(x-off1,300);ctx.lineTo(x+130-off1,145);ctx.lineTo(x+280-off1,300);ctx.fill();}
            const off2=(r.progress*18)%260;ctx.fillStyle='#c88a55';for(let x=-260;x<W+260;x+=260){ctx.beginPath();ctx.moveTo(x-off2,320);ctx.lineTo(x+100-off2,220);ctx.lineTo(x+220-off2,320);ctx.fill();}
            ctx.fillStyle='#d99b56';ctx.fillRect(0,300,W,350);
            // road
            ctx.fillStyle='#393a3f';ctx.fillRect(0,305,W,285);ctx.fillStyle='#d6c5a2';ctx.fillRect(0,300,W,8);ctx.fillRect(0,590,W,8);
            const dashOff=(r.elapsed*280*r.speed)%110;ctx.fillStyle='#f5e9c7';for(const y of [382,477])for(let x=-110;x<W+110;x+=110)ctx.fillRect(x-dashOff,y,58,6);
            // roadside cacti/posts/Route 66
            const roadOff=(r.elapsed*120*r.speed)%220;for(let x=-220;x<W+220;x+=220){const px=x-roadOff;ctx.fillStyle='#356b3c';ctx.fillRect(px,255,9,43);ctx.fillRect(px-10,267,12,7);ctx.fillRect(px+7,275,12,7);ctx.fillStyle='#5c452f';ctx.fillRect(px+125,260,5,42);}
            this.drawRoadSign(ctx,840-roadOff*.3,230,r.progress>88?'LAS VEGAS':'ROUTE 66');
            // objects
            r.items.forEach(i=>{const img=this.itemSprites[i.type];if(img?.complete&&img.naturalWidth)ctx.drawImage(img,i.x,i.y-i.h/2,i.w,i.h);});
            r.obstacles.forEach(o=>{const img=this.obstacleSprites[o.type];if(img?.complete&&img.naturalWidth)ctx.drawImage(img,o.x,o.y-o.h/2,o.w,o.h);});
            // bus sprite
            let spr=this.sprites.moving;if(r.collisionFlash>0)spr=this.sprites.collision;else if(r.resistance<=30)spr=this.sprites.critical;else if(r.resistance<=60)spr=this.sprites.damaged;else if(r.turbo>0||r.speed>1.2)spr=this.sprites.accelerating;else if(r.speed<.75)spr=this.sprites.braking;else if(Math.abs(LANES[r.targetLane]-r.y)>4)spr=this.sprites.turning;
            ctx.save();ctx.translate(BUS_X + BUS_W,r.y-BUS_H/2);ctx.scale(-1,1);if(r.invincible>0&&Math.floor(r.elapsed*10)%2===0)ctx.globalAlpha=.55;if(spr?.complete&&spr.naturalWidth)ctx.drawImage(spr,0,0,BUS_W,BUS_H);ctx.restore();
            if(r.speed>1.18)this.drawDust(ctx,BUS_X+28,r.y+44,2);
            ctx.restore();
            this.drawBusHUD(ctx,r,finishing);
        }

        drawBusHUD(ctx,r,finishing){
            ctx.save();ctx.fillStyle='rgba(10,13,18,.82)';ctx.fillRect(18,16,964,82);ctx.strokeStyle='#e6c26b';ctx.lineWidth=2;ctx.strokeRect(18,16,964,82);
            ctx.fillStyle='#fff4d8';ctx.font='bold 22px Righteous';ctx.textAlign='left';ctx.fillText(`ÔNIBUS ❤️ ${Math.ceil(r.resistance)}`,36,48);
            ctx.fillStyle='#30252a';ctx.fillRect(36,60,260,15);ctx.fillStyle=r.resistance>50?'#65d86e':r.resistance>25?'#f0b34f':'#e35c54';ctx.fillRect(36,60,260*r.resistance/100,15);
            const remaining=Math.max(0,12*(1-r.progress/100));const label=r.progress>=99?'VEGAS!':remaining>8?'12 km':remaining>4?'8 km':remaining>1?'4 km':'1 km';
            ctx.textAlign='center';ctx.fillStyle='#ffda6a';ctx.font='bold 18px Righteous';ctx.fillText('DISTÂNCIA ATÉ VEGAS',515,43);ctx.fillStyle='#fff';ctx.font='bold 26px Bebas Neue';ctx.fillText(label,515,72);
            ctx.textAlign='right';ctx.fillStyle='#8fe7ff';ctx.font='16px Righteous';ctx.fillText(`PONTOS ${r.score}`,960,45);ctx.fillStyle=r.hornCooldown<=0?'#ffd66b':'#a59b89';ctx.fillText(r.hornCooldown<=0?'BUZINA PRONTA':`BUZINA ${r.hornCooldown.toFixed(1)}s`,960,72);
            if(r.hornText>0){ctx.textAlign='center';ctx.fillStyle='#fff36c';ctx.font='bold 34px Permanent Marker';ctx.fillText('BEEP! BEEP!',500,145);}
            if(r.checkpointReached){ctx.textAlign='left';ctx.fillStyle='#87e7a0';ctx.font='14px Righteous';ctx.fillText('CHECKPOINT ✓',36,92);}
            if(finishing){ctx.textAlign='center';ctx.fillStyle='#fff3b0';ctx.font='bold 50px Bebas Neue';ctx.fillText('VEGAS!',500,185);}
            ctx.restore();
        }

        drawRoadSign(ctx,x,y,text){ctx.save();ctx.fillStyle='#59422c';ctx.fillRect(x+38,y+48,8,75);ctx.fillStyle='#f3ead2';ctx.strokeStyle='#463a2d';ctx.lineWidth=4;ctx.fillRect(x,y,84,55);ctx.strokeRect(x,y,84,55);ctx.fillStyle='#332d27';ctx.font='bold 13px Righteous';ctx.textAlign='center';ctx.fillText(text,x+42,y+32);ctx.restore();}
        drawDust(ctx,x,y,count){ctx.save();for(let i=0;i<count;i++){ctx.globalAlpha=.28-i*.05;ctx.fillStyle='#d7b178';ctx.fillRect(x-i*10,y-i*2,7+i*2,4+i);}ctx.restore();}
        drawFade(ctx,a){if(a<=0)return;ctx.save();ctx.fillStyle=`rgba(0,0,0,${Math.max(0,Math.min(1,a))})`;ctx.fillRect(0,0,W,H);ctx.restore();}
        drawError(ctx){const e=this.errorMessage;if(!e)return;ctx.save();ctx.fillStyle='rgba(20,0,0,.94)';ctx.fillRect(0,0,W,H);ctx.fillStyle='#ff6f6f';ctx.font='bold 42px Bebas Neue';ctx.textAlign='center';ctx.fillText(e.title,500,240);ctx.fillStyle='#fff';ctx.font='18px Consolas';ctx.fillText(e.where,500,285);ctx.font='13px Consolas';ctx.fillText('O save existente foi preservado.',500,325);ctx.restore();}
        rects(a,b){return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;}
        getSpeedrunTarget(){return SPEEDRUN_TARGET;}
    }

    window.BusSequenceController = BusSequenceController;
    window.busSequence = new BusSequenceController();
})();
