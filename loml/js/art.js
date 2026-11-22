// Disegni vettoriali morbidi: personaggi, animali, terreno, edifici, oggetti.
const TAU = Math.PI * 2;
export const INK = '#4e3a48';

export function hash(x, y, s = 0) {
  let h = (x * 374761393 + y * 668265263 + s * 1442695041) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967295;
}

const shadeCache = new Map();
export function shade(hex, amt) {
  const key = hex + amt;
  let v = shadeCache.get(key);
  if (v) return v;
  let c = hex.replace('#', '');
  if (c.length === 3) c = c.split('').map((x) => x + x).join('');
  const n = parseInt(c, 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  const f = amt < 0 ? (q) => Math.round(q * (1 + amt)) : (q) => Math.round(q + (255 - q) * amt);
  v = `rgb(${f(r)},${f(g)},${f(b)})`;
  shadeCache.set(key, v);
  return v;
}

// ---------- primitive ----------
function el(c, x, y, rx, ry, rot = 0) { c.beginPath(); c.ellipse(x, y, Math.max(0.1, Math.abs(rx)), Math.max(0.1, Math.abs(ry)), rot, 0, TAU); }
export function fillE(c, x, y, rx, ry, col, rot = 0) { el(c, x, y, rx, ry, rot); c.fillStyle = col; c.fill(); }
export function E(c, x, y, rx, ry, col, rot = 0, lw = 1.3) { el(c, x, y, rx, ry, rot); c.fillStyle = col; c.fill(); c.lineWidth = lw; c.strokeStyle = INK; c.stroke(); }
export function rrPath(c, x, y, w, h, r) {
  const rr = Array.isArray(r) ? r : [r, r, r, r];
  const m = Math.min(w, h) / 2;
  const [a, b, d, e] = rr.map((q) => Math.min(q, m));
  c.beginPath();
  c.moveTo(x + a, y);
  c.lineTo(x + w - b, y); if (b) c.arcTo(x + w, y, x + w, y + b, b); else c.lineTo(x + w, y);
  c.lineTo(x + w, y + h - d); if (d) c.arcTo(x + w, y + h, x + w - d, y + h, d); else c.lineTo(x + w, y + h);
  c.lineTo(x + e, y + h); if (e) c.arcTo(x, y + h, x, y + h - e, e); else c.lineTo(x, y + h);
  c.lineTo(x, y + a); if (a) c.arcTo(x, y, x + a, y, a); else c.lineTo(x, y);
  c.closePath();
}
export function RR(c, x, y, w, h, r, col, stroke = true, lw = 1.3) {
  rrPath(c, x, y, w, h, r);
  c.fillStyle = col; c.fill();
  if (stroke) { c.lineWidth = lw; c.strokeStyle = INK; c.stroke(); }
}
function line(c, x1, y1, x2, y2, col = INK, lw = 1.3) { c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.strokeStyle = col; c.lineWidth = lw; c.stroke(); }
function poly(c, pts, col, stroke = true, lw = 1.3) {
  c.beginPath(); c.moveTo(pts[0], pts[1]);
  for (let i = 2; i < pts.length; i += 2) c.lineTo(pts[i], pts[i + 1]);
  c.closePath(); c.fillStyle = col; c.fill();
  if (stroke) { c.lineWidth = lw; c.strokeStyle = INK; c.stroke(); }
}
function flatShadow(c, x, y, rx) { fillE(c, x, y + 2, rx, 9, 'rgba(60,40,80,0.16)'); }
export function shadowE(c, x, y, rx) { fillE(c, x, y, rx, rx * 0.36, 'rgba(60,40,80,0.18)'); }
function eye(c, x, y, r = 1.7, mode = '') {
  if (mode === 'closed' || mode === 'happy') {
    c.beginPath();
    if (mode === 'happy') c.arc(x, y + r * 0.5, r * 1.1, Math.PI * 1.15, Math.PI * 1.85);
    else { c.moveTo(x - r, y); c.quadraticCurveTo(x, y + r * 0.8, x + r, y); }
    c.lineWidth = 1.2; c.strokeStyle = INK; c.lineCap = 'round'; c.stroke();
    return;
  }
  fillE(c, x, y, r, r * 1.12, '#3a2833');
  fillE(c, x + r * 0.35, y - r * 0.42, r * 0.4, r * 0.4, '#fff');
}
function blush(c, x, y, r = 2) { fillE(c, x, y, r, r * 0.6, 'rgba(255,120,150,0.42)'); }
export function heartPath(c, x, y, s) {
  c.beginPath();
  c.moveTo(x, y + s * 0.35);
  c.bezierCurveTo(x - s * 1.1, y - s * 0.35, x - s * 0.45, y - s * 1.05, x, y - s * 0.45);
  c.bezierCurveTo(x + s * 0.45, y - s * 1.05, x + s * 1.1, y - s * 0.35, x, y + s * 0.35);
  c.closePath();
}
export function heart(c, x, y, s, col = '#f06d8f', stroke = true) {
  heartPath(c, x, y, s); c.fillStyle = col; c.fill();
  if (stroke) { c.lineWidth = 1.1; c.strokeStyle = INK; c.stroke(); }
}
export function flower(c, x, y, s = 1, petal = '#ffd23f', center = '#7a4a22') {
  c.save(); c.translate(x, y); c.scale(s, s);
  for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU; fillE(c, Math.cos(a) * 2.6, Math.sin(a) * 2.6, 1.9, 1.1, petal, a); }
  fillE(c, 0, 0, 1.7, 1.7, center);
  c.restore();
}

// ---------- Coniglietti (4 direzioni) ----------
function ear(c, x, y, rot, fur, inner, showInner) {
  E(c, x, y, 3.1, 8.6, fur, rot);
  if (showInner) fillE(c, x, y + 0.8, 1.4, 6, inner, rot);
}
export function bunny(c, x, y, o = {}) {
  const t = o.t || 0, dir = o.dir || 'down', mv = !!o.moving;
  const fur = o.fur || '#fbf6ef', inner = o.inner || '#f5adbd';
  const hop = mv ? Math.abs(Math.sin(t * 11)) * 3.5 : Math.sin(t * 2.4) * 0.5;
  const sc = o.scale || 1;
  if (!o.noShadow) shadowE(c, x, y, 9 * sc - hop * 0.5);
  c.save();
  c.translate(x, y - hop * sc); c.scale(sc, sc);
  if (o.alpha != null) c.globalAlpha *= o.alpha;
  const side = dir === 'left' || dir === 'right';
  if (dir === 'left') c.scale(-1, 1);
  c.lineJoin = 'round'; c.lineCap = 'round';
  const ew = Math.sin(t * 2.7) * 0.07 + (mv ? Math.sin(t * 11) * 0.08 : 0);
  const hx = side ? 2.5 : 0;
  const longE = o.longEars ? 1.25 : 1;
  c.save(); c.translate(0, -20); c.scale(1, longE); c.translate(0, 20);
  if (!side) { ear(c, -3.8, -29, -0.2 + ew, fur, inner, dir === 'down'); ear(c, 3.8, -29, 0.2 - ew, fur, inner, dir === 'down'); }
  else { ear(c, hx - 2.5, -29, -0.55 + ew, fur, inner, false); ear(c, hx + 0.5, -30, -0.3 - ew, fur, inner, true); }
  c.restore();
  const fo = mv ? Math.sin(t * 11) * 1.2 : 0;
  E(c, -4.5, -1.5 + fo * 0.3, 3.2, 2.1, fur); E(c, 4.5, -1.5 - fo * 0.3, 3.2, 2.1, fur);
  if (side) E(c, -8.2, -7, 3.3, 3.1, '#fff');
  E(c, 0, -8, 8.8, 7.6, fur);
  if (dir === 'down') fillE(c, 0, -6.5, 5, 4.6, o.belly || 'rgba(255,255,255,0.55)');
  if (dir === 'up') E(c, 0, -5.5, 3.6, 3.4, '#fff');
  if (dir === 'down') { fillE(c, -5.6, -8, 2.2, 3, shade(fur, -0.07)); fillE(c, 5.6, -8, 2.2, 3, shade(fur, -0.07)); }
  if (o.acc === 'scarf') {
    E(c, hx * 0.4, -12.3, 7.8, 2.8, '#6fb38a');
    if (dir !== 'up') RR(c, side ? -2 : 1.5, -12, 3.2, 7, 1.5, '#6fb38a');
  }
  E(c, hx, -19.5, 9, 8.2, fur);
  const blink = (t % 4.3) < 0.13;
  const em = o.expr === 'happy' ? 'happy' : o.expr === 'sleep' || blink ? 'closed' : '';
  if (dir === 'down') {
    eye(c, -3.6, -20, 1.7, em); eye(c, 3.6, -20, 1.7, em);
    fillE(c, 0, -16.8, 1.4, 1.05, '#ec8fa0');
    c.beginPath(); c.moveTo(-1.6, -15.3); c.quadraticCurveTo(-0.8, -14.4, 0, -15.3); c.quadraticCurveTo(0.8, -14.4, 1.6, -15.3);
    c.lineWidth = 0.9; c.strokeStyle = INK; c.stroke();
    blush(c, -6, -16.6); blush(c, 6, -16.6);
  } else if (side) {
    eye(c, hx + 4.2, -20.5, 1.7, em);
    fillE(c, hx + 8.6, -17.6, 1.2, 1, '#ec8fa0');
    blush(c, hx + 4.6, -16.6);
  }
  if (o.acc === 'sunflower') flower(c, side ? hx - 1.5 : 4.8, -26.5, 1.05);
  if (o.acc === 'hat') { RR(c, -6, -31, 12, 4, 2, '#e9d29a'); RR(c, -3.5, -35, 7, 5, 2, '#e9d29a'); }
  c.restore();
}

