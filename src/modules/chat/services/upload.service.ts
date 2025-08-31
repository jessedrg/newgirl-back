import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UploadService {
  private s3Client: S3Client;
  private bucketName = 'newgirl';
  private region = 'sfo3';
  private endpoint = 'https://sfo3.digitaloceanspaces.com';

  constructor(private configService: ConfigService) {
    this.s3Client = new S3Client({
      endpoint: this.endpoint,
      region: this.region,
      credentials: {
        accessKeyId: this.configService.get<string>('DO_SPACES_ACCESS_KEY') || '',
        secretAccessKey: this.configService.get<string>('DO_SPACES_SECRET_KEY') || '',
      },
      forcePathStyle: false, // DigitalOcean Spaces uses virtual-hosted-style URLs
    });
  }

  async uploadFile(
    file: any,
    folder: 'images' | 'audio',
    userId: string
  ): Promise<string> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Validate file type
    if (folder === 'images') {
      const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedImageTypes.includes(file.mimetype)) {
        throw new BadRequestException('Invalid image file type. Allowed: JPEG, PNG, GIF, WebP');
      }
    } else if (folder === 'audio') {
      const allowedAudioTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/webm', 'audio/m4a'];
      if (!allowedAudioTypes.includes(file.mimetype)) {
        throw new BadRequestException('Invalid audio file type. Allowed: MP3, WAV, OGG, WebM, M4A');
      }
    }

    // Validate file size (10MB max for images, 50MB max for audio)
    const maxSize = folder === 'images' ? 10 * 1024 * 1024 : 50 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new BadRequestException(`File too large. Max size: ${maxSize / (1024 * 1024)}MB`);
    }

    // Generate unique filename
    const fileExtension = file.originalname.split('.').pop();
    const fileName = `${folder}/${userId}/${uuidv4()}.${fileExtension}`;

    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: fileName,
        Body: file.buffer,
        ContentType: file.mimetype,
        ACL: 'public-read', // Make files publicly accessible
        CacheControl: 'max-age=31536000', // Cache for 1 year
      });

      await this.s3Client.send(command);

      // Return the public URL
      const publicUrl = `https://${this.bucketName}.${this.region}.digitaloceanspaces.com/${fileName}`;
      return publicUrl;
    } catch (error) {
      console.error('Error uploading file to DigitalOcean Spaces:', error);
      throw new BadRequestException('Failed to upload file');
    }
  }

  async uploadImage(file: any, userId: string): Promise<string> {
    return this.uploadFile(file, 'images', userId);
  }

  async uploadAudio(file: any, userId: string): Promise<string> {
    return this.uploadFile(file, 'audio', userId);
  }
}
