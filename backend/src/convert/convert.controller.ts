import { Controller, Post, UseInterceptors, UploadedFile, UseGuards, Req, Get, StreamableFile, Body } from '@nestjs/common';
import { ConvertService } from './convert.service';
import { FileInterceptor } from '@nestjs/platform-express/multer';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Request } from 'express';
import { createReadStream } from 'fs';
import { join } from 'path';

@Controller('file')
export class ConvertController {
  constructor(private readonly convertService: ConvertService) {}

  @Post("convert")
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  create(@UploadedFile() file: Express.Multer.File, @Req() req: Request) {
    const user: any = req.user;
    return this.convertService.convert(file, user);
  }
  
  @Post("download")
  getFile(@Body() body: { fileName: string }): StreamableFile {    
    const path= "/home/nieras/nest-js/office-pdf-converter/office-converter/converted_files";    
    const fileName = body.fileName.slice(0, body.fileName.lastIndexOf(".")) + ".pdf"
    const file = createReadStream(join(path, fileName));
    return new StreamableFile(file);
  }
}
