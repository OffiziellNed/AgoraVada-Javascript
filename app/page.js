"use client";

import React, { useState, useRef, useEffect } from 'react';

export default function AgoraVadaPortal() {
  const [currentPage, setCurrentPage] = useState(1);
  const [urlBerita, setUrlBerita] = useState('');
  const [promptTeks, setPromptTeks] = useState('');
  
  const [judul, setJudul] = useState('Halo, apa kabar');
  const [sumberBerita, setSumberBerita] = useState('Sumber: news.com');
  const [imageUrl, setImageUrl] = useState(''); 
  
  const [imgX, setImgX] = useState(0);
  const [imgY, setImgY] = useState(0);
  const [imgScale, setImgScale] = useState(1);

  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const [teksX, setTeksX] = useState(540);
  const [teksY, setTeksY] = useState(1000);
  const [ukuranFont, setUkuranFont] = useState(65);
  const [jarakBaris, setJarakBaris] = useState(1.4);
  const [alignTeks, setAlignTeks] = useState('Tengah');

  const canvasRef = useRef(null);

  const setPosisiStandar = () => {
    setImgX(0);
    setImgY(0);
    setImgScale(1);
    setTeksX(540);
    setTeksY(1000);
    setUkuranFont(65);
    setJarakBaris(1.4);
  };

  useEffect(() => {
    if (currentPage === 3) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');

      ctx.fillStyle = '#111827';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const renderFinalCanvas = (bgImg) => {
        if (bgImg) {
          ctx.save();
          const drawW = bgImg.width * imgScale;
          const drawH = bgImg.height * imgScale;
          ctx.drawImage(bgImg, imgX, imgY, drawW, drawH);
          ctx.restore();
        }

        const templateImg = new Image();
        templateImg.src = '/template.png';
        templateImg.onload = () => {
          ctx.drawImage(templateImg, 0, 0, canvas.width, canvas.height);
          
          ctx.fillStyle = '#FFFFFF';
          ctx.font = `${ukuranFont}px sans-serif`;
          ctx.textAlign = alignTeks === 'Tengah' ? 'center' : 'left';
          
          const words = judul.split(' ');
          let line = '';
          let lines = [];
          let maxWidth = 900;

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

          ctx.fillStyle = '#9CA3AF';
          ctx.font = '35px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(sumberBerita, 540, 1800);
        };

        templateImg.onerror = () => {
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

  const handleMouseDown = (e) => {
    setIsDragging(true);
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
    setDragStart({ x: clientX - imgX, y: clientY - imgY });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
    setImgX(clientX - dragStart.x);
    setImgY(clientY - dragStart.y);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const zoomIntensity = 0.05;
    if (e.deltaY < 0) {
      setImgScale((prev) => Math.min(prev + zoomIntensity, 5));
    } else {
      setImgScale((prev) => Math.max(prev - zoomIntensity, 0.1));
    }
  };

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

  const containerMaxWidth = currentPage === 3 ? '750px' : '480px';

  return (
    <div style={{ width: '100%', maxWidth: containerMaxWidth, margin: '0 auto', padding: '20px', transition: 'max-width 0.3s ease' }}>
      
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
            
            <div style={{ display: 'flex', gap: '10px' }}>
              {/* Tombol Coba Fetch (Kalau Localhost Nyala) */}
              <button 
                style={{
                  width: '50%', backgroundColor: '#21262d', color: '#c9d1d9',
                  padding: '12px', borderRadius: '10px', fontWeight: '600', fontSize: '13px',
                  border: '1px solid #30363d', cursor: 'pointer'
                }}
                onClick={async () => {
                  if (!urlBerita) return alert("Masukkan link dulu!");
                  try {
                    const res = await fetch("http://localhost:8000/tarik-berita", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ url: urlBerita })
                    });
                    const data = await res.json();
                    if(data.status === "success") {
                      setPromptTeks(data.prompt);
                      setSumberBerita(data.sumber || 'Sumber: news.com');
                      if(data.gambar_url) setImageUrl(data.gambar_url);
                      setCurrentPage(2);
                    }
                  } catch(err) {
                    alert("Gagal konek ke Python lokal. Gunakan tombol 'Langsung ke Editor' di samping.");
                  }
                }}
              >
                Tarik Data 🔄
              </button>

              {/* Tombol Langsung Loncat ke Editor (Anti-Macet) */}
              <button 
                style={{
                  width: '50%', backgroundColor: '#238636', color: '#ffffff',
                  padding: '12px', borderRadius: '10px', fontWeight: '700', fontSize: '13px',
                  border: 'none', cursor: 'pointer'
                }}
                onClick={() => {
                  if(urlBerita) setSumberBerita(`Sumber: ${new URL(urlBerita).hostname}`);
                  setCurrentPage(3);
                }}
              >
                Langsung ke Editor ➔
              </button>
            </div>
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
                minHeight: '220px', outline: 'none', marginBottom: '12px', boxSizing: 'border-box', resize: 'vertical'
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

        {/* PAGE 3: VISUAL EDITOR */}
        {currentPage === 3 && (
          <div>
            <h2 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '14px', color: '#c9d1d9', borderBottom: '1px solid #30363d', paddingBottom: '8px' }}>
              3. Editor Visual Otomatis (Live Drag & Drop)
            </h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: '600', color: '#8b949e', display: 'block', marginBottom: '4px' }}>GANTI / UPLOAD FOTO</label>
                  <input 
                    type="file" accept="image/*" 
                    onChange={handleUploadFoto}
                    style={{ fontSize: '11px', color: '#c9d1d9', width: '100%' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: '600', color: '#8b949e', display: 'block', marginBottom: '4px' }}>EDIT JUDUL (HOOK)</label>
                  <textarea 
                    style={{
                      width: '100%', backgroundColor: '#0d1117', border: '1px solid #30363d',
                      color: '#ffffff', padding: '8px', borderRadius: '8px', fontSize: '12px',
                      minHeight: '80px', outline: 'none', boxSizing: 'border-box'
                    }}
                    value={judul}
                    onChange={(e) => setJudul(e.target.value)}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: '600', color: '#8b949e', display: 'block', marginBottom: '4px' }}>SUMBER BERITA</label>
                  <input 
                    type="text" 
                    style={{
                      width: '100%', backgroundColor: '#0d1117', border: '1px solid #30363d',
                      color: '#ffffff', padding: '8px', borderRadius: '8px', fontSize: '12px',
                      outline: 'none', boxSizing: 'border-box'
                    }}
                    value={sumberBerita}
                    onChange={(e) => setSumberBerita(e.target.value)}
                  />
                </div>

                <div style={{ backgroundColor: '#0d1117', padding: '8px', borderRadius: '8px', border: '1px solid #30363d' }}>
                  <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#58a6ff', display: 'block', marginBottom: '4px' }}>Zoom Gambar:</span>
                  <input 
                    type="range" min="0.2" max="3" step="0.05" 
                    value={imgScale} 
                    onChange={(e) => setImgScale(parseFloat(e.target.value))} 
                    style={{ width: '100%', accentColor: '#1f6feb' }} 
                  />
                </div>

                <button 
                  style={{
                    width: '100%', backgroundColor: 'rgba(210, 153, 34, 0.1)', border: '1px solid rgba(210, 153, 34, 0.4)',
                    color: '#f0b429', padding: '8px', borderRadius: '8px', fontWeight: '600', fontSize: '11px', cursor: 'pointer'
                  }}
                  onClick={setPosisiStandar}
                >
                  🎯 Reset Posisi Gambar
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '10px', color: '#8b949e', marginBottom: '4px' }}>*Geser gambar dengan Mouse/Sentuhan & Scroll untuk Zoom</span>
                <div style={{ 
                  backgroundColor: '#0d1117', border: '2px dashed #30363d', borderRadius: '10px', padding: '4px', 
                  cursor: isDragging ? 'grabbing' : 'grab', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <canvas 
                    ref={canvasRef} 
                    width="1080" 
                    height="1920" 
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    onTouchStart={handleMouseDown}
                    onTouchMove={handleMouseMove}
                    onTouchEnd={handleMouseUp}
                    onWheel={handleWheel}
                    style={{ width: '220px', height: 'auto', borderRadius: '6px', display: 'block', touchAction: 'none' }}
                  ></canvas>
                </div>
              </div>

            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '16px', borderTop: '1px solid #30363d', paddingTop: '12px' }}>
              <button 
                style={{ width: '35%', backgroundColor: '#21262d', color: '#c9d1d9', padding: '10px', borderRadius: '8px', fontWeight: '600', fontSize: '12px', border: '1px solid #30363d', cursor: 'pointer' }}
                onClick={() => setCurrentPage(1)}
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
        )}

      </div>
    </div>
  );
}
