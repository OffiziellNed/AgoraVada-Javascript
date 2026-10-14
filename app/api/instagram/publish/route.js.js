export async function POST(req) {
  try {
    const { imageUrl, caption } = await req.json();
    const IG_USER_ID = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;
    const ACCESS_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN;

    if (!IG_USER_ID || !ACCESS_TOKEN) {
      return Response.json({ error: 'Env belum di-set' }, { status: 500 });
    }

    // Buat container
    const containerRes = await fetch(
      `https://graph.facebook.com/v20.0/${IG_USER_ID}/media?image_url=${encodeURIComponent(imageUrl)}&caption=${encodeURIComponent(caption || '')}&access_token=${ACCESS_TOKEN}`,
      { method: 'POST' }
    );
    const containerData = await containerRes.json();
    if (!containerData.id) return Response.json({ error: 'Gagal container', details: containerData }, { status: 400 });

    await new Promise(r => setTimeout(r, 3000));

    // Publish
    const publishRes = await fetch(
      `https://graph.facebook.com/v20.0/${IG_USER_ID}/media_publish?creation_id=${containerData.id}&access_token=${ACCESS_TOKEN}`,
      { method: 'POST' }
    );
    const publishData = await publishRes.json();
    
    return Response.json({ success: true, post_id: publishData.id });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}