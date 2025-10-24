import { NextRequest, NextResponse } from "next/server";
import { callOpenAI } from "@/lib/openai";
import { getSystemPrompt, CVLanguage } from '@/lib/prompts';

export async function POST(request: NextRequest) {
  try {
    const { jdKeywords, existingSkills: _existingSkills, language = 'vi' } =
      await request.json();

    if (!jdKeywords || !Array.isArray(jdKeywords)) {
      return NextResponse.json(
        { error: "JD keywords are required" },
        { status: 400 }
      );
    }

    // Validate language parameter
    if (!['vi', 'en'].includes(language)) {
      return NextResponse.json({ error: 'Invalid language parameter. Must be "vi" or "en"' }, { status: 400 })
    }

    // Get system prompt based on language
    const systemPrompt = getSystemPrompt('extract_skills', language as CVLanguage);

    const userMessage = language === 'vi' ? `Dựa trên danh sách từ khóa JD sau đây, hãy trích xuất và phân loại các kỹ năng Kỹ thuật (tiếng Anh) và Kỹ năng Mềm (tiếng Việt):\n\nTừ khóa JD:\n${JSON.stringify(
      jdKeywords
    )}\n\nHãy trả về kết quả dưới dạng JSON theo cấu trúc yêu cầu.` : `Based on the following JD keywords list, please extract and categorize Technical Skills (in English) and Soft Skills (in English):\n\nJD Keywords:\n${JSON.stringify(
      jdKeywords
    )}\n\nPlease return the result in JSON format according to the required structure.`;

    // Call AI API
    console.log("Extracting skills from JD keywords...");
    const result = await callOpenAI(systemPrompt, userMessage);

    if (!result.technicalSkills || !result.softSkills) {
      throw new Error("AI did not generate skills properly");
    }

    return NextResponse.json(
      {
        technicalSkills: result.technicalSkills,
        softSkills: result.softSkills,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Extract Skills API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
