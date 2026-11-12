// Demandes du client sur un dossier (ajout, fiche technique) : partagées entre le tableau de bord,
// la liste des demandes et le dossier. Montants en centimes HTVA.
export const REQ = {
  r1: { num: '2027-014', cli: 'Camille D.', type: 'Ajout', titre: 'Ajout : 10 tirages 20 × 30', sous: 'Demande du 9 nov. 2026 · prix du jour de la demande', quand: 'Demandée le 9 nov. 2026 · il y a 2 jours', c: '#3AA6B5',
    add: { id: 'tir', t: '10 tirages 20×30', d: 'Option', ht: 4500 } },
  r2: { num: '2027-002', cli: 'Studio Lemaire', type: 'Fiche technique', titre: 'Horaire déplacé de 14:00 à 15:30', sous: 'Fiche « Événementiel » · aujourd’hui à 06:12', quand: 'Demandée aujourd’hui à 06:12 · il y a 5 h', c: '#D9783A',
    avant: [['Heure de début', '14:00'], ['Heure de fin', '19:00'], ['Lieu', 'Tour & Taxis, Bruxelles']],
    apres: [['Heure de début', '15:30', 1], ['Heure de fin', '20:30', 1], ['Lieu', 'Tour & Taxis, Bruxelles']] }
};
/** Demandes déjà traitées (historique). */
export const HISTORIQUE = [
  { num: '2026-041', cli: 'Famille R.', t: 'Adresse de la cérémonie changée', r: 'Validée le 8 nov.', ok: true },
  { num: '2027-008', cli: 'Inès & Tom', t: 'Ajout : seconde photographe', r: 'Refusée le 5 nov. · motif : indisponible ce jour-là', ok: false }
];
