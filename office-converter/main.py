from fastapi import FastAPI
import logging
import asyncio
from .socketioClient import SocketIOClient  
from .consumer import RabbitMQConsumer

logger = logging.getLogger(__name__)

app = FastAPI()

socketio_client = SocketIOClient()
rabbitmq_consumer = RabbitMQConsumer(socketio_client)

@app.on_event("startup")
async def startup_event():    
    logger.info("Iniciando conexões com Socket.IO e RabbitMQ...")
    await socketio_client.connect_socket()
    await rabbitmq_consumer.connect()
    asyncio.create_task(rabbitmq_consumer.consume_messages())

@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Encerrando aplicativo...")
    await rabbitmq_consumer.close()
    await socketio_client.disconnect_socket() 

if __name__ == "__main__":
    import uvicorn
    logger.info("Iniciando servidor FastAPI...")
    uvicorn.run(app, host="0.0.0.0", port=8000)
