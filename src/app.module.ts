import { Module, ValidationPipe } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from './config/config.module';
import { DatabaseModule } from './database/database.module';
import { ExecutorModule } from './executor/executor.module';
import { AiMarketingModule } from './ai-marketing/ai-marketing.module';
import { ChatModule } from './chat/chat.module';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    ExecutorModule,
    AiMarketingModule,
    ChatModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    },
  ],
})
export class AppModule {}
