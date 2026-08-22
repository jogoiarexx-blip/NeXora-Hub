/* João e Crist - Console interno de diagnóstico v0.9.3-debug */
(function () {
    'use strict';

    const MAX_ENTRIES = 120;
    const entries = [];
    let panel, list, status, counter;
    let errorCount = 0;
    let warnCount = 0;
    let lastFreezeReport = 0;

    function stringify(value) {
        try {
            if (value instanceof Error) return value.stack || (value.name + ': ' + value.message);
            if (typeof value === 'string') return value;
            if (typeof value === 'undefined') return 'undefined';
            if (typeof value === 'function') return '[Function ' + (value.name || 'anonymous') + ']';
            return JSON.stringify(value, function (key, val) {
                if (typeof val === 'function') return '[Function]';
                if (val instanceof HTMLElement) return '<' + val.tagName.toLowerCase() + (val.id ? '#' + val.id : '') + '>';
                return val;
            });
        } catch (_) {
            try { return String(value); } catch (_) { return '[valor não exibível]'; }
        }
    }

    function stamp() {
        const d = new Date();
        return d.toLocaleTimeString('pt-BR', { hour12: false });
    }

    function render() {
        if (!list) return;
        list.innerHTML = '';
        const visible = entries.slice(-60);
        for (const item of visible) {
            const row = document.createElement('div');
            row.className = 'jc-debug-row jc-debug-' + item.level;
            row.textContent = '[' + item.time + '] ' + item.text;
            list.appendChild(row);
        }
        list.scrollTop = list.scrollHeight;
        if (counter) counter.textContent = 'ERROS ' + errorCount + '  •  AVISOS ' + warnCount;
        if (status) {
            if (errorCount > 0) {
                status.textContent = 'ERRO DETECTADO';
                status.className = 'jc-debug-status bad';
            } else if (warnCount > 0) {
                status.textContent = 'COM AVISOS';
                status.className = 'jc-debug-status warn';
            } else {
                status.textContent = 'SEM ERROS';
                status.className = 'jc-debug-status ok';
            }
        }
    }

    function add(level, args) {
        const text = Array.from(args || []).map(stringify).join(' ');
        if (!text) return;
        entries.push({ level, text, time: stamp() });
        if (entries.length > MAX_ENTRIES) entries.shift();
        if (level === 'error') errorCount++;
        if (level === 'warn') warnCount++;
        render();
    }

    const native = {
        error: console.error.bind(console),
        warn: console.warn.bind(console)
    };

    console.error = function () {
        native.error.apply(console, arguments);
        add('error', arguments);
    };
    console.warn = function () {
        native.warn.apply(console, arguments);
        add('warn', arguments);
    };

    window.addEventListener('error', function (event) {
        // Erro de carregamento de recurso (script/imagem/css)
        if (!event.message && event.target && event.target !== window) {
            const src = event.target.src || event.target.href || event.target.tagName || 'recurso desconhecido';
            add('error', ['RECURSO NÃO CARREGOU:', src]);
            return;
        }
        const where = event.filename ? (' em ' + event.filename.split('/').pop() + ':' + event.lineno + ':' + event.colno) : '';
        const errDetail = event.error && (event.error.stack || event.error.message) ? (event.error.stack || event.error.message) : '';
        if (event.message === 'Script error.' && !where && !errDetail) {
            add('warn', ['JS: Script error. genérico do navegador (sem arquivo/linha). O capturador interno do GAME LOOP tentará mostrar a causa real logo abaixo.']);
        } else {
            add('error', ['JS:', event.message + where, errDetail]);
        }
        if (panel) panel.classList.remove('collapsed');
    }, true);

    window.addEventListener('unhandledrejection', function (event) {
        add('error', ['PROMISE NÃO TRATADA:', event.reason || 'motivo desconhecido']);
        if (panel) panel.classList.remove('collapsed');
    });

    function buildUI() {
        const style = document.createElement('style');
        style.textContent = `
            #jc-debug-console{position:fixed;left:0;right:0;bottom:0;height:150px;z-index:2147483647;background:rgba(5,7,10,.95);border-top:2px solid #32d5ff;color:#e8f7ff;font:12px/1.35 Consolas,Monaco,monospace;box-shadow:0 -5px 18px rgba(0,0,0,.55);display:flex;flex-direction:column}
            #jc-debug-console.collapsed{height:30px}
            #jc-debug-console.collapsed .jc-debug-list{display:none}
            .jc-debug-head{height:30px;min-height:30px;display:flex;align-items:center;gap:10px;padding:0 8px;background:#101820;user-select:none}
            .jc-debug-title{font-weight:700;color:#66e5ff}.jc-debug-status{font-weight:700;padding:2px 7px;border-radius:3px}.jc-debug-status.ok{color:#6dff8a}.jc-debug-status.warn{color:#ffd45c}.jc-debug-status.bad{color:#ff6b6b;background:#401313}
            .jc-debug-counter{color:#b8c8d0}.jc-debug-spacer{flex:1}.jc-debug-btn{border:1px solid #49616d;background:#17252c;color:#e8f7ff;padding:3px 7px;border-radius:3px;cursor:pointer;font:11px Consolas,monospace}.jc-debug-btn:hover{background:#223640}
            .jc-debug-list{flex:1;overflow:auto;padding:5px 8px}.jc-debug-row{white-space:pre-wrap;overflow-wrap:anywhere;padding:2px 0;border-bottom:1px solid rgba(255,255,255,.04)}.jc-debug-error{color:#ff7777}.jc-debug-warn{color:#ffd45c}.jc-debug-info{color:#a9d8e8}
            @media(max-width:700px){#jc-debug-console{height:125px}.jc-debug-counter{display:none}.jc-debug-head{gap:5px}.jc-debug-btn{padding:3px 5px}}
        `;
        document.head.appendChild(style);

        panel = document.createElement('div');
        panel.id = 'jc-debug-console';
        panel.innerHTML = '<div class="jc-debug-head">' +
            '<span class="jc-debug-title">CONSOLE DO JOGO</span>' +
            '<span class="jc-debug-status ok">SEM ERROS</span>' +
            '<span class="jc-debug-counter">ERROS 0 • AVISOS 0</span>' +
            '<span class="jc-debug-spacer"></span>' +
            '<button class="jc-debug-btn" data-action="copy">COPIAR</button>' +
            '<button class="jc-debug-btn" data-action="clear">LIMPAR</button>' +
            '<button class="jc-debug-btn" data-action="toggle">RECOLHER</button>' +
            '</div><div class="jc-debug-list"></div>';
        document.body.appendChild(panel);
        list = panel.querySelector('.jc-debug-list');
        status = panel.querySelector('.jc-debug-status');
        counter = panel.querySelector('.jc-debug-counter');

        panel.addEventListener('click', function (e) {
            const action = e.target && e.target.dataset && e.target.dataset.action;
            if (!action) return;
            if (action === 'toggle') {
                panel.classList.toggle('collapsed');
                e.target.textContent = panel.classList.contains('collapsed') ? 'ABRIR' : 'RECOLHER';
            } else if (action === 'clear') {
                entries.length = 0; errorCount = 0; warnCount = 0; render();
            } else if (action === 'copy') {
                const text = entries.map(x => '[' + x.time + '] ' + x.level.toUpperCase() + ' ' + x.text).join('\n');
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(text).catch(() => {});
                }
            }
        });

        add('info', ['Console interno iniciado. Se o jogo travar, copie o erro exibido aqui.']);
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', buildUI);
    else buildUI();

    // Heartbeat preenchido pelo gameLoop. Se parar por erro em runtime, acusa congelamento.
    window.__gameDebugLastFrame = 0;
    setInterval(function () {
        const last = Number(window.__gameDebugLastFrame || 0);
        if (!last) return;
        const delta = Date.now() - last;
        if (delta > 2500 && Date.now() - lastFreezeReport > 5000) {
            lastFreezeReport = Date.now();
            const fatal = window.__gameDebugFatal;
            add('error', [fatal
                ? 'LOOP PAROU após ERRO FATAL capturado. Veja a mensagem ERRO FATAL NO GAME LOOP acima.'
                : 'LOOP DO JOGO PAROU há ' + Math.round(delta / 100) / 10 + 's. Veja o erro imediatamente acima.']);
            if (panel) panel.classList.remove('collapsed');
        }
    }, 1000);

    window.GameDebugConsole = {
        log: function () { add('info', arguments); },
        warn: function () { add('warn', arguments); },
        error: function () { add('error', arguments); },
        getEntries: function () { return entries.slice(); }
    };
})();
