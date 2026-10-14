"use client";
import React, { useState, useRef, useEffect } from "react";

export default function Page() {
  const [step, setStep] = useState(1);

  // Page 1-2 data
  const [newsUrl, setNewsUrl] = useState("");
  const [judul, setJudul] = useState("PEMERINTAH UMUMKAN KEBIJAKAN BARU EKONOMI DIGITAL 2025");
  const [isi, setIsi] = useState("Pemerintah hari ini mengumumkan langkah strategis untuk mempercepat transformasi digital di seluruh sektor ekonomi. Kebijakan ini mencakup insentif pajak, dukungan infrastruktur, dan kolaborasi lintas kementerian untuk mendorong inovasi. Langkah ini diharapkan meningkatkan daya saing nasional di kancah global dan membuka lapangan kerja baru bagi generasi muda.");
  const [sumber, setSumber] = useState("AGORA VADA / KOMPAS");

  // Assets
  const [imageSrc, setImageSrc] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const canvasRef = useRef(null);
  const previewRef = useRef(null);
  const containerRef = useRef(null);

  // Controls - Page 3
  const [imgX, setImgX] = useState(0);
  const [imgY, setImgY] = useState(0);
  const [imgScale, setImgScale] = useState(1.1);
  const [teksX, setTeksX] = useState(85);
  const [teksY, setTeksY] = useState(780);
  const [ukuranFont, setUkuranFont] = useState(54);
  const [jarakBaris, setJarakBaris] = useState(62);
  const [lebarTeks, setLebarTeks] = useState(910);
  const [overlayOpacity, setOverlayOpacity] = useState(0.72);

  // Drag state
  const [dragTarget, setDragTarget] = useState(null);
  const dragStart = useRef({ x: 0, y: 0, origX: 0, origY: 0 });

  // Page 4 carousel
  const [reviewImageUrl, setReviewImageUrl] = useState(null);
  const [reviewBlob, setReviewBlob] = useState(null);
  const [additionalSlides, setAdditionalSlides] = useState([]);
  const [currentPreview, setCurrentPreview] = useState(0);
  const [caption, setCaption] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishLog, setPublishLog] = useState("");

  function renderRichText(ctx, text, x, y, maxWidth, fontSize, lineHeight) {
    const words = text.split(/\s+/).filter(Boolean);
    let line = "";
    let curY = y;
    ctx.textBaseline = "top";

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + " ";
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;

      if (testWidth > maxWidth && n > 0) {
        const lineWords = line.trim().split(" ");
        if (lineWords.length > 1) {
          const lineWidthNoSpace = lineWords.reduce(function(acc, w) {
            return acc + ctx.measureText(w).width;
          }, 0);
          let gap = (maxWidth - lineWidthNoSpace) / (lineWords.length - 1);
          if (gap > 12) gap = 12;
          let curX = x;
          for (let w = 0; w < lineWords.length; w++) {
            ctx.fillText(lineWords[w], curX, curY);
            curX += ctx.measureText(lineWords[w]).width + gap;
          }
        } else {
          ctx.fillText(line.trim(), x, curY);
        }
        line = words[n] + " ";
        curY += lineHeight;
      } else {
        line = testLine;
      }
    }
    if (line.trim().length > 0) {
      ctx.fillText(line.trim(), x, curY);
    }
    return curY;
  }

  function renderCanvas(ctx, canvas, showGuide) {
    const W = 1080;
    const H = 1350;
    canvas.width = W;
    canvas.height = H;

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "#0d1117";
    ctx.fillRect(0, 0, W, H);

    if (imageSrc) {
      const img = new window.Image();
      img.src = imageSrc;
      // Synchronous draw via cached image element
      const drawW = W * imgScale;
      const drawH = (W * 0.75) * imgScale;
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, W, 900);
      ctx.clip();
      ctx.drawImage(img, imgX, imgY, drawW, drawH);
      ctx.restore();

      const grad = ctx.createLinearGradient(0, 500, 0, H);
      grad.addColorStop(0, "rgba(13,17,23,0)");
      grad.addColorStop(0.35, "rgba(13,17,23," + (overlayOpacity * 0.6) + ")");
      grad.addColorStop(1, "rgba(13,17,23," + overlayOpacity + ")");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 500, W, H - 500);
    } else {
      ctx.fillStyle = "#161b22";
      ctx.fillRect(0, 0, W, 900);
      ctx.fillStyle = "#30363d";
      ctx.font = "600 28px sans-serif";
      ctx.fillText("BELUM ADA GAMBAR", 420, 440);
    }

    // Label kategori
    ctx.fillStyle = "#facc15";
    ctx.fillRect(teksX, teksY - 46, 132, 32);
    ctx.fillStyle = "#0d1117";
    ctx.font = "800 16px sans-serif";
    ctx.fillText("BREAKING", teksX + 14, teksY - 36);

    // Judul utama
    ctx.fillStyle = "#ffffff";
    ctx.font = "900 " + ukuranFont + "px Inter, sans-serif";
    ctx.textAlign = "left";
    const afterTitleY = renderRichText(ctx, judul.toUpperCase(), teksX, teksY, lebarTeks, ukuranFont, jarakBaris);

    // Sumber
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.font = "600 20px sans-serif";
    ctx.fillText(sumber.toUpperCase(), teksX, afterTitleY + 28);

    // Margin guide hanya preview
    if (showGuide) {
      ctx.save();
      ctx.strokeStyle = "rgba(250,204,21,0.9)";
      ctx.lineWidth = 2;
      ctx.setLineDash([14, 12]);
      ctx.strokeRect(85, 85, W - 170, H - 170);
      ctx.setLineDash([]);
      ctx.fillStyle = "rgba(250,204,21,0.15)";
      ctx.fillRect(85, 85, W - 170, H - 170);
      ctx.fillStyle = "#facc15";
      ctx.font = "600 14px sans-serif";
      ctx.fillText("SAFE AREA 85PX", 92, 102);
      ctx.restore();
    }
  }

  useEffect(function() {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    if (imageSrc) {
      const im = new window.Image();
      im.onload = function() {
        renderCanvas(ctx, c, true);
      };
      im.src = imageSrc;
    } else {
      renderCanvas(ctx, c, true);
    }
  }, [imageSrc, imgX, imgY, imgScale, teksX, teksY, ukuranFont, jarakBaris, lebarTeks, sumber, judul, overlayOpacity]);

  function handleMouseDown(e) {
    const rect = containerRef.current ? containerRef.current.getBoundingClientRect() : { left: 0, top: 0, width: 1080 };
    const scale = 1080 / rect.width;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const x = (clientX - rect.left) * scale;
    const y = (clientY - rect.top) * scale;

    dragStart.current = { x: clientX, y: clientY, origX: 0, origY: 0 };

    if (y < 900) {
      setDragTarget("image");
      dragStart.current.origX = imgX;
      dragStart.current.origY = imgY;
    } else {
      setDragTarget("text");
      dragStart.current.origX = teksX;
      dragStart.current.origY = teksY;
    }
  }

  function handleMouseMove(e) {
    if (!dragTarget) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const dx = clientX - dragStart.current.x;
    const dy = clientY - dragStart.current.y;
    const rect = containerRef.current ? containerRef.current.getBoundingClientRect() : { width: 360 };
    const scale = 1080 / rect.width;

    if (dragTarget === "image") {
      setImgX(dragStart.current.origX + dx * scale);
      setImgY(dragStart.current.origY + dy * scale);
    } else {
      setTeksX(Math.max(40, Math.min(200, dragStart.current.origX + dx * scale)));
      setTeksY(Math.max(600, Math.min(1100, dragStart.current.origY + dy * scale)));
    }
  }

  function handleMouseUp() {
    setDragTarget(null);
  }

  function downloadGambar() {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const draw = function(imgEl) {
      if (imgEl) {
        canvas.width = 1080;
        canvas.height = 1350;
        ctx.drawImage(imgEl, 0, 0);
        renderCanvas(ctx, canvas, false);
      } else {
        renderCanvas(ctx, canvas, false);
      }
      const link = document.createElement("a");
      link.download = "agora-vada-" + Date.now() + ".png";
      link.href = canvas.toDataURL("image/png");
      link.click();
    };

    if (imageSrc) {
      const im = new window.Image();
      im.onload = function() {
        const tmp = document.createElement("canvas");
        const tctx = tmp.getContext("2d");
        tmp.width = 1080;
        tmp.height = 1350;
        if (tctx) {
          const iw = 1080 * imgScale;
          const ih = (1080 * 0.75) * imgScale;
          tctx.fillStyle = "#0d1117";
          tctx.fillRect(0, 0, 1080, 1350);
          tctx.drawImage(im, imgX, imgY, iw, ih);
          const grad = tctx.createLinearGradient(0, 500, 0, 1350);
          grad.addColorStop(0, "rgba(13,17,23,0)");
          grad.addColorStop(1, "rgba(13,17,23," + overlayOpacity + ")");
          tctx.fillStyle = grad;
          tctx.fillRect(0, 500, 1080, 850);
        }
        draw(im);
      };
      im.src = imageSrc;
    } else {
      renderCanvas(ctx, canvas, false);
      const link = document.createElement("a");
      link.download = "agora-vada-" + Date.now() + ".png";
      link.href = canvas.toDataURL("image/png");
      link.click();
    }
  }

  function handleTapUploadButton() {
    const canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 1350;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const finalize = function() {
      canvas.toBlob(function(blob) {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        setReviewBlob(blob);
        setReviewImageUrl(url);
        setCurrentPreview(0);
        setStep(4);
      }, "image/jpeg", 0.92);
    };

    if (imageSrc) {
      const im = new window.Image();
      im.onload = function() {
        renderCanvas(ctx, canvas, false);
        finalize();
      };
      im.src = imageSrc;
    } else {
      renderCanvas(ctx, canvas, false);
      finalize();
    }
  }

  function handleAdditionalFiles(e) {
    const files = Array.from(e.target.files || []);
    const remaining = 9 - additionalSlides.length;
    const toAdd = files.slice(0, remaining);

    const mapped = toAdd.map(function(f, idx) {
      const isVideo = f.type.indexOf("video") === 0;
      return {
        id: Date.now() + idx + Math.random(),
        file: f,
        previewUrl: URL.createObjectURL(f),
        type: isVideo ? "video" : "image",
        name: f.name
      };
    });

    setAdditionalSlides(function(prev) {
      return prev.concat(mapped);
    });
    e.target.value = "";
  }

  function removeSlide(id) {
    setAdditionalSlides(function(prev) {
      const found = prev.find(function(s) { return s.id === id; });
      if (found) URL.revokeObjectURL(found.previewUrl);
      return prev.filter(function(s) { return s.id !== id; });
    });
    if (currentPreview > 0 && currentPreview >= additionalSlides.length) {
      setCurrentPreview(function(c) { return Math.max(0, c - 1); });
    }
  }

  function moveSlide(index, dir) {
    setAdditionalSlides(function(prev) {
      const arr = prev.slice();
      const newIdx = index + dir;
      if (newIdx < 0 || newIdx >= arr.length) return arr;
      const tmp = arr[index];
      arr[index] = arr[newIdx];
      arr[newIdx] = tmp;
      return arr;
    });
  }

  async function handlePublish() {
    setIsPublishing(true);
    setPublishLog("Mulai upload...");

    try {
      const allFiles = [];
      if (reviewBlob) {
        allFiles.push(new File([reviewBlob], "slide-1.jpg", { type: "image/jpeg" }));
      }
      additionalSlides.forEach(function(s) {
        allFiles.push(s.file);
      });

      const imageUrls = [];
      for (let i = 0; i < allFiles.length; i++) {
        setPublishLog("Upload " + (i + 1) + "/" + allFiles.length + "...");
        const form = new FormData();
        form.append("file", allFiles[i]);
        const res = await fetch("/api/instagram/upload-image", {
          method: "POST",
          body: form
        });
        if (!res.ok) throw new Error("Gagal upload slide " + (i + 1));
        const data = await res.json();
        imageUrls.push(data.url || data.imageUrl);
      }

      setPublishLog("Publish carousel " + imageUrls.length + " slides...");
      const pubRes = await fetch("/api/instagram/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrls: imageUrls, caption: caption })
      });

      if (!pubRes.ok) throw new Error("Gagal publish");
      const result = await pubRes.json();
      setPublishLog("Berhasil publish! ID: " + (result.id || "ok"));
      alert("Berhasil publish carousel!");
    } catch (err) {
      setPublishLog("Error: " + err.message);
    } finally {
      setIsPublishing(false);
    }
  }

  function onImagePick(e) {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    setImageFile(f);
    const url = URL.createObjectURL(f);
    setImageSrc(url);
  }

  return (
    <div style={{ background: "#0d1117", minHeight: "100vh", color: "#e6edf3", fontFamily: "Inter, ui-sans-serif, system-ui" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "24px 20px 80px" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28, borderBottom: "1px solid #21262d", paddingBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 36, height: 36, background: "#facc15", borderRadius: 8, display: "grid", placeItems: "center", color: "#0d1117", fontWeight: 900 }}>A</div>
            <div>
              <div style={{ fontWeight: 800, letterSpacing: 0.5 }}>AGORA VADA PORTAL</div>
              <div style={{ fontSize: 12, opacity: 0.6 }}>News to Carousel Studio — 1080x1350</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {[1, 2, 3, 4].map(function(n) {
              return (
                <div key={n} onClick={function() { setStep(n); }} style={{ width: 36, height: 36, borderRadius: 999, display: "grid", placeItems: "center", cursor: "pointer", border: "1px solid " + (step === n ? "#facc15" : "#30363d"), background: step === n ? "#facc15" : "transparent", color: step === n ? "#0d1117" : "#8b949e", fontWeight: 700 }}>{n}</div>
              );
            })}
          </div>
        </div>

        {step === 1 && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 24 }}>
            <div style={{ background: "#161b22", border: "1px solid #30363d", borderRadius: 16, padding: 24 }}>
              <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Input URL Berita</h2>
              <p style={{ opacity: 0.6, fontSize: 14, marginBottom: 18 }}>Tempel link berita, kami akan parsing otomatis untuk template.</p>
              <input value={newsUrl} onChange={function(e){ setNewsUrl(e.target.value); }} placeholder="https://..." style={{ width: "100%", background: "#0d1117", border: "1px solid #30363d", borderRadius: 10, padding: "14px 16px", color: "#e6edf3", outline: "none" }} />
              <div style={{ display: "flex", gap: 12, marginTop: 18 }}>
                <button onClick={function(){ setStep(2); }} style={{ background: "#facc15", color: "#0d1117", fontWeight: 800, padding: "12px 20px", borderRadius: 10, border: "none", cursor: "pointer" }}>Lanjut Parsing</button>
                <button onClick={function(){ setStep(3); }} style={{ background: "transparent", color: "#e6edf3", border: "1px solid #30363d", padding: "12px 20px", borderRadius: 10, cursor: "pointer" }}>Lewati, Buat Manual</button>
              </div>
            </div>
            <div style={{ background: "#161b22", border: "1px solid #21262d", borderRadius: 16, padding: 20 }}>
              <div style={{ fontSize: 12, opacity: 0.5, letterSpacing: 1, marginBottom: 10 }}>PREVIEW LINK</div>
              <div style={{ fontSize: 14, opacity: 0.7, wordBreak: "break-all" }}>{newsUrl || "Belum ada URL"}</div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 420px", gap: 24 }}>
            <div style={{ background: "#161b22", border: "1px solid #30363d", borderRadius: 16, padding: 24 }}>
              <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 16 }}>Edit Konten</h2>
              <div style={{ display: "grid", gap: 14 }}>
                <label style={{ fontSize: 12, opacity: 0.6 }}>JUDUL</label>
                <textarea value={judul} onChange={function(e){ setJudul(e.target.value); }} style={{ minHeight: 90, background: "#0d1117", border: "1px solid #30363d", borderRadius: 10, padding: 14, color: "#fff" }} />
                <label style={{ fontSize: 12, opacity: 0.6 }}>ISI RINGKAS</label>
                <textarea value={isi} onChange={function(e){ setIsi(e.target.value); }} style={{ minHeight: 140, background: "#0d1117", border: "1px solid #30363d", borderRadius: 10, padding: 14, color: "#fff" }} />
                <label style={{ fontSize: 12, opacity: 0.6 }}>SUMBER</label>
                <input value={sumber} onChange={function(e){ setSumber(e.target.value); }} style={{ background: "#0d1117", border: "1px solid #30363d", borderRadius: 10, padding: "12px 14px", color: "#fff" }} />
                <label style={{ fontSize: 12, opacity: 0.6 }}>GAMBAR UTAMA</label>
                <input type="file" accept="image/*" onChange={onImagePick} style={{ background: "#0d1117", border: "1px dashed #30363d", borderRadius: 10, padding: 12, color: "#8b949e" }} />
              </div>
              <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
                <button onClick={function(){ setStep(1); }} style={{ background: "transparent", border: "1px solid #30363d", color: "#e6edf3", padding: "12px 18px", borderRadius: 10, cursor: "pointer" }}>Kembali</button>
                <button onClick={function(){ setStep(3); }} style={{ background: "#facc15", color: "#0d1117", fontWeight: 800, padding: "12px 20px", borderRadius: 10, border: "none", cursor: "pointer", flex: 1 }}>Buka Canvas Editor</button>
              </div>
            </div>
            <div style={{ background: "#161b22", border: "1px solid #21262d", borderRadius: 16, padding: 16, height: "fit-content" }}>
              <div style={{ fontSize: 12, opacity: 0.5, marginBottom: 10 }}>QUICK PREVIEW</div>
              <div style={{ background: "#0d1117", borderRadius: 12, padding: 14, fontSize: 14, lineHeight: 1.5 }}>
                <div style={{ fontWeight: 800, marginBottom: 8 }}>{judul}</div>
                <div style={{ opacity: 0.7 }}>{isi.slice(0, 120)}...</div>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div style={{ display: "grid", gridTemplateColumns: "440px 1fr", gap: 24, alignItems: "start" }}>
            <div style={{ position: "sticky", top: 20 }}>
              <div ref={containerRef} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp} onTouchStart={handleMouseDown} onTouchMove={handleMouseMove} onTouchEnd={handleMouseUp} style={{ width: "100%", aspectRatio: "1080 / 1350", background: "#010409", borderRadius: 16, overflow: "hidden", border: "1px solid #30363d", position: "relative", cursor: dragTarget ? "grabbing" : "grab", touchAction: "none" }}>
                <canvas ref={canvasRef} width={1080} height={1350} style={{ width: "100%", height: "100%", display: "block" }} />
                <div style={{ position: "absolute", left: 12, top: 12, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.12)", padding: "6px 10px", borderRadius: 999, fontSize: 11, letterSpacing: 0.8 }}>LIVE PREVIEW • DRAG UNTUK GESER</div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 14 }}>
                <button onClick={downloadGambar} style={{ background: "#21262d", border: "1px solid #30363d", color: "#e6edf3", padding: "14px 16px", borderRadius: 12, fontWeight: 700, cursor: "pointer" }}>⬇ Download</button>
                <button onClick={handleTapUploadButton} style={{ background: "#facc15", border: "none", color: "#0d1117", padding: "14px 16px", borderRadius: 12, fontWeight: 800, cursor: "pointer" }}>⬆ Upload → Carousel</button>
              </div>
              <div style={{ marginTop: 12, fontSize: 12, opacity: 0.5, textAlign: "center" }}>Export bersih tanpa garis putus-putus 85px • Upload buat blob ke Page 4</div>
            </div>

            <div style={{ display: "grid", gap: 16 }}>
              <div style={{ background: "#161b22", border: "1px solid #30363d", borderRadius: 16, padding: 20 }}>
                <div style={{ fontWeight: 800, marginBottom: 14, fontSize: 14, letterSpacing: 0.8, opacity: 0.8 }}>KONTROL POSISI</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div>
                    <div style={{ fontSize: 12, opacity: 0.6, marginBottom: 6 }}>IMG X {imgX}</div>
                    <input type="range" min={-400} max={400} value={imgX} onChange={function(e){ setImgX(parseInt(e.target.value)); }} style={{ width: "100%" }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 12, opacity: 0.6, marginBottom: 6 }}>IMG Y {imgY}</div>
                    <input type="range" min={-400} max={400} value={imgY} onChange={function(e){ setImgY(parseInt(e.target.value)); }} style={{ width: "100%" }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 12, opacity: 0.6, marginBottom: 6 }}>IMG SCALE {imgScale.toFixed(2)}</div>
                    <input type="range" min={0.5} max={2.5} step={0.05} value={imgScale} onChange={function(e){ setImgScale(parseFloat(e.target.value)); }} style={{ width: "100%" }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 12, opacity: 0.6, marginBottom: 6 }}>OVERLAY {overlayOpacity}</div>
                    <input type="range" min={0} max={1} step={0.02} value={overlayOpacity} onChange={function(e){ setOverlayOpacity(parseFloat(e.target.value)); }} style={{ width: "100%" }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 12, opacity: 0.6, marginBottom: 6 }}>TEKS X {teksX}</div>
                    <input type="range" min={20} max={300} value={teksX} onChange={function(e){ setTeksX(parseInt(e.target.value)); }} style={{ width: "100%" }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 12, opacity: 0.6, marginBottom: 6 }}>TEKS Y {teksY}</div>
                    <input type="range" min={500} max={1200} value={teksY} onChange={function(e){ setTeksY(parseInt(e.target.value)); }} style={{ width: "100%" }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 12, opacity: 0.6, marginBottom: 6 }}>FONT {ukuranFont}</div>
                    <input type="range" min={28} max={84} value={ukuranFont} onChange={function(e){ setUkuranFont(parseInt(e.target.value)); }} style={{ width: "100%" }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 12, opacity: 0.6, marginBottom: 6 }}>JARAK BARIS {jarakBaris}</div>
                    <input type="range" min={32} max={96} value={jarakBaris} onChange={function(e){ setJarakBaris(parseInt(e.target.value)); }} style={{ width: "100%" }} />
                  </div>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <div style={{ fontSize: 12, opacity: 0.6, marginBottom: 6 }}>LEBAR TEKS {lebarTeks}</div>
                    <input type="range" min={600} max={980} value={lebarTeks} onChange={function(e){ setLebarTeks(parseInt(e.target.value)); }} style={{ width: "100%" }} />
                  </div>
                </div>
              </div>

              <div style={{ background: "#161b22", border: "1px solid #30363d", borderRadius: 16, padding: 20 }}>
                <div style={{ fontWeight: 800, marginBottom: 12, fontSize: 14 }}>SUMBER & OVERLAY</div>
                <input value={sumber} onChange={function(e){ setSumber(e.target.value); }} placeholder="Sumber berita" style={{ width: "100%", background: "#0d1117", border: "1px solid #30363d", borderRadius: 10, padding: "12px 14px", color: "#fff", marginBottom: 12 }} />
                <textarea value={judul} onChange={function(e){ setJudul(e.target.value); }} style={{ width: "100%", minHeight: 100, background: "#0d1117", border: "1px solid #30363d", borderRadius: 10, padding: 14, color: "#fff" }} />
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div style={{ display: "grid", gridTemplateColumns: "460px 1fr", gap: 24, alignItems: "start" }}>
            <div style={{ position: "sticky", top: 20 }}>
              <div style={{ background: "#161b22", border: "1px solid #30363d", borderRadius: 16, padding: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, padding: "0 6px" }}>
                  <div style={{ fontWeight: 800, fontSize: 14 }}>CAROUSEL PREVIEW</div>
                  <div style={{ fontSize: 12, opacity: 0.6 }}>{currentPreview + 1} / {1 + additionalSlides.length} slides</div>
                </div>

                <div style={{ width: "100%", aspectRatio: "1080 / 1350", background: "#0d1117", borderRadius: 12, overflow: "hidden", position: "relative", border: "1px solid #21262d" }}>
                  {currentPreview === 0 ? (
                    reviewImageUrl ? <img src={reviewImageUrl} alt="slide 1" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ display: "grid", placeItems: "center", height: "100%", opacity: 0.5 }}>No main image</div>
                  ) : (
                    (function() {
                      const s = additionalSlides[currentPreview - 1];
                      if (!s) return <div style={{ display: "grid", placeItems: "center", height: "100%" }}>Empty</div>;
                      if (s.type === "video") return <video src={s.previewUrl} style={{ width: "100%", height: "100%", objectFit: "cover" }} muted loop autoPlay />;
                      return <img src={s.previewUrl} alt={s.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />;
                    })()
                  )}

                  <button onClick={function(){ setCurrentPreview(function(p){ return p === 0 ? additionalSlides.length : p - 1; }); }} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", width: 36, height: 36, borderRadius: 999, background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", cursor: "pointer" }}>‹</button>
                  <button onClick={function(){ setCurrentPreview(function(p){ return p >= additionalSlides.length ? 0 : p + 1; }); }} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", width: 36, height: 36, borderRadius: 999, background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", cursor: "pointer" }}>›</button>

                  <div style={{ position: "absolute", bottom: 12, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 6 }}>
                    {[reviewImageUrl].concat(additionalSlides.map(function(s){ return s.previewUrl; })).map(function(_, i) {
                      return <div key={i} onClick={function(){ setCurrentPreview(i); }} style={{ width: i === currentPreview ? 20 : 8, height: 8, borderRadius: 999, background: i === currentPreview ? "#facc15" : "rgba(255,255,255,0.4)", cursor: "pointer", transition: "all .2s" }} />;
                    })}
                  </div>
                </div>

                <div style={{ display: "flex", gap: 8, marginTop: 12, overflowX: "auto", paddingBottom: 4 }}>
                  <div onClick={function(){ setCurrentPreview(0); }} style={{ minWidth: 64, width: 64, height: 84, borderRadius: 10, overflow: "hidden", border: currentPreview === 0 ? "2px solid #facc15" : "1px solid #30363d", cursor: "pointer", position: "relative" }}>
                    {reviewImageUrl && <img src={reviewImageUrl} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                    <div style={{ position: "absolute", bottom: 2, left: 0, right: 0, textAlign: "center", fontSize: 9, background: "rgba(0,0,0,0.6)" }}>COVER</div>
                  </div>
                  {additionalSlides.map(function(s, idx) {
                    return (
                      <div key={s.id} onClick={function(){ setCurrentPreview(idx + 1); }} style={{ minWidth: 64, width: 64, height: 84, borderRadius: 10, overflow: "hidden", border: currentPreview === idx + 1 ? "2px solid #facc15" : "1px solid #30363d", cursor: "pointer", position: "relative" }}>
                        {s.type === "image" ? <img src={s.previewUrl} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <video src={s.previewUrl} style={{ width: "100%", height: "100%", objectFit: "cover" }} muted />}
                        <div style={{ position: "absolute", bottom: 2, left: 0, right: 0, textAlign: "center", fontSize: 9, background: "rgba(0,0,0,0.6)" }}>{idx + 2}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div style={{ display: "grid", gap: 16 }}>
              <div style={{ background: "#161b22", border: "1px solid #30363d", borderRadius: 16, padding: 20 }}>
                <div style={{ fontWeight: 800, marginBottom: 4, fontSize: 16 }}>Carousel Upload — Fix Muncul</div>
                <div style={{ fontSize: 13, opacity: 0.6, marginBottom: 16 }}>Sebelumnya UI carousel belum muncul di menu upload. Sekarang sudah ada preview + dots + grid thumbnail Slide 2,3… dengan X remove & up/down reorder. Maks 10 slides total.</div>

                <div style={{ display: "grid", gap: 12 }}>
                  <label style={{ fontSize: 12, opacity: 0.6, letterSpacing: 0.8 }}>TAMBAH SLIDE (IMAGE / VIDEO)</label>
                  <div style={{ border: "1.5px dashed #30363d", borderRadius: 12, padding: 18, background: "#0d1117", textAlign: "center" }}>
                    <input type="file" multiple accept="image/*,video/*" onChange={handleAdditionalFiles} id="addFiles" style={{ display: "none" }} />
                    <label htmlFor="addFiles" style={{ display: "inline-block", background: "#21262d", border: "1px solid #30363d", padding: "10px 16px", borderRadius: 10, cursor: "pointer", fontWeight: 700 }}>+ Pilih File (max {9 - additionalSlides.length} lagi)</label>
                    <div style={{ fontSize: 12, opacity: 0.5, marginTop: 8 }}>Slide 1 = template 1080x1350 • Slide 2-10 dari sini</div>
                  </div>
                </div>

                <div style={{ marginTop: 18 }}>
                  <div style={{ fontSize: 12, opacity: 0.6, marginBottom: 10, letterSpacing: 0.8 }}>GRID THUMBNAIL</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 12 }}>
                    <div style={{ background: "#0d1117", border: "1px solid #30363d", borderRadius: 12, padding: 10, position: "relative" }}>
                      <div style={{ fontSize: 11, fontWeight: 800, marginBottom: 6, color: "#facc15" }}>SLIDE 1 • MAIN</div>
                      <div style={{ width: "100%", height: 96, background: "#161b22", borderRadius: 8, overflow: "hidden" }}>
                        {reviewImageUrl && <img src={reviewImageUrl} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                      </div>
                      <div style={{ fontSize: 11, opacity: 0.5, marginTop: 6 }}>Template export</div>
                    </div>

                    {additionalSlides.map(function(slide, idx) {
                      return (
                        <div key={slide.id} style={{ background: "#0d1117", border: "1px solid #30363d", borderRadius: 12, padding: 10, position: "relative" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                            <div style={{ fontSize: 11, fontWeight: 800 }}>SLIDE {idx + 2}</div>
                            <button onClick={function(){ removeSlide(slide.id); }} style={{ width: 22, height: 22, borderRadius: 6, background: "#ff4444", color: "#fff", border: "none", cursor: "pointer", fontSize: 12 }}>X</button>
                          </div>
                          <div style={{ width: "100%", height: 96, background: "#161b22", borderRadius: 8, overflow: "hidden" }}>
                            {slide.type === "image" ? <img src={slide.previewUrl} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <video src={slide.previewUrl} style={{ width: "100%", height: "100%", objectFit: "cover" }} muted />}
                          </div>
                          <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                            <button onClick={function(){ moveSlide(idx, -1); }} style={{ flex: 1, background: "#21262d", border: "1px solid #30363d", borderRadius: 6, color: "#e6edf3", padding: "6px 0", cursor: "pointer", fontSize: 12 }}>↑</button>
                            <button onClick={function(){ moveSlide(idx, 1); }} style={{ flex: 1, background: "#21262d", border: "1px solid #30363d", borderRadius: 6, color: "#e6edf3", padding: "6px 0", cursor: "pointer", fontSize: 12 }}>↓</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div style={{ background: "#161b22", border: "1px solid #30363d", borderRadius: 16, padding: 20 }}>
                <label style={{ fontSize: 12, opacity: 0.6, letterSpacing: 0.8, marginBottom: 8, display: "block" }}>CAPTION INSTAGRAM</label>
                <textarea value={caption} onChange={function(e){ setCaption(e.target.value); }} placeholder="Tulis caption untuk carousel..." style={{ width: "100%", minHeight: 120, background: "#0d1117", border: "1px solid #30363d", borderRadius: 10, padding: 14, color: "#fff", resize: "vertical" }} />
                <div style={{ display: "flex", gap: 12, marginTop: 16, alignItems: "center" }}>
                  <button onClick={handlePublish} disabled={isPublishing || !reviewImageUrl} style={{ background: isPublishing || !reviewImageUrl ? "#30363d" : "#facc15", color: isPublishing || !reviewImageUrl ? "#8b949e" : "#0d1117", fontWeight: 800, padding: "14px 22px", borderRadius: 10, border: "none", cursor: isPublishing || !reviewImageUrl ? "not-allowed" : "pointer", flex: 1 }}>{isPublishing ? "Publishing..." : "Publish Carousel (" + (1 + additionalSlides.length) + " slides)"}</button>
                  <button onClick={function(){ setStep(3); }} style={{ background: "transparent", border: "1px solid #30363d", color: "#e6edf3", padding: "14px 18px", borderRadius: 10, cursor: "pointer" }}>Edit Template</button>
                </div>
                {publishLog && <div style={{ marginTop: 12, background: "#0d1117", border: "1px solid #21262d", borderRadius: 8, padding: "10px 12px", fontSize: 12, fontFamily: "monospace", color: "#8b949e" }}>{publishLog}</div>}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
