from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from newspaper import Article, Config
import requests
import xml.etree.ElementTree as ET

# Inisialisasi Aplikasi FastAPI
app = FastAPI(title="Agora Vada API")

# Konfigurasi CORS agar frontend Next.js (biasanya jalan di localhost:3000) bisa ngobrol sama backend ini
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Catatan: Saat naik ke production, ganti "*" dengan URL domain lo
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Model Request pakai Pydantic
class URLRequest(BaseModel):
    url: str

@app.get("/")
def read_root():
    return {"message": "Sistem API Agora Vada Aktif!"}

# ---------------------------------------------------------
# OPSI 1: Tarik dari RSS Feed (Sangat Aman & Anti-Blokir)
# ---------------------------------------------------------
@app.post("/api/tarik-rss")
def tarik_rss(req: URLRequest):
    """
    Tarik data dari link RSS Feed portal berita (contoh: https://www.cnnindonesia.com/nasional/rss)
    """
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
    }
    try:
        response = requests.get(req.url, headers=headers, timeout=10)
        response.raise_for_status()
        
        root = ET.fromstring(response.content)
        berita_list = []
        
        # Standar struktur RSS feed biasanya pakai tag <item>
        for item in root.findall('.//item'): 
            title = item.find('title').text if item.find('title') is not None else "Tanpa Judul"
            link = item.find('link').text if item.find('link') is not None else ""
            description = item.find('description').text if item.find('description') is not None else "Tanpa Deskripsi"
            
            berita_list.append({
                "title": title,
                "link": link,
                "description": description
            })
            
        return {
            "status": "success",
            "source": req.url,
            "total_berita": len(berita_list),
            "data": berita_list
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Gagal mengambil RSS: {str(e)}")

# ---------------------------------------------------------
# OPSI 2: Tarik dari URL Artikel Langsung (Pakai newspaper3k + Custom User-Agent)
# ---------------------------------------------------------
@app.post("/api/tarik-artikel")
def tarik_artikel(req: URLRequest):
    """
    Tarik data dari link artikel tunggal. Sudah disematkan User-Agent agar tidak dikira bot.
    """
    # Konfigurasi newspaper3k agar lebih "sopan" 
    config = Config()
    config.browser_user_agent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
    config.request_timeout = 15

    try:
        article = Article(req.url, config=config)
        article.download()
        article.parse()

        return {
            "status": "success",
            "title": article.title,
            "description": article.meta_description, # Narik deskripsi berita dari meta tag HTML
            "text": article.text,
            "authors": article.authors,
            "publish_date": article.publish_date
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Gagal mengekstrak artikel (Mungkin WAF terlalu ketat): {str(e)}")

# Untuk menjalankan server manual jika tidak pakai batch file:
# uvicorn api_agora_vada:app --reload
