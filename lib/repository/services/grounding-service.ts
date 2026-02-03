/**
 * GenerationGroundingService
 * Grounds AI generation in existing repository chunks
 */

import { RepositoryQueryService } from "./query-service";

export interface GroundingContext {
  channel?: string;
  intent?: string;
  topic?: string;
  category?: string;
}

export interface GroundingResult {
  chunks: Array<{
    id: string;
    text: string;
    isCanonical: boolean;
    isApproved: boolean;
  }>;
  promptAddition: string;
}

export class GenerationGroundingService {
  /**
   * Prepare grounding context for AI generation
   */
  static async prepareGrounding(
    brandId: string,
    userInput: string,
    context: GroundingContext
  ): Promise<GroundingResult> {
    // Query repository for relevant chunks
    const chunks = await RepositoryQueryService.querySimilar(
      brandId,
      userInput,
      {
        category: context.category,
        intent: context.intent,
        channel: context.channel,
        limit: 5,
        minSimilarity: 0.75,
        preferCanonical: true,
        preferApproved: true,
      }
    );

    // Separate canonical and variants
    const canonicalChunks = chunks.filter(c => c.canonical && c.approved);
    const variantChunks = chunks.filter(c => !c.canonical && c.approved);
    const inferredChunks = chunks.filter(c => !c.approved);

    // Build prompt addition
    let promptAddition = "";

    if (canonicalChunks.length > 0) {
      promptAddition += "Approved brand language examples (preferred phrasing):\n";
      canonicalChunks.forEach((chunk, idx) => {
        promptAddition += `[${idx + 1}] ${chunk.text}\n`;
      });
      promptAddition += "\n";
    }

    if (variantChunks.length > 0) {
      promptAddition += "Approved alternatives (acceptable but not primary):\n";
      variantChunks.slice(0, 3).forEach((chunk, idx) => {
        promptAddition += `[Alt ${idx + 1}] ${chunk.text}\n`;
      });
      promptAddition += "\n";
    }

    if (promptAddition) {
      promptAddition += "Instructions:\n";
      promptAddition += "- Reuse existing phrasing where appropriate\n";
      promptAddition += "- Maintain consistency with canonical language\n";
      promptAddition += "- Only introduce new phrasing if necessary\n";
      promptAddition += "- Prefer approved copy over inferred\n";
    }

    return {
      chunks: chunks.map(c => ({
        id: c.chunkId,
        text: c.text,
        isCanonical: c.canonical,
        isApproved: c.approved,
      })),
      promptAddition,
    };
  }
}

