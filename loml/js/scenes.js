// Schermate: titolo, introduzione, viaggio sulla mappa, lettera finale e titoli di coda.
import { Sound } from './audio.js';
import * as A from './art.js';
import { panel, button, text, wrap, font, COL, outlined, HAND } from './ui.js';
import { cloud } from './minigames.js';

function sky(c, W, H, top, bottom) {
  const g = c.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, top); g.addColorStop(1, bottom);
  c.fillStyle = g; c.fillRect(0, 0, W, H);
}
function hills(c, W, H, y, col, amp, ph) {
  c.beginPath(); c.moveTo(0, H);
  for (let x = 0; x <= W + 20; x += 20) c.lineTo(x, y + Math.sin(x * 0.006 + ph) * amp + Math.sin(x * 0.013 + ph * 2) * amp * 0.4);
  c.lineTo(W, H); c.closePath(); c.fillStyle = col; c.fill();
}
function sunflowerField(c, W, H, y0, t, u) {
  for (let row = 0; row < 3; row++) {
    const yy = y0 + row * 28 * u, s = (1.3 + row * 0.45) * u;
    for (let x = -20 + (row % 2) * 22 * u; x < W + 40; x += 44 * u) {
      const sw = Math.sin(t * 1.4 + x * 0.02 + row) * 3 * u;
      c.beginPath(); c.moveTo(x, yy + 40 * s); c.lineTo(x + sw, yy); c.strokeStyle = '#5f9c4a'; c.lineWidth = 2.6 * s; c.stroke();
      A.fillE(c, x - 5 * s, yy + 16 * s, 6 * s, 2.5 * s, '#6fb35a', 0.5);
      for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; A.fillE(c, x + sw + Math.cos(a) * 8 * s, yy + Math.sin(a) * 8 * s, 4.4 * s, 2.2 * s, '#ffd23f', a); }
      A.fillE(c, x + sw, yy, 6 * s, 6 * s, '#8a5a2b');
    }
  }
}

// ---------------- Titolo ----------------
export class Title {
  constructor(hasSave) {
    this.t = 0; this.hasSave = hasSave; this.sel = 0; this.done = false; this.rects = [];
    this.items = hasSave ? [['continue', 'Continua il viaggio'], ['new', 'Nuova avventura']] : [['new', 'Inizia il viaggio']];
    this.confirmNew = false;
    this.planes = Array.from({ length: 5 }, (_, i) => ({ x: Math.random(), y: 0.1 + Math.random() * 0.35, s: 0.7 + Math.random() * 0.6, p: i }));
    Sound.music('title');
  }
  pick(i) {
    const id = this.items[i][0];
    Sound.sfx('select');
    if (id === 'new' && this.hasSave && !this.confirmNew) { this.confirmNew = true; this.items[i][1] = 'Sicura? Si riparte da zero'; return; }
    this.done = true; this.result = id;
  }
  update(dt, input) {
    this.t += dt;
    if (input.pressed('up')) { this.sel = (this.sel + this.items.length - 1) % this.items.length; Sound.sfx('move'); }
    if (input.pressed('down')) { this.sel = (this.sel + 1) % this.items.length; Sound.sfx('move'); }
    if (input.pressed('action')) this.pick(this.sel);
    this.rects.forEach((r, i) => { if (input.takeTap(r)) { this.sel = i; this.pick(i); } });
  }
  draw(c, W, H, u, touch) {
    sky(c, W, H, '#ffd9c9', '#fff1d6');
    A.fillE(c, W * 0.5, H * 0.42, 120 * u, 120 * u, 'rgba(255,240,190,0.7)');
    for (const p of this.planes) {
      const x = ((p.x * (W + 200) + this.t * 40 * p.s) % (W + 200)) - 100;
      c.save(); c.translate(x, p.y * H + Math.sin(this.t * 2 + p.p) * 10); c.rotate(Math.sin(this.t + p.p) * 0.1); c.scale(1.6 * u * p.s, 1.6 * u * p.s); A.planeShape(c); c.restore();
    }
    cloud(c, W * 0.15, H * 0.14, 30 * u, 'rgba(255,255,255,0.8)');
    cloud(c, W * 0.85, H * 0.1, 26 * u, 'rgba(255,255,255,0.8)');
    hills(c, W, H, H * 0.62, '#b9dd9a', 18 * u, 0.5);
    hills(c, W, H, H * 0.7, '#9fd08a', 14 * u, 2);
    // coniglietti
    const by = H * 0.68;
    c.save(); c.translate(W / 2, by); c.scale(3.2 * u, 3.2 * u);
    A.actor(c, 'geo', -13, 0, { t: this.t, dir: 'right' });
    A.actor(c, 'lollo', 13, 0, { t: this.t + 1, dir: 'left' });
    A.heart(c, 0, -40 + Math.sin(this.t * 2.5) * 2.5, 6 + Math.sin(this.t * 5) * 0.6, '#f06d8f');
    c.restore();
    sunflowerField(c, W, H, H * 0.78, this.t, u);
    const ty = H * 0.2;
    outlined(c, 'Il Volo di Carta', W / 2, ty, Math.min(56 * u, W / 9), '#fff7e0', A.INK, 9 * u);
    text(c, 'il lungo viaggio di Gina verso casa', W / 2, ty + 40 * u, 16 * u, '#7a5060', 600);
    const bw = Math.min(280 * u, W - 60), bh = 46 * u;
    this.rects = this.items.map((it, i) => ({ x: W / 2 - bw / 2, y: ty + 66 * u + i * (bh + 12 * u), w: bw, h: bh }));
    this.items.forEach((it, i) => button(c, this.rects[i], it[1], { selected: this.sel === i, size: 17 * u }));
    const hint = touch ? 'Joystick a sinistra · tasto ❤ a destra' : 'Frecce/WASD per muoverti · Spazio per parlare · M musica';
    text(c, hint, W / 2, H - 16 * u, 12 * u, '#7a6070', 500);
  }
}

