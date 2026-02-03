import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, hasBrandAccess } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getBrandIdFromSlug } from "@/lib/db/brand";
import { ChunkingService } from "@/lib/repository/services/chunking-service";
import { ClassificationService } from "@/lib/repository/services/classification-service";
import { EmbeddingService } from "@/lib/repository/services/embedding-service";
import { SimilarityService } from "@/lib/repository/services/similarity-service";
import { ClusteringService } from "@/lib/repository/services/clustering-service";
import { z } from "zod";

export const runtime = "nodejs";

const ingestSchema = z.object({
  content: z.string().min(1),
  source: z.enum(["WEBSITE_CRAWL", "DOCUMENT_UPLOAD", "MANUAL", "GENERATED"]),
  sourceId: z.string().optional(),
  sourceUrl: z.string().url().optional(),
  sourcePage: z.string().optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ brandSlug: string }> }
) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { brandSlug } = await params;
    const userOrgIds = user.memberships?.map((m) => m.orgId) || [];
    const brandId = await getBrandIdFromSlug(brandSlug, userOrgIds);

    if (!brandId) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    const hasAccess = await hasBrandAccess(user.id, brandId);
    if (!hasAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const data = ingestSchema.parse(body);

    // Get brand context
    const brand = await prisma.brand.findUnique({
      where: { id: brandId },
      select: { name: true },
    });

    // Step 1: Chunk content
    const chunks = await ChunkingService.chunkContent(data.content);

    // Step 2: Classify and generate embeddings
    const classifications = await ClassificationService.classifyChunks(
      chunks,
      { name: brand?.name }
    );

    const texts = chunks.map(c => c.text);
    const embeddings = await EmbeddingService.generateEmbeddings(texts);

    // Step 3: Check for duplicates and similar chunks
    const existingChunks = await prisma.repositoryChunk.findMany({
      where: {
        brandId,
        status: { not: "DEPRECATED" },
      },
      select: {
        id: true,
        embedding: true,
        text: true,
      },
      take: 1000, // Limit for performance
    });

    // Step 4: Create chunks and detect similarities
    const createdChunks = [];
    const similarityThresholds = {
      duplicate: 0.92,
      nearDuplicate: 0.85,
      related: 0.75,
    };

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const classification = classifications[i];
      const embedding = embeddings[i];

      // Find similar existing chunks
      const similar = SimilarityService.findSimilar(
        embedding,
        existingChunks
          .filter(c => c.embedding)
          .map(c => ({
            id: c.id,
            embedding: Array.isArray(c.embedding) ? c.embedding : JSON.parse(c.embedding as string),
          })),
        similarityThresholds
      );

      // Create chunk
      const created = await prisma.repositoryChunk.create({
        data: {
          brandId,
          text: chunk.text,
          normalisedText: chunk.normalisedText,
          embedding: JSON.stringify(embedding), // Store as JSON string for now
          category: classification.category,
          subCategory: classification.subCategory,
          channel: classification.channel,
          intent: classification.intent,
          toneTags: classification.toneTags,
          status: data.source === "MANUAL" ? "APPROVED" : "INFERRED",
          source: data.source,
          sourceId: data.sourceId,
          sourceUrl: data.sourceUrl,
          sourcePage: data.sourcePage,
          confidenceScore: classification.confidenceScore,
          approvedBy: data.source === "MANUAL" ? user.id : null,
          approvedAt: data.source === "MANUAL" ? new Date() : null,
          metadata: chunk.metadata,
        },
      });

      createdChunks.push({
        ...created,
        duplicates: similar.duplicates,
        nearDuplicates: similar.nearDuplicates,
        related: similar.related,
      });
    }

    // Step 5: Create clusters for near-duplicates
    // This would be done in a background job in production
    // For now, we'll do basic clustering
    const chunksWithEmbeddings = createdChunks.map(c => ({
      id: c.id,
      embedding: embeddings[createdChunks.indexOf(c)],
      text: c.text,
      status: c.status,
      confidenceScore: c.confidenceScore || undefined,
      usageCount: 0,
    }));

    const clusters = ClusteringService.createClusters(chunksWithEmbeddings, {
      nearDuplicateThreshold: 0.85,
      minClusterSize: 2,
    });

    // Save clusters
    for (const [clusterId, cluster] of clusters.entries()) {
      const createdCluster = await prisma.repositoryCluster.create({
        data: {
          id: clusterId,
          brandId,
          canonicalChunkId: cluster.canonicalChunkId,
          variantCount: cluster.chunkIds.length,
        },
      });

      // Update chunks with clusterId
      await prisma.repositoryChunk.updateMany({
        where: {
          id: { in: cluster.chunkIds },
        },
        data: {
          clusterId: createdCluster.id,
        },
      });
    }

    return NextResponse.json({
      success: true,
      chunksCreated: createdChunks.length,
      clustersCreated: clusters.size,
      chunks: createdChunks,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Error ingesting content:", error);
    return NextResponse.json(
      { error: "Failed to ingest content" },
      { status: 500 }
    );
  }
}

