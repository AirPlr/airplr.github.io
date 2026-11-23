// Motore: mondo a tile, movimento, collisioni, entità, dialoghi, script async, HUD, salvataggio.
import { input } from './input.js';
import { Sound } from './audio.js';
import * as A from './art.js';
import { panel, button, text, wrap, font, COL, FONT } from './ui.js';
import * as MG from './minigames.js';
import * as SC from './scenes.js';

export const T = 32;
const SAVE_KEY = 'volo-di-carta-v1';
const cv = document.getElementById('game');
const ctx = cv.getContext('2d');
const lightCv = document.createElement('canvas');
const lctx = lightCv.getContext('2d');

export const G = {
  zones: {}, speakers: {}, story: {}, first: null,
  zone: null, zoneId: null, map: null, mw: 0, mh: 0, buildings: [], ents: [], zonePlaneIds: [],
  player: { x: 0, y: 0, dir: 'down', face: 1, moving: false, t: 0, pushT: 0 },
  flags: {}, inv: {}, got: {},
  dialog: null, mini: null, scene: null, menu: null, busy: false,
  waits: [], toasts: [], parts: [], emotes: [], weather: [],
  cam: { x: 0, y: 0 }, scale: 2, cssW: 0, cssH: 0, dpr: 1, u: 1,
  fade: 1, fadeTo: 1, fadeSpeed: 2, fadeCb: null,
  time: 0, playTime: 0, mode: 'boot', follower: null, trail: [], clock: '', prompt: null, saveT: 0, trigIn: new Set(),
};

// ---------------- utilità per gli script ----------------
const val = (v, e) => (typeof v === 'function' ? v(e) : v);
export const flag = (k) => !!G.flags[k];
export const setFlag = (k, v = true) => { G.flags[k] = v; };
export const has = (k) => !!G.inv[k];
export const give = (k) => { G.inv[k] = true; };
export const take = (k) => { delete G.inv[k]; };
export const ent = (id) => G.ents.find((e) => e.id === id);
export const wait = (s) => new Promise((r) => G.waits.push({ t: s, r }));
export function say(who, txt, opts = {}) {
  return new Promise((r) => { G.dialog = { who, text: txt, shown: 0, r, opts, sel: 0, rects: [] }; });
}
export const choice = (who, txt, choices) => say(who, txt, { choices });
export const note = (txt) => say('note', txt, { note: true });
export function toast(txt) { G.toasts.push({ text: txt, t: 0, life: 2.8 }); }
export function fadeOut(s = 0.45) { return new Promise((r) => { G.fadeTo = 1; G.fadeSpeed = 1 / s; G.fadeCb = r; }); }
export function fadeIn(s = 0.45) { return new Promise((r) => { G.fadeTo = 0; G.fadeSpeed = 1 / s; G.fadeCb = r; }); }
export function mini(kind, opts) {
  const M = { rhythm: MG.Rhythm, memory: MG.Memory, pet: MG.Petting, clock: MG.ClockGame, flight: MG.Flight }[kind];
  return new Promise((r) => { G.mini = new M(opts); G.mini.resolve = r; });
}
export function scene(sc) { return new Promise((r) => { G.scene = sc; sc.resolve = r; }); }
export function emote(target, kind, dur = 1.6) { G.emotes.push({ target: target === 'player' ? G.player : target, kind, t: 0, dur }); }
export function music(n) { Sound.music(n); }
export function sfx(n) { Sound.sfx(n); }
export function setClock(s) { G.clock = s; }
export function moveEnt(e, tx, ty, speed = 70) {
  return new Promise((r) => { e.path = { x: tx * T + 16, y: ty * T + 28, speed, r }; });
}
export function movePlayer(tx, ty, speed = 75) { return moveEnt(G.player, tx, ty, speed); }
export function facePlayer(e) {
  e.face = G.player.x < e.x ? -1 : 1;
  const dx = G.player.x - e.x, dy = G.player.y - e.y;
  e.dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : (dy < 0 ? 'up' : 'down');
}
export function lookAt(a, b) {
  const p = a === 'player' ? G.player : a;
  const dx = b.x - p.x, dy = b.y - p.y;
  p.face = dx < 0 ? -1 : 1;
  p.dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : (dy < 0 ? 'up' : 'down');
}
export function burst(x, y, kind = 'hearts', n = 10) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, sp = 20 + Math.random() * 50;
    G.parts.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 40, life: 0, max: 0.9 + Math.random() * 0.6, kind, size: 2.5 + Math.random() * 2.5, rot: Math.random() * 6 });
  }
}
export function planesGot(zoneId = G.zoneId) {
  const ids = zoneId === G.zoneId ? G.zonePlaneIds : (G.zones[zoneId].ents().filter((e) => e.kind === 'plane').map((e) => e.id));
  return ids.filter((id) => G.got[id]).length;
}
export const planesNeeded = () => G.zonePlaneIds.length;
export function glyphCount() { return Object.keys(G.got).filter((k) => k.startsWith('gl_')).length; }
export function spawn(def) { return addEnt(def); }
export function resetPuzzle(group) {
  for (const e of G.ents) if (e.kind === 'block' && e.group === group) { e.tx = e.homeT.tx; e.ty = e.homeT.ty; e.x = e.tx * T + 16; e.y = e.ty * T + 28; e.slide = null; }
  const rp = G.zone.resets && G.zone.resets[group];
  if (rp) { G.player.x = rp.x * T + 16; G.player.y = rp.y * T + 28; G.player.dir = rp.dir || 'down'; }
  checkPlates(true);
  Sound.sfx('gate');
}
export function run(fn) {
  if (G.busy) return false;
  G.busy = true;
  (async () => {
    try { await fn(); } catch (err) { console.error(err); }
    G.busy = false; G.dialog = null;
    saveGame();
  })();
  return true;
}
export async function travel(to, info = {}) {
  await fadeOut(0.6);
  G.mode = 'scene';
  await scene(new SC.Travel(info.from || G.zoneId, to, info));
  loadZone(to);
  G.mode = 'play';
  saveGame();
  await fadeIn(0.6);
  if (G.zone.onEnter) await G.zone.onEnter();
}
export async function playScene(sc) {
  const prev = G.mode;
  G.mode = 'scene';
  const r = await scene(sc);
  G.mode = prev;
  return r;
}
export async function ending() {
  await fadeOut(1.2);
  G.mode = 'scene';
  const tot = Object.values(G.zones).reduce((n, z) => n + z.ents().filter((e) => e.kind === 'plane').length, 0);
  const planes = Object.keys(G.got).filter((k) => k.includes('_p')).length;
  const secs = Math.floor(G.playTime);
  const stats = { planes, planesTot: tot, glyphs: glyphCount(), glyphsTot: 12, time: `${Math.floor(secs / 60)} min ${String(secs % 60).padStart(2, '0')} s` };
  setFlag('finished');
  saveGame(true);
  G.fade = 0; G.fadeTo = 0;
  await scene(new SC.Letter(G.story.letter, stats));
  try { localStorage.removeItem(SAVE_KEY); } catch (_) { /* ignore */ }
  toTitle();
}

// ---------------- salvataggio ----------------
function saveGame(force) {
  if (!force && (G.mode !== 'play' || G.busy)) return;
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({ v: 1, zone: G.zoneId, x: G.player.x, y: G.player.y, dir: G.player.dir, flags: G.flags, inv: G.inv, got: G.got, playTime: G.playTime }));
  } catch (_) { /* ignore */ }
}
function loadSave() {
  try { const s = JSON.parse(localStorage.getItem(SAVE_KEY)); return s && s.v === 1 && G.zones[s.zone] ? s : null; } catch (_) { return null; }
}

