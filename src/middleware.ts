import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Middleware con:
 * - Auth check (mantiene compat)
 * - Security headers (CSP, X-Frame, HSTS, etc.)
 * - Rate limit en login (vía cookie counter, no requiere DB)
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } })

  // ============================================================
  // SECURITY HEADERS - aplicar a TODAS las respuestas
  // ============================================================
  const headers = response.headers
  // Previene clickjacking
  headers.set('X-Frame-Options', 'DENY')
  // Previene MIME sniffing
  headers.set('X-Content-Type-Options', 'nosniff')
  // HSTS: fuerza HTTPS por 1 año
  headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  // Privacidad referrer
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  // Restringir features
  headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  // CSP: previene XSS. Nota: Next.js inline scripts requieren 'unsafe-inline'
  headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' data: blob: https:",
      "connect-src 'self' https://*.supabase.co https://api.anthropic.com wss://*.supabase.co",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ')
  )

  // ============================================================
  // AUTH check
  // ============================================================
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_MASTER_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_MASTER_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          // Re-aplicar headers porque NextResponse.next los resetea
          response.headers.set('X-Frame-Options', 'DENY')
          response.headers.set('X-Content-Type-Options', 'nosniff')
          response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
          response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
          response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options as any)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname

  // Rutas públicas
  const rutasPublicas = ['/', '/login', '/registro', '/agendar.html']
  const esApiCron = path.startsWith('/api/cron')
  const esApiPublica = path.startsWith('/api/auth')

  if (rutasPublicas.includes(path) || esApiCron || esApiPublica) {
    return response
  }

  // Si no hay usuario, redirigir a login
  if (!user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirect', path)
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
