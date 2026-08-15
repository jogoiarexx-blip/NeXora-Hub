/* NEXORA HUB — home, busca, favoritos e progresso de leitura */

const TYPES = {
  livro: { label: 'livros', action: 'ler',   icon: '📖' },
  jogo:  { label: 'jogos',  action: 'jogar', icon: '🎮' },
  app:   { label: 'apps',   action: 'abrir', icon: '📱' }
};
const TYPE_ORDER = ['livro', 'jogo', 'app'];
const GAME_CATEGORIES = {
  arcade: {label:'Arcade', icon:'🕹️', order:1},
  corrida: {label:'Corrida', icon:'🏁', order:2},
  survival: {label:'Survival', icon:'☣️', order:3},
  cartas: {label:'Cartas', icon:'🃏', order:4},
  rpg: {label:'RPG & Aventura', icon:'⚔️', order:5},
  'simulação': {label:'Simulação', icon:'🔧', order:6},
  outros: {label:'Outros', icon:'🎮', order:99}
};
const ITEMS = [...LIVROS, ...JOGOS, ...APPS].filter(item => item.id !== 'exemplo');
const FAVORITES_KEY = 'nexora.favorites';
const READER_PREFIX = 'nexora.reader.';
const OFFLINE_KEY = 'nexora.offline.';
let deferredInstallPrompt = null;
let activeType = 'todos';

