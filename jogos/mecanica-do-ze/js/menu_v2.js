// ============================================================
// MENU V2 — Dificuldade, Conquistas, Opções, Gráficos, Sons, Créditos
// Desenvolvido por Luis Paulo Alves
// ============================================================

// ── DIFFICULTY ───────────────────────────────────────────────
let currentDifficulty = 'normal';

const DIFFICULTY_PRESETS = {
  facil:  { patienceMult: 1.5,  partsCostMult: 0.7,  spawnMult: 0.8,  moneyMult: 0.9  },
  normal: { patienceMult: 1.0,  partsCostMult: 1.0,  spawnMult: 1.0,  moneyMult: 1.0  },
  dificil:{ patienceMult: 0.65, partsCostMult: 1.5,  spawnMult: 1.25, moneyMult: 1.15 },
  insano: { patienceMult: 0.4,  partsCostMult: 2.2,  spawnMult: 1.6,  moneyMult: 1.3  },
};

function openDifficulty() {
  document.getElementById('difficulty-screen').style.display = 'flex';
  // Highlight active
  document.querySelectorAll('.diff-card').forEach(c => {
    c.classList.toggle('active', c.dataset.diff === currentDifficulty);
  });
  if(typeof SFX !== 'undefined') SFX.uiClick();
}

function closeDifficulty() {
  document.getElementById('difficulty-screen').style.display = 'none';
  if(typeof SFX !== 'undefined') SFX.uiClick();
}

function selectDifficulty(diff) {
  currentDifficulty = diff;
  localStorage.setItem('mecanicaze_difficulty', diff);
  document.querySelectorAll('.diff-card').forEach(c => {
    c.classList.toggle('active', c.dataset.diff === diff);
  });
  const names = { facil:'Fácil', normal:'Normal', dificil:'Difícil', insano:'Insano' };
  const el = document.querySelector('#difficulty-screen .panel-subtitle');
  if(el) el.textContent = `Dificuldade selecionada: ${names[diff]}`;
  if(typeof SFX !== 'undefined') SFX.uiClick();
}

// Apply difficulty to game vars (called at game start)
window.applyDifficulty = function() {
  const d = DIFFICULTY_PRESETS[currentDifficulty] || DIFFICULTY_PRESETS.normal;
  // Adjust patience via global multiplier
  window._diffPatienceMult = d.patienceMult;
  window._diffPartsCostMult = d.partsCostMult;
  window._diffSpawnMult = d.spawnMult;
  window._diffMoneyMult = d.moneyMult;
};

// ── ACHIEVEMENTS ─────────────────────────────────────────────
// ── ACHIEVEMENTS — usa ACHIEVEMENTS[] do engine.js (sistema unificado) ────────

function showAchievementToast(ach) {
  const banner = document.createElement('div');
  banner.className = 'ach-toast';
  banner.innerHTML = `<span class="ach-toast-icon">${ach.emoji||ach.icon}</span><div><div class="ach-toast-title">CONQUISTA DESBLOQUEADA!</div><div class="ach-toast-name">${ach.name}</div></div>`;
  document.body.appendChild(banner);
  setTimeout(() => banner.classList.add('ach-toast-show'), 50);
  setTimeout(() => { banner.classList.remove('ach-toast-show'); setTimeout(() => banner.remove(), 600); }, 3500);
  if(typeof SFX !== 'undefined') SFX.missionComplete();
}

function openAchievements() {
  // Carrega conquistas do localStorage para mostrar no menu principal
  if(typeof loadAchievementsFromStorage === 'function') loadAchievementsFromStorage();
  if(typeof checkAchievements === 'function') checkAchievements();
  renderAchievements();
  document.getElementById('achievements-screen').style.display = 'flex';
  if(typeof SFX !== 'undefined') SFX.uiClick();
}

function closeAchievements() {
  document.getElementById('achievements-screen').style.display = 'none';
  if(typeof SFX !== 'undefined') SFX.uiClick();
}

