import { Injectable, Logger } from '@nestjs/common';
import { AiMarketingService } from '../ai-marketing/ai-marketing.service';
import { ChatResponseDto } from './dto/chat-response.dto';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(private readonly aiMarketing: AiMarketingService) {}

  /**
   * Process user query using AI Marketing service with tool calling
   */
  async processQuery(query: string, userId: string): Promise<ChatResponseDto> {
    this.logger.log(`Processing query for user ${userId}: ${query}`);

    try {
      const response = await this.aiMarketing.processQuery(userId, query);
      return {
        explanation: response,
        insights: [],
        data: null,
      };
    } catch (error) {
      this.logger.error(
        `Error processing query: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }
}

