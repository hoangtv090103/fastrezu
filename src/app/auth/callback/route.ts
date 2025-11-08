import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import type { UserProfileInsert } from '@/types'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')
  const errorDescription = requestUrl.searchParams.get('error_description')
  const next = requestUrl.searchParams.get('next') || '/dashboard'

  // Handle OAuth errors
  if (error) {
    console.error('OAuth error:', error, errorDescription)
    const errorMessage = errorDescription || error
    return NextResponse.redirect(new URL(`/auth/error?message=${encodeURIComponent(errorMessage)}`, request.url))
  }

  if (!code) {
    console.error('No code provided in callback')
    return NextResponse.redirect(new URL('/auth/error?message=No authorization code', request.url))
  }

  try {
    const cookieStore = await cookies()
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set(name, value, {
                  ...options,
                  // Ensure cookies work on mobile browsers
                  sameSite: 'lax',
                  secure: process.env.NODE_ENV === 'production',
                  path: '/',
                })
              })
            } catch (error) {
              console.error('Error setting cookies:', error)
            }
          },
        },
      }
    )
    
    // Exchange code for session
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    
    if (exchangeError) {
      console.error('Auth callback error:', exchangeError)
      return NextResponse.redirect(new URL('/auth/error?message=Authentication failed', request.url))
    }

    if (!data.session) {
      console.error('No session returned after code exchange')
      return NextResponse.redirect(new URL('/auth/error?message=Session creation failed', request.url))
    }

    // Get user data and create profile if needed
    const user = data.user
    
    if (user) {
      // Check if user profile exists
      const { data: existingProfile } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('id', user.id)
        .single()

      // Create profile if it doesn't exist
      if (!existingProfile) {
        const profileData: UserProfileInsert = {
          id: user.id,
          email: user.email!,
          full_name: user.user_metadata?.full_name || null,
          subscription_tier: 'beta_free'
        }
        
        const { error: profileError } = await supabase
          .from('user_profiles')
          .insert(profileData)

        if (profileError) {
          console.error('Profile creation error:', profileError)
          // Don't fail authentication if profile creation fails
        }
      }
    }

    // Create response with redirect
    const redirectUrl = new URL(next, request.url)
    const response = NextResponse.redirect(redirectUrl)
    
    // Explicitly set the session cookies in the response
    const sessionCookies = [
      {
        name: 'sb-access-token',
        value: data.session.access_token,
        options: {
          path: '/',
          maxAge: 60 * 60 * 24 * 7, // 7 days
          sameSite: 'lax' as const,
          secure: process.env.NODE_ENV === 'production',
        }
      },
      {
        name: 'sb-refresh-token', 
        value: data.session.refresh_token,
        options: {
          path: '/',
          maxAge: 60 * 60 * 24 * 30, // 30 days
          sameSite: 'lax' as const,
          secure: process.env.NODE_ENV === 'production',
        }
      }
    ]

    sessionCookies.forEach(({ name, value, options }) => {
      response.cookies.set(name, value, options)
    })

    return response
  } catch (error) {
    console.error('Auth callback error:', error)
    return NextResponse.redirect(new URL('/auth/error?message=Authentication failed', request.url))
  }
}

