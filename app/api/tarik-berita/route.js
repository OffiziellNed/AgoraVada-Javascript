import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function POST(req) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: 'URL tidak boleh kosong' }, { status: 400 });
    }

    // Trik memalsukan Header agar terlihat seperti browser manusia asli
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
        'Referer': 'https://www.google.com/',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      },
    });

    if (!response.ok) {
      throw new Error(`Akses ditolak server tujuan. Status: ${response.status}`);
    }

    const html = await response.text();
    
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
    const cleanTitle = title.replace(/\s+/g, ' ').trim();
    const cleanDescription = description ? description.replace(/\s+/g, ' ').trim() : 'Deskripsi tidak ditemukan.';

    return NextResponse.json({
      status: 'success',
      title: cleanTitle,
      description: cleanDescription,
    });

  } catch (error) {
    console.error("Error scraping:", error.message);
    return NextResponse.json({ 
      error: 'Gagal menyedot web. Website mungkin dilindungi anti-bot atau IP server diblokir.',
      details: error.message
    }, { status: 500 });
  }
}
