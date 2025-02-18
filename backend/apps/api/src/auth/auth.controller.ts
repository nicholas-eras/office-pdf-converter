import { Controller, Post, Body, UnauthorizedException, UseGuards, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { Request } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body() body: { username: string; password: string }) {
    const user = await this.authService.validateUser(body.username, body.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.authService.get_access_token(user);
  }

  @Post('validate-token')
  async validateToken(@Req() req: Request) {    
    const token: any = req.headers?.authorization.split(" ")[1];   
    return this.authService.validate_token(token);
  }
}
