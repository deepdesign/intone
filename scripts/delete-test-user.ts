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
  const email = "deepdesignuk@gmail.com";

  console.log(`Deleting test user and associated data for ${email}...`);

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
    },
  });

  if (!user) {
    console.log(`User ${email} not found. Nothing to delete.`);
    return;
  }

  console.log(`Found user: ${user.name} (${user.id})`);

  // Delete all orgs and their associated data
  for (const membership of user.memberships) {
    const org = membership.org;
    console.log(`Deleting org: ${org.name} (${org.id})`);
    
    // Delete all brands in this org
    for (const brand of org.brands) {
      console.log(`  Deleting brand: ${brand.name} (${brand.id})`);
    }
    
    // Delete the org (cascade will handle members, brands, etc.)
    await prisma.org.delete({
      where: { id: org.id },
    });
  }

  // Delete user accounts and sessions
  await prisma.account.deleteMany({
    where: { userId: user.id },
  });

  await prisma.session.deleteMany({
    where: { userId: user.id },
  });

  // Finally delete the user
  await prisma.user.delete({
    where: { id: user.id },
  });

  console.log(`\n✅ Test account deleted successfully!`);
  console.log(`You can now sign up fresh with ${email} using Google OAuth.`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

