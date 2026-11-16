import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import { assertPublicUrl } from '@/lib/safe-url';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';
const BROWSER_HEADERS = {
  'User-Agent': UA,
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.7,en;q=0.6',
  Referer: 'https://www.google.com/',
};

// Kalimat sampah yang sering nyelip di isi berita Indonesia
const JUNK = /^(baca juga|simak juga|lihat juga|advertisement|scroll to continue|gabung (di|ke) (whatsapp|telegram)|ikuti (kami|berita)|follow (us|kami)|dapatkan update|download aplikasi|editor\s*:|penulis\s*:|sumber\s*:|copyright|©)/i;

function isBlockedPage(t) {
  if (!t) return true;
  const low = t.slice(0, 5000).toLowerCase();
  return low.includes('just a moment') || low.includes('attention required') || low.includes('cf-chl') ||
    low.includes('error 522') || low.includes('access denied') || low.includes('enable javascript and cookies');
}

// ---------- Google News ----------
// Link news.google.com/rss/articles/CBMi... tidak lagi redirect via HTTP.
// Harus didecode lewat endpoint batchexecute milik Google (best-effort, bisa kena 429).
function googleNewsId(u) {
  try {
    const url = new URL(u);
    if (url.hostname !== 'news.google.com') return null;
    const parts = url.pathname.split('/').filter(Boolean);
    const i = parts.findIndex((p) => p === 'articles' || p === 'read');
    return i >= 0 ? parts[i + 1] : null;
  } catch { return null; }
}

function decodeOldGoogleId(id) {
  // Format lama: URL asli tertanam langsung di base64
  try {
    const raw = Buffer.from(id.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('latin1');
    const m = raw.match(/https?:\/\/[\x21-\x7e]+/);
    if (m && !raw.includes('AU_yqL')) return m[0].replace(/[\x00-\x1f\x80-\xff].*$/, '');
  } catch {}
  return null;
}

async function resolveGoogleNewsUrl(input) {
  const id = googleNewsId(input);
  if (!id) return input;
  const old = decodeOldGoogleId(id);
  if (old) return old;
  try {
    const page = await fetch(`https://news.google.com/rss/articles/${id}`, { headers: BROWSER_HEADERS, signal: AbortSignal.timeout(6000) });
    const html = await page.text();
    const sg = html.match(/data-n-a-sg="([^"]+)"/)?.[1];
    const ts = html.match(/data-n-a-ts="([^"]+)"/)?.[1];
    if (sg && ts) {
      const inner = JSON.stringify(['garturlreq', [['X', 'X', ['X', 'X'], null, null, 1, 1, 'US:en', null, 1, null, null, null, null, null, 0, 1], 'X', 'X', 1, [1, 1, 1], 1, 1, null, 0, 0, null, 0], id, Number(ts), sg]);
      const freq = JSON.stringify([[['Fbv4je', inner, null, 'generic']]]);
      const r = await fetch('https://news.google.com/_/DotsSplashUi/data/batchexecute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8', 'User-Agent': UA },
        body: 'f.req=' + encodeURIComponent(freq),
        signal: AbortSignal.timeout(6000),
      });
      const txt = await r.text();
      const m = txt.match(/\\"garturlres\\",\\"(https?:[^"\\]+)/);
      if (m) return m[1];
    }
  } catch {}
  return input; // gagal decode: biarkan, nanti Jina yang coba ikuti redirect
}

// ---------- Ekstraksi HTML ----------
function cleanParagraphs(list, title) {
  const seen = new Set();
  return list
    .map((t) => t.replace(/\s+/g, ' ').trim())
    .filter((t) => t.length > 40 && !JUNK.test(t) && t !== title && !seen.has(t) && seen.add(t));
}

function fromJsonLd($) {
  let found = null;
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const json = JSON.parse($(el).contents().text().trim());
      const stack = Array.isArray(json) ? [...json] : [json];
      while (stack.length) {
        const o = stack.shift();
        if (!o || typeof o !== 'object') continue;
        if (o['@graph']) stack.push(...o['@graph']);
        if (o.articleBody && String(o.articleBody).length > 200) {
          const img = Array.isArray(o.image) ? o.image[0] : o.image;
          found = {
            title: o.headline,
            content: String(o.articleBody),
            imageUrl: typeof img === 'string' ? img : img?.url,
            published: o.datePublished,
          };
          return false;
        }
      }
    } catch {}
  });
  return found;
}

