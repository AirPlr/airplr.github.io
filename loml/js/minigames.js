// Mini-giochi: ritmo (coccole/ninna nanna), memoria (trucchi), carezze, orologio, volo.
import { Sound } from './audio.js';
import * as A from './art.js';
import { panel, button, text, wrap, font, COL, outlined } from './ui.js';

function card(W, H, u, wMax = 520, hMax = 470) {
  const w = Math.min(W - 24, wMax * u), h = Math.min(H - 24, hMax * u);
  return { x: (W - w) / 2, y: (H - h) / 2, w, h };
}
function dimBg(c, W, H) { c.fillStyle = COL.dim; c.fillRect(0, 0, W, H); }
function header(c, r, u, title, sub) {
  text(c, title, r.x + r.w / 2, r.y + 30 * u, 22 * u, COL.ink, 700);
  if (sub) {
    font(c, 14 * u, 500);
    const lines = wrap(c, sub, r.w - 40 * u);
    lines.forEach((l, i) => text(c, l, r.x + r.w / 2, r.y + 56 * u + i * 18 * u, 14 * u, '#7a6070', 500));
  }
}
function hintLine(c, r, u, str) { text(c, str, r.x + r.w / 2, r.y + r.h - 18 * u, 12 * u, '#9a8090', 500); }

// ---------------- Ritmo ----------------
export class Rhythm {
  constructor(o) {
    this.o = o; this.need = o.need || 4; this.speed = o.speed || 0.85; this.zw = o.zone || 0.24;
    this.pos = 0; this.dir = 1; this.hits = 0; this.flash = 0; this.shake = 0; this.done = false; this.endT = 0; this.t = 0;
    this.fx = []; this.placeZone();
  }
  placeZone() { const old = this.zc ?? 0.5; do { this.zc = 0.16 + Math.random() * 0.68; } while (Math.abs(this.zc - old) < 0.2); }
  update(dt, input) {
    this.t += dt; this.flash = Math.max(0, this.flash - dt * 2.5); this.shake = Math.max(0, this.shake - dt * 3);
    for (const f of this.fx) { f.t += dt; f.y -= dt * 60; }
    this.fx = this.fx.filter((f) => f.t < 1.2);
    if (this.endT > 0) { this.endT -= dt; if (this.endT <= 0) { this.done = true; this.result = true; } return; }
    const sp = this.speed * (1 + this.hits * 0.07);
    this.pos += this.dir * sp * dt;
    if (this.pos > 1) { this.pos = 1; this.dir = -1; }
    if (this.pos < 0) { this.pos = 0; this.dir = 1; }
    if (input.pressed('action') || input.anyTap()) {
      if (Math.abs(this.pos - this.zc) <= this.zw / 2 + 0.025) {
        this.hits++; Sound.note(this.hits + 1); this.flash = 1;
        for (let i = 0; i < 4; i++) this.fx.push({ x: (Math.random() - 0.5) * 80, y: 0, t: Math.random() * 0.2 });
        if (this.hits >= this.need) { this.endT = 1.3; setTimeout(() => Sound.sfx('success'), 150); } else this.placeZone();
      } else {
        this.shake = 1; Sound.sfx('fail');
        if (this.o.missSfx) Sound.sfx(this.o.missSfx);
      }
    }
  }
  draw(c, W, H, u) {
    dimBg(c, W, H);
    const r = card(W, H, u);
    const sx = Math.sin(this.t * 60) * this.shake * 6;
    c.save(); c.translate(sx, 0);
    panel(c, r.x, r.y, r.w, r.h, 22 * u);
    header(c, r, u, this.o.title, this.o.sub);
    const prog = this.hits / this.need;
    const ax = r.x + r.w / 2, ay = r.y + r.h * 0.6;
    const s = 4.2 * u * (this.o.artScale || 1);
    c.save(); c.translate(ax, ay); c.scale(s, s);
    const sleeping = this.o.sleepy && this.endT > 0;
    A.actor(c, this.o.art, 0, 0, { t: this.t, face: 1, dir: 'down', happy: !sleeping && prog >= 0.5, sleep: sleeping, moving: this.shake > 0.5 });
    c.restore();
    if (sleeping) text(c, 'z z z', ax + 40 * u, ay - 70 * u - Math.sin(this.t * 2) * 4, 18 * u, '#7a6aa0', 700);
    for (const f of this.fx) { c.globalAlpha = Math.max(0, 1 - f.t); A.heart(c, ax + f.x * u, ay - 60 * u + f.y * u, 7 * u, COL.pink); c.globalAlpha = 1; }
    // cuori obiettivo
    for (let i = 0; i < this.need; i++) {
      const hx = ax + (i - (this.need - 1) / 2) * 34 * u, hy = r.y + r.h * 0.27 + (this.o.sub ? 14 * u : 0);
      A.heart(c, hx, hy, 13 * u, i < this.hits ? COL.pink : '#eadfe4');
    }
    // barra
    const bx = r.x + 30 * u, bw = r.w - 60 * u, by = r.y + r.h - 70 * u, bh = 26 * u;
    panel(c, bx, by, bw, bh, bh / 2, '#f4ece6', 2);
    const zx = bx + (this.zc - this.zw / 2) * bw, zw = this.zw * bw;
    c.save(); A.rrPath(c, zx, by + 3, zw, bh - 6, (bh - 6) / 2); c.fillStyle = this.flash > 0 ? '#ffc2d4' : (this.o.zoneCol || '#bfe6c4'); c.fill(); c.restore();
    const mx = bx + this.pos * bw;
    A.heart(c, mx, by + bh / 2 + 2 * u, 11 * u, '#f06d8f');
    hintLine(c, r, u, 'Premi SPAZIO o tocca lo schermo quando il cuore è nella zona');
    c.restore();
  }
}

