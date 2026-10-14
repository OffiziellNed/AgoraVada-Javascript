import { put } from '@vercel/blob';
export const runtime = 'nodejs';

export async function POST(req) {
  try {
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) return Response.json({ error: 'BLOB_READ_WRITE_TOKEN belum kebaca - redeploy dulu' }, { status: 500 });
    
    const form = await req.formData();
    const file = form.get('file');
    if (!file) return Response.json({ error: 'No file' }, { status: 400 });

    const blob = await put(`agoravada/${Date.now()}-${file.name}`, file, {
      access: 'public',
      token: token,
    });

    return Response.json({ url: blob.url });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
