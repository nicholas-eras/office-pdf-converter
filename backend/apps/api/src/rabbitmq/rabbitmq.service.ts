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

  sendMessage(fileName: string): Record<any, any> {
    try {
      const response = this.client.send('default-nestjs-rmq', { fileName });
      return response;
    } catch (error) {
      this.logger.error('Failed to send message to RabbitMQ:', error.message);
      return { status: 'error sending message' };
    }
  }  
}