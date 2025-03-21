import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ColoredLogger } from '../utils/colored-logger';

@Injectable()
export class RabbitMqService implements OnModuleInit {
  private readonly logger = new ColoredLogger("RabbitMQ Producer");  
  
  constructor(@Inject('FILES_SERVICE') public readonly client: ClientProxy) {}

  async onModuleInit() {
    try {
      await this.client.connect();
      this.logger.log('Producer successfully connected to RabbitMQ!');
    } catch (error) {
      this.logger.error('Producer failed to connect to RabbitMQ:', error.message);
    }
  }

  sendMessage(): string {
    try {
      this.client.emit('default-nestjs-rmq', { message: 'mensagem' });
      return 'oi';
    } catch (error) {
      this.logger.error('❌ Failed to send message to RabbitMQ:', error.message);
      return 'error sending message';
    }
  }
}