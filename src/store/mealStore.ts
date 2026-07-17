import { create } from 'zustand';

import { MealData } from '@types';

interface MealState {
  meals: MealData[];
  todayCalories: number;
  setMeals: (meals: MealData[]) => void;
  addMeal: (meal: MealData) => void;
  removeMeal: (id: string) => void;
  setTodayCalories: (calories: number) => void;
}

export const useMealStore = create<MealState>((set) => ({
  meals: [],
  todayCalories: 0,
  setMeals: (meals) => set({ meals }),
  addMeal: (meal) => set((s) => ({ meals: [meal, ...s.meals] })),
  removeMeal: (id) =>
    set((s) => ({ meals: s.meals.filter((m) => m.id !== id) })),
  setTodayCalories: (todayCalories) => set({ todayCalories }),
}));
