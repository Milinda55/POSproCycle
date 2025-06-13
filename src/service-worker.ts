export default null

declare const self: ServiceWorkerGlobalScope

// Cache name
const CACHE_NAME = 'my-app-cache-v1'

// Install event
self.addEventListener('install', (event: { waitUntil: (arg0: Promise<void>) => void }) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll([
                '/',
                '/index.html',
                '/assets/index.*.js',
                '/assets/index.*.css',
                // Add other critical assets
            ])
        })
    )
})

// Fetch event
self.addEventListener('fetch', (event: { respondWith: (arg0: Promise<Response>) => void; request: RequestInfo | URL }) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request)
        })
    )
})

// Activate event
self.addEventListener('activate', (event: { waitUntil: (arg0: Promise<(boolean | undefined)[]>) => void }) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName)
                    }
                })
            )
        })
    )
})