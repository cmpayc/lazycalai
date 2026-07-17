import { Platform } from 'react-native';
import Config from 'react-native-config';
import DeviceInfo from 'react-native-device-info';
import type {
  ReleaseHistoryInterface,
  UpdateCheckRequest,
} from '@bravemobile/react-native-code-push';

/**
 * Base URL of the CDN that hosts the CodePush release-history JSON files.
 * Set via the CODE_PUSH_CDN_BASE_URL entry in `.env`. Release history is
 * fetched from:
 *   {CODE_PUSH_CDN_BASE_URL}/history/{platform}/{bundleId}/{appVersion}.json
 */
export const CODE_PUSH_CDN_BASE_URL = Config.CODE_PUSH_CDN_BASE_URL ?? '';

/**
 * Fetches the release history for the running binary's native version.
 *
 * This fork of react-native-code-push is serverless: instead of App Center it
 * reads a per-version release-history JSON from our own CDN. See
 * https://github.com/Soomgo-Mobile/react-native-code-push for the JSON format.
 */
export async function releaseHistoryFetcher(
  updateRequest: UpdateCheckRequest,
): Promise<ReleaseHistoryInterface> {
  const platform = Platform.OS;
  const bundleId = DeviceInfo.getBundleId();
  const url = `${CODE_PUSH_CDN_BASE_URL}/history/${platform}/${bundleId}/${updateRequest.app_version}.json`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `CodePush release history fetch failed: ${response.status} (${url})`,
    );
  }
  return (await response.json()) as ReleaseHistoryInterface;
}
