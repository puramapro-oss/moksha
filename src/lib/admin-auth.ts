import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from './supabase-server'
import { SUPER_ADMIN_EMAIL } from './constants'

/**
 * Vérifie qu'un user est super admin (via session Supabase).
 * Retourne { user } si OK, sinon une NextResponse 401/403 à renvoyer directement.
 */
export async function requireSuperAdmin() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: NextResponse.json({ error: 'Non authentifié' }, { status: 401 }) }
  }
  if (user.email !== SUPER_ADMIN_EMAIL) {
    // Vérifie aussi le flag DB au cas où
    const { data: profile } = await supabase
      .from('moksha_profiles')
      .select('is_super_admin')
      .eq('id', user.id)
      .single()
    if (!profile?.is_super_admin) {
      return { error: NextResponse.json({ error: 'Accès refusé' }, { status: 403 }) }
    }
  }
  return { user }
}
