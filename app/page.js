"use client";
import React, { useState, useRef, useEffect } from 'react';

export default function AgoraVadaPortal() {
  const [currentPage, setCurrentPage] = useState(1);
  const [judulHtml, setJudulHtml] = useState('WARGA BOGOR MENOLAK GUSURAN LIAR DI KAWASAN PUNCAK');
  const [sumberBerita, setSumberBerita] = useState('Sumber: Berita Bogor');
  const [imageUrl, setImageUrl] = useState('');
  const [reviewImageUrl, setReviewImageUrl] = useState('');
  const [captionText, setCaptionText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [teksX, setTeksX] = useState(110);
  const [teksY, setTeksY] = useState(850);
  const [ukuranFont, setUkuranFont] = useState(80);
  const canvasRef = useRef(null);
  const [loadedBgImg, setLoadedBgImg] = useState(null);

  useEffect(() => {
    if (!imageUrl) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => setLoadedBgImg(img);
    img.src = imageUrl;
  }, [imageUrl]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = 1080;
    canvas.height = 1350;
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0,0,canvas.width,canvas.height);
    if (loadedBgImg) {
      ctx.drawImage(loadedBgImg,0,0,canvas.width,canvas.height);
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0,580,canvas.width,canvas.height-580);
    }
    ctx.fillStyle = '#f6e05e';
    ctx.font = `bold ${ukuranFont}px sans-serif`;
    ctx.fillText(judulHtml, teksX, teksY, 860);
    ctx.fillStyle = '#fff';
    ctx.font = '25px sans-serif';
    ctx.fillText(sumberBerita,110,778);
  }, [loadedBgImg, judulHtml, sumberBerita, teksX, teksY, ukuranFont]);

  const handleUploadToBlob = async () => {
    if (!canvasRef.current) return;
    setIsUploading(true);
    canvasRef.current.toBlob(async (blob) => {
      const form = new FormData();
      form.append('file', blob, 'agoravada.jpg');
      const res = await fetch('/api/instagram/upload-image', { method: 'POST', body: form });
      const data = await res.json();
      if (data.url) {
        setReviewImageUrl(data.url);
        setCaptionText(judulHtml + '\n\n' + sumberBerita + '\n\n#AgoraVada #Bogor');
        setCurrentPage(4);
      } else alert('Gagal upload: ' + JSON.stringify(data));
      setIsUploading(false);
    }, 'image/jpeg', 0.9);
  };

  const handlePublish = async () => {
    setIsUploading(true);
    const res = await fetch('/api/instagram/publish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageUrl: reviewImageUrl, caption: captionText })
    });
    const data = await res.json();
    setIsUploading(false);
    alert(data.id? 'Berhasil publish!' : 'Gagal: ' + JSON.stringify(data));
  };

  const downloadGambar = () => {
    const link = document.createElement('a');
    link.download = 'agoravada.jpg';
    link.href = canvasRef.current.toDataURL('image/jpeg',0.9);
    link.click();
  };

  return (
    <div className="min-h-screen bg-[#0a0e14] text-white p-4">
      {currentPage === 3 && (
        <div className="max-w-5xl mx-auto">
          <div className="flex justify-between mb-4">
            <button onClick={()=>setCurrentPage(2)} className="px-4 py-2 bg-[#21262d] rounded">Kembali</button>
            <div className="flex gap-2">
              <button onClick={downloadGambar} className="px-4 py-2 bg-[#238636] rounded">Download</button>
              <button onClick={handleUploadToBlob} className="px-4 py-2 bg-[#f6e05e] text-black font-bold rounded">{isUploading?'Uploading...':'Upload'}</button>
            </div>
          </div>
          <canvas ref={canvasRef} className="w-full aspect-[1080/1350] bg-black rounded-xl" />
        </div>
      )}
      {currentPage === 4 && (
        <div className="max-w-4xl mx-auto space-y-6">
          <h1 className="text-xl font-bold">Page 4 - Review tanpa garis margin</h1>
          <img src={reviewImageUrl} className="w-full rounded-xl border border-[#2a3040]" />
          <textarea value={captionText} onChange={(e)=>setCaptionText(e.target.value)} className="w-full h-48 bg-[#12151d] border border-[#2f3546] rounded-xl p-3" />
          <button onClick={handlePublish} className="w-full bg-[#f6e05e] text-black font-bold py-3 rounded">{isUploading?'Publishing...':'Publish ke Instagram'}</button>
        </div>
      )}
      {currentPage!== 3 && currentPage!== 4 && (
        <div className="max-w-xl mx-auto">
          <button onClick={()=>setCurrentPage(3)} className="w-full bg-[#f6e05e] text-black font-bold py-3 rounded">Ke Editor (fix build)</button>
        </div>
      )}
    </div>
  );
}
