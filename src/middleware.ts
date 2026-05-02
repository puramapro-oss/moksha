import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PUBLIC_PATHS = [
  '/', '/demarrer', '/pricing', '/how-it-works', '/tarifs',
  '/privacy', '/terms', '/legal', '/offline', '/login', '/signup', '/register', '/auth',
  '/mentions-legales', '/politique-confidentialite', '/cgv', '/cgu', '/politique-cookies',
  '/paiement', '/merci', '/cookies', '/contact', '/ecosystem', '/offline',
  '/devenir-influenceur', '/ambassadeur',
  '/fiscal', '/financer',
  '/reglement', '/remboursement', '/karma',
  '/aide',
]

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.includes(pathname)) return true
  if (pathname.startsWith('/go/')) return true
  if (pathname.startsWith('/api/')) return true
  if (pathname.startsWith('/_next/')) return true
  if (pathname.startsWith('/auth/')) return true
  if (pathname.startsWith('/creer/')) return true
  if (pathname.startsWith('/partage/')) return true
  if (pathname.startsWith('/signer/')) return true
  if (pathname.startsWith('/share/')) return true
  if (pathname.match(/\.(ico|png|jpg|jpeg|svg|gif|webp|css|js|woff|woff2|ttf|json|xml|txt)$/)) return true
  if (pathname === '/sitemap.xml' || pathname === '/robots.txt' || pathname === '/manifest.json') return true
  return false
}

export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl
  let response = NextResponse.next({ request })

  // Capture ?ref=MOKSHA-XXXXXX dans un cookie 30 jours pour attribution parrainage
  const refParam = searchParams.get('ref')
  if (refParam && /^MOKSHA-[A-Z0-9]{4,12}$/i.test(refParam)) {
    response.cookies.set('moksha_ref', refParam.toUpperCase(), {
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
      sameSite: 'lax',
    })
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (user && (pathname === '/login' || pathname === '/signup' || pathname === '/auth')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  if (!user && !isPublicPath(pathname)) {
    const loginUrl = new URL('/auth', request.url)
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
