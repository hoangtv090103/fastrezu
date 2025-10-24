import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { Database } from '@/types/database'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')
  const errorDescription = requestUrl.searchParams.get('error_description')

  // Handle OAuth errors
  if (error) {
    console.error('OAuth error:', error, errorDescription)
    const errorMessage = errorDescription || error
    return NextResponse.redirect(new URL(`/auth/error?message=${encodeURIComponent(errorMessage)}`, request.url))
  }

  if (code) {
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
                cookieStore.set(name, value, options)
              })
            } catch (error) {
              console.error('Error setting cookies:', error)
            }
          },
        },
      }
    )
    
    try {
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        console.error('Auth callback error:', error)
        return NextResponse.redirect(new URL('/auth/error?message=Authentication failed', request.url))
      }

      // Get user data and create profile if needed
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        // Check if user profile exists
        const { data: existingProfile } = await supabase
          .from('user_profiles')
          .select('id')
          .eq('id', user.id)
          .single()

        // Create profile if it doesn't exist
        if (!existingProfile) {
          const profileData: Database['public']['Tables']['user_profiles']['Insert'] = {
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
          }
        }
      }

      return NextResponse.redirect(new URL('/dashboard', request.url))
    } catch (error) {
      console.error('Auth callback error:', error)
      return NextResponse.redirect(new URL('/auth/error?message=Authentication failed', request.url))
    }
  }

  return NextResponse.redirect(new URL('/auth/error?message=No authorization code', request.url))
}
