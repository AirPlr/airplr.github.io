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
- Lo stato (colonna `Stato`) si aggiorna a mano da te, direttamente nel foglio
  (es. `Ricevuta` → `In corso` → `Completata`).

## Setup (una tantum)

1. **Crea il Google Sheet**
   - Vai su [sheets.new](https://sheets.new), dagli un nome (es. "Richieste Prenota").

2. **Aggiungi lo script**
   - Nel foglio: `Estensioni` → `Apps Script`.
   - Cancella il contenuto di `Codice.gs` e incolla il contenuto di
     [`apps-script/Code.gs`](apps-script/Code.gs) di questo repo.
   - Salva (icona dischetto o `Ctrl+S`).

3. **Inizializza il foglio**
   - Nella toolbar dell'editor Apps Script, scegli la funzione `setup` dal
     menu a tendina e premi ▶️ Esegui.
   - La prima volta ti chiederà l'autorizzazione: accetta (è il tuo script,
     sul tuo account).
   - Torna sul foglio: dovresti vedere una scheda "Richieste" con le intestazioni.

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

Apri il Google Sheet, trova la riga con il codice giusto, modifica la colonna
`Stato` (testo libero, es. `Ricevuta`, `In corso`, `In attesa di risposta`,
`Completata`). La persona che ha il codice lo vedrà al prossimo controllo
sulla pagina.

## Ridistribuire dopo una modifica allo script

Se modifichi `Code.gs` in futuro, devi ripubblicare: `Distribuisci` →
`Gestisci implementazioni` → icona matita sulla implementazione esistente →
`Nuova versione` → `Distribuisci`. L'URL resta lo stesso, non serve
aggiornare `index.html`.

## Note

- Quota email giornaliera di un account Gmail personale: ~100 email/giorno
  tramite `MailApp` — ampiamente sufficiente per questo volume.
- Se il modulo mostra un avviso di configurazione mancante, significa che
  `SCRIPT_URL` non è ancora stato impostato (punto 5).
