// Le sei zone del viaggio: mappe, personaggi, enigmi e dialoghi.
import {
  G, T, say, choice, toast, wait, mini, emote, music, sfx, setClock, moveEnt, movePlayer, lookAt, burst,
  flag, setFlag, has, give, take, ent, planesGot, travel, resetPuzzle, rotateFlower, spawn, ending,
} from './engine.js';
import { input } from './input.js';

// ---------------- costruttore di mappe ----------------
const grid = (w, h, ch = '.') => Array.from({ length: h }, () => Array(w).fill(ch));
function rect(m, x, y, w, h, ch) { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (m[j] && m[j][i] !== undefined) m[j][i] = ch; }
const hl = (m, x1, x2, y, ch) => rect(m, Math.min(x1, x2), y, Math.abs(x2 - x1) + 1, 1, ch);
const vl = (m, x, y1, y2, ch) => rect(m, x, Math.min(y1, y2), 1, Math.abs(y2 - y1) + 1, ch);
function pts(m, ch, list) { for (const [x, y] of list) if (m[y] && m[y][x] !== undefined) m[y][x] = ch; }
function border(m, ch) { const h = m.length, w = m[0].length; hl(m, 0, w - 1, 0, ch); hl(m, 0, w - 1, h - 1, ch); vl(m, 0, 0, h - 1, ch); vl(m, w - 1, 0, h - 1, ch); }
function stamp(m, x, y, rows) { rows.forEach((r, j) => [...r].forEach((c, i) => { if (c !== ' ') m[y + j][x + i] = c; })); }
const fin = (m) => m.map((r) => r.join(''));

// ---------------- aiuti per i dialoghi ----------------
function chat(who, lines, snd) {
  let i = 0;
  return async () => { if (snd) sfx(snd); await say(who, lines[i % lines.length]); i++; };
}
const read = (txt) => async () => { await say(null, txt); };
const tip = (kbd, touch) => (input.touchUsed ? touch : kbd);
async function fadeAlpha(e, from, to, dur) {
  const n = Math.ceil(dur / 0.04);
  for (let i = 0; i <= n; i++) { e.alpha = from + (to - from) * (i / n); await wait(0.04); }
}
async function needPlanes() {
  await say('geo', `Non posso ancora partire: ho trovato ${planesGot()} aeroplanini su 3 qui intorno.`);
}

// ---------------- personaggi che parlano ----------------
export const SPEAKERS = {
  geo: { name: 'Geo', art: 'geo', color: '#f2a93b', pitch: 0.6, bg: '#fff3d6' },
  lollo: { name: 'Lollo', art: 'lollo', color: '#5fa77c', pitch: -0.2, bg: '#e6f5ea' },
  gareth: { name: 'Gareth', art: 'squirrel', color: '#8e88a0', pitch: 0.9 },
  gwen: { name: 'Gwen', art: 'mallard', color: '#3f8f6a', pitch: 0.5 },
  lionel: { name: 'Lionel', art: 'hedgehog', color: '#8a6248', pitch: -0.3 },
  lavender: { name: 'Lady Lavender', art: 'fox', color: '#e07a3a', pitch: 0.2 },
  gordon: { name: 'Gordon', art: 'robin', color: '#e46a3f', pitch: 1 },
  biscotto: { name: 'Lord Biscotto', art: 'bulldog', color: '#a57d58', pitch: -0.8 },
  gull: { name: 'Capitan Gull', art: 'captain', color: '#2e3b5b', pitch: -0.4 },
  gilda: { name: 'Nonna Gilda', art: 'hen', color: '#e4545f', pitch: 0.4 },
  fulmine: { name: 'Fulmine', art: 'turtle', color: '#d94a4a', pitch: -0.6 },
  mia: { name: 'Mia', art: 'mia', color: '#3a3440', pitch: 0.8 },
  lambrusco: { name: 'Lambrusco', art: 'pig', color: '#e57d93', pitch: -0.2 },
  gege: { name: 'Gegè', art: 'frog', color: '#5fae4f', pitch: 0.7 },
  lunardo: { name: 'Lunardo', art: 'mole', color: '#5e5566', pitch: -0.1 },
  gino: { name: 'Gino', art: 'greyG', color: '#8f8898', pitch: 0.1 },
  lino: { name: 'Lino', art: 'greyL', color: '#b69878', pitch: 0.3 },
  lalla: { name: 'Lalla', art: 'hare', color: '#b88d63', pitch: 0.6 },
  gabriella: { name: 'Gabriella', art: 'seagull', color: '#7a8aa0', pitch: 0.5 },
  piero: { name: 'Piero', art: 'pigeon', color: '#7d7d96', pitch: 0.2 },
  guido: { name: 'Guido', art: 'bunnyBrown', color: '#9b7458', pitch: 0 },
  romoletto: { name: 'Romoletto', art: 'catGinger', color: '#cf7f36', pitch: 0 },
  gnappetta: { name: 'Gnappetta', art: 'catCalico', color: '#e39a52', pitch: 0.8 },
  pizzicotto: { name: 'Pizzicotto', art: 'catBlack', color: '#4a4452', pitch: -0.3 },
  gigi: { name: 'Gigi', art: 'bear', color: '#8a5a3c', pitch: -0.9 },
  lilli: { name: 'Lilli', art: 'chamois', color: '#a97a52', pitch: 0.4 },
  gelsomina: { name: 'Zia Gelsomina', art: 'hare', color: '#c98a5a', pitch: 0.3 },
  yumi: { name: 'Yumi', art: 'yumi', color: '#e98f35', pitch: -0.5 },
  squirrel: { name: 'Scoiattolo', art: 'squirrel', color: '#8e88a0', pitch: 1 },
  squirrelR: { name: 'Scoiattolo', art: 'squirrelRed', color: '#c9663a', pitch: 1 },
  pigeon: { name: 'Piccione', art: 'pigeon', color: '#7d7d96', pitch: 0.2 },
  duck: { name: 'Papera', art: 'duck', color: '#e0a030', pitch: 0.6 },
  bunny: { name: 'Coniglietta', art: 'bunnyGrey', color: '#9a93a8', pitch: 0.5 },
  bunnyB: { name: 'Coniglietto', art: 'bunnyBrown', color: '#9b7458', pitch: 0 },
  cat: { name: 'Gatto', art: 'catGrey', color: '#8b879a', pitch: 0.1 },
  hedgehog: { name: 'Riccio', art: 'hedgehog', color: '#8a6248', pitch: -0.3 },
  frog: { name: 'Rana', art: 'frog', color: '#5fae4f', pitch: 0.7 },
  lizard: { name: 'Lucertola', art: 'lizard', color: '#6fae4a', pitch: 0.9 },
  sheep: { name: 'Pecora', art: 'sheep', color: '#9a8f96', pitch: 0.2 },
};

// =====================================================================
//  1. LACCI — Terra dei Regni (09:09)
// =====================================================================
function lacciMap() {
  const m = grid(34, 24);
  border(m, 'T');
  rect(m, 29, 1, 2, 15, '~'); rect(m, 29, 8, 2, 1, '_');
  rect(m, 20, 1, 8, 6, 'h'); rect(m, 21, 2, 6, 4, '.'); m[6][23] = '.';
  vl(m, 4, 5, 8, '='); vl(m, 14, 5, 8, '='); vl(m, 23, 7, 8, '=');
  hl(m, 4, 28, 8, '=');
  vl(m, 15, 9, 9, '=');
  rect(m, 12, 10, 7, 4, 'o');
  vl(m, 15, 14, 15, '='); hl(m, 15, 26, 15, '=');
  rect(m, 3, 15, 5, 4, '~');
  hl(m, 18, 32, 16, 'f'); m[16][26] = '=';
  vl(m, 18, 16, 21, 'f');
  rect(m, 19, 17, 14, 3, 'w');
  rect(m, 19, 20, 14, 3, '~'); rect(m, 24, 20, 4, 2, 'w');
  m[22][18] = '~';
  pts(m, 'T', [[8, 1], [31, 6], [2, 11], [32, 11], [1, 13], [3, 13], [27, 13], [13, 18], [2, 20], [9, 22], [3, 22], [1, 7], [10, 13], [32, 14]]);
  pts(m, 'b', [[2, 9], [26, 10], [7, 12], [11, 15], [16, 18], [16, 21]]);
  pts(m, ',', [[8, 2], [32, 2], [1, 5], [25, 10], [24, 14], [6, 21], [2, 14], [12, 21], [9, 6], [6, 10], [19, 13], [27, 11], [31, 9], [14, 20], [1, 17]]);
  pts(m, '"', [[10, 7], [1, 9], [8, 14], [17, 20], [11, 3], [26, 12]]);
  return fin(m);
}

