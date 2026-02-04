import { NextRequest, NextResponse } from "next/server";

// Use Node.js runtime for Prisma adapter
export const runtime = "nodejs";

// Import handlers with error handling
let handlers: { GET?: any; POST?: any } | undefined;
let authLoadError: string | undefined;

try {
  const authModule = require("@/auth");
  handlers = authModule.handlers;
} catch (error) {
  authLoadError = error instanceof Error ? error.message : String(error);
  console.error("Failed to import NextAuth handlers:", error);
}

// Error handler function - include load error in response for debugging (server logs have full stack)
async function handleError(req: NextRequest) {
  const message = authLoadError
    ? `NextAuth failed to load: ${authLoadError}. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and AUTH_SECRET in your environment.`
    : "NextAuth is not properly configured. Check server logs for details.";
  return NextResponse.json(
    {
      error: "Authentication configuration error",
      message,
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