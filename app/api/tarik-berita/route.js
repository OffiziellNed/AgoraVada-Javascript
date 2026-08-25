import { NextResponse } from 'next/server';
import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';
import * as cheerio from 'cheerio';

// WAJIB ADA: Mencegah Next.js mengeksekusi file ini saat proses Build (mencegah error)
export const dynamic = 'force-dynamic';

export async function POST(req) {
  let browser = null;

  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: 'URL kosong', message: 'URL tidak boleh kosong' }, { status: 400 });
    }

    let fetchUrl = url.trim();
    
    // Trik Khusus Media Indonesia (menyatukan halaman berita)
    if (fetchUrl.includes('kompas.com') || fetchUrl.includes('tribunnews.com')) {
      if (!fetchUrl.includes('page=all')) {
        fetchUrl += fetchUrl.includes('?') ? '&page=all' : '?page=all';
      }
    } else if (fetchUrl.includes('detik.com')) {
      if (!fetchUrl.includes('single=1')) {
        fetchUrl += fetchUrl.includes('?') ? '&single=1' : '?single=1';
      }
    }

    // Eksekusi Chromium ringan khusus serverless Vercel
    const executablePath = await chromium.executablePath();
    
    browser = await puppeteer.launch({
      args: [
        ...chromium.args, 
        '--no-sandbox', 
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled' // Parameter anti-bot bawaan Chrome
      ],
      defaultViewport: chromium.defaultViewport,
      executablePath: executablePath || undefined,
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
    });

    const page = await browser.newPage();
    
    // ==========================================
    // INJEKSI MANUAL STEALTH (Bypass Cloudflare)
    // ==========================================
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await page.evaluateOnNewDocument(() => {
      // Menghapus jejak bahwa ini adalah browser otomatis
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
    });

    // Blokir request yang berat (gambar, css, font) agar tidak timeout di Vercel
    await page.setRequestInterception(true);
    page.on('request', (request) => {
      if (['image', 'stylesheet', 'font', 'media'].includes(request.resourceType())) {
        request.abort();
      } else {
        request.continue();
      }
    });

    // Buka halaman web dengan batas waktu 12 detik
    await page.goto(fetchUrl, { waitUntil: 'domcontentloaded', timeout: 12000 });
    
    const html = await page.content();
    await browser.close();

    // Bedah HTML pakai Cheerio
    const $ = cheerio.load(html);

    const title = $('title').text() || $('h1').first().text();
    
    // Ekstraksi teks dari artikel utama
    let articleContent = '';
    const articleSelectors = ['article', '.detail__body-text', '.read__content', '.entry-content', '.article-content', '.detail-text'];
    
    for (const selector of articleSelectors) {
        if ($(selector).length > 0) {
            $(selector).find('p').each((i, el) => {
                const text = $(el).text().trim();
                if (text.length > 30) articleContent += text + '\n\n';
            });
            break;
        }
    }
    
    // Fallback ekstraksi jika struktur HTML tidak standar
    if (!articleContent.trim()) {
        $('p').each((i, el) => {
            const text = $(el).text().trim();
            if (text.length > 50) articleContent += text + '\n\n';
        });
    }

    const fallbackDesc = $('meta[name="description"]').attr('content') || 'Deskripsi tidak ditemukan.';
    const finalDescription = articleContent.trim() ? articleContent.trim() : fallbackDesc;
    const cleanTitle = title ? title.replace(/\s+/g, ' ').trim() : 'Judul tidak ditemukan';

    return NextResponse.json({
      status: 'success',
      title: cleanTitle,
      description: finalDescription,
      prompt: `Judul: ${cleanTitle}\n\nIsi Berita Lengkap:\n${finalDescription}`
    });

  } catch (error) {
    if (browser) await browser.close();
    console.error("Error Puppeteer:", error.message);
    return NextResponse.json({ 
      status: 'error',
      error: `Gagal menyedot data. Detail: ${error.message}`,
      message: `Gagal menyedot data. Detail: ${error.message}`
    }, { status: 500 });
  }
}