// ---------- Quadrupedi generici (vista laterale) ----------
function earsQ(c, S, hx, hy, phase, t) {
  const r = S.hr, col = S.earC || S.head || S.body;
  switch (S.ears) {
    case 'pointy': {
      for (const k of (phase === 'back' ? [-1] : [1])) {
        const ex = hx + k * r * 0.35 - 1, ey = hy - r * 0.55;
        poly(c, [ex - r * 0.45, ey + 1, ex + r * 0.05, ey - r * 0.95, ex + r * 0.45, ey + 1.5], col);
        poly(c, [ex - r * 0.22, ey + 0.5, ex + r * 0.05, ey - r * 0.55, ex + r * 0.25, ey + 0.8], S.earIn || '#f5b2bf', false);
      }
      break;
    }
    case 'round':
      if (phase === 'back') { E(c, hx - r * 0.55, hy - r * 0.8, r * 0.38, r * 0.38, col); E(c, hx + r * 0.45, hy - r * 0.85, r * 0.38, r * 0.38, col); }
      break;
    case 'tuft':
      if (phase === 'back') { poly(c, [hx - 2, hy - r * 0.4, hx - 1, hy - r * 1.6, hx + 1.5, hy - r * 0.5], col); poly(c, [hx + 1, hy - r * 0.5, hx + 2.5, hy - r * 1.5, hx + 3.6, hy - r * 0.3], col); }
      break;
    case 'floppy': {
      const sw = Math.sin(t * 3) * 0.08;
      if (phase === 'back') E(c, hx - r * 0.75, hy + 0.5, r * 0.36, r * 0.75, col, 0.25 + sw);
      else E(c, hx - r * 0.2, hy + 1, r * 0.38, r * 0.8, col, 0.15 - sw);
      break;
    }
    case 'rose':
      if (phase === 'back') { poly(c, [hx - r * 0.7, hy - r * 0.5, hx - r * 0.3, hy - r * 1.05, hx, hy - r * 0.6], col); poly(c, [hx + r * 0.1, hy - r * 0.7, hx + r * 0.45, hy - r * 1.05, hx + r * 0.7, hy - r * 0.45], col); }
      break;
    case 'fold':
      if (phase === 'back') E(c, hx - r * 0.6, hy - r * 0.55, r * 0.5, r * 0.25, col, -0.4);
      break;
    case 'pig':
      if (phase === 'front') { poly(c, [hx - r * 0.5, hy - r * 0.5, hx + r * 0.1, hy - r * 1.15, hx + r * 0.5, hy - r * 0.45], col); }
      else poly(c, [hx - r * 0.9, hy - r * 0.3, hx - r * 0.7, hy - r * 1.1, hx - r * 0.2, hy - r * 0.6], col);
      break;
    case 'side':
      if (phase === 'back') E(c, hx - r * 0.9, hy - r * 0.1, r * 0.55, r * 0.25, col, -0.3);
      else E(c, hx + r * 0.2, hy - r * 0.6, r * 0.5, r * 0.22, col, -0.6);
      break;
    case 'horns':
      if (phase === 'back') {
        c.beginPath(); c.moveTo(hx - 1, hy - r * 0.7); c.quadraticCurveTo(hx - 1.5, hy - r * 1.9, hx - 3.5, hy - r * 1.7);
        c.moveTo(hx + 1.5, hy - r * 0.7); c.quadraticCurveTo(hx + 1.5, hy - r * 1.9, hx - 0.8, hy - r * 1.8);
        c.lineWidth = 1.8; c.strokeStyle = '#2f2630'; c.stroke();
        E(c, hx - r * 0.75, hy - r * 0.45, r * 0.35, r * 0.18, col, -0.5);
      }
      break;
    default: break;
  }
}
function tailQ(c, S, x, y, t, o) {
  const col = S.tailC || S.body;
  switch (S.tail) {
    case 'bushy': {
      const w = Math.sin(t * 2.5) * 0.1;
      c.save(); c.translate(x, y); c.rotate(w);
      E(c, -3, -7, 5.5, 9, col, -0.3); fillE(c, -2.5, -8, 2.5, 6, shade(col, 0.18), -0.3);
      c.restore(); break;
    }
    case 'thin': {
      const w = Math.sin(t * 2) * 3;
      c.beginPath(); c.moveTo(x + 2, y + 2); c.bezierCurveTo(x - 7, y + 1, x - 8 + w, y - 9, x - 3 + w, y - 13);
      c.lineCap = 'round'; c.lineWidth = 5.4; c.strokeStyle = INK; c.stroke(); c.lineWidth = 3.4; c.strokeStyle = col; c.stroke();
      break;
    }
    case 'wag': {
      const w = Math.sin(t * (o.happy ? 22 : 9)) * 0.5;
      c.save(); c.translate(x + 1, y); c.rotate(-0.9 + w);
      RR(c, -1.6, -8, 3.4, 9, 1.7, col); c.restore(); break;
    }
    case 'fox': {
      const w = Math.sin(t * 2.2) * 0.12;
      c.save(); c.translate(x, y + 2); c.rotate(0.35 + w);
      E(c, -6, 0, 8, 4.2, col); fillE(c, -12, 0.5, 2.6, 2.6, '#fff8ef'); c.restore(); break;
    }
    case 'curl':
      c.beginPath(); c.arc(x - 2, y, 2.2, 0, TAU * 0.8); c.lineWidth = 1.6; c.strokeStyle = INK; c.stroke(); break;
    case 'puff': E(c, x, y, 3, 3, col); break;
    case 'stub': E(c, x, y - 1, 2.4, 1.8, col, -0.5); break;
    default: break;
  }
}
export function quad(c, x, y, o, S) {
  const t = o.t || 0, mv = !!o.moving, f = o.face || 1, sc = (S.scale || 1) * (o.scale || 1);
  const bob = mv ? Math.abs(Math.sin(t * 10)) * 1.6 : Math.sin(t * 2 + (o.seed || 0)) * 0.4;
  if (!o.noShadow) shadowE(c, x, y, S.bw * sc + 2);
  c.save(); c.translate(x, y); c.scale(f * sc, sc);
  if (o.alpha != null) c.globalAlpha *= o.alpha;
  c.lineJoin = 'round';
  const legH = S.legH ?? 4, bw = S.bw, bh = S.bh;
  const by = -legH - bh + 1.5 - bob;
  const lc = S.legC || S.body;
  if (!o.sleep) {
    for (const i of [-1, 1]) for (const j of [0, 1]) {
      const lx = i * bw * 0.55 + (j ? 1.6 : -1.6);
      const sw = mv ? Math.sin(t * 10 + (i * (j ? 1 : -1) > 0 ? 0 : Math.PI)) * 1.6 : 0;
      RR(c, lx - 1.8 + sw, -legH - 2.5, 3.6, legH + 2.5, 1.6, j ? lc : shade(lc, -0.1));
    }
  }
  tailQ(c, S, -bw * 0.85, by - bh * 0.15, t, o);
  if (S.wool) {
    const wc = S.body;
    for (let i = 0; i < 7; i++) { const a = (i / 7) * TAU; E(c, Math.cos(a) * bw * 0.72, by + Math.sin(a) * bh * 0.6, bh * 0.55, bh * 0.55, wc); }
    fillE(c, 0, by, bw * 0.85, bh * 0.8, wc);
  } else {
    E(c, 0, by, bw, bh, S.body);
  }
  if (S.belly) fillE(c, bw * 0.12, by + bh * 0.32, bw * 0.62, bh * 0.55, S.belly);
  if (S.stripes) for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(-bw * 0.4 + i * bw * 0.32, by - bh * 0.95); c.quadraticCurveTo(-bw * 0.3 + i * bw * 0.32, by - bh * 0.4, -bw * 0.45 + i * bw * 0.32, by - bh * 0.15); c.lineWidth = 2; c.strokeStyle = S.stripes; c.lineCap = 'round'; c.stroke(); }
  if (S.spots) for (const [sx, sy, r] of S.spots) fillE(c, sx * bw, by + sy * bh, r, r * 0.8, S.spot);
  if (S.collar) RR(c, bw * 0.45, by - bh * 0.9, 4, bh * 0.9, 2, S.collar);
  const hx = bw * 0.72 + (S.neck || 0), hy = by - bh * 0.62 - (S.headUp || 0);
  earsQ(c, S, hx, hy, 'back', t);
  E(c, hx, hy, S.hr, S.hr * (S.hry || 0.92), S.head || S.body);
  if (S.headSpot) fillE(c, hx + S.hr * 0.25, hy - S.hr * 0.3, S.hr * 0.42, S.hr * 0.38, S.spot);
  if (S.mask) fillE(c, hx + S.hr * 0.45, hy + S.hr * 0.3, S.hr * 0.55, S.hr * 0.45, S.mask);
  if (S.faceStripe) { fillE(c, hx + S.hr * 0.3, hy - S.hr * 0.05, S.hr * 0.75, S.hr * 0.22, S.faceStripe, -0.2); }
  if (S.snout) {
    E(c, hx + S.hr * 0.78, hy + S.hr * 0.28, S.snout[0], S.snout[1], S.snoutC || S.head || S.body);
    if (S.ears === 'pig') { fillE(c, hx + S.hr * 0.78 + S.snout[0] * 0.6, hy + S.hr * 0.18, 0.6, 0.9, INK); fillE(c, hx + S.hr * 0.78 + S.snout[0] * 0.6, hy + S.hr * 0.45, 0.6, 0.9, INK); }
    else fillE(c, hx + S.hr * 0.78 + S.snout[0] * 0.85, hy + S.hr * 0.12, 1.4, 1.1, S.nose || '#3a2833');
  } else fillE(c, hx + S.hr * 0.92, hy + S.hr * 0.15, 1.2, 1, S.nose || '#ec8fa0');
  const blink = (t % (3.7 + (o.seed || 0))) < 0.12;
  eye(c, hx + S.hr * 0.35, hy - S.hr * 0.12, S.eyeR || 1.6, o.sleep ? 'closed' : o.happy ? 'happy' : blink ? 'closed' : '');
  blush(c, hx + S.hr * 0.25, hy + S.hr * 0.4, 1.8);
  earsQ(c, S, hx, hy, 'front', t);
  if (S.beret) { E(c, hx - 0.5, hy - S.hr * 0.75, S.hr * 0.85, S.hr * 0.35, '#d9534f', -0.2); fillE(c, hx, hy - S.hr * 1.1, 0.9, 0.9, INK); }
  c.restore();
}

// ---------- Uccelli ----------
export function bird(c, x, y, o, S) {
  const t = o.t || 0, f = o.face || 1, sc = (S.scale || 1) * (o.scale || 1);
  const peck = S.peck ? Math.pow(Math.max(0, Math.sin(t * 1.6 + (o.seed || 0) * 5)), 10) * 3 : 0;
  const bob = o.moving ? Math.abs(Math.sin(t * 12)) * 1.5 : 0;
  if (!o.noShadow) shadowE(c, x, y, S.bw * sc);
  c.save(); c.translate(x, y - bob); c.scale(f * sc, sc);
  c.lineJoin = 'round';
  const lh = S.legH ?? 3;
  line(c, -1.5, -lh - 1, -2, 0, S.legC || '#f0a040', 1.5); line(c, 1.5, -lh - 1, 1.2, 0, S.legC || '#f0a040', 1.5);
  const by = -lh - S.bh + 1;
  poly(c, [-S.bw * 0.7, by - 1, -S.bw * 1.35, by - S.bh * 0.7, -S.bw * 1.2, by + S.bh * 0.3], S.tailC || shade(S.body, -0.1));
  E(c, 0, by, S.bw, S.bh, S.body);
  if (S.breast) fillE(c, S.bw * 0.4, by + S.bh * 0.15, S.bw * 0.5, S.bh * 0.62, S.breast);
  if (S.apron) { RR(c, S.bw * 0.05, by - S.bh * 0.25, S.bw * 0.85, S.bh * 1.1, 3, S.apron); fillE(c, S.bw * 0.45, by + S.bh * 0.25, 1.2, 1.2, '#e4636f'); }
  const flap = o.flying ? Math.sin(t * 22) * 0.9 : Math.sin(t * 1.5) * 0.05;
  E(c, -S.bw * 0.15, by - 0.5, S.bw * 0.6, S.bh * 0.6, S.wing || shade(S.body, -0.12), -0.25 + flap);
  const hx = S.bw * 0.7, hy = by - S.bh * 0.85 + peck;
  if (S.neck) fillE(c, hx - 1, hy + S.hr * 0.8, S.hr * 0.9, S.hr * 0.7, S.neck);
  E(c, hx, hy, S.hr, S.hr, S.head || S.body);
  if (S.comb) { E(c, hx - 0.5, hy - S.hr, 1.8, 2.2, '#e4545f'); E(c, hx + 1.8, hy - S.hr * 0.9, 1.6, 2, '#e4545f'); fillE(c, hx + S.hr * 0.75, hy + S.hr * 0.75, 1.2, 2, '#e4545f'); }
  if (S.duck) E(c, hx + S.hr + 1.6, hy + 0.8, 3.2, 1.7, S.beak);
  else poly(c, [hx + S.hr * 0.75, hy - 1.2, hx + S.hr + (S.beakL || 3), hy + 0.4, hx + S.hr * 0.75, hy + 1.6], S.beak);
  eye(c, hx + S.hr * 0.3, hy - S.hr * 0.2, 1.3);
  blush(c, hx + S.hr * 0.15, hy + S.hr * 0.45, 1.4);
  if (S.glasses) { c.beginPath(); c.arc(hx + S.hr * 0.3, hy - S.hr * 0.2, 2.2, 0, TAU); c.lineWidth = 0.9; c.strokeStyle = INK; c.stroke(); }
  if (S.captain) { RR(c, hx - S.hr - 0.5, hy - S.hr - 2.5, S.hr * 2 + 1, 2.4, 1, '#2e3b5b'); RR(c, hx - S.hr * 0.7, hy - S.hr - 6, S.hr * 1.4, 4.5, 1.5, '#ffffff'); fillE(c, hx, hy - S.hr - 3.8, 1, 1, '#f2c14e'); }
  c.restore();
}

