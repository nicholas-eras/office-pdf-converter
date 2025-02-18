import { Module } from '@nestjs/common';
import { RabbitMqService } from './rabbitmq.service';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'RABBITMQ_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBIT_URL],
          noAck: true,          
          queueOptions: {
            durable: false
          },
        },
      },
    ]),
  ],
  providers: [RabbitMqService],
  exports: [RabbitMqService, ClientsModule]
})
export class RabbitMqModule {}
