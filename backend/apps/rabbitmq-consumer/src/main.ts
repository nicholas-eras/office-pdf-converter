import { NestFactory } from '@nestjs/core';
import { ConsumerModule } from './consumer.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {    
  const consumer = await NestFactory.createMicroservice<MicroserviceOptions>(
    ConsumerModule, 
    {
      transport: Transport.RMQ,
      options: {
        urls: [process.env.RABBIT_URL],
        queue: "files-queue",
        noAck: false,
        prefetchCount: 1
      },
    }
  );

  await consumer.listen();
}

bootstrap();