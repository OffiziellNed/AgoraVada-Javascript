import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Upload to Vercel Blob (requires BLOB_READ_WRITE_TOKEN env)
    const blob = await put(file.name, file, {
      access: 'public',
    });

    return NextResponse.json({ 
      url: blob.url,
      pathname: blob.pathname,
      contentType: file.type 
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Upload failed', details: error.message },
      { status: 500 }
    );
  }
}
