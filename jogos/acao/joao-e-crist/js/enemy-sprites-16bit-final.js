
/* João e Crist v0.9.3 16-bit — Cowboy/Berserker/Tank final renderer */
(() => {
  const BASE = 'assets/enemies/';

  const cfg = {
    cowboy: {
      file: 'cowboy-16bit.png',
      height: 92,
      frames: {
        idle:   [[14,14,108,177],[146,14,108,177],[269,14,103,177]],
        walk:   [[392,10,116,181],[530,10,121,185],[668,10,150,189]],
        run:    [[833,8,170,188],[1000,8,170,188],[1170,8,170,188],[1350,8,180,188]],
        attack: [[8,410,150,185],[165,410,155,185],[325,410,165,185],[490,410,180,185]],
        hurt:   [[6,615,150,180],[158,615,140,180],[298,615,138,180]],
        dead:   [[925,690,220,120],[1148,705,205,110],[1358,705,170,110]],
        dash:   [[12,835,240,155],[255,835,245,155],[505,835,245,155],[760,835,245,155]]
      }
    },
    berserker: {
      file: 'berserker-16bit.png',
      height: 108,
      frames: {
        idle:   [[23,20,114,148],[157,20,102,148],[276,20,106,148]],
        walk:   [[411,19,108,149],[546,19,112,148],[674,21,118,147]],
        run:    [[890,10,170,175],[1045,10,170,175],[1200,10,170,175],[1360,10,175,175]],
        attack: [[10,370,145,190],[160,370,150,190],[310,370,165,190],[475,370,175,190]],
        hurt:   [[18,630,140,170],[160,630,145,170],[305,630,145,170]],
        dead:   [[775,690,200,120],[985,690,175,120],[1165,705,175,110]],
        dash:   [[10,820,215,180],[225,820,230,180],[455,820,235,180],[690,820,235,180]]
      }
    },
    tank: {
      file: 'tank-16bit.png',
      height: 112,
      frames: {
        // Only clean, isolated body frames here. This avoids the old giant merged crops.
        idle:   [[28,14,119,170],[176,13,132,171],[309,13,124,171]],
        walk:   [[457,11,132,173],[594,13,126,171],[744,14,145,170]],
        run:    [[890,5,165,185],[1045,5,165,185],[1200,5,165,185],[1365,5,170,185]],
        attack: [[727,205,145,185],[870,205,145,185],[1010,205,160,185],[1170,205,175,185],[1350,205,180,185]],
        hurt:   [[6,605,145,190],[150,605,145,190],[295,605,145,190]],
        dead:   [[800,665,180,130],[990,665,180,130],[1180,665,180,130]],
        dash:   [[5,805,180,190],[190,805,220,190],[425,805,220,190],[650,805,220,190]]
      }
    }
  };

  const images = {};
  Object.entries(cfg).forEach(([key, c]) => {
    const img = new Image();
    img.src = BASE + c.file;
    images[key] = img;
  });

  function stateFor(e, key) {
    if (e.life <= 0 || e.dead) return 'dead';
    if ((e.hitFlash || 0) > 0) return 'hurt';

    if (key === 'berserker' && (e.isDashing || e.dashDuration > 0)) return 'dash';
    if (key === 'cowboy' && e.dodging) return 'dash';

    if (key === 'cowboy' && (e.aiming || e.gunFlash > 0 || e.attacking)) return 'attack';
    if (key === 'tank' && e.attacking) return 'attack';
    if (key === 'berserker' && (e.attacking || e.isGroundPounding || e.groundPounding)) return 'attack';

    const moving = Math.abs(e.__spr16dx || 0) > 0.05;
    if (moving) return Math.abs(e.__spr16dx) > 2.4 ? 'run' : 'walk';
    return 'idle';
  }

  function drawHealth(ctx, e, c, bottom) {
    if (!e.maxLife || e.life <= 0 || e.life >= e.maxLife) return;
    const w = Math.max(34, Math.min(58, e.w || 48));
    const x = e.x + (e.w || 48)/2 - w/2;
    const y = bottom - c.height - 10;
    const p = Math.max(0, Math.min(1, e.life / e.maxLife));
    ctx.fillStyle = 'rgba(0,0,0,.7)';
    ctx.fillRect(x-2,y-2,w+4,7);
    ctx.fillStyle = p > .55 ? '#59d65d' : p > .25 ? '#f1c34e' : '#e55245';
    ctx.fillRect(x,y,w*p,3);
  }

  function install(ClassRef, key) {
    if (!ClassRef || !ClassRef.prototype) return;

    const oldUpdate = ClassRef.prototype.update;
    ClassRef.prototype.update = function(...args) {
      const ox = this.x;
      const r = oldUpdate ? oldUpdate.apply(this, args) : undefined;
      this.__spr16dx = this.x - ox;
      if (Math.abs(this.__spr16dx) > 0.01) this.__spr16face = this.__spr16dx > 0 ? 1 : -1;
      return r;
    };

    ClassRef.prototype.draw = function(ctx) {
      const c = cfg[key], img = images[key];
      if (!img || !img.complete || !img.naturalWidth) return;

      const state = stateFor(this, key);
      const frames = c.frames[state] || c.frames.idle;
      const now = performance.now();

      // Relógio por inimigo e por estado. Evita que uma animação comece no meio
      // só porque performance.now() já estava avançado quando o inimigo entrou
      // em attack/dash/hurt. Isso deixa especialmente o Berserker bem mais estável.
      if (this.__spr16State !== state) {
        this.__spr16State = state;
        this.__spr16StateStart = now;
      }
      const stateAge = Math.max(0, now - (this.__spr16StateStart || now));
      let idx;

      if (state === 'dead') {
        idx = Math.min(frames.length - 1, Math.floor((this.deathAnim || 0) / 9));
      } else {
        const speed = state === 'attack' ? 70
                    : state === 'dash' ? 75
                    : state === 'hurt' ? 85
                    : state === 'run' ? 90
                    : state === 'walk' ? 135
                    : 220;
        idx = Math.floor(stateAge / speed) % frames.length;

        // Ataques devem percorrer a sequência uma vez, sem voltar ao primeiro
        // frame antes do estado terminar.
        if (state === 'attack') {
          idx = Math.min(frames.length - 1, Math.floor(stateAge / speed));
        }
      }

      const [sx,sy,sw,sh] = frames[idx];
      const baseH = c.height;
      let dh = state === 'dead' ? baseH * .72 : baseH;
      let dw = dh * (sw / sh);

      // Prevent effect-heavy frames from visually exploding in size.
      const maxW = key === 'tank' ? baseH * 1.55 : baseH * 1.65;
      if (dw > maxW) {
        dw = maxW;
        dh = dw / (sw/sh);
      }

      const cx = this.x + (this.w || 48)/2;
      // Visual follows actual Y if enemy ever jumps/gets displaced; otherwise remains foot-anchored.
      const staticGround = Number.isFinite(this.groundY) ? this.groundY : this.y + (this.h || 70);
      const displaced = Number.isFinite(this.groundY) && Math.abs((this.y + (this.h || 70)) - this.groundY) > 2;
      const bottom = displaced ? this.y + (this.h || 70) : staticGround;

      ctx.save();
      ctx.imageSmoothingEnabled = false;

      ctx.fillStyle = 'rgba(0,0,0,.28)';
      ctx.beginPath();
      ctx.ellipse(cx, staticGround + 2, Math.max(13,(this.w||48)*.38), 4, 0, 0, Math.PI*2);
      ctx.fill();

      let face = this.__spr16face;
      if (!face) face = this.facingRight === true ? 1 : -1;
      if (face < 0) {
        ctx.translate(cx,0);
        ctx.scale(-1,1);
        ctx.translate(-cx,0);
      }

      ctx.drawImage(img, sx,sy,sw,sh, cx-dw/2, bottom-dh, dw,dh);
      ctx.restore();

      drawHealth(ctx,this,c,bottom);
    };
  }

  // Explicit class overrides, loaded last so no generic renderer can steal them.
  install(typeof CowboyEnemy !== 'undefined' ? CowboyEnemy : null, 'cowboy');
  install(typeof BerserkerEnemy !== 'undefined' ? BerserkerEnemy : null, 'berserker');
  install(typeof TankEnemy !== 'undefined' ? TankEnemy : null, 'tank');
})();
