// 캐시 이름 및 파일 목록
const CACHE_NAME = 'pwa-cache-v1';
const FILES_TO_CACHE = [
    '/',
    '/index.html',
    '/style.css',
    '/app.js',
    '/favicon.ico',
    '/manifest.json'
];

// 설치 이벤트: 캐싱할 파일 저장
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('캐싱 파일 추가 중');
            return cache.addAll(FILES_TO_CACHE);
        })
    );
    self.skipWaiting();
});

// 활성화 이벤트: 오래된 캐시 제거
self.addEventListener('activate', (event) => {
    console.log('Service Worker 활성화');
    event.waitUntil(
        caches.keys().then((keyList) =>
            Promise.all(
                keyList.map((key) => {
                    if (key !== CACHE_NAME) {
                        console.log('오래된 캐시 제거:', key);
                        return caches.delete(key);
                    }
                })
            )
        )
    );
    self.clients.claim();
});

// 네트워크 요청 이벤트: 캐시된 파일 우선 로드
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});
