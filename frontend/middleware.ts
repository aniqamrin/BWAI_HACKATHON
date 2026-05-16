import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes that require authentication
const protectedRoutes = [
  "/dashboard",
  "/graph",
  "/startups",
  "/mentors",
  "/investors",
  "/programmes",
  "/relationships",
  "/analytics",
  "/admin",
  "/matches",
  "/blueprints",
  "/governance",
  "/cohorts",
  "/outcomes",
  "/analysis",
  "/agent",
];

// Routes only for unauthenticated users
const authRoutes = ["/login", "/register"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("ecosystemos_token")?.value;

  // Check if route needs protection
  const isProtected = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  // Note: Since we use localStorage for tokens (not cookies), this middleware
  // does a lightweight check. Full auth guard is in DashboardLayout client-side.
  // For production, switch to httpOnly cookies.

  if (isAuthRoute && token) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.svg$).*)",
  ],
};
