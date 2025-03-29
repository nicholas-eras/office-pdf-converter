# main.py
import asyncio
from fastapi import FastAPI
import logging
from .socketioClient import connect_socket
from .consumer import RabbitMQConsumer  

logging.basicConfig(level=logging.INFO, 
                   format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = FastAPI()
rabbitmq_consumer = RabbitMQConsumer()

@app.on_event("startup")
async def startup_event():
    logger.info("Iniciando conexões com Socket.IO e RabbitMQ...")
    await asyncio.gather(connect_socket(), rabbitmq_consumer.connect())

@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Encerrando aplicativo...")
    await rabbitmq_consumer.close()

if __name__ == "__main__":
    import uvicorn
    logger.info("Iniciando servidor FastAPI...")
    uvicorn.run(app, host="0.0.0.0", port=8000)