// ---------- Animaletti speciali ----------
export function hedgehog(c, x, y, o) {
  const t = o.t || 0, f = o.face || 1;
  shadowE(c, x, y, 10);
  c.save(); c.translate(x, y); c.scale(f, 1);
  c.beginPath();
  const n = 14;
  for (let i = 0; i <= n; i++) {
    const a = Math.PI + (i / n) * Math.PI, r = i % 2 ? 11 : 8;
    c.lineTo(Math.cos(a) * r * 1.05, -3 + Math.sin(a) * r * 0.85);
  }
  c.closePath(); c.fillStyle = '#8a6248'; c.fill(); c.lineWidth = 1.3; c.strokeStyle = INK; c.stroke();
  E(c, 6.5, -5, 4.8, 4, '#f2dcc0');
  fillE(c, 11, -5.2, 1.4, 1.2, '#3a2833');
  eye(c, 7.2, -6.6, 1.2, (t % 4) < 0.12 ? 'closed' : '');
  blush(c, 7.5, -3.6, 1.4);
  E(c, -4, -0.5, 2, 1.4, '#f2dcc0'); E(c, 4, -0.5, 2, 1.4, '#f2dcc0');
  c.restore();
}
export function turtle(c, x, y, o) {
  const t = o.t || 0, f = o.face || 1;
  shadowE(c, x, y, 11);
  c.save(); c.translate(x, y); c.scale(f, 1);
  E(c, -6, -1.5, 2.6, 2, '#a7d68a'); E(c, 5, -1.5, 2.6, 2, '#a7d68a');
  const hb = Math.sin(t * 1.5) * 0.8;
  E(c, 11, -7 + hb, 4.2, 3.8, '#a7d68a');
  eye(c, 12.5, -8 + hb, 1.3);
  blush(c, 12, -5.5 + hb, 1.4);
  RR(c, 7.5, -12.5 + hb, 7.5, 3.5, 1.5, '#e04848'); RR(c, 12, -10.5 + hb, 5, 1.6, 0.8, '#e04848');
  E(c, 0, -7, 10, 7, '#6fb35f');
  for (const [px, py] of [[-4, -9], [2, -10], [-1, -5], [5, -6], [-6, -5]]) fillE(c, px, py, 2.2, 1.7, '#8fd07a');
  RR(c, -10, -4, 20, 3, 1.5, '#d9c48a');
  c.restore();
}
export function frog(c, x, y, o) {
  const t = o.t || 0;
  const j = Math.pow(Math.max(0, Math.sin(t * 1.3 + (o.seed || 0))), 30) * 6;
  shadowE(c, x, y, 7);
  c.save(); c.translate(x, y - j);
  E(c, 0, -5, 7.5, 5, '#86c96b');
  E(c, -3.5, -9.5, 2.8, 2.8, '#86c96b'); E(c, 3.5, -9.5, 2.8, 2.8, '#86c96b');
  eye(c, -3.5, -9.8, 1.4); eye(c, 3.5, -9.8, 1.4);
  c.beginPath(); c.arc(0, -5, 3, 0.2, Math.PI - 0.2); c.lineWidth = 1; c.strokeStyle = INK; c.stroke();
  blush(c, -5, -4.5, 1.5); blush(c, 5, -4.5, 1.5);
  c.restore();
}
export function lizard(c, x, y, o) {
  const t = o.t || 0, f = o.face || 1;
  c.save(); c.translate(x, y); c.scale(f, 1);
  fillE(c, 0, -1, 9, 2, 'rgba(60,40,80,0.15)');
  c.beginPath(); c.moveTo(-3, -3); c.quadraticCurveTo(-10, -2 + Math.sin(t * 3) * 2, -14, -6);
  c.lineWidth = 3.5; c.lineCap = 'round'; c.strokeStyle = INK; c.stroke(); c.lineWidth = 2; c.strokeStyle = '#8fcf6a'; c.stroke();
  E(c, 0, -3, 6, 2.8, '#8fcf6a');
  E(c, 6.5, -3.5, 3.2, 2.4, '#8fcf6a');
  eye(c, 7.5, -4.2, 0.9);
  for (const k of [-3, 3]) { line(c, k, -1.5, k - 1.5, 0.5, INK, 1.5); }
  c.restore();
}
export function butterfly(c, x, y, t, col = '#f6a6c1') {
  const fl = Math.abs(Math.cos(t * 14));
  fillE(c, x, y + 18, 2.5, 1, 'rgba(60,40,80,0.10)');
  c.save(); c.translate(x, y);
  c.scale(1, 1);
  E(c, -3 * fl, -1.5, 3.3 * fl + 0.3, 3, col, -0.4, 0.9); E(c, 3 * fl, -1.5, 3.3 * fl + 0.3, 3, col, 0.4, 0.9);
  E(c, -2.2 * fl, 2, 2.2 * fl + 0.3, 2, shade(col, 0.25), 0.3, 0.9); E(c, 2.2 * fl, 2, 2.2 * fl + 0.3, 2, shade(col, 0.25), -0.3, 0.9);
  fillE(c, 0, 0, 0.9, 3.4, INK);
  c.restore();
}

// ---------- Schede animali ----------
const SPECS = {
  mia: { bw: 10, bh: 6.5, hr: 6.6, body: '#ffffff', head: '#ffffff', spot: '#2f2a33', spots: [[-0.35, -0.25, 3.2], [0.35, 0.05, 2.4], [-0.05, 0.45, 2]], headSpot: true, ears: 'floppy', earC: '#2f2a33', snout: [3.2, 2.5], snoutC: '#f6efe9', tail: 'wag', legH: 4.5, collar: '#e86f8f' },
  bulldog: { bw: 11, bh: 7.5, hr: 7.6, hry: 0.85, body: '#d9b48a', belly: '#f3e3cf', ears: 'rose', earC: '#a57d58', snout: [4.6, 3.6], snoutC: '#f3e3cf', tail: 'stub', legH: 3, collar: '#3c6db5', scale: 1.15 },
  greyG: { bw: 9.5, bh: 4.8, hr: 4.8, body: '#a9a3b0', ears: 'fold', earC: '#8f8898', snout: [5, 2.3], neck: 2, headUp: 4, legH: 8, tail: 'thin', collar: '#d9534f' },
  greyL: { bw: 9.5, bh: 4.8, hr: 4.8, body: '#d1b597', ears: 'fold', earC: '#b69878', snout: [5, 2.3], neck: 2, headUp: 4, legH: 8, tail: 'thin', collar: '#4f8fd9' },
  yumi: { bw: 13.5, bh: 10.5, hr: 8.2, body: '#f2a24a', belly: '#fff8ee', stripes: '#d97f2b', ears: 'pointy', snout: [3, 2.4], snoutC: '#fff8ee', nose: '#ec8fa0', tail: 'thin', legH: 2.5 },
  catGrey: { bw: 8, bh: 5.8, hr: 6, body: '#a7a3b4', stripes: '#8b879a', ears: 'pointy', snout: [2.4, 1.9], snoutC: '#f2eff5', nose: '#ec8fa0', tail: 'thin', legH: 3.5 },
  catBlack: { bw: 8, bh: 5.8, hr: 6, body: '#3f3a46', ears: 'pointy', earIn: '#b07a8e', snout: [2.4, 1.9], snoutC: '#55505c', nose: '#ec8fa0', tail: 'thin', legH: 3.5 },
  catCalico: { bw: 8, bh: 5.8, hr: 6, body: '#fbf3e8', spot: '#e39a52', spots: [[-0.3, -0.2, 3], [0.3, 0.2, 2.2]], headSpot: true, ears: 'pointy', snout: [2.4, 1.9], snoutC: '#fff', nose: '#ec8fa0', tail: 'thin', legH: 3.5 },
  catGinger: { bw: 8, bh: 5.8, hr: 6, body: '#eba15a', stripes: '#cf7f36', belly: '#fff3e2', ears: 'pointy', snout: [2.4, 1.9], snoutC: '#fff3e2', nose: '#ec8fa0', tail: 'thin', legH: 3.5 },
  fox: { bw: 9, bh: 5.8, hr: 6.2, body: '#ef8a3c', belly: '#fff3e6', ears: 'pointy', earIn: '#3f2f2f', snout: [4, 2.3], snoutC: '#fff3e6', tail: 'fox', tailC: '#ef8a3c', legH: 4.5, legC: '#4a3438' },
  squirrel: { bw: 5.5, bh: 5, hr: 4.6, body: '#9a96a3', belly: '#ece8ef', ears: 'tuft', snout: [1.8, 1.5], tail: 'bushy', legH: 2, headUp: 2 },
  squirrelRed: { bw: 5.5, bh: 5, hr: 4.6, body: '#c9663a', belly: '#f6e2cf', ears: 'tuft', snout: [1.8, 1.5], tail: 'bushy', legH: 2, headUp: 2 },
  pig: { bw: 9, bh: 7, hr: 6.2, body: '#f5b5c0', ears: 'pig', snout: [2.6, 2.3], snoutC: '#f08ea0', tail: 'curl', legH: 3 },
  sheep: { bw: 9, bh: 6.5, hr: 4.6, body: '#fbf8f2', head: '#4a3f47', wool: true, ears: 'side', earC: '#4a3f47', legC: '#4a3f47', tail: 'puff', legH: 4, nose: '#2b2229' },
  bear: { bw: 12, bh: 9, hr: 7.6, body: '#8a5a3c', belly: '#c79a74', ears: 'round', snout: [3.6, 2.7], snoutC: '#d6b08c', tail: 'stub', legH: 4, scale: 1.1 },
  chamois: { bw: 9, bh: 5.5, hr: 5, body: '#a97a52', head: '#efe3d0', faceStripe: '#3b2f33', ears: 'horns', earC: '#a97a52', snout: [2.6, 2], snoutC: '#efe3d0', tail: 'stub', legH: 7.5, neck: 1.5, headUp: 4, legC: '#5b4433' },
  mole: { bw: 7, bh: 6, hr: 5.5, body: '#5e5566', snout: [2.6, 2], snoutC: '#f3a3b4', nose: '#e4637d', tail: 'stub', legH: 1.5, beret: true, eyeR: 1.1 },
};
const BIRDS = {
  duck: { bw: 8, bh: 6, hr: 4.6, body: '#ffffff', wing: '#eceef5', beak: '#f5a742', duck: true, legH: 2 },
  mallard: { bw: 8, bh: 6, hr: 4.6, body: '#c8b49c', head: '#3f8f6a', neck: '#ffffff', wing: '#a89277', beak: '#f2c24e', duck: true, legH: 2 },
  robin: { bw: 5.2, bh: 4.6, hr: 3.8, body: '#a07a5a', breast: '#ef7b4f', beak: '#3a2833', beakL: 2, legH: 2.5, legC: '#6b4c3b' },
  seagull: { bw: 7.5, bh: 5.5, hr: 4.2, body: '#ffffff', wing: '#b9c0cc', beak: '#f2c24e', legH: 3.5, legC: '#f2b05a' },
  captain: { bw: 7.5, bh: 5.5, hr: 4.2, body: '#ffffff', wing: '#b9c0cc', beak: '#f2c24e', legH: 3.5, legC: '#f2b05a', captain: true, scale: 1.15 },
  pigeon: { bw: 6, bh: 5, hr: 3.7, body: '#a9a9bb', neck: '#8fc2ad', head: '#9797ab', wing: '#8e8ea3', beak: '#5a4a52', beakL: 2, legH: 2, legC: '#e88a8a', peck: true },
  hen: { bw: 8.5, bh: 7.5, hr: 5.2, body: '#fbf3e6', wing: '#efe0c8', beak: '#f2a640', comb: true, legH: 3, apron: '#ffffff', glasses: true, scale: 1.1 },
};

