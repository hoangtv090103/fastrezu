import { callOpenAI } from "./openai";

export type Lang = 'vi' | 'en';

/**
 * Translate an array of texts to target language. Order-preserving.
 * Does not modify numbers, code, or placeholders in braces.
 */
export async function translateTexts(
  texts: string[],
  target: Lang,
  source: Lang | 'auto' = 'auto'
): Promise<string[]> {
  if (!texts || texts.length === 0) return [];

  const systemPrompt = `You are a precise, context-aware translator.
Return ONLY valid JSON with an array under key "translations" matching input order.
Preserve numbers, proper nouns when reasonable, markdown formatting, and placeholders like {name} intact.
Do not add commentary.`;

  const userMessage = JSON.stringify({
    source,
    target,
    texts,
  });

  const result = await callOpenAI(systemPrompt, userMessage, {
    responseFormat: 'json_object',
    temperature: 0.1,
    timeout: 60000,
    maxRetries: 3,
  });

  const translations = Array.isArray(result?.translations) ? result.translations : [];

  // Fallback: if size mismatch, return best-effort mapped items
  if (translations.length !== texts.length) {
    const out: string[] = [];
    for (let i = 0; i < texts.length; i++) {
      out.push(typeof translations[i] === 'string' ? translations[i] : texts[i]);
    }
    return out;
  }

  return translations.map((t: unknown, i: number) => (typeof t === 'string' ? t : texts[i]));
}
