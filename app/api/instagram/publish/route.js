import { NextResponse } from 'next/server';
export async function POST(req){
  try{
    const { imageUrls, caption } = await req.json();
    const IG_ID = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;
    const TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN;
    const isVideo = (u)=>u.toLowerCase().includes('.mp4');
    if(imageUrls.length===1){
      const url=imageUrls[0];
      const param=isVideo(url)?`media_type=VIDEO&video_url=${encodeURIComponent(url)}`:`image_url=${encodeURIComponent(url)}`;
      const cr=await fetch(`https://graph.facebook.com/v20.0/${IG_ID}/media?${param}&caption=${encodeURIComponent(caption||'')}&access_token=${TOKEN}`,{method:'POST'}).then(r=>r.json());
      if(isVideo(url)){ for(let i=0;i<10;i++){ await new Promise(r=>setTimeout(r,3000)); const s=await fetch(`https://graph.facebook.com/v20.0/${cr.id}?fields=status_code&access_token=${TOKEN}`).then(r=>r.json()); if(s.status_code==='FINISHED') break; } }
      const pub=await fetch(`https://graph.facebook.com/v20.0/${IG_ID}/media_publish?creation_id=${cr.id}&access_token=${TOKEN}`,{method:'POST'}).then(r=>r.json());
      return NextResponse.json(pub);
    }
    const childIds=[];
    for(let url of imageUrls){
      const param=isVideo(url)?`media_type=VIDEO&video_url=${encodeURIComponent(url)}&is_carousel_item=true`:`image_url=${encodeURIComponent(url)}&is_carousel_item=true`;
      const cd=await fetch(`https://graph.facebook.com/v20.0/${IG_ID}/media?${param}&access_token=${TOKEN}`,{method:'POST'}).then(r=>r.json());
      if(isVideo(url)){ for(let i=0;i<15;i++){ await new Promise(r=>setTimeout(r,4000)); const s=await fetch(`https://graph.facebook.com/v20.0/${cd.id}?fields=status_code&access_token=${TOKEN}`).then(r=>r.json()); if(s.status_code==='FINISHED') break; } }
      childIds.push(cd.id);
    }
    const car=await fetch(`https://graph.facebook.com/v20.0/${IG_ID}/media?media_type=CAROUSEL&children=${childIds.join(',')}&caption=${encodeURIComponent(caption||'')}&access_token=${TOKEN}`,{method:'POST'}).then(r=>r.json());
    const pub=await fetch(`https://graph.facebook.com/v20.0/${IG_ID}/media_publish?creation_id=${car.id}&access_token=${TOKEN}`,{method:'POST'}).then(r=>r.json());
    return NextResponse.json(pub);
  }catch(e){ return NextResponse.json({error:e.message},{status:500}); }
}
