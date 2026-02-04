import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getBrandIdFromSlug } from "@/lib/db/brand";
import { processUrlAudit, processFileAudit, processFileLinkAudit } from "@/lib/audit/processor";

export const runtime = "nodejs";

async function processAuditAsync(
  auditId: string,
  params: {
    sourceType: string;
    sourceUrl: string | null;
    fileName: string | null;
    fileType: string | null;
    crawlDepth: number | null;
    maxPages: number | null;
    file: File | null;
  }
) {
  try {
    if (params.sourceType === "URL" && params.sourceUrl) {
      await processUrlAudit(
        auditId,
        params.sourceUrl,
        params.crawlDepth || 2,
        params.maxPages || 50
      );
    } else if (params.sourceType === "FILE_UPLOAD" && params.file) {
      const arrayBuffer = await params.file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      await processFileAudit(
        auditId,
        buffer,
        params.fileName || params.file.name,
        params.fileType || params.file.type
      );
    } else if (params.sourceType === "FILE_LINK" && params.sourceUrl) {
      await processFileLinkAudit(auditId, params.sourceUrl);
    } else {
      throw new Error("Invalid audit parameters");
    }
  } catch (error) {
    console.error("Error in processAuditAsync:", error);
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

    const userOrgIds = user.memberships?.map((m: { orgId: string }) => m.orgId) || [];
    const brandId = await getBrandIdFromSlug(brandSlug, userOrgIds);

    if (!brandId) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    // Verify brand access
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
    const crawlDepth = formData.get("crawlDepth") ? parseInt(formData.get("crawlDepth") as string) : null;
    const maxPages = formData.get("maxPages") ? parseInt(formData.get("maxPages") as string) : null;
    const file = formData.get("file") as File | null;

    // Create audit record
    const audit = await prisma.audit.create({
      data: {
        brandId,
        sourceType: sourceType as any,
        sourceUrl: sourceUrl || null,
        fileName: fileName || null,
        fileType: fileType || null,
        crawlDepth: crawlDepth || null,
        maxPages: maxPages || null,
        status: "PENDING",
      },
    });

    // Process audit asynchronously
    // Start processing in background (don't await)
    processAuditAsync(audit.id, {
      sourceType,
      sourceUrl,
      fileName,
      fileType,
      crawlDepth,
      maxPages,
      file,
    }).catch((error) => {
      console.error("Error processing audit:", error);
      prisma.audit.update({
        where: { id: audit.id },
        data: { status: "FAILED" },
      }).catch(console.error);
    });

    return NextResponse.json({ 
      auditId: audit.id,
      status: audit.status,
      message: "Audit started. Processing in background..."
    });
  } catch (error) {
    console.error("Error creating audit:", error);
    return NextResponse.json(
      { error: "Failed to start audit", details: error instanceof Error ? error.message : "Unknown error" },
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

    const userOrgIds = user.memberships?.map((m: { orgId: string }) => m.orgId) || [];
    const brandId = await getBrandIdFromSlug(brandSlug, userOrgIds);

    if (!brandId) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    const audits = await prisma.audit.findMany({
      where: { brandId },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        _count: {
          select: { issues: true },
        },
      },
    });

    return NextResponse.json(audits);
  } catch (error) {
    console.error("Error fetching audits:", error);
    return NextResponse.json(
      { error: "Failed to fetch audits" },
      { status: 500 }
    );
  }
}

