import { Platform } from 'react-native';
import RNFSTurbo from 'react-native-fs-turbo';
import Share from 'react-native-share';
import { zip, unzip } from 'react-native-zip-archive';

import { getAllMeals, importMeal, ImportMealInput } from '@db/operations';
import i18n from '@i18n';

const EXPORT_VERSION = 2;
const VERSION_LINE = `#LazyCalAI v${EXPORT_VERSION}`;

const MEAL_HEADER =
  'M,id,date,photo_path,total_calories,total_protein,total_carbs,total_fat,total_fiber,total_grams,max_calories,created_at';
const ITEM_HEADER = 'I,id,meal_id,name,calories,protein,carbs,fat,fiber,grams';

const EXPORT_ZIP = 'foodcountai_export';
const IMPORT_ZIP = 'foodcountai_import';

const CSV_FILE = 'data.csv';
const PHOTOS_DIR = 'photos';

// ---------------------------------------------------------------------------
// CSV helpers
// ---------------------------------------------------------------------------

function escapeCSV(value: string | number): string {
  const s = String(value);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function csvRow(...values: (string | number)[]): string {
  return values.map(escapeCSV).join(',');
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        result.push(current);
        current = '';
      } else {
        current += ch;
      }
    }
  }
  result.push(current);
  return result;
}

// ---------------------------------------------------------------------------
// Zip path helpers
// ---------------------------------------------------------------------------

function tempDir(): string {
  return `${RNFSTurbo.CachesDirectoryPath}/fc_export`;
}

function photosDir(): string {
  return `${tempDir()}/${PHOTOS_DIR}`;
}

function photoExt(filePath: string): string {
  const m = filePath.match(/\.(jpe?g|png|heic|heif|webp)$/i);
  return m ? `.${m[1].toLowerCase()}` : '.jpg';
}

function isFileCopyable(path: string): boolean {
  // Only absolute file paths or file:// URIs are copyable via RNFSTurbo.
  // content:// URIs and other schemes are not accessible through the file API.
  return path.startsWith('/') || path.startsWith('file://');
}

function resolveFilePath(path: string): string {
  if (path.startsWith('file://')) {
    return path.slice(7); // strip file:// prefix
  }
  return path;
}

// ---------------------------------------------------------------------------
// Build / parse CSV (photo_path stores just the filename in the zip context)
// ---------------------------------------------------------------------------

function buildCSV(meals: ImportMealInput[]): string {
  const lines: string[] = [VERSION_LINE, MEAL_HEADER, ITEM_HEADER];

  meals.forEach((meal) => {
    const photoName = meal.photoPath
      ? `${meal.id}${photoExt(meal.photoPath)}`
      : '';

    lines.push(
      csvRow(
        'M',
        meal.id,
        meal.date,
        photoName,
        meal.totalCalories,
        meal.totalProtein,
        meal.totalCarbs,
        meal.totalFat,
        meal.totalFiber,
        meal.totalGrams,
        meal.maxCalories,
        meal.createdAt,
      ),
    );

    meal.items.forEach((item) => {
      lines.push(
        csvRow(
          'I',
          item.id,
          meal.id,
          item.name,
          item.calories,
          item.protein,
          item.carbs,
          item.fat,
          item.fiber,
          item.grams,
        ),
      );
    });
  });

  return lines.join('\n');
}