// ---------------- zone ed entità ----------------
function addEnt(d) {
  const e = { ...d };
  if (e.tx != null) { e.x = e.tx * T + 16; e.y = e.ty * T + 28; }
  e.face = e.face || 1; e.dir = e.dir || 'down'; e.t = Math.random() * 10; e.seed = Math.random() * 3;
  e.home = { x: e.x, y: e.y };
  if (e.kind === 'block') e.homeT = { tx: e.tx, ty: e.ty };
  if ((e.kind === 'plane' || e.kind === 'glyph' || e.kind === 'item') && G.got[e.id]) return null;
  if (e.kind === 'glyph' && !e.id.startsWith('gl_')) e.id = 'gl_' + e.id;
  G.ents.push(e);
  return e;
}
function loadZone(id, pos) {
  const z = G.zones[id];
  G.zone = z; G.zoneId = id;
  G.map = z.map(); G.mh = G.map.length; G.mw = G.map[0].length;
  G.buildings = (z.buildings || []).map((b) => ({ ...b }));
  G.ents = []; G.parts = []; G.emotes = []; G.trigIn = new Set();
  const defs = z.ents();
  G.zonePlaneIds = defs.filter((d) => d.kind === 'plane').map((d) => d.id);
  for (const d of defs) addEnt(d);
  for (const b of G.buildings) if (b.door && b.talk) addEnt({ id: 'door_' + b.x + '_' + b.y, kind: 'door', x: b.door.x * T + 16, y: (b.door.y + 1) * T + 6, talk: b.talk, range: 24 });
  // ripristina enigmi già risolti
  const groups = {};
  for (const e of G.ents) if (e.kind === 'plate') (groups[e.group] ||= []).push(e);
  for (const g in groups) {
    if (!flag(g + '_done')) continue;
    const blocks = G.ents.filter((e) => e.kind === 'block' && e.group === g);
    groups[g].forEach((p, i) => { const b = blocks[i]; if (b) { b.tx = p.tx; b.ty = p.ty; b.x = p.x; b.y = p.y; } });
  }
  for (const e of G.ents) if (e.kind === 'sunflower' && flag(e.group + '_done')) e.rot = 0;
  checkPlates(true);
  const sp = pos || { x: z.spawn.x * T + 16, y: z.spawn.y * T + 28, dir: z.spawn.dir };
  G.player.x = sp.x; G.player.y = sp.y; G.player.dir = sp.dir || 'down'; G.player.path = null; G.player.moving = false;
  G.clock = z.time;
  G.trail = [];
  G.follower = flag('mia_joined') ? { art: 'mia', x: G.player.x - 18, y: G.player.y, face: 1, moving: false, t: 0 } : null;
  G.weather = [];
  Sound.music(z.music);
  snapCam();
}
function isActive(e) { return !e.gone && (e.cond ? !!e.cond() : true); }
function tileSolid(tx, ty) {
  if (tx < 0 || ty < 0 || tx >= G.mw || ty >= G.mh) return true;
  return A.SOLID.has(G.map[ty][tx]);
}
function entRect(e) {
  if (e.kind === 'block' || e.grid) return { x: e.tx * T + 1, y: e.ty * T + 1, w: T - 2, h: T - 2 };
  const bw = e.bw || 11, bh = e.bh || 11;
  return { x: e.x - bw, y: e.y - bh, w: bw * 2, h: bh + 3 };
}
function entSolid(e) {
  if (!isActive(e)) return false;
  if (e.solid !== undefined) return !!val(e.solid, e);
  return ['npc', 'block', 'sign', 'deco', 'sunflower', 'lamp'].includes(e.kind);
}
function overlap(a, b) { return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; }
function blockedRect(r, ignore) {
  const x0 = Math.floor(r.x / T), x1 = Math.floor((r.x + r.w - 0.01) / T), y0 = Math.floor(r.y / T), y1 = Math.floor((r.y + r.h - 0.01) / T);
  for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) if (tileSolid(tx, ty)) return { tile: true };
  for (const b of G.buildings) {
    if (b.walk) continue;
    if (overlap(r, { x: b.x * T, y: b.y * T, w: b.w * T, h: b.h * T })) return { building: b };
  }
  for (const e of G.ents) {
    if (e === ignore || !entSolid(e)) continue;
    if (overlap(r, entRect(e))) return { ent: e };
  }
  return null;
}
const PRECT = (x, y) => ({ x: x - 7, y: y - 8, w: 14, h: 8 });

function checkPlates(silent) {
  const groups = {};
  for (const p of G.ents) if (p.kind === 'plate') (groups[p.group] ||= []).push(p);
  for (const g in groups) {
    let all = true;
    for (const p of groups[g]) {
      p.pressed = G.ents.some((b) => b.kind === 'block' && !b.gone && b.tx === p.tx && b.ty === p.ty && !b.slide);
      if (!p.pressed) all = false;
    }
    if (all && !flag(g + '_done') && !silent) {
      setFlag(g + '_done');
      Sound.sfx('success');
      if (G.zone.onSolve) setTimeout(() => run(() => G.zone.onSolve(g)), 350);
    }
  }
}
function tryPush(e, dx, dy) {
  const nx = e.tx + dx, ny = e.ty + dy;
  if (tileSolid(nx, ny)) return false;
  const r = { x: nx * T + 2, y: ny * T + 2, w: T - 4, h: T - 4 };
  if (blockedRect(r, e)) return false;
  if (overlap(r, PRECT(G.player.x, G.player.y))) return false;
  if (G.follower && overlap(r, PRECT(G.follower.x, G.follower.y))) { G.follower.x = G.player.x; G.follower.y = G.player.y; }
  e.slide = { fx: e.x, fy: e.y, t: 0 };
  e.tx = nx; e.ty = ny;
  Sound.sfx(e.style === 'sheep' ? 'baa' : 'push');
  return true;
}
export function rotateFlower(e) {
  const group = G.ents.filter((s) => s.kind === 'sunflower' && s.group === e.group);
  const turn = (s) => { s.rot = (s.rot + 1) % 4; s.spin = 0.25; };
  turn(e);
  for (const id of e.link || []) { const s = group.find((q) => q.sid === id); if (s) turn(s); }
  Sound.sfx('tick'); Sound.sfx('move');
  if (group.every((s) => s.rot === 0) && !flag(e.group + '_done')) {
    setFlag(e.group + '_done');
    Sound.sfx('success');
    return true;
  }
  return false;
}

// ---------------- dimensioni ----------------
function resize() {
  const w = window.innerWidth, h = window.innerHeight, dpr = Math.min(window.devicePixelRatio || 1, 2.5);
  cv.style.width = w + 'px'; cv.style.height = h + 'px';
  cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
  lightCv.width = cv.width; lightCv.height = cv.height;
  G.cssW = w; G.cssH = h; G.dpr = dpr;
  G.scale = Math.max(1.1, Math.min(4, Math.min(w, h) / (T * 9.5)));
  G.u = Math.max(0.82, Math.min(1.4, Math.min(w, h) / 560));
}
function snapCam() {
  const vw = G.cssW / G.scale, vh = G.cssH / G.scale;
  G.cam.x = camClamp(G.player.x - vw / 2, G.mw * T, vw);
  G.cam.y = camClamp(G.player.y - 16 - vh / 2, G.mh * T, vh);
}
function camClamp(v, size, view) { return size <= view ? (size - view) / 2 : Math.max(0, Math.min(size - view, v)); }

