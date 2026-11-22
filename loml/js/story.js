// ============================================================
//  TESTI PERSONALIZZABILI
//  Qui puoi modificare liberamente: introduzione, messaggi degli
//  aeroplanini e la lettera finale. (I dialoghi dei personaggi
//  sono in maps.js, zona per zona.)
// ============================================================

export const INTRO = [
  { scene: 'lacci', text: 'C’era una volta, nella lontana Terra dei Regni, una coniglietta di nome Geo.' },
  { scene: 'marsi', text: 'Dall’altra parte del mare, nella Terra dei Marsi, un coniglietto di nome Lollo guardava la luna e contava i giorni.' },
  { scene: 'planes', text: 'Si erano conosciuti in un modo tutto loro: lanciandosi aeroplanini di carta attraverso la grande Rete, a orari impossibili.' },
  { scene: 'wind', text: 'Ma una mattina il vento dei Regni ha sparpagliato gli ultimi aeroplanini di Lollo per tutto il villaggio di Lacci...' },
  { scene: 'end', text: '...e Geo ha deciso: è ora di tornare a casa. Da lui.' },
];

// Un messaggio per ogni aeroplanino (3 per zona, in ordine di zona).
export const PLANES = [
  // Lacci
  'Primo aeroplanino lanciato nella Rete. Se lo trovi... ciao! Sono Lollo. Mi piace un sacco come scrivi.',
  'Sono le 00:00. Tutti dormono e io sono ancora qui a scriverti. Strano, eh? Non mi sembra strano per niente.',
  'Oggi ho visto un girasole e ho pensato: si gira sempre verso la luce. Io mi giro verso il telefono, quando scrivi tu.',
  // Tortellandia
  'Ore 12:12. Desiderio: un pranzo con te. Anche solo un panino. Va bene anche senza panino.',
  'G come Geo, L come Lollo. Tra la G e la L ci sono solo quattro lettere: H, I, J, K. Praticamente niente.',
  'Ho provato a contare i chilometri tra noi. Poi ho smesso: tanto li faccio tutti.',
  // Giglia
  'Ore 23:23. Ho espresso un desiderio. Non te lo dico, ma comincia con la G.',
  'Ogni volta che il telefono vibra spero che sia tu. Il 90% delle volte è mia nonna. Il 10% sei tu, ed è il 10% più bello della giornata.',
  'Il giglio è il fiore di questa città, il girasole è il tuo fiore. E tu sei il mio.',
  // Pendolina
  'Anche la torre pende. Io pendo verso di te. Qui pende un po’ tutto.',
  'Ore 21:21: ti penso. Ore 21:22: ti penso ancora. A quanto pare funziona anche con gli orari normali.',
  'Quando torni ti aspetto con una coperta, un film e decisamente troppi snack.',
  // Amor
  'Roma letta al contrario fa Amor. Qualcuno lo sapeva da sempre.',
  'Qui ti ho vista dal vivo per la prima volta. Più bella di qualsiasi foto, videochiamata o aeroplanino.',
  'Il primo bacio. Me lo ricordo meglio di qualsiasi altra cosa. Anche meglio del mio numero di telefono.',
  // Terra dei Marsi
  'Benvenuta nella Terra dei Marsi! Qui le carote crescono a perdita d’occhio. Ne ho messe da parte alcune per te.',
  '23:23. Ci sei quasi. Ti sento arrivare.',
  'Ultimo aeroplanino. Da domani non ne servono più: le cose te le dico di persona.',
];

// ============================================================
//  LETTERA FINALE (bozza: cambiala come vuoi!)
//  Le righe vuote separano i paragrafi.
// ============================================================
export const LETTER = `Cara Geo,

se stai leggendo questa lettera vuol dire che sei arrivata fino in fondo. Hai attraversato la Terra dei Regni, hai volato sopra il mare su un aeroplanino di carta, hai calmato cani, convinto pecore e girasoli, e sei persino riuscita a spostare Yumi (cosa che nemmeno io sono mai riuscito a fare). E sei arrivata qui. Da me.

Ci siamo conosciuti nel modo più strano del mondo: attraverso uno schermo, un messaggio dopo l'altro, spesso a orari assurdi. Eppure fin dall'inizio mi è sembrato di conoscerti da sempre. Ogni notifica col tuo nome era un aeroplanino di carta che atterrava proprio dove serviva.

Poi c'è stata Roma. Vederti per la prima volta davvero, senza niente in mezzo. E quel primo bacio, che mi porto dietro ovunque vada.

Lo so che la distanza a volte pesa, che i chilometri sono tanti e che i "buonanotte" scritti non sono come quelli detti all'orecchio. Ma a ogni 23:23, a ogni 21:21, a ogni 00:00, il mio desiderio è sempre lo stesso, e comincia con la G.

Tra la G e la L ci sono solo quattro lettere. Tra noi, d'ora in poi, voglio che ci sia ancora meno.

Sei il mio girasole: io mi giro sempre verso di te.

Ti amo,
il tuo Lollo`;
