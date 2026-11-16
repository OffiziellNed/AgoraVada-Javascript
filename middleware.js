// Kunci seluruh web pakai password (HTTP Basic Auth).
// Tanpa ini, siapa pun yang tahu URL Vercel lo bisa posting ke IG lo
// dan memakai kuota Blob/function lo.
// Set ENV APP_PASSWORD (dan opsional APP_USER, default "admin") di Vercel.
import { NextResponse } from 'next/server';

export function middleware(req) {
  const pass = process.env.APP_PASSWORD;
  if (!pass) return NextResponse.next(); // belum di-set: terbuka (lihat /api/instagram/status)
  const user = process.env.APP_USER || 'admin';

  const header = req.headers.get('authorization') || '';
  if (header.startsWith('Basic ')) {
    try {
      const [u, ...rest] = atob(header.slice(6)).split(':');
      if (u === user && rest.join(':') === pass) return NextResponse.next();
    } catch {}
  }
  return new NextResponse('Login dulu', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="Agora Vada", charset="UTF-8"' },
  });
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
