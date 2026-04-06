import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    app: 'MOKSHA',
    version: '1.0.0',
    schema: 'moksha',
    timestamp: new Date().toISOString(),
  })
}