// ---------------- Introduzione ----------------
export class Intro {
  constructor(pages) { this.pages = pages; this.i = 0; this.t = 0; this.pt = 0; this.done = false; this.shown = 0; }
  update(dt, input) {
    this.t += dt; this.pt += dt;
    const txt = this.pages[this.i].text;
    this.shown = Math.min(txt.length, this.shown + dt * 40);
    if (input.pressed('action') || input.anyTap()) {
      if (this.shown < txt.length) { this.shown = txt.length; return; }
      Sound.sfx('select');
      this.i++; this.pt = 0; this.shown = 0;
      if (this.i >= this.pages.length) { this.done = true; this.result = true; this.i = this.pages.length - 1; }
    }
    if (input.pressed('menu')) { this.done = true; this.result = true; }
  }
  draw(c, W, H, u) {
    const p = this.pages[this.i];
    const t = this.t;
    const ih = H * 0.58;
    c.save();
    c.beginPath(); c.rect(0, 0, W, ih); c.clip();
    drawIntroScene(c, p.scene, W, ih, u, t);
    c.restore();
    c.fillStyle = '#fff6e6'; c.fillRect(0, ih, W, H - ih);
    c.beginPath(); c.moveTo(0, ih); c.lineTo(W, ih); c.lineWidth = 3; c.strokeStyle = A.INK; c.stroke();
    font(c, Math.min(21 * u, 26), 500);
    const lines = wrap(c, p.text.slice(0, Math.floor(this.shown)), Math.min(W - 48, 640 * u));
    lines.forEach((l, k) => text(c, l, W / 2, ih + 46 * u + k * 30 * u, Math.min(21 * u, 26), A.INK, 500));
    for (let k = 0; k < this.pages.length; k++) A.fillE(c, W / 2 + (k - (this.pages.length - 1) / 2) * 16 * u, H - 22 * u, 4 * u, 4 * u, k === this.i ? COL.pink : '#e3d6dc');
    if (this.shown >= p.text.length) text(c, '▼', W - 30 * u, H - 24 * u + Math.sin(t * 5) * 3, 16 * u, COL.pink, 700);
  }
}
function drawIntroScene(c, kind, W, H, u, t) {
  const s = Math.min(W, H * 1.4) / 300;
  switch (kind) {
    case 'lacci': {
      sky(c, W, H, '#c9d3e6', '#e6e2ea');
      for (let i = 0; i < 6; i++) { const x = i * W / 5 - 20; A.RR(c, x, H * 0.35, W / 5 - 6, H * 0.5, 4, '#c7705c'); A.RR(c, x - 4, H * 0.3, W / 5 + 2, 18 * s, 4, '#5f6b85'); A.RR(c, x + 14 * s, H * 0.45, 14 * s, 16 * s, 3, '#ffd97a'); }
      c.fillStyle = '#9cc7a0'; c.fillRect(0, H * 0.82, W, H);
      c.save(); c.translate(W / 2, H * 0.92); c.scale(3 * s, 3 * s); A.actor(c, 'geo', 0, 0, { t, dir: 'down' }); c.restore();
      c.strokeStyle = 'rgba(120,140,190,0.6)'; c.lineWidth = 1.5;
      for (let i = 0; i < 60; i++) { const x = (i * 53 + t * 40) % W, y = (i * 97 + t * 300) % H; c.beginPath(); c.moveTo(x, y); c.lineTo(x - 3, y + 10); c.stroke(); }
      break;
    }
    case 'marsi': {
      sky(c, W, H, '#2d3466', '#6a5f8f');
      for (let i = 0; i < 40; i++) A.star(c, (i * 97) % W, (i * 53) % (H * 0.5), 1.5 + (i % 3), `rgba(255,255,230,${0.5 + 0.5 * Math.sin(t * 2 + i)})`);
      A.fillE(c, W * 0.78, H * 0.22, 26 * s, 26 * s, '#fff4c8');
      c.fillStyle = '#5a6290';
      c.beginPath(); c.moveTo(0, H * 0.7); c.lineTo(W * 0.2, H * 0.38); c.lineTo(W * 0.42, H * 0.66); c.lineTo(W * 0.62, H * 0.32); c.lineTo(W, H * 0.7); c.lineTo(W, H); c.lineTo(0, H); c.fill();
      c.fillStyle = '#7e8a5a'; c.fillRect(0, H * 0.78, W, H);
      for (let i = 0; i < 14; i++) A.fillE(c, i * W / 13, H * 0.84 + (i % 2) * 8, 4 * s, 2.4 * s, '#f08a3c');
      c.save(); c.translate(W / 2, H * 0.94); c.scale(3 * s, 3 * s); A.actor(c, 'lollo', 0, 0, { t, dir: 'up' }); c.restore();
      break;
    }
    case 'planes': {
      sky(c, W, H, '#bfe3f7', '#ffe6d5');
      c.fillStyle = '#7cc7e0'; c.fillRect(0, H * 0.7, W, H);
      c.fillStyle = '#b9dd9a'; A.rrPath(c, -40, H * 0.62, W * 0.3, H, 40); c.fill(); A.rrPath(c, W * 0.74, H * 0.62, W * 0.4, H, 40); c.fill();
      c.save(); c.translate(W * 0.12, H * 0.68); c.scale(2.4 * s, 2.4 * s); A.actor(c, 'geo', 0, 0, { t, dir: 'right' }); c.restore();
      c.save(); c.translate(W * 0.88, H * 0.68); c.scale(2.4 * s, 2.4 * s); A.actor(c, 'lollo', 0, 0, { t, dir: 'left' }); c.restore();
      for (let i = 0; i < 4; i++) {
        const k = ((t * 0.25 + i / 4) % 1), dir = i % 2 ? -1 : 1;
        const x = dir > 0 ? W * (0.15 + k * 0.7) : W * (0.85 - k * 0.7);
        const y = H * 0.5 - Math.sin(k * Math.PI) * H * 0.3;
        c.save(); c.translate(x, y); c.scale(dir * 1.8 * s, 1.8 * s); A.planeShape(c); c.restore();
      }
      text(c, '00:00', W * 0.5, H * 0.2, 16 * s, '#7a6aa0', 700);
      break;
    }
    case 'wind': {
      sky(c, W, H, '#c9d3e6', '#f0e6e6');
      c.fillStyle = '#9cc7a0'; c.fillRect(0, H * 0.8, W, H);
      for (let i = 0; i < 6; i++) {
        const x = ((i * 0.19 + t * 0.15) % 1.2) * W - 40, y = H * (0.2 + (i % 3) * 0.18) + Math.sin(t * 3 + i) * 12;
        c.save(); c.translate(x, y); c.rotate(Math.sin(t * 2 + i) * 0.5); c.scale(1.6 * s, 1.6 * s); A.planeShape(c); c.restore();
      }
      c.strokeStyle = 'rgba(255,255,255,0.8)'; c.lineWidth = 2;
      for (let i = 0; i < 5; i++) { const y = H * (0.2 + i * 0.12), x = ((t * 120 + i * 140) % (W + 200)) - 100; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + 40, y - 12, x + 80, y); c.stroke(); }
      c.save(); c.translate(W / 2, H * 0.92); c.scale(3 * s, 3 * s); A.actor(c, 'geo', 0, 0, { t, dir: 'up' }); c.restore();
      break;
    }
    default: {
      sky(c, W, H, '#ffd9c9', '#fff1d6');
      hills(c, W, H, H * 0.75, '#9fd08a', 10, t * 0.2);
      c.save(); c.translate(W / 2, H * 0.9); c.scale(3.4 * s, 3.4 * s); A.actor(c, 'geo', 0, 0, { t, dir: 'down', expr: 'happy' }); c.restore();
      A.heart(c, W / 2, H * 0.3 + Math.sin(t * 2) * 5, 18 * s, '#f06d8f');
    }
  }
}

