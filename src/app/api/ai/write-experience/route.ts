import { NextRequest, NextResponse } from 'next/server'
import { callOpenAI } from '@/lib/openai'

export async function POST(request: NextRequest) {
  try {
    const { jobTitle, company, jdKeywords, experienceLevel } = await request.json()

    if (!jobTitle || !jdKeywords || !Array.isArray(jdKeywords)) {
      return NextResponse.json({ error: 'Job title and JD keywords are required' }, { status: 400 })
    }

    // System prompt để viết mô tả kinh nghiệm
    const systemPrompt = `Bạn là AI chuyên gia viết mô tả kinh nghiệm làm việc cho CV, tối ưu hóa cho hệ thống ATS.

Nhiệm vụ của bạn:
1. Viết 5-7 gạch đầu dòng mô tả thành tích và trách nhiệm
2. Tích hợp các từ khóa từ JD một cách tự nhiên
3. Sử dụng số liệu cụ thể và động từ hành động mạnh
4. Đảm bảo nội dung phù hợp với vị trí và level kinh nghiệm

Trả về JSON với format:
{
  "achievements": [
    "Gạch đầu dòng 1",
    "Gạch đầu dòng 2",
    ...
  ]
}

Quy tắc viết:
- Mỗi gạch đầu dòng bắt đầu bằng động từ hành động (Phát triển, Tối ưu hóa, Quản lý, etc.)
- Bao gồm số liệu cụ thể (%, số lượng, thời gian)
- Tích hợp từ khóa JD một cách tự nhiên
- Tập trung vào kết quả và tác động
- Độ dài mỗi gạch đầu dòng: 15-25 từ
- Sử dụng thuật ngữ chuyên môn phù hợp`;

    const userMessage = `Hãy viết mô tả kinh nghiệm làm việc cho vị trí:

**Chức vụ:** ${jobTitle}
**Công ty:** ${company || 'Công ty ABC'}
**Level kinh nghiệm:** ${experienceLevel || 'Mid-level'}
**Từ khóa cần tích hợp:** ${jdKeywords.join(', ')}

Yêu cầu: Viết 5-7 gạch đầu dòng mô tả thành tích và trách nhiệm, tích hợp các từ khóa trên một cách tự nhiên.`;

    // Gọi OpenAI API
    const result = await callOpenAI(systemPrompt, userMessage);

    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    console.error('Write Experience API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