function extractWithCheerio(html, pageUrl) {
  const $ = cheerio.load(html);
  const meta = (sel) => $(sel).attr('content')?.trim() || '';
  let title = (meta('meta[property="og:title"]') || $('h1').first().text() || $('title').text()).replace(/\s+/g, ' ').trim();
  let imageUrl = meta('meta[property="og:image"]') || meta('meta[name="twitter:image"]') || null;
  const metaDesc = meta('meta[property="og:description"]') || meta('meta[name="description"]');
  let published = meta('meta[property="article:published_time"]') || meta('meta[name="publishdate"]') || '';

  const ld = fromJsonLd($);
  let content = '';
  if (ld) {
    content = cleanParagraphs(ld.content.split(/\n+/), title).join('\n\n');
    title = title || ld.title || '';
    imageUrl = imageUrl || ld.imageUrl || null;
    published = published || ld.published || '';
  }

  $('script, style, nav, footer, iframe, noscript, header, aside, form, .baca-juga, .related, .ads, [class*="advert"], [class*="share"]').remove();

  if (content.length < 200) {
    const selectors = [
      '.detail__body-text', '.read__content', '.txt-article', '.side-article', '.entry-content', '.article-content',
      '.post-content', '.td-post-content', '.detail-text', '.news-content', '.detail-content', '.article-detail',
      '.single-content', '.story-content', '[itemprop="articleBody"]', 'article',
    ];
    for (const sel of selectors) {
      const el = $(sel).first();
      if (!el.length) continue;
      const parts = cleanParagraphs(el.find('p').map((_, p) => $(p).text()).get(), title);
      if (parts.join(' ').length > 200) { content = parts.join('\n\n'); break; }
    }
  }
  if (content.length < 200) {
    const parts = cleanParagraphs($('p').map((_, p) => $(p).text()).get(), title);
    if (parts.join(' ').length > content.length) content = parts.join('\n\n');
  }

  if (imageUrl) { try { imageUrl = new URL(imageUrl, pageUrl).href; } catch {} }
  return { title, content: content.trim(), imageUrl, metaDesc, published };
}

// ---------- Strategi fetch ----------
async function viaDirect(url) {
  const res = await fetch(url, { headers: BROWSER_HEADERS, cache: 'no-store', redirect: 'follow', signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`direct ${res.status}`);
  const html = await res.text();
  if (isBlockedPage(html)) throw new Error('direct diblokir anti-bot');
  const ext = extractWithCheerio(html, res.url || url);
  if (ext.content.length < 200) throw new Error('direct isi kosong');
  return { ...ext, finalUrl: res.url || url, via: 'direct' };
}

// Jina Reader: render di server mereka, tembus banyak proteksi ringan.
// Gratis tanpa key (rate limit kecil). Isi ENV JINA_API_KEY untuk limit lebih besar.
async function viaJina(url) {
  const headers = { Accept: 'application/json', 'X-Return-Format': 'text', 'X-With-Images-Summary': 'true', 'X-Timeout': '15' };
  if (process.env.JINA_API_KEY) headers.Authorization = `Bearer ${process.env.JINA_API_KEY}`;
  const res = await fetch(`https://r.jina.ai/${url}`, { headers, cache: 'no-store', signal: AbortSignal.timeout(20000) });
  if (!res.ok) throw new Error(`jina ${res.status}`);
  const j = await res.json();
  const d = j.data || {};
  const content = cleanParagraphs(String(d.content || d.text || '').split(/\n+/), d.title).join('\n\n');
  if (content.length < 200) throw new Error('jina isi kosong');
  const images = d.images ? Object.values(d.images) : [];
  return { title: d.title || '', content, imageUrl: images[0] || null, metaDesc: d.description || '', published: d.publishedTime || '', finalUrl: d.url || url, via: 'jina' };
}

function normalizeForSite(u) {
  try {
    const url = new URL(u);
    const h = url.hostname;
    if ((h.endsWith('kompas.com') || h.endsWith('tribunnews.com')) && !url.searchParams.has('page')) url.searchParams.set('page', 'all');
    if (h.endsWith('detik.com') && !url.searchParams.has('single')) url.searchParams.set('single', '1');
    return url.href;
  } catch { return u; }
}

export async function POST(req) {
  try {
    const { url } = await req.json();
    if (!url) return NextResponse.json({ status: 'error', message: 'URL kosong' }, { status: 400 });

    let fetchUrl = await resolveGoogleNewsUrl(url.trim());
    fetchUrl = normalizeForSite(fetchUrl);
    await assertPublicUrl(fetchUrl);

    const errors = [];
    let ex = null;
    for (const fn of [viaDirect, viaJina]) {
      try { ex = await fn(fetchUrl); break; } catch (e) { errors.push(e.message); }
    }
    if (!ex) throw new Error(`Gagal ekstrak (${errors.join('; ')}). Website mungkin memblokir server Vercel — salin isi berita manual.`);

    const title = (ex.title || 'Judul tidak ditemukan').replace(/\s+/g, ' ').trim();
    let content = ex.content;
    if (!content || content.length < 100) content = ex.metaDesc || '';
    content = content.slice(0, 12000); // jaga prompt tetap wajar

    let hostname = '';
    try { hostname = new URL(ex.finalUrl || fetchUrl).hostname.replace(/^www\./, ''); } catch {}

    return NextResponse.json({
      status: 'success',
      title,
      content,
      description: content,
      text: content,
      published: ex.published || null,
      prompt: `Judul: ${title}\n\nIsi Berita Lengkap:\n${content}`,
      gambar_url: ex.imageUrl,
      sumber: hostname ? `Sumber Berita: ${hostname}` : '',
      real_url: ex.finalUrl || fetchUrl,
      url,
      via: ex.via,
    });
  } catch (error) {
    return NextResponse.json({ status: 'error', message: error.message, description: error.message }, { status: 500 });
  }
}

export async function GET(req) {
  const url = new URL(req.url).searchParams.get('url');
  if (!url) return NextResponse.json({ status: 'error', message: 'url kosong' }, { status: 400 });
  return POST(new Request(req.url, { method: 'POST', body: JSON.stringify({ url }), headers: { 'Content-Type': 'application/json' } }));
}
