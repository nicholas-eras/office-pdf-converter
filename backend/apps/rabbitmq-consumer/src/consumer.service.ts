import { Controller, OnModuleInit } from '@nestjs/common';
import { EventPattern, Payload, Ctx, RmqContext } from '@nestjs/microservices';
import { ColoredLogger } from './utils/colored-logger';

@Controller()
export class ConsumerService implements OnModuleInit {
  private readonly logger = new ColoredLogger("RabbitMQ Consumer");  

  onModuleInit() {
    this.logger.log('ConsumerService initialized and ready to receive messages');
  }

  @EventPattern('default-nestjs-rmq')
  async handleFileMessage(@Payload() data: any, @Ctx() context: RmqContext) {
    const channel = context.getChannelRef();
    const originalMessage = context.getMessage();

    try {
      this.logger.log(`Mensagem recebida: ${JSON.stringify(data)}`);

      channel.ack(originalMessage);
      
      return { status: 'success', message: `Arquivo ${data.fileName} processado com sucesso` };
    } catch (error) {
      this.logger.error(`Erro no processamento: ${error.message}`);
      channel.nack(originalMessage);
      return { status: 'error', message: `Falha ao processar ${data.fileName}` };
    }
  }
}