const lacci = {
  name: 'Lacci', region: 'Terra dei Regni', time: '09:09', music: 'lacci', weather: 'rain',
  tint: 'rgba(120,140,200,0.10)',
  pal: { grass: '#9dcc94', grass2: '#7fb57a', path: '#e4d3b2', cobble: '#d2c9bf', cobble2: '#c0b6ac', plaza: '#e9e0d3', plaza2: '#ddd2c3', water: '#86c3dc', water2: '#dff3fb', sand: '#ecdcb0', tree: '#78b878', hedge: '#5f9f62', fence: '#ffffff', wood: '#c9a27a', flowers: ['#f6a6c1', '#ffffff', '#b9a6f0'] },
  map: lacciMap,
  spawn: { x: 4, y: 5, dir: 'down' },
  buildings: [
    { x: 2, y: 1, w: 5, h: 4, style: 'brickhouse', door: { x: 4, y: 4 }, talk: read('Casa di Geo. Le tende sono chiuse e la teiera è al sicuro. Niente ripensamenti: si parte!') },
    { x: 11, y: 1, w: 7, h: 4, style: 'library', door: { x: 14, y: 4 }, talk: read('"La Biblioteca apre alle 10:10." Tutti i libri sono stati portati nel cortile qui accanto, chiusi in grosse casse.') },
    { x: 19, y: 10, w: 6, h: 3, style: 'theatre', door: { x: 21, y: 12 }, talk: read('In cartellone stasera: "Romeo e Giulietta... ma con i conigli, e stavolta finisce bene".') },
  ],
  resets: { lib: { x: 23, y: 7, dir: 'up' } },
  ents: () => [
    { id: 'gareth', kind: 'npc', art: 'squirrel', tx: 6, ty: 6, face: -1, talk: garethTalk },
    { id: 'gordon', kind: 'npc', art: 'robin', tx: 19, ty: 6, face: 1, talk: chat('gordon', [
      'Cip! Nel cortile ci sono due casse di libri e due piastrelle col cuore. Metti le casse sopra le piastrelle e succede una magia. Parola di pettirosso!',
      'Le casse si spingono camminandoci contro. Occhio agli angoli: una cassa in un angolo non esce più!',
      'Se ti incastri, parla col cartello all’ingresso del cortile: rimette tutto a posto.',
    ]) },
    { id: 'gwen', kind: 'npc', art: 'mallard', tx: 9, ty: 16, face: -1, talk: chat('gwen', [
      'Quack! Cioè: buongiorno, cara. Ho visto un aeroplanino di carta atterrare vicino alla panchina, laggiù.',
      'Il mio passatempo preferito? Guardare la pioggia. E nuotarci dentro. E lamentarmene.',
    ], 'quack') },
    { id: 'lionel', kind: 'npc', art: 'hedgehog', tx: 5, ty: 20, face: 1, talk: chat('lionel', [
      'Lo sai che a Lacci piove trecento giorni all’anno? Gli altri sessantacinque piove un po’ meno.',
      'Quando piove mi appallottolo. Cioè quasi sempre. È per questo che sono così rotondo.',
      'Vai in Italia? Portami una cartolina col sole. Voglio vedere com’è fatto.',
    ]) },
    { id: 'lavender', kind: 'npc', art: 'fox', tx: 13, ty: 12, face: 1, talk: chat('lavender', [
      'Benvenuta in piazza, cara. Lacci è il villaggio della cultura: teatro, biblioteca e un tè servito alle 17:17 in punto.',
      'Una volpe colta riconosce un viaggio d’amore da lontano. Vai, e non dimenticare l’ombrello. Anzi, dimenticalo pure: in Italia c’è il sole.',
    ]) },
    { id: 'biscotto', kind: 'npc', art: 'bulldog', tx: flag('biscotto_calm') ? 27 : 26, ty: flag('biscotto_calm') ? 15 : 16, face: flag('biscotto_calm') ? -1 : 1, happy: flag('biscotto_calm'), talk: biscottoTalk },
    { id: 'gull', kind: 'npc', art: 'captain', tx: 23, ty: 18, face: 1, talk: gullTalk, ph: 34 },
    { id: 'sq1', kind: 'critter', art: 'squirrel', tx: 9, ty: 3, wander: 2, talk: chat('squirrel', ['Squit! Hai visto una ghianda? Ne avevo nascoste novantanove.', 'Squit squit! Lollo? Mai sentito. Però ha un bel nome, con due L.']) },
    { id: 'sq2', kind: 'critter', art: 'squirrel', tx: 31, ty: 12, wander: 1.2, talk: chat('squirrel', ['Squit! Da qui si vede il canale. E le anatre. E la pioggia. Soprattutto la pioggia.']) },
    { id: 'duck2', kind: 'critter', art: 'duck', tx: 8, ty: 18, wander: 1, talk: chat('duck', ['Quack quack! (Sembra volerti augurare buon viaggio.)'], 'quack') },
    { id: 'pg1', kind: 'critter', art: 'pigeon', tx: 17, ty: 12, wander: 1.5, talk: chat('pigeon', ['Gru gru. Briciole? No? Allora gru.']) },
    { id: 'pg2', kind: 'critter', art: 'pigeon', tx: 16, ty: 13, wander: 1.5, talk: chat('pigeon', ['Gru. (Ti guarda con un occhio solo, con aria molto seria.)']) },
    { id: 'bun1', kind: 'critter', art: 'bunnyGrey', tx: 10, ty: 9, wander: 1, talk: chat('bunny', ['Geo! Allora è vero che parti? Salutaci tanto Lollo!', 'Quando torni a trovarci portaci qualcosa di buono dall’Italia. Tipo il sole.']) },
    { id: 'bf1', kind: 'deco', art: 'butterfly', tx: 6, ty: 13, butterfly: true, solid: false, col: '#b9a6f0' },
    { id: 'bf2', kind: 'deco', art: 'butterfly', tx: 26, ty: 4, butterfly: true, solid: false, col: '#f6a6c1' },
    { kind: 'deco', art: 'statue', variant: 'bunny', tx: 15, ty: 11, talk: read('"Sir Coniglio Shakesbunny, poeta di Lacci." Sotto c’è inciso: "Essere o non essere... insieme. Questo è il problema."'), ph: 52 },
    { kind: 'deco', art: 'phonebox', tx: 11, ty: 11, talk: read('Una cabina telefonica rossa. Geo pensa a tutte le chiamate notturne con Lollo... e a quanto costerebbero da qui.'), ph: 56 },
    { kind: 'deco', art: 'bench', tx: 10, ty: 18, solid: true, talk: read('Una panchina bagnata. Come tutte le panchine di Lacci.') },
    { kind: 'lamp', tx: 13, ty: 9 }, { kind: 'lamp', tx: 17, ty: 9 }, { kind: 'lamp', tx: 8, ty: 7 }, { kind: 'lamp', tx: 24, ty: 9 },
    { kind: 'deco', art: 'bigPlane', tx: 25, ty: 21, big: 14, ph: 60, talk: gullTalk },
    { id: 'crA', kind: 'block', style: 'books', tx: 22, ty: 3, group: 'lib' },
    { id: 'crB', kind: 'block', style: 'books', tx: 25, ty: 4, group: 'lib' },
    { kind: 'plate', tx: 21, ty: 2, group: 'lib' }, { kind: 'plate', tx: 26, ty: 2, group: 'lib' },
    { kind: 'sign', tx: 24, ty: 7, talk: async () => {
      if (flag('lib_done')) { await say(null, '"Cortile della Biblioteca. Grazie per aver rimesso a posto i libri!"'); return; }
      const c = await choice(null, '"Spingi le casse di libri sulle piastrelle col cuore." Vuoi rimettere le casse al loro posto?', ['No, ci penso io', 'Sì, ricomincia']);
      if (c === 1) resetPuzzle('lib');
    } },
    { id: 'lacci_p1', kind: 'plane', msg: 0, tx: 11, ty: 20 },
    { id: 'lacci_p2', kind: 'plane', msg: 1, tx: 23, ty: 4, cond: () => flag('lib_done') },
    { id: 'lacci_p3', kind: 'plane', msg: 2, tx: 25, ty: 15, cond: () => flag('biscotto_calm') },
    { id: 'gl_lacci_G', kind: 'glyph', ch: 'G', tx: 18, ty: 1 },
    { id: 'gl_lacci_L', kind: 'glyph', ch: 'L', tx: 32, ty: 4 },
  ],
  async onEnter() {
    if (flag('arr_lacci')) return;
    setFlag('arr_lacci');
    await wait(0.5);
    await say('geo', 'Che pioggerellina... la solita mattina a Lacci.');
    await say('geo', 'Ma oggi non è un giorno qualunque: oggi torno da Lollo! Prima però devo ritrovare i suoi aeroplanini.');
    await say(null, tip('Muoviti con le frecce (o WASD) e parla con SPAZIO. Con ESC apri il menu.', 'Trascina il dito a sinistra per camminare e tocca il tasto ❤ per parlare.'));
  },
  async onSolve(g) {
    if (g !== 'lib') return;
    await wait(0.2);
    sfx('gate'); burst(23 * T + 16, 4 * T + 10, 'sparkle', 16);
    await say(null, 'Le casse si incastrano con un "clic"... e dall’alto plana giù un aeroplanino di carta!');
  },
  async onAllPlanes() {
    await say('geo', 'Tre aeroplanini! Adesso di corsa al porto, da Capitan Gull!');
  },
};
async function garethTalk() {
  if (!flag('gareth1')) {
    setFlag('gareth1');
    await say('gareth', 'Geo! Buongiorno! Hai sentito che ventaccio stanotte?');
    await say('gareth', 'Ha sparpagliato per tutta Lacci degli aeroplanini di carta. Sopra c’è scritto "Per Geo, da Lollo".');
    await say('geo', 'I messaggi di Lollo! Devo ritrovarli tutti!');
    await say('gareth', 'Uno l’ho visto planare verso lo stagno del parco, giù a sinistra. Un altro è finito nel cortile della biblioteca, quassù.');
    await say('gareth', 'E il terzo... temo che l’abbia preso Lord Biscotto, il bulldog che fa la guardia al porto. In basso a destra.');
    await say('gareth', 'Con tre aeroplanini, Capitan Gull potrà piegarti il Grande Aereo di Carta. E vola fino in Italia!');
    await say('gareth', 'Ah, e tieni gli occhi aperti: in giro ci sono delle lettere G e L luccicanti. Dicono che portino fortuna agli innamorati.');
    return;
  }
  if (planesGot() >= 3) { await say('gareth', 'Li hai trovati tutti! Corri al porto, Capitan Gull ti aspetta sul pontile!'); return; }
  await say('gareth', 'Lo stagno è giù a sinistra, la biblioteca quassù, il porto in basso a destra. Squit!');
}
async function biscottoTalk(e) {
  if (flag('biscotto_calm')) { await say('biscotto', 'Woof. Cioè: buon viaggio, signorina. È stato un onore farmi grattare la pancia.'); return; }
  sfx('woof'); emote(e, '!');
  await say('biscotto', 'GRRR! Alt! Nessuno entra al porto senza il permesso di Lord Biscotto!');
  await say('geo', 'Ma quello che hai in bocca è un aeroplanino di Lollo!');
  await say('biscotto', 'Mmmf. Forse. Ma adesso è MIO. Ho sonno, ho fame e nessuno mi fa mai le coccole...');
  await say('geo', 'Le coccole? A quelle ci penso io!');
  await mini('rhythm', { title: 'Coccole per Lord Biscotto', sub: 'Grattagli il pancione al momento giusto!', art: 'bulldog', need: 4, speed: 0.75, artScale: 0.9 });
  setFlag('biscotto_calm');
  e.happy = true; emote(e, 'heart'); sfx('woof');
  await say('biscotto', 'Oooh... sì... proprio lì... Va bene, va bene, hai vinto. Ecco il tuo aeroplanino.');
  await moveEnt(e, 27, 15, 50);
  e.face = -1;
  await say('biscotto', 'Il porto è tutto tuo. Capitan Gull è sul pontile.');
}
async function gullTalk() {
  const n = planesGot();
  if (n < 3) {
    if (!flag('gull1')) {
      setFlag('gull1');
      await say('gull', 'Ahoy, coniglietta! Vuoi attraversare il mare? Niente navi oggi: troppo vento.');
      await say('gull', 'Ma con tre aeroplanini di carta posso piegarti il Grande Aereo. Portameli e si parte!');
    } else await say('gull', `Ne hai ${n} su 3. Il mare aspetta, ma non per sempre!`);
    return;
  }
  await say('gull', 'Tre aeroplanini! Per mille sardine, che messaggi sdolcinati... mi piacciono un sacco.');
  await say('gull', 'Ora aiutami a piegare il Grande Aereo. Ripeti le pieghe che ti indico!');
  await mini('memory', { title: 'Piega il Grande Aereo', sub: 'Ripeti le pieghe del Capitano', art: 'captain', rounds: [3, 4], winMsg: 'Che pieghe perfette!' });
  await say('gull', 'È l’aereo di carta più bello che abbia mai visto. E ne ho visti tanti: sono un gabbiano.');
  await say('geo', 'Grazie, Capitano! Lollo, arrivo!');
  music('flight');
  const r = await mini('flight', { duration: 36 });
  setFlag('lacci_done');
  setFlag('flight_hearts', r ? r.score : 0);
  await travel('tortellandia', { mode: 'volo', sub: 'in volo sopra il mare' });
}

