import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ITheme } from '@theme/theme.interface';
import { useTheme } from '@theme/theme.hook';
import { MIN_DAILY_CALORIES } from '@utils/calories';

interface Props {
  calories: number;
}

export default function DailyCalorieCard({ calories }: Props) {
  const { t } = useTranslation();
  const styles = useTheme(themeStyles);
  const atMinimum = calories <= MIN_DAILY_CALORIES;

  return (
    <View style={styles.card}>
      <Text style={styles.label}>{t('common.dailyCalories')}</Text>
      <Text style={styles.value}>{calories}</Text>
      {atMinimum && (
        <Text style={styles.warning}>
          {t('common.dailyCaloriesMinWarning', { min: MIN_DAILY_CALORIES })}
        </Text>
      )}
    </View>
  );
}

const themeStyles = (theme: ITheme) => {
  const styles = StyleSheet.create({
    card: {
      backgroundColor: theme.color.tertiaryDarker,
      borderRadius: 12,
      padding: 24,
      alignItems: 'center',
      marginTop: 32,
    },
    label: {
      ...theme.fonts.regular3,
      color: theme.color.subText,
      marginBottom: 8,
    },
    value: {
      ...theme.fonts.bold6,
      color: theme.color.primary,
    },
    warning: {
      ...theme.fonts.regular2,
      color: theme.color.warningColor,
      textAlign: 'center',
      marginTop: 12,
    },
  });
  return styles;
};
