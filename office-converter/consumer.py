import asyncio
import aio_pika
import json
from fastapi import FastAPI
import logging

logging.basicConfig(level=logging.INFO, 
                   format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

RABBIT_URL = "amqp://rabbit:rabbitmq2024@172.22.0.2:5672"
QUEUE_NAME = "files-queue"

app = FastAPI()

async def process_message(message: aio_pika.IncomingMessage):
    try:
        data = json.loads(message.body.decode())
        logger.info(f"Mensagem recebida: {data}")
        
        await asyncio.sleep(2)
        
        logger.info(f"Processamento concluído para mensagem: {data}")
        await message.ack()
    except Exception as e:
        logger.error(f"Erro ao processar mensagem: {str(e)}")
        await message.nack(requeue=False)

async def consume():
    try:
        logger.info(f"Tentando conectar ao RabbitMQ em {RABBIT_URL}")
        connection = await aio_pika.connect_robust(RABBIT_URL)
        logger.info("Conexão estabelecida com sucesso!")
        
        channel = await connection.channel()
        logger.info("Canal criado com sucesso!")
        
        await channel.set_qos(prefetch_count=1)
        
        queue = await channel.get_queue(QUEUE_NAME)
        logger.info(f"Conectado à fila existente '{QUEUE_NAME}' com sucesso!")
        
        logger.info(f"Aguardando mensagens na fila '{QUEUE_NAME}'...")
        await queue.consume(process_message, no_ack=False)
        
        return connection
    except Exception as e:
        logger.error(f"Erro ao configurar consumidor: {str(e)}")
        await asyncio.sleep(5)
        return await consume()

@app.on_event("startup")
async def startup_event():
    app.state.consumer_task = asyncio.create_task(consume())
    logger.info("Consumidor iniciado em segundo plano!")

@app.on_event("shutdown")
async def shutdown_event():
    if hasattr(app.state, "consumer_task"):
        app.state.consumer_task.cancel()
        logger.info("Consumidor encerrado!")

@app.get("/")
async def root():
    return {"status": "Consumer running", "queue": QUEUE_NAME}

if __name__ == "__main__":
    import uvicorn
    logger.info("Iniciando servidor FastAPI...")
    uvicorn.run(app, host="0.0.0.0", port=8002)