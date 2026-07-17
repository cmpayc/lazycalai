import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';

import type { MainStackParamList } from '@navigation/MainStack';
import { useSettingsStore } from '@store/settingsStore';
import {
  getMealsForDate,
  getTotalCaloriesForDate,
  deleteMeal,
} from '@db/operations';
import CalorieRing from '@components/CalorieRing';
import MealSectionList from '@components/MealSectionList';
import { MealData } from '@types';
import { formatDate } from '@utils/date';
import { ITheme } from '@theme/theme.interface';
import { useTheme } from '@theme/theme.hook';

type Route = RouteProp<MainStackParamList, 'HistoryDay'>;

export default function HistoryDayScreen() {
  const styles = useTheme(themeStyles);
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute<Route>();
  const { date } = route.params;
  const currentGoal = useSettingsStore((s) => s.dailyCalorieGoal);
  const [meals, setMeals] = useState<MealData[]>([]);
  const [totalCalories, setTotalCalories] = useState(0);

  const loadData = useCallback(async () => {
    const [loadedMeals, calories] = await Promise.all([
      getMealsForDate(date),
      getTotalCaloriesForDate(date),
    ]);
    setMeals(loadedMeals);
    setTotalCalories(calories);
  }, [date]);

  const dailyCalorieGoal =
    meals.length > 0 ? meals[0].maxCalories || currentGoal : currentGoal;

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDelete = useCallback(
    async (id: string) => {
      await deleteMeal(id);
      await loadData();
    },
    [loadData],
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>{t('common.back')}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{formatDate(date)}</Text>
        <View style={styles.spacer} />
      </View>

      <CalorieRing consumed={totalCalories} goal={dailyCalorieGoal} />

      <MealSectionList
        meals={meals}
        onDelete={handleDelete}
        ListEmptyComponent={
          <Text style={styles.empty}>{t('home.noMeals')}</Text>
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
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingTop: 56,
      paddingBottom: 12,
    },
    back: {
      ...theme.fonts.regular3,
      color: theme.color.primary,
    },
    headerTitle: {
      ...theme.fonts.bold5,
      color: theme.color.main,
    },
    spacer: {
      width: 48,
    },
    empty: {
      textAlign: 'center',
      color: theme.color.placeholder,
      marginTop: 32,
      ...theme.fonts.regular3,
    },
  });
  return styles;
};