function escapeHTML(value='') {
  return String(value).replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
}
function loadFavorites(){
  try { return new Set(JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]')); }
  catch { return new Set(); }
}
function saveFavorites(set){ localStorage.setItem(FAVORITES_KEY, JSON.stringify([...set])); }
function getProgress(item){
  try {
    const data = JSON.parse(localStorage.getItem(READER_PREFIX + item.id) || 'null');
    if (!data || !data.total || !data.currentPage) return null;
    const progressPage = data.lastPage || data.currentPage;
    const percent = Math.max(0, Math.min(100, Math.round((progressPage / data.total) * 100)));
    return {...data, percent};
  } catch { return null; }
}
function renderFeatured(){
  const item = LIVROS[2] || LIVROS[0] || ITEMS[0];
  if(!item) return;
  document.getElementById('featuredTitle').textContent = item.title;
  document.getElementById('featuredDesc').textContent = item.desc;
  document.getElementById('featuredAction').textContent = `${TYPES[item.type]?.action || 'abrir'} agora →`;
  const link = document.getElementById('featuredLink');
  link.href = item.path;
  const img = document.getElementById('featuredImg');
  if(item.thumb){ img.src = item.thumb; img.alt = `Capa de ${item.title}`; }
  else { img.hidden = true; }
}
function cardHTML(item){
  const meta = TYPES[item.type] || TYPES.jogo;
  const progress = item.type === 'livro' ? getProgress(item) : null;
  const favorites = loadFavorites();
  const isFav = favorites.has(item.id);
  const thumb = item.thumb
    ? `<div class="card-thumb"><img src="${escapeHTML(item.thumb)}" alt="Capa de ${escapeHTML(item.title)}" loading="lazy"></div>`
    : `<div class="card-thumb card-thumb-placeholder"><span>${meta.icon}</span></div>`;
  const progressHTML = progress ? `
    <div class="book-progress" aria-label="Progresso de leitura: ${progress.percent}%">
      <div class="book-progress-row"><span>página ${progress.currentPage} de ${progress.total}</span><strong>${progress.percent}%</strong></div>
      <div class="progress-track"><span style="width:${progress.percent}%"></span></div>
    </div>` : '';
  return `
    <article class="card" style="--accent:${item.accent}" data-id="${escapeHTML(item.id)}">
      <button class="favorite-btn${isFav?' active':''}" type="button" data-favorite="${escapeHTML(item.id)}" aria-label="${isFav?'Remover dos':'Adicionar aos'} favoritos" aria-pressed="${isFav}">♥</button>
      <a class="card-main" href="${escapeHTML(item.path)}">
        ${thumb}
        <span class="tag"><span class="tag-icon">${meta.icon}</span>${escapeHTML(item.genre)}</span>
        <h2>${escapeHTML(item.title)}</h2>
        <p>${escapeHTML(item.desc)}</p>
        ${progressHTML}
        <span class="play">▶ ${progress ? 'continuar' : meta.action}</span>
      </a>
      ${OFFLINE_ASSETS[item.id] ? `<button class="download-btn${localStorage.getItem(OFFLINE_KEY+item.id)==='1'?' downloaded':''}" type="button" data-download="${escapeHTML(item.id)}">${localStorage.getItem(OFFLINE_KEY+item.id)==='1'?'✓ offline':'⬇ baixar'}</button>` : ''}
    </article>`;
}
function renderItems(list){
  const grid = document.getElementById('games');
  const empty = document.getElementById('emptyState');
  const meta = document.getElementById('resultsMeta');
  if(activeType === 'jogo'){
    const groups = new Map();
    list.forEach(item => {
      const key = item.category || 'outros';
      if(!groups.has(key)) groups.set(key, []);
      groups.get(key).push(item);
    });
    const ordered = [...groups.entries()].sort((a,b) => (GAME_CATEGORIES[a[0]]?.order||99)-(GAME_CATEGORIES[b[0]]?.order||99));
    grid.innerHTML = ordered.map(([key,items]) => {
      const c = GAME_CATEGORIES[key] || GAME_CATEGORIES.outros;
      return `<section class="game-category" data-category="${escapeHTML(key)}">
        <div class="game-category-head"><div><span class="game-category-icon">${c.icon}</span><h2>${escapeHTML(c.label)}</h2></div><span>${items.length} ${items.length===1?'jogo':'jogos'}</span></div>
        <div class="game-category-grid">${items.map(cardHTML).join('')}</div>
      </section>`;
    }).join('');
  } else {
    grid.innerHTML = `<div class="main-grid">${list.map(cardHTML).join('')}</div>`;
  }
  empty.style.display = list.length ? 'none' : 'block';
  meta.textContent = list.length ? `${list.length} ${list.length === 1 ? 'item encontrado' : 'itens encontrados'}` : '';
}
function renderTypeTabs(){
  const present = new Set(ITEMS.map(i => i.type));
  const tabs = ['todos', ...TYPE_ORDER.filter(t => present.has(t))];
  document.getElementById('typeTabs').innerHTML = tabs.map(t => {
    const label = t === 'todos' ? 'todos' : TYPES[t].label;
    const icon = t === 'todos' ? '★' : TYPES[t].icon;
    return `<button class="type-btn${t===activeType?' active':''}" data-type="${t}" type="button">${icon} ${label}</button>`;
  }).join('');
}
function renderGenreFilters(){
  const pool = activeType === 'todos' ? ITEMS : ITEMS.filter(i => i.type === activeType);
  if(activeType === 'jogo'){
    const categories = [...new Set(pool.map(i => i.category || 'outros'))]
      .sort((a,b)=>(GAME_CATEGORIES[a]?.order||99)-(GAME_CATEGORIES[b]?.order||99));
    document.getElementById('filters').innerHTML = ['todos', ...categories].map((g,i) => {
      const c = g === 'todos' ? {label:'Todos os jogos',icon:'🎮'} : (GAME_CATEGORIES[g] || GAME_CATEGORIES.outros);
      return `<button class="filter-btn${i===0?' active':''}" data-genre="${escapeHTML(g)}" type="button">${c.icon} ${escapeHTML(c.label)}</button>`;
    }).join('');
    return;
  }
  const genres = ['todos', ...new Set(pool.map(i => i.genre))];
  document.getElementById('filters').innerHTML = genres.map((g,i) =>
    `<button class="filter-btn${i===0?' active':''}" data-genre="${escapeHTML(g)}" type="button">${escapeHTML(g)}</button>`
  ).join('');
}
function sortByTypeOrder(list){
  const favorites = loadFavorites();
  return [...list].sort((a,b) => {
    const favDiff = Number(favorites.has(b.id)) - Number(favorites.has(a.id));
    if(favDiff) return favDiff;
    return TYPE_ORDER.indexOf(a.type) - TYPE_ORDER.indexOf(b.type);
  });
}
function normalize(text=''){
  return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
}
function applyFilters(){
  const term = normalize(document.getElementById('search').value.trim());
  const activeBtn = document.querySelector('.filter-btn.active');
  const genre = activeBtn ? activeBtn.dataset.genre : 'todos';
  const filtered = ITEMS.filter(i => {
    const searchable = normalize([i.title, i.desc, i.genre, i.category, i.type, TYPES[i.type]?.label, GAME_CATEGORIES[i.category]?.label].join(' '));
    return (activeType === 'todos' || i.type === activeType)
      && (genre === 'todos' || (activeType === 'jogo' ? (i.category || 'outros') === genre : i.genre === genre))
      && (!term || searchable.includes(term));
  });
  renderItems(sortByTypeOrder(filtered));
}
function renderContinueReading(){
  const section = document.getElementById('continueSection');
  const grid = document.getElementById('continueGrid');
  const entries = LIVROS.map(item => ({item, progress:getProgress(item)}))
    .filter(x => x.progress && x.progress.currentPage > 1 && x.progress.percent < 100)
    .sort((a,b) => (b.progress.updatedAt || 0) - (a.progress.updatedAt || 0));
  section.hidden = entries.length === 0;
  if(!entries.length){ grid.innerHTML=''; return; }
  grid.innerHTML = entries.map(({item,progress}) => `
    <a class="continue-card" href="${escapeHTML(item.path)}" style="--accent:${item.accent}">
      ${item.thumb ? `<img src="${escapeHTML(item.thumb)}" alt="">` : ''}
      <div><span class="eyebrow">${progress.percent}% concluído</span><strong>${escapeHTML(item.title)}</strong>
      <span>Continuar da página ${progress.currentPage}</span><div class="progress-track"><span style="width:${progress.percent}%"></span></div></div>
    </a>`).join('');
}
function toggleFavorite(id, button){
  const favorites = loadFavorites();
  favorites.has(id) ? favorites.delete(id) : favorites.add(id);
  saveFavorites(favorites);
  const isFav = favorites.has(id);
  button.classList.toggle('active', isFav);
  button.setAttribute('aria-pressed', String(isFav));
  button.setAttribute('aria-label', `${isFav?'Remover dos':'Adicionar aos'} favoritos`);
  applyFilters();
}

function downloadOffline(id, btn){
  if(!('serviceWorker' in navigator) || !OFFLINE_ASSETS[id]){
    alert('O download offline precisa ser usado pelo site publicado em HTTPS.');
    return;
  }
  const downloaded = localStorage.getItem(OFFLINE_KEY + id) === '1';
  navigator.serviceWorker.ready.then(reg => {
    const sw = reg.active || navigator.serviceWorker.controller;
    if(!sw) return;
    btn.disabled = true;
    btn.textContent = downloaded ? 'removendo...' : 'baixando...';
    sw.postMessage({type: downloaded ? 'REMOVE' : 'DOWNLOAD', id, urls: OFFLINE_ASSETS[id]});
  });
}

if('serviceWorker' in navigator){
  window.addEventListener('load', async () => {
    try {
      // limpa caches da versão que causou o problema no GitHub Pages
      const names = await caches.keys();
      await Promise.all(names.filter(n => n.startsWith('nexora-') && n !== 'nexora-shell-v11' && n !== 'nexora-content-v11').map(n => caches.delete(n)));
      await navigator.serviceWorker.register('./sw.js', {updateViaCache:'none'});
    } catch(err){ console.warn('PWA:', err); }
  });
}
window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  deferredInstallPrompt = e;
  const b = document.getElementById('installApp');
  if(b) b.hidden = false;
});
window.addEventListener('appinstalled', () => {
  const b = document.getElementById('installApp');
  if(b) b.hidden = true;
  deferredInstallPrompt = null;
});

