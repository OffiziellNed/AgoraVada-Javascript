// Cegah route scraping/proxy dipakai untuk mengakses alamat internal (SSRF).
import { lookup } from 'node:dns/promises';
import net from 'node:net';

function isPrivateIp(ip) {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split('.').map(Number);
    return a === 10 || a === 127 || a === 0 ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 100 && b >= 64 && b <= 127);
  }
  const low = ip.toLowerCase();
  return low === '::1' || low === '::' || low.startsWith('fc') || low.startsWith('fd') || low.startsWith('fe80') ||
    (low.startsWith('::ffff:') && isPrivateIp(low.slice(7)));
}

export async function assertPublicUrl(raw) {
  let u;
  try { u = new URL(raw); } catch { throw new Error('URL tidak valid'); }
  if (!['http:', 'https:'].includes(u.protocol)) throw new Error('Hanya http/https');
  const host = u.hostname.replace(/^\[|\]$/g, '');
  if (host === 'localhost' || host.endsWith('.local') || host.endsWith('.internal')) throw new Error('Host tidak diizinkan');
  const addrs = net.isIP(host) ? [{ address: host }] : await lookup(host, { all: true });
  if (addrs.some((a) => isPrivateIp(a.address))) throw new Error('Host tidak diizinkan');
  return u;
}
