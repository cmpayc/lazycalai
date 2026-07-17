import Config from 'react-native-config';

import { getDeviceId } from '@utils/deviceId';
import { useSettingsStore } from '@store/settingsStore';
import { AIProvider, FoodAnalysisResult, ProviderConfig } from '../types';
import { fetchWithTimeout, validateResult } from './shared';

export class DemoProvider implements AIProvider {
  private language?: string;

  constructor(config: ProviderConfig) {
    this.language = config.language;
  }

  async analyzeFood(imageBase64: string): Promise<FoodAnalysisResult> {
    const body = JSON.stringify({
      image: imageBase64,
      language: this.language,
    });
    const response = await fetchWithTimeout(Config.DEMO_API_URL ?? '', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-APP-ID': getDeviceId(),
      },
      body,
    });

    const remaining = response.headers.get('X-RateLimit-Remaining');
    if (typeof remaining !== 'undefined' && remaining !== null) {
      const attempts = parseInt(remaining, 10);
      if (!Number.isNaN(attempts)) {
        useSettingsStore.getState().updateSettings({ demoAttempts: attempts });
      }
    }

    if (!response.ok) {
      const errorJson = await response.json();
      if (errorJson?.message) {
        throw new Error(
          `Demo API error (${response.status}): ${errorJson?.message}`,
        );
      }
      const errorText = await response.text();
      throw new Error(`Demo API error (${response.status}): ${errorText}`);
    }

    const content = await response.json();
    if (!content) {
      throw new Error('Demo API returned empty response');
    }

    return validateResult(content);
  }
}
