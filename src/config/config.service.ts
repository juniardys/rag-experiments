import { Injectable } from '@nestjs/common';

@Injectable()
export class ConfigService {
  get databaseUrl(): string {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error('DATABASE_URL environment variable is required');
    }
    return url;
  }

  get openRouterApiKey(): string {
    const key = process.env.OPENROUTER_API_KEY;
    if (!key) {
      throw new Error('OPENROUTER_API_KEY environment variable is required');
    }
    return key;
  }

  get openRouterModel(): string {
    return process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini';
  }

  get embeddingModel(): string {
    return process.env.EMBEDDING_MODEL || 'openai/text-embedding-3-small';
  }

  get toolCallingModel(): string {
    return process.env.TOOL_CALLING_MODEL || 'nex-agi/deepseek-v3.1-nex-n1:free';
  }

  get port(): number {
    return parseInt(process.env.PORT || '3000', 10);
  }
}

