import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService
  ) {}  

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findOne(email);
    if (!user){
      throw new NotFoundException("User not found.");
    } 
    return await bcrypt.compare(password, user.password) ? user : false;      
  }

  async get_access_token(user: {email: string, id: number}) {
    const payload = { email: user.email, sub: user.id };
    return {
      access_token: await this.jwtService.signAsync(payload, {
        secret: Buffer.from(process.env.JWT_PRIVATE_KEY, 'base64'),
        algorithm: 'RS256', 
        expiresIn: '1h',
      }),
    };
  }

  async validate_token(token) {
    try {
      return this.jwtService.verify(token);
    } catch (err) {
        return false;
    }
  }

  async googleLogin(user: any) {
    if (!user) {
      throw new UnauthorizedException();
    }
  
    const existingUser = await this.usersService.findOne(user.email);
    const userToUse = existingUser || await this.usersService.createFromGoogle(user.email);
  
    const payload = { email: userToUse.email, sub: userToUse.id };
  
    return { token: await this.jwtService.signAsync(payload, {
        secret: Buffer.from(process.env.JWT_PRIVATE_KEY, 'base64'),
        algorithm: 'RS256',
        expiresIn: '1h',
      })
    }
  } 
}
