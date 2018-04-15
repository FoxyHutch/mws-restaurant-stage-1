const cacheName = 'v17';


self.addEventListener('install', function (event) {
    console.log('SW: Service Worker installed');
    event.waitUntil(
        caches.open(cacheName).then(function (cache) {
            console.log('SW: Caching Files');
            return cache.addAll([
                '/index.html',
                '/css/styles.css',
                '/restaurant.html',
                '/js/dbhelper.js',
                '/js/main.js',
                '/js/restaurant_info.js',
                '/data/restaurants.json',
                '/img/1.jpg',
                '/img/2.jpg',
                '/img/3.jpg',
                '/img/4.jpg',
                '/img/5.jpg',
                '/img/6.jpg',
                '/img/7.jpg',
                '/img/8.jpg',
                '/img/9.jpg',
                '/img/10.jpg'
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

// Match in cache and fetch
self.addEventListener('fetch', function (event) {

    /* for restaurant urls */
        if(event.request.url.includes('restaurant.html?id=')){
            const strippedurl = event.request.url.split('?')[0];
    
            event.respondWith(
                caches.match(strippedurl).then(function(response){
                    return response || fetch(event.response);
                })
            );
            return;
        }
    /* for all other URLs */
        event.respondWith(
            caches.match(event.request).then(function(response){
                return response || fetch(event.request);
            })
        );
    });