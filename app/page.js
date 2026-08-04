"use client";

import React, { useState, useRef } from 'react';

export default function AgoraVadaPortal() {
  // === STATE MANAJEMEN HALAMAN ===
  const [currentPage, setCurrentPage] = useState(1);

  // === STATE DATA ===
  const [urlBerita, setUrlBerita] = useState('');
  const [promptTeks, setPromptTeks] = useState('');
  
  // === STATE KONTROL VISUAL (Page 3) ===
  const [judul, setJudul] = useState('');
  const [sumberBerita, setSumberBerita] = useState('');
  
  // Posisi Standar Default
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
    // Background utama Full Dark Mode
    <div className="min-h-screen bg-[#0d1117] text-gray-200 py-12 px-4 sm:px-6 lg:px-8 font-sans selection:bg-blue-500 selection:text-white">
      <div className="max-w-5xl mx-auto">
        
        {/* Header Elegan dengan Gradient Text */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">
            ⚡ Agora Vada Portal
          </h1>
          <p className="mt-3 text-gray-400 text-lg">Content & Visual Automation Generator</p>
        </div>

        {/* ========================================== */}
        {/* PAGE 1: INPUT LINK BERITA */}
        {/* ========================================== */}
        {currentPage === 1 && (
          <div className="bg-[#161b22] border border-gray-800 rounded-2xl shadow-2xl p-8 md:p-10 transition-all">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3 text-white">
              <span className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">1</span> 
              Masukkan Link Berita
            </h2>
            
            <input 
              type="text" 
              placeholder="Paste URL di sini (https://news.com/...)" 
              className="w-full bg-[#0d1117] border border-gray-700 text-gray-100 placeholder-gray-500 p-4 rounded-xl mb-6 text-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              value={urlBerita}
              onChange={(e) => setUrlBerita(e.target.value)}
            />
            
            <button 
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white p-4 rounded-xl font-bold text-lg shadow-lg shadow-blue-900/50 transform hover:-translate-y-0.5 transition-all"
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
          <div className="bg-[#161b22] border border-gray-800 rounded-2xl shadow-2xl p-8 md:p-10 transition-all animate-fade-in">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3 text-white">
              <span className="bg-indigo-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">2</span> 
              Prompt Manual & Edit Teks
            </h2>
            
            <textarea 
              className="w-full bg-[#0d1117] border border-gray-700 text-gray-200 p-5 rounded-xl mb-8 min-h-[400px] text-lg leading-relaxed focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all custom-scrollbar"
              value={promptTeks}
              onChange={(e) => setPromptTeks(e.target.value)}
            />
            
            <div className="flex gap-4">
              <button 
                className="w-1/3 bg-gray-800 border border-gray-700 hover:bg-gray-700 text-gray-300 p-4 rounded-xl font-bold text-lg transition-all"
                onClick={() => setCurrentPage(1)}
              >
                ⬅ Kembali
              </button>
              <button 
                className="w-2/3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white p-4 rounded-xl font-bold text-lg shadow-lg shadow-purple-900/50 transform hover:-translate-y-0.5 transition-all"
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
          <div className="bg-[#161b22] border border-gray-800 rounded-2xl shadow-2xl p-8 md:p-10 transition-all">
            <h2 className="text-2xl font-bold mb-8 flex items-center gap-3 text-white">
              <span className="bg-purple-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">3</span> 
              Editor Visual Otomatis
            </h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              
              {/* PANEL KIRI: KONTROL */}
              <div className="flex flex-col gap-6">
                <div>
                  <label className="text-sm font-semibold text-gray-400 block mb-2 uppercase tracking-wider">Edit Judul (Hook):</label>
                  <textarea 
                    className="w-full bg-[#0d1117] border border-gray-700 text-white p-4 rounded-xl focus:outline-none focus:border-purple-500 min-h-[120px]"
                    value={judul}
                    onChange={(e) => setJudul(e.target.value)}
                    placeholder="Masukkan judul di sini..."
                  />
                </div>

                <button 
                  className="w-full bg-yellow-500/10 border border-yellow-500/50 hover:bg-yellow-500/20 text-yellow-500 p-3 rounded-xl font-bold transition-all flex justify-center items-center gap-2"
                  onClick={setPosisiStandar}
                >
                  🎯 Kembalikan ke Posisi Standar
                </button>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-gray-400 block mb-2 uppercase tracking-wider">Rata Teks:</label>
                    <select 
                      className="w-full bg-[#0d1117] border border-gray-700 text-white p-3 rounded-xl focus:outline-none focus:border-purple-500"
                      value={alignTeks}
                      onChange={(e) => setAlignTeks(e.target.value)}
                    >
                      <option value="Tengah">Tengah</option>
                      <option value="Kiri">Kiri</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-400 block mb-2 uppercase tracking-wider">Jarak Baris: <span className="text-purple-400">{jarakBaris}</span></label>
                    <input 
                      type="range" min="0.8" max="2.5" step="0.1" 
                      className="w-full accent-purple-500 mt-2"
                      value={jarakBaris}
                      onChange={(e) => setJarakBaris(parseFloat(e.target.value))}
                    />
                  </div>
                </div>

                <div className="mt-auto pt-8 flex gap-4 border-t border-gray-800">
                  <button 
                    className="w-1/3 bg-gray-800 border border-gray-700 hover:bg-gray-700 text-gray-300 p-4 rounded-xl font-bold transition-all"
                    onClick={() => setCurrentPage(2)}
                  >
                    ⬅ Kembali
                  </button>
                  <button 
                    className="w-2/3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white p-4 rounded-xl font-bold shadow-lg shadow-teal-900/50 transform hover:-translate-y-0.5 transition-all flex justify-center items-center gap-2"
                    onClick={downloadGambar}
                  >
                    📥 Save Image
                  </button>
                </div>
              </div>

              {/* PANEL KANAN: PREVIEW CANVAS */}
              <div className="bg-[#0d1117] border border-gray-800 rounded-2xl flex items-center justify-center p-4 min-h-[400px] relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#161b22]/50 pointer-events-none"></div>
                <canvas 
                  ref={canvasRef} 
                  width="1080" 
                  height="1920" 
                  className="w-full h-auto object-contain rounded-lg shadow-2xl relative z-10"
                ></canvas>
                <div className="absolute top-4 right-4 bg-black/60 text-xs text-gray-300 px-3 py-1 rounded-full backdrop-blur-sm z-20">
                  Live Preview
                </div>
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
}
