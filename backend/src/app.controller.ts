import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return "Hello";
  }

  @Get("url")
  async getPreSignedUrl(): Promise<any>{
    return await this.appService.PreSignedUrlS3();
  }
}
