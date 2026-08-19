// ========== SISTEMA DE SOM ==========
class SoundSystem {
    constructor() {
        this.enabled = true;
        this.volume = 0.5;
        this.sfxVolume = 0.5; // Melhoria #52: Volume de efeitos sonoros
        this.musicVolume = 0.3; // Melhoria #52: Volume de música
        this.audioContext = null;
        this.initialized = false;
        
        // Melhoria #53: Sistema de música de fundo
        this.musicPlaying = false;
        this.musicOscillators = [];
        this.musicGain = null;
        
        // Não inicializar AudioContext aqui - aguardar interação do usuário
    }
    
    // Melhoria #53: Música de fundo procedural
    startMusic(tempo = 'normal') {
        if (!this.enabled || !this.audioContext || this.musicPlaying) return;
        
        const ctx = this.audioContext;
        const now = ctx.currentTime;
        
        // Ganho principal da música
        this.musicGain = ctx.createGain();
        this.musicGain.gain.setValueAtTime(this.musicVolume, now);
        this.musicGain.connect(ctx.destination);
        
        // Batida base (kick)
        const kickInterval = tempo === 'fast' ? 0.3 : 0.5;
        this.playKick(now, kickInterval);
        
        // Linha de baixo
        this.playBassline(now, tempo);
        
        this.musicPlaying = true;
    }
    
    playKick(startTime, interval) {
        if (!this.musicGain) return;
        
        const ctx = this.audioContext;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(150, startTime);
        osc.frequency.exponentialRampToValueAtTime(40, startTime + 0.1);
        
        gain.gain.setValueAtTime(this.musicVolume * 0.5, startTime);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.1);
        
        osc.connect(gain);
        gain.connect(this.musicGain);
        
        osc.start(startTime);
        osc.stop(startTime + 0.1);
        
