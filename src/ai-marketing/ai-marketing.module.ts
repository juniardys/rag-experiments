import { Module } from '@nestjs/common';
import { AiMarketingService } from './ai-marketing.service';
import { ToolsModule } from '../tools/tools.module';
import { ExecutorModule } from '../executor/executor.module';
import { ConfigModule } from '../config/config.module';

@Module({
  imports: [ToolsModule, ExecutorModule, ConfigModule],
  providers: [AiMarketingService],
  exports: [AiMarketingService],
})
export class AiMarketingModule {}

