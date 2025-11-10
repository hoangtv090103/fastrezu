import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { callOpenAI } from "@/lib/openai";
import { getSystemPrompt, CVLanguage } from '@/lib/prompts';
import { scoreUploadedCVSchema, validateSchema } from "@/lib/validation-schemas";

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

    const body = await request.json();
    
    // Validate with Zod
    const validation = validateSchema(scoreUploadedCVSchema, body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.firstError, details: validation.errors },
        { status: 400 }
      );
    }
    
    const { confirmedText, jdText, language } = validation.data;

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
    
    // Return specific error message if available
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    const isAIError = errorMessage.includes('AI service') || 
                     errorMessage.includes('503') || 
                     errorMessage.includes('429') ||
                     errorMessage.includes('timeout');
    
    return NextResponse.json(
      { 
        error: isAIError ? errorMessage : "Internal server error",
        details: isAIError ? "The AI service is experiencing high load. Please try again in a few moments." : undefined
      },
      { status: isAIError ? 503 : 500 }
    );
  }
}
