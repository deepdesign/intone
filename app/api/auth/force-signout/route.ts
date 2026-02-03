import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    // Get all cookies
    const cookieStore = await cookies();
    
    // Delete all session-related cookies
    const cookieNames = [
      "next-auth.session-token",
      "__Secure-next-auth.session-token",
      "authjs.session-token",
      "__Secure-authjs.session-token",
    ];
    
    // Get session token before deleting
    let sessionToken: string | undefined;
    for (const name of cookieNames) {
      const cookie = cookieStore.get(name);
      if (cookie?.value) {
        sessionToken = cookie.value;
        break;
      }
    }
    
    // Delete cookies
    cookieNames.forEach((name) => {
      cookieStore.delete(name);
    });
    
    // Also try to delete session from database if we can get the session token
    if (sessionToken) {
      try {
        // Lazy load to avoid Edge runtime issues
        const { prisma } = await import("@/lib/db");
        await prisma.session.deleteMany({
          where: {
            sessionToken: sessionToken,
          },
        });
      } catch (dbError) {
        console.error("Error deleting session from database:", dbError);
        // Continue anyway
      }
    }
    
    // Create response with cleared cookies
    const response = NextResponse.json({ success: true });
    
    // Also set cookies to expire in the response headers
    cookieNames.forEach((name) => {
      response.cookies.set(name, "", {
        expires: new Date(0),
        path: "/",
      });
      // Also try secure version
      response.cookies.set(name.replace("next-auth", "__Secure-next-auth"), "", {
        expires: new Date(0),
        path: "/",
        secure: true,
      });
    });
    
    return response;
  } catch (error) {
    console.error("Force signout error:", error);
    return NextResponse.json(
      { error: "Failed to sign out" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  // Allow GET for easy testing
  return POST(req);
}

