import { AIProvider, FoodAnalysisResult, ProviderConfig } from '../types';
import {
  fetchWithTimeout,
  getFoodAnalysisPrompt,
  parseAnalysisResponse,
} from './shared';

/**
 * Free-tier keys hit 503 UNAVAILABLE when the main model is out of capacity.
 * The lite model has separate capacity, so it is worth one retry.
 */
const FREE_TIER_FALLBACK_MODEL = 'gemini-3.5-flash-lite';

export class GeminiProvider implements AIProvider {
  private apiKey: string;

  private model: string;

  private language?: string;

  private fallbackModel?: string;

  constructor(config: ProviderConfig, options?: { freeTier?: boolean }) {
    this.apiKey = config.apiKey;
    this.model = config.model ?? 'gemini-3.5-flash';
    this.language = config.language;
    if (options?.freeTier && this.model !== FREE_TIER_FALLBACK_MODEL) {
      this.fallbackModel = FREE_TIER_FALLBACK_MODEL;
    }
  }

  async analyzeFood(imageBase64: string): Promise<FoodAnalysisResult> {
    const prompt = getFoodAnalysisPrompt(this.language);
    const body = JSON.stringify({
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: 'image/jpeg',
                data: imageBase64,
              },
            },
          ],
        },
      ],
      generationConfig: {
        maxOutputTokens: 4096,
      },
    });

    let response = await this.generateContent(this.model, body);

    // 503 and 429 means the model is out of capacity, not that the request
    // is bad, so a free-tier key gets one more try on the lite model.
    if ([503, 429].includes(response.status) && this.fallbackModel) {
      response = await this.generateContent(this.fallbackModel, body);
    }

    if (!response.ok) {
      const errorJson = await response.json();
      if (errorJson?.error?.message) {
        throw new Error(
          `Gemini API error (${response.status}): ${errorJson?.error?.message}`,
        );
      }
      const errorText = await response.text();
      throw new Error(`Gemini API error (${response.status}): ${errorText}`);
    }

    const json = await response.json();
    const content = json.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!content) {
      throw new Error('Gemini API returned empty response');
    }

    return parseAnalysisResponse(content);
  }

  private generateContent(model: string, body: string): Promise<Response> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.apiKey}`;

    return fetchWithTimeout(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body,
    });
  }
}
