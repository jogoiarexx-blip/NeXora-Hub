(() => {
  const cfg = document.body.dataset;
  const id = cfg.bookId;
  const title = cfg.title || document.title;
  const total = Number(cfg.total || 1);
  const prefix = cfg.pagePrefix || 'pages/pagina-';
  const ext = cfg.pageExt || '.jpg';
  const storageKey = `nexora.reader.${id}`;
  const book = document.getElementById('book');
  const counter = document.getElementById('counter');
  const prev = document.getElementById('prev');
  const next = document.getElementById('next');
  const slider = document.getElementById('pageSlider');
  const resume = document.getElementById('resume');
  const resumeText = document.getElementById('resumeText');
  const toast = document.getElementById('toast');
  let current = 1;
  let saved = loadProgress();

  function isMobileSingle(){ return matchMedia('(max-width:520px) and (orientation:portrait)').matches; }
  function pageSrc(n){ return `${prefix}${String(n).padStart(2,'0')}${ext}`; }
  function makePage(n, side){
    const p=document.createElement('div'); p.className=`page ${side}`;
    const img=document.createElement('img'); img.src=pageSrc(n); img.alt=`Página ${n}`; img.loading='eager';
    p.appendChild(img); return p;
  }
  function visiblePages(){
    if(isMobileSingle()) return [current];
    if(current===1) return [1];
    const first = current % 2 === 0 ? current : Math.max(2,current-1);
    return first + 1 <= total ? [first,first+1] : [first];
  }
  function normalizedPage(page){
    page=Math.max(1,Math.min(total,Number(page)||1));
    if(isMobileSingle()) return page;
    if(page===1) return 1;
    return page % 2 === 0 ? page : page-1;
  }
  function saveProgress(){
    const pages=visiblePages();
    const last=pages[pages.length-1];
    localStorage.setItem(storageKey, JSON.stringify({id,title,currentPage:pages[0],lastPage:last,total,updatedAt:Date.now()}));
  }
  function loadProgress(){
    try { return JSON.parse(localStorage.getItem(storageKey) || 'null'); } catch { return null; }
  }
  function render(anim=true){
    current=normalizedPage(current);
    const pages=visiblePages();
    book.innerHTML='';
    book.classList.toggle('mobile-single',isMobileSingle());
    if(pages.length===1) book.appendChild(makePage(pages[0],'single'));
    else {
      book.appendChild(makePage(pages[0],'left'));
      const gutter=document.createElement('div'); gutter.className='gutter'; book.appendChild(gutter);
      book.appendChild(makePage(pages[1],'right'));
    }
    if(anim){book.classList.remove('flip');void book.offsetWidth;book.classList.add('flip')}
    const first=pages[0],last=pages[pages.length-1];
    counter.textContent = first===last ? `página ${first} / ${total}` : `páginas ${first}–${last} / ${total}`;
    slider.value=first; slider.max=total;
    prev.disabled=first<=1; next.disabled=last>=total;
    saveProgress();
  }
  function go(delta){
    const pages=visiblePages();
    if(delta>0){ if(pages.at(-1)>=total) return; current=isMobileSingle()?current+1:(current===1?2:current+2); }
    else { if(pages[0]<=1) return; current=isMobileSingle()?current-1:(current<=2?1:current-2); }
    render(true);
  }
  function showToast(text){ toast.textContent=text; toast.classList.add('show'); clearTimeout(showToast.t); showToast.t=setTimeout(()=>toast.classList.remove('show'),1400); }
  function toggleFullscreen(){
    if(!document.fullscreenElement) document.documentElement.requestFullscreen?.().catch(()=>showToast('Tela cheia indisponível'));
    else document.exitFullscreen?.();
  }
  prev.addEventListener('click',()=>go(-1)); next.addEventListener('click',()=>go(1));
  slider.addEventListener('input',()=>{ current=normalizedPage(slider.value); render(false); });
  document.getElementById('fullscreen').addEventListener('click',toggleFullscreen);
  document.addEventListener('fullscreenchange',()=>{document.getElementById('fullscreen').textContent=document.fullscreenElement?'↙':'⛶'});
  document.addEventListener('keydown',e=>{
    if(['ArrowRight','PageDown',' '].includes(e.key)){e.preventDefault();go(1)}
    if(['ArrowLeft','PageUp'].includes(e.key)){e.preventDefault();go(-1)}
    if(e.key==='Home'){e.preventDefault();current=1;render(true)}
    if(e.key==='End'){e.preventDefault();current=total;render(true)}
    if(e.key==='Escape' && !document.fullscreenElement) location.href='../../index.html';
  });
  let sx=null,sy=null;
  book.addEventListener('pointerdown',e=>{sx=e.clientX;sy=e.clientY});
  book.addEventListener('pointerup',e=>{
    if(sx===null)return; const dx=e.clientX-sx,dy=e.clientY-sy;sx=sy=null;
    if(Math.abs(dx)>45 && Math.abs(dx)>Math.abs(dy)*1.2) go(dx<0?1:-1);
  });
  book.addEventListener('click',e=>{
    if(Math.abs((e.clientX/window.innerWidth)-.5)<.2) return;
    e.clientX > window.innerWidth/2 ? go(1) : go(-1);
  });
  let resizeTimer;
  addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>render(false),120)});

  document.getElementById('resumeContinue').addEventListener('click',()=>{current=normalizedPage(saved.currentPage);resume.hidden=true;render(false)});
  document.getElementById('resumeStart').addEventListener('click',()=>{current=1;resume.hidden=true;render(false)});
  if(saved && saved.currentPage>1 && saved.currentPage<=total){
    resumeText.textContent=`Você parou na página ${saved.currentPage} de ${total}.`;
    resume.hidden=false;
  }
  render(false);
})();