// ---------- dispatcher personaggi ----------
export function actor(c, art, x, y, o = {}) {
  switch (art) {
    case 'geo': return bunny(c, x, y, { fur: '#fdf8f2', inner: '#f6a9bb', acc: 'sunflower', ...o });
    case 'lollo': return bunny(c, x, y, { fur: '#d4a373', inner: '#f2b3a6', belly: 'rgba(255,240,220,0.6)', acc: 'scarf', ...o });
    case 'hare': return bunny(c, x, y, { fur: '#c9a27c', inner: '#efb6a6', longEars: true, ...o });
    case 'bunnyGrey': return bunny(c, x, y, { fur: '#bdb6c4', inner: '#f2b3c3', ...o });
    case 'bunnyBrown': return bunny(c, x, y, { fur: '#9b7458', inner: '#f2b3a6', ...o });
    case 'hedgehog': return hedgehog(c, x, y, o);
    case 'turtle': return turtle(c, x, y, o);
    case 'frog': return frog(c, x, y, o);
    case 'lizard': return lizard(c, x, y, o);
    case 'butterfly': return butterfly(c, x, y - 18 + Math.sin((o.t || 0) * 2) * 4, o.t || 0, o.col);
    default:
      if (SPECS[art]) return quad(c, x, y, o, SPECS[art]);
      if (BIRDS[art]) return bird(c, x, y, o, BIRDS[art]);
      return bunny(c, x, y, o);
  }
}
// ritratto per i dialoghi (testa grande)
export function portrait(c, art, x, y, s, t) {
  c.save(); c.translate(x, y); c.scale(s, s);
  const isBunny = ['geo', 'lollo', 'hare', 'bunnyGrey', 'bunnyBrown'].includes(art);
  if (isBunny) actor(c, art, 0, 14, { t, dir: 'down', noShadow: true });
  else if (art === 'yumi') actor(c, art, -2, 13, { t, face: 1, noShadow: true, scale: 0.75 });
  else if (art === 'bear' || art === 'bulldog') actor(c, art, -2, 12, { t, face: 1, noShadow: true, scale: 0.9 });
  else actor(c, art, -1, 10, { t, face: 1, noShadow: true, scale: 1.05 });
  c.restore();
}

// ---------- Collezionabili ----------
export function paperPlane(c, x, y, t, s = 1, glow = true) {
  const bob = Math.sin(t * 3) * 3;
  shadowE(c, x, y, 7 * s);
  c.save(); c.translate(x, y - 14 - bob); c.scale(s, s); c.rotate(Math.sin(t * 2) * 0.12);
  if (glow) {
    const g = c.createRadialGradient(0, 0, 0, 0, 0, 17);
    g.addColorStop(0, 'rgba(255,244,190,0.75)'); g.addColorStop(1, 'rgba(255,244,190,0)');
    c.fillStyle = g; c.beginPath(); c.arc(0, 0, 17, 0, TAU); c.fill();
  }
  planeShape(c);
  c.restore();
}
export function planeShape(c) {
  c.lineJoin = 'round'; c.lineWidth = 1.2; c.strokeStyle = INK;
  poly(c, [11, 0, -10, -7.5, -5, 0], '#ffffff');
  poly(c, [11, 0, -5, 0, -9, 6.5], '#e3e9f4');
  line(c, 11, 0, -5, 0, INK, 0.9);
  heart(c, -3.5, -2.8, 1.8, '#f06d8f', false);
}
export function glyph(c, x, y, t, ch) {
  const bob = Math.sin(t * 3 + ch.charCodeAt(0)) * 2.5;
  shadowE(c, x, y, 6);
  c.save(); c.translate(x, y - 15 - bob);
  const g = c.createRadialGradient(0, 0, 0, 0, 0, 16);
  g.addColorStop(0, 'rgba(255,236,160,0.8)'); g.addColorStop(1, 'rgba(255,236,160,0)');
  c.fillStyle = g; c.beginPath(); c.arc(0, 0, 16, 0, TAU); c.fill();
  c.font = '700 19px Fredoka, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.lineWidth = 4; c.strokeStyle = '#fff'; c.lineJoin = 'round'; c.strokeText(ch, 0, 1);
  c.fillStyle = ch === 'G' ? '#e9a12f' : '#e5668a'; c.fillText(ch, 0, 1);
  const sp = (t * 2) % 1;
  c.globalAlpha = 1 - sp; star(c, 8, -8 - sp * 5, 2.2, '#fff6c8');
  c.restore();
}
export function star(c, x, y, r, col) {
  c.beginPath();
  for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU, rr = i % 2 ? r * 0.35 : r; c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
  c.closePath(); c.fillStyle = col; c.fill();
}
export function item(c, kind, x, y, t, s = 1) {
  const bob = Math.sin(t * 3) * 2;
  shadowE(c, x, y, 6 * s);
  c.save(); c.translate(x, y - 12 - bob); c.scale(s, s);
  const g = c.createRadialGradient(0, 0, 0, 0, 0, 14);
  g.addColorStop(0, 'rgba(255,244,190,0.7)'); g.addColorStop(1, 'rgba(255,244,190,0)');
  c.fillStyle = g; c.beginPath(); c.arc(0, 0, 14, 0, TAU); c.fill();
  itemIcon(c, kind);
  c.restore();
}
export function itemIcon(c, kind) {
  switch (kind) {
    case 'chiave':
      c.save(); c.rotate(-0.6);
      RR(c, -1.8, -2, 3.6, 12, 1.5, '#b8c2cf');
      c.beginPath(); c.arc(0, -5, 4.5, 0, TAU); c.fillStyle = '#b8c2cf'; c.fill(); c.lineWidth = 1.3; c.strokeStyle = INK; c.stroke();
      RR(c, -1.5, -10.5, 3, 4, 1, '#fdf1dc', false);
      c.restore(); break;
    case 'tortellino':
      E(c, 0, 0, 7, 5, '#f7cf63'); E(c, 0, 0.5, 3, 2.4, '#f2b84a');
      fillE(c, -2.5, -2, 1.5, 0.8, '#fff6cf', -0.4);
      star(c, 6, -5, 2, '#fff');
      break;
    case 'moneta':
      E(c, 0, 0, 5.5, 5.5, '#f4c84a'); c.font = '700 7px Fredoka, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#b07d1a'; c.fillText('❤', 0, 0.5);
      break;
    case 'carota':
      poly(c, [-2, -4, 2, -4, 0, 9], '#f08a3c'); fillE(c, -1.5, -6, 1.5, 3, '#6fbf5a', -0.4); fillE(c, 1.5, -6, 1.5, 3, '#6fbf5a', 0.4);
      break;
    default: heart(c, 0, 0, 5); break;
  }
}

