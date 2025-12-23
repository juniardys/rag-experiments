import { DynamicStructuredTool } from '@langchain/core/tools';
import { ExecutorService } from '../executor/executor.service';
import { PostAnalysisInputSchema, type PostAnalysisInput } from './schemas/tool-input.schemas';

export function createPostAnalysisTool(
  executor: ExecutorService,
  userId: string,
): DynamicStructuredTool {
  return new DynamicStructuredTool({
    name: 'post_analysis',
    description:
      'Analyze social media posts with filters like KOL ID (must be valid UUID if provided), platform, date range. Use this when the user asks about specific posts, content, or wants to see what KOLs posted. Use to find posts related to a topic, date, or KOL. For date_range, use ISO datetime format (e.g., "2024-12-22T00:00:00Z"). If you don\'t have a specific KOL ID, omit the kol_id field. Examples: "show me posts from today", "what did KOL X post", "find posts about fashion haul", "get posts from last week".',
    schema: PostAnalysisInputSchema,
    func: async (input: PostAnalysisInput) => {
      try {
        const result = await executor.executePostAnalysis(userId, input);
        return JSON.stringify(result);
      } catch (error) {
        return JSON.stringify({
          error: error instanceof Error ? error.message : String(error),
          type: 'post_analysis',
        });
      }
    },
  });
}

