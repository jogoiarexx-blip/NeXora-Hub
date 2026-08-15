// ============================================================
// 🎮 GAME STATE MANAGER — Mecânica do Zé
// Classe que encapsula transições de estado e notifica via EventBus.
//
// Substitui:
//   const GAME_STATE = { MENU, PLAYING, PAUSE }
//   let currentGameState
//   let gamePaused
//   function setGameState()
//   function _onGameStateChange()
//   function getGameStateLabel()
//   function isInMainMenu / isGamePlaying / isGamePaused
//
// Requer: eventBus.js carregado antes.
// ============================================================

class GameStateManager {
  // ── Estados válidos ──────────────────────────────────────────────────────
  static STATES = {
    MENU:    'menu',
    PLAYING: 'playing',
    PAUSE:   'pause',
  };

  constructor() {
    this._current = GameStateManager.STATES.MENU;
    // Compat: espelha `gamePaused` que engine.js usa diretamente
    this.paused = false;
  }

  // ── Leitura ──────────────────────────────────────────────────────────────
  get current() { return this._current; }

  isMenu()    { return this._current === GameStateManager.STATES.MENU; }
  isPlaying() { return this._current === GameStateManager.STATES.PLAYING; }
  isPaused()  { return this._current === GameStateManager.STATES.PAUSE; }

  label() {
    const map = {
      menu:    '📋 MENU',
      playing: '🎮 JOGANDO',
      pause:   '⏸ PAUSADO',
    };
    return map[this._current] || '';
  }

  // ── Transição ────────────────────────────────────────────────────────────
  /**
   * Muda o estado do jogo e dispara efeitos colaterais de UI/áudio.
   * @param {string} newState - um de GameStateManager.STATES
   */
  set(newState) {
    const valid = Object.values(GameStateManager.STATES);
    if (!valid.includes(newState)) {
      console.warn(`[GameStateManager] Estado inválido: "${newState}"`);
      return;
    }
    const prev = this._current;
    if (prev === newState) return;

    this._current = newState;
    this.paused   = (newState === GameStateManager.STATES.PAUSE);

    // Atualiza globais de compat que engine.js ainda lê
    window.currentGameState = newState;
    window.gamePaused       = this.paused;

    this._applyUIEffects(prev, newState);

    EventBus.emit('game:stateChange', { from: prev, to: newState });

    const eventMap = {
      [GameStateManager.STATES.MENU]:    'game:returnMenu',
      [GameStateManager.STATES.PLAYING]: prev === GameStateManager.STATES.PAUSE
                                         ? 'game:resume'
                                         : 'game:start',
      [GameStateManager.STATES.PAUSE]:   'game:pause',
    };
    if (eventMap[newState]) EventBus.emit(eventMap[newState], { prev });
  }

  // ── Conveniências (espelham funções globais do engine) ───────────────────
  pause()  {
    if (!this.isPaused()) this.set(GameStateManager.STATES.PAUSE);
  }
  resume() {
    this.set(GameStateManager.STATES.PLAYING);
  }
  toMenu() {
    this.set(GameStateManager.STATES.MENU);
  }
  play()   {
    this.set(GameStateManager.STATES.PLAYING);
  }

  // ── Efeitos de UI e áudio (extraídos de _onGameStateChange) ─────────────
  _applyUIEffects(from, to) {
    const hudEl     = document.getElementById('hud');
    const pauseEl   = document.getElementById('pause-menu');
    const menuEl    = document.getElementById('main-menu');
    const staminaEl = document.getElementById('stamina-bar');
    const controlEl = document.getElementById('controls');
    const taskBtn   = document.getElementById('missions-toggle');
    const billsBtn  = document.getElementById('bills-toggle');
    const billsPnl  = document.getElementById('bills-panel');
    const tabsEl    = document.getElementById('upgrade-tabs');

    const S = GameStateManager.STATES;
    const inGame = (to === S.PLAYING || to === S.PAUSE);

    if (hudEl)     hudEl.style.display     = inGame ? '' : 'none';
    if (staminaEl) staminaEl.style.display = inGame ? '' : 'none';
    if (controlEl) controlEl.style.display = inGame ? '' : 'none';
    if (taskBtn)   taskBtn.style.display   = inGame ? '' : 'none';
    if (billsBtn)  billsBtn.style.display  = inGame ? '' : 'none';
    if (billsPnl && !inGame) billsPnl.classList.remove('open');
    if (tabsEl)    tabsEl.style.display    = inGame ? 'flex' : 'none';

    switch (to) {
      case S.MENU:
        if (menuEl)  menuEl.style.display  = 'flex';
        if (pauseEl) pauseEl.style.display = 'none';
        { const upg = document.getElementById('upgrade-panel'); if (upg) upg.classList.remove('open'); }
        if (typeof SFX !== 'undefined') SFX.stopAmbient();
        break;

      case S.PLAYING:
        if (menuEl)  menuEl.style.display  = 'none';
        if (pauseEl) pauseEl.style.display = 'none';
        if (typeof SFX !== 'undefined') SFX.startAmbient();
        break;

      case S.PAUSE:
        if (pauseEl) pauseEl.style.display = 'flex';
        if (menuEl)  menuEl.style.display  = 'none';
        { const upg = document.getElementById('upgrade-panel'); if (upg) upg.classList.remove('open'); }
        if (typeof SFX !== 'undefined') SFX.stopAmbient();
        // Atualiza seção de rádio no menu de pause
        if (typeof updatePauseRadioSection === 'function') updatePauseRadioSection();
        break;
    }
  }
}

// ── Instância global singleton ────────────────────────────────────────────────
const GameState = new GameStateManager();

// ── Globals de compatibilidade com engine.js ──────────────────────────────────
// engine.js ainda referencia GAME_STATE.MENU, currentGameState, gamePaused
// e as funções setGameState, isInMainMenu, isGamePlaying, isGamePaused.
// Mantemos tudo funcionando sem alterar uma linha do engine.

const GAME_STATE = GameStateManager.STATES;       // { MENU, PLAYING, PAUSE }

// Espelha o estado atual como let (engine.js lê e compara diretamente)
window.currentGameState = GameState.current;
window.gamePaused       = GameState.paused;

// Substitui a função global setGameState que engine.js chama
function setGameState(newState) {
  GameState.set(newState);
}

// Substitui helpers globais
function getGameStateLabel()  { return GameState.label(); }
function isInMainMenu()       { return GameState.isMenu(); }
function isGamePlaying()      { return GameState.isPlaying(); }
function isGamePaused()       { return GameState.isPaused(); }

// Expõe pauseGame / resumeGame (chamados por HTML onclick e engine)
function pauseGame()  { GameState.pause(); }
function resumeGame() { GameState.resume(); }
