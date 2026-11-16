// Konfigurasi & helper Instagram Graph API (dipakai semua route /api/instagram/*)
//
// Dua jalur resmi dari Meta:
//  1) "Instagram API with Facebook Login"  -> host graph.facebook.com
//     butuh akun IG Business/Creator yang ter-link ke Facebook Page.
//  2) "Instagram API with Instagram Login" -> host graph.instagram.com
//     tidak butuh Facebook Page, token langsung dari login Instagram.
// Pilih lewat ENV IG_API_HOST. Default: graph.facebook.com.

export const IG_API_VERSION = process.env.IG_API_VERSION || 'v25.0';
export const IG_API_HOST = process.env.IG_API_HOST || 'graph.facebook.com';
export const IG_BASE = `https://${IG_API_HOST}/${IG_API_VERSION}`;

export function getIgConfig() {
  const userId = process.env.IG_USER_ID;
  // Nama ENV lama tetap didukung supaya deploy lama tidak langsung rusak.
  const token =
    process.env.IG_ACCESS_TOKEN ||
    process.env.IG_PAGE_ACCESS_TOKEN ||
    process.env.IG_PAGE_TOKEN ||
    process.env.INSTAGRAM_ACCESS_TOKEN;
  return { userId, token };
}

// Panggil Graph API. Token dikirim lewat header, bukan query string,
// supaya tidak bocor ke log.
export async function graph(path, { method = 'GET', params = {}, token } = {}) {
  const url = new URL(`${IG_BASE}/${path.replace(/^\//, '')}`);
  const init = { method, headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' };
  if (method === 'GET') {
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
  } else {
    const body = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== null) body.append(k, String(v));
    init.body = body;
  }
  const res = await fetch(url, init);
  let json;
  try { json = await res.json(); } catch { json = {}; }
  if (!res.ok || json.error) {
    const e = json.error || {};
    const msg = e.error_user_msg || e.message || `HTTP ${res.status}`;
    const err = new Error(`${msg}${e.code ? ` (code ${e.code}${e.error_subcode ? '/' + e.error_subcode : ''})` : ''}`);
    err.graph = e;
    throw err;
  }
  return json;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Tunggu container siap. Wajib untuk video, aman juga untuk foto & carousel.
// status_code: EXPIRED | ERROR | FINISHED | IN_PROGRESS | PUBLISHED
export async function waitForContainer(containerId, token, { timeoutMs = 180000, intervalMs = 3000 } = {}) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const s = await graph(containerId, { token, params: { fields: 'status_code,status' } });
    if (s.status_code === 'FINISHED' || s.status_code === 'PUBLISHED') return s;
    if (s.status_code === 'ERROR' || s.status_code === 'EXPIRED') {
      throw new Error(`Container ${containerId} ${s.status_code}: ${s.status || 'cek format media (JPEG, rasio 4:5–1.91:1, video MP4/H.264)'}`);
    }
    await sleep(intervalMs);
  }
  throw new Error(`Container ${containerId} belum siap setelah ${Math.round(timeoutMs / 1000)} detik`);
}
