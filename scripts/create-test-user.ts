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
  const name = "James Cutts";
  const orgName = "Deep Design";

  console.log("Creating test user and organization...");

  // Check if user already exists
  let user = await prisma.user.findUnique({
    where: { email },
  });

  if (user) {
    console.log(`User ${email} already exists. Updating name...`);
    user = await prisma.user.update({
      where: { email },
      data: { name },
    });
  } else {
    console.log(`Creating user ${email}...`);
    user = await prisma.user.create({
      data: {
        email,
        name,
        emailVerified: new Date(),
      },
    });
  }

  // Check if org already exists for this user
  const existingMembership = await prisma.member.findFirst({
    where: {
      userId: user.id,
      org: {
        name: orgName,
      },
    },
    include: {
      org: true,
    },
  });

  if (existingMembership) {
    console.log(`Organization "${orgName}" already exists for this user.`);
    console.log(`User ID: ${user.id}`);
    console.log(`Org ID: ${existingMembership.org.id}`);
  } else {
    // Create org
    const orgSlug = orgName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    console.log(`Creating organization "${orgName}"...`);
    
    const org = await prisma.org.create({
      data: {
        name: orgName,
        slug: orgSlug,
        members: {
          create: {
            userId: user.id,
            role: "owner",
          },
        },
      },
    });

    console.log(`Organization created successfully!`);
    console.log(`User ID: ${user.id}`);
    console.log(`Org ID: ${org.id}`);
  }

  console.log("\n✅ Test account created successfully!");
  console.log(`Email: ${email}`);
  console.log(`Name: ${name}`);
  console.log(`Organization: ${orgName}`);
  console.log(`\nNote: Since you're using Google OAuth, sign in with Google using ${email} to link this account.`);
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

