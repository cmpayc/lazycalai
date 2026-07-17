import { create } from 'zustand';

import { AIProvider } from '@types';
import { createProvider } from '@api/providerFactory';
import { useSettingsStore } from './settingsStore';

interface AIState {
  getProvider: () => AIProvider;
}

export const useAIStore = create<AIState>(() => ({
  getProvider: () => {
    const { aiProvider, apiKey, language, model } = useSettingsStore.getState();
    if (aiProvider !== 'demo' && !apiKey) {
      throw new Error('API key not configured');
    }
    return createProvider(aiProvider, { apiKey, language, model });
  },
}));
