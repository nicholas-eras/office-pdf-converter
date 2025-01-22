import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AppService } from './app.service';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.enableCors({
    origin: 'http://localhost:3001',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: 'Content-Type, Accept, Authorization',
  });

  await app.listen(3000);

  const logger = new Logger('External Connection'); 
  logger.log('Server running on port 3000...');

  try {
    await (new AppService().verifyCredentials());
  } catch (error) {
    logger.error('Failed to verify AWS credentials', error.stack);
  }
}

bootstrap();
