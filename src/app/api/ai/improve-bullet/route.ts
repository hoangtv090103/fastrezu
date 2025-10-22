import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { bulletPoint, context, jdKeywords } = await request.json()

    if (!bulletPoint || typeof bulletPoint !== 'string') {
      return NextResponse.json({ error: 'Bullet point text is required' }, { status: 400 })
    }

    // TODO: Replace with actual AI API call
    // For now, return mock data
    const mockImprovedBullet = `Phát triển và tối ưu hóa ứng dụng web sử dụng React và Node.js, tăng hiệu suất tải trang 40% và cải thiện trải nghiệm người dùng.`

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000))

    return NextResponse.json({ improvedBullet: mockImprovedBullet }, { status: 200 })
  } catch (error) {
    console.error('Improve Bullet API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
