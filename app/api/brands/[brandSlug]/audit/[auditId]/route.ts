import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const ISSUE_STATUSES = ["PENDING", "REVIEWED", "FIXED", "IGNORED"] as const;
type IssueStatus = (typeof ISSUE_STATUSES)[number];
import { getCurrentUser } from "@/lib/auth";
import { getBrandIdFromSlug } from "@/lib/db/brand";

export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ brandSlug: string; auditId: string }> }
) {
  try {
    const { brandSlug, auditId } = await params;
    const user = await getCurrentUser(req);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userOrgIds = user.memberships?.map((m: { orgId: string }) => m.orgId) || [];
    const brandId = await getBrandIdFromSlug(brandSlug, userOrgIds);

    if (!brandId) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    const audit = await prisma.audit.findUnique({
      where: { 
        id: auditId,
        brandId, // Ensure audit belongs to brand
      },
      include: {
        issues: {
          include: {
            rule: {
              select: {
                id: true,
                name: true,
                category: true,
                type: true,
              },
            },
          },
          orderBy: [
            { severity: "desc" },
            { createdAt: "desc" },
          ],
        },
        _count: {
          select: { issues: true },
        },
      },
    });

    if (!audit) {
      return NextResponse.json({ error: "Audit not found" }, { status: 404 });
    }

    // Calculate metrics
    const issuesByCategory: Record<string, number> = {};
    const issuesBySeverity: Record<string, number> = {};
    let totalIssues = audit.issues.length;

    audit.issues.forEach((issue) => {
      const category = issue.category || "other";
      issuesByCategory[category] = (issuesByCategory[category] || 0) + 1;
      issuesBySeverity[issue.severity] = (issuesBySeverity[issue.severity] || 0) + 1;
    });

    // Calculate overall score (0-100, higher is better)
    // Score = 100 - (critical * 10 + major * 5 + minor * 2 + info * 1) / totalPages
    const totalPages = audit.totalPages || 1;
    const criticalCount = issuesBySeverity.CRITICAL || 0;
    const majorCount = issuesBySeverity.MAJOR || 0;
    const minorCount = issuesBySeverity.MINOR || 0;
    const infoCount = issuesBySeverity.INFO || 0;
    
    const penaltyScore = (criticalCount * 10 + majorCount * 5 + minorCount * 2 + infoCount * 1) / totalPages;
    const overallScore = Math.max(0, Math.min(100, 100 - penaltyScore));

    // Calculate compliance percentage
    const compliancePercentage = totalIssues === 0 ? 100 : Math.max(0, 100 - (totalIssues / totalPages) * 10);

    return NextResponse.json({
      ...audit,
      overallScore,
      compliancePercentage,
      issuesByCategory,
      issuesBySeverity,
      totalIssues,
    });
  } catch (error) {
    console.error("Error fetching audit:", error);
    return NextResponse.json(
      { error: "Failed to fetch audit" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ brandSlug: string; auditId: string }> }
) {
  try {
    const { brandSlug, auditId } = await params;
    const user = await getCurrentUser(req);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userOrgIds = user.memberships?.map((m: { orgId: string }) => m.orgId) || [];
    const brandId = await getBrandIdFromSlug(brandSlug, userOrgIds);

    if (!brandId) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    const body = await req.json();
    const { issueId, status, notes } = body;

    if (issueId) {
      if (typeof status !== "string" || !ISSUE_STATUSES.includes(status as IssueStatus)) {
        return NextResponse.json(
          { error: "Invalid status" },
          { status: 400 }
        );
      }

      // Update issue status
      const updateData: {
        status: IssueStatus;
        updatedAt: Date;
        reviewedAt?: Date;
        fixedAt?: Date;
        notes?: string;
      } = {
        status: status as IssueStatus,
        updatedAt: new Date(),
      };

      if (status === "REVIEWED") {
        updateData.reviewedAt = new Date();
      } else if (status === "FIXED") {
        updateData.fixedAt = new Date();
      }

      if (notes !== undefined) {
        updateData.notes = notes;
      }

      const issue = await prisma.auditIssue.update({
        where: {
          id: issueId,
          audit: {
            id: auditId,
            brandId,
          },
        },
        data: updateData,
      });

      return NextResponse.json(issue);
    }

    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  } catch (error) {
    console.error("Error updating audit issue:", error);
    return NextResponse.json(
      { error: "Failed to update issue" },
      { status: 500 }
    );
  }
}

