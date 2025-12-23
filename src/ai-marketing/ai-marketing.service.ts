import { Injectable, Logger } from '@nestjs/common';
import { ChatOpenAI } from '@langchain/openai';
import { createAgent } from 'langchain';
import { DynamicStructuredTool } from '@langchain/core/tools';
import { ConfigService } from '../config/config.service';
import { ExecutorService } from '../executor/executor.service';
import { createTools } from '../tools/tools.module';

@Injectable()
export class AiMarketingService {
  private readonly logger = new Logger(AiMarketingService.name);
  private readonly llm: ChatOpenAI;

  constructor(
    private readonly configService: ConfigService,
    private readonly executor: ExecutorService,
  ) {
    this.llm = new ChatOpenAI({
      modelName: this.configService.toolCallingModel,
      apiKey: this.configService.openRouterApiKey,
      configuration: {
        baseURL: 'https://openrouter.ai/api/v1',
      },
      temperature: 0,
    });
  }

  /**
   * Wrap tool with argument cleaning
   * Ensures tool arguments are cleaned before execution
   */
  private wrapToolWithCleaning(tool: DynamicStructuredTool): DynamicStructuredTool {
    const originalFunc = tool.func;
    const toolName = tool.name;

    // Create new tool instance with wrapped func
    return new DynamicStructuredTool({
      name: tool.name,
      description: tool.description,
      schema: tool.schema,
      func: async (args: any) => {
        const cleanedArgs = this.cleanToolArgs(toolName, args);
        return await originalFunc(cleanedArgs);
      },
    });
  }

  /**
   * Clean and validate tool arguments before invocation
   * Removes invalid UUIDs, empty strings, and null values from optional fields
   */
  private cleanToolArgs(toolName: string, args: any): any {
    const cleaned = { ...args };

    // Clean post_analysis tool args
    if (toolName === 'post_analysis' && cleaned.filters) {
      // Remove kol_id if it's not a valid UUID or is empty
      if (cleaned.filters.kol_id) {
        const uuidRegex =
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (
          !uuidRegex.test(cleaned.filters.kol_id) ||
          cleaned.filters.kol_id.trim() === ''
        ) {
          delete cleaned.filters.kol_id;
          this.logger.debug(
            `Removed invalid kol_id from post_analysis args: ${cleaned.filters.kol_id}`,
          );
        }
      }
    }

    // Clean performance_metrics tool args
    if (toolName === 'performance_metrics' && cleaned.filters?.kol_ids) {
      // Filter out invalid UUIDs
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      cleaned.filters.kol_ids = cleaned.filters.kol_ids.filter(
        (id: string) => id && uuidRegex.test(id),
      );
      if (cleaned.filters.kol_ids.length === 0) {
        delete cleaned.filters.kol_ids;
      }
    }

    return cleaned;
  }

  /**
   * Get system prompt for AI Marketing assistant
   */
  private getSystemPrompt(): string {
    return `You are an AI marketing analyst assistant. Your role is to help users analyze their KOL (Key Opinion Leader) and content performance.

CRITICAL RULES:
1. ALWAYS use available tools FIRST before asking for more information
2. You have access to the user's database with:
   - KOL data (followers, niche, social media profiles)
   - Post data (captions, hashtags, likes, comments, dates, platforms)
   - Performance metrics (aggregated stats)
3. When user asks a question:
   - Think about which tools can help answer it
   - Use tools to gather data
   - Analyze the results
   - Provide insights based on the data
4. Only ask for additional information if tools return empty results
5. You can use multiple tools sequentially to gather comprehensive data
6. If one tool doesn't provide enough data, use additional tools to get complete information

Available Tools:
- kol_recommendation: Find KOLs by criteria (use when user asks about influencers, creators, or wants to find KOLs). Parameters: kol_criteria (follower_range, niches), limit.
- post_analysis: Get posts with filters (use when user asks about specific posts, content, or wants to see what was posted). Parameters: filters (kol_id as UUID if you have it, date_range as ISO datetime, platform), limit. IMPORTANT: Only include kol_id if you have a valid UUID. If you don't have a specific KOL ID, omit it and use date_range or platform filters instead.
- performance_metrics: Get performance stats (use when user asks about metrics, engagement, likes, comments, or wants to analyze performance). Parameters: scope (kol/post/overall), filters (kol_ids as UUID array if you have them, date_range, platform).
- natural_language_query: Semantic search (use when user asks questions or wants to find content by meaning/topic). Parameters: query_text, limit, similarity_threshold.

Example Workflow:
User: "Which KOLs performed best today?"
1. Use post_analysis to get today's posts
2. Use performance_metrics to get today's metrics
3. Analyze and provide insights

User: "Siapa KOL yang berpengaruh hari ini?"
1. Use post_analysis with date_range=today to get today's posts
2. Use performance_metrics with scope=post and date_range=today to get performance data
3. Analyze which KOLs and posts performed best
4. Provide insights about which KOLs were most influential

Always be proactive in using tools to help the user. Never ask for more information until you have tried using the available tools first.

IMPORTANT: You can call tools multiple times in sequence if needed. After getting tool results, analyze them and decide if you need more tools or can provide the final answer. Stop calling tools when you have enough information to answer the user's question comprehensively.`;
  }

