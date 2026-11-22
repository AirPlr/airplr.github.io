// Musica ed effetti generati con Web Audio: nessun file esterno.
let ac = null, master, musicBus, sfxBus;
let muted = false;
try { muted = localStorage.getItem('volo-muted') === '1'; } catch (_) { /* ignore */ }

const SEMI = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const fcache = {};
export function nf(n) {
  if (fcache[n]) return fcache[n];
  const m = /^([A-G])([#b]?)(-?\d)$/.exec(n);
  if (!m) return 0;
  const s = SEMI[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
  const midi = (+m[3] + 1) * 12 + s;
  return (fcache[n] = 440 * Math.pow(2, (midi - 69) / 12));
}

function tone(f, t, dur, type = 'triangle', vol = 0.2, dest = sfxBus, slideTo = null, attack = 0.012) {
  if (!ac || !f) return;
  const o = ac.createOscillator(), g = ac.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f, t);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(dest);
  o.start(t); o.stop(t + dur + 0.05);
}

let noiseBuf = null;
function noise(t, dur, f0, f1, vol = 0.2, q = 1.2) {
  if (!ac) return;
  if (!noiseBuf) {
    noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  const s = ac.createBufferSource(); s.buffer = noiseBuf;
  const bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = q;
  bp.frequency.setValueAtTime(f0, t); bp.frequency.exponentialRampToValueAtTime(f1, t + dur);
  const g = ac.createGain();
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + dur * 0.3); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(bp); bp.connect(g); g.connect(sfxBus);
  s.start(t); s.stop(t + dur + 0.05);
}

// ---------- Canzoni (crome: "." pausa, "-" prolunga) ----------
const SONGS = {
  title: { bpm: 80, tracks: [
    { type: 'triangle', vol: 0.16, n: 'E5 - G5 - C6 - B5 - A5 - G5 - E5 - - - F5 - A5 - G5 - E5 - D5 - - - - - . . E5 - G5 - C6 - D6 - E6 - D6 - C6 - A5 - G5 - E5 - F5 - D5 - C5 - - - - - . .' },
    { type: 'sine', vol: 0.22, n: 'C3 - - - G2 - - - A2 - - - E2 - - - F2 - - - C3 - - - G2 - - - D3 - G2 - C3 - - - E3 - - - A2 - - - F2 - - - G2 - - - G2 - - - C3 - - - G2 - C3 -' },
    { type: 'sine', vol: 0.06, n: '. G4 . C5 . G4 . E5 . E4 . A4 . C5 . A4 . A4 . C5 . F4 . A4 . B4 . D5 . G4 . B4 . G4 . C5 . E5 . G5 . C5 . E5 . A4 . C5 . F4 . A4 . B4 . D5 . G4 . B4 . E4 . G4 . C5 . .' },
  ] },
  lacci: { bpm: 96, tracks: [
    { type: 'triangle', vol: 0.15, n: 'G4 - B4 D5 - - B4 - C5 - A4 - F#4 - A4 - G4 - B4 D5 - - G5 - F#5 - E5 - D5 - - - E5 - C5 - E5 G5 - E5 D5 - B4 - D5 - G4 - A4 - B4 C5 - A4 F#4 - G4 - - - . . . .' },
    { type: 'sine', vol: 0.22, n: 'G2 - - - D3 - - - A2 - - - D3 - - - G2 - - - B2 - - - D3 - - - A2 - - - C3 - - - E3 - - - G2 - - - B2 - - - D3 - - - A2 - - - G2 - - - D3 - G2 -' },
    { type: 'sine', vol: 0.05, n: '. D4 . G4 . D4 . G4 . E4 . A4 . F#4 . A4 . D4 . G4 . D4 . B4 . F#4 . A4 . F#4 . D4 . E4 . G4 . E4 . C5 . D4 . G4 . D4 . B3 . F#4 . A4 . C4 . D4 . D4 . B3 . G3 . .' },
  ] },
  tortellandia: { bpm: 120, tracks: [
    { type: 'triangle', vol: 0.14, n: 'C5 . E5 . G5 . E5 . F5 . A5 . G5 - - . E5 . G5 . C6 . G5 . A5 . G5 . E5 - - . F5 . E5 . D5 . F5 . E5 . D5 . C5 . E5 . D5 . E5 . F5 . D5 . C5 - - . G4 . . .' },
    { type: 'sine', vol: 0.22, n: 'C3 . G2 . C3 . G2 . F2 . C3 . G2 . D3 . C3 . G2 . C3 . G2 . F2 . C3 . C3 . G2 . D3 . A2 . D3 . A2 . C3 . G2 . C3 . G2 . G2 . D3 . G2 . B2 . C3 . G2 . C3 . . .' },
    { type: 'square', vol: 0.025, n: '. . E4 G4 . . E4 G4 . . F4 A4 . . D4 B3 . . E4 G4 . . E4 G4 . . F4 A4 . . E4 G4 . . F4 A4 . . F4 A4 . . E4 G4 . . E4 G4 . . D4 F4 . . D4 F4 . . E4 G4 . . . .' },
  ] },
  giglia: { bpm: 84, tracks: [
    { type: 'triangle', vol: 0.15, n: 'A4 - - C5 F5 - E5 - D5 - - C5 Bb4 - A4 - G4 - - A4 Bb4 - D5 - C5 - - - - - . . A4 - - C5 F5 - G5 - A5 - - G5 F5 - D5 - E5 - - G5 F5 - E5 - F5 - - - - - . .' },
    { type: 'sine', vol: 0.22, n: 'F2 - - - C3 - - - Bb2 - - - F2 - - - C3 - - - G2 - - - C3 - - - E3 - C3 - F2 - - - A2 - - - D3 - - - Bb2 - - - C3 - - - C3 - - - F2 - - - C3 - F2 -' },
    { type: 'sine', vol: 0.05, n: '. C4 F4 A4 . C4 F4 A4 . D4 F4 Bb4 . C4 F4 A4 . E4 G4 C5 . D4 G4 Bb4 . E4 G4 C5 . E4 G4 Bb4 . C4 F4 A4 . C4 F4 A4 . F4 A4 D5 . D4 F4 Bb4 . E4 G4 C5 . E4 G4 Bb4 . C4 F4 A4 . . . .' },
  ] },
  pendolina: { bpm: 88, tracks: [
    { type: 'triangle', vol: 0.15, n: 'F#5 - E5 - D5 - A4 - B4 - D5 - E5 - - - F#5 - A5 - G5 - F#5 - E5 - - - - - . . D5 - E5 - F#5 - D5 - B4 - A4 - B4 - D5 - E5 - F#5 - E5 - C#5 - D5 - - - - - . .' },
    { type: 'sine', vol: 0.22, n: 'D3 - - - A2 - - - G2 - - - A2 - - - D3 - - - B2 - - - A2 - - - E3 - A2 - B2 - - - F#2 - - - G2 - - - D3 - - - A2 - - - A2 - - - D3 - - - A2 - D3 -' },
    { type: 'sine', vol: 0.05, n: '. F#4 A4 . . F#4 A4 . . G4 B4 . . E4 A4 . . F#4 A4 . . F#4 B4 . . E4 A4 . . C#4 E4 . . D4 F#4 . . C#4 F#4 . . D4 G4 . . D4 F#4 . . E4 A4 . . C#4 E4 . . D4 F#4 . . . . .' },
  ] },
  amor: { bpm: 76, tracks: [
    { type: 'triangle', vol: 0.15, n: 'E5 - - - A4 - C5 - B4 - - - E4 - G4 - A4 - - - C5 - E5 - D5 - - - - - . . F5 - - - E5 - D5 - C5 - - - B4 - A4 - G#4 - - - B4 - E5 - A4 - - - - - . .' },
    { type: 'sine', vol: 0.22, n: 'A2 - - - E3 - - - E2 - - - B2 - - - F2 - - - C3 - - - G2 - - - D3 - - - D3 - - - A2 - - - A2 - - - E3 - - - E2 - - - E3 - - - A2 - - - E3 - A2 -' },
    { type: 'sine', vol: 0.05, n: '. A3 C4 E4 . A3 C4 E4 . G#3 B3 E4 . G#3 B3 E4 . A3 C4 F4 . A3 C4 F4 . B3 D4 G4 . B3 D4 G4 . A3 D4 F4 . A3 D4 F4 . A3 C4 E4 . A3 C4 E4 . G#3 B3 E4 . G#3 B3 D4 . A3 C4 E4 . . . .' },
  ] },
  marsi: { bpm: 92, tracks: [
    { type: 'triangle', vol: 0.15, n: 'Bb4 - Eb5 - G5 - F5 - Eb5 - - - C5 - Bb4 - Ab4 - C5 - Eb5 - D5 - Bb4 - - - - - . . G4 - Bb4 - Eb5 - F5 - G5 - - - F5 - Eb5 - C5 - D5 - Eb5 - F5 - Eb5 - - - - - . .' },
    { type: 'sine', vol: 0.22, n: 'Eb3 - - - Bb2 - - - C3 - - - Ab2 - - - Ab2 - - - Eb3 - - - Bb2 - - - F3 - Bb2 - Eb3 - - - G2 - - - C3 - - - G2 - - - Ab2 - - - Bb2 - - - Eb3 - - - Bb2 - Eb3 -' },
    { type: 'sine', vol: 0.05, n: '. G4 Bb4 . . G4 Bb4 . . Eb4 G4 . . C4 Eb4 . . C4 Eb4 . . Eb4 Ab4 . . D4 F4 . . D4 F4 . . G4 Bb4 . . Eb4 G4 . . Eb4 G4 . . Eb4 G4 . . C4 Eb4 . . D4 F4 . . G4 Bb4 . . . . .' },
  ] },
  flight: { bpm: 132, tracks: [
    { type: 'triangle', vol: 0.14, n: 'D5 . G5 . B5 . A5 G5 E5 . G5 . A5 - - . D5 . G5 . B5 . D6 . C6 - B5 - A5 - - . B5 . A5 . G5 . E5 . D5 . E5 . G5 . A5 . B5 . A5 . G5 . F#5 . G5 - - . D5 . . .' },
    { type: 'sine', vol: 0.2, n: 'G2 . G3 . G2 . G3 . C3 . C4 . C3 . C4 . G2 . G3 . G2 . G3 . D3 . D4 . D3 . D4 . E3 . E4 . E3 . E4 . C3 . C4 . C3 . C4 . D3 . D4 . D3 . D4 . G2 . G3 . G2 . . .' },
  ] },
  tense: { bpm: 100, tracks: [
    { type: 'triangle', vol: 0.13, n: 'E4 . G4 . E4 . D#4 . E4 . B4 . A4 . G4 . F#4 . A4 . F#4 . E4 . D#4 . F#4 . B3 . . . E4 . G4 . E4 . D#4 . E4 . B4 . C5 . B4 . A4 . G4 . F#4 . G4 . E4 - - - . . . .' },
    { type: 'sine', vol: 0.2, n: 'E2 . . . E2 . . . C3 . . . C3 . . . B2 . . . B2 . . . B2 . . . B2 . . . E2 . . . E2 . . . A2 . . . A2 . . . B2 . . . B2 . . . E2 . . . E2 . . .' },
  ] },
};

function parse(str) {
  const tok = str.trim().split(/\s+/);
  const ev = new Array(tok.length).fill(null);
  for (let i = 0; i < tok.length; i++) {
    const k = tok[i];
    if (k === '.' || k === '-') continue;
    let len = 1;
    while (tok[i + len] === '-') len++;
    ev[i] = { f: nf(k), len };
  }
  return ev;
}

let cur = null, step = 0, nextT = 0, timer = null, pending = null;

function sched() {
  if (!cur || !ac) return;
  const spb = 60 / cur.bpm / 2;
  if (nextT < ac.currentTime - 0.3) nextT = ac.currentTime + 0.05;
  while (nextT < ac.currentTime + 0.25) {
    for (const tr of cur.tracks) {
      const e = tr.ev[step % tr.ev.length];
      if (e) tone(e.f, nextT, e.len * spb * 0.95, tr.type, tr.vol, musicBus, null, 0.02);
    }
    step++;
    nextT += spb;
  }
}

export const Sound = {
  get muted() { return muted; },
  init() {
    if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
    try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (_) { return; }
    master = ac.createGain(); master.gain.value = muted ? 0 : 0.9; master.connect(ac.destination);
    musicBus = ac.createGain(); musicBus.gain.value = 0.55;
    const delay = ac.createDelay(1); delay.delayTime.value = 0.3;
    const fb = ac.createGain(); fb.gain.value = 0.22;
    const wet = ac.createGain(); wet.gain.value = 0.22;
    musicBus.connect(master); musicBus.connect(delay); delay.connect(fb); fb.connect(delay); delay.connect(wet); wet.connect(master);
    sfxBus = ac.createGain(); sfxBus.gain.value = 0.6; sfxBus.connect(master);
    if (pending) { const p = pending; pending = null; this.music(p); }
  },
  toggleMute() {
    muted = !muted;
    try { localStorage.setItem('volo-muted', muted ? '1' : '0'); } catch (_) { /* ignore */ }
    if (master) master.gain.setTargetAtTime(muted ? 0 : 0.9, ac.currentTime, 0.05);
    return muted;
  },
  music(name) {
    if (!ac) { pending = name; return; }
    if (cur && cur.name === name) return;
    if (timer) clearInterval(timer);
    const s = SONGS[name];
    if (!s) { cur = null; return; }
    cur = { name, bpm: s.bpm, tracks: s.tracks.map((t) => ({ ...t, ev: parse(t.n) })) };
    step = 0; nextT = ac.currentTime + 0.15;
    timer = setInterval(sched, 40);
  },
  stopMusic() { if (timer) clearInterval(timer); timer = null; cur = null; pending = null; },
  note(i) {
    if (!ac) return;
    const sc = ['C5', 'D5', 'E5', 'G5', 'A5', 'C6', 'D6', 'E6', 'G6'];
    tone(nf(sc[Math.min(i, sc.length - 1)]), ac.currentTime, 0.35, 'triangle', 0.16);
    tone(nf(sc[Math.min(i, sc.length - 1)]) * 2, ac.currentTime, 0.2, 'sine', 0.05);
  },
  dirNote(d) {
    if (!ac) return;
    const f = { up: 'G5', right: 'E5', down: 'C5', left: 'A5' }[d] || 'C5';
    tone(nf(f), ac.currentTime, 0.28, 'triangle', 0.17);
  },
  sfx(name, p = 0) {
    if (!ac) return;
    const t = ac.currentTime;
    switch (name) {
      case 'blip': tone(620 + p * 220 + Math.random() * 40, t, 0.045, 'square', 0.022); break;
      case 'select': tone(660, t, 0.08, 'triangle', 0.13); tone(990, t + 0.05, 0.1, 'triangle', 0.1); break;
      case 'move': tone(520, t, 0.05, 'triangle', 0.08); break;
      case 'pickup': [0, 4, 7, 12].forEach((s, i) => tone(nf('C6') * 2 ** (s / 12), t + i * 0.06, 0.2, 'triangle', 0.13)); break;
      case 'glyph': [0, 7, 12, 16, 19].forEach((s, i) => tone(nf('G5') * 2 ** (s / 12), t + i * 0.05, 0.25, 'sine', 0.12)); break;
      case 'success': ['C5', 'E5', 'G5', 'C6'].forEach((n, i) => tone(nf(n), t + i * 0.09, 0.4, 'triangle', 0.14)); break;
      case 'fail': tone(330, t, 0.2, 'triangle', 0.14, sfxBus, 220); break;
      case 'push': tone(150, t, 0.12, 'sine', 0.3, sfxBus, 90); noise(t, 0.1, 400, 200, 0.05); break;
      case 'gate': tone(nf('G5'), t, 0.35, 'sine', 0.14); tone(nf('D6'), t + 0.1, 0.45, 'sine', 0.12); tone(nf('G6'), t + 0.2, 0.5, 'sine', 0.08); break;
      case 'woof': tone(430, t, 0.09, 'square', 0.05, sfxBus, 250); tone(410, t + 0.14, 0.09, 'square', 0.05, sfxBus, 230); break;
      case 'meow': tone(600, t, 0.15, 'triangle', 0.1, sfxBus, 900); tone(900, t + 0.15, 0.25, 'triangle', 0.1, sfxBus, 480); break;
      case 'quack': tone(480, t, 0.08, 'sawtooth', 0.04, sfxBus, 300); tone(470, t + 0.12, 0.08, 'sawtooth', 0.04, sfxBus, 290); break;
      case 'heart': tone(nf('A5'), t, 0.3, 'sine', 0.14); tone(nf('E6'), t + 0.08, 0.35, 'sine', 0.1); break;
      case 'whoosh': noise(t, 0.6, 300, 2400, 0.18, 0.8); break;
      case 'splash': noise(t, 0.4, 2000, 500, 0.15, 0.7); tone(nf('E6'), t + 0.05, 0.2, 'sine', 0.06); break;
      case 'bump': tone(200, t, 0.15, 'sine', 0.2, sfxBus, 110); noise(t, 0.2, 800, 300, 0.08); break;
      case 'tick': tone(1400, t, 0.03, 'square', 0.03); break;
      case 'chime': ['C6', 'G5', 'E5', 'C5'].forEach((n, i) => { tone(nf(n), t + i * 0.55, 1.8, 'sine', 0.13); tone(nf(n) * 2.01, t + i * 0.55, 1.0, 'sine', 0.04); }); break;
      case 'purr': for (let i = 0; i < 6; i++) tone(70, t + i * 0.12, 0.1, 'sawtooth', 0.03); break;
      case 'baa': tone(380, t, 0.35, 'sawtooth', 0.035, sfxBus, 360); break;
      case 'sparkle': [0, 1, 2].forEach((i) => tone(nf('E7') * (1 + i * 0.12), t + i * 0.05, 0.12, 'sine', 0.05)); break;
      default: break;
    }
  },
};
