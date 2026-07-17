import { AIProvider, AIProviderType, ProviderConfig } from '../types';
import { OpenAIProvider } from './openai';
import { ClaudeProvider } from './claude';
import { GeminiProvider } from './gemini';
import { OpenRouterProvider } from './openrouter';
import { QwenProvider } from './qwen';
import { GrokProvider } from './grok';
import { DemoProvider } from './demo';

export function createProvider(
  type: AIProviderType,
  config: ProviderConfig,
): AIProvider {
  switch (type) {
    case 'openai':
      return new OpenAIProvider(config);
    case 'claude':
      return new ClaudeProvider(config);
    case 'gemini':
      return new GeminiProvider(config);
    case 'openrouter':
      return new OpenRouterProvider(config);
    case 'qwen':
      return new QwenProvider(config);
    case 'grok':
      return new GrokProvider(config);
    case 'demo':
      return new DemoProvider(config);
    default:
      throw new Error(`Unsupported AI provider: ${type}`);
  }
}
