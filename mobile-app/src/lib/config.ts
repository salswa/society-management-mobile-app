import { Platform } from 'react-native';

/**
 * Resolves the backend base URL (always ending in /api).
 *
 * Priority:
 *   1. EXPO_PUBLIC_API_URL (set in .env / build config) — use for physical
 *      devices (your PC's LAN IP) and production (deployed URL).
 *   2. Dev localhost default:
 *        - Android emulator reaches the host via 10.0.2.2
 *        - iOS simulator + web reach it via localhost
 */
function resolveApiUrl(): string {
  const override = process.env.EXPO_PUBLIC_API_URL;
  if (override && override.length > 0) return override.replace(/\/$/, '');

  const host = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
  return `http://${host}:4000/api`;
}

export const API_URL = resolveApiUrl();
