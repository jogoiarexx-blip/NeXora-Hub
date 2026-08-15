
// ===============================
// 🤖 IA DO AJUDANTE — v2.0
// ===============================
// Sistema completo de IA com estados, priorização,
// diagnose automática, reabastecimento e feedback visual.

const HELPER_STATES = {
  IDLE:      'idle',
  MOVING:    'moving',
  DIAGNOSING:'diagnosing',
  FIXING:    'fixing',
  RESTOCKING:'restocking',
  RESTING:   'resting',
};

function helperScoreCar(car) {
  if (!car || car.fixed) return -1;
  let score = 0;
  score += (1 - car.patience) * 100;
  if (car.diagnosed) score += 40;
  if (car.isVIP) score += 30;
  if (car.workProgress > 0) score += 25;
  if (car.vtype?.id === 'truck') score += 15;
  if (car.vtype?.id === 'luxury') score += 20;
  const prob = car.problem;
  const partNeeded = PART_TYPES.find(pt => pt.forProblems.includes(prob.name));
  const shopActive = upgradesList.find(u => u.id === 'shop1')?.bought;
  if (shopActive && partNeeded) {
    if ((partInventory[partNeeded.id] || 0) < car.needsParts) score -= 50;
  } else {
    if (parts < car.needsParts) score -= 50;
  }
  return score;
}

function helperNearTarget(h, tx2, ty2, radius) {
  return Math.hypot(tx2 - h.x, ty2 - h.y) < (radius || 25);
}

function helperMoveToward(h, tx2, ty2, speed) {
  const spd = speed || 2.2;
  const dx = tx2 - h.x, dy = ty2 - h.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 3) return true;
  h.x += (dx / dist) * spd;
  h.y += (dy / dist) * spd;
  if (dx > 0.5) h.dir = 'right';
  else if (dx < -0.5) h.dir = 'left';
  else if (dy > 0) h.dir = 'down';
  else h.dir = 'up';
  h.frameTimer++;
  if (h.frameTimer > 8) { h.frame = (h.frame + 1) % 4; h.frameTimer = 0; }
  return false;
}

function _helperPickBestTarget() {
  const candidates = cars.filter(function(c) { return !c.fixed && c.patience > 0.05; });
  if (!candidates.length) return null;
  var best = null, bestScore = -Infinity;
  candidates.forEach(function(c) {
    var s = helperScoreCar(c);
    if (s > bestScore) { bestScore = s; best = c; }
  });
  return bestScore > -20 ? best : null;
}

