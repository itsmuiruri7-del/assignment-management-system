import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { auth } from '../middleware/auth';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();
const prisma = new PrismaClient();

// Ensure upload directory exists
const uploadDir = path.join(process.cwd(), 'uploads', 'login-screens');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// Get all login screen images
router.get('/', async (req, res) => {
  try {
    const images = await prisma.loginScreenImage.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(images);
  } catch (error) {
    console.error('Error fetching login screen images:', error);
    res.status(500).json({ error: 'Failed to fetch login screen images' });
  }
});

// Get active login screen image
router.get('/active', async (req, res) => {
  try {
    const activeImage = await prisma.loginScreenImage.findFirst({
      where: { isActive: true }
    });
    res.json(activeImage);
  } catch (error) {
    console.error('Error fetching active login screen image:', error);
    res.status(500).json({ error: 'Failed to fetch active login screen image' });
  }
});

// Upload new login screen image (admin only)
router.post(
  '/',
  auth(['ADMIN']),
  upload.single('image'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No image file provided' });
      }

      const { name, description } = req.body;
      const imageUrl = `/uploads/login-screens/${req.file.filename}`;

      // If this is the first image, set it as active
      const imageCount = await prisma.loginScreenImage.count();
      const isActive = imageCount === 0;

      const newImage = await prisma.loginScreenImage.create({
        data: {
          name,
          description: description || '',
          imageUrl,
          isActive
        }
      });

      res.status(201).json(newImage);
    } catch (error) {
      console.error('Error uploading login screen image:', error);
      res.status(500).json({ error: 'Failed to upload login screen image' });
    }
  }
);

// Set active login screen image (admin only)
router.patch(
  '/:id/activate',
  auth(['ADMIN']),
  async (req, res) => {
    try {
      const { id } = req.params;

      // First, set all images to inactive
      await prisma.loginScreenImage.updateMany({
        where: { isActive: true },
        data: { isActive: false }
      });

      // Then set the selected image as active
      const updatedImage = await prisma.loginScreenImage.update({
        where: { id },
        data: { isActive: true }
      });

      res.json(updatedImage);
    } catch (error) {
      console.error('Error activating login screen image:', error);
      res.status(500).json({ error: 'Failed to activate login screen image' });
    }
  }
);

// Delete login screen image (admin only)
router.delete(
  '/:id',
  auth(['ADMIN']),
  async (req, res) => {
    try {
      const { id } = req.params;
      
      // Get the image to delete
      const image = await prisma.loginScreenImage.findUnique({ where: { id } });
      if (!image) {
        return res.status(404).json({ error: 'Image not found' });
      }

      // Delete the image file
      const filePath = path.join(process.cwd(), image.imageUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      // Delete the database record
      await prisma.loginScreenImage.delete({ where: { id } });

      // If the deleted image was active, set another one as active
      if (image.isActive) {
        const firstImage = await prisma.loginScreenImage.findFirst();
        if (firstImage) {
          await prisma.loginScreenImage.update({
            where: { id: firstImage.id },
            data: { isActive: true }
          });
        }
      }

      res.status(204).end();
    } catch (error) {
      console.error('Error deleting login screen image:', error);
      res.status(500).json({ error: 'Failed to delete login screen image' });
    }
  }
);

export default router;
