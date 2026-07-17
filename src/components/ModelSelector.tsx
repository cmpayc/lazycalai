import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { AIProviderType, PROVIDER_MODELS } from '@types';
import { ITheme } from '@theme/theme.interface';
import { useTheme } from '@theme/theme.hook';
import { useThemeContext } from '@theme/theme.context';

interface ModelSelectorProps {
  provider: AIProviderType;
  value: string;
  demoAttempts: number;
  onChange: (model: string) => void;
}

export default function ModelSelector({
  provider,
  value,
  demoAttempts,
  onChange,
}: ModelSelectorProps) {
  const { t } = useTranslation();
  const presets = PROVIDER_MODELS[provider];
  const isCustom = !presets.includes(value);
  const [customValue, setCustomValue] = useState(isCustom ? value : '');
  const styles = useTheme(themeStyles);
  const { theme } = useThemeContext();

  const handleSelectPreset = (model: string) => {
    onChange(model);
  };

  const handleSelectCustom = () => {
    if (!isCustom) {
      onChange(customValue);
    }
  };

  const handleCustomChange = (text: string) => {
    setCustomValue(text);
    onChange(text);
  };

  return (
    <View style={styles.container}>
      <View style={styles.presetRow}>
        {provider === 'demo' ? (
          <TouchableOpacity
            style={[
              styles.modelBtn,
              styles.modelBtnActive,
              styles.modelBtnFull,
            ]}
          >
            <Text style={[styles.modelBtnText, styles.modelBtnTextActive]}>
              {t('modelSelector.demoMode', { num: demoAttempts })}
            </Text>
          </TouchableOpacity>
        ) : (
          <>
            {presets.map((model) => (
              <TouchableOpacity
                key={model}
                style={[
                  styles.modelBtn,
                  value === model && styles.modelBtnActive,
                ]}
                onPress={() => handleSelectPreset(model)}
              >
                <Text
                  style={[
                    styles.modelBtnText,
                    value === model && styles.modelBtnTextActive,
                  ]}
                >
                  {model}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[styles.modelBtn, isCustom && styles.modelBtnActive]}
              onPress={handleSelectCustom}
            >
              <Text
                style={[
                  styles.modelBtnText,
                  isCustom && styles.modelBtnTextActive,
                ]}
              >
                {t('modelSelector.custom')}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>
      {isCustom && (
        <TextInput
          style={styles.customInput}
          value={customValue}
          onChangeText={handleCustomChange}
          placeholder="Enter model ID"
          placeholderTextColor={theme.color.placeholder}
          autoCapitalize="none"
          autoCorrect={false}
        />
      )}
    </View>
  );
}

const themeStyles = (theme: ITheme) => {
  const styles = StyleSheet.create({
    container: {
      marginTop: 4,
      marginBottom: 16,
    },
    presetRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    modelBtn: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.color.border,
      backgroundColor: theme.color.white,
      alignItems: 'center',
      justifyContent: 'center',
      maxWidth: '75%',
    },
    modelBtnActive: {
      backgroundColor: theme.color.primary,
      borderColor: theme.color.primary,
    },
    modelBtnFull: {
      maxWidth: '100%',
    },
    modelBtnText: {
      ...theme.fonts.medium2,
      color: theme.color.subText,
      textAlign: 'center',
    },
    modelBtnTextActive: {
      color: theme.color.white,
      ...theme.fonts.medium2,
    },
    customInput: {
      marginTop: 10,
      borderWidth: 1,
      borderColor: theme.color.border,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      ...theme.fonts.regular3,
      color: theme.color.main,
    },
  });
  return styles;
};
