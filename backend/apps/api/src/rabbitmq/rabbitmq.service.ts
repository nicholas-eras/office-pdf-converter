import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class RabbitMqService {
  constructor(@Inject('RABBITMQ_SERVICE') public readonly client: ClientProxy){
  }
}
