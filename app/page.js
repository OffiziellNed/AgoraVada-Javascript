"use client";

import React, { useState, useRef, useEffect } from 'react';

export default function AgoraVadaPortal() {
  const [currentPage, setCurrentPage] = useState(1);
  const [urlBerita, setUrlBerita] = useState('');
  const [promptTeks, setPromptTeks] = useState('');
  const [rawBeritaContent, setRawBeritaContent] = useState('');
  const [promptMode, setPromptMode] = useState('homeless');
  const [selectedHook, setSelectedHook] = useState('urgent');
  // === UPLOAD IG STATES - TAMBAHAN BARU ===
  const [showUploadModal, setShowUploadModal] = useState(false);
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
    homeless: `Tolong buat 10 judul berita menggunakan hook dan copywriter handal untuk media alternatif "AgoraVada", serta buatkan caption untuk instagram, normatif saja dan informatif. Pastikan diakhiri oleh sumber berita dan 3 hastag (wajib ada #AgoraVada sisanya disesuaikan dengan kata kunci subjek dan topik yang dibahas).`,
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
        const fontSB = new FontFace('PoppinsSemiBold', 'url(/Poppins-SemiBold.ttf)');
        await fontSB.load(); document.fonts.add(fontSB);
        const fontSBI = new FontFace('PoppinsSemiBoldItalic', 'url(/Poppins-SemiBoldItalic.ttf)');
        await fontSBI.load(); document.fonts.add(fontSBI);
      } catch (err) {}
      try {
        const fontIBM = new FontFace('IBMPlexMono-SemiBold', 'url(/IBMPlexMono-SemiBold.ttf)');
        await fontIBM.load(); document.fonts.add(fontIBM);
        const fontIBMI = new FontFace('IBMPlexMono-SemiBoldItalic', 'url(/IBMPlexMono-SemiBoldItalic.ttf)');
        await fontIBMI.load(); document.fonts.add(fontIBMI);
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
      if (!imageUrl.startsWith('http')) {
        try { const img = await tryLoad(imageUrl); if (!isCancelled) setLoadedBgImg(img); } catch(e) {} return;
      }
      const proxies = [
        `https://api.allorigins.win/raw?url=${encodeURIComponent(imageUrl)}`,
        `https://wsrv.nl/?url=${encodeURIComponent(imageUrl)}`,
        `https://corsproxy.io/?${encodeURIComponent(imageUrl)}`, imageUrl
      ];
      for (let proxy of proxies) {
        try { const img = await tryLoad(proxy); if (!isCancelled) setLoadedBgImg(img); return; } catch(e) { continue; }
      }
      if (!isCancelled) { setLoadedBgImg(null); alert("Server website memblokir akses gambar ini. Silakan download manual lalu pakai UPLOAD DARI PC/HP."); }
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
    lines.forEach(lineArr => {
      let lineWidth = 0;
      lineArr.forEach((item, idx) => {
        const fontName = item.isItalic? italicFontFamily : baseFontFamily;
        ctx.font = `${baseFontSize}px ${fontName}, sans-serif`;
        lineWidth += ctx.measureText(item.word).width;
        if (idx < lineArr.length - 1) lineWidth += spaceWidth;
      });
      let currentX = x;
      if (align === 'center') currentX = x + (maxWidth - lineWidth) / 2;
      else if (align === 'right') currentX = x + (maxWidth - lineWidth);
      lineArr.forEach(item => {
        const fontName = item.isItalic? italicFontFamily : baseFontFamily;
        ctx.font = `${baseFontSize}px ${fontName}, sans-serif`; ctx.fillStyle = item.color; ctx.textAlign = 'left';
        ctx.fillText(item.word, currentX, currentY);
        currentX += ctx.measureText(item.word).width + spaceWidth;
      });
      currentY += lineHeight;
    });
  };

  useEffect(() => {
    if (currentPage!== 3) return;
    const canvas = canvasRef.current; if (!canvas) return; const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#111827'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (loadedBgImg) { ctx.save(); const drawW = loadedBgImg.width * imgScale; const drawH = loadedBgImg.height * imgScale; ctx.drawImage(loadedBgImg, imgX, imgY, drawW, drawH); ctx.restore(); }
    if (templateImgObj) { ctx.drawImage(templateImgObj, 0, 0, canvas.width, canvas.height); }
    ctx.save(); ctx.strokeStyle = 'rgba(231, 232, 32, 0.7)'; ctx.setLineDash([12, 8]); ctx.lineWidth = 2;
    ctx.strokeRect(MARGIN_PX, MARGIN_PX, canvas.width - MARGIN_PX*2, canvas.height - MARGIN_PX*2);
    ctx.strokeStyle = 'rgba(248, 136, 62, 0.9)'; ctx.setLineDash([]); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(MARGIN_PX, MARGIN_PX); ctx.lineTo(MARGIN_PX, canvas.height - MARGIN_PX); ctx.stroke();
    ctx.fillStyle = 'rgba(231, 232, 32, 0.9)'; ctx.font = '18px sans-serif'; ctx.textAlign = 'left';
    ctx.fillText('← 1.5cm', MARGIN_PX + 6, MARGIN_PX + 20); ctx.textAlign = 'right';
    ctx.fillText('1.5cm →', canvas.width - MARGIN_PX - 6, MARGIN_PX + 20); ctx.restore();
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
  }, [currentPage, loadedBgImg, templateImgObj, imgX, imgY, imgScale, teksX, teksY, ukuranFont, jarakBaris, sumberX, sumberY, ukuranFontSumber, judulHtml, sumberBerita, templateMode, teksAlign, sumberColor]);

  const handleMouseDown = (e) => { setIsDragging(true); const clientX = e.clientX || (e.touches && e.touches[0].clientX); const clientY = e.clientY || (e.touches && e.touches[0].clientY); setDragStart({ x: clientX - imgX, y: clientY - imgY }); };
  const handleMouseMove = (e) => { if (!isDragging) return; const clientX = e.clientX || (e.touches && e.touches[0].clientX); const clientY = e.clientY || (e.touches && e.touches[0].clientY); setImgX(clientX - dragStart.x); setImgY(clientY - dragStart.y); };
  const handleMouseUp = () => setIsDragging(false);
  const handleWheel = (e) => { e.preventDefault(); const zoomIntensity = 0.05; if (e.deltaY < 0) setImgScale(p => Math.min(p + zoomIntensity, 5)); else setImgScale(p => Math.max(p - zoomIntensity, 0.1)); };
  const handleUploadFoto = (e) => { const file = e.target.files[0]; if (file) setImageUrl(URL.createObjectURL(file)); };
  const handleUploadTemplate = (e) => {
    const file = e.target.files[0]; if (!file) return; const img = new Image(); const objectUrl = URL.createObjectURL(file);
    img.onload = () => { if (img.width!== 1080 || img.height!== 1350) { const confirmUpload = confirm(`⚠️ Ukuran template ${img.width} x ${img.height}, bukan 1080 x 1350. Tetap pakai?`); if (!confirmUpload) { URL.revokeObjectURL(objectUrl); return; } } setTemplateImgObj(img); };
    img.onerror = () => { alert('Gagal load template.'); }; img.src = objectUrl;
  };
  const downloadGambar = () => {
    const canvas = canvasRef.current;
    if (canvas) { const link = document.createElement('a'); link.download = 'AgoraVada_Post.jpg'; link.href = canvas.toDataURL("image/jpeg", 0.95); link.click(); }
  };
  // === UPLOAD IG LOGIC ===
  const stripHtml = (html) => { if (!html) return ''; const div = document.createElement('div'); div.innerHTML = html; return div.innerText || ''; };
  const openUploadModal = async () => {
    const judulText = stripHtml(judulHtml);
    setIgCaption(`${judulText}\n\n${sumberBerita?`Sumber: ${sumberBerita}`:''}\n\n#AgoraVada`.trim());
    setUploadProgress(0); setUploadStatus('idle'); setUploadStepText('');
    if (carouselFiles.length===0 && canvasRef.current){
      const blob = await new Promise(r=>canvasRef.current.toBlob(r,'image/jpeg',0.95));
      if (blob){
        const file = new File([blob],`agoravada-${Date.now()}.jpg`,{type:'image/jpeg'});
        setCarouselFiles([file]);
        setCarouselPreviews([{url:URL.createObjectURL(blob),type:'image',name:file.name,isMain:true}]);
      }
    }
    setShowUploadModal(true);
  };
  const handleAddCarouselFiles = (e) => {
    const files = Array.from(e.target.files||[]);
    if (carouselFiles.length + files.length > 9){ alert(`Max 9, sudah ${carouselFiles.length} mau nambah ${files.length}`); return; }
    const nf=[], np=[];
    files.forEach(f=>{ nf.push(f); np.push({url:URL.createObjectURL(f),type:f.type.startsWith('video')?'video':'image',name:f.name,isMain:false}) });
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
          const xhr=new XMLHttpRequest(); xhr.open('POST','/api/instagram/upload-image');
          xhr.upload.onprogress=(e)=>{ if(e.lengthComputable){ const base=(i/carouselFiles.length)*40; const cur=(e.loaded/e.total)*(40/carouselFiles.length); setUploadProgress(Math.round(5+base+cur)); setUploadStepText(`File ${i+1}/${carouselFiles.length}: ${Math.round(e.loaded/e.total*100)}%`);} };
          xhr.onload=()=>{ try{ const d=JSON.parse(xhr.responseText); d.url?res(d.url):rej(d);}catch{rej('error')} }; xhr.onerror=()=>rej('network'); xhr.send(fd);
        });
        uploaded.push({url,type:file.type.startsWith('video')?'video':'image'});
      }
      setUploadProgress(50); setUploadStatus('creating'); setUploadStepText('Bikin container IG...');
      const r=await fetch('/api/instagram/publish',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({items:uploaded,caption:igCaption})});
      const j=await r.json(); if(!r.ok) throw new Error(JSON.stringify(j));
      setUploadProgress(100); setUploadStatus('done'); setUploadStepText('✅ Berhasil publish!');
    }catch(err){ setUploadStatus('error'); setUploadStepText('❌ '+err.message); }
  };

  const handleCopyPrompt = () => { navigator.clipboard.writeText(promptTeks); setIsCopied(true); setTimeout(()=>setIsCopied(false),2000); };

  return (
    <div style={{ width: '100%', maxWidth: currentPage === 3? '950px' : '480px', margin: '0 auto', padding: '20px', transition: 'max-width 0.3s ease' }}>
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
                    if (data.content) { setRawBeritaContent(data.content); setPromptTeks(`${PROMPT_TEMPLATES[promptMode]}\n\n${data.content}`); setSumberBerita(data.source || ''); if (data.image) setImageUrl(data.image); setCurrentPage(2); }
                    else { alert("Gagal tarik berita: " + (data.error || "Unknown")); setPromptTeks(""); }
                  } catch(e) { alert("Error: " + e.message); setPromptTeks(""); }
                }}>Tarik Data ➔</button>
              <button style={{ width: '50%', backgroundColor: '#1f6feb', color: '#ffffff', padding: '12px', borderRadius: '10px', fontWeight: '600', fontSize: '13px', border: 'none', cursor: 'pointer' }} onClick={() => setCurrentPage(2)}>Langsung ke Editor ➔</button>
            </div>
          </div>
        )}
        {currentPage === 2 && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #30363d', paddingBottom: '8px' }}>
              <h2 style={{ fontSize: '15px', fontWeight: '700', color: '#c9d1d9', margin: 0 }}>2. Prompt Manual & Edit Teks</h2>
              <button onClick={handleCopyPrompt} style={{ backgroundColor: isCopied? '#238636' : '#21262d', color: '#ffffff', padding: '6px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: '600', border: isCopied? '1px solid #2ea043' : '1px solid #30363d', cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'all 0.2s ease' }}>{isCopied? "✅ Tersalin!" : "📋 Copy Prompt"}</button>
            </div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <button onClick={() => { setPromptMode('threads'); if (rawBeritaContent) setPromptTeks(`${PROMPT_TEMPLATES.threads}\n\n${rawBeritaContent}`); }} style={{ flex: 1, backgroundColor: promptMode === 'threads'? '#1f6feb' : '#21262d', color: promptMode === 'threads'? '#ffffff' : '#8b949e', padding: '10px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', border: promptMode === 'threads'? '1px solid #388bfd' : '1px solid #30363d', cursor: 'pointer' }}>🧵 Threads / X</button>
              <button onClick={() => { setPromptMode('homeless'); if (rawBeritaContent) setPromptTeks(`${PROMPT_TEMPLATES.homeless}\n\n${rawBeritaContent}`); }} style={{ flex: 1, backgroundColor: promptMode === 'homeless'? '#238636' : '#21262d', color: promptMode === 'homeless'? '#ffffff' : '#8b949e', padding: '10px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', border: promptMode === 'homeless'? '1px solid #2ea043' : '1px solid #30363d', cursor: 'pointer' }}>🏚️ Homeless Media</button>
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
                    <label style={{ fontSize: '11px', fontWeight: '700', color: '#3fb950', display: 'block', marginBottom: '8px' }}>🖼️ UPLOAD FOTO BERITA</label>
                    <input type="file" accept="image/*" onChange={handleUploadFoto} style={{ fontSize: '11px', color: '#c9d1d9', width: '100%' }} />
                  </div>
                  <div style={{ backgroundColor: '#161b22', padding: '16px', borderRadius: '10px', border: '1px solid #f0883e' }}>
                    <label style={{ fontSize: '11px', fontWeight: '700', color: '#f0883e', display: 'block', marginBottom: '6px' }}>🎨 UPLOAD MEDIA (Template)</label>
                    <input type="file" accept="image/*" onChange={handleUploadTemplate} style={{ fontSize: '11px', color: '#c9d1d9', width: '100%' }} />
                  </div>
                </div>
              </div>
              <div style={{ backgroundColor: '#0d1117', border: '1px solid #30363d', borderRadius: '12px', padding: '16px' }}>
                <label style={{ fontSize: '11px', fontWeight: '700', color: '#ffffff', display: 'block', marginBottom: '8px' }}>📝 EDIT JUDUL BERITA</label>
                <div id="judul-editor" contentEditable suppressContentEditableWarning style={{ width: '100%', backgroundColor: '#0d1117', border: '1px solid #30363d', color: '#ffffff', padding: '12px', borderRadius: '8px', fontSize: '14px', minHeight: '80px', outline: 'none', boxSizing: 'border-box' }} onInput={(e) => setJudulHtml(e.currentTarget.innerHTML)} dangerouslySetInnerHTML={{ __html: judulHtml }}></div>
              </div>
              <div style={{ backgroundColor: '#0d1117', padding: '12px 16px', borderRadius: '12px', border: '1px solid #30363d' }}>
                <label style={{ fontSize: '11px', fontWeight: '700', color: '#a371f7', display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}><span>✨ KONTROL POSISI JUDUL</span><button onClick={() => { const def = TEMPLATE_DEFAULTS[templateMode]; setTeksX(def.teksX); setTeksY(def.teksY); setUkuranFont(def.ukuranFont); setJarakBaris(def.jarakBaris); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', padding: 0 }}>🔄</button></label>
                <div style={{ display: 'flex', gap: '8px', marginTop: '14px', paddingTop: '12px', borderTop: '1px solid #30363d' }}>
                  <button style={{ width: '25%', backgroundColor: '#21262d', color: '#c9d1d9', padding: '10px', borderRadius: '8px', fontWeight: '600', fontSize: '11px', border: '1px solid #30363d', cursor: 'pointer' }} onClick={() => setCurrentPage(2)}>⬅ Kembali</button>
                  <button style={{ width: '35%', backgroundColor: '#238636', color: '#ffffff', padding: '10px', borderRadius: '8px', fontWeight: '700', fontSize: '11px', border: 'none', cursor: 'pointer' }} onClick={downloadGambar}>📥 Download</button>
                  <button style={{ width: '40%', backgroundColor: '#E1306C', color: '#ffffff', padding: '10px', borderRadius: '8px', fontWeight: '700', fontSize: '11px', border: 'none', cursor: 'pointer' }} onClick={openUploadModal}>📤 Upload IG</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {showUploadModal && (
        <div style={{ position:'fixed', inset:0, zIndex:9999, backgroundColor:'rgba(0,0,0,0.85)', display:'flex', alignItems:'center', justifyContent:'center', padding:'16px' }}>
          <div style={{ backgroundColor:'#161b22', border:'1px solid #30363d', borderRadius:'16px', width:'100%', maxWidth:'720px', maxHeight:'90vh', overflowY:'auto', padding:'20px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'16px' }}><h2 style={{ fontWeight:800, color:'#fff', margin:0 }}>📤 Upload ke Instagram</h2><button onClick={()=>setShowUploadModal(false)} style={{ background:'#21262d', border:'1px solid #30363d', color:'#fff', borderRadius:'8px', padding:'6px 10px' }}>✕</button></div>
            {uploadStatus!=='idle' && (
              <div style={{ marginBottom:'16px', backgroundColor:'#0d1117', padding:'12px', borderRadius:'10px', border:'1px solid #30363d' }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'6px' }}><span style={{ fontSize:'11px', color:'#8b949e' }}>{uploadStepText}</span><span style={{ fontSize:'11px', color:'#fff', fontWeight:700 }}>{uploadProgress}%</span></div>
                <div style={{ width:'100%', height:'8px', backgroundColor:'#21262d', borderRadius:'4px', overflow:'hidden' }}><div style={{ width:`${uploadProgress}%`, height:'100%', backgroundColor:uploadStatus==='error'?'#f85149':uploadStatus==='done'?'#3fb950':'#E1306C' }} /></div>
              </div>
            )}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px' }}>
              <div>
                <label style={{ fontSize:'11px', fontWeight:700, color:'#c9d1d9', display:'block', marginBottom:'8px' }}>Preview ({carouselPreviews.length}/9)</label>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'8px', marginBottom:'12px' }}>
                  {carouselPreviews.map((item,idx)=>(
                    <div key={idx} style={{ position:'relative', aspectRatio:'1/1', backgroundColor:'#0d1117', borderRadius:'8px', overflow:'hidden', border:item.isMain?'2px solid #E1306C':'1px solid #30363d' }}>
                      {item.type==='video'?<video src={item.url} style={{ width:'100%', height:'100%', objectFit:'cover' }} muted />:<img src={item.url} style={{ width:'100%', height:'100%', objectFit:'cover' }} alt={item.name} />}
                      <div style={{ position:'absolute', top:'4px', left:'4px', backgroundColor:'rgba(0,0,0,0.7)', color:'#fff', fontSize:'9px', padding:'2px 6px', borderRadius:'4px' }}>{idx===0?'COVER':idx+1}</div>
                      <button onClick={()=>removeCarouselItem(idx)} style={{ position:'absolute', top:'4px', right:'4px', backgroundColor:'#f85149', color:'#fff', border:'none', borderRadius:'50%', width:'20px', height:'20px', fontSize:'10px', cursor:'pointer' }}>✕</button>
                    </div>
                  ))}
                  {carouselPreviews.length<9 && <label style={{ aspectRatio:'1/1', border:'1px dashed #30363d', borderRadius:'8px', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#8b949e', fontSize:'11px', backgroundColor:'#0d1117' }}>＋Add<input type="file" accept="image/*,video/*" multiple onChange={handleAddCarouselFiles} style={{ display:'none' }} /></label>}
                </div>
                <input type="file" accept="image/*,video/*" multiple onChange={handleAddCarouselFiles} style={{ width:'100%', fontSize:'11px', color:'#c9d1d9' }} />
                <div style={{ fontSize:'10px', color:'#8b949e', marginTop:'6px' }}>Max 9. Cover = canvas utama.</div>
              </div>
              <div>
                <label style={{ fontSize:'11px', fontWeight:700, color:'#c9d1d9', display:'block', marginBottom:'8px' }}>Caption</label>
                <textarea value={igCaption} onChange={(e)=>setIgCaption(e.target.value)} style={{ width:'100%', minHeight:'260px', backgroundColor:'#0d1117', border:'1px solid #30363d', color:'#e6edf3', padding:'12px', borderRadius:'10px', fontSize:'13px' }} />
                <div style={{ display:'flex', gap:'8px', marginTop:'16px' }}>
                  <button onClick={()=>setShowUploadModal(false)} style={{ flex:1, backgroundColor:'#21262d', color:'#c9d1d9', padding:'12px', borderRadius:'10px', border:'1px solid #30363d' }}>Batal</button>
                  <button onClick={uploadToInstagram} style={{ flex:2, backgroundColor:uploadStatus==='done'?'#238636':'#E1306C', color:'#fff', padding:'12px', borderRadius:'10px', fontWeight:700, border:'none' }}>{uploadStatus==='done'?'✅ Berhasil!':`🚀 Upload (${uploadProgress}%)`}</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
