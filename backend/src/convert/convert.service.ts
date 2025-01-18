import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { FileEntity } from './entities/file.entity';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class ConvertService {
  constructor(
    private readonly httpService: HttpService, 
    private readonly prisma: PrismaService
  ){}

  async convert(file: Express.Multer.File): Promise<FileEntity> {
    const url = 'http://localhost:8000/convert-file/';
    const formData = new FormData();
    const blob = new Blob([file.buffer], { type: file.mimetype });
    const fileName = Buffer.from(file.originalname, 'latin1').toString('utf8');
    formData.append('file', blob, fileName);

    try {      
      const response = await firstValueFrom(
        this.httpService.post(url, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }),     
      );  
      // await this.prisma.file.create({
      //   data:{
      //     fileExtension: fileName.slice(fileName.lastIndexOf(".")),
      //     fileName: fileName,
      //     status: "awaiting",
      //   }
      // });
      return response.data;
    } catch (error) {
      await this.prisma.file.delete({
        where:{
          fileName: fileName
        }
      })
      console.error(error.response);
      throw new InternalServerErrorException(`Erro ao converter arquivo: ${error.response?.data?.detail ?? error.message}`);
    }    
  }
}