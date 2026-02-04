import { prisma } from "@/lib/db";

export async function getBrandBySlug(brandSlug: string, orgId?: string) {
  return prisma.brand.findFirst({
    where: {
      slug: brandSlug,
      ...(orgId ? { orgId } : {}),
    },
  });
}

/**
 * Helper to get brand ID from slug, checking user's orgs first
 * Returns the brand ID if found and user has access, null otherwise
 */
export async function getBrandIdFromSlug(
  brandSlug: string,
  userOrgIds: string[]
): Promise<string | null> {
  // Try user's orgs first
  for (const orgId of userOrgIds) {
    const brand = await getBrandBySlug(brandSlug, orgId);
    if (brand) return brand.id;
  }
  
  // Fallback: try without org filter
  const brand = await getBrandBySlug(brandSlug);
  return brand?.id || null;
}

export async function getBrandWithRules(brandId: string) {
  return prisma.brand.findUnique({
    where: { id: brandId },
    include: {
      rules: {
        where: { status: "ACTIVE" },
        orderBy: { priority: "asc" },
      },
    },
  });
}

export async function getBrandRuleInstances(brandId: string, category?: string) {
  return prisma.rule.findMany({
    where: {
      brandId,
      ...(category ? { category } : {}),
    },
    orderBy: { priority: "asc" },
  });
}
