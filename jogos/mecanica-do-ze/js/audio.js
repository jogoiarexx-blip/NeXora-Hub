// ============================================================
// 🔊 AUDIO SYSTEM — Mecânica do Zé
// Web Audio API procedural — sem arquivos externos.
//
// Expõe o objeto global SFX com todos os efeitos sonoros.
// Conecta-se ao EventBus para reagir a eventos do jogo
// sem acoplar diretamente ao engine.js.
//
// Requer: eventBus.js carregado antes.
// ============================================================

const SFX = (() => {
  let _ctx = null;
  let _master = null;
  let _sfxBus = null;
  let _muted = false;
  let _volume = 0.7;
  let _sfxVolume = Number.isFinite(window._sfxVolume) ? window._sfxVolume : 0.8;
  let _ambientVolume = Number.isFinite(window._ambientVolume) ? window._ambientVolume : 0.5;

  // ── Init / Resume ────────────────────────────────────────────────────────
  function _init() {
    if (_ctx) return true;
    try {
      _ctx = new (window.AudioContext || window.webkitAudioContext)();
      _master = _ctx.createGain();
      _master.gain.value = _volume;
      _sfxBus = _ctx.createGain();
      _sfxBus.gain.value = _sfxVolume;
      _sfxBus.connect(_master);
      _master.connect(_ctx.destination);
      return true;
    } catch(e) { return false; }
  }

  function _resume() {
    if (_ctx && _ctx.state === 'suspended') _ctx.resume();
  }

  // ── Low-level helpers ────────────────────────────────────────────────────
  function _osc(type, freq, start, dur, gainStart, gainEnd, dest) {
    const o = _ctx.createOscillator();
    const g = _ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, start);
    g.gain.setValueAtTime(gainStart, start);
    g.gain.exponentialRampToValueAtTime(Math.max(0.001, gainEnd), start + dur);
    o.connect(g); g.connect(dest || _sfxBus || _master);
    o.start(start); o.stop(start + dur + 0.01);
    return { osc: o, gain: g };
  }

  function _noise(dur, gainVal, filterFreq, dest) {
    const bufSize = _ctx.sampleRate * Math.min(dur, 1);
    const buf = _ctx.createBuffer(1, bufSize, _ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
    const src = _ctx.createBufferSource();
    src.buffer = buf;
    const f = _ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = filterFreq;
    f.Q.value = 1.2;
    const g = _ctx.createGain();
    g.gain.setValueAtTime(gainVal, _ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, _ctx.currentTime + dur);
    src.connect(f); f.connect(g); g.connect(dest || _sfxBus || _master);
    src.start(); src.stop(_ctx.currentTime + dur);
  }

  function _play(fn) {
    if (_muted) return;
    if (!_init()) return;
    _resume();
    try { fn(_ctx.currentTime); } catch(e) {}
  }

  // ── Sound definitions ────────────────────────────────────────────────────

  function wrench() {
    _play(t => {
      _noise(0.12, 0.3 * _volume, 2200);
      _osc('sine', 880, t, 0.25, 0.4 * _volume, 0.001);
      _osc('sine', 1320, t, 0.18, 0.2 * _volume, 0.001);
      _osc('triangle', 120, t, 0.08, 0.5 * _volume, 0.001);
    });
  }

  function diagnose() {
    _play(t => {
      [440, 550, 660, 880].forEach((freq, i) => {
        _osc('square', freq, t + i * 0.07, 0.1, 0.15 * _volume, 0.001);
      });
      _noise(0.05, 0.08 * _volume, 3000);
    });
  }

  function fixComplete() {
    _play(t => {
      const notes = [523, 659, 784, 1047];
      notes.forEach((freq, i) => {
        _osc('sine', freq, t + i * 0.1, 0.25, 0.4 * _volume, 0.001);
        _osc('triangle', freq * 1.005, t + i * 0.1, 0.22, 0.15 * _volume, 0.001);
      });
      _osc('sine', 2093, t + 0.3, 0.18, 0.25 * _volume, 0.001);
    });
  }

  function cashRegister() {
    _play(t => {
      _osc('sine', 1046, t, 0.08, 0.5 * _volume, 0.001);
      _osc('sine', 1318, t + 0.05, 0.07, 0.4 * _volume, 0.001);
      _osc('sine', 1760, t + 0.1, 0.06, 0.35 * _volume, 0.001);
      _osc('triangle', 2093, t + 0.14, 0.05, 0.3 * _volume, 0.001);
    });
  }

  function carArrive() {
    _play(t => {
      const buf2 = _ctx.createBuffer(1, _ctx.sampleRate * 0.4, _ctx.sampleRate);
      const d2 = buf2.getChannelData(0);
      for (let i = 0; i < d2.length; i++) d2[i] = Math.random() * 2 - 1;
      const src2 = _ctx.createBufferSource(); src2.buffer = buf2;
      const lp = _ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 200;
      const g2 = _ctx.createGain();
      g2.gain.setValueAtTime(0.001, t);
      g2.gain.linearRampToValueAtTime(0.4 * _volume, t + 0.15);
      g2.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
      src2.connect(lp); lp.connect(g2); g2.connect(_sfxBus || _master);
      src2.start(t); src2.stop(t + 0.42);
      _osc('sawtooth', 220, t + 0.2, 0.12, 0.3 * _volume, 0.001);
      _osc('sawtooth', 277, t + 0.22, 0.12, 0.25 * _volume, 0.001);
    });
  }

  function carLeave() {
    _play(t => {
      _osc('sawtooth', 180, t, 0.15, 0.3 * _volume, 0.001);
      _osc('sawtooth', 160, t + 0.05, 0.2, 0.25 * _volume, 0.001);
      _noise(0.1, 0.12 * _volume, 300);
    });
  }

  function restock() {
    _play(t => {
      _noise(0.15, 0.25 * _volume, 400);
      [1, 2, 3].forEach(i => {
        _osc('triangle', 300 + i * 80, t + i * 0.06, 0.1, 0.2 * _volume, 0.001);
      });
    });
  }

  function error() {
    _play(t => {
      _osc('sawtooth', 120, t, 0.12, 0.4 * _volume, 0.001);
      _osc('square', 100, t + 0.03, 0.15, 0.3 * _volume, 0.001);
    });
  }

  function missionComplete() {
    _play(t => {
      const fanfare = [523, 659, 784, 659, 784, 1047];
      fanfare.forEach((f, i) => {
        const dur = i === fanfare.length - 1 ? 0.5 : 0.12;
        _osc('sine', f, t + i * 0.11, dur, 0.45 * _volume, 0.001);
        _osc('triangle', f * 2, t + i * 0.11, dur * 0.6, 0.15 * _volume, 0.001);
      });
    });
  }

  function upgradeBuy() {
    _play(t => {
      const notes = [330, 392, 494, 659, 784];
      notes.forEach((f, i) => {
        _osc('square', f, t + i * 0.06, 0.1, 0.25 * _volume, 0.001);
      });
      _osc('sine', 1568, t + 0.3, 0.2, 0.3 * _volume, 0.001);
    });
  }

  function footstep() {
    _play(t => {
      _noise(0.04, 0.08 * _volume, 600);
      _osc('triangle', 80, t, 0.04, 0.15 * _volume, 0.001);
    });
  }

  function uiClick() {
    _play(t => {
      _osc('sine', 660, t, 0.06, 0.2 * _volume, 0.001);
    });
  }

  function staminaWarn() {
    _play(t => {
      _osc('sine', 200, t, 0.15, 0.2 * _volume, 0.001);
    });
  }

  function shopClose() {
    _play(t => {
      [523, 494, 440, 392].forEach((f, i) => {
        _osc('sine', f, t + i * 0.18, 0.3, 0.35 * _volume, 0.001);
      });
    });
  }

  function shopOpen() {
    _play(t => {
      [392, 440, 523, 659].forEach((f, i) => {
        _osc('sine', f, t + i * 0.15, 0.28, 0.35 * _volume, 0.001);
      });
      _osc('sine', 784, t + 0.62, 0.4, 0.4 * _volume, 0.001);
    });
  }

  // ── Ambient loop ─────────────────────────────────────────────────────────
  let _ambientNode = null;
  let _ambientGain = null;
  let _ambientNodeThrobGain = null;

  function startAmbient() {
    if (!_init() || _ambientNode) return;
    _resume();
    _ambientGain = _ctx.createGain();
    _ambientGain.gain.value = 0.04 * _ambientVolume;
    _ambientGain.connect(_master);
    const hum = _ctx.createOscillator();
    hum.type = 'sawtooth'; hum.frequency.value = 60;
    const humFilter = _ctx.createBiquadFilter();
    humFilter.type = 'lowpass'; humFilter.frequency.value = 120;
    hum.connect(humFilter); humFilter.connect(_ambientGain);
    hum.start();
    const throb = _ctx.createOscillator();
    throb.type = 'sine'; throb.frequency.value = 55;
    const lfo = _ctx.createOscillator();
    lfo.type = 'sine'; lfo.frequency.value = 0.8;
    const lfoGain = _ctx.createGain(); lfoGain.gain.value = 15;
    lfo.connect(lfoGain); lfoGain.connect(throb.frequency);
    const throbGain = _ctx.createGain(); throbGain.gain.value = 0.03 * _ambientVolume;
    throb.connect(throbGain); throbGain.connect(_master); _ambientNodeThrobGain = throbGain;
    throb.start(); lfo.start();
    _ambientNode = { hum, throb, lfo };
  }

  function stopAmbient() {
    if (!_ambientNode) return;
    try { _ambientNode.hum.stop(); _ambientNode.throb.stop(); _ambientNode.lfo.stop(); } catch(e){}
    _ambientNode = null; _ambientGain = null; _ambientNodeThrobGain = null;
  }

  function setVolume(v) {
    _volume = v;
    if (_master) _master.gain.setTargetAtTime(v, _ctx.currentTime, 0.05);
    // volume ambiente é controlado separadamente; o master continua afetando tudo.
  }


  function setSfxVolume(v) {
    _sfxVolume = Math.max(0, Math.min(1, Number(v)));
    window._sfxVolume = _sfxVolume;
    if (_sfxBus && _ctx) _sfxBus.gain.setTargetAtTime(_sfxVolume, _ctx.currentTime, 0.05);
  }

  function setAmbientVolume(v) {
    _ambientVolume = Math.max(0, Math.min(1, Number(v)));
    window._ambientVolume = _ambientVolume;
    if (_ambientGain && _ctx) _ambientGain.gain.setTargetAtTime(0.04 * _ambientVolume, _ctx.currentTime, 0.05);
    if (_ambientNodeThrobGain && _ctx) _ambientNodeThrobGain.gain.setTargetAtTime(0.03 * _ambientVolume, _ctx.currentTime, 0.05);
  }

  function setMuted(m) {
    _muted = m;
    if (_master) _master.gain.setTargetAtTime(m ? 0 : _volume, _ctx ? _ctx.currentTime : 0, 0.05);
  }

  // ── Rádio da Oficina — música procedural em loop ─────────────────────────
  let _radioNode  = null;
  let _radioGain  = null;
  let _radioTimer = null;

  // Escala pentatônica de Lá maior — soa animada, de "rádio de oficina"
  const _radioScale = [440, 494, 554, 659, 740, 880, 988, 1109];

  function _radioMelody(startT) {
    if (!_radioNode) return; // parado entre uma rodada e outra
    const t  = startT || _ctx.currentTime;
    const noteCount = 8;
    const noteLen   = 0.18;
    const gap       = 0.04;

    // Melodia aleatória mas coerente — pega notas vizinhas com preferência
    let lastIdx = Math.floor(Math.random() * _radioScale.length);
    for (let i = 0; i < noteCount; i++) {
      const step = Math.floor(Math.random() * 3) - 1; // -1, 0, +1
      lastIdx = Math.max(0, Math.min(_radioScale.length - 1, lastIdx + step));
      const freq = _radioScale[lastIdx];
      const nT   = t + i * (noteLen + gap);
      _osc('triangle', freq,       nT, noteLen, 0.09 * _volume, 0.001, _radioGain);
      _osc('sine',     freq * 2,   nT, noteLen * 0.6, 0.03 * _volume, 0.001, _radioGain);
    }

    // Batida simples (kick + snare)
    for (let b = 0; b < 4; b++) {
      const bT = t + b * (noteLen * 2 + gap * 2);
      // kick
      _osc('sine', 80, bT, 0.12, 0.18 * _volume, 0.001, _radioGain);
      // snare (noise burst nos tempos 2 e 4)
      if (b % 2 === 1) {
        const bufS = _ctx.sampleRate * 0.08;
        const buf  = _ctx.createBuffer(1, bufS, _ctx.sampleRate);
        const d    = buf.getChannelData(0);
        for (let s = 0; s < bufS; s++) d[s] = (Math.random() * 2 - 1);
        const src = _ctx.createBufferSource();
        src.buffer = buf;
        const g = _ctx.createGain();
        g.gain.setValueAtTime(0.08 * _volume, bT);
        g.gain.exponentialRampToValueAtTime(0.001, bT + 0.08);
        src.connect(g); g.connect(_radioGain);
        src.start(bT); src.stop(bT + 0.09);
      }
    }

    // Agenda próxima rodada (~2s)
    const loopDur = noteCount * (noteLen + gap);
    _radioTimer = setTimeout(() => _radioMelody(), loopDur * 1000);
  }

  function startRadio() {
    if (!_init() || _radioNode) return;
    _resume();
    // Filtro de rádio antigo: bandpass estreito + distorção suave
    _radioGain = _ctx.createGain();
    _radioGain.gain.value = 0.7;
    const bp = _ctx.createBiquadFilter();
    bp.type = 'bandpass'; bp.frequency.value = 1200; bp.Q.value = 0.7;
    const dist = _ctx.createWaveShaper();
    const curve = new Float32Array(256);
    for (let i = 0; i < 256; i++) {
      const x = (i * 2) / 256 - 1;
      curve[i] = (Math.PI + 80) * x / (Math.PI + 80 * Math.abs(x));
    }
    dist.curve = curve;
    _radioGain.connect(bp); bp.connect(dist); dist.connect(_master);
    _radioNode = { gain: _radioGain, bp, dist }; // sentinela
    _radioMelody();
  }

  function stopRadio() {
    if (!_radioNode) return;
    clearTimeout(_radioTimer);
    try { _radioGain.gain.setTargetAtTime(0, _ctx.currentTime, 0.3); } catch(e){}
    setTimeout(() => { _radioNode = null; _radioGain = null; }, 400);
  }

  function isRadioOn() { return !!_radioNode; }

  function isMuted() { return _muted; }

  function setRadioVolume(v) {
    if (_radioGain) _radioGain.gain.setTargetAtTime(v * 0.7, _ctx.currentTime, 0.05);
  }

  return {
    wrench, diagnose, fixComplete, cashRegister, carArrive, carLeave, restock,
    error, missionComplete, upgradeBuy, footstep, uiClick, staminaWarn,
    shopClose, shopOpen, startAmbient, stopAmbient, setVolume, setSfxVolume, setAmbientVolume, setMuted, isMuted, _init,
    startRadio, stopRadio, isRadioOn, _setRadioVolume: setRadioVolume,
  };
})();