function parseCSV(
  csv: string,
): { version: number; meals: ImportMealInput[] } | { error: string } {
  const lines = csv
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) {
    return {
      error: 'File is empty',
    };
  }

  const versionMatch = lines[0].match(/^#LazyCalAI v(\d+)$/);
  if (!versionMatch) {
    return {
      error: 'Invalid file format: missing version header',
    };
  }
  const version = parseInt(versionMatch[1], 10);

  if (version !== EXPORT_VERSION) {
    return {
      error: `Unsupported file version v${version}. This app supports v${EXPORT_VERSION}.`,
    };
  }

  let mealHeaderIdx = -1;
  let itemHeaderIdx = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].startsWith('M,')) {
      mealHeaderIdx = i;
    } else if (lines[i].startsWith('I,')) {
      itemHeaderIdx = i;
    }
  }

  if (mealHeaderIdx === -1 || itemHeaderIdx === -1) {
    return {
      error: 'Invalid file format: missing column headers',
    };
  }

  const mealsMap = new Map<string, ImportMealInput>();

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (line === MEAL_HEADER || line === ITEM_HEADER) {
      continue;
    }

    const cols = parseCSVLine(line);

    if (cols[0] === 'M') {
      if (cols.length < 12) {
        continue;
      }
      const meal: ImportMealInput = {
        id: cols[1],
        date: cols[2],
        photoPath: cols[3],
        totalCalories: parseFloat(cols[4]) || 0,
        totalProtein: parseFloat(cols[5]) || 0,
        totalCarbs: parseFloat(cols[6]) || 0,
        totalFat: parseFloat(cols[7]) || 0,
        totalFiber: parseFloat(cols[8]) || 0,
        totalGrams: parseFloat(cols[9]) || 0,
        maxCalories: parseFloat(cols[10]) || 0,
        createdAt: parseInt(cols[11], 10) || 0,
        items: [],
      };
      mealsMap.set(meal.id, meal);
    } else if (cols[0] === 'I') {
      if (cols.length < 10) {
        continue;
      }
      const mealId = cols[2];
      const meal = mealsMap.get(mealId);
      if (meal) {
        meal.items.push({
          id: cols[1],
          name: cols[3],
          calories: parseFloat(cols[4]) || 0,
          protein: parseFloat(cols[5]) || 0,
          carbs: parseFloat(cols[6]) || 0,
          fat: parseFloat(cols[7]) || 0,
          fiber: parseFloat(cols[8]) || 0,
          grams: parseFloat(cols[9]) || 0,
        });
      }
    }
  }

  return {
    version,
    meals: Array.from(mealsMap.values()),
  };
}

function ensureDir(path: string) {
  if (!RNFSTurbo.exists(path)) {
    RNFSTurbo.mkdir(path);
  }
}

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

export async function exportMeals(): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const meals = await getAllMeals();

    if (meals.length === 0) {
      return {
        success: false,
        message: 'No meals to export',
      };
    }

    // Prepare temp directory
    const tmp = tempDir();
    const photos = photosDir();
    ensureDir(tmp);
    ensureDir(photos);

    // Write CSV (photo_path stores just the filename)
    const csv = buildCSV(meals);
    RNFSTurbo.writeFile(`${tmp}/${CSV_FILE}`, csv, 'utf8');

    // Copy photos: <meal_id>.<ext>
    // Only file:// or absolute paths are copyable — content:// URIs are skipped.
    meals.forEach((meal) => {
      if (!meal.photoPath || !isFileCopyable(meal.photoPath)) {
        return;
      }
      try {
        const src = resolveFilePath(meal.photoPath);
        if (!RNFSTurbo.exists(src)) {
          return;
        }
        const dest = `${photos}/${meal.id}${photoExt(meal.photoPath)}`;
        RNFSTurbo.copyFile(src, dest);
      } catch {
        // photo file missing — skip
      }
    });

    // Zip
    const zipPath = `${RNFSTurbo.DocumentDirectoryPath}/${EXPORT_ZIP}.zip`;
    await zip(tmp, zipPath);

    // Clean up temp
    RNFSTurbo.unlink(tmp, false);

    // Share
    const exportedMessage = i18n.t('settings.exportCount', {
      num: meals.length,
    });
    await Share.open({
      title: 'LazyCalAI Export',
      message: exportedMessage,
      url: `data:application/zip;base64,${RNFSTurbo.readFile(Platform.OS === 'android' ? `file://${zipPath}` : zipPath, 'base64')}`,
      type: 'application/zip',
      filename: EXPORT_ZIP,
      useInternalStorage: true,
      failOnCancel: false,
    });

    return {
      success: true,
      message: exportedMessage,
    };
  } catch (e: any) {
    return {
      success: false,
      message: e?.message || 'Export failed',
    };
  }
}

// ---------------------------------------------------------------------------
// Import
// ---------------------------------------------------------------------------

