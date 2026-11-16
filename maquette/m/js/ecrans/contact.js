// Contact, « deux portes » : un prix tout de suite (le simulateur) ou d'abord une conversation (la carte devient un formulaire).
// Prototype : aucun message n'est envoyé ; seule une adresse e-mail remplie mais invalide bloque. Le vrai site devra valider côté serveur.
import { creerEcran } from '../lib/ecran.js';
import { eyebrow, titre, texte, ecrit, bouton, contour, photo, rv } from '../lib/ecriture.js';
import { el, svg } from '../../../js/lib/dom.js';
import { SERVICES } from '../../../data/tarifs.js';

export const titreDoc = 'Contact · Ernest H.';

export function creer(ctx) {
  const e = creerEcran(ctx);
  let mode = 'ferme';                                   // ferme | formulaire | envoye
  let porte2 = null;

  const champ = (id, libelle, controle, d) => {
    const c = el('div', { class: 'champ' }, el('label', { for: id }, libelle), controle);
    c.style.setProperty('--d', d + 's');
    return c;
  };
  const changer = (nouveau) => {
    e.refaire(() => { mode = nouveau; construire(); });
    e.vie.timeout(() => {
      if (!porte2) return;
      e.defil.scrollTo({ top: nouveau === 'ferme' ? 0 : Math.max(0, porte2.offsetTop - 90), behavior: reduit() ? 'auto' : 'smooth' });
    }, 300);
  };
  const reduit = () => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (x) { return false; } };

  function contenuPorte2() {
    if (mode === 'ferme') {
      const ghost = el('button', { type: 'button', class: 'ghb', on: { click: () => changer('formulaire') } }, ecrit('Écrire maintenant', { d: 1.6, u: 0.5 }));
      ghost.style.setProperty('--d', '1.3s');
      return el('div', { class: 'porte-c' },
        photo({ ton: 5, nb: true, libelle: 'Baiser · joue', alt: 'Baiser sur la joue', d: 0.45 }),
        el('div', { class: 'mono porte-k' }, ecrit('02 · Le plus personnel', { d: 1, u: 0.6 })),
        el('div', { class: 'porte-t' }, ecrit('Écrire un message', { d: 1.1, u: 0.7 })),
        el('div', { class: 'porte-d' }, ecrit('Racontez-moi votre projet avec vos mots : je réponds sous [48 h] avec mes questions.', { d: 1.25, u: 0.8, bloc: true })),
        el('div', { style: { marginTop: '18px', height: '52px' } }, ghost));
    }
    if (mode === 'formulaire') {
      const nom = el('input', { id: 'ct-nom', type: 'text', autocomplete: 'name', placeholder: 'Camille Dupont', maxlength: '80' });
      const mail = el('input', { id: 'ct-mail', type: 'email', autocomplete: 'email', placeholder: 'camille@exemple.be', maxlength: '254' });
      const svc = el('select', { id: 'ct-svc' }, el('option', null, 'Choisir un service'), ...SERVICES.map((s) => el('option', null, s.t)));
      const msg = el('textarea', { id: 'ct-msg', rows: '4', placeholder: 'Racontez-moi votre journée, vos lieux, vos envies.', maxlength: '2000' });
      const erreur = el('div', { class: 'err', role: 'alert', hidden: true });
      const envoyer = (ev) => {
        if (ev) ev.preventDefault();
        const m = mail.value.trim();
        if (m && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(m)) { erreur.textContent = 'Adresse e-mail invalide.'; erreur.hidden = false; mail.setAttribute('aria-invalid', 'true'); mail.focus(); return; }
        changer('envoye');
      };
      const champMail = champ('ct-mail', 'E-mail', mail, 0.7);
      champMail.append(erreur);
      const formulaire = el('form', { class: 'porte-c', novalidate: true, 'aria-label': 'Écrire un message', on: { submit: envoyer } },
        el('div', { class: 'mono', style: { marginTop: '8px' } }, ecrit('02 · Votre message', { d: 0.5, u: 0.6 })),
        champ('ct-nom', 'Prénom et nom', nom, 0.6), champMail, champ('ct-svc', 'Type d’événement', svc, 0.8), champ('ct-msg', 'Votre message', msg, 0.9),
        bouton('Envoyer', { type: 'submit', d: 1, hauteur: 52 }),
        el('div', { style: { marginTop: '6px', display: 'flex', justifyContent: 'center' } }, el('button', { type: 'button', class: 'lien-souligne', on: { click: () => changer('ferme') } }, ecrit('Revenir aux deux choix', { d: 1.3, u: 0.5 }))));
      formulaire.querySelector('.btnw').style.marginTop = '22px';
      return formulaire;
    }
    const coche = svg('svg', { class: 'coche', viewBox: '0 0 28 28', fill: 'none', 'aria-hidden': 'true' }, svg('circle', { cx: 14, cy: 14, r: 12.5 }), svg('path', { d: 'M8.5 14.5 L12.5 18.5 L19.5 10' }));
    return el('div', { class: 'porte-c', role: 'status', style: { paddingTop: '30px' } }, coche,
      el('div', { class: 'porte-t', style: { marginTop: '14px' } }, ecrit('Message envoyé', { d: 0.6, u: 0.7 })),
      el('div', { class: 'mono', style: { marginTop: '8px' } }, ecrit('Réponse sous [48 h]', { d: 0.85, u: 0.7 })),
      el('div', { style: { marginTop: '14px' } }, el('button', { type: 'button', class: 'lien-souligne', on: { click: () => changer('ferme') } }, ecrit('Revenir aux deux choix', { d: 1.1, u: 0.5 }))));
  }

  function construire() {
    const porte1 = rv(el('div', { class: 'porte', style: { marginTop: '28px' } }, el('div', { class: 'carte-verre verre' }), contour(24, 0.1),
      el('div', { class: 'porte-c' },
        photo({ ton: 1, libelle: 'Mariés · château', alt: 'Les mariés devant le château', d: 0.3 }),
        el('div', { class: 'mono porte-k' }, ecrit('01 · Le plus rapide', { d: 0.9, u: 0.6 })),
        el('div', { class: 'porte-t' }, ecrit('Simuler mon devis', { d: 1, u: 0.7 })),
        el('div', { class: 'porte-d' }, ecrit('Vos lieux, vos horaires, votre service : le prix s’affiche en 3 minutes.', { d: 1.15, u: 0.8, bloc: true })),
        bouton('Lancer le simulateur', { href: '#/simulateur', d: 1.2 }))));
    porte2 = rv(el('div', { class: 'porte' }, el('div', { class: 'carte-verre verre' }), contour(24, 0.25), contenuPorte2()));
    e.page.replaceChildren(
      eyebrow('Contact'),
      titre('Comment voulez-vous', 'commencer ?'),
      texte('Un prix tout de suite, ou d’abord une conversation : les deux mènent au même rendez-vous.', { d: 0.1 }),
      porte1, porte2,
      rv(el('div', { class: 'coordonnees' }, el('span', { class: 'regle', 'aria-hidden': 'true' }),
        el('div', { class: 'mono petit' },
          el('div', null, ecrit('[votre adresse e-mail]', { d: 0.1, u: 0.8 })), el('div', null, ecrit('[votre numéro] · [@votre compte]', { d: 0.25, u: 0.8, bloc: true })), el('div', null, ecrit('Réponse sous [48 h]', { d: 0.4, u: 0.8 })))))
    );
  }

  return { ...e, activer() { mode = 'ferme'; construire(); e.activer(); }, desactiver() { e.vie.nettoyer(); e.desactiver(); } };
}
