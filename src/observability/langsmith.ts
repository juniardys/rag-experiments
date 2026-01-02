import type { RunnableConfig } from '@langchain/core/runnables';
import { ConfigService } from '../config/config.service';
import { LangChainTracer } from "@langchain/core/tracers/tracer_langchain";


type TraceMeta = {
  userId: string;
  requestId?: string;
  query?: string;
  service?: string;
};

/**
 * Build LangSmith tracer instance if tracing is enabled and credentials exist.
 */
export function createLangsmithTracer(
  configService: ConfigService,
): LangChainTracer | undefined {
  if (!configService.langsmithTracing) return undefined;

  const apiKey = configService.langsmithApiKey;
  if (!apiKey) return undefined;

  return new LangChainTracer({
    projectName: configService.langsmithProject || 'ai-marketing',
  });
}

/**
 * Build a RunnableConfig enriched with LangSmith callbacks + metadata.
 */
export function buildTraceConfig(
  configService: ConfigService,
  meta: TraceMeta,
): RunnableConfig | undefined {
  const tracer = createLangsmithTracer(configService);
  if (!tracer) return undefined;

  return {
    callbacks: [tracer],
    metadata: {
      service: meta.service || 'ai-marketing',
      userId: meta.userId,
      requestId: meta.requestId,
      query: meta.query,
    },
  };
}

