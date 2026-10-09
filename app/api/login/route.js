import { NextResponse } from 'next/server';
import { AUTH_COOKIE, makeToken, endOfToday } from '@/lib/auth';

const MAX_FAILS = 5;
const LOCK_MS = 60 * 1000;
const attempts = new Map();

export async function POST(request) {
  const pin = process.env.APP_PIN;
  if (!pin) {
    return NextResponse.json({ error: 'APP_PIN is not configured' }, { status: 500 });
  }

  const ip = request.headers.get('x-forwarded-for') || 'local';
  const rec = attempts.get(ip) || { fails: 0, until: 0 };
  if (rec.until > Date.now()) {
    return NextResponse.json({ error: 'Too many attempts. Try again in a minute.' }, { status: 429 });
  }

  let body = {};
  try {
    body = await request.json();
  } catch {}

  if (String(body.pin ?? '') !== pin) {
    rec.fails += 1;
    if (rec.fails >= MAX_FAILS) {
      rec.fails = 0;
      rec.until = Date.now() + LOCK_MS;
    }
    attempts.set(ip, rec);
    return NextResponse.json({ error: 'Incorrect PIN' }, { status: 401 });
  }

  attempts.delete(ip);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(AUTH_COOKIE, await makeToken(pin), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production' && request.nextUrl.protocol === 'https:',
    path: '/',
    expires: endOfToday(),
  });
  return res;
}
