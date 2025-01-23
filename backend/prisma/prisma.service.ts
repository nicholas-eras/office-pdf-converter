import { Injectable, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient {
  private readonly logger = new Logger("External Connection");

  constructor() {
    super();
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('Successfully connected database at postgres');
    } catch (error) {
      this.logger.error(`Error connecting to the database ${error}`);
    }
  }
  
  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Disconnected from the database.');
  }
}
