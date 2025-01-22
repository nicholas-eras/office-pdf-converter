import { Injectable, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { S3 } from '@aws-sdk/client-s3';
import { 
  PutObjectCommand, 
  PutObjectCommandInput,
  ObjectCannedACL, GetObjectCommand
} from '@aws-sdk/client-s3';
import { STS } from '@aws-sdk/client-sts';
import { GetCallerIdentityCommand } from '@aws-sdk/client-sts';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { PrismaService } from 'prisma/prisma.service';
import { Readable } from 'stream';
import { Response } from 'express'

@Injectable()
export class AppService {
  private readonly AWS_S3_BUCKET = 'office-conversion-files';
  private readonly AWS_REGION = 'us-east-2';
  private readonly logger = new Logger("External Connection");
  
  private readonly s3: S3;
  private readonly sts: STS;

  constructor() {
    const credentials = {
      accessKeyId: process.env.AWS_S3_ACCESS_KEY,
      secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY,
    };

    this.s3 = new S3({
      credentials,
      region: this.AWS_REGION,
    });

    this.sts = new STS({
      credentials,
      region: this.AWS_REGION,
    });    
  }

  async uploadFile(file: {
    buffer: Buffer;
    mimetype: string;
    originalname: string;
  }): Promise<{
    Location: string;
    Key: string;
    Bucket: string;
  }> {
    try {
      return await this.s3Upload(
        file.buffer,
        this.AWS_S3_BUCKET,
        file.originalname,
        file.mimetype,
      );
    } catch (error) {
      this.logger.error(`Failed to upload file ${file.originalname}:`, error);
      throw new Error(`File upload failed: ${error.message}`);
    }
  }

  private async s3Upload(
    file: Buffer,
    bucket: string,
    name: string,
    mimetype: string,
  ) {
    const params: PutObjectCommandInput = {
      Bucket: bucket,
      Key: name,
      Body: file,
      ACL: ObjectCannedACL.public_read,
      ContentType: mimetype,
      ContentDisposition: 'inline',
    };

    try {
      const result = await this.s3.send(new PutObjectCommand(params));
      
      const location = `https://${bucket}.s3.${this.AWS_REGION}.amazonaws.com/${name}`;
      
      return {
        Location: location,
        Key: name,
        Bucket: bucket,
      };
    } catch (error) {
      this.logger.error('S3 upload failed:', error);
      throw error;
    }
  }

  async verifyCredentials(): Promise<void> {
    try {
      const identity = await this.sts.send(new GetCallerIdentityCommand({}));
      this.logger.log(`AWS connected: ${identity.Account}`);
    } catch (error) {
      this.logger.error('Invalid AWS credentials:', error);
      throw new Error('Invalid AWS credentials');
    }
  }

  async PreSignedUrlS3(filename: string, contentType: string, user: {userId: number, username: string}) {
    await this.saveFileOnDatabase(filename, user.userId);
    const command = new PutObjectCommand({ Bucket: this.AWS_S3_BUCKET, Key: filename, ContentType: contentType });
    return {"url": await getSignedUrl(this.s3, command, { expiresIn: 60 })};
  };  

  async getFileS3(filename: string, res: Response,  user: {userId: number, username: string}) {
    const prisma = new PrismaService();
    const file = await prisma.file.findUnique({
      where:{
        fileName: filename
      }
    });
    
    if (!file){
      throw new NotFoundException("file not on database");
    }
    
    if (!(await prisma.userFile.findUnique({
      where:{
        userId_fileId:{
          userId: user.userId,
          fileId: file.id
        }
      }
    }))){
      throw new UnauthorizedException("This file doesnt belongs to you");
    }

    const command = new GetObjectCommand({
      Bucket: this.AWS_S3_BUCKET,
      Key: filename,
    });
    const s3res = await this.s3.send(command);    

    res.set({
      'Content-Type': s3res.ContentType || 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${filename}"`,
    });

    (s3res.Body as Readable).pipe(res as unknown as NodeJS.WritableStream);
  };  

  private async saveFileOnDatabase(filename: string, userId: number): Promise<void>{
    const prisma = new PrismaService();
    
    const fileDatabase = await prisma.file.create({
      data:{
        fileExtension: filename.slice(filename.lastIndexOf(".")),
        fileName: filename,
        status: "awaiting",
      }
    });

    await prisma.userFile.create({
      data:{
        userId: userId,
        fileId: fileDatabase.id
      }
    });
  }
}