// =====================================================================
//  2. TORTELLANDIA — Modena (12:12)
// =====================================================================
function tortMap() {
  const m = grid(34, 24);
  border(m, 'T');
  rect(m, 1, 1, 9, 5, 's'); rect(m, 4, 3, 3, 2, '.');
  pts(m, 'S', [[1, 1], [3, 1], [8, 1], [9, 3], [1, 4], [2, 2], [9, 5], [7, 1]]);
  vl(m, 5, 5, 10, '='); hl(m, 5, 13, 10, '=');
  rect(m, 13, 9, 8, 5, 'o');
  vl(m, 15, 8, 8, '=');
  hl(m, 21, 25, 9, '='); vl(m, 25, 8, 9, '=');
  rect(m, 28, 1, 4, 2, '~');
  for (const y of [15, 17, 19]) hl(m, 3, 10, y, 'k');
  vl(m, 15, 14, 16, '='); hl(m, 11, 15, 16, '=');
  rect(m, 21, 15, 9, 6, 'h'); rect(m, 22, 16, 7, 4, '.'); m[15][25] = '.';
  hl(m, 21, 31, 12, '='); vl(m, 31, 12, 23, '='); vl(m, 25, 13, 14, '=');
  pts(m, 'C', [[11, 2], [12, 6], [19, 1], [33, 6], [10, 8], [1, 11], [20, 15], [30, 16], [32, 19], [11, 22], [27, 21]]);
  pts(m, 'T', [[2, 8], [8, 8], [1, 13], [12, 12], [32, 9], [22, 22], [16, 21], [1, 21], [18, 18]]);
  pts(m, 'b', [[20, 6], [13, 14], [19, 14], [32, 13]]);
  pts(m, ',', [[7, 7], [3, 11], [10, 12], [22, 7], [28, 10], [29, 4], [17, 16], [13, 18], [24, 22], [19, 21], [12, 20], [8, 12], [26, 3], [21, 4]]);
  pts(m, 's', [[3, 7], [9, 10], [17, 19], [14, 21], [29, 14], [22, 14]]);
  return fin(m);
}
const SF_START = [3, 0, 3, 1];
const tortellandia = {
  name: 'Tortellandia', region: 'Modena', time: '12:12', music: 'tortellandia', weather: 'motes',
  tint: 'rgba(255,225,150,0.06)',
  pal: { grass: '#a9d673', grass2: '#8cbd5a', path: '#ecd29c', cobble: '#e0c8a4', cobble2: '#d2b892', plaza: '#f1dcb6', plaza2: '#e8cfa4', water: '#88cfe0', water2: '#e2f6fb', tree: '#86c464', hedge: '#6aaa50', fence: '#fff6e6', flowers: ['#ffffff', '#ffd23f', '#f6a6c1'], bush: '#79b85a' },
  map: tortMap,
  spawn: { x: 5, y: 4, dir: 'down' },
  buildings: [
    { x: 13, y: 4, w: 6, h: 4, style: 'osteria', door: { x: 15, y: 7 }, talk: read('Dall’osteria esce un profumo di ragù che farebbe tornare indietro chiunque.') },
    { x: 23, y: 4, w: 5, h: 4, style: 'garage', door: { x: 25, y: 7 }, talk: read('La saracinesca della Scuderia Fulmine è abbassata. Dentro si sente un motore che fa "brum"... molto, molto piano.') },
    { x: 2, y: 11, w: 3, h: 3, style: 'tuscan', wall: '#f2b98e', door: { x: 3, y: 13 }, talk: read('Sulla porta c’è un biglietto: "Torno subito. Firmato: un coniglio in pausa pranzo".') },
  ],
  ents: () => [
    { kind: 'deco', art: 'crashedPlane', tx: 7, ty: 3, solid: true, talk: read('Il Grande Aereo di Carta, un po’ sgualcito. Ha fatto il suo dovere.'), ph: 40 },
    { id: 'gilda', kind: 'npc', art: 'hen', tx: 17, ty: 9, face: -1, talk: gildaTalk },
    { id: 'fulmine', kind: 'npc', art: 'turtle', tx: 23, ty: 10, face: 1, talk: fulmineTalk },
    { id: 'mia1', kind: 'npc', art: 'mia', tx: 5, ty: 18, face: 1, cond: () => !flag('mia1'), talk: mia1Talk },
    { id: 'gege', kind: 'npc', art: 'frog', tx: 29, ty: 3, talk: chat('gege', [
      'Cra! Cerchi una chiave inglese? È lì sull’erba, vicino allo stagno. Io non la tocco: è fredda e sa di motore.',
      'Cra cra. Il mio nome finisce con la È. Molto elegante, vero?',
    ]) },
    { id: 'lambrusco', kind: 'npc', art: 'pig', tx: 12, ty: 19, wander: 1, talk: chat('lambrusco', [
      'Oink. Mi chiamo Lambrusco. Non chiedermi il perché: è una lunga storia di famiglia.',
      'Nel vigneto si nasconde un cane bianco a macchie nere. Ha un aeroplanino in bocca e nessuna intenzione di mollarlo.',
    ]) },
    { kind: 'sign', tx: 24, ty: 14, talk: read('"Giardino dei Girasoli. I girasoli guardano sempre il sole (in alto). Ma attenzione: quando ne giri uno, gira anche il suo vicino di destra."') },
    { id: 'sf0', sid: 0, kind: 'sunflower', group: 'sf', rot: SF_START[0], tx: 22, ty: 17, link: [1], talk: sunTalk },
    { id: 'sf1', sid: 1, kind: 'sunflower', group: 'sf', rot: SF_START[1], tx: 24, ty: 17, link: [2], talk: sunTalk },
    { id: 'sf2', sid: 2, kind: 'sunflower', group: 'sf', rot: SF_START[2], tx: 26, ty: 17, link: [3], talk: sunTalk },
    { id: 'sf3', sid: 3, kind: 'sunflower', group: 'sf', rot: SF_START[3], tx: 28, ty: 17, link: [], talk: sunTalk },
    { kind: 'deco', art: 'car', tx: 27, ty: 10, solid: true, talk: read('Una macchinina rossa fiammante. Sul cofano qualcuno ha dipinto "G♥L". Chissà chi...'), ph: 34 },
    { kind: 'deco', art: 'well', tx: 18, ty: 12, solid: true, talk: read('Un pozzo dei desideri. Geo ci guarda dentro e vede solo il suo riflesso... e un girasole tra le orecchie.') },
    { kind: 'deco', art: 'pot', tx: 13, ty: 8, col: '#e05a5a' }, { kind: 'deco', art: 'pot', tx: 18, ty: 8, col: '#ffd23f' },
    { kind: 'deco', art: 'haystack', tx: 30, ty: 7, solid: true },
    { id: 'sqr1', kind: 'critter', art: 'squirrelRed', tx: 11, ty: 4, wander: 2, talk: chat('squirrelR', ['Squit! Qui a Tortellandia anche le ghiande sanno di parmigiano.', 'Hai sentito? Nonna Gilda regala tortellini a chi parte. Io parto ogni giorno, così ne prendo uno.']) },
    { id: 'sqr2', kind: 'critter', art: 'squirrelRed', tx: 28, ty: 22, wander: 1.5, talk: chat('squirrelR', ['Squit! Sono rosso, come le macchine di Fulmine. Ma molto più veloce.']) },
    { id: 'hen2', kind: 'critter', art: 'hen', tx: 8, ty: 12, wander: 1.5, scale: 0.85, talk: chat('gilda', ['Coccodè! Sono la nipote di Nonna Gilda. Lei fa i tortellini, io faccio le uova. Lavoro di squadra.']) },
    { id: 'bun2', kind: 'critter', art: 'bunnyBrown', tx: 19, ty: 11, wander: 1, talk: chat('bunnyB', ['Benvenuta a Tortellandia! Qui si mangia, si chiacchiera e poi si rimangia.']) },
    { id: 'bf1', kind: 'deco', art: 'butterfly', tx: 4, ty: 2, butterfly: true, solid: false, col: '#ffd23f' },
    { id: 'bf2', kind: 'deco', art: 'butterfly', tx: 25, ty: 18, butterfly: true, solid: false, col: '#f6a6c1' },
    { id: 'bf3', kind: 'deco', art: 'butterfly', tx: 14, ty: 2, butterfly: true, solid: false, col: '#b9e0ff' },
    { id: 'chiave', kind: 'item', item: 'chiave', label: 'Chiave inglese di Fulmine', tx: 32, ty: 3 },
    { id: 'tort_p1', kind: 'plane', msg: 3, tx: 6, ty: 18, cond: () => flag('mia1') },
    { id: 'tort_p2', kind: 'plane', msg: 4, tx: 22, ty: 11, cond: () => flag('fulmine_done') },
    { id: 'tort_p3', kind: 'plane', msg: 5, tx: 25, ty: 19, cond: () => flag('sf_done') },
    { id: 'gl_tort_G', kind: 'glyph', ch: 'G', tx: 3, ty: 20 },
    { id: 'gl_tort_L', kind: 'glyph', ch: 'L', tx: 21, ty: 2 },
  ],
  triggers: [
    { x: 31, y: 22, w: 1, h: 2, run: async () => {
      if (planesGot() < 3) { await needPlanes(); await movePlayer(31, 20); return; }
      if (!has('tortellino') && !flag('gave_tort')) {
        await say('gilda', 'EHI! Coniglietta! Dove scappi? Non partirai mica a pancia vuota?! Vieni subito all’osteria!');
        await movePlayer(31, 20);
        return;
      }
      setFlag('tort_done');
      await travel('giglia', { sub: 'a piedi, tra le colline' });
    } },
  ],
  async onEnter() {
    if (flag('arr_tort')) return;
    setFlag('arr_tort');
    sfx('bump'); burst(G.player.x, G.player.y - 10, 'petals', 14);
    await wait(0.6);
    await say('geo', 'Uff! Atterraggio un po’ movimentato... ma sono in Italia!');
    const h = G.flags.flight_hearts;
    if (h) await say('geo', `Durante il volo ho raccolto ${h} cuori. Li tengo tutti per Lollo.`);
    await say('geo', 'Il Grande Aereo si è sgualcito. Da qui in poi si prosegue a piedi.');
    await say('geo', 'Che profumino di ragù... Questa dev’essere Tortellandia!');
  },
  async onAllPlanes() { await say('geo', 'Tutti e tre! La strada per Giglia è in basso a destra.'); },
};
async function sunTalk(e) {
  if (flag('sf_done')) { await say(null, 'Il girasole guarda il sole, felice.'); return; }
  const solved = rotateFlower(e);
  if (solved) {
    await wait(0.4);
    burst(25 * T + 16, 18 * T, 'petals', 20);
    sfx('gate');
    await say(null, 'Tutti i girasoli guardano il sole! In mezzo ai petali compare un aeroplanino di carta.');
  }
}
async function gildaTalk(e) {
  if (!has('tortellino') && !flag('gave_tort')) {
    await say('gilda', 'Ah, che bella coniglietta! Ma sei magrolina, eh. Mangi abbastanza?');
    await say('geo', 'Sto andando dal mio Lollo, nella Terra dei Marsi!');
    await say('gilda', 'Un viaggio d’amore! E lo fai a pancia vuota? Neanche per sogno.');
    await say('gilda', 'Tieni: il mio Tortellino d’Oro. Ripieno di amore e un pizzico di noce moscata.');
    give('tortellino'); setFlag('gave_tort'); sfx('pickup'); burst(G.player.x, G.player.y - 20, 'sparkle', 10);
    toast('Hai ricevuto: Tortellino d’Oro');
    await say('gilda', 'Però non mangiarlo subito, eh! Tienilo per il viaggio. Non si sa mai chi incontri per strada...');
    return;
  }
  await say('gilda', ['Saluta il tuo Lollo da parte di Nonna Gilda! E digli che è troppo magro anche lui.', 'Il tortellino tienilo stretto, mi raccomando. Vale più di una chiave!'][Math.floor(Math.random() * 2)]);
}
async function fulmineTalk(e) {
  if (flag('fulmine_done')) { await say('fulmine', 'Brum brum! Il motore canta. Io un po’ meno, ma ci arrivo. Buon viaggio, coniglietta!'); return; }
  if (has('chiave')) {
    await say('geo', 'Ho trovato la tua chiave inglese!');
    take('chiave'); setFlag('fulmine_done'); sfx('success');
    await say('fulmine', 'La mia chiave! Grazie! Adesso posso finalmente stringere quel bullone... tra un paio d’ore.');
    await say('fulmine', 'E l’aeroplanino che avevo incastrato sotto il guscio è tuo. Ecco qua!');
    return;
  }
  if (!flag('fulmine1')) {
    setFlag('fulmine1');
    await say('fulmine', 'Ciao! Sono Fulmine, il pilota più veloce di Tortellandia.');
    await say('geo', 'Ehm... sei una tartaruga.');
    await say('fulmine', 'Il motore è rosso, io sono lento: è una questione di equilibrio.');
    await say('fulmine', 'Ho perso la mia chiave inglese vicino allo stagno, su in alto a destra. E mi si è incastrato un aeroplanino di carta sotto il guscio.');
    await say('fulmine', 'Se mi riporti la chiave, l’aeroplanino è tuo.');
    return;
  }
  await say('fulmine', 'La chiave dovrebbe essere vicino allo stagno, su in alto a destra. Io ci andrei, ma ci metterei fino a domani.');
}
async function mia1Talk(e) {
  sfx('woof'); emote(e, '!');
  await say('mia', 'Woof! Woof!');
  await say('geo', 'Ciao, cagnolina! Ma quello è un aeroplanino di Lollo? Me lo daresti?');
  await say(null, 'Sulla medaglietta c’è scritto "MIA". La cagnolina scodinzola e fa una piroetta: vuole giocare!');
  await say('geo', 'Mia, eh? Mia di chi? Va bene, giochiamo!');
  await mini('memory', { title: 'Mia vuole giocare!', sub: 'Ripeti i suoi trucchi', art: 'mia', rounds: [3, 4, 4], winMsg: 'Mia è al settimo cielo!' });
  setFlag('mia1');
  sfx('woof'); burst(e.x, e.y - 20, 'hearts', 8);
  await say(null, 'Mia lascia cadere l’aeroplanino, ti lecca una zampa... e scappa via verso sud, scodinzolando.');
  e.gone = true;
}

