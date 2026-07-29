import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Sex } from '@types';
import { ITheme } from '@theme/theme.interface';
import { useTheme } from '@theme/theme.hook';
import { getMinDailyCalories } from '@utils/calories';

interface Props {
  calories: number;
  sex: Sex;
}

export default function DailyCalorieCard({ calories, sex }: Props) {
  const { t } = useTranslation();
  const styles = useTheme(themeStyles);
  const min = getMinDailyCalories(sex);
  const atMinimum = calories <= min;

  return (
    <View style={styles.card}>
      <Text style={styles.label}>{t('common.dailyCalories')}</Text>
      <Text style={styles.value}>{calories}</Text>
      {atMinimum && (
        <Text style={styles.warning}>
          {t('common.dailyCaloriesMinWarning', { min })}
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
