// Tile Trio — all sound is synthesised with the Web Audio API (no audio files).
const Sound = (() => {
  let ctx = null, master, sfx, mus, noiseBuf;
  let soundOn = true, musicOn = true;
  let musicTimer = null, nextT = 0, step = 0;

  function init() {
    if (ctx) {
      if (ctx.state === 'suspended') ctx.resume();
      return true;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();
    const comp = ctx.createDynamicsCompressor();
    comp.connect(ctx.destination);
    master = ctx.createGain(); master.gain.value = 0.85; master.connect(comp);
    sfx = ctx.createGain(); sfx.gain.value = soundOn ? 1 : 0; sfx.connect(master);
    mus = ctx.createGain(); mus.gain.value = musicOn ? 0.55 : 0; mus.connect(master);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    if (musicOn) startMusic();
    return true;
  }

  function tone(f, o = {}) {
    if (!ctx) return;
    const { type = 'sine', at = 0, dur = 0.15, vol = 0.25, f2 = null, attack = 0.004, dest = sfx, when = null } = o;
    const t = when != null ? when : ctx.currentTime + at;
    const osc = ctx.createOscillator(), g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(f, t);
    if (f2) osc.frequency.exponentialRampToValueAtTime(f2, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g); g.connect(dest);
    osc.start(t); osc.stop(t + dur + 0.03);
  }

  function noise(o = {}) {
    if (!ctx) return;
    const { at = 0, dur = 0.08, vol = 0.2, freq = 1800, f2 = null, q = 1, ftype = 'bandpass' } = o;
    const t = ctx.currentTime + at;
    const src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    src.buffer = noiseBuf;
    f.type = ftype; f.Q.value = q;
    f.frequency.setValueAtTime(freq, t);
    if (f2) f.frequency.exponentialRampToValueAtTime(f2, t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f); f.connect(g); g.connect(sfx);
    src.start(t, Math.random() * 0.5); src.stop(t + dur + 0.02);
  }

  // ---------- Background music: gentle original loop ----------
  const midi = (m) => 440 * Math.pow(2, (m - 69) / 12);
  const CHORDS = [[60, 64, 67], [57, 60, 64], [53, 57, 60], [55, 59, 62]]; // C  Am  F  G
  const MELODY = [
    76, null, 79, null, 81, null, 79, 76,   72, null, 74, 76, null, null, 74, null,
    72, null, 69, 72, 74, null, 72, null,   71, null, 74, null, 79, null, null, null,
    76, null, 74, 76, 79, null, 81, null,   84, null, 81, 79, 76, null, null, null,
    77, null, 76, 74, 72, null, 69, null,   71, 72, 74, null, 72, null, null, null,
  ];
  const STEP = 60 / 100 / 2; // eighth notes at 100 bpm

  function pluck(f, when, vol = 0.05) {
    tone(f, { type: 'triangle', when, dur: 0.38, vol, attack: 0.006, dest: mus });
    tone(f * 2, { type: 'sine', when, dur: 0.16, vol: vol * 0.25, dest: mus });
  }
  function pad(notes, when, dur) {
    if (!ctx) return;
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 1100;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, when);
    g.gain.linearRampToValueAtTime(0.022, when + 0.35);
    g.gain.setValueAtTime(0.022, when + dur - 0.4);
    g.gain.linearRampToValueAtTime(0.0001, when + dur);
    f.connect(g); g.connect(mus);
    notes.forEach((m) => {
      [-6, 6].forEach((det) => {
        const o = ctx.createOscillator();
        o.type = 'triangle'; o.frequency.value = midi(m); o.detune.value = det;
        o.connect(f); o.start(when); o.stop(when + dur + 0.05);
      });
    });
  }

  function schedule() {
    if (!ctx || !musicOn) return;
    while (nextT < ctx.currentTime + 0.5) {
      const s = step % 8, bar = Math.floor(step / 8) % 4, chord = CHORDS[bar];
      if (s === 0) pad(chord, nextT, STEP * 8);
      if (s === 0 || s === 4) tone(midi(chord[0] - 12), { when: nextT, dur: 0.45, vol: 0.09, dest: mus });
      if (s === 6) tone(midi(chord[2] - 12), { when: nextT, dur: 0.25, vol: 0.05, dest: mus });
      const m = MELODY[step % MELODY.length];
      if (m) pluck(midi(m), nextT);
      nextT += STEP; step++;
    }
  }

  function startMusic() {
    if (!ctx || musicTimer) return;
    nextT = ctx.currentTime + 0.1;
    musicTimer = setInterval(schedule, 120);
    schedule();
  }
  function stopMusic() {
    clearInterval(musicTimer); musicTimer = null;
  }

  document.addEventListener('visibilitychange', () => {
    if (!ctx) return;
    if (document.hidden) ctx.suspend(); else ctx.resume();
  });

  return {
    unlock: init,
    setSound(on) { soundOn = on; if (sfx) sfx.gain.value = on ? 1 : 0; },
    setMusic(on) {
      musicOn = on;
      if (!mus) return;
      mus.gain.setTargetAtTime(on ? 0.55 : 0, ctx.currentTime, 0.05);
      if (on) startMusic(); else stopMusic();
    },
    tap(i = 0) {
      const f = 520 * Math.pow(2, (i * 2) / 12);
      tone(f, { type: 'triangle', dur: 0.1, vol: 0.2 });
      tone(f * 2, { dur: 0.06, vol: 0.05 });
    },
    land() {
      noise({ dur: 0.05, vol: 0.22, freq: 2600, q: 2 });
      tone(190, { dur: 0.08, vol: 0.14, f2: 120 });
    },
    match(combo = 1) {
      const k = Math.pow(2, Math.min(combo - 1, 7) * 2 / 12);
      [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f * k, { type: 'triangle', at: i * 0.05, dur: 0.28, vol: 0.16 }));
      tone(2093 * k, { at: 0.2, dur: 0.4, vol: 0.05 });
      noise({ dur: 0.2, vol: 0.06, freq: 7000, ftype: 'highpass' });
    },
    blocked() { tone(150, { type: 'square', dur: 0.09, vol: 0.05, f2: 110 }); },
    undo() { tone(720, { type: 'triangle', dur: 0.16, vol: 0.18, f2: 340 }); },
    magnet() {
      tone(260, { dur: 0.45, vol: 0.18, f2: 950 });
      tone(390, { type: 'triangle', at: 0.05, dur: 0.4, vol: 0.07, f2: 1300 });
    },
    shuffle() {
      noise({ dur: 0.5, vol: 0.16, freq: 500, f2: 5000, q: 3 });
      [0, 0.1, 0.2, 0.3].forEach((at, i) => tone(600 + i * 120, { type: 'triangle', at, dur: 0.08, vol: 0.08 }));
    },
    click() { tone(880, { dur: 0.06, vol: 0.14 }); tone(1320, { at: 0.03, dur: 0.05, vol: 0.06 }); },
    coin() { tone(988, { type: 'square', dur: 0.07, vol: 0.05 }); tone(1319, { type: 'square', at: 0.07, dur: 0.2, vol: 0.05 }); },
    win() {
      [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5, 1318.5].forEach((f, i) =>
        tone(f, { type: 'triangle', at: i * 0.11, dur: i === 6 ? 0.7 : 0.25, vol: 0.18 }));
      [261.6, 329.6, 392].forEach((f) => tone(f, { at: 0.66, dur: 0.9, vol: 0.06 }));
    },
    lose() {
      [440, 392, 349.2, 293.7].forEach((f, i) => tone(f, { type: 'triangle', at: i * 0.17, dur: 0.32, vol: 0.16, f2: f * 0.97 }));
      tone(110, { type: 'sine', at: 0.6, dur: 0.6, vol: 0.15, f2: 70 });
    },
  };
})();