// =====================================================================
//  3. GIGLIA — Firenze (15:15)
// =====================================================================
const MAZE = [
  'hhhhhhhhhhh',
  'h..L.h....h',
  'h.hhhh.hh.h',
  'h.h....h..h',
  'h.h.hhhh.hh',
  'h...h..L..h',
  'hhhhh.hhh..',
  'hhhhhhhhhhh',
];
function gigliaMap() {
  const m = grid(34, 24);
  border(m, 'C');
  rect(m, 1, 11, 32, 3, '~');
  rect(m, 16, 11, 2, 3, '_');
  vl(m, 17, 0, 10, '-'); hl(m, 1, 32, 10, '-');
  rect(m, 19, 7, 9, 3, 'o');
  stamp(m, 2, 2, MAZE);
  vl(m, 13, 8, 9, '-');
  rect(m, 16, 14, 2, 1, '-'); vl(m, 16, 15, 20, '-'); hl(m, 0, 27, 20, '-');
  rect(m, 20, 14, 9, 6, 'M'); rect(m, 21, 15, 7, 4, '.'); m[19][24] = '-';
  pts(m, 'L', [[14, 3], [15, 6], [13, 1], [29, 21], [5, 22], [10, 22], [31, 15], [19, 22]]);
  pts(m, 'C', [[13, 5], [16, 4], [29, 8], [32, 8], [1, 15], [14, 16], [18, 16], [30, 18], [1, 19], [12, 22]]);
  pts(m, 'T', [[31, 21], [3, 21], [26, 22]]);
  pts(m, ',', [[15, 2], [14, 8], [30, 1], [31, 6], [2, 15], [13, 15], [19, 18], [29, 15], [8, 22], [22, 22], [16, 22]]);
  return fin(m);
}
const giglia = {
  name: 'Giglia', region: 'Firenze', time: '15:15', music: 'giglia', weather: 'petals',
  tint: 'rgba(255,205,160,0.07)',
  pal: { grass: '#a3cf84', grass2: '#86b86a', path: '#e8d4b0', cobble: '#dfc9ab', cobble2: '#cfb796', plaza: '#efe2cc', plaza2: '#e3d3b8', water: '#7fbfcf', water2: '#d8f0f5', tree: '#7fbf6a', hedge: '#5f9f5a', marble: '#f3efe6', flowers: ['#b49af0', '#ffffff', '#f6a6c1'] },
  map: gigliaMap,
  spawn: { x: 17, y: 1, dir: 'down' },
  buildings: [
    { x: 20, y: 2, w: 7, h: 5, style: 'duomo', door: { x: 23, y: 6 }, talk: duomoTalk },
    { x: 28, y: 3, w: 4, h: 3, style: 'tuscan', wall: '#f5d39a', door: { x: 29, y: 5 }, talk: read('Una casetta color crema con le persiane verdi. Dalla finestra arriva il suono di un mandolino.') },
    { x: 15, y: 11, w: 1, h: 3, style: 'pvshops', walk: false },
    { x: 18, y: 11, w: 1, h: 3, style: 'pvshops', walk: false },
    { x: 3, y: 15, w: 4, h: 3, style: 'tuscan', wall: '#f0c98e', door: { x: 4, y: 17 }, talk: read('"Bottega del Cuoio". In vetrina c’è un portafoglio a forma di carota. Geo resiste alla tentazione.') },
    { x: 8, y: 15, w: 4, h: 3, style: 'gallery', door: { x: 9, y: 17 }, talk: read('"Galleria dei Ritratti". C’è un quadro di un coniglio con un sorriso misterioso. Si chiama "La Giocondiglia".') },
  ],
  resets: { gal: { x: 24, y: 20, dir: 'up' } },
  ents: () => [
    { id: 'gino', kind: 'npc', art: 'greyG', tx: flag('grey_calm') ? 15 : 16, ty: flag('grey_calm') ? 10 : 11, face: 1, happy: flag('grey_calm'), talk: greyTalk, noTurn: true },
    { id: 'lino', kind: 'npc', art: 'greyL', tx: flag('grey_calm') ? 18 : 17, ty: flag('grey_calm') ? 10 : 11, face: -1, happy: flag('grey_calm'), talk: greyTalk, noTurn: true },
    { id: 'lunardo', kind: 'npc', art: 'mole', tx: 20, ty: 8, face: 1, talk: lunardoTalk },
    { id: 'lalla', kind: 'npc', art: 'hare', tx: 26, ty: 9, dir: 'left', talk: chat('lalla', [
      'Mi fai una foto col Duomo? Grazie! ...Aspetta, è venuta storta. Più storta della torre di Pendolina!',
      'Sono in gita. Ho visto il Duomo, il Ponte Vecchio e quaranta gelaterie. Mi mancano solo trentanove gelaterie.',
    ]) },
    { id: 'pg1', kind: 'critter', art: 'pigeon', tx: 22, ty: 9, wander: 1.5, talk: chat('pigeon', ['Gru gru. Il Duomo l’abbiamo costruito noi piccioni. Più o meno. Diciamo che abbiamo supervisionato.']) },
    { id: 'pg2', kind: 'critter', art: 'pigeon', tx: 25, ty: 8, wander: 1.5, talk: chat('pigeon', ['Gru. (Becca una briciola di schiacciata con grande soddisfazione.)']) },
    { id: 'cat1', kind: 'critter', art: 'catGrey', tx: 6, ty: 19, wander: 1.5, talk: chat('cat', ['Miao. Mi chiamo Michelangelo. Non dipingo, ma dormo benissimo sui tetti.'], 'meow') },
    { id: 'liz1', kind: 'critter', art: 'lizard', tx: 30, ty: 20, wander: 1, talk: chat('lizard', ['Sssst. Sto prendendo il sole. Alle 15:15 il sole di Giglia è il più buono.']) },
    { id: 'sqr', kind: 'critter', art: 'squirrelRed', tx: 14, ty: 2, wander: 1.5, talk: chat('squirrelR', ['Squit! Nel labirinto di gigli c’è un aeroplanino. L’ingresso è sulla destra, in basso.']) },
    { id: 'bun', kind: 'critter', art: 'bunnyGrey', tx: 11, ty: 19, wander: 1, talk: chat('bunny', ['Dicono che dalla Galleria si veda il cortile delle statue. Le statue sono state spostate... da qualcuno molto disordinato.']) },
    { id: 'bf1', kind: 'deco', art: 'butterfly', tx: 7, ty: 6, butterfly: true, solid: false, col: '#b49af0' },
    { id: 'bf2', kind: 'deco', art: 'butterfly', tx: 29, ty: 17, butterfly: true, solid: false, col: '#ffffff' },
    { kind: 'lamp', tx: 15, ty: 9 }, { kind: 'lamp', tx: 19, ty: 9 }, { kind: 'lamp', tx: 15, ty: 21 }, { kind: 'lamp', tx: 28, ty: 9 },
    { id: 'stA', kind: 'block', style: 'marble', tx: 23, ty: 16, group: 'gal' },
    { id: 'stB', kind: 'block', style: 'marble', tx: 25, ty: 17, group: 'gal' },
    { kind: 'plate', tx: 21, ty: 15, group: 'gal' }, { kind: 'plate', tx: 27, ty: 18, group: 'gal' },
    { kind: 'deco', art: 'statue', variant: 'figure', tx: 22, ty: 18, solid: true, talk: read('Una statua elegantissima. Ha l’aria di chi non si sposta per nessuno.'), ph: 52 },
    { kind: 'deco', art: 'statue', variant: 'bunny', tx: 26, ty: 15, solid: true, talk: read('La statua di un coniglio pensatore. Pensa alle carote, probabilmente.'), ph: 52 },
    { kind: 'sign', tx: 25, ty: 21, talk: async () => {
      if (flag('gal_done')) { await say(null, '"Cortile delle Statue. Tutto in ordine, grazie!"'); return; }
      const c = await choice(null, '"Cortile delle Statue: rimettere i due piedistalli sui cuori." Vuoi riportare i piedistalli al punto di partenza?', ['No, grazie', 'Sì, ricomincia']);
      if (c === 1) resetPuzzle('gal');
    } },
    { id: 'gig_p1', kind: 'plane', msg: 6, tx: 3, ty: 3 },
    { id: 'gig_p2', kind: 'plane', msg: 7, tx: 23, ty: 8, cond: () => flag('duomo_done') },
    { id: 'gig_p3', kind: 'plane', msg: 8, tx: 24, ty: 17, cond: () => flag('gal_done') },
    { id: 'gl_gig_G', kind: 'glyph', ch: 'G', tx: 32, ty: 2 },
    { id: 'gl_gig_L', kind: 'glyph', ch: 'L', tx: 32, ty: 22 },
  ],
  triggers: [
    { x: 0, y: 20, w: 1, h: 1, run: async () => {
      if (planesGot() < 3) { await needPlanes(); await movePlayer(2, 20); return; }
      setFlag('gig_done');
      await travel('pendolina', { sub: 'a piedi, lungo il fiume' });
    } },
  ],
  async onEnter() {
    if (flag('arr_gig')) return;
    setFlag('arr_gig');
    await wait(0.5);
    await say('geo', 'Giglia! Quanti gigli... e quella cupola enorme laggiù!');
    await say('geo', 'Lollo una volta mi ha detto che qui anche i piccioni hanno un senso artistico.');
  },
  async onSolve(g) {
    if (g !== 'gal') return;
    burst(24 * T + 16, 17 * T, 'sparkle', 16); sfx('gate');
    await say(null, 'I piedistalli scattano al loro posto. Tra le statue appare un aeroplanino di carta!');
  },
  async onAllPlanes() { await say('geo', 'Ecco tutti gli aeroplanini di Giglia! La strada per Pendolina parte a sinistra, lungo il fiume.'); },
};
async function greyTalk() {
  if (flag('grey_calm')) { await say('gino', 'Buon viaggio!'); await say('lino', 'E saluta tanto Lollo!'); return; }
  const gino = ent('gino'), lino = ent('lino');
  sfx('woof'); emote(gino, '!'); emote(lino, '!');
  await say('gino', 'Alt! Io sono Gino.');
  await say('lino', 'E io sono Lino.');
  await say('gino', 'Insieme siamo...');
  await say('lino', '...Gino e Lino! G e L!');
  await say('geo', 'G e L? Come Geo e Lollo!');
  await say('gino', 'Davvero? Che coincidenza. Ad ogni modo: nessuno attraversa il Ponte Vecchio senza averci fatto le coccole.');
  await say('lino', 'Coccole sincronizzate. Una a lui e una a me, a tempo. Siamo molto precisi.');
  await mini('rhythm', { title: 'Coccole per Gino e Lino', sub: 'Due levrieri, il doppio delle coccole. Stai a tempo!', art: 'greyG', need: 5, speed: 1.0, zone: 0.22 });
  setFlag('grey_calm');
  gino.happy = true; lino.happy = true; emote(gino, 'heart'); emote(lino, 'heart');
  await say('lino', 'Ah, che sollievo. Prego, il ponte è tuo.');
  moveEnt(gino, 15, 10, 50);
  await moveEnt(lino, 18, 10, 50);
  gino.face = 1; lino.face = -1;
}
async function lunardoTalk() {
  if (flag('duomo_done')) { await say('lunardo', 'Hai fatto suonare il campanile! Lo dipingerò in un quadro: "Coniglietta che fa le cose al contrario".'); return; }
  if (!flag('lunardo1')) {
    setFlag('lunardo1');
    await say('lunardo', 'Buongiorno! Sono Lunardo, talpa pittrice. Ci vedo poco, ma dipingo benissimo.');
    await say('lunardo', 'Lo sapevi che l’orologio del Duomo gira al contrario? Tutti lo guardano e nessuno capisce che ore sono.');
  }
  await say('lunardo', 'Si dice che il campanile si apra solo a un’ora speciale: un’ora che si legge uguale anche al contrario...');
  await say('lunardo', '...e che comincia dal mezzogiorno. Ma io sono una talpa, eh. Magari ho capito male.');
}
async function duomoTalk() {
  if (flag('duomo_done')) { await say(null, 'Il grande orologio al contrario continua a ticchettare all’indietro.'); return; }
  await say(null, 'Sopra il portone c’è un grande orologio che gira al contrario. Sotto, una targa: "Imposta l’ora giusta e il campanile canterà".');
  const ok = await mini('clock', { title: 'L’orologio al contrario', sub: 'Quale ora si legge uguale nei due sensi?', start: '15:15', answer: '12:21', wrongMsg: 'Le lancette tornano indietro... non è l’ora giusta.' });
  if (!ok) return;
  setFlag('duomo_done');
  setClock('12:21');
  burst(23 * T + 16, 7 * T, 'sparkle', 18);
  await say(null, 'DONG! DONG! Le campane suonano a festa e dal campanile scende planando un aeroplanino di carta!');
  setClock('15:15');
}

