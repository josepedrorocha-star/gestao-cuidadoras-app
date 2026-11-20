/* Gestão de Cuidadoras — service worker.
   Guarda a app no aparelho para abrir depressa. Os DADOS não passam por aqui: vão sempre para o Firebase. */
const VERSAO = 'gc-2026-11-20c';
const BASE = ['./', './index.html', './firebase-config.js', './manifest.webmanifest',
  './icones/icone-192.png', './icones/icone-512.png', './icones/apple-touch-icon.png'];
const EXTERNOS = ['https://www.gstatic.com/firebasejs/', 'https://cdnjs.cloudflare.com/ajax/libs/'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSAO).then(c => c.addAll(BASE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k !== VERSAO).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const url = new URL(r.url);
  const local = url.origin === self.location.origin;
  /* a página e a configuração: primeiro a internet (para receber sempre a versão nova), senão a cópia guardada */
  if (local && (r.mode === 'navigate' || url.pathname.endsWith('/') || url.pathname.endsWith('.html') || url.pathname.endsWith('firebase-config.js'))) {
    e.respondWith(fetch(r).then(res => {
      if (res.ok) { const cp = res.clone(); caches.open(VERSAO).then(c => c.put(r, cp)); }
      return res;
    }).catch(() => caches.match(r).then(x => x || caches.match('./index.html'))));
    return;
  }
  /* ícones e bibliotecas (Firebase, PDF): a cópia guardada, senão a internet */
  if (local || EXTERNOS.some(p => r.url.startsWith(p))) {
    e.respondWith(caches.match(r).then(x => x || fetch(r).then(res => {
      if (res.ok || res.type === 'opaque') { const cp = res.clone(); caches.open(VERSAO).then(c => c.put(r, cp)); }
      return res;
    })));
  }
});
