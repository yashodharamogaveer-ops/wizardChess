// Registers the service worker (production only) and notifies the UI when offline mode is ready.
export function registerServiceWorker() {
  if (!('serviceWorker' in navigator) || !import.meta.env.PROD) return;

  navigator.serviceWorker.addEventListener('message', (e) => {
    if (e.data && e.data.type === 'OFFLINE_READY') {
      window.dispatchEvent(new CustomEvent('wizardchess:offline-ready'));
    }
  });

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('./sw.js')
      .then((reg) => {
        reg.addEventListener('updatefound', () => {
          const nw = reg.installing;
          nw?.addEventListener('statechange', () => {
            if (nw.state === 'installed' && navigator.serviceWorker.controller) {
              nw.postMessage('SKIP_WAITING'); // new version activates on next launch
            }
          });
        });
      })
      .catch(() => {
        /* offline support unavailable */
      });
  });
}
