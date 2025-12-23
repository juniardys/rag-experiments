import { Module } from '@nestjs/common';
import { ExecutorModule } from '../executor/executor.module';
import { DatabaseModule } from '../database/database.module';
import { ExecutorService } from '../executor/executor.service';
import { DynamicStructuredTool } from '@langchain/core/tools';
import { createKolRecommendationTool } from './kol-recommendation.tool';
import { createPostAnalysisTool } from './post-analysis.tool';
import { createPerformanceMetricsTool } from './performance-metrics.tool';
import { createNaturalLanguageQueryTool } from './natural-language-query.tool';

@Module({
  imports: [ExecutorModule, DatabaseModule],
  exports: [],
})
export class ToolsModule {}

/**
 * Factory function to create all tools with userId context
 * @param executor - ExecutorService instance
 * @param userId - User ID for scoping queries
 * @returns Array of StructuredTool instances
 */
export function createTools(
  executor: ExecutorService,
  userId: string,
): DynamicStructuredTool[] {
  return [
    createKolRecommendationTool(executor, userId),
    createPostAnalysisTool(executor, userId),
    createPerformanceMetricsTool(executor, userId),
    createNaturalLanguageQueryTool(executor, userId),
  ];
}