function renderAchievements() {
  const container = document.getElementById('achievements-list');
  if(!container) return;
  container.innerHTML = '';
  const list = (typeof ACHIEVEMENTS !== 'undefined') ? ACHIEVEMENTS : [];
  let unlocked = 0;
  list.forEach(a => {
    if(a.done) unlocked++;
    const div = document.createElement('div');
    div.className = 'ach-card' + (a.done ? ' unlocked' : ' locked');
    const rewardLabel = a.reward ? ` <span style="color:#fbbf24;font-size:9px;">+$${a.reward}</span>` : '';
    div.innerHTML = `
      <div class="ach-icon">${a.done ? (a.emoji||'🏅') : '🔒'}</div>
      <div class="ach-info">
        <div class="ach-name">${a.done ? a.name : '???'}${a.done ? rewardLabel : ''}</div>
        <div class="ach-desc">${a.done ? a.desc : 'Conquista bloqueada'}</div>
      </div>
      ${a.done ? '<div class="ach-check">✔</div>' : ''}
    `;
    container.appendChild(div);
  });
  const pct = list.length ? Math.round(unlocked / list.length * 100) : 0;
  const txt = document.getElementById('ach-progress-text');
  const fill = document.getElementById('ach-progress-fill');
  if(txt)  txt.textContent  = `${unlocked} / ${list.length} desbloqueadas`;
  if(fill) fill.style.width = pct + '%';
}

setInterval(() => { if(typeof fixCount !== 'undefined' && typeof checkAchievements === 'function') checkAchievements(); }, 5000);

// ── OPTIONS ───────────────────────────────────────────────────
let graphicsQuality = 'media';
let particlesEnabled = true;
let vignetteEnabled = true;
let currentRatio = 'livre';

function openOptions() {
  document.getElementById('options-screen').style.display = 'flex';
  if(typeof SFX !== 'undefined') SFX.uiClick();
}

function closeOptions() {
  document.getElementById('options-screen').style.display = 'none';
  if(typeof SFX !== 'undefined') SFX.uiClick();
}

function setActivePill(containerId, activeValue, allValues) {
  const container = document.getElementById(containerId);
  if(!container) return;
  container.querySelectorAll('.opt-pill').forEach((btn, i) => {
    btn.classList.toggle('active', allValues[i] === activeValue);
  });
}

function setGraphicsQuality(q) {
  graphicsQuality = q;
  localStorage.setItem('mecanicaze_quality', q);
  setActivePill('quality-btns', q, ['baixa', 'media', 'alta']);
  // Apply: reduce particle count, shadow fidelity etc.
  window._graphicsQuality = q;
  if(typeof window.resizeGameCanvas==='function') window.resizeGameCanvas();
  if(typeof SFX !== 'undefined') SFX.uiClick();
}

function setParticles(s) {
  particlesEnabled = s === 'ligado';
  localStorage.setItem('mecanicaze_particles', s);
  setActivePill('particles-btns', s, ['desligado', 'ligado']);
  window._particlesEnabled = particlesEnabled;
  if(typeof SFX !== 'undefined') SFX.uiClick();
}

function setVignette(s) {
  vignetteEnabled = s === 'ligado';
  localStorage.setItem('mecanicaze_vignette', s);
  setActivePill('vignette-btns', s, ['desligado', 'ligado']);
  window._vignetteEnabled = vignetteEnabled;
  if(typeof SFX !== 'undefined') SFX.uiClick();
}

function setAspectRatio(ratio) {
  currentRatio = ratio;
  window._aspectRatio = ratio;
  localStorage.setItem('mecanicaze_ratio', ratio);
  setActivePill('ratio-btns', ratio, ['livre', '16:9', '4:3', '21:9']);
  applyAspectRatio(ratio);
  if(typeof SFX !== 'undefined') SFX.uiClick();
}

function applyAspectRatio(ratio) {
  window._aspectRatio = ratio;
  if(typeof window.resizeGameCanvas === 'function') window.resizeGameCanvas();
}

function setFpsCap(v){
  const val=Number(v)||0; window._fpsCap=val; localStorage.setItem('mecanicaze_fps',String(val));
  setActivePill('fps-btns', val, [30,60,0]);
  if(typeof SFX!=='undefined')SFX.uiClick();
}
function setVibration(s){
  const enabled=s==='ligado'; window._vibrationEnabled=enabled; localStorage.setItem('mecanicaze_vibration',s);
  setActivePill('vibration-btns',s,['desligado','ligado']);
  if(enabled&&navigator.vibrate)navigator.vibrate(15);
}

function setMasterVolume(v) {
  v = Number(v);
  localStorage.setItem('mecanicaze_vol_master', String(v));
  document.getElementById('opt-vol-master-val').textContent = v + '%';
  if(typeof SFX !== 'undefined') SFX.setVolume(v / 100);
  // sync main slider
  const mainSlider = document.getElementById('vol-slider');
  if(mainSlider) { mainSlider.value = v; mainSlider.style.setProperty('--v', v + '%'); }
}

