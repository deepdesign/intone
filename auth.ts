import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

// Import Prisma adapter and client
// Use dynamic require to avoid bundling issues in Edge runtime
let PrismaAdapter: any;
let prisma: any;

// Lazy load Prisma modules only when needed (in Node.js runtime)
function getPrismaModules() {
  // Check if we're in Edge runtime FIRST - don't even try to import
  // @ts-ignore - EdgeRuntime is a global in Edge runtime
  if (typeof EdgeRuntime !== "undefined" || typeof window !== "undefined") {
    return null;
  }
  
  if (PrismaAdapter && prisma) {
    return { PrismaAdapter, prisma };
  }
  
    try {
      // Use dynamic import with proper path resolution
      // Try path alias first (more reliable in Next.js)
      let dbModule;
      try {
        // Try path alias first (works better with Next.js module resolution)
        dbModule = require("@/lib/db");
      } catch (e1) {
        try {
          // Fall back to relative path (auth.ts is in root, so lib/db is in same directory level)
          dbModule = require("./lib/db");
        } catch (e2) {
          // Silently fail - this is expected in Edge runtime
          return null;
        }
      }
    
    prisma = dbModule.prisma;
    
    if (!prisma) {
      console.error("Prisma client is undefined after import");
      return null;
    }
    
    // Import Prisma adapter
    const prismaAdapterModule = require("@auth/prisma-adapter");
    PrismaAdapter = prismaAdapterModule.PrismaAdapter || prismaAdapterModule.default;
    
    return { PrismaAdapter, prisma };
  } catch (importError) {
    console.error("Could not import Prisma modules:", importError);
    return null;
  }
}

// Conditionally create Prisma adapter only in Node.js runtime
// Use a factory function that's only called when needed
function createAdapter() {
  // Check if we're in Edge runtime - if so, return undefined
  // @ts-ignore - EdgeRuntime is a global in Edge runtime
  if (typeof EdgeRuntime !== "undefined") {
    console.log("Edge runtime detected, skipping adapter creation");
    return undefined;
  }
  
  try {
    console.log("Creating Prisma adapter...");
    
    // Check DATABASE_URL first
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL environment variable is not set");
    }
    console.log("DATABASE_URL is set");
    
    // Get Prisma modules (lazy load)
    const modules = getPrismaModules();
    if (!modules) {
      console.log("Prisma modules not available, skipping adapter creation");
      return undefined;
    }
    
    const { PrismaAdapter: Adapter, prisma: prismaClient } = modules;
    
    // Verify prisma client is actually initialized
    if (!prismaClient || typeof prismaClient.$connect !== "function") {
      throw new Error("Prisma client is not properly initialized");
    }
    
    console.log("Prisma client is available");
    
    // Test database connection before creating adapter (non-blocking)
    prismaClient.$connect().then(() => {
      console.log("Database connection test successful");
    }).catch((connError: any) => {
      console.error("Database connection test failed:", connError?.message || connError);
      // Don't throw here - let the adapter creation proceed
      // The actual error will surface when NextAuth tries to use it
    });
    
    const adapter = Adapter(prismaClient);
    console.log("Prisma adapter created successfully");
    return adapter;
  } catch (error) {
    console.error("=== ERROR CREATING PRISMA ADAPTER ===");
    console.error("Error type:", error?.constructor?.name);
    console.error("Error message:", error instanceof Error ? error.message : String(error));
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack trace");
    console.error("Full error:", error);
    console.error("=====================================");
    // Return undefined instead of throwing - allow NextAuth to continue with JWT sessions
    console.warn("Falling back to JWT sessions (no database adapter)");
    return undefined;
  }
}

// Validate required environment variables at runtime; skip throwing during Next.js build
// so build can complete (Hostinger build has no .env; runtime does).
const isBuild = typeof process.env.NEXT_PHASE !== "undefined" && process.env.NEXT_PHASE === "phase-production-build";
if (!isBuild) {
  console.log("Validating NextAuth configuration...");
  if (!process.env.GOOGLE_CLIENT_ID) {
    console.error("ERROR: GOOGLE_CLIENT_ID is not set");
    throw new Error("GOOGLE_CLIENT_ID is not set");
  }
  if (!process.env.GOOGLE_CLIENT_SECRET) {
    console.error("ERROR: GOOGLE_CLIENT_SECRET is not set");
    throw new Error("GOOGLE_CLIENT_SECRET is not set");
  }
  if (!process.env.AUTH_SECRET && !process.env.NEXTAUTH_SECRET) {
    console.error("ERROR: AUTH_SECRET or NEXTAUTH_SECRET must be set");
    throw new Error("AUTH_SECRET or NEXTAUTH_SECRET must be set");
  }
  console.log("Environment variables validated successfully");
}
const authSecret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || (isBuild ? "build-placeholder-secret" : undefined);

