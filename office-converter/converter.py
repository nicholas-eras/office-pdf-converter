from fastapi import HTTPException
import subprocess
import os
from .s3Client import S3UploadService

class FileConversionService:
    def __init__(self):
        self.s3_service = S3UploadService()
        # self.sio = sio 

    def __convert_to_pdf(self, file_to_convert: str):
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

        # self.sio.emit('update-file-status', {'fileToConvert': file_to_convert, 'status': 'processing'})

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
                # self.sio.emit('update-file-status', {'fileToConvert': file_to_convert, 'status': 'done'})
                
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

    def convert_upload_file(self, fileName: str):
        try:
            download_result = self.s3_service.download_from_s3(fileName)
            s3_result = self.__convert_to_pdf(fileName)

            if os.path.exists(download_result["FilePath"]):
                os.remove(download_result["FilePath"])
            if os.path.exists(f"converted_files/{fileName}"):
                os.remove(f"converted_files/{fileName}")

            return {"status": "success", "s3_result": s3_result}

        except Exception as e:
            return {"status":"erro", "detail":str(e)}
            raise HTTPException(detail="Error in file conversion/upload process", status_code=500)