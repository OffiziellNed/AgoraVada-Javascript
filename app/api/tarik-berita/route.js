import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function POST(req) {
  try {
    const { url } = await req.json();

    if (!url) {
      // Kita kirim error & message sekaligus biar frontend pasti dapet
      return NextResponse.json({ error: 'URL tidak boleh kosong', message: 'URL tidak boleh kosong' }, { status: 400 });
    }

    // Pakai layanan corsproxy.io yang lebih handal menembus Cloudflare
    const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
    
    const response = await fetch(proxyUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
      }
    });

    if (!response.ok) {
      throw new Error(`Akses ditolak proxy. Status Code: ${response.status}`);
    }

    const html = await response.text();
    
    if (!html || html.trim() === '') {
       throw new Error("HTML kosong. Web tujuan memblokir render halaman.");
    }

    const $ = cheerio.load(html);

    const title = $('title').text() || $('h1').first().text();
    
    let description = $('meta[name="description"]').attr('content') || 
                      $('meta[property="og:description"]').attr('content') || 
                      $('meta[name="twitter:description"]').attr('content') ||
                      $('p').first().text();

    return NextResponse.json({
      status: 'success',
      title: title ? title.replace(/\s+/g, ' ').trim() : 'Judul tidak ditemukan',
      description: description ? description.replace(/\s+/g, ' ').trim() : 'Deskripsi tidak ditemukan.',
    });

  } catch (error) {
    console.error("Error scraping:", error.message);
    // Kita penuhi semua key (error, message, details) biar popup alert di frontend nggak undefined lagi
    const errorMessage = `Sistem anti-bot memblokir aksi ini. Detail: ${error.message}`;
    return NextResponse.json({ 
      status: 'error',
      error: errorMessage,
      message: errorMessage,
      details: errorMessage
    }, { status: 500 });
  }
}
