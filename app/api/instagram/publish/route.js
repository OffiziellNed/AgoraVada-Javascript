export async function POST(req) {
  try {
    const body = await req.json();
    const items = body.items || []; // [{url, type: 'image'|'video'}]
    const caption = body.caption || '';

    const IG_USER_ID = process.env.IG_USER_ID;
    const TOKEN = process.env.IG_PAGE_ACCESS_TOKEN;

    if (!IG_USER_ID ||!TOKEN) {
      return Response.json({ error: 'ENV IG_USER_ID / IG_PAGE_ACCESS_TOKEN belum set di Vercel' }, { status: 500 });
    }
    if (items.length === 0) {
      return Response.json({ error: 'Tidak ada media' }, { status: 400 });
    }

    // SINGLE POST
    if (items.length === 1) {
      const isVideo = items[0].type === 'video';
      const endpoint = `https://graph.facebook.com/v20.0/${IG_USER_ID}/media`;
      const payload = isVideo
       ? { media_type: 'REELS', video_url: items[0].url, caption, access_token: TOKEN }
        : { image_url: items[0].url, caption, access_token: TOKEN };

      const createRes = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const createData = await createRes.json();
      if (!createData.id) return Response.json(createData, { status: 400 });

      await new Promise(r => setTimeout(r, 3000));

      const pubRes = await fetch(`https://graph.facebook.com/v20.0/${IG_USER_ID}/media_publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creation_id: createData.id, access_token: TOKEN })
      });
      const pubData = await pubRes.json();
      return Response.json(pubData);
    }

    // CAROUSEL (2-9)
    const childIds = [];
    for (const item of items) {
      const isVideo = item.type === 'video';
      const res = await fetch(`https://graph.facebook.com/v20.0/${IG_USER_ID}/media`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
         ...(isVideo? { media_type: 'VIDEO', video_url: item.url } : { image_url: item.url }),
          is_carousel_item: true,
          access_token: TOKEN
        })
      });
      const data = await res.json();
      if (!data.id) return Response.json({ error: 'Gagal bikin carousel item', detail: data }, { status: 400 });
      childIds.push(data.id);
      await new Promise(r => setTimeout(r, 1000));
    }

    const carouselRes = await fetch(`https://graph.facebook.com/v20.0/${IG_USER_ID}/media`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        media_type: 'CAROUSEL',
        children: childIds.join(','),
        caption,
        access_token: TOKEN
      })
    });
    const carouselData = await carouselRes.json();
    if (!carouselData.id) return Response.json(carouselData, { status: 400 });

    await new Promise(r => setTimeout(r, 3000));

    const finalPub = await fetch(`https://graph.facebook.com/v20.0/${IG_USER_ID}/media_publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ creation_id: carouselData.id, access_token: TOKEN })
    });
    const finalData = await finalPub.json();
    return Response.json(finalData);

  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
