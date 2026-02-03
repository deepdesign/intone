import { NextRequest, NextResponse } from "next/server";

// Use Node.js runtime for Prisma adapter
export const runtime = "nodejs";

// Import handlers with error handling
let handlers: { GET?: any; POST?: any } | undefined;

try {
  const authModule = require("@/auth");
  handlers = authModule.handlers;
} catch (error) {
  console.error("Failed to import NextAuth handlers:", error);
}

// Error handler function
async function handleError(req: NextRequest) {
  return NextResponse.json(
    { 
      error: "Authentication configuration error",
      message: "NextAuth is not properly configured. Check server logs for details."
    },
    { status: 500 }
  );
}

// Export handlers - use error handler if handlers are undefined
export async function GET(req: NextRequest) {
  if (!handlers || !handlers.GET) {
    console.error("NextAuth GET handler is undefined - configuration error!");
    return handleError(req);
  }
  return handlers.GET(req);
}

export async function POST(req: NextRequest) {
  if (!handlers || !handlers.POST) {
    console.error("NextAuth POST handler is undefined - configuration error!");
    return handleError(req);
  }
  return handlers.POST(req);
}