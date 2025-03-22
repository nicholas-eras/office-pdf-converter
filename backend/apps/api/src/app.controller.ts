import { Body, Controller, Get, Param } from '@nestjs/common';
import { RabbitMqService } from './rabbitmq/rabbitmq.service';

@Controller()
export class AppController {
  constructor(private readonly rabbitMqService: RabbitMqService) {}

  @Get("default-nest/:filename")
  triggerEvent(
    @Param('filename') filename: string,
   ) {
    return this.rabbitMqService.sendMessage(filename);
  }
}
