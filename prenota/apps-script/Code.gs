/**
 * Backend per il modulo "Richiedi un Servizio" (airplr.github.io/prenota/).
 * Vive dentro un Google Sheet come script legato al foglio (Estensioni > Apps Script).
 * Vedi prenota/README.md per le istruzioni di deploy complete.
 */

const SHEET_NAME = 'Richieste';
const HEADERS = ['Timestamp', 'Codice', 'Nome', 'Email', 'Servizio', 'Descrizione', 'Note', 'Stato', 'Aggiornato'];
const NOTIFY_EMAIL = 'lorenzoimbastari@gmail.com';

// Esegui questa funzione UNA VOLTA dall'editor di Apps Script per creare/pulire il foglio.
function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);
  sheet.clear();
  sheet.appendRow(HEADERS);
  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    if (data.action === 'submit') return handleSubmit(data);
    return jsonResponse({ ok: false, error: 'Azione non valida' });
  } catch (err) {
    return jsonResponse({ ok: false, error: 'Richiesta non valida' });
  }
}

function doGet(e) {
  const code = String((e.parameter && e.parameter.code) || '').trim().toUpperCase();
  if (!code) return jsonResponse({ ok: false, error: 'Codice mancante' });
  return handleStatus(code);
}

function handleSubmit(data) {
  const nome = String(data.nome || '').trim();
  const email = String(data.email || '').trim();
  const servizio = String(data.servizio || '').trim();
  const descrizione = String(data.descrizione || '').trim();
  const note = String(data.note || '').trim();

  if (!nome || !email || !servizio || !descrizione) {
    return jsonResponse({ ok: false, error: 'Compila tutti i campi obbligatori' });
  }

  const sheet = getSheet();
  const code = generateCode(sheet);
  const now = new Date();
  sheet.appendRow([now, code, nome, email, servizio, descrizione, note, 'Ricevuta', now]);

  try {
    MailApp.sendEmail({
      to: NOTIFY_EMAIL,
      subject: 'Nuova richiesta [' + code + '] - ' + servizio,
      body: 'Nome: ' + nome + '\nEmail: ' + email + '\nServizio: ' + servizio +
        '\n\nDescrizione:\n' + descrizione + '\n\nNote:\n' + note + '\n\nCodice: ' + code,
      htmlBody: buildOwnerEmailHtml(nome, email, servizio, descrizione, note, code)
    });
    MailApp.sendEmail({
      to: email,
      subject: 'Richiesta ricevuta - Codice ' + code,
      body: 'Ciao ' + nome + ',\n\nHo ricevuto la tua richiesta (' + servizio + ').\n\n' +
        'Il tuo codice di riferimento e\': ' + code + '\n' +
        'Conservalo per controllare lo stato su airplr.github.io/prenota/\n\nA presto,\nLorenzo',
      htmlBody: buildRequesterEmailHtml(nome, servizio, code, descrizione)
    });
  } catch (err) {
    // L'invio email puo' fallire (es. quota giornaliera raggiunta): la richiesta resta comunque salvata nel foglio.
  }

  return jsonResponse({ ok: true, code: code });
}

function handleStatus(code) {
  const sheet = getSheet();
  const values = sheet.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][1]).toUpperCase() === code) {
      return jsonResponse({
        ok: true,
        codice: values[i][1],
        servizio: values[i][4],
        stato: values[i][7],
        aggiornato: formatDate(values[i][8])
      });
    }
  }
  return jsonResponse({ ok: false, error: 'Codice non trovato' });
}

function getSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) throw new Error('Foglio "' + SHEET_NAME + '" non trovato. Esegui la funzione setup() prima.');
  return sheet;
}

function generateCode(sheet) {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // esclude 0/O/1/I/L per evitare ambiguita'
  const existing = {};
  const values = sheet.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) existing[String(values[i][1])] = true;

  let code;
  do {
    code = 'PRQ-';
    for (let i = 0; i < 6; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
  } while (existing[code]);
  return code;
}

