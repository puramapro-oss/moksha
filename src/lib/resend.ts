// MOKSHA — Resend emails

const RESEND_BASE = 'https://api.resend.com'
const FROM = 'MOKSHA <noreply@purama.dev>'

type SendEmailPayload = {
  to: string
  subject: string
  html: string
}

export async function sendEmail({ to, subject, html }: SendEmailPayload): Promise<boolean> {
  const key = process.env.RESEND_API_KEY
  if (!key) return false
  try {
    const res = await fetch(`${RESEND_BASE}/emails`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({ from: FROM, to, subject, html }),
    })
    return res.ok
  } catch {
    return false
  }
}

const shell = (title: string, body: string) => `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/><title>${title}</title></head>
<body style="font-family:'DM Sans',Arial,sans-serif;background:#070B18;color:#F8FAFC;margin:0;padding:40px 20px;">
  <div style="max-width:560px;margin:0 auto;background:#0D1225;border-radius:16px;padding:40px;border:1px solid rgba(255, 61, 0,0.2);">
    <div style="text-align:center;margin-bottom:32px;">
      <h1 style="background:linear-gradient(135deg,#FF3D00,#FFB300);-webkit-background-clip:text;background-clip:text;color:transparent;font-family:'Syne',sans-serif;font-weight:800;font-size:32px;margin:0;letter-spacing:-1px;">MOKSHA</h1>
      <p style="color:#94A3B8;margin:8px 0 0;font-size:13px;">Libère-toi. Crée ton empire.</p>
    </div>
    ${body}
    <div style="margin-top:32px;padding-top:24px;border-top:1px solid rgba(255,255,255,0.1);text-align:center;color:#64748B;font-size:12px;">
      <p>SASU PURAMA — 8 Rue de la Chapelle, 25560 Frasne</p>
      <p>© 2026 MOKSHA — Tous droits réservés</p>
    </div>
  </div>
</body>
</html>`

