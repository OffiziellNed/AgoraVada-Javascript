import * as cheerio from 'cheerio';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { url } = await request.json();
    
    let currentUrl = url;
    let title = '';
    let image = '';
    let fullContent = '';
    let pageCount = 1;
    const maxPages = 5; // Batas maksimal halaman (mencegah infinite loop & server timeout)
    const visitedUrls = new Set(); // Merekam URL agar tidak tersedot berulang

    // LOOPING UNTUK MENYEDOT MULTI-HALAMAN
    while (currentUrl && pageCount <= maxPages && !visitedUrls.has(currentUrl)) {
      visitedUrls.add(currentUrl);
      
      // Menyamar sebagai browser Chrome agar tidak diblokir web berita
      const response = await fetch(currentUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'
        }
      });

      if (!response.ok) {
        if (pageCount === 1) throw new Error("Gagal menyedot web. Website mungkin dilindungi anti-bot.");
        else break; // Jika halaman 2 error, hentikan pencarian & pakai data yg ada
      }
      
      const html = await response.text();
      const $ = cheerio.load(html);

      // 1 & 2. Ambil Meta Data HANYA dari halaman pertama
      if (pageCount === 1) {
        title = $('meta[property="og:title"]').attr('content') || $('title').text() || $('h1').first().text();
        image = $('meta[property="og:image"]').attr('content') || $('meta[name="twitter:image"]').attr('content') || '';
      }

      // 3. Ambil Isi Teks Berita di Halaman Saat Ini
      let pageContent = '';
      const articleBody = $('article, .read__content, .detail__body-text, .post-content, main');
      if (articleBody.length > 0) {
        articleBody.find('p').each((i, el) => { pageContent += $(el).text() + '\n\n'; });
      } else {
        $('p').each((i, el) => { pageContent += $(el).text() + '\n\n'; });
      }
      
      // Gabungkan teks dari halaman ini ke keseluruhan teks
      fullContent += pageContent;

      // 4. MENCARI LINK HALAMAN SELANJUTNYA
      let nextLink = null;
      $('a').each((i, el) => {
        const text = $(el).text().trim().toLowerCase();
        const href = $(el).attr('href');
        
        // Cek apakah tombol berupa tulisan "selanjutnya", "next", "»", atau angka halaman berikutnya (misal: "2")
        if (href && (text === 'selanjutnya' || text === 'next' || text === '»' || text === (pageCount + 1).toString())) {
          nextLink = href;
        }
      });

      // Jika ada link selanjutnya, format ulang URL-nya untuk di-looping
      if (nextLink) {
        if (nextLink.startsWith('?')) {
          const baseUrlObj = new URL(currentUrl);
          currentUrl = baseUrlObj.origin + baseUrlObj.pathname + nextLink;
        } else if (nextLink.startsWith('/')) {
          const baseUrlObj = new URL(currentUrl);
          currentUrl = baseUrlObj.origin + nextLink;
        } else if (nextLink.startsWith('http')) {
          currentUrl = nextLink;
        } else {
          currentUrl = null; // Format tidak dikenali, hentikan loop
        }
        pageCount++;
      } else {
        currentUrl = null; // Tidak ada halaman selanjutnya, loop selesai
      }
    }

    // 5. Merapikan spasi yang berlebihan
    fullContent = fullContent.replace(/\n\s*\n/g, '\n\n').trim();

    // Template untuk dimasukkan ke Textarea Page 2 (Teks disedot 100% tanpa dipotong substring)
    const promptTeks = `[JUDUL BERITA]\n${title}\n\n[ISI BERITA]\n${fullContent}`;
    
    return NextResponse.json({
      status: "success",
      prompt: promptTeks,
      gambar_url: image,
      sumber: `Sumber Berita: ${new URL(url).hostname}`
    });

  } catch (error) {
    return NextResponse.json({ status: "error", detail: error.message });
  }
}
