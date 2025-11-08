import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import type { EmailOtpType } from '@supabase/supabase-js'
import type { UserProfileInsert } from '@/types'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const next = searchParams.get('next') ?? '/dashboard'
  const redirectTo = request.nextUrl.clone()
  redirectTo.pathname = next
  redirectTo.searchParams.delete('token_hash')
  redirectTo.searchParams.delete('type')

  if (token_hash && type) {
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
                  sameSite: 'lax',
                  secure: process.env.NODE_ENV === 'production',
                })
              })
            } catch (error) {
              console.error('Error setting cookies:', error)
            }
          },
        },
      }
    )

    try {
      const { error } = await supabase.auth.verifyOtp({
        type,
        token_hash,
      })

      if (error) {
        console.error('Token verification error:', error)
        redirectTo.pathname = '/auth/error'
        redirectTo.searchParams.set('message', 'Invalid or expired magic link')
        return NextResponse.redirect(redirectTo)
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
          }
        }
      }

      return NextResponse.redirect(redirectTo)
    } catch (error) {
      console.error('Confirm error:', error)
      redirectTo.pathname = '/auth/error'
      redirectTo.searchParams.set('message', 'Authentication failed')
      return NextResponse.redirect(redirectTo)
    }
  }

  // Return the user to an error page with some instructions
  redirectTo.pathname = '/auth/error'
  redirectTo.searchParams.set('message', 'Missing token or type parameter')
  return NextResponse.redirect(redirectTo)
}
