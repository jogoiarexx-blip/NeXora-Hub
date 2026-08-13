/* ===================================================================
   NEXORA HUB — jogos
   Pra adicionar um jogo novo: copie um objeto abaixo, troque os
   campos e pronto. Não precisa mexer no HTML nem no app.js.
   =================================================================== */

const JOGOS = [
  {
    id: 'rampage',
    type: 'jogo',
    title: 'Rampage',
    genre: 'ação',
    accent: 'var(--red)',
    desc: 'Vire um monstro gigante e destrua a cidade inteira. Ação pura, sem freio.',
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
    id: 'dragon-wings',
    type: 'jogo',
    title: 'Dragon Wings',
    genre: 'shooter',
    accent: 'var(--fire)',
    desc: 'Shmup bullet-heaven: desvie de padrões de tiro, suba de nível e enfrente chefes.',
    path: 'jogos/dragon-wings/index.html'
  },
  {
    id: 'navinha-arcade',
    type: 'jogo',
    title: 'Navinha Arcade',
    genre: 'shooter',
    accent: 'var(--fire)',
    thumb: 'assets/thumbs/navinha-arcade.jpg',
    desc: 'Shmup de 10 fases: resgate aliados, colete upgrades e enfrente um chefe por fase.',
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
