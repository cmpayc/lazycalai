/**
 * CodePush CLI config (release-time only; not bundled into the app).
 *
 * Uploads OTA bundles and release-history JSON to Cloudflare R2 over its
 * S3-compatible API, and reads history back. Object keys mirror the runtime
 * fetcher in `src/utils/codePush.ts`:
 *   history/{platform}/{bundleId}/{version}.json  -> release history
 *   {platform}/{bundleId}/bundles/{packageHash}   -> bundle files
 *
 * Required env vars (e.g. in CI or a local .env.codepush you don't commit):
 *   R2_ACCOUNT_ID          Cloudflare account id
 *   R2_ACCESS_KEY_ID       R2 API token access key id
 *   R2_SECRET_ACCESS_KEY   R2 API token secret
 *   R2_BUCKET              R2 bucket name
 *   CODE_PUSH_CDN_BASE_URL Public base URL mapped to the bucket root
 *                          (custom domain or r2.dev), no trailing slash.
 */
import fs from 'fs';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import type {
  CliConfigInterface,
  ReleaseHistoryInterface,
} from '@bravemobile/react-native-code-push';

// Load CLI-only secrets for local runs. In CI, env vars are injected directly
// and the file won't exist, so ignore a missing file.
try {
  process.loadEnvFile('.env.codepush');
} catch {
  // no .env.codepush present; rely on the ambient environment
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

const CDN_BASE_URL = requireEnv('CODE_PUSH_CDN_BASE_URL').replace(/\/$/, '');
const R2_BUCKET = requireEnv('R2_BUCKET');

/**
 * Per-platform native bundle id. Must match `DeviceInfo.getBundleId()` at
 * runtime, which currently differs between platforms in this project.
 */
const BUNDLE_ID: Record<'ios' | 'android', string> = {
  ios: 'com.cmpayc.lazycalai',
  android: 'com.cmpayc.lazycalai',
};

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${requireEnv('R2_ACCOUNT_ID')}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: requireEnv('R2_ACCESS_KEY_ID'),
    secretAccessKey: requireEnv('R2_SECRET_ACCESS_KEY'),
  },
});

const historyKey = (platform: 'ios' | 'android', binaryVersion: string) =>
  `history/${platform}/${BUNDLE_ID[platform]}/${binaryVersion}.json`;

async function putObject(
  key: string,
  body: Buffer | string,
  contentType: string,
): Promise<void> {
  await r2.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );
}

const Config: CliConfigInterface = {
  bundleUploader: async (source, platform) => {
    // `source` is the built bundle path; its filename equals the packageHash.
    const fileName = source.split('/').pop() as string;
    const key = `${platform}/${BUNDLE_ID[platform]}/bundles/${fileName}`;
    await putObject(key, fs.readFileSync(source), 'application/octet-stream');
    return { downloadUrl: `${CDN_BASE_URL}/${key}` };
  },

  getReleaseHistory: async (targetBinaryVersion, platform) => {
    try {
      const res = await r2.send(
        new GetObjectCommand({
          Bucket: R2_BUCKET,
          Key: historyKey(platform, targetBinaryVersion),
        }),
      );
      const body = await res.Body?.transformToString();
      return body ? (JSON.parse(body) as ReleaseHistoryInterface) : {};
    } catch (error) {
      // No history file yet for this binary version -> start fresh.
      if ((error as { name?: string }).name === 'NoSuchKey') return {};
      throw error;
    }
  },

  setReleaseHistory: async (
    targetBinaryVersion,
    _jsonFilePath,
    releaseInfo,
    platform,
  ) => {
    await putObject(
      historyKey(platform, targetBinaryVersion),
      JSON.stringify(releaseInfo),
      'application/json',
    );
  },
};

module.exports = Config;
