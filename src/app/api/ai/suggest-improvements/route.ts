import { NextRequest, NextResponse } from 'next/server';
import { callOpenAI } from '@/lib/openai';
import { CVLanguage } from '@/contexts/CVEditorContext';
import { Suggestion } from '@/lib/suggestion-generator';
import { suggestImprovementsSchema, validateSchema } from '@/lib/validation-schemas';

interface RequestBody {
  suggestions: Suggestion[];
  cvData: {
    sections: {
      experience?: Array<{ title?: string; company?: string; description?: string }>;
      summary?: { text?: string };
      [key: string]: unknown;
    };
    language?: CVLanguage;
  };
}

const SYSTEM_PROMPTS = {
  vi: `Bạn là FastRezu AI, chuyên gia viết CV chuyên nghiệp cho thị trường Việt Nam.

**Nhiệm vụ:** Tạo câu ví dụ cụ thể để tích hợp từ khóa vào CV một cách tự nhiên.

**Hướng dẫn:**
1. Viết câu ví dụ bằng tiếng Việt
2. Bắt đầu bằng động từ hành động mạnh (Phát triển, Quản lý, Triển khai, Tối ưu hóa, v.v.)
3. Tích hợp từ khóa một cách tự nhiên vào câu
4. Thêm số liệu cụ thể nếu có thể (%, số lượng, thời gian)
5. Giữ câu ngắn gọn (1-2 dòng)
6. Đảm bảo câu phù hợp với ngữ cảnh công việc

Trả về JSON với cấu trúc:
{
  "examples": [
    {
      "suggestionId": "<id của suggestion>",
      "exampleText": "<câu ví dụ tiếng Việt>"
    }
  ]
}`,
  en: `You are FastRezu AI, an expert CV writer for the international job market.

**Task:** Create specific example sentences to naturally integrate keywords into a CV.

**Instructions:**
1. Write example sentences in English
2. Start with strong action verbs (Developed, Managed, Implemented, Optimized, etc.)
3. Integrate keywords naturally into the sentence
4. Add specific metrics when possible (%, numbers, timeframes)
5. Keep sentences concise (1-2 lines)
6. Ensure sentences fit the work context

Return JSON with structure:
{
  "examples": [
    {
      "suggestionId": "<suggestion id>",
      "exampleText": "<example sentence in English>"
    }
  ]
}`
};

export async function POST(request: NextRequest) {
  try {
    const body: RequestBody = await request.json();
    
    // Validate with Zod
    const validation = validateSchema(suggestImprovementsSchema, body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.firstError, details: validation.errors },
        { status: 400 }
      );
    }
    
    const { suggestions, cvData } = validation.data;

    const language = 'vi';

    // Build context from CV data
    const experience = cvData?.sections?.experience;
    const experienceContext = Array.isArray(experience) && experience.length > 0
      ? experience.slice(0, 2).map((exp: { title?: string; company?: string }) => 
          `${exp.title || 'Position'} at ${exp.company || 'Company'}`
        ).join(', ')
      : 'No experience provided';

    const summaryContext = cvData?.sections?.summary 
      ? (cvData.sections.summary as { text?: string }).text || 'No summary'
      : 'No summary';

    // Create user message with suggestions
    const userMessage = language === 'vi' 
      ? `Tạo câu ví dụ cho các gợi ý sau:

Bối cảnh CV:
- Kinh nghiệm: ${experienceContext}
- Tóm tắt: ${summaryContext.substring(0, 200)}

Các gợi ý cần tạo ví dụ:
${suggestions.map((s, i) => `${i + 1}. ID: ${s.id}
   Từ khóa: ${s.keyword}
   Phần: ${s.targetSection}
   Ưu tiên: ${s.priority}`).join('\n\n')}

Hãy tạo câu ví dụ cụ thể cho mỗi gợi ý, phù hợp với bối cảnh CV.`
      : `Create example sentences for the following suggestions:

CV Context:
- Experience: ${experienceContext}
- Summary: ${summaryContext.substring(0, 200)}

Suggestions to create examples for:
${suggestions.map((s, i) => `${i + 1}. ID: ${s.id}
   Keyword: ${s.keyword}
   Section: ${s.targetSection}
   Priority: ${s.priority}`).join('\n\n')}

Create specific example sentences for each suggestion that fit the CV context.`;

    // Call OpenAI to generate example sentences
    const aiResponse = await callOpenAI(
      SYSTEM_PROMPTS[language],
      userMessage,
      { responseFormat: 'json_object', temperature: 0.7 }
    );

    // Parse the response
    const examples = aiResponse.examples || [];

    // Map examples back to suggestions
    const enhancedSuggestions = suggestions.map(suggestion => {
      const example = examples.find((ex: { suggestionId: string }) => ex.suggestionId === suggestion.id);
      return {
        ...suggestion,
        exampleText: example?.exampleText || undefined
      };
    });

    return NextResponse.json({
      suggestions: enhancedSuggestions,
      success: true
    });

  } catch (error) {
    console.error('Error generating suggestion examples:', error);
    
    // Return suggestions without examples on error
    const body: RequestBody = await request.json();
    return NextResponse.json({
      suggestions: body.suggestions,
      success: false,
      error: 'Failed to generate examples, but suggestions are still available'
    });
  }
}
