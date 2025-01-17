
import { Injectable } from '@nestjs/common';
import { AuthService } from 'src/auth/service/auth.service';
import * as bcrypt from 'bcryptjs';

export type User = any;

@Injectable()
export class UsersService {
  constructor(){}

  private readonly users = [
    {
      userId: 1,
      username: 'john',
      password: 'changeme',
    },
    {
      userId: 2,
      username: 'maria',
      password: 'guess',
    },
  ];

  async findOne(username: string): Promise<User | undefined> {
    return this.users.find(user => user.username === username);
  }

  async createUser(username: string, password: string): Promise<User | undefined> {
    return this.users.push({
      userId: this.users.length,
      username: username,
      password: await this.hashPassword(password)
    });
  }

  async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
  }
}
