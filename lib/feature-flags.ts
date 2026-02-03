import { prisma } from "@/lib/db";

export async function checkFeatureFlag(
  orgId: string | null,
  brandId: string | null,
  key: string
): Promise<boolean> {
  // Check brand-specific flag first
  if (brandId) {
    const brandFlag = await prisma.featureFlag.findUnique({
      where: {
        orgId_brandId_key: {
          orgId: orgId || "",
          brandId,
          key,
        },
      },
    });

    if (brandFlag) {
      return brandFlag.enabled;
    }
  }

  // Check org-specific flag
  if (orgId) {
    const orgFlag = await prisma.featureFlag.findUnique({
      where: {
        orgId_brandId_key: {
          orgId,
          brandId: brandId || "",
          key,
        },
      },
    });

    if (orgFlag) {
      return orgFlag.enabled;
    }
  }

  // Default: feature is disabled
  return false;
}

export async function setFeatureFlag(
  orgId: string | null,
  brandId: string | null,
  key: string,
  enabled: boolean
) {
  return prisma.featureFlag.upsert({
    where: {
      orgId_brandId_key: {
        orgId: orgId || "",
        brandId: brandId || "",
        key,
      },
    },
    update: {
      enabled,
    },
    create: {
      orgId,
      brandId,
      key,
      enabled,
    },
  });
}

// Common feature flag keys
export const FEATURE_FLAGS = {
  UNLIMITED_REWRITES: "unlimited_rewrites",
  CUSTOM_RULES: "custom_rules",
  RULE_EXPORT: "rule_export",
  MULTIPLE_BRANDS: "multiple_brands",
  TEAM_MEMBERS: "team_members",
  RULE_VERSIONING: "rule_versioning",
} as const;
