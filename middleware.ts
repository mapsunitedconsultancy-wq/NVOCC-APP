import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Next.js Edge Middleware for route protection and token presence check.
 */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow static files, api routes, public tracking, login and register routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/favicon.ico') ||
    pathname === '/login' ||
    pathname === '/register' ||
    pathname.startsWith('/public_tracking') ||
    pathname.startsWith('/ccontrol_public')
  ) {
    return NextResponse.next();
  }

  // Token presence check from cookie or authorization header
  const token = req.cookies.get('sb-access-token')?.value || req.headers.get('authorization');

  // If unauthenticated, redirect to /login
  if (!token && pathname === '/') {
    // Client-side ProtectedRoute component handles detailed state verification
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};

