import React from 'react';
import { StatusBar, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import CodePush from '@bravemobile/react-native-code-push';
import '@i18n';

import { releaseHistoryFetcher } from '@utils/codePush';

import ErrorBoundary from '@components/ErrorBoundary';
import Toast from '@components/Toast';
import RootNavigator from '@navigation/RootNavigator';
import { ThemeProvider } from '@theme/theme.context';
import { DEFAULT_THEME, DARK_THEME } from '@theme/default.theme';
import { ITheme } from '@theme/theme.interface';
import { useTheme } from '@theme/theme.hook';
import { useSettingsStore } from '@store/settingsStore';
import { getDeviceId } from '@utils/deviceId';

// Ensure a unique device ID exists in storage on app startup.
getDeviceId();

function AppContent() {
  const themeMode = useSettingsStore((s) => s.themeMode);
  const styles = useTheme(themeStyles);

  return (
    <GestureHandlerRootView style={styles.flex}>
      <SafeAreaProvider>
        <StatusBar
          barStyle={themeMode === 'dark' ? 'light-content' : 'dark-content'}
        />
        <RootNavigator />
        <Toast />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function App() {
  const themeMode = useSettingsStore((s) => s.themeMode);
  const setThemeMode = useSettingsStore((s) => s.setThemeMode);
  const theme = themeMode === 'dark' ? DARK_THEME : DEFAULT_THEME;

  return (
    <ErrorBoundary>
      <ThemeProvider theme={theme} setThemeMode={setThemeMode}>
        <AppContent />
      </ThemeProvider>
    </ErrorBoundary>
  );
}

// Only run CodePush on production (release) builds. `__DEV__` is false in
// release binaries, so debug/dev builds render the app without OTA updates.
export default __DEV__
  ? App
  : CodePush({
      checkFrequency: CodePush.CheckFrequency.ON_APP_START,
      releaseHistoryFetcher,
    })(App);

const themeStyles = (_theme: ITheme) => {
  const styles = StyleSheet.create({
    flex: {
      flex: 1,
    },
  });
  return styles;
};
