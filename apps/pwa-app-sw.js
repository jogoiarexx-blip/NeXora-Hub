const CACHE='nexora-apps-v18';
self.addEventListener('install',e=>e.waitUntil(self.skipWaiting()));
self.addEventListener('activate',e=>e.waitUntil((async()=>{
  const keys=await caches.keys();
  await Promise.all(keys.filter(k=>k.startsWith('nexora-apps-')&&k!==CACHE).map(k=>caches.delete(k)));
  await self.clients.claim();
})()));
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET') return;
  const u=new URL(e.request.url);
  if(u.origin!==self.location.origin) return;
  // Never turn a missing app page into the Hub home page.
  e.respondWith((async()=>{
    const cache=await caches.open(CACHE);
    if(e.request.mode==='navigate'){
      try{const fresh=await fetch(e.request,{cache:'no-store'}); if(fresh.ok) await cache.put(e.request,fresh.clone()); return fresh;}
      catch(_){return (await caches.match(e.request)) || (await caches.match(u.pathname)) || new Response('<h1>App indisponível offline</h1><p>Abra este app uma vez online ou use o botão baixar no NeXora.</p>',{status:503,headers:{'Content-Type':'text/html; charset=utf-8'}});}
    }
    const hit=await caches.match(e.request); if(hit) return hit;
    try{const r=await fetch(e.request); if(r.ok) await cache.put(e.request,r.clone()); return r;}catch(_){return Response.error();}
  })());
});
self.addEventListener('notificationclick',e=>{
  e.notification.close();
  const url=e.notification?.data?.url||'./';
  e.waitUntil(clients.openWindow(url));
});
