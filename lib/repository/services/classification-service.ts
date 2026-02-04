/**
 * ClassificationService
 * Classifies chunks using OpenAI
 */

import OpenAI from "openai";

const isBuild = typeof process.env.NEXT_PHASE !== "undefined" && process.env.NEXT_PHASE === "phase-production-build";
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || (isBuild ? "build-placeholder" : ""),
});

export interface ClassificationResult {
  category: string | null;
  subCategory: string | null;
  channel: string | null;
  intent: string | null;
  toneTags: string[];
  confidenceScore: number;
}

export class ClassificationService {
  /**
   * Classify a chunk using OpenAI
   */
  static async classifyChunk(
    text: string,
    brandContext?: {
      name?: string;
      domain?: string;
    }
  ): Promise<ClassificationResult> {
    const prompt = `You are classifying brand copy for a brand language repository.

${brandContext ? `Brand: ${brandContext.name || 'Unknown'}\nDomain: ${brandContext.domain || 'Unknown'}\n` : ''}

Classify the following copy snippet:

"${text}"

Return a JSON object with:
- category: One of: Headlines, CTAs, Product copy, Legal, Boilerplate, Error messages, Help text, Marketing copy, Support copy, or null
- subCategory: More specific category (e.g., "Hero headline", "Button CTA", "Privacy policy"), or null
- channel: One of: Web, iOS, Android, Social, Email, Support, or null
- intent: One of: announce, persuade, explain, reassure, legal, inform, invite, or null
- toneTags: Array of tone descriptors (e.g., ["confident", "friendly", "professional"])
- confidenceScore: Number between 0 and 1

Only return valid JSON, no other text.`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a brand language classifier. Always return valid JSON only.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error("No response from OpenAI");
      }

      const result = JSON.parse(content) as ClassificationResult;
      
      // Validate and set defaults
      return {
        category: result.category || null,
        subCategory: result.subCategory || null,
        channel: result.channel || null,
        intent: result.intent || null,
        toneTags: Array.isArray(result.toneTags) ? result.toneTags : [],
        confidenceScore: typeof result.confidenceScore === 'number' 
          ? Math.max(0, Math.min(1, result.confidenceScore))
          : 0.7,
      };
    } catch (error) {
      console.error("Classification error:", error);
      // Return defaults on error
      return {
        category: null,
        subCategory: null,
        channel: null,
        intent: null,
        toneTags: [],
        confidenceScore: 0.5,
      };
    }
  }

  /**
   * Batch classify multiple chunks
   */
  static async classifyChunks(
    chunks: Array<{ text: string }>,
    brandContext?: { name?: string; domain?: string }
  ): Promise<ClassificationResult[]> {
    // Process in batches to avoid rate limits
    const batchSize = 10;
    const results: ClassificationResult[] = [];

    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(chunk => this.classifyChunk(chunk.text, brandContext))
      );
      results.push(...batchResults);
    }

    return results;
  }
}