// ---------------- Memoria ----------------
const DIRS = ['up', 'right', 'down', 'left'];
const DV = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
export class Memory {
  constructor(o) {
    this.o = o; this.rounds = o.rounds || [3, 4, 5]; this.r = 0; this.phase = 'intro'; this.timer = 1.0;
    this.i = 0; this.lit = null; this.litT = 0; this.k = 0; this.t = 0; this.done = false; this.btns = {}; this.msg = 'Guarda bene...';
    this.newSeq();
  }
  newSeq() {
    this.seq = [];
    for (let i = 0; i < this.rounds[this.r]; i++) {
      let d; do { d = DIRS[Math.floor(Math.random() * 4)]; } while (i > 1 && d === this.seq[i - 1] && d === this.seq[i - 2]);
      this.seq.push(d);
    }
  }
  update(dt, input) {
    this.t += dt; this.litT -= dt; if (this.litT <= 0) this.lit = null;
    const step = Math.max(0.42, 0.66 - this.r * 0.06);
    switch (this.phase) {
      case 'intro': this.timer -= dt; if (this.timer <= 0) { this.phase = 'show'; this.i = 0; this.timer = 0.2; } break;
      case 'show':
        this.timer -= dt;
        if (this.timer <= 0) {
          if (this.i < this.seq.length) { this.lit = this.seq[this.i]; this.litT = step * 0.7; Sound.dirNote(this.lit); this.i++; this.timer = step; }
          else { this.phase = 'input'; this.k = 0; this.msg = 'Tocca a te!'; }
        }
        break;
      case 'input': {
        let d = null;
        for (const dd of DIRS) if (input.pressed(dd)) d = dd;
        if (!d) for (const dd of DIRS) if (this.btns[dd] && input.takeTap(this.btns[dd])) d = dd;
        if (d) {
          this.lit = d; this.litT = 0.22;
          if (d === this.seq[this.k]) {
            Sound.dirNote(d); this.k++;
            if (this.k >= this.seq.length) {
              this.r++;
              if (this.r >= this.rounds.length) { this.phase = 'win'; this.timer = 1.3; this.msg = this.o.winMsg || 'Bravissima!'; setTimeout(() => Sound.sfx('success'), 120); }
              else { this.phase = 'good'; this.timer = 0.9; this.msg = 'Sì! Ancora...'; Sound.sfx('select'); }
            }
          } else { this.phase = 'bad'; this.timer = 1.2; this.msg = 'Oops! Riguardiamo...'; Sound.sfx('fail'); }
        }
        break;
      }
      case 'good': this.timer -= dt; if (this.timer <= 0) { this.newSeq(); this.phase = 'show'; this.i = 0; this.timer = 0.3; this.msg = 'Guarda bene...'; } break;
      case 'bad': this.timer -= dt; if (this.timer <= 0) { this.phase = 'show'; this.i = 0; this.timer = 0.3; this.msg = 'Guarda bene...'; } break;
      case 'win': this.timer -= dt; if (this.timer <= 0) { this.done = true; this.result = true; } break;
      default: break;
    }
  }
  draw(c, W, H, u) {
    dimBg(c, W, H);
    const r = card(W, H, u, 520, 500);
    panel(c, r.x, r.y, r.w, r.h, 22 * u);
    header(c, r, u, this.o.title, this.o.sub);
    const ax = r.x + r.w / 2, ay = r.y + r.h * 0.43;
    const off = this.lit ? DV[this.lit] : [0, 0];
    const s = 3.6 * u * (this.o.artScale || 1);
    c.save(); c.translate(ax + off[0] * 14 * u, ay + off[1] * 8 * u - (this.lit === 'up' ? 10 * u : 0)); c.scale(s, s);
    if (this.lit === 'left' || this.lit === 'right') c.rotate(off[0] * 0.15);
    A.actor(c, this.o.art, 0, 0, { t: this.t, face: this.lit === 'left' ? -1 : 1, dir: this.lit || 'down', happy: this.phase === 'win' || this.phase === 'good', moving: !!this.lit });
    c.restore();
    text(c, this.msg, ax, r.y + r.h * 0.53, 16 * u, this.phase === 'bad' ? '#d0506e' : COL.ink, 600);
    // progresso round
    for (let i = 0; i < this.rounds.length; i++) A.heart(c, ax + (i - (this.rounds.length - 1) / 2) * 30 * u, r.y + r.h * 0.6, 10 * u, i < this.r ? COL.pink : '#eadfe4');
    // tasti direzione
    const bs = 50 * u, cx = ax, cy = r.y + r.h * 0.8;
    const pos = { up: [cx - bs / 2, cy - bs * 1.05 - bs / 2], down: [cx - bs / 2, cy + bs * 0.05 - bs / 2 + bs * 0.5], left: [cx - bs * 1.6, cy - bs * 0.25], right: [cx + bs * 0.6, cy - bs * 0.25] };
    for (const d of DIRS) {
      const [bx, by] = pos[d];
      const rect = { x: bx, y: by, w: bs, h: bs };
      this.btns[d] = rect;
      const on = this.lit === d;
      panel(c, bx, by, bs, bs, 12 * u, on ? '#ffd23f' : '#fff', 2.2);
      c.save(); c.translate(bx + bs / 2, by + bs / 2); c.rotate({ up: 0, right: Math.PI / 2, down: Math.PI, left: -Math.PI / 2 }[d]);
      c.beginPath(); c.moveTo(0, -bs * 0.24); c.lineTo(bs * 0.22, bs * 0.12); c.lineTo(-bs * 0.22, bs * 0.12); c.closePath();
      c.fillStyle = COL.ink; c.fill(); c.restore();
    }
    hintLine(c, r, u, 'Usa le frecce o tocca i pulsanti');
  }
}

