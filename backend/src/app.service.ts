import { Injectable, Logger } from '@nestjs/common';
import { GetObjectCommand, S3 } from '@aws-sdk/client-s3';
import { 
  PutObjectCommand, 
  PutObjectCommandInput,
  ObjectCannedACL 
} from '@aws-sdk/client-s3';
import { STS } from '@aws-sdk/client-sts';
import { GetCallerIdentityCommand } from '@aws-sdk/client-sts';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

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

  async PreSignedUrlS3() {
    const command = new PutObjectCommand({ Bucket: this.AWS_S3_BUCKET, Key: process.env.AWS_S3_SECRET_ACCESS_KEY });
    return getSignedUrl(this.s3, command, { expiresIn: 60 });
  };  
}