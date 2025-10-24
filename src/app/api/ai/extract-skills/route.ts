import { NextRequest, NextResponse } from 'next/server'
import { callOpenAI } from '@/lib/openai'

export async function POST(request: NextRequest) {
  try {
    const { jdKeywords, existingSkills: _existingSkills } = await request.json()

    if (!jdKeywords || !Array.isArray(jdKeywords)) {
      return NextResponse.json({ error: 'JD keywords are required' }, { status: 400 })
    }

    // System prompt để trích xuất kỹ năng từ JD keywords
    const systemPrompt = `You are an expert HR analyst specializing in skill extraction and categorization. Your task is to analyze job description keywords and extract relevant technical and soft skills.

Based on the provided JD keywords, you need to:
1. Identify technical skills (programming languages, tools, frameworks, technologies)
2. Identify soft skills (leadership, communication, problem-solving, etc.)
3. Categorize them appropriately
4. Return skills in Vietnamese for soft skills, English for technical skills

You MUST output ONLY a valid JSON object with this structure:
{
  "technicalSkills": ["skill1", "skill2", "skill3"],
  "softSkills": ["kỹ năng 1", "kỹ năng 2", "kỹ năng 3"]
}`;

    const userMessage = `Dựa trên các từ khóa từ mô tả công việc sau, hãy trích xuất và phân loại các kỹ năng:

Từ khóa JD: ${jdKeywords.join(', ')}

Hãy phân tích và trích xuất:
1. Kỹ năng kỹ thuật (technical skills) - viết bằng tiếng Anh
2. Kỹ năng mềm (soft skills) - viết bằng tiếng Việt

Chỉ trả về các kỹ năng thực sự liên quan đến các từ khóa đã cho.`;

    // Call AI API
    console.log('Extracting skills from JD keywords...');
    const result = await callOpenAI(systemPrompt, userMessage);

    if (!result.technicalSkills || !result.softSkills) {
      throw new Error('AI did not generate skills properly');
    }

    return NextResponse.json({ 
      technicalSkills: result.technicalSkills,
      softSkills: result.softSkills
    }, { status: 200 })
  } catch (error) {
    console.error('Extract Skills API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
