import { NestFactory } from '@nestjs/core';
import { ConsumerModule } from './consumer.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {    
  const consumer = await NestFactory.createMicroservice<MicroserviceOptions>(
    ConsumerModule, 
    {
      transport: Transport.RMQ,
      options: {
        urls: [process.env.RABBITMQ_URL],
        queue: process.env.RABBITMQ_QUEUE,
        noAck: false,
        prefetchCount: 1
      },
    }
  );

  await consumer.listen();
}

bootstrap();