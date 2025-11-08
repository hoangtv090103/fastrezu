import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next({
    request: {
      headers: req.headers,
    },
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
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              // Set cookies with options compatible with mobile browsers
              const cookieOptions = {
                ...options,
                sameSite: 'lax' as const,
                secure: process.env.NODE_ENV === 'production',
                path: '/',
              }
              req.cookies.set(name, value)
              res.cookies.set(name, value, cookieOptions)
            })
          } catch (error) {
            console.error('Error setting cookies in middleware:', error)
          }
        },
      },
    }
  )

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Skip middleware for auth callback and error routes to prevent loops
  const isAuthRoute = req.nextUrl.pathname.startsWith('/auth/')
  if (isAuthRoute) {
    return res
  }

  // Check for authenticated routes (routes inside (authenticated) folder)
  const isProtectedRoute = 
    req.nextUrl.pathname.startsWith('/dashboard') || 
    req.nextUrl.pathname.startsWith('/editor') ||
    req.nextUrl.pathname.startsWith('/check-cv')
  
  if (isProtectedRoute && !session) {
    const loginUrl = new URL('/login', req.url)
    // Store the original URL to redirect back after login
    loginUrl.searchParams.set('next', req.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Don't redirect from login page in middleware - let the page handle it client-side
  // This prevents redirect loops where middleware and page both try to redirect
  
  return res
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
