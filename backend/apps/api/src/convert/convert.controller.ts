import { Controller, Post, UseInterceptors, UploadedFile, UseGuards, Req, Get, StreamableFile, Body, Res, Param, Delete } from '@nestjs/common';
import { ConvertService } from './convert.service';
import { FileInterceptor } from '@nestjs/platform-express/multer';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Request } from 'express';
import { createReadStream } from 'fs';
import { join } from 'path';
import { AppService } from '../app.service';
import { Response } from 'express'

@Controller('file')
export class ConvertController {
  constructor(
    private readonly convertService: ConvertService,
    private readonly appService: AppService
  ) {}

  @Post("convert")
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  create(@UploadedFile() file: Express.Multer.File, @Req() req: Request) {
    const user: any = req.user;
    return this.convertService.convert(file, user);
  }
  
  @Post("download2")
  getFile(@Body() body: { fileName: string }): StreamableFile {    
    const path= "/home/nieras/nest-js/office-pdf-converter/office-converter/converted_files";    
    const fileName = body.fileName.slice(0, body.fileName.lastIndexOf(".")) + ".pdf"
    const file = createReadStream(join(path, fileName));
    return new StreamableFile(file);
  }

  @Post("pre-signed-url")
  @UseGuards(JwtAuthGuard)
  async getPreSignedUrl(
    @Body() body: { filename: string, contentType: string },
    @Req() req: Request
  ): Promise<any> {
    const user: any = req.user;
    return await this.appService.PreSignedUrlS3(body.filename, body.contentType, user);
  }

  @Get("download/:filename")
  @UseGuards(JwtAuthGuard)
  async getFileS3(
    @Param('filename') filename: string,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<any> {
    const user: any = req.user;
    return await this.appService.getFileS3(filename, res, user);
  }

  @Delete(":filename")
  @UseGuards(JwtAuthGuard)
  async deleteFile(
    @Param('filename') fileId: number,
    @Req() req: Request,    
  ): Promise<any> {
    const user: any = req.user;    
    return await this.convertService.deleteFile(fileId, user.userId);
  }
}
