// Administration des photos (version de test, sans le design final) : connexion, envoi, publication, texte alternatif, suppression.
// Tout passe par /api/admin/* (cookie de session + en-tête X-Admin-Request). Rien n'est écrit avec innerHTML : les textes saisis
// restent des textes.
import { el } from '../lib/dom.js';
import { BLOB } from '../../data/photos-blob.js';

const MAX_COTE = 2400;          // réduction avant envoi : bien au-dessus des 1600 px réellement affichés
const MAX_OCTETS = 3_900_000;   // limite d'une requête Vercel (4,5 Mo) avec marge
const app = document.getElementById('app');

let serveur = null;             // dernier manifeste lu sur le serveur
let edition = null;             // photos modifiables (copie) : { id, alt, published }
let message = { texte: '', type: '' };

// ---- appels --------------------------------------------------------------------------------------------------
async function appel(methode, chemin, corps, typeCorps) {
  const entetes = { 'X-Admin-Request': '1' };
  if (corps !== undefined) entetes['Content-Type'] = typeCorps || 'application/json';
  const rep = await fetch(chemin, { method: methode, credentials: 'same-origin', headers: entetes, body: corps === undefined ? undefined : (typeCorps ? corps : JSON.stringify(corps)) });
  let data = null;
  try { data = await rep.json(); } catch { /* corps vide */ }
  return { ok: rep.ok, status: rep.status, data };
}
const dire = (texte, type = '') => { message = { texte, type }; const n = document.getElementById('etat'); if (n) { n.textContent = texte; n.className = 'etat ' + type; } };

// ---- réduction d'une photo avant envoi -----------------------------------------------------------------------
async function reduire(fichier) {
  const bmp = await createImageBitmap(fichier);                 // applique l'orientation EXIF
  let cote = Math.min(1, MAX_COTE / Math.max(bmp.width, bmp.height));
  for (const qualite of [0.9, 0.82, 0.74, 0.66]) {
    const w = Math.round(bmp.width * cote), h = Math.round(bmp.height * cote);
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    c.getContext('2d').drawImage(bmp, 0, 0, w, h);
    const blob = await new Promise((ok) => c.toBlob(ok, 'image/jpeg', qualite));
    if (blob && blob.size <= MAX_OCTETS) { bmp.close(); return { blob, w, h }; }
    cote *= 0.85;
  }
  bmp.close();
  throw new Error('trop lourde même après réduction');
}

async function envoyer(fichiers) {
  const liste = [...fichiers].filter((f) => f.type.startsWith('image/'));
  if (!liste.length) { dire('Aucune image reconnue.', 'erreur'); return; }
  let faites = 0;
  for (const f of liste) {
    dire(`Envoi ${faites + 1} / ${liste.length} : ${f.name}…`);
    try {
      const { blob, w, h } = await reduire(f);
      const r = await appel('POST', `/api/admin/photo?w=${w}&h=${h}`, blob, 'image/jpeg');
      if (r.status === 401) { await afficher(); return; }
      if (!r.ok) throw new Error((r.data && r.data.error) || 'refusée (' + r.status + ')');
      serveur = r.data; faites++;
    } catch (e) {
      dire(`« ${f.name} » : ${e.message}`, 'erreur');
      break;
    }
  }
  if (faites) { edition = copie(serveur); dire(`${faites} photo${faites > 1 ? 's' : ''} envoyée${faites > 1 ? 's' : ''}. Elles sont non publiées tant que tu ne coches pas « Publiée » puis « Enregistrer ».`, 'ok'); }
  rendreListe();
}

// ---- manifeste -----------------------------------------------------------------------------------------------
const copie = (m) => m.photos.map((p) => ({ id: p.id, alt: p.alt, published: p.published }));
const modifiee = (p) => { const o = serveur.photos.find((x) => x.id === p.id); return !o || o.alt !== p.alt || o.published !== p.published; };
const nbModifs = () => edition.filter(modifiee).length;

async function enregistrer() {
  const photos = serveur.photos.map((o) => { const e = edition.find((x) => x.id === o.id); return e ? { ...o, alt: e.alt.trim().slice(0, 200), published: e.published } : o; });
  const r = await appel('PUT', '/api/admin/manifest', { ...serveur, photos });
  if (r.status === 401) { await afficher(); return; }
  if (r.status === 409) { dire('Le manifeste a changé ailleurs : recharge la page avant d’enregistrer.', 'erreur'); return; }
  if (!r.ok) { dire((r.data && r.data.error) || 'Enregistrement refusé.', 'erreur'); return; }
  serveur = r.data; edition = copie(serveur);
  dire('Enregistré.', 'ok'); rendreListe();
}

async function supprimer(p) {
  if (!window.confirm('Supprimer cette photo définitivement ? Elle sera retirée du site et du stockage.')) return;
  const r = await appel('DELETE', '/api/admin/photo?id=' + encodeURIComponent(p.id));
  if (r.status === 401) { await afficher(); return; }
  if (!r.ok) { dire((r.data && r.data.error) || 'Suppression refusée.', 'erreur'); return; }
  serveur = r.data; edition = copie(serveur);
  dire('Photo supprimée.', 'ok'); rendreListe();
}

