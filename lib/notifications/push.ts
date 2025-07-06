/**
 * Web Push Notification Service
 * Handles browser push notifications for enhanced user engagement
 */

export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export class PushNotificationService {
  private static readonly VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  private static instance: PushNotificationService;

  static getInstance(): PushNotificationService {
    if (!PushNotificationService.instance) {
      PushNotificationService.instance = new PushNotificationService();
    }
    return PushNotificationService.instance;
  }

  /**
   * Check if push notifications are supported
   */
  isSupported(): boolean {
    return (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window
    );
  }

  /**
   * Get current permission status
   */
  getPermissionStatus(): NotificationPermission {
    if (!this.isSupported()) return 'denied';
    return Notification.permission;
  }

  /**
   * Request push notification permission
   */
  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) {
      throw new Error('Push notifications are not supported in this browser');
    }

    if (Notification.permission === 'granted') {
      return 'granted';
    }

    if (Notification.permission === 'denied') {
      throw new Error('Push notifications are blocked. Please enable them in your browser settings.');
    }

    const permission = await Notification.requestPermission();
    return permission;
  }

  /**
   * Register service worker for push notifications
   */
  async registerServiceWorker(): Promise<ServiceWorkerRegistration> {
    if (!this.isSupported()) {
      throw new Error('Service workers are not supported');
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;
      return registration;
    } catch (error) {
      console.error('Failed to register service worker:', error);
      throw new Error('Failed to register service worker for push notifications');
    }
  }

  /**
   * Subscribe to push notifications
   */
  async subscribe(userId: string): Promise<PushSubscription | null> {
    try {
      const permission = await this.requestPermission();
      if (permission !== 'granted') {
        return null;
      }

      const registration = await this.registerServiceWorker();
      
      if (!PushNotificationService.VAPID_PUBLIC_KEY) {
        console.warn('VAPID public key not configured');
        return null;
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(PushNotificationService.VAPID_PUBLIC_KEY),
      });

      const pushSubscription: PushSubscription = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: this.arrayBufferToBase64(subscription.getKey('p256dh')!),
          auth: this.arrayBufferToBase64(subscription.getKey('auth')!),
        },
      };

      // Save subscription to backend
      await this.savePushSubscription(userId, pushSubscription);

      return pushSubscription;
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      throw error;
    }
  }

  /**
   * Unsubscribe from push notifications
   */
  async unsubscribe(userId: string): Promise<void> {
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration) return;

      const subscription = await registration.pushManager.getSubscription();
      if (!subscription) return;

      await subscription.unsubscribe();
      await this.removePushSubscription(userId);
    } catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error);
      throw error;
    }
  }

  /**
   * Get current push subscription
   */
  async getCurrentSubscription(): Promise<globalThis.PushSubscription | null> {
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration) return null;

      return await registration.pushManager.getSubscription();
    } catch (error) {
      console.error('Failed to get current subscription:', error);
      return null;
    }
  }

  /**
   * Show a local notification (fallback when push is not available)
   */
  async showLocalNotification(
    title: string,
    options: NotificationOptions = {}
  ): Promise<void> {
    if (!this.isSupported()) return;

    const permission = await this.requestPermission();
    if (permission !== 'granted') return;

    new Notification(title, {
      icon: '/icon-192x192.png',
      badge: '/icon-72x72.png',
      ...options,
    });
  }

  /**
   * Test push notification
   */
  async testPushNotification(userId: string): Promise<void> {
    try {
      const response = await fetch(`/api/users/${userId}/push/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to send test notification');
      }
    } catch (error) {
      console.error('Failed to test push notification:', error);
      throw error;
    }
  }

  /**
   * Save push subscription to backend
   */
  private async savePushSubscription(
    userId: string,
    subscription: PushSubscription
  ): Promise<void> {
    const response = await fetch(`/api/users/${userId}/push/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(subscription),
    });

    if (!response.ok) {
      throw new Error('Failed to save push subscription');
    }
  }

  /**
   * Remove push subscription from backend
   */
  private async removePushSubscription(userId: string): Promise<void> {
    const response = await fetch(`/api/users/${userId}/push/unsubscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to remove push subscription');
    }
  }

  /**
   * Convert VAPID key to Uint8Array
   */
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  /**
   * Convert ArrayBuffer to base64
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  /**
   * Check if running on Android device
   */
  isAndroid(): boolean {
    return typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent);
  }

  /**
   * Check if app is running as PWA
   */
  isPWA(): boolean {
    return typeof window !== 'undefined' && 
           (window.matchMedia('(display-mode: standalone)').matches || 
            (window.navigator as any).standalone === true);
  }
}

export const pushService = PushNotificationService.getInstance();
