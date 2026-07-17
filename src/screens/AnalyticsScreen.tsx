import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';

import { ITheme } from '@theme/theme.interface';
import { useTheme } from '@theme/theme.hook';
import { useSettingsStore } from '@store/settingsStore';
import { getMealsForDateRange } from '@db/operations';
import type { MealData } from '@types';
import BarChart, { type BarChartDatum } from '@components/BarChart';

type Period = 'week' | 'month';

// --- Date helpers ---

function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getWeekMonday(d: Date): Date {
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day; // Sunday = 0, Monday = 1
  const mon = new Date(d);
  mon.setDate(d.getDate() + diff);
  mon.setHours(0, 0, 0, 0);
  return mon;
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function getISOWeek(d: Date): number {
  const tmp = new Date(d);
  tmp.setHours(0, 0, 0, 0);
  tmp.setDate(tmp.getDate() + 3 - ((tmp.getDay() + 6) % 7));
  const jan4 = new Date(tmp.getFullYear(), 0, 4);
  const diff = (tmp.getTime() - jan4.getTime()) / 86400000;
  return 1 + Math.round(diff / 7);
}

function round2(v: number): number {
  return Math.round(v * 100) / 100;
}

// --- Component ---

export default function AnalyticsScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const dailyCalorieGoal = useSettingsStore((s) => s.dailyCalorieGoal);
  const styles = useTheme(themeStyles);

  const [period, setPeriod] = useState<Period>('week');
  const [cursorDate, setCursorDate] = useState(() => getWeekMonday(new Date()));
  const [meals, setMeals] = useState<MealData[]>([]);
  const [loading, setLoading] = useState(true);

  // Date range for the current view
  const dateRange = useMemo(() => {
    if (period === 'week') {
      return {
        start: toDateStr(cursorDate),
        end: toDateStr(addDays(cursorDate, 6)),
      };
    }
    const y = cursorDate.getFullYear();
    const m = cursorDate.getMonth();
    const first = new Date(y, m, 1);
    const last = new Date(y, m + 1, 0);
    return { start: toDateStr(first), end: toDateStr(last) };
  }, [period, cursorDate]);

  // Load meals for the range
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getMealsForDateRange(dateRange.start, dateRange.end);
      setMeals(result);
    } finally {
      setLoading(false);
    }
  }, [dateRange.start, dateRange.end]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadData();
    });
    return unsubscribe;
  }, [navigation, loadData]);

  // Aggregate meals by date
  const dailyTotals = useMemo(() => {
    const map: Record<
      string,
      { cal: number; protein: number; carbs: number; fat: number }
    > = {};
    meals.forEach((meal) => {
      if (!map[meal.date]) {
        map[meal.date] = { cal: 0, protein: 0, carbs: 0, fat: 0 };
      }
      map[meal.date].cal += meal.totalCalories;
      map[meal.date].protein += meal.totalProtein;
      map[meal.date].carbs += meal.totalCarbs;
      map[meal.date].fat += meal.totalFat;
    });
    return map;
  }, [meals]);

  const totalDays =
    period === 'week'
      ? 7
      : new Date(
          cursorDate.getFullYear(),
          cursorDate.getMonth() + 1,
          0,
        ).getDate();

  // Max allowed calories for the period: avg meal max_calories × days
  const maxAllowedCalories = useMemo(() => {
    if (meals.length === 0) {
      return dailyCalorieGoal * totalDays;
    }
    const dailyMeals: Record<string, boolean> = {};
    const totalMax = meals.reduce((s, m) => {
      dailyMeals[m.date] = true;
      return s + (m.maxCalories || dailyCalorieGoal);
    }, 0);
    const daysLeft = Object.keys(dailyMeals).length;
    const pastDaysMax = Math.round((totalMax / meals.length) * daysLeft);
    const newDaysMax = Math.round(dailyCalorieGoal * (totalDays - daysLeft));
    return pastDaysMax + newDaysMax;
  }, [meals, dailyCalorieGoal, totalDays]);

  // Chart data
  const chartData: BarChartDatum[] = useMemo(() => {
    const maxValue = Math.round(maxAllowedCalories / totalDays);

    if (period === 'week') {
      const days: BarChartDatum[] = [];
      for (let i = 0; i < 7; i++) {
        const d = addDays(cursorDate, i);
        const ds = toDateStr(d);
        const dayTotal = dailyTotals[ds];
        const value = dayTotal?.cal ?? 0;
        days.push({
          label: String(d.getDate()),
          value,
          maxValue,
          isOver: value > maxValue,
        });
      }
      return days;
    }

    // Month: group by ISO week
    const y = cursorDate.getFullYear();
    const m = cursorDate.getMonth();
    const firstDay = new Date(y, m, 1);
    const lastDay = new Date(y, m + 1, 0);

    // Key by the week's Monday date so ordering and labels stay correct
    // across the year boundary (ISO week numbers alone reset to 1 in a
    // month that spans into the next year and would sort out of order).
    const weekMap: Record<string, { week: number; value: number }> = {};
    for (let d = new Date(firstDay); d <= lastDay; d = addDays(d, 1)) {
      const ds = toDateStr(d);
      const monday = toDateStr(getWeekMonday(d));
      if (!weekMap[monday]) {
        weekMap[monday] = { week: getISOWeek(d), value: 0 };
      }
      weekMap[monday].value += dailyTotals[ds]?.cal ?? 0;
    }

    const sorted = Object.entries(weekMap).sort(([a], [b]) =>
      a.localeCompare(b),
    );
    return sorted.map(([, { week, value }]) => ({
      label: t('analytics.weekLabel', { number: week }),
      value,
      maxValue: maxValue * 7,
      isOver: value > maxValue * 7,
    }));
  }, [period, cursorDate, dailyTotals, totalDays, maxAllowedCalories, t]);

  // Period totals
  const totals = useMemo(
    () =>
      Object.values(dailyTotals).reduce(
        (acc, d) => ({
          cal: acc.cal + d.cal,
          protein: acc.protein + d.protein,
          carbs: acc.carbs + d.carbs,
          fat: acc.fat + d.fat,
        }),
        { cal: 0, protein: 0, carbs: 0, fat: 0 },
      ),
    [dailyTotals],
  );

  // Days over goal
  const daysOver = useMemo(() => {
    if (period === 'week') {
      return chartData.filter((d) => d.isOver).length;
    }
    // Month: count days that exceed dailyCalorieGoal
    const y = cursorDate.getFullYear();
    const m = cursorDate.getMonth();
    const lastDay = new Date(y, m + 1, 0);
    let count = 0;
    for (let d = new Date(y, m, 1); d <= lastDay; d = addDays(d, 1)) {
      const ds = toDateStr(d);
      if ((dailyTotals[ds]?.cal ?? 0) > dailyCalorieGoal) {
        count++;
      }
    }
    return count;
  }, [period, cursorDate, dailyTotals, dailyCalorieGoal, chartData]);

  // Navigation
  const goBack = () => {
    if (period === 'week') {
      setCursorDate((d) => addDays(d, -7));
    } else {
      setCursorDate((d) => {
        const y = d.getFullYear();
        const m = d.getMonth();
        return new Date(y, m - 1, 1);
      });
    }
  };

  const goForward = () => {
    const now = new Date();
    if (period === 'week') {
      const next = addDays(cursorDate, 7);
      if (next <= now) {
        setCursorDate(next);
      }
    } else {
      const y = cursorDate.getFullYear();
      const m = cursorDate.getMonth();
      const next = new Date(y, m + 1, 1);
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      if (next <= thisMonth) {
        setCursorDate(next);
      }
    }
  };

  const isCurrent = useMemo(() => {
    const now = new Date();
    if (period === 'week') {
      return sameDay(getWeekMonday(now), cursorDate);
    }
    return (
      cursorDate.getFullYear() === now.getFullYear() &&
      cursorDate.getMonth() === now.getMonth()
    );
  }, [period, cursorDate]);

  // Period label
  const periodLabel = useMemo(() => {
    if (period === 'week') {
      const end = addDays(cursorDate, 6);
      const formatShort = (d: Date) =>
        `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}`;
      return `${formatShort(cursorDate)} – ${formatShort(end)}`;
    }
    return `${t(`months.${cursorDate.getMonth()}`)} ${cursorDate.getFullYear()}`;
  }, [period, cursorDate, t]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('analytics.title')}</Text>
      </View>

      {/* Period toggle */}
      <View style={styles.toggleRow}>
        <TouchableOpacity
          style={[
            styles.toggleBtn,
            period === 'week' && styles.toggleBtnActive,
          ]}
          onPress={() => {
            setPeriod('week');
            setCursorDate(getWeekMonday(new Date()));
          }}
        >
          <Text
            style={[
              styles.toggleText,
              period === 'week' && styles.toggleTextActive,
            ]}
          >
            {t('analytics.week')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.toggleBtn,
            period === 'month' && styles.toggleBtnActive,
          ]}
          onPress={() => {
            setPeriod('month');
            const now = new Date();
            setCursorDate(new Date(now.getFullYear(), now.getMonth(), 1));
          }}
        >
          <Text
            style={[
              styles.toggleText,
              period === 'month' && styles.toggleTextActive,
            ]}
          >
            {t('analytics.month')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Period navigation */}
      <View style={styles.navRow}>
        <TouchableOpacity onPress={goBack} style={styles.navBtn}>
          <Text style={styles.navArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.periodLabel}>{periodLabel}</Text>
        <TouchableOpacity
          onPress={goForward}
          style={styles.navBtn}
          disabled={isCurrent}
        >
          <Text style={[styles.navArrow, isCurrent && styles.navArrowDisabled]}>
            ›
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
      >
        {loading ? (
          <Text style={styles.empty}>{t('common.loading')}</Text>
        ) : meals.length === 0 ? (
          <Text style={styles.empty}>{t('analytics.noData')}</Text>
        ) : (
          <>
            {/* Summary cards */}
            <View style={styles.summaryRow}>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryValue}>{round2(totals.cal)}</Text>
                <Text style={styles.summaryLabel}>
                  {t('analytics.totalCalories')}
                </Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryValue}>
                  {round2(totals.protein)}
                  {t('common.g')}
                </Text>
                <Text style={styles.summaryLabel}>
                  {t('analytics.totalProtein')}
                </Text>
              </View>
            </View>
            <View style={styles.summaryRow}>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryValue}>
                  {round2(totals.carbs)}
                  {t('common.g')}
                </Text>
                <Text style={styles.summaryLabel}>
                  {t('analytics.totalCarbs')}
                </Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryValue}>
                  {round2(totals.fat)}
                  {t('common.g')}
                </Text>
                <Text style={styles.summaryLabel}>
                  {t('analytics.totalFat')}
                </Text>
              </View>
            </View>

            {/* Calorie budget */}
            <View style={styles.budgetCard}>
              <Text style={styles.budgetTitle}>
                {t('analytics.calorieBudget')}
              </Text>
              <Text style={styles.budgetValue}>
                {round2(totals.cal)} / {maxAllowedCalories} {t('common.kcal')}
              </Text>
              <View style={styles.goalBarBg}>
                <View
                  style={[
                    styles.goalBarFill,
                    {
                      width: `${
                        maxAllowedCalories > 0
                          ? Math.min(
                              Math.round(
                                (totals.cal / maxAllowedCalories) * 100,
                              ),
                              100,
                            )
                          : 0
                      }%`,
                    },
                    totals.cal > maxAllowedCalories
                      ? styles.barOver
                      : styles.barUnder,
                  ]}
                />
              </View>
            </View>

            {/* Goal adherence */}
            <View style={styles.goalCard}>
              <Text style={styles.goalTitle}>
                {t('analytics.daysOverLimit', {
                  count: daysOver,
                  total: totalDays,
                })}
              </Text>
              <View style={styles.goalBarBg}>
                <View
                  style={[
                    styles.goalBarFill,
                    styles.barOver,
                    {
                      width: `${
                        totalDays > 0
                          ? Math.round((daysOver / totalDays) * 100)
                          : 0
                      }%`,
                    },
                  ]}
                />
              </View>
            </View>

            {/* Chart */}
            <View style={styles.chartWrapper}>
              <Text style={styles.chartTitle}>
                {period === 'week'
                  ? t('analytics.dailyCalories')
                  : t('analytics.weeklyCalories')}
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <BarChart
                  data={chartData}
                  height={200}
                  goalLineValue={Math.round(
                    period === 'week'
                      ? maxAllowedCalories / totalDays
                      : (maxAllowedCalories * 7) / totalDays,
                  )}
                />
              </ScrollView>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const themeStyles = (theme: ITheme) => {
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.color.background,
    },
    header: {
      paddingHorizontal: 16,
      paddingTop: 56,
      paddingBottom: 4,
    },
    headerTitle: {
      ...theme.fonts.bold5,
      color: theme.color.main,
    },
    toggleRow: {
      flexDirection: 'row',
      marginHorizontal: 16,
      marginTop: 12,
      backgroundColor: theme.color.gray100,
      borderRadius: 10,
      padding: 3,
    },
    toggleBtn: {
      flex: 1,
      paddingVertical: 8,
      alignItems: 'center',
      borderRadius: 8,
    },
    toggleBtnActive: {
      backgroundColor: theme.color.white,
      shadowColor: theme.color.black,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    toggleText: {
      ...theme.fonts.medium2,
      color: theme.color.placeholder,
    },
    toggleTextActive: {
      color: theme.color.main,
    },
    navRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    navBtn: {
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    navArrow: {
      fontSize: 28,
      color: theme.color.primary,
      fontWeight: '300',
    },
    navArrowDisabled: {
      color: theme.color.border,
    },
    periodLabel: {
      ...theme.fonts.medium3,
      color: theme.color.main,
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: 16,
      paddingBottom: 32,
    },
    empty: {
      ...theme.fonts.regular3,
      textAlign: 'center',
      color: theme.color.placeholder,
      marginTop: 48,
    },
    summaryRow: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 12,
    },
    summaryCard: {
      flex: 1,
      backgroundColor: theme.color.white,
      borderRadius: 12,
      padding: 16,
      alignItems: 'center',
      shadowColor: theme.color.black,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    summaryValue: {
      ...theme.fonts.bold5,
      color: theme.color.main,
    },
    summaryLabel: {
      ...theme.fonts.regular1,
      color: theme.color.placeholder,
      marginTop: 4,
    },
    budgetCard: {
      backgroundColor: theme.color.white,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      shadowColor: theme.color.black,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    budgetTitle: {
      ...theme.fonts.medium2,
      color: theme.color.main,
      marginBottom: 6,
    },
    budgetValue: {
      ...theme.fonts.bold4,
      color: theme.color.main,
      marginBottom: 10,
    },
    goalCard: {
      backgroundColor: theme.color.white,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      shadowColor: theme.color.black,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    goalTitle: {
      ...theme.fonts.medium2,
      color: theme.color.main,
      marginBottom: 10,
    },
    goalBarBg: {
      height: 8,
      backgroundColor: theme.color.gray100,
      borderRadius: 4,
      overflow: 'hidden',
    },
    goalBarFill: {
      height: '100%',
      borderRadius: 4,
    },
    barUnder: {
      backgroundColor: theme.color.primary,
    },
    barOver: {
      backgroundColor: theme.color.errorDark,
    },
    chartWrapper: {
      backgroundColor: theme.color.white,
      borderRadius: 12,
      padding: 16,
      shadowColor: theme.color.black,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    chartTitle: {
      ...theme.fonts.medium2,
      color: theme.color.main,
      marginBottom: 8,
    },
  });
  return styles;
};
