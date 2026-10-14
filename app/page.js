"use client";

import React, { useState, useRef, useEffect } from 'react';

export default function AgoraVadaPortal() {
  const [currentPage, setCurrentPage] = useState(1);
  const [urlBerita, setUrlBerita] = useState('');
  const [promptTeks, setPromptTeks] = useState('');
  const [rawBeritaContent, setRawBeritaContent] = useState('');
  const [promptMode, setPromptMode] = useState('homeless');
  const [selectedHook, setSelectedHook] = useState('urgent');
  // === TAMBAHAN PAGE 4 UPLOAD ===
  const [igCaption, setIgCaption] = useState('');
  const [carouselFiles, setCarouselFiles] = useState([]);
  const [carouselPreviews, setCarouselPreviews] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState('idle');
  const [uploadStepText, setUploadStepText] = useState('');

  const [judulHtml, setJudulHtml] = useState('');
  const [sumberBerita, setSumberBerita] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const PROMPT_TEMPLATES = {
    homeless: `Tolong buat 10 judul berita menggunakan hook dan copywriter handal untuk media alternatif "AgoraVada", serta buatkan caption untuk 【entity-instagram¦canonical_name=Instagram】, normatif saja dan informatif. Pastikan diakhiri oleh sumber berita dan 3 hastag (wajib ada #AgoraVada sisanya disesuaikan dengan kata kunci subjek dan topik yang dibahas).`,
    threads: `Tolong identifikasi isu, paparkan fakta penting, berikan 10 perspektif 5 opini Pro dan 5 Opini Kontra untuk X atau Threads, Jika kontra boleh gunakan Bahasa satir, sarkas, tajam. Pastikan singkat singkat saja`
  };
  const [isCopied, setIsCopied] = useState(false);
  const [imgX, setImgX] = useState(0);
  const [imgY, setImgY] = useState(0);
  const [imgScale, setImgScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [teksX, setTeksX] = useState(110);
  const [teksY, setTeksY] = useState(850);
  const [ukuranFont, setUkuranFont] = useState(80);
  const [jarakBaris, setJarakBaris] = useState(1.4);
  const [sumberX, setSumberX] = useState(110);
  const [sumberY, setSumberY] = useState(778);
  const [ukuranFontSumber, setUkuranFontSumber] = useState(25);
  const [sumberColor, setSumberColor] = useState('#FFFFFF');
  const [templateMode, setTemplateMode] = useState('agoravada');
  const [teksAlign, setTeksAlign] = useState('left');
  const MARGIN_PX = 85;
  const TEMPLATE_DEFAULTS = {
    agoravada: { teksX: 110, teksY: 850, ukuranFont: 80, jarakBaris: 1.4, sumberX: 110, sumberY: 778, ukuranFontSumber: 25 },
    agentlondo: { teksX: 110, teksY: 593, ukuranFont: 45, jarakBaris: 1.4, sumberX: 110, sumberY: 700, ukuranFontSumber: 20 }
  };
  const canvasRef = useRef(null);
  const [loadedBgImg, setLoadedBgImg] = useState(null);
  const [templateImgObj, setTemplateImgObj] = useState(null);

  useEffect(() => {
    const loadFonts = async () => {
      try {
        const fontSB = new FontFace('PoppinsSemiBold', 'url(/Poppins-SemiBold.ttf)'); await fontSB.load(); document.fonts.add(fontSB);
        const fontSBI = new FontFace('PoppinsSemiBoldItalic', 'url(/Poppins-SemiBoldItalic.ttf)'); await fontSBI.load(); document.fonts.add(fontSBI);
      } catch (err) {}
      try {
        const fontIBM = new FontFace('IBMPlexMono-SemiBold', 'url(/IBMPlexMono-SemiBold.ttf)'); await fontIBM.load(); document.fonts.add(fontIBM);
        const fontIBMI = new FontFace('IBMPlexMono-SemiBoldItalic', 'url(/IBMPlexMono-SemiBoldItalic.ttf)'); await fontIBMI.load(); document.fonts.add(fontIBMI);
      } catch (err) {}
    };
    loadFonts();
    const tImg = new Image(); tImg.src = '/Agora Vada Template.png'; tImg.onload = () => setTemplateImgObj(tImg);
  }, []);

  useEffect(() => {
    if (!imageUrl) { setLoadedBgImg(null); return; }
    let isCancelled = false;
    const fetchImageSafely = async () => {
      const tryLoad = (url) => new Promise((resolve, reject) => {
        const img = new Image(); img.crossOrigin = 'anonymous'; img.onload = () => resolve(img); img.onerror = () => reject(); img.src = url;
      });
      if (!imageUrl.startsWith('http')) { try { const img = await tryLoad(imageUrl); if (!isCancelled) setLoadedBgImg(img); } catch(e) {} return; }
      const proxies = [`https://api.allorigins.win/raw?url=${encodeURIComponent(imageUrl)}`, `https://wsrv.nl/?url=${encodeURIComponent(imageUrl)}`, `https://corsproxy.io/?${encodeURIComponent(imageUrl)}`, imageUrl];
      for (let proxy of proxies) { try { const img = await tryLoad(proxy); if (!isCancelled) setLoadedBgImg(img); return; } catch(e) { continue; } }
      if (!isCancelled) { setLoadedBgImg(null); alert("Server website memblokir akses gambar ini."); }
    };
    fetchImageSafely(); return () => { isCancelled = true; };
  }, [imageUrl]);

  const handleFormat = (command, value = null) => {
    document.execCommand(command, false, value);
    const editor = document.getElementById('judul-editor');
    if (editor) setJudulHtml(editor.innerHTML);
  };

  const renderRichText = (ctx, htmlString, x, y, maxWidth, lineHeight, baseFontSize, align = 'left') => {
    if (!htmlString) return; ctx.textBaseline = 'top';
    const cleanHTML = htmlString.replace(/<div[^>]*><br><\/div>/gi, '\n').replace(/<div[^>]*>/gi, '\n').replace(/<\/div>/gi, '').replace(/<br\s*[\/]?>/gi, '\n');
    const tempDiv = document.createElement('div'); tempDiv.innerHTML = cleanHTML;
    let wordsWithContext = [];
    const extract = (node, currentContext) => {
      if (node.nodeType === Node.TEXT_NODE) {
        let text = node.textContent; let tokens = text.split('\n');
        tokens.forEach((lineText, index) => {
          if (index > 0) wordsWithContext.push({ word: '',...currentContext, isNewline: true });
          let words = lineText.split(/\s+/);
          words.forEach(w => { if (w.trim().length > 0) wordsWithContext.push({ word: w.trim(),...currentContext, isNewline: false }); });
        });
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        let newContext = {...currentContext }; const tag = node.tagName.toLowerCase();
        if (tag === 'i' || tag === 'em') newContext.isItalic = true;
        if (node.style && node.style.color) newContext.color = node.style.color;
        if (tag === 'font' && node.getAttribute('color')) newContext.color = node.getAttribute('color');
        node.childNodes.forEach(child => extract(child, newContext));
      }
    };
    extract(tempDiv, { color: '#FFFFFF', isItalic: false });
    let lines = []; let currentLine = []; let currentWidth = 0;
    const baseFontFamily = templateMode === 'agentlondo'? 'IBMPlexMono-SemiBold' : 'PoppinsSemiBold';
    const italicFontFamily = templateMode === 'agentlondo'? 'IBMPlexMono-SemiBoldItalic' : 'PoppinsSemiBoldItalic';
    ctx.font = `${baseFontSize}px ${baseFontFamily}, sans-serif`;
    const spaceWidth = ctx.measureText(' ').width;
    wordsWithContext.forEach(item => {
      if (item.isNewline) { lines.push(currentLine); currentLine = []; currentWidth = 0; } else {
        const fontName = item.isItalic? italicFontFamily : baseFontFamily;
        ctx.font = `${baseFontSize}px ${fontName}, sans-serif`; let wWidth = ctx.measureText(item.word).width;
        if (wWidth > maxWidth) {
          let remaining = item.word;
          while (remaining.length > 0) {
            let chunk = ''; for (let i = 1; i <= remaining.length; i++) { const test = remaining.slice(0, i); if (ctx.measureText(test).width > maxWidth) break; chunk = test; }
            if (!chunk) chunk = remaining.slice(0, 1);
            const chunkItem = {...item, word: chunk }; const chunkWidth = ctx.measureText(chunk).width;
            if (currentWidth + chunkWidth > maxWidth && currentLine.length > 0) { lines.push(currentLine); currentLine = [chunkItem]; currentWidth = chunkWidth + spaceWidth; }
            else { currentLine.push(chunkItem); currentWidth += chunkWidth + spaceWidth; }
            remaining = remaining.slice(chunk.length);
            if (remaining.length > 0) { lines.push(currentLine); currentLine = []; currentWidth = 0; }
          }
        } else {
          if (currentWidth + wWidth > maxWidth && currentLine.length > 0) { lines.push(currentLine); currentLine = [item]; currentWidth = wWidth + spaceWidth; }
          else { currentLine.push(item); currentWidth += wWidth + spaceWidth; }
        }
      }
    });
    if (currentLine.length > 0) lines.push(currentLine);
    let currentY = y;
    lines.forEach((lineArr, lineIndex) => {
      let lineWidth = 0;
      lineArr.forEach((item, idx) => {
        const fontName = item.isItalic? italicFontFamily : baseFontFamily;
        ctx.font = `${baseFontSize}px ${fontName}, sans-serif`;
        lineWidth += ctx.measureText(item.word).width;
        if (idx < lineArr.length - 1) lineWidth += spaceWidth;
      });
      let currentX = x; let gapExtra = 0;
      if (align === 'center') currentX = x + (maxWidth - lineWidth) / 2;
      else if (align === 'right') currentX = x + (maxWidth - lineWidth);
      else if (align === 'justify') {
        const isLastLine = lineIndex === lines.length - 1;
        if (!isLastLine && lineArr.length > 1) {
          const rawExtra = (maxWidth - lineWidth) / (lineArr.length - 1);
          const maxAllowedExtra = Math.min(12, spaceWidth * 0.8);
          if (rawExtra > 28) gapExtra = 0; else gapExtra = Math.min(rawExtra, maxAllowedExtra);
        }
      }
      lineArr.forEach((item) => {
        const fontName = item.isItalic? italicFontFamily : baseFontFamily;
        ctx.font = `${baseFontSize}px ${fontName}, sans-serif`; ctx.fillStyle = item.color; ctx.textAlign = 'left';
        ctx.fillText(item.word, currentX, currentY);
        currentX += ctx.measureText(item.word).width + spaceWidth + gapExtra;
      });
      currentY += lineHeight;
    });
  };

  const renderCanvas = (ctx, canvas, showMarginGuide = true) => {
    ctx.fillStyle = '#111827'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (loadedBgImg) { ctx.save(); const drawW = loadedBgImg.width * imgScale; const drawH = loadedBgImg.height * imgScale; ctx.drawImage(loadedBgImg, imgX, imgY, drawW, drawH); ctx.restore(); }
    if (templateImgObj) { ctx.drawImage(templateImgObj, 0, 0, canvas.width, canvas.height); }
    if (showMarginGuide) {
      ctx.save(); ctx.strokeStyle = 'rgba(139, 148, 158, 0.5)'; ctx.setLineDash([10, 8]); ctx.lineWidth = 1.5;
      ctx.strokeRect(MARGIN_PX, MARGIN_PX, canvas.width - MARGIN_PX*2, canvas.height - MARGIN_PX*2); ctx.restore();
    }
    const lh = ukuranFont * jarakBaris;
    const clampedX = Math.max(MARGIN_PX, Math.min(teksX, 1080 - MARGIN_PX - 100));
    const clampedY = Math.max(MARGIN_PX, Math.min(teksY, 1350 - MARGIN_PX - 100));
    const availableWidth = 1080 - clampedX - MARGIN_PX;
    const safeMaxWidth = Math.max(100, Math.min(950, availableWidth));
    renderRichText(ctx, judulHtml, clampedX, clampedY, safeMaxWidth, lh, ukuranFont, teksAlign);
    if (sumberBerita) {
      ctx.fillStyle = sumberColor || '#FFFFFF';
      const sumberFont = templateMode === 'agentlondo'? 'IBMPlexMono-SemiBoldItalic' : 'PoppinsSemiBoldItalic';
      ctx.font = `${ukuranFontSumber}px ${sumberFont}, sans-serif`; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
      ctx.fillText(sumberBerita, sumberX, sumberY);
    }
  };

  useEffect(() => {
    if (currentPage!== 3) return;
    const canvas = canvasRef.current; if (!canvas) return; const ctx = canvas.getContext('2d');
    renderCanvas(ctx, canvas, true);
  }, [currentPage, loadedBgImg, templateImgObj, imgX, imgY, imgScale, teksX, teksY, ukuranFont, jarakBaris, sumberX, sumberY, ukuranFontSumber, judulHtml, sumberBerita, sumberColor, templateMode, teksAlign]);

  const handleMouseDown = (e) => { setIsDragging(true); const clientX = e.clientX || (e.touches && e.touches[0].clientX); const clientY = e.clientY || (e.touches && e.touches[0].clientY); setDragStart({ x: clientX - imgX, y: clientY - imgY }); };
  const handleMouseMove = (e) => { if (!isDragging) return; const clientX = e.clientX || (e.touches && e.touches[0].clientX); const clientY = e.clientY || (e.touches && e.touches[0].clientY); setImgX(clientX - dragStart.x); setImgY(clientY - dragStart.y); };
  const handleMouseUp = () => setIsDragging(false);
  const handleWheel = (e) => { e.preventDefault(); const zoomIntensity = 0.05; if (e.deltaY < 0) setImgScale(p => Math.min(p + zoomIntensity, 5)); else setImgScale(p => Math.max(p - zoomIntensity, 0.1)); };
  const handleUploadFoto = (e) => { const file = e.target.files[0]; if (file) setImageUrl(URL.createObjectURL(file)); };
  const handleUploadTemplate = (e) => {
    const file = e.target.files[0]; if (!file) return; const img = new Image(); const objectUrl = URL.createObjectURL(file);
    img.onload = () => { if (img.width!== 1080 || img.height!== 1350) { const c = confirm(`⚠ Ukuran template ${img.width} x ${img.height}, bukan 1080 x 1350. Tetap pakai?`); if (!c) { URL.revokeObjectURL(objectUrl); return; } } setTemplateImgObj(img); };
    img.onerror = () => { alert('Gagal load template.'); }; img.src = objectUrl;
  };
  const downloadGambar = () => {
    const canvas = canvasRef.current; if (!canvas) return; const ctx = canvas.getContext('2d');
    renderCanvas(ctx, canvas, false);
    const link = document.createElement('a'); link.download = templateMode === 'agentlondo'? 'AgentLondo_Post.jpg' : 'AgoraVada_Post.jpg';
    link.href = canvas.toDataURL("image/jpeg", 0.95); link.click();
    setTimeout(() => { const ctx2 = canvas.getContext('2d'); renderCanvas(ctx2, canvas, true); }, 100);
  };

  // === LOGIC PAGE 4 UPLOAD ===
  const stripHtml = (html) => { if (!html) return ''; const div = document.createElement('div'); div.innerHTML = html; return div.innerText || ''; };
  const openUploadPage = async () => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d');
    renderCanvas(ctx, canvas, false);
    const blob = await new Promise(r=>canvas.toBlob(r,'image/jpeg',0.95));
    renderCanvas(ctx, canvas, true);
    if (!blob) return;
    const file = new File([blob],`agoravada-${Date.now()}.jpg`,{type:'image/jpeg'});
    const previewUrl = URL.createObjectURL(blob);
    setCarouselFiles([file]);
    setCarouselPreviews([{url:previewUrl,type:'image',name:file.name,isMain:true}]);
    const judulText = stripHtml(judulHtml);
    setIgCaption(`${judulText}\n\n${sumberBerita?`Sumber: ${sumberBerita}`:''}\n\n#AgoraVada`.trim());
    setUploadProgress(0); setUploadStatus('idle'); setUploadStepText('');
    setCurrentPage(4);
  };
  const handleAddCarouselFiles = (e) => {
    const files = Array.from(e.target.files||[]);
    if (carouselFiles.length + files.length > 9){ alert(`Max 9, sudah ${carouselFiles.length} mau nambah ${files.length}`); return; }
    const nf=[], np=[]; files.forEach(f=>{ nf.push(f); np.push({url:URL.createObjectURL(f),type:f.type.startsWith('video')?'video':'image',name:f.name,isMain:false}) });
    setCarouselFiles(p=>[...p,...nf]); setCarouselPreviews(p=>[...p,...np]); e.target.value='';
  };
  const removeCarouselItem = (idx) => {
    if (carouselFiles.length===1){ alert('Minimal 1'); return; }
    setCarouselFiles(p=>p.filter((_,i)=>i!==idx));
    setCarouselPreviews(p=>{ URL.revokeObjectURL(p[idx].url); return p.filter((_,i)=>i!==idx); });
  };
  const uploadToInstagram = async () => {
    if (!igCaption.trim()) return alert('Caption kosong');
    try{
      setUploadStatus('uploading'); setUploadProgress(2); setUploadStepText('Upload ke Blob...');
      const uploaded=[];
      for(let i=0;i<carouselFiles.length;i++){
        const file=carouselFiles[i];
        const url=await new Promise((res,rej)=>{
          const fd=new FormData(); fd.append('file',file);
          const xhr=new XMLHttpRequest(); xhr.open('POST','/api/【entity-instagram¦canonical_name=Instagram】/upload-image');
          xhr.upload.onprogress=(e)=>{ if(e.lengthComputable){ const base=(i/carouselFiles.length)*40; const cur=(e.loaded/e.total)*(40/carouselFiles.length); setUploadProgress(Math.round(5+base+cur)); setUploadStepText(`File ${i+1}/${carouselFiles.length}: ${Math.round(e.loaded/e.total*100)}%`);} };
          xhr.onload=()=>{ try{ const d=JSON.parse(xhr.responseText); d.url?res(d.url):rej(d);}catch{rej('error')} }; xhr.onerror=()=>rej('network'); xhr.send(fd);
        });
        uploaded.push({url,type:file.type.startsWith('video')?'video':'image'});
      }
      setUploadProgress(50); setUploadStatus('creating'); setUploadStepText('Bikin container IG...');
      const r=await fetch('/api/【entity-instagram¦canonical_name=Instagram】/publish',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({items:uploaded,caption:igCaption})});
      const j=await r.json(); if(!r.ok) throw new Error(JSON.stringify(j));
      setUploadProgress(100); setUploadStatus('done'); setUploadStepText('✅ Berhasil publish ke 【entity-Instagram¦canonical_name=Instagram】!');
    }catch(err){ setUploadStatus('error'); setUploadStepText('❌ '+err.message); }
  };

  const handleCopyPrompt = () => { navigator.clipboard.writeText(promptTeks); setIsCopied(true); setTimeout(()=>setIsCopied(false),2000); };

  return (
    <div style={{ width: '100%', maxWidth: currentPage === 3 || currentPage === 4? '950px' : '480px', margin: '0 auto', padding: '20px', transition: 'max-width 0.3s ease' }}>
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: '800', letterSpacing: '1px', color: '#ffffff' }}>⚡ AGORA VADA</h1>
      </div>
      <div style={{ backgroundColor: '#161b22', border: '1px solid #30363d', borderRadius: '16px', padding: '24px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}>
        {currentPage === 1 && (
          <div>
            <h2 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px', color: '#c9d1d9', borderBottom: '1px solid #30363d', paddingBottom: '8px' }}>1. Masukkan Link Berita</h2>
            <input type="text" placeholder="https://news.com/..." style={{ width: '100%', backgroundColor: '#0d1117', border: '1px solid #30363d', color: '#ffffff', padding: '12px 14px', borderRadius: '10px', fontSize: '14px', outline: 'none', marginBottom: '16px', boxSizing: 'border-box' }} value={urlBerita} onChange={(e) => setUrlBerita(e.target.value)} />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button style={{ width: '50%', backgroundColor: '#21262d', color: '#c9d1d9', padding: '12px', borderRadius: '10px', fontWeight: '600', fontSize: '13px', border: '1px solid #30363d', cursor: 'pointer' }} onClick={async () => {
                  if (!urlBerita) return alert("Masukkan link dulu!");
                  setPromptTeks("Menyedot data dari web, tunggu sebentar...");
                  try {
                    const res = await fetch("/api/tarik-berita", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: urlBerita }) });
                    const data = await res.json();
                    if(data.status === "success") {
                      setPromptTeks(`Tolong buat 10 judul berita menggunakan hook dan copywriter handal untuk media alternatif "AgoraVada", serta buatkan caption untuk instagram, normatif saja dan informatif. Pastikan diakhiri oleh sumber berita dan 3 hastag (wajib ada #AgoraVada sisanya disesuaikan dengan kata kunci subjek dan topik yang dibahas).\n\n${data.prompt}`);
                      setSumberBerita(data.sumber || '');
                      if(data.gambar_url) setImageUrl(data.gambar_url);
                      setCurrentPage(2);
                    } else { alert("Gagal: " + (data.error || "Terhalang")); }
                  } catch(err) { alert("Gagal konek API."); }
                }}>Tarik Data 🔄</button>
              <button style={{ width: '50%', backgroundColor: '#238636', color: '#ffffff', padding: '12px', borderRadius: '10px', fontWeight: '700', fontSize: '13px', border: 'none', cursor: 'pointer' }} onClick={() => setCurrentPage(3)}>Langsung ke Editor ➔</button>
            </div>
          </div>
        )}
        {currentPage === 2 && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #30363d', paddingBottom: '8px' }}>
              <h2 style={{ fontSize: '15px', fontWeight: '700', color: '#c9d1d9', margin: 0 }}>2. Prompt Manual & Edit Teks</h2>
              <button onClick={handleCopyPrompt} style={{ backgroundColor: isCopied? '#238636' : '#21262d', color: '#ffffff', padding: '6px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: '600', border: isCopied? '1px solid #2ea043' : '1px solid #30363d', cursor: 'pointer' }}>{isCopied? "✅ Tersalin!" : "📋 Copy Prompt"}</button>
            </div>
            <textarea style={{ width: '100%', backgroundColor: '#0d1117', border: '1px solid #30363d', color: '#e6edf3', padding: '12px', borderRadius: '10px', fontSize: '13px', minHeight: '280px', outline: 'none', marginBottom: '12px', boxSizing: 'border-box', resize: 'vertical' }} value={promptTeks} onChange={(e) => setPromptTeks(e.target.value)} />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button style={{ width: '35%', backgroundColor: '#21262d', color: '#c9d1d9', padding: '12px', borderRadius: '10px', fontWeight: '600', fontSize: '13px', border: '1px solid #30363d', cursor: 'pointer' }} onClick={() => setCurrentPage(1)}>⬅ Kembali</button>
              <button style={{ width: '65%', backgroundColor: '#1f6feb', color: '#ffffff', padding: '12px', borderRadius: '10px', fontWeight: '600', fontSize: '13px', border: 'none', cursor: 'pointer' }} onClick={() => setCurrentPage(3)}>Ke Visual Editor ➔</button>
            </div>
          </div>
        )}
        {currentPage === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ backgroundColor: '#0d1117', border: '1px solid #30363d', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', justifyContent: 'center', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <h2 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '12px', color: '#8b949e', textAlign: 'center', letterSpacing: '1px' }}>LIVE PREVIEW (1080 x 1350)</h2>
                  <div style={{ border: '2px dashed #30363d', borderRadius: '10px', padding: '8px', cursor: isDragging? 'grabbing' : 'grab', backgroundColor: '#161b22' }}>
                    <canvas ref={canvasRef} width="1080" height="1350" onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp} onTouchStart={handleMouseDown} onTouchMove={handleMouseMove} onTouchEnd={handleMouseUp} onWheel={handleWheel} style={{ width: '280px', height: 'auto', borderRadius: '6px', display: 'block', touchAction: 'none' }}></canvas>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '300px', marginTop: '28px' }}>
                  <div style={{ backgroundColor: '#161b22', padding: '16px', borderRadius: '10px', border: '1px solid #30363d' }}>
                    <label style={{ fontSize: '11px', fontWeight: '700', color: '#3fb950', display: 'block', marginBottom: '8px' }}>🖼 UPLOAD FOTO BERITA</label>
                    <input type="file" accept="image/*" onChange={handleUploadFoto} style={{ fontSize: '11px', color: '#c9d1d9', width: '100%' }} />
                  </div>
                  <div style={{ backgroundColor: '#161b22', padding: '16px', borderRadius: '10px', border: '1px solid #f0883e' }}>
                    <label style={{ fontSize: '11px', fontWeight: '700', color: '#f0883e', display: 'block', marginBottom: '6px' }}>🎨 UPLOAD MEDIA (Template)</label>
                    <input type="file" accept="image/*" onChange={handleUploadTemplate} style={{ fontSize: '11px', color: '#c9d1d9', width: '100%' }} />
                  </div>
                </div>
              </div>
            </div>
            <div style={{ backgroundColor: '#0d1117', padding: '12px 16px', borderRadius: '12px', border: '1px solid #30363d' }}>
              <label style={{ fontSize: '11px', fontWeight: '700', color: '#a371f7', display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}><span>✨ KONTROL POSISI JUDUL</span><button onClick={() => { const def = TEMPLATE_DEFAULTS[templateMode]; setTeksX(def.teksX); setTeksY(def.teksY); setUkuranFont(def.ukuranFont); setJarakBaris(def.jarakBaris); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', padding: 0 }}>🔄</button></label>
              <div style={{ display: 'flex', gap: '8px', marginTop: '14px', paddingTop: '12px', borderTop: '1px solid #30363d' }}>
                <button style={{ width: '25%', backgroundColor: '#21262d', color: '#c9d1d9', padding: '10px', borderRadius: '8px', fontWeight: '600', fontSize: '11px', border: '1px solid #30363d', cursor: 'pointer' }} onClick={() => setCurrentPage(2)}>⬅ Kembali</button>
                <button style={{ width: '35%', backgroundColor: '#238636', color: '#ffffff', padding: '10px', borderRadius: '8px', fontWeight: '700', fontSize: '11px', border: 'none', cursor: 'pointer' }} onClick={downloadGambar}>📥 Download</button>
                <button style={{ width: '40%', backgroundColor: '#E1306C', color: '#ffffff', padding: '10px', borderRadius: '8px', fontWeight: '700', fontSize: '11px', border: 'none', cursor: 'pointer' }} onClick={openUploadPage}>📤 Upload IG</button>
              </div>
            </div>
          </div>
        )}
        {currentPage === 4 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '15px', fontWeight: '800', color: '#ffffff', margin: 0 }}>4. Preview Upload Instagram</h2>
              <button onClick={() => setCurrentPage(3)} style={{ backgroundColor: '#21262d', border: '1px solid #30363d', color: '#c9d1d9', padding: '6px 12px', borderRadius: '8px', fontSize: '11px', cursor: 'pointer' }}>⬅ Kembali Edit</button>
            </div>
            {uploadStatus!=='idle' && (
              <div style={{ backgroundColor: '#0d1117', padding: '12px', borderRadius: '10px', border: '1px solid #30363d' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}><span style={{ fontSize: '11px', color: '#8b949e' }}>{uploadStepText}</span><span style={{ fontSize: '11px', color: '#fff', fontWeight: 700 }}>{uploadProgress}%</span></div>
                <div style={{ width: '100%', height: '8px', backgroundColor: '#21262d', borderRadius: '4px', overflow: 'hidden' }}><div style={{ width: `${uploadProgress}%`, height: '100%', backgroundColor: uploadStatus==='error'?'#f85149':uploadStatus==='done'?'#3fb950':'#E1306C', transition: 'width 0.3s' }} /></div>
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#c9d1d9', display: 'block', marginBottom: '8px' }}>Preview Final ({carouselPreviews.length}/9) - Tanpa Garis Margin</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '8px', marginBottom: '12px' }}>
                  {carouselPreviews.map((item,idx)=>(
                    <div key={idx} style={{ position: 'relative', aspectRatio: '1/1', backgroundColor: '#0d1117', borderRadius: '8px', overflow: 'hidden', border: item.isMain?'2px solid #E1306C':'1px solid #30363d' }}>
                      {item.type==='video'?<video src={item.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted />:<img src={item.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={item.name} />}
                      <div style={{ position: 'absolute', top: '4px', left: '4px', backgroundColor: 'rgba(0,0,0,0.7)', color: '#fff', fontSize: '9px', padding: '2px 6px', borderRadius: '4px' }}>{idx===0?'COVER':idx+1}</div>
                      <button onClick={()=>removeCarouselItem(idx)} style={{ position: 'absolute', top: '4px', right: '4px', backgroundColor: '#f85149', color: '#fff', border: 'none', borderRadius: '50%', width: '20px', height: '20px', fontSize: '10px', cursor: 'pointer' }}>✕</button>
                    </div>
                  ))}
                  {carouselPreviews.length<9 && <label style={{ aspectRatio: '1/1', border: '1px dashed #30363d', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#8b949e', fontSize: '11px', backgroundColor: '#0d1117' }}>＋Add Foto/Video<input type="file" accept="image/*,video/*" multiple onChange={handleAddCarouselFiles} style={{ display: 'none' }} /></label>}
                </div>
                <div style={{ backgroundColor: '#161b22', padding: '12px', borderRadius: '10px', border: '1px solid #30363d' }}>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: '#3fb950', display: 'block', marginBottom: '6px' }}>Tambah Foto/Video Carousel (max 9)</label>
                  <input type="file" accept="image/*,video/*" multiple onChange={handleAddCarouselFiles} style={{ width: '100%', fontSize: '11px', color: '#c9d1d9' }} />
                  <div style={{ fontSize: '10px', color: '#8b949e', marginTop: '6px' }}>Gambar pertama = hasil canvas final tanpa garis abu.</div>
                </div>
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#a371f7', display: 'block', marginBottom: '8px' }}>📝 Caption Instagram</label>
                <textarea value={igCaption} onChange={(e)=>setIgCaption(e.target.value)} placeholder="Tulis caption..." style={{ width: '100%', minHeight: '320px', backgroundColor: '#0d1117', border: '1px solid #30363d', color: '#e6edf3', padding: '12px', borderRadius: '10px', fontSize: '13px', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
                <div style={{ fontSize: '10px', color: '#8b949e', marginTop: '6px' }}>{igCaption.length} karakter</div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                  <button onClick={()=>setCurrentPage(3)} style={{ flex: 1, backgroundColor: '#21262d', color: '#c9d1d9', padding: '12px', borderRadius: '10px', border: '1px solid #30363d', cursor: 'pointer', fontWeight: 600, fontSize: '12px' }}>Batal</button>
                  <button onClick={uploadToInstagram} disabled={uploadStatus==='uploading' || uploadStatus==='creating'} style={{ flex: 2, backgroundColor: uploadStatus==='done'?'#238636':'#E1306C', color: '#fff', padding: '12px', borderRadius: '10px', fontWeight: 700, border: 'none', cursor: uploadStatus==='uploading'?'not-allowed':'pointer', opacity: uploadStatus==='uploading'?0.6:1, fontSize: '12px' }}>{uploadStatus==='idle'?`🚀 Upload ke IG (${carouselPreviews.length}) - ${uploadProgress}%`:uploadStatus==='done'?'✅ Berhasil Terpublish!':`⏳ ${uploadStepText} ${uploadProgress}%`}</button>
                </div>
                {uploadStatus==='done' && <div style={{ marginTop: '10px', backgroundColor: '#0d1117', border: '1px solid #238636', padding: '10px', borderRadius: '8px', fontSize: '11px', color: '#3fb950', textAlign: 'center' }}>Berhasil! Cek Instagram @agoravada. Kamu bisa kembali edit lagi.</div>}
                {uploadStatus==='error' && <div style={{ marginTop: '10px', backgroundColor: '#0d1117', border: '1px solid #f85149', padding: '10px', borderRadius: '8px', fontSize: '11px', color: '#f85149' }}>{uploadStepText}</div>}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