// ---- vues ----------------------------------------------------------------------------------------------------
function vueConnexion(erreur) {
  const champ = el('input', { type: 'password', id: 'mdp', autocomplete: 'current-password', required: true, maxlength: '200' });
  const form = el('form', { class: 'connexion', on: { submit: async (ev) => {
    ev.preventDefault();
    const r = await appel('POST', '/api/admin/login', { password: champ.value });
    champ.value = '';
    if (r.ok) afficher(); else vueConnexion(r.status === 429 ? 'Trop d’essais : réessaie plus tard.' : r.status === 503 ? 'Connexion non configurée.' : 'Identifiants invalides.');
  } } },
  el('div', { class: 'mono' }, 'Administration'), el('h1', null, 'Connexion'),
  el('label', null, 'Mot de passe', champ),
  erreur ? el('p', { class: 'etat erreur' }, erreur) : null,
  el('button', { type: 'submit', class: 'plein' }, 'Se connecter'));
  app.replaceChildren(form);
  champ.focus();
}

function carte(p) {
  const o = serveur.photos.find((x) => x.id === p.id);
  const url = BLOB + o.file;
  const champAlt = el('input', { type: 'text', value: p.alt, maxlength: '200', placeholder: 'Texte alternatif (décrit la photo)', 'aria-label': 'Texte alternatif', on: { input: () => { p.alt = champAlt.value; majBarre(); c.classList.toggle('modifiee', modifiee(p)); } } });
  const pastille = el('span', { class: 'pastille' + (p.published ? ' live' : '') }, p.published ? 'Publiée' : 'Brouillon');
  const caseP = el('input', { type: 'checkbox', checked: p.published, on: { change: () => { p.published = caseP.checked; pastille.className = 'pastille' + (p.published ? ' live' : ''); pastille.textContent = p.published ? 'Publiée' : 'Brouillon'; majBarre(); c.classList.toggle('modifiee', modifiee(p)); } } });
  const c = el('div', { class: 'carte' + (modifiee(p) ? ' modifiee' : '') },
    el('div', { class: 'vignette' }, el('img', { src: `/_vercel/image?url=${encodeURIComponent(url)}&w=640&q=75`, alt: o.alt || 'Photo sans texte alternatif', loading: 'lazy' }), pastille),
    champAlt,
    el('label', { class: 'case' }, caseP, 'Publiée sur le site'),
    el('div', { class: 'bas' }, el('span', { class: 'dims' }, `${o.w} × ${o.h}`), el('button', { type: 'button', class: 'danger', on: { click: () => supprimer(o) } }, 'Supprimer')));
  return c;
}

function majBarre() {
  const b = document.getElementById('enreg');
  if (!b) return;
  const n = nbModifs();
  b.disabled = n === 0;
  b.textContent = n ? `Enregistrer (${n})` : 'Enregistrer';
}

function rendreListe() {
  const zone = document.getElementById('liste');
  if (!zone) return;
  zone.replaceChildren(edition.length ? el('div', { class: 'grille' }, ...edition.map(carte)) : el('p', { class: 'vide' }, 'Aucune photo pour l’instant. Dépose-en ci-dessus.'));
  majBarre();
}

function vuePhotos() {
  const entree = el('input', { type: 'file', accept: 'image/jpeg,image/png,image/webp', multiple: true, id: 'fichiers', on: { change: () => { envoyer(entree.files); entree.value = ''; } } });
  const zone = el('label', { class: 'zone', for: 'fichiers', on: {
    dragover: (ev) => { ev.preventDefault(); zone.classList.add('survol'); },
    dragleave: () => zone.classList.remove('survol'),
    drop: (ev) => { ev.preventDefault(); zone.classList.remove('survol'); envoyer(ev.dataTransfer.files); },
  } }, entree, el('strong', null, 'Dépose des photos ici'), ' ou clique pour les choisir', el('br'), el('span', { class: 'mono' }, 'JPEG · PNG · WebP — réduites à 2400 px avant envoi'));
  const enreg = el('button', { type: 'button', class: 'plein', id: 'enreg', disabled: true, on: { click: enregistrer } }, 'Enregistrer');
  const sortir = el('button', { type: 'button', on: { click: async () => { await appel('POST', '/api/admin/logout', ''); vueConnexion(); } } }, 'Se déconnecter');
  app.replaceChildren(
    el('div', { class: 'bandeau' }, el('div', null, el('div', { class: 'mono' }, 'Administration · version de test'), el('h1', null, 'Photos')), el('div', { class: 'actions' }, enreg, sortir)),
    zone,
    el('p', { class: 'etat ' + message.type, id: 'etat', role: 'status' }, message.texte),
    el('div', { id: 'liste' }));
  rendreListe();
}

async function afficher() {
  const s = await appel('GET', '/api/admin/session');
  if (s.status === 401 || s.status === 503) { vueConnexion(s.status === 503 ? 'Connexion non configurée.' : ''); return; }
  const m = await appel('GET', '/api/admin/manifest');
  if (!m.ok) { app.replaceChildren(el('p', { class: 'etat erreur' }, (m.data && m.data.error) || 'Impossible de lire les photos.')); return; }
  serveur = m.data; edition = copie(serveur);
  vuePhotos();
}

afficher();
