// audio.js - Sistema de Áudio Procedural
class AudioManager {
    constructor() {
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.sounds = {};
            this.volume = CONFIG.AUDIO?.VOLUME || 0.3;
            this.enabled = CONFIG.AUDIO?.ENABLED ?? true;
            this.musicNode = null;
            this.musicGain = null;
            
            this.generateSounds();
            
            // ✅ FIX: navegadores modernos iniciam o AudioContext em estado
            // "suspended" até haver um gesto do usuário (política de autoplay).
            // Sem isto, nenhum som tocava mesmo com áudio habilitado.
            this.resumeOnGesture = () => {
                if (this.ctx && this.ctx.state === 'suspended') {
                    this.ctx.resume();
                }
            };
            ['click', 'keydown', 'touchstart'].forEach(evt => {
                window.addEventListener(evt, this.resumeOnGesture);
            });
            
            console.log('🔊 AudioManager inicializado');
        } catch(e) {
            console.warn('❌ AudioContext não disponível:', e);
            this.enabled = false;
        }
    }
    
    generateSounds() {
        // Sons procedurais (não precisa de arquivos!)
        this.sounds = {
            paddleHit: () => this.playTone(440, 0.05, 'sine', 0.3),
            brickBreak: () => this.playTone(880, 0.1, 'square', 0.2),
            wallBounce: () => this.playTone(220, 0.05, 'triangle', 0.25),
            coin: () => this.playMelody([
                {freq: 523, dur: 0.05},
                {freq: 659, dur: 0.05},
                {freq: 784, dur: 0.1}
            ], 0.15),
            lifeLost: () => this.playMelody([
                {freq: 440, dur: 0.15},
                {freq: 330, dur: 0.15},
                {freq: 220, dur: 0.2}
            ], 0.3),
            levelComplete: () => this.playMelody([
                {freq: 523, dur: 0.1},
                {freq: 659, dur: 0.1},
                {freq: 784, dur: 0.1},
                {freq: 1047, dur: 0.3}
            ], 0.2),
            powerup: () => this.playMelody([
                {freq: 659, dur: 0.05},
                {freq: 784, dur: 0.05},
                {freq: 1047, dur: 0.1}
            ], 0.2),
            gameOver: () => this.playMelody([
                {freq: 523, dur: 0.2},
                {freq: 494, dur: 0.2},
                {freq: 440, dur: 0.2},
                {freq: 392, dur: 0.4}
            ], 0.25),
            upgrade: () => this.playTone(1047, 0.15, 'sine', 0.2)
        };
    }
    
    playTone(frequency, duration, type = 'sine', volume = this.volume) {
        if (!this.enabled || !this.ctx) return;
        
        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            
            osc.frequency.value = frequency;
            osc.type = type;
            
            gain.gain.setValueAtTime(volume, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
            
            osc.start(this.ctx.currentTime);
            osc.stop(this.ctx.currentTime + duration);
        } catch(e) {
            console.warn('Audio error:', e);
        }
    }
    
    playMelody(notes, volume = this.volume) {
        if (!this.enabled || !this.ctx) return;
        
        let time = this.ctx.currentTime;
        notes.forEach(note => {
            this.scheduleTone(note.freq, note.dur, time, volume);
            time += note.dur;
        });
    }
    
    scheduleTone(frequency, duration, startTime, volume) {
        if (!this.ctx) return;
        
        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            
            osc.frequency.value = frequency;
            osc.type = 'sine';
            
            gain.gain.setValueAtTime(volume, startTime);
            gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
            
            osc.start(startTime);
            osc.stop(startTime + duration);
        } catch(e) {
            console.warn('Audio error:', e);
        }
    }
    
    play(soundName) {
        if (this.sounds[soundName]) {
            this.sounds[soundName]();
        }
    }
    
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
    }
    
    toggle() {
        this.enabled = !this.enabled;
        return this.enabled;
    }
}
