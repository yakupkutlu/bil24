import { Injectable, Logger } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';

@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);

  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME ?? 'dkpfihtw5',
      api_key: process.env.CLOUDINARY_API_KEY ?? '123643813385694',
      api_secret: process.env.CLOUDINARY_API_SECRET ?? '9G5_S4_8NaXAU3CeMEcpUAYhSt4',
    });
  }

  async uploadBuffer(buffer: Buffer, folder: string, publicId?: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const opts: any = { folder, resource_type: 'image' };
      if (publicId) opts.public_id = publicId;
      cloudinary.uploader.upload_stream(opts, (err, result) => {
        if (err) { this.logger.error('Cloudinary upload error', err); reject(err); return; }
        resolve(result!.secure_url);
      }).end(buffer);
    });
  }

  async deleteFile(publicId: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (err) {
      this.logger.error('Cloudinary delete error', err);
    }
  }
}

import { Module } from '@nestjs/common';
@Module({ providers: [CloudinaryService], exports: [CloudinaryService] })
export class CloudinaryModule {}
