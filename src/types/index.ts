export type Sex = 'male' | 'female';
export type WeightGoal = 'lose' | 'maintain' | 'gain';
export type AIProviderType =
  'openai' | 'claude' | 'gemini' | 'openrouter' | 'qwen' | 'grok' | 'demo';

export const PROVIDER_MODELS: Record<AIProviderType, string[]> = {
  openai: [
    'gpt-4o',
    'gpt-4o-mini',
    'gpt-5.4-nano',
    'gpt-5.4-mini',
    'gpt-5.4',
    'gpt-5.5',
  ],
  claude: ['claude-sonnet-5', 'claude-opus-4-8', 'claude-haiku-4-5-20251001'],
  gemini: [
    'gemini-3.5-flash',
    'gemini-3.1-flash-lite',
    'gemini-3.1-pro-preview',
    'gemini-3.1-flash-image-preview',
  ],
  openrouter: [
    'openai/gpt-4o',
    'google/gemini-3.5-flash',
    'anthropic/claude-sonnet-5',
    'meta-llama/llama-4-maverick',
    'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free',
  ],
  qwen: ['qwen3.6-flash', 'qwen3.6-plus', 'qwen3.5-flash', 'qwen3.5-plus'],
  grok: ['grok-4.3', 'grok-4.5'],
  demo: ['demo'],
};

export const PROVIDER_DEFAULT_MODEL: Record<AIProviderType, string> = {
  openai: 'gpt-4o',
  claude: 'claude-sonnet-5',
  gemini: 'gemini-3.1-flash-image-preview',
  openrouter: 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free',
  qwen: 'qwen3.6-flash',
  grok: 'grok-4.3',
  demo: 'demo',
};

export type Language =
  'en' | 'ru' | 'fr' | 'es' | 'zh' | 'ja' | 'de' | 'pt' | 'ar';
export type ThemeMode = 'light' | 'dark';
export type Units = 'metric' | 'imperial';

export interface UserSettings {
  sex: Sex;
  weightKg: number;
  heightCm: number;
  age: number;
  weightGoal: WeightGoal;
  goalPaceKgPerMonth: number;
  dailyCalorieGoal: number;
  onboardingComplete: boolean;
  aiProvider: AIProviderType;
  model: string;
  apiKey: string;
  language: Language;
  themeMode: ThemeMode;
  units: Units;
  demoAttempts: number;
}

export interface ObesityResult {
  bmi: number;
  level:
    | 'underweight'
    | 'normal'
    | 'overweight'
    | 'obese_class_1'
    | 'obese_class_2'
    | 'obese_class_3';
}

export interface NutritionInfo {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  grams: number;
}

export interface AnalyzedItem {
  item: string;
  nutrition: NutritionInfo;
}

export interface FoodAnalysisResult {
  items: AnalyzedItem[];
  error?: string;
}

export interface AIProvider {
  analyzeFood(imageBase64: string): Promise<FoodAnalysisResult>;
}

export interface ProviderConfig {
  apiKey: string;
  model?: string;
  language?: string;
}

export interface MealItemData {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  grams: number;
}

export interface MealData {
  id: string;
  photoPath: string;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  totalFiber: number;
  totalGrams: number;
  maxCalories: number;
  date: string;
  createdAt: number;
  items: MealItemData[];
}
