import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { BadRequestException } from '@nestjs/common';
import { memoryStorage } from 'multer';

export const multerConfig: MulterOptions = {
  storage: memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp|avif|heic|heif|tiff|bmp)$/i)) {
      return cb(
        new BadRequestException('Only image files are allowed (e.g. JPG, PNG, WebP, AVIF)!'),
        false,
      );
    }
    if (!file.mimetype.match(/^image\//i)) {
      return cb(new BadRequestException('Invalid file type! Use image files.'), false);
    }
    cb(null, true);
  },
};
