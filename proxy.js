import { NextResponse } from 'next/server';
import { AUTH_COOKIE, makeToken } from '@/lib/auth';

export async function proxy(request) {
  const pin = process.env.APP_PIN;
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(AUTH_COOKIE)?.value;

  if (pin && token && token === (await makeToken(pin))) {
    return NextResponse.next();
  }

  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return NextResponse.redirect(new URL('/login', request.url));
}

export const config = {
  matcher: ['/((?!login|api/login|_next/static|_next/image|favicon.ico|nvh-logo.png).*)'],
};
