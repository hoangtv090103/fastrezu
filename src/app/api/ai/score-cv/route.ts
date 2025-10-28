import { NextRequest, NextResponse } from "next/server";
import { callOpenAI } from "@/lib/openai";
import { getSystemPrompt, CVLanguage } from '@/lib/prompts';
import { handleAPIError, logError, ERROR_MESSAGES } from '@/lib/error-handler';

export async function POST(request: NextRequest) {
  try {
    const { cvData, jdKeywords } = await request.json();

    if (!cvData) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.vi.validation_error },
        { status: 400 }
      );
    }

    const language = 'vi'

    // Validate language parameter
    if (!['vi', 'en'].includes(language)) {
      return NextResponse.json({ 
        error: ERROR_MESSAGES.vi.validation_error 
      }, { status: 400 })
    }

    // Get system prompt based on language
    const systemPrompt = getSystemPrompt('score_cv', language as CVLanguage);

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

    const userMessage = `Hãy đánh giá CV sau đây dựa trên các từ khóa JD và tiêu chí đã cho.

**Từ khóa JD (${jdKeywords?.length || 0} từ khóa):**
${JSON.stringify(jdKeywords, null, 2)}

**Dữ liệu CV:**
${JSON.stringify(cvSummary, null, 2)}

**Yêu cầu:**
1. So sánh từng từ khóa JD với nội dung CV
2. Tính chính xác % từ khóa khớp (số từ khóa tìm thấy / tổng số từ khóa JD)
3. Đánh giá định dạng, độ hoàn thiện, và độ liên quan
4. Liệt kê rõ ràng từ khóa đã khớp và còn thiếu
5. Đưa ra 3-5 gợi ý cải thiện cụ thể

Trả về JSON theo đúng format đã chỉ định.`;

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
