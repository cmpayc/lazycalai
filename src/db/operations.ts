/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-param-reassign */
import { Q } from '@nozbe/watermelondb';

import { NutritionInfo, MealData } from '@types';
import { today } from '@utils/date';
import { getDatabase } from './index';
import Meal from './models/Meal';
import MealItem from './models/MealItem';

export interface CreateMealItemInput {
  name: string;
  nutrition: NutritionInfo;
}

function mealToData(meal: Meal, items: MealItem[]): MealData {
  return {
    id: meal.id,
    photoPath: meal.photoPath,
    totalCalories: meal.totalCalories,
    totalProtein: meal.totalProtein,
    totalCarbs: meal.totalCarbs,
    totalFat: meal.totalFat,
    totalFiber: meal.totalFiber,
    totalGrams: meal.totalGrams,
    maxCalories: meal.maxCalories,
    date: meal.date,
    createdAt: meal.createdAt.getTime(),
    items: items.map((i) => ({
      id: i.id,
      name: i.name,
      calories: i.calories,
      protein: i.protein,
      carbs: i.carbs,
      fat: i.fat,
      fiber: i.fiber,
      grams: i.grams,
    })),
  };
}

export async function addMeal(
  photoPath: string,
  items: CreateMealItemInput[],
  maxCalories: number,
): Promise<MealData> {
  const db = getDatabase();
  let result: MealData | null = null;

  await db.write(async () => {
    const totalCalories = items.reduce((s, i) => s + i.nutrition.calories, 0);
    const totalProtein = items.reduce((s, i) => s + i.nutrition.protein, 0);
    const totalCarbs = items.reduce((s, i) => s + i.nutrition.carbs, 0);
    const totalFat = items.reduce((s, i) => s + i.nutrition.fat, 0);
    const totalFiber = items.reduce((s, i) => s + i.nutrition.fiber, 0);
    const totalGrams = items.reduce((s, i) => s + i.nutrition.grams, 0);

    const meal = await db.get<Meal>('meals').create((m) => {
      m.photoPath = photoPath;
      m.totalCalories = totalCalories;
      m.totalProtein = totalProtein;
      m.totalCarbs = totalCarbs;
      m.totalFat = totalFat;
      m.totalFiber = totalFiber;
      m.totalGrams = totalGrams;
      m.maxCalories = maxCalories;
      m.date = today();
      m.createdAt = new Date();
    });

    const createdItems: MealItem[] = [];
    const itemCollection = db.get<MealItem>('meal_items');
    for (const item of items) {
      const mi = await itemCollection.create((m) => {
        m.mealId = meal.id;
        m.name = item.name;
        m.calories = item.nutrition.calories;
        m.protein = item.nutrition.protein;
        m.carbs = item.nutrition.carbs;
        m.fat = item.nutrition.fat;
        m.fiber = item.nutrition.fiber;
        m.grams = item.nutrition.grams;
      });
      createdItems.push(mi);
    }

    result = mealToData(meal, createdItems);
  });

  return result!;
}

export async function getMealsForDateRange(
  startDate: string,
  endDate: string,
): Promise<MealData[]> {
  const db = getDatabase();
  const meals = await db
    .get<Meal>('meals')
    .query(
      Q.and(Q.where('date', Q.gte(startDate)), Q.where('date', Q.lte(endDate))),
      Q.sortBy('date', Q.asc),
      Q.sortBy('created_at', Q.desc),
    )
    .fetch();

  const result: MealData[] = [];
  for (const meal of meals) {
    const items = await db
      .get<MealItem>('meal_items')
      .query(Q.where('meal_id', meal.id))
      .fetch();
    result.push(mealToData(meal, items));
  }

  return result;
}

export async function getMealsForDate(date: string): Promise<MealData[]> {
  const db = getDatabase();
  const meals = await db
    .get<Meal>('meals')
    .query(Q.where('date', date), Q.sortBy('created_at', Q.desc))
    .fetch();

  const result: MealData[] = [];
  for (const meal of meals) {
    const items = await db
      .get<MealItem>('meal_items')
      .query(Q.where('meal_id', meal.id))
      .fetch();
    result.push(mealToData(meal, items));
  }

  return result;
}

export async function getMealById(id: string): Promise<MealData | null> {
  const db = getDatabase();
  const meal = await db
    .get<Meal>('meals')
    .find(id)
    .catch(() => null);
  if (!meal) return null;

  const items = await db
    .get<MealItem>('meal_items')
    .query(Q.where('meal_id', meal.id))
    .fetch();

  return mealToData(meal, items);
}

export interface UpdateMealInput {
  photoPath?: string;
  date?: string;
  createdAt?: number;
  items: {
    id?: string;
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    grams: number;
  }[];
}

