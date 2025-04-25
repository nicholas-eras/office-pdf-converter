
import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../../../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

export type User = any;
export type FileEntity = any;
@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService, private redis: RedisService){}

  async findOne(username: string): Promise<User | undefined> {
    return this.prisma.user.findUnique({
      where:{
        username
      }
    });
  }

  async createUser(username: string, password: string): Promise<User | undefined> {
    const user = await this.prisma.user.create({
      data:{
        username: username,
        password: await this.hashPassword(password)
      }
    });
    this.redis.set(user.id.toString(), (process.env.UPLOAD_LIMIT).toString(), 24*60*60);
    return user;
  }

  async getUsers(): Promise<User[] | undefined>{
    return this.prisma.user.findMany();
  }

  async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
  }

  async userFiles(user: {userId: number, username: string}): Promise<FileEntity[]>{
    const userFiles = await this.prisma.file.findMany({
      where: {
        userId: user.userId,
      },
    });

    const userFilesPdf = await this.prisma.convertedFile.findMany({
      where: {
        userId: user.userId,
      },
    });

    const result = userFiles.map(uf => {
      const pdf = userFilesPdf.find(obj => obj.fileId === uf.id);
      return {
        ...uf,
        pdf, 
      };
    });
    
    return result;    
  }

  async getFilePDF(fileId: number): Promise<FileEntity>{
    const file = await this.prisma.convertedFile.findUnique({
      where:{
        fileId
      }
    })
    return file;    
  }
}
