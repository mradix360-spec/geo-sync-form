const CACHE_NAME = 'geosync-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/src/main.tsx',
  '/src/index.css'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request).then((response) => {
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });
          return response;
        });
      })
  );
});

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-submissions') {
    event.waitUntil(syncPendingSubmissions());
  }
});

async function syncPendingSubmissions() {
  console.log('Background sync: Starting submission sync...');
  
  try {
    const db = await openDatabase();
    const tx = db.transaction('pendingSubmissions', 'readonly');
    const store = tx.objectStore('pendingSubmissions');
    const pending = await store.getAll();
    
    const unsynced = pending.filter(sub => !sub.synced);
    console.log(`Found ${unsynced.length} unsynced submissions`);
    
    for (const submission of unsynced) {
      try {
        // Retry with exponential backoff
        await retryWithBackoff(async () => {
          const response = await fetch('https://shqclgwsgmlnimcggxch.supabase.co/rest/v1/form_responses', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNocWNsZ3dzZ21sbmltY2dneGNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk4MzEzNzAsImV4cCI6MjA3NTQwNzM3MH0.Vbn4EEwVPHqVcu3t6H-LYfaO_SWMD0KjLqWzr0izMlc'
            },
            body: JSON.stringify({
              form_id: submission.formId,
              geojson: submission.geojson,
              client_id: submission.id,
              synced: true
            })
          });
          
          if (!response.ok) {
            // Check if it's a duplicate (409 Conflict or constraint violation)
            if (response.status === 409 || response.status === 422) {
              console.log('Duplicate submission, marking as synced:', submission.id);
              return true; // Consider it synced
            }
            throw new Error(`HTTP ${response.status}`);
          }
          return true;
        }, 3, 1000);
        
        // Mark as synced
        const writeTx = db.transaction('pendingSubmissions', 'readwrite');
        const writeStore = writeTx.objectStore('pendingSubmissions');
        await writeStore.delete(submission.id);
        console.log('Successfully synced submission:', submission.id);
        
      } catch (error) {
        console.error('Failed to sync submission after retries:', submission.id, error);
      }
    }
    
    console.log('Background sync complete');
  } catch (error) {
    console.error('Background sync error:', error);
    throw error; // Re-throw to retry later
  }
}

async function retryWithBackoff(fn, maxRetries, initialDelay) {
  let lastError;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const delay = initialDelay * Math.pow(2, i);
      console.log(`Retry ${i + 1}/${maxRetries} after ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw lastError;
}

async function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('geosync-offline', 1);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
