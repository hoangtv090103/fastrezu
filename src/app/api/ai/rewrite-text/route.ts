import { NextRequest, NextResponse } from 'next/server';
import { callOpenAIText } from '@/lib/openai';
import { SYSTEM_PROMPTS, CVLanguage } from '@/lib/prompts';
import { createClient } from '@/lib/supabase-server';
import { checkAndRecordAIUsage, rateLimitExceededResponse } from '@/lib/ai-rate-limit';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("user_profiles")
      .select("subscription_tier")
      .eq("id", user.id)
      .single();

    const rateLimit = await checkAndRecordAIUsage(
      supabase,
      user.id,
      "rewrite-text",
      profile?.subscription_tier,
    );
    if (!rateLimit.allowed) {
      return rateLimitExceededResponse(rateLimit.used, rateLimit.limit);
    }

    const { text, language } = await req.json();

    // 1. Validate Input
    if (!text || typeof text !== 'string' || text.length < 5) {
      return NextResponse.json(
        { error: "Text is too short or invalid" }, 
        { status: 400 }
      );
    }

    const lang = (language === 'vi' || language === 'en') ? language : 'en';

    // 2. Get Prompt
    // We need to access the prompt directly since getSystemPrompt might not handle the replacement logic we want here
    // or we can just use the string from SYSTEM_PROMPTS and replace {userInput}
    
    // The prompt in prompts.ts has {userInput} placeholder, but usually we pass user input as the user message.
    // However, the prompt structure in prompts.ts seems to include "Input: "{userInput}"" inside the system prompt?
    // Let's check the prompt content again.
    // vi: `... Input: "{userInput}" Output (Tiếng Việt):`
    // Yes, it has the placeholder. So we should replace it.
    
    // Actually, it's better practice to keep the system prompt static and put the input in the user message.
    // But the prompt design in prompts.ts seems to want the input embedded.
    // Let's follow the prompt design for now, but usually we should separate them.
    // Wait, the pseudo-code said:
    // const systemPrompt = getSystemPrompt('rewrite_text', language);
    // const userMessage = `Input: "${text}"`;
    
    // If I use the prompt from prompts.ts as is, it has "{userInput}" at the end.
    // If I replace it, it becomes a fixed system prompt with the user input inside.
    // Then what is the user message?
    
    // Let's look at how other prompts are used.
    // In prompts.ts, most prompts don't have placeholders like {userInput}.
    // This one does.
    
    // If I strictly follow the prompt text:
    // Input: "{userInput}"
    // Output (Tiếng Việt):
    
    // I should replace {userInput} with the actual text.
    // And then pass an empty user message? Or just pass "Rewrite this" as user message?
    // Or maybe I should strip the "Input:..." part from the system prompt and put it in the user message.
    
    // Let's stick to the user's pseudo-code which suggests:
    // const systemPrompt = getSystemPrompt('rewrite_text', language);
    // const userMessage = `Input: "${text}"`;
    
    // But the prompt in prompts.ts HAS "{userInput}".
    // If I use getSystemPrompt, it returns the string.
    // If I don't replace {userInput}, it stays there.
    
    // Let's adjust the implementation to replace the placeholder.
    const promptTemplate = SYSTEM_PROMPTS.rewrite_text[lang as CVLanguage];
    const finalSystemPrompt = promptTemplate.replace('{userInput}', text);
    
    // And for the user message, we can just say "Please rewrite the text above." or leave it empty if the model allows.
    // OpenAI usually expects a user message.
    const userMessage = "Please rewrite the text according to the instructions.";

    // 3. Call AI
    const rewrittenText = await callOpenAIText(finalSystemPrompt, userMessage);
    
    // 4. Return Result
    return NextResponse.json({ result: rewrittenText });

  } catch (error) {
    console.error('Error in rewrite-text:', error);
    return NextResponse.json(
      { error: "Internal Server Error" }, 
      { status: 500 }
    );
  }
}
