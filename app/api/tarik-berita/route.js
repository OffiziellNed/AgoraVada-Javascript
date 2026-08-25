import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: 'URL tidak boleh kosong', message: 'URL tidak boleh kosong' }, { status: 400 });
    }

    // Menggunakan layanan Microlink untuk bypass WAF/Cloudflare
    // Layanan ini otomatis mengekstrak Judul, Deskripsi, dan Gambar (Meta Tags)
    const microlinkUrl = `https://api.microlink.io?url=${encodeURIComponent(url)}`;
    
    const response = await fetch(microlinkUrl);
    
    if (!response.ok) {
      throw new Error(`Akses ditolak oleh layanan ekstraktor. Status Code: ${response.status}`);
    }

    const data = await response.json();
    
    // Cek apakah Microlink berhasil mengekstrak datanya
    if (data.status !== 'success' || !data.data) {
       throw new Error("Gagal mengambil metadata dari web tujuan. Website super ketat.");
    }

    // Ambil data yang dibutuhkan dari hasil Microlink
    const title = data.data.title;
    const description = data.data.description;
    
    // Kalau mau sekalian narik gambar cover beritanya:
    const imageUrl = data.data.image?.url || null;

    return NextResponse.json({
      status: 'success',
      title: title ? title.replace(/\s+/g, ' ').trim() : 'Judul tidak ditemukan',
      description: description ? description.replace(/\s+/g, ' ').trim() : 'Deskripsi tidak ditemukan.',
      // Gue tambahin payload ini biar kalau Microlink dapet gambar, bisa langsung dikirim ke prompt
      prompt: `Judul: ${title || 'Tidak ada'}\nDeskripsi: ${description || 'Tidak ada'}`,
      gambar_url: imageUrl
    });

  } catch (error) {
    console.error("Error scraping:", error.message);
    const errorMessage = `Sistem anti-bot memblokir aksi ini. Detail: ${error.message}`;
    return NextResponse.json({ 
      status: 'error',
      error: errorMessage,
      message: errorMessage,
      details: errorMessage
    }, { status: 500 });
  }
}
