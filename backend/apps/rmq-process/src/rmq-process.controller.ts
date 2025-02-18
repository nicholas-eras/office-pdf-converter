import { Controller, Get } from '@nestjs/common';
import { ReqProcessService } from './rmq-process.service';

@Controller()
export class ReqProcessController {
  constructor(private readonly reqProcessService: ReqProcessService) {}

  @Get()
  getHello(): string {
    return this.reqProcessService.getHello();
  }
}
