// ================= SISTEMA DE ÁUDIO AVANÇADO =================
// Tudo sintetizado via Web Audio API — sem arquivos externos necessários.

'use strict';

// ─── Estado Global ───────────────────────────────────────────────────────────
let audioEnabled   = true;
let musicVolume    = 0.3;
let sfxVolume      = 0.5;

// ─── Contexto & Ganhos Mestres ───────────────────────────────────────────────
const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx  = null;
let musicGain = null;   // saída de música
let sfxGain   = null;   // saída de efeitos

// ─── Música Dinâmica ─────────────────────────────────────────────────────────
let musicLayers          = [];
let musicPlaying         = false;
let musicIntensity       = 0;   // valor atual  (0–1)
let targetMusicIntensity = 0;   // valor alvo   (0–1)

// ─── Pool & Prevenção de Vazamentos ──────────────────────────────────────────
const MAX_CONCURRENT_SOUNDS = 20;
let   activeSoundCount      = 0;
const cleanupQueue          = [];   // [{nodes, cleanupTime}]

// ═══════════════════════════════════════════════════════════════════════════════
//  INICIALIZAÇÃO
// ═══════════════════════════════════════════════════════════════════════════════

function initAudio() {
  if (audioCtx) return;

  audioCtx = new AudioContext();

  musicGain = audioCtx.createGain();
  musicGain.gain.value = musicVolume;
  musicGain.connect(audioCtx.destination);

  sfxGain = audioCtx.createGain();
  sfxGain.gain.value = sfxVolume;
  sfxGain.connect(audioCtx.destination);
}

function ensureRunning() {
  initAudio();
  if (audioCtx.state === 'suspended') audioCtx.resume();
}

// ═══════════════════════════════════════════════════════════════════════════════
//  HELPERS DE NÓS
// ═══════════════════════════════════════════════════════════════════════════════

/** Cria um oscilador conectado a um gain e agenda cleanup automático. */
function makeOsc(type, freq, gainVal, dest, duration, startAt) {
  const now   = startAt ?? audioCtx.currentTime;
  const osc   = audioCtx.createOscillator();
  const gain  = audioCtx.createGain();

  osc.type             = type;
  osc.frequency.value  = freq;
  gain.gain.value      = gainVal;

  osc.connect(gain);
  gain.connect(dest);

  osc.start(now);
  if (duration != null) osc.stop(now + duration);

  return { osc, gain };
}

/** Gera um buffer de ruído branco (reutilizável via loop). */
function makeNoiseBuffer(seconds) {
  const len    = Math.ceil(audioCtx.sampleRate * seconds);
  const buffer = audioCtx.createBuffer(1, len, audioCtx.sampleRate);
  const data   = buffer.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  return buffer;
}

/** Conecta um nó ao panner se existir, senão diretamente ao destino. */
function connectWithPan(node, panner, dest) {
  if (panner) {
    node.connect(panner);
    panner.connect(dest);
  } else {
    node.connect(dest);
  }
}

// ─── Cleanup ─────────────────────────────────────────────────────────────────

function stopNode(node) {
  if (!node) return;
  try {
    if (node.stop) node.stop();
    node.disconnect();
  } catch (_) { /* já parado */ }
}

function scheduleCleanup(nodes, delaySec) {
  cleanupQueue.push({ nodes, at: Date.now() + delaySec * 1000 });
}

function processCleanupQueue() {
  const now = Date.now();
  for (let i = cleanupQueue.length - 1; i >= 0; i--) {
    if (now >= cleanupQueue[i].at) {
      cleanupQueue[i].nodes.forEach(stopNode);
      cleanupQueue.splice(i, 1);
    }
  }
}

setInterval(processCleanupQueue, 500);

// ═══════════════════════════════════════════════════════════════════════════════
//  MÚSICA DINÂMICA (6 camadas sintetizadas)
// ═══════════════════════════════════════════════════════════════════════════════
/*
  Camada  | Conteúdo                         | Ativa quando intensidade ≥
  --------|----------------------------------|-----------------------------
  0       | Bass drone (55 Hz sine)          | 0.0  (sempre)
  1       | Arpéggio grave (LFO em freq)     | 0.15
  2       | Pad harmônico (3 oscs)           | 0.30
  3       | Noise oceânico (filtrado)        | 0.25
  4       | Pulsação rítmica (LFO AM)        | 0.55
  5       | Tensão dissonante (3 sawtooth)   | 0.80
*/