  /**
   * Process user query with tool calling using createAgent and stream
   * LangChain automatically handles multi-turn tool calling
   * LLM will decide which tools to call based on the query
   */
  async processQuery(userId: string, query: string): Promise<string> {
    this.logger.debug(`Processing query for user ${userId}: ${query}`);

    try {
      // Create tools with userId context
      const rawTools = createTools(this.executor, userId);

      // Wrap tools with argument cleaning
      const tools = rawTools.map((tool) => this.wrapToolWithCleaning(tool));

      // Create agent with tools and system prompt
      // LangChain will automatically handle tool calling loop
      const agent = createAgent({
        model: this.llm,
        tools: tools,
        systemPrompt: this.getSystemPrompt(),
      });

      // Start stream - LangChain handles tool execution automatically
      const stream = await agent.stream({
        messages: [{ role: 'user', content: query }],
      });

      let finalResponse = '';
      let stepCount = 0;
      const allMessages: any[] = [];

      // Process stream events
      for await (const step of stream) {
        stepCount++;
        this.logger.debug(`Processing stream step ${stepCount}`);

        // Handle each update in the step
        for (const update of Object.values(step)) {
          if (update && typeof update === 'object' && 'messages' in update) {
            // Process messages from this step
            for (const message of update.messages) {
              allMessages.push(message);

              // Log tool calls if present
              if ('tool_calls' in message && message.tool_calls && Array.isArray(message.tool_calls) && message.tool_calls.length > 0) {
                const toolNames = message.tool_calls
                  .map((tc: any) => tc.name)
                  .join(', ');
                this.logger.debug(
                  `Tool calls detected in step ${stepCount}: ${toolNames}`,
                );
              }

              // Extract text response (update finalResponse with latest)
              if ('content' in message && message.content) {
                const content = message.content;
                if (typeof content === 'string' && content.trim()) {
                  // Only update if this is not a tool message
                  if (!('tool_call_id' in message)) {
                    finalResponse = content;
                    this.logger.debug(
                      `Response updated in step ${stepCount}`,
                    );
                  }
                }
              }
            }
          }
        }
      }

      // If no final response, try to get from last AI message
      if (!finalResponse) {
        // Find last message with content that's not a tool message
        for (let i = allMessages.length - 1; i >= 0; i--) {
          const msg = allMessages[i];
          if ('content' in msg && msg.content && typeof msg.content === 'string' && !('tool_call_id' in msg)) {
            finalResponse = msg.content;
            break;
          }
        }
      }

      if (!finalResponse) {
        this.logger.warn('No final response generated from stream');
        return 'I apologize, but I was unable to generate a response. Please try rephrasing your query.';
      }

      this.logger.debug(`Stream completed after ${stepCount} step(s)`);
      return finalResponse;
    } catch (error) {
      this.logger.error(
        `Error processing query: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }
}

