import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/module/auth.module';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './users/users.module';
import { ConvertModule } from './convert/convert.module';
import { FileStatusMonitorGateway } from './convert/SocketIO/file-status-monitor-gateway';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AuthModule,
    UsersModule,
    ConvertModule,
  ],
  controllers: [AppController],
  providers: [AppService, FileStatusMonitorGateway],
})
export class AppModule {}
