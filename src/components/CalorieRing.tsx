import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { ITheme } from '@theme/theme.interface';
import { useTheme } from '@theme/theme.hook';
import { useThemeContext } from '@theme/theme.context';

interface Props {
  consumed: number;
  goal: number;
  size?: number;
}

export default function CalorieRing({ consumed, goal, size = 200 }: Props) {
  const { t } = useTranslation();
  const { theme } = useThemeContext();
  const styles = useTheme(themeStyles);
  const radius = (size - 24) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(consumed / goal, 1);
  const strokeDashoffset = circumference * (1 - progress);

  const remaining = Math.max(0, goal - consumed);
  const color = useMemo(() => {
    if (consumed > goal) {
      return theme.color.errorDark;
    }
    if (progress < 0.8) {
      return theme.color.primary;
    }
    if (progress <= 1) {
      return theme.color.warningColor;
    }
    return theme.color.errorColor;
  }, [progress, goal, consumed, theme]);

  return (
    <View style={styles.container}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={theme.color.gray100}
          strokeWidth={12}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={12}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={[styles.center, { width: size, height: size }]}>
        <Text style={[styles.consumed, { color }]}>{consumed}</Text>
        <Text style={styles.unit}>{t('common.kcal')}</Text>
        <Text style={styles.label}>
          {remaining} {t('common.kcal')}
          {'\n'}
          {t('home.remaining')}
        </Text>
      </View>
    </View>
  );
}

const themeStyles = (theme: ITheme) => {
  const styles = StyleSheet.create({
    container: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    center: {
      position: 'absolute',
      alignItems: 'center',
      justifyContent: 'center',
    },
    consumed: {
      fontSize: 36,
      fontWeight: '700',
    },
    unit: {
      ...theme.fonts.regular2,
      color: theme.color.placeholder,
      marginTop: 2,
    },
    label: {
      fontSize: 13,
      color: theme.color.placeholder,
      marginTop: 4,
      width: '90%',
      textAlign: 'center',
    },
  });
  return styles;
};
