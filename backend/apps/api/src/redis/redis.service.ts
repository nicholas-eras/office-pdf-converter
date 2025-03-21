
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import Redis from 'ioredis';
import { ColoredLogger } from '../utils/colored-logger';

@Injectable()
export class RedisService {
  private readonly logger = new ColoredLogger("External Connection");  
  private redisClient: Redis;
  
  constructor(private readonly prismaClient: PrismaService) {
    this.redisClient = new Redis(process.env.REDIS_URL || 'redis://redis:6379'); 
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (ttl) {
      await this.redisClient.set(key, value, 'EX', ttl);
    } else {
      await this.redisClient.set(key, value);
    }
  }

  async get(key: string): Promise<string | null> {
    return this.redisClient.get(key);
  }

  async verifyConnection(): Promise<void>{
    try {
      await this.redisClient.ping();      

      const clientInfo = await this.redisClient.call('CLIENT', ['LIST']) as string;
      const clientAddr = clientInfo
        .split('\n')
        .find(line => line.includes('id='))
        ?.match(/addr=([^ ]+)/)?.[1];

      const serverPortInfo = await this.redisClient.call('CONFIG', ['GET', 'port']);
      const serverPort = serverPortInfo[1];

      this.logger.log(`Redis connected: ${clientAddr?.split(':')[0]}:${serverPort}`);
            
      this.logger.debug("Setting user's limit file upload.");
      await this.restoreUsersLimit();
      this.logger.debug("Done setting user's limit file upload.");
      
    } catch (error) {      
      console.log(error)      ;
      throw new Error('Invalid Redis credentials');      
    }
  }

  async restoreUsersLimit(): Promise<void>{
    const users = await this.prismaClient.user.findMany();
    users.forEach((user) => {
      this.set(user.id.toString(), (process.env.UPLOAD_LIMIT).toString(), 24*60*60);
    });
    await this.numberOfFilesUploadLimit();
    return null;
  }

  async isLimitReached(userId: number): Promise<boolean>{    
    return !(+(await this.get(userId.toString())) > 0);
  }

  private async numberOfFilesUploadLimit():Promise<void>{
    await this.set("numberFiles", "30");
  };
}
