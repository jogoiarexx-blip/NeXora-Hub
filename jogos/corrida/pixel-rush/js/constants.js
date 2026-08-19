const CONFIG = {
  NUM_PISTAS: 3,
  LARGURA_PISTA: 0,
  VELOCIDADE_INICIAL: 4,
  VELOCIDADE_MAX: 14,
  VELOCIDADE_NITRO_MAX: 18,
  NITRO_MAX: 100,
  NITRO_CONSUMO: 0.65,
  NITRO_RECARGA: 0.12,
  ACELERACAO: 0.05,
  FREIO: 0.15,
  DESACELERACAO_NATURAL: 0.02,
  VELOCIDADE_TROCA_PISTA: 9,
  INTERVALO_SPAWN_INICIAL: 90,
  INTERVALO_SPAWN_MIN: 35,
  DISTANCIA_NIVEL: 350,
  BONUS_QUASE: 25,
  BONUS_ULTRAPASSAGEM: 10,
  COMBUSTIVEL_MAX: 100,
  CONSUMO_COMBUSTIVEL: 0.014,
  BONUS_GASOLINA: 38,
  INTERVALO_GASOLINA: 300,
  COR_PISTA: '#343840',
  COR_PISTA_ESCURO: '#252932',
  COR_FAIXA: '#f6f3dc',
  COR_ACOSTAMENTO: '#2e7d32',
  POWERUP_INTERVALO: 420,
  MOEDA_INTERVALO: 170,
  MOEDA_VALOR: 5,
  MISSIONS: [
    {id:'quase', nome:'Piloto ousado', alvo:3, recompensa:120},
    {id:'distancia', nome:'Mil metros', alvo:1000, recompensa:150},
    {id:'pontos', nome:'Pontuação 500', alvo:500, recompensa:180},
    {id:'nitro', nome:'Nitro 3x', alvo:3, recompensa:100}
  ],
  PRECO_UPGRADE: 100,
  CORES_INIMIGOS: ['#3498db','#f1c40f','#9b59b6','#e67e22','#1abc9c','#ec407a']
};
const CARROS = [
  {id:'falcon',nome:'FALCON',cor:'#ff5050',desc:'Equilibrado',vel:0,acc:0,ctrl:0,preco:0},
  {id:'bolt',nome:'BOLT',cor:'#18c7ff',desc:'Muito rápido',vel:2.2,acc:0.4,ctrl:-0.1,preco:250},
  {id:'phantom',nome:'PHANTOM',cor:'#9b59b6',desc:'Controle superior',vel:0.8,acc:0.2,ctrl:1.4,preco:400},
  {id:'titan',nome:'TITAN',cor:'#f39c12',desc:'Resistente',vel:-0.5,acc:0,ctrl:-0.2,preco:550}
];
const FASES = [
  {id:1,nome:'ESTRADA ZERO',dist:700,clima:'dia',boss:false,recompensa:150},
  {id:2,nome:'NEON NOTURNO',dist:1000,clima:'noite',boss:false,recompensa:220},
  {id:3,nome:'TEMPESTADE',dist:1200,clima:'chuva',boss:false,recompensa:300},
  {id:4,nome:'ROTA DO TITAN',dist:1400,clima:'noite',boss:true,bossName:'ROAD TITAN',recompensa:450},
  {id:5,nome:'CORREDOR OMEGA',dist:1800,clima:'chuva',boss:true,bossName:'OMEGA TRUCK',recompensa:700}
];
const ESTADO={MENU:'menu',JOGANDO:'jogando',FIM:'fim'};
