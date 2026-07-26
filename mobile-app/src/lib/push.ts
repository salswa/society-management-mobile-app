import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { apiRequest } from '@/api/client';

// Show a banner (and play a sound) even when the app is foregrounded.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Asks for permission, gets the Expo push token, and registers it with the
 * backend (`POST /profile/push-token`). Best-effort: never throws.
 * No-op on simulators (Device.isDevice === false) — push needs a real device.
 */
export async function registerForPush(): Promise<void> {
  try {
    if (!Device.isDevice) return;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.HIGH,
      });
    }

    const perm = await Notifications.getPermissionsAsync();
    const granted = perm.granted || (await Notifications.requestPermissionsAsync()).granted;
    if (!granted) return;

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;

    const token = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined
    );

    await apiRequest('/profile/push-token', {
      method: 'POST',
      body: { expo_push_token: token.data },
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[push] register failed', err);
  }
}

type PushData = { type?: string; id?: string };

/** Where a tapped notification should navigate (or null to ignore). */
export function pushHref(data: PushData): string | null {
  switch (data?.type) {
    case 'visitor':
      return data.id ? `/(resident)/visitors/${data.id}` : '/(resident)/visitors';
    case 'notice':
      return data.id ? `/(resident)/notices/${data.id}` : '/(resident)/notices';
    case 'poll':
      return data.id ? `/(resident)/polls/${data.id}` : '/(resident)/polls';
    case 'dues':
      return '/(resident)/dues';
    case 'signup':
      return '/(admin)/residents';
    default:
      return null;
  }
}

/** Subscribes to notification taps; returns an unsubscribe function. */
export function addNotificationTapListener(handler: (data: PushData) => void): () => void {
  const sub = Notifications.addNotificationResponseReceivedListener((resp) => {
    handler(resp.notification.request.content.data as PushData);
  });
  return () => sub.remove();
}
