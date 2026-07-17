import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import {
  schemaMigrations,
  addColumns,
} from '@nozbe/watermelondb/Schema/migrations';

import { schema } from './schema';
import Meal from './models/Meal';
import MealItem from './models/MealItem';

const migrations = schemaMigrations({
  migrations: [
    {
      toVersion: 2,
      steps: [
        addColumns({
          table: 'meals',
          columns: [{ name: 'max_calories', type: 'number' }],
        }),
      ],
    },
  ],
});

let database: Database | null = null;

export function getDatabase(): Database {
  if (!database) {
    const adapter = new SQLiteAdapter({
      schema,
      migrations,
      dbName: 'foodcountai',
    });
    database = new Database({
      adapter,
      modelClasses: [Meal, MealItem],
    });
  }
  return database;
}

export async function resetDatabase(): Promise<void> {
  if (database) {
    await database.write(async () => {
      await database!.unsafeResetDatabase();
    });
    database = null;
  }
}
