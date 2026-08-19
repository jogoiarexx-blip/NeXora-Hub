/* ===================================================================
   NEXORA HUB — livros
   Pra adicionar um livro novo: copie um objeto abaixo, troque os
   campos e pronto. Não precisa mexer no HTML nem no app.js.
   =================================================================== */

const LIVROS = [
  {
    id: 'as-janelas-de-magnolia-lane', type: 'livro', title: 'As Janelas de Magnolia Lane',
    genre: 'romance e suspense', accent: 'var(--amber)',
    thumb: 'assets/thumbs/as-janelas-de-magnolia-lane.webp',
    desc: 'Um romance contemporâneo de Suelen Januário sobre amor, segredos e onze minutos que ninguém conseguiu esquecer.',
    path: 'livros/as-janelas-de-magnolia-lane/index.html'
  },
  {
    id: 'promessa-ao-amanhecer', type: 'livro', title: 'Promessa ao Amanhecer',
    genre: 'romance e fé', accent: 'var(--amber)',
    thumb: 'assets/thumbs/promessa-ao-amanhecer.jpg',
    desc: 'Um romance sobre duas tradições de fé, diálogo, casamento e a escolha diária de caminhar juntos.',
    path: 'livros/promessa-ao-amanhecer/index.html'
  },
  {
    id: 'o-vagante-das-sombras',
    type: 'livro',
    title: 'O Vagante das Sombras',
    genre: 'terror',
    accent: 'var(--amber)',
    thumb: 'assets/thumbs/o-vagante-das-sombras.jpg',
    desc: 'Uma jornada claustrofóbica pelos túneis do metrô, onde Marcos descobre que alguns passageiros jamais descem do trem.',
    path: 'livros/o-vagante-das-sombras/index.html'
  },
  {
    id: 'contos-terror-joao-crist',
    type: 'livro',
    title: 'Contos de Terror com João e Crist',
    genre: 'terror e comédia',
    accent: 'var(--amber)',
    thumb: 'assets/thumbs/contos-terror-joao-crist.jpg',
    desc: 'Uma noite de Halloween, histórias assustadoras, mentiras absurdas e uma última assombração que talvez seja verdadeira.',
    path: 'livros/contos-terror-joao-crist/index.html'
  },
  {
    id: 'joao-e-crist-sea-of-liars',
    type: 'livro',
    title: 'As Aventuras de João e Crist — Sea of Liars',
    genre: 'aventura',
    accent: 'var(--amber)',
    thumb: 'assets/thumbs/joao-e-crist-sea-of-liars.jpg',
    desc: 'Uma nova aventura de João e Crist, agora em Sea of Liars.',
    path: 'livros/joao-e-crist-sea-of-liars/index.html'
  },
  {
    id: 'joao-e-crist-vol4',
    type: 'livro',
    title: 'As Aventuras de João e Crist — Vol. 4',
    genre: 'comédia',
    accent: 'var(--amber)',
    thumb: 'assets/thumbs/joao-e-crist-vol4.jpg',
    desc: 'Uma Brasília velha, Carnaval no interior e uma fazenda mal-assombrada colocam João e Crist em mais uma sequência de confusões.',
    path: 'livros/joao-e-crist-vol4/index.html'
  },
  {
    id: 'joao-e-crist',
    type: 'livro',
    title: 'As Aventuras de João e Crist — Vol. 2',
    genre: 'comédia',
    accent: 'var(--amber)',
    thumb: 'assets/thumbs/joao-e-crist.jpg',
    desc: 'Dois amigos do interior ganham na loteria e viram a bagunça de Las Vegas do avesso — edição revisada, de Luis Paulo Alves.',
    path: 'livros/joao-e-crist/index.html'
  },
  {
    id: 'joao-e-crist-vol3',
    type: 'livro',
    title: 'As Aventuras de João e Crist — Vol. 3',
    genre: 'comédia',
    accent: 'var(--red)',
    thumb: 'assets/thumbs/joao-e-crist-vol3.jpg',
    desc: 'Mais confusão de João e Crist, agora num livro que você folheia na tela.',
    path: 'livros/joao-e-crist-vol3/index.html'
  },
  {
    id: 'joao-e-crist-interativo',
    type: 'livro',
    title: 'As Aventuras de João e Crist — Vol. 1',
    genre: 'comédia',
    accent: 'var(--fire)',
    thumb: 'assets/thumbs/joao-e-crist-interativo.jpg',
    desc: 'A mesma confusão de João e Crist em Las Vegas, agora num livro que você folheia na tela, com capa nova e efeito de página virando.',
    path: 'livros/joao-e-crist-interativo/index.html'
  }

  // --- exemplo de como adicionar um livro (apague o comentário) ---
  // {
  //   id: 'meu-livro',
  //   type: 'livro',
  //   title: 'Nome do Livro',
  //   genre: 'aventura',
  //   accent: 'var(--amber)',
  //   thumb: 'assets/thumbs/meu-livro.jpg', // opcional
  //   desc: 'Descrição curta, uma frase.',
  //   path: 'livros/meu-livro/index.html' // ou .pdf
  // }
];