// ---------------- Carezze (per gatti permalosi) ----------------
// Tieni premuto per accarezzare. Quando il gatto apre un occhio, fermati subito!
export class Petting {
  constructor(o) {
    this.o = o; this.need = o.need || 5; this.love = 0; this.t = 0; this.done = false; this.endT = 0;
    this.state = 'calm'; this.st = 0; this.dur = 2.2; this.shake = 0; this.petT = 0; this.fx = []; this.purrT = 0; this.angry = 0;
  }
  setState(s) {
    this.state = s; this.st = 0;
    if (s === 'calm') this.dur = 1.3 + Math.random() * 1.8 + (this.angry ? 0.4 : 0);
    else if (s === 'alert') this.dur = 0.8 + Math.random() * 0.9;
    else if (s === 'angry') this.dur = 1.3;
  }
  update(dt, input) {
    this.t += dt; this.st += dt; this.shake = Math.max(0, this.shake - dt * 2.5);
    for (const f of this.fx) { f.t += dt; f.y -= dt * 55; }
    this.fx = this.fx.filter((f) => f.t < 1.2);
    const petting = input.held.has('action') || input.pointer.down;
    this.petting = petting && this.state !== 'angry';
    if (this.endT > 0) {
      this.endT -= dt; this.petT += dt;
      if (Math.random() < dt * 6) this.fx.push({ x: (Math.random() - 0.5) * 90, y: 0, t: 0 });
      if (this.endT <= 0) { this.done = true; this.result = true; }
      return;
    }
    if (this.petting) this.petT += dt;
    if (this.state === 'calm') {
      if (petting) {
        this.love = Math.min(1, this.love + dt / this.need);
        this.purrT -= dt;
        if (this.purrT <= 0) { Sound.sfx('purr'); this.purrT = 0.8; }
        if (Math.random() < dt * 3) this.fx.push({ x: (Math.random() - 0.5) * 70, y: 0, t: 0 });
        if (this.love >= 1) { this.endT = 1.8; Sound.sfx('purr'); setTimeout(() => Sound.sfx('success'), 200); return; }
      }
      if (this.st > this.dur) { this.setState('alert'); Sound.sfx('tick'); }
    } else if (this.state === 'alert') {
      // un attimo di tempo per reagire, poi guai a chi tocca
      if (petting && this.st > 0.3) {
        this.setState('angry'); this.angry++; this.shake = 1;
        this.love = Math.max(0, this.love - 0.22);
        Sound.sfx('hiss');
      } else if (this.st > this.dur) this.setState('calm');
    } else if (this.state === 'angry') {
      if (this.st > this.dur) this.setState('calm');
    }
  }
  draw(c, W, H, u) {
    dimBg(c, W, H);
    const r = card(W, H, u, 520, 480);
    const sx = Math.sin(this.t * 60) * this.shake * 7;
    c.save(); c.translate(sx, 0);
    panel(c, r.x, r.y, r.w, r.h, 22 * u);
    header(c, r, u, this.o.title, this.o.sub);
    // barra dell'affetto
    const bx = r.x + 40 * u, bw = r.w - 80 * u, by = r.y + r.h * 0.25, bh = 22 * u;
    panel(c, bx, by, bw, bh, bh / 2, '#f4ece6', 2);
    if (this.love > 0.01) { c.save(); A.rrPath(c, bx + 3, by + 3, (bw - 6) * this.love, bh - 6, (bh - 6) / 2); c.fillStyle = '#ffb3c8'; c.fill(); c.restore(); }
    A.heart(c, bx + (bw - 6) * this.love + 3, by + bh / 2 + 2 * u, 12 * u, '#f06d8f');
    // Yumi
    const ax = r.x + r.w / 2, ay = r.y + r.h * 0.66;
    const s = 4.2 * u * (this.o.artScale || 1) * (this.state === 'angry' ? 1.08 : 1);
    const won = this.endT > 0;
    c.save(); c.translate(ax, ay); c.scale(s, s);
    if (this.state === 'angry') c.translate(Math.sin(this.t * 70) * 0.8, 0);
    A.actor(c, this.o.art, 0, 0, { t: this.t, face: 1, dir: 'down', happy: this.state === 'calm' || won, sleep: false });
    // zampina di Gina che accarezza
    if (this.petting || won) {
      const px = -3 + Math.sin(this.petT * 7) * 6, py = -22 + Math.cos(this.petT * 14) * 0.8;
      A.E(c, px, py, 4.6, 3.4, '#d4a373'); A.fillE(c, px + 1, py + 0.8, 1.6, 1.2, '#f2b3a6');
    }
    c.restore();
    // fumetti
    if (this.state === 'alert' && !won) {
      const b = 1 + Math.sin(this.t * 18) * 0.08;
      text(c, '!', ax + 20 * s, ay - 34 * s, 34 * u * b, '#e2556a', 700);
    }
    if (this.state === 'angry') outlined(c, 'FSSST!', ax + 22 * s, ay - 36 * s, 24 * u, '#fff', '#c0394f', 5);
    if ((this.state === 'calm' && this.petting) || won) text(c, 'prrr...', ax - 22 * s, ay - 30 * s - Math.sin(this.t * 3) * 3, 15 * u, '#a07a5a', 700);
    for (const f of this.fx) { c.globalAlpha = Math.max(0, 1 - f.t); A.heart(c, ax + f.x * u, ay - 28 * s + f.y * u, 7 * u, COL.pink); c.globalAlpha = 1; }
    // messaggio
    let msg, col = COL.ink;
    if (won) msg = this.o.winMsg || 'Fa le fusa!';
    else if (this.state === 'angry') { msg = 'Ti avevo detto di no!'; col = '#d0506e'; }
    else if (this.state === 'alert') { msg = 'Yumi apre un occhio... FERMA!'; col = '#d0506e'; }
    else msg = this.petting ? 'Sta facendo le fusa... continua!' : 'È tranquillo... prova ad accarezzarlo.';
    text(c, msg, ax, r.y + r.h - 50 * u, 16 * u, col, 600);
    hintLine(c, r, u, 'Tieni premuto SPAZIO o il dito sullo schermo per accarezzare');
    c.restore();
  }
}

