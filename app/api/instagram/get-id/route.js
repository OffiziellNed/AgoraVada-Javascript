// Helper sekali pakai: cari IG Business ID dari token.
// Buka /api/instagram/get-id setelah set IG_ACCESS_TOKEN.
import { NextResponse } from 'next/server';
import { getIgConfig, graph, IG_API_HOST } from '@/lib/ig';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const { token } = getIgConfig();
  if (!token) return NextResponse.json({ error: 'IG_ACCESS_TOKEN belum di-set' }, { status: 500 });
  try {
    // Jalur Instagram Login: token langsung milik akun IG
    if (IG_API_HOST === 'graph.instagram.com') {
      const me = await graph('me', { token, params: { fields: 'user_id,username,account_type' } });
      return NextResponse.json([{ username: me.username, ig_user_id: me.user_id || me.id, account_type: me.account_type }]);
    }
    // Jalur Facebook Login: cari Page yang punya IG Business Account
    const pages = await graph('me/accounts', { token, params: { fields: 'id,name,instagram_business_account{id,username}' } });
    const result = (pages.data || [])
      .filter((p) => p.instagram_business_account)
      .map((p) => ({
        page_name: p.name,
        page_id: p.id,
        ig_user_id: p.instagram_business_account.id,
        ig_username: p.instagram_business_account.username,
      }));
    if (result.length === 0) {
      return NextResponse.json({ error: 'Tidak ada Page dengan akun IG Business/Creator terhubung. Cek: akun IG sudah Professional & ter-link ke Page, dan token punya izin pages_show_list + instagram_basic.' }, { status: 404 });
    }
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
