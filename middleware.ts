import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getUserFromRequest } from './lib/auth';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes
  if (pathname === '/login' || pathname === '/signup' || pathname === '/api/auth/login' || pathname === '/api/auth/signup') {
    return NextResponse.next();
  }

  // API routes that require auth
  if (pathname.startsWith('/api/')) {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Add user to headers for API routes to access
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('X-User-Id', user.id.toString());
    requestHeaders.set('X-User-Role', user.role);

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  // Protected routes - redirect to login if not authenticated
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};