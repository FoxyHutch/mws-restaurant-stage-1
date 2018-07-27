if ('function' === typeof importScripts) {
    importScripts('/js/idb.js');
    importScripts('/js/dbhelper.js');
}

const staticCacheName = 'restaurant-static-v1';
const imgCacheName = 'restaurant-imgs';
const allCaches = [
    staticCacheName,
    imgCacheName
]

var filesToCache = [
    '.',
    '/index.html',
    '/css/styles.css',
    '/restaurant.html',
    '/js/dbhelper.js',
    '/js/main.js',
    '/js/idb.js',
    '/js/picturefill.min.js',
    '/js/restaurant_info.js',
    '/manifest.webmanifest',
    '/sw.js',
    '/js/vanillalazyload.min.js'
]




self.addEventListener('install', function (event) {
    console.log('SW: Service Worker installed');
    event.waitUntil(
        caches.open(staticCacheName).then(function (cache) {
            console.log('SW: Caching Files');
            return cache.addAll(filesToCache)
        })
    )
})

self.addEventListener('activate', function (event) {
    console.log('SW: Service Worker activated');

    event.waitUntil(
        caches.keys().then(function (cacheNames) {
            return Promise.all(
                cacheNames.filter(function (cacheName) {
                    return cacheName.startsWith('restaurant-') &&
                        !allCaches.includes(cacheName);
                }).map(function (cacheName) {
                    return caches.delete(cacheName);
                })
            );
        })
    );
});


self.addEventListener('sync', function (event) {
    if (event.tag === 'myFirstSync') {
        event.waitUntil(

            DBHelper.fetchReviewsForDBSync()
                .then(function (reviews) {
                    return Promise.all(reviews.map(function (review) {
                        let reviewToSend = {
                            restaurant_id:review.restaurant_id,
                            name:review.name,
                            comments:review.comments,
                            rating: review.rating
                        }
                        return fetch('http://localhost:1337/reviews/', {
                            method: 'POST',
                            body: JSON.stringify(reviewToSend),
                            headers: {
                                "Content-Type": "application/json; charset=utf-8"
                            }
                        }).then(function (response) {
                            if (response.ok) {
                                return DBHelper.deleteReviewAfterPOST(review.id);
                            } else {
                                console.log(response.status);
                            }

                        }).then(response => console.log(response));
                    }))
                })
                .catch(function (err) {
                    console.error(err);
                })
        )
    }
})


// Match in cache and fetch
self.addEventListener('fetch', function (event) {
    var requestUrl = new URL(event.request.url);

    /* for restaurant urls */
    if (requestUrl.origin === location.origin) {
        if (event.request.url.includes('restaurant.html?id=')) {
            const strippedurl = event.request.url.split('?')[0];
            event.respondWith(
                caches.match(strippedurl).then(function (response) {
                    return response || fetch(event.response);
                })
            );
            return;
        }
        if (requestUrl.pathname.startsWith('/img/')) {

            event.respondWith(servePhoto(event.request));

            return;
        }
    }
    /* for all other URLs */
    event.respondWith(
        caches.match(event.request).then(function (response) {
            return response || fetch(event.request);
        })
    );
});


function servePhoto(request) {

    const storageUrl = request.url.replace(/_\w+\.\w+$/, '');

    return caches.open(imgCacheName).then(function (cache) {
        return cache.match(storageUrl).then(function (response) {
            if (response) return response;

            return fetch(request).then(function (networkResponse) {
                cache.put(storageUrl, networkResponse.clone());
                return networkResponse;
            })
        })
    })
}