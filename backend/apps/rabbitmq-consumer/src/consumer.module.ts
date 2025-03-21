import { Module } from '@nestjs/common';
import { ConsumerService } from './consumer.service';

@Module({
  imports: [],
  controllers: [ConsumerService],
  providers: [],
})
export class ConsumerModule {}