// ---------- Oggetti ----------
export function sign(c, x, y, txt) {
  shadowE(c, x, y, 7);
  RR(c, x - 1.6, y - 16, 3.2, 16, 1, '#a9744f');
  RR(c, x - 11, y - 26, 22, 12, 3, '#d9a875');
  line(c, x - 7, y - 22, x + 7, y - 22, 'rgba(78,58,72,0.45)', 1.2);
  line(c, x - 7, y - 18.5, x + 4, y - 18.5, 'rgba(78,58,72,0.45)', 1.2);
}
export function crate(c, x, y, style, t, onPlate) {
  const px = x - 15, py = y - 30;
  if (style === 'sheep') { actor(c, 'sheep', x, y - 3, { t, face: hash(x, y) > 0.5 ? 1 : -1, happy: onPlate, seed: x }); return; }
  shadowE(c, x, y - 2, 14);
  if (style === 'marble') {
    RR(c, px + 2, py + 6, 26, 24, 3, '#f1ede4');
    RR(c, px, py + 2, 30, 8, 3, '#fbf8f1');
    E(c, x, py + 0, 7, 6, '#fbf8f1');
    line(c, px + 8, py + 14, px + 14, py + 22, 'rgba(150,140,160,0.5)', 1);
    if (onPlate) heart(c, x, py + 19, 3.5, '#f06d8f', false);
  } else if (style === 'books') {
    RR(c, px + 1, py + 6, 28, 24, 3, '#b77a4e');
    const cols = ['#e46b6b', '#5f8fd6', '#f2c14e', '#6fbf8f', '#b07ad6'];
    for (let i = 0; i < 5; i++) RR(c, px + 4 + i * 4.6, py + 2 + (i % 2) * 2, 4, 12 - (i % 2) * 2, 1, cols[i], true, 0.8);
    line(c, px + 3, py + 18, px + 27, py + 18, 'rgba(78,58,72,0.4)', 1.2);
    if (onPlate) heart(c, x, py + 24, 3, '#fff', false);
  } else {
    RR(c, px + 1, py + 4, 28, 26, 3, '#d29a62');
    line(c, px + 3, py + 8, px + 27, py + 26, 'rgba(78,58,72,0.35)', 2);
    line(c, px + 27, py + 8, px + 3, py + 26, 'rgba(78,58,72,0.35)', 2);
  }
}
export function plate(c, x, y, pressed, t, style) {
  const cx = x, cy = y - 12;
  if (style === 'hay') {
    E(c, cx, cy, 13, 8, pressed ? '#f6d77a' : '#e8c66a');
    for (let i = 0; i < 6; i++) line(c, cx - 9 + i * 3.5, cy - 4, cx - 7 + i * 3.2, cy + 4, 'rgba(160,110,40,0.5)', 1);
    return;
  }
  E(c, cx, cy, 12, 9, pressed ? '#ffe1ea' : '#e2dccf');
  heart(c, cx, cy + 1, 4.5, pressed ? '#f06d8f' : '#c9bfb0', false);
  if (pressed) { c.globalAlpha = 0.35 + Math.sin(t * 4) * 0.15; fillE(c, cx, cy, 14, 10, '#ffd1df'); c.globalAlpha = 1; }
}
export function puzzleFlower(c, x, y, rot, t, solved) {
  const sw = Math.sin(t * 2 + x) * 1.2;
  shadowE(c, x, y, 7);
  line(c, x, y - 2, x + sw * 0.5, y - 26, '#5f9c4a', 3);
  fillE(c, x - 5, y - 12, 5, 2.2, '#6fb35a', 0.5); fillE(c, x + 5, y - 16, 5, 2.2, '#6fb35a', -0.5);
  const dx = [0, 1, 0, -1][rot] * 5, dy = [-1, 0, 1, 0][rot] * 4;
  const hx = x + sw * 0.5 + dx, hy = y - 30 + dy;
  for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU + t * 0.2; E(c, hx + Math.cos(a) * 8, hy + Math.sin(a) * 8, 4.2, 2.2, '#ffd23f', a, 1); }
  E(c, hx, hy, 6.5, 6.5, '#8a5a2b');
  for (let i = 0; i < 6; i++) fillE(c, hx + Math.cos(i) * 3.5, hy + Math.sin(i * 2) * 3.5, 0.7, 0.7, '#5f3b1c');
  const fx = [0, 1, 0, -1][rot] * 2.2, fy = [-1, 0, 1, 0][rot] * 2.2;
  eye(c, hx - 2.2 + fx, hy - 1 + fy, 1.1, solved ? 'happy' : '');
  eye(c, hx + 2.2 + fx, hy - 1 + fy, 1.1, solved ? 'happy' : '');
  c.beginPath(); c.arc(hx + fx, hy + 1.2 + fy, 1.6, 0.2, Math.PI - 0.2); c.lineWidth = 1; c.strokeStyle = INK; c.stroke();
}
export function lamp(c, x, y, night, t) {
  shadowE(c, x, y, 6);
  RR(c, x - 2, y - 34, 4, 34, 1.5, '#4d4a5c');
  RR(c, x - 5, y - 3, 10, 4, 2, '#4d4a5c');
  RR(c, x - 6, y - 44, 12, 11, 3, night ? '#ffe7a3' : '#eef3f7');
  poly(c, [x - 8, y - 44, x, y - 50, x + 8, y - 44], '#4d4a5c');
}
export function bench(c, x, y) {
  shadowE(c, x, y, 16);
  RR(c, x - 15, y - 16, 30, 5, 2, '#b98455');
  RR(c, x - 15, y - 10, 30, 5, 2, '#c99565');
  RR(c, x - 13, y - 6, 3, 6, 1, '#6a5a64'); RR(c, x + 10, y - 6, 3, 6, 1, '#6a5a64');
}
export function phonebox(c, x, y) {
  shadowE(c, x, y, 11);
  RR(c, x - 10, y - 46, 20, 46, 3, '#d9423e');
  RR(c, x - 11, y - 50, 22, 6, 3, '#c1342f');
  for (let i = 0; i < 3; i++) RR(c, x - 7, y - 40 + i * 10, 14, 8, 1, '#cfe8f1', true, 0.8);
  RR(c, x - 7, y - 47, 14, 3, 1, '#fff', false);
}
export function statue(c, x, y, kind, t) {
  shadowE(c, x, y, 14);
  RR(c, x - 12, y - 14, 24, 14, 2, '#e6e0d6');
  RR(c, x - 14, y - 17, 28, 5, 2, '#f1ede6');
  c.save(); c.globalAlpha = 0.92;
  if (kind === 'bunny') bunny(c, x, y - 16, { fur: '#d9d7de', inner: '#c9c5cf', t: 0, noShadow: true, scale: 1.1 });
  else if (kind === 'wolf') quad(c, x, y - 16, { t: 0, noShadow: true, face: -1 }, { ...SPECS.fox, body: '#c7a873', belly: '#d8bf8f', tail: 'stub', snoutC: '#d8bf8f', legC: '#c7a873', tailC: '#c7a873', earIn: '#b08f5a' });
  else { E(c, x, y - 30, 7, 13, '#e0dbe4'); E(c, x, y - 46, 5.5, 5.5, '#e0dbe4'); }
  c.restore();
}
export function car(c, x, y, t) {
  shadowE(c, x, y, 22);
  RR(c, x - 22, y - 16, 44, 12, 6, '#e03c3c');
  RR(c, x - 12, y - 24, 22, 10, 5, '#e03c3c');
  RR(c, x - 9, y - 22, 16, 6, 3, '#cfe8f1', true, 0.8);
  E(c, x - 13, y - 4, 4.5, 4.5, '#3b3540'); E(c, x + 13, y - 4, 4.5, 4.5, '#3b3540');
  fillE(c, x - 13, y - 4, 1.8, 1.8, '#ddd'); fillE(c, x + 13, y - 4, 1.8, 1.8, '#ddd');
  fillE(c, x + 20, y - 12, 2, 1.5, '#ffe9a3');
  c.font = '700 6px Fredoka, sans-serif'; c.fillStyle = '#fff'; c.textAlign = 'center'; c.fillText('G♥L', x, y - 8);
}
export function bigPlane(c, x, y, t, crashed) {
  shadowE(c, x, y, 34);
  c.save(); c.translate(x, y - (crashed ? 10 : 20 + Math.sin(t * 2) * 2));
  c.scale(3.2, 3.2);
  if (crashed) c.rotate(0.35);
  planeShape(c);
  c.restore();
}
export function haystack(c, x, y) {
  shadowE(c, x, y, 15);
  E(c, x, y - 10, 15, 11, '#ecc76a');
  for (let i = 0; i < 6; i++) line(c, x - 10 + i * 4, y - 16, x - 8 + i * 3.6, y - 3, 'rgba(160,110,40,0.45)', 1);
}
export function well(c, x, y) {
  shadowE(c, x, y, 13);
  RR(c, x - 12, y - 14, 24, 14, 4, '#bdb3a8');
  E(c, x, y - 14, 12, 4, '#4b6b8a');
  RR(c, x - 13, y - 36, 3, 22, 1, '#9b6f4e'); RR(c, x + 10, y - 36, 3, 22, 1, '#9b6f4e');
  poly(c, [x - 16, y - 34, x, y - 44, x + 16, y - 34], '#c8643c');
}
export function giantCarrot(c, x, y, t, pull = 0) {
  shadowE(c, x, y, 12);
  c.save(); c.translate(x, y - pull * 10);
  if (pull > 0) poly(c, [-7, -6, 7, -6, 0, 18 * Math.min(1, pull)], '#f08a3c');
  E(c, 0, -6, 9, 4.5, '#f08a3c');
  for (let i = -2; i <= 2; i++) E(c, i * 3.5, -16 - Math.abs(i) * -1 + Math.sin(t * 2 + i) * 1.2, 2.6, 8, '#6fbf5a', i * 0.25);
  c.restore();
}
export function scarecrow(c, x, y, t) {
  shadowE(c, x, y, 8);
  RR(c, x - 1.5, y - 30, 3, 30, 1, '#9b6f4e');
  RR(c, x - 14, y - 26, 28, 3, 1, '#9b6f4e');
  RR(c, x - 8, y - 28, 16, 14, 4, '#7aa6d8');
  E(c, x, y - 34, 6.5, 6.5, '#f2dcae');
  poly(c, [x - 10, y - 37, x, y - 46, x + 10, y - 37], '#e9c46a');
  eye(c, x - 2.2, y - 34, 1); eye(c, x + 2.2, y - 34, 1);
}
export function busStop(c, x, y, label) {
  shadowE(c, x, y, 6);
  RR(c, x - 1.5, y - 34, 3, 34, 1, '#5b6b7a');
  E(c, x, y - 38, 8, 8, '#f2c14e');
  c.font = '700 7px Fredoka, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = INK; c.fillText(label || 'BUS', x, y - 37.5);
}
export function crashedPlane(c, x, y, t) { bigPlane(c, x, y, t, true); }
export function flowerPot(c, x, y, t, col = '#f06d8f') {
  shadowE(c, x, y, 6);
  poly(c, [x - 6, y - 10, x + 6, y - 10, x + 4.5, y, x - 4.5, y], '#d27a4f');
  for (let i = -1; i <= 1; i++) flower(c, x + i * 4, y - 14 - Math.abs(i) * -1 + Math.sin(t * 2 + i) * 0.5, 0.8, col, '#f7e08a');
}
export function rug(c, x, y) {
  E(c, x, y - 12, 18, 9, '#e8a0b4'); E(c, x, y - 12, 13, 6, '#f6c6d4');
}

