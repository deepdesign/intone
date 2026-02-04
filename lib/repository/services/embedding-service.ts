/**
 * EmbeddingService
 * Generates embeddings for chunks using OpenAI
 */

import OpenAI from "openai";

const isBuild = typeof process.env.NEXT_PHASE !== "undefined" && process.env.NEXT_PHASE === "phase-production-build";
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || (isBuild ? "build-placeholder" : ""),
});

export class EmbeddingService {
  /**
   * Generate embedding for a text chunk
   * Returns a 1536-dimensional vector
   */
  static async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await openai.embeddings.create({
        model: "text-embedding-3-small", // 1536 dimensions
        input: text,
      });

      return response.data[0].embedding;
    } catch (error) {
      console.error("Embedding generation error:", error);
      throw error;
    }
  }

  /**
   * Generate embeddings for multiple texts
   */
  static async generateEmbeddings(texts: string[]): Promise<number[][]> {
    try {
      // OpenAI supports up to 2048 inputs per request
      const batchSize = 2048;
      const embeddings: number[][] = [];

      for (let i = 0; i < texts.length; i += batchSize) {
        const batch = texts.slice(i, i + batchSize);
        const response = await openai.embeddings.create({
          model: "text-embedding-3-small",
          input: batch,
        });

        embeddings.push(...response.data.map(d => d.embedding));
      }

      return embeddings;
    } catch (error) {
      console.error("Batch embedding generation error:", error);
      throw error;
    }
  }
}

