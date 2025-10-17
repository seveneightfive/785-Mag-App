const VERSION = '785mag-v3'
const CACHE_NAME = `${VERSION}-static`
const RUNTIME_CACHE = `${VERSION}-runtime`
const IMAGE_CACHE = `${VERSION}-images`
const CDN_CACHE = `${VERSION}-cdn`
const CACHE_MAX_AGE = 4 * 60 * 60 * 1000
const NETWORK_TIMEOUT = 3000

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

async function isCacheExpired(response) {
  if (!response) return true

  const cachedDate = response.headers.get('sw-cache-date')
  if (!cachedDate) return true

  const cacheAge = Date.now() - new Date(cachedDate).getTime()
  return cacheAge > CACHE_MAX_AGE
}

async function addCacheTimestamp(response) {
  const headers = new Headers(response.headers)
  headers.set('sw-cache-date', new Date().toISOString())

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: headers
  })
}

async function fetchWithTimeout(request, timeout) {
  return Promise.race([
    fetch(request),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Network timeout')), timeout)
    )
  ])
}

function isWhalesyncCDN(url) {
  return url.hostname.includes('whalesyncusercontent.com')
}

self.addEventListener('activate', (event) => {
  const currentCaches = [CACHE_NAME, RUNTIME_CACHE, IMAGE_CACHE, CDN_CACHE]
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return cacheNames.filter((cacheName) => !currentCaches.includes(cacheName))
    }).then((cachesToDelete) => {
      return Promise.all(cachesToDelete.map((cacheToDelete) => {
        console.log('Deleting old cache:', cacheToDelete)
        return caches.delete(cacheToDelete)
      }))
    }).then(() => {
      console.log('Service worker activated, claiming clients')
      return self.clients.claim()
    })
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
      (async () => {
        const isExternal = url.origin !== location.origin
        const isCDN = isWhalesyncCDN(url)
        const cacheName = isCDN ? CDN_CACHE : IMAGE_CACHE

        if (isCDN) {
          try {
            const networkResponse = await fetchWithTimeout(request, NETWORK_TIMEOUT)

            if (networkResponse.ok && networkResponse.status === 200) {
              const cache = await caches.open(cacheName)
              const timestampedResponse = await addCacheTimestamp(networkResponse.clone())
              cache.put(request, timestampedResponse)
              return networkResponse
            }
          } catch (error) {
            console.warn('CDN image fetch failed, falling back to cache:', request.url)
            const cache = await caches.open(cacheName)
            const cachedResponse = await cache.match(request)

            if (cachedResponse) {
              const expired = await isCacheExpired(cachedResponse)
              if (expired) {
                console.warn('Cached CDN image is expired but network failed:', request.url)
              }
              return cachedResponse
            }

            return new Response(
              '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect fill="#FFCE03" width="200" height="200"/></svg>',
              { headers: { 'Content-Type': 'image/svg+xml' } }
            )
          }
        }

        if (isExternal) {
          try {
            const networkResponse = await fetch(request, {
              mode: 'cors',
              credentials: 'omit',
              headers: {
                'Accept': 'image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
              }
            })

            if (networkResponse.ok && networkResponse.status === 200) {
              const cache = await caches.open(cacheName)
              cache.put(request, networkResponse.clone())
              return networkResponse
            }
          } catch (error) {
            console.warn('External image fetch failed:', request.url)
            const cache = await caches.open(cacheName)
            const cachedResponse = await cache.match(request)

            if (cachedResponse) {
              return cachedResponse
            }

            return new Response(
              '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect fill="#FFCE03" width="200" height="200"/></svg>',
              { headers: { 'Content-Type': 'image/svg+xml' } }
            )
          }
        }

        const cache = await caches.open(cacheName)
        const cachedResponse = await cache.match(request)

        if (cachedResponse) {
          return cachedResponse
        }

        try {
          const response = await fetch(request)
          if (response.status === 200) {
            cache.put(request, response.clone())
          }
          return response
        } catch (error) {
          return new Response(
            '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect fill="#FFCE03" width="200" height="200"/></svg>',
            { headers: { 'Content-Type': 'image/svg+xml' } }
          )
        }
      })()
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

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        )
      }).then(() => {
        event.ports[0].postMessage({ success: true })
      })
    )
  }

  if (event.data && event.data.type === 'CLEAR_CDN_CACHE') {
    event.waitUntil(
      caches.delete(CDN_CACHE).then(() => {
        console.log('CDN cache cleared')
        event.ports[0].postMessage({ success: true })
      })
    )
  }
})

async function cleanupExpiredCDNCache() {
  try {
    const cache = await caches.open(CDN_CACHE)
    const requests = await cache.keys()

    for (const request of requests) {
      const response = await cache.match(request)
      if (await isCacheExpired(response)) {
        console.log('Deleting expired CDN cache entry:', request.url)
        await cache.delete(request)
      }
    }
  } catch (error) {
    console.error('Error cleaning up CDN cache:', error)
  }
}

setInterval(() => {
  cleanupExpiredCDNCache()
}, 60 * 60 * 1000)