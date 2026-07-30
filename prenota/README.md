# /prenota/ — Richiedi un Servizio

Pagina statica per ricevere richieste di servizi (grafica, video editing, sviluppo
software, assistenza tecnica) da amici e parenti, con codice di riferimento
personale per controllare lo stato in seguito. Nessun pagamento online: si
gestisce tutto a mano, come sempre.

## Come funziona

- `index.html` è una pagina statica (nessuna build) che invia le richieste e
  legge lo stato tramite un piccolo backend gratuito su Google Apps Script.
- I dati vivono in un Google Sheet. Ogni riga è una richiesta con un codice
  univoco (es. `PRQ-4F7K92`). Solo chi ha il codice può vedere lo stato di
  *quella* richiesta — nessuno vede le richieste altrui.
- Lo stato si aggiorna a mano da te, nella colonna `Stato`: è un menu a tendina
  con tre valori — `Ricevuta` → `Iniziata` → `Completata`. Quando selezioni
  `Iniziata` lo script registra da solo la data/ora in `Iniziata il`; quando
  selezioni `Completata` registra `Completata il` e calcola `Tempo impiegato`
  (differenza tra le due date, es. `2g 3h 15m`). Non serve scrivere nulla a
  mano in quelle colonne.
- Chi invia la richiesta può allegare fino a 5 immagini (max 5MB l'una). Vengono
  caricate su Google Drive, nella cartella `Richieste Prenota - Allegati`, in
  una sottocartella con il nome del codice richiesta (es. `PRQ-4F7K92`). Il
  link alla cartella arriva nella tua email di notifica ed è salvato anche
  nella colonna `Allegati` del foglio.

## Setup (una tantum)

1. **Crea il Google Sheet**
   - Vai su [sheets.new](https://sheets.new), dagli un nome (es. "Richieste Prenota").

2. **Aggiungi lo script**
   - Nel foglio: `Estensioni` → `Apps Script`.
   - Cancella il contenuto di `Codice.gs` e incolla il contenuto di
     [`apps-script/Code.gs`](apps-script/Code.gs) di questo repo.
   - Salva (icona dischetto o `Ctrl+S`).

3. **Inizializza il foglio**
   - ⚠️ Solo per un foglio nuovo/vuoto: `setup()` cancella tutte le righe
     esistenti. Se hai già richieste salvate, salta questo passaggio e segui
     invece [Migrare un foglio già in uso](#migrare-un-foglio-già-in-uso).
   - Nella toolbar dell'editor Apps Script, scegli la funzione `setup` dal
     menu a tendina e premi ▶️ Esegui.
   - La prima volta ti chiederà l'autorizzazione: accetta (è il tuo script,
     sul tuo account).
   - Torna sul foglio: dovresti vedere una scheda "Richieste" con le intestazioni
     e il menu a tendina già impostato sulla colonna `Stato`.

4. **Distribuisci come Web App**
   - Nell'editor Apps Script: `Distribuisci` → `Nuova implementazione`.
   - Tipo: `App web`.
   - Configurazione:
     - **Esegui come:** Me (il tuo account)
     - **Chi ha accesso:** Chiunque
   - Premi `Distribuisci`, autorizza di nuovo se richiesto.
   - Copia l'**URL dell'app web** che ti viene mostrato (finisce con `/exec`).

5. **Collega la pagina**
   - Apri `prenota/index.html` in questo repo.
   - Trova la riga:
     ```js
     const SCRIPT_URL = "PASTE_YOUR_APPS_SCRIPT_WEB_APP_URL_HERE";
     ```
   - Sostituiscila con l'URL copiato al punto 4.
   - Fai commit e push: la pagina è live su `airplr.github.io/prenota/`.

## Aggiornare una richiesta

Apri il Google Sheet, trova la riga con il codice giusto e scegli il nuovo
valore dal menu a tendina della colonna `Stato` (`Ricevuta` → `Iniziata` →
`Completata`). Le colonne `Iniziata il`, `Completata il` e `Tempo impiegato`
si aggiornano da sole. La persona che ha il codice vedrà il nuovo stato (e i
tempi) al prossimo controllo sulla pagina.

## Migrare un foglio già in uso

Se hai già un foglio "Richieste" con dati veri, **non eseguire `setup()`**
(cancellerebbe tutto). Aggiorna invece la struttura a mano, una volta sola:

1. Incolla il nuovo `Code.gs` nell'editor Apps Script (sovrascrivi il vecchio) e salva.
2. Nel foglio, individua la colonna `Aggiornato` (l'ultima, prima di questa
   modifica). Click destro sulla lettera di colonna → **Inserisci 3 colonne
   a sinistra**.
3. Intitola le 3 nuove colonne, nell'ordine: `Iniziata il`, `Completata il`,
   `Tempo impiegato`. (La colonna `Aggiornato` si sposta automaticamente a
   destra con i suoi dati intatti.)
4. Aggiungi una colonna dopo `Aggiornato` con intestazione `Allegati`.
5. Seleziona la colonna `Stato` (dalla riga 2 in giù) → `Dati` → `Validazione
   dati` → `Aggiungi regola` → tipo "Elenco di elementi": `Ricevuta, Iniziata,
   Completata` → **Rifiuta l'inserimento** → Fatto.
6. Ridistribuisci lo script come nuova versione (vedi sotto).

Le richieste esistenti restano intatte; le nuove colonne si popolano da quel
momento in poi, quando cambi lo `Stato`.

## Ridistribuire dopo una modifica allo script

Se modifichi `Code.gs` in futuro, devi ripubblicare: `Distribuisci` →
`Gestisci implementazioni` → icona matita sulla implementazione esistente →
`Nuova versione` → `Distribuisci`. L'URL resta lo stesso, non serve
aggiornare `index.html`.

La prima volta che pubblichi la versione con gli allegati, Google potrebbe
chiederti di autorizzare di nuovo lo script (per l'accesso a Google Drive):
accetta, è sempre il tuo account.

## Note

- Quota email giornaliera di un account Gmail personale: ~100 email/giorno
  tramite `MailApp` — ampiamente sufficiente per questo volume.
- Se il modulo mostra un avviso di configurazione mancante, significa che
  `SCRIPT_URL` non è ancora stato impostato (punto 5).
