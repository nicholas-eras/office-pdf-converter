import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class ConvertService {
  constructor(
    private readonly httpService: HttpService, 
    private readonly prisma: PrismaService
  ){}

  async convert(file: Express.Multer.File, user: {userId: number, username: string}): Promise<{
    fileName: string;
    mimeType: string;
  }
  > {
    const url = 'http://localhost:8000/convert-file/';
    const formData = new FormData();
    const blob = new Blob([file.buffer], { type: file.mimetype });
    const fileName = Buffer.from(file.originalname, 'latin1').toString('utf8');
    formData.append('file', blob, fileName);
    try {      
      const fileDatabase = await this.prisma.file.create({
        data:{
          fileExtension: fileName.slice(fileName.lastIndexOf(".")),
          fileName: fileName,
          status: "awaiting",
        }
      });
      await this.prisma.userFile.create({
        data:{
          userId: user.userId,
          fileId: fileDatabase.id
        }
      });
 
      const response = await firstValueFrom(
        this.httpService.post(url + fileDatabase.id, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }),     
      );  
      
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