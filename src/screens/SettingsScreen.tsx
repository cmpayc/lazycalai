import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Alert,
  ActivityIndicator,
  Platform,
  Modal,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import {
  pick,
  types,
  keepLocalCopy,
  isErrorWithCode,
  errorCodes,
} from '@react-native-documents/picker';
import DeviceInfo from 'react-native-device-info';

import { useNavigation } from '@react-navigation/native';
import { ITheme } from '@theme/theme.interface';
import { useTheme } from '@theme/theme.hook';
import { useThemeContext } from '@theme/theme.context';
import { useSettingsStore } from '@store/settingsStore';
import { useMealStore } from '@store/mealStore';
import { resetDatabase } from '@db';
import {
  Sex,
  AIProviderType,
  ThemeMode,
  Units,
  WeightGoal,
  PROVIDER_DEFAULT_MODEL,
} from '@types';
import { SUPPORTED_LANGUAGES } from '@i18n';
import {
  kgToLbs,
  lbsToKg,
  cmToFeetInches,
  feetInchesToCm,
  displayPace,
} from '@utils/units';
import { getDeviceId } from '@utils/deviceId';
import ModelSelector from '@components/ModelSelector';
import { useToastStore } from '@store/toastStore';
import { exportMeals, importMeals } from '@utils/exportImport';
import {
  ACTIVITY_LEVELS,
  ADULT_BMI_MIN_AGE,
  calculateBMI,
  getObesityLevel,
} from '@utils/calories';
import { PROVIDERS } from '@api/shared';
import { LOCKED_PROVIDER } from '@api/providerPolicy';
import { DEMO_API_URL } from '@api/demoConfig';
import Disclaimer from '@components/Disclaimer';
import LegalRow from '@components/LegalRow';
import AIGuide from '@components/AIGuide';
import TicTacToe from '@components/TicTacToe';
import MedicalSources from '@components/MedicalSources';

const isLocked = LOCKED_PROVIDER !== null;

