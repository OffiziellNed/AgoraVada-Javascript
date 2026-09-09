import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 30;

function isBadContent(t) {
  if (!t) return true;
  const low = t.toLowerCase();
  return low.includes('just a moment') || low.includes('attention required') || low.includes('error 522') || low.includes('the initial connection between cloudflare') || t.trim().length < 80;
}

async function resolveGoogleNewsUrl(googleUrl) {
  if (!googleUrl.includes('news.google.com')) return googleUrl;
  try {
    const r1 = await fetch(googleUrl, { redirect: 'manual', headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(4000) });
    const loc = r1.headers.get('location');
    if (loc && !loc.includes('news.google.com')) return loc;
  } catch {}
  try {
    const r2 = await fetch(googleUrl, { redirect: 'follow', headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1)' }, signal: AbortSignal.timeout(5000) });
    if (r2.url && !r2.url.includes('news.google.com')) return r2.url;
  } catch {}
  return googleUrl;
}

async function extractWithCheerio(html) {
  const $ = cheerio.load(html);
  $('script:not([type="application/ld+json"]), style, nav, footer, iframe, noscript, header').remove();
  
  let title = ($('meta[property="og:title"]').attr('content') || $('h1').first().text() || $('title').text() || '').replace(/\s+/g, ' ').trim();
  let imageUrl = $('meta[property="og:image"]').attr('content') || $('meta[name="twitter:image"]').attr('content') || null;
  let metaDesc = $('meta[name="description"]').attr('content') || $('meta[property="og:description"]').attr('content') || '';

  let content = '';

  // 1. Coba ambil dari JSON-LD (paling ampuh buat tribratanews & detik)
  try {
    $('script[type="application/ld+json"]').each((i, el) => {
      try {
        const json = JSON.parse($(el).html());
        const arr = Array.isArray(json) ? json : [json];
        for (const obj of arr) {
          if (obj.articleBody && obj.articleBody.length > 200) { content = obj.articleBody; return false; }
          if (obj['@graph']) {
            for (const g of obj['@graph']) {
              if (g.articleBody && g.articleBody.length > 200) { content = g.articleBody; return false; }
            }
          }
        }
      } catch {}
    });
  } catch {}

  // 2. Selector khusus Indonesia (termasuk tribratanews)
  if (!content || content.length < 200) {
    const selectors = [
      '.detail__body-text', '.read__content', '.entry-content', '.article-content', 
      '.thecontent', '.td-post-content', '.td_block_text_with_title', '.post-content',
      '.content', '.post-entry', '.entry', '.news-content', '.detail-content', 
      '.article-detail', '.single-content', '.story-content', 'article', '.post'
    ];
    for (const sel of selectors) {
      if ($(sel).length > 0) {
        const parts = [];
        $(sel).find('p').each((i, el) => {
          const t = $(el).text().trim();
          if (t.length > 30 && !/baca juga|advertisement|tribratanews/i.test(t)) parts.push(t);
        });
        // Kalau gak ada p, ambil text langsung
        if (parts.length === 0) {
          const txt = $(sel).text().replace(/\s+/g, ' ').trim();
          if (txt.length > 300) parts.push(txt);
        }
        if (parts.join(' ').length > 200) { content = parts.join('\n\n'); break; }
      }
    }
  }

  // 3. Fallback paling brutal: ambil semua p panjang di seluruh body
  if (!content || content.length < 200) {
    const allP = [];
    $('p').each((i, el) => {
      const t = $(el).text().trim();
      // Filter yang bukan navigasi & bukan judul ulang
      if (t.length > 50 && t !== title && !/menu|copyright|follow us/i.test(t)) allP.push(t);
    });
    // Hapus duplikat
    const uniq = [...new Set(allP)];
    const joined = uniq.join('\n\n');
    if (joined.length > content.length) content = joined;
  }

  // 4. Bersihkan judul yang ke-duplikat di awal isi
  if (content && title && content.startsWith(title)) {
    content = content.replace(title, '').trim();
  }

  return { title, content: content.trim(), imageUrl, metaDesc: metaDesc.trim() };
}

async function fetchWithTimeout(url, opts, timeout = 5000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, { ...opts, signal: controller.signal });
    clearTimeout(id);
    return res;
  } catch (e) {
    clearTimeout(id);
    throw e;
  }
}