// ---------------- Viaggio sulla mappa ----------------
const NODES = {
  lacci: [0.22, 0.2, 'Lacci'], tortellandia: [0.56, 0.42, 'Tortellandia'], giglia: [0.6, 0.53, 'Giglia'],
  pendolina: [0.5, 0.56, 'Pendolina'], amor: [0.66, 0.71, 'Amor'], marsi: [0.76, 0.66, 'Fucinella'],
};
const BOOT = [[0.43, 0.38], [0.52, 0.33], [0.62, 0.34], [0.7, 0.38], [0.66, 0.44], [0.68, 0.52], [0.76, 0.6], [0.86, 0.68], [0.92, 0.76], [0.96, 0.84], [0.92, 0.86], [0.88, 0.8], [0.86, 0.9], [0.82, 0.96], [0.78, 0.9], [0.8, 0.82], [0.72, 0.76], [0.62, 0.68], [0.55, 0.6], [0.48, 0.5], [0.42, 0.45]];
const UK = [[0.12, 0.08], [0.22, 0.04], [0.28, 0.12], [0.3, 0.24], [0.34, 0.3], [0.28, 0.34], [0.18, 0.32], [0.14, 0.24], [0.1, 0.16]];
export class Travel {
  constructor(from, to, info = {}) {
    this.from = from; this.to = to; this.info = info; this.t = 0; this.dur = info.dur || 3.6; this.done = false;
    Sound.sfx('whoosh');
  }
  update(dt, input) {
    this.t += dt;
    if (this.t > 1 && (input.pressed('action') || input.anyTap())) this.t = Math.max(this.t, this.dur);
    if (this.t > this.dur + 0.6) { this.done = true; this.result = true; }
  }
  draw(c, W, H, u) {
    c.fillStyle = '#a9dcef'; c.fillRect(0, 0, W, H);
    const S = Math.min(W, H * 1.1) * 0.95, ox = (W - S) / 2, oy = (H - S) / 2 + 20 * u;
    const P = ([x, y]) => [ox + x * S, oy + y * S];
    for (let i = 0; i < 20; i++) { const [x, y] = [(i * 0.137) % 1, (i * 0.291) % 1]; c.beginPath(); c.arc(ox + x * S, oy + y * S, 6, Math.PI * 1.1, Math.PI * 1.9); c.strokeStyle = 'rgba(255,255,255,0.6)'; c.lineWidth = 1.5; c.stroke(); }
    for (const shape of [UK, BOOT]) {
      c.beginPath(); shape.forEach((p, i) => { const [x, y] = P(p); i ? c.lineTo(x, y) : c.moveTo(x, y); }); c.closePath();
      c.fillStyle = '#c3e3a6'; c.fill(); c.lineWidth = 3; c.lineJoin = 'round'; c.strokeStyle = A.INK; c.stroke();
    }
    const order = ['lacci', 'tortellandia', 'giglia', 'pendolina', 'amor', 'marsi'];
    c.setLineDash([5, 7]); c.lineWidth = 2.5; c.strokeStyle = '#d0506e';
    c.beginPath(); order.forEach((k, i) => { const [x, y] = P(NODES[k]); i ? c.lineTo(x, y) : c.moveTo(x, y); }); c.stroke(); c.setLineDash([]);
    for (const k of order) {
      const [x, y] = P(NODES[k]);
      A.E(c, x, y, 6 * u, 6 * u, k === this.to ? '#ffd23f' : '#fff');
      text(c, NODES[k][2], x + (k === 'pendolina' ? -10 * u : 10 * u), y - 12 * u, 12 * u, A.INK, 600, k === 'pendolina' ? 'right' : 'left');
    }
    const k = Math.min(1, Math.max(0, (this.t - 0.4) / (this.dur - 0.8)));
    const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
    const [ax, ay] = P(NODES[this.from]), [bx, by] = P(NODES[this.to]);
    const x = ax + (bx - ax) * e, y = ay + (by - ay) * e - Math.sin(e * Math.PI) * 40 * u;
    c.save(); c.translate(x, y); c.scale(1.8 * u, 1.8 * u);
    if (this.info.mode === 'volo') { c.rotate(Math.atan2(by - ay, bx - ax) * 0.3); c.scale(1.6, 1.6); A.planeShape(c); A.actor(c, 'geo', -2, -1, { t: this.t, dir: 'right', noShadow: true, scale: 0.42 }); }
    else A.actor(c, 'geo', 0, 8, { t: this.t, dir: bx > ax ? 'right' : 'left', moving: true });
    c.restore();
    panel(c, W / 2 - 150 * u, 16 * u, 300 * u, 64 * u, 18 * u);
    text(c, `Verso ${NODES[this.to][2]}`, W / 2, 38 * u, 20 * u, A.INK, 700);
    text(c, this.info.sub || '', W / 2, 62 * u, 13 * u, '#7a6070', 500);
  }
}