function startMusic() {
  if (musicPlaying || !audioEnabled) return;
  ensureRunning();
  musicPlaying = true;
  musicLayers  = [];

  // ── Camada 0: Bass drone ─────────────────────────────────────────────
  {
    const osc  = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 55;
    gain.gain.value = 0;
    osc.connect(gain);
    gain.connect(musicGain);
    osc.start();
    musicLayers.push({ nodes: [osc, gain], gainIdx: 1, baseVol: 0.18, minInt: 0 });
  }

  // ── Camada 1: Arpéggio grave (oscilador com LFO na frequência) ──────
  {
    const osc     = audioCtx.createOscillator();
    const lfo     = audioCtx.createOscillator();
    const lfoGain = audioCtx.createGain();
    const gain    = audioCtx.createGain();

    osc.type  = 'triangle';
    osc.frequency.value = 110;

    lfo.type  = 'sine';
    lfo.frequency.value = 0.5;   // lento
    lfoGain.gain.value  = 40;    // amplitude da modulação em Hz

    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);   // modula a frequência do osc
    osc.connect(gain);
    gain.connect(musicGain);
    gain.gain.value = 0;

    osc.start();
    lfo.start();

    musicLayers.push({ nodes: [osc, gain, lfo, lfoGain], gainIdx: 1, baseVol: 0.10, minInt: 0.15 });
  }

  // ── Camada 2: Pad harmônico (3 osciladores em unísono detuned) ───────
  {
    const gain = audioCtx.createGain();
    gain.gain.value = 0;
    gain.connect(musicGain);

    const nodes = [gain];
    [220, 220.8, 219.2].forEach(f => {   // detune sutil → batimento
      const o = audioCtx.createOscillator();
      o.type = 'sine';
      o.frequency.value = f;
      o.connect(gain);
      o.start();
      nodes.push(o);
    });

    musicLayers.push({ nodes, gainIdx: 0, baseVol: 0.07, minInt: 0.30 });
  }

  // ── Camada 3: Noise oceânico ─────────────────────────────────────────
  {
    const src    = audioCtx.createBufferSource();
    src.buffer   = makeNoiseBuffer(2);
    src.loop     = true;

    const filter = audioCtx.createBiquadFilter();
    filter.type  = 'bandpass';
    filter.frequency.value = 400;
    filter.Q.value         = 0.8;

    const gain   = audioCtx.createGain();
    gain.gain.value = 0;

    src.connect(filter);
    filter.connect(gain);
    gain.connect(musicGain);
    src.start();

    musicLayers.push({ nodes: [src, filter, gain], gainIdx: 2, baseVol: 0.06, minInt: 0.25 });
  }

  // ── Camada 4: Pulsação rítmica (AM via LFO) ──────────────────────────
  {
    const osc     = audioCtx.createOscillator();
    const lfo     = audioCtx.createOscillator();
    const lfoGain = audioCtx.createGain();
    const gain    = audioCtx.createGain();

    osc.type  = 'square';
    osc.frequency.value = 65;

    lfo.type  = 'sine';
    lfo.frequency.value = 2;   // 120 BPM
    lfoGain.gain.value  = 0;   // controlado pela intensidade

    lfo.connect(lfoGain);
    lfoGain.connect(gain.gain);   // AM

    osc.connect(gain);
    gain.connect(musicGain);
    gain.gain.value = 0;

    osc.start();
    lfo.start();

    musicLayers.push({ nodes: [osc, gain, lfo, lfoGain], gainIdx: 1, baseVol: 0.12, minInt: 0.55 });
  }

  // ── Camada 5: Tensão dissonante ──────────────────────────────────────
  {
    const gain = audioCtx.createGain();
    gain.gain.value = 0;
    gain.connect(musicGain);

    const nodes = [gain];
    [130.81, 138.91, 146.83].forEach(f => {   // C3, C#3, D3 → cluster dissonante
      const o = audioCtx.createOscillator();
      o.type = 'sawtooth';
      o.frequency.value = f;
      o.connect(gain);
      o.start();
      nodes.push(o);
    });

    musicLayers.push({ nodes, gainIdx: 0, baseVol: 0.10, minInt: 0.80 });
  }

  updateMusicIntensity(0, 0);   // começa em silêncio
}

