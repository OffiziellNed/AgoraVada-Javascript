import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function POST(req) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: 'URL kosong', message: 'URL tidak boleh kosong' }, { status: 400 });
    }

    // TRIK GOOGLEBOT: Menyamar sebagai mesin pencari Google agar masuk whitelist WAF
    const response = await fetch(url.trim(), {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
        'Referer': 'https://www.google.com/'
      },
    });

    const html = await response.text();

    // Cek kalau ternyata Googlebot juga ikut dicegat pakai halaman Cloudflare
    if (html.includes("Just a moment...") || html.includes("Cloudflare") || html.includes("Attention Required!")) {
        throw new Error("Website ini memblokir bahkan Googlebot dari IP Datacenter.");
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
      prompt: `Judul: ${title ? title.replace(/\s+/g, ' ').trim() : 'Tidak ada'}\nDeskripsi: ${description ? description.replace(/\s+/g, ' ').trim() : 'Tidak ada'}`
    });

  } catch (error) {
    console.error("Error scraping:", error.message);
    return NextResponse.json({ 
      status: 'error',
      error: `Gagal. ${error.message}`,
      message: `Gagal. ${error.message}`
    }, { status: 500 });
  }
}
