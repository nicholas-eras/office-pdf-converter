import { IsString, IsNotEmpty } from 'class-validator';

export class CreateFileDto {
  @IsString()
  @IsNotEmpty()
  fileName: string;
  
  @IsString()
  @IsNotEmpty()
  fileExtension: string;
}
