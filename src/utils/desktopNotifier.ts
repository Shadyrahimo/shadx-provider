export type DesktopPermissionState = NotificationPermission | 'unsupported';

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
  if (window.Notification.permission === 'granted') {
    return 'granted';
  }
  try {
    const result = await window.Notification.requestPermission();
    return result;
  } catch {
    return window.Notification.permission;
  }
}

export interface NativeNotificationPayload {
  title: string;
  body: string;
  tag?: string;
  onClick?: () => void;
}

export function triggerNativeDesktopNotification(
  payload: NativeNotificationPayload
): boolean {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }

  if (window.Notification.permission !== 'granted') {
    return false;
  }

  try {
    const notification = new window.Notification(payload.title, {
      body: payload.body,
      icon: '/assets/aistudio/7_20261107_230645______08f45ae0.png',
      badge: '/assets/aistudio/7_20261107_230645______08f45ae0.png',
      dir: 'rtl',
      lang: 'ar',
      tag: payload.tag || `shadx-alert-${Date.now()}`,
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

    return true;
  } catch (err) {
    console.warn('Failed to trigger native desktop notification:', err);
    return false;
  }
}
