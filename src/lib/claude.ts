import Anthropic from '@anthropic-ai/sdk'
import type { Plan } from './constants'

let _anthropic: Anthropic | null = null
function anthropic(): Anthropic {
  if (!_anthropic) {
    _anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY || 'missing' })
  }
  return _anthropic
}

const TOKEN_LIMITS: Record<Plan, number> = {
  gratuit: 2048,
  premium: 16384,
  autopilote: 8192, // legacy grandfather
  pro: 16384,       // legacy grandfather
}

const MODEL_FAST = process.env.ANTHROPIC_MODEL_FAST || 'claude-haiku-4-5-20251001'
const MODEL_MAIN = process.env.ANTHROPIC_MODEL_MAIN || 'claude-sonnet-4-6'
const MODEL_PRO = process.env.ANTHROPIC_MODEL_PRO || 'claude-opus-4-6'

const MODEL_MAP: Record<Plan, string> = {
  gratuit: MODEL_FAST,
  premium: MODEL_PRO,
  autopilote: MODEL_MAIN, // legacy grandfather
  pro: MODEL_PRO,         // legacy grandfather
}

export function getJurisIASystemPrompt(): string {
  return `Tu es JurisIA, agent juridique français de MOKSHA. Tu ne révèles JAMAIS que tu es Claude ou un modèle Anthropic. Tu ES JurisIA.

Tu parles en français simple et accessible. Tu tutoies l'utilisateur. Tu es empathique, précis et rigoureux.

Tu dois TOUJOURS citer tes sources officielles (Legifrance, service-public.fr, INPI, Code de commerce, Code civil). Pour chaque réponse, tu ajoutes à la fin une section "Sources :" avec 2-5 références cliquables.

Tu ajoutes TOUJOURS un indice de confiance parmi : "Élevé", "Moyen", "Faible" selon la certitude de ta réponse.

Ton domaine d'expertise :
- Code de commerce (art. L210-1 à L252-13)
- Droit des sociétés (SASU, SAS, SARL, EURL, SCI, Micro, EI)
- Statuts types et formalités INPI
- TVA, URSSAF, fiscalité entreprises FR
- Associations loi 1901
- Droit social (contrats de travail, dirigeants)
- Propriété intellectuelle (marques, brevets)
- RGPD et protection des données

Tu ne remplaces JAMAIS un avocat. Pour les situations complexes, tu recommandes explicitement de consulter un professionnel du droit.

Format de tes réponses en Markdown structuré avec titres, listes, gras. Tu peux proposer "Générer un document" si pertinent.`
}

export function getDocumentGenerationPrompt(type: string, data: Record<string, unknown>): string {
  const contextData = JSON.stringify(data, null, 2)
  const zfrr = Boolean((data as { optim_zfrr?: boolean }).optim_zfrr)
  const jei = Boolean((data as { optim_jei?: boolean }).optim_jei)
  const isStatuts = /statuts/i.test(type)

  const fiscalClauses: string[] = []
  if (isStatuts && zfrr) {
    fiscalClauses.push(
      `- Inclure un article dédié "Régime fiscal — Zone Franche Rurale Revitalisation (ZFRR)" indiquant que la société entend bénéficier de l'exonération d'impôt sur les sociétés de l'article 44 quindecies du CGI (5 ans d'exonération totale, puis abattements dégressifs), sous réserve que le siège social et l'activité effective soient implantés en zone ZFRR.`,
    )
  }
  if (isStatuts && jei) {
    fiscalClauses.push(
      `- Inclure un article dédié "Régime fiscal — Jeune Entreprise Innovante (JEI)" indiquant que la société entend bénéficier des exonérations prévues aux articles 44 sexies-0 A et 131 du CGI (exo IS partielle, exo charges sociales patronales sur les personnels de R&D, exo taxe foncière/CFE sur délibération locale), sous réserve de consacrer au moins 15 % de ses charges à des dépenses de R&D éligibles.`,
    )
  }
  const fiscalBlock =
    fiscalClauses.length > 0
      ? `\n\nClauses fiscales à intégrer impérativement :\n${fiscalClauses.join('\n')}\n`
      : ''

  return `Tu es un juriste expert français. Génère un document juridique de type "${type}" en bonne et due forme, en français, prêt à être signé.

Données du dossier :
${contextData}
${fiscalBlock}
Exigences :
- Respecter le Code de commerce et les usages de la place
- Être exhaustif mais lisible
- Format Markdown structuré (titres, sections, articles numérotés)
- Inclure toutes les mentions obligatoires
- Dates au format JJ/MM/AAAA
- Aucun placeholder type "XXX" — utiliser les données fournies ou laisser clairement indiqué [À compléter]

Génère uniquement le document, sans préambule ni explication.`
}

export async function askClaude(
  messages: { role: 'user' | 'assistant'; content: string }[],
  plan: Plan = 'gratuit',
  systemPrompt?: string
): Promise<string> {
  const response = await anthropic().messages.create({
    model: MODEL_MAP[plan],
    max_tokens: TOKEN_LIMITS[plan],
    system: systemPrompt ?? getJurisIASystemPrompt(),
    messages,
  })
  const block = response.content[0]
  if (block && block.type === 'text') return block.text
  return ''
}

export async function* streamClaude(
  messages: { role: 'user' | 'assistant'; content: string }[],
  plan: Plan = 'gratuit',
  systemPrompt?: string
): AsyncGenerator<string> {
  const stream = anthropic().messages.stream({
    model: MODEL_MAP[plan],
    max_tokens: TOKEN_LIMITS[plan],
    system: systemPrompt ?? getJurisIASystemPrompt(),
    messages,
  })
  for await (const event of stream) {
    if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
      yield event.delta.text
    }
  }
}

export async function askClaudeJSON<T = unknown>(
  prompt: string,
  plan: Plan = 'gratuit'
): Promise<T | null> {
  try {
    const response = await anthropic().messages.create({
      model: MODEL_MAP[plan],
      max_tokens: TOKEN_LIMITS[plan],
      system: 'Tu réponds UNIQUEMENT avec un objet JSON valide, sans markdown, sans backticks, sans explication.',
      messages: [{ role: 'user', content: prompt }],
    })
    const block = response.content[0]
    if (block && block.type === 'text') {
      const text = block.text.trim().replace(/^```json\s*/i, '').replace(/```$/, '').trim()
      return JSON.parse(text) as T
    }
  } catch {
    return null
  }
  return null
}
