import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { ITheme } from '@theme/theme.interface';
import { useTheme } from '@theme/theme.hook';
import { useThemeContext } from '@theme/theme.context';
import type { OnboardingStackParamList } from '@navigation/OnboardingStack';
import { useSettingsStore } from '@store/settingsStore';
import OnboardingBackButton from '@components/OnboardingBackButton';
import { calculateObesityResult } from '@utils/calories';
import { displayPace } from '@utils/units';

type Nav = StackNavigationProp<OnboardingStackParamList, 'Result'>;

export default function OnboardingResult() {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const {
    weightKg,
    heightCm,
    weightGoal,
    goalPaceKgPerMonth,
    dailyCalorieGoal,
    units,
    updateSettings,
  } = useSettingsStore();
  const styles = useTheme(themeStyles);
  const { theme } = useThemeContext();

  const initialResult = calculateObesityResult(weightKg, heightCm);

  const [calorieGoal, setCalorieGoal] = useState(String(dailyCalorieGoal));

  const handleContinue = () => {
    const goal = parseInt(calorieGoal, 10);
    if (goal) {
      updateSettings({ dailyCalorieGoal: goal });
    }
    navigation.navigate('ApiKey');
  };

  const bmiColor =
    initialResult.bmi < 18.5
      ? theme.color.info
      : initialResult.bmi < 25
        ? theme.color.primary
        : initialResult.bmi < 30
          ? theme.color.warningColor
          : theme.color.errorColor;

  return (
    <KeyboardAvoidingView style={styles.flex} behavior="padding">
      <OnboardingBackButton />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>{t('onboarding.result.title')}</Text>

        <View style={[styles.card, { borderLeftColor: bmiColor }]}>
          <View style={styles.row}>
            <Text style={styles.label}>{t('onboarding.result.bmi')}</Text>
            <Text style={[styles.value, { color: bmiColor }]}>
              {initialResult.bmi}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>
              {t('onboarding.result.obesityLevel')}
            </Text>
            <Text style={[styles.value, { color: bmiColor }]}>
              {t(`onboarding.result.level_${initialResult.level}`)}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>{t('onboarding.result.goal')}</Text>
            <Text style={styles.value}>
              {weightGoal === 'maintain'
                ? t('onboarding.goal.maintain')
                : t('onboarding.result.goalSummary', {
                    goal: t(`onboarding.goal.${weightGoal}`),
                    value: displayPace(goalPaceKgPerMonth, units),
                    unit: t(units === 'imperial' ? 'units.lbs' : 'units.kg'),
                  })}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>
          {t('onboarding.result.dailyCalories')}
        </Text>
        <TextInput
          style={styles.input}
          value={calorieGoal}
          onChangeText={setCalorieGoal}
          keyboardType={
            Platform.OS === 'android' ? 'numeric' : 'numbers-and-punctuation'
          }
          returnKeyType="done"
          placeholderTextColor={theme.color.placeholder}
        />

        <TouchableOpacity style={styles.button} onPress={handleContinue}>
          <Text style={styles.buttonText}>
            {t('onboarding.result.continue')}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const themeStyles = (theme: ITheme) => {
  const styles = StyleSheet.create({
    container: {
      flexGrow: 1,
      paddingHorizontal: 32,
      justifyContent: 'center',
      backgroundColor: theme.color.white,
      paddingVertical: 48,
    },
    flex: {
      flex: 1,
    },
    title: {
      ...theme.fonts.bold6,
      marginBottom: 24,
      color: theme.color.main,
    },
    card: {
      backgroundColor: theme.color.tertiaryDarker,
      borderRadius: 12,
      padding: 20,
      borderLeftWidth: 4,
      marginBottom: 24,
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 8,
    },
    label: {
      ...theme.fonts.regular3,
      color: theme.color.subText,
    },
    value: {
      ...theme.fonts.medium3,
      color: theme.color.main,
    },
    sectionTitle: {
      ...theme.fonts.bold3,
      color: theme.color.main,
      marginBottom: 8,
    },
    input: {
      borderWidth: 1,
      borderColor: theme.color.border,
      borderRadius: 10,
      paddingHorizontal: 16,
      paddingVertical: 14,
      ...theme.fonts.bold4,
      color: theme.color.main,
      textAlign: 'center',
      marginBottom: 32,
    },
    button: {
      backgroundColor: theme.color.primary,
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
    },
    buttonText: {
      color: theme.color.white,
      ...theme.fonts.bold4,
    },
  });
  return styles;
};
