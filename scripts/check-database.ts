import "dotenv/config";
import { prisma } from "../lib/db";

async function checkDatabase() {
  console.log("=== Database Connection Check ===\n");

  // Check environment variable
  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL is not set in environment variables");
    console.log("\nPlease set DATABASE_URL in your .env file");
    process.exit(1);
  }

  // Mask password in DATABASE_URL for display
  const dbUrl = process.env.DATABASE_URL;
  const maskedUrl = dbUrl.replace(/:[^:@]+@/, ":****@");
  console.log(`✓ DATABASE_URL is set: ${maskedUrl}\n`);

  try {
    console.log("Attempting to connect to database...");
    await prisma.$connect();
    console.log("✓ Database connection successful!\n");

    // Check tables
    console.log("Checking database contents...\n");

    const userCount = await prisma.user.count();
    console.log(`Users: ${userCount}`);

    if (userCount > 0) {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
        },
        take: 5,
      });
      console.log("\nSample users:");
      users.forEach((user, i) => {
        console.log(`  ${i + 1}. ${user.email || "No email"} (${user.name || "No name"}) - ID: ${user.id}`);
      });
      if (userCount > 5) {
        console.log(`  ... and ${userCount - 5} more`);
      }
    }

    const orgCount = await prisma.org.count();
    console.log(`\nOrganizations: ${orgCount}`);

    const sessionCount = await prisma.session.count();
    console.log(`Sessions: ${sessionCount}`);

    const accountCount = await prisma.account.count();
    console.log(`Accounts: ${accountCount}`);

    console.log("\n✓ Database check complete!");
    return true;
  } catch (error) {
    console.error("\n❌ Database connection failed!\n");
    
    if (error instanceof Error) {
      console.error("Error:", error.message);
      
      if (error.message.includes("Can't reach database server")) {
        console.log("\nPossible issues:");
        console.log("1. Database server is not running");
        console.log("2. DATABASE_URL points to wrong host/port");
        console.log("3. Firewall blocking connection");
        console.log("4. Database credentials are incorrect");
      } else if (error.message.includes("authentication failed")) {
        console.log("\nPossible issues:");
        console.log("1. Database username/password is incorrect");
        console.log("2. Database user doesn't have proper permissions");
      } else if (error.message.includes("does not exist")) {
        console.log("\nPossible issues:");
        console.log("1. Database name in DATABASE_URL doesn't exist");
        console.log("2. Need to run migrations: npm run db:migrate");
      }
    }
    
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error("Unexpected error:", error);
    process.exit(1);
  });

