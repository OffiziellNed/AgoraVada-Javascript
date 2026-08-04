"use client";

import React, { useState, useRef } from 'react';

export default function AgoraVadaPortal() {
  const [currentPage, setCurrentPage] = useState(1);
  const [urlBerita, setUrlBerita] = useState('');
  const [promptTeks, setPromptTeks] = useState('');
  const [judul, setJudul] = useState('');
  const [sumberBerita, setSumberBerita] = useState('');
  
  const [ukuranFont, setUkuranFont] = useState(330);
  const [teksX, setTeksX] = useState(600);
  const [teksY, setTeksY] = useState(3630);
  const [jarakBaris, setJarakBaris] = useState(1.4);
  const [alignTeks, setAlignTeks] = useState('Tengah');
  
  const canvasRef = useRef(null);

  const setPosisiStandar = () => {
    setUkuranFont(330);
    setTeksX(600);
    setTeksY(3630);
    setJarakBaris(1.4);
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
    <div style={{ width: '100%', maxWidth: '480px', margin: '0 auto', padding: '20px' }}>
      
      {/* JUDUL */}
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '800', letterSpacing: '1px', color: '#ffffff' }}>
          ⚡ AGORA VADA
        </h1>
      </div>

      {/* KARTU UTAMA (DI KUNCI UKURANNYA) */}
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
              style={{
                width: '100%',
                backgroundColor: '#0d1117',
                border: '1px solid #30363d',
                color: '#ffffff',
                padding: '12px 14px',
                borderRadius: '10px',
                fontSize: '14px',
                outline: 'none',
                marginBottom: '16px',
                boxSizing: 'border-box'
              }}
              value={urlBerita}
              onChange={(e) => setUrlBerita(e.target.value)}
            />
            <button 
              style={{
                width: '100%',
                backgroundColor: '#238636',
                color: '#ffffff',
                padding: '12px',
                borderRadius: '10px',
                fontWeight: '700',
                fontSize: '14px',
                border: 'none',
                cursor: 'pointer',
                transition: 'background 0.2s'
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

        {/* ================= PAGE 2 ================= */}
        {currentPage === 2 && (
          <div>
            <h2 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px', color: '#c9d1d9', borderBottom: '1px solid #30363d', paddingBottom: '8px' }}>
              2. Prompt Manual & Edit Teks
            </h2>
            <textarea 
              style={{
                width: '100%',
                backgroundColor: '#0d1117',
                border: '1px solid #30363d',
                color: '#e6edf3',
                padding: '12px',
                borderRadius: '10px',
                fontSize: '13px',
                minHeight: '260px',
                outline: 'none',
                marginBottom: '16px',
                boxSizing: 'border-box',
                resize: 'vertical'
              }}
              value={promptTeks}
              onChange={(e) => setPromptTeks(e.target.value)}
            />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                style={{
                  width: '35%',
                  backgroundColor: '#21262d',
                  color: '#c9d1d9',
                  padding: '12px',
                  borderRadius: '10px',
                  fontWeight: '600',
                  fontSize: '13px',
                  border: '1px solid #30363d',
                  cursor: 'pointer'
                }}
                onClick={() => setCurrentPage(1)}
              >
                ⬅ Kembali
              </button>
              <button 
                style={{
                  width: '65%',
                  backgroundColor: '#1f6feb',
                  color: '#ffffff',
                  padding: '12px',
                  borderRadius: '10px',
                  fontWeight: '600',
                  fontSize: '13px',
                  border: 'none',
                  cursor: 'pointer'
                }}
                onClick={() => setCurrentPage(3)}
              >
                Ke Visual Editor ➔
              </button>
            </div>
          </div>
        )}

        {/* ================= PAGE 3 ================= */}
        {currentPage === 3 && (
          <div>
            <h2 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px', color: '#c9d1d9', borderBottom: '1px solid #30363d', paddingBottom: '8px' }}>
              3. Editor Visual Otomatis
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '600', color: '#8b949e', display: 'block', marginBottom: '6px' }}>EDIT JUDUL (HOOK)</label>
                <textarea 
                  style={{
                    width: '100%',
                    backgroundColor: '#0d1117',
                    border: '1px solid #30363d',
                    color: '#ffffff',
                    padding: '10px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    minHeight: '80px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  value={judul}
                  onChange={(e) => setJudul(e.target.value)}
                  placeholder="Masukkan judul..."
                />
              </div>

              <button 
                style={{
                  width: '100%',
                  backgroundColor: 'rgba(210, 153, 34, 0.1)',
                  border: '1px solid rgba(210, 153, 34, 0.4)',
                  color: '#f0b429',
                  padding: '10px',
                  borderRadius: '8px',
                  fontWeight: '600',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
                onClick={setPosisiStandar}
              >
                🎯 Kembalikan ke Posisi Standar
              </button>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: '600', color: '#8b949e', display: 'block', marginBottom: '6px' }}>RATA TEKS</label>
                  <select 
                    style={{
                      width: '100%',
                      backgroundColor: '#0d1117',
                      border: '1px solid #30363d',
                      color: '#ffffff',
                      padding: '10px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      outline: 'none'
                    }}
                    value={alignTeks}
                    onChange={(e) => setAlignTeks(e.target.value)}
                  >
                    <option value="Tengah">Tengah</option>
                    <option value="Kiri">Kiri</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: '600', color: '#8b949e', display: 'block', marginBottom: '6px' }}>JARAK BARIS</label>
                  <input 
                    type="range" min="0.8" max="2.5" step="0.1" 
                    style={{ width: '100%', marginTop: '8px', accentColor: '#1f6feb', cursor: 'pointer' }}
                    value={jarakBaris}
                    onChange={(e) => setJarakBaris(parseFloat(e.target.value))}
                  />
                </div>
              </div>

              {/* CANVAS PREVIEW KECIL */}
              <div style={{ backgroundColor: '#0d1117', border: '1px solid #30363d', borderRadius: '10px', padding: '10px', textAlign: 'center' }}>
                <canvas 
                  ref={canvasRef} 
                  width="1080" 
                  height="1920" 
                  style={{ width: '110px', height: 'auto', borderRadius: '6px', border: '1px solid #30363d' }}
                ></canvas>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                <button 
                  style={{
                    width: '35%',
                    backgroundColor: '#21262d',
                    color: '#c9d1d9',
                    padding: '12px',
                    borderRadius: '10px',
                    fontWeight: '600',
                    fontSize: '13px',
                    border: '1px solid #30363d',
                    cursor: 'pointer'
                  }}
                  onClick={() => setCurrentPage(2)}
                >
                  ⬅ Kembali
                </button>
                <button 
                  style={{
                    width: '65%',
                    backgroundColor: '#238636',
                    color: '#ffffff',
                    padding: '12px',
                    borderRadius: '10px',
                    fontWeight: '700',
                    fontSize: '13px',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                  downloadGambar={downloadGambar}
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
