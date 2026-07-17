import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import OnboardingWelcome from '@screens/onboarding/OnboardingWelcome';
import OnboardingUserInfo from '@screens/onboarding/OnboardingUserInfo';
import OnboardingGoal from '@screens/onboarding/OnboardingGoal';
import OnboardingResult from '@screens/onboarding/OnboardingResult';
import OnboardingApiKey from '@screens/onboarding/OnboardingApiKey';

export type OnboardingStackParamList = {
  Welcome: undefined;
  UserInfo: undefined;
  Goal: undefined;
  Result: undefined;
  ApiKey: undefined;
};

const Stack = createStackNavigator<OnboardingStackParamList>();

export default function OnboardingStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Welcome" component={OnboardingWelcome} />
      <Stack.Screen name="UserInfo" component={OnboardingUserInfo} />
      <Stack.Screen name="Goal" component={OnboardingGoal} />
      <Stack.Screen name="Result" component={OnboardingResult} />
      <Stack.Screen name="ApiKey" component={OnboardingApiKey} />
    </Stack.Navigator>
  );
}
