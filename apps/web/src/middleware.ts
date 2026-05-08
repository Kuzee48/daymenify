import { type NextRequest, NextResponse } from 'next/server';

// Routes that require authentication
const protectedPaths = ['/dashboard', '/admin'];

// Routes only accessible when NOT authenticated
const authPaths = ['/login', '/register', '/forgot-password'];

// Admin-only routes
const adminPaths = ['/admin'];

/**
 * Parse the auth token from cookies or authorization header.
 * In production, you'd validate the JWT here or use a session cookie.
 */
function getAuthFromRequest(request: NextRequest): {
  isAuthenticated: boolean;
  role?: string;
} {
  // Check for auth cookie (set after login)
  const authCookie = request.cookies.get('daymenify_session');
  const roleCookie = request.cookies.get('daymenify_role');

  if (authCookie?.value) {
    return {
      isAuthenticated: true,
      role: roleCookie?.value || 'CUSTOMER',
    };
  }

  // Fallback: check Authorization header (for API-authenticated sessions)
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    // In production, you'd validate the JWT token here
    return {
      isAuthenticated: true,
      role: 'CUSTOMER',
    };
  }

  return { isAuthenticated: false };
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const { isAuthenticated, role } = getAuthFromRequest(request);

  // Check if current path is protected
  const isProtectedPath = protectedPaths.some((path) =>
    pathname.startsWith(path)
  );

  // Check if current path is an auth page
  const isAuthPath = authPaths.some((path) => pathname.startsWith(path));

  // Check if current path is admin-only
  const isAdminPath = adminPaths.some((path) => pathname.startsWith(path));

  // Redirect unauthenticated users away from protected pages
  if (isProtectedPath && !isAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users away from auth pages
  if (isAuthPath && isAuthenticated) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Restrict admin routes to admin/super_admin roles only
  if (isAdminPath && isAuthenticated) {
    const allowedRoles = ['ADMIN', 'SUPER_ADMIN'];
    if (!role || !allowedRoles.includes(role)) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  // Add security headers
  const response = NextResponse.next();
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder assets
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
