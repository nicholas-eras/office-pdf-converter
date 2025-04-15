import aio_pika
import logging
import asyncio
import os
import ast
from .converter import FileConversionService

logging.basicConfig(level=logging.INFO, 
                   format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class RabbitMQConsumer:
    def __init__(self):
        self.url = os.getenv('RABBITMQ_URL')
        self.queue_name = "files-queue"
        self.connection = None
        self.channel = None
        self.converter = FileConversionService()

    async def connect(self):
        while True:
            try:
                logger.info(f"Tentando conectar ao RabbitMQ em {self.url}")
                self.connection = await aio_pika.connect_robust(self.url)
                self.channel = await self.connection.channel()
                logger.info("Conexão RabbitMQ estabelecida!")
                return self.connection
            except Exception as e:
                logger.error(f"Erro ao conectar ao RabbitMQ: {str(e)}")
                await asyncio.sleep(5)

    async def consume_messages(self):
        if not self.channel:
            logger.error("Canal do RabbitMQ não está disponível.")
            return
        
        queue = await self.channel.declare_queue(self.queue_name, durable=True)
        logger.info(f"Esperando mensagens na fila '{self.queue_name}'...")

        async with queue.iterator() as queue_iter:
            async for message in queue_iter:       
                async with message.process():
                    body = ast.literal_eval(message.body.decode())                
                    fileName = body["data"]
                    logger.info(f"Trying convert: {fileName}")
                    res = self.converter.convert_upload_file(fileName)
                    if res.get("status", None) == "success":
                        logger.info(f"Success converting {fileName}")  
                    else:
                        logger.info(f"Fail to convert {fileName}")
                        if "detail" in res:
                            logger.info(res["detail"])

    async def close(self):
        if self.connection and not self.connection.is_closed:
            await self.connection.close()
            logger.info("Conexão RabbitMQ encerrada!")
