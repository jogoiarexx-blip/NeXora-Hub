/* ===================================================================
   NEXORA HUB — jogos
   Pra adicionar um jogo novo: copie um objeto abaixo, troque os
   campos e pronto. Não precisa mexer no HTML nem no app.js.
   =================================================================== */

const JOGOS = [
  {
    id: 'rampage',
    type: 'jogo',
    title: 'Rampage 1.2',
    genre: 'ação',
    accent: 'var(--red)',
    thumb: 'assets/thumbs/rampage.png',
    desc: 'Destrua 10 fases, desbloqueie monstros, evolua habilidades e enfrente chefes. Versão 1.2 para PC e celular.',
    path: 'jogos/rampage/index.html'
  },
  {
    id: 'forbidden-duel',
    type: 'jogo',
    title: 'Forbidden Duel',
    genre: 'cartas',
    accent: 'var(--steel)',
    desc: 'Duelo de cartas estilo Yu-Gi-Oh, com fusões e mais de 60 cartas pra montar seu deck.',
    path: 'jogos/forbidden-duel/index.html'
  },
  {
    id: 'dragon-fury',
    type: 'jogo',
    title: 'Dragon Fury 1.2',
    genre: 'shooter',
    accent: 'var(--fire)',
    thumb: 'assets/thumbs/dragon-fury.webp',
    desc: 'Shmup de ação com 5 fases progressivas, chefes épicos, upgrades, conquistas, dragões escolta e sistema de rank. Versão 1.2.',
    path: 'jogos/dragon-fury/index.html'
  },
  {
    id: 'navinha-arcade',
    type: 'jogo',
    title: 'Navinha Arcade 1.2',
    genre: 'shooter',
    accent: 'var(--fire)',
    thumb: 'assets/thumbs/navinha-arcade.png',
    desc: 'Arcade espacial v1.2 com 10 fases, 5 naves, chefes multiestágio, power-ups, resgates, conquistas e suporte completo a PC e celular.',
    path: 'jogos/navinha-arcade/index.html'
  },
  {
    id: 'exemplo',
    type: 'jogo',
    title: 'Jogo Exemplo',
    genre: 'template',
    accent: 'var(--steel-dim)',
    desc: 'Modelo em branco pra você copiar quando for montar um jogo novo.',
    path: 'jogos/exemplo/index.html'
  }

  // --- exemplo de como adicionar um jogo (apague o comentário) ---
  // {
  //   id: 'meu-jogo',
  //   type: 'jogo',
  //   title: 'Nome do Jogo',
  //   genre: 'plataforma',
  //   accent: 'var(--amber)',
  //   thumb: 'assets/thumbs/meu-jogo.jpg', // opcional
  //   desc: 'Descrição curta, uma frase.',
  //   path: 'jogos/meu-jogo/index.html'
  // }
];
