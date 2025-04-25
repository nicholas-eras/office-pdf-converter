import { Logger } from '@nestjs/common';
import { SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { PrismaService } from '../../../../../prisma/prisma.service';
import { Server, Socket } from 'socket.io';
import { ColoredLogger } from '../../utils/colored-logger';
import { RabbitMqService } from '../../rabbitmq/rabbitmq.service';
import { firstValueFrom } from 'rxjs';

interface Files{
  fileName: string,
  status: string,  
}

interface UserFiles{
  [userId: number] : Files[];
}

@WebSocketGateway({ cors: { origin: '*' } })
export class FileStatusMonitorGateway {  
  constructor(
    private readonly prisma: PrismaService,
    private readonly rabbitMqService: RabbitMqService
  ) {}
  
  private files:UserFiles = {};
  private logger = new ColoredLogger('External Connection');   
  
  @WebSocketServer()
  server: Server;  

  @SubscribeMessage('check-event')
  handleSDEvent(client: Socket, payload: any) {
    this.logger.log(`Client: ${client.id} | Payload: ${JSON.stringify(payload)}`);
    this.server.emit("check-event", client.id + " sent: " + payload);
  }

  @SubscribeMessage('file-to-conversion-queue')
  async handleFileMonitoring(client: any, data: any): Promise<any> {    
    try {
      const file = await this.prisma.file.findUnique({
        where: {
          fileName_userId: {
            fileName: data.fileName,
            userId: data.userId,
          }   
        }
      });    
      
      const res = firstValueFrom(this.rabbitMqService.sendMessage({
        fileName: `${data.userId}_${data.fileName}`,
        userId: data.userId
      })); //nao atribuir a uma variavel da erro, investigar futuramente
      console.log('Resposta do RabbitMQ:', res);

      return file;
    } catch (error) {
      this.logger.error(`Erro ao enviar para a fila: ${error.message}`);
      throw new Error("Erro ao processar o arquivo para a fila.");
    }
  }

  @SubscribeMessage('upload-file-to-conversion')
  handleFileUploadToConversion(client: any, payload: {fileToConvert: string}): any {
    this.files[payload.fileToConvert]  =  'awaiting';
  }

  @SubscribeMessage('get-queue')
  async handleGetQueue(client: any){
    this.server.emit('get-queue', await this.rabbitMqService.getQueueMessages());
  }

  @SubscribeMessage('notify-event')
  handleNotifyEvent(client: any, payload: {event: string, data:string}) {           
    this.files[payload.data]  =  'awaiting';
    this.server.emit(payload.event, this.files);
    return `Success! ${payload.event}:${payload.data}`;
  }

  @SubscribeMessage('update-file-status')
  async handleUpdateFilestatus(client: any, payload: {fileToConvert: string, status: string, userId: number}): Promise<any> {
    this.files[payload.fileToConvert] = payload.status;    
    
    const fileNameWithoutUserId = payload.fileToConvert.slice(payload.fileToConvert.indexOf("_") + 1);

    const file = await this.prisma.file.update({      
        where:{
          fileName_userId: {
            fileName: fileNameWithoutUserId,
            userId: payload.userId
          }   
        },
        data:{
          status: payload.status
        }
      }
    );

    if (payload.status === "done"){
      await this.prisma.convertedFile.create({
        data:{
            fileName: payload.fileToConvert.slice(
              payload.fileToConvert.indexOf("_")+1,
              payload.fileToConvert.lastIndexOf(".")
            ) + ".pdf",
            fileId: file.id,
            userId: file.userId
          }
        }
      );
    };
    
    this.server.emit(file.userId.toString(), {
      fileName: payload.fileToConvert,
      status: payload.status
    });
  }
  
  handleConnection(socket: Socket) {
    this.logger.log(`Socket connected: ${socket.id}`);    
  }

  handleDisconnect(socket: Socket) {
    this.logger.log(`Socket disconnected: ${socket.id}`);    
  }
}
