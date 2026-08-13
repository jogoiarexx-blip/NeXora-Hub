/* ===================================================================
   NEXORA HUB — livros
   Pra adicionar um livro novo: copie um objeto abaixo, troque os
   campos e pronto. Não precisa mexer no HTML nem no app.js.
   =================================================================== */

const LIVROS = [
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
