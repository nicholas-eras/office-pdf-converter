from fastapi import FastAPI, HTTPException, UploadFile
from pydantic import BaseModel
import os
import subprocess
from threading import Thread
import socketio

app = FastAPI()
sio = socketio.Client(logger = True)

def connect_socket():
    try:
        print("Connecting to Socket.IO server...")
        sio.connect('http://localhost:3000', 
                   transports=['websocket'])
        
        @sio.event
        def connect():
            print("Connected to Socket.IO server!")
            
        @sio.event
        def connect_error(data):
            print(f"Connection error: {data}")
            
        @sio.event
        def disconnect():
            print("Disconnected from Socket.IO server")
            
    except Exception as e:
        print(f"Socket.IO connection error: {str(e)}")
connect_socket()

class FileRequest(BaseModel):
    fileName: str
    mimeType: str

def convert_to_pdf(file_to_convert: str, output: str):
    cmd = ['libreoffice', '--headless', '--convert-to', 'pdf', file_to_convert ,'--outdir', "converted_files/"]
    sio.emit('update-file-status', {'fileToConvert': output, 'status':'processing'})        

    try:
        process = subprocess.run(
            cmd,
            timeout=30,
            capture_output=True,
            text=True
        )
        if process.returncode != 0:
            raise HTTPException(detail="Server error", status_code=500)
        else:
            sio.emit('update-file-status', {'fileToConvert': output, 'status':'done'})    
    except Exception as e:
        print(e)
        raise HTTPException(detail="Server error", status_code=500)
    
    finally:        
        if os.path.exists(file_to_convert):
            os.remove(file_to_convert)

@app.post("/convert-file/")
async def convert_file(file: UploadFile):
    fileName = file.filename[:file.filename.rfind('.')]
    output = f"{fileName}.pdf"
    temp_file_path = f"temp_{file.filename}"

    if os.path.exists(f"{os.getcwd()}/{output}"):
        raise HTTPException(status_code=404, detail="Arquivo já convertido.")    

    try:
        contents = await file.read()
        with open(temp_file_path, "wb") as f:
            f.write(contents)
            
        if sio.connected:
            sio.emit('upload-file-to-conversion', {'fileToConvert': output})        
            Thread(target=convert_to_pdf, args=(temp_file_path, output)).start()
            return {"message": f"File {output} is in queue for conversion."}
        else:
            os.remove(temp_file_path)
            raise HTTPException(detail="Server error", status_code=500)
            
    except Exception as e:
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)
        raise HTTPException(status_code=500, detail=str(e))
    finally:        
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)