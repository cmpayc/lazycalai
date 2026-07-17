import { AIProvider, FoodAnalysisResult, ProviderConfig } from '../types';
import {
  fetchWithTimeout,
  getFoodAnalysisPrompt,
  parseAnalysisResponse,
} from './shared';

export class OpenRouterProvider implements AIProvider {
  private apiKey: string;

  private model: string;

  private language?: string;

  constructor(config: ProviderConfig) {
    this.apiKey = config.apiKey;
    this.model = config.model ?? 'openai/gpt-4o';
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
            { type: 'text', text: prompt },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${imageBase64}`,
                detail: 'high',
              },
            },
          ],
        },
      ],
      max_tokens: 1000,
      temperature: 0,
    });

    const response = await fetchWithTimeout(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
          'HTTP-Referer': 'https://foodcountai.app',
          'X-Title': 'LazyCalAI',
        },
        body,
      },
    );

    if (!response.ok) {
      const errorJson = await response.json();
      if (errorJson?.error?.message) {
        throw new Error(
          `OpenRouter API error (${response.status}): ${errorJson?.error?.message}`,
        );
      }
      const errorText = await response.text();
      throw new Error(
        `OpenRouter API error (${response.status}): ${errorText}`,
      );
    }

    const json = await response.json();
    const content = json.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('OpenRouter API returned empty response');
    }

    return parseAnalysisResponse(content);
  }
}
