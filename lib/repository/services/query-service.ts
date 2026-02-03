/**
 * RepositoryQueryService
 * Queries the repository for similar chunks
 */

import { prisma } from "@/lib/db";
import { EmbeddingService } from "./embedding-service";
import { SimilarityService } from "./similarity-service";

export interface QueryOptions {
  category?: string;
  intent?: string;
  channel?: string;
  limit?: number;
  minSimilarity?: number;
  preferCanonical?: boolean;
  preferApproved?: boolean;
}

export interface QueryResult {
  chunkId: string;
  text: string;
  similarity: number;
  category?: string;
  intent?: string;
  channel?: string;
  canonical: boolean;
  approved: boolean;
  usageCount: number;
}

export class RepositoryQueryService {
  /**
   * Query repository for similar chunks
   * Used for grounding AI generation
   */
  static async querySimilar(
    brandId: string,
    queryText: string,
    options: QueryOptions = {}
  ): Promise<QueryResult[]> {
    const {
      category,
      intent,
      channel,
      limit = 5,
      minSimilarity = 0.75,
      preferCanonical = true,
      preferApproved = true,
    } = options;

    // Generate embedding for query
    const queryEmbedding = await EmbeddingService.generateEmbedding(queryText);

    // Build where clause
    const where: any = {
      brandId,
      status: { not: "DEPRECATED" },
    };

    if (category) {
      where.category = category;
    }
    if (intent) {
      where.intent = intent;
    }
    if (channel) {
      where.channel = channel;
    }

    // Fetch chunks with embeddings
    // Note: In production, use pgvector's cosine similarity operator
    // For now, we'll fetch and calculate in memory
    const chunks = await prisma.repositoryChunk.findMany({
      where,
      select: {
        id: true,
        text: true,
        embedding: true,
        category: true,
        intent: true,
        channel: true,
        canonical: true,
        status: true,
        usageCount: true,
      },
      take: 100, // Limit initial fetch for performance
    });

    // Calculate similarities
    const results: QueryResult[] = [];

    for (const chunk of chunks) {
      if (!chunk.embedding) continue;

      // Convert embedding to number array
      // Note: In production with pgvector, this would be handled by the database
      const embedding = this.parseEmbedding(chunk.embedding);
      if (!embedding) continue;

      const similarity = SimilarityService.cosineSimilarity(queryEmbedding, embedding);

      if (similarity >= minSimilarity) {
        results.push({
          chunkId: chunk.id,
          text: chunk.text,
          similarity,
          category: chunk.category || undefined,
          intent: chunk.intent || undefined,
          channel: chunk.channel || undefined,
          canonical: chunk.canonical,
          approved: chunk.status === "APPROVED",
          usageCount: chunk.usageCount,
        });
      }
    }

    // Sort by priority
    results.sort((a, b) => {
      // Priority 1: Canonical (if preferCanonical)
      if (preferCanonical) {
        if (a.canonical !== b.canonical) {
          return a.canonical ? -1 : 1;
        }
      }

      // Priority 2: Approved (if preferApproved)
      if (preferApproved) {
        if (a.approved !== b.approved) {
          return a.approved ? -1 : 1;
        }
      }

      // Priority 3: Usage count
      if (a.usageCount !== b.usageCount) {
        return b.usageCount - a.usageCount;
      }

      // Priority 4: Similarity
      return b.similarity - a.similarity;
    });

    return results.slice(0, limit);
  }

  /**
   * Parse embedding from database format
   * Handles both string and array formats
   */
  private static parseEmbedding(embedding: any): number[] | null {
    if (Array.isArray(embedding)) {
      return embedding;
    }
    if (typeof embedding === 'string') {
      try {
        return JSON.parse(embedding);
      } catch {
        return null;
      }
    }
    return null;
  }
}

