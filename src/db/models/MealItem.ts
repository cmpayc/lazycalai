import { Model } from '@nozbe/watermelondb';
import { field } from '@nozbe/watermelondb/decorators';

export default class MealItem extends Model {
  static table = 'meal_items';

  @field('meal_id') mealId!: string;

  @field('name') name!: string;

  @field('calories') calories!: number;

  @field('protein') protein!: number;

  @field('carbs') carbs!: number;

  @field('fat') fat!: number;

  @field('fiber') fiber!: number;

  @field('grams') grams!: number;
}
