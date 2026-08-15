// ============================================================
// ⭐ FAME SYSTEM — Mecânica do Zé
// Sistema autônomo de tiers de fama.
//
// Mantém 100% da lógica original.
// Emite EventBus: 'fame:tierUp' { tier, prev, index }
// Requer: eventBus.js carregado antes.
// ============================================================

const FAME_TIERS = [
  { min: 0,    max: 9,     name: "Desconhecida", emoji: "🪨",    color: "#6b7280", desc: "Ninguém te conhece ainda.",              spawnBonus: 0.00, priceBonus: 0.00, vipChance: 0.00, patienceBonus: 0.00 },
  { min: 10,   max: 24,    name: "Novata",        emoji: "🔩",    color: "#a3a3a3", desc: "Carros chegam um pouco mais rápido.",    spawnBonus: 0.08, priceBonus: 0.05, vipChance: 0.00, patienceBonus: 0.05 },
  { min: 25,   max: 49,    name: "Conhecida",     emoji: "🔧",    color: "#78c7f0", desc: "Clientes recomendam sua oficina.",       spawnBonus: 0.18, priceBonus: 0.10, vipChance: 0.03, patienceBonus: 0.10 },
  { min: 50,   max: 99,    name: "Respeitada",    emoji: "⭐",    color: "#fbbf24", desc: "Clientes VIP aparecem às vezes.",        spawnBonus: 0.30, priceBonus: 0.18, vipChance: 0.07, patienceBonus: 0.18 },
  { min: 100,  max: 199,   name: "Popular",       emoji: "🌟",    color: "#f59e0b", desc: "VIPs frequentes, preços melhores.",     spawnBonus: 0.42, priceBonus: 0.28, vipChance: 0.14, patienceBonus: 0.28 },
  { min: 200,  max: 349,   name: "Famosa",        emoji: "💫",    color: "#fb923c", desc: "Fila de espera constante!",             spawnBonus: 0.55, priceBonus: 0.40, vipChance: 0.22, patienceBonus: 0.40 },
  { min: 350,  max: 499,   name: "Renomada",      emoji: "🏆",    color: "#ef4444", desc: "Clientes de outras cidades chegam.",    spawnBonus: 0.68, priceBonus: 0.55, vipChance: 0.30, patienceBonus: 0.55 },
  { min: 500,  max: 699,   name: "Lendária",      emoji: "🔥",    color: "#dc2626", desc: "Carros de luxo entram na fila!",        spawnBonus: 0.80, priceBonus: 0.72, vipChance: 0.40, patienceBonus: 0.70 },
  { min: 700,  max: 899,   name: "Épica",         emoji: "💎",    color: "#a855f7", desc: "Você é uma lenda do asfalto.",          spawnBonus: 0.90, priceBonus: 0.90, vipChance: 0.52, patienceBonus: 0.88 },
  { min: 900,  max: 999,   name: "Mítica",        emoji: "👑",    color: "#8b5cf6", desc: "Nível máximo quase atingido!",          spawnBonus: 0.96, priceBonus: 1.05, vipChance: 0.62, patienceBonus: 1.05 },
  { min: 1000, max: 99999, name: "IMORTAL",       emoji: "⚡👑",  color: "#ffd700", desc: "A oficina mais famosa do universo!",    spawnBonus: 1.00, priceBonus: 1.25, vipChance: 0.75, patienceBonus: 1.25 },
];

// Vars globais lidas pelo engine.js (draw da animação de tier-up)
let _lastTierIdx = 0;
let _tierUpAnim  = null;

const FameSystem = {
  getTier(rep) {
    for (let i = FAME_TIERS.length - 1; i >= 0; i--)
      if (rep >= FAME_TIERS[i].min) return FAME_TIERS[i];
    return FAME_TIERS[0];
  },
  getTierIndex(rep) {
    for (let i = FAME_TIERS.length - 1; i >= 0; i--)
      if (rep >= FAME_TIERS[i].min) return i;
    return 0;
  },
  getProgress(rep) {
    const t = this.getTier(rep);
    if (t.max >= 99999) return 1;
    return Math.min(1, (rep - t.min) / (t.max - t.min + 1));
  },
  getSpawnDelay() {
    const b  = this.getTier(reputation).spawnBonus || 0;
    const wm = getWeather().spawnMult;
    return Math.max(250, spawnDelay * (1 - b * 0.65) / wm / (window._diffSpawnMult||1));
  },
  getPriceBonus()    { return 1 + (this.getTier(reputation).priceBonus    || 0); },
  getVipChance()     { return     this.getTier(reputation).vipChance      || 0;  },
  getPatienceBonus() { return 1 + (this.getTier(reputation).patienceBonus || 0); },

  calcRepGain(problem, vehicle) {
    const base  = Math.ceil(problem.base / 40);
    const idx   = this.getTierIndex(reputation);
    const scale = Math.max(0.25, 1 - idx * 0.08);
    const vm    = vehicle ? vehicle.repMult : 1;
    return Math.max(1, Math.ceil(base * reputationMult * scale * vm));
  },
  calcRepLoss() {
    const idx  = this.getTierIndex(reputation);
    const base = Math.max(1, 1 + Math.floor(idx * 0.7));
    return window._halfRepLoss ? Math.max(1, Math.floor(base / 2)) : base;
  },
  checkTierUp() {
    const idx = this.getTierIndex(reputation);
    if (idx > _lastTierIdx) {
      const tier = FAME_TIERS[idx];
      _lastTierIdx = idx;
      _tierUpAnim  = { name: tier.name, emoji: tier.emoji, color: tier.color, timer: 280 };
      if (typeof showToast !== 'undefined') showToast(`${tier.emoji} NÍVEL DE FAMA: ${tier.name}!`);
      SFX.missionComplete();
      for (let i = 0; i < 35; i++) {
        const a = Math.random() * Math.PI * 2, s = 1 + Math.random() * 3.5;
        particles.push({
          x: player.x + player.w / 2 + (Math.random() - 0.5) * 300,
          y: player.y + (Math.random() - 0.5) * 300,
          vx: Math.cos(a) * s, vy: Math.sin(a) * s - 1,
          r: 3 + Math.random() * 5, color: tier.color, life: 1, type: "spark",
        });
      }
      EventBus.emit('fame:tierUp', { tier, prev: FAME_TIERS[Math.max(0, idx - 1)], index: idx });
    }
  },
};

// ── Compat globals ─────────────────────────────────────────────────────────────
function getFameTier(rep)       { return FameSystem.getTier(rep); }
function getFameTierIndex(rep)  { return FameSystem.getTierIndex(rep); }
function getFameProgress(rep)   { return FameSystem.getProgress(rep); }
function getFameSpawnDelay()    { return FameSystem.getSpawnDelay(); }
function getFamePriceBonus()    { return FameSystem.getPriceBonus(); }
function getFameVipChance()     { return FameSystem.getVipChance(); }
function getFamePatienceBonus() { return FameSystem.getPatienceBonus(); }
function calcRepGain(p, v)      { return FameSystem.calcRepGain(p, v); }
function calcRepLoss()          { return FameSystem.calcRepLoss(); }
function checkTierUp()          { FameSystem.checkTierUp(); }
