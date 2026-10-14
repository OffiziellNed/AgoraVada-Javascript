import { NextResponse } from 'next/server';

export async function POST(request) {
  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
  const igBusinessId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;

  if (!accessToken || !igBusinessId) {
    return NextResponse.json(
      { error: 'Missing INSTAGRAM_ACCESS_TOKEN or INSTAGRAM_BUSINESS_ACCOUNT_ID' },
      { status: 500 }
    );
  }

  try {
    const { imageUrl, caption } = await request.json();

    if (!imageUrl) {
      return NextResponse.json({ error: 'imageUrl is required' }, { status: 400 });
    }

    // 1. Create media container
    const mediaRes = await fetch(
      `https://graph.facebook.com/v20.0/${igBusinessId}/media`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_url: imageUrl,
          caption: caption || '',
          access_token: accessToken,
        }),
      }
    );

    const mediaData = await mediaRes.json();

    if (!mediaRes.ok) {
      return NextResponse.json({ error: mediaData }, { status: mediaRes.status });
    }

    const creationId = mediaData.id;

    // 2. Publish media
    const publishRes = await fetch(
      `https://graph.facebook.com/v20.0/${igBusinessId}/media_publish`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creation_id: creationId,
          access_token: accessToken,
        }),
      }
    );

    const publishData = await publishRes.json();

    if (!publishRes.ok) {
      return NextResponse.json({ error: publishData }, { status: publishRes.status });
    }

    return NextResponse.json({
      success: true,
      media_id: publishData.id,
      creation_id: creationId,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Publish failed', details: error.message },
      { status: 500 }
    );
  }
}
