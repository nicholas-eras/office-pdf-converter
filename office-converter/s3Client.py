import os
import boto3

class S3UploadService:
    def __init__(self):
        self.AWS_S3_BUCKET = 'office-conversion-files'
        self.AWS_REGION = 'us-east-2'
        
        self.aws_access_key = os.getenv('AWS_S3_ACCESS_KEY')
        self.aws_secret_key = os.getenv('AWS_S3_SECRET_ACCESS_KEY')

        self.s3_client = boto3.client(
            's3',
            aws_access_key_id=self.aws_access_key,
            aws_secret_access_key=self.aws_secret_key,
            region_name=self.AWS_REGION
        )

    def upload_file(self, file: bytes, fileName: str):
        try:            
            return self.s3_upload(
                file=file, 
                bucket=self.AWS_S3_BUCKET, 
                name=fileName, 
                mimetype="application/pdf"
            )
        except Exception as error:
            print(f"Failed to upload file {fileName}: {error}")
            raise

    def s3_upload(self, file: bytes, bucket: str, name: str, mimetype: str):
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

    def download_from_s3(self, key: str):
        try:
            response = self.s3_client.get_object(Bucket=self.AWS_S3_BUCKET, Key=key)
            file_content = response['Body'].read()

            current_dir = os.path.dirname(os.path.abspath(__file__))
            converted_files_dir = os.path.join(current_dir, "converted_files")

            os.makedirs(converted_files_dir, exist_ok=True)

            file_path = os.path.join(converted_files_dir, os.path.basename(key))

            with open(file_path, "wb") as file:
                file.write(file_content)

            return {
                "FilePath": file_path,
                "Key": key,
                "Bucket": self.AWS_S3_BUCKET
            }
        except Exception as error:
            print(f"Failed to download from S3: {error}")
            raise
