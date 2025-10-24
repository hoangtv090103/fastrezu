import { NextRequest, NextResponse } from 'next/server'
import { callOpenAI } from '@/lib/openai'

export async function POST(request: NextRequest) {
  try {
    const { bulletPoint, context: _context, jdKeywords: _jdKeywords } = await request.json()

    if (!bulletPoint || typeof bulletPoint !== 'string') {
      return NextResponse.json({ error: 'Bullet point text is required' }, { status: 400 })
    }

    // System prompt để cải thiện bullet point
    const systemPrompt = `You are an expert CV writer specializing in creating compelling, ATS-optimized bullet points. Your task is to improve bullet points to make them more impactful and professional.

Guidelines for improvement:
1. Use strong action verbs (Phát triển, Tối ưu hóa, Quản lý, Lãnh đạo, etc.)
2. Include quantifiable results when possible (số liệu, phần trăm, thời gian)
3. Focus on achievements and impact, not just responsibilities
4. Make it specific and concrete
5. Keep it concise but impactful
6. Write in Vietnamese
7. Ensure it's ATS-friendly (no special characters, clear structure)

You MUST output ONLY a valid JSON object with this structure:
{
  "improvedBullet": "Your improved bullet point here"
}`;

    const userMessage = `Hãy cải thiện bullet point sau để làm cho nó ấn tượng và chuyên nghiệp hơn:

Bullet point hiện tại: "${bulletPoint}"

Hãy viết lại để:
- Sử dụng động từ mạnh
- Thêm số liệu cụ thể nếu có thể
- Tập trung vào thành tích và tác động
- Làm cho nó cụ thể và rõ ràng
- Tối ưu cho ATS

Chỉ trả về bullet point đã được cải thiện.`;

    // Call AI API
    console.log('Improving bullet point...');
    const result = await callOpenAI(systemPrompt, userMessage);

    if (!result.improvedBullet) {
      throw new Error('AI did not generate improved bullet point');
    }

    return NextResponse.json({ improvedBullet: result.improvedBullet }, { status: 200 })
  } catch (error) {
    console.error('Improve Bullet API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