// ---------------- update ----------------
function update(dt) {
  G.time += dt;
  if (G.mode === 'play' && !G.menu) G.playTime += dt;
  for (const w of G.waits) w.t -= dt;
  const ready = G.waits.filter((w) => w.t <= 0);
  G.waits = G.waits.filter((w) => w.t > 0);
  ready.forEach((w) => w.r());
  if (G.fade !== G.fadeTo) {
    const d = G.fadeSpeed * dt;
    G.fade = G.fade < G.fadeTo ? Math.min(G.fadeTo, G.fade + d) : Math.max(G.fadeTo, G.fade - d);
    if (G.fade === G.fadeTo && G.fadeCb) { const cb = G.fadeCb; G.fadeCb = null; cb(); }
  } else if (G.fadeCb) { const cb = G.fadeCb; G.fadeCb = null; cb(); }
  for (const tt of G.toasts) tt.t += dt;
  G.toasts = G.toasts.filter((tt) => tt.t < tt.life);
  for (const p of G.parts) { p.life += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += (p.kind === 'hearts' ? -10 : 60) * dt; p.vx *= 0.98; }
  G.parts = G.parts.filter((p) => p.life < p.max);
  for (const em of G.emotes) em.t += dt;
  G.emotes = G.emotes.filter((em) => em.t < em.dur);

  if (input.pressed('mute')) Sound.toggleMute();

  if (G.scene) {
    input.joyEnabled = false; input.actionBtn = null;
    G.scene.update(dt, input);
    if (G.scene.done) { const sc = G.scene; G.scene = null; sc.resolve && sc.resolve(sc.result); }
    return;
  }
  if (G.mode !== 'play') return;

  if (G.menu) { updateMenu(); return; }
  if (hudTaps()) return;
  if (input.pressed('menu') && !G.mini && !G.dialog) { G.menu = { sel: 0, rects: [] }; Sound.sfx('select'); return; }

  if (G.mini) {
    input.joyEnabled = false; input.actionBtn = null;
    G.mini.update(dt, input);
    if (G.mini.done) { const m = G.mini; G.mini = null; m.resolve(m.result); }
    updateWorld(dt, false);
    return;
  }
  if (G.dialog) {
    input.joyEnabled = false;
    updateDialog(dt);
    updateWorld(dt, false);
    return;
  }
  const control = !G.busy && G.fade < 0.05;
  input.joyEnabled = control;
  updateWorld(dt, control);
  if (control) {
    pickups();
    triggers();
    if (input.pressed('action') && G.prompt) {
      const e = G.prompt;
      run(async () => {
        if ((e.kind === 'npc') && !e.noTurn) facePlayer(e);
        lookAt('player', e);
        await e.talk(e);
      });
    }
  }
  G.saveT += dt;
  if (G.saveT > 8) { G.saveT = 0; saveGame(); }
}

function updateWorld(dt, control) {
  const p = G.player;
  p.t += dt;
  // percorsi scriptati (giocatore ed entità)
  for (const e of [p, ...G.ents]) {
    if (!e.path) continue;
    const dx = e.path.x - e.x, dy = e.path.y - e.y, d = Math.hypot(dx, dy);
    const st = e.path.speed * dt;
    if (d <= st) { e.x = e.path.x; e.y = e.path.y; const r = e.path.r; e.path = null; e.moving = false; r && r(); }
    else {
      e.x += (dx / d) * st; e.y += (dy / d) * st; e.moving = true;
      if (Math.abs(dx) > 0.5) e.face = dx < 0 ? -1 : 1;
      e.dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : (dy < 0 ? 'up' : 'down');
    }
  }
  // controllo giocatore
  if (control && !p.path) {
    const d = input.dir();
    const mag = Math.hypot(d.x, d.y);
    p.moving = mag > 0.15;
    if (p.moving) {
      const sp = 96 * Math.min(1, mag * 1.2);
      if (Math.abs(d.x) > Math.abs(d.y)) { p.dir = d.x < 0 ? 'left' : 'right'; } else { p.dir = d.y < 0 ? 'up' : 'down'; }
      if (Math.abs(d.x) > 0.1) p.face = d.x < 0 ? -1 : 1;
      moveAxis(p, d.x * sp * dt, 0, d);
      moveAxis(p, 0, d.y * sp * dt, d);
    } else p.pushT = 0;
  } else if (!p.path) p.moving = false;
  // scia per Mia
  if (p.moving) {
    const last = G.trail[G.trail.length - 1];
    if (!last || Math.hypot(last.x - p.x, last.y - p.y) > 3) { G.trail.push({ x: p.x, y: p.y }); if (G.trail.length > 60) G.trail.shift(); }
  }
  const f = G.follower;
  if (f) {
    f.t += dt;
    const tgt = G.trail.length > 9 ? G.trail[G.trail.length - 9] : null;
    if (tgt && !f.path) {
      const dx = tgt.x - f.x, dy = tgt.y - f.y, d = Math.hypot(dx, dy);
      if (d > 2) { const st = Math.min(d, 110 * dt); f.x += dx / d * st; f.y += dy / d * st; f.moving = true; if (Math.abs(dx) > 0.3) f.face = dx < 0 ? -1 : 1; } else f.moving = false;
    } else if (!f.path) f.moving = false;
    if (Math.hypot(f.x - p.x, f.y - p.y) > 120) { f.x = p.x - 10; f.y = p.y; }
  }
  // entità
  for (const e of G.ents) {
    e.t += dt;
    if (e.slide) {
      e.slide.t += dt / 0.18;
      const k = Math.min(1, e.slide.t);
      const tx = e.tx * T + 16, ty = e.ty * T + 28;
      e.x = e.slide.fx + (tx - e.slide.fx) * k; e.y = e.slide.fy + (ty - e.slide.fy) * k;
      if (k >= 1) { e.slide = null; checkPlates(); }
    }
    if (e.spin) e.spin = Math.max(0, e.spin - dt);
    if (e.wander && !e.path && isActive(e) && !G.busy) {
      e.wt = (e.wt ?? Math.random() * 3) - dt;
      if (e.wt <= 0) {
        e.wt = 2 + Math.random() * 4;
        const a = Math.random() * Math.PI * 2, r = Math.random() * e.wander * T;
        const nx = e.home.x + Math.cos(a) * r, ny = e.home.y + Math.sin(a) * r;
        const rr = { x: nx - 8, y: ny - 8, w: 16, h: 8 };
        if (!blockedRect(rr, e) && !overlap(rr, PRECT(p.x, p.y))) e.path = { x: nx, y: ny, speed: e.speed || 26, r: null };
      }
    }
    if (e.butterfly) { e.x = e.home.x + Math.sin(e.t * 0.6) * 40 + Math.sin(e.t * 1.7) * 10; e.y = e.home.y + Math.cos(e.t * 0.45) * 26; }
  }
  // prompt interazione
  G.prompt = null;
  if (control) {
    const fv = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[p.dir];
    const px = p.x + fv[0] * 15, py = p.y - 6 + fv[1] * 14;
    let best = null, bd = 1e9;
    for (const e of G.ents) {
      if (!e.talk || !isActive(e)) continue;
      const ey = e.kind === 'door' ? e.y - 8 : e.y - 8;
      const d1 = Math.hypot(e.x - px, ey - py), d2 = Math.hypot(e.x - p.x, ey - (p.y - 6));
      const rng = e.range || 22;
      const d = Math.min(d1, d2 + 6);
      if (d < rng + (e.big || 0) && d < bd) { bd = d; best = e; }
    }
    G.prompt = best;
  }
  // camera
  const vw = G.cssW / G.scale, vh = G.cssH / G.scale;
  const tx = camClamp(p.x - vw / 2, G.mw * T, vw), ty = camClamp(p.y - 16 - vh / 2, G.mh * T, vh);
  const k = 1 - Math.pow(0.0015, dt);
  G.cam.x += (tx - G.cam.x) * k; G.cam.y += (ty - G.cam.y) * k;
  // meteo
  updateWeather(dt, vw, vh);
}

