import { NextRequest, NextResponse } from 'next/server'
import { callOpenAI } from '@/lib/openai'

export async function POST(request: NextRequest) {
  try {
    const { personalInfo, experience, jdKeywords } = await request.json()

    if (!personalInfo?.full_name) {
      return NextResponse.json({ error: 'Personal information is required' }, { status: 400 })
    }

    // System prompt để tạo summary CV
    const systemPrompt = `You are an expert CV writer specializing in creating compelling professional summaries. Your task is to write a concise, impactful professional summary that highlights the candidate's key strengths, experience, and value proposition.

The summary should be:
- 2-3 sentences maximum
- Written in Vietnamese
- Professional and engaging
- Tailored to the job requirements when keywords are provided
- Focus on achievements and impact, not just responsibilities
- Use action verbs and quantifiable results when possible

You MUST output ONLY a valid JSON object with this structure:
{
  "summary": "Your generated professional summary here"
}`;

    // Build user message with available information
    let userMessage = `Tạo professional summary cho ứng viên với thông tin sau:

Tên: ${personalInfo.full_name}
Email: ${personalInfo.email || 'Chưa cung cấp'}
Số điện thoại: ${personalInfo.phone || 'Chưa cung cấp'}`;

    // Add experience information if available
    if (experience && Array.isArray(experience) && experience.length > 0) {
      userMessage += `\n\nKinh nghiệm làm việc:`;
      experience.forEach((exp: { title?: string; company?: string; start_date?: string; end_date?: string; description?: string }, index: number) => {
        userMessage += `\n${index + 1}. ${exp.title || 'Vị trí'} tại ${exp.company || 'Công ty'} (${exp.start_date || 'Năm bắt đầu'} - ${exp.end_date || 'Hiện tại'})`;
        if (exp.description) {
          userMessage += `\n   Mô tả: ${exp.description}`;
        }
      });
    }

    // Add JD keywords if available to tailor the summary
    if (jdKeywords && Array.isArray(jdKeywords) && jdKeywords.length > 0) {
      userMessage += `\n\nTừ khóa quan trọng từ mô tả công việc: ${jdKeywords.join(', ')}`;
      userMessage += `\n\nHãy tạo summary phù hợp với các yêu cầu này.`;
    }

    // Call AI API
    console.log('Generating professional summary...');
    const result = await callOpenAI(systemPrompt, userMessage);

    if (!result.summary) {
      throw new Error('AI did not generate a summary');
    }

    return NextResponse.json({ summary: result.summary }, { status: 200 })
  } catch (error) {
    console.error('Generate Summary API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
