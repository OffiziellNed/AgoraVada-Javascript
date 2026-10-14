"use client";
import React, { useState, useRef, useEffect } from 'react';

export default function AgoraVadaPortal() {
  const [currentPage, setCurrentPage] = useState(1);
  const [urlBerita, setUrlBerita] = useState('');
  const [promptTeks, setPromptTeks] = useState('');
  const [rawBeritaContent, setRawBeritaContent] = useState('');
  const [promptMode, setPromptMode] = useState('homeless');
  const [selectedHook, setSelectedHook] = useState('urgent');
  const [judulHtml, setJudulHtml] = useState('');
  const [sumberBerita, setSumberBerita] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [reviewImageUrl, setReviewImageUrl] = useState('');
  const [reviewImageBlob, setReviewImageBlob] = useState(null);
  const [captionText, setCaptionText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
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
    const tImg = new Image(); tImg.src = '/Agora Vada Template.png'; tImg.onload = () => setTemplateImgObj(tImg);
  }, []);
  useEffect(() => { if (!imageUrl) { setLoadedBgImg(null); return; } const img = new Image(); img.crossOrigin='anonymous'; img.onload=()=>setLoadedBgImg(img); img.src=imageUrl; }, [imageUrl]);
  const handleFormat = (command, value = null) => { document.execCommand(command, false, value); const editor = document.getElementById('judul-editor'); if (editor) setJudulHtml(editor.innerHTML); };
  const renderRichText = (ctx, htmlString, x, y, maxWidth, lineHeight, baseFontSize, align = 'left') => {
    if (!htmlString) return; ctx.textBaseline='top';
    const cleanHTML = htmlString.replace(/<div[^>]*><br><\/div>/gi, '\n').replace(/<div[^>]*>/gi, '\n').replace(/<\/div>/gi, '').replace(/<br\s*[\/]?>/gi, '\n');
    const tempDiv = document.createElement('div'); tempDiv.innerHTML=cleanHTML;
    let wordsWithContext=[]; const extract=(node,cur)=>{ if(node.nodeType===3){ node.textContent.split('\n').forEach((t,i)=>{ if(i>0) wordsWithContext.push({isNewline:true}); t.split(/\s+/).forEach(w=>{ if(w.trim()) wordsWithContext.push({word:w.trim(),...cur}); }); }); } else if(node.nodeType===1){ let nc={...cur}; if(node.tagName==='I'||node.tagName==='EM') nc.isItalic=true; if(node.style?.color) nc.color=node.style.color; if(node.tagName==='FONT'&&node.getAttribute('color')) nc.color=node.getAttribute('color'); node.childNodes.forEach(c=>extract(c,nc)); } }; extract(tempDiv,{color:'#FFFFFF',isItalic:false});
    let lines=[], curLine=[], curW=0; const baseF=templateMode==='agentlondo'?'IBMPlexMono-SemiBold':'PoppinsSemiBold'; const italicF=templateMode==='agentlondo'?'IBMPlexMono-SemiBoldItalic':'PoppinsSemiBoldItalic'; ctx.font=baseFontSize+'px '+baseF+', sans-serif'; const spW=ctx.measureText(' ').width;
    wordsWithContext.forEach(item=>{ if(item.isNewline){ lines.push(curLine); curLine=[]; curW=0; } else { const fn=item.isItalic?italicF:baseF; ctx.font=baseFontSize+'px '+fn+', sans-serif'; const wW=ctx.measureText(item.word).width; if(curW+wW>maxWidth&&curLine.length>0){ lines.push(curLine); curLine=[item]; curW=wW+spW; } else { curLine.push(item); curW+=wW+spW; } } }); if(curLine.length) lines.push(curLine);
    let curY=y; lines.forEach((lineArr,li)=>{ let lw=0; lineArr.forEach((it,idx)=>{ const fn=it.isItalic?italicF:baseF; ctx.font=baseFontSize+'px '+fn+', sans-serif'; lw+=ctx.measureText(it.word).width+(idx<lineArr.length-1?spW:0); }); let curX=x, gap=0; if(align==='center') curX=x+(maxWidth-lw)/2; else if(align==='right') curX=x+(maxWidth-lw); else if(align==='justify'&&li!==lines.length-1&&lineArr.length>1){ const raw=(maxWidth-lw)/(lineArr.length-1); const maxA=Math.min(12,spW*0.8); if(raw<=28) gap=Math.min(raw,maxA); } lineArr.forEach(it=>{ const fn=it.isItalic?italicF:baseF; ctx.font=baseFontSize+'px '+fn+', sans-serif'; ctx.fillStyle=it.color; ctx.textAlign='left'; ctx.fillText(it.word,curX,curY); curX+=ctx.measureText(it.word).width+spW+gap; }); curY+=lineHeight; });
  };
  const renderCanvas = (ctx, canvas, showMarginGuide = true) => {
    ctx.fillStyle='#111827'; ctx.fillRect(0,0,canvas.width,canvas.height);
    if(loadedBgImg){ const dw=loadedBgImg.width*imgScale, dh=loadedBgImg.height*imgScale; ctx.drawImage(loadedBgImg,imgX,imgY,dw,dh); }
    if(templateImgObj) ctx.drawImage(templateImgObj,0,0,canvas.width,canvas.height);
    if(showMarginGuide){ ctx.save(); ctx.strokeStyle='rgba(139,148,158,0.5)'; ctx.setLineDash([10,8]); ctx.lineWidth=1.5; ctx.strokeRect(MARGIN_PX,MARGIN_PX,canvas.width-MARGIN_PX*2,canvas.height-MARGIN_PX*2); ctx.restore(); }
    const lh=ukuranFont*jarakBaris; const clampedX=Math.max(MARGIN_PX,Math.min(teksX,1080-MARGIN_PX-100)); const clampedY=Math.max(MARGIN_PX,Math.min(teksY,1350-MARGIN_PX-100)); const aw=1080-clampedX-MARGIN_PX; const mw=Math.max(100,Math.min(950,aw)); renderRichText(ctx,judulHtml,clampedX,clampedY,mw,lh,ukuranFont,teksAlign);
    if(sumberBerita){ ctx.fillStyle=sumberColor||'#FFFFFF'; const sf=templateMode==='agentlondo'?'IBMPlexMono-SemiBoldItalic':'PoppinsSemiBoldItalic'; ctx.font=ukuranFontSumber+'px '+sf+', sans-serif'; ctx.textAlign='left'; ctx.textBaseline='top'; ctx.fillText(sumberBerita,sumberX,sumberY); }
  };
  useEffect(()=>{ if(currentPage!==3) return; const c=canvasRef.current; if(!c) return; renderCanvas(c.getContext('2d'),c,true); },[currentPage,loadedBgImg,templateImgObj,imgX,imgY,imgScale,teksX,teksY,ukuranFont,jarakBaris,sumberX,sumberY,ukuranFontSumber,judulHtml,sumberBerita,sumberColor,templateMode,teksAlign]);
  const handleMouseDown=(e)=>{ setIsDragging(true); const cx=e.clientX||e.touches?.[0]?.clientX; const cy=e.clientY||e.touches?.[0]?.clientY; setDragStart({x:cx-imgX,y:cy-imgY}); };
  const handleMouseMove=(e)=>{ if(!isDragging) return; const cx=e.clientX||e.touches?.[0]?.clientX; const cy=e.clientY||e.touches?.[0]?.clientY; setImgX(cx-dragStart.x); setImgY(cy-dragStart.y); };
  const handleMouseUp=()=>setIsDragging(false);
  const handleWheel=(e)=>{ e.preventDefault(); const zi=0.05; if(e.deltaY<0) setImgScale(p=>Math.min(p+zi,5)); else setImgScale(p=>Math.max(p-zi,0.1)); };
  const handleUploadFoto=(e)=>{ const file=e.target.files[0]; if(file) setImageUrl(URL.createObjectURL(file)); };
  const handleUploadTemplate=(e)=>{ const file=e.target.files[0]; if(!file) return; const img=new Image(); const ou=URL.createObjectURL(file); img.onload=()=>{ if(img.width!==1080||img.height!==1350){ if(!confirm('Ukuran template '+img.width+' x '+img.height+', bukan 1080 x 1350. Tetap pakai?')){ URL.revokeObjectURL(ou); return; } } setTemplateImgObj(img); }; img.onerror=()=>alert('Gagal load template'); img.src=ou; };
  const downloadGambar=()=>{ const c=canvasRef.current; if(!c) return; renderCanvas(c.getContext('2d'),c,false); const a=document.createElement('a'); a.download='AgoraVada_Post.jpg'; a.href=c.toDataURL("image/jpeg",0.95); a.click(); setTimeout(()=>renderCanvas(c.getContext('2d'),c,true),100); };
  const handleTapUploadButton=()=>{ const c=canvasRef.current; if(!c) return; renderCanvas(c.getContext('2d'),c,false); c.toBlob(blob=>{ if(!blob) return; const url=URL.createObjectURL(blob); setReviewImageBlob(blob); setReviewImageUrl(url); const tmp=document.createElement('div'); tmp.innerHTML=judulHtml||''; let cap=(tmp.textContent||'').trim(); if(sumberBerita) cap+=`\n\n${sumberBerita}`; if(!cap.includes('#AgoraVada')) cap+=`\n\n#AgoraVada #BeritaTerkini #Info`; setCaptionText(cap.trim()); setCurrentPage(4); setTimeout(()=>{ const cc=canvasRef.current; if(cc) renderCanvas(cc.getContext('2d'),cc,true); },150); },'image/jpeg',0.92); };
  const handlePublish=async()=>{ if(!reviewImageBlob) return alert('Gambar belum siap'); setIsUploading(true); try{ const fd=new FormData(); fd.append('file',reviewImageBlob); const upRes=await fetch('/api/instagram/upload-image',{method:'POST',body:fd}); const upData=await upRes.json(); if(!upRes.ok) throw new Error(upData.error); const pubRes=await fetch('/api/instagram/publish',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({ imageUrls:[upData.url], caption:captionText })}); const pubData=await pubRes.json(); if(!pubRes.ok) throw new Error(pubData.error||JSON.stringify(pubData)); alert('Berhasil publish IG!'); setCurrentPage(3); }catch(err){ alert('Gagal: '+err.message); } finally{ setIsUploading(false); } };
  const handleCopyPrompt=()=>{ navigator.clipboard.writeText(promptTeks); setIsCopied(true); setTimeout(()=>setIsCopied(false),2000); };

  return (
    <div style={{width:'100%',maxWidth:currentPage===3?'950px':currentPage===4?'900px':'480px',margin:'0 auto',padding:'20px'}}>
      <div style={{textAlign:'center',marginBottom:'20px'}}><h1 style={{fontSize:'20px',fontWeight:'800',letterSpacing:'1px',color:'#fff'}}>⚡ AGORA VADA</h1></div>
      <div style={{backgroundColor:'#161b22',border:'1px solid #30363d',borderRadius:'16px',padding:'24px'}}>
        {currentPage===1 && (
          <div>
            <h2 style={{fontSize:'15px',fontWeight:'700',marginBottom:'16px',color:'#c9d1d9',borderBottom:'1px solid #30363d',paddingBottom:'8px'}}>1. Masukkan Link Berita</h2>
            <input type="text" placeholder="https://news.com/..." style={{width:'100%',backgroundColor:'#0d1117',border:'1px solid #30363d',color:'#fff',padding:'12px 14px',borderRadius:'10px',fontSize:'14px',outline:'none',marginBottom:'16px',boxSizing:'border-box'}} value={urlBerita} onChange={(e)=>setUrlBerita(e.target.value)} />
            <div style={{display:'flex',gap:'10px'}}>
              <button style={{width:'50%',backgroundColor:'#21262d',color:'#c9d1d9',padding:'12px',borderRadius:'10px',fontWeight:'600',fontSize:'13px',border:'1px solid #30363d',cursor:'pointer'}} onClick={async()=>{ if(!urlBerita) return alert("Masukkan link dulu!"); setPromptTeks("Menyedot data dari web, tunggu sebentar..."); try{ const res=await fetch("/api/tarik-berita",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({url:urlBerita})}); const data=await res.json(); if(data.status==="success"){ setPromptTeks(PROMPT_TEMPLATES.homeless+"\n\n"+data.prompt); setSumberBerita(data.sumber||""); if(data.gambar_url) setImageUrl(data.gambar_url); setCurrentPage(2); } else { alert("Gagal menyedot: "+(data.error||"Terhalang")); } }catch{ alert("Gagal konek API"); } }}>Tarik Data 🔄</button>
              <button style={{width:'50%',backgroundColor:'#238636',color:'#fff',padding:'12px',borderRadius:'10px',fontWeight:'700',fontSize:'13px',border:'none',cursor:'pointer'}} onClick={()=>setCurrentPage(3)}>Langsung ke Editor ➔</button>
            </div>
          </div>
        )}
        {currentPage===2 && (
          <div>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'16px',borderBottom:'1px solid #30363d',paddingBottom:'8px'}}><h2 style={{fontSize:'15px',fontWeight:'700',color:'#c9d1d9',margin:0}}>2. Prompt Manual</h2><button onClick={handleCopyPrompt} style={{backgroundColor:isCopied?'#238636':'#21262d',color:'#fff',padding:'6px 12px',borderRadius:'6px',fontSize:'11px',fontWeight:'600',border:'1px solid #30363d',cursor:'pointer'}}>{isCopied?"✅ Tersalin!":"📋 Copy Prompt"}</button></div>
            <textarea style={{width:'100%',backgroundColor:'#0d1117',border:'1px solid #30363d',color:'#e6edf3',padding:'12px',borderRadius:'10px',fontSize:'13px',minHeight:'280px',outline:'none',marginBottom:'12px',boxSizing:'border-box'}} value={promptTeks} onChange={(e)=>setPromptTeks(e.target.value)} />
            <div style={{display:'flex',gap:'10px'}}><button style={{width:'35%',backgroundColor:'#21262d',color:'#c9d1d9',padding:'12px',borderRadius:'10px',fontWeight:'600',fontSize:'13px',border:'1px solid #30363d',cursor:'pointer'}} onClick={()=>setCurrentPage(1)}>⬅ Kembali</button><button style={{width:'65%',backgroundColor:'#1f6feb',color:'#fff',padding:'12px',borderRadius:'10px',fontWeight:'600',fontSize:'13px',border:'none',cursor:'pointer'}} onClick={()=>setCurrentPage(3)}>Ke Visual Editor ➔</button></div>
          </div>
        )}
        {currentPage===3 && (
          <div style={{display:'flex',flexDirection:'column',gap:'24px'}}>
            <div style={{backgroundColor:'#0d1117',border:'1px solid #30363d',borderRadius:'12px',padding:'20px',display:'flex',flexDirection:'column',gap:'20px'}}>
              <div style={{display:'flex',gap:'24px',alignItems:'flex-start',justifyContent:'center',flexWrap:'wrap'}}>
                <div style={{display:'flex',flexDirection:'column',alignItems:'center'}}>
                  <h2 style={{fontSize:'14px',fontWeight:'700',marginBottom:'12px',color:'#8b949e',textAlign:'center',letterSpacing:'1px'}}>LIVE PREVIEW (1080 x 1350)</h2>
                  <div style={{border:'2px dashed #30363d',borderRadius:'10px',padding:'8px',cursor:isDragging?'grabbing':'grab',backgroundColor:'#161b22'}}>
                    <canvas ref={canvasRef} width="1080" height="1350" onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp} onTouchStart={handleMouseDown} onTouchMove={handleMouseMove} onTouchEnd={handleMouseUp} onWheel={handleWheel} style={{width:'280px',height:'auto',borderRadius:'6px',display:'block',touchAction:'none'}} />
                  </div>
                  <div style={{fontSize:'10px',color:'#6e7681',marginTop:'8px',textAlign:'center'}}>Garis abu putus = margin 1.5cm (85px) - hanya preview</div>
                </div>
                <div style={{display:'flex',flexDirection:'column',gap:'12px',width:'240px'}}>
                  <div style={{backgroundColor:'#161b22',padding:'12px',borderRadius:'8px',border:'1px solid #30363d'}}><label style={{fontSize:'10px',fontWeight:'700',color:'#3fb950',display:'block',marginBottom:'8px'}}>🖼️ UPLOAD FOTO BERITA</label><input type="file" accept="image/*" onChange={handleUploadFoto} style={{fontSize:'11px',color:'#c9d1d9',width:'100%'}} /></div>
                  <div style={{backgroundColor:'#161b22',padding:'12px',borderRadius:'8px',border:'1px solid #f0883e'}}><label style={{fontSize:'10px',fontWeight:'700',color:'#f0883e',display:'block',marginBottom:'8px'}}>🎨 UPLOAD MEDIA (Template)</label><div style={{fontSize:'9px',color:'#8b949e',marginBottom:'8px'}}>Ganti template preview. Wajib ukuran <strong style={{color:'#f0883e'}}>1080 x 1350</strong></div><input type="file" accept="image/*" onChange={handleUploadTemplate} style={{fontSize:'11px',color:'#c9d1d9',width:'100%',marginBottom:'8px'}} /><div style={{display:'flex',gap:'6px'}}><button onClick={()=>{setTemplateMode('agoravada'); const def=TEMPLATE_DEFAULTS.agoravada; setTeksX(def.teksX); setTeksY(def.teksY); setUkuranFont(def.ukuranFont); setJarakBaris(def.jarakBaris); setSumberX(def.sumberX); setSumberY(def.sumberY); setUkuranFontSumber(def.ukuranFontSumber); const tImg=new Image(); tImg.src='/Agora Vada Template.png'; tImg.onload=()=>setTemplateImgObj(tImg);}} style={{flex:1,backgroundColor:templateMode==='agoravada'?'#f0883e':'#21262d',color:templateMode==='agoravada'?'#000':'#c9d1d9',padding:'8px 6px',borderRadius:'6px',fontSize:'10px',fontWeight:'700',border:'1px solid #30363d',cursor:'pointer'}}>🏚️ Agora Vada</button><button onClick={()=>{setTemplateMode('agentlondo'); const def=TEMPLATE_DEFAULTS.agentlondo; setTeksX(def.teksX); setTeksY(def.teksY); setUkuranFont(def.ukuranFont); setJarakBaris(def.jarakBaris); setSumberX(def.sumberX); setSumberY(def.sumberY); setUkuranFontSumber(def.ukuranFontSumber); const tImg=new Image(); tImg.src='/AgentLondo.png'; tImg.onload=()=>setTemplateImgObj(tImg);}} style={{flex:1,backgroundColor:templateMode==='agentlondo'?'#58a6ff':'#21262d',color:templateMode==='agentlondo'?'#fff':'#c9d1d9',padding:'8px 6px',borderRadius:'6px',fontSize:'10px',fontWeight:'700',border:'1px solid #30363d',cursor:'pointer'}}>🕵️ Agent Londo</button></div></div>
                </div>
              </div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'20px'}}>
              <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
                <div style={{backgroundColor:'#0d1117',padding:'16px',borderRadius:'12px',border:'1px solid #30363d'}}><label style={{fontSize:'11px',fontWeight:'700',color:'#a371f7',display:'block',marginBottom:'10px'}}>📝 EDIT JUDUL</label><div style={{display:'flex',gap:'8px',marginBottom:'10px',flexWrap:'wrap'}}><button onClick={()=>handleFormat('foreColor','#E7E820')} style={{backgroundColor:'#E7E820',color:'#000',padding:'6px 12px',borderRadius:'6px',fontSize:'11px',fontWeight:'bold',border:'none',cursor:'pointer'}}>Kuning</button><button onClick={()=>handleFormat('italic')} style={{backgroundColor:'#21262d',color:'#fff',padding:'6px 14px',borderRadius:'6px',fontSize:'12px',fontWeight:'bold',fontStyle:'italic',border:'1px solid #30363d',cursor:'pointer'}}>I</button><button onClick={()=>setTeksAlign('justify')} style={{backgroundColor:teksAlign==='justify'?'#a371f7':'#21262d',color:'#fff',padding:'6px 12px',borderRadius:'6px',fontSize:'12px',border:'1px solid #30363d',cursor:'pointer'}}>Justify</button></div><div id="judul-editor" contentEditable onInput={(e)=>setJudulHtml(e.currentTarget.innerHTML)} style={{width:'100%',backgroundColor:'#161b22',border:'1px solid #30363d',color:'#fff',padding:'12px',borderRadius:'8px',fontSize:'14px',minHeight:'110px',outline:'none',wordBreak:'break-all'}} /></div>
                <div style={{backgroundColor:'#0d1117',padding:'16px',borderRadius:'12px',border:'1px solid #30363d'}}><label style={{fontSize:'11px',fontWeight:'700',color:'#f78166',display:'block',marginBottom:'10px'}}>🔗 SUMBER BERITA</label><input type="text" style={{width:'100%',backgroundColor:'#161b22',border:'1px solid #30363d',color:'#fff',padding:'10px',borderRadius:'8px',fontSize:'13px',outline:'none'}} value={sumberBerita} onChange={(e)=>setSumberBerita(e.target.value)} /></div>
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
                <div style={{backgroundColor:'#0d1117',padding:'12px 16px',borderRadius:'12px',border:'1px solid #30363d'}}><label style={{fontSize:'11px',fontWeight:'700',color:'#3fb950',display:'block',marginBottom:'8px'}}>🖼️ KONTROL SKALA GAMBAR</label><div>Zoom <input type="range" min="0.2" max="3" step="0.05" value={imgScale} onChange={(e)=>setImgScale(parseFloat(e.target.value))} style={{width:'100%'}} /></div><div>Geser X <input type="range" min="-1000" max="1000" step="10" value={imgX} onChange={(e)=>setImgX(parseInt(e.target.value))} style={{width:'100%'}} /></div><div>Geser Y <input type="range" min="-1000" max="1000" step="10" value={imgY} onChange={(e)=>setImgY(parseInt(e.target.value))} style={{width:'100%'}} /></div></div>
                <div style={{backgroundColor:'#0d1117',padding:'12px 16px',borderRadius:'12px',border:'1px solid #30363d'}}><label style={{fontSize:'11px',fontWeight:'700',color:'#a371f7',display:'block',marginBottom:'8px'}}>✨ KONTROL POSISI JUDUL</label><div>Ukuran Font <input type="range" min="30" max="150" value={ukuranFont} onChange={(e)=>setUkuranFont(parseInt(e.target.value))} style={{width:'100%'}} /></div><div>Geser X <input type="range" min={MARGIN_PX} max={900} value={teksX} onChange={(e)=>setTeksX(parseInt(e.target.value))} style={{width:'100%'}} /></div><div>Geser Y <input type="range" min={MARGIN_PX} max={1200} value={teksY} onChange={(e)=>setTeksY(parseInt(e.target.value))} style={{width:'100%'}} /></div><div style={{display:'flex',gap:'8px',marginTop:'14px',paddingTop:'12px',borderTop:'1px solid #30363d'}}><button style={{width:'30%',backgroundColor:'#21262d',color:'#c9d1d9',padding:'12px',borderRadius:'8px',border:'1px solid #30363d',cursor:'pointer'}} onClick={()=>setCurrentPage(2)}>⬅ Kembali</button><button style={{width:'35%',backgroundColor:'#238636',color:'#fff',padding:'12px',borderRadius:'8px',border:'none',cursor:'pointer',fontWeight:'700'}} onClick={downloadGambar}>📥 Download</button><button style={{width:'35%',backgroundColor:'#1f6feb',color:'#fff',padding:'12px',borderRadius:'8px',border:'none',cursor:'pointer',fontWeight:'700'}} onClick={handleTapUploadButton}>☁️ Upload</button></div></div>
              </div>
            </div>
          </div>
        )}
        {currentPage===4 && (
          <div style={{display:'grid',gridTemplateColumns:'420px 1fr',gap:'20px'}}><div style={{backgroundColor:'#161b22',border:'1px solid #30363d',borderRadius:'14px',padding:'14px'}}><div style={{fontSize:'11px',fontWeight:'700',color:'#8b949e',marginBottom:'10px'}}>PREVIEW TANPA GARIS</div>{reviewImageUrl? <img src={reviewImageUrl} alt="review" style={{width:'100%',display:'block'}} /> : <div style={{padding:'80px',textAlign:'center',color:'#6e7681'}}>No image</div>}</div><div><div style={{backgroundColor:'#0d1117',border:'1px solid #30363d',borderRadius:'14px',padding:'16px'}}><div style={{fontSize:'11px',fontWeight:'700',color:'#58a6ff',marginBottom:'10px'}}>CAPTION</div><textarea value={captionText} onChange={e=>setCaptionText(e.target.value)} style={{width:'100%',minHeight:'320px',backgroundColor:'#161b22',border:'1px solid #30363d',color:'#fff',padding:'14px',borderRadius:'10px'}} /></div><div style={{display:'grid',gridTemplateColumns:'1fr 2fr',gap:'12px',marginTop:'14px'}}><button onClick={()=>setCurrentPage(3)} style={{padding:'14px',borderRadius:'10px',backgroundColor:'#21262d',border:'1px solid #30363d',color:'#fff',cursor:'pointer'}}>← Kembali</button><button onClick={handlePublish} disabled={isUploading} style={{padding:'14px',borderRadius:'10px',backgroundColor:isUploading?'#30363d':'#238636',color:'#fff',border:'none',cursor:'pointer',fontWeight:'800'}}>{isUploading?'⏳ Uploading...':'🚀 Publish ke Instagram'}</button></div></div></div>
        )}
      </div>
    </div>
  );
}
