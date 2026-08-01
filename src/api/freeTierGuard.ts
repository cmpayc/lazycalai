import i18n from 'i18next';

import { AIProvider, FoodAnalysisResult } from '../types';
import { fetchWithTimeout } from './shared';

/**
 * A Gemini model with no free-tier quota. A key limited to the free tier is
 * refused for this model with a FreeTier quota violation, while a key with
 * billing enabled is served normally. That difference is what tells the two
 * apart.
 *
 * If Google ever grants this model free-tier quota, every key starts looking
 * paid and the check has to be pointed at another paid-only model.
 */
export const FREE_TIER_PROBE_MODEL = 'gemini-pro-latest';

const QUOTA_FAILURE_TYPE = 'type.googleapis.com/google.rpc.QuotaFailure';

interface QuotaViolation {
  quotaId?: string;
  quotaMetric?: string;
}

interface ErrorDetail {
  '@type'?: string;
  violations?: QuotaViolation[];
}

interface GeminiErrorBody {
  error?: {
    message?: string;
    details?: ErrorDetail[];
  };
}

function isFreeTierViolation(violation: QuotaViolation): boolean {
  const fields = `${violation.quotaId ?? ''} ${violation.quotaMetric ?? ''}`;
  return fields.toLowerCase().replace(/_/g, '').includes('freetier');
}

function hasFreeTierQuotaFailure(body: GeminiErrorBody): boolean {
  const details = body.error?.details;
  if (!Array.isArray(details)) return false;
  return details.some(
    (detail) =>
      detail['@type'] === QUOTA_FAILURE_TYPE &&
      Array.isArray(detail.violations) &&
      detail.violations.some(isFreeTierViolation),
  );
}

/**
 * Throws unless the key is positively identified as free-tier only. Anything
 * ambiguous (network failure, unexpected status, unparseable body) is treated
 * as a failed check rather than a pass.
 */
export async function assertFreeTierKey(apiKey: string): Promise<void> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${FREE_TIER_PROBE_MODEL}:generateContent?key=${apiKey}`;

  let response: Response;
  try {
    response = await fetchWithTimeout(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: 'Ping' }] }],
      }),
    });
  } catch {
    throw new Error(i18n.t('errors.keyCheckFailed'));
  }

  // The probe model answered, so this key is not restricted to the free tier.
  if (response.ok) {
    throw new Error(i18n.t('errors.paidKeyNotAllowed'));
  }

  let body: GeminiErrorBody;
  try {
    body = (await response.json()) as GeminiErrorBody;
  } catch {
    throw new Error(i18n.t('errors.keyCheckFailed'));
  }

  if (response.status === 429 && hasFreeTierQuotaFailure(body)) {
    return;
  }

  const reason = body.error?.message;
  throw new Error(
    reason
      ? i18n.t('errors.keyCheckFailedReason', { reason })
      : i18n.t('errors.keyCheckFailed'),
  );
}

/** Re-checks the key before every analysis, then delegates to the provider. */
export class FreeTierGuardedProvider implements AIProvider {
  private apiKey: string;

  private provider: AIProvider;

  constructor(apiKey: string, provider: AIProvider) {
    this.apiKey = apiKey;
    this.provider = provider;
  }

  async analyzeFood(imageBase64: string): Promise<FoodAnalysisResult> {
    await assertFreeTierKey(this.apiKey);
    return this.provider.analyzeFood(imageBase64);
  }
}
