import { Module } from '@nestjs/common';
import { ConvertService } from './convert.service';
import { ConvertController } from './convert.controller';
import { HttpModule } from '@nestjs/axios';
import { PrismaService } from 'prisma/prisma.service';
import { AppService } from '../app.service';
import { FileStatusMonitorGateway } from './SocketIO/file-status-monitor-gateway';
import { RabbitMqService } from '../rabbitmq/rabbitmq.service';
import { RabbitMqModule } from '../rabbitmq/rabbitmq.module';

@Module({
  imports:[HttpModule, RabbitMqModule],
  controllers: [ConvertController],
  providers: [ConvertService, PrismaService, AppService, FileStatusMonitorGateway, RabbitMqService],
})
export class ConvertModule {}
