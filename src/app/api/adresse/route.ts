import { NextResponse, type NextRequest } from 'next/server'
import { searchAdresse } from '@/lib/pappers'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q')?.trim()
  if (!q || q.length < 3) return NextResponse.json({ results: [] })
  try {
    const results = await searchAdresse(q)
    return NextResponse.json({ results })
  } catch {
    return NextResponse.json({ results: [] })
  }
}
