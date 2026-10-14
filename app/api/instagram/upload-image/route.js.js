import { put } from '@vercel/blob';
export async function POST(req) {
  const formData = await req.formData();
  const file = formData.get('file');
  const blob = await put(`agoravada/${Date.now()}.jpg`, file, { access: 'public' });
  return Response.json({ url: blob.url });
}