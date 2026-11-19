/* Nibras Expertise · Inventaire des ouvrages hydrauliques · fonctionnement hors connexion */
const CACHE='nibras-inventaire-v2.0';
const CORE=['./','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(n=>n!==CACHE).map(n=>caches.delete(n)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const r=e.request;if(r.method!=='GET')return;
  const u=new URL(r.url);
  if(u.origin===location.origin){
    /* page : réseau d'abord (pour recevoir les mises à jour), cache si pas de réseau */
    if(r.mode==='navigate'){e.respondWith(fetch(r).then(res=>{const c=res.clone();caches.open(CACHE).then(x=>x.put('./index.html',c));return res}).catch(()=>caches.match('./index.html')));return}
    e.respondWith(caches.match(r).then(m=>m||fetch(r)));return;
  }
  if(u.host==='fonts.googleapis.com'||u.host==='fonts.gstatic.com'){
    e.respondWith(caches.match(r).then(m=>m||fetch(r).then(res=>{const c=res.clone();caches.open(CACHE).then(x=>x.put(r,c));return res}).catch(()=>new Response('',{status:504}))));
  }
});
