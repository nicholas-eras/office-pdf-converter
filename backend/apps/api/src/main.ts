import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import { RedisService } from './redis/redis.service';
import { AppService } from './app.service';

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

  const appService = app.get(AppService);
  const redisService = app.get(RedisService);

  try {
    await appService.verifyCredentials();
  } catch (error) {
    logger.error('Failed to verify AWS credentials', error.stack);
  }

  try {
    await redisService.verifyConnection();
  } catch (error) {
    logger.error('Failed to verify Redis Connection', error.stack);
  }
}

bootstrap();