function updateHelperAI(h) {
  h.stateTimer = (h.stateTimer || 0) + 1;
  if (!h.state) h.state = HELPER_STATES.IDLE;

  if (h.state === HELPER_STATES.IDLE) {
    if (h.idlePause > 0) { h.idlePause--; return; }
    if (!h.patrolTarget || helperNearTarget(h, h.patrolTarget.x, h.patrolTarget.y, 18)) {
      var zones = [{x:200,y:500},{x:600,y:450},{x:900,y:500},{x:400,y:700},{x:800,y:680},{x:550,y:300}];
      h.patrolTarget = zones[Math.floor(Math.random() * zones.length)];
    }
    helperMoveToward(h, h.patrolTarget.x, h.patrolTarget.y, 1.4);
    if (h.stateTimer % 60 === 0) {
      var bestCar = _helperPickBestTarget();
      if (bestCar) {
        h.targetCar = bestCar;
        h.state = HELPER_STATES.MOVING;
        h.stateTimer = 0;
        h.speech = bestCar.diagnosed ? '🔧 Vou consertar!' : '🔍 Vou diagnosticar!';
        h.speechTimer = 80;
      } else if (parts < 6 && money >= 60) {
        h.state = HELPER_STATES.RESTOCKING;
        h.restockTarget = null;
        h.stateTimer = 0;
        h.speech = '📦 Vou buscar peças!';
        h.speechTimer = 80;
      }
    }

  } else if (h.state === HELPER_STATES.MOVING) {
    var car = h.targetCar;
    if (!car || car.fixed || car.patience <= 0) { h.state = HELPER_STATES.IDLE; h.targetCar = null; return; }
    var arrived = helperMoveToward(h, car.x + car.w/2 - 11, car.y + car.h/2, 2.5);
    if (arrived || helperNearTarget(h, car.x + car.w/2, car.y + car.h/2, 85)) {
      h.state = car.diagnosed ? HELPER_STATES.FIXING : HELPER_STATES.DIAGNOSING;
      h.stateTimer = 0;
    }
    if (h.stateTimer > 700) { h.state = HELPER_STATES.IDLE; h.targetCar = null; }

  } else if (h.state === HELPER_STATES.DIAGNOSING) {
    var car = h.targetCar;
    if (!car || car.fixed || car.patience <= 0) { h.state = HELPER_STATES.IDLE; h.targetCar = null; return; }
    h.frame = Math.floor(h.stateTimer / 8) % 4;
    if (h.stateTimer === 18) {
      SFX.diagnose();
      spawnFloatText(car.x + car.w/2, car.y - 8, '🤖🔍 ' + car.problem.emoji + ' ' + car.problem.name, '#60a5fa');
      h.speech = car.problem.emoji + ' ' + car.problem.name + '!';
      h.speechTimer = 100;
    }
    if (h.stateTimer % 10 === 0 && h.stateTimer < 60) {
      spawnParticles(car.x + car.w/2 + (Math.random()-0.5)*car.w, car.y + car.h/2, '#60a5fa', 2);
    }
    var _diagDur = Math.ceil(65 / (window._helperDiagSpeed||1));
    if (h.stateTimer >= _diagDur) {
      car.diagnosed = true;
      h.state = HELPER_STATES.FIXING;
      h.stateTimer = 0;
    }

  } else if (h.state === HELPER_STATES.FIXING) {
    var car = h.targetCar;
    if (!car || car.fixed || car.patience <= 0) { h.state = HELPER_STATES.IDLE; h.targetCar = null; return; }
    if (!car.diagnosed) { h.state = HELPER_STATES.DIAGNOSING; h.stateTimer = 0; return; }
    var prob = car.problem;
    var partNeeded = PART_TYPES.find(function(pt) { return pt.forProblems.includes(prob.name); });
    var shopActive = upgradesList.find(function(u) { return u.id === 'shop1'; });
    shopActive = shopActive && shopActive.bought;
    var hasEnoughParts = shopActive && partNeeded
      ? (partInventory[partNeeded.id] || 0) >= car.needsParts
      : parts >= car.needsParts;
    if (!hasEnoughParts) {
      h.speech = '📦 Sem peças! Vou buscar...';
      h.speechTimer = 80;
      h.state = HELPER_STATES.RESTOCKING;
      h.restockTarget = car;
      h.stateTimer = 0;
      return;
    }
    h.frame = Math.floor(h.stateTimer / 6) % 4;
    if (h.stateTimer % 10 === 0) {
      SFX.wrench();
      var wx = car.x + car.w/2 + (Math.random()-0.5)*30;
      var wy = car.y + car.h*0.8;
      spawnParticles(wx, wy, '#fbbf24', 3);
      car.workProgress += 5 * toolQuality * (window._helperSpeedMult||1);
      if (car.workProgress >= car.maxWork) {
        h.speech = '✅ Consertado!';
        h.speechTimer = 100;
        spawnFloatText(car.x + car.w/2, car.y - 20, '🤖 ✅ Concluído!', '#34d399');
        completeFix(car, car.bay);
        h.state = HELPER_STATES.IDLE;
        h.targetCar = null;
        h.stateTimer = 0;
        h.idlePause = 60;
      }
    }
    if (h.stateTimer > 2000) { h.state = HELPER_STATES.IDLE; h.targetCar = null; }

  } else if (h.state === HELPER_STATES.RESTOCKING) {
    var arrived = helperMoveToward(h, shelf.x + shelf.w/2, shelf.y + shelf.h/2, 2.3);
    if (arrived || helperNearTarget(h, shelf.x + shelf.w/2, shelf.y + shelf.h/2, 75)) {
      if (parts < maxParts) {
        var cost = 30 * (maxParts - parts);
        if (money >= cost) {
          money -= cost; parts = maxParts;
          SFX.restock();
          showToast('🤖 Ajudante reabasteceu as peças! 📦');
          spawnFloatText(shelf.x + shelf.w/2, shelf.y - 10, '🤖 Reabastecido!', '#60a5fa');
          updateHUD();
        } else {
          var partial = Math.floor(money / 30);
          if (partial > 0) { money -= partial*30; parts = Math.min(parts + partial, maxParts); SFX.restock(); updateHUD(); }
          h.speech = '💸 Sem grana pra mais!'; h.speechTimer = 80;
        }
      }
      if (h.restockTarget && !h.restockTarget.fixed) {
        h.targetCar = h.restockTarget;
        h.state = HELPER_STATES.FIXING;
      } else {
        h.state = HELPER_STATES.IDLE;
      }
      h.restockTarget = null; h.stateTimer = 0;
    }
    if (h.stateTimer > 900) { h.state = HELPER_STATES.IDLE; }

  } else if (h.state === HELPER_STATES.RESTING) {
    helperMoveToward(h, bench.x + bench.w/2, bench.y - 25, 1.5);
    if (h.stateTimer > 200) { h.state = HELPER_STATES.IDLE; h.stateTimer = 0; }
  }
}

function drawHelperSpeech(h) {
  if (!h.speech || !h.speechTimer || h.speechTimer <= 0) return;
  var alpha = Math.min(1, h.speechTimer / 25);
  var bw = Math.max(90, h.speech.length * 7.5);
  var bh = 22;
  var bxc = tx(h.x + h.w/2) - bw/2;
  var byc = ty(h.y) - 48;
  ctx.save(); ctx.globalAlpha = alpha;
  ctx.fillStyle = 'rgba(15,40,100,0.93)';
  ctx.beginPath(); ctx.roundRect(bxc, byc, bw, bh, 5); ctx.fill();
  ctx.strokeStyle = 'rgba(96,165,250,0.85)'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.roundRect(bxc, byc, bw, bh, 5); ctx.stroke();
  ctx.fillStyle = 'rgba(15,40,100,0.93)';
  ctx.beginPath();
  ctx.moveTo(tx(h.x + h.w/2) - 5, byc + bh);
  ctx.lineTo(tx(h.x + h.w/2) + 5, byc + bh);
  ctx.lineTo(tx(h.x + h.w/2), byc + bh + 8);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#93c5fd'; ctx.font = '11px VT323'; ctx.textAlign = 'center';
  ctx.fillText(h.speech, bxc + bw/2, byc + 15);
  ctx.restore();
  h.speechTimer--;
}

function drawHelperStateIcon(h) {
  var icons = {};
  icons[HELPER_STATES.MOVING] = '🏃';
  icons[HELPER_STATES.DIAGNOSING] = '🔍';
  icons[HELPER_STATES.FIXING] = '🔧';
  icons[HELPER_STATES.RESTOCKING] = '📦';
  icons[HELPER_STATES.RESTING] = '😴';
  var icon = icons[h.state];
  if (!icon) return;
  var pulse = 0.65 + 0.35 * Math.sin(tick * 0.16);
  ctx.save(); ctx.globalAlpha = pulse;
  ctx.font = '13px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText(icon, tx(h.x + h.w/2), ty(h.y - 14));
  ctx.restore();
}
