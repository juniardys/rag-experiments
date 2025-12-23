import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { AiMarketingModule } from '../ai-marketing/ai-marketing.module';

@Module({
  imports: [AiMarketingModule],
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}