// ---------------- Orologio ----------------
export class ClockGame {
  constructor(o) {
    this.o = o; const s = (o.start || '12:00').replace(':', '');
    this.d = s.split('').map(Number); this.sel = 0; this.t = 0; this.shake = 0; this.done = false; this.msg = o.prompt || ''; this.rects = {};
  }
  max(i) { return i === 0 ? 2 : i === 1 ? (this.d[0] === 2 ? 3 : 9) : i === 2 ? 5 : 9; }
  bump(i, k) { const m = this.max(i); this.d[i] = (this.d[i] + k + m + 1) % (m + 1); if (this.d[0] === 2 && this.d[1] > 3) this.d[1] = 3; Sound.sfx('tick'); }
  str() { return `${this.d[0]}${this.d[1]}:${this.d[2]}${this.d[3]}`; }
  confirm() {
    if (this.str() === this.o.answer) { Sound.sfx('chime'); this.done = true; this.result = true; }
    else { this.shake = 1; Sound.sfx('fail'); this.msg = this.o.wrongMsg || 'Non succede niente...'; }
  }
  update(dt, input) {
    this.t += dt; this.shake = Math.max(0, this.shake - dt * 3);
    if (input.pressed('left')) { this.sel = (this.sel + 3) % 4; Sound.sfx('move'); }
    if (input.pressed('right')) { this.sel = (this.sel + 1) % 4; Sound.sfx('move'); }
    if (input.pressed('up')) this.bump(this.sel, 1);
    if (input.pressed('down')) this.bump(this.sel, -1);
    if (input.pressed('action')) this.confirm();
    if (input.pressed('back') || input.pressed('menu')) { this.done = true; this.result = false; return; }
    for (let i = 0; i < 4; i++) {
      if (this.rects['u' + i] && input.takeTap(this.rects['u' + i])) { this.sel = i; this.bump(i, 1); }
      if (this.rects['d' + i] && input.takeTap(this.rects['d' + i])) { this.sel = i; this.bump(i, -1); }
    }
    if (this.rects.ok && input.takeTap(this.rects.ok)) this.confirm();
    if (this.rects.x && input.takeTap(this.rects.x)) { this.done = true; this.result = false; }
  }
  draw(c, W, H, u) {
    dimBg(c, W, H);
    const r = card(W, H, u, 480, 440);
    const sx = Math.sin(this.t * 60) * this.shake * 6;
    c.save(); c.translate(sx, 0);
    panel(c, r.x, r.y, r.w, r.h, 22 * u);
    header(c, r, u, this.o.title, this.o.sub);
    const cx = r.x + r.w / 2, cy = r.y + r.h * 0.5;
    const dw = Math.min(58 * u, (r.w - 80 * u) / 4.6), dh = dw * 1.35;
    const xs = [cx - dw * 2.25, cx - dw * 1.15, cx + dw * 0.15, cx + dw * 1.25];
    panel(c, xs[0] - 12 * u, cy - dh / 2 - 10 * u, xs[3] + dw - xs[0] + 24 * u, dh + 20 * u, 14 * u, '#4b3a52', 2.5);
    for (let i = 0; i < 4; i++) {
      const x = xs[i];
      c.save(); A.rrPath(c, x, cy - dh / 2, dw, dh, 8 * u); c.fillStyle = this.sel === i ? '#5f4d68' : '#3a2d40'; c.fill(); c.restore();
      text(c, String(this.d[i]), x + dw / 2, cy + 2 * u, dh * 0.72, this.sel === i ? '#ffd97a' : '#ffe7b0', 700);
      const ur = { x, y: cy - dh / 2 - 52 * u, w: dw, h: 36 * u }, dr = { x, y: cy + dh / 2 + 16 * u, w: dw, h: 36 * u };
      this.rects['u' + i] = ur; this.rects['d' + i] = dr;
      button(c, ur, '▲', { size: 16 * u }); button(c, dr, '▼', { size: 16 * u });
    }
    text(c, ':', cx, cy, dh * 0.6, '#ffd97a', 700);
    const okr = { x: cx - 70 * u, y: r.y + r.h - 64 * u, w: 140 * u, h: 40 * u };
    this.rects.ok = okr; button(c, okr, 'Imposta', { selected: true, size: 17 * u });
    const xr = { x: r.x + r.w - 46 * u, y: r.y + 12 * u, w: 34 * u, h: 34 * u };
    this.rects.x = xr; button(c, xr, '✕', { size: 16 * u });
    if (this.msg) text(c, this.msg, cx, r.y + r.h - 86 * u, 14 * u, this.shake > 0 ? '#d0506e' : '#7a6070', 600);
    c.restore();
  }
}