// =====================================================================
//  4. PENDOLINA — Pisa (18:18)
// =====================================================================
function pisaMap() {
  const m = grid(34, 24);
  border(m, 'T');
  hl(m, 1, 32, 1, 'M');
  hl(m, 2, 32, 9, 'o');
  vl(m, 5, 7, 9, 'o'); vl(m, 13, 8, 9, 'o'); vl(m, 22, 8, 9, 'o');
  rect(m, 21, 11, 9, 6, 'M'); rect(m, 22, 12, 7, 4, '.'); m[11][25] = '.';
  vl(m, 31, 10, 22, 'o'); hl(m, 26, 31, 22, 'o');
  rect(m, 1, 19, 17, 2, ':'); rect(m, 1, 21, 17, 2, '~');
  pts(m, 'P', [[2, 15], [5, 14], [9, 16], [12, 14], [15, 16], [3, 18], [13, 18], [7, 12], [17, 13]]);
  pts(m, 'C', [[32, 3], [19, 2], [1, 8], [32, 15], [19, 18]]);
  pts(m, ',', [[8, 11], [16, 11], [3, 11], [20, 21], [11, 21], [24, 3], [18, 7], [23, 18]]);
  pts(m, '"', [[10, 12], [19, 15], [22, 22]]);
  pts(m, 'r', [[16, 20]]);
  return fin(m);
}
const pendolina = {
  name: 'Pendolina', region: 'Pisa', time: '18:18', music: 'pendolina', weather: 'leaves',
  tint: 'rgba(255,140,90,0.16)',
  pal: { grass: '#9fd38a', grass2: '#83bd70', path: '#ecd9b2', plaza: '#f6f2ea', plaza2: '#ebe4d8', water: '#7cbfdc', water2: '#e2f4fb', sand: '#f2dfae', tree: '#7cbf6a', marble: '#f5f1e8', flowers: ['#ffffff', '#ffd23f', '#f6a6c1'] },
  map: pisaMap,
  spawn: { x: 32, y: 9, dir: 'left' },
  buildings: [
    { x: 2, y: 3, w: 5, h: 4, style: 'baptistery', dark: true },
    { x: 9, y: 3, w: 9, h: 5, style: 'cathedral', door: { x: 13, y: 7 }, dark: true, talk: read('La cattedrale è bianchissima. Dentro, un coro di passerotti prova una canzone d’amore. Stonata, ma con passione.') },
    { x: 21, y: 4, w: 3, h: 4, style: 'tower', door: { x: 22, y: 7 }, lean: flag('torre_done') ? 0.07 : 0.14, talk: towerTalk },
    { x: 25, y: 19, w: 6, h: 3, style: 'station', door: { x: 27, y: 21 }, talk: stationTalk },
  ],
  resets: { torre: { x: 25, y: 10, dir: 'up' } },
  ents: () => [
    { id: 'piero', kind: 'npc', art: 'pigeon', tx: 20, ty: 9, face: 1, talk: chat('piero', [
      'Gru! Sono Piero, il piccione campanaro. Cioè, il campanaro è un altro, io gli sto solo sulla testa.',
      'Il campanaro canta sempre: "Ventuno e ventuno, e non sbaglia nessuno!". Chissà cosa vorrà dire.',
      'Prima di suonare la campana bisogna sistemare i contrappesi nel recinto qui sotto. Sennò la torre pende ancora di più!',
    ]) },
    { id: 'gabriella', kind: 'npc', art: 'seagull', tx: 11, ty: 19, face: -1, talk: chat('gabriella', [
      'Ciao bella! Sono Gabriella. Ho visto una cagnolina bianca a macchie correre sulla spiaggia con un foglio in bocca.',
      'Al tramonto il mare di Pendolina diventa tutto arancione. È il momento perfetto per pensare a qualcuno.',
    ]) },
    { id: 'tour1', kind: 'npc', art: 'bunnyBrown', tx: 19, ty: 6, dir: 'right', expr: 'happy', talk: chat('guido', [
      'Shh! Non distrarmi! Sto tenendo su la torre! Se mi muovo, cade tutto!',
      'Da quanto sono qui? Tre ore. Ma ne vale la pena: la foto verrà benissimo.',
    ]) },
    { id: 'mia2', kind: 'npc', art: 'mia', tx: 7, ty: 19, face: 1, cond: () => !flag('mia2'), talk: mia2Talk },
    { id: 'crab', kind: 'critter', art: 'frog', tx: 14, ty: 19, wander: 1, talk: chat('frog', ['Cra! Sono una rana di mare. Esistono, giuro. Sono molto rare. E molto salate.']) },
    { id: 'gull2', kind: 'critter', art: 'seagull', tx: 4, ty: 20, wander: 1.5, talk: chat('gabriella', ['Kiaa! Kiaa! (Ha l’aria di chi ruberebbe volentieri una focaccia.)']) },
    { id: 'pg1', kind: 'critter', art: 'pigeon', tx: 9, ty: 9, wander: 2, talk: chat('pigeon', ['Gru gru. Il prato dei Miracoli è il nostro posto preferito. Le briciole qui sono miracolose.']) },
    { id: 'sqr', kind: 'critter', art: 'squirrelRed', tx: 6, ty: 15, wander: 1.5, talk: chat('squirrelR', ['Squit! Nella pineta trovi pinoli buonissimi. E se cerchi bene, anche una lettera luccicante.']) },
    { id: 'hare', kind: 'critter', art: 'hare', tx: 27, ty: 7, wander: 1, talk: chat('lalla', ['Sono la cugina di Lalla! Anche lei ha fatto una foto storta? È un vizio di famiglia.']) },
    { kind: 'lamp', tx: 4, ty: 10 }, { kind: 'lamp', tx: 12, ty: 10 }, { kind: 'lamp', tx: 19, ty: 10 }, { kind: 'lamp', tx: 31, ty: 10 }, { kind: 'lamp', tx: 25, ty: 18 },
    { kind: 'deco', art: 'bench', tx: 9, ty: 18, solid: true, talk: read('Una panchina che guarda il mare. Il sole sta tramontando: sono le 18:18.') },
    { id: 'mbA', kind: 'block', style: 'marble', tx: 23, ty: 13, group: 'torre' },
    { id: 'mbB', kind: 'block', style: 'marble', tx: 25, ty: 14, group: 'torre' },
    { id: 'mbC', kind: 'block', style: 'marble', tx: 27, ty: 13, group: 'torre' },
    { kind: 'plate', tx: 22, ty: 15, group: 'torre' }, { kind: 'plate', tx: 24, ty: 15, group: 'torre' }, { kind: 'plate', tx: 28, ty: 15, group: 'torre' },
    { kind: 'sign', tx: 27, ty: 10, talk: async () => {
      if (flag('torre_done')) { await say(null, '"Contrappesi della Torre: sistemati. La torre ringrazia (e pende un po’ meno)."'); return; }
      const c = await choice(null, '"Contrappesi della Torre: spingere i tre blocchi sui cuori in basso." Vuoi rimettere i blocchi al loro posto?', ['No, grazie', 'Sì, ricomincia']);
      if (c === 1) resetPuzzle('torre');
    } },
    { id: 'pisa_p1', kind: 'plane', msg: 9, tx: 25, ty: 13, cond: () => flag('torre_done') },
    { id: 'pisa_p2', kind: 'plane', msg: 10, tx: 22, ty: 9, cond: () => flag('campana_done') },
    { id: 'pisa_p3', kind: 'plane', msg: 11, tx: 8, ty: 19, cond: () => flag('mia2') },
    { id: 'gl_pisa_G', kind: 'glyph', ch: 'G', tx: 1, ty: 17 },
    { id: 'gl_pisa_L', kind: 'glyph', ch: 'L', tx: 32, ty: 2 },
  ],
  async onEnter() {
    if (flag('arr_pisa')) return;
    setFlag('arr_pisa');
    await wait(0.5);
    await say('geo', 'Pendolina, al tramonto. Quella torre... pende davvero tantissimo!');
    await say('geo', 'Speriamo che non cada proprio adesso.');
  },
  async onSolve(g) {
    if (g !== 'torre') return;
    const b = G.buildings.find((x) => x.style === 'tower');
    sfx('gate');
    for (let i = 0; i < 25; i++) { b.lean = 0.14 - (0.07 * i) / 25; await wait(0.04); }
    burst(25 * T + 16, 13 * T, 'sparkle', 16);
    await say(null, 'Con i contrappesi al loro posto la torre si raddrizza un pochino... e dall’alto plana un aeroplanino!');
    await say('geo', 'Adesso pende "solo" il giusto.');
  },
  async onAllPlanes() { await say('geo', 'Tutti gli aeroplanini di Pendolina! Alla stazione, in basso a destra: si va ad Amor.'); },
};
async function towerTalk() {
  if (flag('campana_done')) { await say(null, 'La torre pende ancora, ma con molta più dignità.'); return; }
  if (!flag('torre_done')) { await say(null, 'Sulla porta c’è un cartello: "Chiuso finché la torre non smette di pendere così tanto. Sistemare i contrappesi nel recinto qui sotto".'); return; }
  await say(null, 'Accanto alla porta c’è un vecchio orologio fermo. Sotto c’è scritto: "La campana suona all’ora del campanaro".');
  const ok = await mini('clock', { title: 'L’orologio della Torre', sub: 'A che ora suona la campana?', start: '18:18', answer: '21:21', wrongMsg: 'Silenzio. Forse il campanaro canta un’altra ora...' });
  if (!ok) return;
  setFlag('campana_done');
  setClock('21:21');
  burst(22 * T + 16, 8 * T, 'sparkle', 16);
  await say(null, 'DIN DON DAN! La campana della torre suona così forte che da lassù cade giù un aeroplanino di carta.');
  await say('geo', '21:21... sembra un messaggio fatto apposta per me.');
  setClock('18:18');
}
async function stationTalk() {
  if (planesGot() < 3) { await needPlanes(); return; }
  await say(null, '"Treno regionale per Amor: in ritardo di 21 minuti." Ovviamente.');
  await say('geo', 'Va bene, aspetto. Ho aspettato tanto, cosa vuoi che siano 21 minuti.');
  setFlag('pisa_done');
  await travel('amor', { sub: 'in treno (con un po’ di ritardo)' });
}
async function mia2Talk(e) {
  sfx('woof'); emote(e, '!');
  await say('geo', 'Mia! Di nuovo tu? Mi stai seguendo?');
  await say('mia', 'Woof! Woof woof!');
  await say(null, 'Mia ha in bocca un altro aeroplanino. Si mette in posizione da gioco: stavolta i trucchi saranno più difficili!');
  await mini('memory', { title: 'Mia vuole giocare ancora!', sub: 'Trucchi più lunghi, stavolta', art: 'mia', rounds: [4, 5, 5], winMsg: 'Mia ti adora!' });
  setFlag('mia2');
  sfx('woof'); burst(e.x, e.y - 20, 'hearts', 10);
  await say(null, 'Mia lascia l’aeroplanino sulla sabbia, abbaia felice e corre via... verso Amor.');
  e.gone = true;
}

