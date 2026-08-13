/* ===================================================================
   NEXORA HUB — lógica do site
   Os itens (livros, jogos, apps) ficam em js/data-livros.js,
   js/data-jogos.js e js/data-apps.js. Esse arquivo só junta tudo,
   renderiza e cuida dos filtros/busca. Pra adicionar um item novo,
   mexa no arquivo de dados do tipo certo — não aqui.
   =================================================================== */

const BANNER = {
  image: 'assets/banner-placeholder.png', // troque pela imagem real (ideal: 1200x300px)
  link: 'https://example.com',
  label: 'vitrine'
};

// Metadados de cada tipo de conteúdo: rótulo da aba, texto do botão e ícone.
const TYPES = {
  livro: { label: 'livros', action: 'ler',    icon: '📖' },
  jogo:  { label: 'jogos',  action: 'jogar',  icon: '🎮' },
  app:   { label: 'apps',   action: 'abrir',  icon: '📱' }
};

// Ordem fixa das abas (livros primeiro, sempre — independente da ordem nos arquivos de dados)
const TYPE_ORDER = ['livro', 'jogo', 'app'];

// Junta os itens de todos os arquivos de dados (LIVROS, JOGOS, APPS vêm
// de js/data-livros.js, js/data-jogos.js e js/data-apps.js).
const ITEMS = [...LIVROS, ...JOGOS, ...APPS];

// ---------------------------------------------------------------------

let activeType = 'todos';

function renderBanner(){
  const link = document.getElementById('merchLink');
  const img = document.getElementById('merchImg');
  const tag = document.getElementById('bannerTag');
  link.href = BANNER.link;
  img.src = BANNER.image;
  tag.textContent = BANNER.label;
}

function cardHTML(item){
  const thumb = item.thumb
    ? `<div class="card-thumb"><img src="${item.thumb}" alt="Capa de ${item.title}" loading="lazy"></div>`
    : '';
  const meta = TYPES[item.type] || TYPES.jogo;
  const external = /^https?:\/\//.test(item.path) || /\.pdf($|\?)/i.test(item.path);
  const linkAttrs = external ? 'target="_blank" rel="noopener"' : '';
  return `
    <a class="card" href="${item.path}" ${linkAttrs} style="--accent:${item.accent}" data-type="${item.type}" data-genre="${item.genre}" data-title="${item.title.toLowerCase()}">
      ${thumb}
      <span class="tag"><span class="tag-icon">${meta.icon}</span>${item.genre}</span>
      <h2>${item.title}</h2>
      <p>${item.desc}</p>
      <span class="play">▶ ${meta.action}</span>
    </a>
  `;
}

function ghostCardHTML(){
  return `
    <div class="card ghost">
      <span class="plus">+</span>
      <small>novo jogo, livro ou app?<br>edite js/data-livros.js,<br>js/data-jogos.js ou js/data-apps.js</small>
    </div>
  `;
}

function renderItems(list){
  const grid = document.getElementById('games');
  const empty = document.getElementById('emptyState');
  if(list.length === 0){
    grid.innerHTML = '';
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';
  grid.innerHTML = list.map(cardHTML).join('') + ghostCardHTML();
}

function renderTypeTabs(){
  const present = new Set(ITEMS.map(i => i.type));
  const typesPresent = TYPE_ORDER.filter(t => present.has(t));
  const wrap = document.getElementById('typeTabs');
  const tabs = ['todos', ...typesPresent];
  wrap.innerHTML = tabs.map(t => {
    const label = t === 'todos' ? 'todos' : TYPES[t].label;
    const icon = t === 'todos' ? '★' : TYPES[t].icon;
    return `<button class="type-btn${t===activeType?' active':''}" data-type="${t}">${icon} ${label}</button>`;
  }).join('');
}

function renderGenreFilters(){
  const pool = activeType === 'todos' ? ITEMS : ITEMS.filter(i => i.type === activeType);
  const genres = ['todos', ...new Set(pool.map(i => i.genre))];
  const wrap = document.getElementById('filters');
  wrap.innerHTML = genres.map((g,i) =>
    `<button class="filter-btn${i===0?' active':''}" data-genre="${g}">${g}</button>`
  ).join('');
}

function sortByTypeOrder(list){
  return [...list].sort((a, b) => TYPE_ORDER.indexOf(a.type) - TYPE_ORDER.indexOf(b.type));
}

function applyFilters(){
  const term = document.getElementById('search').value.trim().toLowerCase();
  const activeBtn = document.querySelector('.filter-btn.active');
  const genre = activeBtn ? activeBtn.dataset.genre : 'todos';

  const filtered = ITEMS.filter(i => {
    const matchesType = activeType === 'todos' || i.type === activeType;
    const matchesGenre = genre === 'todos' || i.genre === genre;
    const matchesTerm = i.title.toLowerCase().includes(term);
    return matchesType && matchesGenre && matchesTerm;
  });

  renderItems(sortByTypeOrder(filtered));
}

document.addEventListener('DOMContentLoaded', () => {
  renderBanner();
  renderTypeTabs();
  renderGenreFilters();
  renderItems(sortByTypeOrder(ITEMS));

  document.getElementById('search').addEventListener('input', applyFilters);

  document.getElementById('typeTabs').addEventListener('click', (e) => {
    const btn = e.target.closest('.type-btn');
    if(!btn) return;
    activeType = btn.dataset.type;
    document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderGenreFilters();
    applyFilters();
  });

  document.getElementById('filters').addEventListener('click', (e) => {
    const btn = e.target.closest('.filter-btn');
    if(!btn) return;
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    applyFilters();
  });
});
