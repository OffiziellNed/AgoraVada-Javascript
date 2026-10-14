import { put } from '@vercel/blob';
export async function POST(req){
  try{
    const form = await req.formData();
    const file = form.get('file');
    if(!file) return Response.json({error:'No file'}, {status:400});
    const blob = await put(`agoravada/${Date.now()}-${file.name}`, file, { access: 'public' });
    return Response.json({ url: blob.url });
  }catch(e){
    return Response.json({error: e.message}, {status:500});
  }
}
