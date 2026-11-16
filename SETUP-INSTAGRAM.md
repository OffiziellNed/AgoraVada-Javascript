# Setup Upload Langsung ke Instagram — Agora Vada

Alurnya: **Canvas → JPEG → Vercel Blob (URL publik) → Instagram Graph API (container → publish)**.
Instagram tidak menerima upload file langsung; dia mengambil file dari URL publik. Itu sebabnya ada Vercel Blob di tengah.

---

## 0. Syarat akun

- Akun Instagram harus **Professional** (Business atau Creator). Akun pribadi tidak bisa diposting lewat API.
- Batas: ±50–100 postingan via API per 24 jam (carousel dihitung 1). Cek sisa kuota di `/api/instagram/status`.

## 1. Pilih jalur login (pilih SATU)

### Jalur A — Facebook Login (IG ter-link ke Facebook Page) → `IG_API_HOST=graph.facebook.com`

1. Di aplikasi Instagram: Settings → Account type → Professional, lalu hubungkan ke sebuah **Facebook Page**.
2. Buka <https://developers.facebook.com> → My Apps → **Create App** (tipe Business). Tambahkan produk **Instagram** (pilih "API setup with Facebook login").
3. Buka **Graph API Explorer**, pilih app lo, klik *Generate Access Token* dengan izin:
   `instagram_basic`, `instagram_content_publish`, `pages_show_list`, `pages_read_engagement`, `business_management`.
4. Token dari Explorer cuma hidup ±1 jam. Bikin awet:
   - **Paling awet (disarankan):** Meta Business Suite → Business Settings → Users → **System Users** → buat system user (Admin), assign Page + IG + app, lalu *Generate New Token* dengan izin di atas, expiry **Never**.
   - **Alternatif:** Access Token Debugger → *Extend Access Token* (jadi 60 hari) → panggil `GET /me/accounts` pakai token itu → ambil `access_token` milik Page. Page token dari long-lived user token tidak kedaluwarsa.
5. App boleh tetap **Development mode** selama yang dipakai akun lo sendiri (lo admin app). Tidak perlu App Review.

### Jalur B — Instagram Login (tanpa Facebook Page) → `IG_API_HOST=graph.instagram.com`

1. Di app dashboard → Instagram → **API setup with Instagram login** → tambahkan akun IG lo sebagai tester/role, lalu *Generate token*.
2. Token ini **long-lived 60 hari** dan wajib di-refresh sebelum habis:
   `GET https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=TOKEN_LAMA`
   (Bisa dijadwalkan pakai Vercel Cron kalau mau otomatis.)

## 2. Vercel Blob

1. Vercel Dashboard → project → **Storage** → Create → **Blob** → akses **Public** (Instagram harus bisa mengunduh file-nya).
2. Connect ke project (Production + Preview + Development). `BLOB_READ_WRITE_TOKEN` terisi otomatis.
3. File di Blob otomatis dihapus setelah sukses publish.

## 3. Environment Variables di Vercel

Project → Settings → Environment Variables (lihat `.env.example`):

| Nama | Isi |
|---|---|
| `IG_ACCESS_TOKEN` | token dari langkah 1 |
| `IG_API_HOST` | `graph.facebook.com` (Jalur A) atau `graph.instagram.com` (Jalur B) |
| `IG_USER_ID` | isi setelah langkah 4 |
| `APP_PASSWORD` | password untuk mengunci web (WAJIB — tanpa ini siapa pun bisa posting ke IG lo) |
| `APP_USER` | opsional, default `admin` |
| `JINA_API_KEY` | opsional, supaya scraping lewat Jina tidak cepat kena limit |

Setelah mengubah ENV → **Redeploy** (ENV baru tidak terbaca sebelum redeploy).

## 4. Cari IG_USER_ID lalu tes

1. Buka `https://<domain-lo>.vercel.app/api/instagram/get-id` → salin `ig_user_id` → isi `IG_USER_ID` → Redeploy.
2. Buka `/api/instagram/status` → harus `"ok": true` + username + kuota.
3. Coba posting 1 gambar dari editor (tombol **📤 Upload IG**).

## Error umum

| Pesan | Penyebab / solusi |
|---|---|
| `(code 190)` | Token kedaluwarsa / salah. Generate ulang (pakai System User biar tidak terulang). |
| `(code 10)` atau `(code 200)` permission | Token kurang izin `instagram_content_publish`. |
| `Only photo or video can be accepted` / `2207052` | URL media tidak bisa diunduh IG — cek Blob store **Public**. |
| `aspect ratio` / `2207009` | Rasio foto harus antara 4:5 dan 1.91:1. Canvas 1080×1350 (4:5) sudah aman. |
| `ERROR` saat video | Video harus MP4/MOV, H.264 + AAC. Single video otomatis diposting sebagai **Reels**. |
| `(code 4)` / `9` | Kena rate limit. Tunggu, cek `/api/instagram/status`. |
| `504` / timeout | Video panjang. Batas function Vercel Hobby 300 detik. |

## Scraping berita

`/api/tarik-berita` mencoba berurutan:
1. **Direct fetch** + ekstraksi (JSON-LD `articleBody` → selector khusus situs Indonesia → semua `<p>`), membuang "Baca juga", iklan, dsb.
2. **Jina Reader** (`r.jina.ai`) kalau direct diblokir anti-bot.

Link Google News (`news.google.com/rss/articles/...`) didekode dulu ke URL asli. Ini memakai endpoint internal Google, jadi bisa sesekali gagal (rate limit) — kalau gagal, tempel link asli dari situs beritanya.

Situs yang dilindungi Cloudflare ketat kadang tetap gagal dari server Vercel. Untuk itu `api_agora_vada.py` (curl_cffi, meniru sidik jari Chrome) bisa dijalankan di komputer lokal / VPS sebagai cadangan — saat ini file itu **tidak** ikut jalan di Vercel.
