import { Platform } from 'react-native';
import Config from 'react-native-config';

/**
 * Demo endpoint per platform. Empty when the platform has no demo backend
 * configured, which hides the demo provider everywhere it is offered.
 */
export const DEMO_API_URL =
  (Platform.OS === 'ios'
    ? Config.DEMO_API_IOS_URL
    : Config.DEMO_API_ANDROID_URL) ?? '';
