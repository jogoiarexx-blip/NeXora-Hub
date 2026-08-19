// Carros com identidade visual própria para cada modelo e inimigos.
class Carro {
  constructor(pista, cor, largura, altura, estilo='normal') {
    this.pista = pista;
    this.cor = cor;
    this.largura = largura;
    this.altura = altura;
    this.estilo = estilo;
    this.x = 0;
    this.y = 0;
    this.sprite = this.criarSprite();
  }

  criarSprite() {
    const grade = Carro.PIXELS;
    const spriteCanvas = document.createElement('canvas');
    spriteCanvas.width = Math.max(1, Math.ceil(this.largura));
    spriteCanvas.height = Math.max(1, Math.ceil(this.altura));
    const sctx = spriteCanvas.getContext('2d');
    const px = spriteCanvas.width / grade[0].length;
    const py = spriteCanvas.height / grade.length;
    const escura = this.sombrear(this.cor, .52);
    const clara = this.sombrear(this.cor, 1.25);
    for(let l=0;l<grade.length;l++) for(let c=0;c<grade[l].length;c++) {
      const s=grade[l][c]; if(s==='.') continue;
      let cor=this.cor;
      if(s==='C') cor=clara; if(s==='D') cor=escura; if(s==='W') cor='#ccecff';
      if(s==='K') cor='#111'; if(s==='L') cor='#fff3a0'; if(s==='R') cor='#ff3030';
      sctx.fillStyle=cor;
      sctx.fillRect(Math.round(c*px),Math.round(l*py),Math.ceil(px)+1,Math.ceil(py)+1);
    }
    // Detalhes únicos por carro
    sctx.fillStyle='rgba(255,255,255,.25)';
    if(this.estilo==='bolt') { sctx.fillRect(spriteCanvas.width*.18, spriteCanvas.height*.14, spriteCanvas.width*.64, Math.max(2,spriteCanvas.height*.05)); }
    if(this.estilo==='phantom') { sctx.fillStyle='rgba(160,100,255,.65)'; sctx.fillRect(spriteCanvas.width*.08, spriteCanvas.height*.45, spriteCanvas.width*.84, Math.max(2,spriteCanvas.height*.05)); }
    if(this.estilo==='titan') { sctx.fillStyle='#222'; sctx.fillRect(spriteCanvas.width*.12, spriteCanvas.height*.63, spriteCanvas.width*.76, Math.max(2,spriteCanvas.height*.1)); }
    return spriteCanvas;
  }

  desenhar(ctx) {
    const xb=Math.round(this.x-this.largura/2), yb=Math.round(this.y-this.altura/2);
    ctx.fillStyle='rgba(0,0,0,.34)'; ctx.fillRect(xb+3,yb+5,this.largura,this.altura);
    if(this.estilo==='titan') { ctx.fillStyle='rgba(255,170,30,.12)'; ctx.fillRect(xb-2,yb-2,this.largura+4,this.altura+4); }
    ctx.drawImage(this.sprite,xb,yb);
    ctx.fillStyle='rgba(255,255,255,.14)'; ctx.fillRect(xb+Math.round(this.largura*.18),yb+5,Math.max(2,Math.round(this.largura*.12)),Math.max(3,Math.round(this.altura*.18)));
    if(this===window.__pixelRushJogador && window.__pixelRushFreando){
      ctx.fillStyle='rgba(255,30,20,.95)';
      ctx.fillRect(xb+Math.round(this.largura*.18),yb+Math.round(this.altura*.78),Math.max(3,Math.round(this.largura*.16)),3);
      ctx.fillRect(xb+Math.round(this.largura*.66),yb+Math.round(this.altura*.78),Math.max(3,Math.round(this.largura*.16)),3);
    }
  }
  sombrear(hex,fator){const n=parseInt(hex.replace('#',''),16);let r=(n>>16)&255,g=(n>>8)&255,b=n&255;r=Math.min(255,Math.round(r*fator));g=Math.min(255,Math.round(g*fator));b=Math.min(255,Math.round(b*fator));return `rgb(${r},${g},${b})`;}
  colideCom(outro){
    const margem = 0.10;
    const ax = this.largura * (0.5 - margem);
    const ay = this.altura * (0.5 - margem);
    const bx = outro.largura * (0.5 - margem);
    const by = outro.altura * (0.5 - margem);
    return Math.abs(this.x-outro.x) < ax+bx &&
           Math.abs(this.y-outro.y) < ay+by;
  }
}
Carro.PIXELS=[
 '.KK...KK.','.DBBCBBD.','DBBBCBBBD','DLBBBBBLD','DBBWWWBBD','DBWWWWWBD','DBWWWWWBD','DBBBCBBBD','DBBBBBBBD','DBBBCBBBD','DBBBBBBBD','DRBBBBBRD','DBBBCBBBD','.KK...KK.'
];