export async function updateMeal(
  id: string,
  updates: UpdateMealInput,
): Promise<MealData> {
  const db = getDatabase();
  let result: MealData | null = null;

  await db.write(async () => {
    const meal = await db.get<Meal>('meals').find(id);

    const totalCalories = updates.items.reduce((s, i) => s + i.calories, 0);
    const totalProtein = updates.items.reduce((s, i) => s + i.protein, 0);
    const totalCarbs = updates.items.reduce((s, i) => s + i.carbs, 0);
    const totalFat = updates.items.reduce((s, i) => s + i.fat, 0);
    const totalFiber = updates.items.reduce((s, i) => s + i.fiber, 0);
    const totalGrams = updates.items.reduce((s, i) => s + i.grams, 0);

    await meal.update((m) => {
      if (updates.photoPath !== undefined) m.photoPath = updates.photoPath;
      if (updates.date !== undefined) m.date = updates.date;
      if (updates.createdAt !== undefined)
        m.createdAt = new Date(updates.createdAt);
      m.totalCalories = totalCalories;
      m.totalProtein = totalProtein;
      m.totalCarbs = totalCarbs;
      m.totalFat = totalFat;
      m.totalFiber = totalFiber;
      m.totalGrams = totalGrams;
    });

    // Delete old items
    const oldItems = await db
      .get<MealItem>('meal_items')
      .query(Q.where('meal_id', id))
      .fetch();
    for (const item of oldItems) {
      await item.destroyPermanently();
    }

    // Create new items
    const createdItems: MealItem[] = [];
    const itemCollection = db.get<MealItem>('meal_items');
    for (const item of updates.items) {
      const mi = await itemCollection.create((m) => {
        m.mealId = meal.id;
        m.name = item.name;
        m.calories = item.calories;
        m.protein = item.protein;
        m.carbs = item.carbs;
        m.fat = item.fat;
        m.fiber = item.fiber;
        m.grams = item.grams;
      });
      createdItems.push(mi);
    }

    result = mealToData(meal, createdItems);
  });

  return result!;
}

export async function deleteMeal(id: string): Promise<void> {
  const db = getDatabase();
  await db.write(async () => {
    const items = await db
      .get<MealItem>('meal_items')
      .query(Q.where('meal_id', id))
      .fetch();
    for (const item of items) {
      await item.destroyPermanently();
    }
    const meal = await db.get<Meal>('meals').find(id);
    await meal.destroyPermanently();
  });
}

export async function getTotalCaloriesForDate(date: string): Promise<number> {
  const db = getDatabase();
  const meals = await db
    .get<Meal>('meals')
    .query(Q.where('date', date))
    .fetch();
  return meals.reduce((s, m) => s + m.totalCalories, 0);
}

export async function getDistinctDates(): Promise<string[]> {
  const db = getDatabase();
  const meals = await db
    .get<Meal>('meals')
    .query(Q.sortBy('date', Q.desc))
    .fetch();

  const seen = new Set<string>();
  const dates: string[] = [];
  for (const meal of meals) {
    if (!seen.has(meal.date)) {
      seen.add(meal.date);
      dates.push(meal.date);
    }
  }
  return dates;
}

export async function getTodayCalories(): Promise<number> {
  return getTotalCaloriesForDate(today());
}

export async function getAllMeals(): Promise<MealData[]> {
  const db = getDatabase();
  const meals = await db
    .get<Meal>('meals')
    .query(Q.sortBy('date', Q.desc), Q.sortBy('created_at', Q.desc))
    .fetch();

  const result: MealData[] = [];
  for (const meal of meals) {
    const items = await db
      .get<MealItem>('meal_items')
      .query(Q.where('meal_id', meal.id))
      .fetch();
    result.push(mealToData(meal, items));
  }

  return result;
}

export interface ImportMealInput {
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
  items: {
    id: string;
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    grams: number;
  }[];
}

export async function importMeal(meal: ImportMealInput): Promise<boolean> {
  const db = getDatabase();
  let imported = false;

  await db.write(async () => {
    const existing = await db
      .get<Meal>('meals')
      .find(meal.id)
      .catch(() => null);
    if (existing) return;

    await db.get<Meal>('meals').create((m) => {
      m._raw.id = meal.id;
      m.photoPath = meal.photoPath;
      m.totalCalories = meal.totalCalories;
      m.totalProtein = meal.totalProtein;
      m.totalCarbs = meal.totalCarbs;
      m.totalFat = meal.totalFat;
      m.totalFiber = meal.totalFiber;
      m.totalGrams = meal.totalGrams;
      m.maxCalories = meal.maxCalories;
      m.date = meal.date;
      m.createdAt = new Date(meal.createdAt);
    });

    const itemCollection = db.get<MealItem>('meal_items');
    for (const item of meal.items) {
      const existingItem = await itemCollection.find(item.id).catch(() => null);
      if (existingItem) continue;

      await itemCollection.create((mi) => {
        mi._raw.id = item.id;
        mi.mealId = meal.id;
        mi.name = item.name;
        mi.calories = item.calories;
        mi.protein = item.protein;
        mi.carbs = item.carbs;
        mi.fat = item.fat;
        mi.fiber = item.fiber;
        mi.grams = item.grams;
      });
    }

    imported = true;
  });

  return imported;
}