// ─── Atualiza Intensidade ────────────────────────────────────────────────────

function updateMusicIntensity(intensity, transitionTime = 2.0) {
  if (!musicPlaying || !audioCtx) return;

  targetMusicIntensity = Math.max(0, Math.min(1, intensity));
  musicIntensity       = targetMusicIntensity;
  const now            = audioCtx.currentTime;

  musicLayers.forEach(layer => {
    const gainNode = layer.nodes[layer.gainIdx];
    let   target   = 0;

    if (targetMusicIntensity >= layer.minInt) {
      const factor = (targetMusicIntensity - layer.minInt) / (1 - layer.minInt || 1);
      target = layer.baseVol * Math.min(factor, 1);
    }

    gainNode.gain.cancelScheduledValues(now);
    gainNode.gain.setValueAtTime(gainNode.gain.value, now);
    gainNode.gain.linearRampToValueAtTime(target, now + transitionTime);
  });
}

// ─── Intensidade Automática ──────────────────────────────────────────────────

function calculateGameIntensity() {
  if (typeof player === 'undefined' || !player) return 0;

  let i = 0;

  // level contribui até 0.2
  if (typeof level !== 'undefined')
    i += Math.min(level / 50, 0.2);

  // fome baixa
  const hp = player.hunger / (player.maxHunger || 100);
  if (hp < 0.3) i += 0.3;
  else if (hp < 0.5) i += 0.15;

  // inimigos próximos
  if (typeof enemies !== 'undefined' && enemies.length) {
    let near = 0;
    enemies.forEach(e => {
      if (typeof distance === 'function' && distance(player.x, player.y, e.x, e.y) < 300)
        near++;
    });
    i += Math.min(near * 0.15, 0.4);
  }

  // combo alto
  if (typeof combo !== 'undefined' && combo > 5)
    i += Math.min(combo * 0.05, 0.3);

  return Math.min(i, 1);
}

// ─── Stop ────────────────────────────────────────────────────────────────────

function stopMusic() {
  if (!musicPlaying) return;
  musicLayers.forEach(layer => layer.nodes.forEach(stopNode));
  musicLayers  = [];
  musicPlaying = false;
}

// ═══════════════════════════════════════════════════════════════════════════════
//  EFEITOS SONOROS  —  playSFX(type, x?, y?)
// ═══════════════════════════════════════════════════════════════════════════════
/*
  Tipos disponíveis:
    eat | damage | levelup | combo | mission | coin
    powerup | upgrade | click | hover | bubble | splash
    dash | achievement | death | enemy_hit | collect
    menu_open | menu_close | game_over | countdown
*/

