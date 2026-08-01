import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Modal,
  Pressable,
  ScrollView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { ITheme } from '@theme/theme.interface';
import { useTheme } from '@theme/theme.hook';
import { useSettingsStore } from '@store/settingsStore';
import type { OnboardingStackParamList } from '@navigation/OnboardingStack';
import { SUPPORTED_LANGUAGES } from '@i18n';
import { Units } from '@types';
import Disclaimer from '@components/Disclaimer';
import LogoLight from '@assets/LogoLight.png';
import LogoDark from '@assets/LogoDark.png';
import LegalRow from '@components/LegalRow';
import { DEMO_API_URL } from '@api/demoConfig';

type Nav = StackNavigationProp<OnboardingStackParamList, 'Welcome'>;

export default function OnboardingWelcome() {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const styles = useTheme(themeStyles);
  const themeMode = useSettingsStore((s) => s.themeMode);
  const language = useSettingsStore((s) => s.language);
  const setLanguage = useSettingsStore((s) => s.setLanguage);
  const units = useSettingsStore((s) => s.units);
  const setUnits = useSettingsStore((s) => s.setUnits);
  const [showDemoNotice, setShowDemoNotice] = useState(false);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.flex}>
        <View style={styles.content}>
          <Image
            source={themeMode === 'dark' ? LogoDark : LogoLight}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.subtitle}>
            {t('onboarding.welcome.subtitle')}
          </Text>
          {!!DEMO_API_URL && (
            <TouchableOpacity
              style={styles.demoNotice}
              onPress={() => setShowDemoNotice(true)}
              hitSlop={10}
            >
              <Text style={styles.demoLink}>
                {t('onboarding.welcome.demoModeTitle')}
              </Text>
            </TouchableOpacity>
          )}
          <View style={styles.languageRow}>
            {SUPPORTED_LANGUAGES.map((lang) => (
              <TouchableOpacity
                key={lang}
                style={[
                  styles.langBtn,
                  language === lang && styles.langBtnActive,
                ]}
                onPress={() => setLanguage(lang)}
              >
                <Text
                  style={[
                    styles.langBtnText,
                    language === lang && styles.langBtnTextActive,
                  ]}
                >
                  {t(`languages.${lang}`)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.unitsRow}>
            {(['metric', 'imperial'] as Units[]).map((u) => (
              <TouchableOpacity
                key={u}
                style={[styles.langBtn, units === u && styles.langBtnActive]}
                onPress={() => setUnits(u)}
              >
                <Text
                  style={[
                    styles.langBtnText,
                    units === u && styles.langBtnTextActive,
                  ]}
                >
                  {t(`units.${u}`)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <LegalRow />
          <Disclaimer />
        </View>
      </ScrollView>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('UserInfo')}
        >
          <Text style={styles.buttonText}>
            {t('onboarding.welcome.getStarted')}
          </Text>
        </TouchableOpacity>
      </View>

      <Modal
        transparent
        visible={showDemoNotice}
        animationType="fade"
        onRequestClose={() => setShowDemoNotice(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setShowDemoNotice(false)}
        >
          <Pressable style={styles.modalBody}>
            <Text style={styles.modalTitle}>
              {t('onboarding.welcome.demoModeTitle')}
            </Text>
            <Text style={styles.modalText}>
              {t('onboarding.welcome.apiKeyNotice')}
            </Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setShowDemoNotice(false)}
            >
              <Text style={styles.modalButtonText}>{t('common.ok')}</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const themeStyles = (theme: ITheme) => {
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.color.white,
    },
    flex: {
      flex: 1,
      paddingHorizontal: 32,
    },
    content: {
      flex: 1,
      alignItems: 'center',
      paddingTop: 100,
      paddingBottom: 100,
    },
    logo: {
      width: 200,
      height: 66.6,
      marginBottom: 16,
    },
    title: {
      ...theme.fonts.bold7,
      color: theme.color.main,
      marginBottom: 16,
    },
    subtitle: {
      ...theme.fonts.regular3,
      color: theme.color.subText,
      textAlign: 'center',
      lineHeight: 24,
    },
    demoNotice: {
      marginTop: 32,
      alignItems: 'center',
    },
    demoLink: {
      ...theme.fonts.medium2,
      color: theme.color.warningColor,
      textAlign: 'center',
      textTransform: 'uppercase',
    },
    modalBackdrop: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 32,
      backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalBody: {
      width: '100%',
      backgroundColor: theme.color.white,
      borderRadius: 16,
      padding: 24,
    },
    modalTitle: {
      ...theme.fonts.bold4,
      color: theme.color.main,
      marginBottom: 12,
    },
    modalText: {
      ...theme.fonts.regular2,
      color: theme.color.subText,
      lineHeight: 22,
    },
    modalButton: {
      alignSelf: 'flex-end',
      marginTop: 20,
      paddingVertical: 8,
      paddingHorizontal: 12,
    },
    modalButtonText: {
      ...theme.fonts.bold3,
      color: theme.color.primary,
    },
    languageRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: 8,
      marginTop: 24,
    },
    unitsRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 8,
      marginTop: 12,
      marginBottom: 32,
    },
    langBtn: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.color.border,
      backgroundColor: theme.color.white,
    },
    langBtnActive: {
      backgroundColor: theme.color.primary,
      borderColor: theme.color.primary,
    },
    langBtnText: {
      ...theme.fonts.regular2,
      color: theme.color.subText,
    },
    langBtnTextActive: {
      color: theme.color.white,
      ...theme.fonts.medium2,
    },
    buttonContainer: {
      position: 'absolute',
      bottom: 0,
      width: '100%',
      paddingHorizontal: 32,
      backgroundColor: theme.color.white,
    },
    button: {
      width: '100%',
      backgroundColor: theme.color.primary,
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
      marginBottom: 48,
    },
    buttonText: {
      color: theme.color.white,
      ...theme.fonts.bold4,
    },
    paddingBottom: {
      paddingBottom: 100,
    },
  });
  return styles;
};
