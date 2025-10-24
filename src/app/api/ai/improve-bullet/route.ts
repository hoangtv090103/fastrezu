import { NextRequest, NextResponse } from "next/server";
import { callOpenAI } from "@/lib/openai";
import { getSystemPrompt, getUserMessageTemplate, CVLanguage } from '@/lib/prompts';

export async function POST(request: NextRequest) {
  try {
    const {
      bulletPoint,
      context: _context,
      jdKeywords: _jdKeywords,
      language = 'vi'
    } = await request.json();

    if (!bulletPoint || typeof bulletPoint !== "string") {
      return NextResponse.json(
        { error: "Bullet point text is required" },
        { status: 400 }
      );
    }

    // Validate language parameter
    if (!['vi', 'en'].includes(language)) {
      return NextResponse.json({ error: 'Invalid language parameter. Must be "vi" or "en"' }, { status: 400 })
    }

    // Get system prompt based on language
    const systemPrompt = getSystemPrompt('improve_bullet', language as CVLanguage);

    // Get user message template based on language
    const userMessageTemplates = getUserMessageTemplate(language as CVLanguage);
    const userMessage = userMessageTemplates.improve_bullet(bulletPoint, _context, _jdKeywords);

    // Call AI API
    console.log("Improving bullet point...");
    const result = await callOpenAI(systemPrompt, userMessage);

    if (!result.improvedBullet) {
      throw new Error("AI did not generate improved bullet point");
    }

    return NextResponse.json(
      { improvedBullet: result.improvedBullet },
      { status: 200 }
    );
  } catch (error) {
    console.error("Improve Bullet API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