export const emailTemplates = {
  bienvenue: (name: string) =>
    shell(
      'Bienvenue sur MOKSHA',
      `<h2 style="color:#FF3D00;font-family:'Syne',sans-serif;">Bienvenue ${name} 🔥</h2>
       <p>Tu viens de faire le premier pas vers ta libération entrepreneuriale. MOKSHA va t'accompagner à chaque étape.</p>
       <p>Voici ce que tu peux faire dès maintenant :</p>
       <ul>
         <li>🏢 Créer ton entreprise en 10 minutes</li>
         <li>🤖 Poser tes questions à JurisIA</li>
         <li>🔐 Stocker tes documents dans ProofVault</li>
       </ul>
       <div style="text-align:center;margin:24px 0;">
         <a href="https://moksha.purama.dev/dashboard" style="display:inline-block;background:linear-gradient(135deg,#FF3D00,#FFB300);color:#070B18;padding:14px 32px;border-radius:12px;text-decoration:none;font-weight:700;">Accéder à mon dashboard</a>
       </div>`
    ),
  creation_depose: (denomination: string, reference: string) =>
    shell(
      'Dossier déposé',
      `<h2 style="color:#5DCAA5;">✅ Dossier ${denomination} déposé</h2>
       <p>Ton dossier de création est officiellement déposé auprès de l'INPI. Référence : <strong>${reference}</strong></p>
       <p>Tu recevras ton Kbis sous 5 à 10 jours ouvrés directement dans ton ProofVault.</p>`
    ),
  kbis_recu: (denomination: string) =>
    shell(
      'Ton Kbis est arrivé',
      `<h2 style="color:#FFB300;">🎉 Ton Kbis est arrivé</h2>
       <p>Félicitations ! L'entreprise <strong>${denomination}</strong> est officiellement créée. Ton Kbis est désormais disponible dans ProofVault.</p>`
    ),
  paiement_ok: (plan: string) =>
    shell(
      'Paiement confirmé',
      `<h2 style="color:#5DCAA5;">Paiement confirmé</h2>
       <p>Ton plan <strong>${plan}</strong> est actif. Merci de ta confiance 🙏</p>`
    ),
  rappel: (titre: string, echeance: string) =>
    shell(
      `Rappel : ${titre}`,
      `<h2 style="color:#FF3D00;">⏰ ${titre}</h2>
       <p>Échéance : <strong>${echeance}</strong></p>
       <p>Ne laisse pas passer cette échéance. Connecte-toi pour agir dès maintenant.</p>`
    ),
  seq_j1_astuce: (name: string) =>
    shell(
      'Une astuce pour bien démarrer',
      `<h2 style="color:#FF3D00;">Salut ${name} 👋</h2>
       <p>Une astuce qui change tout dès le 1er jour : <strong>pose ton intention du jour</strong>. Ça prend 10 secondes et ça donne une direction claire.</p>
       <div style="text-align:center;margin:24px 0;">
         <a href="https://moksha.purama.dev/dashboard/intentions" style="display:inline-block;background:linear-gradient(135deg,#FF3D00,#FFB300);color:#070B18;padding:14px 32px;border-radius:12px;text-decoration:none;font-weight:700;">Poser mon intention</a>
       </div>`,
    ),
  seq_j3_relance: (name: string) =>
    shell(
      'On ne t\'a pas vu depuis 2 jours',
      `<h2 style="color:#FFB300;">${name}, tout va bien ?</h2>
       <p>Tu as commencé fort. Ne lâche pas maintenant. 3 minutes par jour suffisent pour maintenir le momentum.</p>
       <div style="text-align:center;margin:24px 0;">
         <a href="https://moksha.purama.dev/dashboard" style="display:inline-block;background:linear-gradient(135deg,#FF3D00,#FFB300);color:#070B18;padding:14px 32px;border-radius:12px;text-decoration:none;font-weight:700;">Reprendre où j'en étais</a>
       </div>`,
    ),
  seq_j7_tips: (name: string) =>
    shell(
      '3 fonctionnalités que tu n\'as pas encore utilisées',
      `<h2 style="color:#5DCAA5;">${name}, voici 3 leviers cachés 🔥</h2>
       <ul>
         <li><strong>/breathe</strong> — 3 min de 4-7-8 = +50 points et décision claire.</li>
         <li><strong>/gratitude</strong> — 3 gratitudes par jour = +300 points + streak.</li>
         <li><strong>/financer</strong> — vérifie si tu peux récupérer 100% du coût via les aides publiques.</li>
       </ul>
       <div style="text-align:center;margin:24px 0;">
         <a href="https://moksha.purama.dev/dashboard/financer" style="display:inline-block;background:linear-gradient(135deg,#FF3D00,#FFB300);color:#070B18;padding:14px 32px;border-radius:12px;text-decoration:none;font-weight:700;">Vérifier mes droits</a>
       </div>`,
    ),
  seq_j14_upgrade: (name: string) =>
    shell(
      '-20% sur ton abonnement Pro pendant 48h',
      `<h2 style="color:#FF3D00;">${name}, offre exclusive</h2>
       <p>Tu utilises MOKSHA depuis 2 semaines. Voici un code perso pour passer Pro à -20% pendant 48h.</p>
       <div style="background:rgba(255, 61, 0,0.1);border:1px dashed #FF3D00;padding:16px;border-radius:12px;text-align:center;margin:20px 0;">
         <p style="margin:0;font-size:12px;color:#FFB300;">CODE PROMO</p>
         <p style="margin:4px 0 0;font-family:monospace;font-size:24px;font-weight:800;color:#FF3D00;">MOKSHA20</p>
       </div>
       <div style="text-align:center;margin:24px 0;">
         <a href="https://moksha.purama.dev/pricing" style="display:inline-block;background:linear-gradient(135deg,#FF3D00,#FFB300);color:#070B18;padding:14px 32px;border-radius:12px;text-decoration:none;font-weight:700;">Passer Pro</a>
       </div>
       <p style="font-size:11px;color:#94A3B8;">Valable 48h, cumulable avec les aides publiques.</p>`,
    ),
  seq_j21_temoignage: (name: string) =>
    shell(
      'Ce que MOKSHA fait vraiment',
      `<h2 style="color:#FFB300;">${name}, une question 💭</h2>
       <p>Après 3 semaines sur MOKSHA, qu'est-ce qui t'a le plus marqué ? Réponds simplement à ce mail — je lis chaque retour en personne.</p>
       <p>Ton feedback aide à construire MOKSHA pour les 10 000 prochains entrepreneurs.</p>
       <p style="margin-top:24px;">Matiss<br/><em style="color:#94A3B8;">Fondateur</em></p>`,
    ),
  seq_j30_winback: (name: string) =>
    shell(
      'On te garde ta place',
      `<h2 style="color:#FF3D00;">${name}, ta place t'attend</h2>
       <p>1 mois que tu as créé ton compte. On voulait juste te dire : ta place est toujours là, tes données intactes, ton streak en pause.</p>
       <p>Reviens quand tu veux. Pas de pression.</p>
       <div style="text-align:center;margin:24px 0;">
         <a href="https://moksha.purama.dev/dashboard" style="display:inline-block;background:linear-gradient(135deg,#FF3D00,#FFB300);color:#070B18;padding:14px 32px;border-radius:12px;text-decoration:none;font-weight:700;">Revenir sur MOKSHA</a>
       </div>`,
    ),
  wrapped: (name: string, stats: { points: number; gratitudes: number; breath_min: number; dossiers: number }, month: string) =>
    shell(
      `Ton mois ${month} sur MOKSHA`,
      `<h2 style="color:#FFB300;">${name}, ton wrapped 🔥</h2>
       <p>Voici ce que tu as accompli ce mois-ci :</p>
       <table style="width:100%;border-collapse:collapse;margin:20px 0;">
         <tr><td style="padding:12px;border-bottom:1px solid rgba(255,255,255,0.08);">Points gagnés</td><td style="text-align:right;color:#FFB300;font-weight:700;">${stats.points}</td></tr>
         <tr><td style="padding:12px;border-bottom:1px solid rgba(255,255,255,0.08);">Gratitudes écrites</td><td style="text-align:right;color:#5DCAA5;font-weight:700;">${stats.gratitudes}</td></tr>
         <tr><td style="padding:12px;border-bottom:1px solid rgba(255,255,255,0.08);">Minutes de respiration</td><td style="text-align:right;color:#FF3D00;font-weight:700;">${stats.breath_min}</td></tr>
         <tr><td style="padding:12px;">Dossiers financement</td><td style="text-align:right;color:#FFB300;font-weight:700;">${stats.dossiers}</td></tr>
       </table>
       <p><em>Tu vois ? Tu es capable de tout.</em></p>
       <div style="text-align:center;margin:24px 0;">
         <a href="https://moksha.purama.dev/dashboard/wrapped" style="display:inline-block;background:linear-gradient(135deg,#FF3D00,#FFB300);color:#070B18;padding:14px 32px;border-radius:12px;text-decoration:none;font-weight:700;">Voir mon wrapped complet</a>
       </div>`,
    ),
}
