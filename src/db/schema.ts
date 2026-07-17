import { appSchema, tableSchema } from '@nozbe/watermelondb';

export const schema = appSchema({
  version: 2,
  tables: [
    tableSchema({
      name: 'meals',
      columns: [
        { name: 'photo_path', type: 'string' },
        { name: 'total_calories', type: 'number' },
        { name: 'total_protein', type: 'number' },
        { name: 'total_carbs', type: 'number' },
        { name: 'total_fat', type: 'number' },
        { name: 'total_fiber', type: 'number' },
        { name: 'total_grams', type: 'number' },
        { name: 'max_calories', type: 'number' },
        { name: 'date', type: 'string' },
        { name: 'created_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'meal_items',
      columns: [
        { name: 'meal_id', type: 'string', isIndexed: true },
        { name: 'name', type: 'string' },
        { name: 'calories', type: 'number' },
        { name: 'protein', type: 'number' },
        { name: 'carbs', type: 'number' },
        { name: 'fat', type: 'number' },
        { name: 'fiber', type: 'number' },
        { name: 'grams', type: 'number' },
      ],
    }),
  ],
});