// ---------------- Volo ----------------
export class Flight {
  constructor(o) {
    this.o = o; this.dur = o.duration || 40; this.t = 0; this.y = 0.45; this.vy = 0; this.obs = []; this.hearts = [];
    this.so = 1.6; this.sh = 0.7; this.score = 0; this.hits = 0; this.inv = 0; this.done = false; this.shake = 0;
    this.bg = Array.from({ length: 7 }, (_, i) => ({ x: Math.random(), y: 0.05 + Math.random() * 0.4, s: 0.6 + Math.random() * 0.8, k: i }));
    this.fx = [];
  }
  update(dt, input) {
    const W = window.innerWidth, H = window.innerHeight;
    const u = Math.max(0.8, Math.min(1.5, Math.min(W, H) / 560));
    this.t += dt; this.inv = Math.max(0, this.inv - dt); this.shake = Math.max(0, this.shake - dt * 3);
    const top = 70 * u, bot = H * 0.8, ph = bot - top;
    let target = null;
    if (input.pointer.down) target = (input.pointer.y - top) / ph;
    const d = input.dir();
    if (target != null) this.vy += (Math.max(0, Math.min(1, target)) - this.y) * 9 * dt - this.vy * 6 * dt;
    else this.vy += d.y * 3.2 * dt - this.vy * 4 * dt;
    this.vy = Math.max(-1.2, Math.min(1.2, this.vy));
    this.y = Math.max(0.03, Math.min(0.97, this.y + this.vy * dt * (target != null ? 2.2 : 1.6)));
    if (input.held.size === 0 && target == null) this.vy *= 0.92;
    const ending = this.t > this.dur;
    const spd = Math.max(240, W * 0.36);
    if (!ending) {
      this.so -= dt; this.sh -= dt;
      if (this.so <= 0) { this.so = Math.max(0.55, 1.3 - this.t / this.dur * 0.7) + Math.random() * 0.4; this.obs.push({ x: W + 60, y: 0.08 + Math.random() * 0.84, r: (24 + Math.random() * 14) * u, wob: Math.random() * 6 }); }
      if (this.sh <= 0) { this.sh = 0.55 + Math.random() * 0.5; this.hearts.push({ x: W + 30, y: 0.08 + Math.random() * 0.84, got: false }); }
    }
    const px = W * 0.24, py = top + this.y * ph;
    for (const o of this.obs) {
      o.x -= spd * dt;
      const oy = top + o.y * ph + Math.sin(this.t * 2 + o.wob) * 8;
      if (this.inv <= 0 && Math.hypot(o.x - px, oy - py) < o.r + 14 * u) { this.hits++; this.inv = 1.3; this.shake = 1; Sound.sfx('bump'); }
    }
    for (const h of this.hearts) {
      h.x -= spd * dt;
      const hy = top + h.y * ph;
      if (!h.got && Math.hypot(h.x - px, hy - py) < 24 * u) { h.got = true; this.score++; Sound.note(this.score % 8); this.fx.push({ x: h.x, y: hy, t: 0 }); }
    }
    for (const f of this.fx) f.t += dt;
    this.fx = this.fx.filter((f) => f.t < 0.8);
    this.obs = this.obs.filter((o) => o.x > -80); this.hearts = this.hearts.filter((h) => h.x > -40 && !h.got);
    if (this.t > this.dur + 3.2) { this.done = true; this.result = { score: this.score, hits: this.hits }; }
  }
  draw(c, W, H, u) {
    u = Math.max(0.8, Math.min(1.5, Math.min(W, H) / 560));
    const sh = Math.sin(this.t * 50) * this.shake * 5;
    c.save(); c.translate(0, sh);
    const g = c.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#a9daf5'); g.addColorStop(0.65, '#fde3cf'); g.addColorStop(1, '#ffd6c2');
    c.fillStyle = g; c.fillRect(0, -10, W, H + 20);
    A.fillE(c, W * 0.8, H * 0.18, 42 * u, 42 * u, '#fff1b8');
    A.fillE(c, W * 0.8, H * 0.18, 30 * u, 30 * u, '#ffe27a');
    for (const b of this.bg) {
      const x = ((b.x * (W + 300) - this.t * 30 * b.s) % (W + 300) + W + 300) % (W + 300) - 150;
      cloud(c, x, b.y * H, 30 * u * b.s, 'rgba(255,255,255,0.85)');
    }
    // mare
    const sy = H * 0.8;
    c.fillStyle = '#7cc7e0'; c.fillRect(0, sy, W, H - sy + 10);
    for (let i = 0; i < 14; i++) {
      const x = ((i * 90 - this.t * 120) % (W + 90) + W + 90) % (W + 90) - 45;
      c.beginPath(); c.arc(x, sy + 18 + (i % 3) * 14, 12, Math.PI * 1.1, Math.PI * 1.9); c.strokeStyle = 'rgba(255,255,255,0.7)'; c.lineWidth = 2; c.stroke();
    }
    // costa all'arrivo
    const prog = Math.min(1, this.t / this.dur);
    if (this.t > this.dur - 3) {
      const k = Math.min(1, (this.t - (this.dur - 3)) / 4);
      const lx = W - k * W * 0.55;
      c.fillStyle = '#9fd38a'; A.rrPath(c, lx, sy - 40 * u, W, 80 * u + H, 40 * u); c.fill(); c.lineWidth = 2; c.strokeStyle = A.INK; c.stroke();
      for (let i = 0; i < 8; i++) A.flower(c, lx + 40 * u + i * 40 * u, sy - 18 * u + (i % 2) * 10, 2.2 * u);
    }
    const top = 70 * u, bot = H * 0.8, ph = bot - top;
    for (const h of this.hearts) A.heart(c, h.x, top + h.y * ph + Math.sin(this.t * 4 + h.x * 0.01) * 4, 11 * u, '#f06d8f');
    for (const o of this.obs) {
      const oy = top + o.y * ph + Math.sin(this.t * 2 + o.wob) * 8;
      cloud(c, o.x, oy, o.r, '#8d8aa6', true);
      c.beginPath(); c.moveTo(o.x - 4, oy + o.r * 0.5); c.lineTo(o.x + 2, oy + o.r * 0.95); c.lineTo(o.x - 2, oy + o.r * 0.95); c.lineTo(o.x + 4, oy + o.r * 1.4);
      c.strokeStyle = '#ffe27a'; c.lineWidth = 2.5; c.stroke();
    }
    for (const f of this.fx) { c.globalAlpha = 1 - f.t / 0.8; A.heart(c, f.x, f.y - f.t * 50, 9 * u * (1 + f.t), '#ffb3c8', false); c.globalAlpha = 1; }
    // aereo + Gina
    const px = W * 0.24, py = top + this.y * ph;
    c.save(); c.translate(px, py); c.rotate(this.vy * 0.35);
    if (this.inv > 0 && Math.floor(this.inv * 10) % 2) c.globalAlpha = 0.5;
    c.scale(2.8 * u, 2.8 * u);
    A.planeShape(c);
    A.actor(c, 'geo', -2, -1, { t: this.t, dir: 'right', noShadow: true, scale: 0.42 });
    c.restore();
    // barra di viaggio
    const bx = 24 * u, bw = W - 48 * u, by = 22 * u;
    panel(c, bx, by, bw, 26 * u, 13 * u, '#fffaf0', 2);
    c.save(); A.rrPath(c, bx + 3, by + 3, (bw - 6) * prog, 20 * u, 10 * u); c.fillStyle = '#ffd6e2'; c.fill(); c.restore();
    text(c, 'Terra dei Regni', bx + 12 * u, by + 13 * u, 12 * u, A.INK, 600, 'left');
    text(c, 'Italia', bx + bw - 12 * u, by + 13 * u, 12 * u, A.INK, 600, 'right');
    c.save(); c.translate(bx + 3 + (bw - 6) * prog, by + 13 * u); c.scale(1.2 * u, 1.2 * u); A.planeShape(c); c.restore();
    text(c, `❤ ${this.score}`, W - 40 * u, by + 50 * u, 16 * u, '#d0506e', 700);
    if (this.t < 4) {
      c.globalAlpha = Math.min(1, 4 - this.t);
      outlined(c, 'Raccogli i cuori, evita le nuvole!', W / 2, H * 0.5, 20 * u, '#fff', A.INK, 5);
      text(c, 'Su/giù con le frecce, oppure trascina il dito', W / 2, H * 0.5 + 30 * u, 14 * u, A.INK, 600);
      c.globalAlpha = 1;
    }
    if (this.t > this.dur) { c.globalAlpha = Math.min(1, (this.t - this.dur)); outlined(c, 'Terra! Italia!', W / 2, H * 0.4, 30 * u, '#ffd23f', A.INK, 6); c.globalAlpha = 1; }
    c.restore();
  }
}
function cloud(c, x, y, r, col, stroke = false) {
  c.beginPath();
  c.arc(x - r * 0.6, y + r * 0.1, r * 0.55, 0, Math.PI * 2);
  c.arc(x, y - r * 0.2, r * 0.7, 0, Math.PI * 2);
  c.arc(x + r * 0.65, y + r * 0.1, r * 0.5, 0, Math.PI * 2);
  c.fillStyle = col; c.fill();
  if (stroke) { c.lineWidth = 2; c.strokeStyle = A.INK; c.stroke(); c.fill(); }
}
export { cloud };
