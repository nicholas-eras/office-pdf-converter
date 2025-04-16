import socketio
import logging

logger = logging.getLogger(__name__)

class SocketIOClient:
    def __init__(self):
        self.sio = socketio.AsyncClient(logger=True, engineio_logger=True)
        
        self.sio.event(self.connect)
        self.sio.event(self.connect_error)
        self.sio.event(self.disconnect)

    async def emit(self, event, data):
        await self.sio.emit(event, data)
        
    async def connect(self):
        logger.info(f"Conectado ao servidor Socket.IO! SID: {self.sio.sid}")

    async def connect_error(self, data):
        logger.error(f"Erro na conexão Socket.IO: {data}")

    async def disconnect(self):
        logger.info("Desconectado do servidor Socket.IO")

    async def connect_socket(self):
        max_retries = 5
        retries = 0
        while retries < max_retries:
            try:
                logger.info(f"Tentando conectar ao servidor Socket.IO... (tentativa {retries + 1} de {max_retries})")
                await self.sio.connect('http://backend:3000', transports=['websocket'])
                logger.info("Conexão Socket.IO bem-sucedida!")
                break  
            except Exception as e:
                retries += 1
                logger.error(f"Erro ao conectar Socket.IO: {str(e)}")
                if retries < max_retries:
                    wait_time = 2 ** retries 
                    logger.info(f"Aguardando {wait_time} segundos antes da próxima tentativa...")
                    await asyncio.sleep(wait_time)
                else:
                    logger.error("Máximo de tentativas atingido. Não foi possível conectar ao servidor.")

    async def disconnect_socket(self):
        if self.sio.connected:
            await self.sio.disconnect()
            logger.info("Desconexão do Socket.IO iniciada")
        else:
            logger.info("Socket.IO já está desconectado")
