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
    // Flex items-center justify-center min-h-screen memastikan konten selalu di tengah secara vertikal dan horizontal
    <div className="min-h-screen bg-gray-950 text-gray-200 flex flex-col items-center justify-center p-6 font-sans">
      
      {/* Kontainer Utama yang ramping & elegan (max-w-xl atau max-w-2xl) */}
      <div className="w-full max-w-2xl mx-auto">
        
        <h1 className="text-3xl font-extrabold text-center mb-8 text-white tracking-wider">
          ⚡ AGORA VADA PORTAL
        </h1>

        {/* ========================================== */}
        {/* PAGE 1: INPUT LINK */}
        {/* ========================================== */}
        {currentPage === 1 && (
          <div className="bg-gray-900 border border-gray-800 shadow-2xl rounded-2xl p-8">
            <h2 className="text-xl font-bold mb-6 text-white border-b border-gray-800 pb-3">
              1. Masukkan Link Berita
            </h2>
            <input 
              type="text" 
              placeholder="https://news.com/..." 
              className="w-full bg-gray-950 border border-gray-800 text-white placeholder-gray-500 p-3.5 rounded-xl mb-6 text-base focus:outline-none focus:border-blue-500 transition-colors"
              value={urlBerita}
              onChange={(e) => setUrlBerita(e.target.value)}
            />
            <button 
              className="w-full bg-blue-600 hover:bg-blue-500 text-white p-3.5 rounded-xl font-bold text-base shadow-lg transition-all"
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
        {/* PAGE 2: PROMPT & EDIT */}
        {/* ========================================== */}
        {currentPage === 2 && (
          <div className="bg-gray-900 border border-gray-800 shadow-2xl rounded-2xl p-8">
            <h2 className="text-xl font-bold mb-6 text-white border-b border-gray-800 pb-3">
              2. Prompt Manual & Edit Teks
            </h2>
            <textarea 
              className="w-full bg-gray-950 border border-gray-800 text-gray-200 p-4 rounded-xl mb-6 min-h-[350px] text-base leading-relaxed focus:outline-none focus:border-blue-500 transition-colors"
              value={promptTeks}
              onChange={(e) => setPromptTeks(e.target.value)}
            />
            <div className="flex gap-4">
              <button 
                className="w-1/3 bg-gray-800 hover:bg-gray-700 text-white p-3.5 rounded-xl font-bold transition-colors"
                onClick={() => setCurrentPage(1)}
              >
                ⬅ Kembali
              </button>
              <button 
                className="w-2/3 bg-blue-600 hover:bg-blue-500 text-white p-3.5 rounded-xl font-bold shadow-lg transition-colors"
                onClick={() => setCurrentPage(3)}
              >
                Ke Visual Editor ➔
              </button>
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* PAGE 3: VISUAL EDITOR */}
        {/* ========================================== */}
        {currentPage === 3 && (
          <div className="bg-gray-900 border border-gray-800 shadow-2xl rounded-2xl p-8">
            <h2 className="text-xl font-bold mb-6 text-white border-b border-gray-800 pb-3">
              3. Editor Visual Otomatis
            </h2>
            
            <div className="flex flex-col gap-6">
              <div>
                <label className="text-gray-300 font-semibold block mb-2 text-sm">Edit Judul (Hook):</label>
                <textarea 
                  className="w-full bg-gray-950 border border-gray-800 text-white p-3.5 rounded-xl focus:outline-none focus:border-blue-500 min-h-[100px] text-base"
                  value={judul}
                  onChange={(e) => setJudul(e.target.value)}
                  placeholder="Masukkan judul di sini..."
                />
              </div>

              <button 
                className="w-full bg-yellow-500/20 border border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/30 p-3 rounded-xl font-bold text-sm transition-colors"
                onClick={setPosisiStandar}
              >
                🎯 Kembalikan ke Posisi Standar
              </button>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-300 font-semibold block mb-2 text-sm">Rata Teks:</label>
                  <select 
                    className="w-full bg-gray-950 border border-gray-800 text-white p-3 rounded-xl focus:outline-none focus:border-blue-500 text-sm"
                    value={alignTeks}
                    onChange={(e) => setAlignTeks(e.target.value)}
                  >
                    <option value="Tengah">Tengah</option>
                    <option value="Kiri">Kiri</option>
                  </select>
                </div>
                <div>
                  <label className="text-gray-300 font-semibold block mb-2 text-sm">Jarak Baris: <span className="text-blue-400">{jarakBaris}</span></label>
                  <input 
                    type="range" min="0.8" max="2.5" step="0.1" 
                    className="w-full mt-3 accent-blue-500 cursor-pointer"
                    value={jarakBaris}
                    onChange={(e) => setJarakBaris(parseFloat(e.target.value))}
                  />
                </div>
              </div>

              {/* PREVIEW CANVAS (Dibuat lebih ringkas di bawah kontrol) */}
              <div className="bg-gray-950 border border-gray-800 rounded-xl flex items-center justify-center p-3">
                <canvas 
                  ref={canvasRef} 
                  width="1080" 
                  height="1920" 
                  className="w-48 h-auto object-contain rounded-lg shadow-md border border-gray-800"
                ></canvas>
              </div>

              <div className="pt-4 flex gap-4 border-t border-gray-800">
                <button 
                  className="w-1/3 bg-gray-800 hover:bg-gray-700 text-white p-3.5 rounded-xl font-bold transition-colors"
                  onClick={() => setCurrentPage(2)}
                >
                  ⬅ Kembali
                </button>
                <button 
                  className="w-2/3 bg-green-600 hover:bg-green-500 text-white p-3.5 rounded-xl font-bold shadow-lg transition-colors"
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
