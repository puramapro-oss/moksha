import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const response = NextResponse.redirect(new URL(next, origin))
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
          },
        },
        db: { schema: 'moksha' },
      }
    )
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // Lier parrainage cookie ?ref= si présent (best-effort, ne bloque pas)
      try {
        const refCookie = request.cookies.get('moksha_ref')?.value
        if (refCookie) {
          const { data: { user } } = await supabase.auth.getUser()
          if (user) {
            const { createServiceClient } = await import('@/lib/supabase')
            const svc = createServiceClient()
            const { data: profile } = await svc
              .from('moksha_profiles')
              .select('id, referred_by, referral_code')
              .eq('id', user.id)
              .single()
            if (profile && !profile.referred_by && profile.referral_code !== refCookie) {
              const { data: parrain } = await svc
                .from('moksha_profiles')
                .select('id')
                .eq('referral_code', refCookie)
                .single()
              if (parrain) {
                await svc.from('moksha_profiles').update({ referred_by: parrain.id }).eq('id', user.id)
                await svc.from('moksha_referrals').insert({
                  referrer_id: parrain.id,
                  referee_id: user.id,
                  code_used: refCookie,
                  statut: 'pending',
                  commission_amount: 0,
                })
                await svc.from('moksha_notifications').insert({
                  user_id: parrain.id,
                  type: 'referral',
                  titre: 'Nouveau filleul 🔥',
                  message: `${user.email} vient de s'inscrire avec ton code.`,
                  action_url: '/dashboard/parrainage',
                })
              }
            }
            response.cookies.delete('moksha_ref')
          }
        }
      } catch {
        // best-effort, ne casse pas le login
      }
      return response
    }
  }

  return NextResponse.redirect(new URL('/auth?error=auth_failed', origin))
}
