import { ActivityLevel, ObesityResult, Sex, WeightGoal } from '@types';

/** Energy in one kilogram of body mass (kcal). */
const CALORIES_PER_KG = 7700;
/** Average days per month, used to spread a monthly pace across daily intake. */
const DAYS_PER_MONTH = 30.44;
/** Safety floor: never recommend eating below this, per sex (kcal/day). */
export const MIN_DAILY_CALORIES: Record<Sex, number> = {
  female: 1200,
  male: 1500,
};

/** Minimum safe daily intake for the given sex. */
export function getMinDailyCalories(sex: Sex): number {
  return MIN_DAILY_CALORIES[sex];
}

/**
 * Youngest age for which the fixed adult BMI cut-offs apply. WHO uses
 * age- and sex-specific BMI-for-age growth references for ages 5-19, so the
 * BMI category is only shown at 20+.
 */
export const ADULT_BMI_MIN_AGE = 20;

export interface GoalPace {
  key: 'casually' | 'mild' | 'moderate' | 'aggressive';
  kgPerMonth: number;
}

/** Selectable paces for losing or gaining weight, in kg per month. */
export const GOAL_PACES: GoalPace[] = [
  { key: 'casually', kgPerMonth: 0.5 },
  { key: 'mild', kgPerMonth: 1 },
  { key: 'moderate', kgPerMonth: 2 },
  { key: 'aggressive', kgPerMonth: 4 },
];

export interface ActivityOption {
  key: ActivityLevel;
  /** Multiplier applied to BMR to get maintenance calories (TDEE). */
  factor: number;
}

/** Standard Mifflin-St Jeor activity multipliers, sedentary to extra active. */
export const ACTIVITY_LEVELS: ActivityOption[] = [
  { key: 'sedentary', factor: 1.2 },
  { key: 'light', factor: 1.375 },
  { key: 'moderate', factor: 1.55 },
  { key: 'active', factor: 1.725 },
  { key: 'veryActive', factor: 1.9 },
];

/** Default activity multiplier (sedentary) used before the user picks one. */
export const DEFAULT_ACTIVITY_FACTOR = ACTIVITY_LEVELS[1].factor;

export function calculateBMI(weightKg: number, heightCm: number): number {
  const heightM = heightCm / 100;
  return Math.round((weightKg / (heightM * heightM)) * 10) / 10;
}

export function getObesityLevel(bmi: number): ObesityResult['level'] {
  if (bmi < 18.5) return 'underweight';
  if (bmi < 25) return 'normal';
  if (bmi < 30) return 'overweight';
  if (bmi < 35) return 'obese_class_1';
  if (bmi < 40) return 'obese_class_2';
  return 'obese_class_3';
}

export function getObesityLabel(level: ObesityResult['level']): string {
  const labels: Record<ObesityResult['level'], string> = {
    underweight: 'Underweight',
    normal: 'Normal weight',
    overweight: 'Overweight',
    obese_class_1: 'Obesity Class I',
    obese_class_2: 'Obesity Class II',
    obese_class_3: 'Obesity Class III',
  };
  return labels[level];
}

/** Mifflin-St Jeor basal metabolic rate (kcal/day). */
function calculateBMR(
  weightKg: number,
  heightCm: number,
  age: number,
  sex: Sex,
): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return sex === 'male' ? base + 5 : base - 161;
}

/**
 * Daily calorie goal for a given weight target.
 *
 * Starts from maintenance (BMR x activity factor), then applies a deficit
 * (lose) or surplus (gain) sized to the chosen monthly pace. A monthly pace of
 * `kgPerMonth` maps to a daily delta of kgPerMonth * 7700 / 30.44 kcal.
 * `kgPerMonth` is ignored when goal is 'maintain'.
 */
export function calculateDailyCalorieGoal(
  weightKg: number,
  heightCm: number,
  age: number,
  sex: Sex,
  goal: WeightGoal,
  kgPerMonth: number,
  activityFactor: number,
): number {
  const maintenance =
    calculateBMR(weightKg, heightCm, age, sex) * activityFactor;
  if (goal === 'maintain') return Math.round(maintenance);

  const dailyDelta = (kgPerMonth * CALORIES_PER_KG) / DAYS_PER_MONTH;
  const target =
    goal === 'lose' ? maintenance - dailyDelta : maintenance + dailyDelta;
  return Math.max(getMinDailyCalories(sex), Math.round(target));
}

export function calculateObesityResult(
  weightKg: number,
  heightCm: number,
): ObesityResult {
  const bmi = calculateBMI(weightKg, heightCm);
  return { bmi, level: getObesityLevel(bmi) };
}