function setSfxVolume(v) {
  v = Number(v);
  localStorage.setItem('mecanicaze_vol_sfx', String(v));
  document.getElementById('opt-vol-sfx-val').textContent = v + '%';
  window._sfxVolume = v / 100;
  if(typeof SFX !== 'undefined' && SFX.setSfxVolume) SFX.setSfxVolume(window._sfxVolume);
}


function setAmbientVolume(v) {
  v = Number(v);
  localStorage.setItem('mecanicaze_vol_ambient', String(v));
  document.getElementById('opt-vol-amb-val').textContent = v + '%';
  window._ambientVolume = v / 100;
  if(typeof SFX !== 'undefined' && SFX.setAmbientVolume) SFX.setAmbientVolume(window._ambientVolume);
}


function setMuteAll(muted) {
  setActivePill('mute-btns', muted ? 'sim' : 'nao', ['sim', 'nao']);
  if(typeof SFX !== 'undefined') SFX.setMuted(muted);
  const btn = document.getElementById('sound-toggle');
  if(btn) { btn.textContent = muted ? '🔇' : '🔊'; btn.classList.toggle('muted', muted); }
}

// ── CREDITS ───────────────────────────────────────────────────
let _creditsScrollInterval = null;

function openCredits() {
  document.getElementById('credits-screen').style.display = 'flex';
  const scroll = document.getElementById('credits-scroll');
  const wrap = document.querySelector('.credits-scroll-wrap');
  if(scroll && wrap) {
    scroll.style.transform = 'translateY(0)';
    clearInterval(_creditsScrollInterval);
    let pos = 0;
    _creditsScrollInterval = setInterval(() => {
      pos += 0.5;
      const maxScroll = scroll.scrollHeight - wrap.clientHeight;
      if(pos > maxScroll + 60) pos = 0;
      scroll.style.transform = `translateY(-${pos}px)`;
    }, 16);
  }
  if(typeof SFX !== 'undefined') SFX.uiClick();
}

function closeCredits() {
  clearInterval(_creditsScrollInterval);
  document.getElementById('credits-screen').style.display = 'none';
  if(typeof SFX !== 'undefined') SFX.uiClick();
}

// ── EXPOSE GLOBALLY ───────────────────────────────────────────
window.openDifficulty   = openDifficulty;
window.closeDifficulty  = closeDifficulty;
window.selectDifficulty = selectDifficulty;
window.openAchievements = openAchievements;
window.closeAchievements= closeAchievements;
window.openOptions      = openOptions;
window.closeOptions     = closeOptions;
window.setGraphicsQuality = setGraphicsQuality;
window.setParticles     = setParticles;
window.setVignette      = setVignette;
window.setAspectRatio   = setAspectRatio;
window.setFpsCap       = setFpsCap;
window.setVibration    = setVibration;
window.applyAspectRatio = applyAspectRatio;
window.setMasterVolume  = setMasterVolume;
window.setSfxVolume     = setSfxVolume;
window.setAmbientVolume = setAmbientVolume;
window.setMuteAll       = setMuteAll;
window.openCredits      = openCredits;
window.closeCredits     = closeCredits;
// checkAchievements é exposta pelo engine.js quando estiver carregada; não referenciar antes disso.

