// Nadi waitlist Worker: D1 storage + opt-in email when sending is configured.
// Until domain authentication and Resend secrets are installed, existing
// signup/storage behaviour is preserved. Never put provider keys in the site.
const ALLOWED_ORIGINS = new Set(["https://nadi.asalbikin.id", "https://nadilabs.github.io"]);
const SITE_URL = "https://nadi.asalbikin.id/";
const API = "https://nadi-waitlist.ariyoardiwardana.workers.dev";

function headers(origin) {
  const h = {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Vary": "Origin"
  };
  if (ALLOWED_ORIGINS.has(origin)) {
    h["Access-Control-Allow-Origin"] = origin;
    h["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS";
    h["Access-Control-Allow-Headers"] = "Content-Type";
  }
  return h;
}
function respond(obj, status, origin) {
  return new Response(JSON.stringify(obj), {status, headers:headers(origin)});
}
function ready(env) { return Boolean(env.RESEND_API_KEY && env.NADI_MAIL_FROM); }
function makeToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
}
async function digest(token) {
  const bytes = new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(token)));
  return Array.from(bytes, x=>x.toString(16).padStart(2,"0")).join("");
}
function esc(s) {
  return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}
async function count(env) {
  const query = ready(env)
    ? "SELECT COUNT(*) AS n FROM waitlist WHERE confirmed_at IS NOT NULL AND unsubscribed_at IS NULL"
    : "SELECT COUNT(*) AS n FROM waitlist WHERE unsubscribed_at IS NULL";
  const row = await env.DB.prepare(query).first();
  return Number(row?.n || 0);
}
async function sendMail(env, to, subject, html, idempotencyKey) {
  const result = await fetch("https://api.resend.com/emails",{
    method:"POST",
    headers:{
      "Authorization":"Bearer " + env.RESEND_API_KEY,
      "Content-Type":"application/json",
      "Idempotency-Key":idempotencyKey
    },
    body:JSON.stringify({from:env.NADI_MAIL_FROM,to:[to],subject,html})
  });
  if(!result.ok)throw new Error("email_provider_unavailable");
}
function navigate(result) {
  return Response.redirect(SITE_URL+"?waitlist="+result+"#download",303);
}
async function verify(env, token) {
  if (!/^[a-zA-Z0-9_-]{32}$/.test(token||"")) return navigate("invalid");
  const hash = await digest(token);
  const row = await env.DB.prepare(
    "SELECT id FROM waitlist WHERE confirm_token_hash=? AND confirm_expires_at>CURRENT_TIMESTAMP"
  ).bind(hash).first();
  if(!row)return navigate("invalid");
  await env.DB.prepare(
    "UPDATE waitlist SET confirmed_at=CURRENT_TIMESTAMP,unsubscribed_at=NULL,confirm_token_hash=NULL,confirm_expires_at=NULL WHERE id=?"
  ).bind(row.id).run();
  return navigate("confirmed");
}
async function unsubscribeSignature(env,id) {
  if(!env.NADI_UNSUBSCRIBE_SECRET)return null;
  const key=await crypto.subtle.importKey("raw",new TextEncoder().encode(env.NADI_UNSUBSCRIBE_SECRET),{name:"HMAC",hash:"SHA-256"},false,["sign","verify"]);
  const data=new TextEncoder().encode("unsubscribe/"+String(id));
  const sig=new Uint8Array(await crypto.subtle.sign("HMAC",key,data));
  return btoa(String.fromCharCode(...sig)).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
}
async function validUnsub(env,token) {
  const match=/^([1-9]\d*)\.([a-zA-Z0-9_-]{43})$/.exec(token||"");
  if(!match||!env.NADI_UNSUBSCRIBE_SECRET)return null;
  const expected=await unsubscribeSignature(env,Number(match[1]));
  return expected===match[2]?Number(match[1]):null;
}
async function unsubscribe(request,env) {
  const url=new URL(request.url),token=request.method==="GET"?url.searchParams.get("token"):
    (await request.formData()).get("token");
  const id=await validUnsub(env,String(token||""));
  if(!id)return navigate("invalid");
  if(request.method==="POST"){
    await env.DB.prepare("UPDATE waitlist SET unsubscribed_at=CURRENT_TIMESTAMP WHERE id=?").bind(id).run();
    return navigate("unsubscribed");
  }
  const html='<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><meta name="referrer" content="no-referrer">'
    +'<title>Leave the Nadi waitlist</title><body style="background:#03040a;color:white;font:16px system-ui;padding:10vh 24px;text-align:center">'
    +'<h1>Leave the Nadi waitlist?</h1><p>You will no longer receive release updates.</p>'
    +'<form method="post"><input type="hidden" name="token" value="'+esc(token)+'"><button style="padding:13px 26px;border-radius:24px;border:0;cursor:pointer">Unsubscribe</button></form>'
    +'<p><a href="'+SITE_URL+'" style="color:#91dbff">Back to Nadi</a></p></body></html>';
  return new Response(html,{headers:{"Content-Type":"text/html; charset=utf-8","Referrer-Policy":"no-referrer","Cache-Control":"no-store"}});
}
async function signup(request,env,origin) {
  if(!ALLOWED_ORIGINS.has(origin))return respond({error:"forbidden"},403,origin);
  if((request.headers.get("Content-Type")||"").split(";")[0].trim().toLowerCase()!=="application/json")
    return respond({error:"invalid_content_type"},415,origin);
  if(Number(request.headers.get("Content-Length")||0)>2048)return respond({error:"too_large"},413,origin);
  let data;
  try {const raw=await request.text();if(raw.length>2048)throw Error("too large");data=JSON.parse(raw);}
  catch{return respond({error:"invalid_json"},400,origin);}
  if(!data||typeof data.email!=="string")return respond({error:"invalid_email"},400,origin);
  const email=data.email.trim().toLowerCase();
  if(!email||email.length>254||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return respond({error:"invalid_email"},400,origin);
  if(data.website)return respond({ok:true,joined:true,count:await count(env)},200,origin);
  try {
    if(!ready(env)){
      const record=await env.DB.prepare("INSERT OR IGNORE INTO waitlist(email) VALUES (?)").bind(email).run();
      return respond({ok:true,joined:true,already_registered:record.meta.changes===0,count:await count(env)},200,origin);
    }
    const existing=await env.DB.prepare(
      "SELECT id,confirmed_at,unsubscribed_at,confirmation_sent_at FROM waitlist WHERE email=?"
    ).bind(email).first();
    if(existing && existing.confirmed_at && !existing.unsubscribed_at)
      return respond({ok:true,verification_sent:true,count:await count(env)},200,origin);
    const recent=existing && existing.confirmation_sent_at &&
      Date.now()-Date.parse(existing.confirmation_sent_at.replace(" ","T")+"Z")<15*60*1000;
    if(recent)return respond({ok:true,verification_sent:true,count:await count(env)},200,origin);
    const token=makeToken(),hash=await digest(token);
    if(existing) {
      await env.DB.prepare(
        "UPDATE waitlist SET confirm_token_hash=?,confirm_expires_at=datetime('now','+48 hours'),confirmed_at=NULL,confirmation_sent_at=NULL,unsubscribed_at=NULL WHERE id=?"
      ).bind(hash,existing.id).run();
    } else {
      await env.DB.prepare(
        "INSERT INTO waitlist(email,confirm_token_hash,confirm_expires_at) VALUES(?,?,datetime('now','+48 hours'))"
      ).bind(email,hash).run();
    }
    const link=API+"/api/verify?token="+encodeURIComponent(token);
    const html='<div style="font-family:system-ui;max-width:520px;color:#111">'
      +'<h2>Confirm your Nadi waitlist signup</h2><p>One click and you are on the list for the Nadi release.</p>'
      +'<p><a href="'+link+'" style="display:inline-block;background:#101b45;color:white;padding:14px 22px;border-radius:25px;text-decoration:none">Confirm email</a></p>'
      +'<p>If you did not sign up, you can ignore this message.</p><p>— Nadi Lab</p></div>';
    await sendMail(env,email,"Confirm your Nadi waitlist signup",html,"nadi-confirm-"+hash.slice(0,32));
    await env.DB.prepare("UPDATE waitlist SET confirmation_sent_at=CURRENT_TIMESTAMP WHERE email=?").bind(email).run();
    return respond({ok:true,verification_sent:true,count:await count(env)},200,origin);
  } catch {
    return respond({error:"unavailable"},503,origin);
  }
}
// A small scheduled batch catches signups collected before email delivery was
// enabled, and retries confirmation delivery after transient provider outages.
async function sendPendingConfirmations(env) {
  if(!ready(env))return;
  const rows=await env.DB.prepare(
    "SELECT id,email FROM waitlist WHERE confirmed_at IS NULL AND unsubscribed_at IS NULL AND confirmation_sent_at IS NULL ORDER BY id LIMIT 10"
  ).all();
  for(const row of (rows.results||[])){
    const token=makeToken(),hash=await digest(token);
    await env.DB.prepare(
      "UPDATE waitlist SET confirm_token_hash=?,confirm_expires_at=datetime('now','+48 hours') WHERE id=?"
    ).bind(hash,row.id).run();
    const link=API+"/api/verify?token="+encodeURIComponent(token);
    const html='<div style="font-family:system-ui;max-width:520px">'
      +'<h2>Confirm your Nadi waitlist signup</h2><p>Confirm your email to receive the Nadi release announcement.</p>'
      +'<p><a href="'+link+'">Confirm email</a></p><p>Ignore this email if you did not sign up.</p></div>';
    try{
      await sendMail(env,row.email,"Confirm your Nadi waitlist signup",html,"nadi-confirm-"+hash.slice(0,32));
      await env.DB.prepare(
        "UPDATE waitlist SET confirmation_sent_at=CURRENT_TIMESTAMP WHERE id=?"
      ).bind(row.id).run();
    }catch{/* Try again during a later scheduled run. */}
  }
}
async function sendReleaseBatch(env) {
  if(!ready(env)||!env.NADI_UNSUBSCRIBE_SECRET||!env.NADI_RELEASE_VERSION||!env.NADI_RELEASE_URL)return;
  const url=new URL(env.NADI_RELEASE_URL);
  if(url.protocol!=="https:"||!["github.com","nadi.asalbikin.id"].includes(url.hostname))return;
  const rows=await env.DB.prepare(
    "SELECT id,email FROM waitlist WHERE confirmed_at IS NOT NULL AND unsubscribed_at IS NULL AND release_sent_at IS NULL ORDER BY id LIMIT 15"
  ).all();
  for (const row of (rows.results||[])) {
    const token=row.id+"."+(await unsubscribeSignature(env,row.id));
    const unlink=API+"/api/unsubscribe?token="+encodeURIComponent(token);
    const html='<div style="font-family:system-ui;max-width:540px">'
      +'<h2>Nadi is ready.</h2><p>The first public release is available.</p>'
      +'<p><a href="'+esc(url.href)+'">Download Nadi</a></p>'
      +'<p style="font-size:12px">You joined the Nadi waitlist. <a href="'+unlink+'">Unsubscribe</a>.</p></div>';
    try{
      await sendMail(env,row.email,"Nadi "+env.NADI_RELEASE_VERSION+" is available",html,
        "nadi-launch-"+String(env.NADI_RELEASE_VERSION).replace(/[^a-zA-Z0-9.-]/g,"").slice(0,32)+"-"+row.id);
      await env.DB.prepare("UPDATE waitlist SET release_sent_at=CURRENT_TIMESTAMP WHERE id=?").bind(row.id).run();
    } catch { /* Retry on the next scheduled run; don't lose the subscriber. */ }
  }
}
export default {
  async fetch(request,env) {
    const url=new URL(request.url);
    const origin=request.headers.get("Origin")||"";
    if(url.pathname==="/api/verify" && request.method==="GET")return verify(env,url.searchParams.get("token"));
    if(url.pathname==="/api/unsubscribe" && ["GET","POST"].includes(request.method))
      return unsubscribe(request,env);
    if(url.pathname!=="/api/waitlist")return respond({error:"not_found"},404,origin);
    if(request.method==="OPTIONS")return new Response(null,{
      status:ALLOWED_ORIGINS.has(origin)?204:403,headers:headers(origin)
    });
    if(request.method==="GET") {
      try{return respond({count:await count(env),confirmation_required:ready(env)},200,origin);}
      catch{return respond({error:"unavailable"},503,origin);}
    }
    if(request.method==="POST")return signup(request,env,origin);
    return respond({error:"method_not_allowed"},405,origin);
  },
  async scheduled(controller,env,ctx) {
    ctx.waitUntil((async()=>{
      await sendPendingConfirmations(env);
      await sendReleaseBatch(env);
    })());
  }
};