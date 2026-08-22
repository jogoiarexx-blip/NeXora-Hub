/* João e Crist v0.9.3 — inimigos exclusivos de Vegas / Fases 5 e 6 */
(() => {
  const fallbackEnemyDraw = (typeof Enemy !== 'undefined' && Enemy.prototype.draw) ? Enemy.prototype.draw : null;
  const CONFIG = {
    turista: {
      cls: 'TuristaEnemy', name: 'Turista de Vegas', file: 'turista-16bit.png',
      life: 65, speed: 2.25, damage: 10, score: 180, w: 48, h: 72, visualH: 92
    },
    seguranca: {
      cls: 'SegurancaEnemy', name: 'Segurança do Cassino', file: 'seguranca-16bit.png',
      life: 115, speed: 2.35, damage: 17, score: 260, w: 52, h: 76, visualH: 98
    },
    elvis_fan: {
      cls: 'ElvisFanEnemy', name: 'Fã do Elvis', file: 'elvis-fan-16bit.png',
      life: 80, speed: 3.25, damage: 13, score: 230, w: 48, h: 72, visualH: 94, glow: '#7d54ff'
    },
    mulher_feia: {
      cls: 'MulherFeiaEnemy', name: 'Brigona de Vegas', file: 'mulher-feia-16bit.png',
      life: 145, speed: 1.75, damage: 21, score: 300, w: 62, h: 84, visualH: 108
    },
    travesti: {
      cls: 'TravestiEnemy', name: 'Diva de Vegas', file: 'travesti-16bit.png',
      life: 90, speed: 2.75, damage: 15, score: 250, w: 50, h: 78, visualH: 104, glow: '#ff3fbe'
    }
  };

  const images = {};
  Object.entries(CONFIG).forEach(([type,c]) => {
    const img = new Image();
    img.onerror = () => console.warn('[sprite-vegas] Falha ao carregar:', c.file);
    img.src = 'assets/enemies/' + c.file;
    images[type] = img;
  });

  function applyStats(e, type) {
    const c = CONFIG[type];
    e.type = type;
    e.name = c.name;
    e.life = e.maxLife = c.life;
    e.speed = c.speed;
    e.damage = c.damage;
    e.score = c.score;
    e.w = c.w;
    e.h = c.h;
    e.y = e.groundY - e.h;
    e.hitbox = { offsetX: 8, offsetY: 14, width: Math.max(22, e.w - 16), height: Math.floor(e.h * .72) };
  }

  class VegasEnemy extends Enemy {
    constructor(x, y, type) {
      super(x, y, 'basic');
      applyStats(this, type);
      this.__vegasType = type;
      this.__vegasFace = -1;
      this.__vegasMove = 0;
      this.__vegasAnimStart = performance.now();
      this.__vegasLastState = 'idle';
    }

    update(players, otherEnemies = []) {
      const oldX = this.x;
      const result = super.update(players, otherEnemies);
      this.__vegasMove = this.x - oldX;
      if (Math.abs(this.__vegasMove) > .02) this.__vegasFace = this.__vegasMove > 0 ? 1 : -1;
      return result;
    }

    draw(ctx) {
      const c = CONFIG[this.__vegasType];
      const img = images[this.__vegasType];
      if (!c || !img || !img.complete || !img.naturalWidth) {
        // Nunca deixa o inimigo invisível enquanto o sprite carrega ou se houver erro de asset.
        if (fallbackEnemyDraw) fallbackEnemyDraw.call(this, ctx);
        return;
      }

      let state = 'idle';
      if (this.life <= 0 || this.dead) state = 'dead';
      else if ((this.hitFlash || 0) > 0) state = 'hurt';
      else if (this.attacking || (this.attackTimer || 0) > 0) state = 'attack';
      else if (Math.abs(this.__vegasMove || 0) > .04) state = 'walk';

      const now = performance.now();
      if (state !== this.__vegasLastState) {
        this.__vegasLastState = state;
        this.__vegasAnimStart = now;
      }
      const age = now - this.__vegasAnimStart;
      let frame = 0;
      if (state === 'walk') frame = 1 + (Math.floor(age / 150) % 2);
      else if (state === 'attack') frame = 3;
      else if (state === 'hurt') frame = 4;
      else if (state === 'dead') frame = 5;

      const cell = 240;
      const sx = frame * cell;
      const visualH = state === 'dead' ? c.visualH * .64 : c.visualH;
      const visualW = visualH;
      const cx = this.x + this.w / 2;
      const bottom = Number.isFinite(this.groundY) ? this.groundY : this.y + this.h;

      ctx.save();
      ctx.imageSmoothingEnabled = false;
      if (c.glow && this.life > 0) {
        ctx.shadowBlur = 8;
        ctx.shadowColor = c.glow;
      }
      ctx.fillStyle = 'rgba(0,0,0,.28)';
      ctx.beginPath();
      ctx.ellipse(cx, bottom + 2, Math.max(13, this.w * .38), 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      if ((this.__vegasFace || -1) < 0) {
        ctx.translate(cx, 0);
        ctx.scale(-1, 1);
        ctx.translate(-cx, 0);
      }
      ctx.drawImage(img, sx, 0, cell, cell, cx - visualW/2, bottom - visualH, visualW, visualH);
      ctx.restore();

      if (this.life > 0 && this.life < this.maxLife) {
        const bw = 48, p = Math.max(0, Math.min(1, this.life / this.maxLife));
        ctx.fillStyle = 'rgba(0,0,0,.7)';
        ctx.fillRect(cx-bw/2-2, bottom-c.visualH-10, bw+4, 7);
        ctx.fillStyle = p > .5 ? '#55d85a' : p > .25 ? '#f1c34e' : '#e55245';
        ctx.fillRect(cx-bw/2, bottom-c.visualH-8, bw*p, 3);
      }
    }
  }

  window.TuristaEnemy = class TuristaEnemy extends VegasEnemy { constructor(x,y){ super(x,y,'turista'); } };
  window.SegurancaEnemy = class SegurancaEnemy extends VegasEnemy { constructor(x,y){ super(x,y,'seguranca'); } };
  window.ElvisFanEnemy = class ElvisFanEnemy extends VegasEnemy { constructor(x,y){ super(x,y,'elvis_fan'); } };
  window.MulherFeiaEnemy = class MulherFeiaEnemy extends VegasEnemy { constructor(x,y){ super(x,y,'mulher_feia'); } };
  window.TravestiEnemy = class TravestiEnemy extends VegasEnemy { constructor(x,y){ super(x,y,'travesti'); } };
})();
