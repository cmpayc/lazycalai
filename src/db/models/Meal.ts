import { Model } from '@nozbe/watermelondb';
import { field, date } from '@nozbe/watermelondb/decorators';

export default class Meal extends Model {
  static table = 'meals';

  @field('photo_path') photoPath!: string;

  @field('total_calories') totalCalories!: number;

  @field('total_protein') totalProtein!: number;

  @field('total_carbs') totalCarbs!: number;

  @field('total_fat') totalFat!: number;

  @field('total_fiber') totalFiber!: number;

  @field('total_grams') totalGrams!: number;

  @field('max_calories') maxCalories!: number;

  @field('date') date!: string;

  @date('created_at') createdAt!: Date;
}