function playSFX(type, x, y) {
  if (!audioEnabled) return;
  ensureRunning();

  if (activeSoundCount >= MAX_CONCURRENT_SOUNDS) return;
  activeSoundCount++;

  const now   = audioCtx.currentTime;
  const nodes = [];   // para cleanup

  // ── Panner espacial ────────────────────────────────────────────────────
  let panner = null;
  if (x != null && y != null && typeof canvas !== 'undefined' && typeof player !== 'undefined') {
    panner = audioCtx.createStereoPanner();
    panner.pan.value = calculatePan(x, y);
    nodes.push(panner);
  }

  const dest = sfxGain;   // saída padrão

  // ── Helper interno: toca nota com envelope ADSR simplificado ──────────
  function tone(freq, type, dur, vol, delay = 0, freqEnd, panIt = true) {
    const osc  = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, now + delay);
    if (freqEnd != null)
      osc.frequency.exponentialRampToValueAtTime(freqEnd, now + delay + dur);

    gain.gain.setValueAtTime(vol, now + delay);
    gain.gain.exponentialRampToValueAtTime(0.001, now + delay + dur);

    osc.connect(gain);
    if (panIt && panner) connectWithPan(gain, panner, dest);
    else                  gain.connect(dest);

    osc.start(now + delay);
    osc.stop(now + delay + dur);
    nodes.push(osc, gain);
  }

  // ── Helper: noise burst ────────────────────────────────────────────────
  function noiseBurst(dur, vol, filterFreq, filterType = 'lowpass', delay = 0) {
    const src  = audioCtx.createBufferSource();
    src.buffer = makeNoiseBuffer(dur + 0.05);
    const filt = audioCtx.createBiquadFilter();
    filt.type  = filterType;
    filt.frequency.value = filterFreq;
    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(vol, now + delay);
    gain.gain.exponentialRampToValueAtTime(0.001, now + delay + dur);

    src.connect(filt);
    filt.connect(gain);
    if (panner) connectWithPan(gain, panner, dest);
    else        gain.connect(dest);

    src.start(now + delay);
    nodes.push(src, filt, gain);
  }

  // ── Duração máxima para cleanup automático ─────────────────────────────
  let totalDur = 0.3;   // default

  // ════════════════════════════════════════════════════════════════════════
  switch (type) {

    // ── eat ──────────────────────────────────────────────────────────────
    case 'eat': {
      const p = 500 + Math.random() * 200;
      tone(p, 'sine', 0.08, 0.25, 0, p + 250);
      tone(p * 1.3, 'sine', 0.06, 0.12, 0.04);   // harmônico curto
      totalDur = 0.15;
      break;
    }

    // ── damage ───────────────────────────────────────────────────────────
    case 'damage': {
      tone(220, 'sawtooth', 0.15, 0.35, 0, 60);
      noiseBurst(0.12, 0.18, 800, 'highpass', 0);   // crunch
      totalDur = 0.25;
      break;
    }

    // ── levelup ──────────────────────────────────────────────────────────
    case 'levelup': {
      [350, 440, 550, 700, 880].forEach((f, i) => {
        tone(f, 'sine', 0.22, 0.20, i * 0.07, f * 1.05);
      });
      totalDur = 0.65;
      break;
    }

    // ── combo ────────────────────────────────────────────────────────────
    case 'combo': {
      const base = 900 + (typeof combo !== 'undefined' ? combo * 30 : 0);
      tone(base, 'sine', 0.07, 0.22, 0, base * 1.4);
      totalDur = 0.10;
      break;
    }

    // ── mission ──────────────────────────────────────────────────────────
    case 'mission': {
      // fanfarra com eco
      [523, 659, 784, 1047].forEach((f, i) => {
        tone(f,  'sine',    0.18, 0.18, i * 0.09);
        tone(f,  'sine',    0.12, 0.06, i * 0.09 + 0.12, undefined, false);   // eco
      });
      totalDur = 0.65;
      break;
    }

    // ── coin ─────────────────────────────────────────────────────────────
    case 'coin': {
      tone(800,  'sine', 0.06, 0.20, 0,    1100);
      tone(1100, 'sine', 0.06, 0.15, 0.05, 1300);
      totalDur = 0.14;
      break;
    }

    // ── powerup ──────────────────────────────────────────────────────────
    case 'powerup': {
      [350, 450, 570, 720, 900, 1130].forEach((f, i) => {
        tone(f, 'sine', 0.18, 0.14, i * 0.045);
      });
      // shimmer final
      noiseBurst(0.15, 0.08, 2000, 'highpass', 0.22);
      totalDur = 0.50;
      break;
    }

    // ── upgrade ──────────────────────────────────────────────────────────
    case 'upgrade': {
      // dois tones simultâneos (quinta justa)
      tone(440, 'sine', 0.30, 0.18, 0);
      tone(660, 'sine', 0.30, 0.14, 0);
      tone(880, 'sine', 0.20, 0.10, 0.10);   // harmônico de confirmação
      totalDur = 0.38;
      break;
    }

    // ── click ────────────────────────────────────────────────────────────
    case 'click': {
      tone(1200, 'sine', 0.03, 0.15, 0, 800);
      totalDur = 0.05;
      break;
    }

    // ── hover ────────────────────────────────────────────────────────────
    case 'hover': {
      tone(900, 'sine', 0.04, 0.07, 0, 1100);
      totalDur = 0.06;
      break;
    }

    // ── bubble ───────────────────────────────────────────────────────────
    case 'bubble': {
      const bp = 280 + Math.random() * 180;
      tone(bp, 'sine', 0.10, 0.10, 0, bp * 1.6);
      // click inicial (ataque percussivo)
      tone(bp * 2, 'sine', 0.015, 0.12, 0);
      totalDur = 0.14;
      break;
    }

    // ── splash ───────────────────────────────────────────────────────────
    case 'splash': {
      noiseBurst(0.18, 0.22, 1200, 'lowpass', 0);
      tone(90, 'sine', 0.15, 0.15, 0, 60);
      totalDur = 0.25;
      break;
    }

    // ── dash ─────────────────────────────────────────────────────────────
    case 'dash': {
      // whoosh descendente
      tone(500, 'sawtooth', 0.18, 0.28, 0, 120);
      noiseBurst(0.16, 0.14, 1800, 'lowpass', 0);
      totalDur = 0.25;
      break;
    }

    // ── achievement ──────────────────────────────────────────────────────
    case 'achievement': {
      // arpéggio épico + sustain final
      [523, 659, 784, 1047, 1319].forEach((f, i) => {
        tone(f, 'sine', 0.28, 0.18, i * 0.10);
      });
      // sustain final (nota longa em 1319)
      tone(1319, 'sine', 0.60, 0.12, 0.45);
      totalDur = 1.2;
      break;
    }

    // ── death ────────────────────────────────────────────────────────────
    case 'death': {
      // sequência descendente grave + ruído
      [300, 200, 130, 80].forEach((f, i) => {
        tone(f, 'sawtooth', 0.25, 0.22, i * 0.12, f * 0.7);
      });
      noiseBurst(0.40, 0.20, 500, 'lowpass', 0.1);
      totalDur = 0.75;
      break;
    }

    // ── enemy_hit ────────────────────────────────────────────────────────
    case 'enemy_hit': {
      tone(180, 'sawtooth', 0.12, 0.30, 0, 90);
      noiseBurst(0.08, 0.15, 600, 'highpass', 0);
      totalDur = 0.18;
      break;
    }

    // ── collect ──────────────────────────────────────────────────────────
    case 'collect': {
      // "tink" agudo + shimmer
      tone(1400, 'sine', 0.05, 0.20, 0, 1800);
      tone(1800, 'sine', 0.08, 0.10, 0.03);
      noiseBurst(0.06, 0.06, 3000, 'highpass', 0.02);
      totalDur = 0.14;
      break;
    }

    // ── menu_open ────────────────────────────────────────────────────────
    case 'menu_open': {
      // woosh ascendente suave
      tone(200, 'sine', 0.20, 0.12, 0, 600);
      noiseBurst(0.18, 0.08, 900, 'lowpass', 0);
      totalDur = 0.28;
      break;
    }

    // ── menu_close ───────────────────────────────────────────────────────
    case 'menu_close': {
      tone(600, 'sine', 0.18, 0.12, 0, 250);
      noiseBurst(0.14, 0.07, 700, 'lowpass', 0);
      totalDur = 0.24;
      break;
    }

    // ── game_over ────────────────────────────────────────────────────────
    case 'game_over': {
      // quinta descendente lenta + reverb simulado (eco)
      const goNotes = [659, 523, 440, 330];
      goNotes.forEach((f, i) => {
        tone(f, 'sine',    0.40, 0.20, i * 0.22);
        tone(f, 'sine',    0.25, 0.06, i * 0.22 + 0.18, undefined, false);  // eco
      });
      totalDur = 1.3;
      break;
    }

    // ── countdown ────────────────────────────────────────────────────────
    case 'countdown': {
      // tick agudo grave
      tone(440, 'square', 0.06, 0.18, 0);
      tone(440, 'sine',   0.04, 0.10, 0.03);
      totalDur = 0.12;
      break;
    }

    default:
      activeSoundCount--;
      return;
  }

  scheduleCleanup(nodes, totalDur + 0.1);
  setTimeout(() => activeSoundCount--, (totalDur + 0.1) * 1000);
}

