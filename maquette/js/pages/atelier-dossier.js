// Atelier · E12 Dossier (A · onglets). Traduit ErpDossier.dc.html. Dossier ouvert : n° 2027-014 (Camille D.).
// Paramètre ?panneau= : Aucun (défaut) | Traiter la demande | Retirer une ligne | Changer l’étape.
import { monterAtelier } from '../lib/atelier-shell.js';
import { $, el, ecrire, animer, texte, liste, voir } from '../lib/dom.js';
import { param } from '../lib/params.js';
import { eurC } from '../lib/format.js';
import { ETAPES, TRANSITIONS, LIGNES_014, DATES_014, LIEU_014 } from '../../data/dossiers.js';
import { REQ } from '../../data/demandes.js';
import { posf, larg } from '../lib/scene.js';
import { monterPanneaux, preparer, totaux, clos, PROCH } from './atelier-dossier-logique.js';
import { creerVie } from '../lib/vie.js';

let vie = null, fondPage = null;

export function init() {
  vie = creerVie();
  const atelier = monterAtelier('dossier', { nDemandes: 2 });
  fondPage = atelier.fond;
  const { a, H } = atelier;
  const PANNEAUX = { 'Traiter la demande': 'dem', 'Retirer une ligne': 'ret', 'Changer l’étape': 'eta' };
  const panneauInitial = PANNEAUX[param('panneau', ['Aucun', ...Object.keys(PANNEAUX)], 'Aucun')] || null;

  // Fiche technique : les lieux viennent du dossier (Bruxelles, comme le transport de 44,8 km).
  const FICHE = [['Lieu de la cérémonie', 'Église Saint-Jean-Baptiste, ' + LIEU_014.ville], ['Heure de la cérémonie', '13:30'], ['Lieu de la réception', LIEU_014.nom + ', ' + LIEU_014.ville],
    ['Nombre d’invités', '85'], ['Personnes à photographier en priorité', 'Grands-parents, témoins'], ['Moments clés', 'Discours, ouverture du bal'],
    ['Contact le jour J', ''], ['Restrictions du lieu ou du culte', ''], ['Plan de table', '']];
  const ONGLETS = [['devis', 'Devis'], ['fiches', 'Fiche technique'], ['dem', 'Demandes'], ['msg', 'Messages'], ['pay', 'Paiements'], ['prod', 'Production'], ['docs', 'Documents']];
  const STEPS = ['soumis', 'accepte', 'confirme', 'realise'];

  const st = {
    tab: 'devis', etape: 'soumis', motif: '', lignes: LIGNES_014.map((l) => ({ ...l })), pdf: 2,
    ver: [{ n: 2, d: '10 nov. 2026', ev: 'Fiche technique complétée' }, { n: 1, d: DATES_014.soumisCourt, ev: 'Dossier soumis' }],
    reqs: ['r1', 'r2'], dRes: null, n: 0
  };

  // ------------------------------------------------------------------ statique
  ecrire($('#eye'), 'Dossier n° 2027-014 · soumis le ' + DATES_014.soumisCourt);
  ecrire($('#h1'), 'Camille D.,');
  ecrire($('#h2'), () => el('i', { style: "font:italic 400 44px/1 'Instrument Serif',serif" }, 'mariage le 12 juin 2027.'));
  preparer(document, a);
  texte($('#pend-titre'), REQ.r1.titre);
  texte($('#pend-note'), '+' + eurC(REQ.r1.add.ht) + ' HTVA · demandée il y a 2 jours');

  const nouvelleVersion = (ev) => { const n = st.pdf + 1; st.pdf = n; st.ver = [{ n, d: '11 nov. 2026', ev }].concat(st.ver); return n; };

  // ------------------------------------------------------------------ actions des panneaux
  const contexte = {
    lignes: () => st.lignes,
    etape: () => st.etape,
    baseDemande: () => st.lignes,
    reqs: () => st.reqs,
    surChange: () => rendre(),
    valider(r) {
      st.reqs = st.reqs.filter((k) => k !== (r === REQ.r1 ? 'r1' : 'r2'));
      st.dRes = true;
      if (r.add) st.lignes = st.lignes.concat([{ ...r.add }]);
      const n = nouvelleVersion('Demande validée : ' + r.titre.toLowerCase());
      return { ok: true, t: 'Demande validée.', s: 'Nouvelle version PDF : v' + n + (r.add ? ' · nouveau total ' + eurC(totaux(st.lignes).ttc) + ' TVAC.' : '.') };
    },
    refuser(r) {
      st.reqs = st.reqs.filter((k) => k !== (r === REQ.r1 ? 'r1' : 'r2'));
      st.dRes = false;
      return { ok: false, t: 'Demande refusée.', s: 'Le client voit le motif dans son dossier ; rien d’autre ne change.' };
    },
    retirer(l, fr) {
      let lg = st.lignes.filter((x) => x.id !== l.id);
      if (fr) lg = lg.concat([{ id: 'fr' + panneaux.etat.n, t: 'Frais de retrait', d: 'Retrait de « ' + l.t + ' »', ht: fr }]);
      st.lignes = lg;
      const n = nouvelleVersion('Ligne retirée : ' + l.t);
      return { ok: true, t: 'Ligne retirée.', s: 'Nouvelle version PDF : v' + n + ' · nouveau total ' + eurC(totaux(lg).ttc) + ' TVAC.' };
    },
    changer(c, m, fr) {
      st.etape = c; st.motif = m;
      const n = nouvelleVersion('Étape : ' + ETAPES[c].t.toLowerCase());
      if (fr) st.lignes = st.lignes.concat([{ id: 'fa', t: 'Frais d’annulation', d: 'Appliqués à l’annulation du dossier', ht: fr }]);
      return { ok: c !== 'refuse' && c !== 'annule', t: 'Le dossier passe à « ' + ETAPES[c].t + ' ».', s: 'Nouvelle version PDF : v' + n + '.' + (c === 'accepte' ? ' Les échéances sont créées.' : '') };
    }
  };
  const panneaux = monterPanneaux({ vie, atelier, page: 'dossier', contexte, panneauInitial, REQ });

  // ------------------------------------------------------------------ éléments de liste
  const ou = (n, i) => i;

  function creerEtape(s, i) {
    const li = el('li', { style: `left:${posf(920 + i * 118, 1)}` },
      el('span', { class: 'pt', 'aria-hidden': 'true', style: 'position:absolute;left:43px;top:0;width:14px;height:14px;border-radius:7px;border:1.5px solid' }),
      el('span', { class: 'mono', style: 'position:absolute;left:0;top:22px;width:100px;text-align:center' }));
    animer(li, H(1.2 + i * .12));
    return li;
  }
  function majEtape(li, k, i, ix) {
    const e = ETAPES[k], pt = li.firstChild;
    pt.style.background = ix >= i ? e.c : '#FFFFFF'; pt.style.borderColor = ix >= i ? e.c : 'rgba(13,14,16,.35)';
    pt.style.boxShadow = ix === i ? '0 0 0 5px rgba(13,14,16,.08)' : 'none';
    texte(li.lastChild, e.t); li.lastChild.style.color = ix === i ? '#0D0E10' : '#4B4D52';
  }

  function creerLigne(l, i) {
    const n = el('div', { style: `position:absolute;left:332px;width:${larg(644, 1)};height:54px` },
      el('span', { class: 't', style: 'position:absolute;left:0;top:0;font:400 16px Inter,sans-serif;white-space:nowrap' }),
      el('span', { class: 'note d', style: 'position:absolute;left:0;top:24px;white-space:nowrap' }),
      el('span', { class: 'v', style: "position:absolute;right:92px;top:2px;font:500 13.5px 'IBM Plex Mono',monospace" }),
      el('button', { type: 'button', class: 'mini doux', style: 'position:absolute;right:0;top:2px' }, 'Retirer'),
      el('span', { 'aria-hidden': 'true', style: 'position:absolute;left:0;right:0;bottom:0;height:1px;background:rgba(13,14,16,.08)' }));
    animer(n, H(1.6 + i * .1));
    n.querySelector('button').addEventListener('click', () => { const ligne = n._ligne; panneaux.ouvrir('ret', { sel: ligne.id }); });
    return n;
  }
  function majLigne(n, l, i, can) {
    n._ligne = l; n.style.top = (330 + i * 76) + 'px';
    texte(n.querySelector('.t'), l.t); texte(n.querySelector('.d'), l.d); texte(n.querySelector('.v'), eurC(l.ht));
    const b = n.querySelector('button'); b.hidden = !can; b.setAttribute('aria-label', 'Retirer la ligne ' + l.t);
  }

  function ligneVersion(v, i) {
    const n = el('div', { style: `position:absolute;left:${posf(1052, 1)};width:300px;height:44px` },
      el('span', { class: 't', style: 'position:absolute;left:0;top:0;font:400 14.5px Inter,sans-serif;white-space:nowrap' }),
      el('span', { class: 'note s', style: 'position:absolute;left:0;top:20px;width:230px;font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis' }),
      el('a', { href: '#', class: 'lien mini', style: 'position:absolute;right:0;top:2px', on: { click: (e) => e.preventDefault() } }, 'Ouvrir ↗'));
    animer(n, a.p3);
    return n;
  }
  const majVersion = (n, v, i) => { n.style.top = (712 + i * 50) + 'px'; texte(n.querySelector('.t'), 'Version ' + v.n + (i === 0 ? ' · actuelle' : '')); texte(n.querySelector('.s'), v.d + ' · ' + v.ev); };

  function ligneDoc() {
    return el('div', { class: 'sep', style: `position:absolute;left:332px;width:${larg(1016, 1)};height:54px` },
      el('span', { class: 't', style: 'position:absolute;left:0;top:4px;font:400 16px Inter,sans-serif' }),
      el('span', { class: 'note s', style: 'position:absolute;left:0;top:26px;font-size:12.5px' }),
      el('a', { href: '#', class: 'lien mini', style: 'position:absolute;right:120px;top:8px', on: { click: (e) => e.preventDefault() } }, 'Ouvrir ↗'),
      el('a', { href: '#', class: 'lien mini', style: 'position:absolute;right:0;top:8px', on: { click: (e) => e.preventDefault() } }, 'Télécharger'));
  }
  const majDoc = (n, v, i) => { n.style.top = (340 + i * 64) + 'px'; texte(n.querySelector('.t'), 'Version ' + v.n + (i === 0 ? ' · actuelle' : '')); texte(n.querySelector('.s'), v.d + ' · ' + v.ev); };

  function champFiche() {
    return el('div', { style: 'position:absolute;width:480px;height:60px' }, el('span', { class: 'mono' }),
      el('span', { class: 'val', style: 'position:absolute;left:0;top:20px;font:400 16px Inter,sans-serif;display:inline-flex;align-items:center;gap:8px' },
        el('i', { 'aria-hidden': 'true', style: 'display:block;width:8px;height:8px;border-radius:4px;box-shadow:inset 0 0 0 1.5px #D9783A' }), el('span')));
  }
  function majFiche(n, f, i) {
    n.style.left = i % 2 ? posf(860, .5) : '332px'; n.style.top = (340 + Math.floor(i / 2) * 82) + 'px';
    texte(n.firstChild, f[0]); const val = n.querySelector('.val');
    val.style.color = f[1] ? '#0D0E10' : '#4B4D52'; val.firstChild.hidden = !!f[1]; texte(val.lastChild, f[1] || 'Sans réponse');
  }

  function ligneDemande() {
    const n = el('div', { class: 'sep', style: `position:absolute;left:332px;width:${larg(1016, 1)};height:70px` },
      el('span', { class: 't', style: 'position:absolute;left:0;top:8px;font:400 17px Inter,sans-serif' }),
      el('span', { class: 'etape', style: 'position:absolute;left:0;top:38px;color:#4B4D52' }, el('i', { 'aria-hidden': 'true' }), el('span', { class: 's' })),
      el('span', { class: 'act', style: 'display:contents' },
        el('span', { class: 'encre', 'aria-hidden': 'true', style: `position:absolute;left:${posf(816, 1)};top:12px;width:200px;height:44px;border-radius:22px` }),
        el('button', { type: 'button', class: 'btn', style: `left:${posf(816, 1)};top:12px;width:200px;height:44px;border-radius:22px`, on: { click: () => panneaux.ouvrir('dem', { req: 'r1' }) } }, 'Traiter la demande')));
    return n;
  }
  function majDemande(n, d, i) {
    n.style.top = (340 + i * 84) + 'px'; texte(n.querySelector('.t'), d.t); texte(n.querySelector('.s'), d.s);
    const p = n.querySelector('.etape i'); p.style.background = d.c; p.style.boxShadow = d.sh; voir(n.querySelector('.act'), d.act);
  }

  function ligneEcheance() {
    return el('div', { class: 'sep', style: `position:absolute;left:332px;width:${larg(1016, 1)};height:70px` },
      el('span', { class: 't', style: 'position:absolute;left:0;top:8px;font:400 17px Inter,sans-serif' }),
      el('span', { class: 'etape', style: 'position:absolute;left:0;top:38px;color:#4B4D52' }, el('i', { 'aria-hidden': 'true', style: 'box-shadow:none' }), el('span', { class: 's' })),
      el('span', { class: 'v', style: 'position:absolute;right:220px;top:12px;font:300 22px Inter,sans-serif' }),
      el('button', { type: 'button', class: 'mini', style: 'position:absolute;right:0;top:18px' }, 'Enregistrer un paiement'));
  }
  function majEcheance(n, e, i) {
    n.style.top = (344 + i * 84) + 'px'; texte(n.querySelector('.t'), e.t); texte(n.querySelector('.s'), e.s); texte(n.querySelector('.v'), e.v);
    n.querySelector('.etape i').style.background = e.c;
  }

  // ------------------------------------------------------------------ onglets
  const onglets = $('#onglets');
  ONGLETS.forEach(([k, t]) => {
    const b = el('button', { type: 'button', role: 'tab', class: 'tab', 'aria-selected': 'false', on: { click: () => { st.tab = k; rendre(); } } }, el('span', { class: 'lib' }, t), el('span', { class: 'bd' }));
    b.dataset.k = k; onglets.append(b);
  });

  // ------------------------------------------------------------------ rendu
  function rendre() {
    const ix = STEPS.indexOf(st.etape), closed = TRANSITIONS[st.etape].length === 0, t0 = totaux(st.lignes);
    const pend = st.reqs.includes('r1'), nDem = pend ? 1 : 0;
    atelier.setBadge(st.reqs.length);

    texte($('#note'), 'camille.d@example.com · version PDF actuelle : v' + st.pdf
      + (closed && clos(st.etape) ? ' · ' + ETAPES[st.etape].t.toLowerCase() + (st.motif ? ' · motif : ' + st.motif : '') : ''));

    // jauge d'étapes
    liste($('#etapes'), STEPS, ou, creerEtape, (li, k, i) => majEtape(li, k, i, ix));
    const prog = $('#progres'); voir(prog, ix > 0); prog.setAttribute('d', 'M0 2 L' + (Math.max(ix, 0) * 118) + ' 2');

    // bouton Changer l'étape
    const ch = $('#chg'); ch.className = closed ? 'btn off' : 'btn'; ch.setAttribute('aria-disabled', closed ? 'true' : 'false');
    texte(ch, closed ? 'Dossier clos' : 'Changer l’étape'); $('#chg-enc').style.opacity = closed ? '0' : '1';

    // onglets
    onglets.querySelectorAll('.tab').forEach((b) => {
      const k = b.dataset.k, on = st.tab === k;
      b.className = 'tab' + (on ? ' on' : ''); b.setAttribute('aria-selected', on ? 'true' : 'false');
      const bd = b.querySelector('.bd'), v = k === 'dem' ? (nDem ? String(nDem) : false) : (k === 'msg' ? '1' : false);
      bd.hidden = !v; if (v) texte(bd, v);
    });
    voir($('#v-devis'), st.tab === 'devis'); voir($('#v-autre'), st.tab !== 'devis');
    ['fiches', 'dem', 'msg', 'pay', 'prod', 'docs'].forEach((k) => voir($('#v-' + k), st.tab === k));

    // devis
    liste($('#lignes'), st.lignes, ou, creerLigne, (n, l, i) => majLigne(n, l, i, !closed));
    texte($('#t-ht'), eurC(t0.ht)); texte($('#t-tva'), eurC(t0.tva)); texte($('#t-ttc'), eurC(t0.ttc));
    voir($('#pend'), pend); voir($('#nopend'), !pend);
    liste($('#vers'), st.ver.slice(0, 3), ou, ligneVersion, majVersion);

    // autres onglets
    liste($('#fiche'), FICHE, ou, champFiche, majFiche);
    const dems = [];
    if (pend) dems.push({ t: REQ.r1.titre, s: 'En attente · demandée le 9 nov. 2026 · +' + eurC(REQ.r1.add.ht) + ' HTVA', act: true, c: '#3AA6B5', sh: 'none' });
    else if (st.dRes !== null) dems.push({ t: REQ.r1.titre, s: st.dRes ? 'Validée aujourd’hui' : 'Refusée aujourd’hui', act: false, c: st.dRes ? '#0D0E10' : 'transparent', sh: st.dRes ? 'none' : 'inset 0 0 0 1.5px #8C8E93' });
    dems.push({ t: 'Ajout : vol de drone', s: 'Refusée le 10 nov. · motif : vol interdit au-dessus du lieu de réception', act: false, c: 'transparent', sh: 'inset 0 0 0 1.5px #8C8E93' });
    liste($('#dems'), dems, ou, ligneDemande, majDemande);
    const aco = Math.round(t0.ttc * .3);
    const ech = [{ t: 'Acompte · 30 %', v: eurC(aco), s: ix >= 2 ? 'Reçu le 11 nov. 2026' : 'À recevoir avant le 11 déc. 2026', c: ix >= 2 ? '#0D0E10' : '#D9783A' },
      { t: 'Solde', v: eurC(t0.ttc - aco), s: 'Le jour J, 12 juin 2027', c: 'rgba(13,14,16,.35)' }];
    voir($('#pay-off'), ix < 1);
    liste($('#ech'), ix >= 1 ? ech : [], ou, ligneEcheance, majEcheance);
    liste($('#docs'), st.ver.slice(0, 6), ou, ligneDoc, majDoc);
  }

  $('#chg').addEventListener('click', () => { if (!(TRANSITIONS[st.etape].length === 0)) panneaux.ouvrir('eta'); });
  $('#traiter').addEventListener('click', () => panneaux.ouvrir('dem', { req: 'r1' }));
  $('#voir-fiche').addEventListener('click', () => { st.tab = 'fiches'; rendre(); });
  rendre();
}

export function destroy() {
  if (vie) vie.nettoyer();
  vie = null;
  if (fondPage) animer(fondPage, '');   // les panneaux animaient #fond (menu inclus)
}
