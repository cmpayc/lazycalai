import RNFSTurbo from 'react-native-fs-turbo';

/**
 * Meal photos live in the app's Documents directory, but the DB persists only
 * the file name, never an absolute path. On iOS the app-container UUID inside an
 * absolute path (…/Application/<UUID>/Documents/…) changes on reinstall and on
 * restore-from-backup, which would orphan every stored path. Rebuilding the path
 * from the current DocumentDirectoryPath at read time keeps photos reachable.
 */

/** Absolute directory that holds saved meal photos in the current install. */
export function mealsDir(): string {
  return `${RNFSTurbo.DocumentDirectoryPath}/meals`;
}

/**
 * Reduce a stored value to a bare file name. Handles legacy rows that still
 * hold an absolute path or a file:// URI.
 */
export function mealPhotoFileName(stored?: string | null): string {
  if (!stored) return '';
  return stored.split('/').pop() ?? '';
}

/** Absolute path to a stored meal photo, or '' when there is none. */
export function resolveMealPhotoPath(stored?: string | null): string {
  const name = mealPhotoFileName(stored);
  return name ? `${mealsDir()}/${name}` : '';
}

/** file:// URI for an <Image> source, or '' when there is no photo. */
export function mealPhotoUri(stored?: string | null): string {
  const path = resolveMealPhotoPath(stored);
  return path ? `file://${path}` : '';
}
