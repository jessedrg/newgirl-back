import { Controller } from '@nestjs/common';
import { GeneratedImagesService } from './generated-images.service';

@Controller('generated-images')
export class GeneratedImagesController {
  constructor(private readonly generatedImagesService: GeneratedImagesService) {}
}
