"use client";
import React, { useState, useRef, useEffect } from 'react';

export default function Page() {
  const [currentPage, setCurrentPage] = useState(3);
  const [judulHtml, setJudulHtml] = useState('Desa Cipelang<br>Menjaga <font color="#E7E820"><i>Tradisi</i></font> Di Tengah Arus Modernisasi');
  const [sumberBerita, setSumberBerita] = useState('Sumber: Berita Bogor');
  const [imageUrl, setImageUrl] = useState('');
  const [imgX, setImgX] = useState(0);
  const [imgY, setImgY] = useState(0);
  const [imgScale, setImgScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({x:0,y:0});
  const [teksX, setTeksX] = useState(110);
  const [teksY, setTeksY] = useState(780);
  const [ukuranFont, setUkuranFont] = useState(72);
  const [jarakBaris, setJarakBaris] = useState(1.3);
  const [sumberX, setSumberX] = useState(110);
  const [sumberY, setSumberY] = useState(710);
  const [ukuranFontSumber, setUkuranFontSumber] = useState(24);
  const [sumberColor, setSumberColor] = useState('#FFFFFF');
  const [teksAlign, setTeksAlign] = useState('left');
  const MARGIN_PX = 85;

  // REVIEW
  const [reviewImageUrl, setReviewImageUrl] = useState(null);
  const [reviewImageBlob, setReviewImageBlob] = useState(null);
  const [captionText, setCaptionText] = useState('#AgoraVada #BeritaTerkini #Info');
  const [isUploading, setIsUploading] = useState(false);

  const canvasRef = useRef(null);
  const [loadedBgImg, setLoadedBgImg] = useState(null);
  const [templateImgObj, setTemplateImgObj] = useState(null);

  useEffect(()=>{
    const tImg = new Image();
    tImg.src='/Agora Vada Template.png';
    tImg.onload=()=>setTemplateImgObj(tImg);
    (async()=>{
      try{
        const f1=new FontFace('PoppinsSemiBold','url(/Poppins-SemiBold.ttf)');
        await f1.load(); document.fonts.add(f1);
        const f2=new FontFace('PoppinsSemiBoldItalic','url(/Poppins-SemiBoldItalic.ttf)');
        await f2.load(); document.fonts.add(f2);
      }catch{}
    })();
  },[]);

  useEffect(()=>{
    if(!imageUrl){ setLoadedBgImg(null); return; }
    const img=new Image(); img.crossOrigin='anonymous';
    img.onload=()=>setLoadedBgImg(img);
    img.src=imageUrl;
  },[imageUrl]);

  const handleFormat=(cmd,val=null)=>{
    document.execCommand(cmd,false,val);
    const ed=document.getElementById('judul-editor');
    if(ed) setJudulHtml(ed.innerHTML);
  };

  const renderRichText=(ctx,htmlString,x,y,maxWidth,lineHeight,baseFontSize,align='left')=>{
    if(!htmlString) return;
    ctx.textBaseline='top';
    const clean=htmlString.replace(/<div[^>]*><br><\/div>/gi,'\n').replace(/<div[^>]*>/gi,'\n').replace(/<\/div>/gi,'').replace(/<br\s*[\/]?>/gi,'\n');
    const tmp=document.createElement('div'); tmp.innerHTML=clean;
    let words=[];
    const extract=(node,ctx2)=>{
      if(node.nodeType===3){
        node.textContent.split('\n').forEach((t,i)=>{
          if(i>0) words.push({isNL:true});
          t.split(/\s+/).forEach(w=>{
            if(w.trim()) words.push({word:w.trim(),color:ctx2.color,isItalic:ctx2.isItalic});
          });
        });
      }else if(node.nodeType===1){
        let nc={...ctx2};
        if(node.tagName==='I'||node.tagName==='EM'||node.style?.fontStyle==='italic') nc.isItalic=true;
        if(node.style?.color) nc.color=node.style.color;
        if(node.tagName==='FONT'&&node.getAttribute('color')) nc.color=node.getAttribute('color');
        node.childNodes.forEach(c=>extract(c,nc));
      }
    };
    extract(tmp,{color:'#FFFFFF',isItalic:false});
    const baseF='PoppinsSemiBold'; const italicF='PoppinsSemiBoldItalic';
    const spW=ctx.measureText(' ').width;
    let lines=[], cur=[], curW=0;
    words.forEach(it=>{
      if(it.isNL){ lines.push(cur); cur=[]; curW=0; }
      else{
        const fn=it.isItalic?italicF:baseF;
        ctx.font=`${baseFontSize}px ${fn}, sans-serif`;
        const wW=ctx.measureText(it.word).width;
        if(curW+wW>maxWidth&&cur.length>0){ lines.push(cur); cur=[it]; curW=wW+spW; }
        else{ cur.push(it); curW+=wW+spW; }
      }
    });
    if(cur.length) lines.push(cur);
    let cy=y;
    lines.forEach((lineArr,li)=>{
      let lw=0;
      lineArr.forEach((it,idx)=>{
        const fn=it.isItalic?italicF:baseF;
        ctx.font=`${baseFontSize}px ${fn}, sans-serif`;
        lw+=ctx.measureText(it.word).width+(idx<lineArr.length-1?spW:0);
      });
      let cx=x, gap=0;
      if(align==='center') cx=x+(maxWidth-lw)/2;
      else if(align==='right') cx=x+(maxWidth-lw);
      else if(align==='justify'&&li!==lines.length-1&&lineArr.length>1){
        const raw=(maxWidth-lw)/(lineArr.length-1);
        if(raw<=28) gap=Math.min(raw,12);
      }
      lineArr.forEach(it=>{
        const fn=it.isItalic?italicF:baseF;
        ctx.font=`${baseFontSize}px ${fn}, sans-serif`;
        ctx.fillStyle=it.color;
        ctx.textAlign='left';
        ctx.fillText(it.word,cx,cy);
        cx+=ctx.measureText(it.word).width+spW+gap;
      });
      cy+=lineHeight;
    });
  };

  const renderCanvas=(ctx,canvas,showGuide=true)=>{
    ctx.fillStyle='#0d1117'; ctx.fillRect(0,0,canvas.width,canvas.height);
    if(loadedBgImg){
      const dw=loadedBgImg.width*imgScale, dh=loadedBgImg.height*imgScale;
      ctx.drawImage(loadedBgImg,imgX,imgY,dw,dh);
    }
    if(templateImgObj) ctx.drawImage(templateImgObj,0,0,canvas.width,canvas.height);
    if(showGuide){
      ctx.save();
      ctx.strokeStyle='rgba(139,148,158,0.5)';
      ctx.setLineDash([12,8]); ctx.lineWidth=1.5;
      ctx.strokeRect(MARGIN_PX,MARGIN_PX,canvas.width-MARGIN_PX*2,canvas.height-MARGIN_PX*2);
      ctx.restore();
    }
    const lh=ukuranFont*jarakBaris;
    const aw=1080-teksX-MARGIN_PX;
    const mw=Math.max(100,Math.min(950,aw));
    renderRichText(ctx,judulHtml,teksX,teksY,mw,lh,ukuranFont,teksAlign);
    if(sumberBerita){
      ctx.fillStyle=sumberColor;
      ctx.font=`${ukuranFontSumber}px PoppinsSemiBoldItalic, sans-serif`;
      ctx.textAlign='left'; ctx.textBaseline='top';
      ctx.fillText(sumberBerita,sumberX,sumberY);
    }
  };

  useEffect(()=>{
    if(currentPage!==3) return;
    const c=canvasRef.current; if(!c) return;
    renderCanvas(c.getContext('2d'),c,true);
  },[currentPage,loadedBgImg,templateImgObj,imgX,imgY,imgScale,teksX,teksY,ukuranFont,jarakBaris,sumberX,sumberY,ukuranFontSumber,judulHtml,sumberBerita,sumberColor,teksAlign]);

  const handleMouseDown=(e)=>{
    setIsDragging(true);
    const cx=e.clientX||e.touches?.[0]?.clientX;
    const cy=e.clientY||e.touches?.[0]?.clientY;
    setDragStart({x:cx-imgX,y:cy-imgY});
  };
  const handleMouseMove=(e)=>{
    if(!isDragging) return;
    const cx=e.clientX||e.touches?.[0]?.clientX;
    const cy=e.clientY||e.touches?.[0]?.clientY;
    setImgX(cx-dragStart.x); setImgY(cy-dragStart.y);
  };
  const handleMouseUp=()=>setIsDragging(false);

  const downloadGambar=()=>{
    const c=canvasRef.current; if(!c) return;
    renderCanvas(c.getContext('2d'),c,false);
    const a=document.createElement('a');
    a.download='AgoraVada_Post.jpg';
    a.href=c.toDataURL('image/jpeg',0.95); a.click();
    setTimeout(()=>renderCanvas(c.getContext('2d'),c,true),100);
  };

  const handleTapUploadButton=()=>{
    const c=canvasRef.current; if(!c) return;
    renderCanvas(c.getContext('2d'),c,false);
    c.toBlob(blob=>{
      if(!blob) return;
      const url=URL.createObjectURL(blob);
      setReviewImageBlob(blob); setReviewImageUrl(url);
      const tmp=document.createElement('div'); tmp.innerHTML=judulHtml;
      let cap=(tmp.textContent||'').trim();
      if(sumberBerita) cap+=`\n\n${sumberBerita}`;
      if(!cap.includes('#AgoraVada')) cap+=`\n\n#AgoraVada #BeritaTerkini #Info`;
      setCaptionText(cap.trim());
      setCurrentPage(4);
      setTimeout(()=>{ const cc=canvasRef.current; if(cc) renderCanvas(cc.getContext('2d'),cc,true); },150);
    },'image/jpeg',0.92);
  };

  const handlePublish=async()=>{
    if(!reviewImageBlob) return alert('Gambar belum siap');
    setIsUploading(true);
    try{
      const fd=new FormData(); fd.append('file',reviewImageBlob);
      const upRes=await fetch('/api/instagram/upload-image',{method:'POST',body:fd});
      const upData=await upRes.json(); if(!upRes.ok) throw new Error(upData.error);
      const pubRes=await fetch('/api/instagram/publish',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({ imageUrls:[upData.url], caption:captionText })});
      const pubData=await pubRes.json(); if(!pubRes.ok) throw new Error(pubData.error||JSON.stringify(pubData));
      alert('Berhasil publish IG!');
      setCurrentPage(3);
    }catch(err){ alert('Gagal: '+err.message); }
    finally{ setIsUploading(false); }
  };

  return (
    <div style={{minHeight:'100vh',backgroundColor:'#0d1117',color:'#e6edf3',fontFamily:'Inter,system-ui',padding:'24px'}}>
      <div style={{maxWidth:'1200px',margin:'0 auto'}}>
        <div style={{textAlign:'center',marginBottom:'20px',fontWeight:'800',letterSpacing:'1px'}}>⚡ AGORA VADA - Page {currentPage}</div>

        {currentPage===3 && (
          <div style={{display:'grid',gridTemplateColumns:'420px 1fr',gap:'20px'}}>
            <div style={{backgroundColor:'#161b22',border:'1px solid #30363d',borderRadius:'14px',padding:'16px'}}>
              <div style={{fontSize:'11px',color:'#8b949e',textAlign:'center',marginBottom:'10px'}}>LIVE PREVIEW 1080x1350 - drag gambar</div>
              <div style={{border:'1px dashed #30363d',borderRadius:'12px',overflow:'hidden',display:'flex',justifyContent:'center'}}>
                <canvas ref={canvasRef} width={1080} height={1350} style={{width:'380px',height:'475px',cursor:'grab',display:'block'}}
                  onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}
                  onTouchStart={handleMouseDown} onTouchMove={handleMouseMove} onTouchEnd={handleMouseUp} />
              </div>
              <div style={{fontSize:'10px',color:'#6e7681',textAlign:'center',marginTop:'8px'}}>Garis abu = margin 1.5cm (85px) hanya preview</div>
            </div>

            <div>
              <div style={{backgroundColor:'#161b22',border:'1px solid #30363d',borderRadius:'14px',padding:'16px'}}>
                <div style={{fontSize:'11px',fontWeight:'700',color:'#a371f7',marginBottom:'8px'}}>📝 EDIT JUDUL</div>
                <div style={{display:'flex',gap:'8px',marginBottom:'12px'}}>
                  <button onClick={()=>handleFormat('foreColor','#E7E820')} style={{backgroundColor:'#E7E820',color:'#000',padding:'6px 14px',borderRadius:'8px',fontWeight:'800',border:'none',cursor:'pointer'}}>Kuning</button>
                  <button onClick={()=>handleFormat('italic')} style={{backgroundColor:'#21262d',color:'#fff',padding:'6px 12px',borderRadius:'8px',border:'1px solid #30363d',cursor:'pointer',fontStyle:'italic'}}>I</button>
                  <button onClick={()=>setTeksAlign(teksAlign==='justify'?'left':'justify')} style={{backgroundColor:teksAlign==='justify'?'#a371f7':'#21262d',color:'#fff',padding:'6px 12px',borderRadius:'8px',border:'1px solid #30363d',cursor:'pointer'}}>Justify</button>
                </div>
                <div id="judul-editor" contentEditable suppressContentEditableWarning onInput={e=>setJudulHtml(e.currentTarget.innerHTML)} dangerouslySetInnerHTML={{__html:judulHtml}} style={{width:'100%',backgroundColor:'#0d1117',border:'1px solid #30363d',color:'#fff',padding:'12px',borderRadius:'10px',minHeight:'120px',outline:'none',fontSize:'16px',lineHeight:'1.4'}} />
                <div style={{marginTop:'14px'}}>
                  <div style={{fontSize:'11px',color:'#8b949e',marginBottom:'6px'}}>Sumber</div>
                  <input value={sumberBerita} onChange={e=>setSumberBerita(e.target.value)} style={{width:'100%',backgroundColor:'#0d1117',border:'1px solid #30363d',color:'#fff',padding:'10px',borderRadius:'8px'}} />
                </div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px',marginTop:'14px'}}>
                <button onClick={downloadGambar} style={{padding:'14px',borderRadius:'10px',backgroundColor:'#238636',color:'#fff',border:'none',fontWeight:'800',cursor:'pointer'}}>📥 Download</button>
                <button onClick={handleTapUploadButton} style={{padding:'14px',borderRadius:'10px',backgroundColor:'#1f6feb',color:'#fff',border:'none',fontWeight:'800',cursor:'pointer'}}>☁️ Upload → Review</button>
              </div>
            </div>
          </div>
        )}

        {currentPage===4 && (
          <div style={{display:'grid',gridTemplateColumns:'420px 1fr',gap:'20px',maxWidth:'1000px',margin:'0 auto'}}>
            <div style={{backgroundColor:'#161b22',border:'1px solid #30363d',borderRadius:'14px',padding:'14px'}}>
              <div style={{fontSize:'11px',fontWeight:'700',color:'#8b949e',marginBottom:'10px'}}>PREVIEW GAMBAR (TANPA GARIS MARGIN)</div>
              <div style={{borderRadius:'10px',overflow:'hidden',backgroundColor:'#0d1117',border:'1px solid #30363d'}}>
                {reviewImageUrl? <img src={reviewImageUrl} alt="review" style={{width:'100%',display:'block'}} /> : <div style={{padding:'80px',textAlign:'center',color:'#6e7681'}}>No image</div>}
              </div>
              <div style={{fontSize:'10px',color:'#6e7681',textAlign:'center',marginTop:'8px'}}>1080 x 1350 - siap upload</div>
            </div>
            <div>
              <div style={{backgroundColor:'#0d1117',border:'1px solid #30363d',borderRadius:'14px',padding:'16px'}}>
                <div style={{fontSize:'11px',fontWeight:'700',color:'#58a6ff',marginBottom:'10px'}}>CAPTION INSTAGRAM</div>
                <textarea value={captionText} onChange={e=>setCaptionText(e.target.value)} style={{width:'100%',minHeight:'320px',backgroundColor:'#161b22',border:'1px solid #30363d',color:'#fff',padding:'14px',borderRadius:'10px',fontSize:'13px',resize:'vertical'}} />
                <div style={{fontSize:'11px',color:'#6e7681',marginTop:'6px'}}>{captionText.length} karakter</div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 2fr',gap:'12px',marginTop:'14px'}}>
                <button onClick={()=>setCurrentPage(3)} style={{padding:'14px',borderRadius:'10px',backgroundColor:'#21262d',border:'1px solid #30363d',color:'#fff',cursor:'pointer',fontWeight:'600'}}>← Kembali Edit</button>
                <button onClick={handlePublish} disabled={isUploading} style={{padding:'14px',borderRadius:'10px',backgroundColor:isUploading?'#30363d':'#238636',color:'#fff',border:'none',cursor:isUploading?'not-allowed':'pointer',fontWeight:'800'}}>{isUploading?'⏳ Uploading...':'🚀 Publish ke Instagram'}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