// ── Conecta EventBus → SFX ────────────────────────────────────────────────────
// Permite que o SFX reaja a eventos do jogo sem ser chamado diretamente.
// O engine.js ainda pode chamar SFX.xxx() diretamente — ambos funcionam.
EventBus.on('car:arrive',       ()  => SFX.carArrive());
EventBus.on('car:fixed',        ()  => { SFX.fixComplete(); SFX.cashRegister(); });
EventBus.on('car:left',         ()  => SFX.carLeave());
EventBus.on('player:restock',   ()  => SFX.restock());
EventBus.on('player:diagnose',  ()  => SFX.diagnose());
EventBus.on('upgrade:bought',   (d) => { SFX.upgradeBuy(); if (d && d.id === 'radio') SFX.startRadio(); });
EventBus.on('mission:complete', ()  => SFX.missionComplete());
EventBus.on('game:start',       ()  => { SFX.startAmbient(); if (typeof upgradesList !== 'undefined' && upgradesList.find(u => u.id === 'radio' && u.bought)) SFX.startRadio(); });
EventBus.on('game:resume',      ()  => { SFX.startAmbient(); /* rádio gerenciado pelo controle de pause */ });
EventBus.on('game:pause',       ()  => { SFX.stopAmbient(); /* rádio controlado pelo menu de pause */ });
EventBus.on('game:returnMenu',  ()  => { SFX.stopAmbient(); SFX.stopRadio(); });