// ── LOAD SAVED SETTINGS ───────────────────────────────────────
(function loadSettings() {
  const diff = localStorage.getItem('mecanicaze_difficulty') || 'normal';
  currentDifficulty = diff;
  const q = localStorage.getItem('mecanicaze_quality') || 'media';
  graphicsQuality = q;
  window._graphicsQuality = q;
  const particles = localStorage.getItem('mecanicaze_particles') || 'ligado';
  particlesEnabled = particles === 'ligado';
  window._particlesEnabled = particlesEnabled;
  const vignette = localStorage.getItem('mecanicaze_vignette') || 'ligado';
  vignetteEnabled = vignette === 'ligado';
  window._vignetteEnabled = vignetteEnabled;
  const ratio = localStorage.getItem('mecanicaze_ratio') || 'livre';
  currentRatio = ratio; window._aspectRatio = ratio;
  const fps = Number(localStorage.getItem('mecanicaze_fps') || 0); window._fpsCap=fps;
  const vibration = localStorage.getItem('mecanicaze_vibration') || 'ligado'; window._vibrationEnabled=vibration==='ligado';
  const master = Number(localStorage.getItem('mecanicaze_vol_master') || 70);
  const sfx = Number(localStorage.getItem('mecanicaze_vol_sfx') || 80);
  const ambient = Number(localStorage.getItem('mecanicaze_vol_ambient') || 50);
  window._sfxVolume = sfx / 100;
  window._ambientVolume = ambient / 100;

  const applyUi = () => {
    setActivePill('quality-btns', q, ['baixa','media','alta']);
    setActivePill('particles-btns', particles, ['desligado','ligado']);
    setActivePill('vignette-btns', vignette, ['desligado','ligado']);
    setActivePill('ratio-btns', ratio, ['livre','16:9','4:3','21:9']);
    setActivePill('fps-btns', fps, [30,60,0]);
    setActivePill('vibration-btns', vibration, ['desligado','ligado']);
    [['opt-vol-master',master],['opt-vol-sfx',sfx],['opt-vol-amb',ambient]].forEach(([id,val])=>{ const el=document.getElementById(id); if(el) el.value=val; });
    const mv=document.getElementById('opt-vol-master-val'); if(mv) mv.textContent=master+'%';
    const sv=document.getElementById('opt-vol-sfx-val'); if(sv) sv.textContent=sfx+'%';
    const av=document.getElementById('opt-vol-amb-val'); if(av) av.textContent=ambient+'%';
    const mainSlider=document.getElementById('vol-slider'); if(mainSlider){ mainSlider.value=master; mainSlider.style.setProperty('--v', master+'%'); }
    applyAspectRatio(ratio);
    if(typeof SFX !== 'undefined'){ SFX.setVolume(master/100); if(SFX.setSfxVolume) SFX.setSfxVolume(sfx/100); if(SFX.setAmbientVolume) SFX.setAmbientVolume(ambient/100); }
  };
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', applyUi, {once:true}); else applyUi();
  if(typeof loadAchievements === 'function') loadAchievements();
})();

// ── v2.0 PARTS SHOP MODAL ────────────────────────────────────────────────────
const _origOpenPartsShop = window.openPartsShop;
window.openPartsShop = function(){
  const modal = document.getElementById("parts-shop-modal");
  if(!modal) return;
  modal.style.display = "flex";
  const bal = document.getElementById("shop-balance");
  if(bal) bal.textContent = "$" + (typeof money!=='undefined'?money:0);
  if(window.renderPartsShop) window.renderPartsShop();
};
window.closePartsShop = function(){
  const modal = document.getElementById("parts-shop-modal");
  if(modal) modal.style.display = "none";
};

// Update balance when shop is open
setInterval(()=>{
  const modal = document.getElementById("parts-shop-modal");
  if(modal && modal.style.display === "flex"){
    const bal = document.getElementById("shop-balance");
    if(bal) bal.textContent = "$" + (typeof money!=='undefined'?money:0);
  }
}, 500);

// ── v2.0 DAY REPORT MODAL ─────────────────────────────────────────────────────
window.openDayReport = function(){
  const modal = document.getElementById("day-report-modal");
  if(!modal) return;
  modal.style.display = "flex";
  if(window.renderDayReport) window.renderDayReport();
};
window.closeDayReport = function(){
  const modal = document.getElementById("day-report-modal");
  if(modal) modal.style.display = "none";
  if(window.dayReportData) window.dayReportData = null;
};



// ── Fechamento consistente de telas/modais ───────────────────────────────
(function bindOverlayClose(){
  const closers = {
    'difficulty-screen': closeDifficulty, 'achievements-screen': closeAchievements,
    'options-screen': closeOptions, 'credits-screen': closeCredits,
    'parts-shop-modal': () => window.closePartsShop && window.closePartsShop(),
    'day-report-modal': () => window.closeDayReport && window.closeDayReport()
  };
  function bind(){
    Object.entries(closers).forEach(([id,fn])=>{
      const el=document.getElementById(id); if(!el || el.dataset.boundBackdrop) return;
      el.dataset.boundBackdrop='1';
      el.addEventListener('click', e=>{ if(e.target===el) fn(); });
    });
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',bind); else bind();
  document.addEventListener('keydown', e=>{
    if(e.key!=='Escape') return;
    const order=['credits-screen','options-screen','achievements-screen','difficulty-screen','parts-shop-modal','day-report-modal'];
    for(const id of order){ const el=document.getElementById(id); if(el && getComputedStyle(el).display!=='none'){ e.stopImmediatePropagation(); e.preventDefault(); closers[id](); return; } }
  }, true);
})();
