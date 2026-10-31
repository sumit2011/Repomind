const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.warn('GEMINI_API_KEY not set. AI features will be disabled.');
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

export interface ChatResponse {
  content: string;
  citations?: string[];
}

/**
 * Send a message to Gemma 4 with optional context using REST API
 */
export async function chatWithGemma(
  messages: ChatMessage[],
  context?: string
): Promise<ChatResponse> {
  if (!apiKey) {
    throw new Error('Gemini API not configured. Please set GEMINI_API_KEY.');
  }

  try {
    // Build the prompt with context if available
    let prompt = '';
    
    if (context) {
      prompt += `Context from repository analysis:\n${context}\n\n`;
    }

    // Add conversation history
    for (const msg of messages) {
      prompt += `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}\n`;
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ]
        })
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to get response from AI');
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response';

    // Extract citations (placeholder - Phase 3 will implement actual citation extraction)
    const citations: string[] = [];

    return {
      content: text,
      citations
    };
  } catch (error) {
    console.error('Gemini API error:', error);
    throw new Error('Failed to get response from AI');
  }
}

/**
 * Check if Gemini API is configured
 */
export function isGeminiConfigured(): boolean {
  return !!apiKey;
}
