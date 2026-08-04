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
    // mx-auto dan py-12 memastikan card ada di atas-tengah dengan jarak yang pas, tidak kepanjangan ke bawah
    <div className="min-h-screen bg-gray-950 text-gray-200 py-12 px-4 font-sans">
      
      {/* Kontainer minimalis (max-w-md bikin ukurannya sempit dan rapi di tengah) */}
      <div className="w-full max-w-md mx-auto">
        
        <h1 className="text-2xl font-black text-center mb-8 text-white tracking-widest">
          ⚡ AGORA VADA
        </h1>

        {/* ========================================== */}
        {/* PAGE 1: INPUT LINK */}
        {/* ========================================== */}
        {currentPage === 1 && (
          <div className="bg-gray-900 border border-gray-800 shadow-2xl rounded-2xl p-6">
            <h2 className="text-lg font-bold mb-4 text-white border-b border-gray-800 pb-2">
              1. Masukkan Link Berita
            </h2>
            <input 
              type="text" 
              placeholder="https://news.com/..." 
              className="w-full bg-gray-950 border border-gray-800 text-white placeholder-gray-600 p-3 rounded-xl mb-5 text-sm focus:outline-none focus:border-blue-500 transition-colors"
              value={urlBerita}
              onChange={(e) => setUrlBerita(e.target.value)}
            />
            <button 
              className="w-full bg-blue-600 hover:bg-blue-500 text-white p-3 rounded-xl font-bold text-sm shadow-lg transition-all"
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
          <div className="bg-gray-900 border border-gray-800 shadow-2xl rounded-2xl p-6">
            <h2 className="text-lg font-bold mb-4 text-white border-b border-gray-800 pb-2">
              2. Prompt Manual & Edit Teks
            </h2>
            <textarea 
              className="w-full bg-gray-950 border border-gray-800 text-gray-200 p-3 rounded-xl mb-5 min-h-[300px] text-sm leading-relaxed focus:outline-none focus:border-blue-500 transition-colors"
              value={promptTeks}
              onChange={(e) => setPromptTeks(e.target.value)}
            />
            <div className="flex gap-3">
              <button 
                className="w-1/3 bg-gray-800 hover:bg-gray-700 text-white p-3 rounded-xl font-bold text-sm transition-colors"
                onClick={() => setCurrentPage(1)}
              >
                ⬅ Kembali
              </button>
              <button 
                className="w-2/3 bg-blue-600 hover:bg-blue-500 text-white p-3 rounded-xl font-bold text-sm shadow-lg transition-colors"
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
          <div className="bg-gray-900 border border-gray-800 shadow-2xl rounded-2xl p-6">
            <h2 className="text-lg font-bold mb-4 text-white border-b border-gray-800 pb-2">
              3. Editor Visual Otomatis
            </h2>
            
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-gray-300 font-semibold block mb-1 text-xs uppercase tracking-wider">Edit Judul (Hook):</label>
                <textarea 
                  className="w-full bg-gray-950 border border-gray-800 text-white p-3 rounded-xl focus:outline-none focus:border-blue-500 min-h-[90px] text-sm"
                  value={judul}
                  onChange={(e) => setJudul(e.target.value)}
                  placeholder="Masukkan judul di sini..."
                />
              </div>

              <button 
                className="w-full bg-yellow-500/10 border border-yellow-500/40 text-yellow-400 hover:bg-yellow-500/20 p-2.5 rounded-xl font-bold text-xs transition-colors"
                onClick={setPosisiStandar}
              >
                🎯 Kembalikan ke Posisi Standar
              </button>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-300 font-semibold block mb-1 text-xs uppercase tracking-wider">Rata Teks:</label>
                  <select 
                    className="w-full bg-gray-950 border border-gray-800 text-white p-2.5 rounded-xl focus:outline-none focus:border-blue-500 text-xs"
                    value={alignTeks}
                    onChange={(e) => alignTeks(e.target.value)}
                  >
                    <option value="Tengah">Tengah</option>
                    <option value="Kiri">Kiri</option>
                  </select>
                </div>
                <div>
                  <label className="text-gray-300 font-semibold block mb-1 text-xs uppercase tracking-wider">Jarak: <span className="text-blue-400">{jarakBaris}</span></label>
                  <input 
                    type="range" min="0.8" max="2.5" step="0.1" 
                    className="w-full mt-2 accent-blue-500 cursor-pointer"
                    value={jarakBaris}
                    onChange={(e) => setJarakBaris(parseFloat(e.target.value))}
                  />
                </div>
              </div>

              {/* CANVAS PREVIEW KECIL */}
              <div className="bg-gray-950 border border-gray-800 rounded-xl flex items-center justify-center p-2">
                <canvas 
                  ref={canvasRef} 
                  width="1080" 
                  height="1920" 
                  className="w-32 h-auto object-contain rounded shadow-sm border border-gray-800"
                ></canvas>
              </div>

              <div className="pt-3 flex gap-3 border-t border-gray-800">
                <button 
                  className="w-1/3 bg-gray-800 hover:bg-gray-700 text-white p-3 rounded-xl font-bold text-sm transition-colors"
                  onClick={() => setCurrentPage(2)}
                >
                  ⬅ Kembali
                </button>
                <button 
                  className="w-2/3 bg-green-600 hover:bg-green-500 text-white p-3 rounded-xl font-bold text-sm shadow-lg transition-colors"
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
