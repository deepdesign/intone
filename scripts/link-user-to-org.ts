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
  const orgName = "Deep Design";

  console.log(`Linking user ${email} to organization "${orgName}"...`);

  // Find user by email
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    console.error(`User with email ${email} not found!`);
    console.log("Please sign in with Google OAuth first, or run 'npm run create-test-user' to create the user.");
    process.exit(1);
  }

  console.log(`Found user: ${user.name} (${user.id})`);

  // Check if org exists
  let org = await prisma.org.findFirst({
    where: { name: orgName },
  });

  if (!org) {
    // Create org
    const orgSlug = orgName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    console.log(`Creating organization "${orgName}"...`);
    org = await prisma.org.create({
      data: {
        name: orgName,
        slug: orgSlug,
      },
    });
    console.log(`Organization created: ${org.id}`);
  } else {
    console.log(`Organization found: ${org.id}`);
  }

  // Check if user is already a member
  const existingMembership = await prisma.member.findUnique({
    where: {
      orgId_userId: {
        orgId: org.id,
        userId: user.id,
      },
    },
  });

  if (existingMembership) {
    console.log(`User is already a member of "${orgName}" with role: ${existingMembership.role}`);
  } else {
    // Create membership
    console.log(`Adding user to organization...`);
    await prisma.member.create({
      data: {
        orgId: org.id,
        userId: user.id,
        role: "owner",
      },
    });
    console.log(`✅ User successfully linked to "${orgName}" as owner!`);
  }

  console.log("\n✅ Complete!");
  console.log(`User: ${user.name} (${user.email})`);
  console.log(`Organization: ${org.name} (${org.slug})`);
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

