import aio_pika
import logging
import asyncio
import os

logging.basicConfig(level=logging.INFO, 
                   format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class RabbitMQConsumer:
    def __init__(self):
        self.url = os.getenv('RABBITMQ_URL')
        self.queue_name = "files-queue"
        self.connection = None

    async def connect(self):
        while True:
            try:
                logger.info(f"Tentando conectar ao RabbitMQ em {self.url}")
                self.connection = await aio_pika.connect_robust(self.url)
                logger.info("Conexão RabbitMQ estabelecida!")
                return self.connection
            except Exception as e:
                logger.error(f"Erro ao conectar ao RabbitMQ: {str(e)}")
                await asyncio.sleep(5)

    async def close(self):
        if self.connection and not self.connection.is_closed:
            await self.connection.close()
            logger.info("Conexão RabbitMQ encerrada!")