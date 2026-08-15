const SHELL = 'nexora-shell-v8';
const CONTENT = 'nexora-content-v8';
const SHELL_FILES = [
  './', './index.html', './css/style.css?v=8', './js/data-livros.js?v=8',
  './js/data-jogos.js?v=8', './js/data-apps.js?v=8', './js/offline-assets.js?v=8',
  './js/app.js?v=8', './assets/favicon.png', './assets/logo.png',
  './assets/icon-192.png', './assets/icon-512.png', './manifest.webmanifest?v=8'
];
self.addEventListener('install', event => {
  event.waitUntil((async()=>{
    const cache=await caches.open(SHELL);
    for(const u of SHELL_FILES){ try{ const r=await fetch(u,{cache:'reload'}); if(r.ok) await cache.put(u,r.clone()); }catch(_){} }
    await self.skipWaiting();
  })());
});
self.addEventListener('activate', event => {
  event.waitUntil((async()=>{
    const names=await caches.keys();
    await Promise.all(names.filter(n=>n.startsWith('nexora-') && n!==SHELL && n!==CONTENT).map(n=>caches.delete(n)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', event => {
  if(event.request.method!=='GET') return;
  const url=new URL(event.request.url);
  if(url.origin!==self.location.origin) return;
  const isShell = event.request.mode==='navigate' || /\.(?:js|css|webmanifest)$/.test(url.pathname);
  if(isShell){
    event.respondWith((async()=>{
      try{
        const fresh=await fetch(event.request,{cache:'no-store'});
        if(fresh.ok){ const c=await caches.open(SHELL); c.put(event.request,fresh.clone()); }
        return fresh;
      }catch(_){ return (await caches.match(event.request)) || (event.request.mode==='navigate' ? await caches.match('./index.html') : Response.error()); }
    })());
    return;
  }
  event.respondWith((async()=>{
    const hit=await caches.match(event.request); if(hit) return hit;
    try{ const r=await fetch(event.request); if(r.ok){const c=await caches.open(SHELL); c.put(event.request,r.clone());} return r; }catch(_){return Response.error();}
  })());
});
self.addEventListener('message', event => {
  const d=event.data||{};
  if(d.type==='DOWNLOAD') event.waitUntil((async()=>{try{const c=await caches.open(CONTENT);let done=0;for(const rel of d.urls||[]){const abs=new URL(rel,self.registration.scope).href;const req=new Request(abs,{credentials:'same-origin'});if(!(await c.match(req))){const r=await fetch(req,{cache:'no-store'});if(!r.ok)throw new Error(r.status);await c.put(req,r.clone());}done++;if(done%8===0||done===d.urls.length)event.source?.postMessage({type:'PROGRESS',id:d.id,done,total:d.urls.length});}event.source?.postMessage({type:'DOWNLOADED',id:d.id});}catch(e){event.source?.postMessage({type:'DOWNLOAD_ERROR',id:d.id,error:String(e)});}})());
  if(d.type==='REMOVE') event.waitUntil((async()=>{const c=await caches.open(CONTENT);for(const rel of d.urls||[])await c.delete(new URL(rel,self.registration.scope).href);event.source?.postMessage({type:'REMOVED',id:d.id});})());
});
