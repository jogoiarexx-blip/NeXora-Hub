// Sistema unificado de controles: teclado + gamepad, configurável por jogador.
class Controles {
    constructor() {
        this.storageKey = 'joaoCristKeyboardConfig';
        this.defaults = {
            1: { left:'a', right:'d', up:'w', attack:' ', dash:'Shift', pause:'p' },
            2: { left:'ArrowLeft', right:'ArrowRight', up:'ArrowUp', attack:'Enter', dash:'ArrowDown', pause:'Backspace' }
        };
        const saved = this.carregar();
        this.player1 = { ...this.defaults[1], ...(saved?.[1] || {}) };
        this.player2 = { ...this.defaults[2], ...(saved?.[2] || {}) };
        this.atualizarDescricoes();
    }

    normalizarTecla(tecla) {
        if (typeof tecla !== 'string') return tecla;
        if (tecla.length === 1 && /[A-Z]/i.test(tecla)) return tecla.toLowerCase();
        return tecla;
    }

    carregar() {
        try { return JSON.parse(localStorage.getItem(this.storageKey) || 'null'); }
        catch (_) { return null; }
    }

    salvar() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify({1:this.player1,2:this.player2}));
        } catch (_) {}
        this.atualizarDescricoes();
    }

    atualizarDescricoes() {
        if (this.player1) this.player1.description = 'Jogador 1 - teclado configurável';
        if (this.player2) this.player2.description = 'Jogador 2 - teclado configurável';
    }

    obterControles(numeroJogador) {
        return numeroJogador === 2 ? this.player2 : this.player1;
    }

    definirTecla(numeroJogador, acao, tecla) {
        const c = this.obterControles(numeroJogador);
        if (!c || !acao) return null;
        tecla = this.normalizarTecla(tecla);
        const anterior = c[acao];
        // Se a tecla já pertence a outra ação deste jogador, troca em vez de duplicar.
        const conflito = ['left','right','up','attack','dash','pause'].find(a => a !== acao && c[a] === tecla);
        if (conflito) c[conflito] = anterior;
        c[acao] = tecla;
        this.salvar();
        return conflito;
    }

    restaurarPadrao(numeroJogador=null) {
        const restore = n => {
            const target = n === 2 ? this.player2 : this.player1;
            Object.assign(target, this.defaults[n]);
        };
        if (numeroJogador) restore(numeroJogador); else { restore(1); restore(2); }
        this.salvar();
    }

    verificarTecla(tecla, numeroJogador) {
        const controles = this.obterControles(numeroJogador);
        return !!controles && Object.values(controles).includes(this.normalizarTecla(tecla));
    }

    teclaParaAcao(tecla, acao) {
        tecla = this.normalizarTecla(tecla);
        return [1,2].some(n => this.obterControles(n)?.[acao] === tecla);
    }

    acaoAtiva(numeroJogador, acao, keyboardState) {
        const c = this.obterControles(numeroJogador);
        const key = c?.[acao];
        const keyboard = key ? !!keyboardState?.[key] : false;
        const pad = !!window.gamepadSystem?.isActionDown?.(numeroJogador, acao);
        return keyboard || pad;
    }

    nomeTecla(tecla) {
        const nomes = {
            ' ':'ESPAÇO', 'Shift':'SHIFT', 'Enter':'ENTER', 'Backspace':'BACKSPACE',
            'ArrowLeft':'←', 'ArrowRight':'→', 'ArrowUp':'↑', 'ArrowDown':'↓',
            'Escape':'ESC', 'Control':'CTRL', 'Alt':'ALT', 'Tab':'TAB'
        };
        return nomes[tecla] || String(tecla || '?').toUpperCase();
    }

    mostrarInstrucoes() {
        const p1=this.player1,p2=this.player2;
        return {
            player1: p1.description, player2: p2.description,
            instrucoes: [
                `JOGADOR 1: ${this.nomeTecla(p1.left)}/${this.nomeTecla(p1.right)} mover • ${this.nomeTecla(p1.up)} pular • ${this.nomeTecla(p1.attack)} atacar • ${this.nomeTecla(p1.dash)} dash`,
                `JOGADOR 2: ${this.nomeTecla(p2.left)}/${this.nomeTecla(p2.right)} mover • ${this.nomeTecla(p2.up)} pular • ${this.nomeTecla(p2.attack)} atacar • ${this.nomeTecla(p2.dash)} dash`
            ]
        };
    }
}
const sistemControles = new Controles();
window.sistemControles = sistemControles;
