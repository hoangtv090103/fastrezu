import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { callOpenAI } from "@/lib/openai";
import { getSystemPrompt, CVLanguage } from '@/lib/prompts';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { confirmedText, jdText, language = 'vi' } = await request.json();

    if (!confirmedText || confirmedText.trim().length < 10) {
      return NextResponse.json(
        { error: "Confirmed text is required and must be at least 10 characters" },
        { status: 400 }
      );
    }

    // Validate language parameter
    if (!['vi', 'en'].includes(language)) {
      return NextResponse.json(
        { error: 'Invalid language parameter. Must be "vi" or "en"' },
        { status: 400 }
      );
    }

    // Get system prompt based on language
    const systemPrompt = getSystemPrompt('score_cv', language as CVLanguage);

    // Create user message with confirmed text and optional JD
    const userMessage = language === 'vi' 
      ? `Hãy đánh giá CV sau đây dựa trên các tiêu chí đã cho. Trả về kết quả dưới dạng JSON.

${jdText ? `Mô tả công việc tham khảo:
${jdText}

` : ''}Nội dung CV cần đánh giá:
${confirmedText}` 
      : `Please evaluate the following CV based on the provided criteria. Return the result in JSON format.

${jdText ? `Job Description for reference:
${jdText}

` : ''}CV content to evaluate:
${confirmedText}`;

    // Call OpenAI API
    const result = await callOpenAI(systemPrompt, userMessage);

    // Add metadata about the scoring
    const response = {
      ...result,
      metadata: {
        hasJobDescription: !!jdText,
        textLength: confirmedText.length,
        language,
        timestamp: new Date().toISOString(),
      }
    };

    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    console.error("Score uploaded CV API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
