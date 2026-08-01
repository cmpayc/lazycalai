import { AIProvider, AIProviderType, ProviderConfig } from '../types';
import { GeminiProvider } from './gemini';
import { FreeTierGuardedProvider } from './freeTierGuard';

/**
 * iOS ships Gemini only, on a free-tier key. No other provider client is
 * imported here, so none of them end up in the iOS bundle.
 */
export function createProvider(
  type: AIProviderType,
  config: ProviderConfig,
): AIProvider {
  if (type !== 'gemini') {
    throw new Error(`Unsupported AI provider: ${type}`);
  }
  return new FreeTierGuardedProvider(
    config.apiKey,
    new GeminiProvider(config, { freeTier: true }),
  );
}
