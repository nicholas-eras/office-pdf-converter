import time
import socketio
from converter import FileConversionService

sio = socketio.Client(logger=True, engineio_logger=True)

@sio.event
def connect():
    print("Connected to Socket.IO server!")
    print(f"Session ID: {sio.sid}")

@sio.event
def connect_error(data):
    print(f"Connection error: {data}")

@sio.event
def disconnect():
    print("Disconnected from Socket.IO server")

@sio.on("file-to-conversion-queue")
def convertQueue(data):
    print("Event 'file-to-conversion-queue' triggered!")
    if not data:
        print("Error: No data received in the event.")
        return
    if not isinstance(data, dict):
        print(f"Error: Expected a dictionary, but received {type(data)}")
        return

    for file, status in data.items():
        if status == "awaiting":
            print(f"Converting file: {file}")
            # file_service = FileConversionService(sio)
            # file_service.convert_upload_file(file)
        else:
            print(f"Skipping file {file} with status: {status}")
    

def connect_socket():
    while True: 
        try:
            print("Connecting to Socket.IO server...")
            sio.connect('http://localhost:3000', transports=['websocket'])
            print("Connection successful!")
            break 
        except Exception as e:
            print(f"Socket.IO connection error: {str(e)}")
            print("Reconnecting in 1 second...")
            time.sleep(1)

connect_socket()

sio.wait()