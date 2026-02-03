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
  console.log("Fetching all users from database...\n");
  
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      emailVerified: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (users.length === 0) {
    console.log("No users found in database.");
  } else {
    console.log(`Found ${users.length} user(s):\n`);
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email || "No email"}`);
      console.log(`   Name: ${user.name || "No name"}`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Verified: ${user.emailVerified ? "Yes" : "No"}`);
      console.log(`   Created: ${user.createdAt.toISOString()}`);
      console.log("");
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("Error:", e);
    await prisma.$disconnect();
    process.exit(1);
  });

