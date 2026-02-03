/**
 * SimilarityService
 * Calculates cosine similarity between embeddings
 */

export class SimilarityService {
  /**
   * Calculate cosine similarity between two vectors
   * Returns a value between -1 and 1 (typically 0-1 for embeddings)
   */
  static cosineSimilarity(vec1: number[], vec2: number[]): number {
    if (vec1.length !== vec2.length) {
      throw new Error("Vectors must have the same length");
    }

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      norm1 += vec1[i] * vec1[i];
      norm2 += vec2[i] * vec2[i];
    }

    const denominator = Math.sqrt(norm1) * Math.sqrt(norm2);
    if (denominator === 0) {
      return 0;
    }

    return dotProduct / denominator;
  }

  /**
   * Find similar chunks based on similarity thresholds
   */
  static findSimilar(
    embedding: number[],
    candidates: Array<{ id: string; embedding: number[] }>,
    thresholds: {
      duplicate?: number; // ≥ 0.92
      nearDuplicate?: number; // 0.85 - 0.91
      related?: number; // 0.75 - 0.84
    } = {}
  ): {
    duplicates: Array<{ id: string; similarity: number }>;
    nearDuplicates: Array<{ id: string; similarity: number }>;
    related: Array<{ id: string; similarity: number }>;
  } {
    const {
      duplicate = 0.92,
      nearDuplicate = 0.85,
      related = 0.75,
    } = thresholds;

    const duplicates: Array<{ id: string; similarity: number }> = [];
    const nearDuplicates: Array<{ id: string; similarity: number }> = [];
    const relatedItems: Array<{ id: string; similarity: number }> = [];

    for (const candidate of candidates) {
      const similarity = this.cosineSimilarity(embedding, candidate.embedding);

      if (similarity >= duplicate) {
        duplicates.push({ id: candidate.id, similarity });
      } else if (similarity >= nearDuplicate) {
        nearDuplicates.push({ id: candidate.id, similarity });
      } else if (similarity >= related) {
        relatedItems.push({ id: candidate.id, similarity });
      }
    }

    // Sort by similarity descending
    const sortBySimilarity = (a: { similarity: number }, b: { similarity: number }) =>
      b.similarity - a.similarity;

    duplicates.sort(sortBySimilarity);
    nearDuplicates.sort(sortBySimilarity);
    relatedItems.sort(sortBySimilarity);

    return {
      duplicates,
      nearDuplicates,
      related: relatedItems,
    };
  }
}

