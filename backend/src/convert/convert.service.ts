import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { FileEntity } from './entities/file.entity';

@Injectable()
export class ConvertService {
  constructor(private readonly httpService: HttpService){}

  async convert(file: Express.Multer.File): Promise<FileEntity> {
    const url = 'http://localhost:8000/convert-file/';
    const formData = new FormData();
    const blob = new Blob([file.buffer], { type: file.mimetype });
    formData.append('file', blob, file.originalname);    

    try {      
      const response = await firstValueFrom(
        this.httpService.post(url, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }),     
      );
      return response.data;
    } catch (error) {     
      console.error(error.response.data) ;
      throw new InternalServerErrorException(`Erro ao converter arquivo: ${error.response.data.detail ?? error.response.data}`);
    }    
  }
}
