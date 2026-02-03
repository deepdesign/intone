import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, hasBrandAccess } from "@/lib/auth";
import { getBrandIdFromSlug } from "@/lib/db/brand";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import sharp from "sharp";

export const runtime = "nodejs";

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

    // Check brand access
    const hasAccess = await hasBrandAccess(user.id, brandId);
    if (!hasAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const type = formData.get("type") as string; // "font" or "logo"

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedFontTypes = [".woff2", ".woff", ".ttf", ".otf"];
    const allowedLogoTypes = [".svg", ".png"];
    const fileName = file.name.toLowerCase();
    const extension = fileName.substring(fileName.lastIndexOf("."));

    if (type === "font" && !allowedFontTypes.includes(extension)) {
      return NextResponse.json(
        { error: `Invalid font file type. Allowed: ${allowedFontTypes.join(", ")}` },
        { status: 400 }
      );
    }

    if (type === "logo" && !allowedLogoTypes.includes(extension)) {
      return NextResponse.json(
        { error: `Invalid logo file type. Allowed: ${allowedLogoTypes.join(", ")}` },
        { status: 400 }
      );
    }

    // Create upload directory structure
    const uploadDir = join(process.cwd(), "public", "uploads", "brands", brandId, type);
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Generate unique filename
    const uniqueId = crypto.randomUUID();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const newFileName = `${uniqueId}-${sanitizedName}`;
    const filePath = join(uploadDir, newFileName);

    // Write file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Return file URL (relative to public directory)
    const fileUrl = `/uploads/brands/${brandId}/${type}/${newFileName}`;

    const responseData: any = {
      fileUrl,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type || extension.substring(1),
    };

    // Extract image dimensions for logos
    if (type === "logo" && (extension === ".png" || extension === ".svg")) {
      try {
        const image = sharp(buffer);
        const metadata = await image.metadata();
        if (metadata.width && metadata.height) {
          responseData.width = metadata.width;
          responseData.height = metadata.height;
        }
      } catch (error) {
        console.error("Error extracting image dimensions:", error);
        // Continue without dimensions
      }
    }

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}

