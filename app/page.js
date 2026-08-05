"use client";

import React, { useState, useRef, useEffect } from 'react';

export default function AgoraVadaPortal() {
  const [currentPage, setCurrentPage] = useState(1);
  const [urlBerita, setUrlBerita] = useState('');
  const [promptTeks, setPromptTeks] = useState('');
  
  // State Teks
  const [judul, setJudul] = useState('Halo, [Y]apa kabar[/Y] kawan');
  const [sumberBerita, setSumberBerita] = useState('Sumber: news.com');
  const [imageUrl, setImageUrl] = useState(''); 
  
  // ==========================================
  // STATE POSISI & UKURAN (BOARD KONTROL)
  // ==========================================
  
  // Board 1: Gambar
  const [imgX, setImgX] = useState(0);
  const [imgY, setImgY] = useState(0);
  const [imgScale, setImgScale] = useState(1);

  // Board 2: Teks Judul 
  // (State awal dibikin terlihat di kanvas 1350. Kalau ikon 🔒 ditap, baru ke setelan 3630)
  const [teksX, setTeksX] = useState(540);
  const [teksY, setTeksY] = useState(800);
  const [ukuranFont, setUkuranFont] = useState(65);
  const [jarakBaris, setJarakBaris] = useState(1.4);
  const [alignTeks, setAlignTeks] = useState('Kiri');

  // Board 3: Sumber Berita
  const [sumberX, setSumberX] = useState(540);
  const [sumberY, setSumberY] = useState(1250);
  const [ukuranFontSumber, setUkuranFontSumber] = useState(35);

  const canvasRef = useRef(null);

  // Load Custom Font (Poppins)
  useEffect(() => {
    const loadFonts = async () => {
      try {
        const fontSB = new FontFace('PoppinsSemiBold', 'url(/Poppins-SemiBold.ttf)');
        await fontSB.load();
        document.fonts.add(fontSB);

        const fontSBI = new FontFace('PoppinsSemiBoldItalic', 'url(/Poppins-SemiBoldItalic.ttf)');
        await fontSBI.load();
        document.fonts.add(fontSBI);
      } catch (err) {
        console.warn("Font Poppins gagal di-load. Pastikan file ttf ada di folder public.", err);
      }
    };
    loadFonts();
  }, []);

  // Fungsi Inject Warna ke Textarea
  const applyColorTag = (tagStart, tagEnd) => {
    const textarea = document.getElementById('judul-textarea');
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    if (start === end) return alert("Sorot (blok) teksnya dulu pakai kursor/jari, bos!");
    
    const selectedText = judul.substring(start, end);
    const newText = judul.substring(0, start) + tagStart + selectedText + tagEnd + judul.substring(end);
    setJudul(newText);
  };

  // MESIN RENDER RICH-TEXT 
  const renderRichText = (ctx, text, x, y, maxWidth, lineHeight, align, fontStyle) => {
    const cleanText = (str) => str.replace(/\[Y\]/g, '').replace(/\[\/Y\]/g, '').replace(/\[W\]/g, '').replace(/\[\/W\]/g, '');
    
    ctx.textAlign = 'left'; 
    ctx.textBaseline = 'top'; 
    ctx.font = fontStyle;

    const paragraphs = text.split('\n');
    let currentY = y;

    paragraphs.forEach(paragraph => {
      const words = paragraph.split(' ');
      let line = [];
      let lines = [];

      words.forEach(word => {
        let testLine = [...line, word].join(' ');
        let testWidth = ctx.measureText(cleanText(testLine)).width;
        if (testWidth > maxWidth && line.length > 0) {
          lines.push(line);
          line = [word];
        } else {
          line.push(word);
        }
      });
      if (line.length > 0) lines.push(line);

      let currentColor = '#FFFFFF'; 

      lines.forEach(lineArr => {
        const lineString = lineArr.join(' ');
        const cleanLineString = cleanText(lineString);
        const lineWidth = ctx.measureText(cleanLineString).width;

        let startX = x;
        if (align === 'Tengah') {
          startX = x - (lineWidth / 2); 
        }

        const chunks = lineString.split(/(\[Y\]|\[\/Y\]|\[W\]|\[\/W\])/).filter(Boolean);
        let currentX = startX;

        chunks.forEach(chunk => {
          if (chunk === '[Y]') currentColor = '#E7E820';
          else if (chunk === '[/Y]') currentColor = '#FFFFFF';
          else if (chunk === '[W]') currentColor = '#FFFFFF';
          else if (chunk === '[/W]') currentColor = '#FFFFFF';
          else {
            ctx.fillStyle = currentColor;
            ctx.fillText(chunk, currentX, currentY);
            currentX += ctx.measureText(chunk).width;
          }
        });
        currentY += lineHeight;
      });
    });
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
        templateImg.src = '/Agora Vada Template.png';
        
        templateImg.onload = () => {
          ctx.drawImage(templateImg, 0, 0, canvas.width, canvas.height);
          drawAllTexts(ctx);
        };

        templateImg.onerror = () => {
          drawAllTexts(ctx);
        };
      };

      const drawAllTexts = (ctx) => {
        // Render Judul dengan Multi-Warna
        const fontJudul = `${ukuranFont}px PoppinsSemiBold, sans-serif`;
        const maxWidth = 900;
        const lh = ukuranFont * jarakBaris;
        renderRichText(ctx, judul, teksX, teksY, maxWidth, lh, alignTeks, fontJudul);

        // Render Sumber Berita (Warna Putih Solid)
        ctx.fillStyle = '#FFFFFF';
        ctx.font = `${ukuranFontSumber}px PoppinsSemiBold, sans-serif`;
        
        let finalSumberX = sumberX;
        if(alignTeks === 'Tengah' && sumberX === 540) {
           ctx.textAlign = 'center';
        } else if (alignTeks === 'Kiri') {
           ctx.textAlign = 'left';
        } else {
           ctx.textAlign = 'left';
        }
        ctx.textBaseline = 'top';
        ctx.fillText(sumberBerita, sumberX, sumberY);
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
  }, [currentPage, judul, sumberBerita, imageUrl, imgX, imgY, imgScale, teksX, teksY, ukuranFont, jarakBaris, alignTeks, sumberX, sumberY, ukuranFontSumber]);

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

  const containerMaxWidth = currentPage === 3 ? '850px' : '480px';

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

        {/* ================= PAGE 1 ================= */}
        {currentPage === 1 && (
          <div>
            <h2 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px', color: '#c9d1d9', borderBottom: '1px solid #30363d', paddingBottom: '8px' }}>
              1. Masukkan Link Berita
            </h2>
            <input 
              type="text" 
              placeholder="https://news.com/..." 
              style={{ width: '100%', backgroundColor: '#0d1117', border: '1px solid #30363d', color: '#ffffff', padding: '12px 14px', borderRadius: '10px', fontSize: '14px', outline: 'none', marginBottom: '16px', boxSizing: 'border-box' }}
              value={urlBerita}
              onChange={(e) => setUrlBerita(e.target.value)}
            />
            
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                style={{ width: '50%', backgroundColor: '#21262d', color: '#c9d1d9', padding: '12px', borderRadius: '10px', fontWeight: '600', fontSize: '13px', border: '1px solid #30363d', cursor: 'pointer' }}
                onClick={async () => {
                  if (!urlBerita) return alert("Masukkan link dulu!");
                  try {
                    const res = await fetch("http://localhost:8000/tarik-berita", {
                      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: urlBerita })
                    });
                    const data = await res.json();
                    if(data.status === "success") {
                      setPromptTeks(data.prompt); setSumberBerita(data.sumber || 'Sumber: news.com');
                      if(data.gambar_url) setImageUrl(data.gambar_url);
                      setCurrentPage(2);
                    }
                  } catch(err) { alert("Gagal konek ke Python lokal. Gunakan tombol 'Langsung ke Editor' di samping."); }
                }}
              >Tarik Data 🔄</button>
              <button 
                style={{ width: '50%', backgroundColor: '#238636', color: '#ffffff', padding: '12px', borderRadius: '10px', fontWeight: '700', fontSize: '13px', border: 'none', cursor: 'pointer' }}
                onClick={() => {
                  if(urlBerita) {
                    try { setSumberBerita(`Sumber: ${new URL(urlBerita).hostname}`); } 
                    catch(e) { setSumberBerita('Sumber: news.com'); }
                  }
                  setCurrentPage(3);
                }}
              >Langsung ke Editor ➔</button>
            </div>
          </div>
        )}

        {/* ================= PAGE 2 ================= */}
        {currentPage === 2 && (
          <div>
            <h2 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px', color: '#c9d1d9', borderBottom: '1px solid #30363d', paddingBottom: '8px' }}>
              2. Prompt Manual & Edit Teks
            </h2>
            <textarea 
              style={{ width: '100%', backgroundColor: '#0d1117', border: '1px solid #30363d', color: '#e6edf3', padding: '12px', borderRadius: '10px', fontSize: '13px', minHeight: '220px', outline: 'none', marginBottom: '12px', boxSizing: 'border-box', resize: 'vertical' }}
              value={promptTeks}
              onChange={(e) => setPromptTeks(e.target.value)}
            />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button style={{ width: '35%', backgroundColor: '#21262d', color: '#c9d1d9', padding: '12px', borderRadius: '10px', fontWeight: '600', fontSize: '13px', border: '1px solid #30363d', cursor: 'pointer' }} onClick={() => setCurrentPage(1)}>⬅ Kembali</button>
              <button style={{ width: '65%', backgroundColor: '#1f6feb', color: '#ffffff', padding: '12px', borderRadius: '10px', fontWeight: '600', fontSize: '13px', border: 'none', cursor: 'pointer' }} onClick={() => setCurrentPage(3)}>Ke Visual Editor ➔</button>
            </div>
          </div>
        )}

        {/* ================= PAGE 3 ================= */}
        {currentPage === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* PREVIEW BESAR */}
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '12px', color: '#c9d1d9', textAlign: 'center' }}>
                LIVE PREVIEW (1080 x 1350)
              </h2>
              <div style={{ backgroundColor: '#0d1117', border: '2px dashed #30363d', borderRadius: '10px', padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <canvas 
                  ref={canvasRef} 
                  width="1080" 
                  height="1350" 
                  style={{ width: '300px', height: 'auto', borderRadius: '6px', border: '1px solid #30363d' }}
                ></canvas>
              </div>
            </div>

            {/* KONTROL BOARDS */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              
              {/* KOLOM KIRI: EDIT TEKS, WARNA & SUMBER */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                
                {/* BOARD EDIT TEKS & WARNA */}
                <div style={{ backgroundColor: '#0d1117', padding: '16px', borderRadius: '12px', border: '1px solid #30363d' }}>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#58a6ff', display: 'block', marginBottom: '10px', letterSpacing: '1px' }}>📝 EDIT JUDUL, WARNA & ALIGN</label>
                  
                  {/* BARIS ALAT: WARNA & ALIGN */}
                  <div style={{ display: 'flex', gap: '12px', marginBottom: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                    
                    {/* TOMBOL WARNA */}
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <span style={{ fontSize: '10px', color: '#8b949e', marginRight: '4px' }}>Warna:</span>
                      <button onClick={() => applyColorTag('[W]', '[/W]')} style={{ backgroundColor: '#FFFFFF', color: '#000', padding: '6px 12px', borderRadius: '6px', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer', border: 'none' }}>Putih</button>
                      <button onClick={() => applyColorTag('[Y]', '[/Y]')} style={{ backgroundColor: '#E7E820', color: '#000', padding: '6px 12px', borderRadius: '6px', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer', border: 'none' }}>Kuning</button>
                    </div>

                    <div style={{ width: '1px', height: '20px', backgroundColor: '#30363d' }}></div>

                    {/* SIMBOL RATA TEKS */}
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <span style={{ fontSize: '10px', color: '#8b949e', marginRight: '4px' }}>Align:</span>
                      <button 
                        onClick={() => setAlignTeks('Kiri')} 
                        style={{ padding: '6px 10px', borderRadius: '6px', backgroundColor: alignTeks === 'Kiri' ? '#1f6feb' : '#21262d', color: '#fff', border: '1px solid #30363d', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                        title="Rata Kiri"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="12" x2="15" y2="12"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
                      </button>
                      <button 
                        onClick={() => setAlignTeks('Tengah')} 
                        style={{ padding: '6px 10px', borderRadius: '6px', backgroundColor: alignTeks === 'Tengah' ? '#1f6feb' : '#21262d', color: '#fff', border: '1px solid #30363d', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                        title="Rata Tengah"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="6" x2="21" y2="6"></line><line x1="6" y1="12" x2="18" y2="12"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
                      </button>
                    </div>
                  </div>

                  <textarea 
                    id="judul-textarea"
                    style={{ width: '100%', backgroundColor: '#161b22', border: '1px solid #30363d', color: '#ffffff', padding: '10px', borderRadius: '8px', fontSize: '13px', minHeight: '90px', outline: 'none', boxSizing: 'border-box' }}
                    value={judul}
                    onChange={(e) => setJudul(e.target.value)}
                  />
                </div>

                {/* BOARD EDIT SUMBER BERITA */}
                <div style={{ backgroundColor: '#0d1117', padding: '16px', borderRadius: '12px', border: '1px solid #30363d' }}>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#58a6ff', display: 'block', marginBottom: '8px', letterSpacing: '1px' }}>🔗 SUMBER BERITA</label>
                  <input 
                    type="text" 
                    style={{ width: '100%', backgroundColor: '#161b22', border: '1px solid #30363d', color: '#ffffff', padding: '10px', borderRadius: '8px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
                    value={sumberBerita}
                    onChange={(e) => setSumberBerita(e.target.value)}
                  />
                </div>
              </div>

              {/* KOLOM KANAN: BOARDS KONTROL KOORDINAT */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                
                {/* BOARD KONTROL GAMBAR */}
                <div style={{ backgroundColor: '#0d1117', padding: '12px 16px', borderRadius: '12px', border: '1px solid #30363d' }}>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#3fb950', display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span>🖼️ KONTROL GAMBAR</span>
                    <input type="file" accept="image/*" onChange={handleUploadFoto} style={{ fontSize: '9px', width: '90px' }} />
                  </label>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
                    <div>
                      <span style={{ fontSize: '10px', color: '#8b949e', display: 'flex', justifyContent: 'space-between' }}><span>Zoom Skala</span> <span>{imgScale.toFixed(2)}</span></span>
                      <input type="range" min="0.2" max="3" step="0.05" value={imgScale} onChange={(e) => setImgScale(parseFloat(e.target.value))} style={{ width: '100%', accentColor: '#3fb950' }} />
                    </div>
                    <div>
                      <span style={{ fontSize: '10px', color: '#8b949e', display: 'flex', justifyContent: 'space-between' }}><span>Geser X</span> <span>{imgX}</span></span>
                      <input type="range" min="-1000" max="1000" step="10" value={imgX} onChange={(e) => setImgX(parseInt(e.target.value))} style={{ width: '100%', accentColor: '#3fb950' }} />
                    </div>
                    <div>
                      <span style={{ fontSize: '10px', color: '#8b949e', display: 'flex', justifyContent: 'space-between' }}><span>Geser Y</span> <span>{imgY}</span></span>
                      <input type="range" min="-1000" max="1000" step="10" value={imgY} onChange={(e) => setImgY(parseInt(e.target.value))} style={{ width: '100%', accentColor: '#3fb950' }} />
                    </div>
                  </div>
                </div>

                {/* BOARD KONTROL TEKS JUDUL (ADA IKON GEMBOK) */}
                <div style={{ backgroundColor: '#0d1117', padding: '12px 16px', borderRadius: '12px', border: '1px solid #30363d' }}>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#a371f7', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span>✨ KONTROL POSISI JUDUL</span>
                    <button 
                      onClick={() => { setTeksX(600); setTeksY(3630); setUkuranFont(330); setJarakBaris(1.4); }} 
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', padding: 0 }} 
                      title="Kunci Posisi Standar Awal"
                    >
                      🔒
                    </button>
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
                    <div>
                      <span style={{ fontSize: '10px', color: '#8b949e', display: 'flex', justifyContent: 'space-between' }}><span>Ukuran Font</span> <span>{ukuranFont}</span></span>
                      <input type="range" min="30" max="400" step="1" value={ukuranFont} onChange={(e) => setUkuranFont(parseInt(e.target.value))} style={{ width: '100%', accentColor: '#a371f7' }} />
                    </div>
                    <div>
                      <span style={{ fontSize: '10px', color: '#8b949e', display: 'flex', justifyContent: 'space-between' }}><span>Geser X</span> <span>{teksX}</span></span>
                      <input type="range" min="-500" max="1500" step="10" value={teksX} onChange={(e) => setTeksX(parseInt(e.target.value))} style={{ width: '100%', accentColor: '#a371f7' }} />
                    </div>
                    <div>
                      <span style={{ fontSize: '10px', color: '#8b949e', display: 'flex', justifyContent: 'space-between' }}><span>Geser Y (Atas/Bawah)</span> <span>{teksY}</span></span>
                      <input type="range" min="-500" max="4000" step="10" value={teksY} onChange={(e) => setTeksY(parseInt(e.target.value))} style={{ width: '100%', accentColor: '#a371f7' }} />
                    </div>
                  </div>
                </div>

                {/* BOARD KONTROL SUMBER BERITA (ADA IKON GEMBOK) */}
                <div style={{ backgroundColor: '#0d1117', padding: '12px 16px', borderRadius: '12px', border: '1px solid #30363d' }}>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#f78166', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span>📍 KONTROL POSISI SUMBER</span>
                    <button 
                      onClick={() => { setSumberX(540); setSumberY(1250); setUkuranFontSumber(35); }} 
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', padding: 0 }} 
                      title="Kunci Posisi Standar Awal"
                    >
                      🔒
                    </button>
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
                    <div>
                      <span style={{ fontSize: '10px', color: '#8b949e', display: 'flex', justifyContent: 'space-between' }}><span>Ukuran Font</span> <span>{ukuranFontSumber}</span></span>
                      <input type="range" min="15" max="150" step="1" value={ukuranFontSumber} onChange={(e) => setUkuranFontSumber(parseInt(e.target.value))} style={{ width: '100%', accentColor: '#f78166' }} />
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <div style={{ flex: 1 }}>
                        <span style={{ fontSize: '10px', color: '#8b949e', display: 'flex', justifyContent: 'space-between' }}><span>Geser X</span></span>
                        <input type="range" min="0" max="1080" step="10" value={sumberX} onChange={(e) => setSumberX(parseInt(e.target.value))} style={{ width: '100%', accentColor: '#f78166' }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <span style={{ fontSize: '10px', color: '#8b949e', display: 'flex', justifyContent: 'space-between' }}><span>Geser Y</span></span>
                        <input type="range" min="0" max="2000" step="10" value={sumberY} onChange={(e) => setSumberY(parseInt(e.target.value))} style={{ width: '100%', accentColor: '#f78166' }} />
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* TOMBOL NAVIGASI BAWAH */}
            <div style={{ display: 'flex', gap: '10px', borderTop: '1px solid #30363d', paddingTop: '16px' }}>
              <button style={{ width: '30%', backgroundColor: '#21262d', color: '#c9d1d9', padding: '14px', borderRadius: '10px', fontWeight: '600', fontSize: '13px', border: '1px solid #30363d', cursor: 'pointer' }} onClick={() => setCurrentPage(2)}>⬅ Kembali</button>
              <button style={{ width: '70%', backgroundColor: '#238636', color: '#ffffff', padding: '14px', borderRadius: '10px', fontWeight: '700', fontSize: '14px', border: 'none', cursor: 'pointer' }} onClick={downloadGambar}>📥 Download Postingan IG</button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
