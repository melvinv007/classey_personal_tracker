import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/** Cookie name for auth token */
const AUTH_COOKIE_NAME = "classey-auth";

/** Cookie expiration in days */
const COOKIE_EXPIRY_DAYS = 30;

/**
 * Generate auth token from password.
 */
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
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

/**
 * POST /api/auth - Authenticate with password
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { password } = body as { password?: string };

    if (!password) {
      return NextResponse.json(
        { success: false, error: "Password is required" },
        { status: 400 }
      );
    }

    const appPassword = process.env.APP_PASSWORD;

    if (!appPassword) {
      console.error("APP_PASSWORD environment variable is not set");
      return NextResponse.json(
        { success: false, error: "Server configuration error" },
        { status: 500 }
      );
    }

    if (password !== appPassword) {
      return NextResponse.json(
        { success: false, error: "Incorrect password" },
        { status: 401 }
      );
    }

    // Generate auth token and set cookie
    const token = generateAuthToken();
    const response = NextResponse.json({ success: true });

    response.cookies.set(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: COOKIE_EXPIRY_DAYS * 24 * 60 * 60, // 30 days in seconds
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Auth error:", error);
    return NextResponse.json(
      { success: false, error: "Invalid request" },
      { status: 400 }
    );
  }
}

/**
 * DELETE /api/auth - Logout (clear cookie)
 */
export async function DELETE(): Promise<NextResponse> {
  const response = NextResponse.json({ success: true });
  response.cookies.delete(AUTH_COOKIE_NAME);
  return response;
}

/**
 * GET /api/auth - Check auth status
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const authCookie = request.cookies.get(AUTH_COOKIE_NAME);
  const expectedToken = generateAuthToken();

  const isAuthenticated = authCookie?.value === expectedToken;

  return NextResponse.json({ authenticated: isAuthenticated });
}
