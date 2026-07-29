import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { ITheme } from '@theme/theme.interface';
import { useTheme } from '@theme/theme.hook';
import type { OnboardingStackParamList } from '@navigation/OnboardingStack';
import { useSettingsStore } from '@store/settingsStore';
import OnboardingBackButton from '@components/OnboardingBackButton';
import DailyCalorieCard from '@components/DailyCalorieCard';
import { ACTIVITY_LEVELS, calculateDailyCalorieGoal } from '@utils/calories';

type Nav = StackNavigationProp<OnboardingStackParamList, 'Activity'>;

export default function OnboardingActivity() {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const {
    sex,
    weightKg,
    heightCm,
    age,
    weightGoal,
    goalPaceKgPerMonth,
    activityFactor,
    updateSettings,
  } = useSettingsStore();
  const styles = useTheme(themeStyles);

  const [factor, setFactor] = useState(activityFactor);

  const dailyCalories = useMemo(
    () =>
      calculateDailyCalorieGoal(
        weightKg,
        heightCm,
        age,
        sex,
        weightGoal,
        goalPaceKgPerMonth,
        factor,
      ),
    [weightKg, heightCm, age, sex, weightGoal, goalPaceKgPerMonth, factor],
  );

  useEffect(() => {
    updateSettings({
      dailyCalorieGoal: dailyCalories,
    });
  }, [dailyCalories, updateSettings]);

  const updateFactor = (newFactor: number) => {
    setFactor(newFactor);
    updateSettings({
      activityFactor: newFactor,
    });
  };

  const handleContinue = () => {
    updateSettings({
      activityFactor: factor,
      dailyCalorieGoal: dailyCalories,
    });
    navigation.navigate('Result');
  };

  return (
    <View style={styles.flex}>
      <OnboardingBackButton />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>{t('onboarding.activity.title')}</Text>

        <View style={styles.levels}>
          {ACTIVITY_LEVELS.map((level) => {
            const active = factor === level.factor;
            return (
              <TouchableOpacity
                key={level.key}
                style={[styles.levelButton, active && styles.levelActive]}
                onPress={() => updateFactor(level.factor)}
              >
                <Text
                  style={[styles.levelText, active && styles.levelTextActive]}
                >
                  {t(`onboarding.activity.level_${level.key}`)}
                </Text>
                <Text
                  style={[styles.levelDesc, active && styles.levelTextActive]}
                >
                  {t(`onboarding.activity.level_${level.key}_desc`)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <DailyCalorieCard calories={dailyCalories} sex={sex} />

        <TouchableOpacity style={styles.button} onPress={handleContinue}>
          <Text style={styles.buttonText}>
            {t('onboarding.activity.continue')}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const themeStyles = (theme: ITheme) => {
  const styles = StyleSheet.create({
    flex: {
      flex: 1,
      backgroundColor: theme.color.white,
    },
    container: {
      flexGrow: 1,
      paddingHorizontal: 32,
      justifyContent: 'center',
      paddingVertical: 48,
    },
    title: {
      ...theme.fonts.bold6,
      marginBottom: 24,
      color: theme.color.main,
    },
    levels: {
      gap: 12,
    },
    levelButton: {
      borderWidth: 1,
      borderColor: theme.color.border,
      borderRadius: 10,
      paddingVertical: 10,
      paddingHorizontal: 16,
      gap: 4,
    },
    levelActive: {
      backgroundColor: theme.color.primary,
      borderColor: theme.color.primary,
    },
    levelText: {
      ...theme.fonts.bold3,
      color: theme.color.main,
    },
    levelDesc: {
      ...theme.fonts.regular2,
      color: theme.color.subText,
    },
    levelTextActive: {
      color: theme.color.white,
    },
    button: {
      backgroundColor: theme.color.primary,
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
      marginTop: 32,
    },
    buttonText: {
      color: theme.color.white,
      ...theme.fonts.bold4,
    },
  });
  return styles;
};
