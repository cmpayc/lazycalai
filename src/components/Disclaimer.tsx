import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ITheme } from '@theme/theme.interface';
import { useTheme } from '@theme/theme.hook';

export default function Disclaimer() {
  const { t } = useTranslation();
  const styles = useTheme(themeStyles);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>{t('common.disclaimer')}</Text>
    </View>
  );
}

const themeStyles = (theme: ITheme) => {
  const styles = StyleSheet.create({
    container: {
      paddingHorizontal: 16,
      paddingVertical: 16,
      alignItems: 'center',
    },
    text: {
      ...theme.fonts.regular1,
      color: theme.color.placeholder,
      textAlign: 'center',
      lineHeight: 18,
    },
  });
  return styles;
};
