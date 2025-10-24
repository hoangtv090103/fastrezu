import { NextRequest, NextResponse } from 'next/server'
import { callOpenAI } from '@/lib/openai'

export async function POST(request: NextRequest) {
  try {
    const { cvData, jdKeywords } = await request.json()

    if (!cvData) {
      return NextResponse.json({ error: 'CV data is required' }, { status: 400 })
    }

    // System prompt để chấm điểm CV
    const systemPrompt = `You are an AI-powered ATS simulator and expert CV reviewer, specifically designed for the Vietnamese job market. Your task is to evaluate a given CV's content ("cvData"), provided as structured data/JSON) against a list of target keywords ("jdKeywords", provided as an array of strings) extracted from a specific Job Description.

Your primary goal is to assess how well the CV aligns with the job requirements implied by the keywords, assign an overall ATS compatibility score (from 0 to 100), identify matched and missing keywords, provide a brief analysis breakdown, and offer actionable suggestions for improvement.

**Scoring Criteria (approximate weighting):**
1.  **Keyword Match (60%):** How many "jdKeywords" are present in the "cvData"? Are they used in relevant contexts (e.g., job titles, achievements)? Are important keywords repeated appropriately?
2.  **Quantifiable Achievements (25%):** Does the CV use numbers, percentages, or specific metrics to demonstrate impact, especially in the 'experience' and 'projects' sections?
3.  **Relevance & Clarity (10%):** Is the content (especially 'summary' and 'experience') relevant to the likely role based on the keywords? Is it clearly written?
4.  **Completeness (5%):** Are essential sections like 'personal_info', 'experience', 'education', 'skills' present and filled?

You MUST output *only* a valid JSON object. Do not include any introductory text, concluding remarks, or explanations outside the JSON structure.

The JSON object should adhere strictly to the following structure:

{
  "score": <number between 0 and 100>,
  "analysis": {
    "keyword_match_percentage": <number between 0 and 100, estimate based on keyword presence/density>,
    "achievement_quantification_level": <string, e.g., "Low", "Medium", "High">,
    "relevance_clarity_level": <string, e.g., "Needs Improvement", "Acceptable", "Good">,
    "completeness_score": <number between 0 and 100, based on presence of key sections>
  },
  "suggestions": [
    "<string, actionable suggestion 1, e.g., 'Thêm từ khóa X vào phần Kinh nghiệm'>",
    "<string, actionable suggestion 2, e.g., 'Sử dụng số liệu cụ thể để mô tả thành tích Y'>",
    ..."up to 3-4 concise suggestions"
  ],
  "matchedKeywords": [
    "<string, keyword from jdKeywords found in cvData>",
    ...
  ],
  "missingKeywords": [
    "<string, keyword from jdKeywords NOT found in cvData>",
    ...
  ]
}

Be strict in evaluating keyword presence. Suggestions should be specific and helpful for improving the ATS score. Ensure the score reflects the combined evaluation based on the criteria.`;

    // Chuẩn bị dữ liệu CV để gửi cho AI
    const cvText = `
**Thông tin cá nhân:** ${JSON.stringify(cvData.sections?.personal_info || {})}
**Tóm tắt:** ${JSON.stringify(cvData.sections?.summary || {})}
**Kinh nghiệm:** ${JSON.stringify(cvData.sections?.experience || [])}
**Học vấn:** ${JSON.stringify(cvData.sections?.education || [])}
**Dự án:** ${JSON.stringify(cvData.sections?.projects || [])}
**Kỹ năng:** ${JSON.stringify(cvData.sections?.skills || [])}
**Chứng chỉ:** ${JSON.stringify(cvData.sections?.certifications || [])}
`;

    const userMessage = `Hãy chấm điểm CV sau dựa trên từ khóa JD:

**Từ khóa JD cần kiểm tra:** ${jdKeywords?.join(', ') || 'Không có'}

**Nội dung CV:**
${cvText}

Yêu cầu: Chấm điểm và đưa ra gợi ý cải thiện cụ thể.`;

    // Gọi OpenAI API
    const result = await callOpenAI(systemPrompt, userMessage);

    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    console.error('Score CV API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

