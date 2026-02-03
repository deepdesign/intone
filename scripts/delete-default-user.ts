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
  const email = "user@example.com";

  console.log(`Deleting default user and associated data for ${email}...`);

  // Find user
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      memberships: {
        include: {
          org: {
            include: {
              brands: true,
            },
          },
        },
      },
      accounts: true,
      sessions: true,
    },
  });

  if (!user) {
    console.log(`User ${email} not found. Nothing to delete.`);
    return;
  }

  console.log(`Found user: ${user.name || "No name"} (${user.id})`);
  console.log(`  Accounts: ${user.accounts.length}`);
  console.log(`  Sessions: ${user.sessions.length}`);
  console.log(`  Memberships: ${user.memberships.length}`);

  // Delete all orgs and their associated data
  for (const membership of user.memberships) {
    const org = membership.org;
    console.log(`\nDeleting org: ${org.name} (${org.id})`);
    
    // Delete all brands in this org
    for (const brand of org.brands) {
      console.log(`  Deleting brand: ${brand.name} (${brand.id})`);
    }
    
    // Delete the org (cascade will handle members, brands, rules, etc.)
    await prisma.org.delete({
      where: { id: org.id },
    });
    console.log(`  ✓ Org deleted`);
  }

  // Delete user accounts
  if (user.accounts.length > 0) {
    console.log(`\nDeleting ${user.accounts.length} account(s)...`);
    await prisma.account.deleteMany({
      where: { userId: user.id },
    });
    console.log(`  ✓ Accounts deleted`);
  }

  // Delete user sessions
  if (user.sessions.length > 0) {
    console.log(`\nDeleting ${user.sessions.length} session(s)...`);
    await prisma.session.deleteMany({
      where: { userId: user.id },
    });
    console.log(`  ✓ Sessions deleted`);
  }

  // Finally delete the user
  console.log(`\nDeleting user...`);
  await prisma.user.delete({
    where: { id: user.id },
  });

  console.log(`\n✅ Default account (${email}) deleted successfully!`);
  console.log(`All associated data has been removed.`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("Error deleting user:", e);
    await prisma.$disconnect();
    process.exit(1);
  });