export async function importMeals(sourcePath?: string): Promise<{
  success: boolean;
  message: string;
  imported: number;
  skipped: number;
}> {
  try {
    let zipPath: string;

    if (sourcePath) {
      // Resolve file:// URI to absolute path for RNFSTurbo
      zipPath = resolveFilePath(sourcePath);
    } else {
      zipPath = `${RNFSTurbo.DocumentDirectoryPath}/${IMPORT_ZIP}.zip`;
    }

    if (!RNFSTurbo.exists(zipPath)) {
      const location =
        Platform.OS === 'android'
          ? 'Android/data/com.cmpayc.lazycalai/files/'
          : 'Files app > On My iPhone > LazyCalAI';
      return {
        success: false,
        message: `File not found: ${IMPORT_ZIP}.zip\n\nPlace the file in:\n${location}\n\nthen try again.`,
        imported: 0,
        skipped: 0,
      };
    }

    // Unzip to temp directory
    const tmp = tempDir();
    await unzip(zipPath, tmp);

    // unzipResult is the path where contents were extracted.
    // The zip may contain a root folder — search for data.csv and photos/.
    const csvPath = findFile(tmp, CSV_FILE);
    if (!csvPath) {
      return {
        success: false,
        message: `Corrupt archive: ${CSV_FILE} not found`,
        imported: 0,
        skipped: 0,
      };
    }

    const csvContent = RNFSTurbo.readFile(csvPath, 'utf8');
    const parsed = parseCSV(csvContent);

    if ('error' in parsed) {
      return {
        success: false,
        message: parsed.error,
        imported: 0,
        skipped: 0,
      };
    }

    // Locate the photos directory inside the extracted tree
    const photosSrc = findDir(tmp, PHOTOS_DIR);

    // Ensure destination photos directory exists
    const photosDest = `${RNFSTurbo.DocumentDirectoryPath}/${PHOTOS_DIR}`;
    ensureDir(photosDest);

    let imported = 0;
    let skipped = 0;

    // eslint-disable-next-line no-restricted-syntax
    for (const meal of parsed.meals) {
      // Copy photo if present
      if (meal.photoPath && photosSrc) {
        const srcPhoto = `${photosSrc}/${meal.photoPath}`;
        const destPhoto = `${photosDest}/${meal.photoPath}`;
        try {
          if (RNFSTurbo.exists(srcPhoto)) {
            RNFSTurbo.copyFile(srcPhoto, destPhoto);
            meal.photoPath = destPhoto;
          } else {
            meal.photoPath = '';
          }
        } catch {
          meal.photoPath = '';
        }
      } else {
        meal.photoPath = '';
      }

      // eslint-disable-next-line no-await-in-loop
      const wasImported = await importMeal(meal);
      if (wasImported) {
        imported++;
      } else {
        skipped++;
      }
    }

    // Clean up temp
    try {
      RNFSTurbo.unlink(tmp);
    } catch {
      // best effort
    }

    return {
      success: true,
      message: `Imported ${imported} meals${skipped > 0 ? `, ${skipped} skipped (already exist)` : ''}`,
      imported,
      skipped,
    };
  } catch (e: any) {
    return {
      success: false,
      message: e?.message || 'Import failed',
      imported: 0,
      skipped: 0,
    };
  }
}

// ---------------------------------------------------------------------------
// Tree walk helpers for finding files/dirs inside extracted zip
// ---------------------------------------------------------------------------

function findFile(root: string, name: string): string | null {
  // Check root itself
  const direct = `${root}/${name}`;
  if (RNFSTurbo.exists(direct)) {
    return direct;
  }

  // Check one level of subdirectories (zip root folder)
  let found: string | null = null;
  const items = RNFSTurbo.readDir(root);
  items.some((item) => {
    if (!found && item.isDirectory()) {
      const nested = `${root}/${item.name}/${name}`;
      if (RNFSTurbo.exists(nested)) {
        found = nested;
        return true;
      }
    }
    return false;
  });

  return found;
}

function findDir(root: string, name: string): string | null {
  // Check root itself
  const direct = `${root}/${name}`;
  if (RNFSTurbo.exists(direct)) {
    return direct;
  }

  // Check one level of subdirectories
  let found: string | null = null;
  const items = RNFSTurbo.readDir(root);
  items.some((item) => {
    if (!found && item.isDirectory()) {
      const nested = `${root}/${item.name}/${name}`;
      if (RNFSTurbo.exists(nested)) {
        found = nested;
        return true;
      }
    }
    return false;
  });

  return found;
}
