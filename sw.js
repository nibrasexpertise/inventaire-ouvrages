/* Nibras Expertise · Inventaire des ouvrages hydrauliques · fonctionnement hors connexion */
const CACHE='nibras-inventaire-v2.4';
const TILES='nibras-tuiles-v1';      /* images satellite déjà affichées */
const MAX_TILES=3000;                /* environ 60 à 100 Mo au plus */
const CORE=['./','./index.html','./manifest.webmanifest','./icon-eau-192.png','./icon-eau-512.png','./leaflet.js','./leaflet.css'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(n=>n!==CACHE&&n!==TILES).map(n=>caches.delete(n)))).then(()=>self.clients.claim()))});
async function trim(){const c=await caches.open(TILES);const k=await c.keys();for(let i=0;i<k.length-MAX_TILES;i++)await c.delete(k[i])}
let n=0;
self.addEventListener('fetch',e=>{
  const r=e.request;if(r.method!=='GET')return;
  const u=new URL(r.url);
  if(u.origin===location.origin){
    /* page : réseau d'abord (pour recevoir les mises à jour), cache si pas de réseau */
    if(r.mode==='navigate'){e.respondWith(fetch(r).then(res=>{const c=res.clone();caches.open(CACHE).then(x=>x.put('./index.html',c));return res}).catch(()=>caches.match('./index.html')));return}
    e.respondWith(caches.match(r).then(m=>m||fetch(r)));return;
  }
  if(u.host==='server.arcgisonline.com'&&u.pathname.includes('/tile/')){
    /* tuiles satellite : cache d'abord, puis réseau ; garde au plus MAX_TILES tuiles */
    e.respondWith(caches.open(TILES).then(c=>c.match(r).then(m=>m||fetch(r).then(res=>{if(res.ok||res.type==='opaque'){c.put(r,res.clone());if(++n%50===0)trim()}return res}))).catch(()=>new Response('',{status:504})));
    return;
  }
  if(u.host==='fonts.googleapis.com'||u.host==='fonts.gstatic.com'){
    e.respondWith(caches.match(r).then(m=>m||fetch(r).then(res=>{const c=res.clone();caches.open(CACHE).then(x=>x.put(r,c));return res}).catch(()=>new Response('',{status:504}))));
  }
});
