from fastapi import FastAPI, HTTPException, UploadFile, Depends
from pydantic import BaseModel
import os
import subprocess
from threading import Thread
import socketio
from sqlalchemy import create_engine, Column, Integer, String, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from datetime import datetime

app = FastAPI()
sio = socketio.Client(logger=True)

DATABASE_URL = "postgresql://postgres:postgres2024@172.19.0.2:5432/files_storage"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class ConvertedFile(Base):
    __tablename__ = "ConvertedFile"
    id = Column(Integer, primary_key=True, index=True)
    fileName = Column(String, index=True)
    fileId = Column(String)    
    createdAt = Column(DateTime, default=datetime.utcnow) 

Base.metadata.create_all(bind=engine)

def connect_socket():
    try:
        print("Connecting to Socket.IO server...")
        sio.connect('http://localhost:3000', transports=['websocket'])

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
    cmd = ['libreoffice', '--headless', '--convert-to', 'pdf', file_to_convert, '--outdir', "converted_files/"]
    sio.emit('update-file-status', {'fileToConvert': output, 'status': 'processing'})

    try:
        process = subprocess.run(
            cmd,
            timeout=30,
            capture_output=True,
            text=True
        )

        if process.stderr != '':
            print(process)
            raise HTTPException(detail="Server error process", status_code=500)
        else:
            sio.emit('update-file-status', {'fileToConvert': output, 'status': 'done'})
    except Exception as e:
        print(e)
        raise HTTPException(detail="Server error conversion", status_code=500)
    
    finally:
        if os.path.exists(file_to_convert):
            os.remove(file_to_convert)

@app.post("/convert-file/{item_id}")
async def convert_file(item_id: int, file: UploadFile, db: Session = Depends(get_db)):
    fileName = file.filename[:file.filename.rfind('.')]
    file_extension = file.filename[file.filename.rfind("."):]
    output = f"{fileName}.pdf"
    temp_file_path = f"{file.filename}"

    if os.path.exists(f"{os.getcwd()}/{output}"):
        raise HTTPException(status_code=404, detail="Arquivo já convertido.")

    try:
        contents = await file.read()
        with open(temp_file_path, "wb") as f:
            f.write(contents)

        if sio.connected:
            sio.emit('upload-file-to-conversion', {'fileToConvert': output})
            Thread(target=convert_to_pdf, args=(temp_file_path, output)).start()
            
            new_item = ConvertedFile(
                fileName= output,
                fileId= item_id,
            )
            db.add(new_item)
            db.commit()
            db.refresh(new_item)
            
            return {"message": f"File {output} is in queue for conversion."}
        else:
            print(sio.connected)
            os.remove(temp_file_path)
            raise HTTPException(detail="Server error socket", status_code=500)

    except Exception as e:
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)
        raise HTTPException(status_code=500, detail=str(e))
