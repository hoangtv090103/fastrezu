import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { cvData, jdText } = await request.json()

    if (!cvData) {
      return NextResponse.json({ error: 'CV data is required' }, { status: 400 })
    }

    // TODO: Replace with actual AI API call
    // For now, return mock data
    const mockScore = {
      score: 78,
      suggestions: [
        'Thêm số liệu cụ thể vào các thành tích',
        'Sử dụng nhiều từ khóa từ JD hơn',
        'Cải thiện phần tóm tắt nghề nghiệp',
        'Thêm thông tin về dự án cá nhân'
      ],
      analysis: {
        keyword_match: 75,
        formatting: 85,
        completeness: 70,
        relevance: 80
      }
    }

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000))

    return NextResponse.json(mockScore, { status: 200 })
  } catch (error) {
    console.error('Score CV API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
