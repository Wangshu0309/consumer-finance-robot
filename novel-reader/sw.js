// Service Worker placeholder — full implementation in Task 13
self.addEventListener('install', () => { self.skipWaiting(); });
self.addEventListener('activate', () => { self.clients.claim(); });
