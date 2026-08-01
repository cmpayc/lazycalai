import { AIProviderType } from '@types';

/**
 * iOS is locked to Gemini on a free-tier key. See providerPolicy.ts for what
 * these values mean and providerFactory.ios.ts for how the lock is enforced.
 */
export const LOCKED_PROVIDER: AIProviderType | null = 'gemini';

export const LOCKED_MODEL: string | null = 'gemini-3.5-flash';
