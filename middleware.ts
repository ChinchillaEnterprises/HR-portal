import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Define protected routes and their required permissions
const protectedRoutes = {
  '/api/applicants': ['applicant:view'],
  '/api/documents': ['document:view'],
  '/api/communications': ['communication:view'],
  '/api/onboarding': ['onboarding:view'],
  '/api/reports': ['report:view'],
  '/api/users': ['user:view'],
  '/api/integrations': ['integration:view'],
  '/api/settings': ['settings:view'],
};

// Define public routes that don't require authentication
const publicRoutes = [
  '/api/auth',
  '/api/health',
  '/login',
  '/signup',
  '/',
];

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Check if route is public
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Check if user is authenticated
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  
  if (!token) {
    // For API routes, return 401
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // For pages, redirect to login
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // For now, allow authenticated users to proceed
  // In production, implement permission checks here
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};