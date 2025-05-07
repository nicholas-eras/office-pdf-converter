// google-auth.service.ts
import { Injectable } from '@nestjs/common';
import { OAuth2Client } from 'google-auth-library';
import { AuthService } from './auth.service';

@Injectable()
export class GoogleAuthService {
  private oAuth2Client: OAuth2Client;

  constructor(
    private readonly authService: AuthService
  ) {
    this.oAuth2Client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.ENVIRONMENT_FRONTEND}/auth/google/callback`
    );
  }

  generateAuthUrl(): string {
    return this.oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: ['profile', 'email'],
    });
  }

  async getUserFromCode(code: string): Promise<any> {
    const { tokens } = await this.oAuth2Client.getToken(code);
    this.oAuth2Client.setCredentials(tokens);

    const ticket = await this.oAuth2Client.verifyIdToken({
      idToken: tokens.id_token!,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    return {
      email: payload?.email,
      name: payload?.name,
      picture: payload?.picture,
      access_token: this.authService.googleLogin({email: payload.email}),
    };
  }
}
