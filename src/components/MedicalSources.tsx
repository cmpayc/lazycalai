import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Linking,
  TouchableOpacity,
} from 'react-native';
import { useTranslation } from 'react-i18next';

import { ITheme } from '@theme/theme.interface';
import { useTheme } from '@theme/theme.hook';

/** Public sources for the BMI classification and calorie estimate shown above. */
const BMI_SOURCE_URL =
  'https://www.who.int/news-room/fact-sheets/detail/obesity-and-overweight';
const CALORIE_SOURCE_URL = 'https://pubmed.ncbi.nlm.nih.gov/2305711/';

export default function MedicalSources({
  showBmi = true,
}: {
  /** Hidden when the BMI category is not shown (e.g. users under 20). */
  showBmi?: boolean;
}) {
  const { t } = useTranslation();
  const styles = useTheme(themeStyles);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('onboarding.result.sourcesTitle')}</Text>
      {showBmi && (
        <TouchableOpacity onPress={() => Linking.openURL(BMI_SOURCE_URL)}>
          <Text style={styles.link}>{t('onboarding.result.sourceBmi')}</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity onPress={() => Linking.openURL(CALORIE_SOURCE_URL)}>
        <Text style={styles.link}>{t('onboarding.result.sourceCalories')}</Text>
      </TouchableOpacity>
    </View>
  );
}

const themeStyles = (theme: ITheme) => {
  const styles = StyleSheet.create({
    container: {
      marginBottom: 24,
    },
    title: {
      ...theme.fonts.regular2,
      color: theme.color.subText,
      marginBottom: 6,
    },
    link: {
      ...theme.fonts.regular2,
      color: theme.color.primary,
      textDecorationLine: 'underline',
      paddingVertical: 4,
    },
  });
  return styles;
};