// ---------- Terreno ----------
const GRP = { '=': 'path', '-': 'cobble', o: 'plaza', '~': 'water', _: 'water', ':': 'sand', c: 'soil', w: 'wood' };
export const SOLID = new Set(['T', 'P', 'C', 'O', 'b', 'h', 'f', 'r', 'm', 'S', 'R', 'M', 'k', '~', 'x']);
export const TALL = new Set(['T', 'P', 'C', 'O', 'b', 'h', 'f', 'r', 'm', 'S', 'R', 'M', 'k']);
function sameGrp(m, x, y, g) {
  if (y < 0 || y >= m.length || x < 0 || x >= m[0].length) return true;
  const ch = m[y][x];
  return GRP[ch] === g || (g === 'path' && (ch === '_' || ch === '-')) || (g === 'cobble' && (ch === '=' || ch === '_' || ch === 'o'));
}
function softTile(c, m, tx, ty, g, col) {
  const up = sameGrp(m, tx, ty - 1, g), dn = sameGrp(m, tx, ty + 1, g), lf = sameGrp(m, tx - 1, ty, g), rt = sameGrp(m, tx + 1, ty, g);
  const R = 11;
  rrPath(c, tx * 32 - 0.3, ty * 32 - 0.3, 32.6, 32.6, [!up && !lf ? R : 0, !up && !rt ? R : 0, !dn && !rt ? R : 0, !dn && !lf ? R : 0]);
  c.fillStyle = col; c.fill();
}
function grassDetail(c, x, y, tx, ty, pal) {
  const h = hash(tx, ty, 3);
  if (h < 0.55) {
    const gx = x + 6 + hash(tx, ty, 4) * 20, gy = y + 8 + hash(tx, ty, 5) * 18;
    c.beginPath(); c.moveTo(gx - 3, gy); c.lineTo(gx - 1.5, gy - 4); c.moveTo(gx, gy); c.lineTo(gx, gy - 5); c.moveTo(gx + 3, gy); c.lineTo(gx + 1.5, gy - 4);
    c.lineWidth = 1.2; c.lineCap = 'round'; c.strokeStyle = pal.grass2; c.stroke();
  } else if (h > 0.9) {
    fillE(c, x + 10 + hash(tx, ty, 6) * 12, y + 10 + hash(tx, ty, 7) * 12, 1.6, 1.6, pal.grassLight || '#ffffff66');
  }
}
export function drawGround(c, m, tx, ty, pal, t) {
  const ch = m[ty][tx];
  const x = tx * 32, y = ty * 32;
  switch (ch) {
    case '=': softTile(c, m, tx, ty, 'path', pal.path);
      if (hash(tx, ty, 9) > 0.6) fillE(c, x + 8 + hash(tx, ty, 1) * 16, y + 8 + hash(tx, ty, 2) * 16, 2, 1.4, pal.pathDot || 'rgba(120,90,60,0.25)');
      break;
    case '-': {
      softTile(c, m, tx, ty, 'cobble', pal.cobble);
      const off = (ty % 2) * 8;
      c.fillStyle = pal.cobble2;
      for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) { rrPath(c, x + 2 + i * 16 + (j ? off : 0) % 16 - (j && off ? 4 : 0), y + 2 + j * 16, 12, 12, 4); c.fill(); }
      break;
    }
    case 'o': softTile(c, m, tx, ty, 'plaza', pal.plaza);
      c.fillStyle = pal.plaza2;
      if ((tx + ty) % 2 === 0) { rrPath(c, x + 2, y + 2, 28, 28, 3); c.fill(); }
      break;
    case '~': case '_': {
      softTile(c, m, tx, ty, 'water', pal.water);
      const ph = t * 1.4 + hash(tx, ty) * 6;
      c.beginPath(); c.arc(x + 10 + hash(tx, ty, 2) * 12 + Math.sin(ph) * 2, y + 14 + hash(tx, ty, 3) * 8, 5, Math.PI * 1.1, Math.PI * 1.9);
      c.lineWidth = 1.5; c.strokeStyle = pal.water2; c.lineCap = 'round'; c.stroke();
      if (ch === '_') {
        const vert = sameGrp(m, tx - 1, ty, 'water') && sameGrp(m, tx + 1, ty, 'water') && !(m[ty][tx - 1] === '_' || m[ty][tx + 1] === '_');
        c.fillStyle = '#c99a6a';
        if (vert) { rrPath(c, x + 2, y - 1, 28, 34, 2); c.fill(); for (let i = 0; i < 4; i++) line(c, x + 3, y + 4 + i * 8, x + 29, y + 4 + i * 8, 'rgba(90,60,40,0.35)', 1.2); line(c, x + 2, y - 1, x + 2, y + 33, '#8f6644', 2); line(c, x + 30, y - 1, x + 30, y + 33, '#8f6644', 2); }
        else { rrPath(c, x - 1, y + 3, 34, 26, 2); c.fill(); for (let i = 0; i < 4; i++) line(c, x + 4 + i * 8, y + 4, x + 4 + i * 8, y + 28, 'rgba(90,60,40,0.35)', 1.2); line(c, x - 1, y + 3, x + 33, y + 3, '#8f6644', 2); line(c, x - 1, y + 29, x + 33, y + 29, '#8f6644', 2); }
      }
      break;
    }
    case ':': softTile(c, m, tx, ty, 'sand', pal.sand);
      fillE(c, x + 6 + hash(tx, ty, 1) * 20, y + 6 + hash(tx, ty, 2) * 20, 1.2, 1.2, 'rgba(160,120,70,0.3)');
      break;
    case 'c': softTile(c, m, tx, ty, 'soil', pal.soil);
      for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) {
        const cx = x + 8 + i * 16, cy = y + 10 + j * 16;
        fillE(c, cx, cy + 2, 3, 1.6, '#f08a3c');
        fillE(c, cx - 2, cy - 2, 1.3, 3.2, '#6fbf5a', -0.4); fillE(c, cx + 2, cy - 2, 1.3, 3.2, '#6fbf5a', 0.4); fillE(c, cx, cy - 3, 1.2, 3.4, '#7fcf6a');
      }
      break;
    case 'w': softTile(c, m, tx, ty, 'wood', pal.wood || '#d8b07e');
      for (let i = 0; i < 4; i++) line(c, x, y + i * 8 + 0.5, x + 32, y + i * 8 + 0.5, 'rgba(110,70,40,0.3)', 1);
      break;
    default: {
      grassDetail(c, x, y, tx, ty, pal);
      if (ch === ',') {
        const cols = pal.flowers || ['#f6a6c1', '#ffffff', '#ffd23f'];
        for (let i = 0; i < 3; i++) {
          const fx = x + 6 + hash(tx, ty, 10 + i) * 20, fy = y + 6 + hash(tx, ty, 20 + i) * 20;
          flower(c, fx, fy, 0.55, cols[i % cols.length], '#f7c948');
        }
      } else if (ch === 'L') {
        for (let i = 0; i < 2; i++) {
          const fx = x + 9 + i * 13, fy = y + 18 - i * 6;
          line(c, fx, fy + 8, fx, fy, '#5f9c4a', 1.6);
          E(c, fx - 2.5, fy - 1, 2.2, 4, '#9b7fd9', -0.4, 0.9); E(c, fx + 2.5, fy - 1, 2.2, 4, '#9b7fd9', 0.4, 0.9); E(c, fx, fy - 3, 2, 4.2, '#b49af0', 0, 0.9);
        }
      } else if (ch === 's') {
        for (let i = 0; i < 2; i++) {
          const fx = x + 9 + i * 14 + Math.sin(t * 2 + tx + i) * 0.8, fy = y + 14 + (i ? 8 : 0);
          line(c, fx, fy + 8, fx, fy, '#5f9c4a', 1.6);
          flower(c, fx, fy, 1.1);
        }
      } else if (ch === '"') {
        for (let i = 0; i < 3; i++) {
          const gx = x + 6 + i * 10, gy = y + 26;
          c.beginPath(); c.moveTo(gx, gy); c.quadraticCurveTo(gx - 3, gy - 8, gx - 2 + Math.sin(t * 2 + i) * 1.5, gy - 14);
          c.moveTo(gx + 2, gy); c.quadraticCurveTo(gx + 4, gy - 7, gx + 5 + Math.sin(t * 2 + i) * 1.5, gy - 11);
          c.lineWidth = 1.6; c.strokeStyle = pal.grass2; c.stroke();
        }
      }
    }
  }
}

function sameCh(m, x, y, ch) { if (y < 0 || y >= m.length || x < 0 || x >= m[0].length) return false; return m[y][x] === ch; }
export function drawTall(c, m, tx, ty, pal, t) {
  const ch = m[ty][tx];
  const x = tx * 32, y = ty * 32, h = hash(tx, ty, 11);
  const sway = Math.sin(t * 1.3 + tx * 0.7) * 0.8;
  switch (ch) {
    case 'T': {
      shadowE(c, x + 16, y + 28, 15);
      RR(c, x + 12.5, y + 10, 7, 19, 2.5, '#9b6f4e');
      const g = pal.tree || '#7cc47a', g2 = pal.tree2 || shade(g, -0.12), hl = shade(g, 0.22);
      E(c, x + 16 + sway, y - 3, 15 + h * 2, 13, g2);
      E(c, x + 9 + sway, y + 5, 10, 9, g); E(c, x + 23 + sway, y + 5, 10, 9, g);
      E(c, x + 16 + sway, y - 7, 11, 9.5, g);
      fillE(c, x + 13 + sway, y - 10, 5, 3, hl, -0.3);
      if (pal.blossom && h > 0.5) for (let i = 0; i < 4; i++) fillE(c, x + 8 + hash(tx, ty, i) * 16 + sway, y - 8 + hash(tx, ty, i + 9) * 16, 1.6, 1.6, pal.blossom);
      break;
    }
    case 'O': {
      shadowE(c, x + 16, y + 28, 13);
      RR(c, x + 13, y + 12, 6, 17, 2.5, '#9b6f4e');
      E(c, x + 16 + sway, y + 2, 14, 12, '#5fae5f');
      fillE(c, x + 12 + sway, y - 3, 5, 3, '#86cf7a', -0.3);
      for (let i = 0; i < 6; i++) E(c, x + 7 + hash(tx, ty, i) * 18 + sway, y - 4 + hash(tx, ty, i + 5) * 13, 2.3, 2.3, '#f6a03a', 0, 0.8);
      break;
    }
    case 'P': {
      shadowE(c, x + 16, y + 28, 16);
      c.beginPath(); c.moveTo(x + 15, y + 29); c.quadraticCurveTo(x + 13, y + 8, x + 17 + sway, y - 18);
      c.lineWidth = 5.5; c.strokeStyle = INK; c.stroke(); c.lineWidth = 3.8; c.strokeStyle = '#8f6046'; c.stroke();
      E(c, x + 16 + sway, y - 22, 21, 8, '#4f8f5a'); E(c, x + 12 + sway, y - 26, 12, 5, '#62a46b'); fillE(c, x + 20 + sway, y - 26, 6, 2.5, '#7cbf82');
      break;
    }
    case 'C': {
      shadowE(c, x + 16, y + 28, 9);
      RR(c, x + 14, y + 20, 4, 9, 1.5, '#8f6046');
      E(c, x + 16 + sway * 0.6, y - 4, 8.5, 26, '#3f7f55');
      fillE(c, x + 13.5 + sway * 0.6, y - 10, 3, 14, '#57996a');
      break;
    }
    case 'b': {
      shadowE(c, x + 16, y + 27, 14);
      const g = pal.bush || '#6db86b';
      E(c, x + 10, y + 19, 9, 8, g); E(c, x + 22, y + 19, 9, 8, g); E(c, x + 16, y + 13, 9, 8, g);
      fillE(c, x + 13, y + 10, 3.5, 2, shade(g, 0.25), -0.3);
      if (h > 0.5) for (let i = 0; i < 3; i++) fillE(c, x + 9 + i * 7, y + 14 + (i % 2) * 6, 1.6, 1.6, '#f6a6c1');
      break;
    }
    case 'h': {
      const g = pal.hedge || '#5fae66';
      const up = sameCh(m, tx, ty - 1, 'h'), dn = sameCh(m, tx, ty + 1, 'h'), lf = sameCh(m, tx - 1, ty, 'h'), rt = sameCh(m, tx + 1, ty, 'h');
      const R = 9;
      rrPath(c, x - (lf ? 0.5 : -1), y - 8 - (up ? 0.5 : 0), 32 + (lf ? 0.5 : -1) + (rt ? 0.5 : -1), 40 + (up ? 0.5 : 0) - (dn ? 0 : 1), [!up && !lf ? R : 0, !up && !rt ? R : 0, !dn && !rt ? R : 0, !dn && !lf ? R : 0]);
      c.fillStyle = shade(g, -0.15); c.fill();
      rrPath(c, x - (lf ? 0.5 : -1), y - 8 - (up ? 0.5 : 0), 32 + (lf ? 0.5 : -1) + (rt ? 0.5 : -1), 32 + (up ? 0.5 : 0) + (dn ? 8 : 0), [!up && !lf ? R : 0, !up && !rt ? R : 0, !dn && !rt ? R : 0, !dn && !lf ? R : 0]);
      c.fillStyle = g; c.fill();
      fillE(c, x + 8 + h * 14, y + h * 10, 3, 2, shade(g, 0.2));
      if (!dn) line(c, x + (lf ? 0 : 6), y + 32, x + (rt ? 32 : 26), y + 32, 'rgba(60,40,70,0.35)', 1.2);
      break;
    }
    case 'f': {
      const lf = sameCh(m, tx - 1, ty, 'f'), rt = sameCh(m, tx + 1, ty, 'f'), up = sameCh(m, tx, ty - 1, 'f');
      const col = pal.fence || '#e9d8bf';
      if (lf || rt) {
        RR(c, x + (lf ? 0 : 14), y + 10, (lf ? 16 : 2) + (rt ? 16 : 2), 4, 1.5, col, true, 1);
        RR(c, x + (lf ? 0 : 14), y + 19, (lf ? 16 : 2) + (rt ? 16 : 2), 4, 1.5, col, true, 1);
      }
      if (up) RR(c, x + 14, y - 16, 4, 40, 1.5, col, true, 1);
      RR(c, x + 13, y + 4, 6, 24, 2, col, true, 1.1);
      break;
    }
    case 'r': {
      shadowE(c, x + 16, y + 28, 13);
      E(c, x + 16, y + 18, 13, 10, pal.rock || '#b6b0bd');
      fillE(c, x + 12, y + 14, 4.5, 2.5, '#d5d0da', -0.2);
      break;
    }
    case 'm': {
      const hh = 46 + h * 26;
      const col = pal.mountain || '#8c93b5';
      poly(c, [x - 10, y + 32, x + 16 + (h - 0.5) * 8, y + 32 - hh, x + 42, y + 32], col);
      poly(c, [x + 16 + (h - 0.5) * 8, y + 32 - hh, x + 42, y + 32, x + 22, y + 32], shade(col, -0.12), false);
      const px = x + 16 + (h - 0.5) * 8, py = y + 32 - hh;
      poly(c, [px - 8.5, py + 13, px, py, px + 8.5, py + 13, px + 4, py + 10, px, py + 14, px - 4, py + 10], '#f7f8ff', true, 1);
      break;
    }
    case 'S': {
      const sw2 = Math.sin(t * 1.6 + tx + ty * 2) * 1.5;
      shadowE(c, x + 16, y + 28, 8);
      line(c, x + 16, y + 28, x + 16 + sw2, y - 8, '#5f9c4a', 3.2);
      fillE(c, x + 10, y + 12, 6, 2.6, '#6fb35a', 0.5); fillE(c, x + 22, y + 6, 6, 2.6, '#6fb35a', -0.5);
      const hx = x + 16 + sw2, hy = y - 12;
      for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU; E(c, hx + Math.cos(a) * 8, hy + Math.sin(a) * 8, 4.5, 2.3, '#ffd23f', a, 1); }
      E(c, hx, hy, 6.5, 6.5, '#8a5a2b');
      for (let i = 0; i < 5; i++) fillE(c, hx + Math.cos(i * 2.4) * 3.2, hy + Math.sin(i * 2.4) * 3.2, 0.7, 0.7, '#5f3b1c');
      break;
    }
    case 'R': case 'M': {
      const col = ch === 'R' ? (pal.brick || '#b8604e') : (pal.marble || '#f3efe6');
      const up = sameCh(m, tx, ty - 1, ch), dn = sameCh(m, tx, ty + 1, ch), lf = sameCh(m, tx - 1, ty, ch), rt = sameCh(m, tx + 1, ty, ch);
      const top = up ? y : y - 10;
      c.fillStyle = shade(col, -0.12); c.fillRect(x, top + 6, 32, 32 - (top + 6 - y));
      rrPath(c, x, top, 32, dn ? 32 + (y - top) : 26 + (y - top), [!up && !lf ? 4 : 0, !up && !rt ? 4 : 0, 0, 0]);
      c.fillStyle = shade(col, 0.15); c.fill();
      if (!dn) {
        c.fillStyle = col; c.fillRect(x, y + 16, 32, 16);
        if (ch === 'R') for (let i = 0; i < 2; i++) for (let j = 0; j < 3; j++) { c.strokeStyle = 'rgba(80,40,40,0.3)'; c.lineWidth = 1; c.strokeRect(x + j * 11 + (i % 2) * 5 - 5, y + 16 + i * 8, 11, 8); }
        else line(c, x + 6, y + 20, x + 14, y + 28, 'rgba(150,140,160,0.4)', 1);
        line(c, x, y + 32, x + 32, y + 32, 'rgba(60,40,70,0.35)', 1.2);
      }
      break;
    }
    case 'k': {
      shadowE(c, x + 16, y + 28, 14);
      RR(c, x + 3, y + 4, 3, 25, 1, '#9b6f4e', true, 0.9); RR(c, x + 26, y + 4, 3, 25, 1, '#9b6f4e', true, 0.9);
      line(c, x, y + 9, x + 32, y + 9, '#8a7a6a', 1);
      for (let i = 0; i < 4; i++) E(c, x + 4 + i * 8, y + 12 + (i % 2) * 3, 6, 5, '#79b85a', 0, 1);
      for (let i = 0; i < 2; i++) { const gx = x + 10 + i * 13, gy = y + 20; for (let j = 0; j < 4; j++) E(c, gx + (j % 2) * 3 - 1.5, gy + Math.floor(j / 2) * 3, 1.8, 1.8, '#8c5bb5', 0, 0.7); }
      break;
    }
    default: break;
  }
}

