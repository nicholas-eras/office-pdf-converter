import { Body, Controller, Get, Param } from '@nestjs/common';
import { RabbitMqService } from './rabbitmq/rabbitmq.service';
import { UsersService } from './users/users.service';

@Controller()
export class AppController {
  constructor(
    private readonly rabbitMqService: RabbitMqService,
    private readonly userService: UsersService,
  ) {}

  @Get("default-nest/:filename")
  triggerEvent(
    @Param('filename') filename: string,
   ) {
    return this.rabbitMqService.sendMessage(filename);
  }

  @Get("file/:fileId/pdf")
  async getFilePdf(
    @Param('fileId') fileId: string,
   ) {
    return this.userService.getFilePDF(+fileId);
  }
}
