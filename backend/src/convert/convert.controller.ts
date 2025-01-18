import { Controller, Post, UseInterceptors, UploadedFile, UseGuards, Req, UseFilters } from '@nestjs/common';
import { ConvertService } from './convert.service';
import { FileInterceptor } from '@nestjs/platform-express/multer';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Request } from 'express';

@Controller('convert-file')
export class ConvertController {
  constructor(private readonly convertService: ConvertService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  create(@UploadedFile() file: Express.Multer.File, @Req() req: Request) {
    const user: any = req.user;
    return this.convertService.convert(file, user);
  }
}
