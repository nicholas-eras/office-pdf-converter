import { Controller, Post, Body, UnauthorizedException, Req, Get, Res, BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Request } from 'express';
import { GoogleAuthService } from './google.auth.service';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private googleAuthService: GoogleAuthService
  ) {}

  @Post('login')
  async login(@Body() body: { email: string; password: string }) {
    const user = await this.authService.validateUser(body.email, body.password);
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

  @Get('google')
  getGoogleAuthUrl(): { url: string } {
    const url = this.googleAuthService.generateAuthUrl();
    return { url };
  }
  
  @Get('google/callback')
  async handleGoogleCallback(@Req() req: Request) {
    const code = req.query.code as string;

    if (!code) {
      throw new BadRequestException('Authorization code not provided');
    }
  
    const userData = await this.googleAuthService.getUserFromCode(code);
    const token = await this.authService.googleLogin(userData);
  
    return token;
  }
}
