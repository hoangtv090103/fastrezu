import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function proxy(req: NextRequest) {
  // IMPORTANT: Create the response first and reuse it
  let supabaseResponse = NextResponse.next({
    request: req,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // IMPORTANT: Update both request and response cookies
          cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request: req,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: DO NOT run any code between createServerClient and getUser()
  // This could cause users to be randomly logged out
  
  // IMPORTANT: Use getUser() instead of getSession() to verify the JWT
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Skip proxy for auth callback and error routes
  const isAuthRoute = req.nextUrl.pathname.startsWith('/auth/')
  if (isAuthRoute) {
    return supabaseResponse
  }

  // Check for authenticated routes
  const isProtectedRoute = 
    req.nextUrl.pathname.startsWith('/dashboard') || 
    req.nextUrl.pathname.startsWith('/editor') ||
    req.nextUrl.pathname.startsWith('/check-cv')
  
  if (isProtectedRoute && !user) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('next', req.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  // IMPORTANT: Return supabaseResponse object to preserve cookies
  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
