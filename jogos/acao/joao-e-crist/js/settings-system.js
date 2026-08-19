class SettingsSystem {
    constructor() {
        this.defaults = {
            masterVolume: 70,
            musicVolume: 55,
            sfxVolume: 75,
            vibration: true,
            difficulty: 'normal'
        };
        this.data = this.load();
    }
    load() {
        try {
            return { ...this.defaults, ...(JSON.parse(localStorage.getItem('joaoCristSettings') || '{}')) };
        } catch (_) { return { ...this.defaults }; }
    }
    save() { localStorage.setItem('joaoCristSettings', JSON.stringify(this.data)); }
    cycleDifficulty(dir=1) {
        const order = ['facil','normal','dificil','insano'];
        let i = order.indexOf(this.data.difficulty);
        i = (i + dir + order.length) % order.length;
        this.data.difficulty = order[i]; this.save();
    }
    difficultyLabel() {
        return ({facil:'FÁCIL',normal:'NORMAL',dificil:'DIFÍCIL',insano:'INSANO'})[this.data.difficulty] || 'NORMAL';
    }
    difficultyMultiplier() {
        return ({facil:0.82,normal:1,dificil:1.22,insano:1.5})[this.data.difficulty] || 1;
    }
    applyAudio(soundSystem) {
        if (!soundSystem) return;
        soundSystem.volume = this.data.masterVolume / 100;
        soundSystem.musicVolume = (this.data.masterVolume / 100) * (this.data.musicVolume / 100);
        soundSystem.sfxVolume = (this.data.masterVolume / 100) * (this.data.sfxVolume / 100);
        if (soundSystem.musicGain && soundSystem.audioContext) {
            soundSystem.musicGain.gain.setValueAtTime(soundSystem.musicVolume, soundSystem.audioContext.currentTime);
        }
    }
}
window.SettingsSystem = SettingsSystem;
