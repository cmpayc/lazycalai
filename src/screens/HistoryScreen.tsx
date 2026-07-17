import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import type { MainStackParamList } from '@navigation/MainStack';
import { useSettingsStore } from '@store/settingsStore';
import {
  getDistinctDates,
  getTotalCaloriesForDate,
  getMealsForDate,
} from '@db/operations';
import { formatDate, isToday } from '@utils/date';
import { ITheme } from '@theme/theme.interface';
import { useTheme } from '@theme/theme.hook';

type Nav = StackNavigationProp<MainStackParamList>;

interface DaySummary {
  date: string;
  totalCalories: number;
  maxCalories: number;
  mealCount: number;
}

export default function HistoryScreen() {
  const styles = useTheme(themeStyles);
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const dailyCalorieGoal = useSettingsStore((s) => s.dailyCalorieGoal);
  const [days, setDays] = useState<DaySummary[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDays = useCallback(async () => {
    const dates = await getDistinctDates();
    const summaries: DaySummary[] = [];
    // eslint-disable-next-line no-restricted-syntax
    for (const date of dates) {
      // eslint-disable-next-line no-await-in-loop
      const [calories, meals] = await Promise.all([
        getTotalCaloriesForDate(date),
        getMealsForDate(date),
      ]);
      const maxCalories =
        meals.reduce(
          (prev, meal) => prev + (meal.maxCalories || dailyCalorieGoal),
          0,
        ) / meals.length;
      summaries.push({
        date,
        totalCalories: calories,
        maxCalories,
        mealCount: meals.length,
      });
    }
    setDays(summaries);
    setLoading(false);
  }, [dailyCalorieGoal]);

  useEffect(() => {
    loadDays();
  }, [loadDays]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadDays();
    });
    return unsubscribe;
  }, [navigation, loadDays]);

  const renderDay = useCallback(
    // eslint-disable-next-line react/no-unused-prop-types
    ({ item }: { item: DaySummary }) => {
      const goal = item.maxCalories || dailyCalorieGoal;
      const overGoal = item.totalCalories > goal;
      return (
        <TouchableOpacity
          style={styles.row}
          activeOpacity={0.6}
          onPress={() => navigation.navigate('HistoryDay', { date: item.date })}
        >
          <View style={styles.rowLeft}>
            <Text style={styles.dateText}>
              {formatDate(item.date)}
              {isToday(item.date) ? ` (${t('home.today')})` : ''}
            </Text>
            <Text style={styles.mealCount}>
              {t('history.mealsCount', { count: item.mealCount })}
            </Text>
          </View>
          <View style={styles.rowRight}>
            <Text style={[styles.calories, overGoal && styles.caloriesOver]}>
              {item.totalCalories} / {goal} {t('common.kcal')}
            </Text>
            <Text style={styles.chevron}>›</Text>
          </View>
        </TouchableOpacity>
      );
    },
    [navigation, t, dailyCalorieGoal, styles],
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('history.title')}</Text>
      </View>

      <FlatList
        data={days}
        keyExtractor={(item) => item.date}
        renderItem={renderDay}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          !loading ? (
            <Text style={styles.empty}>{t('history.noDays')}</Text>
          ) : null
        }
      />
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
      paddingBottom: 12,
    },
    headerTitle: {
      ...theme.fonts.bold5,
      color: theme.color.main,
    },
    list: {
      flexGrow: 1,
      paddingBottom: 24,
    },
    empty: {
      textAlign: 'center',
      color: theme.color.placeholder,
      marginTop: 32,
      ...theme.fonts.regular3,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: theme.color.white,
      marginHorizontal: 16,
      marginVertical: 4,
      borderRadius: 12,
      padding: 16,
      shadowColor: theme.color.black,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    rowLeft: {
      flex: 1,
    },
    dateText: {
      ...theme.fonts.bold3,
      color: theme.color.main,
    },
    mealCount: {
      ...theme.fonts.regular1,
      color: theme.color.placeholder,
      marginTop: 2,
    },
    rowRight: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    calories: {
      ...theme.fonts.medium3,
      color: theme.color.primary,
      marginRight: 8,
    },
    caloriesOver: {
      color: theme.color.errorColor,
    },
    chevron: {
      fontSize: 22,
      color: theme.color.placeholder,
    },
  });
  return styles;
};