// ── UI controles de som ───────────────────────────────────────────────────────
function toggleMissions(){SFX.uiClick();document.getElementById("task-board").classList.toggle("open");}
window.toggleMissions=toggleMissions;

document.getElementById("sound-toggle").addEventListener("click", () => {
  SFX._init();
  const muted = !SFX.isMuted();
  SFX.setMuted(muted);
  const btn = document.getElementById("sound-toggle");
  btn.textContent = muted ? "🔇" : "🔊";
  btn.classList.toggle("muted", muted);
  if (!muted) SFX.uiClick();
});
document.getElementById("vol-slider").addEventListener("input", e => {
  const v = e.target.value / 100;
  e.target.style.setProperty("--v", e.target.value + "%");
  SFX.setVolume(v);
  SFX._init();
});

// Init audio on first interaction
document.addEventListener("pointerdown", () => { SFX._init(); SFX.startAmbient(); }, { once: true });
document.addEventListener("keydown",     () => { SFX._init(); SFX.startAmbient(); }, { once: true });

// ── Controles de Rádio no Menu de Pause ──────────────────────────────────────

// Volume dedicado do rádio (separado do volume geral)
let _pauseRadioVolume = 0.7;
let _radioManuallyOff = false; // usuário desligou manualmente

function updatePauseRadioSection() {
  const radioSection = document.getElementById("pause-radio-section");
  const radioToggle  = document.getElementById("pause-radio-toggle");
  const volSlider    = document.getElementById("pause-radio-vol");
  const volLabel     = document.getElementById("pause-radio-vol-label");
  if (!radioSection) return;

  // Verifica se rádio foi comprado
  const radioBought = typeof upgradesList !== "undefined"
    && upgradesList.find(u => u.id === "radio" && u.bought);

  radioSection.style.display = radioBought ? "block" : "none";
  if (!radioBought) return;

  const isOn = SFX.isRadioOn();
  if (radioToggle) {
    radioToggle.textContent = isOn ? "🔇 Desligar" : "🔈 Ligar";
    radioToggle.style.borderColor = isOn ? "#f87171" : "#34d399";
    radioToggle.style.color       = isOn ? "#f87171" : "#34d399";
  }
  if (volSlider) volSlider.value = Math.round(_pauseRadioVolume * 100);
  if (volLabel)  volLabel.textContent = Math.round(_pauseRadioVolume * 100) + "%";
}

function togglePauseRadio() {
  SFX._init();
  if (SFX.isRadioOn()) {
    SFX.stopRadio();
    _radioManuallyOff = true;
  } else {
    SFX.startRadio();
    _radioManuallyOff = false;
  }
  updatePauseRadioSection();
}

function setPauseRadioVolume(val) {
  _pauseRadioVolume = val / 100;
  const label = document.getElementById("pause-radio-vol-label");
  if (label) label.textContent = val + "%";
  // Aplica volume apenas ao rádio usando o gain interno
  if (typeof SFX !== "undefined" && SFX._setRadioVolume) {
    SFX._setRadioVolume(_pauseRadioVolume);
  }
}

window.togglePauseRadio   = togglePauseRadio;
window.setPauseRadioVolume = setPauseRadioVolume;
window.updatePauseRadioSection = updatePauseRadioSection;

// Quando o jogo retoma, não re-liga o rádio se o usuário tiver desligado manualmente
EventBus.on("game:resume", () => {
  if (!_radioManuallyOff) {
    const radioBought = typeof upgradesList !== "undefined"
      && upgradesList.find(u => u.id === "radio" && u.bought);
    if (radioBought && !SFX.isRadioOn()) SFX.startRadio();
  }
});

