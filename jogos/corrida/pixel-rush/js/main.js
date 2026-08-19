// Orquestra as telas (menu, jogo, fim), o canvas e o loop principal
(function () {
  const telaMenu = document.getElementById('tela-menu');
  const telaJogo = document.getElementById('tela-jogo');
  const telaFim = document.getElementById('tela-fim');

  const btnIniciar = document.getElementById('btn-iniciar');
  const btnReiniciar = document.getElementById('btn-reiniciar');

  const hudDistancia = document.getElementById('hud-distancia');
  const hudVelocidade = document.getElementById('hud-velocidade');
  const fimDistancia = document.getElementById('fim-distancia');
  const fimRecordeMsg = document.getElementById('fim-recorde-msg');
  const hudPontos = document.getElementById('hud-pontos');
  const hudCombo = document.getElementById('hud-combo');
  const hudNitro = document.getElementById('hud-nitro');
  const hudCombustivel = document.getElementById('hud-combustivel');
  const hudClima = document.getElementById('hud-clima');
  const fimMotivo = document.getElementById('fim-motivo');
  const fimPontos = document.getElementById('fim-pontos');
  const recordeMenu = document.getElementById('recorde-menu');
  const moedasMenu = document.getElementById('moedas-menu');
  const hudMoedas = document.getElementById('hud-moedas');
  const hudPower = document.getElementById('hud-power');
  const painelGaragem = document.getElementById('painel-garagem');
  const painelMissoes = document.getElementById('painel-missoes');
  const painelCarros = document.getElementById('painel-carros');
  const painelCampanha = document.getElementById('painel-campanha');
  const listaCarros = document.getElementById('lista-carros');
  const listaFases = document.getElementById('lista-fases');
  const hudBoss = document.getElementById('hud-boss');
  const hudBossName = document.getElementById('hud-boss-name');
  const hudBossBar = document.getElementById('hud-boss-bar');
  const listaUpgrades = document.getElementById('lista-upgrades');
  const listaMissoes = document.getElementById('lista-missoes');

  const canvas = document.getElementById('canvas-jogo');

  // localStorage pode ser bloqueado em alguns navegadores ao abrir via
  // duplo clique (file://) — evita que isso quebre o jogo inteiro
  function armazenamentoDisponivel() {
    try {
      const chave = '__teste_pixel_rush__';
      localStorage.setItem(chave, '1');
      localStorage.removeItem(chave);
      return true;
    } catch (e) {
      return false;
    }
  }

  const temStorage = armazenamentoDisponivel();
  const CHAVE_RECORDE = 'pixel-rush-recorde';
  let recorde = temStorage ? Number(localStorage.getItem(CHAVE_RECORDE)) || 0 : 0;
  let moedas = temStorage ? Number(localStorage.getItem('pixel-rush-moedas')) || 0 : 0;
  let missoes = temStorage ? JSON.parse(localStorage.getItem('pixel-rush-missoes')||'{}') : {};
  recordeMenu.textContent = recorde; moedasMenu.textContent = moedas;


  function salvarEconomia(){if(!temStorage)return;try{localStorage.setItem('pixel-rush-moedas',moedas);localStorage.setItem('pixel-rush-missoes',JSON.stringify(missoes));}catch(e){}}
  function melhorias(){
    try{return JSON.parse(localStorage.getItem('pixel-rush-upgrades'))||{velocidade:0,aceleracao:0,freio:0,controle:0,nitro:0};}
    catch(e){return {velocidade:0,aceleracao:0,freio:0,controle:0,nitro:0};}
  }
  const nomesUp={velocidade:['Velocidade máxima','+1.2 km/h no limite'],aceleracao:['Aceleração','saída mais rápida'],freio:['Freio','reduz velocidade mais rápido'],controle:['Controle','troca de pista mais ágil'],nitro:['Capacidade do nitro','consome menos nitro']};
  function renderGaragem(){
    const u=melhorias(); listaUpgrades.innerHTML='';
    Object.keys(nomesUp).forEach(k=>{
      const [n,d]=nomesUp[k],nivel=u[k]||0,custo=CONFIG.PRECO_UPGRADE*(nivel+1);
      listaUpgrades.innerHTML+=`<div class="upgrade"><div><strong>${n} — Nível ${nivel}</strong><small>${d}</small></div><button data-up="${k}" ${moedas<custo?'disabled':''}>🪙 ${custo}</button></div>`;
    });
    listaUpgrades.querySelectorAll('[data-up]').forEach(b=>b.onclick=()=>{const k=b.dataset.up,c=CONFIG.PRECO_UPGRADE*((u[k]||0)+1);if(moedas>=c){moedas-=c;u[k]++;localStorage.setItem('pixel-rush-upgrades',JSON.stringify(u));salvarEconomia();moedasMenu.textContent=moedas;renderGaragem();}});
  }
  function renderMissoes(){
    listaMissoes.innerHTML='';
    CONFIG.MISSIONS.forEach(m=>{const p=Math.min(m.alvo,jogo?jogo.contarProgressoMissao(m.id):0),done=!!missoes[m.id],pct=Math.floor(p/m.alvo*100);
      listaMissoes.innerHTML+=`<div class="missao ${done?'done':''}"><strong>${done?'✅':'🎯'} ${m.nome}</strong><br><small>${p}/${m.alvo} — recompensa 🪙 ${m.recompensa}</small><div class="barra"><i style="width:${pct}%"></i></div></div>`;
    });
  }
  function atualizarMissoes(){
    if(!jogo)return;
    CONFIG.MISSIONS.forEach(m=>{if(!missoes[m.id]&&jogo.contarProgressoMissao(m.id)>=m.alvo){missoes[m.id]=true;moedas+=m.recompensa;jogo.textosBonus.push({texto:'🎯 MISSÃO +'+m.recompensa,x:jogo.canvas.width/2,y:110,vida:100});}});
    salvarEconomia();moedasMenu.textContent=moedas;
  }

  function salvarRecorde(valor) {
    if (!temStorage) return;
    try {
      localStorage.setItem(CHAVE_RECORDE, valor);
    } catch (e) {
      // silenciosamente ignora — o recorde só não persiste entre sessões
    }
  }

  let estadoAtual = ESTADO.MENU;
  let carroSelecionado = temStorage ? (localStorage.getItem('pixel-rush-carro') || 'falcon') : 'falcon';
  let faseSelecionada = temStorage ? Number(localStorage.getItem('pixel-rush-fase-atual')) || 1 : 1;
  let fasesDesbloqueadas = temStorage ? Number(localStorage.getItem('pixel-rush-fases')) || 1 : 1;
  function carroAtual(){ return CARROS.find(c=>c.id===carroSelecionado)||CARROS[0]; }
  function faseAtual(){ return FASES.find(f=>f.id===faseSelecionada)||FASES[0]; }
  function salvarProgresso(){ if(!temStorage)return; try{localStorage.setItem('pixel-rush-carro',carroSelecionado);localStorage.setItem('pixel-rush-fase-atual',faseSelecionada);localStorage.setItem('pixel-rush-fases',fasesDesbloqueadas);}catch(e){} }
  function renderCarros(){
    listaCarros.innerHTML='';
    const comprados=(temStorage?(localStorage.getItem('pixel-rush-carros')||''):'').split(',').filter(Boolean);
    CARROS.forEach(c=>{
      const desbloqueado=c.preco===0 || comprados.includes(c.id); const podeComprar=desbloqueado || moedas>=c.preco;
      const sel=c.id===carroSelecionado;
      listaCarros.innerHTML+=`<div class="card-carro ${sel?'selecionado':''} ${desbloqueado?'':'bloqueado'}"><div class="mini-carro" style="--car:${c.cor}">🚗</div><div><strong>${c.nome}</strong><small>${c.desc}</small><small>VEL +${c.vel} • CTRL +${c.ctrl}</small></div><button data-car="${c.id}" ${podeComprar?'':'disabled'}>${sel?'✓ USANDO':c.preco===0?'USAR':'🪙 '+c.preco}</button></div>`;
    });
    listaCarros.querySelectorAll('[data-car]').forEach(b=>b.onclick=()=>{
      const c=CARROS.find(x=>x.id===b.dataset.car); if(!c)return;
      const comprados=(temStorage?(localStorage.getItem('pixel-rush-carros')||''):'').split(',').filter(Boolean);
      if(c.preco>0 && !comprados.includes(c.id)){ if(moedas<c.preco)return; moedas-=c.preco; comprados.push(c.id); if(temStorage)localStorage.setItem('pixel-rush-carros',comprados.join(',')); salvarEconomia(); }
      carroSelecionado=c.id; salvarProgresso(); moedasMenu.textContent=moedas; renderCarros();
    });
  }
  function renderCampanha(){
    listaFases.innerHTML='';
    FASES.forEach(f=>{const ok=f.id<=fasesDesbloqueadas; const sel=f.id===faseSelecionada;
      listaFases.innerHTML+=`<div class="fase-card ${sel?'selecionada':''} ${ok?'':'bloqueada'}"><div class="fase-num">${ok?'0'+f.id:'🔒'}</div><div><strong>${f.nome}</strong><small>${f.dist} m • ${f.clima==='dia'?'☀️ Dia':f.clima==='noite'?'🌙 Noite':'🌧️ Chuva'} ${f.boss?'• 👹 '+f.bossName:''}</small></div><button data-fase="${f.id}" ${ok?'':'disabled'}>${sel?'✓ SELECIONADA':'SELECIONAR'}</button></div>`;
    });
    listaFases.querySelectorAll('[data-fase]').forEach(b=>b.onclick=()=>{faseSelecionada=Number(b.dataset.fase);salvarProgresso();renderCampanha();});
  }

  let jogo = null;
  let animacaoId = null;

  function redimensionarCanvas() {
    const hudAltura = 60;
    canvas.width = Math.min(window.innerWidth, 700);
    canvas.height = window.innerHeight - hudAltura;
    if (jogo) jogo.redimensionar();
  }

  function mostrarTela(tela) {
    [telaMenu, telaJogo, telaFim].forEach((t) => t.classList.add('escondida'));
    tela.classList.remove('escondida');
  }

  function iniciarJogo() {
    window.pixelRushCarro=carroAtual(); window.pixelRushFase=faseAtual();
    estadoAtual = ESTADO.JOGANDO;
    mostrarTela(telaJogo);
    redimensionarCanvas();

    if (!jogo) {
      jogo = new Jogo(canvas);
    } else {
      jogo.reiniciar();
      jogo.redimensionar();
    }

    if (!animacaoId) {
      loop();
    }
  }

  function terminarJogo() {
    estadoAtual = ESTADO.FIM;
    const distanciaFinal = Math.floor(jogo.distancia);
    moedas += jogo.moedasRun;
    atualizarMissoes();
    salvarEconomia();
    moedasMenu.textContent=moedas;
    fimPontos.textContent = jogo.pontos;
    if(jogo.faseConcluida){ moedas += jogo.fase.recompensa || 0; if(jogo.fase.id===fasesDesbloqueadas && fasesDesbloqueadas<FASES.length) fasesDesbloqueadas++; salvarProgresso(); salvarEconomia(); moedasMenu.textContent=moedas; fimMotivo.innerHTML='🏁 '+jogo.fase.nome+' CONCLUÍDA! +'+(jogo.fase.recompensa||0)+' moedas — Você percorreu <span id="fim-distancia-inline">'+distanciaFinal+'</span> m'; }
    fimMotivo.innerHTML = (jogo.motivoFim || '💥 BATEU!') + ' — Você percorreu <span id="fim-distancia-inline">' + distanciaFinal + '</span> metros';
    fimDistancia.textContent = distanciaFinal;

    if (distanciaFinal > recorde) {
      recorde = distanciaFinal;
      salvarRecorde(recorde);
      recordeMenu.textContent = recorde;
      fimRecordeMsg.classList.remove('escondida');
    } else {
      fimRecordeMsg.classList.add('escondida');
    }

    mostrarTela(telaFim);
  }

  function loop() {
    if (estadoAtual === ESTADO.JOGANDO) {
      jogo.atualizar();
      jogo.desenhar();

      hudDistancia.textContent = Math.floor(jogo.distancia);
      hudVelocidade.textContent = jogo.velocidadeKmh();
      hudPontos.textContent = jogo.pontos;
      hudCombo.textContent = 'x' + jogo.combo;
      hudNitro.textContent = Math.round(jogo.nitro);
      hudCombustivel.textContent = Math.round(jogo.combustivel);
      hudMoedas.textContent = moedas + jogo.moedasRun;
      hudCombustivel.style.color = jogo.combustivel < 25 ? '#ff5050' : (jogo.combustivel < 50 ? '#ffd34d' : '#7dff9d');
      hudClima.textContent = ({dia:'☀️ DIA',noite:'🌙 NOITE',chuva:'🌧️ CHUVA'})[jogo.clima];
      if(jogo.boss){hudBoss.classList.toggle('escondida',!jogo.boss.ativo); if(jogo.boss.ativo){hudBossName.textContent=jogo.boss.nome;hudBossBar.style.width=(jogo.boss.hp/jogo.boss.maxHp*100)+'%';}} else hudBoss.classList.add('escondida');
      const ativos=[]; if(jogo.escudo>0)ativos.push('🛡️'); if(jogo.iman>0)ativos.push('🧲'); if(jogo.invencivel>0)ativos.push('★'); if(jogo.turbo>0)ativos.push('🚀'); hudPower.textContent='POWER: '+(ativos.join(' ')||'—');
      atualizarMissoes();

      if (jogo.terminou) {
        terminarJogo();
      }
    }
    animacaoId = requestAnimationFrame(loop);
  }

  document.getElementById('btn-carros').onclick=()=>{[painelGaragem,painelMissoes,painelCampanha].forEach(x=>x.classList.add('escondida'));painelCarros.classList.remove('escondida');renderCarros();};
  document.getElementById('fechar-carros').onclick=()=>painelCarros.classList.add('escondida');
  document.getElementById('btn-campanha').onclick=()=>{[painelGaragem,painelMissoes,painelCarros].forEach(x=>x.classList.add('escondida'));painelCampanha.classList.remove('escondida');renderCampanha();};
  document.getElementById('fechar-campanha').onclick=()=>painelCampanha.classList.add('escondida');
  document.getElementById('btn-garagem').onclick=()=>{painelMissoes.classList.add('escondida');painelGaragem.classList.remove('escondida');renderGaragem();};
  document.getElementById('fechar-garagem').onclick=()=>painelGaragem.classList.add('escondida');
  document.getElementById('btn-missoes').onclick=()=>{painelGaragem.classList.add('escondida');painelMissoes.classList.remove('escondida');renderMissoes();};
  document.getElementById('fechar-missoes').onclick=()=>painelMissoes.classList.add('escondida');
  btnIniciar.addEventListener('click', iniciarJogo);
  btnReiniciar.addEventListener('click', iniciarJogo);
  window.addEventListener('resize', redimensionarCanvas);
  window.addEventListener('blur', () => {
    if (jogo) jogo.teclas = {};
  });

  redimensionarCanvas();
})();
