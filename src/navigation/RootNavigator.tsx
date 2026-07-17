import React from 'react';
import { NavigationContainer } from '@react-navigation/native';

import { useSettingsStore } from '@store/settingsStore';
import OnboardingStack from './OnboardingStack';
import MainStack from './MainStack';

export default function RootNavigator() {
  const onboardingComplete = useSettingsStore((s) => s.onboardingComplete);

  return (
    <NavigationContainer>
      {onboardingComplete ? <MainStack /> : <OnboardingStack />}
    </NavigationContainer>
  );
}