function moveAxis(p, mx, my, d) {
  if (!mx && !my) return;
  const nx = p.x + mx, ny = p.y + my;
  const hit = blockedRect(PRECT(nx, ny), null);
  if (!hit) { p.x = nx; p.y = ny; return; }
  // spinta blocchi
  const horiz = Math.abs(d.x) > Math.abs(d.y);
  if (hit.ent && hit.ent.kind === 'block' && ((mx && horiz) || (my && !horiz))) {
    const dir = mx ? [Math.sign(mx), 0] : [0, Math.sign(my)];
    if (p.pushDir && (p.pushDir[0] !== dir[0] || p.pushDir[1] !== dir[1])) p.pushT = 0;
    p.pushDir = dir;
    p.pushT += 1 / 60;
    if (p.pushT > 0.16 && !hit.ent.slide) { p.pushT = 0; tryPush(hit.ent, dir[0], dir[1]); }
    return;
  }
  // scivola attorno agli spigoli
  for (let k = 1; k <= 9; k++) {
    for (const s of [-1, 1]) {
      const ox = my ? s * k : 0, oy = mx ? s * k : 0;
      if (!blockedRect(PRECT(nx + ox, ny + oy), null) && !blockedRect(PRECT(p.x + ox, p.y + oy), null)) {
        const step = Math.min(k, 1.6);
        p.x += my ? s * step : 0; p.y += mx ? s * step : 0;
        return;
      }
    }
  }
}

function pickups() {
  const p = G.player;
  for (const e of G.ents) {
    if (!['plane', 'glyph', 'item'].includes(e.kind) || !isActive(e)) continue;
    if (Math.hypot(e.x - p.x, e.y - p.y) > 20) continue;
    G.got[e.id] = true; e.gone = true;
    if (e.kind === 'plane') {
      Sound.sfx('pickup'); burst(e.x, e.y - 14, 'sparkle', 12);
      run(async () => {
        await note(G.story.planes[e.msg] || '...');
        const n = planesGot(), tot = planesNeeded();
        toast(n >= tot ? `Tutti gli aeroplanini di ${G.zone.name}! ✈` : `Aeroplanini: ${n} / ${tot}`);
        if (n >= tot && G.zone.onAllPlanes) await G.zone.onAllPlanes();
      });
    } else if (e.kind === 'glyph') {
      Sound.sfx('glyph'); burst(e.x, e.y - 14, 'sparkle', 14);
      toast(`Lettera ${e.ch} trovata! (${glyphCount()} / 12)`);
    } else {
      Sound.sfx('pickup'); burst(e.x, e.y - 12, 'sparkle', 10);
      give(e.item);
      toast(`Hai trovato: ${e.label}`);
      if (e.onPick) run(() => e.onPick(e));
    }
    saveGame();
    return;
  }
}
function triggers() {
  const z = G.zone;
  if (!z.triggers) return;
  const ptx = Math.floor(G.player.x / T), pty = Math.floor((G.player.y - 4) / T);
  for (const [i, tr] of z.triggers.entries()) {
    const inside = ptx >= tr.x && ptx < tr.x + (tr.w || 1) && pty >= tr.y && pty < tr.y + (tr.h || 1);
    const key = i;
    if (inside && !G.trigIn.has(key)) {
      G.trigIn.add(key);
      if (tr.once && flag('trig_' + tr.once)) continue;
      if (tr.cond && !tr.cond()) continue;
      if (tr.once) setFlag('trig_' + tr.once);
      run(() => tr.run());
      return;
    }
    if (!inside) G.trigIn.delete(key);
  }
}

// ---------------- dialoghi ----------------
function dialogTapped() {
  if (!input.taps.length) return false;
  input.taps.length = 0;
  return true;
}
function updateDialog(dt) {
  const d = G.dialog;
  const len = d.text.length;
  const before = Math.floor(d.shown);
  d.shown = Math.min(len, d.shown + dt * 52);
  if (Math.floor(d.shown) !== before && Math.floor(d.shown) % 3 === 0 && !d.opts.note) {
    const sp = G.speakers[d.who];
    Sound.sfx('blip', sp ? sp.pitch || 0 : -0.5);
  }
  const full = d.shown >= len;
  if (d.opts.choices && full) {
    const n = d.opts.choices.length;
    if (input.pressed('up')) { d.sel = (d.sel + n - 1) % n; Sound.sfx('move'); }
    if (input.pressed('down')) { d.sel = (d.sel + 1) % n; Sound.sfx('move'); }
    for (let i = 0; i < d.rects.length; i++) if (input.takeTap(d.rects[i])) { d.sel = i; finishDialog(i); return; }
    if (input.pressed('action')) { finishDialog(d.sel); return; }
    input.taps.length = 0;
    return;
  }
  if (input.pressed('action') || dialogTapped()) {
    if (!full) d.shown = len;
    else finishDialog();
  }
}
function finishDialog(v) {
  const d = G.dialog;
  G.dialog = null;
  Sound.sfx('select');
  d.r(v);
}

// ---------------- menu ----------------
function menuItems() {
  return [
    ['resume', 'Riprendi'],
    ['mute', Sound.muted ? 'Musica: spenta' : 'Musica: accesa'],
    ['reset', 'Ricomincia enigma'],
    ['help', 'Comandi'],
    ['title', 'Torna al titolo'],
  ];
}
function updateMenu() {
  const m = G.menu, items = menuItems();
  if (input.pressed('menu') || input.pressed('back')) { G.menu = null; return; }
  if (m.help) { if (input.pressed('action') || input.anyTap()) m.help = false; return; }
  if (input.pressed('up')) { m.sel = (m.sel + items.length - 1) % items.length; Sound.sfx('move'); }
  if (input.pressed('down')) { m.sel = (m.sel + 1) % items.length; Sound.sfx('move'); }
  let pick = input.pressed('action') ? m.sel : -1;
  m.rects.forEach((r, i) => { if (input.takeTap(r)) pick = i; });
  if (pick < 0) return;
  Sound.sfx('select');
  const id = items[pick][0];
  if (id === 'resume') G.menu = null;
  else if (id === 'mute') Sound.toggleMute();
  else if (id === 'help') m.help = true;
  else if (id === 'reset') {
    G.menu = null;
    if (G.busy) return;
    const groups = new Set(G.ents.filter((e) => e.kind === 'block' && !flag(e.group + '_done')).map((e) => e.group));
    if (groups.size) groups.forEach((g) => resetPuzzle(g)); else toast('Nessun enigma da ricominciare qui');
  } else if (id === 'title') { saveGame(); G.menu = null; toTitle(); }
}
function hudRects() {
  const u = G.u, r = 20 * u, pad = 12;
  return {
    menu: { x: G.cssW - pad - r * 2, y: pad, w: r * 2, h: r * 2 },
    mute: { x: G.cssW - pad - r * 4 - 10 * u, y: pad, w: r * 2, h: r * 2 },
  };
}
function hudTaps() {
  if (G.mini || G.scene) return false;
  const h = hudRects();
  if (input.takeTap(h.menu)) { G.menu = { sel: 0, rects: [] }; Sound.sfx('select'); return true; }
  if (input.takeTap(h.mute)) { Sound.toggleMute(); return true; }
  return false;
}

