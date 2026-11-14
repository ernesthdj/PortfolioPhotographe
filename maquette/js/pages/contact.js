// Site · Contact (retenue B : deux portes). Traduit PContact.dc.html.
// « Écrire maintenant » : la carte de gauche s'efface, la carte de droite s'étire (transition left/width) et devient le formulaire.
// Le formulaire n'envoie rien (maquette) ; comme dans la planche, « Envoyer » n'a pas d'action.
import { rythme, E } from '../lib/anim.js';
import { monterEntete, majEntete, animationsEntete } from '../lib/entete.js';
import { $, el, mot, ecrire, animer, liste, voir } from '../lib/dom.js';
import { creerVie } from '../lib/vie.js';
import { mesures } from '../lib/scene.js';

let vie = null;

export function init() {
  vie = creerVie();
  const R = rythme(.62), { K } = R;
  const entete = monterEntete($('#fond'), { actif: 'contact', a: animationsEntete(R) });

  const st = { open: false, n: 0 };

  // T : en retour (« again ») l'écriture est rapide et sans rejouer l'intro
  const mkT = (again) => (dl, d) => again
    ? { o: `wIn .35s ${E} ${(dl * .04).toFixed(2)}s both`, f: `wIn .35s ${E} ${(dl * .04 + .1).toFixed(2)}s both` }
    : { o: `wIn ${d * K}s ${E} ${(dl * K).toFixed(2)}s both`, f: `wIn ${d * K}s ${E} ${((dl + .25) * K).toFixed(2)}s both` };

  // textes fixes (écrits une fois)
  const FIXES = {
    eye: 'Contact', h1: 'Comment voulez-vous',
    in1: 'Un prix tout de suite, ou d’abord une conversation :', in2: 'les deux mènent au même rendez-vous.',
    'g-k': '01 · Le plus rapide', 'g-t': 'Simuler mon devis', 'g-b': 'Lancer le simulateur',
    'd-k': '02 · Le plus personnel', 'd-t': 'Écrire un message', 'd-b': 'Écrire maintenant',
    coo: '[votre adresse e-mail] · [votre numéro] · [@votre compte] · réponse sous [48 h]',
    'f-envoyer': 'Envoyer', 'f-revenir': 'Revenir aux deux choix'
  };
  for (const [id, t] of Object.entries(FIXES)) ecrire($('#' + id), t);
  ecrire($('#h2'), () => el('i', { style: "font:italic 400 52px/1 'Instrument Serif',serif" }, 'commencer ?'));

  // formulaire : options du type d'événement
  const SV = ['Choisir un service', 'Mariage', 'Engagement', 'Famille lifestyle', 'Anniversaire', 'Événementiel', 'Culinaire & studio'];
  SV.forEach((o) => $('#p-svc').append(el('option', null, o)));
  // animations d'entrée du formulaire (fixes) sur les mots d'action
  animer($('#f-envoyer'), `wIn .45s ${E} 1.1s both`); $('#f-envoyer').children[1].style.animation = `wIn .45s ${E} 1.26s both`;
  animer($('#f-revenir'), `wIn .45s ${E} 1.2s both`); $('#f-revenir').children[1].style.animation = `wIn .45s ${E} 1.36s both`;

  const lig = (T, L, d0) => L.map((t, i) => ({ t, y: 328 + i * 24, a: T(d0 + i * .12, .8) }));
  const ligneNode = (l) => el('span', { class: 'd', style: `top:${l.y}px` }, mot(l.t));

  // Répartition : les deux cartes se partagent la largeur utile (chacune gagne dx/2) ; ouverte, la carte de droite
  // prend toute la largeur. `instant` coupe la transition left/width (mise en page initiale ou redimensionnement).
  function cartes(instant) {
    const dx = mesures.dx, wc = 620 + dx / 2;
    const cg = $('#carte-g'), cd = $('#carte-d');
    if (instant) { cd.style.transition = 'none'; cg.style.transition = 'none'; }
    cg.style.width = wc + 'px';
    cd.style.left = (st.open ? 80 : 740 + dx / 2) + 'px';
    cd.style.width = (st.open ? 1280 + dx : wc) + 'px';
    const d = (w) => `M0 24 A24 24 0 0 1 24 0 L${w - 24} 0 A24 24 0 0 1 ${w} 24 L${w} 456 A24 24 0 0 1 ${w - 24} 480 L24 480 A24 24 0 0 1 0 456 Z`;
    $('#tr-g').setAttribute('d', d(wc)); $('#tr-d').setAttribute('d', d(wc));
    if (instant) { void cd.offsetWidth; cd.style.transition = ''; cg.style.transition = ''; }
  }

  function render() {
    const again = st.n > 0, T = mkT(again);
    const a = {
      sep: `drawS ${.8 * K}s ${E} 0s both`, logo: T(.3, .8), sig: `wIn ${.5 * K}s ${E} ${1.35 * K}s both`,
      n0: T(.5, .45), n1: T(.6, .45), n2: T(.7, .45), n3: T(.8, .45), navU: `wIn ${.5 * K}s ${E} ${1.2 * K}s both`,
      hFl: `habille 1s ease ${.9 * K}s both`, hCta: T(1.3, .45),
      eyeL: `wIn ${.4 * K}s ${E} ${.6 * K}s both`, eye: T(.75, .6), h1: T(.9, .9), h2: T(1.15, 1), in1: T(1.5, .9), in2: T(1.7, .8),
      trG: again ? 'none' : `trace 2.6s ${E} ${(1.6 * K).toFixed(2)}s both`, trD: again ? 'none' : `trace 2.6s ${E} ${(1.9 * K).toFixed(2)}s both`,
      coo: T(4.6, 1.2)
    };
    if (again) Object.assign(a, { sep: 'none', logo: T(0, .3), n0: T(0, .3), n1: T(0, .3), n2: T(0, .3), n3: T(0, .3) });
    if (again) majEntete(entete, a);   // l'en-tête ne se réanime qu'au retour du formulaire

    animer($('#eye-trait'), a.eyeL); animer($('#eye'), a.eye); animer($('#h1'), a.h1); animer($('#h2'), a.h2);
    animer($('#in1'), a.in1); animer($('#in2'), a.in2); animer($('#tr-g'), a.trG); animer($('#tr-d'), a.trD); animer($('#coo'), a.coo);

    // porte de gauche
    const g = st.open
      ? { op: '0', fl: 'devOut .35s ease-out forwards', dev: 'devOut .3s ease-out forwards', ak: T(0, .1), at: T(0, .1), lignes: [], eFl: 'none', b: T(0, .1) }
      : { op: '1', fl: again ? 'habille .5s ease .1s both' : `habille 1.8s ease-in-out ${(2.6 * K).toFixed(2)}s both`,
          dev: again ? 'retourC .45s ease both' : `dev 2.8s ease-in-out ${(2.2 * K).toFixed(2)}s both`,
          ak: T(3.0, .5), at: T(3.1, .8), lignes: lig(T, ['Choisissez votre service, vos lieux et vos horaires :', 'le prix exact s’affiche, ligne par ligne, en 3 minutes.'], 3.3),
          eFl: again ? 'habille .4s ease .2s both' : `habille 1.2s ease ${(3.8 * K).toFixed(2)}s both`, b: T(4.1, .5) };
    const cg = $('#carte-g');
    cg.style.opacity = g.op; animer(cg, g.fl);
    animer($('#g-photo'), g.dev); animer($('#g-k'), g.ak); animer($('#g-t'), g.at); animer($('#g-fl'), g.eFl); animer($('#g-b'), g.b);
    liste($('#g-lignes'), g.lignes, (l) => l.t, (l) => ligneNode(l), (n, l) => animer(n.firstElementChild, l.a));

    // porte de droite
    const d = st.open
      ? { x: 80, w: 1280, ferme: false, ouvert: true, fl: 'none' }
      : { x: 740, w: 620, ferme: true, ouvert: false, fl: again ? 'none' : `habille 1.8s ease-in-out ${(2.9 * K).toFixed(2)}s both`,
          dev: again ? 'retourNB .45s ease both' : `devNB 2.8s ease-in-out ${(2.5 * K).toFixed(2)}s both`,
          ak: T(3.2, .5), at: T(3.3, .8), lignes: lig(T, ['Racontez-moi votre projet avec vos mots :', 'je vous réponds sous [48 h] avec mes questions.'], 3.5), b: T(4.3, .5) };
    animer($('#carte-d'), d.fl);
    cartes(false);
    voir($('#d-ferme'), d.ferme); voir($('#d-ouvert'), d.ouvert);
    if (d.ferme) {
      animer($('#d-photo'), d.dev); animer($('#d-k'), d.ak); animer($('#d-t'), d.at); animer($('#d-b'), d.b);
      liste($('#d-lignes'), d.lignes, (l) => l.t, (l) => ligneNode(l), (n, l) => animer(n.firstElementChild, l.a));
    }
  }

  vie.ecouter(window, 'scene:resize', () => cartes(true));
  cartes(true);
  $('#ouvrir').addEventListener('click', () => { st.open = true; render(); });
  $('#fermer').addEventListener('click', () => { st.open = false; st.n += 1; render(); });
  render();

}

export function destroy() {
  if (vie) vie.nettoyer();
  vie = null;
}
