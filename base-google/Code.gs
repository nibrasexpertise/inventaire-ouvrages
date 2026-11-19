/**
 * Nibras Expertise SARL · Inventaire des ouvrages hydrauliques
 * Réception des fiches envoyées par les téléphones, dans ce tableau Google Sheets.
 * Version 1.0 du 19 novembre 2026.
 *
 * SEULE LIGNE À MODIFIER : remplacez CHANGEZ-MOI par un code secret de votre choix
 * (au moins 8 lettres ou chiffres). Donnez ce code uniquement aux enquêteurs autorisés.
 * Ne le communiquez à personne d'autre, pas même à Claude.
 */
const CODE_SECRET = 'CHANGEZ-MOI';

const FEUILLE = 'Ouvrages';
const DOSSIER_PHOTOS = 'Inventaire des ouvrages - photos';

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(25000);
  try {
    const d = JSON.parse(e.postData.contents);
    if (!codeOk_(d.cle)) return json_({ ok: false, erreur: 'code' });
    const sh = feuille_();
    const res = [];
    (d.fiches || []).slice(0, 25).forEach(function (f) {
      if (!/^[A-Za-z0-9_-]{1,64}$/.test(String(f.id || ''))) return;
      res.push({ id: f.id, ok: enregistre_(sh, f, d.equipe || '') });
    });
    return json_({ ok: true, recu: res });
  } catch (err) {
    return json_({ ok: false, erreur: String(err).slice(0, 200) });
  } finally {
    lock.releaseLock();
  }
}

/* Lecture de toutes les fiches (pour l'ordinateur du bureau) : ?cle=...&tout=1 ; test : ?test=1 */
function doGet(e) {
  const p = e.parameter || {};
  if (p.test) return json_({ ok: true, app: 'nibras-inventaire-base', v: 1 });
  if (!codeOk_(p.cle)) return json_({ ok: false, erreur: 'code' });
  const sh = feuille_();
  const n = sh.getLastRow();
  if (n < 2) return json_({ ok: true, ouvrages: [] });
  const h = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
  const cj = h.indexOf('fiche_json');
  const v = sh.getRange(2, cj + 1, n - 1, 1).getValues();
  const out = [];
  v.forEach(function (r) { try { if (r[0]) out.push(JSON.parse(r[0])); } catch (x) {} });
  return json_({ ok: true, ouvrages: out });
}

function codeOk_(c) {
  return CODE_SECRET !== 'CHANGEZ-MOI' && CODE_SECRET.length >= 8 && String(c || '') === CODE_SECRET;
}

function feuille_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(FEUILLE);
  if (!sh) {
    sh = ss.insertSheet(FEUILLE);
    sh.getRange(1, 1, 1, 5).setValues([['id', 'equipe', 'recu_le', 'photos', 'fiche_json']]);
    sh.setFrozenRows(1);
  }
  return sh;
}

function colonnes_(sh, noms) {
  let h = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
  const manquent = noms.filter(function (x) { return h.indexOf(x) < 0; });
  if (manquent.length) {
    /* nouvelles colonnes insérées avant « fiche_json », qui reste la dernière */
    const cj = h.indexOf('fiche_json') + 1;
    sh.insertColumnsBefore(cj, manquent.length);
    sh.getRange(1, cj, 1, manquent.length).setValues([manquent]);
    h = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
  }
  return h;
}

function enregistre_(sh, f, equipe) {
  const row = f.row || {};
  const h = colonnes_(sh, Object.keys(row));
  const trouve = sh.getRange('A:A').createTextFinder(String(f.id)).matchEntireCell(true).findNext();
  const ligne = trouve ? trouve.getRow() : sh.getLastRow() + 1;
  const cj = h.indexOf('fiche_json');
  if (trouve) {
    /* la fiche la plus récente gagne */
    try {
      const ancien = JSON.parse(sh.getRange(ligne, cj + 1).getValue() || '{}');
      if ((ancien.maj || '') > (f.maj || '')) return true;
    } catch (x) {}
  }
  const liens = photos_(f, trouve ? String(sh.getRange(ligne, h.indexOf('photos') + 1).getValue() || '') : '');
  const vals = h.map(function (k) {
    if (k === 'id') return String(f.id);
    if (k === 'equipe') return equipe;
    if (k === 'recu_le') return new Date();
    if (k === 'photos') return liens;
    if (k === 'fiche_json') return JSON.stringify(f.fiche || {}).slice(0, 49000);
    const x = row[k];
    if (x === undefined || x === null) return '';
    const s = String(x);
    return /^[=+\-@]/.test(s) && isNaN(Number(s)) ? "'" + s : x;  /* pas de formule injectée */
  });
  sh.getRange(ligne, 1, 1, vals.length).setValues([vals]);
  return true;
}

/* Photos : enregistrées une seule fois dans le dossier Drive, liens dans la colonne « photos » */
function photos_(f, liensActuels) {
  const ph = f.photos || [];
  if (!ph.length) return liensActuels;
  const it = DriveApp.getFoldersByName(DOSSIER_PHOTOS);
  const dossier = it.hasNext() ? it.next() : DriveApp.createFolder(DOSSIER_PHOTOS);
  const liens = [];
  ph.slice(0, 3).forEach(function (p, i) {
    const nom = f.id + '_' + (i + 1) + '_' + String(p.h || '').replace(/[^A-Za-z0-9]/g, '').slice(0, 16) + '.jpg';
    const ex = dossier.getFilesByName(nom);
    let fic = ex.hasNext() ? ex.next() : null;
    if (!fic && p.data && /^data:image\/jpeg;base64,/.test(p.data)) {
      const b = Utilities.base64Decode(p.data.split(',')[1]);
      fic = dossier.createFile(Utilities.newBlob(b, 'image/jpeg', nom));
    }
    if (fic) liens.push(fic.getUrl());
  });
  return liens.length ? liens.join('\n') : liensActuels;
}

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
