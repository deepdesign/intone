/**
 * ChunkingService
 * Intelligently splits content into atomic chunks for the Repository
 */

export interface Chunk {
  text: string;
  normalisedText: string;
  metadata?: {
    source?: string;
    pageNumber?: number;
    section?: string;
    heading?: string;
  };
}

export class ChunkingService {
  /**
   * Intelligently chunk content by splitting on:
   * - Headings
   * - Paragraphs
   * - CTAs
   * - Boilerplate patterns
   * - Avoiding nav/footer repetition
   */
  static async chunkContent(
    content: string,
    options: {
      minChunkSize?: number;
      maxChunkSize?: number;
      avoidPatterns?: RegExp[];
    } = {}
  ): Promise<Chunk[]> {
    const {
      minChunkSize = 50,
      maxChunkSize = 500,
      avoidPatterns = [
        /^(cookie|privacy|terms|copyright|©|all rights reserved)/i,
        /^(home|about|contact|menu|navigation)/i,
      ],
    } = options;

    const chunks: Chunk[] = [];
    
    // Split by headings first (markdown or HTML)
    const headingSplit = content.split(/(?:^|\n)#{1,6}\s+.+$/gm);
    
    for (const section of headingSplit) {
      if (!section.trim()) continue;
      
      // Extract heading if present
      const headingMatch = section.match(/^(?:^|\n)(#{1,6}\s+.+?)(?:\n|$)/m);
      const heading = headingMatch ? headingMatch[1].replace(/^#+\s+/, '') : undefined;
      
      // Split by paragraphs
      const paragraphs = section.split(/\n\s*\n/).filter(p => p.trim());
      
      for (const para of paragraphs) {
        const text = para.trim();
        
        // Skip if matches avoid patterns
        if (avoidPatterns.some(pattern => pattern.test(text))) {
          continue;
        }
        
        // Skip if too short
        if (text.length < minChunkSize) {
          continue;
        }
        
        // If too long, split further by sentences
        if (text.length > maxChunkSize) {
          const sentences = text.split(/(?<=[.!?])\s+/);
          let currentChunk = '';
          
          for (const sentence of sentences) {
            if ((currentChunk + sentence).length > maxChunkSize && currentChunk) {
              chunks.push(this.createChunk(currentChunk.trim(), { heading }));
              currentChunk = sentence;
            } else {
              currentChunk += (currentChunk ? ' ' : '') + sentence;
            }
          }
          
          if (currentChunk.trim()) {
            chunks.push(this.createChunk(currentChunk.trim(), { heading }));
          }
        } else {
          chunks.push(this.createChunk(text, { heading }));
        }
      }
    }
    
    return chunks;
  }

  private static createChunk(text: string, metadata?: Chunk['metadata']): Chunk {
    return {
      text,
      normalisedText: this.normaliseText(text),
      metadata,
    };
  }

  /**
   * Normalise text for comparison:
   * - Lowercase
   * - Remove extra whitespace
   * - Remove punctuation (optional)
   */
  private static normaliseText(text: string): string {
    return text
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim();
  }
}

