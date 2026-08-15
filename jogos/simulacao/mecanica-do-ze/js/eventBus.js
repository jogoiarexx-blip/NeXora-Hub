// ============================================================
// 📡 EVENT BUS — Mecânica do Zé
// Desacopla sistemas: qualquer módulo pode emitir/ouvir eventos
// sem importar diretamente outro módulo.
//
// Uso:
//   EventBus.on('fix:complete', (data) => { ... });
//   EventBus.emit('fix:complete', { car, money });
//   EventBus.off('fix:complete', handler);
//   EventBus.once('game:start', handler);
// ============================================================

const EventBus = (() => {
  /** @type {Map<string, Set<Function>>} */
  const _listeners = new Map();

  /**
   * Registra um handler para um evento.
   * @param {string} event
   * @param {Function} handler
   */
  function on(event, handler) {
    if (!_listeners.has(event)) _listeners.set(event, new Set());
    _listeners.get(event).add(handler);
  }

  /**
   * Remove um handler específico de um evento.
   * @param {string} event
   * @param {Function} handler
   */
  function off(event, handler) {
    const set = _listeners.get(event);
    if (set) set.delete(handler);
  }

  /**
   * Registra um handler que será chamado apenas uma vez.
   * @param {string} event
   * @param {Function} handler
   */
  function once(event, handler) {
    const wrapper = (data) => {
      handler(data);
      off(event, wrapper);
    };
    on(event, wrapper);
  }

  /**
   * Emite um evento com payload opcional.
   * @param {string} event
   * @param {*} [data]
   */
  function emit(event, data) {
    const set = _listeners.get(event);
    if (!set) return;
    // Copia o set para evitar mutação durante iteração
    for (const handler of Array.from(set)) {
      try {
        handler(data);
      } catch (e) {
        console.error(`[EventBus] Erro no handler de "${event}":`, e);
      }
    }
  }

  /**
   * Remove TODOS os handlers de um evento (útil em resetGameState).
   * @param {string} [event] - se omitido, limpa tudo
   */
  function clear(event) {
    if (event) _listeners.delete(event);
    else _listeners.clear();
  }

  /**
   * Lista todos os eventos registrados (debug).
   */
  function debug() {
    console.table(
      Array.from(_listeners.entries()).map(([k, v]) => ({
        evento: k,
        handlers: v.size,
      }))
    );
  }

  return { on, off, once, emit, clear, debug };
})();

// ── Catálogo de eventos canônicos (documentação viva) ─────────────────────────
// game:start          — jogo iniciado
// game:pause          — jogo pausado
// game:resume         — jogo retomado
// game:returnMenu     — voltou ao menu
// game:stateChange    — { from, to }  qualquer mudança de estado
//
// player:move         — { x, y, dx, dy, moving }
// player:fix          — { car }
// player:diagnose     — { car }
// player:restock      — { parts }
// player:eat          — { item, hunger }
//
// car:arrive          — { car }
// car:fixed           — { car, money, rep }
// car:left            — { car, repLoss }
//
// fame:tierUp         — { tier, prev }
// weather:change      — { from, to }
//
// upgrade:bought      — { id, name }
// mission:complete    — { mission }
// achievement:unlock  — { achievement }
//
// day:open            — { day }
// day:close           — { day, report }
// day:report          — { data }
//
// cantina:buy         — {}
// cantina:eat         — { item }
