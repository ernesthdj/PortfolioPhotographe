// Administration des photos (version de test, sans le design final) : connexion, envoi, publication, texte alternatif, suppression,
// puis placement des photos (onglets Photos / Emplacements / Séries). Les règles de placement sont dans placement.js (pures, testées).
// Tout passe par /api/admin/* (cookie de session + en-tête X-Admin-Request). Rien n'est écrit avec innerHTML : les textes saisis
// restent des textes.
import { el } from '../lib/dom.js';
import { BLOB } from '../../data/photos-blob.js';
import {
  SVC, limite, nomZone, depuisManifeste, versManifeste, reporter, placer, retirer, deplacer, ajouterSerie, retirerSerie, majSerie,
  placerDansSerie, retirerDeSerie, deplacerDansSerie, deplacerSerie, etiquettes, changements,
} from './placement.js';

const MAX_COTE = 2400;          // réduction avant envoi : bien au-dessus des 1600 px réellement affichés
const MAX_OCTETS = 3_900_000;   // limite d'une requête Vercel (4,5 Mo) avec marge
const app = document.getElementById('app');

let serveur = null;             // dernier manifeste lu sur le serveur
let base = null;                // copie de travail telle qu'enregistrée (pour savoir ce qui a changé)
let ed = null;                  // copie de travail modifiable : photos, emplacements, séries
let onglet = 'photos';          // 'photos' | 'zones' | 'series'
let ouvert = null;              // sélecteur de photo ouvert : « slot:<cle> » ou « serie:<id> »
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
  if (faites) { ed = reporter(ed, serveur); base = depuisManifeste(serveur); dire(`${faites} photo${faites > 1 ? 's' : ''} envoyée${faites > 1 ? 's' : ''}. Elles sont non publiées tant que tu ne coches pas « Publiée » puis « Enregistrer ».`, 'ok'); }
  rafraichir();
}

// ---- manifeste -----------------------------------------------------------------------------------------------
const nbChangements = () => changements(base, ed);

async function enregistrer() {
  const r = await appel('PUT', '/api/admin/manifest', versManifeste(serveur, ed));
  if (r.status === 401) { await afficher(); return; }
  if (r.status === 409) { dire('Le manifeste a changé ailleurs : recharge la page avant d’enregistrer.', 'erreur'); return; }
  if (!r.ok) { dire((r.data && r.data.error) || 'Enregistrement refusé.', 'erreur'); return; }
  serveur = r.data; base = depuisManifeste(serveur); ed = depuisManifeste(serveur); ouvert = null;
  dire('Enregistré. Le site affiche les changements d’ici une minute environ.', 'ok'); rafraichir();
}

async function supprimer(id) {
  if (!window.confirm('Supprimer cette photo définitivement ? Elle sera retirée du site, des emplacements, des séries et du stockage.')) return;
  const r = await appel('DELETE', '/api/admin/photo?id=' + encodeURIComponent(id));
  if (r.status === 401) { await afficher(); return; }
  if (!r.ok) { dire((r.data && r.data.error) || 'Suppression refusée.', 'erreur'); return; }
  serveur = r.data; ed = reporter(ed, serveur); base = depuisManifeste(serveur);
  dire('Photo supprimée.', 'ok'); rafraichir();
}

