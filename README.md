# Nexora Hub

Prateleira dos meus jogos, livros e apps, hospedada como site estático (GitHub Pages).

## Como adicionar um item novo (jogo, livro ou app)

Tudo mora num único array `ITEMS`, em `js/app.js`. Cada item tem um campo
`type`, que é o que muda o ícone, o rótulo da aba e o texto do botão
("jogar" / "ler" / "abrir").

1. Se o item roda no próprio site (um jogo, por exemplo), duplique a pasta
   `jogos/exemplo` e renomeie (ex: `jogos/meu-jogo`), e coloque o conteúdo
   dentro (o `index.html` daquela pasta é a porta de entrada). Livros e apps
   não precisam de pasta própria — o `path` pode apontar direto pra um link
   externo (loja, PDF, site do projeto etc).

2. Abra `js/app.js` e adicione um objeto no array `ITEMS`, copiando o formato
   dos outros:

```js
{
  id: 'meu-item',
  type: 'jogo',          // 'jogo', 'livro' ou 'app'
  title: 'Meu Item',
  genre: 'ação',          // aparece como tag e também vira filtro (dentro da aba do type)
  accent: 'var(--teal)',  // cor do cartucho: var(--red), var(--purple), var(--teal), var(--amber), var(--gold), var(--steel), var(--fire), ou um hex novo
  thumb: 'assets/thumbs/meu-item.jpg', // opcional: screenshot ou capa
  desc: 'Descrição curta, uma frase.',
  path: 'jogos/meu-item/index.html'    // pode ser um caminho local ou um link https:// externo
}
```

Não precisa mexer no HTML — as abas, os filtros e o grid são gerados
automaticamente a partir desse array.

## Tipos disponíveis

Definidos no objeto `TYPES`, no topo de `js/app.js`:

- `livro` — ícone 📖, botão "ler"
- `jogo` — ícone 🎮, botão "jogar"
- `app` — ícone 📱, botão "abrir"

As abas de tipo (Todos / Livros / Jogos / Apps) aparecem sozinhas conforme
os tipos presentes no array `ITEMS` — se você ainda não tem nenhum livro
cadastrado, a aba "livros" simplesmente não aparece.

A ordem das abas, e também a ordem dos cards quando a aba "Todos" está
selecionada, segue sempre o array `TYPE_ORDER` (logo abaixo de `TYPES`) —
por padrão `['livro', 'jogo', 'app']`, pra livros aparecerem primeiro,
não importa em que ordem eles foram cadastrados em `ITEMS`. Pra mudar
essa prioridade, é só reordenar esse array.

O filtro de gênero (os botões abaixo da busca) muda de acordo com a aba
selecionada: dentro de "livros" mostra gêneros literários, dentro de
"jogos" mostra gêneros de jogo, e assim por diante — cada item usa seu
próprio campo `genre` livremente.

## Banner / vitrine

Também em `js/app.js`, no objeto `BANNER` no topo: troque `image`, `link` e
`label`. Imagem ideal: ~1200x300px.

## Cores disponíveis

Definidas em `css/style.css` no `:root`: `--red`, `--purple`, `--teal`,
`--amber`, `--gold`, `--steel`, `--fire`.
Pode usar uma dessas no campo `accent` ou passar um hex direto.
