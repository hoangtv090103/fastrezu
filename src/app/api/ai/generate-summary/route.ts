import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { personalInfo, experience, jdKeywords } = await request.json()

    if (!personalInfo?.full_name) {
      return NextResponse.json({ error: 'Personal information is required' }, { status: 400 })
    }

    // TODO: Replace with actual AI API call
    // For now, return mock data
    const mockSummary = `Chuyên viên phát triển phần mềm với kinh nghiệm trong việc xây dựng ứng dụng web hiện đại. Có kiến thức sâu về JavaScript, React và các công nghệ frontend. Mong muốn đóng góp vào các dự án có tác động lớn và phát triển kỹ năng lãnh đạo kỹ thuật trong môi trường năng động.`

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500))

    return NextResponse.json({ summary: mockSummary }, { status: 200 })
  } catch (error) {
    console.error('Generate Summary API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
