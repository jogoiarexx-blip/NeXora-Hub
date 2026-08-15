// Hungry Shark V4.0 - camada de campanha, qualidade e feedback visual
const V4 = {
  quality: 'high',
  fpsEMA: 60,
  objectiveIndex: 0,
  objectives: [
    { text: 'Coma 15 peixes', key: 'fishEaten', target: 15 },
    { text: 'Faça combo x5', key: 'comboReached', target: 5 },
    { text: 'Derrote 3 inimigos', key: 'enemiesDefeated', target: 3 },
    { text: 'Alcance o nível 4', key: 'level', target: 4 }
  ],
  completed: new Set(),
  update(dt) {
    if (!dt || dt > .2) return;
    const fps = 1 / dt;
    this.fpsEMA = this.fpsEMA * .96 + fps * .04;
    if (CONFIG.GRAPHICS_QUALITY === 'auto') {
      if (this.fpsEMA < 38) this.quality = 'low';
      else if (this.fpsEMA < 52) this.quality = 'medium';
      else if (this.fpsEMA > 57) this.quality = 'high';
    } else this.quality = CONFIG.GRAPHICS_QUALITY;
    const o = this.objectives[this.objectiveIndex];
    if (!o) return;
    const value = o.key === 'level' ? level : (missionStats?.[o.key] || 0);
    if (value >= o.target && !this.completed.has(this.objectiveIndex)) {
      this.completed.add(this.objectiveIndex);
      coins += 25 + this.objectiveIndex * 15;
      createScorePopup(player.x, player.y - 55, `OBJETIVO! +${25 + this.objectiveIndex*15}💰`, 'gold');
      createParticles(player.x, player.y, '#facc15', 24);
      this.objectiveIndex++;
    }
  },
  draw(ctx) {
    if (gameState !== 'playing') return;
    const o = this.objectives[this.objectiveIndex];
    if (!o) return;
    const w = canvas.width / dpr, h = canvas.height / dpr;
    const value = o.key === 'level' ? level : (missionStats?.[o.key] || 0);
    const pct = Math.max(0, Math.min(1, value / o.target));
    const mobile = w < 760;
    const bw = Math.min(mobile ? 210 : 290, w - 24), bh = mobile ? 42 : 48;
    const x = w/2-bw/2, y = h - (mobile ? 132 : 70);
    ctx.save();
    ctx.fillStyle='rgba(1,15,28,.76)'; ctx.beginPath(); ctx.roundRect(x,y,bw,bh,12); ctx.fill();
    ctx.strokeStyle='rgba(125,211,252,.45)'; ctx.stroke();
    ctx.fillStyle='#e0f2fe'; ctx.font=`bold ${mobile?11:13}px Arial`; ctx.textAlign='center';
    ctx.fillText(`🎯 ${o.text}  ${Math.min(value,o.target)}/${o.target}`, w/2, y+17);
    ctx.fillStyle='rgba(255,255,255,.12)'; ctx.beginPath(); ctx.roundRect(x+12,y+27,bw-24,7,4); ctx.fill();
    ctx.fillStyle='#38bdf8'; ctx.beginPath(); ctx.roundRect(x+12,y+27,(bw-24)*pct,7,4); ctx.fill();
    ctx.restore();
  },
  resetRun() { this.objectiveIndex = 0; this.completed.clear(); }
};
