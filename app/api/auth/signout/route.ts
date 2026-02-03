import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

// Custom signout handler that clears session properly
export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
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
    
    // Delete session from database if we have the token
    if (sessionToken) {
      try {
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
    
    // Delete cookies
    cookieNames.forEach((name) => {
      cookieStore.delete(name);
    });
    
    // Create response with cleared cookies
    const response = NextResponse.json({ success: true });
    cookieNames.forEach((name) => {
      response.cookies.set(name, "", {
        expires: new Date(0),
        path: "/",
        maxAge: 0,
      });
    });
    
    return response;
  } catch (error) {
    console.error("Signout error:", error);
    
    // Still try to clear cookies
    const cookieStore = await cookies();
    const cookieNames = [
      "next-auth.session-token",
      "__Secure-next-auth.session-token",
      "authjs.session-token",
      "__Secure-authjs.session-token",
    ];
    
    cookieNames.forEach((name) => {
      cookieStore.delete(name);
    });
    
    const response = NextResponse.json({ success: true });
    cookieNames.forEach((name) => {
      response.cookies.set(name, "", {
        expires: new Date(0),
        path: "/",
        maxAge: 0,
      });
    });
    
    return response;
  }
}

export async function GET(req: NextRequest) {
  return POST(req);
}

