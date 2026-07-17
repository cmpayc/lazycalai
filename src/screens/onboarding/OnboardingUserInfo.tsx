import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { ITheme } from '@theme/theme.interface';
import { useTheme } from '@theme/theme.hook';
import { useThemeContext } from '@theme/theme.context';
import type { OnboardingStackParamList } from '@navigation/OnboardingStack';
import { useSettingsStore } from '@store/settingsStore';
import { lbsToKg, feetInchesToCm } from '@utils/units';
import OnboardingBackButton from '@components/OnboardingBackButton';
import { Sex } from '@types';

type Nav = StackNavigationProp<OnboardingStackParamList, 'UserInfo'>;

export default function OnboardingUserInfo() {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const updateSettings = useSettingsStore((s) => s.updateSettings);
  const units = useSettingsStore((s) => s.units);
  const styles = useTheme(themeStyles);
  const { theme } = useThemeContext();
  const isImperial = units === 'imperial';
  const [sex, setSex] = useState<Sex>('male');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [feet, setFeet] = useState('');
  const [inches, setInches] = useState('');
  const [age, setAge] = useState('');

  const isDisabled = useMemo(() => {
    const w = parseFloat(weight);
    const h = isImperial ? parseFloat(feet) : parseFloat(height);
    const a = parseInt(age, 10);
    if (!w || !h || !a) return true;
    return false;
  }, [weight, height, feet, isImperial, age]);

  const handleCalculate = () => {
    const w = parseFloat(weight);
    const a = parseInt(age, 10);
    const weightKg = isImperial ? lbsToKg(w) : w;
    const heightCm = isImperial
      ? feetInchesToCm(parseFloat(feet) || 0, parseFloat(inches) || 0)
      : parseFloat(height);
    if (!weightKg || !heightCm || !a) return;

    updateSettings({
      sex,
      weightKg,
      heightCm,
      age: a,
    });
    navigation.navigate('Goal');
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior="padding">
      <OnboardingBackButton />
      <Text style={styles.title}>{t('onboarding.userInfo.title')}</Text>

      <Text style={styles.label}>{t('onboarding.userInfo.sex')}</Text>
      <View style={styles.sexRow}>
        <TouchableOpacity
          style={[styles.sexButton, sex === 'male' && styles.sexActive]}
          onPress={() => setSex('male')}
        >
          <Text
            style={[styles.sexText, sex === 'male' && styles.sexTextActive]}
          >
            {t('onboarding.userInfo.male')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.sexButton, sex === 'female' && styles.sexActive]}
          onPress={() => setSex('female')}
        >
          <Text
            style={[styles.sexText, sex === 'female' && styles.sexTextActive]}
          >
            {t('onboarding.userInfo.female')}
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>{t('onboarding.userInfo.age')}</Text>
      <TextInput
        style={styles.input}
        value={age}
        onChangeText={setAge}
        keyboardType={
          Platform.OS === 'android' ? 'numeric' : 'numbers-and-punctuation'
        }
        returnKeyType="done"
        placeholder="30"
        placeholderTextColor={theme.color.placeholder}
      />

      <Text style={styles.label}>
        {t('onboarding.userInfo.weight')} (
        {t(isImperial ? 'units.lbs' : 'units.kg')})
      </Text>
      <TextInput
        style={styles.input}
        value={weight}
        onChangeText={setWeight}
        keyboardType={
          Platform.OS === 'android' ? 'numeric' : 'numbers-and-punctuation'
        }
        returnKeyType="done"
        placeholder={isImperial ? '154' : '70'}
        placeholderTextColor={theme.color.placeholder}
      />

      <Text style={styles.label}>{t('onboarding.userInfo.height')}</Text>
      {isImperial ? (
        <View style={styles.heightRow}>
          <TextInput
            style={[styles.input, styles.heightInput]}
            value={feet}
            onChangeText={setFeet}
            keyboardType={
              Platform.OS === 'android' ? 'numeric' : 'numbers-and-punctuation'
            }
            returnKeyType="done"
            placeholder={`5 ${t('units.ft')}`}
            placeholderTextColor={theme.color.placeholder}
          />
          <TextInput
            style={[styles.input, styles.heightInput]}
            value={inches}
            onChangeText={setInches}
            keyboardType={
              Platform.OS === 'android' ? 'numeric' : 'numbers-and-punctuation'
            }
            returnKeyType="done"
            placeholder={`7 ${t('units.in')}`}
            placeholderTextColor={theme.color.placeholder}
          />
        </View>
      ) : (
        <TextInput
          style={styles.input}
          value={height}
          onChangeText={setHeight}
          keyboardType={
            Platform.OS === 'android' ? 'numeric' : 'numbers-and-punctuation'
          }
          returnKeyType="done"
          placeholder="170"
          placeholderTextColor={theme.color.placeholder}
        />
      )}

      <TouchableOpacity
        style={[styles.button, isDisabled && styles.buttonDisabled]}
        onPress={handleCalculate}
        disabled={isDisabled}
      >
        <Text style={styles.buttonText}>{t('onboarding.userInfo.next')}</Text>
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
      ...theme.fonts.regular2,
      color: theme.color.subText,
      marginBottom: 8,
      marginTop: 16,
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
    heightRow: {
      flexDirection: 'row',
      gap: 12,
    },
    heightInput: {
      flex: 1,
    },
    sexRow: {
      flexDirection: 'row',
      gap: 12,
    },
    sexButton: {
      flex: 1,
      borderWidth: 1,
      borderColor: theme.color.border,
      borderRadius: 10,
      paddingVertical: 12,
      alignItems: 'center',
    },
    sexActive: {
      backgroundColor: theme.color.primary,
      borderColor: theme.color.primary,
    },
    sexText: {
      ...theme.fonts.regular3,
      color: theme.color.subText,
    },
    sexTextActive: { color: theme.color.white, ...theme.fonts.bold3 },
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
