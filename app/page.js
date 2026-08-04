"use client";

import React, { useState, useRef, useEffect } from 'react';

export default function AgoraVadaPortal() {
  const [currentPage, setCurrentPage] = useState(1);
  const [urlBerita, setUrlBerita] = useState('');
  const [promptTeks, setPromptTeks] = useState('');
  
  // State Editor Visual
  const [judul, setJudul] = useState('Halo, apa kabar');
  const [sumberBerita, setSumberBerita] = useState('Sumber Berita: news.com');
  const [imageUrl, setImageUrl] = useState(''); // Menyimpan URL gambar dari berita / upload
  
  // State Kontrol Posisi & Ukuran Gambar Berita (Layer Bawah)
  const [imgX, setImgX] = useState(0);
  const [imgY, setImgY] = useState(0);
  const [imgScale, setImgScale] = useState(1); // 1 = 100%

  // State Posisi Teks Judul
  const [teksX, setTeksX] = useState(540);
  const [teksY, setTeksY] = useState(1000);
  const [ukuranFont, setUkuranFont] = useState(65);
  const [jarakBaris, setJarakBaris] = useState(1.4);
  const [alignTeks, setAlignTeks] = useState('Tengah');

  const canvasRef = useRef(null);

  // Fungsi Reset Posisi Standar
  const setPosisiStandar = () => {
    setImgX(0);
    setImgY(0);
    setImgScale(1);
    setTeksX(540);
    setTeksY(1000);
    setUkuranFont(65);
    setJarakBaris(1.4);
  };

  // Render Canvas setiap ada perubahan state
  useEffect(() => {
    if (currentPage === 3) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');

      // 1. Gambar Background Dasar (Hitam/Abu Gelap)
      ctx.fillStyle = '#111827';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 2. Gambar Layer Foto Berita (Di bawah template)
      const renderFinalCanvas = (bgImg) => {
        if (bgImg) {
          ctx.save();
          // Hitung posisi & skala interaktif foto berita
          const drawW = bgImg.width * imgScale;
          const drawH = bgImg.height * imgScale;
          ctx.drawImage(bgImg, imgX, imgY, drawW, drawH);
          ctx.restore();
        }

        // 3. Gambar Layer Template Utama (Di atas foto berita)
        // (Ganti '/template.png' dengan path file template frame lo di folder public, atau load via Image)
        const templateImg = new Image();
        templateImg.src = '/template.png'; // Letakkan file template.png di folder public Next.js lo
        templateImg.onload = () => {
          ctx.drawImage(templateImg, 0, 0, canvas.width, canvas.height);
          
          // 4. Render Teks Judul (Hook)
          ctx.fillStyle = '#FFFFFF';
          ctx.font = `${ukuranFont}px sans-serif`;
          ctx.textAlign = alignTeks === 'Tengah' ? 'center' : 'left';
          
          // Word Wrap Teks Judul
          const words = judul.split(' ');
          let line = '';
          let lines = [];
          let maxWidth = 900; // Lebar maksimal area teks

          for(let n = 0; n < words.length; n++) {
            let testLine = line + words[n] + ' ';
            let metrics = ctx.measureText(testLine);
            let testWidth = metrics.width;
            if (testWidth > maxWidth && n > 0) {
              lines.push(line);
              line = words[n] + ' ';
            } else {
              line = testLine;
            }
          }
          lines.push(line);

          let currentY = teksY;
          let lineHeight = ukuranFont * jarakBaris;
          for (let k = 0; k < lines.length; k++) {
            ctx.fillText(lines[k], teksX, currentY + (k * lineHeight));
          }

          // 5. Render Sumber Berita (Fix di bagian bawah)
          ctx.fillStyle = '#9CA3AF';
          ctx.font = '35px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(sumberBerita, 540, 1800);
        };

        templateImg.onerror = () => {
          // Jika file template.png belum ada, tetap render teks & gambar agar tidak blank
          ctx.fillStyle = '#FFFFFF';
          ctx.font = `${ukuranFont}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.fillText(judul, teksX, teksY);
        };
      };

      if (imageUrl) {
        const userImg = new Image();
        userImg.crossOrigin = 'anonymous';
        userImg.src = imageUrl;
        userImg.onload = () => renderFinalCanvas(userImg);
        userImg.onerror = () => renderFinalCanvas(null);
      } else {
        renderFinalCanvas(null);
      }
    }
  }, [currentPage, judul, sumberBerita, imageUrl, imgX, imgY, imgScale, teksX, teksY, ukuranFont, jarakBaris, alignTeks]);

  // Handler Upload Foto Manual dari Komputer
  const handleUploadFoto = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setImageUrl(url);
    }
  };

  const downloadGambar = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const url = canvas.toDataURL("image/jpeg", 0.95);
      const link = document.createElement('a');
      link.download = 'AgoraVada_Post.jpg';
      link.href = url;
      link.click();
    }
  };

  return (
    <div style={{ width: '100%', maxWidth: '520px', margin: '0 auto', padding: '20px' }}>
      
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: '800', letterSpacing: '1px', color: '#ffffff' }}>
          ⚡ AGORA VADA
        </h1>
      </div>

      <div style={{ 
        backgroundColor: '#161b22', 
        border: '1px solid #30363d', 
        borderRadius: '16px', 
        padding: '24px', 
        boxShadow: '0 10px 25px rgba(0,0,0,0.5)' 
      }}>

        {/* PAGE 1 */}
        {currentPage === 1 && (
          <div>
            <h2 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px', color: '#c9d1d9', borderBottom: '1px solid #30363d', paddingBottom: '8px' }}>
              1. Masukkan Link Berita
            </h2>
            <input 
              type="text" 
              placeholder="https://news.com/..." 
              style={{
                width: '100%', backgroundColor: '#0d1117', border: '1px solid #30363d',
                color: '#ffffff', padding: '12px 14px', borderRadius: '10px', fontSize: '14px',
                outline: 'none', marginBottom: '16px', boxSizing: 'border-box'
              }}
              value={urlBerita}
              onChange={(e) => setUrlBerita(e.target.value)}
            />
            <button 
              style={{
                width: '100%', backgroundColor: '#238636', color: '#ffffff',
                padding: '12px', borderRadius: '10px', fontWeight: '700', fontSize: '14px',
                border: 'none', cursor: 'pointer'
              }}
              onClick={async () => {
                if (!urlBerita) return alert("Masukkan link dulu, bos!");
                setPromptTeks("Menyedot data dari web, tunggu sebentar...");
                setCurrentPage(2);
                try {
                  const res = await fetch("http://localhost:8000/tarik-berita", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ url: urlBerita })
                  });
                  const data = await res.json();
                  if(data.status === "success") {
                    setPromptTeks(data.prompt);
                    setSumberBerita(data.sumber);
                    if(data.gambar_url) setImageUrl(data.gambar_url); // Set gambar otomatis dari berita
                  } else {
                    setPromptTeks("Gagal menarik berita: " + data.detail);
                  }
                } catch(err) {
                  setPromptTeks("Error: Pastikan server API Python lo udah nyala di localhost:8000!");
                }
              }}
            >
              Tarik Teks & Lanjut ➔
            </button>
          </div>
        )}

        {/* PAGE 2 */}
        {currentPage === 2 && (
          <div>
            <h2 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px', color: '#c9d1d9', borderBottom: '1px solid #30363d', paddingBottom: '8px' }}>
              2. Prompt Manual & Edit Teks
            </h2>
            <textarea 
              style={{
                width: '100%', backgroundColor: '#0d1117', border: '1px solid #30363d',
                color: '#e6edf3', padding: '12px', borderRadius: '10px', fontSize: '13px',
                minHeight: '260px', outline: 'none', marginBottom: '16px', boxSizing: 'border-box', resize: 'vertical'
              }}
              value={promptTeks}
              onChange={(e) => setPromptTeks(e.target.value)}
            />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                style={{ width: '35%', backgroundColor: '#21262d', color: '#c9d1d9', padding: '12px', borderRadius: '10px', fontWeight: '600', fontSize: '13px', border: '1px solid #30363d', cursor: 'pointer' }}
                onClick={() => setCurrentPage(1)}
              >
                ⬅ Kembali
              </button>
              <button 
                style={{ width: '65%', backgroundColor: '#1f6feb', color: '#ffffff', padding: '12px', borderRadius: '10px', fontWeight: '600', fontSize: '13px', border: 'none', cursor: 'pointer' }}
                onClick={() => setCurrentPage(3)}
              >
                Ke Visual Editor ➔
              </button>
            </div>
          </div>
        )}

        {/* PAGE 3: VISUAL EDITOR INTERAKTIF */}
        {currentPage === 3 && (
          <div>
            <h2 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '14px', color: '#c9d1d9', borderBottom: '1px solid #30363d', paddingBottom: '8px' }}>
              3. Editor Visual Otomatis
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              
              {/* UPLOAD / GANTI FOTO MANUAL */}
              <div>
                <label style={{ fontSize: '11px', fontWeight: '600', color: '#8b949e', display: 'block', marginBottom: '4px' }}>GANTI / UPLOAD FOTO BERITA</label>
                <input 
                  type="file" accept="image/*" 
                  onChange={handleUploadFoto}
                  style={{ fontSize: '12px', color: '#c9d1d9', width: '100%' }}
                />
              </div>

              {/* EDIT JUDUL */}
              <div>
                <label style={{ fontSize: '11px', fontWeight: '600', color: '#8b949e', display: 'block', marginBottom: '4px' }}>EDIT JUDUL (HOOK)</label>
                <textarea 
                  style={{
                    width: '100%', backgroundColor: '#0d1117', border: '1px solid #30363d',
                    color: '#ffffff', padding: '8px', borderRadius: '8px', fontSize: '12px',
                    minHeight: '60px', outline: 'none', boxSizing: 'border-box'
                  }}
                  value={judul}
                  onChange={(e) => setJudul(e.target.value)}
                />
              </div>

              {/* KONTROL GESER UKURAN & POSISI FOTO */}
              <div style={{ backgroundColor: '#0d1117', padding: '10px', borderRadius: '8px', border: '1px solid #30363d' }}>
                <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#58a6ff', display: 'block', marginBottom: '6px' }}>Pengaturan Layer Foto:</span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px', fontSize: '11px' }}>
                  <div>
                    <label style={{ color: '#8b949e' }}>Zoom:</label>
                    <input type="range" min="0.2" max="3" step="0.05" value={imgScale} onChange={(e) => setImgScale(parseFloat(e.target.value))} style={{ width: '100%' }} />
                  </div>
                  <div>
                    <label style={{ color: '#8b949e' }}>Geser X:</label>
                    <input type="range" min="-500" max="500" step="10" value={imgX} onChange={(e) => setImgX(parseInt(e.target.value))} style={{ width: '100%' }} />
                  </div>
                  <div>
                    <label style={{ color: '#8b949e' }}>Geser Y:</label>
                    <input type="range" min="-500" max="500" step="10" value={imgY} onChange={(e) => setImgY(parseInt(e.target.value))} style={{ width: '100%' }} />
                  </div>
                </div>
              </div>

              <button 
                style={{
                  width: '100%', backgroundColor: 'rgba(210, 153, 34, 0.1)', border: '1px solid rgba(210, 153, 34, 0.4)',
                  color: '#f0b429', padding: '8px', borderRadius: '8px', fontWeight: '600', fontSize: '11px', cursor: 'pointer'
                }}
                onClick={setPosisiStandar}
              >
                🎯 Kembalikan ke Posisi Standar
              </button>

              {/* PREVIEW CANVAS */}
              <div style={{ backgroundColor: '#0d1117', border: '1px solid #30363d', borderRadius: '10px', padding: '8px', textAlign: 'center' }}>
                <canvas 
                  ref={canvasRef} 
                  width="1080" 
                  height="1920" 
                  style={{ width: '130px', height: 'auto', borderRadius: '6px', border: '1px solid #30363d' }}
                ></canvas>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                <button 
                  style={{ width: '35%', backgroundColor: '#21262d', color: '#c9d1d9', padding: '10px', borderRadius: '8px', fontWeight: '600', fontSize: '12px', border: '1px solid #30363d', cursor: 'pointer' }}
                  onClick={() => setCurrentPage(2)}
                >
                  ⬅ Kembali
                </button>
                <button 
                  style={{ width: '65%', backgroundColor: '#238636', color: '#ffffff', padding: '10px', borderRadius: '8px', fontWeight: '700', fontSize: '12px', border: 'none', cursor: 'pointer' }}
                  onClick={downloadGambar}
                >
                  📥 Save Image
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
