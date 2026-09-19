// ============================================================
// 音频系统
// ============================================================
class AudioSystem {
    constructor() {
        this.audioContext = null; this.soundGain = null;
        this.soundVolume = 0.8; this.enabled = true;
        this.soundDefs = {
            move: { freqs:[200], dur:0.08, type:'sine' },
            rotate: { freqs:[300], dur:0.08, type:'sine' },
            drop: { freqs:[150], dur:0.12, type:'sine' },
            click: { freqs:[400], dur:0.08, type:'sine' },
            pause: { freqs:[261.63], dur:0.15, type:'sine' },
            start: { freqs:[523.25,659.25,783.99], dur:0.5, type:'sine', stagger:0.05 },
            gameover: { freqs:[392,349.23,293.66], dur:0.6, type:'sine', stagger:0.08 },
            clear1: { freqs:[440], dur:0.3, type:'triangle', stagger:0.05 },
            clear2: { freqs:[440,554.37], dur:0.3, type:'triangle', stagger:0.05 },
            clear3: { freqs:[440,554.37,659.25], dur:0.3, type:'triangle', stagger:0.05 },
            clear4: { freqs:[440,554.37,659.25,830.61], dur:0.35, type:'triangle', stagger:0.05 },
            targetIncrease:{ freqs:[523.25,659.25,783.99], dur:0.6, type:'sine', stagger:0.05 },
            targetCheck: { freqs:[600,700,800], dur:0.5, type:'sine', stagger:0.05 },
            timeAdd: { freqs:[659.25,783.99,1046.5], dur:0.4, type:'sine', stagger:0.04 }
        };
    }
    async init() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.soundGain = this.audioContext.createGain();
            this.soundGain.gain.value = this.soundVolume;
            this.soundGain.connect(this.audioContext.destination);
        } catch (e) {}
    }
    playSound(name) {
        if (!this.enabled || !this.audioContext) return;
        const def = this.soundDefs[name];
        if (!def) return;
        try {
            if (this.audioContext.state === 'suspended') this.audioContext.resume();
            const now = this.audioContext.currentTime;
            const stagger = def.stagger || 0;
            const gain = this.audioContext.createGain();
            gain.connect(this.soundGain);
            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(this.soundVolume * 0.3, now + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.001, now + def.dur);
            def.freqs.forEach((freq, i) => {
                const osc = this.audioContext.createOscillator();
                osc.connect(gain);
                osc.frequency.value = freq;
                osc.type = def.type;
                const start = now + i * stagger;
                osc.start(start); osc.stop(start + def.dur);
            });
        } catch (e) {}
    }
    setSoundVolume(v) {
        this.soundVolume = Math.max(0, Math.min(1, v / 100));
        if (this.soundGain) this.soundGain.gain.value = this.soundVolume;
    }
    setSoundEnabled(e) { this.enabled = e; }
}

class BGM_Manager {
    constructor() {
        this.audio = null; this.currentTrack = null; this.isPlaying = false;
        this.volume = 0.5; this.basePath = 'audio/bgm/';
        this.tracks = { menu:'menu_bgm.mp3', challenge_menu:'challenge_menu_bgm.mp3', game:'game_bgm.mp3', result:'result_bgm.mp3' };
        this.enabled = true; this.pendingTrack = null; this._fadeRaf = null;
    }
    init() {
        const settings = localStorage.getItem('tetrisSettings');
        if (settings) { try { this.volume = (JSON.parse(settings).musicVolume || 70) / 100; } catch (e) {} }
    }
    play(trackName, force = false) {
        if (!this.enabled) return false;
        if (this.currentTrack === trackName && this.isPlaying && !force) return true;
        this.stop();
        const fileName = this.tracks[trackName];
        if (!fileName) return false;
        this.audio = new Audio(this.basePath + fileName);
        this.audio.volume = this.volume; this.audio.loop = true;
        this.currentTrack = trackName;
        const p = this.audio.play();
        if (p !== undefined) {
            p.then(() => { this.isPlaying = true; }).catch(() => {
                this.isPlaying = false;
                this.pendingTrack = trackName;
                const resume = () => {
                    if (this.pendingTrack && this.audio) {
                        this.audio.play().then(() => { this.isPlaying = true; }).catch(() => {});
                    }
                    document.removeEventListener('click', resume);
                    document.removeEventListener('keydown', resume);
                };
                document.addEventListener('click', resume, { once: true });
                document.addEventListener('keydown', resume, { once: true });
            });
        }
        return true;
    }
    stop() {
        if (this._fadeRaf) { cancelAnimationFrame(this._fadeRaf); this._fadeRaf = null; }
        if (this.audio) { this.audio.pause(); this.audio.currentTime = 0; this.isPlaying = false; }
        this.currentTrack = null;
    }
    pause() { if (this.audio && this.isPlaying) { this.audio.pause(); this.isPlaying = false; } }
    resume() { if (this.audio && !this.isPlaying && this.enabled) { this.audio.play().then(() => { this.isPlaying = true; }).catch(() => {}); } }
    setVolume(v) { this.volume = Math.max(0, Math.min(1, v)); if (this.audio) this.audio.volume = this.volume; }
    setEnabled(e) { this.enabled = e; if (!e) this.stop(); else if (this.currentTrack) this.play(this.currentTrack, true); }
    fadeIn(duration = 1000) {
        if (!this.audio || !this.enabled) return;
        if (this._fadeRaf) cancelAnimationFrame(this._fadeRaf);
        const start = Date.now(), target = this.volume;
        this.audio.volume = 0;
        const step = () => {
            const p = Math.min(1, (Date.now() - start) / duration);
            this.audio.volume = target * p;
            if (p < 1) this._fadeRaf = requestAnimationFrame(step);
            else this._fadeRaf = null;
        };
        step();
    }
    fadeOut(duration = 500) {
        if (!this.audio || !this.isPlaying) return;
        if (this._fadeRaf) cancelAnimationFrame(this._fadeRaf);
        const start = Date.now(), initial = this.audio.volume;
        const step = () => {
            const p = Math.min(1, (Date.now() - start) / duration);
            this.audio.volume = initial * (1 - p);
            if (p < 1) this._fadeRaf = requestAnimationFrame(step);
            else { this._fadeRaf = null; this.stop(); }
        };
        step();
    }
}

const audioSystem = new AudioSystem();
const bgmManager = new BGM_Manager();