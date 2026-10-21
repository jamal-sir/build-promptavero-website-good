import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { authCookieOptions } from '@/lib/supabase/cookies'

const PUBLIC_ADMIN_PATHS = ['/admin/login', '/admin/setup']

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: authCookieOptions,
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl
  const isPublicAdminPath = PUBLIC_ADMIN_PATHS.includes(pathname)

  if (!user && !isPublicAdminPath) {
    const url = request.nextUrl.clone()
    url.pathname = '/admin/login'
    url.search = ''
    if (pathname !== '/admin') url.searchParams.set('next', pathname)
    const redirect = NextResponse.redirect(url)
    redirect.headers.set('X-Robots-Tag', 'noindex, nofollow')
    return redirect
  }

  response.headers.set('X-Robots-Tag', 'noindex, nofollow')
  response.headers.set('Cache-Control', 'private, no-store')
  return response
}

export const config = {
  matcher: ['/admin', '/admin/:path*'],
}