// ---------------- meteo ----------------
function updateWeather(dt, vw, vh) {
  const kind = G.zone.weather;
  if (!kind) return;
  const target = { rain: 70, petals: 22, fireflies: 26, motes: 24, leaves: 16, snow: 40 }[kind] || 0;
  while (G.weather.length < target) {
    G.weather.push({ x: G.cam.x + Math.random() * vw, y: G.cam.y + Math.random() * vh, s: Math.random(), ph: Math.random() * 6 });
  }
  for (const w of G.weather) {
    if (kind === 'rain') { w.y += (260 + w.s * 120) * dt; w.x -= 30 * dt; }
    else if (kind === 'petals' || kind === 'leaves') { w.y += (18 + w.s * 18) * dt; w.x += Math.sin(G.time + w.ph) * 20 * dt + 8 * dt; }
    else if (kind === 'fireflies' || kind === 'motes') { w.x += Math.sin(G.time * 0.7 + w.ph) * 12 * dt; w.y += Math.cos(G.time * 0.5 + w.ph * 2) * 10 * dt; }
    if (w.y > G.cam.y + vh + 10) { w.y = G.cam.y - 10; w.x = G.cam.x + Math.random() * vw; }
    if (w.y < G.cam.y - 20) w.y = G.cam.y + vh;
    if (w.x < G.cam.x - 20) w.x = G.cam.x + vw + 10;
    if (w.x > G.cam.x + vw + 20) w.x = G.cam.x - 10;
  }
}

// ---------------- disegno ----------------
function draw() {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const W = G.cssW, H = G.cssH, u = G.u;
  if (G.zone && G.mode === 'play') drawWorld();
  else { ctx.fillStyle = '#2a1e2c'; ctx.fillRect(0, 0, cv.width, cv.height); }
  ctx.setTransform(G.dpr, 0, 0, G.dpr, 0, 0);
  if (G.mode === 'play' && G.zone) {
    drawHUD(W, H, u);
    if (G.dialog) drawDialog(W, H, u);
    if (G.mini) G.mini.draw(ctx, W, H, u);
    drawToasts(W, H, u);
    if (G.menu) drawMenu(W, H, u);
    if (input.touchUsed && !G.mini && !G.menu && !G.dialog) drawTouch(W, H, u);
    else input.actionBtn = null;
  }
  if (G.scene) { ctx.setTransform(G.dpr, 0, 0, G.dpr, 0, 0); G.scene.draw(ctx, W, H, u, input.touchUsed); }
  if (G.fade > 0) { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = `rgba(42,28,46,${G.fade})`; ctx.fillRect(0, 0, cv.width, cv.height); }
}

function drawWorld() {
  const z = G.zone, pal = z.pal, s = G.scale * G.dpr;
  const vw = G.cssW / G.scale, vh = G.cssH / G.scale;
  const cx = Math.round(G.cam.x * s) / s, cy = Math.round(G.cam.y * s) / s;
  ctx.setTransform(s, 0, 0, s, -cx * s, -cy * s);
  ctx.fillStyle = pal.out || pal.grass; ctx.fillRect(cx - 4, cy - 4, vw + 8, vh + 8);
  ctx.fillStyle = pal.grass; ctx.fillRect(0, 0, G.mw * T, G.mh * T);
  const x0 = Math.max(0, Math.floor(cx / T) - 1), x1 = Math.min(G.mw - 1, Math.ceil((cx + vw) / T) + 1);
  const y0 = Math.max(0, Math.floor(cy / T) - 1), y1 = Math.min(G.mh - 1, Math.ceil((cy + vh) / T) + 4);
  const t = G.time;
  for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) A.drawGround(ctx, G.map, tx, ty, pal, t);
  // oggetti a terra
  for (const e of G.ents) {
    if (!isActive(e)) continue;
    if (e.kind === 'plate') A.plate(ctx, e.x, e.y, e.pressed, t, e.style);
    else if (e.kind === 'deco' && e.art === 'rug') A.rug(ctx, e.x, e.y);
  }
  // lista ordinata per profondità
  const list = [];
  for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
    const ch = G.map[ty][tx];
    if (A.TALL.has(ch)) list.push({ y: (ty + 1) * T - 1, tx, ty, k: 0 });
  }
  for (const b of G.buildings) {
    if ((b.x + b.w) * T < cx - 40 || b.x * T > cx + vw + 40 || (b.y + b.h) * T < cy - 20 || (b.y - 7) * T > cy + vh) continue;
    list.push({ y: (b.y + b.h) * T - 2, b, k: 1 });
  }
  for (const e of G.ents) {
    if (!isActive(e) || e.kind === 'plate' || e.kind === 'door' || (e.kind === 'deco' && e.art === 'rug')) continue;
    if (e.x < cx - 80 || e.x > cx + vw + 80 || e.y < cy - 40 || e.y > cy + vh + 120) continue;
    list.push({ y: e.y + (e.zb || 0), e, k: 2 });
  }
  if (G.follower) list.push({ y: G.follower.y, f: G.follower, k: 3 });
  if (!G.hidePlayer) list.push({ y: G.player.y, p: true, k: 4 });
  list.sort((a, b) => a.y - b.y);
  for (const it of list) {
    if (it.k === 0) A.drawTall(ctx, G.map, it.tx, it.ty, pal, t);
    else if (it.k === 1) A.drawBuilding(ctx, it.b, t, z.night, G.clock);
    else if (it.k === 2) drawEnt(it.e, t);
    else if (it.k === 3) A.actor(ctx, 'mia', it.f.x, it.f.y, { t: it.f.t, face: it.f.face, moving: it.f.moving, happy: true });
    else A.actor(ctx, 'geo', G.player.x, G.player.y, { t: G.player.t, dir: G.player.dir, moving: G.player.moving, expr: G.player.expr });
  }
  // particelle
  for (const p of G.parts) {
    const a = 1 - p.life / p.max;
    ctx.globalAlpha = Math.max(0, a);
    if (p.kind === 'hearts') A.heart(ctx, p.x, p.y, p.size, '#f06d8f', false);
    else if (p.kind === 'petals') A.fillE(ctx, p.x, p.y, p.size, p.size * 0.5, '#ffd23f', p.rot + p.life * 4);
    else A.star(ctx, p.x, p.y, p.size * 1.2, '#fff3a8');
    ctx.globalAlpha = 1;
  }
  // emote e prompt
  for (const em of G.emotes) drawEmote(em.target, em.kind, em.t, em.dur);
  if (G.prompt && !G.busy) {
    const e = G.prompt, bob = Math.sin(t * 5) * 1.5;
    const top = e.kind === 'door' ? e.y - 30 : e.y - (e.ph || 40);
    bubble(e.x, top + bob, '…');
  }
  // meteo in coordinate mondo
  drawWeather(z.weather, t);
  drawLighting(z, s, cx, cy);
}