// ---------- Edifici ----------
function windowW(c, x, y, w, h, night, frame = '#fff') {
  RR(c, x - 1.5, y - 1.5, w + 3, h + 3, 2.5, frame, true, 1);
  RR(c, x, y, w, h, 2, night ? '#ffd97a' : '#a9d6ea', false);
  if (!night) poly(c, [x + 2, y + h - 2, x + w * 0.5, y + 2, x + w * 0.7, y + 2, x + 3.5, y + h - 2], 'rgba(255,255,255,0.5)', false);
  line(c, x + w / 2, y, x + w / 2, y + h, frame, 1.2);
}
function doorD(c, x, y, w, h, col) {
  RR(c, x, y, w, h, [w / 2, w / 2, 0, 0], col);
  fillE(c, x + w * 0.75, y + h * 0.55, 1.2, 1.2, '#f2c14e');
}
function signTxt(c, x, y, txt, bg = '#fff6e0', fg = INK, size = 7) {
  c.font = `700 ${size}px Fredoka, sans-serif`;
  const w = c.measureText(txt).width + 8;
  RR(c, x - w / 2, y - size * 0.8, w, size * 1.6, 3, bg, true, 1);
  c.fillStyle = fg; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(txt, x, y + 0.5);
}
export function clockFace(c, x, y, r, hh, mm, reverse = false) {
  E(c, x, y, r, r, '#fffaf0');
  for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU; fillE(c, x + Math.cos(a) * r * 0.78, y + Math.sin(a) * r * 0.78, 0.7, 0.7, INK); }
  const s = reverse ? -1 : 1;
  const am = s * (mm / 60) * TAU - Math.PI / 2, ah = s * (((hh % 12) + mm / 60) / 12) * TAU - Math.PI / 2;
  line(c, x, y, x + Math.cos(ah) * r * 0.5, y + Math.sin(ah) * r * 0.5, INK, 1.6);
  line(c, x, y, x + Math.cos(am) * r * 0.75, y + Math.sin(am) * r * 0.75, INK, 1.1);
  fillE(c, x, y, 1.2, 1.2, '#e86f8f');
}
function roofTiles(c, x, y, w, h, col, r = 8) {
  RR(c, x, y, w, h, r, col);
  c.save(); rrPath(c, x, y, w, h, r); c.clip();
  for (let yy = y + 7; yy < y + h; yy += 7) line(c, x, yy, x + w, yy, 'rgba(70,40,40,0.18)', 1.5);
  fillE(c, x + w * 0.3, y + 4, w * 0.25, 2, 'rgba(255,255,255,0.25)');
  c.restore();
}
function house(c, b, S, night) {
  const px = b.x * 32, py = b.y * 32, pw = b.w * 32, ph = b.h * 32;
  const wallTop = py + ph * (S.roofFrac || 0.45);
  flatShadow(c, px + pw / 2, py + ph - 2, pw * 0.55);
  RR(c, px + 3, wallTop, pw - 6, py + ph - wallTop, 3, S.wall);
  if (S.stone) for (let i = 0; i < 10; i++) RR(c, px + 6 + hash(b.x, i) * (pw - 20), wallTop + 4 + hash(i, b.y) * (py + ph - wallTop - 12), 8, 5, 2, shade(S.wall, -0.06), false);
  if (S.bricks) for (let yy = wallTop + 6; yy < py + ph - 2; yy += 6) line(c, px + 4, yy, px + pw - 4, yy, 'rgba(90,40,40,0.15)', 1);
  roofTiles(c, px - 3, py - 8, pw + 6, wallTop - py + 14, S.roof, S.roofR ?? 8);
  if (S.chimney) RR(c, px + pw * 0.75, py - 16, 9, 14, 2, S.chimneyC || '#9b6f5e');
  const wy = wallTop + (py + ph - wallTop) * 0.25;
  const doorX = b.door ? b.door.x * 32 + 16 : px + pw / 2;
  const nWin = Math.max(1, Math.floor(pw / 32) - 1);
  for (let i = 0; i < nWin + 1; i++) {
    const wx = px + (pw / (nWin + 1)) * (i + 0.5) + 16 - 6;
    if (Math.abs(wx + 6 - doorX) < 16) continue;
    windowW(c, wx - 6, wy, 13, 12, night, S.frame);
    if (S.shutters) { RR(c, wx - 11, wy - 1, 4, 14, 1, S.shutters, true, 0.8); RR(c, wx + 9, wy - 1, 4, 14, 1, S.shutters, true, 0.8); }
    if (S.flowers) { RR(c, wx - 8, wy + 13, 17, 4, 1.5, '#a5704c', true, 0.8); for (let k = 0; k < 3; k++) fillE(c, wx - 4 + k * 5, wy + 12, 1.8, 1.8, S.flowers); }
  }
  if (S.awning) {
    const aw = Math.min(pw - 16, 80), ax = doorX - aw / 2, ay = wallTop + 2;
    for (let i = 0; i < aw / 8; i++) RR(c, ax + i * 8, ay, 8, 9, [0, 0, 4, 4], i % 2 ? '#fff' : S.awning, true, 0.8);
  }
  if (b.door) doorD(c, doorX - 8, py + ph - 21, 16, 21, S.door || '#b5654a');
  if (S.sign) signTxt(c, doorX, wallTop - 3, S.sign, S.signBg, S.signFg, S.signSize || 7);
}

