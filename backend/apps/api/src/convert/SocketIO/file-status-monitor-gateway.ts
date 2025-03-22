import { Logger } from '@nestjs/common';
import { SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { PrismaService } from '../../../../../prisma/prisma.service';
import { Server, Socket } from 'socket.io';
import { ColoredLogger } from '../../utils/colored-logger';

interface Files{
  fileName: string,
  status: string,  
}

interface UserFiles{
  [userId: number] : Files[];
}

@WebSocketGateway({ cors: { origin: '*' } })
export class FileStatusMonitorGateway {  
  constructor(private readonly prisma: PrismaService) {}
  private files:UserFiles = {};

  deleteFile = (userId:number, fileName:string) => {
    this.files[userId] = this.files[userId].filter((files: Files) =>files.fileName != fileName);
    this.server.emit("file-to-conversion-queue", this.files);
  }

  private logger = new ColoredLogger('External Connection');   
  
  @WebSocketServer()
  server: Server;  

  @SubscribeMessage('check-event')
  handleSDEvent(client: Socket, payload: any) {
    this.logger.log(`Client: ${client.id} | Payload: ${JSON.stringify(payload)}`);
    this.server.emit("check-event", client.id + " sent: " + payload);
  }

  @SubscribeMessage('file-to-conversion-queue')
  handleFileMonitoring(client: any, fileName: string): any {
    this.server.emit("file-to-conversion-queue", {[fileName]: "awaiting"});
    return this.files;
  }

  @SubscribeMessage('upload-file-to-conversion')
  handleFileUploadToConversion(client: any, payload: {fileToConvert: string}): any {
    this.files[payload.fileToConvert]  =  'awaiting';
  }

  @SubscribeMessage('notify-event')
  handleNotifyEvent(client: any, payload: {event: string, data:string}) {        
    this.files[payload.data]  =  'awaiting';
    this.server.emit(payload.event, this.files);
    return `Success! ${payload.event}:${payload.data}`;
  }

  @SubscribeMessage('update-file-status')
  async handleUpdateFilestatus(client: any, payload: {fileToConvert: string, status: string}): Promise<any> {
    this.files[payload.fileToConvert] = payload.status;
 
    this.server.emit("file-to-conversion-queue", this.files);
    if (payload.status === "done"){
      delete this.files[payload.fileToConvert];
    };
    const file = await this.prisma.file.update({      
        where:{
          fileName: payload.fileToConvert
        },
        data:{
          status: payload.status
        }
      }
    );

    await this.prisma.convertedFile.create({
        data:{
          fileName: payload.fileToConvert.slice(0, payload.fileToConvert.lastIndexOf(".")) + ".pdf",
          fileId: file.id,
        }
      }
    );
  }
  
  handleConnection(socket: Socket) {
    this.logger.log(`Socket connected: ${socket.id}`);    
  }

  handleDisconnect(socket: Socket) {
    this.logger.log(`Socket disconnected: ${socket.id}`);    
  }
}
