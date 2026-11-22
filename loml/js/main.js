import { init } from './engine.js';
import { ZONES, SPEAKERS, FIRST } from './maps.js';
import { INTRO, PLANES, LETTER } from './story.js';

async function boot() {
  try {
    await Promise.race([
      Promise.all([document.fonts.load('600 20px Fredoka'), document.fonts.load('500 20px Caveat')]),
      new Promise((r) => setTimeout(r, 2500)),
    ]);
  } catch (_) { /* i font di riserva vanno bene lo stesso */ }
  const l = document.getElementById('loading');
  if (l) l.remove();
  init({ zones: ZONES, speakers: SPEAKERS, story: { intro: INTRO, planes: PLANES, letter: LETTER }, first: FIRST });
}
boot();
