export function draftOwner(raw: string | null): string | null {
  try {
    const parsed: unknown = raw ? JSON.parse(raw) : null
    if (parsed && typeof parsed === 'object' && '__ownerId' in parsed && typeof parsed.__ownerId === 'string') {
      return parsed.__ownerId || null
    }
  } catch {
    // Form restoration handles an unreadable draft independently.
  }
  return null
}

/** Claim an anonymous draft before emitting it, without adding business fields. */
export function claimDraft(key: string, raw: string, userId: string) {
  const parsed: unknown = JSON.parse(raw)
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Brouillon illisible')
  const owner = draftOwner(raw)
  if (owner && owner !== userId) throw new Error('Ce brouillon appartient à un autre compte. Reconnecte-toi à ce compte pour le finaliser.')
  const data = { ...parsed } as Record<string, unknown>
  delete data.__step
  delete data.__ownerId
  const claimed = owner === userId ? raw : JSON.stringify({ ...parsed, __ownerId: userId })
  if (claimed !== raw) sessionStorage.setItem(key, claimed)
  return { data, raw: claimed }
}
