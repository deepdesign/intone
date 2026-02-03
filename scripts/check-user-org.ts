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
  log: ["error", "warn"],
});

async function main() {
  const email = "deepdesignuk@gmail.com";

  console.log(`Checking user and organization status for ${email}...\n`);

  // Find all users with this email (should only be one)
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      accounts: true,
      memberships: {
        include: {
          org: true,
        },
      },
    },
  });

  if (!user) {
    console.log(`❌ No user found with email ${email}`);
    console.log("\nPlease sign in with Google OAuth first.");
    return;
  }

  console.log(`✅ User found:`);
  console.log(`   ID: ${user.id}`);
  console.log(`   Name: ${user.name}`);
  console.log(`   Email: ${user.email}`);
  console.log(`   Email Verified: ${user.emailVerified ? "Yes" : "No"}`);

  if (user.accounts.length > 0) {
    console.log(`\n📱 OAuth Accounts:`);
    user.accounts.forEach((account) => {
      console.log(`   Provider: ${account.provider}`);
      console.log(`   Provider Account ID: ${account.providerAccountId}`);
    });
  } else {
    console.log(`\n⚠️  No OAuth accounts linked. Sign in with Google to link.`);
  }

  if (user.memberships.length > 0) {
    console.log(`\n🏢 Organizations:`);
    user.memberships.forEach((membership) => {
      console.log(`   - ${membership.org.name} (${membership.org.slug})`);
      console.log(`     Role: ${membership.role}`);
      console.log(`     Org ID: ${membership.org.id}`);
    });
  } else {
    console.log(`\n❌ User is not a member of any organizations.`);
    console.log(`\nRun 'npx tsx scripts/link-user-to-org.ts' to link to "Deep Design".`);
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
    await pool.end();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    await pool.end();
    process.exit(1);
  });

