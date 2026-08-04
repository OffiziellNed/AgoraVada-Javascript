"use client";

import React, { useState, useRef, useEffect } from 'react';

export default function AgoraVadaPortal() {
  // === STATE MANAJEMEN HALAMAN ===
  const [currentPage, setCurrentPage] = useState(1);

  // === STATE DATA ===
  const [urlBerita, setUrlBerita] = useState('');
  const [promptTeks, setPromptTeks] = useState('');
  
  // === STATE KONTROL VISUAL (Page 3) ===
  const [judul, setJudul] = useState('');
  const [sumberBerita, setSumberBerita] = useState('');
  
  // Posisi Standar Default (Sesuai request)
  const [ukuranFont, setUkuranFont] = useState(330);
  const [teksX, setTeksX] = useState(600);
  const [teksY, setTeksY] = useState(3630);
  const [jarakBaris, setJarakBaris] = useState(1.4);
  const [alignTeks, setAlignTeks] = useState('Tengah');
  
  // Posisi Sumber Berita (Fix, gak bisa diubah user)
  const ukuranSumber = 111;
  const sumberX = 620;
  const sumberY = 3260;

  const canvasRef = useRef(null);

  // === FUNGSI RESET KE POSISI STANDAR ===
  const setPosisiStandar = () => {
    setUkuranFont(330);
    setTeksX(600);
    setTeksY(3630);
    setJarakBaris(1.4);
  };

  // === FUNGSI DOWNLOAD GAMBAR ===
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
    <div className="max-w-6xl mx-auto p-8 font-sans text-gray-900">
      <h1 className="text-3xl font-bold text-center mb-8">⚡ Agora Vada - Portal</h1>

      {/* ========================================== */}
      {/* PAGE 1: INPUT LINK BERITA */}
      {/* ========================================== */}
      {currentPage === 1 && (
        <div className="card border p-8 rounded-lg shadow-sm bg-white">
          <h2 className="text-2xl font-bold mb-6">1. Masukkan Link Berita</h2>
          <input 
            type="text" 
            placeholder="https://news.com/..." 
            className="w-full p-4 border rounded mb-6 text-lg"
            value={urlBerita}
            onChange={(e) => setUrlBerita(e.target.value)}
          />
          <button 
            className="w-full bg-blue-600 hover:bg-blue-700 transition text-white p-4 rounded font-bold text-lg"
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

      {/* ========================================== */}
      {/* PAGE 2: PROMPT MANUAL & EDIT TEKS */}
      {/* ========================================== */}
      {currentPage === 2 && (
        <div className="card border p-8 rounded-lg shadow-sm bg-white">
          <h2 className="text-2xl font-bold mb-6">2. Prompt Manual & Edit Teks</h2>
          <textarea 
            className="w-full p-4 border rounded mb-6 min-h-[400px] text-lg leading-relaxed bg-gray-50"
            value={promptTeks}
            onChange={(e) => setPromptTeks(e.target.value)}
          />
          <div className="flex gap-4">
            <button 
              className="w-1/3 bg-gray-300 hover:bg-gray-400 transition p-4 rounded font-bold text-lg"
              onClick={() => setCurrentPage(1)}
            >
              ⬅ Kembali
            </button>
            <button 
              className="w-2/3 bg-blue-600 hover:bg-blue-700 transition text-white p-4 rounded font-bold text-lg"
              onClick={() => setCurrentPage(3)}
            >
              Ke Visual Editor ➔
            </button>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* PAGE 3: EDITOR VISUAL OTOMATIS */}
      {/* ========================================== */}
      {currentPage === 3 && (
        <div className="card border p-6 rounded-lg shadow-sm bg-white">
          <h2 className="text-xl font-bold mb-4">3. Editor Visual Otomatis</h2>
          
          <div className="grid grid-cols-2 gap-6">
            {/* PANEL KIRI: KONTROL */}
            <div>
              <div className="mb-4">
                <label className="font-bold block mb-2">Edit Judul (Hook):</label>
                <textarea 
                  className="w-full p-2 border rounded"
                  value={judul}
                  onChange={(e) => setJudul(e.target.value)}
                />
              </div>

              {/* KONTROL YANG TERSISA (Sesuai Request) */}
              <button 
                className="w-full bg-yellow-400 hover:bg-yellow-500 transition text-black p-2 rounded font-bold mb-4"
                onClick={setPosisiStandar}
              >
                🎯 Kembalikan ke Posisi Standar
              </button>

              <div className="mb-4">
                <label className="font-bold block mb-2">Rata Teks Judul:</label>
                <select 
                  className="w-full p-2 border rounded"
                  value={alignTeks}
                  onChange={(e) => setAlignTeks(e.target.value)}
                >
                  <option value="Tengah">Tengah</option>
                  <option value="Kiri">Kiri</option>
                </select>
              </div>

              <div className="mb-4">
                <label className="font-bold block mb-2">Jarak Baris: {jarakBaris}</label>
                <input 
                  type="range" min="0.8" max="2.5" step="0.1" 
                  className="w-full"
                  value={jarakBaris}
                  onChange={(e) => setJarakBaris(parseFloat(e.target.value))}
                />
              </div>

              <div className="mt-8 flex gap-4">
                <button 
                  className="w-1/3 bg-gray-300 hover:bg-gray-400 transition p-3 rounded font-bold"
                  onClick={() => setCurrentPage(2)}
                >
                  ⬅ Kembali
                </button>
                <button 
                  className="w-2/3 bg-green-600 hover:bg-green-700 transition text-white p-3 rounded font-bold"
                  onClick={downloadGambar}
                >
                  📥 Save Image
                </button>
              </div>
            </div>

            {/* PANEL KANAN: PREVIEW CANVAS */}
            <div className="bg-gray-100 border rounded flex items-center justify-center p-2">
               <canvas 
                 ref={canvasRef} 
                 width="1080" 
                 height="1920" 
                 className="w-full h-auto object-contain shadow-md"
               ></canvas>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
