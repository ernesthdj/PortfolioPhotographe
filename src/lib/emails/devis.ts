import "server-only";

export type DevisEmailData = {
  nom: string;
  email: string;
  telephone: string;
  dateMariage: string;
  villeZone?: string;
  nombreInvites?: number;
  message?: string;
  formuleNom: string;
  prixBase: number;
  fraisDeplacement: number;
  total: number;
  distanceKm?: number;
};

const formatEuros = (value: number) =>
  new Intl.NumberFormat("fr-BE", { style: "currency", currency: "EUR" }).format(value);

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("fr-BE", { dateStyle: "long" }).format(new Date(value));

function wrapper(title: string, bodyHtml: string) {
  return `
    <div style="font-family:Arial,Helvetica,sans-serif;background:#EFE7D8;padding:32px;color:#2B2521">
      <div style="max-width:520px;margin:0 auto;background:#F4EEE4;border:1px solid rgba(43,37,33,.12);padding:32px">
        <h1 style="font-size:20px;margin:0 0 20px">${title}</h1>
        ${bodyHtml}
      </div>
    </div>
  `;
}

// Notification à Ernest — voir docs/modules/DEVIS.md §2.
export function renderNotificationEmail(data: DevisEmailData) {
  const details = `
    <table style="width:100%;border-collapse:collapse;font-size:14px">
      <tr><td style="padding:6px 0;color:#8A5A2F">Nom</td><td style="padding:6px 0">${data.nom}</td></tr>
      <tr><td style="padding:6px 0;color:#8A5A2F">Email</td><td style="padding:6px 0">${data.email}</td></tr>
      <tr><td style="padding:6px 0;color:#8A5A2F">Téléphone</td><td style="padding:6px 0">${data.telephone}</td></tr>
      <tr><td style="padding:6px 0;color:#8A5A2F">Date du mariage</td><td style="padding:6px 0">${formatDate(data.dateMariage)}</td></tr>
      ${data.villeZone ? `<tr><td style="padding:6px 0;color:#8A5A2F">Ville / zone</td><td style="padding:6px 0">${data.villeZone}</td></tr>` : ""}
      ${data.nombreInvites ? `<tr><td style="padding:6px 0;color:#8A5A2F">Invités</td><td style="padding:6px 0">${data.nombreInvites}</td></tr>` : ""}
      <tr><td style="padding:6px 0;color:#8A5A2F">Formule</td><td style="padding:6px 0">${data.formuleNom} — ${formatEuros(data.prixBase)}</td></tr>
      ${data.fraisDeplacement > 0 ? `<tr><td style="padding:6px 0;color:#8A5A2F">Frais déplacement</td><td style="padding:6px 0">${formatEuros(data.fraisDeplacement)}${data.distanceKm ? ` (${data.distanceKm.toFixed(1)} km)` : ""}</td></tr>` : ""}
      <tr><td style="padding:6px 0;color:#8A5A2F;font-weight:bold">Total estimé</td><td style="padding:6px 0;font-weight:bold">${formatEuros(data.total)}</td></tr>
      ${data.message ? `<tr><td style="padding:6px 0;color:#8A5A2F;vertical-align:top">Message</td><td style="padding:6px 0">${data.message}</td></tr>` : ""}
    </table>
  `;

  return {
    subject: `Nouveau devis — ${data.nom} (${formatDate(data.dateMariage)})`,
    html: wrapper("Nouvelle demande de devis", details),
  };
}

// Confirmation au client — voir docs/modules/DEVIS.md §2 (email automatique requis).
export function renderConfirmationEmail(data: DevisEmailData) {
  const body = `
    <p style="font-size:14px;line-height:1.6">Bonjour ${data.nom},</p>
    <p style="font-size:14px;line-height:1.6">
      Merci pour votre demande ! Voici le récapitulatif de votre estimation :
    </p>
    <table style="width:100%;border-collapse:collapse;font-size:14px;margin:16px 0">
      <tr><td style="padding:6px 0;color:#8A5A2F">Formule</td><td style="padding:6px 0">${data.formuleNom}</td></tr>
      ${data.fraisDeplacement > 0 ? `<tr><td style="padding:6px 0;color:#8A5A2F">Frais déplacement</td><td style="padding:6px 0">${formatEuros(data.fraisDeplacement)}</td></tr>` : ""}
      <tr><td style="padding:6px 0;color:#8A5A2F;font-weight:bold">Total estimé</td><td style="padding:6px 0;font-weight:bold">${formatEuros(data.total)}</td></tr>
    </table>
    <p style="font-size:14px;line-height:1.6">
      Je reviens vers vous sous 48h pour échanger sur votre projet. À très vite !
    </p>
    <p style="font-size:14px;line-height:1.6">Ernest</p>
  `;

  return {
    subject: "Votre estimation — Ernest H. Photography",
    html: wrapper("Votre demande a bien été reçue", body),
  };
}
