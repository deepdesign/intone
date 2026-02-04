import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import type { NextRequest } from "next/server";
import { cookies, headers } from "next/headers";
import { cache } from "react";

// Cache user lookup within a single request to avoid duplicate queries
const getCachedUserInternal = cache(async (email: string) => {
  return await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      memberships: {
        select: {
          id: true,
          role: true,
          orgId: true,
          org: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      },
    },
  });
});

// Optimized: Single query with email-first lookup (most reliable)
export async function getCurrentUser(req?: NextRequest) {
  try {
    let session;
    
    try {
      session = await auth();
    } catch (authError) {
      // Silently fail - no session
      return null;
    }
    
    if (!session?.user?.email) {
      return null;
    }

    // Use cached lookup to avoid duplicate queries in same request
    return await getCachedUserInternal(session.user.email);
  } catch (error) {
    console.error("getCurrentUser: Error:", error);
    return null;
  }
}

export async function getUserOrgs(userId: string) {
  const memberships = await prisma.member.findMany({
    where: { userId },
    include: {
      org: {
        include: {
          brands: true,
        },
      },
    },
  });

  return memberships.map((m: { org: { id: string; name: string; slug: string; brands: unknown[] } }) => m.org);
}

export async function getUserBrands(userId: string) {
  const memberships = await prisma.member.findMany({
    where: { userId },
    include: {
      org: {
        include: {
          brands: true,
        },
      },
    },
  });

  return memberships.flatMap((m: { org: { brands: unknown[] } }) => m.org.brands);
}

export async function hasOrgAccess(userId: string, orgId: string): Promise<boolean> {
  const member = await prisma.member.findUnique({
    where: {
      orgId_userId: {
        orgId,
        userId,
      },
    },
  });

  return !!member;
}

// Cache brand access check to avoid duplicate queries
const getCachedBrand = cache(async (brandId: string) => {
  return await prisma.brand.findFirst({
    where: { id: brandId },
    select: { id: true, orgId: true },
  });
});

// Optimized: Accepts userOrgIds to reuse data from getCurrentUser
export async function hasBrandAccess(userId: string, brandId: string, userOrgIds?: string[]): Promise<boolean> {
  // Use cached brand lookup
  const brand = await getCachedBrand(brandId);
  if (!brand) {
    return false;
  }

  // If userOrgIds provided, use them (no query needed)
  if (userOrgIds && userOrgIds.length > 0) {
    return userOrgIds.includes(brand.orgId);
  }

  // Fallback: check membership (only if orgIds not provided)
  const member = await prisma.member.findFirst({
    where: {
      userId,
      orgId: brand.orgId,
    },
    select: { id: true },
  });

  return !!member;
}

export async function getOrgRole(userId: string, orgId: string): Promise<string | null> {
  const member = await prisma.member.findUnique({
    where: {
      orgId_userId: {
        orgId,
        userId,
      },
    },
  });

  return member?.role ?? null;
}
