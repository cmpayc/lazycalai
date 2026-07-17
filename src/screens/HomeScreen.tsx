import React, { useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import type { MainStackParamList } from '@navigation/MainStack';
import { useSettingsStore } from '@store/settingsStore';
import { useMealStore } from '@store/mealStore';
import { useDB } from '@hooks/useDB';
import CalorieRing from '@components/CalorieRing';
import MealSectionList from '@components/MealSectionList';
import HomeTips from '@components/HomeTips';
import { ITheme } from '@theme/theme.interface';
import { useTheme } from '@theme/theme.hook';
import LogoLight from '@assets/LogoLight.png';
import LogoDark from '@assets/LogoDark.png';

type Nav = StackNavigationProp<MainStackParamList>;

export default function HomeScreen() {
  const styles = useTheme(themeStyles);
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const dailyCalorieGoal = useSettingsStore((s) => s.dailyCalorieGoal);
  const themeMode = useSettingsStore((s) => s.themeMode);
  const { meals, todayCalories } = useMealStore();
  const { loadMeals, loadTodayCalories, removeMeal } = useDB();

  useEffect(() => {
    loadMeals();
    loadTodayCalories();
  }, [loadMeals, loadTodayCalories]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadMeals();
      loadTodayCalories();
    });
    return unsubscribe;
  }, [navigation, loadMeals, loadTodayCalories]);

  const handleDelete = useCallback(
    (id: string) => removeMeal(id),
    [removeMeal],
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image
          source={themeMode === 'dark' ? LogoDark : LogoLight}
          style={styles.logo}
          resizeMode="contain"
        />
        <HomeTips />
      </View>

      <CalorieRing consumed={todayCalories} goal={dailyCalorieGoal} />

      <View style={styles.dateRow}>
        <Text style={styles.dateLabel}>{t('home.today')}</Text>
      </View>

      <MealSectionList
        meals={meals}
        onDelete={handleDelete}
        ListEmptyComponent={
          <Text style={styles.empty}>{t('home.noMeals')}</Text>
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddMeal')}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
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
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingTop: 56,
      paddingBottom: 12,
    },
    headerTitle: {
      ...theme.fonts.bold5,
      color: theme.color.main,
    },
    logo: {
      width: 100,
      height: 33,
    },
    dateRow: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      alignItems: 'center',
    },
    dateLabel: {
      ...theme.fonts.medium3,
      color: theme.color.subText,
    },
    empty: {
      textAlign: 'center',
      color: theme.color.placeholder,
      marginTop: 32,
      ...theme.fonts.regular3,
      paddingHorizontal: 16,
    },
    fab: {
      position: 'absolute',
      bottom: 24,
      right: 24,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: theme.color.primary,
      alignItems: 'center',
      justifyContent: 'center',
      elevation: 4,
      shadowColor: theme.color.black,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
    },
    fabText: {
      fontSize: 28,
      color: theme.color.white,
      lineHeight: 30,
    },
  });
  return styles;
};
