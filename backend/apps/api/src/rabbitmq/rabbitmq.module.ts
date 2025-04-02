import { Module } from '@nestjs/common';
import { RabbitMqService } from './rabbitmq.service';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'FILES_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ_URL],
          queue: process.env.RABBITMQ_QUEUE,
          noAck: true
        },
      },
    ]),
  ],
  providers: [RabbitMqService],
  exports: [RabbitMqService, ClientsModule]
})
export class RabbitMqModule {}
