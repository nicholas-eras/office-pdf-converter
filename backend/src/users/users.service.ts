
import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from 'prisma/prisma.service';

export type User = any;

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
}
