import { Module } from '@nestjs/common';
import { ReqProcessController } from './rmq-process.controller';
import { ReqProcessService } from './rmq-process.service';

@Module({
  imports: [],
  controllers: [ReqProcessController],
  providers: [ReqProcessService],
})
export class ReqProcessModule {}
