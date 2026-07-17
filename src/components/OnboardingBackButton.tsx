import React from 'react';
import { Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import { ITheme } from '@theme/theme.interface';
import { useTheme } from '@theme/theme.hook';

export default function OnboardingBackButton() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const styles = useTheme(themeStyles);

  return (
    <TouchableOpacity
      style={[styles.button, { top: insets.top + 8 }]}
      onPress={() => navigation.goBack()}
      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      accessibilityRole="button"
      accessibilityLabel={t('common.back')}
    >
      <Text style={styles.icon}>‹</Text>
    </TouchableOpacity>
  );
}

const themeStyles = (theme: ITheme) => {
  const styles = StyleSheet.create({
    button: {
      position: 'absolute',
      left: 16,
      zIndex: 1,
      paddingHorizontal: 8,
    },
    icon: {
      ...theme.fonts.bold7,
      color: theme.color.main,
    },
  });
  return styles;
};
