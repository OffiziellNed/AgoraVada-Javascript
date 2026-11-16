import { NextResponse } from 'next/server';
import { del } from '@vercel/blob';
import { getIgConfig, graph, waitForContainer } from '@/lib/ig';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
// Video butuh waktu diproses Instagram. 300 detik = batas maksimal Vercel Hobby.
export const maxDuration = 300;

const MAX_CAPTION = 2200;
const MAX_ITEMS = 10;

export async function POST(req) {
  const { userId, token } = getIgConfig();
  if (!userId || !token) {
    return NextResponse.json({ error: 'ENV IG_USER_ID / IG_ACCESS_TOKEN belum di-set di Vercel (lalu Redeploy).' }, { status: 500 });
  }

  let items, caption, cleanup;
  try {
    ({ items, caption = '', cleanup = true } = await req.json());
  } catch {
    return NextResponse.json({ error: 'Body bukan JSON' }, { status: 400 });
  }

  if (!Array.isArray(items) || items.length === 0) return NextResponse.json({ error: 'Tidak ada media' }, { status: 400 });
  if (items.length > MAX_ITEMS) return NextResponse.json({ error: `Maksimal ${MAX_ITEMS} media per carousel` }, { status: 400 });
  if (caption.length > MAX_CAPTION) return NextResponse.json({ error: `Caption ${caption.length} karakter, maksimal ${MAX_CAPTION}` }, { status: 400 });
  const hashtagCount = (caption.match(/#[\p{L}\p{N}_]+/gu) || []).length;
  if (hashtagCount > 30) return NextResponse.json({ error: `Hashtag ${hashtagCount}, maksimal 30` }, { status: 400 });

  try {
    const isCarousel = items.length > 1;
    let creationId;

    if (!isCarousel) {
      const it = items[0];
      const params = it.type === 'video'
        // VIDEO untuk single post sudah dihapus Meta sejak Nov 2023 -> pakai REELS
        ? { media_type: 'REELS', video_url: it.url, caption, share_to_feed: 'true' }
        : { image_url: it.url, caption };
      const c = await graph(`${userId}/media`, { method: 'POST', token, params });
      creationId = c.id;
    } else {
      const children = [];
      for (let i = 0; i < items.length; i++) {
        const it = items[i];
        const params = it.type === 'video'
          ? { media_type: 'VIDEO', video_url: it.url, is_carousel_item: 'true' } // di carousel tetap VIDEO
          : { image_url: it.url, is_carousel_item: 'true' };
        try {
          const c = await graph(`${userId}/media`, { method: 'POST', token, params });
          children.push(c.id);
        } catch (e) {
          throw new Error(`Media ${i + 1}: ${e.message}`);
        }
      }
      // Semua anak carousel harus FINISHED dulu sebelum container carousel dibuat
      for (let i = 0; i < children.length; i++) {
        try { await waitForContainer(children[i], token); }
        catch (e) { throw new Error(`Media ${i + 1}: ${e.message}`); }
      }
      const c = await graph(`${userId}/media`, {
        method: 'POST', token,
        params: { media_type: 'CAROUSEL', children: children.join(','), caption },
      });
      creationId = c.id;
    }

    await waitForContainer(creationId, token);
    const pub = await graph(`${userId}/media_publish`, { method: 'POST', token, params: { creation_id: creationId } });

    let permalink = null;
    try {
      const info = await graph(pub.id, { token, params: { fields: 'permalink' } });
      permalink = info.permalink || null;
    } catch {}

    // Hapus file sementara di Blob supaya storage tidak numpuk
    if (cleanup) {
      try { await del(items.map((i) => i.url).filter((u) => u.includes('blob.vercel-storage.com'))); } catch {}
    }

    return NextResponse.json({ id: pub.id, permalink });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