function formatDate(d) {
  // Object.prototype.toString, non instanceof: i valori letti da Range.getValues()
  // sono Date "vere" ma costruite in un realm diverso, quindi instanceof puo' fallire.
  if (Object.prototype.toString.call(d) !== '[object Date]' || isNaN(d.getTime())) {
    return String(d);
  }
  return Utilities.formatDate(d, Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm');
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

// --- Template email HTML (stesso stile grafico della pagina /prenota/) ---

function emailShell(eyebrow, heading, bodyHtml) {
  return '<!DOCTYPE html><html><body style="margin:0;padding:0;background-color:#0d0715;">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0d0715;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;">' +
    '<tr><td align="center">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background-color:#170b28;border:1px solid #2a1a40;border-radius:18px;overflow:hidden;">' +
    '<tr><td style="background:linear-gradient(135deg,#3b0764,#814ac8);padding:26px 32px;">' +
    '<div style="color:rgba(255,255,255,0.75);font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">' + eyebrow + '</div>' +
    '<div style="color:#ffffff;font-size:22px;font-weight:800;margin-top:6px;">' + heading + '</div>' +
    '</td></tr>' +
    '<tr><td style="padding:30px 32px;color:#e7e1f2;font-size:15px;line-height:1.65;">' + bodyHtml + '</td></tr>' +
    '<tr><td style="padding:0 32px 26px;border-top:1px solid #2a1a40;">' +
    '<div style="padding-top:18px;color:#9d8fb5;font-size:12px;">airplr.github.io/prenota</div>' +
    '</td></tr>' +
    '</table></td></tr></table></body></html>';
}

function codeBadgeHtml(code) {
  return '<table role="presentation" cellpadding="0" cellspacing="0" style="margin:22px 0;width:100%;"><tr>' +
    '<td align="center" style="background-color:rgba(223,122,254,0.08);border:1px solid #df7afe;border-radius:14px;padding:18px 20px;">' +
    '<div style="color:#9d8fb5;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">Codice di riferimento</div>' +
    '<div style="color:#f3e8ff;font-size:28px;font-weight:800;letter-spacing:1px;margin-top:6px;">' + escapeHtml(code) + '</div>' +
    '</td></tr></table>';
}

function quoteBlockHtml(label, text) {
  if (!text) return '';
  return '<div style="margin-top:18px;">' +
    '<div style="color:#9d8fb5;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin-bottom:6px;">' + escapeHtml(label) + '</div>' +
    '<div style="background-color:#120a1f;border-left:3px solid #814ac8;border-radius:8px;padding:14px 16px;color:#d9d0e8;font-size:14px;white-space:pre-wrap;">' + escapeHtml(text) + '</div>' +
    '</div>';
}

function buildOwnerEmailHtml(nome, email, servizio, descrizione, note, code) {
  const body =
    '<p style="margin:0 0 6px;"><strong>' + escapeHtml(nome) + '</strong> — <a href="mailto:' + escapeHtml(email) + '" style="color:#df7afe;">' + escapeHtml(email) + '</a></p>' +
    '<p style="margin:0;color:#c9bfdb;">Servizio: <strong style="color:#f3e8ff;">' + escapeHtml(servizio) + '</strong></p>' +
    quoteBlockHtml('Descrizione', descrizione) +
    (note ? quoteBlockHtml('Note', note) : '') +
    codeBadgeHtml(code);
  return emailShell('Nuova richiesta', servizio, body);
}

function buildRequesterEmailHtml(nome, servizio, code, descrizione) {
  const body =
    '<p style="margin:0 0 14px;">Ciao ' + escapeHtml(nome) + ',</p>' +
    '<p style="margin:0 0 14px;">Ho ricevuto la tua richiesta di <strong style="color:#f3e8ff;">' + escapeHtml(servizio) + '</strong>. Ti ricontatto appena possibile per i dettagli.</p>' +
    codeBadgeHtml(code) +
    '<p style="margin:14px 0 0;color:#c9bfdb;font-size:13px;">Conservalo: ti serve per controllare lo stato su <a href="https://airplr.github.io/prenota/" style="color:#df7afe;">airplr.github.io/prenota</a>.</p>' +
    quoteBlockHtml('La tua richiesta', descrizione) +
    '<p style="margin:22px 0 0;">A presto,<br>Lorenzo</p>';
  return emailShell('Richiesta ricevuta', 'Ci sono!', body);
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
