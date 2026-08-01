import { AIProviderType } from '@types';

/**
 * When set, this platform offers exactly one provider and one model: the
 * provider and model pickers are hidden and no other provider can be built.
 * Android keeps the full picker, so both values are null here. iOS overrides
 * this module through providerPolicy.ios.ts.
 */
export const LOCKED_PROVIDER: AIProviderType | null = null;

export const LOCKED_MODEL: string | null = null;