/** Applique le résultat d'une règle de placement (`{ ed }` ou `{ erreur }`) ; renvoie vrai si elle a réussi. */
function appliquer(r) {
  if (r.erreur) { dire(r.erreur, 'erreur'); return false; }
  ed = r.ed; dire(''); rafraichir(); return true;
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


// ---- éléments communs ------------------------------------------------------------------------------------------
const fichier = (id) => serveur.photos.find((p) => p.id === id);
const infos = (id) => ed.photos.find((p) => p.id === id);
const publiee = (id) => !!infos(id)?.published;
const img = (id) => el('img', { src: `/_vercel/image?url=${encodeURIComponent(BLOB + fichier(id).file)}&w=640&q=70`, alt: infos(id)?.alt || 'Photo sans texte alternatif', loading: 'lazy' });
const petit = (symbole, nom, clic, inactif) => el('button', { type: 'button', class: 'petit', 'aria-label': nom, title: nom, disabled: inactif, on: { click: clic } }, symbole);
const pluriel = (n, mot) => n + ' ' + mot + (n > 1 ? 's' : '');

/** Une photo dans une rangée (emplacement ou série) : vignette + avant / après / retirer. */
function mini(id, i, total, actions) {
  return el('div', { class: 'mini' + (publiee(id) ? '' : ' brouillon') },
    el('div', { class: 'vignette' }, img(id), publiee(id) ? null : el('span', { class: 'pastille' }, 'Brouillon · invisible')),
    el('div', { class: 'outils' },
      petit('‹', 'Avancer d’un rang', actions.avant, i === 0), petit('›', 'Reculer d’un rang', actions.apres, i === total - 1), petit('✕', 'Retirer', actions.retirer)));
}

/** Choix d'une photo parmi celles qui ne sont pas déjà dans `deja`. */
function selecteur(deja, choisir) {
  const libres = ed.photos.filter((p) => !deja.includes(p.id));
  return el('div', { class: 'selecteur' },
    libres.length ? el('div', { class: 'grille-mini' }, ...libres.map((p) => el('button', { type: 'button', class: 'choix', 'aria-label': 'Choisir : ' + (p.alt || 'photo sans texte'), on: { click: () => choisir(p.id) } },
      el('div', { class: 'vignette' }, img(p.id), p.published ? null : el('span', { class: 'pastille' }, 'Brouillon'))))) : el('p', { class: 'vide' }, 'Aucune autre photo à ajouter.'));
}

// ---- onglet Photos ---------------------------------------------------------------------------------------------
function optionsPlacement() {
  const opt = (v, t) => el('option', { value: v }, t);
  const groupes = [
    el('optgroup', { label: 'Intro' }, opt('slot:intro', 'Intro')),
    el('optgroup', { label: 'Accueil' }, ...SVC.map((_, i) => opt('slot:accueil:' + i, nomZone('accueil:' + i)))),
    el('optgroup', { label: 'Services' }, ...SVC.map((_, i) => opt('slot:service:' + i, nomZone('service:' + i)))),
  ];
  if (ed.events.length) groupes.push(el('optgroup', { label: 'Séries de la galerie' }, ...ed.events.map((e) => opt('serie:' + e.id, 'Galerie · ' + (e.tag.trim() || SVC[e.svc])))));
  return [opt('', 'Placer dans…'), ...groupes];
}

function carte(p) {
  const o = fichier(p.id), avant = base.photos.find((x) => x.id === p.id);
  const modifiee = () => !avant || avant.alt.trim() !== p.alt.trim() || avant.published !== p.published;
  const champAlt = el('input', { type: 'text', value: p.alt, maxlength: '200', placeholder: 'Texte alternatif (décrit la photo)', 'aria-label': 'Texte alternatif', on: { input: () => { p.alt = champAlt.value; c.classList.toggle('modifiee', modifiee()); majBarre(); } } });
  const pastille = el('span', { class: 'pastille' + (p.published ? ' live' : '') }, p.published ? 'Publiée' : 'Brouillon');
  const caseP = el('input', { type: 'checkbox', checked: p.published, on: { change: () => { p.published = caseP.checked; pastille.className = 'pastille' + (p.published ? ' live' : ''); pastille.textContent = p.published ? 'Publiée' : 'Brouillon'; c.classList.toggle('modifiee', modifiee()); majBarre(); } } });
  const places = etiquettes(ed, p.id);
  const choix = el('select', { 'aria-label': 'Placer dans…' }, ...optionsPlacement());
  const placerLa = () => {
    const v = choix.value;
    if (!v) { dire('Choisis d’abord où placer la photo.', 'erreur'); return; }
    const ok = v.startsWith('serie:') ? appliquer(placerDansSerie(ed, v.slice(6), p.id)) : appliquer(placer(ed, v.slice(5), p.id));
    if (ok) dire(p.published ? 'Photo placée. N’oublie pas d’enregistrer.' : 'Photo placée, mais elle est en brouillon : coche « Publiée sur le site » pour qu’elle apparaisse.', p.published ? 'ok' : 'erreur');
  };
  const c = el('div', { class: 'carte' + (modifiee() ? ' modifiee' : '') },
    el('div', { class: 'vignette' }, img(p.id), pastille),
    champAlt,
    el('label', { class: 'case' }, caseP, 'Publiée sur le site'),
    el('p', { class: 'places' + (places.length ? '' : ' aucune') }, places.length ? 'Placée : ' + places.join(' · ') : 'Placée nulle part : invisible sur le site'),
    el('div', { class: 'placer' }, choix, el('button', { type: 'button', on: { click: placerLa } }, 'Placer')),
    el('div', { class: 'bas' }, el('span', { class: 'dims' }, `${o.w} × ${o.h}`), el('button', { type: 'button', class: 'danger', on: { click: () => supprimer(p.id) } }, 'Supprimer')));
  return c;
}

function ongletPhotos() {
  const entree = el('input', { type: 'file', accept: 'image/jpeg,image/png,image/webp', multiple: true, id: 'fichiers', on: { change: () => { envoyer(entree.files); entree.value = ''; } } });
  const zone = el('label', { class: 'zone', for: 'fichiers', on: {
    dragover: (ev) => { ev.preventDefault(); zone.classList.add('survol'); },
    dragleave: () => zone.classList.remove('survol'),
    drop: (ev) => { ev.preventDefault(); zone.classList.remove('survol'); envoyer(ev.dataTransfer.files); },
  } }, entree, el('strong', null, 'Dépose des photos ici'), ' ou clique pour les choisir', el('br'), el('span', { class: 'mono' }, 'JPEG · PNG · WebP — réduites à 2400 px avant envoi'));
  return [zone, ed.photos.length ? el('div', { class: 'grille' }, ...ed.photos.map(carte)) : el('p', { class: 'vide' }, 'Aucune photo pour l’instant. Dépose-en ci-dessus.')];
}

// ---- onglet Emplacements ---------------------------------------------------------------------------------------
function blocEmplacement(cle) {
  const ids = ed.slots[cle] ?? [], max = limite(cle), ouv = ouvert === 'slot:' + cle;
  const range = (liste) => { ed = { ...ed, slots: { ...ed.slots, [cle]: liste } }; rafraichir(); };
  const rangee = ids.map((id, i) => mini(id, i, ids.length, { avant: () => range(deplacer(ids, i, -1)), apres: () => range(deplacer(ids, i, 1)), retirer: () => { ed = retirer(ed, cle, id); rafraichir(); } }));
  const pleine = max > 1 && ids.length >= max;
  const libelle = max === 1 ? (ids.length ? 'Remplacer' : 'Choisir une photo') : pleine ? 'Pleine' : '+ Ajouter une photo';
  return el('section', { class: 'emplacement' },
    el('div', { class: 'tete' }, el('h3', null, nomZone(cle)), el('span', { class: 'mono' }, ids.length + ' / ' + max)),
    ids.length ? el('div', { class: 'rangee-mini' }, ...rangee) : el('p', { class: 'vide petit-vide' }, 'Vide : le site garde la photo de test.'),
    el('button', { type: 'button', disabled: pleine, on: { click: () => { ouvert = ouv ? null : 'slot:' + cle; rafraichir(); } } }, ouv ? 'Fermer' : libelle),
    ouv ? selecteur(ids, (id) => { if (appliquer(placer(ed, cle, id)) && (max === 1 || (ed.slots[cle] ?? []).length >= max)) { ouvert = null; rafraichir(); } }) : null);
}

function ongletZones() {
  const groupe = (titre, note, cles) => el('div', { class: 'groupe' }, el('h2', null, titre), el('p', { class: 'note' }, note), ...cles.map(blocEmplacement));
  return [
    groupe('Intro', 'Les 5 photos du collage d’ouverture (PC et mobile). Une place vide garde la photo de test.', ['intro']),
    groupe('Accueil', 'Le collage de l’accueil PC change selon le service survolé. Sur mobile, l’accueil n’utilise que Mariages (3 premières photos) et Engagement (2 premières).', SVC.map((_, i) => 'accueil:' + i)),
    groupe('Services', 'La photo de chaque fiche service. Pour l’instant visible sur mobile seulement : la page Services PC n’a pas encore de vraie photo.', SVC.map((_, i) => 'service:' + i)),
  ];
}

// ---- onglet Séries ---------------------------------------------------------------------------------------------
function blocSerie(e, rang) {
  const ouv = ouvert === 'serie:' + e.id;
  const majTexte = (champ, v) => { ed = majSerie(ed, e.id, { [champ]: v }); majBarre(); };
  const choixSvc = el('select', { 'aria-label': 'Service de la série', on: { change: () => { ed = majSerie(ed, e.id, { svc: Number(choixSvc.value) }); majBarre(); } } },
    ...SVC.map((nom, i) => el('option', { value: String(i), selected: i === e.svc }, nom)));
  const tag = el('input', { type: 'text', value: e.tag, maxlength: '160', placeholder: 'Titre (ex. Mariage · Château de… · 2026)', 'aria-label': 'Titre de la série', on: { input: () => majTexte('tag', tag.value) } });
  const txt = el('input', { type: 'text', value: e.txt, maxlength: '240', placeholder: 'Une phrase sur la journée', 'aria-label': 'Phrase de la série', on: { input: () => majTexte('txt', txt.value) } });
  const rangee = e.photos.map((id, i) => mini(id, i, e.photos.length, {
    avant: () => { ed = deplacerDansSerie(ed, e.id, i, -1); rafraichir(); },
    apres: () => { ed = deplacerDansSerie(ed, e.id, i, 1); rafraichir(); },
    retirer: () => { ed = retirerDeSerie(ed, e.id, id); rafraichir(); },
  }));
  return el('section', { class: 'emplacement serie' },
    el('div', { class: 'tete' }, el('h3', null, 'Série ' + (rang + 1)), el('span', { class: 'mono' }, pluriel(e.photos.length, 'photo'))),
    el('div', { class: 'champs' }, el('label', null, 'Service', choixSvc), el('label', null, 'Titre', tag), el('label', null, 'Phrase', txt)),
    e.photos.length ? el('div', { class: 'rangee-mini' }, ...rangee) : el('p', { class: 'vide petit-vide' }, 'Aucune photo : une série vide n’apparaît pas sur le site.'),
    el('div', { class: 'actions' },
      el('button', { type: 'button', on: { click: () => { ouvert = ouv ? null : 'serie:' + e.id; rafraichir(); } } }, ouv ? 'Fermer' : '+ Ajouter des photos'),
      petit('↑', 'Monter la série', () => { ed = deplacerSerie(ed, e.id, -1); rafraichir(); }, rang === 0),
      petit('↓', 'Descendre la série', () => { ed = deplacerSerie(ed, e.id, 1); rafraichir(); }, rang === ed.events.length - 1),
      el('button', { type: 'button', class: 'danger', on: { click: () => { if (window.confirm('Supprimer cette série ? Les photos restent dans la photothèque.')) { ed = retirerSerie(ed, e.id); ouvert = null; rafraichir(); } } } }, 'Supprimer la série')),
    ouv ? selecteur(e.photos, (id) => appliquer(placerDansSerie(ed, e.id, id))) : null);
}

function ongletSeries() {
  return [
    el('p', { class: 'note' }, 'Les séries composent la galerie. Dès qu’il en existe au moins une, elles remplacent TOUTES les séries de test (PC et mobile). Une série sans photo publiée n’apparaît pas.'),
    ...ed.events.map(blocSerie),
    el('button', { type: 'button', class: 'plein', on: { click: () => appliquer(ajouterSerie(ed, 0)) } }, '+ Nouvelle série'),
  ];
}

// ---- cadre de la page ------------------------------------------------------------------------------------------
const ONGLETS = [['photos', 'Photos'], ['zones', 'Emplacements'], ['series', 'Séries']];

function rendreCorps() {
  const corps = document.getElementById('corps');
  if (!corps) return;
  corps.replaceChildren(...(onglet === 'photos' ? ongletPhotos() : onglet === 'zones' ? ongletZones() : ongletSeries()));
  document.querySelectorAll('.onglet').forEach((b) => { const actif = b.dataset.onglet === onglet; b.classList.toggle('actif', actif); b.setAttribute('aria-current', actif ? 'page' : 'false'); });
}

/** Bouton Enregistrer + liste de ce qui va être écrit. */
function majBarre() {
  const l = nbChangements();
  const b = document.getElementById('enreg');
  if (b) { b.disabled = l.length === 0; b.textContent = l.length ? `Enregistrer (${l.length})` : 'Enregistrer'; }
  const a = document.getElementById('attente');
  if (a) a.replaceChildren(...(l.length ? [el('strong', null, 'À enregistrer'), el('ul', null, ...l.map((x) => el('li', null, x)))] : []));
  a?.classList.toggle('plein-attente', l.length > 0);
}

function rafraichir() { rendreCorps(); majBarre(); }

function vuePhotos() {
  const enreg = el('button', { type: 'button', class: 'plein', id: 'enreg', disabled: true, on: { click: enregistrer } }, 'Enregistrer');
  const sortir = el('button', { type: 'button', on: { click: async () => { await appel('POST', '/api/admin/logout', ''); vueConnexion(); } } }, 'Se déconnecter');
  app.replaceChildren(
    el('div', { class: 'bandeau' }, el('div', null, el('div', { class: 'mono' }, 'Administration · version de test'), el('h1', null, 'Photos du site')), el('div', { class: 'actions' }, enreg, sortir)),
    el('nav', { class: 'onglets', 'aria-label': 'Sections' }, ...ONGLETS.map(([cle, nom]) => el('button', { type: 'button', class: 'onglet', 'data-onglet': cle, on: { click: () => { onglet = cle; ouvert = null; rafraichir(); } } }, nom))),
    el('div', { id: 'attente', class: 'attente', role: 'status' }),
    el('p', { class: 'etat ' + message.type, id: 'etat', role: 'status' }, message.texte),
    el('div', { id: 'corps' }));
  rafraichir();
}

async function afficher() {
  const s = await appel('GET', '/api/admin/session');
  if (s.status === 401 || s.status === 503) { vueConnexion(s.status === 503 ? 'Connexion non configurée.' : ''); return; }
  const m = await appel('GET', '/api/admin/manifest');
  if (!m.ok) { app.replaceChildren(el('p', { class: 'etat erreur' }, (m.data && m.data.error) || 'Impossible de lire les photos.')); return; }
  serveur = m.data; base = depuisManifeste(serveur); ed = depuisManifeste(serveur);
  vuePhotos();
}

// Prévient avant de quitter la page avec des modifications non enregistrées.
window.addEventListener('beforeunload', (ev) => { if (base && ed && nbChangements().length) { ev.preventDefault(); ev.returnValue = ''; } });

afficher();
