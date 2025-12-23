import { Module } from '@nestjs/common';
import { ExecutorService } from './executor.service';
import { DatabaseModule } from '../database/database.module';
import { ConfigModule } from '../config/config.module';

@Module({
  imports: [DatabaseModule, ConfigModule],
  providers: [ExecutorService],
  exports: [ExecutorService],
})
export class ExecutorModule {}

