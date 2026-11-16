// Client upload ke Vercel Blob.
// File dikirim langsung dari browser ke Blob (tidak lewat function),
// jadi tidak kena batas body 4.5 MB milik Vercel Functions — video aman.
// Route ini hanya membuat token upload sementara.
import { handleUpload } from '@vercel/blob/client';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(request) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json({ error: 'BLOB_READ_WRITE_TOKEN belum ada. Hubungkan Blob store (akses Public) ke project lalu Redeploy.' }, { status: 500 });
  }
  try {
    const body = await request.json();
    const json = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        if (!pathname.startsWith('agoravada/')) throw new Error('Path tidak diizinkan');
        return {
          // Instagram: foto wajib JPEG (maks 8 MB), video MP4/MOV (Reels maks 300 MB)
          allowedContentTypes: ['image/jpeg', 'video/mp4', 'video/quicktime'],
          maximumSizeInBytes: 300 * 1024 * 1024,
          addRandomSuffix: true,
        };
      },
      // Sengaja tanpa onUploadCompleted: tidak perlu callback dari Vercel.
    });
    return NextResponse.json(json);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
