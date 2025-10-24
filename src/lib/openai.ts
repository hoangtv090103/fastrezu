import OpenAI from 'openai';

// Cấu hình OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1', // Có thể dùng proxy hoặc custom endpoint
});

export default openai;

// Helper function để gọi OpenAI với error handling
export async function callOpenAI(
  systemPrompt: string,
  userMessage: string,
) {
  try {
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o',
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage }
      ],
      temperature: 0.3,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error(`No response from AI service`);
    }

    // Clean the content to remove markdown code blocks if present
    let cleanedContent = content.trim();
    
    // Remove markdown code blocks
    if (cleanedContent.startsWith('```json')) {
      cleanedContent = cleanedContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanedContent.startsWith('```')) {
      cleanedContent = cleanedContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    return JSON.parse(cleanedContent);
  } catch (error) {
    console.error('AI API error:', error);
    throw new Error('Failed to get AI response');
  }
}
