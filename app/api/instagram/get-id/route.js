import { NextResponse } from 'next/server';
export async function GET(){
  try{
    const token = process.env.INSTAGRAM_ACCESS_TOKEN;
    const pagesRes = await fetch(`https://graph.facebook.com/v20.0/me/accounts?access_token=${token}`);
    const pagesData = await pagesRes.json();
    const result = [];
    for(let p of pagesData.data || []){
      const r = await fetch(`https://graph.facebook.com/v20.0/${p.id}?fields=instagram_business_account,name&access_token=${token}`);
      const d = await r.json();
      if(d.instagram_business_account) result.push({ page_name:p.name, page_id:p.id, ig_business_id:d.instagram_business_account.id });
    }
    return NextResponse.json(result);
  }catch(e){ return NextResponse.json({error:e.message},{status:500}); }
}
