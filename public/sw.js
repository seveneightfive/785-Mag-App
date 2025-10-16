const CACHE_NAME = '785mag-v2'
const RUNTIME_CACHE = '785mag-runtime-v2'
const IMAGE_CACHE = '785mag-images-v2'

const urlsToCache = [
  '/',
  '/manifest.json',
  '/index.html',
  '/offline.html'
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache).catch((error) => {
          console.error('Cache addAll failed:', error)
        })
      })
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (event) => {
  const currentCaches = [CACHE_NAME, RUNTIME_CACHE, IMAGE_CACHE]
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return cacheNames.filter((cacheName) => !currentCaches.includes(cacheName))
    }).then((cachesToDelete) => {
      return Promise.all(cachesToDelete.map((cacheToDelete) => {
        return caches.delete(cacheToDelete)
      }))
    }).then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  if (request.method !== 'GET') {
    return
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const responseClone = response.clone()
          caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put(request, responseClone)
          })
          return response
        })
        .catch(() => {
          return caches.match(request)
            .then((response) => response || caches.match('/offline.html'))
        })
    )
    return
  }

  if (request.destination === 'image') {
    event.respondWith(
      caches.open(IMAGE_CACHE).then((cache) => {
        return cache.match(request).then((cachedResponse) => {
          const isExternal = url.origin !== location.origin

          if (isExternal) {
            return fetch(request, {
              mode: 'cors',
              credentials: 'omit',
              headers: {
                'Accept': 'image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
              }
            }).then((response) => {
              if (response.ok && response.status === 200) {
                cache.put(request, response.clone())
              }
              return response
            }).catch((error) => {
              console.warn('External image fetch failed:', request.url, error)
              if (cachedResponse) {
                return cachedResponse
              }
              return new Response(
                '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect fill="#FFCE03" width="200" height="200"/></svg>',
                { headers: { 'Content-Type': 'image/svg+xml' } }
              )
            })
          }

          if (cachedResponse) {
            return cachedResponse
          }

          return fetch(request).then((response) => {
            if (response.status === 200) {
              cache.put(request, response.clone())
            }
            return response
          }).catch(() => {
            return new Response(
              '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect fill="#FFCE03" width="200" height="200"/></svg>',
              { headers: { 'Content-Type': 'image/svg+xml' } }
            )
          })
        })
      })
    )
    return
  }

  if (request.destination === 'font' || request.url.includes('fonts.googleapis.com') || request.url.includes('fonts.gstatic.com')) {
    event.respondWith(
      fetch(request, {
        mode: 'cors',
        credentials: 'omit'
      }).then((response) => {
        if (response.status === 200) {
          const responseClone = response.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone)
          })
        }
        return response
      }).catch(() => {
        return caches.match(request)
      })
    )
    return
  }

  if (url.origin === location.origin && (
    request.destination === 'script' ||
    request.destination === 'style' ||
    request.url.includes('/assets/')
  )) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse
          }
          return fetch(request).then((response) => {
            if (response.status === 200) {
              cache.put(request, response.clone())
            }
            return response
          })
        })
      })
    )
    return
  }

  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  )
})