document.addEventListener('DOMContentLoaded', () => {
  renderFeatured();
  renderContinueReading();
  renderTypeTabs();
  renderGenreFilters();
  renderItems(sortByTypeOrder(ITEMS));
  const installBtn = document.getElementById('installApp');
  installBtn?.addEventListener('click', async () => {
    if(!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    installBtn.hidden = true;
  });
  navigator.serviceWorker?.addEventListener('message', e => {
    const d = e.data || {};
    const btn = document.querySelector(`[data-download="${d.id}"]`);
    if(d.type === 'PROGRESS' && btn) btn.textContent = `${Math.round(d.done/d.total*100)}%`;
    if(d.type === 'DOWNLOADED'){
      localStorage.setItem(OFFLINE_KEY+d.id,'1');
      if(btn){ btn.disabled=false; btn.classList.add('downloaded'); btn.textContent='✓ offline'; }
    }
    if(d.type === 'REMOVED'){
      localStorage.removeItem(OFFLINE_KEY+d.id);
      if(btn){ btn.disabled=false; btn.classList.remove('downloaded'); btn.textContent='⬇ baixar'; }
    }
    if(d.type === 'DOWNLOAD_ERROR'){
      if(btn){ btn.disabled=false; btn.textContent='tentar de novo'; }
      alert('Não foi possível concluir o download. Verifique a internet e tente novamente.');
    }
  });
  document.getElementById('search').addEventListener('input', applyFilters);
  document.getElementById('typeTabs').addEventListener('click', e => {
    const btn=e.target.closest('.type-btn'); if(!btn) return;
    activeType=btn.dataset.type;
    document.querySelectorAll('.type-btn').forEach(b=>b.classList.remove('active')); btn.classList.add('active');
    renderGenreFilters(); applyFilters();
  });
  document.getElementById('filters').addEventListener('click', e => {
    const btn=e.target.closest('.filter-btn'); if(!btn) return;
    document.querySelectorAll('.filter-btn').forEach(b=>b.classList.remove('active')); btn.classList.add('active'); applyFilters();
  });
  document.getElementById('games').addEventListener('click', e => {
    const dl = e.target.closest('[data-download]');
    if(dl){ e.preventDefault(); e.stopPropagation(); downloadOffline(dl.dataset.download, dl); return; }
    const btn=e.target.closest('[data-favorite]'); if(!btn) return;
    e.preventDefault(); e.stopPropagation(); toggleFavorite(btn.dataset.favorite, btn);
  });
  document.getElementById('clearProgress').addEventListener('click', () => {
    if(!confirm('Limpar o progresso salvo de todos os livros?')) return;
    Object.keys(localStorage).filter(k=>k.startsWith(READER_PREFIX)).forEach(k=>localStorage.removeItem(k));
    renderContinueReading(); applyFilters();
  });
  window.addEventListener('pageshow', () => { renderContinueReading(); applyFilters(); });
});
