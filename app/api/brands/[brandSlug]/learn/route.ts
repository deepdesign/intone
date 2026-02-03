import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser, hasBrandAccess } from "@/lib/auth";
import { getBrandIdFromSlug } from "@/lib/db/brand";

export const runtime = "nodejs";

// TODO: Implement actual learning processor
async function processLearnAsync(
  sessionId: string,
  brandId: string,
  params: {
    sourceType: string;
    sourceUrl: string | null;
    fileName: string | null;
    fileType: string | null;
    file: File | null;
  }
) {
  try {
    // Update status to PROCESSING
    await prisma.learnSession.update({
      where: { id: sessionId },
      data: { status: "PROCESSING" },
    });

    // TODO: Implement actual learning logic
    // This would:
    // 1. Parse the document/HTML
    // 2. Extract text content
    // 3. Use AI to analyze patterns and discover rules
    // 4. Create DiscoveredRule records

    // Extract text content (placeholder - would need actual parsing)
    let extractedContent = "";
    if (params.file) {
      // For file uploads, would parse PDF/DOCX/etc.
      extractedContent = "Extracted content from file..."; // Placeholder
    } else if (params.sourceUrl) {
      // For URLs, would crawl HTML
      extractedContent = "Crawled content from URL..."; // Placeholder
    }

    // Ingest content into Repository
    if (extractedContent) {
      try {
        const ingestResponse = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/brands/${brandId}/repository/ingest`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              // Note: In a real implementation, you'd need to pass auth headers
              // For background jobs, consider using an internal API key or service account
            },
            body: JSON.stringify({
              content: extractedContent,
              source: params.sourceType === "URL" ? "WEBSITE_CRAWL" : "DOCUMENT_UPLOAD",
              sourceId: sessionId,
              sourceUrl: params.sourceUrl || undefined,
              sourcePage: params.fileName || undefined,
            }),
          }
        );

        if (ingestResponse.ok) {
          const ingestResult = await ingestResponse.json();
          console.log(`Ingested ${ingestResult.chunksCreated} chunks into Repository`);
        }
      } catch (ingestError) {
        console.error("Error ingesting into Repository:", ingestError);
        // Don't fail the whole process if Repository ingestion fails
      }
    }

    // For now, simulate processing
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Update status to COMPLETED
    await prisma.learnSession.update({
      where: { id: sessionId },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
        rulesDiscovered: 0, // TODO: Count actual discovered rules
      },
    });
  } catch (error) {
    console.error("Error in processLearnAsync:", error);
    await prisma.learnSession.update({
      where: { id: sessionId },
      data: { status: "FAILED" },
    }).catch(console.error);
    throw error;
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ brandSlug: string }> }
) {
  try {
    const { brandSlug } = await params;
    const user = await getCurrentUser(req);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userOrgIds = user.memberships?.map((m) => m.orgId) || [];
    const brandId = await getBrandIdFromSlug(brandSlug, userOrgIds);

    if (!brandId) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    if (!(await hasBrandAccess(user.id, brandId))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Verify brand exists
    const brand = await prisma.brand.findUnique({
      where: { id: brandId },
    });

    if (!brand) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    const formData = await req.formData();
    const sourceType = formData.get("sourceType") as string;
    const sourceUrl = formData.get("sourceUrl") as string | null;
    const fileName = formData.get("fileName") as string | null;
    const fileType = formData.get("fileType") as string | null;
    const file = formData.get("file") as File | null;

    // Create learn session record
    const learnSession = await prisma.learnSession.create({
      data: {
        brandId,
        sourceType: sourceType as any,
        sourceUrl: sourceUrl || null,
        fileName: fileName || null,
        fileType: fileType || null,
        status: "PENDING",
        createdBy: user.id,
      },
    });

    // Process learning asynchronously
    // Start processing in background (don't await)
    processLearnAsync(learnSession.id, brandId, {
      sourceType,
      sourceUrl,
      fileName,
      fileType,
      file,
    }).catch((error) => {
      console.error("Error processing learn session:", error);
    });

    return NextResponse.json({
      sessionId: learnSession.id,
      status: learnSession.status,
      message: "Learning session started. Processing in background...",
    });
  } catch (error) {
    console.error("Error creating learn session:", error);
    return NextResponse.json(
      {
        error: "Failed to start learning session",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ brandSlug: string }> }
) {
  try {
    const { brandSlug } = await params;
    const user = await getCurrentUser(req);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userOrgIds = user.memberships?.map((m) => m.orgId) || [];
    const brandId = await getBrandIdFromSlug(brandSlug, userOrgIds);

    if (!brandId) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    if (!(await hasBrandAccess(user.id, brandId))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const sessions = await prisma.learnSession.findMany({
      where: { brandId },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        _count: {
          select: { discoveredRules: true },
        },
      },
    });

    return NextResponse.json(sessions);
  } catch (error) {
    console.error("Error fetching learn sessions:", error);
    return NextResponse.json(
      { error: "Failed to fetch learn sessions" },
      { status: 500 }
    );
  }
}

