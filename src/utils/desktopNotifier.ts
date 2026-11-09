export type DesktopPermissionState = NotificationPermission | 'unsupported';

const APP_ICON_PATH = '/assets/aistudio/7_20261107_230645______08f45ae0.png';

let swRegistrationPromise: Promise<ServiceWorkerRegistration | null> | null = null;

/**
 * Registers /sw.js so mobile browsers (Android Chrome, Samsung Internet, Edge Mobile)
 * can dispatch native notifications via ServiceWorkerRegistration.showNotification().
 */
export function ensureServiceWorkerRegistered(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return Promise.resolve(null);
  }

  if (!swRegistrationPromise) {
    swRegistrationPromise = (async () => {
      try {
        const existing = await navigator.serviceWorker.getRegistration('/');
        if (existing) {
          return existing;
        }
        const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
        return reg;
      } catch (err) {
        console.warn('Service Worker registration skipped:', err);
        return null;
      }
    })();
  }

  return swRegistrationPromise;
}

// Pre-register Service Worker on module load in browser environments
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  ensureServiceWorkerRegistered();
}

export function getDesktopNotificationPermission(): DesktopPermissionState {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return window.Notification.permission;
}

export async function requestDesktopNotificationPermission(): Promise<DesktopPermissionState> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  // Ensure Service Worker is ready for mobile browsers when permission is requested
  await ensureServiceWorkerRegistered();

  if (window.Notification.permission === 'granted') {
    return 'granted';
  }
  try {
    // Support both Promise-based and legacy callback-based requestPermission
    const permissionPromise = window.Notification.requestPermission();
    if (permissionPromise && typeof permissionPromise.then === 'function') {
      return await permissionPromise;
    }
    return window.Notification.permission;
  } catch {
    return window.Notification.permission;
  }
}

/**
 * Plays a clean, pleasant dual-tone notification chime using Web Audio API
 * (works on mobile & desktop without external audio files).
 */
export function playAlertNotificationSound(): void {
  if (typeof window === 'undefined') return;
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    // First tone (E5 = 659.25 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(659.25, now);
    gain1.gain.setValueAtTime(0.14, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.18);

    // Second tone (A5 = 880 Hz)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, now + 0.14);
    gain2.gain.setValueAtTime(0.16, now + 0.14);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.42);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.14);
    osc2.stop(now + 0.42);
  } catch {
    // Ignore audio context restrictions if not user-gestured
  }
}

/**
 * Triggers tactile vibration on supported mobile devices.
 */
export function vibrateMobileDevice(): void {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate([160, 70, 160]);
    } catch {
      // Ignore vibration errors
    }
  }
}

export interface NativeNotificationPayload {
  title: string;
  body: string;
  tag?: string;
  playSound?: boolean;
  onClick?: () => void;
}

export interface NativeNotificationResult {
  sent: boolean;
  method: 'service_worker' | 'window_api' | 'in_app_fallback';
  reason?: string;
}

/**
 * Dispatches a native OS/Mobile notification.
 * - On Android / Mobile browsers: uses ServiceWorkerRegistration.showNotification()
 *   because `new Notification()` throws "Illegal constructor" on mobile Chrome.
 * - On Desktop browsers: uses `new window.Notification()` or Service Worker.
 * - Always plays audio chime & mobile vibration when playSound !== false.
 */
export async function triggerNativeDesktopNotification(
  payload: NativeNotificationPayload
): Promise<NativeNotificationResult> {
  if (payload.playSound !== false) {
    playAlertNotificationSound();
    vibrateMobileDevice();
  }

  const tag = payload.tag || `shadx-alert-${Date.now()}`;
  const notifOptions: NotificationOptions & { renotify?: boolean; vibrate?: number[] } = {
    body: payload.body,
    icon: APP_ICON_PATH,
    badge: APP_ICON_PATH,
    dir: 'rtl',
    lang: 'ar',
    tag,
    renotify: true,
    vibrate: [160, 70, 160],
  };

  if (typeof window === 'undefined' || !('Notification' in window)) {
    return {
      sent: false,
      method: 'in_app_fallback',
      reason: 'Notification API unsupported in this browser context',
    };
  }

  if (window.Notification.permission !== 'granted') {
    return {
      sent: false,
      method: 'in_app_fallback',
      reason: `Permission is ${window.Notification.permission}`,
    };
  }

  // 1. Try ServiceWorkerRegistration.showNotification() FIRST (Required on Android Chrome & Mobile Browsers)
  if ('serviceWorker' in navigator) {
    try {
      const reg = await ensureServiceWorkerRegistered();
      if (reg && typeof reg.showNotification === 'function') {
        // Wait briefly if the Service Worker is still activating on first load
        if (!reg.active && (reg.installing || reg.waiting)) {
          await Promise.race([
            navigator.serviceWorker.ready,
            new Promise((resolve) => setTimeout(resolve, 1200)),
          ]);
        }
        const activeReg = (await navigator.serviceWorker.getRegistration('/')) || reg;
        if (activeReg && activeReg.active) {
          await activeReg.showNotification(payload.title, notifOptions);
          return { sent: true, method: 'service_worker' };
        }
      }
    } catch (swErr) {
      console.warn('ServiceWorker showNotification fallback to window.Notification:', swErr);
    }
  }

  // 2. Try standard window.Notification constructor (Works on Desktop Chrome, Firefox, Safari, Edge)
  try {
    const notification = new window.Notification(payload.title, {
      body: payload.body,
      icon: APP_ICON_PATH,
      badge: APP_ICON_PATH,
      dir: 'rtl',
      lang: 'ar',
      tag,
    });

    notification.onclick = () => {
      try {
        window.focus();
        if (payload.onClick) {
          payload.onClick();
        }
        notification.close();
      } catch {
        // Ignore focus errors
      }
    };

    return { sent: true, method: 'window_api' };
  } catch (winErr: any) {
    // 3. If window.Notification threw "Illegal constructor" on Android and SW just finished activating, retry SW once more
    if ('serviceWorker' in navigator) {
      try {
        const readyReg = await Promise.race([
          navigator.serviceWorker.ready,
          new Promise<null>((resolve) => setTimeout(() => resolve(null), 1500)),
        ]);
        if (readyReg && typeof readyReg.showNotification === 'function') {
          await readyReg.showNotification(payload.title, notifOptions);
          return { sent: true, method: 'service_worker' };
        }
      } catch {
        // Continue to fallback
      }
    }

    return {
      sent: false,
      method: 'in_app_fallback',
      reason: winErr?.message || 'Blocked by mobile browser or embedded iframe context',
    };
  }
}
