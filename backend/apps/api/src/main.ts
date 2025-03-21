import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { RedisService } from './redis/redis.service';
import { AppService } from './app.service';
import { ColoredLogger } from './utils/colored-logger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: 'http://localhost:3001',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: 'Content-Type, Accept, Authorization',
  });

  await app.listen(3000);

  const logger = new ColoredLogger('External Connection');
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
