import ImageResizer from '@bam.tech/react-native-image-resizer';
import RNFSTurbo from 'react-native-fs-turbo';
import uuid from 'react-native-uuid';

const MAX_WIDTH = 1024;
const MAX_HEIGHT = 1024;
const QUALITY = 80;

/**
 * Compresses and resizes an image to max 1024x1024, JPEG quality 80.
 * Does NOT delete the source file — the caller is responsible for cleanup.
 * Returns the sanitized file path (no file:// prefix).
 *
 * Orientation is taken from the source file's EXIF tag, which both the camera
 * and the gallery picker write. ImageResizer reads that tag and bakes the
 * correct rotation into the output pixels, so no manual rotation is applied
 * here — doing so would rotate the image a second time.
 *
 * The source must be passed to ImageResizer with a URI scheme. On Android the
 * EXIF read goes through contentResolver.openInputStream, which fails silently
 * (leaving the image unrotated) for a bare filesystem path like the one
 * VisionCamera returns. A file:// prefix makes the EXIF orientation readable.
 *
 * @param photoPath - path to the source image
 */
export async function compressImage(photoPath: string): Promise<string> {
  const sourceUri = /^[a-z]+:\/\//i.test(photoPath)
    ? photoPath
    : `file://${photoPath}`;
  const result = await ImageResizer.createResizedImage(
    sourceUri,
    MAX_WIDTH,
    MAX_HEIGHT,
    'JPEG',
    QUALITY,
    0,
    undefined,
  );
  const newName = `${uuid.v4()}.jpg`;
  const newPath = `file://${RNFSTurbo.CachesDirectoryPath}/meals/${newName}`;
  if (!RNFSTurbo.exists(`${RNFSTurbo.CachesDirectoryPath}/meals`)) {
    RNFSTurbo.mkdir(`${RNFSTurbo.CachesDirectoryPath}/meals`);
  }
  RNFSTurbo.moveFile(result.uri, newPath);
  return newPath.replace('file://', '');
}
