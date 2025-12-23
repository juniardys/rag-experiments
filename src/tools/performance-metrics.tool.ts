import { DynamicStructuredTool } from '@langchain/core/tools';
import { ExecutorService } from '../executor/executor.service';
import {
  PerformanceMetricsInputSchema,
  type PerformanceMetricsInput,
} from './schemas/tool-input.schemas';

export function createPerformanceMetricsTool(
  executor: ExecutorService,
  userId: string,
): DynamicStructuredTool {
  return new DynamicStructuredTool({
    name: 'performance_metrics',
    description:
      'Get aggregated performance metrics for posts, KOLs, or overall statistics. Use this when the user asks about performance, engagement, likes, comments, or wants to compare metrics. Use to analyze which KOLs or posts performed best. Examples: "which posts got the most likes", "show me performance metrics for today", "compare KOL performance", "what was the engagement rate", "which content performed best".',
    schema: PerformanceMetricsInputSchema,
    func: async (input: PerformanceMetricsInput) => {
      try {
        const result = await executor.executePerformanceMetrics(userId, input);
        return JSON.stringify(result);
      } catch (error) {
        return JSON.stringify({
          error: error instanceof Error ? error.message : String(error),
          type: 'performance_metrics',
        });
      }
    },
  });
}