// =====================================================================
//  5. AMOR — Roma (21:21)
// =====================================================================
function amorMap() {
  const m = grid(34, 24);
  border(m, 'T');
  hl(m, 1, 33, 12, '-'); vl(m, 16, 1, 22, '-');
  rect(m, 4, 5, 9, 4, 'o'); vl(m, 8, 9, 11, '-');
  rect(m, 20, 8, 13, 3, 'o'); vl(m, 26, 11, 11, '-');
  rect(m, 2, 14, 12, 8, 'h'); rect(m, 3, 15, 10, 6, '.'); m[14][8] = '.'; vl(m, 8, 13, 13, '-');
  pts(m, 'O', [[3, 18], [4, 20], [12, 18], [11, 20], [3, 15], [12, 15]]);
  pts(m, 'L', [[5, 19], [10, 19], [6, 20], [9, 20]]);
  pts(m, 'P', [[1, 2], [14, 3], [19, 4], [32, 3], [32, 14], [18, 21], [31, 21], [14, 9]]);
  pts(m, 'C', [[1, 10], [18, 14], [24, 21]]);
  hl(m, 17, 32, 18, '-');
  pts(m, ',', [[3, 3], [13, 6], [18, 2], [31, 11], [21, 22], [29, 15], [15, 17], [4, 10], [12, 10]]);
  return fin(m);
}
const amor = {
  name: 'Amor', region: 'Roma', time: '21:21', music: 'amor', weather: 'fireflies', night: true,
  nightColor: 'rgba(24,22,70,0.55)',
  pal: { grass: '#8fc07a', grass2: '#76a865', cobble: '#d6b896', cobble2: '#c6a582', plaza: '#e6cfae', plaza2: '#dcc29e', tree: '#6fae62', hedge: '#4f8f55', water: '#7cc7e0', water2: '#d8f2fb', flowers: ['#ffffff', '#ffb3c8', '#ffd23f'] },
  map: amorMap,
  spawn: { x: 1, y: 12, dir: 'right' },
  buildings: [
    { x: 6, y: 2, w: 5, h: 3, style: 'fountain', door: { x: 8, y: 4 }, talk: fountainTalk, dark: true },
    { x: 22, y: 2, w: 9, h: 6, style: 'colosseum', dark: true },
    { x: 19, y: 15, w: 4, h: 3, style: 'tuscan', wall: '#f0a86e', shutters: '#5f8f5a', door: { x: 20, y: 17 }, talk: read('"Trattoria da Romoletto". Dalla finestra arriva profumo di carbonara e risate.') },
    { x: 25, y: 14, w: 5, h: 4, style: 'tuscan', wall: '#f2c48a', shutters: '#a85a4a', flowers: '#ff9ab8', door: { x: 27, y: 17 }, talk: read('Una casa coi gerani rosa sul balcone. Qualcuno dentro canta una serenata stonatissima.') },
  ],
  ents: () => [
    { id: 'romoletto', kind: 'npc', art: 'catGinger', tx: 21, ty: 18, face: -1, talk: chat('romoletto', [
      'Ao’, ’na coniglietta! Qua ad Amor de conigli ne vedemo pochi. De gatti, invece, quanti ne voi.',
      'Yumi? Er cugino grasso nostro, giù ner paese dei Marsi? Quello nun se move manco pe’ ’na lasagna. Anzi... pe’ ’na lasagna sì. O pe’ un tortellino.',
    ], 'meow') },
    { id: 'gnappetta', kind: 'npc', art: 'catCalico', tx: 11, ty: 7, face: -1, talk: gnappettaTalk },
    { id: 'pizzicotto', kind: 'npc', art: 'catBlack', tx: 18, ty: 9, face: 1, talk: chat('pizzicotto', [
      'Io porto fortuna. Gli altri dicono il contrario. Gli altri se sbajano.',
      'Ner giardino degli aranci, in fondo a sinistra, c’è ’na panchina speciale. Dicono che chi ce se siede se ricorda le cose più belle.',
    ], 'meow') },
    { id: 'mia3', kind: 'npc', art: 'mia', tx: 26, ty: 9, face: -1, cond: () => !flag('mia_joined'), talk: mia3Talk },
    { id: 'cat4', kind: 'critter', art: 'catGrey', tx: 24, ty: 9, wander: 1.5, talk: chat('cat', ['Miao. Er Colosseo è casa nostra. Voi lo chiamate monumento, noi lo chiamamo divano.'], 'meow') },
    { id: 'cat5', kind: 'critter', art: 'catCalico', tx: 30, ty: 13, wander: 1.5, talk: chat('gnappetta', ['Miao! Stasera c’è ’na luna che pare ’na mozzarella.'], 'meow') },
    { id: 'cat6', kind: 'critter', art: 'catBlack', tx: 5, ty: 11, wander: 1.5, talk: chat('pizzicotto', ['Prrr. (Si struscia sulla tua zampa e ti lascia addosso due chili di peli neri.)'], 'purr') },
    { id: 'pg1', kind: 'critter', art: 'pigeon', tx: 9, ty: 8, wander: 1.5, talk: chat('pigeon', ['Gru gru. Anche noi piccioni lanciamo le monetine. Poi però le ripeschiamo.']) },
    { id: 'hed', kind: 'critter', art: 'hedgehog', tx: 10, ty: 16, wander: 1, talk: chat('hedgehog', ['Psst. Questo giardino di notte è magico. Le lucciole dicono che qui è successo qualcosa di molto romantico.']) },
    { kind: 'lamp', tx: 3, ty: 11 }, { kind: 'lamp', tx: 13, ty: 11 }, { kind: 'lamp', tx: 15, ty: 6 }, { kind: 'lamp', tx: 17, ty: 15 }, { kind: 'lamp', tx: 21, ty: 11 }, { kind: 'lamp', tx: 31, ty: 11 }, { kind: 'lamp', tx: 4, ty: 6 }, { kind: 'lamp', tx: 12, ty: 4 }, { kind: 'lamp', tx: 29, ty: 19 },
    { kind: 'deco', art: 'statue', variant: 'wolf', tx: 13, ty: 9, solid: true, talk: read('La statua di una lupa con l’aria materna. Sotto c’è scritto: "Amor, città eterna. Roma, letta al contrario".'), ph: 50 },
    { kind: 'deco', art: 'bench', tx: 7, ty: 16, solid: true, talk: read('La panchina del giardino degli aranci. Da qui si vede tutta la città illuminata.') },
    { kind: 'deco', art: 'bench', tx: 9, ty: 16, solid: true, talk: read('La panchina del giardino degli aranci. Da qui si vede tutta la città illuminata.') },
    { id: 'amor_p1', kind: 'plane', msg: 12, tx: 8, ty: 6, cond: () => flag('fontana_done') },
    { id: 'amor_p2', kind: 'plane', msg: 13, tx: 25, ty: 10, cond: () => flag('mia_joined') },
    { id: 'amor_p3', kind: 'plane', msg: 14, tx: 8, ty: 18, cond: () => flag('kiss') },
    { id: 'gl_amor_G', kind: 'glyph', ch: 'G', tx: 32, ty: 9 },
    { id: 'gl_amor_L', kind: 'glyph', ch: 'L', tx: 12, ty: 19 },
  ],
  triggers: [
    { x: 6, y: 17, w: 5, h: 2, cond: () => !flag('kiss'), run: kissScene },
    { x: 33, y: 12, w: 1, h: 1, run: async () => {
      if (planesGot() < 3) { await needPlanes(); await movePlayer(31, 12); return; }
      setFlag('amor_done');
      await travel('marsi', { sub: 'in corriera, verso le montagne' });
    } },
  ],
  async onEnter() {
    if (flag('arr_amor')) return;
    setFlag('arr_amor');
    await wait(0.5);
    await say('geo', 'Amor... di notte è ancora più bella.');
    await say('geo', 'Qui io e Lollo ci siamo visti per la prima volta. Mi batte forte il cuore.');
  },
  async onAllPlanes() { await say('geo', 'Ho tutti gli aeroplanini di Amor. La corriera per la Terra dei Marsi parte a destra, in fondo alla strada.'); },
};
async function gnappettaTalk() {
  if (flag('fontana_done')) { await say('gnappetta', 'Visto? Er fontanone nun sbaja mai. Mo’ corri, che te stanno a aspettà!'); return; }
  if (has('moneta')) { await say('gnappetta', 'La monetina tirala ner fontanone, qui dietro. Mettite davanti alla vasca!'); return; }
  await say('gnappetta', 'Ciao bella! Vòi esprime un desiderio? Tieni, ’na monetina.');
  give('moneta'); sfx('pickup'); toast('Hai ricevuto: una monetina');
  await say('gnappetta', 'Tirala ner fontanone, de spalle, e er desiderio s’avvera. Garantito. Più o meno.');
}
async function fountainTalk() {
  if (flag('fontana_done')) { await say(null, 'L’acqua della fontana brilla sotto la luna. In fondo luccica la tua monetina.'); return; }
  if (!has('moneta')) { await say(null, 'Una fontana enorme, piena di monetine luccicanti. Si dice che chi ne lancia una torni sempre qui... Ma Geo non ha monete.'); return; }
  await say('geo', 'Mi giro di spalle... esprimo un desiderio... e lancio!');
  await mini('rhythm', { title: 'Lancia la monetina', sub: 'Tirala quando il cuore è nella zona!', art: 'geo', need: 1, speed: 1.1, zone: 0.16 });
  take('moneta'); setFlag('fontana_done'); sfx('splash');
  burst(8 * T + 16, 5 * T + 10, 'sparkle', 18);
  await say(null, 'PLIC! La monetina finisce dritta nella vasca... e dall’acqua salta fuori un aeroplanino di carta, asciuttissimo!');
  await say('geo', 'Il mio desiderio? Facile. Comincia con la L.');
}
async function mia3Talk(e) {
  sfx('woof');
  await say('geo', 'Mia! Sei arrivata fino ad Amor?');
  await say(null, 'Mia è stanca morta. Si siede, ti guarda con due occhioni enormi e ti porge da sola l’aeroplanino.');
  await say('geo', 'Ti sei persa? ...Vuoi venire con me? Andiamo dove c’è Lollo.');
  sfx('woof'); emote(e, 'heart'); burst(e.x, e.y - 20, 'hearts', 12);
  await say(null, 'Mia abbaia felice e si mette a scodinzolare al tuo fianco. Adesso Mia viaggia con te!');
  await say('geo', 'Mia di chi? Mia di Geo. Cioè... nostra.');
  setFlag('mia_joined');
  G.follower = { art: 'mia', x: e.x, y: e.y, face: -1, moving: false, t: 0 };
  e.gone = true;
}
async function kissScene() {
  await movePlayer(7, 18, 60);
  G.player.dir = 'right';
  await say('geo', 'Questa panchina... la conosco.');
  const ghost = spawn({ id: 'ghost', kind: 'npc', art: 'lollo', tx: 10, ty: 18, alpha: 0, face: -1, dir: 'left', solid: false });
  music('title');
  await fadeAlpha(ghost, 0, 0.75, 1.2);
  await say(null, 'Un ricordo prende forma, luminoso come le stelle sopra Amor.');
  await say('lollo', 'Ti ricordi? È stato proprio qui. Poco prima che tu partissi per la Terra dei Regni.');
  await say('geo', 'Come potrei dimenticarlo...');
  await moveEnt(ghost, 8, 18, 30);
  ghost.dir = 'left';
  await wait(0.5);
  sfx('heart');
  emote('player', 'heart', 2.5); emote(ghost, 'heart', 2.5);
  burst((G.player.x + ghost.x) / 2, G.player.y - 30, 'hearts', 24);
  await wait(1.2);
  await say(null, 'Il primo bacio.');
  await say('lollo', 'Adesso vieni a casa, coniglietta. Ti aspetto nella Terra dei Marsi.');
  await fadeAlpha(ghost, 0.75, 0, 1.2);
  ghost.gone = true;
  setFlag('kiss');
  music('amor');
  await say(null, 'Dove c’era il ricordo ora c’è un aeroplanino di carta.');
}

