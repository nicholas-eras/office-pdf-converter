import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ColoredLogger } from '../utils/colored-logger';
import { Channel, Connection, connect, Message } from 'amqplib';

@Injectable()
export class RabbitMqService implements OnModuleInit {
  private readonly logger = new ColoredLogger("RabbitMQ Producer");  
  private channel: Channel;
  private connection: Connection;

  constructor(@Inject('FILES_SERVICE') public readonly client: ClientProxy) {}

  async onModuleInit() {
    try {
      await this.client.connect();
      this.logger.log('Producer successfully connected to RabbitMQ!');
      await this.setupChannel();
    } catch (error) {
      this.logger.error('Producer failed to connect to RabbitMQ:', error.message);
    }
  }

  private async setupChannel() {
    try {
      this.connection = await connect(process.env.RABBITMQ_URL || 'amqp://localhost');
      this.channel = await this.connection.createChannel();
    } catch (error) {
      this.logger.error('Failed to set up RabbitMQ channel:', error.message);
    }
  }

  sendMessage(fileName: string): Record<any, any> {
    try {
      const response = this.client.send('default-nestjs-rmq',  fileName );
      return response;
    } catch (error) {
      this.logger.error('Failed to send message to RabbitMQ:', error.message);
      return { status: 'error sending message' };
    }
  }

  async getQueueMessages(): Promise<string[]> {
    try {
      const messages: string[] = [];
      const queueName:string = process.env.RABBITMQ_QUEUE;

      await this.channel.assertQueue(queueName, { durable: true });
      
      let message = await this.channel.get(queueName, { noAck: true });

      while (message) {
        messages.push(message.content.toString());
        message = await this.channel.get(queueName, { noAck: true });
      }

      return messages;
    } catch (error) {
      this.logger.error('Failed to get messages from RabbitMQ:', error.message);
      return [];
    }
  }
}
