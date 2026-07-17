import { AIProvider, FoodAnalysisResult, ProviderConfig } from '../types';
import {
  fetchWithTimeout,
  getFoodAnalysisPrompt,
  parseAnalysisResponse,
} from './shared';

export class ClaudeProvider implements AIProvider {
  private apiKey: string;

  private model: string;

  private language?: string;

  constructor(config: ProviderConfig) {
    this.apiKey = config.apiKey;
    this.model = config.model ?? 'claude-sonnet-5';
    this.language = config.language;
  }

  async analyzeFood(imageBase64: string): Promise<FoodAnalysisResult> {
    const prompt = getFoodAnalysisPrompt(this.language);
    const body = JSON.stringify({
      model: this.model,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/jpeg',
                data: imageBase64,
              },
            },
            {
              type: 'text',
              text: prompt,
            },
          ],
        },
      ],
      max_tokens: 1000,
    });

    const response = await fetchWithTimeout(
      'https://api.anthropic.com/v1/messages',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body,
      },
    );

    if (!response.ok) {
      const errorJson = await response.json();
      if (errorJson?.error?.message) {
        throw new Error(
          `Claude API error (${response.status}): ${errorJson?.error?.message}`,
        );
      }
      const errorText = await response.text();
      throw new Error(`Claude API error (${response.status}): ${errorText}`);
    }

    const json = await response.json();
    const content = json.content?.[0]?.text;
    if (!content) {
      throw new Error('Claude API returned empty response');
    }

    return parseAnalysisResponse(content);
  }
}
