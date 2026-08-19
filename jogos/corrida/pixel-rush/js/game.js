function omegaBossDamage(nome){ return String(nome||'').includes('OMEGA') ? 20 : 25; }
// Lógica principal do jogo: jogador, inimigos, colisão e pontuação
class Jogo {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.estrada = new Estrada(canvas);

    this.teclas = {};
    window.addEventListener('keydown', (e) => (this.teclas[e.key.toLowerCase()] = true));
    window.addEventListener('keyup', (e) => (this.teclas[e.key.toLowerCase()] = false));

    this.reiniciar();
  }

  redimensionar() {
    this.estrada.recalcular();
    this.posicionarJogador();
  }

  posicionarJogador() {
    if (!this.jogador) return;
    this.jogador.x = this.estrada.xDaPista(this.jogador.pista);
    this.jogador.y = this.canvas.height - this.jogador.altura * 1.6;
  }

  reiniciar() {
    const carroCfg = (window.pixelRushCarro || CARROS[0]);
    this.fase = window.pixelRushFase || FASES[0];
    const largura = Math.min(this.estrada.larguraPista * 0.55, 60);
    const altura = largura * 1.7;

    this.jogador = new Carro(1, carroCfg.cor, largura, altura, carroCfg.id);
    this.posicionarJogador();
    this.jogador.pistaAlvo = 1;

    this.inimigos = [];
    this.velocidade = CONFIG.VELOCIDADE_INICIAL;
    this.distancia = 0;
    this.framesParaSpawn = CONFIG.INTERVALO_SPAWN_INICIAL;
    this.terminou = false;

    this.freando = false;
    this.rastro = [];
    this.explodindo = false;
    this.explosaoFrames = 0;
    this.particulasExplosao = [];
    this.flashFrames = 0;
    this.nitro = CONFIG.NITRO_MAX;
    this.usandoNitro = false;
    this.pontos = 0;
    this.combo = 1;
    this.comboTimer = 0;
    this.nivel = 1;
    this.boss = this.fase.boss ? {ativo:false, hp:100, maxHp:100, x:0, y:-130, pista:1, nome:this.fase.bossName, faseEntrou:false, ataque:0, hitCooldown:0} : null;
    this.tempoSobrevivencia = 0;
    this.carrosPassados = new Set();
    this.textosBonus = [];
    this.combustivel = CONFIG.COMBUSTIVEL_MAX;
    this.galones = [];
    this.framesParaGasolina = 180;
    this.clima = this.fase.clima || 'dia';
    this.proximoClima = this.fase.boss ? this.fase.dist*0.38 : 650;
    this.motivoFim = '';
    this.powerups = [];
    this.moedas = [];
    this.eventos = [];
    this.framesPowerup = 220;
    this.framesMoeda = 80;
    this.moedasRun = 0;
    this.nitrosUsados = 0;
    this.quaseAcidentes = 0;
    this.escudo = 0;
    this.iman = 0;
    this.invencivel = 0;
    this.turbo = 0;
    this.melhoria = this.carregarMelhorias();
    this.carroCfg = carroCfg;
  }


  carregarMelhorias() {
    try { return JSON.parse(localStorage.getItem('pixel-rush-upgrades')) || {velocidade:0,aceleracao:0,freio:0,controle:0,nitro:0}; }
    catch(e){ return {velocidade:0,aceleracao:0,freio:0,controle:0,nitro:0}; }
  }
  salvarMelhorias() { try { localStorage.setItem('pixel-rush-upgrades', JSON.stringify(this.melhoria)); } catch(e){} }
  contarProgressoMissao(id) {
    if(id==='quase') return this.quaseAcidentes;
    if(id==='distancia') return Math.floor(this.distancia);
    if(id==='pontos') return this.pontos;
    if(id==='nitro') return this.nitrosUsados;
    return 0;
  }
  ativarPowerup(tipo) {
    if(tipo==='nitro'){ this.nitro=Math.min(CONFIG.NITRO_MAX, this.nitro+45); this.turbo=110; }
    if(tipo==='escudo') this.escudo=480;
    if(tipo==='iman') this.iman=420;
    if(tipo==='turbo'){ this.turbo=180; this.velocidade=Math.min(CONFIG.VELOCIDADE_NITRO_MAX,this.velocidade+4); }
    if(tipo==='invencivel') this.invencivel=300;
    const nomes={nitro:'⚡ NITRO +45%',escudo:'🛡️ ESCUDO',iman:'🧲 ÍMÃ',turbo:'🚀 TURBO',invencivel:'✨ INVENCÍVEL'};
    this.textosBonus.push({texto:nomes[tipo],x:this.jogador.x,y:this.jogador.y-55,vida:75});
  }

  mudarPista(direcao) {
    const novaPista = this.jogador.pistaAlvo + direcao;
    if (novaPista >= 0 && novaPista < CONFIG.NUM_PISTAS) {
      this.jogador.pistaAlvo = novaPista;
    }
  }

  processarEntrada() {
    if (this.teclas['arrowleft'] || this.teclas['a']) {
      if (!this.teclaEsquerdaSegurada) {
        this.mudarPista(-1);
        this.teclaEsquerdaSegurada = true;
      }
    } else {
      this.teclaEsquerdaSegurada = false;
    }

    if (this.teclas['arrowright'] || this.teclas['d']) {
      if (!this.teclaDireitaSegurada) {
        this.mudarPista(1);
        this.teclaDireitaSegurada = true;
      }
    } else {
      this.teclaDireitaSegurada = false;
    }

    this.usandoNitro = !!(this.teclas[' '] || this.teclas['space']);
    if (this.teclas['enter'] && !this.enterSegurado) { this.enterSegurado=true; }
    if (!this.teclas['enter']) this.enterSegurado=false;
    if (this.usandoNitro && this.nitro > 0) {
      this.velocidade = Math.min(CONFIG.VELOCIDADE_NITRO_MAX + this.carroCfg.vel, this.velocidade + 0.16 + this.melhoria.aceleracao*0.008 + this.carroCfg.acc*0.01);
      this.nitro = Math.max(0, this.nitro - CONFIG.NITRO_CONSUMO * (1-this.melhoria.nitro*0.06));
      if(this._nitroAnterior===false) this.nitrosUsados++;
      this._nitroAnterior=true;
    } else if (this.teclas['arrowup'] || this.teclas['w']) {
      this.velocidade = Math.min(CONFIG.VELOCIDADE_MAX + this.melhoria.velocidade*1.2 + this.carroCfg.vel,  this.velocidade + CONFIG.ACELERACAO + this.melhoria.aceleracao*0.012);
      this.freando = false;
    } else if (this.teclas['arrowdown'] || this.teclas['s']) {
      this.velocidade = Math.max(1, this.velocidade - CONFIG.FREIO - this.melhoria.freio*0.012);
      this.freando = this.velocidade > 1.5;
    } else {
      this._nitroAnterior=false;
      this.freando = false;
      if (this.velocidade > CONFIG.VELOCIDADE_INICIAL) {
        this.velocidade = Math.max(CONFIG.VELOCIDADE_INICIAL, this.velocidade - CONFIG.DESACELERACAO_NATURAL);
      }
    }
  }

  adicionarBonus(texto, valor) {
    this.pontos += valor * this.combo;
    this.combo = Math.min(8, this.combo + 1);
    this.comboTimer = 180;
    this.textosBonus.push({ texto: `+${valor * this.combo}`, x: this.jogador.x, y: this.jogador.y - this.jogador.altura, vida: 55 });
  }

  atualizarPontuacao() {
    this.tempoSobrevivencia++;
    this.pontos += Math.max(1, Math.floor(this.velocidade / 5));
    if (this.comboTimer > 0) this.comboTimer--;
    else this.combo = 1;
    this.nivel = 1 + Math.floor(this.distancia / CONFIG.DISTANCIA_NIVEL);
    if (!this.usandoNitro) this.nitro = Math.min(CONFIG.NITRO_MAX, this.nitro + CONFIG.NITRO_RECARGA);
    for (const t of this.textosBonus) { t.y -= 0.5; t.vida--; }
    this.textosBonus = this.textosBonus.filter(t => t.vida > 0);
  }

  verificarQuaseAcidente() {
    for (const inimigo of this.inimigos) {
      if (this.carrosPassados.has(inimigo)) continue;
      if (inimigo.y > this.jogador.y + this.jogador.altura * 0.7) {
        this.carrosPassados.add(inimigo);
        const distanciaX = Math.abs(this.jogador.x - inimigo.x);
        if (distanciaX < this.jogador.largura * 1.35 && distanciaX > this.jogador.largura * 0.72) {
          this.quaseAcidentes++; this.adicionarBonus('QUASE!', CONFIG.BONUS_QUASE);
        } else if (distanciaX <= this.jogador.largura * 1.8) {
          this.adicionarBonus('PASSOU!', CONFIG.BONUS_ULTRAPASSAGEM);
        }
      }
    }
  }

  gerarGasolina() {
    const pista = Math.floor(Math.random() * CONFIG.NUM_PISTAS);
    this.galones.push({
      pista,
      x: this.estrada.xDaPista(pista),
      y: -25,
      tamanho: Math.max(14, this.jogador.largura * 0.65),
      rot: 0
    });
  }

  atualizarGasolina() {
    this.framesParaGasolina--;
    if (this.framesParaGasolina <= 0) {
      this.gerarGasolina();
      this.framesParaGasolina = CONFIG.INTERVALO_GASOLINA + Math.random() * 180;
    }
    for (const g of this.galones) {
      g.y += this.velocidade;
      g.x = this.estrada.xDaPista(g.pista);
      g.rot += 0.08;
    }
    for (let i = this.galones.length - 1; i >= 0; i--) {
      const g = this.galones[i];
      if (Math.abs(g.x - this.jogador.x) < this.jogador.largura * 0.9 &&
          Math.abs(g.y - this.jogador.y) < this.jogador.altura * 0.9) {
        this.combustivel = Math.min(CONFIG.COMBUSTIVEL_MAX, this.combustivel + CONFIG.BONUS_GASOLINA);
        this.adicionarBonus('GASOLINA!', CONFIG.BONUS_GASOLINA);
        this.textosBonus.push({texto:'⛽ +38%', x:g.x, y:g.y, vida:70});
        this.galones.splice(i,1);
      } else if (g.y > this.canvas.height + 50) {
        this.galones.splice(i,1);
      }
    }
  }

  atualizarCombustivel() {
    const intensidade = 0.65 + this.velocidade / CONFIG.VELOCIDADE_NITRO_MAX * 0.7;
    this.combustivel = Math.max(0, this.combustivel - CONFIG.CONSUMO_COMBUSTIVEL * intensidade);
    if (this.combustivel <= 0) {
      this.motivoFim = '⛽ FIM DA GASOLINA!';
      this.terminou = true;
    }
  }

  atualizarClima() {
    if (this.distancia >= this.proximoClima) {
      const ordem = ['dia','noite','chuva'];
      const atual = ordem.indexOf(this.clima);
      this.clima = ordem[(atual + 1) % ordem.length];
      this.proximoClima += 650 + Math.random() * 350;
      const nomes = {dia:'☀️ DIA',noite:'🌙 NOITE',chuva:'🌧️ CHUVA'};
      this.textosBonus.push({texto:nomes[this.clima], x:this.canvas.width/2, y:80, vida:90});
    }
  }

  atualizarJogador() {
    const xAlvo = this.estrada.xDaPista(this.jogador.pistaAlvo);
    const diff = xAlvo - this.jogador.x;
    if (Math.abs(diff) < CONFIG.VELOCIDADE_TROCA_PISTA) {
      this.jogador.x = xAlvo;
      this.jogador.pista = this.jogador.pistaAlvo;
    } else {
      this.jogador.x += Math.sign(diff) * (CONFIG.VELOCIDADE_TROCA_PISTA + this.melhoria.controle*1.8 + this.carroCfg.ctrl*1.2);
    }
  }

  gerarInimigo() {
    const pista = Math.floor(Math.random() * CONFIG.NUM_PISTAS);
    const tipos = ['lento','normal','rapido','mudanca','caminhao'];
    const tipo = tipos[Math.floor(Math.random()*tipos.length)];
    const largura = this.jogador.largura * (tipo==='caminhao'?1.35:1);
    const altura = this.jogador.altura * (tipo==='caminhao'?1.25:1);
    const cores = tipo==='caminhao'?['#8e44ad','#566573']:CONFIG.CORES_INIMIGOS;
    const cor = cores[Math.floor(Math.random()*cores.length)];
    const inimigo = new Carro(pista, cor, largura, altura, tipo==='caminhao'?'titan':'normal');
    inimigo.tipo=tipo; inimigo.x=this.estrada.xDaPista(pista); inimigo.y=-altura;
    inimigo.vel=(tipo==='lento'?.55:tipo==='rapido'?1.45:tipo==='caminhao'?.72:1);
    inimigo.alvo=pista;
    const bloqueado=this.inimigos.some(i=>i.pista===pista&&i.y<altura*2.5);
    if(!bloqueado)this.inimigos.push(inimigo);
  }

  atualizarInimigos() {
    this.framesParaSpawn--;
    if (this.framesParaSpawn <= 0) {
      this.gerarInimigo();
      const intervaloBase = CONFIG.INTERVALO_SPAWN_INICIAL - this.nivel * 5;
      const intervalo = Math.max(
        Math.max(24, CONFIG.INTERVALO_SPAWN_MIN - this.nivel * 2),
        intervaloBase - this.velocidade * 4
      );
      this.framesParaSpawn = intervalo + Math.random() * 20;
    }

    for (const inimigo of this.inimigos) {
      inimigo.y += this.velocidade * inimigo.vel;
      if(inimigo.tipo==='mudanca' && Math.random()<0.012){
        inimigo.alvo=Math.max(0,Math.min(CONFIG.NUM_PISTAS-1,inimigo.pista+(Math.random()<.5?-1:1)));
      }
      if(inimigo.tipo==='mudanca' && inimigo.pista!==inimigo.alvo){
        inimigo.x += Math.sign(this.estrada.xDaPista(inimigo.alvo)-inimigo.x)*1.8;
        if(Math.abs(inimigo.x-this.estrada.xDaPista(inimigo.alvo))<2) inimigo.pista=inimigo.alvo;
      } else inimigo.x=this.estrada.xDaPista(inimigo.pista);
    }

    this.inimigos = this.inimigos.filter((i) => i.y < this.canvas.height + i.altura);
  }

  verificarColisao() {
    for (const inimigo of this.inimigos) {
      if (this.jogador.colideCom(inimigo)) {
        if(this.escudo>0){ this.escudo=0; inimigo.y=-999; this.adicionarBonus('🛡️ BLOQUEADO!',40); continue; }
        if(this.invencivel>0){ inimigo.y=-999; this.adicionarBonus('✨ IMUNE!',35); continue; }
        return true;
      }
    }
    return false;
  }


  atualizarPowerups(){
    this.framesPowerup--;
    if(this.framesPowerup<=0){
      const tipos=['nitro','escudo','iman','turbo','invencivel'];
      const tipo=tipos[Math.floor(Math.random()*tipos.length)];
      const pista=Math.floor(Math.random()*CONFIG.NUM_PISTAS);
      this.powerups.push({tipo,pista,x:this.estrada.xDaPista(pista),y:-30,rot:0});
      this.framesPowerup=CONFIG.POWERUP_INTERVALO+Math.random()*220;
    }
    for(let i=this.powerups.length-1;i>=0;i--){
      const p=this.powerups[i]; p.y+=this.velocidade; p.x=this.estrada.xDaPista(p.pista); p.rot+=.08;
      if(Math.abs(p.x-this.jogador.x)<this.jogador.largura*1.0 && Math.abs(p.y-this.jogador.y)<this.jogador.altura){
        this.ativarPowerup(p.tipo); this.powerups.splice(i,1);
      } else if(p.y>this.canvas.height+50)this.powerups.splice(i,1);
    }
  }
  atualizarMoedas(){
    this.framesMoeda--;
    if(this.framesMoeda<=0){
      const pista=Math.floor(Math.random()*CONFIG.NUM_PISTAS);
      this.moedas.push({pista,x:this.estrada.xDaPista(pista),y:-20,rot:0});
      this.framesMoeda=CONFIG.MOEDA_INTERVALO+Math.random()*100;
    }
    for(let i=this.moedas.length-1;i>=0;i--){
      const m=this.moedas[i]; m.y+=this.velocidade; m.x=this.estrada.xDaPista(m.pista); m.rot+=.12;
      const alcance=this.iman>0?this.jogador.largura*5:this.jogador.largura*.95;
      if(Math.abs(m.x-this.jogador.x)<alcance && Math.abs(m.y-this.jogador.y)<this.jogador.altura*1.2){
        this.moedasRun+=CONFIG.MOEDA_VALOR; this.pontos+=CONFIG.MOEDA_VALOR*2; this.textosBonus.push({texto:'🪙 +'+CONFIG.MOEDA_VALOR,x:m.x,y:m.y,vida:55}); this.moedas.splice(i,1);
      } else if(m.y>this.canvas.height+40)this.moedas.splice(i,1);
    }
  }
  atualizarEventos(){
    if(this.eventos.length===0 && Math.random()<0.006+this.nivel*0.0008){
      const tipos=['barreira','oleo','cones','bloqueio','cruzamento'];
      const tipo=tipos[Math.floor(Math.random()*tipos.length)], pista=Math.floor(Math.random()*CONFIG.NUM_PISTAS);
      const larguraPista = this.estrada.larguraPista;
      const tamanho = tipo==='bloqueio' ? larguraPista*0.92 : tipo==='barreira' ? larguraPista*0.72 : tipo==='cruzamento' ? larguraPista*0.88 : larguraPista*0.42;
      const alturaEvento = tipo==='bloqueio' ? 30 : tipo==='barreira' ? 24 : tipo==='cruzamento' ? 28 : 20;
      this.eventos.push({tipo,pista,x:this.estrada.xDaPista(pista),y:-45,vida:1,alvo:pista,w:tamanho,h:alturaEvento});
    }
    for(let i=this.eventos.length-1;i>=0;i--){
      const e=this.eventos[i]; e.y+=this.velocidade; e.x=this.estrada.xDaPista(e.pista);
      const ew=e.w || this.jogador.largura*.9;
      const eh=e.h || this.jogador.altura*.55;
      if(Math.abs(e.x-this.jogador.x)<(this.jogador.largura*.45 + ew*.5) &&
         Math.abs(e.y-this.jogador.y)<(this.jogador.altura*.45 + eh*.5)){
        if(e.tipo==='oleo'){ this.jogador.pistaAlvo=Math.max(0,Math.min(CONFIG.NUM_PISTAS-1,this.jogador.pistaAlvo+(Math.random()<.5?-1:1))); this.adicionarBonus('🛢️ DERRAPOU!',15); }
        else if(e.tipo==='cones'){ this.velocidade=Math.max(2,this.velocidade-2); this.adicionarBonus('🚧 CONES!',10); }
        else if(e.tipo==='barreira'||e.tipo==='bloqueio'||e.tipo==='cruzamento'){
          if(this.escudo>0){this.escudo=0;this.adicionarBonus('🛡️ BARREIRA!',30);}
          else if(this.invencivel>0)this.adicionarBonus('✨ ATRAVESSOU!',30);
          else {this.motivoFim='💥 OBSTÁCULO NA PISTA!'; return this.iniciarExplosao();}
        }
        this.eventos.splice(i,1);
      } else if(e.y>this.canvas.height+50)this.eventos.splice(i,1);
    }
  }
  desenharPowerupsEMoedas(){
    const ctx=this.ctx;
    const cores={nitro:'#00d9ff',escudo:'#4d7cff',iman:'#ff4fd8',turbo:'#ff9f1c',invencivel:'#eaff00'};
    const icones={nitro:'⚡',escudo:'🛡',iman:'🧲',turbo:'🚀',invencivel:'★'};
    for(const p of this.powerups){ctx.save();ctx.translate(p.x,p.y);ctx.rotate(Math.sin(p.rot)*.12);ctx.fillStyle=cores[p.tipo];ctx.fillRect(-14,-14,28,28);ctx.fillStyle='#111';ctx.font='20px sans-serif';ctx.textAlign='center';ctx.fillText(icones[p.tipo],0,7);ctx.restore();}
    for(const m of this.moedas){ctx.save();ctx.translate(m.x,m.y);ctx.fillStyle='#ffd54a';ctx.beginPath();ctx.arc(0,0,9,0,Math.PI*2);ctx.fill();ctx.fillStyle='#8a5b00';ctx.font='bold 12px monospace';ctx.textAlign='center';ctx.fillText('$',0,4);ctx.restore();}
    for(const e of this.eventos){
      ctx.save();
      ctx.translate(Math.round(e.x),Math.round(e.y));
      const pistaW=this.estrada.larguraPista;
      if(e.tipo==='oleo'){
        ctx.fillStyle='rgba(0,0,0,.7)';
        ctx.beginPath(); ctx.ellipse(0,3,22,9,0,0,Math.PI*2); ctx.fill();
        ctx.fillStyle='rgba(90,100,110,.25)';
        ctx.beginPath(); ctx.ellipse(-6,0,12,4,0,0,Math.PI*2); ctx.fill();
      } else if(e.tipo==='cones'){
        for(let k=-1;k<=1;k++){
          const x=k*14;
          ctx.fillStyle='#ff7a00'; ctx.beginPath(); ctx.moveTo(x-7,10); ctx.lineTo(x+7,10); ctx.lineTo(x+2,-9); ctx.lineTo(x-2,-9); ctx.closePath(); ctx.fill();
          ctx.fillStyle='#fff'; ctx.fillRect(x-4,0,8,3);
          ctx.fillStyle='#222'; ctx.fillRect(x-8,9,16,3);
        }
      } else if(e.tipo==='cruzamento'){
        ctx.fillStyle='#e9ecef'; ctx.fillRect(-e.w/2,-e.h/2,e.w,e.h);
        ctx.fillStyle='#d62828'; ctx.fillRect(-e.w/2,-3,e.w,6);
        ctx.fillStyle='#222'; ctx.fillRect(-e.w*.45,-e.h/2,8,e.h);
        ctx.fillRect(e.w*.45-8,-e.h/2,8,e.h);
        ctx.fillStyle='#ffd166'; ctx.beginPath();ctx.arc(0,-e.h*.45,5,0,Math.PI*2);ctx.fill();
      } else {
        // bloqueio/barreira físico: cavaletes, barra listrada e luzes
        const w=e.w || pistaW*.85, h=e.h || 28;
        ctx.fillStyle='rgba(0,0,0,.35)'; ctx.fillRect(-w/2+4,h*.25,w,8);
        ctx.fillStyle='#20252b';
        ctx.fillRect(-w*.43,h*.05,10,18); ctx.fillRect(w*.43-10,h*.05,10,18);
        ctx.fillStyle='#e9ecef'; ctx.fillRect(-w/2,-h/2,w,h*.52);
        const stripe=18;
        ctx.save(); ctx.beginPath();ctx.rect(-w/2,-h/2,w,h*.52);ctx.clip();
        for(let x=-w;x<w;x+=stripe){
          ctx.fillStyle='#d62828';
          ctx.beginPath();ctx.moveTo(x,-h/2);ctx.lineTo(x+stripe*.55,-h/2);ctx.lineTo(x-stripe*.2,h*.02);ctx.lineTo(x-stripe*.75,h*.02);ctx.closePath();ctx.fill();
        }
        ctx.restore();
        ctx.fillStyle='#111'; ctx.fillRect(-w/2,-h/2,w,3);
        ctx.fillStyle='#ffd166';
        const pulse=.5+.5*Math.sin(performance.now()*.012);
        ctx.globalAlpha=.65+.35*pulse;
        ctx.beginPath();ctx.arc(-w*.38,-h*.15,5,0,Math.PI*2);ctx.fill();
        ctx.beginPath();ctx.arc(w*.38,-h*.15,5,0,Math.PI*2);ctx.fill();
        ctx.globalAlpha=1;
        ctx.fillStyle='#30343a';
        ctx.fillRect(-w*.47,h*.18,8,8);ctx.fillRect(w*.47-8,h*.18,8,8);
      }
      ctx.restore();
    }
  }

  atualizarRastro() {
    if (this.freando) {
      for (let i = 0; i < 2; i++) {
        this.rastro.push({
          x: this.jogador.x + (Math.random() - 0.5) * this.jogador.largura * 0.5,
          y: this.jogador.y + this.jogador.altura * 0.45,
          vx: (Math.random() - 0.5) * 0.5,
          vy: 0.5 + Math.random() * 0.5,
          tamanho: 4 + Math.floor(Math.random() * 3),
          vida: 22,
          vidaMax: 22,
        });
      }
    }

    for (const p of this.rastro) {
      p.x += p.vx;
      p.y += p.vy;
      p.vida--;
    }
    this.rastro = this.rastro.filter((p) => p.vida > 0);
  }

  iniciarExplosao() {
    this.explodindo = true;
    this.explosaoFrames = 38;
    this.flashFrames = 10;
    this.particulasExplosao = [];

    const cores = ['#fff59d', '#ffb300', '#ff7043', '#e53935', '#ffffff'];
    for (let i = 0; i < 26; i++) {
      const angulo = Math.random() * Math.PI * 2;
      const velocidade = 2 + Math.random() * 5;
      this.particulasExplosao.push({
        x: this.jogador.x,
        y: this.jogador.y,
        vx: Math.cos(angulo) * velocidade,
        vy: Math.sin(angulo) * velocidade,
        tamanho: 4 + Math.floor(Math.random() * 5),
        vida: 26 + Math.random() * 14,
        cor: cores[Math.floor(Math.random() * cores.length)],
      });
    }
  }

  atualizarExplosao() {
    for (const p of this.particulasExplosao) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.15;
      p.vida--;
    }
    this.particulasExplosao = this.particulasExplosao.filter((p) => p.vida > 0);
  }

  atualizarBoss() {
    if (!this.boss) return;
    const b=this.boss;
    const gatilho=this.fase.dist*0.42;
    if (!b.ativo && this.distancia>=gatilho) {
      b.ativo=true; b.faseEntrou=true; b.y=-120; b.pista=1; b.x=this.estrada.xDaPista(1);
      this.textosBonus.push({texto:'⚠️ BOSS: '+b.nome,x:this.canvas.width/2,y:95,vida:140});
    }
    if (!b.ativo) return;
    b.ataque++;
    if (b.hitCooldown>0) b.hitCooldown--;
    b.y += this.velocidade*0.72;
    if (b.y>this.canvas.height*0.58) b.y=this.canvas.height*0.58;
    if (b.ataque%130===0) {
      b.pista = Math.max(0,Math.min(CONFIG.NUM_PISTAS-1,b.pista+(Math.random()<.5?-1:1)));
      const bw=this.estrada.larguraPista*0.92;
      this.eventos.push({tipo:'bloqueio',pista:b.pista,x:this.estrada.xDaPista(b.pista),y:-40,vida:1,alvo:b.pista,w:bw,h:30,boss:true});
    }
    b.x += Math.sign(this.estrada.xDaPista(b.pista)-b.x)*3;
    const perto=Math.abs(b.x-this.jogador.x)<this.jogador.largura*1.45 && Math.abs(b.y-this.jogador.y)<this.jogador.altura*1.8;
    if (perto && b.hitCooldown<=0 && (this.usandoNitro || this.turbo>0)) {
      b.hp=Math.max(0,b.hp-(omegaBossDamage(this.fase.bossName))); b.hitCooldown=45; this.pontos+=100; this.textosBonus.push({texto:'💥 HIT BOSS!',x:b.x,y:b.y-60,vida:65});
      if(b.hp<=0){ b.ativo=false; this.textosBonus.push({texto:'🏆 BOSS DERROTADO!',x:this.canvas.width/2,y:150,vida:150}); this.pontos+=500; }
    }
    if (perto && !this.usandoNitro && this.turbo<=0 && this.invencivel<=0 && this.escudo<=0) {
      this.motivoFim='💀 O BOSS TE ALCANÇOU!'; this.iniciarExplosao();
    }
  }

  desenharBoss() {
    if(!this.boss || !this.boss.ativo) return;
    const b=this.boss, ctx=this.ctx;
    const omega = b.nome.includes('OMEGA');
    const w=this.jogador.largura*(omega?2.35:2.05), h=this.jogador.altura*(omega?1.95:1.75);
    const pulse=.5+.5*Math.sin(b.ataque*.16);
    ctx.save(); ctx.translate(Math.round(b.x),Math.round(b.y));
    // aura e sombra
    ctx.fillStyle=`rgba(${omega?'180,30,255':'255,70,30'},${.08+.08*pulse})`;
    ctx.fillRect(-w*.62,-h*.58,w*1.24,h*1.16);
    ctx.fillStyle='rgba(0,0,0,.5)'; ctx.fillRect(-w/2+6,h*.38,w,h*.18);
    // rodas blindadas
    ctx.fillStyle='#111';
    ctx.fillRect(-w*.62,-h*.35,w*.16,h*.38); ctx.fillRect(w*.46,-h*.35,w*.16,h*.38);
    ctx.fillRect(-w*.62,h*.03,w*.16,h*.38); ctx.fillRect(w*.46,h*.03,w*.16,h*.38);
    // carroceria principal
    ctx.fillStyle=omega?'#4d315e':'#4c555e'; ctx.fillRect(-w/2,-h/2,w,h);
    ctx.fillStyle=omega?'#24162d':'#252c33'; ctx.fillRect(-w*.39,-h*.43,w*.78,h*.42);
    // placas blindadas
    ctx.fillStyle=omega?'#7b43a1':'#69737d';
    ctx.fillRect(-w*.44,-h*.02,w*.88,h*.11); ctx.fillRect(-w*.36,h*.18,w*.72,h*.16);
    // núcleo / faróis
    ctx.fillStyle=omega?'#ff32d7':'#ff3c2e'; ctx.fillRect(-w*.25,-h*.2,w*.5,h*.13);
    ctx.fillStyle=omega?'#f8a4ff':'#ffd45c'; ctx.fillRect(-w*.4,h*.25,w*.18,h*.11); ctx.fillRect(w*.22,h*.25,w*.18,h*.11);
    // torres de ataque
    ctx.fillStyle='#171a1e'; ctx.fillRect(-w*.33,-h*.58,w*.16,h*.22); ctx.fillRect(w*.17,-h*.58,w*.16,h*.22);
    ctx.fillStyle=omega?'#c95cff':'#ff6b3d'; ctx.fillRect(-w*.29,-h*.66,w*.08,h*.12); ctx.fillRect(w*.21,-h*.66,w*.08,h*.12);
    // dano/flash do golpe
    if(b.hitCooldown>0){ ctx.fillStyle=`rgba(255,255,255,${.25+.3*pulse})`; ctx.fillRect(-w/2,-h/2,w,h); }
    // seta de alerta quando o boss está prestes a mudar de pista
    if(b.ataque%130>105){ ctx.fillStyle='#fff'; ctx.font='bold 18px monospace'; ctx.textAlign='center'; ctx.fillText('!',0,-h*.72); }
    ctx.restore();
  }

  atualizar() {
    if (this.terminou) return;

    if (this.flashFrames > 0) this.flashFrames--;

    if (this.explodindo) {
      this.atualizarExplosao();
      this.explosaoFrames--;
      if (this.explosaoFrames <= 0) {
        this.terminou = true;
      }
      return;
    }

    this.processarEntrada();
    this.atualizarJogador();
    this.estrada.atualizar(this.velocidade);
    this.atualizarInimigos();
    this.atualizarGasolina();
    this.atualizarPowerups();
    this.atualizarMoedas();
    this.atualizarEventos();
    this.atualizarBoss();
    this.atualizarCombustivel();
    this.atualizarClima();
    if(this.escudo>0)this.escudo--;
    if(this.iman>0)this.iman--;
    if(this.invencivel>0)this.invencivel--;
    if(this.turbo>0){ this.turbo--; this.velocidade=Math.min(CONFIG.VELOCIDADE_NITRO_MAX,this.velocidade+0.08); }
    this.atualizarRastro();

    this.distancia += this.velocidade * 0.15;
    this.atualizarPontuacao();
    this.verificarQuaseAcidente();

    if (this.verificarColisao()) {
      this.iniciarExplosao();
    }
    if (!this.terminou && this.distancia >= this.fase.dist && (!this.boss || !this.boss.ativo)) {
      this.motivoFim = '🏁 FASE CONCLUÍDA!';
      this.terminou = true;
      this.faseConcluida = true;
    }
  }

  desenhar() {
    this.estrada.desenhar(this.ctx, this.clima);
    this.desenharRastro();

    // linhas de velocidade em alta velocidade
    if (!this.explodindo && this.velocidade > 10) {
      this.ctx.fillStyle = 'rgba(255,255,255,0.12)';
      const intensidade = Math.min(10, Math.floor(this.velocidade - 8));
      for (let i = 0; i < intensidade; i++) {
        const x = this.estrada.larguraAcostamento + Math.random() * (this.canvas.width - this.estrada.larguraAcostamento * 2);
        const y = Math.random() * this.canvas.height;
        this.ctx.fillRect(Math.round(x), Math.round(y), 2, 10 + Math.random() * 18);
      }
    }

    for (const inimigo of this.inimigos) {
      inimigo.desenhar(this.ctx);
    }
    this.desenharGasolina();
    this.desenharPowerupsEMoedas();
    this.desenharBoss();

    if (!this.explodindo) {
      window.__pixelRushJogador = this.jogador;
      window.__pixelRushFreando = this.freando;
      this.jogador.desenhar(this.ctx);
    } else {
      this.desenharExplosao();
    }

    // vinheta e efeito de impacto
    const grad = this.ctx.createRadialGradient(
      this.canvas.width / 2, this.canvas.height * 0.55, this.canvas.width * 0.18,
      this.canvas.width / 2, this.canvas.height * 0.55, this.canvas.width * 0.78
    );
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, 'rgba(0,0,0,0.38)');
    this.ctx.fillStyle = grad;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    for (const t of this.textosBonus) {
      this.ctx.save();
      this.ctx.globalAlpha = Math.max(0, t.vida / 55);
      this.ctx.fillStyle = '#fff59d';
      this.ctx.font = 'bold 13px monospace';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(t.texto, Math.round(t.x), Math.round(t.y));
      this.ctx.restore();
    }

    if (this.flashFrames > 0) {
      this.ctx.fillStyle = `rgba(255,220,160,${(this.flashFrames / 8) * 0.55})`;
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  desenharGasolina() {
    const ctx=this.ctx;
    for(const g of this.galones){
      ctx.save();
      ctx.translate(Math.round(g.x),Math.round(g.y));
      ctx.rotate(Math.sin(g.rot)*0.08);
      const s=g.tamanho;
      ctx.fillStyle='rgba(0,0,0,.35)'; ctx.fillRect(-s*.45,s*.42,s*.9,4);
      ctx.fillStyle='#d7d7d7'; ctx.fillRect(-s*.32,-s*.45,s*.64,s*.82);
      ctx.fillStyle='#e53935'; ctx.fillRect(-s*.32,-s*.25,s*.64,s*.22);
      ctx.fillStyle='#333'; ctx.fillRect(-s*.14,-s*.58,s*.28,s*.15);
      ctx.fillStyle='#fff59d'; ctx.fillRect(-s*.11,-s*.18,s*.22,s*.12);
      ctx.restore();
    }
  }

  desenharRastro() {
    for (const p of this.rastro) {
      const alpha = (p.vida / p.vidaMax) * 0.45;
      this.ctx.fillStyle = `rgba(230,230,230,${alpha.toFixed(2)})`;
      this.ctx.fillRect(Math.round(p.x), Math.round(p.y), p.tamanho, p.tamanho);
    }
  }

  desenharExplosao() {
    for (const p of this.particulasExplosao) {
      this.ctx.fillStyle = p.cor || '#ffb300';
      this.ctx.fillRect(Math.round(p.x - p.tamanho / 2), Math.round(p.y - p.tamanho / 2), p.tamanho, p.tamanho);
    }
  }

  velocidadeKmh() {
    return Math.round(this.velocidade * 18);
  }
}
