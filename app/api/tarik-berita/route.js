import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function POST(req) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ message: 'URL tidak boleh kosong' }, { status: 400 });
    }

    // Trik Bypass IP Vercel: Menggunakan layanan Proxy AllOrigins
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
    
    const response = await fetch(proxyUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      }
    });

    if (!response.ok) {
      throw new Error(`Akses ditolak proxy. Status: ${response.status}`);
    }

    // AllOrigins mengembalikan data dalam bentuk JSON, HTML-nya ada di dalam "contents"
    const data = await response.json();
    const html = data.contents;
    
    if (!html) {
       throw new Error("Gagal mengambil konten HTML dari web tujuan.");
    }

    // Load HTML pakai Cheerio
    const $ = cheerio.load(html);

    // 1. Ambil Judul
    const title = $('title').text() || $('h1').first().text();
    
    // 2. Ambil Deskripsi (Prioritas dari Meta Tag SEO)
    let description = $('meta[name="description"]').attr('content') || 
                      $('meta[property="og:description"]').attr('content') || 
                      $('meta[name="twitter:description"]').attr('content');

    // 3. Fallback: Kalau meta deskripsi nggak ada, sedot paragraf pertama dari artikel
    if (!description) {
       description = $('p').first().text();
    }

    // Bersihkan spasi berlebih
    const cleanTitle = title ? title.replace(/\s+/g, ' ').trim() : 'Judul tidak ditemukan';
    const cleanDescription = description ? description.replace(/\s+/g, ' ').trim() : 'Deskripsi tidak ditemukan.';

    return NextResponse.json({
      status: 'success',
      title: cleanTitle,
      description: cleanDescription,
    });

  } catch (error) {
    console.error("Error scraping:", error.message);
    // Format error disesuaikan agar terbaca oleh frontend, bukan "undefined"
    return NextResponse.json({ 
      status: 'error',
      message: 'Gagal menyedot web. Terhalang sistem keamanan anti-bot tingkat tinggi.',
      details: error.message
    }, { status: 500 });
  }
}
