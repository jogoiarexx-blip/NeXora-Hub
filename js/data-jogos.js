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
    category: 'arcade',
    accent: 'var(--red)',
    thumb: 'assets/thumbs/rampage.png',
    desc: 'Destrua 10 fases, desbloqueie monstros, evolua habilidades e enfrente chefes. Versão 1.2 para PC e celular.',
    path: 'jogos/arcade/rampage/index.html'
  },
  {
    id: 'forbidden-duel',
    type: 'jogo',
    title: 'Forbidden Duel Memories 1.2',
    genre: 'cartas',
    category: 'cartas',
    accent: 'var(--steel)',
    desc: 'Versão 1.2 com campanha RPG, história, chefes, fusões, magias, equipamentos, terrenos e cartas organizadas por famílias.',
    path: 'jogos/cartas/forbidden-duel/index.html'
  },
  {
    id: 'dragon-fury',
    type: 'jogo',
    title: 'Dragon Fury 1.2',
    genre: 'shooter',
    category: 'shoot-em-up',
    accent: 'var(--fire)',
    thumb: 'assets/thumbs/dragon-fury.webp',
    desc: 'Shmup de ação com 5 fases progressivas, chefes épicos, upgrades, conquistas, dragões escolta e sistema de rank. Versão 1.2.',
    path: 'jogos/shoot-em-up/dragon-fury/index.html'
  },
  {
    id: 'navinha-arcade',
    type: 'jogo',
    title: 'Navinha Arcade 1.2',
    genre: 'shooter',
    category: 'shoot-em-up',
    accent: 'var(--fire)',
    thumb: 'assets/thumbs/navinha-arcade.png',
    desc: 'Arcade espacial v1.2 com 10 fases, 5 naves, chefes multiestágio, power-ups, resgates, conquistas e suporte completo a PC e celular.',
    path: 'jogos/shoot-em-up/navinha-arcade/index.html'
  },
  {
    id: 'modern-breakout',
    type: 'jogo',
    title: 'Modern Breakout v4.0',
    genre: 'arcade',
    category: 'arcade',
    accent: 'var(--amber)',
    desc: 'Breakout Premium Edition com fases, power-ups, skins, conquistas, economia e placar.',
    path: 'jogos/arcade/breakout/index.html'
  },
  {
    id: 'zeco-ilha',
    type: 'jogo',
    title: 'Zeco e a Ilha das Gemas 4.7',
    genre: 'aventura',
    category: 'plataforma',
    accent: 'var(--fire)',
    thumb: 'assets/thumbs/zeco-ilha-v47.webp',
    desc: 'Versão 4.7 com Lina Cartógrafa, Mestre Tupi, história, fases, áudio e suporte a celular.',
    path: 'jogos/plataforma/zeco-lendas-da-ilha/index.html'
  },
  {
    id: 'last-campfire',
    type: 'jogo',
    title: 'Last Campfire 1.4',
    genre: 'sobrevivência',
    category: 'survival',
    accent: 'var(--red)',
    thumb: 'assets/thumbs/last-campfire.webp',
    desc: 'Jogo de sobrevivência com controles, áudio, sistema de salvamento e interface própria.',
    path: 'jogos/survival/last-campfire/index.html'
  },
  {
    id: 'mecanica-do-ze',
    type: 'jogo',
    title: 'Mecânica do Zé',
    genre: 'simulação',
    category: 'simulação',
    accent: 'var(--amber)',
    desc: 'Gerencie a oficina do Zé, faça serviços, evolua a mecânica e acompanhe dinheiro, contas e progresso. Compatível com PC e celular.',
    path: 'jogos/simulacao/mecanica-do-ze/index.html'
  },
  {
    id: 'hungry-shark',
    type: 'jogo',
    title: 'Hungry Shark 4.1',
    genre: 'ação',
    category: 'survival',
    accent: 'var(--fire)',
    thumb: 'assets/thumbs/hungry-shark.webp',
    desc: 'Sobreviva no oceano, devore inimigos, evolua o tubarão, desbloqueie habilidades, pets, títulos e conquistas. Versão 4.1 com correções mobile.',
    path: 'jogos/survival/hungry-shark/index.html'
  },
  {
    id: 'baki-underground',
    type: 'jogo',
    title: 'BAKI Underground Survival v4',
    genre: 'luta / sobrevivência',
    category: 'survival',
    accent: 'var(--red)',
    desc: 'Sobrevivência underground inspirada em combates intensos, com progressão e suporte mobile.',
    path: 'jogos/survival/baki-underground-survival/index.html'
  },
  {
    id: 'dead-zone',
    type: 'jogo',
    title: 'Dead Zone Zombie Survival 2.2',
    genre: 'zumbi / sobrevivência',
    category: 'survival',
    accent: 'var(--red)',
    desc: 'Sobrevivência zumbi com hordas, inventário, loot, fome, sede, armas, salvamento e mundo procedural.',
    path: 'jogos/survival/dead-zone/index.html'
  },
  {
    id: 'vehicle-defense',
    type: 'jogo',
    title: 'Vehicle Defense 10.2',
    genre: 'defesa / sobrevivência',
    category: 'survival',
    accent: 'var(--amber)',
    desc: 'Defenda seu veículo contra ondas de inimigos, com visual atualizado e suporte para PC e celular. Versão 10.2.',
    path: 'jogos/survival/vehicle-defense/index.html'
  },
  {
    id: 'joao-e-crist-game',
    type: 'jogo',
    title: 'João & Crist 0.9.3 — Rumo a Vegas',
    genre: 'ação',
    category: 'acao',
    accent: 'var(--fire)',
    thumb: 'assets/thumbs/joao-e-crist-game.webp',
    desc: 'Beat ’em up de João e Crist rumo a Las Vegas. Versão 0.9.3 com sequência do ônibus, cutscenes e direção corrigida.',
    path: 'jogos/acao/joao-e-crist/index.html'
  },
  {
    id: 'guerra-de-bases',
    type: 'jogo',
    title: 'Guerra de Bases 5.9',
    genre: 'estratégia',
    category: 'estrategia',
    accent: 'var(--amber)',
    thumb: 'assets/thumbs/guerra-de-bases.webp',
    desc: 'Estratégia de base contra base com unidades, tanques, chefes e recruta animado na versão 5.9.',
    path: 'jogos/estrategia/guerra-de-bases/index.html'
  },
  {
    id: 'pixel-rush',
    type: 'jogo',
    title: 'Pixel Rush',
    genre: 'corrida',
    category: 'corrida',
    accent: 'var(--red)',
    thumb: 'assets/thumbs/pixel-rush.webp',
    desc: 'Jogo de corrida arcade com bloqueio real de pista e jogabilidade otimizada para navegador.',
    path: 'jogos/corrida/pixel-rush/index.html'
  },
  {
    id: 'exemplo',
    type: 'jogo',
    title: 'Jogo Exemplo',
    genre: 'template',
    category: 'outros',
    accent: 'var(--steel-dim)',
    desc: 'Modelo em branco pra você copiar quando for montar um jogo novo.',
    path: 'jogos/outros/exemplo/index.html'
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
