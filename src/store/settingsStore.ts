import { create } from 'zustand';
import { MMKV } from 'react-native-mmkv';

import { getDeviceLanguage, changeLanguage } from '@i18n';
import { getDeviceUnits } from '@utils/units';
import { DEFAULT_ACTIVITY_FACTOR } from '@utils/calories';
import {
  UserSettings,
  AIProviderType,
  Sex,
  Language,
  ThemeMode,
  Units,
  PROVIDER_DEFAULT_MODEL,
} from '@types';

const storage = new MMKV({ id: 'settings' });

const SETTINGS_KEY = 'userSettings';

const defaultSettings: UserSettings = {
  sex: 'male',
  weightKg: 70,
  heightCm: 170,
  age: 30,
  weightGoal: 'lose',
  goalPaceKgPerMonth: 2,
  activityFactor: DEFAULT_ACTIVITY_FACTOR,
  dailyCalorieGoal: 2000,
  onboardingComplete: false,
  aiProvider: 'openai',
  model: PROVIDER_DEFAULT_MODEL.openai,
  apiKey: '',
  language: getDeviceLanguage(),
  themeMode: 'light',
  units: getDeviceUnits(),
  demoAttempts: 5,
};

function loadSettings(): UserSettings {
  const raw = storage.getString(SETTINGS_KEY);
  if (!raw) return { ...defaultSettings };
  try {
    return { ...defaultSettings, ...JSON.parse(raw) };
  } catch {
    return { ...defaultSettings };
  }
}

function saveSettings(settings: UserSettings): void {
  storage.set(SETTINGS_KEY, JSON.stringify(settings));
}

interface SettingsState extends UserSettings {
  isOnboardingComplete: () => boolean;
  updateSettings: (partial: Partial<UserSettings>) => void;
  setOnboardingComplete: (settings: {
    sex: Sex;
    weightKg: number;
    heightCm: number;
    age: number;
    dailyCalorieGoal: number;
    apiKey: string;
    aiProvider: AIProviderType;
    model: string;
  }) => void;
  setLanguage: (lang: Language) => void;
  setThemeMode: (mode: ThemeMode) => void;
  setUnits: (units: Units) => void;
  resetOnboarding: () => void;
  deleteAllData: () => void;
}

const loaded = loadSettings();

export const useSettingsStore = create<SettingsState>((set, get) => ({
  ...loaded,
  isOnboardingComplete: () => get().onboardingComplete,
  updateSettings: (partial) => {
    const next = { ...get(), ...partial } as UserSettings;
    saveSettings(next);
    set(partial);
  },
  setOnboardingComplete: (settings) => {
    const next = {
      ...get(),
      ...settings,
      onboardingComplete: true,
    } as UserSettings;
    saveSettings(next);
    set({ ...settings, onboardingComplete: true });
  },
  setLanguage: (language) => {
    const next = { ...get(), language } as UserSettings;
    saveSettings(next);
    changeLanguage(language);
    set({ language });
  },
  setThemeMode: (themeMode) => {
    const next = { ...get(), themeMode } as UserSettings;
    saveSettings(next);
    set({ themeMode });
  },
  setUnits: (units) => {
    const next = { ...get(), units } as UserSettings;
    saveSettings(next);
    set({ units });
  },
  resetOnboarding: () => {
    const {
      language,
      themeMode,
      units,
      aiProvider,
      apiKey,
      model,
      demoAttempts,
    } = get();
    const reset = {
      ...defaultSettings,
      themeMode,
      language,
      units,
      aiProvider,
      apiKey,
      model,
      demoAttempts,
    };
    saveSettings(reset);
    set({ ...reset });
  },
  deleteAllData: () => {
    const { language, themeMode, units } = get();
    storage.clearAll();
    const reset = {
      ...defaultSettings,
      language,
      themeMode,
      units,
    };
    saveSettings(reset);
    set({ ...reset });
  },
}));
