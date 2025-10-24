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
  options: { 
    responseFormat?: 'json_object' | 'text',
    temperature?: number 
  } = {}
) {
  try {
    const { responseFormat = 'json_object', temperature = 0.3 } = options;
    
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o',
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage }
      ],
      temperature,
      ...(responseFormat === 'json_object' && { response_format: { type: "json_object" } })
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error(`No response from AI service`);
    }

    // If using json_object format, parse directly
    if (responseFormat === 'json_object') {
      try {
        return JSON.parse(content);
      } catch (parseError) {
        console.error('JSON parse error for json_object format:', parseError);
        console.error('Raw content:', content);
        throw new Error(`Invalid JSON response from AI: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
      }
    }

    // For text format, clean and parse as before
    let cleanedContent = content.trim();
    
    // Remove markdown code blocks
    if (cleanedContent.startsWith('```json')) {
      cleanedContent = cleanedContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanedContent.startsWith('```')) {
      cleanedContent = cleanedContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    // Try to find JSON object in the content
    const jsonMatch = cleanedContent.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleanedContent = jsonMatch[0];
    }

    try {
      return JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error('JSON parse error for text format:', parseError);
      console.error('Raw content:', content);
      console.error('Cleaned content:', cleanedContent);
      throw new Error(`Invalid JSON response from AI: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
    }
  } catch (error) {
    console.error('AI API error:', error);
    throw new Error('Failed to get AI response');
  }
}

// Helper function for text-only responses (no JSON parsing)
export async function callOpenAIText(
  systemPrompt: string,
  userMessage: string,
  temperature: number = 0.3
) {
  try {
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o',
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage }
      ],
      temperature,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error(`No response from AI service`);
    }

    return content.trim();
  } catch (error) {
    console.error('AI API error:', error);
    throw new Error('Failed to get AI response');
  }
}
