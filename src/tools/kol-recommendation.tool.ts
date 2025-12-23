import { DynamicStructuredTool } from '@langchain/core/tools';
import { ExecutorService } from '../executor/executor.service';
import { KolRecommendationInputSchema, type KolRecommendationInput } from './schemas/tool-input.schemas';

export function createKolRecommendationTool(
  executor: ExecutorService,
  userId: string,
): DynamicStructuredTool {
  return new DynamicStructuredTool({
    name: 'kol_recommendation',
    description:
      'Find and recommend KOLs (Key Opinion Leaders) based on criteria like follower count range, niche, etc. Use this when the user asks about influencers, KOLs, creators, or wants to find people by niche/followers. Use this to identify which KOLs might be relevant to a topic. Examples: "find KOLs in fashion niche", "who are the top influencers", "recommend creators with 10k-100k followers".',
    schema: KolRecommendationInputSchema,
    func: async (input: KolRecommendationInput) => {
      try {
        const result = await executor.executeKolRecommendation(userId, input);
        return JSON.stringify(result);
      } catch (error) {
        return JSON.stringify({
          error: error instanceof Error ? error.message : String(error),
          type: 'kol_recommendation',
        });
      }
    },
  });
}

