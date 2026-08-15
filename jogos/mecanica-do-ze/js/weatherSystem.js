// ============================================================
// 🌦️ WEATHER SYSTEM — Mecânica do Zé
// Sistema autônomo com update() próprio.
//
// Mantém 100% da lógica original:
// - weatherState, weatherTimer, weatherDuration, nextWeatherChange
// - WEATHER_TYPES com todos os multiplicadores
// - rainDrops (partículas visuais)
// - rollNextWeather, updateWeather, spawnRainDrops, getWeather
//
// Emite EventBus: 'weather:change' { from, to, weather }
//
// Requer: eventBus.js carregado antes.
// ============================================================

// ── Dados globais que engine.js acessa diretamente ───────────────────────────
let weatherState = "clear";
let weatherTimer = 0, weatherDuration = 0, nextWeatherChange = 1800;
let rainDrops = [];

const WEATHER_TYPES = [
  { id: "clear", icon: "☀️",  label: "Céu Limpo",  spawnMult: 1.0, patienceMult: 1.0,  prob: 0.45 },
  { id: "sun",   icon: "🌤️", label: "Sol Forte",  spawnMult: 0.8, patienceMult: 0.85, prob: 0.25 },
  { id: "rain",  icon: "🌧️", label: "Chuva",      spawnMult: 1.5, patienceMult: 1.1,  prob: 0.20 },
  { id: "storm", icon: "⛈️", label: "Tempestade", spawnMult: 1.9, patienceMult: 1.25, prob: 0.10 },
];

// ── Objeto autônomo ───────────────────────────────────────────────────────────
const WeatherSystem = {

  // ── Leitura ────────────────────────────────────────────────────────────────
  get()  { return WEATHER_TYPES.find(w => w.id === weatherState) || WEATHER_TYPES[0]; },
  isRainy() { return weatherState === "rain" || weatherState === "storm"; },

  // ── Lógica de transição ────────────────────────────────────────────────────
  rollNext() {
    const roll = Math.random();
    let acc = 0;
    for (const w of WEATHER_TYPES) { acc += w.prob; if (roll < acc) return w.id; }
    return "clear";
  },

  spawnRain() {
    rainDrops = [];
    for (let i = 0; i < 200; i++) {
      rainDrops.push({
        x: Math.random() * shopW, y: Math.random() * shopH,
        vy: 8 + Math.random() * 6, vx: -2, len: 12, life: 1,
      });
    }
  },

  // ── update() chamado a cada tick do loop principal ─────────────────────────
  update() {
    weatherTimer++;
    if (weatherTimer >= nextWeatherChange) {
      weatherTimer = 0;
      nextWeatherChange = 1800 + Math.random() * 2400;
      const next = this.rollNext();
      if (next !== weatherState) {
        const prev = weatherState;
        weatherState = next;
        // weatherSeen é do engine.js — acessa como global
        if (typeof weatherSeen !== 'undefined') weatherSeen.add(next);
        const w = this.get();
        if (typeof showToast !== 'undefined') showToast(`${w.icon} ${w.label}!`);
        if (this.isRainy()) this.spawnRain();
        else rainDrops = [];
        EventBus.emit('weather:change', { from: prev, to: next, weather: w });
      }
    }

    // Rain visuals — geração contínua de gotas
    if (this.isRainy()) {
      const rate = weatherState === "storm" ? 8 : 4;
      for (let i = 0; i < rate; i++) {
        rainDrops.push({
          x:   Math.random() * (shopW + 400) - 200,
          y:   -20,
          vy:  8 + Math.random() * 6,
          vx:  -2 - Math.random() * 2,
          len: 12 + Math.random() * 12,
          life: 1,
        });
      }
      rainDrops = rainDrops.filter(r => r.y < shopH + 50);
      if (rainDrops.length > 600) rainDrops.splice(0, rainDrops.length - 600);
    }
  },

  // ── render() — move rain drops (lógica de física das gotas) ────────────────
  // Chamado pelo draw() do engine via drawRain(). Apenas a física;
  // o desenho em canvas continua em drawRain() no engine.js.
  tickDrops() {
    rainDrops.forEach(r => { r.x += r.vx; r.y += r.vy; });
    rainDrops = rainDrops.filter(r => r.y < shopH + 60);
  },
};

// ── Funções globais de compat — engine.js chama estas diretamente ─────────────
function getWeather()      { return WeatherSystem.get(); }
function rollNextWeather() { return WeatherSystem.rollNext(); }
function spawnRainDrops()  { return WeatherSystem.spawnRain(); }
function updateWeather()   { WeatherSystem.update(); }