async function tryFetchWithProxies(fetchUrl) {
  const proxies = [
    { name: 'direct', url: fetchUrl, opts: { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 'Accept': 'text/html', 'Referer': 'https://www.google.com/' }, cache: 'no-store' }, timeout: 5000 },
    { name: 'allorigins', url: `https://api.allorigins.win/raw?url=${encodeURIComponent(fetchUrl)}`, opts: { cache: 'no-store' }, timeout: 5000 },
    { name: 'jina', url: `https://r.jina.ai/http://${fetchUrl.replace(/^https?:\/\//, '')}`, opts: { headers: { 'X-Retain-Images': 'none' }, cache: 'no-store' }, timeout: 8000 },
  ];

  for (const p of proxies) {
    try {
      const res = await fetchWithTimeout(p.url, p.opts, p.timeout);
      if (!res.ok) continue;
      let html = await res.text();
      if (!html || html.length < 100) continue;
      if (isBadContent(html) && p.name !== 'jina') continue;
      
      if (p.name === 'jina') {
        // Jina markdown
        const lines = html.split('\n').filter(l => l.trim().length > 50 && !l.includes('Cloudflare'));
        const longText = lines.join('\n\n');
        if (longText.length > 300) return { title: '', content: longText, imageUrl: null, metaDesc: '' };
        continue;
      }
      
      const ext = await extractWithCheerio(html);
      if (ext.content && ext.content.length > 200) {
        return ext;
      }
    } catch (e) {
      continue;
    }
  }
  return null;
}

export async function POST(req) {
  try {
    const { url } = await req.json();
    if (!url) return NextResponse.json({ error: 'URL kosong' }, { status: 400 });
    let fetchUrl = url.trim();
    fetchUrl = await resolveGoogleNewsUrl(fetchUrl);
    
    if (fetchUrl.includes('kompas.com') || fetchUrl.includes('tribunnews.com')) {
      if (!fetchUrl.includes('page=all')) fetchUrl += fetchUrl.includes('?') ? '&page=all' : '?page=all';
    } else if (fetchUrl.includes('detik.com')) {
      if (!fetchUrl.includes('single=1')) fetchUrl += fetchUrl.includes('?') ? '&single=1' : '?single=1';
    }

    const extracted = await tryFetchWithProxies(fetchUrl);
    
    if (!extracted) throw new Error("Gagal ekstrak - semua proxy gagal.");

    // Pastikan isi gak sama persis dengan judul (penyakit tribratanews di screenshot lo)
    let finalContent = extracted.content || extracted.metaDesc || '';
    if (finalContent && extracted.title && finalContent.trim() === extracted.title.trim()) {
      finalContent = extracted.metaDesc || '';
    }
    // Kalau masih kosong / terlalu pendek, pakai metaDesc
    if (!finalContent || finalContent.length < 100) {
      finalContent = extracted.metaDesc || 'Konten tidak ditemukan, pakai judul saja.';
    }

    let cleanTitle = extracted.title ? extracted.title.replace(/\s+/g, ' ').trim() : 'Judul tidak ditemukan';
    let hostname = "";
    try { hostname = new URL(fetchUrl).hostname; } catch {}

    return NextResponse.json({
      status: 'success',
      title: cleanTitle,
      description: finalContent,
      text: finalContent,
      prompt: `Judul: ${cleanTitle}\n\nIsi Berita Lengkap:\n${finalContent}`,
      gambar_url: extracted.imageUrl,
      sumber: hostname ? `Sumber Berita: ${hostname}` : "",
      real_url: fetchUrl,
      url: url
    });

  } catch (error) {
    return NextResponse.json({ status: 'error', message: error.message, description: error.message }, { status: 500 });
  }
}

export async function GET(req) {
  const url = new URL(req.url).searchParams.get('url');
  if (!url) return NextResponse.json({ status: 'error' }, { status: 400 });
  return POST(new Request(req.url, { method: 'POST', body: JSON.stringify({ url }), headers: { 'Content-Type': 'application/json' } }));
}
