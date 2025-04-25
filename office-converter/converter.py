from fastapi import HTTPException
import subprocess, asyncio
import os
from .s3Client import S3UploadService
import socketio

class FileConversionService:
    def __init__(self, socketio_client):
        self.s3_service = S3UploadService()
        self.sio = socketio_client 

    async def __convert_to_pdf(self, file_to_convert: str, userId: int):
        output = file_to_convert[:file_to_convert.rfind(".")] + ".pdf"
        cmd = [
            'libreoffice', 
            '--headless', 
            '--convert-to', 
            'pdf', 
            f"converted_files/{file_to_convert}", 
            '--outdir', 
            "converted_files/"
        ]
        await self.sio.emit('update-file-status', {'fileToConvert': file_to_convert, 'status': 'processing', 'userId': userId})

        try:
            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            stdout, stderr = await process.communicate()

            if process.returncode != 0:
                raise HTTPException(status_code=500, detail="Erro na conversão")
            else:
                await self.sio.emit('update-file-status', {'fileToConvert': file_to_convert, 'status': 'done', 'userId': userId})
                
                with open(f"converted_files/{output}", 'rb') as pdf_file:
                    pdf_content = pdf_file.read()

                s3_result = self.s3_service.upload_file(pdf_content, output)

                if os.path.exists(f"converted_files/{file_to_convert}"):
                    os.remove(f"converted_files/{file_to_convert}")
                if os.path.exists(f"converted_files/{output}"):
                    os.remove(f"converted_files/{output}")

                return s3_result

        except Exception as e:
            print(e)
            raise HTTPException(detail="Server error conversion", status_code=500)

    async def convert_upload_file(self, fileName: str, userId: int):
        try:
            download_result = self.s3_service.download_from_s3(fileName)
            s3_result = await self.__convert_to_pdf(fileName, userId)

            if os.path.exists(download_result["FilePath"]):
                os.remove(download_result["FilePath"])
            if os.path.exists(f"converted_files/{fileName}"):
                os.remove(f"converted_files/{fileName}")

            return {"status": "success", "s3_result": s3_result}

        except Exception as e:
            raise HTTPException(detail="Error in file conversion/upload process", status_code=500)