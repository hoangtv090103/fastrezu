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
