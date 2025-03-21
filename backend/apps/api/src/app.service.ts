import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { S3 } from '@aws-sdk/client-s3';
import { 
  PutObjectCommand, 
  PutObjectCommandInput,
  ObjectCannedACL, GetObjectCommand, DeleteObjectCommand
} from '@aws-sdk/client-s3';
import { STS } from '@aws-sdk/client-sts';
import { GetCallerIdentityCommand } from '@aws-sdk/client-sts';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { PrismaService } from '../../../prisma/prisma.service';
import { Readable } from 'stream';
import { Response } from 'express';
import { RedisService } from './redis/redis.service';
import { ColoredLogger } from './utils/colored-logger';

@Injectable()
export class AppService {
  private readonly logger = new ColoredLogger("External Connection");

  private readonly s3: S3;
  private readonly sts: STS;

  constructor(
    private readonly redisClient: RedisService, 
    private readonly prismaService: PrismaService,
  ) {
    const credentials = {
      accessKeyId: process.env.AWS_S3_ACCESS_KEY,
      secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY,
    };

    this.s3 = new S3({
      credentials,
      region: process.env.AWS_REGION,
    });

    this.sts = new STS({
      credentials,
      region: process.env.AWS_REGION,
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
        process.env.AWS_S3_BUCKET,
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
      await this.s3.send(new PutObjectCommand(params));

      const location = `https://${bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${name}`;

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
    if (await this.redisClient.isLimitReached(user.userId)){
      throw new UnauthorizedException("User limit reached, try again tomorrow");
    }

    await this.redisClient.set(
      user.userId.toString(),
      (+(await this.redisClient.get(user.userId.toString())) - 1).toString(),
      24*60*60
    );

    if (await this.filesUploadLimitReached()){
      throw new UnauthorizedException("Não permitido por hj");
    }

    await this.saveFileOnDatabase(filename, user.userId);    

    const command = new PutObjectCommand({ Bucket: process.env.AWS_S3_BUCKET, Key: filename, ContentType: contentType });
    return { "url": await getSignedUrl(this.s3, command, { expiresIn: 60 }) };
  }

  private async filesUploadLimitReached():Promise<boolean>{
    const numberFiles = await this.prismaService.file.count();
    return +numberFiles >= 30;
  }

  async getFileS3(filename: string, res: Response, user: {userId: number, username: string}) {
    const fileExtension = filename.slice(filename.indexOf("."));
    
    
    const fileId = fileExtension != ".pdf" ?  await (await this.prismaService.file.findUnique({
      where: {
        fileName: filename
      }
    })).id : await (await this.prismaService.convertedFile.findUnique({
        where: {
          fileName: filename
        }
      })).fileId;  

    if (!fileId) {
      throw new NotFoundException("file not on database");
    }

    if (!(await this.prismaService.userFile.findUnique({
      where: {
        userId_fileId: {
          userId: user.userId,
          fileId: fileId
        }
      }
    }))) {
      throw new UnauthorizedException("This file doesn't belong to you");
    }

    const command = new GetObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: filename,
    });
    const s3res = await this.s3.send(command);

    res.set({
      'Content-Type': s3res.ContentType || 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${filename}"`,
    });

    (s3res.Body as Readable).pipe(res as unknown as NodeJS.WritableStream);
  }

  private async saveFileOnDatabase(filename: string, userId: number): Promise<void> {
    const fileDatabase = await this.prismaService.file.create({
      data: {
        fileExtension: filename.slice(filename.lastIndexOf(".")),
        fileName: filename,
        status: "awaiting",
      }
    });

    await this.prismaService.userFile.create({
      data: {
        userId: userId,
        fileId: fileDatabase.id
      }
    });
  }

  async deleteFileS3(filename: string) {
    const command = new DeleteObjectCommand({ Bucket: process.env.AWS_S3_BUCKET, Key: filename });
    const s3res = await this.s3.send(command);
    return s3res;
  }
}
