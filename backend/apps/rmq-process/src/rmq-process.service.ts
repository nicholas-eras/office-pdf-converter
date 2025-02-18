import { Injectable } from '@nestjs/common';

@Injectable()
export class ReqProcessService {
  getHello(): string {
    return 'Hello World!';
  }
}
