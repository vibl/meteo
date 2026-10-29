/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />

// Minimal service worker. It exists for one reason: on Chrome for Android
// `new Notification()` from a page throws, and only
// ServiceWorkerRegistration.showNotification() works (see src/lib/notify.ts).
// It deliberately has NO fetch handler and caches nothing, so it can never
// serve stale app code — this app is online-only.
//
// SvelteKit registers it automatically in production builds, not in `vite dev`.

const sw = self as unknown as ServiceWorkerGlobalScope;

sw.addEventListener('install', () => {
  sw.skipWaiting();
});

sw.addEventListener('activate', (event) => {
  event.waitUntil(sw.clients.claim());
});

// Tapping the notification focuses the app instead of opening a second window.
sw.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    (async () => {
      const windows = await sw.clients.matchAll({ type: 'window', includeUncontrolled: true });
      const existing = windows[0];
      if (existing) await existing.focus();
      else await sw.clients.openWindow('/');
    })()
  );
});
