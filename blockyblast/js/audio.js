class AudioManager {
    constructor() {
        this.muted = localStorage.getItem('blocky_muted') === 'true';
        this.sounds = {};
        this.ctx = null;
        this.buffers = {};
        this.init();
    }

    init() {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                this.ctx = new AudioContext();
            }
        } catch (e) {
            console.warn('Web Audio API not supported, using HTML5 Audio fallback', e);
        }

        const soundFiles = {
            pickup: 'assets/sounds/sound_00.ogg',
            place: 'assets/sounds/sound_08.ogg',
            place_heavy: 'assets/sounds/sound_05.ogg',
            clear_single: 'assets/sounds/sound_02.ogg',
            clear_combo: 'assets/sounds/sound_06.ogg',
            clear_super: 'assets/sounds/sound_04.ogg',
            new_turn: 'assets/sounds/sound_07.ogg',
            game_over: 'assets/sounds/sound_03.ogg',
            button: 'assets/sounds/sound_09.ogg',
            whoosh: 'assets/sounds/sound_10.ogg',
            win: 'assets/sounds/sound_12.ogg',
            powerup: 'assets/sounds/sound_01.ogg',
            revive: 'assets/sounds/sound_11.ogg'
        };

        for (const [key, path] of Object.entries(soundFiles)) {
            // HTML5 Audio fallback preloading
            const audio = new Audio(path);
            audio.preload = 'auto';
            this.sounds[key] = audio;

            // Web Audio API buffer loading for zero latency
            if (this.ctx) {
                fetch(path)
                    .then(res => res.arrayBuffer())
                    .then(buf => this.ctx.decodeAudioData(buf))
                    .then(decoded => {
                        this.buffers[key] = decoded;
                    })
                    .catch(() => {});
            }
        }

        // Unlock audio context on first interaction
        const unlock = () => {
            if (this.ctx && this.ctx.state === 'suspended') {
                this.ctx.resume();
            }
            window.removeEventListener('pointerdown', unlock);
            window.removeEventListener('keydown', unlock);
        };
        window.addEventListener('pointerdown', unlock);
        window.addEventListener('keydown', unlock);
    }

    play(key, volume = 1.0) {
        if (this.muted) return;

        if (this.ctx && this.buffers[key]) {
            try {
                if (this.ctx.state === 'suspended') {
                    this.ctx.resume();
                }
                const source = this.ctx.createBufferSource();
                source.buffer = this.buffers[key];
                const gain = this.ctx.createGain();
                gain.gain.value = volume;
                source.connect(gain);
                gain.connect(this.ctx.destination);
                source.start(0);
                return;
            } catch (e) {}
        }

        // Fallback
        const audio = this.sounds[key];
        if (audio) {
            try {
                const clone = audio.cloneNode();
                clone.volume = volume;
                clone.play().catch(() => {});
            } catch (e) {}
        }
    }

    toggleMute() {
        this.muted = !this.muted;
        localStorage.setItem('blocky_muted', this.muted);
        return this.muted;
    }
}

window.audioManager = new AudioManager();

