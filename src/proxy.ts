import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/** Cookie name for auth token */
const AUTH_COOKIE_NAME = "classey-auth";

/** Paths that don't require authentication */
const PUBLIC_PATHS = ["/login", "/api/auth", "/api/telegram"];

/**
 * Proxy to protect routes with password authentication.
 * Checks for valid auth cookie on every request.
 */
export function proxy(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;

  // Allow public paths
  if (PUBLIC_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Allow static files and Next.js internals
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Check for auth cookie
  const authCookie = request.cookies.get(AUTH_COOKIE_NAME);

  if (!authCookie?.value) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const expectedToken = generateAuthToken();
  if (authCookie.value !== expectedToken) {
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete(AUTH_COOKIE_NAME);
    return response;
  }

  return NextResponse.next();
}

function generateAuthToken(): string {
  const password = process.env.APP_PASSWORD;
  const secret = process.env.AUTH_COOKIE_SECRET;

  if (!password || !secret) {
    return "";
  }

  const combined = `${password}:${secret}`;
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash &= hash;
  }
  return Math.abs(hash).toString(36);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\..*|api/auth|api/telegram).*)",
  ],
};

