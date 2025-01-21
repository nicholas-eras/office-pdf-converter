import { Injectable, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService
  ) {}  

  async validateUser(username: string, password: string): Promise<any> {
    const user = await this.usersService.findOne(username);
    if (!user){
      throw new NotFoundException("User not found.");
    } 
    return await bcrypt.compare(password, user.password) ? user : false;      
  }

  async get_access_token(user: {username: string, id: number}) {
    const payload = { username: user.username, sub: user.id };
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
}
