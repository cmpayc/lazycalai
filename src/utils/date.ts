import { MealData } from '@types';

export function today(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-');
  return `${d}.${m}.${y}`;
}

export function isToday(dateStr: string): boolean {
  return dateStr === today();
}

export type MealPeriod =
  'morning' | 'noon' | 'afternoon' | 'lateAfternoon' | 'evening' | 'night';

const PERIOD_ORDER: MealPeriod[] = [
  'night',
  'evening',
  'lateAfternoon',
  'afternoon',
  'noon',
  'morning',
];

export function getMealPeriod(timestamp: number): MealPeriod {
  const hour = new Date(timestamp).getHours();
  if (hour >= 6 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 13) return 'noon';
  if (hour >= 13 && hour < 16) return 'afternoon';
  if (hour >= 16 && hour < 18) return 'lateAfternoon';
  if (hour >= 18 && hour < 21) return 'evening';
  return 'night';
}

export interface MealSection {
  period: MealPeriod;
  title: string;
  data: MealData[];
}

export function groupMealsByPeriod(meals: MealData[]): MealSection[] {
  const groups: Record<MealPeriod, MealData[]> = {
    morning: [],
    noon: [],
    afternoon: [],
    lateAfternoon: [],
    evening: [],
    night: [],
  };

  meals.forEach((meal) => {
    const period = getMealPeriod(meal.createdAt);
    groups[period].push(meal);
  });

  // Sort each period's meals newest-first
  Object.values(groups).forEach((list) => {
    list.sort((a, b) => b.createdAt - a.createdAt);
  });

  return PERIOD_ORDER.filter((p) => groups[p].length > 0).map((p) => ({
    period: p,
    title: p,
    data: groups[p],
  }));
}

export interface TimeRange {
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
}

export const PERIOD_TIME_RANGES: Record<MealPeriod, TimeRange> = {
  morning: { startHour: 6, startMinute: 0, endHour: 12, endMinute: 0 },
  noon: { startHour: 12, startMinute: 0, endHour: 13, endMinute: 0 },
  afternoon: { startHour: 13, startMinute: 0, endHour: 16, endMinute: 0 },
  lateAfternoon: { startHour: 16, startMinute: 0, endHour: 18, endMinute: 0 },
  evening: { startHour: 18, startMinute: 0, endHour: 21, endMinute: 0 },
  night: { startHour: 21, startMinute: 0, endHour: 6, endMinute: 0 },
};

function formatHourMinute(
  hour: number,
  minute: number,
  use12h: boolean,
): string {
  if (use12h) {
    const period = hour >= 12 ? 'PM' : 'AM';
    const h12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${h12}:${String(minute).padStart(2, '0')} ${period}`;
  }
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

export function formatTimeRange(range: TimeRange, locale: string): string {
  const use12h = locale === 'en';
  const start = formatHourMinute(range.startHour, range.startMinute, use12h);
  const end = formatHourMinute(range.endHour, range.endMinute, use12h);
  return `${start} – ${end}`;
}
