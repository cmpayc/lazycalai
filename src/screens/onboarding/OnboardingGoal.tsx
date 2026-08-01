import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { ITheme } from '@theme/theme.interface';
import { useTheme } from '@theme/theme.hook';
import type { OnboardingStackParamList } from '@navigation/OnboardingStack';
import { useSettingsStore } from '@store/settingsStore';
import OnboardingBackButton from '@components/OnboardingBackButton';
import DailyCalorieCard from '@components/DailyCalorieCard';
import { calculateDailyCalorieGoal, GOAL_PACES } from '@utils/calories';
import { displayPace } from '@utils/units';
import { WeightGoal } from '@types';

type Nav = StackNavigationProp<OnboardingStackParamList, 'Goal'>;

const GOALS: WeightGoal[] = ['lose', 'maintain', 'gain'];

export default function OnboardingGoal() {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const {
    sex,
    weightKg,
    heightCm,
    age,
    activityFactor,
    units,
    updateSettings,
  } = useSettingsStore();
  const styles = useTheme(themeStyles);
  const paceUnit = t(units === 'imperial' ? 'units.lbs' : 'units.kg');

  const [goal, setGoal] = useState<WeightGoal>('lose');
  const [paceKgPerMonth, setPaceKgPerMonth] = useState(
    GOAL_PACES[1].kgPerMonth,
  );

  const dailyCalories = useMemo(
    () =>
      calculateDailyCalorieGoal(
        weightKg,
        heightCm,
        age,
        sex,
        goal,
        paceKgPerMonth,
        activityFactor,
      ),
    [weightKg, heightCm, age, sex, goal, paceKgPerMonth, activityFactor],
  );

  const handleContinue = () => {
    updateSettings({
      weightGoal: goal,
      goalPaceKgPerMonth: goal === 'maintain' ? 0 : paceKgPerMonth,
      dailyCalorieGoal: dailyCalories,
    });
    navigation.navigate('Activity');
  };

  return (
    <View style={styles.container}>
      <OnboardingBackButton />
      <Text style={styles.title}>{t('onboarding.goal.title')}</Text>

      <View style={styles.goalRow}>
        {GOALS.map((g) => (
          <TouchableOpacity
            key={g}
            style={[styles.goalButton, goal === g && styles.goalActive]}
            onPress={() => setGoal(g)}
          >
            <Text
              style={[styles.goalText, goal === g && styles.goalTextActive]}
            >
              {t(`onboarding.goal.${g}`)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {goal !== 'maintain' && (
        <>
          <Text style={styles.label}>{t('onboarding.goal.pace')}</Text>
          <View style={styles.paces}>
            {[GOAL_PACES.slice(0, 2), GOAL_PACES.slice(2, 4)].map(
              (group, idx) => (
                // eslint-disable-next-line react/no-array-index-key
                <View style={styles.paceRow} key={idx}>
                  {group.map((p) => (
                    <TouchableOpacity
                      key={p.key}
                      style={[
                        styles.paceButton,
                        paceKgPerMonth === p.kgPerMonth && styles.paceActive,
                      ]}
                      onPress={() => setPaceKgPerMonth(p.kgPerMonth)}
                    >
                      <Text
                        style={[
                          styles.paceText,
                          paceKgPerMonth === p.kgPerMonth &&
                            styles.paceTextActive,
                        ]}
                      >
                        {t(`onboarding.goal.pace_${p.key}`)}
                      </Text>
                      <Text
                        style={[
                          styles.paceSubText,
                          paceKgPerMonth === p.kgPerMonth &&
                            styles.paceTextActive,
                        ]}
                      >
                        {t('onboarding.goal.perMonth', {
                          value: displayPace(p.kgPerMonth, units),
                          unit: paceUnit,
                        })}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ),
            )}
          </View>
        </>
      )}

      <DailyCalorieCard calories={dailyCalories} sex={sex} />

      <TouchableOpacity style={styles.button} onPress={handleContinue}>
        <Text style={styles.buttonText}>{t('onboarding.goal.continue')}</Text>
      </TouchableOpacity>
    </View>
  );
}

const themeStyles = (theme: ITheme) => {
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      paddingHorizontal: 32,
      justifyContent: 'center',
      backgroundColor: theme.color.white,
    },
    title: {
      ...theme.fonts.bold6,
      marginBottom: 32,
      color: theme.color.main,
    },
    label: {
      ...theme.fonts.bold2,
      color: theme.color.subText,
      marginBottom: 8,
      marginTop: 24,
    },
    goalRow: {
      gap: 12,
    },
    goalButton: {
      borderWidth: 1,
      borderColor: theme.color.border,
      borderRadius: 10,
      paddingVertical: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    goalActive: {
      backgroundColor: theme.color.primary,
      borderColor: theme.color.primary,
    },
    goalText: {
      ...theme.fonts.regular3,
      color: theme.color.subText,
      textAlign: 'center',
    },
    goalTextActive: {
      color: theme.color.white,
      ...theme.fonts.bold3,
    },
    paces: {
      gap: 12,
    },
    paceRow: {
      flexDirection: 'row',
      gap: 12,
    },
    paceButton: {
      flex: 1,
      borderWidth: 1,
      borderColor: theme.color.border,
      borderRadius: 10,
      paddingVertical: 12,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
    },
    paceActive: {
      backgroundColor: theme.color.primary,
      borderColor: theme.color.primary,
    },
    paceText: {
      ...theme.fonts.bold3,
      color: theme.color.main,
      textAlign: 'center',
    },
    paceSubText: {
      ...theme.fonts.regular2,
      color: theme.color.subText,
      textAlign: 'center',
    },
    paceTextActive: { color: theme.color.white },
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
