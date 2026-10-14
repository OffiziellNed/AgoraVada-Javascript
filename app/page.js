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
  // BARU - Review & Carousel
  const [reviewImageUrl, setReviewImageUrl] = useState(null);
  const [reviewImageBlob, setReviewImageBlob] = useState(null);
  const [captionText, setCaptionText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [additionalSlides, setAdditionalSlides] = useState([]); // {id,file,previewUrl,type}
  const [currentPreviewSlide, setCurrentPreviewSlide] = useState(0);

  const canvasRef = useRef(null);
  const [loadedBgImg, setLoadedBgImg] = useState(null);
  const [templateImgObj, setTemplateImgObj] = useState(null);

  const PROMPT_TEMPLATES = {
    homeless: `Tolong buat 10 judul berita menggunakan hook dan copywriter handal untuk media alternatif "AgoraVada", serta buatkan caption untuk instagram, normatif saja dan informatif. Pastikan diakhiri oleh sumber berita dan 3 hastag (wajib ada #AgoraVada sisanya disesuaikan dengan kata kunci subjek dan topik yang dibahas).`,
    threads: `Tolong identifikasi isu, paparkan fakta penting, berikan 10 perspektif 5 opini Pro dan 5 Opini Kontra untuk X atau Threads, Jika kontra boleh gunakan Bahasa satir, sarkas, tajam. Pastikan singkat singkat saja`
  };

  useEffect(() => {
    const loadFonts = async () => {
      try {
        const f1 = new FontFace('PoppinsSemiBold', 'url(/Poppins-SemiBold.ttf)'); await f1.load(); document.fonts.add(f1);
        const f2 = new FontFace('PoppinsSemiBoldItalic', 'url(/Poppins-SemiBoldItalic.ttf)'); await f2.load(); document.fonts.add(f2);
        const f3 = new FontFace('IBMPlexMono-SemiBold', 'url(/IBMPlexMono-SemiBold.ttf)'); await f3.load(); document.fonts.add(f3);
        const f4 = new FontFace('IBMPlexMono-SemiBoldItalic', 'url(/IBMPlexMono-SemiBoldItalic.ttf)'); await f4.load(); document.fonts.add(f4);
      } catch(e){}
    }; loadFonts();
    const tImg = new Image(); tImg.src = '/Agora Vada Template.png'; tImg.onload = () => setTemplateImgObj(tImg);
  }, []);

  useEffect(() => {
    if (!imageUrl) { setLoadedBgImg(null); return; }
    let cancelled = false;
    const tryLoad = (url) => new Promise((res, rej) => { const img = new Image(); img.crossOrigin='anonymous'; img.onload=()=>res(img); img.onerror=()=>rej(); img.src=url; });
    const load = async () => {
      if (!imageUrl.startsWith('http')) { try{ const i=await tryLoad(imageUrl); if(!cancelled) setLoadedBgImg(i);}catch{} return; }
      const proxies = [`https://api.allorigins.win/raw?url=${encodeURIComponent(imageUrl)}`,`https://wsrv.nl/?url=${encodeURIComponent(imageUrl)}`, imageUrl];
      for (let p of proxies){ try{ const i=await tryLoad(p); if(!cancelled) setLoadedBgImg(i); return; }catch{ continue; } }
    }; load(); return ()=>{cancelled=true;};
  }, [imageUrl]);

  const handleFormat = (cmd, val=null) => { document.execCommand(cmd,false,val); const ed=document.getElementById('judul-editor'); if(ed) setJudulHtml(ed.innerHTML); };

  const renderRichText = (ctx, htmlString, x, y, maxWidth, lineHeight, baseFontSize, align='left') => {
    if (!htmlString) return; ctx.textBaseline='top';
    const clean = htmlString.replace(/<div[^>]*><br><\/div>/gi,'\n').replace(/<div[^>]*>/gi,'\n').replace(/<\/div>/gi,'').replace(/<br\s*[\/]?>/gi,'\n');
    const tmp=document.createElement('div'); tmp.innerHTML=clean;
    let words=[]; const extract=(node,ctx2)=>{ if(node.nodeType===Node.TEXT_NODE){ node.textContent.split('\n').forEach((t,i)=>{ if(i>0) words.push({word:'__NL__',isNL:true}); t.split(/\s+/).forEach(w=>{ if(w.trim()) words.push({word:w.trim(),color:ctx2.color,isItalic:ctx2.isItalic}); }); }); } else if(node.nodeType===Node.ELEMENT_NODE){ let nc={...ctx2}; if(node.tagName==='I'||node.tagName==='EM'||node.style?.fontStyle==='italic') nc.isItalic=true; if(node.style?.color) nc.color=node.style.color; if(node.tagName==='FONT'&&node.getAttribute('color')) nc.color=node.getAttribute('color'); node.childNodes.forEach(c=>extract(c,nc)); } }; extract(tmp,{color:'#FFFFFF',isItalic:false});
    const baseF=templateMode==='agentlondo'?'IBMPlexMono-SemiBold':'PoppinsSemiBold'; const italicF=templateMode==='agentlondo'?'IBMPlexMono-SemiBoldItalic':'PoppinsSemiBoldItalic';
    ctx.font=`${baseFontSize}px ${baseF}, sans-serif`; const spW=ctx.measureText(' ').width; let lines=[], cur=[], curW=0;
    words.forEach(it=>{ if(it.isNL||it.word==='__NL__'){ lines.push(cur); cur=[]; curW=0; } else { const fn=it.isItalic?italicF:baseF; ctx.font=`${baseFontSize}px ${fn}, sans-serif`; const wW=ctx.measureText(it.word).width; if(curW+wW>maxWidth&&cur.length>0){ lines.push(cur); cur=[it]; curW=wW+spW; } else { cur.push(it); curW+=wW+spW; } } }); if(cur.length) lines.push(cur);
    let cy=y; lines.forEach((lineArr, li)=>{ let lw=0; lineArr.forEach((it,idx)=>{ const fn=it.isItalic?italicF:baseF; ctx.font=`${baseFontSize}px ${fn}, sans-serif`; lw+=ctx.measureText(it.word).width+(idx<lineArr.length-1?spW:0); }); let cx=x, gap=0; if(align==='center') cx=x+(maxWidth-lw)/2; else if(align==='right') cx=x+(maxWidth-lw); else if(align==='justify'&&li!==lines.length-1&&lineArr.length>1){ const raw=(maxWidth-lw)/(lineArr.length-1); if(raw<=28) gap=Math.min(raw,Math.min(12,spW*0.8)); } lineArr.forEach(it=>{ const fn=it.isItalic?italicF:baseF; ctx.font=`${baseFontSize}px ${fn}, sans-serif`; ctx.fillStyle=it.color; ctx.textAlign='left'; ctx.fillText(it.word,cx,cy); cx+=ctx.measureText(it.word).width+spW+gap; }); cy+=lineHeight; });
  };

  const renderCanvas = (ctx, canvas, showGuide=true) => {
    ctx.fillStyle='#111827'; ctx.fillRect(0,0,canvas.width,canvas.height);
    if(loadedBgImg){ const dw=loadedBgImg.width*imgScale, dh=loadedBgImg.height*imgScale; ctx.drawImage(loadedBgImg,imgX,imgY,dw,dh); }
    if(templateImgObj) ctx.drawImage(templateImgObj,0,0,canvas.width,canvas.height);
    if(showGuide){ ctx.save(); ctx.strokeStyle='rgba(139,148,158,0.5)'; ctx.setLineDash([10,8]); ctx.lineWidth=1.5; ctx.strokeRect(MARGIN_PX,MARGIN_PX,canvas.width-MARGIN_PX*2,canvas.height-MARGIN_PX*2); ctx.restore(); }
    const lh=ukuranFont*jarakBaris; const cx=Math.max(MARGIN_PX,Math.min(teksX,1080-MARGIN_PX-100)); const cy=Math.max(MARGIN_PX,Math.min(teksY,1350-MARGIN_PX-100)); const aw=1080-cx-MARGIN_PX; const mw=Math.max(100,Math.min(950,aw)); renderRichText(ctx,judulHtml,cx,cy,mw,lh,ukuranFont,teksAlign);
    if(sumberBerita){ ctx.fillStyle=sumberColor; const sf=templateMode==='agentlondo'?'IBMPlexMono-SemiBoldItalic':'PoppinsSemiBoldItalic'; ctx.font=`${ukuranFontSumber}px ${sf}, sans-serif`; ctx.textAlign='left'; ctx.textBaseline='top'; ctx.fillText(sumberBerita,sumberX,sumberY); }
  };

  useEffect(()=>{ if(currentPage!==3) return; const c=canvasRef.current; if(!c) return; const ctx=c.getContext('2d'); renderCanvas(ctx,c,true); }, [currentPage,loadedBgImg,templateImgObj,imgX,imgY,imgScale,teksX,teksY,ukuranFont,jarakBaris,sumberX,sumberY,ukuranFontSumber,judulHtml,sumberBerita,sumberColor,templateMode,teksAlign]);

  const handleMouseDown = (e)=>{ setIsDragging(true); const cx=e.clientX||e.touches?.[0]?.clientX; const cy=e.clientY||e.touches?.[0]?.clientY; setDragStart({x:cx-imgX,y:cy-imgY}); };
  const handleMouseMove = (e)=>{ if(!isDragging) return; const cx=e.clientX||e.touches?.[0]?.clientX; const cy=e.clientY||e.touches?.[0]?.clientY; setImgX(cx-dragStart.x); setImgY(cy-dragStart.y); };
  const handleMouseUp = ()=>setIsDragging(false);

  const downloadGambar = ()=>{ const c=canvasRef.current; if(!c) return; const ctx=c.getContext('2d'); renderCanvas(ctx,c,false); const a=document.createElement('a'); a.download=templateMode==='agentlondo'?'AgentLondo_Post.jpg':'AgoraVada_Post.jpg'; a.href=c.toDataURL('image/jpeg',0.95); a.click(); setTimeout(()=>{ const ctx2=c.getContext('2d'); renderCanvas(ctx2,c,true); },100); };

  const handleTapUploadButton = ()=>{ const c=canvasRef.current; if(!c) return; const ctx=c.getContext('2d'); renderCanvas(ctx,c,false); c.toBlob(blob=>{ if(!blob) return; const url=URL.createObjectURL(blob); setReviewImageBlob(blob); setReviewImageUrl(url); const tmp=document.createElement('div'); tmp.innerHTML=judulHtml; const plain=tmp.textContent||''; let cap=plain.trim(); if(sumberBerita) cap+=`\n\n${sumberBerita}`; if(cap.indexOf('#AgoraVada')===-1) cap+=`\n\n#AgoraVada #${templateMode==='agentlondo'?'AgentLondo':'AgoraVada} #BeritaBogor`; setCaptionText(cap.trim()); setCurrentPage(4); setCurrentPreviewSlide(0); setTimeout(()=>{ const cc=canvasRef.current; if(cc){ renderCanvas(cc.getContext('2d'),cc,true); } },150); },'image/jpeg',0.92); };

  // SLIDE TAMBAHAN
  const handleAdditionalFiles = (e)=>{ const files=Array.from(e.target.files); if(additionalSlides.length+files.length>9){ alert('Max 9 tambahan (total 10 slide)'); return; } const newSlides=files.map(f=>({ id:Date.now()+Math.random(), file:f, previewUrl:URL.createObjectURL(f), type:f.type.startsWith('video')?'video':'image' })); setAdditionalSlides(prev=>[...prev,...newSlides]); };
  const removeSlide = (id)=>{ setAdditionalSlides(prev=>{ const t=prev.find(s=>s.id===id); if(t) URL.revokeObjectURL(t.previewUrl); return prev.filter(s=>s.id!==id); }); };
  const moveSlide = (idx,dir)=>{ const arr=[...additionalSlides]; const n=dir==='up'?idx-1:idx+1; if(n<0||n>=arr.length) return; [arr[idx],arr[n]]=[arr[n],arr[idx]]; setAdditionalSlides(arr); };

  const handlePublish = async ()=>{
    if(!reviewImageBlob) return alert('Gambar utama belum siap');
    setIsUploading(true);
    try{
      const allFiles = [new File([reviewImageBlob],'slide1.jpg',{type:'image/jpeg'}),...additionalSlides.map(s=>s.file)];
      const urls=[];
      for(let f of allFiles){
        const fd=new FormData(); fd.append('file',f);
        const upRes=await fetch('/api/instagram/upload-image',{method:'POST',body:fd});
        const upData=await upRes.json(); if(!upRes.ok) throw new Error(upData.error||'Upload gagal');
        urls.push(upData.url||upData.image_url||upData.id);
      }
      const pubRes=await fetch('/api/instagram/publish',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({ imageUrls:urls, caption:captionText })});
      const pubData=await pubRes.json(); if(!pubRes.ok) throw new Error(pubData.error||'Publish gagal');
      alert('Berhasil publish IG! ID: '+(pubData.id||'ok')); setCurrentPage(3);
    }catch(err){ alert('Gagal: '+err.message); } finally{ setIsUploading(false); }
  };

  return (
    <div style={{minHeight:'100vh',backgroundColor:'#0d1117',color:'#e6edf3',fontFamily:'system-ui',padding:'20px'}}>
      {currentPage===3 && (
        <div>
          <div style={{display:'flex',gap:'20px',flexWrap:'wrap',maxWidth:'950px',margin:'0 auto'}}>
            <div style={{flex:'1',minWidth:'350px'}}>
              <div style={{backgroundColor:'#161b22',padding:'12px',borderRadius:'12px',border:'1px solid #30363d',display:'flex',flexDirection:'column',alignItems:'center'}}>
                <div style={{fontSize:'11px',color:'#8b949e',marginBottom:'8px'}}>LIVE PREVIEW (1080 x 1350) - drag untuk geser</div>
                <div style={{border:'2px dashed #30363d',borderRadius:'12px',overflow:'hidden'}}><canvas ref={canvasRef} width={1080} height={1350} style={{width:'320px',height:'400px',cursor:'grab',display:'block'}} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp} onTouchStart={handleMouseDown} onTouchMove={handleMouseMove} onTouchEnd={handleMouseUp} /></div>
                <div style={{marginTop:'8px',fontSize:'10px',color:'#6e7681'}}>Garis abu = margin 1.5cm (85px) hanya preview</div>
              </div>
            </div>
            <div style={{flex:'1',minWidth:'340px'}}>
              <div style={{backgroundColor:'#0d1117',padding:'16px',borderRadius:'12px',border:'1px solid #30363d',marginBottom:'12px'}}>
                <label style={{fontSize:'11px',fontWeight:'700',color:'#a371f7',display:'block',marginBottom:'10px'}}>📝 EDIT JUDUL</label>
                <div style={{display:'flex',gap:'8px',marginBottom:'10px',flexWrap:'wrap'}}>
                  <button onClick={()=>handleFormat('foreColor','#E7E820')} style={{backgroundColor:'#E7E820',color:'#000',padding:'6px 12px',borderRadius:'6px',fontSize:'11px',fontWeight:'bold',cursor:'pointer',border:'none'}}>Kuning</button>
                  <button onClick={()=>handleFormat('italic')} style={{backgroundColor:'#21262d',color:'#fff',padding:'6px 14px',borderRadius:'6px',fontSize:'12px',fontStyle:'italic',cursor:'pointer',border:'1px solid #30363d'}}>I</button>
                  <button onClick={()=>setTeksAlign('justify')} style={{backgroundColor:teksAlign==='justify'?'#a371f7':'#21262d',color:'#fff',padding:'6px 8px',borderRadius:'6px',fontSize:'12px',cursor:'pointer',border:'1px solid #30363d'}}>≣ Justify</button>
                </div>
                <div id="judul-editor" contentEditable onInput={e=>setJudulHtml(e.currentTarget.innerHTML)} style={{width:'100%',backgroundColor:'#161b22',border:'1px solid #30363d',color:'#fff',padding:'12px',borderRadius:'8px',fontSize:'14px',minHeight:'110px',maxHeight:'280px',outline:'none',boxSizing:'border-box',overflowY:'auto',whiteSpace:'pre-wrap',wordBreak:'break-all',overflowWrap:'anywhere',textAlign:teksAlign}} />
              </div>
              <div style={{backgroundColor:'#0d1117',padding:'12px',borderRadius:'12px',border:'1px solid #30363d'}}>
                <label style={{fontSize:'10px',fontWeight:'700',color:'#a371f7'}}>KONTROL POSISI JUDUL</label>
                <label style={{fontSize:'10px',color:'#8b949e',display:'flex',justifyContent:'space-between',marginTop:'8px'}}><span>Ukuran Font</span><span>{ukuranFont}</span></label>
                <input type="range" min={10} max={200} value={ukuranFont} onChange={e=>setUkuranFont(parseInt(e.target.value))} style={{width:'100%'}} />
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'8px',marginTop:'12px'}}>
                  <button onClick={()=>setCurrentPage(1)} style={{padding:'10px',borderRadius:'8px',backgroundColor:'#21262d',color:'#fff',border:'1px solid #30363d',cursor:'pointer',fontSize:'11px'}}>⬅ Kembali</button>
                  <button onClick={downloadGambar} style={{padding:'10px',borderRadius:'8px',backgroundColor:'#238636',color:'#fff',border:'none',cursor:'pointer',fontWeight:'700',fontSize:'11px'}}>📥 Download</button>
                  <button onClick={handleTapUploadButton} style={{padding:'10px',borderRadius:'8px',backgroundColor:'#1f6feb',color:'#fff',border:'none',cursor:'pointer',fontWeight:'700',fontSize:'11px'}}>☁️ Upload</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {currentPage===4 && (
        <div style={{maxWidth:'1100px',margin:'0 auto'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'20px'}}>
            <h2 style={{fontSize:'22px',fontWeight:'800'}}>👀 REVIEW & PUBLISH - {1+additionalSlides.length} Slide</h2>
            <button onClick={()=>setCurrentPage(3)} style={{padding:'8px 14px',borderRadius:'8px',backgroundColor:'#21262d',border:'1px solid #30363d',color:'#fff',cursor:'pointer'}}>⬅ Editor</button>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'400px 1fr',gap:'20px'}}>
            <div>
              <div style={{backgroundColor:'#161b22',padding:'12px',borderRadius:'12px',border:'1px solid #30363d',marginBottom:'12px'}}>
                <div style={{fontSize:'11px',color:'#8b949e',marginBottom:'8px'}}>Preview Slide {currentPreviewSlide+1} / {1+additionalSlides.length}</div>
                {currentPreviewSlide===0? reviewImageUrl && <img src={reviewImageUrl} style={{width:'100%',borderRadius:'8px'}} alt="slide1" /> : additionalSlides[currentPreviewSlide-1] && (additionalSlides[currentPreviewSlide-1].type==='video'? <video src={additionalSlides[currentPreviewSlide-1].previewUrl} style={{width:'100%',borderRadius:'8px'}} controls /> : <img src={additionalSlides[currentPreviewSlide-1].previewUrl} style={{width:'100%',borderRadius:'8px'}} alt="slide" />)}
                <div style={{display:'flex',gap:'6px',marginTop:'10px',justifyContent:'center'}}>{[reviewImageUrl,...additionalSlides.map(s=>s.previewUrl)].map((_,i)=>(<button key={i} onClick={()=>setCurrentPreviewSlide(i)} style={{width:'8px',height:'8px',borderRadius:'50%',backgroundColor:currentPreviewSlide===i?'#1f6feb':'#30363d',border:'none',cursor:'pointer'}} />))}</div>
                <div style={{display:'flex',gap:'8px',marginTop:'10px'}}><button onClick={()=>setCurrentPreviewSlide(p=>Math.max(0,p-1))} style={{flex:1,padding:'6px',borderRadius:'6px',backgroundColor:'#21262d',border:'1px solid #30363d',color:'#fff',cursor:'pointer'}}>◀</button><button onClick={()=>setCurrentPreviewSlide(p=>Math.min(additionalSlides.length,p+1))} style={{flex:1,padding:'6px',borderRadius:'6px',backgroundColor:'#21262d',border:'1px solid #30363d',color:'#fff',cursor:'pointer'}}>▶</button></div>
              </div>

              <div style={{backgroundColor:'#0d1117',padding:'12px',borderRadius:'12px',border:'1px solid #30363d'}}>
                <label style={{fontSize:'11px',fontWeight:'700',color:'#58a6ff',display:'block',marginBottom:'8px'}}>🎞️ SLIDE TAMBAHAN (Foto/Video)</label>
                <input type="file" multiple accept="image/*,video/*" onChange={handleAdditionalFiles} style={{fontSize:'11px',marginBottom:'10px'}} />
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px',maxHeight:'200px',overflowY:'auto'}}>
                  {additionalSlides.map((s,idx)=>(
                    <div key={s.id} style={{backgroundColor:'#161b22',border:'1px solid #30363d',borderRadius:'8px',padding:'6px',position:'relative'}}>
                      <div style={{fontSize:'10px',color:'#8b949e'}}>Slide {idx+2} {s.type==='video'?'📹':''}</div>
                      {s.type==='video'?<video src={s.previewUrl} style={{width:'100%',height:'60px',objectFit:'cover',borderRadius:'4px'}} />:<img src={s.previewUrl} style={{width:'100%',height:'60px',objectFit:'cover',borderRadius:'4px'}} />}
                      <div style={{display:'flex',gap:'4px',marginTop:'4px'}}><button onClick={()=>moveSlide(idx,'up')} style={{fontSize:'10px',padding:'2px 6px',borderRadius:'4px',backgroundColor:'#21262d',border:'1px solid #30363d',color:'#fff',cursor:'pointer'}}>↑</button><button onClick={()=>moveSlide(idx,'down')} style={{fontSize:'10px',padding:'2px 6px',borderRadius:'4px',backgroundColor:'#21262d',border:'1px solid #30363d',color:'#fff',cursor:'pointer'}}>↓</button><button onClick={()=>removeSlide(s.id)} style={{fontSize:'10px',padding:'2px 6px',borderRadius:'4px',backgroundColor:'#f85149',border:'none',color:'#fff',cursor:'pointer'}}>X</button></div>
                    </div>
                  ))}
                </div>
                <div style={{fontSize:'10px',color:'#6e7681',marginTop:'8px'}}>{additionalSlides.length}/9 tambahan (total max 10)</div>
              </div>
            </div>

            <div>
              <div style={{backgroundColor:'#0d1117',padding:'16px',borderRadius:'12px',border:'1px solid #30363d',marginBottom:'12px'}}>
                <label style={{fontSize:'11px',fontWeight:'700',color:'#58a6ff',display:'block',marginBottom:'8px'}}>📝 CAPTION</label>
                <textarea value={captionText} onChange={e=>setCaptionText(e.target.value)} style={{width:'100%',minHeight:'220px',backgroundColor:'#161b22',border:'1px solid #30363d',color:'#fff',padding:'12px',borderRadius:'8px',fontSize:'13px'}} />
              </div>
              <div style={{display:'flex',gap:'12px'}}>
                <button onClick={()=>setCurrentPage(3)} style={{flex:1,padding:'14px',borderRadius:'10px',backgroundColor:'#21262d',border:'1px solid #30363d',color:'#fff',cursor:'pointer',fontWeight:'600'}}>⬅ Kembali</button>
                <button onClick={handlePublish} disabled={isUploading} style={{flex:2,padding:'14px',borderRadius:'10px',backgroundColor:isUploading?'#30363d':'#238636',color:'#fff',border:'none',cursor:isUploading?'not-allowed':'pointer',fontWeight:'800'}}>{isUploading?`⏳ Uploading ${1+additionalSlides.length} slide...`:`🚀 Upload ${1+additionalSlides.length} Slide ke IG`}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {(currentPage===1||currentPage===2) && (
        <div style={{maxWidth:'480px',margin:'0 auto'}}>
          <div style={{backgroundColor:'#161b22',border:'1px solid #30363d',borderRadius:'16px',padding:'24px'}}>
            {currentPage===1 && (<><h2 style={{fontSize:'15px',fontWeight:'700',marginBottom:'16px'}}>1. Masukkan Link Berita</h2><input value={urlBerita} onChange={e=>setUrlBerita(e.target.value)} placeholder="https://..." style={{width:'100%',backgroundColor:'#0d1117',border:'1px solid #30363d',color:'#fff',padding:'12px',borderRadius:'10px',marginBottom:'16px',boxSizing:'border-box'}} /><button onClick={()=>setCurrentPage(3)} style={{width:'100%',padding:'12px',borderRadius:'10px',backgroundColor:'#238636',color:'#fff',border:'none',cursor:'pointer',fontWeight:'700'}}>Ke Editor →</button></>)}
            {currentPage===2 && (<><h2>Hook</h2><button onClick={()=>setCurrentPage(3)}>Ke Visual →</button></>)}
          </div>
        </div>
      )}
    </div>
  );
}