// =====================================================================
//  6. FUCINELLA — Terra dei Marsi (23:23)
// =====================================================================
function marsiMap() {
  const m = grid(34, 24);
  border(m, 'T');
  rect(m, 0, 0, 34, 2, 'm');
  pts(m, 'm', [[0, 2], [1, 2], [10, 2], [11, 2], [12, 2], [25, 2], [33, 2], [32, 2], [0, 3]]);
  vl(m, 24, 2, 22, '~'); m[11][24] = '_';
  hl(m, 2, 23, 11, '='); vl(m, 2, 11, 21, '=');
  hl(m, 25, 29, 11, '='); vl(m, 29, 7, 11, '=');
  vl(m, 6, 7, 10, '=');
  hl(m, 14, 21, 4, 'f'); hl(m, 14, 16, 9, 'f'); hl(m, 19, 21, 9, 'f'); vl(m, 14, 4, 9, 'f'); vl(m, 21, 4, 9, 'f');
  rect(m, 3, 13, 10, 6, 'c');
  vl(m, 13, 12, 13, '='); hl(m, 13, 22, 13, '='); vl(m, 22, 12, 13, '=');
  rect(m, 25, 13, 8, 2, 's');
  pts(m, 'S', [[26, 3], [26, 5], [32, 3], [32, 5], [26, 8], [32, 8], [27, 9], [31, 9]]);
  pts(m, 'P', [[1, 5], [9, 9], [12, 6], [1, 9], [23, 5], [27, 17], [31, 19], [26, 21], [32, 15], [20, 21], [4, 21], [11, 21]]);
  pts(m, 'r', [[10, 4], [13, 8], [23, 18], [28, 20]]);
  pts(m, ',', [[8, 9], [3, 10], [18, 12], [27, 12], [31, 12], [5, 20], [15, 20], [29, 16], [22, 9], [12, 3]]);
  pts(m, '"', [[19, 14], [10, 20], [30, 21], [25, 17]]);
  return fin(m);
}
const marsi = {
  name: 'Fucinella', region: 'Terra dei Marsi', time: '23:23', music: 'marsi', weather: 'fireflies', night: true,
  nightColor: 'rgba(20,24,66,0.6)',
  pal: { grass: '#98c47c', grass2: '#7fae67', path: '#e2cfa6', soil: '#a97a52', water: '#6fb3d6', water2: '#d8eefa', tree: '#5f9f62', fence: '#e9d8bf', mountain: '#8a91b8', flowers: ['#ffffff', '#ffd23f', '#b9a6f0'] },
  map: marsiMap,
  spawn: { x: 2, y: 20, dir: 'up' },
  lights: [{ x: 29, y: 7, r: 90 }],
  buildings: [
    { x: 3, y: 3, w: 6, h: 4, style: 'castle', talk: null },
    { x: 15, y: 15, w: 4, h: 3, style: 'stonehouse', door: { x: 16, y: 17 }, talk: read('Una casetta di pietra. Sulla porta un biglietto: "Lollo, se passi riportami la scala. Firmato: tua zia".') },
    { x: 19, y: 17, w: 4, h: 3, style: 'stonehouse', door: { x: 21, y: 19 }, talk: read('Dalla finestra si vede un tavolo apparecchiato per la cena: arrosticini, ovviamente.') },
    { x: 13, y: 15, w: 2, h: 2, style: 'clocktower', dark: true, door: { x: 13, y: 16 }, talk: read('La torre dell’orologio di Fucinella. Manca pochissimo alla mezzanotte...') },
    { x: 27, y: 3, w: 5, h: 4, style: 'lollohouse', door: { x: 29, y: 6 }, talk: null },
  ],
  resets: { pen: { x: 16, y: 13, dir: 'up' } },
  ents: () => [
    { id: 'gigi', kind: 'npc', art: 'bear', tx: 12, ty: 9, face: 1, talk: gigiTalk, ph: 46 },
    { id: 'lilli', kind: 'npc', art: 'chamois', tx: 7, ty: 8, face: -1, talk: lilliTalk, ph: 46 },
    { id: 'gelsomina', kind: 'npc', art: 'hare', tx: 9, ty: 15, dir: 'left', talk: gelsominaTalk },
    { id: 'yumi', kind: 'npc', art: 'yumi', tx: flag('yumi_done') ? 22 : 24, ty: flag('yumi_done') ? 9 : 11, scale: 1.45, sleep: true, bw: 17, bh: 15, ph: 50, face: -1, noTurn: true, talk: yumiTalk },
    { kind: 'deco', art: 'rug', tx: 22, ty: 9, solid: false },
    { id: 'villager', kind: 'npc', art: 'bunnyBrown', tx: 18, ty: 14, dir: 'down', talk: chat('bunnyB', [
      'Tu devi essere Geo! Lollo parla solo di te. Guarda l’orologio ogni cinque minuti.',
      'La casa di Lollo è di là dal ponte, a destra. Ma sul ponte dorme Yumi... auguri.',
    ]) },
    { id: 'hed', kind: 'critter', art: 'hedgehog', tx: 11, ty: 19, wander: 1.5, talk: chat('hedgehog', ['Di notte qui è pieno di lucciole. E di ricci. Soprattutto di ricci. Cioè io.']) },
    { id: 'frog1', kind: 'critter', art: 'frog', tx: 23, ty: 15, wander: 0.6, talk: chat('frog', ['Cra! Il ruscello è freddo, ma il cuore è caldo. Proverbio delle rane marsicane.']) },
    { id: 'frog2', kind: 'critter', art: 'frog', tx: 25, ty: 19, wander: 0.6, talk: chat('frog', ['Cra cra! (Ti fa l’occhiolino. Le rane di qui sono molto romantiche.)']) },
    { id: 'sqr', kind: 'critter', art: 'squirrelRed', tx: 4, ty: 9, wander: 1.5, talk: chat('squirrelR', ['Squit! Il castello è vecchissimo. Lilli dice che chi risponde ai suoi indovinelli trova un tesoro di carta.']) },
    { id: 'bun2', kind: 'critter', art: 'bunnyGrey', tx: 5, ty: 12, wander: 1, talk: chat('bunny', ['Benvenuta a Fucinella! Qui le carote crescono a perdita d’occhio. È il paradiso dei conigli.']) },
    { kind: 'lamp', tx: 3, ty: 10 }, { kind: 'lamp', tx: 10, ty: 10 }, { kind: 'lamp', tx: 19, ty: 10 }, { kind: 'lamp', tx: 23, ty: 12 }, { kind: 'lamp', tx: 28, ty: 10 }, { kind: 'lamp', tx: 3, ty: 19 }, { kind: 'lamp', tx: 12, ty: 14 },
    { kind: 'deco', art: 'busstop', label: 'BUS', tx: 1, ty: 20, solid: true, talk: read('"Fermata: Fucinella. Prossima corsa: domani mattina." Non si torna indietro!') },
    { kind: 'deco', art: 'scarecrow', tx: 4, ty: 17, solid: true, talk: read('Uno spaventapasseri con un sorriso storto. I corvi non hanno paura di lui: gli vogliono bene.') },
    { id: 'carrot', kind: 'deco', art: 'carrot', tx: 7, ty: 16, solid: true, pull: flag('carota_done') ? 1 : 0, talk: gelsominaTalk },
    { kind: 'deco', art: 'haystack', tx: 12, ty: 5, solid: true },
    { kind: 'deco', art: 'pot', tx: 28, ty: 7, col: '#ffd23f' }, { kind: 'deco', art: 'pot', tx: 30, ty: 7, col: '#f06d8f' },
    { id: 'shA', kind: 'block', style: 'sheep', tx: 17, ty: 11, group: 'pen' },
    { id: 'shB', kind: 'block', style: 'sheep', tx: 18, ty: 12, group: 'pen' },
    { id: 'shC', kind: 'block', style: 'sheep', tx: 15, ty: 11, group: 'pen' },
    { kind: 'plate', tx: 17, ty: 5, group: 'pen', style: 'hay' }, { kind: 'plate', tx: 20, ty: 7, group: 'pen', style: 'hay' }, { kind: 'plate', tx: 15, ty: 6, group: 'pen', style: 'hay' },
    { kind: 'sign', tx: 20, ty: 12, talk: async () => {
      if (flag('pen_done')) { await say(null, '"Recinto di Gigi. Pecore: 3. Pecore felici: 3."'); return; }
      const c = await choice(null, '"Recinto di Gigi. Spingere le pecore sulle balle di fieno." Vuoi riportare le pecore al punto di partenza?', ['No, grazie', 'Sì, ricomincia']);
      if (c === 1) resetPuzzle('pen');
    } },
    { id: 'marsi_p1', kind: 'plane', msg: 15, tx: 13, ty: 10, cond: () => flag('pen_done') },
    { id: 'marsi_p2', kind: 'plane', msg: 16, tx: 8, ty: 9, cond: () => flag('lilli_done') },
    { id: 'marsi_p3', kind: 'plane', msg: 17, tx: 9, ty: 17, cond: () => flag('carota_done') },
    { id: 'gl_marsi_G', kind: 'glyph', ch: 'G', tx: 13, ty: 4 },
    { id: 'gl_marsi_L', kind: 'glyph', ch: 'L', tx: 32, ty: 12 },
  ],
  triggers: [
    { x: 28, y: 7, w: 3, h: 3, cond: () => flag('yumi_done') && !flag('reunion'), run: reunion },
  ],
  async onEnter() {
    if (flag('arr_marsi')) return;
    setFlag('arr_marsi');
    await wait(0.5);
    await say('geo', 'La Terra dei Marsi... si sente già profumo di casa.');
    await say('geo', 'Guarda, Mia: le 23:23! Esprimo un desiderio: arrivare da Lollo prima di mezzanotte.');
    sfx('woof');
    await say('mia', 'Woof!');
  },
  async onSolve(g) {
    if (g !== 'pen') return;
    sfx('baa'); burst(17 * T + 16, 6 * T, 'hearts', 14);
    await say('gigi', 'Tutte e tre a casa! Grazie, coniglietta! Guarda: un aeroplanino era rimasto impigliato nella lana di una pecora.');
  },
  async onAllPlanes() {
    await say('geo', 'Tutti e diciotto gli aeroplanini di Lollo! Adesso devo solo attraversare il ponte...');
    await say('geo', '...se solo non ci fosse sopra quel gattone arancione.');
  },
};
async function gigiTalk() {
  if (flag('pen_done')) { await say('gigi', 'Le pecore dormono tranquille. Anch’io andrei a dormire... ma gli orsi marsicani fanno il turno di notte.'); return; }
  if (!flag('gigi1')) {
    setFlag('gigi1');
    await say('gigi', 'GRRR! ...Cioè, buonasera! Scusa, mi viene così. Sono Gigi, orso marsicano e pastore a tempo perso.');
    await say('gigi', 'Le mie pecore sono scappate dal recinto. Quando provo a riportarle dentro scappano: dicono che faccio paura. Io!');
    await say('gigi', 'Potresti spingerle tu sulle balle di fieno nel recinto? Sono tre. Basta camminarci contro, sono pecore molto accomodanti.');
    return;
  }
  await say('gigi', 'Spingile dentro dall’apertura in basso, una alla volta. Se si incastrano, il cartello qui vicino rimette tutto a posto.');
}
const RIDDLES = [
  { q: 'Prima domanda: quante lettere ci sono tra la G e la L?', a: ['Due', 'Quattro', 'Sette'], ok: 1 },
  { q: 'Seconda domanda: qual è l’ora più magica per esprimere un desiderio?', a: ['12:34', '23:23', '17:05'], ok: 1 },
  { q: 'Terza domanda: dove si dice che un coniglietto e una coniglietta si siano dati il primo bacio?', a: ['A Lacci', 'A Pendolina', 'Ad Amor'], ok: 2 },
];
async function lilliTalk() {
  if (flag('lilli_done')) { await say('lilli', 'Tre risposte giuste su tre! Il castello ti saluta, coniglietta saggia.'); return; }
  if (!flag('lilli1')) {
    setFlag('lilli1');
    await say('lilli', 'Salve, viaggiatrice! Sono Lilli, camoscia custode del castello.');
    await say('lilli', 'Il castello custodisce un aeroplanino di carta. Lo darò solo a chi risponde ai miei tre indovinelli!');
  }
  for (const r of RIDDLES) {
    for (;;) {
      const c = await choice('lilli', r.q, r.a);
      if (c === r.ok) { sfx('select'); await say('lilli', ['Esatto!', 'Giusto!', 'Bravissima!'][RIDDLES.indexOf(r)]); break; }
      sfx('fail');
      await say('lilli', 'Mmm, no. Pensaci meglio!');
    }
  }
  setFlag('lilli_done');
  sfx('success'); burst(8 * T + 16, 9 * T, 'sparkle', 16);
  await say('lilli', 'Hai risposto a tutto! Il tesoro di carta è tuo.');
}
async function gelsominaTalk() {
  const c = ent('carrot');
  if (flag('carota_done')) { await say('gelsomina', 'Che carota, eh? La farò a fette per un mese intero. Grazie, cara!'); return; }
  if (!flag('gels1')) {
    setFlag('gels1');
    await say('gelsomina', 'Oh, una coniglietta forestiera! Sono Zia Gelsomina. Mi daresti una zampa?');
    await say('gelsomina', 'Questa carota è cresciuta troppo: non riesco a tirarla fuori da sola. E mi sa che sotto c’è incastrato qualcosa di carta...');
  }
  await say('gelsomina', 'Al mio tre tiriamo insieme! Uno... due... TRE!');
  await mini('rhythm', { title: 'Tira la carota!', sub: 'Tira forte quando il cuore è nella zona', art: 'hare', need: 4, speed: 1.0, zone: 0.22 });
  setFlag('carota_done');
  sfx('success');
  for (let i = 0; i <= 15; i++) { c.pull = i / 15; await wait(0.03); }
  burst(c.x, c.y - 20, 'sparkle', 16);
  await say(null, 'POP! Viene fuori una carota gigantesca! E sotto, nella terra, c’è un aeroplanino di carta.');
  await say('gelsomina', 'Che carotona! Lollo ne andrebbe matto. Salutamelo, quel nipote adottivo!');
}
async function yumiTalk(e) {
  if (flag('yumi_done')) { sfx('purr'); await say(null, 'Yumi dorme beato sul suo tappeto, a pancia all’aria. Fa le fusa nel sonno.'); return; }
  if (planesGot() < 3) {
    sfx('purr');
    await say(null, 'Un gattone arancione enorme dorme sul ponte, a pancia in su. Russa come un trattore.');
    await say('geo', 'Meglio non svegliarlo... almeno finché non ho trovato tutti gli aeroplanini di Lollo.');
    return;
  }
  music('tense');
  await say('geo', 'Ehm... scusi? Signor Gatto? Dovrei passare...');
  e.sleep = false; sfx('meow'); emote(e, '!');
  await say('yumi', 'Mrrrrh. Chi osa svegliare Yumi, Custode del Ponte e del Divano?');
  await say('geo', 'Sono Geo! Lollo mi aspetta, proprio di là!');
  await say('yumi', 'Lollo? Quello che mi dà le crocchette? Hmph. Il ponte è mio. Ci dormo da tre ore: è un record.');
  await say('yumi', 'Se vuoi passare, dovrai superare le Tre Prove di Yumi.');
  await say('yumi', 'Prima prova: la fame. Yumi ha fame. E Yumi NON mangia carote, prima che tu lo chieda.');
  if (has('tortellino')) {
    await say('geo', 'E... un Tortellino d’Oro di Nonna Gilda?');
    emote(e, 'heart'); sfx('meow');
    await say('yumi', '...un TORTELLINO? Dammelo. Subito. Per favore.');
    take('tortellino');
    sfx('purr');
    await say(null, 'Yumi divora il Tortellino d’Oro in un solo boccone. Fa le fusa così forte che il ponte vibra.');
    await say('geo', 'Grazie, Nonna Gilda...');
  } else {
    await say('geo', 'Ho solo... un sacco di affetto?');
    await say('yumi', 'Mmh. Accettabile. Per stavolta.');
  }
  await say('yumi', 'Seconda prova: lo stretching. Copia i movimenti di Yumi, se ci riesci.');
  await mini('memory', { title: 'Lo stretching di Yumi', sub: 'Copia i movimenti del gattone', art: 'yumi', rounds: [4, 5, 6], artScale: 0.75, winMsg: 'Yumi è colpito. Non lo ammetterà mai.' });
  await say('yumi', 'Mmh. Flessibile, per essere una coniglietta.');
  await say('yumi', 'Terza prova: Yumi ha mangiato e si è stirato. Ora Yumi ha sonno. Cantagli una ninna nanna.');
  await mini('rhythm', { title: 'Ninna nanna per Yumi', sub: 'Accarezza il pancione a tempo di musica', art: 'yumi', need: 5, speed: 0.9, sleepy: true, artScale: 0.75, zoneCol: '#d6d2f2' });
  e.sleep = true; sfx('purr');
  await say(null, 'Yumi crolla in un sonno profondissimo... sempre in mezzo al ponte, ovviamente.');
  await say('geo', 'Oh no. E adesso come passo?');
  const f = G.follower;
  if (f) {
    sfx('woof');
    await say('mia', 'Woof!');
    f.path = { x: 23 * T + 16, y: 11 * T + 26, speed: 70, r: null };
    await wait(0.9);
    await say(null, 'Mia si avvicina a Yumi e, con il nasino, gli dà una spintarella gentile...');
  }
  await moveEnt(e, 23, 10, 25);
  await moveEnt(e, 22, 9, 25);
  e.face = 1;
  sfx('purr');
  await say(null, '...e Yumi rotola, dormendo, giù dal ponte fino al tappeto morbido. Non si è neanche svegliato.');
  setFlag('yumi_done');
  music('marsi');
  if (f) { await say('geo', 'Mia, sei la cagnolina migliore del mondo!'); await say(null, 'Mia scodinzola, molto fiera di sé.'); }
  await say('geo', 'La strada è libera. Lollo, sto arrivando!');
}
async function reunion() {
  setFlag('reunion');
  await movePlayer(29, 9, 50);
  G.player.dir = 'up';
  await say('geo', 'Eccola... la casa di Lollo.');
  setClock('23:59');
  await wait(0.8);
  await say(null, 'Laggiù, l’orologio di Fucinella sta per segnare la mezzanotte...');
  setClock('00:00');
  sfx('chime');
  await wait(2.2);
  await say(null, '00:00. Esprimi un desiderio.');
  await say('geo', 'Non serve. Si sta già avverando.');
  music('title');
  const lollo = spawn({ id: 'lollo', kind: 'npc', art: 'lollo', tx: 29, ty: 7, dir: 'down', solid: false, alpha: 0 });
  sfx('gate');
  await fadeAlpha(lollo, 0, 1, 0.5);
  await say('lollo', 'Geo...?');
  await say('geo', 'Lollo!');
  await moveEnt(lollo, 29, 8, 40);
  lollo.dir = 'down';
  sfx('heart');
  emote('player', 'heart', 3); emote(lollo, 'heart', 3);
  burst(G.player.x, G.player.y - 30, 'hearts', 30);
  if (G.follower) { G.follower.path = { x: 28 * T + 16, y: 9 * T + 26, speed: 60, r: null }; }
  await wait(1.4);
  await say('lollo', 'Sei arrivata davvero. Dalla Terra dei Regni, sopra il mare, fino a qui.');
  await say('geo', 'Ho seguito i tuoi aeroplanini. Tutti e diciotto.');
  if (G.follower) {
    await say('lollo', 'E... chi è questa signorina a macchie?');
    sfx('woof');
    await say('geo', 'Lei è Mia. Mia di chi? Mia nostra.');
  }
  await say('lollo', 'Allora ne manca solo uno. L’ultimo aeroplanino... questo te lo do a mano.');
  await say(null, 'Lollo ti porge una lettera, piegata con cura a forma di aeroplanino.');
  await ending();
}

// ---------------- esportazioni ----------------
export const ZONES = { lacci, tortellandia, giglia, pendolina, amor, marsi };
export const FIRST = 'lacci';
