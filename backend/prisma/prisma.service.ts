import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ColoredLogger } from '../apps/api/src/utils/colored-logger';

@Injectable()
export class PrismaService extends PrismaClient {
  private readonly logger = new ColoredLogger("External Connection");

  constructor() {
    super();
  }

  async onModuleInit() {
    try {
      await this.$connect();
      const dbUrl = process.env.DATABASE_URL?.replace(/\/\/(.*):(.*)@/, '//****:****@'); // Esconde usuário e senha
      this.logger.log(`Postgres connected to: ${dbUrl}`);
    } catch (error) {
      this.logger.error(`Error connecting to the database ${error}`);
    }
  }
  
  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Disconnected from the database.');
  }
}