// ---------------- Lettera finale + titoli di coda ----------------
export class Letter {
  constructor(letter, stats) {
    this.letter = letter; this.stats = stats; this.t = 0; this.phase = 'letter'; this.shown = 0; this.done = false; this.scroll = 0; this.btn = null;
    Sound.music('title');
  }
  update(dt, input) {
    this.t += dt;
    if (this.phase === 'letter') {
      this.shown = Math.min(this.letter.length, this.shown + dt * 34);
      const full = this.shown >= this.letter.length;
      if (input.held.has('down')) this.scroll += dt * 200;
      if (input.held.has('up')) this.scroll -= dt * 200;
      if (input.pointer.down && this.lastPY != null) this.scroll -= input.pointer.y - this.lastPY;
      this.lastPY = input.pointer.down ? input.pointer.y : null;
      if (this.btn && full && input.takeTap(this.btn)) { this.phase = 'credits'; this.t2 = 0; Sound.sfx('heart'); return; }
      if (input.pressed('action') || (!full && input.anyTap())) {
        if (!full) this.shown = this.letter.length;
        else { this.phase = 'credits'; this.t2 = 0; Sound.sfx('heart'); }
      }
    } else {
      this.t2 += dt;
      if (this.t2 > 1.5 && this.btn && input.takeTap(this.btn)) { this.done = true; this.result = 'restart'; }
      if (this.t2 > 1.5 && input.pressed('action')) { this.done = true; this.result = 'restart'; }
      input.anyTap();
    }
  }
  draw(c, W, H, u) {
    sky(c, W, H, '#ffe3d6', '#fff4dc');
    for (let i = 0; i < 18; i++) {
      const x = (i * 0.173 * W + Math.sin(this.t * 0.5 + i) * 20) % W, y = (H + 40) - ((this.t * 25 + i * 70) % (H + 80));
      c.globalAlpha = 0.5; A.heart(c, x, y, 5 + (i % 3) * 2, '#f6a6c1', false); c.globalAlpha = 1;
    }
    if (this.phase === 'letter') this.drawLetter(c, W, H, u);
    else this.drawCredits(c, W, H, u);
  }
  drawLetter(c, W, H, u) {
    const pw = Math.min(W - 24, 560 * u), ph = H - 40 * u - 40;
    const px = (W - pw) / 2, py = 20;
    panel(c, px, py, pw, ph, 10, '#fffdf6', 2.5);
    c.save(); A.rrPath(c, px, py, pw, ph, 10); c.clip();
    let size = Math.min(28, 26 * u);
    let lines, lh;
    for (;;) {
      font(c, size, 500, HAND);
      lines = wrap(c, this.letter, pw - 48);
      lh = size * 1.18;
      if (lines.length * lh < ph - 60 || size <= 17) break;
      size -= 1;
    }
    const total = lines.length * lh + 60;
    const maxScroll = Math.max(0, total - (ph - 20));
    this.scroll = Math.max(0, Math.min(maxScroll, this.scroll));
    if (this.shown < this.letter.length && maxScroll > 0) {
      let count = 0, li = 0;
      for (; li < lines.length; li++) { count += lines[li].length + 1; if (count > this.shown) break; }
      this.scroll = Math.max(this.scroll, Math.min(maxScroll, (li + 2) * lh - (ph - 40)));
    }
    for (let i = 0; i < lines.length + 30; i++) {
      const y = py + 44 + i * lh + size * 0.28 - this.scroll;
      if (y < py + 8 || y > py + ph - 6) continue;
      c.beginPath(); c.moveTo(px + 16, y); c.lineTo(px + pw - 16, y); c.strokeStyle = 'rgba(150,180,220,0.3)'; c.lineWidth = 1; c.stroke();
    }
    let remaining = Math.floor(this.shown);
    font(c, size, 500, HAND);
    c.fillStyle = '#4a3a6a'; c.textAlign = 'left'; c.textBaseline = 'alphabetic';
    for (let i = 0; i < lines.length; i++) {
      if (remaining <= 0) break;
      const l = lines[i].slice(0, remaining);
      remaining -= lines[i].length + 1;
      const y = py + 44 + i * lh - this.scroll;
      if (y > py - lh && y < py + ph + lh) c.fillText(l, px + 24, y);
    }
    c.restore();
    const full = this.shown >= this.letter.length;
    const bw = 200 * u, bh = 40 * u;
    this.btn = { x: W / 2 - bw / 2, y: H - bh - 14 * u, w: bw, h: bh };
    if (full) button(c, this.btn, 'Ti amo anch’io ♥', { selected: true, size: 16 * u });
    else text(c, 'tocca per leggere tutto', W / 2, H - 30 * u, 13 * u, '#9a8090', 500);
  }
  drawCredits(c, W, H, u) {
    const a = Math.min(1, this.t2);
    c.globalAlpha = a;
    outlined(c, 'Fine', W / 2, H * 0.14, 46 * u, '#fff7e0', A.INK, 8 * u);
    c.save(); c.translate(W / 2, H * 0.42); c.scale(3.6 * u, 3.6 * u);
    A.actor(c, 'geo', -7, 0, { t: this.t, dir: 'right', expr: 'happy' });
    A.actor(c, 'lollo', 7, 0, { t: this.t, dir: 'left', expr: 'happy' });
    A.actor(c, 'mia', -26, 2, { t: this.t, face: 1, happy: true });
    A.actor(c, 'yumi', 28, 2, { t: this.t, face: -1, sleep: true, scale: 0.8 });
    A.heart(c, 0, -38 + Math.sin(this.t * 3) * 2, 7, '#f06d8f');
    c.restore();
    const s = this.stats;
    const lines = [
      `Aeroplanini raccolti: ${s.planes} / ${s.planesTot}`,
      `Lettere G e L trovate: ${s.glyphs} / ${s.glyphsTot}`,
      `Tempo di viaggio: ${s.time}`,
    ];
    lines.forEach((l, i) => text(c, l, W / 2, H * 0.58 + i * 26 * u, 16 * u, A.INK, 600));
    text(c, 'Fatto con amore da Lollo, per Gina.', W / 2, H * 0.58 + 96 * u, 17 * u, '#d0506e', 700);
    text(c, 'G ♥ L', W / 2, H * 0.58 + 124 * u, 22 * u, '#e9a12f', 700);
    const bw = 220 * u, bh = 42 * u;
    this.btn = { x: W / 2 - bw / 2, y: H - bh - 18 * u, w: bw, h: bh };
    if (this.t2 > 1.5) button(c, this.btn, 'Torna al titolo', { size: 16 * u });
    c.globalAlpha = 1;
  }
}
