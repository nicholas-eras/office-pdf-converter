import { Controller, Post, UseInterceptors, UploadedFile } from '@nestjs/common';
import { ConvertService } from './convert.service';
import { FileInterceptor } from '@nestjs/platform-express/multer';

@Controller('convert-file')
export class ConvertController {
  constructor(private readonly convertService: ConvertService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  create(@UploadedFile() file: Express.Multer.File) {
    return this.convertService.convert(file);
  }
}
