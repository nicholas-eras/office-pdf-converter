import { Controller, Get } from '@nestjs/common';
import { RabbitMqService } from './rabbitmq/rabbitmq.service';

@Controller()
export class AppController {
  constructor(private readonly rabbitMqService: RabbitMqService) {}

  @Get("default-nest")
  triggerEvent() {
    return this.rabbitMqService.sendMessage();
  }
}
