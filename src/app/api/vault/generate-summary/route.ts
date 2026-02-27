import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { callOpenAI } from '@/lib/openai';

const SYSTEM_PROMPT_VI = `Bạn là chuyên gia tư vấn CV chuyên nghiệp. 
Nhiệm vụ: Viết đoạn tóm tắt sự nghiệp (Professional Summary) bằng tiếng Việt.

Yêu cầu:
- Độ dài: 3-4 câu, khoảng 400-600 ký tự
- Giọng văn: Tự tin, chuyên nghiệp, ngôi thứ ba (không dùng "Tôi")
- Tập trung vào: Số năm kinh nghiệm, lĩnh vực chuyên môn nổi trội, điểm mạnh/đặc thù
- Đây là tóm tắt gốc (không theo JD cụ thể), mang tính tổng quát và chân thực
- Trả về JSON: {"summary": "..."}`;

const SYSTEM_PROMPT_EN = `You are a professional CV consultant.
Write a Professional Summary in English based on the candidate's experience and skills.

Requirements:
- Length: 3-4 sentences, ~400-600 characters
- Tone: Confident, professional, third person (no "I")
- Focus on: years of experience, core expertise, key strengths
- This is a general master summary, not tailored to a specific JD
- Return JSON: {"summary": "..."}`;

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      experience = [],
      skills = [],
      language = 'vi',
    } = body as {
      experience?: Record<string, unknown>[];
      skills?: string[];
      language?: 'vi' | 'en';
    };

    const systemPrompt = language === 'en' ? SYSTEM_PROMPT_EN : SYSTEM_PROMPT_VI;

    const expLines = experience
      .map((exp) =>
        `- ${exp.title || 'N/A'} tại ${exp.company || 'N/A'} (${exp.start_date || ''} → ${exp.is_current ? 'Hiện tại' : exp.end_date || ''})`
      )
      .join('\n');

    const skillsText = skills.join(', ');

    const userMessage =
      language === 'en'
        ? `Work Experience:\n${expLines || 'None'}\n\nSkills: ${skillsText || 'None'}`
        : `Kinh nghiệm làm việc:\n${expLines || 'Chưa có'}\n\nKỹ năng: ${skillsText || 'Chưa có'}`;

    const result = await callOpenAI(systemPrompt, userMessage, {
      responseFormat: 'json_object',
    });

    const summary = result?.summary;
    if (!summary || typeof summary !== 'string') {
      console.error('[vault/generate-summary] Bad AI result:', result);
      return NextResponse.json(
        { error: 'AI không tạo được tóm tắt. Vui lòng thử lại.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ summary }, { status: 200 });
  } catch (error) {
    console.error('[vault/generate-summary] error:', error);
    return NextResponse.json(
      { error: 'Lỗi máy chủ. Vui lòng thử lại.' },
      { status: 500 }
    );
  }
}
