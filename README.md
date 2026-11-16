# Agora Vada

Portal internal: tarik berita → bikin prompt → desain post 1080×1350 → publish langsung ke Instagram.

- Jalankan lokal: `npm install` lalu `npm run dev` (atau `Generate_Berita.bat` di Windows). Salin `.env.example` ke `.env.local`.
- Deploy: Vercel (Next.js 14, Node 20+).
- **Setup Instagram, Blob, token & troubleshooting: lihat [SETUP-INSTAGRAM.md](SETUP-INSTAGRAM.md).**

Endpoint:
| Route | Fungsi |
|---|---|
| `POST /api/tarik-berita` | Scrape judul, isi, gambar dari link berita |
| `GET /api/proxy-image?url=` | Ambil gambar berita tanpa masalah CORS |
| `POST /api/instagram/upload` | Token client-upload ke Vercel Blob |
| `POST /api/instagram/publish` | Publish foto / Reels / carousel ke IG |
| `GET /api/instagram/status` | Cek ENV, token, sisa kuota posting |
| `GET /api/instagram/get-id` | Cari IG_USER_ID dari token |
