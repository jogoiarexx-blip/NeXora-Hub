// Estrada arcade: cenário variado, objetos laterais e clima dinâmico.
class Estrada {
  constructor(canvas) {
    this.canvas = canvas;
    this.offsetTraco = 0;
    this.objetos = [];
    this.recalcular();
    this.criarCenario();
  }

  recalcular() {
    this.larguraAcostamento = this.canvas.width * 0.075;
    this.larguraPista = (this.canvas.width - this.larguraAcostamento * 2) / CONFIG.NUM_PISTAS;
    if (!this.objetos) this.objetos = [];
  }

  xDaPista(indicePista) {
    return this.larguraAcostamento + this.larguraPista * indicePista + this.larguraPista / 2;
  }

  criarCenario() {
    this.objetos = [];
    const tipos = ['arvore','arvore','placa','poste','arbusto','arvore'];
    for (let i = 0; i < 18; i++) {
      this.objetos.push({
        tipo: tipos[Math.floor(Math.random()*tipos.length)],
        side: i % 2 ? 1 : -1,
        y: i * 72 - 120,
        variante: Math.floor(Math.random()*3),
        escala: 0.65 + Math.random()*0.65
      });
    }
  }

  atualizar(velocidade) {
    this.offsetTraco = (this.offsetTraco + velocidade) % 240;
    for (const o of this.objetos) {
      o.y += velocidade * 1.15;
      if (o.y > this.canvas.height + 80) {
        o.y = -30 - Math.random()*180;
        o.tipo = ['arvore','arvore','placa','poste','arbusto'][Math.floor(Math.random()*5)];
        o.variante = Math.floor(Math.random()*3);
        o.escala = 0.65 + Math.random()*0.65;
      }
    }
  }

  desenhar(ctx, clima='dia') {
    const { width, height } = this.canvas;
    const noite = clima === 'noite';
    const chuva = clima === 'chuva';

    ctx.fillStyle = noite ? '#071b18' : '#286b32';
    ctx.fillRect(0,0,width,height);
    ctx.fillStyle = noite ? 'rgba(0,40,35,0.45)' : 'rgba(255,255,255,0.035)';
    for (let y = -40 + (this.offsetTraco % 80); y < height; y += 80) ctx.fillRect(0,y,width,28);

    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.fillRect(this.larguraAcostamento - 5,0,width-this.larguraAcostamento*2+10,height);

    const grad = ctx.createLinearGradient(0,0,width,0);
    if (noite) {
      grad.addColorStop(0,'#111820'); grad.addColorStop(.5,'#242b35'); grad.addColorStop(1,'#111820');
    } else {
      grad.addColorStop(0,'#20242b'); grad.addColorStop(.08,'#383d45'); grad.addColorStop(.5,'#41464f'); grad.addColorStop(.92,'#383d45'); grad.addColorStop(1,'#20242b');
    }
    ctx.fillStyle = grad;
    ctx.fillRect(this.larguraAcostamento,0,width-this.larguraAcostamento*2,height);

    ctx.fillStyle = 'rgba(255,255,255,0.025)';
    for (let y=-20+(this.offsetTraco%48); y<height; y+=48) ctx.fillRect(this.larguraAcostamento,y,width-this.larguraAcostamento*2,2);

    this.desenharAcostamento(ctx,height);
    ctx.strokeStyle = CONFIG.COR_FAIXA;
    ctx.lineWidth = 3;
    ctx.setLineDash([34,30]);
    ctx.lineDashOffset = -(this.offsetTraco%64);
    for(let i=1;i<CONFIG.NUM_PISTAS;i++){
      const x=this.larguraAcostamento+this.larguraPista*i;
      ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,height); ctx.stroke();
    }
    ctx.setLineDash([]);
    this.desenharObjetos(ctx, clima);
    if (chuva) this.desenharChuva(ctx);
  }

  desenharAcostamento(ctx,height){
    const largura=this.larguraAcostamento, h=40;
    for(let y=-h+(this.offsetTraco%(h*2)); y<height; y+=h*2){
      ctx.fillStyle='#f4f0d0'; ctx.fillRect(0,y,largura,h);
      ctx.fillStyle='#c62828'; ctx.fillRect(0,y+h,largura,h);
      ctx.fillStyle='#f4f0d0'; ctx.fillRect(this.canvas.width-largura,y,largura,h);
      ctx.fillStyle='#c62828'; ctx.fillRect(this.canvas.width-largura,y+h,largura,h);
    }
  }

  desenharObjetos(ctx, clima){
    const w=this.canvas.width, noite=clima==='noite';
    for(const o of this.objetos){
      const t=Math.max(.35,Math.min(1.25,.48+o.y/this.canvas.height*.75))*o.escala;
      const x=o.side<0 ? this.larguraAcostamento*.46 : w-this.larguraAcostamento*.46;
      ctx.save(); ctx.translate(Math.round(x),Math.round(o.y)); ctx.scale(t,t);
      if(o.tipo==='arvore') this.desenharArvore(ctx,o.variante,noite);
      else if(o.tipo==='arbusto') this.desenharArbusto(ctx,noite);
      else if(o.tipo==='placa') this.desenharPlaca(ctx,o.variante,noite);
      else this.desenharPoste(ctx,noite);
      ctx.restore();
    }
  }

  desenharArvore(ctx,v,noite){
    ctx.fillStyle='rgba(0,0,0,.25)'; ctx.fillRect(-12,12,24,5);
    ctx.fillStyle=noite?'#251a12':'#5b371d'; ctx.fillRect(-3,-5,7,22);
    const c=noite?['#123b29','#0d3022','#16452e'][v]:'#1f7a3b';
    ctx.fillStyle=c; ctx.fillRect(-15,-25,30,25); ctx.fillRect(-22,-15,44,14); ctx.fillRect(-10,-35,20,12);
    ctx.fillStyle=noite?'#294f35':'#3fae4f'; ctx.fillRect(-9,-29,8,8);
  }
  desenharArbusto(ctx,noite){
    ctx.fillStyle=noite?'#123a27':'#23823c'; ctx.fillRect(-20,-7,40,10); ctx.fillRect(-13,-13,26,9); ctx.fillRect(-6,-18,12,8);
  }
  desenharPlaca(ctx,v,noite){
    ctx.fillStyle='#555'; ctx.fillRect(-2,-28,4,31);
    ctx.fillStyle=v===0?'#f1c40f':v===1?'#3498db':'#e74c3c'; ctx.fillRect(-19,-43,38,18);
    ctx.fillStyle=noite?'#fff':'#18202a'; ctx.fillRect(-14,-38,28,2); ctx.fillRect(-10,-33,20,2);
  }
  desenharPoste(ctx,noite){
    ctx.fillStyle='#c9c9c9'; ctx.fillRect(-2,-38,4,40); ctx.fillRect(0,-38,12,3);
    ctx.fillStyle=noite?'#fff3a6':'#ffd34d'; ctx.fillRect(9,-43,8,8);
    if(noite){ctx.fillStyle='rgba(255,230,120,.16)'; ctx.beginPath(); ctx.arc(13,-39,20,0,Math.PI*2); ctx.fill();}
  }
  desenharChuva(ctx){
    ctx.strokeStyle='rgba(180,220,255,.28)'; ctx.lineWidth=1;
    for(let i=0;i<65;i++){
      const x=Math.random()*this.canvas.width, y=Math.random()*this.canvas.height;
      ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(x-3,y+10+Math.random()*7); ctx.stroke();
    }
    ctx.fillStyle='rgba(70,110,150,.10)'; ctx.fillRect(0,0,this.canvas.width,this.canvas.height);
  }
}
