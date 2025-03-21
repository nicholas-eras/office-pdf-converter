
import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../../../prisma/prisma.service';

export type User = any;
export type FileEntity = any;
@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService){}

  async findOne(username: string): Promise<User | undefined> {
    return this.prisma.user.findUnique({
      where:{
        username
      }
    });
  }

  async createUser(username: string, password: string): Promise<User | undefined> {
    return this.prisma.user.create({
      data:{
        username: username,
        password: await this.hashPassword(password)
      }
    });
  }

  async getUsers(): Promise<User[] | undefined>{
    return this.prisma.user.findMany();
  }

  async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
  }

  async userFiles(user: {userId: number, username: string}): Promise<FileEntity[]>{
    const userFilesWithPdfs = await this.prisma.userFile.findMany({
      where: {
        userId: user.userId,
      },
      include: {
        file: {
          include: {
            convertedFiles: true,
          },
        },
      },
    });
    const result = userFilesWithPdfs.map((userFile) => ({
      id: userFile.file.id,
      fileName: userFile.file.fileName,
      fileExtension: userFile.file.fileExtension,
      status: userFile.file.status,
      createdAt: userFile.file.createdAt,
      pdf: userFile.file.convertedFiles.length > 0 ? userFile.file.convertedFiles[0] : null,
    }));
    
    return result;
    
  }
}
