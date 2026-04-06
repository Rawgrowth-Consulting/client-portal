import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_PATHS = ['/login', '/login/verify', '/'];
const PUBLIC_PREFIXES = ['/api/', '/_next/', '/favicon'];
const STATIC_EXTENSIONS = /\.(png|svg|ico|jpg|jpeg|gif|webp|css|js|map|woff|woff2|ttf)$/;

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (STATIC_EXTENSIONS.test(pathname)) return NextResponse.next();
  if (PUBLIC_PATHS.includes(pathname) || PUBLIC_PREFIXES.some(p => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const authCookie = request.cookies.get('pb_auth');
  if (!authCookie?.value) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    const { token } = JSON.parse(authCookie.value);
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  } catch {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
