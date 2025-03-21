import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { RedisService } from '../redis/redis.service';
import { ColoredLogger } from '../utils/colored-logger';

@Injectable()
export class TasksService {
  private readonly logger = new ColoredLogger('Scheduler');

  constructor(private readonly redisService: RedisService) {}

  @Cron('0 0 * * *')
  async handleCron() {
    this.logger.debug("Updating user's limit file upload.");
    await this.redisService.restoreUsersLimit();
    this.logger.debug("Done setting user's limit file upload.");
  }  
}
