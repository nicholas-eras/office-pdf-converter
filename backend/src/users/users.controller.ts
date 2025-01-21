import { Body, ConflictException, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Request } from 'express';

@Controller('users')
export class UsersController {
  constructor(
    private readonly userService: UsersService
  ) {}

  @Post()
  async createUser(@Body() body: { username: string; password: string }) {
    const user = await this.userService.findOne(body.username);
    if (user) {
      throw new ConflictException('User already created.');
    }
    return this.userService.createUser(body.username, body.password);
  }

  @UseGuards(JwtAuthGuard)
  @Get("files")
  async userFiles(@Req() req: Request) {
    const user: any = req.user;
    return this.userService.userFiles(user);
  }
}
