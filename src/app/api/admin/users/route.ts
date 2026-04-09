import { NextResponse, type NextRequest } from 'next/server'
import { requireSuperAdmin } from '@/lib/admin-auth'
import { createServiceClient } from '@/lib/supabase'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const auth = await requireSuperAdmin()
  if ('error' in auth) return auth.error

  const search = req.nextUrl.searchParams.get('q')?.trim() || ''
  const svc = createServiceClient()

  let query = svc
    .from('moksha_profiles')
    .select('id, email, full_name, plan, referral_code, is_admin, is_super_admin, created_at, jurisia_questions_today, stripe_customer_id')
    .order('created_at', { ascending: false })
    .limit(200)

  if (search) {
    query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%,referral_code.ilike.%${search}%`)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ users: data || [] })
}

export async function PATCH(req: NextRequest) {
  const auth = await requireSuperAdmin()
  if ('error' in auth) return auth.error

  const body = await req.json()
  const { id, plan, is_admin } = body as { id?: string; plan?: string; is_admin?: boolean }
  if (!id) return NextResponse.json({ error: 'id requis' }, { status: 400 })

  const update: Record<string, unknown> = {}
  if (plan && ['gratuit', 'autopilote', 'pro'].includes(plan)) update.plan = plan
  if (typeof is_admin === 'boolean') update.is_admin = is_admin
  if (Object.keys(update).length === 0) return NextResponse.json({ error: 'Rien à mettre à jour' }, { status: 400 })

  const svc = createServiceClient()
  const { error } = await svc.from('moksha_profiles').update(update).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
