import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { NutritionInfo } from '@types';
import { ITheme } from '@theme/theme.interface';
import { useTheme } from '@theme/theme.hook';
import { useThemeContext } from '@theme/theme.context';
import HomeScreen from '@screens/HomeScreen';
import HistoryScreen from '@screens/HistoryScreen';
import HistoryDayScreen from '@screens/HistoryDayScreen';
import AddMealScreen from '@screens/AddMealScreen';
import EditMealScreen from '@screens/EditMealScreen';
import SettingsScreen from '@screens/SettingsScreen';
import AnalyticsScreen from '@screens/AnalyticsScreen';

export type MainStackParamList = {
  MainTabs: undefined;
  AddMeal:
    | {
        photoPath?: string;
        prefill?: { name: string; nutrition: NutritionInfo };
      }
    | undefined;
  EditMeal: { mealId: string };
  HistoryDay: { date: string };
};

export type MainTabsParamList = {
  Today: undefined;
  History: undefined;
  Analytics: undefined;
  Settings: undefined;
};

const Stack = createStackNavigator<MainStackParamList>();
const Tab = createBottomTabNavigator<MainTabsParamList>();

interface TabIconProps {
  label: string;
  color: string;
}

function TabIcon({ label, color }: TabIconProps) {
  const icons: Record<string, string> = {
    Today: '🍽',
    History: '📋',
    Analytics: '📊',
    Settings: '⚙',
  };
  // eslint-disable-next-line react-native/no-inline-styles
  return <Text style={{ fontSize: 20, color }}>{icons[label] ?? '•'}</Text>;
}

function MainTabs() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { theme } = useThemeContext();
  const mainTabStyles = useTheme(themeStyles);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.color.primary,
        tabBarInactiveTintColor: theme.color.placeholder,
        tabBarStyle: [
          mainTabStyles.tabBar,
          { paddingBottom: insets.bottom > 0 ? insets.bottom : 8 },
        ],
        tabBarLabelStyle: mainTabStyles.tabLabel,
      }}
    >
      <Tab.Screen
        name="Today"
        component={HomeScreen}
        options={{
          // eslint-disable-next-line react/no-unstable-nested-components
          tabBarIcon: ({ color }) => <TabIcon label="Today" color={color} />,
          tabBarLabel: t('tabs.today'),
        }}
      />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{
          // eslint-disable-next-line react/no-unstable-nested-components
          tabBarIcon: ({ color }) => <TabIcon label="History" color={color} />,
          tabBarLabel: t('tabs.history'),
        }}
      />
      <Tab.Screen
        name="Analytics"
        component={AnalyticsScreen}
        options={{
          // eslint-disable-next-line react/no-unstable-nested-components
          tabBarIcon: ({ color }) => (
            <TabIcon label="Analytics" color={color} />
          ),
          tabBarLabel: t('tabs.analytics'),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          // eslint-disable-next-line react/no-unstable-nested-components
          tabBarIcon: ({ color }) => <TabIcon label="Settings" color={color} />,
          tabBarLabel: t('tabs.settings'),
        }}
      />
    </Tab.Navigator>
  );
}

export default function MainStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen
        name="AddMeal"
        component={AddMealScreen}
        options={{ presentation: 'modal' }}
      />
      <Stack.Screen
        name="EditMeal"
        component={EditMealScreen}
        options={{ presentation: 'modal' }}
      />
      <Stack.Screen name="HistoryDay" component={HistoryDayScreen} />
    </Stack.Navigator>
  );
}

const themeStyles = (theme: ITheme) => {
  const s = StyleSheet.create({
    tabBar: {
      backgroundColor: theme.color.white,
      borderTopColor: theme.color.tertiaryDarker,
      borderTopWidth: 1,
      paddingTop: 6,
      paddingBottom: 6,
    },
    tabLabel: {
      ...theme.fonts.medium1,
    },
    tabIcon: {
      fontSize: 20,
    },
  });
  return s;
};
