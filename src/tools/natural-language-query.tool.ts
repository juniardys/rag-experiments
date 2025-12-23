import { DynamicStructuredTool } from '@langchain/core/tools';
import { ExecutorService } from '../executor/executor.service';
import {
  NaturalLanguageQueryInputSchema,
  type NaturalLanguageQueryInput,
} from './schemas/tool-input.schemas';

export function createNaturalLanguageQueryTool(
  executor: ExecutorService,
  userId: string,
): DynamicStructuredTool {
  return new DynamicStructuredTool({
    name: 'natural_language_query',
    description:
      'Semantic search for posts using natural language. Use this for semantic search when the user asks questions or wants to find content by meaning. Use when user mentions topics, themes, or wants to find related content. Examples: "find posts about fashion trends", "show me content related to sustainable fashion", "what posts talk about summer collection", "search for haul videos".',
    schema: NaturalLanguageQueryInputSchema,
    func: async (input: NaturalLanguageQueryInput) => {
      try {
        const result = await executor.executeNaturalLanguageQuery(userId, input);
        return JSON.stringify(result);
      } catch (error) {
        return JSON.stringify({
          error: error instanceof Error ? error.message : String(error),
          type: 'natural_language_query',
        });
      }
    },
  });
}

