import { MMKV } from 'react-native-mmkv';
import uuid from 'react-native-uuid';

const storage = new MMKV({ id: 'device' });

const DEVICE_ID_KEY = 'deviceId';

/**
 * Returns the persistent unique device ID, generating and storing one on first
 * access. Safe to call any number of times; the value is stable across restarts.
 */
export function getDeviceId(): string {
  const existing = storage.getString(DEVICE_ID_KEY);
  if (existing) return existing;

  const id = uuid.v4() as string;
  storage.set(DEVICE_ID_KEY, id);
  return id;
}