        // Repetir kick
        if (this.musicPlaying) {
            setTimeout(() => this.playKick(ctx.currentTime, interval), interval * 1000);
        }
    }
    
    playBassline(startTime, tempo) {
        if (!this.musicGain) return;
        
        const ctx = this.audioContext;
        const notes = tempo === 'fast' ? [110, 130, 147, 165] : [82.4, 98, 110, 123.5]; // A, B, C#, D
        const noteLength = tempo === 'fast' ? 0.4 : 0.6;
        
        notes.forEach((freq, i) => {
            const noteTime = startTime + i * noteLength;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const filter = ctx.createBiquadFilter();
            
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(freq, noteTime);
            
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(800, noteTime);
            filter.Q.value = 1;
            
            gain.gain.setValueAtTime(this.musicVolume * 0.3, noteTime);
            gain.gain.exponentialRampToValueAtTime(0.01, noteTime + noteLength);
            
            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.musicGain);
            
            osc.start(noteTime);
            osc.stop(noteTime + noteLength);
        });
        
        // Loop da bassline
        if (this.musicPlaying) {
            setTimeout(() => this.playBassline(ctx.currentTime, tempo), notes.length * noteLength * 1000);
        }
    }
    
    stopMusic() {
        this.musicPlaying = false;
        if (this.musicGain) {
            this.musicGain.disconnect();
            this.musicGain = null;
        }
        this.musicOscillators = [];
    }
    
    initAudioContext() {
        if (this.initialized) return;
        
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.initialized = true;
            
            // Resumir contexto se estiver suspenso (política de autoplay)
            if (this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }
        } catch (e) {
            console.warn('Web Audio API não suportada:', e);
            this.enabled = false;
        }
    }
    
    // Gerar sons proceduralmente usando Web Audio API
    playSound(type) {
        if (!this.enabled) return;
        
        // Inicializar AudioContext na primeira interação do usuário
        if (!this.initialized) {
            this.initAudioContext();
        }
        
        if (!this.audioContext) return;
        
        const ctx = this.audioContext;
        const now = ctx.currentTime;
        
        switch(type) {
            case 'punch':
                this.createPunchSound(ctx, now);
                break;
            case 'hit':
                this.createHitSound(ctx, now);
                break;
            case 'ko':
                this.createKOSound(ctx, now);
                break;
            case 'dash':
                this.createDashSound(ctx, now);
                break;
            case 'jump':
                this.createJumpSound(ctx, now);
                break;
            case 'combo':
                this.createComboSound(ctx, now);
                break;
            case 'powerup':
                this.createPowerUpSound(ctx, now);
                break;
            case 'levelComplete':
                this.createLevelCompleteSound(ctx, now);
                break;
            case 'victory':
                this.createVictorySound(ctx, now);
                break;
            case 'gameOver':
                this.createGameOverSound(ctx, now);
                break;
            case 'menuMove':
                this.createMenuMoveSound(ctx, now);
                break;
            case 'menuSelect':
                this.createMenuSelectSound(ctx, now);
                break;
            case 'menuBack':
                this.createMenuBackSound(ctx, now);
                break;
        }
    }
    
    createPunchSound(ctx, now) {
        // Melhoria #51: Som procedural melhorado com ADSR envelope
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();
        
        osc.type = 'square';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(50, now + 0.1);
        
        // ADSR Envelope (usando sfxVolume)
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(this.sfxVolume * 0.4, now + 0.01); // Attack
        gain.gain.linearRampToValueAtTime(this.sfxVolume * 0.25, now + 0.04); // Decay
        gain.gain.setValueAtTime(this.sfxVolume * 0.25, now + 0.07); // Sustain
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1); // Release
        
        // Filtro para dar mais corpo ao som
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1200, now);
        filter.frequency.exponentialRampToValueAtTime(400, now + 0.1);
        filter.Q.value = 2;
        
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(now);
        osc.stop(now + 0.1);
    }
    
    createHitSound(ctx, now) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.15);
        
        gain.gain.setValueAtTime(this.volume * 0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(now);
        osc.stop(now + 0.15);
    }
    
    createKOSound(ctx, now) {
        // Som de KO - explosão dramática
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc1.type = 'sawtooth';
        osc2.type = 'square';
        
        osc1.frequency.setValueAtTime(300, now);
        osc1.frequency.exponentialRampToValueAtTime(50, now + 0.3);
        
        osc2.frequency.setValueAtTime(150, now);
        osc2.frequency.exponentialRampToValueAtTime(25, now + 0.3);
        
        gain.gain.setValueAtTime(this.volume * 0.5, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        
        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);
        
        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.3);
        osc2.stop(now + 0.3);
    }
    
    createDashSound(ctx, now) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(400, now + 0.2);
        
        gain.gain.setValueAtTime(this.volume * 0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(now);
        osc.stop(now + 0.2);
    }
    
    createJumpSound(ctx, now) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(500, now + 0.1);
        
        gain.gain.setValueAtTime(this.volume * 0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(now);
        osc.stop(now + 0.1);
    }
    
    createComboSound(ctx, now) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.15);
        
        gain.gain.setValueAtTime(this.volume * 0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(now);
        osc.stop(now + 0.15);
    }
    
    createPowerUpSound(ctx, now) {
        // Arpejo ascendente
        const frequencies = [400, 500, 600, 800];
        frequencies.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + i * 0.05);
            
            gain.gain.setValueAtTime(this.volume * 0.2, now + i * 0.05);
            gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.05 + 0.1);
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            osc.start(now + i * 0.05);
            osc.stop(now + i * 0.05 + 0.1);
        });
    }
    
    createLevelCompleteSound(ctx, now) {
        // Fanfarra de vitória
        const melody = [523, 659, 784, 1047]; // C, E, G, C (oitava acima)
        melody.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now + i * 0.15);
            
            gain.gain.setValueAtTime(this.volume * 0.3, now + i * 0.15);
            gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.15 + 0.3);
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            osc.start(now + i * 0.15);
            osc.stop(now + i * 0.15 + 0.3);
        });
    }
    
    createVictorySound(ctx, now) {
        // Música épica de vitória
        const melody = [523, 659, 784, 1047, 1047, 784, 659, 523];
        melody.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now + i * 0.2);
            
            gain.gain.setValueAtTime(this.volume * 0.25, now + i * 0.2);
            gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.2 + 0.4);
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            osc.start(now + i * 0.2);
            osc.stop(now + i * 0.2 + 0.4);
        });
    }
    
    createGameOverSound(ctx, now) {
        // Som descendente de derrota
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(50, now + 1);
        
        gain.gain.setValueAtTime(this.volume * 0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 1);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(now);
        osc.stop(now + 1);
    }
    
    createMenuMoveSound(ctx, now) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, now);
        
        gain.gain.setValueAtTime(this.volume * 0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(now);
        osc.stop(now + 0.05);
    }
    
    createMenuSelectSound(ctx, now) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.setValueAtTime(800, now + 0.05);
        
        gain.gain.setValueAtTime(this.volume * 0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(now);
        osc.stop(now + 0.1);
    }
    
    createMenuBackSound(ctx, now) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(500, now);
        osc.frequency.setValueAtTime(300, now + 0.05);
        
        gain.gain.setValueAtTime(this.volume * 0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(now);
        osc.stop(now + 0.1);
    }
    
    toggle() {
        this.enabled = !this.enabled;
    }
}
