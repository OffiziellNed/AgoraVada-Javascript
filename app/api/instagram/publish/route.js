export async function POST(req) {
  const { imageUrl, caption } = await req.json();
  const IG_USER_ID = process.env.IG_USER_ID;
  const TOKEN = process.env.IG_PAGE_ACCESS_TOKEN;

  // 1. Bikin container
  const createRes = await fetch(
    `https://graph.facebook.com/v20.0/${IG_USER_ID}/media`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image_url: imageUrl,
        caption: caption,
        access_token: TOKEN,
      }),
    }
  );
  const createData = await createRes.json();
  if (!createData.id) return Response.json(createData, { status: 400 });

  // 2. Publish
  await new Promise(r => setTimeout(r, 2000)); // kasih jeda 2 detik

  const publishRes = await fetch(
    `https://graph.facebook.com/v20.0/${IG_USER_ID}/media_publish`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        creation_id: createData.id,
        access_token: TOKEN,
      }),
    }
  );
  const publishData = await publishRes.json();
  return Response.json(publishData);
}
