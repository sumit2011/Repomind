import { GoogleGenAI } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.warn('GEMINI_API_KEY not set. AI features will be disabled.');
}

const genAI = apiKey ? new GoogleGenAI({ apiKey }) : null;

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

export interface ChatResponse {
  content: string;
  citations?: string[];
}

function formatPrompt(messages: ChatMessage[], context?: string): string {
  const lines: string[] = [];

  if (context) {
    lines.push('Repository context:');
    lines.push(context);
    lines.push('');
  }

  for (const message of messages) {
    const prefix = message.role === 'user' ? 'User' : 'Assistant';
    lines.push(`${prefix}: ${message.content}`);
  }

  lines.push('');
  lines.push('Answer using only the repository context above. If the repository context is insufficient, clearly say so and avoid inventing files or functions. Include citations as file paths when relevant.');

  return lines.join('\n');
}

export async function chatWithGemma(
  messages: ChatMessage[],
  context?: string,
  citations: string[] = []
): Promise<ChatResponse> {
  if (!apiKey || !genAI) {
    throw new Error('Gemini API not configured. Please set GEMINI_API_KEY.');
  }

  try {
    const prompt = formatPrompt(messages, context);

    const response = await genAI.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });

    const text =
      (response as { text?: string })?.text ||
      response.candidates?.[0]?.content?.parts?.[0]?.text ||
      'No response generated.';

    return {
      content: text,
      citations: citations.length > 0 ? citations : [],
    };
  } catch (error) {
    console.error('Gemini API error:', error);
    throw new Error('Failed to get response from AI');
  }
}

export function isGeminiConfigured(): boolean {
  return !!apiKey;
}