console.log("Initializing NextAuth...");
let adapter;
try {
  adapter = createAdapter();
  console.log("Adapter created successfully");
} catch (adapterError) {
  console.error("CRITICAL: Failed to create adapter during initialization:", adapterError);
  console.error("NextAuth will continue without adapter, but database sessions will not work.");
  console.error("This is likely a database connection issue. Check your DATABASE_URL.");
  // Don't throw - allow NextAuth to initialize without adapter
  // This will use JWT sessions instead of database sessions
  adapter = undefined;
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: adapter,
  secret: authSecret ?? "build-placeholder-secret",
  trustHost: true, // Required for NextAuth v5 in development
  basePath: "/api/auth", // Explicit base path for auth routes
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID || (isBuild ? "build-placeholder" : ""),
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || (isBuild ? "build-placeholder" : ""),
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
  ],
  pages: {
    signIn: "/login",
    signOut: "/",
    error: "/login",
  },
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === "production" 
        ? "__Secure-authjs.session-token" 
        : "authjs.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  callbacks: {
    async redirect({ url, baseUrl }) {
      console.log("Redirect callback called:", { url, baseUrl });
      
      // If callbackUrl was provided and is valid, use it
      if (url) {
        // Handle relative URLs
        if (url.startsWith("/")) {
          const fullUrl = `${baseUrl}${url}`;
          console.log("Redirecting to relative URL:", fullUrl);
          return fullUrl;
        }
        
        // Handle absolute URLs on same origin
        try {
          const urlObj = new URL(url);
          if (urlObj.origin === baseUrl) {
            // Don't redirect to login/signup pages after successful auth
            if (urlObj.pathname === "/login" || urlObj.pathname === "/signup") {
              const dashboardUrl = `${baseUrl}/app/dashboard`;
              console.log("Preventing redirect to login/signup, going to dashboard:", dashboardUrl);
              return dashboardUrl;
            }
            console.log("Redirecting to same-origin URL:", url);
            return url;
          }
        } catch (e) {
          // Invalid URL, fall through to default
        }
      }
      
      // Default: always redirect to dashboard after successful auth
      const dashboardUrl = `${baseUrl}/app/dashboard`;
      console.log("Redirecting to default dashboard:", dashboardUrl);
      return dashboardUrl;
    },
    async session({ session, user, token }) {
      // With database sessions, user is passed to the callback
      if (user) {
        session.user.id = user.id;
      } else if (session.user) {
        // Fallback: try to get user ID from token or database
        // This handles both database and JWT sessions
        try {
          const { prisma } = require("@/lib/db");
          
          // First, try to get ID from token (JWT sessions)
          if (token && (token as any).sub) {
            (session.user as any).id = (token as any).sub;
          }
          
          // If still no ID, try to find user by email
          if (!(session.user as any).id && session.user.email) {
            const dbUser = await prisma.user.findUnique({
              where: { email: session.user.email },
            });
            if (dbUser) {
              (session.user as any).id = dbUser.id;
            }
          }
        } catch (error) {
          console.warn("Session callback: Could not look up user:", error);
        }
      }
      return session;
    },
    async signIn({ user, account, profile }) {
      console.log("SignIn callback called:", { 
        userId: user?.id, 
        email: user?.email,
        accountProvider: account?.provider,
        accountId: account?.providerAccountId,
      });
      
      // The PrismaAdapter will automatically:
      // 1. Create or link the Account record
      // 2. Create or find the User by email
      // 3. Create a Session record
      
      // Note: We no longer auto-create organizations. Users must complete onboarding.
      console.log("SignIn callback returning true");
      return true;
    },
    async jwt({ token, user, account }) {
      // When user signs in, add user ID to token
      if (user) {
        token.sub = user.id;
        token.email = user.email;
      }
      return token;
    },
  },
  session: {
    // Use database strategy if adapter is available, otherwise fall back to JWT
    strategy: adapter ? "database" : "jwt",
  },
});

// Verify NextAuth initialized correctly
if (!handlers || !auth) {
  console.error("CRITICAL: NextAuth failed to initialize!");
  console.error("Handlers:", handlers);
  console.error("Auth:", auth);
} else {
  console.log("NextAuth initialized successfully");
}
