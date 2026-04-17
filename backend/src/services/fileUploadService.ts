import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { config } from '../config/env';

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Profile images directory
const profileDir = path.join(uploadsDir, 'profile');
if (!fs.existsSync(profileDir)) {
  fs.mkdirSync(profileDir, { recursive: true });
}

// Storage configuration for profile images
const profileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, profileDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: timestamp + original name
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

// File filter for images only
const imageFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'));
  }
};

// Multer upload instance for profile images
export const profileUpload = multer({
  storage: profileStorage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Helper function to get full image URL
export const getImageUrl = (filename: string | null | undefined): string | null => {
  if (!filename) return null;
  if (filename.startsWith('http')) return filename;
  const normalized = filename.startsWith('/') ? filename : `/${filename}`;
  if (normalized.startsWith('/uploads')) {
    return `${config.baseUrl}${normalized}`;
  }
  if (normalized.startsWith('/profile')) {
    return `${config.baseUrl}/uploads${normalized}`;
  }
  return `${config.baseUrl}/uploads/profile${normalized}`;
};

// Helper function to delete old image file
export const deleteImageFile = (filename: string): void => {
  if (!filename) return;
  const filePath = path.join(profileDir, filename);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};