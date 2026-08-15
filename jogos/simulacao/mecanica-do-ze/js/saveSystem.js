// ============================================================
// 💾 SAVE SYSTEM — Mecânica do Zé
// Sistema autônomo de persistência via localStorage.
//
// Encapsula 100% da lógica de save/load original:
// - SAVE_VERSION, getSaveKey, buildSaveData, applySaveData
// - saveToSlot, loadFromSlot, deleteSlot, getSlotInfo
// - showSaveIndicator
// - auto-save a cada 60s
//
// Requer: eventBus.js carregado antes.
// ============================================================

const SaveSystem = (() => {
  const VERSION = 3;

  // ── Chave de storage ────────────────────────────────────────────────────────
  function key(slot) { return `mecanicaze_save_${slot}`; }

  // ── Snapshot do estado atual ────────────────────────────────────────────────
  function buildData() {
    return {
      v: VERSION, date: new Date().toLocaleString('pt-BR'),
      money, reputation, fixCount, carsDone, totalMoneyEarned,
      parts, maxParts, hasAutoOrder, hasHelper,
      playerSpeed, maxStamina, staminaDrain, staminaRegen,
      diagnosticLevel, toolQuality, reputationMult,
      gameMinute, spawnDelay, lastTierIdx: _lastTierIdx,
      hunger, hasCantine, bay1Bought: !!(window._bay1Bought),
      vipCount, rainFixes, truckFixes, motoFixes, loyalCount,
      weatherState,
      partInventory,
      upgrades:      upgradesList.filter(u => u.id).map(u => ({ id: u.id, bought: u.bought })),
      missions:      missions.map(m => ({ type: m.type, done: m.done, progress: m.progress })),
      achievements:  ACHIEVEMENTS.map(a => ({ id: a.id, done: a.done })),
      helpers:       helpers.length,
      bills:         typeof BillsSystem !== 'undefined' ? BillsSystem.getSaveData() : null,
      dayHistory:    typeof dayHistory !== 'undefined' ? dayHistory.slice(-14) : [],
      dayStartMoney: typeof dayStartMoney !== 'undefined' ? dayStartMoney : money,
      dayStartFix:   typeof dayStartFix !== 'undefined' ? dayStartFix : fixCount,
      player:        { x: player.x, y: player.y },
    };
  }

  // ── Aplica dados salvos no estado global ────────────────────────────────────
  function applyData(d) {
    money = d.money ?? 200; reputation = d.reputation ?? 0; fixCount = d.fixCount ?? 0;
    carsDone = d.carsDone ?? 0; totalMoneyEarned = d.totalMoneyEarned ?? money;
    parts = d.parts ?? 20; maxParts = d.maxParts ?? 20;
    hasAutoOrder = d.hasAutoOrder ?? false; hasHelper = d.hasHelper ?? false;
    playerSpeed = d.playerSpeed ?? 3.5; maxStamina = d.maxStamina ?? 100;
    staminaDrain = d.staminaDrain ?? 0.05; staminaRegen = d.staminaRegen ?? 0.04;
    diagnosticLevel = d.diagnosticLevel ?? 1; toolQuality = d.toolQuality ?? 1;
    reputationMult = d.reputationMult ?? 1;
    gameMinute = d.gameMinute ?? 8 * 60; spawnDelay = d.spawnDelay ?? 1800;
    _lastTierIdx = d.lastTierIdx ?? getFameTierIndex(d.reputation ?? 0);
    hunger = d.hunger ?? 100; hasCantine = d.hasCantine ?? false;
    window._bay1Bought = false;
    if (d.bay1Bought) window._bay1Bought = true;
    vipCount = d.vipCount ?? 0; rainFixes = d.rainFixes ?? 0;
    truckFixes = d.truckFixes ?? 0; motoFixes = d.motoFixes ?? 0;
    loyalCount = d.loyalCount ?? 0;
    if (d.weatherState) weatherState = d.weatherState;
    if (d.partInventory) Object.assign(partInventory, d.partInventory);
    if (d.upgrades)
      d.upgrades.forEach(ud => {
        const u = upgradesList.find(x => x.id === ud.id);
        if (u) {
          u.bought = ud.bought;
          // Re-aplica flags especiais ao carregar save
          if (ud.bought && ud.id === 'bay1') window._bay1Bought = true;
        }
      });
    if (d.missions)
      d.missions.forEach(md => {
        const m = missions.find(x => x.type === md.type);
        if (m) { m.done = md.done; m.progress = md.progress; }
      });
    // Restaura efeitos derivados dos upgrades (flags, custos e perfis mutáveis).
    // Evita perder benefícios ao recarregar e evita duplicar os atributos escalares já salvos.
    if (typeof restoreDerivedUpgradeState === 'function') restoreDerivedUpgradeState();

    if (d.achievements)
      d.achievements.forEach(ad => {
        const a = ACHIEVEMENTS.find(x => x.id === ad.id);
        if (a) a.done = ad.done;
      });
    // Sincroniza conquistas do save com localStorage
    if (typeof saveAchievementsToStorage === 'function') saveAchievementsToStorage();
    helpers.length = 0;
    if (d.helpers > 0) for (let i = 0; i < d.helpers; i++) spawnHelper();
    if (d.player) { player.x = d.player.x; player.y = d.player.y; }
    if (d.bills && typeof BillsSystem !== 'undefined') BillsSystem.applySaveData(d.bills);
    if (typeof dayHistory !== 'undefined') dayHistory = Array.isArray(d.dayHistory) ? d.dayHistory.slice(-14) : [];
    if (typeof dayStartMoney !== 'undefined') dayStartMoney = d.dayStartMoney ?? money;
    if (typeof dayStartFix !== 'undefined') dayStartFix = d.dayStartFix ?? fixCount;
  }

  // ── UI de indicador de save ─────────────────────────────────────────────────
  function showIndicator() {
    const el = document.getElementById('save-indicator');
    if (!el) return;
    el.style.opacity = 1;
    setTimeout(() => { el.style.opacity = 0; }, 1800);
  }

  // ── Operações de slot ───────────────────────────────────────────────────────
  function saveToSlot(slot) {
    const data = buildData();
    try {
      localStorage.setItem(key(slot), JSON.stringify(data));
      showIndicator();
      currentSlot = slot;
      EventBus.emit('save:saved', { slot });
    } catch(e) {
      if (typeof showToast !== 'undefined') showToast("Erro ao salvar! 💾");
    }
  }

  function loadFromSlot(slot) {
    try {
      const raw = localStorage.getItem(key(slot));
      if (!raw) return false;
      applyData(JSON.parse(raw));
      currentSlot = slot;
      EventBus.emit('save:loaded', { slot });
      return true;
    } catch(e) { return false; }
  }

  function deleteSlot(slot) {
    localStorage.removeItem(key(slot));
    EventBus.emit('save:deleted', { slot });
  }

  function getSlotInfo(slot) {
    try {
      const raw = localStorage.getItem(key(slot));
      if (!raw) return null;
      return JSON.parse(raw);
    } catch(e) { return null; }
  }

  // ── Auto-save a cada 60s (idêntico ao original) ─────────────────────────────
  setInterval(() => {
    const menuEl = document.getElementById('main-menu');
    if (
      currentSlot !== null &&
      !gamePaused &&
      menuEl && menuEl.style.display === 'none'
    ) {
      saveToSlot(currentSlot);
    }
  }, 60000);

  return { saveToSlot, loadFromSlot, deleteSlot, getSlotInfo, showIndicator };
})();

// ── Compat globals — engine.js e menu_v2.js chamam estas diretamente ──────────
const SAVE_VERSION = 3;

// Expõe as funções internas via wrapper (SaveSystem usa closure)
// menu_v2 e engine chamam saveToSlot/loadFromSlot diretamente
function saveToSlot(slot)    { SaveSystem.saveToSlot(slot); }
function loadFromSlot(slot)  { return SaveSystem.loadFromSlot(slot); }
function deleteSlot(slot)    { SaveSystem.deleteSlot(slot); }
function getSlotInfo(slot)   { return SaveSystem.getSlotInfo(slot); }
function showSaveIndicator() { SaveSystem.showIndicator(); }

// buildSaveData e applySaveData são internos — não são chamados externamente.
// Se algum código legado precisar, os stubs abaixo redirecionam:
function getSaveKey(slot) { return `mecanicaze_save_${slot}`; }
