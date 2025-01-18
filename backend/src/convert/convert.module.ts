import { Module } from '@nestjs/common';
import { ConvertService } from './convert.service';
import { ConvertController } from './convert.controller';
import { HttpModule } from '@nestjs/axios';
import { PrismaService } from 'prisma/prisma.service';

@Module({
  imports:[HttpModule],
  controllers: [ConvertController],
  providers: [ConvertService, PrismaService],
})
export class ConvertModule {}
