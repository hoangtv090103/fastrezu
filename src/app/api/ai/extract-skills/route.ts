import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { jdKeywords, existingSkills } = await request.json()

    if (!jdKeywords || !Array.isArray(jdKeywords)) {
      return NextResponse.json({ error: 'JD keywords are required' }, { status: 400 })
    }

    // TODO: Replace with actual AI API call
    // For now, return mock data based on common skills
    const mockTechnicalSkills = [
      'JavaScript',
      'React',
      'Node.js',
      'TypeScript',
      'Python',
      'SQL',
      'Git',
      'Docker',
      'AWS',
      'MongoDB'
    ].filter(skill => 
      jdKeywords.some((keyword: string) => 
        keyword.toLowerCase().includes(skill.toLowerCase()) ||
        skill.toLowerCase().includes(keyword.toLowerCase())
      )
    )

    const mockSoftSkills = [
      'Lãnh đạo',
      'Giao tiếp',
      'Làm việc nhóm',
      'Giải quyết vấn đề',
      'Quản lý thời gian',
      'Sáng tạo',
      'Thích ứng'
    ]

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000))

    return NextResponse.json({ 
      technicalSkills: mockTechnicalSkills,
      softSkills: mockSoftSkills
    }, { status: 200 })
  } catch (error) {
    console.error('Extract Skills API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
