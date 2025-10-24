import { NextRequest, NextResponse } from "next/server";
import { callOpenAI } from "@/lib/openai";
import { getSystemPrompt, CVLanguage } from '@/lib/prompts';

export async function POST(request: NextRequest) {
  try {
    const { cvData, jdKeywords, language = 'vi' } = await request.json();

    if (!cvData) {
      return NextResponse.json(
        { error: "CV data is required" },
        { status: 400 }
      );
    }

    // Validate language parameter
    if (!['vi', 'en'].includes(language)) {
      return NextResponse.json({ error: 'Invalid language parameter. Must be "vi" or "en"' }, { status: 400 })
    }

    // Get system prompt based on language
    const systemPrompt = getSystemPrompt('score_cv', language as CVLanguage);

    // Prepare CV data for AI
    const cvText = language === 'vi' ? `
**Thông tin cá nhân:** ${JSON.stringify(cvData.sections?.personal_info || {})}
**Tóm tắt:** ${JSON.stringify(cvData.sections?.summary || {})}
**Kinh nghiệm:** ${JSON.stringify(cvData.sections?.experience || [])}
**Học vấn:** ${JSON.stringify(cvData.sections?.education || [])}
**Dự án:** ${JSON.stringify(cvData.sections?.projects || [])}
**Kỹ năng:** ${JSON.stringify(cvData.sections?.skills || [])}
**Chứng chỉ:** ${JSON.stringify(cvData.sections?.certifications || [])}
` : `
**Personal Information:** ${JSON.stringify(cvData.sections?.personal_info || {})}
**Summary:** ${JSON.stringify(cvData.sections?.summary || {})}
**Experience:** ${JSON.stringify(cvData.sections?.experience || [])}
**Education:** ${JSON.stringify(cvData.sections?.education || [])}
**Projects:** ${JSON.stringify(cvData.sections?.projects || [])}
**Skills:** ${JSON.stringify(cvData.sections?.skills || [])}
**Certifications:** ${JSON.stringify(cvData.sections?.certifications || [])}
`;

    const userMessage = language === 'vi' ? `Hãy đánh giá CV sau đây dựa trên các từ khóa JD và tiêu chí đã cho. Trả về kết quả dưới dạng JSON.

Từ khóa JD:
${JSON.stringify(jdKeywords)}

Dữ liệu CV:
${JSON.stringify(cvData)}` : `Please evaluate the following CV based on the JD keywords and criteria provided. Return the result in JSON format.

JD Keywords:
${JSON.stringify(jdKeywords)}

CV Data:
${JSON.stringify(cvData)}`;

    // Gọi OpenAI API
    const result = await callOpenAI(systemPrompt, userMessage);

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("Score CV API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