export function drawBuilding(c, b, t, night, clockStr) {
  const px = b.x * 32, py = b.y * 32, pw = b.w * 32, ph = b.h * 32;
  switch (b.style) {
    case 'brickhouse': house(c, b, { wall: '#c7705c', roof: '#5f6b85', frame: '#fff', door: '#e2556a', chimney: true, bricks: true, flowers: '#f6a6c1', sign: 'Casa di Geo ♥', signSize: 6.5 }, night); break;
    case 'terrace': house(c, b, { wall: b.wall || '#b9654f', roof: '#59647d', frame: '#fff', door: b.doorC || '#3d6fb0', chimney: true, bricks: true }, night); break;
    case 'library': {
      house(c, b, { wall: '#b85c4c', roof: '#6b7896', frame: '#f5efe2', door: '#5a3b2e', bricks: true, sign: 'BIBLIOTECA', signSize: 8, roofFrac: 0.4 }, night);
      for (let i = 0; i < 4; i++) RR(c, px + 14 + i * ((pw - 34) / 3), py + ph * 0.42, 6, ph * 0.58 - 2, 2, '#f2ece0', true, 1);
      break;
    }
    case 'theatre': {
      house(c, b, { wall: '#f1e3c8', roof: '#8f5f7a', frame: '#fff', door: '#c03a4a', sign: 'TEATRO', signBg: '#c03a4a', signFg: '#fff', roofFrac: 0.42 }, night);
      for (let i = 0; i < 4; i++) if (i !== 1 && i !== 2) RR(c, px + 10 + i * ((pw - 26) / 3), py + ph * 0.44, 6, ph * 0.56 - 2, 2, '#fffaf0', true, 1);
      break;
    }
    case 'osteria': house(c, b, { wall: '#efbf72', roof: '#c8643c', frame: '#fff8ea', door: '#6b8e4e', shutters: '#6b9e5a', awning: '#e05a5a', sign: 'OSTERIA DA GILDA', signSize: 6.5, flowers: '#e05a5a' }, night); break;
    case 'garage': {
      house(c, b, { wall: '#eef0f2', roof: '#d94a4a', frame: '#fff', roofFrac: 0.42 }, night);
      RR(c, px + 14, py + ph - 30, pw - 28, 30, [6, 6, 0, 0], '#c9ced6');
      for (let i = 0; i < 4; i++) line(c, px + 16, py + ph - 24 + i * 6, px + pw - 16, py + ph - 24 + i * 6, 'rgba(70,70,90,0.3)', 1.2);
      signTxt(c, px + pw / 2, py + ph * 0.42 - 3, 'SCUDERIA FULMINE ⚡', '#d94a4a', '#fff', 6.5);
      break;
    }
    case 'tuscan': house(c, b, { wall: b.wall || '#f0c98e', roof: '#cf6b43', frame: '#fff8ea', door: '#8a5a3c', shutters: b.shutters || '#6b9e5a', flowers: b.flowers || null }, night); break;
    case 'stonehouse': house(c, b, { wall: '#d9cdb8', roof: '#b9573c', frame: '#f5efe2', door: '#7a5238', stone: true, chimney: true, flowers: '#f2c14e' }, night); break;
    case 'lollohouse': {
      house(c, b, { wall: '#fbeedb', roof: '#e9935a', frame: '#fff', door: '#6fb38a', chimney: true, roofR: 16, sign: 'Lollo ♥', signSize: 7, flowers: '#ffd23f', roofFrac: 0.42 }, night);
      heart(c, px + pw / 2, py + 10, 6, night ? '#ffd97a' : '#f39ab0');
      break;
    }
    case 'station': {
      house(c, b, { wall: '#f3e6cc', roof: '#b94a43', frame: '#fff', door: '#6a4a3a', roofFrac: 0.42 }, night);
      clockFace(c, px + pw / 2, py + ph * 0.42 - 2, 7, 18, 18);
      signTxt(c, px + 34, py + ph * 0.42 - 2, 'STAZIONE', '#2f5f8f', '#fff', 6.5);
      break;
    }
    case 'pvshops': {
      const cols = ['#f2b45a', '#f0c98e', '#e98f5a', '#f5d78a'];
      for (let i = 0; i < b.h; i++) {
        const yy = py + i * 32;
        RR(c, px + 1, yy - 4, pw - 2, 32, 3, cols[(i + b.x) % 4]);
        RR(c, px - 1, yy - 10, pw + 2, 10, 3, '#cf6b43');
        RR(c, px + 9, yy + 8, 12, 10, 2, night ? '#ffd97a' : '#a9d6ea', true, 1);
      }
      break;
    }
    case 'duomo': {
      flatShadow(c, px + pw / 2, py + ph - 2, pw * 0.55);
      RR(c, px + 2, py + ph * 0.35, pw - 4, ph * 0.65, 3, '#f6f1e6');
      for (let i = 0; i < 6; i++) RR(c, px + 6 + i * ((pw - 18) / 5), py + ph * 0.38, 4, ph * 0.6, 1, i % 2 ? '#6f9f7f' : '#e9a9a0', false);
      roofTiles(c, px - 2, py + ph * 0.18, pw + 4, ph * 0.22, '#cf6b43', 6);
      const dx = px + pw / 2, dy = py + ph * 0.18;
      E(c, dx, dy, pw * 0.3, ph * 0.38, '#d9704a');
      for (let i = -2; i <= 2; i++) { c.beginPath(); c.ellipse(dx, dy, Math.abs(i) * pw * 0.07, ph * 0.38, 0, Math.PI, TAU); c.lineWidth = 1.6; c.strokeStyle = '#fff4e6'; c.stroke(); }
      RR(c, dx - 6, dy - ph * 0.38 - 10, 12, 12, 3, '#f6f1e6');
      poly(c, [dx - 3, dy - ph * 0.38 - 10, dx, dy - ph * 0.38 - 18, dx + 3, dy - ph * 0.38 - 10], '#f2c14e');
      fillE(c, dx, dy - ph * 0.38 + 6, pw * 0.12, 3, 'rgba(255,255,255,0.25)');
      const hm = (clockStr || '12:21').split(':').map(Number);
      clockFace(c, dx, py + ph * 0.55, 11, hm[0], hm[1], true);
      if (b.door) doorD(c, b.door.x * 32 + 6, py + ph - 24, 20, 24, '#7a4a2e');
      break;
    }
    case 'cathedral': case 'baptistery': {
      flatShadow(c, px + pw / 2, py + ph - 2, pw * 0.55);
      if (b.style === 'baptistery') {
        E(c, px + pw / 2, py + ph * 0.62, pw / 2 - 2, ph * 0.38, '#f6f1e6');
        for (let i = 0; i < 7; i++) { const ax = px + 10 + i * ((pw - 20) / 6); RR(c, ax - 3, py + ph * 0.62, 6, 14, [3, 3, 0, 0], '#ddd5c3', true, 0.8); }
        E(c, px + pw / 2, py + ph * 0.32, pw * 0.38, ph * 0.3, '#e6dfd0');
        E(c, px + pw / 2, py + ph * 0.18, pw * 0.2, ph * 0.16, '#d9704a');
      } else {
        RR(c, px + 2, py + ph * 0.35, pw - 4, ph * 0.65, 3, '#f6f1e6');
        for (let r = 0; r < 3; r++) for (let i = 0; i < Math.floor(pw / 14); i++) RR(c, px + 8 + i * 14, py + ph * 0.42 + r * 16, 8, 11, [4, 4, 0, 0], '#ddd5c3', true, 0.8);
        roofTiles(c, px - 2, py + ph * 0.05, pw + 4, ph * 0.34, '#b9b2a6', 6);
        E(c, px + pw * 0.6, py + ph * 0.18, pw * 0.13, ph * 0.18, '#e6dfd0');
        if (b.door) doorD(c, b.door.x * 32 + 6, py + ph - 24, 20, 24, '#8a5a3c');
      }
      break;
    }
    case 'tower': {
      const bx = px + pw / 2, by = py + ph - 2;
      flatShadow(c, bx + 8, by, pw * 0.5);
      c.save(); c.translate(bx, by); c.rotate(b.lean ?? 0.12);
      const tw = 56, th = 190;
      RR(c, -tw / 2, -th, tw, th, 10, '#f5f1e6');
      fillE(c, tw * 0.18, -th / 2, tw * 0.12, th * 0.45, 'rgba(210,200,180,0.5)');
      for (let r = 0; r < 7; r++) {
        const yy = -th + 22 + r * 24;
        line(c, -tw / 2, yy, tw / 2, yy, 'rgba(120,110,100,0.4)', 1.2);
        for (let i = 0; i < 4; i++) RR(c, -tw / 2 + 5 + i * 13, yy + 5, 8, 13, [4, 4, 0, 0], '#ddd5c3', true, 0.7);
      }
      RR(c, -tw * 0.36, -th - 22, tw * 0.72, 26, 8, '#f5f1e6');
      for (let i = 0; i < 3; i++) RR(c, -tw * 0.3 + 3 + i * 12, -th - 17, 8, 13, [4, 4, 0, 0], '#ddd5c3', true, 0.7);
      E(c, 0, -th - 22, tw * 0.36, 5, '#ece6d8');
      doorD(c, -8, -24, 16, 24, '#8a5a3c');
      c.restore();
      break;
    }
    case 'colosseum': {
      const cx = px + pw / 2, cy = py + ph * 0.48, rx = pw / 2, ry = ph * 0.42;
      flatShadow(c, cx, py + ph - 4, rx);
      E(c, cx, cy, rx, ry, '#e2c79a');
      E(c, cx, cy + 4, rx * 0.62, ry * 0.55, '#c9a06e');
      fillE(c, cx, cy + 6, rx * 0.5, ry * 0.4, '#d8b483');
      const fh = 44;
      c.beginPath(); c.ellipse(cx, cy, rx, ry, 0, 0, Math.PI); c.lineTo(cx - rx, cy + fh); c.ellipse(cx, cy + fh, rx, ry, 0, Math.PI, 0, true); c.closePath();
      c.fillStyle = '#e9d2a8'; c.fill(); c.lineWidth = 1.3; c.strokeStyle = INK; c.stroke();
      for (let r = 0; r < 3; r++) for (let i = 0; i < 14; i++) {
        const a = Math.PI * (0.06 + (i / 13) * 0.88);
        const ax = cx - Math.cos(a) * rx * 0.97, ay = cy + Math.sin(a) * ry + 6 + r * 13;
        RR(c, ax - 3.5, ay, 7, 9, [3.5, 3.5, 0, 0], night ? '#5a4a6a' : '#9c7c58', false);
      }
      poly(c, [cx - rx * 0.95, cy - ry * 0.25, cx - rx * 0.7, cy - ry * 0.75, cx - rx * 0.55, cy - ry * 0.95, cx - rx * 0.85, cy - ry * 0.75], '#e9d2a8', true, 1);
      break;
    }
    case 'fountain': {
      flatShadow(c, px + pw / 2, py + ph - 2, pw * 0.5);
      RR(c, px, py - 26, pw, 48, 4, '#efe3c8');
      for (let i = 0; i < 6; i++) RR(c, px + 6 + i * ((pw - 18) / 5), py - 22, 6, 42, 2, '#fbf3e0', true, 1);
      RR(c, px + pw / 2 - 14, py - 20, 28, 38, [14, 14, 0, 0], '#d7c7a4');
      statue(c, px + pw / 2, py + 14, 'figure', t);
      RR(c, px + 4, py + 26, pw - 8, ph - 30, 14, '#e8dcc3');
      RR(c, px + 10, py + 30, pw - 20, ph - 40, 10, '#7cc7e0', false);
      for (let i = 0; i < 5; i++) { const ph2 = t * 2 + i; c.beginPath(); c.arc(px + 22 + i * ((pw - 44) / 4), py + 44 + Math.sin(ph2) * 3, 4, Math.PI * 1.1, Math.PI * 1.9); c.lineWidth = 1.4; c.strokeStyle = '#d8f2fb'; c.stroke(); }
      for (let i = 0; i < 4; i++) { const sp = ((t * 0.7 + i * 0.25) % 1); star(c, px + 24 + hash(i, 1) * (pw - 48), py + 40 + hash(i, 2) * 20, 2 * (1 - sp), '#fff3b0'); }
      break;
    }
    case 'castle': {
      flatShadow(c, px + pw / 2, py + ph - 2, pw * 0.55);
      RR(c, px + 10, py + 10, pw - 20, ph - 10, 3, '#cdbfa6');
      for (let i = 0; i < (pw - 20) / 10; i++) RR(c, px + 10 + i * 10, py + 4, 6, 8, 1, '#d9ccb4', true, 0.9);
      for (const [tx2, ty2] of [[px + 12, py + 12], [px + pw - 12, py + 12], [px + 12, py + ph - 8], [px + pw - 12, py + ph - 8]]) {
        RR(c, tx2 - 11, ty2 - 30, 22, 34, 6, '#d9ccb4');
        for (let i = 0; i < 3; i++) RR(c, tx2 - 10 + i * 7.5, ty2 - 35, 5, 6, 1, '#e3d7c1', true, 0.8);
        RR(c, tx2 - 2, ty2 - 20, 4, 8, 2, night ? '#ffd97a' : '#5a4a52', false);
      }
      RR(c, px + pw / 2 - 12, py + ph - 26, 24, 26, [12, 12, 0, 0], '#6b4a3a');
      for (let i = 0; i < 3; i++) line(c, px + pw / 2 - 8 + i * 8, py + ph - 24, px + pw / 2 - 8 + i * 8, py + ph, '#3f2f2f', 1.2);
      break;
    }
    case 'clocktower': {
      const cx = px + pw / 2;
      flatShadow(c, cx, py + ph - 2, pw * 0.5);
      RR(c, cx - 20, py - 60, 40, ph + 60, 4, '#d9cdb8');
      for (let i = 0; i < 8; i++) RR(c, cx - 16 + hash(i, 3) * 24, py - 50 + i * 14, 8, 5, 2, '#cbbfa8', false);
      poly(c, [cx - 24, py - 60, cx, py - 90, cx + 24, py - 60], '#b9573c');
      const hm = (clockStr || '23:23').split(':').map(Number);
      clockFace(c, cx, py - 38, 13, hm[0], hm[1]);
      doorD(c, cx - 8, py + ph - 22, 16, 22, '#7a5238');
      break;
    }
    case 'gallery': house(c, b, { wall: '#f3e6cc', roof: '#cf6b43', frame: '#fff', door: '#6a4a3a', sign: 'GALLERIA', roofFrac: 0.42, shutters: '#a8c3a0' }, night); break;
    default: house(c, b, { wall: '#eee', roof: '#c66' }, night);
  }
}
