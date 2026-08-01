import React, { useMemo, useState } from 'react';
import {
  Alert,
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import { useTranslation } from 'react-i18next';

import { ITheme } from '@theme/theme.interface';
import { useTheme } from '@theme/theme.hook';
import { useThemeContext } from '@theme/theme.context';
import { useSettingsStore } from '@store/settingsStore';
import { AIProviderType, PROVIDER_DEFAULT_MODEL } from '@types';
import ModelSelector from '@components/ModelSelector';
import OnboardingBackButton from '@components/OnboardingBackButton';
import { PROVIDERS } from '@api/shared';
import { LOCKED_MODEL, LOCKED_PROVIDER } from '@api/providerPolicy';
import { DEMO_API_URL } from '@api/demoConfig';
import AIGuide from '@components/AIGuide';

const isLocked = LOCKED_PROVIDER !== null;

export default function OnboardingApiKey() {
  const { t } = useTranslation();
  const setOnboardingComplete = useSettingsStore(
    (s) => s.setOnboardingComplete,
  );
  const {
    sex,
    weightKg,
    heightCm,
    age,
    dailyCalorieGoal,
    demoAttempts,
    aiProvider: oldAIProvider,
    apiKey: oldApiKey,
    model: oldModel,
  } = useSettingsStore();
  const styles = useTheme(themeStyles);
  const { theme } = useThemeContext();
  const [apiKey, setApiKey] = useState(oldApiKey || '');
  const [provider, setProvider] = useState<AIProviderType>(
    LOCKED_PROVIDER ??
      (oldApiKey ? oldAIProvider : !DEMO_API_URL ? 'openrouter' : 'demo'),
  );
  const [model, setModel] = useState(
    LOCKED_MODEL ??
      (oldApiKey
        ? oldModel
        : !DEMO_API_URL
          ? PROVIDER_DEFAULT_MODEL.openrouter
          : PROVIDER_DEFAULT_MODEL.demo),
  );

  const providers = useMemo(() => {
    const allProviders: (typeof PROVIDERS)[] = [];
    for (let i = 0; i < PROVIDERS.length; i += 3) {
      let addProviders = PROVIDERS.slice(i, i + 3);
      if (!DEMO_API_URL) {
        addProviders = addProviders.filter((p) => p.key !== 'demo');
      }
      allProviders.push(addProviders);
    }
    return allProviders;
  }, []);

  const handleProviderChange = (p: AIProviderType) => {
    setProvider(p);
    setModel(PROVIDER_DEFAULT_MODEL[p]);
  };

  const complete = (key: string) => {
    setOnboardingComplete({
      sex,
      weightKg,
      heightCm,
      age,
      dailyCalorieGoal,
      apiKey: key,
      aiProvider: provider,
      model,
    });
  };

  const handleFinish = () => {
    const key = apiKey.trim();
    if (key) {
      complete(key);
      return;
    }
    if (isLocked) {
      Alert.alert(
        t('onboarding.apiKey.skipTitle'),
        t('onboarding.apiKey.skipMessage'),
        [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('onboarding.apiKey.skipConfirm'),
            onPress: () => complete(''),
          },
        ],
      );
      return;
    }
    if (provider === 'demo') complete('');
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior="padding">
      <OnboardingBackButton />
      <ScrollView style={styles.flex}>
        <View style={styles.content}>
          <Text style={styles.title}>{t('onboarding.apiKey.title')}</Text>

          {isLocked ? (
            <View style={styles.notice}>
              <Text style={styles.noticeTitle}>
                {t('onboarding.apiKey.freeTierTitle')}
              </Text>
              <Text style={styles.noticeText}>
                {t('onboarding.apiKey.freeTierBody')}
              </Text>
              <Text style={styles.noticeStrong}>
                {t('onboarding.apiKey.freeTierPaidBlocked')}
              </Text>
            </View>
          ) : (
            <>
              <Text style={styles.label}>
                {t('onboarding.apiKey.provider')}
              </Text>
              <View style={styles.providersRows}>
                {providers.map((group, idx) => (
                  // eslint-disable-next-line react/no-array-index-key
                  <View style={styles.providerRow} key={idx}>
                    {group.map((p) => (
                      <TouchableOpacity
                        key={p.key}
                        style={[
                          styles.providerBtn,
                          provider === p.key && styles.providerBtnActive,
                        ]}
                        onPress={() => handleProviderChange(p.key)}
                      >
                        <Text
                          style={[
                            styles.providerBtnText,
                            provider === p.key && styles.providerBtnTextActive,
                          ]}
                          numberOfLines={1}
                        >
                          {p.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                ))}
              </View>

              <Text style={styles.label}>{t('onboarding.apiKey.model')}</Text>
              <ModelSelector
                provider={provider}
                value={model}
                demoAttempts={demoAttempts}
                onChange={setModel}
              />
            </>
          )}

          {provider !== 'demo' && (
            <>
              <View style={styles.labelRow}>
                <Text style={styles.labelInline}>
                  {isLocked
                    ? t('onboarding.apiKey.freeKeyLabel')
                    : t('onboarding.apiKey.apiKey')}
                </Text>
                <AIGuide provider={provider} />
              </View>
              <TextInput
                style={styles.input}
                value={apiKey}
                onChangeText={setApiKey}
                placeholder={
                  isLocked
                    ? t('onboarding.apiKey.freeKeyPlaceholder')
                    : t('onboarding.apiKey.apiKeyPlaceholder')
                }
                placeholderTextColor={theme.color.placeholder}
                autoCapitalize="none"
                autoCorrect={false}
                secureTextEntry
              />
              {isLocked && (
                <Text style={styles.hint}>
                  {apiKey.trim()
                    ? t('onboarding.apiKey.freeTierHint')
                    : t('onboarding.apiKey.noKeyNotice')}
                </Text>
              )}
            </>
          )}
        </View>
      </ScrollView>
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.button,
            !isLocked &&
              provider !== 'demo' &&
              !apiKey.trim() &&
              styles.buttonDisabled,
          ]}
          onPress={handleFinish}
          disabled={!isLocked && provider !== 'demo' && !apiKey.trim()}
        >
          <Text style={styles.buttonText}>
            {isLocked && !apiKey.trim()
              ? t('onboarding.apiKey.skipConfirm')
              : t('onboarding.apiKey.finish')}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
      paddingTop: 100,
      paddingBottom: 130,
    },
    title: {
      ...theme.fonts.bold6,
      marginBottom: 32,
      color: theme.color.main,
    },
    label: {
      ...theme.fonts.bold2,
      color: theme.color.subText,
      marginBottom: 8,
      marginTop: 16,
    },
    labelRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      marginBottom: 8,
      marginTop: 16,
    },
    labelInline: {
      ...theme.fonts.bold2,
      color: theme.color.subText,
    },
    notice: {
      borderWidth: 1,
      borderColor: theme.color.warningColor,
      borderRadius: 12,
      padding: 16,
      gap: 8,
    },
    noticeTitle: {
      ...theme.fonts.bold3,
      color: theme.color.main,
    },
    noticeText: {
      ...theme.fonts.regular3,
      color: theme.color.subText,
    },
    noticeStrong: {
      ...theme.fonts.bold2,
      color: theme.color.warningColor,
    },
    hint: {
      ...theme.fonts.regular2,
      color: theme.color.subText,
      marginTop: 8,
    },
    providersRows: {
      gap: 8,
    },
    providerRow: {
      flexDirection: 'row',
      gap: 8,
    },
    providerBtn: {
      flex: 1,
      borderWidth: 1,
      borderColor: theme.color.border,
      borderRadius: 10,
      paddingVertical: 12,
      alignItems: 'center',
    },
    providerBtnActive: {
      backgroundColor: theme.color.primary,
      borderColor: theme.color.primary,
    },
    providerBtnText: {
      ...theme.fonts.medium3,
      color: theme.color.subText,
    },
    providerBtnTextActive: {
      color: theme.color.white,
      ...theme.fonts.bold3,
    },
    input: {
      borderWidth: 1,
      borderColor: theme.color.border,
      borderRadius: 10,
      paddingHorizontal: 16,
      paddingVertical: 12,
      ...theme.fonts.regular3,
      color: theme.color.main,
    },
    buttonContainer: {
      position: 'absolute',
      bottom: 0,
      width: '100%',
      paddingHorizontal: 32,
      backgroundColor: theme.color.white,
    },
    button: {
      backgroundColor: theme.color.primary,
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
      marginBottom: 48,
    },
    buttonDisabled: {
      opacity: 0.5,
    },
    buttonText: {
      color: theme.color.white,
      ...theme.fonts.bold4,
    },
  });
  return styles;
};
