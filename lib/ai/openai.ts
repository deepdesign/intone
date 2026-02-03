import OpenAI from "openai";

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

/**
 * Create an OpenAI client with a specific API key
 */
export function createOpenAIClient(apiKey: string): OpenAI {
  return new OpenAI({
    apiKey,
  });
}

/**
 * Generate content using OpenAI
 * Uses user's API key if provided, otherwise falls back to environment variable
 */
export async function generateWithOpenAI(
  prompt: string,
  options?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    apiKey?: string; // User's API key (optional)
  }
) {
  try {
    // Use user's API key if provided, otherwise use default client
    const client = options?.apiKey
      ? createOpenAIClient(options.apiKey)
      : openai;

    const response = await client.chat.completions.create({
      model: options?.model || "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a brand language governance assistant. Your primary responsibility is to strictly follow all brand rules provided in the user's prompt. These rules are requirements, not suggestions. Always return valid JSON responses according to the specified format. Do not include any text outside the JSON structure. When rules specify values, configurations, or preferences, you must apply them exactly as specified.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 2000,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from OpenAI");
    }

    return JSON.parse(content);
  } catch (error) {
    console.error("OpenAI API error:", error);
    throw error;
  }
}
