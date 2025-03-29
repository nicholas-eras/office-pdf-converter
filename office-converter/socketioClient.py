import socketio
import logging
import asyncio

logging.basicConfig(level=logging.INFO, 
                   format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

sio = socketio.AsyncClient(logger=True, engineio_logger=True)

@sio.event
async def connect():
    logger.info(f"Conectado ao servidor Socket.IO! SID: {sio.sid}")

@sio.event
async def connect_error(data):
    logger.error(f"Erro na conexão Socket.IO: {data}")

@sio.event
async def disconnect():
    logger.info("Desconectado do servidor Socket.IO")

async def connect_socket():
    while True:
        try:
            logger.info("Tentando conectar ao servidor Socket.IO...")
            await sio.connect('http://backend:3000', transports=['websocket'])
            logger.info("Conexão Socket.IO bem-sucedida!")
            break
        except Exception as e:
            logger.error(f"Erro ao conectar Socket.IO: {str(e)}")
            await asyncio.sleep(1)