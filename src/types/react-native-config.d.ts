declare module 'react-native-config' {
  export interface NativeConfig {
    CODE_PUSH_CDN_BASE_URL?: string;
    PRIVACY_URL?: string;
    TERMS_URL?: string;
    DEMO_API_IOS_URL?: string;
    DEMO_API_ANDROID_URL?: string;
  }

  export const Config: NativeConfig;
  export default Config;
}
