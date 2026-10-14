import { NextResponse } from 'next/server';
export const runtime = 'nodejs';

export async function POST(req) {
  try {
    const { items, caption } = await req.json();
    const userId = process.env.IG_USER_ID;
    const token = process.env.IG_ACCESS_TOKEN || process.env.IG_PAGE_ACCESS_TOKEN || process.env.IG_PAGE_TOKEN;

    if (!userId ||!token) {
      return NextResponse.json({ error: 'ENV IG_USER_ID / IG_PAGE_ACCESS_TOKEN belum set di Vercel' }, { status: 500 });
    }
    if (!items || items.length === 0) return NextResponse.json({ error: 'No items' }, { status: 400 });

    const base = `https://graph.facebook.com/v21.0/${userId}`;

    // Bikin container tiap file
    const containers = [];
    for (let i = 0; i < items.length; i++) {
      const isCarousel = items.length > 1;
      const params = new URLSearchParams();
      params.append('access_token', token);
      if (isCarousel) params.append('is_carousel_item', 'true');
      if (!isCarousel) params.append('caption', caption);

      if (items[i].type === 'video') {
        params.append('media_type', 'VIDEO');
        params.append('video_url', items[i].url);
      } else {
        params.append('image_url', items[i].url);
      }

      const r = await fetch(`${base}/media`, { method: 'POST', body: params });
      const j = await r.json();
      if (!r.ok ||!j.id) throw new Error(`Gagal bikin container ${i+1}: ${JSON.stringify(j)}`);
      containers.push(j.id);
    }

    let creationId;
    if (items.length > 1) {
      const p = new URLSearchParams();
      p.append('access_token', token);
      p.append('media_type', 'CAROUSEL');
      p.append('children', containers.join(','));
      p.append('caption', caption);
      const r = await fetch(`${base}/media`, { method: 'POST', body: p });
      const j = await r.json();
      if (!r.ok ||!j.id) throw new Error(`Gagal bikin carousel: ${JSON.stringify(j)}`);
      creationId = j.id;
    } else {
      creationId = containers[0];
    }

    // Tunggu kalo video biar ready (polling)
    for (let i = 0; i < 20; i++) {
      const s = await fetch(`${base.replace(userId, creationId)}?fields=status_code&access_token=${token}`);
      const sj = await s.json();
      if (sj.status_code === 'FINISHED' ||!sj.status_code) break;
      await new Promise(res => setTimeout(res, 2000));
    }

    const pubParams = new URLSearchParams();
    pubParams.append('access_token', token);
    pubParams.append('creation_id', creationId);
    const pub = await fetch(`${base}/media_publish`, { method: 'POST', body: pubParams });
    const pubJ = await pub.json();
    if (!pub.ok) throw new Error(`Gagal publish: ${JSON.stringify(pubJ)}`);

    return NextResponse.json({ id: pubJ.id });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
