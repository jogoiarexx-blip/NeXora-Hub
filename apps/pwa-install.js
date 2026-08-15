(() => {
  const APP_DIR = new URL('./', location.href);
  const APPS_ROOT = new URL('../', APP_DIR);
  const INSTALL_REQUESTED = new URLSearchParams(location.search).get('install') === '1';
  let deferredPrompt = null;

  async function registerSharedSW(){
    if (!('serviceWorker' in navigator) || !location.protocol.startsWith('http')) return;
    try {
      const regs = await navigator.serviceWorker.getRegistrations();
      for (const reg of regs) {
        // Remove only obsolete app-local workers. Keep Hub root and the shared /apps/ worker.
        if (reg.scope.startsWith(APP_DIR.href) && reg.scope !== APPS_ROOT.href) {
          await reg.unregister();
        }
      }
      await navigator.serviceWorker.register('../pwa-app-sw.js', {scope:'../'});
    } catch (e) { console.warn('[NeXora PWA]', e); }
  }

  function addInstallUI(){
    const style=document.createElement('style');
    style.textContent=`#nexoraInstallBtn{position:fixed;right:14px;bottom:14px;z-index:2147483000;border:1px solid rgba(255,255,255,.2);background:#111827;color:#fff;border-radius:999px;padding:11px 16px;font:700 13px system-ui;box-shadow:0 10px 30px rgba(0,0,0,.35);display:none}#nexoraInstallBtn.show{display:block}#nexoraInstallHint{position:fixed;left:12px;right:12px;bottom:70px;z-index:2147482999;background:rgba(10,15,25,.96);color:#fff;border:1px solid rgba(255,255,255,.14);border-radius:14px;padding:12px 14px;font:13px/1.45 system-ui;box-shadow:0 10px 30px rgba(0,0,0,.35);display:none;max-width:520px;margin:auto}#nexoraInstallHint.show{display:block}`;
    document.head.appendChild(style);
    const b=document.createElement('button'); b.id='nexoraInstallBtn'; b.textContent='⬇ Instalar app'; b.type='button';
    const hint=document.createElement('div'); hint.id='nexoraInstallHint'; hint.textContent='Para instalar, abra o menu do navegador e escolha “Instalar app” ou “Adicionar à tela inicial”.';
    document.body.append(b,hint);
    b.addEventListener('click', async()=>{
      if(deferredPrompt){
        deferredPrompt.prompt(); await deferredPrompt.userChoice; deferredPrompt=null; b.classList.remove('show');
      } else { hint.classList.add('show'); setTimeout(()=>hint.classList.remove('show'),6500); }
    });
    window.addEventListener('beforeinstallprompt',e=>{
      e.preventDefault(); deferredPrompt=e; b.classList.add('show');
      if(INSTALL_REQUESTED) setTimeout(()=>b.click(),350);
    });
    window.addEventListener('appinstalled',()=>{ b.classList.remove('show'); hint.classList.remove('show'); });
    if(INSTALL_REQUESTED) setTimeout(()=>b.classList.add('show'),1200);
  }

  registerSharedSW();
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',addInstallUI); else addInstallUI();
})();