function bubble(x, y, str, col = '#fff') {
  A.RR(ctx, x - 8, y - 9, 16, 13, 6, col, true, 1.1);
  ctx.beginPath(); ctx.moveTo(x - 2.5, y + 3.5); ctx.lineTo(x, y + 7); ctx.lineTo(x + 2.5, y + 3.5); ctx.fillStyle = col; ctx.fill();
  ctx.font = `700 9px ${FONT}`; ctx.fillStyle = A.INK; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y - 2.5);
}
function drawEmote(tg, kind, t, dur) {
  const x = tg.x, y = tg.y - (tg.ph || 44) - Math.min(1, t * 6) * 4;
  ctx.globalAlpha = Math.min(1, (dur - t) * 4);
  if (kind === 'heart') { A.RR(ctx, x - 9, y - 10, 18, 15, 7, '#fff', true, 1.1); A.heart(ctx, x, y - 2, 4.2, '#f06d8f', false); }
  else bubble(x, y, kind);
  ctx.globalAlpha = 1;
}
function drawEnt(e, t) {
  const tt = t + e.t * 0;
  const o = { t: e.t, dir: e.dir, face: e.face, moving: e.moving, seed: e.seed, happy: e.happy, sleep: e.sleep, scale: e.scale, alpha: e.alpha, expr: e.expr, flying: e.flying };
  switch (e.kind) {
    case 'npc': case 'critter': A.actor(ctx, e.art, e.x, e.y, o); break;
    case 'plane': A.paperPlane(ctx, e.x, e.y, tt + e.seed); break;
    case 'glyph': A.glyph(ctx, e.x, e.y, tt, e.ch); break;
    case 'item': A.item(ctx, e.item, e.x, e.y, tt); break;
    case 'block': A.crate(ctx, e.x, e.y, e.style, e.t, G.ents.some((p) => p.kind === 'plate' && p.pressed && p.tx === e.tx && p.ty === e.ty)); break;
    case 'sign': A.sign(ctx, e.x, e.y); break;
    case 'sunflower': A.puzzleFlower(ctx, e.x, e.y, e.rot, tt, flag(e.group + '_done')); break;
    case 'lamp': A.lamp(ctx, e.x, e.y, G.zone.night, tt); break;
    case 'deco': drawDeco(e, tt); break;
    default: break;
  }
}
function drawDeco(e, t) {
  switch (e.art) {
    case 'bench': A.bench(ctx, e.x, e.y); break;
    case 'phonebox': A.phonebox(ctx, e.x, e.y); break;
    case 'statue': A.statue(ctx, e.x, e.y, e.variant, t); break;
    case 'car': A.car(ctx, e.x, e.y, t); break;
    case 'bigPlane': A.bigPlane(ctx, e.x, e.y, t, false); break;
    case 'crashedPlane': A.crashedPlane(ctx, e.x, e.y, t); break;
    case 'haystack': A.haystack(ctx, e.x, e.y); break;
    case 'well': A.well(ctx, e.x, e.y); break;
    case 'carrot': A.giantCarrot(ctx, e.x, e.y, t, e.pull || 0); break;
    case 'scarecrow': A.scarecrow(ctx, e.x, e.y, t); break;
    case 'busstop': A.busStop(ctx, e.x, e.y, e.label); break;
    case 'pot': A.flowerPot(ctx, e.x, e.y, t, e.col); break;
    case 'butterfly': A.butterfly(ctx, e.x, e.y - 18, t, e.col); break;
    default: break;
  }
}
function drawWeather(kind, t) {
  if (!kind) return;
  for (const w of G.weather) {
    if (kind === 'rain') { ctx.beginPath(); ctx.moveTo(w.x, w.y); ctx.lineTo(w.x - 2, w.y + 8); ctx.strokeStyle = 'rgba(150,170,220,0.55)'; ctx.lineWidth = 1.2; ctx.stroke(); }
    else if (kind === 'petals') A.fillE(ctx, w.x, w.y, 2.4, 1.3, w.s > 0.5 ? '#f6c1d6' : '#fff', t * 2 + w.ph);
    else if (kind === 'leaves') A.fillE(ctx, w.x, w.y, 2.6, 1.4, w.s > 0.5 ? '#f2a65a' : '#ffd27a', t * 2 + w.ph);
    else if (kind === 'fireflies') { const a = 0.4 + 0.6 * Math.abs(Math.sin(t * 2 + w.ph)); A.fillE(ctx, w.x, w.y, 4, 4, `rgba(255,240,150,${a * 0.25})`); A.fillE(ctx, w.x, w.y, 1.4, 1.4, `rgba(255,250,200,${a})`); }
    else if (kind === 'motes') { const a = 0.3 + 0.4 * Math.abs(Math.sin(t + w.ph)); A.fillE(ctx, w.x, w.y, 1.5, 1.5, `rgba(255,250,210,${a})`); }
  }
}
function drawLighting(z, s, cx, cy) {
  if (z.tint) { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = z.tint; ctx.fillRect(0, 0, cv.width, cv.height); }
  if (!z.night) return;
  const L = [];
  L.push({ x: G.player.x, y: G.player.y - 14, r: 95 });
  for (const e of G.ents) {
    if (!isActive(e)) continue;
    if (e.kind === 'lamp') L.push({ x: e.x, y: e.y - 40, r: 85, warm: true });
    else if (e.kind === 'plane' || e.kind === 'glyph' || e.kind === 'item') L.push({ x: e.x, y: e.y - 14, r: 34 });
    else if (e.light) L.push({ x: e.x, y: e.y - 14, r: e.light, warm: true });
  }
  for (const b of G.buildings) if (!b.dark) L.push({ x: (b.x + b.w / 2) * T, y: (b.y + b.h) * T - 16, r: 40 + b.w * 12, warm: true });
  for (const l of z.lights || []) L.push({ x: l.x * T + 16, y: l.y * T + 16, r: l.r || 80, warm: true });
  lctx.setTransform(1, 0, 0, 1, 0, 0);
  lctx.globalCompositeOperation = 'source-over';
  lctx.clearRect(0, 0, lightCv.width, lightCv.height);
  lctx.fillStyle = z.nightColor || 'rgba(22,24,64,0.58)';
  lctx.fillRect(0, 0, lightCv.width, lightCv.height);
  lctx.globalCompositeOperation = 'destination-out';
  for (const l of L) {
    const x = (l.x - cx) * s, y = (l.y - cy) * s, r = l.r * s;
    if (x < -r || y < -r || x > lightCv.width + r || y > lightCv.height + r) continue;
    const g = lctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, 'rgba(0,0,0,0.95)'); g.addColorStop(0.5, 'rgba(0,0,0,0.6)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    lctx.fillStyle = g; lctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.drawImage(lightCv, 0, 0);
  ctx.globalCompositeOperation = 'lighter';
  for (const l of L) {
    if (!l.warm) continue;
    const x = (l.x - cx) * s, y = (l.y - cy) * s, r = l.r * 0.7 * s;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, 'rgba(255,190,110,0.16)'); g.addColorStop(1, 'rgba(255,190,110,0)');
    ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  ctx.globalCompositeOperation = 'source-over';
}

function pill(x, y, h, parts) {
  // parts: [{w, draw(x)}]
  const w = parts.reduce((a, p) => a + p.w, 0) + h * 0.7;
  panel(ctx, x, y, w, h, h / 2, 'rgba(255,250,240,0.94)', 2);
  let cx = x + h * 0.35;
  for (const p of parts) { p.draw(cx, y + h / 2); cx += p.w; }
  return w;
}
function drawHUD(W, H, u) {
  const z = G.zone, pad = 12, h = 32 * u;
  font(ctx, 14 * u, 700);
  const nameW = ctx.measureText(z.name).width;
  font(ctx, 14 * u, 600);
  const clockW = ctx.measureText(G.clock).width;
  pill(pad, pad, h, [
    { w: 22 * u, draw: (x, y) => A.flower(ctx, x + 8 * u, y, 1.6 * u) },
    { w: nameW + 12 * u, draw: (x, y) => text(ctx, z.name, x, y + 1, 14 * u, A.INK, 700, 'left') },
    { w: clockW + 4 * u, draw: (x, y) => text(ctx, G.clock, x, y + 1, 14 * u, '#d0506e', 600, 'left') },
  ]);
  const n = planesGot(), tot = planesNeeded();
  const parts = [];
  if (tot) {
    parts.push({ w: 26 * u, draw: (x, y) => { ctx.save(); ctx.translate(x + 9 * u, y); ctx.scale(1.05 * u, 1.05 * u); A.planeShape(ctx); ctx.restore(); } });
    parts.push({ w: 40 * u, draw: (x, y) => text(ctx, `${n}/${tot}`, x, y + 1, 14 * u, A.INK, 600, 'left') });
  }
  parts.push({ w: 44 * u, draw: (x, y) => { text(ctx, 'G', x + 6 * u, y + 1, 14 * u, '#e9a12f', 700); text(ctx, 'L', x + 18 * u, y + 1, 14 * u, '#e5668a', 700); } });
  parts.push({ w: 34 * u, draw: (x, y) => text(ctx, `${glyphCount()}`, x, y + 1, 14 * u, A.INK, 600, 'left') });
  if (has('tortellino')) parts.push({ w: 26 * u, draw: (x, y) => { ctx.save(); ctx.translate(x + 9 * u, y); ctx.scale(1.1 * u, 1.1 * u); A.itemIcon(ctx, 'tortellino'); ctx.restore(); } });
  pill(pad, pad + h + 6 * u, h, parts);
  const hr = hudRects();
  roundBtn(hr.mute, (x, y, r) => {
    ctx.beginPath(); ctx.moveTo(x - r * 0.45, y - r * 0.2); ctx.lineTo(x - r * 0.2, y - r * 0.2); ctx.lineTo(x + r * 0.15, y - r * 0.5); ctx.lineTo(x + r * 0.15, y + r * 0.5); ctx.lineTo(x - r * 0.2, y + r * 0.2); ctx.lineTo(x - r * 0.45, y + r * 0.2); ctx.closePath();
    ctx.fillStyle = A.INK; ctx.fill();
    if (Sound.muted) { ctx.beginPath(); ctx.moveTo(x + r * 0.3, y - r * 0.25); ctx.lineTo(x + r * 0.6, y + r * 0.25); ctx.moveTo(x + r * 0.6, y - r * 0.25); ctx.lineTo(x + r * 0.3, y + r * 0.25); ctx.strokeStyle = '#d0506e'; ctx.lineWidth = 2; ctx.stroke(); }
    else { ctx.beginPath(); ctx.arc(x + r * 0.2, y, r * 0.35, -0.8, 0.8); ctx.strokeStyle = A.INK; ctx.lineWidth = 1.8; ctx.stroke(); }
  });
  roundBtn(hr.menu, (x, y, r) => { for (let i = -1; i <= 1; i++) A.RR(ctx, x - r * 0.45, y + i * r * 0.32 - 1.2, r * 0.9, 2.6, 1.3, A.INK, false); });
}
function roundBtn(rect, icon) {
  const r = rect.w / 2, x = rect.x + r, y = rect.y + r;
  ctx.beginPath(); ctx.arc(x + 1, y + 3, r, 0, Math.PI * 2); ctx.fillStyle = 'rgba(60,30,60,0.18)'; ctx.fill();
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = 'rgba(255,250,240,0.94)'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = A.INK; ctx.stroke();
  icon(x, y, r);
}
function drawTouch(W, H, u) {
  const r = 36 * u, x = W - 26 * u - r, y = H - 34 * u - r;
  input.actionBtn = { x, y, r };
  if (G.busy) return;
  ctx.globalAlpha = 0.9;
  ctx.beginPath(); ctx.arc(x + 1, y + 4, r, 0, Math.PI * 2); ctx.fillStyle = 'rgba(60,30,60,0.2)'; ctx.fill();
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = G.prompt ? '#ffd6e2' : 'rgba(255,250,240,0.85)'; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = A.INK; ctx.stroke();
  A.heart(ctx, x, y + 3 * u, 13 * u, G.prompt ? '#f06d8f' : '#e8c9d3', false);
  ctx.globalAlpha = 1;
  const j = input.joy;
  if (j) {
    ctx.globalAlpha = 0.5;
    ctx.beginPath(); ctx.arc(j.ox, j.oy, 46, 0, Math.PI * 2); ctx.fillStyle = 'rgba(255,250,240,0.6)'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = A.INK; ctx.stroke();
    const dx = j.x - j.ox, dy = j.y - j.oy, d = Math.hypot(dx, dy), m = Math.min(d, 44);
    const kx = d ? j.ox + dx / d * m : j.ox, ky = d ? j.oy + dy / d * m : j.oy;
    ctx.globalAlpha = 0.85;
    ctx.beginPath(); ctx.arc(kx, ky, 20, 0, Math.PI * 2); ctx.fillStyle = '#ffd6e2'; ctx.fill(); ctx.stroke();
    ctx.globalAlpha = 1;
  } else if (G.time < 30 || G.playTime < 20) {
    ctx.globalAlpha = 0.35;
    ctx.beginPath(); ctx.arc(70 * u, H - 90 * u, 40 * u, 0, Math.PI * 2); ctx.lineWidth = 2; ctx.strokeStyle = A.INK; ctx.stroke();
    text(ctx, 'trascina qui', 70 * u, H - 90 * u, 11 * u, A.INK, 600);
    ctx.globalAlpha = 1;
  }
}
function drawDialog(W, H, u) {
  const d = G.dialog;
  const sp = d.who && d.who !== 'note' ? G.speakers[d.who] : null;
  const isNote = d.opts.note;
  const bw = Math.min(W - 20, 760);
  const fs = Math.max(15, Math.min(20, 16 * u));
  const port = sp && sp.art ? Math.min(84, 70 * u) : 0;
  font(ctx, fs, 500);
  const tw = bw - 36 - (port ? port + 14 : 0);
  const lines = wrap(ctx, d.text, tw);
  const lh = fs * 1.38;
  const choices = d.opts.choices && d.shown >= d.text.length ? d.opts.choices : null;
  const ch = choices ? choices.length * (fs * 2) + 8 : 0;
  const bh = Math.max(port + 26, lines.length * lh + 36 + ch + (isNote ? 22 : 0));
  const x = (W - bw) / 2, y = H - bh - 14;
  panel(ctx, x, y, bw, bh, 18, isNote ? '#fffdf3' : COL.cream, 2.5);
  if (isNote) {
    for (let yy = y + 44; yy < y + bh - 8; yy += lh) { ctx.beginPath(); ctx.moveTo(x + 18, yy + 4); ctx.lineTo(x + bw - 18, yy + 4); ctx.strokeStyle = 'rgba(150,180,220,0.3)'; ctx.lineWidth = 1; ctx.stroke(); }
    ctx.save(); ctx.translate(x + 30, y + 20); ctx.scale(1.3, 1.3); A.planeShape(ctx); ctx.restore();
    text(ctx, 'Un aeroplanino di Lollo', x + 50, y + 21, 14, '#d0506e', 700, 'left');
  }
  if (sp) {
    if (port) {
      ctx.save();
      A.RR(ctx, x + 14, y + 13, port, port, 14, sp.bg || '#ffeef2', true, 2);
      A.rrPath(ctx, x + 14, y + 13, port, port, 14); ctx.clip();
      A.portrait(ctx, sp.art, x + 14 + port / 2, y + 13 + port * 0.62, port / 36, G.time);
      ctx.restore();
    }
    font(ctx, 15, 700);
    const nw = ctx.measureText(sp.name).width + 22;
    A.RR(ctx, x + 18, y - 14, nw, 26, 13, sp.color || COL.pink, true, 2);
    text(ctx, sp.name, x + 18 + nw / 2, y - 0.5, 15, '#fff', 700);
  }
  const tx = x + 18 + (port ? port + 14 : 0), ty0 = y + 22 + (isNote ? 22 : 0) + (sp ? 4 : 0);
  let remain = Math.floor(d.shown);
  for (let i = 0; i < lines.length && remain > 0; i++) {
    const l = lines[i].slice(0, remain);
    remain -= lines[i].length + 1;
    text(ctx, l, tx, ty0 + i * lh, fs, A.INK, 500, 'left');
  }
  d.rects = [];
  if (choices) {
    const cy = ty0 + lines.length * lh + 4;
    choices.forEach((c, i) => {
      const r = { x: tx, y: cy + i * fs * 2, w: Math.min(tw, 360), h: fs * 1.75 };
      d.rects.push(r);
      button(ctx, r, c, { selected: d.sel === i, size: fs * 0.95 });
    });
  } else if (d.shown >= d.text.length) {
    text(ctx, '▼', x + bw - 22, y + bh - 16 + Math.sin(G.time * 6) * 2, 14, COL.pink, 700);
  }
}
function drawToasts(W, H, u) {
  G.toasts.forEach((tt, i) => {
    const a = Math.min(1, tt.t * 5, (tt.life - tt.t) * 3);
    font(ctx, 15 * u, 600);
    const w = ctx.measureText(tt.text).width + 32 * u, h = 34 * u;
    const y = 100 * u + i * (h + 8) - (1 - Math.min(1, tt.t * 5)) * 10;
    ctx.globalAlpha = a;
    panel(ctx, W / 2 - w / 2, y, w, h, h / 2, '#fff3c4', 2);
    text(ctx, tt.text, W / 2, y + h / 2 + 1, 15 * u, A.INK, 600);
    ctx.globalAlpha = 1;
  });
}
function drawMenu(W, H, u) {
  const m = G.menu;
  ctx.fillStyle = COL.dim; ctx.fillRect(0, 0, W, H);
  const pw = Math.min(W - 32, 360 * u);
  if (m.help) {
    const ph = Math.min(H - 32, 380 * u);
    const x = (W - pw) / 2, y = (H - ph) / 2;
    panel(ctx, x, y, pw, ph, 22 * u);
    text(ctx, 'Comandi', W / 2, y + 32 * u, 22 * u, A.INK, 700);
    const lines = input.touchUsed
      ? ['Trascina a sinistra per camminare', 'Tasto ❤ in basso a destra per parlare', 'Tocca lo schermo per andare avanti', 'Spingi le casse camminandoci contro']
      : ['Frecce o WASD: cammina', 'Spazio / Invio / E: parla e conferma', 'Esc: menu   ·   M: musica', 'Spingi le casse camminandoci contro'];
    font(ctx, 15 * u, 500);
    lines.forEach((l, i) => text(ctx, l, W / 2, y + 80 * u + i * 34 * u, 15 * u, A.INK, 500));
    text(ctx, 'Tocca per tornare', W / 2, y + ph - 24 * u, 13 * u, '#9a8090', 500);
    return;
  }
  const items = menuItems();
  const bh = 44 * u, gap = 10 * u, ph = items.length * (bh + gap) + 80 * u;
  const x = (W - pw) / 2, y = (H - ph) / 2;
  panel(ctx, x, y, pw, ph, 22 * u);
  text(ctx, 'Pausa', W / 2, y + 34 * u, 22 * u, A.INK, 700);
  m.rects = items.map((it, i) => ({ x: x + 24 * u, y: y + 62 * u + i * (bh + gap), w: pw - 48 * u, h: bh }));
  items.forEach((it, i) => button(ctx, m.rects[i], it[1], { selected: m.sel === i, size: 16 * u }));
}

// ---------------- avvio ----------------
let last = 0;
function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000 || 0.016);
  last = now;
  try { update(dt); draw(); } catch (err) { console.error(err); }
  input.endFrame();
  requestAnimationFrame(loop);
}
function toTitle() {
  G.mode = 'title'; G.zone = null; G.busy = false; G.dialog = null; G.mini = null; G.menu = null;
  G.fade = 0; G.fadeTo = 0;
  const sc = new SC.Title(!!loadSave());
  scene(sc).then((choiceId) => (choiceId === 'continue' ? continueGame() : startNew()));
}
async function startNew() {
  G.flags = {}; G.inv = {}; G.got = {}; G.playTime = 0;
  try { localStorage.removeItem(SAVE_KEY); } catch (_) { /* ignore */ }
  G.mode = 'intro';
  Sound.music('title');
  await scene(new SC.Intro(G.story.intro));
  enterZone(G.first);
}
function continueGame() {
  const s = loadSave();
  if (!s) return startNew();
  G.flags = s.flags || {}; G.inv = s.inv || {}; G.got = s.got || {}; G.playTime = s.playTime || 0;
  enterZone(s.zone, { x: s.x, y: s.y, dir: s.dir }, true);
}
function enterZone(id, pos, resumed) {
  loadZone(id, pos);
  G.mode = 'play';
  G.fade = 1;
  fadeIn(0.7);
  if (!resumed && G.zone.onEnter) run(() => G.zone.onEnter());
  else if (resumed && G.zone.onResume) run(() => G.zone.onResume());
}
export function init({ zones, speakers, story, first }) {
  G.zones = zones; G.speakers = speakers; G.story = story; G.first = first;
  resize();
  window.addEventListener('resize', resize);
  window.addEventListener('orientationchange', () => setTimeout(resize, 200));
  document.addEventListener('visibilitychange', () => { if (document.hidden) saveGame(); });
  input.onGesture = () => Sound.init();
  // modalità debug: ?zona=nome per provare una zona
  const qs = new URLSearchParams(location.search);
  if (qs.get('zona') && zones[qs.get('zona')]) {
    window.__G = G; window.__api = { mini, run, travel, setFlag };
    for (const f of (qs.get('flag') || '').split(',')) if (f) G.flags[f] = true;
    enterZone(qs.get('zona'));
  } else toTitle();
  requestAnimationFrame(loop);
}
