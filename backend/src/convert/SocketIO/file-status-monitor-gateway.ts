import { SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { FileEntity } from '../entities/file.entity';

@WebSocketGateway({ cors: { origin: '*' } })
export class FileStatusMonitorGateway {  
  private files = {};
  
  @WebSocketServer()
  server: Server;

  @SubscribeMessage('file-to-conversion-queue')
  handleFileMonitoring(client: any): any {
    this.server.emit('file-to-conversion-queue',this.files);
    return {"files": this.files};
  }

  @SubscribeMessage('upload-file-to-conversion')
  handleFileUploadToConversion(client: any, payload: {fileToConvert: string}): any {
    this.files[payload.fileToConvert]  =  'awaiting';
    this.server.emit('file-to-conversion-queue',this.files);
  }

  @SubscribeMessage('update-file-status')
  handleUpdateFilestatus(client: any, payload: {fileToConvert: string, status: string}): any {
    this.files[payload.fileToConvert] = payload.status;
    this.server.emit('file-to-conversion-queue',this.files);
  }


  handleConnection(socket: Socket) {
    this.server.emit('file-to-conversion-queue',this.files);
    console.log(`Socket connected: ${socket.id}`);
  }

  handleDisconnect(socket: Socket) {
    console.log(`Socket disconnected: ${socket.id}`);
  }

}
