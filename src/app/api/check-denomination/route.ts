import { NextResponse, type NextRequest } from 'next/server'
import { checkDenominationAvailable } from '@/lib/pappers'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q')?.trim()
  if (!q || q.length < 3) return NextResponse.json({ available: true, similar: [] })
  try {
    const result = await checkDenominationAvailable(q)
    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ available: true, similar: [] })
  }
}