// ═══════════════════════════════════════════════════════════════════════════════
//  ESPACIALIZAÇÃO
// ═══════════════════════════════════════════════════════════════════════════════

function calculatePan(x /*, y */) {
  if (typeof canvas === 'undefined' || typeof player === 'undefined') return 0;
  const maxDist = (canvas.width / (typeof dpr !== 'undefined' ? dpr : 1)) / 2;
  return Math.max(-1, Math.min(1, (x - player.x) / maxDist));
}

// ═══════════════════════════════════════════════════════════════════════════════
//  SONS AMBIENTE
// ═══════════════════════════════════════════════════════════════════════════════

let lastAmbientSound = 0;

function playAmbientSounds() {
  if (!audioEnabled || (typeof gameState !== 'undefined' && gameState !== 'playing')) return;

  const now = Date.now();
  if (now - lastAmbientSound < 3000) return;
  lastAmbientSound = now;

  if (Math.random() < 0.3) {
    const x = Math.random() * ((typeof canvas !== 'undefined' ? canvas.width : 800) / (typeof dpr !== 'undefined' ? dpr : 1));
    const y = Math.random() * ((typeof canvas !== 'undefined' ? canvas.height : 600) / (typeof dpr !== 'undefined' ? dpr : 1));
    playSFX('bubble', x, y);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
//  CONTROLES DE VOLUME & PERSISTÊNCIA
// ═══════════════════════════════════════════════════════════════════════════════

function toggleAudio() {
  audioEnabled = !audioEnabled;
  audioEnabled ? startMusic() : stopMusic();
  saveAudioSettings();
}

function setMusicVolume(vol) {
  musicVolume = Math.max(0, Math.min(1, vol));
  if (musicGain) musicGain.gain.value = musicVolume;
  saveAudioSettings();
}

function setSFXVolume(vol) {
  sfxVolume = Math.max(0, Math.min(1, vol));
  if (sfxGain) sfxGain.gain.value = sfxVolume;
  saveAudioSettings();
}

function saveAudioSettings() {
  try {
    localStorage.setItem('audio_settings', JSON.stringify({
      enabled: audioEnabled, musicVolume, sfxVolume
    }));
  } catch (_) { /* localStorage indisponível */ }
}

function loadAudioSettings() {
  try {
    const raw = localStorage.getItem('audio_settings');
    if (!raw) return;
    const s = JSON.parse(raw);
    audioEnabled = s.enabled !== false;
    musicVolume  = s.musicVolume  ?? 0.3;
    sfxVolume    = s.sfxVolume    ?? 0.5;
  } catch (e) {
    console.error('Erro ao carregar áudio:', e);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
//  CLEANUP GLOBAL
// ═══════════════════════════════════════════════════════════════════════════════

function cleanupAllAudio() {
  stopMusic();
  cleanupQueue.forEach(item => item.nodes.forEach(stopNode));
  cleanupQueue.length = 0;
  if (audioCtx && audioCtx.state !== 'closed') audioCtx.close();
  audioCtx = null;
}

window.addEventListener('beforeunload', cleanupAllAudio);

// ═══════════════════════════════════════════════════════════════════════════════
//  GAME LOOP — chame updateDynamicMusic(dt) a cada frame
// ═══════════════════════════════════════════════════════════════════════════════

function updateDynamicMusic(/* dt */) {
  if (!musicPlaying) return;

  const target = calculateGameIntensity();
  if (Math.abs(target - musicIntensity) > 0.04)
    updateMusicIntensity(target, 1.5);

  playAmbientSounds();
}

// ═══════════════════════════════════════════════════════════════════════════════
//  DEBUG  —  console: audioDebug.test('damage')
// ═══════════════════════════════════════════════════════════════════════════════

if (typeof window !== 'undefined') {
  window.audioDebug = {
    setIntensity : (v)          => updateMusicIntensity(v, 1),
    test         : (type, x, y) => playSFX(type, x, y),
    listSounds   : ()           => console.log([
      'eat','damage','levelup','combo','mission','coin',
      'powerup','upgrade','click','hover','bubble','splash',
      'dash','achievement','death','enemy_hit','collect',
      'menu_open','menu_close','game_over','countdown'
    ].join(', ')),
    stats        : ()           => ({
      playing: musicPlaying,
      intensity: musicIntensity,
      activeSounds: activeSoundCount,
      layers: musicLayers.length
    })
  };
}
