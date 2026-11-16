// Ambil gambar berita dari server sendiri (bukan proxy publik pihak ketiga),
// supaya canvas tidak "tainted" oleh CORS dan bisa di-export ke JPEG.
import { assertPublicUrl } from '@/lib/safe-url';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_BYTES = 4 * 1024 * 1024; // di bawah batas respons 4.5 MB Vercel

export async function GET(req) {
  const target = new URL(req.url).searchParams.get('url');
  if (!target) return new Response('url kosong', { status: 400 });
  try {
    const u = await assertPublicUrl(target);
    const res = await fetch(u, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36',
        Accept: 'image/avif,image/webp,image/jpeg,image/png,image/*;q=0.8',
        Referer: `${u.protocol}//${u.host}/`,
      },
      signal: AbortSignal.timeout(10000),
      redirect: 'follow',
    });
    if (!res.ok) return new Response(`Sumber menolak (${res.status})`, { status: 502 });
    const type = res.headers.get('content-type') || '';
    if (!type.startsWith('image/')) return new Response('Bukan gambar', { status: 415 });
    const buf = await res.arrayBuffer();
    if (buf.byteLength > MAX_BYTES) return new Response('Gambar terlalu besar', { status: 413 });
    return new Response(buf, {
      headers: { 'Content-Type': type, 'Cache-Control': 'public, max-age=86400', 'Access-Control-Allow-Origin': '*' },
    });
  } catch (e) {
    return new Response(e.message, { status: 400 });
  }
}
