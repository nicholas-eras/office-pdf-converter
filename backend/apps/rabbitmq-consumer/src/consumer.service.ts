import { Controller, OnModuleInit } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { ColoredLogger } from './utils/colored-logger';

@Controller()
export class ConsumerService implements OnModuleInit {
  private readonly logger = new ColoredLogger("RabbitMQ Consumer");  
  
  onModuleInit() {
    this.logger.log('ConsumerService initialized and ready to receive messages');
  }

  @EventPattern('default-nestjs-rmq')
  handleFileMessage(@Payload() data: any) {
    this.logger.log(`Message received: ${data}`);
    return {status: 'success'};
  }
}