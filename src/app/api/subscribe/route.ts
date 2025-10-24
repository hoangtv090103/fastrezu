import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    // Validate email
    if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        { error: 'Email không hợp lệ' },
        { status: 400 }
      )
    }

    // Insert email into Supabase
    const { data, error } = await supabaseAdmin
      .from('subscribers')
      .insert([
        {
          email: email.toLowerCase().trim(),
          created_at: new Date().toISOString(),
          status: 'pending'
        }
      ])
      .select()

    if (error) {
      // Check if it's a duplicate email error
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Email này đã được đăng ký trước đó' },
          { status: 409 }
        )
      }
      
      return NextResponse.json(
        { error: 'Có lỗi xảy ra khi đăng ký email' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { 
        message: 'Đăng ký thành công! Chúng tôi sẽ liên hệ sớm.',
        data: data[0]
      },
      { status: 201 }
    )

          } catch (_error) {
    return NextResponse.json(
      { error: 'Có lỗi xảy ra' },
      { status: 500 }
    )
  }
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}
