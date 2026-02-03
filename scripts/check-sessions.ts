import "dotenv/config";
import { prisma } from "../lib/db";

async function checkSessions() {
  console.log("=== Checking Sessions and Accounts ===\n");

  try {
    await prisma.$connect();

    // Check sessions
    const sessions = await prisma.session.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
      orderBy: {
        expires: "desc",
      },
    });

    console.log(`Found ${sessions.length} sessions:\n`);
    
    if (sessions.length === 0) {
      console.log("⚠ No sessions found in database.");
      console.log("This means you're likely using JWT sessions (stored in cookies).\n");
    } else {
      sessions.forEach((session, i) => {
        const isExpired = new Date(session.expires) < new Date();
        console.log(`${i + 1}. Session ID: ${session.id}`);
        console.log(`   User: ${session.user.email} (${session.user.name})`);
        console.log(`   Expires: ${session.expires.toISOString()}`);
        console.log(`   Status: ${isExpired ? "❌ EXPIRED" : "✓ Active"}\n`);
      });
    }

    // Check accounts
    const accounts = await prisma.account.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    console.log(`Found ${accounts.length} accounts:\n`);
    
    if (accounts.length === 0) {
      console.log("⚠ No accounts found in database.");
      console.log("This might explain authentication issues.\n");
    } else {
      accounts.forEach((account, i) => {
        console.log(`${i + 1}. Provider: ${account.provider} (${account.type})`);
        console.log(`   User: ${account.user.email} (${account.user.name})`);
        console.log(`   Provider Account ID: ${account.providerAccountId}\n`);
      });
    }

    // Check users
    const users = await prisma.user.findMany({
      include: {
        accounts: true,
        sessions: true,
      },
    });

    console.log(`\n=== User Summary ===\n`);
    users.forEach((user) => {
      console.log(`User: ${user.email} (${user.name})`);
      console.log(`  ID: ${user.id}`);
      console.log(`  Accounts: ${user.accounts.length}`);
      console.log(`  Sessions: ${user.sessions.length}`);
      console.log(`  Created: ${user.createdAt.toISOString()}\n`);
    });

    await prisma.$disconnect();
    console.log("✓ Check complete!");
  } catch (error) {
    console.error("Error:", error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

checkSessions();

