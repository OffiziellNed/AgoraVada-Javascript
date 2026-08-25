import { NextResponse } from 'next/server';
import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';
import puppeteerExtra from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import * as cheerio from 'cheerio';

// Aktifkan mode Stealth agar tidak terdeteksi sebagai Bot
puppeteerExtra.use(StealthPlugin());

// Vercel Function maksimal jalan 10-15 detik di tier gratis, 
// jadi kita optimasi opsi Chromium-nya
export async function POST(req) {
  let browser = null;

  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: 'URL kosong', message: 'URL tidak boleh kosong' }, { status: 400 });
    }

    let fetchUrl = url.trim();
    // Trik Khusus Media Indonesia (halaman 1-2-3 jadi satu)
    if (fetchUrl.includes('kompas.com') || fetchUrl.includes('tribunnews.com')) {
      if (!fetchUrl.includes('page=all')) {
        fetchUrl += fetchUrl.includes('?') ? '&page=all' : '?page=all';
      }
    } else if (fetchUrl.includes('detik.com')) {
      if (!fetchUrl.includes('single=1')) {
        fetchUrl += fetchUrl.includes('?') ? '&single=1' : '?single=1';
      }
    }

    // Eksekusi Chromium ringan khusus Vercel
    const executablePath = await chromium.executablePath();
    
    browser = await puppeteerExtra.launch({
      args: [...chromium.args, '--no-sandbox', '--disable-setuid-sandbox'],
      defaultViewport: chromium.defaultViewport,
      executablePath: executablePath || undefined,
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
    });

    const page = await browser.newPage();
    
    // Blokir gambar dan CSS biar loading-nya ngebut (mencegah Vercel Timeout)
    await page.setRequestInterception(true);
    page.on('request', (request) => {
      if (['image', 'stylesheet', 'font', 'media'].includes(request.resourceType())) {
        request.abort();
      } else {
        request.continue();
      }
    });

    // Buka website (tunggu sampai struktur HTML selesai dimuat)
    await page.goto(fetchUrl, { waitUntil: 'domcontentloaded', timeout: 12000 });
    
    // Ambil seluruh HTML yang sudah dirender oleh Puppeteer
    const html = await page.content();
    await browser.close();

    // Bedah HTML pakai Cheerio
    const $ = cheerio.load(html);

    const title = $('title').text() || $('h1').first().text();
    
    // EKSTRAKSI FULL TEXT
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
      error: `Gagal. ${error.message}`,
      message: `Gagal. ${error.message}`
    }, { status: 500 });
  }
}
