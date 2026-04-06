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
  <div style="max-width:560px;margin:0 auto;background:#0D1225;border-radius:16px;padding:40px;border:1px solid rgba(255,107,53,0.2);">
    <div style="text-align:center;margin-bottom:32px;">
      <h1 style="background:linear-gradient(135deg,#FF6B35,#FFD700);-webkit-background-clip:text;background-clip:text;color:transparent;font-family:'Syne',sans-serif;font-weight:800;font-size:32px;margin:0;letter-spacing:-1px;">MOKSHA</h1>
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
      `<h2 style="color:#FF6B35;font-family:'Syne',sans-serif;">Bienvenue ${name} 🔥</h2>
       <p>Tu viens de faire le premier pas vers ta libération entrepreneuriale. MOKSHA va t'accompagner à chaque étape.</p>
       <p>Voici ce que tu peux faire dès maintenant :</p>
       <ul>
         <li>🏢 Créer ton entreprise en 10 minutes</li>
         <li>🤖 Poser tes questions à JurisIA</li>
         <li>🔐 Stocker tes documents dans ProofVault</li>
       </ul>
       <div style="text-align:center;margin:24px 0;">
         <a href="https://moksha.purama.dev/dashboard" style="display:inline-block;background:linear-gradient(135deg,#FF6B35,#FFD700);color:#070B18;padding:14px 32px;border-radius:12px;text-decoration:none;font-weight:700;">Accéder à mon dashboard</a>
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
      `<h2 style="color:#FFD700;">🎉 Ton Kbis est arrivé</h2>
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
      `<h2 style="color:#FF6B35;">⏰ ${titre}</h2>
       <p>Échéance : <strong>${echeance}</strong></p>
       <p>Ne laisse pas passer cette échéance. Connecte-toi pour agir dès maintenant.</p>`
    ),
}
