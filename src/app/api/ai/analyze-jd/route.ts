import { NextRequest, NextResponse } from 'next/server'
import { callOpenAI } from '@/lib/openai'

export async function POST(request: NextRequest) {
  try {
    const { jdText } = await request.json()

    if (!jdText || typeof jdText !== 'string') {
      return NextResponse.json({ error: 'Job description text is required' }, { status: 400 })
    }

    // System prompt để phân tích JD và trích xuất từ khóa
    const systemPrompt = `You are an expert HR Technology analyst specializing in optimizing resumes for Applicant Tracking Systems (ATS). Your primary function is to meticulously analyze the provided Job Description (JD) text.

Your goal is to extract key information crucial for tailoring a CV to pass ATS screening and impress recruiters. Focus *specifically* on identifying hard skills, technical tools, specific methodologies, qualifications, responsibilities, and experience requirements that an ATS is likely programmed to look for.

You MUST output *only* a valid JSON object containing the extracted information. Do not include any introductory text, concluding remarks, or explanations outside the JSON structure.

The JSON object should adhere strictly to the following structure:

{
  "ats_keywords": [
    "keyword1",
    "keyword2",
    "Specific Tool (e.g., React)",
    "Methodology (e.g., Agile)",
    "Responsibility Phrase (e.g., manage budgets)",
    ..."up to 20-25 most important keywords"
  ],
  "required_skills": [
    "Skill explicitly stated as 'must-have' or required",
    "Another required skill"
    ...
  ],
  "nice_to_have_skills": [
    "Skill mentioned as 'preferred', 'plus', or 'nice to have'",
    ...
  ],
  "experience_level_estimate": "e.g., Entry-level (0-2 years), Mid-level (3-5 years), Senior (5+ years), Managerial",
  "key_qualifications_phrases": [
    "Direct phrase from JD about a key requirement (e.g., 'Proven experience in leading teams')",
    "Another key qualification phrase"
    ...
  ]
}

Prioritize concrete nouns and verbs. Be accurate and extract terms directly from the text where possible. Ensure the "ats_keywords" list is comprehensive but focused on terms relevant for matching.`;

    const userMessage = `Hãy phân tích mô tả công việc sau và trích xuất từ khóa ATS:

${jdText}`;

    // Gọi OpenAI API
    console.log('Calling OpenAI API with prompt length:', systemPrompt.length);
    const analysis = await callOpenAI(systemPrompt, userMessage);
    console.log('OpenAI API response:', analysis);

    return NextResponse.json(analysis, { status: 200 })
  } catch (error) {
    console.error('JD Analysis API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