export default function SettingsScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const settings = useSettingsStore();
  const styles = useTheme(themeStyles);
  const { theme, setThemeMode } = useThemeContext();
  const {
    sex,
    weightKg,
    heightCm,
    age,
    weightGoal,
    goalPaceKgPerMonth,
    activityFactor,
    dailyCalorieGoal,
    aiProvider,
    model,
    apiKey,
    language,
    themeMode,
    units,
    demoAttempts,
    setLanguage,
    setUnits,
    updateSettings,
    resetOnboarding,
    deleteAllData,
  } = settings;

  const setMeals = useMealStore((s) => s.setMeals);
  const setTodayCalories = useMealStore((s) => s.setTodayCalories);

  const isImperial = units === 'imperial';
  const initialFeetInches = cmToFeetInches(heightCm);

  const [localSex, setLocalSex] = useState<Sex>(sex);
  const [localWeight, setLocalWeight] = useState(
    String(Math.round(isImperial ? kgToLbs(weightKg) : weightKg)),
  );
  const [localHeight, setLocalHeight] = useState(String(heightCm));
  const [localFeet, setLocalFeet] = useState(String(initialFeetInches.feet));
  const [localInches, setLocalInches] = useState(
    String(initialFeetInches.inches),
  );
  const [localAge, setLocalAge] = useState(String(age));
  const [localGoal, setLocalGoal] = useState(String(dailyCalorieGoal));
  const [localProvider, setLocalProvider] =
    useState<AIProviderType>(aiProvider);
  const [localModel, setLocalModel] = useState(model);
  const [localKey, setLocalKey] = useState(apiKey);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [versionTaps, setVersionTaps] = useState(0);
  const [deviceIdVisible, setDeviceIdVisible] = useState(false);
  const [deviceIdTaps, setDeviceIdTaps] = useState(0);
  const [gameVisible, setGameVisible] = useState(false);

  const handleVersionTap = () => {
    const next = versionTaps + 1;
    if (next >= 5) {
      setVersionTaps(0);
      setDeviceIdVisible(true);
    } else {
      setVersionTaps(next);
    }
  };

  const handleDeviceIdTap = () => {
    const next = deviceIdTaps + 1;
    if (next >= 5) {
      setDeviceIdTaps(0);
      setDeviceIdVisible(false);
      setGameVisible(true);
    } else {
      setDeviceIdTaps(next);
    }
  };

  const showToast = useToastStore((s) => s.show);

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

  const derivedKg = isImperial
    ? lbsToKg(parseFloat(localWeight) || 0)
    : parseFloat(localWeight) || 0;
  const derivedCm = isImperial
    ? feetInchesToCm(parseFloat(localFeet) || 0, parseFloat(localInches) || 0)
    : parseFloat(localHeight) || 0;

  const handleSavePersonal = () => {
    updateSettings({
      sex: localSex,
      weightKg: derivedKg || weightKg,
      heightCm: derivedCm || heightCm,
      age: parseInt(localAge, 10) || age,
    });
    showToast(t('settings.saved'));
  };

  const handleUnitsChange = (next: Units) => {
    if (next === units) return;
    const kg = derivedKg;
    const cm = derivedCm;
    setUnits(next);
    if (next === 'imperial') {
      setLocalWeight(kg ? String(Math.round(kgToLbs(kg))) : '');
      const fi = cmToFeetInches(cm);
      setLocalFeet(cm ? String(fi.feet) : '');
      setLocalInches(cm ? String(fi.inches) : '');
    } else {
      setLocalWeight(kg ? String(Math.round(kg)) : '');
      setLocalHeight(cm ? String(Math.round(cm)) : '');
    }
  };

  const handleSaveGoal = () => {
    const goal = parseInt(localGoal, 10);
    if (goal) {
      updateSettings({ dailyCalorieGoal: goal });
      showToast(t('settings.saved'));
    }
  };

  const saveProvider = (key: string) => {
    updateSettings({
      aiProvider: localProvider,
      model: localModel,
      apiKey: key,
    });
    showToast(t('settings.saved'));
  };

  const handleSaveProvider = () => {
    const key = localKey.trim();
    if (key) {
      saveProvider(key);
      return;
    }
    // Clearing the key is a supported choice where the key is the only way to
    // reach the AI, so confirm that manual entry is all that is left.
    if (!isLocked) return;
    Alert.alert(
      t('onboarding.apiKey.skipTitle'),
      t('onboarding.apiKey.skipMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('onboarding.apiKey.skipConfirm'),
          onPress: () => saveProvider(''),
        },
      ],
    );
  };

  const handleProviderChange = (p: AIProviderType) => {
    setLocalProvider(p);
    setLocalModel(PROVIDER_DEFAULT_MODEL[p]);
  };

  const handleReset = () => {
    Alert.alert(
      t('settings.resetConfirmTitle'),
      t('settings.resetConfirmMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('settings.resetConfirmOk'),
          style: 'destructive',
          onPress: () => {
            resetOnboarding();
            navigation.reset({
              index: 0,
              routes: [{ name: 'MainTabs' as never }],
            });
          },
        },
      ],
    );
  };

  const handleDeleteAll = () => {
    Alert.alert(
      t('settings.deleteAllConfirmTitle'),
      t('settings.deleteAllConfirmMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('settings.deleteAllConfirmOk'),
          style: 'destructive',
          onPress: async () => {
            await resetDatabase();
            setMeals([]);
            setTodayCalories(0);
            deleteAllData();
          },
        },
      ],
    );
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const result = await exportMeals();
      Alert.alert(
        result.success ? t('settings.exportSuccess') : t('common.error'),
        result.message,
      );
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async () => {
    try {
      const [file] = await pick({
        type: [types.zip],
      });

      if (!file) {
        return;
      }

      setImporting(true);
      try {
        // Copy to local cache so we get a file:// URI RNFSTurbo can read
        const [copy] = await keepLocalCopy({
          files: [{ uri: file.uri, fileName: file.name ?? 'import.zip' }],
          destination: 'cachesDirectory',
        });

        if (copy.status !== 'success') {
          Alert.alert(t('common.error'), copy.copyError);
          return;
        }

        const result = await importMeals(copy.localUri);
        Alert.alert(
          result.success
            ? t('settings.importSuccess')
            : t('settings.importError'),
          result.message,
        );
      } finally {
        setImporting(false);
      }
    } catch (err: any) {
      if (isErrorWithCode(err) && err.code === errorCodes.OPERATION_CANCELED) {
        return;
      }
      Alert.alert(t('common.error'), err?.message || t('common.unknownError'));
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior="padding">
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('settings.title')}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.personalInfo')}</Text>
          <View style={styles.sexRow}>
            <TouchableOpacity
              style={[styles.sexBtn, localSex === 'male' && styles.sexActive]}
              onPress={() => setLocalSex('male')}
            >
              <Text
                style={[
                  styles.sexText,
                  localSex === 'male' && styles.sexTextActive,
                ]}
              >
                {t('onboarding.userInfo.male')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.sexBtn, localSex === 'female' && styles.sexActive]}
              onPress={() => setLocalSex('female')}
            >
              <Text
                style={[
                  styles.sexText,
                  localSex === 'female' && styles.sexTextActive,
                ]}
              >
                {t('onboarding.userInfo.female')}
              </Text>
            </TouchableOpacity>
          </View>
          <Field
            label={`${t('onboarding.userInfo.weight')} (${t(
              isImperial ? 'units.lbs' : 'units.kg',
            )})`}
            value={localWeight}
            onChange={setLocalWeight}
          />
          {isImperial ? (
            <View style={styles.heightRow}>
              <View style={styles.heightField}>
                <Field
                  label={`${t('onboarding.userInfo.height')} (${t('units.ft')})`}
                  value={localFeet}
                  onChange={setLocalFeet}
                />
              </View>
              <View style={styles.heightField}>
                <Field
                  label={`${t('onboarding.userInfo.height')} (${t('units.in')})`}
                  value={localInches}
                  onChange={setLocalInches}
                />
              </View>
            </View>
          ) : (
            <Field
              label={`${t('onboarding.userInfo.height')} (${t('units.cm')})`}
              value={localHeight}
              onChange={setLocalHeight}
            />
          )}
          <Field
            label={t('onboarding.userInfo.age')}
            value={localAge}
            onChange={setLocalAge}
          />

          <ObesityInfo
            weightKg={derivedKg}
            heightCm={derivedCm}
            age={parseInt(localAge, 10) || age}
            weightGoal={weightGoal}
            goalPaceKgPerMonth={goalPaceKgPerMonth}
            activityFactor={activityFactor}
            units={units}
            t={t}
          />

          <TouchableOpacity style={styles.saveBtn} onPress={handleSavePersonal}>
            <Text style={styles.saveBtnText}>{t('settings.save')}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.calorieGoal')}</Text>
          <Field
            label={t('onboarding.result.dailyCalories')}
            value={localGoal}
            onChange={setLocalGoal}
          />
          <TouchableOpacity style={styles.saveBtn} onPress={handleSaveGoal}>
            <Text style={styles.saveBtnText}>{t('settings.save')}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.aiProvider')}</Text>

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
              <Text style={styles.fieldLabel}>{t('settings.provider')}</Text>
              <View style={styles.providersRows}>
                {providers.map((group, idx) => (
                  // eslint-disable-next-line react/no-array-index-key
                  <View style={styles.providerRow} key={idx}>
                    {group.map((p) => (
                      <TouchableOpacity
                        key={p.key}
                        style={[
                          styles.providerBtn,
                          localProvider === p.key && styles.providerBtnActive,
                        ]}
                        onPress={() => handleProviderChange(p.key)}
                      >
                        <Text
                          style={[
                            styles.providerBtnText,
                            localProvider === p.key &&
                              styles.providerBtnTextActive,
                          ]}
                        >
                          {p.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                ))}
              </View>

              <Text style={styles.modelLabel}>{t('settings.model')}</Text>
              <ModelSelector
                provider={localProvider}
                value={localModel}
                demoAttempts={demoAttempts}
                onChange={setLocalModel}
              />
            </>
          )}
          {localProvider !== 'demo' && (
            <View style={styles.field}>
              <View style={styles.labelRow}>
                <Text style={styles.fieldLabel}>
                  {isLocked
                    ? t('onboarding.apiKey.freeKeyLabel')
                    : t('onboarding.apiKey.apiKey')}
                </Text>
                <AIGuide provider={localProvider} />
              </View>
              <TextInput
                style={styles.fieldInput}
                value={localKey}
                onChangeText={setLocalKey}
                autoCapitalize="none"
                autoCorrect={false}
                secureTextEntry
                placeholder={
                  isLocked
                    ? t('onboarding.apiKey.freeKeyPlaceholder')
                    : undefined
                }
                placeholderTextColor={theme.color.placeholder}
              />
              {isLocked && (
                <Text style={styles.hint}>
                  {localKey.trim()
                    ? t('onboarding.apiKey.freeTierHint')
                    : t('onboarding.apiKey.noKeyNotice')}
                </Text>
              )}
            </View>
          )}
          <TouchableOpacity style={styles.saveBtn} onPress={handleSaveProvider}>
            <Text style={styles.saveBtnText}>{t('settings.save')}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.language')}</Text>
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
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.units')}</Text>
          <View style={styles.languageRow}>
            {(['metric', 'imperial'] as Units[]).map((u) => (
              <TouchableOpacity
                key={u}
                style={[styles.langBtn, units === u && styles.langBtnActive]}
                onPress={() => handleUnitsChange(u)}
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
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.theme')}</Text>
          <View style={styles.languageRow}>
            {(['light', 'dark'] as ThemeMode[]).map((mode) => (
              <TouchableOpacity
                key={mode}
                style={[
                  styles.langBtn,
                  themeMode === mode && styles.langBtnActive,
                ]}
                onPress={() => setThemeMode(mode)}
              >
                <Text
                  style={[
                    styles.langBtnText,
                    themeMode === mode && styles.langBtnTextActive,
                  ]}
                >
                  {t(`settings.theme${mode === 'light' ? 'Light' : 'Dark'}`)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.exportData')}</Text>
          <View style={styles.exportImportRow}>
            <TouchableOpacity
              style={[styles.exportBtn, exporting && styles.btnDisabled]}
              onPress={handleExport}
              disabled={exporting || importing}
            >
              {exporting ? (
                <ActivityIndicator size="small" color={theme.color.white} />
              ) : (
                <Text style={styles.exportBtnText}>
                  {t('settings.exportData')}
                </Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.importBtn, importing && styles.btnDisabled]}
              onPress={handleImport}
              disabled={exporting || importing}
            >
              {importing ? (
                <ActivityIndicator size="small" color={theme.color.white} />
              ) : (
                <Text style={styles.importBtnText}>
                  {t('settings.importData')}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <Disclaimer />

        <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
          <Text style={styles.resetText}>{t('settings.resetOnboarding')}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.deleteAllBtn} onPress={handleDeleteAll}>
          <Text style={styles.deleteAllText}>
            {t('settings.deleteAllData')}
          </Text>
        </TouchableOpacity>

        <LegalRow />

        <TouchableOpacity
          activeOpacity={1}
          onPress={handleVersionTap}
          hitSlop={10}
        >
          <Text style={styles.versionText}>v{DeviceInfo.getVersion()}</Text>
        </TouchableOpacity>

        <Modal
          visible={deviceIdVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setDeviceIdVisible(false)}
        >
          <View style={styles.deviceIdOverlay}>
            <View style={styles.deviceIdCard}>
              <Text style={styles.deviceIdTitle}>
                {t('settings.deviceIdTitle')}
              </Text>
              <TouchableOpacity
                activeOpacity={1}
                onPress={handleDeviceIdTap}
                hitSlop={10}
              >
                <Text style={styles.deviceIdValue} selectable>
                  {getDeviceId()}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deviceIdClose}
                onPress={() => setDeviceIdVisible(false)}
              >
                <Text style={styles.deviceIdCloseText}>
                  {t('settings.deviceIdClose')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <TicTacToe
          visible={gameVisible}
          onClose={() => setGameVisible(false)}
        />

        <View style={styles.paddingBlock} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const fieldStyles = useTheme(themeStyles);
  const { theme: fieldTheme } = useThemeContext();
  return (
    <View style={fieldStyles.field}>
      <Text style={fieldStyles.fieldLabel}>{label}</Text>
      <TextInput
        style={fieldStyles.fieldInput}
        value={value}
        onChangeText={onChange}
        keyboardType={
          Platform.OS === 'android' ? 'numeric' : 'numbers-and-punctuation'
        }
        returnKeyType="done"
        placeholderTextColor={fieldTheme.color.placeholder}
      />
    </View>
  );
}

function ObesityInfo({
  weightKg,
  heightCm,
  age,
  weightGoal,
  goalPaceKgPerMonth,
  activityFactor,
  units,
  t,
}: {
  weightKg: number;
  heightCm: number;
  age: number;
  weightGoal: WeightGoal;
  goalPaceKgPerMonth: number;
  activityFactor: number;
  units: Units;
  t: TFunction;
}) {
  const obesityStyles = useTheme(themeStyles);
  const { theme: obesityTheme } = useThemeContext();

  if (!weightKg || !heightCm) {
    return null;
  }

  const bmi = calculateBMI(weightKg, heightCm);
  const level = getObesityLevel(bmi);
  const showBmi = age >= ADULT_BMI_MIN_AGE;
  const activityLevel =
    ACTIVITY_LEVELS.find((l) => l.factor === activityFactor) ??
    ACTIVITY_LEVELS[0];

  const bmiColor = !showBmi
    ? obesityTheme.color.primary
    : bmi < 18.5
      ? obesityTheme.color.info
      : bmi < 25
        ? obesityTheme.color.primary
        : bmi < 30
          ? obesityTheme.color.warningColor
          : obesityTheme.color.errorColor;

  return (
    <>
      <View style={obesityStyles.obesityCard}>
        {showBmi ? (
          <>
            <View style={obesityStyles.obesityRow}>
              <Text style={obesityStyles.obesityLabel}>
                {t('onboarding.result.bmi')}
              </Text>
              <Text style={[obesityStyles.obesityValue, { color: bmiColor }]}>
                {bmi}
              </Text>
            </View>
            <View style={obesityStyles.obesityRow}>
              <Text style={obesityStyles.obesityLabel}>
                {t('onboarding.result.obesityLevel')}
              </Text>
              <Text style={[obesityStyles.obesityValue, { color: bmiColor }]}>
                {t(`onboarding.result.level_${level}`)}
              </Text>
            </View>
          </>
        ) : (
          <Text style={obesityStyles.obesityNote}>
            {t('onboarding.result.bmiAgeNote')}
          </Text>
        )}
        <View style={obesityStyles.obesityRow}>
          <Text style={obesityStyles.obesityLabel}>
            {t('onboarding.result.goal')}
          </Text>
          <Text
            style={[
              obesityStyles.obesityValue,
              { color: obesityTheme.color.main },
            ]}
          >
            {weightGoal === 'maintain'
              ? t('onboarding.goal.maintain')
              : t('onboarding.result.goalSummary', {
                  goal: t(`onboarding.goal.${weightGoal}`),
                  value: displayPace(goalPaceKgPerMonth, units),
                  unit: t(units === 'imperial' ? 'units.lbs' : 'units.kg'),
                })}
          </Text>
        </View>
        <View style={obesityStyles.obesityRow}>
          <Text style={obesityStyles.obesityLabel}>
            {t('onboarding.result.activity')}
          </Text>
          <Text
            style={[
              obesityStyles.obesityValue,
              { color: obesityTheme.color.main },
            ]}
          >
            {t(`onboarding.activity.level_${activityLevel.key}`)}
          </Text>
        </View>
      </View>
      <MedicalSources showBmi={showBmi} />
    </>
  );
}

const themeStyles = (theme: ITheme) => {
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.color.background,
    },
    flex: {
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingTop: 56,
      paddingBottom: 16,
    },
    title: {
      ...theme.fonts.bold5,
      color: theme.color.main,
    },
    section: {
      backgroundColor: theme.color.white,
      marginHorizontal: 16,
      marginBottom: 16,
      borderRadius: 12,
      padding: 16,
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
    sectionTitle: {
      ...theme.fonts.bold3,
      color: theme.color.main,
      marginBottom: 12,
    },
    field: {
      marginBottom: 12,
    },
    fieldLabel: {
      ...theme.fonts.regular1,
      color: theme.color.subText,
      marginBottom: 4,
    },
    labelRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      marginBottom: 8,
      marginTop: 16,
    },
    modelLabel: {
      ...theme.fonts.regular1,
      color: theme.color.subText,
      marginBottom: 4,
      marginTop: 12,
    },
    fieldInput: {
      borderWidth: 1,
      borderColor: theme.color.border,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      ...theme.fonts.regular3,
      color: theme.color.main,
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
      borderRadius: 8,
      paddingVertical: 10,
      alignItems: 'center',
    },
    providerBtnActive: {
      backgroundColor: theme.color.primary,
      borderColor: theme.color.primary,
    },
    providerBtnText: {
      ...theme.fonts.regular3,
      color: theme.color.subText,
    },
    providerBtnTextActive: {
      color: theme.color.white,
      ...theme.fonts.medium3,
    },
    heightRow: {
      flexDirection: 'row',
      gap: 10,
    },
    heightField: {
      flex: 1,
    },
    sexRow: {
      flexDirection: 'row',
      gap: 10,
      marginBottom: 12,
    },
    sexBtn: {
      flex: 1,
      borderWidth: 1,
      borderColor: theme.color.border,
      borderRadius: 8,
      paddingVertical: 10,
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
    sexTextActive: {
      color: theme.color.white,
      ...theme.fonts.medium3,
    },
    saveBtn: {
      backgroundColor: theme.color.primary,
      paddingVertical: 10,
      borderRadius: 8,
      alignItems: 'center',
      marginTop: 4,
    },
    saveBtnText: {
      color: theme.color.white,
      ...theme.fonts.medium3,
    },
    obesityCard: {
      backgroundColor: theme.color.tertiaryDarker,
      borderRadius: 10,
      padding: 14,
      marginBottom: 12,
    },
    obesityRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 4,
    },
    obesityLabel: {
      ...theme.fonts.regular2,
      color: theme.color.subText,
    },
    obesityValue: {
      ...theme.fonts.medium2,
    },
    obesityNote: {
      ...theme.fonts.regular2,
      color: theme.color.subText,
      paddingVertical: 8,
    },
    exportImportRow: {
      flexDirection: 'row',
      gap: 10,
    },
    exportBtn: {
      flex: 1,
      backgroundColor: theme.color.info,
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 44,
    },
    exportBtnText: {
      color: theme.color.white,
      ...theme.fonts.medium3,
    },
    importBtn: {
      flex: 1,
      backgroundColor: theme.color.primary,
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 44,
    },
    importBtnText: {
      color: theme.color.white,
      ...theme.fonts.medium3,
    },
    btnDisabled: {
      opacity: 0.6,
    },
    languageRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
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
    resetBtn: {
      marginHorizontal: 16,
      marginTop: 24,
      marginBottom: 16,
      paddingVertical: 14,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: theme.color.errorColor,
      alignItems: 'center',
    },
    resetText: {
      color: theme.color.errorColor,
      ...theme.fonts.medium3,
    },
    deleteAllBtn: {
      marginHorizontal: 16,
      marginBottom: 16,
      paddingVertical: 14,
      borderRadius: 10,
      backgroundColor: theme.color.errorColor,
      alignItems: 'center',
    },
    deleteAllText: {
      color: theme.color.white,
      ...theme.fonts.medium3,
    },
    deviceIdOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 32,
    },
    deviceIdCard: {
      width: '100%',
      backgroundColor: theme.color.background,
      borderRadius: 12,
      padding: 20,
      borderWidth: 1,
      borderColor: theme.color.border,
    },
    deviceIdTitle: {
      ...theme.fonts.medium3,
      color: theme.color.main,
      marginBottom: 12,
    },
    deviceIdValue: {
      ...theme.fonts.regular2,
      color: theme.color.subText,
      marginBottom: 20,
    },
    deviceIdClose: {
      alignSelf: 'flex-end',
    },
    deviceIdCloseText: {
      ...theme.fonts.medium3,
      color: theme.color.primary,
    },
    versionText: {
      ...theme.fonts.regular1,
      color: theme.color.placeholder,
      textAlign: 'center',
      marginTop: 16,
    },
    paddingBlock: {
      paddingBottom: 32,
    },
  });
  return styles;
};
