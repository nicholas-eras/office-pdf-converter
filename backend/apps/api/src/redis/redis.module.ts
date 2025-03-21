import { Module, Global } from '@nestjs/common';
import Redis from 'ioredis';
import { RedisService } from './redis.service';
import { PrismaService } from '../../../../prisma/prisma.service';

@Global()
@Module({
  providers: [
    RedisService,
    PrismaService,
    {
      provide: 'REDIS_CLIENT',
      useFactory: () => {
        const redisUrl = process.env.REDIS_URL || 'redis://redis:6379';
        return new Redis(redisUrl);
      },
    },
  ],
  exports: [RedisService],
})
export class RedisModule {}
