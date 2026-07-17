import React from 'react';
import {
  Text,
  StyleSheet,
  View,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import Config from 'react-native-config';

import { ITheme } from '@theme/theme.interface';
import { useTheme } from '@theme/theme.hook';

export default function LegalRow() {
  const { t } = useTranslation();
  const styles = useTheme(themeStyles);

  return (
    <View style={styles.legalRow}>
      {!!Config.PRIVACY_URL && (
        <TouchableOpacity
          onPress={() => Linking.openURL(Config.PRIVACY_URL ?? '')}
          hitSlop={10}
        >
          <Text style={styles.legalLink}>
            {t('onboarding.welcome.privacyPolicy')}
          </Text>
        </TouchableOpacity>
      )}
      {!!Config.TERMS_URL && (
        <TouchableOpacity
          onPress={() => Linking.openURL(Config.TERMS_URL ?? '')}
          hitSlop={10}
        >
          <Text style={styles.legalLink}>
            {t('onboarding.welcome.termsOfService')}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const themeStyles = (theme: ITheme) => {
  const styles = StyleSheet.create({
    legalRow: {
      alignItems: 'center',
      justifyContent: 'center',
      gap: 16,
      marginTop: 24,
    },
    legalLink: {
      ...theme.fonts.regular2,
      color: theme.color.primary,
    },
  });
  return styles;
};
