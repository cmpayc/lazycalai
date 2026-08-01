import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Linking,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { ITheme } from '@theme/theme.interface';
import { useTheme } from '@theme/theme.hook';
import { AIProviderType } from '@types';
import { PROVIDERS } from '@api/shared';
import { LOCKED_PROVIDER } from '@api/providerPolicy';

const isLocked = LOCKED_PROVIDER !== null;

const PROVIDER_CONSOLE_URL: Record<AIProviderType, string> = {
  openai: 'https://platform.openai.com/api-keys',
  claude: 'https://console.anthropic.com/settings/keys',
  gemini: 'https://aistudio.google.com/apikey',
  grok: 'https://console.x.ai',
  qwen: 'https://bailian.console.aliyun.com',
  openrouter: 'https://openrouter.ai/keys',
  demo: '',
};

interface Props {
  provider: AIProviderType;
}

export default function AIGuide({ provider }: Props) {
  const { t } = useTranslation();
  const styles = useTheme(themeStyles);

  const [guideVisible, setGuideVisible] = useState(false);

  const providerLabel =
    PROVIDERS.find((p) => p.key === provider)?.label ?? provider;

  // A locked build accepts free-tier Gemini keys only, so it needs its own
  // steps instead of the general ones.
  const guideKey = isLocked && provider === 'gemini' ? 'gemini_free' : provider;

  return (
    <>
      {!!PROVIDER_CONSOLE_URL[provider] && (
        <TouchableOpacity onPress={() => setGuideVisible(true)}>
          <Text style={styles.getLink}>{t('onboarding.apiKey.howToGet')}</Text>
        </TouchableOpacity>
      )}

      <Modal
        visible={guideVisible}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setGuideVisible(false)}
      >
        <SafeAreaProvider>
          <SafeAreaView style={styles.modalContainer} edges={['top', 'bottom']}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle} numberOfLines={1}>
                {t('onboarding.apiKey.guide.title', {
                  provider: providerLabel,
                })}
              </Text>
              <TouchableOpacity
                onPress={() => setGuideVisible(false)}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalScroll}
              contentContainerStyle={styles.modalScrollContent}
            >
              <Text style={styles.modalIntro}>
                {t('onboarding.apiKey.guide.intro')}
              </Text>
              <Text>
                {t(`onboarding.apiKey.guide.${guideKey}`)
                  .split('**')
                  .map((part, idx) => (
                    <Text
                      // eslint-disable-next-line react/no-array-index-key
                      key={idx}
                      style={
                        idx === 1 ? styles.modalStepsBold : styles.modalSteps
                      }
                    >
                      {part}
                    </Text>
                  ))}
              </Text>

              <TouchableOpacity
                style={styles.linkButton}
                onPress={() => Linking.openURL(PROVIDER_CONSOLE_URL[provider])}
                hitSlop={10}
              >
                <Text style={styles.linkButtonText}>
                  {t('onboarding.apiKey.guide.openLink', {
                    provider: providerLabel,
                  })}
                </Text>
              </TouchableOpacity>
              <Text style={styles.linkUrl} selectable>
                {PROVIDER_CONSOLE_URL[provider]}
              </Text>
            </ScrollView>
          </SafeAreaView>
        </SafeAreaProvider>
      </Modal>
    </>
  );
}

const themeStyles = (theme: ITheme) => {
  const styles = StyleSheet.create({
    getLink: {
      ...theme.fonts.medium2,
      color: theme.color.warningColor,
    },
    modalContainer: {
      flex: 1,
      backgroundColor: theme.color.white,
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 24,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.color.border,
    },
    modalTitle: {
      flex: 1,
      ...theme.fonts.bold5,
      color: theme.color.main,
      marginRight: 16,
    },
    modalClose: {
      ...theme.fonts.bold5,
      color: theme.color.subText,
    },
    modalScroll: {
      flex: 1,
    },
    modalScrollContent: {
      paddingHorizontal: 24,
      paddingVertical: 24,
    },
    modalIntro: {
      ...theme.fonts.regular3,
      color: theme.color.subText,
      lineHeight: 22,
      marginBottom: 20,
    },
    modalSteps: {
      ...theme.fonts.regular3,
      color: theme.color.main,
      lineHeight: 26,
    },
    modalStepsBold: {
      ...theme.fonts.bold3,
      color: theme.color.main,
      lineHeight: 26,
    },
    linkButton: {
      backgroundColor: theme.color.primary,
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
      marginTop: 28,
    },
    linkButtonText: {
      color: theme.color.white,
      ...theme.fonts.bold4,
    },
    linkUrl: {
      ...theme.fonts.regular2,
      color: theme.color.subText,
      textAlign: 'center',
      marginTop: 12,
    },
  });
  return styles;
};
