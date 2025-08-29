import { Module } from '@nestjs/common';
import { GeneratedImagesController } from './generated-images.controller';
import { GeneratedImagesService } from './generated-images.service';

@Module({
  controllers: [GeneratedImagesController],
  providers: [GeneratedImagesService],
  exports: [GeneratedImagesService],
})
export class GeneratedImagesModule {}
