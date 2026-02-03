import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL environment variable is not set!");
  process.exit(1);
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
  log: ["query", "error", "warn"],
});

async function main() {
  console.log("Fetching all organizations...\n");

  const orgs = await prisma.org.findMany({
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
      },
      brands: true,
    },
  });

  if (orgs.length === 0) {
    console.log("No organizations found. Nothing to delete.");
    return;
  }

  console.log(`Found ${orgs.length} organization(s):\n`);
  orgs.forEach((org, index) => {
    console.log(`${index + 1}. ${org.name} (${org.slug})`);
    console.log(`   ID: ${org.id}`);
    console.log(`   Members: ${org.members.length}`);
    console.log(`   Brands: ${org.brands.length}`);
    if (org.members.length > 0) {
      console.log(`   Member details:`);
      org.members.forEach((member) => {
        console.log(`     - ${member.user.name || "No name"} (${member.user.email || "No email"}) - Role: ${member.role}`);
      });
    }
    if (org.brands.length > 0) {
      console.log(`   Brands:`);
      org.brands.forEach((brand) => {
        console.log(`     - ${brand.name} (${brand.slug})`);
      });
    }
    console.log("");
  });

  console.log(`\n⚠️  WARNING: This will delete ALL ${orgs.length} organization(s) and ALL associated data:`);
  orgs.forEach((org) => {
    console.log(`  - ${org.name}: ${org.members.length} member(s), ${org.brands.length} brand(s)`);
  });
  console.log(`\nThis includes all brands, rules, documents, lint results, and other related data.`);
  console.log(`\nProceeding with deletion...\n`);

  // Delete all orgs (cascade will handle members, brands, rules, documents, lintResults, etc.)
  for (const org of orgs) {
    console.log(`Deleting "${org.name}"...`);
    await prisma.org.delete({
      where: { id: org.id },
    });
    console.log(`  ✅ Deleted "${org.name}"`);
  }

  console.log(`\n✅ All organizations and associated data deleted successfully!`);
  console.log(`\nAll data has been removed from the database.`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("Error deleting organizations:", e);
    await prisma.$disconnect();
    process.exit(1);
  });

