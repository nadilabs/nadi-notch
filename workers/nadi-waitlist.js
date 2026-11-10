const ALLOWED_ORIGINS = new Set(["https://nadi.asalbikin.id", "https://nadilabs.github.io"]);
function headers(origin) {
  const h = {"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store","Vary":"Origin"};
  if (ALLOWED_ORIGINS.has(origin)) {h["Access-Control-Allow-Origin"] = origin;h["Access-Control-Allow-Methods"]="GET, POST, OPTIONS";h["Access-Control-Allow-Headers"]="Content-Type";}
  return h;
}
function respond(obj,status,origin) {return new Response(JSON.stringify(obj),{status,headers:headers(origin)});}
export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin")||"";
    const url = new URL(request.url);
    if (request.method === "OPTIONS") return new Response(null,{status:ALLOWED_ORIGINS.has(origin) ? 204 : 403,headers:headers(origin)});
    if (url.pathname !== "/api/waitlist") return respond({error:"not_found"},404,origin);
    if (request.method === "GET") {
      try {const row = await env.DB.prepare("SELECT COUNT(*) AS count FROM waitlist").first();return respond({count:Number(row?.count||0)},200,origin);}
      catch {return respond({error:"unavailable"},503,origin);}
    }
    if (request.method !== "POST") return respond({error:"method_not_allowed"},405,origin);
    if (!ALLOWED_ORIGINS.has(origin)) return respond({error:"forbidden"},403,origin);
    if ((request.headers.get("content-type")||"").split(";")[0].trim().toLowerCase() !== "application/json")return respond({error:"invalid_content_type"},415,origin);
    if (Number(request.headers.get("content-length")||0)>2048)return respond({error:"too_large"},413,origin);
    let data;try {data = await request.json();}catch{return respond({error:"invalid_json"},400,origin);}
    if (!data || typeof data.email !== "string")return respond({error:"invalid_email"},400,origin);
    if (data.website) return respond({ok:true,joined:true,count:(await env.DB.prepare("SELECT COUNT(*) AS count FROM waitlist").first())?.count||0},200,origin);
    const email = data.email.trim().toLowerCase();
    if (email.length>254||!(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)))return respond({error:"invalid_email"},400,origin);
    try {
      const result=await env.DB.prepare("INSERT OR IGNORE INTO waitlist(email) VALUES (?)").bind(email).run();
      const count=Number((await env.DB.prepare("SELECT COUNT(*) AS count FROM waitlist").first())?.count||0);
      return respond({ok:true,joined:true,already_registered:result.meta.changes===0,count},200,origin);
    } catch {return respond({error:"unavailable"},503,origin);}
  }
};