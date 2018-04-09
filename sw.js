const cacheName = 'v5';

self.addEventListener('install', function (event) {
    console.log('SW: Service Worker installed');
    event.waitUntil(
        caches.open(cacheName).then(function (cache) {
            console.log('SW: Caching Files');
            return cache.addAll([
                '/skeleton',
                '/index.html',
                '/css/styles.css',
                '/restaurant.html',
                '/js/dbhelper.js',
                '/js/main.js',
                '/js/restaurant_info.js',
                '/data/restaurants.json',
                '/img/1.jpg'
            ])
        })
    )
})

self.addEventListener('activate', function (event) {
    console.log('SW: Service Worker activated');

    //Delete old Cache if new Cacheversion is available
    event.waitUntil(
        caches.keys().then(function (cacheNames) {
            return Promise.all(cacheNames.map(function (thisCacheName) {
                if (thisCacheName !== cacheName) {
                    console.log('SW: Deleting old Cache:', thisCacheName);

                    return caches.delete(thisCacheName);

                }
            }))
        })
    )
})

self.addEventListener('fetch', function (event) {
    console.log('SW: Service Worker is fetching');

    event.respondWith(
        caches.match(event.request).then(function (resp) {


            return resp || fetch(event.request).then(function (response) {
                const responseClone = response.clone();
                caches.open(cacheName).then(function (cache) {
                    cache.put(event.request, responseClone);

                })
                return response;
            })
                .catch(function (err) {
                    console.log('SW: Error while fetching and Caching:', err);
                });
        })
    )
})