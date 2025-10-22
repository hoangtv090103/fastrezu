import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
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
          const { error: profileError } = await supabase
            .from('user_profiles')
            .insert({
              id: user.id,
              email: user.email!,
              full_name: user.user_metadata?.full_name || null,
            })

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
