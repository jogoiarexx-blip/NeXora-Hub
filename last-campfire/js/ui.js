"use strict";

/* ============================================================
   SCREEN NAVIGATION
============================================================ */
const screens = ['menuScreen','shopScreen','achScreen','settingsScreen','endScreen'];
function showScreen(id){
  screens.forEach(s=>{
    const el = document.getElementById(s);
    if(s===id){ el.classList.remove('hidden'); el.classList.add('active'); }
    else { el.classList.add('hidden'); el.classList.remove('active'); }
  });
}
document.querySelectorAll('[data-close]').forEach(btn=>{
  btn.addEventListener('click', ()=>{ sfx.playClick(); showScreen('menuScreen'); refreshMenu(); });
});

function refreshMenu(){
  document.getElementById('menuCoins').textContent = save.coins;
  document.getElementById('menuCamp').textContent = save.campLevel;
}

/* ---- Shop rendering ---- */
function renderShop(){
  document.getElementById('shopCoins').textContent = save.coins;
  const list = document.getElementById('shopList');
  list.innerHTML='';
  UPGRADES.forEach(def=>{
    const lvl = save.upgrades[def.key]||0;
    const maxed = lvl>=def.maxLv;
    const cost = maxed?0:upgradeCost(def, lvl);
    const row = document.createElement('div');
    row.className='shop-item'+(def.isNew?' shop-item-new':'');
    row.innerHTML = `
      <div class="shop-icon">${def.icon}</div>
      <div class="shop-info">
        <div class="shop-name">${def.name}${def.isNew?' <span class="new-badge">NOVO</span>':''}</div>
        <div class="shop-desc">${def.desc}</div>
        <div class="shop-level">Nível ${lvl}/${def.maxLv}</div>
      </div>
      <button class="shop-buy ${maxed?'maxed':''}">${maxed?'MAX':('🪙 '+cost)}</button>
    `;
    const btn = row.querySelector('.shop-buy');
    btn.addEventListener('click', ()=>{
      if(maxed) return;
      if(save.coins>=cost){
        save.coins -= cost;
        save.upgrades[def.key] = lvl+1;
        persist(); sfx.playClick(); renderShop(); refreshMenu();
      } else {
        sfx.playPop();
        btn.style.background='#5a2323';
        setTimeout(()=>btn.style.background='',200);
      }
    });
    list.appendChild(row);
  });
}

function renderAch(){
  const list = document.getElementById('achList');
  list.innerHTML='';
  ACHIEVEMENTS.forEach(def=>{
    const done = !!save.achievements[def.key];
    const row = document.createElement('div');
    row.className='ach-item'+(done?' done':'');
    row.innerHTML = `<div class="ach-icon">${done?'🏆':'🔒'}</div>
      <div><div class="ach-name">${def.name}</div><div class="ach-desc">${def.desc}</div></div>`;
    list.appendChild(row);
  });
}

document.getElementById('btnPlay').addEventListener('click', ()=>{ sfx.ensure(); sfx.playClick(); startGame(); });
document.getElementById('btnShop').addEventListener('click', ()=>{ sfx.playClick(); renderShop(); showScreen('shopScreen'); });
document.getElementById('btnAch').addEventListener('click', ()=>{ sfx.playClick(); renderAch(); showScreen('achScreen'); });
document.getElementById('btnSettings').addEventListener('click', ()=>{ sfx.playClick(); showScreen('settingsScreen'); });
document.getElementById('btnReset').addEventListener('click', ()=>{
  if(confirm('Tem certeza que deseja apagar todo o progresso?')){
    save = defaultSave(); persist(); refreshMenu();
  }
});
document.getElementById('btnContinue').addEventListener('click', ()=>{
  sfx.playClick(); showScreen('menuScreen'); refreshMenu();
  document.getElementById('hud').classList.add('hidden');
  document.getElementById('pauseBtn').classList.add('hidden');
});
document.getElementById('toggleSound').addEventListener('click', function(){
  save.settings.sound = !save.settings.sound;
  this.classList.toggle('on', save.settings.sound);
  persist();
});
document.getElementById('toggleVibe').addEventListener('click', function(){
  save.settings.vibe = !save.settings.vibe;
  this.classList.toggle('on', save.settings.vibe);
  persist();
});
document.getElementById('volSlider').addEventListener('input', function(){
  save.settings.volume = parseFloat(this.value);
  sfx.setVolume(save.settings.volume);
  persist();
});
document.getElementById('toggleSound').classList.toggle('on', save.settings.sound);
document.getElementById('toggleVibe').classList.toggle('on', save.settings.vibe);
document.getElementById('volSlider').value = save.settings.volume;
document.getElementById('pauseBtn').addEventListener('click', ()=>{
  if(!G.running) return;
  G.paused = !G.paused;
  document.getElementById('pauseBtn').textContent = G.paused?'▶':'⏸';
});

