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

    const userMessage = language === 'vi' ? `Hãy phân tích danh sách từ khóa JD sau và trích xuất các kỹ năng liên quan:

Từ khóa JD: ${jdKeywords.join(', ')}

Yêu cầu:
- Trích xuất kỹ năng chuyên môn (công nghệ, công cụ, ngôn ngữ lập trình) - viết bằng tiếng Anh
- Trích xuất kỹ năng mềm (giao tiếp, làm việc nhóm, lãnh đạo) - viết bằng tiếng Việt
- Chỉ trích xuất kỹ năng thực sự có trong từ khóa, không thêm kỹ năng chung chung
- Trả về JSON với format: {"technicalSkills": [...], "softSkills": [...]}` : `Please analyze the following JD keywords and extract relevant skills:

JD Keywords: ${jdKeywords.join(', ')}

Requirements:
- Extract technical skills (technologies, tools, programming languages) - write in English
- Extract soft skills (communication, teamwork, leadership) - write in English
- Only extract skills that are actually present in the keywords, don't add generic skills
- Return JSON with format: {"technicalSkills": [...], "softSkills": [...]}`;

    // Call AI API
    const result = await callOpenAI(systemPrompt, userMessage);

    // Extract skills from AI response with better validation
    const technicalSkills = result?.technicalSkills || [];
    const softSkills = result?.softSkills || [];

    // Validate response format
    if (!Array.isArray(technicalSkills)) {
      console.error("Technical skills is not an array:", technicalSkills);
      throw new Error("AI did not return technical skills as an array");
    }

    if (!Array.isArray(softSkills)) {
      console.error("Soft skills is not an array:", softSkills);
      throw new Error("AI did not return soft skills as an array");
    }

    // Validate that we have at least some skills
    if (technicalSkills.length === 0 && softSkills.length === 0) {
      console.warn("No skills extracted from JD keywords");
      // Don't throw error, just return empty arrays
    }

    return NextResponse.json(
      {
        technicalSkills,
        softSkills,
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
