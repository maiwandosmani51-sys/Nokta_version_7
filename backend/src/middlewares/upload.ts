import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { Request } from 'express';

function ensureUploadDirectory(subfolder: string) {
  const uploadDirectory = path.join(process.cwd(), 'uploads', subfolder);
  if (!fs.existsSync(uploadDirectory)) {
    fs.mkdirSync(uploadDirectory, { recursive: true });
  }
  return uploadDirectory;
}

function createStorage(subfolder: string) {
  return multer.diskStorage({
    destination: (_req: Request, _file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
      cb(null, ensureUploadDirectory(subfolder));
    },
    filename: (_req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
      const timestamp = Date.now();
      const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
      cb(null, `${timestamp}-${safeName}`);
    }
  });
}

function createImageUpload(subfolder: string) {
  return multer({
    storage: createStorage(subfolder),
    limits: {
      fileSize: 5 * 1024 * 1024
    },
    fileFilter: (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.'));
      }
    }
  });
}

export const profileUpload = createImageUpload('profile');
export const notificationUpload = createImageUpload('notifications');
