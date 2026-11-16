// Cek kesehatan koneksi IG: token valid? akun mana? sisa kuota posting 24 jam?
import { NextResponse } from 'next/server';
import { getIgConfig, graph } from '@/lib/ig';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const { userId, token } = getIgConfig();
  const out = {
    env: {
      IG_USER_ID: !!userId,
      IG_ACCESS_TOKEN: !!token,
      BLOB_READ_WRITE_TOKEN: !!process.env.BLOB_READ_WRITE_TOKEN,
      APP_PASSWORD: !!process.env.APP_PASSWORD,
    },
  };
  if (!userId || !token) return NextResponse.json({ ok: false, ...out });
  try {
    const acc = await graph(userId, { token, params: { fields: 'username' } });
    out.username = acc.username;
  } catch (e) {
    return NextResponse.json({ ok: false, ...out, error: `Token/IG_USER_ID bermasalah: ${e.message}` });
  }
  try {
    const q = await graph(`${userId}/content_publishing_limit`, { token, params: { fields: 'quota_usage,config' } });
    const d = (q.data || [])[0] || {};
    out.quota = { used: d.quota_usage, total: d.config?.quota_total };
  } catch {}
  return NextResponse.json({ ok: true, ...out });
}
