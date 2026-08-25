import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const body = await req.json();
    const rawUrl = body.url;

    if (!rawUrl) {
      return NextResponse.json({ error: 'URL tidak boleh kosong', message: 'URL tidak boleh kosong' }, { status: 400 });
    }

    // Bersihkan URL dari spasi tersembunyi yang sering bikin error 400
    const url = rawUrl.trim();

    // Menggunakan API Metatags dari Dub.co (Lebih tahan banting nembus anti-bot)
    const dubUrl = `https://api.dub.co/metatags?url=${encodeURIComponent(url)}`;
    
    const response = await fetch(dubUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      }
    });
    
    if (!response.ok) {
      throw new Error(`Akses ditolak API Ekstraktor. Status Code: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data || !data.title) {
       throw new Error("Gagal mengambil data. Website benar-benar mengunci akses bot.");
    }

    const title = data.title;
    const description = data.description;
    const imageUrl = data.image || null;

    return NextResponse.json({
      status: 'success',
      title: title ? title.replace(/\s+/g, ' ').trim() : 'Judul tidak ditemukan',
      description: description ? description.replace(/\s+/g, ' ').trim() : 'Deskripsi tidak ditemukan.',
      prompt: `Judul: ${title || 'Tidak ada'}\nDeskripsi: ${description || 'Tidak ada'}`,
      gambar_url: imageUrl
    });

  } catch (error) {
    console.error("Error scraping:", error.message);
    const errorMessage = `Sistem anti-bot masih memblokir. Detail: ${error.message}`;
    return NextResponse.json({ 
      status: 'error',
      error: errorMessage,
      message: errorMessage,
      details: errorMessage
    }, { status: 500 });
  }
}
