from io import BytesIO
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

async def convert_to_pdf(file_to_convert: str, output: str):
    cmd = ['libreoffice', '--headless', '--convert-to', 'pdf', file_to_convert, '--outdir', "converted_files/"]

    sio.emit('update-file-status', {'fileToConvert': file_to_convert, 'status': 'processing'})

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
            sio.emit('update-file-status', {'fileToConvert': file_to_convert, 'status': 'done'})
            
            with open("converted_files/" + output, 'rb') as pdf_file:
                pdf_content = pdf_file.read()
            
            upload_file = UploadFile(
                filename=output, 
                file=BytesIO(pdf_content), 
                content_type='application/pdf'
            )

            s3_service = S3UploadService()

            return await s3_service.upload_file(upload_file)
    
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
    store_file = "converted_files/" + temp_file_path
    if os.path.exists(f"{os.getcwd()}/{output}"):
        raise HTTPException(status_code=404, detail="Arquivo já convertido.")

    try:
        contents = await file.read()
        with open(temp_file_path, "wb") as f:
            f.write(contents)

        with open(store_file, "wb") as f:
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

class S3UploadService:
    def __init__(self):
        self.AWS_S3_BUCKET = 'office-conversion-files'
        self.AWS_REGION = 'us-east-2'
        
        self.s3_client = boto3.client(
            's3',
            aws_access_key_id=os.getenv('AWS_S3_ACCESS_KEY'),
            aws_secret_access_key=os.getenv('AWS_S3_SECRET_ACCESS_KEY'),
            region_name=self.AWS_REGION
        )

    async def upload_file(self, file: UploadFile):
        try:
            file_content = await file.read()
            
            return await self.s3_upload(
                file=file_content, 
                bucket=self.AWS_S3_BUCKET, 
                name=file.filename, 
                mimetype=file.content_type
            )
        except Exception as error:
            print(f"Failed to upload file {file.filename}: {error}")
            raise

    async def s3_upload(
        self, 
        file: bytes, 
        bucket: str, 
        name: str, 
        mimetype: str
    ):

        try:
            self.s3_client.put_object(
                Bucket=bucket,
                Key=name,
                Body=file,
                ContentType=mimetype,
                ACL='public-read',
                ContentDisposition='inline'
            )

            location = f"https://{bucket}.s3.{self.AWS_REGION}.amazonaws.com/{name}"
            
            return {
                "Location": location,
                "Key": name,
                "Bucket": bucket
            }
        except Exception as error:
            print(f"S3 upload failed: {error}")
            raise