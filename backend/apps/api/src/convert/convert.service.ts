import { Injectable, InternalServerErrorException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { PrismaService } from '../../../../prisma/prisma.service';
import { AppService } from '../app.service';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class ConvertService {
  constructor(
    private readonly httpService: HttpService, 
    private readonly prisma: PrismaService,
    private readonly appService: AppService,
    private readonly redisClient: RedisService
  ){}

  async convert(file: Express.Multer.File, user: {userId: number, email: string}): Promise<{
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
          userId: user.userId
        }
      });
 
      const response = await firstValueFrom(
        this.httpService.post(url + fileDatabase.id, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }),     
      );  

      await this.appService.uploadFile(file);
      
      return response.data;
    } catch (error) {
      const fileId = (await this.prisma.file.findUnique({
        where: {
          fileName_userId: {
            fileName: fileName,
            userId: user.userId
          }   
        }
      })).id;

      await this.prisma.convertedFile.deleteMany({
        where:{
          fileId
        }
      });

      await this.prisma.file.delete({
        where:{
          fileName_userId: {
            fileName: fileName,
            userId: user.userId
          }
        }
      });

      console.error(error.response);
      throw new InternalServerErrorException(`Erro ao converter arquivo: ${error.response?.data?.detail ?? error.message}`);
    }    
  }

  async deleteFile(fileId: number, userId: number):Promise<any>{
    fileId = +fileId;
    
    const file = await this.prisma.file.findUnique({
      where:{
        id: fileId,
        userId: userId
      }
    });
    
    if (!file){
      throw new NotFoundException("file not on found");
    }

    await this.prisma.convertedFile.deleteMany({
      where:{
        fileId: fileId,
      }
    });
    
    await this.prisma.file.delete({
      where:{
        id: fileId
      }
    });

    await this.redisClient.set(
      userId.toString(),
      (+(await this.redisClient.get(userId.toString())) + 1).toString(),
      24*60*60
    );

        
    await this.redisClient.set(
      "numberFiles",
      (+(await this.redisClient.get("numberFiles")) + 1).toString(),
      24*60*60
    );
    
    await this.appService.deleteFileS3(userId + "_" + file.fileName.slice(0, file.fileName.lastIndexOf(".")) + ".pdf");

    return await this.appService.deleteFileS3(`${userId}_${file.fileName}`);
  }
}