import { Body, ConflictException, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Request } from 'express';

@Controller('users')
export class UsersController {
  constructor(
    private readonly userService: UsersService
  ) {}

  @Post()
  async createUser(@Body() body: { email: string; password: string }) {
    const user = await this.userService.findOne(body.email);
    if (user) {
      throw new ConflictException('User already created.');
    }
    return this.userService.createUser(body.email, body.password);
  }

  @UseGuards(JwtAuthGuard)
  @Get("files")
  async userFiles(@Req() req: Request) {
    const user: any = req.user;
    return this.userService.userFiles(user);
  }
}
