import { AIProvider, FoodAnalysisResult, ProviderConfig } from '../types';
import {
  fetchWithTimeout,
  getFoodAnalysisPrompt,
  parseAnalysisResponse,
} from './shared';

export class GeminiProvider implements AIProvider {
  private apiKey: string;

  private model: string;

  private language?: string;

  constructor(config: ProviderConfig) {
    this.apiKey = config.apiKey;
    this.model = config.model ?? 'gemini-3.1-flash-image-preview';
    this.language = config.language;
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

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;

    const response = await fetchWithTimeout(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body,
    });

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
}
