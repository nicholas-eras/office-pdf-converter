import { Body, ConflictException, Controller, Post, UnauthorizedException } from '@nestjs/common';
import { UsersService } from './users.service';

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
}
