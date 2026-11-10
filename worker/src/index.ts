export interface Env {
  DB: D1Database;
  ASSETS: Fetcher;
  ADMIN_TOKEN: string;
}
const cors = {"access-control-allow-origin":"*","access-control-allow-methods":"GET,POST,PUT,OPTIONS","access-control-allow-headers":"Content-Type, Authorization"};
const json = (data: unknown, status=200) => new Response(JSON.stringify(data), {status,headers:{...cors,"content-type":"application/json; charset=utf-8","cache-control":"no-store"}});
const body = async (r:Request) => { try { return await r.json() as Record<string,unknown>; } catch { return null; } };
const hash = async (s:string) => { const d=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(s)); return [...new Uint8Array(d)].map(x=>x.toString(16).padStart(2,"0")).join(""); };
const uid = () => crypto.randomUUID();
const admin = (r:Request,e:Env) => Boolean(e.ADMIN_TOKEN) && r.headers.get("authorization")===`Bearer ${e.ADMIN_TOKEN}`;
async function activate(key:string,device:string,e:Env) {
 const license=await e.DB.prepare("SELECT id,status,plan,expires_at,max_devices FROM licenses WHERE license_key_hash=?").bind(await hash(key.trim())).first<{id:string;status:string;plan:string;expires_at:string|null;max_devices:number}>();
 if(!license || license.status!=="active") return json({ok:false,error:"Invalid or disabled license"},403);
 if(license.expires_at && Date.parse(license.expires_at)<Date.now()){await e.DB.prepare("UPDATE licenses SET status='expired',updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(license.id).run();return json({ok:false,error:"License expired"},403);}
 const dh=await hash(device.trim());
 const existing=await e.DB.prepare("SELECT id FROM activations WHERE license_id=? AND device_id_hash=?").bind(license.id,dh).first<{id:string}>();
 if(!existing){const n=await e.DB.prepare("SELECT COUNT(*) total FROM activations WHERE license_id=?").bind(license.id).first<{total:number}>();if((n?.total??0)>=license.max_devices)return json({ok:false,error:"Device limit reached"},403);await e.DB.prepare("INSERT INTO activations(id,license_id,device_id_hash) VALUES(?,?,?)").bind(uid(),license.id,dh).run();}
 else await e.DB.prepare("UPDATE activations SET last_seen_at=CURRENT_TIMESTAMP WHERE id=?").bind(existing.id).run();
 return json({ok:true,plan:license.plan,expiresAt:license.expires_at});
}
export default { async fetch(request:Request,env:Env):Promise<Response> {
 const u=new URL(request.url); if(request.method==="OPTIONS")return new Response(null,{headers:cors});
 try {
  if(u.pathname==="/api/health"&&request.method==="GET"){await env.DB.prepare("SELECT 1").first();return json({ok:true,service:"JM Tech Tools API",database:"connected"});}
  if(u.pathname==="/api/config"&&request.method==="GET"){const q=await env.DB.prepare("SELECT config_key,config_value FROM app_config ORDER BY config_key").all<{config_key:string;config_value:string}>();return json({ok:true,config:Object.fromEntries((q.results??[]).map(x=>[x.config_key,x.config_value]))});}
  if((u.pathname==="/api/license/activate"||u.pathname==="/api/license/validate")&&request.method==="POST"){const b=await body(request);if(typeof b?.licenseKey!=="string"||typeof b?.deviceId!=="string")return json({ok:false,error:"licenseKey and deviceId are required"},400);return activate(b.licenseKey,b.deviceId,env);}
  if(u.pathname==="/api/releases/latest"&&request.method==="GET"){const release=await env.DB.prepare("SELECT version,download_url,release_notes,created_at FROM update_releases WHERE is_active=1 ORDER BY created_at DESC LIMIT 1").first();return json({ok:true,release:release??null});}
  if(u.pathname.startsWith("/api/admin/")){
   if(!admin(request,env))return json({ok:false,error:"Unauthorized"},401);
   if(u.pathname==="/api/admin/licenses"&&request.method==="POST"){const b=await body(request);const key="JM-"+uid().replaceAll("-","").slice(0,8).toUpperCase()+"-"+uid().replaceAll("-","").slice(0,8).toUpperCase();const plan=typeof b?.plan==="string"?b.plan.slice(0,40):"basic";const devices=Math.max(1,Math.min(20,Number(b?.maxDevices)||1));const expiry=typeof b?.expiresAt==="string"&&b.expiresAt?b.expiresAt:null;await env.DB.prepare("INSERT INTO licenses(id,license_key_hash,plan,expires_at,max_devices) VALUES(?,?,?,?,?)").bind(uid(),await hash(key),plan,expiry,devices).run();return json({ok:true,licenseKey:key,plan,maxDevices:devices,expiresAt:expiry},201);}
   if(u.pathname==="/api/admin/licenses"&&request.method==="GET"){const q=await env.DB.prepare("SELECT id,status,plan,expires_at,max_devices,created_at FROM licenses ORDER BY created_at DESC LIMIT 100").all();return json({ok:true,licenses:q.results??[]});}
   if(u.pathname==="/api/admin/licenses/revoke"&&request.method==="POST"){const b=await body(request);if(typeof b?.id!=="string")return json({ok:false,error:"id is required"},400);const q=await env.DB.prepare("UPDATE licenses SET status='disabled',updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(b.id).run();return json({ok:true,changes:q.meta.changes});}
   if(u.pathname==="/api/admin/config"&&request.method==="PUT"){const b=await body(request);if(typeof b?.key!=="string"||typeof b?.value!=="string")return json({ok:false,error:"key and value are required"},400);await env.DB.prepare("INSERT INTO app_config(config_key,config_value,updated_at) VALUES(?,?,CURRENT_TIMESTAMP) ON CONFLICT(config_key) DO UPDATE SET config_value=excluded.config_value,updated_at=CURRENT_TIMESTAMP").bind(b.key.slice(0,100),b.value.slice(0,5000)).run();return json({ok:true});}
   if(u.pathname==="/api/admin/releases"&&request.method==="POST"){const b=await body(request);if(typeof b?.version!=="string"||typeof b?.downloadUrl!=="string")return json({ok:false,error:"version and downloadUrl are required"},400);await env.DB.prepare("UPDATE update_releases SET is_active=0").run();await env.DB.prepare("INSERT INTO update_releases(id,version,download_url,release_notes,is_active) VALUES(?,?,?,?,1)").bind(uid(),b.version.slice(0,40),b.downloadUrl.slice(0,1000),typeof b.notes==="string"?b.notes.slice(0,2000):"").run();return json({ok:true},201);}
  }
  if(u.pathname==="/admin"||u.pathname==="/admin/")return env.ASSETS.fetch(new Request(new URL("/index.html",u.origin),request));
  return env.ASSETS.fetch(request);
 } catch {return json({ok:false,error:"Internal server error"},500);}
}};
