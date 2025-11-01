import { NextRequest, NextResponse } from "next/server";
import { callOpenAI } from "@/lib/openai";
import { getSystemPrompt, CVLanguage } from '@/lib/prompts';
import { handleAPIError, logError, ERROR_MESSAGES } from '@/lib/error-handler';

// Increase timeout for AI scoring (can take up to 2 minutes)
export const maxDuration = 120; // 2 minutes

export async function POST(request: NextRequest) {
  try {
    const { cvData, jdKeywords, language = 'vi' } = await request.json();

    if (!cvData) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.vi.validation_error },
        { status: 400 }
      );
    }

    // Validate language parameter
    const cvLanguage = (language === 'en' ? 'en' : 'vi') as CVLanguage;
    if (!['vi', 'en'].includes(cvLanguage)) {
      return NextResponse.json({ 
        error: ERROR_MESSAGES.vi.validation_error 
      }, { status: 400 })
    }

    // Get system prompt based on language
    const systemPrompt = getSystemPrompt('score_cv', cvLanguage);

    // Build a more structured CV summary for better analysis
    const cvSummary = {
      personalInfo: cvData.sections?.personal_info || {},
      summary: cvData.sections?.summary || {},
      experience: cvData.sections?.experience || [],
      education: cvData.sections?.education || [],
      skills: cvData.sections?.skills || [],
      projects: cvData.sections?.projects || [],
      certifications: cvData.sections?.certifications || []
    };

    const userMessage = cvLanguage === 'vi'
      ? `Hãy đánh giá CV sau đây dựa trên các từ khóa JD và tiêu chí đã cho.

**Ngôn ngữ CV:** Tiếng Việt (vi)

**Từ khóa JD (${jdKeywords?.length || 0} từ khóa):**
${JSON.stringify(jdKeywords, null, 2)}

**Dữ liệu CV:**
${JSON.stringify(cvSummary, null, 2)}

**Yêu cầu quan trọng:**
1. So sánh từng từ khóa JD với nội dung CV
2. Tính chính xác % từ khóa khớp (số từ khóa tìm thấy / tổng số từ khóa JD)
3. Đánh giá định dạng, độ hoàn thiện, và độ liên quan
4. Liệt kê rõ ràng từ khóa đã khớp và còn thiếu
5. Đưa ra 3-5 gợi ý cải thiện cụ thể

**LƯU Ý QUAN TRỌNG VỀ NGÔN NGỮ:**
- CV này được viết bằng TIẾNG VIỆT
- Tất cả applied_content trong suggestions PHẢI được viết bằng TIẾNG VIỆT
- suggestion_text cũng phải bằng TIẾNG VIỆT
- Đảm bảo applied_content giữ nguyên ngôn ngữ với original_content

Trả về JSON theo đúng format đã chỉ định.`
      : `Please evaluate the following CV based on the JD keywords and provided criteria.

**CV Language:** English (en)

**JD Keywords (${jdKeywords?.length || 0} keywords):**
${JSON.stringify(jdKeywords, null, 2)}

**CV Data:**
${JSON.stringify(cvSummary, null, 2)}

**Important Requirements:**
1. Compare each JD keyword with CV content
2. Calculate accurate % keyword match (keywords found / total JD keywords)
3. Evaluate formatting, completeness, and relevance
4. Clearly list matched and missing keywords
5. Provide 3-5 specific improvement suggestions

**IMPORTANT LANGUAGE NOTE:**
- This CV is written in ENGLISH
- All applied_content in suggestions MUST be written in ENGLISH
- suggestion_text should also be in ENGLISH
- Ensure applied_content maintains the same language as original_content

Return JSON in the exact specified format.`;

    // Call OpenAI API
    let result;
    try {
      result = await callOpenAI(systemPrompt, userMessage);
    } catch (openaiError) {
      const error = handleAPIError(openaiError, 'score-cv OpenAI call', language as 'vi' | 'en');
      logError(error);
      return NextResponse.json({ 
        error: error.userMessage 
      }, { status: 503 });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    const appError = handleAPIError(error, 'score-cv API', 'vi');
    logError(appError);
    return NextResponse.json(
      { error: appError.userMessage },
      { status: 500 }
    );
  }
}
