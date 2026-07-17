import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import Config from 'react-native-config';

import { ITheme } from '@theme/theme.interface';
import { useTheme } from '@theme/theme.hook';
import { useThemeContext } from '@theme/theme.context';
import { useSettingsStore } from '@store/settingsStore';
import { AIProviderType, PROVIDER_DEFAULT_MODEL } from '@types';
import ModelSelector from '@components/ModelSelector';
import OnboardingBackButton from '@components/OnboardingBackButton';
import { PROVIDERS } from '@api/shared';
import AIGuide from '@components/AIGuide';

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
    oldApiKey ? oldAIProvider : !Config.DEMO_API_URL ? 'openrouter' : 'demo',
  );
  const [model, setModel] = useState(
    oldApiKey
      ? oldModel
      : !Config.DEMO_API_URL
        ? PROVIDER_DEFAULT_MODEL.openrouter
        : PROVIDER_DEFAULT_MODEL.demo,
  );

  const providers = useMemo(() => {
    const allProviders: (typeof PROVIDERS)[] = [];
    for (let i = 0; i < PROVIDERS.length; i += 3) {
      let addProviders = PROVIDERS.slice(i, i + 3);
      if (!Config.DEMO_API_URL) {
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

  const handleFinish = () => {
    if (provider !== 'demo' && !apiKey.trim()) return;
    setOnboardingComplete({
      sex,
      weightKg,
      heightCm,
      age,
      dailyCalorieGoal,
      apiKey: apiKey.trim(),
      aiProvider: provider,
      model,
    });
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior="padding">
      <OnboardingBackButton />
      <Text style={styles.title}>{t('onboarding.apiKey.title')}</Text>

      <Text style={styles.label}>{t('onboarding.apiKey.provider')}</Text>
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

      {provider !== 'demo' && (
        <>
          <View style={styles.labelRow}>
            <Text style={styles.labelInline}>
              {t('onboarding.apiKey.apiKey')}
            </Text>
            <AIGuide provider={provider} />
          </View>
          <TextInput
            style={styles.input}
            value={apiKey}
            onChangeText={setApiKey}
            placeholder={t('onboarding.apiKey.apiKeyPlaceholder')}
            placeholderTextColor={theme.color.placeholder}
            autoCapitalize="none"
            autoCorrect={false}
            secureTextEntry
          />
        </>
      )}

      <TouchableOpacity
        style={[
          styles.button,
          provider !== 'demo' && !apiKey.trim() && styles.buttonDisabled,
        ]}
        onPress={handleFinish}
        disabled={provider !== 'demo' && !apiKey.trim()}
      >
        <Text style={styles.buttonText}>{t('onboarding.apiKey.finish')}</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const themeStyles = (theme: ITheme) => {
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      paddingHorizontal: 32,
      justifyContent: 'center',
      backgroundColor: theme.color.white,
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
    button: {
      backgroundColor: theme.color.primary,
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
      marginTop: 32,
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
