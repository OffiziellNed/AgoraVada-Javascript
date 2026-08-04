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
    // Background Abu-abu terang, konten selalu di tengah
    <div className="min-h-screen bg-gray-200 flex flex-col items-center py-12 px-4 font-sans text-black">
      
      {/* Kontainer Utama - Dibatasi lebarnya agar rapi di tengah */}
      <div className="w-full max-w-5xl">
        
        <h1 className="text-4xl font-black text-center mb-8 text-gray-800 tracking-wide">
          ⚡ AGORA VADA
        </h1>

        {/* ========================================== */}
        {/* PAGE 1 */}
        {/* ========================================== */}
        {currentPage === 1 && (
          <div className="bg-white border border-gray-300 rounded-xl shadow-xl p-8 md:p-12 w-full mx-auto">
            <h2 className="text-2xl font-extrabold mb-6 text-gray-900 border-b-2 border-gray-200 pb-4">
              1. Masukkan Link Berita
            </h2>
            <input 
              type="text" 
              placeholder="Paste URL di sini (https://news.com/...)" 
              className="w-full bg-gray-50 border-2 border-gray-300 text-black p-4 rounded-lg mb-6 text-lg focus:outline-none focus:border-blue-600 focus:bg-white transition-colors"
              value={urlBerita}
              onChange={(e) => setUrlBerita(e.target.value)}
            />
            <button 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-lg font-bold text-xl shadow-md transition-colors"
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
        {/* PAGE 2 */}
        {/* ========================================== */}
        {currentPage === 2 && (
          <div className="bg-white border border-gray-300 rounded-xl shadow-xl p-8 md:p-12 w-full mx-auto">
            <h2 className="text-2xl font-extrabold mb-6 text-gray-900 border-b-2 border-gray-200 pb-4">
              2. Prompt Manual & Edit Teks
            </h2>
            <textarea 
              className="w-full bg-gray-50 border-2 border-gray-300 text-black p-5 rounded-lg mb-8 min-h-[400px] text-lg leading-relaxed focus:outline-none focus:border-blue-600 focus:bg-white transition-colors"
              value={promptTeks}
              onChange={(e) => setPromptTeks(e.target.value)}
            />
            <div className="flex gap-4">
              <button 
                className="w-1/3 bg-gray-300 hover:bg-gray-400 text-gray-800 p-4 rounded-lg font-bold text-lg transition-colors"
                onClick={() => setCurrentPage(1)}
              >
                ⬅ Kembali
              </button>
              <button 
                className="w-2/3 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-lg font-bold text-lg shadow-md transition-colors"
                onClick={() => setCurrentPage(3)}
              >
                Ke Visual Editor ➔
              </button>
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* PAGE 3 */}
        {/* ========================================== */}
        {currentPage === 3 && (
          <div className="bg-white border border-gray-300 rounded-xl shadow-xl p-8 md:p-12 w-full mx-auto">
            <h2 className="text-2xl font-extrabold mb-8 text-gray-900 border-b-2 border-gray-200 pb-4">
              3. Editor Visual Otomatis
            </h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              {/* PANEL KIRI: KONTROL */}
              <div className="flex flex-col gap-6">
                <div>
                  <label className="font-bold text-gray-800 block mb-2">Edit Judul (Hook):</label>
                  <textarea 
                    className="w-full bg-gray-50 border-2 border-gray-300 text-black p-4 rounded-lg focus:outline-none focus:border-blue-600 focus:bg-white min-h-[120px] text-lg"
                    value={judul}
                    onChange={(e) => setJudul(e.target.value)}
                    placeholder="Masukkan judul di sini..."
                  />
                </div>

                <button 
                  className="w-full bg-yellow-400 hover:bg-yellow-500 text-black border-2 border-yellow-500 p-3 rounded-lg font-bold transition-colors"
                  onClick={setPosisiStandar}
                >
                  🎯 Kembalikan ke Posisi Standar
                </button>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="font-bold text-gray-800 block mb-2">Rata Teks:</label>
                    <select 
                      className="w-full bg-gray-50 border-2 border-gray-300 text-black p-3 rounded-lg focus:outline-none focus:border-blue-600"
                      value={alignTeks}
                      onChange={(e) => setAlignTeks(e.target.value)}
                    >
                      <option value="Tengah">Tengah</option>
                      <option value="Kiri">Kiri</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-bold text-gray-800 block mb-2">Jarak Baris: <span className="text-blue-600">{jarakBaris}</span></label>
                    <input 
                      type="range" min="0.8" max="2.5" step="0.1" 
                      className="w-full mt-2 cursor-pointer"
                      value={jarakBaris}
                      onChange={(e) => setJarakBaris(parseFloat(e.target.value))}
                    />
                  </div>
                </div>

                <div className="mt-auto pt-8 flex gap-4">
                  <button 
                    className="w-1/3 bg-gray-300 hover:bg-gray-400 text-gray-800 p-4 rounded-lg font-bold text-lg transition-colors"
                    onClick={() => setCurrentPage(2)}
                  >
                    ⬅ Kembali
                  </button>
                  <button 
                    className="w-2/3 bg-green-600 hover:bg-green-700 text-white p-4 rounded-lg font-bold text-lg shadow-md transition-colors"
                    onClick={downloadGambar}
                  >
                    📥 Save Image
                  </button>
                </div>
              </div>

              {/* PANEL KANAN: PREVIEW CANVAS */}
              <div className="bg-gray-200 border-2 border-gray-300 rounded-lg flex items-center justify-center p-4 min-h-[400px]">
                <canvas 
                  ref={canvasRef} 
                  width="1080" 
                  height="1920" 
                  className="w-full h-auto object-contain bg-white rounded shadow-sm border border-gray-300"
                ></canvas>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
