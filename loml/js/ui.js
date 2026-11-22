// Piccoli aiuti per testo e pannelli disegnati sul canvas
import { rrPath, INK } from './art.js';

export const FONT = 'Fredoka, "Trebuchet MS", system-ui, sans-serif';
export const HAND = 'Caveat, "Segoe Print", cursive';
export const COL = {
  ink: INK, cream: '#fffaf0', paper: '#fff6e6', pink: '#f06d8f', pinkSoft: '#ffd6e2',
  sun: '#f2b33d', sunSoft: '#ffe9a8', green: '#7cbf82', sky: '#bfe3f7', dim: 'rgba(42,28,46,0.55)',
};

export function font(c, size, weight = 600, fam = FONT) { c.font = `${weight} ${Math.round(size)}px ${fam}`; }

export function wrap(c, text, maxW) {
  const out = [];
  for (const para of String(text).split('\n')) {
    if (para === '') { out.push(''); continue; }
    const words = para.split(' ');
    let line = '';
    for (const w of words) {
      const test = line ? line + ' ' + w : w;
      if (c.measureText(test).width > maxW && line) { out.push(line); line = w; } else line = test;
    }
    out.push(line);
  }
  return out;
}

export function panel(c, x, y, w, h, r = 18, fill = COL.cream, lw = 2.5) {
  c.save();
  rrPath(c, x + 2, y + 5, w, h, r); c.fillStyle = 'rgba(60,30,60,0.18)'; c.fill();
  rrPath(c, x, y, w, h, r); c.fillStyle = fill; c.fill();
  c.lineWidth = lw; c.strokeStyle = INK; c.stroke();
  c.restore();
}

export function button(c, r, label, opts = {}) {
  const sel = opts.selected;
  c.save();
  rrPath(c, r.x, r.y + 3, r.w, r.h, r.h / 2); c.fillStyle = 'rgba(60,30,60,0.2)'; c.fill();
  rrPath(c, r.x, r.y, r.w, r.h, r.h / 2);
  c.fillStyle = opts.fill || (sel ? COL.pink : '#fff'); c.fill();
  c.lineWidth = 2.2; c.strokeStyle = INK; c.stroke();
  font(c, opts.size || r.h * 0.42, 600);
  c.fillStyle = opts.color || (sel ? '#fff' : INK);
  c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillText(label, r.x + r.w / 2, r.y + r.h / 2 + 1);
  c.restore();
}

export function text(c, str, x, y, size, color = INK, weight = 600, align = 'center', fam = FONT) {
  font(c, size, weight, fam);
  c.fillStyle = color; c.textAlign = align; c.textBaseline = 'middle';
  c.fillText(str, x, y);
}

export function outlined(c, str, x, y, size, fill, stroke = INK, lw = 5, weight = 700) {
  font(c, size, weight);
  c.textAlign = 'center'; c.textBaseline = 'middle';
  c.lineJoin = 'round'; c.lineWidth = lw; c.strokeStyle = stroke; c.strokeText(str, x, y);
  c.fillStyle = fill; c.fillText(str, x, y);
}

export function inRect(p, r) { return p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h; }
