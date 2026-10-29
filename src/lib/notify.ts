import { browser } from '$app/environment';

const TITLE = 'Meteo - Nogent-sur-Marne';
const BODY = 'Rain has stopped — go outside!';

export function notificationsSupported(): boolean {
  return browser && 'Notification' in window;
}

/**
 * Ask for notification permission. Call it from a user gesture (turning the
 * birds-alert checkbox on): Safari requires one, and Chrome ignores requests
 * that come out of nowhere.
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!notificationsSupported()) return 'denied';
  if (Notification.permission !== 'default') return Notification.permission;
  try {
    return await Notification.requestPermission();
  } catch (e) {
    console.warn('Notification permission request failed:', e);
    return 'denied';
  }
}

/**
 * Show the rain-stopped notification. This replaces the server-side
 * `node-notifier` desktop notification of the wyts-platform bench.
 *
 * Chrome for Android throws on `new Notification()` from a page, so go through
 * the service worker registration whenever there is one (there is in a
 * production build, see src/service-worker.ts) and keep the constructor as the
 * desktop/dev fallback.
 */
export async function notifyRainStopped(): Promise<void> {
  if (!notificationsSupported() || Notification.permission !== 'granted') return;

  const options: NotificationOptions = {
    body: BODY,
    icon: '/icon.svg',
    tag: 'rain-stopped'
  };

  const registration = await navigator.serviceWorker?.getRegistration();
  if (registration) {
    await registration.showNotification(TITLE, options);
    return;
  }

  new Notification(TITLE, options);
}
