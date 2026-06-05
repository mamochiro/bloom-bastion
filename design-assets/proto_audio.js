// ============================================================
// BLOOM BASTION — procedural audio engine (Web Audio, no assets)
// Bright chiptune-meets-orchestral. Exposes window.BBAudio.
// ============================================================
(function () {
  let ctx = null, master = null, musicBus = null, sfxBus = null;
  let musicVol = 0.68, sfxVol = 0.85, musicOn = true, sfxOn = true;
  let lastHit = 0;
  let musicTimer = null, nextNote = 0, step = 0, track = null;

  function ensure() {
    if (ctx) return ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = 0.9; master.connect(ctx.destination);
    musicBus = ctx.createGain(); musicBus.gain.value = musicVol * 0.5; musicBus.connect(master);
    sfxBus = ctx.createGain(); sfxBus.gain.value = sfxVol; sfxBus.connect(master);
    return ctx;
  }
  function resume() { const c = ensure(); if (c && c.state === 'suspended') c.resume(); }

  // ---- low-level voices ----
  function tone(o) {
    if (!ctx || !sfxOn) return;
    const t0 = ctx.currentTime + (o.t || 0);
    const osc = ctx.createOscillator(), g = ctx.createGain();
    osc.type = o.type || 'sine';
    osc.frequency.setValueAtTime(o.freq, t0);
    if (o.to) osc.frequency.exponentialRampToValueAtTime(Math.max(1, o.to), t0 + (o.dur || 0.15));
    const vol = (o.vol == null ? 0.3 : o.vol);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + (o.a || 0.008));
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + (o.dur || 0.15));
    osc.connect(g); g.connect(o.bus || sfxBus);
    osc.start(t0); osc.stop(t0 + (o.dur || 0.15) + 0.03);
  }
  function noise(o) {
    if (!ctx || !sfxOn) return;
    const t0 = ctx.currentTime + (o.t || 0), dur = o.dur || 0.08;
    const src = ctx.createBufferSource();
    const buf = ctx.createBuffer(1, Math.max(1, Math.floor(ctx.sampleRate * dur)), ctx.sampleRate);
    const d = buf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    src.buffer = buf;
    const f = ctx.createBiquadFilter(); f.type = o.filterType || 'lowpass'; f.frequency.value = o.filter || 1400;
    const g = ctx.createGain();
    g.gain.setValueAtTime(o.vol == null ? 0.2 : o.vol, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(f); f.connect(g); g.connect(o.bus || sfxBus);
    src.start(t0); src.stop(t0 + dur + 0.02);
  }
  const N = (n) => 440 * Math.pow(2, (n - 69) / 12); // midi->hz

  // ---- SFX ----
  const FIRE = {
    blossom: () => { tone({ freq: N(84), to: N(91), type: 'sine', dur: 0.12, vol: 0.16 }); },
    storm:   () => { tone({ freq: N(76), to: N(60), type: 'sawtooth', dur: 0.16, vol: 0.13 }); noise({ filter: 3000, dur: 0.06, vol: 0.08 }); },
    sugar:   () => { tone({ freq: N(60), to: N(72), type: 'square', dur: 0.18, vol: 0.12 }); },
    luna:    () => { tone({ freq: N(88), type: 'triangle', dur: 0.26, vol: 0.12 }); tone({ freq: N(95), type: 'sine', dur: 0.26, vol: 0.06 }); },
    hive:    () => { tone({ freq: N(70), to: N(74), type: 'sawtooth', dur: 0.1, vol: 0.09 }); },
    bubble:  () => { tone({ freq: N(72), to: N(80), type: 'sine', dur: 0.16, vol: 0.13 }); },
  };

  const API = {
    init: ensure, resume,
    setMusic(v) { musicVol = Math.max(0, Math.min(1, v / 100)); if (musicBus) musicBus.gain.value = (musicOn ? musicVol : 0) * 0.5; },
    setSfx(v) { sfxVol = Math.max(0, Math.min(1, v / 100)); if (sfxBus) sfxBus.gain.value = sfxOn ? sfxVol : 0; },
    setMusicOn(b) { musicOn = !!b; if (musicBus) musicBus.gain.value = (musicOn ? musicVol : 0) * 0.5; },
    setSfxOn(b) { sfxOn = !!b; if (sfxBus) sfxBus.gain.value = sfxOn ? sfxVol : 0; },

    fire(family) { (FIRE[family] || FIRE.blossom)(); },
    hit() { const now = performance.now(); if (now - lastHit < 55) return; lastHit = now; noise({ filter: 2200, dur: 0.05, vol: 0.07 }); tone({ freq: N(82), type: 'square', dur: 0.04, vol: 0.05 }); },
    kill(combo) { const p = Math.min(Number(combo) || 0, 14); noise({ filter: 1600, dur: 0.08, vol: 0.12 }); tone({ freq: N(72 + p), to: N(84 + p), type: 'sine', dur: 0.16, vol: 0.16 }); tone({ freq: N(88 + p), type: 'triangle', t: 0.05, dur: 0.12, vol: 0.1 }); },
    coin() { tone({ freq: N(96), type: 'square', dur: 0.06, vol: 0.08 }); tone({ freq: N(100), type: 'square', t: 0.05, dur: 0.08, vol: 0.07 }); },
    place() { tone({ freq: N(48), type: 'triangle', dur: 0.12, vol: 0.18 }); noise({ filter: 800, dur: 0.06, vol: 0.12 }); tone({ freq: N(72), to: N(76), type: 'sine', t: 0.02, dur: 0.12, vol: 0.08 }); },
    ui() { tone({ freq: N(78), to: N(82), type: 'sine', dur: 0.07, vol: 0.06 }); },
    deny() { tone({ freq: N(58), to: N(52), type: 'sawtooth', dur: 0.18, vol: 0.1 }); },
    upgrade() { [0, 4, 7, 12].forEach((s, i) => { tone({ freq: N(72 + s), type: 'triangle', t: i * 0.06, dur: 0.22, vol: 0.13 }); tone({ freq: N(84 + s), type: 'sine', t: i * 0.06, dur: 0.18, vol: 0.06 }); }); },
    life() { tone({ freq: N(67), type: 'triangle', dur: 0.22, vol: 0.16 }); tone({ freq: N(63), type: 'triangle', t: 0.16, dur: 0.3, vol: 0.16 }); noise({ filter: 500, dur: 0.2, vol: 0.06 }); },
    waveStart(boss) {
      if (boss) { tone({ freq: N(36), type: 'sawtooth', dur: 1.1, vol: 0.16 }); tone({ freq: N(43), type: 'sawtooth', dur: 1.1, vol: 0.12 }); noise({ filter: 300, dur: 0.9, vol: 0.08 }); return; }
      noise({ filter: 1800, dur: 0.5, vol: 0.07 });
      [0, 0.18].forEach((t, i) => [N(60), N(64), N(67)].forEach(f => tone({ freq: f, type: 'sawtooth', t: t, dur: 0.3, vol: 0.07 })));
    },
    boss() { tone({ freq: N(31), type: 'sawtooth', dur: 1.4, vol: 0.18 }); tone({ freq: N(43), to: N(50), type: 'sawtooth', t: 0.3, dur: 1.0, vol: 0.12 }); noise({ filter: 400, dur: 1.2, vol: 0.1 }); },
    waveClear() { [0, 4, 7].forEach((s, i) => tone({ freq: N(72 + s), type: 'triangle', t: i * 0.08, dur: 0.3, vol: 0.13 })); tone({ freq: N(96), type: 'sine', t: 0.24, dur: 0.4, vol: 0.08 }); },
    win() { [0, 4, 7, 12, 16, 19].forEach((s, i) => { tone({ freq: N(60 + s), type: 'sawtooth', t: i * 0.1, dur: 0.4, vol: 0.1 }); tone({ freq: N(72 + s), type: 'triangle', t: i * 0.1, dur: 0.4, vol: 0.08 }); }); },
    lose() { [0, -2, -5, -7].forEach((s, i) => { tone({ freq: N(64 + s), type: 'triangle', t: i * 0.18, dur: 0.5, vol: 0.12 }); }); noise({ filter: 500, dur: 0.6, vol: 0.05 }); },

    // ---- generative background music ----
    startMusic(name) {
      ensure(); if (!ctx) return;
      if (track === name && musicTimer) return;
      track = name; if (musicTimer) { clearInterval(musicTimer); musicTimer = null; }
      nextNote = ctx.currentTime + 0.1; step = 0;
      musicTimer = setInterval(schedule, 25);
    },
    stopMusic() { if (musicTimer) { clearInterval(musicTimer); musicTimer = null; } track = null; },
  };

  // chord progression (scale degrees as midi roots), arp offsets
  const PROG = [[57, 'maj'], [64, 'maj'], [60, 'min'], [53, 'maj']]; // A E C(min) F-ish, gentle
  const QUAL = { maj: [0, 4, 7, 12], min: [0, 3, 7, 12] };
  function mnote(midi, type, t, dur, vol) { tone({ freq: N(midi), type: type, t: Math.max(0, t - ctx.currentTime), dur: dur, vol: vol, bus: musicBus }); }
  function schedule() {
    if (!ctx) return;
    const bpm = track === 'battle' ? 118 : 84;
    const spb = 60 / bpm, s16 = spb / 4;
    while (nextNote < ctx.currentTime + 0.12) {
      const bar = Math.floor(step / 16) % PROG.length;
      const [root, q] = PROG[bar];
      const chord = QUAL[q].map(o => root + o);
      const beat = step % 16;
      // bass on beats
      if (beat % 4 === 0) mnote(root - 12, 'triangle', nextNote, spb * 0.9, 0.16);
      // soft pad chord at bar start
      if (beat === 0) chord.forEach(m => mnote(m, 'sine', nextNote, spb * 3.6, 0.05));
      // arp pluck every 16th (battle) / 8th (menu)
      const arpEvery = track === 'battle' ? 2 : 4;
      if (beat % arpEvery === 0) { const m = chord[(step / 1) % chord.length | 0]; mnote(m + 12, track === 'battle' ? 'square' : 'triangle', nextNote, s16 * 1.6, track === 'battle' ? 0.05 : 0.045); }
      nextNote += s16; step++;
    }
  }

  // first user gesture: unlock audio + start menu music
  function unlock() { resume(); if (!track) API.startMusic('menu'); }
  window.addEventListener('pointerdown', unlock, { once: false });
  window.addEventListener('keydown', unlock, { once: false });

  // universal soft UI tap on any button press
  document.addEventListener('click', function (e) { if (e.target && e.target.closest && e.target.closest('button')) { resume(); API.ui(); } }, true);

  window.BBAudio = API;
})();
