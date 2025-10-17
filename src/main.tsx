import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import App from './App.tsx';
import './index.css';

// Register service worker for PWA with automatic updates
if ('serviceWorker' in navigator) {
  let registration: ServiceWorkerRegistration;

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((reg) => {
        registration = reg;
        console.log('SW registered: ', reg);

        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          console.log('New service worker found, installing...');

          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('New service worker installed, activating silently...');
                newWorker.postMessage({ type: 'SKIP_WAITING' });
              }
            });
          }
        });

        let refreshing = false;
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          if (refreshing) return;
          refreshing = true;
          console.log('Service worker updated, reloading page...');
          window.location.reload();
        });

        const checkForUpdates = () => {
          if (reg) {
            reg.update().catch((err) => {
              console.log('Update check failed:', err);
            });
          }
        };

        setInterval(checkForUpdates, 5 * 60 * 1000);

        document.addEventListener('visibilitychange', () => {
          if (!document.hidden) {
            checkForUpdates();
          }
        });

        window.addEventListener('focus', () => {
          checkForUpdates();
        });
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });

  (window as any).clearPWACache = async () => {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      const messageChannel = new MessageChannel();

      return new Promise((resolve) => {
        messageChannel.port1.onmessage = (event) => {
          if (event.data.success) {
            console.log('All caches cleared successfully');
            resolve(true);
          }
        };

        navigator.serviceWorker.controller.postMessage(
          { type: 'CLEAR_CACHE' },
          [messageChannel.port2]
        );
      });
    }
    return Promise.reject('Service worker not available');
  };

  (window as any).clearCDNCache = async () => {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      const messageChannel = new MessageChannel();

      return new Promise((resolve) => {
        messageChannel.port1.onmessage = (event) => {
          if (event.data.success) {
            console.log('CDN cache cleared successfully');
            resolve(true);
          }
        };

        navigator.serviceWorker.controller.postMessage(
          { type: 'CLEAR_CDN_CACHE' },
          [messageChannel.port2]
        );
      });
    }
    return Promise.reject('Service worker not available');
  };
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </StrictMode>
);
