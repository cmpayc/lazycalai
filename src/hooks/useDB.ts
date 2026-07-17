import { useCallback, useState } from 'react';

import { useMealStore } from '@store/mealStore';
import {
  addMeal,
  updateMeal,
  deleteMeal,
  getMealsForDate,
  getTodayCalories,
  CreateMealItemInput,
  UpdateMealInput,
} from '@db/operations';
import { today } from '@utils/date';

export function useDB() {
  const [loading, setLoading] = useState(false);
  const {
    setMeals,
    setTodayCalories,
    addMeal: addMealToStore,
    removeMeal,
  } = useMealStore();

  const loadMeals = useCallback(
    async (date?: string) => {
      setLoading(true);
      try {
        const meals = await getMealsForDate(date ?? today());
        setMeals(meals);
      } finally {
        setLoading(false);
      }
    },
    [setMeals],
  );

  const loadTodayCalories = useCallback(async () => {
    const cal = await getTodayCalories();
    setTodayCalories(cal);
  }, [setTodayCalories]);

  const createMeal = useCallback(
    async (
      photoPath: string,
      items: CreateMealItemInput[],
      maxCalories: number,
    ) => {
      const meal = await addMeal(photoPath, items, maxCalories);
      addMealToStore(meal);
      await loadTodayCalories();
    },
    [addMealToStore, loadTodayCalories],
  );

  const removeMealById = useCallback(
    async (id: string) => {
      await deleteMeal(id);
      removeMeal(id);
      await loadTodayCalories();
    },
    [removeMeal, loadTodayCalories],
  );

  const editMeal = useCallback(
    async (id: string, updates: UpdateMealInput) => {
      await updateMeal(id, updates);
      await loadMeals();
      await loadTodayCalories();
    },
    [loadMeals, loadTodayCalories],
  );

  return {
    loading,
    loadMeals,
    loadTodayCalories,
    createMeal,
    removeMeal: removeMealById,
    editMeal,
  };
}
