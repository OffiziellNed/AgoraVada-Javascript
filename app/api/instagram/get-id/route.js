import { NextResponse } from 'next/server';

export async function GET() {
  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;

  if (!accessToken) {
    return NextResponse.json(
      { error: 'INSTAGRAM_ACCESS_TOKEN is not configured' },
      { status: 500 }
    );
  }

  try {
    // 1. Get Pages managed by user
    const pagesRes = await fetch(
      `https://graph.facebook.com/v20.0/me/accounts?access_token=${accessToken}`
    );
    const pagesData = await pagesRes.json();

    if (!pagesRes.ok) {
      return NextResponse.json({ error: pagesData }, { status: pagesRes.status });
    }

    const accounts = [];

    // 2. For each page, get IG Business Account
    for (const page of pagesData.data || []) {
      const igRes = await fetch(
        `https://graph.facebook.com/v20.0/${page.id}?fields=instagram_business_account{name,username}&access_token=${accessToken}`
      );
      const igData = await igRes.json();

      if (igData.instagram_business_account) {
        accounts.push({
          page_id: page.id,
          page_name: page.name,
          ig_business_id: igData.instagram_business_account.id,
          ig_username: igData.instagram_business_account.username,
          ig_name: igData.instagram_business_account.name,
        });
      }
    }

    return NextResponse.json({ accounts, total: accounts.length });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch IG Business ID', details: error.message },
      { status: 500 }
    );
  }
}