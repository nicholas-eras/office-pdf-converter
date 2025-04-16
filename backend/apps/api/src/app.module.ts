import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './users/users.module';
import { ConvertModule } from './convert/convert.module';
import { FileStatusMonitorGateway } from './convert/SocketIO/file-status-monitor-gateway';
import { PrismaService } from '../../../prisma/prisma.service';
import { RedisModule } from './redis/redis.module';
import { ScheduleModule } from '@nestjs/schedule';
import { TasksService } from './scheduler/scheduler.service';
import { RabbitMqModule } from './rabbitmq/rabbitmq.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    AuthModule,
    UsersModule,
    ConvertModule,
    RedisModule,
    RabbitMqModule
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService, TasksService],
})
export class AppModule {}
